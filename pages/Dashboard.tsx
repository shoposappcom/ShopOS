
import React, { useState, useMemo } from 'react';
import { useStore } from '../context/StoreContext';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, AreaChart, Area, PieChart, Pie, Cell, Legend } from 'recharts';
import { Banknote, TrendingUp, AlertTriangle, Users, Package, Clock, Shield, Download, PieChart as PieIcon, BarChart3, Receipt, Calendar } from 'lucide-react';
import { Button } from '../components/ui/Button';

type DateFilter = 'today' | 'yesterday' | 'week' | 'month' | 'year';

export const Dashboard: React.FC = () => {
  const { sales, products, customers, t, currentUser, expenses } = useStore();
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportType, setExportType] = useState<'sales' | 'inventory' | 'debtors'>('sales');
  const [exportFormat, setExportFormat] = useState<'csv' | 'pdf'>('csv');
  const [dateFilter, setDateFilter] = useState<DateFilter>('today');

  if (!currentUser) return null;

  const role = currentUser.role;

  // Filter data based on role
  const isCashier = role === 'cashier';
  const isStockClerk = role === 'stock_clerk';
  const isAdminOrManager = ['superadmin', 'admin', 'manager'].includes(role);
  const isSuperAdmin = role === 'superadmin' || role === 'admin';

  // --- FILTERING LOGIC ---
  const getDateRange = (filter: DateFilter) => {
    const now = new Date();
    const start = new Date();
    const end = new Date();

    start.setHours(0,0,0,0);
    end.setHours(23,59,59,999);

    if (filter === 'yesterday') {
        start.setDate(start.getDate() - 1);
        end.setDate(end.getDate() - 1);
    } else if (filter === 'week') {
        const day = start.getDay(); 
        start.setDate(start.getDate() - day); // Sunday start
    } else if (filter === 'month') {
        start.setDate(1);
    } else if (filter === 'year') {
        start.setMonth(0, 1);
    }
    return { start, end };
  };

  const { start: filterStart, end: filterEnd } = getDateRange(dateFilter);

  // 1. SALES DATA (Filtered)
  const allSales = isCashier 
    ? sales.filter(s => s.cashierId === currentUser.id)
    : sales;

  const filteredSales = useMemo(() => {
      return allSales.filter(s => {
          const d = new Date(s.date);
          return d >= filterStart && d <= filterEnd;
      });
  }, [allSales, filterStart, filterEnd]);

  const totalRevenue = filteredSales.reduce((acc, s) => acc + s.total, 0);
  const grossProfit = filteredSales.reduce((acc, s) => acc + (s.profit || 0), 0);
  
  // 2. EXPENSES DATA (Filtered)
  const filteredExpenses = useMemo(() => {
      return expenses.filter(e => {
          if (e.isArchived) return false;
          const d = new Date(e.date);
          return d >= filterStart && d <= filterEnd;
      });
  }, [expenses, filterStart, filterEnd]);
  
  const totalExpenses = filteredExpenses.reduce((acc, e) => acc + e.amount, 0);
  const netProfit = grossProfit - totalExpenses;

  // 3. INVENTORY DATA (Static Snapshot - Exclude Archived)
  // Filter active products first
  const activeProducts = products.filter(p => !p.isArchived);

  const lowStockCount = activeProducts.filter(p => p.totalUnits < p.minStockLevel).length;
  
  const expiringProducts = activeProducts
    .filter(p => p.expiryDate && new Date(p.expiryDate) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000))
    .sort((a, b) => new Date(a.expiryDate!).getTime() - new Date(b.expiryDate!).getTime())
    .slice(0, 5);

  // 4. DEBT DATA (Static Snapshot - Exclude Archived)
  const totalDebt = customers.filter(c => !c.isArchived).reduce((acc, c) => acc + c.totalDebt, 0);

  // --- CHART DATA GENERATION ---
  const chartData = useMemo(() => {
      const data: any[] = [];
      
      if (dateFilter === 'today' || dateFilter === 'yesterday') {
          // Hourly breakdown
          for (let i = 0; i < 24; i++) {
              const label = `${i}:00`;
              const hourSales = filteredSales.filter(s => new Date(s.date).getHours() === i);
              data.push({ name: label, sales: hourSales.reduce((acc, s) => acc + s.total, 0) });
          }
      } else if (dateFilter === 'week' || dateFilter === 'month') {
          // Daily breakdown
          const current = new Date(filterStart);
          while (current <= filterEnd && current <= new Date()) {
              const dateStr = current.toDateString();
              const daySales = filteredSales.filter(s => new Date(s.date).toDateString() === dateStr);
              data.push({ 
                  name: current.toLocaleDateString(undefined, { day: 'numeric', month: 'short' }), 
                  sales: daySales.reduce((acc, s) => acc + s.total, 0) 
              });
              current.setDate(current.getDate() + 1);
          }
      } else if (dateFilter === 'year') {
          // Monthly breakdown
          for (let i = 0; i < 12; i++) {
              const monthSales = filteredSales.filter(s => new Date(s.date).getMonth() === i);
              const date = new Date();
              date.setMonth(i);
              data.push({ 
                  name: date.toLocaleDateString(undefined, { month: 'short' }), 
                  sales: monthSales.reduce((acc, s) => acc + s.total, 0) 
              });
          }
      }
      return data;
  }, [dateFilter, filteredSales, filterStart, filterEnd]);

  // BEST SELLERS (Based on Filtered Sales)
  const bestSellersData = useMemo(() => {
      const map = new Map<string, number>();
      filteredSales.forEach(s => {
        s.items.forEach(i => {
          const units = i.quantityType === 'carton' ? i.quantity * i.unitsPerCarton : i.quantity;
          map.set(i.name, (map.get(i.name) || 0) + units);
        });
      });
      return Array.from(map.entries())
        .map(([name, units]) => ({ name, units }))
        .sort((a, b) => b.units - a.units)
        .slice(0, 5);
  }, [filteredSales]);

  // CATEGORY BREAKDOWN (Based on Filtered Sales)
  const categoryData = useMemo(() => {
      const map = new Map<string, number>();
      filteredSales.forEach(s => {
        s.items.forEach(i => {
          map.set(i.category, (map.get(i.category) || 0) + i.subtotal);
        });
      });
      return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [filteredSales]);

  const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6'];

  // EXPORT HANDLERS
  const generateCSV = (type: 'sales' | 'inventory' | 'debtors') => {
    let data = [];
    let filename = '';

    if (type === 'sales') {
      data = filteredSales.map(s => ({
        ID: s.id,
        Date: new Date(s.date).toLocaleDateString(),
        Cashier: s.cashierName,
        Total: s.total,
        Profit: s.profit,
        Method: s.paymentMethod
      }));
      filename = 'sales_report.csv';
    } else if (type === 'inventory') {
      data = activeProducts.map(p => ({
        Name: p.name,
        Category: p.category,
        Barcode: p.barcode,
        Cartons: Math.floor(p.totalUnits / p.unitsPerCarton),
        Units: p.totalUnits % p.unitsPerCarton,
        TotalValue: (Math.floor(p.totalUnits / p.unitsPerCarton) * p.cartonPrice) + ((p.totalUnits % p.unitsPerCarton) * p.unitPrice)
      }));
      filename = 'inventory_report.csv';
    } else if (type === 'debtors') {
      data = customers.filter(c => !c.isArchived).map(c => ({
        Name: c.name,
        Phone: c.phone,
        Debt: c.totalDebt,
        LastPurchase: c.lastPurchaseDate
      }));
      filename = 'debtors_report.csv';
    }

    if (data.length === 0) return alert('No data to export');
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => JSON.stringify((row as any)[header])).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
  };

  const generatePDF = (type: 'sales' | 'inventory' | 'debtors') => {
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (!printWindow) return alert('Please allow popups to print');

    let title = '';
    let headers: string[] = [];
    let rows: string[][] = [];

    if (type === 'sales') {
        title = `Sales Report (${t(dateFilter)})`;
        headers = ['Date', 'ID', 'Cashier', 'Method', 'Total', 'Profit'];
        rows = filteredSales.map(s => [
            new Date(s.date).toLocaleDateString(),
            s.id.slice(-6),
            s.cashierName,
            s.paymentMethod.toUpperCase(),
            `₦${s.total.toLocaleString()}`,
            `₦${(s.profit || 0).toLocaleString()}`
        ]);
    } else if (type === 'inventory') {
        title = 'Inventory Report';
        headers = ['Product', 'Category', 'Stock (Ctn/Unit)', 'Value'];
        rows = activeProducts.map(p => [
            p.name,
            p.category,
            `${Math.floor(p.totalUnits / p.unitsPerCarton)} / ${p.totalUnits % p.unitsPerCarton}`,
            `₦${((Math.floor(p.totalUnits / p.unitsPerCarton) * p.cartonPrice) + ((p.totalUnits % p.unitsPerCarton) * p.unitPrice)).toLocaleString()}`
        ]);
    } else if (type === 'debtors') {
        title = 'Debtors Report';
        headers = ['Customer', 'Phone', 'Last Purchase', 'Debt'];
        rows = customers.filter(c => !c.isArchived && c.totalDebt > 0).map(c => [
            c.name,
            c.phone,
            c.lastPurchaseDate ? new Date(c.lastPurchaseDate).toLocaleDateString() : 'N/A',
            `₦${c.totalDebt.toLocaleString()}`
        ]);
    }

    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>${title} - ShopOS</title>
            <style>
                body { font-family: sans-serif; margin: 20px; }
                h1 { text-align: center; margin-bottom: 5px; }
                p { text-align: center; font-size: 12px; color: #666; margin-top: 0; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 12px; }
                th { background-color: #f2f2f2; }
                @media print { button { display: none; } }
            </style>
        </head>
        <body>
            <h1>${title}</h1>
            <p>Generated on ${new Date().toLocaleString()}</p>
            <table>
                <thead>
                    <tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>
                </thead>
                <tbody>
                    ${rows.map(row => `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`).join('')}
                </tbody>
            </table>
            <script>window.onload = function() { window.print(); }</script>
        </body>
        </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
  };

  const handleExportSubmit = () => {
    if (exportFormat === 'csv') generateCSV(exportType);
    else generatePDF(exportType);
    setShowExportModal(false);
  };

  // UI Components
  const StatCard = ({ title, value, icon: Icon, color, bg }: any) => (
    <div className="bg-white p-5 rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-gray-200 flex items-center gap-4 transition-transform hover:scale-[1.02]">
      <div className={`p-3 rounded-xl ${bg} ${color} shrink-0`}>
        <Icon className="w-6 h-6" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider truncate">{title}</p>
        <h3 className="text-2xl font-bold text-gray-800 mt-1 truncate" title={value.toString()}>{value}</h3>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
           <h2 className="text-2xl font-bold text-gray-800">{t('dashboard')}</h2>
           <p className="text-gray-500 text-sm mt-1">
             {t('welcome')}, <span className="font-semibold text-gray-700">{currentUser.fullName}</span> 
             <span className="ml-2 px-2 py-0.5 rounded-full bg-gray-100 text-xs text-gray-600 capitalize">{t(role)}</span>
           </p>
        </div>
        
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          {/* Date Filter Dropdown */}
          <div className="relative">
             <select 
                className="appearance-none bg-white border border-gray-200 text-gray-700 py-2.5 pl-4 pr-10 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/20 text-sm font-medium shadow-sm w-full sm:w-auto"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value as DateFilter)}
             >
                <option value="today">{t('today')}</option>
                <option value="yesterday">{t('yesterday')}</option>
                <option value="week">{t('thisWeek')}</option>
                <option value="month">{t('thisMonth')}</option>
                <option value="year">{t('thisYear')}</option>
             </select>
             <Calendar className="absolute right-3 top-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>

          {isAdminOrManager && (
            <Button onClick={() => setShowExportModal(true)} variant="outline" className="bg-white shadow-sm border-gray-200">
               <Download className="w-4 h-4 mr-2" />
               {t('exportReport')}
            </Button>
          )}
        </div>
      </div>

      {/* STATS GRID */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        {/* Sales Stats - Visible to All except Stock Clerk */}
        {!isStockClerk && (
          <>
            <StatCard 
              title={isCashier ? t('myPerformance') : t('revenue')} 
              value={`₦${totalRevenue.toLocaleString()}`} 
              icon={Banknote} 
              color="text-green-600"
              bg="bg-green-50" 
            />
            {isSuperAdmin && (
               <>
                <StatCard 
                    title={t('netProfit')} 
                    value={`₦${netProfit.toLocaleString()}`} 
                    icon={TrendingUp} 
                    color="text-emerald-600"
                    bg="bg-emerald-50" 
                />
                <StatCard 
                    title={t('totalExpenses')} 
                    value={`₦${totalExpenses.toLocaleString()}`} 
                    icon={Receipt} 
                    color="text-red-600"
                    bg="bg-red-50" 
                />
               </>
            )}
            {!isSuperAdmin && (
              <StatCard 
                title="Transactions" 
                value={filteredSales.length} 
                icon={TrendingUp} 
                color="text-blue-600"
                bg="bg-blue-50" 
              />
            )}
          </>
        )}

        {/* Inventory Stats - Visible to All */}
        <StatCard 
          title={t('lowStock')} 
          value={lowStockCount} 
          icon={AlertTriangle} 
          color="text-orange-600"
          bg="bg-orange-50" 
        />

        {/* Financial/System Stats - Admins/Managers Only */}
        {isAdminOrManager && !isSuperAdmin && (
          <StatCard 
            title={t('totalDebt')} 
            value={`₦${totalDebt.toLocaleString()}`} 
            icon={Users} 
            color="text-red-600"
            bg="bg-red-50" 
          />
        )}
        
        {/* Stock Clerk Specific */}
        {isStockClerk && (
           <StatCard 
            title="Total Products" 
            value={activeProducts.length} 
            icon={Package} 
            color="text-purple-600"
            bg="bg-purple-50" 
          />
        )}
      </div>

      {/* MAIN CONTENT GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* CHART SECTION - Hidden for Stock Clerk */}
        {!isStockClerk && (
          <div className="lg:col-span-2 space-y-6">
            {/* Sales Trends */}
            <div className="bg-white p-6 rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-gray-200">
              <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                {t('salesTrends')} ({t(dateFilter)})
              </h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#9CA3AF'}} dy={10} minTickGap={15} />
                    <YAxis axisLine={false} tickLine={false} tickFormatter={(value) => `${value/1000}k`} tick={{fontSize: 12, fill: '#9CA3AF'}} />
                    <Tooltip 
                      formatter={(value: number) => [`₦${value.toLocaleString()}`, 'Sales']}
                      contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Area type="monotone" dataKey="sales" stroke="#10B981" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               {/* Best Sellers */}
               <div className="bg-white p-6 rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-gray-200">
                  <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-blue-600" />
                    {t('bestSellers')}
                  </h3>
                  <div className="h-48 w-full">
                    {bestSellersData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={bestSellersData} layout="vertical" margin={{ left: 0 }}>
                            <XAxis type="number" hide />
                            <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 10}} interval={0} />
                            <Tooltip />
                            <Bar dataKey="units" fill="#3B82F6" radius={[0, 4, 4, 0]} barSize={20} />
                        </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full flex items-center justify-center text-gray-400 text-xs">No sales in this period</div>
                    )}
                  </div>
               </div>

               {/* Category Breakdown */}
               <div className="bg-white p-6 rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-gray-200">
                  <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2">
                    <PieIcon className="w-5 h-5 text-purple-600" />
                    {t('categoryBreakdown')}
                  </h3>
                  <div className="h-48 w-full flex items-center justify-center">
                    {categoryData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                            data={categoryData}
                            innerRadius={40}
                            outerRadius={70}
                            paddingAngle={5}
                            dataKey="value"
                            >
                            {categoryData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                            </Pie>
                            <Tooltip formatter={(value: number) => `₦${value.toLocaleString()}`} />
                            <Legend iconSize={8} wrapperStyle={{fontSize: '10px'}} />
                        </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full flex items-center justify-center text-gray-400 text-xs">No data available</div>
                    )}
                  </div>
               </div>
            </div>
          </div>
        )}

        {/* ALERTS & LISTS SECTION */}
        <div className="space-y-6 lg:col-span-1">
          {/* Low Stock Alert */}
          <div className="bg-white p-5 rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-gray-200">
             <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-500" />
                {t('lowStock')}
             </h3>
             <div className="space-y-3">
                {activeProducts.filter(p => p.totalUnits < p.minStockLevel).slice(0, isStockClerk ? 10 : 5).map(p => (
                  <div key={p.id} className="flex justify-between items-center p-3 bg-orange-50 rounded-xl border border-orange-100">
                     <div className="flex-1 min-w-0 mr-2">
                       <p className="font-medium text-gray-800 truncate text-sm">{p.name}</p>
                     </div>
                     <span className="text-xs font-bold text-orange-700 bg-white px-2 py-1 rounded-lg border border-orange-200 whitespace-nowrap">
                       {p.totalUnits} left
                     </span>
                  </div>
                ))}
                {activeProducts.filter(p => p.totalUnits < p.minStockLevel).length === 0 && (
                  <div className="text-center py-6 text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                    <Shield className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Stock levels are healthy</p>
                  </div>
                )}
             </div>
          </div>

          {/* Expiry Warning */}
          {!isCashier && (
             <div className="bg-white p-5 rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-gray-200">
                <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-purple-500" />
                  {t('expiryAlerts')}
                </h3>
                <div className="space-y-3">
                   {expiringProducts.length > 0 ? (
                     expiringProducts.map(p => {
                       const daysLeft = Math.ceil((new Date(p.expiryDate!).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                       const isExpired = daysLeft < 0;
                       
                       return (
                         <div key={p.id} className={`flex items-center gap-3 p-3 rounded-xl border ${isExpired ? 'bg-red-50 border-red-100' : 'bg-purple-50 border-purple-100'}`}>
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${isExpired ? 'bg-red-100 text-red-600' : 'bg-purple-100 text-purple-600'}`}>
                               {p.image ? <img src={p.image} className="w-full h-full object-cover rounded-lg" /> : <Clock className="w-5 h-5" />}
                            </div>
                            <div className="flex-1 min-w-0">
                               <p className="text-sm font-semibold text-gray-800 truncate">{p.name}</p>
                               <p className={`text-xs ${isExpired ? 'text-red-500 font-bold' : 'text-purple-500'}`}>
                                  {isExpired ? t('expired') : `${t('expiresIn')} ${daysLeft} ${t('days')}`}
                               </p>
                            </div>
                            <span className="text-xs font-medium text-gray-500 bg-white px-2 py-1 rounded border border-gray-100">
                               {new Date(p.expiryDate!).toLocaleDateString()}
                            </span>
                         </div>
                       );
                     })
                   ) : (
                     <div className="text-center py-6 text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                       <Shield className="w-8 h-8 mx-auto mb-2 opacity-50" />
                       <p className="text-sm">No products expiring soon</p>
                     </div>
                   )}
                </div>
             </div>
          )}

          {/* Top Debtors - Exclude Archived */}
          {isAdminOrManager && (
            <div className="bg-white p-5 rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-gray-200">
               <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                 <Users className="w-5 h-5 text-red-500" />
                 Top Debtors
               </h3>
               <div className="space-y-3">
                  {customers.filter(c => !c.isArchived && c.totalDebt > 0).sort((a,b) => b.totalDebt - a.totalDebt).slice(0, 5).map(c => (
                    <div key={c.id} className="flex justify-between items-center p-3 border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors rounded-lg">
                       <div>
                         <p className="font-medium text-gray-800 text-sm">{c.name}</p>
                         <p className="text-xs text-gray-400">{c.phone}</p>
                       </div>
                       <span className="font-bold text-red-600 text-sm">₦{c.totalDebt.toLocaleString()}</span>
                    </div>
                  ))}
                  {customers.filter(c => !c.isArchived && c.totalDebt > 0).length === 0 && (
                    <div className="text-center py-4 text-gray-400 text-sm">No active debtors</div>
                  )}
               </div>
            </div>
          )}
        </div>
      </div>

      {/* Export Modal */}
      {showExportModal && (
         <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-in fade-in zoom-in duration-200">
            <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl border border-gray-100">
                <h3 className="text-xl font-bold text-gray-800 mb-4">{t('exportReport')}</h3>
                
                <div className="space-y-5">
                    <div>
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wide block mb-2">{t('selectReportType')}</label>
                        <div className="grid grid-cols-1 gap-2">
                            {['sales', 'inventory', 'debtors'].map(type => (
                                <button
                                    key={type}
                                    onClick={() => setExportType(type as any)}
                                    className={`p-3 rounded-xl border text-left flex items-center gap-3 transition-all ${exportType === type ? 'border-green-500 bg-green-50 text-green-700 font-bold' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                                >
                                    {type === 'sales' && <TrendingUp className="w-5 h-5" />}
                                    {type === 'inventory' && <Package className="w-5 h-5" />}
                                    {type === 'debtors' && <Users className="w-5 h-5" />}
                                    <span className="capitalize">{t(`export${type.charAt(0).toUpperCase() + type.slice(1)}` as any)}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wide block mb-2">{t('selectFormat')}</label>
                        <div className="grid grid-cols-2 gap-3">
                             <button
                                onClick={() => setExportFormat('csv')}
                                className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all ${exportFormat === 'csv' ? 'border-blue-500 bg-blue-50 text-blue-700 font-bold shadow-sm' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                             >
                                {/* Icons remain the same */}
                                <span className="text-sm">CSV</span>
                             </button>
                             <button
                                onClick={() => setExportFormat('pdf')}
                                className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all ${exportFormat === 'pdf' ? 'border-red-500 bg-red-50 text-red-700 font-bold shadow-sm' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                             >
                                <span className="text-sm">Print / PDF</span>
                             </button>
                        </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                        <Button className="flex-1 py-3 text-lg" onClick={handleExportSubmit}>
                            {exportFormat === 'csv' ? t('downloadCSV') : t('printPDF')}
                        </Button>
                        <Button variant="outline" className="flex-1 py-3" onClick={() => setShowExportModal(false)}>
                            {t('cancel')}
                        </Button>
                    </div>
                </div>
            </div>
         </div>
      )}
    </div>
  );
};
