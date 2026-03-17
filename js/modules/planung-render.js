// -----------------------------
// Planung Rendering Module
// -----------------------------
import { getRows, setRows, save } from './planung-state.js';
import { debounce } from '../utils/helpers.js';

const STATUS_COLORS = {
  'Offen':           '#f59e0b',
  'In Vorbereitung': '#3b82f6',
  'Bereit':          '#10b981',
  'Abgeschlossen':   '#6b7280',
};

const BESTAETIGT_COLORS = {
  'Ja':          '#10b981',
  'Nein':        '#ef4444',
  'Ausstehend':  '#f59e0b',
};

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
    td.colSpan = 8;
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

    // Planungsstatus
    const statusColor = STATUS_COLORS[row.Planungsstatus] || '#6b7280';
    appendTdHtml(tr,
      `<span style="font-weight:600;color:${statusColor};">${row.Planungsstatus || 'Offen'}</span>`
    );

    // Equipment / Location confirmed
    const eqColor  = BESTAETIGT_COLORS[row.EquipmentBestaetigt] || '#f59e0b';
    const locColor = BESTAETIGT_COLORS[row.LocationBestaetigt]  || '#f59e0b';
    appendTdHtml(tr,
      `<span title="Equipment" style="color:${eqColor};font-size:12px;">Equip: ${row.EquipmentBestaetigt || 'Ausstehend'}</span><br>` +
      `<span title="Location"  style="color:${locColor};font-size:12px;">Loc:   ${row.LocationBestaetigt  || 'Ausstehend'}</span>`
    );

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

    const delBtn = document.createElement('button');
    delBtn.textContent = '−';
    delBtn.title = 'Eintrag löschen';
    delBtn.className = 'danger';
    delBtn.addEventListener('click', e => {
      e.stopPropagation();
      const ok = confirm(`Planungseintrag „${row.Projekt || row.Auftrags_ID}" wirklich löschen?`);
      if (!ok) return;
      const r = getRows();
      r.splice(idx, 1);
      setRows(r);
      save();
      render();
    });
    act.appendChild(delBtn);

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
  const fields = [
    row.Auftrags_ID, row.Projekt, row.Firma,
    row.Planungsstatus, row.Verantwortlicher,
    row.BenoetigteDepartments, row.Notizen
  ];
  return fields.some(f => (f || '').toLowerCase().includes(q));
}
