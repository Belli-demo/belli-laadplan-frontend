// ── Gemeente database ──────────────────────────────────────────────────────
// Uitbreidbaar: voeg gemeenten toe met bbox voor Overpass API + wijkdata
export const GEMEENTEN = {
  leuven: {
    id: 'leuven',
    naam: 'Leuven',
    provincie: 'Vlaams-Brabant',
    inwoners: 104906,
    voertuigen: 48200,
    center: [50.8798, 4.7005],
    zoom: 13,
    bbox: [50.82, 4.65, 50.94, 4.77], // [south, west, north, east]
    kleur: '#2B5F6E',
    wijken: [
      { id:'LV01', naam:'Leuven Centrum',       inwoners:18400, voertuigen:7200,  aandeel_app:0.48, lat:50.8793, lng:4.7009, seg:{ bew:0.45, bez:0.38, log:0.10, ov:0.07 } },
      { id:'LV02', naam:'Kessel-Lo',            inwoners:22100, voertuigen:9800,  aandeel_app:0.28, lat:50.8900, lng:4.7280, seg:{ bew:0.62, bez:0.20, log:0.12, ov:0.06 } },
      { id:'LV03', naam:'Heverlee',             inwoners:19600, voertuigen:9100,  aandeel_app:0.22, lat:50.8560, lng:4.7050, seg:{ bew:0.65, bez:0.18, log:0.11, ov:0.06 } },
      { id:'LV04', naam:'Wilsele',              inwoners:12300, voertuigen:5600,  aandeel_app:0.18, lat:50.9100, lng:4.7050, seg:{ bew:0.70, bez:0.15, log:0.10, ov:0.05 } },
      { id:'LV05', naam:'Wijgmaal',             inwoners:5200,  voertuigen:2400,  aandeel_app:0.15, lat:50.9280, lng:4.7120, seg:{ bew:0.72, bez:0.14, log:0.09, ov:0.05 } },
      { id:'LV06', naam:'Haasrode / Korbeek-Lo',inwoners:8900,  voertuigen:4200,  aandeel_app:0.12, lat:50.8420, lng:4.7400, seg:{ bew:0.68, bez:0.16, log:0.12, ov:0.04 } },
      { id:'LV07', naam:'Binnenstad Oost',      inwoners:9800,  voertuigen:3200,  aandeel_app:0.62, lat:50.8780, lng:4.7160, seg:{ bew:0.38, bez:0.42, log:0.12, ov:0.08 } },
      { id:'LV08', naam:'Arenberg / Wetensch.', inwoners:6200,  voertuigen:4800,  aandeel_app:0.20, lat:50.8640, lng:4.6880, seg:{ bew:0.52, bez:0.22, log:0.18, ov:0.08 } },
    ],
  },
  olen: {
    id: 'olen',
    naam: 'Olen',
    provincie: 'Antwerpen',
    inwoners: 14000,
    voertuigen: 8200,
    center: [51.1400, 4.8600],
    zoom: 13,
    bbox: [51.10, 4.82, 51.18, 4.91],
    kleur: '#3A6B4A',
    wijken: [
      { id:'OL01', naam:'Olen Centrum',    inwoners:5200,  voertuigen:3100, aandeel_app:0.25, lat:51.1380, lng:4.8580, seg:{ bew:0.58, bez:0.25, log:0.12, ov:0.05 } },
      { id:'OL02', naam:'Olen Noord',      inwoners:3800,  voertuigen:2300, aandeel_app:0.15, lat:51.1520, lng:4.8550, seg:{ bew:0.68, bez:0.18, log:0.11, ov:0.03 } },
      { id:'OL03', naam:'Industriezone',   inwoners:800,   voertuigen:1200, aandeel_app:0.08, lat:51.1350, lng:4.8750, seg:{ bew:0.25, bez:0.20, log:0.48, ov:0.07 } },
      { id:'OL04', naam:'Olen Oost',       inwoners:4200,  voertuigen:2600, aandeel_app:0.12, lat:51.1380, lng:4.8820, seg:{ bew:0.70, bez:0.16, log:0.10, ov:0.04 } },
    ],
  },
  gent: {
    id: 'gent',
    naam: 'Gent',
    provincie: 'Oost-Vlaanderen',
    inwoners: 268000,
    voertuigen: 112000,
    center: [51.0543, 3.7174],
    zoom: 12,
    bbox: [50.99, 3.64, 51.12, 3.80],
    kleur: '#9EC5CB',
    wijken: [
      { id:'GN01', naam:'Gent Centrum',      inwoners:28000, voertuigen:9800,  aandeel_app:0.65, lat:51.0543, lng:3.7174, seg:{ bew:0.35, bez:0.45, log:0.12, ov:0.08 } },
      { id:'GN02', naam:'Ledeberg',          inwoners:18000, voertuigen:7200,  aandeel_app:0.45, lat:51.0380, lng:3.7350, seg:{ bew:0.55, bez:0.28, log:0.12, ov:0.05 } },
      { id:'GN03', naam:'Wondelgem',         inwoners:22000, voertuigen:9400,  aandeel_app:0.28, lat:51.0850, lng:3.7100, seg:{ bew:0.65, bez:0.20, log:0.10, ov:0.05 } },
      { id:'GN04', naam:'Mariakerke',        inwoners:19000, voertuigen:8200,  aandeel_app:0.22, lat:51.0620, lng:3.6900, seg:{ bew:0.68, bez:0.18, log:0.10, ov:0.04 } },
      { id:'GN05', naam:'Gentse Kanaalzone', inwoners:8000,  voertuigen:5800,  aandeel_app:0.15, lat:51.0900, lng:3.7500, seg:{ bew:0.30, bez:0.18, log:0.44, ov:0.08 } },
      { id:'GN06', naam:'Drongen',           inwoners:15000, voertuigen:6800,  aandeel_app:0.18, lat:51.0350, lng:3.6650, seg:{ bew:0.70, bez:0.16, log:0.10, ov:0.04 } },
    ],
  },
};

// ── Rekenmodel (consistent met Belli Laadsimulator v1.1) ──────────────────
export const SEG_PARAMS = {
  bew: { kwh:18,  freq:3.5, ac:0.80, acs:0.20, dc:0.00, dcu:0.00, label:'Bewoners',  color:'#2B5F6E' },
  bez: { kwh:12,  freq:1.2, ac:0.45, acs:0.30, dc:0.20, dcu:0.05, label:'Bezoekers', color:'#9EC5CB' },
  log: { kwh:35,  freq:5.0, ac:0.10, acs:0.20, dc:0.60, dcu:0.10, label:'Logistiek', color:'#D0AC41' },
  ov:  { kwh:80,  freq:7.0, ac:0.10, acs:0.15, dc:0.35, dcu:0.40, label:'OV / Bus',  color:'#c89ecb' },
};

export const BEZET = { ac:5.5, acs:4.0, dc:6.5, dcu:8.0 };
export const VERM  = { ac:7.4, acs:22,  dc:90,  dcu:175  };
export const CAPEX = { ac:3500, acs:5500, dc:29000, dcu:82000 };

export const SCENARIOS = [
  { id:'laag',  naam:'Laag',  ev2025:0.06, ev2030:0.22, ev2035:0.48 },
  { id:'basis', naam:'Basis', ev2025:0.08, ev2030:0.38, ev2035:0.72 },
  { id:'hoog',  naam:'Hoog',  ev2025:0.10, ev2030:0.52, ev2035:0.88 },
];

export function evAandeel(scenario, year, appPct) {
  const sc = SCENARIOS.find(s => s.id === scenario) || SCENARIOS[1];
  let base;
  if (year <= 2025)      base = sc.ev2025;
  else if (year <= 2030) base = sc.ev2025 + (sc.ev2030 - sc.ev2025) * (year - 2025) / 5;
  else                   base = sc.ev2030 + (sc.ev2035 - sc.ev2030) * (year - 2030) / 5;
  // Hogere app-dichtheid = lager autobezit per hoofd
  return base * (appPct > 0.45 ? 0.85 : 1.0);
}

export function calcWijk(wijk, params) {
  const { scenario, year, pubPct, activeSegs, trendFactor } = params;
  const evPct   = evAandeel(scenario, year, wijk.aandeel_app);
  const evs     = wijk.voertuigen * evPct;
  const pubEvs  = evs * (pubPct / 100);

  let totMwh=0, totAC=0, totACS=0, totDC=0, totDCU=0, totCapex=0;
  const breakdown = {};

  for (const [sid, p] of Object.entries(SEG_PARAMS)) {
    if (!activeSegs[sid]) continue;
    const aand = wijk.seg[sid];
    const mwh  = pubEvs * aand * p.kwh * p.freq * 52 / 1000 * trendFactor;
    const ac   = Math.round(mwh * p.ac  / (VERM.ac  * BEZET.ac  * 365 / 1000));
    const acs  = Math.round(mwh * p.acs / (VERM.acs * BEZET.acs * 365 / 1000));
    const dc   = Math.round(mwh * p.dc  / (VERM.dc  * BEZET.dc  * 365 / 1000));
    const dcu  = Math.round(mwh * p.dcu / (VERM.dcu * BEZET.dcu * 365 / 1000));
    const capex = (ac + acs) * CAPEX.ac + dc * CAPEX.dc + dcu * CAPEX.dcu;
    totMwh += mwh; totAC += ac; totACS += acs; totDC += dc; totDCU += dcu; totCapex += capex;
    breakdown[sid] = { mwh, ac, acs, dc, dcu, capex };
  }

  return {
    totLP: totAC + totACS + totDC + totDCU,
    totAC, totACS, totDC, totDCU,
    totMwh, totCapex, breakdown, evs, pubEvs,
  };
}

export const YEARS = [2025, 2026, 2027, 2028, 2029, 2030, 2031, 2032, 2033, 2034, 2035];
