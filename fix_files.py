import os
import shutil

auth_dir = r"f:\git\biblequize\apps\api\src\main\java\com\biblequiz\modules\auth"

# files that were mistakenly renamed
entity_file = os.path.join(auth_dir, "entity")
repo_file = os.path.join(auth_dir, "repository")

# destination directories
entity_dir = os.path.join(auth_dir, "entity_dir")
repo_dir = os.path.join(auth_dir, "repository_dir")

os.makedirs(entity_dir, exist_ok=True)
os.makedirs(repo_dir, exist_ok=True)

if os.path.exists(entity_file) and os.path.isfile(entity_file):
    shutil.move(entity_file, os.path.join(entity_dir, "AuthIdentity.java"))

if os.path.exists(repo_file) and os.path.isfile(repo_file):
    shutil.move(repo_file, os.path.join(repo_dir, "AuthIdentityRepository.java"))

# now rename directories
if os.path.exists(entity_dir):
    os.rename(entity_dir, os.path.join(auth_dir, "entity"))

if os.path.exists(repo_dir):
    os.rename(repo_dir, os.path.join(auth_dir, "repository"))

print("Fixed AuthIdentity locations")
