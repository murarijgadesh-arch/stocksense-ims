import React, { useEffect, useState } from 'react';
import { 
  Package, 
  AlertTriangle, 
  TrendingUp, 
  Truck, 
  ArrowDownLeft, 
  ArrowUpRight, 
  RefreshCw,
  Clock,
  CheckCircle2,
  Boxes,
  Layers
} from 'lucide-react';
import { api } from '../../api/client';
import { DashboardData } from '../../types';

export const Dashboard: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getDashboard();
      setData(res);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading && !data) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin" />
          <p className="text-slate-400 text-sm font-medium">Loading live dashboard metrics...</p>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="flex-1 p-8">
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-6 rounded-xl flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-lg">Error loading live data</h3>
            <p className="text-sm mt-1">{error}</p>
          </div>
          <button
            onClick={fetchDashboard}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const kpis = data?.kpis;

  return (
    <div className="flex-1 p-8 overflow-y-auto space-y-8 bg-slate-950 text-slate-100">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Stock Operations Dashboard</h1>
          <p className="text-slate-400 text-sm mt-1">Real-time inventory levels, pending shipments & ledger activity</p>
        </div>
        <button
          onClick={fetchDashboard}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-sm font-medium transition border border-slate-700"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Products */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-sm font-medium">Total Products</span>
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-bold text-white">{kpis?.totalProducts || 0}</span>
            <span className="text-xs text-slate-400 ml-2">SKUs cataloged</span>
          </div>
        </div>

        {/* Total Stock Units */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-sm font-medium">Total Stock Units</span>
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <Boxes className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-bold text-white">{kpis?.totalStockUnits?.toLocaleString() || 0}</span>
            <span className="text-xs text-slate-400 ml-2">Units in warehouses</span>
          </div>
        </div>

        {/* Low / Out of Stock */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-sm font-medium">Stock Alerts</span>
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-amber-400">{kpis?.lowStockCount || 0}</span>
            <span className="text-xs text-slate-400">Low stock</span>
            <span className="text-slate-600">|</span>
            <span className="text-lg font-bold text-red-400">{kpis?.outOfStockCount || 0}</span>
            <span className="text-xs text-slate-400">Out of stock</span>
          </div>
        </div>

        {/* Pending Inbound / Outbound */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-sm font-medium">Pending Operations</span>
            <div className="w-10 h-10 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <Truck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-3 text-sm">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-400"></span>
              <span className="text-slate-300 font-semibold">{kpis?.pendingReceipts || 0}</span>
              <span className="text-xs text-slate-400">Inbound</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
              <span className="text-slate-300 font-semibold">{kpis?.pendingDeliveries || 0}</span>
              <span className="text-xs text-slate-400">Outbound</span>
            </div>
          </div>
        </div>
      </div>

      {/* Warehouse and Category summaries */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Warehouses Summary */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-400" />
            <span>Stock by Warehouse</span>
          </h2>
          <div className="space-y-3">
            {data?.stockByWarehouse?.map((wh) => (
              <div key={wh.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-slate-800">
                <div>
                  <p className="text-sm font-medium text-slate-200">{wh.name}</p>
                  <p className="text-xs text-slate-400">{wh.code} • {wh.productCount} products stored</p>
                </div>
                <div className="text-right">
                  <span className="text-base font-bold text-emerald-400">{wh.totalUnits}</span>
                  <span className="text-xs text-slate-400 ml-1">units</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
            <Package className="w-4 h-4 text-blue-400" />
            <span>Stock by Category</span>
          </h2>
          <div className="space-y-3">
            {data?.stockByCategory?.map((cat) => (
              <div key={cat.category} className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-slate-800">
                <div>
                  <p className="text-sm font-medium text-slate-200">{cat.category}</p>
                  <p className="text-xs text-slate-400">{cat.productCount} product SKUs</p>
                </div>
                <div className="text-right">
                  <span className="text-base font-bold text-blue-400">{cat.totalUnits}</span>
                  <span className="text-xs text-slate-400 ml-1">units</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity: Documents & Ledger */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Operations */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col">
          <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-purple-400" />
            <span>Recent Operations</span>
          </h2>
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="pb-3 font-semibold">Reference</th>
                  <th className="pb-3 font-semibold">Type</th>
                  <th className="pb-3 font-semibold">Partner / Details</th>
                  <th className="pb-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {data?.recentDocuments?.map((doc, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/40">
                    <td className="py-3 font-mono text-xs font-semibold text-slate-300">{doc.reference}</td>
                    <td className="py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        doc.type === 'Receipt' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                        doc.type === 'Delivery' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                        doc.type === 'Transfer' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                        'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}>
                        {doc.type}
                      </span>
                    </td>
                    <td className="py-3 text-xs text-slate-300 truncate max-w-[140px]">{doc.partner}</td>
                    <td className="py-3">
                      <span className={`inline-flex items-center gap-1 text-xs font-medium ${
                        doc.status === 'COMPLETED' ? 'text-emerald-400' : 'text-amber-400'
                      }`}>
                        {doc.status === 'COMPLETED' ? (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        ) : (
                          <Clock className="w-3.5 h-3.5" />
                        )}
                        {doc.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Ledger Transactions */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col">
          <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <span>Live Stock Ledger Activity</span>
          </h2>
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="pb-3 font-semibold">SKU / Product</th>
                  <th className="pb-3 font-semibold">Warehouse</th>
                  <th className="pb-3 font-semibold">Change</th>
                  <th className="pb-3 font-semibold">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {data?.recentLedger?.map((entry) => (
                  <tr key={entry.id} className="hover:bg-slate-800/40">
                    <td className="py-3">
                      <p className="font-medium text-slate-200 text-xs truncate max-w-[120px]">{entry.productName}</p>
                      <p className="font-mono text-[11px] text-slate-500">{entry.productSku}</p>
                    </td>
                    <td className="py-3 text-xs text-slate-400">{entry.warehouseName}</td>
                    <td className="py-3">
                      <span className={`font-semibold font-mono text-xs ${
                        entry.quantityChange > 0 ? 'text-emerald-400' : 'text-red-400'
                      }`}>
                        {entry.quantityChange > 0 ? `+${entry.quantityChange}` : entry.quantityChange}
                      </span>
                    </td>
                    <td className="py-3 font-mono font-medium text-xs text-slate-300">{entry.quantityAfter}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
