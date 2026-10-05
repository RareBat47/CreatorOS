import os
import re

src_dir = r"D:/REMOTION_OS/apps/renderer/src"
for root, dirs, files in os.walk(src_dir):
    for f in files:
        if f.endswith((".ts", ".tsx")):
            path = os.path.join(root, f)
            with open(path, "r", encoding="utf-8") as fp:
                content = fp.read()
            new_content = re.sub(r'(\bfrom\s+["\'].*?)\.js(["\'])', r'\1\2', content)
            new_content = re.sub(r'(\bimport\s+["\'].*?)\.js(["\'])', r'\1\2', new_content)
            new_content = re.sub(r'(\bexport\s+\*\s+from\s+["\'].*?)\.js(["\'])', r'\1\2', new_content)
            if new_content != content:
                with open(path, "w", encoding="utf-8") as fp:
                    fp.write(new_content)
                print(f"Updated {f}")
