import os
import re

base_dir = r"f:/git/biblequize/apps/api/src/main/java/com/biblequiz"

def sync_all():
    # 1. Build Class -> NewPackage map
    class_map = {}
    for root, dirs, files in os.walk(base_dir):
        for f in files:
            if f.endswith(".java"):
                rel_path = os.path.relpath(root, base_dir)
                package_suffix = rel_path.replace(os.sep, ".")
                package_name = f"com.biblequiz.{package_suffix}" if package_suffix != "." else "com.biblequiz"
                class_name = f[:-5]
                class_map[class_name] = package_name

    # 2. Update files
    for root, dirs, files in os.walk(base_dir):
        for f in files:
            if f.endswith(".java"):
                file_path = os.path.join(root, f)
                with open(file_path, 'r', encoding='utf-8') as file:
                    lines = file.readlines()

                new_lines = []
                current_package = ""
                
                # First pass: find package and remove old internal imports
                for line in lines:
                    if line.strip().startswith("package com.biblequiz"):
                        # Update package to match folder
                        rel_path = os.path.relpath(root, base_dir)
                        package_suffix = rel_path.replace(os.sep, ".")
                        current_package = f"com.biblequiz.{package_suffix}" if package_suffix != "." else "com.biblequiz"
                        new_lines.append(f"package {current_package};\n")
                    elif line.strip().startswith("import com.biblequiz"):
                        continue # Remove all internal imports for now
                    else:
                        new_lines.append(line)

                # Second pass: detect used classes and add correct imports
                content = "".join(new_lines)
                needed_imports = set()
                
                # Simple heuristic: find capitalized words that are in our class_map
                # but are NOT the current class
                my_class_name = f[:-5]
                potential_classes = re.findall(r'\b[A-Z][a-zA-Z0-9]+\b', content)
                
                for cls in potential_classes:
                    if cls in class_map and cls != my_class_name:
                        # Only import if it's in a DIFFERENT package
                        if class_map[cls] != current_package:
                            needed_imports.add(f"import {class_map[cls]}.{cls};")

                # Insert needed imports after the package line
                final_output = []
                package_found = False
                for line in new_lines:
                    final_output.append(line)
                    if line.startswith("package ") and not package_found:
                        package_found = True
                        final_output.append("\n")
                        for imp in sorted(list(needed_imports)):
                            final_output.append(imp + "\n")

                with open(file_path, 'w', encoding='utf-8') as file:
                    file.writelines(final_output)

if __name__ == "__main__":
    sync_all()
    print("Final sync of imports and packages complete!")
