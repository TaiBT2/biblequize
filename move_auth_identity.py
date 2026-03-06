import os
import shutil

src_entity = r"f:\git\biblequize\apps\api\src\main\java\com\biblequiz\entity\AuthIdentity.java"
dest_entity = r"f:\git\biblequize\apps\api\src\main\java\com\biblequiz\modules\auth\entity\AuthIdentity.java"

src_repo = r"f:\git\biblequize\apps\api\src\main\java\com\biblequiz\repository\AuthIdentityRepository.java"
dest_repo = r"f:\git\biblequize\apps\api\src\main\java\com\biblequiz\modules\auth\repository\AuthIdentityRepository.java"

os.makedirs(os.path.dirname(dest_entity), exist_ok=True)
os.makedirs(os.path.dirname(dest_repo), exist_ok=True)

if os.path.exists(src_entity):
    shutil.move(src_entity, dest_entity)
if os.path.exists(src_repo):
    shutil.move(src_repo, dest_repo)

print("Moved AuthIdentity files to modules.")
