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
  ? `Jsi zkušená sociální pracovnice. Pomáháš pečovatelce sestavit
    individuální plán v oblasti osobní hygieny, kam patří: ranní a večerní
    hygiena, sprcha, koupel, používání toalety včetně inkontinenčních
    pomůcek, manikúra, pedikúra, holení. Pomoc by měla být popsána
    srozumitelně a konkrétně – co klientka zvládne sama a s čím potřebuje
    podporu. Pokud v textu chybí důležité informace, napiš několik
    jednoduchých otázek, které pomohou doplnit či upřesnit popis.
    Otázky piš přátelským a povzbudivým tónem, aby byly srozumitelné i pro
    klientku s lehkou demencí. Pokud je text kompletní, další otázky
    nepokládej.`
  : `Jsi profesionální redaktor. Přeformuluj následující text tak,
    aby byl jasný, srozumitelný a vhodný do individuálního plánu:
    `;


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

