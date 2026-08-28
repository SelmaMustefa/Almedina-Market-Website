import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatETB, formatDate } from '../../utils/distance';
import { ChartBar as BarChart3, Download, TrendingUp, TriangleAlert as AlertTriangle, CircleCheck as CheckCircle2 } from 'lucide-react';

export const AdminReportsManager: React.FC = () => {
  const { orders, products, showToast } = useApp();

  const [dateFilter, setDateFilter] = useState<'today' | 'week' | 'month' | 'all'>('all');

  const now = new Date();

  // Filter paid orders based on dateFilter
  const paidOrders = orders.filter((o) => {
    if (o.paymentStatus !== 'paid') return false;
    const txDate = new Date(o.paidAt || o.updatedAt || o.createdAt);
    if (dateFilter === 'today') {
      return txDate.toDateString() === now.toDateString();
    }
    if (dateFilter === 'week') {
      const diffDays = (now.getTime() - txDate.getTime()) / (1000 * 3600 * 24);
      return diffDays >= 0 && diffDays <= 7;
    }
    if (dateFilter === 'month') {
      return txDate.getMonth() === now.getMonth() && txDate.getFullYear() === now.getFullYear();
    }
    return true; // 'all'
  });

  const totalRevenueETB = paidOrders.reduce((sum, o) => sum + o.totalETB, 0);
  const chapaRevenueETB = paidOrders.filter((o) => o.paymentMethod !== 'cod').reduce((sum, o) => sum + o.totalETB, 0);
  const cashRevenueETB = paidOrders.filter((o) => o.paymentMethod === 'cod').reduce((sum, o) => sum + o.totalETB, 0);

  // Best selling products calculation from filtered paid orders
  const productSalesMap: { [key: string]: { name: string; qty: number; revenue: number } } = {};

  paidOrders.forEach((o) => {
    o.items.forEach((item) => {
      if (!productSalesMap[item.productId]) {
        productSalesMap[item.productId] = { name: item.productName, qty: 0, revenue: 0 };
      }
      productSalesMap[item.productId].qty += item.quantity;
      productSalesMap[item.productId].revenue += item.subtotalETB;
    });
  });

  const bestSellingList = Object.values(productSalesMap).sort((a, b) => b.revenue - a.revenue);

  const lowStockProducts = products.filter((p) => p.stockCount <= p.lowStockThreshold);

  // CSV Export Simulator
  const handleExportCSV = () => {
    let csvContent = 'OrderNumber,CustomerName,CustomerPhone,Fulfillment,PaymentMethod,PaymentStatus,OrderStatus,TotalETB,Date\n';

    orders.forEach((o) => {
      csvContent += `"${o.orderNumber}","${o.customerName}","${o.customerPhone}","${o.fulfillmentType}","${o.paymentMethod}","${o.paymentStatus}","${o.orderStatus}",${o.totalETB},"${o.createdAt}"\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Almedina_Market_Order_History_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('Downloaded Almedina Market Order History CSV export!', 'success');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Daily Sales Reports & CSV Data Export</h2>
          <p className="text-xs text-slate-500">
            Export order history, track top-selling items, and monitor low-stock alerts.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2 self-start sm:self-auto"
        >
          <Download className="w-4 h-4 text-emerald-400" />
          <span>Export Order History (CSV)</span>
        </button>
      </div>

      {/* Revenue Summary */}
      <div className="bg-emerald-950 text-white p-6 rounded-2xl shadow-md border border-emerald-800 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-emerald-300">Total Received Sales Volume</p>
          <p className="text-3xl font-black text-white">{formatETB(totalRevenueETB)}</p>
          <p className="text-xs text-emerald-200 mt-1">
            {paidOrders.length} Paid Orders • Chapa: {formatETB(chapaRevenueETB)} • Cash/Admin: {formatETB(cashRevenueETB)}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-emerald-200 font-medium">Filter Range:</span>
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value as any)}
            className="bg-emerald-900 border border-emerald-700 text-white text-xs font-bold rounded-xl px-3 py-1.5 focus:outline-none"
          >
            <option value="today">Today's Sales</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="all">All-Time Recorded</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-xs">
        {/* Best-Selling Products Table */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            Top-Selling Products
          </h3>

          {bestSellingList.length === 0 ? (
            <p className="text-slate-500 italic py-6 text-center">No completed sales recorded yet.</p>
          ) : (
            <div className="space-y-2">
              {bestSellingList.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-700 text-white font-bold text-[10px] flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <div>
                      <p className="font-bold text-slate-900">{item.name}</p>
                      <p className="text-[11px] text-slate-500">{item.qty} units sold</p>
                    </div>
                  </div>

                  <p className="font-extrabold text-slate-900">{formatETB(item.revenue)}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            Low-Stock Inventory Alerts ({lowStockProducts.length})
          </h3>

          {lowStockProducts.length === 0 ? (
            <p className="text-slate-500 italic py-6 text-center bg-slate-50 rounded-xl">
              ✓ All inventory levels are above configured low-stock thresholds!
            </p>
          ) : (
            <div className="space-y-2">
              {lowStockProducts.map((p) => (
                <div
                  key={p.id}
                  className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex items-center justify-between"
                >
                  <div>
                    <p className="font-bold text-slate-900">{p.name}</p>
                    <p className="text-[11px] text-amber-900">
                      Threshold Alert: {p.lowStockThreshold} units
                    </p>
                  </div>

                  <span className="bg-amber-600 text-white px-2.5 py-1 rounded font-bold text-xs">
                    {p.stockCount} Left
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
