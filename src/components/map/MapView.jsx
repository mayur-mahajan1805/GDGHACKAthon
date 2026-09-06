import { useState, useMemo, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, Map as MapIcon, Compass, Layers } from 'lucide-react';
import { getPriorityTier } from '../../utils/priorityScore';
import { getCategoryConfig } from '../shared/CategoryBadge';

// Helper component to adjust bounds and handle panTo
function MapController({ complaints, selectedComplaint }) {
  const map = useMap();

  useEffect(() => {
    if (!complaints || complaints.length === 0) return;

    const latLngs = complaints
      .filter(c => typeof c.lat === 'number' && typeof c.lng === 'number' && !isNaN(c.lat) && !isNaN(c.lng))
      .map(c => [c.lat, c.lng]);

    if (latLngs.length > 0) {
      const bounds = L.latLngBounds(latLngs);
      if (bounds.isValid()) {
        map.fitBounds(bounds, {
          padding: [50, 50],
          maxZoom: 15,
          animate: true,
        });
      }
    }
  }, [complaints, map]);

  useEffect(() => {
    if (selectedComplaint && typeof selectedComplaint.lat === 'number' && typeof selectedComplaint.lng === 'number') {
      map.flyTo([selectedComplaint.lat, selectedComplaint.lng], Math.max(map.getZoom(), 15), {
        duration: 0.6,
      });
    }
  }, [selectedComplaint, map]);

  return null;
}

// Generate styled Leaflet DivIcon
function createMarkerIcon(complaint, isSelected) {
  const tier = getPriorityTier(complaint.priority_score ?? 0);
  const catCfg = getCategoryConfig(complaint.category);
  const isHigh = (complaint.priority_score ?? 0) >= 65;
  const score = complaint.priority_score ?? 0;
  const iconEmoji = catCfg?.icon || '📌';

  const html = `
    <div style="
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      transform: translate(-50%, -100%) ${isSelected ? 'scale(1.25)' : 'scale(1)'};
      transition: transform 0.15s ease;
      cursor: pointer;
    ">
      ${isHigh && !isSelected ? `
        <span style="
          position: absolute;
          inset: -4px;
          border-radius: 9999px;
          background: ${tier.color};
          opacity: 0.35;
          animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
        "></span>` : ''}
      <div style="
        position: relative;
        z-index: 10;
        display: flex;
        align-items: center;
        gap: 4px;
        padding: 3px 8px;
        border-radius: 9999px;
        background: ${tier.color};
        border: ${isSelected ? '2.5px solid #ffffff' : '1.5px solid rgba(0,0,0,0.5)'};
        box-shadow: ${isSelected ? `0 0 0 3px ${tier.color}66, 0 6px 16px rgba(0,0,0,0.8)` : '0 3px 10px rgba(0,0,0,0.6)'};
        color: #ffffff;
        font-size: 11px;
        font-weight: 700;
        white-space: nowrap;
        line-height: 1;
      ">
        <span>${iconEmoji}</span>
        <span style="font-family: 'JetBrains Mono', monospace;">${score}</span>
      </div>
      <div style="
        width: 8px;
        height: 8px;
        background: ${tier.color};
        transform: rotate(45deg);
        margin-top: -4px;
        box-shadow: 1px 1px 4px rgba(0,0,0,0.5);
        position: relative;
        z-index: 9;
      "></div>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'custom-v2a-marker',
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });
}

export function MapView({ complaints = [], totalCount = 0, selectedComplaint, onSelectComplaint, onResetFilters }) {
  const [tileMode, setTileMode] = useState('dark'); // 'dark' | 'street'

  const defaultCenter = [28.6139, 77.2090]; // New Delhi Municipal Center

  const validComplaints = useMemo(() => {
    return complaints.filter(
      c => typeof c.lat === 'number' && typeof c.lng === 'number' && !isNaN(c.lat) && !isNaN(c.lng)
    );
  }, [complaints]);

  return (
    <div className="relative w-full h-full bg-slate-950 overflow-hidden">
      <MapContainer
        center={defaultCenter}
        zoom={12}
        scrollWheelZoom={true}
        className="w-full h-full z-0"
        style={{ background: '#090d16' }}
      >
        {/* CartoDB Dark Matter / Street Tiles */}
        {tileMode === 'dark' ? (
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}{r}.png"
            subdomains="abcd"
            maxZoom={19}
          />
        ) : (
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            maxZoom={19}
          />
        )}

        <MapController complaints={validComplaints} selectedComplaint={selectedComplaint} />

        {validComplaints.map((c, idx) => {
          const key = c.id || c.tracking_id || `marker-${c.lat}-${c.lng}-${idx}`;
          const isSelected = selectedComplaint?.id === c.id || selectedComplaint?.tracking_id === c.tracking_id;
          const icon = createMarkerIcon(c, isSelected);

          return (
            <Marker
              key={key}
              position={[c.lat, c.lng]}
              icon={icon}
              eventHandlers={{
                click: () => onSelectComplaint(c),
              }}
            />
          );
        })}
      </MapContainer>

      {/* ── Priority Legend: top-left ── */}
      <div className="absolute top-3 left-3 z-10 pointer-events-auto">
        <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-xl px-3.5 py-2.5 shadow-2xl">
          <p className="text-[10px] text-slate-400 mb-2 font-bold uppercase tracking-wider">Priority Tiers</p>
          {[
            { color: '#EF4444', label: 'High Priority (≥65)' },
            { color: '#F59E0B', label: 'Medium (35–64)' },
            { color: '#22C55E', label: 'Standard (<35)' },
          ].map(({ color, label }) => (
            <div key={label} className="flex items-center gap-2 mb-1.5 last:mb-0">
              <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: color }} />
              <span className="text-xs text-slate-300 font-medium">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Top-right Controls (Count badge + Map Tile Mode Switcher) ── */}
      <div className="absolute top-3 right-3 z-10 flex items-center gap-2">
        {/* Style Toggle */}
        <button
          type="button"
          onClick={() => setTileMode(prev => prev === 'dark' ? 'street' : 'dark')}
          className="bg-slate-900/90 hover:bg-slate-800/95 backdrop-blur-md border border-slate-700/80 text-slate-200 px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xl transition-all cursor-pointer"
          title="Toggle between Dark GIS and Standard Street Map"
        >
          <Layers className="w-3.5 h-3.5 text-cyan-400" />
          <span>{tileMode === 'dark' ? 'Dark GIS' : 'Street View'}</span>
        </button>

        {/* Complaint Count */}
        <div className="flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-xl px-3 py-2 shadow-xl">
          <MapPin size={13} className="text-cyan-400" />
          <span className="text-xs">
            <strong className="text-white font-mono">{validComplaints.length}</strong>
            <span className="text-slate-400"> / {totalCount || complaints.length} pinned</span>
          </span>
        </div>
      </div>

      {/* ── Empty state overlay ── */}
      {validComplaints.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
          <div className="bg-slate-900/95 backdrop-blur-md border border-slate-800 rounded-2xl p-6 text-center max-w-sm shadow-2xl pointer-events-auto space-y-3">
            <MapIcon size={32} className="text-slate-500 mx-auto" />
            <div>
              <p className="text-white font-semibold text-sm">No complaints match active filters</p>
              <p className="text-slate-400 text-xs mt-1">
                {totalCount > 0
                  ? `Showing 0 of ${totalCount} total complaints due to active Ward / Category filters.`
                  : 'No complaints registered yet in this area.'}
              </p>
            </div>
            {onResetFilters && (
              <button
                type="button"
                onClick={onResetFilters}
                className="w-full py-2 px-4 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl text-xs transition-all shadow-lg shadow-cyan-600/30 cursor-pointer"
              >
                Reset All Filters
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
