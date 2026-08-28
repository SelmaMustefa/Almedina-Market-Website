import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { formatETB, formatDate } from '../../utils/distance';
import {
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Clock,
  DollarSign,
  Search,
  Download,
  Filter,
  RefreshCw,
  TrendingUp,
  Smartphone,
  Building2,
  Receipt,
  ExternalLink,
} from 'lucide-react';
import { PaymentMethod, PaymentStatus, Order } from '../../types';

export const AdminPaymentManager: React.FC = () => {
  const { orders, verifyChapaPayment, recordCashPaymentReceived, updateOrderStatus } = useApp();

  const [selectedMethod, setSelectedMethod] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [verifyingMap, setVerifyingMap] = useState<Record<string, boolean>>({});

  // Financial Metrics
  const metrics = useMemo(() => {
    const totalCollected = orders
      .filter((o) => o.paymentStatus === 'paid')
      .reduce((sum, o) => sum + o.totalETB, 0);

    const pendingOnline = orders
      .filter((o) => (o.paymentMethod === 'telebirr' || o.paymentMethod === 'cbe_birr') && o.paymentStatus !== 'paid')
      .reduce((sum, o) => sum + o.totalETB, 0);

    const pendingCash = orders
      .filter((o) => (o.paymentMethod === 'cod' || o.paymentMethod === 'cop') && o.paymentStatus !== 'paid')
      .reduce((sum, o) => sum + o.totalETB, 0);

    const paidCount = orders.filter((o) => o.paymentStatus === 'paid').length;
    const totalCount = orders.length;

    return { totalCollected, pendingOnline, pendingCash, paidCount, totalCount };
  }, [orders]);

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      // Method filter
      if (selectedMethod !== 'all') {
        if (selectedMethod === 'online' && order.paymentMethod !== 'telebirr' && order.paymentMethod !== 'cbe_birr') return false;
        if (selectedMethod === 'cash' && order.paymentMethod !== 'cod' && order.paymentMethod !== 'cop') return false;
        if (selectedMethod !== 'online' && selectedMethod !== 'cash' && order.paymentMethod !== selectedMethod) return false;
      }

      // Status filter
      if (selectedStatus !== 'all') {
        if (order.paymentStatus !== selectedStatus) return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesNumber = order.orderNumber.toLowerCase().includes(q);
        const matchesName = order.customerName.toLowerCase().includes(q);
        const matchesPhone = order.customerPhone.toLowerCase().includes(q);
        const matchesTxRef = (order.chapaTxRef || '').toLowerCase().includes(q);
        if (!matchesNumber && !matchesName && !matchesPhone && !matchesTxRef) return false;
      }

      return true;
    });
  }, [orders, selectedMethod, selectedStatus, searchQuery]);

  const handleVerify = async (orderId: string) => {
    setVerifyingMap((prev) => ({ ...prev, [orderId]: true }));
    try {
      await verifyChapaPayment(orderId);
    } finally {
      setVerifyingMap((prev) => ({ ...prev, [orderId]: false }));
    }
  };

  const exportCSV = () => {
    const headers = ['Order Number', 'Date', 'Customer', 'Phone', 'Payment Method', 'Payment Status', 'Amount ETB', 'Tx Reference'];
    const rows = filteredOrders.map((o) => [
      o.orderNumber,
      o.createdAt,
      `"${o.customerName}"`,
      o.customerPhone,
      o.paymentMethod.toUpperCase(),
      o.paymentStatus.toUpperCase(),
      o.totalETB,
      o.chapaTxRef || '',
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `almedina_payments_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header & Export */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Receipt className="w-6 h-6 text-emerald-600" />
            <span>Payment & Revenue Operations Manager</span>
          </h2>
          <p className="text-xs text-slate-500">
            Monitor, audit, and verify all Telebirr, CBE Birr (Chapa Gateway), and Cash on Delivery/Pickup payments.
          </p>
        </div>
        <button
          onClick={exportCSV}
          className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-bold text-xs rounded-xl shadow-xs flex items-center gap-2 transition-colors min-h-[38px]"
        >
          <Download className="w-4 h-4 text-slate-500" />
          <span>Export Payments CSV</span>
        </button>
      </div>

      {/* Financial Overview Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Total Collected */}
        <div className="p-4 bg-emerald-900 text-white rounded-2xl shadow-sm border border-emerald-800 space-y-1">
          <div className="flex items-center justify-between text-emerald-300">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Revenue Paid</span>
            <TrendingUp className="w-4 h-4" />
          </div>
          <p className="text-2xl font-black">{formatETB(metrics.totalCollected)}</p>
          <p className="text-[10px] text-emerald-200">
            {metrics.paidCount} of {metrics.totalCount} orders settled
          </p>
        </div>

        {/* Pending Online */}
        <div className="p-4 bg-cyan-50 border border-cyan-200 rounded-2xl shadow-sm space-y-1">
          <div className="flex items-center justify-between text-cyan-800">
            <span className="text-[11px] font-bold uppercase tracking-wider">Pending Online (Chapa)</span>
            <Smartphone className="w-4 h-4 text-cyan-600" />
          </div>
          <p className="text-2xl font-black text-cyan-950">{formatETB(metrics.pendingOnline)}</p>
          <p className="text-[10px] text-cyan-700">Telebirr & CBE Birr verification queue</p>
        </div>

        {/* Pending Cash */}
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl shadow-sm space-y-1">
          <div className="flex items-center justify-between text-amber-800">
            <span className="text-[11px] font-bold uppercase tracking-wider">Pending Cash (COD/COP)</span>
            <DollarSign className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-black text-amber-950">{formatETB(metrics.pendingCash)}</p>
          <p className="text-[10px] text-amber-700">Payable upon delivery or counter pickup</p>
        </div>

        {/* Gateway Security Status */}
        <div className="p-4 bg-slate-900 text-white rounded-2xl shadow-sm border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-emerald-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Chapa Engine Status</span>
            <CreditCard className="w-4 h-4" />
          </div>
          <p className="text-base font-bold text-white flex items-center gap-1.5 pt-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <span>Webhook & Verify Active</span>
          </p>
          <p className="text-[10px] text-slate-400">Auto-syncs order confirmation on payment</p>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Method Filters */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs font-bold">
            <span className="text-slate-400 text-[11px] uppercase mr-1">Method:</span>
            {[
              { id: 'all', label: 'All Methods' },
              { id: 'online', label: 'All Online' },
              { id: 'telebirr', label: 'Telebirr' },
              { id: 'cbe_birr', label: 'CBE Birr' },
              { id: 'cash', label: 'Cash (COD/COP)' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedMethod(tab.id)}
                className={`px-3 py-1.5 rounded-xl border transition-all ${
                  selectedMethod === tab.id
                    ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Status Filters */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs font-bold">
            <span className="text-slate-400 text-[11px] uppercase mr-1">Status:</span>
            {[
              { id: 'all', label: 'All' },
              { id: 'paid', label: 'Paid' },
              { id: 'payment_pending', label: 'Pending' },
              { id: 'unpaid', label: 'Unpaid' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedStatus(tab.id)}
                className={`px-3 py-1.5 rounded-xl border transition-all ${
                  selectedStatus === tab.id
                    ? 'bg-emerald-800 text-white border-emerald-800 shadow-xs'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by Order Number (ALM-...), Customer Name, Phone, or Chapa Tx Reference..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-600/30 focus:border-emerald-600 transition-all"
          />
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden text-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white font-bold border-b border-slate-800">
                <th className="p-3.5">Order / Ref</th>
                <th className="p-3.5">Date & Time</th>
                <th className="p-3.5">Customer & Phone</th>
                <th className="p-3.5">Payment Method</th>
                <th className="p-3.5">Amount (ETB)</th>
                <th className="p-3.5">Payment Status</th>
                <th className="p-3.5 text-right">Admin Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-slate-400">
                    <Receipt className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="font-bold text-slate-600 text-xs">No matching transactions found</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Try adjusting your filters or search terms.</p>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const isOnline = order.paymentMethod === 'telebirr' || order.paymentMethod === 'cbe_birr';
                  const isCash = order.paymentMethod === 'cod' || order.paymentMethod === 'cop';
                  const isPaid = order.paymentStatus === 'paid';
                  const isVerifying = verifyingMap[order.id];

                  return (
                    <tr key={order.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Order / Ref */}
                      <td className="p-3.5">
                        <p className="font-mono font-extrabold text-slate-900">{order.orderNumber}</p>
                        {order.chapaTxRef ? (
                          <p className="text-[10px] font-mono text-emerald-800 truncate max-w-[140px]">
                            {order.chapaTxRef}
                          </p>
                        ) : (
                          <p className="text-[10px] text-slate-400">Direct Order</p>
                        )}
                      </td>

                      {/* Date */}
                      <td className="p-3.5 text-slate-500 whitespace-nowrap">
                        {formatDate(order.createdAt)}
                      </td>

                      {/* Customer */}
                      <td className="p-3.5">
                        <p className="font-bold text-slate-900">{order.customerName}</p>
                        <p className="text-slate-500 text-[11px]">{order.customerPhone}</p>
                      </td>

                      {/* Method */}
                      <td className="p-3.5">
                        <div className="flex items-center gap-1.5">
                          {order.paymentMethod === 'telebirr' && (
                            <span className="w-5 h-5 rounded bg-cyan-600 text-white font-bold text-[9px] flex items-center justify-center">
                              T
                            </span>
                          )}
                          {order.paymentMethod === 'cbe_birr' && (
                            <span className="w-5 h-5 rounded bg-purple-700 text-white font-bold text-[8px] flex items-center justify-center">
                              CBE
                            </span>
                          )}
                          {isCash && (
                            <span className="w-5 h-5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px] flex items-center justify-center">
                              💵
                            </span>
                          )}
                          <span className="font-bold text-slate-800 uppercase text-[11px]">
                            {order.paymentMethod === 'cod'
                              ? 'Cash on Delivery'
                              : order.paymentMethod === 'cop'
                              ? 'Cash on Pickup'
                              : order.paymentMethod === 'telebirr'
                              ? 'Telebirr (Chapa)'
                              : order.paymentMethod === 'cbe_birr'
                              ? 'CBE Birr (Chapa)'
                              : order.paymentMethod}
                          </span>
                        </div>
                      </td>

                      {/* Amount */}
                      <td className="p-3.5 font-extrabold text-slate-900 text-xs">
                        {formatETB(order.totalETB)}
                      </td>

                      {/* Payment Status */}
                      <td className="p-3.5">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold border ${
                            isPaid
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                              : order.paymentStatus === 'payment_pending'
                              ? 'bg-amber-100 text-amber-900 border-amber-300'
                              : order.paymentStatus === 'failed'
                              ? 'bg-rose-100 text-rose-900 border-rose-300'
                              : 'bg-slate-100 text-slate-700 border-slate-300'
                          }`}
                        >
                          {isPaid ? (
                            <>
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>PAID & VERIFIED</span>
                            </>
                          ) : (
                            <>
                              <Clock className="w-3 h-3 text-amber-600" />
                              <span>{order.paymentStatus.toUpperCase()}</span>
                            </>
                          )}
                        </span>
                      </td>

                      {/* Admin Actions */}
                      <td className="p-3.5 text-right whitespace-nowrap">
                        {!isPaid ? (
                          <div className="flex items-center justify-end gap-1.5">
                            {isOnline && (
                              <button
                                onClick={() => handleVerify(order.id)}
                                disabled={isVerifying}
                                className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-[11px] flex items-center gap-1 transition-colors shadow-xs"
                                title="Query Chapa API for status"
                              >
                                <RefreshCw className={`w-3 h-3 ${isVerifying ? 'animate-spin' : ''}`} />
                                <span>Verify Chapa</span>
                              </button>
                            )}

                            {isCash && (
                              <button
                                onClick={() => recordCashPaymentReceived(order.id, true)}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-[11px] flex items-center gap-1 transition-colors shadow-xs"
                                title="Mark cash as received and complete order"
                              >
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Confirm Cash Received</span>
                              </button>
                            )}
                          </div>
                        ) : (
                          <span className="text-emerald-700 font-bold text-[11px] inline-flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Settled</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

