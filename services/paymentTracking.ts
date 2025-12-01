import { PaymentRecord } from '../types';
import { generateUUID } from './supabase/client';

export const createPaymentRecord = (
  shopId: string,
  shopName: string,
  subscriptionId: string,
  plan: 'monthly' | 'yearly',
  amount: number,
  paymentReference: string,
  email: string,
  country: string,
  state: string,
  status: 'pending' | 'completed' | 'failed' | 'refunded' = 'pending',
  couponCode?: string,
  discountAmount?: number,
  originalAmount?: number
): PaymentRecord => {
  const now = new Date().toISOString();
  
  return {
    id: generateUUID(),
    shopId,
    shopName,
    subscriptionId,
    plan,
    amount,
    paymentReference,
    status,
    paymentDate: now,
    verifiedAt: status === 'completed' ? now : undefined,
    email,
    country,
    state,
    createdAt: now,
    couponCode,
    discountAmount,
    originalAmount
  };
};

export const updatePaymentRecordStatus = (
  paymentRecord: PaymentRecord,
  status: PaymentRecord['status'],
  notes?: string
): PaymentRecord => {
  return {
    ...paymentRecord,
    status,
    verifiedAt: status === 'completed' ? new Date().toISOString() : paymentRecord.verifiedAt,
    notes: notes || paymentRecord.notes
  };
};

export const verifyPaymentRecord = (paymentRecord: PaymentRecord): PaymentRecord => {
  // In production, this would call Paystack API to verify
  // For now, if status is pending and reference exists, mark as completed
  if (paymentRecord.status === 'pending' && paymentRecord.paymentReference) {
    return updatePaymentRecordStatus(paymentRecord, 'completed', 'Payment verified');
  }
  return paymentRecord;
};

export const getShopPayments = (payments: PaymentRecord[], shopId: string): PaymentRecord[] => {
  return payments.filter(p => p.shopId === shopId).sort((a, b) => 
    new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime()
  );
};

export const getAllPayments = (payments: PaymentRecord[]): PaymentRecord[] => {
  return [...payments].sort((a, b) => 
    new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime()
  );
};

export const getTotalRevenue = (payments: PaymentRecord[], filter?: {
  shopId?: string;
  startDate?: string;
  endDate?: string;
}): number => {
  let filtered = payments.filter(p => p.status === 'completed');
  
  if (filter?.shopId) {
    filtered = filtered.filter(p => p.shopId === filter.shopId);
  }
  
  if (filter?.startDate) {
    const start = new Date(filter.startDate).getTime();
    filtered = filtered.filter(p => new Date(p.paymentDate).getTime() >= start);
  }
  
  if (filter?.endDate) {
    const end = new Date(filter.endDate).getTime();
    filtered = filtered.filter(p => new Date(p.paymentDate).getTime() <= end);
  }
  
  return filtered.reduce((sum, p) => sum + p.amount, 0);
};

