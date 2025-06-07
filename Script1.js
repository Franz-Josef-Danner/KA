window.addEventListener('DOMContentLoaded', function () {
    var sendBtn = document.getElementById('sendButton');
    if (!sendBtn) return;

    sendBtn.addEventListener('click', function () {
        var payload = {
            to: document.getElementById('emailBox').value,
            subject: document.getElementById('betreffTextBox').value,
            body: document.getElementById('emailBodyTextBox').value,
            firma: document.getElementById('firmaBodyTextBox').value,
            telefon: document.getElementById('telefonBodyTextBox').value,
            inhaber: document.getElementById('inhaberBodyTextBox').value,
            adresse: document.getElementById('adresseBodyTextBox').value,
            kommentar: document.getElementById('kommentarBodyTextBox').value
        };

        fetch('/send-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        }).then(resp => {
            if (!resp.ok) throw new Error('Server error');
            return resp.json();
        }).then(data => {
            alert('E-Mail erfolgreich gesendet!');
        }).catch(err => {
            alert('Fehler beim Senden der E-Mail: ' + err.message);
        });
    });
});
window.addEventListener('DOMContentLoaded', function () {
    var mapsBtn = document.getElementById('mapsBtn');
    if (mapsBtn) {
        mapsBtn.addEventListener('click', function () {
            var firma = document.getElementById('firma').value.trim();
            var adresse = document.getElementById('adresse').value.trim();
            if (!firma || !adresse) {
                alert('Firma und Adresse müssen ausgefüllt sein.');
                return;
            }
            var query = encodeURIComponent(firma + ' ' + adresse);
            window.open('https://www.google.com/maps/search/?api=1&query=' + query, '_blank');
        });
    }

    var mailBtn = document.getElementById('mailBtn');
    if (mailBtn) {
        mailBtn.addEventListener('click', function () {
            var email = document.getElementById('email').value.trim();
            var url = 'Email.Designer.html';
            if (email) {
                url += '?email=' + encodeURIComponent(email);
            }
            window.open(url, '_blank');
        });
    }

    var teleBtn = document.getElementById('teleBtn');
    if (teleBtn) {
        teleBtn.addEventListener('click', function () {
            var tel = document.getElementById('telefon').value.trim();
            var firma = document.getElementById('firma').value.trim();
            var url = 'TeleTermin.Designer.html?telefon=' + encodeURIComponent(tel) + '&firma=' + encodeURIComponent(firma);
            window.open(url, '_blank');
        });
    }

    var zeitInput = document.getElementById('zeit');
    var terminDate = document.getElementById('terminDatum');
    var terminField = document.getElementById('termin');

    function formatDate(d) {
        var dateObj = new Date(d);
        if (isNaN(dateObj)) return '';
        var day = String(dateObj.getDate()).padStart(2, '0');
        var month = String(dateObj.getMonth() + 1).padStart(2, '0');
        var year = dateObj.getFullYear();
        return day + '.' + month + '.' + year;
    }

    function updateTermin() {
        if (terminDate && zeitInput && terminField) {
            var dateVal = terminDate.value;
            var timeVal = zeitInput.value;
            if (dateVal && timeVal) {
                terminField.value = formatDate(dateVal) + ' / ' + timeVal;
            }
        }
    }

    if (zeitInput) {
        zeitInput.addEventListener('input', function () {
            var val = zeitInput.value.replace(/[^0-9]/g, '');
            if (val.length >= 3) {
                val = val.substring(0, 2) + ':' + val.substring(2, 4);
            }
            zeitInput.value = val;
            updateTermin();
        });
    }

    if (terminDate) {
        terminDate.addEventListener('change', updateTermin);
    }

    var terminFixBtn = document.getElementById('terminFixBtn');
    if (terminFixBtn) {
        terminFixBtn.addEventListener('click', updateTermin);
    }
});
