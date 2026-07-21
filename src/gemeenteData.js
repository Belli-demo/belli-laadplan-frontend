// ── Gemeente database ──────────────────────────────────────────────────────
// Uitbreidbaar: voeg gemeenten toe met bbox voor Overpass API + wijkdata.
// welvaartsindex: Statbel-indicator van de gemeente (Vlaams gemiddelde 106,9,
// zie WELVAARTSINDEX_VLAANDEREN), gebruikt om het Fluvius EV-aandeel lokaal
// te corrigeren. privePctBerekend: aandeel huishoudens met privé laadmogelijk-
// heid (0 tot 1); voor Leuven een echte, straatniveau meting, voor andere
// gemeenten voorlopig een schatting (zie Leeswijzer §9) totdat de Stadsmonitor-
// of Fluvius-koppeling per gemeente is gebouwd. evAandeelOverride: optioneel,
// alleen invullen als er een eigen, lokale EV-prognose beschikbaar is (zoals
// Leuven); anders leeg laten zodat de welvaartsindex-schatting geldt.
export const GEMEENTEN = {
  leuven: {
    id: 'leuven',
    naam: 'Leuven',
    provincie: 'Vlaams-Brabant',
    inwoners: 105233, // extern geverifieerd (Rijksregister, 1 januari 2026)
    voertuigen: 48200,
    oppervlakteKm2: 56.63, // extern geverifieerd (Stad Leuven, officiële opgave)
    postcodes: ['3000','3001','3010','3012','3018'], // extern geverifieerd (bpost)
    welvaartsindex: 115, // TODO bij onboarding: exact Statbel-cijfer opzoeken, dit is een schatting
    privePctBerekend: 0.636, // extern geverifieerd: eigen straatniveau-dataset (1.077 straten)
    evAandeelOverride: { 2030: 0.376, 2035: 0.595 }, // afgeleid uit dezelfde straatniveau-dataset
    center: [50.8798, 4.7005],
    zoom: 13,
    bbox: [50.82, 4.65, 50.94, 4.77], // [south, west, north, east]
    kleur: '#2B5F6E',
    wijken: [
      { id:'LV01', naam:'Leuven Centrum',       inwoners:18400, voertuigen:7200,  wijktype:['binnenstad'],       ovAandeel:0, oppervlakteKm2:10.17, lat:50.8793, lng:4.7009 },
      { id:'LV02', naam:'Kessel-Lo',            inwoners:22100, voertuigen:9800,  wijktype:['woonwijk'],         ovAandeel:0, oppervlakteKm2:12.21, lat:50.8900, lng:4.7280 },
      { id:'LV03', naam:'Heverlee',             inwoners:19600, voertuigen:9100,  wijktype:['woonwijk'],         ovAandeel:0, oppervlakteKm2:10.83, lat:50.8560, lng:4.7050 },
      { id:'LV04', naam:'Wilsele',              inwoners:12300, voertuigen:5600,  wijktype:['woonwijk'],         ovAandeel:0, oppervlakteKm2:6.80,  lat:50.9100, lng:4.7050 },
      { id:'LV05', naam:'Wijgmaal',             inwoners:5200,  voertuigen:2400,  wijktype:['woonwijk'],         ovAandeel:0, oppervlakteKm2:2.87,  lat:50.9280, lng:4.7120 },
      { id:'LV06', naam:'Haasrode / Korbeek-Lo',inwoners:8900,  voertuigen:4200,  wijktype:['bedrijventerrein'], ovAandeel:0, oppervlakteKm2:4.92,  lat:50.8420, lng:4.7400 },
      { id:'LV07', naam:'Binnenstad Oost',      inwoners:9800,  voertuigen:3200,  wijktype:['binnenstad'],       ovAandeel:0, oppervlakteKm2:5.41,  lat:50.8780, lng:4.7160 },
      { id:'LV08', naam:'Arenberg / Wetensch.', inwoners:6200,  voertuigen:4800,  wijktype:['woonwijk'],         ovAandeel:0, oppervlakteKm2:3.43,  lat:50.8640, lng:4.6880 },
    ],
  },
  olen: {
    id: 'olen',
    naam: 'Olen',
    provincie: 'Antwerpen',
    inwoners: 12943, // extern geverifieerd (Rijksregister, 1 januari 2026)
    voertuigen: 8200,
    oppervlakteKm2: 23.10, // extern geverifieerd (Wikipedia/officiële opgave)
    postcodes: ['2250'], // extern geverifieerd (Wikipedia)
    welvaartsindex: 107, // extern geverifieerd (gemeente Olen zelf)
    privePctBerekend: 0.70, // schatting, nog te verifiëren (Stadsmonitor)
    center: [51.1400, 4.8600],
    zoom: 13,
    bbox: [51.10, 4.82, 51.18, 4.91],
    kleur: '#3A6B4A',
    wijken: [
      { id:'OL01', naam:'Olen Centrum',    inwoners:5200,  voertuigen:3100, wijktype:['binnenstad'],       ovAandeel:0, oppervlakteKm2:8.58, lat:51.1380, lng:4.8580 },
      { id:'OL02', naam:'Olen Noord',      inwoners:3800,  voertuigen:2300, wijktype:['woonwijk'],         ovAandeel:0, oppervlakteKm2:6.27, lat:51.1520, lng:4.8550 },
      { id:'OL03', naam:'Industriezone',   inwoners:800,   voertuigen:1200, wijktype:['bedrijventerrein'], ovAandeel:0, oppervlakteKm2:1.32, lat:51.1350, lng:4.8750 },
      { id:'OL04', naam:'Olen Oost',       inwoners:4200,  voertuigen:2600, wijktype:['woonwijk'],         ovAandeel:0, oppervlakteKm2:6.93, lat:51.1380, lng:4.8820 },
    ],
  },
  gent: {
    id: 'gent',
    naam: 'Gent',
    provincie: 'Oost-Vlaanderen',
    inwoners: 273665, // extern geverifieerd (Rijksregister, 1 januari 2026)
    voertuigen: 96409, // extern geverifieerd (Statbel 2023, via AlleCijfers.be)
    oppervlakteKm2: 156.18, // extern geverifieerd (Wikipedia/officiële opgave)
    postcodes: ['9000','9030','9031','9032','9040','9050','9051','9052'], // beste inschatting, mogelijk niet volledig
    welvaartsindex: 98, // schatting, nog te verifiëren bij Statbel
    privePctBerekend: 0.60, // schatting, nog te verifiëren (Stadsmonitor)
    center: [51.0543, 3.7174],
    zoom: 12,
    bbox: [50.99, 3.64, 51.12, 3.80],
    kleur: '#9EC5CB',
    wijken: [
      { id:'GN01', naam:'Gent Centrum',      inwoners:28000, voertuigen:9800,  wijktype:['binnenstad'],       ovAandeel:0, oppervlakteKm2:39.75, lat:51.0543, lng:3.7174 },
      { id:'GN02', naam:'Ledeberg',          inwoners:18000, voertuigen:7200,  wijktype:['woonwijk'],         ovAandeel:0, oppervlakteKm2:25.56, lat:51.0380, lng:3.7350 },
      { id:'GN03', naam:'Wondelgem',         inwoners:22000, voertuigen:9400,  wijktype:['woonwijk'],         ovAandeel:0, oppervlakteKm2:31.24, lat:51.0850, lng:3.7100 },
      { id:'GN04', naam:'Mariakerke',        inwoners:19000, voertuigen:8200,  wijktype:['woonwijk'],         ovAandeel:0, oppervlakteKm2:26.98, lat:51.0620, lng:3.6900 },
      { id:'GN05', naam:'Gentse Kanaalzone', inwoners:8000,  voertuigen:5800,  wijktype:['bedrijventerrein'], ovAandeel:0, oppervlakteKm2:11.36, lat:51.0900, lng:3.7500 },
      { id:'GN06', naam:'Drongen',           inwoners:15000, voertuigen:6800,  wijktype:['woonwijk'],         ovAandeel:0, oppervlakteKm2:21.30, lat:51.0350, lng:3.6650 },
    ],
  },
};

// ── Rekenmodel v2 ───────────────────────────────────────────────────────
// Herbouwd volgens "18072026 Strategisch Laadplan Simulator V14.xlsx" en
// "Leeswijzer Strategisch Laadplan Modellering.docx". Elke constante hieronder
// heeft in dat Excel-bestand (tabblad Parameters) een bronvermelding en een
// status (extern geverifieerd / eigen werkaanname / nog te verifiëren).
// Dit bestand bevat alleen de rekenkern (Stap 1 t/m 4 + bruto-uitkomst);
// de aftrek van bestaande infrastructuur en "gepland" gebeurt, net als
// voorheen, op app-niveau (AppWithOnboarding.js), niet hier.

// Stap 1 — energiebehoefte per EV
export const JAARKM = 25000;            // eigen werkaanname (MOW TCO-tool: 30.000 bedrijf / 15.000 privé)
export const VERBRUIK_PER_KM = 0.17;    // marktconsensus (Energids/Plugnet/Vattenfall e.a.)
export const STADSFACTOR = 0.95;        // eigen werkaanname

// EV-aandeel Vlaanderen, basiswaarde (Fluvius Investeringsplan 2026-2035)
export const EV_AANDEEL_VLAANDEREN = { 2025: 0.085, 2030: 0.222, 2035: 0.407 };
export const WELVAARTSINDEX_VLAANDEREN = 106.9; // Statbel, Vlaams gemiddelde

// Stap 3 — doelgroepenmix per wijktype (excl. OV, dat is een los veld per wijk)
export const WIJKTYPE_MIX = {
  binnenstad:       { bew: 0.40, bez: 0.55, log: 0.05 },
  woonwijk:         { bew: 0.77, bez: 0.20, log: 0.03 },
  bedrijventerrein: { bew: 0.00, bez: 0.35, log: 0.65 },
};
// AC/DC/HPC-verdeling per doelgroep, obv stilstandtijd-logica
export const DOELGROEP_LAADTYPE = {
  bew: { ac: 0.95, dc: 0.05, hpc: 0.00 },
  bez: { ac: 0.65, dc: 0.30, hpc: 0.05 },
  log: { ac: 0.15, dc: 0.65, hpc: 0.20 },
  ov:  { ac: 0.05, dc: 0.35, hpc: 0.60 },
};

// Stap 4 — utilisatie per laadpunt (MWh/maand), jaar voor jaar
// AC: echte Allego-tenderdata (Leuven/Mechelen), geplafonneerd op MOW's eigen
// "paal volgt paal"-trigger (>1.000 kWh/maand -> nieuwe paal).
const AC_KWH_PER_JAAR_TENDER = {
  2025:9000, 2026:9810, 2027:10693, 2028:11548, 2029:12472, 2030:13345,
  2031:14279, 2032:15279, 2033:16196, 2034:17006, 2035:17857,
};
export const AC_TRIGGER_MWH_MAAND = 1.0; // Bijlage 11, I.2

// DC/HPC: eigen marktinschatting (P50, getoetst tegen Fastned-jaarcijfers 2025),
// gefaseerde groei 8% (2027-2028) / 6% (2029-2032) / 4% (2033-2035) per jaar.
const DC_HPC_START_MWH_MAAND = { dc: 4.0, hpc: 5.0 }; // 2026
function dcHpcGroeiPct(jaar) {
  if (jaar <= 2028) return 0.08;
  if (jaar <= 2032) return 0.06;
  return 0.04;
}

export const REDUNDANTIE_MARGE = 0.10; // dekt ook "Paal volgt Wagen", zie Leeswijzer §7

export const YEARS = [2025, 2026, 2027, 2028, 2029, 2030, 2031, 2032, 2033, 2034, 2035];

// ── Slim laden (E-Laad studie) ──────────────────────────────────────────
// Twee aparte, gebronneerde effecten, GEEN generieke verlaging van de
// energiebehoefte (dat was de eerdere, foute aanname):
// 1) Een kleine, licht NEGATIEVE energiecorrectie per sessie (kort geparkeerde
//    sessies lopen de verlaagde piekurensnelheid niet altijd meer in).
// 2) Meer connectiepunten passen op dezelfde netaansluiting, omdat de
//    piekbelasting daalt. Dit vergroot NIET de maximaal leverbare kWh van
//    die aansluiting, alleen het aantal sockets dat zich die vaste
//    hoeveelheid vermogen kan delen.
export const SLIM_LADEN_ENERGIE_CORRECTIE = 0.035; // E-Laad studie: 2-5% minder energie/sessie
export const SLIM_LADEN_PIEKREDUCTIE = 0.40;       // E-Laad studie: 35-49% piekreductie, hier 40% aangehouden
const AANSLUITING_KW = Math.sqrt(3) * 400 * 32 / 1000; // 3x32A, 400V => 22,17 kW
const PALEN_PER_AANSLUITING_BASELINE = AANSLUITING_KW / 11; // ~2,02, komt overeen met een duo-paal

/**
 * Extra AC-laadpunten die op dezelfde, bestaande netaansluitingen passen
 * dankzij slim laden, TOEGEPAST OP DE BESTAANDE INFRASTRUCTUUR, niet op de
 * berekende behoefte. Puur een netcapaciteits-inzicht, geen vervanging van
 * de energiegebaseerde berekening.
 * @param {number} bestaandAC - bestaand, gewogen aantal AC-laadpunten
 */
export function slimLadenExtraRuimte(bestaandAC) {
  if (!bestaandAC) return 0;
  const factor = 1 / (1 - SLIM_LADEN_PIEKREDUCTIE);
  const extraPerAansluiting = factor - 1; // hoeveel MEER er per aansluiting bij kan
  return bestaandAC * (extraPerAansluiting / PALEN_PER_AANSLUITING_BASELINE);
}

// ── Werkgerelateerde (forensen) laadvraag op bedrijventerrein ──────────
// Alleen relevant voor wijken met bedrijventerrein in hun wijktype; deze
// vraag komt van werknemers die er niet wonen, dus wordt NIET door de
// gewone bewoners/bezoekers/logistiek-doelgroepenmix gedekt (die is
// gebaseerd op wijk.voertuigen, oftewel wie er woont).
export const WERKNEMERS_PER_HA = 17.4; // Rebel-studie obv VLAIO/RSZ-data (West-Vlaanderen, 2015)
export const FORENZEN_KM_PER_DAG = 37; // SD Worx 2025 (retour), bevestigd door MOBILO/UAntwerpen en BELDAM
export const WERKDAGEN_PER_JAAR = 220;

// ── Dekkingsnorm (ruimtelijke ondergrens) ───────────────────────────────
// MOW: gemeenten zonder goedgekeurd strategisch laadplan zijn verplicht
// "Paal volgt Wagen" met een norm van maximaal 250 meter tussen aanvrager
// en laadpaal uit te voeren (VR-besluit, dec. 2025). De norm gaat over de
// afstand tussen PALEN, niet tussen individuele laadpunten (sockets); een
// paal heeft doorgaans 2 laadpunten. Dit is een baseline-referentie, GEEN
// vervanging van de energiegebaseerde berekening: een strategisch laadplan
// bestaat juist om actief, obv reële vraag, locaties en aantallen te
// bepalen, niet om deze theoretische spreidingsnorm blind te volgen. Zie
// calcWijk: dekkingAC beïnvloedt totAC/totLP/delta niet, het is een puur
// informatief vergelijkingscijfer.
export const DEKKING_AFSTAND_M = 250;
const DEKKING_STRAAL_KM = (DEKKING_AFSTAND_M / 2) / 1000;
const DEKKING_OPPERVLAK_PER_PAAL_KM2 = Math.PI * DEKKING_STRAAL_KM * DEKKING_STRAAL_KM;
const LAADPUNTEN_PER_PAAL = 2;

/**
 * Minimaal aantal PALEN voor ruimtelijke dekking van een wijk (250m-norm),
 * los van de energiebehoefte.
 * @param {number} oppervlakteKm2
 */
export function dekkingPalen(oppervlakteKm2) {
  if (!oppervlakteKm2) return 0;
  return oppervlakteKm2 / DEKKING_OPPERVLAK_PER_PAAL_KM2;
}

/**
 * Dekkingsnorm uitgedrukt in laadpunten (2 per paal), zodat hij vergelijkbaar
 * is met de energiegebaseerde laadpunten-uitkomst. Puur ter referentie.
 * @param {number} oppervlakteKm2
 */
export function dekkingLaadpunten(oppervlakteKm2) {
  return dekkingPalen(oppervlakteKm2) * LAADPUNTEN_PER_PAAL;
}

// ── Stap 1: EV-aandeel ─────────────────────────────────────────────────
function interpoleerEvAandeelVlaanderen(jaar) {
  const a = EV_AANDEEL_VLAANDEREN;
  if (jaar <= 2025) return a[2025];
  if (jaar <= 2030) return a[2025] + (a[2030] - a[2025]) * (jaar - 2025) / 5;
  return a[2030] + (a[2035] - a[2030]) * (jaar - 2030) / 5;
}

/**
 * EV-aandeel voor een specifieke gemeente in een specifiek jaar.
 * @param {number} jaar
 * @param {number} welvaartsindexGemeente - Statbel-indicator van de gemeente; valt terug op het Vlaams gemiddelde als niet opgegeven
 * @param {number|null} override - eigen, lokaal cijfer (zoals Leuven 2030/2035); heeft voorrang indien opgegeven
 */
export function evAandeelGemeente(jaar, welvaartsindexGemeente = WELVAARTSINDEX_VLAANDEREN, override = null) {
  if (override != null) return override;
  const basis = interpoleerEvAandeelVlaanderen(jaar);
  return basis * (welvaartsindexGemeente / WELVAARTSINDEX_VLAANDEREN);
}

// ── Stap 4: utilisatie per laadpunt, met plafond op AC ─────────────────
export function acUtilisatieMwhMaand(jaar) {
  const kwhJaar = AC_KWH_PER_JAAR_TENDER[jaar] ?? AC_KWH_PER_JAAR_TENDER[2035];
  return Math.min(kwhJaar / 12 / 1000, AC_TRIGGER_MWH_MAAND);
}
function groeiCurve(startWaarde, totJaar) {
  let waarde = startWaarde;
  for (let j = 2027; j <= totJaar; j++) waarde *= (1 + dcHpcGroeiPct(j));
  return waarde;
}
export function dcUtilisatieMwhMaand(jaar)  { return groeiCurve(DC_HPC_START_MWH_MAAND.dc,  jaar); }
export function hpcUtilisatieMwhMaand(jaar) { return groeiCurve(DC_HPC_START_MWH_MAAND.hpc, jaar); }

/**
 * Berekent voor één wijk, in één jaar, de bruto AC/DC/HPC-behoefte
 * (inclusief redundantiemarge, exclusief aftrek van bestaande infrastructuur,
 * dat gebeurt op app-niveau).
 *
 * @param {object} wijk - { voertuigen, wijktype: string[], ovAandeel? }
 * @param {object} params
 * @param {number} params.year
 * @param {number} [params.welvaartsindexGemeente] - Statbel-indicator van de gemeente
 * @param {number|null} [params.evAandeelOverride] - eigen, lokaal EV-aandeel i.p.v. de welvaartsindex-schatting
 * @param {number} params.privePct - berekend privé-percentage (Stadsmonitor / Leuven-dataset / Fluvius), 0 tot 1
 * @param {number|null} [params.privePctOverride] - "% publiek laden"-invoer als override op het berekende privé-percentage
 * @param {number} [params.redundantieMarge]
 * @param {number} [params.trendFactor]
 */
export function calcWijk(wijk, params) {
  const {
    year,
    welvaartsindexGemeente = WELVAARTSINDEX_VLAANDEREN,
    evAandeelOverride = null,
    privePct,
    privePctOverride = null,
    redundantieMarge = REDUNDANTIE_MARGE,
    trendFactor = 1,
    slimLaden = false,
  } = params;

  // Stap 1: energiebehoefte
  const evPct = evAandeelGemeente(year, welvaartsindexGemeente, evAandeelOverride);
  const evs = wijk.voertuigen * evPct;
  const totMwh = evs * JAARKM * VERBRUIK_PER_KM * STADSFACTOR / 1000 * trendFactor;

  // Stap 2: privé vs. publiek+semipubliek
  const gebruiktPrivePct = privePctOverride != null ? privePctOverride : (privePct ?? 0.5);
  const mwhPubliek = totMwh * (1 - gebruiktPrivePct);

  // Stap 3: doelgroepenmix (wijktype, met combi-berekening bij hybride wijken) + AC/DC/HPC
  const types = (wijk.wijktype && wijk.wijktype.length) ? wijk.wijktype : ['woonwijk'];
  const mix = { bew: 0, bez: 0, log: 0 };
  types.forEach(t => {
    const m = WIJKTYPE_MIX[t] || WIJKTYPE_MIX.woonwijk;
    mix.bew += m.bew / types.length;
    mix.bez += m.bez / types.length;
    mix.log += m.log / types.length;
  });
  const ov = Math.max(0, Math.min(1, wijk.ovAandeel || 0));
  const rest = 1 - ov;
  const mwhBew = mwhPubliek * mix.bew * rest;
  const mwhBez = mwhPubliek * mix.bez * rest;
  const mwhLog = mwhPubliek * mix.log * rest;
  const mwhOv  = mwhPubliek * ov;

  // Werkgerelateerde (forensen) vraag, alleen voor bedrijventerrein-wijken.
  // Optie 2 (bewust gekozen i.p.v. optie 1): alleen het deel dat NIET privé/
  // semi-publiek door de werkgever wordt opgelost telt mee als publieke
  // vraag, met dezelfde privé%-verhouding als de rest van het model. Qua
  // laadtype behandeld als "bewoners" (lang, rustig parkeren tijdens een
  // volledige werkdag lijkt qua patroon meer op overnachten dan op kort
  // winkelbezoek), dus overwegend AC.
  const werkgerelateerdRelevant = types.includes('bedrijventerrein');
  let mwhWerk = 0;
  if (werkgerelateerdRelevant && wijk.oppervlakteKm2) {
    const werknemers = wijk.oppervlakteKm2 * 100 * WERKNEMERS_PER_HA;
    const werknemersEvs = werknemers * evPct;
    const kwhPerWerknemerJaar = FORENZEN_KM_PER_DAG * WERKDAGEN_PER_JAAR * VERBRUIK_PER_KM;
    const mwhWerkBruto = werknemersEvs * kwhPerWerknemerJaar / 1000;
    mwhWerk = mwhWerkBruto * (1 - gebruiktPrivePct); // optie 2: alleen niet-privé-opgeloste deel
  }

  const mwhAC  = mwhBew * DOELGROEP_LAADTYPE.bew.ac  + mwhBez * DOELGROEP_LAADTYPE.bez.ac  + mwhLog * DOELGROEP_LAADTYPE.log.ac  + mwhOv * DOELGROEP_LAADTYPE.ov.ac  + mwhWerk * DOELGROEP_LAADTYPE.bew.ac;
  const mwhDC  = mwhBew * DOELGROEP_LAADTYPE.bew.dc  + mwhBez * DOELGROEP_LAADTYPE.bez.dc  + mwhLog * DOELGROEP_LAADTYPE.log.dc  + mwhOv * DOELGROEP_LAADTYPE.ov.dc  + mwhWerk * DOELGROEP_LAADTYPE.bew.dc;
  const mwhHPC = mwhBew * DOELGROEP_LAADTYPE.bew.hpc + mwhBez * DOELGROEP_LAADTYPE.bez.hpc + mwhLog * DOELGROEP_LAADTYPE.log.hpc + mwhOv * DOELGROEP_LAADTYPE.ov.hpc + mwhWerk * DOELGROEP_LAADTYPE.bew.hpc;

  // Stap 4: utilisatie per laadpunt -> bruto aantal, met redundantiemarge
  // Bij slim laden: kleine, gebronneerde correctie (E-Laad studie), een
  // paal levert netto iets minder energie per sessie, dus is er iets MEER
  // capaciteit nodig voor dezelfde behoefte, niet minder.
  const acCorrectie = slimLaden ? (1 - SLIM_LADEN_ENERGIE_CORRECTIE) : 1;
  const acPerJaar  = acUtilisatieMwhMaand(year)  * 12 * acCorrectie;
  const dcPerJaar  = dcUtilisatieMwhMaand(year)  * 12;
  const hpcPerJaar = hpcUtilisatieMwhMaand(year) * 12;

  const totAC  = (mwhAC  / acPerJaar)  * (1 + redundantieMarge);
  const totDC  = (mwhDC  / dcPerJaar)  * (1 + redundantieMarge);
  const totHPC = (mwhHPC / hpcPerJaar) * (1 + redundantieMarge);

  // Ruimtelijke dekkingsnorm (MOW 250m-norm, "Paal volgt Wagen"), alleen
  // relevant voor AC en alleen zinvol bij woonwijk/binnenstad (geen
  // bewoners-"dicht bij huis"-behoefte op een zuiver bedrijventerrein).
  // LET OP: dit is bewust een REFERENTIECIJFER, geen ondergrens die de
  // uitkomst overschrijft. Een strategisch laadplan bestaat juist om obv
  // reële energievraag actief te bepalen waar en hoeveel palen nodig zijn;
  // de 250m-regel is de blinde, theoretische baseline die geldt bij het
  // ONTBREKEN van zo'n plan, niet iets waar de uitkomst van dit model
  // zelf aan ondergeschikt zou moeten zijn. totAC blijft daarom altijd
  // energiegebaseerd; dekkingAC wordt niet in totLP/delta/bijkomend
  // meegenomen, alleen getoond ter vergelijking.
  const dekkingRelevant = types.some(t => t === 'woonwijk' || t === 'binnenstad');
  const dekkingAC = dekkingRelevant ? dekkingLaadpunten(wijk.oppervlakteKm2) : 0;
  const dekkingLigtHoger = dekkingAC > totAC;

  return {
    evs, evPct, privePct: gebruiktPrivePct,
    totMwh: totMwh + mwhWerk, mwhPubliek: mwhPubliek + mwhWerk, mwhWerk, mwhAC, mwhDC, mwhHPC,
    totAC, totACEnergie: totAC, dekkingAC, dekkingLigtHoger,
    totDC, totHPC,
    totLP: totAC + totDC + totHPC,
  };
}
