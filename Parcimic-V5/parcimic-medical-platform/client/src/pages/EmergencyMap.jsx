import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Phone, Navigation, AlertCircle, RefreshCw, Building2, Loader, MapPin, X, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';
import { useLocation } from '../hooks/useLocation';
import { getNearbyHealth } from '../utils/api';

const EMERGENCY_CONTACTS = [
  { label: 'Emergency', number: '112', color: 'bg-red-500', desc: 'Life-threatening' },
  { label: 'Ambulance', number: '108', color: 'bg-orange-500', desc: 'Medical transport' },
  { label: 'Police', number: '100', color: 'bg-blue-500', desc: 'Assistance' },
];

const TYPE_CONFIG = {
  hospital: { label: 'Hospital', color: '#EF4444', emoji: '🏥' },
  clinic: { label: 'Clinic', color: '#3B82F6', emoji: '⚕️' },
  pharmacy: { label: 'Pharmacy', color: '#22C55E', emoji: '💊' },
};

function distanceLabel(meters) {
  if (!meters) return '';
  return meters < 1000 ? `${meters}m` : `${(meters / 1000).toFixed(1)}km`;
}

export default function EmergencyMap() {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markersRef = useRef([]);
  const leafletLoaded = useRef(false);

  const { coords, locating, locate } = useLocation();
  const [places, setPlaces] = useState([]);
  const [selected, setSelected] = useState(null);
  const [fetching, setFetching] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [error, setError] = useState(null);
  const [radius, setRadius] = useState(5);
  const [showList, setShowList] = useState(false);

  // Initialize map
  const initMap = useCallback((lat, lng) => {
    if (!window.L || !mapRef.current) return;
    
    if (mapInstance.current) {
      mapInstance.current.setView([lat, lng], 14);
    } else {
      const map = window.L.map(mapRef.current, {
        zoomControl: true,
        attributionControl: false,
        scrollWheelZoom: true,
        dragging: true,
        touchZoom: true,
        doubleClickZoom: true,
        tap: true,
      }).setView([lat, lng], 14);

      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
      }).addTo(map);

      mapInstance.current = map;
    }

    // Add user location marker
    window.L.circleMarker([lat, lng], {
      radius: 10,
      fillColor: '#3B82F6',
      fillOpacity: 1,
      color: '#fff',
      weight: 3,
    }).addTo(mapInstance.current).bindPopup('<div style="text-align:center;padding:4px"><strong>📍 You are here</strong></div>');

    setMapReady(true);
  }, []);

  // Add facility markers
  const addMarkers = useCallback((list) => {
    if (!mapInstance.current || !window.L) return;
    
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    list.forEach((place) => {
      if (!place.lat || !place.lng) return;

      const config = TYPE_CONFIG[place.type] || TYPE_CONFIG.hospital;

      const icon = window.L.divIcon({
        html: `<div style="width:20px;height:20px;background:${config.color};border:3px solid white;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,0.3)"></div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10],
        className: '',
      });

      const marker = window.L.marker([place.lat, place.lng], { icon })
        .addTo(mapInstance.current)
        .bindPopup(`
          <div style="padding:8px;min-width:150px">
            <div style="font-size:16px;margin-bottom:4px">${config.emoji}</div>
            <strong style="font-size:14px">${place.name}</strong><br/>
            <span style="color:#666;font-size:12px">${config.label}</span>
            ${place.distanceM ? `<br/><span style="color:#3B82F6;font-weight:bold;font-size:12px">${distanceLabel(place.distanceM)} away</span>` : ''}
          </div>
        `);

      marker.on('click', () => {
        setSelected(place);
        setShowList(true);
      });
      
      markersRef.current.push(marker);
    });
  }, []);

  // Fetch nearby facilities
  const fetchNearby = useCallback(async (lat, lng, radiusKm) => {
    setFetching(true);
    setError(null);
    try {
      const data = await getNearbyHealth(lat, lng, radiusKm);
      const list = data.results || [];
      setPlaces(list);
      addMarkers(list);
      if (list.length === 0) {
        toast('No facilities found. Try increasing the radius.', { icon: 'ℹ️' });
      } else {
        toast.success(`Found ${list.length} facilities nearby`);
      }
    } catch (err) {
      const msg = err.response?.data?.error || 'Could not load nearby facilities';
      setError(msg);
      toast.error(msg);
    } finally {
      setFetching(false);
    }
  }, [addMarkers]);

  // Load Leaflet
  useEffect(() => {
    if (leafletLoaded.current) return;
    leafletLoaded.current = true;

    if (!document.querySelector('link[href*="leaflet"]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      link.crossOrigin = 'anonymous';
      document.head.appendChild(link);
    }

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
        toast.error('Map failed to load. Please refresh.');
      };
      document.head.appendChild(script);
    }
  }, []); // eslint-disable-line

  useEffect(() => {
    if (!coords) return;
    if (window.L) {
      initMap(coords.lat, coords.lng);
      fetchNearby(coords.lat, coords.lng, radius);
    }
  }, [coords]); // eslint-disable-line

  useEffect(() => {
    locate();
  }, []); // eslint-disable-line

  const handleRefresh = () => {
    setPlaces([]);
    setSelected(null);
    setError(null);
    locate();
  };

  const handleRadiusChange = (newRadius) => {
    setRadius(newRadius);
    if (coords && window.L) fetchNearby(coords.lat, coords.lng, newRadius);
  };

  return (
    <div className="h-full flex flex-col bg-white overflow-hidden">
      
      {/* MAP SECTION - TOP (Mobile First Design) */}
      <div className="shrink-0 relative" style={{ height: '45vh', minHeight: '300px' }}>
        {/* Map Container */}
        <div ref={mapRef} className="absolute inset-0 z-0" />

        {/* Map Controls Overlay */}
        <div className="absolute top-0 left-0 right-0 z-10 p-3 bg-gradient-to-b from-black/30 to-transparent pointer-events-none">
          <div className="flex items-center justify-between pointer-events-auto">
            <div className="bg-white rounded-xl shadow-lg px-3 py-2 flex items-center gap-2">
              <MapPin size={16} className="text-brand-600" strokeWidth={2} />
              <span className="text-sm font-bold text-gray-900">
                {places.length > 0 ? `${places.length} nearby` : 'Searching...'}
              </span>
            </div>
            <button
              onClick={handleRefresh}
              disabled={locating || fetching}
              className="bg-white rounded-xl shadow-lg p-2.5 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <RefreshCw size={18} className={`text-gray-700 ${locating || fetching ? 'animate-spin' : ''}`} strokeWidth={2} />
            </button>
          </div>
        </div>

        {/* Radius Control */}
        <div className="absolute bottom-0 left-0 right-0 z-10 p-3 bg-gradient-to-t from-black/30 to-transparent pointer-events-none">
          <div className="bg-white rounded-xl shadow-lg px-4 py-3 pointer-events-auto">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-gray-700 shrink-0">Radius:</span>
              <input
                type="range"
                min="1"
                max="20"
                step="1"
                value={radius}
                onChange={(e) => handleRadiusChange(Number(e.target.value))}
                className="flex-1 h-2 accent-brand-500"
              />
              <span className="text-sm font-bold text-brand-600 bg-brand-50 px-3 py-1 rounded-lg min-w-[60px] text-center">
                {radius} km
              </span>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {!mapReady && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 z-20">
            <div className="w-16 h-16 rounded-full bg-brand-100 flex items-center justify-center mb-4 animate-pulse">
              <Loader size={32} className="animate-spin text-brand-500" strokeWidth={2} />
            </div>
            <p className="text-base font-bold text-gray-700">
              {locating ? 'Getting your location...' : 'Loading map...'}
            </p>
          </div>
        )}

        {/* Fetching Indicator */}
        {fetching && mapReady && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 z-10 bg-white rounded-full px-4 py-2 shadow-lg flex items-center gap-2 text-sm font-semibold text-brand-600">
            <Loader size={14} className="animate-spin" />
            Searching...
          </div>
        )}
      </div>

      {/* EMERGENCY CONTACTS - BELOW MAP */}
      <div className="shrink-0 bg-gradient-to-br from-red-50 to-orange-50 px-4 py-4 border-b-2 border-gray-200">
        <p className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-3 flex items-center gap-2">
          <Phone size={14} className="text-red-600" strokeWidth={2} />
          Emergency Hotlines
        </p>
        <div className="grid grid-cols-3 gap-2">
          {EMERGENCY_CONTACTS.map((contact) => (
            <a
              key={contact.number}
              href={`tel:${contact.number}`}
              className={`${contact.color} text-white rounded-xl p-3 text-center shadow-md hover:shadow-lg active:scale-95 transition-all`}
            >
              <div className="text-xl font-bold mb-1">{contact.number}</div>
              <div className="text-[10px] font-semibold opacity-90">{contact.label}</div>
            </a>
          ))}
        </div>
      </div>

      {/* FACILITIES LIST - SCROLLABLE */}
      <div className="flex-1 overflow-y-auto bg-gray-50">
        {/* Toggle Button */}
        <button
          onClick={() => setShowList(!showList)}
          className="w-full bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Building2 size={18} className="text-gray-600" strokeWidth={2} />
            <span className="text-sm font-bold text-gray-900">
              Nearby Facilities ({places.length})
            </span>
          </div>
          <ChevronDown size={18} className={`text-gray-400 transition-transform ${showList ? 'rotate-180' : ''}`} />
        </button>

        {/* Error State */}
        {error && !fetching && (
          <div className="p-4">
            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 flex items-start gap-3">
              <AlertCircle size={20} className="text-red-600 shrink-0 mt-0.5" strokeWidth={2} />
              <div className="flex-1">
                <p className="text-sm font-bold text-red-900">Error Loading Facilities</p>
                <p className="text-xs text-red-700 mt-1">{error}</p>
                <button onClick={handleRefresh} className="mt-3 text-xs font-bold text-red-600 hover:text-red-700 underline">
                  Try Again
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Selected Facility Card */}
        {selected && showList && (
          <div className="bg-gradient-to-br from-brand-50 to-blue-50 border-b-4 border-brand-300 p-4">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-14 h-14 rounded-2xl bg-white shadow-lg flex items-center justify-center text-3xl shrink-0">
                {TYPE_CONFIG[selected.type]?.emoji || '🏥'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-base font-bold text-gray-900 leading-tight">{selected.name}</p>
                <p className="text-sm text-gray-600 mt-1">
                  {TYPE_CONFIG[selected.type]?.label || 'Facility'}
                  {selected.distanceM && (
                    <span className="text-brand-600 font-bold"> · {distanceLabel(selected.distanceM)}</span>
                  )}
                </p>
                {selected.address && (
                  <p className="text-xs text-gray-500 mt-2 line-clamp-2">{selected.address}</p>
                )}
              </div>
              <button
                onClick={() => setSelected(null)}
                className="p-2 hover:bg-white/50 rounded-lg transition-colors shrink-0"
              >
                <X size={18} className="text-gray-500" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <a
                href={`https://www.google.com/maps?q=${selected.lat},${selected.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary btn text-sm py-3 justify-center shadow-md"
              >
                <Navigation size={16} strokeWidth={2} /> Directions
              </a>
              {selected.phone ? (
                <a href={`tel:${selected.phone}`} className="btn btn-secondary text-sm py-3 justify-center shadow-md">
                  <Phone size={16} strokeWidth={2} /> Call
                </a>
              ) : (
                <button disabled className="btn btn-secondary text-sm py-3 justify-center opacity-50">
                  No Phone
                </button>
              )}
            </div>
          </div>
        )}

        {/* Facilities List */}
        {showList && places.length > 0 && (
          <div className="bg-white divide-y divide-gray-100">
            {places.map((place) => {
              const config = TYPE_CONFIG[place.type] || TYPE_CONFIG.hospital;
              const isSelected = selected?.id === place.id;
              return (
                <button
                  key={place.id}
                  onClick={() => {
                    setSelected(place);
                    if (mapInstance.current && place.lat && place.lng) {
                      mapInstance.current.setView([place.lat, place.lng], 16);
                    }
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-4 text-left hover:bg-gray-50 active:bg-gray-100 transition-colors ${
                    isSelected ? 'bg-brand-50 border-l-4 border-brand-500' : ''
                  }`}
                >
                  <div className="w-12 h-12 rounded-xl bg-white shadow-md flex items-center justify-center text-2xl shrink-0">
                    {config.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate">{place.name}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {config.label}
                      {place.distanceM && (
                        <span className="text-brand-600 font-bold"> · {distanceLabel(place.distanceM)}</span>
                      )}
                    </p>
                  </div>
                  <Navigation size={16} className="text-gray-400 shrink-0" strokeWidth={2} />
                </button>
              );
            })}
          </div>
        )}

        {/* Empty State */}
        {showList && places.length === 0 && !fetching && !error && (
          <div className="p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <Building2 size={32} className="text-gray-400" strokeWidth={1.5} />
            </div>
            <p className="text-sm font-bold text-gray-700">No facilities found</p>
            <p className="text-xs text-gray-500 mt-1">Try increasing the search radius</p>
          </div>
        )}
      </div>
    </div>
  );
}
