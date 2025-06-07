const fs = require('fs');

function convertResxToJson(resxPath, jsonPath) {
  const xml = fs.readFileSync(resxPath, 'utf8');
  const dataRegex = /<data\s+name="([^"]+)"[^>]*>([\s\S]*?)<\/data>/g;
  const valueRegex = /<value>([\s\S]*?)<\/value>/;
  const result = {};
  let match;
  while ((match = dataRegex.exec(xml)) !== null) {
    const name = match[1];
    const content = match[2];
    const valueMatch = valueRegex.exec(content);
    let value;
    if (valueMatch) {
      value = valueMatch[1].trim();
    } else {
      value = content.replace(/<[^>]+>/g, '').trim();
    }
    result[name] = value;
  }
  fs.writeFileSync(jsonPath, JSON.stringify(result, null, 2), 'utf8');
}

convertResxToJson('TeleTermin.resx', 'TeleTermin.json');
console.log('Converted TeleTermin.resx to TeleTermin.json');
