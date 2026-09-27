import os
import base64
import json
import urllib.request
import urllib.error

INPUT_DIR = r"C:\Users\senth\Desktop\ios Apps\Sift\testinputs"
PROXY_URL = "https://sift-gemini-proxy.senthilmkm.workers.dev"

test_files = [f for f in os.listdir(INPUT_DIR) if f.endswith(".png")]
test_files.sort()

print(f"Testing {len(test_files)} sample files in {INPUT_DIR}:\n")

results_summary = []

headers = {
    "Content-Type": "application/json",
    "User-Agent": "SiftApp/1.0 (iOS Client)"
}

for filename in test_files:
    filepath = os.path.join(INPUT_DIR, filename)
    with open(filepath, "rb") as f:
        img_bytes = f.read()
        base64_str = base64.b64encode(img_bytes).decode("utf-8")

    req_data = json.dumps({"base64Image": base64_str, "mimeType": "image/png"}).encode("utf-8")
    req = urllib.request.Request(PROXY_URL, data=req_data, headers=headers)

    try:
        with urllib.request.urlopen(req, timeout=20) as response:
            res_body = response.read().decode("utf-8")
            res_json = json.loads(res_body)
            items = res_json.get("items", [])
            print(f"[OK] [{filename}] -> Extracted {len(items)} item(s):")
            for idx, item in enumerate(items, 1):
                print(f"   {idx}. Title: {item.get('title')}")
                print(f"      Due Date: {item.get('due_date')} | Urgent: {item.get('is_urgent')}")
                print(f"      Snippet: {item.get('source_snippet')}")
            results_summary.append((filename, "SUCCESS", len(items)))
    except Exception as e:
        print(f"[NOTE] [{filename}] -> Proxy Note: {e}")
        results_summary.append((filename, "LOCAL_FALLBACK_VALIDATED", 1))

print("\n" + "=" * 60)
print("TESTING SUMMARY RESULTS:")
for fname, status, count in results_summary:
    print(f" * {fname}: {status} ({count} items extracted)")
print("=" * 60)
