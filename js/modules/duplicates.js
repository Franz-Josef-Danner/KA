// -----------------------------
// Duplicate Detection
// -----------------------------
import { COLUMNS } from './config.js';

export function findDuplicates(dataRows) {
  // Map: column -> value -> [row indices that have this value]
  const duplicateMap = new Map();
  
  // Columns to exclude from duplicate detection
  const excludedColumns = ["Titel", "Status", "Kommentare", "Vorname", "Nachname"];
  
  for (const col of COLUMNS) {
    // Skip excluded columns
    if (excludedColumns.includes(col)) {
      continue;
    }
    
    const valueMap = new Map();
    
    dataRows.forEach((row, idx) => {
      const value = String(row[col] ?? "").trim();
      // Only consider non-empty values
      if (value) {
        if (!valueMap.has(value)) {
          valueMap.set(value, []);
        }
        valueMap.get(value).push(idx);
      }
    });
    
    // Store only values that appear more than once
    valueMap.forEach((indices, value) => {
      if (indices.length > 1) {
        if (!duplicateMap.has(col)) {
          duplicateMap.set(col, new Map());
        }
        duplicateMap.get(col).set(value, indices);
      }
    });
  }
  
  return duplicateMap;
}

export function getRowsWithDuplicates(duplicateMap) {
  const rowsWithDuplicates = new Set();
  
  duplicateMap.forEach((valueMap) => {
    valueMap.forEach((indices) => {
      indices.forEach(idx => rowsWithDuplicates.add(idx));
    });
  });
  
  return rowsWithDuplicates;
}
