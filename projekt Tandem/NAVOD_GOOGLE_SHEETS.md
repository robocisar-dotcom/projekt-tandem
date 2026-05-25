# Tandem — Google Sheets (zápis pri pridaní na plán)

Keď presuniete **Kábel** alebo **Modul** z panela na plán, meno sa automaticky dopíše do tabuľky:

| Typ na pláne | List (karta) v Google Sheets |
|--------------|------------------------------|
| Kábel        | **Kable**                    |
| Modul        | **Moduly**                   |

Ukladajú sa **všetky údaje z panela** (pri každej zmene sa riadok aktualizuje podľa ID značky).

### List **Kable**
| ID | Názov plánu | Názov | Dostupnosť | Natiahnutý | Tenant | Abutisant | Poznámky | Pozícia X % | Pozícia Y % | Aktualizované |

### List **Moduly**
| ID | Názov plánu | Názov | Dostupnosť | Osadený | Poznámky | Pozícia X % | Pozícia Y % | Aktualizované |

---

## 1. Vaša tabuľka (už máte)

**[projekt Tandem](https://docs.google.com/spreadsheets/d/1K5OpFtFQijyR0A9sfa3dIDhmxkhUVdsGcwCkuYh3nBk/edit)** — ID je už v `sheets-config.js`.

Listy **Kable** a **Moduly** sa vytvoria automaticky pri prvom zápise (teraz je len prázdny „Hárok1“).

---

## 2. Apps Script

1. V tabuľke: **Rozšírenia → Apps Script**.
2. Vymažte predvolený kód a vložte obsah súboru  
   `google-apps-script/Code.gs` z tohto projektu.
3. **Uložiť** (Ctrl+S).
4. **Nasadiť → Nové nasadenie** (pri každej zmene kódu znova nasaďte):
   - Typ: **Webová aplikácia**
   - Spustiť ako: **Ja**
   - Kto má prístup: **Ktokoľvek** (alebo „Ktokoľvek s odkazom“)
5. Skopírujte **URL webovej aplikácie** (končí na `/exec`).

---

## 3. Pripojenie v Tandem

1. Skopírujte `sheets-config.example.js` → `sheets-config.js` (ak ešte nemáte).
2. Do `sheets-config.js` vložte URL:

```javascript
window.TANDEM_SHEETS = {
  webAppUrl: "https://script.google.com/macros/s/VASE-ID/exec",
};
```

3. Obnovte stránku (**Ctrl+F5**) alebo znova nasaďte na Netlify (ZIP musí obsahovať `sheets-config.js`, `sheets.js` a `index.html`).

---

## 4. Overenie

1. Otvorte Tandem, presuňte **Modul** na plán.
2. V Google Sheets na liste **Moduly** by mal pribudnúť riadok (napr. „Modul“).
3. To isté pre **Kábel** → list **Kable**.

Ak URL v `sheets-config.js` chýba, aplikácia funguje ďalej, len bez zápisu do Sheets.

---

## Ďalší krok (neskôr)

Úprava názvu v paneli, dostupnosť, prepínače — doplníme do toho istého skriptu, keď budete chcieť.
