// JavaScript equivalent of Stuecke.cs logic for the web UI
// Handles dynamic role fields and saving data back into hidden inputs.

(function () {
    const figCount = document.getElementById('FigCount');
    const roleContainer = document.getElementById('roleContainer');
    const rollenBox = document.getElementById('RollenBox');
    const rollenBeschBox = document.getElementById('RollenBeschBox');
    const okButton = document.getElementById('StueckeOK');
    const cancelButton = document.getElementById('Abbrechen');

    function addRolePair(index) {
        const pair = document.createElement('div');
        pair.className = 'role-pair';

        const roleLabel = document.createElement('label');
        roleLabel.textContent = 'Rolle ' + index;
        const roleInput = document.createElement('input');
        roleInput.type = 'text';
        roleInput.className = 'role';

        const descLabel = document.createElement('label');
        descLabel.textContent = 'Beschreibung ' + index;
        const descInput = document.createElement('textarea');
        descInput.rows = 3;
        descInput.className = 'description';

        pair.appendChild(roleLabel);
        pair.appendChild(roleInput);
        pair.appendChild(descLabel);
        pair.appendChild(descInput);
        roleContainer.appendChild(pair);
    }

    function createRoleFields() {
        const parsed = parseInt(figCount.value, 10);
        if (Number.isNaN(parsed)) {
            alert('Bitte geben Sie eine gültige Zahl ein.');
            figCount.value = roleContainer.querySelectorAll('.role-pair').length;
            return;
        }

        const count = parsed;
        const current = roleContainer.querySelectorAll('.role-pair').length;

        if (count < current) {
            const proceed = confirm('Durch die Reduzierung der Anzahl der Rollen werden einige Textfelder entfernt. Möchten Sie fortfahren?');
            if (!proceed) {
                figCount.value = current;
                return;
            }
            while (roleContainer.children.length > count) {
                roleContainer.removeChild(roleContainer.lastChild);
            }
        } else {
            for (let i = current + 1; i <= count; i++) {
                addRolePair(i);
            }
        }
        populateRoleFields();
    }

    function populateRoleFields() {
        const roles = (rollenBox.value || '').split(';');
        const descs = (rollenBeschBox.value || '').split(';');
        const pairs = roleContainer.querySelectorAll('.role-pair');
        pairs.forEach((pair, index) => {
            const roleInput = pair.querySelector('input.role');
            const descInput = pair.querySelector('textarea.description');
            roleInput.value = roles[index] ? roles[index].trim() : '';
            descInput.value = descs[index] ? descs[index].trim() : '';
        });
    }

    function syncFromHidden() {
        const roles = rollenBox.value ? rollenBox.value.split(';') : [];
        const descs = rollenBeschBox.value ? rollenBeschBox.value.split(';') : [];
        const max = Math.max(roles.length, descs.length);
        if (max) {
            figCount.value = max;
            createRoleFields();
        }
    }

    function saveData() {
        const roles = Array.from(roleContainer.querySelectorAll('input.role'));
        const descs = Array.from(roleContainer.querySelectorAll('textarea.description'));
        rollenBox.value = roles.map(r => r.value.trim()).join('; ');
        rollenBeschBox.value = descs.map(d => d.value.trim()).join('; ');
        document.dispatchEvent(new CustomEvent('dataSaved'));
        alert('Daten gespeichert');
    }

    figCount.addEventListener('input', createRoleFields);
    okButton.addEventListener('click', saveData);
    rollenBox.addEventListener('input', syncFromHidden);
    rollenBeschBox.addEventListener('input', syncFromHidden);
    cancelButton.addEventListener('click', () => {
        roleContainer.innerHTML = '';
        figCount.value = '';
        rollenBox.value = '';
        rollenBeschBox.value = '';
    });

    // if hidden fields already have values, populate on load
    if (rollenBox.value || rollenBeschBox.value) {
        figCount.value = Math.max(rollenBox.value.split(';').length, rollenBeschBox.value.split(';').length);
        createRoleFields();
    }
})();
