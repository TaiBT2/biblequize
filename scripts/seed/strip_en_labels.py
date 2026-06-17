import json, glob, re, importlib.util
from pathlib import Path
spec = importlib.util.spec_from_file_location("rw", "scripts/seed/rewrite_distractors.py")
rw = importlib.util.module_from_spec(spec); spec.loader.exec_module(rw)

STRIP = re.compile(r'^TYPE\s*\d+\s*(cross-ref|distinguish|deep meaning|deep understanding|deep|verse precision)\s*[—:-]?\s*', re.I)
SEED = "apps/api/src/main/resources/seed/questions"
pairs = []
for f in sorted(glob.glob(f"{SEED}/*_quiz_en.json")):
    raw = open(f, encoding="utf-8").read(); trailing = raw.endswith("\n"); data = json.loads(raw); ch = False
    for q in data:
        c = q.get("content") or ""
        if re.match(r'^TYPE\s*\d', c, re.I):
            new = STRIP.sub("", c).strip()
            if new and len(new) > 10 and new != c:
                pairs.append({"book": q.get("book"), "chapter": q.get("chapter"),
                              "verseStart": q.get("verseStart"), "verseEnd": q.get("verseEnd"),
                              "old": c, "new": new})
                q["content"] = new; ch = True
    if ch:
        rw.save_json(Path(f), data, trailing)
json.dump(pairs, open("scripts/seed/en_label_pairs.json", "w", encoding="utf-8"), ensure_ascii=False, indent=2)
left = sum(1 for f in glob.glob(f"{SEED}/*_quiz_en.json") for q in json.load(open(f, encoding="utf-8"))
           if re.match(r'^TYPE\s*\d', q.get("content") or "", re.I))
print(f"EN stripped: {len(pairs)} | remaining TYPE-labeled: {left}")
