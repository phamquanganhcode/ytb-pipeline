# English 2D Comic Explainer Script Prompt (Lóng-Style Formula)

You are writing a high-retention English YouTube explainer script for a faceless 2D comic-mascot channel (inspired by **Lóng / @Longngghienn**, adapted for global English audiences).

## 1. Voice, Pacing & Tone
- **Persona:** Smart, witty friend breaking down a massive news/finance/tech story over coffee—casual, deadpan humor, zero academic stiffness, yet backed by real primary sources.
- **Target Pacing:** **175–195 English words/minute** (crisp, punchy sentences, zero filler). Full episodes target **14–18 minutes (~2,600–3,200 words)**; demo/short episodes target **2–4 minutes (~400–750 words)**.
- **Scene Length & Micro-Pacing Rule (Mandatory):** Keep each scene to **≤ 30–35 spoken words (~10–12 seconds)** so visuals change constantly. If a scene must run longer than 12 seconds, include **at least 2 internal `cueWord` triggers** (`headlineCueWord`, `sublineCueWord`, `mascotCueWord`, actor `cueWord`/`speechCueWord`, or item/bullet `cueWord`) spaced 4–6 seconds apart.
- **"But / Therefore" Rule:** Connect beats via conflict (`but`, `yet`, `however`) or consequence (`so`, `therefore`, `because`)—never string events together with `"and then ... and then ..."`.
- **Analogy Density (Mandatory):** Insert **at least 1 vivid everyday analogy every 90–120 seconds** to translate complex tech/finance into street-level logic (e.g., *hospital waiting-room tickets*, *pawning a stolen Rolex*, *writing your alarm code on a Post-it on the front door*).
- **Curiosity Bridges & Rehooks (~30% and ~50% mark):** Never end a section flat—always bridge to the next beat with a sharp open question (*"Wait—if they didn't steal the private keys, how did they move $6 billion?"*). Plant explicit rehooks around 30% and 50% runtime (tag `"rehook": true`) reminding viewers of the central mystery.
- **Thumbnail ↔ Opening Alignment:** Directly validate the key number or hook in `thumbnail.headline` within the first 2 scenes (0–35s) so viewers know immediately they clicked the right video.
- **Epistemic Guardrails:** When citing investigations or allegations, keep an objective hedge (*"according to preliminary reports," "investigators allege," "this is still unfolding"*).

## 2. The 9-Act Narrative Blueprint
1. **Relatable Comedy Hook (0:00–0:35):** Do NOT open with a dry news headline. Start with a funny, relatable pain point (`comic_skit` with chibi characters + speech bubble).
2. **Pivot + 3 Open Loops + Quick Disclaimer (0:35–1:25):** *"Think that's rough? Something way wilder just happened..."* Reveal the headline shock stat (`stock_cutaway`), pose 3 unanswered questions, introduce the mascot host, and give a 1-sentence humble disclaimer (`mascot_commentary`).
3. **Scale & History (1:25–3:00):** Prove why the target is massive (`grid_explainer` on `light_paper`) and cite 1–2 past incidents to raise the stakes.
4. **Chronological Escalation (3:00–5:00):** Walk through the incident minute-by-minute (`grid_explainer` on `dark_grid`) and end on a technical paradox.
5. **Initial Fallout (5:00–6:00):** Leadership response + curiosity bridge (*"Wait—where do you even get $6 billion to pay everyone back?"*).
6. **Technical Breakdown via Analogies (6:00–9:30):** Alternate `source_receipt` (primary report with animated yellow highlight), `concept_card` (plain-English definition), and `comic_skit` (everyday analogy).
7. **Cat-and-Mouse Twist (9:30–11:15):** Show the counter-move (freezes vs. laundering / swaps) using `source_receipt` + `comic_skit` analogy.
8. **Who Done It? (11:15–13:00):** Suspect profile + 4–5 red-square `bullet_breakdown` clues + memorable one-liner quote (`mascot_commentary`).
9. **Audience Takeaway + 3-Point Recap + 5s Outro (13:00–15:30):** Localize to the viewer's wallet/life, give 2–3 practical takeaways, close with `recap_cards` (3 icons on `dark_grid`), and a 5-second CTA.

## 3. Available Scene Kinds (`scripts/comic/*.json`)
- `comic_skit`: `backdrop` (`candlestick_chart` | `office` | `living_room` | `bank_counter` | `light_paper` | `dark_grid`), `actors` (`role`, `mood`, `label`, `speech`), optional `mascot`, `mascotFocus`.
- `stock_cutaway`: `mediaQuery` (`query`, `credit`), `eyebrow`, `headline`, `subline`, optional `mascot`.
- `grid_explainer`: `backdrop` (`dark_grid` | `light_paper`), `headline`, `items` (`icon`, `label`, `sublabel`, `crossedOut`, `arrowToNext`), optional `mascot`.
- `concept_card`: `backdrop` (`light_paper`), `headline` (term), `subline` (plain-English meaning), `items`.
- `source_receipt`: `articleTitle`, `excerpt`, `highlight`, `cueWord`, `source`, optional `mascot`.
- `bullet_breakdown`: `backdrop` (`light_paper` | `dark_grid`), `headline`, `bullets` (4–5 short lines), `mascot`.
- `recap_cards`: `headline`, `items` (3 summary icons + short uppercase labels).
- `mascot_commentary`: `backdrop` or `mediaQuery`, `headline`, `subline`, `mascot` (`explaining` | `pointing` | `shades` | `deadpan` | `shocked` | `skeptical`).

## 4. Packaging Rules
- **Title:** `"Everything You Need to Know About [Event] in [X] Minutes"` or `"How [Massive Thing] Collapsed"`.
- **Thumbnail (`thumbnail` object — Editorial Photo-Collage standard):**
  - `headline`: 1–3 words ALL CAPS with a shock number (e.g. `"-6 BILLION"` or `"-$8 BILLION"`).
  - `subline`: 2–3 words ALL CAPS for the red torn-tape strip (e.g. `"10 DAYS"`, `"ONE UPDATE"`).
  - `mediaQuery`: Real-world editorial photo-collage scene description (real photographic cutouts, torn paper/balance-sheet clippings, yellow highlighter swipe, red marker circle/arrow — NO cartoon mascot or UI boxes on the thumbnail).

## 5. Unified Background Art Style Template (Mandatory for ALL Generated Backgrounds)
Whenever generating a new room/location background for any episode, ALWAYS reuse this exact style prefix so every scene looks like it belongs to the same show:
> `16:9 widescreen clean modern 2D vector comic interior background, flat-color webcomic explainer style matching a bright tidy anime/vector office: clean thin dark ink outlines, soft pastel cream/warm beige and light-blue palette, bright even daylight, subtle cel-shading, uncluttered lower third so foreground characters stand out cleanly. NO muddy sepia/brown tones, NO text, NO letters, NO numbers, NO logos, NO people.`
