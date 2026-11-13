# 3DConfig – 3D-produktkonfigurator (webbapp)

En webbapplikation i stil med Animechs Aniconfigurator: kunden ser produkten i
fotorealistisk 3D i realtid i webbläsaren, väljer bara giltiga alternativ via produktregler
och går från konfiguration till offert – helt utan plugin eller nedladdning.

Demoprodukten är en **vägghängd köksfläkt** (60/70/90 cm) byggd procedurellt i kod,
monterad i ett minimalistiskt kök (vägg, bänkskiva, skåp, gryta) så att ljussättning
och skuggor får en realistisk kontext.

## Kör lokalt

```
cd 3dconf
npm run serve        # eller: python3 -m http.server 8000
# öppna http://127.0.0.1:8000/
```

Allt (inklusive Three.js r170) ligger lokalt i `vendor/` – appen fungerar helt offline.

## Automatiserad testning och validering (körs före varje push och i CI)

```
npm test
```

Det kör:

1. **Syntaxtest** – `node --check` på alla JS-filer (`js/`, `tests/`, `scripts/`)
2. **Enhetstester** (`tests/config.test.mjs`) – regler, prissättning, sammanfattning,
   encode/decode roundtrip, sanering av ogiltig state
3. **Smoke-test** (`tests/smoke.test.mjs`):
   - lokal loopback-server där `index.html`, alla resurser och hela `import`-kedjan måste svara 200
   - vendorerad Three.js r170 laddas headless och bygger geometri
   - hela köksfläkten byggs headless: breddväxling bygger om modellen, finishbyte byter material,
     tillval blir synliga, LED av/på styr punktljusen

Samma kommando körs automatiskt i GitHub Actions (`.github/workflows/ci.yml`) på varje push/PR.

## Så testar du manuellt (checklista när du får en ny version)

1. `npm test` – alla automatiska tester måste vara gröna
2. `npm run serve` → öppna http://127.0.0.1:8000/
3. Gå igenom checklistan:
   - [ ] Dra för att rotera, scrolla för att zooma, högerklicka för panorera
   - [ ] Byt bredd 60 → 90 cm – modellen ska byggas om i rätt storlek
   - [ ] Välj 60 cm + försök koppar-kåpa/glasfront – ska vara inaktiverat med förklaring
   - [ ] Byt yta till Koppar / Matt svart / Högblank vit – modellen ska byta finish direkt
   - [ ] Belysning: Varmvitt/Kallvitt/Av – LED under kåpan och punktljuset ska följa med
   - [ ] Ljusmiljö: Kök dagsljus / Kök kväll / Fotostudio
   - [ ] Kvalitet: prova presets Låg/Medel/Hög/Ultra + skjutreglage (FPS-chippet uppe till vänster)
   - [ ] Skärpedjup (DOF) på/av + bländare; VSM-skuggor; vignett/granularitet – zooma in på stålet och se fönsterreflexerna
   - [ ] Tillval: glasfront, skorstensförlängning, monteringsskena – syns med pop-animation
   - [ ] "Kopiera delbar länk" – öppna länken i nytt fönster, konfigurationen ska laddas
   - [ ] "Skicka offert" – sammanfattning med alla val och totalt pris
   - [ ] Exportera PNG 2K/4K och JSON – filer laddas ner
   - [ ] Mobilvy (smal fönster): ☰-knappen öppnar inställningspanelen

## Funktionalitet

- **Se den** – realtids-3D (WebGL): rotera, zooma, panorera (OrbitControls), desktop och mobil.
- **Konfigurera den** – regelmotor: ogiltiga kombinationer inaktiveras med förklaring
  (t.ex. koppar-kåpa ej i 60 cm, vitlackerad skorsten bara med vit/svart kåpa).
- **Köp den** – prislista i realtid, sammanfattning, "Skicka offert"-modal,
  delbar konfigurationslänk (URL-hash), sparad lokalt (localStorage), export av JSON.

## Produktanpassade val (köksfläkt)

- **Bredd**: 60 / 70 / 90 cm (modellen byggs om i skala 1:10)
- **Ytor/finish**: rostfritt borstat stål, matt svart, högblank vit, koppar (premium)
  – på kåpa och skorsten; fettfilter i aluminium eller kolfilter; kontrollpanel i svart glas
- **Belysning**: LED under kåpan, varmvitt 2700K / kallvitt 4000K / av – tänder även
  riktiga punktljus i scenen (ljussättningen följer ditt val)
- **Tillval**: glasfront i härdat glas, skorstensförlängning 50 cm, monteringsskena

## Högre kvalitet på modellen

- Supersampling (render-skala 0.5–3x) + MSAA + FXAA vid låg upplösning, förinställningar Låg/Medel/Hög/Ultra.
- Skuggor upp till 4096 px i två lägen: PCFSoft eller extra mjuka VSM (radius + blur-samples).
- Post-processing-kedja: SSAO (kontaktskuggor), UnrealBloom, skärpedjup (DOF/Bokeh, fokus följer kameran),
  samt slutpass med vignett + filmgranularitet.
- ACES Filmic / Neutral tonmappning, exponeringskontroll, köksanpassade IBL-miljöer
  (dagsljus / kväll / fotostudio) via PMREM – dagsljusmiljön innehåller ett skarpt "fönster"
  som ger långa reflexer i det borstade stålet.
- Procedurella PBR-material i hög upplösning (upp till 1024 px): borstat rostfritt stål med
  anisotropisk struktur + roughness-karta, koppar, clearcoat-lack, riktigt transmissivt glas
  (transmission + IOR), filterväv, stenbänk, trä.
- Detaljerad geometri: kåpa med kantlist, skorsten med ventilationsspringor, skruvar,
  varumärkesplakett "3DC", filter med ram och handtag, glasfront med metallram,
  kontrollpanel med bezel/knappar/display, köksmiljö med fönster, skåpsluckor, bänkskiva och rekvisita.
- Mjuka färgövergångar och "pop"-animation när tillval aktiveras.
- Export av högupplösta stillbilder (PNG 2K/4K).

## Struktur

```
index.html          skal + importmap
css/style.css       mörkt studio-UI
js/config.js        produktschema, regler, prissättning, state (ren JS, testbar i Node)
js/materials.js     procedurella texturer + materialfabrik
js/product.js       procedurell 3D-modell (köksfläkt + köksmiljö)
js/quality.js       kvalitetslager: post-processing, skuggor, miljöer, presets
js/ui.js            panel-UI (bredd, ytor, tillval, kvalitet, sammanfattning)
js/main.js          renderer, scen, loop, state, export, offert
vendor/three/       Three.js r170 + addons (lokalt, offline)
```
