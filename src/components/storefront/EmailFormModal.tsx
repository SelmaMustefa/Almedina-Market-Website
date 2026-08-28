import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { BRAND } from '../../constants/brand';
import { X, Mail, Send, CheckCircle2, ArrowRight, Lock } from 'lucide-react';

interface EmailFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialSubject?: string;
  initialMessage?: string;
}

export const EmailFormModal: React.FC<EmailFormModalProps> = ({
  isOpen,
  onClose,
  initialSubject = '',
  initialMessage = '',
}) => {
  const { currentUser, submitContactForm } = useApp();
  const [senderName, setSenderName] = useState('');
  const [senderEmail, setSenderEmail] = useState('');
  const [subject, setSubject] = useState(
    initialSubject && !initialSubject.toLowerCase().includes('inquiry via footer email icon')
      ? initialSubject
      : 'Inquiry regarding Almedina Market'
  );
  const [message, setMessage] = useState(initialMessage);
  const [isSent, setIsSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (currentUser?.email) {
        setSenderEmail(currentUser.email);
      }
      if (currentUser?.name) {
        setSenderName(currentUser.name);
      }
      if (initialSubject && !initialSubject.toLowerCase().includes('inquiry via footer email icon')) {
        setSubject(initialSubject);
      } else if (!subject || subject.toLowerCase().includes('inquiry via footer email icon')) {
        setSubject('Inquiry regarding Almedina Market');
      }
      if (initialMessage) setMessage(initialMessage);
      setIsSent(false);
      setError(null);
    }
  }, [isOpen, currentUser, initialSubject, initialMessage]);

  if (!isOpen) return null;

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!senderEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(senderEmail)) {
      setError('Please enter a valid email address in the "From" field.');
      return;
    }

    if (!subject.trim()) {
      setError('Please enter a subject line.');
      return;
    }

    if (!message.trim()) {
      setError('Please compose a message before sending.');
      return;
    }

    const cleanSenderName = senderName.trim() || 'Customer';
    const cleanSubject = subject.trim();
    const cleanMessageText = message.trim();

    submitContactForm(cleanSenderName, senderEmail.trim(), cleanMessageText, cleanSubject);

    setIsSent(true);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden border border-slate-200 animate-fade-in flex flex-col my-auto max-h-[calc(100dvh-2rem)]">
        {/* Header */}
        <div className="p-4 bg-emerald-950 text-white flex items-center justify-between border-b border-emerald-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-800 flex items-center justify-center text-emerald-200">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-base">Send Email to {BRAND.name}</h2>
              <p className="text-xs text-emerald-300">Direct message to store management</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-emerald-300 hover:text-white hover:bg-emerald-900 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {isSent ? (
            <div className="py-8 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-slate-900 font-serif">Message Sent!</h3>
                <p className="text-xs text-slate-600 max-w-sm mx-auto leading-relaxed">
                  Your email has been sent to <strong className="text-emerald-800">{BRAND.email}</strong>. Our team in Bethel will respond as soon as possible.
                </p>
              </div>

              <div className="pt-4 flex items-center justify-center">
                <button
                  onClick={onClose}
                  className="w-full sm:w-auto px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl transition-colors shadow-sm"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSend} className="space-y-4">
              {/* To field */}
              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">To (Destination)</label>
                <div className="flex items-center gap-2 px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-800 font-semibold text-xs">
                  <Lock className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                  <span className="font-mono text-emerald-900 bg-emerald-100/80 px-2 py-0.5 rounded text-xs border border-emerald-300/60">
                    {BRAND.email}
                  </span>
                  <span className="text-[11px] text-slate-500 ml-auto hidden sm:inline">Store Owner & Support</span>
                </div>
              </div>

              {/* From fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Your Name
                  </label>
                  <input
                    type="text"
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                    placeholder="e.g. Abebe Bikila"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Your Email (From) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={senderEmail}
                    onChange={(e) => setSenderEmail(e.target.value)}
                    placeholder="your.email@example.com"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
                  />
                </div>
              </div>

              {/* Subject */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Subject <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="What is your message regarding?"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
                />
              </div>

              {/* Message */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Message Content <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={5}
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type your message or request here..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white resize-none"
                />
              </div>

              {error && <p className="text-xs font-semibold text-rose-600 bg-rose-50 p-2.5 rounded-lg border border-rose-200">{error}</p>}

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="w-full sm:w-auto px-6 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs rounded-xl shadow-md transition-colors flex items-center justify-center gap-2 min-h-[42px]"
                >
                  <Send className="w-4 h-4" />
                  <span>Send to {BRAND.email}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
