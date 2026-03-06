import os
import shutil

src_dir = r"f:\git\biblequize\apps\api\src\main\java"

service_mappings = {
    "import com.biblequiz.service.SessionService;": "import com.biblequiz.modules.quiz.service.SessionService;",
    "import com.biblequiz.service.RoomService;": "import com.biblequiz.modules.room.service.RoomService;",
    "import com.biblequiz.service.QuestionService;": "import com.biblequiz.modules.quiz.service.QuestionService;",
    "import com.biblequiz.service.CacheService;": "import com.biblequiz.infrastructure.service.CacheService;",
    "import com.biblequiz.service.AuthService;": "import com.biblequiz.modules.auth.service.AuthService;",
    "import com.biblequiz.service.JwtService;": "import com.biblequiz.modules.auth.service.JwtService;",
    "import com.biblequiz.service.AuthCodeService;": "import com.biblequiz.modules.auth.service.AuthCodeService;",
    "import com.biblequiz.service.BookProgressionService;": "import com.biblequiz.modules.quiz.service.BookProgressionService;",
    "import com.biblequiz.service.PerformanceMonitoringService;": "import com.biblequiz.infrastructure.service.PerformanceMonitoringService;",
    "import com.biblequiz.service.InterServiceCommunicationService;": "import com.biblequiz.infrastructure.service.InterServiceCommunicationService;",
}

for root, dirs, files in os.walk(src_dir):
    for f in files:
        if f.endswith(".java"):
            filepath = os.path.join(root, f)
            with open(filepath, "r", encoding="utf-8") as file:
                content = file.read()
            
            modified = False
            for old_import, new_import in service_mappings.items():
                if old_import in content:
                    content = content.replace(old_import, new_import)
                    modified = True
            
            if modified:
                with open(filepath, "w", encoding="utf-8") as file:
                    file.write(content)
                print(f"Fixed service imports in {f}")

legacy_service_dir = r"f:\git\biblequize\apps\api\src\main\java\com\biblequiz\service"
if os.path.exists(legacy_service_dir):
    shutil.rmtree(legacy_service_dir)
    print("Deleted legacy service directory.")

print("Service cleanup complete.")
