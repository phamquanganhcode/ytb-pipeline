# English 2D Comic Explainer Script Prompt (Lóng-Style Formula)

You are writing a high-retention English YouTube explainer script for a faceless 2D comic-mascot channel (inspired by **Lóng / @Longngghienn**, adapted for global English audiences).

## 1. Voice, Pacing & Tone
- **Persona:** Smart, witty friend breaking down a massive news/finance/tech story over coffee—casual, deadpan humor, zero academic stiffness, yet backed by real primary sources.
- **Target Pacing:** **175–195 English words/minute** (crisp, punchy sentences, zero filler). Full episodes target **14–18 minutes (~2,600–3,200 words)**; demo/short episodes target **2–4 minutes (~400–750 words)**.
- **Analogy Density (Mandatory):** Insert **at least 1 vivid everyday analogy every 90–120 seconds** to translate complex tech/finance into street-level logic (e.g., *hospital waiting-room tickets*, *pawning a stolen Rolex*, *writing your alarm code on a Post-it on the front door*).
- **Curiosity Bridges:** Never end a section flat—always bridge to the next beat with a sharp open question (*"Wait—if they didn't steal the private keys, how did they move $6 billion?"*).
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
- **Thumbnail (`thumbnail` object):**
  - `brand`: Short 1-word channel badge (e.g. `"BRIEFED"`).
  - `headline`: 2–4 words ALL CAPS with a shock number (e.g. `"-6 BILLION USD"`).
  - `subline`: 3–5 words ALL CAPS context (e.g. `"THE BINANCE HEIST"`).
  - `mascot`: Expressive pose (`shades`, `shocked`, `pointing`, `deadpan`).
  - `mediaQuery`: Dramatic real-world photo for the background.
