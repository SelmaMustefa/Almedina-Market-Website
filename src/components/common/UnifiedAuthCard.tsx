import React, { useState, useMemo } from 'react';
import { useApp, AuthResult } from '../../context/AppContext';
import {
  X,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  Check,
  Mail,
  Lock,
  User,
  ShieldAlert,
  ShieldCheck,
  Clock,
  Headphones,
  Smartphone,
  ArrowRight,
  RotateCcw,
  CheckCircle2,
  Phone,
  Sun,
  Moon,
} from 'lucide-react';
import { BRAND } from '../../constants/brand';
import logoSrc from '../../assets/images/logo.png';

// ─── Password Rules ──────────────────────────────────────────────────────────
const PASSWORD_RULES = [
  { id: 'length', label: 'Minimum 8 characters', test: (p: string) => p.length >= 8 },
  { id: 'upper', label: 'At least one uppercase letter', test: (p: string) => /[A-Z]/.test(p) },
  { id: 'number', label: 'At least one number', test: (p: string) => /[0-9]/.test(p) },
  { id: 'special', label: 'At least one special character', test: (p: string) => /[^A-Za-z0-9]/.test(p) },
];

interface RuleRowProps {
  label: string;
  met: boolean;
  touched: boolean;
}

const RuleRow: React.FC<RuleRowProps> = ({ label, met, touched }) => {
  const idle = !touched;
  const green = touched && met;
  const red = touched && !met;

  return (
    <div
      className={`flex items-center gap-1.5 text-xs transition-colors ${
        idle
          ? 'text-slate-400 dark:text-slate-500'
          : green
          ? 'text-emerald-600 dark:text-emerald-400 font-medium'
          : 'text-rose-600 dark:text-rose-400'
      }`}
    >
      {green ? (
        <Check className="w-3.5 h-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
      ) : (
        <span
          className={`w-3.5 h-3.5 shrink-0 flex items-center justify-center font-bold text-[10px] ${
            red ? 'text-rose-500 dark:text-rose-400' : 'text-slate-400 dark:text-slate-500'
          }`}
        >
          ✕
        </span>
      )}
      <span className="leading-none">{label}</span>
    </div>
  );
};

// ─── Google Icon ──────────────────────────────────────────────────────────────
const GoogleIcon = () => (
  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
    />
  </svg>
);

export interface UnifiedAuthCardProps {
  initialAccountType?: 'customer' | 'admin';
  onClose?: () => void;
  onSuccessCustomer?: () => void;
  onSuccessAdmin?: () => void;
  embeddedInModal?: boolean;
}

export const UnifiedAuthCard: React.FC<UnifiedAuthCardProps> = ({
  initialAccountType = 'customer',
  onClose,
  onSuccessCustomer,
  onSuccessAdmin,
  embeddedInModal = false,
}) => {
  const {
    loginUser,
    registerUser,
    loginWithGoogle,
    sendPasswordReset,
    resendVerificationEmail,
    checkEmailVerification,
    pendingVerificationEmail,
    setPendingVerificationEmail,
    adminSession,
    loginAdmin,
    verifyAdmin2FA,
    setViewTab,
    authRedirectMessage,
    setAuthModalOpen,
    theme,
    toggleTheme,
  } = useApp();

  const [accountType, setAccountType] = useState<'customer' | 'admin'>(initialAccountType);
  const [customerMode, setCustomerMode] = useState<'login' | 'register' | 'forgot' | 'verify'>(
    pendingVerificationEmail ? 'verify' : 'login'
  );

  // Customer Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Admin Form State (Step 1: Email + Password, Step 2: 2FA)
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [admin2FACode, setAdmin2FACode] = useState('');
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [adminStep, setAdminStep] = useState<1 | 2>(adminSession.isLoggedIn ? 2 : 1);
  const [adminLocalError, setAdminLocalError] = useState<string | null>(null);
  const [adminSuccessMessage, setAdminSuccessMessage] = useState<string | null>(null);
  const [adminLoading, setAdminLoading] = useState(false);

  // Password Validation
  const passwordRules = useMemo(
    () => PASSWORD_RULES.map((r) => ({ ...r, met: r.test(password) })),
    [password]
  );
  const passwordAllValid = passwordRules.every((r) => r.met);
  const passwordTouched = password.length > 0;

  // ─── Customer Form Actions ──────────────────────────────────────────────────
  const handleCustomerLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!email || !password) {
      setErrorMessage('Please enter both your email address and password.');
      return;
    }

    setLoading(true);
    const res: AuthResult = await loginUser(email.trim(), password);
    setLoading(false);

    if (res.status === 'success') {
      if (onSuccessCustomer) {
        onSuccessCustomer();
      } else {
        if (onClose) onClose();
        setAuthModalOpen(false);
      }
    } else if (res.status === 'error') {
      setErrorMessage(res.message);
    }
  };

  const handleCustomerRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const normalizedEmail = email.trim().toLowerCase();
    if (normalizedEmail === 'al.medina.market90@gmail.com') {
      setErrorMessage('This email address is reserved exclusively for Almedina Market administrative management and cannot be registered as a standard customer account. Please use the Admin Portal tab.');
      return;
    }

    if (!name.trim()) {
      setErrorMessage('Please enter your full name.');
      return;
    }
    if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }
    if (!passwordAllValid) {
      setErrorMessage('Password must satisfy all security requirements listed below.');
      return;
    }

    setLoading(true);
    const res: AuthResult = await registerUser(name.trim(), email.trim(), password);
    setLoading(false);

    if (res.status === 'verify_email') {
      setCustomerMode('verify');
    } else if (res.status === 'success') {
      if (onSuccessCustomer) {
        onSuccessCustomer();
      } else {
        if (onClose) onClose();
        setAuthModalOpen(false);
      }
    } else if (res.status === 'error') {
      setErrorMessage(res.message);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setLoading(true);
    const res = await loginWithGoogle();
    setLoading(false);

    if (res.status === 'success') {
      if (onSuccessCustomer) {
        onSuccessCustomer();
      } else {
        if (onClose) onClose();
        setAuthModalOpen(false);
      }
    } else if (res.status === 'error' && res.message) {
      setErrorMessage(res.message);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!email.trim()) {
      setErrorMessage('Please enter your email address to receive the password reset link.');
      return;
    }

    setLoading(true);
    const res = await sendPasswordReset(email.trim());
    setLoading(false);

    if (res.success) {
      setSuccessMessage('A password reset link has been sent to your email. Check your inbox and spam folder.');
    } else {
      setErrorMessage(res.message);
    }
  };

  // ─── Admin Form Actions ────────────────────────────────────────────────────
  const handleAdminForgotPassword = async () => {
    setAdminLocalError(null);
    setAdminSuccessMessage(null);

    if (!adminEmail.trim()) {
      setAdminLocalError('Please enter your administrator email address above first.');
      return;
    }

    setAdminLoading(true);
    const res = await sendPasswordReset(adminEmail.trim());
    setAdminLoading(false);

    if (res.success) {
      setAdminSuccessMessage(`Password reset link sent to ${adminEmail.trim()}! Check your inbox and spam folder.`);
    } else {
      setAdminLocalError(res.message);
    }
  };

  const handleAdminPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminLocalError(null);

    if (!adminEmail.trim()) {
      setAdminLocalError('Please enter your administrator email.');
      return;
    }
    if (!adminPassword || adminPassword.length < 6) {
      setAdminLocalError('Admin password must be at least 6 characters.');
      return;
    }

    setAdminLoading(true);
    const res = await loginAdmin(adminEmail.trim(), adminPassword);
    setAdminLoading(false);

    if (res.success) {
      setAdminStep(2);
    } else {
      setAdminLocalError(res.message || 'Invalid administrator credentials. Please check your email and password.');
    }
  };

  const handleAdmin2FASubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAdminLocalError(null);
    if (admin2FACode.length !== 6 || !/^\d+$/.test(admin2FACode)) {
      setAdminLocalError('Please enter the 6-digit verification code (demo: 123456).');
      return;
    }

    const ok = verifyAdmin2FA(admin2FACode);
    if (ok) {
      if (onSuccessAdmin) {
        onSuccessAdmin();
      } else {
        if (onClose) onClose();
        setAuthModalOpen(false);
        setViewTab('admin_dashboard');
      }
    } else {
      setAdminLocalError('Invalid security code. Please enter 123456.');
    }
  };

  return (
    <div className="w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden flex flex-col md:flex-row relative transition-colors duration-200">
      {/* Top Controls: Theme Switcher & Close button */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
        <button
          type="button"
          onClick={toggleTheme}
          aria-label="Toggle light/dark theme"
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          className="w-8 h-8 rounded-full bg-slate-100/90 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center transition-colors shadow-sm cursor-pointer"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
        </button>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="w-8 h-8 rounded-full bg-slate-100/90 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition-colors shadow-sm cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* ─── LEFT PANEL: Brand, Logo Showcase, Value Props ─── */}
      <div className="w-full md:w-5/12 bg-gradient-to-b from-[#F2F8F2] via-[#EBF5EB] to-[#E3EFE3] dark:from-slate-900 dark:via-slate-850 dark:to-slate-900 p-6 sm:p-8 md:p-10 flex flex-col justify-between border-b md:border-b-0 md:border-r border-emerald-100/60 dark:border-slate-800 relative overflow-hidden transition-colors duration-200">
        {/* Decorative soft glow background circle */}
        <div className="absolute -top-12 -left-12 w-48 h-48 bg-emerald-200/40 dark:bg-emerald-900/20 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-emerald-300/30 dark:bg-emerald-950/30 rounded-full blur-2xl pointer-events-none" />

        {/* Top: Logo & Welcome Heading */}
        <div className="relative z-10 space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-700 dark:bg-emerald-600 flex items-center justify-center text-white shadow-sm shadow-emerald-900/20">
              {/* Custom leaf shopping bag icon */}
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M16 6V4a4 4 0 0 0-8 0v2H4v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6h-4zm-6-2a2 2 0 0 1 4 0v2h-4V4zm-1 9a3 3 0 0 1 6 0 3 3 0 0 1-6 0z" />
              </svg>
            </div>
            <div>
              <span className="font-extrabold text-lg text-emerald-900 dark:text-emerald-300 tracking-tight block leading-none">
                {BRAND.name.toUpperCase()}
              </span>
              <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 tracking-wider uppercase block">
                Market
              </span>
            </div>
          </div>

          <div className="pt-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight leading-tight">
              {customerMode === 'register' ? 'Join Us Today' : 'Welcome Back!'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 font-normal">
              {customerMode === 'register'
                ? 'Create an account for quick orders & doorstep delivery'
                : 'Sign in to your account to continue'}
            </p>
          </div>
        </div>

        {/* Middle: Brand Logo Showcase */}
        <div className="relative z-10 py-6 my-auto flex items-center justify-center">
          <div className="relative group max-w-[200px] sm:max-w-[230px] p-4 bg-white/90 dark:bg-slate-800/90 rounded-3xl border border-emerald-200/80 dark:border-emerald-700/40 shadow-xl shadow-emerald-950/5 backdrop-blur-sm transition-transform duration-500 group-hover:scale-105">
            <img
              src={logoSrc}
              alt="Almedina Market Logo"
              className="w-full h-auto object-contain drop-shadow-md"
            />
          </div>
        </div>

        {/* Bottom: 3 Value Props (Secure, Fast, Support) */}
        <div className="relative z-10 space-y-3 pt-2">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-600/10 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-600/20 dark:border-emerald-500/30">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-tight">Secure & Safe</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Your data is always protected</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-600/10 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-600/20 dark:border-emerald-500/30">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-tight">Fast & Easy</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Quick access to your account</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-600/10 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-600/20 dark:border-emerald-500/30">
              <Headphones className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-tight">24/7 Support</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">We're here to help you anytime</p>
            </div>
          </div>
        </div>
      </div>

      {/* ─── RIGHT PANEL: Unified Sign In / Sign Up Form ─── */}
      <div className="w-full md:w-7/12 bg-white dark:bg-slate-900 p-6 sm:p-8 md:p-10 flex flex-col justify-center transition-colors duration-200">
        {/* Header */}
        <div className="mb-5">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {accountType === 'admin'
              ? 'Admin Portal'
              : customerMode === 'register'
              ? 'Create Account'
              : customerMode === 'forgot'
              ? 'Reset Password'
              : customerMode === 'verify'
              ? 'Verify Your Email'
              : 'Sign In'}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {accountType === 'admin'
              ? 'Enter administrative credentials to access the store management system'
              : customerMode === 'register'
              ? 'Join Almadina Market for Bethel doorstep delivery & specials'
              : customerMode === 'forgot'
              ? 'Enter your registered email to receive password reset instructions'
              : customerMode === 'verify'
              ? 'Check your inbox to activate your customer profile'
              : 'Choose your account type and sign in'}
          </p>
        </div>

        {/* Account Type Segmented Selector (Customer vs Admin) */}
        {customerMode !== 'verify' && (
          <div className="grid grid-cols-2 p-1 bg-slate-100 dark:bg-slate-800/90 rounded-2xl border border-slate-200/90 dark:border-slate-700 mb-5 gap-1">
            <button
              type="button"
              onClick={() => {
                setAccountType('customer');
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all min-h-[42px] cursor-pointer ${
                accountType === 'customer'
                  ? 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-900 dark:text-emerald-200 border border-emerald-600/40 dark:border-emerald-500/60 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <User className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
              <span>Customer</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setAccountType('admin');
                setErrorMessage(null);
                setSuccessMessage(null);
                setAdminLocalError(null);
              }}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all min-h-[42px] cursor-pointer ${
                accountType === 'admin'
                  ? 'bg-amber-50 dark:bg-amber-950/70 text-amber-900 dark:text-amber-200 border border-amber-600/40 dark:border-amber-500/60 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-amber-700 dark:text-amber-400" />
              <span>Admin</span>
            </button>
          </div>
        )}

        {/* Redirect Notice (e.g. prompt when checkout requires auth) */}
        {authRedirectMessage && accountType === 'customer' && (
          <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl text-amber-800 dark:text-amber-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <span>{authRedirectMessage}</span>
          </div>
        )}

        {/* Error message */}
        {(errorMessage || adminLocalError) && (
          <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2 animate-shake">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 dark:text-rose-400 mt-0.5" />
            <span className="flex-1 leading-relaxed">{errorMessage || adminLocalError}</span>
          </div>
        )}

        {/* Success message */}
        {successMessage && (
          <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-800 dark:text-emerald-300 text-xs flex items-start gap-2">
            <Check className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
            <span className="flex-1 leading-relaxed">{successMessage}</span>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════════
            CUSTOMER FLOW
        ════════════════════════════════════════════════════════════════════════ */}
        {accountType === 'customer' && (
          <>
            {/* 1. CUSTOMER SIGN IN */}
            {customerMode === 'login' && (
              <form onSubmit={handleCustomerLogin} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="email"
                      required
                      placeholder="enter your email adress"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-3 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:border-emerald-600 dark:focus:border-emerald-500 focus:ring-2 focus:ring-emerald-600/20 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-10 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:border-emerald-600 dark:focus:border-emerald-500 focus:ring-2 focus:ring-emerald-600/20 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 p-1 cursor-pointer"
                      aria-label="Toggle password visibility"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <label className="flex items-center gap-2 text-slate-600 dark:text-slate-400 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-emerald-600 focus:ring-emerald-500 accent-emerald-600"
                    />
                    <span>Remember me</span>
                  </label>

                  <button
                    type="button"
                    onClick={() => {
                      setCustomerMode('forgot');
                      setErrorMessage(null);
                      setSuccessMessage(null);
                    }}
                    className="text-emerald-700 dark:text-emerald-400 font-semibold hover:underline cursor-pointer"
                  >
                    Forgot password?
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-emerald-800 hover:bg-emerald-900 dark:bg-emerald-600 dark:hover:bg-emerald-500 active:scale-[0.99] text-white font-bold text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2 min-h-[44px] disabled:opacity-60 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Signing In...</span>
                    </>
                  ) : (
                    <span>Sign In</span>
                  )}
                </button>

                {/* Divider */}
                <div className="relative flex items-center justify-center my-3">
                  <div className="border-t border-slate-200 dark:border-slate-700 w-full" />
                  <span className="bg-white dark:bg-slate-900 px-3 text-xs text-slate-400 dark:text-slate-500 font-medium">or</span>
                </div>

                {/* Google Sign In */}
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                  className="w-full py-2.5 px-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 font-semibold text-xs rounded-xl transition-colors flex items-center justify-center gap-2.5 min-h-[42px] shadow-sm disabled:opacity-60 cursor-pointer"
                >
                  <GoogleIcon />
                  <span>Continue with Google</span>
                </button>

                {/* Toggle to Create Account */}
                <div className="text-center pt-2 text-xs text-slate-600 dark:text-slate-400">
                  <span>Don't have an account? </span>
                  <button
                    type="button"
                    onClick={() => {
                      setCustomerMode('register');
                      setErrorMessage(null);
                      setSuccessMessage(null);
                    }}
                    className="text-emerald-700 dark:text-emerald-400 font-bold hover:underline cursor-pointer"
                  >
                    Create account
                  </button>
                </div>
              </form>
            )}

            {/* 2. CUSTOMER SIGN UP / CREATE ACCOUNT */}
            {customerMode === 'register' && (
              <form onSubmit={handleCustomerRegister} className="space-y-3.5">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">Full Name</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Abebe Bikila"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-3 py-2 text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:border-emerald-600 dark:focus:border-emerald-500 focus:ring-2 focus:ring-emerald-600/20 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">Email Address</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="email"
                      required
                      placeholder="enter your email adress"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-3 py-2 text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:border-emerald-600 dark:focus:border-emerald-500 focus:ring-2 focus:ring-emerald-600/20 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                    Phone Number <span className="text-slate-400 dark:text-slate-500 font-normal">(Optional for delivery updates)</span>
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="tel"
                      placeholder="+251 911 000 000"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-3 py-2 text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:border-emerald-600 dark:focus:border-emerald-500 focus:ring-2 focus:ring-emerald-600/20 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">Password</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-10 py-2 text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:border-emerald-600 dark:focus:border-emerald-500 focus:ring-2 focus:ring-emerald-600/20 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 p-1 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Password rules indicator */}
                  <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl grid grid-cols-1 sm:grid-cols-2 gap-1.5 mt-1.5">
                    {passwordRules.map((rule) => (
                      <RuleRow
                        key={rule.id}
                        label={rule.label}
                        met={rule.met}
                        touched={passwordTouched}
                      />
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-emerald-800 hover:bg-emerald-900 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white font-bold text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2 min-h-[44px] disabled:opacity-60 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Creating Account...</span>
                    </>
                  ) : (
                    <span>Create Account</span>
                  )}
                </button>

                <div className="text-center pt-1 text-xs text-slate-600 dark:text-slate-400">
                  <span>Already have an account? </span>
                  <button
                    type="button"
                    onClick={() => {
                      setCustomerMode('login');
                      setErrorMessage(null);
                      setSuccessMessage(null);
                    }}
                    className="text-emerald-700 dark:text-emerald-400 font-bold hover:underline cursor-pointer"
                  >
                    Sign in
                  </button>
                </div>
              </form>
            )}

            {/* 3. FORGOT PASSWORD */}
            {customerMode === 'forgot' && (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                    Registered Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="email"
                      required
                      placeholder="enter your email adress"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-3 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:border-emerald-600 dark:focus:border-emerald-500 focus:ring-2 focus:ring-emerald-600/20 transition-all"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-emerald-800 hover:bg-emerald-900 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white font-bold text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2 min-h-[44px] disabled:opacity-60 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Sending Link...</span>
                    </>
                  ) : (
                    <span>Send Password Reset Link</span>
                  )}
                </button>

                <div className="text-center pt-2 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setCustomerMode('login');
                      setErrorMessage(null);
                      setSuccessMessage(null);
                    }}
                    className="text-emerald-700 dark:text-emerald-400 font-bold hover:underline cursor-pointer"
                  >
                    ← Back to Sign In
                  </button>
                </div>
              </form>
            )}

            {/* 4. VERIFY EMAIL SCREEN */}
            {customerMode === 'verify' && (
              <div className="space-y-4">
                <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl space-y-2">
                  <p className="text-xs text-emerald-900 dark:text-emerald-200 leading-relaxed">
                    We sent a verification link to{' '}
                    <strong className="font-semibold text-emerald-950 dark:text-emerald-100">
                      {pendingVerificationEmail || email}
                    </strong>
                    . Click the link inside your email to complete verification.
                  </p>
                  <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
                    Sender: <span className="font-mono">noreply@almadinamarket.firebaseapp.com</span>
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (onClose) onClose();
                    setAuthModalOpen(false);
                  }}
                  className="w-full py-3 bg-emerald-800 hover:bg-emerald-900 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white font-bold text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2 min-h-[44px] cursor-pointer"
                >
                  <span>Continue & Start Shopping</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <div className="flex items-center justify-between text-xs pt-1">
                  <button
                    type="button"
                    onClick={() => resendVerificationEmail()}
                    className="text-emerald-700 dark:text-emerald-400 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Resend email</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setCustomerMode('login');
                      setPendingVerificationEmail(null);
                    }}
                    className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 cursor-pointer"
                  >
                    Back to Login
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* ═══════════════════════════════════════════════════════════════════════
            ADMIN FLOW
        ════════════════════════════════════════════════════════════════════════ */}
        {accountType === 'admin' && (
          <div className="space-y-4">
            {/* Session Error */}
            {adminSession.sessionError && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-500 dark:text-rose-400 shrink-0 mt-0.5" />
                <span>{adminSession.sessionError}</span>
              </div>
            )}

            {/* Step 1: Admin Email & Password */}
            {adminStep === 1 && (
              <form onSubmit={handleAdminPasswordSubmit} className="space-y-4">
                {adminLocalError && (
                  <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-500 dark:text-rose-400 shrink-0 mt-0.5" />
                    <span>{adminLocalError}</span>
                  </div>
                )}

                {adminSuccessMessage && (
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-800 dark:text-emerald-300 text-xs flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <span>{adminSuccessMessage}</span>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                    Admin Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="email"
                      required
                      placeholder="enter your email adress"
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:border-amber-500 dark:focus:border-amber-400 focus:ring-2 focus:ring-amber-500/20 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                      Admin Password
                    </label>
                    <button
                      type="button"
                      onClick={handleAdminForgotPassword}
                      disabled={adminLoading}
                      className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-300 transition-colors cursor-pointer"
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type={showAdminPassword ? 'text' : 'password'}
                      required
                      placeholder="enter your password"
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-10 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:border-amber-500 dark:focus:border-amber-400 focus:ring-2 focus:ring-amber-500/20 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowAdminPassword(!showAdminPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 p-1 cursor-pointer"
                    >
                      {showAdminPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={adminLoading}
                  className="w-full py-3 bg-amber-600 hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600 disabled:opacity-60 active:scale-[0.99] text-white font-bold text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2 min-h-[44px] cursor-pointer"
                >
                  {adminLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Authenticating with Firebase...</span>
                    </>
                  ) : (
                    <>
                      <span>Next: Verify Security Code</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* Step 2: 2FA Security Code */}
            {adminStep === 2 && (
              <form onSubmit={handleAdmin2FASubmit} className="space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2.5">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                    <Smartphone className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <p className="font-bold text-xs text-slate-900 dark:text-slate-100">Two-Factor Verification</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">Step 2 of 2</p>
                  </div>
                </div>

                {/* Password Verified Status badge with Change Password link */}
                <div className="p-3 bg-slate-50 dark:bg-slate-800/70 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span className="font-medium">Password verified</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setAdminStep(1);
                      setAdmin2FACode('');
                      setAdminLocalError(null);
                    }}
                    className="text-amber-700 dark:text-amber-400 font-bold hover:underline text-[11px] cursor-pointer"
                  >
                    Change Password
                  </button>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                    6-Digit Security Code
                  </label>
                  <input
                    type="text"
                    placeholder="_ _ _ _ _ _"
                    maxLength={6}
                    value={admin2FACode}
                    onChange={(e) => setAdmin2FACode(e.target.value.replace(/\D/g, ''))}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-3 text-center tracking-[0.5em] font-mono text-xl sm:text-2xl font-bold text-emerald-900 dark:text-emerald-300 placeholder:text-slate-400 dark:placeholder:text-slate-600 placeholder:tracking-normal focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:border-emerald-600 dark:focus:border-emerald-500 focus:ring-2 focus:ring-emerald-600/20 transition-all"
                  />
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 text-center pt-0.5">
                    Demo security code: <span className="text-emerald-700 dark:text-emerald-400 font-mono font-bold">123456</span>
                  </p>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 active:scale-[0.99] text-white font-bold text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2 min-h-[44px] cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Unlock Admin Dashboard</span>
                </button>
              </form>
            )}

            <p className="text-center text-[10px] text-slate-400 dark:text-slate-500 pt-1">
              {BRAND.name} • Authorized administrative personnel only
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
