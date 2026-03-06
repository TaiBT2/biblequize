import os
import shutil
import re

base_dir = r"f:/git/biblequize/apps/api/src/main/java/com/biblequiz"

# Mapping of Folders
FOLDER_MOVES = {
    "config": "infrastructure/config",
    "security": "infrastructure/security",
    "exception": "infrastructure/exception",
    "audit": "infrastructure/audit",
    "circuit": "infrastructure/circuit",
    "consistency": "infrastructure/consistency",
    "discovery": "infrastructure/discovery",
    "health": "infrastructure/health",
    "performance": "infrastructure/performance",
    "auth": "modules/auth",
    "common": "shared/common",
    "aspect": "shared/aspect",
    "converter": "shared/converter",
    "controller": "api/controller",
    "dto": "api/dto",
    "websocket": "api/websocket",
    "gateway": "api/gateway",
    "adminai": "modules/adminai",
    "ranked": "modules/ranked",
    "tournament": "modules/tournament",
    "business": "modules/business",
}

# Mapping of Files
FILE_MOVES = {
    # User Module
    "entity/User.java": "modules/user/entity/User.java",
    "entity/Achievement.java": "modules/user/entity/Achievement.java",
    "entity/UserAchievement.java": "modules/user/entity/UserAchievement.java",
    "repository/UserRepository.java": "modules/user/repository/UserRepository.java",
    "repository/AchievementRepository.java": "modules/user/repository/AchievementRepository.java",
    "repository/UserAchievementRepository.java": "modules/user/repository/UserAchievementRepository.java",
    "service/UserService.java": "modules/user/service/UserService.java",
    "service/AchievementService.java": "modules/user/service/AchievementService.java",

    # Auth Module
    "entity/AuthIdentity.java": "modules/auth/entity/AuthIdentity.java",
    "repository/AuthIdentityRepository.java": "modules/auth/repository/AuthIdentityRepository.java",
    "service/AuthService.java": "modules/auth/service/AuthService.java",
    "service/AuthCodeService.java": "modules/auth/service/AuthCodeService.java",
    "service/JwtService.java": "modules/auth/service/JwtService.java",
    "service/OAuth2Service.java": "modules/auth/service/OAuth2Service.java",

    # Quiz Module
    "entity/Question.java": "modules/quiz/entity/Question.java",
    "entity/Answer.java": "modules/quiz/entity/Answer.java",
    "entity/Book.java": "modules/quiz/entity/Book.java",
    "entity/Bookmark.java": "modules/quiz/entity/Bookmark.java",
    "entity/UserBookProgress.java": "modules/quiz/entity/UserBookProgress.java",
    "entity/UserDailyProgress.java": "modules/quiz/entity/UserDailyProgress.java",
    "entity/QuizSession.java": "modules/quiz/entity/QuizSession.java",
    "entity/QuizSessionQuestion.java": "modules/quiz/entity/QuizSessionQuestion.java",
    "repository/QuestionRepository.java": "modules/quiz/repository/QuestionRepository.java",
    "repository/AnswerRepository.java": "modules/quiz/repository/AnswerRepository.java",
    "repository/BookRepository.java": "modules/quiz/repository/BookRepository.java",
    "repository/BookmarkRepository.java": "modules/quiz/repository/BookmarkRepository.java",
    "repository/UserBookProgressRepository.java": "modules/quiz/repository/UserBookProgressRepository.java",
    "repository/UserDailyProgressRepository.java": "modules/quiz/repository/UserDailyProgressRepository.java",
    "repository/QuizSessionRepository.java": "modules/quiz/repository/QuizSessionRepository.java",
    "repository/QuizSessionQuestionRepository.java": "modules/quiz/repository/QuizSessionQuestionRepository.java",
    "service/QuestionService.java": "modules/quiz/service/QuestionService.java",
    "service/SessionService.java": "modules/quiz/service/SessionService.java",
    "service/BookProgressionService.java": "modules/quiz/service/BookProgressionService.java",

    # Room Module
    "entity/Room.java": "modules/room/entity/Room.java",
    "entity/RoomPlayer.java": "modules/room/entity/RoomPlayer.java",
    "repository/RoomRepository.java": "modules/room/repository/RoomRepository.java",
    "repository/RoomPlayerRepository.java": "modules/room/repository/RoomPlayerRepository.java",
    "service/RoomService.java": "modules/room/service/RoomService.java",

    # Feedback Module
    "entity/Feedback.java": "modules/feedback/entity/Feedback.java",
    "repository/FeedbackRepository.java": "modules/feedback/repository/FeedbackRepository.java",

    # Infrastructure Services
    "service/CacheService.java": "infrastructure/service/CacheService.java",
    "service/InterServiceCommunicationService.java": "infrastructure/service/InterServiceCommunicationService.java",
    "service/PerformanceMonitoringService.java": "infrastructure/service/PerformanceMonitoringService.java",
}

def move_and_sync():
    # 1. Folders
    for old, new_rel in FOLDER_MOVES.items():
        old_path = os.path.join(base_dir, old).replace("/", os.sep)
        new_path = os.path.join(base_dir, new_rel).replace("/", os.sep)
        if os.path.exists(old_path):
            os.makedirs(os.path.dirname(new_path), exist_ok=True)
            try:
                if os.path.exists(new_path) and os.path.isdir(new_path):
                    for item in os.listdir(old_path):
                        shutil.move(os.path.join(old_path, item), os.path.join(new_path, item))
                    os.rmdir(old_path)
                else:
                    shutil.move(old_path, new_path)
            except Exception as e:
                print(f"Error moving folder {old}: {e}")

    # 2. Files
    for old_rel, new_rel in FILE_MOVES.items():
        old_path = os.path.join(base_dir, old_rel).replace("/", os.sep)
        new_path = os.path.join(base_dir, new_rel).replace("/", os.sep)
        if os.path.exists(old_path):
            os.makedirs(os.path.dirname(new_path), exist_ok=True)
            try:
                shutil.move(old_path, new_path)
            except Exception as e:
                print(f"Error moving file {old_rel}: {e}")

    # 3. Build map
    class_map = {}
    for root, dirs, files in os.walk(base_dir):
        for f in files:
            if f.endswith(".java"):
                rel_path = os.path.relpath(root, base_dir)
                package_suffix = rel_path.replace(os.sep, ".")
                package_name = f"com.biblequiz.{package_suffix}" if package_suffix != "." else "com.biblequiz"
                class_name = f[:-5]
                class_map[class_name] = package_name

    # 4. Sync
    for root, dirs, files in os.walk(base_dir):
        for f in files:
            if f.endswith(".java"):
                file_path = os.path.join(root, f)
                try:
                    with open(file_path, 'r', encoding='utf-8') as file:
                        lines = file.readlines()

                    new_lines = []
                    rel_path = os.path.relpath(root, base_dir)
                    package_suffix = rel_path.replace(os.sep, ".")
                    current_package = f"com.biblequiz.{package_suffix}" if package_suffix != "." else "com.biblequiz"
                    my_class_name = f[:-5]
                    
                    for line in lines:
                        if line.strip().startswith("package com.biblequiz"):
                            new_lines.append(f"package {current_package};\n")
                        elif line.strip().startswith("import com.biblequiz"):
                            continue
                        else:
                            new_lines.append(line)

                    content = "".join(new_lines)
                    needed_imports = set()
                    potential_classes = re.findall(r'\b[A-Z][a-zA-Z0-9]+\b', content)
                    
                    for cls in potential_classes:
                        if cls in class_map and cls != my_class_name:
                            if class_map[cls] != current_package:
                                needed_imports.add(f"import {class_map[cls]}.{cls};")

                    final_output = []
                    package_placed = False
                    for line in new_lines:
                        final_output.append(line)
                        if line.startswith("package ") and not package_placed:
                            package_placed = True
                            final_output.insert(len(final_output), "\n")
                            for imp in sorted(list(needed_imports)):
                                final_output.append(imp + "\n")

                    with open(file_path, 'w', encoding='utf-8') as file:
                        file.writelines(final_output)
                except Exception as e:
                    print(f"Error syncing file {file_path}: {e}")

    # 5. Cleanup
    for l in ["entity", "repository", "service", "quiz", "room"]:
        p = os.path.join(base_dir, l)
        if os.path.exists(p) and os.path.isdir(p):
            try:
                shutil.rmtree(p)
            except Exception as e:
                print(f"Error removing legacy dir {p}: {e}")

if __name__ == "__main__":
    move_and_sync()
    print("Refactor and Sync complete!")
