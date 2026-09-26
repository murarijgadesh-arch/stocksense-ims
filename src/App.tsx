import React, { useState } from 'react';
import { Sidebar } from './components/ims/Sidebar';
import { Dashboard } from './components/ims/Dashboard';
import { Products } from './components/ims/Products';
import { Operations } from './components/ims/Operations';
import { SettingsView } from './components/ims/SettingsView';
import { AuthView } from './components/ims/AuthView';
import { User } from './types';

export const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>({
    id: 1,
    name: 'Demo Admin',
    email: 'admin@stocksense.io',
    createdAt: new Date().toISOString(),
  });
  const [currentView, setCurrentView] = useState<string>('dashboard');

  if (!currentUser) {
    return <AuthView onLoginSuccess={(user) => setCurrentUser(user)} />;
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-950 font-sans antialiased text-slate-100">
      <Sidebar 
        currentView={currentView} 
        onNavigate={setCurrentView} 
        user={currentUser}
        onLogout={() => setCurrentUser(null)}
      />

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {currentView === 'dashboard' && <Dashboard />}
        {currentView === 'products' && <Products />}
        {currentView === 'operations' && <Operations />}
        {currentView === 'settings' && <SettingsView />}
      </main>
    </div>
  );
};

export default App;
