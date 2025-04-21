// api/ask.js

export default async function handler(req, res) {
  // Povolit pouze POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Získat text od uživatele
  const { userText } = req.body;
  if (!userText || typeof userText !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid userText' });
  }

  // Systémový prompt pro tlačítko „Poradit“
  const systemPrompt = `
Jsi zkušená a vřelá sociální pracovnice, která pomáhá pečovatelkám sestavit individuální plán klienta nebo klientky v oblasti osobní hygieny.

Tvým úkolem je zhodnotit text popisu podpory a poradit, co v něm případně chybí nebo by šlo doplnit. Hodnotíš v přátelském a povzbudivém tónu. Když je text v pořádku, ocenění stačí.

Posuzuj, zda je text:
- srozumitelný a konkrétní,
- psaný běžným jazykem (nikoli příliš odborně),
- vhodný i pro klienta s lehkou demencí nebo mentálním postižením.

Soustřeď se na to, zda je:
- **popsáno, co klient zvládne sám**,
- **jasně formulováno, s čím potřebuje pomoc**,
- **konkrétně uvedeno, kde a jak hygiena probíhá**,
- **uvedeno, jak často probíhá celková hygiena**,
- **zaznamenány zvyklosti, přání nebo rizika**,
- **zmíněno použití pomůcek (např. madla, podložky)**.

Pokud v textu něco chybí nebo je příliš obecné, napiš:
- pochvalu za dosavadní zápis,
- **několik doplňujících otázek** (stručně, konkrétně),
- případné doporučení, např. "zkuste doplnit, jak často...", "upřesněte, co konkrétně klient zvládne sám".

Pokud je zápis kvalitní, jen ho pochval a nepřidávej žádné otázky.

Formátuj odpověď jako Markdown:
- používej nadpisy (`## Hodnocení`, `## Otázky`),
- tučně zvýrazni důležité části,
- používej odrážky.

Vystupuj v přátelském, vřelém a podporujícím tónu.
`.trim();

  // Sestavení zpráv pro OpenAI
  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user',   content: userText }
  ];

  // Připravit payload pro OpenAI API
  const payload = {
    model: process.env.OPENAI_API_MODEL,
    messages,
    temperature: 0.6,
    top_p: 0.9,
    max_tokens: 800
  };

  try {
    // Zavolat OpenAI Chat Completions
    const response = await fetch(
      `${process.env.OPENAI_API_BASE}/chat/completions`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
        },
        body: JSON.stringify(payload)
      }
    );

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      console.error('OpenAI API error:', err);
      return res.status(response.status).json({ error: 'OpenAI request failed', details: err });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content?.trim() || '';

    // Vrátit výsledek front‑endu
    return res.status(200).json({ result: content });

  } catch (err) {
    console.error('Fetch error:', err);
    return res.status(500).json({
      error: 'OpenAI request failed',
      details: err.message
    });
  }
}
