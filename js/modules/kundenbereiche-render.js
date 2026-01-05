// -----------------------------
// Kundenbereiche Rendering Module
// -----------------------------
import { getRows as getCompanies } from './state.js';
import { getRows as getOrders } from './auftraege-state.js';
import { getRows as getInvoices } from './rechnungen-state.js';
import { escapeHtml } from '../utils/sanitize.js';
import { getSearchTerm } from './kundenbereiche-search.js';
import { ACTIVE_ORDER_STATUSES } from './auftraege-config.js';

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

    // Count unpaid invoices (all invoices are considered unpaid for now)
    // In a real system, there would be a "bezahlt" status
    const customerInvoices = invoices.filter(invoice => invoice.Firma === customer.Firma);
    const unpaidInvoices = customerInvoices.length;

    // Calculate total outstanding amount from unpaid invoices
    let totalOutstanding = 0;
    customerInvoices.forEach(invoice => {
      // Try to parse the budget field as a number
      const budget = invoice.Budget || '';
      const amount = parseFloat(budget.replace(/[^\d.,-]/g, '').replace(',', '.'));
      if (!isNaN(amount)) {
        totalOutstanding += amount;
      }
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
