import React, { useState } from 'react';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');

  // Handle Login
  const handleLogin = (e) => {
    e.preventDefault();
    setIsLoggedIn(true);
  };

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
      {/* 1. LEFT SIDEBAR NAVIGATION */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col justify-between p-4">
        <div>
          <div className="text-xl font-bold text-white mb-8 tracking-wider">StockSense IMS</div>
          <nav className="space-y-2">
            <button 
              onClick={() => setActiveTab('dashboard')}
              className={`w-full text-left px-3 py-2 rounded-md font-medium ${activeTab === 'dashboard' ? 'bg-blue-600 text-white' : 'hover:bg-slate-800'}`}
            >
              📊 Dashboard
            </button>
            <button 
              onClick={() => setActiveTab('products')}
              className={`w-full text-left px-3 py-2 rounded-md font-medium ${activeTab === 'products' ? 'bg-blue-600 text-white' : 'hover:bg-slate-800'}`}
            >
              📦 Products
            </button>
            <button 
              onClick={() => setActiveTab('operations')}
              className={`w-full text-left px-3 py-2 rounded-md font-medium ${activeTab === 'operations' ? 'bg-blue-600 text-white' : 'hover:bg-slate-800'}`}
            >
              🔄 Operations
            </button>
            <button 
              onClick={() => setActiveTab('settings')}
              className={`w-full text-left px-3 py-2 rounded-md font-medium ${activeTab === 'settings' ? 'bg-blue-600 text-white' : 'hover:bg-slate-800'}`}
            >
              ⚙️ Settings / Warehouse
            </button>
          </nav>
        </div>

        {/* Profile Menu */}
        <div className="border-t border-slate-800 pt-4">
          <div className="text-sm font-medium text-white mb-2">My Profile</div>
          <button 
            onClick={() => setIsLoggedIn(false)}
            className="w-full text-left px-3 py-2 text-red-400 hover:bg-slate-800 rounded-md text-sm font-medium"
          >
            🚪 Logout
          </button>
        </div>
      </aside>

      {/* 2. MAIN CONTENT AREA */}
      <main className="flex-1 p-8 overflow-y-auto">
        {activeTab === 'dashboard' && (
          <div>
            <h1 className="text-2xl font-bold text-slate-800 mb-6">Inventory Dashboard</h1>

            {/* Dashboard KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                <p className="text-sm font-medium text-slate-500">Total Products</p>
                <p className="text-3xl font-bold text-slate-800 mt-2">1,245</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                <p className="text-sm font-medium text-slate-500">Low / Out of Stock</p>
                <p className="text-3xl font-bold text-red-600 mt-2">12</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                <p className="text-sm font-medium text-slate-500">Pending Receipts</p>
                <p className="text-3xl font-bold text-blue-600 mt-2">5</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                <p className="text-sm font-medium text-slate-500">Pending Deliveries</p>
                <p className="text-3xl font-bold text-amber-600 mt-2">8</p>
              </div>
            </div>

            {/* Dynamic Filters Section */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 mb-6">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">Dynamic Filters</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <select className="border border-slate-300 rounded-md px-3 py-2 text-sm">
                  <option>Document Type: All</option>
                  <option>Receipts</option>
                  <option>Delivery</option>
                  <option>Internal</option>
                  <option>Adjustments</option>
                </select>
                <select className="border border-slate-300 rounded-md px-3 py-2 text-sm">
                  <option>Status: All</option>
                  <option>Draft</option>
                  <option>Waiting</option>
                  <option>Ready</option>
                  <option>Done</option>
                  <option>Canceled</option>
                </select>
                <select className="border border-slate-300 rounded-md px-3 py-2 text-sm">
                  <option>Warehouse: All</option>
                  <option>Main Warehouse</option>
                  <option>Warehouse 2</option>
                </select>
                <select className="border border-slate-300 rounded-md px-3 py-2 text-sm">
                  <option>Category: All</option>
                  <option>Raw Materials</option>
                  <option>Finished Goods</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'products' && (
          <div>
            <h1 className="text-2xl font-bold text-slate-800 mb-4">Product Management</h1>
            <p className="text-slate-600">Create/update products, view stock availability per location, categories, and reordering rules[cite: 1].</p>
          </div>
        )}

        {activeTab === 'operations' && (
          <div>
            <h1 className="text-2xl font-bold text-slate-800 mb-4">Operations Center</h1>
            <p className="text-slate-600">Manage Receipts, Delivery Orders, Inventory Adjustments, and Move History[cite: 1].</p>
          </div>
        )}

        {activeTab === 'settings' && (
          <div>
            <h1 className="text-2xl font-bold text-slate-800 mb-4">Settings & Warehouse</h1>
            <p className="text-slate-600">Configure multi-warehouse setups and location settings[cite: 1].</p>
          </div>
        )}
      </main>
    </div>
  );
}