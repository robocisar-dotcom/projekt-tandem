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

### Po zmene `google-apps-script/Code.gs`

1. Otvorte tabuľku → **Rozšírenia → Apps Script**
2. Vložte nový kód z `Code.gs`
3. **Nasadiť → Nové nasadenie** (Webová aplikácia, prístup Ktokoľvek)
4. Ak sa zmení URL, aktualizujte `webAppUrl` v `sheets-config.js` a pushnite na GitHub

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
