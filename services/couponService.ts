import { Coupon, CouponUsage, SubscriptionPlan } from '../types';
import { 
  getAllCoupons, 
  addCoupon, 
  updateCouponInAdminData, 
  deleteCouponFromAdminData,
  addCouponUsage,
  getAllCouponUsages
} from './adminStorage';
import { generateUUID } from './supabase/client';

const MONTHLY_PRICE = 5000;
const YEARLY_PRICE = 48000;

// Generate a unique coupon code
export const generateCouponCode = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

// Validate coupon code format
export const isValidCouponCode = (code: string): boolean => {
  // Uppercase alphanumeric, 6-20 characters
  return /^[A-Z0-9]{6,20}$/.test(code.toUpperCase());
};

// Create a new coupon
export const createCoupon = (couponData: {
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  applicablePlans: SubscriptionPlan[];
  expirationDate?: string;
  maxUses?: number;
  description?: string;
  isActive?: boolean;
  createdBy: string;
}): Coupon => {
  const code = couponData.code.toUpperCase().trim();
  
  // Validate code format
  if (!isValidCouponCode(code)) {
    throw new Error('Coupon code must be 6-20 alphanumeric characters');
  }
  
  // Validate discount value
  if (couponData.discountType === 'percentage') {
    if (couponData.discountValue < 1 || couponData.discountValue > 100) {
      throw new Error('Percentage discount must be between 1% and 100%');
    }
  } else {
    if (couponData.discountValue < 100) {
      throw new Error('Fixed discount must be at least ₦100');
    }
  }
  
  // Validate applicable plans
  if (!couponData.applicablePlans || couponData.applicablePlans.length === 0) {
    throw new Error('At least one plan must be selected');
  }
  
  // Validate expiration date
  if (couponData.expirationDate) {
    const expiration = new Date(couponData.expirationDate);
    const now = new Date();
    if (expiration <= now) {
      throw new Error('Expiration date must be in the future');
    }
  }
  
  // Validate max uses
  if (couponData.maxUses !== undefined && couponData.maxUses < 1) {
    throw new Error('Max uses must be at least 1 if specified');
  }
  
  // Check for duplicate code
  const existingCoupons = getAllCoupons();
  const duplicate = existingCoupons.find(c => c.code.toUpperCase() === code);
  if (duplicate) {
    throw new Error('Coupon code already exists');
  }
  
  const now = new Date().toISOString();
  const coupon: Coupon = {
    id: generateUUID(),
    code,
    discountType: couponData.discountType,
    discountValue: couponData.discountValue,
    applicablePlans: couponData.applicablePlans,
    expirationDate: couponData.expirationDate,
    maxUses: couponData.maxUses,
    currentUses: 0,
    isActive: couponData.isActive !== undefined ? couponData.isActive : true,
    description: couponData.description,
    createdAt: now,
    updatedAt: now,
    createdBy: couponData.createdBy
  };
  
  addCoupon(coupon);
  return coupon;
};

// Get all coupons
export const getAllCouponsList = (): Coupon[] => {
  return getAllCoupons();
};

// Get coupon by code
export const getCouponByCode = (code: string): Coupon | undefined => {
  const coupons = getAllCoupons();
  return coupons.find(c => c.code.toUpperCase() === code.toUpperCase());
};

// Validate coupon eligibility
export const validateCoupon = (
  code: string, 
  plan: SubscriptionPlan
): { valid: boolean; error?: string; coupon?: Coupon } => {
  const coupon = getCouponByCode(code);
  
  if (!coupon) {
    return { valid: false, error: 'Invalid coupon code' };
  }
  
  if (!coupon.isActive) {
    return { valid: false, error: 'This coupon is not active' };
  }
  
  // Check expiration
  if (coupon.expirationDate) {
    const expiration = new Date(coupon.expirationDate);
    const now = new Date();
    if (expiration < now) {
      return { valid: false, error: 'This coupon has expired' };
    }
  }
  
  // Check usage limit
  if (coupon.maxUses !== undefined && coupon.currentUses >= coupon.maxUses) {
    return { valid: false, error: 'This coupon has reached its usage limit' };
  }
  
  // Check plan eligibility
  if (!coupon.applicablePlans.includes(plan)) {
    const validPlans = coupon.applicablePlans.join(' or ').toUpperCase();
    return { 
      valid: false, 
      error: `This coupon is only valid for ${validPlans} plans` 
    };
  }
  
  return { valid: true, coupon };
};

// Apply coupon to calculate discounted price
export const applyCoupon = (
  coupon: Coupon,
  plan: SubscriptionPlan,
  originalAmount: number
): { finalAmount: number; discountAmount: number } => {
  let discountAmount = 0;
  
  if (coupon.discountType === 'percentage') {
    discountAmount = Math.round((originalAmount * coupon.discountValue) / 100);
  } else {
    discountAmount = coupon.discountValue;
  }
  
  // Ensure discount doesn't exceed original amount
  discountAmount = Math.min(discountAmount, originalAmount);
  
  const finalAmount = Math.max(0, originalAmount - discountAmount);
  
  return { finalAmount, discountAmount };
};

// Record coupon usage
export const recordCouponUsage = (
  couponId: string,
  couponCode: string,
  shopId: string,
  shopName: string,
  paymentId: string,
  discountAmount: number
): void => {
  const usage: CouponUsage = {
    id: generateUUID(),
    couponId,
    couponCode,
    shopId,
    shopName,
    paymentId,
    discountAmount,
    usedAt: new Date().toISOString()
  };
  
  addCouponUsage(usage);
};

// Update coupon
export const updateCoupon = (couponId: string, updates: Partial<Coupon>): void => {
  // Validate updates if provided
  if (updates.code) {
    const code = updates.code.toUpperCase().trim();
    if (!isValidCouponCode(code)) {
      throw new Error('Coupon code must be 6-20 alphanumeric characters');
    }
  }
  
  if (updates.discountType && updates.discountValue !== undefined) {
    if (updates.discountType === 'percentage') {
      if (updates.discountValue < 1 || updates.discountValue > 100) {
        throw new Error('Percentage discount must be between 1% and 100%');
      }
    } else {
      if (updates.discountValue < 100) {
        throw new Error('Fixed discount must be at least ₦100');
      }
    }
  }
  
  if (updates.expirationDate) {
    const expiration = new Date(updates.expirationDate);
    const now = new Date();
    if (expiration <= now) {
      throw new Error('Expiration date must be in the future');
    }
  }
  
  updateCouponInAdminData(couponId, updates);
};

// Delete coupon
export const deleteCoupon = (couponId: string): void => {
  deleteCouponFromAdminData(couponId);
};

// Get coupon usage statistics
export const getCouponUsageStats = (couponId: string): {
  totalUses: number;
  totalDiscount: number;
} => {
  const usages = getAllCouponUsages();
  const couponUsages = usages.filter(u => u.couponId === couponId);
  
  const totalUses = couponUsages.length;
  const totalDiscount = couponUsages.reduce((sum, u) => sum + u.discountAmount, 0);
  
  return { totalUses, totalDiscount };
};

// Get subscription price (base price)
export const getSubscriptionPrice = (plan: SubscriptionPlan): number => {
  return plan === 'monthly' ? MONTHLY_PRICE : YEARLY_PRICE;
};

