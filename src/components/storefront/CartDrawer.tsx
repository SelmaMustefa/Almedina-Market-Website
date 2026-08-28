import React from 'react';
import { useApp } from '../../context/AppContext';
import { formatETB } from '../../utils/distance';
import { ALMADINA_SHOP_LOCATION } from '../../data/mockData';
import { X, Trash2, Plus, Minus, ShoppingCart, TriangleAlert as AlertTriangle, ArrowRight, ShieldCheck, Truck, Store } from 'lucide-react';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onProceedToCheckout: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  onProceedToCheckout,
}) => {
  const {
    cart,
    updateCartQuantity,
    removeFromCart,
    clearCart,
    userRole,
    setAuthModalOpen,
    setAuthRedirectMessage,
  } = useApp();

  if (!isOpen) return null;

  const subtotal = cart.reduce((sum, item) => sum + item.product.priceETB * item.quantity, 0);

  const hasUnavailableItem = cart.some(
    (item) => item.isUnavailableInCart || !item.product.isAvailable || item.product.stockCount < item.quantity
  );

  const deliveryMinMet = subtotal >= ALMADINA_SHOP_LOCATION.minDeliverySubtotalETB;

  const handleCheckoutClick = () => {
    if (userRole === 'guest') {
      setAuthRedirectMessage('Please register or log in before proceeding to checkout.');
      setAuthModalOpen(true);
      return;
    }
    if (cart.length === 0) return;
    onProceedToCheckout();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex justify-end">
      <div className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col justify-between animate-slide-left relative border-l border-slate-200">
        {/* Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-emerald-400" />
            <h2 className="font-bold text-sm">Shopping Cart ({cart.length})</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.length === 0 ? (
            <div className="text-center py-16 space-y-4">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                <ShoppingCart className="w-8 h-8" />
              </div>
              <p className="font-bold text-slate-700 text-sm">Your cart is empty</p>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                Browse our catalog of imported dates, basmati rice, dairy, spices, and more.
              </p>
            </div>
          ) : (
            <>
              {/* Unavailable Item Alert if any */}
              {hasUnavailableItem && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">Stock Update</p>
                    <p className="text-[11px] text-rose-700">
                      An item in your cart just went out of stock or the available quantity changed. Please remove it or adjust the quantity to continue.
                    </p>
                  </div>
                </div>
              )}

              {cart.map((item) => {
                const prod = item.product;
                const isOutOfStock = !prod.isAvailable || prod.stockCount < item.quantity;

                return (
                  <div
                    key={prod.id}
                    className={`p-3 rounded-xl border flex gap-3 transition-colors ${
                      isOutOfStock
                        ? 'bg-rose-50/50 border-rose-200'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <img
                      src={prod.image}
                      alt={prod.name}
                      referrerPolicy="no-referrer"
                      className="w-16 h-16 object-cover rounded-lg bg-slate-100 border shrink-0"
                    />

                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between gap-1">
                          <h4 className="font-bold text-xs text-slate-900 line-clamp-1">
                            {prod.name}
                          </h4>
                          <button
                            onClick={() => removeFromCart(prod.id)}
                            className="text-slate-400 hover:text-rose-600 p-0.5"
                            title="Remove"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <p className="text-[11px] text-slate-500">{prod.unit}</p>

                        {isOutOfStock && (
                          <span className="text-[10px] font-bold text-rose-600 bg-rose-100 px-1.5 py-0.5 rounded">
                            Exceeds available stock ({prod.stockCount} available)
                          </span>
                        )}
                      </div>

                      {/* Quantity & Item Subtotal */}
                      <div className="flex items-center justify-between pt-1">
                        <div className="flex items-center bg-slate-100 border border-slate-200 rounded-lg">
                          <button
                            onClick={() => updateCartQuantity(prod.id, item.quantity - 1)}
                            className="p-1 text-slate-600 hover:bg-slate-200 rounded-l-lg"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <input
                            type="number"
                            min="1"
                            max={prod.stockCount}
                            step="1"
                            value={item.quantity || ''}
                            onKeyDown={(e) => {
                              if (['e', 'E', '+', '-', '.'].includes(e.key)) e.preventDefault();
                            }}
                            onChange={(e) => {
                              const cleaned = e.target.value.replace(/\D/g, '');
                              const val = cleaned ? parseInt(cleaned, 10) : 1;
                              updateCartQuantity(prod.id, Math.min(prod.stockCount || 999, Math.max(1, val)));
                            }}
                            className="w-10 text-center text-xs font-bold text-slate-900 bg-transparent focus:outline-none focus:bg-white"
                          />
                          <button
                            onClick={() => updateCartQuantity(prod.id, item.quantity + 1)}
                            className="p-1 text-slate-600 hover:bg-slate-200 rounded-r-lg"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        <p className="font-bold text-xs text-slate-900">
                          {formatETB(prod.priceETB * item.quantity)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>

        {/* Footer: Order Summary & Checkout Trigger */}
        {cart.length > 0 && (
          <div className="p-4 bg-slate-50 border-t border-slate-200 space-y-3">
            {/* Delivery Subtotal Requirement Indicator */}
            <div
              className={`p-2.5 rounded-xl text-xs border flex items-center justify-between ${
                deliveryMinMet
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-amber-50 border-amber-200 text-amber-800'
              }`}
            >
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  Delivery Minimum: <strong>1,000 Br</strong>
                </span>
              </div>
              <span className="font-bold">
                {deliveryMinMet ? 'Met ✓' : `${1000 - subtotal} Br needed`}
              </span>
            </div>

            <div className="space-y-1 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Product Subtotal</span>
                <span className="font-semibold text-slate-900">{formatETB(subtotal)}</span>
              </div>
              <div className="flex justify-between text-slate-500 text-[11px]">
                <span>Delivery Fee</span>
                <span>Calculated at checkout</span>
              </div>
              <div className="flex justify-between text-slate-500 text-[11px]">
                <span>Shop Pickup</span>
                <span className="text-emerald-700 font-bold">Free (No Minimum)</span>
              </div>
            </div>

            <button
              disabled={hasUnavailableItem}
              onClick={handleCheckoutClick}
              className={`w-full py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all ${
                hasUnavailableItem
                  ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                  : 'bg-emerald-700 hover:bg-emerald-800 text-white'
              }`}
            >
              <span>Proceed to Checkout</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={clearCart}
              className="w-full text-center text-[11px] text-slate-500 hover:text-rose-600 font-medium"
            >
              Empty Cart
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
