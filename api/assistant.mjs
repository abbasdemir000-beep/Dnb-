import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { callOpenAIAssistant } from '../lib/openai-assistant.mjs';

async function readJsonBody(request) {
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  if (!chunks.length) return {};
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

function filterPlaces(data, { cityId, categoryId = 'all', query = '' }) {
  const normalizedQuery = String(query).trim().toLocaleLowerCase();
  return data.places.filter((place) => {
    const fields = [
      place.name_en,
      place.name_ar,
      place.name_ku,
      place.description_en,
      place.description_ar,
      place.description_ku,
      place.category_id
    ].join(' ').toLocaleLowerCase();

    return place.city_id === cityId &&
      (categoryId === 'all' || place.category_id === categoryId) &&
      (!normalizedQuery || fields.includes(normalizedQuery));
  });
}

async function loadData() {
  const file = await readFile(join(process.cwd(), 'data', 'places.json'), 'utf8');
  return JSON.parse(file);
}

export async function handleAssistantRequest(body) {
  const question = String(body.question || '').trim();
  if (!question) {
    return { status: 400, payload: { error: 'Question is required.' } };
  }

  const data = await loadData();
  const cityId = body.cityId || 'kirkuk';
  const categoryId = body.categoryId || 'all';
  const language = body.language || 'en';
  const matches = filterPlaces(data, { cityId, categoryId, query: question });
  const scopedPlaces = (matches.length ? matches : filterPlaces(data, { cityId, categoryId })).slice(0, 6);
  const city = data.cities.find((item) => item.id === cityId)?.name_en || cityId;

  const ai = await callOpenAIAssistant({
    apiKey: process.env.OPENAI_API_KEY,
    question,
    city,
    category: categoryId,
    language,
    places: scopedPlaces
  });

  return {
    status: 200,
    payload: {
      ...ai,
      confidence: scopedPlaces.length ? Math.min(0.95, 0.68 + scopedPlaces.length * 0.04) : 0.32,
      sources: scopedPlaces.map((place) => ({ id: place.id, name: place.name_en, verified_at: place.verified_at }))
    }
  };
}

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.statusCode = 405;
    response.setHeader('content-type', 'application/json; charset=utf-8');
    response.end(JSON.stringify({ error: 'Method not allowed.' }));
    return;
  }

  try {
    const result = await handleAssistantRequest(await readJsonBody(request));
    response.statusCode = result.status;
    response.setHeader('content-type', 'application/json; charset=utf-8');
    response.end(JSON.stringify(result.payload));
  } catch (error) {
    response.statusCode = error.statusCode || 500;
    response.setHeader('content-type', 'application/json; charset=utf-8');
    response.end(JSON.stringify({ error: error.message || 'Assistant request failed.' }));
  }
}
