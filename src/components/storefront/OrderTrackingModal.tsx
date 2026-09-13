import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Order, OrderStatus, PaymentStatus, Product } from '../../types';
import { formatETB, formatDate, isWithinReturnWindow } from '../../utils/distance';
import {
  X,
  PackageCheck,
  Clock,
  CircleCheck as CheckCircle2,
  Circle as XCircle,
  PhoneCall,
  RotateCcw,
  Star,
  ChevronDown,
  ChevronUp,
  MapPin,
  Truck,
  Store,
  CreditCard,
  DollarSign,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { ALMADINA_SHOP_LOCATION } from '../../data/mockData';
import { OrderItem } from '../../types';
import { resolveOrderItems, isOrderConfirmedForPayment, orderBelongsToCustomer, getSessionPlacedOrderIds } from '../../utils/orderUtils';

const GOOGLE_MAPS_EMBED_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

interface OrderTrackingModalProps {
  isOpen: boolean;
  onClose: () => void;
  highlightOrderId?: string | null;
  onOpenReturnReport: (order: Order) => void;
  onOpenReviewModal: (product: Product, order: Order) => void;
}

export const OrderTrackingModal: React.FC<OrderTrackingModalProps> = ({
  isOpen,
  onClose,
  highlightOrderId,
  onOpenReturnReport,
  onOpenReviewModal,
}) => {
  const {
    orders,
    products,
    updateOrderQuantity,
    cancelOrder,
    currentUser,
    returnReports,
    startChapaCheckout,
    userRole,
    setAuthModalOpen,
    setAuthRedirectMessage,
  } = useApp();
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [payingOrderId, setPayingOrderId] = useState<string | null>(null);

  const handleOpenGatewayForOrder = async (order: Order) => {
    setPayingOrderId(order.id);
    try {
      await startChapaCheckout(order.id);
    } finally {
      setPayingOrderId(null);
    }
  };

  const isAuthenticated = Boolean(currentUser?.isLoggedIn && currentUser?.id && userRole !== 'guest');
  const customerOrders = isAuthenticated
    ? orders.filter((o) => orderBelongsToCustomer(o, currentUser))
    : [];

  // Auto-expand highlightOrderId or the newest order on open
  useEffect(() => {
    if (isOpen) {
      if (highlightOrderId) {
        setExpandedOrderId(highlightOrderId);
      } else if (customerOrders.length > 0 && !expandedOrderId) {
        setExpandedOrderId(customerOrders[0].id);
      }
    }
  }, [isOpen, highlightOrderId, customerOrders]);

  if (!isOpen) return null;

  const getOrderStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'pending':
        return { label: 'Pending Confirmation', style: 'bg-amber-100 text-amber-900 border-amber-300' };
      case 'confirmed':
        return { label: 'Confirmed by Shop', style: 'bg-blue-100 text-blue-900 border-blue-300' };
      case 'out_for_delivery':
        return { label: 'Out for Delivery', style: 'bg-purple-100 text-purple-900 border-purple-300' };
      case 'ready_for_pickup':
        return { label: 'Ready for Pickup', style: 'bg-cyan-100 text-cyan-900 border-cyan-300' };
      case 'completed':
        return { label: 'Completed & Delivered', style: 'bg-emerald-100 text-emerald-900 border-emerald-300' };
      case 'cancelled':
        return { label: 'Cancelled', style: 'bg-rose-100 text-rose-900 border-rose-300' };
    }
  };

  const getPaymentStatusBadge = (status: PaymentStatus) => {
    switch (status) {
      case 'pending_cash':
        return { label: 'Pending Cash (Pay on Fulfillment)', style: 'bg-amber-100 text-amber-900 border-amber-300 font-semibold' };
      case 'unpaid':
        return { label: 'Unpaid (Cash on Fulfillment)', style: 'bg-slate-100 text-slate-800 border-slate-300' };
      case 'payment_pending':
        return { label: 'Waiting for payment', style: 'bg-amber-100 text-amber-900 border-amber-300' };
      case 'paid':
        return { label: 'PAID', style: 'bg-emerald-800 text-emerald-100 border-emerald-700 font-bold' };
      case 'failed':
        return { label: 'Payment Failed', style: 'bg-rose-100 text-rose-900 border-rose-300' };
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden border border-slate-200 my-auto animate-fade-in flex flex-col max-h-[calc(100dvh-2rem)]">
        {/* Modal Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-600/30 border border-emerald-500/50 flex items-center justify-center text-emerald-400">
              <PackageCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base">My Order Details & Status Tracking</h2>
              <p className="text-xs text-slate-400">
                {isAuthenticated ? `Orders for ${currentUser?.name || currentUser?.email}` : 'Almedina Market • Bethel, Addis Ababa'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {!isAuthenticated ? (
            <div className="text-center py-16 px-4 space-y-4 max-w-md mx-auto">
              <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
                <PackageCheck className="w-8 h-8 text-slate-400" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Sign in to view your order history
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Orders are securely linked to your registered account. Please sign in to view your order history, delivery details, and live status.
                </p>
              </div>
              <button
                onClick={() => {
                  onClose();
                  setAuthRedirectMessage('Please sign in to view your order history.');
                  setAuthModalOpen(true);
                }}
                className="w-full py-3 px-4 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-colors min-h-[44px]"
              >
                <span>Sign In / Create Account</span>
              </button>
            </div>
          ) : customerOrders.length === 0 ? (
            <div className="text-center py-16 space-y-3">
              <PackageCheck className="w-12 h-12 text-slate-300 mx-auto" />
              <p className="font-bold text-slate-700 text-sm">No orders placed yet</p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Once you place an order, all your detailed order specs, fulfillment progress, and live map tracking will appear right here.
              </p>
            </div>
          ) : (
            customerOrders.map((order) => {
              const statusBadge = getOrderStatusBadge(order.orderStatus);
              const payBadge = getPaymentStatusBadge(order.paymentStatus);
              const isExpanded = expandedOrderId === order.id;
              const isEditable = order.orderStatus === 'pending';
              const existingReturn = returnReports.find(
                (r) => r.orderId === order.id || r.orderNumber === order.orderNumber
              );
              const withinReturnWindow = isWithinReturnWindow(order.updatedAt || order.createdAt, 48);
              const canReturnReport = order.orderStatus === 'completed' && withinReturnWindow && !existingReturn;

              // Map embed query for this specific order location
              const mapQuery =
                order.deliveryLocation?.addressText ||
                (order.deliveryLocation
                  ? `${order.deliveryLocation.latitude},${order.deliveryLocation.longitude}`
                  : 'Bethel, Addis Ababa, Ethiopia');

              const mapEmbedSrc = `https://www.google.com/maps/embed/v1/place?key=${GOOGLE_MAPS_EMBED_API_KEY}&q=${encodeURIComponent(
                mapQuery
              )}&maptype=roadmap`;

              return (
                <div
                  key={order.id}
                  className={`bg-slate-50 rounded-2xl border transition-all overflow-hidden shadow-xs ${
                    isExpanded ? 'border-emerald-600 ring-2 ring-emerald-600/10' : 'border-slate-200'
                  }`}
                >
                  {/* Order Accordion Header */}
                  <div
                    onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                    className="p-4 bg-white cursor-pointer hover:bg-slate-50/80 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 select-none"
                  >
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono font-extrabold text-sm text-slate-900 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200">
                          {order.orderNumber}
                        </span>
                        <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${statusBadge.style}`}>
                          {statusBadge.label}
                        </span>
                        <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${payBadge.style}`}>
                          {payBadge.label}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 flex items-center gap-2">
                        <span>{formatDate(order.createdAt)}</span>
                        <span>•</span>
                        <span className="font-bold text-slate-700 uppercase flex items-center gap-1">
                          {order.fulfillmentType === 'delivery' ? (
                            <>
                              <Truck className="w-3 h-3 text-emerald-600" />
                              Home Delivery
                            </>
                          ) : (
                            <>
                              <Store className="w-3 h-3 text-amber-600" />
                              Store Pickup
                            </>
                          )}
                        </span>
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-[10px] text-slate-400 font-bold uppercase">Total</p>
                        <p className="font-extrabold text-sm text-emerald-800">{formatETB(order.totalETB)}</p>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </div>
                    </div>
                  </div>

                  {/* Fulfillment Status Timeline */}
                  <div className="p-4 bg-slate-900 text-white text-xs border-b border-slate-800">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                      <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">
                        Fulfillment Lifecycle
                      </span>
                      {order.orderStatus === 'pending' && (
                        <span className="text-[11px] text-amber-300 font-medium bg-amber-950/80 px-2.5 py-0.5 rounded-full border border-amber-700/60 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-amber-400" />
                          <span>Awaiting Admin Confirmation</span>
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-[11px]">
                      {[
                        { status: 'pending', label: '1. Pending' },
                        { status: 'confirmed', label: '2. Confirmed' },
                        {
                          status: order.fulfillmentType === 'delivery' ? 'out_for_delivery' : 'ready_for_pickup',
                          label: order.fulfillmentType === 'delivery' ? '3. Out for Delivery' : '3. Ready for Pickup',
                        },
                        { status: 'completed', label: '4. Completed' },
                      ].map((step) => {
                        const isActive = order.orderStatus === step.status;
                        return (
                          <div
                            key={step.label}
                            className={`p-2.5 rounded-xl border font-semibold transition-all ${
                              isActive
                                ? 'bg-emerald-500/25 border-emerald-400 text-emerald-300 shadow-sm'
                                : 'bg-slate-800/80 border-slate-700/80 text-slate-400'
                            }`}
                          >
                            {step.label}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Expanded Detailed Breakdown */}
                  {isExpanded && (() => {
                    const orderItems = resolveOrderItems(order, products);
                    const totalQty = orderItems.reduce((s, i) => s + (i.quantity || 1), 0);

                    return (
                      <div className="p-5 space-y-5 text-xs">
                        {/* Purchased Items List */}
                        <div className="space-y-2.5">
                          <div className="flex items-center justify-between">
                            <p className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                              <PackageCheck className="w-4 h-4 text-emerald-600" />
                              <span>
                                Ordered Products ({totalQty} {totalQty === 1 ? 'item' : 'items'})
                              </span>
                            </p>
                            <span className="text-slate-600 font-semibold bg-slate-100 px-2.5 py-0.5 rounded-lg border border-slate-200">
                              Subtotal: <strong className="text-slate-900">{formatETB(order.subtotalETB)}</strong>
                            </span>
                          </div>

                          {orderItems.length > 0 ? (
                            <div className="space-y-2">
                              {orderItems.map((item, idx) => {
                                const prod = products.find((p) => p.id === item.productId || p.name === item.productName);
                                const itemImg = prod?.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=300';
                                const itemPrice = item.priceETB || prod?.priceETB || (item.subtotalETB / (item.quantity || 1));
                                const itemSubtotal = item.subtotalETB || (itemPrice * item.quantity);

                                return (
                                  <div
                                    key={item.productId || `item-${idx}`}
                                    className="p-3.5 bg-white rounded-xl border border-slate-200 hover:border-emerald-300 transition-all shadow-xs flex flex-wrap items-center justify-between gap-3"
                                  >
                                    <div className="flex items-center gap-3.5 min-w-[200px]">
                                      <img
                                        src={itemImg}
                                        alt={item.productName}
                                        className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0 bg-slate-50"
                                        onError={(e) => {
                                          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=300';
                                        }}
                                      />
                                      <div className="space-y-0.5">
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                          <p className="font-bold text-slate-900 text-xs">{item.productName}</p>
                                          {prod?.origin && (
                                            <span className="text-[10px] font-medium bg-emerald-50 text-emerald-800 px-1.5 py-0.2 rounded border border-emerald-200">
                                              {prod.origin}
                                            </span>
                                          )}
                                        </div>
                                        {prod?.arabicName && (
                                          <p className="text-[11px] text-slate-400 font-arabic text-right">{prod.arabicName}</p>
                                        )}
                                        <p className="text-[11px] text-slate-500 font-medium">
                                          {formatETB(itemPrice)} <span className="text-slate-400">/ {item.unit || prod?.unit || 'unit'}</span>
                                        </p>
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-3.5 flex-wrap">
                                      {isEditable ? (
                                        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
                                          <button
                                            onClick={() => updateOrderQuantity(order.id, item.productId, item.quantity - 1)}
                                            className="px-2 py-0.5 bg-white rounded font-bold text-slate-700 border min-w-[24px] hover:bg-slate-50 transition-colors"
                                            title="Decrease quantity"
                                          >
                                            -
                                          </button>
                                          <span className="w-8 text-center font-bold text-slate-900 text-xs">
                                            {item.quantity}
                                          </span>
                                          <button
                                            onClick={() => updateOrderQuantity(order.id, item.productId, item.quantity + 1)}
                                            className="px-2 py-0.5 bg-white rounded font-bold text-slate-700 border min-w-[24px] hover:bg-slate-50 transition-colors"
                                            title="Increase quantity"
                                          >
                                            +
                                          </button>
                                        </div>
                                      ) : (
                                        <span className="font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                                          Qty: {item.quantity}
                                        </span>
                                      )}

                                      <div className="text-right min-w-[85px]">
                                        <span className="text-[10px] text-slate-400 block font-semibold">Total</span>
                                        <p className="font-extrabold text-emerald-800 text-xs">
                                          {formatETB(itemSubtotal)}
                                        </p>
                                      </div>

                                      {order.orderStatus === 'completed' && prod && (
                                        <button
                                          onClick={() => onOpenReviewModal(prod, order)}
                                          className="p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded-lg font-bold text-[11px] flex items-center gap-1"
                                        >
                                          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                          <span>Review</span>
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="p-4 bg-slate-50 border border-dashed border-slate-300 rounded-xl text-center text-slate-500">
                              <p className="font-medium text-xs">Order placed with subtotal {formatETB(order.subtotalETB)}</p>
                              <p className="text-[11px] text-slate-400 mt-1">
                                Products are registered under Order {order.orderNumber}.
                              </p>
                            </div>
                          )}
                        </div>

                      {/* Delivery / Location & Google Maps Embed Section */}
                      {order.fulfillmentType === 'delivery' && order.deliveryLocation ? (
                        <div className="bg-slate-100/90 p-4 rounded-2xl border border-slate-200 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 font-bold text-slate-900">
                              <MapPin className="w-4 h-4 text-emerald-600" />
                              <span>Delivery Address & Google Map Verification</span>
                            </div>
                            <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full border border-emerald-200">
                              {order.deliveryLocation.distanceKm.toFixed(1)} km from Bethel Shop (Within 6.0 km Limit)
                            </span>
                          </div>

                          <div className="text-xs text-slate-700 space-y-1 bg-white p-3 rounded-xl border border-slate-200">
                            <p className="font-bold text-slate-900">{order.deliveryLocation.addressText}</p>
                            {order.deliveryLocation.landmark && (
                              <p className="text-slate-500 text-[11px]">
                                Landmark: {order.deliveryLocation.landmark}
                              </p>
                            )}
                            <p className="text-[11px] text-slate-600">
                              Delivery Fee: <strong>{formatETB(order.deliveryFeeETB)}</strong> (50 Br base + {order.deliveryLocation.distanceKm.toFixed(1)} km × 15 Br/km)
                            </p>
                          </div>

                          {/* Embedded Google Maps View for the order location */}
                          <div className="rounded-xl overflow-hidden border border-slate-300 shadow-inner h-48 bg-slate-200">
                            <iframe
                              width="100%"
                              height="100%"
                              frameBorder="0"
                              style={{ border: 0 }}
                              src={mapEmbedSrc}
                              allowFullScreen
                              loading="lazy"
                              referrerPolicy="no-referrer-when-downgrade"
                              title={`Delivery Map for ${order.orderNumber}`}
                              className="w-full h-full"
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200 space-y-2">
                          <div className="flex items-center gap-2 font-bold text-amber-900">
                            <Store className="w-4 h-4 text-amber-700" />
                            <span>Store Pickup Location</span>
                          </div>
                          <p className="text-xs text-amber-800">
                            📍 <strong>{ALMADINA_SHOP_LOCATION.address}</strong>
                          </p>
                          <p className="text-[11px] text-amber-700">
                            Please show your Order Number (<strong>{order.orderNumber}</strong>) upon pickup.
                          </p>
                        </div>
                      )}

                      {/* Payment & Customer Summary Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white p-3.5 rounded-xl border border-slate-200 text-xs">
                        <div className="space-y-1.5">
                          <p className="font-bold text-slate-800 flex items-center gap-1.5">
                            <CreditCard className="w-3.5 h-3.5 text-slate-600" />
                            Payment Method & Status
                          </p>
                          <p className="text-slate-600">
                            Method: <strong className="text-slate-800 uppercase">
                              {order.paymentMethod === 'cod'
                                ? 'Cash on Delivery (COD)'
                                : order.paymentMethod === 'cop'
                                ? 'Cash on Pickup (COP)'
                                : order.paymentMethod === 'telebirr'
                                ? 'Telebirr (Chapa)'
                                : order.paymentMethod === 'cbe_birr'
                                ? 'CBE Birr (Chapa)'
                                : order.paymentMethod}
                            </strong>
                          </p>
                          <div className="flex items-center gap-2">
                            <span className="text-slate-600">Status:</span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                order.paymentStatus === 'paid'
                                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                  : order.paymentStatus === 'payment_pending'
                                  ? 'bg-amber-100 text-amber-900 border-amber-300'
                                  : order.paymentStatus === 'failed'
                                  ? 'bg-rose-100 text-rose-900 border-rose-300'
                                  : 'bg-slate-100 text-slate-700 border-slate-300'
                              }`}
                            >
                              {order.paymentStatus.toUpperCase()}
                            </span>
                          </div>
                          {order.chapaTxRef && (
                            <p className="text-[10px] font-mono text-slate-500 truncate">Ref: {order.chapaTxRef}</p>
                          )}

                          {/* Online Payment Unpaid/Pending/Failed Actions */}
                          {(order.paymentMethod === 'chapa' || order.paymentMethod === 'telebirr' || order.paymentMethod === 'cbe_birr') && order.paymentStatus !== 'paid' && (
                            <div className="pt-2 flex flex-col gap-2">
                              {order.paymentStatus === 'failed' && isOrderConfirmedForPayment(order) && (
                                <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-900 rounded-xl flex items-center gap-2 text-[11px] font-medium">
                                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                                  <span>Payment was unsuccessful. You can try paying again.</span>
                                </div>
                              )}
                              {!isOrderConfirmedForPayment(order) && order.orderStatus !== 'cancelled' ? (
                                <div className="p-2.5 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl flex items-center gap-2 text-[11px] font-medium">
                                  <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                                  <span>Waiting for the shop to confirm this order. You can pay with Chapa after confirmation.</span>
                                </div>
                              ) : isOrderConfirmedForPayment(order) ? (
                                <button
                                  type="button"
                                  onClick={() => handleOpenGatewayForOrder(order)}
                                  disabled={payingOrderId === order.id}
                                  className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 transition-colors shadow-xs disabled:opacity-60"
                                >
                                  <CreditCard className="w-3.5 h-3.5" />
                                  <span>{payingOrderId === order.id ? 'Opening Chapa...' : 'Pay Now (Chapa)'}</span>
                                </button>
                              ) : null}
                            </div>
                          )}

                          {(order.paymentMethod === 'cod' || order.paymentMethod === 'cop') && order.paymentStatus !== 'paid' && (
                            <p className="text-[10px] text-amber-700 font-medium">
                              💵 Pay <strong>{formatETB(order.totalETB)}</strong> in cash upon {order.fulfillmentType === 'delivery' ? 'delivery' : 'pickup'}.
                            </p>
                          )}
                        </div>

                        <div className="space-y-1">
                          <p className="font-bold text-slate-800 flex items-center gap-1.5">
                            <PhoneCall className="w-3.5 h-3.5 text-slate-600" />
                            Recipient Details
                          </p>
                          <p className="text-slate-600">
                            Name: <strong className="text-slate-800">{order.customerName}</strong>
                          </p>
                          <p className="text-slate-600">
                            Contact: <strong className="text-slate-800">{order.customerPhone}</strong>
                          </p>
                          {order.notes && (
                            <p className="text-[11px] text-slate-500 italic">Notes: "{order.notes}"</p>
                          )}
                        </div>
                      </div>

                      {/* Price Breakdown Footer */}
                      <div className="bg-slate-100 p-3 rounded-xl border border-slate-200 space-y-1 text-xs">
                        <div className="flex justify-between text-slate-600">
                          <span>Items Subtotal</span>
                          <span className="font-bold text-slate-900">{formatETB(order.subtotalETB)}</span>
                        </div>
                        {order.deliveryFeeETB > 0 && (
                          <div className="flex justify-between text-slate-600">
                            <span>Delivery Fee</span>
                            <span className="font-bold text-slate-900">{formatETB(order.deliveryFeeETB)}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-slate-900 text-sm pt-1.5 border-t border-slate-200 font-extrabold">
                          <span>Order Total</span>
                          <span className="text-emerald-700">{formatETB(order.totalETB)}</span>
                        </div>
                      </div>

                      {/* Order Action Buttons */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200">
                        {isEditable ? (
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-[11px] text-amber-700 font-medium">
                              You can adjust item quantities or cancel while Pending.
                            </span>
                            <button
                              onClick={() => cancelOrder(order.id)}
                              className="px-3.5 py-2 bg-rose-100 hover:bg-rose-200 text-rose-800 border border-rose-300 font-bold text-xs rounded-xl flex items-center gap-1.5 min-h-[36px] transition-colors"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Cancel Order</span>
                            </button>
                          </div>
                        ) : (
                          <p className="text-[11px] text-slate-500 italic">
                            Order is confirmed or being prepared. Modifications are locked.
                          </p>
                        )}

                        {existingReturn && (
                          <div className="w-full sm:w-auto flex flex-col gap-1 bg-amber-50 p-2.5 rounded-xl border border-amber-200 text-xs">
                            <div className="flex items-center gap-2">
                              <RotateCcw className="w-4 h-4 text-amber-600 shrink-0" />
                              <div>
                                <span className="font-bold text-amber-950">
                                  Quality Claim #{existingReturn.id}:{' '}
                                </span>
                                <span
                                  className={`font-bold capitalize ${
                                    existingReturn.status === 'approved' || existingReturn.status === 'resolved'
                                      ? 'text-emerald-700'
                                      : existingReturn.status === 'rejected'
                                      ? 'text-rose-700'
                                      : existingReturn.status === 'investigating'
                                      ? 'text-blue-700'
                                      : 'text-amber-800'
                                  }`}
                                >
                                  {existingReturn.status.replace(/_/g, ' ')}
                                  {existingReturn.adminResolution ? ` (${existingReturn.adminResolution})` : ''}
                                </span>
                              </div>
                            </div>
                            {existingReturn.refundAmountETB ? (
                              <p className="text-[11px] text-emerald-800 font-bold ml-6">
                                Refund Credited: {formatETB(existingReturn.refundAmountETB)}
                              </p>
                            ) : null}
                            {existingReturn.adminResponseNotes && (
                              <p className="text-[11px] text-slate-600 italic ml-6 bg-white/70 p-1.5 rounded-lg border border-amber-200/50">
                                Note from shop: "{existingReturn.adminResponseNotes}"
                              </p>
                            )}
                          </div>
                        )}

                        {canReturnReport && (
                          <button
                            onClick={() => onOpenReturnReport(order)}
                            className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 min-h-[36px] transition-colors"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>File Same-Day Return</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>
            );
          })
          )}
        </div>
      </div>
    </div>
  );
};
