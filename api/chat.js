// api/chat.js

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { promptType, userText } = req.body;
  if (
    !userText ||
    (promptType !== 'advise' && promptType !== 'improve')
  ) {
    return res.status(400).json({ error: 'Missing or wrong parameters' });
  }

  let messages;

  if (promptType === 'advise') {
    // Jediný system prompt s větvením: buď otázky, nebo finální plán
    const systemPrompt = `
Jsi zkušená sociální pracovnice. Dostaneš od pečovatelky text popisující péči v oblasti osobní hygieny její klientky. Tvým výstupem bude **jedno** z:

1️⃣ Pokud v textu NĚCO chybí (např. co zvládne sama klientka, kde probíhá hygiena, jak často, jaké pomůcky používá, rizika apod.), **polož pouze** 5–7 krátkých, přátelských a povzbudivých doplňujících otázek v odrážkách.  
2️⃣ Pokud je text kompletní, napiš podrobný doporučující plán, formátuj jako Markdown s nadpisy (##), odrážkami (-) a tučným textem (**).

Nepiš nikdy obojí najednou a neuváděj další komentáře ani nadpisy.
`.trim();

    messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user',   content: userText }
    ];

  } else {
    // režim "improve"
    const systemPrompt = `Jsi profesionální redaktor. Přeformuluj následující text tak, aby byl jasnější, stručnější a profesionální. 
Výstup formátuj jako čistý text oddělený do přehledných odstavců.`;

    messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user',   content: userText }
    ];
  }

  const payload = {
    messages,
    temperature: 0.6,
    top_p: 0.9,
    max_tokens: 800
  };

  try {
    const azureRes = await fetch(
      `${process.env.AZURE_ENDPOINT}/openai/deployments/${process.env.AZURE_DEPLOY}/chat/completions?api-version=2024-12-01-preview`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': process.env.AZURE_KEY
        },
        body: JSON.stringify(payload)
      }
    );

    const data = await azureRes.json();
    const content = data.choices?.[0]?.message?.content?.trim() || '';
    return res.status(200).json({ result: content });

  } catch (err) {
    console.error('Azure request failed:', err);
    return res.status(500).json({
      error: 'Azure OpenAI request failed',
      details: err.message
    });
  }
}
