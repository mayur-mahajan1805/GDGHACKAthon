import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, Crosshair, Loader2, Navigation } from 'lucide-react';
import { WARD_COORDINATES } from '../../utils/wardCoordinates';

// Custom Cyan Pin Icon for Leaflet
const pickerIcon = L.divIcon({
  className: 'custom-picker-pin',
  html: `
    <div style="
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      transform: translate(-50%, -100%);
      cursor: grab;
    ">
      <div style="
        width: 28px;
        height: 28px;
        border-radius: 9999px;
        background: #06b6d4;
        border: 2.5px solid #ffffff;
        box-shadow: 0 0 16px rgba(6, 182, 212, 0.8), 0 4px 12px rgba(0,0,0,0.6);
        display: flex;
        align-items: center;
        justify-content: center;
        color: #020617;
        font-weight: 900;
        font-size: 14px;
      ">
        📍
      </div>
      <div style="
        width: 8px;
        height: 8px;
        background: #06b6d4;
        transform: rotate(45deg);
        margin-top: -4px;
        box-shadow: 1px 1px 4px rgba(0,0,0,0.5);
      "></div>
    </div>
  `,
  iconSize: [0, 0],
  iconAnchor: [0, 0],
});

// Map click & pan controller
function PickerEvents({ onChangeLocation, currentPos }) {
  const map = useMap();

  useMapEvents({
    click(e) {
      const newLat = Number(e.latlng.lat.toFixed(5));
      const newLng = Number(e.latlng.lng.toFixed(5));
      onChangeLocation({ lat: newLat, lng: newLng });
    },
  });

  useEffect(() => {
    if (currentPos && typeof currentPos.lat === 'number' && typeof currentPos.lng === 'number') {
      map.panTo([currentPos.lat, currentPos.lng]);
    }
  }, [currentPos.lat, currentPos.lng, map]);

  return null;
}

export function LocationPickerMap({ lat, lng, ward, onChangeLocation }) {
  const [gpsLoading, setGpsLoading] = useState(false);
  const markerRef = useRef(null);

  const currentPos = {
    lat: Number(lat) || 28.6139,
    lng: Number(lng) || 77.2090,
  };

  const handleMarkerDragEnd = () => {
    const marker = markerRef.current;
    if (marker != null) {
      const latlng = marker.getLatLng();
      onChangeLocation({
        lat: Number(latlng.lat.toFixed(5)),
        lng: Number(latlng.lng.toFixed(5)),
      });
    }
  };

  const handleGPSDetect = () => {
    if (!navigator.geolocation) return;
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const newLat = Number(pos.coords.latitude.toFixed(5));
        const newLng = Number(pos.coords.longitude.toFixed(5));
        onChangeLocation({ lat: newLat, lng: newLng });
        setGpsLoading(false);
      },
      (err) => {
        console.warn('GPS detection failed:', err);
        setGpsLoading(false);
      },
      { timeout: 8000 }
    );
  };

  return (
    <div className="space-y-2">
      <div className="relative h-52 sm:h-60 rounded-xl overflow-hidden border border-slate-800 shadow-inner bg-slate-950">
        <MapContainer
          center={[currentPos.lat, currentPos.lng]}
          zoom={15}
          scrollWheelZoom={false}
          className="w-full h-full z-0"
          style={{ background: '#090d16' }}
        >
          {/* CartoDB Dark Matter GIS Tiles */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}{r}.png"
            subdomains="abcd"
            maxZoom={19}
          />

          <PickerEvents onChangeLocation={onChangeLocation} currentPos={currentPos} />

          <Marker
            ref={markerRef}
            position={[currentPos.lat, currentPos.lng]}
            icon={pickerIcon}
            draggable={true}
            eventHandlers={{
              dragend: handleMarkerDragEnd,
            }}
          />
        </MapContainer>

        {/* GPS Button Overlay */}
        <button
          type="button"
          onClick={handleGPSDetect}
          disabled={gpsLoading}
          className="absolute bottom-3 right-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold px-3.5 py-1.5 rounded-lg text-xs shadow-xl flex items-center gap-1.5 transition-all disabled:opacity-50 z-[400] cursor-pointer active:scale-95"
        >
          {gpsLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Crosshair className="w-3.5 h-3.5" />}
          {gpsLoading ? 'Locating...' : 'Pin My Exact GPS'}
        </button>

        {/* Hint banner */}
        <div className="absolute top-2 left-2 z-[400] bg-slate-900/90 backdrop-blur-md border border-slate-800 text-slate-300 text-[11px] px-2.5 py-1 rounded-md flex items-center gap-1.5 pointer-events-none">
          <Navigation className="w-3 h-3 text-cyan-400" />
          <span>Click map or drag pin to adjust</span>
        </div>
      </div>

      {/* Coordinate Display Readout */}
      <div className="flex items-center justify-between text-xs bg-slate-950 border border-slate-800/80 px-3 py-2 rounded-lg text-slate-400 font-mono">
        <div className="flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-cyan-400" />
          <span>Pin Location Coordinates</span>
        </div>
        <div className="text-cyan-300 font-semibold">
          {currentPos.lat.toFixed(5)}, {currentPos.lng.toFixed(5)}
        </div>
      </div>
    </div>
  );
}
