
import React, { useState, useEffect } from 'react';
import { useStore } from './context/StoreContext';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Landing } from './pages/Landing';
import { Payment } from './pages/Payment';
import { POS } from './pages/POS';
import { Dashboard } from './pages/Dashboard';
import { Inventory } from './pages/Inventory';
import { Debtors } from './pages/Debtors';
import { Settings } from './pages/Settings';
import { GiftCards } from './pages/GiftCards';
import { Transactions } from './pages/Transactions';
import { Admin } from './pages/Admin';
import { AdminLogin } from './pages/AdminLogin';
import { AdminSetup } from './pages/AdminSetup';
import { AIChat } from './components/AIChat';
import { isAdminAuthenticated } from './services/adminAuth';
import { hasAdminCredentials } from './services/adminStorage';

const AppContent: React.FC = () => {
  const { currentUser, isAccountLocked, checkSubscription, getSubscription } = useStore();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showLogin, setShowLogin] = useState(false);
  const [adminView, setAdminView] = useState<'setup' | 'login' | 'dashboard' | null>(null);
  const [adminViewInitialized, setAdminViewInitialized] = useState(false);
  
  // Initialize admin view on mount
  useEffect(() => {
    const initializeAdminView = async () => {
      const path = window.location.pathname;
      console.log('🔍 Initializing admin view for path:', path);
      
      if (path === '/traceroot/admin' || path.startsWith('/traceroot/admin/')) {
        // Check if admin credentials exist
        const hasCredentials = await hasAdminCredentials();
        console.log('🔍 Admin credentials check result:', hasCredentials);
        
        if (!hasCredentials) {
          console.log('📝 No admin credentials found - showing setup page');
          setAdminView('setup');
        } else if (isAdminAuthenticated()) {
          console.log('✅ Admin authenticated - showing dashboard');
          setAdminView('dashboard');
        } else {
          console.log('🔐 Admin credentials exist but not authenticated - showing login');
          setAdminView('login');
        }
      } else {
        setAdminView(null);
      }
      setAdminViewInitialized(true);
    };
    
    initializeAdminView();
  }, []);
  
  // Listen for URL changes
  useEffect(() => {
    const handleLocationChange = async () => {
      const path = window.location.pathname;
      if (path === '/traceroot/admin' || path.startsWith('/traceroot/admin/')) {
        const hasCredentials = await hasAdminCredentials();
        if (!hasCredentials) {
          setAdminView('setup');
        } else if (isAdminAuthenticated()) {
          setAdminView('dashboard');
        } else {
          setAdminView('login');
        }
      } else {
        setAdminView(null);
      }
    };
    
    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, []);

  // Check subscription status on mount and when user changes
  useEffect(() => {
    if (currentUser) {
      const subscription = getSubscription();
      if (subscription) {
        checkSubscription();
      }
    }
  }, [currentUser]);

  // Periodic subscription check (every 2 minutes) to ensure UI locks when expired
  useEffect(() => {
    if (!currentUser) return;
    
    const subscriptionCheckInterval = setInterval(() => {
      checkSubscription();
    }, 2 * 60 * 1000); // Check every 2 minutes
    
    return () => clearInterval(subscriptionCheckInterval);
  }, [currentUser, checkSubscription]);
  
  // Don't render until admin view is initialized (must be after all hooks)
  if (!adminViewInitialized && (window.location.pathname === '/traceroot/admin' || window.location.pathname.startsWith('/traceroot/admin/'))) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Handle admin routes
  if (adminView === 'setup') {
    return <AdminSetup onSuccess={() => {
      setAdminView('login');
      window.history.pushState({}, '', '/traceroot/admin');
    }} />;
  }
  
  if (adminView === 'login') {
    return <AdminLogin onSuccess={() => {
      setAdminView('dashboard');
      window.history.pushState({}, '', '/traceroot/admin');
    }} />;
  }
  
  if (adminView === 'dashboard') {
    return <Admin onLogout={() => {
      setAdminView('login');
      window.history.pushState({}, '', '/traceroot/admin');
    }} />;
  }

  // If NOT logged in:
  if (!currentUser) {
    if (showLogin) {
      return <Login />;
    }
    return <Landing onGetStarted={() => setShowLogin(true)} onLogin={() => setShowLogin(true)} />;
  }

  // If account is locked (subscription expired), show only Payment page
  const accountLocked = isAccountLocked();
  if (accountLocked) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Payment />
      </div>
    );
  }

  // If Logged In and subscription is active:
  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard />;
      case 'pos': return <POS />;
      case 'transactions': return <Transactions />;
      case 'stock': return <Inventory />;
      case 'debtors': return <Debtors />;
      case 'giftCards': return <GiftCards />;
      case 'settings': return <Settings />;
      case 'payment': return <Payment />;
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
