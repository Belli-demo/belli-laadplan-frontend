import React, { useState } from 'react';
import { updateGemeente } from '../api';

const C = {
  panelBg:'#122028', border:'#1e3a46', teal:'#9EC5CB',
  tealDark:'#2B5F6E', darkGreen:'#3A6B4A', gold:'#D0AC41',
  warn:'#E8683A', text:'#ffffff', textMid:'#b0d4db', textDim:'#7aacb4',
};

const WIJKTYPE_PRESETS = {
  centrum:      { label:'Centrum',           seg:{ bew:0.38, bez:0.42, log:0.12, ov:0.08 } },
  residentieel: { label:'Residentieel',       seg:{ bew:0.68, bez:0.18, log:0.10, ov:0.04 } },
  gemengd:      { label:'Gemengd',            seg:{ bew:0.52, bez:0.28, log:0.14, ov:0.06 } },
  industrieel:  { label:'Industrie',          seg:{ bew:0.22, bez:0.18, log:0.52, ov:0.08 } },
  studentenwijk:{ label:'Studentenwijk',      seg:{ bew:0.45, bez:0.35, log:0.12, ov:0.08 } },
  landelijk:    { label:'Landelijk',          seg:{ bew:0.72, bez:0.15, log:0.10, ov:0.03 } },
};

export default function GemeenteEditor({ gemeente, onSave, onClose }) {
  const [naam,      setNaam]      = useState(gemeente.naam);
  const [inwoners,  setInwoners]  = useState(gemeente.inwoners);
  const [voertuigen,setVoertuigen]= useState(gemeente.voertuigen);
  const [wijken,    setWijken]    = useState(
    (gemeente.wijken || []).map(w => ({ ...w, seg: { ...w.seg } }))
  );
  const [saving,    setSaving]    = useState(false);
  const [error,     setError]     = useState('');
  const [activeTab, setActiveTab] = useState('gemeente');

  const updateWijk = (idx, field, val) =>
    setWijken(ws => ws.map((w, i) => i === idx ? { ...w, [field]: val } : w));

  const updateSeg = (idx, sid, val) =>
    setWijken(ws => ws.map((w, i) => i === idx
      ? { ...w, seg: { ...w.seg, [sid]: parseFloat(val) / 100 } }
      : w));

  const applyPreset = (idx, type) => {
    const preset = WIJKTYPE_PRESETS[type];
    setWijken(ws => ws.map((w, i) => i === idx
      ? { ...w, wijktype: type, seg: { ...preset.seg } }
      : w));
  };

  const slaOp = async () => {
    setSaving(true); setError('');
    try {
      const bijgewerkt = {
        ...gemeente,
        naam, inwoners: parseInt(inwoners), voertuigen: parseInt(voertuigen),
        wijken,
      };
      await updateGemeente(gemeente.id, bijgewerkt);
      onSave(bijgewerkt);
      onClose();
    } catch(e) {
      setError(e.message);
    }
    setSaving(false);
  };

  const s = {
    overlay:  { position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', zIndex:2000, display:'flex', alignItems:'center', justifyContent:'center' },
    modal:    { width:620, maxHeight:'88vh', background:C.panelBg, border:`1px solid ${C.border}`, borderRadius:12, display:'flex', flexDirection:'column', overflow:'hidden', boxShadow:'0 20px 60px rgba(0,0,0,0.6)' },
    header:   { padding:'16px 22px 12px', borderBottom:`1px solid ${C.border}`, display:'flex', justifyContent:'space-between', alignItems:'center' },
    title:    { fontSize:15, fontWeight:800, color:C.text },
    close:    { cursor:'pointer', color:C.textDim, fontSize:20 },
    tabs:     { display:'flex', borderBottom:`1px solid ${C.border}`, background:'#0a1620' },
    tab:      (a) => ({ padding:'10px 20px', fontSize:11, fontWeight:700, cursor:'pointer', color: a ? C.teal : C.textDim, borderBottom: a ? `2px solid ${C.teal}` : '2px solid transparent' }),
    body:     { flex:1, overflowY:'auto', padding:'18px 22px' },
    footer:   { padding:'12px 22px', borderTop:`1px solid ${C.border}`, display:'flex', justifyContent:'space-between', alignItems:'center' },
    label:    { fontSize:11, color:C.textMid, marginBottom:4, display:'block' },
    input:    { width:'100%', background:'#0a1620', border:`1px solid ${C.border}`, borderRadius:6, padding:'7px 10px', color:C.text, fontSize:13 },
    row:      { marginBottom:14 },
    grid2:    { display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 },
    wijkCard: { background:'#0a1620', border:`1px solid ${C.border}`, borderRadius:8, padding:'12px 14px', marginBottom:10 },
    wijkName: { fontSize:12, fontWeight:800, color:C.text, marginBottom:10 },
    grid3:    { display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, marginBottom:10 },
    smallInp: { width:'100%', background:'#122028', border:`1px solid ${C.border}`, borderRadius:5, padding:'5px 8px', color:C.text, fontSize:12 },
    presets:  { display:'flex', flexWrap:'wrap', gap:4, marginBottom:8 },
    preset:   (a) => ({ padding:'3px 8px', borderRadius:4, fontSize:10, fontWeight:700, cursor:'pointer', border:`1px solid ${a ? C.tealDark : C.border}`, background: a ? C.tealDark+'44' : 'transparent', color: a ? C.teal : C.textDim }),
    segGrid:  { display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 },
    segRow:   { display:'flex', alignItems:'center', justifyContent:'space-between', fontSize:11 },
    segLabel: { color:C.textMid },
    segInp:   { width:56, background:'#0f1e24', border:`1px solid ${C.border}`, borderRadius:4, padding:'3px 6px', color:C.text, fontSize:12, textAlign:'right' },
    segSum:   (ok) => ({ fontSize:10, fontWeight:700, color: ok ? C.darkGreen : C.warn, marginTop:6 }),
    btn:      (primary) => ({ padding:'8px 18px', borderRadius:6, fontSize:12, fontWeight:700, cursor:'pointer', border:'none', background: primary ? C.tealDark : '#1e3a46', color:'#fff' }),
    error:    { fontSize:11, color:C.warn },
  };

  const SEGS = [
    { id:'bew', label:'Bewoners', color:'#2B5F6E' },
    { id:'bez', label:'Bezoekers', color:'#9EC5CB' },
    { id:'log', label:'Logistiek', color:'#D0AC41' },
    { id:'ov',  label:'OV / Bus',  color:'#c89ecb' },
  ];

  return (
    <div style={s.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={s.modal}>
        <div style={s.header}>
          <div style={s.title}>Bewerk: {gemeente.naam}</div>
          <span style={s.close} onClick={onClose}>×</span>
        </div>

        <div style={s.tabs}>
          <div style={s.tab(activeTab==='gemeente')} onClick={() => setActiveTab('gemeente')}>Gemeente</div>
          <div style={s.tab(activeTab==='wijken')}   onClick={() => setActiveTab('wijken')}>Wijken & Segmenten</div>
        </div>

        <div style={s.body}>

          {activeTab === 'gemeente' && (
            <div>
              <div style={s.row}>
                <label style={s.label}>Naam</label>
                <input style={s.input} value={naam} onChange={e => setNaam(e.target.value)} />
              </div>
              <div style={s.grid2}>
                <div style={s.row}>
                  <label style={s.label}>Inwoners</label>
                  <input style={s.input} type="number" value={inwoners} onChange={e => setInwoners(e.target.value)} />
                  <div style={{ fontSize:10, color:C.textDim, marginTop:3 }}>Bron: Statbel</div>
                </div>
                <div style={s.row}>
                  <label style={s.label}>Voertuigen</label>
                  <input style={s.input} type="number" value={voertuigen} onChange={e => setVoertuigen(e.target.value)} />
                  <div style={{ fontSize:10, color:C.textDim, marginTop:3 }}>Bron: DIV / Febiac</div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'wijken' && (
            <div>
              {wijken.map((wijk, idx) => {
                const segTotaal = Object.values(wijk.seg).reduce((s,v) => s+v, 0);
                const segOk = Math.abs(segTotaal - 1) < 0.02;
                return (
                  <div key={wijk.id} style={s.wijkCard}>
                    <div style={s.wijkName}>{wijk.naam}</div>

                    <div style={s.grid3}>
                      <div>
                        <label style={{ ...s.label, fontSize:10 }}>Inwoners</label>
                        <input style={s.smallInp} type="number" value={wijk.inwoners}
                          onChange={e => updateWijk(idx, 'inwoners', parseInt(e.target.value))} />
                      </div>
                      <div>
                        <label style={{ ...s.label, fontSize:10 }}>Voertuigen</label>
                        <input style={s.smallInp} type="number" value={wijk.voertuigen}
                          onChange={e => updateWijk(idx, 'voertuigen', parseInt(e.target.value))} />
                      </div>
                      <div>
                        <label style={{ ...s.label, fontSize:10 }}>% Appartementen</label>
                        <input style={s.smallInp} type="number" min="0" max="100"
                          value={Math.round((wijk.aandeel_app || 0.25) * 100)}
                          onChange={e => updateWijk(idx, 'aandeel_app', e.target.value / 100)} />
                      </div>
                    </div>

                    <label style={{ ...s.label, fontSize:10 }}>Wijktype (auto-invullen segmenten)</label>
                    <div style={s.presets}>
                      {Object.entries(WIJKTYPE_PRESETS).map(([key, p]) => (
                        <div key={key} style={s.preset(wijk.wijktype === key)}
                          onClick={() => applyPreset(idx, key)}>{p.label}</div>
                      ))}
                    </div>

                    <label style={{ ...s.label, fontSize:10 }}>Segmentmix (optelsom = 100%)</label>
                    <div style={s.segGrid}>
                      {SEGS.map(seg => (
                        <div key={seg.id} style={s.segRow}>
                          <span style={{ ...s.segLabel, display:'flex', alignItems:'center', gap:5 }}>
                            <span style={{ width:8, height:8, borderRadius:'50%', background:seg.color, display:'inline-block' }} />
                            {seg.label}
                          </span>
                          <div style={{ display:'flex', alignItems:'center', gap:4 }}>
                            <input style={s.segInp} type="number" min="0" max="100"
                              value={Math.round((wijk.seg[seg.id] || 0) * 100)}
                              onChange={e => updateSeg(idx, seg.id, e.target.value)} />
                            <span style={{ fontSize:11, color:C.textDim }}>%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div style={s.segSum(segOk)}>
                      {segOk ? `✓ ${Math.round(segTotaal * 100)}%` : `⚠ ${Math.round(segTotaal * 100)}% — moet 100% zijn`}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>

        <div style={s.footer}>
          <div style={s.error}>{error}</div>
          <div style={{ display:'flex', gap:10 }}>
            <button style={s.btn(false)} onClick={onClose}>Annuleren</button>
            <button style={s.btn(true)} onClick={slaOp} disabled={saving}>
              {saving ? 'Opslaan…' : '✓ Opslaan'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
