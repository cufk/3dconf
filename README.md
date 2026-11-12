# AniConfigurator – 3D-produktkonfigurator (webbapp)

En webbapplikation inspirerad av Animechs Aniconfigurator: kunden ser produkten i
fotorealistisk 3D i realtid i webbläsaren, väljer bara giltiga alternativ via produktregler
och går från konfiguration till offert – helt utan plugin eller nedladdning.

Demoprodukten är en modulär ryggsäck ("Fjäll Ryggsäck", 16/21/28 L) byggd procedurellt i kod.

## Kör lokalt

```
cd aniconfigurator
python3 -m http.server 8000
# öppna http://127.0.0.1:8000/
```

Allt (inklusive Three.js r170) ligger lokalt i `vendor/` – appen fungerar helt offline.

## Funktionalitet (motsvarar Aniconfigurator)

- **Se den** – realtids-3D (WebGL): rotera, zooma, panorera (OrbitControls), desktop och mobil.
- **Konfigurera den** – regler motor: ogiltiga kombinationer inaktiveras med förklaring
  (t.ex. sittunderlag bara i 21/28 L, läderdetaljer ej i 16 L).
- **Köp den** – prislista i realtid, sammanfattning, "Skicka offert"-modal,
  delbar konfigurationslänk (URL-hash), sparad lokalt (localStorage), export av JSON.

## Högre kvalitet på modellen (tilläggen)

- Supersampling (render-skala 0.5–3x) + MSAA, förinställningar Låg/Medel/Hög/Ultra.
- PCFSoft-skuggor upp till 4096 px, SSAO (kontaktskuggor) och UnrealBloom via post-processing.
- ACES Filmic / Neutral tonmappning, exponeringskontroll, tre IBL-ljusmiljöer
  (studio / solnedgång / industrihall) via PMREM.
- Procedurella PBR-material: vävd duk (karta + bump + roughness), läder med clearcoat,
  metaller med env-reflektioner; anisotropisk filtrering.
- Detaljer i geometrin: sömmar, dragkedja med instansierade tänder, logotyp, handtag,
  vadderade axelremmar med spännen, bröstrem.
- Mjuka färgövergångar och "pop"-animation när tillval aktiveras.
- Export av högupplösta stillbilder (PNG 2K/4K).

## Struktur

```
index.html          skal + importmap
css/style.css       mörkt studio-UI
js/config.js        produktschema, regler, prissättning, state (ren JS, testbar i Node)
js/materials.js     procedurella texturer + materialfabrik
js/product.js       procedurell 3D-modell av ryggsäcken
js/quality.js       kvalitetslager: post-processing, skuggor, miljöer, presets
js/ui.js            panel-UI (storlek, delar, tillval, kvalitet, sammanfattning)
js/main.js          renderer, scen, loop, state, export, offert
vendor/three/       Three.js r170 + addons (lokalt, offline)
```
