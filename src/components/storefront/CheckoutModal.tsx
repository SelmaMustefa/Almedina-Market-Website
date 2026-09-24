import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { FulfillmentType, PaymentMethod, DeliveryLocation } from '../../types';
import { ALMADINA_SHOP_LOCATION } from '../../data/mockData';
import { calculateDistanceKm, calculateDeliveryFeeETB, formatETB } from '../../utils/distance';
import {
  X,
  Truck,
  Store,
  MapPin,
  CreditCard,
  DollarSign,
  TriangleAlert as AlertTriangle,
  CircleCheck as CheckCircle2,
  ShieldCheck,
  Navigation,
  Loader2,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { BRAND } from '../../constants/brand';
import { GoogleMapsLocationPicker } from './GoogleMapsLocationPicker';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderSuccess?: (orderId: string) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({ isOpen, onClose, onOrderSuccess }) => {
  const { cart, createOrder, currentUser, setViewTab, saveAddress } = useApp();

  const [fulfillmentType, setFulfillmentType] = useState<FulfillmentType>('delivery');
  const [selectedAddressId, setSelectedAddressId] = useState<string | 'new' | 'detect'>('new');
  const [customAddressText, setCustomAddressText] = useState('Bethel Main Road, Addis Ababa');
  const [landmarkText, setLandmarkText] = useState('');
  const [latitude, setLatitude] = useState(8.9833);
  const [longitude, setLongitude] = useState(38.7083);
  const [addressLabel, setAddressLabel] = useState('Home');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('chapa');
  const [orderNotes, setOrderNotes] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [distanceKm, setDistanceKm] = useState(calculateDistanceKm(8.9833, 38.7083));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [chapaRedirectUrl, setChapaRedirectUrl] = useState<string | null>(null);

  if (!isOpen) return null;

  const subtotal = cart.reduce((sum, item) => sum + item.product.priceETB * item.quantity, 0);
  const isOutOfRange = fulfillmentType === 'delivery' && distanceKm > ALMADINA_SHOP_LOCATION.maxDeliveryDistanceKm;
  const isMinSubtotalNotMet = fulfillmentType === 'delivery' && subtotal < ALMADINA_SHOP_LOCATION.minDeliverySubtotalETB;
  const deliveryFee = fulfillmentType === 'delivery' && !isOutOfRange ? calculateDeliveryFeeETB(distanceKm) : 0;
  const total = subtotal + deliveryFee;

  const handleSelectAddress = (addressId: string | 'new' | 'detect') => {
    setSelectedAddressId(addressId);
    setErrorMessage(null);

    if (addressId === 'new') {
      setCustomAddressText('Bethel Main Road, Addis Ababa');
      setLandmarkText('');
      setAddressLabel('Home');
      setLatitude(8.9833);
      setLongitude(38.7083);
      setDistanceKm(calculateDistanceKm(8.9833, 38.7083));
    } else {
      const saved = currentUser?.savedAddresses?.find((a) => a.id === addressId);
      if (saved) {
        setCustomAddressText(saved.addressText);
        setLatitude(saved.latitude);
        setLongitude(saved.longitude);
        const dist = calculateDistanceKm(saved.latitude, saved.longitude);
        setDistanceKm(dist);
        setAddressLabel(saved.label);
        setLandmarkText('');
      }
    }
  };

  const handleSaveLocation = () => {
    if (!addressLabel.trim() || !customAddressText.trim()) {
      setErrorMessage('Please enter both label and address before saving.');
      return;
    }

    const isDuplicate = (currentUser?.savedAddresses || []).some(
      (addr) => Math.abs(addr.latitude - latitude) < 0.001 && Math.abs(addr.longitude - longitude) < 0.001
    );

    if (isDuplicate) {
      setErrorMessage('This location is already saved. Select it from the dropdown instead.');
      return;
    }

    saveAddress({
      label: addressLabel.trim(),
      addressText: customAddressText.trim(),
      latitude,
      longitude,
      distanceKm,
    });

    setErrorMessage(null);
    setAddressLabel('Home');
    setCustomAddressText('');
    setLandmarkText('');
    setSelectedAddressId('new');
  };

  const handleSubmitOrder = async () => {
    setErrorMessage(null);

    if (fulfillmentType === 'delivery') {
      if (distanceKm > ALMADINA_SHOP_LOCATION.maxDeliveryDistanceKm) {
        setErrorMessage(
          `Delivery is only available within ${ALMADINA_SHOP_LOCATION.maxDeliveryDistanceKm} km of our Bethel store (current distance is ${distanceKm.toFixed(1)} km). Please select a closer address or switch to Store Pickup.`
        );
        return;
      }
      if (isMinSubtotalNotMet) {
        setErrorMessage(`Minimum order for delivery is ${formatETB(ALMADINA_SHOP_LOCATION.minDeliverySubtotalETB)}.`);
        return;
      }
    }

    const deliveryLoc: DeliveryLocation | undefined =
      fulfillmentType === 'delivery'
        ? { addressText: customAddressText, landmark: landmarkText, latitude, longitude, distanceKm }
        : undefined;

    setIsSubmitting(true);

    try {
      console.log('[CheckoutModal] Submitting order payload:', {
        fulfillmentType,
        deliveryLocation: deliveryLoc,
        paymentMethod,
        notes: orderNotes,
      });

      const result = await createOrder({
        fulfillmentType,
        deliveryLocation: deliveryLoc,
        paymentMethod,
        notes: orderNotes,
      });

      console.log('[CheckoutModal] createOrder response:', result);

      if (!result.success) {
        setIsSubmitting(false);
        setErrorMessage(result.message);
        return;
      }

      if (result.requiresChapaRedirect && result.chapaCheckoutUrl) {
        // Direct redirect to official Chapa Ethiopian Payment Gateway
        setChapaRedirectUrl(result.chapaCheckoutUrl);
        setTimeout(() => {
          try {
            window.location.href = result.chapaCheckoutUrl!;
          } catch (navErr) {
            console.warn('[Chapa Redirect]', navErr);
          }
        }, 800);
      } else {
        setIsSubmitting(false);
        onClose();
        if (onOrderSuccess && result.orderId) {
          onOrderSuccess(result.orderId);
        }
      }
    } catch (err: any) {
      console.error('[CheckoutModal] Error during order submission:', err);
      setIsSubmitting(false);
      setErrorMessage(err.message || 'Failed to process order.');
    }
  };

  // If redirecting to Chapa, show clean full-page diving transition
  if (chapaRedirectUrl) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
        <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-emerald-500/30 p-8 text-center space-y-6 animate-fade-in">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-emerald-700 to-teal-500 text-white flex items-center justify-center text-3xl font-black mx-auto shadow-xl shadow-emerald-900/30 animate-pulse">
            C
          </div>

          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Chapa Ethiopia Gateway</span>
            </span>
            <h3 className="text-xl font-bold font-serif text-slate-900">
              Connecting to Chapa...
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed max-w-xs mx-auto">
              You are being securely directed to Chapa to complete payment using{' '}
              <strong>Telebirr, CBE Birr, or Debit/Credit Card</strong>.
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-left text-xs space-y-1.5">
            <div className="flex justify-between text-slate-500">
              <span>Amount Due:</span>
              <span className="font-extrabold text-emerald-700 text-sm">{formatETB(total)}</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Merchant:</span>
              <span className="font-medium text-slate-800">{BRAND.name}</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Fulfillment:</span>
              <span className="font-medium text-slate-800 capitalize">{fulfillmentType}</span>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <a
              href={chapaRedirectUrl}
              className="w-full py-3.5 px-5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all min-h-[48px] group"
            >
              <span>Click to Proceed Immediately</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </a>

            <button
              onClick={onClose}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
            >
              Cancel & Return to Cart
            </button>
          </div>

          <p className="text-[11px] text-slate-400">
            🔒 Protected by Chapa 256-bit TLS Gateway Security. You will return here automatically after payment.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden border border-slate-200 my-auto animate-fade-in flex flex-col max-h-[calc(100dvh-2rem)]">
        {/* Header */}
        <div className="p-4 bg-emerald-950 text-white flex items-center justify-between border-b border-emerald-800 shrink-0">
          <div>
            <h2 className="font-bold text-base flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              {BRAND.name} Checkout
            </h2>
            <p className="text-xs text-emerald-300">Bethel, Addis Ababa • Order Details & Location Verification</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          {errorMessage && (
            <div className="p-3.5 bg-rose-50 border border-rose-300 rounded-xl text-xs text-rose-900 flex items-start gap-2 animate-shake">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <p className="font-medium">{errorMessage}</p>
            </div>
          )}

          {/* Delivery Method */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-900 block">1. Select Fulfillment Option</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setFulfillmentType('pickup');
                  if (paymentMethod === 'cod') setPaymentMethod('cop');
                }}
                className={`p-3.5 rounded-xl border text-left flex flex-col justify-between transition-all ${
                  fulfillmentType === 'pickup'
                    ? 'bg-emerald-50 border-emerald-600 ring-2 ring-emerald-600/20'
                    : 'bg-white border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <Store className="w-5 h-5 text-amber-600" />
                  <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded">
                    Free (0 Br)
                  </span>
                </div>
                <div className="mt-2">
                  <p className="font-bold text-xs">Store Pickup</p>
                  <p className="text-[11px] text-slate-500">Pick up at Bethel shop • No minimum</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setFulfillmentType('delivery');
                  if (paymentMethod === 'cop') setPaymentMethod('cod');
                }}
                className={`p-3.5 rounded-xl border text-left flex flex-col justify-between transition-all ${
                  fulfillmentType === 'delivery'
                    ? 'bg-emerald-50 border-emerald-600 ring-2 ring-emerald-600/20'
                    : 'bg-white border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <Truck className="w-5 h-5 text-emerald-600" />
                  <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
                    Within 6.0 km
                  </span>
                </div>
                <div className="mt-2">
                  <p className="font-bold text-xs">Home Delivery</p>
                  <p className="text-[11px] text-slate-500">Min 1,000 Br • Max 6 km radius</p>
                </div>
              </button>
            </div>
          </div>

          {/* Delivery Location Section */}
          {fulfillmentType === 'delivery' ? (
            <div className="space-y-3">
              {(currentUser?.savedAddresses || []).length > 0 && (
                <div className="space-y-1.5 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-emerald-600" />
                    Select Saved Delivery Location
                  </label>
                  <select
                    value={selectedAddressId}
                    onChange={(e) => handleSelectAddress(e.target.value as string | 'new')}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-xs font-medium text-slate-800 focus:outline-none focus:border-emerald-600"
                  >
                    <option value="new">📍 Select on Google Maps (Embed)</option>
                    <optgroup label="Saved Addresses">
                      {(currentUser?.savedAddresses || []).map((addr) => (
                        <option key={addr.id} value={addr.id}>
                          {addr.label} • {addr.addressText.substring(0, 30)}... ({addr.distanceKm.toFixed(1)} km)
                        </option>
                      ))}
                    </optgroup>
                  </select>
                </div>
              )}

              {/* Google Maps Location Picker with 6km Radius Verification */}
              <GoogleMapsLocationPicker
                initialLat={latitude}
                initialLng={longitude}
                initialAddress={customAddressText}
                initialLandmark={landmarkText}
                onSelectLocation={(loc) => {
                  setLatitude(loc.latitude);
                  setLongitude(loc.longitude);
                  setCustomAddressText(loc.addressText);
                  if (loc.landmark) setLandmarkText(loc.landmark);
                  setDistanceKm(loc.distanceKm);
                }}
              />

              {isMinSubtotalNotMet && (
                <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-900 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <p>
                    <strong>Minimum 1,000 Br required for delivery.</strong> Add{' '}
                    {formatETB(ALMADINA_SHOP_LOCATION.minDeliverySubtotalETB - subtotal)} more to qualify.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 text-xs space-y-2">
              <div className="flex items-center gap-2 font-bold text-amber-900">
                <Store className="w-4 h-4 text-amber-600" />
                Store Pickup Location
              </div>
              <p className="text-amber-800 leading-relaxed text-[11px]">
                📍 <strong>{ALMADINA_SHOP_LOCATION.address}</strong> | No minimum order | Free pickup
              </p>
              <p className="text-[11px] text-amber-700">
                Working Hours: {ALMADINA_SHOP_LOCATION.confirmationCallWindow}
              </p>
            </div>
          )}

          {/* Payment Method */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-900 block">2. Select Payment Method</label>
              <span className="text-[10px] text-emerald-800 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                🔒 Secured by Chapa & Local Counter
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Chapa Option */}
              <button
                type="button"
                id="checkout-payment-chapa"
                onClick={() => setPaymentMethod('chapa')}
                className={`p-3.5 rounded-xl border text-left flex flex-col justify-between transition-all ${
                  paymentMethod === 'chapa' || paymentMethod === 'telebirr' || paymentMethod === 'cbe_birr'
                    ? 'bg-emerald-50 border-emerald-600 ring-2 ring-emerald-600/20 shadow-xs'
                    : 'bg-white border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <div className="w-7 h-7 rounded-lg bg-emerald-700 text-white font-black text-xs flex items-center justify-center shadow-xs">
                      C
                    </div>
                    <span className="font-extrabold text-sm text-slate-900">Chapa</span>
                  </div>
                  <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md">
                    Online Pay
                  </span>
                </div>
                <div className="mt-3">
                  <p className="font-bold text-xs text-slate-900">Telebirr, CBE Birr & Cards</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Pay securely via Chapa payment gateway</p>
                </div>
              </button>

              {/* Cash Option */}
              <button
                type="button"
                id="checkout-payment-cash"
                onClick={() => setPaymentMethod('cash')}
                className={`p-3.5 rounded-xl border text-left flex flex-col justify-between transition-all ${
                  paymentMethod === 'cash' || paymentMethod === 'cod' || paymentMethod === 'cop'
                    ? 'bg-amber-50 border-amber-600 ring-2 ring-amber-600/20 shadow-xs'
                    : 'bg-white border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xl">💵</span>
                    <span className="font-extrabold text-sm text-slate-900">Cash</span>
                  </div>
                  <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-md">
                    {fulfillmentType === 'delivery' ? 'On Delivery' : 'At Shop'}
                  </span>
                </div>
                <div className="mt-3">
                  <p className="font-bold text-xs text-slate-900">
                    {fulfillmentType === 'delivery' ? 'Cash on Delivery (COD)' : 'Cash on Pickup (COP)'}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {fulfillmentType === 'delivery'
                      ? 'Pay cash to driver upon delivery'
                      : 'Pay cash at Bethel store counter'}
                  </p>
                </div>
              </button>
            </div>

            {/* Payment Method Context Note */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-600 flex items-center gap-2">
              {(paymentMethod === 'cash' || paymentMethod === 'cod' || paymentMethod === 'cop') && (
                <>
                  <DollarSign className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    You will pay <strong>{formatETB(total)}</strong> in cash {fulfillmentType === 'delivery' ? 'to our driver at your doorstep' : 'at the Bethel shop counter'}. Exact change is appreciated.
                  </span>
                </>
              )}
              {(paymentMethod === 'chapa' || paymentMethod === 'telebirr' || paymentMethod === 'cbe_birr') && (
                <>
                  <CreditCard className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    You will pay <strong>{formatETB(total)}</strong> with <strong>Chapa</strong> (Telebirr, CBE Birr, or cards) after the shop confirms your order.
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Delivery Notes */}
          <div>
            <label className="text-[11px] font-bold text-slate-700 block mb-1">
              Order Notes / Special Instructions (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="e.g., Please call upon arrival at the gate..."
              value={orderNotes}
              onChange={(e) => setOrderNotes(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 shrink-0 space-y-3">
          <div className="space-y-1 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Product Subtotal</span>
              <span className="font-bold text-slate-900">{formatETB(subtotal)}</span>
            </div>
            {fulfillmentType === 'delivery' && (
              <div className="flex justify-between text-slate-600">
                <span>
                  Delivery Fee ({distanceKm.toFixed(1)} km)
                  {isOutOfRange && <span className="text-rose-600 font-bold ml-1">(Exceeds 6km)</span>}
                </span>
                <span className={`font-bold ${isOutOfRange ? 'text-rose-600' : 'text-slate-900'}`}>
                  {isOutOfRange ? 'Unavailable' : formatETB(deliveryFee)}
                </span>
              </div>
            )}
            <div className="flex justify-between text-slate-900 text-sm pt-2 border-t border-slate-200">
              <span className="font-extrabold">Grand Total</span>
              <span className="font-extrabold text-emerald-700">{formatETB(total)}</span>
            </div>
          </div>

          <button
            disabled={isOutOfRange || isMinSubtotalNotMet}
            onClick={handleSubmitOrder}
            className={`w-full py-3.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all min-h-[44px] ${
              isOutOfRange || isMinSubtotalNotMet
                ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                : 'bg-emerald-700 hover:bg-emerald-800 text-white cursor-pointer'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>
              {isOutOfRange
                ? `❌ Delivery Unavailable (> 6.0 km limit)`
                : isMinSubtotalNotMet
                ? `⚠️ Min. ${formatETB(1000)} required for delivery`
                : paymentMethod === 'chapa' || paymentMethod === 'telebirr' || paymentMethod === 'cbe_birr'
                ? `Place Order • ${formatETB(total)}`
                : `Place Cash Order • ${formatETB(total)}`}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
