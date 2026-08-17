import React, { useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { AlertTriangle, Users, Search } from 'lucide-react';

// Design system colors
const TIER_COLORS = {
  Low: '#2DD4BF',      // Safe (Teal)
  Moderate: '#FBBF24', // Amber
  Severe: '#FB7A3C',   // Orange
  Extreme: '#EF4444',  // Red
};

// Calculate centroid of a polygon for marker placement
function getCentroid(coords) {
  let x = 0, y = 0, pts = coords[0].length - 1; // last pt is same as first
  for (let i = 0; i < pts; i++) {
    x += coords[0][i][0];
    y += coords[0][i][1];
  }
  return [y / pts, x / pts]; // Leaflet wants [lat, lng]
}

// Custom DivIcon for glowing marker with visible high-contrast ward name badge
const createGlowingMarker = (tier, isSelected, wardName) => {
  const color = TIER_COLORS[tier] || TIER_COLORS.Low;
  const isCritical = tier === 'Extreme' || tier === 'Severe';
  
  const html = `
    <div style="
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      transition: transform 0.2s ease;
      transform: scale(${isSelected ? 1.2 : 1});
      cursor: pointer;
    ">
      <!-- Outer Glow Ring -->
      <div style="
        position: absolute;
        top: -6px;
        width: 32px; height: 32px;
        border-radius: 50%;
        background: ${color};
        opacity: 0.35;
        filter: blur(6px);
        ${isCritical ? `animation: markerPulse 2s ease-in-out infinite alternate;` : ''}
      "></div>
      
      <!-- Center Glowing Dot -->
      <div style="
        position: relative;
        width: 16px; height: 16px;
        border-radius: 50%;
        background: ${color};
        box-shadow: 0 0 12px ${color}, inset 0 0 4px rgba(0,0,0,0.5);
        border: 2px solid rgba(255,255,255,0.95);
        z-index: 2;
      "></div>

      <!-- High-Contrast Place Name Badge -->
      <div style="
        margin-top: 5px;
        padding: 3px 8px;
        background: rgba(11, 14, 20, 0.92);
        border: 1px solid rgba(255, 255, 255, 0.25);
        border-radius: 6px;
        color: #ffffff;
        font-family: 'Inter', system-ui, sans-serif;
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 0.02em;
        white-space: nowrap;
        backdrop-filter: blur(8px);
        box-shadow: 0 4px 12px rgba(0,0,0,0.7);
        pointer-events: none;
        z-index: 1;
        display: flex;
        align-items: center;
        gap: 4px;
      ">
        <span style="width: 6px; height: 6px; border-radius: 50%; background: ${color}; inline-block;"></span>
        ${wardName}
      </div>
    </div>
    
    <style>
      @keyframes markerPulse {
        0% { transform: scale(0.8); opacity: 0.2; }
        100% { transform: scale(1.6); opacity: 0.5; }
      }
    </style>
  `;

  return L.divIcon({
    html,
    className: 'custom-leaflet-marker',
    iconSize: [120, 50],
    iconAnchor: [60, 10],
    popupAnchor: [0, -15]
  });
};

// Lets non-map UI (filter buttons, search) drive the Leaflet map imperatively
function MapController({ flyTarget }) {
  const map = useMap();
  React.useEffect(() => {
    if (flyTarget) {
      map.flyTo(flyTarget, 14, { duration: 1 });
    }
  }, [flyTarget, map]);
  return null;
}

const RISK_FILTERS = [
  { key: 'all', label: 'ALL' },
  { key: 'critical', label: 'CRITICAL', tiers: ['Extreme', 'Severe'] },
  { key: 'watch', label: 'WATCH', tiers: ['Moderate', 'Low'] },
];

function HeatMap() {
  const { wards, selectWard, selectedWard } = useApp();
  const { showToast } = useToast();
  const [activeFilter, setActiveFilter] = useState('all');
  const [flyTarget, setFlyTarget] = useState(null);
  const [searchValue, setSearchValue] = useState('');

  const markers = useMemo(() => {
    return wards.map(ward => {
      const center = getCentroid(ward.boundary.coordinates);
      const tier = ward.latestRisk?.riskTier || 'Low';
      const isSelected = selectedWard?.wardId === ward.wardId;
      return { ...ward, center, tier, isSelected };
    });
  }, [wards, selectedWard]);

  const visibleMarkers = useMemo(() => {
    const filter = RISK_FILTERS.find(f => f.key === activeFilter);
    if (!filter || filter.key === 'all') return markers;
    return markers.filter(m => filter.tiers.includes(m.tier));
  }, [markers, activeFilter]);

  const handleFilter = (filter) => {
    setActiveFilter(filter.key);
    showToast(
      filter.key === 'all' ? 'Showing all Jaipur wards' : `Showing ${filter.label.toLowerCase()} risk wards`,
      'info'
    );
  };

  const handleSearch = (e) => {
    if (e.key !== 'Enter') return;
    const query = searchValue.toLowerCase().trim();
    const result = markers.find(m => m.name.toLowerCase().includes(query));
    if (result) {
      setFlyTarget(result.center);
      selectWard(result.wardId);
      showToast(`${result.name} · Risk: ${result.tier}`, 'info');
    } else {
      showToast('Location not found in Jaipur monitoring zones', 'warning');
    }
  };

  return (
    <div className="relative h-full w-full font-sans">
      {/* Filter buttons */}
      <div className="absolute top-4 left-4 z-[999] flex items-center gap-1.5 glass-panel p-1">
        {RISK_FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => handleFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors
              ${activeFilter === f.key ? 'bg-teal-500 text-black' : 'text-gray-400 hover:text-white hover:bg-white/10'}
            `}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Search box */}
      <div className="absolute top-4 right-4 z-[999] flex items-center gap-2 glass-panel px-3 py-2 w-56">
        <Search className="w-3.5 h-3.5 text-gray-500 shrink-0" />
        <input
          type="text"
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          onKeyDown={handleSearch}
          placeholder="Search ward..."
          className="bg-transparent outline-none text-xs text-white placeholder:text-gray-500 w-full"
        />
      </div>

      <MapContainer
        center={[26.9124, 75.7873]} // Jaipur center
        zoom={12}
        scrollWheelZoom={true}
        className="h-full w-full rounded-[var(--radius-panel)]"
        style={{ width: '100%', height: '100%', minHeight: '560px', background: '#0B0E14' }}
        zoomControl={true}
      >
        {/* Custom styled dark tiles - Carto Dark Matter with crisp readable labels */}
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          className="map-tiles"
        />
        


        <MapController flyTarget={flyTarget} />

        {visibleMarkers.map(ward => (
          <Marker 
            key={ward.wardId} 
            position={ward.center}
            icon={createGlowingMarker(ward.tier, ward.isSelected, ward.name)}
            eventHandlers={{ click: () => selectWard(ward.wardId) }}
          >
            <Popup closeButton={false} className="custom-popup">
              <div className="p-1 font-sans">
                <div className="text-xs text-gray-400 font-bold tracking-wider uppercase mb-1">{ward.wardId}</div>
                <h3 className="text-sm font-bold text-white mb-2">{ward.name}</h3>
                <div className="flex flex-col gap-1.5 text-xs">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-gray-400 flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5 text-orange-400"/> Temp:</span>
                    <span className="font-bold tabular-data" style={{ color: TIER_COLORS[ward.tier] }}>{ward.latestRisk?.forecastTempC}°C</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-gray-400 flex items-center gap-1"><Users className="w-3.5 h-3.5 text-teal-400"/> Vuln Score:</span>
                    <span className="font-bold tabular-data text-white">{ward.vulnerabilityScore}/100</span>
                  </div>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Floating Legend Card */}
      <div className="absolute bottom-6 left-6 z-[999] glass-panel p-4 text-xs font-sans">
        <div className="font-bold text-white mb-3 uppercase tracking-wider">Risk Level</div>
        {Object.entries(TIER_COLORS).map(([tier, color]) => (
          <div key={tier} className="flex items-center gap-3 mb-2 last:mb-0">
            <div className="w-3 h-3 rounded-full shadow-sm" style={{ background: color, boxShadow: `0 0 8px ${color}` }} />
            <span className="text-gray-300 font-semibold">{tier}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default HeatMap;
