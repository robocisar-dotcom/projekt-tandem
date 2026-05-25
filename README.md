# Tandem

Webová aplikácia na plánovanie káblov a modulov s ukladaním do [Google Sheets](https://docs.google.com/spreadsheets/d/1K5OpFtFQijyR0A9sfa3dIDhmxkhUVdsGcwCkuYh3nBk/edit).

**Živá stránka:** https://aquamarine-sunburst-ed5bc5.netlify.app  
**GitHub:** https://github.com/robocisar-dotcom/projekt-tandem

---

## Štruktúra repozitára

Súbory aplikácie sú v podpriečinku **`projekt Tandem/`** (Netlify base directory).

| Súbor | Účel |
|-------|------|
| `index.html` | Hlavná stránka |
| `app.js` | Plán, značky, panel |
| `style.css` | Vzhľad |
| `sheets.js` | Zápis do Google Sheets |
| `sheets-config.js` | ID tabuľky + URL Apps Script |
| `google-apps-script/Code.gs` | Kód pre Google (kopíruje sa ručne) |

---

## Netlify

- Repozitár: `robocisar-dotcom/projekt-tandem`
- Branch: `main`
- Base directory: `projekt Tandem`
- Publish directory: `.`
- Build command: *(prázdny)*

Po **push na `main`** sa stránka nasadí automaticky.

---

## Google Sheets

Konfigurácia v `sheets-config.js`. Podrobný návod: **`NAVOD_GOOGLE_SHEETS.md`**.

### Zápis z Netlify (CORS)

V `sheets.js` je reťazec: **POST → GET → `postViaNoCorsGet_`** (GET s `mode: "no-cors"`).  
Funkciu **`postViaNoCorsGet_` neodstraňovať** — bez nej zápis z live stránky často zlyhá.

### Po zmene `google-apps-script/Code.gs`

1. Vložte nový kód do **Apps Script** (z `google-apps-script/Code.gs`)
2. Spustite **`setupTandemSheets`** (vytvorí karty **Kable** a **Moduly**)
3. **Nasadiť → Nové nasadenie** → Webová aplikácia, prístup **Ktokoľvek**
4. Ak sa zmení `/exec` URL, aktualizujte `webAppUrl` v `sheets-config.js`
5. `git add "projekt Tandem"` → commit → `git push origin main` (Netlify nasadí samo)

### Kontrola po deployi

- https://aquamarine-sunburst-ed5bc5.netlify.app/sheets-config.js — `spreadsheetId`, `webAppUrl`
- https://aquamarine-sunburst-ed5bc5.netlify.app/sheets.js — musí obsahovať `postViaNoCorsGet_`

---

## Lokálny vývoj

Otvorte `index.html` v prehliadači alebo použite jednoduchý lokálny server. Pre Sheets musí byť vyplnený `sheets-config.js`.

---

## Commit a push (z koreňa repozitára)

```bash
git add "projekt Tandem"
git commit -m "Popis zmeny"
git push origin main
```
