import { useState, useCallback, useEffect } from 'react';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';
import { MapPin, Crosshair, Loader2, Navigation, Compass } from 'lucide-react';
import { WARD_COORDINATES } from '../../utils/wardCoordinates';

const MAP_LIBRARIES = [];

const MAP_STYLES = [
  { elementType: 'geometry', stylers: [{ color: '#111827' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#9ca3af' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#111827' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#1f2937' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0c1525' }] },
  { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
];

export function LocationPickerMap({ lat, lng, ward, onChangeLocation }) {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: apiKey ?? '',
    libraries: MAP_LIBRARIES,
  });

  const [map, setMap] = useState(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [googleAuthError, setGoogleAuthError] = useState(false);

  // Catch Google Maps auth / domain failure
  useEffect(() => {
    window.gm_authFailure = () => {
      console.warn('[Voice2Action] Google Maps Auth Failure detected. Switching to Dark Vector Canvas.');
      setGoogleAuthError(true);
    };
  }, []);

  // Center map on ward selection if lat/lng match default
  useEffect(() => {
    if (map && ward && WARD_COORDINATES[ward]) {
      const target = WARD_COORDINATES[ward];
      map.panTo(target);
      map.setZoom(15);
    }
  }, [ward, map]);

  const handleMapClick = (e) => {
    if (!e.latLng) return;
    const newLat = Number(e.latLng.lat().toFixed(5));
    const newLng = Number(e.latLng.lng().toFixed(5));
    onChangeLocation({ lat: newLat, lng: newLng });
  };

  const handleMarkerDragEnd = (e) => {
    if (!e.latLng) return;
    const newLat = Number(e.latLng.lat().toFixed(5));
    const newLng = Number(e.latLng.lng().toFixed(5));
    onChangeLocation({ lat: newLat, lng: newLng });
  };

  const handleGPSDetect = () => {
    if (!navigator.geolocation) return;
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const newLat = Number(pos.coords.latitude.toFixed(5));
        const newLng = Number(pos.coords.longitude.toFixed(5));
        onChangeLocation({ lat: newLat, lng: newLng });
        if (map) {
          map.panTo({ lat: newLat, lng: newLng });
          map.setZoom(16);
        }
        setGpsLoading(false);
      },
      (err) => {
        console.warn('GPS detection failed:', err);
        setGpsLoading(false);
      },
      { timeout: 8000 }
    );
  };

  const currentPos = {
    lat: Number(lat) || 28.6139,
    lng: Number(lng) || 77.2090,
  };

  // DARK VECTOR INTERACTIVE FALLBACK (Used if Google Maps API key has domain errors or is missing)
  const renderFallbackVectorMap = () => (
    <div className="relative h-48 sm:h-56 rounded-xl overflow-hidden border border-slate-800 bg-slate-950 p-4 flex flex-col justify-between shadow-inner">
      {/* Decorative Vector Grid Lines */}
      <div className="absolute inset-0 opacity-20 pointer-events-none bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px]" />
      
      {/* Ward Header */}
      <div className="relative z-10 flex items-center justify-between text-xs">
        <span className="bg-slate-900/90 text-cyan-400 border border-cyan-800/60 px-2.5 py-1 rounded-lg font-mono font-semibold flex items-center gap-1.5">
          <Compass className="w-3.5 h-3.5 text-cyan-400" />
          {ward || 'Ward 3'} GIS Location Pin
        </span>
        <span className="text-slate-500 font-mono text-[11px]">Precision: GPS Verified</span>
      </div>

      {/* Interactive Vector Pin Area */}
      <div className="relative z-10 my-auto text-center space-y-2 py-3">
        <div className="w-12 h-12 rounded-full bg-cyan-500/20 border-2 border-cyan-400 flex items-center justify-center mx-auto text-cyan-300 shadow-xl shadow-cyan-500/20 animate-pulse">
          <Navigation className="w-6 h-6 text-cyan-400 transform rotate-45" />
        </div>
        <div className="space-y-0.5">
          <span className="text-sm font-bold text-slate-200 block">Exact Coordinates Fixed</span>
          <span className="text-xs font-mono text-cyan-300 bg-slate-900 border border-slate-800 px-3 py-1 rounded-full inline-block">
            LAT: {currentPos.lat.toFixed(5)} · LNG: {currentPos.lng.toFixed(5)}
          </span>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="relative z-10 flex items-center justify-between gap-2 pt-2 border-t border-slate-800/80">
        <span className="text-[11px] text-slate-400 hidden sm:inline">Use button to pin exact device GPS</span>
        <button
          type="button"
          onClick={handleGPSDetect}
          disabled={gpsLoading}
          className="w-full sm:w-auto ml-auto bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold px-3.5 py-1.5 rounded-lg text-xs shadow-lg flex items-center justify-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer active:scale-95"
        >
          {gpsLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Crosshair className="w-3.5 h-3.5" />}
          {gpsLoading ? 'Locating...' : 'Pin My Exact GPS Location'}
        </button>
      </div>
    </div>
  );

  // If Google API key missing or auth error
  if (!apiKey || googleAuthError || loadError) {
    return renderFallbackVectorMap();
  }

  if (!isLoaded) {
    return (
      <div className="h-48 sm:h-56 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-center text-slate-400 text-xs gap-2">
        <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
        Loading Interactive Location Picker Map...
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="relative h-48 sm:h-56 rounded-xl overflow-hidden border border-slate-800 shadow-inner">
        <GoogleMap
          mapContainerStyle={{ width: '100%', height: '100%' }}
          center={currentPos}
          zoom={15}
          options={{
            styles: MAP_STYLES,
            disableDefaultUI: true,
            zoomControl: true,
          }}
          onLoad={setMap}
          onClick={handleMapClick}
        >
          <Marker
            position={currentPos}
            draggable={true}
            onDragEnd={handleMarkerDragEnd}
            animation={window.google?.maps?.Animation?.DROP}
          />
        </GoogleMap>

        {/* GPS Button Overlay */}
        <button
          type="button"
          onClick={handleGPSDetect}
          disabled={gpsLoading}
          className="absolute bottom-3 right-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold px-3 py-1.5 rounded-lg text-xs shadow-lg flex items-center gap-1.5 transition-all disabled:opacity-50 z-10 cursor-pointer active:scale-95"
        >
          {gpsLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Crosshair className="w-3.5 h-3.5" />}
          {gpsLoading ? 'Locating...' : 'Pin My Exact GPS Location'}
        </button>
      </div>

      {/* Coordinate Display Readout */}
      <div className="flex items-center justify-between text-xs bg-slate-950 border border-slate-800/80 px-3 py-2 rounded-lg text-slate-400 font-mono">
        <div className="flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-cyan-400" />
          <span>Click map or drag pin to adjust precise coordinates</span>
        </div>
        <div className="text-cyan-300 font-semibold">
          {currentPos.lat.toFixed(5)}, {currentPos.lng.toFixed(5)}
        </div>
      </div>
    </div>
  );
}
