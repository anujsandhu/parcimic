import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

export const predictSepsis    = (p) => api.post('/api/predict-sepsis', p).then((r) => r.data);
export const llmExplain       = (p) => api.post('/api/llm/explain', p).then((r) => r.data);
export const llmChat          = (p) => api.post('/api/llm/chat', p).then((r) => r.data);
export const getNearbyHealth  = (lat, lng, radiusKm = 5) => api.get(`/api/nearby-healthcare?lat=${lat}&lng=${lng}&radius=${radiusKm * 1000}`).then((r) => r.data);

export default api;
