import re

# Read the SQL file
with open('scripts/insert-sample-data.sql', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace all JSON arrays with JSON_ARRAY format
# Pattern: '["option1", "option2", "option3", "option4"]'
pattern = r'\'\["([^"]+)", "([^"]+)", "([^"]+)", "([^"]+)"\]\''
replacement = r"JSON_ARRAY('\1', '\2', '\3', '\4')"

# Apply the replacement
content = re.sub(pattern, replacement, content)

# Write back to file
with open('scripts/insert-sample-data.sql', 'w', encoding='utf-8') as f:
    f.write(content)

print("Converted JSON arrays to JSON_ARRAY format")
