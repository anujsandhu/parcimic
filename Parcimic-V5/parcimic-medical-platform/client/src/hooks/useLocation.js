import { useState, useCallback } from 'react';

export function useLocation() {
  const [coords, setCoords]   = useState(null);   // { lat, lng }
  const [locating, setLocating] = useState(false);
  const [error, setError]     = useState(null);

  const locate = useCallback(() => {
    setLocating(true);
    setError(null);

    if (!navigator.geolocation) {
      // IP fallback
      fetch('https://ipapi.co/json/')
        .then((r) => r.json())
        .then((d) => {
          if (d.latitude) {
            setCoords({ lat: d.latitude, lng: d.longitude });
          } else {
            setCoords({ lat: 28.6139, lng: 77.209 }); // Delhi fallback
          }
        })
        .catch(() => setCoords({ lat: 28.6139, lng: 77.209 }))
        .finally(() => setLocating(false));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      ({ coords: c }) => {
        setCoords({ lat: c.latitude, lng: c.longitude });
        setLocating(false);
      },
      () => {
        // Browser denied — try IP fallback
        fetch('https://ipapi.co/json/')
          .then((r) => r.json())
          .then((d) => setCoords(d.latitude ? { lat: d.latitude, lng: d.longitude } : { lat: 28.6139, lng: 77.209 }))
          .catch(() => setCoords({ lat: 28.6139, lng: 77.209 }))
          .finally(() => setLocating(false));
      },
      { timeout: 8000, enableHighAccuracy: false }
    );
  }, []);

  return { coords, locating, error, locate };
}
