// -----------------------------
// Konfiguration
// -----------------------------
const STORAGE_KEY = "firmen_tabelle_v1";

const COLUMNS = [
  "Firmen_ID","Firma","Gender","Titel","Vorname","Nachname","E-mail","Tell","Webseite",
  "Status quo","CAM","CUT","Cgi","Status","Preisliste_Daten_ID","Adresse"
];

// -----------------------------
// State
// -----------------------------
let rows = load() ?? [];

// -----------------------------
// Helpers
// -----------------------------
function sanitizeText(s) {
  return String(s ?? "").replace(/\u0000/g, "");
}

function toCellDisplay(col, value) {
  const v = sanitizeText(value).trim();
  if (!v) return "";

  if (col === "E-mail") {
    // Anzeige als Link (Speicher bleibt Text)
    const email = v;
    return `<a href="mailto:${escapeAttr(email)}">${escapeHtml(email)}</a>`;
  }
  if (col === "Webseite") {
    let url = v;
    // wenn ohne Schema, für Linkanzeige ergänzen
    if (!/^https?:\/\//i.test(url)) url = "https://" + url;
    return `<a href="${escapeAttr(url)}" target="_blank" rel="noreferrer noopener">${escapeHtml(v)}</a>`;
  }
  return escapeHtml(v);
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

function escapeAttr(str) {
  return escapeHtml(str).replaceAll("`","&#096;");
}

function newEmptyRow() {
  const obj = {};
  for (const c of COLUMNS) obj[c] = "";
  return obj;
}

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!Array.isArray(data)) return null;

    // Normalize: ensure all columns exist
    return data.map(r => {
      const row = newEmptyRow();
      for (const c of COLUMNS) row[c] = sanitizeText(r?.[c] ?? "");
      return row;
    });
  } catch {
    return null;
  }
}

function downloadText(filename, text) {
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function toCSV(dataRows) {
  const header = COLUMNS.join(",");
  const lines = dataRows.map(r => COLUMNS.map(c => csvEscape(r[c])).join(","));
  return [header, ...lines].join("\n");
}

function csvEscape(value) {
  const v = String(value ?? "");
  // Excel/CSV: wrap if needed
  if (/[",\n\r]/.test(v)) return `"${v.replaceAll('"','""')}"`;
  return v;
}

function rowMatchesSearch(row, q) {
  if (!q) return true;
  const hay = COLUMNS.map(c => String(row[c] ?? "")).join(" ").toLowerCase();
  return hay.includes(q);
}

// -----------------------------
// Render
// -----------------------------
const tbody = document.getElementById("tbody");
const searchInput = document.getElementById("search");

function render() {
  const q = (searchInput.value || "").trim().toLowerCase();
  tbody.innerHTML = "";

  rows.forEach((row, idx) => {
    if (!rowMatchesSearch(row, q)) return;

    const tr = document.createElement("tr");

    for (const col of COLUMNS) {
      const td = document.createElement("td");
      td.setAttribute("contenteditable", "true");
      td.dataset.row = String(idx);
      td.dataset.col = col;

      // Für Linkspalten (Email/Webseite) HTML anzeigen, aber Text editieren:
      td.innerHTML = toCellDisplay(col, row[col]);

      // Beim Fokus: reiner Text zum Editieren
      td.addEventListener("focus", () => {
        td.textContent = row[col] ?? "";
      });

      // Beim Blur: speichern + hübsch darstellen
      td.addEventListener("blur", () => {
        const newVal = td.textContent ?? "";
        rows[idx][col] = sanitizeText(newVal);
        td.innerHTML = toCellDisplay(col, rows[idx][col]);
      });

      tr.appendChild(td);
    }

    const act = document.createElement("td");
    act.className = "actions";
    
    // Plus button - add row below
    const plus = document.createElement("button");
    plus.textContent = "+";
    plus.title = "Zeile darunter einfügen";
    plus.addEventListener("click", () => {
      rows.splice(idx + 1, 0, newEmptyRow());
      save();
      render();
    });
    act.appendChild(plus);
    
    // Minus button - delete row with confirmation
    const minus = document.createElement("button");
    minus.textContent = "−";
    minus.title = "Zeile löschen";
    minus.className = "danger";
    minus.addEventListener("click", () => {
      const ok = confirm("Sind Sie sicher, dass Sie diese Zeile löschen möchten?");
      if (!ok) return;
      rows.splice(idx, 1);
      save();
      render();
    });
    act.appendChild(minus);
    
    tr.appendChild(act);

    tbody.appendChild(tr);
  });
}

// -----------------------------
// Events
// -----------------------------
document.getElementById("addRowBtn").addEventListener("click", () => {
  rows.unshift(newEmptyRow());
  save();
  render();
  // Fokus auf erste Zelle der neuen Zeile
  setTimeout(() => {
    const firstCell = tbody.querySelector('td[contenteditable="true"]');
    firstCell?.focus();
  }, 0);
});

document.getElementById("saveBtn").addEventListener("click", () => {
  save();
  alert("Gespeichert (LocalStorage im Browser).");
});

document.getElementById("exportBtn").addEventListener("click", () => {
  const csv = toCSV(rows);
  const ts = new Date().toISOString().slice(0,19).replaceAll(":","-");
  downloadText(`firmen_export_${ts}.csv`, csv);
});

document.getElementById("clearBtn").addEventListener("click", () => {
  const ok = confirm("Wirklich alles löschen? (Nicht rückgängig)");
  if (!ok) return;
  rows = [];
  save();
  render();
});

searchInput.addEventListener("input", () => render());

// -----------------------------
// Init
// -----------------------------
render();
