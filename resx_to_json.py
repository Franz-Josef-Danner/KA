import json
import sys
import xml.etree.ElementTree as ET

if len(sys.argv) != 3:
    print("Usage: resx_to_json.py input.resx output.json")
    sys.exit(1)

resx_file = sys.argv[1]
json_file = sys.argv[2]

# Parse the XML
root = ET.parse(resx_file).getroot()

resources = {}
for data in root.findall('data'):
    name = data.get('name')
    value_elem = data.find('value')
    if name and value_elem is not None:
        resources[name] = value_elem.text

# Write to JSON
with open(json_file, 'w', encoding='utf-8') as f:
    json.dump(resources, f, ensure_ascii=False, indent=2)
