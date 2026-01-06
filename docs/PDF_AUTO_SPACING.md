# PDF Auto-Spacing Implementation

## Overview
This document describes the implementation of automatic row height and column width adjustment in PDF generation for orders and invoices.

## Problem Statement
Previously, the PDF table used fixed dimensions:
- **Fixed column widths**: Percentages of total table width (e.g., 35% for description)
- **Fixed row height**: 7mm per row regardless of content length

This caused issues when:
- Content was too long and got cut off
- Content was very short and had excessive whitespace
- Description text couldn't wrap properly

## Solution
The new implementation calculates dimensions dynamically based on actual content:

### 1. Dynamic Column Widths
```javascript
// Calculate based on maximum content width in each column
const colWidths = {
  pos: Math.max(minColWidths.pos, doc.getTextWidth('Pos.') + padding),
  // ... measure each column
};

// Description column gets remaining space
colWidths.beschreibung = Math.max(minColWidths.beschreibung, width - otherColumnsWidth);
```

**Benefits:**
- Columns automatically size to fit content
- No wasted space for small values
- Description column uses remaining space efficiently

### 2. Dynamic Row Heights
```javascript
// Calculate height based on text wrapping
const beschreibungText = item.beschreibung || item.artikel || '';
const beschreibungLines = doc.splitTextToSize(beschreibungText, colWidths.beschreibung - padding);
// Row height = (number of lines × line height) + top padding + bottom padding
const contentHeight = beschreibungLines.length * lineHeight;
const rowHeight = contentHeight + rowPaddingTop + rowPaddingBottom;
```

**Benefits:**
- Rows expand to accommodate wrapped text
- Multi-line descriptions display properly
- Consistent padding across all rows

### 3. Text Wrapping Support
```javascript
if (beschreibungLines.length > 1) {
  // Multi-line text - render each line with proper spacing
  beschreibungLines.forEach((line, lineIndex) => {
    const lineY = rowY + rowPaddingTop + (lineIndex + 1) * lineHeight - textBaselineOffset;
    doc.text(line, colX + 2, lineY);
  });
} else {
  // Single line - centered vertically
  doc.text(beschreibungText, colX + 2, textY);
}
```

**Benefits:**
- Long descriptions wrap properly within column
- Single-line content is vertically centered
- Professional appearance maintained

## Technical Details

### Key Functions
- `doc.getTextWidth(text)`: Measures actual text width in current font
- `doc.splitTextToSize(text, maxWidth)`: Splits text into wrapped lines
- Dynamic calculation ensures optimal spacing

### Constants
```javascript
const padding = 4;                  // Padding on each side (mm)
const lineHeight = 4;               // Height per text line (mm)
const rowPaddingTop = 2;            // Top padding per row (mm)
const rowPaddingBottom = 2;         // Bottom padding per row (mm)
const minRowHeight = 10;            // Minimum height for empty rows - 1cm (mm)
const emptyColumnWidth = 10;        // Width for empty columns - 1cm (mm)
const headerHeight = 8;             // Fixed header height (mm)
const textBaselineOffset = 1;       // Text baseline alignment adjustment (mm)
const verticalCenterOffset = 1.5;   // Vertical centering offset for single-line text (mm)
```

### Minimum Column Widths
```javascript
const minColWidths = {
  pos: emptyColumnWidth,      // Position number - 1cm for empty
  beschreibung: 40,           // Description (main content)
  menge: emptyColumnWidth,    // Quantity - 1cm for empty
  einheit: emptyColumnWidth,  // Unit - 1cm for empty
  einzelpreis: emptyColumnWidth,  // Unit price - 1cm for empty
  gesamtpreis: emptyColumnWidth   // Total price - 1cm for empty
};
```

### Row Height Calculation
```javascript
// Empty rows get minimum 1cm (10mm) height
const contentHeight = beschreibungLines.length * lineHeight;
const calculatedHeight = contentHeight + rowPaddingTop + rowPaddingBottom;
const rowHeight = Math.max(minRowHeight, calculatedHeight);
```

## Example Output
The table now automatically adjusts to content:

| Pos. | Beschreibung | Menge | Einheit | Einzelpreis | Gesamtpreis |
|------|--------------|-------|---------|-------------|-------------|
| 1 | Website Design | 1 | Stk | 2.500,00 € | 2.500,00 € |
| 2 | Content Management System Implementation with Custom Module Development and Third-Party Integration | 1 | Stk | 5.000,00 € | 5.000,00 € |
| 3 | SEO | 12 | Std | 80,00 € | 960,00 € |

Notice how:
- Row 2 is taller to accommodate the long description
- Rows 1 and 3 have minimal height for short content
- Columns adjust to fit their content width

## Files Modified
- `js/modules/pdf-generator.js`: Updated `renderItemsTable()` function

## Backward Compatibility
The changes are fully backward compatible:
- Existing layout templates work without modification
- Both old and new data formats are supported
- Minimum widths prevent columns from becoming too narrow

## Testing
To test the implementation:
1. Navigate to Einstellungen (Settings) page
2. Fill in company data
3. Click "📄 PDF Vorschau" button
4. Verify that:
   - Row heights adjust to content
   - Column widths are appropriate
   - Text wraps properly in description column
   - Table remains within page bounds

## Performance
The dynamic calculation adds minimal overhead:
- Width calculation: One pass through all items
- Height calculation: Per-row during rendering
- No significant impact on PDF generation time
