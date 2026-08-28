import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, CheckCircle2, AlertTriangle, Search, Info, ExternalLink } from 'lucide-react';
import { ALMADINA_SHOP_LOCATION } from '../../data/mockData';
import { calculateDistanceKm, calculateDeliveryFeeETB, formatETB } from '../../utils/distance';
import { LOCATION_PRESETS } from '../common/GoogleMapsEmbed';

const GOOGLE_MAPS_EMBED_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

interface GoogleMapsLocationPickerProps {
  initialLat: number;
  initialLng: number;
  initialAddress: string;
  initialLandmark?: string;
  onSelectLocation: (location: {
    addressText: string;
    landmark?: string;
    latitude: number;
    longitude: number;
    distanceKm: number;
  }) => void;
}

export const GoogleMapsLocationPicker: React.FC<GoogleMapsLocationPickerProps> = ({
  initialLat,
  initialLng,
  initialAddress,
  initialLandmark = '',
  onSelectLocation,
}) => {
  const [lat, setLat] = useState(initialLat || 8.9833);
  const [lng, setLng] = useState(initialLng || 38.7083);
  const [addressText, setAddressText] = useState(initialAddress || 'Bethel Main Road, Addis Ababa');
  const [landmarkText, setLandmarkText] = useState(initialLandmark);
  const [mapSearchInput, setMapSearchInput] = useState('');
  const [mapQuery, setMapQuery] = useState('Bethel, Addis Ababa, Ethiopia');
  const [gpsLoading, setGpsLoading] = useState(false);

  const distanceKm = calculateDistanceKm(lat, lng);
  const isWithinDeliveryLimit = distanceKm <= ALMADINA_SHOP_LOCATION.maxDeliveryDistanceKm;
  const deliveryFee = isWithinDeliveryLimit ? calculateDeliveryFeeETB(distanceKm) : 0;

  // Sync back to parent when values change
  useEffect(() => {
    onSelectLocation({
      addressText,
      landmark: landmarkText,
      latitude: lat,
      longitude: lng,
      distanceKm,
    });
  }, [lat, lng, addressText, landmarkText, distanceKm]);

  const handleSelectPreset = (preset: (typeof LOCATION_PRESETS)[0]) => {
    setLat(preset.lat);
    setLng(preset.lng);
    setAddressText(preset.address);
    setMapQuery(preset.address);
    setLandmarkText(preset.description);
  };

  const handleSearchAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mapSearchInput.trim()) return;
    const cleanSearch = mapSearchInput.trim();
    const formattedQuery = cleanSearch.toLowerCase().includes('addis')
      ? cleanSearch
      : `${cleanSearch}, Addis Ababa, Ethiopia`;
    setMapQuery(formattedQuery);
    setAddressText(cleanSearch);
  };

  const handleDetectGPS = () => {
    setGpsLoading(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const userLat = pos.coords.latitude;
          const userLng = pos.coords.longitude;
          setLat(userLat);
          setLng(userLng);
          const detectedAddr = `📍 Live GPS Coordinates (${userLat.toFixed(4)}, ${userLng.toFixed(4)})`;
          setAddressText(detectedAddr);
          setMapQuery(`${userLat},${userLng}`);
          setGpsLoading(false);
        },
        () => {
          // Fallback to Bethel shop center
          setLat(8.9833);
          setLng(38.7083);
          setAddressText('Bethel Main Road, Near Bethel Hospital, Addis Ababa');
          setMapQuery('Bethel, Addis Ababa, Ethiopia');
          setGpsLoading(false);
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    } else {
      setGpsLoading(false);
    }
  };

  const embedSrc = `https://www.google.com/maps/embed/v1/place?key=${GOOGLE_MAPS_EMBED_API_KEY}&q=${encodeURIComponent(
    mapQuery
  )}&maptype=roadmap`;

  return (
    <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
          <MapPin className="w-4 h-4 text-emerald-600" />
          <span>Google Maps Location & 6km Radius Verification</span>
        </label>
        <button
          type="button"
          onClick={handleDetectGPS}
          disabled={gpsLoading}
          className="text-[11px] text-emerald-700 hover:text-emerald-800 font-bold flex items-center gap-1 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-xl border border-emerald-200 transition-colors shrink-0"
        >
          <Navigation className={`w-3 h-3 text-emerald-600 ${gpsLoading ? 'animate-spin' : ''}`} />
          <span>{gpsLoading ? 'Detecting GPS...' : 'Detect Live GPS'}</span>
        </button>
      </div>

      {/* Quick Map Search Bar */}
      <form onSubmit={handleSearchAddress} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            value={mapSearchInput}
            onChange={(e) => setMapSearchInput(e.target.value)}
            placeholder="Search Bethel street, hospital, or landmark..."
            className="w-full bg-white border border-slate-300 rounded-xl pl-8 pr-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-600 font-medium"
          />
        </div>
        <button
          type="submit"
          className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors shrink-0"
        >
          Search Map
        </button>
      </form>

      {/* Quick Presets for Distance & 6km Verification Testing */}
      <div className="space-y-1.5">
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
          Addis Ababa / Bethel Presets (Click to Test 6km Rule):
        </p>
        <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
          {LOCATION_PRESETS.map((preset) => {
            const dist = calculateDistanceKm(preset.lat, preset.lng);
            const isPresetWithin = dist <= ALMADINA_SHOP_LOCATION.maxDeliveryDistanceKm;
            const isSelected = lat === preset.lat && lng === preset.lng;
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
                <span className="text-[10px] opacity-75 font-mono">({dist.toFixed(1)} km)</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Google Maps Embed iframe with user-provided key & maptype */}
      <div className="relative rounded-2xl overflow-hidden border border-slate-300 shadow-inner h-64 bg-slate-100">
        <iframe
          width="100%"
          height="100%"
          frameBorder="0"
          style={{ border: 0 }}
          src={embedSrc}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          title="Google Maps Location"
          className="w-full h-full"
        />

        {/* Floating Distance Verification HUD */}
        <div className="absolute bottom-2 left-2 right-2 z-10">
          <div
            className={`p-2.5 rounded-xl border backdrop-blur-md shadow-md flex items-center justify-between gap-2 ${
              isWithinDeliveryLimit
                ? 'bg-emerald-950/90 text-white border-emerald-500/50'
                : 'bg-rose-950/90 text-white border-rose-500/50'
            }`}
          >
            <div className="flex items-center gap-2">
              {isWithinDeliveryLimit ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              )}
              <div className="text-[11px]">
                <span className="font-bold">
                  {isWithinDeliveryLimit
                    ? `Within 6.0 km Delivery Zone (${distanceKm.toFixed(1)} km from Bethel)`
                    : `Exceeds 6.0 km Delivery Radius (${distanceKm.toFixed(1)} km from Bethel)`}
                </span>
                <p className="text-[10px] text-slate-300">
                  {isWithinDeliveryLimit
                    ? `Delivery Fee: ${formatETB(deliveryFee)} (50 Br base + 15 Br/km)`
                    : `Cannot deliver. Distance exceeds 6 km max limit.`}
                </p>
              </div>
            </div>

            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                isWithinDeliveryLimit
                  ? 'bg-emerald-500 text-slate-950'
                  : 'bg-rose-500 text-white'
              }`}
            >
              {isWithinDeliveryLimit ? '✅ Deliverable' : '❌ Cannot Deliver'}
            </span>
          </div>
        </div>
      </div>

      {/* Manual Street & Landmark Text Inputs */}
      <div className="space-y-2 pt-1">
        <div>
          <label className="text-[11px] font-bold text-slate-700 block mb-1">
            Exact Street, Building or House Description
          </label>
          <input
            type="text"
            value={addressText}
            onChange={(e) => setAddressText(e.target.value)}
            placeholder="e.g., Bethel Main Road, Building #12, Near Commercial Bank"
            className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 font-medium focus:outline-none focus:border-emerald-600"
          />
        </div>

        <div>
          <label className="text-[11px] font-bold text-slate-700 block mb-1">
            Landmark & Delivery Notes (Optional)
          </label>
          <input
            type="text"
            value={landmarkText}
            onChange={(e) => setLandmarkText(e.target.value)}
            placeholder="e.g., Green gate next to pharmacy, please call when approaching"
            className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
          />
        </div>
      </div>

      {/* Prominent Rule Status Banner */}
      {!isWithinDeliveryLimit && (
        <div className="p-3 bg-rose-50 border border-rose-300 rounded-xl text-xs text-rose-900 flex items-start gap-2 animate-fade-in">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold">Delivery is restricted to within 6.0 km of our Bethel store.</p>
            <p className="text-[11px] text-rose-700">
              Current calculated distance is <strong>{distanceKm.toFixed(1)} km</strong>. To proceed, please choose an address within 6 km or switch your order to <strong>Store Pickup</strong> (Bethel Main Road).
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
