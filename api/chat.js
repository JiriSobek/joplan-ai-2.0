// api/chat.js
export default async function handler(req, res) {
  // 1) Metoda
  if (req.method !== 'POST') {
    console.error('🔴 Wrong method:', req.method);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { promptType, userText } = req.body;
  console.log('➡️  promptType=', promptType, ' | userText=', userText?.substring(0,50), '…');

  // 2) Validace
  if (!userText || (promptType !== 'advise' && promptType !== 'improve')) {
    console.error('🔴 Missing or wrong parameters:', req.body);
    return res.status(400).json({ error: 'Missing or wrong parameters' });
  }

  // 3) Vytvoření messages
  let messages;
  if (promptType === 'advise') {
// api/chat.js (jen část for promptType==='advise')
const systemPrompt = `
Jsi ChatGPT‑style asistent: 
1) Nejprve krátce (1–2 věty) **ocen snahu pečovatelky** zpracovat kvalitní individuální plánu.
2) Poté **analyzuj** text na úplnost a srozumitelnost.
3) Nakonec navrhni konkrétní **vylepšení** v bodech, případně doplň otázky, pokud něco chybí.
Vždy začni pochvalou a formátuj výstup jako Markdown:  
## Jste na dobré cestě  
- …  
## Návrhy na vylepšení  
- …  
## Doplňující otázky  
- …
`.trim();

messages = [
  { role: 'system',  content: systemPrompt },
  { role: 'user',    content: userText }
];

  } else {
    const systemPrompt = `
Jsi profesionální redaktor. Přeformuluj následující text tak, aby byl jasnější, stručnější a profesionální.
Výstup formátuj jako čistý text v přehledných odstavcích.
`.trim();
    messages = [
      { role: 'system',  content: systemPrompt },
      { role: 'user',    content: userText }
    ];
  }

  // 4) Zavolání Azure
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
    console.log('🟢 Azure status=', azureRes.status, 'choices=', data.choices?.length);
    const content = data.choices?.[0]?.message?.content?.trim() || '';
    return res.status(200).json({ result: content });
  } catch (err) {
    console.error('🔴 Azure request failed:', err);
    return res.status(500).json({
      error: 'Azure OpenAI request failed',
      details: err.message
    });
  }
}
