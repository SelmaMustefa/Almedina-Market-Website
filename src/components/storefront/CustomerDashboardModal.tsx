import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Product } from '../../types';
import { formatETB } from '../../utils/distance';
import {
  X,
  Settings as SettingsIcon,
  Check,
  Loader2,
  Heart,
  ShoppingCart,
  Trash2,
  PackageOpen,
  ArrowRight,
  TriangleAlert as AlertTriangle,
  User,
} from 'lucide-react';

interface CustomerDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'settings' | 'saved';
  onSelectProduct?: (product: Product) => void;
}

const AVATAR_OPTIONS = [
  // Vibrant Character Avatars
  'https://api.dicebear.com/9.x/micah/svg?seed=Selma&backgroundColor=10b981',
  'https://api.dicebear.com/9.x/micah/svg?seed=Leo&backgroundColor=3b82f6',
  'https://api.dicebear.com/9.x/micah/svg?seed=Sara&backgroundColor=8b5cf6',
  'https://api.dicebear.com/9.x/micah/svg?seed=Omar&backgroundColor=ec4899',
  'https://api.dicebear.com/9.x/micah/svg?seed=Lily&backgroundColor=f97316',
  'https://api.dicebear.com/9.x/micah/svg?seed=Khalid&backgroundColor=06b6d4',

  // Fun Color Emojis
  'https://api.dicebear.com/9.x/fun-emoji/svg?seed=Happy&backgroundColor=059669',
  'https://api.dicebear.com/9.x/fun-emoji/svg?seed=Smile&backgroundColor=0284c7',
  'https://api.dicebear.com/9.x/fun-emoji/svg?seed=Cool&backgroundColor=7c3aed',
  'https://api.dicebear.com/9.x/fun-emoji/svg?seed=Star&backgroundColor=db2777',
  'https://api.dicebear.com/9.x/fun-emoji/svg?seed=Joy&backgroundColor=ea580c',
  'https://api.dicebear.com/9.x/fun-emoji/svg?seed=Zen&backgroundColor=0d9488',

  // Colorful Geometric & Bottts Badges
  'https://api.dicebear.com/9.x/shapes/svg?seed=Emerald&backgroundColor=047857',
  'https://api.dicebear.com/9.x/shapes/svg?seed=Sapphire&backgroundColor=0284c7',
  'https://api.dicebear.com/9.x/shapes/svg?seed=Amethyst&backgroundColor=7c3aed',
  'https://api.dicebear.com/9.x/shapes/svg?seed=Ruby&backgroundColor=e11d48',
  'https://api.dicebear.com/9.x/bottts/svg?seed=Neon&backgroundColor=059669',
  'https://api.dicebear.com/9.x/bottts/svg?seed=Cyber&backgroundColor=4f46e5',
];

export const CustomerDashboardModal: React.FC<CustomerDashboardModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'saved',
  onSelectProduct,
}) => {
  const { currentUser, updateAccountSettings, favorites, toggleFavorite, products, addToCart, cart } = useApp();
  const [activeTab, setActiveTab] = useState<'settings' | 'saved'>(initialTab);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(AVATAR_OPTIONS[0]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setPhoneNumber(currentUser?.phoneNumber || '');
      setSelectedAvatar(currentUser?.avatar || AVATAR_OPTIONS[0]);
      setActiveTab(initialTab);
    }
  }, [isOpen, currentUser, initialTab]);

  const savedProducts = useMemo(() => {
    return products.filter((p) => favorites.includes(p.id));
  }, [products, favorites]);

  if (!isOpen) return null;

  const handleSaveSettings = async () => {
    setIsSaving(true);
    await updateAccountSettings({ phoneNumber: phoneNumber.trim(), avatar: selectedAvatar });
    setIsSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-fade-in flex flex-col my-auto max-h-[calc(100dvh-2rem)]">
        {/* Header */}
        <div className="p-4 bg-emerald-950 text-white flex items-center justify-between border-b border-emerald-800 shrink-0">
          <div className="flex items-center gap-3">
            {currentUser?.avatar ? (
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-9 h-9 rounded-full object-cover border-2 border-emerald-400 bg-emerald-900"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-emerald-700 flex items-center justify-center font-bold text-sm text-white">
                {currentUser?.name?.charAt(0) || <User className="w-5 h-5" />}
              </div>
            )}
            <div>
              <h2 className="font-bold text-base leading-tight">{currentUser?.name || 'My Account'}</h2>
              <p className="text-xs text-emerald-300">{currentUser?.email || currentUser?.phoneNumber || 'Customer Portal'}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-emerald-900/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-4 pt-2 gap-2 shrink-0">
          <button
            onClick={() => setActiveTab('saved')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'saved'
                ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400 bg-white dark:bg-slate-900 rounded-t-xl shadow-xs'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Heart className="w-4 h-4 text-amber-500 fill-amber-500" />
            <span>Saved Products</span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ${
                activeTab === 'saved'
                  ? 'bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300'
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              {savedProducts.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'settings'
                ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400 bg-white dark:bg-slate-900 rounded-t-xl shadow-xs'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <SettingsIcon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Profile & Settings</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1 bg-white dark:bg-slate-900">
          {/* TAB 1: SAVED PRODUCTS */}
          {activeTab === 'saved' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Bookmarked Products</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Items you saved are synced to your account across all browser sessions.
                  </p>
                </div>
                {savedProducts.length > 0 && (
                  <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800/60">
                    {savedProducts.length} Item{savedProducts.length !== 1 ? 's' : ''}
                  </span>
                )}
              </div>

              {savedProducts.length === 0 ? (
                <div className="py-12 px-4 text-center space-y-3 bg-slate-50 dark:bg-slate-850 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                  <div className="w-14 h-14 rounded-full bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto shadow-xs">
                    <Heart className="w-7 h-7" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">No saved products yet</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                      Click the heart icon on any product in the store to save it here for fast access anytime.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      onClose();
                      document.getElementById('catalog-grid')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-sm transition-colors cursor-pointer"
                  >
                    <span>Browse Products</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {savedProducts.map((product) => {
                    const isOutOfStock = !product.isAvailable || product.stockCount <= 0;
                    const isLowStock = product.stockCount > 0 && product.stockCount <= product.lowStockThreshold;
                    const cartItem = cart.find((c) => c.product.id === product.id);
                    const inCartCount = cartItem?.quantity || 0;

                    return (
                      <div
                        key={product.id}
                        className="bg-slate-50 dark:bg-slate-850 p-3 rounded-xl border border-slate-200 dark:border-slate-750 flex flex-col justify-between gap-3 group hover:border-emerald-400 dark:hover:border-emerald-600 transition-all shadow-xs"
                      >
                        <div className="flex gap-3">
                          <div
                            onClick={() => {
                              if (onSelectProduct) {
                                onClose();
                                onSelectProduct(product);
                              }
                            }}
                            className="relative w-16 h-16 sm:w-20 sm:h-20 bg-white dark:bg-slate-800 rounded-lg overflow-hidden shrink-0 cursor-pointer border border-slate-200 dark:border-slate-700"
                          >
                            <img
                              src={product.image}
                              alt={product.name}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                            {isOutOfStock && (
                              <div className="absolute inset-0 bg-slate-900/60 flex items-center justify-center text-[9px] font-bold text-white">
                                Out
                              </div>
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <h4
                              onClick={() => {
                                if (onSelectProduct) {
                                  onClose();
                                  onSelectProduct(product);
                                }
                              }}
                              className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100 line-clamp-1 cursor-pointer hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors"
                            >
                              {product.name}
                            </h4>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{product.origin} • {product.unit}</p>
                            <div className="mt-1 flex items-center justify-between gap-1">
                              <span className="font-extrabold text-xs sm:text-sm text-emerald-800 dark:text-emerald-400">
                                {formatETB(product.priceETB)}
                              </span>
                              {isLowStock && (
                                <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-0.5">
                                  <AlertTriangle className="w-3 h-3" /> Low
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 pt-2 border-t border-slate-200/80 dark:border-slate-800">
                          <button
                            disabled={isOutOfStock}
                            onClick={() => addToCart(product, 1)}
                            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs ${
                              isOutOfStock
                                ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                                : inCartCount > 0
                                ? 'bg-emerald-800 dark:bg-emerald-700 text-white'
                                : 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer'
                            }`}
                          >
                            {inCartCount > 0 ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-300" />
                                <span>In Cart ({inCartCount})</span>
                              </>
                            ) : (
                              <>
                                <ShoppingCart className="w-3.5 h-3.5" />
                                <span>Add to Cart</span>
                              </>
                            )}
                          </button>

                          <button
                            onClick={() => toggleFavorite(product.id)}
                            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer shrink-0"
                            title="Remove from saved"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: PROFILE & SETTINGS */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              {/* Avatar selection */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <img
                    src={selectedAvatar}
                    alt="Your avatar"
                    className="w-16 h-16 rounded-full border-2 border-emerald-600 bg-emerald-50 object-cover"
                  />
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{currentUser?.name || 'Shopper'}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Choose your favorite avatar profile icon</p>
                  </div>
                </div>

                <div className="grid grid-cols-6 gap-2">
                  {AVATAR_OPTIONS.map((avatar) => (
                    <button
                      key={avatar}
                      type="button"
                      onClick={() => setSelectedAvatar(avatar)}
                      className={`relative rounded-full overflow-hidden border-2 transition-all cursor-pointer ${
                        selectedAvatar === avatar
                          ? 'border-emerald-600 ring-2 ring-emerald-300'
                          : 'border-slate-200 dark:border-slate-700 hover:border-emerald-400'
                      }`}
                    >
                      <img src={avatar} alt="avatar option" className="w-full aspect-square object-cover bg-emerald-50" />
                      {selectedAvatar === avatar && (
                        <span className="absolute inset-0 flex items-center justify-center bg-emerald-600/30">
                          <Check className="w-4 h-4 text-white drop-shadow" />
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Phone number */}
              <div className="space-y-2">
                <label className="block text-sm font-bold text-slate-800 dark:text-slate-200">Phone Number (ET)</label>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-sm font-bold text-slate-600 dark:text-slate-300 shrink-0">
                    +251
                  </span>
                  <input
                    type="tel"
                    value={phoneNumber.replace(/^\+251/, '')}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/[^0-9]/g, '').slice(0, 10);
                      setPhoneNumber(digits ? `+251${digits}` : '');
                    }}
                    placeholder="911223344"
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-slate-900 dark:text-slate-100 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Enter your Ethiopian phone number without the country code.</p>
              </div>

              <button
                onClick={handleSaveSettings}
                disabled={isSaving}
                className="w-full bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white rounded-xl py-3 font-bold transition-colors shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Saving Changes...</span>
                  </>
                ) : (
                  <span>Save Settings</span>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
