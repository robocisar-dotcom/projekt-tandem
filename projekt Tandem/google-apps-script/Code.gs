/**
 * Tandem → Google Sheets (upsert podľa ID značky)
 * Listy: Kable, Moduly
 */

var SPREADSHEET_ID = "1K5OpFtFQijyR0A9sfa3dIDhmxkhUVdsGcwCkuYh3nBk";

var SHEET_KABEL = "Kable";
var SHEET_MODUL = "Moduly";

var HEADERS_KABEL = [
  "ID",
  "Názov plánu",
  "Názov",
  "Dostupnosť",
  "Natiahnutý",
  "Tenant",
  "Abutisant",
  "Poznámky",
  "Pozícia X %",
  "Pozícia Y %",
  "Aktualizované",
];

var HEADERS_MODUL = [
  "ID",
  "Názov plánu",
  "Názov",
  "Dostupnosť",
  "Osadený",
  "Poznámky",
  "Pozícia X %",
  "Pozícia Y %",
  "Aktualizované",
];

function doPost(e) {
  return handleRequest_(parseBody_(e));
}

function doGet(e) {
  var p = (e && e.parameter) || {};
  return handleRequest_(p);
}

function parseBody_(e) {
  if (!e || !e.postData || !e.postData.contents) return {};
  try {
    return JSON.parse(e.postData.contents);
  } catch (err) {
    return {};
  }
}

function handleRequest_(data) {
  try {
    var type = String(data.type || "").toLowerCase();
    var isModul = type === "modul";
    var sheetName = isModul ? SHEET_MODUL : SHEET_KABEL;
    var headers = isModul ? HEADERS_MODUL : HEADERS_KABEL;

    var ss = getSpreadsheet_(data);
    var sheet = getOrCreateSheet_(ss, sheetName, headers);
    var row = buildRow_(data, isModul);
    var markerId = String(data.markerId || "").trim();

    if (!markerId) {
      return jsonResponse_({ ok: false, error: "Chýba markerId" });
    }

    var rowIndex = findRowByMarkerId_(sheet, markerId);
    if (rowIndex > 0) {
      sheet.getRange(rowIndex, 1, 1, row.length).setValues([row]);
    } else {
      sheet.appendRow(row);
    }

    return jsonResponse_({
      ok: true,
      sheet: sheetName,
      markerId: markerId,
      updated: rowIndex > 0,
    });
  } catch (err) {
    return jsonResponse_({ ok: false, error: String(err) });
  }
}

function buildRow_(data, isModul) {
  var now = new Date();
  var common = [
    String(data.markerId || ""),
    String(data.planName || ""),
    String(data.label || data.name || ""),
    yesNo_(data.available),
    String(data.notes || ""),
    numOrEmpty_(data.posX),
    numOrEmpty_(data.posY),
    now,
  ];

  if (isModul) {
    return [
      common[0],
      common[1],
      common[2],
      common[3],
      yesNo_(data.osadeny),
      common[4],
      common[5],
      common[6],
      common[7],
    ];
  }

  return [
    common[0],
    common[1],
    common[2],
    common[3],
    yesNo_(data.natiahnuty),
    yesNo_(data.tenant),
    yesNo_(data.abutisant),
    common[4],
    common[5],
    common[6],
    common[7],
  ];
}

function yesNo_(val) {
  if (val === true || val === 1 || val === "1" || String(val).toLowerCase() === "áno") {
    return "Áno";
  }
  return "Nie";
}

function numOrEmpty_(val) {
  if (val === "" || val === null || val === undefined) return "";
  var n = parseFloat(val);
  return isNaN(n) ? "" : n;
}

function findRowByMarkerId_(sheet, markerId) {
  var last = sheet.getLastRow();
  if (last < 2) return -1;
  var ids = sheet.getRange(2, 1, last - 1, 1).getValues();
  for (var i = 0; i < ids.length; i++) {
    if (String(ids[i][0]) === markerId) {
      return i + 2;
    }
  }
  return -1;
}

function getSpreadsheet_(data) {
  var id = String((data && data.spreadsheetId) || SPREADSHEET_ID || "").trim();
  if (id) {
    return SpreadsheetApp.openById(id);
  }
  return SpreadsheetApp.getActiveSpreadsheet();
}

function getOrCreateSheet_(ss, name, headers) {
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
  }
  ensureHeaders_(sheet, headers);
  return sheet;
}

function ensureHeaders_(sheet, headers) {
  var width = headers.length;
  var current = sheet.getRange(1, 1, 1, width).getValues()[0];
  var ok = true;
  for (var i = 0; i < headers.length; i++) {
    if (String(current[i] || "") !== headers[i]) {
      ok = false;
      break;
    }
  }
  if (!ok && sheet.getLastRow() <= 1) {
    sheet.getRange(1, 1, 1, width).setValues([headers]);
    sheet.getRange(1, 1, 1, width).setFontWeight("bold");
  }
}

function jsonResponse_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON
  );
}
