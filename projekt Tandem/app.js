const toggle = document.getElementById("toggle-sidebar");
const layout = document.querySelector(".layout");
const btnOpenSheets = document.getElementById("btn-open-sheets");

if (toggle && layout) {
  toggle.addEventListener("change", () => {
    layout.classList.toggle("sidebar-collapsed", toggle.checked);
  });
}

if (btnOpenSheets) {
  btnOpenSheets.addEventListener("click", () => {
    window.TandemSheets?.openSpreadsheet?.();
  });
}

/* Presúvanie položiek na plán + detail kábla / modulu */
(function () {
  const planStage = document.getElementById("plan-stage");
  const planMarkers = document.getElementById("plan-markers");
  const toolbox = document.getElementById("toolbox-items");
  const panel = document.getElementById("marker-panel");
  const panelName = document.getElementById("marker-panel-name");
  const panelNotes = document.getElementById("marker-panel-notes");
  const panelClose = document.getElementById("marker-panel-close");
  const planNameInput = document.getElementById("plan-name");
  const btnCopyFromPlan = document.getElementById("btn-copy-from-plan");
  const btnSaveName = document.getElementById("btn-save-name");
  const nameStatus = document.getElementById("marker-name-status");
  const panelType = document.getElementById("marker-panel-type");
  const panelAvailable = document.getElementById("marker-panel-available");
  const availStatus = document.getElementById("marker-avail-status");
  const swNatiahnuty = document.getElementById("sw-natiahnuty");
  const swTenant = document.getElementById("sw-tenant");
  const swAbutisant = document.getElementById("sw-abutisant");
  const stateNatiahnuty = document.getElementById("state-natiahnuty");
  const stateTenant = document.getElementById("state-tenant");
  const stateAbutisant = document.getElementById("state-abutisant");
  const swOsadeny = document.getElementById("sw-osadeny");
  const stateOsadeny = document.getElementById("state-osadeny");
  const switchesKabel = document.getElementById("switches-kabel");
  const switchesModul = document.getElementById("switches-modul");

  const KABEL_SWITCHES = [
    { key: "natiahnuty", input: () => swNatiahnuty, state: () => stateNatiahnuty },
    { key: "tenant", input: () => swTenant, state: () => stateTenant },
    { key: "abutisant", input: () => swAbutisant, state: () => stateAbutisant },
  ];

  const MODUL_SWITCHES = [{ key: "osadeny", input: () => swOsadeny, state: () => stateOsadeny }];

  function switchesForType(type) {
    return type === "modul" ? MODUL_SWITCHES : KABEL_SWITCHES;
  }

  function showSwitchSection(type) {
    const isKabel = type === "kabel";
    const isModul = type === "modul";
    if (switchesKabel) switchesKabel.hidden = !isKabel;
    if (switchesModul) switchesModul.hidden = !isModul;
  }

  function clearUnusedMarkerData(el) {
    if (!el) return;
    if (el.dataset.type === "kabel") {
      delete el.dataset.osadeny;
    } else if (el.dataset.type === "modul") {
      delete el.dataset.natiahnuty;
      delete el.dataset.tenant;
      delete el.dataset.abutisant;
    }
  }

  function defaultLabel(type) {
    return type === "kabel" ? "Kábel" : "Modul";
  }

  function isDetailMarker(el) {
    const t = el?.dataset?.type;
    return t === "kabel" || t === "modul";
  }

  if (!planStage || !planMarkers || !toolbox) return;

  if (panel) {
    panel.addEventListener("pointerdown", (e) => e.stopPropagation());
    panel.addEventListener("click", (e) => e.stopPropagation());
  }

  let drag = null;
  let markerId = 0;
  let openMarker = null;
  let planNameSyncTimer = null;
  const DRAG_THRESHOLD = 8;

  function updateEmpty() {
    planStage.classList.toggle("has-markers", planMarkers.children.length > 0);
  }

  function clientPoint(e) {
    if (e.touches && e.touches[0]) {
      return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
    return { x: e.clientX, y: e.clientY };
  }

  function isOverStage(x, y) {
    const r = planStage.getBoundingClientRect();
    return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
  }

  function dropPercent(x, y) {
    const r = planStage.getBoundingClientRect();
    const px = ((x - r.left) / r.width) * 100;
    const py = ((y - r.top) / r.height) * 100;
    return {
      x: Math.min(98, Math.max(2, px)),
      y: Math.min(98, Math.max(2, py)),
    };
  }

  function syncNotesIndicator(el) {
    const has = !!(el.dataset.notes && el.dataset.notes.trim());
    el.classList.toggle("has-notes", has);
  }

  function isMarkerAvailable(el) {
    return el.dataset.available === "1";
  }

  function syncAvailability(el, available) {
    el.dataset.available = available ? "1" : "0";
    el.classList.toggle("is-available", available);
    el.classList.toggle("is-unavailable", !available);
  }

  function setPanelExtrasEnabled(available) {
    const locked = !available;
    if (!openMarker) return;
    const list = switchesForType(openMarker.dataset.type);
    list.forEach(({ input }) => {
      const el = input();
      if (el) el.disabled = locked;
    });
    const section = openMarker.dataset.type === "modul" ? switchesModul : switchesKabel;
    section?.querySelectorAll(".switch-row").forEach((row) => {
      row.classList.toggle("switch-row--disabled", locked);
    });
    if (panelNotes) panelNotes.disabled = locked;
    if (btnCopyFromPlan) btnCopyFromPlan.disabled = locked;
  }

  function updateAvailUI(available) {
    if (panelAvailable) panelAvailable.checked = available;
    if (availStatus) {
      availStatus.textContent = available ? "Je k dispozícii" : "Nie je k dispozícii";
      availStatus.classList.toggle("avail-status--on", available);
      availStatus.classList.toggle("avail-status--off", !available);
    }
    setPanelExtrasEnabled(available);
  }

  function isSwitchOn(el, key) {
    return el.dataset[key] === "1";
  }

  function setSwitch(el, key, on) {
    el.dataset[key] = on ? "1" : "0";
  }

  function updateSwitchUI(key, on, type) {
    const cfg = switchesForType(type || openMarker?.dataset.type || "kabel").find(
      (s) => s.key === key
    );
    if (!cfg) return;
    const input = cfg.input();
    const stateEl = cfg.state();
    if (input) input.checked = on;
    if (stateEl) {
      stateEl.textContent = on ? "Áno" : "Nie";
      stateEl.classList.toggle("is-yes", on);
      stateEl.classList.toggle("is-no", !on);
    }
  }

  function loadExtraSwitches(el) {
    switchesForType(el.dataset.type).forEach(({ key }) => {
      updateSwitchUI(key, isSwitchOn(el, key), el.dataset.type);
    });
  }

  function bindExtraSwitchHandlers() {
    function bindList(list) {
      list.forEach(({ key, input }) => {
        const el = input();
        if (!el) return;
        el.addEventListener("change", () => {
          if (!openMarker) return;
          const on = el.checked;
          setSwitch(openMarker, key, on);
          updateSwitchUI(key, on, openMarker.dataset.type);
          syncMarkerToSheets(openMarker);
        });
      });
    }
    bindList(KABEL_SWITCHES);
    bindList(MODUL_SWITCHES);
  }

  function createGhost(label, type, x, y) {
    const g = document.createElement("div");
    g.className = "drag-ghost drag-ghost--" + type;
    g.textContent = label;
    g.style.left = x + "px";
    g.style.top = y + "px";
    document.body.appendChild(g);
    return g;
  }

  function closePanel() {
    if (openMarker) openMarker.classList.remove("panel-open");
    openMarker = null;
    if (panel) panel.hidden = true;
  }

  function markerPosition(el) {
    const x = parseFloat(String(el.style.left || "").replace("%", ""));
    const y = parseFloat(String(el.style.top || "").replace("%", ""));
    return {
      posX: Number.isFinite(x) ? x : "",
      posY: Number.isFinite(y) ? y : "",
    };
  }

  function collectMarkerRecord(el) {
    if (!el || !isDetailMarker(el)) return null;
    const type = el.dataset.type;
    const pos = markerPosition(el);
    let label = el.dataset.label || defaultLabel(type);
    let available = el.dataset.available || "0";
    let notes = el.dataset.notes || "";
    const switches = {};

    if (el === openMarker) {
      if (panelName) label = panelName.value.trim() || defaultLabel(type);
      if (panelNotes) notes = panelNotes.value;
      if (panelAvailable) available = panelAvailable.checked ? "1" : "0";
      switchesForType(type).forEach(({ key, input }) => {
        const inp = input();
        switches[key] = inp && inp.checked ? "1" : "0";
      });
    }

    const record = {
      type,
      markerId: el.dataset.markerId || "",
      planName: getPlanName(),
      label,
      available,
      notes,
      posX: pos.posX,
      posY: pos.posY,
    };
    if (type === "modul") {
      record.osadeny = switches.osadeny ?? el.dataset.osadeny ?? "0";
    } else {
      record.natiahnuty = switches.natiahnuty ?? el.dataset.natiahnuty ?? "0";
      record.tenant = switches.tenant ?? el.dataset.tenant ?? "0";
      record.abutisant = switches.abutisant ?? el.dataset.abutisant ?? "0";
    }
    return record;
  }

  const sheetsSyncStatus = document.getElementById("sheets-sync-status");

  function setSheetsSyncStatus(msg, kind) {
    if (!sheetsSyncStatus) return;
    sheetsSyncStatus.textContent = msg || "";
    sheetsSyncStatus.classList.remove("is-ok", "is-error");
    if (kind === "ok") sheetsSyncStatus.classList.add("is-ok");
    if (kind === "error") sheetsSyncStatus.classList.add("is-error");
  }

  function syncMarkerToSheets(el, opts) {
    if (!window.TandemSheets?.isEnabled?.()) return;
    const record = collectMarkerRecord(el);
    if (!record || !record.markerId) return;
    setSheetsSyncStatus("Ukladám do tabuľky…", "");
    window.TandemSheets.saveMarker(record, opts).then((r) => {
      if (!r || r.skipped) return;
      if (r.ok) {
        const list = record.type === "modul" ? "Moduly" : "Kable";
        const msg = r.opaque
          ? "Odoslané do Google Sheets (list " + list + ") — overte v tabuľke."
          : "Uložené v Google Sheets (list " + list + "): " + record.label + ".";
        setSheetsSyncStatus(msg, "ok");
        return;
      }
      setSheetsSyncStatus(r.error || "Zápis do tabuľky zlyhal.", "error");
    });
  }

  function syncAllMarkersToSheets(opts) {
    if (!window.TandemSheets?.isEnabled?.()) return;
    const markers = Array.from(planMarkers.querySelectorAll(".plan-marker")).filter(isDetailMarker);
    if (!markers.length) return;
    setSheetsSyncStatus("Ukladam novy nazov planu do tabulky...", "");
    markers.forEach((marker) => syncMarkerToSheets(marker, opts));
  }

  function schedulePlanNameSync() {
    if (planNameSyncTimer) clearTimeout(planNameSyncTimer);
    planNameSyncTimer = setTimeout(() => {
      planNameSyncTimer = null;
      syncAllMarkersToSheets({ debounce: false });
    }, 700);
  }

  function savePanelState() {
    if (!openMarker) return;
    if (panelName) {
      const text = panelName.value.trim();
      setMarkerName(openMarker, text || defaultLabel(openMarker.dataset.type));
    }
    if (panelNotes) saveNotes(openMarker, panelNotes.value);
    if (panelAvailable) syncAvailability(openMarker, panelAvailable.checked);
    switchesForType(openMarker.dataset.type).forEach(({ key, input }) => {
      const inp = input();
      if (inp) setSwitch(openMarker, key, inp.checked);
    });
    clearUnusedMarkerData(openMarker);
    syncMarkerToSheets(openMarker, { debounce: false });
  }

  function savePanelAndClose() {
    savePanelState();
    closePanel();
  }

  function isPanelOpen() {
    return openMarker && panel && !panel.hidden;
  }

  function getPlanName() {
    return (planNameInput?.value || "").trim() || "Plán";
  }

  if (planNameInput) {
    planNameInput.addEventListener("input", schedulePlanNameSync);
    planNameInput.addEventListener("change", () => syncAllMarkersToSheets({ debounce: false }));
  }

  function setMarkerName(el, name) {
    const text = (name || "").trim() || defaultLabel(el.dataset.type);
    el.dataset.label = text;
    const labelEl = el.querySelector(".plan-marker__label");
    if (labelEl) labelEl.textContent = text;
    syncNotesIndicator(el);
  }

  function openPanel(el) {
    if (!isDetailMarker(el)) return;
    const type = el.dataset.type;
    if (openMarker && openMarker !== el) savePanelState();
    closePanel();
    openMarker = el;
    el.classList.add("panel-open");
    if (panel) {
      panel.hidden = false;
      panel.classList.remove("marker-panel--kabel", "marker-panel--modul");
      panel.classList.add("marker-panel--" + type);
    }
    if (panelType) panelType.textContent = defaultLabel(type);
    if (panelName) {
      panelName.placeholder =
        type === "kabel" ? "napr. Kábel WB1" : "napr. Modul WB7";
      panelName.value = el.dataset.label || defaultLabel(type);
      panelName.focus();
      panelName.select();
    }
    if (panelNotes) panelNotes.value = el.dataset.notes || "";
    showSwitchSection(type);
    updateAvailUI(isMarkerAvailable(el));
    loadExtraSwitches(el);
    showNameStatus("Klik na plán = uložiť a zavrieť panel.", false);
  }

  function showNameStatus(msg, isError) {
    if (!nameStatus) return;
    nameStatus.textContent = msg || "";
    nameStatus.classList.toggle("is-error", !!isError);
  }

  function saveMarkerNameFromPanel() {
    if (!openMarker || !panelName) return;
    const text = panelName.value.trim();
    if (!text) {
      showNameStatus("Zadajte názov.", true);
      panelName.focus();
      return;
    }
    setMarkerName(openMarker, text);
    showNameStatus("Uložené.", false);
  }

  function copyNameFromPlan() {
    if (!openMarker || !panelName) return;
    panelName.value = getPlanName();
    showNameStatus("Skopírované — stlačte Uložiť alebo Enter.", false);
    panelName.focus();
  }

  function saveNotes(el, text) {
    el.dataset.notes = text;
    syncNotesIndicator(el);
  }

  if (panelName) {
    panelName.addEventListener("keydown", (e) => {
      e.stopPropagation();
      if (e.key === "Enter") {
        e.preventDefault();
        savePanelAndClose();
      }
    });
    panelName.addEventListener("input", () => {
      showNameStatus("", false);
      if (openMarker) syncMarkerToSheets(openMarker);
    });
  }

  if (btnSaveName) btnSaveName.addEventListener("click", savePanelAndClose);

  if (panelNotes) {
    panelNotes.addEventListener("input", () => {
      if (!openMarker) return;
      saveNotes(openMarker, panelNotes.value);
      syncMarkerToSheets(openMarker);
    });
  }

  if (btnCopyFromPlan) btnCopyFromPlan.addEventListener("click", copyNameFromPlan);

  if (panelAvailable) {
    panelAvailable.addEventListener("change", () => {
      if (!openMarker) return;
      const on = panelAvailable.checked;
      syncAvailability(openMarker, on);
      updateAvailUI(on);
      syncMarkerToSheets(openMarker, { debounce: false });
    });
  }

  bindExtraSwitchHandlers();

  if (panelClose) panelClose.addEventListener("click", savePanelAndClose);

  planStage.addEventListener("click", (e) => {
    if (!isPanelOpen()) return;
    if (e.target.closest(".plan-marker")) return;
    savePanelAndClose();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape" || !panel || panel.hidden) return;
    if (e.target.closest("#marker-panel input, #marker-panel textarea")) return;
    closePanel();
  });

  function removeMarker(el) {
    if (window.TandemSheets?.isEnabled?.() && isDetailMarker(el)) {
      setSheetsSyncStatus("Mazem polozku z tabulky...", "");
      window.TandemSheets
        .deleteMarker({
          type: el.dataset.type,
          markerId: el.dataset.markerId || "",
        })
        .then((r) => {
          if (!r || r.skipped) return;
          if (r.ok) {
            setSheetsSyncStatus("Polozka odstranena z Google Sheets.", "ok");
            return;
          }
          setSheetsSyncStatus(r.error || "Vymazanie z tabulky zlyhalo.", "error");
        });
    }
    if (openMarker === el) closePanel();
    el.remove();
    updateEmpty();
  }

  function createMarker(label, type) {
    markerId += 1;
    const el = document.createElement("div");
    el.className = "plan-marker plan-marker--" + type;
    el.dataset.markerId = String(markerId);
    el.dataset.label = label;
    el.dataset.type = type;
    el.dataset.notes = "";
    el.dataset.available = "0";
    if (type === "modul") {
      el.dataset.osadeny = "0";
    } else {
      el.dataset.natiahnuty = "0";
      el.dataset.tenant = "0";
      el.dataset.abutisant = "0";
    }
    clearUnusedMarkerData(el);
    syncAvailability(el, false);

    const labelEl = document.createElement("span");
    labelEl.className = "plan-marker__label";
    labelEl.textContent = label;

    el.appendChild(labelEl);

    const openBtn = document.createElement("button");
    openBtn.type = "button";
    openBtn.className = "plan-marker__open plan-marker__open--" + type;
    openBtn.setAttribute("aria-label", "Otvoriť " + defaultLabel(type).toLowerCase());
    openBtn.textContent = "▸";
    openBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      openPanel(el);
    });
    openBtn.addEventListener("pointerdown", (e) => e.stopPropagation());
    el.appendChild(openBtn);

    labelEl.addEventListener("click", (e) => {
      e.stopPropagation();
      openPanel(el);
    });
    labelEl.addEventListener("pointerdown", (e) => e.stopPropagation());

    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.className = "plan-marker__remove";
    removeBtn.setAttribute("aria-label", "Odstrániť " + label);
    removeBtn.textContent = "×";
    removeBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      removeMarker(el);
    });
    removeBtn.addEventListener("pointerdown", (e) => e.stopPropagation());
    el.appendChild(removeBtn);

    planMarkers.appendChild(el);
    bindMarkerDrag(el);
    return el;
  }

  function placeMarker(label, type, xPct, yPct, existingId) {
    let el;
    if (existingId) {
      el = planMarkers.querySelector('[data-marker-id="' + existingId + '"]');
      if (!el) return;
    } else {
      el = createMarker(label, type);
    }
    el.style.left = xPct + "%";
    el.style.top = yPct + "%";
    updateEmpty();
    syncMarkerToSheets(el);
  }

  function startDrag(sourceEl, label, type, pointerId, x, y, fromMarker) {
    drag = {
      label,
      type,
      pointerId,
      ghost: createGhost(label, type, x, y),
      fromMarker: fromMarker || null,
      sourceEl,
      startX: x,
      startY: y,
      moved: false,
    };
    if (fromMarker) fromMarker.style.visibility = "hidden";
    planStage.classList.add("drag-over");
    document.body.style.userSelect = "none";
  }

  function moveDrag(x, y) {
    if (!drag) return;
    if (
      !drag.moved &&
      (Math.abs(x - drag.startX) > DRAG_THRESHOLD || Math.abs(y - drag.startY) > DRAG_THRESHOLD)
    ) {
      drag.moved = true;
    }
    drag.ghost.style.left = x - 20 + "px";
    drag.ghost.style.top = y - 14 + "px";
    planStage.classList.toggle("drag-over", isOverStage(x, y));
  }

  function endDrag(x, y) {
    if (!drag) return;
    const { label, ghost, fromMarker, moved, type } = drag;
    ghost.remove();
    planStage.classList.remove("drag-over");
    document.body.style.userSelect = "";

    if (isOverStage(x, y)) {
      const pos = dropPercent(x, y);
      const t = type || "kabel";
      if (fromMarker) {
        fromMarker.style.visibility = "";
        placeMarker(label, t, pos.x, pos.y, fromMarker.dataset.markerId);
        if (!moved && isDetailMarker(fromMarker)) openPanel(fromMarker);
      } else {
        placeMarker(label, t, pos.x, pos.y, null);
      }
    } else if (fromMarker) {
      fromMarker.style.visibility = "";
      if (!moved && isDetailMarker(fromMarker)) openPanel(fromMarker);
    }

    drag = null;
  }

  function bindToolboxItem(el) {
    el.addEventListener("pointerdown", (e) => {
      if (e.button !== 0 && e.pointerType === "mouse") return;
      e.preventDefault();
      const label = el.dataset.label || el.textContent;
      const type = el.dataset.type || "kabel";
      const p = clientPoint(e);
      startDrag(el, label, type, e.pointerId, p.x, p.y, null);
      el.setPointerCapture(e.pointerId);
    });
  }

  function bindMarkerDrag(el) {
    el.addEventListener("pointerdown", (e) => {
      if (e.target.closest(".plan-marker__remove, .plan-marker__open")) return;
      if (e.target.closest(".plan-marker__label") && isDetailMarker(el)) return;
      if (e.button !== 0 && e.pointerType === "mouse") return;
      e.preventDefault();
      e.stopPropagation();
      const label = el.dataset.label || el.querySelector(".plan-marker__label")?.textContent;
      const type = el.dataset.type || "kabel";
      const p = clientPoint(e);
      startDrag(el, label, type, e.pointerId, p.x, p.y, el);
      el.setPointerCapture(e.pointerId);
    });
  }

  document.addEventListener(
    "pointermove",
    (e) => {
      if (!drag || e.pointerId !== drag.pointerId) return;
      const p = clientPoint(e);
      moveDrag(p.x, p.y);
    },
    { passive: true }
  );

  document.addEventListener("pointerup", (e) => {
    if (!drag || e.pointerId !== drag.pointerId) return;
    const p = clientPoint(e);
    endDrag(p.x, p.y);
    try {
      drag.sourceEl.releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
  });

  document.addEventListener("pointercancel", (e) => {
    if (!drag || e.pointerId !== drag.pointerId) return;
    if (drag.fromMarker) drag.fromMarker.style.visibility = "";
    drag.ghost?.remove();
    planStage.classList.remove("drag-over");
    document.body.style.userSelect = "";
    drag = null;
  });

  function runTestModulKokot() {
    const el = createMarker("kokot", "modul");
    el.style.left = "50%";
    el.style.top = "50%";
    updateEmpty();
    syncMarkerToSheets(el, { debounce: false });
    openPanel(el);
    setSheetsSyncStatus("Test: odosielam Modul „kokot“ do listu Moduly…", "");
  }

  const btnTestSheetsModul = document.getElementById("btn-test-sheets-modul");
  if (btnTestSheetsModul) {
    btnTestSheetsModul.addEventListener("click", runTestModulKokot);
  }

  const btnClearSheets = document.getElementById("btn-clear-sheets");
  if (btnClearSheets) {
    btnClearSheets.addEventListener("click", () => {
      if (!window.TandemSheets?.isEnabled?.()) return;
      const ok = window.confirm(
        "Vymazať všetky riadky v listoch Kable a Moduly?\n(Hlavičky ostávajú. Plán v aplikácii sa nemení.)"
      );
      if (!ok) return;
      setSheetsSyncStatus("Čistím tabuľku…", "");
      window.TandemSheets.clearSheets().then((r) => {
        if (!r || r.skipped) return;
        if (r.ok) {
          setSheetsSyncStatus("Tabuľka vyčistená (Kable + Moduly).", "ok");
          return;
        }
        setSheetsSyncStatus(r.error || "Čistenie zlyhalo.", "error");
      });
    });
  }

  toolbox.querySelectorAll(".tool-item").forEach(bindToolboxItem);
  updateEmpty();
})();
