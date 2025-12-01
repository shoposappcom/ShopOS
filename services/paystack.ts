// Paystack payment integration
// Note: Paystack public key is stored in admin settings, with fallback to environment variables

import { getPaystackPublicKey, getPaystackSecretKey, getAdminConfig } from './adminStorage';

declare global {
  interface Window {
    PaystackPop?: {
      setup: (options: PaystackOptions) => { openIframe: () => void };
    };
  }
}

interface PaystackOptions {
  key: string;
  email: string;
  amount: number; // Amount in kobo (lowest currency unit)
  currency?: string;
  ref: string;
  metadata?: Record<string, any>;
  callback: (response: PaystackResponse) => void;
  onClose: () => void;
}

interface PaystackResponse {
  reference: string;
  status: string;
  message: string;
  transaction?: string;
}

// Load Paystack inline script
export const loadPaystackScript = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (window.PaystackPop) {
      resolve();
      return;
    }
    
    const script = document.createElement('script');
    script.src = 'https://js.paystack.co/v1/inline.js';
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Paystack script'));
    document.head.appendChild(script);
  });
};

export const initializePayment = async (
  email: string,
  amount: number, // Amount in Naira
  reference: string,
  onSuccess: (reference: string) => void,
  onClose: () => void
): Promise<void> => {
  // Load Paystack script if not already loaded
  await loadPaystackScript();
  
  if (!window.PaystackPop) {
    throw new Error('Paystack script failed to load');
  }
  
  // Get Paystack public key from admin storage, fallback to environment variable for backwards compatibility
  const adminPublicKey = getPaystackPublicKey();
  const envPublicKey = process.env.PAYSTACK_PUBLIC_KEY;
  const PAYSTACK_PUBLIC_KEY = adminPublicKey || envPublicKey;
  
  if (!PAYSTACK_PUBLIC_KEY) {
    throw new Error('Paystack public key is not configured. Please configure it in the admin settings.');
  }
  
  const handler = window.PaystackPop.setup({
    key: PAYSTACK_PUBLIC_KEY,
    email,
    amount: amount * 100, // Convert Naira to kobo
    currency: 'NGN',
    ref: reference,
    metadata: {
      custom_fields: [
        {
          display_name: 'ShopOS Subscription',
          variable_name: 'subscription',
          value: 'payment'
        }
      ]
    },
    callback: (response: PaystackResponse) => {
      if (response.status === 'success') {
        onSuccess(response.reference);
      } else {
        console.error('Payment failed:', response.message);
        alert('Payment failed: ' + response.message);
      }
    },
    onClose: () => {
      onClose();
    }
  });
  
  handler.openIframe();
};

export const generatePaymentReference = (shopId: string): string => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 9).toUpperCase();
  return `SHOPOS_${shopId.substring(0, 8)}_${timestamp}_${random}`;
};

export interface PaymentVerification {
  reference: string;
  status: 'success' | 'failed' | 'pending';
  verifiedAt: string;
  amount?: number;
  currency?: string;
  customer?: {
    email: string;
  };
  metadata?: Record<string, any>;
}

// Store payment verifications in localStorage for tracking
const PAYMENT_VERIFICATIONS_KEY = 'shopos_payment_verifications';

// Payment verifications are now stored in Supabase (payment_verifications table)
// localStorage is only used as a cache/fallback
const getPaymentVerifications = (): Record<string, PaymentVerification> => {
  const stored = localStorage.getItem(PAYMENT_VERIFICATIONS_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return {};
    }
  }
  return {};
};

const savePaymentVerification = (reference: string, verification: PaymentVerification): void => {
  // Cache in localStorage for quick access
  const verifications = getPaymentVerifications();
  verifications[reference] = verification;
  localStorage.setItem(PAYMENT_VERIFICATIONS_KEY, JSON.stringify(verifications));
  
  // Note: Actual persistence is handled by createPaymentVerificationDb in StoreContext
  // This localStorage is just a cache
};

/**
 * Verify payment with Paystack API (Server-side verification)
 * This is the SECURE way to verify payments - calls Paystack API directly
 */
export const verifyPaymentWithPaystackAPI = async (
  reference: string,
  expectedAmount?: number
): Promise<{
  verified: boolean;
  verification?: PaymentVerification;
  error?: string;
}> => {
  try {
    // Get Paystack secret key from admin config
    const secretKey = getPaystackSecretKey();
    
    if (!secretKey) {
      console.error('❌ Paystack secret key not configured');
      return {
        verified: false,
        error: 'Paystack secret key not configured. Please configure it in admin settings.'
      };
    }
    
    // Paystack reference format check
    const paystackRefPattern = /^[a-zA-Z0-9_-]+$/;
    if (!paystackRefPattern.test(reference)) {
      return {
        verified: false,
        error: 'Invalid payment reference format'
      };
    }
    
    // Call Paystack API to verify payment
    const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${secretKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ Paystack API error:', errorData);
      return {
        verified: false,
        error: errorData.message || `Paystack API error: ${response.status}`
      };
    }
    
    const data = await response.json();
    
    // Check if payment was successful
    if (data.status && data.data) {
      const transaction = data.data;
      
      // Verify payment status
      const isSuccessful = transaction.status === 'success' && transaction.gateway_response === 'Successful';
      
      // Verify amount if provided
      if (expectedAmount !== undefined) {
        const paidAmount = transaction.amount / 100; // Convert from kobo to Naira
        if (Math.abs(paidAmount - expectedAmount) > 0.01) {
          console.error('❌ Amount mismatch:', { expected: expectedAmount, paid: paidAmount });
          return {
            verified: false,
            error: `Amount mismatch: Expected ₦${expectedAmount}, but paid ₦${paidAmount}`
          };
        }
      }
      
      const verification: PaymentVerification = {
        reference: transaction.reference,
        status: isSuccessful ? 'success' : 'failed',
        verifiedAt: new Date().toISOString(),
        amount: transaction.amount / 100, // Convert from kobo to Naira
        currency: transaction.currency || 'NGN',
        customer: transaction.customer ? {
          email: transaction.customer.email || ''
        } : undefined,
        metadata: transaction.metadata || {}
      };
      
      // Store verification
      savePaymentVerification(reference, verification);
      
      console.log(`✅ Payment verified via Paystack API: ${isSuccessful ? 'SUCCESS' : 'FAILED'}`);
      
      return {
        verified: isSuccessful,
        verification
      };
    }
    
    return {
      verified: false,
      error: 'Invalid response from Paystack API'
    };
  } catch (error: any) {
    console.error('❌ Error verifying payment with Paystack API:', error);
    return {
      verified: false,
      error: error.message || 'Failed to verify payment with Paystack API'
    };
  }
};

/**
 * Verify payment (checks cache first, then calls Paystack API)
 * This is the main function to use for payment verification
 */
export const verifyPayment = async (
  reference: string,
  expectedAmount?: number,
  forceReverify: boolean = false
): Promise<{
  verified: boolean;
  verification?: PaymentVerification;
  error?: string;
}> => {
  // Check cache first (unless force re-verify)
  if (!forceReverify) {
    const verifications = getPaymentVerifications();
    const existing = verifications[reference];
    
    // If we have a successful verification, return it
    if (existing && existing.status === 'success') {
      return {
        verified: true,
        verification: existing
      };
    }
    
    // If we have a failed verification, return it
    if (existing && existing.status === 'failed') {
      return {
        verified: false,
        verification: existing
      };
    }
  }
  
  // Verify with Paystack API
  return await verifyPaymentWithPaystackAPI(reference, expectedAmount);
};

export const markPaymentAsVerified = (
  reference: string,
  status: 'success' | 'failed',
  details?: {
    amount?: number;
    currency?: string;
    customer?: { email: string };
    metadata?: Record<string, any>;
  }
): void => {
  const verification: PaymentVerification = {
    reference,
    status,
    verifiedAt: new Date().toISOString(),
    ...details
  };
  
  savePaymentVerification(reference, verification);
};

export const getPaymentVerification = (reference: string): PaymentVerification | undefined => {
  const verifications = getPaymentVerifications();
  return verifications[reference];
};

