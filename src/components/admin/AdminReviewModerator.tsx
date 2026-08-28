import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Star, CheckCircle2, XCircle, MessageSquare, FileImage, ExternalLink } from 'lucide-react';
import { formatDate } from '../../utils/distance';

export const AdminReviewModerator: React.FC = () => {
  const { reviews, moderateReview, products } = useApp();
  const [activePhotoModal, setActivePhotoModal] = useState<string | null>(null);

  const pendingReviews = reviews.filter((r) => r.status === 'pending_approval');
  const moderatedReviews = reviews.filter((r) => r.status !== 'pending_approval');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-amber-500" />
          <span>Verified Review Moderation Queue</span>
        </h2>
        <p className="text-xs text-slate-500">
          Approve or reject customer reviews. Only verified completed purchases are eligible for review submission.
        </p>
      </div>

      {/* Pending Queue */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
          <MessageSquare className="w-4 h-4 text-amber-500" />
          Pending Approval Queue ({pendingReviews.length})
        </h3>

        {pendingReviews.length === 0 ? (
          <p className="text-xs text-slate-500 italic p-6 text-center bg-slate-50 rounded-xl">
            ✓ Moderation queue is empty. No pending customer reviews!
          </p>
        ) : (
          <div className="space-y-3">
            {pendingReviews.map((rev) => {
              const prod = products.find((p) => p.id === rev.productId);

              return (
                <div
                  key={rev.id}
                  className="p-4 bg-amber-50/40 rounded-xl border border-amber-200 text-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-slate-900">{rev.userName}</span>
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold border border-emerald-300">
                        Verified Purchase ✓
                      </span>
                      {rev.userEmail && (
                        <span className="text-[11px] text-slate-400">({rev.userEmail})</span>
                      )}
                    </div>

                    <div className="flex items-center gap-2.5">
                      {prod?.image && (
                        <img
                          src={prod.image}
                          alt={prod.name}
                          referrerPolicy="no-referrer"
                          className="w-8 h-8 rounded-lg object-cover border border-slate-200"
                        />
                      )}
                      <p className="text-slate-700 font-medium">
                        Product: <strong>{prod?.name || rev.productId}</strong>
                      </p>
                    </div>

                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3.5 h-3.5 ${
                            i < rev.rating
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-slate-300'
                          }`}
                        />
                      ))}
                      <span className="text-[11px] text-slate-500 ml-2">
                        Submitted: {formatDate(rev.createdAt)}
                      </span>
                    </div>

                    <p className="text-slate-800 font-normal italic pt-1 bg-white p-2.5 rounded-lg border border-slate-200">
                      "{rev.comment}"
                    </p>

                    {rev.photoUrl && (
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setActivePhotoModal(rev.photoUrl || null)}
                          className="flex items-center gap-1.5 text-xs text-amber-800 font-bold bg-amber-100/70 hover:bg-amber-200 px-2.5 py-1 rounded-lg border border-amber-300 transition-colors"
                        >
                          <FileImage className="w-3.5 h-3.5 text-amber-700" />
                          <span>View Review Photo Evidence</span>
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                    <button
                      onClick={() => moderateReview(rev.id, 'approved')}
                      className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl flex items-center gap-1.5 shadow-xs transition-colors"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Approve & Publish</span>
                    </button>

                    <button
                      onClick={() => moderateReview(rev.id, 'rejected')}
                      className="px-3.5 py-2 bg-rose-100 hover:bg-rose-200 text-rose-800 font-bold rounded-xl flex items-center gap-1.5 transition-colors"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Reject</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Previously Moderated Queue */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <h3 className="font-bold text-sm text-slate-900">Moderation History ({moderatedReviews.length})</h3>
        <div className="space-y-2 max-h-72 overflow-y-auto pr-1 text-xs">
          {moderatedReviews.map((rev) => {
            const prod = products.find((p) => p.id === rev.productId);

            return (
              <div
                key={rev.id}
                className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-3"
              >
                <div className="space-y-0.5">
                  <p className="font-bold text-slate-800">
                    {rev.userName} • {prod?.name || 'Product'} • Rating: {rev.rating}/5 ⭐️
                  </p>
                  <p className="text-slate-600 text-[11px] italic">"{rev.comment}"</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {rev.photoUrl && (
                    <button
                      onClick={() => setActivePhotoModal(rev.photoUrl || null)}
                      className="text-slate-500 hover:text-slate-800 p-1"
                      title="View review photo"
                    >
                      <FileImage className="w-4 h-4" />
                    </button>
                  )}
                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                      rev.status === 'approved'
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                        : 'bg-rose-100 text-rose-800 border-rose-300'
                    }`}
                  >
                    {rev.status.toUpperCase()}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Photo Viewer Modal */}
      {activePhotoModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-4 max-w-lg w-full space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-900 text-sm">Review Photo Attachment</h4>
              <button
                onClick={() => setActivePhotoModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <div className="rounded-xl overflow-hidden bg-slate-100 border border-slate-200 max-h-[70vh]">
              <img
                src={activePhotoModal}
                alt="Review evidence"
                referrerPolicy="no-referrer"
                className="w-full h-full object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
