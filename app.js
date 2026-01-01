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
const modal = document.getElementById("addModal");

document.getElementById("addRowBtn").addEventListener("click", () => {
  modal.classList.add("show");
});

document.getElementById("closeModalBtn").addEventListener("click", () => {
  modal.classList.remove("show");
});

// Close modal when clicking outside of it
modal.addEventListener("click", (e) => {
  if (e.target === modal) {
    modal.classList.remove("show");
  }
});

// Close modal when pressing the Escape key
document.addEventListener("keydown", (e) => {
  if ((e.key === "Escape" || e.key === "Esc") && modal.classList.contains("show")) {
    modal.classList.remove("show");
  }
});

document.getElementById("addMultipleBtn").addEventListener("click", () => {
  const count = parseInt(document.getElementById("rowCount").value, 10);
  
  // Validate row count
  if (isNaN(count) || count < 1 || count > 10) {
    alert("Ungültige Anzahl von Zeilen. Bitte wählen Sie eine Zahl zwischen 1 und 10.");
    return;
  }
  
  for (let i = 0; i < count; i++) {
    rows.unshift(newEmptyRow());
  }
  save();
  render();
  modal.classList.remove("show");
  
  // Fokus auf erste Zelle der neuen Zeile
  setTimeout(() => {
    const firstCell = tbody.querySelector('td[contenteditable="true"]');
    firstCell?.focus();
  }, 0);
});

document.getElementById("importExcelBtn").addEventListener("click", () => {
  const fileInput = document.getElementById("importFile");
  const file = fileInput.files[0];
  
  if (!file) {
    alert("Bitte wählen Sie eine Datei aus.");
    return;
  }
  
  const fileName = file.name.toLowerCase();
  
  // Support CSV files
  if (!fileName.endsWith('.csv')) {
    alert("Bitte verwenden Sie eine CSV-Datei (.csv).");
    return;
  }
  
  importCSV(file, fileInput);
});

function importCSV(file, fileInput) {
  const reader = new FileReader();
  
  reader.onload = (e) => {
    try {
      const text = e.target.result;
      const lines = text.split(/\r?\n/).filter(line => line.trim());
      
      if (lines.length === 0) {
        alert("Die CSV-Datei enthält keine Daten.");
        return;
      }
      
      // Parse CSV (simple parser, handles quotes)
      const parseCSVLine = (line) => {
        const result = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          const nextChar = line[i + 1];
          
          if (char === '"') {
            if (inQuotes && nextChar === '"') {
              current += '"';
              i++; // skip next quote
            } else {
              inQuotes = !inQuotes;
            }
          } else if (char === ',' && !inQuotes) {
            result.push(current);
            current = '';
          } else {
            current += char;
          }
        }
        result.push(current);
        
        // If still in quotes at end of line, it's malformed - close the quotes
        if (inQuotes) {
          console.warn("Malformed CSV: Unclosed quotes in line:", line);
        }
        
        return result.map(s => s.trim());
      };
      
      // First line is headers
      const headers = parseCSVLine(lines[0]);
      const dataLines = lines.slice(1);
      
      if (dataLines.length === 0) {
        alert("Die CSV-Datei enthält keine Datenzeilen.");
        return;
      }
      
      // Import rows
      const importedRows = [];
      for (const line of dataLines) {
        const values = parseCSVLine(line);
        const newRow = newEmptyRow();
        
        // Track which columns have been mapped and which CSV indices have been used
        const mappedColumns = new Set();
        const usedIndices = new Set();
        
        // First pass: Try to match by column name (case-insensitive)
        headers.forEach((header, idx) => {
          const headerStr = String(header).trim();
          const matchingCol = COLUMNS.find(col => 
            col.toLowerCase() === headerStr.toLowerCase() && !mappedColumns.has(col)
          );
          
          if (matchingCol) {
            mappedColumns.add(matchingCol);
            usedIndices.add(idx);
            newRow[matchingCol] = sanitizeText(values[idx] ?? "");
          }
        });
        
        // Second pass: Map remaining CSV columns by position to unmapped table columns
        if (mappedColumns.size < COLUMNS.length && usedIndices.size < values.length) {
          let tableColIdx = 0;
          let csvIdx = 0;
          
          while (tableColIdx < COLUMNS.length && csvIdx < values.length) {
            // Skip already mapped columns and indices
            while (tableColIdx < COLUMNS.length && mappedColumns.has(COLUMNS[tableColIdx])) {
              tableColIdx++;
            }
            while (csvIdx < values.length && usedIndices.has(csvIdx)) {
              csvIdx++;
            }
            
            // Map the remaining columns by position
            if (tableColIdx < COLUMNS.length && csvIdx < values.length) {
              newRow[COLUMNS[tableColIdx]] = sanitizeText(values[csvIdx] ?? "");
              tableColIdx++;
              csvIdx++;
            }
          }
        }
        
        importedRows.push(newRow);
      }
      
      // Add imported rows to the beginning of the table
      rows = [...importedRows, ...rows];
      save();
      render();
      modal.classList.remove("show");
      
      alert(`${importedRows.length} Zeilen erfolgreich importiert.`);
      
      // Reset file input
      fileInput.value = "";
    } catch (error) {
      console.error("Error importing CSV:", error);
      alert("Fehler beim Importieren der CSV-Datei. Bitte überprüfen Sie das Dateiformat.");
    }
  };
  
  reader.readAsText(file, 'UTF-8');
}

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
