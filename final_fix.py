import os
import shutil
import re

# Use forward slashes for Windows Path compatibility in Python
ROOT = "f:/git/biblequize/apps/api/src/main/java/com/biblequiz"

FEATURE_MAP = {
    "User": "user", "Achievement": "user",
    "Auth": "auth", "Jwt": "auth", "OAuth2": "auth",
    "Question": "quiz", "Answer": "quiz", "Book": "quiz", "Bookmark": "quiz", "Quiz": "quiz", "Session": "quiz",
    "Room": "room", "Feedback": "feedback", "Tournament": "tournament", "Ranked": "ranked", "AdminAI": "adminai",
    "Business": "business"
}

def get_target_pkg(filename, current_rel_dir):
    # Rule 1: Infrastructure services
    if filename in ["CacheService.java", "InterServiceCommunicationService.java", "PerformanceMonitoringService.java"]:
        return "infrastructure/service"
    
    # Rule 2: Map by feature prefix
    for prefix, feat in FEATURE_MAP.items():
        if filename.startswith(prefix):
            # Determine sub-layer (entity, repository, service)
            if "Repository" in filename: return f"modules/{feat}/repository"
            if "Service" in filename: return f"modules/{feat}/service"
            return f"modules/{feat}/entity"
    
    # Rule 3: Keep if already in one of the 4 target zones
    parts = current_rel_dir.replace("\\", "/").split("/")
    if parts[0] in ["api", "modules", "infrastructure", "shared"]:
        return current_rel_dir
    
    # Rule 4: Fallback for generic things
    if "Repository" in filename: return "core/repository"
    if "Service" in filename: return "core/service"
    return "core/entity"

def run():
    # 1. Collect all files and their planned targets
    print("Collecting files...")
    all_java_files = []
    for root, dirs, files in os.walk(ROOT):
        for f in files:
            if f.endswith(".java") and f != "ApiApplication.java":
                rel_dir = os.path.relpath(root, ROOT)
                if rel_dir == ".": rel_dir = ""
                all_java_files.append((f, root, rel_dir))

    # 2. Perform moves
    print("Moving files to modular structure...")
    for f, root, rel_dir in all_java_files:
        target_rel = get_target_pkg(f, rel_dir)
        if target_rel != rel_dir:
            src = os.path.join(root, f)
            dest_dir = os.path.join(ROOT, target_rel)
            os.makedirs(dest_dir, exist_ok=True)
            dest = os.path.join(dest_dir, f)
            print(f"  {f}: {rel_dir} -> {target_rel}")
            shutil.move(src, dest)

    # 3. Build Global Class -> Package Map
    print("Building class map...")
    class_map = {}
    for root, dirs, files in os.walk(ROOT):
        for f in files:
            if f.endswith(".java"):
                rel = os.path.relpath(root, ROOT)
                pkg_suffix = rel.replace(os.sep, ".").replace("/", ".")
                full_pkg = f"com.biblequiz.{pkg_suffix}" if rel != "." else "com.biblequiz"
                class_map[f[:-5]] = full_pkg

    # 4. Update Packages and Imports
    print("Updating packages and imports...")
    for root, dirs, files in os.walk(ROOT):
        for f in files:
            if f.endswith(".java"):
                path = os.path.join(root, f)
                with open(path, 'r', encoding='utf-8') as file:
                    content = file.read()
                
                rel = os.path.relpath(root, ROOT)
                pkg_suffix = rel.replace(os.sep, ".").replace("/", ".")
                new_pkg = f"com.biblequiz.{pkg_suffix}" if rel != "." else "com.biblequiz"
                
                # Replace Package
                content = re.sub(r"^package\s+com\.biblequiz.*?;", f"package {new_pkg};", content, flags=re.MULTILINE)
                
                # Remove all com.biblequiz imports
                lines = content.splitlines()
                final_lines = []
                for line in lines:
                    if not line.strip().startswith("import com.biblequiz"):
                        final_lines.append(line)
                
                body = "\n".join(final_lines)
                needed = set()
                # Simple check for each class in the map
                for cls_name, cls_pkg in class_map.items():
                    if cls_pkg != new_pkg and cls_name != f[:-5]:
                        if re.search(r'\b' + cls_name + r'\b', body):
                            needed.add(f"import {cls_pkg}.{cls_name};")
                
                # Re-insert imports
                output = []
                package_done = False
                for line in final_lines:
                    output.append(line)
                    if line.startswith("package ") and not package_done:
                        package_done = True
                        output.append("")
                        for imp in sorted(list(needed)):
                            output.append(imp)
                
                with open(path, 'w', encoding='utf-8') as file:
                    file.write("\n".join(output))

    # 5. Final Cleanup of legacy empty folders
    print("Cleaning up legacy folders...")
    legacy = ["entity", "repository", "service", "quiz", "room", "auth"]
    for l in legacy:
        p = os.path.join(ROOT, l)
        if os.path.exists(p) and os.path.isdir(p):
            shutil.rmtree(p)

    print("DONE!")

if __name__ == "__main__":
    run()
