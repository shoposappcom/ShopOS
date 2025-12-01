import { Subscription, SubscriptionPlan, SubscriptionStatus } from '../types';
import { getTrialDays, isTrialEnabled } from './trialConfig';
import { generateUUID } from './supabase/client';

const MONTHLY_PRICE = 5000;
const YEARLY_PRICE = 48000;

export const createTrialSubscription = (shopId: string): Subscription => {
  const now = new Date().toISOString();
  const trialEnabled = isTrialEnabled();
  
  // If trial is disabled, create a locked subscription (expired)
  if (!trialEnabled) {
    const subscription: Subscription = {
      id: generateUUID(),
      shopId,
      plan: 'monthly',
      status: 'expired', // Locked, needs payment
      trialStartDate: now,
      trialEndDate: now, // Already expired
      createdAt: now,
      updatedAt: now,
      lastVerifiedAt: now,
      verificationChecksum: generateVerificationChecksum({
        shopId,
        trialStartDate: now,
        trialEndDate: now
      })
    };
    
    return subscription;
  }
  
  // Create trial subscription with configurable days
  const trialDays = getTrialDays();
  const trialEndDate = new Date();
  trialEndDate.setDate(trialEndDate.getDate() + trialDays);
  
  const subscription: Subscription = {
    id: generateUUID(),
    shopId,
    plan: 'monthly',
    status: 'trial',
    trialStartDate: now,
    trialEndDate: trialEndDate.toISOString(),
    createdAt: now,
    updatedAt: now,
    lastVerifiedAt: now,
    verificationChecksum: generateVerificationChecksum({
      shopId,
      trialStartDate: now,
      trialEndDate: trialEndDate.toISOString()
    })
  };
  
  return subscription;
};

export const checkSubscriptionStatus = (subscription: Subscription): SubscriptionStatus => {
  const now = new Date();
  const trialEnd = new Date(subscription.trialEndDate);
  const subscriptionEnd = subscription.subscriptionEndDate ? new Date(subscription.subscriptionEndDate) : null;
  
  // Priority 1: If subscription is cancelled, return cancelled (highest priority)
  if (subscription.status === 'cancelled') {
    return 'cancelled';
  }
  
  // Priority 2: Check if there's an active PAID subscription (this takes precedence over trial)
  // This is the key fix - check paid subscription BEFORE checking trial status
  if (subscriptionEnd && now <= subscriptionEnd) {
    return 'active';
  }
  
  // Priority 3: If paid subscription has ended, it's expired (regardless of trial)
  if (subscriptionEnd && now > subscriptionEnd) {
    return 'expired';
  }
  
  // Priority 4: Check trial status (only if no paid subscription exists)
  if (now <= trialEnd && subscription.status === 'trial') {
    return 'trial';
  }
  
  // Priority 5: Trial ended and no paid subscription exists
  if (now > trialEnd && !subscriptionEnd) {
    return 'expired';
  }
  
  // Fallback to stored status
  return subscription.status;
};

export const isSubscriptionActive = (subscription: Subscription | null): boolean => {
  if (!subscription) return false;
  
  const status = checkSubscriptionStatus(subscription);
  return status === 'trial' || status === 'active';
};

export const extendSubscription = (
  subscription: Subscription,
  plan: SubscriptionPlan,
  paymentReference: string,
  paymentAmount: number
): Subscription => {
  const now = new Date();
  const nowISO = now.toISOString();
  
  // Determine the start date for the new subscription period
  let subscriptionStartDate: Date;
  let subscriptionEndDate: Date;
  
  // Check if subscription is currently active (has an end date in the future)
  const currentEndDate = subscription.subscriptionEndDate ? new Date(subscription.subscriptionEndDate) : null;
  const isCurrentlyActive = currentEndDate && currentEndDate > now;
  
  if (isCurrentlyActive && currentEndDate) {
    // Early renewal: extend from current end date
    console.log('🔄 Early renewal detected - extending from current end date:', currentEndDate.toISOString());
    subscriptionStartDate = subscription.subscriptionStartDate ? new Date(subscription.subscriptionStartDate) : now;
    subscriptionEndDate = new Date(currentEndDate);
  } else {
    // Expired or first-time payment: start from now
    console.log('🆕 New/Expired subscription - starting from now');
    subscriptionStartDate = now;
    subscriptionEndDate = new Date(now);
  }
  
  // Add the appropriate duration based on plan
  if (plan === 'monthly') {
    subscriptionEndDate.setMonth(subscriptionEndDate.getMonth() + 1);
    console.log('📅 Monthly plan: +1 month');
  } else {
    subscriptionEndDate.setFullYear(subscriptionEndDate.getFullYear() + 1);
    console.log('📅 Yearly plan: +1 year');
  }
  
  const endDateISO = subscriptionEndDate.toISOString();
  const startDateISO = subscriptionStartDate.toISOString();
  
  console.log('✅ Subscription extended:');
  console.log('   Start:', startDateISO);
  console.log('   End:', endDateISO);
  console.log('   Plan:', plan);
  console.log('   Reference:', paymentReference);
  
  const updated: Subscription = {
    ...subscription,
    plan,
    status: 'active',
    subscriptionStartDate: startDateISO,
    subscriptionEndDate: endDateISO,
    lastPaymentDate: nowISO,
    lastPaymentAmount: paymentAmount,
    paymentReference,
    updatedAt: nowISO,
    lastVerifiedAt: nowISO,
    verificationChecksum: generateVerificationChecksum({
      shopId: subscription.shopId,
      trialStartDate: subscription.trialStartDate,
      trialEndDate: subscription.trialEndDate,
      subscriptionEndDate: endDateISO,
      paymentReference
    })
  };
  
  return updated;
};

export const getDaysRemaining = (subscription: Subscription | null): number => {
  if (!subscription) return 0;
  
  const now = new Date();
  const status = checkSubscriptionStatus(subscription);
  
  if (status === 'trial') {
    const trialEnd = new Date(subscription.trialEndDate);
    const diff = trialEnd.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }
  
  if (status === 'active' && subscription.subscriptionEndDate) {
    const subEnd = new Date(subscription.subscriptionEndDate);
    const diff = subEnd.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }
  
  return 0;
};

export const generateVerificationChecksum = (data: Record<string, any>): string => {
  const str = JSON.stringify(data);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
};

export const verifySubscriptionIntegrity = (subscription: Subscription): boolean => {
  // Verify checksum
  const expectedChecksum = generateVerificationChecksum({
    shopId: subscription.shopId,
    trialStartDate: subscription.trialStartDate,
    trialEndDate: subscription.trialEndDate,
    subscriptionEndDate: subscription.subscriptionEndDate || '',
    paymentReference: subscription.paymentReference || ''
  });
  
  if (subscription.verificationChecksum && subscription.verificationChecksum !== expectedChecksum) {
    return false;
  }
  
  // Verify date consistency
  const trialStart = new Date(subscription.trialStartDate);
  const trialEnd = new Date(subscription.trialEndDate);
  
  if (trialEnd <= trialStart) {
    return false;
  }
  
  // Verify trial days are within reasonable range (0-365)
  const trialDays = (trialEnd.getTime() - trialStart.getTime()) / (1000 * 60 * 60 * 24);
  if (trialDays < 0 || trialDays > 365) {
    return false;
  }
  
  // If trial is disabled and subscription is expired, that's valid
  if (!isTrialEnabled() && subscription.status === 'expired' && trialDays === 0) {
    return true;
  }
  
  return true;
};

export const getSubscriptionPrice = (plan: SubscriptionPlan): number => {
  return plan === 'monthly' ? MONTHLY_PRICE : YEARLY_PRICE;
};

