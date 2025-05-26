import fetch from 'node-fetch';

const API_KEY = 'sk-proj-...'; // DEIN API KEY hier einfügen

async function testFetch() {
  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [{ role: 'user', content: 'Sag mir etwas über Maschinenbau.' }],
        temperature: 0.5,
      }),
    });

    const data = await res.json();
    console.log('Antwort:', data);

  } catch (error) {
    console.error('Direkter Fetch-Fehler:', error);
  }
}

testFetch();
