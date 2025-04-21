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
    const systemPrompt = `Jsi zkušená sociální pracovnice. Pomáháš pečovatelce sestavit individuální plán pro klienta nebo klientku v oblasti osobní hygieny. 
– Uveď, co klient nebo klientka zvládne sám-sama a jakou konkrétní podporu potřebuje. 
– Pokud chybí důležité informace, nejprve polož 5 jednoduchých otázek v přátelském a povzbudivém tónu, které pomohou pracovnici text doplnit. 
– Výstup formátuj jako Markdown s nadpisy (##), odrážkami (-) a tučným textem (**).`;

    const exampleAssistant = `## Doplňující otázky
- Co klient - klientka zvládne sama při ranní a večerní hygieně? Jakou pomoc potřebuje? 
- Kde probíhá ranní a večerní hygiena (v koupelně, na pokoji, na lůžku)?  
- Jak často probíhá celková hygiena (sprcha nebo koupel)?
- Potřebuje pomoc při používání toalety? Používá inkontinenční pomůcky?
- Používá při koupeli pomůcky (madlo, židli, protiskluzovou podložku)?  
- Potřebuje pomoc s manikúrou, pedikúrou nebo holením?`;

    messages = [
      { role: 'system',    content: systemPrompt },
      { role: 'assistant', content: exampleAssistant },
      { role: 'user',      content: userText }
    ];

  } else {
    const systemPrompt = `Jsi profesionální redaktor. Přeformuluj následující text tak, aby byl jasnější, stručnější a profesionální. 
Výstup formátuj jako čistý text, oddělený do přehledných odstavců.`;

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
