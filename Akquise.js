// JavaScript version of Akquise.cs logic for the web page
// Provides basic address management and Google Maps checks

document.addEventListener('DOMContentLoaded', () => {
    const zieAd = document.getElementById('ZieAd');
    const staAd = document.getElementById('StaAd');
    const adGo = document.getElementById('AdGo');
    const minAut = document.getElementById('MinAut');
    const statusLabel = document.getElementById('StatusLabel');
    const progressBar = document.getElementById('ProgressBar1');

    const einBtn = document.getElementById('Ein');
    const beaBtn = document.getElementById('Bea');
    const entBtn = document.getElementById('Ent');
    const mapBtn = document.getElementById('Map');
    const checkBtn = document.getElementById('Check');
    const reChBtn = document.getElementById('ReCh');

    function createListItem(text) {
        const li = document.createElement('li');
        li.textContent = text;
        return li;
    }

    function addAddressesToZieAd(addresses) {
        addresses.forEach(addr => {
            if (addr.trim()) {
                zieAd.appendChild(createListItem(addr.trim()));
            }
        });
    }

    function addAddressesToStaAd(addresses) {
        addresses.forEach(addr => {
            if (addr.trim()) {
                staAd.value += addr.trim() + '\n';
            }
        });
    }

    function getSelectedLi() {
        return Array.from(zieAd.querySelectorAll('li.selected'));
    }

    zieAd.addEventListener('click', evt => {
        if (evt.target.tagName === 'LI') {
            evt.target.classList.toggle('selected');
        }
    });

    einBtn.addEventListener('click', () => {
        const text = prompt('Adresse(n) eingeben (eine pro Zeile):');
        if (text !== null) {
            addAddressesToZieAd(text.split(/\n/));
        }
    });

    beaBtn.addEventListener('click', () => {
        const selected = getSelectedLi();
        if (selected.length === 0) return;
        const text = prompt('Adressen bearbeiten:', selected.map(li => li.textContent).join('\n'));
        if (text !== null) {
            selected.forEach(li => li.remove());
            addAddressesToZieAd(text.split(/\n/));
        }
    });

    entBtn.addEventListener('click', () => {
        getSelectedLi().forEach(li => li.remove());
    });

    mapBtn.addEventListener('click', () => {
        openAddressesInGoogleMaps(adGo.value);
    });

    reChBtn.addEventListener('click', () => {
        staAd.value = '';
        const addresses = Array.from(zieAd.querySelectorAll('li')).map(li => li.textContent);
        addAddressesToStaAd(addresses);
    });

    checkBtn.addEventListener('click', async () => {
        statusLabel.textContent = 'Überprüfung läuft...';
        await checkAddresses();
        statusLabel.textContent = 'Fertig';
    });

    async function checkAddresses() {
        const origins = staAd.value.split(/\n/).filter(a => a.trim());
        const dests = Array.from(zieAd.querySelectorAll('li')).map(li => li.textContent);
        const total = origins.length * dests.length;
        let completed = 0;
        const valid = [];

        for (const origin of origins) {
            let ok = true;
            for (const dest of dests) {
                const duration = await getTravelTime(origin, dest);
                completed++;
                progressBar.value = Math.round(completed * 100 / total);
                if (duration <= parseInt(minAut.value, 10)) {
                    ok = false;
                    break;
                }
            }
            if (ok) valid.push(origin);
        }

        adGo.value = valid.join('\n');
    }

    async function getTravelTime(origin, destination) {
        const apiKey = 'YOUR_GOOGLE_API_KEY';
        const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&key=${apiKey}`;
        try {
            const resp = await fetch(url);
            const data = await resp.json();
            if (data.routes && data.routes.length > 0) {
                return data.routes[0].legs[0].duration.value / 60;
            }
        } catch (e) {
            console.error(e);
        }
        return -1;
    }

    function openAddressesInGoogleMaps(addresses) {
        addresses.split(/\n/).forEach(addr => {
            if (addr.trim()) {
                const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addr.trim())}`;
                window.open(url, '_blank');
            }
        });
    }
});
