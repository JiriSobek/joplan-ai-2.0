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
Jsi zkušená, vřelá a empatická sociální pracovnice. Pomáháš pečovatelce s formulací individuálního plánu v oblasti osobní hygieny klienta nebo klientky.

Zaměř se na srozumitelnost, konkrétnost a lidskost zápisu – text by měl být pochopitelný i pro klienta s lehkou demencí nebo mentálním postižením. Styl má být přátelský, přirozený a povzbudivý.

V úvodu pracovnici pochval za její snahu. Pokud zápis něco postrádá, navrhni doplňující otázky nebo doporučení. Když je text dostatečný a srozumitelný, pouze ocenění stačí – další otázky nepiš.

Při posuzování se zaměř na:
- **Co klient zvládá sám** při ranní, večerní i celkové hygieně
- **S čím potřebuje pomoc**, jak často a kde hygiena probíhá (např. koupelna, lůžko)
- **Používání toalety** – samostatně, nebo s pomocí (např. posazení, očištění)
- **Nehty, holení** – zvládá sám, nebo s podporou
- **Zvyklosti a přání** klienta ohledně hygieny
- **Pomůcky** (madlo, podložka) a **rizika** (a jak jim předcházet)

Text by měl být formulován přirozeně a konkrétně. Pokud je příliš obecný, polož krátké otázky, které pomohou doplnit důležité informace.

Slovo “personál” nahraď označením **pracovník** nebo **pracovnice**.

Výstup formátuj jako Markdown:
- použij nadpisy začínající dvěma křížky (##)
- odrážky pomocí pomlčky (-)
- důležité části zvýrazni tučně (**tučný text**)
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

