import os
import shutil
import re
from pathlib import Path

base_dir = Path("f:/git/biblequize/apps/api/src/main/java/com/biblequiz")

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

FILE_MOVES = {
    "entity/User.java": "modules/user/entity/User.java",
    "entity/Achievement.java": "modules/user/entity/Achievement.java",
    "entity/UserAchievement.java": "modules/user/entity/UserAchievement.java",
    "repository/UserRepository.java": "modules/user/repository/UserRepository.java",
    "repository/AchievementRepository.java": "modules/user/repository/AchievementRepository.java",
    "repository/UserAchievementRepository.java": "modules/user/repository/UserAchievementRepository.java",
    "service/UserService.java": "modules/user/service/UserService.java",
    "service/AchievementService.java": "modules/user/service/AchievementService.java",
    "entity/AuthIdentity.java": "modules/auth/entity/AuthIdentity.java",
    "repository/AuthIdentityRepository.java": "modules/auth/repository/AuthIdentityRepository.java",
    "service/AuthService.java": "modules/auth/service/AuthService.java",
    "service/AuthCodeService.java": "modules/auth/service/AuthCodeService.java",
    "service/JwtService.java": "modules/auth/service/JwtService.java",
    "service/OAuth2Service.java": "modules/auth/service/OAuth2Service.java",
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
    "entity/Room.java": "modules/room/entity/Room.java",
    "entity/RoomPlayer.java": "modules/room/entity/RoomPlayer.java",
    "repository/RoomRepository.java": "modules/room/repository/RoomRepository.java",
    "repository/RoomPlayerRepository.java": "modules/room/repository/RoomPlayerRepository.java",
    "service/RoomService.java": "modules/room/service/RoomService.java",
    "entity/Feedback.java": "modules/feedback/entity/Feedback.java",
    "repository/FeedbackRepository.java": "modules/feedback/repository/FeedbackRepository.java",
    "service/CacheService.java": "infrastructure/service/CacheService.java",
    "service/InterServiceCommunicationService.java": "infrastructure/service/InterServiceCommunicationService.java",
    "service/PerformanceMonitoringService.java": "infrastructure/service/PerformanceMonitoringService.java",
}

def run_migration():
    # 1. Folders
    for old, new_rel in FOLDER_MOVES.items():
        old_p = base_dir / old
        new_p = base_dir / new_rel
        if old_p.exists():
            new_p.parent.mkdir(parents=True, exist_ok=True)
            if new_p.exists() and new_p.is_dir():
                for item in old_p.iterdir():
                    shutil.move(str(item), str(new_p / item.name))
                old_p.rmdir()
            else:
                shutil.move(str(old_p), str(new_p))

    # 2. Files
    for old_rel, new_rel in FILE_MOVES.items():
        old_p = base_dir / old_rel
        new_p = base_dir / new_rel
        if old_p.exists():
            new_p.parent.mkdir(parents=True, exist_ok=True)
            shutil.move(str(old_p), str(new_p))

    # 3. Class map
    class_map = {}
    for p in base_dir.rglob("*.java"):
        rel = p.relative_to(base_dir)
        package_suffix = ".".join(rel.parent.parts)
        package_name = f"com.biblequiz.{package_suffix}" if package_suffix else "com.biblequiz"
        class_map[p.stem] = package_name

    # 4. Sync
    for p in base_dir.rglob("*.java"):
        content = p.read_text(encoding='utf-8')
        lines = content.splitlines()
        
        new_lines = []
        rel = p.relative_to(base_dir)
        package_suffix = ".".join(rel.parent.parts)
        current_package = f"com.biblequiz.{package_suffix}" if package_suffix else "com.biblequiz"
        
        for line in lines:
            if line.strip().startswith("package com.biblequiz"):
                new_lines.append(f"package {current_package};")
            elif line.strip().startswith("import com.biblequiz"):
                continue
            else:
                new_lines.append(line)
        
        content = "\n".join(new_lines)
        needed = set()
        for cls, pkg in class_map.items():
            if pkg != current_package and re.search(r'\b' + cls + r'\b', content):
                needed.add(f"import {pkg}.{cls};")
        
        final = []
        package_done = False
        for line in new_lines:
            final.append(line)
            if line.startswith("package ") and not package_done:
                package_done = True
                final.append("")
                for imp in sorted(list(needed)):
                    final.append(imp)
        
        p.write_text("\n".join(final), encoding='utf-8')

    # 5. Cleanup
    for d in ["entity", "repository", "service", "quiz", "room"]:
        p = base_dir / d
        if p.exists() and p.is_dir():
            shutil.rmtree(p)

if __name__ == "__main__":
    run_migration()
    print("Migration complete!")
