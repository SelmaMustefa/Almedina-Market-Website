import React, { useState, useMemo, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { ToastContainer } from './components/common/ToastContainer';

// Storefront
import { Header } from './components/storefront/Header';
import { CategoryBar } from './components/storefront/CategoryBar';
import { HeroBanner } from './components/storefront/HeroBanner';
import { ProductCard } from './components/storefront/ProductCard';
import { ProductDetailModal } from './components/storefront/ProductDetailModal';
import { CartDrawer } from './components/storefront/CartDrawer';
import { CheckoutModal } from './components/storefront/CheckoutModal';
import { OrderTrackingModal } from './components/storefront/OrderTrackingModal';
import { ReturnReportModal } from './components/storefront/ReturnReportModal';
import { ReviewSubmissionModal } from './components/storefront/ReviewSubmissionModal';
import { AuthModal } from './components/storefront/AuthModal';
import { ChapaPaymentSimulator } from './components/storefront/ChapaPaymentSimulator';
import { ChapaVerificationModal } from './components/storefront/ChapaVerificationModal';
import { CustomerDashboardModal } from './components/storefront/CustomerDashboardModal';
import { EmailFormModal } from './components/storefront/EmailFormModal';
import { CustomerReviewsSection } from './components/storefront/CustomerReviewsSection';

// Admin
import { AdminLoginPage } from './components/admin/AdminLoginPage';
import { AdminSidebar, AdminTab } from './components/admin/AdminSidebar';
import { AdminOverview } from './components/admin/AdminOverview';
import { AdminOrderManager } from './components/admin/AdminOrderManager';
import { AdminPaymentManager } from './components/admin/AdminPaymentManager';
import { AdminProductManager } from './components/admin/AdminProductManager';
import { AdminReviewModerator } from './components/admin/AdminReviewModerator';
import { AdminReturnsManager } from './components/admin/AdminReturnsManager';
import { AdminFAQContactManager } from './components/admin/AdminFAQContactManager';
import { AdminReportsManager } from './components/admin/AdminReportsManager';

import { Logo } from './components/common/Logo';
import { BRAND } from './constants/brand';
import { formatETB } from './utils/distance';
import { CategoryId, Product, Order } from './types';
import { X, Circle as HelpCircle, Info, Mail, Send, Phone, MapPin, Heart, ListOrdered, Plus, Trash2, Pencil, Check, Minus } from 'lucide-react';

// ─── Simple hash-based "router" ──────────────────────────────────────────────
// Supports: '' | '/' → storefront, '#/admin' or '#/admin/login' → admin login
function useHashRoute(): string {
  const [hash, setHash] = useState(() => window.location.hash);
  useEffect(() => {
    const handler = () => setHash(window.location.hash);
    window.addEventListener('hashchange', handler);
    return () => window.removeEventListener('hashchange', handler);
  }, []);
  return hash;
}

// ─── Protected Admin Shell ───────────────────────────────────────────────────
const AdminShell: React.FC = () => {
  const { adminSession, setViewTab, simulateAdminLoginOnOtherDevice, logoutAdmin } = useApp();
  const [adminTab, setAdminTab] = useState<AdminTab>('overview');

  // Not fully authenticated → show the login page
  if (!adminSession.isLoggedIn || !adminSession.is2FAVerified) {
    return <AdminLoginPage />;
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#FAF8F0] dark:bg-slate-950">
      <AdminSidebar activeTab={adminTab} setActiveTab={setAdminTab} />
      <div className="flex-1 p-4 md:p-8 overflow-y-auto">
        {adminTab === 'overview' && <AdminOverview onNavigate={(tab) => setAdminTab(tab)} />}
        {adminTab === 'orders' && <AdminOrderManager />}
        {adminTab === 'payments' && <AdminPaymentManager />}
        {adminTab === 'products' && <AdminProductManager initialView="products" />}
        {adminTab === 'categories' && <AdminProductManager initialView="categories" />}
        {adminTab === 'reviews' && <AdminReviewModerator />}
        {adminTab === 'returns' && <AdminReturnsManager />}
        {adminTab === 'contacts' && <AdminFAQContactManager />}
        {adminTab === 'reports' && <AdminReportsManager />}
        {adminTab === 'faqs' && <AdminFAQContactManager />}
      </div>
    </div>
  );
};

// ─── Main Storefront Content ─────────────────────────────────────────────────
const StorefrontContent: React.FC = () => {
  const {
    products,
    categories,
    selectedProductModal,
    setSelectedProductModal,
    favorites,
    shoppingLists,
    createShoppingList,
    deleteShoppingList,
    renameShoppingList,
    updateShoppingListItemQty,
    removeShoppingListItem,
    faqs,
    submitContactForm,
    authModalOpen,
    setAuthModalOpen,
    authRedirectMessage,
    setAuthRedirectMessage,
    userRole,
    setViewTab,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryId | 'all'>('all');

  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [orderTrackingOpen, setOrderTrackingOpen] = useState(false);
  const [highlightOrderId, setHighlightOrderId] = useState<string | null>(null);
  const [favoritesOpen, setFavoritesOpen] = useState(false);
  const [shoppingListsOpen, setShoppingListsOpen] = useState(false);
  const [customerDashboardOpen, setCustomerDashboardOpen] = useState(false);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [emailModalSubject, setEmailModalSubject] = useState('');
  const [emailModalMessage, setEmailModalMessage] = useState('');
  const [pageModal, setPageModal] = useState<'faq' | 'about' | 'contact' | null>(null);

  const [returnModalOpen, setReturnModalOpen] = useState(false);
  const [returnOrder, setReturnOrder] = useState<Order | null>(null);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewProduct, setReviewProduct] = useState<Product | null>(null);
  const [reviewOrder, setReviewOrder] = useState<Order | null>(null);
  const [newListName, setNewListName] = useState('');
  const [editingListId, setEditingListId] = useState<string | null>(null);
  const [editListName, setEditListName] = useState('');

  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [contactFormName, setContactFormName] = useState('');
  const [contactFormEmail, setContactFormEmail] = useState('');
  const [contactFormSubject, setContactFormSubject] = useState('');
  const [contactFormMessage, setContactFormMessage] = useState('');
  const [contactFormStatus, setContactFormStatus] = useState<string | null>(null);
  const [contactSubmittedSuccessfully, setContactSubmittedSuccessfully] = useState(false);
  const [contactSubmittedInfo, setContactSubmittedInfo] = useState<{ name: string; email: string } | null>(null);

  const filteredProducts = useMemo(() => {
    const rawQuery = searchQuery.trim().toLowerCase();

    return products
      .filter((p) => {
        // 1. Category Filter
        if (selectedCategory !== 'all' && p.categoryId !== selectedCategory) {
          return false;
        }

        // If no search query, include all in category
        if (!rawQuery) {
          return true;
        }

        // 2. Build rich searchable fields corpus
        const categoryObj = categories.find((c) => c.id === p.categoryId);
        const categoryName = categoryObj ? categoryObj.name.toLowerCase() : '';
        const categoryArabic = categoryObj?.arabicName ? categoryObj.arabicName.toLowerCase() : '';
        const categoryDesc = categoryObj ? categoryObj.description.toLowerCase() : '';

        const nameLower = p.name.toLowerCase();
        const arabicLower = (p.arabicName || '').toLowerCase();
        const originLower = (p.origin || '').toLowerCase();
        const descLower = (p.description || '').toLowerCase();
        const unitLower = (p.unit || '').toLowerCase();
        const importedTag = p.isImported ? 'imported premium' : 'local fresh';

        const searchableCorpus = `${nameLower} ${arabicLower} ${categoryName} ${categoryArabic} ${categoryDesc} ${originLower} ${descLower} ${unitLower} ${importedTag}`;

        // 3. Multi-word and Substring Tokens Matching
        const queryTokens = rawQuery.split(/\s+/).filter(Boolean);

        // Every token typed should match in the product's attributes or fuzzy sequence
        const allTokensMatch = queryTokens.every((token) => {
          // Direct substring match in corpus
          if (searchableCorpus.includes(token)) {
            return true;
          }

          // Fuzzy sequence match for slight typo / relative typing (e.g. "ajwa" in "Saudi Ajwa Premium")
          if (token.length >= 3) {
            let tokenIdx = 0;
            for (let i = 0; i < nameLower.length && tokenIdx < token.length; i++) {
              if (nameLower[i] === token[tokenIdx]) {
                tokenIdx++;
              }
            }
            if (tokenIdx === token.length) {
              return true;
            }
          }

          return false;
        });

        return allTokensMatch;
      })
      .sort((a, b) => {
        if (!rawQuery) return 0;
        const aName = a.name.toLowerCase();
        const bName = b.name.toLowerCase();

        // Exact name match priority
        const aExact = aName === rawQuery;
        const bExact = bName === rawQuery;
        if (aExact && !bExact) return -1;
        if (!aExact && bExact) return 1;

        // Name starts with query
        const aStarts = aName.startsWith(rawQuery);
        const bStarts = bName.startsWith(rawQuery);
        if (aStarts && !bStarts) return -1;
        if (!aStarts && bStarts) return 1;

        // Name includes query substring
        const aIncludes = aName.includes(rawQuery);
        const bIncludes = bName.includes(rawQuery);
        if (aIncludes && !bIncludes) return -1;
        if (!aIncludes && bIncludes) return 1;

        return 0;
      });
  }, [products, categories, selectedCategory, searchQuery]);

  const favoriteProducts = useMemo(() => products.filter((p) => favorites.includes(p.id)), [products, favorites]);

  const handleContactSectionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactFormName.trim() || !contactFormEmail.trim() || !contactFormSubject.trim() || !contactFormMessage.trim()) {
      setContactFormStatus('Please fill in all required fields before sending.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactFormEmail)) {
      setContactFormStatus('Please enter a valid email address.');
      return;
    }

    const name = contactFormName.trim();
    const email = contactFormEmail.trim();
    const subject = contactFormSubject.trim();
    const message = contactFormMessage.trim();

    submitContactForm(name, email, message, subject);

    setContactSubmittedInfo({ name, email });
    setContactSubmittedSuccessfully(true);
    setContactFormName('');
    setContactFormEmail('');
    setContactFormSubject('');
    setContactFormMessage('');
    setContactFormStatus(null);
  };

  return (
    <div className="flex-1 flex flex-col">
      <Header
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        onOpenCart={() => setCartOpen(true)}
        onOpenFavorites={() => setFavoritesOpen(true)}
        onOpenShoppingLists={() => setShoppingListsOpen(true)}
        onOpenOrderHistory={() => setOrderTrackingOpen(true)}
        onOpenCustomerDashboard={() => setCustomerDashboardOpen(true)}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6 space-y-6">
        <HeroBanner
          onExploreProducts={() => document.getElementById('catalog-grid')?.scrollIntoView({ behavior: 'smooth' })}
          onOpenPageModal={(page) => setPageModal(page)}
        />
        <CategoryBar categories={categories} selectedCategory={selectedCategory} setSelectedCategory={setSelectedCategory} />

        <div id="catalog-grid" className="scroll-mt-24 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#1A1A1A]/10 dark:border-slate-800 pb-3">
            <div>
              <h2 className="text-xl font-bold font-serif text-[#1A1A1A] dark:text-slate-100">
                {selectedCategory === 'all' ? 'All Products' : categories.find((c) => c.id === selectedCategory)?.name || 'Products'}
              </h2>
              <p className="text-xs text-[#1A1A1A]/70 dark:text-slate-400">{filteredProducts.length} imported item{filteredProducts.length === 1 ? '' : 's'}</p>
            </div>
            {searchQuery && (
              <div className="text-xs bg-[#FAF8F0] dark:bg-slate-800 border border-[#1A1A1A]/20 dark:border-slate-700 px-3 py-1 rounded-full flex items-center gap-2 text-slate-900 dark:text-slate-100">
                <span>Search: "<strong>{searchQuery}</strong>"</span>
                <button onClick={() => setSearchQuery('')} className="text-rose-600 dark:text-rose-400 font-bold hover:underline">Reset</button>
              </div>
            )}
          </div>

          {filteredProducts.length === 0 ? (
            <div className="text-center py-16 bg-[#FAF8F0] dark:bg-slate-900 rounded-2xl p-8 space-y-3 border border-slate-200 dark:border-slate-800">
              <p className="text-lg font-serif font-bold text-[#1A1A1A] dark:text-slate-100">No matching products found</p>
              <button onClick={() => { setSearchQuery(''); setSelectedCategory('all'); }} className="px-4 py-2 bg-[#1A1A1A] dark:bg-emerald-600 text-[#FDFCF5] dark:text-white font-semibold text-xs rounded-xl hover:bg-[#333333] dark:hover:bg-emerald-500 transition-colors">
                View All Products
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} onSelect={() => setSelectedProductModal(product)} />
              ))}
            </div>
          )}
        </div>

        {/* Customer Reviews Section (Displays Last 3 Approved Reviews) */}
        <CustomerReviewsSection />

        <section id="about" className="scroll-mt-24 bg-gradient-to-br from-[#FAF8F0] via-white to-emerald-50/30 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800/40 border border-[#1A1A1A]/10 dark:border-slate-800 rounded-3xl p-6 sm:p-10 space-y-8 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-emerald-900/10 dark:border-slate-800 pb-6">
            <div className="space-y-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-xs font-bold uppercase tracking-wider">
                <Info className="w-3.5 h-3.5" />
                <span>Bethel's Trusted Market</span>
              </span>
              <h2 className="text-3xl font-bold font-serif text-[#1A1A1A] dark:text-slate-100">About {BRAND.name}</h2>
              <p className="text-sm text-[#1A1A1A]/70 dark:text-slate-400 max-w-2xl">
                Serving Bethel, Addis Ababa with authentic imported groceries, Saudi dates, daily staples, and express neighborhood delivery.
              </p>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-emerald-200/80 dark:border-slate-700 p-5 space-y-3 shadow-xs hover:shadow-md transition-all">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 flex items-center justify-center font-bold text-lg">
                🌴
              </div>
              <h3 className="font-bold text-base text-[#1A1A1A] dark:text-white">Specialty Imports</h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Authentic Saudi Arabia Ajwa dates, aromatic Arabic coffees, ghee, pure honeys, and rare spices sourced with uncompromising quality.
              </p>
            </div>

            <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-emerald-200/80 dark:border-slate-700 p-5 space-y-3 shadow-xs hover:shadow-md transition-all">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 flex items-center justify-center font-bold text-lg">
                📍
              </div>
              <h3 className="font-bold text-base text-[#1A1A1A] dark:text-white">Bethel Storefront</h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Visit our physical store on Bethel Main Road for free in-store pickups, warm Ethiopian hospitality, and personal assistance.
              </p>
            </div>

            <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-emerald-200/80 dark:border-slate-700 p-5 space-y-3 shadow-xs hover:shadow-md transition-all">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 flex items-center justify-center font-bold text-lg">
                🚚
              </div>
              <h3 className="font-bold text-base text-[#1A1A1A] dark:text-white">Precision GPS Delivery</h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Live distance auto-calculation within 6.0 km. Instant delivery straight to your residential or office gate in Addis Ababa.
              </p>
            </div>

            <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-emerald-200/80 dark:border-slate-700 p-5 space-y-3 shadow-xs hover:shadow-md transition-all">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 flex items-center justify-center font-bold text-lg">
                🛡️
              </div>
              <h3 className="font-bold text-base text-[#1A1A1A] dark:text-white">Same-Day Returns</h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Submit photo evidence on the same calendar day for instant return processing, product exchanges, or full refunds.
              </p>
            </div>
          </div>
        </section>

        <section id="contact" className="scroll-mt-24 bg-white dark:bg-slate-900 border border-[#1A1A1A]/10 dark:border-slate-800 rounded-2xl p-6 sm:p-8">
          <div className="mx-auto max-w-2xl space-y-5">
            <div className="text-center space-y-2">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-[#FAF8F0] dark:bg-slate-800 border border-[#1A1A1A]/10 dark:border-slate-700">
                <Mail className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />
              </div>
              <h2 className="text-xl font-bold font-serif text-[#1A1A1A] dark:text-slate-100">Contact Us</h2>
              <p className="text-sm text-[#1A1A1A]/70 dark:text-slate-400">Messages will be sent directly to <strong>{BRAND.email}</strong>.</p>
            </div>

            {contactSubmittedSuccessfully ? (
              <div className="rounded-2xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/70 dark:bg-emerald-950/40 p-6 sm:p-8 text-center space-y-4 animate-fade-in">
                <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 flex items-center justify-center mx-auto shadow-xs">
                  <Check className="w-6 h-6" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 font-serif">Message Delivered!</h3>
                  <p className="text-xs text-slate-700 dark:text-slate-300 max-w-md mx-auto leading-relaxed">
                    Thank you, <strong>{contactSubmittedInfo?.name || 'Valued Customer'}</strong>. Your message has been sent to the store management team. We will review and respond to <strong className="text-emerald-900 dark:text-emerald-400">{contactSubmittedInfo?.email}</strong> shortly.
                  </p>
                </div>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setContactSubmittedSuccessfully(false)}
                    className="px-5 py-2 text-xs font-semibold rounded-xl bg-white dark:bg-slate-800 border border-emerald-200 dark:border-emerald-700 text-emerald-900 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-slate-700 transition-colors"
                  >
                    Send Another Message
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleContactSectionSubmit} className="space-y-3 rounded-2xl border border-[#1A1A1A]/10 dark:border-slate-800 bg-[#FAF8F0] dark:bg-slate-850 p-4 sm:p-5">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-[#1A1A1A]/70 dark:text-slate-400">Name</label>
                    <input type="text" value={contactFormName} onChange={(e) => setContactFormName(e.target.value)} className="w-full rounded-xl border border-[#1A1A1A]/10 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2.5 text-sm text-[#1A1A1A] dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-600" placeholder="Your name" />
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-[#1A1A1A]/70 dark:text-slate-400">Email</label>
                    <input type="email" value={contactFormEmail} onChange={(e) => setContactFormEmail(e.target.value)} className="w-full rounded-xl border border-[#1A1A1A]/10 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2.5 text-sm text-[#1A1A1A] dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-600" placeholder="your@email.com" />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-[#1A1A1A]/70 dark:text-slate-400">Subject</label>
                  <input type="text" value={contactFormSubject} onChange={(e) => setContactFormSubject(e.target.value)} className="w-full rounded-xl border border-[#1A1A1A]/10 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2.5 text-sm text-[#1A1A1A] dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-600" placeholder="How can we help?" />
                </div>

                <div>
                  <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-[#1A1A1A]/70 dark:text-slate-400">Message</label>
                  <textarea rows={4} value={contactFormMessage} onChange={(e) => setContactFormMessage(e.target.value)} className="w-full rounded-xl border border-[#1A1A1A]/10 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2.5 text-sm text-[#1A1A1A] dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-600" placeholder="Tell us more about your request" />
                </div>

                {contactFormStatus && (
                  <p className={`text-xs ${contactFormStatus.includes('sent') ? 'text-emerald-700 dark:text-emerald-400 font-semibold' : 'text-rose-600 dark:text-rose-400'}`}>{contactFormStatus}</p>
                )}

                <button type="submit" className="w-full rounded-xl bg-[#1A1A1A] dark:bg-emerald-600 hover:bg-[#333333] dark:hover:bg-emerald-500 px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-[#FDFCF5] dark:text-white transition-colors flex items-center justify-center gap-2 min-h-[44px]">
                  <Send className="w-4 h-4" />
                  <span>Send Message</span>
                </button>
              </form>
            )}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="mt-12 bg-[#FAF8F0] dark:bg-slate-900 border-t border-[#1A1A1A]/10 dark:border-slate-800 text-xs py-10 px-4">
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Logo size="sm" />
              <span className="font-bold text-sm font-serif text-[#1A1A1A] dark:text-slate-100">{BRAND.name}</span>
            </div>
            <p className="text-[#1A1A1A]/70 dark:text-slate-400 text-[11px] leading-relaxed">Bethel's trusted source for premium imported specialty groceries.</p>
          </div>
          <div className="space-y-2">
            <h3 className="font-bold font-serif text-[#1A1A1A] dark:text-slate-100">Store Location</h3>
            <p className="text-[#1A1A1A]/70 dark:text-slate-400 flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 shrink-0" />{BRAND.location}</p>
          </div>
          <div className="space-y-2">
            <h3 className="font-bold font-serif text-[#1A1A1A] dark:text-slate-100">Service Terms</h3>
            <p className="text-[#1A1A1A]/70 dark:text-slate-400">Max Delivery: 6.0 km</p>
            <p className="text-[#1A1A1A]/70 dark:text-slate-400">Min Delivery Subtotal: 1,000 Br</p>
          </div>
          <div className="space-y-2">
            <h3 className="font-bold font-serif text-[#1A1A1A] dark:text-slate-100">Help & Support</h3>
            <div className="flex flex-col space-y-2 text-[#1A1A1A]/70 dark:text-slate-400">
              <button onClick={() => setPageModal('faq')} className="text-left hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors flex items-center gap-2"><HelpCircle className="w-3.5 h-3.5 shrink-0" />FAQ</button>
              <button onClick={() => document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' })} className="text-left hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors flex items-center gap-2"><Info className="w-3.5 h-3.5 shrink-0" />About</button>
              <button onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })} className="text-left hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors flex items-center gap-2"><Mail className="w-3.5 h-3.5 shrink-0" />Contact</button>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto border-t border-[#1A1A1A]/10 dark:border-slate-800 mt-8 pt-6 flex flex-col items-center gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                setEmailModalSubject('Customer Inquiry');
                setEmailModalOpen(true);
              }}
              className="w-10 h-10 rounded-full bg-emerald-900 dark:bg-emerald-700 flex items-center justify-center text-emerald-100 hover:bg-emerald-700 dark:hover:bg-emerald-600 transition-colors cursor-pointer shadow-xs"
              title={`Send Email to ${BRAND.email}`}
            >
              <Mail className="w-4.5 h-4.5" />
            </button>
            <a href="tel:+251955348181" className="w-10 h-10 rounded-full bg-emerald-900 dark:bg-emerald-700 flex items-center justify-center text-emerald-100 hover:bg-emerald-700 dark:hover:bg-emerald-600 transition-colors" title="Call us">
              <Phone className="w-4.5 h-4.5" />
            </a>
            <a href="https://www.tiktok.com/@al.medina.market" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-emerald-900 dark:bg-emerald-700 flex items-center justify-center text-emerald-100 hover:bg-emerald-700 dark:hover:bg-emerald-600 transition-colors" title="Follow on TikTok">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-4.5 h-4.5"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.14v12.36a3.21 3.21 0 1 1-2.79-3.18V8.04a6.35 6.35 0 0 0-5.93 6.34 6.35 6.35 0 0 0 6.35 6.35 6.35 6.35 0 0 0 6.35-6.35V8.69a8.32 8.32 0 0 0 4.83 1.54V7.09a4.85 4.85 0 0 1-1.9-.4z"/></svg>
            </a>
          </div>
          <p className="text-center text-[#1A1A1A]/50 dark:text-slate-400 text-[11px]">
            © {new Date().getFullYear()} {BRAND.name} • Bethel, Addis Ababa, Ethiopia.
          </p>
        </div>
      </footer>

      {/* Modals */}
      {selectedProductModal && (
        <ProductDetailModal
          product={selectedProductModal}
          onClose={() => setSelectedProductModal(null)}
          onOpenReviewModal={(p) => { setReviewProduct(p); setReviewModalOpen(true); }}
        />
      )}
      <CartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} onProceedToCheckout={() => { setCartOpen(false); setCheckoutOpen(true); }} />
      <CheckoutModal
        isOpen={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        onOrderSuccess={(orderId) => {
          setCheckoutOpen(false);
          setHighlightOrderId(orderId);
          setOrderTrackingOpen(true);
        }}
      />
      <CustomerDashboardModal
        isOpen={customerDashboardOpen}
        onClose={() => setCustomerDashboardOpen(false)}
        onSelectProduct={(prod) => setSelectedProductModal(prod)}
      />
      <OrderTrackingModal
        isOpen={orderTrackingOpen}
        onClose={() => { setOrderTrackingOpen(false); setHighlightOrderId(null); }}
        highlightOrderId={highlightOrderId}
        onOpenReturnReport={(order) => { setReturnOrder(order); setReturnModalOpen(true); }}
        onOpenReviewModal={(product, order) => { setReviewProduct(product); setReviewOrder(order); setReviewModalOpen(true); }}
      />
      <ReturnReportModal isOpen={returnModalOpen} onClose={() => { setReturnModalOpen(false); setReturnOrder(null); }} order={returnOrder} />
      <ReviewSubmissionModal isOpen={reviewModalOpen} onClose={() => { setReviewModalOpen(false); setReviewProduct(null); setReviewOrder(null); }} product={reviewProduct} order={reviewOrder} />
      <AuthModal />

      {/* Favorites Modal */}
      {favoritesOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#FAF8F0] dark:bg-slate-900 rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto p-6 space-y-4 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between border-b border-[#1A1A1A]/10 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-amber-500 fill-amber-500" />
                <h2 className="text-lg font-bold font-serif text-[#1A1A1A] dark:text-slate-100">Saved Favorites</h2>
                {favoriteProducts.length > 0 && (
                  <span className="text-xs font-bold px-2 py-0.5 bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 rounded-full">
                    {favoriteProducts.length}
                  </span>
                )}
              </div>
              <button onClick={() => setFavoritesOpen(false)} className="text-[#1A1A1A]/50 dark:text-slate-400 hover:text-[#1A1A1A] dark:hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>
            {favoriteProducts.length === 0 ? (
              <div className="py-12 px-4 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
                  <Heart className="w-6 h-6" />
                </div>
                <p className="text-sm font-semibold text-[#1A1A1A] dark:text-slate-200">No saved favorites yet</p>
                <p className="text-xs text-[#1A1A1A]/60 dark:text-slate-400 max-w-xs mx-auto">
                  Click the heart icon on any product to save it to your account.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {favoriteProducts.map((prod) => (
                  <ProductCard key={prod.id} product={prod} onSelect={() => { setFavoritesOpen(false); setSelectedProductModal(prod); }} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Shopping Lists Modal */}
      {shoppingListsOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#FAF8F0] dark:bg-slate-900 rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto p-6 space-y-5 shadow-2xl border border-amber-200/60 dark:border-slate-800">
            <div className="flex items-center justify-between border-b border-amber-900/10 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <ListOrdered className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />
                <h2 className="text-lg font-bold font-serif text-[#1A1A1A] dark:text-slate-100">Saved Shopping Lists</h2>
              </div>
              <button onClick={() => setShoppingListsOpen(false)} className="text-[#1A1A1A]/50 dark:text-slate-400 hover:text-[#1A1A1A] dark:hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            {userRole === 'guest' ? (
              <div className="text-center py-12 px-4 space-y-4 max-w-sm mx-auto">
                <div className="w-16 h-16 rounded-full bg-peach-50 dark:bg-slate-800 border border-amber-200 dark:border-slate-700 flex items-center justify-center mx-auto text-amber-700 dark:text-amber-400">
                  <ListOrdered className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    Sign in to save/view lists
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Your personal shopping lists are synced to your account so you can access them anywhere.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShoppingListsOpen(false);
                    setAuthRedirectMessage('Please sign in to save and manage shopping lists.');
                    setAuthModalOpen(true);
                  }}
                  className="w-full py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold text-xs transition-colors min-h-[44px]"
                >
                  Sign In / Create Account
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="New List Name (e.g. Ramadan Specials, Weekly Dates)..."
                    value={newListName}
                    onChange={(e) => setNewListName(e.target.value)}
                    className="flex-1 bg-white dark:bg-slate-800 border border-amber-200/80 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-[#1A1A1A] dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                  />
                  <button
                    onClick={() => {
                      if (newListName.trim()) {
                        createShoppingList(newListName.trim());
                        setNewListName('');
                      }
                    }}
                    className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold rounded-xl transition-colors flex items-center gap-1 shrink-0 min-h-[40px]"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create</span>
                  </button>
                </div>

                {shoppingLists.length === 0 ? (
                  <p className="text-xs text-slate-500 dark:text-slate-400 py-8 text-center italic bg-white dark:bg-slate-800/40 rounded-xl border border-amber-100 dark:border-slate-800">
                    No saved shopping lists yet. Create your first list above!
                  </p>
                ) : (
              <div className="space-y-4">
                {shoppingLists.map((list) => (
                  <div key={list.id} className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex-1 min-w-0">
                        {editingListId === list.id ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={editListName}
                              onChange={(e) => setEditListName(e.target.value)}
                              className="flex-1 bg-[#FAF8F0] border border-emerald-300 rounded-lg px-2 py-1 text-sm text-[#1A1A1A] focus:outline-none focus:ring-1 focus:ring-emerald-600"
                              autoFocus
                            />
                            <button
                              onClick={() => { renameShoppingList(list.id, editListName); setEditingListId(null); }}
                              className="p-1.5 bg-emerald-700 text-white rounded-lg hover:bg-emerald-800 min-h-[32px] min-w-[32px] flex items-center justify-center"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-sm text-[#1A1A1A]">{list.name}</h3>
                            <button
                              onClick={() => { setEditingListId(list.id); setEditListName(list.name); }}
                              className="p-1 text-[#1A1A1A]/40 hover:text-emerald-700 rounded"
                              title="Rename list"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                        {list.items.length > 0 && (
                          <p className="text-[10px] text-[#1A1A1A]/60 mt-0.5">{list.items.length} item{list.items.length !== 1 ? 's' : ''}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => deleteShoppingList(list.id)} className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg min-h-[36px] min-w-[36px] flex items-center justify-center" title="Delete list"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>
                    {list.items.length > 0 ? (
                      <div className="divide-y divide-slate-100 text-xs">
                        {list.items.map((item) => {
                          const prod = products.find((p) => p.id === item.productId);
                          if (!prod) return null;
                          return (
                            <div key={item.productId} className="py-2 flex items-center justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <span className="font-medium text-[#1A1A1A] block truncate">{prod.name}</span>
                                <span className="text-[#1A1A1A]/50 text-[10px]">{formatETB(prod.priceETB)}</span>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <div className="flex items-center gap-1.5 bg-[#FAF8F0] rounded-lg border border-slate-200 px-1.5 py-1">
                                  <button
                                    onClick={() => updateShoppingListItemQty(list.id, item.productId, item.quantity - 1)}
                                    className="w-6 h-6 flex items-center justify-center rounded text-[#1A1A1A]/70 hover:bg-slate-200 transition-colors"
                                    title="Decrease quantity"
                                  >
                                    <Minus className="w-3 h-3" />
                                  </button>
                                  <span className="font-semibold text-[#1A1A1A] min-w-[18px] text-center">{item.quantity}</span>
                                  <button
                                    onClick={() => updateShoppingListItemQty(list.id, item.productId, item.quantity + 1)}
                                    className="w-6 h-6 flex items-center justify-center rounded text-[#1A1A1A]/70 hover:bg-slate-200 transition-colors"
                                    title="Increase quantity"
                                  >
                                    <Plus className="w-3 h-3" />
                                  </button>
                                </div>
                                <span className="font-semibold text-emerald-700 min-w-[70px] text-right">{formatETB(prod.priceETB * item.quantity)}</span>
                                <button
                                  onClick={() => removeShoppingListItem(list.id, item.productId)}
                                  className="p-1 text-rose-500 hover:bg-rose-50 rounded min-h-[28px] min-w-[28px] flex items-center justify-center"
                                  title="Remove from list"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="h-1" />
                    )}
                  </div>
                ))}
              </div>
            )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Pages Modal (FAQ / About / Contact) */}
      {pageModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#FAF8F0] rounded-2xl w-full max-w-3xl max-h-[85vh] overflow-y-auto p-6 space-y-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-[#1A1A1A]/10 pb-3">
              <div className="flex items-center gap-2">
                {pageModal === 'faq' && <HelpCircle className="w-5 h-5 text-emerald-700" />}
                {pageModal === 'about' && <Info className="w-5 h-5 text-amber-700" />}
                {pageModal === 'contact' && <Mail className="w-5 h-5 text-indigo-700" />}
                <h2 className="text-xl font-bold font-serif text-[#1A1A1A]">
                  {pageModal === 'faq' && 'Frequently Asked Questions'}
                  {pageModal === 'about' && 'Our Promise & Policy'}
                  {pageModal === 'contact' && `Contact ${BRAND.name}`}
                </h2>
              </div>
              <button onClick={() => setPageModal(null)} className="text-[#1A1A1A]/50 hover:text-[#1A1A1A] p-1"><X className="w-5 h-5" /></button>
            </div>

            {pageModal === 'faq' && (
              <div className="space-y-4">
                {faqs.map((faq) => (
                  <div key={faq.id} className="bg-white p-4 rounded-xl border border-slate-200 space-y-1">
                    <h3 className="font-bold text-sm text-[#1A1A1A] flex items-start gap-2"><span className="text-emerald-700 shrink-0">Q:</span>{faq.question}</h3>
                    <p className="text-xs text-[#1A1A1A]/70 leading-relaxed pl-5"><strong>A:</strong> {faq.answer}</p>
                  </div>
                ))}
              </div>
            )}

            {pageModal === 'about' && (
              <div className="space-y-4 text-xs leading-relaxed text-[#1A1A1A]/80">
                <div className="bg-gradient-to-br from-emerald-50 to-white p-5 rounded-xl border border-emerald-200 space-y-2">
                  <h3 className="font-bold text-sm text-emerald-900 font-serif">Our Promise</h3>
                  <p className="text-[#1A1A1A]/80">At {BRAND.name}, nestled in the heart of Bethel, Addis Ababa, we believe grocery shopping should feel personal. That's why every product on our shelves is hand-picked for quality, authenticity, and value — from premium imported dates and aromatic Arabic coffee to everyday cooking essentials your family trusts.</p>
                  <p className="text-[#1A1A1A]/80">Whether you prefer the convenience of doorstep delivery or a quick in-store pickup, we make it simple, fast, and reliable.</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
                  <h3 className="font-bold text-sm text-[#1A1A1A] font-serif">Why Shop With Us?</h3>
                  <ul className="space-y-1.5 pl-4 list-disc">
                    <li><strong>Curated Quality</strong> — every item meets our personal standard before it reaches you.</li>
                    <li><strong>Flexible Fulfillment</strong> — doorstep delivery within 6 km or free pickup at our Bethel store.</li>
                    <li><strong>Transparent Pricing</strong> — what you see is what you pay, no hidden fees.</li>
                    <li><strong>Same-Day Returns</strong> — not satisfied? Report it the same day with photo proof for a quick resolution.</li>
                  </ul>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
                  <h3 className="font-bold text-sm text-[#1A1A1A] font-serif">Delivery Policy</h3>
                  <p>Delivery is strictly limited to a <strong>6.0 km radius</strong> from our Bethel location. Orders beyond 6.0 km are welcome as <strong>Free In-Store Pickup</strong>. Minimum delivery subtotal: <strong>1,000 Br</strong>.</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
                  <h3 className="font-bold text-sm text-[#1A1A1A] font-serif">Same-Day Return Policy</h3>
                  <p>Return or replacement requests must be filed on the <strong>same calendar day</strong> as delivery. Photo evidence is mandatory for all returns.</p>
                </div>
              </div>
            )}

            {pageModal === 'contact' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-white rounded-xl border border-slate-200 text-xs">
                  <a href={`tel:${BRAND.phoneTel}`} className="flex items-center gap-2 text-emerald-700 font-semibold hover:underline"><Phone className="w-4 h-4 shrink-0" />{BRAND.phone}</a>
                  <a href={`mailto:${BRAND.email}`} className="flex items-center gap-2 text-emerald-700 font-semibold hover:underline break-all text-left"><Mail className="w-4 h-4 shrink-0" />{BRAND.email}</a>
                </div>
                <div className="space-y-3">
                  <div><label className="block text-xs font-semibold text-[#1A1A1A] mb-1">Full Name</label><input type="text" placeholder="e.g., Abebe Bikila" value={contactName} onChange={(e) => setContactName(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-[#1A1A1A] focus:outline-none focus:ring-1 focus:ring-emerald-600" /></div>
                  <div><label className="block text-xs font-semibold text-[#1A1A1A] mb-1">Phone / Email</label><input type="text" placeholder="+251911000000 or you@email.com" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-[#1A1A1A] focus:outline-none focus:ring-1 focus:ring-emerald-600" /></div>
                  <div><label className="block text-xs font-semibold text-[#1A1A1A] mb-1">Message</label><textarea rows={4} placeholder="Your message..." value={contactMessage} onChange={(e) => setContactMessage(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-[#1A1A1A] focus:outline-none focus:ring-1 focus:ring-emerald-600" /></div>
                  <button
                    onClick={() => {
                      if (contactName.trim() && contactPhone.trim() && contactMessage.trim()) {
                        submitContactForm(
                          contactName.trim(),
                          contactPhone.trim(),
                          contactMessage.trim(),
                          'Inquiry from ' + contactName.trim()
                        );
                        setContactName('');
                        setContactPhone('');
                        setContactMessage('');
                        setPageModal(null);
                      }
                    }}
                    className="w-full py-2.5 bg-[#1A1A1A] text-[#FDFCF5] font-bold text-xs rounded-xl hover:bg-[#333333] transition-colors flex items-center justify-center gap-2 min-h-[44px]"
                  >
                    <Send className="w-4 h-4" /><span>Send Message</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <EmailFormModal
        isOpen={emailModalOpen}
        onClose={() => setEmailModalOpen(false)}
        initialSubject={emailModalSubject}
        initialMessage={emailModalMessage}
      />
    </div>
  );
};

// ─── Root App ─────────────────────────────────────────────────────────────────
const MainAppContent: React.FC = () => {
  const { viewTab, setViewTab, pendingChapaOrder, setPendingChapaOrder, authLoading, orders, userRole, adminSession } = useApp();
  const hash = useHashRoute();
  const [verifyTxRef, setVerifyTxRef] = useState<string | null>(null);
  const [trackingOrderId, setTrackingOrderId] = useState<string | null>(null);

  // Sync hash → viewTab for admin route
  useEffect(() => {
    if (hash === '#/admin' || hash === '#/admin/login') {
      setViewTab('admin_dashboard');
    }
  }, [hash, setViewTab]);

  // Admin accounts stay in the admin portal and cannot shop as a customer
  useEffect(() => {
    const isAdminAccount = userRole === 'admin' || (adminSession.isLoggedIn && adminSession.is2FAVerified);
    if (isAdminAccount && viewTab !== 'admin_dashboard') {
      setViewTab('admin_dashboard');
    }
  }, [userRole, adminSession.isLoggedIn, adminSession.is2FAVerified, viewTab, setViewTab]);

  // Check URL query parameters for Chapa redirect returns
  useEffect(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const txRef =
        urlParams.get('tx_ref') ||
        urlParams.get('trx_ref') ||
        urlParams.get('order_id') ||
        urlParams.get('chapa_tx_ref');
      const gatewayStatus = (urlParams.get('status') || urlParams.get('chapa_status') || '').toLowerCase();
      let storedTx: string | null = null;
      try {
        const stored = sessionStorage.getItem('almadina_chapa_return');
        if (stored) {
          const parsed = JSON.parse(stored);
          storedTx = parsed.txRef || parsed.orderId || null;
        }
      } catch {
        storedTx = null;
      }

      const isChapaReturn =
        urlParams.get('chapa_verify') === '1' ||
        urlParams.has('chapa_verify') ||
        gatewayStatus === 'success' ||
        gatewayStatus === 'failed' ||
        !!storedTx;

      const refToVerify = txRef || storedTx;
      if (isChapaReturn && refToVerify) {
        setVerifyTxRef(refToVerify);
        window.history.replaceState({}, document.title, window.location.pathname + window.location.hash);
      }
    } catch {
      // ignore
    }
  }, []);

  // Show a minimal loading screen while Firebase restores the session
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#FDFCF5] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-500 font-medium">Loading…</p>
        </div>
      </div>
    );
  }

  const isAdminRoute = viewTab === 'admin_dashboard';

  return (
    <div className="min-h-screen bg-[#FDFCF5] dark:bg-slate-950 text-[#1A1A1A] dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      {isAdminRoute ? (
        <AdminShell />
      ) : viewTab === 'chapa_gateway_sim' ? (
        <div className="flex-1 bg-[#FDFCF5] dark:bg-slate-950 p-4 md:p-8 flex items-center justify-center">
          <ChapaPaymentSimulator />
        </div>
      ) : (
        <StorefrontContent />
      )}

      {/* Chapa Return Verification Modal */}
      {verifyTxRef && (
        <ChapaVerificationModal
          txRef={verifyTxRef}
          onClose={() => setVerifyTxRef(null)}
          onOpenOrder={(orderId) => {
            setVerifyTxRef(null);
            setTrackingOrderId(orderId);
          }}
        />
      )}

      {/* Order Tracking Modal for confirmed Chapa orders */}
      {trackingOrderId && (
        <OrderTrackingModal
          isOpen={!!trackingOrderId}
          onClose={() => setTrackingOrderId(null)}
          highlightOrderId={trackingOrderId}
          onOpenReturnReport={() => undefined}
          onOpenReviewModal={() => undefined}
        />
      )}

      <ToastContainer />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainAppContent />
    </AppProvider>
  );
}
