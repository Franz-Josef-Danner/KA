// -----------------------------
// Großauftrag UI
// -----------------------------
import { getRows, setRows, save, newEmptyRow } from './auftraege-state.js';
import { sanitizeText } from '../utils/sanitize.js';
import { getCustomerDisplayName } from '../utils/helpers.js';

// Storage key prefix used to distinguish Großaufträge from regular orders
const GROSSAUFTRAG_PREFIX = "GA-";

// Helper: get companies with "Kunde" status from firmenliste
function getCustomerCompanies() {
  try {
    const firmenData = localStorage.getItem("firmen_tabelle_v1");
    if (!firmenData) return [];

    const companies = JSON.parse(firmenData);
    if (!Array.isArray(companies)) return [];

    return companies
      .filter(company => company.Status === "Kunde")
      .map(company => ({
        Firmen_ID: company.Firmen_ID || "",
        Firma: getCustomerDisplayName(company),
        Adresse: company.Adresse || "",
        "E-mail": company["E-mail"] || "",
      }))
      .sort((a, b) => a.Firma.localeCompare(b.Firma));
  } catch (error) {
    console.error("Error loading customer companies:", error);
    return [];
  }
}

// Helper: get company by display name
function getCompanyByName(firmaName) {
  return getCustomerCompanies().find(c => c.Firma === firmaName) || null;
}

// Generate a compact YYYYMMDD string for a given Date
function toDateStr(date) {
  return (
    date.getFullYear().toString() +
    (date.getMonth() + 1).toString().padStart(2, "0") +
    date.getDate().toString().padStart(2, "0")
  );
}

// Generate a Großauftrag ID
function generateGrossauftragId(firmaName) {
  const company = getCompanyByName(firmaName);
  const dateStr = toDateStr(new Date());

  const base = company && company.Firmen_ID
    ? `${GROSSAUFTRAG_PREFIX}${company.Firmen_ID}-${dateStr}`
    : `${GROSSAUFTRAG_PREFIX}${dateStr}`;

  // Count existing Großaufträge with the same prefix today to generate sequence
  const rows = getRows();
  const existing = rows.filter(r => r.Auftrags_ID && r.Auftrags_ID.startsWith(base));
  const seq = (existing.length + 1).toString().padStart(3, "0");

  return `${base}-${seq}`;
}

// Populate the Firma dropdown
function populateFirmaDropdown() {
  const select = document.getElementById("ga_Firma");
  if (!select) return;

  select.innerHTML = '<option value="">-- Firma auswählen --</option>';
  const companies = getCustomerCompanies();
  companies.forEach(company => {
    const option = document.createElement("option");
    option.value = company.Firma;
    option.textContent = company.Firma;
    select.appendChild(option);
  });
}

// Open the Großauftrag modal and reset form
export function openGrossauftragModal() {
  const modal = document.getElementById("grossauftragModal");
  if (!modal) return;

  // Reset form
  const form = document.getElementById("grossauftragForm");
  if (form) form.reset();

  // Populate Firma dropdown
  populateFirmaDropdown();

  // Set today as default date
  const datumInput = document.getElementById("ga_Auftragsdatum");
  if (datumInput) {
    datumInput.value = new Date().toISOString().split("T")[0];
  }

  // Clear the generated ID (will be set when Firma is chosen)
  const idInput = document.getElementById("ga_Auftrags_ID");
  if (idInput) idInput.value = "";

  modal.style.display = "flex";

  // Focus the Firma select
  setTimeout(() => {
    const firmaSelect = document.getElementById("ga_Firma");
    if (firmaSelect) firmaSelect.focus();
  }, 100);
}

// Close the Großauftrag modal
function closeGrossauftragModal() {
  const modal = document.getElementById("grossauftragModal");
  if (modal) modal.style.display = "none";
}

// Collect form data
function getFormData() {
  const get = id => sanitizeText(document.getElementById(id)?.value || "");
  const firma = get("ga_Firma");
  const company = getCompanyByName(firma);

  return {
    Auftrags_ID: get("ga_Auftrags_ID"),
    Auftragsdatum: get("ga_Auftragsdatum"),
    Firma: firma,
    Firmenadresse: company?.Adresse || "",
    Firmen_Email: company?.["E-mail"] || "",
    Ansprechpartner: get("ga_Ansprechpartner"),
    Beschreibung: get("ga_Beschreibung"),
    Budget: get("ga_Budget"),
    Projekt: get("ga_Projekt"),
    Kommentare: get("ga_Kommentare"),
    Laufzeit: get("ga_Laufzeit"),
    Rabatt: get("ga_Rabatt"),
    Artikel: "",
    Status: "in Arbeit",
    items: [],
    istGrossauftrag: true,
  };
}

// Validate the form
function validateForm() {
  const firma = document.getElementById("ga_Firma")?.value || "";
  if (!firma) {
    alert("Bitte wählen Sie eine Firma aus.");
    document.getElementById("ga_Firma")?.focus();
    return false;
  }
  return true;
}

// Save the Großauftrag
async function saveGrossauftrag() {
  if (!validateForm()) return;

  // Ensure ID is set
  const idInput = document.getElementById("ga_Auftrags_ID");
  if (idInput && !idInput.value) {
    const firma = document.getElementById("ga_Firma")?.value || "";
    idInput.value = generateGrossauftragId(firma);
  }

  const formData = getFormData();
  const rows = getRows();
  // Prepend to match the behaviour of standard new-order creation (most recent first)
  rows.unshift(formData);
  setRows(rows);
  await save();

  window.dispatchEvent(new Event("ordersChanged"));
  closeGrossauftragModal();
}

// Wire up event handlers
function initGrossauftragHandlers() {
  // Button in .bar to open modal
  const openBtn = document.getElementById("newGrossauftragBtn");
  if (openBtn) {
    openBtn.addEventListener("click", () => openGrossauftragModal());
  }

  // Close button (×)
  const closeBtn = document.getElementById("grossauftragModalClose");
  if (closeBtn) {
    closeBtn.addEventListener("click", closeGrossauftragModal);
  }

  // Cancel button
  const cancelBtn = document.getElementById("grossauftragModalCancel");
  if (cancelBtn) {
    cancelBtn.addEventListener("click", closeGrossauftragModal);
  }

  // Save button
  const saveBtn = document.getElementById("grossauftragModalSave");
  if (saveBtn) {
    saveBtn.addEventListener("click", async () => {
      await saveGrossauftrag();
    });
  }

  // Close when clicking the backdrop
  const modal = document.getElementById("grossauftragModal");
  if (modal) {
    modal.addEventListener("click", e => {
      if (e.target === modal) closeGrossauftragModal();
    });
  }

  // Auto-generate ID when Firma is selected
  const firmaSelect = document.getElementById("ga_Firma");
  if (firmaSelect) {
    firmaSelect.addEventListener("change", () => {
      const idInput = document.getElementById("ga_Auftrags_ID");
      if (idInput) {
        idInput.value = firmaSelect.value
          ? generateGrossauftragId(firmaSelect.value)
          : "";
      }
    });
  }

  // Enter key in form (except textarea) submits
  const form = document.getElementById("grossauftragForm");
  if (form) {
    form.addEventListener("keydown", async e => {
      if (e.key === "Enter" && e.target.tagName !== "TEXTAREA") {
        e.preventDefault();
        await saveGrossauftrag();
      }
    });
  }
}

initGrossauftragHandlers();
