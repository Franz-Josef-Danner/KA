// -----------------------------
// Overdue Invoice Checker Module
// -----------------------------
// Checks for overdue invoices and sends notifications
import { getRows } from './rechnungen-state.js';
import { notifyInvoiceOverdue } from './email-notifications.js';
import { getArtikelliste } from './artikellisten-state.js';
import { DEFAULT_ZAHLUNGSZIEL_TAGE } from './artikellisten-config.js';
import { calculateItemsTotal } from '../utils/invoice-helpers.js';

const OVERDUE_CHECK_KEY = 'ka_overdue_check_last_run';
const OVERDUE_NOTIFIED_KEY = 'ka_overdue_notified_invoices';
const CHECK_INTERVAL_HOURS = 24; // Check once per day

/**
 * Calculate deadline date based on invoice date and payment terms
 * @param {string} invoiceDate - Invoice date in YYYY-MM-DD format
 * @param {number} paymentTermDays - Number of days until payment is due
 * @returns {Date|null} - Deadline date or null
 */
function calculateDeadlineDate(invoiceDate, paymentTermDays) {
  if (!invoiceDate) return null;
  
  try {
    const [year, month, day] = invoiceDate.split('-');
    const date = new Date(year, month - 1, day);
    if (isNaN(date.getTime())) return null;
    
    date.setDate(date.getDate() + paymentTermDays);
    return date;
  } catch (error) {
    console.error('Error calculating deadline date:', error);
    return null;
  }
}

/**
 * Calculate days past due
 * @param {Date} deadline - Deadline date
 * @returns {number} - Number of days past due (0 if not overdue)
 */
function calculateDaysPastDue(deadline) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const deadlineCopy = new Date(deadline);
  deadlineCopy.setHours(0, 0, 0, 0);
  
  if (deadlineCopy >= today) return 0;
  
  const diffTime = today.getTime() - deadlineCopy.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

/**
 * Format date as DD.MM.YYYY
 * @param {Date} date - Date to format
 * @returns {string} - Formatted date string
 */
function formatDateDDMMYYYY(date) {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}.${month}.${year}`;
}

/**
 * Get the list of invoice IDs that have already been notified as overdue
 * @returns {Set<string>} - Set of invoice IDs
 */
function getNotifiedInvoices() {
  try {
    const raw = localStorage.getItem(OVERDUE_NOTIFIED_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw));
  } catch (error) {
    console.error('Error loading notified invoices:', error);
    return new Set();
  }
}

/**
 * Save the list of notified invoice IDs
 * @param {Set<string>} notifiedIds - Set of invoice IDs
 */
function saveNotifiedInvoices(notifiedIds) {
  try {
    localStorage.setItem(OVERDUE_NOTIFIED_KEY, JSON.stringify([...notifiedIds]));
  } catch (error) {
    console.error('Error saving notified invoices:', error);
  }
}

/**
 * Mark an invoice as notified
 * @param {string} invoiceId - Invoice ID
 */
function markInvoiceNotified(invoiceId) {
  const notified = getNotifiedInvoices();
  notified.add(invoiceId);
  saveNotifiedInvoices(notified);
}

/**
 * Check if enough time has passed since last check
 * @returns {boolean} - True if check should run
 */
function shouldRunCheck() {
  try {
    const lastRun = localStorage.getItem(OVERDUE_CHECK_KEY);
    if (!lastRun) return true;
    
    const lastRunTime = new Date(lastRun);
    const now = new Date();
    const hoursSinceLastRun = (now - lastRunTime) / (1000 * 60 * 60);
    
    return hoursSinceLastRun >= CHECK_INTERVAL_HOURS;
  } catch (error) {
    console.error('Error checking last run time:', error);
    return true;
  }
}

/**
 * Update the last check timestamp
 */
function updateLastCheckTime() {
  try {
    localStorage.setItem(OVERDUE_CHECK_KEY, new Date().toISOString());
  } catch (error) {
    console.error('Error updating last check time:', error);
  }
}

/**
 * Check for overdue invoices and send notifications
 * @param {boolean} force - Force check even if interval hasn't elapsed
 * @returns {number} - Number of overdue invoices found
 */
export function checkOverdueInvoices(force = false) {
  // Check if we should run (respects interval unless forced)
  if (!force && !shouldRunCheck()) {
    console.log('Overdue invoice check skipped - too soon since last check');
    return 0;
  }
  
  console.log('Running overdue invoice check...');
  
  const invoices = getRows();
  if (!invoices || invoices.length === 0) {
    console.log('No invoices to check');
    updateLastCheckTime();
    return 0;
  }
  
  const notifiedInvoices = getNotifiedInvoices();
  let overdueCount = 0;
  
  invoices.forEach(invoice => {
    // Skip if already paid
    const bezahlt = invoice.Bezahlt || 'unbezahlt';
    if (bezahlt === 'bezahlt') return;
    
    // Get invoice details
    const invoiceId = invoice.Rechnungs_ID;
    const invoiceDate = invoice.Rechnungsdatum;
    const customerName = invoice.Firma || 'Unbekannt';
    
    // Skip if already notified
    if (notifiedInvoices.has(invoiceId)) return;
    
    // Get payment terms
    let paymentTermDays = DEFAULT_ZAHLUNGSZIEL_TAGE;
    const artikelliste = getArtikelliste(invoice.Artikelliste);
    if (artikelliste && artikelliste.Zahlungsziel) {
      paymentTermDays = artikelliste.Zahlungsziel;
    }
    
    // Calculate deadline
    const deadline = calculateDeadlineDate(invoiceDate, paymentTermDays);
    if (!deadline) return;
    
    // Check if overdue
    const daysPastDue = calculateDaysPastDue(deadline);
    if (daysPastDue === 0) return; // Not overdue yet
    
    // Calculate total
    const invoiceItems = invoice.Artikel || [];
    const total = calculateItemsTotal(invoiceItems);
    
    // Send notification
    const notificationResult = notifyInvoiceOverdue({
      invoiceId: invoiceId,
      customerName: customerName,
      total: total,
      dueDate: formatDateDDMMYYYY(deadline),
      daysPastDue: daysPastDue
    });
    
    if (notificationResult) {
      console.log(`Overdue notification sent for invoice ${invoiceId} (${daysPastDue} days overdue)`);
      markInvoiceNotified(invoiceId);
      overdueCount++;
    }
  });
  
  updateLastCheckTime();
  console.log(`Overdue invoice check completed. Found ${overdueCount} new overdue invoices.`);
  return overdueCount;
}

/**
 * Clear the list of notified invoices (for testing or manual reset)
 */
export function clearNotifiedInvoices() {
  try {
    localStorage.removeItem(OVERDUE_NOTIFIED_KEY);
    console.log('Cleared notified invoices list');
  } catch (error) {
    console.error('Error clearing notified invoices:', error);
  }
}

/**
 * Reset the last check time (for testing)
 */
export function resetLastCheckTime() {
  try {
    localStorage.removeItem(OVERDUE_CHECK_KEY);
    console.log('Reset last check time');
  } catch (error) {
    console.error('Error resetting last check time:', error);
  }
}

/**
 * Remove an invoice from the notified list (e.g., when invoice is paid)
 * @param {string} invoiceId - Invoice ID to remove
 */
export function clearInvoiceFromNotified(invoiceId) {
  try {
    const notified = getNotifiedInvoices();
    if (notified.has(invoiceId)) {
      notified.delete(invoiceId);
      saveNotifiedInvoices(notified);
      console.log(`Removed invoice ${invoiceId} from overdue notification list`);
    }
  } catch (error) {
    console.error('Error clearing invoice from notified list:', error);
  }
}
