import xml.etree.ElementTree as ET
import json
import sys


def convert_resx_to_json(resx_path, json_path):
    tree = ET.parse(resx_path)
    root = tree.getroot()

    entries = {}
    for data in root.findall('data'):
        name = data.get('name')
        value_elem = data.find('value')
        value = value_elem.text if value_elem is not None else ''
        entries[name] = value

    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(entries, f, ensure_ascii=False, indent=2)


if __name__ == '__main__':
    if len(sys.argv) != 3:
        print('Usage: python convert_resx_to_json.py input.resx output.json')
        sys.exit(1)

    convert_resx_to_json(sys.argv[1], sys.argv[2])
