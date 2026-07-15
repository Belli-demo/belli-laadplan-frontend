# Belli Laadkaart

Interactieve GIS-tool voor strategische laadinfrastructuurplanning.

## Features
- Gemeenteselectie (Leuven, Olen, Gent — uitbreidbaar)
- Live bestaande laadpalen via OpenStreetMap Overpass API
- Laadpuntprognose per wijk 2025–2035 (Belli Laadsimulator v1.1 model)
- Scenario's (laag/basis/hoog), segmentfilters, trendscenario's
- Interactieve grafieken: energievraag, laadpunten, CAPEX

## Deploy op Railway

1. Push naar GitHub repo
2. Nieuw Railway project → Deploy from GitHub
3. Railway detecteert Dockerfile automatisch
4. Geen environment variables nodig

## Gemeente toevoegen

Voeg gemeente toe aan `src/gemeenteData.js`:
```js
mijnstad: {
  id: 'mijnstad', naam: 'Mijn Stad',
  center: [lat, lng], zoom: 13,
  bbox: [south, west, north, east],
  wijken: [ ... ]
}
```

## Databronnen
- Kaartmateriaal: CartoDB Light (OpenStreetMap)
- Bestaande laadpalen: OpenStreetMap via Overpass API
- Prognosemodel: Belli Laadsimulator v1.1
- Wijkdata: Statbel / Leuven in Cijfers (illustratief – vervang door echte data)
