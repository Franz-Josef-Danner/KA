// -----------------------------
// State Management
// -----------------------------
import { STORAGE_KEY, COLUMNS, STATUS_OPTIONS } from './config.js';
import { sanitizeText } from '../utils/sanitize.js';

let rows = load() ?? [];

export function getRows() {
  return rows;
}

export function setRows(newRows) {
  rows = newRows;
}

export function newEmptyRow() {
  const obj = {};
  for (const c of COLUMNS) {
    // Set default value for Status column
    obj[c] = (c === "Status") ? "offen" : "";
  }
  return obj;
}

export function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
}

export function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!Array.isArray(data)) return null;

    // Normalize: ensure all columns exist
    return data.map(r => {
      const row = newEmptyRow();
      for (const c of COLUMNS) {
        row[c] = sanitizeText(r?.[c] ?? "");
        // Normalize Status: trim whitespace and validate
        if (c === "Status") {
          row[c] = row[c].trim();
          // If empty or not in STATUS_OPTIONS, default to "offen"
          if (!row[c] || !STATUS_OPTIONS.includes(row[c])) {
            row[c] = "offen";
          }
        }
      }
      return row;
    });
  } catch {
    return null;
  }
}
