import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Star, MessageSquare, CheckCircle2, Plus, Sparkles, Quote } from 'lucide-react';
import { ReviewSubmissionModal } from './ReviewSubmissionModal';
import { Product } from '../../types';

export const CustomerReviewsSection: React.FC = () => {
  const { reviews, products, currentUser, submitReview } = useApp();
  const [reviewModalProduct, setReviewModalProduct] = useState<Product | null>(null);
  const [isStoreReviewOpen, setIsStoreReviewOpen] = useState(false);

  // Filter approved reviews & get last 3 (newest first)
  const approvedReviews = reviews
    .filter((r) => r.status === 'approved')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const last3Reviews = approvedReviews.slice(0, 3);

  // Store Review Modal state
  const [storeRating, setStoreRating] = useState(5);
  const [storeComment, setStoreComment] = useState('');
  const [storeReviewStatus, setStoreReviewStatus] = useState<string | null>(null);

  const handleOpenReview = () => {
    // Select the first product as a target or open store review
    if (products.length > 0) {
      setReviewModalProduct(products[0]);
    } else {
      setIsStoreReviewOpen(true);
    }
  };

  const handleSubmitGeneralReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeComment || storeComment.trim().length < 5) {
      setStoreReviewStatus('Please write at least 5 characters for your review.');
      return;
    }

    const defaultProdId = products[0]?.id || 'prod-1';
    const targetOrderId = 'ord-101'; // Default completed order reference
    submitReview(defaultProdId, targetOrderId, storeRating, storeComment.trim());
    setStoreComment('');
    setIsStoreReviewOpen(false);
    setStoreReviewStatus(null);
  };

  return (
    <section id="reviews" className="scroll-mt-24 bg-gradient-to-br from-[#FAF8F0] via-white to-emerald-50/40 border border-[#1A1A1A]/10 rounded-3xl p-6 sm:p-10 space-y-6 shadow-sm">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-emerald-900/10 pb-5">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
            <span>Verified Customer Reviews</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold font-serif text-[#1A1A1A]">
            What Our Customers Say
          </h2>
          <p className="text-xs sm:text-sm text-[#1A1A1A]/70 max-w-xl">
            Real feedback from verified buyers. Reviews undergo admin moderation before being displayed on the storefront.
          </p>
        </div>

        <button
          onClick={handleOpenReview}
          className="self-start sm:self-auto px-4 py-2.5 bg-[#1A1A1A] hover:bg-emerald-900 text-[#FDFCF5] text-xs font-bold rounded-xl transition-all shadow-md flex items-center gap-2"
        >
          <Plus className="w-4 h-4 text-emerald-400" />
          <span>Write a Review</span>
        </button>
      </div>

      {/* Last 3 Approved Reviews Display */}
      {last3Reviews.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-300 p-6 space-y-2">
          <MessageSquare className="w-8 h-8 text-slate-400 mx-auto" />
          <p className="font-bold text-slate-700 text-sm">No approved reviews yet</p>
          <p className="text-xs text-slate-500">
            Submit a review after completing your order! All reviews are moderated by store administration before appearing here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {last3Reviews.map((rev) => {
            const prod = products.find((p) => p.id === rev.productId);
            return (
              <div
                key={rev.id}
                className="bg-white rounded-2xl border border-emerald-100 p-5 space-y-3.5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden group"
              >
                <Quote className="absolute top-3 right-3 w-12 h-12 text-emerald-500/10 pointer-events-none group-hover:text-emerald-500/20 transition-colors" />

                <div className="space-y-3">
                  {/* Star Rating */}
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-4 h-4 ${
                          star <= rev.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'
                        }`}
                      />
                    ))}
                    <span className="text-xs font-extrabold text-slate-900 ml-1.5">{rev.rating}.0</span>
                  </div>

                  {/* Comment */}
                  <p className="text-xs text-slate-800 italic leading-relaxed">
                    "{rev.comment}"
                  </p>
                </div>

                {/* Reviewer Details */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-xs text-slate-900 flex items-center gap-1">
                      {rev.userName}
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 inline shrink-0" title="Verified Purchaser" />
                    </p>
                    <p className="text-[10px] text-slate-500">
                      {prod ? prod.name : 'Almedina Store Review'}
                    </p>
                  </div>
                  <span className="text-[10px] text-emerald-800 bg-emerald-50 border border-emerald-200 font-bold px-2 py-0.5 rounded-full">
                    Approved
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Review Submission Modal for Specific Product */}
      {reviewModalProduct && (
        <ReviewSubmissionModal
          isOpen={Boolean(reviewModalProduct)}
          product={reviewModalProduct}
          onClose={() => setReviewModalProduct(null)}
        />
      )}

      {/* General Store Review Modal */}
      {isStoreReviewOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-slate-200 animate-fade-in my-4">
            <div className="p-4 bg-emerald-950 text-white flex items-center justify-between border-b border-emerald-800">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-sm">Submit Store Review</h3>
              </div>
              <button onClick={() => setIsStoreReviewOpen(false)} className="p-1 rounded text-emerald-300 hover:text-white">
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitGeneralReview} className="p-6 space-y-4 text-xs">
              {storeReviewStatus && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-[11px]">
                  {storeReviewStatus}
                </div>
              )}

              <div className="space-y-1">
                <label className="font-bold text-slate-800 block">Rating (1 to 5 Stars)</label>
                <div className="flex items-center gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200 justify-center">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button type="button" key={star} onClick={() => setStoreRating(star)} className="p-1 transition-transform hover:scale-125">
                      <Star className={`w-7 h-7 ${star <= storeRating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} />
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-800 block">Your Feedback / Review</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Share your experience with product freshness, speed of delivery, or customer service..."
                  value={storeComment}
                  onChange={(e) => setStoreComment(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900 focus:outline-none focus:border-emerald-600"
                />
              </div>

              <p className="text-[11px] text-slate-500 italic">
                Note: Submitted reviews will undergo admin moderation before being displayed publicly.
              </p>

              <div className="pt-2 flex items-center gap-3">
                <button type="button" onClick={() => setIsStoreReviewOpen(false)} className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl">
                  Cancel
                </button>
                <button type="submit" className="flex-1 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl shadow-md flex items-center justify-center gap-1">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Submit Review</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};
