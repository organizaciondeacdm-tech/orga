// src/components/SchoolMap.jsx
import { useState, useEffect } from "react";

// Cargar el script de Google Maps
const loadGoogleMapsScript = (apiKey) => {
  if (document.querySelector('script[src*="maps.googleapis"]')) {
    return Promise.resolve();
  }
  
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = resolve;
    document.head.appendChild(script);
  });
};

export default function SchoolMap({ escuela }) {
  const [map, setMap] = useState(null);
  const [marker, setMarker] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // API Key de Google Maps (idealmente desde variable de entorno)
  const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

  useEffect(() => {
    if (!API_KEY) {
      setError('API Key de Google Maps no configurada');
      setLoading(false);
      return;
    }

    async function initMap() {
      try {
        await loadGoogleMapsScript(API_KEY);
        
        // Geocodificar la dirección
        const geocoder = new window.google.maps.Geocoder();
        geocoder.geocode({ address: escuela.direccion }, (results, status) => {
          if (status === 'OK' && results[0]) {
            const location = results[0].geometry.location;
            
            // Inicializar mapa
            const mapInstance = new window.google.maps.Map(
              document.getElementById(`map-${escuela.id}`),
              {
                center: location,
                zoom: 15,
                styles: [
                  { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
                  { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
                  { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
                  {
                    featureType: "administrative.locality",
                    elementType: "labels.text.fill",
                    stylers: [{ color: "#d59563" }]
                  },
                  {
                    featureType: "road",
                    elementType: "geometry",
                    stylers: [{ color: "#38414e" }]
                  },
                  {
                    featureType: "road",
                    elementType: "geometry.stroke",
                    stylers: [{ color: "#212a37" }]
                  },
                  {
                    featureType: "road",
                    elementType: "labels.text.fill",
                    stylers: [{ color: "#9ca5b3" }]
                  },
                  {
                    featureType: "water",
                    elementType: "geometry",
                    stylers: [{ color: "#17263c" }]
                  }
                ]
              }
            );

            // Agregar marcador
            const markerInstance = new window.google.maps.Marker({
              position: location,
              map: mapInstance,
              title: escuela.escuela,
              animation: window.google.maps.Animation.DROP
            });

            // Info window
            const infoWindow = new window.google.maps.InfoWindow({
              content: `
                <div style="color: #000; padding: 8px;">
                  <strong>${escuela.escuela}</strong><br>
                  ${escuela.direccion}<br>
                  ${escuela.telefonos?.join(' | ') || ''}
                </div>
              `
            });

            markerInstance.addListener('click', () => {
              infoWindow.open(mapInstance, markerInstance);
            });

            setMap(mapInstance);
            setMarker(markerInstance);
          } else {
            setError('No se pudo encontrar la dirección');
          }
          setLoading(false);
        });
      } catch (err) {
        setError('Error al cargar el mapa');
        setLoading(false);
      }
    }

    initMap();
  }, [escuela]);

  return (
    <div className="school-map-container">
      {loading && <div className="map-loading">Cargando mapa...</div>}
      {error && (
        <div className="map-error">
          <span>⚠️</span>
          <span>{error}</span>
          <a 
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(escuela.direccion)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="map-fallback-link"
          >
            Ver en Google Maps
          </a>
        </div>
      )}
      <div 
        id={`map-${escuela.id}`} 
        className="school-map"
        style={{ width: '100%', height: '300px', borderRadius: '8px' }}
      ></div>
    </div>
  );
}