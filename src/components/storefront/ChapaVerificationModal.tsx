import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { formatETB } from '../../utils/distance';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Loader2,
  Receipt,
  ArrowRight,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';
import { BRAND } from '../../constants/brand';

interface ChapaVerificationModalProps {
  txRef: string;
  onClose: () => void;
  onOpenOrder?: (orderId: string) => void;
}

export const ChapaVerificationModal: React.FC<ChapaVerificationModalProps> = ({
  txRef,
  onClose,
  onOpenOrder,
}) => {
  const { orders, verifyChapaPayment } = useApp();

  const [isLoading, setIsLoading] = useState(true);
  const [isSuccess, setIsSuccess] = useState<boolean | null>(null);
  const [receiptData, setReceiptData] = useState<{
    amount?: number | string;
    currency?: string;
    reference?: string;
    paymentMethod?: string;
    status?: string;
    message?: string;
  } | null>(null);

  // Find corresponding order in local state
  const matchedOrder = orders.find(
    (o) => o.chapaTxRef === txRef || o.id === txRef || o.orderNumber === txRef
  );

  const ranRef = React.useRef(false);

  const runVerification = async () => {
    setIsLoading(true);
    try {
      const result = await verifyChapaPayment(matchedOrder?.id || txRef);

      if (result.success) {
        setIsSuccess(true);
        setReceiptData({
          status: 'success',
          message: result.message,
        });
        let orderId = (result as { order?: { id: string } }).order?.id || matchedOrder?.id;
        if (!orderId) {
          try {
            const stored = sessionStorage.getItem('almadina_chapa_return');
            if (stored) orderId = JSON.parse(stored).orderId;
          } catch {
            // ignore
          }
        }
        if (orderId && onOpenOrder) {
          window.setTimeout(() => {
            onOpenOrder(orderId as string);
          }, 900);
        }
      } else {
        setIsSuccess(false);
        setReceiptData({
          status: 'failed',
          message: result.message || 'Payment not completed or unverified.',
        });
      }
    } catch (err: any) {
      console.error('[ChapaVerificationModal] Verification error:', err);
      setIsSuccess(false);
      setReceiptData({
        status: 'error',
        message: 'Network communication error with verification server.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!txRef || ranRef.current) return;
    ranRef.current = true;
    runVerification();
  }, [txRef]);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-emerald-950 via-teal-900 to-slate-900 text-white flex items-center justify-between border-b border-emerald-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300 font-bold text-xs">
              CHP
            </div>
            <div>
              <h3 className="font-bold text-sm">Chapa Payment Gateway</h3>
              <p className="text-[10px] text-emerald-300">Official Server-Side Verification</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 text-center">
          {isLoading ? (
            <div className="space-y-4 py-6">
              <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto">
                <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-base">Verifying with Chapa Gateway</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                  Communicating with Chapa API server to confirm payment status for reference{' '}
                  <span className="font-mono text-emerald-700 font-semibold">{txRef}</span>...
                </p>
              </div>
            </div>
          ) : isSuccess ? (
            <div className="space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 border-2 border-emerald-500 flex items-center justify-center mx-auto text-emerald-600 animate-bounce">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                  Payment Confirmed • PAID
                </span>
                <h4 className="font-extrabold text-slate-900 text-lg mt-2">
                  Thank You for Your Order!
                </h4>
                <p className="text-xs text-slate-600 mt-0.5">
                  Your payment has been successfully processed through Chapa Ethiopia.
                </p>
              </div>

              {/* Receipt Details Card */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-left space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-500 pb-2 border-b border-slate-200 font-semibold">
                  <span className="flex items-center gap-1.5 text-slate-700">
                    <Receipt className="w-3.5 h-3.5 text-emerald-600" />
                    Electronic Receipt
                  </span>
                  <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-mono">
                    {receiptData?.reference || txRef}
                  </span>
                </div>

                {matchedOrder && (
                  <div className="flex justify-between text-slate-600">
                    <span>Order Number</span>
                    <span className="font-mono font-bold text-slate-900">{matchedOrder.orderNumber}</span>
                  </div>
                )}

                <div className="flex justify-between text-slate-600">
                  <span>Merchant</span>
                  <span className="font-medium text-slate-800">{BRAND.name}</span>
                </div>

                <div className="flex justify-between text-slate-600">
                  <span>Payment Gateway</span>
                  <span className="font-bold text-slate-900">Chapa (Telebirr / CBE / Cards)</span>
                </div>

                <div className="flex justify-between text-slate-600">
                  <span>Payment Status</span>
                  <span className="font-bold text-emerald-700 uppercase">Success (Verified)</span>
                </div>

                <div className="flex justify-between text-slate-900 pt-2 border-t border-slate-200 font-extrabold text-sm">
                  <span>Total Amount Paid</span>
                  <span className="text-emerald-700">
                    {formatETB(
                      receiptData?.amount
                        ? Number(receiptData.amount)
                        : matchedOrder?.totalETB || 0
                    )}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-2 pt-2">
                {matchedOrder && onOpenOrder && (
                  <button
                    onClick={() => {
                      onClose();
                      onOpenOrder(matchedOrder.id);
                    }}
                    className="w-full py-3 px-4 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-colors min-h-[44px]"
                  >
                    <span>Track Order Progress</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}

                <button
                  onClick={onClose}
                  className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition-colors min-h-[40px]"
                >
                  Continue Shopping
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="w-16 h-16 rounded-full bg-rose-100 border border-rose-300 flex items-center justify-center mx-auto text-rose-600">
                <XCircle className="w-10 h-10" />
              </div>

              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 border border-rose-300">
                  Verification Incomplete
                </span>
                <h4 className="font-bold text-slate-900 text-base mt-2">Payment Not Completed</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                  {receiptData?.message ||
                    'The transaction was not finalized or was cancelled on the Chapa checkout portal.'}
                </p>
              </div>

              {matchedOrder?.chapaCheckoutUrl && (
                <a
                  href={matchedOrder.chapaCheckoutUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 px-4 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-colors min-h-[44px]"
                >
                  <span>Re-open Chapa Hosted Checkout</span>
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}

              <div className="flex items-center gap-2 pt-2">
                <button
                  onClick={runVerification}
                  className="flex-1 py-2.5 px-3 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors min-h-[40px]"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Re-check</span>
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition-colors min-h-[40px]"
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Security Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 text-[10px] text-slate-400 flex items-center justify-center gap-1.5 font-medium">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Secured by Chapa Ethiopia (256-bit TLS Gateway Encryption)</span>
        </div>
      </div>
    </div>
  );
};
