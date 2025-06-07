// JavaScript implementation for the web version of "Vorsch".
// This file mirrors a small subset of the original Vorsch.cs logic
// so that the accompanying Vorsch.Designer.html page can behave
// similarly to the WinForms application.

document.addEventListener('DOMContentLoaded', () => {
    loadGoogleMaps();
    setupHandlers();
    updateProgress(0);
});

/**
 * Dynamically load the Google Maps API and initialise the map.
 */
function loadGoogleMaps() {
    const script = document.createElement('script');
    script.src = 'https://maps.googleapis.com/maps/api/js?key=AIzaSyC82aoSWfXJwJOqJgSCMt8V4CQcn31VE_4&callback=initMap&libraries=places,directions';
    script.async = true;
    document.head.appendChild(script);
}

/**
 * Google Maps callback - creates a simple map centred on Vienna.
 */
function initMap() {
    const center = { lat: 48.210033, lng: 16.363449 };
    window.map = new google.maps.Map(document.getElementById('map'), {
        zoom: 12,
        center: center
    });
}

/**
 * Attach change handlers to combo boxes and checkboxes so that the
 * MitLabel is updated whenever the selection changes.
 */
function setupHandlers() {
    const mitCombos = [1, 2, 3, 4, 5, 6].map(i => document.getElementById(`MitfahrCombo${i}`));
    mitCombos.forEach(c => c && c.addEventListener('change', updateMitLabel));

    const driverChecks = [1, 2, 3, 4, 5, 6].map(i => document.getElementById(`Fahrer${i}`));
    driverChecks.forEach(c => c && c.addEventListener('change', updateMitLabel));
}

const INITIAL_MITFAHRER = 6;

/**
 * Updates the label showing how many passengers are still available and
 * updates the progress bar accordingly.
 */
function updateMitLabel() {
    const mitCombos = [1, 2, 3, 4, 5, 6].map(i => document.getElementById(`MitfahrCombo${i}`));
    let totalSelected = mitCombos.reduce((sum, c) => sum + parseInt(c?.value || '0', 10), 0);

    const driverChecks = [1, 2, 3, 4, 5, 6].map(i => document.getElementById(`Fahrer${i}`));
    let driversChecked = driverChecks.filter(c => c && c.checked).length;

    let remaining = INITIAL_MITFAHRER - totalSelected - driversChecked;
    const label = document.getElementById('MitLabel');
    if (label) {
        label.textContent = `Mitfahrer: ${remaining}`;
    }

    updateProgress(Math.max(0, Math.min(100, ((INITIAL_MITFAHRER - remaining) / INITIAL_MITFAHRER) * 100)));
}

/**
 * Simple progress bar updater used by updateMitLabel.
 */
function updateProgress(percent) {
   const inner = document.getElementById('ProgressBarInner');
    if (inner) {
        inner.style.width = percent + '%';
    }
}

