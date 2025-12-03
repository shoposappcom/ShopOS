
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
import { About } from './pages/About';
import { Contact } from './pages/Contact';
import { PrivacyPolicy } from './pages/PrivacyPolicy';
import { AIChat } from './components/AIChat';
import { isAdminAuthenticated } from './services/adminAuth';
import { hasAdminCredentials } from './services/adminStorage';

const AppContent: React.FC = () => {
  const { currentUser, isAccountLocked, checkSubscription, getSubscription, settings } = useStore();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showLogin, setShowLogin] = useState(false);
  const [currentRoute, setCurrentRoute] = useState<string>('');
  const [adminView, setAdminView] = useState<'setup' | 'login' | 'dashboard' | null>(null);
  const [adminViewInitialized, setAdminViewInitialized] = useState(false);
  
  // Initialize routing based on URL
  useEffect(() => {
    const initializeRouting = async () => {
      const path = window.location.pathname;
      console.log('🔍 Initializing routing for path:', path);
      setCurrentRoute(path);
      
      // Handle admin routes
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
      
      // Handle public routes
      if (path === '/login') {
        setShowLogin(true);
      } else if (path === '/about' || path === '/contact' || path === '/privacy') {
        // Public pages - keep current route state
      } else if (!path.startsWith('/traceroot/admin')) {
        setShowLogin(false);
      }
      
      setAdminViewInitialized(true);
    };
    
    initializeRouting();
  }, []);
  
  // Listen for URL changes
  useEffect(() => {
    const handleLocationChange = async () => {
      const path = window.location.pathname;
      setCurrentRoute(path);
      
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
      
      // Handle public routes
      if (path === '/login') {
        setShowLogin(true);
      } else if (path === '/about' || path === '/contact' || path === '/privacy') {
        setShowLogin(false);
      } else if (!path.startsWith('/traceroot/admin')) {
        setShowLogin(false);
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
      // Remove /login from URL if user is logged in
      if (currentRoute === '/login') {
        window.history.pushState({}, '', '/');
        setCurrentRoute('/');
        setShowLogin(false);
      }
    }
  }, [currentUser, currentRoute]);

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

  // Handle public pages (accessible without login)
  if (currentRoute === '/about') {
    return <About />;
  }
  
  if (currentRoute === '/contact') {
    return <Contact />;
  }
  
  if (currentRoute === '/privacy') {
    return <PrivacyPolicy />;
  }

  // If NOT logged in:
  if (!currentUser) {
    if (showLogin || currentRoute === '/login') {
      return <Login />;
    }
    return <Landing 
      onGetStarted={() => {
        setShowLogin(true);
        window.history.pushState({}, '', '/login');
      }} 
      onLogin={() => {
        setShowLogin(true);
        window.history.pushState({}, '', '/login');
      }} 
    />;
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
  const showAIChatByDefault = settings?.showAIChatByDefault !== false; // Default to true if not set

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

  // Determine if AI Chat should be shown
  // Always show in settings page, otherwise:
  // - Hide on POS page (scanner page) regardless of setting
  // - Respect showAIChatByDefault setting on other pages
  const shouldShowAIChat = activeTab === 'settings' || (showAIChatByDefault && activeTab !== 'pos');

  return (
    <Layout activeTab={activeTab} onTabChange={setActiveTab}>
      <div className="w-full h-full">
        {renderContent()}
      </div>
      {shouldShowAIChat && <AIChat />}
    </Layout>
  );
};

export default AppContent;
