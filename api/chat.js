// api/chat.js

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const { userText } = req.body;
  if (!userText || typeof userText !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid userText' });
  }

  const systemPrompt = `
Jsi profesionální redaktor. Přeformuluj následující text tak, aby byl jasnější, stručnější a profesionální.
Výstup formátuj jako čistý text v přehledných odstavcích.
`.trim();

  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user',   content: userText }
  ];

  const payload = {
    model:      process.env.OPENAI_API_MODEL,
    messages,
    temperature: 0.6,
    top_p:       0.9,
    max_tokens:  800
  };

  try {
    const response = await fetch(
      `${process.env.OPENAI_API_BASE}/chat/completions`,
      {
        method: 'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
        },
        body: JSON.stringify(payload)
      }
    );

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      console.error('OpenAI /chat error:', err);
      return res.status(response.status).json({ error: 'OpenAI request failed', details: err });
    }

    const data = await response.json();
    return res.status(200).json({ result: data.choices[0]?.message?.content.trim() || '' });

  } catch (err) {
    console.error('Fetch /chat error:', err);
    return res.status(500).json({ error: 'OpenAI request failed', details: err.message });
  }
}
