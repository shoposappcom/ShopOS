
import React, { useState, useMemo, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { Sale, Product } from '../types';
import { Search, Calendar, TrendingUp, Package, BarChart3, Filter } from 'lucide-react';

type DateFilter = 'today' | 'yesterday' | 'thisWeek' | 'thisMonth' | 'custom';

interface ProductSalesData {
  productId: string;
  productName: string;
  unitsSold: number;
  cartonsSold: number;
  totalRevenue: number;
  totalProfit: number;
  unitsPerCarton?: number;
}

// Date range helper functions
const getTodayDateRange = (): { start: Date; end: Date } => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

const getYesterdayDateRange = (): { start: Date; end: Date } => {
  const start = new Date();
  start.setDate(start.getDate() - 1);
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setDate(end.getDate() - 1);
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

const getThisWeekDateRange = (): { start: Date; end: Date } => {
  const start = new Date();
  const day = start.getDay();
  const diff = start.getDate() - day; // Get Monday
  start.setDate(diff);
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

const getThisMonthDateRange = (): { start: Date; end: Date } => {
  const start = new Date();
  start.setDate(1);
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setMonth(end.getMonth() + 1);
  end.setDate(0); // Last day of current month
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

const isDateInRange = (dateStr: string, start: Date, end: Date): boolean => {
  const date = new Date(dateStr);
  return date >= start && date <= end;
};

export const StockSales: React.FC = () => {
  const { sales, products, t, currentUser, settings } = useStore();
  const [dateFilter, setDateFilter] = useState<DateFilter>('today');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'units' | 'cartons' | 'revenue' | 'profit'>('profit');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());

  if (!currentUser || !settings) return null;

  const currentShopId = settings.shopId;
  
  // Filter sales by shopId
  const shopSales = sales.filter(s => s.shopId === currentShopId);
  const shopProducts = products.filter(p => p.shopId === currentShopId);

  // Get date range based on filter
  const getDateRange = (): { start: Date; end: Date } => {
    switch (dateFilter) {
      case 'today':
        return getTodayDateRange();
      case 'yesterday':
        return getYesterdayDateRange();
      case 'thisWeek':
        return getThisWeekDateRange();
      case 'thisMonth':
        return getThisMonthDateRange();
      case 'custom':
        if (customStartDate && customEndDate) {
          const start = new Date(customStartDate);
          start.setHours(0, 0, 0, 0);
          const end = new Date(customEndDate);
          end.setHours(23, 59, 59, 999);
          return { start, end };
        }
        return getTodayDateRange();
      default:
        return getTodayDateRange();
    }
  };

  // Aggregate product sales
  const aggregateProductSales = (sales: Sale[], dateRange: { start: Date; end: Date }): ProductSalesData[] => {
    // Filter sales by date range and user role
    const filteredSales = sales.filter(sale => {
      if (!isDateInRange(sale.date, dateRange.start, dateRange.end)) return false;
      // Cashiers see only their sales, admins see all
      if (currentUser.role === 'cashier' && sale.cashierId !== currentUser.id) return false;
      return true;
    });

    // Group by productId
    const productMap = new Map<string, ProductSalesData>();

    filteredSales.forEach(sale => {
      sale.items.forEach(item => {
        // CartItem extends Product, so it has 'id' as the product identifier
        const productId = item.id || (item as any).productId;
        if (!productId) return; // Skip items without product ID
        
        const product = shopProducts.find(p => p.id === productId);
        const existing = productMap.get(productId) || {
          productId: productId,
          productName: item.name || (item as any).productName || 'Unknown Product',
          unitsSold: 0,
          cartonsSold: 0,
          totalRevenue: 0,
          totalProfit: 0,
          unitsPerCarton: product?.unitsPerCarton
        };

        if (item.quantityType === 'unit') {
          existing.unitsSold += item.quantity;
        } else if (item.quantityType === 'carton') {
          existing.cartonsSold += item.quantity;
          // Convert cartons to units for total calculation
          const unitsPerCarton = existing.unitsPerCarton || 1;
          existing.unitsSold += item.quantity * unitsPerCarton;
        }

        existing.totalRevenue += item.subtotal || 0;
        
        // Calculate profit for this item
        if (product) {
          // Calculate cost based on quantity type
          // Use the same logic as Dashboard to ensure consistency
          let cost: number;
          if (item.quantityType === 'carton') {
            cost = product.costPriceCarton;
          } else {
            // For units, calculate from carton cost (matching Dashboard logic)
            // This ensures we use the most reliable source of truth
            if (product.unitsPerCarton > 0 && product.costPriceCarton >= 0) {
              cost = product.costPriceCarton / product.unitsPerCarton;
            } else if (product.costPriceUnit && product.costPriceUnit > 0) {
              // Fallback to stored costPriceUnit if unitsPerCarton is invalid
              cost = product.costPriceUnit;
            } else {
              cost = 0;
            }
          }
          
          // Use actual selling price (custom price if set, otherwise use subtotal/quantity to get actual price)
          const actualSellingPrice = item.customPrice !== undefined 
            ? item.customPrice 
            : (item.subtotal / item.quantity);
          
          const itemProfit = (actualSellingPrice - cost) * item.quantity;
          existing.totalProfit += itemProfit;
        }
        
        productMap.set(productId, existing);
      });
    });

    return Array.from(productMap.values());
  };

  const dateRange = getDateRange();
  const productSales = useMemo(() => {
    return aggregateProductSales(shopSales, dateRange);
  }, [shopSales, dateRange, currentUser.role, currentUser.id, shopProducts]);

  // Reset selected products when date filter changes
  useEffect(() => {
    setSelectedProducts(new Set());
  }, [dateFilter, customStartDate, customEndDate]);

  // Filter by search term
  const filteredProductSales = productSales.filter(ps =>
    ps.productName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Sort products
  const sortedProductSales = [...filteredProductSales].sort((a, b) => {
    let comparison = 0;
    switch (sortBy) {
      case 'name':
        comparison = a.productName.localeCompare(b.productName);
        break;
      case 'units':
        comparison = a.unitsSold - b.unitsSold;
        break;
      case 'cartons':
        comparison = a.cartonsSold - b.cartonsSold;
        break;
      case 'revenue':
        comparison = a.totalRevenue - b.totalRevenue;
        break;
      case 'profit':
        comparison = a.totalProfit - b.totalProfit;
        break;
    }
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  // Format display: "X units or Y cartons"
  const formatQuantityDisplay = (data: ProductSalesData): string => {
    const parts: string[] = [];
    
    if (data.unitsSold > 0) {
      // Convert units to cartons if applicable
      if (data.unitsPerCarton && data.unitsPerCarton > 1) {
        const totalCartonsFromUnits = Math.floor(data.unitsSold / data.unitsPerCarton);
        const remainingUnits = data.unitsSold % data.unitsPerCarton;
        
        if (totalCartonsFromUnits > 0) {
          parts.push(`${totalCartonsFromUnits + data.cartonsSold} ${t('carton')}${totalCartonsFromUnits + data.cartonsSold !== 1 ? 's' : ''}`);
        }
        if (remainingUnits > 0) {
          parts.push(`${remainingUnits} ${t('unit')}${remainingUnits !== 1 ? 's' : ''}`);
        }
      } else {
        parts.push(`${data.unitsSold} ${t('unit')}${data.unitsSold !== 1 ? 's' : ''}`);
      }
    }
    
    if (data.cartonsSold > 0 && (!data.unitsPerCarton || data.unitsPerCarton === 1)) {
      parts.push(`${data.cartonsSold} ${t('carton')}${data.cartonsSold !== 1 ? 's' : ''}`);
    }

    return parts.length > 0 ? parts.join(' or ') : '0';
  };

  const handleSort = (column: 'name' | 'units' | 'cartons' | 'revenue' | 'profit') => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  const handleSelectAll = () => {
    if (selectedProducts.size === sortedProductSales.length) {
      setSelectedProducts(new Set());
    } else {
      setSelectedProducts(new Set(sortedProductSales.map(ps => ps.productId)));
    }
  };

  const handleToggleProduct = (productId: string) => {
    const newSelected = new Set(selectedProducts);
    if (newSelected.has(productId)) {
      newSelected.delete(productId);
    } else {
      newSelected.add(productId);
    }
    setSelectedProducts(newSelected);
  };

  const totalRevenue = sortedProductSales.reduce((sum, ps) => sum + ps.totalRevenue, 0);
  const totalUnits = sortedProductSales.reduce((sum, ps) => sum + ps.unitsSold, 0);
  const totalCartons = sortedProductSales.reduce((sum, ps) => sum + ps.cartonsSold, 0);
  const totalProfit = sortedProductSales.reduce((sum, ps) => sum + ps.totalProfit, 0);
  const selectedProfit = sortedProductSales
    .filter(ps => selectedProducts.has(ps.productId))
    .reduce((sum, ps) => sum + ps.totalProfit, 0);

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-blue-600" />
            {t('stockSales') || 'Stock Sales'}
          </h2>
          <p className="text-gray-500 text-sm">Track product sales by date</p>
        </div>
      </div>

      {/* Date Filter Section */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-gray-400" />
            <span className="text-sm font-semibold text-gray-700">Date Filter:</span>
          </div>
          <div className="flex flex-wrap gap-2 flex-1">
            <button
              onClick={() => setDateFilter('today')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                dateFilter === 'today'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {t('today')}
            </button>
            <button
              onClick={() => setDateFilter('yesterday')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                dateFilter === 'yesterday'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {t('yesterday')}
            </button>
            <button
              onClick={() => setDateFilter('thisWeek')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                dateFilter === 'thisWeek'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {t('thisWeek')}
            </button>
            <button
              onClick={() => setDateFilter('thisMonth')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                dateFilter === 'thisMonth'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {t('thisMonth')}
            </button>
            <button
              onClick={() => setDateFilter('custom')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                dateFilter === 'custom'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {t('customRange') || 'Custom Range'}
            </button>
          </div>
        </div>

        {/* Custom Date Range Inputs */}
        {dateFilter === 'custom' && (
          <div className="mt-4 flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Start Date</label>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">End Date</label>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>
        )}
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-blue-50 text-blue-600 shrink-0">
            <Package className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider truncate">{t('unitsSold') || 'Units Sold'}</p>
            <h3 className="text-2xl font-bold text-gray-800 mt-1 truncate">
              {totalUnits.toLocaleString()}
            </h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-green-50 text-green-600 shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider truncate">{t('cartonsSold') || 'Cartons Sold'}</p>
            <h3 className="text-2xl font-bold text-gray-800 mt-1 truncate">
              {totalCartons.toLocaleString()}
            </h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600 shrink-0">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider truncate">{t('revenue')}</p>
            <h3 className="text-2xl font-bold text-gray-800 mt-1 truncate">
              {settings.currency}{totalRevenue.toLocaleString()}
            </h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200 flex items-center gap-4">
          <div className={`p-3 rounded-xl shrink-0 ${totalProfit >= 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
            <TrendingUp className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider truncate">{t('profit') || 'Profit'}</p>
            <h3 className={`text-2xl font-bold mt-1 truncate ${totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {settings.currency}{totalProfit.toLocaleString()}
            </h3>
            {selectedProducts.size > 0 && (
              <p className="text-xs text-gray-500 mt-1">
                Selected: {settings.currency}{selectedProfit.toLocaleString()}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          <input
            className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            placeholder={t('searchProduct') || 'Search product...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Product Sales Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {sortedProductSales.length === 0 ? (
          <div className="p-16 text-center text-gray-400">
            <Package className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p>{t('noProductSales') || 'No product sales found for the selected date range'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-500 font-semibold border-b border-gray-100">
                <tr>
                  <th className="p-4 w-12">
                    <input
                      type="checkbox"
                      checked={sortedProductSales.length > 0 && selectedProducts.size === sortedProductSales.length}
                      onChange={handleSelectAll}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                      title="Select all products"
                    />
                  </th>
                  <th className="p-4">
                    <button
                      onClick={() => handleSort('name')}
                      className="flex items-center gap-2 hover:text-gray-700"
                    >
                      {t('productName')}
                      {sortBy === 'name' && (
                        <span className="text-xs">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </button>
                  </th>
                  <th className="p-4">
                    <button
                      onClick={() => handleSort('units')}
                      className="flex items-center gap-2 hover:text-gray-700"
                    >
                      {t('unitsSold') || 'Units Sold'}
                      {sortBy === 'units' && (
                        <span className="text-xs">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </button>
                  </th>
                  <th className="p-4">
                    <button
                      onClick={() => handleSort('cartons')}
                      className="flex items-center gap-2 hover:text-gray-700"
                    >
                      {t('cartonsSold') || 'Cartons Sold'}
                      {sortBy === 'cartons' && (
                        <span className="text-xs">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </button>
                  </th>
                  <th className="p-4">
                    {t('totalSold') || 'Total Sold'}
                  </th>
                  <th className="p-4">
                    <button
                      onClick={() => handleSort('revenue')}
                      className="flex items-center gap-2 hover:text-gray-700"
                    >
                      {t('revenue')}
                      {sortBy === 'revenue' && (
                        <span className="text-xs">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </button>
                  </th>
                  <th className="p-4">
                    <button
                      onClick={() => handleSort('profit')}
                      className="flex items-center gap-2 hover:text-gray-700"
                    >
                      {t('profit') || 'Profit/Loss'}
                      {sortBy === 'profit' && (
                        <span className="text-xs">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {sortedProductSales.map((productSale) => (
                  <tr key={productSale.productId} className={`hover:bg-gray-50 transition-colors ${selectedProducts.has(productSale.productId) ? 'bg-blue-50' : ''}`}>
                    <td className="p-4">
                      <input
                        type="checkbox"
                        checked={selectedProducts.has(productSale.productId)}
                        onChange={() => handleToggleProduct(productSale.productId)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                      />
                    </td>
                    <td className="p-4 font-semibold text-gray-900">
                      {productSale.productName}
                    </td>
                    <td className="p-4 text-gray-700">
                      {productSale.unitsSold.toLocaleString()}
                    </td>
                    <td className="p-4 text-gray-700">
                      {productSale.cartonsSold.toLocaleString()}
                    </td>
                    <td className="p-4 text-gray-700 font-medium">
                      {formatQuantityDisplay(productSale)}
                    </td>
                    <td className="p-4 font-bold text-gray-900">
                      {settings.currency}{productSale.totalRevenue.toLocaleString()}
                    </td>
                    <td className={`p-4 font-bold ${productSale.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {productSale.totalProfit >= 0 ? '+' : ''}{settings.currency}{productSale.totalProfit.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
