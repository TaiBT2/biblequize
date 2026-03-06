import re

log_path = r"f:/git/biblequize/apps/api/build_errors.log"

with open(log_path, 'r', encoding='utf-16le') as f:
    lines = f.readlines()

errors = []
for i, line in enumerate(lines):
    if "[ERROR]" in line and "cannot find symbol" in line:
        # Next line usually has the symbol name
        symbol_line = lines[i+1] if i+1 < len(lines) else ""
        location_line = lines[i+2] if i+2 < len(lines) else ""
        errors.append((line.strip(), symbol_line.strip(), location_line.strip()))

for err, sym, loc in errors:
    print(f"ERROR: {err}")
    print(f"  {sym}")
    print(f"  {loc}")
    print("-" * 20)
