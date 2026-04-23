import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const GEO_KEY = 'farmapreco_location';
const GEO_TTL = 10 * 60 * 1000; // 10 minutos

const GeoContext = createContext(null);

export function GeoProvider({ children }) {
  const [location, setLocation] = useState(null); // { lat, lng, timestamp }
  const [status, setStatus] = useState('idle'); // idle | requesting | granted | denied | unavailable

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setStatus('unavailable');
      return;
    }

    setStatus('requesting');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const data = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          timestamp: Date.now()
        };
        setLocation(data);
        setStatus('granted');
        try { localStorage.setItem(GEO_KEY, JSON.stringify(data)); } catch {}
      },
      () => {
        setStatus('denied');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: GEO_TTL }
    );
  }, []);

  // Ao montar, tenta usar cache ou pede nova localização
  useEffect(() => {
    try {
      const cached = JSON.parse(localStorage.getItem(GEO_KEY) || 'null');
      if (cached && Date.now() - cached.timestamp < GEO_TTL) {
        setLocation(cached);
        setStatus('granted');
        return;
      }
    } catch {}
    requestLocation();
  }, []);

  return (
    <GeoContext.Provider value={{ location, status, requestLocation }}>
      {children}
    </GeoContext.Provider>
  );
}

export const useGeoLocation = () => useContext(GeoContext);
