/**
 * Google Sheets — upsert značky (všetky polia z panela).
 */
(function (global) {
  const debounceTimers = new Map();

  function config() {
    return global.TANDEM_SHEETS || {};
  }

  function isEnabled() {
    const url = (config().webAppUrl || "").trim();
    return url.length > 20 && url.indexOf("script.google.com") !== -1;
  }

  function getSpreadsheetEditUrl() {
    const id = (config().spreadsheetId || "").trim();
    if (!id) return "";
    return "https://docs.google.com/spreadsheets/d/" + id + "/edit";
  }

  function openSpreadsheet() {
    const url = getSpreadsheetEditUrl();
    if (!url) return;
    window.open(url, "_blank", "noopener");
  }

  function basePayload() {
    const payload = { action: "upsert" };
    const sheetId = (config().spreadsheetId || "").trim();
    if (sheetId) payload.spreadsheetId = sheetId;
    return payload;
  }

  function parseAppsScriptResponse(res, text) {
    if (res.url && res.url.indexOf("accounts.google.com") !== -1) {
      return {
        ok: false,
        error:
          "Apps Script nie je verejný — pri nasadení zvoľte prístup „Ktokoľvek“ (Anyone).",
      };
    }
    try {
      const data = JSON.parse(text);
      if (data.ok === false) {
        return { ok: false, error: data.error || "Chyba Apps Script" };
      }
      return { ok: true, data };
    } catch {
      if (text.indexOf("signin") !== -1 || text.indexOf("AccountChooser") !== -1) {
        return {
          ok: false,
          error:
            "Apps Script vyžaduje prihlásenie — nasadenie musí mať prístup „Ktokoľvek“.",
        };
      }
      return {
        ok: false,
        error: "Neplatná odpoveď servera (nové nasadenie webovej aplikácie?).",
      };
    }
  }

  async function postViaGet_(payload) {
    const base = config().webAppUrl.trim();
    const url = new URL(base);
    Object.keys(payload).forEach((key) => {
      const val = payload[key];
      if (val !== undefined && val !== null) url.searchParams.set(key, String(val));
    });
    const res = await fetch(url.toString(), { method: "GET", redirect: "follow" });
    const text = await res.text();
    return parseAppsScriptResponse(res, text);
  }

  async function post_(payload) {
    const url = config().webAppUrl.trim();
    try {
      const res = await fetch(url, {
        method: "POST",
        redirect: "follow",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(payload),
      });
      const text = await res.text();
      const parsed = parseAppsScriptResponse(res, text);
      if (!parsed.ok && parsed.error && parsed.error.indexOf("Apps Script") !== -1) {
        return postViaGet_(payload);
      }
      return parsed;
    } catch (err) {
      console.warn("Tandem Sheets POST:", err);
      try {
        return await postViaGet_(payload);
      } catch (err2) {
        return { ok: false, error: String(err2.message || err2) };
      }
    }
  }

  /**
   * @param {object} record
   * @param {{ debounce?: boolean }} [opts]
   */
  function saveMarker(record, opts) {
    if (!isEnabled()) return Promise.resolve({ skipped: true });
    if (!record || !record.markerId) return Promise.resolve({ skipped: true });

    const payload = Object.assign(basePayload(), record);
    const useDebounce = opts && opts.debounce !== false;
    const id = String(record.markerId);

    if (!useDebounce) {
      return post_(payload);
    }

    return new Promise((resolve) => {
      if (debounceTimers.has(id)) {
        clearTimeout(debounceTimers.get(id));
      }
      const timer = setTimeout(async () => {
        debounceTimers.delete(id);
        resolve(await post_(payload));
      }, 500);
      debounceTimers.set(id, timer);
    });
  }

  /** @deprecated použite saveMarker */
  function appendMarker(type, name) {
    return saveMarker({
      type: type === "modul" ? "modul" : "kabel",
      markerId: "",
      label: name,
    });
  }

  /** Vytvorí / pripraví karty Kable a Moduly v tabuľke */
  function setupSheets() {
    if (!isEnabled()) return Promise.resolve({ skipped: true });
    return post_(
      Object.assign(basePayload(), {
        action: "setup",
      })
    );
  }

  global.TandemSheets = {
    isEnabled,
    saveMarker,
    appendMarker,
    setupSheets,
    getSpreadsheetEditUrl,
    openSpreadsheet,
  };

  if (isEnabled()) {
    setupSheets().then((r) => {
      if (r && r.ok) console.info("Tandem Sheets: karty Kable a Moduly pripravené.");
      if (r && !r.ok && !r.skipped) console.warn("Tandem Sheets setup:", r.error);
    });
  }
})(window);
