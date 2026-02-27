// -----------------------------
// General Helper Functions
// -----------------------------

/**
 * Returns the display name for a customer/company record.
 * Uses Firma if available; otherwise combines Titel, Vorname and Nachname.
 * @param {Object} customer - A row object with optional Firma, Titel, Vorname, Nachname fields
 * @returns {string}
 */
export function getCustomerDisplayName(customer) {
  if (customer && customer.Firma && customer.Firma.trim()) {
    return customer.Firma.trim();
  }
  const parts = [customer?.Titel, customer?.Vorname, customer?.Nachname].filter(Boolean);
  return parts.join(' ') || 'Unbekannt';
}

export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

export function downloadText(filename, text) {
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
