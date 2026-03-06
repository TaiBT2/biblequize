import os

modules_dir = r"f:\git\biblequize\apps\api\src\main\java\com\biblequiz\modules"
entity_dir = r"f:\git\biblequize\apps\api\src\main\java\com\biblequiz\entity"
repo_dir = r"f:\git\biblequize\apps\api\src\main\java\com\biblequiz\repository"

def find_in_modules(filename):
    for root, dirs, files in os.walk(modules_dir):
        if filename in files:
            return os.path.join(root, filename)
    return None

print("UNMIGRATED ENTITIES:")
for f in os.listdir(entity_dir):
    if f.endswith(".java") and not find_in_modules(f):
        print("Entity:", f)

print("\nUNMIGRATED REPOSITORIES:")
for f in os.listdir(repo_dir):
    if f.endswith(".java") and not find_in_modules(f):
        print("Repo:", f)
