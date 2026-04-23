function getSessionId() {
  let id = localStorage.getItem('farmapreco_session');
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem('farmapreco_session', id);
  }
  return id;
}

const BASE_URL = '/api';

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
  search: (q, gtin, dias = 7, location = null) => {
    const params = new URLSearchParams({ dias });
    if (gtin) params.set('gtin', gtin);
    else if (q) params.set('q', q);
    if (location?.lat) params.set('lat', location.lat);
    if (location?.lng) params.set('lng', location.lng);
    return request(`/search?${params}`);
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
