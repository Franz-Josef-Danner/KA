import json
import sys
import xml.etree.ElementTree as ET

if len(sys.argv) != 3:
    print(f"Usage: {sys.argv[0]} <input.resx> <output.json>")
    sys.exit(1)

input_path = sys.argv[1]
output_path = sys.argv[2]

tree = ET.parse(input_path)
root = tree.getroot()

ns = {'xsd': 'http://www.w3.org/2001/XMLSchema'}

data = {}
for data_elem in root.findall('data'):
    name = data_elem.get('name')
    value_elem = data_elem.find('value')
    if name and value_elem is not None:
        data[name] = value_elem.text or ''

with open(output_path, 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)
