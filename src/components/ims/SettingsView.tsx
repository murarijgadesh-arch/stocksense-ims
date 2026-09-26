import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Plus, 
  Database, 
  Server, 
  ShieldCheck, 
  CheckCircle2, 
  Loader2, 
  X,
  AlertCircle
} from 'lucide-react';
import { api } from '../../api/client';
import { Warehouse } from '../../types';

export const SettingsView: React.FC = () => {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [adding, setAdding] = useState(false);
  const [whName, setWhName] = useState('');
  const [whCode, setWhCode] = useState('');
  const [whLoc, setWhLoc] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchWarehouses = async () => {
    try {
      setLoading(true);
      const list = await api.getWarehouses();
      setWarehouses(list);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load warehouses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWarehouses();
  }, []);

  const handleAddWarehouse = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setAdding(true);
      setErrorMsg(null);
      await api.createWarehouse({
        name: whName.trim(),
        code: whCode.trim(),
        location: whLoc.trim() || undefined,
      });
      setSuccessMsg(`Warehouse ${whName} added successfully!`);
      setShowAddModal(false);
      setWhName('');
      setWhCode('');
      setWhLoc('');
      fetchWarehouses();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to add warehouse');
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="flex-1 p-8 overflow-y-auto space-y-8 bg-slate-950 text-slate-100">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">System Settings & Infrastructure</h1>
        <p className="text-slate-400 text-sm mt-1">Configure storage locations, database connections, and system parameters</p>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)}><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Warehouses Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Warehouses & Storage Locations</h2>
              <p className="text-xs text-slate-400">Manage operational depots and fulfillment hubs</p>
            </div>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add Warehouse</span>
          </button>
        </div>

        {loading ? (
          <div className="py-6 flex justify-center">
            <Loader2 className="w-6 h-6 text-emerald-500 animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {warehouses.map((w) => (
              <div key={w.id} className="p-4 rounded-xl bg-slate-800/40 border border-slate-800 flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-xs font-mono font-bold border border-emerald-500/20">
                      {w.code}
                    </span>
                    <h3 className="font-semibold text-sm text-slate-200">{w.name}</h3>
                  </div>
                  <p className="text-xs text-slate-400 mt-2">{w.location || 'Primary distribution center'}</p>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-slate-200">{w.totalStockUnits || 0}</span>
                  <span className="text-xs text-slate-500 block">units in stock</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Database & Architecture Summary */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Database & Ledger Architecture</h2>
            <p className="text-xs text-slate-400">Transactional SQLite with immutable audit ledger</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div className="p-4 bg-slate-800/40 rounded-xl border border-slate-800">
            <p className="text-xs text-slate-400 font-medium">Database Engine</p>
            <p className="text-sm font-semibold text-slate-200 mt-1">SQLite 3 (WAL mode)</p>
            <p className="text-[11px] text-emerald-400 mt-1">✓ Atomic immediate transactions</p>
          </div>
          <div className="p-4 bg-slate-800/40 rounded-xl border border-slate-800">
            <p className="text-xs text-slate-400 font-medium">Ledger Audit Trail</p>
            <p className="text-sm font-semibold text-slate-200 mt-1">100% Append-only</p>
            <p className="text-[11px] text-emerald-400 mt-1">✓ Quantity before/after tracking</p>
          </div>
          <div className="p-4 bg-slate-800/40 rounded-xl border border-slate-800">
            <p className="text-xs text-slate-400 font-medium">Integrity Enforcement</p>
            <p className="text-sm font-semibold text-slate-200 mt-1">Zero Negative Stock</p>
            <p className="text-[11px] text-emerald-400 mt-1">✓ Foreign keys & constraints active</p>
          </div>
        </div>
      </div>

      {/* Add Warehouse Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-emerald-400" />
                <span>Add Warehouse Location</span>
              </h2>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg text-xs">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleAddWarehouse} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Warehouse Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. East Coast Hub"
                  value={whName}
                  onChange={(e) => setWhName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Code</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. WH-EC"
                  value={whCode}
                  onChange={(e) => setWhCode(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Location / Address</label>
                <input
                  type="text"
                  placeholder="e.g. 400 Atlantic Ave, Bay 4"
                  value={whLoc}
                  onChange={(e) => setWhLoc(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={adding}
                  className="flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-semibold transition shadow-lg shadow-emerald-600/20 disabled:opacity-50"
                >
                  {adding && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Save Warehouse</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
