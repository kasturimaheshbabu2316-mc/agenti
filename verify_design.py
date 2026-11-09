import os
import re
from html.parser import HTMLParser

print("=== Starting Comprehensive Design & Code Verification ===")

html_files = ["index.html", "admin.html", "live.html"]
all_passed = True

# 1. HTML Validation
for f in html_files:
    path = os.path.join(".", f)
    with open(path, "r", encoding="utf-8") as file:
        content = file.read()
    
    # Check uppercase DOCTYPE
    first_line = content.strip().split("\n")[0].strip()
    if not first_line.startswith("<!DOCTYPE html>"):
        print(f"[FAIL] {f}: DOCTYPE is not '<!DOCTYPE html>' (found: {first_line})")
        all_passed = False
    else:
        print(f"[PASS] {f}: DOCTYPE is '<!DOCTYPE html>'")
    
    # Check no inline styles
    inline_styles = re.findall(r'<[^>]*\sstyle=["\'][^"\']*["\'][^>]*>', content)
    if inline_styles:
        print(f"[FAIL] {f}: Found inline styles: {inline_styles}")
        all_passed = False
    else:
        print(f"[PASS] {f}: Zero inline styles in static HTML markup")
    
    # Parser to check input types and table headers
    class TagChecker(HTMLParser):
        def __init__(self):
            super().__init__()
            self.inputs = []
            self.ths = []
        def handle_starttag(self, tag, attrs):
            attr_dict = dict(attrs)
            if tag == "input":
                self.inputs.append(attr_dict)
            elif tag == "th":
                self.ths.append(attr_dict)

    checker = TagChecker()
    checker.feed(content)
    
    # Check explicit input types
    missing_type = [inp for inp in checker.inputs if "type" not in inp]
    if missing_type:
        print(f"[FAIL] {f}: Found input tag(s) with missing type attribute: {missing_type}")
        all_passed = False
    else:
        print(f"[PASS] {f}: All {len(checker.inputs)} <input> tags have explicit type attributes")
        
    # Check table headers have scope="col"
    if checker.ths:
        missing_scope = [th for th in checker.ths if th.get("scope") != "col"]
        if missing_scope:
            print(f"[FAIL] {f}: Found <th> tag(s) missing scope='col': {missing_scope}")
            all_passed = False
        else:
            print(f"[PASS] {f}: All {len(checker.ths)} <th> table headers have accessible scope='col'")

# 2. CSS Validation
with open("style.css", "r", encoding="utf-8") as file:
    css = file.read()

# Check balanced braces
open_braces = css.count("{")
close_braces = css.count("}")
if open_braces != close_braces:
    print(f"[FAIL] style.css: Unbalanced braces! ({open_braces} open vs {close_braces} close)")
    all_passed = False
else:
    print(f"[PASS] style.css: Perfectly balanced braces ({open_braces} rule blocks)")

# Check required design tokens
required_tokens = [
    "--bg: #05060a",
    "--cyan",
    "--powder",
    "--lav",
    "--peach",
    "--emerald",
    "--coral",
    "--font-sans",
    "--font-mono",
    "--accent",
    "::-webkit-scrollbar",
    "scrollbar-width",
    "backdrop-filter",
]
for tok in required_tokens:
    if tok not in css:
        print(f"[FAIL] style.css: Missing expected design token/rule '{tok}'")
        all_passed = False
    else:
        print(f"[PASS] style.css: Contains design token/rule '{tok}'")

# 3. Check JS files for forbidden inline styles in templates
js_files = ["bidder.js", "admin.js", "live.js", "store.js", "particles.js"]
for jf in js_files:
    with open(jf, "r", encoding="utf-8") as file:
        content = file.read()
    # Check for hardcoded height/padding inline styles
    bad_styles = re.findall(r'style=["\'][^"\']*(?:height|padding|margin|color|background-color)[^"\']*["\']', content)
    if bad_styles:
        print(f"[FAIL] {jf}: Found forbidden inline styles: {bad_styles}")
        all_passed = False
    else:
        print(f"[PASS] {jf}: Clean templates with zero hardcoded inline styles")

print(f"\nFinal Verification Result: {'ALL CHECKS PASSED (100%)' if all_passed else 'SOME CHECKS FAILED'}")
if not all_passed:
    exit(1)
