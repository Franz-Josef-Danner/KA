// -----------------------------
// CSV Import/Export Functionality
// -----------------------------
import { COLUMNS } from '../modules/config.js';
import { sanitizeText } from './sanitize.js';
import { newEmptyRow } from '../modules/state.js';

export function toCSV(dataRows) {
  const header = COLUMNS.join(",");
  const lines = dataRows.map(r => COLUMNS.map(c => csvEscape(r[c])).join(","));
  return [header, ...lines].join("\n");
}

function csvEscape(value) {
  const v = String(value ?? "");
  // Excel/CSV: wrap if needed
  // Quote fields that contain: commas, quotes, newlines, or have leading/trailing spaces
  if (/[",\n\r]/.test(v) || v !== v.trim()) return `"${v.replaceAll('"','""')}"`;
  return v;
}

// Split CSV text into records (lines) - preserves quotes and escaping
// Only uses quote state to determine line boundaries
function splitCsvRecords(csvText) {
  const records = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];
    
    if (char === '"') {
      current += char; // Keep the quote in the record
      // Track escaped quotes for quote state tracking
      if (inQuotes && nextChar === '"') {
        current += nextChar; // Keep both quotes
        i++; // skip the second quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      // End of record (only when not inside quotes)
      if (current.trim()) {
        records.push(current);
      }
      current = '';
      // Treat \r\n as a single newline
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
    } else {
      current += char;
    }
  }
  
  if (current.trim()) {
    records.push(current);
  }
  
  // Check for unclosed quotes
  if (inQuotes) {
    throw new Error("CSV parsing error: File has unclosed quotes. This can cause data corruption. Please check your CSV file format.");
  }
  
  return records;
}

// Parse a CSV line into fields - removes delimiter quotes and handles escaping
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  let wasQuoted = false; // Track if the current field was quoted
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];
    
    if (char === '"') {
      if (current === '' && !inQuotes) {
        // First quote at start of field (no content yet) - this is a quoted field
        inQuotes = true;
        wasQuoted = true;
      } else if (inQuotes && nextChar === '"') {
        // Escaped quote: add single quote to output
        current += '"';
        i++; // skip next quote
      } else if (inQuotes) {
        // Closing quote
        inQuotes = false;
      } else {
        // Quote in middle of unquoted field - treat as literal
        current += char;
      }
    } else if (char === ',' && !inQuotes) {
      // End of field: preserve spaces in quoted fields, trim unquoted fields
      result.push({ value: current, wasQuoted });
      current = '';
      wasQuoted = false;
    } else {
      current += char;
    }
  }
  // Push the last field
  result.push({ value: current, wasQuoted });
  
  // Check for unclosed quotes
  if (inQuotes) {
    throw new Error("CSV parsing error: Line has unclosed quotes. This can cause data corruption. Please check your CSV file format.");
  }
  
  // Preserve whitespace for quoted fields, trim whitespace for unquoted fields
  return result.map(field => (field.wasQuoted ? field.value : field.value.trim()));
}

export function parseCSV(text) {
  const lines = splitCsvRecords(text);
  
  if (lines.length === 0) {
    throw new Error("Die CSV-Datei enthält keine Daten.");
  }
  
  // First line is headers
  const headers = parseCSVLine(lines[0]);
  const dataLines = lines.slice(1);
  
  if (dataLines.length === 0) {
    throw new Error("Die CSV-Datei enthält keine Datenzeilen.");
  }
  
  // Import rows
  const importedRows = [];
  for (const line of dataLines) {
    const values = parseCSVLine(line);
    const newRow = newEmptyRow();
    
    // Track which columns have been mapped and which CSV indices have been used
    const mappedColumns = new Set();
    const usedIndices = new Set();
    
    // COLUMN MAPPING ALGORITHM (Two-pass approach):
    // We use a two-pass approach to maximize correct column mapping:
    // 
    // Pass 1: Name-based mapping
    //   - Matches CSV headers to table columns by name (case-insensitive)
    //   - This ensures columns with matching names are correctly mapped
    //   - The Set tracking prevents duplicate mappings if CSV has duplicate headers
    // 
    // Pass 2: Position-based mapping for remaining columns
    //   - Maps any remaining unmapped CSV columns to unmapped table columns by position
    //   - This handles cases where CSV columns don't match our column names
    //   - Only processes columns/indices not used in Pass 1
    // 
    // Result: Named columns get priority, then remaining data fills in by position
    
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
  
  return importedRows;
}
