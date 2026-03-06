import os
import re

src_dir = r"f:\git\biblequize\apps\api\src\main\java"

# 1. Fix package declarations based on file path
for root, dirs, files in os.walk(src_dir):
    for f in files:
        if f.endswith(".java"):
            filepath = os.path.join(root, f)
            
            # calculate expected package name
            rel_path = os.path.relpath(root, src_dir)
            expected_package = rel_path.replace(os.sep, ".")
            expected_declaration = f"package {expected_package};"
            
            with open(filepath, "r", encoding="utf-8") as file:
                content = file.read()
            
            # find current package
            match = re.search(r"^package\s+([\w\.]+);", content, re.MULTILINE)
            if match:
                current_package = match.group(0)
                if current_package != expected_declaration:
                    content = content.replace(current_package, expected_declaration, 1)
                    with open(filepath, "w", encoding="utf-8") as file:
                        file.write(content)
                    print(f"Fixed package in {f} to {expected_package}")

# 2. Fix legacy imports everywhere
legacy_mappings = {
    "import com.biblequiz.entity.User;": "import com.biblequiz.modules.user.entity.User;",
    "import com.biblequiz.repository.UserRepository;": "import com.biblequiz.modules.user.repository.UserRepository;",
    "import com.biblequiz.entity.UserAchievement;": "import com.biblequiz.modules.user.entity.UserAchievement;",
    "import com.biblequiz.repository.UserAchievementRepository;": "import com.biblequiz.modules.user.repository.UserAchievementRepository;",
    "import com.biblequiz.entity.Achievement;": "import com.biblequiz.modules.user.entity.Achievement;",
    "import com.biblequiz.repository.AchievementRepository;": "import com.biblequiz.modules.user.repository.AchievementRepository;",
    "import com.biblequiz.entity.Answer;": "import com.biblequiz.modules.quiz.entity.Answer;",
    "import com.biblequiz.repository.AnswerRepository;": "import com.biblequiz.modules.quiz.repository.AnswerRepository;",
    "import com.biblequiz.entity.AuthIdentity;": "import com.biblequiz.modules.auth.entity.AuthIdentity;",
    "import com.biblequiz.repository.AuthIdentityRepository;": "import com.biblequiz.modules.auth.repository.AuthIdentityRepository;",
    "import com.biblequiz.entity.UserDailyProgress;": "import com.biblequiz.modules.quiz.entity.UserDailyProgress;",
    "import com.biblequiz.repository.UserDailyProgressRepository;": "import com.biblequiz.modules.quiz.repository.UserDailyProgressRepository;",
    "import com.biblequiz.entity.UserBookProgress;": "import com.biblequiz.modules.quiz.entity.UserBookProgress;",
    "import com.biblequiz.repository.UserBookProgressRepository;": "import com.biblequiz.modules.quiz.repository.UserBookProgressRepository;",
}

for root, dirs, files in os.walk(src_dir):
    for f in files:
        if f.endswith(".java"):
            filepath = os.path.join(root, f)
            with open(filepath, "r", encoding="utf-8") as file:
                content = file.read()
            
            modified = False
            for old_import, new_import in legacy_mappings.items():
                if old_import in content:
                    content = content.replace(old_import, new_import)
                    modified = True
            
            if modified:
                with open(filepath, "w", encoding="utf-8") as file:
                    file.write(content)
                print(f"Fixed imports in {f}")

print("Done fixing packages and imports.")
