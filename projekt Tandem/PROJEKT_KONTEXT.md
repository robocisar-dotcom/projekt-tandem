# Tandem — projektový kontext

**Live:** https://aquamarine-sunburst-ed5bc5.netlify.app  
**GitHub:** https://github.com/robocisar-dotcom/projekt-tandem  
**Netlify deploys:** https://app.netlify.com/projects/aquamarine-sunburst-ed5bc5/deploys  
**Sheets:** https://docs.google.com/spreadsheets/d/1K5OpFtFQijyR0A9sfa3dIDhmxkhUVdsGcwCkuYh3nBk/edit

## Konfigurácia (`sheets-config.js`)

```javascript
window.TANDEM_SHEETS = {
  spreadsheetId: "1K5OpFtFQijyR0A9sfa3dIDhmxkhUVdsGcwCkuYh3nBk",
  webAppUrl: "https://script.google.com/macros/s/AKfycbzSHKYGbIk7kIfs95-5nLztck6-ZJ4tWsej5fJhP3K9Y-hIsQlbZRt66G0yg3L-9qDg7w/exec",
};
```

## Ako to funguje

1. Statická web appka, deploy z `main`, base dir `projekt Tandem`.
2. Zápis do Sheets cez Apps Script (`google-apps-script/Code.gs` — **ručne** do Google po každej zmene).
3. Riadok = **`markerId`** (stĺpec **ID** na konci, môže byť skrytý).
4. **Názov** = viditeľný názov položky; premenovanie aktualizuje ten istý riadok.
5. Zmena **názvu plánu** → všetky položky sa znova odošlú (stĺpec Názov plánu).
6. **×** na pláne → `action=delete` v Sheets.
7. **Otvoriť tabuľku** → jedna karta `tandem_google_sheets` (nie nová pri každom kliku).

## `sheets.js` — neodstraňovať

- `postViaNoCorsGet_` (skrytý **iframe** + GET)
- `buildGetUrl_`
- `saveMarker` / `deleteMarker`

## Apps Script akcie

| action | Účel |
|--------|------|
| `setup` | Karty Kable + Moduly, hlavičky |
| `upsert` | Pridať / aktualizovať riadok podľa markerId |
| `delete` | Vymazať riadok podľa markerId |
| `clear` | Vymazať všetky dáta (nie hlavičky) |

### Test URL

- Setup: `.../exec?action=setup`
- Clear: `.../exec?action=clear`
- Upsert: `.../exec?action=upsert&type=modul&markerId=manual-test-001&planName=Test&label=Test%20Modul&available=1&osadeny=1&posX=50&posY=50`

## Po zmene `Code.gs`

1. Skopírovať celý `Code.gs` do Apps Script editora.
2. Uložiť → **Deploy** (Execute as: Me, Access: Anyone).
3. Spustiť `setupTandemSheets` alebo otvoriť `?action=setup`.
4. Pri testoch: `?action=clear`.
5. Ak sa zmení URL → `sheets-config.js` + push.

## Po zmene web súborov

1. Upraviť súbory v `projekt Tandem/`.
2. Zvýšiť `?v=` v `index.html` (sheets-config, sheets, app).
3. Commit + push `main`.
4. Počkať Netlify **Published**, potom **Ctrl+F5**.

## Stĺpce v Sheets

**Kable:** Názov plánu, Názov, Dostupnosť, Natiahnutý, Tenant, Abutisant, Poznámky, Pozícia X %, Pozícia Y %, Aktualizované, ID  

**Moduly:** Názov plánu, Názov, Dostupnosť, Osadený, Poznámky, Pozícia X %, Pozícia Y %, Aktualizované, ID  

V Sheets neupravovať: hlavičky, poradie stĺpcov, stĺpec ID.

## Test scenár

1. Modul na plán → riadok v **Moduly**.
2. Zmena názvu modulu → ten istý riadok, nový **Názov**.
3. Zmena názvu plánu → **Názov plánu** u všetkých riadkov.
4. × na modul → riadok zmizne.
5. To isté pre **Kábel** / **Kable**.
