
import React, { useState } from 'react';
import { useStore } from './context/StoreContext';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Landing } from './pages/Landing'; // Import Landing
import { POS } from './pages/POS';
import { Dashboard } from './pages/Dashboard';
import { Inventory } from './pages/Inventory';
import { Debtors } from './pages/Debtors';
import { Settings } from './pages/Settings';
import { GiftCards } from './pages/GiftCards';
import { Transactions } from './pages/Transactions';
import { AIChat } from './components/AIChat';

const AppContent: React.FC = () => {
  const { currentUser } = useStore();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showLogin, setShowLogin] = useState(false); // New state to control Landing vs Login

  // If NOT logged in:
  if (!currentUser) {
    // If user explicitly clicked "Login" or "Get Started" on Landing page, show Login component
    if (showLogin) {
        return (
            <>
                {/* We pass a prop/callback to Login (or modify Login to include a 'Back' button) if needed, 
                    but for now, let's keep it simple. If they are here, they want to log in. */}
                <Login />
                {/* Optional: Add a button in Login to go back to Landing if needed, 
                    but standard flow usually keeps them in Auth flow once entered. */}
            </>
        );
    }
    // Otherwise, show Landing Page
    return <Landing onGetStarted={() => setShowLogin(true)} onLogin={() => setShowLogin(true)} />;
  }

  // If Logged In:
  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard />;
      case 'pos': return <POS />;
      case 'transactions': return <Transactions />;
      case 'stock': return <Inventory />;
      case 'debtors': return <Debtors />;
      case 'giftCards': return <GiftCards />;
      case 'settings': return <Settings />;
      default: return <Dashboard />;
    }
  };

  return (
    <Layout activeTab={activeTab} onTabChange={setActiveTab}>
      <div className="w-full h-full">
        {renderContent()}
      </div>
      <AIChat />
    </Layout>
  );
};

export default AppContent;
