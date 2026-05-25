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

V tabuľke musia byť **dve karty** (listy):

| Karta v Sheets | Čo sa tam ukladá |
|----------------|------------------|
| **Kable**      | položky typu Kábel |
| **Moduly**     | položky typu Modul |

Tandem ich vytvorí sám pri prvom otvorení (ak má Apps Script prístup). Starý prázdny list „Hárok1“ môžete zmazať alebo nechať.

---

## 2. Apps Script

1. V tabuľke: **Rozšírenia → Apps Script**.
2. Vymažte predvolený kód a vložte obsah súboru  
   `google-apps-script/Code.gs` z tohto projektu.
3. **Uložiť** (Ctrl+S).
4. **Nasadiť → Nové nasadenie** (pri každej zmene kódu znova nasaďte):
   - Typ: **Webová aplikácia**
   - Spustiť ako: **Ja**
   - **Kto má prístup: Ktokoľvek** (angl. *Anyone*) — bez toho Tandem z webu do tabuľky nezapíše
5. Skopírujte **URL webovej aplikácie** (končí na `/exec`, nie `/dev`).

### Overenie nasadenia

V prehliadači otvorte (nahraďte URL):

`https://script.google.com/macros/s/VASE-ID/exec?type=modul&markerId=test&name=Test`

Ak vidíte JSON `{"ok":true,...}`, je to v poriadku. Ak stránka na prihlásenie do Google, nasadenie nie je verejné — zopakujte krok 4 s **Ktokoľvek**.

---

## 3. Pripojenie v Tandem

1. Skopírujte `sheets-config.example.js` → `sheets-config.js` (ak ešte nemáte).
2. Do `sheets-config.js` vložte URL:

```javascript
window.TANDEM_SHEETS = {
  webAppUrl: "https://script.google.com/macros/s/VASE-ID/exec",
};
```

3. Pushnite na GitHub (`main`) — Netlify nasadí: https://aquamarine-sunburst-ed5bc5.netlify.app  
   Alebo lokálne **Ctrl+F5**.

**Git ≠ Apps Script:** zmeny v `google-apps-script/Code.gs` na GitHube sa do Google **neskopírujú** samy — kód vložte ručne v Apps Script a znova nasaďte webovú aplikáciu.

---

## 4. Overenie

1. Otvorte Tandem, presuňte **Modul** na plán.
2. V Google Sheets na liste **Moduly** by mal pribudnúť riadok (napr. „Modul“).
3. To isté pre **Kábel** → list **Kable**.

Ak URL v `sheets-config.js` chýba, aplikácia funguje ďalej, len bez zápisu do Sheets.

