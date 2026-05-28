const state = {
  data: null,
  cityId: 'kirkuk',
  categoryId: 'all',
  language: 'en',
  query: '',
  activePlaceId: null,
  events: JSON.parse(globalThis.localStorage?.getItem('iraqAiEvents') || '[]')
};

const labels = {
  en: {
    all: 'All categories',
    verified: 'Verified',
    call: 'Call',
    directions: 'Directions',
    route: 'Route via partner',
    confidence: 'Confidence',
    answerPrefix: 'I found the best internal matches first:',
    noResults: 'No verified places match yet. Try another category or city.'
  },
  ar: {
    all: 'كل الفئات',
    verified: 'موثّق',
    call: 'اتصال',
    directions: 'الاتجاهات',
    route: 'تحويل للشريك',
    confidence: 'الثقة',
    answerPrefix: 'وجدت أفضل النتائج من البيانات الداخلية أولاً:',
    noResults: 'لا توجد أماكن موثقة مطابقة حالياً. جرّب فئة أو مدينة أخرى.'
  },
  ku: {
    all: 'هەموو پۆلەکان',
    verified: 'پشتڕاستکراو',
    call: 'پەیوەندی',
    directions: 'ڕێنمایی',
    route: 'ڕەوانەکردن بۆ هاوبەش',
    confidence: 'دڵنیایی',
    answerPrefix: 'باشترین ئەنجامە ناوخۆییەکانم دۆزییەوە:',
    noResults: 'هیچ شوێنێکی پشتڕاستکراو نەدۆزرایەوە. پۆل یان شارێکی تر تاقی بکەوە.'
  }
};

const $ = (selector) => document.querySelector(selector);

export function getLocalized(entity, field, language = 'en') {
  return entity[`${field}_${language}`] || entity[`${field}_en`] || '';
}

export function scorePartner(partner) {
  return Number((0.7 * partner.user_satisfaction + 0.3 * partner.commission_rate).toFixed(4));
}

export function choosePartner(partners) {
  return partners
    .filter((partner) => partner.is_active)
    .map((partner) => ({ ...partner, score: scorePartner(partner) }))
    .sort((a, b) => b.score - a.score)[0];
}

export function filterPlaces(data, { cityId, categoryId = 'all', query = '', language = 'en' }) {
  const normalizedQuery = query.trim().toLocaleLowerCase();
  return data.places.filter((place) => {
    const fields = [
      getLocalized(place, 'name', language),
      getLocalized(place, 'description', language),
      place.name_en,
      place.name_ar,
      place.name_ku,
      place.category_id
    ].join(' ').toLocaleLowerCase();

    return place.city_id === cityId &&
      (categoryId === 'all' || place.category_id === categoryId) &&
      (!normalizedQuery || fields.includes(normalizedQuery));
  });
}

export function buildAssistantAnswer(data, filters, question) {
  const matches = filterPlaces(data, { ...filters, query: question }).slice(0, 3);
  const fallback = matches.length ? matches : filterPlaces(data, filters).slice(0, 3);
  const confidence = fallback.length ? Math.min(0.95, 0.68 + fallback.length * 0.08) : 0.32;
  return { matches: fallback, confidence: Number(confidence.toFixed(2)) };
}

function categoryName(categoryId) {
  const category = state.data.categories.find((item) => item.id === categoryId);
  return category ? getLocalized(category, 'name', state.language) : labels[state.language].all;
}

function renderFilters() {
  $('#citySelect').innerHTML = state.data.cities.map((city) => (
    `<option value="${city.id}">${getLocalized(city, 'name', state.language)}</option>`
  )).join('');
  $('#citySelect').value = state.cityId;

  $('#categorySelect').innerHTML = [
    `<option value="all">${labels[state.language].all}</option>`,
    ...state.data.categories.map((category) => `<option value="${category.id}">${getLocalized(category, 'name', state.language)}</option>`)
  ].join('');
  $('#categorySelect').value = state.categoryId;
  $('#languageSelect').value = state.language;
  document.documentElement.lang = state.language;
  document.documentElement.dir = state.language === 'ar' || state.language === 'ku' ? 'rtl' : 'ltr';
}

function getCurrentPlaces() {
  return filterPlaces(state.data, state);
}

function positionFor(place) {
  const city = state.data.cities.find((item) => item.id === place.city_id);
  const dx = (place.lng - city.center.lng) * 850;
  const dy = (city.center.lat - place.lat) * 850;
  return {
    x: `${Math.max(10, Math.min(90, 50 + dx))}%`,
    y: `${Math.max(12, Math.min(88, 50 + dy))}%`
  };
}

function renderMap(places) {
  $('#mapCanvas').innerHTML = places.map((place) => {
    const position = positionFor(place);
    const active = place.id === state.activePlaceId ? ' active' : '';
    return `<button class="pin${active}" type="button" data-place-id="${place.id}" style="--x:${position.x};--y:${position.y}">
      <span>${place.image}</span><small>${getLocalized(place, 'name', state.language)}</small>
    </button>`;
  }).join('');
}

function renderResults(places) {
  $('#resultSummary').textContent = `${places.length} ${places.length === 1 ? 'result' : 'results'}`;
  $('#resultsList').innerHTML = places.length ? places.map((place) => {
    const active = place.id === state.activePlaceId ? ' active' : '';
    return `<button class="place-card${active}" type="button" data-place-id="${place.id}">
      <strong>${place.image} ${getLocalized(place, 'name', state.language)}</strong>
      <span>${categoryName(place.category_id)} • ⭐ ${place.rating} • ${labels[state.language].verified} ${place.verified_at}</span>
      <span>${getLocalized(place, 'description', state.language)}</span>
    </button>`;
  }).join('') : `<p class="muted">${labels[state.language].noResults}</p>`;
}

function renderDetail() {
  const place = state.data.places.find((item) => item.id === state.activePlaceId) || getCurrentPlaces()[0];
  if (!place) {
    $('#placeDetail').innerHTML = `<p class="muted">${labels[state.language].noResults}</p>`;
    return;
  }
  state.activePlaceId = place.id;
  const partner = choosePartner(state.data.partners);
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${place.lat},${place.lng}`;
  $('#placeDetail').innerHTML = `
    <div class="detail-hero">
      <div class="detail-icon">${place.image}</div>
      <div>
        <p class="eyebrow">${categoryName(place.category_id)}</p>
        <h2>${getLocalized(place, 'name', state.language)}</h2>
        <p class="muted">${getLocalized(place, 'description', state.language)}</p>
      </div>
    </div>
    <p><strong>⭐ ${place.rating}</strong> • ${labels[state.language].verified}: ${place.verified_at} • ${place.hours}</p>
    <p class="muted">Source: ${place.source} • ${place.lat.toFixed(4)}, ${place.lng.toFixed(4)}</p>
    <div class="action-row">
      <a href="tel:${place.phone}">${labels[state.language].call}</a>
      <a href="${mapsUrl}" target="_blank" rel="noreferrer">${labels[state.language].directions}</a>
      <button type="button" id="routeButton" data-partner-id="${partner.id}">${labels[state.language].route}: ${partner.name}</button>
    </div>`;
}

function renderQa() {
  const staleCutoff = new Date('2026-05-28');
  staleCutoff.setDate(staleCutoff.getDate() - 30);
  const items = state.data.places.map((place) => {
    const verifiedDate = new Date(place.verified_at);
    const status = verifiedDate < staleCutoff ? 'Needs refresh' : 'Fresh';
    return `<li class="qa-item"><strong>${getLocalized(place, 'name', state.language)}</strong><span class="muted">${status} • ${place.verified_at}</span></li>`;
  }).join('');
  $('#qaList').innerHTML = items;
  $('#eventLog').textContent = JSON.stringify(state.events, null, 2);
}

function render() {
  renderFilters();
  const places = getCurrentPlaces();
  if (!places.some((place) => place.id === state.activePlaceId)) {
    state.activePlaceId = places[0]?.id || null;
  }
  $('#placeCount').textContent = state.data.places.length;
  renderMap(places);
  renderResults(places);
  renderDetail();
  renderQa();
}

function selectPlace(placeId) {
  state.activePlaceId = placeId;
  render();
  document.querySelector('#placeDetail').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function logRoute() {
  const place = state.data.places.find((item) => item.id === state.activePlaceId);
  const partner = choosePartner(state.data.partners);
  const event = {
    id: crypto.randomUUID(),
    place_id: place.id,
    partner_id: partner.id,
    score: partner.score,
    clicked_at: new Date().toISOString()
  };
  state.events.unshift(event);
  state.events = state.events.slice(0, 10);
  localStorage.setItem('iraqAiEvents', JSON.stringify(state.events));
  renderQa();
  const url = partner.deep_link_template.replace('{place_id}', encodeURIComponent(place.id));
  window.open(url, '_blank', 'noreferrer');
}

async function boot() {
  const response = await fetch('data/places.json');
  state.data = await response.json();

  $('#searchForm').addEventListener('submit', (event) => {
    event.preventDefault();
    state.query = $('#queryInput').value;
    render();
  });
  $('#citySelect').addEventListener('change', (event) => { state.cityId = event.target.value; render(); });
  $('#categorySelect').addEventListener('change', (event) => { state.categoryId = event.target.value; render(); });
  $('#languageSelect').addEventListener('change', (event) => { state.language = event.target.value; render(); });
  $('#themeToggle').addEventListener('click', () => {
    const dark = document.documentElement.dataset.theme !== 'dark';
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    $('#themeToggle').textContent = dark ? 'Light' : 'Dark';
  });
  document.body.addEventListener('click', (event) => {
    const card = event.target.closest('[data-place-id]');
    if (card) selectPlace(card.dataset.placeId);
    if (event.target.id === 'routeButton') logRoute();
  });
  $('#assistantForm').addEventListener('submit', (event) => {
    event.preventDefault();
    const question = $('#assistantQuestion').value;
    const answer = buildAssistantAnswer(state.data, state, question);
    const lines = answer.matches.map((place) => `• ${getLocalized(place, 'name', state.language)} — ${getLocalized(place, 'description', state.language)}`);
    $('#assistantAnswer').textContent = `${labels[state.language].answerPrefix}\n${lines.join('\n') || labels[state.language].noResults}\n\n${labels[state.language].confidence}: ${answer.confidence}`;
  });
  $('#exportEvents').addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(state.events, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = Object.assign(document.createElement('a'), { href: url, download: 'iraq-ai-routing-events.json' });
    anchor.click();
    URL.revokeObjectURL(url);
  });
  render();
}

if (typeof window !== 'undefined') {
  boot().catch((error) => {
    document.body.innerHTML = `<main class="panel"><h1>Unable to load Iraq.ai</h1><pre>${error.message}</pre></main>`;
  });
}
