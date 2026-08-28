import React, { useState } from 'react';
import { ALMADINA_SHOP_LOCATION } from '../../data/mockData';
import { calculateDistanceKm, calculateDeliveryFeeETB, formatETB } from '../../utils/distance';
import { MapPin, Navigation, CheckCircle2, AlertTriangle, Search, ExternalLink } from 'lucide-react';

interface GoogleMapsEmbedProps {
  query?: string;
  latitude?: number;
  longitude?: number;
  height?: string | number;
  showRadiusControls?: boolean;
  onLocationChange?: (loc: { addressText: string; latitude: number; longitude: number; distanceKm: number }) => void;
  className?: string;
}

const GOOGLE_MAPS_EMBED_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

// Addis Ababa / Bethel Area Location Presets
export const LOCATION_PRESETS = [
  {
    name: 'Bethel Hospital Area (Shop Zone)',
    address: 'Bethel Main Road, near Bethel Hospital, Addis Ababa',
    lat: 8.9833,
    lng: 38.7083,
    description: 'Immediate store delivery radius (~0.0 km)',
  },
  {
    name: 'Ayer Tena Roundabout',
    address: 'Ayer Tena Main Street, Addis Ababa',
    lat: 8.9720,
    lng: 38.6920,
    description: 'Fast local delivery (~2.2 km)',
  },
  {
    name: 'Zenebework Square',
    address: 'Zenebework Commercial Strip, Addis Ababa',
    lat: 8.9680,
    lng: 38.7180,
    description: 'Neighbourhood delivery (~2.0 km)',
  },
  {
    name: 'Tor Hailoch Traffic Ring',
    address: 'Tor Hailoch, Old Airport Road, Addis Ababa',
    lat: 8.9950,
    lng: 38.7250,
    description: 'Express corridor delivery (~2.3 km)',
  },
  {
    name: 'Kolfe 18 / 15 Area',
    address: 'Kolfe Keranio, Addis Ababa',
    lat: 9.0120,
    lng: 38.7010,
    description: 'Residential zone delivery (~3.3 km)',
  },
  {
    name: 'Alert Hospital Vicinity',
    address: 'Alert Specialized Hospital Road, Addis Ababa',
    lat: 8.9600,
    lng: 38.7220,
    description: 'Southwest boundary delivery (~3.0 km)',
  },
  {
    name: 'Mexico Square',
    address: 'Mexico Square, Addis Ababa',
    lat: 9.0105,
    lng: 38.7450,
    description: 'Outer delivery boundary (~5.1 km)',
  },
  {
    name: 'Bole Medhanialem (Beyond 6km)',
    address: 'Bole Medhanialem, Bole, Addis Ababa',
    lat: 8.9970,
    lng: 38.7880,
    description: 'Out of range (> 8.9 km - Pickup only)',
  },
  {
    name: 'CN Tower, Toronto (Special Preset)',
    address: 'CN Tower, 290 Bremner Blvd, Toronto, ON M5V 3L9',
    lat: 43.6426,
    lng: -79.3871,
    description: 'International test query (> 6 km - Pickup only)',
  },
];

export const GoogleMapsEmbed: React.FC<GoogleMapsEmbedProps> = ({
  query = 'Bethel, Addis Ababa, Ethiopia',
  latitude = 8.9833,
  longitude = 38.7083,
  height = '380px',
  showRadiusControls = true,
  onLocationChange,
  className = '',
}) => {
  const [currentQuery, setCurrentQuery] = useState(query);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentLat, setCurrentLat] = useState(latitude);
  const [currentLng, setCurrentLng] = useState(longitude);
  const [activeAddress, setActiveAddress] = useState(query);

  const distanceKm = calculateDistanceKm(currentLat, currentLng);
  const isWithinRange = distanceKm <= ALMADINA_SHOP_LOCATION.maxDeliveryDistanceKm;
  const deliveryFee = isWithinRange ? calculateDeliveryFeeETB(distanceKm) : 0;

  // Build the embed src with the provided key and place query
  const embedSrc = `https://www.google.com/maps/embed/v1/place?key=${GOOGLE_MAPS_EMBED_API_KEY}&q=${encodeURIComponent(
    currentQuery
  )}&maptype=roadmap`;

  const handleSelectPreset = (preset: (typeof LOCATION_PRESETS)[0]) => {
    setCurrentQuery(preset.address);
    setActiveAddress(preset.address);
    setCurrentLat(preset.lat);
    setCurrentLng(preset.lng);
    const dist = calculateDistanceKm(preset.lat, preset.lng);
    onLocationChange?.({
      addressText: preset.address,
      latitude: preset.lat,
      longitude: preset.lng,
      distanceKm: dist,
    });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    const q = searchQuery.trim();
    setCurrentQuery(q.includes('Addis') ? q : `${q}, Addis Ababa, Ethiopia`);
    setActiveAddress(q);
    // Approximate coordinate shift for search
    onLocationChange?.({
      addressText: q,
      latitude: currentLat,
      longitude: currentLng,
      distanceKm,
    });
  };

  const handleDetectLiveGPS = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setCurrentLat(lat);
          setCurrentLng(lng);
          const coordQuery = `${lat},${lng}`;
          setCurrentQuery(coordQuery);
          const addr = `GPS Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
          setActiveAddress(addr);
          const dist = calculateDistanceKm(lat, lng);
          onLocationChange?.({
            addressText: addr,
            latitude: lat,
            longitude: lng,
            distanceKm: dist,
          });
        },
        () => {
          // Fallback to Bethel shop center
          handleSelectPreset(LOCATION_PRESETS[0]);
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    }
  };

  return (
    <div className={`rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-sm space-y-3 ${className}`}>
      {/* Search & Location Bar */}
      {showRadiusControls && (
        <div className="p-3 bg-slate-50 border-b border-slate-200 space-y-2.5">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700">
                <MapPin className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">Google Maps Embed & Delivery Verification</p>
                <p className="text-[11px] text-slate-500">Store: Bethel Main Road • 6.0 km Max Delivery Radius</p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleDetectLiveGPS}
              className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
            >
              <Navigation className="w-3.5 h-3.5 text-emerald-600" />
              <span>Detect Live GPS</span>
            </button>
          </div>

          {/* Quick Search Input */}
          <form onSubmit={handleSearchSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
              <input
                type="text"
                placeholder="Search street or landmark in Addis Ababa..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-emerald-600 font-medium"
              />
            </div>
            <button
              type="submit"
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors"
            >
              Map Search
            </button>
          </form>

          {/* Preset Location Chips */}
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Quick Presets (Test 6km Radius):</p>
            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
              {LOCATION_PRESETS.map((preset) => {
                const dist = calculateDistanceKm(preset.lat, preset.lng);
                const isPresetWithin = dist <= ALMADINA_SHOP_LOCATION.maxDeliveryDistanceKm;
                const isSelected = activeAddress === preset.address;
                return (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    className={`text-[11px] px-2.5 py-1 rounded-lg border font-medium flex items-center gap-1 transition-all ${
                      isSelected
                        ? 'bg-emerald-700 text-white border-emerald-800 shadow-xs'
                        : isPresetWithin
                        ? 'bg-white hover:bg-emerald-50 text-slate-800 border-slate-200'
                        : 'bg-rose-50 hover:bg-rose-100 text-rose-800 border-rose-200'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${isPresetWithin ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                    <span>{preset.name}</span>
                    <span className="text-[10px] opacity-75">({dist.toFixed(1)} km)</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Embedded Google Maps iFrame */}
      <div className="relative w-full overflow-hidden bg-slate-100" style={{ height }}>
        <iframe
          width="100%"
          height="100%"
          frameBorder="0"
          style={{ border: 0 }}
          src={embedSrc}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          title="Almedina Google Maps Embed"
          className="w-full h-full"
        />

        {/* Floating Distance HUD */}
        <div className="absolute bottom-3 left-3 right-3 z-10">
          <div
            className={`p-3 rounded-xl border backdrop-blur-md shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 ${
              isWithinRange
                ? 'bg-emerald-950/90 text-white border-emerald-500/50'
                : 'bg-rose-950/90 text-white border-rose-500/50'
            }`}
          >
            <div className="flex items-center gap-2.5">
              {isWithinRange ? (
                <div className="w-8 h-8 rounded-lg bg-emerald-600/30 border border-emerald-400 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-lg bg-rose-600/30 border border-rose-400 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5 text-rose-400" />
                </div>
              )}
              <div>
                <p className="text-xs font-bold leading-tight">
                  {isWithinRange
                    ? `✅ Deliverable: Within 6.0 km Zone (${distanceKm.toFixed(1)} km from Bethel)`
                    : `❌ Delivery Unavailable: Exceeds 6.0 km Radius (${distanceKm.toFixed(1)} km)`}
                </p>
                <p className="text-[11px] text-slate-300">
                  {isWithinRange
                    ? `Estimated Delivery Fee: ${formatETB(deliveryFee)} (50 Br base + 15 Br/km)`
                    : `Orders beyond 6 km must choose 'Store Pickup' at Bethel.`}
                </p>
              </div>
            </div>

            <div className="shrink-0 flex items-center gap-2">
              <span
                className={`text-[11px] font-extrabold px-2.5 py-1 rounded-lg border ${
                  isWithinRange
                    ? 'bg-emerald-500 text-slate-950 border-emerald-300'
                    : 'bg-rose-500 text-white border-rose-300'
                }`}
              >
                {isWithinRange ? 'Eligible for Delivery' : 'Distance Exceeded'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
