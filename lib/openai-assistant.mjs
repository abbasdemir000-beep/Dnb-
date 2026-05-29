const DEFAULT_MODEL = process.env.OPENAI_MODEL || 'gpt-4.1-mini';

export function createAssistantPrompt({ question, city, category, language, places }) {
  const placeLines = places.map((place) => [
    `id: ${place.id}`,
    `name_en: ${place.name_en}`,
    `name_ar: ${place.name_ar}`,
    `name_ku: ${place.name_ku}`,
    `category: ${place.category_id}`,
    `description_en: ${place.description_en}`,
    `description_ar: ${place.description_ar}`,
    `description_ku: ${place.description_ku}`,
    `rating: ${place.rating}`,
    `hours: ${place.hours}`,
    `verified_at: ${place.verified_at}`,
    `source: ${place.source}`
  ].join('\n')).join('\n---\n');

  return `You are Iraq.ai, a concise trusted city assistant for Iraqi cities.\n` +
    `Answer in this language code when possible: ${language}.\n` +
    `Current city filter: ${city || 'unknown'}. Current category filter: ${category || 'all'}.\n` +
    `Use only the verified internal place records below. If the records are insufficient, say what is missing and suggest changing city/category/search.\n` +
    `Include place names, why they match, and a confidence score from 0 to 1.\n\n` +
    `User question: ${question}\n\n` +
    `Verified internal records:\n${placeLines || 'No matching records.'}`;
}

export function extractResponseText(payload) {
  if (typeof payload.output_text === 'string' && payload.output_text.trim()) {
    return payload.output_text.trim();
  }

  const chunks = [];
  for (const item of payload.output || []) {
    for (const content of item.content || []) {
      if (content.type === 'output_text' && content.text) chunks.push(content.text);
      if (content.type === 'text' && content.text) chunks.push(content.text);
    }
  }
  return chunks.join('\n').trim();
}

export async function callOpenAIAssistant({ apiKey, question, city, category, language, places, fetchImpl = fetch }) {
  if (!apiKey) {
    const error = new Error('OPENAI_API_KEY is not configured on the server.');
    error.statusCode = 501;
    throw error;
  }

  const input = createAssistantPrompt({ question, city, category, language, places });
  const response = await fetchImpl('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: DEFAULT_MODEL,
      input,
      temperature: 0.2,
      max_output_tokens: 450
    })
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(payload.error?.message || `OpenAI API request failed with ${response.status}`);
    error.statusCode = response.status;
    throw error;
  }

  return {
    answer: extractResponseText(payload) || 'No answer text returned by the AI provider.',
    model: payload.model || DEFAULT_MODEL,
    provider: 'openai'
  };
}
