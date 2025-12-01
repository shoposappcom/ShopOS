
import React from 'react';
import { useStore } from '../context/StoreContext';
import { NAV_ITEMS } from '../constants';
import { LogOut, Globe, Menu, UserCircle, ChevronDown, Wifi, WifiOff, RefreshCw, Clock, CheckCircle2, AlertCircle, TestTube } from 'lucide-react';
import { Language } from '../types';
import { getDaysRemaining } from '../services/subscription';
import { isTestAccount } from '../services/testData';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, activeTab, onTabChange }) => {
  const { currentUser, logout, t, language, setLanguage, hasPermission, isOnline, isSyncing, pendingSyncCount, settings, getSubscription, checkSubscription } = useStore();

  const handleLangChange = () => {
    const langs: Language[] = ['en', 'ha', 'yo', 'ig', 'ar', 'fr'];
    const idx = langs.indexOf(language);
    const next = langs[(idx + 1) % langs.length];
    setLanguage(next);
  };

  if (!currentUser) return <>{children}</>;

  const getVisibleNavItems = () => {
    return NAV_ITEMS.filter(item => {
      switch (item.id) {
        case 'dashboard':
          return true;
        case 'pos':
          return hasPermission('process_sales');
        case 'transactions':
          // Visible to anyone who can process sales (Cashiers) or view reports (Admins)
          return hasPermission('process_sales') || hasPermission('view_reports');
        case 'stock':
          return hasPermission('manage_stock');
        case 'debtors':
          return hasPermission('manage_debtors') || hasPermission('approve_credit');
        case 'giftCards':
          return hasPermission('manage_gift_cards');
        case 'settings':
          return true;
        default:
          return true;
      }
    });
  };

  const visibleNavItems = getVisibleNavItems();

  const isTest = settings?.shopId ? isTestAccount(settings.shopId) : false;

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Test Account Banner */}
      {isTest && (
        <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-2 flex items-center justify-center gap-2 text-xs font-medium text-yellow-800">
          <TestTube className="w-4 h-4" />
          <span>TEST ACCOUNT - Demo purposes only. All data is sample data.</span>
        </div>
      )}
      
      {/* Top Bar - Glassmorphism */}
      <header className="bg-white/90 backdrop-blur-md shadow-sm border-b border-gray-100 px-4 py-3 flex justify-between items-center sticky top-0 z-30 h-16 shrink-0">
        <div className="flex items-center gap-2">
          <img 
            src="https://i.ibb.co/3YcgDWcT/Adobe-Express-file.png" 
            alt="ShopOS Logo" 
            className="h-20 w-auto object-contain"
          />
          <div>
            <h1 className="font-bold text-gray-800 text-lg leading-tight hidden sm:block">{settings.businessName || 'ShopOS'}</h1>
            <span className="text-[10px] text-green-600 font-bold tracking-wider uppercase sm:hidden">ShopOS</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Subscription Status Indicator */}
          {(() => {
            const subscription = getSubscription();
            if (subscription) {
              const daysLeft = getDaysRemaining(subscription);
              const isActive = checkSubscription();
              const status = subscription.status;
              
              if (status === 'trial' || status === 'active') {
                return (
                  <div className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border ${
                    daysLeft <= 3 
                      ? 'bg-orange-50 text-orange-700 border-orange-200' 
                      : 'bg-green-50 text-green-700 border-green-200'
                  }`}>
                    {daysLeft <= 3 ? (
                      <Clock className="w-3.5 h-3.5" />
                    ) : (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    )}
                    <span>{daysLeft} {daysLeft === 1 ? 'day' : 'days'} left</span>
                  </div>
                );
              }
            }
            return null;
          })()}
          
          <button 
            onClick={handleLangChange}
            className="flex items-center gap-2 text-xs font-medium bg-gray-50 hover:bg-gray-100 px-3 py-1.5 rounded-full transition-colors border border-gray-100"
          >
            <Globe className="w-3.5 h-3.5 text-gray-600" />
            <span className="uppercase text-gray-700">{language}</span>
          </button>
          
          <div className="hidden sm:flex items-center gap-3 pl-4 border-l border-gray-100">
            <div className="text-right">
              <p className="text-sm font-semibold text-gray-800">{currentUser.fullName.split(' ')[0]}</p>
              <p className="text-xs text-gray-500 capitalize">{t(currentUser.role)}</p>
            </div>
            <div className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 border border-gray-100">
               {currentUser.profilePhoto ? (
                 <img src={currentUser.profilePhoto} className="w-full h-full rounded-full object-cover" />
               ) : (
                 <UserCircle className="w-6 h-6" />
               )}
            </div>
          </div>

          <button onClick={logout} className="sm:ml-2 text-gray-400 hover:text-red-500 p-2 rounded-full hover:bg-red-50 transition-all">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 pb-40 sm:pb-6 sm:pl-72 sm:pr-8 bg-white h-full">
        <div className="max-w-7xl mx-auto w-full h-full">
           {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation - Floating Style */}
      <nav className="fixed bottom-0 w-full z-40 sm:hidden pb-safe">
        <div className="bg-white border-t border-gray-100 shadow-[0_-4px_10px_-1px_rgba(0,0,0,0.03)] pb-1">
          <div className="flex justify-around items-center h-16">
            {visibleNavItems.slice(0, 5).map(item => { // Limit to 5 on mobile
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={`relative flex flex-col items-center justify-center w-full h-full transition-all duration-200 ${
                    isActive ? 'text-green-600' : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  {isActive && (
                    <span className="absolute -top-[1px] w-12 h-1 bg-green-600 rounded-b-full shadow-sm" />
                  )}
                  <item.icon className={`w-6 h-6 mb-1 ${isActive ? 'stroke-[2.5px]' : 'stroke-2'}`} />
                  <span className="text-[10px] font-medium tracking-wide">{t(item.labelKey)}</span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>
      
      {/* Desktop Sidebar - Modern & Clean */}
      <div className="hidden sm:flex flex-col fixed left-0 top-16 bottom-0 w-64 bg-white border-r border-gray-100 z-20 rtl:right-0 rtl:left-auto rtl:border-l rtl:border-r-0">
         <div className="flex-1 py-6 px-3 space-y-1">
            {visibleNavItems.map(item => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={`flex items-center gap-3 w-full px-4 py-3 text-left rounded-xl transition-all duration-200 group ${
                    isActive 
                      ? 'bg-green-50 text-green-700 font-semibold shadow-sm border border-green-100' 
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 border border-transparent'
                  }`}
                >
                  <item.icon className={`w-5 h-5 ${isActive ? 'text-green-600' : 'text-gray-400 group-hover:text-gray-600'}`} />
                  <span className="">{t(item.labelKey)}</span>
                  {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-green-600" />}
                </button>
              );
            })}
         </div>
         
         <div className="p-4 m-4 bg-gray-50 rounded-xl border border-gray-100">
           <div className="flex items-center gap-3 mb-2">
              <div className={`w-2 h-2 rounded-full ${
                isSyncing 
                  ? 'bg-blue-500 animate-pulse' 
                  : isOnline 
                    ? 'bg-green-500 animate-pulse' 
                    : 'bg-orange-400'
              }`}></div>
              <span className="text-xs font-semibold text-gray-500">{t('systemStatus')}</span>
           </div>
           
           <div className="flex items-center gap-2 text-xs text-gray-400 mt-2">
              {isSyncing ? (
                 <>
                   <RefreshCw className="w-3 h-3 animate-spin text-blue-500" />
                   <span className="text-blue-500 font-medium">{t('syncing')}</span>
                 </>
              ) : isOnline ? (
                 <>
                   <Wifi className="w-3 h-3 text-green-500" />
                   <span className="text-green-600">{t('online')}</span>
                 </>
              ) : (
                 <>
                   <WifiOff className="w-3 h-3 text-orange-500" />
                   <span className="text-orange-500">{t('offline')}</span>
                 </>
              )}
           </div>
           
           {/* Pending Sync Count */}
           {pendingSyncCount > 0 && !isSyncing && (
             <div className="flex items-center gap-2 text-xs mt-2 pl-5">
               <AlertCircle className="w-3 h-3 text-amber-500" />
               <span className="text-amber-600">
                 {pendingSyncCount} {pendingSyncCount === 1 ? 'change' : 'changes'} pending
               </span>
             </div>
           )}
           
           <p className="text-[10px] text-gray-400 mt-2 pl-5">v1.2.1</p>
         </div>
      </div>
    </div>
  );
};
