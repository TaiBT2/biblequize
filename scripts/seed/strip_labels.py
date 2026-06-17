import json, glob, re, importlib.util
spec=importlib.util.spec_from_file_location("rw","scripts/seed/rewrite_distractors.py")
rw=importlib.util.module_from_spec(spec); spec.loader.exec_module(rw)
STRIP=re.compile(r'^KI[ỂE]U\s*\d+\s*(cross-ref|distinguish|deep meaning|verse precision|hiểu sâu)\s*[—:-]?\s*', re.I)
pairs=[]; SEED="apps/api/src/main/resources/seed/questions"
for f in sorted(glob.glob(f"{SEED}/*_quiz.json")):
    if f.endswith("_en.json"): continue
    raw=open(f,encoding="utf-8").read(); trailing=raw.endswith("\n"); data=json.loads(raw); ch=False
    for q in data:
        c=q.get("content") or ""
        if re.match(r'^KI[ỂE]U\s*\d',c):
            new=STRIP.sub("",c).strip()
            if new and len(new)>10 and new!=c:
                pairs.append({"book":q.get("book"),"chapter":q.get("chapter"),"verseStart":q.get("verseStart"),"verseEnd":q.get("verseEnd"),"old":c,"new":new})
                q["content"]=new; ch=True
    if ch:
        from pathlib import Path
        rw.save_json(Path(f), data, trailing)
json.dump(pairs, open("scripts/seed/label_strip_pairs.json","w",encoding="utf-8"), ensure_ascii=False, indent=2)
print(f"stripped: {len(pairs)} VN questions")
left=sum(1 for f in glob.glob(f"{SEED}/*_quiz.json") if not f.endswith("_en.json") for q in json.load(open(f,encoding="utf-8")) if re.match(r'^KI[ỂE]U\s*\d',q.get("content") or ""))
print(f"remaining KIỂU-labeled: {left}")
