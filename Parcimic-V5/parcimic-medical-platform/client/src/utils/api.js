import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

export const predictSepsis = (p) => api.post('/api/predict-sepsis', p).then((r) => r.data);
export const llmExplain = (p) => api.post('/api/llm/explain', p).then((r) => r.data);
export const llmChat = (p) => api.post('/api/llm/chat', p).then((r) => r.data);

// Get nearby healthcare facilities
export const getNearbyHealth = async (lat, lng, radiusKm = 5) => {
  // Try backend first (for local development)
  try {
    const response = await api.get(`/api/nearby-healthcare?lat=${lat}&lng=${lng}&radius=${radiusKm * 1000}`);
    return response.data;
  } catch (error) {
    // If backend fails (production), call OpenStreetMap directly
    console.log('Backend unavailable, calling OpenStreetMap directly');
    return getNearbyHealthDirect(lat, lng, radiusKm);
  }
};

// Direct OpenStreetMap API call (for production without backend)
export const getNearbyHealthDirect = async (lat, lng, radiusKm = 5) => {
  const radius = radiusKm * 1000; // Convert km to meters
  
  const query = `
[out:json][timeout:20];
(
  node["amenity"="hospital"](around:${radius},${lat},${lng});
  way["amenity"="hospital"](around:${radius},${lat},${lng});
  node["amenity"="clinic"](around:${radius},${lat},${lng});
  way["amenity"="clinic"](around:${radius},${lat},${lng});
  node["amenity"="pharmacy"](around:${radius},${lat},${lng});
);
out center 20;
  `.trim();

  try {
    const response = await axios.post(
      'https://overpass-api.de/api/interpreter',
      `data=${encodeURIComponent(query)}`,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        timeout: 25000,
      }
    );

    const elements = response.data.elements || [];
    const results = elements
      .filter((e) => e.tags?.name)
      .map((e) => {
        const elat = e.lat ?? e.center?.lat;
        const elng = e.lon ?? e.center?.lon;
        const dist = (elat && elng)
          ? Math.round(
              Math.sqrt(
                Math.pow((elat - +lat) * 111000, 2) +
                  Math.pow((elng - +lng) * 111000 * Math.cos((+lat * Math.PI) / 180), 2)
              )
            )
          : null;
        return {
          id: String(e.id),
          name: e.tags.name,
          type: e.tags.amenity,
          address:
            [e.tags['addr:street'], e.tags['addr:city']].filter(Boolean).join(', ') || null,
          phone: e.tags.phone || e.tags['contact:phone'] || null,
          website: e.tags.website || null,
          lat: elat,
          lng: elng,
          distanceM: dist,
        };
      })
      .filter((e) => e.lat && e.lng)
      .sort((a, b) => (a.distanceM || 99999) - (b.distanceM || 99999))
      .slice(0, 12);

    return { results, total: results.length };
  } catch (error) {
    console.error('OpenStreetMap API error:', error);
    throw new Error('Could not load nearby facilities. Please try again.');
  }
};

export default api;

