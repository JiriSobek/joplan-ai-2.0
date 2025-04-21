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
    // System prompt kombinuje chválu a větvení: buď jen pochvala, nebo pochvala + otázky
    const systemPrompt = `
Jsi zkušená sociální pracovnice. Dostaneš text popisující péči o osobní hygienu klientky.
Tvůj výstup musí vždy začít **povzbuzující větou** oceňující snahu pečovatelky (např. "Skvělá práce s popisem, moc oceňuji váš přístup!").

– Pokud text **obsahuje všechny** klíčové informace (co klientka zvládne sama, jakou konkrétní pomoc potřebuje, kde hygiena probíhá, frekvence, používané pomůcky, rizika a opatření), **pouze tu pochvalu zopakuj** a nic dalšího nepřidávej.

– Pokud v textu **něco chybí** nebo je nejasné, nejprve **polož 5–7 krátkých, přátelských a povzbudivých otázek** k doplnění, a pak **stručně doporuč**, jaké konkrétní informace doplnit.

Formátuj výstup **jako Markdown** s nadpisy (`##`), odrážkami (`-`) a tučným textem (`**`). Nikdy nevytvářej oba výstupy najednou – buď pouze pochvala, nebo pochvala + otázky s doporučením.
`.trim();

    messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user',   content: userText }
    ];

  } else {
    // režim "improve" – přeformulování textu
    const systemPrompt = `
Jsi profesionální redaktor. Přeformuluj následující text tak, aby byl co nejasnější, stručnější a profesionální.
Výstup formátuj jako čistý text rozdělený do několika přehledných odstavců.
`.trim();

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

