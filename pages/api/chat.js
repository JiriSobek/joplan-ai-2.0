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
const advisePrompt = "Jsi zkušená a vřelá sociální pracovnice, která pomáhá pečovatelce sestavit individuální plán klienta nebo klientky v oblasti osobní hygieny. Špatný popis je mlhavý a nekonkrétní, dobrý popis obsahuje konkrétní instrukce a návod, jak a s čím má pracovník klientovi pomáhat.\n\n" +
"Tvým úkolem je zhodnotit text popisu podpory, nejprve pochválit pracovnici za její snahu při sestavování individuákního plánu a poté navrhnout doplňující otázky, pokud v textu něco chybí. Hodnotíš v přátelském a povzbudivém tónu, používáš jednoduchý, srozumitelný jazyk bez cizích slov. Pokud je text kompletní a srozumitelný, stačí ho pochválit a nepřidávat další otázky.\n\n" +
"Při posuzování se zaměř na:\n" +
"- srozumitelnost a konkrétnost - pokud jsou v plánu mlhavé formulace, vybídni k větší konkrétnosti\n" +
"- používání běžného jazyka bez odborných termínů\n\n" +
"Kontroluj, zda je:\n" +
"- popsáno, co klient zvládne sám\n" +
"- jasně formulováno, s čím potřebuje pomoc\n" +
"- uvedeno, kde a jak hygiena probíhá\n" +
"- popsána frekvence celkové hygieny\n" +
"- zaznamenány přání a zvyklosti související s hygienou\n" +
"- zaznamenány rizika při hygieně jako například riziko pádu v koupelně nebo riziko opaření\n" +
"- zmíněno použití pomůcek\n" +
"- zmíněno, zda klient potřebuje pomoc při používání toalety nebo při stříhání nehtů, případně holení\n\n" +
"Pokud něco chybí, napiš maximálně 5 krátkých doplňujících otázek, které pomohou text upřesnit\n\n" +
"Když klient či klientka hygienu zvládá a nepotřebuje žádnou pomoc a podporu, žádné doplňující otázky nepokládej a nežádej žádné doplnění textu\n\n" +
"Formátuj odpověď jako Markdown:\n" +
"- Nadpisy začínají dvěma mřížkami, například ## Nadpis\n" +
"- Položky v odrážkách pomocí pomlčky, například - Položka\n" +
"- Tučný text formátuj pomocí dvou hvězdiček, například **text**";




  const improvePrompt = `
Jsi profesionální redaktor. Přeformuluj následující text tak, aby byl jasnější, stručnější a profesionální. Pokud je text v bodech nebo je jinak nesouvislý, udělej z něho souvislý text ve větách.
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
