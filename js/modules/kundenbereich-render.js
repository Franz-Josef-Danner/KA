// -----------------------------
// Kundenbereich Rendering Module
// -----------------------------
import { getCurrentUser, isAdmin } from './auth.js';
import { getRows as getOrders } from './auftraege-state.js';
import { getRows as getInvoices } from './rechnungen-state.js';
import { getRows as getCompanies } from './state.js';
import { escapeHtml } from '../utils/sanitize.js';

export function render() {
  const user = getCurrentUser();
  if (!user) {
    console.error('No user found');
    return;
  }

  // Get the firmenId - either from user session (customer) or from sessionStorage (admin viewing)
  let firmenId = user.firmenId;
  
  // If admin is viewing a specific customer, get firmenId from sessionStorage
  if (isAdmin()) {
    const viewCustomerId = sessionStorage.getItem('ka_view_customer_id');
    if (viewCustomerId) {
      firmenId = viewCustomerId;
      // Clear the session storage after reading
      sessionStorage.removeItem('ka_view_customer_id');
    }
  }
  
  // If no firmenId, show message
  if (!firmenId) {
    renderNoCustomerSelected();
    return;
  }

  // Get company info
  const companies = getCompanies();
  const company = companies.find(c => c.Firmen_ID === firmenId);
  
  if (!company) {
    renderCompanyNotFound();
    return;
  }

  // Update page title with company name
  const titleElement = document.querySelector('h1');
  if (titleElement && company.Firma) {
    titleElement.textContent = `Kundenbereich - ${escapeHtml(company.Firma)}`;
  }

  // Render orders and invoices
  renderOrders(firmenId);
  renderInvoices(firmenId);
}

function renderNoCustomerSelected() {
  const container = document.querySelector('.customer-portal-container');
  if (container) {
    container.innerHTML = `
      <div style="padding: 40px; text-align: center; color: #666;">
        <p>Kein Kunde ausgewählt. Bitte wählen Sie einen Kunden aus der Kundenbereiche-Übersicht.</p>
        <a href="kundenbereiche.html" class="btn-primary" style="display: inline-block; margin-top: 20px; padding: 10px 20px; text-decoration: none;">Zur Kundenbereiche-Übersicht</a>
      </div>
    `;
  }
}

function renderCompanyNotFound() {
  const container = document.querySelector('.customer-portal-container');
  if (container) {
    container.innerHTML = `
      <div style="padding: 40px; text-align: center; color: #666;">
        <p>Firma nicht gefunden.</p>
      </div>
    `;
  }
}

function renderOrders(firmenId) {
  const orders = getOrders();
  const customerOrders = orders.filter(order => order.Firma === getCompanyNameByFirmenId(firmenId));
  
  const tbody = document.getElementById('ordersTableBody');
  if (!tbody) return;

  if (customerOrders.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; padding: 20px; color: #666;">
          Keine Aufträge vorhanden.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = customerOrders.map(order => {
    const auftragId = escapeHtml(order.Auftrags_ID || '');
    const datum = escapeHtml(order.Auftragsdatum || '');
    const ansprechpartner = escapeHtml(order.Ansprechpartner || '');
    const projekt = escapeHtml(order.Projekt || '');
    const status = escapeHtml(order.Status || '');
    const budget = escapeHtml(order.Budget || '');

    return `
      <tr>
        <td>${auftragId}</td>
        <td>${datum}</td>
        <td>${ansprechpartner}</td>
        <td>${projekt}</td>
        <td>${status}</td>
        <td>${budget}</td>
        <td class="actions">
          <button class="btn-secondary view-order-pdf" data-order-id="${auftragId}">PDF anzeigen</button>
        </td>
      </tr>
    `;
  }).join('');

  // Attach event listeners to PDF buttons
  document.querySelectorAll('.view-order-pdf').forEach(btn => {
    btn.addEventListener('click', () => {
      alert('PDF-Export wird in einer zukünftigen Version implementiert');
    });
  });
}

function renderInvoices(firmenId) {
  const invoices = getInvoices();
  const customerInvoices = invoices.filter(invoice => invoice.Firma === getCompanyNameByFirmenId(firmenId));
  
  const tbody = document.getElementById('invoicesTableBody');
  if (!tbody) return;

  if (customerInvoices.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; padding: 20px; color: #666;">
          Keine Rechnungen vorhanden.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = customerInvoices.map(invoice => {
    const rechnungId = escapeHtml(invoice.Rechnungs_ID || '');
    const datum = escapeHtml(invoice.Rechnungsdatum || '');
    const ansprechpartner = escapeHtml(invoice.Ansprechpartner || '');
    const projekt = escapeHtml(invoice.Projekt || '');
    const budget = escapeHtml(invoice.Budget || '');
    const auftragId = escapeHtml(invoice.Auftrags_ID || '');

    return `
      <tr>
        <td>${rechnungId}</td>
        <td>${datum}</td>
        <td>${ansprechpartner}</td>
        <td>${projekt}</td>
        <td>${budget}</td>
        <td>${auftragId}</td>
        <td class="actions">
          <button class="btn-secondary view-invoice-pdf" data-invoice-id="${rechnungId}">PDF anzeigen</button>
        </td>
      </tr>
    `;
  }).join('');

  // Attach event listeners to PDF buttons
  document.querySelectorAll('.view-invoice-pdf').forEach(btn => {
    btn.addEventListener('click', () => {
      alert('PDF-Export wird in einer zukünftigen Version implementiert');
    });
  });
}

function getCompanyNameByFirmenId(firmenId) {
  const companies = getCompanies();
  const company = companies.find(c => c.Firmen_ID === firmenId);
  return company ? company.Firma : '';
}
