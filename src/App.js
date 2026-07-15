import React, { useState, useEffect, useRef, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { GEMEENTEN, SEG_PARAMS, calcWijk, YEARS, SCENARIOS, CAPEX } from './gemeenteData';

// ── Fix Leaflet default icons ────────────────────────────────────────
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl:       'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl:     'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// ── Design tokens ────────────────────────────────────────────────────
const C = {
  darkBg:   '#0d1c22', panelBg: '#122028', border: '#1e3a46',
  teal:     '#9EC5CB', tealDark: '#2B5F6E', green: '#B7D2AE',
  darkGreen:'#3A6B4A', gold: '#D0AC41',    warn: '#E8683A',
  text:     '#e0eef2', textMid: '#7aacb4', textDim: '#3a6a74',
};

const styles = {
  app: { display:'flex', height:'100vh', background:C.darkBg, color:C.text, fontFamily:"'Segoe UI',system-ui,sans-serif", overflow:'hidden' },

  // Sidebar
  sidebar: { width:320, minWidth:300, background:C.panelBg, borderRight:`1px solid ${C.border}`, display:'flex', flexDirection:'column', overflow:'hidden', zIndex:10 },
  sidebarTop: { padding:'0 0 0 0', borderBottom:`1px solid ${C.border}` },
  logo: { padding:'14px 18px', display:'flex', alignItems:'center', gap:10, borderBottom:`1px solid ${C.border}` },
  logoText: { fontSize:18, fontWeight:800, color:C.teal, letterSpacing:'0.5px' },
  logoSub: { fontSize:11, color:C.textMid, fontWeight:300 },
  sidebarScroll: { flex:1, overflowY:'auto' },
  sideSection: { borderBottom:`1px solid ${C.border}` },
  sideHdr: { fontSize:9, fontWeight:700, letterSpacing:'1px', textTransform:'uppercase', color:C.textDim, padding:'10px 18px 6px' },
  sideBody: { padding:'0 18px 14px' },

  // Gemeente selector
  gemGrid: { display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:6 },
  gemBtn: (active, color) => ({
    padding:'8px 4px', borderRadius:6, fontSize:11, fontWeight:700, textAlign:'center',
    cursor:'pointer', border:`1.5px solid ${active ? color : C.border}`,
    background: active ? color + '33' : 'transparent',
    color: active ? color : C.textMid,
    transition:'all 0.15s',
  }),

  // Sliders & controls
  ctrlRow: { marginBottom:12 },
  ctrlLabel: { display:'flex', justifyContent:'space-between', fontSize:11, color:C.textMid, marginBottom:4 },
  ctrlVal: { fontWeight:700, color:C.teal },
  slider: { width:'100%', accentColor:C.teal, cursor:'pointer' },

  // Year tabs
  yearTabs: { display:'flex', gap:5 },
  yearTab: (active) => ({
    flex:1, padding:'5px 0', borderRadius:5, fontSize:11, fontWeight:700,
    textAlign:'center', cursor:'pointer', border:`1.5px solid ${active ? C.tealDark : C.border}`,
    background: active ? C.tealDark : 'transparent', color: active ? '#fff' : C.textMid,
    transition:'all 0.15s',
  }),

  // Segment toggles
  segGrid: { display:'grid', gridTemplateColumns:'1fr 1fr', gap:5 },
  segBtn: (active, color) => ({
    padding:'6px 4px', borderRadius:5, fontSize:10, fontWeight:700, textAlign:'center',
    cursor:'pointer', border:`1.5px solid ${active ? color : C.border}`,
    background: active ? color + '22' : 'transparent', color: active ? color : C.textDim,
    transition:'all 0.15s',
  }),

  // Stat cards
  statGrid: { display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 },
  statCard: (accent) => ({
    background:'#0a1620', border:`1px solid ${C.border}`, borderRadius:7,
    padding:'10px 10px 8px',
  }),
  statLabel: { fontSize:9, color:C.textDim, textTransform:'uppercase', letterSpacing:'0.5px' },
  statVal: (color) => ({ fontSize:22, fontWeight:800, color: color || C.teal, lineHeight:1.1 }),
  statSub: { fontSize:9, color:C.textDim },

  // Trend toggles
  trendRow: { display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 },
  trendLabel: { fontSize:11, color:C.textMid },
  toggle: (on) => ({
    width:36, height:20, borderRadius:10, background: on ? C.darkGreen : '#1e3a46',
    position:'relative', cursor:'pointer', transition:'background 0.2s', flexShrink:0,
  }),
  toggleKnob: (on) => ({
    position:'absolute', top:2, left: on ? 18 : 2, width:16, height:16,
    borderRadius:'50%', background:'#fff', transition:'left 0.2s',
  }),

  // Map area
  mapArea: { flex:1, position:'relative', display:'flex', flexDirection:'column' },
  mapHeader: { height:48, background:C.panelBg, borderBottom:`1px solid ${C.border}`, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 20px', flexShrink:0 },
  mapTitle: { fontSize:14, fontWeight:700, color:C.text },
  mapMeta: { fontSize:11, color:C.textDim, display:'flex', alignItems:'center', gap:14 },
  liveDot: { width:7, height:7, borderRadius:'50%', background:'#4CAF50', display:'inline-block', marginRight:5, animation:'pulse 2s infinite' },
  mapContainer: { flex:1 },

  // Chart panel
  chartPanel: { height:200, background:C.panelBg, borderTop:`1px solid ${C.border}`, padding:'12px 16px', flexShrink:0 },
  chartTabs: { display:'flex', gap:8, marginBottom:10 },
  chartTab: (active) => ({
    fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:5, cursor:'pointer',
    border:`1px solid ${active ? C.tealDark : C.border}`,
    background: active ? C.tealDark : 'transparent',
    color: active ? '#fff' : C.textMid, transition:'all 0.15s',
  }),

  // Wijk detail overlay
  wijkOverlay: { position:'absolute', top:10, right:10, width:260, background:C.panelBg, border:`1px solid ${C.border}`, borderRadius:10, padding:'14px', zIndex:500, boxShadow:'0 8px 24px rgba(0,0,0,0.4)' },
  wijkTitle: { fontSize:14, fontWeight:800, marginBottom:2 },
  wijkSub: { fontSize:10, color:C.textDim, marginBottom:12 },
  dpRow: { display:'flex', justifyContent:'space-between', fontSize:11, padding:'4px 8px', background:'#0a1620', borderRadius:4, marginBottom:3 },
  dpLabel: { color:C.textMid },
  dpVal: { fontWeight:700 },
  closeBtn: { float:'right', cursor:'pointer', color:C.textDim, fontSize:18, lineHeight:1, marginTop:-2 },

  // Legend
  legendBox: { position:'absolute', bottom:16, left:16, background:C.panelBg+'ee', border:`1px solid ${C.border}`, borderRadius:7, padding:'10px 12px', zIndex:500 },
  legItem: { display:'flex', alignItems:'center', gap:7, fontSize:10, color:C.textDim, marginBottom:4 },
  legDot: (color, border) => ({ width:10, height:10, borderRadius:'50%', background:color, border:`2px solid ${border}`, flexShrink:0 }),
  legRect: (color) => ({ width:14, height:10, borderRadius:2, background:color, flexShrink:0 }),
};

// ── Wijk kleur op basis van LP behoefte ─────────────────────────────
function wijkFillColor(lp) {
  if (lp > 30) return '#E8683A';
  if (lp > 15) return '#D0AC41';
  return '#2B5F6E';
}

// ── Marker SVG helper ─────────────────────────────────────────────────
function makeIcon(color, size=10, glow=true) {
  return L.divIcon({
    className: '',
    html: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${color}44;border:2px solid ${color};${glow?`box-shadow:0 0 6px ${color}88`:''}"></div>`,
    iconSize: [size, size], iconAnchor: [size/2, size/2],
  });
}

// ══════════════════════════════════════════════════════════════════════
// MAIN APP
// ══════════════════════════════════════════════════════════════════════
export default function App() {
  // State
  const [gemId,       setGemId]       = useState('leuven');
  const [scenario,    setScenario]    = useState('basis');
  const [year,        setYear]        = useState(2030);
  const [pubPct,      setPubPct]      = useState(28);
  const [huidigLP,    setHuidigLP]    = useState(150);
  const [activeSegs,  setActiveSegs]  = useState({ bew:true, bez:true, log:true, ov:true });
  const [trends,      setTrends]      = useState({ carshare:false, v2g:false, pv:false, slim:false });
  const [selectedWijk,setSelectedWijk]= useState(null);
  const [existingPalen, setExistingPalen] = useState([]);
  const [loadingPalen,  setLoadingPalen]  = useState(false);
  const [chartTab,    setChartTab]    = useState('energie');

  const mapRef       = useRef(null);
  const mapInstance  = useRef(null);
  const wijkLayerRef = useRef(null);
  const projLayerRef = useRef(null);
  const existLayerRef= useRef(null);

  const gemeente = GEMEENTEN[gemId];

  // ── Trendcorrectie ────────────────────────────────────────────────
  const trendFactor = (() => {
    let f = 1.0;
    if (trends.carshare) f *= 1 - 0.18 * Math.min(1, (year - 2025) / 10);
    if (trends.v2g)      f *= 1 - 0.28 * Math.min(1, (year - 2025) / 10);
    if (trends.pv)       f *= 1 - 0.20 * Math.min(1, (year - 2025) / 10);
    if (trends.slim)     f *= 1 - 0.12 * Math.min(1, (year - 2025) / 10);
    return f;
  })();

  const calcParams = { scenario, year, pubPct, activeSegs, trendFactor };

  // ── Bereken alle wijken ───────────────────────────────────────────
  const wijkResults = gemeente.wijken.map(w => ({ wijk:w, data:calcWijk(w, calcParams) }));
  const totLP    = wijkResults.reduce((s,r) => s + r.data.totLP, 0);
  const totMwh   = wijkResults.reduce((s,r) => s + r.data.totMwh, 0);
  const totCapex = wijkResults.reduce((s,r) => s + r.data.totCapex, 0);
  const bijkomend = Math.max(0, totLP - huidigLP);

  // ── Tijdreeks voor grafieken ──────────────────────────────────────
  const tijdreeks = YEARS.map(yr => {
    const p = { scenario, year:yr, pubPct, activeSegs, trendFactor };
    const res = gemeente.wijken.map(w => calcWijk(w, p));
    const lp  = res.reduce((s,r) => s + r.totLP, 0);
    const mwh = res.reduce((s,r) => s + r.totMwh, 0);
    const cap = res.reduce((s,r) => s + r.totCapex, 0);
    const bijk = Math.max(0, lp - huidigLP);
    return { jaar:yr, 'Laadpunten nodig':lp, 'Bijkomend':bijk, 'MWh/jaar':Math.round(mwh), 'CAPEX (€K)':Math.round(cap/1000) };
  });

  // ── Initialiseer kaart ────────────────────────────────────────────
  useEffect(() => {
    if (mapInstance.current) return;
    mapInstance.current = L.map(mapRef.current, {
      center: gemeente.center, zoom: gemeente.zoom,
      zoomControl: false,
    });
    L.control.zoom({ position:'topright' }).addTo(mapInstance.current);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
      maxZoom:19,
    }).addTo(mapInstance.current);
  }, []);

  // ── Switch gemeente ───────────────────────────────────────────────
  useEffect(() => {
    if (!mapInstance.current) return;
    mapInstance.current.setView(gemeente.center, gemeente.zoom, { animate:true });
    setSelectedWijk(null);
    setExistingPalen([]);
    loadBestaandePalen();
  }, [gemId]);

  // ── Load bestaande palen via Overpass ─────────────────────────────
  const loadBestaandePalen = useCallback(async () => {
    setLoadingPalen(true);
    const [s,w,n,e] = gemeente.bbox;
    const query = `[out:json][timeout:25];(node["amenity"="charging_station"](${s},${w},${n},${e});way["amenity"="charging_station"](${s},${w},${n},${e}););out center;`;
    try {
      const resp = await fetch('https://overpass-api.de/api/interpreter', {
        method:'POST', body:'data='+encodeURIComponent(query),
      });
      const json = await resp.json();
      setExistingPalen(json.elements || []);
    } catch(e) {
      console.warn('Overpass offline, gebruik fallback');
      setExistingPalen([]);
    }
    setLoadingPalen(false);
  }, [gemId]);

  useEffect(() => { loadBestaandePalen(); }, [gemId]);

  // ── Update wijklagen ──────────────────────────────────────────────
  useEffect(() => {
    if (!mapInstance.current) return;

    // Verwijder oude lagen
    if (wijkLayerRef.current) mapInstance.current.removeLayer(wijkLayerRef.current);
    if (projLayerRef.current) mapInstance.current.removeLayer(projLayerRef.current);

    const wijkGroup = L.layerGroup();
    const projGroup = L.layerGroup();

    wijkResults.forEach(({ wijk, data }) => {
      const fillColor = wijkFillColor(data.totLP);
      // Cirkeloverlay per wijk (radius ∝ LP-behoefte)
      const radius = 300 + data.totLP * 18;
      const circle = L.circle([wijk.lat, wijk.lng], {
        radius, color: fillColor, weight:2, fillColor, fillOpacity:0.18,
      });
      circle.bindTooltip(`<b>${wijk.naam}</b><br>${data.totLP} LP nodig · ${Math.round(data.totMwh)} MWh/jr`, { sticky:true });
      circle.on('click', () => setSelectedWijk(wijk.id));
      wijkGroup.addLayer(circle);

      // Wijknaam label
      const label = L.marker([wijk.lat, wijk.lng], {
        icon: L.divIcon({
          className:'',
          html:`<div style="font-family:'Segoe UI',sans-serif;font-size:11px;font-weight:700;color:#1a2830;text-shadow:0 0 3px rgba(255,255,255,0.9);white-space:nowrap;pointer-events:none">${wijk.naam}</div>`,
          iconAnchor:[0,0],
        }),
      });
      wijkGroup.addLayer(label);

      // Geprojecteerde palen
      let pIdx = 0;
      const addProjPalen = (count, color, popupContent) => {
        for (let i = 0; i < Math.min(count, 6); i++) {
          const angle = (pIdx * 137.5) * Math.PI / 180;
          const r = 0.004 + (pIdx % 3) * 0.002;
          const lat = wijk.lat + r * Math.cos(angle);
          const lng = wijk.lng + r * Math.sin(angle) / Math.cos(wijk.lat * Math.PI / 180);
          pIdx++;
          const m = L.marker([lat, lng], { icon: makeIcon(color, 12) });
          m.bindPopup(popupContent);
          projGroup.addLayer(m);
        }
      };

      const totAC  = Object.values(data.breakdown).reduce((s,b) => s + b.ac + b.acs, 0);
      const totDC  = Object.values(data.breakdown).reduce((s,b) => s + b.dc, 0);
      const totOV  = data.breakdown.ov ? data.breakdown.ov.dcu : 0;

      const paalPopup = (type, power, capex) => `
        <div style="font-family:'Segoe UI',sans-serif;min-width:180px">
          <div style="font-weight:800;font-size:13px;color:#1a2830;margin-bottom:6px">${wijk.naam}</div>
          <div style="background:#f4f8f7;border-radius:5px;padding:8px;font-size:11px;line-height:1.7">
            <div><b>Type:</b> ${type}</div>
            <div><b>Vermogen:</b> ${power}</div>
            <div><b>Segment:</b> Geaggregeerd</div>
            <div><b>Jaar:</b> ${year}</div>
            <div><b>CAPEX:</b> € ${capex.toLocaleString('nl-NL')}</div>
            <div><b>Protocol:</b> OCPP 2.0.1</div>
            <div><b>Slim laden:</b> ✓ Verplicht</div>
          </div>
        </div>`;

      if (totAC > 0) addProjPalen(totAC, '#9EC5CB', paalPopup('AC Normaal / Snel', '7–22 kW', 4500));
      if (totDC > 0) addProjPalen(totDC, '#D0AC41', paalPopup('DC Snel', '50–150 kW', 29000));
      if (totOV > 0) addProjPalen(totOV, '#c89ecb', paalPopup('DC Ultrafast / OV Hub', '>150 kW', 82000));
    });

    wijkGroup.addTo(mapInstance.current);
    projGroup.addTo(mapInstance.current);
    wijkLayerRef.current = wijkGroup;
    projLayerRef.current = projGroup;
  }, [gemId, scenario, year, pubPct, activeSegs, trendFactor]);

  // ── Update bestaande palen laag ───────────────────────────────────
  useEffect(() => {
    if (!mapInstance.current) return;
    if (existLayerRef.current) mapInstance.current.removeLayer(existLayerRef.current);
    const group = L.layerGroup();
    existingPalen.forEach(el => {
      const lat = el.lat || el.center?.lat;
      const lng = el.lon || el.center?.lon;
      if (!lat) return;
      const t = el.tags || {};
      const m = L.marker([lat, lng], { icon: makeIcon('#4CAF50', 10, true) });
      m.bindPopup(`
        <div style="font-family:'Segoe UI',sans-serif;min-width:160px">
          <div style="font-weight:800;font-size:12px;margin-bottom:4px">Bestaande laadpaal</div>
          <div style="font-size:11px;line-height:1.6">
            <div><b>Naam:</b> ${t.name || t.operator || '–'}</div>
            <div><b>Netwerk:</b> ${t.network || t.operator || '–'}</div>
            <div><b>Capaciteit:</b> ${t.capacity || '–'}</div>
            <div style="font-size:10px;color:#888;margin-top:4px">Bron: OpenStreetMap</div>
          </div>
        </div>`);
      group.addLayer(m);
    });
    group.addTo(mapInstance.current);
    existLayerRef.current = group;
  }, [existingPalen]);

  // ── Geselecteerde wijk ────────────────────────────────────────────
  const selectedResult = selectedWijk
    ? wijkResults.find(r => r.wijk.id === selectedWijk)
    : null;

  // ── Toggle helpers ────────────────────────────────────────────────
  const toggleSeg   = (sid) => setActiveSegs(s => ({ ...s, [sid]: !s[sid] }));
  const toggleTrend = (t)   => setTrends(s => ({ ...s, [t]: !s[t] }));

  // ── Format helpers ────────────────────────────────────────────────
  const fmtEur = (n) => n >= 1e6 ? `€ ${(n/1e6).toFixed(1)}M` : `€ ${Math.round(n/1000)}K`;
  const fmtNum = (n) => Math.round(n).toLocaleString('nl-NL');

  const CHART_COLORS = ['#9EC5CB','#B7D2AE','#D0AC41','#c89ecb','#E8683A'];

  return (
    <div style={styles.app}>
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        ::-webkit-scrollbar { width:4px } ::-webkit-scrollbar-track { background:#0a1620 }
        ::-webkit-scrollbar-thumb { background:#1e3a46; border-radius:2px }
        input[type=range]::-webkit-slider-thumb { cursor:pointer }
      `}</style>

      {/* ── SIDEBAR ── */}
      <div style={styles.sidebar}>
        <div style={styles.sidebarTop}>
          <div style={styles.logo}>
            <span style={styles.logoText}>belli</span>
            <span style={styles.logoSub}>strategisch laadplan</span>
          </div>
        </div>

        <div style={styles.sidebarScroll}>

          {/* Gemeente selector */}
          <div style={styles.sideSection}>
            <div style={styles.sideHdr}>Gemeente</div>
            <div style={styles.sideBody}>
              <div style={styles.gemGrid}>
                {Object.values(GEMEENTEN).map(g => (
                  <div key={g.id}
                    style={styles.gemBtn(gemId===g.id, g.kleur)}
                    onClick={() => setGemId(g.id)}>
                    {g.naam}
                  </div>
                ))}
              </div>
              <div style={{ marginTop:8, fontSize:10, color:C.textDim }}>
                {gemeente.inwoners.toLocaleString('nl-NL')} inwoners · {gemeente.voertuigen.toLocaleString('nl-NL')} voertuigen
              </div>
            </div>
          </div>

          {/* Scenario & jaar */}
          <div style={styles.sideSection}>
            <div style={styles.sideHdr}>Scenario & jaar</div>
            <div style={styles.sideBody}>
              <div style={styles.ctrlRow}>
                <div style={styles.ctrlLabel}>
                  <span>EV-scenario</span>
                  <span style={styles.ctrlVal}>{SCENARIOS.find(s=>s.id===scenario)?.naam}</span>
                </div>
                <input type="range" style={styles.slider} min={0} max={2} step={1}
                  value={['laag','basis','hoog'].indexOf(scenario)}
                  onChange={e => setScenario(['laag','basis','hoog'][e.target.value])} />
              </div>
              <div style={styles.yearTabs}>
                {[2025,2027,2030,2035].map(y => (
                  <div key={y} style={styles.yearTab(year===y)} onClick={() => setYear(y)}>{y}</div>
                ))}
              </div>
            </div>
          </div>

          {/* Parameters */}
          <div style={styles.sideSection}>
            <div style={styles.sideHdr}>Parameters</div>
            <div style={styles.sideBody}>
              <div style={styles.ctrlRow}>
                <div style={styles.ctrlLabel}>
                  <span>% aangewezen op publiek laden</span>
                  <span style={styles.ctrlVal}>{pubPct}%</span>
                </div>
                <input type="range" style={styles.slider} min={10} max={65} step={1}
                  value={pubPct} onChange={e => setPubPct(+e.target.value)} />
              </div>
              <div style={styles.ctrlRow}>
                <div style={styles.ctrlLabel}>
                  <span>Huidig # laadpunten</span>
                  <span style={styles.ctrlVal}>{huidigLP}</span>
                </div>
                <input type="range" style={styles.slider} min={0} max={500} step={10}
                  value={huidigLP} onChange={e => setHuidigLP(+e.target.value)} />
              </div>
            </div>
          </div>

          {/* Segment filter */}
          <div style={styles.sideSection}>
            <div style={styles.sideHdr}>Doelgroepen</div>
            <div style={styles.sideBody}>
              <div style={styles.segGrid}>
                {Object.entries(SEG_PARAMS).map(([sid, p]) => (
                  <div key={sid} style={styles.segBtn(activeSegs[sid], p.color)}
                    onClick={() => toggleSeg(sid)}>{p.label}</div>
                ))}
              </div>
            </div>
          </div>

          {/* Trendscenario's */}
          <div style={styles.sideSection}>
            <div style={styles.sideHdr}>Trendscenario's</div>
            <div style={styles.sideBody}>
              {[
                ['carshare', 'Car sharing (–18% vraag 2035)'],
                ['v2g',      'Bidirectioneel laden V2G (–28%)'],
                ['pv',       'Energiedelen / lokale PV (–20%)'],
                ['slim',     'Slim laden demand response (–12%)'],
              ].map(([t, label]) => (
                <div key={t} style={styles.trendRow}>
                  <span style={styles.trendLabel}>{label}</span>
                  <div style={styles.toggle(trends[t])} onClick={() => toggleTrend(t)}>
                    <div style={styles.toggleKnob(trends[t])} />
                  </div>
                </div>
              ))}
              {Object.values(trends).some(Boolean) && (
                <div style={{ fontSize:10, color:C.gold, marginTop:4, fontWeight:700 }}>
                  Gecombineerd effect: –{Math.round((1-trendFactor)*100)}% vraag
                </div>
              )}
            </div>
          </div>

          {/* Totalen */}
          <div style={styles.sideSection}>
            <div style={styles.sideHdr}>Totaal {gemeente.naam} – {year}</div>
            <div style={styles.sideBody}>
              <div style={styles.statGrid}>
                {[
                  { label:'LP nodig', val:fmtNum(totLP), color:C.teal, sub:'publiek domein' },
                  { label:'Bijkomend', val:fmtNum(bijkomend), color:C.gold, sub:'t.o.v. huidig' },
                  { label:'MWh/jaar', val:fmtNum(totMwh), color:C.teal, sub:'publieke vraag' },
                  { label:'CAPEX', val:fmtEur(totCapex), color:C.warn, sub:'indicatief totaal' },
                ].map(({ label, val, color, sub }) => (
                  <div key={label} style={styles.statCard()}>
                    <div style={styles.statLabel}>{label}</div>
                    <div style={styles.statVal(color)}>{val}</div>
                    <div style={styles.statSub}>{sub}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>{/* end sidebarScroll */}
      </div>{/* end sidebar */}

      {/* ── KAART + GRAFIEK AREA ── */}
      <div style={styles.mapArea}>

        {/* Map header */}
        <div style={styles.mapHeader}>
          <div style={styles.mapTitle}>
            {gemeente.naam} · Strategisch Laadplan {year}
          </div>
          <div style={styles.mapMeta}>
            <span>
              <span style={styles.liveDot}></span>
              {loadingPalen ? 'Laden…' : `${existingPalen.length} bestaande palen (OSM)`}
            </span>
            <span>{wijkResults.length} wijken · scenario: <b style={{color:C.teal}}>{SCENARIOS.find(s=>s.id===scenario)?.naam}</b></span>
          </div>
        </div>

        {/* Leaflet kaart */}
        <div style={styles.mapContainer} ref={mapRef} />

        {/* Wijk detail overlay */}
        {selectedResult && (
          <div style={styles.wijkOverlay}>
            <span style={styles.closeBtn} onClick={() => setSelectedWijk(null)}>×</span>
            <div style={styles.wijkTitle}>{selectedResult.wijk.naam}</div>
            <div style={styles.wijkSub}>
              {selectedResult.data.totLP > 25 ? '🔴 HOGE' : selectedResult.data.totLP > 15 ? '🟡 MIDDEL' : '🟢 LAGE'} PRIORITEIT · {year}
            </div>
            {[
              ['Inwoners', fmtNum(selectedResult.wijk.inwoners)],
              ['Voertuigen', fmtNum(selectedResult.wijk.voertuigen)],
              ['% Appartementen', Math.round(selectedResult.wijk.aandeel_app*100)+'%'],
              ['EVs publiek laden', fmtNum(selectedResult.data.pubEvs)],
              ['— — —', ''],
              ['LP nodig', selectedResult.data.totLP],
              ['AC normaal/snel', selectedResult.data.totAC + selectedResult.data.totACS],
              ['DC snel', selectedResult.data.totDC],
              ['DC ultrafast/OV', selectedResult.data.totDCU],
              ['Energie (MWh/jr)', Math.round(selectedResult.data.totMwh)],
              ['CAPEX indicatief', fmtEur(selectedResult.data.totCapex)],
              ['Gem. bijdrage stad', fmtEur(selectedResult.data.totCapex * 0.15)],
            ].map(([l, v]) => l === '— — —' ? (
              <div key={l} style={{ borderTop:`1px solid ${C.border}`, margin:'6px 0' }} />
            ) : (
              <div key={l} style={styles.dpRow}>
                <span style={styles.dpLabel}>{l}</span>
                <span style={styles.dpVal}>{v}</span>
              </div>
            ))}
          </div>
        )}

        {/* Legenda */}
        <div style={styles.legendBox}>
          {[
            [styles.legDot('#4CAF50','#4CAF50'), 'Bestaande laadpaal (OSM)'],
            [styles.legDot('#9EC5CB','#9EC5CB'), 'Geprojecteerde AC-paal'],
            [styles.legDot('#D0AC41','#D0AC41'), 'Geprojecteerde DC-paal'],
            [styles.legDot('#c89ecb','#c89ecb'), 'OV / Ultrafast hub'],
            [styles.legRect('#2B5F6E44'),         'Lage behoefte (<15 LP)'],
            [styles.legRect('#D0AC4166'),         'Middelhoge behoefte'],
            [styles.legRect('#E8683A66'),         'Hoge behoefte (>30 LP)'],
          ].map(([dotStyle, label], i) => (
            <div key={i} style={styles.legItem}>
              <div style={dotStyle} />
              {label}
            </div>
          ))}
        </div>

        {/* Grafieken onderaan */}
        <div style={styles.chartPanel}>
          <div style={styles.chartTabs}>
            {[
              ['energie', 'Energievraag MWh'],
              ['lp',      'Laadpunten'],
              ['capex',   'CAPEX (€K)'],
            ].map(([id, label]) => (
              <div key={id} style={styles.chartTab(chartTab===id)} onClick={() => setChartTab(id)}>{label}</div>
            ))}
          </div>
          <ResponsiveContainer width="100%" height={130}>
            {chartTab === 'lp' ? (
              <LineChart data={tijdreeks} margin={{ top:0, right:10, left:-20, bottom:0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e3a46" />
                <XAxis dataKey="jaar" tick={{ fill:C.textDim, fontSize:10 }} />
                <YAxis tick={{ fill:C.textDim, fontSize:10 }} />
                <Tooltip contentStyle={{ background:C.panelBg, border:`1px solid ${C.border}`, fontSize:11 }} />
                <Legend wrapperStyle={{ fontSize:10, color:C.textDim }} />
                <Line dataKey="Laadpunten nodig" stroke={C.teal} strokeWidth={2} dot={false} />
                <Line dataKey="Bijkomend" stroke={C.warn} strokeWidth={2} dot={false} strokeDasharray="4 2" />
              </LineChart>
            ) : chartTab === 'capex' ? (
              <BarChart data={tijdreeks.filter((_, i) => i % 2 === 0)} margin={{ top:0, right:10, left:-20, bottom:0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e3a46" />
                <XAxis dataKey="jaar" tick={{ fill:C.textDim, fontSize:10 }} />
                <YAxis tick={{ fill:C.textDim, fontSize:10 }} />
                <Tooltip contentStyle={{ background:C.panelBg, border:`1px solid ${C.border}`, fontSize:11 }} />
                <Bar dataKey="CAPEX (€K)" fill={C.gold} radius={[3,3,0,0]} />
              </BarChart>
            ) : (
              <LineChart data={tijdreeks} margin={{ top:0, right:10, left:-20, bottom:0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e3a46" />
                <XAxis dataKey="jaar" tick={{ fill:C.textDim, fontSize:10 }} />
                <YAxis tick={{ fill:C.textDim, fontSize:10 }} />
                <Tooltip contentStyle={{ background:C.panelBg, border:`1px solid ${C.border}`, fontSize:11 }} />
                <Line dataKey="MWh/jaar" stroke={C.green} strokeWidth={2} dot={false} />
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>

      </div>{/* end mapArea */}
    </div>
  );
}

// ── Gemeente Onboarding integratie (append) ─────────────────────────
// Dit blok exporteert de useGemeenteManager hook voor gebruik in App.js
export function useGemeenteManager(initialGemeenten) {
  const [gemeenten, setGemeenten] = React.useState(initialGemeenten);
  const voegGemeenteToe = React.useCallback((nieuweGemeente) => {
    setGemeenten(prev => ({ ...prev, [nieuweGemeente.id]: nieuweGemeente }));
  }, []);
  return { gemeenten, voegGemeenteToe };
}
