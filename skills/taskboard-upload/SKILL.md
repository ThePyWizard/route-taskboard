---
name: taskboard-upload
description: Upload a finished video to the Lascade Route Taskboard so it lands in the Logbook queue for one of our Instagram accounts (@bygeoanimator, @travelanimator.usa, @geostories.daily), ready for the cofounder to post. Use when the user says "upload this to the taskboard", "send it to the logbook", "queue this for @<account>", "upload the video for bygeoanimator / travelanimator.usa / geostories.daily", or finishes a video and asks to hand it off for posting.
---

# Taskboard upload

Sends a finished video + its Instagram caption to the Route Taskboard. The file
goes to Cloudflare R2 and a row is created in Supabase (`account_posts`), so it
shows up in **Logbook → @account → Awaiting**, where it gets downloaded and
marked posted. This skill only uploads; it never posts to Instagram.

## Setup (once)

`config.json` must exist next to this file (copy `config.example.json`):
`url` = taskboard site, `key` = the upload key the admin gave you, `by` = your
name. Never print the key back to the user or commit it.

## Steps

1. **Pick the account.** If the user didn't name one, list them and ask:
   `python scripts/upload.py --accounts`
   Use the handle exactly as listed (no `@` needed).
2. **Find the final video.** Use the rendered final file (not a draft, not a
   silent/no-music version). Confirm the path exists. Formats: mp4, mov, m4v, webm.
3. **Get the caption.** Use the caption the user wrote or approved. If none
   exists, draft one (hook line + 5-10 relevant hashtags), show it, and wait for
   approval before uploading. Write it to a UTF-8 text file so emojis and line
   breaks survive the shell.
4. **Confirm once** in one line: file, account, title, first line of caption.
5. **Upload:**
   ```
   python scripts/upload.py --account <handle> --file "<video path>" \
     --caption-file "<caption.txt>" --title "<short title>"
   ```
   Add `--notes "..."` for anything the poster should know (e.g. "post after 6pm").
   Large files take a while; progress prints every 10 %.
6. **Report** the JSON result: the entry `id` and the `logbook_url`.

## Errors

- `401 Invalid or missing API key` - the key in config.json is wrong; ask the admin.
- `Unknown account` - run `--accounts` and use a listed handle.
- `No file found at video_key` - the storage upload was interrupted; just rerun.
- Re-running for the same video creates a new entry; don't retry after a success.
