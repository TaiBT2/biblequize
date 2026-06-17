import json, sys
from pathlib import Path
action = sys.argv[1] if len(sys.argv) > 1 else "commit"
pairs = json.load(open("scripts/seed/en_label_pairs.json", encoding="utf-8"))


def esc(s):
    return s.replace("\\", "\\\\").replace("'", "''")


def q(s):
    return "'" + esc(s) + "'"


lines = ["SET NAMES utf8mb4;"]
contents = ", ".join(q(p["old"]) for p in pairs)
lines.append(f"SELECT CONCAT('target rows present: ', COUNT(*)) FROM questions "
             f"WHERE source='seed:json' AND language='en' AND content IN ({contents});")
lines.append("START TRANSACTION;")
for p in pairs:
    ve = p.get("verseEnd")
    vc = f"verse_end={ve}" if ve is not None else "verse_end IS NULL"
    lines.append(f"UPDATE questions SET content={q(p['new'])}, updated_at=NOW() "
                 f"WHERE source='seed:json' AND language='en' AND book={q(p['book'])} "
                 f"AND chapter={p['chapter']} AND verse_start={p['verseStart']} AND {vc} "
                 f"AND content={q(p['old'])};")
lines.append("COMMIT;" if action == "commit" else "ROLLBACK;")
Path("scripts/seed/prod_label_strip_en.sql").write_text("\n".join(lines) + "\n", encoding="utf-8")
print(f"-> prod_label_strip_en.sql ({action}), {len(pairs)} updates")
