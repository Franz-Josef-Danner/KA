const ftp = require('basic-ftp');
const fs = require('fs');
const path = require('path');

async function downloadJsonFiles(progress = console.log) {
    const ftpServer = 'ftp.world4you.com';
    const ftpUsername = 'ftp8596592';
    const ftpPassword = 'm8&fCsH#Mt7FYsxT';
    const remoteDir = '/wp-content/uploads/Schauspieler/';
    const localDirectory = path.join(__dirname, 'json', 'Schauspieler');
    const downloadPre = path.join(__dirname, 'json', 'Firmen');

    progress('Checking directories...');
    await fs.promises.mkdir(localDirectory, { recursive: true });

    const client = new ftp.Client();
    try {
        progress('Connecting to FTP server...');
        await client.access({ host: ftpServer, user: ftpUsername, password: ftpPassword, secure: false });
        const list = await client.list(remoteDir);
        const files = list.filter(f => f.name.endsWith('_form.json')).map(f => f.name);
        progress(`Found ${files.length} files.`);

        for (const file of files) {
            const localPath = path.join(localDirectory, file);
            progress(`Downloading ${file}...`);
            await client.downloadTo(localPath, remoteDir + file);
            progress(`${file} downloaded.`);
        }

        progress('Download complete. Updating records...');
        const hasFiles = fs.readdirSync(localDirectory).some(f => f.endsWith('_form.json'));
        if (hasFiles) {
            await auftragUpdate(downloadPre, localDirectory, progress);
        }
        progress('Operations complete.');
    } catch (err) {
        progress(`Error: ${err.message}`);
    } finally {
        client.close();
    }
}

async function auftragUpdate(downloadPre, localDirectory, progress = console.log) {
    const formFiles = fs.readdirSync(localDirectory).filter(f => f.endsWith('_form.json'));
    for (const file of formFiles) {
        progress('firmenname aus json datei extrahieren...');
        const json = fs.readFileSync(path.join(localDirectory, file), 'utf8');
        const match = /"firmenname"\s*:\s*"(.*?)"/.exec(json);
        const firma = match ? match[1] : 'Unknown';
        const downloadDirectory = path.join(downloadPre, firma, 'Organ');
        await fs.promises.mkdir(downloadDirectory, { recursive: true });
        const targetPath = path.join(downloadDirectory, file);
        fs.renameSync(path.join(localDirectory, file), targetPath);

        const jsonFiles = fs.readdirSync(downloadDirectory).filter(f => f.endsWith('.json'));
        progress('Gruppieren der json dateien nach Schauspieler...');
        const groups = {};
        for (const f of jsonFiles) {
            const key = f.substring(0, 16);
            if (!groups[key]) groups[key] = [];
            groups[key].push(f);
        }

        for (const key of Object.keys(groups)) {
            const longFile = groups[key].find(f => f.includes('_form'));
            const shortFile = groups[key].find(f => !f.includes('_form'));
            progress('shortFile aktualisieren...');
            if (longFile && shortFile) {
                const longPath = path.join(downloadDirectory, longFile);
                const shortPath = path.join(downloadDirectory, shortFile);
                const longData = JSON.parse(fs.readFileSync(longPath, 'utf8').replace(/-/g, ' '));
                const shortData = JSON.parse(fs.readFileSync(shortPath, 'utf8'));

                const actor = longData['Schauspieler'];
                const targetObj = shortData.find(obj => obj['Schauspieler'] === actor);
                if (targetObj) {
                    progress('Update the target object with the long data...');
                    targetObj['Ja'] = longData['Ja'];
                    targetObj['Auto'] = longData['Auto'];
                    targetObj['Mitfahrer'] = longData['Mitfahrer'];
                    targetObj['Besetzt'] = longData['Ja'];
                }

                progress('Besetzte Rollen Markieren...');
                const occupiedRoles = new Set(shortData.filter(it => it['Besetzt'] === 'true').map(it => it['Rollen']));
                for (const item of shortData) {
                    if (occupiedRoles.has(item['Rollen'])) {
                        item['Besetzt'] = 'true';
                    }
                }

                progress('Abendregie Rollen Markieren...');
                const abendregieRoles = new Set(shortData.filter(it => it['Abendregie'] === 'True').map(it => it['Rollen']));
                for (const item of shortData) {
                    if (abendregieRoles.has(item['Abendregie'])) {
                        item['Besetzt'] = 'true';
                    }
                }

                fs.writeFileSync(shortPath, JSON.stringify(shortData, null, 2));
                // Optionally delete longFile
                // fs.unlinkSync(longPath);
            }
        }
    }
}

module.exports = { downloadJsonFiles };

if (require.main === module) {
    downloadJsonFiles(msg => console.log(msg));
}
