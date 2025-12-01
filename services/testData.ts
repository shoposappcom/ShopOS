/**
 * Test Data Service
 * Creates test accounts with populated data for demo purposes
 */

import { generateUUID } from './supabase/client';
import { 
  User, Product, Category, Supplier, Customer, Sale, 
  StockMovement, Expense, GiftCard, ShopSettings, Subscription 
} from '../types';
import { createTrialSubscription } from './subscription';

const TEST_SHOP_ID = '00000000-0000-0000-0000-000000000001';
const TEST_SHOP_NAME = 'Demo Shop - Test Account';

export interface TestAccount {
  username: string;
  password: string;
  role: 'superadmin' | 'manager' | 'cashier' | 'stock_clerk';
  fullName: string;
  email: string;
}

export const TEST_ACCOUNTS: TestAccount[] = [
  {
    username: 'admin',
    password: 'password123',
    role: 'superadmin',
    fullName: 'Admin User',
    email: 'admin@test.shopos.com'
  },
  {
    username: 'manager',
    password: 'password123',
    role: 'manager',
    fullName: 'Manager User',
    email: 'manager@test.shopos.com'
  },
  {
    username: 'cashier',
    password: 'password123',
    role: 'cashier',
    fullName: 'Cashier User',
    email: 'cashier@test.shopos.com'
  },
  {
    username: 'stock',
    password: 'password123',
    role: 'stock_clerk',
    fullName: 'Stock Clerk User',
    email: 'stock@test.shopos.com'
  }
];

/**
 * Create test shop settings
 */
export const createTestShopSettings = (): ShopSettings => {
  const now = new Date().toISOString();
  return {
    shopId: TEST_SHOP_ID,
    businessName: TEST_SHOP_NAME,
    country: 'Nigeria',
    state: 'Lagos',
    phone: '+234 800 000 0000',
    address: '123 Demo Street, Lagos',
    currency: '₦',
    receiptFooter: 'This is a TEST ACCOUNT - Demo purposes only',
    taxRate: 7.5,
    autoBackup: 'off',
    createdAt: now,
    updatedAt: now
  };
};

/**
 * Create test users
 */
export const createTestUsers = (): User[] => {
  const now = new Date().toISOString();
  return TEST_ACCOUNTS.map(account => ({
    id: generateUUID(),
    shopId: TEST_SHOP_ID,
    username: account.username,
    password: account.password,
    fullName: account.fullName,
    email: account.email,
    role: account.role,
    status: 'active',
    language: 'en',
    createdAt: now,
    lastLogin: now
  }));
};

/**
 * Create test categories
 */
export const createTestCategories = (): Category[] => {
  const now = new Date().toISOString();
  return [
    { id: generateUUID(), shopId: TEST_SHOP_ID, name: 'Beverages', createdAt: now },
    { id: generateUUID(), shopId: TEST_SHOP_ID, name: 'Snacks', createdAt: now },
    { id: generateUUID(), shopId: TEST_SHOP_ID, name: 'Dairy', createdAt: now },
    { id: generateUUID(), shopId: TEST_SHOP_ID, name: 'Bakery', createdAt: now },
    { id: generateUUID(), shopId: TEST_SHOP_ID, name: 'Frozen Foods', createdAt: now },
    { id: generateUUID(), shopId: TEST_SHOP_ID, name: 'Household', createdAt: now }
  ];
};

/**
 * Create test suppliers
 */
export const createTestSuppliers = (): Supplier[] => {
  const now = new Date().toISOString();
  return [
    {
      id: generateUUID(),
      shopId: TEST_SHOP_ID,
      name: 'ABC Distributors',
      contactPerson: 'John Doe',
      phone: '+234 801 111 1111',
      email: 'contact@abcdist.com',
      address: '123 Supplier St, Lagos',
      createdAt: now
    },
    {
      id: generateUUID(),
      shopId: TEST_SHOP_ID,
      name: 'XYZ Wholesale',
      contactPerson: 'Jane Smith',
      phone: '+234 802 222 2222',
      email: 'info@xyzwho.com',
      address: '456 Wholesale Ave, Abuja',
      createdAt: now
    }
  ];
};

/**
 * Create test products
 */
export const createTestProducts = (categories: Category[], suppliers: Supplier[]): Product[] => {
  const now = new Date().toISOString();
  const beverages = categories.find(c => c.name === 'Beverages')!;
  const snacks = categories.find(c => c.name === 'Snacks')!;
  const dairy = categories.find(c => c.name === 'Dairy')!;
  const bakery = categories.find(c => c.name === 'Bakery')!;
  
  return [
    {
      id: generateUUID(),
      shopId: TEST_SHOP_ID,
      name: 'Coca Cola 50cl',
      categoryId: beverages.id,
      barcode: 'TEST001',
      unitPrice: 150,
      cartonPrice: 3600,
      costPriceUnit: 120,
      costPriceCarton: 2880,
      unitsPerCarton: 24,
      totalUnits: 120,
      minStockLevel: 48,
      supplierId: suppliers[0].id,
      image: '',
      translations: {},
      createdAt: now,
      updatedAt: now
    },
    {
      id: generateUUID(),
      shopId: TEST_SHOP_ID,
      name: 'Peak Milk 170g',
      categoryId: dairy.id,
      barcode: 'TEST002',
      unitPrice: 250,
      cartonPrice: 6000,
      costPriceUnit: 200,
      costPriceCarton: 4800,
      unitsPerCarton: 24,
      totalUnits: 96,
      minStockLevel: 48,
      supplierId: suppliers[0].id,
      image: '',
      translations: {},
      createdAt: now,
      updatedAt: now
    },
    {
      id: generateUUID(),
      shopId: TEST_SHOP_ID,
      name: 'Indomie Noodles',
      categoryId: snacks.id,
      barcode: 'TEST003',
      unitPrice: 100,
      cartonPrice: 2400,
      costPriceUnit: 80,
      costPriceCarton: 1920,
      unitsPerCarton: 24,
      totalUnits: 144,
      minStockLevel: 48,
      supplierId: suppliers[1].id,
      image: '',
      translations: {},
      createdAt: now,
      updatedAt: now
    },
    {
      id: generateUUID(),
      shopId: TEST_SHOP_ID,
      name: 'Bread (Sliced)',
      categoryId: bakery.id,
      barcode: 'TEST004',
      unitPrice: 500,
      cartonPrice: 0,
      costPriceUnit: 400,
      costPriceCarton: 0,
      unitsPerCarton: 1,
      totalUnits: 30,
      minStockLevel: 10,
      supplierId: suppliers[1].id,
      image: '',
      translations: {},
      createdAt: now,
      updatedAt: now
    },
    {
      id: generateUUID(),
      shopId: TEST_SHOP_ID,
      name: 'Fanta Orange 50cl',
      categoryId: beverages.id,
      barcode: 'TEST005',
      unitPrice: 150,
      cartonPrice: 3600,
      costPriceUnit: 120,
      costPriceCarton: 2880,
      unitsPerCarton: 24,
      totalUnits: 72,
      minStockLevel: 48,
      supplierId: suppliers[0].id,
      image: '',
      translations: {},
      createdAt: now,
      updatedAt: now
    }
  ];
};

/**
 * Create test customers
 */
export const createTestCustomers = (): Customer[] => {
  const now = new Date().toISOString();
  return [
    {
      id: generateUUID(),
      shopId: TEST_SHOP_ID,
      name: 'John Customer',
      phone: '+234 803 333 3333',
      email: 'john@customer.com',
      address: '789 Customer Rd, Lagos',
      totalDebt: 0,
      createdAt: now,
      updatedAt: now
    },
    {
      id: generateUUID(),
      shopId: TEST_SHOP_ID,
      name: 'Mary Buyer',
      phone: '+234 804 444 4444',
      email: 'mary@buyer.com',
      address: '321 Buyer St, Abuja',
      totalDebt: 5000,
      createdAt: now,
      updatedAt: now
    },
    {
      id: generateUUID(),
      shopId: TEST_SHOP_ID,
      name: 'Peter Shopper',
      phone: '+234 805 555 5555',
      email: 'peter@shopper.com',
      address: '654 Shopper Ave, Port Harcourt',
      totalDebt: 0,
      createdAt: now,
      updatedAt: now
    }
  ];
};

/**
 * Create test sales
 */
export const createTestSales = (
  products: Product[], 
  customers: Customer[], 
  users: User[]
): Sale[] => {
  const now = new Date();
  const sales: Sale[] = [];
  
  // Create sales for the last 7 days
  for (let i = 0; i < 7; i++) {
    const saleDate = new Date(now);
    saleDate.setDate(saleDate.getDate() - i);
    
    // Create 2-5 sales per day
    const salesPerDay = Math.floor(Math.random() * 4) + 2;
    
    for (let j = 0; j < salesPerDay; j++) {
      const product = products[Math.floor(Math.random() * products.length)];
      const customer = Math.random() > 0.7 ? customers[Math.floor(Math.random() * customers.length)] : null;
      const cashier = users.find(u => u.role === 'cashier') || users[0];
      const quantity = Math.floor(Math.random() * 5) + 1;
      const total = product.unitPrice * quantity;
      
      sales.push({
        id: generateUUID(),
        shopId: TEST_SHOP_ID,
        date: saleDate.toISOString(),
        items: [{
          productId: product.id,
          productName: product.name,
          quantity,
          unitPrice: product.unitPrice,
          total
        }],
        total,
        paymentMethod: Math.random() > 0.5 ? 'cash' : 'transfer',
        customerId: customer?.id,
        cashierId: cashier.id,
        profit: (product.unitPrice - product.costPriceUnit) * quantity,
        createdAt: saleDate.toISOString()
      });
    }
  }
  
  return sales.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

/**
 * Create test stock movements
 */
export const createTestStockMovements = (
  products: Product[],
  users: User[]
): StockMovement[] => {
  const now = new Date();
  const movements: StockMovement[] = [];
  
  products.forEach(product => {
    // Initial restock
    movements.push({
      id: generateUUID(),
      shopId: TEST_SHOP_ID,
      productId: product.id,
      type: 'restock',
      quantityChange: product.totalUnits,
      quantityType: 'unit',
      balanceAfter: product.totalUnits,
      userId: users[0].id,
      note: 'Initial stock',
      createdAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
    });
  });
  
  return movements;
};

/**
 * Create test expenses
 */
export const createTestExpenses = (users: User[]): Expense[] => {
  const now = new Date();
  const expenses: Expense[] = [];
  const categories = ['Rent', 'Utilities', 'Transport', 'Marketing', 'Other'];
  
  // Create expenses for the last 30 days
  for (let i = 0; i < 30; i++) {
    if (Math.random() > 0.7) { // 30% chance of expense per day
      const expenseDate = new Date(now);
      expenseDate.setDate(expenseDate.getDate() - i);
      
      expenses.push({
        id: generateUUID(),
        shopId: TEST_SHOP_ID,
        description: `${categories[Math.floor(Math.random() * categories.length)]} - ${expenseDate.toLocaleDateString()}`,
        amount: Math.floor(Math.random() * 5000) + 1000,
        category: categories[Math.floor(Math.random() * categories.length)],
        date: expenseDate.toISOString(),
        recordedByUserId: users[0].id,
        isArchived: false,
        createdAt: expenseDate.toISOString()
      });
    }
  }
  
  return expenses;
};

/**
 * Create test subscription with extended trial (1 year for test accounts)
 */
export const createTestSubscription = (): Subscription => {
  const now = new Date();
  const trialEnd = new Date(now);
  trialEnd.setFullYear(trialEnd.getFullYear() + 1); // 1 year trial for test accounts
  
  return {
    id: generateUUID(),
    shopId: TEST_SHOP_ID,
    plan: 'monthly',
    status: 'trial',
    trialStartDate: now.toISOString(),
    trialEndDate: trialEnd.toISOString(),
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    lastVerifiedAt: now.toISOString(),
    verificationChecksum: 'TEST_ACCOUNT'
  };
};

/**
 * Get test shop ID
 */
export const getTestShopId = (): string => {
  return TEST_SHOP_ID;
};

/**
 * Check if a shop ID is a test account
 */
export const isTestAccount = (shopId: string): boolean => {
  return shopId === TEST_SHOP_ID;
};

