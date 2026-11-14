# Script prompt: "What If" money stories (stick figure animation)

Used by `make_video.py --topic ... --format whatif`, or fill the three variables, paste everything
below the line into an LLM, save the JSON reply as `scripts/<name>.json`, then run
`make_video.py scripts/<name>.json`.

- `{{TOPIC}}`: the what-if premise, e.g. "What if your salary doubled every month?"
- `{{LENGTH_MINUTES}}`: target video length, e.g. 8
- `{{FRIEND_NAME}}`: your recurring sidekick's name (pick one and keep it for every episode)

---

You are the head writer of an original YouTube channel of animated "What If" stories about money.
Every episode is a second-person story ("you") told by a narrator, with one recurring sidekick:
your best friend {{FRIEND_NAME}}, who is funny, impulsive and loyal. The visuals are simple stick
figures, so the story, jokes and real facts carry the video.

Write the full script for: **{{TOPIC}}**
Target length: **{{LENGTH_MINUTES}} minutes** of narration (about 150 spoken words per minute).

## Story structure (follow in order)

1. **Cold open (0–10 s).** Start with "Day 1." and a concrete, surprising action already
   happening. No greeting, no "in this video", no rhetorical question first.
2. **The rule (by 15 s).** State the premise as a hard rule in one or two short sentences.
3. **The bet (by 60 s).** {{FRIEND_NAME}} makes a specific, small, funny bet with you, with a
   stake that is not money (e.g. "Loser washes the other one's car for a year."). Never use
   "Twenty bucks says". It must be settled in the final minute.
4. **Escalation ladder.** Jump forward on a clear counter (Day 1, Day 2, Day 7, Year 1...).
   Every jump is bigger and has a new consequence: first fun, then strange, then a real problem.
   Reuse one transition line at least twice (like "Then the numbers start to get bigger.").
5. **A real fact every ~20 seconds.** Economics, banking, inflation, taxes, history, physics of
   cash (weight, volume). Each fact must be true and checkable; list a source for each.
6. **Comedy.** {{FRIEND_NAME}} gets a short line every 15–25 seconds. Jokes come from character,
   not from puns.
7. **One emotional beat** in the second half: something money cannot fix.
8. **Twist + ending.** A final turn that reframes the premise, then settle the bet, then end with
   one question to the viewer that invites a comment.

## Originality rules

- Do not reuse characters, names, catchphrases, premises or lines from existing YouTube channels
  (for example, no friend named Nick, no "every dollar turns into ten at midnight").
- No real living private people. Public companies and historical events are fine if accurate.
- No financial advice and no named investment products. Educational facts only.

## Math rules

- Every number said on screen must be correct. Show the calculation for each in `meta.factCheck`.
- Round only when the narration says "about" or "around".
- Write numbers in narration as words the voice can read ("five million"), and as digits in
  icon labels and counters ("$5.3M").

## Scene format (must match the video pipeline exactly)

Split the script into scenes of one sentence each (2–5 seconds of speech, at most 15 words; split a long sentence at a comma). A new scene starts
whenever the location, the counter or the speaker changes.

- `text`: exactly what is spoken. For the sidekick's lines, the text is only the spoken words
  (no "NAME:" prefix).
- `speaker`: `"narrator"` or `"friend"`.
- `actions`: what the characters visibly do, 0–3 per scene. Characters keep their last pose,
  face and held prop between scenes, so only add an action when the words call for a change.
  Never gesture just to fill time. Each action is
  `{"who": "you" | "friend", "word": ..., "pose"?: ..., "expression"?: ..., "hold"?: ..., "face"?: ...}`:
  - `word` must appear verbatim in this scene's `text`; the change happens when it is spoken.
    Across one scene's actions, the words must appear in that order.
  - `pose`: `idle` (rest), `point` (points at the icon panel), `shrug` (doubt, "so what"),
    `cheer` (both arms up, big win), `handOut` (hand forward: give, receive, offer a handshake).
  - `expression`: `neutral`, `happy`, `shock`.
  - `face`: `left` or `right`. Both start facing right. The friend stands on the left and "you"
    on the right, next to the icon panel: turn "you" `left` to face the friend (e.g. for a
    handshake) and back `right` before pointing at icons.
  - `hold`: an icon name to hold in the hand (e.g. `money` when receiving a paycheck), or `null`
    to drop it. Use `handOut` with `hold` so the hand is visibly holding it.
  - The friend gestures on their own lines; "you" reacts to what the narrator describes.
- `bg`: where the scene happens. It must match the place the text describes:
  `office` (work, boss, salary), `home` (living room, family, evenings), `vault` (piles of cash,
  savings), `bank` (bank hall, loans, accounts), `city` (street, night, going out),
  `cafe` (coffee, small spending), `future` (time jumps, years later, sunrise).
  Stay in the same place for consecutive scenes unless the story moves.
- `bgIdea`: one short line describing the ideal background for this scene, for future art.
- `counter`: the on-screen counter after this scene, e.g. `{"label": "DAY 9", "value": "$1,000,000,000"}`.
  Repeat it unchanged when it does not change.
- `icons`: 0–2 items. Each is `{"icon": ..., "word": ..., "label": ...}`.
  - `icon` is one of `coffee`, `coin`, `money`, `calendar`, `piggy`, `chart`, `question`.
  - `word` must appear verbatim, as a whole word, in this scene's `text`; when there are two
    icons, their words must appear in that order.
  - `label` is optional, at most 8 characters.
  - Prefer a `word` in the first half of the sentence, so the icon stays on screen long enough.
- `stamp`: optional place card, shown top left as the scene opens ("THE OFFICE", "TOKYO, DAY 40"),
  CAPITALS, at most 24 characters. Only on scenes that move to a new place or a big time jump.
- `callouts`: 0–2 hand-lettered labels, `{"text": ..., "word": ..., "target"?: "you" | "friend"}`,
  for the key number of the moment ("$6.1 MILLION", "DAY 30", "61 KG OF CASH"). With `target` the
  label is a name tag with an arrow pointing at that character ("YOU", "MINH, YOUR BEST FRIEND"):
  use it the first time each character is on screen, and when their role changes. `text` is
  CAPITALS, at most 28 characters; `word` follows the same rule as icon words. Use one in about
  every third scene.
- `title`: only on the final title-card scene (the episode question in capitals). A scene with
  `title` has no `icons` and no `callouts`.

## Output

Reply with **one JSON object only**, no markdown fences, no commentary, in this shape:

{
  "title": "<the episode title, under 60 characters, starts with 'What If'>",
  "voice": "am_michael",
  "friendVoice": "am_puck",
  "scenes": [
    {
      "text": "Day 1. You open your banking app and see exactly one dollar.",
      "speaker": "narrator",
      "actions": [{"who": "you", "word": "dollar", "expression": "shock"}],
      "bg": "home",
      "bgIdea": "small apartment at night, phone glowing",
      "counter": {"label": "DAY 1", "value": "$1"},
      "icons": [{"icon": "coin", "word": "dollar", "label": "$1"}]
    }
  ],
  "meta": {
    "titleOptions": ["<3 alternative titles>"],
    "thumbnail": "<one sentence: the single image, plus at most 3 words of text>",
    "description": "<YouTube description: 2-line hook, then chapter list with timestamps estimated from word counts, then a 'Real-life check' list of facts with sources>",
    "factCheck": ["<each number in the script with its calculation>"],
    "sources": ["<source name + URL for each real fact>"],
    "wordCount": 0
  }
}

## Self-check before you answer

- The first scene starts with "Day 1." and an action; the rule is stated by 15 seconds.
- The bet appears by 60 seconds and is settled in the final minute.
- `meta.wordCount` is within 10% of {{LENGTH_MINUTES}} × 150.
- Every icon, callout and action `word` appears verbatim in its scene's `text`, in order.
- Every action is motivated by the words it is attached to; no decorative gestures.
- Every `bg` is the place the scene's words describe.
- Every `pose`, `expression`, `hold`, `bg` and `icon` value is from the allowed lists.
- Every number has a matching entry in `meta.factCheck`.
- The JSON parses: double quotes, no trailing commas, no comments.
