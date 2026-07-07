# STRIDE-tool

Webbverktyg för STRIDE-hotmodellering med DREAD-scoring. Användarspråk: svenska.

> Globala arbetsprinciper (Karpathy) gäller alltid och dokumenteras inte här.
> Denna fil hålls mager och växer bara när något faktiskt är icke-uppenbart.

## Arkitektur

- **`index.html`** innehåller HTML och JS; appens CSS ligger i `styles.css`
  (länkad via `<link>`). Vanilla JS, inget ramverk, inga beroenden i appen,
  ingen build, inget lint-steg. (Rapportens CSS i `exportReport` är dock
  fortsatt inline.)
- Kör genom att öppna `index.html` i en webbläsare.

## Test & verifiering

- **Enhetstester:** `node --test test.mjs` (noll beroenden, bara inbyggda
  Node-moduler). `test.mjs` läser `index.html`, kör den rena logiken i en
  `node:vm`-sandbox och lämnar `index.html` orört.
- Täcker bara DOM-fri logik (`esc`, `tkey`, `dreadSum`, `fresh`, `maxDread`).
  DOM-/interaktionsbeteende verifieras i webbläsaren, inte här.

## State & rendering

- Hela appens tillstånd är ett enda objekt `state` (se `fresh()`).
- Persisteras till `localStorage['stride']` via `persist()`.
- Ingen reaktivitet: efter en mutation, anropa `persist()` och relevant(a)
  `render*()`-funktion(er) manuellt (`renderSidebar`, `renderCanvas`,
  `renderPanel`, `renderFlows`).
- Användartext som skrivs in i `innerHTML` måste köras genom `esc()`.

## Domän

- `CATS` = de sex STRIDE-kategorierna. `DREAD` = de fem poängfälten (var 1–10,
  summa 0–50). `threshold` (default 25) markerar kritiska hot.

## Konventioner

- Behåll noll-beroende-/noll-build-ansatsen om inget annat begärs: HTML+JS i
  `index.html`, appens CSS i `styles.css`, inga fler filer/ramverk/beroenden.
- Koden är medvetet terse med korta namn — matcha den stilen.
