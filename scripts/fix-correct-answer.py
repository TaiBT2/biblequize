import re

# Read the SQL file
with open('scripts/simple-sample-data.sql', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace all correct_answer values with JSON_ARRAY format
# Pattern: ), 0, 'explanation'
# Pattern: ), 1, 'explanation'
# Pattern: ), 2, 'explanation'
# Pattern: ), 3, 'explanation'

pattern = r'\), (\d+), \''
replacement = r'), JSON_ARRAY(\1), \''

# Apply the replacement
content = re.sub(pattern, replacement, content)

# Write back to file
with open('scripts/simple-sample-data.sql', 'w', encoding='utf-8') as f:
    f.write(content)

print("Converted correct_answer to JSON_ARRAY format")
