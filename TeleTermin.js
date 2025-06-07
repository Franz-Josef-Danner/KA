// JavaScript version of TeleTermin.cs logic for the web application

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('teleTerminForm');
    const cancelBtn = document.getElementById('CancelButton');
    const terminBox = document.getElementById('AnrufTerminBox');

    function getParam(name) {
        const params = new URLSearchParams(window.location.search);
        return params.get(name) || '';
    }

    // Prefill fields from URL params
    const tel = getParam('telefon');
    const firma = getParam('firma');
    if (tel) document.getElementById('TelefonBox').value = tel;
    if (firma) document.getElementById('FirmaBox').value = firma;

    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => form.reset());
    }

    if (form) {
        form.addEventListener('submit', async e => {
            e.preventDefault();
            const date = document.getElementById('TerminPicker').value;
            const time = document.getElementById('AnrufZeitBox').value;
            const telefon = document.getElementById('TelefonBox').value;
            const firmaVal = document.getElementById('FirmaBox').value;
            const kommentar = document.getElementById('KommentarBox').value;

            if (terminBox) terminBox.value = `${date} ${time}`;

            try {
                const resp = await fetch('/add-tele-termin', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ firma: firmaVal, telefon, kommentar, date, time })
                });
                if (!resp.ok) throw new Error('Server error');
                alert('Termin wurde erfolgreich hinzugefügt!');
                form.reset();
            } catch (err) {
                alert('Fehler beim Speichern des Termins: ' + err.message);
            }
        });
    }
});
