import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { HelpCircle, Mail, CheckCircle2, Plus, Trash2 } from 'lucide-react';
import { formatDate } from '../../utils/distance';

export const AdminFAQContactManager: React.FC = () => {
  const { faqs, updateFAQ, contactSubmissions, markContactRead } = useApp();

  const [activeTab, setActiveTab] = useState<'faqs' | 'contacts'>('contacts');

  // FAQ Form State
  const [newQ, setNewQ] = useState('');
  const [newA, setNewA] = useState('');
  const [newCat, setNewCat] = useState<'delivery' | 'payment' | 'products' | 'orders'>('delivery');

  const handleAddFAQ = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQ || !newA) return;

    const newFaqItem = {
      id: 'faq-' + Date.now(),
      question: newQ,
      answer: newA,
      category: newCat,
    };

    updateFAQ([...faqs, newFaqItem]);
    setNewQ('');
    setNewA('');
  };

  const handleDeleteFAQ = (id: string) => {
    updateFAQ(faqs.filter((f) => f.id !== id));
  };

  const unreadCount = contactSubmissions.filter((c) => !c.isRead).length;

  return (
    <div className="space-y-6 text-xs">
      <div>
        <h2 className="text-xl font-bold text-slate-900">FAQ Content & Contact Submissions Inbox</h2>
        <p className="text-xs text-slate-500">
          Manage customer help questions and review messages submitted through the Contact form.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('contacts')}
          className={`pb-2 px-3 font-bold text-xs flex items-center gap-1.5 border-b-2 transition-all ${
            activeTab === 'contacts'
              ? 'border-emerald-700 text-emerald-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Mail className="w-4 h-4" />
          <span>Contact Submissions Inbox</span>
          {unreadCount > 0 && (
            <span className="bg-amber-500 text-slate-950 font-extrabold px-1.5 py-0.2 rounded-full text-[10px]">
              {unreadCount} New
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('faqs')}
          className={`pb-2 px-3 font-bold text-xs flex items-center gap-1.5 border-b-2 transition-all ${
            activeTab === 'faqs'
              ? 'border-emerald-700 text-emerald-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <HelpCircle className="w-4 h-4" />
          <span>FAQ Content Manager ({faqs.length})</span>
        </button>
      </div>

      {/* Contact Messages Inbox View */}
      {activeTab === 'contacts' && (
        <div className="space-y-3">
          {contactSubmissions.length === 0 ? (
            <div className="p-8 bg-white rounded-2xl border border-slate-200 text-center text-slate-500 italic">
              No contact submissions received yet.
            </div>
          ) : (
            contactSubmissions.map((submission) => (
              <div
                key={submission.id}
                className={`p-4 rounded-2xl border transition-all ${
                  submission.isRead
                    ? 'bg-slate-50 border-slate-200'
                    : 'bg-amber-50/60 border-amber-300 shadow-sm'
                }`}
              >
                <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-2">
                  <div>
                    <span className="font-bold text-slate-900 text-sm">{submission.name}</span>
                    <a href={`tel:${submission.phone}`} className="text-emerald-700 font-semibold ml-2 hover:underline">
                      {submission.phone}
                    </a>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-400">{formatDate(submission.createdAt)}</span>
                    {!submission.isRead && (
                      <button
                        onClick={() => markContactRead(submission.id)}
                        className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded"
                      >
                        Mark Read
                      </button>
                    )}
                  </div>
                </div>

                <p className="text-slate-800 leading-relaxed text-xs">{submission.message}</p>
              </div>
            ))
          )}
        </div>
      )}

      {/* FAQ Manager View */}
      {activeTab === 'faqs' && (
        <div className="space-y-6">
          {/* Add New FAQ Form */}
          <form onSubmit={handleAddFAQ} className="bg-white p-5 rounded-2xl border border-slate-200 space-y-3">
            <h3 className="font-bold text-sm text-slate-900">Add New FAQ Question</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className="font-bold text-slate-700 block mb-1">Question</label>
                <input
                  type="text"
                  placeholder="e.g. What is the delivery fee formula?"
                  value={newQ}
                  onChange={(e) => setNewQ(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-semibold text-slate-900"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Category</label>
                <select
                  value={newCat}
                  onChange={(e) => setNewCat(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-semibold text-slate-900"
                >
                  <option value="delivery">Delivery</option>
                  <option value="payment">Payment</option>
                  <option value="orders">Orders</option>
                  <option value="products">Products</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="font-bold text-slate-700 block mb-1">Answer</label>
                <textarea
                  rows={2}
                  placeholder="Detailed answer for customers..."
                  value={newA}
                  onChange={(e) => setNewA(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900"
                />
              </div>
            </div>

            <button
              type="submit"
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl shadow-md flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Add FAQ</span>
            </button>
          </form>

          {/* List of FAQs */}
          <div className="space-y-3">
            {faqs.map((faq) => (
              <div key={faq.id} className="bg-white p-4 rounded-xl border border-slate-200 flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                    {faq.category}
                  </span>
                  <p className="font-bold text-slate-900 text-sm">{faq.question}</p>
                  <p className="text-slate-600 leading-relaxed text-xs">{faq.answer}</p>
                </div>

                <button
                  onClick={() => handleDeleteFAQ(faq.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
