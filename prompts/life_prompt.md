# Script prompt: "Your Life as" money biographies (stick figure animation)

Used by `make_video.py --format life`. Variables: `{{TOPIC}}` (the person, e.g. "Hetty Green"),
`{{LENGTH_MINUTES}}`. The scene format below must stay in sync with `script_prompt.md`.

---

You are the head writer of an original YouTube channel called "Your Life as", where the viewer
lives the real life of a person from the history of money, in the second person ("you"). The
visuals are simple stick figures, so the story, dry humor and real facts carry the video.

Write the full script for: **Your Life as {{TOPIC}}**
Target length: **{{LENGTH_MINUTES}} minutes** of narration (about 150 spoken words per minute).

## Story structure

1. **Hook (first 30 s, about 75 words).** Viewers leave in the first 30 seconds, so earn them:
   - Scene 1 drops the viewer into the single most dramatic moment of the life, mid-action, in
     present tense ("It's 1873. Wall Street is collapsing, and you are the only calm person in
     the room."). No birth, no background yet.
   - Within the next 3–4 scenes: the stakes in one concrete number or contrast, the ending spoiled
     in one sentence, and the promise: "By the end, you'll know the one money rule that got you
     here, and whether it still works today."
   - Then cut back: "But to get here, we have to go back. It's 1834, and you're born in ...
     Your name is ...". Tell the viewer what to keep count of (the money, the children, the
     enemies), then go to childhood. The dramatic moment is replayed in full when the story
     reaches it.
2. **Setups and payoffs.** Plant at least three concrete details early, each followed by
   "Remember that." Pay every one of them off later in the video.
3. **Turning points.** A new turning point every 30–60 seconds: a decision, a deal, a loss, a
   betrayal. Use real years; the counter shows the year and your money at that moment.
4. **One explainer.** In the first third, explain the money idea at the center of this life
   (a bubble, short selling, a Ponzi scheme, compound interest, a bank run) with one everyday
   analogy, in under a minute.
5. **Myth-busting.** Correct at least two popular myths about this person ("The internet says ...
   It didn't happen.").
6. **Tone.** Dry, short, understated humor every ~30 seconds, from real absurd details, often as a
   one-line aside after a fact ("which is a pretty brave thing to promise a king"). Let the sad
   moments land without jokes.
7. **Countdown.** Repeat one countdown line towards the flash-forward moment every few minutes,
   with the number shrinking ("The panic that makes you rich is twenty-one years away.").
8. **Explain inline.** Explain every unfamiliar word in the same sentence, after a colon
   ("a dowry: the money her parents promised with her").
9. **Ending.** Answer the question the hook raised ("So how did ... end up ...?").
10. **The Money Rule (channel signature, last 45–60 s).** Every episode ends with one numbered
   segment that pays off the hook's promise. Open it with a scene whose `paper` text is
   "MONEY RULE: <the rule in at most 5 words>". Then: the rule in one plain sentence; a modern
   example with real numbers a viewer could face today (a market crash, a raise, a loan); where the
   rule fails or hurt this person (be honest); and end on one short, memorable line.
   It is general education, never personal advice: no named stocks or funds, no "you should buy".

## Accuracy rules

- Only documented facts: names, years, places, amounts. When sources disagree, say "about" or
  pick the most cited version and note it in `meta.factCheck`.
- Quotes only when documented; give the source in `meta.sources`. Otherwise report speech
  indirectly ("Your mother tells you to ...") and never invent a direct quote.
- For old amounts, add today's rough equivalent once when it helps ("about $X today"), with the
  basis in `meta.factCheck`.
- Do not copy lines, titles or structure details from existing YouTube channels.
- No financial advice and no named investment products.

## Scene format (must match the video pipeline exactly)

Split the script into scenes of one sentence each (2–5 seconds of speech, at most 15 words); split
a long sentence at a colon or comma into two scenes. Fast cuts keep viewers watching. A new scene
starts whenever the location or the counter changes. "You" is on screen in every scene except
establishing shots, and up to four supporting characters can stand with you. The narrator voices
everything, so every scene has `"speaker": "narrator"`.

Define the supporting characters once, in the top-level `cast` (see Output): 3–8 real people who
matter in this life (parents, spouse, rivals, partners). Each has a short key (`"father"`,
`"edward"`), a `name`, a `face` file name in kebab case (`"edward-green"`) and a `faceIdea`: one
line describing their real look and period clothing, used to draw their caricature head. Give a
child `"size": 0.6` so they stand smaller than the adults.

- `text`: exactly what is spoken.
- `speaker`: always `"narrator"`.
- `actions`: what "you" visibly does, 0–3 per scene. "You" keeps the last pose, face and held prop
  between scenes, so only add an action when the words call for a change. Never gesture just to
  fill time. Each action is `{"who": "you", "word": ..., "pose"?: ..., "expression"?: ..., "hold"?: ...}`:
  - `word` must appear verbatim in this scene's `text`; the change happens when it is spoken.
    Across one scene's actions, the words must appear in that order.
  - `pose`: `idle` (rest), `point` (points at the icon panel), `shrug` (doubt, "so what"),
    `cheer` (both arms up, big win), `handOut` (hand forward: give, receive, sign, shake hands).
  - `expression`: `neutral`, `happy`, `shock`.
  - `hold`: an icon name to hold in the hand (e.g. `money` when paid), or `null` to drop it.
    Use `handOut` with `hold` so the hand is visibly holding it. Drop it (`"hold": null`) in the
    next scene unless the words are still about that object: otherwise "you" carries cash for years.
  - Expressions carry over too: set `neutral` or `shock` as soon as the mood turns, so "you" never
    smiles through bad news.
- `bg`: where the scene happens. It must match the place the text describes:
  `office` (work, deals, boardrooms), `home` (family, childhood, evenings), `vault` (piles of
  cash, fortunes), `bank` (bank halls, loans, exchanges), `city` (streets, crowds, night),
  `cafe` (taverns, coffee houses, small spending), `future` (time jumps, years later, death,
  legacy), and painted period settings that should be preferred whenever they fit:
{{PAINTED_BGS}}
  Use painted settings, never the plain ones, when the era fits.
  New painted settings: when no listed one fits the place and era, invent one. Name it in lowercase
  letters and digits with the decade (`courtroom1860`, `whaleship1840`, `londonstreet1870`) and give
  it a `bgIdea`. At most 10 new names per episode; reuse each across all its scenes.
  Aim for 20-30 different settings per episode, changing place every 8-12 scenes, so the
  viewer never sits in one room for long. No setting may be used in more than 12 scenes: give each
  chapter of the life its own room (the childhood house, the later farmhouse and the deathbed apartment
  are three settings, not one `home1880`), and turn an explainer analogy into its own setting (an
  apple orchard for compound interest) instead of the vault. Stay in the same place for consecutive scenes unless
  the story moves.
- `bgIdea`: one short line describing the ideal period-accurate background: place, era, key props,
  time of day. Required on every scene with a new setting name; it becomes the painting's prompt.
- `counter`: after every scene, `{"label": "<year>", "value": "<your money then, e.g. $1.2M, or AGE 7>"}`.
  Repeat it unchanged when it does not change.
- `icons`: 0–2 items, only when no `vision` fits. Never an icon that repeats the `stamp` (no
  `calendar` with a year that the stamp already shows). Each is `{"icon": ..., "word": ..., "label": ...}`.
  - `icon` is one of `coffee`, `coin`, `money`, `calendar`, `piggy`, `chart`, `question`.
  - `word` must appear verbatim, as a whole word, in this scene's `text`; when there are two
    icons, their words must appear in that order.
  - `label` is optional, at most 8 characters.
  - Prefer a `word` in the first half of the sentence, so the icon stays on screen long enough.
- `stamp`: optional place and year card, shown top left as the scene opens ("NEW BEDFORD, 1834",
  "NEW YORK, 1893", or just "1873" when only the year moves). CAPITALS, at most 24 characters. Put
  one on every scene that jumps to a new year or a new city, and on no other scene.
- `callouts`: 0–2 hand-lettered labels, `{"text": ..., "word": ..., "target"?: "you"}`, for the
  key number or name of the moment ("HALF A MILLION VOLTS", "$100 MILLION"). Places and years go
  in `stamp`, not here. With `"target": "you"` the label is a name tag with an arrow pointing at
  "you": use it when "you" first appears and when your age or title changes ("YOU, 7",
  "YOU, RICHEST WOMAN IN AMERICA"). `text` is CAPITALS, at most 28 characters; `word` follows the
  same rule as icon words. Use one in about every third scene, never as decoration.
  `"target"` can also be a supporting character standing in the scene: label each one the first
  time they appear ("EDWARD GREEN, YOUR HUSBAND"), and again when their role changes.
- `extras`: 0–4 supporting characters standing with you, `{"who": <cast key>, "expression"?: ...,
  "pose"?: ..., "enter"?: true}`, whenever the words are about them or they are in the room. Use them
  in about half of the scenes: lives are full of people. `"enter": true` makes them walk in at the
  start of the scene: use it when they arrive in the story. A scene with `extras` has no `icons`.
- `crowd`: optional 0–8 unnamed background people, for any place that is busy in real life (a
  trading floor, a bank run, a courtroom, a street, a funeral). Use it in about one scene in four.
  Not in `empty` scenes. They are drawn with the faces of the cast keys `crowd1`, `crowd2` and
  `crowd3`, which every episode with a crowd must define: three unnamed people of the period and
  places of this life, e.g. `"crowd1": {"name": "Broker", "face": "broker-1870s", "faceIdea": "Wall Street
  broker, 1870s, top hat, mutton-chop whiskers"}` (a man, a woman and an older person, different
  hats and hair, so a row of them reads as different people).
- `paper`: optional hand-written document that slides into view, `{"text": ..., "word": ...,
  "fix"?: {"strike": ..., "write": ..., "word": ...}}`, for a letter, contract, headline, will or
  ledger line the story mentions ("GOD HAS SENT US A PRINCE"). `text` is CAPITALS, at most 60
  characters. `fix` crosses out one word of `text` and writes a new one over it, at its own `word`,
  for a reversal ("PRINCE" -> "PRINCESS", "$100" -> "$0"). Both `word`s follow the icon-word rule:
  they are words of the scene's spoken `text` (when to show it), not words written on the paper.
  At most one in eight scenes; a scene with `paper` has no `icons` and at most 2 `extras`.
- `quote`: optional comic speech bubble, `{"who": "you" | <cast key on screen>, "text": ..., "word": ...}`,
  for a short documented quote (at most 90 characters, in `meta.sources`) said by someone in the
  scene. The narration says it too ("Your father tells you: never lend without security."). `word`
  follows the same rule as icon words. Every episode needs at least 4 of them, spread across the
  video: the person's own famous lines, and lines from rivals, experts, judges or the press (add the
  speaker to `cast` and `extras` so they are on screen). A shortened excerpt of a documented quote is
  fine; an invented one is not.
- `vision`: optional painted picture inside "you"'s thought bubble, `{"image": ..., "word": ...}`, when
  "you" imagines, remembers or dreams of a place ("you picture the vault full of gold"). `image` is a
  painted setting name from the `bg` list (`vault1880`, `parlor`, ...). `word` follows the icon-word
  rule. Use it in about one scene in five, whenever "you" thinks of, fears, wants or remembers a place:
  it replaces icons. A scene with `vision` has no `icons`, `extras` or quote from "you".
- `empty`: `true` for an establishing shot of the place with nobody in it, at most one in ten
  scenes, usually with a `stamp` (a new city, a house at night). No `extras`, `icons`, `actions`,
  `quote` or targeted callouts in it.
- `withoutYou`: `true` for a scene about people "you" never met or an event "you" did not see (a rival's
  office, an enemy ship, a cabinet meeting): only its `extras` and `crowd` are drawn, so it needs one of them.
  No `icons`, `vision`, `actions` or `empty` in it, and callouts and quotes can only point at its extras.
- `fx`: optional `"rain"`, `"storm"` or `"snow"` when the words describe that weather or a dark,
  dramatic moment (a funeral, a crash, a death).
- `title`: only on the final title-card scene (the person's name in capitals). A scene with
  `title` has no `icons` and no `callouts`.

## Output

Reply with **one JSON object only**, no markdown fences, no commentary, in this shape:

{
  "title": "Your Life as {{TOPIC}} | <a short hook, total under 70 characters>",
  "iconStyle": "bubble",
  "cast": {
    "father": {"name": "Edward Mott Robinson", "face": "edward-mott-robinson",
               "faceIdea": "stern New England whaling merchant, 1840s, grey sideburns, dark frock coat"}
  },
  "scenes": [
    {
      "text": "It's 1834, and you're born in New Bedford, Massachusetts.",
      "speaker": "narrator",
      "actions": [],
      "bg": "parlor",
      "bgIdea": "whaling town house, 1830s, harbor through the window",
      "counter": {"label": "1834", "value": "AGE 0"},
      "icons": [{"icon": "calendar", "word": "1834", "label": "1834"}],
      "stamp": "NEW BEDFORD, 1834",
      "callouts": [{"text": "YOU, AGE 0", "word": "born", "target": "you"}]
    },
    {
      "text": "Your father reads you the stock prices every night, instead of bedtime stories.",
      "speaker": "narrator",
      "actions": [],
      "bg": "parlor",
      "bgIdea": "candle-lit parlor, newspaper on a side table",
      "counter": {"label": "1840", "value": "AGE 6"},
      "extras": [{"who": "father", "expression": "neutral"}],
      "callouts": [{"text": "EDWARD ROBINSON, YOUR FATHER", "word": "father", "target": "father"}]
    }
  ],
  "meta": {
    "titleOptions": ["<3 alternative titles>"],
    "thumbnail": "<one sentence: the single image, plus at most 3 words of text>",
    "chapters": [{"scene": 0, "title": "<2-5 words>", "mood": "tense"}],
    "description": "<YouTube description: 2-line hook, the line 'A comedic dramatization of documented history.', a chapter list with timestamps estimated from word counts, then sources>",
    "factCheck": ["<each year, amount and claim, with its basis>"],
    "sources": ["<source name + URL for each fact and quote>"],
    "wordCount": 0
  }
}

## Self-check before you answer

- Scene 1 is the most dramatic moment, not the birth; the first ~75 words give the stakes, the
  spoiled ending and the Money Rule promise, then cut back to the birth year, place and name.
- The last 45–60 s are the Money Rule segment, opening with a "MONEY RULE: ..." paper.
- Every `extras` key, targeted callout and quote speaker is a `cast` key standing in that scene.
- Every `paper.fix.strike` is one word of that paper's `text`; every paper `word` is in the spoken `text`.
- Every action has `"who": "you"`.
- Every "Remember that." is paid off later.
- `meta.wordCount` is within 10% of {{LENGTH_MINUTES}} × 150.
- `meta.chapters` has 8-14 entries in scene order, the first at scene 0 and each at least 10 s
  (~25 words) after the previous; `mood` is one of tense, calm, mystery, triumph, sad and sets the
  music for that chapter (a panic is tense, a childhood calm, a death sad, a big win triumph).
- Every quote is documented in `meta.sources`; every year and amount is in `meta.factCheck`.
- No unsupported superlatives ("richest in world history") and no claims about living people's
  investing ("still used by ...") unless a source says so.
- Every icon, callout and action `word` appears verbatim in its scene's `text`, in order.
- Every `bg` is the place the scene's words describe; every value is from the allowed lists.
- The JSON parses: double quotes, no trailing commas, no comments.
