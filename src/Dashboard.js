// Dashboard.js — Startpagina na login
// Toont alle onboarde gemeenten per land en biedt zoeken voor nieuwe gemeente.
// Props:
//   gemeenten      — object { id: gemeenteObject } zoals al beheerd in AppWithOnboarding
//   dbStatus       — 'online' | 'offline' | 'laden'
//   onSelectGemeente(id)    — callback bij klik op bestaande gemeente
//   onStartOnboarding()     — callback bij klik op "Gemeente onboarden"
//   onVerversGemeenten()    — optionele callback om lijst te herfetchen

import React, { useState, useMemo, useEffect } from 'react';
import { getGemeentenLijst } from './api';

// ── Kleurpalet: identiek aan de rest van de app ────────────────────────────
const C = {
  bg:       '#0F1117',
  surface:  '#1A1F2E',
  surface2: '#222839',
  teal:     '#2B5F6E',
  accent:   '#4ECDC4',
  text:     '#FFFFFF',
  text2:    'rgba(255,255,255,0.92)',
  text3:    'rgba(255,255,255,0.65)',
  border:   'rgba(255,255,255,0.08)',
  red:      '#E05C5C',
  orange:   '#E8963A',
  green:    '#4ECDC4',
};

// ── Bekende Vlaamse gemeenten voor de zoekfunctie ─────────────────────────
// Uitbreidbaar. NIS-code en provincie komen uit statische lijst;
// inwoners worden live opgehaald via de bevolking-endpoint zodra een
// match geselecteerd is.
const VLAAMSE_GEMEENTEN = [
  { naam: 'Aalst',        provincie: 'Oost-Vlaanderen',  nis: '41002' },
  { naam: 'Aalter',       provincie: 'Oost-Vlaanderen',  nis: '44084' },
  { naam: 'Aarschot',     provincie: 'Vlaams-Brabant',   nis: '24002' },
  { naam: 'Antwerpen',    provincie: 'Antwerpen',         nis: '11002' },
  { naam: 'Beveren',      provincie: 'Oost-Vlaanderen',  nis: '46003' },
  { naam: 'Bonheiden',    provincie: 'Antwerpen',         nis: '12005' },
  { naam: 'Boom',         provincie: 'Antwerpen',         nis: '11005' },
  { naam: 'Brasschaat',   provincie: 'Antwerpen',         nis: '11008' },
  { naam: 'Brugge',       provincie: 'West-Vlaanderen',  nis: '31005' },
  { naam: 'Dendermonde',  provincie: 'Oost-Vlaanderen',  nis: '42006' },
  { naam: 'Diest',        provincie: 'Vlaams-Brabant',   nis: '24020' },
  { naam: 'Gent',         provincie: 'Oost-Vlaanderen',  nis: '44021' },
  { naam: 'Genk',         provincie: 'Limburg',           nis: '71016' },
  { naam: 'Hasselt',      provincie: 'Limburg',           nis: '71022' },
  { naam: 'Heist-op-den-Berg', provincie: 'Antwerpen',   nis: '12014' },
  { naam: 'Knokke-Heist', provincie: 'West-Vlaanderen',  nis: '31043' },
  { naam: 'Kortrijk',     provincie: 'West-Vlaanderen',  nis: '34022' },
  { naam: 'Leuven',       provincie: 'Vlaams-Brabant',   nis: '24062' },
  { naam: 'Mechelen',     provincie: 'Antwerpen',         nis: '12025' },
  { naam: 'Mol',          provincie: 'Antwerpen',         nis: '13025' },
  { naam: 'Ninove',       provincie: 'Oost-Vlaanderen',  nis: '41048' },
  { naam: 'Olen',         provincie: 'Antwerpen',         nis: '13029' },
  { naam: 'Oostende',     provincie: 'West-Vlaanderen',  nis: '35013' },
  { naam: 'Roeselare',    provincie: 'West-Vlaanderen',  nis: '36015' },
  { naam: 'Sint-Niklaas', provincie: 'Oost-Vlaanderen',  nis: '46021' },
  { naam: 'Sint-Truiden', provincie: 'Limburg',           nis: '71053' },
  { naam: 'Temse',        provincie: 'Oost-Vlaanderen',  nis: '46025' },
  { naam: 'Turnhout',     provincie: 'Antwerpen',         nis: '13040' },
  { naam: 'Vilvoorde',    provincie: 'Vlaams-Brabant',   nis: '23088' },
  { naam: 'Waregem',      provincie: 'West-Vlaanderen',  nis: '34040' },
];

const NEDERLANDSE_GEMEENTEN = [
  { naam: 'Amsterdam',    provincie: 'Noord-Holland',    nis: 'GM0363' },
  { naam: 'Breda',        provincie: 'Noord-Brabant',    nis: 'GM0758' },
  { naam: 'Den Haag',     provincie: 'Zuid-Holland',     nis: 'GM0518' },
  { naam: 'Eindhoven',    provincie: 'Noord-Brabant',    nis: 'GM0772' },
  { naam: 'Groningen',    provincie: 'Groningen',         nis: 'GM0014' },
  { naam: 'Rotterdam',    provincie: 'Zuid-Holland',     nis: 'GM0599' },
  { naam: 'Tilburg',      provincie: 'Noord-Brabant',    nis: 'GM0855' },
  { naam: 'Utrecht',      provincie: 'Utrecht',           nis: 'GM0344' },
  { naam: 'Almere',       provincie: 'Flevoland',         nis: 'GM0034' },
  { naam: 'Nijmegen',     provincie: 'Gelderland',        nis: 'GM0268' },
  { naam: 'Arnhem',       provincie: 'Gelderland',        nis: 'GM0202' },
  { naam: 'Haarlem',      provincie: 'Noord-Holland',    nis: 'GM0392' },
];

// ── Stijlen ────────────────────────────────────────────────────────────────
const st = {
  page: {
    minHeight: '100vh',
    background: C.bg,
    color: C.text,
    fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
  },
  topbar: {
    background: C.surface,
    borderBottom: `1px solid ${C.border}`,
    display: 'flex',
    alignItems: 'center',
    padding: '0 24px',
    height: 52,
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontWeight: 700,
    fontSize: 15,
    color: C.text,
  },
  dot: {
    width: 8, height: 8,
    borderRadius: '50%',
    background: C.accent,
    display: 'inline-block',
  },
  dbBadge: (status) => ({
    display: 'flex',
    alignItems: 'center',
    gap: 5,
    fontSize: 12,
    color: status === 'online' ? C.green : status === 'offline' ? C.red : C.orange,
    marginLeft: 'auto',
  }),
  body: {
    maxWidth: 1100,
    margin: '0 auto',
    padding: '40px 24px 80px',
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: 700,
    color: C.text,
    marginBottom: 6,
  },
  pageSub: {
    fontSize: 14,
    color: C.text3,
    marginBottom: 32,
  },
  landTabs: {
    display: 'flex',
    gap: 4,
    marginBottom: 28,
    background: C.surface,
    border: `1px solid ${C.border}`,
    borderRadius: 10,
    padding: 4,
    width: 'fit-content',
  },
  landTab: (active) => ({
    padding: '8px 22px',
    borderRadius: 7,
    fontSize: 14,
    fontWeight: 500,
    cursor: 'pointer',
    color: active ? C.text : C.text3,
    background: active ? C.teal : 'transparent',
    border: 'none',
    transition: 'all 0.15s',
  }),
  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 24,
    alignItems: 'start',
  },
  panel: {
    background: C.surface,
    border: `1px solid ${C.border}`,
    borderRadius: 12,
    overflow: 'hidden',
  },
  panelHeader: {
    padding: '20px 24px 16px',
    borderBottom: `1px solid ${C.border}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  panelTitle: {
    fontSize: 15,
    fontWeight: 600,
    color: C.text,
  },
  panelCount: {
    fontSize: 12,
    color: C.text3,
    background: C.surface2,
    padding: '3px 10px',
    borderRadius: 20,
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  th: {
    textAlign: 'left',
    padding: '10px 24px',
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: '0.07em',
    textTransform: 'uppercase',
    color: C.text3,
    borderBottom: `1px solid ${C.border}`,
    background: C.surface2,
  },
  td: {
    padding: '14px 24px',
    fontSize: 14,
    color: C.text2,
    borderBottom: `1px solid ${C.border}`,
    verticalAlign: 'middle',
  },
  gemeenteNaam: {
    fontWeight: 600,
    color: C.text,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  statusDot: (compleet) => ({
    width: 7, height: 7,
    borderRadius: '50%',
    background: compleet ? C.green : C.orange,
    flexShrink: 0,
  }),
  tag: (ok) => ({
    display: 'inline-block',
    padding: '2px 9px',
    borderRadius: 4,
    fontSize: 11,
    fontWeight: 500,
    background: ok ? 'rgba(78,205,196,0.12)' : 'rgba(232,150,58,0.12)',
    color: ok ? C.accent : C.orange,
  }),
  openBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 5,
    fontSize: 13,
    color: C.accent,
    fontWeight: 500,
    cursor: 'pointer',
    background: 'none',
    border: 'none',
    padding: 0,
  },
  statsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: 1,
    background: C.border,
    borderTop: `1px solid ${C.border}`,
  },
  statBlock: {
    background: C.surface2,
    padding: '16px 20px',
    textAlign: 'center',
  },
  statVal: {
    fontSize: 22,
    fontWeight: 700,
    color: C.text,
    fontVariantNumeric: 'tabular-nums',
  },
  statLabel: {
    fontSize: 11,
    color: C.text3,
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
  },
  searchBox: {
    padding: '20px 24px',
    borderBottom: `1px solid ${C.border}`,
  },
  searchWrap: {
    position: 'relative',
  },
  searchInput: {
    width: '100%',
    background: C.surface2,
    border: `1px solid ${C.border}`,
    borderRadius: 8,
    padding: '12px 14px 12px 42px',
    fontSize: 14,
    color: C.text,
    fontFamily: 'inherit',
    outline: 'none',
    boxSizing: 'border-box',
  },
  searchIcon: {
    position: 'absolute',
    left: 14,
    top: '50%',
    transform: 'translateY(-50%)',
    color: C.text3,
    pointerEvents: 'none',
  },
  stateMsg: (type) => ({
    padding: '24px',
    textAlign: 'center',
    fontSize: 13,
    color: type === 'error' ? C.red : C.text3,
  }),
  resultMatch: {
    padding: '20px 24px',
    borderTop: `1px solid ${C.border}`,
  },
  resultNaam: {
    fontSize: 17,
    fontWeight: 700,
    color: C.text,
    marginBottom: 4,
  },
  resultMeta: {
    fontSize: 13,
    color: C.text3,
    marginBottom: 16,
  },
  resultGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 8,
    marginBottom: 16,
  },
  resultCell: {
    background: C.surface2,
    border: `1px solid ${C.border}`,
    borderRadius: 8,
    padding: '10px 14px',
  },
  resultCellLabel: {
    fontSize: 10,
    fontWeight: 600,
    letterSpacing: '0.07em',
    textTransform: 'uppercase',
    color: C.text3,
    marginBottom: 3,
  },
  resultCellVal: {
    fontSize: 15,
    fontWeight: 600,
    color: C.text,
  },
  onboardBtn: {
    width: '100%',
    padding: 12,
    background: C.teal,
    border: 'none',
    borderRadius: 8,
    color: C.text,
    fontSize: 15,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  infoBlock: {
    padding: '18px 24px',
    borderTop: `1px solid ${C.border}`,
    background: 'rgba(43,95,110,0.08)',
  },
  infoTitle: {
    fontSize: 13,
    fontWeight: 600,
    color: C.accent,
    marginBottom: 5,
  },
  infoText: {
    fontSize: 13,
    color: C.text3,
    lineHeight: 1.6,
  },
  emptyState: {
    padding: '32px 24px',
    textAlign: 'center',
    color: C.text3,
    fontSize: 14,
  },
};

// ── Component ──────────────────────────────────────────────────────────────
export default function Dashboard({ gemeenten = {}, dbStatus = 'laden', onSelectGemeente, onStartOnboarding }) {
  const [land, setLand] = useState('BE');
  const [zoekTekst, setZoekTekst] = useState('');
  const [geselecteerdMatch, setGeselecteerdMatch] = useState(null);
  // Dynamische Vlaamse-gemeentenlijst uit backend (nis-lookup.js, ~300).
  // Bij pagina-load eenmalig opgehaald. Faalt de call, dan valt de zoekbalk
  // terug op de statische VLAAMSE_GEMEENTEN shortlist hierboven.
  const [dynVlaamseGemeenten, setDynVlaamseGemeenten] = useState(null);

  useEffect(() => {
    let actief = true;
    getGemeentenLijst('België')
      .then(d => { if (actief && Array.isArray(d?.gemeenten)) setDynVlaamseGemeenten(d.gemeenten); })
      .catch(() => { /* stil: fallback op hardcoded lijst */ });
    return () => { actief = false; };
  }, []);

  // Filter onboarde gemeenten per land
  const onboardeGemeenten = useMemo(() => {
    return Object.values(gemeenten).filter(g => {
      const isNL = g.land === 'Nederland';
      return land === 'NL' ? isNL : !isNL;
    });
  }, [gemeenten, land]);

  // Zoeklogica: match op naam (startsWith, min. 2 tekens).
  // BE gebruikt dynamische lijst als beschikbaar, anders de hardcoded fallback.
  const zoekMatch = useMemo(() => {
    if (!zoekTekst || zoekTekst.length < 2) return null;
    const lijst = land === 'NL'
      ? NEDERLANDSE_GEMEENTEN
      : (dynVlaamseGemeenten && dynVlaamseGemeenten.length ? dynVlaamseGemeenten : VLAAMSE_GEMEENTEN);
    // Sluit al onboarde gemeenten uit
    const onboardeNamen = new Set(Object.values(gemeenten).map(g => g.naam.toLowerCase()));
    return lijst.find(g =>
      g.naam.toLowerCase().startsWith(zoekTekst.toLowerCase()) &&
      !onboardeNamen.has(g.naam.toLowerCase())
    ) || null;
  }, [zoekTekst, land, gemeenten, dynVlaamseGemeenten]);

  const heeftGeenMatch = zoekTekst.length >= 2 && !zoekMatch;

  const compleetAantal = onboardeGemeenten.filter(g => g.privePctBerekend != null).length;

  function handleZoekChange(e) {
    setZoekTekst(e.target.value);
    setGeselecteerdMatch(null);
  }

  function handleOnboard() {
    if (onStartOnboarding) onStartOnboarding(zoekMatch);
  }

  return (
    <div style={st.page}>
      {/* Topbar */}
      <header style={st.topbar}>
        <div style={st.logo}>
          <span style={st.dot} />
          Strategisch Laadplan
        </div>
        <div style={st.dbBadge(dbStatus)}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor', display: 'inline-block' }} />
          DB {dbStatus}
        </div>
      </header>

      {/* Body */}
      <div style={st.body}>
        <div style={st.pageTitle}>Gemeenten</div>
        <div style={st.pageSub}>
          Selecteer een gemeente om de analyse te openen, of onboard een nieuwe gemeente.
        </div>

        {/* Land-tabs */}
        <div style={st.landTabs}>
          <button style={st.landTab(land === 'BE')} onClick={() => { setLand('BE'); setZoekTekst(''); }}>
            🇧🇪 België
          </button>
          <button style={st.landTab(land === 'NL')} onClick={() => { setLand('NL'); setZoekTekst(''); }}>
            🇳🇱 Nederland
          </button>
        </div>

        <div style={st.grid}>
          {/* Linker kolom: onboarde gemeenten */}
          <div style={st.panel}>
            <div style={st.panelHeader}>
              <div style={st.panelTitle}>
                Onboarde gemeenten &mdash; {land === 'BE' ? 'België' : 'Nederland'}
              </div>
              <div style={st.panelCount}>{onboardeGemeenten.length} gemeente{onboardeGemeenten.length !== 1 ? 'n' : ''}</div>
            </div>

            {onboardeGemeenten.length === 0 ? (
              <div style={st.emptyState}>
                Nog geen gemeenten voor {land === 'BE' ? 'België' : 'Nederland'}.<br />
                Gebruik het zoekvenster rechts om een gemeente te onboarden.
              </div>
            ) : (
              <>
                <table style={st.table}>
                  <thead>
                    <tr>
                      <th style={st.th}>Gemeente</th>
                      <th style={st.th}>Provincie</th>
                      <th style={st.th}>Status</th>
                      <th style={st.th} />
                    </tr>
                  </thead>
                  <tbody>
                    {onboardeGemeenten.map(g => {
                      const compleet = g.wijken?.length > 0;
                      return (
                        <tr
                          key={g.id}
                          style={{ cursor: 'pointer' }}
                          onClick={() => onSelectGemeente && onSelectGemeente(g.id)}
                        >
                          <td style={st.td}>
                            <div style={st.gemeenteNaam}>
                              <span style={st.statusDot(compleet)} />
                              {g.naam}
                            </div>
                          </td>
                          <td style={st.td}>{g.provincie || '—'}</td>
                          <td style={st.td}>
                            <span style={st.tag(compleet)}>
                              {compleet ? 'Compleet' : 'Incompleet'}
                            </span>
                          </td>
                          <td style={st.td}>
                            <button
                              style={st.openBtn}
                              onClick={e => { e.stopPropagation(); onSelectGemeente && onSelectGemeente(g.id); }}
                            >
                              Open
                              <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <path d="M2 7h10M7 2l5 5-5 5" />
                              </svg>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                <div style={st.statsRow}>
                  <div style={st.statBlock}>
                    <div style={st.statVal}>{onboardeGemeenten.length}</div>
                    <div style={st.statLabel}>Gemeenten</div>
                  </div>
                  <div style={st.statBlock}>
                    <div style={st.statVal}>{compleetAantal}</div>
                    <div style={st.statLabel}>Compleet</div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Rechter kolom: zoeken */}
          <div style={st.panel}>
            <div style={st.panelHeader}>
              <div style={st.panelTitle}>
                Nieuwe gemeente onboarden &mdash; {land === 'BE' ? 'België' : 'Nederland'}
              </div>
            </div>

            <div style={st.searchBox}>
              <div style={st.searchWrap}>
                <svg style={st.searchIcon} width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="6.5" cy="6.5" r="4.5" /><path d="M10 10l3.5 3.5" />
                </svg>
                <input
                  style={st.searchInput}
                  type="text"
                  placeholder="Typ een gemeentenaam..."
                  value={zoekTekst}
                  onChange={handleZoekChange}
                  autoComplete="off"
                />
              </div>
            </div>

            {/* States */}
            {!zoekTekst || zoekTekst.length < 2 ? (
              <div style={st.stateMsg('hint')}>Typ de naam van een gemeente om te zoeken.</div>
            ) : heeftGeenMatch ? (
              <div style={st.stateMsg('error')}>
                Geen gemeente gevonden voor &ldquo;{zoekTekst}&rdquo;. Controleer de spelling en probeer opnieuw.
              </div>
            ) : zoekMatch ? (
              <div style={st.resultMatch}>
                <div style={st.resultNaam}>{zoekMatch.naam}</div>
                <div style={st.resultMeta}>{zoekMatch.provincie} &middot; NIS {zoekMatch.nis}</div>
                <div style={st.resultGrid}>
                  <div style={st.resultCell}>
                    <div style={st.resultCellLabel}>Provincie</div>
                    <div style={st.resultCellVal}>{zoekMatch.provincie}</div>
                  </div>
                  <div style={st.resultCell}>
                    <div style={st.resultCellLabel}>NIS-code</div>
                    <div style={st.resultCellVal}>{zoekMatch.nis}</div>
                  </div>
                </div>
                <button style={st.onboardBtn} onClick={handleOnboard}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M8 2v8M4 7l4 5 4-5" /><path d="M2 14h12" />
                  </svg>
                  {zoekMatch.naam} onboarden
                </button>
              </div>
            ) : null}

            <div style={st.infoBlock}>
              <div style={st.infoTitle}>Hoe werkt onboarding?</div>
              <div style={st.infoText}>
                De wizard haalt automatisch bevolkingscijfers, NIS-code, wijkgrenzen en bestaande laadpaaldata op.
                Vervolgens stel je de gemeente-specifieke parameters in. De analyse is direct beschikbaar zodra de wizard is afgerond.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
