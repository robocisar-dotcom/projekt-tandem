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

  async function post_(payload) {
    const url = config().webAppUrl.trim();
    try {
      await fetch(url, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(payload),
      });
      return { ok: true };
    } catch (err) {
      console.warn("Tandem Sheets:", err);
      return { ok: false, error: err };
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

  global.TandemSheets = {
    isEnabled,
    saveMarker,
    appendMarker,
    getSpreadsheetEditUrl,
    openSpreadsheet,
  };
})(window);
