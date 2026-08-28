import React, { useState } from 'react';
import { Product } from '../../types';
import { useApp } from '../../context/AppContext';
import { formatETB } from '../../utils/distance';
import {
  X, Star, Heart, ShoppingCart, Sparkles, ShieldCheck, MapPin, Check, Plus, Minus, MessageSquare,
} from 'lucide-react';

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
  onOpenReviewModal: (product: Product) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  onClose,
  onOpenReviewModal,
}) => {
  const { products, reviews, favorites, toggleFavorite, addToCart } = useApp();
  const [quantity, setQuantity] = useState(1);

  if (!product) return null;

  const isFavorite = favorites.includes(product.id);
  const isOutOfStock = !product.isAvailable || product.stockCount <= 0;
  const approvedReviews = reviews.filter((r) => r.productId === product.id && r.status === 'approved');
  const relatedProducts = products.filter((p) => p.categoryId === product.categoryId && p.id !== product.id).slice(0, 3);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 my-auto animate-fade-in relative max-h-[calc(100dvh-2rem)] overflow-y-auto">
        <button onClick={onClose} className="absolute top-4 right-4 z-10 p-2 rounded-full bg-slate-900/40 hover:bg-slate-900/70 text-white backdrop-blur-sm transition-colors">
          <X className="w-5 h-5" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-0">
          {/* Image */}
          <div className="md:col-span-5 bg-slate-100 dark:bg-slate-800 relative p-6 flex items-center justify-center min-h-[240px] sm:min-h-[280px]">
            <img src={product.image} alt={product.name} referrerPolicy="no-referrer" className="max-h-56 sm:max-h-64 object-contain rounded-xl shadow-md" />
          </div>

          {/* Details */}
          <div className="md:col-span-7 p-5 sm:p-6 flex flex-col justify-between space-y-4 text-slate-900 dark:text-slate-100">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium flex-wrap gap-2">
                <span className="bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700">Unit: {product.unit}</span>
                <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-bold bg-amber-50 dark:bg-amber-950/50 px-2.5 py-1 rounded-md border border-amber-200 dark:border-amber-800/50">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />{product.rating} ({product.reviewCount} Reviews)
                </span>
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 leading-snug">{product.name}</h2>
              {product.arabicName && <p className="text-sm text-emerald-800 dark:text-emerald-400 font-semibold">{product.arabicName}</p>}
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{product.description}</p>
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400 pt-1">
                <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-emerald-600" />Origin: <strong className="text-slate-800 dark:text-slate-200">{product.origin}</strong></span>
                <span className="flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />Available: <strong className="text-slate-800 dark:text-slate-200">{isOutOfStock ? 'Out of Stock' : 'In Stock'}</strong></span>
              </div>
            </div>

            {/* Price & Add to Cart */}
            <div className="bg-slate-50 dark:bg-slate-850 p-4 rounded-xl border border-slate-200 dark:border-slate-750 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-400 font-medium">Unit Price</p>
                  <p className="text-2xl font-black text-slate-900 dark:text-slate-100">{formatETB(product.priceETB)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-300">Qty:</span>
                  <div className="flex items-center bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg overflow-hidden">
                    <button onClick={() => setQuantity((q) => Math.max(1, q - 1))} className="p-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 min-w-[32px] min-h-[32px] flex items-center justify-center">
                      <Minus className="w-4 h-4" />
                    </button>
                    <input
                      type="number"
                      min="1"
                      max={product.stockCount}
                      step="1"
                      value={quantity || ''}
                      onKeyDown={(e) => {
                        if (['e', 'E', '+', '-', '.'].includes(e.key)) e.preventDefault();
                      }}
                      onChange={(e) => {
                        const cleaned = e.target.value.replace(/\D/g, '');
                        const val = cleaned ? parseInt(cleaned, 10) : 1;
                        setQuantity(Math.min(product.stockCount || 999, Math.max(1, val)));
                      }}
                      className="w-12 text-center text-xs font-bold text-slate-900 dark:text-slate-100 bg-transparent focus:outline-none"
                    />
                    <button onClick={() => setQuantity((q) => Math.min(product.stockCount, q + 1))} className="p-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 min-w-[32px] min-h-[32px] flex items-center justify-center">
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  disabled={isOutOfStock}
                  onClick={() => addToCart(product, quantity)}
                  className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-md transition-all min-h-[44px] ${isOutOfStock ? 'bg-slate-200 dark:bg-slate-800 text-slate-500 cursor-not-allowed' : 'bg-emerald-700 hover:bg-emerald-800 text-white'}`}
                >
                  <ShoppingCart className="w-4 h-4" />
                  <span>{isOutOfStock ? 'Out of Stock' : `Add ${quantity} to Cart • ${formatETB(product.priceETB * quantity)}`}</span>
                </button>
                <button
                  onClick={() => toggleFavorite(product.id)}
                  className={`p-3 rounded-xl border transition-all min-h-[44px] min-w-[44px] flex items-center justify-center ${isFavorite ? 'bg-rose-500 border-rose-500 text-white' : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                >
                  <Heart className="w-5 h-5 fill-current" />
                </button>
              </div>
            </div>

            {/* Reviews */}
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4 text-emerald-600" />Verified Reviews ({approvedReviews.length})
                </h4>
                <button onClick={() => onOpenReviewModal(product)} className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 hover:underline flex items-center gap-1">
                  Write Review
                </button>
              </div>
              {approvedReviews.length === 0 ? (
                <p className="text-xs text-slate-500 dark:text-slate-400 italic bg-slate-50 dark:bg-slate-850 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                  No approved reviews yet. Verified buyers can submit a review after completing an order.
                </p>
              ) : (
                <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                  {approvedReviews.map((rev) => (
                    <div key={rev.id} className="bg-slate-50 dark:bg-slate-850 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800 dark:text-slate-200">{rev.userName}</span>
                        <div className="flex items-center gap-0.5">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className={`w-3 h-3 ${i < rev.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300 dark:text-slate-600'}`} />
                          ))}
                        </div>
                      </div>
                      <p className="text-slate-600 dark:text-slate-300 text-[11px]">{rev.comment}</p>
                      {rev.photoUrl && (
                        <div className="pt-1">
                          <img
                            src={rev.photoUrl}
                            alt="Customer photo"
                            referrerPolicy="no-referrer"
                            className="w-14 h-14 object-cover rounded-lg border border-slate-200 dark:border-slate-700"
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Related */}
            {relatedProducts.length > 0 && (
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2">
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Related Products</p>
                <div className="grid grid-cols-3 gap-2">
                  {relatedProducts.map((rp) => (
                    <div key={rp.id} className="p-2 bg-slate-50 dark:bg-slate-850 hover:bg-emerald-50 dark:hover:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-800 cursor-pointer text-xs transition-colors">
                      <p className="font-bold text-slate-900 dark:text-slate-100 truncate">{rp.name}</p>
                      <p className="text-emerald-700 dark:text-emerald-400 font-extrabold text-[11px]">{formatETB(rp.priceETB)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
