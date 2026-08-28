import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ReturnReport } from '../../types';
import { formatDate, formatETB } from '../../utils/distance';
import {
  RotateCcw,
  CheckCircle2,
  XCircle,
  FileImage,
  DollarSign,
  PackageCheck,
  CreditCard,
  Eye,
  Search,
  Filter,
  Phone,
  User,
  ShoppingBag,
  Clock,
  SearchCheck,
  AlertTriangle,
  Mail,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react';

export const AdminReturnsManager: React.FC = () => {
  const { returnReports, resolveReturnReport, orders } = useApp();

  const [inspectingReport, setInspectingReport] = useState<ReturnReport | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [refundAmount, setRefundAmount] = useState<number | undefined>(undefined);
  const [filterStatus, setFilterStatus] = useState<
    'all' | 'pending_review' | 'investigating' | 'approved' | 'rejected' | 'resolved'
  >('all');
  const [searchQuery, setSearchQuery] = useState('');

  const pendingCount = returnReports.filter((r) => r.status === 'pending_review').length;
  const investigatingCount = returnReports.filter((r) => r.status === 'investigating').length;
  const approvedCount = returnReports.filter((r) => r.status === 'approved' || r.status === 'resolved').length;
  const totalRefundedETB = returnReports.reduce((acc, r) => acc + (r.refundAmountETB || 0), 0);

  const filteredReports = returnReports.filter((rep) => {
    if (filterStatus !== 'all' && rep.status !== filterStatus) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        rep.orderNumber.toLowerCase().includes(q) ||
        rep.userName.toLowerCase().includes(q) ||
        rep.userPhone.toLowerCase().includes(q) ||
        (rep.customerEmail && rep.customerEmail.toLowerCase().includes(q)) ||
        rep.id.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleOpenInspect = (report: ReturnReport) => {
    setInspectingReport(report);
    setResolutionNotes(report.adminResponseNotes || '');

    // Calculate total order amount as default refund amount
    const linkedOrder = orders.find((o) => o.id === report.orderId || o.orderNumber === report.orderNumber);
    setRefundAmount(report.refundAmountETB || linkedOrder?.totalETB || undefined);
  };

  const getStatusBadge = (status: ReturnReport['status'], resolution?: string) => {
    switch (status) {
      case 'pending_review':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
            <Clock className="w-3 h-3 text-amber-700" />
            <span>PENDING REVIEW</span>
          </span>
        );
      case 'investigating':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-100 text-blue-900 border border-blue-300">
            <SearchCheck className="w-3 h-3 text-blue-700" />
            <span>UNDER INVESTIGATION</span>
          </span>
        );
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
            <CheckCircle2 className="w-3 h-3 text-emerald-700" />
            <span>APPROVED ({resolution?.toUpperCase() || 'REFUND'})</span>
          </span>
        );
      case 'resolved':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-100 text-purple-900 border border-purple-300">
            <ShieldCheck className="w-3 h-3 text-purple-700" />
            <span>RESOLVED &amp; CLOSED</span>
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-100 text-rose-900 border border-rose-300">
            <XCircle className="w-3 h-3 text-rose-700" />
            <span>CLAIM DENIED</span>
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Metrics Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
          <p className="text-slate-500 text-[11px] font-bold uppercase tracking-wider">Total Claims</p>
          <p className="text-2xl font-black text-slate-900 mt-1">{returnReports.length}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">All customer reports</p>
        </div>

        <div className="bg-amber-50 rounded-2xl border border-amber-200 p-4 shadow-sm">
          <p className="text-amber-800 text-[11px] font-bold uppercase tracking-wider">Pending Action</p>
          <p className="text-2xl font-black text-amber-950 mt-1">{pendingCount}</p>
          <p className="text-[10px] text-amber-700 mt-0.5">Awaiting admin review</p>
        </div>

        <div className="bg-blue-50 rounded-2xl border border-blue-200 p-4 shadow-sm">
          <p className="text-blue-800 text-[11px] font-bold uppercase tracking-wider">Investigating</p>
          <p className="text-2xl font-black text-blue-950 mt-1">{investigatingCount}</p>
          <p className="text-[10px] text-blue-700 mt-0.5">Quality check in progress</p>
        </div>

        <div className="bg-emerald-50 rounded-2xl border border-emerald-200 p-4 shadow-sm">
          <p className="text-emerald-800 text-[11px] font-bold uppercase tracking-wider">Total ETB Refunded</p>
          <p className="text-2xl font-black text-emerald-950 mt-1">{formatETB(totalRefundedETB)}</p>
          <p className="text-[10px] text-emerald-700 mt-0.5">{approvedCount} resolved claims</p>
        </div>
      </div>

      {/* Header & Filter Pills */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <RotateCcw className="w-5 h-5 text-amber-600" />
            <span>Customer Claims &amp; Quality Return Center</span>
          </h2>
          <p className="text-xs text-slate-500">
            Review customer photo evidence, manage return authorizations, issue instant refunds, or dispatch replacements.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs overflow-x-auto">
          {[
            { id: 'all', label: 'All Claims' },
            { id: 'pending_review', label: `Pending (${pendingCount})` },
            { id: 'investigating', label: `Investigating (${investigatingCount})` },
            { id: 'approved', label: 'Approved' },
            { id: 'rejected', label: 'Denied' },
            { id: 'resolved', label: 'Resolved' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg font-bold whitespace-nowrap transition-all ${
                filterStatus === tab.id
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
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
          placeholder="Search by Claim ID, Order #, Customer Name, Phone, or Email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-amber-600 shadow-xs"
        />
      </div>

      {/* Returns Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden text-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white font-bold border-b border-slate-800">
                <th className="p-3.5">Claim ID / Date</th>
                <th className="p-3.5">Customer Details</th>
                <th className="p-3.5">Order Number</th>
                <th className="p-3.5">Issue &amp; Preference</th>
                <th className="p-3.5">Proof</th>
                <th className="p-3.5">Status &amp; Settlement</th>
                <th className="p-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredReports.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500 italic">
                    No return claims match the selected filter.
                  </td>
                </tr>
              ) : (
                filteredReports.map((report) => (
                  <tr key={report.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3.5 font-bold font-mono text-slate-900">
                      {report.id}
                      <p className="text-[10px] text-slate-500 font-sans font-normal">
                        {formatDate(report.createdAt)}
                      </p>
                    </td>

                    <td className="p-3.5">
                      <p className="font-bold text-slate-900 flex items-center gap-1">
                        <User className="w-3 h-3 text-slate-400" />
                        {report.userName}
                      </p>
                      <p className="text-slate-500 flex items-center gap-1 text-[11px]">
                        <Phone className="w-3 h-3 text-slate-400" />
                        {report.userPhone}
                      </p>
                      {report.customerEmail && (
                        <p className="text-slate-500 flex items-center gap-1 text-[10px]">
                          <Mail className="w-3 h-3 text-slate-400" />
                          {report.customerEmail}
                        </p>
                      )}
                    </td>

                    <td className="p-3.5 font-mono font-bold text-emerald-800">
                      {report.orderNumber}
                    </td>

                    <td className="p-3.5">
                      <p className="font-bold text-slate-800 capitalize">
                        {report.reason.replace(/_/g, ' ')}
                      </p>
                      <p className="text-[10px] text-slate-500 capitalize">
                        Requested:{' '}
                        <strong className="text-amber-800">
                          {report.requestedResolution || 'Refund'}
                        </strong>
                      </p>
                      {report.affectedItemNames && report.affectedItemNames.length > 0 && (
                        <p className="text-[10px] text-slate-500 truncate max-w-[180px]">
                          Items: {report.affectedItemNames.join(', ')}
                        </p>
                      )}
                    </td>

                    <td className="p-3.5">
                      {report.photoUrl ? (
                        <button
                          type="button"
                          onClick={() => handleOpenInspect(report)}
                          className="text-emerald-700 hover:text-emerald-800 font-bold flex items-center gap-1.5 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200"
                        >
                          <FileImage className="w-3.5 h-3.5 text-emerald-600" />
                          <span>View Photo ✓</span>
                        </button>
                      ) : (
                        <span className="text-slate-400 italic">No Photo</span>
                      )}
                    </td>

                    <td className="p-3.5">
                      {getStatusBadge(report.status, report.adminResolution)}
                      {report.refundAmountETB ? (
                        <p className="text-[10px] text-emerald-800 font-bold mt-1">
                          {formatETB(report.refundAmountETB)} Refunded
                        </p>
                      ) : null}
                    </td>

                    <td className="p-3.5 text-right">
                      <button
                        onClick={() => handleOpenInspect(report)}
                        className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow-xs flex items-center gap-1.5 ml-auto transition-all"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Inspect &amp; Decide</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Proof & Resolution Decision Modal */}
      {inspectingReport && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden border border-slate-200 p-6 space-y-4 animate-fade-in text-xs max-h-[90vh] overflow-y-auto flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-amber-600" />
                <h3 className="font-bold text-slate-900 text-base">
                  Resolve Return Claim #{inspectingReport.id}
                </h3>
              </div>
              <button
                onClick={() => setInspectingReport(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Customer & Order Metadata */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Customer:</span>
                <span className="font-bold text-slate-900">
                  {inspectingReport.userName} ({inspectingReport.userPhone})
                  {inspectingReport.customerEmail ? ` • ${inspectingReport.customerEmail}` : ''}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Order Number:</span>
                <span className="font-mono font-bold text-emerald-800">
                  {inspectingReport.orderNumber}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Current Status:</span>
                <div>{getStatusBadge(inspectingReport.status, inspectingReport.adminResolution)}</div>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Reported Issue:</span>
                <span className="font-bold text-slate-800 capitalize">
                  {inspectingReport.reason.replace(/_/g, ' ')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Requested Outcome:</span>
                <span className="font-bold text-amber-800 capitalize">
                  {inspectingReport.requestedResolution || 'Refund'}
                </span>
              </div>
              {inspectingReport.affectedItemNames && inspectingReport.affectedItemNames.length > 0 && (
                <div className="pt-1.5 border-t border-slate-200">
                  <span className="text-slate-500 block mb-1">Affected Grocery Items:</span>
                  <div className="flex flex-wrap gap-1">
                    {inspectingReport.affectedItemNames.map((itemName, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 font-semibold text-[10px]"
                      >
                        {itemName}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Customer Explanation Note */}
            <div className="space-y-1">
              <label className="font-bold text-slate-800 block">Customer Explanation:</label>
              <div className="bg-amber-50/60 p-3 rounded-xl border border-amber-200/80 text-slate-800 italic leading-relaxed">
                "{inspectingReport.notes || 'No custom note provided by customer.'}"
              </div>
            </div>

            {/* Photo Inspection Display */}
            {inspectingReport.photoUrl && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800">Customer Photo Evidence:</span>
                  <a
                    href={inspectingReport.photoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-amber-700 hover:underline text-[11px] font-semibold"
                  >
                    Open Original Image ↗
                  </a>
                </div>
                <div className="w-full h-52 bg-slate-100 rounded-xl overflow-hidden border border-slate-300 group relative">
                  <img
                    src={inspectingReport.photoUrl}
                    alt="Uploaded Evidence"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            )}

            {/* Settlement Refund Amount */}
            <div className="space-y-1">
              <label className="font-bold text-slate-800 block">
                Refund Amount (ETB) (When Approving Refund or Credit)
              </label>
              <input
                type="number"
                value={refundAmount ?? ''}
                onChange={(e) => setRefundAmount(e.target.value ? Number(e.target.value) : undefined)}
                placeholder="Enter refund amount in ETB..."
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 font-semibold focus:outline-none focus:border-amber-600"
              />
            </div>

            {/* Admin Response Note */}
            <div className="space-y-1">
              <label className="font-bold text-slate-800 block">
                Admin Resolution Notes (Sent to Customer via Email &amp; In-App)
              </label>
              <textarea
                rows={2}
                placeholder="e.g. Quality issue confirmed. Telebirr/Chapa refund issued immediately to customer account."
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-amber-600"
              />
            </div>

            {/* Decision Actions Grid */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Choose Settlement Action:
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {/* 1. Refund */}
                <button
                  type="button"
                  onClick={() => {
                    resolveReturnReport(
                      inspectingReport.id,
                      'refund',
                      resolutionNotes || 'Refund approved by administration.',
                      refundAmount
                    );
                    setInspectingReport(null);
                  }}
                  className="p-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl shadow-xs flex flex-col items-center justify-center gap-1 transition-colors"
                >
                  <DollarSign className="w-4 h-4" />
                  <span>Approve Refund</span>
                </button>

                {/* 2. Replacement */}
                <button
                  type="button"
                  onClick={() => {
                    resolveReturnReport(
                      inspectingReport.id,
                      'replacement',
                      resolutionNotes || 'Replacement order dispatched for free delivery.'
                    );
                    setInspectingReport(null);
                  }}
                  className="p-2.5 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-xl shadow-xs flex flex-col items-center justify-center gap-1 transition-colors"
                >
                  <PackageCheck className="w-4 h-4" />
                  <span>Send Replacement</span>
                </button>

                {/* 3. Store Credit */}
                <button
                  type="button"
                  onClick={() => {
                    resolveReturnReport(
                      inspectingReport.id,
                      'credit',
                      resolutionNotes || 'Store credit balance added to customer profile.',
                      refundAmount
                    );
                    setInspectingReport(null);
                  }}
                  className="p-2.5 bg-purple-700 hover:bg-purple-800 text-white font-bold rounded-xl shadow-xs flex flex-col items-center justify-center gap-1 transition-colors"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Issue Store Credit</span>
                </button>

                {/* 4. Under Investigation */}
                <button
                  type="button"
                  onClick={() => {
                    resolveReturnReport(
                      inspectingReport.id,
                      'investigating',
                      resolutionNotes || 'Claim is currently under review by our quality inspection team.'
                    );
                    setInspectingReport(null);
                  }}
                  className="p-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow-xs flex flex-col items-center justify-center gap-1 transition-colors"
                >
                  <SearchCheck className="w-4 h-4" />
                  <span>Set Investigating</span>
                </button>

                {/* 5. Mark Resolved */}
                <button
                  type="button"
                  onClick={() => {
                    resolveReturnReport(
                      inspectingReport.id,
                      'resolved',
                      resolutionNotes || 'Claim successfully resolved with customer.'
                    );
                    setInspectingReport(null);
                  }}
                  className="p-2.5 bg-slate-700 hover:bg-slate-800 text-white font-bold rounded-xl shadow-xs flex flex-col items-center justify-center gap-1 transition-colors"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Mark Resolved</span>
                </button>

                {/* 6. Deny */}
                <button
                  type="button"
                  onClick={() => {
                    resolveReturnReport(
                      inspectingReport.id,
                      'denied',
                      resolutionNotes || 'Claim does not meet return policy criteria.'
                    );
                    setInspectingReport(null);
                  }}
                  className="p-2.5 bg-rose-700 hover:bg-rose-800 text-white font-bold rounded-xl shadow-xs flex flex-col items-center justify-center gap-1 transition-colors"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Deny Claim</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
