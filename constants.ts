
import { Product, User, Customer, Language, ShopSettings, Category, Supplier, Expense } from './types';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Users, 
  Package, 
  Settings, 
  LogOut,
  CreditCard,
  Banknote,
  Smartphone,
  FileText,
  Gift,
  History
} from 'lucide-react';

export const NAV_ITEMS = [
  { id: 'dashboard', labelKey: 'dashboard', icon: LayoutDashboard },
  { id: 'pos', labelKey: 'pos', icon: ShoppingCart },
  { id: 'transactions', labelKey: 'transactions', icon: History },
  { id: 'stock', labelKey: 'stock', icon: Package },
  { id: 'debtors', labelKey: 'debtors', icon: Users },
  { id: 'giftCards', labelKey: 'giftCards', icon: Gift },
  { id: 'settings', labelKey: 'settings', icon: Settings },
];

export const PAYMENT_METHODS = [
  { id: 'cash', labelKey: 'cash', icon: Banknote },
  { id: 'transfer', labelKey: 'transfer', icon: Smartphone },
  { id: 'pos', labelKey: 'pos', icon: CreditCard }, // POS terminal
  { id: 'credit', labelKey: 'credit', icon: FileText },
];

export const INITIAL_SETTINGS: ShopSettings = {
  shopId: 'default_shop',
  businessName: 'ShopOS Store',
  address: '123 Market Road, Lagos, Nigeria',
  phone: '080-1234-5678',
  country: 'Nigeria',
  state: 'Lagos',
  currency: '₦',
  receiptFooter: 'Thank you for your patronage!',
  taxRate: 0,
  autoBackup: 'off'
};

export const GIFT_CARD_THEMES = {
  standard: 'from-blue-600 to-blue-900',
  gold: 'from-yellow-300 via-yellow-500 to-yellow-700',
  dark: 'from-gray-800 via-gray-900 to-black',
  festive: 'from-rose-500 via-red-500 to-red-700',
};

export const COUNTRIES_STATES: Record<string, string[]> = {
  "Nigeria": [
    "Abuja (FCT)", "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno", 
    "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "Gombe", "Imo", "Jigawa", "Kaduna", 
    "Kano", "Katsina", "Kebbi", "Kogi", "Kwara", "Lagos", "Nasarawa", "Niger", "Ogun", "Ondo", 
    "Osun", "Oyo", "Plateau", "Rivers", "Sokoto", "Taraba", "Yobe", "Zamfara"
  ],
  "Ghana": [
    "Greater Accra", "Ashanti", "Central", "Eastern", "Western", "Northern", "Volta", "Upper East", "Upper West", "Brong-Ahafo"
  ],
  "Niger": [
    "Niamey", "Agadez", "Diffa", "Dosso", "Maradi", "Tahoua", "Tillabéri", "Zinder"
  ],
  "Benin": [
    "Cotonou", "Porto-Novo", "Parakou", "Abomey", "Bohicon", "Djougou", "Kandi", "Natitingou"
  ],
  "Togo": [
    "Lomé", "Maritime", "Plateaux", "Centrale", "Kara", "Savanes"
  ],
  "Cameroon": [
    "Yaoundé", "Douala", "Adamawa", "Centre", "East", "Far North", "Littoral", "North", "Northwest", "South", "Southwest", "West"
  ],
  "Mali": [
    "Bamako", "Kayes", "Koulikoro", "Sikasso", "Ségou", "Mopti", "Tombouctou", "Gao", "Kidal"
  ],
  "Côte d'Ivoire": [
    "Abidjan", "Yamoussoukro", "Bas-Sassandra", "Comoé", "Denguélé", "Gôh-Djiboua", "Lacs", "Lagunes", "Montagnes", "Sassandra-Marahoué", "Savanes", "Vallée du Bandama", "Woroba", "Zanzan"
  ],
  "Senegal": [
    "Dakar", "Diourbel", "Fatick", "Kaffrine", "Kaolack", "Kédougou", "Kolda", "Louga", "Matam", "Saint-Louis", "Sédhiou", "Tambacounda", "Thiès", "Ziguinchor"
  ],
  "Kenya": [
    "Nairobi", "Mombasa", "Kisumu", "Nakuru", "Eldoret", "Malindi", "Thika", "Nyeri", "Meru", "Garissa"
  ],
  "South Africa": [
    "Gauteng", "Western Cape", "KwaZulu-Natal", "Eastern Cape", "Limpopo", "Mpumalanga", "North West", "Free State", "Northern Cape"
  ]
};

export const INITIAL_CATEGORIES: Category[] = [
  { id: 'cat1', name: 'Provisions' },
  { id: 'cat2', name: 'Drinks' },
  { id: 'cat3', name: 'Pharmacy' },
  { id: 'cat4', name: 'Cosmetics' },
  { id: 'cat5', name: 'Electronics' },
  { id: 'cat6', name: 'General' },
];

export const INITIAL_SUPPLIERS: Supplier[] = [
  { id: 'sup1', name: 'Alhaji Musa Wholesales', contactPerson: 'Musa', phone: '08011111111', address: 'Kano Market' },
  { id: 'sup2', name: 'Coca-Cola NBC', contactPerson: 'Sales Rep', phone: '08022222222', address: 'Depot' },
];

export const INITIAL_EXPENSES: Expense[] = [];

export const INITIAL_USERS: User[] = [
  { 
    id: '1', 
    username: 'admin', 
    password: 'password123', 
    fullName: 'Musa Ibrahim', 
    role: 'superadmin', 
    status: 'active',
    language: 'en',
    createdAt: new Date().toISOString(),
    phone: '08012345678'
  },
  { 
    id: '2', 
    username: 'manager', 
    password: 'password123', 
    fullName: 'Fatima Hassan', 
    role: 'manager', 
    status: 'active',
    language: 'ha',
    createdAt: new Date().toISOString(),
    phone: '08087654321'
  },
  { 
    id: '3', 
    username: 'cashier', 
    password: 'password123', 
    fullName: 'John Doe', 
    role: 'cashier', 
    status: 'active',
    language: 'yo',
    createdAt: new Date().toISOString()
  },
  {
    id: '4',
    username: 'stock', 
    password: 'password123', 
    fullName: 'Chinedu Stock', 
    role: 'stock_clerk', 
    status: 'active',
    language: 'ig',
    createdAt: new Date().toISOString()
  }
];

export const INITIAL_PRODUCTS: Product[] = [
  { 
    id: 'p1', name: 'Peak Milk (Tin)', barcode: '123456', category: 'Provisions', categoryId: 'cat1', supplierId: 'sup1',
    cartonPrice: 18000, unitPrice: 800, unitsPerCarton: 24,
    costPriceCarton: 16000, costPriceUnit: 666.67,
    stockCartons: 10, stockUnits: 5, totalUnits: 245, minStockLevel: 50,
    image: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?ixlib=rb-1.2.1&auto=format&fit=crop&w=100&q=80',
    translations: {
      ha: { name: 'Peak Milk Gwangwani', category: 'Kayan Masarufi' },
      yo: { name: 'Peak Milk Iṣẹ', category: 'Ipese' }
    }
  },
  { 
    id: 'p2', name: 'Coca Cola (50cl)', barcode: '789012', category: 'Drinks', categoryId: 'cat2', supplierId: 'sup2',
    cartonPrice: 4500, unitPrice: 400, unitsPerCarton: 12,
    costPriceCarton: 3800, costPriceUnit: 316.67,
    stockCartons: 50, stockUnits: 0, totalUnits: 600, minStockLevel: 100,
    image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?ixlib=rb-1.2.1&auto=format&fit=crop&w=100&q=80',
    translations: {
      ha: { name: 'Lemu Coca Cola', category: 'Abubuwan Sha' }
    }
  },
  { 
    id: 'p3', name: 'Paracetamol (Pack)', barcode: '345678', category: 'Pharmacy', categoryId: 'cat3', supplierId: 'sup1',
    cartonPrice: 5000, unitPrice: 500, unitsPerCarton: 12,
    costPriceCarton: 3500, costPriceUnit: 291.67,
    stockCartons: 5, stockUnits: 0, totalUnits: 60, minStockLevel: 20, 
    expiryDate: '2025-12-01', batchNumber: 'BATCH-001'
  },
];

export const INITIAL_CUSTOMERS: Customer[] = [
  { id: 'c1', name: 'Mama Nkechi', phone: '08055555555', totalDebt: 15000, lastPurchaseDate: '2025-05-10T10:00:00' },
  { id: 'c2', name: 'Iya Basira', phone: '08066666666', totalDebt: 2500, lastPurchaseDate: '2025-05-12T14:30:00' },
  { id: 'c3', name: 'Uncle Joe', phone: '08077777777', totalDebt: 0, lastPurchaseDate: '2025-05-01T09:15:00' }
];

export const TRANSLATIONS: Record<Language, Record<string, any>> = {
  en: {
    dashboard: "Dashboard", pos: "POS", transactions: "Transactions", stock: "Stock", debtors: "Debtors", settings: "Settings", giftCards: "Gift Cards",
    welcome: "Welcome back", revenue: "Revenue", lowStock: "Low Stock", totalDebt: "Total Debt",
    salesTrends: "Sales Trends", bestSellers: "Best Sellers", categoryBreakdown: "Category Breakdown",
    searchProduct: "Search product...", allCategories: "All Categories", addProduct: "Add Product",
    carton: "Carton", unit: "Unit", currentStock: "Current Stock", restock: "Restock",
    editProduct: "Edit Product", basicInfo: "Basic Info", uploadImage: "Upload Image",
    productName: "Product Name", category: "Category", barcode: "Barcode", pricing: "Pricing",
    costPrice: "Cost Price", sellingPrice: "Selling Price", unitsPerCarton: "Units/Carton",
    stockAndTracking: "Stock & Tracking", addCartons: "Add Cartons", addUnits: "Add Units",
    minStockLevel: "Min Stock Alert", batchNumber: "Batch Number", expiryDate: "Expiry Date",
    save: "Save", cancel: "Cancel", confirm: "Confirm", cart: "Cart", checkout: "Checkout",
    paymentMethod: "Payment Method", cash: "Cash", transfer: "Transfer", credit: "Credit",
    receiptId: "Receipt ID", items: "Items", total: "Total", soldBy: "Sold By", actions: "Actions",
    viewDetails: "View Details", viewReceipt: "View Receipt", print: "Print", downloadReceipt: "Download Image",
    searchTransactions: "Search transactions...", allMethods: "All Methods", noTransactions: "No transactions found",
    manageUsers: "Manage Users", addUser: "Add User", editUser: "Edit User", fullName: "Full Name",
    username: "Username", password: "Password", role: "Role", phone: "Phone",
    admin: "Admin", manager: "Manager", cashier: "Cashier", stock_clerk: "Stock Clerk",
    businessSettings: "Business Settings", businessName: "Business Name", address: "Address",
    currency: "Currency", receiptFooter: "Receipt Footer", activityLog: "Activity Log",
    searchLogs: "Search logs...", allUsers: "All Users", allActions: "All Actions", noActivity: "No activity logs",
    profile: "Profile", aiSettings: "AI Assistant",
    createGiftCard: "Create Gift Card", initialValue: "Initial Value", quantity: "Quantity", theme: "Theme",
    paymentSuccess: "Payment recorded successfully", recordPayment: "Record Payment", amount: "Amount",
    fullPayment: "Full Payment", remainingDebt: "Remaining Debt", paymentHistory: "Payment History",
    noDebtors: "No debtors found", overdue: "Overdue",
    managerApproval: "Manager Approval Required", success: "Success", newSale: "New Sale",
    subtotal: "Subtotal", apply: "Apply", scanBarcode: "Scan Barcode",
    netProfit: "Net Profit", totalExpenses: "Expenses",
    manageCategories: "Manage Categories", addCategory: "Add Category", editCategory: "Edit Category", categoryName: "Category Name",
    manageSuppliers: "Manage Suppliers", addSupplier: "Add Supplier", editSupplier: "Edit Supplier", supplierName: "Supplier Name", contactPerson: "Contact Person",
    manageExpenses: "Manage Expenses", addExpense: "Add Expense", description: "Description",
    exportReport: "Export Report", selectReportType: "Select Report Type", selectFormat: "Select Format",
    exportSales: "Export Sales", exportInventory: "Export Inventory", exportDebtors: "Export Debtors",
    downloadCSV: "Download CSV", printPDF: "Print / PDF",
    today: "Today", yesterday: "Yesterday", thisWeek: "This Week", thisMonth: "This Month", thisYear: "This Year",
    superadmin: "Super Admin", expired: "Expired", expiresIn: "Expires in", days: "days", expiryAlerts: "Expiry Alerts",
    actionExecuted: "Action Executed", aiHelp: "Shop Assistant", clearChat: "Clear Chat", applyAction: "Apply Action", aiPromptPlaceholder: "Ask me anything...",
    myPerformance: "My Performance",
    // Login Translations
    login: "Login", createShopAccount: "Create Shop Account", welcomeBack: "Welcome Back",
    enterDetails: "Enter your details", startManaging: "Start managing your business today",
    shopName: "Shop Name", country: "Country", state: "State", registerShop: "Register Shop",
    alreadyAccount: "Already have an account? Login", registerNewShop: "Register New Shop",
    quickLogin: "Quick Login (Test Accounts)",
    tooltips: {
      addCartons: "How many full cartons are you adding?",
      addUnits: "How many loose pieces are you adding?",
      minStock: "Alert when total units drop below this",
      batch: "For tracking expiry batches"
    }
  },
  ha: {
    dashboard: "Lissafi", pos: "Sayarwa", transactions: "Tarihin Ciniki", stock: "Kaya", debtors: "Masu Bashi", settings: "Saituna", giftCards: "Katin Kyauta",
    welcome: "Barka da zuwa", revenue: "Kudin Shiga", lowStock: "Kaya sun yi kasa", totalDebt: "Jimlar Bashi",
    salesTrends: "Yanayin Kasuwa", bestSellers: "Masu Tafiya Sosai", categoryBreakdown: "Rabe-raben Kaya",
    searchProduct: "Nemi kaya...", allCategories: "Duk Rukunai", addProduct: "Saka Kaya",
    carton: "Kwali", unit: "Guda", currentStock: "Kayan da ke kasa", restock: "Kara Kaya",
    editProduct: "Gyara Kaya", basicInfo: "Bayanai", uploadImage: "Saka Hoto",
    productName: "Sunan Kaya", category: "Rukuni", barcode: "Lamba (Barcode)", pricing: "Farashi",
    costPrice: "Farashin Sari", sellingPrice: "Farashin Sayarwa", unitsPerCarton: "Guda nawa a kwali",
    stockAndTracking: "Kula da Kaya", addCartons: "Kara Kwali", addUnits: "Kara Guda",
    minStockLevel: "Iyakar Kasa", batchNumber: "Lambar Batch", expiryDate: "Ranar Lalacewa",
    save: "Ajiye", cancel: "Soke", confirm: "Tabbar", cart: "Kwando", checkout: "Biya",
    paymentMethod: "Hanyar Biya", cash: "Tsaba", transfer: "Transfer", credit: "Bashi",
    receiptId: "Lambar Rasit", items: "Kaya", total: "Jimla", soldBy: "Mai Sayarwa", actions: "Ayyuka",
    viewDetails: "Duba Bayani", viewReceipt: "Duba Rasit", print: "Buga", downloadReceipt: "Sauke Hoto",
    searchTransactions: "Nemi ciniki...", allMethods: "Duk Hanyoyi", noTransactions: "Babu ciniki",
    manageUsers: "Masu Amfani", addUser: "Kara Mai Amfani", editUser: "Gyara Mai Amfani", fullName: "Cikakken Suna",
    username: "Sunan Shiga", password: "Password", role: "Matsayi", phone: "Wayar Hannu",
    admin: "Admin", manager: "Manaja", cashier: "Mai Sayarwa", stock_clerk: "Mai Kula da Kaya",
    businessSettings: "Saitunan Kasuwanci", businessName: "Sunan Kasuwanci", address: "Adireshi",
    currency: "Kudin da ake amfani", receiptFooter: "Kasan Rasit", activityLog: "Tarihin Ayyuka",
    searchLogs: "Nemi ayyuka...", allUsers: "Duk Masu Amfani", allActions: "Duk Ayyuka", noActivity: "Babu aiki",
    profile: "Bayanin Kai", aiSettings: "Mataimakin AI",
    createGiftCard: "Kirkiri Katin Kyauta", initialValue: "Kudi na Farko", quantity: "Yawa", theme: "Launi",
    paymentSuccess: "An biya cikin nasara", recordPayment: "Saka Biyan Bashi", amount: "Kudi",
    fullPayment: "Biya Duka", remainingDebt: "Sauran Bashi", paymentHistory: "Tarihin Biya",
    noDebtors: "Babu masu bashi", overdue: "Lokaci ya wuce",
    managerApproval: "Ana bukatar Manaja", success: "Nasara", newSale: "Sabuwar Ciniki",
    subtotal: "Jimlar Farko", apply: "Saka", scanBarcode: "Duba Barcode",
    netProfit: "Riba (Net)", totalExpenses: "Kudin Kashewa",
    manageCategories: "Sarrafa Rukunai", addCategory: "Kara Rukuni", editCategory: "Gyara Rukuni", categoryName: "Sunan Rukuni",
    manageSuppliers: "Sarrafa Masu Kawo Kaya", addSupplier: "Kara Mai Kawo Kaya", editSupplier: "Gyara Mai Kawo Kaya", supplierName: "Sunan Mai Kawo Kaya", contactPerson: "Mutumin Tuntuba",
    manageExpenses: "Sarrafa Kudin Kashewa", addExpense: "Saka Kudin Kashewa", description: "Bayani",
    exportReport: "Fitar da Rahoto", selectReportType: "Zabi Nau'in Rahoto", selectFormat: "Zabi Tsari",
    exportSales: "Fitar da Ciniki", exportInventory: "Fitar da Kaya", exportDebtors: "Fitar da Masu Bashi",
    downloadCSV: "Sauke CSV", printPDF: "Buga / PDF",
    today: "Yau", yesterday: "Jiya", thisWeek: "Wannan Mako", thisMonth: "Wannan Wata", thisYear: "Wannan Shekara",
    superadmin: "Babban Admin", expired: "Ya Lalace", expiresIn: "Zai lalace nan da", days: "kwana", expiryAlerts: "Kayan da zasu lalace",
    actionExecuted: "An aiwatar", aiHelp: "Mataimakin Shago", clearChat: "Goge Hira", applyAction: "Aiwatar", aiPromptPlaceholder: "Tambaye ni komai...",
    myPerformance: "Kokarina",
    // Login Translations (Hausa)
    login: "Shiga", createShopAccount: "Bude Sabon Shago", welcomeBack: "Barka da dawowa",
    enterDetails: "Saka bayanan ka don shiga", startManaging: "Fara kula da kasuwancin ka yau",
    shopName: "Sunan Shago", country: "Kasa", state: "Jiha", registerShop: "Yi Rijista",
    alreadyAccount: "Kana da asusu? Shiga", registerNewShop: "Bude Sabon Shago",
    quickLogin: "Shiga da Sauri (Gwajin)",
    tooltips: {
      addCartons: "Kwali nawa kake karawa?",
      addUnits: "Guda nawa kake karawa?",
      minStock: "Faɗakarwa idan kaya sun yi kasa",
      batch: "Don bin diddigin kaya"
    }
  },
  yo: {
    dashboard: "Ibi Iṣakoso", pos: "Tita", transactions: "Itan Tita", stock: "Ọja", debtors: "Awọn Onigbese", settings: "Eto", giftCards: "Kaadi Ẹbun",
    welcome: "Kaabo", revenue: "Owo Ti A Ri", lowStock: "Ọja Ti lọ silẹ", totalDebt: "Gbese Lapapọ",
    salesTrends: "Aṣa Tita", bestSellers: "Awọn Ti A Ta Julọ", categoryBreakdown: "Ipin Ẹka",
    searchProduct: "Wa ọja...", allCategories: "Gbogbo Ẹka", addProduct: "Fi Ọja Kun",
    carton: "Paali", unit: "Ẹyọkan", currentStock: "Ọja Ti O Wa", restock: "Fi Ọja Kun",
    editProduct: "Ṣatunṣe Ọja", basicInfo: "Alaye Ipilẹ", uploadImage: "Gbe Aworan",
    productName: "Orukọ Ọja", category: "Ẹka", barcode: "Koodu", pricing: "Iye Owo",
    costPrice: "Iye Ti A Ra", sellingPrice: "Iye Tita", unitsPerCarton: "Iye ninu Paali",
    stockAndTracking: "Iṣakoso Ọja", addCartons: "Fi Paali Kun", addUnits: "Fi Ẹyọkan Kun",
    minStockLevel: "Ipele Ọja Kekere", batchNumber: "Nọmba Batch", expiryDate: "Ọjọ Ipari",
    save: "Fipamọ", cancel: "Fagilee", confirm: "Jẹrisi", cart: "Agbe", checkout: "Sanwo",
    paymentMethod: "Ọna Isanwo", cash: "Owo", transfer: "Gbigbe", credit: "Gbese",
    receiptId: "ID Risiti", items: "Awọn Ọja", total: "Lapapọ", soldBy: "Olutaja", actions: "Awọn Iṣe",
    viewDetails: "Wo Awọn Alaye", viewReceipt: "Wo Risiti", print: "Tẹjade", downloadReceipt: "Ṣe igbasilẹ Aworan",
    searchTransactions: "Wa itan...", allMethods: "Gbogbo Ọna", noTransactions: "Ko si itan",
    manageUsers: "Ṣakoso Awọn Olumulo", addUser: "Fi Olumulo Kun", editUser: "Ṣatunṣe Olumulo", fullName: "Orukọ Kikun",
    username: "Orukọ Wiwọle", password: "Ọrọ Igbaniwọle", role: "Ipo", phone: "Foonu",
    admin: "Alakoso", manager: "Oluṣakoso", cashier: "Olutaja", stock_clerk: "Oluṣakoso Ọja",
    businessSettings: "Eto Iṣowo", businessName: "Orukọ Iṣowo", address: "Adirẹsi",
    currency: "Owo", receiptFooter: "Isalẹ Risiti", activityLog: "Itan Iṣe",
    searchLogs: "Wa awọn iṣẹ...", allUsers: "Gbogbo Olumulo", allActions: "Gbogbo Iṣe", noActivity: "Ko si iṣẹ",
    profile: "Profaili", aiSettings: "Oluranlọwọ AI",
    createGiftCard: "Ṣẹda Kaadi Ẹbun", initialValue: "Iye Ibẹrẹ", quantity: "Iye", theme: "Awo",
    paymentSuccess: "Isanwo ṣaṣeyọri", recordPayment: "Gba Owo", amount: "Iye",
    fullPayment: "Sanwo Tan", remainingDebt: "Gbese Ti O Ku", paymentHistory: "Itan Isanwo",
    noDebtors: "Ko si onigbese", overdue: "O ti pẹ",
    managerApproval: "Ifọwọsi Oluṣakoso", success: "Aṣeyọri", newSale: "Tita Tuntun",
    subtotal: "Lapapọ Kekere", apply: "Lo", scanBarcode: "Scan Koodu",
    netProfit: "Ere", totalExpenses: "Awọn inawo",
    manageCategories: "Ṣakoso Awọn Ẹka", addCategory: "Fi Ẹka Kun", editCategory: "Ṣatunṣe Ẹka", categoryName: "Orukọ Ẹka",
    manageSuppliers: "Ṣakoso Awọn Olupese", addSupplier: "Fi Olupese Kun", editSupplier: "Ṣatunṣe Olupese", supplierName: "Orukọ Olupese", contactPerson: "Eniyan Ibaraẹnisọrọ",
    manageExpenses: "Ṣakoso Inawo", addExpense: "Fi Inawo Kun", description: "Apejuwe",
    exportReport: "Firanṣẹ Ijabọ", selectReportType: "Yan Iru Ijabọ", selectFormat: "Yan Ọna",
    exportSales: "Firanṣẹ Tita", exportInventory: "Firanṣẹ Ọja", exportDebtors: "Firanṣẹ Awọn Onigbese",
    downloadCSV: "Gba CSV", printPDF: "Tẹjade / PDF",
    today: "Loni", yesterday: "Lana", thisWeek: "Ọsẹ Yii", thisMonth: "Oṣu Yii", thisYear: "Ọdun Yii",
    superadmin: "Alakoso Agba", expired: "Ti Pari", expiresIn: "Pari ni", days: "ọjọ", expiryAlerts: "Ikilo Ipari",
    actionExecuted: "Iṣe ti pari", aiHelp: "Oluranlọwọ", clearChat: "Nu Wiregbe", applyAction: "Lo Iṣe", aiPromptPlaceholder: "Beere ohunkohun...",
    myPerformance: "Iṣẹ Mi",
    // Login (Yoruba)
    login: "Wiwọle", createShopAccount: "Ṣii Akọọlẹ Ṣọọbu", welcomeBack: "Kaabo Pada",
    enterDetails: "Tẹ awọn alaye rẹ sii", startManaging: "Bẹrẹ ṣiṣakoso iṣowo rẹ",
    shopName: "Orukọ Ṣọọbu", country: "Orilẹ-ede", state: "Ipinle", registerShop: "Forukọsilẹ",
    alreadyAccount: "Ṣe o ni akọọlẹ kan? Wọle", registerNewShop: "Forukọsilẹ Tuntun",
    quickLogin: "Wiwọle Yara (Idanwo)",
    tooltips: {
      addCartons: "Paali melo ni o n fi kun?",
      addUnits: "Ẹyọkan melo ni o n fi kun?",
      minStock: "Ṣe ikilo nigbati ọja ba lọ silẹ",
      batch: "Fun titele batch"
    }
  },
  ig: {
    dashboard: "Dashboard", pos: "Ebe Ire Ahịa", transactions: "Akụkọ Ire Ahịa", stock: "Ngwa Ahịa", debtors: "Ndị Ji Ụgwọ", settings: "Ntọala", giftCards: "Kaadị Onyinye",
    welcome: "Nnọọ", revenue: "Ego Bata", lowStock: "Ngwa Ahịa Dị Nta", totalDebt: "Ego Mmadụ Ji",
    salesTrends: "Ka Ahịa Si Aga", bestSellers: "Ndị Kacha Ere", categoryBreakdown: "Nkeji Ngwa Ahịa",
    searchProduct: "Chọọ ngwa ahịa...", allCategories: "Nkeji Niile", addProduct: "Tinye Ngwa Ahịa",
    carton: "Katọn", unit: "Otu", currentStock: "Nke Dị", restock: "Tinye Ọzọ",
    editProduct: "Dezie Ngwa Ahịa", basicInfo: "Nkọwa", uploadImage: "Tinye Foto",
    productName: "Aha Ngwa Ahịa", category: "Nkeji", barcode: "Koodu", pricing: "Ọnụ Ahịa",
    costPrice: "Ego e ji zụta", sellingPrice: "Ego e ji ere", unitsPerCarton: "Otu ole n'ime katọn",
    stockAndTracking: "Ilekọta Ngwa Ahịa", addCartons: "Tinye Katọn", addUnits: "Tinye Otu",
    minStockLevel: "Ọkwa Dị Nta", batchNumber: "Nọmba Batch", expiryDate: "Ụbọchị Ọ Ga-emebi",
    save: "Chekwaa", cancel: "Kagbuo", confirm: "Kwenye", cart: "Nkata", checkout: "Kwụọ Ụgwọ",
    paymentMethod: "Ụzọ Ịkwụ Ụgwọ", cash: "Ego", transfer: "Transfer", credit: "Ụgwọ",
    receiptId: "ID Risiti", items: "Ihe", total: "Ngụkọta", soldBy: "Onye Rere", actions: "Ihe",
    viewDetails: "Hụ Nkọwa", viewReceipt: "Hụ Risiti", print: "Bipụta", downloadReceipt: "Budata Foto",
    searchTransactions: "Chọọ...", allMethods: "Ụzọ Niile", noTransactions: "Onweghị ihe ahụrụ",
    manageUsers: "Jikwaa Ndị Ọrụ", addUser: "Tinye Onye Ọrụ", editUser: "Dezie Onye Ọrụ", fullName: "Aha Zuuru Oke",
    username: "Aha Mbata", password: "Okwu Mbata", role: "Ọkwa", phone: "Ekwentị",
    admin: "Onye Isi", manager: "Onye Nlekọta", cashier: "Onye Ọrịre", stock_clerk: "Onye Ngwa Ahịa",
    businessSettings: "Ntọala Azụmahịa", businessName: "Aha Azụmahịa", address: "Adreesị",
    currency: "Ego", receiptFooter: "Okpuru Risiti", activityLog: "Ihe Mere",
    searchLogs: "Chọọ...", allUsers: "Ndị Niile", allActions: "Ihe Niile", noActivity: "Onweghị ihe mere",
    profile: "Profaili", aiSettings: "Onye Enyemaka AI",
    createGiftCard: "Mepụta Kaadị Onyinye", initialValue: "Ego Mbụ", quantity: "Ole", theme: "Ụcha",
    paymentSuccess: "A kwụọla ụgwọ", recordPayment: "Dekọọ Ụgwọ", amount: "Ego",
    fullPayment: "Kwụọ Niile", remainingDebt: "Ụgwọ Fọdụrụ", paymentHistory: "Akụkọ Ụgwọ",
    noDebtors: "Onweghị onye ji ụgwọ", overdue: "Oge Agaala",
    managerApproval: "Nkwenye Onye Nlekọta", success: "Ọ Gaala", newSale: "Ire Ọhụrụ",
    subtotal: "Obere Ngụkọta", apply: "Tinye", scanBarcode: "Scan Koodu",
    netProfit: "Uru", totalExpenses: "Ego Efuru",
    manageCategories: "Jikwaa Nkeji", addCategory: "Tinye Nkeji", editCategory: "Dezie Nkeji", categoryName: "Aha Nkeji",
    manageSuppliers: "Jikwaa Ndị Na-ebubata", addSupplier: "Tinye Onye", editSupplier: "Dezie Onye", supplierName: "Aha Onye", contactPerson: "Onye Nkwurita",
    manageExpenses: "Jikwaa Ego Efuru", addExpense: "Tinye Ego", description: "Nkọwa",
    exportReport: "Wepụta Akụkọ", selectReportType: "Họrọ Ụdị", selectFormat: "Họrọ Ụzọ",
    exportSales: "Wepụta Ire Ahịa", exportInventory: "Wepụta Ngwa Ahịa", exportDebtors: "Wepụta Ndị Ji Ụgwọ",
    downloadCSV: "Budata CSV", printPDF: "Bipụta / PDF",
    today: "Taa", yesterday: "Nnyaa", thisWeek: "Izu A", thisMonth: "Ọnwa A", thisYear: "Afọ A",
    superadmin: "Onye Isi Ukwu", expired: "Emebiela", expiresIn: "Ga-emebi na", days: "ụbọchị", expiryAlerts: "Ịdọ Aka Na Ntị",
    actionExecuted: "Emere ya", aiHelp: "Onye Enyemaka", clearChat: "Hichaa", applyAction: "Mee Ya", aiPromptPlaceholder: "Jụọ m ihe ọbụla...",
    myPerformance: "Ọrụ M",
    // Login (Igbo)
    login: "Banye", createShopAccount: "Mepụta Akaụntụ Ahịa", welcomeBack: "Nnọọ ọzọ",
    enterDetails: "Tinye nkọwa gị", startManaging: "Malite ijikwa azụmahịa gị",
    shopName: "Aha Ụlọ Ahịa", country: "Obodo", state: "Steeti", registerShop: "Debanye Aha",
    alreadyAccount: "I nwere akaụntụ? Banye", registerNewShop: "Debanye Ahịa Ọhụrụ",
    quickLogin: "Banye Ngwa Ngwa (Ule)",
    tooltips: {
      addCartons: "Katọn ole ka ị na-etinye?",
      addUnits: "Otu ole ka ị na-etinye?",
      minStock: "Gwa m ma ọ dị ala karịa nke a",
      batch: "Maka ilekọta batch"
    }
  },
  ar: {
    dashboard: "لوحة التحكم", pos: "نقطة البيع", transactions: "سجل المعاملات", stock: "المخزون", debtors: "المدينون", settings: "الإعدادات", giftCards: "بطاقات الهدايا",
    welcome: "مرحباً", revenue: "الإيرادات", lowStock: "مخزون منخفض", totalDebt: "إجمالي الديون",
    salesTrends: "اتجاهات المبيعات", bestSellers: "الأكثر مبيعاً", categoryBreakdown: "توزيع الفئات",
    searchProduct: "بحث عن منتج...", allCategories: "جميع الفئات", addProduct: "إضافة منتج",
    carton: "كرتون", unit: "قطعة", currentStock: "المخزون الحالي", restock: "إعادة التخزين",
    editProduct: "تعديل المنتج", basicInfo: "معلومات أساسية", uploadImage: "تحميل صورة",
    productName: "اسم المنتج", category: "الفئة", barcode: "الباركود", pricing: "التسعير",
    costPrice: "سعر التكلفة", sellingPrice: "سعر البيع", unitsPerCarton: "وحدات/كرتون",
    stockAndTracking: "التتبع والمخزون", addCartons: "إضافة كراتين", addUnits: "إضافة قطع",
    minStockLevel: "تنبيه الحد الأدنى", batchNumber: "رقم التشغيلة", expiryDate: "تاريخ الانتهاء",
    save: "حفظ", cancel: "إلغاء", confirm: "تأكيد", cart: "السلة", checkout: "دفع",
    paymentMethod: "طريقة الدفع", cash: "نقدي", transfer: "تحويل", credit: "آجل/دين",
    receiptId: "رقم الإيصال", items: "العناصر", total: "المجموع", soldBy: "البائع", actions: "إجراءات",
    viewDetails: "عرض التفاصيل", viewReceipt: "عرض الإيصال", print: "طباعة", downloadReceipt: "تنزيل صورة",
    searchTransactions: "بحث...", allMethods: "كل الطرق", noTransactions: "لا توجد معاملات",
    manageUsers: "إدارة المستخدمين", addUser: "إضافة مستخدم", editUser: "تعديل مستخدم", fullName: "الاسم الكامل",
    username: "اسم المستخدم", password: "كلمة المرور", role: "الدور", phone: "الهاتف",
    admin: "مشرف", manager: "مدير", cashier: "كاشير", stock_clerk: "مسؤول مخزون",
    businessSettings: "إعدادات العمل", businessName: "اسم العمل", address: "العنوان",
    currency: "العملة", receiptFooter: "تذييل الإيصال", activityLog: "سجل النشاط",
    searchLogs: "بحث في السجل...", allUsers: "كل المستخدمين", allActions: "كل الإجراءات", noActivity: "لا يوجد نشاط",
    profile: "الملف الشخصي", aiSettings: "مساعد الذكاء الاصطناعي",
    createGiftCard: "إنشاء بطاقة", initialValue: "القيمة", quantity: "الكمية", theme: "النمط",
    paymentSuccess: "تم الدفع بنجاح", recordPayment: "تسجيل دفعة", amount: "المبلغ",
    fullPayment: "دفع كامل", remainingDebt: "الدين المتبقي", paymentHistory: "سجل الدفعات",
    noDebtors: "لا يوجد مدينون", overdue: "متأخر",
    managerApproval: "مطلوب موافقة المدير", success: "نجاح", newSale: "بيع جديد",
    subtotal: "المجموع الفرعي", apply: "تطبيق", scanBarcode: "مسح الباركود",
    netProfit: "صافي الربح", totalExpenses: "المصروفات",
    manageCategories: "إدارة الفئات", addCategory: "إضافة فئة", editCategory: "تعديل فئة", categoryName: "اسم الفئة",
    manageSuppliers: "إدارة الموردين", addSupplier: "إضافة مورد", editSupplier: "تعديل مورد", supplierName: "اسم المورد", contactPerson: "الشخص المسؤول",
    manageExpenses: "إدارة المصروفات", addExpense: "إضافة مصروف", description: "الوصف",
    exportReport: "تصدير تقرير", selectReportType: "نوع التقرير", selectFormat: "الصيغة",
    exportSales: "تصدير المبيعات", exportInventory: "تصدير المخزون", exportDebtors: "تصدير الديون",
    downloadCSV: "تنزيل CSV", printPDF: "طباعة / PDF",
    today: "اليوم", yesterday: "أمس", thisWeek: "هذا الأسبوع", thisMonth: "هذا الشهر", thisYear: "هذا العام",
    superadmin: "مشرف عام", expired: "منتهي الصلاحية", expiresIn: "ينتهي خلال", days: "أيام", expiryAlerts: "تنبيهات الانتهاء",
    actionExecuted: "تم التنفيذ", aiHelp: "المساعد الذكي", clearChat: "مسح المحادثة", applyAction: "تطبيق", aiPromptPlaceholder: "اسألني أي شيء...",
    myPerformance: "أدائي",
    // Login (Arabic)
    login: "تسجيل الدخول", createShopAccount: "إنشاء حساب متجر", welcomeBack: "مرحباً بعودتك",
    enterDetails: "أدخل تفاصيلك", startManaging: "ابدأ إدارة عملك اليوم",
    shopName: "اسم المتجر", country: "الدولة", state: "المنطقة", registerShop: "تسجيل",
    alreadyAccount: "لديك حساب؟ سجل دخول", registerNewShop: "تسجيل متجر جديد",
    quickLogin: "دخول سريع (تجريبي)",
    tooltips: {
      addCartons: "كم عدد الكراتين المضافة؟",
      addUnits: "كم عدد الوحدات المضافة؟",
      minStock: "تنبيه عند انخفاض المخزون عن هذا الحد",
      batch: "لتتبع تواريخ الانتهاء"
    }
  },
  fr: {
    dashboard: "Tableau de bord", pos: "Caisse", transactions: "Historique", stock: "Stock", debtors: "Débiteurs", settings: "Paramètres", giftCards: "Cartes Cadeaux",
    welcome: "Bienvenue", revenue: "Revenus", lowStock: "Stock Faible", totalDebt: "Dette Totale",
    salesTrends: "Tendances Ventes", bestSellers: "Meilleures Ventes", categoryBreakdown: "Par Catégorie",
    searchProduct: "Rechercher...", allCategories: "Toutes Catégories", addProduct: "Ajouter Produit",
    carton: "Carton", unit: "Unité", currentStock: "Stock Actuel", restock: "Réapprovisionner",
    editProduct: "Modifier Produit", basicInfo: "Infos de base", uploadImage: "Télécharger Image",
    productName: "Nom Produit", category: "Catégorie", barcode: "Code-barres", pricing: "Prix",
    costPrice: "Prix d'Achat", sellingPrice: "Prix de Vente", unitsPerCarton: "Unités/Carton",
    stockAndTracking: "Suivi de Stock", addCartons: "Ajouter Cartons", addUnits: "Ajouter Unités",
    minStockLevel: "Alerte Stock Min", batchNumber: "Numéro Lot", expiryDate: "Date Expiration",
    save: "Enregistrer", cancel: "Annuler", confirm: "Confirmer", cart: "Panier", checkout: "Payer",
    paymentMethod: "Mode de Paiement", cash: "Espèces", transfer: "Virement", credit: "Crédit",
    receiptId: "ID Reçu", items: "Articles", total: "Total", soldBy: "Vendu par", actions: "Actions",
    viewDetails: "Voir Détails", viewReceipt: "Voir Reçu", print: "Imprimer", downloadReceipt: "Télécharger Image",
    searchTransactions: "Rechercher...", allMethods: "Tous Modes", noTransactions: "Aucune transaction",
    manageUsers: "Gérer Utilisateurs", addUser: "Ajouter Utilisateur", editUser: "Modifier Utilisateur", fullName: "Nom Complet",
    username: "Nom d'utilisateur", password: "Mot de passe", role: "Rôle", phone: "Téléphone",
    admin: "Admin", manager: "Gérant", cashier: "Caissier", stock_clerk: "Magasinier",
    businessSettings: "Paramètres Entreprise", businessName: "Nom Entreprise", address: "Adresse",
    currency: "Devise", receiptFooter: "Pied de Reçu", activityLog: "Journal d'Activité",
    searchLogs: "Rechercher...", allUsers: "Tous Utilisateurs", allActions: "Toutes Actions", noActivity: "Aucune activité",
    profile: "Profil", aiSettings: "Assistant IA",
    createGiftCard: "Créer Carte", initialValue: "Valeur Initiale", quantity: "Quantité", theme: "Thème",
    paymentSuccess: "Paiement réussi", recordPayment: "Enregistrer Paiement", amount: "Montant",
    fullPayment: "Paiement Complet", remainingDebt: "Dette Restante", paymentHistory: "Historique Paiement",
    noDebtors: "Aucun débiteur", overdue: "En Retard",
    managerApproval: "Approbation Requise", success: "Succès", newSale: "Nouvelle Vente",
    subtotal: "Sous-total", apply: "Appliquer", scanBarcode: "Scanner Code",
    netProfit: "Bénéfice Net", totalExpenses: "Dépenses",
    manageCategories: "Gérer Catégories", addCategory: "Ajouter Catégorie", editCategory: "Modifier Catégorie", categoryName: "Nom Catégorie",
    manageSuppliers: "Gérer Fournisseurs", addSupplier: "Ajouter Fournisseur", editSupplier: "Modifier Fournisseur", supplierName: "Nom Fournisseur", contactPerson: "Contact",
    manageExpenses: "Gérer Dépenses", addExpense: "Ajouter Dépense", description: "Description",
    exportReport: "Exporter Rapport", selectReportType: "Type de Rapport", selectFormat: "Format",
    exportSales: "Exporter Ventes", exportInventory: "Exporter Stock", exportDebtors: "Exporter Débiteurs",
    downloadCSV: "Télécharger CSV", printPDF: "Imprimer / PDF",
    today: "Aujourd'hui", yesterday: "Hier", thisWeek: "Cette Semaine", thisMonth: "Ce Mois", thisYear: "Cette Année",
    superadmin: "Super Admin", expired: "Expiré", expiresIn: "Expire dans", days: "jours", expiryAlerts: "Alertes Expiration",
    actionExecuted: "Action Exécutée", aiHelp: "Assistant Boutique", clearChat: "Effacer", applyAction: "Appliquer", aiPromptPlaceholder: "Demandez-moi...",
    myPerformance: "Ma Performance",
    // Login (French)
    login: "Connexion", createShopAccount: "Créer Compte Boutique", welcomeBack: "Bon retour",
    enterDetails: "Entrez vos identifiants", startManaging: "Gérez votre business",
    shopName: "Nom Boutique", country: "Pays", state: "État", registerShop: "S'inscrire",
    alreadyAccount: "Déjà un compte ? Connexion", registerNewShop: "Inscrire Nouvelle Boutique",
    quickLogin: "Connexion Rapide (Test)",
    tooltips: {
      addCartons: "Combien de cartons ajoutez-vous ?",
      addUnits: "Combien d'unités ajoutez-vous ?",
      minStock: "Alerte quand le stock total est bas",
      batch: "Pour le suivi des lots"
    }
  }
};

export const AI_PROMPTS: Record<string, string[]> = {
  en: [
    "Show today's sales summary",
    "Which products are low in stock?",
    "Who owes me the most money?",
    "What are my best-selling products this week?",
    "Calculate my net profit for this month",
    "Show products expiring soon",
    "Compare this week's sales to last week",
    "What isn't selling well?",
    "Total inventory value",
    "How much did I spend on expenses?",
    "Help me restock products"
  ],
  ha: [
    "Nuna mini jimlar kuɗin da na samu yau",
    "Waɗanne kayayyaki suka ƙaranci?",
    "Wa yake bin ni kuɗi mafi yawa?",
    "Waɗanne kayayyaki na fi sayarwa mako nan?",
    "Ƙididdige jimlar riba (net) na ga watan nan",
    "Nuna kayayyakin da suke kusa ƙarewa",
    "Kwatanta tallace-tallacen wannan mako da na da suka gabata",
    "Menene ba ya tafiya sosai?",
    "Jimlar darajar kaya",
    "Nawa na kashe a hidima?",
    "Taimaka mini in ƙara kaya"
  ],
  yo: [
    "Fi iye owo ti mo ri loni han mi",
    "Awọn ọja wo lo ku diẹ?",
    "Tani o jẹ mi lowo julọ?",
    "Iru awọn ọja wo ni mo ta julọ lọsẹ yii?",
    "Ṣe iṣiro ere mi fun oṣu yii",
    "Fi awọn ọja ti yoo pari laipẹ han",
    "Ṣe afiwe tita ọsẹ yii si ọsẹ to kọja",
    "Kini ko ta daradara?",
    "Elo ni gbogbo ọja ti mo ni?",
    "Elo ni mo na lori inawo?",
    "Ran mi lọwọ lati pese awọn ọja"
  ],
  ig: [
    "Gosi m mkpokọta ego m nwetara taa",
    "Kedu ngwa ahịa dị nta?",
    "Ònye ji m ụgwọ kachasị ukwuu?",
    "Kedu ngwa ahịa m rere nke ọma n'izu a?",
    "Gbakọọ uru (net) m nwetara n'ọnwa a",
    "Gosi ngwa ahịa ga-agwụ n'oge na-adịghị anya",
    "Jiri ire ahịa izu a tụnyere nke gara aga",
    "Kedu ihe na-adịghị ere nke ọma?",
    "Ego ole ka ngwa ahịa m niile bụ?",
    "Ego ole ka m mefuru?",
    "Nyere m aka itinye ngwa ahịa ọzọ"
  ],
  ar: [
    "أرني ملخص مبيعات اليوم",
    "ما هي المنتجات القليلة في المخزون؟",
    "من يدين لي بأكبر مبلغ؟",
    "ما هي أكثر منتجاتي مبيعاً هذا الأسبوع؟",
    "احسب صافي أرباحي لهذا الشهر",
    "أظهر المنتجات التي تنتهي صلاحيتها قريباً",
    "قارن مبيعات هذا الأسبوع بالأسبوع الماضي",
    "ما الذي لا يباع جيداً؟",
    "إجمالي قيمة المخزون",
    "كم أنفقت على المصروفات؟",
    "ساعدني في إعادة تخزين المنتجات"
  ],
  fr: [
    "Afficher le résumé des ventes d'aujourd'hui",
    "Quels produits sont en stock faible ?",
    "Qui me doit le plus d'argent ?",
    "Quels sont mes produits les plus vendus cette semaine ?",
    "Calculer mon bénéfice net pour ce mois",
    "Afficher les produits expirant bientôt",
    "Comparer les ventes de cette semaine à la semaine dernière",
    "Qu'est-ce qui ne se vend pas bien ?",
    "Valeur totale de l'inventaire",
    "Combien ai-je dépensé en frais ?",
    "Aidez-moi à réapprovisionner"
  ]
};
