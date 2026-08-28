import React from 'react';
import { MapPin, Truck, Store, ShieldCheck, Clock, CircleCheck as CheckCircle, Package } from 'lucide-react';
import { BRAND } from '../../constants/brand';

interface HeroBannerProps {
  onExploreProducts: () => void;
  onOpenPageModal: (page: 'faq' | 'about' | 'contact') => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({ onExploreProducts, onOpenPageModal }) => {
  return (
    <div className="relative bg-gradient-to-br from-emerald-950 via-emerald-900 to-slate-900 text-white overflow-hidden rounded-2xl shadow-xl border border-emerald-800/50">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.15),transparent_50%)] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-5 sm:px-8 py-8 md:py-12 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Text */}
        <div className="lg:col-span-7 space-y-5">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/20 border border-emerald-500/30 rounded-full text-emerald-300 text-xs font-semibold backdrop-blur-sm">
            <Package className="w-3.5 h-3.5 text-amber-300" />
            <span>Bethel, Addis Ababa • High Quality Groceries</span>
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-white leading-tight">
            High Quality groceries delivered across Addis Ababa with transparent pricing and reliable service.
          </h1>

          <p className="text-slate-300 text-sm leading-relaxed max-w-xl">
            {BRAND.name} brings you a carefully curated selection of high-quality groceries, delivered right to your door or available for easy in-store pickup.
          </p>

          {/* Delivery Info Pills */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-xs">
            <div className="flex items-center gap-2.5 bg-emerald-900/60 p-2.5 rounded-xl border border-emerald-700/50">
              <Truck className="w-5 h-5 text-emerald-400 shrink-0" />
              <div>
                <p className="font-bold text-emerald-100">6.0 km Max Delivery</p>
                <p className="text-[11px] text-slate-300">Transparent flat-rate pricing</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 bg-emerald-900/60 p-2.5 rounded-xl border border-emerald-700/50">
              <Store className="w-5 h-5 text-amber-400 shrink-0" />
              <div>
                <p className="font-bold text-amber-100">Free Shop Pickup</p>
                <p className="text-[11px] text-slate-300">No distance limit • No minimum order</p>
              </div>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={onExploreProducts}
              className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2"
            >
              <span>Browse Products</span>
              <CheckCircle className="w-4 h-4" />
            </button>
            <button
              onClick={() => onOpenPageModal('about')}
              className="px-4 py-2.5 bg-slate-800/80 hover:bg-slate-800 text-slate-200 font-semibold text-sm rounded-xl border border-slate-700 transition-colors"
            >
              Our Promise & Policy
            </button>
          </div>
        </div>

        {/* Right Info Card */}
        <div className="lg:col-span-5 flex justify-center">
          <div className="bg-slate-900/80 border border-emerald-700/40 rounded-2xl p-5 backdrop-blur-md shadow-2xl w-full max-w-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" />
                Store Verification
              </span>
              <span className="text-[10px] bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded border border-emerald-800">
                Active Store
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-white">Location</p>
                  <p className="text-slate-400 text-[11px]">{BRAND.locationFull}</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <Clock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-white">Working Hours</p>
                  <p className="text-slate-400 text-[11px]">{BRAND.workingHours}</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-white">Payment Options</p>
                  <p className="text-slate-400 text-[11px]">Chapa (Telebirr & CBE Birr) + Cash on Delivery</p>
                </div>
              </div>
            </div>

            <div className="bg-emerald-950/60 p-2.5 rounded-xl border border-emerald-800/60 text-[11px] text-emerald-300 flex items-center justify-between">
              <span>Verified Same-Day Return Policy</span>
              <span className="font-bold text-amber-300">Photo Proof Required</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
