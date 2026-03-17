// -----------------------------
// Planung UI – Edit Modal
// -----------------------------
import { getRows, setRows, save } from './planung-state.js';
import {
  ensureInitialized as ensureAuftraegeInitialized,
  getRows as getAuftraegeRows,
  setRows as setAuftraegeRows,
  save as saveAuftraege,
} from './auftraege-state.js';
import { getRows as getPersonalRows } from './personal-state.js';
import { BESTAETIGT_OPTIONS } from './planung-config.js';
import { sanitizeText } from '../utils/sanitize.js';
import { DEPARTMENTS } from './personal-config.js';

let currentEditIndex = null;
let currentDrehtagDetailIndex = null;
let currentDrehortDetailIndex = null;
let currentDrehtagDetails = [];
let currentTalentPool = [];
let currentAssignedTalents = [];
let currentDepartmentAssignments = [];
let currentDepartmentSelection = '';
const geocodeCache = new Map();
let ausweichDatePickers = [];

const LOCATION_DETAIL_FIELDS = [
  'Adresse',
  'AnzahlFahrzeuge',
  'ParkplatzAdresse',
  'DrehortTyp',
  'InterviewEnthalten',
  'BRollBenoetigt',
  'Drohne',
  'TonaufnahmeNotwendig',
  'KameraSetup',
  'LichtLevel',
  'TonLevel',
  'BewegungLevel',
  'LocationBestaetigt',
  'BenoetigteDepartments',
  'DepartmentAssignments',
  'Talente',
];

const EXCLUSIVE_CHECKBOX_OPTIONS = {
  dl_DrehortTyp: ['Innen', 'Außen', 'Beides'],
  dl_InterviewEnthalten: ['Ja', 'Nein'],
  dl_BRollBenoetigt: ['Ja', 'Nein'],
  dl_Drohne: ['Ja', 'Nein'],
  dl_TonaufnahmeNotwendig: ['Ja', 'Nein'],
  dl_KameraSetup: ['Basic', 'Cinema', 'Multi-Cam'],
  dl_LichtLevel: ['kein', 'klein', 'groß'],
  dl_TonLevel: ['minimal', 'standard', 'aufwendig'],
  dl_BewegungLevel: ['statisch', 'Schwenk', 'Gehen', 'komplex'],
  dl_LocationBestaetigt: BESTAETIGT_OPTIONS,
};

const DAILY_DETAIL_FIELDS = [
  'Drehbeginn',
  'Drehende',
  'Drehorte',
  ...LOCATION_DETAIL_FIELDS,
];

const CLEARED_GLOBAL_FIELDS = [
  'Planungsstatus',
  'Verantwortlicher',
  'PersonalZugewiesen',
  'EquipmentBestaetigt',
  'LocationBestaetigt',
  'Drehbeginn',
  'Drehende',
];

export function openPlanungModal(rowIndex) {
  const modal = document.getElementById('planungModal');
  if (!modal) return;

  currentEditIndex = rowIndex;
  currentDrehtagDetailIndex = null;
  currentDrehortDetailIndex = null;
  const rows = getRows();
  const entry = rows[rowIndex] || {};
  currentTalentPool = normalizeTalentPool(entry.TalentPool);

  setValue('pm_Auftrags_ID', entry.Auftrags_ID || '');
  setValue('pm_Projekt', entry.Projekt || '');
  setValue('pm_Firma', entry.Firma || '');
  setValue('pm_Abgabedatum', entry.Abgabedatum || '');
  setValue('pm_Drehtage', entry.Drehtage || '');

  currentDrehtagDetails = normalizeDrehtagDetails(entry);
  if (currentDrehtagDetails.length === 0) {
    currentDrehtagDetails = [createEmptyDrehtagDetail()];
  }
  sortDrehtagDetailsChronologically();
  syncDrehtageCountInModal();
  renderDrehtagCards();
  setTextareaValue('pm_Notizen', entry.Notizen || '');

  modal.style.display = 'flex';
}

function closePlanungModal() {
  closeDrehortDetailModal();
  closeDrehtagDetailModal();
  const modal = document.getElementById('planungModal');
  if (modal) modal.style.display = 'none';
  currentEditIndex = null;
  currentDrehtagDetailIndex = null;
  currentDrehortDetailIndex = null;
  currentDrehtagDetails = [];
  currentTalentPool = [];
  currentAssignedTalents = [];
  destroyAusweichDatePickers();
}

function openDrehtagDetailModal(dayIndex) {
  syncDrehtagCardInputsToState();
  const detail = currentDrehtagDetails[dayIndex];
  if (!detail) return;

  currentDrehtagDetailIndex = dayIndex;
  currentDrehortDetailIndex = null;
  setTextContent('drehtagDetailTitle', `Drehtag ${dayIndex + 1} konfigurieren`);
  setInputValue('dd_Drehbeginn', detail.Drehbeginn || '');
  setInputValue('dd_Drehende', detail.Drehende || '');
  detail.DrehortDetails = normalizeDrehortDetails(detail);
  detail.Drehorte = String(detail.DrehortDetails.length || 1);
  renderDrehortCards();

  updateSunTimesForCurrentDrehtag();

  document.getElementById('drehtagDetailModal').style.display = 'flex';
}

function closeDrehtagDetailModal() {
  closeDrehortDetailModal();
  const modal = document.getElementById('drehtagDetailModal');
  if (modal) modal.style.display = 'none';
  currentDrehtagDetailIndex = null;
}

function openDrehortDetailModal(locationIndex) {
  const detail = getCurrentDrehtagDetail();
  if (!detail) return;

  detail.DrehortDetails = normalizeDrehortDetails(detail);
  const locationDetail = detail.DrehortDetails[locationIndex];
  if (!locationDetail) return;

  currentDrehortDetailIndex = locationIndex;
  setTextContent(
    'drehortDetailTitle',
    `Drehtag ${currentDrehtagDetailIndex + 1} – Drehort ${locationIndex + 1}`
  );
  setInputValue('dl_Adresse', locationDetail.Adresse || '');
  setInputValue('dl_AnzahlFahrzeuge', locationDetail.AnzahlFahrzeuge || '0');
  setInputValue('dl_ParkplatzAdresse', locationDetail.ParkplatzAdresse || '');
  toggleParkplatzField(locationDetail.AnzahlFahrzeuge || '0');
  setExclusiveCheckboxValue('dl_DrehortTyp', locationDetail.DrehortTyp || '');
  setExclusiveCheckboxValue('dl_InterviewEnthalten', locationDetail.InterviewEnthalten || '');
  setExclusiveCheckboxValue('dl_BRollBenoetigt', locationDetail.BRollBenoetigt || '');
  setExclusiveCheckboxValue('dl_Drohne', locationDetail.Drohne || '');
  setExclusiveCheckboxValue('dl_TonaufnahmeNotwendig', locationDetail.TonaufnahmeNotwendig || '');
  setExclusiveCheckboxValue('dl_KameraSetup', locationDetail.KameraSetup || '');
  setExclusiveCheckboxValue('dl_LichtLevel', locationDetail.LichtLevel || '');
  setExclusiveCheckboxValue('dl_TonLevel', locationDetail.TonLevel || '');
  setExclusiveCheckboxValue('dl_BewegungLevel', locationDetail.BewegungLevel || '');
  setExclusiveCheckboxValue('dl_LocationBestaetigt', locationDetail.LocationBestaetigt || 'Ausstehend');
  currentDepartmentAssignments = normalizeDepartmentAssignments(locationDetail);
  currentAssignedTalents = normalizeAssignedTalents(locationDetail.Talente || []);
  renderLocationDepartmentAssignments(locationDetail.BenoetigteDepartments || '', currentDepartmentAssignments);
  renderTalentMiniTable();

  document.getElementById('drehortDetailModal').style.display = 'flex';
}

function closeDrehortDetailModal() {
  closeDepartmentPersonnelModal();
  const modal = document.getElementById('drehortDetailModal');
  if (modal) modal.style.display = 'none';
  currentDrehortDetailIndex = null;
  currentDepartmentAssignments = [];
  currentAssignedTalents = [];
  currentDepartmentSelection = '';
}

function saveDrehtagDetailModal() {
  const detail = getCurrentDrehtagDetail();
  if (!detail) return;

  detail.Drehbeginn = sanitizeText(getInputValue('dd_Drehbeginn'));
  detail.Drehende = sanitizeText(getInputValue('dd_Drehende'));
  detail.DrehortDetails = normalizeDrehortDetails(detail);
  detail.Drehorte = String(detail.DrehortDetails.length || 1);

  closeDrehtagDetailModal();
  renderDrehtagCards();
}

function saveDrehortDetailModal() {
  const detail = getCurrentDrehtagDetail();
  if (!detail || currentDrehortDetailIndex === null) return;

  detail.DrehortDetails = normalizeDrehortDetails(detail);
  const locationDetail = detail.DrehortDetails[currentDrehortDetailIndex];
  if (!locationDetail) return;

  locationDetail.Adresse = sanitizeText(getInputValue('dl_Adresse'));
  locationDetail.AnzahlFahrzeuge = String(resolveVehicleCount(getInputValue('dl_AnzahlFahrzeuge')));
  locationDetail.ParkplatzAdresse = locationDetail.AnzahlFahrzeuge !== '0'
    ? sanitizeText(getInputValue('dl_ParkplatzAdresse'))
    : '';
  locationDetail.DrehortTyp = sanitizeText(getExclusiveCheckboxValue('dl_DrehortTyp'));
  locationDetail.InterviewEnthalten = sanitizeText(getExclusiveCheckboxValue('dl_InterviewEnthalten'));
  locationDetail.BRollBenoetigt = sanitizeText(getExclusiveCheckboxValue('dl_BRollBenoetigt'));
  locationDetail.Drohne = sanitizeText(getExclusiveCheckboxValue('dl_Drohne'));
  locationDetail.TonaufnahmeNotwendig = sanitizeText(getExclusiveCheckboxValue('dl_TonaufnahmeNotwendig'));
  locationDetail.KameraSetup = sanitizeText(getExclusiveCheckboxValue('dl_KameraSetup'));
  locationDetail.LichtLevel = sanitizeText(getExclusiveCheckboxValue('dl_LichtLevel'));
  locationDetail.TonLevel = sanitizeText(getExclusiveCheckboxValue('dl_TonLevel'));
  locationDetail.BewegungLevel = sanitizeText(getExclusiveCheckboxValue('dl_BewegungLevel'));
  locationDetail.LocationBestaetigt = sanitizeText(getExclusiveCheckboxValue('dl_LocationBestaetigt'));
  locationDetail.BenoetigteDepartments = sanitizeText(readSelectedDepartmentList().join(', '));
  locationDetail.DepartmentAssignments = normalizeDepartmentAssignments({
    BenoetigteDepartments: locationDetail.BenoetigteDepartments,
    DepartmentAssignments: currentDepartmentAssignments,
  });
  locationDetail.Talente = normalizeAssignedTalents(currentAssignedTalents);

  closeDrehortDetailModal();
  updateSunTimesForCurrentDrehtag();
  renderDrehortCards();
  renderDrehtagCards();
}

function createEmptyDrehtagDetail() {
  return {
    datum: '',
    Kurzbeschreibung: '',
    ausweichtermine: [],
    Drehbeginn: '',
    Drehende: '',
    Drehorte: '1',
    DrehortDetails: [createLocationDetail()],
  };
}

function syncDrehtageCountInModal() {
  setValue('pm_Drehtage', String(currentDrehtagDetails.length || 0));
}

function addDrehtagDetail() {
  syncDrehtagCardInputsToState();
  currentDrehtagDetails.push(createEmptyDrehtagDetail());
  sortDrehtagDetailsChronologically();
  syncDrehtageCountInModal();
  renderDrehtagCards();
}

function removeDrehtagDetail(dayIndex) {
  if (currentDrehtagDetails.length <= 1) {
    alert('Mindestens ein Drehtag muss vorhanden sein.');
    return;
  }
  if (!Number.isInteger(dayIndex) || dayIndex < 0 || dayIndex >= currentDrehtagDetails.length) return;

  syncDrehtagCardInputsToState();
  currentDrehtagDetails.splice(dayIndex, 1);
  sortDrehtagDetailsChronologically();
  syncDrehtageCountInModal();
  renderDrehtagCards();
}

function normalizeDrehtagDetails(entry) {
  const drehtage = parseInt(entry.Drehtage, 10);
  if (!drehtage || drehtage < 1) return [];

  const legacyDates = parseStringArray(entry.DrehtagDaten);
  const legacyFallbacks = parseStringArray(entry.Ausweichtermine);
  const legacyDetailObjects = parseObjectArray(entry.DrehtagDetails);
  const fallbackSingle = sanitizeText(entry.Ausweichtermin || '');

  return Array.from({ length: drehtage }, (_, index) => {
    const legacyDetail = legacyDetailObjects[index] || {};
    const detail = {
      datum: sanitizeText(legacyDetail.datum || legacyDates[index] || ''),
      Kurzbeschreibung: sanitizeText(legacyDetail.Kurzbeschreibung || ''),
      ausweichtermine: normalizeAusweichtermine(legacyDetail, legacyFallbacks, index, fallbackSingle),
      Drehbeginn: sanitizeText(legacyDetail.Drehbeginn || entry.Drehbeginn || ''),
      Drehende: sanitizeText(legacyDetail.Drehende || entry.Drehende || ''),
      Drehorte: String(resolveLocationCount(legacyDetail.Drehorte || entry.Drehorte || '1')),
      DrehortDetails: [],
    };

    detail.DrehortDetails = normalizeDrehortDetails({
      ...legacyDetail,
      Drehorte: detail.Drehorte,
      DrehortTyp: legacyDetail.DrehortTyp || entry.DrehortTyp || '',
      InterviewEnthalten: legacyDetail.InterviewEnthalten || entry.InterviewEnthalten || '',
      BRollBenoetigt: legacyDetail.BRollBenoetigt || entry.BRollBenoetigt || '',
      Drohne: legacyDetail.Drohne || entry.Drohne || '',
      TonaufnahmeNotwendig: legacyDetail.TonaufnahmeNotwendig || entry.TonaufnahmeNotwendig || '',
      KameraSetup: legacyDetail.KameraSetup || entry.KameraSetup || '',
      LichtLevel: legacyDetail.LichtLevel || entry.LichtLevel || '',
      TonLevel: legacyDetail.TonLevel || entry.TonLevel || '',
      BewegungLevel: legacyDetail.BewegungLevel || entry.BewegungLevel || '',
      LocationBestaetigt: legacyDetail.LocationBestaetigt || entry.LocationBestaetigt || 'Ausstehend',
      BenoetigteDepartments: legacyDetail.BenoetigteDepartments || entry.BenoetigteDepartments || '',
      DepartmentAssignments: legacyDetail.DepartmentAssignments || [],
    });

    return detail;
  });
}

function normalizeAusweichtermine(legacyDetail, legacyFallbacks, index, fallbackSingle) {
  const normalizeList = values => {
    const cleaned = values
      .slice(0, 5)
      .map(value => sanitizeText(value || ''));
    return sortDateStrings(Array.from(new Set(cleaned.filter(Boolean))));
  };

  if (Array.isArray(legacyDetail.ausweichtermine) && legacyDetail.ausweichtermine.length > 0) {
    const arr = normalizeList(legacyDetail.ausweichtermine);
    if (arr.some(Boolean)) return arr;
  }
  if (typeof legacyDetail.ausweichtermine === 'string' && legacyDetail.ausweichtermine.trim()) {
    try {
      const parsed = JSON.parse(legacyDetail.ausweichtermine);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const arr = normalizeList(parsed);
        if (arr.some(Boolean)) return arr;
      }
    } catch { /* ignore */ }
  }
  const single = sanitizeText(
    legacyDetail.ausweichtermin ||
    legacyFallbacks[index] ||
    (index === 0 ? fallbackSingle : '')
  );
  return single ? sortDateStrings([single]) : [];
}

function isValidIsoDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(sanitizeText(value || ''));
}

function compareIsoDates(a, b) {
  const left = sanitizeText(a || '');
  const right = sanitizeText(b || '');
  const leftValid = isValidIsoDate(left);
  const rightValid = isValidIsoDate(right);

  if (leftValid && rightValid) return left.localeCompare(right);
  if (leftValid) return -1;
  if (rightValid) return 1;
  return 0;
}

function sortDateStrings(values) {
  return values.slice().sort((a, b) => compareIsoDates(a, b));
}

function normalizeAusweichtermineForDetail(detail) {
  if (!detail) return;
  const dayDate = sanitizeText(detail.datum || '');
  const unique = new Set();
  const before = JSON.stringify(detail.ausweichtermine);

  detail.ausweichtermine = sortDateStrings((detail.ausweichtermine || []).map(value => sanitizeText(value || '')))
    .filter(value => {
      if (!value)               { console.log(`  [normalize] drop "${value}" (empty)`);             return false; }
      if (value === dayDate)    { console.log(`  [normalize] drop "${value}" (= Drehtag datum)`);  return false; }
      if (unique.has(value))    { console.log(`  [normalize] drop "${value}" (duplicate)`);        return false; }
      unique.add(value);
      return true;
    })
    .slice(0, 5);

  console.log(`[normalize] datum="${dayDate}"  before=${before}  after=${JSON.stringify(detail.ausweichtermine)}`);
}

function sortDrehtagDetailsChronologically() {
  currentDrehtagDetails.forEach(detail => normalizeAusweichtermineForDetail(detail));
  currentDrehtagDetails = currentDrehtagDetails
    .slice()
    .sort((left, right) => compareIsoDates(left?.datum || '', right?.datum || ''));
}

function normalizeTalentEntry(raw) {
  return {
    Art: sanitizeText(raw?.Art || ''),
    Name: sanitizeText(raw?.Name || ''),
    Kontakt: sanitizeText(raw?.Kontakt || ''),
    Adresse: sanitizeText(raw?.Adresse || ''),
    Tagesgage: sanitizeText(raw?.Tagesgage || ''),
  };
}

function normalizeTalentPool(raw) {
  return parseObjectArray(raw)
    .map(item => normalizeTalentEntry(item))
    .filter(item => item.Art || item.Name || item.Kontakt || item.Adresse || item.Tagesgage);
}

function normalizeAssignedTalents(raw) {
  const seen = new Set();
  return parseObjectArray(raw)
    .map(item => ({
      Art: sanitizeText(item?.Art || ''),
      Name: sanitizeText(item?.Name || ''),
    }))
    .filter(item => item.Art && item.Name)
    .filter(item => {
      const key = buildTalentKey(item);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

function buildTalentKey(talent) {
  return `${sanitizeText(talent?.Art || '').toLowerCase()}::${sanitizeText(talent?.Name || '').toLowerCase()}`;
}

function normalizeDrehortDetails(detailLike) {
  const legacyLocationObjects = parseObjectArray(detailLike?.DrehortDetails);
  const count = resolveLocationCount(detailLike?.Drehorte || legacyLocationObjects.length || 1);

  return Array.from({ length: count }, (_, index) => {
    const legacyLocation = legacyLocationObjects[index] || {};
    const fallback = index === 0 ? detailLike || {} : {};
    return createLocationDetail({
      Adresse: legacyLocation.Adresse || fallback.Adresse || '',
      AnzahlFahrzeuge: legacyLocation.AnzahlFahrzeuge || fallback.AnzahlFahrzeuge || '0',
      ParkplatzAdresse: legacyLocation.ParkplatzAdresse || fallback.ParkplatzAdresse || '',
      DrehortTyp: legacyLocation.DrehortTyp || fallback.DrehortTyp || '',
      InterviewEnthalten: legacyLocation.InterviewEnthalten || fallback.InterviewEnthalten || '',
      BRollBenoetigt: legacyLocation.BRollBenoetigt || fallback.BRollBenoetigt || '',
      Drohne: legacyLocation.Drohne || fallback.Drohne || '',
      TonaufnahmeNotwendig: legacyLocation.TonaufnahmeNotwendig || fallback.TonaufnahmeNotwendig || '',
      KameraSetup: legacyLocation.KameraSetup || fallback.KameraSetup || '',
      LichtLevel: legacyLocation.LichtLevel || fallback.LichtLevel || '',
      TonLevel: legacyLocation.TonLevel || fallback.TonLevel || '',
      BewegungLevel: legacyLocation.BewegungLevel || fallback.BewegungLevel || '',
      LocationBestaetigt: legacyLocation.LocationBestaetigt || fallback.LocationBestaetigt || 'Ausstehend',
      BenoetigteDepartments: legacyLocation.BenoetigteDepartments || fallback.BenoetigteDepartments || '',
      DepartmentAssignments: legacyLocation.DepartmentAssignments || fallback.DepartmentAssignments || [],
      Talente: legacyLocation.Talente || fallback.Talente || [],
    });
  });
}

function createLocationDetail(values = {}) {
  return {
    Adresse: sanitizeText(values.Adresse || ''),
    AnzahlFahrzeuge: String(resolveVehicleCount(values.AnzahlFahrzeuge || '0')),
    ParkplatzAdresse: sanitizeText(values.ParkplatzAdresse || ''),
    DrehortTyp: sanitizeText(values.DrehortTyp || ''),
    InterviewEnthalten: sanitizeText(values.InterviewEnthalten || ''),
    BRollBenoetigt: sanitizeText(values.BRollBenoetigt || ''),
    Drohne: sanitizeText(values.Drohne || ''),
    TonaufnahmeNotwendig: sanitizeText(values.TonaufnahmeNotwendig || ''),
    KameraSetup: sanitizeText(values.KameraSetup || ''),
    LichtLevel: sanitizeText(values.LichtLevel || ''),
    TonLevel: sanitizeText(values.TonLevel || ''),
    BewegungLevel: sanitizeText(values.BewegungLevel || ''),
    LocationBestaetigt: sanitizeText(values.LocationBestaetigt || 'Ausstehend'),
    BenoetigteDepartments: sanitizeText(values.BenoetigteDepartments || ''),
    DepartmentAssignments: normalizeDepartmentAssignments(values),
    Talente: normalizeAssignedTalents(values.Talente || []),
  };
}

function normalizeDepartmentAssignments(detailLike) {
  const selectedDepartments = parseDepartmentList(detailLike?.BenoetigteDepartments);
  const assignmentObjects = parseObjectArray(detailLike?.DepartmentAssignments)
    .map(assignment => ({
      Department: sanitizeText(assignment.Department || ''),
      Hauptverantwortlich: normalizePersonSnapshot(assignment.Hauptverantwortlich),
      Assistenz: normalizePersonSnapshotArray(assignment.Assistenz),
    }))
    .filter(assignment => assignment.Department);

  const assignmentMap = new Map(
    assignmentObjects.map(assignment => [assignment.Department, assignment])
  );

  selectedDepartments.forEach(department => {
    if (!assignmentMap.has(department)) {
      assignmentMap.set(department, createEmptyDepartmentAssignment(department));
    }
  });

  return DEPARTMENTS
    .filter(department => assignmentMap.has(department))
    .map(department => assignmentMap.get(department));
}

function createEmptyDepartmentAssignment(department) {
  return {
    Department: sanitizeText(department || ''),
    Hauptverantwortlich: null,
    Assistenz: [],
  };
}

function normalizePersonSnapshot(person) {
  if (!person || typeof person !== 'object') return null;
  const snapshot = {
    Personal_ID: sanitizeText(person.Personal_ID || ''),
    Vorname: sanitizeText(person.Vorname || ''),
    Nachname: sanitizeText(person.Nachname || ''),
    Rolle: sanitizeText(person.Rolle || ''),
    Telefon: sanitizeText(person.Telefon || ''),
    Email: sanitizeText(person.Email || ''),
    Department: sanitizeText(person.Department || ''),
  };
  return snapshot.Personal_ID || snapshot.Vorname || snapshot.Nachname ? snapshot : null;
}

function normalizePersonSnapshotArray(raw) {
  return parseObjectArray(raw)
    .map(item => normalizePersonSnapshot(item))
    .filter(Boolean);
}

function createPersonSnapshot(personRow) {
  return normalizePersonSnapshot(personRow) || null;
}

function getDepartmentAssignment(department) {
  return currentDepartmentAssignments.find(assignment => assignment.Department === department) || null;
}

function upsertDepartmentAssignment(nextAssignment) {
  const filtered = currentDepartmentAssignments.filter(
    assignment => assignment.Department !== nextAssignment.Department
  );
  filtered.push(nextAssignment);
  currentDepartmentAssignments = DEPARTMENTS
    .map(department => filtered.find(assignment => assignment.Department === department))
    .filter(Boolean);
}

function renderLocationDepartmentAssignments(savedDepartmentsRaw, assignmentsRaw) {
  const container = document.getElementById('dl_departments_container');
  if (!container) return;
  container.innerHTML = '';

  const selected = new Set(parseDepartmentList(savedDepartmentsRaw));
  const assignments = normalizeDepartmentAssignments({
    BenoetigteDepartments: savedDepartmentsRaw,
    DepartmentAssignments: assignmentsRaw,
  });
  const assignmentMap = new Map(assignments.map(assignment => [assignment.Department, assignment]));

  DEPARTMENTS.forEach(department => {
    const item = document.createElement('div');
    item.className = 'department-assignment-item';

    const header = document.createElement('div');
    header.className = 'department-assignment-header';

    const toggle = document.createElement('label');
    toggle.className = 'department-assignment-toggle';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.name = 'dl_BenoetigteDepartments';
    checkbox.value = department;
    checkbox.checked = selected.has(department);

    toggle.appendChild(checkbox);
    toggle.appendChild(document.createTextNode(department));
    header.appendChild(toggle);

    const actions = document.createElement('div');
    actions.className = 'department-assignment-actions';

    if (checkbox.checked) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'btn-secondary';
      button.dataset.action = 'open-department-personnel';
      button.dataset.department = department;
      button.textContent = 'Personal auswählen';
      actions.appendChild(button);
    }

    if (actions.childNodes.length > 0) {
      header.appendChild(actions);
    }

    item.appendChild(header);

    const summary = document.createElement('div');
    summary.className = 'department-assignment-summary';
    summary.textContent = checkbox.checked
      ? buildDepartmentAssignmentSummary(assignmentMap.get(department), department)
      : 'Nicht angefordert.';
    item.appendChild(summary);

    container.appendChild(item);
  });
}

function buildDepartmentAssignmentSummary(assignment, department) {
  if (!assignment) return `${department}: Noch keine Person ausgewählt.`;

  const parts = [];
  if (assignment.Hauptverantwortlich) {
    parts.push(`Hauptverantwortlich: ${getPersonDisplayName(assignment.Hauptverantwortlich)}`);
  }
  if (assignment.Assistenz.length > 0) {
    parts.push(`Assistenz: ${assignment.Assistenz.map(person => getPersonDisplayName(person)).join(', ')}`);
  }

  return parts.length > 0 ? parts.join(' | ') : `${department}: Noch keine Person ausgewählt.`;
}

function getPersonDisplayName(person) {
  return [person?.Vorname, person?.Nachname].filter(Boolean).join(' ') || person?.Personal_ID || 'Unbekannt';
}

function readSelectedDepartmentList() {
  return Array.from(document.querySelectorAll('input[name="dl_BenoetigteDepartments"]:checked'))
    .map(input => sanitizeText(input.value))
    .filter(Boolean);
}

function syncDepartmentAssignmentsFromSelection() {
  const selectedDepartments = new Set(readSelectedDepartmentList());
  currentDepartmentAssignments = currentDepartmentAssignments.filter(
    assignment => selectedDepartments.has(assignment.Department)
  );

  selectedDepartments.forEach(department => {
    if (!getDepartmentAssignment(department)) {
      upsertDepartmentAssignment(createEmptyDepartmentAssignment(department));
    }
  });
}

function openDepartmentPersonnelModal(department) {
  currentDepartmentSelection = sanitizeText(department || '');
  if (!currentDepartmentSelection) return;

  renderDepartmentPersonnelPicker();
  document.getElementById('departmentPersonnelModal').style.display = 'flex';
}

function closeDepartmentPersonnelModal() {
  const modal = document.getElementById('departmentPersonnelModal');
  if (modal) modal.style.display = 'none';
  currentDepartmentSelection = '';
}

function renderDepartmentPersonnelPicker() {
  const list = document.getElementById('departmentPersonnelList');
  const title = document.getElementById('departmentPersonnelTitle');
  const hint = document.getElementById('departmentPersonnelHint');
  if (!list || !title || !hint) return;

  const department = currentDepartmentSelection;
  const candidates = getPersonnelCandidatesForDepartment(department);
  const assignment = getDepartmentAssignment(department) || createEmptyDepartmentAssignment(department);
  const selectedIds = new Set(getSelectedPersonIds(assignment));
  const mainId = assignment.Hauptverantwortlich?.Personal_ID || Array.from(selectedIds)[0] || '';

  title.textContent = `${department} – Personal auswählen`;
  hint.textContent = 'Wählen Sie eine oder mehrere Personen aus. Eine ausgewählte Person wird als Hauptverantwortliche festgelegt, alle weiteren automatisch als Assistenz.';
  list.innerHTML = '';

  if (candidates.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'department-assignment-item';
    empty.textContent = 'Für dieses Department ist derzeit keine Person im Bereich Personal hinterlegt.';
    list.appendChild(empty);
    return;
  }

  candidates.forEach(candidate => {
    const item = document.createElement('div');
    item.className = 'personnel-picker-item';

    const head = document.createElement('div');
    head.className = 'personnel-picker-head';

    const content = document.createElement('div');
    const name = document.createElement('div');
    name.className = 'personnel-picker-name';
    name.textContent = getPersonDisplayName(candidate);
    content.appendChild(name);

    const meta = document.createElement('div');
    meta.className = 'personnel-picker-meta';
    meta.textContent = [candidate.Rolle, candidate.Telefon, candidate.Email]
      .filter(Boolean)
      .join(' | ') || 'Keine weiteren Informationen';
    content.appendChild(meta);

    const controls = document.createElement('div');
    controls.className = 'personnel-picker-controls';

    const selectLabel = document.createElement('label');
    selectLabel.className = 'department-assignment-toggle';
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.name = 'dpm_selected';
    checkbox.value = candidate.Personal_ID;
    checkbox.checked = selectedIds.has(candidate.Personal_ID);
    selectLabel.appendChild(checkbox);
    selectLabel.appendChild(document.createTextNode('Auswählen'));

    const leadLabel = document.createElement('label');
    leadLabel.className = 'department-assignment-toggle';
    const radio = document.createElement('input');
    radio.type = 'radio';
    radio.name = 'dpm_main';
    radio.value = candidate.Personal_ID;
    radio.checked = checkbox.checked && candidate.Personal_ID === mainId;
    radio.disabled = !checkbox.checked;
    leadLabel.appendChild(radio);
    leadLabel.appendChild(document.createTextNode('Hauptverantwortlich'));

    controls.appendChild(selectLabel);
    controls.appendChild(leadLabel);
    head.appendChild(content);
    head.appendChild(controls);
    item.appendChild(head);
    list.appendChild(item);
  });

  syncDepartmentPersonnelPickerSelection();
}

function syncDepartmentPersonnelPickerSelection() {
  const checkboxes = Array.from(document.querySelectorAll('input[name="dpm_selected"]'));
  const radios = Array.from(document.querySelectorAll('input[name="dpm_main"]'));
  const selectedCheckboxes = checkboxes.filter(input => input.checked);
  const selectedIds = new Set(selectedCheckboxes.map(input => input.value));

  radios.forEach(radio => {
    radio.disabled = !selectedIds.has(radio.value);
    if (!selectedIds.has(radio.value)) {
      radio.checked = false;
    }
  });

  if (selectedCheckboxes.length > 0 && !radios.some(radio => radio.checked && !radio.disabled)) {
    const firstRadio = radios.find(radio => radio.value === selectedCheckboxes[0].value);
    if (firstRadio) firstRadio.checked = true;
  }
}

function saveDepartmentPersonnelModal() {
  const department = currentDepartmentSelection;
  if (!department) return;

  const candidates = getPersonnelCandidatesForDepartment(department);
  const selectedIds = Array.from(document.querySelectorAll('input[name="dpm_selected"]:checked'))
    .map(input => input.value);
  const selectedCandidates = selectedIds
    .map(id => candidates.find(candidate => candidate.Personal_ID === id))
    .filter(Boolean);

  const selectedMainId = document.querySelector('input[name="dpm_main"]:checked')?.value || selectedIds[0] || '';
  const hauptverantwortlich = selectedCandidates.find(candidate => candidate.Personal_ID === selectedMainId) || null;
  const assistenz = selectedCandidates.filter(candidate => candidate.Personal_ID !== selectedMainId);

  upsertDepartmentAssignment({
    Department: department,
    Hauptverantwortlich: createPersonSnapshot(hauptverantwortlich),
    Assistenz: assistenz.map(candidate => createPersonSnapshot(candidate)).filter(Boolean),
  });

  renderLocationDepartmentAssignments(readSelectedDepartmentList().join(', '), currentDepartmentAssignments);
  closeDepartmentPersonnelModal();
}

function getPersonnelCandidatesForDepartment(department) {
  return getPersonalRows()
    .filter(person => sanitizeText(person.Department) === department)
    .map(person => ({
      Personal_ID: sanitizeText(person.Personal_ID || ''),
      Vorname: sanitizeText(person.Vorname || ''),
      Nachname: sanitizeText(person.Nachname || ''),
      Rolle: sanitizeText(person.Rolle || ''),
      Telefon: sanitizeText(person.Telefon || ''),
      Email: sanitizeText(person.Email || ''),
      Department: sanitizeText(person.Department || ''),
    }))
    .filter(person => person.Personal_ID);
}

function getSelectedPersonIds(assignment) {
  const ids = [];
  if (assignment?.Hauptverantwortlich?.Personal_ID) ids.push(assignment.Hauptverantwortlich.Personal_ID);
  assignment?.Assistenz?.forEach(person => {
    if (person?.Personal_ID) ids.push(person.Personal_ID);
  });
  return ids;
}

function resolveLocationCount(rawValue) {
  const parsed = parseInt(rawValue, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

function resolveVehicleCount(rawValue) {
  const parsed = parseInt(rawValue, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

function toggleParkplatzField(vehicleCountRaw) {
  const group = document.getElementById('dl_parkplatz_group');
  if (!group) return;
  const count = resolveVehicleCount(vehicleCountRaw);
  group.style.display = count >= 1 ? '' : 'none';
  if (count < 1) {
    setInputValue('dl_ParkplatzAdresse', '');
  }
}

function getPrimaryLocationAddress(detail) {
  if (!detail) return '';
  return sanitizeText(detail.DrehortDetails?.[0]?.Adresse || '');
}

function getCurrentDrehtagDetail() {
  if (currentDrehtagDetailIndex === null) return null;
  return currentDrehtagDetails[currentDrehtagDetailIndex] || null;
}

function getBlockedAusweichDates(dayIndex, termIndex = -1) {
  const detail = currentDrehtagDetails[dayIndex];
  const blocked = new Set();
  if (!detail) return blocked;

  const drehtagDate = sanitizeText(detail.datum || '');
  if (drehtagDate) blocked.add(drehtagDate);

  (detail.ausweichtermine || []).forEach((value, index) => {
    const date = sanitizeText(value || '');
    if (index !== termIndex && date) blocked.add(date);
  });

  return blocked;
}

function destroyAusweichDatePickers() {
  ausweichDatePickers.forEach(instance => {
    try {
      instance.destroy();
    } catch {
      // ignore cleanup errors
    }
  });
  ausweichDatePickers = [];
}

function initializeAusweichDatePickers() {
  destroyAusweichDatePickers();

  if (typeof window.flatpickr !== 'function') return;

  Array.from(document.querySelectorAll('.ausweich-date-input')).forEach(input => {
    const dayIndex = parseInt(input.dataset.dayIndex || '', 10);
    const termIndex = parseInt(input.dataset.termIndex || '', 10);
    if (!Number.isInteger(dayIndex) || !Number.isInteger(termIndex)) return;

    const detail = currentDrehtagDetails[dayIndex];
    if (!detail) return;

    const blocked = getBlockedAusweichDates(dayIndex, termIndex);
    const dayDate = sanitizeText(detail.datum || '');
    const picker = window.flatpickr(input, {
      dateFormat: 'Y-m-d',
      allowInput: true,
      disableMobile: true,
      defaultDate: sanitizeText(input.value || '') || undefined,
      disable: [date => {
        const formatted = window.flatpickr.formatDate(date, 'Y-m-d');
        return blocked.has(formatted);
      }],
      onChange: [(selectedDates, dateStr) => {
        // Flatpickr does not fire a native input event on calendar-click selection.
        // Write the chosen date directly into state so rawSync/render can access it.
        const d = currentDrehtagDetails[dayIndex];
        if (!d) return;
        if (!d.ausweichtermine) d.ausweichtermine = [];
        while (d.ausweichtermine.length <= termIndex) d.ausweichtermine.push('');
        d.ausweichtermine[termIndex] = sanitizeText(dateStr || '');
        console.log(`[flatpickr onChange] day[${dayIndex}] term[${termIndex}] = "${dateStr}"`);
      }],
      onOpen: [(_, __, fp) => {
        if (isValidIsoDate(dayDate)) {
          fp.jumpToDate(dayDate, false);
        }
      }],
      onDayCreate: [(_, __, fp, dayElem) => {
        const formatted = window.flatpickr.formatDate(dayElem.dateObj, 'Y-m-d');
        if (dayDate && formatted === dayDate) {
          dayElem.classList.add('flatpickr-day-drehtag-blocked');
          return;
        }
        if (blocked.has(formatted)) {
          dayElem.classList.add('flatpickr-day-ausweich-blocked');
        }
      }],
    });

    ausweichDatePickers.push(picker);
  });
}

function registerAusweichterminAddButtons() {
  document.querySelectorAll('button[data-action="add-ausweichtermin"]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const dayIndex = parseInt(btn.dataset.dayIndex ?? '', 10);
      if (!Number.isInteger(dayIndex)) return;

      // Sync existing input values to state without normalizing (to preserve unsaved dates)
      currentDrehtagDetails.forEach((detail, index) => {
        detail.datum = sanitizeText(getInputValue(`pm_drehtag_${index}`));
        detail.Kurzbeschreibung = sanitizeText(getInputValue(`pm_kurzbeschreibung_${index}`));
        const terms = detail.ausweichtermine || [];
        detail.ausweichtermine = terms.map((_, termIndex) =>
          sanitizeText(getInputValue(`pm_ausweich_${index}_${termIndex}`))
        );
        // Do NOT normalize here – empty strings must survive to keep unsaved rows
      });

      const detail = currentDrehtagDetails[dayIndex];
      if (!detail) return;

      if (!detail.ausweichtermine) detail.ausweichtermine = [];
      if (detail.ausweichtermine.length < 5) {
        detail.ausweichtermine.push('');
        renderDrehtagCards();
      }
    });
  });
}

function renderDrehtagCards() {
  const container = document.getElementById('pm_drehtag_cards');
  if (!container) return;
  container.innerHTML = '';

  syncDrehtageCountInModal();

  if (currentDrehtagDetails.length === 0) {
    container.textContent = '—';
    return;
  }

  currentDrehtagDetails.forEach((detail, index) => {
    const card = document.createElement('div');
    card.className = 'drehtag-plan-card';

    const header = document.createElement('div');
    header.className = 'drehtag-plan-card-header';

    const title = document.createElement('div');
    title.className = 'drehtag-plan-card-title';
    title.textContent = `Drehtag ${index + 1}`;

    const actions = document.createElement('div');
    actions.style.display = 'flex';
    actions.style.gap = '6px';
    actions.style.flexWrap = 'wrap';

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'btn-secondary';
    button.dataset.action = 'open-drehtag-detail';
    button.dataset.dayIndex = String(index);
    button.textContent = 'Tagesdetails bearbeiten';

    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'btn-secondary';
    removeBtn.dataset.action = 'remove-drehtag';
    removeBtn.dataset.dayIndex = String(index);
    removeBtn.textContent = 'Entfernen';

    header.appendChild(title);
    actions.appendChild(button);
    actions.appendChild(removeBtn);
    header.appendChild(actions);
    card.appendChild(header);

    const grid = document.createElement('div');
    grid.className = 'drehtag-plan-grid';

    // Drehtag date
    grid.appendChild(createDrehtagField({
      label: `Drehtag ${index + 1}`,
      id: `pm_drehtag_${index}`,
      field: 'datum',
      value: detail.datum || '',
      dayIndex: index,
    }));

    const kurzWrapper = document.createElement('div');
    kurzWrapper.className = 'form-group';

    const kurzLabel = document.createElement('label');
    kurzLabel.setAttribute('for', `pm_kurzbeschreibung_${index}`);
    kurzLabel.textContent = 'Kurzbeschreibung:';

    const kurzInput = document.createElement('input');
    kurzInput.type = 'text';
    kurzInput.id = `pm_kurzbeschreibung_${index}`;
    kurzInput.value = detail.Kurzbeschreibung || '';
    kurzInput.placeholder = 'z.B. Interview CEO, B-Roll Produktion';
    kurzInput.dataset.dayIndex = String(index);
    kurzInput.dataset.field = 'Kurzbeschreibung';
    kurzInput.style.width = '100%';
    kurzInput.style.boxSizing = 'border-box';

    kurzWrapper.appendChild(kurzLabel);
    kurzWrapper.appendChild(kurzInput);
    kurzWrapper.style.minWidth = '0';
    grid.appendChild(kurzWrapper);

    // Ausweichtermine section (full width)
    const ausweichWrapper = document.createElement('div');
    ausweichWrapper.className = 'form-group';
    ausweichWrapper.style.gridColumn = '1 / -1';

    const ausweichLabel = document.createElement('label');
    ausweichLabel.textContent = 'Ausweichtermine:';
    ausweichWrapper.appendChild(ausweichLabel);

    const ausweichList = document.createElement('div');
    ausweichList.className = 'ausweich-list';
    const terms = detail.ausweichtermine || [];
    terms.forEach((termin, termIndex) => {
      ausweichList.appendChild(createAusweichterminRow(index, termIndex, termin));
    });
    ausweichWrapper.appendChild(ausweichList);

    if (terms.length < 5) {
      const btnWrapper = document.createElement('div');
      btnWrapper.style.marginTop = '8px';
      const addBtn = document.createElement('button');
      addBtn.type = 'button';
      addBtn.className = 'btn-secondary';
      addBtn.id = `add_ausweich_${index}`;
      addBtn.dataset.action = 'add-ausweichtermin';
      addBtn.dataset.dayIndex = String(index);
      addBtn.textContent = '+ Ausweichtermin hinzufügen';
      btnWrapper.appendChild(addBtn);
      ausweichWrapper.appendChild(btnWrapper);
    }

    grid.appendChild(ausweichWrapper);
    card.appendChild(grid);

    const summary = document.createElement('div');
    summary.className = 'drehtag-plan-summary';
    summary.id = `pm_drehtag_summary_${index}`;
    summary.textContent = buildDrehtagSummary(detail);
    card.appendChild(summary);

    container.appendChild(card);
  });

  initializeAusweichDatePickers();
  registerAusweichterminAddButtons();
}

function createAusweichterminRow(dayIndex, termIndex, value) {
  const row = document.createElement('div');
  row.className = 'ausweich-row';

  const input = document.createElement('input');
  input.type = 'text';
  input.id = `pm_ausweich_${dayIndex}_${termIndex}`;
  input.value = value || '';
  input.placeholder = 'JJJJ-MM-TT';
  input.dataset.dayIndex = String(dayIndex);
  input.dataset.field = 'ausweichtermin';
  input.dataset.termIndex = String(termIndex);
  input.className = 'ausweich-date-input';

  const swapBtn = document.createElement('button');
  swapBtn.type = 'button';
  swapBtn.className = 'btn-icon';
  swapBtn.dataset.action = 'swap-ausweichtermin';
  swapBtn.dataset.dayIndex = String(dayIndex);
  swapBtn.dataset.termIndex = String(termIndex);
  swapBtn.title = 'Drehtag- und Ausweichtermin-Datum tauschen';
  swapBtn.innerHTML = '&#8652;';

  const removeBtn = document.createElement('button');
  removeBtn.type = 'button';
  removeBtn.className = 'btn-icon btn-icon-danger';
  removeBtn.dataset.action = 'remove-ausweichtermin';
  removeBtn.dataset.dayIndex = String(dayIndex);
  removeBtn.dataset.termIndex = String(termIndex);
  removeBtn.title = 'Ausweichtermin entfernen';
  removeBtn.innerHTML = '&times;';

  row.appendChild(input);
  row.appendChild(swapBtn);
  row.appendChild(removeBtn);
  return row;
}

function renderDrehortCards() {
  const container = document.getElementById('dd_drehort_cards');
  const detail = getCurrentDrehtagDetail();
  if (!container || !detail) return;

  detail.DrehortDetails = normalizeDrehortDetails(detail);
  detail.Drehorte = String(detail.DrehortDetails.length);
  container.innerHTML = '';

  detail.DrehortDetails.forEach((locationDetail, index) => {
    const card = document.createElement('div');
    card.className = 'subdetail-card';

    const header = document.createElement('div');
    header.className = 'subdetail-card-header';

    const title = document.createElement('div');
    title.className = 'subdetail-card-title';
    title.textContent = `Drehort ${index + 1}`;

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'btn-secondary';
    button.dataset.action = 'open-drehort-detail';
    button.dataset.locationIndex = String(index);
    button.textContent = 'Drehortdetails bearbeiten';

    const moveLeftBtn = document.createElement('button');
    moveLeftBtn.type = 'button';
    moveLeftBtn.className = 'btn-secondary';
    moveLeftBtn.dataset.action = 'move-drehort-up';
    moveLeftBtn.dataset.locationIndex = String(index);
    moveLeftBtn.textContent = '↑';
    moveLeftBtn.title = 'Drehort nach oben verschieben';
    moveLeftBtn.disabled = index === 0;

    const moveRightBtn = document.createElement('button');
    moveRightBtn.type = 'button';
    moveRightBtn.className = 'btn-secondary';
    moveRightBtn.dataset.action = 'move-drehort-down';
    moveRightBtn.dataset.locationIndex = String(index);
    moveRightBtn.textContent = '↓';
    moveRightBtn.title = 'Drehort nach unten verschieben';
    moveRightBtn.disabled = index === detail.DrehortDetails.length - 1;

    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'btn-secondary';
    removeBtn.dataset.action = 'remove-drehort';
    removeBtn.dataset.locationIndex = String(index);
    removeBtn.textContent = 'Entfernen';
    removeBtn.disabled = detail.DrehortDetails.length <= 1;

    header.appendChild(title);
    header.appendChild(button);
    header.appendChild(moveLeftBtn);
    header.appendChild(moveRightBtn);
    header.appendChild(removeBtn);
    card.appendChild(header);

    const summary = document.createElement('div');
    summary.className = 'subdetail-summary';
    summary.textContent = buildDrehortSummary(locationDetail);
    card.appendChild(summary);

    container.appendChild(card);
  });
}

function addDrehortDetail() {
  const detail = getCurrentDrehtagDetail();
  if (!detail) return;

  detail.DrehortDetails = normalizeDrehortDetails(detail);
  detail.DrehortDetails.push(createLocationDetail());
  detail.Drehorte = String(detail.DrehortDetails.length);
  renderDrehortCards();
  renderDrehtagCards();
}

function removeDrehortDetail(locationIndex) {
  const detail = getCurrentDrehtagDetail();
  if (!detail) return;

  detail.DrehortDetails = normalizeDrehortDetails(detail);
  if (!Number.isInteger(locationIndex) || locationIndex < 0 || locationIndex >= detail.DrehortDetails.length) return;
  if (detail.DrehortDetails.length <= 1) {
    alert('Mindestens ein Drehort muss vorhanden sein.');
    return;
  }

  detail.DrehortDetails.splice(locationIndex, 1);
  detail.Drehorte = String(detail.DrehortDetails.length);
  renderDrehortCards();
  renderDrehtagCards();
  updateSunTimesForCurrentDrehtag();
}

function moveDrehortDetail(locationIndex, direction) {
  const detail = getCurrentDrehtagDetail();
  if (!detail) return;

  detail.DrehortDetails = normalizeDrehortDetails(detail);
  if (!Number.isInteger(locationIndex) || locationIndex < 0 || locationIndex >= detail.DrehortDetails.length) return;

  const targetIndex = locationIndex + direction;
  if (targetIndex < 0 || targetIndex >= detail.DrehortDetails.length) return;

  const moved = detail.DrehortDetails[locationIndex];
  detail.DrehortDetails[locationIndex] = detail.DrehortDetails[targetIndex];
  detail.DrehortDetails[targetIndex] = moved;
  detail.Drehorte = String(detail.DrehortDetails.length);

  renderDrehortCards();
  renderDrehtagCards();
  updateSunTimesForCurrentDrehtag();
}

function createDrehtagField({ label, id, field, value, dayIndex }) {
  const wrapper = document.createElement('div');
  wrapper.className = 'form-group';

  const labelEl = document.createElement('label');
  labelEl.setAttribute('for', id);
  labelEl.textContent = `${label}:`;

  const input = document.createElement('input');
  input.type = 'date';
  input.id = id;
  input.value = value;
  input.dataset.dayIndex = String(dayIndex);
  input.dataset.field = field;

  wrapper.appendChild(labelEl);
  wrapper.appendChild(input);
  return wrapper;
}

function buildDrehtagSummary(detail) {
  const parts = [];
  if (detail.Kurzbeschreibung) {
    parts.push(`Kurzbeschreibung: ${detail.Kurzbeschreibung}`);
  }
  const primaryLocation = getPrimaryLocationAddress(detail);
  if (primaryLocation) {
    parts.push(`Hauptdrehort: ${primaryLocation}`);
  }
  if (resolveVehicleCount(detail.AnzahlFahrzeuge) > 0) {
    parts.push(`Fahrzeuge: ${resolveVehicleCount(detail.AnzahlFahrzeuge)}`);
  }
  if (detail.Drehbeginn || detail.Drehende) {
    parts.push(`Zeit: ${detail.Drehbeginn || '—'} bis ${detail.Drehende || '—'}`);
  }
  const validAusweich = (detail.ausweichtermine || []).filter(Boolean);
  if (validAusweich.length > 0) {
    parts.push(`Ausweich: ${validAusweich.join(', ')}`);
  }

  const locationDetails = Array.isArray(detail.DrehortDetails) ? detail.DrehortDetails : [];
  const locationCount = resolveLocationCount(detail.Drehorte || locationDetails.length || 1);
  parts.push(`${locationCount} Drehorte`);

  const locationSummaries = locationDetails
    .map((locationDetail, index) => {
      const summary = buildDrehortSummary(locationDetail, true);
      return summary ? `Drehort ${index + 1}: ${summary}` : '';
    })
    .filter(Boolean);

  parts.push(...locationSummaries.slice(0, 2));
  if (locationSummaries.length > 2) {
    parts.push(`+${locationSummaries.length - 2} weitere Drehorte konfiguriert`);
  }

  return parts.length > 0 ? parts.join(' | ') : 'Noch keine Tagesdetails hinterlegt.';
}

function buildDrehortSummary(locationDetail, compact = false) {
  const parts = [];
  if (locationDetail.Adresse) parts.push(`Adresse: ${locationDetail.Adresse}`);
  if (resolveVehicleCount(locationDetail.AnzahlFahrzeuge) > 0) {
    parts.push(`Fahrzeuge: ${resolveVehicleCount(locationDetail.AnzahlFahrzeuge)}`);
  }
  if (locationDetail.ParkplatzAdresse) parts.push(`Parkplatz: ${locationDetail.ParkplatzAdresse}`);
  if (locationDetail.DrehortTyp) parts.push(locationDetail.DrehortTyp);
  if (locationDetail.InterviewEnthalten) parts.push(`Interview: ${locationDetail.InterviewEnthalten}`);
  if (locationDetail.BRollBenoetigt) parts.push(`B-Roll: ${locationDetail.BRollBenoetigt}`);
  if (locationDetail.Drohne) parts.push(`Drohne: ${locationDetail.Drohne}`);
  if (locationDetail.TonaufnahmeNotwendig) parts.push(`Tonaufnahme: ${locationDetail.TonaufnahmeNotwendig}`);
  if (locationDetail.KameraSetup) parts.push(`Kamera: ${locationDetail.KameraSetup}`);
  if (locationDetail.LichtLevel) parts.push(`Licht: ${locationDetail.LichtLevel}`);
  if (locationDetail.TonLevel) parts.push(`Ton: ${locationDetail.TonLevel}`);
  if (locationDetail.BewegungLevel) parts.push(`Bewegung: ${locationDetail.BewegungLevel}`);
  if (locationDetail.LocationBestaetigt) parts.push(`Location: ${locationDetail.LocationBestaetigt}`);
  if (locationDetail.BenoetigteDepartments) parts.push(`Departments: ${locationDetail.BenoetigteDepartments}`);

  const assignmentSummary = normalizeDepartmentAssignments(locationDetail)
    .map(assignment => {
      const summary = [];
      if (assignment.Hauptverantwortlich) summary.push(`${getPersonDisplayName(assignment.Hauptverantwortlich)} (HV)`);
      if (assignment.Assistenz.length > 0) {
        summary.push(`${assignment.Assistenz.map(person => getPersonDisplayName(person)).join(', ')} (Assistenz)`);
      }
      return summary.length > 0 ? `${assignment.Department}: ${summary.join(', ')}` : '';
    })
    .filter(Boolean);

  if (assignmentSummary.length > 0) {
    parts.push(`Personal: ${assignmentSummary.join(' | ')}`);
  }

  if (parts.length === 0 && compact) return '';
  return parts.length > 0 ? parts.join(' | ') : 'Noch keine Drehortdetails hinterlegt.';
}

// Reads current DOM input values into state WITHOUT normalizing or sorting.
// Use this before index-based operations (remove, swap) to preserve termIndex alignment.
function rawSyncInputsToState() {
  console.group('[rawSync] Syncing DOM → state (no normalize)');
  currentDrehtagDetails.forEach((detail, index) => {
    detail.datum = sanitizeText(getInputValue(`pm_drehtag_${index}`));
    detail.Kurzbeschreibung = sanitizeText(getInputValue(`pm_kurzbeschreibung_${index}`));
    const termsBefore = (detail.ausweichtermine || []).slice();
    const terms = detail.ausweichtermine || [];
    detail.ausweichtermine = terms.map((_, termIndex) => {
      const domVal = sanitizeText(getInputValue(`pm_ausweich_${index}_${termIndex}`));
      console.log(`  [rawSync] day[${index}] term[${termIndex}] DOM="${domVal}" (was state="${termsBefore[termIndex]}")`);
      return domVal;
    });
    console.log(`  [rawSync] day[${index}] ausweichtermine after sync:`, JSON.stringify(detail.ausweichtermine));
  });
  console.groupEnd();
}

function syncDrehtagCardInputsToState() {
  currentDrehtagDetails.forEach((detail, index) => {
    detail.datum = sanitizeText(getInputValue(`pm_drehtag_${index}`));
    detail.Kurzbeschreibung = sanitizeText(getInputValue(`pm_kurzbeschreibung_${index}`));
    const terms = detail.ausweichtermine || [];
    detail.ausweichtermine = terms.map((_, termIndex) =>
      sanitizeText(getInputValue(`pm_ausweich_${index}_${termIndex}`))
    );
    normalizeAusweichtermineForDetail(detail);
  });
  sortDrehtagDetailsChronologically();
}

async function savePlanungEntry() {
  if (currentEditIndex === null) return;

  const rows = getRows();
  if (!rows[currentEditIndex]) return;

  syncDrehtagCardInputsToState();
  sortDrehtagDetailsChronologically();

  const dailyDates = currentDrehtagDetails.map(detail => detail.datum || '');
  const fallbackDates = currentDrehtagDetails.map(detail => (detail.ausweichtermine || [])[0] || '');
  const drehtageCount = String(currentDrehtagDetails.length);

  rows[currentEditIndex].Notizen = sanitizeText(getTextareaValue('pm_Notizen'));
  rows[currentEditIndex].Drehtage = drehtageCount;
  rows[currentEditIndex].DrehtagDaten = JSON.stringify(dailyDates);
  rows[currentEditIndex].Ausweichtermine = JSON.stringify(fallbackDates);
  rows[currentEditIndex].Ausweichtermin = fallbackDates[0] || '';
  rows[currentEditIndex].DrehtagDetails = JSON.stringify(currentDrehtagDetails);
  rows[currentEditIndex].TalentPool = JSON.stringify(currentTalentPool);

  // Legacy top-level fields are cleared because these values are now maintained per Drehtag / Drehort.
  DAILY_DETAIL_FIELDS.forEach(field => {
    rows[currentEditIndex][field] = '';
  });
  CLEARED_GLOBAL_FIELDS.forEach(field => {
    rows[currentEditIndex][field] = '';
  });

  setRows(rows);
  await save();

  await ensureAuftraegeInitialized();
  const auftraegeRows = getAuftraegeRows();
  const rowToSync = rows[currentEditIndex];
  const linkedOrderIndex = auftraegeRows.findIndex(order => order.Auftrags_ID === rowToSync.Auftrags_ID);
  if (linkedOrderIndex !== -1 && auftraegeRows[linkedOrderIndex]?.istGrossauftrag === true) {
    auftraegeRows[linkedOrderIndex] = {
      ...auftraegeRows[linkedOrderIndex],
      Drehtage: drehtageCount,
    };
    setAuftraegeRows(auftraegeRows, true);
    await saveAuftraege();
    window.dispatchEvent(new Event('ordersChanged'));
  }

  window.dispatchEvent(new Event('planungChanged'));
  closePlanungModal();
}

async function updateSunTimesForCurrentDrehtag() {
  const detail = getCurrentDrehtagDetail();
  if (!detail) return;

  const date = sanitizeText(detail.datum || '');
  if (!date) {
    setTextContent('dd_sonnenaufgang', '—');
    setTextContent('dd_sonnenuntergang', '—');
    setTextContent('dd_sonnenaufgang_cet', '—');
    setTextContent('dd_sonnenuntergang_cet', '—');
    setTextContent('dd_sonnen_ref', 'Referenz: bitte zuerst ein Drehtag-Datum setzen');
    return;
  }

  const primaryAddress = getPrimaryLocationAddress(detail);
  const coordinates = await resolveLocationCoordinates(primaryAddress);

  if (!coordinates) {
    setTextContent('dd_sonnenaufgang', '—');
    setTextContent('dd_sonnenuntergang', '—');
    setTextContent('dd_sonnenaufgang_cet', '—');
    setTextContent('dd_sonnenuntergang_cet', '—');
    setTextContent('dd_sonnen_ref', 'Referenz: zuerst den 1. Drehort mit Adresse/Koordinaten definieren');
    return;
  }

  const localTimes = await fetchSunTimesByTimezone(date, coordinates.lat, coordinates.lon);
  if (!localTimes) {
    setTextContent('dd_sonnenaufgang', '—');
    setTextContent('dd_sonnenuntergang', '—');
    setTextContent('dd_sonnenaufgang_cet', '—');
    setTextContent('dd_sonnenuntergang_cet', '—');
    setTextContent('dd_sonnen_ref', 'Referenz: Sonnenzeiten konnten nicht geladen werden');
    return;
  }

  setTextContent('dd_sonnenaufgang', localTimes.sunrise);
  setTextContent('dd_sonnenuntergang', localTimes.sunset);

  const cetSunrise = formatToTimeZone(localTimes.sunriseIso, 'Europe/Berlin');
  const cetSunset = formatToTimeZone(localTimes.sunsetIso, 'Europe/Berlin');
  setTextContent('dd_sonnenaufgang_cet', cetSunrise || '—');
  setTextContent('dd_sonnenuntergang_cet', cetSunset || '—');

  const reference = primaryAddress
    ? `Referenz: Primärer Drehort 1 (${primaryAddress}) [${coordinates.lat.toFixed(4)}, ${coordinates.lon.toFixed(4)}], Zeitzone ${localTimes.timezone || 'lokal'}`
    : `Referenz: Primärer Drehort 1 [${coordinates.lat.toFixed(4)}, ${coordinates.lon.toFixed(4)}], Zeitzone ${localTimes.timezone || 'lokal'}`;
  setTextContent('dd_sonnen_ref', `${reference} | MEZ/MESZ-Referenz aktiv`);
}

async function fetchSunTimesByTimezone(date, lat, lon) {
  const cacheKey = `sun:${date}:${lat.toFixed(5)}:${lon.toFixed(5)}`;
  if (geocodeCache.has(cacheKey)) return geocodeCache.get(cacheKey);

  try {
    const endpoint = `https://api.open-meteo.com/v1/forecast?latitude=${encodeURIComponent(lat)}&longitude=${encodeURIComponent(lon)}&daily=sunrise,sunset&timezone=auto&start_date=${encodeURIComponent(date)}&end_date=${encodeURIComponent(date)}`;
    const response = await fetch(endpoint, { headers: { 'Accept': 'application/json' } });
    if (!response.ok) return null;
    const payload = await response.json();
    const sunriseIso = payload?.daily?.sunrise?.[0];
    const sunsetIso = payload?.daily?.sunset?.[0];
    if (!sunriseIso || !sunsetIso) return null;

    const result = {
      sunrise: formatIsoLocalTime(sunriseIso),
      sunset: formatIsoLocalTime(sunsetIso),
      sunriseIso,
      sunsetIso,
      timezone: payload?.timezone || '',
    };
    geocodeCache.set(cacheKey, result);
    return result;
  } catch {
    return null;
  }
}

function formatIsoLocalTime(isoString) {
  const value = sanitizeText(isoString || '');
  const match = value.match(/T(\d{2}:\d{2})/);
  if (match) return match[1];
  const date = new Date(value);
  if (isNaN(date.getTime())) return '';
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

function formatToTimeZone(isoString, timeZone) {
  if (!isoString || !timeZone) return '';
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return '';

  const formatter = new Intl.DateTimeFormat('de-AT', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone,
  });
  return formatter.format(date);
}

async function resolveLocationCoordinates(input) {
  const value = sanitizeText(input || '');
  if (!value) return null;

  const direct = parseCoordinates(value);
  if (direct) return direct;

  const cacheKey = value.toLowerCase();
  if (geocodeCache.has(cacheKey)) return geocodeCache.get(cacheKey);

  try {
    const endpoint = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(value)}`;
    const response = await fetch(endpoint, {
      headers: {
        'Accept': 'application/json',
      },
    });
    if (!response.ok) return null;
    const payload = await response.json();
    if (!Array.isArray(payload) || payload.length === 0) return null;
    const lat = Number(payload[0].lat);
    const lon = Number(payload[0].lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
    const coords = { lat, lon };
    geocodeCache.set(cacheKey, coords);
    return coords;
  } catch {
    return null;
  }
}

function parseCoordinates(input) {
  const value = sanitizeText(input || '');
  if (!value) return null;

  const directMatch = value.match(/(-?\d{1,2}(?:\.\d+)?)\s*[,; ]\s*(-?\d{1,3}(?:\.\d+)?)/);
  if (directMatch) {
    const lat = Number(directMatch[1]);
    const lon = Number(directMatch[2]);
    if (isValidLatLon(lat, lon)) return { lat, lon };
  }

  const atMatch = value.match(/@(-?\d{1,2}(?:\.\d+)?),(-?\d{1,3}(?:\.\d+)?)/);
  if (atMatch) {
    const lat = Number(atMatch[1]);
    const lon = Number(atMatch[2]);
    if (isValidLatLon(lat, lon)) return { lat, lon };
  }

  const queryMatch = value.match(/[?&](?:q|ll)=(-?\d{1,2}(?:\.\d+)?),(-?\d{1,3}(?:\.\d+)?)/);
  if (queryMatch) {
    const lat = Number(queryMatch[1]);
    const lon = Number(queryMatch[2]);
    if (isValidLatLon(lat, lon)) return { lat, lon };
  }

  return null;
}

function isValidLatLon(lat, lon) {
  return Number.isFinite(lat) && Number.isFinite(lon) && Math.abs(lat) <= 90 && Math.abs(lon) <= 180;
}

function openTalentSettingsModal() {
  renderTalentSettingsTable();
  document.getElementById('talentSettingsModal').style.display = 'flex';
}

function closeTalentSettingsModal() {
  const modal = document.getElementById('talentSettingsModal');
  if (modal) modal.style.display = 'none';
}

function renderTalentSettingsTable() {
  const wrap = document.getElementById('talentSettingsTableWrap');
  if (!wrap) return;
  wrap.innerHTML = '';

  const table = document.createElement('table');
  table.className = 'casting-table';
  table.id = 'talent_settings_table';
  table.innerHTML = '<thead><tr><th>Art des Talents</th><th>Name</th><th>Kontakt</th><th>Adresse</th><th>Tagesgage</th><th></th></tr></thead>';

  const tbody = document.createElement('tbody');
  tbody.id = 'talent_settings_tbody';
  const rows = currentTalentPool.length > 0 ? currentTalentPool : [normalizeTalentEntry({})];
  rows.forEach(row => tbody.appendChild(buildTalentSettingsRow(row)));
  table.appendChild(tbody);
  wrap.appendChild(table);
}

function buildTalentSettingsRow(entry) {
  const tr = document.createElement('tr');
  ['Art', 'Name', 'Kontakt', 'Adresse', 'Tagesgage'].forEach(field => {
    const td = document.createElement('td');
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'casting-field';
    input.dataset.talentField = field;
    input.value = entry[field] || '';
    td.appendChild(input);
    tr.appendChild(td);
  });

  const tdRemove = document.createElement('td');
  const removeBtn = document.createElement('button');
  removeBtn.type = 'button';
  removeBtn.className = 'casting-remove-btn';
  removeBtn.dataset.action = 'remove-talent-settings-row';
  removeBtn.innerHTML = '&times;';
  tdRemove.appendChild(removeBtn);
  tr.appendChild(tdRemove);
  return tr;
}

function readTalentSettingsFromUI() {
  const tbody = document.getElementById('talent_settings_tbody');
  if (!tbody) return [];

  const seen = new Set();
  return Array.from(tbody.querySelectorAll('tr'))
    .map(tr => {
      const entry = {};
      tr.querySelectorAll('input[data-talent-field]').forEach(input => {
        entry[input.dataset.talentField] = sanitizeText(input.value);
      });
      return normalizeTalentEntry(entry);
    })
    .filter(item => item.Art || item.Name || item.Kontakt || item.Adresse || item.Tagesgage)
    .filter(item => {
      const key = buildTalentKey(item);
      if (!item.Art || !item.Name) return true;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

function saveTalentSettingsModal() {
  currentTalentPool = readTalentSettingsFromUI();
  closeTalentSettingsModal();
  renderTalentMiniTable();
}

function renderTalentMiniTable() {
  const container = document.getElementById('dl_talent_mini_table');
  if (!container) return;
  container.innerHTML = '';

  if (currentAssignedTalents.length === 0) {
    const hint = document.createElement('div');
    hint.className = 'location-hint';
    hint.textContent = 'Noch keine Talente zugewiesen.';
    container.appendChild(hint);
    return;
  }

  const table = document.createElement('table');
  table.className = 'casting-table';
  table.innerHTML = '<thead><tr><th>Art</th><th>Name</th><th></th></tr></thead>';

  const tbody = document.createElement('tbody');
  currentAssignedTalents.forEach((talent, index) => {
    const tr = document.createElement('tr');
    const artTd = document.createElement('td');
    artTd.textContent = talent.Art;
    const nameTd = document.createElement('td');
    nameTd.textContent = talent.Name;
    const removeTd = document.createElement('td');
    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'casting-remove-btn';
    removeBtn.dataset.action = 'remove-assigned-talent';
    removeBtn.dataset.talentIndex = String(index);
    removeBtn.innerHTML = '&times;';
    removeTd.appendChild(removeBtn);
    tr.appendChild(artTd);
    tr.appendChild(nameTd);
    tr.appendChild(removeTd);
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  container.appendChild(table);
}

function openTalentPickerModal() {
  const list = document.getElementById('talentPickerList');
  if (!list) return;

  list.innerHTML = '';
  if (currentTalentPool.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'department-assignment-item';
    empty.textContent = 'Noch keine Talente definiert. Bitte zuerst im Bereich "Talent" Talente anlegen.';
    list.appendChild(empty);
    document.getElementById('talentPickerModal').style.display = 'flex';
    return;
  }

  const assignedKeys = new Set(currentAssignedTalents.map(item => buildTalentKey(item)));
  currentTalentPool.forEach((talent, index) => {
    const item = document.createElement('div');
    item.className = 'personnel-picker-item';

    const head = document.createElement('div');
    head.className = 'personnel-picker-head';

    const content = document.createElement('div');
    const name = document.createElement('div');
    name.className = 'personnel-picker-name';
    name.textContent = `${talent.Art || 'Unbekannt'} - ${talent.Name || 'Ohne Namen'}`;
    content.appendChild(name);

    const meta = document.createElement('div');
    meta.className = 'personnel-picker-meta';
    meta.textContent = [talent.Kontakt, talent.Adresse, talent.Tagesgage].filter(Boolean).join(' | ') || 'Keine weiteren Angaben';
    content.appendChild(meta);

    const controls = document.createElement('div');
    controls.className = 'personnel-picker-controls';
    const selectLabel = document.createElement('label');
    selectLabel.className = 'department-assignment-toggle';
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.name = 'talent_picker_selected';
    checkbox.value = String(index);
    checkbox.disabled = assignedKeys.has(buildTalentKey(talent));
    selectLabel.appendChild(checkbox);
    selectLabel.appendChild(document.createTextNode(checkbox.disabled ? 'Bereits zugewiesen' : 'Auswählen'));
    controls.appendChild(selectLabel);

    head.appendChild(content);
    head.appendChild(controls);
    item.appendChild(head);
    list.appendChild(item);
  });

  document.getElementById('talentPickerModal').style.display = 'flex';
}

function closeTalentPickerModal() {
  const modal = document.getElementById('talentPickerModal');
  if (modal) modal.style.display = 'none';
}

function saveTalentPickerModal() {
  const selectedIndices = Array.from(document.querySelectorAll('input[name="talent_picker_selected"]:checked'))
    .map(input => parseInt(input.value, 10))
    .filter(index => Number.isInteger(index) && currentTalentPool[index]);

  const existingKeys = new Set(currentAssignedTalents.map(item => buildTalentKey(item)));
  let duplicateCount = 0;

  selectedIndices.forEach(index => {
    const source = currentTalentPool[index];
    const mapped = {
      Art: sanitizeText(source.Art || ''),
      Name: sanitizeText(source.Name || ''),
    };
    if (!mapped.Art || !mapped.Name) return;
    const key = buildTalentKey(mapped);
    if (existingKeys.has(key)) {
      duplicateCount += 1;
      return;
    }
    existingKeys.add(key);
    currentAssignedTalents.push(mapped);
  });

  currentAssignedTalents = normalizeAssignedTalents(currentAssignedTalents);
  if (duplicateCount > 0) {
    alert(`${duplicateCount} doppelte Talent-Zuweisung(en) wurden übersprungen.`);
  }

  renderTalentMiniTable();
  closeTalentPickerModal();
}

function parseStringArray(raw) {
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.map(item => sanitizeText(item || ''));
  } catch {
    if (typeof raw === 'string' && raw.trim()) return [sanitizeText(raw)];
  }
  return [];
}

function parseObjectArray(raw) {
  if (Array.isArray(raw)) {
    return raw.filter(item => item && typeof item === 'object');
  }

  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.filter(item => item && typeof item === 'object');
  } catch {
    return [];
  }
  return [];
}

function parseDepartmentList(raw) {
  return sanitizeText(raw || '')
    .split(',')
    .map(value => value.trim())
    .filter(Boolean);
}

function setValue(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val || '—';
}

function setTextContent(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

function setInputValue(id, val) {
  const el = document.getElementById(id);
  if (el) el.value = val;
}

function setTextareaValue(id, val) {
  const el = document.getElementById(id);
  if (el) el.value = val;
}

function getInputValue(id) {
  return document.getElementById(id)?.value || '';
}

function getTextareaValue(id) {
  return document.getElementById(id)?.value || '';
}

function buildExclusiveCheckboxGroups() {
  Object.entries(EXCLUSIVE_CHECKBOX_OPTIONS).forEach(([id, options]) => {
    populateExclusiveCheckboxGroup(id, options);
  });
}

function populateExclusiveCheckboxGroup(id, options) {
  const el = document.getElementById(id);
  if (!el) return;
  el.innerHTML = '';
  options.forEach(opt => {
    const label = document.createElement('label');
    label.className = 'exclusive-checkbox-option';

    const input = document.createElement('input');
    input.type = 'checkbox';
    input.name = `${id}_choice`;
    input.value = opt;
    input.dataset.exclusiveGroup = id;

    label.appendChild(input);
    label.appendChild(document.createTextNode(opt));
    el.appendChild(label);
  });
}

function setExclusiveCheckboxValue(id, value) {
  const container = document.getElementById(id);
  if (!container) return;
  const targetValue = sanitizeText(value || '');
  container.querySelectorAll('input[type="checkbox"]').forEach(input => {
    input.checked = targetValue !== '' && input.value === targetValue;
  });
}

function getExclusiveCheckboxValue(id) {
  const container = document.getElementById(id);
  if (!container) return '';
  const checked = container.querySelector('input[type="checkbox"]:checked');
  return checked?.value || '';
}

function handleExclusiveCheckboxToggle(input) {
  if (!(input instanceof HTMLInputElement)) return;
  const groupId = input.dataset.exclusiveGroup;
  if (!groupId || !input.checked) return;
  document.querySelectorAll(`input[data-exclusive-group="${groupId}"]`).forEach(other => {
    if (other !== input) other.checked = false;
  });
}

export function initPlanungModalHandlers() {
  buildExclusiveCheckboxGroups();

  document.getElementById('planungModalClose')
    ?.addEventListener('click', closePlanungModal);

  document.getElementById('planungModalCancel')
    ?.addEventListener('click', closePlanungModal);

  document.getElementById('planungModalSave')
    ?.addEventListener('click', () => savePlanungEntry());

  document.getElementById('planungTalentBtn')
    ?.addEventListener('click', openTalentSettingsModal);

  document.getElementById('planungAddDrehtagBtn')
    ?.addEventListener('click', addDrehtagDetail);

  document.getElementById('pm_drehtag_cards')
    ?.addEventListener('click', event => {
      const btn = event.target.closest('button[data-action]');
      if (!btn) return;
      const action = btn.dataset.action;
      const dayIndex = parseInt(btn.dataset.dayIndex ?? '', 10);

      if (action === 'open-drehtag-detail') {
        openDrehtagDetailModal(dayIndex);
        return;
      }

      if (action === 'remove-drehtag') {
        removeDrehtagDetail(dayIndex);
        return;
      }

      if (action === 'add-ausweichtermin') {
        syncDrehtagCardInputsToState();
        const detail = currentDrehtagDetails[dayIndex];
        if (!detail) return;
        if (!detail.ausweichtermine) detail.ausweichtermine = [];
        if (detail.ausweichtermine.length < 5) {
          detail.ausweichtermine.push('');
          normalizeAusweichtermineForDetail(detail);
          renderDrehtagCards();
        }
        return;
      }

      if (action === 'remove-ausweichtermin') {
        const termIndex = parseInt(btn.dataset.termIndex ?? '', 10);
        console.group(`[remove-ausweichtermin] dayIndex=${dayIndex}  termIndex=${termIndex}`);
        console.log('  State BEFORE rawSync:', JSON.stringify((currentDrehtagDetails[dayIndex]||{}).ausweichtermine));
        rawSyncInputsToState();
        const detail = currentDrehtagDetails[dayIndex];
        console.log('  State AFTER rawSync: ', JSON.stringify(detail?.ausweichtermine));
        if (!detail || !detail.ausweichtermine) { console.error('  detail or ausweichtermine missing!'); console.groupEnd(); return; }
        console.log(`  Splicing index ${termIndex} from:`, JSON.stringify(detail.ausweichtermine));
        detail.ausweichtermine.splice(termIndex, 1);
        console.log('  After splice (no normalize – empty placeholders kept):', JSON.stringify(detail.ausweichtermine));
        console.groupEnd();
        // Do NOT normalize here – empty placeholder rows must survive until save.
        renderDrehtagCards();
        return;
      }

      if (action === 'swap-ausweichtermin') {
        const termIndex = parseInt(btn.dataset.termIndex ?? '', 10);
        // Raw sync for same reason – termIndex must match the pre-sort order.
        rawSyncInputsToState();
        const detail = currentDrehtagDetails[dayIndex];
        if (!detail || !detail.ausweichtermine) return;
        const ausweichDate = detail.ausweichtermine[termIndex] || '';
        const drehtageDate = detail.datum || '';
        detail.ausweichtermine[termIndex] = drehtageDate;
        detail.datum = ausweichDate;
        normalizeAusweichtermineForDetail(detail);
        sortDrehtagDetailsChronologically();
        renderDrehtagCards();
        return;
      }
    });

  document.getElementById('pm_drehtag_cards')
    ?.addEventListener('input', event => {
      const input = event.target;
      if (!(input instanceof HTMLInputElement)) return;
      const dayIndex = parseInt(input.dataset.dayIndex || '', 10);
      if (!Number.isInteger(dayIndex) || !currentDrehtagDetails[dayIndex]) return;
      const field = input.dataset.field;
      if (field === 'datum') {
        currentDrehtagDetails[dayIndex].datum = sanitizeText(input.value);
        normalizeAusweichtermineForDetail(currentDrehtagDetails[dayIndex]);
        sortDrehtagDetailsChronologically();
        renderDrehtagCards();
        if (dayIndex === currentDrehtagDetailIndex) {
          updateSunTimesForCurrentDrehtag();
        }
        return;
      } else if (field === 'Kurzbeschreibung') {
        currentDrehtagDetails[dayIndex].Kurzbeschreibung = sanitizeText(input.value);
      } else if (field === 'ausweichtermin') {
        // Only write the typed value to state. Do NOT normalize (filters empty strings)
        // and do NOT re-render (would destroy the focused input on every keystroke).
        // Normalization and re-render happen on save and on explicit actions (remove/swap).
        const termIndex = parseInt(input.dataset.termIndex || '0', 10);
        if (!currentDrehtagDetails[dayIndex].ausweichtermine) {
          currentDrehtagDetails[dayIndex].ausweichtermine = [];
        }
        while (currentDrehtagDetails[dayIndex].ausweichtermine.length <= termIndex) {
          currentDrehtagDetails[dayIndex].ausweichtermine.push('');
        }
        currentDrehtagDetails[dayIndex].ausweichtermine[termIndex] = sanitizeText(input.value);
        return;
      }
      const summary = document.getElementById(`pm_drehtag_summary_${dayIndex}`);
      if (summary) summary.textContent = buildDrehtagSummary(currentDrehtagDetails[dayIndex]);
    });

  document.getElementById('dd_add_drehort_btn')
    ?.addEventListener('click', addDrehortDetail);

  document.getElementById('dd_drehort_cards')
    ?.addEventListener('click', event => {
      const button = event.target.closest('button[data-action]');
      if (!button) return;
      const locationIndex = parseInt(button.dataset.locationIndex || '', 10);

      if (button.dataset.action === 'open-drehort-detail') {
        openDrehortDetailModal(locationIndex);
        return;
      }
      if (button.dataset.action === 'move-drehort-up') {
        moveDrehortDetail(locationIndex, -1);
        return;
      }
      if (button.dataset.action === 'move-drehort-down') {
        moveDrehortDetail(locationIndex, 1);
        return;
      }
      if (button.dataset.action === 'remove-drehort') {
        removeDrehortDetail(locationIndex);
      }
    });

  document.getElementById('drehortDetailModal')
    ?.addEventListener('change', event => {
      const input = event.target;
      if (!(input instanceof HTMLInputElement) || input.type !== 'checkbox') return;
      if (input.dataset.exclusiveGroup) {
        handleExclusiveCheckboxToggle(input);
      }
    });

  document.getElementById('dl_departments_container')
    ?.addEventListener('change', event => {
      const input = event.target;
      if (!(input instanceof HTMLInputElement) || input.name !== 'dl_BenoetigteDepartments') return;
      syncDepartmentAssignmentsFromSelection();
      renderLocationDepartmentAssignments(readSelectedDepartmentList().join(', '), currentDepartmentAssignments);
    });

  document.getElementById('dl_departments_container')
    ?.addEventListener('click', event => {
      const button = event.target.closest('button[data-action="open-department-personnel"]');
      if (!button) return;
      openDepartmentPersonnelModal(button.dataset.department || '');
    });

  document.getElementById('dl_add_talent_assignment_btn')
    ?.addEventListener('click', openTalentPickerModal);

  document.getElementById('drehortDetailModal')
    ?.addEventListener('click', event => {
      const button = event.target.closest('button[data-action="remove-assigned-talent"]');
      if (!button) return;
      const talentIndex = parseInt(button.dataset.talentIndex || '', 10);
      if (!Number.isInteger(talentIndex) || !currentAssignedTalents[talentIndex]) return;
      currentAssignedTalents.splice(talentIndex, 1);
      renderTalentMiniTable();
    });

  document.getElementById('drehortDetailModal')
    ?.addEventListener('input', event => {
      const input = event.target;
      if (!(input instanceof HTMLInputElement)) return;
      if (input.id === 'dl_AnzahlFahrzeuge') {
        toggleParkplatzField(input.value);
      }
      if (input.id === 'dl_Adresse' && currentDrehortDetailIndex === 0) {
        const detail = getCurrentDrehtagDetail();
        if (detail) {
          detail.DrehortDetails[0].Adresse = sanitizeText(input.value);
          updateSunTimesForCurrentDrehtag();
        }
      }
    });

  document.getElementById('drehtagDetailClose')
    ?.addEventListener('click', closeDrehtagDetailModal);

  document.getElementById('drehtagDetailCancel')
    ?.addEventListener('click', closeDrehtagDetailModal);

  document.getElementById('drehtagDetailSave')
    ?.addEventListener('click', saveDrehtagDetailModal);

  document.getElementById('drehortDetailClose')
    ?.addEventListener('click', closeDrehortDetailModal);

  document.getElementById('drehortDetailCancel')
    ?.addEventListener('click', closeDrehortDetailModal);

  document.getElementById('drehortDetailSave')
    ?.addEventListener('click', saveDrehortDetailModal);

  document.getElementById('departmentPersonnelClose')
    ?.addEventListener('click', closeDepartmentPersonnelModal);

  document.getElementById('departmentPersonnelCancel')
    ?.addEventListener('click', closeDepartmentPersonnelModal);

  document.getElementById('departmentPersonnelSave')
    ?.addEventListener('click', saveDepartmentPersonnelModal);

  document.getElementById('departmentPersonnelList')
    ?.addEventListener('change', event => {
      const input = event.target;
      if (!(input instanceof HTMLInputElement)) return;
      if (input.name === 'dpm_selected' || input.name === 'dpm_main') {
        syncDepartmentPersonnelPickerSelection();
      }
    });

  document.getElementById('talentSettingsTableWrap')
    ?.addEventListener('click', event => {
      const button = event.target.closest('button[data-action="remove-talent-settings-row"]');
      if (!button) return;
      const tbody = document.getElementById('talent_settings_tbody');
      if (!tbody) return;
      const tr = button.closest('tr');
      if (tr && tbody.rows.length > 1) tr.remove();
    });

  document.getElementById('talentSettingsAddRow')
    ?.addEventListener('click', () => {
      const tbody = document.getElementById('talent_settings_tbody');
      if (!tbody) return;
      tbody.appendChild(buildTalentSettingsRow(normalizeTalentEntry({})));
    });

  document.getElementById('talentSettingsSave')
    ?.addEventListener('click', saveTalentSettingsModal);

  document.getElementById('talentSettingsCancel')
    ?.addEventListener('click', closeTalentSettingsModal);

  document.getElementById('talentSettingsClose')
    ?.addEventListener('click', closeTalentSettingsModal);

  document.getElementById('talentPickerAdd')
    ?.addEventListener('click', saveTalentPickerModal);

  document.getElementById('talentPickerCancel')
    ?.addEventListener('click', closeTalentPickerModal);

  document.getElementById('talentPickerClose')
    ?.addEventListener('click', closeTalentPickerModal);

  document.getElementById('planungModal')
    ?.addEventListener('click', event => {
      if (event.target === document.getElementById('planungModal')) {
        closePlanungModal();
      }
    });

  document.getElementById('drehtagDetailModal')
    ?.addEventListener('click', event => {
      if (event.target === document.getElementById('drehtagDetailModal')) {
        closeDrehtagDetailModal();
      }
    });

  document.getElementById('drehortDetailModal')
    ?.addEventListener('click', event => {
      if (event.target === document.getElementById('drehortDetailModal')) {
        closeDrehortDetailModal();
      }
    });

  document.getElementById('departmentPersonnelModal')
    ?.addEventListener('click', event => {
      if (event.target === document.getElementById('departmentPersonnelModal')) {
        closeDepartmentPersonnelModal();
      }
    });

  document.getElementById('talentSettingsModal')
    ?.addEventListener('click', event => {
      if (event.target === document.getElementById('talentSettingsModal')) {
        closeTalentSettingsModal();
      }
    });

  document.getElementById('talentPickerModal')
    ?.addEventListener('click', event => {
      if (event.target === document.getElementById('talentPickerModal')) {
        closeTalentPickerModal();
      }
    });

  document.addEventListener('keydown', event => {
    const talentPickerModal = document.getElementById('talentPickerModal');
    if (event.key === 'Escape' && talentPickerModal && talentPickerModal.style.display !== 'none') {
      closeTalentPickerModal();
      return;
    }

    const talentSettingsModal = document.getElementById('talentSettingsModal');
    if (event.key === 'Escape' && talentSettingsModal && talentSettingsModal.style.display !== 'none') {
      closeTalentSettingsModal();
      return;
    }

    const departmentModal = document.getElementById('departmentPersonnelModal');
    if (event.key === 'Escape' && departmentModal && departmentModal.style.display !== 'none') {
      closeDepartmentPersonnelModal();
      return;
    }

    const locationModal = document.getElementById('drehortDetailModal');
    if (event.key === 'Escape' && locationModal && locationModal.style.display !== 'none') {
      closeDrehortDetailModal();
      return;
    }

    const detailModal = document.getElementById('drehtagDetailModal');
    if (event.key === 'Escape' && detailModal && detailModal.style.display !== 'none') {
      closeDrehtagDetailModal();
      return;
    }

    const modal = document.getElementById('planungModal');
    if (event.key === 'Escape' && modal && modal.style.display !== 'none') {
      closePlanungModal();
    }
  });

  window.addEventListener('openPlanungModal', event => {
    openPlanungModal(event.detail.rowIndex);
  });
}
