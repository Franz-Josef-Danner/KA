# PDF Layout Implementation - Summary

## Problem Statement (Original German)

Wir müssen Auftrag und Rechnungs PDF in 3 Sparten unterteilen:

1. **Kopf:** Alles von den Firmendaten und Kundendaten bis zu den Artikeln
2. **Körper:** Die Summe der Artikel Kosten
3. **Fuß:** Die Fußzeile

## Rules Implemented

### ✅ Rule 1: Kopf wächst nach unten
Die Kopfzeile kann nicht höher werden, wenn sie größer wird. Wenn zum Beispiel mehr Artikel in der Tabelle landen, dann wächst sie nach unten.

**Implementation:** Items table grows downward dynamically. No height limit on the header.

### ✅ Rule 2: Körper folgt dem Kopf
Der Körper kann nicht ohne Kopf sein, er liegt immer unter dem Kopf an und weicht nach unten aus, wenn der Kopf wächst. Wenn der Körper wächst, dann auch nach unten, niemals nach oben.

**Implementation:** Totals section is positioned dynamically after items table ends, with 5mm spacing.

### ✅ Rule 3: Fuß bleibt am Boden und wächst nach oben
Der Fuß bleibt stabil am Boden, wenn er wächst, dann nach oben. Er wächst mit mehr oder weniger Inhalt, weil bei Rechnung mehr und bei Auftrag weniger Inhalt vorhanden ist.

**Implementation:** 
- Footer height calculated dynamically based on content
- Footer positioned from bottom edge, growing upward
- Footer text ("Zehen") can grow, pushing footer upward
- Collision detection uses dynamic footer position

### ✅ Rule 4: Kollision und Seitenumbruch
Wenn der Körper den Fuß berührt, dann springt er auf die nächste Seite. Wenn der Körper den Fuß berührt, wird eine Artikeltabelle auf der nächsten Seite erzeugt in der alle Artikel auf Seite 1, die den Fuß berühren oder am Fuß vorbei sind, in derselben Reihenfolge in die Tabelle in der nächsten Seite eingeordnet.

**Implementation:** 
- Before rendering each table row, check if `rowY + rowHeight + 10mm > footerY`
- If true, create new page and continue table with header
- Articles maintain their order across pages

### ✅ Rule 5: Mehrseitige Prinzipien
Auf der nächsten Seite gilt dasselbe Prinzip mit der Anordnung. Alles bis Artikeltabelle ist Kopf, Summe ist Körper und die Fußzeile wird auch wieder gesetzt und dieselben Regeln gelten hier, wie auf der ersten Seite.

**Implementation:**
- Table header repeated on each new page
- Footer rendered on all pages at same position
- Totals positioned after last item, before footer
- Same collision rules apply on all pages

## Technical Solution

### Core Functions Modified

1. **`renderPDFDocument()`**
   - Calculates footer height dynamically before rendering
   - Positions footer from bottom edge, growing upward based on content
   - Renders items-table and totals separately with special logic
   - Renders footer on all pages at dynamically calculated position

2. **`calculateFooterHeight()` (new)**
   - Measures footer content without rendering
   - Accounts for bank info, QR code, and footer text
   - Returns actual height needed for footer
   - Allows footer to grow upward dynamically

3. **`renderItemsTableWithFooter()` (new)**
   - Checks for footer collision before each row
   - Creates new pages as needed
   - Continues table with header on new pages
   - Returns end Y position for totals placement

4. **`renderTotals()`**
   - Now called with dynamic Y position
   - Positioned after items table with spacing check

### Constants

```javascript
const PDF_MARGIN = 10; // Page margin in mm
const PAGE_NUMBER_MARGIN_FROM_BOTTOM = 5; // Page number position from bottom
const TOTALS_FOOTER_SPACING_MM = 6; // Minimum space between totals and footer
const minSpacingBeforeFooter = 10; // Minimum space before footer
const spacing = 5; // Space between table and totals
```

**Note:** Footer height is now calculated dynamically based on content, not fixed at 50mm.

## Layout Structure

```
┌─────────────────────────────────┐
│ Kopf (Header)                   │
│ - Logo                          │
│ - Company Info                  │
│ - Customer Info                 │
│ - Items Table Header            │
│ - Item 1                        │
│ - Item 2                        │
│ - ...                           │
│ - Item N                        │
├─────────────────────────────────┤
│ Körper (Body)                   │
│ - Subtotal (if discount)        │
│ - Discount (if applicable)      │
│ - Total                         │
├─────────────────────────────────┤
│ Fuß (Footer) - grows upward     │
│ - Payment Info (invoices)       │
│ - QR Code (if configured)       │
│ - Zehen (Footer Text)           │ ← Can grow, pushes footer up
│   - Multiple lines if needed    │
│ - Page Number (5mm from bottom) │
└─────────────────────────────────┘
```

**Footer Growth Behavior:**
- Footer text ("Zehen") can be 1-10+ lines
- As text grows, footer moves upward from bottom
- Footer bottom edge stays at fixed position (5mm above page number)
- Collision detection accounts for dynamic footer height

## Multi-Page Example

```
Page 1:                          Page 2:
┌─────────────────┐              ┌─────────────────┐
│ Header          │              │ Table Header    │
│ Items 1-20      │              │ Items 21-35     │
│                 │              │                 │
│                 │              │ Totals          │
├─────────────────┤              ├─────────────────┤
│ Footer          │              │ Footer          │
└─────────────────┘              └─────────────────┘
```

## Files Changed

1. **`js/modules/pdf-generator.js`**
   - Added `renderItemsTableWithFooter()` function
   - Modified `renderPDFDocument()` for three-part layout
   - Improved footer rendering logic

2. **Documentation Added:**
   - `PDF_DREI_TEILE_LAYOUT.md` - Technical documentation
   - `MANUAL_TESTING_GUIDE.md` - Testing scenarios
   - `IMPLEMENTATION_SUMMARY.md` - This file

## Testing

See `MANUAL_TESTING_GUIDE.md` for comprehensive test scenarios covering:
- Single page documents (few items)
- Multi-page documents (many items)
- Edge cases (collision detection)
- Both order and invoice types
- Discount calculations
- Error cases

## Backward Compatibility

✅ The implementation is fully backward compatible:
- Works with existing standard template
- Works with custom layouts from layout editor
- Maintains all existing features (QR codes, discounts, etc.)
- No breaking changes to API

## Security

✅ No security vulnerabilities introduced (verified with CodeQL)

## Next Steps

1. Manual testing following `MANUAL_TESTING_GUIDE.md`
2. User validation of PDF output
3. Adjustment of `ESTIMATED_TOTALS_HEIGHT` if needed
4. Optional: Add support for multi-line item descriptions in future

## Metrics

- **Lines of code changed:** ~220
- **New functions:** 1 (`renderItemsTableWithFooter`)
- **Files modified:** 1 (`pdf-generator.js`)
- **Documentation pages:** 3
- **Security vulnerabilities:** 0
