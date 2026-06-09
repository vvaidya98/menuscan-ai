# MenuScan AI — My Plain English Guide
### Personal reference document — how it works and why I built it this way
### Last updated: June 2026 — after first successful live test

---

## What is MenuScan AI?

MenuScan AI is a web app I built to help people with gluten and dairy intolerance
eat out at restaurants with more confidence. You point it at a menu — by taking
a photo, uploading a picture, or pasting a link — and it uses Claude AI to read
every dish and tell you which ones are safe, which ones need a question to the
chef, and which ones to avoid entirely.

The tagline is: **"Eat out with confidence."**

The app is live at: **menuscan-ai.netlify.app**
Beta password: **glut26**

---

## Current Status

Phase 1 is built, deployed, and working on mobile. Tested successfully on a
real restaurant menu (Shaya restaurant). The following all work correctly:

- Photo upload from camera roll ✅
- Live camera capture ✅
- AI scanning and classification ✅
- Traffic light cards (green/amber/red) ✅
- G and D badges ✅
- Course filter tabs ✅
- G/D toggle filters ✅
- Price display ✅
- Summary strip with proportional bar ✅
- Chef questions on amber items ✅
- Confidence scores ✅
- Password gate ✅
- Medical disclaimer ✅
- Mobile experience ✅

Still to fix / build (Late Phase 1): see pending list at end of this document.

---

## How the API Key is Managed

This is important to understand because it caused issues during the build.

The Anthropic API key must never be committed to GitHub — GitHub's security
scanner will detect it and block the push. Instead:

1. The key is stored in a file called `config.js` in the project folder
2. `config.js` is listed in `.gitignore` so Git never touches it
3. Netlify's build command generates `config.js` automatically using the key
   stored as a Netlify environment variable called `ANTHROPIC_API_KEY`
4. The HTML file loads `config.js` via a script tag and reads the key from it

This means the key lives in two places only: Netlify's environment variables
(secure) and my local `config.js` (never uploaded anywhere).

---

## How the App Works — Step by Step

### Getting the menu in

There are three ways:

**Upload a photo** — pick an image from the phone's camera roll. Most common
use case when you've already taken a photo of the menu.

**Take a photo** — opens the device camera directly. Best for scanning the menu
right at the table. If camera permission is denied, the app quietly falls back
to the upload option.

**Paste a URL** — for restaurants with online menus or QR codes. Currently
has some reliability issues with certain websites — being improved.

### What Claude AI does

Once the menu arrives, Claude reads every single dish and decides:

**Safe (green)** — no known gluten or dairy ingredients detected. Or the
restaurant itself has marked the dish GF or DF in their menu legend.

**Check (amber)** — the dish might contain gluten or dairy but it's not obvious.
"Chicken wings" might be breaded. "Sauce" might contain dairy. Claude can't be
certain, so it flags it and generates a specific question to ask the server.
A confidence score shows how uncertain Claude is.

**Avoid (red)** — the dish clearly contains gluten or dairy. Pasta, bread,
cream sauce, cheese, soy sauce, beer batter and so on.

Claude also looks for the restaurant's own allergen legend first — symbols like
GF, DF, GFO, asterisks, footnotes. If the restaurant has already marked a dish
as gluten-free, Claude trusts that and marks it safe with a "Restaurant verified"
note. This is more reliable than AI inference alone.

### How results are shown

**Summary strip** — a proportional bar (green/amber/red) shows at a glance
how friendly the menu is overall. Below it are tappable pills:
✅ Safe (N) · ⚠️ Check (N) · ❌ Avoid (N) — tap any to filter to that category.

**Cards** — each dish is a card with a coloured left border. The G and D badges
sit right next to the dish name. Gluten trigger words are highlighted red inline
in the description; dairy trigger words are highlighted blue. You can see at a
glance exactly which ingredient caused the flag.

**Safe items come first** — the list leads with what you CAN eat, not what
you can't. Empowering rather than alarming.

**Course tabs** — filter by Appetizer, Entree, Dessert etc. Combined with the
status pills, you can do things like "show me only safe Entrées."

**Chef questions** — every amber item has a suggested question to show your
server. e.g. "Are the chicken wings breaded or flour-coated?"

**Feedback** — at the bottom of every results screen, a star rating (1-5) and
optional comment box. Feedback goes to my Netlify dashboard.

---

## The Tech Setup

The app is a single HTML file — no frameworks, no build process, no install.
It uses:

- **Tailwind CSS** (loaded via CDN — one script tag)
- **Claude API** called directly from the browser using Anthropic's supported
  `anthropic-dangerous-direct-browser-access` header
- **Netlify** for hosting (auto-deploys from GitHub on every push)
- **GitHub** for version control

The workflow for making changes:
1. Edit files in VS Code
2. Save
3. `git add .` → `git commit -m "description"` → `git push`
4. Netlify detects the push and redeploys automatically in ~30 seconds

---

## What's NOT in Phase 1 (and why)

**No database or saved history** — nothing is stored between sessions.
You scan, see results, close the app. Phase 2 will save scans to a
Railway Postgres database.

**No user accounts** — no login needed. Phase 2 adds authentication.

**No annotated menu overlay** — I'd love to show highlights drawn directly
on the original menu photo. Complex to build well. Phase 3.

**No price filter** — a great idea but needs reliable price parsing first.
Phase 2, with a range slider.

**No handwritten or multi-language menus** — Phase 3.

---

## The Phased Plan

**Phase 1 — Core product, live now**
Single HTML file, gluten + dairy, photo/camera/URL, stateless,
safe-first card view, summary strip, course filters, status pills,
chef questions, confidence scores, ingredient highlighting,
feedback widget, medical disclaimer. Free, password-gated beta.

**Phase 2 — Backend + personalisation**
Railway Node.js/Express API (replaces direct browser API call, keeps key safe).
Railway Postgres database. Saved restaurants + scan history. User authentication.
Dynamic intolerance profile (type + severity). Price range filter.
Tap-to-expand ingredient detail. Freemium model.

**Phase 3 — Advanced features**
Annotated overlay on menu photo. Handwritten menu support.
Multi-language support. Shareable safe-items list.

---

## Competitive Landscape

Several apps exist in this space (ScanMyMenu, Allergy Lens, SafeEat, FoodPickAI)
but none offer:
- Safe-first display (leading with what you CAN eat)
- AI-generated chef questions for ambiguous items
- Confidence scoring per dish
- URL/QR code menu input
- Inline ingredient word highlighting
- Status filter pills combined with course tabs
- Web app (no install required)

The chef question generator is the most distinctive feature — it bridges
AI analysis with real-world human verification.

---

## Pending — Late Phase 1 Build List

1. Fix URL/QR code input
2. Multi-image scanning (multiple photos, one scan)
3. Combine upload/camera into single input zone
4. Filter toggle clarity (obvious on/off state)
5. Ingredient word highlighting (red/blue inline)
6. Price $ prefix formatting
7. Status filter pills (Safe/Check/Avoid tappable with counts)
8. Badge repositioning (after dish name, not right-aligned)
9. Feedback widget (Netlify Forms, star rating + comment)
10. Menu legend detection (GF, DF, GFO — update Claude prompt)

---

## Key Lessons from the Build

- Never commit an API key to GitHub — it will be detected and blocked
- Use `config.js` + `.gitignore` + Netlify environment variables instead
- Netlify's new Projects interface doesn't surface Functions reliably —
  direct browser API calls with the dangerous-direct-browser-access header
  are a viable and supported workaround
- `max_tokens: 4000` is needed for large menus — 2000 causes JSON truncation
- Plain HTML + vanilla JS is the right Phase 1 choice — zero setup friction,
  Claude can write and edit it easily, works immediately in any browser
- Always produce CLAUDE.md and Plain English Guide before writing any code
