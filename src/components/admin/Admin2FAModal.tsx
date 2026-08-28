import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Lock, Mail, ShieldAlert, Smartphone, ArrowRight, CircleAlert as AlertCircle, CircleCheck as CheckCircle2, Loader2 } from 'lucide-react';

export const Admin2FAModal: React.FC = () => {
  const { adminSession, loginAdmin, verifyAdmin2FA, logoutAdmin } = useApp();

  const [email, setEmail] = useState(adminSession.adminEmail || '');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  if (adminSession.isLoggedIn && adminSession.is2FAVerified) {
    return null; // Admin authenticated
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (!email.trim()) {
      setLocalError('Please enter administrator email.');
      return;
    }
    if (!password) {
      setLocalError('Please enter administrator password.');
      return;
    }

    setLoading(true);
    const res = await loginAdmin(email.trim(), password);
    setLoading(false);

    if (!res.success) {
      setLocalError(res.message || 'Invalid administrator credentials.');
    }
  };

  const handle2FASubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (code.length !== 6 || !/^\d+$/.test(code)) {
      setLocalError('Please enter the 6-digit verification code (e.g. 123456).');
      return;
    }

    const ok = verifyAdmin2FA(code);
    if (!ok) {
      setLocalError('Invalid security verification code.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 text-slate-100 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-slate-800 p-6 space-y-5 animate-fade-in text-xs">
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center font-bold">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-bold text-base text-white">Almedina Market Owner Auth</h2>
            <p className="text-slate-400 text-[11px]">Store Dashboard • Firebase Authentication Required</p>
          </div>
        </div>

        {/* Single Session Warning Banner */}
        <div className="p-3 bg-amber-950/60 border border-amber-800/80 rounded-xl text-amber-200 text-[11px] leading-relaxed flex items-start gap-2">
          <Smartphone className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-amber-300">Single Active Admin Session Enforced</p>
            <p>Authenticating will automatically invalidate any previous active Admin session on other devices.</p>
          </div>
        </div>

        {(adminSession.sessionError || localError) && (
          <div className="p-3 bg-rose-950/80 border border-rose-800 rounded-xl text-rose-200 text-[11px] flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <p>{adminSession.sessionError || localError}</p>
          </div>
        )}

        {/* STEP 1: Email & Password Entry */}
        {!adminSession.isLoggedIn ? (
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="font-bold text-slate-300 block">Admin Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  placeholder="admin@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-300 block">Admin Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  placeholder="Enter administrator password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-amber-600 hover:bg-amber-500 disabled:opacity-60 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <span>Next: 2FA Verification</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        ) : (
          /* STEP 2: 2FA Security Code Entry */
          <form onSubmit={handle2FASubmit} className="space-y-4">
            <div className="p-3 bg-slate-800 rounded-xl border border-slate-700 text-[11px] text-slate-300 flex items-center justify-between">
              <span>Firebase credentials verified ✓</span>
              <button
                type="button"
                onClick={logoutAdmin}
                className="text-amber-400 font-bold hover:underline cursor-pointer"
              >
                Change
              </button>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-300 block">6-Digit 2FA Security Code</label>
              <input
                type="text"
                placeholder="_ _ _ _ _ _"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-center tracking-[0.5em] font-mono text-lg font-bold text-amber-400 focus:outline-none focus:border-amber-500"
              />
              <p className="text-[10px] text-slate-400 text-center">
                Demo code: <strong className="text-amber-300">123456</strong>
              </p>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Unlock Admin Dashboard</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
