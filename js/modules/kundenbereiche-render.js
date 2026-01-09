// -----------------------------
// Kundenbereiche Rendering Module
// -----------------------------
import { getRows as getCompanies } from './state.js';
import { getRows as getOrders } from './auftraege-state.js';
import { getRows as getInvoices } from './rechnungen-state.js';
import { escapeHtml } from '../utils/sanitize.js';
import { getSearchTerm } from './kundenbereiche-search.js';
import { ACTIVE_ORDER_STATUSES } from './auftraege-config.js';
import { getCustomerAccountByFirmenId, resetCustomerPassword } from './auth.js';


export function render() {
  const companies = getCompanies();
  const customers = companies.filter(c => c.Status === 'Kunde');
  
  const searchTerm = getSearchTerm();
  let filteredCustomers = customers;

  // Filter by search term
  if (searchTerm) {
    filteredCustomers = customers.filter(customer => {
      const firma = (customer.Firma || '').toLowerCase();
      const firmenId = (customer.Firmen_ID || '').toLowerCase();
      const email = (customer['E-mail'] || '').toLowerCase();
      return firma.includes(searchTerm) || firmenId.includes(searchTerm) || email.includes(searchTerm);
    });
  }

  const tbody = document.getElementById('tbody');
  if (!tbody) return;

  if (filteredCustomers.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; padding: 20px; color: #666;">
          ${searchTerm ? 'Keine passenden Kunden gefunden.' : 'Keine Kunden vorhanden.'}
        </td>
      </tr>
    `;
    return;
  }

  const orders = getOrders();
  const invoices = getInvoices();

  tbody.innerHTML = filteredCustomers.map(customer => {
    const firmenName = escapeHtml(customer.Firma || 'Unbekannt');
    const firmenId = escapeHtml(customer.Firmen_ID || '');
    const email = escapeHtml(customer['E-mail'] || 'Keine E-Mail');

    // Count orders in progress (Status: "in Arbeit" or empty)
    const customerOrders = orders.filter(order => order.Firma === customer.Firma);
    const ordersInProgress = customerOrders.filter(order => 
      ACTIVE_ORDER_STATUSES.includes(order.Status)
    ).length;

    // Count unpaid invoices and calculate outstanding amount
    // Filter invoices by company and exclude paid invoices
    const customerInvoices = invoices.filter(invoice => invoice.Firma === customer.Firma);
    
    // Filter out paid invoices (Bezahlt field with value "bezahlt")
    const unpaidCustomerInvoices = customerInvoices.filter(invoice => {
      const bezahlt = invoice.Bezahlt || "unbezahlt";
      return bezahlt !== "bezahlt";
    });
    
    const unpaidInvoices = unpaidCustomerInvoices.length;

    // Calculate total outstanding amount from unpaid invoices only
    let totalOutstanding = 0;
    unpaidCustomerInvoices.forEach(invoice => {
      // Calculate sum from invoice items
      let invoiceTotal = 0;
      if (invoice.items && Array.isArray(invoice.items) && invoice.items.length > 0) {
        // New invoice format: calculate from items array
        invoice.items.forEach(item => {
          const gesamtpreis = parseFloat(item.Gesamtpreis) || 0;
          invoiceTotal += gesamtpreis;
        });
      } else if (invoice.Gesamtsumme) {
        // Old invoice format: use Gesamtsumme field (backward compatibility)
        // Handle both German (1.234,56) and English (1234.56) number formats
        const gesamtsummeStr = String(invoice.Gesamtsumme);
        // Remove currency symbols and whitespace
        let cleanStr = gesamtsummeStr.replace(/[€$\s]/g, '');
        // Detect if comma is decimal separator (German format)
        if (cleanStr.includes(',') && cleanStr.lastIndexOf(',') > cleanStr.lastIndexOf('.')) {
          // German format: 1.234,56 -> remove periods (thousands), replace comma with period
          cleanStr = cleanStr.replace(/\./g, '').replace(',', '.');
        } else {
          // English format or ambiguous: just remove commas (thousands separator)
          cleanStr = cleanStr.replace(/,/g, '');
        }
        invoiceTotal = parseFloat(cleanStr) || 0;
      }
      
      // Apply discount if present
      const rabattPercent = parseFloat(invoice.Rabatt) || 0;
      const discountAmount = (invoiceTotal * rabattPercent) / 100;
      invoiceTotal -= discountAmount;
      
      totalOutstanding += invoiceTotal;
    });

    const formattedTotal = totalOutstanding.toFixed(2).replace('.', ',') + ' €';

    return `
      <tr class="customer-row" data-firmen-id="${escapeHtml(customer.Firmen_ID || '')}" style="cursor: pointer;">
        <td>${firmenName}</td>
        <td>${firmenId}</td>
        <td>${email}</td>
        <td style="text-align: center;">${ordersInProgress}</td>
        <td style="text-align: center;">${unpaidInvoices}</td>
        <td style="text-align: right;">${formattedTotal}</td>
        <td class="actions">
          <button class="btn-secondary view-customer-btn" data-firmen-id="${escapeHtml(customer.Firmen_ID || '')}">Kundenbereich ansehen</button>
          <button class="btn-primary credentials-btn" data-firmen-id="${escapeHtml(customer.Firmen_ID || '')}" data-email="${escapeHtml(email)}" data-firma="${escapeHtml(customer.Firma || 'Unbekannt')}">Zugangsdaten</button>
        </td>
      </tr>
    `;
  }).join('');

  // Add click handlers
  attachEventHandlers();
}

function attachEventHandlers() {
  // Click handler for table rows
  document.querySelectorAll('.customer-row').forEach(row => {
    row.addEventListener('click', (e) => {
      // Don't trigger if clicking on a button
      if (e.target.tagName === 'BUTTON') return;
      
      const firmenId = row.dataset.firmenId;
      if (firmenId) {
        viewCustomerPortal(firmenId);
      }
    });
  });

  // Click handler for buttons
  document.querySelectorAll('.view-customer-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation(); // Prevent row click
      const firmenId = btn.dataset.firmenId;
      if (firmenId) {
        viewCustomerPortal(firmenId);
      }
    });
  });
  
  // Click handler for credentials buttons
  document.querySelectorAll('.credentials-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation(); // Prevent row click
      const firmenId = btn.dataset.firmenId;
      const email = btn.dataset.email;
      const firma = btn.dataset.firma; // Browser auto-decodes HTML entities from data attributes
      if (firmenId) {
        showCredentialsModal(firmenId, email, firma);
      }
    });
  });
}

function viewCustomerPortal(firmenId) {
  // Store the firmenId in session for the customer portal to use
  try {
    sessionStorage.setItem('ka_view_customer_id', firmenId);
    window.location.href = 'kundenbereich.html';
  } catch (error) {
    console.error('Failed to store customer ID:', error);
    alert('Fehler: Kundenbereich konnte nicht geöffnet werden.');
  }
}

function showCredentialsModal(firmenId, email, firma) {
  const account = getCustomerAccountByFirmenId(firmenId);
  
  if (!account) {
    alert('Kundenkonto nicht gefunden. Bitte stellen Sie sicher, dass für diesen Kunden ein Kundenkonto erstellt wurde.');
    return;
  }
  
  // Note: firma comes from data attribute and is already decoded by browser
  // We need to re-escape it for HTML display to prevent XSS
  const firmaEscaped = escapeHtml(firma);
  
  // Create modal overlay
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  `;
  
  // Create modal content
  const modal = document.createElement('div');
  modal.className = 'credentials-modal';
  modal.style.cssText = `
    background: white;
    padding: 2rem;
    border-radius: 8px;
    max-width: 500px;
    width: 90%;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  `;
  
  modal.innerHTML = `
    <h2 style="margin-top: 0; margin-bottom: 1.5rem;">Kunden-Zugangsdaten</h2>
    <div style="margin-bottom: 1rem;">
      <strong>Firma:</strong> ${firmaEscaped}
    </div>
    <div style="margin-bottom: 1rem;">
      <strong>Firmen-ID:</strong> ${escapeHtml(firmenId)}
    </div>
    <div style="margin-bottom: 1rem;">
      <strong>E-Mail (Login):</strong> ${escapeHtml(email)}
    </div>
    <div style="margin-bottom: 1.5rem; padding: 1rem; background: #f0f0f0; border-radius: 4px;">
      <p style="margin: 0 0 0.5rem 0; color: #666; font-size: 0.9rem;">
        <strong>Wichtig:</strong> Das Passwort wurde bei der Kontoerstellung automatisch generiert und kann nicht angezeigt werden.
        Sie können das Passwort zurücksetzen, um ein neues zu generieren.
      </p>
    </div>
    <div style="margin-bottom: 1rem;">
      <strong>Konto erstellt:</strong> ${new Date(account.createdAt).toLocaleString('de-DE')}
    </div>
    <div style="margin-bottom: 1.5rem;">
      <strong>Letzte Aktualisierung:</strong> ${new Date(account.updatedAt).toLocaleString('de-DE')}
    </div>
    <div style="display: flex; gap: 0.5rem; justify-content: flex-end;">
      <button class="btn-secondary" id="closeCredentialsModal">Schließen</button>
      <button class="btn-primary" id="resetPasswordBtn">Passwort zurücksetzen</button>
    </div>
  `;
  
  overlay.appendChild(modal);
  document.body.appendChild(overlay);
  
  // Close modal when clicking overlay
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      document.body.removeChild(overlay);
    }
  });
  
  // Close button handler
  document.getElementById('closeCredentialsModal').addEventListener('click', () => {
    document.body.removeChild(overlay);
  });
  
  // Reset password button handler - firma is plain text, safe for confirm()
  document.getElementById('resetPasswordBtn').addEventListener('click', async () => {
    if (!confirm(`Möchten Sie wirklich ein neues Passwort für ${firma} generieren?\n\nDas alte Passwort wird ungültig und der Kunde muss über das neue Passwort informiert werden.`)) {
      return;
    }
    
    const newPassword = await resetCustomerPassword(firmenId);
    
    if (newPassword) {
      // Update modal to show new password
      modal.innerHTML = `
        <h2 style="margin-top: 0; margin-bottom: 1.5rem; color: #28a745;">Neues Passwort generiert</h2>
        <div style="margin-bottom: 1rem;">
          <strong>Firma:</strong> ${firmaEscaped}
        </div>
        <div style="margin-bottom: 1rem;">
          <strong>E-Mail (Login):</strong> ${escapeHtml(email)}
        </div>
        <div style="margin-bottom: 1.5rem; padding: 1rem; background: #d4edda; border: 1px solid #c3e6cb; border-radius: 4px;">
          <p style="margin: 0 0 0.5rem 0; font-weight: bold; color: #155724;">Neues Passwort:</p>
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <code style="font-size: 1.2rem; padding: 0.5rem; background: white; border-radius: 4px; flex: 1; word-break: break-all;">${escapeHtml(newPassword)}</code>
            <button class="btn-secondary" id="copyPasswordBtn" style="flex-shrink: 0;">Kopieren</button>
          </div>
        </div>
        <div style="margin-bottom: 1.5rem; padding: 1rem; background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 4px;">
          <p style="margin: 0; color: #856404; font-size: 0.9rem;">
            <strong>⚠️ Wichtig:</strong> Bitte notieren Sie sich das Passwort und teilen Sie es dem Kunden mit.
            Das Passwort wird aus Sicherheitsgründen nicht erneut angezeigt.
          </p>
        </div>
        <div style="display: flex; gap: 0.5rem; justify-content: flex-end;">
          <button class="btn-primary" id="closeCredentialsModal2">Schließen</button>
        </div>
      `;
      
      // Copy password button handler
      document.getElementById('copyPasswordBtn').addEventListener('click', () => {
        navigator.clipboard.writeText(newPassword).then(() => {
          const btn = document.getElementById('copyPasswordBtn');
          btn.textContent = '✓ Kopiert!';
          btn.style.background = '#28a745';
          btn.style.color = 'white';
          setTimeout(() => {
            btn.textContent = 'Kopieren';
            btn.style.background = '';
            btn.style.color = '';
          }, 2000);
        }).catch(err => {
          console.error('Failed to copy password:', err);
          alert('Fehler beim Kopieren. Bitte kopieren Sie das Passwort manuell.');
        });
      });
      
      // Close button handler
      document.getElementById('closeCredentialsModal2').addEventListener('click', () => {
        document.body.removeChild(overlay);
      });
    } else {
      alert('Fehler beim Zurücksetzen des Passworts. Bitte versuchen Sie es erneut.');
    }
  });
}
