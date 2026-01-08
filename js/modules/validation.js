// -----------------------------
// Validation Module
// -----------------------------
// This module provides validation functions for business rules

import { ACTIVE_ORDER_STATUSES } from './auftraege-config.js';
import { STORAGE_KEY as RECHNUNGEN_STORAGE_KEY } from './rechnungen-config.js';

/**
 * Check if a company has any active orders (Aufträge)
 * Active orders are those with status "offen" or "in Bearbeitung".
 * Orders with status "abgeschlossen" or "storniert" are not considered active.
 * 
 * @param {string} firmaName - The company name to check (orders are linked by company name)
 * @returns {boolean} - True if the company has active orders
 */
export function hasActiveOrders(firmaName) {
  if (!firmaName) return false;
  
  try {
    // Get orders data from localStorage
    const auftraegeData = localStorage.getItem("auftraege_tabelle_v1");
    if (!auftraegeData) return false;
    
    const orders = JSON.parse(auftraegeData);
    if (!Array.isArray(orders)) return false;
    
    // Check if any order belongs to this company and has an active status
    // Orders are linked by Firma name (company name)
    // Only consider orders with active statuses as active
    // Empty string and "offen" are included for backward compatibility (orders created before status field was standardized)
    const hasOrders = orders.some(order => {
      const orderFirma = (order.Firma || "").trim();
      const orderStatus = (order.Status || "").trim();
      
      // Consider order active if it has one of the active statuses
      // Note: Empty status and "offen" are treated as active for backward compatibility
      // The load() function in auftraege-state.js normalizes these to "in Arbeit"
      const isActive = ACTIVE_ORDER_STATUSES.includes(orderStatus);
      
      return orderFirma && orderFirma === firmaName && isActive;
    });
    
    return hasOrders;
  } catch (error) {
    console.error('Error checking for active orders:', error);
    return false;
  }
}

/**
 * Check if a company has any unpaid invoices (Rechnungen)
 * Note: Invoice system is not yet fully implemented. This is a placeholder
 * for future functionality.
 * 
 * @param {string} firmaName - The company name to check
 * @returns {boolean} - True if the company has unpaid invoices
 */
export function hasUnpaidInvoices(firmaName) {
  if (!firmaName) return false;
  
  try {
    // Get invoices data from localStorage
    // Note: Invoice system is not yet fully implemented, so this is a placeholder
    const rechnungenData = localStorage.getItem(RECHNUNGEN_STORAGE_KEY);
    if (!rechnungenData) return false;
    
    const invoices = JSON.parse(rechnungenData);
    if (!Array.isArray(invoices)) return false;
    
    // Check if any unpaid invoice belongs to this company
    // Invoices would be linked by Firma name and have a payment status
    const hasUnpaid = invoices.some(invoice => {
      const invoiceFirma = (invoice.Firma || "").trim();
      const isPaid = invoice.Bezahlt === true || invoice.Status === "bezahlt";
      return invoiceFirma && invoiceFirma === firmaName && !isPaid;
    });
    
    return hasUnpaid;
  } catch (error) {
    console.error('Error checking for unpaid invoices:', error);
    return false;
  }
}

/**
 * Check if a company has an article list with items
 * @param {string} firmenId - The Firmen_ID to check
 * @returns {boolean} - True if the company has an article list with items
 */
export function hasArticleListWithItems(firmenId) {
  if (!firmenId) return false;
  
  try {
    // Get article lists data from localStorage
    const artikellistenData = localStorage.getItem("artikellisten_v1");
    if (!artikellistenData) return false;
    
    const artikellisten = JSON.parse(artikellistenData);
    if (typeof artikellisten !== 'object' || artikellisten === null) return false;
    
    // Check if article list exists for this company and has items
    const artikelliste = artikellisten[firmenId];
    return artikelliste && Array.isArray(artikelliste.items) && artikelliste.items.length > 0;
  } catch (error) {
    console.error('Error checking for article list with items:', error);
    return false;
  }
}

/**
 * Validate if a company status can be changed from "Kunde" to another status
 * @param {string} oldStatus - The current status
 * @param {string} newStatus - The new status to change to
 * @param {string} firmenId - The Firmen_ID
 * @param {string} firmaName - The company name (used to check orders and invoices)
 * @returns {Object} - { allowed: boolean, message: string, requiresConfirmation: boolean, confirmationMessage: string }
 */
export function validateStatusChange(oldStatus, newStatus, firmenId, firmaName) {
  // Only validate when changing FROM "Kunde" status TO another status
  if (oldStatus !== "Kunde" || newStatus === "Kunde") {
    return { allowed: true, message: "", requiresConfirmation: false, confirmationMessage: "" };
  }
  
  // Check if company has active orders (using company name)
  const hasOrders = hasActiveOrders(firmaName);
  
  // Check if company has unpaid invoices (using company name)
  const hasInvoices = hasUnpaidInvoices(firmaName);
  
  // Block status change if there are orders or unpaid invoices
  if (hasOrders || hasInvoices) {
    let message = "Die Statusänderung kann nicht durchgeführt werden.\n\n";
    message += `Für die Firma "${firmaName}" existieren noch:\n`;
    
    if (hasOrders) {
      message += "• Aktive Aufträge\n";
    }
    if (hasInvoices) {
      message += "• Unbezahlte Rechnungen\n";
    }
    
    message += "\nBitte schließen Sie alle Aufträge ab und stellen Sie sicher, dass alle Rechnungen bezahlt sind, bevor Sie den Status ändern.";
    
    return { allowed: false, message, requiresConfirmation: false, confirmationMessage: "" };
  }
  
  // Check if company has article list with items
  const hasArticles = hasArticleListWithItems(firmenId);
  
  // If article list with items exists, require confirmation
  if (hasArticles) {
    let confirmationMessage = `Die Firma "${firmaName}" hat eine Artikelliste mit Artikeln.\n\n`;
    confirmationMessage += "Wenn Sie den Status ändern, wird diese Artikelliste gelöscht.\n\n";
    confirmationMessage += "Sind Sie sicher, dass Sie fortfahren möchten?";
    
    return { allowed: true, message: "", requiresConfirmation: true, confirmationMessage };
  }
  
  return { allowed: true, message: "", requiresConfirmation: false, confirmationMessage: "" };
}
