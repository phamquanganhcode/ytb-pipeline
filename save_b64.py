"""Save an image captured from the Gemini web app without a download dialog.

In the browser pane, after window.__full holds the full-size image blob (see GEMINI_CAPTURE_JS), return
'B64START' + base64 + 'B64END' from javascript_tool; the oversized result is saved to a tool-results file.
Usage: PY save_b64.py <tool-results .txt> assets/bg-src/<name>.png
"""
import base64
import json
import re
import sys
from pathlib import Path

# Paste into javascript_tool once per page load. It removes Gemini's download iframe (so no Save dialog opens),
# then window.__click() starts the newest full-size download and window.__grab() (repeat until it is not
# "not yet") returns the image as base64.
GEMINI_CAPTURE_JS = r"""
if (!window.__cap) { window.__cap = 1;
  const of = window.fetch;
  window.fetch = async function (...a) { const r = await of.apply(this, a);
    // only the full-size PNG; previews (webp, 1024 px) load through the same fetch and URLs
    if (/image\/png/.test(r.headers.get('content-type') || '')) r.clone().blob().then(b => { window.__full = b; });
    return r; };
  const drop = () => document.querySelectorAll('iframe[sandbox*="allow-downloads"]').forEach(f => f.remove());
  new MutationObserver(drop).observe(document.documentElement, {childList: true, subtree: true}); drop();
  window.__click = () => { window.__full = null;  // start the full-size fetch; it can take 20-60 s
    const bs = document.querySelectorAll('button[aria-label^="Tải hình ảnh có kích thước"], button[aria-label^="Download full"]');
    bs[bs.length - 1].click(); return 'clicked'; };
  window.__grab = async () => {  // call again until it returns the image (javascript_tool stops at 45 s)
    for (let i = 0; i < 70 && !window.__full; i++) await new Promise(r => setTimeout(r, 500));
    if (!window.__full) return 'not yet';
    const u = new Uint8Array(await window.__full.arrayBuffer()); let s = '';
    for (let i = 0; i < u.length; i += 32768) s += String.fromCharCode.apply(null, u.subarray(i, i + 32768));
    return 'B64START' + btoa(s) + 'B64END'; };
}
"""


def main():
    parts = json.loads(Path(sys.argv[1]).read_text(encoding="utf-8"))
    text = "".join(p.get("text", "") for p in parts)
    data = base64.b64decode(re.search(r"B64START([A-Za-z0-9+/=]+)B64END", text).group(1))
    if not data.startswith(b"\x89PNG"):
        raise SystemExit("captured bytes are not a PNG")
    out = Path(sys.argv[2])
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_bytes(data)
    print(f"{out} ({len(data)} bytes)")


if __name__ == "__main__":
    main()
