import React, { useState } from 'react';
import { updateGemeente, getFluviusPrive } from '../api';
import { evAandeelGemeente } from '../gemeenteData';

const C = {
  panelBg:'#122028', border:'#1e3a46', teal:'#9EC5CB',
  tealDark:'#2B5F6E', darkGreen:'#3A6B4A', gold:'#D0AC41',
  warn:'#E8683A', text:'#ffffff', textMid:'#b0d4db', textDim:'#7aacb4',
};

// Zelfde drie wijktypes als het gevalideerde rekenmodel (zie Leeswijzer §5).
// Een wijk kan er meerdere aanvinken (bijvoorbeeld woonwijk + bedrijventerrein
// voor een hybride wijk); calcWijk middelt dan de bijbehorende doelgroepenmix.
const WIJKTYPES = [
  { key:'binnenstad',       label:'Binnenstad' },
  { key:'woonwijk',         label:'Woonwijk' },
  { key:'bedrijventerrein', label:'Bedrijventerrein' },
];

export default function GemeenteEditor({ gemeente, onSave, onClose }) {
  const [naam,       setNaam]       = useState(gemeente.naam);
  const [inwoners,   setInwoners]   = useState(gemeente.inwoners);
  const [voertuigen, setVoertuigen] = useState(gemeente.voertuigen);
  const [welvaartsindex, setWelvaartsindex] = useState(gemeente.welvaartsindex ?? 106.9);
  const [privePctBerekend, setPrivePctBerekend] = useState(Math.round((gemeente.privePctBerekend ?? 0.5) * 100));
  const [evOverride2030, setEvOverride2030] = useState(gemeente.evAandeelOverride?.[2030] != null ? Math.round(gemeente.evAandeelOverride[2030]*1000)/10 : '');
  const [evOverride2035, setEvOverride2035] = useState(gemeente.evAandeelOverride?.[2035] != null ? Math.round(gemeente.evAandeelOverride[2035]*1000)/10 : '');
  const [postcodes, setPostcodes] = useState((gemeente.postcodes || []).join(', '));
  const [fluviusLoading, setFluviusLoading] = useState(false);
  const [fluviusResultaat, setFluviusResultaat] = useState(null);
  const [fluviusError, setFluviusError] = useState('');
  const [wijken,     setWijken]     = useState(
    (gemeente.wijken || []).map(w => ({ ...w, wijktype: w.wijktype || ['woonwijk'], ovAandeel: w.ovAandeel ?? 0 }))
  );
  const [saving,     setSaving]     = useState(false);
  const [error,      setError]      = useState('');
  const [activeTab,  setActiveTab]  = useState('gemeente');

  const HUIDIG_JAAR = 2026; // Fluvius-registraties zijn een momentopname van nu, geen toekomstprognose

  const verversVanuitFluvius = async () => {
    setFluviusLoading(true); setFluviusError(''); setFluviusResultaat(null);
    try {
      const r = await getFluviusPrive(gemeente.id);
      const evPct = evAandeelGemeente(HUIDIG_JAAR, parseFloat(welvaartsindex) || 106.9);
      const huidigeEvs = (parseInt(voertuigen) || 0) * evPct;
      const voorgesteld = huidigeEvs > 0 ? Math.min(1, r.totaalPrivePunten / huidigeEvs) : null;
      setFluviusResultaat({ ...r, huidigeEvs, voorgesteld });
    } catch(e) {
      setFluviusError(e.message);
    }
    setFluviusLoading(false);
  };

  const updateWijk = (idx, field, val) =>
    setWijken(ws => ws.map((w, i) => i === idx ? { ...w, [field]: val } : w));

  const toggleWijktype = (idx, key) =>
    setWijken(ws => ws.map((w, i) => {
      if (i !== idx) return w;
      const heeft = w.wijktype.includes(key);
      const nieuw = heeft ? w.wijktype.filter(t => t !== key) : [...w.wijktype, key];
      return { ...w, wijktype: nieuw.length ? nieuw : ['woonwijk'] }; // nooit helemaal leeg
    }));

  const slaOp = async () => {
    setSaving(true); setError('');
    try {
      const evAandeelOverride = {};
      if (evOverride2030 !== '' && evOverride2030 != null) evAandeelOverride[2030] = parseFloat(evOverride2030) / 100;
      if (evOverride2035 !== '' && evOverride2035 != null) evAandeelOverride[2035] = parseFloat(evOverride2035) / 100;

      const bijgewerkt = {
        ...gemeente,
        naam, inwoners: parseInt(inwoners), voertuigen: parseInt(voertuigen),
        welvaartsindex: parseFloat(welvaartsindex),
        privePctBerekend: parseFloat(privePctBerekend) / 100,
        evAandeelOverride: Object.keys(evAandeelOverride).length ? evAandeelOverride : undefined,
        postcodes: postcodes.split(',').map(p => p.trim()).filter(Boolean),
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
    grid3:    { display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:10 },
    smallInp: { width:'100%', background:'#122028', border:`1px solid ${C.border}`, borderRadius:5, padding:'5px 8px', color:C.text, fontSize:12 },
    typeVak:  (a) => ({ padding:'5px 10px', borderRadius:5, fontSize:11, fontWeight:700, cursor:'pointer', border:`1px solid ${a ? C.tealDark : C.border}`, background: a ? C.tealDark+'55' : 'transparent', color: a ? '#ffffff' : C.textDim }),
    typeRow:  { display:'flex', flexWrap:'wrap', gap:6, marginBottom:10 },
    btn:      (primary) => ({ padding:'8px 18px', borderRadius:6, fontSize:12, fontWeight:700, cursor:'pointer', border:'none', background: primary ? C.tealDark : '#1e3a46', color:'#fff' }),
    error:    { fontSize:11, color:C.warn },
    hint:     { fontSize:10, color:C.textDim, marginTop:3 },
  };

  return (
    <div style={s.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={s.modal}>
        <div style={s.header}>
          <div style={s.title}>Bewerk: {gemeente.naam}</div>
          <span style={s.close} onClick={onClose}>×</span>
        </div>

        <div style={s.tabs}>
          <div style={s.tab(activeTab==='gemeente')} onClick={() => setActiveTab('gemeente')}>Gemeente</div>
          <div style={s.tab(activeTab==='wijken')}   onClick={() => setActiveTab('wijken')}>Wijken</div>
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
                  <div style={s.hint}>Bron: Statbel</div>
                </div>
                <div style={s.row}>
                  <label style={s.label}>Voertuigen</label>
                  <input style={s.input} type="number" value={voertuigen} onChange={e => setVoertuigen(e.target.value)} />
                  <div style={s.hint}>Bron: DIV / Febiac</div>
                </div>
              </div>

              <div style={s.grid2}>
                <div style={s.row}>
                  <label style={s.label}>Welvaartsindex</label>
                  <input style={s.input} type="number" step="0.1" value={welvaartsindex} onChange={e => setWelvaartsindex(e.target.value)} />
                  <div style={s.hint}>Statbel. Vlaams gemiddelde: 106,9. Bepaalt de lokale correctie op het Vlaamse EV-aandeel.</div>
                </div>
                <div style={s.row}>
                  <label style={s.label}>Privé % (berekend)</label>
                  <input style={s.input} type="number" min="0" max="100" value={privePctBerekend} onChange={e => setPrivePctBerekend(e.target.value)} />
                  <div style={s.hint}>Stadsmonitor "private buitenruimte", of eigen straatdataset indien beschikbaar.</div>
                </div>
              </div>

              <div style={s.row}>
                <label style={s.label}>Postcodes (komma-gescheiden, nodig voor de Fluvius-koppeling)</label>
                <input style={s.input} value={postcodes} onChange={e => setPostcodes(e.target.value)} placeholder="bijv. 3000, 3001, 3010" />
              </div>

              <div style={s.row}>
                <button style={s.btn(false)} onClick={verversVanuitFluvius} disabled={fluviusLoading || !postcodes.trim()}>
                  {fluviusLoading ? 'Bezig…' : '⟳ Ververs privé % vanuit Fluvius'}
                </button>
                {fluviusError && <div style={s.error}>⚠ {fluviusError}</div>}
                {fluviusResultaat && (
                  <div style={{ ...s.hint, marginTop:8, fontSize:11, lineHeight:1.7 }}>
                    {fluviusResultaat.totaalPrivePunten.toLocaleString('nl-BE')} geregistreerde private laadpunten
                    (Fluvius, {Object.keys(fluviusResultaat.perPostcode).length} van {fluviusResultaat.postcodes.length} postcodes bereikt)
                    tegenover ~{Math.round(fluviusResultaat.huidigeEvs).toLocaleString('nl-BE')} geschatte EV's nu ({HUIDIG_JAAR}).
                    {fluviusResultaat.voorgesteld != null && (
                      <>
                        <br/>Voorgesteld privé %: <strong style={{ color:C.teal }}>{Math.round(fluviusResultaat.voorgesteld*100)}%</strong>
                        {' '}
                        <span style={{ cursor:'pointer', textDecoration:'underline', color:C.tealDark }}
                          onClick={() => setPrivePctBerekend(Math.round(fluviusResultaat.voorgesteld*100))}>
                          overnemen
                        </span>
                      </>
                    )}
                    {fluviusResultaat.mislukt?.length > 0 && (
                      <div style={{ color:C.warn }}>Niet bereikbaar: {fluviusResultaat.mislukt.join(', ')}</div>
                    )}
                  </div>
                )}
              </div>

              <div style={s.row}>
                <label style={s.label}>EV-aandeel override (optioneel, leeg = welvaartsindex-schatting)</label>
                <div style={s.grid2}>
                  <div>
                    <input style={s.input} type="number" step="0.1" placeholder="2030 %" value={evOverride2030} onChange={e => setEvOverride2030(e.target.value)} />
                    <div style={s.hint}>2030, in %</div>
                  </div>
                  <div>
                    <input style={s.input} type="number" step="0.1" placeholder="2035 %" value={evOverride2035} onChange={e => setEvOverride2035(e.target.value)} />
                    <div style={s.hint}>2035, in %</div>
                  </div>
                </div>
                <div style={s.hint}>Alleen invullen als er een eigen, lokale EV-prognose beschikbaar is voor deze gemeente.</div>
              </div>
            </div>
          )}

          {activeTab === 'wijken' && (
            <div>
              {wijken.map((wijk, idx) => (
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
                  </div>

                  <label style={{ ...s.label, fontSize:10 }}>
                    Wijktype (bepaalt de doelgroepenmix; meerdere aanvinken voor een hybride wijk, bijvoorbeeld wonen + werken)
                  </label>
                  <div style={s.typeRow}>
                    {WIJKTYPES.map(t => (
                      <div key={t.key} style={s.typeVak(wijk.wijktype.includes(t.key))}
                        onClick={() => toggleWijktype(idx, t.key)}>{t.label}</div>
                    ))}
                  </div>

                  <label style={{ ...s.label, fontSize:10 }}>
                    OV-aandeel (los veld, standaard 0%, alleen invullen bij een bekend publiek/semi-publiek OV-laadpunt in deze wijk)
                  </label>
                  <input style={{ ...s.smallInp, width:100, marginBottom:10 }} type="number" min="0" max="100"
                    value={Math.round((wijk.ovAandeel || 0) * 100)}
                    onChange={e => updateWijk(idx, 'ovAandeel', (e.target.value === '' ? 0 : +e.target.value) / 100)} />

                  <label style={{ ...s.label, fontSize:10 }}>
                    Oppervlakte (km², voor de dekkingsnorm van 250m uit Stap 4)
                  </label>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <input style={{ ...s.smallInp, width:100 }} type="number" min="0" step="0.01"
                      value={wijk.oppervlakteKm2 ?? ''}
                      onChange={e => {
                        updateWijk(idx, 'oppervlakteKm2', e.target.value === '' ? null : +e.target.value);
                        updateWijk(idx, 'oppervlakteIsProxy', false);
                      }} />
                    {wijk.oppervlakteIsProxy !== false && (
                      <span style={{ fontSize:10, color:C.gold }}>schatting, geen gemeten grens</span>
                    )}
                  </div>
                </div>
              ))}
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
