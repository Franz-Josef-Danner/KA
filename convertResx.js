const fs = require('fs');
const path = require('path');

if (process.argv.length < 3) {
  console.error('Usage: node convertResx.js <file.resx>');
  process.exit(1);
}

const resxPath = process.argv[2];
const xml = fs.readFileSync(resxPath, 'utf-8');

const dataRegex = /<data[^>]+name="([^"]+)"[^>]*>([\s\S]*?)<\/data>/g;
let match;
const result = {};
while ((match = dataRegex.exec(xml)) !== null) {
  const name = match[1];
  const inner = match[2];
  let valueMatch = inner.match(/<value>([\s\S]*?)<\/value>/);
  if (valueMatch) {
    result[name] = valueMatch[1].trim();
  } else {
    // value directly inside data tag
    result[name] = inner.trim();
  }
}

const outPath = path.join(path.dirname(resxPath), path.basename(resxPath, '.resx') + '.json');
fs.writeFileSync(outPath, JSON.stringify(result, null, 2), 'utf-8');
console.log(`Converted ${resxPath} -> ${outPath}`);
