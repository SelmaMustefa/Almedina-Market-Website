import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Order, OrderStatus, PaymentStatus, FulfillmentType, OrderItem } from '../../types';
import { formatETB, formatDate } from '../../utils/distance';
import { resolveOrderItems } from '../../utils/orderUtils';
import {
  Search,
  Filter,
  CheckCircle2,
  DollarSign,
  Truck,
  Store,
  Clock,
  Eye,
  XCircle,
  MapPin,
  Package,
  RefreshCw,
} from 'lucide-react';

const GOOGLE_MAPS_EMBED_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

export const AdminOrderManager: React.FC = () => {
  const {
    orders,
    refreshOrders,
    products,
    updateOrderStatus,
    recordCashPaymentReceived,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<OrderStatus | 'all'>('all');
  const [filterPayment, setFilterPayment] = useState<PaymentStatus | 'all'>('all');
  const [filterFulfillment, setFilterFulfillment] = useState<FulfillmentType | 'all'>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [selectedOrderDetails, setSelectedOrderDetails] = useState<Order | null>(null);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshOrders();
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  // Filter orders - NO user_id filter applied: ensures all orders from all customers are visible
  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      o.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.customerPhone.includes(searchQuery);

    const matchesStatus = filterStatus === 'all' || o.orderStatus === filterStatus;
    const matchesPayment = filterPayment === 'all' || o.paymentStatus === filterPayment;
    const matchesFulfillment = filterFulfillment === 'all' || o.fulfillmentType === filterFulfillment;

    return matchesSearch && matchesStatus && matchesPayment && matchesFulfillment;
  });

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Order Management</h2>
          <p className="text-xs text-slate-500">
            Manage global orders from all customers, verify payments, and trigger fulfillment stages.
          </p>
        </div>
        <button
          onClick={handleManualRefresh}
          disabled={isRefreshing}
          className="inline-flex items-center gap-2 px-3 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-60 text-white rounded-xl text-xs font-bold shadow-sm transition-all self-start sm:self-auto"
          title="Refresh orders from database"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>{isRefreshing ? 'Syncing...' : 'Refresh Orders'}</span>
        </button>
      </div>

      {/* Filter Controls */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by Order #, Customer Name, or Phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:border-emerald-600"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl px-3 py-2 focus:outline-none"
            >
              <option value="all">All Order Statuses</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="out_for_delivery">Out for Delivery</option>
              <option value="ready_for_pickup">Ready for Pickup</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>

            {/* Payment Status Filter */}
            <select
              value={filterPayment}
              onChange={(e) => setFilterPayment(e.target.value as any)}
              className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl px-3 py-2 focus:outline-none"
            >
              <option value="all">All Payment Statuses</option>
              <option value="pending_cash">Pending Cash</option>
              <option value="payment_pending">Chapa Pending</option>
              <option value="paid">Paid</option>
              <option value="unpaid">Unpaid</option>
              <option value="failed">Failed</option>
            </select>

            {/* Fulfillment Filter */}
            <select
              value={filterFulfillment}
              onChange={(e) => setFilterFulfillment(e.target.value as any)}
              className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl px-3 py-2 focus:outline-none"
            >
              <option value="all">All Fulfillment</option>
              <option value="delivery">Delivery Only</option>
              <option value="pickup">Pickup Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Orders Table / Cards View */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-900 text-white font-bold border-b border-slate-800">
                <th className="p-3.5">Order # / Date</th>
                <th className="p-3.5">Customer / Phone</th>
                <th className="p-3.5">Type / Distance</th>
                <th className="p-3.5">Amount</th>
                <th className="p-3.5">Payment Status</th>
                <th className="p-3.5">Order Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500 italic">
                    No orders match the selected filters.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3.5">
                      <p className="font-mono font-bold text-slate-900">{order.orderNumber}</p>
                      <p className="text-[11px] text-slate-500">{formatDate(order.createdAt)}</p>
                    </td>

                    <td className="p-3.5">
                      <p className="font-bold text-slate-900">{order.customerName}</p>
                      <a href={`tel:${order.customerPhone}`} className="text-emerald-700 font-semibold text-[11px] hover:underline">
                        {order.customerPhone}
                      </a>
                    </td>

                    <td className="p-3.5">
                      <span className="font-bold uppercase text-[11px] text-slate-800">
                        {order.fulfillmentType}
                      </span>
                      {order.deliveryLocation && (
                        <p className="text-[11px] text-slate-500">{order.deliveryLocation.distanceKm} km away</p>
                      )}
                    </td>

                    <td className="p-3.5 font-bold text-slate-900">
                      {formatETB(order.totalETB)}
                    </td>

                    <td className="p-3.5">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${
                          order.paymentStatus === 'paid'
                            ? 'bg-emerald-800 text-emerald-100 border-emerald-700'
                            : order.paymentStatus === 'payment_pending'
                            ? 'bg-amber-100 text-amber-900 border-amber-300'
                            : 'bg-slate-100 text-slate-800 border-slate-300'
                        }`}
                      >
                        {order.paymentStatus.toUpperCase()} ({order.paymentMethod.toUpperCase()})
                      </span>
                    </td>

                    <td className="p-3.5">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${
                          order.orderStatus === 'completed'
                            ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                            : order.orderStatus === 'pending'
                            ? 'bg-amber-100 text-amber-900 border-amber-300'
                            : 'bg-blue-100 text-blue-900 border-blue-300'
                        }`}
                      >
                        {order.orderStatus.replace(/_/g, ' ').toUpperCase()}
                      </span>
                    </td>

                    <td className="p-3.5 text-right space-x-1.5">
                      <button
                        onClick={() => setSelectedOrderDetails(order)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded font-semibold text-[11px]"
                      >
                        Details
                      </button>

                      {order.orderStatus === 'pending' && (
                        <button
                          onClick={() => updateOrderStatus(order.id, 'confirmed')}
                          className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded font-bold text-[11px]"
                          title="Confirm this pending order"
                        >
                          Confirm Order
                        </button>
                      )}

                      {(order.paymentStatus === 'pending_cash' || order.paymentStatus === 'unpaid') && (
                        <button
                          onClick={() => {
                            recordCashPaymentReceived(order.id, true);
                          }}
                          className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded font-bold text-[11px] flex items-center gap-1"
                          title="Confirm Cash Received and Complete Order"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                          <span>Confirm Cash Received</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Details Drawer / Modal */}
      {selectedOrderDetails && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden border border-slate-200 p-6 space-y-4 animate-fade-in text-xs">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <p className="font-mono font-bold text-slate-900 text-base">
                  {selectedOrderDetails.orderNumber}
                </p>
                <p className="text-[11px] text-slate-500">
                  Last Updated: {formatDate(selectedOrderDetails.updatedAt)}
                </p>
              </div>
              <button
                onClick={() => setSelectedOrderDetails(null)}
                className="p-1 rounded text-slate-400 hover:text-slate-600"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div>
                <p className="text-[11px] text-slate-400 font-medium">Customer Name</p>
                <p className="font-bold text-slate-900">{selectedOrderDetails.customerName}</p>
              </div>
              <div>
                <p className="text-[11px] text-slate-400 font-medium">Phone Number</p>
                <a href={`tel:${selectedOrderDetails.customerPhone}`} className="font-bold text-emerald-700 hover:underline">
                  {selectedOrderDetails.customerPhone}
                </a>
              </div>
            </div>

            {selectedOrderDetails.deliveryLocation && (
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="font-bold text-slate-900 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                    Delivery Location & Map
                  </p>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    selectedOrderDetails.deliveryLocation.distanceKm <= 6.0
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      : 'bg-rose-100 text-rose-800 border-rose-300'
                  }`}>
                    {selectedOrderDetails.deliveryLocation.distanceKm.toFixed(1)} km from Bethel ({selectedOrderDetails.deliveryLocation.distanceKm <= 6.0 ? 'Within 6km Limit' : 'Exceeds 6km'})
                  </span>
                </div>
                <p className="font-semibold text-slate-800">{selectedOrderDetails.deliveryLocation.addressText}</p>
                {selectedOrderDetails.deliveryLocation.landmark && (
                  <p className="text-slate-500 text-[11px]">
                    Landmark: {selectedOrderDetails.deliveryLocation.landmark}
                  </p>
                )}
                <div className="rounded-lg overflow-hidden border border-slate-300 h-40 bg-slate-200 mt-2">
                  <iframe
                    width="100%"
                    height="100%"
                    frameBorder="0"
                    style={{ border: 0 }}
                    src={`https://www.google.com/maps/embed/v1/place?key=${GOOGLE_MAPS_EMBED_API_KEY}&q=${encodeURIComponent(
                      selectedOrderDetails.deliveryLocation.addressText || `${selectedOrderDetails.deliveryLocation.latitude},${selectedOrderDetails.deliveryLocation.longitude}`
                    )}&maptype=roadmap`}
                    allowFullScreen
                    loading="lazy"
                    title={`Admin Delivery Map for ${selectedOrderDetails.orderNumber}`}
                  />
                </div>
              </div>
            )}

            {/* Order Items */}
            {(() => {
              const orderItems = resolveOrderItems(selectedOrderDetails, products);
              const totalCount = orderItems.reduce((s, i) => s + (i.quantity || 1), 0);

              return (
                <div className="space-y-2.5 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-slate-900 flex items-center gap-1.5">
                      <Package className="w-4 h-4 text-emerald-600" />
                      <span>
                        Ordered Items ({totalCount} {totalCount === 1 ? 'item' : 'items'})
                      </span>
                    </p>
                    <span className="font-bold text-slate-700">
                      Subtotal: {formatETB(selectedOrderDetails.subtotalETB)}
                    </span>
                  </div>

                  {orderItems.length > 0 ? (
                    <div className="space-y-2">
                      {orderItems.map((item, idx) => {
                        const prod = products.find((p) => p.id === item.productId || p.name === item.productName);
                        const itemImg = prod?.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=300';
                        const itemPrice = item.priceETB || prod?.priceETB || (item.subtotalETB / (item.quantity || 1));
                        const itemSub = item.subtotalETB || (itemPrice * (item.quantity || 1));

                        return (
                          <div
                            key={item.productId || `admin-item-${idx}`}
                            className="bg-white p-2.5 rounded-lg border border-slate-200 flex items-center justify-between gap-2"
                          >
                            <div className="flex items-center gap-2.5">
                              <img
                                src={itemImg}
                                alt={item.productName}
                                className="w-9 h-9 rounded-lg object-cover border border-slate-200 shrink-0"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=300';
                                }}
                              />
                              <div>
                                <p className="font-bold text-slate-900 text-xs">{item.productName}</p>
                                <p className="text-[11px] text-slate-500">
                                  {item.quantity} × {formatETB(itemPrice)} ({item.unit || prod?.unit || 'unit'})
                                </p>
                              </div>
                            </div>
                            <span className="font-extrabold text-emerald-800 text-xs">
                              {formatETB(itemSub)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-slate-500 text-center py-2 italic text-xs">
                      Items subtotal: {formatETB(selectedOrderDetails.subtotalETB)}
                    </p>
                  )}
                </div>
              );
            })()}

            {/* Payment & Status Workflow Controls */}
            {(selectedOrderDetails.paymentStatus === 'pending_cash' || selectedOrderDetails.paymentStatus === 'unpaid') && (
              <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl space-y-2">
                <p className="font-bold text-emerald-950 flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4 text-emerald-700" />
                  Cash Payment Actions ({selectedOrderDetails.paymentMethod.toUpperCase()})
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => {
                      recordCashPaymentReceived(selectedOrderDetails.id, true);
                      setSelectedOrderDetails((prev) => prev ? { ...prev, paymentStatus: 'paid', orderStatus: 'completed' } : null);
                    }}
                    className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg text-xs flex items-center gap-1 shadow-sm"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Confirm Cash Received & Complete
                  </button>
                  <button
                    onClick={() => {
                      recordCashPaymentReceived(selectedOrderDetails.id, false);
                      setSelectedOrderDetails((prev) => prev ? { ...prev, paymentStatus: 'paid' } : null);
                    }}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-lg text-xs"
                  >
                    Confirm Cash Received Only
                  </button>
                </div>
              </div>
            )}

            {/* Status Workflow Controls */}
            <div className="bg-slate-100 p-3 rounded-xl space-y-2">
              <p className="font-bold text-slate-800">Change Fulfillment Workflow Status:</p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => {
                    updateOrderStatus(selectedOrderDetails.id, 'confirmed');
                    setSelectedOrderDetails((prev) => prev ? { ...prev, orderStatus: 'confirmed' } : null);
                  }}
                  className="px-2.5 py-1 bg-blue-600 text-white font-bold rounded text-[11px]"
                >
                  Confirmed
                </button>
                <button
                  onClick={() => {
                    updateOrderStatus(selectedOrderDetails.id, 'out_for_delivery');
                    setSelectedOrderDetails((prev) => prev ? { ...prev, orderStatus: 'out_for_delivery' } : null);
                  }}
                  className="px-2.5 py-1 bg-purple-600 text-white font-bold rounded text-[11px]"
                >
                  Out for Delivery
                </button>
                <button
                  onClick={() => {
                    updateOrderStatus(selectedOrderDetails.id, 'ready_for_pickup');
                    setSelectedOrderDetails((prev) => prev ? { ...prev, orderStatus: 'ready_for_pickup' } : null);
                  }}
                  className="px-2.5 py-1 bg-cyan-600 text-white font-bold rounded text-[11px]"
                >
                  Ready for Pickup
                </button>
                <button
                  onClick={() => {
                    updateOrderStatus(selectedOrderDetails.id, 'completed');
                    setSelectedOrderDetails((prev) => prev ? { ...prev, orderStatus: 'completed' } : null);
                  }}
                  className="px-2.5 py-1 bg-emerald-600 text-white font-bold rounded text-[11px]"
                >
                  Completed
                </button>
                <button
                  onClick={() => {
                    updateOrderStatus(selectedOrderDetails.id, 'cancelled');
                    setSelectedOrderDetails((prev) => prev ? { ...prev, orderStatus: 'cancelled' } : null);
                  }}
                  className="px-2.5 py-1 bg-rose-600 text-white font-bold rounded text-[11px]"
                >
                  Cancel Order
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
