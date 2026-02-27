// -----------------------------
// Invoice Helper Functions
// -----------------------------
import { getArtikelliste } from '../modules/artikellisten-state.js';
import { DEFAULT_ZAHLUNGSZIEL_TAGE, ARTIKELLISTEN_STORAGE_KEY } from '../modules/artikellisten-config.js';

/**
 * Enrich invoice data with payment terms from the article list
 * @param {Object} invoiceRow - The invoice row data
 * @returns {Promise<Object>} - Enriched invoice data with payment terms
 */
export async function enrichInvoiceWithPaymentTerms(invoiceRow) {
  const enriched = { ...invoiceRow };
  
  // Try to get payment terms from article list if Firmen_ID is available
  if (invoiceRow.Firmen_ID) {
    try {
      const artikelliste = await getArtikelliste(invoiceRow.Firmen_ID);
      if (artikelliste && artikelliste.zahlungsziel_tage) {
        enriched.zahlungsziel_tage = artikelliste.zahlungsziel_tage;
      } else {
        enriched.zahlungsziel_tage = DEFAULT_ZAHLUNGSZIEL_TAGE;
      }
    } catch (error) {
      console.warn('Could not fetch payment terms from article list:', error);
      enriched.zahlungsziel_tage = DEFAULT_ZAHLUNGSZIEL_TAGE;
    }
  } else {
    enriched.zahlungsziel_tage = DEFAULT_ZAHLUNGSZIEL_TAGE;
  }
  
  return enriched;
}

/**
 * Calculate total from invoice or order items
 * @param {Array} items - Array of items with Gesamtpreis property
 * @returns {number} - Total sum of all items
 */
export function calculateItemsTotal(items) {
  if (!Array.isArray(items)) return 0;
  
  return items.reduce((sum, item) => {
    return sum + (parseFloat(item.Gesamtpreis) || 0);
  }, 0);
}

/**
 * Check whether a row (order or invoice) has article conflicts.
 * A conflict exists when an item references an article that is not in the
 * article list of the assigned customer.
 * Only rows that have both a Firmen_ID and at least one item with an Artikel
 * value are checked. If the customer has no article list at all, no conflict
 * is reported (the list may simply not have been set up yet).
 *
 * @param {Object} row - The order or invoice row object
 * @returns {boolean} - True if one or more items cannot be found in the article list
 */
export function hasArticleConflicts(row) {
  if (!row.Firmen_ID || !row.items || row.items.length === 0) return false;

  try {
    const artikellistenData = localStorage.getItem(ARTIKELLISTEN_STORAGE_KEY);
    if (!artikellistenData) return false;

    const artikellisten = JSON.parse(artikellistenData);
    if (typeof artikellisten !== 'object' || artikellisten === null) return false;

    const artikelliste = artikellisten[row.Firmen_ID];
    if (!artikelliste || !Array.isArray(artikelliste.items) || artikelliste.items.length === 0) return false;

    const availableArticles = new Set(
      artikelliste.items
        .filter(item => item.Artikel && item.Artikel.trim())
        .map(item => item.Artikel.trim())
    );

    return row.items.some(item => item.Artikel && item.Artikel.trim() && !availableArticles.has(item.Artikel.trim()));
  } catch (error) {
    return false;
  }
}
