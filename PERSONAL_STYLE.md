# PERSONAL_STYLE.md
### My Vibe Coding Bible — How I Think About and Build Apps

> This is a living document. Add to it after every project.
> Eventually this becomes the brain behind a drag-and-drop app scaffolding tool.

---

## Who I Am as a Builder

I am not a traditional developer. I think in products, not in code. I know
what I want an app to do and how it should feel — and I use AI (primarily
Claude) to help me build it. My superpower is clear thinking about user
experience, phased delivery, and practical real-world problems worth solving.

I build for myself first, then for others. If something would genuinely make
my own life easier or more confident, it's probably worth building.

---

## My Golden Rules

1. **Phase everything.** No app is built in one go. Always Phase 1, Phase 2,
   Phase 3. Phase 1 is the smallest possible useful thing. If it feels too
   simple, it's probably right.

2. **Web first, always.** I build web apps, not native iOS or Android apps.
   Web means no App Store friction, no install required, works on any device,
   fastest to prototype and test.

3. **Personal before professional.** Start with personal use cases and a
   handful of trusted testers. Only scale when the core works and feels right.

4. **Plain English alongside every spec.** Every technical document
   (CLAUDE.md) gets a matching Plain English Guide — written for my future
   self, not for developers or investors.

5. **AI at the core.** Every app I build uses Claude API as its intelligence
   layer. The UI is the wrapper; Claude is the brain.

6. **Stateless to start.** Phase 1 never has a database, login, or saved
   state. Users in, results out, session ends. Storage comes in Phase 2.

7. **Clean and white.** My UI preference is minimal, clean, white backgrounds,
   plenty of space. No dark mode in Phase 1. No clutter. The content does the
   work, not the chrome.

8. **Safe-first UX.** When the app produces results, lead with what the user
   CAN do, not what they can't. Empowering, not alarming.

9. **Disclaimers where they matter.** Any app touching health, finance, or
   personal data gets a strong, honest disclaimer. Visible always, not buried.

10. **Freemium always.** Phase 1 is free for testers. Phase 2 introduces a
    premium tier. Never charge before the core experience is proven.

---

## My App Anatomy — Standard Structure for Every Project

Every app I build follows this skeleton:

```
App Name
├── LandingScreen       — input, tagline, disclaimer
├── ProcessingScreen    — friendly loading state ("Scanning…", "Thinking…")
├── ResultsScreen       — safe-first output, filters, cards or list
└── (Phase 2) ProfileScreen — user preferences, saved history
```

### LandingScreen always has:
- App name + tagline (one punchy line)
- The primary input method (photo, text, URL, form)
- A medical/legal disclaimer if relevant
- No login in Phase 1

### ResultsScreen always has:
- A summary strip (totals at a glance)
- Filters (dynamic, no page reload)
- Cards or list items with clear status indicators
- Safe/positive items first

---

## My Standard Tech Stack

| Layer | Choice | Notes |
|---|---|---|
| Frontend | React | Single-page app, no Next.js in Phase 1 |
| Styling | Tailwind CSS | Utility-first, fast to prototype |
| AI | Claude API (claude-sonnet-4-20250514) | Vision + text |
| Hosting | Vercel or Netlify | One-click deploy |
| Backend | Serverless functions only | No dedicated server in Phase 1 |
| Database | None in Phase 1 | localStorage or stateless |
| Auth | None in Phase 1 | Phase 2 adds simple auth |

---

## My Standard Phase Structure

### Phase 1 — Prove It Works
- Single user, no login
- Hardcoded assumptions (one use case, one intolerance, one data type)
- Stateless — nothing saved between sessions
- Free, invite-only testers (5–10 people max)
- Web app only
- Minimal UI — function over form
- One input method to start; add others if needed
- Strong disclaimer if health/data is involved
- CLAUDE.md + Plain English Guide produced before any code is written

### Phase 2 — Make It Personal
- User profile / preferences
- Saved history (restaurants, scans, results)
- Multiple input methods fully polished
- Dynamic filters and sorting
- Freemium model introduced
- Confidence scores and explanations expanded
- Tap/click to expand detail panels
- Begin thinking about mobile responsiveness

### Phase 3 — Make It Delightful
- Advanced AI features (overlay annotations, multi-language, voice)
- Sharing and collaboration features
- Native app consideration (only if web has proven demand)
- Onboarding flow for new users
- Analytics and usage insights
- API or integration with third-party services

---

## My App Categories

### 🏥 Health & Wellness Apps
Apps that help me navigate personal health decisions with more confidence.
Always include a strong medical disclaimer. AI analyses data but never
replaces professional advice. Safe-first output. Examples:

- **MenuScan AI** — scan restaurant menus for gluten/dairy intolerance
- [ADD FUTURE HEALTH APPS HERE]

Key patterns:
- Traffic light status system (green / amber / red)
- Confidence scoring on uncertain results
- AI-generated questions to ask a professional or staff
- Disclaimer always visible, never dismissible

---

### 💼 Work & Productivity Apps
[ADD FROM PAST PROJECTS]

Key patterns:
- [ADD]

---

### 🧾 PHI / Sensitive Data Apps
Apps that touch Protected Health Information or other sensitive personal data.
Extra rules apply:

- No data stored in Phase 1 under any circumstances
- Explicit disclaimer about data handling on every screen
- No third-party analytics in Phase 1
- Consider end-to-end encryption before Phase 2 storage
- [ADD SPECIFIC APPS HERE]

---

### 🌐 Information & Research Apps
Apps that help me find, filter, or understand information faster.
[ADD FROM PAST PROJECTS]

Key patterns:
- [ADD]

---

### 🛠️ Personal Utility Apps
Everyday tools that solve a specific friction point in my life.
[ADD FROM PAST PROJECTS]

Key patterns:
- [ADD]

---

## My UX Principles

### Input
- Always offer the most convenient input first (camera > upload > URL > type)
- Never make the user fill in a form if AI can infer from a photo or URL
- Graceful fallbacks — if camera fails, offer upload; if URL fails, offer photo
- Show a preview of what was uploaded before processing

### Output
- Lead with the positive (what you CAN do/eat/use)
- Summary strip always at the top — totals at a glance
- Filters are dynamic — results update instantly, no submit button
- Cards over tables — more readable, more scannable on any screen size
- One-line reasons — never a paragraph where a sentence will do
- Confidence scores on uncertain items — honesty builds trust

### Errors
- Never show a raw error message to the user
- Every error has a friendly human message + a suggested next action
- If something fails silently, that is worse than showing an error

### Disclaimers
- Health apps: always visible, above the fold, plain language
- Financial apps: [ADD]
- Data apps: [ADD]

---

## My AI Prompting Patterns

### The Standard MenuScan Pattern (Vision + Classification)
Use when: given an image or text, classify every item into categories

```
You are a [domain] assistant specialising in [specific expertise].
You will be given a [input type].

For every [item type], return a JSON array. Each object must have:
- "name": string
- "status": "safe" | "check" | "avoid"
- "reason": string | null
- "confidence": number (0–1)
- "suggested_action": string | null

Classification rules:
- "avoid" = [clear criteria]
- "check" = [ambiguous criteria]
- "safe" = [safe criteria]

Always err on the side of caution.
Return ONLY valid JSON. No preamble, no markdown, no explanation.
```

### The Structured Extraction Pattern
Use when: pull structured data out of unstructured text or images

```
Extract all [item types] from the following [input].
Return as a JSON array where each object has: [fields].
If a field is not present, return null.
Return ONLY valid JSON.
```

### [ADD MORE PATTERNS FROM PAST PROJECTS]

---

## My Naming Convention

Good app names I like follow this pattern:
- **Verb + Noun + AI** — describes the action and signals intelligence
  - MenuScan AI ✅
- **Safe + Noun** — reassuring, clear purpose
  - SafeBite, SafePlate ✅
- **Noun + Mind / Lens / AI** — slightly more abstract but memorable
  - MenuMind, Allergy Lens ✅

Avoid:
- Generic names that could be anything (AppHelper, SmartTool)
- Names that only make sense if you already know what the app does
- Overly technical or clinical names for consumer-facing apps

Every app needs a tagline. The tagline should describe the emotional outcome,
not the feature. Examples:
- "Eat out with confidence" — not "Scan menus for allergens"
- [ADD MORE AS PROJECTS GROW]

---

## My Document Stack (produced before every build)

For every app I build, I produce these documents first:

| Document | Purpose | Audience |
|---|---|---|
| CLAUDE.md | Technical spec for AI-assisted coding | Claude Code / developer |
| Plain English Guide | How it works and why — personal reference | My future self |
| PERSONAL_STYLE.md | This file — my vibe coding bible | Me + Claude at project start |

---

## The Drag-and-Drop Scaffolding App (Future Vision)

One day this document becomes the brain behind a tool where I can:

1. Select an **app category** (Health / Work / PHI / Utility / Research)
2. Select a **primary input type** (Photo / URL / Text / Form)
3. Select a **output style** (Cards / List / Table / Map)
4. Select **Phase 1 features** from a checklist
5. Hit generate → receive a pre-filled CLAUDE.md + Plain English Guide
   ready to paste into Claude Code and start building

The scaffolding app would use this PERSONAL_STYLE.md as its config file,
so it always generates specs that match my preferences automatically.

**Stack for the scaffolding app itself:**
- React frontend, drag-and-drop UI
- Claude API to fill in the intelligent parts of each spec
- Outputs: downloadable CLAUDE.md + Plain English Guide as markdown files
- Phase 1: web app, no login, stateless

---

## Changelog

| Date | Update |
|---|---|
| 2026-06-07 | Updated after first live test of MenuScan AI |
| 2026-06-06 | Initial draft created from MenuScan AI project |

## Key Learnings Added from MenuScan AI Build

- Never commit API keys to GitHub — secret scanning will block the push
- Use config.js + .gitignore + hosting environment variables instead
- git reset HEAD~1 is the fix when you accidentally commit a secret
- Netlify's new Projects interface doesn't register Functions reliably —
  direct browser API calls with anthropic-dangerous-direct-browser-access
  header are a supported workaround for Phase 1
- max_tokens: 4000 needed for large menus — 2000 causes JSON truncation
- Plain HTML + vanilla JS is right for Phase 1 — zero friction, works immediately
- Tailwind CSS via CDN means no build step needed in Phase 1
- Always produce CLAUDE.md + Plain English Guide before writing any code
- The safe-first display pattern (lead with what you CAN eat) applies to any
  app that produces pass/fail or safe/unsafe results
- Netlify Forms is a zero-setup feedback collection tool — one HTML attribute
