# CLAUDE.md — MenuScan AI

> "Eat out with confidence"

This file is the authoritative technical reference for building MenuScan AI.
Use it to understand the architecture, components, APIs, and phase boundaries.

---

## Project Overview

MenuScan AI is a web app that allows users to upload, photograph, or link to a
restaurant menu. Claude vision AI analyses the menu and classifies every dish
as safe, ambiguous, or avoid — based on gluten and dairy intolerance (Phase 1).
Results are displayed as a dynamic, filterable card list with traffic-light badges,
brief ingredient reasons, AI-generated chef questions for uncertain items,
and ingredient word highlighting.

---

## Tech Stack

### Phase 1 — Plain HTML & JavaScript
| Layer | Choice | Notes |
|---|---|---|
| Frontend | Single HTML file + vanilla JavaScript | No build tools, no setup, open in browser |
| Styling | Tailwind CSS via CDN | One script tag, no install required |
| AI / Vision | Anthropic Claude API (claude-sonnet-4-20250514) | Vision + text parsing |
| Menu input | File upload, device camera (MediaDevices API), URL paste | All in-browser |
| API call | Direct browser call with anthropic-dangerous-direct-browser-access header | API key loaded from config.js |
| API key | Stored in config.js (excluded via .gitignore) | Injected at build time via netlify.toml |
| Hosting | Netlify | Free tier, auto-deploy from GitHub |
| Database | None — fully stateless | Nothing saved between sessions |

### Phase 2 — Migrate to React + Railway Backend
| Layer | Choice |
|---|---|
| Frontend | React (single-page app) |
| Styling | Tailwind CSS (via npm) |
| API server | Node.js + Express on Railway |
| Database | Postgres on Railway (existing paid account) |
| Image storage | Railway volume or Supabase Storage |
| Auth | Simple JWT or Supabase Auth |

---

## Phase Flags

```js
// PHASE_1: core feature
// PHASE_2: placeholder — not built yet
// PHASE_3: placeholder — future consideration
```

---

## API Key Management

- API key stored in `config.js` in project root
- `config.js` is excluded from Git via `.gitignore`
- `netlify.toml` build command generates `config.js` at deploy time:
  ```toml
  [build]
    publish = "."
    functions = "netlify/functions"
    command = "echo \"const CONFIG = { apiKey: '$ANTHROPIC_API_KEY' };\" > config.js"
  ```
- `ANTHROPIC_API_KEY` stored as Netlify environment variable
- `index.html` loads config.js via script tag and reads `CONFIG.apiKey`

---

## Password Gate

- Simple hardcoded password prompt on page load
- Password: stored as `const PASSWORD` in index.html
- Current beta password: `glut26`
- Wrong password → error message, input cleared
- Correct password → landing screen shown
- PHASE_2: replace with proper user authentication

---

## Menu Input — Three Methods (Phase 1)

### 1. Photo Upload / Camera Capture (Combined — Late Phase 1)
- Currently two separate options — to be combined into single dotted upload zone
- Clicking zone presents choice: file picker or camera
- File upload: standard `<input type="file" accept="image/*">`
- Multi-image: allow selecting multiple photos; send all in one Claude API call
- Camera: `navigator.mediaDevices.getUserMedia({ video: true })`
- If camera permission denied → silently fall back to file upload
- Show image count indicator when multiple images selected e.g. "3 photos selected"
- Convert all images to base64 for Claude vision API
- Show preview before submission

### 2. URL Paste
- User pastes URL to online menu (restaurant website or QR code destination)
- CORS proxy used to fetch page content (allorigins.win for Phase 1)
- Pass extracted text to Claude for parsing
- Handle failure gracefully: "We couldn't read that page — try uploading a photo instead"
- PHASE_2: replace CORS proxy with Railway server-side fetch

---

## Claude API Integration

### Endpoint
```
POST https://api.anthropic.com/v1/messages
Model: claude-sonnet-4-20250514
Max tokens: 4000
```

### Headers (direct browser call)
```js
{
  'Content-Type': 'application/json',
  'x-api-key': API_KEY,
  'anthropic-version': '2023-06-01',
  'anthropic-dangerous-direct-browser-access': 'true'
}
```

### Input Format
- Single image → `type: "image"` with base64
- Multiple images → array of `type: "image"` blocks + one `type: "text"` instruction
- URL menu → extracted text as `type: "text"`

### System Prompt
```
You are a dietary safety assistant specialising in gluten and dairy intolerance.
You will be given a restaurant menu (as an image or text).

IMPORTANT: First scan the entire menu for any legend, key, or allergen notation
system. Look for symbols like GF (gluten-free), DF (dairy-free), GFO (gluten-free
option available), V, VG, N, asterisks, or any footnote system. If found, use the
restaurant's own markings as the primary classification signal — they take priority
over AI inference.

For every menu item, return a JSON array. Each object must have:
- "name": string — the dish name
- "price": string or null — price if visible, without currency symbol (add $ in UI)
- "course": string — one of: "Appetizer", "Soup", "Salad", "Entree", "Side",
  "Dessert", "Drink", "Unknown"
- "gluten_status": "safe" | "avoid" | "check"
- "dairy_status": "safe" | "avoid" | "check"
- "gluten_reason": string or null — one-line reason if avoid or check
- "dairy_reason": string or null — one-line reason if avoid or check
- "gluten_confidence": number — 0 to 1
- "dairy_confidence": number — 0 to 1
- "chef_question": string or null — only if either status is "check"
- "flagged_ingredients": string[] — ingredient words found in description
  that triggered a flag
- "restaurant_verified": boolean — true if restaurant's own legend marks this
  item as safe (GF, DF etc)
- "gf_option": boolean — true if GFO or similar — can be modified to be safe

Classification rules:
- "avoid" = clearly contains gluten (pasta, bread, flour, soy sauce, beer batter,
  croutons, breadcrumbs) or dairy (cream, cheese, butter, milk, yoghurt, bechamel)
- "check" = may contain but not explicit (e.g. "chicken wings" may be breaded;
  "sauce" may have dairy; "marinated" may use soy sauce)
- "safe" = no known gluten or dairy ingredients detected, OR restaurant has
  marked it GF/DF in their legend

Always err on the side of caution. If uncertain, use "check" not "safe".
Return ONLY a valid JSON array. No preamble, no markdown, no explanation.
```

### Response Handling
```js
const text = data.content[0].text.replace(/```json|```/g, '').trim();
const items = JSON.parse(text);
```

---

## Data Model

```ts
type MenuItem = {
  name: string;
  price: string | null;                    // raw number string, $ added in UI
  course: "Appetizer" | "Soup" | "Salad" | "Entree" | "Side" |
          "Dessert" | "Drink" | "Unknown";
  gluten_status: "safe" | "avoid" | "check";
  dairy_status: "safe" | "avoid" | "check";
  gluten_reason: string | null;
  dairy_reason: string | null;
  gluten_confidence: number;               // 0–1
  dairy_confidence: number;               // 0–1
  chef_question: string | null;
  flagged_ingredients: string[];
  restaurant_verified: boolean;            // true = restaurant marked GF/DF
  gf_option: boolean;                      // true = can be made GF on request
};
```

---

## UI Components

### 1. PasswordScreen
- Full screen overlay before app loads
- Password input + Enter button
- Error message on wrong password
- Correct password → show LandingScreen

### 2. LandingScreen
- App name: MenuScan AI
- Tagline: "Eat out with confidence"
- Single dotted upload zone (Late Phase 1 — combine upload + camera)
  - Currently: three separate input method cards
  - Target: one dotted zone + URL paste as separate option
- Medical disclaimer always visible
- Camera fallback message if permissions denied
- Image count indicator when multiple images selected

### 3. ScanningScreen
- Spinner animation
- Step messages: "Menu received" → "Reading dish descriptions" → "Checking ingredients"

### 4. ResultsScreen

#### SummaryStrip
- Proportional horizontal bar (green / amber / red) — purely visual
- Tappable status pills below bar:
  - `✅ Safe (N)` · `⚠️ Check (N)` · `❌ Avoid (N)`
  - Equal width, same pill style as course tabs
  - Tap to filter by status; tap again to deselect
  - Works in combination with course tab filters

#### FilterPanel
- Intolerance toggles: [G] Gluten · [D] Dairy
  - Both active by default
  - Clearer active/inactive visual state — ✓ checkmark or toggle switch style
  - Must be obviously ON when active, not ambiguous
- Course filter tabs: All / Appetizers / Soups / Salads / Entrées / Sides /
  Desserts / Drinks / Other
  - Only show tabs that have at least one item
  - "Other" for unrecognised section names

#### MenuItemCard
- Left border colour: green / amber / red
- Dish name — bold
- G and D badges immediately after dish name (not right-aligned)
  - G badge: red fill
  - D badge: blue fill
  - Restaurant verified: add "✓ Restaurant GF" tag in green
- Price — prefixed with $ symbol — e.g. "$17"
- Ingredient highlighting inline in description:
  - Gluten trigger words → red highlight
  - Dairy trigger words → blue highlight
  - Uses flagged_ingredients array from Claude response
- One-line reason — e.g. "🌾 Contains pasta — gluten source"
- Confidence score for amber items — "~65% likely safe — confirm with staff"
- Chef question in speech-bubble callout (amber items only)
- GFO items: amber status + chef question "This dish can be made gluten-free —
  please confirm with your server"

#### FeedbackWidget
- Shown at bottom of results screen
- Prompt: "How helpful was this scan?"
- Star rating 1–5 (tap interaction)
- Optional text comment box
- Submit button
- Thank you message after submission
- Phase 1: Netlify Forms (zero backend setup, feedback to Netlify dashboard)
- Phase 2: stored in Railway Postgres alongside scan record

### 5. DisclaimerBanner
Always visible on landing and results screens:
> ⚠️ MenuScan AI is a decision-support tool only. Always verify ingredients
> directly with the restaurant. This app does not replace personal judgment or
> medical advice and must not be relied upon for severe allergies.

---

## Display Logic

### Item ordering:
1. Safe items (green) — top
2. Check items (amber) — middle
3. Avoid items (red) — bottom

### Filter behaviour:
- Status pill tap → filter to that status; tap again to clear
- Course tab → filter to that course
- G/D toggle → re-evaluate all items against active intolerance filters
- All filters combinable: e.g. Safe + Entree = only safe entrées
- Empty filter result → "No items match your current filters"

### Price display:
- Always prefix with $
- If price already contains $, £, € → do not double-prefix
- If no price → show nothing (no dash or placeholder)

### Confidence display:
- Amber items only
- Round to nearest 5%: "~65% likely safe"

### Ingredient highlighting:
- Split dish description into words
- Match against flagged_ingredients array (case-insensitive)
- Wrap matched words in coloured span:
  - Gluten: `<span class="highlight-g">word</span>` → red background
  - Dairy: `<span class="highlight-d">word</span>` → blue background

---

## Error States

| Situation | Message |
|---|---|
| Camera permission denied | "Camera unavailable — please use the upload option instead" |
| URL unreachable | "We couldn't read that page — try uploading a photo instead" |
| API returns error | "Something went wrong scanning the menu — please try again" |
| JSON parse error | Increase max_tokens; check response truncation |
| No menu items detected | "We couldn't find any menu items — try a clearer photo" |

---

## Medical Disclaimer (exact wording)

> ⚠️ **MenuScan AI is a decision-support tool only.** It does not replace
> personal judgment or advice from restaurant staff. Always verify ingredients
> directly with the restaurant, especially if you have a severe allergy or
> medical condition. The creators of MenuScan AI accept no liability for
> adverse reactions arising from use of this app.

---

## Late Phase 1 — To Build

- [ ] Fix URL/QR code input (replace CORS proxy with reliable solution)
- [ ] Multi-image scanning (multiple upload + sequential camera shots)
- [ ] Combine upload/camera into single input zone
- [ ] Filter toggle clarity (checkmark or toggle switch style)
- [ ] Ingredient word highlighting (red/blue inline in descriptions)
- [ ] Price $ prefix formatting
- [ ] Status filter pills (Safe/Check/Avoid as tappable pills with counts)
- [ ] Badge repositioning (after dish name, not right-aligned)
- [ ] Feedback widget (Netlify Forms, star rating + comment)
- [ ] Menu legend detection (GF, DF, GFO symbols — update system prompt)

---

## Phase 2 Features (do not build — reference only)

- [ ] User authentication (email/password)
- [ ] Saved scans: restaurant name, datetime, image, results JSON → Railway Postgres
- [ ] Railway Node.js/Express API server (replaces direct browser API call)
- [ ] "My Restaurants" history screen
- [ ] Claude extracts restaurant name from menu automatically
- [ ] Dynamic intolerance profile (type + severity)
- [ ] Price range filter (slider + quick buttons)
- [ ] Tap to expand ingredient detail panel
- [ ] Editable chef question suggestions
- [ ] Freemium model
- [ ] Feedback stored in Railway Postgres alongside scan record

## Phase 3 Features (do not build — reference only)

- [ ] Annotated overlay on original menu image
- [ ] Handwritten menu support
- [ ] Multi-language menu support
- [ ] Shareable safe-items list
- [ ] Spice level / portion size filters
