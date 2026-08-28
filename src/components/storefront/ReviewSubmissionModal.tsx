import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Product, Order } from '../../types';
import {
  Star,
  MessageSquare,
  AlertTriangle,
  CheckCircle2,
  X,
  Camera,
  Upload,
  Trash2,
  PackageCheck,
} from 'lucide-react';

interface ReviewSubmissionModalProps {
  isOpen: boolean;
  product: Product | null;
  order?: Order | null;
  onClose: () => void;
}

export const ReviewSubmissionModal: React.FC<ReviewSubmissionModalProps> = ({
  isOpen,
  product,
  order,
  onClose,
}) => {
  const { orders, submitReview, currentUser } = useApp();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [selectedOrderId, setSelectedOrderId] = useState<string>('');
  const [photoUrl, setPhotoUrl] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Retrieve placed order IDs stored in session/localStorage
  const sessionPlacedOrderIds: string[] = (() => {
    try {
      const saved = localStorage.getItem('almadina_placed_order_ids');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  })();

  const eligibleOrders = orders.filter((o) => {
    // Check if order belongs to user or session
    const isUserOrder =
      (currentUser && o.userId === currentUser.id) ||
      (currentUser?.email && o.customerEmail?.toLowerCase() === currentUser.email.toLowerCase()) ||
      (currentUser?.phoneNumber && o.customerPhone.includes(currentUser.phoneNumber.replace(/^\+251/, ''))) ||
      sessionPlacedOrderIds.includes(o.id) ||
      o.id === order?.id;

    if (!isUserOrder) return false;
    if (o.orderStatus !== 'completed') return false;

    // Check if product is in order
    if (!product) return false;
    const hasProduct = o.items.some(
      (i) =>
        i.productId === product.id ||
        i.productName.toLowerCase() === product.name.toLowerCase()
    );
    return hasProduct;
  });

  useEffect(() => {
    if (order && order.orderStatus === 'completed') {
      setSelectedOrderId(order.id);
    } else if (eligibleOrders.length > 0) {
      setSelectedOrderId(eligibleOrders[0].id);
    }
  }, [order, eligibleOrders.length]);

  if (!isOpen || !product) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      setErrorMessage('Image file is too large. Please select an image under 8MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setPhotoUrl(reader.result);
        setErrorMessage(null);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const activeOrderId = selectedOrderId || (eligibleOrders.length > 0 ? eligibleOrders[0].id : order?.id || '');

    if (!activeOrderId) {
      setErrorMessage('Verified purchase required: You must have a completed order containing this product.');
      return;
    }
    if (!comment || comment.trim().length < 5) {
      setErrorMessage('Please write a review comment (minimum 5 characters).');
      return;
    }

    setIsSubmitting(true);
    const result = submitReview(
      product.id,
      activeOrderId,
      rating,
      comment.trim(),
      photoUrl.trim() || undefined
    );
    setIsSubmitting(false);

    if (!result.success) {
      setErrorMessage(result.message);
      return;
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-slate-200 animate-fade-in my-auto flex flex-col max-h-[calc(100dvh-2rem)]">
        {/* Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-amber-400" />
            <h2 className="font-bold text-sm">Submit Verified Purchase Review</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs overflow-y-auto flex-1">
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <p className="text-[11px] leading-relaxed font-medium">{errorMessage}</p>
            </div>
          )}

          {/* Product Info Card */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex items-center gap-3">
            <img
              src={product.image}
              alt={product.name}
              referrerPolicy="no-referrer"
              className="w-12 h-12 rounded-lg object-cover border border-slate-200 bg-white shrink-0"
            />
            <div className="space-y-0.5">
              <p className="font-bold text-slate-900 text-sm">{product.name}</p>
              {product.arabicName && (
                <p className="text-[11px] text-slate-400 font-arabic">{product.arabicName}</p>
              )}
              <p className="text-[11px] text-slate-500 font-medium">
                {product.unit} • {product.origin}
              </p>
            </div>
          </div>

          {/* Order Selection */}
          <div className="space-y-1">
            <label className="font-bold text-slate-800 flex items-center gap-1.5">
              <PackageCheck className="w-4 h-4 text-emerald-600" />
              <span>Verified Completed Order</span>
            </label>
            {eligibleOrders.length === 0 && !order ? (
              <p className="text-amber-800 bg-amber-50 p-2.5 rounded-lg border border-amber-200 text-[11px] leading-relaxed">
                No completed orders found containing this item in your account. Only customers with completed purchases can review products.
              </p>
            ) : (
              <select
                value={selectedOrderId || (eligibleOrders.length > 0 ? eligibleOrders[0].id : order?.id || '')}
                onChange={(e) => setSelectedOrderId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 font-medium text-slate-900 focus:outline-none focus:border-emerald-600"
              >
                {eligibleOrders.map((o) => (
                  <option key={o.id} value={o.id}>
                    Order #{o.orderNumber} ({o.fulfillmentType === 'delivery' ? 'Delivered' : 'Picked Up'})
                  </option>
                ))}
                {order && !eligibleOrders.some((o) => o.id === order.id) && (
                  <option value={order.id}>Order #{order.orderNumber} (Selected Order)</option>
                )}
              </select>
            )}
          </div>

          {/* Rating Stars */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-800 block text-center">Your Rating</label>
            <div className="flex items-center gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200 justify-center">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setRating(star)}
                  className="p-1 transition-transform hover:scale-125 focus:outline-none"
                >
                  <Star
                    className={`w-7 h-7 ${
                      star <= rating
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-slate-300 hover:text-amber-200'
                    }`}
                  />
                </button>
              ))}
            </div>
            <p className="text-center font-bold text-slate-700 text-xs">
              {rating === 5 && '⭐️⭐️⭐️⭐️⭐️ Outstanding & Highly Recommended'}
              {rating === 4 && '⭐️⭐️⭐️⭐️ Very Good Quality'}
              {rating === 3 && '⭐️⭐️⭐️ Satisfactory / Average'}
              {rating === 2 && '⭐️⭐️ Below Expectations'}
              {rating === 1 && '⭐️ Poor Experience'}
            </p>
          </div>

          {/* Comment Text */}
          <div className="space-y-1">
            <label className="font-bold text-slate-800 block">Your Review & Experience</label>
            <textarea
              rows={3}
              placeholder="Share details regarding quality, freshness, aroma, packaging, and delivery speed..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900 focus:outline-none focus:border-emerald-600"
            />
          </div>

          {/* Optional Review Photo */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-800 flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5 text-slate-600" />
                <span>Add Photo of Product (Optional)</span>
              </label>
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload</span>
              </button>
            </div>

            {photoUrl && (
              <div className="relative w-full h-28 bg-slate-100 rounded-xl overflow-hidden border border-slate-200 group">
                <img
                  src={photoUrl}
                  alt="Review preview"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => setPhotoUrl('')}
                  className="absolute top-2 right-2 p-1 bg-rose-600 text-white rounded-lg hover:bg-rose-700 shadow-sm"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          <p className="text-[11px] text-slate-400 italic">
            Reviews are verified and will be published to the storefront upon moderation review.
          </p>

          {/* Actions */}
          <div className="pt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl min-h-[44px]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || (eligibleOrders.length === 0 && !order)}
              className={`flex-1 py-2.5 text-white font-bold rounded-xl shadow-md flex items-center justify-center gap-1.5 min-h-[44px] transition-colors ${
                eligibleOrders.length === 0 && !order
                  ? 'bg-slate-300 cursor-not-allowed'
                  : 'bg-emerald-700 hover:bg-emerald-800'
              }`}
            >
              {isSubmitting ? (
                <span>Submitting...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Submit Review</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
