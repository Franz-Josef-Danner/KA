// -----------------------------
// Personal (Personnel) UI Module
// (Add / Edit Modal)
// -----------------------------
import { DEPARTMENTS, COLUMNS } from './personal-config.js';
import { getRows, newEmptyRow, generateId, updateRow, setRows } from './personal-state.js';
import { sanitizeText } from '../utils/sanitize.js';
import { getDepartmentMinimumRate } from './settings.js';
import { render } from './personal-render.js';

let currentEditIndex = null;
let activeDeptFilter = "";
let activeSearch = "";

// ── Modal helpers ─────────────────────────────────────────────────────────────

function getModal()  { return document.getElementById("personalModal"); }
function getForm()   { return document.getElementById("personalForm"); }
function getTitle()  { return document.getElementById("personalModalTitle"); }

function openModal(rowIndex = null) {
  currentEditIndex = rowIndex;
  const modal = getModal();
  const form  = getForm();
  const title = getTitle();
  if (!modal || !form) return;

  // Populate Department dropdown
  const deptSelect = document.getElementById("pm_Department");
  if (deptSelect) {
    deptSelect.innerHTML = '<option value="">-- Department auswählen --</option>';
    DEPARTMENTS.forEach(d => {
      const opt = document.createElement("option");
      opt.value = d;
      opt.textContent = d;
      deptSelect.appendChild(opt);
    });
  }

  if (rowIndex !== null) {
    // Edit existing
    title.textContent = "Person bearbeiten";
    const row = getRows()[rowIndex];
    if (!row) return;
    COLUMNS.forEach(col => {
      const el = document.getElementById(`pm_${col}`);
      if (el) el.value = row[col] ?? "";
    });
  } else {
    // New entry
    title.textContent = "Person hinzufügen";
    form.reset();
    const idEl = document.getElementById("pm_Personal_ID");
    if (idEl) idEl.value = "";
    // Pre-select active dept filter
    if (activeDeptFilter && deptSelect) deptSelect.value = activeDeptFilter;

    const tagessatzInput = document.getElementById('pm_Tagessatz');
    if (tagessatzInput) {
      tagessatzInput.dataset.manualEdited = 'false';
    }

    applyDepartmentDefaultRate();
  }

  modal.style.display = "flex";
  setTimeout(() => document.getElementById("pm_Vorname")?.focus(), 80);
}

function applyDepartmentDefaultRate() {
  if (currentEditIndex !== null) return;

  const deptSelect = document.getElementById('pm_Department');
  const tagessatzInput = document.getElementById('pm_Tagessatz');
  if (!deptSelect || !tagessatzInput) return;

  const department = sanitizeText(deptSelect.value || '');
  if (!department) return;

  const currentValue = sanitizeText(tagessatzInput.value || '');
  const isManual = tagessatzInput.dataset.manualEdited === 'true';
  if (currentValue && isManual) return;

  const rate = getDepartmentMinimumRate(department);
  if (rate === null || rate === undefined || rate === '') return;

  tagessatzInput.value = String(rate);
  tagessatzInput.dataset.manualEdited = 'false';
}

function closeModal() {
  const modal = getModal();
  if (modal) modal.style.display = "none";
  currentEditIndex = null;
}

// ── Form save ─────────────────────────────────────────────────────────────────

function getField(id) {
  return sanitizeText(document.getElementById(id)?.value || "");
}

function validateAndSave() {
  const vorname   = getField("pm_Vorname");
  const nachname  = getField("pm_Nachname");
  const dept      = getField("pm_Department");
  const telefon   = getField('pm_Telefon');
  const email     = getField('pm_Email');

  if (!vorname.trim()) {
    alert("Bitte geben Sie einen Vornamen ein.");
    document.getElementById("pm_Vorname")?.focus();
    return;
  }
  if (!nachname.trim()) {
    alert("Bitte geben Sie einen Nachnamen ein.");
    document.getElementById("pm_Nachname")?.focus();
    return;
  }
  if (!dept) {
    alert("Bitte wählen Sie ein Department aus.");
    document.getElementById("pm_Department")?.focus();
    return;
  }

  if (!telefon.trim()) {
    alert('Bitte geben Sie eine Telefonnummer ein.');
    document.getElementById('pm_Telefon')?.focus();
    return;
  }

  if (!email.trim()) {
    alert('Bitte geben Sie eine E-Mail-Adresse ein.');
    document.getElementById('pm_Email')?.focus();
    return;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    alert('Bitte geben Sie eine gueltige E-Mail-Adresse ein.');
    document.getElementById('pm_Email')?.focus();
    return;
  }

  const row = {
    Personal_ID: currentEditIndex !== null
      ? (getRows()[currentEditIndex]?.Personal_ID || generateId())
      : generateId(),
    Vorname:    vorname,
    Nachname:   nachname,
    Department: dept,
    Rolle:      getField("pm_Rolle"),
    Telefon:    getField("pm_Telefon"),
    Email:      getField("pm_Email"),
    Tagessatz:  getField("pm_Tagessatz"),
    Kommentare: getField("pm_Kommentare"),
  };

  if (currentEditIndex !== null) {
    updateRow(currentEditIndex, row);
  } else {
    const rows = getRows();
    rows.push(row);
    setRows(rows);
  }

  closeModal();
  render(activeDeptFilter, activeSearch);
}

// ── Event wiring ──────────────────────────────────────────────────────────────

export function initPersonalUI(deptFilterGetter, searchGetter) {
  // Keep references to getters so modal knows current filter state
  activeDeptFilter = deptFilterGetter();
  activeSearch     = searchGetter();

  document.getElementById("newPersonalBtn")
    ?.addEventListener("click", () => {
      activeDeptFilter = deptFilterGetter();
      activeSearch     = searchGetter();
      openModal(null);
    });

  document.getElementById('pm_Department')
    ?.addEventListener('change', () => {
      applyDepartmentDefaultRate();
    });

  document.getElementById('pm_Tagessatz')
    ?.addEventListener('input', event => {
      const input = event.target;
      if (!(input instanceof HTMLInputElement)) return;
      input.dataset.manualEdited = sanitizeText(input.value || '') ? 'true' : 'false';
    });

  document.getElementById("personalModalClose")
    ?.addEventListener("click", closeModal);
  document.getElementById("personalModalCancel")
    ?.addEventListener("click", closeModal);
  document.getElementById("personalModalSave")
    ?.addEventListener("click", validateAndSave);

  // Close on backdrop click
  document.getElementById("personalModal")
    ?.addEventListener("click", e => {
      if (e.target === document.getElementById("personalModal")) closeModal();
    });

  // Double-click on row → edit
  document.getElementById("personalTbody")
    ?.addEventListener("dblclick", e => {
      const tr = e.target.closest("tr[data-idx]");
      if (tr) {
        activeDeptFilter = deptFilterGetter();
        activeSearch     = searchGetter();
        openModal(parseInt(tr.dataset.idx, 10));
      }
    });

  // Enter key in form (except textarea) saves
  document.getElementById("personalForm")
    ?.addEventListener("keydown", e => {
      if (e.key === "Enter" && e.target.tagName !== "TEXTAREA") {
        e.preventDefault();
        validateAndSave();
      }
    });
}

export { openModal, closeModal };
