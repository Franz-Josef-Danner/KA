// Basic JavaScript logic for the Email.html page
window.addEventListener('DOMContentLoaded', function () {
    var sendBtn = document.getElementById('sendButton');
    if (sendBtn) {
        sendBtn.addEventListener('click', function () {
            var email = document.getElementById('emailBox').value;
            var subject = document.getElementById('betreffTextBox').value;
            var body = document.getElementById('emailBodyTextBox').value;
            alert('E-Mail an ' + email + ' mit Betreff "' + subject + '" gesendet!');
        });
    }
});
