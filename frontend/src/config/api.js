export const API_BASE = process.env.REACT_APP_API_URL || 'https://api.layeroi.com';

export const getHeaders = () => {
  const token = localStorage.getItem('layeroi_token');
  const apiKey = localStorage.getItem('layeroi_api_key');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(apiKey ? { 'X-LayerROI-Key': apiKey } : {}),
  };
};

export const api = {
  get: (path) => fetch(`${API_BASE}${path}`, { headers: getHeaders() }).then(r => r.json()),
  post: (path, body) => fetch(`${API_BASE}${path}`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(body) }).then(r => r.json()),
  patch: (path, body) => fetch(`${API_BASE}${path}`, { method: 'PATCH', headers: getHeaders(), body: JSON.stringify(body) }).then(r => r.json()),
  delete: (path) => fetch(`${API_BASE}${path}`, { method: 'DELETE', headers: getHeaders() }).then(r => r.json()),
};
