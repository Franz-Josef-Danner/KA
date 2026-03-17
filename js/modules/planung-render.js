// -----------------------------
// Planung Rendering Module
// -----------------------------
import { getRows, setRows, save } from './planung-state.js';
import { debounce } from '../utils/helpers.js';

export function render() {
  const tbody = document.getElementById('planungTbody');
  const searchInput = document.getElementById('planungSearch');
  if (!tbody) return;

  const q = (searchInput?.value || '').trim().toLowerCase();
  tbody.innerHTML = '';

  const rows = getRows();

  if (rows.length === 0) {
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = 6;
    td.style.textAlign = 'center';
    td.style.padding = '32px';
    td.style.color = '#9ca3af';
    td.textContent = 'Keine Planungseinträge vorhanden. Erstellen Sie zunächst einen Großauftrag.';
    tr.appendChild(td);
    tbody.appendChild(tr);
    return;
  }

  rows.forEach((row, idx) => {
    if (q && !rowMatchesSearch(row, q)) return;

    const tr = document.createElement('tr');
    tr.style.cursor = 'pointer';
    tr.title = 'Doppelklick zum Bearbeiten';

    tr.addEventListener('dblclick', () => {
      window.dispatchEvent(new CustomEvent('openPlanungModal', { detail: { rowIndex: idx } }));
    });

    // Auftrags_ID
    appendTd(tr, row.Auftrags_ID || '—', { fontWeight: '500' });

    // Projekt
    appendTd(tr, row.Projekt || '—');

    // Firma
    appendTd(tr, row.Firma || '—');

    // Abgabedatum
    appendTd(tr, row.Abgabedatum || '—');

    // Drehtage
    appendTd(tr, row.Drehtage || '—', { textAlign: 'center' });

    // Actions
    const act = document.createElement('td');
    act.className = 'actions';

    const editBtn = document.createElement('button');
    editBtn.textContent = '✎';
    editBtn.title = 'Bearbeiten';
    editBtn.className = 'btn-secondary';
    editBtn.addEventListener('click', e => {
      e.stopPropagation();
      window.dispatchEvent(new CustomEvent('openPlanungModal', { detail: { rowIndex: idx } }));
    });
    act.appendChild(editBtn);

    tr.appendChild(act);
    tbody.appendChild(tr);
  });
}

export const debouncedRender = debounce(render, 300);

// ── Helpers ───────────────────────────────────────────────────────────────────

function appendTd(tr, text, styles = {}) {
  const td = document.createElement('td');
  td.textContent = text;
  Object.assign(td.style, styles);
  tr.appendChild(td);
}

function appendTdHtml(tr, html) {
  const td = document.createElement('td');
  td.innerHTML = html;
  tr.appendChild(td);
}

function rowMatchesSearch(row, q) {
  let dailyDetailText = '';
  try {
    const details = JSON.parse(row.DrehtagDetails || '[]');
    if (Array.isArray(details)) {
      dailyDetailText = details
        .map(detail => flattenSearchValues(detail))
        .join(' ');
    }
  } catch {
    dailyDetailText = '';
  }

  const fields = [
    row.Auftrags_ID, row.Projekt, row.Firma,
    row.Notizen, dailyDetailText
  ];
  return fields.some(f => (f || '').toLowerCase().includes(q));
}

function flattenSearchValues(value) {
  if (Array.isArray(value)) {
    return value.map(item => flattenSearchValues(item)).join(' ');
  }

  if (value && typeof value === 'object') {
    return Object.values(value)
      .map(item => flattenSearchValues(item))
      .join(' ');
  }

  return value == null ? '' : String(value);
}
