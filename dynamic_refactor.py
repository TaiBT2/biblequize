import os
import shutil
import re
from pathlib import Path

base_dir = Path(r"f:\git\biblequize\apps\api\src\main\java\com\biblequiz")

FEATURE_MAP = {
    "User": "user",
    "Achievement": "user",
    "Auth": "auth",
    "Jwt": "auth",
    "OAuth2": "auth",
    "Question": "quiz",
    "Answer": "quiz",
    "Book": "quiz",
    "Bookmark": "quiz",
    "Quiz": "quiz",
    "Session": "quiz",
    "Room": "room",
    "Feedback": "feedback",
}

FOLDER_MAP = {
    "config": "infrastructure/config",
    "security": "infrastructure/security",
    "exception": "infrastructure/exception",
    "audit": "infrastructure/audit",
    "circuit": "infrastructure/circuit",
    "consistency": "infrastructure/consistency",
    "discovery": "infrastructure/discovery",
    "health": "infrastructure/health",
    "performance": "infrastructure/performance",
    "common": "shared/common",
    "aspect": "shared/aspect",
    "converter": "shared/converter",
    "controller": "api/controller",
    "dto": "api/dto",
    "websocket": "api/websocket",
    "gateway": "api/gateway",
}

def get_feature(name):
    for prefix, feat in FEATURE_MAP.items():
        if name.startswith(prefix):
            return feat
    return None

def migrate():
    # 1. Move known top-level folders
    for old, new_rel in FOLDER_MAP.items():
        old_p = base_dir / old
        new_p = base_dir / new_rel
        if old_p.exists() and old_p.is_dir():
            new_p.parent.mkdir(parents=True, exist_ok=True)
            if new_p.exists():
                for item in old_p.iterdir():
                    shutil.move(str(item), str(new_p / item.name))
                old_p.rmdir()
            else:
                shutil.move(str(old_p), str(new_p))

    # 2. Move individual files from entity, repository, service
    for sub in ["entity", "repository", "service"]:
        sub_p = base_dir / sub
        if not sub_p.exists(): continue
        
        for f in sub_p.glob("*.java"):
            feature = get_feature(f.stem)
            if feature:
                dest_dir = base_dir / "modules" / feature / sub
            else:
                # Infrastructure service?
                if sub == "service":
                    dest_dir = base_dir / "infrastructure" / "service"
                else:
                    dest_dir = base_dir / "core" / sub # Fallback
            
            dest_dir.mkdir(parents=True, exist_ok=True)
            shutil.move(str(f), str(dest_dir / f.name))

    # 3. Handle specific root-level modules that were already there
    for m in ["quiz", "room", "auth"]:
        p = base_dir / m
        if p.exists() and p.is_dir():
            # If it's a feature folder, move it to modules/
            dest = base_dir / "modules" / m
            # Check if it has sub-packages already or just loose files
            # (In this project, they were flat folders mostly)
            # We already handled it in step 1 if it's in FOLDER_MAP
            pass

    # 4. Sync Packages and Imports
    class_map = {}
    for p in base_dir.rglob("*.java"):
        rel = p.relative_to(base_dir)
        package_suffix = ".".join(rel.parent.parts)
        package_name = f"com.biblequiz.{package_suffix}" if package_suffix else "com.biblequiz"
        class_map[p.stem] = package_name

    for p in base_dir.rglob("*.java"):
        content = p.read_text(encoding='utf-8')
        lines = content.splitlines()
        
        rel = p.relative_to(base_dir)
        package_suffix = ".".join(rel.parent.parts)
        current_package = f"com.biblequiz.{package_suffix}" if package_suffix else "com.biblequiz"
        
        new_lines = []
        for line in lines:
            if line.strip().startswith("package com.biblequiz"):
                new_lines.append(f"package {current_package};")
            elif line.strip().startswith("import com.biblequiz"):
                continue
            else:
                new_lines.append(line)
        
        content_body = "\n".join(new_lines)
        needed = set()
        for cls, pkg in class_map.items():
            if pkg != current_package and cls != p.stem:
                if re.search(r'\b' + cls + r'\b', content_body):
                    needed.add(f"import {pkg}.{cls};")
        
        final = []
        package_placed = False
        for line in new_lines:
            final.append(line)
            if line.startswith("package ") and not package_placed:
                package_placed = True
                final.append("")
                for imp in sorted(list(needed)):
                    final.append(imp)
        
        p.write_text("\n".join(final), encoding='utf-8')

    # 5. Cleanup
    for d in ["entity", "repository", "service", "quiz", "room"]:
        p = base_dir / d
        if p.exists() and p.is_dir():
            try: shutil.rmtree(p)
            except: pass

if __name__ == "__main__":
    migrate()
    print("Dynamic migration complete!")
