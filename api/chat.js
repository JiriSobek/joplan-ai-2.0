// api/chat.js

module.exports = async function handler(req, res) {
  // Povolit pouze POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Parsování těla požadavku
  const { promptType, userText } = req.body || {};
  if (!userText || (promptType !== 'advise' && promptType !== 'improve')) {
    return res.status(400).json({ error: 'Missing or wrong parameters' });
  }

  // Definice systémových promptů
  const advisePrompt = `
Jsi zkušená a vřelá sociální pracovnice, která pomáhá pečovatelkám sestavit individuální plán klienta nebo klientky v oblasti osobní hygieny.

Tvým úkolem je zhodnotit text popisu podpory a poradit, co v něm případně chybí nebo by šlo doplnit. Hodnotíš v přátelském a povzbudivém tónu. Když je text kompletní, jen ho pochval a nic dalšího nepřidávej.

Posuzuj, zda je text:
- srozumitelný a konkrétní
- psaný běžným jazykem (nikoli příliš odborně)
- vhodný pro klienta s lehkou demencí nebo mentálním postižením

Soustřeď se na to, zda je:
- **popsáno, co klient zvládne sám**
- **jasně formulováno, s čím potřebuje pomoc**
- **konkrétně uvedeno, kde a jak hygiena probíhá**
- **uvedeno, jak často probíhá celková hygiena**
- **zaznamenány zvyklosti, přání nebo rizika**
- **zmíněno použití pomůcek**

Pokud v textu něco chybí, napiš:
- pochvalu za dosavadní zápis
- 5–7 doplňujících otázek (stručně, konkrétně)
- doporučení, co upřesnit

Formátuj jako Markdown s nadpisy (##), odrážkami (-) a tučným textem (**).
`.trim();

  const improvePrompt = `
Jsi profesionální redaktor. Přeformuluj následující text tak, aby byl jasnější, stručnější a profesionální.
Výstup formátuj jako čistý text v přehledných odstavcích.
`.trim();

  const systemPrompt = promptType === 'advise' ? advisePrompt : improvePrompt;

  // Poskládání zpráv
  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user',   content: userText }
  ];

  const payload = {
    model:       process.env.OPENAI_API_MODEL,
    messages,
    temperature: 0.6,
    top_p:       0.9,
    max_tokens:  800
  };

  try {
    // Volání OpenAI API
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
      console.error('OpenAI error:', err);
      return res.status(response.status).json({ error: 'OpenAI request failed', details: err });
    }

    const data = await response.json();
    const result = data.choices?.[0]?.message?.content.trim() || '';
    return res.status(200).json({ result });

  } catch (err) {
    console.error('Fetch error:', err);
    return res.status(500).json({ error: 'OpenAI request failed', details: err.message });
  }
};

