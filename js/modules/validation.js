// -----------------------------
// Validation Module
// -----------------------------
// This module provides validation functions for business rules

/**
 * Check if a company has any active orders (Aufträge)
 * @param {string} firmenId - The Firmen_ID to check
 * @param {string} firmaName - The company name to check
 * @returns {boolean} - True if the company has active orders
 */
export function hasActiveOrders(firmenId, firmaName) {
  try {
    // Get orders data from localStorage
    const auftraegeData = localStorage.getItem("auftraege_tabelle_v1");
    if (!auftraegeData) return false;
    
    const orders = JSON.parse(auftraegeData);
    if (!Array.isArray(orders)) return false;
    
    // Check if any order belongs to this company
    // Orders are linked by Firma name (company name)
    const hasOrders = orders.some(order => {
      const orderFirma = (order.Firma || "").trim();
      return orderFirma && orderFirma === firmaName;
    });
    
    return hasOrders;
  } catch (error) {
    console.error('Error checking for active orders:', error);
    return false;
  }
}

/**
 * Check if a company has any unpaid invoices (Rechnungen)
 * @param {string} firmenId - The Firmen_ID to check
 * @param {string} firmaName - The company name to check
 * @returns {boolean} - True if the company has unpaid invoices
 */
export function hasUnpaidInvoices(firmenId, firmaName) {
  try {
    // Get invoices data from localStorage
    // Note: Invoice system is not yet fully implemented, so this is a placeholder
    const rechnungenData = localStorage.getItem("rechnungen_tabelle_v1");
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
 * Validate if a company status can be changed from "Kunde" to another status
 * @param {string} oldStatus - The current status
 * @param {string} newStatus - The new status to change to
 * @param {string} firmenId - The Firmen_ID
 * @param {string} firmaName - The company name
 * @returns {Object} - { allowed: boolean, message: string }
 */
export function validateStatusChange(oldStatus, newStatus, firmenId, firmaName) {
  // Only validate when changing FROM "Kunde" status TO another status
  if (oldStatus !== "Kunde" || newStatus === "Kunde") {
    return { allowed: true, message: "" };
  }
  
  // Check if company has active orders
  const hasOrders = hasActiveOrders(firmenId, firmaName);
  
  // Check if company has unpaid invoices
  const hasInvoices = hasUnpaidInvoices(firmenId, firmaName);
  
  // Build warning message
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
    
    return { allowed: false, message };
  }
  
  return { allowed: true, message: "" };
}
