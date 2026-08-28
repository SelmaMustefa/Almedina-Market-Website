import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Order } from '../../types';
import { formatETB } from '../../utils/distance';
import {
  CreditCard,
  CircleCheck as CheckCircle2,
  Circle as XCircle,
  Loader as Loader2,
  X,
  Lock,
  Smartphone,
  Building2,
  Globe,
  Wallet,
  ChevronRight,
  ShieldCheck,
  ExternalLink,
  ArrowLeft,
} from 'lucide-react';
import { BRAND } from '../../constants/brand';

interface ChapaPaymentSimulatorProps {
  order?: Order | null;
}

type PaymentCategory = 'wallets' | 'local_cards' | 'bank_transfers' | 'international';

export const ChapaPaymentSimulator: React.FC<ChapaPaymentSimulatorProps> = () => {
  const {
    orders,
    pendingChapaOrder,
    verifyChapaPayment,
    simulateChapaPaymentSuccess,
    simulateChapaPaymentFailure,
    setViewTab,
  } = useApp();

  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationDone, setVerificationDone] = useState<boolean | null>(null);
  const [activeCategory, setActiveCategory] = useState<PaymentCategory>('wallets');

  // Card form states
  const [cardNumber, setCardNumber] = useState('4000 1234 5678 9010');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvv, setCardCvv] = useState('123');
  const [cardName, setCardName] = useState('Test Customer');

  // Wallet form states
  const [mobileNumber, setMobileNumber] = useState('');
  const [selectedWallet, setSelectedWallet] = useState<string>('telebirr');

  // Developer test toggle
  const [forceFailure, setForceFailure] = useState(false);
  const [showDevConsole, setShowDevConsole] = useState(false);

  // Extract tx_ref and amount from URL search params
  const searchParams = new URLSearchParams(window.location.search);
  const paramTxRef = searchParams.get('tx_ref') || '';
  const paramAmount = searchParams.get('amount');

  // Match order from context
  const activeOrder =
    pendingChapaOrder ||
    orders.find((o) => o.chapaTxRef === paramTxRef || o.id === paramTxRef || o.orderNumber === paramTxRef) ||
    (orders.length > 0 ? orders[0] : null);

  const effectiveTxRef = activeOrder?.chapaTxRef || paramTxRef || 'CHP-TX-TEST';
  const effectiveAmount = activeOrder?.totalETB || (paramAmount ? Number(paramAmount) : 0);

  const handleSimulateSuccess = () => {
    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      setVerificationDone(true);
      window.location.href = `/?chapa_status=success&tx_ref=${encodeURIComponent(effectiveTxRef)}&order_id=${activeOrder?.id || ''}`;
    }, 1200);
  };

  const handleSimulateFailure = () => {
    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      setVerificationDone(false);
      window.location.href = `/?chapa_status=failed&tx_ref=${encodeURIComponent(effectiveTxRef)}`;
    }, 1200);
  };

  const handlePay = () => {
    if (forceFailure) {
      handleSimulateFailure();
    } else {
      handleSimulateSuccess();
    }
  };

  // No active order fallback
  if (!activeOrder && !paramTxRef) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0B131E' }}>
        <div className="max-w-md mx-auto p-8 rounded-2xl text-center space-y-5" style={{ background: '#13222A' }}>
          <CreditCard className="w-12 h-12 mx-auto" style={{ color: '#5C8374' }} />
          <h2 className="font-bold text-lg" style={{ color: '#E0E0E0' }}>No Pending Payment Session</h2>
          <p className="text-sm" style={{ color: '#8B9DAF' }}>
            Place an order selecting Chapa at checkout to launch the Chapa payment portal.
          </p>
          <button
            onClick={() => {
              window.location.href = '/';
              setViewTab('storefront');
            }}
            className="px-6 py-3 rounded-xl text-sm font-bold transition-all"
            style={{ background: '#31A050', color: '#fff' }}
          >
            Return to Storefront
          </button>
        </div>
      </div>
    );
  }

  // Categories config
  const categories: { id: PaymentCategory; label: string; icon: React.ReactNode }[] = [
    { id: 'wallets', label: 'Wallets', icon: <Wallet className="w-4 h-4" /> },
    { id: 'local_cards', label: 'Local Cards', icon: <CreditCard className="w-4 h-4" /> },
    { id: 'bank_transfers', label: 'Bank Transfers', icon: <Building2 className="w-4 h-4" /> },
    { id: 'international', label: 'International Payments', icon: <Globe className="w-4 h-4" /> },
  ];

  // Wallet providers
  const walletProviders = [
    { id: 'telebirr', label: 'Telebirr', color: '#0066B3', textColor: '#fff', bg: '#0066B3' },
    { id: 'cbe_birr', label: 'Birr', color: '#8B4513', textColor: '#fff', bg: '#D4A017' },
    { id: 'mpesa', label: 'M-Pesa', color: '#4CAF50', textColor: '#fff', bg: '#4CAF50' },
    { id: 'ebirr', label: 'E-Birr', color: '#FF9800', textColor: '#fff', bg: '#FF9800' },
  ];

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-4"
      style={{ background: '#0B131E' }}
    >
      {/* Main Checkout Card */}
      <div
        className="w-full max-w-[720px] rounded-2xl overflow-hidden shadow-2xl relative"
        style={{
          background: '#0D1D2C',
          border: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        {/* Close Button */}
        <button
          onClick={() => {
            window.location.href = '/';
            setViewTab('storefront');
          }}
          className="absolute top-3 right-3 z-20 p-1.5 rounded-full transition-colors"
          style={{ color: '#8B9DAF' }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#fff')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#8B9DAF')}
          title="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Processing Overlay */}
        {isVerifying && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center rounded-2xl"
            style={{ background: 'rgba(11, 19, 30, 0.92)', backdropFilter: 'blur(4px)' }}
          >
            <Loader2 className="w-10 h-10 animate-spin mb-4" style={{ color: '#31A050' }} />
            <p className="font-bold text-sm" style={{ color: '#E0E0E0' }}>Processing payment...</p>
            <p className="text-xs mt-1" style={{ color: '#8B9DAF' }}>Redirecting to verified return URL...</p>
          </div>
        )}

        {/* Success Overlay */}
        {verificationDone === true && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center rounded-2xl"
            style={{ background: 'rgba(11, 19, 30, 0.92)', backdropFilter: 'blur(4px)' }}
          >
            <CheckCircle2 className="w-14 h-14 mb-3" style={{ color: '#31A050' }} />
            <p className="font-bold text-base" style={{ color: '#E0E0E0' }}>Payment Successful!</p>
            <p className="text-xs mt-1" style={{ color: '#8B9DAF' }}>Returning to store...</p>
          </div>
        )}

        {/* Failure Overlay */}
        {verificationDone === false && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center rounded-2xl"
            style={{ background: 'rgba(11, 19, 30, 0.92)', backdropFilter: 'blur(4px)' }}
          >
            <XCircle className="w-14 h-14 mb-3" style={{ color: '#EF4444' }} />
            <p className="font-bold text-base" style={{ color: '#E0E0E0' }}>Payment Failed</p>
            <p className="text-xs mt-1" style={{ color: '#8B9DAF' }}>Returning to store...</p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row min-h-[380px]">
          {/* ===== LEFT SIDEBAR ===== */}
          <div
            className="sm:w-[240px] w-full p-5 flex flex-col shrink-0"
            style={{
              background: '#13222A',
              borderRight: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            {/* Chapa Logo & Tagline */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-1">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs"
                  style={{ background: '#31A050', color: '#fff' }}
                >
                  C
                </div>
                <span className="font-extrabold text-lg tracking-tight" style={{ color: '#31A050' }}>
                  Chapa
                </span>
              </div>
              <p className="text-[11px] mt-1" style={{ color: '#8B9DAF' }}>
                Select your payment method here
              </p>
            </div>

            {/* Category List */}
            <nav className="flex flex-col gap-1 flex-1">
              {categories.map((cat) => {
                const isActive = cat.id === activeCategory;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all text-sm font-medium relative"
                    style={{
                      background: isActive ? 'rgba(49, 160, 80, 0.15)' : 'transparent',
                      color: isActive ? '#31A050' : '#C0CDD8',
                      borderLeft: isActive ? '3px solid #31A050' : '3px solid transparent',
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.background = 'transparent';
                      }
                    }}
                  >
                    <span style={{ opacity: isActive ? 1 : 0.6 }}>{cat.icon}</span>
                    <span className="flex-1">{cat.label}</span>
                    <ChevronRight className="w-3.5 h-3.5" style={{ opacity: 0.4 }} />
                  </button>
                );
              })}
            </nav>
          </div>

          {/* ===== RIGHT CHECKOUT PANEL ===== */}
          <div className="flex-1 p-6 flex flex-col">
            {/* Checkout Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs"
                  style={{ background: '#31A050', color: '#fff' }}
                >
                  C
                </div>
                <h2 className="font-bold text-base italic" style={{ color: '#E0E0E0' }}>
                  Chapa Checkout
                </h2>
              </div>
              <div
                className="px-2 py-0.5 rounded text-[10px] font-bold"
                style={{ background: 'rgba(49, 160, 80, 0.15)', color: '#31A050', border: '1px solid rgba(49,160,80,0.3)' }}
              >
                EN
              </div>
            </div>

            {/* Dynamic Content Area */}
            <div className="flex-1 flex flex-col">

              {/* ====== WALLETS TAB ====== */}
              {activeCategory === 'wallets' && (
                <div className="flex flex-col gap-5 animate-fade-in">
                  {/* Wallet Provider Logos */}
                  <div className="flex gap-2.5 flex-wrap">
                    {walletProviders.map((wp) => (
                      <button
                        key={wp.id}
                        onClick={() => setSelectedWallet(wp.id)}
                        className="px-4 py-2 rounded-lg text-xs font-bold transition-all border"
                        style={{
                          background: selectedWallet === wp.id ? wp.bg : 'rgba(255,255,255,0.05)',
                          color: selectedWallet === wp.id ? wp.textColor : '#8B9DAF',
                          borderColor: selectedWallet === wp.id ? wp.bg : 'rgba(255,255,255,0.1)',
                          transform: selectedWallet === wp.id ? 'scale(1.05)' : 'scale(1)',
                        }}
                      >
                        {wp.label}
                      </button>
                    ))}
                  </div>

                  {/* Phone Number Input */}
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: '#C0CDD8' }}>
                      Phone Number
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={mobileNumber}
                        onChange={(e) => setMobileNumber(e.target.value)}
                        placeholder="09********"
                        className="w-full px-4 py-3 rounded-lg text-sm font-medium focus:outline-none transition-all"
                        style={{
                          background: '#0B131E',
                          color: '#E0E0E0',
                          border: '1px solid rgba(255,255,255,0.12)',
                        }}
                        onFocus={(e) => (e.target.style.borderColor = '#31A050')}
                        onBlur={(e) => (e.target.style.borderColor = 'rgba(255,255,255,0.12)')}
                      />
                      {mobileNumber.length >= 10 && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <CheckCircle2 className="w-5 h-5" style={{ color: '#31A050' }} />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Pay Button */}
                  <button
                    onClick={handlePay}
                    disabled={isVerifying}
                    className="w-full py-3.5 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2"
                    style={{
                      background: forceFailure ? '#EF4444' : '#31A050',
                      color: '#fff',
                      opacity: isVerifying ? 0.6 : 1,
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.9')}
                    onMouseLeave={(e) => (e.currentTarget.style.opacity = isVerifying ? '0.6' : '1')}
                  >
                    {isVerifying ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : forceFailure ? (
                      <>Pay & Simulate Failure</>
                    ) : (
                      <>Pay <strong>ETB {effectiveAmount.toFixed(2)}</strong></>
                    )}
                  </button>
                </div>
              )}

              {/* ====== LOCAL CARDS TAB ====== */}
              {activeCategory === 'local_cards' && (
                <div className="flex flex-col gap-4 animate-fade-in">
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: '#C0CDD8' }}>
                      Cardholder Name
                    </label>
                    <input
                      type="text"
                      value={cardName}
                      onChange={(e) => setCardName(e.target.value)}
                      className="w-full px-4 py-3 rounded-lg text-sm font-medium focus:outline-none"
                      style={{
                        background: '#0B131E',
                        color: '#E0E0E0',
                        border: '1px solid rgba(255,255,255,0.12)',
                      }}
                      onFocus={(e) => (e.target.style.borderColor = '#31A050')}
                      onBlur={(e) => (e.target.style.borderColor = 'rgba(255,255,255,0.12)')}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: '#C0CDD8' }}>
                      Card Number
                    </label>
                    <input
                      type="text"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      className="w-full px-4 py-3 rounded-lg text-sm font-mono font-bold focus:outline-none"
                      style={{
                        background: '#0B131E',
                        color: '#E0E0E0',
                        border: '1px solid rgba(255,255,255,0.12)',
                      }}
                      onFocus={(e) => (e.target.style.borderColor = '#31A050')}
                      onBlur={(e) => (e.target.style.borderColor = 'rgba(255,255,255,0.12)')}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium mb-1.5" style={{ color: '#C0CDD8' }}>
                        Expiry Date
                      </label>
                      <input
                        type="text"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        placeholder="MM/YY"
                        className="w-full px-4 py-3 rounded-lg text-sm font-mono font-bold text-center focus:outline-none"
                        style={{
                          background: '#0B131E',
                          color: '#E0E0E0',
                          border: '1px solid rgba(255,255,255,0.12)',
                        }}
                        onFocus={(e) => (e.target.style.borderColor = '#31A050')}
                        onBlur={(e) => (e.target.style.borderColor = 'rgba(255,255,255,0.12)')}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1.5" style={{ color: '#C0CDD8' }}>
                        CVV
                      </label>
                      <input
                        type="text"
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value)}
                        placeholder="123"
                        className="w-full px-4 py-3 rounded-lg text-sm font-mono font-bold text-center focus:outline-none"
                        style={{
                          background: '#0B131E',
                          color: '#E0E0E0',
                          border: '1px solid rgba(255,255,255,0.12)',
                        }}
                        onFocus={(e) => (e.target.style.borderColor = '#31A050')}
                        onBlur={(e) => (e.target.style.borderColor = 'rgba(255,255,255,0.12)')}
                      />
                    </div>
                  </div>

                  {/* Pay Button */}
                  <button
                    onClick={handlePay}
                    disabled={isVerifying}
                    className="w-full py-3.5 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 mt-1"
                    style={{
                      background: forceFailure ? '#EF4444' : '#31A050',
                      color: '#fff',
                      opacity: isVerifying ? 0.6 : 1,
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.9')}
                    onMouseLeave={(e) => (e.currentTarget.style.opacity = isVerifying ? '0.6' : '1')}
                  >
                    {isVerifying ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : forceFailure ? (
                      <>Pay & Simulate Failure</>
                    ) : (
                      <>Pay <strong>ETB {effectiveAmount.toFixed(2)}</strong></>
                    )}
                  </button>
                </div>
              )}

              {/* ====== BANK TRANSFERS TAB ====== */}
              {activeCategory === 'bank_transfers' && (
                <div className="flex flex-col items-center justify-center flex-1 text-center gap-4 animate-fade-in py-8">
                  <Building2 className="w-10 h-10" style={{ color: '#5C8374' }} />
                  <div>
                    <p className="font-bold text-sm" style={{ color: '#E0E0E0' }}>
                      Bank Transfer
                    </p>
                    <p className="text-xs mt-1" style={{ color: '#8B9DAF' }}>
                      Transfer directly from your bank account.
                    </p>
                  </div>
                  <button
                    onClick={handlePay}
                    disabled={isVerifying}
                    className="w-full max-w-[280px] py-3.5 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2"
                    style={{
                      background: forceFailure ? '#EF4444' : '#31A050',
                      color: '#fff',
                    }}
                  >
                    {forceFailure ? 'Simulate Failure' : `Pay ETB ${effectiveAmount.toFixed(2)}`}
                  </button>
                </div>
              )}

              {/* ====== INTERNATIONAL PAYMENTS TAB ====== */}
              {activeCategory === 'international' && (
                <div className="flex flex-col items-center justify-center flex-1 text-center gap-4 animate-fade-in py-8">
                  <Globe className="w-10 h-10" style={{ color: '#5C8374' }} />
                  <div>
                    <p className="font-bold text-sm" style={{ color: '#E0E0E0' }}>
                      International Payments
                    </p>
                    <p className="text-xs mt-1" style={{ color: '#8B9DAF' }}>
                      Pay with Visa, Mastercard, or international wallets.
                    </p>
                  </div>
                  <button
                    onClick={handlePay}
                    disabled={isVerifying}
                    className="w-full max-w-[280px] py-3.5 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2"
                    style={{
                      background: forceFailure ? '#EF4444' : '#31A050',
                      color: '#fff',
                    }}
                  >
                    {forceFailure ? 'Simulate Failure' : `Pay ETB ${effectiveAmount.toFixed(2)}`}
                  </button>
                </div>
              )}
            </div>

            {/* Real Chapa Link (if available) */}
            {activeOrder?.chapaCheckoutUrl && (
              <a
                href={activeOrder.chapaCheckoutUrl}
                className="mt-4 w-full py-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all"
                style={{
                  background: 'rgba(49, 160, 80, 0.1)',
                  color: '#31A050',
                  border: '1px solid rgba(49,160,80,0.25)',
                }}
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Open Official Chapa Portal
              </a>
            )}
          </div>
        </div>

        {/* Developer Console Toggle */}
        <div
          className="px-5 py-2 flex items-center justify-between"
          style={{
            background: '#0A1018',
            borderTop: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <div className="flex items-center gap-2">
            <Lock className="w-3 h-3" style={{ color: '#31A050' }} />
            <span className="text-[11px] font-medium" style={{ color: '#5C7080' }}>
              Secured By Chapa
            </span>
          </div>
          <button
            onClick={() => setShowDevConsole(!showDevConsole)}
            className="text-[10px] font-mono px-2 py-0.5 rounded transition-all"
            style={{
              color: showDevConsole ? '#31A050' : '#4A5568',
              background: showDevConsole ? 'rgba(49,160,80,0.1)' : 'transparent',
            }}
          >
            {showDevConsole ? '▼ DEV' : '▶ DEV'}
          </button>
        </div>

        {/* Developer Console Panel */}
        {showDevConsole && (
          <div
            className="px-5 py-3 flex items-center gap-4"
            style={{
              background: '#080E15',
              borderTop: '1px solid rgba(255,255,255,0.04)',
            }}
          >
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="chapa-force-failure"
                checked={forceFailure}
                onChange={(e) => setForceFailure(e.target.checked)}
                className="rounded w-3.5 h-3.5"
                style={{ accentColor: '#EF4444' }}
              />
              <label htmlFor="chapa-force-failure" className="text-[11px] font-medium cursor-pointer select-none" style={{ color: forceFailure ? '#EF4444' : '#8B9DAF' }}>
                Force payment failure
              </label>
            </div>
            <div className="text-[10px] font-mono" style={{ color: '#4A5568' }}>
              TX: {effectiveTxRef.slice(0, 16)}...
            </div>
            <div className="text-[10px] font-mono" style={{ color: '#4A5568' }}>
              AMT: {effectiveAmount.toFixed(2)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
