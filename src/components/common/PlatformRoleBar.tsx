import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  User,
  ShieldAlert,
  Smartphone,
  Tablet,
  Monitor,
  ShoppingBag,
  CreditCard,
  CheckCircle2,
  Lock,
} from 'lucide-react';

export const PlatformRoleBar: React.FC = () => {
  const {
    userRole,
    setUserRole,
    viewTab,
    setViewTab,
    deviceFrame,
    setDeviceFrame,
    currentUser,
    adminSession,
    orders,
    reviews,
    cart,
    pendingChapaOrder,
  } = useApp();

  const pendingReviewsCount = reviews.filter((r) => r.status === 'pending_approval').length;

  return (
    <div className="bg-slate-900 text-slate-100 border-b border-slate-800 text-xs px-3 py-2 sticky top-0 z-50 shadow-md">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Brand & Mode Switcher */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 font-bold text-emerald-400">
            <span className="bg-emerald-500/20 p-1 rounded border border-emerald-500/40 text-emerald-300">
              ALMADINA
            </span>
            <span className="hidden sm:inline text-slate-300 font-medium">Bethel, Addis Ababa</span>
          </div>

          <div className="h-4 w-px bg-slate-700 hidden md:block" />

          {/* View Tab Switcher */}
          <div className="flex items-center bg-slate-800 p-0.5 rounded-lg border border-slate-700">
            <button
              onClick={() => setViewTab('storefront')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-medium transition-colors ${
                viewTab === 'storefront'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Storefront</span>
              {cart.length > 0 && (
                <span className="bg-emerald-800 text-emerald-200 px-1.5 py-0.2 text-[10px] rounded-full font-bold">
                  {cart.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setViewTab('admin_dashboard')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-medium transition-colors ${
                viewTab === 'admin_dashboard'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Admin Dashboard</span>
              {pendingReviewsCount > 0 && (
                <span className="bg-amber-800 text-amber-200 px-1.5 py-0.2 text-[10px] rounded-full font-bold">
                  {pendingReviewsCount}
                </span>
              )}
            </button>

            {pendingChapaOrder && (
              <button
                onClick={() => setViewTab('chapa_gateway_sim')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-medium animate-pulse transition-colors ${
                  viewTab === 'chapa_gateway_sim'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'bg-purple-900/60 text-purple-200 hover:bg-purple-800'
                }`}
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Chapa Gateway</span>
              </button>
            )}
          </div>
        </div>

        {/* User Role Switcher & Device Responsive Frame Switcher */}
        <div className="flex items-center gap-3">
          {/* User Role Selection */}
          <div className="flex items-center gap-1.5 bg-slate-800/80 px-2 py-1 rounded-md border border-slate-700">
            <span className="text-slate-400 font-medium hidden lg:inline">Role:</span>
            <select
              value={userRole}
              onChange={(e) => setUserRole(e.target.value as any)}
              className="bg-slate-900 border border-slate-700 text-slate-200 rounded px-2 py-0.5 font-medium text-xs focus:outline-none focus:border-emerald-500"
            >
              <option value="guest">👤 Guest (Unauthenticated)</option>
              <option value="customer">🛒 Customer ({currentUser ? currentUser.name : 'Sami'})</option>
              <option value="admin">🔐 Admin (Store Owner)</option>
            </select>
          </div>

          {/* Active User / Session Status Badge */}
          <div className="hidden xl:flex items-center gap-2">
            {userRole === 'guest' && (
              <span className="text-slate-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                Cart & Checkout Disabled
              </span>
            )}
            {userRole === 'customer' && currentUser && (
              <span className="text-emerald-300 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/60 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                Logged in: {currentUser.phoneNumber}
              </span>
            )}
            {userRole === 'admin' && (
              <span
                className={`px-2 py-0.5 rounded border flex items-center gap-1 ${
                  adminSession.is2FAVerified
                    ? 'bg-amber-950/80 text-amber-300 border-amber-700/60'
                    : 'bg-red-950/80 text-red-300 border-red-700/60'
                }`}
              >
                <Lock className="w-3 h-3" />
                {adminSession.is2FAVerified ? 'Single Session (2FA Active)' : '2FA Required'}
              </span>
            )}
          </div>

          {/* Device Frame Breakpoint Switcher */}
          <div className="flex items-center bg-slate-800 p-0.5 rounded-lg border border-slate-700">
            <button
              onClick={() => setDeviceFrame('mobile')}
              title="Mobile (375px)"
              className={`p-1 rounded ${
                deviceFrame === 'mobile' ? 'bg-slate-700 text-emerald-400' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setDeviceFrame('tablet')}
              title="Tablet (768px)"
              className={`p-1 rounded ${
                deviceFrame === 'tablet' ? 'bg-slate-700 text-emerald-400' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Tablet className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setDeviceFrame('desktop')}
              title="Desktop (Full)"
              className={`p-1 rounded ${
                deviceFrame === 'desktop' ? 'bg-slate-700 text-emerald-400' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
