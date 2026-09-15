import json
import re
import base64
import os

images_dir = "/Users/takashitoyama/.gemini/antigravity-ide/scratch/toyaji-art-work/images"
works_file = "/Users/takashitoyama/.gemini/antigravity-ide/scratch/toyaji-art-work/data/works.json"
log_path = "/Users/takashitoyama/.gemini/antigravity-ide/brain/b87dace8-0479-4b94-8796-605c470d09fd/.system_generated/logs/transcript_full.jsonl"

with open(log_path, "r", encoding="utf-8", errors="ignore") as f:
    text = f.read()

pos = text.rfind("iVBORw0KGgo")
print("Found base64 header at pos:", pos)
if pos != -1:
    # Find the end of base64 string (ends before quote, backslash, or newline)
    end = pos
    while end < len(text) and text[end] in "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=":
        end += 1
    
    b64_str = text[pos:end]
    print(f"Extracted base64 string length: {len(b64_str)}")
    img_bytes = base64.b64decode(b64_str)
    
    img_path = os.path.join(images_dir, "b_boy_2026.png")
    with open(img_path, "wb") as img_f:
        img_f.write(img_bytes)
    print(f"Successfully decoded and saved image: images/b_boy_2026.png ({len(img_bytes)} bytes)")

    with open(works_file, "r", encoding="utf-8") as wf:
        current_works = json.load(wf)

    new_item = {
        "id": "work-1788682269556",
        "title": "I am B-Boy 2026 ver",
        "category": "digital",
        "categoryLabel": "デジタルイラスト",
        "image": "images/b_boy_2026.png",
        "year": "2026",
        "client": "自主制作",
        "tools": "adobe illustrator",
        "description": "10年以上前にアナログで描いたイラストをデジタルで描き直しました"
    }

    # remove old if any and insert to top
    current_works = [w for w in current_works if w.get("id") != "work-1788682269556"]
    current_works.insert(0, new_item)

    with open(works_file, "w", encoding="utf-8") as wf:
        json.dump(current_works, wf, ensure_ascii=False, indent=2)
    print("Successfully updated data/works.json!")
