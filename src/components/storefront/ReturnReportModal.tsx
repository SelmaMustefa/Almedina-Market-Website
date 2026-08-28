import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { Order, ReturnReport } from '../../types';
import {
  X,
  Camera,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  FileImage,
  Upload,
  RefreshCw,
  DollarSign,
  PackageCheck,
  CreditCard,
  Trash2,
} from 'lucide-react';

interface ReturnReportModalProps {
  isOpen: boolean;
  order: Order | null;
  onClose: () => void;
}

const SAMPLE_PHOTO_EVIDENCE = [
  {
    label: 'Damaged Packaging',
    url: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&q=80&w=400',
  },
  {
    label: 'Wrong / Expired Item',
    url: 'https://images.unsplash.com/photo-1534723452862-4c874018d66d?auto=format&fit=crop&q=80&w=400',
  },
  {
    label: 'Quality Defect',
    url: 'https://images.unsplash.com/photo-1576186726580-a816e8b12896?auto=format&fit=crop&q=80&w=400',
  },
];

export const ReturnReportModal: React.FC<ReturnReportModalProps> = ({ isOpen, order, onClose }) => {
  const { submitReturnReport } = useApp();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [reason, setReason] = useState<ReturnReport['reason']>('damaged_item');
  const [requestedResolution, setRequestedResolution] = useState<'refund' | 'replacement' | 'credit'>('refund');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [photoUrl, setPhotoUrl] = useState<string>(SAMPLE_PHOTO_EVIDENCE[0].url);
  const [notes, setNotes] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize selected items when order loads
  React.useEffect(() => {
    if (order?.items && order.items.length > 0) {
      setSelectedItems(order.items.map((i) => i.productName));
    } else {
      setSelectedItems([]);
    }
  }, [order]);

  if (!isOpen || !order) return null;

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

  const toggleItemSelection = (itemName: string) => {
    setSelectedItems((prev) =>
      prev.includes(itemName) ? prev.filter((i) => i !== itemName) : [...prev, itemName]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!photoUrl || !photoUrl.trim()) {
      setErrorMessage('Photo evidence is required to process return or refund claims.');
      return;
    }

    if (selectedItems.length === 0 && order.items && order.items.length > 0) {
      setErrorMessage('Please select at least one item affected by this return/claim.');
      return;
    }

    setIsSubmitting(true);
    const result = submitReturnReport({
      orderId: order.id,
      reason,
      photoUrl: photoUrl.trim(),
      notes: notes.trim() || `Requested ${requestedResolution} for ${selectedItems.join(', ')}`,
      requestedResolution,
      affectedItemNames: selectedItems,
    });

    setIsSubmitting(false);
    if (!result.success) {
      setErrorMessage(result.message);
      return;
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border border-slate-200 animate-fade-in my-auto flex flex-col max-h-[calc(100dvh-2rem)]">
        {/* Header */}
        <div className="p-4 bg-amber-900 text-white flex items-center justify-between border-b border-amber-800 shrink-0">
          <div className="flex items-center gap-2">
            <RotateCcw className="w-5 h-5 text-amber-300" />
            <div>
              <h2 className="font-bold text-sm">Same-Day Return & Quality Claim</h2>
              <p className="text-[11px] text-amber-200">Order #{order.orderNumber}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-amber-300 hover:text-white hover:bg-amber-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs overflow-y-auto flex-1">
          {errorMessage && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <p className="text-[11px] leading-relaxed font-medium">{errorMessage}</p>
            </div>
          )}

          {/* Order Summary Box */}
          <div className="bg-amber-50/70 p-3.5 rounded-xl border border-amber-200/80 text-amber-950 flex items-center justify-between">
            <div>
              <p className="font-bold text-xs text-amber-950">Reporting Order: {order.orderNumber}</p>
              <p className="text-[11px] text-amber-800">
                Customer: {order.customerName} • Total: {order.totalETB.toLocaleString()} Br
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-amber-200/80 text-amber-900 text-[10px] font-bold">
              Eligible for Return
            </span>
          </div>

          {/* 1. Affected Items Selection */}
          {order.items && order.items.length > 0 && (
            <div className="space-y-1.5">
              <label className="font-bold text-slate-800 block">
                1. Select Affected Item(s) from this Order:
              </label>
              <div className="space-y-1.5 bg-slate-50 p-2.5 rounded-xl border border-slate-200 max-h-32 overflow-y-auto">
                {order.items.map((item, idx) => {
                  const isChecked = selectedItems.includes(item.productName);
                  return (
                    <label
                      key={idx}
                      className={`flex items-center justify-between p-2 rounded-lg border cursor-pointer text-xs transition-all ${
                        isChecked
                          ? 'bg-amber-50/80 border-amber-400 font-semibold text-slate-900'
                          : 'bg-white border-slate-200 text-slate-600'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleItemSelection(item.productName)}
                          className="rounded text-amber-600 focus:ring-amber-500"
                        />
                        <span>{item.productName}</span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {item.quantity} {item.unit} • {item.subtotalETB.toLocaleString()} Br
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* 2. Select Return Reason */}
          <div className="space-y-1">
            <label className="font-bold text-slate-800 block">2. Select Issue / Return Reason</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value as ReturnReport['reason'])}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 font-medium text-slate-900 focus:outline-none focus:border-amber-600"
            >
              <option value="damaged_item">📦 Damaged Item or Torn Packaging</option>
              <option value="wrong_item">🔄 Wrong Item Delivered</option>
              <option value="spoiled_item">🥬 Spoiled / Quality Defect</option>
              <option value="missing_item">❌ Missing Item from Package</option>
              <option value="expired_item">⏳ Expired Product Date</option>
              <option value="other_defect">⚠️ Other Issue or Defect</option>
            </select>
          </div>

          {/* 3. Desired Resolution Preference */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-800 block">3. Preferred Resolution</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setRequestedResolution('refund')}
                className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center gap-1 ${
                  requestedResolution === 'refund'
                    ? 'bg-emerald-50 border-emerald-600 text-emerald-900 font-bold ring-1 ring-emerald-500'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <DollarSign className="w-4 h-4 text-emerald-600" />
                <span className="text-[11px]">Full Refund</span>
              </button>

              <button
                type="button"
                onClick={() => setRequestedResolution('replacement')}
                className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center gap-1 ${
                  requestedResolution === 'replacement'
                    ? 'bg-blue-50 border-blue-600 text-blue-900 font-bold ring-1 ring-blue-500'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <PackageCheck className="w-4 h-4 text-blue-600" />
                <span className="text-[11px]">Free Replacement</span>
              </button>

              <button
                type="button"
                onClick={() => setRequestedResolution('credit')}
                className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center gap-1 ${
                  requestedResolution === 'credit'
                    ? 'bg-purple-50 border-purple-600 text-purple-900 font-bold ring-1 ring-purple-500'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <CreditCard className="w-4 h-4 text-purple-600" />
                <span className="text-[11px]">Store Credit</span>
              </button>
            </div>
          </div>

          {/* 4. Mandatory Photo Evidence */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-800 flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-amber-600" />
                <span>4. Mandatory Photo Evidence (Upload or Presets)</span>
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
                <span>Upload from Device</span>
              </button>
            </div>

            {/* Quick Presets */}
            <div className="grid grid-cols-3 gap-1.5">
              {SAMPLE_PHOTO_EVIDENCE.map((sample, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => setPhotoUrl(sample.url)}
                  className={`p-1.5 rounded-lg border text-left text-[10px] transition-all flex items-center gap-1.5 truncate ${
                    photoUrl === sample.url
                      ? 'bg-amber-100 border-amber-600 font-bold text-amber-950'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <FileImage className="w-3 h-3 text-amber-600 shrink-0" />
                  <span className="truncate">{sample.label}</span>
                </button>
              ))}
            </div>

            {/* Photo preview */}
            {photoUrl ? (
              <div className="relative w-full h-36 bg-slate-100 rounded-xl overflow-hidden border border-slate-300 group">
                <img
                  src={photoUrl}
                  alt="Evidence Preview"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-2.5 py-1 bg-white/90 hover:bg-white text-slate-900 font-bold text-[11px] rounded-lg shadow-sm"
                  >
                    Change Photo
                  </button>
                  <button
                    type="button"
                    onClick={() => setPhotoUrl('')}
                    className="p-1 bg-rose-600 text-white rounded-lg hover:bg-rose-700 shadow-sm"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <span className="absolute bottom-2 left-2 bg-emerald-900/90 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Evidence Photo Attached
                </span>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-28 border-2 border-dashed border-slate-300 hover:border-amber-500 rounded-xl flex flex-col items-center justify-center text-slate-500 hover:text-amber-600 cursor-pointer bg-slate-50 transition-colors"
              >
                <Upload className="w-6 h-6 mb-1" />
                <p className="font-bold text-xs">Click to upload photo evidence from your device</p>
                <p className="text-[10px] text-slate-400">JPG, PNG, WebP up to 8MB</p>
              </div>
            )}
          </div>

          {/* 5. Additional Notes */}
          <div className="space-y-1">
            <label className="font-bold text-slate-800 block">5. Additional Description</label>
            <textarea
              rows={2}
              placeholder="Describe the issue clearly (e.g. Broken packaging on Ethiopian White Honey upon unboxing)..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900 focus:outline-none focus:border-amber-600"
            />
          </div>

          {/* Action Buttons */}
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
              disabled={isSubmitting}
              className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-md flex items-center justify-center gap-1.5 min-h-[44px] transition-colors"
            >
              {isSubmitting ? (
                <span>Submitting...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Submit Return Report</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
