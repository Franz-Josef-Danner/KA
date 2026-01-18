// -----------------------------
// Invoice Helper Functions
// -----------------------------
import { getArtikelliste } from '../modules/artikellisten-state.js';
import { DEFAULT_ZAHLUNGSZIEL_TAGE } from '../modules/artikellisten-config.js';

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
