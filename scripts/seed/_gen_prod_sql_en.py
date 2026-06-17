import glob, json, subprocess, sys
from pathlib import Path
action = sys.argv[1] if len(sys.argv) > 1 else "commit"
def esc(s): return s.replace("\\","\\\\").replace("'","''")
def q(s): return "'"+esc(s)+"'"
def head(gp):
    o=subprocess.run(["git","show",f"HEAD:{gp}"],capture_output=True,text=True,encoding="utf-8").stdout
    return json.loads(o) if o else None
changed=[]; viol=[]; fc=0
for f in sorted(glob.glob("apps/api/src/main/resources/seed/questions/*_quiz_en.json")):
    gp=f.replace("\\","/"); new=json.load(open(f,encoding="utf-8")); old=head(gp)
    if old is None or old==new: continue
    fc+=1
    for o,n in zip(old,new):
        if o.get("content")!=n.get("content"): viol.append(("content",gp)); continue
        if o.get("correctAnswer")!=n.get("correctAnswer"): viol.append(("ca",gp)); continue
        ci=(o.get("correctAnswer") or [0])[0]; oo,no=o.get("options") or [],n.get("options") or []
        if not(isinstance(ci,int) and ci<len(oo) and ci<len(no)): continue
        if oo[ci]!=no[ci]: viol.append(("correct_text",gp)); continue
        if oo!=no or o.get("explanation")!=n.get("explanation"): changed.append(n)
print(f"EN files changed: {fc} | rows: {len(changed)} | VIOLATIONS: {len(viol)}")
for v in viol[:15]: print("  !",v)
if viol: sys.exit(1)
lines=["SET NAMES utf8mb4;"]
contents=", ".join(q(c["content"]) for c in changed)
lines.append(f"SELECT CONCAT('target rows present: ',COUNT(*)) FROM questions WHERE source='seed:json' AND language='en' AND content IN ({contents});")
lines.append("START TRANSACTION;")
for c in changed:
    opts=esc(json.dumps(c["options"],ensure_ascii=False)); ve=c.get("verseEnd")
    vc=f"verse_end={ve}" if ve is not None else "verse_end IS NULL"
    lines.append(f"UPDATE questions SET options='{opts}', explanation={q(c.get('explanation',''))}, updated_at=NOW() WHERE source='seed:json' AND language='en' AND book={q(c['book'])} AND chapter={c['chapter']} AND verse_start={c['verseStart']} AND {vc} AND content={q(c['content'])};")
lines.append("COMMIT;" if action=="commit" else "ROLLBACK;")
Path("scripts/seed/prod_update_en.sql").write_text("\n".join(lines)+"\n",encoding="utf-8")
print(f"-> scripts/seed/prod_update_en.sql ({action}), {len(changed)} updates")
