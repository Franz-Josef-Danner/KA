// -----------------------------
// Planung UI – Edit Modal
// -----------------------------
import { getRows, setRows, save } from './planung-state.js';
import { PLANUNGSSTATUS_OPTIONS, BESTAETIGT_OPTIONS } from './planung-config.js';
import { sanitizeText } from '../utils/sanitize.js';

let currentEditIndex = null;

// ── Open / Close ──────────────────────────────────────────────────────────────

export function openPlanungModal(rowIndex) {
  const modal = document.getElementById('planungModal');
  if (!modal) return;

  currentEditIndex = rowIndex;
  const rows = getRows();
  const entry = rows[rowIndex] || {};

  // Populate read-only info fields
  setValue('pm_Auftrags_ID',   entry.Auftrags_ID   || '');
  setValue('pm_Projekt',       entry.Projekt       || '');
  setValue('pm_Firma',         entry.Firma         || '');
  setValue('pm_Abgabedatum',   entry.Abgabedatum   || '');
  setValue('pm_Drehbeginn',    entry.Drehbeginn    || '');
  setValue('pm_Drehende',      entry.Drehende      || '');
  setValue('pm_Drehtage',      entry.Drehtage      || '');
  setValue('pm_Departments',   entry.BenoetigteDepartments || '');

  // Build drehtag list display
  buildDrehtagDisplay(entry.DrehtagDaten || '');

  // Editable planning fields
  setSelectValue('pm_Planungsstatus', entry.Planungsstatus || 'Offen');
  setValue('pm_Verantwortlicher',  entry.Verantwortlicher  || '');
  setValue('pm_PersonalZugewiesen', entry.PersonalZugewiesen || '');
  setSelectValue('pm_EquipmentBestaetigt', entry.EquipmentBestaetigt || 'Ausstehend');
  setSelectValue('pm_LocationBestaetigt',  entry.LocationBestaetigt  || 'Ausstehend');
  setTextareaValue('pm_Notizen', entry.Notizen || '');

  modal.style.display = 'flex';
}

function closePlanungModal() {
  const modal = document.getElementById('planungModal');
  if (modal) modal.style.display = 'none';
  currentEditIndex = null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function setValue(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val || '—';
}

function setSelectValue(id, val) {
  const el = document.getElementById(id);
  if (el) el.value = val;
}

function setTextareaValue(id, val) {
  const el = document.getElementById(id);
  if (el) el.value = val;
}

function buildDrehtagDisplay(drehtagDatenRaw) {
  const container = document.getElementById('pm_drehtagList');
  if (!container) return;
  container.innerHTML = '';
  let dates = [];
  try { dates = JSON.parse(drehtagDatenRaw); } catch { /* ignore */ }
  if (!Array.isArray(dates) || dates.length === 0) {
    container.textContent = '—';
    return;
  }
  dates.forEach((d, i) => {
    const span = document.createElement('span');
    span.className = 'drehtag-badge';
    span.textContent = `Tag ${i + 1}: ${d || '?'}`;
    container.appendChild(span);
  });
}

// ── Save ──────────────────────────────────────────────────────────────────────

async function savePlanungEntry() {
  if (currentEditIndex === null) return;

  const rows = getRows();
  if (!rows[currentEditIndex]) return;

  rows[currentEditIndex].Planungsstatus      = sanitizeText(getSelectValue('pm_Planungsstatus'));
  rows[currentEditIndex].Verantwortlicher    = sanitizeText(getInputValue('pm_Verantwortlicher'));
  rows[currentEditIndex].PersonalZugewiesen  = sanitizeText(getInputValue('pm_PersonalZugewiesen'));
  rows[currentEditIndex].EquipmentBestaetigt = sanitizeText(getSelectValue('pm_EquipmentBestaetigt'));
  rows[currentEditIndex].LocationBestaetigt  = sanitizeText(getSelectValue('pm_LocationBestaetigt'));
  rows[currentEditIndex].Notizen             = sanitizeText(getTextareaValue('pm_Notizen'));

  setRows(rows);
  await save();

  window.dispatchEvent(new Event('planungChanged'));
  closePlanungModal();
}

function getInputValue(id) {
  return document.getElementById(id)?.value || '';
}

function getSelectValue(id) {
  return document.getElementById(id)?.value || '';
}

function getTextareaValue(id) {
  return document.getElementById(id)?.value || '';
}

// ── Build select options (called once on page load) ───────────────────────────

function buildSelectOptions() {
  populateSelect('pm_Planungsstatus', PLANUNGSSTATUS_OPTIONS);
  populateSelect('pm_EquipmentBestaetigt', BESTAETIGT_OPTIONS);
  populateSelect('pm_LocationBestaetigt',  BESTAETIGT_OPTIONS);
}

function populateSelect(id, options) {
  const el = document.getElementById(id);
  if (!el) return;
  el.innerHTML = '';
  options.forEach(opt => {
    const o = document.createElement('option');
    o.value = opt;
    o.textContent = opt;
    el.appendChild(o);
  });
}

// ── Event Wiring ──────────────────────────────────────────────────────────────

export function initPlanungModalHandlers() {
  buildSelectOptions();

  document.getElementById('planungModalClose')
    ?.addEventListener('click', closePlanungModal);

  document.getElementById('planungModalCancel')
    ?.addEventListener('click', closePlanungModal);

  document.getElementById('planungModalSave')
    ?.addEventListener('click', () => savePlanungEntry());

  // Close on backdrop click
  document.getElementById('planungModal')
    ?.addEventListener('click', e => {
      if (e.target === document.getElementById('planungModal')) {
        closePlanungModal();
      }
    });

  // Escape key closes modal
  document.addEventListener('keydown', e => {
    const modal = document.getElementById('planungModal');
    if (e.key === 'Escape' && modal && modal.style.display !== 'none') {
      closePlanungModal();
    }
  });

  // Listen for table row double-clicks forwarded via custom event
  window.addEventListener('openPlanungModal', e => {
    openPlanungModal(e.detail.rowIndex);
  });
}
