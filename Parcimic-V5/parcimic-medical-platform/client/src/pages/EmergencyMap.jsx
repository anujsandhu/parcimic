import React, { useEffect, useRef, useState, useCallback } from 'react';
import { MapPin, Phone, Navigation, AlertCircle, RefreshCw, Building2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useLocation } from '../hooks/useLocation';
import { getNearbyHealth } from '../utils/api';

const CONTACTS = [
  { label: 'Emergency', number: '112', cls: 'btn-danger' },
  { label: 'Ambulance', number: '108', cls: 'btn-secondary' },
  { label: 'Police',    number: '100', cls: 'btn-secondary' },
];

const TYPE_LABELS = { hospital: 'Hospital', clinic: 'Clinic', pharmacy: 'Pharmacy' };
const TYPE_COLORS = {
  hospital: 'text-red-500 bg-red-50',
  clinic:   'text-brand-500 bg-brand-50',
  pharmacy: 'text-green-600 bg-green-50',
};

function distLabel(m) {
  if (!m) return '';
  return m < 1000 ? `${m}m away` : `${(m / 1000).toFixed(1)}km away`;
}

export default function EmergencyMap() {
  const mapRef                        = useRef(null);
  const mapInstanceRef                = useRef(null);
  const markersRef                    = useRef([]);
  const { coords, locating, locate }  = useLocation();
  const [places, setPlaces]           = useState([]);
  const [selected, setSelected]       = useState(null);
  const [fetching, setFetching]       = useState(false);
  const [mapReady, setMapReady]       = useState(false);

  // Init OpenLayers-free map using Leaflet loaded from CDN
  const initLeafletMap = useCallback((lat, lng) => {
    if (!mapRef.current) return;
    // Dynamically load Leaflet if not present
    if (!window.L) return;
    const L = window.L;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([lat, lng], 14);
    } else {
      const map = L.map(mapRef.current, { zoomControl: true }).setView([lat, lng], 14);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);
      mapInstanceRef.current = map;
    }

    // User marker
    const L2 = window.L;
    const userIcon = L2.divIcon({
      html: '<div style="width:14px;height:14px;background:#3B82F6;border:3px solid white;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.3)"></div>',
      iconSize: [14, 14], iconAnchor: [7, 7], className: '',
    });
    L2.marker([lat, lng], { icon: userIcon }).addTo(mapInstanceRef.current)
      .bindPopup('Your location').openPopup();

    setMapReady(true);
  }, []);

  // Add place markers to map
  const addMarkers = useCallback((list) => {
    if (!mapInstanceRef.current || !window.L) return;
    const L = window.L;
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];
    list.forEach((p) => {
      if (!p.lat || !p.lng) return;
      const color = p.type === 'hospital' ? '#EF4444' : p.type === 'clinic' ? '#3B82F6' : '#22C55E';
      const icon = L.divIcon({
        html: `<div style="width:10px;height:10px;background:${color};border:2px solid white;border-radius:50%;box-shadow:0 1px 4px rgba(0,0,0,0.3)"></div>`,
        iconSize: [10, 10], iconAnchor: [5, 5], className: '',
      });
      const marker = L.marker([p.lat, p.lng], { icon })
        .addTo(mapInstanceRef.current)
        .bindPopup(`<strong>${p.name}</strong><br/>${TYPE_LABELS[p.type] || p.type}`);
      marker.on('click', () => setSelected(p));
      markersRef.current.push(marker);
    });
  }, []);

  // Fetch nearby healthcare from backend (Overpass API)
  const fetchNearby = useCallback(async (lat, lng) => {
    setFetching(true);
    try {
      const data = await getNearbyHealth(lat, lng);
      const list = data.results || [];
      setPlaces(list);
      addMarkers(list);
      if (list.length === 0) toast('No healthcare facilities found nearby', { icon: 'ℹ️' });
    } catch {
      toast.error('Could not load nearby hospitals');
    } finally {
      setFetching(false);
    }
  }, [addMarkers]);

  // Load Leaflet CSS + JS dynamically
  useEffect(() => {
    if (window.L) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);

    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload = () => { if (coords) { initLeafletMap(coords.lat, coords.lng); fetchNearby(coords.lat, coords.lng); } };
    document.head.appendChild(script);
  }, []); // eslint-disable-line

  // When coords arrive, init map + fetch
  useEffect(() => {
    if (!coords) return;
    if (window.L) {
      initLeafletMap(coords.lat, coords.lng);
      fetchNearby(coords.lat, coords.lng);
    }
  }, [coords]); // eslint-disable-line

  // Auto-locate on mount
  useEffect(() => { locate(); }, []); // eslint-disable-line

  const handleRefresh = () => {
    locate();
    toast('Refreshing location...');
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Emergency Help</h1>
          <p className="text-sm text-neutral-500 mt-0.5">Find nearby hospitals and emergency contacts</p>
        </div>
        <button onClick={handleRefresh} disabled={locating || fetching}
          className="btn-secondary btn btn-sm">
          <RefreshCw size={13} className={locating || fetching ? 'animate-spin' : ''} />
          {locating ? 'Locating...' : 'Refresh'}
        </button>
      </div>

      {/* Emergency call buttons */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <AlertCircle size={15} className="text-red-500" />
          <h2 className="font-semibold text-neutral-900 text-sm">Emergency Contacts</h2>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {CONTACTS.map((c) => (
            <a key={c.number} href={`tel:${c.number}`}
              className={`btn ${c.cls} justify-center py-3 flex-col gap-1`}>
              <Phone size={15} />
              <span className="text-base font-bold">{c.number}</span>
              <span className="text-xs opacity-80">{c.label}</span>
            </a>
          ))}
        </div>
      </div>

      {/* Map — Leaflet renders here; no React children inside the map div */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100">
          <h2 className="font-semibold text-neutral-900 text-sm flex items-center gap-2">
            <MapPin size={15} className="text-brand-500" /> Nearby Healthcare
            {places.length > 0 && (
              <span className="text-xs bg-brand-50 text-brand-600 px-2 py-0.5 rounded-full font-medium">
                {places.length} found
              </span>
            )}
          </h2>
          {coords && (
            <span className="text-xs text-neutral-400">
              {coords.lat.toFixed(3)}, {coords.lng.toFixed(3)}
            </span>
          )}
        </div>

        {/* Map container — Leaflet owns this div; no React children inside */}
        <div style={{ position: 'relative', height: '340px' }}>
          <div ref={mapRef} style={{ height: '100%', width: '100%' }} />
          {!mapReady && (
            <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
              className="flex flex-col items-center justify-center bg-neutral-100 text-neutral-400">
              <MapPin size={28} className="mb-2 opacity-40" />
              <p className="text-sm">{locating ? 'Getting your location...' : 'Loading map...'}</p>
            </div>
          )}
          {fetching && (
            <div style={{ position: 'absolute', top: 12, right: 12, pointerEvents: 'none' }}
              className="bg-white rounded-xl px-3 py-2 shadow-card flex items-center gap-2 text-xs text-neutral-500">
              <div className="w-3 h-3 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
              Finding hospitals...
            </div>
          )}
        </div>
      </div>

      {/* Selected place detail */}
      {selected && (
        <div className="card p-5 border-l-4 border-brand-500 animate-slide-up">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${TYPE_COLORS[selected.type] || 'text-neutral-500 bg-neutral-100'}`}>
                <Building2 size={16} />
              </div>
              <div>
                <h3 className="font-semibold text-neutral-900 text-sm">{selected.name}</h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  {TYPE_LABELS[selected.type] || selected.type}
                  {selected.distanceM ? ` · ${distLabel(selected.distanceM)}` : ''}
                </p>
                {selected.address && <p className="text-xs text-neutral-400 mt-0.5">{selected.address}</p>}
                {selected.phone && (
                  <a href={`tel:${selected.phone}`} className="text-xs text-brand-500 mt-0.5 block">{selected.phone}</a>
                )}
              </div>
            </div>
            <button onClick={() => setSelected(null)} className="btn-ghost btn p-1.5 shrink-0">
              <span className="text-neutral-400 text-lg leading-none">×</span>
            </button>
          </div>
          <div className="flex gap-2 mt-4">
            <a
              href={`https://www.google.com/maps?q=${selected.lat},${selected.lng}`}
              target="_blank" rel="noopener noreferrer"
              className="btn-primary btn btn-sm flex-1 justify-center"
            >
              <Navigation size={13} /> Open in Maps
            </a>
            {selected.phone && (
              <a href={`tel:${selected.phone}`} className="btn-secondary btn btn-sm flex-1 justify-center">
                <Phone size={13} /> Call
              </a>
            )}
          </div>
        </div>
      )}

      {/* Hospital list */}
      {places.length > 0 && (
        <div className="card divide-y divide-neutral-100">
          {places.map((p) => (
            <button key={p.id} onClick={() => setSelected(p)}
              className={`w-full flex items-start gap-3 px-5 py-4 text-left hover:bg-neutral-50 transition-colors ${selected?.id === p.id ? 'bg-brand-50' : ''}`}>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${TYPE_COLORS[p.type] || 'text-neutral-500 bg-neutral-100'}`}>
                <Building2 size={14} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-neutral-900 text-sm truncate">{p.name}</div>
                <div className="text-xs text-neutral-400 mt-0.5">
                  {TYPE_LABELS[p.type] || p.type}
                  {p.distanceM ? ` · ${distLabel(p.distanceM)}` : ''}
                </div>
              </div>
              <Navigation size={13} className="text-neutral-300 mt-1 shrink-0" />
            </button>
          ))}
        </div>
      )}

      <p className="text-xs text-neutral-400 text-center">
        Hospital data from OpenStreetMap · Free & open source
      </p>
    </div>
  );
}
