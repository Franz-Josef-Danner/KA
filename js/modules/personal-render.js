// -----------------------------
// Personal (Personnel) Render Module
// -----------------------------
import { TABLE_COLUMNS, DEPARTMENTS } from './personal-config.js';
import { getRows } from './personal-state.js';
import { escapeHtml } from '../utils/sanitize.js';

const COLUMN_LABELS = {
  Vorname:    "Vorname",
  Nachname:   "Nachname",
  Department: "Department",
  Rolle:      "Rolle",
  Telefon:    "Telefon",
  Email:      "E-Mail",
  Tagessatz:  "Tagessatz (€/Tag)"
};

// Department colour map — key matches DEPARTMENTS values exactly
const DEPT_COLORS = {
  "Produktion":           "#6366f1",
  "Regie":                "#8b5cf6",
  "Kamera":               "#0ea5e9",
  "Licht":                "#f59e0b",
  "Ton":                  "#10b981",
  "Postproduktion":       "#f43f5e",
  "Maske / Kostüm":       "#ec4899",
  "Location Management":  "#14b8a6",
  "Transport / Logistik": "#f97316",
  "Casting":              "#84cc16",
  "Stunts":               "#ef4444",
  "Catering":             "#a78bfa",
  "Requisite":            "#06b6d4",
  "Bühnenbild":           "#d97706",
};

function getDeptColor(dept) {
  return DEPT_COLORS[dept] ?? "#6b7280";
}

/**
 * Render the personnel table, optionally filtered by department and search term.
 * @param {string} deptFilter - Department name to filter by, or "" for all
 * @param {string} searchTerm - Text search filter
 */
export function render(deptFilter = "", searchTerm = "") {
  const tbody = document.getElementById("personalTbody");
  const emptyState = document.getElementById("personalEmpty");
  if (!tbody) return;

  let rows = getRows();

  // Apply department filter
  if (deptFilter) {
    rows = rows.filter(r => r.Department === deptFilter);
  }

  // Apply text search
  if (searchTerm.trim()) {
    const term = searchTerm.toLowerCase();
    rows = rows.filter(r =>
      TABLE_COLUMNS.some(c => String(r[c] ?? "").toLowerCase().includes(term))
    );
  }

  tbody.innerHTML = "";

  if (rows.length === 0) {
    if (emptyState) emptyState.style.display = "block";
    return;
  }
  if (emptyState) emptyState.style.display = "none";

  // Store filtered → original index mapping for edit/delete actions
  const allRows = getRows();

  rows.forEach(row => {
    const origIdx = allRows.indexOf(row);
    const tr = document.createElement("tr");
    tr.dataset.idx = String(origIdx);
    tr.style.cursor = "pointer";
    tr.title = "Doppelklick zum Bearbeiten";

    TABLE_COLUMNS.forEach(col => {
      const td = document.createElement("td");
      const val = row[col] ?? "";

      if (col === "Department") {
        const color = getDeptColor(val);
        td.innerHTML = `<span class="dept-badge" style="background:${escapeHtml(color)};">${escapeHtml(val)}</span>`;
      } else if (col === "Email" && val) {
        td.innerHTML = `<a href="mailto:${escapeHtml(val)}">${escapeHtml(val)}</a>`;
      } else if (col === "Telefon" && val) {
        td.innerHTML = `<a href="tel:${escapeHtml(val)}">${escapeHtml(val)}</a>`;
      } else if (col === "Tagessatz" && val) {
        td.textContent = `${val} €`;
      } else {
        td.textContent = val;
      }
      tr.appendChild(td);
    });

    // Action cell
    const actionTd = document.createElement("td");
    actionTd.className = "actions";
    const delBtn = document.createElement("button");
    delBtn.textContent = "Löschen";
    delBtn.className = "btn-danger";
    delBtn.dataset.action = "delete";
    delBtn.dataset.idx = String(origIdx);
    delBtn.title = "Eintrag löschen";
    actionTd.appendChild(delBtn);
    tr.appendChild(actionTd);

    tbody.appendChild(tr);
  });

  // Update entry count badge
  const countEl = document.getElementById("personalCount");
  if (countEl) {
    countEl.textContent = `${rows.length} Einträge`;
  }
}

/** Build the department filter pill buttons */
export function renderDeptFilter(activeDept = "") {
  const container = document.getElementById("deptFilterBar");
  if (!container) return;

  container.innerHTML = "";

  // "Alle" button
  const allBtn = document.createElement("button");
  allBtn.textContent = "Alle Departments";
  allBtn.className = "dept-filter-btn" + (activeDept === "" ? " active" : "");
  allBtn.dataset.dept = "";
  container.appendChild(allBtn);

  DEPARTMENTS.forEach(dept => {
    const btn = document.createElement("button");
    btn.textContent = dept;
    btn.className = "dept-filter-btn" + (activeDept === dept ? " active" : "");
    btn.dataset.dept = dept;
    btn.style.setProperty("--dept-color", getDeptColor(dept));
    container.appendChild(btn);
  });
}
