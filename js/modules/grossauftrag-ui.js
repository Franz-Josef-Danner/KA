// -----------------------------
// Großauftrag UI
// -----------------------------
import { getRows, setRows, save } from './auftraege-state.js';
import { sanitizeText } from '../utils/sanitize.js';
import { getCustomerDisplayName } from '../utils/helpers.js';
import {
  ensureInitialized as ensurePlanungInitialized,
  getRows as getPlanungRows,
  setRows as setPlanungRows,
  save as savePlanung,
  createPlanungFromGrossauftrag
} from './planung-state.js';

// Storage key prefix used to distinguish Großaufträge from regular orders
const GROSSAUFTRAG_PREFIX = "GA-";
let currentGrossauftragEditIndex = null;

// ── Helpers ──────────────────────────────────────────────────────────────────

function getCustomerCompanies() {
  try {
    const raw = localStorage.getItem("firmen_tabelle_v1");
    if (!raw) return [];
    const companies = JSON.parse(raw);
    if (!Array.isArray(companies)) return [];
    return companies
      .filter(c => c.Status === "Kunde")
      .map(c => ({
        Firmen_ID: c.Firmen_ID || "",
        Firma: getCustomerDisplayName(c),
        Titel: c.Titel || "",
        Vorname: c.Vorname || "",
        Nachname: c.Nachname || "",
        Persoenlich: c["Persönlich"] || "",
        Tell: c.Tell || "",
        Adresse: c.Adresse || "",
        "E-mail": c["E-mail"] || "",
      }))
      .sort((a, b) => a.Firma.localeCompare(b.Firma));
  } catch (e) {
    console.error("Error loading customer companies:", e);
    return [];
  }
}

function getCompanyByName(name) {
  return getCustomerCompanies().find(c => c.Firma === name) || null;
}

function buildCompanyContactName(company) {
  if (!company) return "";
  const parts = [company.Titel, company.Vorname, company.Nachname]
    .map(value => (typeof value === "string" ? value.trim() : ""))
    .filter(Boolean);
  if (parts.length > 0) return parts.join(" ");
  return typeof company.Persoenlich === "string" ? company.Persoenlich.trim() : "";
}

function buildCompanyContactInfo(company) {
  if (!company) return "";
  const phone = typeof company.Tell === "string" ? company.Tell.trim() : "";
  const email = typeof company["E-mail"] === "string" ? company["E-mail"].trim() : "";
  if (phone && email) return `${phone} | ${email}`;
  return phone || email || "";
}

function applyCompanyContactToForm(companyName) {
  const company = getCompanyByName(companyName);
  const ansprechpartnerInput = document.getElementById("ga_Ansprechpartner");
  const kontaktInput = document.getElementById("ga_AnsprechpartnerKontakt");
  if (!ansprechpartnerInput || !kontaktInput) return;

  ansprechpartnerInput.value = buildCompanyContactName(company);
  kontaktInput.value = buildCompanyContactInfo(company);
}

function toDateStr(date) {
  return (
    date.getFullYear().toString() +
    (date.getMonth() + 1).toString().padStart(2, "0") +
    date.getDate().toString().padStart(2, "0")
  );
}

function generateGrossauftragId(firmaName) {
  const company = getCompanyByName(firmaName);
  const dateStr = toDateStr(new Date());
  const base = company && company.Firmen_ID
    ? `${GROSSAUFTRAG_PREFIX}${company.Firmen_ID}-${dateStr}`
    : `${GROSSAUFTRAG_PREFIX}${dateStr}`;
  const rows = getRows();
  const existing = rows.filter(r => r.Auftrags_ID && r.Auftrags_ID.startsWith(base));
  const seq = (existing.length + 1).toString().padStart(3, "0");
  return `${base}-${seq}`;
}

// ── Dropdown population ───────────────────────────────────────────────────────

function populateFirmaDropdown() {
  const select = document.getElementById("ga_Firma");
  if (!select) return;
  select.innerHTML = '<option value="">-- Firma auswählen --</option>';
  getCustomerCompanies().forEach(company => {
    const opt = document.createElement("option");
    opt.value = company.Firma;
    opt.textContent = company.Firma;
    select.appendChild(opt);
  });
}

// ── Modal open / close ────────────────────────────────────────────────────────

export function openGrossauftragModal(rowIndex = null) {
  const modal = document.getElementById("grossauftragModal");
  if (!modal) return;

  currentGrossauftragEditIndex = rowIndex;
  const form = document.getElementById("grossauftragForm");
  const title = document.getElementById("grossauftragModalTitle");
  const saveBtn = document.getElementById("grossauftragModalSave");
  if (form) form.reset();

  populateFirmaDropdown();
  const drehtageInput = document.getElementById('ga_Drehtage');

  if (rowIndex === null) {
    if (title) title.textContent = "Großauftrag erstellen";
    if (saveBtn) saveBtn.textContent = "Großauftrag speichern";

    const datumInput = document.getElementById("ga_Auftragsdatum");
    if (datumInput) datumInput.value = new Date().toISOString().split("T")[0];

    const idInput = document.getElementById("ga_Auftrags_ID");
    if (idInput) idInput.value = "";

    if (drehtageInput) {
      drehtageInput.disabled = false;
      drehtageInput.title = '';
      drehtageInput.value = '1';
    }
  } else {
    if (title) title.textContent = "Großauftrag bearbeiten";
    if (saveBtn) saveBtn.textContent = "Änderungen speichern";
    populateGrossauftragForm(getRows()[rowIndex] || {});
  }

  modal.style.display = "flex";

  setTimeout(() => document.getElementById("ga_Projekt")?.focus(), 100);
}

function closeGrossauftragModal() {
  const modal = document.getElementById("grossauftragModal");
  if (modal) modal.style.display = "none";
  currentGrossauftragEditIndex = null;
}

function populateGrossauftragForm(row) {
  const map = {
    ga_Auftrags_ID: "Auftrags_ID",
    ga_Auftragsdatum: "Auftragsdatum",
    ga_Firma: "Firma",
    ga_Ansprechpartner: "Ansprechpartner",
    ga_AnsprechpartnerKontakt: "AnsprechpartnerKontakt",
    ga_Projekt: "Projekt",
    ga_Projekttyp: "Projekttyp",
    ga_Drehtage: "Drehtage",
    ga_Abgabedatum: "Abgabedatum",
    ga_Budget: "Budget",
    ga_Rabatt: "Rabatt",
    ga_Beschreibung: "Beschreibung",
    ga_Kommentare: "Kommentare",
  };

  Object.entries(map).forEach(([id, field]) => {
    const el = document.getElementById(id);
    if (el) el.value = row?.[field] || "";
  });

  applyCompanyContactToForm(row?.Firma || "");

  const drehtageInput = document.getElementById('ga_Drehtage');
  if (drehtageInput) {
    // After initial creation, Drehtage are managed only from the planning page.
    drehtageInput.disabled = true;
    drehtageInput.title = 'Drehtage werden nach Erstellung über die Planungsseite verwaltet.';
  }
}

async function syncLinkedPlanungEntry(formData, oldOrderId = '') {
  await ensurePlanungInitialized();
  const planungRows = getPlanungRows();

  const lookupId = oldOrderId || formData.Auftrags_ID;
  const existingIndex = planungRows.findIndex(item => item.Auftrags_ID === lookupId);

  if (existingIndex === -1) {
    const newPlanungEntry = createPlanungFromGrossauftrag(formData);
    planungRows.unshift(newPlanungEntry);
  } else {
    const existing = planungRows[existingIndex] || {};
    planungRows[existingIndex] = {
      ...existing,
      Auftrags_ID: formData.Auftrags_ID || existing.Auftrags_ID || '',
      Projekt: formData.Projekt || existing.Projekt || '',
      Firma: formData.Firma || existing.Firma || '',
      Abgabedatum: formData.Abgabedatum || existing.Abgabedatum || '',
      Drehtage: formData.Drehtage || existing.Drehtage || '',
    };
  }

  setPlanungRows(planungRows);
  await savePlanung();
}

// ── Form data collection ──────────────────────────────────────────────────────

function getFormData() {
  const get = id => sanitizeText(document.getElementById(id)?.value || "");
  const firma = get("ga_Firma");
  const company = getCompanyByName(firma);
  const drehtageRaw = get('ga_Drehtage');
  const drehtageParsed = parseInt(drehtageRaw, 10);
  const normalizedDrehtage = Number.isFinite(drehtageParsed) && drehtageParsed >= 1
    ? String(drehtageParsed)
    : '1';

  return {
    // Section 1 – Projekt Basis
    Auftrags_ID:            get("ga_Auftrags_ID"),
    Auftragsdatum:          get("ga_Auftragsdatum"),
    Firma:                  firma,
    Firmenadresse:          company?.Adresse || "",
    Firmen_Email:           company?.["E-mail"] || "",
    Ansprechpartner:        get("ga_Ansprechpartner"),
    AnsprechpartnerKontakt: get("ga_AnsprechpartnerKontakt"),
    Projekt:                get("ga_Projekt"),
    Projekttyp:             get("ga_Projekttyp"),
    // Section 2 – Zeit & Deadlines
    Drehtage:               normalizedDrehtage,
    Abgabedatum:            get("ga_Abgabedatum"),
    // Optional / system
    Budget:                 get("ga_Budget"),
    Rabatt:                 get("ga_Rabatt"),
    Beschreibung:           get("ga_Beschreibung"),
    Kommentare:             get("ga_Kommentare"),
    Artikel:                "",
    Status:                 "in Arbeit",
    items:                  [],
    istGrossauftrag:        true,
  };
}

// ── Validation ────────────────────────────────────────────────────────────────

/** Returns true on success, false on failure (shows alert + focuses invalid field). */
function validateForm() {
  const checks = [
    // Section 1
    ["ga_Projekt",                "Bitte geben Sie einen Projektnamen ein."],
    ["ga_Firma",                  "Bitte wählen Sie eine Firma aus."],
    ["ga_Ansprechpartner",        "Bitte geben Sie den Ansprechpartner-Namen ein."],
    ["ga_AnsprechpartnerKontakt", "Bitte geben Sie den Kontakt des Ansprechpartners ein (Telefon oder E-Mail)."],
    ["ga_Projekttyp",             "Bitte wählen Sie einen Projekttyp aus."],
    // Section 2
    ["ga_Abgabedatum",            "Bitte geben Sie ein Abgabedatum ein."],
  ];

  for (const [id, msg] of checks) {
    const el = document.getElementById(id);
    if (!el || !el.value.trim()) {
      alert(msg);
      el?.focus();
      return false;
    }
  }

  return true;
}

// ── Save ──────────────────────────────────────────────────────────────────────

async function saveGrossauftrag() {
  if (!validateForm()) return;

  const drehtageInput = document.getElementById('ga_Drehtage');
  if (drehtageInput) {
    const drehtageVal = parseInt(drehtageInput.value, 10);
    if (!Number.isFinite(drehtageVal) || drehtageVal < 1) {
      drehtageInput.value = '1';
    }
  }

  const idInput = document.getElementById("ga_Auftrags_ID");
  if (idInput && !idInput.value) {
    const firma = document.getElementById("ga_Firma")?.value || "";
    idInput.value = generateGrossauftragId(firma);
  }

  const formData = getFormData();
  const rows = getRows();

  if (currentGrossauftragEditIndex === null) {
    // Prepend to match the behaviour of standard new-order creation (most recent first)
    rows.unshift(formData);
  } else {
    const existing = rows[currentGrossauftragEditIndex] || {};
    const previousId = existing.Auftrags_ID || '';
    rows[currentGrossauftragEditIndex] = {
      ...existing,
      ...formData,
      istGrossauftrag: true,
      items: Array.isArray(existing.items) ? existing.items : [],
    };
    await syncLinkedPlanungEntry(rows[currentGrossauftragEditIndex], previousId);
  }

  setRows(rows);
  await save();

  if (currentGrossauftragEditIndex === null) {
    await syncLinkedPlanungEntry(formData);
  }

  window.dispatchEvent(new Event("ordersChanged"));
  window.dispatchEvent(new Event("planungChanged"));
  closeGrossauftragModal();
}

// ── Discard confirmation ──────────────────────────────────────────────────────

/**
 * Ask the user what to do when trying to leave the modal with unsaved data.
 * Returns true if the modal was ultimately closed (user discarded or saved),
 * false if the user chose to stay.
 */
async function confirmDiscard() {
  // Build a modal-style in-page dialog instead of browser confirm() so it
  // respects the same visual style and can offer a "Speichern" shortcut.
  return new Promise(resolve => {
    // Reuse an existing overlay if one exists (e.g. double-click of close btn)
    const existing = document.getElementById("gaDiscardDialog");
    if (existing) { existing.remove(); }

    const overlay = document.createElement("div");
    overlay.id = "gaDiscardDialog";
    overlay.style.cssText =
      "position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:10001;" +
      "display:flex;align-items:center;justify-content:center;";

    const box = document.createElement("div");
    box.style.cssText =
      "background:#fff;border-radius:12px;padding:28px 32px;max-width:380px;width:90%;" +
      "box-shadow:0 8px 32px rgba(0,0,0,.22);text-align:center;";

    box.innerHTML =
      `<p style="font-size:15px;font-weight:600;color:#1f2937;margin:0 0 8px;">Großauftrag verlassen?</p>` +
      `<p style="font-size:13px;color:#6b7280;margin:0 0 20px;">` +
      `Nicht gespeicherte Eingaben gehen verloren.</p>` +
      `<div style="display:flex;gap:10px;justify-content:center;">` +
      `<button id="gaDiscardStay"  style="padding:8px 18px;border-radius:6px;border:1.5px solid #d1d5db;background:#fff;font-size:13px;cursor:pointer;font-weight:600;color:#374151;">Weiterarbeiten</button>` +
      `<button id="gaDiscardSave"  style="padding:8px 18px;border-radius:6px;border:none;background:linear-gradient(135deg,#7c3aed,#5b21b6);color:#fff;font-size:13px;cursor:pointer;font-weight:600;">Speichern</button>` +
      `<button id="gaDiscardLeave" style="padding:8px 18px;border-radius:6px;border:none;background:#ef4444;color:#fff;font-size:13px;cursor:pointer;font-weight:600;">Verwerfen</button>` +
      `</div>`;

    overlay.appendChild(box);
    document.body.appendChild(overlay);

    document.getElementById("gaDiscardStay").addEventListener("click", () => {
      overlay.remove();
      resolve(false);
    });

    document.getElementById("gaDiscardSave").addEventListener("click", async () => {
      // Remove the dialog overlay first so the user can see the form and any
      // validation error highlights that saveGrossauftrag() may surface.
      overlay.remove();
      await saveGrossauftrag();
      // saveGrossauftrag closes the modal on success; if it stays open, validation
      // failed and the user should fix the form — so we resolve(false) to keep it open.
      const modalStillOpen =
        document.getElementById("grossauftragModal")?.style.display !== "none";
      resolve(!modalStillOpen);
    });

    document.getElementById("gaDiscardLeave").addEventListener("click", () => {
      overlay.remove();
      closeGrossauftragModal();
      resolve(true);
    });
  });
}

// ── Event wiring ──────────────────────────────────────────────────────────────

function initGrossauftragHandlers() {
  document.getElementById("newGrossauftragBtn")
    ?.addEventListener("click", () => openGrossauftragModal());

  const drehtageInput = document.getElementById('ga_Drehtage');
  if (drehtageInput) {
    drehtageInput.addEventListener('blur', () => {
      if (drehtageInput.disabled) return;
      const val = parseInt(drehtageInput.value, 10);
      if (!Number.isFinite(val) || val < 1) {
        drehtageInput.value = '1';
      }
    });
  }

  window.addEventListener('openGrossauftragModal', event => {
    const rowIndex = Number.isInteger(event?.detail?.rowIndex) ? event.detail.rowIndex : null;
    openGrossauftragModal(rowIndex);
  });

  // ✕ close button → ask first
  document.getElementById("grossauftragModalClose")
    ?.addEventListener("click", () => confirmDiscard());

  // "Abbrechen" button → ask first
  document.getElementById("grossauftragModalCancel")
    ?.addEventListener("click", () => confirmDiscard());

  document.getElementById("grossauftragModalSave")
    ?.addEventListener("click", async () => saveGrossauftrag());

  // Backdrop click: intentionally does nothing (data-loss prevention)

  // Auto-generate ID when Firma changes
  document.getElementById("ga_Firma")
    ?.addEventListener("change", () => {
      const idInput = document.getElementById("ga_Auftrags_ID");
      const firma = document.getElementById("ga_Firma")?.value || "";
      if (idInput) idInput.value = firma ? generateGrossauftragId(firma) : "";
      applyCompanyContactToForm(firma);
    });

  // Enter key in form (except textarea) submits
  document.getElementById("grossauftragForm")
    ?.addEventListener("keydown", async e => {
      if (e.key === "Enter" && e.target.tagName !== "TEXTAREA") {
        e.preventDefault();
        await saveGrossauftrag();
      }
    });
}

initGrossauftragHandlers();
