import React, { useState, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { SubscriptionPlan } from '../types';
import { CreditCard, Lock, CheckCircle2, Clock, AlertCircle, Loader, Calendar, TrendingUp, History, Tag, X } from 'lucide-react';
import { getSubscriptionPrice, getDaysRemaining } from '../services/subscription';
import { initializePayment, generatePaymentReference } from '../services/paystack';
import { getShopPayments } from '../services/paymentTracking';
import { validateCoupon, applyCoupon, getCouponByCode } from '../services/couponService';
import { Coupon } from '../types';

export const Payment: React.FC = () => {
  const { 
    subscription, 
    getSubscription, 
    checkSubscription, 
    isAccountLocked, 
    processPayment, 
    settings,
    currentUser,
    payments,
    t 
  } = useStore();
  
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan>('monthly');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponError, setCouponError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState('');
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  
  const sub = getSubscription();
  const isLocked = isAccountLocked();
  const daysLeft = sub ? getDaysRemaining(sub) : 0;
  const subscriptionStatus = sub ? checkSubscription() : false;
  const status = sub?.status || 'expired';
  
  // If no subscription exists, show message to contact support (shouldn't happen with migration)
  if (!sub) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-8 text-center">
          <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No Subscription Found</h2>
          <p className="text-gray-600 mb-6">
            Unable to load subscription information. Please contact support or try refreshing the page.
          </p>
        </div>
      </div>
    );
  }
  
  useEffect(() => {
    if (subscription) {
      checkSubscription();
    }
  }, [subscription]);

  // Calculate price with coupon discount
  const originalAmount = getSubscriptionPrice(selectedPlan);
  const { finalAmount, discountAmount } = appliedCoupon 
    ? applyCoupon(appliedCoupon, selectedPlan, originalAmount)
    : { finalAmount: originalAmount, discountAmount: 0 };

  // Reset coupon when plan changes
  useEffect(() => {
    if (appliedCoupon) {
      const validation = validateCoupon(appliedCoupon.code, selectedPlan);
      if (!validation.valid || !validation.coupon) {
        setAppliedCoupon(null);
        setCouponError(validation.error || 'Coupon is not valid for this plan');
      }
    }
  }, [selectedPlan]);

  const handleApplyCoupon = () => {
    setCouponError('');
    setCouponSuccess('');
    setApplyingCoupon(true);

    if (!couponCode.trim()) {
      setCouponError('Please enter a coupon code');
      setApplyingCoupon(false);
      return;
    }

    const validation = validateCoupon(couponCode.trim().toUpperCase(), selectedPlan);
    
    if (validation.valid && validation.coupon) {
      setAppliedCoupon(validation.coupon);
      setCouponSuccess(`Coupon "${validation.coupon.code}" applied successfully!`);
      setCouponCode('');
      
      // Calculate discount for success message
      const { discountAmount: discount } = applyCoupon(validation.coupon, selectedPlan, originalAmount);
      setTimeout(() => setCouponSuccess(''), 5000);
    } else {
      setCouponError(validation.error || 'Invalid coupon code');
    }

    setApplyingCoupon(false);
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponError('');
    setCouponSuccess('');
  };
  
  const handlePayment = async () => {
    if (!sub || !currentUser) {
      setError('Unable to process payment. Please try again.');
      return;
    }
    
    // Re-validate coupon before payment
    if (appliedCoupon) {
      const validation = validateCoupon(appliedCoupon.code, selectedPlan);
      if (!validation.valid || !validation.coupon) {
        setError(validation.error || 'Coupon is no longer valid');
        setAppliedCoupon(null);
        return;
      }
    }
    
    setProcessing(true);
    setError('');
    
    try {
      // If final amount is ₦0 (100% off coupon), skip Paystack and activate directly
      if (finalAmount === 0) {
        const reference = `FREE_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        
        const success = await processPayment(
          selectedPlan,
          reference,
          0, // Free subscription
          appliedCoupon?.code,
          discountAmount,
          originalAmount
        );
        
        if (success) {
          setProcessing(false);
          setCouponSuccess('Free subscription activated with coupon!');
          setTimeout(() => {
            window.location.reload(); // Reload to update app state
          }, 2000);
        } else {
          setError('Failed to activate free subscription. Please contact support.');
          setProcessing(false);
        }
        return;
      }
      
      // Normal payment flow for amount > ₦0
      const reference = generatePaymentReference(sub.shopId);
      
      // Use final amount (with discount if coupon applied)
      await initializePayment(
        currentUser.email || 'user@shopos.com',
        finalAmount,
        reference,
        async (paymentRef: string) => {
          // Payment successful callback
          const success = await processPayment(
            selectedPlan, 
            paymentRef, 
            finalAmount,
            appliedCoupon?.code,
            discountAmount,
            originalAmount
          );
          if (success) {
            setProcessing(false);
            // Subscription will be unlocked automatically
            window.location.reload(); // Reload to update app state
          } else {
            setError('Payment verification failed. The payment was not verified with Paystack. Please contact support if you have already paid.');
            setProcessing(false);
          }
        },
        () => {
          // Payment cancelled/closed callback
          setProcessing(false);
          setError('Payment was cancelled.');
        }
      );
    } catch (err: any) {
      console.error('Payment error:', err);
      setError(err.message || 'Failed to initialize payment. Please try again.');
      setProcessing(false);
    }
  };
  
  const getStatusColor = () => {
    switch (status) {
      case 'trial':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'active':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'expired':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };
  
  const getStatusIcon = () => {
    switch (status) {
      case 'trial':
        return <Clock className="w-5 h-5" />;
      case 'active':
        return <CheckCircle2 className="w-5 h-5" />;
      case 'expired':
        return <Lock className="w-5 h-5" />;
      default:
        return <AlertCircle className="w-5 h-5" />;
    }
  };
  
  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('subscriptionManagement')}</h1>
            <p className="text-gray-500">
              {isLocked 
                ? 'Your subscription has expired. Please renew to continue using ShopOS.'
                : 'Manage your subscription and billing information.'}
            </p>
          </div>
          <div className={`px-4 py-2 rounded-xl border-2 flex items-center gap-2 font-bold ${getStatusColor()}`}>
            {getStatusIcon()}
            <span className="uppercase text-sm">{t(status)}</span>
          </div>
        </div>
        
        {/* Subscription Info */}
        {sub && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
              <div className="flex items-center gap-3 mb-2">
                <Calendar className="w-5 h-5 text-gray-400" />
                <span className="text-sm font-medium text-gray-500">{t('currentPlan')}</span>
              </div>
              <p className="text-xl font-bold text-gray-900 capitalize">{sub.plan}</p>
              {status === 'active' && sub.subscriptionEndDate && (
                <p className="text-sm text-gray-500 mt-1">
                  {t('nextBillingDate')}: {new Date(sub.subscriptionEndDate).toLocaleDateString()}
                </p>
              )}
            </div>
            
            <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
              <div className="flex items-center gap-3 mb-2">
                <Clock className="w-5 h-5 text-gray-400" />
                <span className="text-sm font-medium text-gray-500">{t('daysRemaining')}</span>
              </div>
              <p className="text-3xl font-bold text-gray-900">{daysLeft}</p>
              <p className="text-sm text-gray-500 mt-1">{daysLeft === 1 ? 'day' : 'days'}</p>
            </div>
            
            {sub.lastPaymentDate && (
              <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                <div className="flex items-center gap-3 mb-2">
                  <TrendingUp className="w-5 h-5 text-gray-400" />
                  <span className="text-sm font-medium text-gray-500">Last Payment</span>
                </div>
                <p className="text-xl font-bold text-gray-900">
                  {settings.currency}{sub.lastPaymentAmount?.toLocaleString() || '0'}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {new Date(sub.lastPaymentDate).toLocaleDateString()}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Lock Screen */}
      {isLocked && (
        <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-3xl shadow-lg border-2 border-red-200 p-8 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 rounded-full mb-6">
            <Lock className="w-10 h-10 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('accountLocked')}</h2>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Your subscription has expired. To continue using ShopOS, please select a plan and complete your payment.
          </p>
        </div>
      )}
      
      {/* Payment Plans */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Monthly Plan */}
        <div 
          className={`bg-white rounded-3xl shadow-lg border-2 p-8 cursor-pointer transition-all ${
            selectedPlan === 'monthly' 
              ? 'border-green-500 ring-4 ring-green-100' 
              : 'border-gray-200 hover:border-gray-300'
          }`}
          onClick={() => setSelectedPlan('monthly')}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-900">{t('monthlyPlan')}</h3>
            {selectedPlan === 'monthly' && (
              <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4 text-white" />
              </div>
            )}
          </div>
          <div className="mb-6">
            <span className="text-4xl font-extrabold text-gray-900">{settings.currency}5,000</span>
            <span className="text-gray-500">/month</span>
          </div>
          <ul className="space-y-2 mb-6">
            <li className="flex items-center gap-2 text-gray-600">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <span>All features included</span>
            </li>
            <li className="flex items-center gap-2 text-gray-600">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <span>Cancel anytime</span>
            </li>
            <li className="flex items-center gap-2 text-gray-600">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <span>Priority support</span>
            </li>
          </ul>
        </div>
        
        {/* Yearly Plan */}
        <div 
          className={`bg-gradient-to-br from-green-50 to-emerald-50 rounded-3xl shadow-lg border-2 p-8 cursor-pointer transition-all relative ${
            selectedPlan === 'yearly' 
              ? 'border-green-500 ring-4 ring-green-100' 
              : 'border-green-200 hover:border-green-300'
          }`}
          onClick={() => setSelectedPlan('yearly')}
        >
          <div className="absolute top-4 right-4 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full">
            BEST VALUE
          </div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-900">{t('yearlyPlan')}</h3>
            {selectedPlan === 'yearly' && (
              <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4 text-white" />
              </div>
            )}
          </div>
          <div className="mb-2">
            <span className="text-4xl font-extrabold text-gray-900">{settings.currency}48,000</span>
            <span className="text-gray-500">/year</span>
          </div>
          <p className="text-sm text-green-600 font-bold mb-6">Save 20% - Only {settings.currency}4,000/month</p>
          <ul className="space-y-2 mb-6">
            <li className="flex items-center gap-2 text-gray-700">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              <span>All monthly features</span>
            </li>
            <li className="flex items-center gap-2 text-gray-700">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              <span>Save {settings.currency}12,000 per year</span>
            </li>
            <li className="flex items-center gap-2 text-gray-700">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              <span>Best for growing businesses</span>
            </li>
          </ul>
        </div>
      </div>
      
      {/* Coupon Section */}
      <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-8">
        <div className="flex items-center gap-3 mb-4">
          <Tag className="w-6 h-6 text-gray-600" />
          <h3 className="text-xl font-bold text-gray-900">Have a coupon code?</h3>
        </div>

        {!appliedCoupon ? (
          <div className="flex gap-3">
            <input
              type="text"
              value={couponCode}
              onChange={(e) => {
                setCouponCode(e.target.value.toUpperCase());
                setCouponError('');
              }}
              placeholder="Enter coupon code"
              className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent uppercase"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleApplyCoupon();
                }
              }}
            />
            <button
              onClick={handleApplyCoupon}
              disabled={applyingCoupon || !couponCode.trim()}
              className="px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all font-medium"
            >
              {applyingCoupon ? 'Applying...' : 'Apply'}
            </button>
          </div>
        ) : (
          <div className="p-4 bg-green-50 border border-green-200 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <div>
                <p className="font-semibold text-green-900">Coupon Applied: {appliedCoupon.code}</p>
                <p className="text-sm text-green-700">
                  {appliedCoupon.discountType === 'percentage'
                    ? `${appliedCoupon.discountValue}% off`
                    : `₦${appliedCoupon.discountValue.toLocaleString()} off`}
                  {' '}• You save {settings.currency}{discountAmount.toLocaleString()}
                </p>
              </div>
            </div>
            <button
              onClick={handleRemoveCoupon}
              className="text-green-700 hover:text-green-900 transition-colors"
              title="Remove coupon"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {couponError && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-red-600 text-sm">{couponError}</p>
          </div>
        )}

        {couponSuccess && (
          <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-xl">
            <p className="text-green-600 text-sm">{couponSuccess}</p>
          </div>
        )}
      </div>
      
      {/* Payment Button */}
      <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-red-600 text-sm font-medium">{error}</p>
          </div>
        )}
        
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600">Subtotal:</span>
            {appliedCoupon && discountAmount > 0 ? (
              <span className="text-gray-400 line-through">{settings.currency}{originalAmount.toLocaleString()}</span>
            ) : (
              <span className="font-semibold text-gray-900">{settings.currency}{originalAmount.toLocaleString()}</span>
            )}
          </div>
          {appliedCoupon && discountAmount > 0 && (
            <div className="flex items-center justify-between mb-2">
              <span className="text-green-600">Discount ({appliedCoupon.code}):</span>
              <span className="font-semibold text-green-600">-{settings.currency}{discountAmount.toLocaleString()}</span>
            </div>
          )}
          <div className="flex items-center justify-between pt-3 border-t border-gray-200">
            <span className="text-lg font-bold text-gray-900">Total:</span>
            <span className={`text-2xl font-bold ${finalAmount === 0 ? 'text-green-600' : 'text-gray-900'}`}>
              {finalAmount === 0 ? 'FREE' : `${settings.currency}${finalAmount.toLocaleString()}`}
            </span>
          </div>
        </div>

        <button
          onClick={handlePayment}
          disabled={processing}
          className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-bold py-4 px-6 rounded-xl flex items-center justify-center gap-3 transition-all shadow-lg shadow-green-200 hover:shadow-xl disabled:shadow-none"
        >
          {processing ? (
            <>
              <Loader className="w-5 h-5 animate-spin" />
              <span>{finalAmount === 0 ? 'Activating...' : t('processingPayment')}</span>
            </>
          ) : (
            <>
              {finalAmount === 0 ? (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Activate Free Subscription</span>
                </>
              ) : (
                <>
                  <CreditCard className="w-5 h-5" />
                  <span>
                    {isLocked ? t('unlockAccount') : t('makePayment')} - {settings.currency}{finalAmount.toLocaleString()}
                  </span>
                </>
              )}
            </>
          )}
        </button>
        
        <p className="text-xs text-gray-500 text-center mt-4">
          Secure payment powered by Paystack. Your payment information is encrypted and secure.
        </p>
      </div>
      
      {/* Payment History */}
      {payments && payments.length > 0 && (
        <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-8">
          <div className="flex items-center gap-3 mb-6">
            <History className="w-6 h-6 text-gray-600" />
            <h2 className="text-2xl font-bold text-gray-900">Payment History</h2>
          </div>
          
          <div className="space-y-3">
            {getShopPayments(payments, sub.shopId).map((payment) => (
              <div
                key={payment.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="font-semibold text-gray-900 capitalize">{payment.plan} Plan</span>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        payment.status === 'completed'
                          ? 'bg-green-100 text-green-700'
                          : payment.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-700'
                          : payment.status === 'failed'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {payment.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">
                    {new Date(payment.paymentDate).toLocaleDateString()} • Ref: {payment.paymentReference}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">
                    {settings.currency}{payment.amount.toLocaleString()}
                  </p>
                  {payment.verifiedAt && (
                    <p className="text-xs text-gray-500">Verified</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};


