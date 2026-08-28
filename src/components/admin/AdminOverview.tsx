import React from 'react';
import { useApp } from '../../context/AppContext';
import { formatETB, formatDate } from '../../utils/distance';
import {
  DollarSign,
  CreditCard,
  TriangleAlert as AlertTriangle,
  MessageSquare,
  RotateCcw,
  ShoppingBag,
  CircleCheck as CheckCircle2,
  Clock,
  ArrowRight,
  TrendingUp,
  Calendar,
  Check,
  Truck,
  Package,
} from 'lucide-react';
import { AdminTab } from './AdminSidebar';

interface AdminOverviewProps {
  onNavigate: (tab: AdminTab) => void;
}

export const AdminOverview: React.FC<AdminOverviewProps> = ({ onNavigate }) => {
  const {
    setViewTab,
    orders,
    products,
    reviews,
    returnReports,
    recordCashPaymentReceived,
    updateOrderStatus,
  } = useApp();

  const now = new Date();

  // Paid orders (Chapa or Admin marked as paid)
  const paidOrders = orders.filter((o) => o.paymentStatus === 'paid');

  // Daily Received Payments (Today)
  const dailyPaidOrders = paidOrders.filter((o) => {
    const t = new Date(o.paidAt || o.updatedAt || o.createdAt);
    return t.toDateString() === now.toDateString();
  });
  const dailyTotalETB = dailyPaidOrders.reduce((sum, o) => sum + o.totalETB, 0);

  // Other Metrics
  const activeOrders = orders.filter((o) => o.orderStatus !== 'completed' && o.orderStatus !== 'cancelled');
  const pendingPayments = orders.filter((o) => o.paymentStatus === 'payment_pending');
  const lowStockProducts = products.filter((p) => p.stockCount <= p.lowStockThreshold);
  const pendingReviews = reviews.filter((r) => r.status === 'pending_approval');
  const pendingReturns = returnReports.filter((r) => r.status === 'pending_review');

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Almedina Market Operations Overview</h2>
          <p className="text-xs text-slate-500">
            Real-Time Operations & Order Fulfillment Dashboard • Bethel, Addis Ababa
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => setViewTab('storefront')}
            className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Back to Storefront</span>
          </button>
          <button
            onClick={() => onNavigate('reports')}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm"
          >
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <span>Detailed Financial Reports</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {/* Daily Sales Card */}
        <div
          onClick={() => onNavigate('reports')}
          className="bg-emerald-900 text-white p-5 rounded-2xl shadow-sm cursor-pointer hover:bg-emerald-800 transition-all space-y-2 border border-emerald-800"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-200">Daily Sales Today</span>
            <DollarSign className="w-5 h-5 text-emerald-400" />
          </div>
          <p className="text-2xl font-black">{formatETB(dailyTotalETB)}</p>
          <p className="text-[11px] text-emerald-300">{dailyPaidOrders.length} Paid Orders Today</p>
        </div>

        {/* Active Orders Queue */}
        <div
          onClick={() => onNavigate('orders')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm cursor-pointer hover:border-slate-300 transition-all space-y-2"
        >
          <div className="flex items-center justify-between text-slate-600">
            <span className="text-xs font-bold text-slate-800">Active Orders</span>
            <ShoppingBag className="w-5 h-5 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-slate-900">{activeOrders.length} Orders</p>
          <p className="text-[11px] text-slate-500">In fulfillment pipeline</p>
        </div>

        {/* Chapa Payment Pending Card */}
        <div
          onClick={() => onNavigate('payments')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm cursor-pointer hover:border-slate-300 transition-all space-y-2"
        >
          <div className="flex items-center justify-between text-slate-600">
            <span className="text-xs font-bold text-slate-800">Payment Verification</span>
            <CreditCard className="w-5 h-5 text-cyan-600" />
          </div>
          <p className="text-2xl font-black text-slate-900">{pendingPayments.length} Pending</p>
          <p className="text-[11px] text-slate-500">Chapa & manual transfers</p>
        </div>

        {/* Low Stock Alerts */}
        <div
          onClick={() => onNavigate('products')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm cursor-pointer hover:border-slate-300 transition-all space-y-2"
        >
          <div className="flex items-center justify-between text-slate-600">
            <span className="text-xs font-bold text-slate-800">Low Stock Alert</span>
            <AlertTriangle className="w-5 h-5 text-amber-500" />
          </div>
          <p className="text-2xl font-black text-slate-900">{lowStockProducts.length} Products</p>
          <p className="text-[11px] text-slate-500">At or below threshold</p>
        </div>

        {/* Pending Reviews & Returns */}
        <div
          onClick={() => onNavigate('reviews')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm cursor-pointer hover:border-slate-300 transition-all space-y-2"
        >
          <div className="flex items-center justify-between text-slate-600">
            <span className="text-xs font-bold text-slate-800">Moderation & Returns</span>
            <MessageSquare className="w-5 h-5 text-purple-500" />
          </div>
          <p className="text-2xl font-black text-slate-900">{pendingReviews.length + pendingReturns.length} Actionable</p>
          <p className="text-[11px] text-slate-500">Reviews & customer returns</p>
        </div>
      </div>

      {/* ─── ORDER MANAGEMENT SECTION (NO CALL CONFIRMATION) ─── */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-emerald-600" />
              Order Management Queue
            </h3>
            <p className="text-xs text-slate-500">Track and update order status & payment verifications</p>
          </div>

          <button
            onClick={() => onNavigate('orders')}
            className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
          >
            <span>Go to Full Orders Tab</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {orders.length === 0 ? (
          <p className="text-xs text-slate-500 italic p-6 text-center bg-slate-50 rounded-xl">
            No orders placed yet.
          </p>
        ) : (
          <div className="space-y-3">
            {orders.slice(0, 5).map((order) => {
              const isPaid = order.paymentStatus === 'paid';

              return (
                <div
                  key={order.id}
                  className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs"
                >
                  {/* Order Info */}
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold font-mono text-slate-900 text-sm">{order.orderNumber}</span>
                      
                      {/* Payment Status Badge */}
                      <span
                        className={`px-2 py-0.5 rounded font-bold text-[10px] uppercase ${
                          isPaid
                            ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                            : 'bg-amber-100 text-amber-900 border border-amber-300'
                        }`}
                      >
                        {isPaid ? 'Paid' : 'Payment Pending'} ({order.paymentMethod.toUpperCase()})
                      </span>

                      {/* Order Status Badge */}
                      <span className="px-2 py-0.5 rounded font-bold text-[10px] uppercase bg-slate-200 text-slate-800">
                        {order.orderStatus.replace(/_/g, ' ')}
                      </span>
                    </div>

                    <div className="text-slate-600 text-xs">
                      Customer: <strong className="text-slate-900">{order.customerName}</strong> ({order.customerPhone}) •{' '}
                      Fulfillment: <span className="capitalize font-semibold">{order.fulfillmentType}</span> • Total:{' '}
                      <strong className="text-emerald-700">{formatETB(order.totalETB)}</strong>
                    </div>

                    <div className="text-[11px] text-slate-500 flex flex-wrap items-center gap-2">
                      <span>Placed: {formatDate(order.createdAt)}</span>
                      {order.paidAt && (
                        <span className="text-emerald-700 font-medium">
                          • Paid At: {formatDate(order.paidAt)}
                        </span>
                      )}
                      <span>• Items ({order.items.length}): {order.items.map((i) => `${i.quantity}x ${i.productName}`).join(', ')}</span>
                    </div>
                  </div>

                  {/* Quick Action Controls */}
                  <div className="flex flex-wrap items-center gap-2 self-start md:self-center">
                    {/* Payment action if pending */}
                    {!isPaid && (order.paymentMethod === 'cash' || order.paymentMethod === 'cod' || order.paymentMethod === 'cop') && (
                      <button
                        onClick={() => recordCashPaymentReceived(order.id)}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-lg flex items-center gap-1 shadow-sm text-xs"
                        title="Mark Cash Payment Received"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Mark Paid</span>
                      </button>
                    )}

                    {/* Order Status progression */}
                    {order.orderStatus === 'pending' && (
                      <button
                        onClick={() => updateOrderStatus(order.id, 'confirmed')}
                        className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg flex items-center gap-1 shadow-sm text-xs"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Confirm Order</span>
                      </button>
                    )}

                    {order.orderStatus === 'confirmed' && (
                      <button
                        onClick={() => updateOrderStatus(order.id, order.fulfillmentType === 'delivery' ? 'out_for_delivery' : 'ready_for_pickup')}
                        className="px-3 py-1.5 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-lg flex items-center gap-1 shadow-sm text-xs"
                      >
                        {order.fulfillmentType === 'delivery' ? <Truck className="w-3.5 h-3.5" /> : <Package className="w-3.5 h-3.5" />}
                        <span>{order.fulfillmentType === 'delivery' ? 'Out for Delivery' : 'Ready for Pickup'}</span>
                      </button>
                    )}

                    {(order.orderStatus === 'out_for_delivery' || order.orderStatus === 'ready_for_pickup') && (
                      <button
                        onClick={() => updateOrderStatus(order.id, 'completed')}
                        className="px-3 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white font-bold rounded-lg flex items-center gap-1 shadow-sm text-xs"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Mark Completed</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

