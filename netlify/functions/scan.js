// Netlify Function — MenuScan AI
// This file lives on Netlify's servers, not in the browser.
// It keeps your Anthropic API key secret and safe.

exports.handler = async function (event) {

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  // Read the API key from Netlify environment variables (never hardcoded)
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return { statusCode: 500, body: JSON.stringify({ error: 'API key not configured' }) };
  }

  // Parse the request from the browser
  let body;
  try {
    body = JSON.parse(event.body);
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid request' }) };
  }

  const { type, imageBase64, imageMimeType, menuText } = body;

  // ── SYSTEM PROMPT ──────────────────────────────────────────────────────────
  const systemPrompt = `You are a dietary safety assistant specialising in gluten and dairy intolerance.
You will be given a restaurant menu (as an image or text).

For every menu item, return a JSON array. Each object must have:
- "name": string — the dish name
- "price": string or null — price if visible on the menu
- "course": string — one of: "Appetizer", "Soup", "Salad", "Entree", "Side", "Dessert", "Drink", "Unknown"
- "gluten_status": "safe" | "avoid" | "check"
- "dairy_status": "safe" | "avoid" | "check"
- "gluten_reason": string or null — one-line reason if avoid or check, null if safe
- "dairy_reason": string or null — one-line reason if avoid or check, null if safe
- "gluten_confidence": number — 0 to 1
- "dairy_confidence": number — 0 to 1
- "chef_question": string or null — suggested question to ask chef, only if either status is "check"
- "flagged_ingredients": array of strings — ingredient words in the description that triggered a flag

Classification rules:
- "avoid" = clearly contains gluten (pasta, bread, flour, soy sauce, beer batter, croutons, breadcrumbs) or dairy (cream, cheese, butter, milk, yoghurt, bechamel)
- "check" = may contain but not explicit (e.g. "chicken wings" may be breaded; "sauce" may have dairy; "marinated" may use soy sauce)
- "safe" = no known gluten or dairy ingredients detected

Always err on the side of caution. If uncertain, use "check" not "safe".
Return ONLY a valid JSON array. No preamble, no markdown fences, no explanation.`;

  // ── BUILD MESSAGE FOR CLAUDE ───────────────────────────────────────────────
  let userContent;

  if (type === 'image') {
    // Photo upload or camera capture
    userContent = [
      {
        type: 'image',
        source: { type: 'base64', media_type: imageMimeType, data: imageBase64 }
      },
      {
        type: 'text',
        text: 'Please scan this restaurant menu and classify every dish for gluten and dairy content.'
      }
    ];
  } else if (type === 'text') {
    // URL-fetched menu text
    userContent = 'Menu text:\n\n' + menuText.substring(0, 8000);
  } else {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid type' }) };
  }

  // ── CALL CLAUDE API ────────────────────────────────────────────────────────
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01',
        'x-api-key': apiKey
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        system: systemPrompt,
        messages: [{ role: 'user', content: userContent }]
      })
    });

    if (!response.ok) {
      const err = await response.text();
      return { statusCode: response.status, body: JSON.stringify({ error: err }) };
    }

    const data = await response.json();
    const text = data.content[0].text.replace(/```json|```/g, '').trim();
    const items = JSON.parse(text);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(items)
    };

  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Scan failed: ' + err.message })
    };
  }
};
