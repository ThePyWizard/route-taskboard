#!/usr/bin/env python3
"""Upload a finished video to the Route Taskboard Logbook for one Instagram account.

Standard library only (works on Windows/macOS/Linux with Python 3.8+).

  python upload.py --accounts
  python upload.py --account bygeoanimator --file final.mp4 \
      --caption-file caption.txt --title "Iceland ring road" --by "Rohit"

Config (first match wins): --url/--key flags, TASKBOARD_URL / TASKBOARD_UPLOAD_KEY
env vars, or config.json next to this skill: {"url": "...", "key": "...", "by": "..."}
"""
import argparse, json, os, sys, urllib.error, urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
CONFIG = os.path.join(os.path.dirname(HERE), "config.json")


def load_config(args):
    cfg = {}
    if os.path.exists(CONFIG):
        with open(CONFIG, encoding="utf-8") as f:
            cfg = json.load(f)
    url = args.url or os.environ.get("TASKBOARD_URL") or cfg.get("url")
    key = args.key or os.environ.get("TASKBOARD_UPLOAD_KEY") or cfg.get("key")
    if not url or not key:
        sys.exit(f"Missing taskboard url/key. Fill in {CONFIG} (see config.example.json).")
    return url.rstrip("/"), key, cfg.get("by")


def api(base, key, method, path, body=None):
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(base + path, data=data, method=method, headers={
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json",
        "User-Agent": "taskboard-upload-skill/1.0",
    })
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            return json.loads(r.read())
    except urllib.error.HTTPError as e:
        try:
            msg = json.loads(e.read()).get("error")
        except Exception:
            msg = e.reason
        sys.exit(f"{method} {path} failed ({e.code}): {msg}")


class Progress:
    def __init__(self, f, total):
        self.f, self.total, self.sent, self.last = f, total, 0, -1

    def read(self, n=-1):
        chunk = self.f.read(1024 * 1024 if n is None or n < 0 else n)
        self.sent += len(chunk)
        pct = int(self.sent * 100 / self.total) if self.total else 100
        if pct // 10 != self.last // 10:
            print(f"  uploading... {pct}%", file=sys.stderr, flush=True)
            self.last = pct
        return chunk

    def __len__(self):
        return self.total


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--accounts", action="store_true", help="list valid account handles")
    p.add_argument("--account", help="instagram handle, e.g. bygeoanimator")
    p.add_argument("--file", help="path to the final video (.mp4/.mov)")
    p.add_argument("--caption", default=None)
    p.add_argument("--caption-file", default=None)
    p.add_argument("--title", default=None)
    p.add_argument("--notes", default=None)
    p.add_argument("--by", default=None, help="uploader name")
    p.add_argument("--url"); p.add_argument("--key")
    a = p.parse_args()
    base, key, cfg_by = load_config(a)

    if a.accounts:
        for acc in api(base, key, "GET", "/api/uploads/accounts")["accounts"]:
            print(f"{acc['handle']}\t{acc.get('display_name') or ''}")
        return

    if not a.account or not a.file:
        sys.exit("--account and --file are required (or use --accounts).")
    if not os.path.isfile(a.file):
        sys.exit(f"File not found: {a.file}")
    caption = a.caption
    if a.caption_file:
        with open(a.caption_file, encoding="utf-8") as f:
            caption = f.read().strip()

    init = api(base, key, "POST", "/api/uploads/init",
               {"account": a.account, "filename": os.path.basename(a.file)})

    size = os.path.getsize(a.file)
    print(f"Uploading {os.path.basename(a.file)} ({size / 1e6:.1f} MB) to @{a.account.lstrip('@')}",
          file=sys.stderr)
    with open(a.file, "rb") as f:
        put = urllib.request.Request(init["upload_url"], data=Progress(f, size), method="PUT",
                                     headers={"Content-Length": str(size), "Content-Type": "video/mp4"})
        try:
            with urllib.request.urlopen(put, timeout=3600) as r:
                if r.status not in (200, 201):
                    sys.exit(f"Storage upload failed: HTTP {r.status}")
        except urllib.error.HTTPError as e:
            sys.exit(f"Storage upload failed ({e.code}): {e.read()[:300]!r}")

    done = api(base, key, "POST", "/api/uploads/complete", {
        "account": a.account, "video_key": init["video_key"], "caption": caption or "",
        "title": a.title, "notes": a.notes, "uploaded_by": a.by or cfg_by,
    })
    print(json.dumps(done, indent=2))


if __name__ == "__main__":
    main()
