import React, { useMemo, useState } from 'react';
import {
  applyDeliveryValidation,
  applyReceiptValidation,
  buildDeliveryReference,
  buildReceiptReference,
  createEmptyDelivery,
  createEmptyReceipt,
  ensureSeedState,
  readState,
  saveDelivery,
  saveReceipt,
} from './inventoryService';

const formatStatus = (status) => status || 'Draft';

const getDocumentRows = (search, rows) => {
  if (!search.trim()) {
    return rows;
  }

  const term = search.toLowerCase();
  return rows.filter((row) => {
    const sourceText = `${row.reference || ''} ${row.supplier || row.customer || ''} ${row.responsible || ''}`.toLowerCase();
    return sourceText.includes(term);
  });
};

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [operationsTab, setOperationsTab] = useState('receipts');
  const [inventoryState, setInventoryState] = useState(() => ensureSeedState());
  const [receiptSearch, setReceiptSearch] = useState('');
  const [deliverySearch, setDeliverySearch] = useState('');
  const [selectedReceiptId, setSelectedReceiptId] = useState(null);
  const [selectedDeliveryId, setSelectedDeliveryId] = useState(null);
  const [receiptForm, setReceiptForm] = useState(() => createEmptyReceipt(readState()));
  const [deliveryForm, setDeliveryForm] = useState(() => createEmptyDelivery(readState()));
  const [notice, setNotice] = useState({ type: 'info', text: '' });

  const products = inventoryState.products || [];
  const stock = inventoryState.stock || {};
  const totalUnits = Object.values(stock).reduce((sum, value) => sum + Number(value || 0), 0);

  const filteredReceipts = useMemo(
    () => getDocumentRows(receiptSearch, inventoryState.receipts || []),
    [inventoryState, receiptSearch],
  );

  const filteredDeliveries = useMemo(
    () => getDocumentRows(deliverySearch, inventoryState.deliveries || []),
    [inventoryState, deliverySearch],
  );

  const selectedReceipt = useMemo(
    () => (inventoryState.receipts || []).find((item) => item.id === selectedReceiptId) || null,
    [inventoryState, selectedReceiptId],
  );

  const selectedDelivery = useMemo(
    () => (inventoryState.deliveries || []).find((item) => item.id === selectedDeliveryId) || null,
    [inventoryState, selectedDeliveryId],
  );

  const updateReceiptItem = (itemId, field, value) => {
    setReceiptForm((current) => ({
      ...current,
      items: current.items.map((item) =>
        item.id === itemId
          ? {
              ...item,
              [field]: field === 'quantity' ? Number(value || 0) : value,
            }
          : item,
      ),
    }));
  };

  const updateDeliveryItem = (itemId, field, value) => {
    setDeliveryForm((current) => ({
      ...current,
      items: current.items.map((item) =>
        item.id === itemId
          ? {
              ...item,
              [field]: field === 'quantity' ? Number(value || 0) : value,
            }
          : item,
      ),
    }));
  };

  const addReceiptItem = () => {
    setReceiptForm((current) => ({
      ...current,
      items: [...(current.items || []), { id: `${Date.now()}-${Math.random()}`, productName: '', quantity: 1 }],
    }));
  };

  const removeReceiptItem = (itemId) => {
    setReceiptForm((current) => ({
      ...current,
      items: current.items.filter((item) => item.id !== itemId),
    }));
  };

  const addDeliveryItem = () => {
    setDeliveryForm((current) => ({
      ...current,
      items: [...(current.items || []), { id: `${Date.now()}-${Math.random()}`, productName: '', quantity: 1 }],
    }));
  };

  const removeDeliveryItem = (itemId) => {
    setDeliveryForm((current) => ({
      ...current,
      items: current.items.filter((item) => item.id !== itemId),
    }));
  };

  const handleReceiptSave = () => {
    const result = saveReceipt(inventoryState, receiptForm);

    if (!result.ok) {
      setNotice({ type: 'error', text: result.message });
      return;
    }

    setInventoryState(result.state);
    setReceiptForm(createEmptyReceipt(result.state));
    setSelectedReceiptId(null);
    setNotice({ type: 'success', text: result.message });
  };

  const handleDeliverySave = () => {
    const result = saveDelivery(inventoryState, deliveryForm);

    if (!result.ok) {
      setNotice({ type: 'error', text: result.message });
      return;
    }

    setInventoryState(result.state);
    setDeliveryForm(createEmptyDelivery(result.state));
    setSelectedDeliveryId(null);
    setNotice({ type: 'success', text: result.message });
  };

  const handleReceiptValidate = (documentId) => {
    const result = applyReceiptValidation(inventoryState, documentId);
    setInventoryState(result.state);

    if (!result.ok) {
      setNotice({ type: 'error', text: result.message });
      return;
    }

    setNotice({ type: 'success', text: result.message });
    const latest = (result.state.receipts || []).find((item) => item.id === documentId);
    if (latest) {
      setReceiptForm({ ...latest, items: latest.items || [] });
    }
  };

  const handleDeliveryValidate = (documentId) => {
    const result = applyDeliveryValidation(inventoryState, documentId);
    setInventoryState(result.state);

    if (!result.ok) {
      setNotice({ type: 'error', text: result.message });
      return;
    }

    setNotice({ type: 'success', text: result.message });
    const latest = (result.state.deliveries || []).find((item) => item.id === documentId);
    if (latest) {
      setDeliveryForm({ ...latest, items: latest.items || [] });
    }
  };

  const handleLogin = (event) => {
    event.preventDefault();
    setIsLoggedIn(true);
    setActiveTab('dashboard');
  };

  const renderDashboard = () => (
    <div>
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Inventory Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
          <p className="text-sm font-medium text-slate-500">Products</p>
          <p className="text-3xl font-bold text-slate-800 mt-2">{products.length}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
          <p className="text-sm font-medium text-slate-500">Total Stock</p>
          <p className="text-3xl font-bold text-emerald-600 mt-2">{totalUnits}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
          <p className="text-sm font-medium text-slate-500">Receipts</p>
          <p className="text-3xl font-bold text-blue-600 mt-2">{(inventoryState.receipts || []).length}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
          <p className="text-sm font-medium text-slate-500">Deliveries</p>
          <p className="text-3xl font-bold text-amber-600 mt-2">{(inventoryState.deliveries || []).length}</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">Current stock</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-600">
                <th className="py-2 pr-4">Product</th>
                <th className="py-2 pr-4">Quantity</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id} className="border-b border-slate-100">
                  <td className="py-2 pr-4">{product.name}</td>
                  <td className="py-2 pr-4">{Number(stock[product.id] || 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderOperationsTable = (items, type) => (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 border-b border-slate-200">
        <h2 className="text-xl font-bold text-slate-800">{type === 'receipt' ? 'Receipts' : 'Delivery'}</h2>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              setNotice({ type: 'info', text: '' });
              if (type === 'receipt') {
                setSelectedReceiptId(null);
                setReceiptForm(createEmptyReceipt(inventoryState));
              } else {
                setSelectedDeliveryId(null);
                setDeliveryForm(createEmptyDelivery(inventoryState));
              }
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
          >
            New
          </button>
          <input
            value={type === 'receipt' ? receiptSearch : deliverySearch}
            onChange={(event) => {
              if (type === 'receipt') {
                setReceiptSearch(event.target.value);
              } else {
                setDeliverySearch(event.target.value);
              }
            }}
            className="border border-slate-300 rounded-md px-3 py-2 text-sm w-52"
            placeholder="Search"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-600">
            <tr>
              <th className="py-3 px-4">Reference</th>
              <th className="py-3 px-4">From</th>
              <th className="py-3 px-4">To</th>
              <th className="py-3 px-4">Contact</th>
              <th className="py-3 px-4">Date</th>
              <th className="py-3 px-4">Status</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td className="py-6 px-4 text-slate-500" colSpan="6">No records found.</td>
              </tr>
            ) : (
              items.map((item) => (
                <tr
                  key={item.id}
                  className="border-t border-slate-100 hover:bg-slate-50 cursor-pointer"
                  onClick={() => {
                    if (type === 'receipt') {
                      setSelectedReceiptId(item.id);
                      setReceiptForm({ ...item, items: item.items || [] });
                    } else {
                      setSelectedDeliveryId(item.id);
                      setDeliveryForm({ ...item, items: item.items || [] });
                    }
                  }}
                >
                  <td className="py-3 px-4 font-medium text-slate-700">{item.reference}</td>
                  <td className="py-3 px-4">{type === 'receipt' ? item.supplier : item.customer}</td>
                  <td className="py-3 px-4">{type === 'receipt' ? item.destination : item.source}</td>
                  <td className="py-3 px-4">{item.responsible}</td>
                  <td className="py-3 px-4">{item.scheduledDate}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold">
                      {formatStatus(item.status)}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderReceiptForm = () => (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-slate-800">Receipt</h3>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              if (selectedReceiptId) {
                handleReceiptValidate(selectedReceiptId);
              } else {
                setNotice({ type: 'error', text: 'Select or save a receipt before validating.' });
              }
            }}
            className="bg-emerald-600 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-emerald-700"
          >
            Validate
          </button>
          <button
            type="button"
            onClick={handleReceiptSave}
            className="bg-slate-700 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-slate-800"
          >
            Save
          </button>
          <button
            type="button"
            onClick={() => {
              setSelectedReceiptId(null);
              setReceiptForm(createEmptyReceipt(inventoryState));
              setNotice({ type: 'info', text: 'Receipt form cleared.' });
            }}
            className="border border-slate-300 px-3 py-2 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            Cancel
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <label className="text-sm font-medium text-slate-700">
          Receipt reference
          <input
            value={receiptForm.reference || buildReceiptReference(inventoryState)}
            onChange={(event) => setReceiptForm((current) => ({ ...current, reference: event.target.value }))}
            className="mt-1 w-full border border-slate-300 rounded-md px-3 py-2"
          />
        </label>
        <label className="text-sm font-medium text-slate-700">
          Supplier / From
          <input
            value={receiptForm.supplier || ''}
            onChange={(event) => setReceiptForm((current) => ({ ...current, supplier: event.target.value }))}
            className="mt-1 w-full border border-slate-300 rounded-md px-3 py-2"
            placeholder="ABC Steel Suppliers"
          />
        </label>
        <label className="text-sm font-medium text-slate-700">
          Destination warehouse / location
          <input
            value={receiptForm.destination || ''}
            onChange={(event) => setReceiptForm((current) => ({ ...current, destination: event.target.value }))}
            className="mt-1 w-full border border-slate-300 rounded-md px-3 py-2"
            placeholder="Main Warehouse"
          />
        </label>
        <label className="text-sm font-medium text-slate-700">
          Responsible / Contact
          <input
            value={receiptForm.responsible || ''}
            onChange={(event) => setReceiptForm((current) => ({ ...current, responsible: event.target.value }))}
            className="mt-1 w-full border border-slate-300 rounded-md px-3 py-2"
            placeholder="Arun"
          />
        </label>
        <label className="text-sm font-medium text-slate-700 md:col-span-2">
          Scheduled date
          <input
            type="date"
            value={receiptForm.scheduledDate || new Date().toISOString().slice(0, 10)}
            onChange={(event) => setReceiptForm((current) => ({ ...current, scheduledDate: event.target.value }))}
            className="mt-1 w-full border border-slate-300 rounded-md px-3 py-2"
          />
        </label>
      </div>

      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-lg font-semibold text-slate-800">Products</h4>
          <button
            type="button"
            onClick={addReceiptItem}
            className="border border-blue-300 text-blue-700 px-3 py-1.5 rounded-md text-sm font-medium hover:bg-blue-50"
          >
            + Add Product
          </button>
        </div>

        <div className="space-y-3">
          {receiptForm.items && receiptForm.items.length ? (
            receiptForm.items.map((item) => (
              <div key={item.id} className="grid grid-cols-1 md:grid-cols-[1fr_150px_60px] gap-3 items-end">
                <label className="text-sm font-medium text-slate-700">
                  Product
                  <input
                    list="product-options"
                    value={item.productName || ''}
                    onChange={(event) => updateReceiptItem(item.id, 'productName', event.target.value)}
                    className="mt-1 w-full border border-slate-300 rounded-md px-3 py-2"
                    placeholder="Steel Rod"
                  />
                </label>
                <label className="text-sm font-medium text-slate-700">
                  Quantity
                  <input
                    type="number"
                    min="1"
                    value={item.quantity || 0}
                    onChange={(event) => updateReceiptItem(item.id, 'quantity', event.target.value)}
                    className="mt-1 w-full border border-slate-300 rounded-md px-3 py-2"
                  />
                </label>
                <button
                  type="button"
                  onClick={() => removeReceiptItem(item.id)}
                  className="border border-red-200 text-red-600 px-3 py-2 rounded-md text-sm font-medium hover:bg-red-50"
                >
                  Remove
                </button>
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-500">No product rows yet.</p>
          )}
        </div>
      </div>

      <datalist id="product-options">
        {products.map((product) => (
          <option key={product.id} value={product.name} />
        ))}
      </datalist>
    </div>
  );

  const renderDeliveryForm = () => (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-slate-800">Delivery</h3>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              if (selectedDeliveryId) {
                handleDeliveryValidate(selectedDeliveryId);
              } else {
                setNotice({ type: 'error', text: 'Select or save a delivery before validating.' });
              }
            }}
            className="bg-emerald-600 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-emerald-700"
          >
            Validate
          </button>
          <button
            type="button"
            onClick={handleDeliverySave}
            className="bg-slate-700 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-slate-800"
          >
            Save
          </button>
          <button
            type="button"
            onClick={() => {
              setSelectedDeliveryId(null);
              setDeliveryForm(createEmptyDelivery(inventoryState));
              setNotice({ type: 'info', text: 'Delivery form cleared.' });
            }}
            className="border border-slate-300 px-3 py-2 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            Cancel
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <label className="text-sm font-medium text-slate-700">
          Delivery reference
          <input
            value={deliveryForm.reference || buildDeliveryReference(inventoryState)}
            onChange={(event) => setDeliveryForm((current) => ({ ...current, reference: event.target.value }))}
            className="mt-1 w-full border border-slate-300 rounded-md px-3 py-2"
          />
        </label>
        <label className="text-sm font-medium text-slate-700">
          Delivery address / customer
          <input
            value={deliveryForm.customer || ''}
            onChange={(event) => setDeliveryForm((current) => ({ ...current, customer: event.target.value }))}
            className="mt-1 w-full border border-slate-300 rounded-md px-3 py-2"
            placeholder="XYZ Manufacturing"
          />
        </label>
        <label className="text-sm font-medium text-slate-700">
          Source warehouse / location
          <input
            value={deliveryForm.source || ''}
            onChange={(event) => setDeliveryForm((current) => ({ ...current, source: event.target.value }))}
            className="mt-1 w-full border border-slate-300 rounded-md px-3 py-2"
            placeholder="Main Warehouse"
          />
        </label>
        <label className="text-sm font-medium text-slate-700">
          Responsible
          <input
            value={deliveryForm.responsible || ''}
            onChange={(event) => setDeliveryForm((current) => ({ ...current, responsible: event.target.value }))}
            className="mt-1 w-full border border-slate-300 rounded-md px-3 py-2"
            placeholder="Arun"
          />
        </label>
        <label className="text-sm font-medium text-slate-700 md:col-span-2">
          Scheduled date
          <input
            type="date"
            value={deliveryForm.scheduledDate || new Date().toISOString().slice(0, 10)}
            onChange={(event) => setDeliveryForm((current) => ({ ...current, scheduledDate: event.target.value }))}
            className="mt-1 w-full border border-slate-300 rounded-md px-3 py-2"
          />
        </label>
      </div>

      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-lg font-semibold text-slate-800">Products</h4>
          <button
            type="button"
            onClick={addDeliveryItem}
            className="border border-blue-300 text-blue-700 px-3 py-1.5 rounded-md text-sm font-medium hover:bg-blue-50"
          >
            + Add Product
          </button>
        </div>

        <div className="space-y-3">
          {deliveryForm.items && deliveryForm.items.length ? (
            deliveryForm.items.map((item) => (
              <div key={item.id} className="grid grid-cols-1 md:grid-cols-[1fr_150px_60px] gap-3 items-end">
                <label className="text-sm font-medium text-slate-700">
                  Product
                  <input
                    list="product-options"
                    value={item.productName || ''}
                    onChange={(event) => updateDeliveryItem(item.id, 'productName', event.target.value)}
                    className="mt-1 w-full border border-slate-300 rounded-md px-3 py-2"
                    placeholder="Steel Rod"
                  />
                </label>
                <label className="text-sm font-medium text-slate-700">
                  Quantity
                  <input
                    type="number"
                    min="1"
                    value={item.quantity || 0}
                    onChange={(event) => updateDeliveryItem(item.id, 'quantity', event.target.value)}
                    className="mt-1 w-full border border-slate-300 rounded-md px-3 py-2"
                  />
                </label>
                <button
                  type="button"
                  onClick={() => removeDeliveryItem(item.id)}
                  className="border border-red-200 text-red-600 px-3 py-2 rounded-md text-sm font-medium hover:bg-red-50"
                >
                  Remove
                </button>
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-500">No product rows yet.</p>
          )}
        </div>
      </div>
    </div>
  );

  const renderMoveHistory = () => (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-4 border-b border-slate-200">
        <h2 className="text-xl font-bold text-slate-800">Move History</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-600">
            <tr>
              <th className="py-3 px-4">Reference</th>
              <th className="py-3 px-4">Type</th>
              <th className="py-3 px-4">Product</th>
              <th className="py-3 px-4">Quantity</th>
              <th className="py-3 px-4">From</th>
              <th className="py-3 px-4">To</th>
            </tr>
          </thead>
          <tbody>
            {(inventoryState.ledger || []).length === 0 ? (
              <tr>
                <td className="py-6 px-4 text-slate-500" colSpan="6">No stock movement records yet.</td>
              </tr>
            ) : (
              (inventoryState.ledger || []).map((entry) => (
                <tr key={entry.id} className="border-t border-slate-100">
                  <td className="py-3 px-4 font-medium text-slate-700">{entry.reference}</td>
                  <td className="py-3 px-4">{entry.type}</td>
                  <td className="py-3 px-4">{entry.productName || entry.productId}</td>
                  <td className="py-3 px-4">{entry.quantity}</td>
                  <td className="py-3 px-4">{entry.from}</td>
                  <td className="py-3 px-4">{entry.to}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-bold text-slate-800 mb-2">StockSense IMS</h2>
          <p className="text-sm text-slate-500 mb-6">Sign in to access your dashboard</p>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">Email</label>
              <input type="email" required className="w-full mt-1 px-3 py-2 border rounded-md" placeholder="manager@stocksense.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Password</label>
              <input type="password" required className="w-full mt-1 px-3 py-2 border rounded-md" placeholder="••••••••" />
            </div>
            <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 font-medium">
              Sign In
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-slate-100">
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col justify-between p-4">
        <div>
          <div className="text-xl font-bold text-white mb-8 tracking-wider">StockSense IMS</div>
          <nav className="space-y-2">
            <button onClick={() => setActiveTab('dashboard')} className={`w-full text-left px-3 py-2 rounded-md font-medium ${activeTab === 'dashboard' ? 'bg-blue-600 text-white' : 'hover:bg-slate-800'}`}>
              📊 Dashboard
            </button>
            <button onClick={() => setActiveTab('products')} className={`w-full text-left px-3 py-2 rounded-md font-medium ${activeTab === 'products' ? 'bg-blue-600 text-white' : 'hover:bg-slate-800'}`}>
              📦 Products
            </button>
            <button onClick={() => setActiveTab('operations')} className={`w-full text-left px-3 py-2 rounded-md font-medium ${activeTab === 'operations' ? 'bg-blue-600 text-white' : 'hover:bg-slate-800'}`}>
              🔄 Operations
            </button>
            <button onClick={() => setActiveTab('history')} className={`w-full text-left px-3 py-2 rounded-md font-medium ${activeTab === 'history' ? 'bg-blue-600 text-white' : 'hover:bg-slate-800'}`}>
              🧾 Move History
            </button>
            <button onClick={() => setActiveTab('settings')} className={`w-full text-left px-3 py-2 rounded-md font-medium ${activeTab === 'settings' ? 'bg-blue-600 text-white' : 'hover:bg-slate-800'}`}>
              ⚙️ Settings
            </button>
          </nav>
        </div>

        <div className="border-t border-slate-800 pt-4">
          <div className="text-sm font-medium text-white mb-2">My Profile</div>
          <button onClick={() => setIsLoggedIn(false)} className="w-full text-left px-3 py-2 text-red-400 hover:bg-slate-800 rounded-md text-sm font-medium">
            🚪 Logout
          </button>
        </div>
      </aside>

      <main className="flex-1 p-8 overflow-y-auto">
        {activeTab === 'dashboard' && renderDashboard()}

        {activeTab === 'products' && (
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
            <h1 className="text-2xl font-bold text-slate-800 mb-4">Products</h1>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-left text-slate-600">
                  <tr>
                    <th className="py-3 px-4">Product</th>
                    <th className="py-3 px-4">SKU</th>
                    <th className="py-3 px-4">In Stock</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product.id} className="border-t border-slate-100">
                      <td className="py-3 px-4">{product.name}</td>
                      <td className="py-3 px-4">{product.sku}</td>
                      <td className="py-3 px-4">{Number(stock[product.id] || 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'operations' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4">
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setOperationsTab('receipts')}
                  className={`px-4 py-2 rounded-md text-sm font-medium ${operationsTab === 'receipts' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'}`}
                >
                  Receipts
                </button>
                <button
                  type="button"
                  onClick={() => setOperationsTab('deliveries')}
                  className={`px-4 py-2 rounded-md text-sm font-medium ${operationsTab === 'deliveries' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'}`}
                >
                  Delivery
                </button>
              </div>
            </div>

            {notice.text && (
              <div
                className={`rounded-md px-4 py-3 text-sm ${
                  notice.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                }`}
              >
                {notice.text}
              </div>
            )}

            {operationsTab === 'receipts' ? (
              <div className="grid grid-cols-1 xl:grid-cols-[1.3fr_1fr] gap-6">
                {renderOperationsTable(filteredReceipts, 'receipt')}
                {renderReceiptForm()}
              </div>
            ) : (
              <div className="grid grid-cols-1 xl:grid-cols-[1.3fr_1fr] gap-6">
                {renderOperationsTable(filteredDeliveries, 'delivery')}
                {renderDeliveryForm()}
              </div>
            )}
          </div>
        )}

        {activeTab === 'history' && renderMoveHistory()}

        {activeTab === 'settings' && (
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
            <h1 className="text-2xl font-bold text-slate-800 mb-4">Settings</h1>
            <p className="text-slate-600">Warehouse configuration and settings are managed outside this module.</p>
          </div>
        )}
      </main>
    </div>
  );
}