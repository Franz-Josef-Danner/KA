// -----------------------------
// Duplicate Detection
// -----------------------------
import { COLUMNS } from './config.js';

export function findDuplicates(dataRows) {
  // Map: column -> value -> [row indices that have this value]
  const duplicateMap = new Map();
  
  // Columns to exclude from duplicate detection
  const excludedColumns = ["Gender", "Titel", "Status"];
  
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
  
  // Special handling: combine Vorname and Nachname for duplicate detection
  const fullNameMap = new Map();
  dataRows.forEach((row, idx) => {
    const vorname = String(row["Vorname"] ?? "").trim();
    const nachname = String(row["Nachname"] ?? "").trim();
    // Only consider when both parts are non-empty
    if (vorname && nachname) {
      const fullName = `${vorname} ${nachname}`;
      if (!fullNameMap.has(fullName)) {
        fullNameMap.set(fullName, []);
      }
      fullNameMap.get(fullName).push(idx);
    }
  });
  
  // Store combined name duplicates under both Vorname and Nachname
  fullNameMap.forEach((indices, fullName) => {
    if (indices.length > 1) {
      // Mark both Vorname and Nachname columns as having duplicates
      if (!duplicateMap.has("Vorname")) {
        duplicateMap.set("Vorname", new Map());
      }
      if (!duplicateMap.has("Nachname")) {
        duplicateMap.set("Nachname", new Map());
      }
      
      // Use Sets to track indices efficiently (avoid O(n²) with .includes())
      const vornameIndicesMap = new Map();
      const nachnameIndicesMap = new Map();
      
      // For each row with this full name, collect the individual parts
      indices.forEach(idx => {
        const row = dataRows[idx];
        const vorname = String(row["Vorname"] ?? "").trim();
        const nachname = String(row["Nachname"] ?? "").trim();
        
        // Collect vorname indices
        if (!vornameIndicesMap.has(vorname)) {
          vornameIndicesMap.set(vorname, new Set());
        }
        vornameIndicesMap.get(vorname).add(idx);
        
        // Collect nachname indices
        if (!nachnameIndicesMap.has(nachname)) {
          nachnameIndicesMap.set(nachname, new Set());
        }
        nachnameIndicesMap.get(nachname).add(idx);
      });
      
      // Store vorname duplicates
      vornameIndicesMap.forEach((idxSet, vorname) => {
        if (!duplicateMap.get("Vorname").has(vorname)) {
          duplicateMap.get("Vorname").set(vorname, []);
        }
        const existingIndices = duplicateMap.get("Vorname").get(vorname);
        idxSet.forEach(idx => {
          if (!existingIndices.includes(idx)) {
            existingIndices.push(idx);
          }
        });
      });
      
      // Store nachname duplicates
      nachnameIndicesMap.forEach((idxSet, nachname) => {
        if (!duplicateMap.get("Nachname").has(nachname)) {
          duplicateMap.get("Nachname").set(nachname, []);
        }
        const existingIndices = duplicateMap.get("Nachname").get(nachname);
        idxSet.forEach(idx => {
          if (!existingIndices.includes(idx)) {
            existingIndices.push(idx);
          }
        });
      });
    }
  });
  
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
