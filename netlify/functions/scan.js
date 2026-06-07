const https = require("https");

exports.handler = async function (event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "API key not configured" }),
    };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ error: "Invalid request" }) };
  }

  const { type, imageBase64, imageMimeType, menuText } = body;

  const systemPrompt = `You are a dietary safety assistant specialising in gluten and dairy intolerance.
You will be given a restaurant menu (as an image or text).

For every menu item, return a JSON array. Each object must have:
- "name": string
- "price": string or null
- "course": string — one of: "Appetizer", "Soup", "Salad", "Entree", "Side", "Dessert", "Drink", "Unknown"
- "gluten_status": "safe" | "avoid" | "check"
- "dairy_status": "safe" | "avoid" | "check"
- "gluten_reason": string or null
- "dairy_reason": string or null
- "gluten_confidence": number 0 to 1
- "dairy_confidence": number 0 to 1
- "chef_question": string or null
- "flagged_ingredients": array of strings

Rules:
- "avoid" = clearly contains gluten (pasta, bread, flour, soy sauce, beer batter) or dairy (cream, cheese, butter, milk)
- "check" = may contain but not explicit
- "safe" = no known gluten or dairy detected

Always err on the side of caution. Return ONLY a valid JSON array, no markdown, no explanation.`;

  let userContent;
  if (type === "image") {
    userContent = [
      {
        type: "image",
        source: { type: "base64", media_type: imageMimeType, data: imageBase64 },
      },
      { type: "text", text: "Scan this restaurant menu and classify every dish for gluten and dairy." },
    ];
  } else {
    userContent = "Menu text:\n\n" + (menuText || "").substring(0, 8000);
  }

  const payload = JSON.stringify({
    model: "claude-sonnet-4-20250514",
    max_tokens: 2000,
    system: systemPrompt,
    messages: [{ role: "user", content: userContent }],
  });

  return new Promise((resolve) => {
    const options = {
      hostname: "api.anthropic.com",
      path: "/v1/messages",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "anthropic-version": "2023-06-01",
        "x-api-key": apiKey,
        "Content-Length": Buffer.byteLength(payload),
      },
    };

    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => { data += chunk; });
      res.on("end", () => {
        try {
          const parsed = JSON.parse(data);
          const text = parsed.content[0].text.replace(/```json|```/g, "").trim();
          const items = JSON.parse(text);
          resolve({
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(items),
          });
        } catch (e) {
          resolve({
            statusCode: 500,
            body: JSON.stringify({ error: "Parse error: " + e.message + " raw: " + data.substring(0, 200) }),
          });
        }
      });
    });

    req.on("error", (e) => {
      resolve({ statusCode: 500, body: JSON.stringify({ error: e.message }) });
    });

    req.write(payload);
    req.end();
  });
};
