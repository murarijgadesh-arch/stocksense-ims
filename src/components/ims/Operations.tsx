import React, { useState, useEffect } from 'react';
import { 
  ArrowDownLeft, 
  ArrowUpRight, 
  ArrowLeftRight, 
  Sliders, 
  History, 
  Plus, 
  CheckCircle2, 
  Clock, 
  X, 
  Loader2, 
  AlertCircle,
  Package,
  Building2,
  FileText
} from 'lucide-react';
import { api } from '../../api/client';
import { 
  Receipt, 
  Delivery, 
  Transfer, 
  Adjustment, 
  StockLedgerEntry, 
  Product, 
  Warehouse 
} from '../../types';

export const Operations: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'receipts' | 'deliveries' | 'transfers' | 'adjustments' | 'ledger'>('receipts');
  
  // Data states
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [adjustments, setAdjustments] = useState<Adjustment[]>([]);
  const [ledger, setLedger] = useState<StockLedgerEntry[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  // Modals state
  const [modalType, setModalType] = useState<'receipt' | 'delivery' | 'transfer' | 'adjustment' | null>(null);
  const [viewDetailModal, setViewDetailModal] = useState<{ type: string; data: any } | null>(null);

  // Form states for creation
  const [partnerName, setPartnerName] = useState('');
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<number>(1);
  const [selectedToWarehouseId, setSelectedToWarehouseId] = useState<number>(2);
  const [selectedProductId, setSelectedProductId] = useState<number>(1);
  const [formQuantity, setFormQuantity] = useState<number>(10);
  const [formReason, setFormReason] = useState('Stock Count Correction');

  const loadData = async () => {
    try {
      setLoading(true);
      setErrorBanner(null);
      const [pList, wList] = await Promise.all([
        api.getProducts(),
        api.getWarehouses(),
      ]);
      setProducts(pList);
      setWarehouses(wList);

      if (pList.length > 0) setSelectedProductId(pList[0].id);
      if (wList.length > 0) {
        setSelectedWarehouseId(wList[0].id);
        if (wList.length > 1) setSelectedToWarehouseId(wList[1].id);
      }

      if (activeTab === 'receipts') {
        const res = await api.getReceipts();
        setReceipts(res);
      } else if (activeTab === 'deliveries') {
        const res = await api.getDeliveries();
        setDeliveries(res);
      } else if (activeTab === 'transfers') {
        const res = await api.getTransfers();
        setTransfers(res);
      } else if (activeTab === 'adjustments') {
        const res = await api.getAdjustments();
        setAdjustments(res);
      } else if (activeTab === 'ledger') {
        const res = await api.getLedger({ limit: 100 });
        setLedger(res);
      }
    } catch (err: any) {
      setErrorBanner(err.message || 'Failed to load operations data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const showSuccess = (msg: string) => {
    setSuccessBanner(msg);
    setTimeout(() => setSuccessBanner(null), 4000);
  };

  // Validation handlers
  const handleValidateReceipt = async (id: number, ref: string) => {
    try {
      setActionLoading(`val-rcp-${id}`);
      setErrorBanner(null);
      await api.validateReceipt(id);
      showSuccess(`Receipt ${ref} validated! Stock received and ledger updated.`);
      loadData();
    } catch (err: any) {
      setErrorBanner(err.message || `Failed to validate receipt ${ref}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleValidateDelivery = async (id: number, ref: string) => {
    try {
      setActionLoading(`val-dlv-${id}`);
      setErrorBanner(null);
      await api.validateDelivery(id);
      showSuccess(`Delivery ${ref} validated! Outbound stock deducted and ledger updated.`);
      loadData();
    } catch (err: any) {
      setErrorBanner(err.message || `Failed to validate delivery ${ref}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleValidateTransfer = async (id: number, ref: string) => {
    try {
      setActionLoading(`val-trf-${id}`);
      setErrorBanner(null);
      await api.validateTransfer(id);
      showSuccess(`Transfer ${ref} validated! Stock moved between warehouses.`);
      loadData();
    } catch (err: any) {
      setErrorBanner(err.message || `Failed to validate transfer ${ref}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleValidateAdjustment = async (id: number, ref: string) => {
    try {
      setActionLoading(`val-adj-${id}`);
      setErrorBanner(null);
      await api.validateAdjustment(id);
      showSuccess(`Adjustment ${ref} validated! Stock updated and ledger logged.`);
      loadData();
    } catch (err: any) {
      setErrorBanner(err.message || `Failed to validate adjustment ${ref}`);
    } finally {
      setActionLoading(null);
    }
  };

  // Submit create operations
  const handleCreateOperation = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setActionLoading('create-op');
      setErrorBanner(null);

      if (modalType === 'receipt') {
        const created = await api.createReceipt({
          supplier: partnerName.trim() || 'Global Supplier',
          warehouseId: Number(selectedWarehouseId),
          items: [{ productId: Number(selectedProductId), quantity: Number(formQuantity) }],
        });
        showSuccess(`Receipt ${created.reference} created as PENDING.`);
      } else if (modalType === 'delivery') {
        const created = await api.createDelivery({
          customer: partnerName.trim() || 'Direct Client',
          warehouseId: Number(selectedWarehouseId),
          items: [{ productId: Number(selectedProductId), quantity: Number(formQuantity) }],
        });
        showSuccess(`Delivery ${created.reference} created as PENDING.`);
      } else if (modalType === 'transfer') {
        const created = await api.createTransfer({
          fromWarehouseId: Number(selectedWarehouseId),
          toWarehouseId: Number(selectedToWarehouseId),
          items: [{ productId: Number(selectedProductId), quantity: Number(formQuantity) }],
        });
        showSuccess(`Transfer ${created.reference} created as PENDING.`);
      } else if (modalType === 'adjustment') {
        const created = await api.createAdjustment({
          warehouseId: Number(selectedWarehouseId),
          reason: formReason.trim() || 'Cycle Count Adjustment',
          items: [{ productId: Number(selectedProductId), quantityChange: Number(formQuantity) }],
        });
        showSuccess(`Adjustment ${created.reference} created as PENDING.`);
      }

      setModalType(null);
      setPartnerName('');
      setFormQuantity(10);
      loadData();
    } catch (err: any) {
      setErrorBanner(err.message || 'Failed to create operation');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="flex-1 p-8 overflow-y-auto space-y-6 bg-slate-950 text-slate-100">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Warehouse Operations & Ledger</h1>
          <p className="text-slate-400 text-sm mt-1">Execute receipts, outbound deliveries, internal transfers & stock adjustments</p>
        </div>

        {activeTab !== 'ledger' && (
          <button
            onClick={() => {
              if (activeTab === 'receipts') setModalType('receipt');
              if (activeTab === 'deliveries') setModalType('delivery');
              if (activeTab === 'transfers') setModalType('transfer');
              if (activeTab === 'adjustments') setModalType('adjustment');
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-semibold transition shadow-lg shadow-emerald-600/20"
          >
            <Plus className="w-4 h-4" />
            <span>
              {activeTab === 'receipts' && 'New Inbound Receipt'}
              {activeTab === 'deliveries' && 'New Delivery Order'}
              {activeTab === 'transfers' && 'New Internal Transfer'}
              {activeTab === 'adjustments' && 'New Stock Adjustment'}
            </span>
          </button>
        )}
      </div>

      {/* Notifications */}
      {successBanner && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{successBanner}</span>
          </div>
          <button onClick={() => setSuccessBanner(null)} className="text-emerald-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {errorBanner && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <span>{errorBanner}</span>
          </div>
          <button onClick={() => setErrorBanner(null)} className="text-red-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-800 space-x-2">
        <button
          onClick={() => setActiveTab('receipts')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition ${
            activeTab === 'receipts'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <ArrowDownLeft className="w-4 h-4" />
          <span>Receipts (Inbound)</span>
        </button>

        <button
          onClick={() => setActiveTab('deliveries')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition ${
            activeTab === 'deliveries'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <ArrowUpRight className="w-4 h-4" />
          <span>Deliveries (Outbound)</span>
        </button>

        <button
          onClick={() => setActiveTab('transfers')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition ${
            activeTab === 'transfers'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <ArrowLeftRight className="w-4 h-4" />
          <span>Transfers</span>
        </button>

        <button
          onClick={() => setActiveTab('adjustments')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition ${
            activeTab === 'adjustments'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Adjustments</span>
        </button>

        <button
          onClick={() => setActiveTab('ledger')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition ${
            activeTab === 'ledger'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Stock Ledger</span>
        </button>
      </div>

      {/* Main Content Area */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
            <p className="text-slate-400 text-sm">Fetching operation records...</p>
          </div>
        ) : (
          <>
            {/* RECEIPTS TAB */}
            {activeTab === 'receipts' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="text-xs uppercase bg-slate-800/60 text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="py-3.5 px-4 font-semibold">Reference</th>
                      <th className="py-3.5 px-4 font-semibold">Supplier</th>
                      <th className="py-3.5 px-4 font-semibold">Destination Warehouse</th>
                      <th className="py-3.5 px-4 font-semibold">Units</th>
                      <th className="py-3.5 px-4 font-semibold">Status</th>
                      <th className="py-3.5 px-4 font-semibold">Date</th>
                      <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/70">
                    {receipts.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-800/40 transition">
                        <td className="py-3.5 px-4 font-mono font-semibold text-xs text-blue-400">{r.reference}</td>
                        <td className="py-3.5 px-4 font-medium text-slate-200">{r.supplier}</td>
                        <td className="py-3.5 px-4 text-slate-400">{r.warehouseName}</td>
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-200">{r.totalUnits}</td>
                        <td className="py-3.5 px-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                            r.status === 'COMPLETED'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}>
                            {r.status === 'COMPLETED' ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                            {r.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-xs text-slate-400">{r.createdAt.slice(0, 16)}</td>
                        <td className="py-3.5 px-4 text-right space-x-2">
                          {r.status === 'PENDING' && (
                            <button
                              onClick={() => handleValidateReceipt(r.id, r.reference)}
                              disabled={actionLoading === `val-rcp-${r.id}`}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-semibold transition disabled:opacity-50"
                            >
                              {actionLoading === `val-rcp-${r.id}` ? 'Validating...' : 'Validate & Receive'}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* DELIVERIES TAB */}
            {activeTab === 'deliveries' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="text-xs uppercase bg-slate-800/60 text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="py-3.5 px-4 font-semibold">Reference</th>
                      <th className="py-3.5 px-4 font-semibold">Customer</th>
                      <th className="py-3.5 px-4 font-semibold">Source Warehouse</th>
                      <th className="py-3.5 px-4 font-semibold">Units</th>
                      <th className="py-3.5 px-4 font-semibold">Status</th>
                      <th className="py-3.5 px-4 font-semibold">Date</th>
                      <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/70">
                    {deliveries.map((d) => (
                      <tr key={d.id} className="hover:bg-slate-800/40 transition">
                        <td className="py-3.5 px-4 font-mono font-semibold text-xs text-emerald-400">{d.reference}</td>
                        <td className="py-3.5 px-4 font-medium text-slate-200">{d.customer}</td>
                        <td className="py-3.5 px-4 text-slate-400">{d.warehouseName}</td>
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-200">{d.totalUnits}</td>
                        <td className="py-3.5 px-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                            d.status === 'COMPLETED'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}>
                            {d.status === 'COMPLETED' ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                            {d.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-xs text-slate-400">{d.createdAt.slice(0, 16)}</td>
                        <td className="py-3.5 px-4 text-right space-x-2">
                          {d.status === 'PENDING' && (
                            <button
                              onClick={() => handleValidateDelivery(d.id, d.reference)}
                              disabled={actionLoading === `val-dlv-${d.id}`}
                              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-semibold transition disabled:opacity-50"
                            >
                              {actionLoading === `val-dlv-${d.id}` ? 'Validating...' : 'Validate & Dispatch'}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* TRANSFERS TAB */}
            {activeTab === 'transfers' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="text-xs uppercase bg-slate-800/60 text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="py-3.5 px-4 font-semibold">Reference</th>
                      <th className="py-3.5 px-4 font-semibold">From Warehouse</th>
                      <th className="py-3.5 px-4 font-semibold">To Warehouse</th>
                      <th className="py-3.5 px-4 font-semibold">Units</th>
                      <th className="py-3.5 px-4 font-semibold">Status</th>
                      <th className="py-3.5 px-4 font-semibold">Date</th>
                      <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/70">
                    {transfers.map((t) => (
                      <tr key={t.id} className="hover:bg-slate-800/40 transition">
                        <td className="py-3.5 px-4 font-mono font-semibold text-xs text-purple-400">{t.reference}</td>
                        <td className="py-3.5 px-4 text-slate-300 font-medium">{t.fromWarehouseName}</td>
                        <td className="py-3.5 px-4 text-slate-300 font-medium">{t.toWarehouseName}</td>
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-200">{t.totalUnits}</td>
                        <td className="py-3.5 px-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                            t.status === 'COMPLETED'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}>
                            {t.status === 'COMPLETED' ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                            {t.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-xs text-slate-400">{t.createdAt.slice(0, 16)}</td>
                        <td className="py-3.5 px-4 text-right space-x-2">
                          {t.status === 'PENDING' && (
                            <button
                              onClick={() => handleValidateTransfer(t.id, t.reference)}
                              disabled={actionLoading === `val-trf-${t.id}`}
                              className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded text-xs font-semibold transition disabled:opacity-50"
                            >
                              {actionLoading === `val-trf-${t.id}` ? 'Validating...' : 'Validate & Transfer'}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* ADJUSTMENTS TAB */}
            {activeTab === 'adjustments' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="text-xs uppercase bg-slate-800/60 text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="py-3.5 px-4 font-semibold">Reference</th>
                      <th className="py-3.5 px-4 font-semibold">Warehouse</th>
                      <th className="py-3.5 px-4 font-semibold">Reason</th>
                      <th className="py-3.5 px-4 font-semibold">Net Change</th>
                      <th className="py-3.5 px-4 font-semibold">Status</th>
                      <th className="py-3.5 px-4 font-semibold">Date</th>
                      <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/70">
                    {adjustments.map((a) => (
                      <tr key={a.id} className="hover:bg-slate-800/40 transition">
                        <td className="py-3.5 px-4 font-mono font-semibold text-xs text-amber-400">{a.reference}</td>
                        <td className="py-3.5 px-4 text-slate-300 font-medium">{a.warehouseName}</td>
                        <td className="py-3.5 px-4 text-slate-400 text-xs">{a.reason}</td>
                        <td className="py-3.5 px-4 font-mono font-bold">
                          <span className={a.totalQuantityChange > 0 ? 'text-emerald-400' : 'text-red-400'}>
                            {a.totalQuantityChange > 0 ? `+${a.totalQuantityChange}` : a.totalQuantityChange}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                            a.status === 'COMPLETED'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}>
                            {a.status === 'COMPLETED' ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                            {a.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-xs text-slate-400">{a.createdAt.slice(0, 16)}</td>
                        <td className="py-3.5 px-4 text-right space-x-2">
                          {a.status === 'PENDING' && (
                            <button
                              onClick={() => handleValidateAdjustment(a.id, a.reference)}
                              disabled={actionLoading === `val-adj-${a.id}`}
                              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded text-xs font-semibold transition disabled:opacity-50"
                            >
                              {actionLoading === `val-adj-${a.id}` ? 'Validating...' : 'Validate & Adjust'}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* STOCK LEDGER TAB */}
            {activeTab === 'ledger' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="text-xs uppercase bg-slate-800/60 text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="py-3.5 px-4 font-semibold">ID</th>
                      <th className="py-3.5 px-4 font-semibold">Product</th>
                      <th className="py-3.5 px-4 font-semibold">Warehouse</th>
                      <th className="py-3.5 px-4 font-semibold">Transaction Type</th>
                      <th className="py-3.5 px-4 font-semibold">Reference</th>
                      <th className="py-3.5 px-4 font-semibold">Qty Change</th>
                      <th className="py-3.5 px-4 font-semibold">Before</th>
                      <th className="py-3.5 px-4 font-semibold">After</th>
                      <th className="py-3.5 px-4 font-semibold">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/70">
                    {ledger.map((l) => (
                      <tr key={l.id} className="hover:bg-slate-800/40 transition">
                        <td className="py-3 px-4 font-mono text-xs text-slate-500">#{l.id}</td>
                        <td className="py-3 px-4">
                          <p className="font-medium text-slate-200 text-xs">{l.productName}</p>
                          <p className="font-mono text-[11px] text-slate-400">{l.productSku}</p>
                        </td>
                        <td className="py-3 px-4 text-xs text-slate-300">{l.warehouseName}</td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
                            l.transactionType === 'RECEIPT' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                            l.transactionType === 'DELIVERY' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                            l.transactionType === 'TRANSFER_IN' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                            l.transactionType === 'TRANSFER_OUT' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' :
                            'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}>
                            {l.transactionType}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-xs text-slate-300">{l.referenceId}</td>
                        <td className="py-3 px-4 font-mono font-bold text-xs">
                          <span className={l.quantityChange > 0 ? 'text-emerald-400' : 'text-red-400'}>
                            {l.quantityChange > 0 ? `+${l.quantityChange}` : l.quantityChange}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-xs text-slate-400">{l.quantityBefore}</td>
                        <td className="py-3 px-4 font-mono font-bold text-xs text-slate-100">{l.quantityAfter}</td>
                        <td className="py-3 px-4 text-xs text-slate-400">{l.createdAt.slice(0, 19).replace('T', ' ')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>

      {/* CREATE MODAL */}
      {modalType && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-400" />
                <span>
                  {modalType === 'receipt' && 'Create Inbound Receipt'}
                  {modalType === 'delivery' && 'Create Delivery Order'}
                  {modalType === 'transfer' && 'Create Internal Transfer'}
                  {modalType === 'adjustment' && 'Create Stock Adjustment'}
                </span>
              </h2>
              <button onClick={() => setModalType(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateOperation} className="space-y-4">
              {/* Partner Name (Supplier / Customer) */}
              {(modalType === 'receipt' || modalType === 'delivery') && (
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    {modalType === 'receipt' ? 'Supplier Name' : 'Customer Name'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={modalType === 'receipt' ? 'e.g. Apex Hardware Direct' : 'e.g. Bright Retail Co.'}
                    value={partnerName}
                    onChange={(e) => setPartnerName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              )}

              {/* Adjustment reason */}
              {modalType === 'adjustment' && (
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Adjustment Reason</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Damaged goods write-off or cycle count discrepancy"
                    value={formReason}
                    onChange={(e) => setFormReason(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              )}

              {/* Warehouses Selection */}
              {modalType === 'transfer' ? (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Source Warehouse</label>
                    <select
                      value={selectedWarehouseId}
                      onChange={(e) => setSelectedWarehouseId(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                    >
                      {warehouses.map((w) => (
                        <option key={w.id} value={w.id}>{w.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Dest Warehouse</label>
                    <select
                      value={selectedToWarehouseId}
                      onChange={(e) => setSelectedToWarehouseId(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                    >
                      {warehouses.map((w) => (
                        <option key={w.id} value={w.id}>{w.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Warehouse</label>
                  <select
                    value={selectedWarehouseId}
                    onChange={(e) => setSelectedWarehouseId(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                  >
                    {warehouses.map((w) => (
                      <option key={w.id} value={w.id}>{w.name} ({w.code})</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Product Selection */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Product</label>
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>{p.sku} - {p.name}</option>
                  ))}
                </select>
              </div>

              {/* Quantity */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  {modalType === 'adjustment' ? 'Quantity Change (+/-)' : 'Quantity'}
                </label>
                <input
                  type="number"
                  required
                  value={formQuantity}
                  onChange={(e) => setFormQuantity(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-emerald-500 font-mono"
                />
                {modalType === 'adjustment' && (
                  <p className="text-[11px] text-slate-400 mt-1">Use negative values to deduct (e.g. -5) or positive to add.</p>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalType(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading === 'create-op'}
                  className="flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-semibold transition shadow-lg shadow-emerald-600/20 disabled:opacity-50"
                >
                  {actionLoading === 'create-op' && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Create Operation</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
