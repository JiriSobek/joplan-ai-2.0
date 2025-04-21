// api/chat.js

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { promptType, userText } = req.body;
  if (!promptType || !userText) {
    return res.status(400).json({ error: 'Missing parameters' });
  }

  const systemPrompt = promptType === 'advise'
    ? 'Prompt č. 1: Jsi zkušená sociální pracovnice. Pomáháš pečovatelce sestavit individuální plán v oblasti osobní hygieny, kam patří: ranní a večerní hygiena, celková hygiena (sprcha, koupel), používání toalety (případně inkontinenčních pomůcek), manikůra, pedikůra, případně holení. Pomoc by měla být popsána srozumitelně a konkrétně. Mělo by být popsáno, co klient zvládne sám a jakou pomoc a podporu potřebuje. Pokud je text mlhavý nebo chybí důležité informace, napiš několik jednoduchých a stručných otázek, které pomohou popis doplnit nebo upřesnit. Otázky a komentáře piš přátelským a povzbudivým tónem. Styl zápisu má být srozumitelný pro všechny – i pro klienta s lehkou demencí nebo mentálním postižením. Pokud je zápis v pořádku, další otázky nepokládej. '
    : 'Prompt č. 2: Přeformuluj následující text tak, aby byl jasnější a a srozumitelnější:';

  const payload = {
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user',   content: userText }
    ]
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

