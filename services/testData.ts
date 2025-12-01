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
 * Create test products with images
 */
export const createTestProducts = (categories: Category[], suppliers: Supplier[]): Product[] => {
  const now = new Date().toISOString();
  const beverages = categories.find(c => c.name === 'Beverages')!;
  const snacks = categories.find(c => c.name === 'Snacks')!;
  const dairy = categories.find(c => c.name === 'Dairy')!;
  const bakery = categories.find(c => c.name === 'Bakery')!;
  const frozen = categories.find(c => c.name === 'Frozen Foods')!;
  const household = categories.find(c => c.name === 'Household')!;
  
  // Product images from placeholder services
  const getImageUrl = (id: string) => `https://picsum.photos/seed/product${id}/400/400`;
  
  const products = [
    // Beverages
    { name: 'Coca Cola 50cl', cat: beverages, barcode: 'TEST001', unitPrice: 150, cartonPrice: 3600, costUnit: 120, costCarton: 2880, units: 24, stock: 240, min: 48, supplier: 0 },
    { name: 'Fanta Orange 50cl', cat: beverages, barcode: 'TEST002', unitPrice: 150, cartonPrice: 3600, costUnit: 120, costCarton: 2880, units: 24, stock: 192, min: 48, supplier: 0 },
    { name: 'Sprite 50cl', cat: beverages, barcode: 'TEST003', unitPrice: 150, cartonPrice: 3600, costUnit: 120, costCarton: 2880, units: 24, stock: 168, min: 48, supplier: 0 },
    { name: 'Pepsi 50cl', cat: beverages, barcode: 'TEST004', unitPrice: 150, cartonPrice: 3600, costUnit: 120, costCarton: 2880, units: 24, stock: 144, min: 48, supplier: 0 },
    { name: '7UP 50cl', cat: beverages, barcode: 'TEST005', unitPrice: 150, cartonPrice: 3600, costUnit: 120, costCarton: 2880, units: 24, stock: 120, min: 48, supplier: 0 },
    { name: 'Lucozade Boost 50cl', cat: beverages, barcode: 'TEST006', unitPrice: 250, cartonPrice: 6000, costUnit: 200, costCarton: 4800, units: 24, stock: 96, min: 48, supplier: 0 },
    { name: 'Ribena Blackcurrant 1L', cat: beverages, barcode: 'TEST007', unitPrice: 1200, cartonPrice: 14400, costUnit: 1000, costCarton: 12000, units: 12, stock: 84, min: 24, supplier: 1 },
    
    // Dairy
    { name: 'Peak Milk 170g', cat: dairy, barcode: 'TEST008', unitPrice: 250, cartonPrice: 6000, costUnit: 200, costCarton: 4800, units: 24, stock: 192, min: 48, supplier: 0 },
    { name: 'Carnation Milk 170g', cat: dairy, barcode: 'TEST009', unitPrice: 300, cartonPrice: 7200, costUnit: 240, costCarton: 5760, units: 24, stock: 168, min: 48, supplier: 0 },
    { name: 'Milo 900g', cat: dairy, barcode: 'TEST010', unitPrice: 2500, cartonPrice: 0, costUnit: 2000, costCarton: 0, units: 1, stock: 48, min: 12, supplier: 1 },
    { name: 'Ovaltine 900g', cat: dairy, barcode: 'TEST011', unitPrice: 2200, cartonPrice: 0, costUnit: 1800, costCarton: 0, units: 1, stock: 36, min: 12, supplier: 1 },
    { name: 'Butter 250g', cat: dairy, barcode: 'TEST012', unitPrice: 800, cartonPrice: 9600, costUnit: 650, costCarton: 7800, units: 12, stock: 60, min: 24, supplier: 0 },
    { name: 'Cheese Block 500g', cat: dairy, barcode: 'TEST013', unitPrice: 3500, cartonPrice: 42000, costUnit: 2800, costCarton: 33600, units: 12, stock: 48, min: 12, supplier: 0 },
    
    // Snacks
    { name: 'Indomie Noodles', cat: snacks, barcode: 'TEST014', unitPrice: 100, cartonPrice: 2400, costUnit: 80, costCarton: 1920, units: 24, stock: 288, min: 48, supplier: 1 },
    { name: 'Golden Morn 500g', cat: snacks, barcode: 'TEST015', unitPrice: 800, cartonPrice: 9600, costUnit: 650, costCarton: 7800, units: 12, stock: 96, min: 24, supplier: 1 },
    { name: 'Corn Flakes 500g', cat: snacks, barcode: 'TEST016', unitPrice: 1200, cartonPrice: 14400, costUnit: 1000, costCarton: 12000, units: 12, stock: 72, min: 24, supplier: 1 },
    { name: 'Biscuits Assorted', cat: snacks, barcode: 'TEST017', unitPrice: 150, cartonPrice: 3600, costUnit: 120, costCarton: 2880, units: 24, stock: 240, min: 48, supplier: 0 },
    { name: 'Groundnut 500g', cat: snacks, barcode: 'TEST018', unitPrice: 500, cartonPrice: 0, costUnit: 400, costCarton: 0, units: 1, stock: 120, min: 30, supplier: 1 },
    { name: 'Chips Assorted', cat: snacks, barcode: 'TEST019', unitPrice: 200, cartonPrice: 4800, costUnit: 160, costCarton: 3840, units: 24, stock: 192, min: 48, supplier: 0 },
    
    // Bakery
    { name: 'Bread (Sliced)', cat: bakery, barcode: 'TEST020', unitPrice: 500, cartonPrice: 0, costUnit: 400, costCarton: 0, units: 1, stock: 60, min: 10, supplier: 1 },
    { name: 'Sweet Bread', cat: bakery, barcode: 'TEST021', unitPrice: 600, cartonPrice: 0, costUnit: 480, costCarton: 0, units: 1, stock: 48, min: 10, supplier: 1 },
    { name: 'Meat Pie', cat: bakery, barcode: 'TEST022', unitPrice: 300, cartonPrice: 0, costUnit: 240, costCarton: 0, units: 1, stock: 72, min: 20, supplier: 1 },
    { name: 'Doughnut', cat: bakery, barcode: 'TEST023', unitPrice: 250, cartonPrice: 0, costUnit: 200, costCarton: 0, units: 1, stock: 96, min: 30, supplier: 1 },
    
    // Frozen Foods
    { name: 'Frozen Chicken 1kg', cat: frozen, barcode: 'TEST024', unitPrice: 2500, cartonPrice: 0, costUnit: 2000, costCarton: 0, units: 1, stock: 48, min: 10, supplier: 0 },
    { name: 'Frozen Fish 1kg', cat: frozen, barcode: 'TEST025', unitPrice: 3000, cartonPrice: 0, costUnit: 2400, costCarton: 0, units: 1, stock: 36, min: 10, supplier: 0 },
    { name: 'Ice Cream 1L', cat: frozen, barcode: 'TEST026', unitPrice: 1800, cartonPrice: 21600, costUnit: 1500, costCarton: 18000, units: 12, stock: 60, min: 12, supplier: 1 },
    
    // Household
    { name: 'Detergent 1kg', cat: household, barcode: 'TEST027', unitPrice: 800, cartonPrice: 9600, costUnit: 650, costCarton: 7800, units: 12, stock: 84, min: 24, supplier: 1 },
    { name: 'Bleach 1L', cat: household, barcode: 'TEST028', unitPrice: 600, cartonPrice: 7200, costUnit: 500, costCarton: 6000, units: 12, stock: 96, min: 24, supplier: 1 },
    { name: 'Toilet Paper 8 Rolls', cat: household, barcode: 'TEST029', unitPrice: 1200, cartonPrice: 14400, costUnit: 1000, costCarton: 12000, units: 12, stock: 72, min: 12, supplier: 1 },
    { name: 'Body Soap 3 Pack', cat: household, barcode: 'TEST030', unitPrice: 1500, cartonPrice: 18000, costUnit: 1200, costCarton: 14400, units: 12, stock: 60, min: 12, supplier: 0 },
  ];
  
  return products.map((p, index) => {
    const id = generateUUID();
    return {
      id,
      shopId: TEST_SHOP_ID,
      name: p.name,
      category: p.cat.name,
      categoryId: p.cat.id,
      barcode: p.barcode,
      unitPrice: p.unitPrice,
      cartonPrice: p.cartonPrice,
      costPriceUnit: p.costUnit,
      costPriceCarton: p.costCarton,
      unitsPerCarton: p.units,
      totalUnits: p.stock,
      stockCartons: Math.floor(p.stock / p.units),
      stockUnits: p.stock % p.units,
      minStockLevel: p.min,
      supplierId: suppliers[p.supplier].id,
      image: getImageUrl(p.barcode),
      translations: {},
      createdAt: now,
      updatedAt: now
    };
  });
};

/**
 * Create test customers with debtors
 */
export const createTestCustomers = (): Customer[] => {
  const now = new Date().toISOString();
  return [
    {
      id: generateUUID(),
      shopId: TEST_SHOP_ID,
      name: 'John Customer',
      phone: '+234 803 333 3333',
      totalDebt: 0,
      createdAt: now,
      updatedAt: now
    },
    {
      id: generateUUID(),
      shopId: TEST_SHOP_ID,
      name: 'Mary Buyer',
      phone: '+234 804 444 4444',
      totalDebt: 1250000, // ₦1.25M debt
      createdAt: now,
      updatedAt: now
    },
    {
      id: generateUUID(),
      shopId: TEST_SHOP_ID,
      name: 'Peter Shopper',
      phone: '+234 805 555 5555',
      totalDebt: 0,
      createdAt: now,
      updatedAt: now
    },
    {
      id: generateUUID(),
      shopId: TEST_SHOP_ID,
      name: 'Adebayo Trading Co.',
      phone: '+234 806 666 6666',
      totalDebt: 3500000, // ₦3.5M debt
      createdAt: now,
      updatedAt: now
    },
    {
      id: generateUUID(),
      shopId: TEST_SHOP_ID,
      name: 'Sarah Enterprises',
      phone: '+234 807 777 7777',
      totalDebt: 850000, // ₦850K debt
      createdAt: now,
      updatedAt: now
    },
    {
      id: generateUUID(),
      shopId: TEST_SHOP_ID,
      name: 'Johnson Wholesale',
      phone: '+234 808 888 8888',
      totalDebt: 2100000, // ₦2.1M debt
      createdAt: now,
      updatedAt: now
    },
    {
      id: generateUUID(),
      shopId: TEST_SHOP_ID,
      name: 'Michael Retail Store',
      phone: '+234 809 999 9999',
      totalDebt: 0,
      createdAt: now,
      updatedAt: now
    },
    {
      id: generateUUID(),
      shopId: TEST_SHOP_ID,
      name: 'Blessing Supermarket',
      phone: '+234 810 111 1111',
      totalDebt: 1500000, // ₦1.5M debt
      createdAt: now,
      updatedAt: now
    }
  ];
};

/**
 * Create test sales with big transactions
 */
export const createTestSales = (
  products: Product[], 
  customers: Customer[], 
  users: User[]
): Sale[] => {
  const now = new Date();
  const sales: Sale[] = [];
  const cashier = users.find(u => u.role === 'cashier') || users[0];
  
  // Create sales for the last 90 days
  for (let i = 0; i < 90; i++) {
    const saleDate = new Date(now);
    saleDate.setDate(saleDate.getDate() - i);
    
    // Create 5-15 sales per day
    const salesPerDay = Math.floor(Math.random() * 11) + 5;
    
    for (let j = 0; j < salesPerDay; j++) {
      // 20% chance of big transaction (wholesale)
      const isBigTransaction = Math.random() < 0.2;
      const numItems = isBigTransaction 
        ? Math.floor(Math.random() * 8) + 5 // 5-12 items for big transactions
        : Math.floor(Math.random() * 4) + 1; // 1-4 items for regular sales
      
      const items: any[] = [];
      let total = 0;
      let profit = 0;
      
      for (let k = 0; k < numItems; k++) {
        const product = products[Math.floor(Math.random() * products.length)];
        // Big transactions use cartons/wholesale quantities
        const quantity = isBigTransaction
          ? Math.floor(Math.random() * 50) + 10 // 10-60 units/cartons for wholesale
          : Math.floor(Math.random() * 5) + 1; // 1-5 units for retail
        
        const itemTotal = isBigTransaction && product.cartonPrice > 0
          ? Math.floor(quantity / product.unitsPerCarton) * product.cartonPrice + (quantity % product.unitsPerCarton) * product.unitPrice
          : product.unitPrice * quantity;
        
        const itemProfit = isBigTransaction && product.cartonPrice > 0
          ? Math.floor(quantity / product.unitsPerCarton) * (product.cartonPrice - product.costPriceCarton) + (quantity % product.unitsPerCarton) * (product.unitPrice - product.costPriceUnit)
          : (product.unitPrice - product.costPriceUnit) * quantity;
        
        items.push({
          productId: product.id,
          productName: product.name,
          quantity,
          unitPrice: product.unitPrice,
          total: itemTotal
        });
        
        total += itemTotal;
        profit += itemProfit;
      }
      
      const customer = Math.random() > 0.6 ? customers[Math.floor(Math.random() * customers.length)] : null;
      const paymentMethods = ['cash', 'transfer', 'pos'];
      const paymentMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];
      
      sales.push({
        id: generateUUID(),
        shopId: TEST_SHOP_ID,
        date: saleDate.toISOString(),
        items,
        total: Math.round(total),
        paymentMethod: paymentMethod as any,
        customerId: customer?.id,
        cashierId: cashier.id,
        cashierName: cashier.fullName,
        profit: Math.round(profit),
        isCredit: false,
        createdAt: saleDate.toISOString()
      });
    }
  }
  
  // Add some very large wholesale transactions
  for (let i = 0; i < 10; i++) {
    const saleDate = new Date(now);
    saleDate.setDate(saleDate.getDate() - Math.floor(Math.random() * 30));
    saleDate.setHours(10 + Math.floor(Math.random() * 8));
    
    const numItems = Math.floor(Math.random() * 10) + 8; // 8-17 items
    const items: any[] = [];
    let total = 0;
    let profit = 0;
    
    for (let k = 0; k < numItems; k++) {
      const product = products[Math.floor(Math.random() * products.length)];
      // Very large quantities for wholesale
      const quantity = Math.floor(Math.random() * 200) + 50; // 50-250 units/cartons
      
      const itemTotal = product.cartonPrice > 0
        ? Math.floor(quantity / product.unitsPerCarton) * product.cartonPrice + (quantity % product.unitsPerCarton) * product.unitPrice
        : product.unitPrice * quantity;
      
      const itemProfit = product.cartonPrice > 0
        ? Math.floor(quantity / product.unitsPerCarton) * (product.cartonPrice - product.costPriceCarton) + (quantity % product.unitsPerCarton) * (product.unitPrice - product.costPriceUnit)
        : (product.unitPrice - product.costPriceUnit) * quantity;
      
      items.push({
        productId: product.id,
        productName: product.name,
        quantity,
        unitPrice: product.unitPrice,
        total: itemTotal
      });
      
      total += itemTotal;
      profit += itemProfit;
    }
    
    const customer = customers[Math.floor(Math.random() * customers.length)];
    
    sales.push({
      id: generateUUID(),
      shopId: TEST_SHOP_ID,
      date: saleDate.toISOString(),
      items,
      total: Math.round(total), // Could be millions
      paymentMethod: Math.random() > 0.5 ? 'transfer' : 'pos',
      customerId: customer.id,
        cashierId: cashier.id,
        cashierName: cashier.fullName,
        profit: Math.round(profit),
        isCredit: false,
        createdAt: saleDate.toISOString()
      });
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

