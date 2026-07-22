import React, { useState, useEffect, useRef, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { GEMEENTEN as FALLBACK_GEMEENTEN, calcWijk, YEARS, slimLadenExtraRuimte } from './gemeenteData';
import GemeenteOnboarding from './components/GemeenteOnboarding';
import GemeenteEditor from './components/GemeenteEditor';
import { getAlleGemeenten, getGemeente, slaGemeenteOp, verwijderGemeente, checkHealth, onboardGemeenteGeo, getSectoren, syncWijkenVanStatbel, getLaadpalen } from './api';
import Dashboard from './Dashboard';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl:'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl:'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const C = {
  darkBg:'#0d1c22', panelBg:'#122028', border:'#1e3a46',
  teal:'#9EC5CB', tealDark:'#2B5F6E', green:'#B7D2AE',
  darkGreen:'#3A6B4A', gold:'#D0AC41', warn:'#E8683A',
  text:'#e0eef2', textMid:'#7aacb4', textDim:'#3a6a74',
  red:'#E8683A',
};

// Kleur relatief tov de laagste/hoogste waarde binnen de huidige gemeente,
// zodat er altijd zichtbare spreiding is, ongeacht gemeentegrootte of
// scenario (zie overleg over Gent die overal rood kleurde bij een vaste
// drempel van 30).
function kwantielKleur(waarde, alleWaarden) {
  const relevant = alleWaarden.filter(v => Number.isFinite(v));
  if (!relevant.length) return '#7BB8C4';
  const min = Math.min(...relevant);
  const max = Math.max(...relevant);
  if (max === min) return '#A8D96B'; // alles gelijk -> neutraal, geen kunstmatig onderscheid
  const positie = (waarde - min) / (max - min);
  if (positie <= 0)     return '#7BB8C4'; // laagste = blauw
  if (positie <= 0.25)  return '#A8D96B'; // groen
  if (positie <= 0.5)   return '#F0C030'; // geel
  if (positie <= 0.75)  return '#2E9E55'; // donkergroen
  return '#D94030';                        // hoogste = rood
}

function makeIcon(color, size=12) {
  return L.divIcon({
    className:'',
    html:`<div style="width:${size}px;height:${size}px;border-radius:50%;background:${color};border:2px solid white;box-shadow:0 0 0 1px ${color},0 2px 4px rgba(0,0,0,0.35)"></div>`,
    iconSize:[size,size], iconAnchor:[size/2,size/2],
  });
}

function makeBestaandIcon(type, count = 1) {
  const configs = {
    ac:      { color:'#1a6e30', bg:'#27ae60', size:16 },
    dc:      { color:'#922b21', bg:'#e74c3c', size:18 },
    hpc:     { color:'#6c3483', bg:'#9b59b6', size:20 },
    default: { color:'#1a5276', bg:'#2980b9', size:16 },
  };
  const cfg = configs[type] || configs.default;
  const badge = count > 1
    ? `<div style="
        position:absolute; top:-6px; right:-6px;
        min-width:15px; height:15px; padding:0 3px; border-radius:8px;
        background:#1a2830; border:1.5px solid white;
        color:#fff; font-size:9px; font-weight:800; line-height:12px; text-align:center;
      ">${count}</div>`
    : '';
  return L.divIcon({
    className:'',
    html:`<div style="position:relative;width:${cfg.size}px;height:${cfg.size}px;">
      <div style="
        width:${cfg.size}px;height:${cfg.size}px;border-radius:50%;
        background:${cfg.bg};
        border:3px solid white;
        outline:2px solid ${cfg.color};
        box-shadow:0 2px 6px rgba(0,0,0,0.5);
      "></div>${badge}</div>`,
    iconSize:[cfg.size,cfg.size],
    iconAnchor:[cfg.size/2,cfg.size/2],
  });
}

export default function AppWithOnboarding() {
  // ── API / DB state ─────────────────────────────────────────────────
  const [gemeenten,       setGemeenten]      = useState(FALLBACK_GEMEENTEN);
  const [dbStatus,        setDbStatus]       = useState('laden'); // laden | online | offline
  const [apiError,        setApiError]       = useState('');
  const [saving,          setSaving]         = useState(false);

  // ── UI state ───────────────────────────────────────────────────────
  const [gemId,           setGemId]          = useState('leuven');
  const [showDashboard,   setShowDashboard]  = useState(true);  // Start op dashboard
  const [showOnboarding,  setShowOnboarding] = useState(false);
  const [showDelete,      setShowDelete]     = useState(false);
  const [showEditor,      setShowEditor]     = useState(false);
  const sectorenRef      = useRef(null);
  const [sectorenGeladen, setSectorenGeladen] = useState(0);
  const [ongematcht,      setOngematcht]     = useState(0);
  const [showOverzicht,   setShowOverzicht]  = useState(false);

  // ── Simulator state ────────────────────────────────────────────────
  const [year,            setYear]              = useState(2030);
  const [privePctOverride,setPrivePctOverride]   = useState(null); // null = gebruik berekend privePctBerekend
  const [redundantieMarge,setRedundantieMarge]   = useState(0.10);
  const [huidigLP,        setHuidigLP]       = useState(0);
  const [trends,          setTrends]         = useState({ carshare:false, v2g:false, pv:false, slim:false });
  const [selectedWijk,    setSelectedWijk]   = useState(null);
  const [existingPalen,   setExistingPalen]  = useState([]);
  const [loadingPalen,    setLoadingPalen]   = useState(false);
  const [chartTab,        setChartTab]       = useState('lp');

  const mapRef        = useRef(null);
  const mapInstance   = useRef(null);
  const wijkLayerRef  = useRef(null);
  const projLayerRef  = useRef(null);
  const existLayerRef = useRef(null);

  const gemeente = gemeenten[gemId] || Object.values(gemeenten)[0];

  // ── Trendcorrectie ─────────────────────────────────────────────────
  // Car sharing, V2G en Energiedelen PV hebben nog geen onderbouwd effect
  // (zie Leeswijzer/Validatie Overzicht) en staan daarom nog zonder effect
  // op de berekening, in plaats van met een verzonnen percentage. Slim
  // laden heeft een eigen, gebronneerd mechanisme (zie calcWijk in
  // gemeenteData.js: kleine energiecorrectie + aparte "ruimte voor extra
  // laadpunten"-metric), en loopt dus niet meer via deze generieke factor.
  const trendFactor = 1.0;

  // calcParams: privePctOverride blijft de vroegere "% publiek laden"-schuifknop,
  // nu als bewuste override op het berekende privePctBerekend van de gemeente
  // (zie gemeenteData.js). Leeg (null) laten = het berekende cijfer gebruiken.
  const calcParams = {
    year,
    welvaartsindexGemeente: gemeente?.welvaartsindex,
    evAandeelOverride: gemeente?.evAandeelOverride?.[year] ?? null,
    privePct: gemeente?.privePctBerekend,
    privePctOverride: privePctOverride,
    redundantieMarge,
    trendFactor,
    slimLaden: trends.slim,
  };

  // ── Bestaande laadpunten toewijzen aan dichtstbijzijnde wijk ────────
  // (zelfde dichtstbijzijnde-centroïde-methode als de sector-koppeling
  // op de backend, hier client-side omdat existingPalen live via MOW
  // wordt opgehaald en niet in de database staat)
  // Per wijk, per type (AC/DC/HPC), MOW-conform gewogen: elk publiek
  // laadpunt telt voor 100%, elk semi-publiek laadpunt voor 50% mee
  // (Bijlage 11: "aangezien ze niet permanent beschikbaar zijn").
  const leegType = () => ({ AC: 0, DC: 0, HPC: 0 });
  const bestaandPerWijk = {};
  (gemeente?.wijken || []).forEach(w => { bestaandPerWijk[w.id] = leegType(); });
  existingPalen.forEach(el => {
    const lat = el.lat ?? el.center?.lat;
    const lng = el.lon ?? el.center?.lon;
    if (lat == null || lng == null) return;
    let beste = null, besteAfstand = Infinity;
    (gemeente?.wijken || []).forEach(w => {
      if (w.lat == null || w.lng == null) return;
      const d = Math.hypot(w.lat - lat, w.lng - lng);
      if (d < besteAfstand) { besteAfstand = d; beste = w; }
    });
    if (!beste) return;
    const t = el.tags || {};
    const type = t.mow_snelheid === 'ultrasnel' ? 'HPC' : t.mow_snelheid === 'snel' ? 'DC' : 'AC';
    const gewicht = t.mow_toegankelijkheid === 'semi-publiek' ? 0.5 : 1;
    bestaandPerWijk[beste.id][type] += gewicht;
  });
  // Optelling per type, voor de bestaand-tegels/labels elders in de app
  const bestaandTotaalPerType = Object.values(bestaandPerWijk).reduce((s, b) => ({
    AC: s.AC + b.AC, DC: s.DC + b.DC, HPC: s.HPC + b.HPC,
  }), leegType());

  // CAPEX per laadtype (per laadpunt/socket, niet per paal):
  // - AC: gevalideerd door de gebruiker obv actuele marktprijzen (hardware,
  //   netaansluiting, installatie), reële kost ca. €8.000/paal (2 laadpunten),
  //   hier op €9.000/paal (€4.500/laadpunt) gehouden als bewuste marge voor
  //   prijsinflatie de komende jaren.
  // - DC en HPC: nog NIET apart gevalideerd, herverdeling van oudere,
  //   ongecontroleerde prijsstelling (zie Leeswijzer), moet nog getoetst.
  const CAPEX_V2 = { AC: 4500, DC: 29000, HPC: 82000 };

  // ── Bereken wijken ─────────────────────────────────────────────────
  const wijkResults = (gemeente?.wijken || []).map(w => {
    const data = calcWijk(w, calcParams);
    const bestaand = bestaandPerWijk[w.id] || leegType();
    const delta = {
      AC:  Math.max(0, data.totAC  - bestaand.AC),
      DC:  Math.max(0, data.totDC  - bestaand.DC),
      HPC: Math.max(0, data.totHPC - bestaand.HPC),
    };
    const capex = delta.AC*CAPEX_V2.AC + delta.DC*CAPEX_V2.DC + delta.HPC*CAPEX_V2.HPC;
    return { wijk:w, data:{ ...data, bestaand, delta, capex,
      deltaTotaal: delta.AC + delta.DC + delta.HPC } };
  });
  const alleDeltas = wijkResults.map(r => r.data.deltaTotaal);
  const totLP       = wijkResults.reduce((s,r)=>s+r.data.totLP,0);
  const totMwh      = wijkResults.reduce((s,r)=>s+r.data.totMwh,0);
  const totBestaand = wijkResults.reduce((s,r)=>s+r.data.bestaand.AC+r.data.bestaand.DC+r.data.bestaand.HPC,0);
  // Bijkomend (stadsbreed) = optelling van wat elke wijk zelf al, per type,
  // nooit-negatief aangeeft nodig te hebben (dezelfde .delta als hieronder
  // voor de kaartkleur/tooltips/wijktabel). Bewust GEEN aparte, stadsbrede
  // netto-berekening (totLP - totBestaand), want dan kan een overschot in
  // de ene wijk een tekort in een andere wijk verbergen, terwijl bestaande
  // infrastructuur in wijk A een tekort in wijk B niet kan oplossen.
  // "Gepland te installeren" is specifiek AC (zie invoerveld), dus mag ook
  // alleen het AC-deel van bijkomend/CAPEX verminderen, niet DC/HPC.
  const totDeltaAC     = wijkResults.reduce((s,r)=>s+r.data.delta.AC,0);
  const totDeltaOverig = wijkResults.reduce((s,r)=>s+r.data.delta.DC+r.data.delta.HPC,0);
  const acNaGepland     = Math.max(0, totDeltaAC - huidigLP);
  const geplandAangerekend = Math.min(huidigLP, totDeltaAC); // kan niet meer korten dan er AC-tekort is
  const bijkomend = acNaGepland + totDeltaOverig;
  // CAPEX-tegel: rechtstreekse optelling van de bouwkost van precies het
  // bijkomende deel, per wijk en per laadtype (delta.AC/DC/HPC), niet een
  // ratio-schatting op basis van bruto-totalen. Die ratio-aanpak gaf een
  // sterk vertekend (te laag) beeld zodra bijkomend << totLP (bijvoorbeeld
  // omdat een deel van de stad al ruim voldoende infrastructuur heeft),
  // want dan schaalde hij de hele stadsbrede bouwkost mee naar beneden,
  // ook voor wijken die wel degelijk een fors tekort hebben. De AC-kost van
  // "gepland te installeren" wordt er hier ook echt vanaf getrokken, zodat
  // deze tegel meebeweegt met de Bijkomend-tegel hierboven.
  const capexBijkomendRuw = wijkResults.reduce((s,r) =>
    s + r.data.delta.AC*CAPEX_V2.AC + r.data.delta.DC*CAPEX_V2.DC + r.data.delta.HPC*CAPEX_V2.HPC, 0);
  const capexBijkomend = Math.max(0, capexBijkomendRuw - geplandAangerekend*CAPEX_V2.AC);

  const tijdreeks = YEARS.map(yr => {
    const p = {...calcParams, year:yr, evAandeelOverride: gemeente?.evAandeelOverride?.[yr] ?? null};
    const res = (gemeente?.wijken||[]).map(w => {
      const d = calcWijk(w, p);
      const bestaand = bestaandPerWijk[w.id] || leegType();
      const delta = {
        AC:  Math.max(0, d.totAC  - bestaand.AC),
        DC:  Math.max(0, d.totDC  - bestaand.DC),
        HPC: Math.max(0, d.totHPC - bestaand.HPC),
      };
      const capex = delta.AC*CAPEX_V2.AC + delta.DC*CAPEX_V2.DC + delta.HPC*CAPEX_V2.HPC;
      return { ...d, bestaand, delta, deltaTotaal: delta.AC+delta.DC+delta.HPC, capex };
    });
    const totLPJaar      = res.reduce((s,r)=>s+r.totLP,0);
    const totDeltaACJaar = res.reduce((s,r)=>s+r.delta.AC,0);
    const totDeltaOverigJaar = res.reduce((s,r)=>s+r.delta.DC+r.delta.HPC,0);
    const geplandAangerekendJaar = Math.min(huidigLP, totDeltaACJaar);
    const bijkomendJaar = Math.max(0, totDeltaACJaar - huidigLP) + totDeltaOverigJaar;
    const capexNuRuw = res.reduce((s,r) => s + r.capex, 0);
    const capexNu = Math.max(0, capexNuRuw - geplandAangerekendJaar*CAPEX_V2.AC);
    return {
      jaar:yr,
      'Laadpunten nodig':  totLPJaar,
      'Bijkomend': bijkomendJaar,
      'MWh':       Math.round(res.reduce((s,r)=>s+r.totMwh,0)),
      'CAPEX €K':  Math.round(capexNu/1000),
    };
  });

  // ══════════════════════════════════════════════════════════════════
  // API: gemeenten laden bij startup
  // ══════════════════════════════════════════════════════════════════
  useEffect(() => {
    async function laadGemeenten() {
      // Health check
      const health = await checkHealth();
      if (health.status !== 'ok') {
        setDbStatus('offline');
        console.warn('API offline — gebruik lokale fallback data');
        return;
      }
      setDbStatus('online');

      try {
        // Laad gemeentelijst (zonder wijken, voor de selector)
        const lijst = await getAlleGemeenten();
        // Omzetten naar object met id als key
        const gemObj = {};
        for (const g of lijst) {
          gemObj[g.id] = g; // wijken nog niet geladen
        }
        // Laad de startgemeente volledig (inclusief wijken)
        const eerste = await getGemeente('leuven');
        gemObj['leuven'] = eerste;
        setGemeenten(gemObj);
      } catch(e) {
        setApiError(e.message);
        setDbStatus('offline');
      }
    }
    laadGemeenten();
  }, []);

  // ══════════════════════════════════════════════════════════════════
  // API: gemeente laden bij switch (lazy — wijken pas ophalen als nodig)
  // ══════════════════════════════════════════════════════════════════
  const laadGemeenteDetails = useCallback(async (id) => {
    if (gemeenten[id]?.wijken?.length) return; // al geladen
    if (dbStatus === 'offline') return;
    try {
      const g = await getGemeente(id);
      setGemeenten(prev => ({ ...prev, [id]: g }));
    } catch(e) {
      setApiError(e.message);
    }
  }, [gemeenten, dbStatus]);

  const loadSectoren = useCallback(async (id) => {
    try {
      const fc = await getSectoren(id);
      console.log('Sectoren geladen voor', id, ':', fc?.features?.length, 'features');
      sectorenRef.current = fc?.features?.length > 0 ? fc : null;
      setSectorenGeladen(Date.now());
    } catch(e) {
      console.warn('Sectoren laden fout:', e.message);
      sectorenRef.current = null;
    }
  }, []);

  useEffect(() => {
    laadGemeenteDetails(gemId);
    setSelectedWijk(null);
    sectorenRef.current = null;
    setSectorenGeladen(0);
    loadBestaandePalen();
    if (mapInstance.current && gemeente) {
      mapInstance.current.setView(gemeente.center, gemeente.zoom, { animate:true });
    }
  }, [gemId]);

  // ══════════════════════════════════════════════════════════════════
  // Gemeente toevoegen via onboarding → opslaan in DB
  // ══════════════════════════════════════════════════════════════════
  const slaEditorOp = useCallback((bijgewerkt) => {
    setGemeenten(prev => ({ ...prev, [bijgewerkt.id]: bijgewerkt }));
  }, []);

  const voegGemeenteToe = useCallback(async (nieuw) => {
    setSaving(true);
    setApiError('');
    let gId = nieuw.id;
    try {
      if (dbStatus === 'online') {
        // Opslaan in database
        const opgeslagen = await slaGemeenteOp(nieuw);
        setGemeenten(prev => ({ ...prev, [opgeslagen.id]: opgeslagen }));
        setGemId(opgeslagen.id);
        gId = opgeslagen.id;
      } else {
        // Offline fallback: alleen in sessie
        setGemeenten(prev => ({ ...prev, [nieuw.id]: nieuw }));
        setGemId(nieuw.id);
      }
      setHuidigLP(0);
      setShowOnboarding(false);
      // Geo onboarding + sector-koppeling op achtergrond
      // (wizard-wijken blijven ongewijzigd; dit koppelt alleen Statbel-
      // polygonen aan die wijken voor de kaartweergave)
      try {
        await onboardGemeenteGeo(gId);
        await syncWijkenVanStatbel(gId);
        await loadSectoren(gId);
      } catch(e) { console.warn('Geo sync:', e.message); }
    } catch(e) {
      setApiError(`Opslaan mislukt: ${e.message}`);
    }
    setSaving(false);
  }, [dbStatus, loadSectoren]);

  // ══════════════════════════════════════════════════════════════════
  // Gemeente verwijderen
  // ══════════════════════════════════════════════════════════════════
  const verwijder = useCallback(async (id) => {
    try {
      if (dbStatus === 'online') await verwijderGemeente(id);
      setGemeenten(prev => {
        const rest = { ...prev };
        delete rest[id];
        return rest;
      });
      setGemId(Object.keys(gemeenten).find(k => k !== id) || 'leuven');
    } catch(e) {
      setApiError(e.message);
    }
    setShowDelete(false);
  }, [gemeenten, dbStatus]);

  // ── Sectoren laden (apart, na gemeente-switch) ─────────────────────
  useEffect(() => {
    sectorenRef.current = null;
    loadSectoren(gemId);
  }, [gemId]);

  // ── Kaart init ─────────────────────────────────────────────────────
  useEffect(() => {
    if (mapInstance.current || !mapRef.current) return;
    mapInstance.current = L.map(mapRef.current, {
      center: [50.8798, 4.7005], zoom: 13, zoomControl:false,
    });
    L.control.zoom({ position:'topleft' }).addTo(mapInstance.current);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution:'© OpenStreetMap © CARTO', maxZoom:19,
    }).addTo(mapInstance.current);
  }, []);

  // ── Bestaande palen ────────────────────────────────────────────────
  const loadBestaandePalen = useCallback(async () => {
    if (!gemeente?.naam || !gemId) return;
    setLoadingPalen(true);
    try {
      const json = await getLaadpalen(gemId);
      setExistingPalen(json.elements || []);
      console.log('Laadpalen:', json.elements?.length, 'gevonden (via backend proxy)');
    } catch(e) {
      console.warn('Laadpalen ophalen mislukt:', e.message);
      setExistingPalen([]);
    }
    setLoadingPalen(false);
  }, [gemId, gemeente]);

  // ── Kaart wijklagen ────────────────────────────────────────────────
  useEffect(() => {
    if (!mapInstance.current || !gemeente?.wijken?.length) return;
    if (wijkLayerRef.current) mapInstance.current.removeLayer(wijkLayerRef.current);
    if (projLayerRef.current) mapInstance.current.removeLayer(projLayerRef.current);

    const wg = L.layerGroup(), pg = L.layerGroup();

    // Bouw lookup van wijk-id naar berekende data
    const wijkDataMap = {};
    wijkResults.forEach(({ wijk, data }) => { wijkDataMap[wijk.id] = { wijk, data }; });

    // Toon echte wijkpolygonen als beschikbaar, anders cirkels als fallback.
    // Elke wijk uit wijkResults moet altijd zichtbaar zijn: via een
    // gekoppelde polygoon, of anders als cirkel — nooit onzichtbaar.
    const wijkenMetPolygoon = new Set();

    if (sectorenRef.current?.features?.length > 0) {
      // CHOROPLETH: officiele wijkpolygonen, gekleurd op basis van de
      // wizard-berekening (wijkResults) van de gekoppelde wijk — niet op
      // een Statbel-oppervlaktegewicht.
      sectorenRef.current.features.forEach((feature, idx) => {
        const naam    = feature.properties?.NAAM || `Sector ${idx+1}`;
        const wijkId  = feature.properties?.WIJK_ID;
        const match   = wijkId ? wijkDataMap[wijkId] : null;

        if (match) wijkenMetPolygoon.add(match.wijk.id);

        const mwh       = match ? match.data.totMwh : 0;
        const fillColor = match ? kwantielKleur(match.data.deltaTotaal, alleDeltas) : '#5a6a72';
        const bestaandSom = match ? (match.data.bestaand.AC+match.data.bestaand.DC+match.data.bestaand.HPC) : 0;
        const tooltip   = match
          ? `<b>${match.wijk.naam}</b><br>${Math.round(match.data.totLP)} nodig (bruto) · ${bestaandSom.toFixed(1)} aanwezig (gewogen) · <b>${match.data.deltaTotaal.toFixed(1)} bijkomend</b><br>AC ${match.data.delta.AC.toFixed(1)} · DC ${match.data.delta.DC.toFixed(1)} · HPC ${match.data.delta.HPC.toFixed(1)}<br>${Math.round(mwh)} MWh/jr`
          : `<b>${naam}</b><br>Geen wijkkoppeling`;

        try {
          // Normaliseer geometry: zorg dat coördinaten correct zijn
          const geom = feature.geometry;
          if (!geom) return;

          // Overpass geeft soms MultiPolygon met verkeerde nesting
          let normalizedFeature = { ...feature };
          if (geom.type === 'MultiPolygon' && Array.isArray(geom.coordinates[0][0]) && !Array.isArray(geom.coordinates[0][0][0])) {
            // Fix: wrap coordinates een niveau dieper
            normalizedFeature = {
              ...feature,
              geometry: { type: 'Polygon', coordinates: geom.coordinates }
            };
          }

          const poly = L.geoJSON(normalizedFeature, {
            style: () => ({
              color:       fillColor,
              weight:      2,
              fillColor:   fillColor,
              fillOpacity: match ? 0.65 : 0.35,
            })
          });

          poly.bindTooltip(tooltip, { sticky: true });
          poly.on('click', () => {
            if (match) setSelectedWijk(match.wijk.id);
          });
          poly.addTo(wg);
        } catch(e) {
          console.warn('Polygon fout:', naam, e.message);
        }
      });
    }

    // Cirkel-fallback voor elke wijk die geen gekoppelde polygoon kreeg
    // (inclusief het geval dat er helemaal geen polygonen beschikbaar zijn).
    wijkResults.forEach(({ wijk, data }) => {
      if (wijkenMetPolygoon.has(wijk.id)) return;
      const fc = kwantielKleur(data.deltaTotaal, alleDeltas);
      const bestaandSom = data.bestaand.AC+data.bestaand.DC+data.bestaand.HPC;
      L.circle([wijk.lat, wijk.lng], {
        radius:300+data.deltaTotaal*18, color:fc, weight:2, fillColor:fc, fillOpacity:0.22,
      })
      .bindTooltip(`<b>${wijk.naam}</b><br>${Math.round(data.totLP)} nodig (bruto) · ${bestaandSom.toFixed(1)} aanwezig (gewogen) · <b>${data.deltaTotaal.toFixed(1)} bijkomend</b><br>AC ${data.delta.AC.toFixed(1)} · DC ${data.delta.DC.toFixed(1)} · HPC ${data.delta.HPC.toFixed(1)}<br>${Math.round(data.totMwh)} MWh/jr`)
      .on('click', () => setSelectedWijk(wijk.id))
      .addTo(wg);

      L.marker([wijk.lat, wijk.lng], { icon: L.divIcon({ className:'',
        html:`<div style="font-size:11px;font-weight:700;color:#1a2830;text-shadow:0 0 3px rgba(255,255,255,.9);white-space:nowrap;pointer-events:none">${wijk.naam}</div>`,
        iconAnchor:[0,0] }) }).addTo(wg);
    });

    // Voeg lagen toe aan kaart
    wg.addTo(mapInstance.current);
    wijkLayerRef.current = wg;
  }, [gemId, year, privePctOverride, redundantieMarge, trendFactor, trends, gemeenten, sectorenGeladen, existingPalen]);

  // ── Bestaande palen laag ───────────────────────────────────────────
  useEffect(() => {
    if (!mapInstance.current) return;
    if (existLayerRef.current) mapInstance.current.removeLayer(existLayerRef.current);
    const g = L.layerGroup();

    // Bepaal per laadpunt het type (zelfde logica als voorheen)
    const bepaalType = (t) => {
      const maxPower = parseInt(
        t['maxpower'] || t['capacity:output'] ||
        t['socket:type2_combo:output'] || t['socket:chademo:output'] ||
        t['socket:type2:output'] || '0'
      );
      if (t.mow_snelheid === 'ultrasnel')      return 'hpc';
      if (t.mow_snelheid === 'snel')           return 'dc';
      if (t.mow_snelheid === 'normaal')        return 'ac';
      const heeftCCS     = t['socket:type2_combo'] || t['socket:ccs'];
      const heeftCHAdeMO = t['socket:chademo'];
      const networkHPC   = (t['network']||'').match(/ionity|fastned|tesla|allego|porsche/i);
      if (maxPower >= 100 || networkHPC) return 'hpc';
      if (maxPower >= 22 || heeftCCS || heeftCHAdeMO) return 'dc';
      return 'ac';
    };

    // Groepeer laadpunten die exact dezelfde locatie delen (één laadstation
    // met meerdere laadpunten/connectoren), zodat ze niet onzichtbaar boven
    // op elkaar getekend worden.
    const groepen = new Map();
    existingPalen.forEach(el => {
      const lat=el.lat||el.center?.lat, lng=el.lon||el.center?.lon;
      if(!lat) return;
      const key = `${lat.toFixed(6)}_${lng.toFixed(6)}`;
      const t = el.tags||{};
      const paalType = bepaalType(t);
      const maxPower = parseInt(t['maxpower'] || '0');
      if (!groepen.has(key)) groepen.set(key, { lat, lng, punten: [] });
      groepen.get(key).punten.push({ t, paalType, vermogen: t.maxpower||maxPower });
    });

    const prioriteit = { hpc:3, dc:2, ac:1 };
    groepen.forEach(({ lat, lng, punten }) => {
      // Icoon toont het "beste" type dat op deze locatie aanwezig is
      const hoofdType = punten.reduce((best, p) =>
        prioriteit[p.paalType] > prioriteit[best] ? p.paalType : best, 'ac');

      const aantalPerType = { ac:0, dc:0, hpc:0 };
      punten.forEach(p => aantalPerType[p.paalType]++);
      const uitbaters = [...new Set(punten.map(p => p.t.operator || p.t.network).filter(Boolean))];
      const adres = punten.find(p => p.t.mow_adres)?.t.mow_adres;
      const toegankelijkheid = punten.find(p => p.t.mow_toegankelijkheid)?.t.mow_toegankelijkheid;
      const isMow = punten.some(p => p.t.mow_snelheid);

      const typeOverzicht = ['ac','dc','hpc']
        .filter(tp => aantalPerType[tp] > 0)
        .map(tp => `${aantalPerType[tp]}× ${tp.toUpperCase()}`)
        .join(' · ');

      L.marker([lat,lng], { icon: makeBestaandIcon(hoofdType, punten.length), zIndexOffset: 1000 })
       .bindPopup(`<b>${punten.length > 1 ? punten.length+' laadpunten hier' : 'Bestaande laadpaal'}</b>${toegankelijkheid ? ' · '+toegankelijkheid : ''}<br>
         ${typeOverzicht}<br>
         ${uitbaters.length ? 'Uitbater'+(uitbaters.length>1?'s':'')+': '+uitbaters.join(', ')+'<br>' : ''}
         ${adres ? adres+'<br>' : ''}
         <small>Bron: ${isMow ? 'MOW (Departement Mobiliteit en Openbare Werken)' : 'OpenStreetMap'}</small>`)
       .addTo(g);
    });

    g.addTo(mapInstance.current); existLayerRef.current = g;
  }, [existingPalen]);

  const fmtEur = n => `€${Math.round(n/1000).toLocaleString('nl-BE')}K`;
  const fmtN   = n => Math.round(n).toLocaleString('nl-NL');
  const selectedResult = selectedWijk ? wijkResults.find(r=>r.wijk.id===selectedWijk) : null;

  // ── Stijlen ────────────────────────────────────────────────────────
  const st = {
    app:    { display:'flex', height:'100vh', background:C.darkBg, color:C.text, fontFamily:"'Segoe UI',system-ui,sans-serif", overflow:'hidden' },
    side:   { width:300, background:C.panelBg, borderRight:`1px solid ${C.border}`, display:'flex', flexDirection:'column', overflow:'hidden' },
    logo:   { padding:'12px 16px', borderBottom:`1px solid ${C.border}`, display:'flex', justifyContent:'space-between', alignItems:'center' },
    dbBadge:(s) => ({ fontSize:9, fontWeight:700, padding:'2px 7px', borderRadius:3, background: s==='online'?'#0a2a1a':s==='offline'?'#2a0a0a':'#1a1a0a', color:s==='online'?C.green:s==='offline'?C.warn:C.gold, border:`1px solid ${s==='online'?C.darkGreen:s==='offline'?C.warn:C.gold}` }),
    scroll: { flex:1, overflowY:'auto' },
    sec:    { borderBottom:`1px solid ${C.border}` },
    sHdr:   { fontSize:9, fontWeight:700, letterSpacing:'1px', textTransform:'uppercase', color:C.textDim, padding:'9px 16px 4px' },
    sBody:  { padding:'4px 16px 12px' },
    gemWrap:{ display:'flex', flexWrap:'wrap', gap:5, marginBottom:5 },
    gemBtn: (a,c) => ({ padding:'5px 8px', borderRadius:5, fontSize:10, fontWeight:700, cursor:'pointer', border:`1.5px solid ${a?c:C.border}`, background:a?c+'33':'transparent', color:a?c:C.textDim }),
    addBtn: { padding:'5px 8px', borderRadius:5, fontSize:10, fontWeight:700, cursor:'pointer', border:`1.5px dashed ${C.border}`, color:C.textDim, background:'transparent' },
    yTabs:  { display:'flex', gap:5, marginTop:8 },
    yTab:   (a) => ({ flex:1, padding:'5px 0', borderRadius:5, fontSize:11, fontWeight:700, textAlign:'center', cursor:'pointer', border:`1.5px solid ${a?C.tealDark:C.border}`, background:a?C.tealDark:'transparent', color:a?'#fff':C.textDim }),
    sl:     { width:'100%', accentColor:C.teal, cursor:'pointer', margin:'3px 0' },
    lbl:    { display:'flex', justifyContent:'space-between', fontSize:11, color:C.textMid, marginBottom:2 },
    lv:     { fontWeight:700, color:C.teal },
    segG:   { display:'grid', gridTemplateColumns:'1fr 1fr', gap:4 },
    segB:   (a,c) => ({ padding:'5px 4px', borderRadius:5, fontSize:10, fontWeight:700, textAlign:'center', cursor:'pointer', border:`1.5px solid ${a?c:C.border}`, background:a?c+'22':'transparent', color:a?c:C.textDim }),
    tR:     { display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:6 },
    tog:    (on) => ({ width:34, height:18, borderRadius:9, background:on?C.darkGreen:'#1e3a46', position:'relative', cursor:'pointer' }),
    tk:     (on) => ({ position:'absolute', top:2, left:on?18:2, width:14, height:14, borderRadius:'50%', background:'#fff', transition:'left 0.2s' }),
    stG:    { display:'grid', gridTemplateColumns:'1fr 1fr', gap:5 },
    stC:    { background:'#0a1620', border:`1px solid ${C.border}`, borderRadius:6, padding:'8px 9px' },
    sL:     { fontSize:9, color:C.textDim, textTransform:'uppercase', letterSpacing:'0.4px' },
    sV:     (c) => ({ fontSize:20, fontWeight:800, color:c||C.teal, lineHeight:1.1 }),
    sS:     { fontSize:9, color:C.textDim },
    mArea:  { flex:1, display:'flex', flexDirection:'column', position:'relative' },
    mHdr:   { height:46, background:C.panelBg, borderBottom:`1px solid ${C.border}`, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 16px', flexShrink:0 },
    ov:     { position:'absolute', top:10, right:10, width:250, background:C.panelBg, border:`1px solid ${C.border}`, borderRadius:9, padding:'12px', zIndex:500, boxShadow:'0 8px 24px rgba(0,0,0,0.4)' },
    dpR:    { display:'flex', justifyContent:'space-between', fontSize:11, padding:'3px 7px', background:'#0a1620', borderRadius:4, marginBottom:3 },
    legB:   { position:'absolute', bottom:200, left:12, background:C.panelBg+'ee', border:`1px solid ${C.border}`, borderRadius:7, padding:'8px 11px', zIndex:500 },
    legI:   { display:'flex', alignItems:'center', gap:6, fontSize:10, color:C.textDim, marginBottom:3 },
    chart:  { height:185, background:C.panelBg, borderTop:`1px solid ${C.border}`, padding:'10px 14px', flexShrink:0 },
    cTabs:  { display:'flex', gap:7, marginBottom:8 },
    cTab:   (a) => ({ fontSize:11, fontWeight:700, padding:'3px 9px', borderRadius:5, cursor:'pointer', border:`1px solid ${a?C.tealDark:C.border}`, background:a?C.tealDark:'transparent', color:a?'#fff':C.textDim }),
    errBnr: { background:'#2a0a0a', border:`1px solid ${C.warn}`, borderRadius:5, padding:'6px 10px', fontSize:10, color:C.warn, margin:'6px 16px' },
    savBnr: { background:'#0a2a1a', border:`1px solid ${C.darkGreen}`, borderRadius:5, padding:'6px 10px', fontSize:10, color:C.green, margin:'6px 16px' },
    delModal:{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', zIndex:3000, display:'flex', alignItems:'center', justifyContent:'center' },
    delBox:  { background:C.panelBg, border:`1px solid ${C.border}`, borderRadius:10, padding:'24px', width:320, boxShadow:'0 16px 48px rgba(0,0,0,0.5)' },
  };

  const STANDAARD_IDS = ['leuven','olen','gent'];

  // ── Dashboard: toon startpagina tot gebruiker een gemeente selecteert ──
  if (showDashboard) {
    return (
      <Dashboard
        gemeenten={gemeenten}
        dbStatus={dbStatus}
        onSelectGemeente={(id) => {
          setGemId(id);
          setShowDashboard(false);
        }}
        onStartOnboarding={() => {
          setShowDashboard(false);
          setShowOnboarding(true);
        }}
      />
    );
  }

  return (
    <div style={st.app}>
      <style>{`
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
        ::-webkit-scrollbar{width:4px}
        ::-webkit-scrollbar-thumb{background:#1e3a46;border-radius:2px}
        .belli-tooltip { background: white; border: 1px solid #ddd; border-radius: 8px; padding: 8px 10px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
        .belli-tooltip::before { display: none; }
        .leaflet-tooltip.belli-tooltip { white-space: normal; }
      `}</style>

      {showOnboarding && (
        <GemeenteOnboarding
          onComplete={voegGemeenteToe}
          onClose={() => setShowOnboarding(false)}
          saving={saving} />
      )}

      {showOverzicht && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.7)',zIndex:2000,display:'flex',alignItems:'center',justifyContent:'center'}}
          onClick={e=>e.target===e.currentTarget&&setShowOverzicht(false)}>
          <div style={{width:720,maxHeight:'85vh',background:C.panelBg,border:`1px solid ${C.border}`,borderRadius:12,display:'flex',flexDirection:'column',overflow:'hidden',boxShadow:'0 20px 60px rgba(0,0,0,0.5)'}}>
            <div style={{padding:'16px 22px',borderBottom:`1px solid ${C.border}`,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <div style={{fontSize:15,fontWeight:800,color:C.text}}>{gemeente?.naam}, Wijkoverzicht {year}</div>
              <span style={{cursor:'pointer',color:C.textDim,fontSize:20}} onClick={()=>setShowOverzicht(false)}>×</span>
            </div>
            <div style={{overflowY:'auto',flex:1}}>
              <table style={{width:'100%',borderCollapse:'collapse',fontSize:11}}>
                <thead>
                  <tr style={{background:'#0a1620',position:'sticky',top:0}}>
                    {['Wijk','Bij te plaatsen LP','Energievraag MWh/jr','CAPEX indicatief','Prioriteit'].map(h=>(
                      <th key={h} style={{padding:'10px 14px',textAlign:'left',color:C.textMid,fontWeight:700,borderBottom:`1px solid ${C.border}`}}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const rijen = wijkResults.map(({wijk,data})=>({
                      naam: wijk.naam,
                      lp:   data.deltaTotaal,
                      mwh:  Math.round(data.totMwh),
                      capex: data.capex,
                    }));
                    return rijen.sort((a,b)=>b.lp-a.lp).map((r,i)=>(
                      <tr key={i} style={{borderBottom:`1px solid ${C.border}`,background:i%2===0?'#0a1620':C.panelBg}}>
                        <td style={{padding:'8px 14px',color:C.text,fontWeight:500}}>{r.naam}</td>
                        <td style={{padding:'8px 14px',color:C.teal,fontWeight:700,textAlign:'right'}}>{Math.ceil(r.lp)}</td>
                        <td style={{padding:'8px 14px',color:C.textMid,textAlign:'right'}}>{r.mwh}</td>
                        <td style={{padding:'8px 14px',color:C.gold,textAlign:'right'}}>€ {Math.round(r.capex/1000)}K</td>
                        <td style={{padding:'8px 14px',textAlign:'center'}}>
                          {r.lp>30?'🔴 Hoog':r.lp>15?'🟡 Middel':'🟢 Laag'}
                        </td>
                      </tr>
                    ));
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {showEditor && gemeente && (
        <GemeenteEditor
          gemeente={gemeente}
          onSave={slaEditorOp}
          onClose={() => setShowEditor(false)} />
      )}

      {/* Verwijder bevestiging */}
      {showDelete && (
        <div style={st.delModal}>
          <div style={st.delBox}>
            <div style={{ fontSize:14, fontWeight:800, marginBottom:8 }}>Gemeente verwijderen?</div>
            <div style={{ fontSize:12, color:C.textMid, marginBottom:16 }}>
              <strong>{gemeente?.naam}</strong> en alle bijbehorende wijkdata worden permanent verwijderd uit de database.
            </div>
            <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
              <button style={{ padding:'7px 16px', borderRadius:5, border:`1px solid ${C.border}`, background:'transparent', color:C.textMid, cursor:'pointer', fontSize:12 }}
                onClick={() => setShowDelete(false)}>Annuleren</button>
              <button style={{ padding:'7px 16px', borderRadius:5, border:'none', background:C.warn, color:'#fff', cursor:'pointer', fontSize:12, fontWeight:700 }}
                onClick={() => verwijder(gemId)}>Verwijderen</button>
            </div>
          </div>
        </div>
      )}

      {/* SIDEBAR */}
      <div style={st.side}>
        <div style={st.logo}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <button
              onClick={() => setShowDashboard(true)}
              style={{ background:'none', border:'none', cursor:'pointer', color:C.textMid, fontSize:11, display:'flex', alignItems:'center', gap:4, padding:0 }}
              title="Terug naar alle gemeenten"
            >
              ← Alle gemeenten
            </button>
          </div>
          <span style={st.dbBadge(dbStatus)}>
            {dbStatus==='online'?'● DB online':dbStatus==='offline'?'● DB offline':'● laden'}
          </span>
        </div>

        {apiError && <div style={st.errBnr}>⚠ {apiError}</div>}
        {saving   && <div style={st.savBnr}>Opslaan in database…</div>}

        <div style={st.scroll}>

          {/* Gemeente selector */}
          <div style={st.sec}>
            <div style={st.sHdr}>Gemeente</div>
            <div style={st.sBody}>
              <div style={st.gemWrap}>
                {Object.values(gemeenten).map(g => (
                  <div key={g.id} style={st.gemBtn(gemId===g.id, g.kleur||C.tealDark)}
                    onClick={() => setGemId(g.id)}>{g.naam}</div>
                ))}
                <div style={st.addBtn} onClick={() => setShowOnboarding(true)}>+ Nieuw</div>
              </div>

              {/* Verwijder knop voor niet-standaard gemeenten */}
              <div style={{ display:'flex', gap:10, marginTop:4 }}>
                <div style={{ fontSize:10, color:C.teal, cursor:'pointer' }}
                  onClick={() => setShowEditor(true)}>
                  ✎ Bewerken
                </div>
                {!STANDAARD_IDS.includes(gemId) && (
                  <div style={{ fontSize:10, color:C.warn, cursor:'pointer' }}
                    onClick={() => setShowDelete(true)}>
                    ✕ Verwijderen
                  </div>
                )}
              </div>

              <div style={{ fontSize:10, color:C.textDim, marginTop:4 }}>
                {gemeente?.inwoners?.toLocaleString('nl-NL')} inwoners ·{' '}
                {gemeente?.wijken?.length || '…'} wijken
                {dbStatus==='offline' && <span style={{color:C.gold}}> · lokaal</span>}
              </div>
            </div>
          </div>

          {/* EV-aandeel & jaar */}
          <div style={st.sec}>
            <div style={st.sHdr}>EV-aandeel & jaar</div>
            <div style={st.sBody}>
              <div style={st.lbl}>
                <span>EV-aandeel {year}{gemeente?.evAandeelOverride?.[year] != null ? ' (eigen cijfer)' : ' (berekend)'}</span>
                <span style={st.lv}>{((wijkResults[0]?.data.evPct||0)*100).toFixed(1)}%</span>
              </div>
              <div style={st.yTabs}>
                {[2027,2028,2029,2030,2031,2032,2033,2034,2035].map(y=>(
                  <div key={y} style={st.yTab(year===y)} onClick={()=>setYear(y)}>{y}</div>
                ))}
              </div>
            </div>
          </div>

          {/* Parameters */}
          <div style={st.sec}>
            <div style={st.sHdr}>Parameters</div>
            <div style={st.sBody}>
              <div style={{ marginBottom:10 }}>
                <div style={st.lbl}><span>Privé %</span><span style={st.lv}>{((wijkResults[0]?.data.privePct||0)*100).toFixed(0)}%</span></div>
                <div style={st.lbl}><span>Publiek + semi-publiek %</span><span style={st.lv}>{(100-(wijkResults[0]?.data.privePct||0)*100).toFixed(0)}%</span></div>
                <input type="range" style={st.sl} min={0} max={100} step={1}
                  value={Math.round((privePctOverride ?? gemeente?.privePctBerekend ?? 0.5)*100)}
                  onChange={e=>setPrivePctOverride(+e.target.value/100)}/>
                {privePctOverride != null && (
                  <div style={{fontSize:11,color:C.muted,cursor:'pointer',marginTop:4}}
                    onClick={()=>setPrivePctOverride(null)}>↺ reset naar berekend ({Math.round((gemeente?.privePctBerekend||0)*100)}%)</div>
                )}
              </div>
              <div style={{ marginBottom:10 }}>
                <div style={st.lbl}><span>Redundantiemarge</span><span style={st.lv}>{Math.round(redundantieMarge*100)}%</span></div>
                <input type="range" style={st.sl} min={0} max={30} step={1} value={Math.round(redundantieMarge*100)} onChange={e=>setRedundantieMarge(+e.target.value/100)}/>
              </div>
              <div>
                <div style={st.lbl}><span>Gepland te installeren (AC)</span></div>
                <input
                  type="number"
                  min={0}
                  value={huidigLP === 0 ? '' : huidigLP}
                  placeholder="0"
                  onChange={e => setHuidigLP(e.target.value === '' ? 0 : Math.max(0, +e.target.value))}
                  style={{
                    width:'100%', boxSizing:'border-box', padding:'6px 10px',
                    background:C.darkBg, border:`1px solid ${C.border}`, borderRadius:6,
                    color:C.text, fontSize:13, fontWeight:700,
                  }}
                />
              </div>
            </div>
          </div>

          {/* Trends */}
          <div style={st.sec}>
            <div style={st.sHdr}>Trendscenario's</div>
            <div style={st.sBody}>
              {[['slim','Slim laden']].map(([t,l])=>(
                <div key={t} style={st.tR}>
                  <span style={{fontSize:11,color:C.textMid}}>{l}</span>
                  <div style={st.tog(trends[t])} onClick={()=>setTrends(s=>({...s,[t]:!s[t]}))}>
                    <div style={st.tk(trends[t])}/>
                  </div>
                </div>
              ))}
              {trends.slim && (
                <div style={{fontSize:10,color:C.textDim}}>Ruimte voor extra laadpunten, obv 40% piekreductie (E-Laad studie).</div>
              )}
            </div>
          </div>

          {/* Totalen */}
          <div style={st.sec}>
            <div style={st.sHdr}>Totaal {gemeente?.naam}, {year}</div>
            <div style={st.sBody}>
              <div style={st.stG}>
                {[['Laadpunten nodig',fmtN(totLP),C.teal,'publiek domein'],
                  ['Bijkomend',fmtN(bijkomend),C.gold,'t.o.v. gepland en huidig'],
                  ['MWh/jaar',fmtN(totMwh),C.teal,'publieke vraag'],
                  ['CAPEX',fmtEur(capexBijkomend),C.warn,'indicatief, nog te bouwen']
                ].map(([l,v,c,sub])=>(
                  <div key={l} style={st.stC}>
                    <div style={st.sL}>{l}</div>
                    <div style={st.sV(c)}>{v}</div>
                    <div style={st.sS}>{sub}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* KAART AREA */}
      <div style={st.mArea}>
        <div style={st.mHdr}>
          <div style={{fontSize:13,fontWeight:700}}>{gemeente?.naam} · {year}</div>
          <div style={{fontSize:11,color:C.textDim}}>
            <span style={{width:7,height:7,borderRadius:'50%',background:'#4CAF50',display:'inline-block',marginRight:5,animation:'pulse 2s infinite'}}></span>
            {loadingPalen?'Laden…':`${existingPalen.length} laadpunten op kaart (MOW)`}
            &nbsp;·&nbsp;
            <strong style={{color:C.teal}}>{(bestaandTotaalPerType.AC+bestaandTotaalPerType.DC+bestaandTotaalPerType.HPC).toFixed(0)} gewogen (Publiek + 50% semi-publiek)</strong>
            <button onClick={() => setShowOverzicht(true)} style={{
              marginLeft:12, padding:'3px 12px', borderRadius:5, fontSize:11,
              fontWeight:700, cursor:'pointer', border:`1px solid ${C.tealDark}`,
              background:C.tealDark, color:'#fff',
            }}>Wijkoverzicht</button>
            {ongematcht > 0 && (
              <span style={{marginLeft:12, color:C.gold, fontSize:11}}>
                ⚠ {ongematcht} laadpunten zonder wijkkoppeling
              </span>
            )}
          </div>
        </div>

        <div style={{flex:1}} ref={mapRef}/>

        {/* Wijk detail */}
        {selectedResult && (
          <div style={st.ov}>
            <span style={{float:'right',cursor:'pointer',color:C.textDim,fontSize:18}} onClick={()=>setSelectedWijk(null)}>×</span>
            <div style={{fontSize:13,fontWeight:800,marginBottom:2}}>{selectedResult.wijk.naam}</div>
            <div style={{fontSize:10,color:C.textDim,marginBottom:10}}>
              {selectedResult.data.deltaTotaal>25?'🔴 HOOG':selectedResult.data.deltaTotaal>15?'🟡 MIDDEL':'🟢 LAAG'} · {year}
            </div>
            {[
              ['Laadpunten nodig (bruto)', Math.round(selectedResult.data.totLP)],
              ['Al aanwezig (totaal, gewogen)', (selectedResult.data.bestaand.AC+selectedResult.data.bestaand.HPC+selectedResult.data.bestaand.DC).toFixed(1)],
              ['Nog te plaatsen',          selectedResult.data.deltaTotaal.toFixed(1)],
              ['AC palen (obv energiebehoefte, leidend)', Math.round(selectedResult.data.totAC)],
              ['Referentie: 250m-norm zou geven',   `${Math.round(selectedResult.data.dekkingAC)}${selectedResult.data.dekkingLigtHoger ? ' (hoger dan energiebehoefte)' : ''}`],
              ['AC al aanwezig',           selectedResult.data.bestaand.AC.toFixed(1)],
              ['AC nog te plaatsen',       selectedResult.data.delta.AC.toFixed(1)],
              ...(trends.slim ? [[
                'Ruimte op bestaande aansluitingen (slim laden, E-Laad studie)',
                `+${Math.round(slimLadenExtraRuimte(selectedResult.data.bestaand.AC))} extra AC-sockets mogelijk, zelfde max. leverbare kWh`,
              ]] : []),
              ['DC palen (nodig / aanwezig / bijkomend)', `${Math.round(selectedResult.data.totDC)} / ${selectedResult.data.bestaand.DC.toFixed(1)} / ${selectedResult.data.delta.DC.toFixed(1)}`],
              ['HPC palen (nodig / aanwezig / bijkomend)', `${Math.round(selectedResult.data.totHPC)} / ${selectedResult.data.bestaand.HPC.toFixed(1)} / ${selectedResult.data.delta.HPC.toFixed(1)}`],
              ['MWh/jr',   Math.round(selectedResult.data.totMwh)],
              ['CAPEX bijkomend', fmtEur(selectedResult.data.capex)],
            ].map(([l,v])=>(
              <div key={l} style={st.dpR}>
                <span style={{color:C.textMid}}>{l}</span>
                <span style={{fontWeight:700}}>{v}</span>
              </div>
            ))}
          </div>
        )}

        {/* Legenda */}
        <div style={st.legB}>
          {[
            [{width:16,height:16,borderRadius:'50%',background:'#27ae60',border:'3px solid white',outline:'2px solid #1a6e30'},'Bestaande AC paal'],
            [{width:18,height:18,borderRadius:'50%',background:'#e74c3c',border:'3px solid white',outline:'2px solid #922b21'},'Bestaande DC paal'],
            [{width:20,height:20,borderRadius:'50%',background:'#9b59b6',border:'3px solid white',outline:'2px solid #6c3483'},'Bestaande HPC paal'],

            [{width:14,height:10,borderRadius:2,background:'#7BB8C4'},'Geen extra LP nodig'],
            [{width:14,height:10,borderRadius:2,background:'#A8D96B'},'Beperkt extra LP nodig'],
            [{width:14,height:10,borderRadius:2,background:'#F0C030'},'Extra LP nodig'],
            [{width:14,height:10,borderRadius:2,background:'#2E9E55'},'Veel LP nodig'],
            [{width:14,height:10,borderRadius:2,background:'#D94030'},'Veel laadpunten nodig'],
          ].map(([ds,l],i)=>(
            <div key={i} style={st.legI}><div style={ds}/>{l}</div>
          ))}
        </div>

        {/* Grafiek */}
        <div style={st.chart}>
          <div style={st.cTabs}>
            {[['lp','Laadpunten'],['mwh','MWh'],['capex','CAPEX €K']].map(([id,l])=>(
              <div key={id} style={st.cTab(chartTab===id)} onClick={()=>setChartTab(id)}>{l}</div>
            ))}
          </div>
          <ResponsiveContainer width="100%" height={128}>
            {chartTab==='mwh'?(
              <LineChart data={tijdreeks} margin={{top:0,right:8,left:-24,bottom:0}}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e3a46"/>
                <XAxis dataKey="jaar" tick={{fill:C.textDim,fontSize:10}}/>
                <YAxis tick={{fill:C.textDim,fontSize:10}}/>
                <Tooltip contentStyle={{background:C.panelBg,border:`1px solid ${C.border}`,fontSize:11}}/>
                <Line dataKey="MWh" stroke={C.green} strokeWidth={2} dot={false}/>
              </LineChart>
            ):chartTab==='capex'?(
              <BarChart data={tijdreeks.filter((_,i)=>i%2===0)} margin={{top:0,right:8,left:-24,bottom:0}}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e3a46"/>
                <XAxis dataKey="jaar" tick={{fill:C.textDim,fontSize:10}}/>
                <YAxis tick={{fill:C.textDim,fontSize:10}}/>
                <Tooltip contentStyle={{background:C.panelBg,border:`1px solid ${C.border}`,fontSize:11}}/>
                <Bar dataKey="CAPEX €K" fill={C.gold} radius={[3,3,0,0]}/>
              </BarChart>
            ):(
              <LineChart data={tijdreeks} margin={{top:0,right:8,left:-24,bottom:0}}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e3a46"/>
                <XAxis dataKey="jaar" tick={{fill:C.textDim,fontSize:10}}/>
                <YAxis tick={{fill:C.textDim,fontSize:10}}/>
                <Tooltip contentStyle={{background:C.panelBg,border:`1px solid ${C.border}`,fontSize:11}}/>
                <Line dataKey="Laadpunten nodig" stroke={C.teal} strokeWidth={2} dot={false}/>
                <Line dataKey="Bijkomend" stroke={C.warn} strokeWidth={2} dot={false} strokeDasharray="4 2"/>
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
