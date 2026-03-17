// -----------------------------
// Bank Email Checker Module
// -----------------------------
// Automatically checks the configured email inbox via IMAP for bank payment
// notification emails and marks matching invoices as "bezahlt" (paid).
//
// Called on every dashboard load; a configurable cooldown (default 5 min)
// prevents hammering the IMAP server on rapid page refreshes.

const BANK_EMAIL_CHECK_KEY      = 'ka_bank_email_check_last_run';
const CHECK_INTERVAL_MINUTES    = 5; // Minimum minutes between automatic checks

/**
 * Check whether enough time has passed since the last IMAP check.
 * @returns {boolean}
 */
function shouldRunCheck() {
  try {
    const lastRun = localStorage.getItem(BANK_EMAIL_CHECK_KEY);
    if (!lastRun) return true;

    const elapsed = (Date.now() - new Date(lastRun).getTime()) / 60000; // in minutes
    return elapsed >= CHECK_INTERVAL_MINUTES;
  } catch {
    return true;
  }
}

/**
 * Persist the current time as the last check timestamp.
 */
function updateLastCheckTime() {
  try {
    localStorage.setItem(BANK_EMAIL_CHECK_KEY, new Date().toISOString());
  } catch { /* ignore */ }
}

/**
 * Check the email inbox for bank payment notifications and automatically
 * mark matching invoices as paid.
 *
 * @param {boolean} force - Skip the cooldown and run immediately
 * @returns {Promise<object|null>} - API result object or null if skipped / error
 */
export async function checkBankEmails(force = false) {
  if (!force && !shouldRunCheck()) {
    return null;
  }

  updateLastCheckTime();

  try {
    const response = await fetch('api/check-bank-emails.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
    });

    if (!response.ok) {
      console.warn('Bank email check: server returned HTTP', response.status);
      return null;
    }

    const result = await response.json();

    if (!result.success) {
      // IMAP not configured / not available → log quietly, do not bother the user
      if (result.imapMissing) {
        console.info('Bank email check: PHP IMAP extension not available on this server.');
      } else {
        console.warn('Bank email check failed:', result.error || 'Unknown error');
      }
      return result;
    }

    const paidCount = (result.paid || []).length;

    if (paidCount > 0) {
      // Notify other modules (e.g., invoice list) to reload
      window.dispatchEvent(new Event('invoicesChanged'));

      // Show a brief, non-intrusive notification on the dashboard
      showPaidNotification(result.paid);
    }

    return result;
  } catch (error) {
    // Network error or JSON parse error – log quietly
    console.warn('Bank email check: network error –', error.message);
    return null;
  }
}

/**
 * Display a temporary success banner listing automatically paid invoices.
 * Uses the same message style as other dashboard notifications.
 *
 * @param {Array} paidList - Array of { invoiceId, amount, subject }
 */
function showPaidNotification(paidList) {
  try {
    // Find or create a container near the top of the dashboard
    let container = document.getElementById('bank-email-notification');
    if (!container) {
      container = document.createElement('div');
      container.id = 'bank-email-notification';
      container.style.cssText = [
        'margin: 0 0 20px 0',
        'padding: 12px 16px',
        'background: #d1fae5',
        'border: 1px solid #6ee7b7',
        'border-radius: 6px',
        'color: #065f46',
        'font-size: 0.9em',
      ].join(';');

      // Insert before the email-queue-container if it exists, otherwise prepend to body
      const anchor = document.getElementById('email-queue-container')
                  || document.querySelector('.dashboard-container')
                  || document.body;
      anchor.insertAdjacentElement('afterbegin', container);
    }

    const lines = paidList.map(p =>
      `• Rechnung <strong>${p.invoiceId}</strong> – ${formatAmount(p.amount)} EUR`
    );

    container.innerHTML =
      `✅ <strong>${paidList.length} Rechnung${paidList.length === 1 ? '' : 'en'} ` +
      `automatisch als bezahlt markiert:</strong><br>` +
      lines.join('<br>');

    container.style.display = 'block';

    // Auto-hide after 15 seconds
    setTimeout(() => {
      if (container) container.style.display = 'none';
    }, 15000);
  } catch (err) {
    console.warn('Could not show bank email notification:', err.message);
  }
}

/**
 * Format a number in German locale (e.g. 1234.56 → "1.234,56")
 * @param {number} amount
 * @returns {string}
 */
function formatAmount(amount) {
  try {
    return new Intl.NumberFormat('de-DE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return String(amount);
  }
}

/**
 * Reset the last-check timestamp (useful for testing from the settings page).
 */
export function resetBankEmailCheckTime() {
  try {
    localStorage.removeItem(BANK_EMAIL_CHECK_KEY);
  } catch { /* ignore */ }
}
