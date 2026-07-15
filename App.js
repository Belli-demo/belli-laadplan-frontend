import React, { useState, useCallback } from 'react';
import { SEG_PARAMS } from '../gemeenteData';

// ── Kleuren ─────────────────────────────────────────────────────────
const C = {
  darkBg:'#0d1c22', panelBg:'#122028', border:'#1e3a46',
  teal:'#9EC5CB', tealDark:'#2B5F6E', green:'#B7D2AE',
  darkGreen:'#3A6B4A', gold:'#D0AC41', warn:'#E8683A',
  text:'#e0eef2', textMid:'#7aacb4', textDim:'#3a6a74',
};

// ── Wijktype → standaard segmentmix ─────────────────────────────────
const WIJKTYPE_PRESETS = {
  centrum:      { label:'Centrum / Binnenstad', seg:{ bew:0.38, bez:0.42, log:0.12, ov:0.08 }, app:0.55 },
  residentieel: { label:'Residentieel',          seg:{ bew:0.68, bez:0.18, log:0.10, ov:0.04 }, app:0.22 },
  gemengd:      { label:'Gemengd wonen/werken',  seg:{ bew:0.52, bez:0.28, log:0.14, ov:0.06 }, app:0.32 },
  industrieel:  { label:'Industrie / Bedrijven', seg:{ bew:0.22, bez:0.18, log:0.52, ov:0.08 }, app:0.10 },
  studentenwijk:{ label:'Studentenwijk / Campus', seg:{ bew:0.45, bez:0.35, log:0.12, ov:0.08 }, app:0.65 },
  landelijk:    { label:'Landelijk / Randstedelijk', seg:{ bew:0.72, bez:0.15, log:0.10, ov:0.03 }, app:0.12 },
};

// ── Stap-labels ──────────────────────────────────────────────────────
const STAPPEN = ['Gemeente zoeken', 'Wijken & Data', 'Segmentmix', 'Bevestiging'];

// ── API calls ────────────────────────────────────────────────────────

// Nominatim: gemeente → center, bbox, NIS-code
async function fetchNominatim(naam, land) {
  const q = encodeURIComponent(`${naam}, ${land}`);
  const url = `https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=3&addressdetails=1&countrycodes=${land === 'België' ? 'be' : 'nl'}`;
  const resp = await fetch(url, { headers:{ 'User-Agent':'Belli-Laadkaart/1.0 (info@belli.eu)' } });
  if (!resp.ok) throw new Error('Nominatim niet beschikbaar');
  const data = await resp.json();
  // Filter op municipality/city
  const match = data.find(d => ['municipality','city','town','village'].includes(d.type) || d.class === 'boundary')
    || data[0];
  if (!match) throw new Error(`Gemeente "${naam}" niet gevonden`);
  const bb = match.boundingbox; // [south, north, west, east]
  return {
    center: [parseFloat(match.lat), parseFloat(match.lon)],
    bbox:   [parseFloat(bb[0]), parseFloat(bb[2]), parseFloat(bb[1]), parseFloat(bb[3])],
    displayName: match.display_name.split(',').slice(0,2).join(', '),
    osmId: match.osm_id,
    type:  match.type,
  };
}

// Overpass: haal deelgemeenten/wijken op als punten voor initiële wijkindeling
async function fetchWijkenViaOverpass(bbox) {
  const [s, w, n, e] = bbox;
  // Haal suburbs/districts/neighbourhoods op
  const query = `[out:json][timeout:20];
(
  node["place"~"suburb|neighbourhood|district|quarter"](${s},${w},${n},${e});
  node["admin_level"~"9|10"](${s},${w},${n},${e});
);
out;`;
  const resp = await fetch('https://overpass-api.de/api/interpreter', {
    method:'POST', body:'data='+encodeURIComponent(query),
  });
  if (!resp.ok) return [];
  const json = await resp.json();
  return json.elements
    .filter(el => el.tags?.name)
    .map(el => ({
      id:   `WK_${el.id}`,
      naam: el.tags.name,
      lat:  el.lat,
      lng:  el.lon,
      type: el.tags.place || el.tags.admin_level || 'wijk',
    }))
    .slice(0, 20); // max 20 wijken
}

// ══════════════════════════════════════════════════════════════════════
// COMPONENT
// ══════════════════════════════════════════════════════════════════════
export default function GemeenteOnboarding({ onComplete, onClose }) {
  const [stap,          setStap]         = useState(0);
  const [zoekNaam,      setZoekNaam]     = useState('');
  const [land,          setLand]         = useState('België');
  const [loading,       setLoading]      = useState(false);
  const [error,         setError]        = useState('');

  // Gemeente data
  const [geoData,       setGeoData]      = useState(null);
  const [wijken,        setWijken]       = useState([]);
  const [gemeenteNaam,  setGemeenteNaam] = useState('');
  const [inwoners,      setInwoners]     = useState('');
  const [voertuigen,    setVoertuigen]   = useState('');

  // Wijk editing
  const [editIdx,       setEditIdx]      = useState(null);

  const kleur = C.tealDark;

  // ── Stap 1: zoek gemeente ────────────────────────────────────────
  const zoekGemeente = useCallback(async () => {
    if (!zoekNaam.trim()) return;
    setLoading(true); setError('');
    try {
      const geo = await fetchNominatim(zoekNaam.trim(), land);
      setGeoData(geo);
      setGemeenteNaam(zoekNaam.trim());

      // Schat inwoners obv bbox-oppervlakte (ruwe proxy)
      const latDiff  = geo.bbox[2] - geo.bbox[0];
      const lngDiff  = geo.bbox[3] - geo.bbox[1];
      const km2      = Math.round(latDiff * lngDiff * 12000);
      const inwSchat  = Math.min(Math.max(km2 * 80, 5000), 500000);
      setInwoners(String(Math.round(inwSchat / 1000) * 1000));
      setVoertuigen(String(Math.round(inwSchat * 0.45 / 100) * 100));

      // Haal wijken op via Overpass
      const wkData = await fetchWijkenViaOverpass(geo.bbox);
      if (wkData.length > 0) {
        setWijken(wkData.map((w, i) => ({
          ...w,
          id:          `NK${String(i+1).padStart(2,'0')}`,
          inwoners:    Math.round(inwSchat / Math.max(wkData.length, 1) / 100) * 100,
          voertuigen:  Math.round(inwSchat * 0.45 / Math.max(wkData.length, 1) / 50) * 50,
          aandeel_app: 0.25,
          wijktype:    'residentieel',
          seg:         { ...WIJKTYPE_PRESETS.residentieel.seg },
          actief:      true,
        })));
      } else {
        // Fallback: maak 4 standaard wijken
        const kwarten = ['Noord','Zuid','Oost','West'];
        const offsets = [[0.01,0],[-0.01,0],[0,0.01],[0,−0.01]];
        setWijken(kwarten.map((naam, i) => ({
          id:          `NK0${i+1}`,
          naam,
          lat:         geo.center[0] + (offsets[i]?.[0] || 0),
          lng:         geo.center[1] + (offsets[i]?.[1] || 0),
          inwoners:    Math.round(inwSchat / 4 / 100) * 100,
          voertuigen:  Math.round(inwSchat * 0.45 / 4 / 50) * 50,
          aandeel_app: 0.25,
          wijktype:    'residentieel',
          seg:         { ...WIJKTYPE_PRESETS.residentieel.seg },
          actief:      true,
        })));
      }
      setStap(1);
    } catch(e) {
      setError(e.message);
    }
    setLoading(false);
  }, [zoekNaam, land]);

  // ── Stap 2: wijktype wijzigen → autovul seg + app ────────────────
  const setWijktype = (idx, type) => {
    const preset = WIJKTYPE_PRESETS[type];
    setWijken(ws => ws.map((w, i) => i === idx
      ? { ...w, wijktype: type, seg: { ...preset.seg }, aandeel_app: preset.app }
      : w));
  };

  const updateWijk = (idx, field, val) => {
    setWijken(ws => ws.map((w, i) => i === idx ? { ...w, [field]: val } : w));
  };

  const toggleWijk = (idx) => {
    setWijken(ws => ws.map((w, i) => i === idx ? { ...w, actief: !w.actief } : w));
  };

  const addWijk = () => {
    const n = wijken.length + 1;
    setWijken(ws => [...ws, {
      id:`NK${String(n).padStart(2,'0')}`, naam:`Wijk ${n}`,
      lat: geoData.center[0] + (Math.random()-0.5)*0.02,
      lng: geoData.center[1] + (Math.random()-0.5)*0.02,
      inwoners: 5000, voertuigen: 2000, aandeel_app: 0.25,
      wijktype:'residentieel', seg:{ ...WIJKTYPE_PRESETS.residentieel.seg }, actief:true,
    }]);
  };

  // ── Stap 4: genereer gemeente-object ─────────────────────────────
  const bevestig = () => {
    const actieveWijken = wijken.filter(w => w.actief);
    const id = gemeenteNaam.toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_]/g, '');
    const gemeente = {
      id, naam: gemeenteNaam,
      provincie: land,
      inwoners:  parseInt(inwoners) || 50000,
      voertuigen:parseInt(voertuigen) || 22000,
      center:    geoData.center,
      zoom:      13,
      bbox:      geoData.bbox,
      kleur,
      wijken:    actieveWijken.map(w => ({
        id:          w.id,
        naam:        w.naam,
        inwoners:    parseInt(w.inwoners) || 5000,
        voertuigen:  parseInt(w.voertuigen) || 2000,
        aandeel_app: parseFloat(w.aandeel_app) || 0.25,
        lat:         w.lat,
        lng:         w.lng,
        seg:         w.seg,
      })),
    };
    onComplete(gemeente);
  };

  // ── Stijlen ───────────────────────────────────────────────────────
  const s = {
    overlay:  { position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', zIndex:2000, display:'flex', alignItems:'center', justifyContent:'center' },
    modal:    { width:680, maxHeight:'90vh', background:C.panelBg, border:`1px solid ${C.border}`, borderRadius:12, display:'flex', flexDirection:'column', overflow:'hidden', boxShadow:'0 20px 60px rgba(0,0,0,0.6)' },
    header:   { padding:'18px 24px 14px', borderBottom:`1px solid ${C.border}`, display:'flex', justifyContent:'space-between', alignItems:'flex-start' },
    title:    { fontSize:16, fontWeight:800, color:C.text },
    subtitle: { fontSize:11, color:C.textDim, marginTop:3 },
    close:    { cursor:'pointer', color:C.textDim, fontSize:20, lineHeight:1 },
    steps:    { display:'flex', padding:'0 24px', borderBottom:`1px solid ${C.border}`, background:'#0a1620' },
    step:     (active, done) => ({ padding:'10px 0', marginRight:24, fontSize:11, fontWeight:700, color: done ? C.green : active ? C.teal : C.textDim, borderBottom:`2px solid ${done ? C.green : active ? C.teal : 'transparent'}`, cursor: done ? 'pointer' : 'default' }),
    body:     { flex:1, overflowY:'auto', padding:'20px 24px' },
    footer:   { padding:'14px 24px', borderTop:`1px solid ${C.border}`, display:'flex', justifyContent:'space-between', alignItems:'center' },
    input:    { width:'100%', background:'#0a1620', border:`1px solid ${C.border}`, borderRadius:6, padding:'8px 12px', color:C.text, fontSize:13, outline:'none' },
    label:    { fontSize:11, color:C.textMid, marginBottom:4, display:'block' },
    row:      { marginBottom:14 },
    btn:      (primary) => ({ padding:'8px 20px', borderRadius:6, fontSize:12, fontWeight:700, cursor:'pointer', border:'none', background: primary ? C.tealDark : '#1e3a46', color:'#fff', transition:'all 0.15s' }),
    error:    { background:'#3a0a0a', border:`1px solid ${C.warn}`, borderRadius:6, padding:'8px 12px', fontSize:11, color:C.warn, marginTop:8 },
    tag:      (active) => ({ display:'inline-block', padding:'3px 10px', borderRadius:4, fontSize:10, fontWeight:700, cursor:'pointer', margin:'3px 3px 3px 0', border:`1px solid ${active ? C.tealDark : C.border}`, background: active ? C.tealDark+'44' : 'transparent', color: active ? C.teal : C.textDim }),
    wijkCard: (actief) => ({ background:'#0a1620', border:`1px solid ${actief ? C.border : '#0f2430'}`, borderRadius:8, padding:'12px 14px', marginBottom:8, opacity: actief ? 1 : 0.45 }),
    grid2:    { display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 },
    grid3:    { display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8 },
    hint:     { fontSize:10, color:C.textDim, marginTop:3, lineHeight:1.5 },
    divider:  { borderTop:`1px solid ${C.border}`, margin:'16px 0' },
    badge:    (color) => ({ display:'inline-block', padding:'2px 8px', borderRadius:3, fontSize:9, fontWeight:700, background:color+'22', color, border:`1px solid ${color}44` }),
    segRow:   { display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:6 },
    segLabel: { fontSize:11, color:C.textMid },
    segPct:   { fontSize:12, fontWeight:700, color:C.teal },
    autoTag:  { fontSize:9, color:C.gold, background:'#D0AC4122', padding:'1px 6px', borderRadius:3, marginLeft:6 },
  };

  // ── Progressiebar ─────────────────────────────────────────────────
  const Progress = () => (
    <div style={s.steps}>
      {STAPPEN.map((naam, i) => (
        <div key={i} style={s.step(i===stap, i<stap)}
          onClick={() => i < stap && setStap(i)}>
          {i < stap ? '✓ ' : ''}{naam}
        </div>
      ))}
    </div>
  );

  const totaalInwoners = wijken.filter(w=>w.actief).reduce((s,w) => s + (parseInt(w.inwoners)||0), 0);

  return (
    <div style={s.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={s.modal}>

        {/* Header */}
        <div style={s.header}>
          <div>
            <div style={s.title}>Nieuwe gemeente toevoegen</div>
            <div style={s.subtitle}>Automatisch ophalen via OpenStreetMap &amp; Overpass · Handmatig bijstellen waar nodig</div>
          </div>
          <span style={s.close} onClick={onClose}>×</span>
        </div>

        <Progress />

        <div style={s.body}>

          {/* ══ STAP 0: ZOEKEN ══════════════════════════════════════ */}
          {stap === 0 && (
            <div>
              <div style={s.row}>
                <label style={s.label}>Gemeentenaam</label>
                <input style={s.input} value={zoekNaam}
                  onChange={e => setZoekNaam(e.target.value)}
                  onKeyDown={e => e.key==='Enter' && zoekGemeente()}
                  placeholder="bijv. Mechelen, Hasselt, Breda…" autoFocus />
              </div>
              <div style={s.row}>
                <label style={s.label}>Land</label>
                <div style={{ display:'flex', gap:8 }}>
                  {['België','Nederland'].map(l => (
                    <div key={l} style={s.tag(land===l)} onClick={() => setLand(l)}>{l}</div>
                  ))}
                </div>
              </div>

              {error && <div style={s.error}>⚠ {error}</div>}

              <div style={{ marginTop:16, padding:'12px 14px', background:'#0a1620', borderRadius:8, fontSize:11, color:C.textDim, lineHeight:1.8 }}>
                <div style={{ fontWeight:700, color:C.teal, marginBottom:6 }}>Wat wordt automatisch opgehaald?</div>
                <div>✓ Geografisch middelpunt &amp; bounding box (Nominatim / OSM)</div>
                <div>✓ Bestaande wijken &amp; buurtnamen (Overpass API)</div>
                <div>✓ Schatting inwoners op basis van oppervlakte</div>
                <div style={{ color:C.gold, marginTop:4 }}>⚡ Segmentmix en woningtypes: jij stelt in per wijk</div>
              </div>
            </div>
          )}

          {/* ══ STAP 1: WIJKEN & DATA ════════════════════════════════ */}
          {stap === 1 && (
            <div>
              <div style={s.grid2}>
                <div style={s.row}>
                  <label style={s.label}>Gemeente</label>
                  <input style={s.input} value={gemeenteNaam} onChange={e => setGemeenteNaam(e.target.value)} />
                </div>
                <div style={s.row}>
                  <label style={s.label}>Centrum coördinaten</label>
                  <input style={{ ...s.input, color:C.textDim }} readOnly
                    value={`${geoData?.center[0].toFixed(4)}, ${geoData?.center[1].toFixed(4)}`} />
                </div>
                <div style={s.row}>
                  <label style={s.label}>Totaal inwoners</label>
                  <input style={s.input} type="number" value={inwoners} onChange={e => setInwoners(e.target.value)} />
                  <div style={s.hint}>Bron: Statbel · leuven.be/cijfers</div>
                </div>
                <div style={s.row}>
                  <label style={s.label}>Totaal voertuigen</label>
                  <input style={s.input} type="number" value={voertuigen} onChange={e => setVoertuigen(e.target.value)} />
                  <div style={s.hint}>Bron: DIV / Febiac wagenpark</div>
                </div>
              </div>

              <div style={s.divider} />
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
                <div style={{ fontSize:12, fontWeight:700, color:C.text }}>
                  Wijken ({wijken.filter(w=>w.actief).length} actief)
                  {totaalInwoners > 0 && (
                    <span style={{ fontSize:10, color:C.textDim, marginLeft:8 }}>
                      Σ {totaalInwoners.toLocaleString('nl-NL')} inwoners
                    </span>
                  )}
                </div>
                <button style={s.btn(false)} onClick={addWijk}>+ Wijk toevoegen</button>
              </div>

              {wijken.map((wijk, idx) => (
                <div key={wijk.id} style={s.wijkCard(wijk.actief)}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <input
                        style={{ ...s.input, width:160, padding:'4px 8px', fontSize:12 }}
                        value={wijk.naam}
                        onChange={e => updateWijk(idx, 'naam', e.target.value)} />
                      <span style={s.badge(C.teal)}>{wijk.id}</span>
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <span style={{ fontSize:10, color: wijk.actief ? C.green : C.textDim }}>
                        {wijk.actief ? 'actief' : 'uitgeschakeld'}
                      </span>
                      <div style={{ width:34, height:18, borderRadius:9, background: wijk.actief ? C.darkGreen : '#1e3a46', position:'relative', cursor:'pointer' }}
                        onClick={() => toggleWijk(idx)}>
                        <div style={{ position:'absolute', top:2, left: wijk.actief ? 18 : 2, width:14, height:14, borderRadius:'50%', background:'#fff', transition:'left 0.2s' }} />
                      </div>
                    </div>
                  </div>

                  {wijk.actief && (
                    <div style={s.grid3}>
                      <div>
                        <label style={{ ...s.label, fontSize:10 }}>Inwoners</label>
                        <input style={{ ...s.input, fontSize:11, padding:'5px 8px' }}
                          type="number" value={wijk.inwoners}
                          onChange={e => updateWijk(idx, 'inwoners', e.target.value)} />
                      </div>
                      <div>
                        <label style={{ ...s.label, fontSize:10 }}>Voertuigen</label>
                        <input style={{ ...s.input, fontSize:11, padding:'5px 8px' }}
                          type="number" value={wijk.voertuigen}
                          onChange={e => updateWijk(idx, 'voertuigen', e.target.value)} />
                      </div>
                      <div>
                        <label style={{ ...s.label, fontSize:10 }}>% Appartementen</label>
                        <input style={{ ...s.input, fontSize:11, padding:'5px 8px' }}
                          type="number" min="0" max="100" step="1"
                          value={Math.round((parseFloat(wijk.aandeel_app)||0.25)*100)}
                          onChange={e => updateWijk(idx, 'aandeel_app', e.target.value/100)} />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* ══ STAP 2: SEGMENTMIX ══════════════════════════════════ */}
          {stap === 2 && (
            <div>
              <div style={{ fontSize:11, color:C.textDim, marginBottom:16, lineHeight:1.7 }}>
                De segmentmix bepaalt hoe de publieke laadvraag verdeeld is over bewoners, bezoekers,
                logistiek en OV. Kies het <strong style={{color:C.teal}}>wijktype</strong> — de mix wordt automatisch ingevuld.
                Je kunt daarna handmatig bijstellen.
              </div>

              {wijken.filter(w=>w.actief).map((wijk, origIdx) => {
                const idx = wijken.indexOf(wijk);
                const segTotaal = Object.values(wijk.seg).reduce((s,v)=>s+v,0);
                const segOk = Math.abs(segTotaal - 1) < 0.02;
                return (
                  <div key={wijk.id} style={{ ...s.wijkCard(true), marginBottom:14 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
                      <div style={{ fontSize:12, fontWeight:700, color:C.text }}>{wijk.naam}</div>
                      <span style={segOk ? s.badge(C.green) : s.badge(C.warn)}>
                        {segOk ? `✓ ${Math.round(segTotaal*100)}%` : `⚠ ${Math.round(segTotaal*100)}% ≠ 100%`}
                      </span>
                    </div>

                    <div style={{ marginBottom:10 }}>
                      <label style={s.label}>Wijktype <span style={s.autoTag}>AUTO-INVULLEN</span></label>
                      <div style={{ display:'flex', flexWrap:'wrap' }}>
                        {Object.entries(WIJKTYPE_PRESETS).map(([key, preset]) => (
                          <div key={key} style={s.tag(wijk.wijktype===key)}
                            onClick={() => setWijktype(idx, key)}>
                            {preset.label}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div style={s.grid2}>
                      {Object.entries(SEG_PARAMS).map(([sid, p]) => (
                        <div key={sid} style={s.segRow}>
                          <span style={{ ...s.segLabel, display:'flex', alignItems:'center', gap:6 }}>
                            <span style={{ width:8, height:8, borderRadius:'50%', background:p.color, display:'inline-block' }} />
                            {p.label}
                          </span>
                          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                            <input
                              type="number" min="0" max="100" step="1"
                              style={{ width:56, background:'#0f1e24', border:`1px solid ${C.border}`, borderRadius:4, padding:'3px 6px', color:C.text, fontSize:12, textAlign:'right' }}
                              value={Math.round((wijk.seg[sid]||0)*100)}
                              onChange={e => {
                                const newSeg = { ...wijk.seg, [sid]: e.target.value/100 };
                                setWijken(ws => ws.map((w,i) => i===idx ? {...w, seg:newSeg} : w));
                              }} />
                            <span style={s.segPct}>%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ══ STAP 3: BEVESTIGING ══════════════════════════════════ */}
          {stap === 3 && (
            <div>
              <div style={{ background:'#0a1620', borderRadius:8, padding:'14px 16px', marginBottom:16 }}>
                <div style={{ fontSize:13, fontWeight:800, color:C.text, marginBottom:10 }}>{gemeenteNaam}</div>
                <div style={s.grid2}>
                  {[
                    ['Centrum',     `${geoData?.center[0].toFixed(4)}, ${geoData?.center[1].toFixed(4)}`],
                    ['Bbox',        geoData?.bbox.map(v=>v.toFixed(3)).join(', ')],
                    ['Inwoners',    parseInt(inwoners).toLocaleString('nl-NL')],
                    ['Voertuigen',  parseInt(voertuigen).toLocaleString('nl-NL')],
                    ['Actieve wijken', wijken.filter(w=>w.actief).length],
                    ['Land',        land],
                  ].map(([l,v]) => (
                    <div key={l} style={{ fontSize:11 }}>
                      <span style={{ color:C.textDim }}>{l}: </span>
                      <span style={{ color:C.text, fontWeight:600 }}>{v}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ fontSize:11, fontWeight:700, color:C.text, marginBottom:8 }}>Wijken</div>
              {wijken.filter(w=>w.actief).map(wijk => (
                <div key={wijk.id} style={{ display:'flex', justifyContent:'space-between', padding:'6px 10px', background:'#0a1620', borderRadius:5, marginBottom:4, fontSize:11 }}>
                  <span style={{ color:C.text, fontWeight:600 }}>{wijk.naam}</span>
                  <span style={{ color:C.textDim }}>
                    {parseInt(wijk.inwoners).toLocaleString('nl-NL')} inw. ·{' '}
                    {Math.round(wijk.aandeel_app*100)}% app. ·{' '}
                    {wijk.wijktype}
                  </span>
                </div>
              ))}

              <div style={{ marginTop:16, padding:'10px 14px', background:'#0a2010', border:`1px solid ${C.darkGreen}`, borderRadius:6, fontSize:11, color:C.green, lineHeight:1.7 }}>
                ✓ Na bevestiging is de gemeente direct beschikbaar in de laadkaart.<br/>
                ✓ Bestaande laadpalen worden live opgehaald via OpenStreetMap.<br/>
                ✓ De simulatorparameters gelden direct voor alle wijken.
              </div>
            </div>
          )}

        </div>{/* end body */}

        {/* Footer */}
        <div style={s.footer}>
          <div style={{ fontSize:11, color:C.textDim }}>
            {stap === 0 && 'Typ een gemeentenaam en druk Enter of klik Zoeken'}
            {stap === 1 && `${wijken.filter(w=>w.actief).length} wijken gevonden via OpenStreetMap`}
            {stap === 2 && 'Segmentmix wordt automatisch ingevuld op basis van wijktype'}
            {stap === 3 && 'Klaar om toe te voegen'}
          </div>
          <div style={{ display:'flex', gap:10 }}>
            {stap > 0 && (
              <button style={s.btn(false)} onClick={() => setStap(s => s-1)}>← Terug</button>
            )}
            {stap === 0 && (
              <button style={s.btn(true)} onClick={zoekGemeente} disabled={loading}>
                {loading ? 'Zoeken…' : 'Zoeken →'}
              </button>
            )}
            {stap > 0 && stap < 3 && (
              <button style={s.btn(true)} onClick={() => setStap(s => s+1)}>
                Volgende →
              </button>
            )}
            {stap === 3 && (
              <button style={{ ...s.btn(true), background:C.darkGreen }} onClick={bevestig}>
                ✓ Gemeente toevoegen
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
