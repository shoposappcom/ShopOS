import React, { useState, useEffect } from 'react';
import { isAdminAuthenticated, logoutAdmin } from '../services/adminAuth';
import { 
  getAllShops, 
  getAllPayments, 
  getAdminConfig, 
  updateAdminConfig,
  loadAdminData
} from '../services/adminStorage';
import * as db from '../services/supabase/database';
import { getTrialConfig, updateTrialConfig, setTrialDays, disableTrial, enableTrial } from '../services/trialConfig';
import { getTotalRevenue } from '../services/paymentTracking';
import { getGeminiApiKeySync, updateGeminiApiKey, getPaystackPublicKey, getPaystackSecretKey, getPaystackMode, updatePaystackKeys } from '../services/adminStorage';
import { 
  getAllCouponsList, 
  createCoupon, 
  updateCoupon, 
  deleteCoupon, 
  getCouponUsageStats,
  generateCouponCode,
  getCouponByCode
} from '../services/couponService';
import { 
  getAllAIUsageRecords, 
  getAIUsageByShop, 
  toggleShopAI, 
  isShopAIEnabled,
  markAbuse
} from '../services/adminStorage';
import { ShopSummary, PaymentRecord, AdminConfig, Coupon, AIUsageRecord } from '../types';
import { 
  LayoutDashboard, 
  Store, 
  CreditCard, 
  BarChart3, 
  Settings, 
  LogOut, 
  Search, 
  Filter,
  TrendingUp,
  Users,
  DollarSign,
  Calendar,
  Globe,
  MapPin,
  Download,
  Eye,
  RefreshCw,
  Menu,
  X,
  Save,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Ticket,
  Plus,
  Edit,
  Trash2,
  Tag,
  Clock,
  AlertCircle,
  Bot,
  Ban
} from 'lucide-react';

interface AdminProps {
  onLogout: () => void;
}

type Tab = 'overview' | 'shops' | 'payments' | 'statistics' | 'coupons' | 'ai' | 'settings' | 'reset';

export const Admin: React.FC<AdminProps> = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [shops, setShops] = useState<ShopSummary[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [config, setConfig] = useState<AdminConfig>(getTrialConfig());
  const [shopSearch, setShopSearch] = useState('');
  const [paymentSearch, setPaymentSearch] = useState('');
  const [shopFilter, setShopFilter] = useState<'all' | 'active' | 'expired'>('all');
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'completed' | 'pending' | 'failed'>('all');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [settingsChanged, setSettingsChanged] = useState(false);
  const [tempConfig, setTempConfig] = useState<AdminConfig>(getTrialConfig());
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [apiKeyChanged, setApiKeyChanged] = useState(false);
  const [apiKeySaveSuccess, setApiKeySaveSuccess] = useState(false);
  
  // Paystack keys state
  const [paystackTestPublicKey, setPaystackTestPublicKey] = useState('');
  const [paystackTestSecretKey, setPaystackTestSecretKey] = useState('');
  const [paystackLivePublicKey, setPaystackLivePublicKey] = useState('');
  const [paystackLiveSecretKey, setPaystackLiveSecretKey] = useState('');
  const [paystackMode, setPaystackMode] = useState<'test' | 'live'>('test');
  const [paystackKeysChanged, setPaystackKeysChanged] = useState(false);
  const [paystackSaveSuccess, setPaystackSaveSuccess] = useState(false);
  
  // Pagination states
  const [shopsPage, setShopsPage] = useState(1);
  const [paymentsPage, setPaymentsPage] = useState(1);
  const [statsCountriesPage, setStatsCountriesPage] = useState(1);
  const [statsStatesPage, setStatsStatesPage] = useState(1);
  
  // Statistics filters
  const [statsCountryFilter, setStatsCountryFilter] = useState<string>('all');
  const [statsStateFilter, setStatsStateFilter] = useState<string>('all');
  
  // Coupons state
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [couponSearch, setCouponSearch] = useState('');
  const [couponFilter, setCouponFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [couponsPage, setCouponsPage] = useState(1);
  const [showCreateCoupon, setShowCreateCoupon] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [couponForm, setCouponForm] = useState({
    code: '',
    discountType: 'percentage' as 'percentage' | 'fixed',
    discountValue: 10,
    applicablePlans: [] as ('monthly' | 'yearly')[],
    expirationDate: '',
    maxUses: '',
    description: '',
    isActive: true
  });
  const [couponError, setCouponError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState('');
  
  // AI Management state
  const [aiUsageRecords, setAiUsageRecords] = useState<AIUsageRecord[]>([]);
  const [aiUsageSearch, setAiUsageSearch] = useState('');
  const [aiUsageShopFilter, setAiUsageShopFilter] = useState<string>('all');
  const [aiUsagePage, setAiUsagePage] = useState(1);
  const [viewingUsageDetails, setViewingUsageDetails] = useState<AIUsageRecord | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  
  // Reset Shop Data state
  const [selectedShopId, setSelectedShopId] = useState<string>('');
  const [resetOptions, setResetOptions] = useState({
    sales: false,
    customers: false,
    debtTransactions: false,
    expenses: false,
    giftCards: false,
    activityLogs: false,
    stockMovements: false
  });
  const [resetting, setResetting] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [resetError, setResetError] = useState('');
  
  const ITEMS_PER_PAGE = 10;

  // Helper function to calculate days remaining for a shop
  const getShopDaysRemaining = (shop: ShopSummary): number => {
    const now = new Date();
    
    // If shop has a paid subscription end date, use that
    if (shop.subscriptionEndDate) {
      const endDate = new Date(shop.subscriptionEndDate);
      const diff = endDate.getTime() - now.getTime();
      return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
    }
    
    // If shop is on trial, use trial end date
    if (shop.subscriptionStatus === 'trial' && shop.trialEndDate) {
      const trialEnd = new Date(shop.trialEndDate);
      const diff = trialEnd.getTime() - now.getTime();
      return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
    }
    
    return 0;
  };

  useEffect(() => {
    if (!isAdminAuthenticated()) {
      onLogout();
      return;
    }
    const initializeData = async () => {
      setLoadingData(true);
      await loadData();
      setLoadingData(false);
    };
    initializeData();
  }, []);

  // Initialize tempConfig when config changes (but don't reset if user is editing)
  useEffect(() => {
    if (!settingsChanged) {
      setTempConfig(config);
    }
  }, [config]);

  // Reset page numbers when filters change
  useEffect(() => {
    setShopsPage(1);
  }, [shopSearch, shopFilter]);

  useEffect(() => {
    setPaymentsPage(1);
  }, [paymentSearch, paymentFilter]);

  useEffect(() => {
    setStatsCountriesPage(1);
    setStatsStatesPage(1);
  }, [statsCountryFilter, statsStateFilter]);

  useEffect(() => {
    setCouponsPage(1);
  }, [couponSearch, couponFilter]);

  useEffect(() => {
    setAiUsagePage(1);
  }, [aiUsageSearch, aiUsageShopFilter]);

  const loadData = async () => {
    try {
      // Load from Supabase (async)
      const adminData = await loadAdminData();
      
      // Update state with Supabase data
      setShops(adminData.shops);
      setPayments(adminData.payments);
      setCoupons(adminData.coupons);
      setAiUsageRecords(adminData.aiUsageRecords);
      
      // Update config
      const newConfig = adminData.adminConfig;
      setConfig(newConfig);
      setTempConfig(newConfig);
      setSettingsChanged(false);
      
      // Load Gemini API key
      const currentKey = newConfig.geminiApiKey;
      setGeminiApiKey(currentKey || '');
      setApiKeyChanged(false);
      
      // Load Paystack keys
      setPaystackTestPublicKey(newConfig.paystackTestPublicKey || '');
      setPaystackTestSecretKey(newConfig.paystackTestSecretKey || '');
      setPaystackLivePublicKey(newConfig.paystackLivePublicKey || '');
      setPaystackLiveSecretKey(newConfig.paystackLiveSecretKey || '');
      setPaystackMode(newConfig.paystackMode || 'test');
      setPaystackKeysChanged(false);
      
      console.log('✅ Admin data loaded:', {
        shops: adminData.shops.length,
        payments: adminData.payments.length,
        coupons: adminData.coupons.length,
        aiUsage: adminData.aiUsageRecords.length
      });
    } catch (error) {
      console.error('❌ Failed to load admin data:', error);
      // Fallback to local storage
      setShops(getAllShops());
      setPayments(getAllPayments());
      setCoupons(getAllCouponsList());
      setAiUsageRecords(getAllAIUsageRecords());
      const newConfig = getTrialConfig();
      setConfig(newConfig);
      setTempConfig(newConfig);
    }
  };

  const handleLogout = () => {
    logoutAdmin();
    onLogout();
  };

  // Filter shops
  const filteredShops = shops.filter(shop => {
    const matchesSearch = shop.shopName.toLowerCase().includes(shopSearch.toLowerCase()) ||
                         shop.ownerEmail.toLowerCase().includes(shopSearch.toLowerCase());
    const matchesFilter = shopFilter === 'all' ||
                         (shopFilter === 'active' && shop.isActive) ||
                         (shopFilter === 'expired' && !shop.isActive);
    return matchesSearch && matchesFilter;
  });

  // Paginate shops
  const shopsTotalPages = Math.ceil(filteredShops.length / ITEMS_PER_PAGE);
  const paginatedShops = filteredShops.slice(
    (shopsPage - 1) * ITEMS_PER_PAGE,
    shopsPage * ITEMS_PER_PAGE
  );

  // Filter payments
  const filteredPayments = payments.filter(payment => {
    const matchesSearch = payment.shopName.toLowerCase().includes(paymentSearch.toLowerCase()) ||
                         payment.paymentReference.toLowerCase().includes(paymentSearch.toLowerCase());
    const matchesFilter = paymentFilter === 'all' || payment.status === paymentFilter;
    return matchesSearch && matchesFilter;
  });

  // Paginate payments
  const paymentsTotalPages = Math.ceil(filteredPayments.length / ITEMS_PER_PAGE);
  const paginatedPayments = filteredPayments.slice(
    (paymentsPage - 1) * ITEMS_PER_PAGE,
    paymentsPage * ITEMS_PER_PAGE
  );

  // Filter coupons
  const filteredCoupons = coupons.filter(coupon => {
    const matchesSearch = coupon.code.toUpperCase().includes(couponSearch.toUpperCase()) ||
                         (coupon.description || '').toLowerCase().includes(couponSearch.toLowerCase());
    const matchesFilter = couponFilter === 'all' ||
                         (couponFilter === 'active' && coupon.isActive) ||
                         (couponFilter === 'inactive' && !coupon.isActive);
    return matchesSearch && matchesFilter;
  });

  // Paginate coupons
  const couponsTotalPages = Math.ceil(filteredCoupons.length / ITEMS_PER_PAGE);
  const paginatedCoupons = filteredCoupons.slice(
    (couponsPage - 1) * ITEMS_PER_PAGE,
    couponsPage * ITEMS_PER_PAGE
  );

  // Filter AI usage records
  const filteredAIUsage = aiUsageRecords.filter(record => {
    const matchesSearch = record.shopName.toLowerCase().includes(aiUsageSearch.toLowerCase()) ||
                         record.userName.toLowerCase().includes(aiUsageSearch.toLowerCase()) ||
                         record.prompt.toLowerCase().includes(aiUsageSearch.toLowerCase());
    const matchesShop = aiUsageShopFilter === 'all' || record.shopId === aiUsageShopFilter;
    return matchesSearch && matchesShop;
  });

  // Paginate AI usage
  const aiUsageTotalPages = Math.ceil(filteredAIUsage.length / ITEMS_PER_PAGE);
  const paginatedAIUsage = filteredAIUsage.slice(
    (aiUsagePage - 1) * ITEMS_PER_PAGE,
    aiUsagePage * ITEMS_PER_PAGE
  );

  // Get unique shops for filter
  const uniqueShopsForAI = Array.from(new Set(aiUsageRecords.map(r => r.shopId)))
    .map(shopId => {
      const shop = shops.find(s => s.shopId === shopId);
      return shop ? { shopId, shopName: shop.shopName } : null;
    })
    .filter(Boolean) as { shopId: string; shopName: string }[];

  // AI usage statistics
  const totalAIRequests = aiUsageRecords.length;
  const aiUsageByShop = shops.map(shop => {
    const usageCount = getAIUsageByShop(shop.shopId).length;
    return { shop, usageCount };
  }).sort((a, b) => b.usageCount - a.usageCount);

  // Statistics
  const totalShops = shops.length;
  const activeSubscriptions = shops.filter(s => s.isActive).length;
  const totalRevenue = getTotalRevenue(payments);
  const monthlyRevenue = getTotalRevenue(payments, {
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()
  });
  const yearlyRevenue = getTotalRevenue(payments, {
    startDate: new Date(new Date().getFullYear(), 0, 1).toISOString()
  });

  // Countries and states with filters
  const filteredShopsForStats = shops.filter(shop => {
    const matchesCountry = statsCountryFilter === 'all' || shop.country === statsCountryFilter;
    const matchesState = statsStateFilter === 'all' || shop.state === statsStateFilter;
    return matchesCountry && matchesState;
  });

  const countries = filteredShopsForStats.reduce((acc, shop) => {
    acc[shop.country] = (acc[shop.country] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const states = filteredShopsForStats.reduce((acc, shop) => {
    acc[shop.state] = (acc[shop.state] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const countriesList = Object.entries(countries).sort(([, a], [, b]) => (b as number) - (a as number));
  const statesList = Object.entries(states).sort(([, a], [, b]) => (b as number) - (a as number));
  
  const countriesTotalPages = Math.ceil(countriesList.length / ITEMS_PER_PAGE);
  const statesTotalPages = Math.ceil(statesList.length / ITEMS_PER_PAGE);
  
  const paginatedCountries = countriesList.slice(
    (statsCountriesPage - 1) * ITEMS_PER_PAGE,
    statsCountriesPage * ITEMS_PER_PAGE
  );
  
  const paginatedStates = statesList.slice(
    (statsStatesPage - 1) * ITEMS_PER_PAGE,
    statsStatesPage * ITEMS_PER_PAGE
  );
  
  const uniqueCountries = Array.from(new Set(shops.map(s => s.country))).sort();
  const uniqueStates = Array.from(new Set(shops.map(s => s.state))).sort();

  if (!isAdminAuthenticated()) {
    return null;
  }

  const handleSettingsChange = (updates: Partial<AdminConfig>) => {
    setTempConfig(prev => ({ ...prev, ...updates }));
    setSettingsChanged(true);
    setSaveSuccess(false);
  };

  // Coupon handlers
  const handleCreateCoupon = () => {
    setShowCreateCoupon(true);
    setEditingCoupon(null);
    setCouponForm({
      code: generateCouponCode(),
      discountType: 'percentage',
      discountValue: 10,
      applicablePlans: [],
      expirationDate: '',
      maxUses: '',
      description: '',
      isActive: true
    });
    setCouponError('');
    setCouponSuccess('');
  };

  const handleEditCoupon = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setShowCreateCoupon(true);
    setCouponForm({
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      applicablePlans: [...coupon.applicablePlans],
      expirationDate: coupon.expirationDate || '',
      maxUses: coupon.maxUses?.toString() || '',
      description: coupon.description || '',
      isActive: coupon.isActive
    });
    setCouponError('');
    setCouponSuccess('');
  };

  const handleSaveCoupon = () => {
    try {
      setCouponError('');
      setCouponSuccess('');

      if (!couponForm.code.trim()) {
        setCouponError('Coupon code is required');
        return;
      }

      if (couponForm.applicablePlans.length === 0) {
        setCouponError('At least one plan must be selected');
        return;
      }

      if (editingCoupon) {
        updateCoupon(editingCoupon.id, {
          code: couponForm.code.trim(),
          discountType: couponForm.discountType,
          discountValue: couponForm.discountValue,
          applicablePlans: couponForm.applicablePlans,
          expirationDate: couponForm.expirationDate || undefined,
          maxUses: couponForm.maxUses ? parseInt(couponForm.maxUses) : undefined,
          description: couponForm.description || undefined,
          isActive: couponForm.isActive
        });
        setCouponSuccess('Coupon updated successfully');
      } else {
        createCoupon({
          code: couponForm.code.trim(),
          discountType: couponForm.discountType,
          discountValue: couponForm.discountValue,
          applicablePlans: couponForm.applicablePlans,
          expirationDate: couponForm.expirationDate || undefined,
          maxUses: couponForm.maxUses ? parseInt(couponForm.maxUses) : undefined,
          description: couponForm.description || undefined,
          isActive: couponForm.isActive,
          createdBy: 'admin'
        });
        setCouponSuccess('Coupon created successfully');
      }

      setCoupons(getAllCouponsList());
      setTimeout(() => {
        setShowCreateCoupon(false);
        setCouponSuccess('');
      }, 1500);
    } catch (error: any) {
      setCouponError(error.message || 'Failed to save coupon');
    }
  };

  const handleDeleteCoupon = (couponId: string) => {
    if (window.confirm('Are you sure you want to delete this coupon?')) {
      deleteCoupon(couponId);
      setCoupons(getAllCouponsList());
    }
  };

  const handleToggleCouponPlan = (plan: 'monthly' | 'yearly') => {
    setCouponForm(prev => ({
      ...prev,
      applicablePlans: prev.applicablePlans.includes(plan)
        ? prev.applicablePlans.filter(p => p !== plan)
        : [...prev.applicablePlans, plan]
    }));
  };

  const handleSaveSettings = () => {
    try {
      // Ensure we have valid values
      const daysToSave = Math.min(365, Math.max(0, tempConfig.trialDays || 7));
      const enabledToSave = tempConfig.trialEnabled !== false;
      
      // Save the configuration directly
      updateTrialConfig({
        trialDays: daysToSave,
        trialEnabled: enabledToSave
      });
      
      // Immediately reload from storage (localStorage is synchronous)
      const savedConfig = getTrialConfig();
      
      // Update both config states with saved values immediately
      setConfig(savedConfig);
      setTempConfig(savedConfig);
      setSettingsChanged(false);
      setSaveSuccess(true);
      
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Failed to save settings:', error);
      setSaveSuccess(false);
    }
  };

  const handleSaveApiKey = () => {
    try {
      updateGeminiApiKey(geminiApiKey);
      setApiKeyChanged(false);
      setApiKeySaveSuccess(true);
      setTimeout(() => setApiKeySaveSuccess(false), 3000);
    } catch (error) {
      console.error('Failed to save API key:', error);
    }
  };

  const handleSavePaystackKeys = () => {
    try {
      updatePaystackKeys({
        testPublicKey: paystackTestPublicKey,
        testSecretKey: paystackTestSecretKey,
        livePublicKey: paystackLivePublicKey,
        liveSecretKey: paystackLiveSecretKey,
        mode: paystackMode
      });
      setPaystackKeysChanged(false);
      setPaystackSaveSuccess(true);
      setTimeout(() => setPaystackSaveSuccess(false), 3000);
      // Reload config to ensure state is synced
      const newConfig = getTrialConfig();
      setConfig(newConfig);
      setTempConfig(newConfig);
    } catch (error) {
      console.error('Failed to save Paystack keys:', error);
    }
  };

  // Show loading state while initial data loads
  if (loadingData && shops.length === 0 && payments.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-emerald-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading admin data from Supabase...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4 sticky top-0 z-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <LayoutDashboard className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="hidden sm:block text-sm text-gray-500">ShopOS Management</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleLogout}
              className="hidden sm:flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
            >
              <LogOut className="w-5 h-5" />
              <span>Logout</span>
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="sm:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-xl transition-all"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-col sm:flex-row">
        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="sm:hidden fixed inset-0 bg-black bg-opacity-50 z-40" onClick={() => setMobileMenuOpen(false)}>
            <aside 
              className="w-64 bg-white min-h-screen p-4 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <nav className="space-y-2">
                {[
                  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
                  { id: 'shops', label: 'Shops', icon: Store },
                  { id: 'payments', label: 'Payments', icon: CreditCard },
                  { id: 'statistics', label: 'Statistics', icon: BarChart3 },
                  { id: 'coupons', label: 'Coupons', icon: Ticket },
                  { id: 'ai', label: 'AI Management', icon: Bot },
                  { id: 'reset', label: 'Reset Shop Data', icon: RefreshCw },
                  { id: 'settings', label: 'Settings', icon: Settings }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id as Tab);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                      activeTab === tab.id
                        ? 'bg-emerald-50 text-emerald-700 font-medium'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <tab.icon className="w-5 h-5" />
                    <span>{tab.label}</span>
                  </button>
                ))}
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 transition-all mt-4"
                >
                  <LogOut className="w-5 h-5" />
                  <span>Logout</span>
                </button>
              </nav>
            </aside>
          </div>
        )}

        {/* Sidebar - Desktop */}
        <aside className="hidden sm:block w-64 bg-white border-r border-gray-200 min-h-[calc(100vh-80px)] p-4">
          <nav className="space-y-2">
            {[
              { id: 'overview', label: 'Overview', icon: LayoutDashboard },
              { id: 'shops', label: 'Shops', icon: Store },
              { id: 'payments', label: 'Payments', icon: CreditCard },
              { id: 'statistics', label: 'Statistics', icon: BarChart3 },
              { id: 'coupons', label: 'Coupons', icon: Ticket },
              { id: 'ai', label: 'AI Management', icon: Bot },
              { id: 'reset', label: 'Reset Shop Data', icon: RefreshCw },
              { id: 'settings', label: 'Settings', icon: Settings }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as Tab)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  activeTab === tab.id
                    ? 'bg-emerald-50 text-emerald-700 font-medium'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4 sm:p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Overview</h2>
                <button
                  onClick={async () => {
                    setLoadingData(true);
                    await loadData();
                    setLoadingData(false);
                  }}
                  disabled={loadingData}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <RefreshCw className={`w-4 h-4 ${loadingData ? 'animate-spin' : ''}`} />
                  <span>{loadingData ? 'Loading...' : 'Refresh'}</span>
                </button>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                      <Store className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 mb-1">Total Shops</p>
                  <p className="text-3xl font-bold text-gray-900">{totalShops}</p>
                </div>

                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 mb-1">Active Subscriptions</p>
                  <p className="text-3xl font-bold text-gray-900">{activeSubscriptions}</p>
                </div>

                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                      <DollarSign className="w-6 h-6 text-emerald-600" />
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 mb-1">Total Revenue</p>
                  <p className="text-3xl font-bold text-gray-900">₦{totalRevenue.toLocaleString()}</p>
                </div>

                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                      <CreditCard className="w-6 h-6 text-purple-600" />
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 mb-1">Monthly Revenue</p>
                  <p className="text-3xl font-bold text-gray-900">₦{monthlyRevenue.toLocaleString()}</p>
                </div>
              </div>

              {/* Recent Payments */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Recent Payments</h3>
                <div className="space-y-3">
                  {payments.slice(0, 5).map((payment) => (
                    <div
                      key={payment.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-xl"
                    >
                      <div>
                        <p className="font-semibold text-gray-900">{payment.shopName}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(payment.paymentDate).toLocaleDateString()} • {payment.paymentReference}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900">₦{payment.amount.toLocaleString()}</p>
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            payment.status === 'completed'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-yellow-100 text-yellow-700'
                          }`}
                        >
                          {payment.status}
                        </span>
                      </div>
                    </div>
                  ))}
                  {payments.length === 0 && (
                    <p className="text-gray-500 text-center py-8">No payments yet</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'shops' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">All Shops</h2>
              </div>

              {/* Filters */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-4">
                <div className="flex-1 relative">
                  <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search shops..."
                    value={shopSearch}
                    onChange={(e) => setShopSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>
                <select
                  value={shopFilter}
                  onChange={(e) => setShopFilter(e.target.value as any)}
                  className="px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="expired">Expired</option>
                </select>
              </div>

              {/* Shops Table */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[800px]">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Shop</th>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Owner</th>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plan</th>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {paginatedShops.map((shop) => (
                        <tr key={shop.shopId} className="hover:bg-gray-50">
                          <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                            <div className="font-semibold text-gray-900">{shop.shopName}</div>
                            <div className="text-sm text-gray-500">{shop.ownerEmail}</div>
                          </td>
                          <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">{shop.ownerName}</td>
                          <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{shop.state}</div>
                            <div className="text-xs text-gray-500">{shop.country}</div>
                          </td>
                          <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                            <div className="flex flex-col gap-1">
                              <span
                                className={`px-2 py-1 text-xs font-medium rounded-full w-fit ${
                                  shop.isActive
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-red-100 text-red-700'
                                }`}
                              >
                                {shop.isActive ? 'Active' : 'Expired'}
                              </span>
                              {shop.isActive && (() => {
                                const daysLeft = getShopDaysRemaining(shop);
                                return (
                                  <span className="text-xs text-gray-500 flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {daysLeft} {daysLeft === 1 ? 'day' : 'days'} left
                                  </span>
                                );
                              })()}
                            </div>
                          </td>
                          <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                            {shop.subscriptionPlan || 'N/A'}
                          </td>
                          <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                            ₦{shop.totalRevenue.toLocaleString()}
                          </td>
                          <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm">
                            <button className="text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
                              <Eye className="w-4 h-4" />
                              <span>View</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {filteredShops.length === 0 && (
                  <div className="text-center py-12 text-gray-500">No shops found</div>
                )}
                
                {/* Pagination */}
                {filteredShops.length > 0 && shopsTotalPages > 1 && (
                  <div className="px-4 sm:px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                    <div className="text-sm text-gray-700">
                      Showing {(shopsPage - 1) * ITEMS_PER_PAGE + 1} to {Math.min(shopsPage * ITEMS_PER_PAGE, filteredShops.length)} of {filteredShops.length} shops
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setShopsPage(prev => Math.max(1, prev - 1))}
                        disabled={shopsPage === 1}
                        className="px-3 py-2 border border-gray-300 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-all"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <span className="text-sm text-gray-700 px-3">
                        Page {shopsPage} of {shopsTotalPages}
                      </span>
                      <button
                        onClick={() => setShopsPage(prev => Math.min(shopsTotalPages, prev + 1))}
                        disabled={shopsPage === shopsTotalPages}
                        className="px-3 py-2 border border-gray-300 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-all"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'payments' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">All Payments</h2>
                <button className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all">
                  <Download className="w-4 h-4" />
                  <span>Export CSV</span>
                </button>
              </div>

              {/* Filters */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-4">
                <div className="flex-1 relative">
                  <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search payments..."
                    value={paymentSearch}
                    onChange={(e) => setPaymentSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>
                <select
                  value={paymentFilter}
                  onChange={(e) => setPaymentFilter(e.target.value as any)}
                  className="px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                >
                  <option value="all">All Status</option>
                  <option value="completed">Completed</option>
                  <option value="pending">Pending</option>
                  <option value="failed">Failed</option>
                </select>
              </div>

              {/* Payments Table */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[800px]">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Shop</th>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plan</th>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reference</th>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {paginatedPayments.map((payment) => (
                        <tr key={payment.id} className="hover:bg-gray-50">
                          <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {new Date(payment.paymentDate).toLocaleDateString()}
                          </td>
                          <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                            <div className="font-semibold text-gray-900">{payment.shopName}</div>
                            <div className="text-xs text-gray-500">{payment.email}</div>
                          </td>
                          <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">{payment.plan}</td>
                          <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                            ₦{payment.amount.toLocaleString()}
                          </td>
                          <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-xs text-gray-500 font-mono">{payment.paymentReference}</td>
                          <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-2 py-1 text-xs font-medium rounded-full ${
                                payment.status === 'completed'
                                  ? 'bg-green-100 text-green-700'
                                  : payment.status === 'pending'
                                  ? 'bg-yellow-100 text-yellow-700'
                                  : 'bg-red-100 text-red-700'
                              }`}
                            >
                              {payment.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {filteredPayments.length === 0 && (
                  <div className="text-center py-12 text-gray-500">No payments found</div>
                )}
                
                {/* Pagination */}
                {filteredPayments.length > 0 && paymentsTotalPages > 1 && (
                  <div className="px-4 sm:px-6 py-4 border-t border-gray-200 flex items-center justify-between flex-wrap gap-4">
                    <div className="text-sm text-gray-700">
                      Showing {(paymentsPage - 1) * ITEMS_PER_PAGE + 1} to {Math.min(paymentsPage * ITEMS_PER_PAGE, filteredPayments.length)} of {filteredPayments.length} payments
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setPaymentsPage(prev => Math.max(1, prev - 1))}
                        disabled={paymentsPage === 1}
                        className="px-3 py-2 border border-gray-300 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-all"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <span className="text-sm text-gray-700 px-3">
                        Page {paymentsPage} of {paymentsTotalPages}
                      </span>
                      <button
                        onClick={() => setPaymentsPage(prev => Math.min(paymentsTotalPages, prev + 1))}
                        disabled={paymentsPage === paymentsTotalPages}
                        className="px-3 py-2 border border-gray-300 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-all"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'statistics' && (
            <div className="space-y-6">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Statistics</h2>

              {/* Revenue Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                <div className="bg-white rounded-2xl p-4 sm:p-6 border border-gray-100 shadow-sm">
                  <p className="text-sm text-gray-500 mb-2">Total Revenue</p>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-900">
                    {totalRevenue > 0 ? `₦${totalRevenue.toLocaleString()}` : '₦0'}
                  </p>
                  {totalRevenue === 0 && (
                    <p className="text-xs text-gray-400 mt-1">No payments yet</p>
                  )}
                </div>
                <div className="bg-white rounded-2xl p-4 sm:p-6 border border-gray-100 shadow-sm">
                  <p className="text-sm text-gray-500 mb-2">Monthly Revenue</p>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-900">
                    {monthlyRevenue > 0 ? `₦${monthlyRevenue.toLocaleString()}` : '₦0'}
                  </p>
                  {monthlyRevenue === 0 && (
                    <p className="text-xs text-gray-400 mt-1">No payments this month</p>
                  )}
                </div>
                <div className="bg-white rounded-2xl p-4 sm:p-6 border border-gray-100 shadow-sm sm:col-span-2 lg:col-span-1">
                  <p className="text-sm text-gray-500 mb-2">Yearly Revenue</p>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-900">
                    {yearlyRevenue > 0 ? `₦${yearlyRevenue.toLocaleString()}` : '₦0'}
                  </p>
                  {yearlyRevenue === 0 && (
                    <p className="text-xs text-gray-400 mt-1">No payments this year</p>
                  )}
                </div>
              </div>

              {/* Filters */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-700 mb-2">Filter by Country</label>
                  <select
                    value={statsCountryFilter}
                    onChange={(e) => {
                      setStatsCountryFilter(e.target.value);
                      setStatsCountriesPage(1);
                      setStatsStatesPage(1);
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  >
                    <option value="all">All Countries</option>
                    {uniqueCountries.map(country => (
                      <option key={country} value={country}>{country}</option>
                    ))}
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-700 mb-2">Filter by State</label>
                  <select
                    value={statsStateFilter}
                    onChange={(e) => {
                      setStatsStateFilter(e.target.value);
                      setStatsStatesPage(1);
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  >
                    <option value="all">All States</option>
                    {uniqueStates
                      .filter(state => statsCountryFilter === 'all' || 
                        shops.some(s => s.state === state && s.country === statsCountryFilter))
                      .map(state => (
                        <option key={state} value={state}>{state}</option>
                      ))}
                  </select>
                </div>
                {(statsCountryFilter !== 'all' || statsStateFilter !== 'all') && (
                  <div className="flex items-end">
                    <button
                      onClick={() => {
                        setStatsCountryFilter('all');
                        setStatsStateFilter('all');
                        setStatsCountriesPage(1);
                        setStatsStatesPage(1);
                      }}
                      className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-xl hover:bg-gray-50 transition-all"
                    >
                      Reset Filters
                    </button>
                  </div>
                )}
              </div>

              {/* Countries */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900">Shops by Country</h3>
                  {countriesList.length > 0 && (
                    <span className="text-sm text-gray-500">({countriesList.length} {countriesList.length === 1 ? 'country' : 'countries'})</span>
                  )}
                </div>
                {countriesList.length > 0 ? (
                  <>
                    <div className="space-y-3 mb-4">
                      {paginatedCountries.map(([country, count]) => (
                        <div key={country} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg transition-colors">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <Globe className="w-5 h-5 text-gray-400 flex-shrink-0" />
                            <span className="font-medium text-gray-900 truncate">{country}</span>
                          </div>
                          <span className="font-semibold text-gray-900 ml-2 flex-shrink-0">{count}</span>
                        </div>
                      ))}
                    </div>
                    
                    {/* Pagination */}
                    {countriesTotalPages > 1 && (
                      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                        <div className="text-sm text-gray-700">
                          Showing {(statsCountriesPage - 1) * ITEMS_PER_PAGE + 1} to {Math.min(statsCountriesPage * ITEMS_PER_PAGE, countriesList.length)} of {countriesList.length} countries
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setStatsCountriesPage(prev => Math.max(1, prev - 1))}
                            disabled={statsCountriesPage === 1}
                            className="px-3 py-2 border border-gray-300 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-all"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                          <span className="text-sm text-gray-700 px-3">
                            Page {statsCountriesPage} of {countriesTotalPages}
                          </span>
                          <button
                            onClick={() => setStatsCountriesPage(prev => Math.min(countriesTotalPages, prev + 1))}
                            disabled={statsCountriesPage === countriesTotalPages}
                            className="px-3 py-2 border border-gray-300 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-all"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Globe className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                    <p>No shops found with selected filters</p>
                  </div>
                )}
              </div>

              {/* States */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900">Shops by State</h3>
                  {statesList.length > 0 && (
                    <span className="text-sm text-gray-500">({statesList.length} {statesList.length === 1 ? 'state' : 'states'})</span>
                  )}
                </div>
                {statesList.length > 0 ? (
                  <>
                    <div className="space-y-3 mb-4">
                      {paginatedStates.map(([state, count]) => (
                        <div key={state} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg transition-colors">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <MapPin className="w-5 h-5 text-gray-400 flex-shrink-0" />
                            <span className="font-medium text-gray-900 truncate">{state}</span>
                          </div>
                          <span className="font-semibold text-gray-900 ml-2 flex-shrink-0">{count}</span>
                        </div>
                      ))}
                    </div>
                    
                    {/* Pagination */}
                    {statesTotalPages > 1 && (
                      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                        <div className="text-sm text-gray-700">
                          Showing {(statsStatesPage - 1) * ITEMS_PER_PAGE + 1} to {Math.min(statsStatesPage * ITEMS_PER_PAGE, statesList.length)} of {statesList.length} states
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setStatsStatesPage(prev => Math.max(1, prev - 1))}
                            disabled={statsStatesPage === 1}
                            className="px-3 py-2 border border-gray-300 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-all"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                          <span className="text-sm text-gray-700 px-3">
                            Page {statsStatesPage} of {statesTotalPages}
                          </span>
                          <button
                            onClick={() => setStatsStatesPage(prev => Math.min(statesTotalPages, prev + 1))}
                            disabled={statsStatesPage === statesTotalPages}
                            className="px-3 py-2 border border-gray-300 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-all"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                    <p>No shops found with selected filters</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'coupons' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Coupons</h2>
                <button
                  onClick={handleCreateCoupon}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all"
                >
                  <Plus className="w-5 h-5" />
                  <span>Create Coupon</span>
                </button>
              </div>

              {/* Create/Edit Coupon Form */}
              {showCreateCoupon && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-gray-900">
                      {editingCoupon ? 'Edit Coupon' : 'Create New Coupon'}
                    </h3>
                    <button
                      onClick={() => {
                        setShowCreateCoupon(false);
                        setEditingCoupon(null);
                        setCouponError('');
                        setCouponSuccess('');
                      }}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>

                  {couponError && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-600">
                      <AlertCircle className="w-5 h-5" />
                      <span className="text-sm">{couponError}</span>
                    </div>
                  )}

                  {couponSuccess && (
                    <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-xl flex items-center gap-2 text-green-600">
                      <CheckCircle2 className="w-5 h-5" />
                      <span className="text-sm">{couponSuccess}</span>
                    </div>
                  )}

                  <div className="space-y-4">
                    {/* Code */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Coupon Code *
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={couponForm.code}
                          onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })}
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent uppercase"
                          placeholder="ABC12345"
                          maxLength={20}
                        />
                        <button
                          onClick={() => setCouponForm({ ...couponForm, code: generateCouponCode() })}
                          className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-xl hover:bg-gray-50 transition-all"
                        >
                          Generate
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">6-20 alphanumeric characters</p>
                    </div>

                    {/* Discount Type & Value */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Discount Type *
                        </label>
                        <select
                          value={couponForm.discountType}
                          onChange={(e) => setCouponForm({ ...couponForm, discountType: e.target.value as 'percentage' | 'fixed' })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        >
                          <option value="percentage">Percentage (%)</option>
                          <option value="fixed">Fixed Amount (₦)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Discount Value *
                        </label>
                        <input
                          type="number"
                          value={couponForm.discountValue}
                          onChange={(e) => setCouponForm({ ...couponForm, discountValue: parseFloat(e.target.value) || 0 })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                          min={couponForm.discountType === 'percentage' ? 1 : 100}
                          max={couponForm.discountType === 'percentage' ? 100 : undefined}
                          placeholder={couponForm.discountType === 'percentage' ? '10' : '1000'}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          {couponForm.discountType === 'percentage' ? '1-100%' : 'Minimum ₦100'}
                        </p>
                      </div>
                    </div>

                    {/* Applicable Plans */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Applicable Plans *
                      </label>
                      <div className="flex gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={couponForm.applicablePlans.includes('monthly')}
                            onChange={() => handleToggleCouponPlan('monthly')}
                            className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                          />
                          <span className="text-sm text-gray-700">Monthly</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={couponForm.applicablePlans.includes('yearly')}
                            onChange={() => handleToggleCouponPlan('yearly')}
                            className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                          />
                          <span className="text-sm text-gray-700">Yearly</span>
                        </label>
                      </div>
                    </div>

                    {/* Expiration Date */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Expiration Date (Optional)
                      </label>
                      <input
                        type="date"
                        value={couponForm.expirationDate}
                        onChange={(e) => setCouponForm({ ...couponForm, expirationDate: e.target.value })}
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      />
                    </div>

                    {/* Max Uses */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Max Uses (Optional)
                      </label>
                      <input
                        type="number"
                        value={couponForm.maxUses}
                        onChange={(e) => setCouponForm({ ...couponForm, maxUses: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        min="1"
                        placeholder="Leave empty for unlimited"
                      />
                    </div>

                    {/* Description */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Description (Optional)
                      </label>
                      <textarea
                        value={couponForm.description}
                        onChange={(e) => setCouponForm({ ...couponForm, description: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        rows={3}
                        placeholder="Describe this coupon..."
                      />
                    </div>

                    {/* Active Toggle */}
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                      <div>
                        <p className="font-semibold text-gray-900">Active</p>
                        <p className="text-sm text-gray-500">Enable or disable this coupon</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={couponForm.isActive}
                          onChange={(e) => setCouponForm({ ...couponForm, isActive: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                      </label>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-4 pt-4">
                      <button
                        onClick={handleSaveCoupon}
                        className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all font-medium"
                      >
                        {editingCoupon ? 'Update Coupon' : 'Create Coupon'}
                      </button>
                      <button
                        onClick={() => {
                          setShowCreateCoupon(false);
                          setEditingCoupon(null);
                          setCouponError('');
                          setCouponSuccess('');
                        }}
                        className="px-4 py-2 text-gray-600 hover:text-gray-900 border border-gray-300 rounded-xl hover:bg-gray-50 transition-all"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Filters */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                <div className="flex-1 relative">
                  <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search coupons..."
                    value={couponSearch}
                    onChange={(e) => setCouponSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>
                <select
                  value={couponFilter}
                  onChange={(e) => setCouponFilter(e.target.value as any)}
                  className="px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              {/* Coupons Table */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[900px]">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plans</th>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expires</th>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Uses</th>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {paginatedCoupons.map((coupon) => {
                        const stats = getCouponUsageStats(coupon.id);
                        const isExpired = coupon.expirationDate && new Date(coupon.expirationDate) < new Date();
                        const isUsageLimitReached = coupon.maxUses && coupon.currentUses >= coupon.maxUses;
                        const effectiveStatus = !coupon.isActive ? 'inactive' : isExpired ? 'expired' : isUsageLimitReached ? 'limit-reached' : 'active';

                        return (
                          <tr key={coupon.id} className="hover:bg-gray-50">
                            <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                              <div className="font-mono font-semibold text-gray-900">{coupon.code}</div>
                              {coupon.description && (
                                <div className="text-xs text-gray-500 mt-1">{coupon.description}</div>
                              )}
                            </td>
                            <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                              {coupon.discountType}
                            </td>
                            <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                              {coupon.discountType === 'percentage' 
                                ? `${coupon.discountValue}%` 
                                : `₦${coupon.discountValue.toLocaleString()}`}
                            </td>
                            <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              <div className="flex flex-col gap-1">
                                {coupon.applicablePlans.map(plan => (
                                  <span key={plan} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs capitalize w-fit">
                                    {plan}
                                  </span>
                                ))}
                              </div>
                            </td>
                            <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {coupon.expirationDate 
                                ? new Date(coupon.expirationDate).toLocaleDateString()
                                : <span className="text-gray-400">No expiry</span>}
                              {isExpired && (
                                <div className="text-xs text-red-500 mt-1">Expired</div>
                              )}
                            </td>
                            <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {coupon.currentUses}{coupon.maxUses ? ` / ${coupon.maxUses}` : ' / ∞'}
                              {stats.totalUses > 0 && (
                                <div className="text-xs text-gray-500 mt-1">
                                  ₦{stats.totalDiscount.toLocaleString()} saved
                                </div>
                              )}
                            </td>
                            <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                              <span
                                className={`px-2 py-1 text-xs font-medium rounded-full ${
                                  effectiveStatus === 'active'
                                    ? 'bg-green-100 text-green-700'
                                    : effectiveStatus === 'expired'
                                    ? 'bg-red-100 text-red-700'
                                    : effectiveStatus === 'limit-reached'
                                    ? 'bg-orange-100 text-orange-700'
                                    : 'bg-gray-100 text-gray-700'
                                }`}
                              >
                                {effectiveStatus === 'limit-reached' ? 'Limit Reached' : effectiveStatus}
                              </span>
                            </td>
                            <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleEditCoupon(coupon)}
                                  className="text-blue-600 hover:text-blue-800 transition-colors"
                                  title="Edit"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteCoupon(coupon.id)}
                                  className="text-red-600 hover:text-red-800 transition-colors"
                                  title="Delete"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {filteredCoupons.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    <Ticket className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                    <p>No coupons found</p>
                    {coupons.length === 0 && (
                      <button
                        onClick={handleCreateCoupon}
                        className="mt-4 text-emerald-600 hover:text-emerald-700 font-medium"
                      >
                        Create your first coupon
                      </button>
                    )}
                  </div>
                )}

                {/* Pagination */}
                {filteredCoupons.length > 0 && couponsTotalPages > 1 && (
                  <div className="px-4 sm:px-6 py-4 border-t border-gray-200 flex items-center justify-between flex-wrap gap-4">
                    <div className="text-sm text-gray-700">
                      Showing {(couponsPage - 1) * ITEMS_PER_PAGE + 1} to {Math.min(couponsPage * ITEMS_PER_PAGE, filteredCoupons.length)} of {filteredCoupons.length} coupons
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setCouponsPage(prev => Math.max(1, prev - 1))}
                        disabled={couponsPage === 1}
                        className="px-3 py-2 border border-gray-300 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-all"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <span className="text-sm text-gray-700 px-3">
                        Page {couponsPage} of {couponsTotalPages}
                      </span>
                      <button
                        onClick={() => setCouponsPage(prev => Math.min(couponsTotalPages, prev + 1))}
                        disabled={couponsPage === couponsTotalPages}
                        className="px-3 py-2 border border-gray-300 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-all"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'ai' && (
            <div className="space-y-6">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">AI Management</h2>

              {/* API Key Configuration */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-2">Gemini API Key</h3>
                <p className="text-sm text-gray-500 mb-6">
                  Configure the Gemini API key for AI chat functionality. This key is used by all shops for AI features.
                </p>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      API Key
                    </label>
                    <input
                      type="password"
                      value={geminiApiKey}
                      onChange={(e) => {
                        setGeminiApiKey(e.target.value);
                        setApiKeyChanged(true);
                        setApiKeySaveSuccess(false);
                      }}
                      placeholder="Enter Gemini API Key"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent font-mono"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {getGeminiApiKeySync() ? (
                        <span className="text-green-600">API Key is configured</span>
                      ) : (
                        <span className="text-orange-600">API Key is not configured</span>
                      )}
                    </p>
                  </div>
                  
                  {apiKeySaveSuccess && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-xl flex items-center gap-2 text-green-600">
                      <CheckCircle2 className="w-5 h-5" />
                      <span className="text-sm">API Key saved successfully!</span>
                    </div>
                  )}

                  <div className="flex justify-end pt-4 border-t border-gray-200">
                    <button
                      onClick={handleSaveApiKey}
                      disabled={!apiKeyChanged}
                      className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all shadow-lg shadow-emerald-200 hover:shadow-xl disabled:shadow-none"
                    >
                      <Save className="w-5 h-5" />
                      <span>Save API Key</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Shops AI Control */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-4 sm:p-6 border-b border-gray-200">
                  <h3 className="text-lg font-bold text-gray-900">Shops AI Control</h3>
                  <p className="text-sm text-gray-500 mt-1">Enable or disable AI chat for specific shops</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[700px]">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Shop Name</th>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Owner Email</th>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usage Count</th>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">AI Status</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {shops.map((shop) => {
                        const usageCount = getAIUsageByShop(shop.shopId).length;
                        const shopAIEnabled = shop.aiEnabled !== undefined ? shop.aiEnabled : true;
                        
                        return (
                          <tr key={shop.shopId} className="hover:bg-gray-50">
                            <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                              <div className="font-semibold text-gray-900">{shop.shopName}</div>
                            </td>
                            <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {shop.ownerEmail}
                            </td>
                            <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {usageCount} request{usageCount !== 1 ? 's' : ''}
                            </td>
                            <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={shopAIEnabled}
                                  onChange={async (e) => {
                                    await toggleShopAI(shop.shopId, e.target.checked);
                                    await loadData();
                                  }}
                                  className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                                <span className="ml-3 text-sm font-medium text-gray-700">
                                  {shopAIEnabled ? 'Enabled' : 'Disabled'}
                                </span>
                              </label>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {shops.length === 0 && (
                  <div className="text-center py-12 text-gray-500">No shops found</div>
                )}
              </div>

              {/* AI Usage Statistics */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                <div className="bg-white rounded-2xl p-4 sm:p-6 border border-gray-100 shadow-sm">
                  <p className="text-sm text-gray-500 mb-2">Total AI Requests</p>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-900">{totalAIRequests}</p>
                </div>
                <div className="bg-white rounded-2xl p-4 sm:p-6 border border-gray-100 shadow-sm">
                  <p className="text-sm text-gray-500 mb-2">Shops Using AI</p>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-900">
                    {shops.filter(s => (s.aiEnabled !== undefined ? s.aiEnabled : true)).length}
                  </p>
                </div>
                <div className="bg-white rounded-2xl p-4 sm:p-6 border border-gray-100 shadow-sm">
                  <p className="text-sm text-gray-500 mb-2">Abuse Incidents</p>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-900">
                    {aiUsageRecords.filter(r => r.isAbuse).length}
                  </p>
                </div>
              </div>

              {/* AI Usage Logs */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-4 sm:p-6 border-b border-gray-200">
                  <h3 className="text-lg font-bold text-gray-900">AI Usage Logs</h3>
                </div>

                {/* Filters */}
                <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                  <div className="flex-1 relative">
                    <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search by shop, user, or prompt..."
                      value={aiUsageSearch}
                      onChange={(e) => setAiUsageSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                  </div>
                  <select
                    value={aiUsageShopFilter}
                    onChange={(e) => setAiUsageShopFilter(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  >
                    <option value="all">All Shops</option>
                    {uniqueShopsForAI.map(({ shopId, shopName }) => (
                      <option key={shopId} value={shopId}>{shopName}</option>
                    ))}
                  </select>
                </div>

                {/* Usage Logs Table */}
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[900px]">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Shop</th>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prompt</th>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {paginatedAIUsage.map((record) => (
                        <tr key={record.id} className="hover:bg-gray-50">
                          <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                            <div className="font-semibold text-gray-900">{record.shopName}</div>
                          </td>
                          <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {record.userName}
                          </td>
                          <td className="px-4 sm:px-6 py-4">
                            <div className="text-sm text-gray-900 max-w-xs truncate" title={record.prompt}>
                              {record.prompt.length > 100 ? `${record.prompt.substring(0, 100)}...` : record.prompt}
                            </div>
                          </td>
                          <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(record.timestamp).toLocaleString()}
                          </td>
                          <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                            {record.isAbuse ? (
                              <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700">
                                Abuse
                              </span>
                            ) : (
                              <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">
                                Normal
                              </span>
                            )}
                          </td>
                          <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => setViewingUsageDetails(record)}
                                className="text-blue-600 hover:text-blue-800 transition-colors"
                                title="View Details"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              {!record.isAbuse && (
                                <button
                                  onClick={() => {
                                    if (window.confirm('Mark this usage as abuse?')) {
                                      markAbuse(record.id, 'Manually marked by admin');
                                      setAiUsageRecords(getAllAIUsageRecords());
                                    }
                                  }}
                                  className="text-red-600 hover:text-red-800 transition-colors"
                                  title="Mark as Abuse"
                                >
                                  <Ban className="w-4 h-4" />
                                </button>
                              )}
                              {!isShopAIEnabled(record.shopId) && (
                                <button
                                  onClick={async () => {
                                    await toggleShopAI(record.shopId, false);
                                    await loadData();
                                  }}
                                  className="text-orange-600 hover:text-orange-800 transition-colors"
                                  title="AI is disabled for this shop"
                                >
                                  <Bot className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {filteredAIUsage.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    <Bot className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                    <p>No AI usage records found</p>
                  </div>
                )}

                {/* Pagination */}
                {filteredAIUsage.length > 0 && aiUsageTotalPages > 1 && (
                  <div className="px-4 sm:px-6 py-4 border-t border-gray-200 flex items-center justify-between flex-wrap gap-4">
                    <div className="text-sm text-gray-700">
                      Showing {(aiUsagePage - 1) * ITEMS_PER_PAGE + 1} to {Math.min(aiUsagePage * ITEMS_PER_PAGE, filteredAIUsage.length)} of {filteredAIUsage.length} records
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setAiUsagePage(prev => Math.max(1, prev - 1))}
                        disabled={aiUsagePage === 1}
                        className="px-3 py-2 border border-gray-300 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-all"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <span className="text-sm text-gray-700 px-3">
                        Page {aiUsagePage} of {aiUsageTotalPages}
                      </span>
                      <button
                        onClick={() => setAiUsagePage(prev => Math.min(aiUsageTotalPages, prev + 1))}
                        disabled={aiUsagePage === aiUsageTotalPages}
                        className="px-3 py-2 border border-gray-300 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-all"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Usage Details Modal */}
              {viewingUsageDetails && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={() => setViewingUsageDetails(null)}>
                  <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
                    <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                      <h3 className="text-lg font-bold text-gray-900">AI Usage Details</h3>
                      <button
                        onClick={() => setViewingUsageDetails(null)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <X className="w-6 h-6" />
                      </button>
                    </div>
                    <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium text-gray-500">Shop</label>
                          <p className="text-gray-900 font-semibold">{viewingUsageDetails.shopName}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">User</label>
                          <p className="text-gray-900">{viewingUsageDetails.userName}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Timestamp</label>
                          <p className="text-gray-900">{new Date(viewingUsageDetails.timestamp).toLocaleString()}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Prompt</label>
                          <div className="mt-1 p-3 bg-gray-50 rounded-xl border border-gray-200">
                            <p className="text-gray-900 whitespace-pre-wrap">{viewingUsageDetails.prompt}</p>
                          </div>
                        </div>
                        {viewingUsageDetails.response && (
                          <div>
                            <label className="text-sm font-medium text-gray-500">Response</label>
                            <div className="mt-1 p-3 bg-gray-50 rounded-xl border border-gray-200 max-h-60 overflow-y-auto">
                              <p className="text-gray-900 whitespace-pre-wrap text-sm">{viewingUsageDetails.response}</p>
                            </div>
                          </div>
                        )}
                        {viewingUsageDetails.isAbuse && (
                          <div>
                            <label className="text-sm font-medium text-red-600">Abuse Reason</label>
                            <p className="text-red-700">{viewingUsageDetails.abuseReason || 'Marked as abuse'}</p>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
                      {!viewingUsageDetails.isAbuse && (
                        <button
                          onClick={() => {
                            markAbuse(viewingUsageDetails.id, 'Manually marked by admin');
                            setAiUsageRecords(getAllAIUsageRecords());
                            setViewingUsageDetails(null);
                          }}
                          className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all"
                        >
                          Mark as Abuse
                        </button>
                      )}
                      <button
                        onClick={async () => {
                          await toggleShopAI(viewingUsageDetails.shopId, false);
                          await loadData();
                          setViewingUsageDetails(null);
                        }}
                        className="px-4 py-2 bg-orange-600 text-white rounded-xl hover:bg-orange-700 transition-all"
                      >
                        Disable AI for Shop
                      </button>
                      <button
                        onClick={() => setViewingUsageDetails(null)}
                        className="px-4 py-2 text-gray-600 hover:text-gray-900 border border-gray-300 rounded-xl hover:bg-gray-50 transition-all"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'reset' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Reset Shop Data</h2>
                  <p className="text-sm text-gray-500 mt-1">Select a shop and choose what data to reset. Products/Stocks are preserved.</p>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
                {/* Shop Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Shop
                  </label>
                  <select
                    value={selectedShopId}
                    onChange={(e) => {
                      setSelectedShopId(e.target.value);
                      setResetSuccess(false);
                      setResetError('');
                    }}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  >
                    <option value="">-- Select a shop --</option>
                    {shops.map(shop => (
                      <option key={shop.shopId} value={shop.shopId}>
                        {shop.shopName} ({shop.ownerEmail})
                      </option>
                    ))}
                  </select>
                </div>

                {selectedShopId && (
                  <>
                    {/* Reset Options */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Select Data to Reset
                      </label>
                      <div className="space-y-3">
                        <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={resetOptions.sales}
                            onChange={(e) => setResetOptions(prev => ({ ...prev, sales: e.target.checked }))}
                            className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                          />
                          <div className="flex-1">
                            <span className="font-medium text-gray-900">Sales/Transactions</span>
                            <p className="text-xs text-gray-500">Delete all sales and transaction records</p>
                          </div>
                        </label>

                        <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={resetOptions.customers}
                            onChange={(e) => setResetOptions(prev => ({ ...prev, customers: e.target.checked }))}
                            className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                          />
                          <div className="flex-1">
                            <span className="font-medium text-gray-900">Customers/Debtors</span>
                            <p className="text-xs text-gray-500">Delete all customer records and debt information</p>
                          </div>
                        </label>

                        <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={resetOptions.debtTransactions}
                            onChange={(e) => setResetOptions(prev => ({ ...prev, debtTransactions: e.target.checked }))}
                            className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                          />
                          <div className="flex-1">
                            <span className="font-medium text-gray-900">Debt Transactions</span>
                            <p className="text-xs text-gray-500">Delete all debt payment and credit transaction records</p>
                          </div>
                        </label>

                        <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={resetOptions.expenses}
                            onChange={(e) => setResetOptions(prev => ({ ...prev, expenses: e.target.checked }))}
                            className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                          />
                          <div className="flex-1">
                            <span className="font-medium text-gray-900">Expenses</span>
                            <p className="text-xs text-gray-500">Delete all expense records</p>
                          </div>
                        </label>

                        <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={resetOptions.giftCards}
                            onChange={(e) => setResetOptions(prev => ({ ...prev, giftCards: e.target.checked }))}
                            className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                          />
                          <div className="flex-1">
                            <span className="font-medium text-gray-900">Gift Cards</span>
                            <p className="text-xs text-gray-500">Delete all gift card records</p>
                          </div>
                        </label>

                        <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={resetOptions.activityLogs}
                            onChange={(e) => setResetOptions(prev => ({ ...prev, activityLogs: e.target.checked }))}
                            className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                          />
                          <div className="flex-1">
                            <span className="font-medium text-gray-900">Activity Logs</span>
                            <p className="text-xs text-gray-500">Delete all activity log records</p>
                          </div>
                        </label>

                        <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={resetOptions.stockMovements}
                            onChange={(e) => setResetOptions(prev => ({ ...prev, stockMovements: e.target.checked }))}
                            className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                          />
                          <div className="flex-1">
                            <span className="font-medium text-gray-900">Stock Movements</span>
                            <p className="text-xs text-gray-500">Delete all stock movement history (products remain)</p>
                          </div>
                        </label>
                      </div>
                    </div>

                    {/* Warning */}
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <h4 className="font-semibold text-red-900 mb-1">Warning: This action cannot be undone!</h4>
                          <p className="text-sm text-red-700">
                            Selected data will be permanently deleted from the database. Products and stock levels will be preserved.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Success/Error Messages */}
                    {resetSuccess && (
                      <div className="p-3 bg-green-50 border border-green-200 rounded-xl flex items-center gap-2 text-green-600">
                        <CheckCircle2 className="w-5 h-5" />
                        <span className="text-sm">Shop data reset successfully!</span>
                      </div>
                    )}

                    {resetError && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-600">
                        <AlertCircle className="w-5 h-5" />
                        <span className="text-sm">{resetError}</span>
                      </div>
                    )}

                    {/* Reset Button */}
                    <div className="flex justify-end pt-4 border-t border-gray-200">
                      <button
                        onClick={async () => {
                          const hasAnyOption = Object.values(resetOptions).some(v => v);
                          if (!hasAnyOption) {
                            setResetError('Please select at least one data type to reset');
                            return;
                          }

                          const confirmed = window.confirm(
                            `Are you sure you want to reset the selected data for this shop? This action cannot be undone!\n\nSelected: ${Object.entries(resetOptions)
                              .filter(([_, checked]) => checked)
                              .map(([key]) => key.replace(/([A-Z])/g, ' $1').trim())
                              .join(', ')}`
                          );

                          if (!confirmed) return;

                          setResetting(true);
                          setResetError('');
                          setResetSuccess(false);

                          try {
                            console.log('Starting reset for shop:', selectedShopId, 'Options:', resetOptions);
                            await db.resetShopData(selectedShopId, resetOptions);
                            console.log('Reset completed successfully');
                            setResetSuccess(true);
                            setResetError('');
                            setResetOptions({
                              sales: false,
                              customers: false,
                              debtTransactions: false,
                              expenses: false,
                              giftCards: false,
                              activityLogs: false,
                              stockMovements: false
                            });
                            // Refresh shop list after reset
                            setTimeout(() => {
                              setShops(getAllShops());
                            }, 1000);
                          } catch (error: any) {
                            console.error('Reset error:', error);
                            setResetError(error.message || 'Failed to reset shop data. Please check the console for details.');
                            setResetSuccess(false);
                          } finally {
                            setResetting(false);
                          }
                        }}
                        disabled={resetting || !Object.values(resetOptions).some(v => v)}
                        className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all shadow-lg shadow-red-200 hover:shadow-xl disabled:shadow-none"
                      >
                        {resetting ? (
                          <>
                            <RefreshCw className="w-5 h-5 animate-spin" />
                            <span>Resetting...</span>
                          </>
                        ) : (
                          <>
                            <Trash2 className="w-5 h-5" />
                            <span>Reset Selected Data</span>
                          </>
                        )}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Settings</h2>
                {saveSuccess && (
                  <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
                    <CheckCircle2 className="w-5 h-5" />
                    <span>Saved successfully!</span>
                  </div>
                )}
              </div>

              {/* Trial Configuration */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-2">Trial Configuration</h3>
                <p className="text-sm text-gray-500 mb-6">
                  Changes to trial settings only apply to <strong>new shop registrations</strong>. Existing shops keep their original trial periods.
                </p>
                
                <div className="space-y-6">
                  {/* Enable/Disable Trial */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 bg-gray-50 rounded-xl">
                    <div>
                      <p className="font-semibold text-gray-900">Enable Trial</p>
                      <p className="text-sm text-gray-500">Allow new shops to start with a trial period</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                      <input
                        type="checkbox"
                        checked={tempConfig.trialEnabled}
                        onChange={(e) => {
                          handleSettingsChange({ trialEnabled: e.target.checked });
                        }}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                    </label>
                  </div>

                  {/* Trial Days */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Trial Days
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="365"
                      value={tempConfig.trialDays}
                      onChange={(e) => {
                        const days = parseInt(e.target.value) || 0;
                        handleSettingsChange({ trialDays: Math.min(365, Math.max(0, days)) });
                      }}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500 mt-1">Number of days for the trial period (0-365)</p>
                  </div>
                </div>
                
                {/* Save Button - Always Visible */}
                <div className="pt-6 border-t-2 border-gray-200">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      {settingsChanged ? (
                        <p className="text-sm text-orange-600 font-medium">You have unsaved changes</p>
                      ) : (
                        <p className="text-sm text-gray-500">All changes saved</p>
                      )}
                    </div>
                    <button
                      onClick={handleSaveSettings}
                      disabled={!settingsChanged}
                      className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all shadow-lg shadow-emerald-200 hover:shadow-xl disabled:shadow-none"
                    >
                      <Save className="w-5 h-5" />
                      <span>{settingsChanged ? 'Save Changes' : 'No Changes to Save'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Gemini API Key Configuration */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-2">Gemini API Key</h3>
                <p className="text-sm text-gray-500 mb-6">
                  Configure the Gemini API key for AI chat functionality. This key is used by all shops for AI features.
                </p>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      API Key
                    </label>
                    <input
                      type="password"
                      value={geminiApiKey}
                      onChange={(e) => {
                        setGeminiApiKey(e.target.value);
                        setApiKeyChanged(true);
                        setApiKeySaveSuccess(false);
                      }}
                      placeholder="Enter Gemini API Key"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent font-mono"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {getGeminiApiKeySync() ? (
                        <span className="text-green-600">API Key is configured</span>
                      ) : (
                        <span className="text-orange-600">API Key is not configured</span>
                      )}
                    </p>
                  </div>
                  
                  {apiKeySaveSuccess && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-xl flex items-center gap-2 text-green-600">
                      <CheckCircle2 className="w-5 h-5" />
                      <span className="text-sm">API Key saved successfully!</span>
                    </div>
                  )}

                  <div className="flex justify-end pt-4 border-t border-gray-200">
                    <button
                      onClick={handleSaveApiKey}
                      disabled={!apiKeyChanged}
                      className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all shadow-lg shadow-emerald-200 hover:shadow-xl disabled:shadow-none"
                    >
                      <Save className="w-5 h-5" />
                      <span>Save API Key</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Paystack Configuration */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-2">Paystack Payment Configuration</h3>
                <p className="text-sm text-gray-500 mb-6">
                  Configure Paystack API keys for payment processing. Test keys start with pk_test_/sk_test_, live keys start with pk_live_/sk_live_.
                </p>
                
                <div className="space-y-6">
                  {/* Mode Toggle */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 bg-gray-50 rounded-xl">
                    <div>
                      <p className="font-semibold text-gray-900">Payment Mode</p>
                      <p className="text-sm text-gray-500">Switch between test and live payment processing</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-sm font-medium ${paystackMode === 'test' ? 'text-gray-900' : 'text-gray-500'}`}>Test</span>
                      <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                        <input
                          type="checkbox"
                          checked={paystackMode === 'live'}
                          onChange={(e) => {
                            setPaystackMode(e.target.checked ? 'live' : 'test');
                            setPaystackKeysChanged(true);
                            setPaystackSaveSuccess(false);
                          }}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                      </label>
                      <span className={`text-sm font-medium ${paystackMode === 'live' ? 'text-red-600' : 'text-gray-500'}`}>Live</span>
                      {paystackMode === 'live' && (
                        <span className="px-2 py-1 text-xs font-bold text-red-600 bg-red-50 border border-red-200 rounded">⚠️ LIVE MODE</span>
                      )}
                    </div>
                  </div>

                  {/* Test Keys */}
                  <div className="border border-gray-200 rounded-xl p-4">
                    <h4 className="font-semibold text-gray-900 mb-4">Test Environment Keys</h4>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Test Public Key (pk_test_...)
                        </label>
                        <input
                          type="password"
                          value={paystackTestPublicKey}
                          onChange={(e) => {
                            setPaystackTestPublicKey(e.target.value);
                            setPaystackKeysChanged(true);
                            setPaystackSaveSuccess(false);
                          }}
                          placeholder="pk_test_..."
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent font-mono"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          {getPaystackPublicKey() && getPaystackMode() === 'test' ? (
                            <span className="text-green-600">Test public key is configured</span>
                          ) : paystackTestPublicKey ? (
                            <span className="text-gray-500">Will be saved when you click Save</span>
                          ) : (
                            <span className="text-orange-600">Test public key is not configured</span>
                          )}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Test Secret Key (sk_test_...)
                        </label>
                        <input
                          type="password"
                          value={paystackTestSecretKey}
                          onChange={(e) => {
                            setPaystackTestSecretKey(e.target.value);
                            setPaystackKeysChanged(true);
                            setPaystackSaveSuccess(false);
                          }}
                          placeholder="sk_test_..."
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent font-mono"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          {getPaystackSecretKey() && getPaystackMode() === 'test' ? (
                            <span className="text-green-600">Test secret key is configured</span>
                          ) : paystackTestSecretKey ? (
                            <span className="text-gray-500">Will be saved when you click Save</span>
                          ) : (
                            <span className="text-orange-600">Test secret key is not configured</span>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Live Keys */}
                  <div className="border border-red-200 rounded-xl p-4 bg-red-50/30">
                    <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      Live Environment Keys
                      <span className="px-2 py-1 text-xs font-bold text-red-600 bg-red-100 border border-red-200 rounded">USE WITH CAUTION</span>
                    </h4>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Live Public Key (pk_live_...)
                        </label>
                        <input
                          type="password"
                          value={paystackLivePublicKey}
                          onChange={(e) => {
                            setPaystackLivePublicKey(e.target.value);
                            setPaystackKeysChanged(true);
                            setPaystackSaveSuccess(false);
                          }}
                          placeholder="pk_live_..."
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent font-mono"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          {getPaystackPublicKey() && getPaystackMode() === 'live' ? (
                            <span className="text-green-600">Live public key is configured</span>
                          ) : paystackLivePublicKey ? (
                            <span className="text-gray-500">Will be saved when you click Save</span>
                          ) : (
                            <span className="text-orange-600">Live public key is not configured</span>
                          )}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Live Secret Key (sk_live_...)
                        </label>
                        <input
                          type="password"
                          value={paystackLiveSecretKey}
                          onChange={(e) => {
                            setPaystackLiveSecretKey(e.target.value);
                            setPaystackKeysChanged(true);
                            setPaystackSaveSuccess(false);
                          }}
                          placeholder="sk_live_..."
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent font-mono"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          {getPaystackSecretKey() && getPaystackMode() === 'live' ? (
                            <span className="text-green-600">Live secret key is configured</span>
                          ) : paystackLiveSecretKey ? (
                            <span className="text-gray-500">Will be saved when you click Save</span>
                          ) : (
                            <span className="text-orange-600">Live secret key is not configured</span>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {paystackSaveSuccess && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-xl flex items-center gap-2 text-green-600">
                      <CheckCircle2 className="w-5 h-5" />
                      <span className="text-sm">Paystack keys saved successfully!</span>
                    </div>
                  )}

                  <div className="flex justify-end pt-4 border-t border-gray-200">
                    <button
                      onClick={handleSavePaystackKeys}
                      disabled={!paystackKeysChanged}
                      className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all shadow-lg shadow-emerald-200 hover:shadow-xl disabled:shadow-none"
                    >
                      <Save className="w-5 h-5" />
                      <span>Save Paystack Keys</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

