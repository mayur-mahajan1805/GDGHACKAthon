import { useState, useCallback, useEffect, useRef } from 'react';
import { GoogleMap, useJsApiLoader, OverlayView } from '@react-google-maps/api';
import { MapPin, Loader2, AlertTriangle, Map as MapIcon, Compass, ShieldAlert } from 'lucide-react';
import { getPriorityTier } from '../../utils/priorityScore';
import { getCategoryConfig } from '../shared/CategoryBadge';

const MAP_LIBRARIES = [];

const MAP_STYLES = [
  { elementType: 'geometry',                    stylers: [{ color: '#111827' }] },
  { elementType: 'labels.text.fill',            stylers: [{ color: '#6b7280' }] },
  { elementType: 'labels.text.stroke',          stylers: [{ color: '#111827' }] },
  { featureType: 'road',        elementType: 'geometry',         stylers: [{ color: '#1f2937' }] },
  { featureType: 'road',        elementType: 'labels.text.fill', stylers: [{ color: '#6b7280' }] },
  { featureType: 'road.highway',elementType: 'geometry',         stylers: [{ color: '#374151' }] },
  { featureType: 'water',       elementType: 'geometry',         stylers: [{ color: '#0c1525' }] },
  { featureType: 'water',       elementType: 'labels.text.fill', stylers: [{ color: '#374151' }] },
  { featureType: 'poi',         elementType: 'geometry',         stylers: [{ color: '#1a2332' }] },
  { featureType: 'poi',         elementType: 'labels',           stylers: [{ visibility: 'off' }] },
  { featureType: 'transit',     elementType: 'geometry',         stylers: [{ color: '#1f2937' }] },
  { featureType: 'administrative', elementType: 'geometry.stroke', stylers: [{ color: '#374151' }] },
  { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#9ca3af' }] },
];

const MAP_OPTIONS = {
  styles: MAP_STYLES,
  disableDefaultUI: false,
  zoomControl: true,
  mapTypeControl: false,
  streetViewControl: false,
  fullscreenControl: true,
};

function CustomMarker({ complaint, isSelected, onClick }) {
  const tier   = getPriorityTier(complaint.priority_score ?? 0);
  const catCfg = getCategoryConfig(complaint.category);
  const isHigh = (complaint.priority_score ?? 0) >= 65;

  return (
    <div
      onClick={e => { e.stopPropagation(); onClick(complaint); }}
      title={`${complaint.tracking_id} · ${complaint.ward}`}
      style={{
        cursor: 'pointer',
        transform: isSelected ? 'scale(1.3)' : 'scale(1)',
        transition: 'transform 0.15s ease',
        zIndex: isSelected ? 99 : 1,
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      {isHigh && !isSelected && (
        <span
          style={{
            position: 'absolute', inset: '-4px',
            borderRadius: '50%',
            background: tier.color,
            animation: 'pulse-ring 1.6s ease-out infinite',
            opacity: 0.3,
          }}
        />
      )}
      <div
        style={{
          display: 'flex', alignItems: 'center', gap: 3,
          padding: '3px 7px',
          borderRadius: 999,
          background: tier.color,
          border: isSelected ? '2px solid white' : '1.5px solid rgba(0,0,0,0.45)',
          boxShadow: isSelected
            ? `0 0 0 3px ${tier.color}55, 0 4px 14px rgba(0,0,0,0.7)`
            : '0 2px 8px rgba(0,0,0,0.6)',
          color: 'white',
          fontSize: 11,
          fontWeight: 700,
          whiteSpace: 'nowrap',
          lineHeight: 1,
        }}
      >
        <span>{catCfg?.icon || '📌'}</span>
        <span style={{ fontFamily: 'JetBrains Mono, monospace' }}>
          {complaint.priority_score ?? 0}
        </span>
      </div>
      <div
        style={{
          width: 6, height: 6,
          background: tier.color,
          transform: 'rotate(45deg)',
          marginTop: -3,
          boxShadow: '1px 1px 4px rgba(0,0,0,0.5)',
        }}
      />
    </div>
  );
}

export function MapView({ complaints, totalCount = 0, selectedComplaint, onSelectComplaint, onResetFilters }) {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const [map, setMap] = useState(null);
  const [googleAuthError, setGoogleAuthError] = useState(false);

  // Catch Google Maps auth / domain failure
  useEffect(() => {
    window.gm_authFailure = () => {
      console.warn('[Voice2Action] Google Maps Auth Failure detected on Dashboard. Switching to Dark Vector GIS Map.');
      setGoogleAuthError(true);
    };
  }, []);

  const fittedRef = useRef(false);
  const prevIdsRef = useRef('');

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: apiKey ?? '',
    libraries: MAP_LIBRARIES,
  });

  const defaultCenter = { lat: 28.6139, lng: 77.209 };

  const valid = complaints.filter(
    c => typeof c.lat === 'number' && typeof c.lng === 'number'
  );

  // Reset fit only when the actual complaint IDs change (not on every render)
  const currentIds = valid.map(c => c.id).sort().join(',');
  if (currentIds !== prevIdsRef.current) {
    prevIdsRef.current = currentIds;
    fittedRef.current  = false;
  }

  // Fit bounds once the map is idle and we haven't fitted this set yet
  const handleIdle = useCallback(() => {
    if (!map || fittedRef.current || valid.length === 0) return;
    if (!window.google?.maps) return;
    fittedRef.current = true;

    const bounds = new window.google.maps.LatLngBounds();
    valid.forEach(c => bounds.extend({ lat: c.lat, lng: c.lng }));
    map.fitBounds(bounds, { top: 60, bottom: 40, left: 40, right: 40 });

    if (valid.length === 1) {
      window.google.maps.event.addListenerOnce(map, 'bounds_changed', () => {
        if (map.getZoom() > 15) map.setZoom(15);
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, currentIds]);

  // Pan to selected marker without resetting bounds
  useEffect(() => {
    if (map && selectedComplaint && typeof selectedComplaint.lat === 'number') {
      map.panTo({ lat: selectedComplaint.lat, lng: selectedComplaint.lng });
      if (map.getZoom() < 14) map.setZoom(14);
    }
  }, [map, selectedComplaint]);

  const onLoad    = useCallback(m => setMap(m), []);
  const onUnmount = useCallback(() => setMap(null), []);

  // DARK VECTOR GIS MAP FALLBACK (Rendered when Google Maps API Key has domain/auth error)
  const renderDarkGISFallback = () => {
    // Relative bounding box for Delhi vector plot
    const minLat = 28.58, maxLat = 28.65;
    const minLng = 77.18, maxLng = 77.25;

    return (
      <div className="absolute inset-0 bg-slate-950 flex flex-col justify-between overflow-hidden relative">
        {/* Subtle GIS Background Grid */}
        <div className="absolute inset-0 opacity-25 pointer-events-none bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:24px_24px]" />

        {/* Top Warning Banner */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 bg-slate-900/90 backdrop-blur-md border border-amber-500/40 text-amber-300 text-xs px-3.5 py-1.5 rounded-full flex items-center gap-2 shadow-2xl">
          <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
          <span>Google Maps API Key domain restricted. Displaying Dark Vector GIS Map View.</span>
        </div>

        {/* Legend: top-left */}
        <div className="absolute top-3 left-3 z-20">
          <div className="bg-slate-900/90 backdrop-blur-sm border border-slate-700/60 rounded-xl px-3 py-2.5 shadow-xl">
            <p className="text-[10px] text-slate-400 mb-2 font-semibold uppercase tracking-widest">Priority</p>
            {[
              { color: '#EF4444', label: 'High (≥65)' },
              { color: '#F59E0B', label: 'Med (35–64)' },
              { color: '#22C55E', label: 'Low (<35)' },
            ].map(({ color, label }) => (
              <div key={label} className="flex items-center gap-2 mb-1 last:mb-0">
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: color }}/>
                <span className="text-xs text-slate-300">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Count badge: top-right */}
        <div className="absolute top-3 right-3 z-20">
          <div className="flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-sm border border-slate-700/60 rounded-xl px-3 py-2 shadow-xl">
            <Compass size={13} className="text-blue-400"/>
            <span className="text-xs">
              <strong className="text-white font-mono">{valid.length}</strong>
              <span className="text-slate-400"> / {totalCount || complaints.length} on GIS map</span>
            </span>
          </div>
        </div>

        {/* Plot Vector Markers */}
        <div className="relative flex-1 w-full h-full">
          {valid.map((c) => {
            // Compute percentage positions inside [0%, 100%]
            const topPct = Math.max(10, Math.min(85, 100 - ((c.lat - minLat) / (maxLat - minLat)) * 100));
            const leftPct = Math.max(10, Math.min(85, ((c.lng - minLng) / (maxLng - minLng)) * 100));
            const isSelected = selectedComplaint?.id === c.id;

            return (
              <div
                key={c.id}
                onClick={() => onSelectComplaint(c)}
                style={{ top: `${topPct}%`, left: `${leftPct}%` }}
                className={`absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all z-10 hover:scale-125 ${
                  isSelected ? 'scale-125 z-30' : ''
                }`}
              >
                <CustomMarker
                  complaint={c}
                  isSelected={isSelected}
                  onClick={onSelectComplaint}
                />
              </div>
            );
          })}
        </div>

        {/* Empty state */}
        {valid.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
            <div className="bg-slate-900/95 backdrop-blur-md border border-slate-700/60 rounded-2xl p-6 text-center max-w-sm shadow-2xl pointer-events-auto space-y-3">
              <MapIcon size={32} className="text-slate-600 mx-auto"/>
              <div>
                <p className="text-white font-semibold text-sm">No complaints match active filters</p>
                <p className="text-slate-400 text-xs mt-1">
                  {totalCount > 0
                    ? `Showing 0 of ${totalCount} total complaints due to active Ward / Category filters.`
                    : 'No complaints in database.'}
                </p>
              </div>
              {onResetFilters && (
                <button
                  type="button"
                  onClick={onResetFilters}
                  className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs transition-all shadow-lg shadow-blue-600/30 cursor-pointer"
                >
                  Clear All Filters to Show All Complaints
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  // If API key missing or auth error or load error, render Dark Vector GIS Fallback
  if (!apiKey || googleAuthError || loadError) {
    return renderDarkGISFallback();
  }

  // ── Loading ──
  if (!isLoaded) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={28} className="animate-spin text-blue-400"/>
          <span className="text-sm text-slate-400">Loading map…</span>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* ── Google Map — fills the absolute parent ── */}
      <GoogleMap
        mapContainerStyle={{ width: '100%', height: '100%' }}
        center={defaultCenter}
        zoom={12}
        options={MAP_OPTIONS}
        onLoad={onLoad}
        onUnmount={onUnmount}
        onIdle={handleIdle}
      >
        {valid.map(complaint => (
          <OverlayView
            key={complaint.id}
            position={{ lat: complaint.lat, lng: complaint.lng }}
            mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
            getPixelPositionOffset={(w, h) => ({ x: -w / 2, y: -h - 4 })}
          >
            <CustomMarker
              complaint={complaint}
              isSelected={selectedComplaint?.id === complaint.id}
              onClick={onSelectComplaint}
            />
          </OverlayView>
        ))}
      </GoogleMap>

      {/* ── Legend: top-left ── */}
      <div className="absolute top-3 left-3 z-10">
        <div className="bg-slate-900/90 backdrop-blur-sm border border-slate-700/60 rounded-xl px-3 py-2.5 shadow-xl">
          <p className="text-[10px] text-slate-400 mb-2 font-semibold uppercase tracking-widest">Priority</p>
          {[
            { color: '#EF4444', label: 'High (≥65)' },
            { color: '#F59E0B', label: 'Med (35–64)' },
            { color: '#22C55E', label: 'Low (<35)' },
          ].map(({ color, label }) => (
            <div key={label} className="flex items-center gap-2 mb-1 last:mb-0">
              <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: color }}/>
              <span className="text-xs text-slate-300">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Count badge: top-right ── */}
      <div className="absolute top-3 right-3 z-10 pointer-events-none">
        <div className="flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-sm border border-slate-700/60 rounded-xl px-3 py-2 shadow-xl">
          <MapPin size={13} className="text-blue-400"/>
          <span className="text-xs">
            <strong className="text-white" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
              {valid.length}
            </strong>
            <span className="text-slate-400"> / {totalCount || complaints.length} on map</span>
          </span>
        </div>
      </div>

      {/* ── Empty state ── */}
      {valid.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
          <div className="bg-slate-900/95 backdrop-blur-md border border-slate-700/60 rounded-2xl p-6 text-center max-w-sm shadow-2xl pointer-events-auto space-y-3">
            <MapIcon size={32} className="text-slate-600 mx-auto"/>
            <div>
              <p className="text-white font-semibold text-sm">No complaints match active filters</p>
              <p className="text-slate-400 text-xs mt-1">
                {totalCount > 0
                  ? `Showing 0 of ${totalCount} total complaints due to active Ward / Category filters.`
                  : 'No complaints in database.'}
              </p>
            </div>
            {onResetFilters && (
              <button
                type="button"
                onClick={onResetFilters}
                className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs transition-all shadow-lg shadow-blue-600/30 cursor-pointer"
              >
                Clear All Filters to Show All Complaints
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}
