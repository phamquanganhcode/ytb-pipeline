# Daily run: one "Your Life as" episode, ready for human review

Run by a scheduled Claude task in the Claude desktop app, working directory `D:\youtube-video-pipeline`.
The user only reviews the finished files and uploads them to YouTube themselves.
Never upload, publish or sign in anywhere. Never delete files in `out/`, `scripts/` or `assets/`.

PY = `C:/Users/phama/.venvs/video-pipeline/Scripts/python`

## 1. Finish yesterday first

If any `scripts/life/<name>.json` has no `out/<name>.mp4`, do not write a new script today: go to step 4.

## 2. Topic

1. Run `PY daily.py next`. It prints the topic, the script path and writes `out/daily_prompt.md`.
2. If it says fewer than 5 topics are left (or none), append 10 new names to `topics/life.txt` first:
   real people from the history of money (financiers, fraudsters, inventors of money ideas, merchants),
   dead for at least 50 years, with a well-documented life, a dramatic turning point, and not already
   in the list. Mix eras and countries. Then run `PY daily.py next` again.

## 3. Script

1. Read `out/daily_prompt.md` and follow it exactly: write the JSON yourself to the printed script path.
   Check years, amounts and quotes against real sources with web search where you can.
2. Run `PY daily.py check <script path>`. Fix every error it reports and rerun until it prints `ok`.

## 4. Art

1. Run `PY batch.py scripts/life`. It lists missing art in `out/faces_todo.md`, `out/bg_todo.md` and
   `out/thumb_todo.md` (each file exists only when something is missing).
2. Make every listed image in gemini.google.com in the built-in browser (the user is signed in), using
   the prompts in those files as written, each prefixed with "Create an image. ". Paste
   `prompts/gemini_web.js` into javascript_tool once per page load and follow its header: `__send`
   (with the style reference attached), `__wait`, then `__at(-1)` returns the shown image as PNG
   (1024 px, enough for faces, backgrounds and thumbnails), then
   `PY save_b64.py <tool-results file> <exact path from the todo file>`. Use `__newchat()` between
   images instead of reloading. Do not use the full-size download button: it hangs (checked 2026-11-11).
   Order: "you" faces with all expressions, other faces neutral only, backgrounds, thumbnail;
   the daily image limit (reply "I can create more images as soon as your limit resets") usually
   ends the session before everything is made, so the most needed images go first.
   - Faces: one new chat per face; ask for happy and shock in the same chat. Save to
     `assets/faces-src/<face>_<expression>.png`. The green screen is keyed out by batch.py.
   - Backgrounds: `assets/bg-src/<name>.png`. Thumbnails: `assets/thumbs-src/<name>.png`.
   - Look at each image before saving it: wrong era, text in the picture, extra people or a missing
     green background means generate it again (at most 3 tries, then leave it for the user).
3. If Gemini refuses, hits a limit or the page will not load, stop here and report what is missing.

## 5. Render

Run `PY batch.py scripts/life` again in the background (rendering takes a while) and wait for it.
It renders `out/<name>.mp4`, `out/<name>.srt` and `out/<name>_thumb.jpg`.

## 6. Hand-off

1. Write `out/<name>_facts.md`: a Markdown table of every checkable claim (scene number, claim, verdict
   WELL-DOCUMENTED / DISPUTED / LIKELY WRONG / UNKNOWN, source). Put LIKELY WRONG and DISPUTED first.
2. Run `PY daily.py upload scripts/life/<name>.json` to write `out/<name>_upload.md`.
3. Report in 3-5 lines: episode, files ready, anything flagged or missing.
