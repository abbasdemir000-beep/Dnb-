import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { buildAssistantAnswer, choosePartner, filterPlaces, getLocalized, scorePartner } from '../src/app.js';
import { createAssistantPrompt, extractResponseText } from '../lib/openai-assistant.mjs';

const data = JSON.parse(await readFile(new URL('../data/places.json', import.meta.url), 'utf8'));

assert.equal(data.cities.length, 3, 'MVP should seed the three Phase 1 cities');
assert.ok(data.places.every((place) => Number.isFinite(place.lat) && Number.isFinite(place.lng)), 'Every place needs map coordinates');
assert.ok(data.places.every((place) => place.verified_at && place.source), 'Every place needs trust metadata');

const kirkukRestaurants = filterPlaces(data, {
  cityId: 'kirkuk',
  categoryId: 'restaurants',
  query: 'family',
  language: 'en'
});
assert.equal(kirkukRestaurants.length, 1, 'Search should filter by city, category, and query');
assert.equal(getLocalized(kirkukRestaurants[0], 'name', 'ar'), 'مطعم العائلة كركوك');

const partner = choosePartner(data.partners);
assert.equal(partner.id, 'local-delivery', 'Routing should prefer weighted satisfaction and commission among active partners');
assert.equal(scorePartner(partner), 0.703, 'Partner score should use 0.7 satisfaction and 0.3 commission');

const aiAnswer = buildAssistantAnswer(data, { cityId: 'baghdad', categoryId: 'pharmacies', language: 'en' }, 'medicine');
assert.equal(aiAnswer.matches[0].id, 'baghdad-night-pharmacy', 'Assistant should retrieve internal matching place first');
assert.ok(aiAnswer.confidence > 0.6, 'Assistant should return confidence for internal results');


const prompt = createAssistantPrompt({
  question: 'best pharmacy',
  city: 'Baghdad',
  category: 'pharmacies',
  language: 'en',
  places: [data.places.find((place) => place.id === 'baghdad-night-pharmacy')]
});
assert.ok(prompt.includes('Night Pharmacy'), 'OpenAI prompt should include internal place context');
assert.ok(prompt.includes('Use only the verified internal place records'), 'OpenAI prompt should constrain answers to trusted records');

const text = extractResponseText({ output: [{ content: [{ type: 'output_text', text: 'AI answer' }] }] });
assert.equal(text, 'AI answer', 'Responses API text extraction should support output content');

console.log('All Iraq.ai MVP checks passed');
