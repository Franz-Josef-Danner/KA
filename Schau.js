// JavaScript logic derived from Schau.cs
// Handles dynamic Stück and Rollen selection in the web page

// Placeholder data representing Liste.Instance.GetAllStueckeRowData()
const stueckeData = [
    { name: 'Hamlet', rollen: ['Hamlet', 'Ophelia', 'Claudius'] },
    { name: 'Faust', rollen: ['Faust', 'Mephisto', 'Gretchen'] }
];

const panel = document.getElementById('flowLayoutPanel1');
const dataBox = document.getElementById('DataBox');

// add initial event to the "Neues Stück" button
const neuStueckBtn = document.getElementById('NeuStueck');
if (neuStueckBtn) {
    neuStueckBtn.addEventListener('click', () => addMainGroup());
}

function addMainGroup() {
    const count = panel.querySelectorAll('.main-group').length + 1;
    const group = document.createElement('div');
    group.className = 'group-box main-group';

    const label = document.createElement('strong');
    label.textContent = `Stück ${count}`;
    group.appendChild(label);

    const stueckeSelect = document.createElement('select');
    stueckeSelect.className = 'stueckeSelect';
    stueckeSelect.innerHTML = '<option value="">Wählen...</option>';
    stueckeData.forEach((s, i) => {
        const opt = document.createElement('option');
        opt.value = i;
        opt.textContent = s.name;
        stueckeSelect.appendChild(opt);
    });
    group.appendChild(stueckeSelect);

    const addRoleBtn = document.createElement('button');
    addRoleBtn.type = 'button';
    addRoleBtn.textContent = 'Neue Rolle';
    group.appendChild(addRoleBtn);

    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.textContent = 'Löschen';
    group.appendChild(deleteBtn);

    const rolesContainer = document.createElement('div');
    rolesContainer.className = 'roles';
    group.appendChild(rolesContainer);

    stueckeSelect.addEventListener('change', () => {
        rolesContainer.innerHTML = '';
        updateData();
    });

    addRoleBtn.addEventListener('click', () => {
        if (stueckeSelect.selectedIndex <= 0) {
            alert('Bitte wählen Sie ein Stück aus.');
            return;
        }
        addSubGroup(rolesContainer, stueckeSelect.selectedIndex);
    });

    deleteBtn.addEventListener('click', () => {
        panel.removeChild(group);
        updateIndices();
        updateData();
    });

    panel.appendChild(group);
}

function addSubGroup(container, stueckeIndex) {
    const sub = document.createElement('div');
    sub.className = 'sub-group';

    const roleSelect = document.createElement('select');
    roleSelect.innerHTML = '<option value="">Rolle wählen...</option>';
    stueckeData[stueckeIndex].rollen.forEach((r, i) => {
        const opt = document.createElement('option');
        opt.value = i;
        opt.textContent = r;
        roleSelect.appendChild(opt);
    });
    sub.appendChild(roleSelect);

    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.textContent = 'Löschen';
    sub.appendChild(deleteBtn);

    roleSelect.addEventListener('change', updateData);
    deleteBtn.addEventListener('click', () => {
        container.removeChild(sub);
        updateIndices();
        updateData();
    });

    container.appendChild(sub);
    updateIndices();
    updateData();
}

function updateIndices() {
    panel.querySelectorAll('.main-group').forEach((g, idx) => {
        const label = g.querySelector('strong');
        if (label) label.textContent = `Stück ${idx + 1}`;
        g.querySelectorAll('.sub-group').forEach((sub, sidx) => {
            // could number subgroups if needed
        });
    });
}

function updateData() {
    const groups = panel.querySelectorAll('.main-group');
    const result = [];
    groups.forEach(g => {
        const stueckeIndex = g.querySelector('.stueckeSelect').selectedIndex - 1;
        const roles = Array.from(g.querySelectorAll('.sub-group select')).map(s => s.selectedIndex - 1);
        result.push(`[${groups.length};${stueckeIndex};${roles.length};${roles.join(';')}]`);
    });
    dataBox.value = result.join(';');
}

// simple cancel handling
const cancelBtn = document.getElementById('Abbrechen');
if (cancelBtn) {
    cancelBtn.addEventListener('click', () => {
        panel.innerHTML = '<button type="button" id="NeuStueck">Neues Stück</button>';
        dataBox.value = '';
    });
}
