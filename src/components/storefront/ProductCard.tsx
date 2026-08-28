import React from 'react';
import { Product } from '../../types';
import { useApp } from '../../context/AppContext';
import { formatETB } from '../../utils/distance';
import { Star, Heart, ShoppingCart, TriangleAlert as AlertTriangle, Sparkles, Check } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  onSelect: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onSelect }) => {
  const { cart, favorites, toggleFavorite, addToCart } = useApp();

  const isFavorite = favorites.includes(product.id);
  const cartItem = cart.find((c) => c.product.id === product.id);
  const cartQuantity = cartItem ? cartItem.quantity : 0;

  const isLowStock = product.stockCount > 0 && product.stockCount <= product.lowStockThreshold;
  const isOutOfStock = !product.isAvailable || product.stockCount <= 0;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md dark:shadow-none dark:hover:border-slate-700 transition-all duration-200 overflow-hidden flex flex-col justify-between group relative">
      {/* Image */}
      <div className="relative bg-slate-50 dark:bg-slate-800/60 aspect-[4/3] overflow-hidden cursor-pointer" onClick={() => onSelect(product)}>
        <img
          src={product.image}
          alt={product.name}
          referrerPolicy="no-referrer"
          className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ${isOutOfStock ? 'grayscale opacity-60' : ''}`}
        />
        <div className="absolute top-2 left-2 flex flex-col gap-1 items-start">
          {isOutOfStock ? (
            <span className="bg-rose-900/90 text-rose-100 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">Out of Stock</span>
          ) : isLowStock ? (
            <span className="bg-amber-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />Only {product.stockCount} Left
            </span>
          ) : null}
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); toggleFavorite(product.id); }}
          className={`absolute top-2 right-2 p-2 rounded-full backdrop-blur-md transition-all shadow-sm ${isFavorite ? 'bg-rose-500 text-white' : 'bg-white/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 hover:text-rose-500'}`}
        >
          <Heart className="w-4 h-4 fill-current" />
        </button>
      </div>

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div className="space-y-1.5 cursor-pointer" onClick={() => onSelect(product)}>
          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            <span>{product.unit}</span>
            <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-bold">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              {product.rating} ({product.reviewCount})
            </span>
          </div>
          <h3 className="font-bold text-slate-900 dark:text-slate-100 text-xs sm:text-sm line-clamp-2 leading-snug group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
            {product.name}
          </h3>
          {product.arabicName && (
            <p className="text-[11px] text-slate-400 dark:text-slate-500 font-normal">{product.arabicName}</p>
          )}
          <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">{product.origin}</p>
        </div>

        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
          <div>
            <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">Price</p>
            <p className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-slate-100">{formatETB(product.priceETB)}</p>
          </div>
          <button
            disabled={isOutOfStock}
            onClick={() => addToCart(product, 1)}
            className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm min-h-[40px] ${
              isOutOfStock
                ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed border border-slate-200 dark:border-slate-700'
                : cartQuantity > 0
                ? 'bg-emerald-800 dark:bg-emerald-700 text-white hover:bg-emerald-900 dark:hover:bg-emerald-600'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
            }`}
          >
            {cartQuantity > 0 ? (
              <><Check className="w-4 h-4 text-emerald-300" /><span>In Cart ({cartQuantity})</span></>
            ) : (
              <><ShoppingCart className="w-4 h-4" /><span>Add</span></>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
