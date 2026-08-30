import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  LayoutDashboard,
  ShoppingBag,
  CreditCard,
  Package,
  FolderTree,
  MessageSquare,
  RotateCcw,
  Mail,
  ChartBar as BarChart3,
  Circle as HelpCircle,
  LogOut,
  Lock,
  Smartphone,
  ShieldAlert,
  Sun,
  Moon,
} from 'lucide-react';

export type AdminTab =
  | 'overview'
  | 'orders'
  | 'payments'
  | 'products'
  | 'categories'
  | 'reviews'
  | 'returns'
  | 'contacts'
  | 'reports'
  | 'faqs';

interface AdminSidebarProps {
  activeTab: AdminTab;
  setActiveTab: (tab: AdminTab) => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({ activeTab, setActiveTab }) => {
  const {
    adminSession,
    logoutAdmin,
    simulateAdminLoginOnOtherDevice,
    orders,
    reviews,
    returnReports,
    contactSubmissions,
    products,
    categories,
    theme,
    toggleTheme,
  } = useApp();

  const pendingPaymentCount = orders.filter((o) => o.paymentStatus === 'payment_pending').length;
  const pendingReviewsCount = reviews.filter((r) => r.status === 'pending_approval').length;
  const pendingReturnsCount = returnReports.filter((r) => r.status === 'pending_review' || r.status === 'investigating').length;
  const unreadContactsCount = contactSubmissions.filter((c) => !c.isRead).length;
  const lowStockCount = products.filter((p) => p.stockCount <= p.lowStockThreshold).length;

  const menuItems = [
    { id: 'overview', label: 'Overview Dashboard', icon: LayoutDashboard, badge: 0 },
    { id: 'orders', label: 'Orders', icon: ShoppingBag, badge: 0 },
    { id: 'payments', label: 'Chapa Transactions', icon: CreditCard, badge: pendingPaymentCount },
    { id: 'products', label: 'Products & Stock', icon: Package, badge: lowStockCount },
    { id: 'categories', label: 'Categories & Depts', icon: FolderTree, badge: categories.length },
    { id: 'reviews', label: 'Review Moderation', icon: MessageSquare, badge: pendingReviewsCount },
    { id: 'returns', label: 'Customer Reports & Claims', icon: RotateCcw, badge: pendingReturnsCount },
    { id: 'contacts', label: 'Contact Messages', icon: Mail, badge: unreadContactsCount },
    { id: 'reports', label: 'Sales Analytics & CSV', icon: BarChart3, badge: 0 },
    { id: 'faqs', label: 'FAQ Content Manager', icon: HelpCircle, badge: 0 },
  ];

  return (
    <div className="w-full md:w-64 bg-slate-900 text-slate-100 flex flex-col justify-between p-4 shrink-0 border-r border-slate-800">
      <div className="space-y-6">
        {/* Admin Header */}
        <div className="p-3 bg-slate-800 rounded-xl border border-slate-700 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4" />
              Store Owner Portal
            </span>
            <span className="text-[10px] bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded border border-emerald-800">
              Active
            </span>
          </div>
          <p className="font-bold text-sm text-white">Almedina Market Admin</p>

          <div className="text-[10px] text-slate-400 space-y-1 pt-1 border-t border-slate-700">
            <p className="flex items-center gap-1">
              <Lock className="w-3 h-3 text-emerald-400" />
              2FA Status: <strong>{adminSession.is2FAVerified ? 'Verified' : 'Pending'}</strong>
            </p>
          </div>
        </div>

        {/* Menu Items */}
        <nav className="space-y-1">
          {menuItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as AdminTab)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-xs transition-all ${
                  isActive
                    ? 'bg-amber-600 text-white font-bold shadow-md shadow-amber-600/20'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <IconComponent className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </div>

                {item.badge > 0 && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                      isActive ? 'bg-amber-900 text-amber-100' : 'bg-amber-500 text-slate-950'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Controls & Session Testing */}
      <div className="pt-4 border-t border-slate-800 space-y-2">
        <button
          onClick={toggleTheme}
          className="w-full py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 transition-colors flex items-center justify-between cursor-pointer"
          title="Toggle Light / Dark Mode"
        >
          <div className="flex items-center gap-2">
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-amber-300" />
            )}
            <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
          </div>
          <span className="text-[10px] uppercase font-bold text-slate-400 bg-slate-900 px-2 py-0.5 rounded">
            {theme}
          </span>
        </button>

        <button
          onClick={simulateAdminLoginOnOtherDevice}
          className="w-full py-2 px-3 bg-slate-800 hover:bg-rose-950/80 hover:text-rose-200 text-slate-400 rounded-xl text-[11px] font-medium border border-slate-700 transition-colors flex items-center justify-center gap-1.5"
          title="Simulate single active admin session takeover"
        >
          <Lock className="w-3.5 h-3.5 text-rose-400" />
          Simulate Login On Other Device
        </button>

        <button
          onClick={logoutAdmin}
          className="w-full py-2 px-3 bg-rose-900/60 hover:bg-rose-900 text-rose-200 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2"
        >
          <LogOut className="w-4 h-4" />
          Logout Admin
        </button>
      </div>
    </div>
  );
};
