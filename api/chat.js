// api/chat.js
export default async function handler(req, res) {
  console.log('=== /api/chat CALLED ===');
  console.log('Request body:', JSON.stringify(req.body));

  if (req.method !== 'POST') {
    console.error('Wrong method:', req.method);
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const { promptType, userText } = req.body;
  if (!promptType || !userText) {
    console.error('Missing parameters:', req.body);
    return res.status(400).json({ error: 'Missing parameters' });
  }

  const systemPrompt = promptType === 'advise'
    ? 'Prompt č. 1: Posuď následující text a navrhni doporučení pro pečovatelku:'
    : 'Prompt č. 2: Přeformuluj následující text tak, aby byl jasnější a profesionálnější:';

  const payload = { messages: [
    { role: 'system', content: systemPrompt },
    { role: 'user',   content: userText }
  ]};

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
    console.log('Azure HTTP status:', azureRes.status);
    console.log('Azure response JSON:', JSON.stringify(data));

    // Pro ladění vraťte celé data od Azure:
    return res.status(200).json(data);

  } catch (err) {
    console.error('Fetch error:', err);
    return res.status(500).json({ error: 'Request to Azure failed', details: err.message });
  }
}
