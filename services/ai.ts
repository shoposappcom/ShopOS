
import { GoogleGenAI } from "@google/genai";
import { AppState, Language, AIUsageRecord } from '../types';
import { getGeminiApiKey, isShopAIEnabled, addAIUsageRecord, updateAIUsageRecord } from './adminStorage';
import { generateUUID } from './supabase/client';

// Get Gemini API Key from admin storage or fallback to environment variable
const getGeminiApiKeyFromAdmin = (): string | undefined => {
  const adminKey = getGeminiApiKey();
  if (adminKey) {
    return adminKey;
  }
  // Fallback to environment variable for backwards compatibility
  return process.env.API_KEY || process.env.GEMINI_API_KEY;
};

export const generateAIResponse = async (
  prompt: string, 
  state: AppState, 
  language: Language,
  shopId: string,
  userId: string,
  userName: string,
  shopName: string
): Promise<string> => {
  // Check if shop AI is enabled
  if (!isShopAIEnabled(shopId)) {
    return JSON.stringify({
      text: "AI chat is currently disabled for your shop. Please contact support.",
      type: "text"
    });
  }

  const apiKey = getGeminiApiKeyFromAdmin();
  
  if (!apiKey) {
    return JSON.stringify({
       text: "API Key is missing. Please configure Gemini API Key in the admin settings.",
       type: "text"
    });
  }

  // Create usage record BEFORE processing
  const usageRecordId = generateUUID();
  const usageRecord: AIUsageRecord = {
    id: usageRecordId,
    shopId,
    shopName,
    userId,
    userName,
    prompt,
    timestamp: new Date().toISOString()
  };
  
  // Store usage record immediately
  addAIUsageRecord(usageRecord);

  const ai = new GoogleGenAI({ apiKey });
  
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  // --- DATA PREPARATION HELPER FUNCTIONS ---

  const getSalesInDateRange = (startDate: Date, endDate: Date) => {
    return state.sales.filter(s => {
      const d = new Date(s.date);
      return d >= startDate && d <= endDate;
    });
  };

  // 1. Sales Statistics (Time-based aggregation)
  
  // Today
  const salesToday = getSalesInDateRange(todayStart, now);
  
  // Last 7 days
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(now.getDate() - 7);
  const salesLast7Days = getSalesInDateRange(sevenDaysAgo, now);

  // Last 30 days (Month)
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(now.getDate() - 30);
  const salesLast30Days = getSalesInDateRange(thirtyDaysAgo, now);
  
  // Expenses (This Month)
  const expensesThisMonth = state.expenses.filter(e => {
      const d = new Date(e.date);
      return d >= thirtyDaysAgo && d <= now;
  });
  const totalExpensesMonth = expensesThisMonth.reduce((acc, e) => acc + e.amount, 0);

  const aggregateSales = (salesList: typeof state.sales) => ({
    count: salesList.length,
    revenue: salesList.reduce((acc, s) => acc + s.total, 0),
    gross_profit: salesList.reduce((acc, s) => acc + (s.profit || 0), 0),
    cash_total: salesList.filter(s => s.paymentMethod === 'cash').reduce((acc, s) => acc + s.total, 0),
    transfer_total: salesList.filter(s => s.paymentMethod === 'transfer').reduce((acc, s) => acc + s.total, 0),
  });

  const stats = {
    today: aggregateSales(salesToday),
    last_7_days: aggregateSales(salesLast7Days),
    last_30_days: {
        ...aggregateSales(salesLast30Days),
        total_expenses: totalExpensesMonth,
        net_profit: aggregateSales(salesLast30Days).gross_profit - totalExpensesMonth
    }
  };

  // 2. Product Analytics (Best Sellers, Slow Movers)
  const productSalesMap7d: Record<string, number> = {};
  salesLast7Days.forEach(s => {
    s.items.forEach(i => {
      const units = i.quantityType === 'carton' ? i.quantity * i.unitsPerCarton : i.quantity;
      productSalesMap7d[i.id] = (productSalesMap7d[i.id] || 0) + units;
    });
  });

  const productSalesMap30d: Record<string, number> = {};
  salesLast30Days.forEach(s => {
    s.items.forEach(i => {
      const units = i.quantityType === 'carton' ? i.quantity * i.unitsPerCarton : i.quantity;
      productSalesMap30d[i.id] = (productSalesMap30d[i.id] || 0) + units;
    });
  });

  // 3. Detailed Inventory Context
  const inventoryContext = state.products.map(p => {
    const sold7d = productSalesMap7d[p.id] || 0;
    const sold30d = productSalesMap30d[p.id] || 0;
    
    // Profit Margin Calculation: ((Price - Cost) / Price) * 100
    const margin = p.unitPrice > 0 
        ? ((p.unitPrice - p.costPriceUnit) / p.unitPrice * 100).toFixed(1) 
        : '0';
    
    // Expiry calculation
    let daysToExpiry = null;
    if (p.expiryDate) {
      daysToExpiry = Math.ceil((new Date(p.expiryDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    }

    return {
      id: p.id,
      name: p.name,
      category: p.category,
      stock: {
        cartons: Math.floor(p.totalUnits / p.unitsPerCarton),
        units: p.totalUnits % p.unitsPerCarton,
        total_units: p.totalUnits
      },
      prices: {
        cost_unit: p.costPriceUnit,
        sell_unit: p.unitPrice,
        sell_carton: p.cartonPrice
      },
      financials: {
        margin_percent: margin,
        inventory_value: p.totalUnits * p.costPriceUnit
      },
      status: {
        low_stock: p.totalUnits < p.minStockLevel,
        days_to_expiry: daysToExpiry,
        sold_last_7d: sold7d,
        sold_last_30d: sold30d
      }
    };
  });

  // Derived Lists for Context
  const lowStockList = inventoryContext
    .filter(p => p.status.low_stock)
    .map(p => `${p.name} (Has: ${p.stock.total_units}, Min: ${state.products.find(x=>x.id===p.id)?.minStockLevel})`);
  
  const expiringSoonList = inventoryContext
    .filter(p => p.status.days_to_expiry !== null && p.status.days_to_expiry <= 60)
    .sort((a, b) => (a.status.days_to_expiry || 0) - (b.status.days_to_expiry || 0))
    .map(p => `${p.name} (${p.status.days_to_expiry} days left)`);

  const bestSellersWeek = inventoryContext
    .sort((a, b) => b.status.sold_last_7d - a.status.sold_last_7d)
    .slice(0, 5)
    .map(p => `${p.name} (${p.status.sold_last_7d} sold)`);

  const slowMoversList = inventoryContext
    .filter(p => p.status.sold_last_30d === 0)
    .slice(0, 10)
    .map(p => p.name);

  const totalInventoryValue = inventoryContext.reduce((acc, p) => acc + p.financials.inventory_value, 0);

  // 4. Debtors
  const debtorsList = state.customers
    .filter(c => c.totalDebt > 0)
    .map(c => ({ name: c.name, debt: c.totalDebt, phone: c.phone }));

  // --- CONSTRUCT FINAL CONTEXT OBJECT ---
  // Ensure lists are never empty to guide AI responses better
  const contextData = {
    current_date: now.toDateString(),
    sales_stats: stats,
    expenses: {
        total_month: totalExpensesMonth,
        recent: expensesThisMonth.slice(0, 5).map(e => ({desc: e.description, amt: e.amount}))
    },
    inventory_summary: {
      total_items: inventoryContext.length,
      total_valuation: totalInventoryValue,
      low_stock_items: lowStockList.length > 0 ? lowStockList : ["No items are low in stock"],
      expiring_soon_items: expiringSoonList.length > 0 ? expiringSoonList : ["No items expiring in the next 60 days"],
      best_sellers_week: bestSellersWeek.length > 0 ? bestSellersWeek : ["No sales data for this week"],
      slow_moving_items: slowMoversList.length > 0 ? slowMoversList : ["All items have recent sales"]
    },
    debtors_summary: {
       count: debtorsList.length,
       total_outstanding: debtorsList.reduce((acc, c) => acc + c.debt, 0),
       list: debtorsList.length > 0 ? debtorsList : [{name: "None", debt: 0, phone: ""}]
    },
    // Compact full inventory for specific queries
    full_inventory_data: inventoryContext.map(p => ({
       n: p.name, 
       s: `${p.stock.cartons}c ${p.stock.units}u`, // Stock
       p: p.prices.sell_unit, // Price
       e: p.status.days_to_expiry // Expiry
    }))
  };

  const systemInstruction = `
    You are ShopOS Assistant, an AI helper for a shop owner in Africa.
    Current Language Code: ${language}.
    
    SHOP DATA CONTEXT (Live Data):
    ${JSON.stringify(contextData)}
    
    INSTRUCTIONS:
    1. Answer queries using ONLY the LIVE DATA provided above. 
    2. Respond in the user's language or the language of the prompt.
    3. Use currency symbol ₦.
    4. Format lists clearly using Markdown (bullet points, bold text).
    5. If asked for actions (e.g. "Restock this", "Add new product"), return JSON with 'action' field.
    6. For questions like "What is expiring?", use 'expiring_soon_items'.
    7. For questions like "Best sellers", use 'best_sellers_week'.
    8. For profit questions, mention NET profit (Gross - Expenses).
    
    REQUIRED OUTPUT FORMAT (JSON ONLY):
    {
      "type": "text" | "action",
      "text": "Markdown answer...",
      "action": { 
         "type": "RESTOCK" | "NAVIGATE", 
         "payload": { ... }, 
         "summary": "Short description"
      } 
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: 'application/json' 
      }
    });
    
    const responseText = response.text || JSON.stringify({ type: "text", text: "I couldn't generate a response." });
    
    // Update usage record with response
    updateAIUsageRecord(usageRecordId, {
      response: responseText
    });
    
    return responseText;
  } catch (error) {
    console.error("Gemini Error:", error);
    const errorResponse = JSON.stringify({ type: "text", text: "Sorry, I am having trouble connecting to the AI service right now. Please check your internet connection." });
    
    // Update usage record with error
    updateAIUsageRecord(usageRecordId, {
      response: errorResponse
    });
    
    return errorResponse;
  }
};
