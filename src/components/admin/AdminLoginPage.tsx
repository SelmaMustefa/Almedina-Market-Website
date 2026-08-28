import React, { useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { UnifiedAuthCard } from '../common/UnifiedAuthCard';
import { ArrowLeft } from 'lucide-react';

export const AdminLoginPage: React.FC = () => {
  const { adminSession, setViewTab } = useApp();

  // If already fully authenticated, go to dashboard immediately
  useEffect(() => {
    if (adminSession.isLoggedIn && adminSession.is2FAVerified) {
      setViewTab('admin_dashboard');
    }
  }, [adminSession.isLoggedIn, adminSession.is2FAVerified, setViewTab]);

  return (
    <div className="min-h-screen bg-[#F7FAF7] flex flex-col items-center justify-center p-4 sm:p-6 relative">
      {/* Return to Storefront link at top */}
      <button
        type="button"
        onClick={() => setViewTab('storefront')}
        className="absolute top-4 left-4 sm:top-6 sm:left-6 flex items-center gap-2 text-slate-600 hover:text-emerald-800 text-xs sm:text-sm font-semibold transition-colors bg-white/80 hover:bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-sm cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4 text-emerald-700" />
        <span>Back to Storefront</span>
      </button>

      {/* Main Form Card */}
      <div className="w-full max-w-4xl animate-fade-in my-8">
        <UnifiedAuthCard
          initialAccountType="admin"
          onSuccessAdmin={() => setViewTab('admin_dashboard')}
          onSuccessCustomer={() => setViewTab('storefront')}
        />
      </div>
    </div>
  );
};
