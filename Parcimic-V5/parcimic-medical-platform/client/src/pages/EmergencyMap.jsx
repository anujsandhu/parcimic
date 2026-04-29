import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Phone, Navigation, AlertCircle, RefreshCw, Building2, Loader } from 'lucide-react';
import toast from 'react-hot-toast';
import { useLocation } from '../hooks/useLocation';
import { getNearbyHealth } from '../utils/api';

const CONTACTS = [
  { label: 'Emergency', number: '112', primary: true,  desc: 'Life-threatening' },
  { label: 'Ambulance', number: '108', primary: false, desc: 'Medical transport' },
  { label: 'Police',    number: '100', primary: false, desc: 'Assistance'        },
];

const TYPE_LABELS = { hospital: 'Hospital', clinic: 'Clinic', pharmacy: 'Pharmacy' };
const TYPE_COLORS = {
  hospital: { text: 'text-danger-500',  bg: 'bg-danger-50'  },
  clinic:   { text: 'text-brand-500',   bg: 'bg-brand-50'   },
  pharmacy: { text: 'text-success-600', bg: 'bg-success-50' },
};

function distLabel(m) {
  if (!m) return '';
  return m < 1000 ? `${m}m` : `${(m / 1000).toFixed(1)}km`;
}

export default function EmergencyMap() {
  const mapRef        = useRef(null);
  const mapInstance   = useRef(null);
  const markersRef    = useRef([]);
  const leafletLoaded = useRef(false);

  const { coords, locating, locate } = useLocation();
  const [places,   setPlaces]   = useState([]);
  const [selected, setSelected] = useState(null);
  const [fetching, setFetching] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [fetchErr, setFetchErr] = useState(null);
  const [radius,   setRadius]   = useState(5); // km

  const initMap = useCallback((lat, lng) => {
    if (!window.L || !mapRef.current) return;
    const L = window.L;
    if (mapInstance.current) {
      mapInstance.current.setView([lat, lng], 14);
    } else {
      const map = L.map(mapRef.current, { zoomControl: true, attributionControl: true }).setView([lat, lng], 14);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://openstreetmap.org">OpenStreetMap</a>', maxZoom: 19,
      }).addTo(map);
      mapInstance.current = map;
    }
    window.L.circleMarker([lat, lng], { radius: 7, fillColor: '#3B82F6', fillOpacity: 1, color: '#fff', weight: 2 })
      .addTo(mapInstance.current).bindPopup('Your location');
    setMapReady(true);
  }, []);

  const addMarkers = useCallback((list) => {
    if (!mapInstance.current || !window.L) return;
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];
    list.forEach((p) => {
      if (!p.lat || !p.lng) return;
      const color = p.type === 'hospital' ? '#EF4444' : p.type === 'clinic' ? '#3B82F6' : '#22C55E';
      const icon = window.L.divIcon({
        html: `<div style="width:10px;height:10px;background:${color};border:2px solid white;border-radius:50%;box-shadow:0 1px 4px rgba(0,0,0,0.3)"></div>`,
        iconSize: [10, 10], iconAnchor: [5, 5], className: '',
      });
      const marker = window.L.marker([p.lat, p.lng], { icon })
        .addTo(mapInstance.current)
        .bindPopup(`<strong>${p.name}</strong><br/>${TYPE_LABELS[p.type] || p.type}`);
      marker.on('click', () => setSelected(p));
      markersRef.current.push(marker);
    });
  }, []);

  const fetchNearby = useCallback(async (lat, lng, radiusKm) => {
    setFetching(true);
    setFetchErr(null);
    try {
      const data = await getNearbyHealth(lat, lng, radiusKm);
      const list = data.results || [];
      setPlaces(list);
      addMarkers(list);
      if (list.length === 0) toast('No facilities found in this radius. Try increasing it.', { icon: 'ℹ️' });
      else toast.success(`${list.length} places found nearby`);
    } catch (err) {
      const msg = err.response?.data?.error || 'Could not load nearby hospitals';
      setFetchErr(msg);
      toast.error(msg);
    } finally { setFetching(false); }
  }, [addMarkers]);

  useEffect(() => {
    if (leafletLoaded.current) return;
    leafletLoaded.current = true;
    
    // Load Leaflet CSS
    if (!document.querySelector('link[href*="leaflet"]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      link.crossOrigin = 'anonymous';
      document.head.appendChild(link);
    }
    
    // Load Leaflet JS
    if (!window.L) {
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.async = true;
      script.crossOrigin = 'anonymous';
      script.onload = () => { 
        if (coords) { 
          initMap(coords.lat, coords.lng); 
          fetchNearby(coords.lat, coords.lng, radius); 
        } 
      };
      script.onerror = () => {
        console.error('Failed to load Leaflet');
        toast.error('Map failed to load. Please refresh the page.');
      };
      document.head.appendChild(script);
    }
  }, []); // eslint-disable-line

  useEffect(() => {
    if (!coords) return;
    if (window.L) { initMap(coords.lat, coords.lng); fetchNearby(coords.lat, coords.lng, radius); }
  }, [coords]); // eslint-disable-line

  useEffect(() => { locate(); }, []); // eslint-disable-line

  const handleRefresh = () => { setPlaces([]); setSelected(null); locate(); };

  const handleRadiusChange = (newRadius) => {
    setRadius(newRadius);
    if (coords && window.L) fetchNearby(coords.lat, coords.lng, newRadius);
  };

  return (
    <div className="w-full">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-4 md:py-6 lg:py-8">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Emergency Help</h1>
            <p className="text-sm md:text-base text-gray-500 mt-1">Find hospitals, clinics, and pharmacies near you</p>
          </div>
          <button onClick={handleRefresh} disabled={locating || fetching} className="btn btn-secondary w-full md:w-auto">
            {(locating || fetching)
              ? <><Loader size={14} className="animate-spin" /> Loading</>
              : <><RefreshCw size={14} strokeWidth={2} /> Refresh</>
            }
          </button>
        </div>

        {/* Emergency numbers */}
        <div className="card p-6 md:p-8 mb-6 md:mb-8">
          <p className="section-label">Emergency Numbers</p>
          <div className="grid grid-cols-3 gap-3 md:gap-4">
            {CONTACTS.map((c) => (
              <a key={c.number} href={`tel:${c.number}`}
                className={`flex flex-col items-center gap-2 py-4 md:py-6 rounded-xl border transition-all hover:shadow-md touch-manipulation ${
                  c.primary
                    ? 'bg-danger-500 border-danger-500 text-white hover:bg-danger-600'
                    : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
                }`}>
                <span className={`text-2xl md:text-3xl font-bold ${c.primary ? 'text-white' : 'text-gray-900'}`}>{c.number}</span>
                <span className={`text-xs md:text-sm font-semibold ${c.primary ? 'text-red-100' : 'text-gray-600'}`}>{c.label}</span>
                <span className={`text-[10px] md:text-xs ${c.primary ? 'text-red-200' : 'text-gray-400'} hidden sm:block`}>{c.desc}</span>
              </a>
            ))}
          </div>
        </div>

        {/* DESKTOP: 2-COLUMN LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
          
          {/* LEFT: Map */}
          <div className="card overflow-hidden lg:sticky lg:top-24 lg:self-start">
            <div className="px-5 md:px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <p className="text-base font-semibold text-gray-900">Nearby Facilities</p>
                {places.length > 0 && (
                  <span className="badge-safe">{places.length} found</span>
                )}
              </div>
              {coords && (
                <span className="text-xs text-gray-400 font-mono hidden md:block">
                  {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}
                </span>
              )}
            </div>

            {/* Radius slider */}
            <div className="px-5 md:px-6 py-4 border-b border-gray-100 flex items-center gap-4">
              <span className="text-sm text-gray-500 shrink-0 font-medium">Radius</span>
              <input
                type="range" min="1" max="20" step="1" value={radius}
                onChange={(e) => handleRadiusChange(Number(e.target.value))}
                className="flex-1 h-2 accent-brand-500 cursor-pointer"
              />
              <span className="text-sm font-semibold text-gray-700 shrink-0 w-12 text-right">{radius} km</span>
            </div>

            <div style={{ position: 'relative', height: '400px' }} className="md:h-96 lg:h-[500px]">
              <div ref={mapRef} style={{ height: '100%', width: '100%' }} />
              {!mapReady && (
                <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
                  className="flex flex-col items-center justify-center bg-gray-50 text-gray-400">
                  <Loader size={32} className="mb-3 animate-spin text-brand-400" />
                  <p className="text-sm px-4 text-center">{locating ? 'Getting your location...' : 'Loading map...'}</p>
                </div>
              )}
              {fetching && mapReady && (
                <div style={{ position: 'absolute', top: 12, right: 12, pointerEvents: 'none' }}
                  className="bg-white rounded-lg px-3 py-2 shadow-md flex items-center gap-2 text-xs text-brand-600 border border-gray-200 font-medium">
                  <Loader size={12} className="animate-spin" /> Searching...
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: List */}
          <div className="space-y-6">
            
            {/* Error */}
            {fetchErr && !fetching && (
              <div className="card p-5 md:p-6 border-l-4 border-danger-500">
                <div className="flex items-start gap-3">
                  <AlertCircle size={20} className="text-danger-500 shrink-0 mt-0.5" strokeWidth={2} />
                  <div>
                    <p className="text-base font-semibold text-gray-900">Could not load nearby hospitals</p>
                    <p className="text-sm text-gray-500 mt-1">{fetchErr}</p>
                    <button onClick={handleRefresh} className="btn btn-secondary btn-sm mt-3">
                      <RefreshCw size={13} /> Try again
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Selected place */}
            {selected && (
              <div className="card p-6 md:p-8 animate-fade-in">
                <div className="flex items-start justify-between gap-4 mb-5">
                  <div className="flex items-start gap-4 flex-1">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${TYPE_COLORS[selected.type]?.bg || 'bg-gray-100'}`}>
                      <Building2 size={20} className={TYPE_COLORS[selected.type]?.text || 'text-gray-500'} strokeWidth={1.75} />
                    </div>
                    <div className="flex-1">
                      <p className="text-lg font-semibold text-gray-900">{selected.name}</p>
                      <p className="text-base text-gray-500 mt-1">
                        {TYPE_LABELS[selected.type] || selected.type}
                        {selected.distanceM && <span className="text-brand-600 font-medium"> · {distLabel(selected.distanceM)} away</span>}
                      </p>
                      {selected.address && <p className="text-sm text-gray-400 mt-2">{selected.address}</p>}
                      {selected.phone && (
                        <a href={`tel:${selected.phone}`} className="text-base text-brand-600 mt-2 font-medium block">{selected.phone}</a>
                      )}
                    </div>
                  </div>
                  <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100 transition-colors text-xl leading-none">
                    ×
                  </button>
                </div>
                <div className="flex gap-3">
                  <a href={`https://www.google.com/maps?q=${selected.lat},${selected.lng}`}
                    target="_blank" rel="noopener noreferrer"
                    className="btn-primary btn flex-1 justify-center">
                    <Navigation size={14} strokeWidth={2} /> Open in Maps
                  </a>
                  {selected.phone && (
                    <a href={`tel:${selected.phone}`} className="btn btn-secondary flex-1 justify-center">
                      <Phone size={14} strokeWidth={2} /> Call
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* List */}
            {places.length > 0 && (
              <div className="card overflow-hidden">
                <div className="px-5 md:px-6 py-4 border-b border-gray-100">
                  <p className="text-base font-semibold text-gray-900">All Nearby ({places.length})</p>
                </div>
                <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
                  {places.map((p) => (
                    <button key={p.id} onClick={() => setSelected(p)}
                      className={`w-full flex items-center gap-4 px-5 md:px-6 py-4 text-left hover:bg-gray-50 transition-colors ${selected?.id === p.id ? 'bg-brand-50' : ''}`}>
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${TYPE_COLORS[p.type]?.bg || 'bg-gray-100'}`}>
                        <Building2 size={16} className={TYPE_COLORS[p.type]?.text || 'text-gray-500'} strokeWidth={1.75} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-base font-medium text-gray-900 truncate">{p.name}</p>
                        <p className="text-sm text-gray-400">
                          {TYPE_LABELS[p.type] || p.type}
                          {p.distanceM && <span className="text-brand-600 font-medium"> · {distLabel(p.distanceM)}</span>}
                        </p>
                      </div>
                      <Navigation size={14} className="text-gray-300 shrink-0" strokeWidth={2} />
                    </button>
                  ))}
                </div>
              </div>
            )}

          </div>

        </div>

        <p className="text-xs text-gray-400 text-center mt-8">
          Data from OpenStreetMap · Always consult a healthcare professional
        </p>
      </div>
    </div>
  );
}
