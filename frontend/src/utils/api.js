function getSessionId() {
  let id = localStorage.getItem('farmapreco_session');
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem('farmapreco_session', id);
  }
  return id;
}

const BASE_URL = '/api';

// Quando VITE_SEARCH_BASE_URL está definido, busca vai direto ao servidor em São Paulo (Fly.io)
// sem passar pelo Netlify — resolve o timeout de 10s com a API SEFAZ
const SEARCH_ORIGIN = import.meta.env.VITE_SEARCH_BASE_URL || '';

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      'X-Session-Id': getSessionId(),
      ...(options.headers || {})
    },
    ...options
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Erro desconhecido' }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }

  return res.json();
}

export const api = {
  search: (q, gtin, dias = 7, location = null, ibge = null) => {
    const params = new URLSearchParams({ dias });
    if (gtin) params.set('gtin', gtin);
    else if (q) params.set('q', q);
    if (location?.lat) { params.set('lat', location.lat); params.set('lng', location.lng); }
    else if (ibge) params.set('ibge', ibge);
    return fetch(`${SEARCH_ORIGIN}/api/search?${params}`, {
      headers: { 'Content-Type': 'application/json', 'X-Session-Id': getSessionId() }
    }).then(r => {
      if (!r.ok) return r.json().catch(() => ({})).then(e => Promise.reject(new Error(e.error || `HTTP ${r.status}`)));
      return r.json();
    });
  },

  getBasket: () => {
    const sid = getSessionId();
    return request(`/basket?session_id=${sid}`);
  },

  addToBasket: (product) =>
    request('/basket', { method: 'POST', body: JSON.stringify(product) }),

  removeFromBasket: (id) => {
    const sid = getSessionId();
    return request(`/basket/${id}?session_id=${sid}`, { method: 'DELETE' });
  },

  clearBasket: () => {
    const sid = getSessionId();
    return request(`/basket?session_id=${sid}`, { method: 'DELETE' });
  },

  compareBasket: () => {
    const sid = getSessionId();
    return request(`/basket/compare?session_id=${sid}`);
  },

  getStats: () => request('/stats'),

  health: () => fetch('/health').then(r => r.json()).catch(() => null)
};
