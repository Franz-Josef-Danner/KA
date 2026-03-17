// -----------------------------
// Großauftrag UI
// -----------------------------
import { getRows, setRows, save } from './auftraege-state.js';
import { sanitizeText } from '../utils/sanitize.js';
import { getCustomerDisplayName } from '../utils/helpers.js';

// Storage key prefix used to distinguish Großaufträge from regular orders
const GROSSAUFTRAG_PREFIX = "GA-";

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

// ── Drehtag date-picker list ──────────────────────────────────────────────────

/**
 * Render N date-picker inputs inside #ga_drehtag_list.
 * Existing values are preserved when re-rendering (e.g. user changed count).
 */
function renderDrehtagList(count, existingDates = []) {
  const container = document.getElementById("ga_drehtag_list");
  if (!container) return;

  // Collect current values before clearing so we don't lose user input
  const currentValues = Array.from(
    container.querySelectorAll("input[data-drehtag]")
  ).map(i => i.value);

  container.innerHTML = "";

  const n = parseInt(count, 10);
  if (!n || n < 1) return;

  for (let i = 0; i < n; i++) {
    const fg = document.createElement("div");
    fg.className = "form-group ga-drehtag-item";

    const label = document.createElement("label");
    label.setAttribute("for", `ga_drehtag_${i}`);
    label.textContent = `Drehtag ${i + 1}:`;

    const input = document.createElement("input");
    input.type = "date";
    input.id = `ga_drehtag_${i}`;
    input.dataset.drehtag = String(i);
    // Prefer existing user input → then restored values → then provided dates
    input.value = currentValues[i] || existingDates[i] || "";

    fg.appendChild(label);
    fg.appendChild(input);
    container.appendChild(fg);
  }
}

/** Read all Drehtag date values from the dynamic list. Returns an array of strings. */
function readDrehtagDaten() {
  const container = document.getElementById("ga_drehtag_list");
  if (!container) return [];
  return Array.from(container.querySelectorAll("input[data-drehtag]")).map(i => i.value);
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

export function openGrossauftragModal() {
  const modal = document.getElementById("grossauftragModal");
  if (!modal) return;

  const form = document.getElementById("grossauftragForm");
  if (form) form.reset();

  // Clear dynamic drehtag list
  const drehtag_list = document.getElementById("ga_drehtag_list");
  if (drehtag_list) drehtag_list.innerHTML = "";

  populateFirmaDropdown();

  const datumInput = document.getElementById("ga_Auftragsdatum");
  if (datumInput) datumInput.value = new Date().toISOString().split("T")[0];

  const idInput = document.getElementById("ga_Auftrags_ID");
  if (idInput) idInput.value = "";

  modal.style.display = "flex";

  setTimeout(() => document.getElementById("ga_Projekt")?.focus(), 100);
}

function closeGrossauftragModal() {
  const modal = document.getElementById("grossauftragModal");
  if (modal) modal.style.display = "none";
}

// ── Form data collection ──────────────────────────────────────────────────────

function getFormData() {
  const get = id => sanitizeText(document.getElementById(id)?.value || "");
  const firma = get("ga_Firma");
  const company = getCompanyByName(firma);

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
    Drehtage:               get("ga_Drehtage"),
    DrehtagDaten:           JSON.stringify(readDrehtagDaten()),
    Abgabedatum:            get("ga_Abgabedatum"),
    Ausweichtermin:         get("ga_Ausweichtermin"),
    Drehbeginn:             get("ga_Drehbeginn"),
    Drehende:               get("ga_Drehende"),
    // Section 3 – Drehumfang
    Drehorte:               get("ga_Drehorte"),
    DrehortTyp:             get("ga_DrehortTyp"),
    InterviewEnthalten:     get("ga_InterviewEnthalten"),
    BRollBenoetigt:         get("ga_BRollBenoetigt"),
    Drohne:                 get("ga_Drohne"),
    TonaufnahmeNotwendig:   get("ga_TonaufnahmeNotwendig"),
    // Section 4 – Equipment Level
    KameraSetup:            get("ga_KameraSetup"),
    LichtLevel:             get("ga_LichtLevel"),
    TonLevel:               get("ga_TonLevel"),
    BewegungLevel:          get("ga_BewegungLevel"),
    // Optional / system
    Budget:                 get("ga_Budget"),
    Laufzeit:               get("ga_Laufzeit"),
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
    ["ga_Drehtage",               "Bitte geben Sie die Anzahl der Drehtage ein."],
    ["ga_Abgabedatum",            "Bitte geben Sie ein Abgabedatum ein."],
    // Section 3
    ["ga_Drehorte",               "Bitte geben Sie die Anzahl der Drehorte ein."],
    ["ga_DrehortTyp",             "Bitte wählen Sie Innen / Außen / Beides aus."],
    ["ga_InterviewEnthalten",     "Bitte geben Sie an, ob ein Interview enthalten ist."],
    ["ga_BRollBenoetigt",         "Bitte geben Sie an, ob B-Roll benötigt wird."],
    ["ga_Drohne",                 "Bitte geben Sie an, ob eine Drohne eingesetzt wird."],
    ["ga_TonaufnahmeNotwendig",   "Bitte geben Sie an, ob eine Tonaufnahme notwendig ist."],
    // Section 4
    ["ga_KameraSetup",            "Bitte wählen Sie ein Kamera-Setup aus."],
    ["ga_LichtLevel",             "Bitte wählen Sie ein Licht-Level aus."],
    ["ga_TonLevel",               "Bitte wählen Sie ein Ton-Level aus."],
    ["ga_BewegungLevel",          "Bitte wählen Sie ein Bewegungs-Level aus."],
  ];

  for (const [id, msg] of checks) {
    const el = document.getElementById(id);
    if (!el || !el.value.trim()) {
      alert(msg);
      el?.focus();
      return false;
    }
  }

  // Validate Drehtage ≥ 1
  const drehtageVal = parseInt(document.getElementById("ga_Drehtage")?.value, 10);
  if (!drehtageVal || drehtageVal < 1) {
    alert("Die Anzahl der Drehtage muss mindestens 1 betragen.");
    document.getElementById("ga_Drehtage")?.focus();
    return false;
  }

  // Validate Drehorte ≥ 1
  const drehorteVal = parseInt(document.getElementById("ga_Drehorte")?.value, 10);
  if (!drehorteVal || drehorteVal < 1) {
    alert("Die Anzahl der Drehorte muss mindestens 1 betragen.");
    document.getElementById("ga_Drehorte")?.focus();
    return false;
  }

  return true;
}

// ── Save ──────────────────────────────────────────────────────────────────────

async function saveGrossauftrag() {
  if (!validateForm()) return;

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

// ── Event wiring ──────────────────────────────────────────────────────────────

function initGrossauftragHandlers() {
  document.getElementById("newGrossauftragBtn")
    ?.addEventListener("click", () => openGrossauftragModal());

  document.getElementById("grossauftragModalClose")
    ?.addEventListener("click", closeGrossauftragModal);

  document.getElementById("grossauftragModalCancel")
    ?.addEventListener("click", closeGrossauftragModal);

  document.getElementById("grossauftragModalSave")
    ?.addEventListener("click", async () => saveGrossauftrag());

  // Close on backdrop click
  document.getElementById("grossauftragModal")
    ?.addEventListener("click", e => {
      if (e.target === document.getElementById("grossauftragModal")) {
        closeGrossauftragModal();
      }
    });

  // Auto-generate ID when Firma changes
  document.getElementById("ga_Firma")
    ?.addEventListener("change", () => {
      const idInput = document.getElementById("ga_Auftrags_ID");
      const firma = document.getElementById("ga_Firma")?.value || "";
      if (idInput) idInput.value = firma ? generateGrossauftragId(firma) : "";
    });

  // Dynamic Drehtag date pickers: re-render when count changes
  document.getElementById("ga_Drehtage")
    ?.addEventListener("input", e => {
      renderDrehtagList(e.target.value);
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
