import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Search,
  ShoppingCart,
  Heart,
  ListOrdered,
  User,
  LogOut,
  ChevronDown,
  PackageCheck,
  Menu,
  X,
  ShieldCheck,
  Sun,
  Moon,
} from 'lucide-react';
import { Logo } from '../common/Logo';
import { BRAND } from '../../constants/brand';
import { CategoryId } from '../../types';
import { orderBelongsToCustomer } from '../../utils/orderUtils';

interface HeaderProps {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedCategory: CategoryId | 'all';
  setSelectedCategory: (cat: CategoryId | 'all') => void;
  onOpenCart: () => void;
  onOpenFavorites: () => void;
  onOpenShoppingLists: () => void;
  onOpenOrderHistory: () => void;
  onOpenCustomerDashboard: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory,
  onOpenCart,
  onOpenFavorites,
  onOpenShoppingLists,
  onOpenOrderHistory,
  onOpenCustomerDashboard,
}) => {
  const {
    userRole,
    currentUser,
    cart,
    favorites,
    shoppingLists,
    orders,
    logoutUser,
    setAuthModalOpen,
    categories,
    adminSession,
    setViewTab,
    theme,
    toggleTheme,
  } = useApp();

  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const isAuthenticated = Boolean(currentUser?.isLoggedIn && currentUser?.id && userRole !== 'guest');
  const myOrders = isAuthenticated ? orders.filter((o) => orderBelongsToCustomer(o, currentUser)) : [];
  const activeOrdersCount = myOrders.filter(
    (o) => o.orderStatus !== 'completed' && o.orderStatus !== 'cancelled'
  ).length;

  // Close user dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile menu on resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) setMobileMenuOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-sm sticky top-0 z-40 transition-colors duration-200">
      {/* Main Header Row */}
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
        {/* Brand */}
        <div className="flex items-center gap-2.5 shrink-0">
          <Logo size="md" />
          <div className="hidden sm:block">
            <h1 className="text-base font-bold text-slate-900 dark:text-slate-100 tracking-tight leading-tight">
              {BRAND.name}
            </h1>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Bethel, Addis Ababa</p>
          </div>
        </div>

        {/* Search Bar — hidden on very small, visible md+ */}
        <div className="hidden md:flex flex-1 max-w-xl items-center bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 focus-within:border-emerald-600 dark:focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-600/20 transition-all mx-3">
          <select
            value={selectedCategory}
            onChange={(e) => {
              const cat = e.target.value as CategoryId | 'all';
              setSelectedCategory(cat);
              const catalogGrid = document.getElementById('catalog-grid');
              if (catalogGrid) {
                catalogGrid.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }
            }}
            className="bg-transparent text-slate-700 dark:text-slate-200 font-medium text-xs px-3 py-2 border-r border-slate-200 dark:border-slate-700 focus:outline-none max-w-[130px] shrink-0 dark:bg-slate-800"
          >
            <option value="all" className="dark:bg-slate-800 dark:text-slate-100">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id} className="dark:bg-slate-800 dark:text-slate-100">{c.name}</option>
            ))}
          </select>
          <div className="relative flex-1 flex items-center">
            <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 pointer-events-none" />
            <input
              type="text"
              placeholder="Search products, brands..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-transparent text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="pr-3 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 text-xs font-bold"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Right: Desktop Actions + Mobile Buttons */}
        <div className="flex items-center gap-2">
          {/* Theme Toggle Button (Desktop) */}
          <button
            onClick={toggleTheme}
            className="p-2 text-slate-700 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label="Toggle Light / Dark mode"
          >
            {theme === 'dark' ? (
              <Sun className="w-5 h-5 text-amber-400 hover:scale-110 transition-transform" />
            ) : (
              <Moon className="w-5 h-5 text-slate-700 hover:text-amber-600 hover:scale-110 transition-transform" />
            )}
          </button>

          {/* Desktop-only action buttons */}
          <div className="hidden md:flex items-center gap-2">
            <button
              onClick={onOpenFavorites}
              className="p-2 text-slate-700 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-slate-800 rounded-lg relative transition-colors"
              title="Favorites"
            >
              <Heart className="w-5 h-5" />
              {favorites.length > 0 && (
                <span className="absolute top-1 right-1 bg-amber-500 text-slate-900 text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {favorites.length}
                </span>
              )}
            </button>

            <button
              onClick={onOpenShoppingLists}
              className="p-2 text-slate-700 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-slate-800 rounded-lg relative transition-colors"
              title="Shopping Lists"
            >
              <ListOrdered className="w-5 h-5" />
              {shoppingLists.length > 0 && (
                <span className="absolute top-1 right-1 bg-emerald-600 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {shoppingLists.length}
                </span>
              )}
            </button>

            <button
              onClick={onOpenOrderHistory}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-emerald-700 dark:hover:text-emerald-400 bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors"
            >
              <PackageCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Orders</span>
              {isAuthenticated && activeOrdersCount > 0 && (
                <span className="bg-emerald-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">
                  {activeOrdersCount}
                </span>
              )}
            </button>

            <button
              onClick={onOpenCart}
              className="flex items-center gap-2 px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-semibold text-xs shadow-sm transition-colors cursor-pointer"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>Cart</span>
              {totalCartCount > 0 && (
                <span className="bg-white text-emerald-800 text-xs font-bold px-2 py-0.5 rounded-full leading-none">
                  {totalCartCount}
                </span>
              )}
            </button>

            {userRole === 'guest' ? (
              <button
                onClick={() => setAuthModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 dark:bg-emerald-600 text-white text-xs font-semibold rounded-lg hover:bg-slate-800 dark:hover:bg-emerald-500 transition-colors cursor-pointer"
              >
                <User className="w-4 h-4" />
                <span>Login</span>
              </button>
            ) : (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg font-medium text-xs border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                >
                  {currentUser?.avatar ? (
                    <img
                      src={currentUser.avatar}
                      alt={currentUser.name}
                      className="w-5 h-5 rounded-full object-cover border border-emerald-600 shrink-0 bg-emerald-50"
                    />
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                      {currentUser?.name.charAt(0)}
                    </div>
                  )}
                  <span className="max-w-[80px] truncate">{currentUser?.name}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 shrink-0" />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-52 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 py-1 z-50">
                    <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-700 flex items-center gap-2.5">
                      {currentUser?.avatar ? (
                        <img
                          src={currentUser.avatar}
                          alt={currentUser.name}
                          className="w-8 h-8 rounded-full object-cover border border-emerald-600 shrink-0 bg-emerald-50"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center shrink-0">
                          {currentUser?.name.charAt(0)}
                        </div>
                      )}
                      <div className="overflow-hidden">
                        <p className="font-semibold text-xs text-slate-900 dark:text-slate-100 truncate">{currentUser?.name}</p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{currentUser?.email || currentUser?.phoneNumber}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => { setUserMenuOpen(false); onOpenCustomerDashboard(); }}
                      className="w-full text-left px-3 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2 transition-colors"
                    >
                      <User className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      Settings & Profile
                    </button>
                    <button
                      onClick={() => { setUserMenuOpen(false); onOpenOrderHistory(); }}
                      className="w-full text-left px-3 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2 transition-colors"
                    >
                      <PackageCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      My Order History
                    </button>
                    <button
                      onClick={() => { setUserMenuOpen(false); onOpenFavorites(); }}
                      className="w-full text-left px-3 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2 transition-colors"
                    >
                      <Heart className="w-4 h-4 text-amber-500" />
                      Saved Favorites
                    </button>

                    {(userRole === 'admin' || (adminSession.isLoggedIn && adminSession.is2FAVerified)) && (
                      <button
                        onClick={() => { setUserMenuOpen(false); setViewTab('admin_dashboard'); }}
                        className="w-full text-left px-3 py-2 text-xs text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100/80 dark:hover:bg-amber-900/50 flex items-center gap-2 font-bold transition-colors border-t border-b border-amber-200/60 dark:border-amber-800/60"
                      >
                        <ShieldCheck className="w-4 h-4 text-amber-700 dark:text-amber-400" />
                        Admin Dashboard
                      </button>
                    )}

                    <button
                      onClick={() => { setUserMenuOpen(false); logoutUser(); }}
                      className="w-full text-left px-3 py-2 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2 font-medium border-t border-slate-100 dark:border-slate-700 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Log Out
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Mobile: cart + hamburger */}
          <div className="flex items-center gap-2 md:hidden">
            <button
              onClick={onOpenCart}
              className="relative p-2 text-slate-700 dark:text-slate-200 hover:text-emerald-700 bg-slate-100 dark:bg-slate-800 rounded-lg transition-colors"
            >
              <ShoppingCart className="w-5 h-5" />
              {totalCartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-emerald-600 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {totalCartCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-700 dark:text-slate-200 hover:text-emerald-700 bg-slate-100 dark:bg-slate-800 rounded-lg transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Search Bar */}
      <div className="md:hidden px-4 pb-3">
        <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-600/20 transition-all">
          <Search className="w-4 h-4 text-slate-400 ml-3 pointer-events-none shrink-0" />
          <input
            type="text"
            placeholder="Search products, brands..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 pl-2 pr-3 py-2.5 text-sm bg-transparent text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="pr-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 text-xs font-bold">
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-lg transition-colors">
          <nav className="px-4 py-3 space-y-1">
            <div className="flex items-center justify-between px-3 py-2.5 bg-slate-50 dark:bg-slate-800/80 rounded-xl mb-2">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                {theme === 'dark' ? <Moon className="w-4 h-4 text-amber-400" /> : <Sun className="w-4 h-4 text-amber-600" />}
                Theme: <strong className="capitalize">{theme} Mode</strong>
              </span>
              <button
                onClick={toggleTheme}
                className="text-xs font-bold px-3 py-1 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-lg border border-slate-200 dark:border-slate-600 shadow-sm"
              >
                Toggle
              </button>
            </div>

            <button
              onClick={() => { setMobileMenuOpen(false); onOpenCustomerDashboard(); }}
              className="w-full flex items-center gap-3 px-3 py-3 text-sm text-slate-700 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-slate-800 hover:text-emerald-700 dark:hover:text-emerald-400 rounded-xl transition-colors"
            >
              <User className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <span className="font-semibold">Settings</span>
            </button>

            <button
              onClick={() => { setMobileMenuOpen(false); onOpenOrderHistory(); }}
              className="w-full flex items-center gap-3 px-3 py-3 text-sm text-slate-700 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-slate-800 hover:text-emerald-700 dark:hover:text-emerald-400 rounded-xl transition-colors"
            >
              <PackageCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <span className="font-semibold">Order History</span>
              {isAuthenticated && activeOrdersCount > 0 && (
                <span className="ml-auto bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {activeOrdersCount}
                </span>
              )}
            </button>

            <button
              onClick={() => { setMobileMenuOpen(false); onOpenFavorites(); }}
              className="w-full flex items-center gap-3 px-3 py-3 text-sm text-slate-700 dark:text-slate-200 hover:bg-amber-50 dark:hover:bg-slate-800 hover:text-amber-700 dark:hover:text-amber-400 rounded-xl transition-colors"
            >
              <Heart className="w-5 h-5 text-amber-500" />
              <span className="font-semibold">Saved Favorites</span>
              {favorites.length > 0 && (
                <span className="ml-auto bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {favorites.length}
                </span>
              )}
            </button>

            <button
              onClick={() => { setMobileMenuOpen(false); onOpenShoppingLists(); }}
              className="w-full flex items-center gap-3 px-3 py-3 text-sm text-slate-700 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-slate-800 hover:text-emerald-700 dark:hover:text-emerald-400 rounded-xl transition-colors"
            >
              <ListOrdered className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <span className="font-semibold">Shopping Lists</span>
            </button>

            <div className="border-t border-slate-100 dark:border-slate-800 pt-2">
              {userRole === 'guest' ? (
                <button
                  onClick={() => { setMobileMenuOpen(false); setAuthModalOpen(true); }}
                  className="w-full flex items-center gap-3 px-3 py-3 text-sm font-bold text-white bg-slate-900 dark:bg-emerald-600 hover:bg-slate-800 dark:hover:bg-emerald-500 rounded-xl transition-colors"
                >
                  <User className="w-5 h-5" />
                  Login / Register
                </button>
              ) : (
                <>
                  <div className="px-3 py-2 text-xs text-slate-500 dark:text-slate-400">
                    Signed in as <strong className="text-slate-800 dark:text-slate-200">{currentUser?.name}</strong>
                  </div>

                  {(userRole === 'admin' || (adminSession.isLoggedIn && adminSession.is2FAVerified)) && (
                    <button
                      onClick={() => { setMobileMenuOpen(false); setViewTab('admin_dashboard'); }}
                      className="w-full flex items-center gap-3 px-3 py-3 text-sm font-bold text-amber-900 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/60 rounded-xl transition-colors mb-1 border border-amber-200 dark:border-amber-800/60"
                    >
                      <ShieldCheck className="w-5 h-5 text-amber-700 dark:text-amber-400" />
                      Admin Dashboard
                    </button>
                  )}

                  <button
                    onClick={() => { setMobileMenuOpen(false); logoutUser(); }}
                    className="w-full flex items-center gap-3 px-3 py-3 text-sm text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors font-medium"
                  >
                    <LogOut className="w-5 h-5" />
                    Log Out
                  </button>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};
