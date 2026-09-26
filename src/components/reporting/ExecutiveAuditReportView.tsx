import React, { useState, useMemo } from 'react';
import {
  Boxes,
  DollarSign,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Scale,
  Calendar,
  Search,
  Filter,
  Printer,
  Download,
  AlertTriangle,
  Building2,
  Users,
  Receipt,
  FileText,
  PieChart,
  CheckCircle2,
  Stethoscope,
  Coins,
  ShieldCheck,
  PackageCheck,
  ChevronDown,
  Info,
  Layers,
  Percent,
  Wallet
} from 'lucide-react';
import { ClinicSettings } from '../../types';

interface ExecutiveAuditReportViewProps {
  startDate: string;
  endDate: string;
  datePreset: string;
  clinicSettings?: ClinicSettings;
  // Section 1: Stock data
  currentStockData: any[];
  currentStockSummary: {
    totalItems: number;
    totalStockUnits: number;
    totalPurchaseValuation: number;
    totalRetailValuation: number;
    totalPurchasePriceSum: number;
    totalRetailPriceSum: number;
  };
  getItemStock: (item: any) => number;
  getItemMinStock: (item: any) => number;
  getItemCategory: (item: any) => string;
  // Section 2, 4, 5: PnL and Financial Data
  pnlSummaryData: {
    opdConsultationFees: number;
    opdCardFees: number;
    opdDispensingFees: number;
    standaloneApptFees: number;
    totalOpdIncome: number;
    grossPosSales: number;
    totalSalesReturns: number;
    netPosIncome: number;
    pharmacyCogs: number;
    pharmacyGrossProfit: number;
    pharmacyMarginPct: number;
    otherIncome: number;
    totalIncome: number;
    vendorCashPayments: number;
    vendorCreditPayments: number;
    vendorOutflows: number;
    salaryOutflows: number;
    expenseOutflows: number;
    totalOperatingExpenses: number;
    totalExpenses: number;
    netProfit: number;
    netMarginPct: number;
    expenseRatio: number;
  };
  // Section 3: Expense Data
  expenseData: any[];
  expenseSummary: {
    totalExpense: number;
    byCategory: Record<string, number>;
    count: number;
  };
  // Master actions
  onPrintReport: () => void;
  onExportCSV: () => void;
}

export default function ExecutiveAuditReportView({
  startDate,
  endDate,
  datePreset,
  clinicSettings,
  currentStockData,
  currentStockSummary,
  getItemStock,
  getItemMinStock,
  getItemCategory,
  pnlSummaryData,
  expenseData,
  expenseSummary,
  onPrintReport,
  onExportCSV
}: ExecutiveAuditReportViewProps) {
  // Navigation sub-tab inside the comprehensive audit report
  const [activeSubSection, setActiveSubSection] = useState<'all' | 'stock' | 'earnings' | 'expenses' | 'cashflow' | 'pnl'>('all');
  const [stockSearch, setStockSearch] = useState('');
  const [expenseSearch, setExpenseSearch] = useState('');
  const [stockCategoryFilter, setStockCategoryFilter] = useState('all');

  // Filtered medicine stock items
  const filteredStockItems = useMemo(() => {
    return currentStockData.filter(item => {
      const name = String(item.ItemName || item.name || '').toLowerCase();
      const cat = getItemCategory(item).toLowerCase();
      const id = String(item.ItemID || item._id || '').toLowerCase();
      const q = stockSearch.toLowerCase().trim();
      const matchesSearch = !q || name.includes(q) || cat.includes(q) || id.includes(q);
      const matchesCat = stockCategoryFilter === 'all' || getItemCategory(item) === stockCategoryFilter;
      return matchesSearch && matchesCat;
    });
  }, [currentStockData, stockSearch, stockCategoryFilter, getItemCategory]);

  // Unique categories for stock
  const uniqueStockCategories = useMemo(() => {
    const cats = new Set<string>();
    currentStockData.forEach(item => {
      const c = getItemCategory(item);
      if (c) cats.add(c);
    });
    return Array.from(cats).sort();
  }, [currentStockData, getItemCategory]);

  // Filtered expenses
  const filteredExpenseList = useMemo(() => {
    return expenseData.filter(e => {
      const q = expenseSearch.toLowerCase().trim();
      if (!q) return true;
      const desc = String(e.Description || '').toLowerCase();
      const cat = String(e.Category || '').toLowerCase();
      const id = String(e.ExpenseID || '').toLowerCase();
      const payee = String(e.Payee || e.VendorName || '').toLowerCase();
      return desc.includes(q) || cat.includes(q) || id.includes(q) || payee.includes(q);
    });
  }, [expenseData, expenseSearch]);

  // Calculated Cash Utilization Percentages
  const totalInflow = pnlSummaryData.totalIncome || 1; // avoid / 0
  const vendorPct = Math.min(100, Math.max(0, (pnlSummaryData.vendorOutflows / totalInflow) * 100));
  const salaryPct = Math.min(100, Math.max(0, (pnlSummaryData.salaryOutflows / totalInflow) * 100));
  const operationalExpensePct = Math.min(100, Math.max(0, (pnlSummaryData.totalOperatingExpenses / totalInflow) * 100));
  const netProfitPct = Math.max(0, (pnlSummaryData.netProfit / totalInflow) * 100);

  return (
    <div className="space-y-6 pt-2">
      {/* 1. EXECUTIVE AUDIT HEADER BANNER */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-5 border border-indigo-900 shadow-md">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-black uppercase tracking-wider">
                Comprehensive Executive Master Audit
              </span>
              <span className="text-xs text-slate-400 font-mono">
                Period: {startDate} to {endDate}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center space-x-2">
              <ShieldCheck className="w-6 h-6 text-amber-400 shrink-0" />
              <span>Financial, Medicine Stock Cost & P&L Statement</span>
            </h2>
            <p className="text-xs text-slate-300 max-w-3xl">
              Clinic & Pharmacy ka mukammal hisab: Mojooda Stock Cost, Total Expenses, Clinic Cash Earning, Cash Inflow/Outflow aur Aakhir mein Saaf Net Profit & Loss.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={onPrintReport}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center space-x-1.5 cursor-pointer active:scale-95"
              title="Print Official Multi-Section A4 Executive Audit Report"
            >
              <Printer className="w-4 h-4" />
              <span>Print Master A4 Audit</span>
            </button>
            <button
              onClick={onExportCSV}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs rounded-xl shadow-sm transition flex items-center space-x-1.5 cursor-pointer"
              title="Export complete financial statement to CSV / Excel"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* 5 KEY FINANCIAL PILLARS SUMMARY MATRIX */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mt-5 pt-4 border-t border-slate-800">
          {/* Pillar 1: Medicine Stock Cost */}
          <div className="bg-slate-800/80 rounded-xl p-3 border border-slate-700/80">
            <div className="text-[10px] font-bold text-teal-400 uppercase tracking-wider flex items-center justify-between">
              <span>1. Stock at Cost</span>
              <Boxes className="w-3.5 h-3.5 text-teal-400" />
            </div>
            <div className="text-base sm:text-lg font-black text-white mt-1">
              Rs. {currentStockSummary.totalPurchaseValuation.toLocaleString()}
            </div>
            <div className="text-[10.5px] text-slate-400 mt-0.5 font-medium">
              {currentStockSummary.totalItems} Items ({currentStockSummary.totalStockUnits.toLocaleString()} Units)
            </div>
          </div>

          {/* Pillar 2: Clinic Cash Earned */}
          <div className="bg-slate-800/80 rounded-xl p-3 border border-slate-700/80">
            <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider flex items-center justify-between">
              <span>2. Cash Earned</span>
              <Coins className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="text-base sm:text-lg font-black text-white mt-1">
              Rs. {pnlSummaryData.totalIncome.toLocaleString()}
            </div>
            <div className="text-[10.5px] text-slate-400 mt-0.5 font-medium">
              OPD: Rs. {pnlSummaryData.totalOpdIncome.toLocaleString()} | POS: Rs. {pnlSummaryData.netPosIncome.toLocaleString()}
            </div>
          </div>

          {/* Pillar 3: Total Expenses */}
          <div className="bg-slate-800/80 rounded-xl p-3 border border-slate-700/80">
            <div className="text-[10px] font-bold text-rose-400 uppercase tracking-wider flex items-center justify-between">
              <span>3. Total Expenses</span>
              <DollarSign className="w-3.5 h-3.5 text-rose-400" />
            </div>
            <div className="text-base sm:text-lg font-black text-white mt-1">
              Rs. {pnlSummaryData.totalExpenses.toLocaleString()}
            </div>
            <div className="text-[10.5px] text-slate-400 mt-0.5 font-medium">
              Ops: Rs. {pnlSummaryData.totalOperatingExpenses.toLocaleString()} | Pay: Rs. {pnlSummaryData.salaryOutflows.toLocaleString()}
            </div>
          </div>

          {/* Pillar 4: Inflow vs Outflow Net */}
          <div className="bg-slate-800/80 rounded-xl p-3 border border-slate-700/80">
            <div className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider flex items-center justify-between">
              <span>4. Cash Flow Net</span>
              <Scale className="w-3.5 h-3.5 text-indigo-400" />
            </div>
            <div className={`text-base sm:text-lg font-black mt-1 ${pnlSummaryData.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              Rs. {pnlSummaryData.netProfit.toLocaleString()}
            </div>
            <div className="text-[10.5px] text-slate-400 mt-0.5 font-medium">
              In: Rs. {pnlSummaryData.totalIncome.toLocaleString()} | Out: Rs. {pnlSummaryData.totalExpenses.toLocaleString()}
            </div>
          </div>

          {/* Pillar 5: Net Profit Margin */}
          <div className="bg-slate-800/80 rounded-xl p-3 border border-slate-700/80 col-span-2 sm:col-span-1">
            <div className="text-[10px] font-bold text-amber-400 uppercase tracking-wider flex items-center justify-between">
              <span>5. Net P&L Margin</span>
              <Percent className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className={`text-base sm:text-lg font-black mt-1 ${pnlSummaryData.netProfit >= 0 ? 'text-amber-300' : 'text-rose-400'}`}>
              {pnlSummaryData.netMarginPct.toFixed(1)}%
            </div>
            <div className="text-[10.5px] text-slate-400 mt-0.5 font-medium">
              {pnlSummaryData.netProfit >= 0 ? '✓ Net Operational Profit' : '⚠️ Net Operational Deficit'}
            </div>
          </div>
        </div>
      </div>

      {/* SUB-SECTION SELECTOR BUTTONS */}
      <div className="flex flex-wrap items-center bg-white p-1.5 rounded-xl border border-slate-200 shadow-2xs gap-1.5">
        <span className="text-xs font-bold text-slate-500 px-2 flex items-center space-x-1 shrink-0">
          <Layers className="w-3.5 h-3.5 text-indigo-600" />
          <span>Audit View:</span>
        </span>

        {[
          { id: 'all', label: 'All Master Sections (Complete Audit)' },
          { id: 'stock', label: '1. Medicine Stock Cost Valuation' },
          { id: 'earnings', label: '2. Clinic Cash Earnings' },
          { id: 'expenses', label: '3. Detailed Expenses' },
          { id: 'cashflow', label: '4. Cash Inflow vs Outflow' },
          { id: 'pnl', label: '5. Net Profit & Loss Statement' }
        ].map(sub => (
          <button
            key={sub.id}
            onClick={() => setActiveSubSection(sub.id as any)}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
              activeSubSection === sub.id
                ? 'bg-indigo-600 text-white shadow-2xs'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
            }`}
          >
            {sub.label}
          </button>
        ))}
      </div>

      {/* ========================================================================= */}
      {/* SECTION 1: CURRENT MEDICINE STOCK VALUATION AT PURCHASE COST */}
      {/* ========================================================================= */}
      {(activeSubSection === 'all' || activeSubSection === 'stock') && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-4 p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-3">
            <div className="space-y-0.5">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 bg-teal-50 text-teal-700 rounded-lg">
                  <Boxes className="w-4 h-4" />
                </div>
                <h3 className="font-black text-slate-900 text-base">
                  Section 1: Current Medicine Stock & Purchase Cost Valuation
                </h3>
              </div>
              <p className="text-xs text-slate-500">
                Clinic aur Pharmacy mein is waqt kitni cost (khareed laagat) ki medicines mojood hain.
              </p>
            </div>

            {/* Quick KPI stats */}
            <div className="flex items-center space-x-2 shrink-0">
              <div className="bg-teal-50 border border-teal-200 px-3 py-1.5 rounded-xl text-right">
                <div className="text-[9.5px] font-bold uppercase text-teal-700">Total Stock at Purchase Cost</div>
                <div className="text-sm font-black text-teal-950 font-mono">
                  Rs. {currentStockSummary.totalPurchaseValuation.toLocaleString()}
                </div>
              </div>
              <div className="bg-indigo-50 border border-indigo-200 px-3 py-1.5 rounded-xl text-right">
                <div className="text-[9.5px] font-bold uppercase text-indigo-700">Stock at Retail / MRP</div>
                <div className="text-sm font-black text-indigo-950 font-mono">
                  Rs. {currentStockSummary.totalRetailValuation.toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          {/* Search & Filter row */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={stockSearch}
                onChange={e => setStockSearch(e.target.value)}
                placeholder="Search medicine name, formula, or ID..."
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <select
              value={stockCategoryFilter}
              onChange={e => setStockCategoryFilter(e.target.value)}
              className="text-xs border border-slate-200 rounded-xl px-3 py-2 bg-slate-50/50 font-medium"
            >
              <option value="all">All Medicine Categories ({uniqueStockCategories.length})</option>
              {uniqueStockCategories.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Table of Medicines with Purchase Cost */}
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-900 text-white font-bold text-[11px] uppercase tracking-wider">
                  <th className="p-2.5">Item ID</th>
                  <th className="p-2.5">Medicine Name & Details</th>
                  <th className="p-2.5">Category</th>
                  <th className="p-2.5 text-center">Available Stock</th>
                  <th className="p-2.5 text-right">Unit Purchase Cost</th>
                  <th className="p-2.5 text-right">Unit Retail Price</th>
                  <th className="p-2.5 text-right bg-slate-800">Total Purchase Valuation</th>
                  <th className="p-2.5 text-right">Total Retail Valuation</th>
                  <th className="p-2.5 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredStockItems.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-6 text-center text-slate-400 italic">
                      No medicine stock records found matching your search.
                    </td>
                  </tr>
                ) : (
                  filteredStockItems.slice(0, 50).map((it, idx) => {
                    const cStock = getItemStock(it);
                    const minStock = getItemMinStock(it);
                    const pPrice = Number(it.PurchasePrice ?? it.purchasePrice ?? it.Price ?? it.price ?? 0);
                    const rPrice = Number(it.Price ?? it.price ?? 0);
                    const totalCost = cStock * pPrice;
                    const totalRetail = cStock * rPrice;
                    const isOut = cStock <= 0;
                    const isLow = cStock > 0 && cStock <= minStock;

                    return (
                      <tr
                        key={it.ItemID || idx}
                        className={idx % 2 === 0 ? 'bg-white hover:bg-slate-50' : 'bg-slate-50/50 hover:bg-slate-100'}
                      >
                        <td className="p-2.5 font-mono text-slate-600 font-bold">{it.ItemID || `ITM-${idx+1}`}</td>
                        <td className="p-2.5 font-bold text-slate-900">
                          <div>{it.ItemName || it.name}</div>
                          {it.Generic && <div className="text-[10px] text-slate-400 font-normal">{it.Generic}</div>}
                        </td>
                        <td className="p-2.5">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-bold border border-slate-200">
                            {getItemCategory(it)}
                          </span>
                        </td>
                        <td className="p-2.5 text-center font-bold font-mono">
                          <span className={isOut ? 'text-rose-600' : isLow ? 'text-amber-600' : 'text-slate-800'}>
                            {cStock.toLocaleString()}
                          </span>
                        </td>
                        <td className="p-2.5 text-right font-mono text-slate-700">
                          Rs. {pPrice.toLocaleString()}
                        </td>
                        <td className="p-2.5 text-right font-mono text-slate-700">
                          Rs. {rPrice.toLocaleString()}
                        </td>
                        <td className="p-2.5 text-right font-mono font-black text-teal-800 bg-teal-50/40">
                          Rs. {totalCost.toLocaleString()}
                        </td>
                        <td className="p-2.5 text-right font-mono font-bold text-slate-800">
                          Rs. {totalRetail.toLocaleString()}
                        </td>
                        <td className="p-2.5 text-center">
                          {isOut ? (
                            <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[9.5px] font-extrabold">Out of Stock</span>
                          ) : isLow ? (
                            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[9.5px] font-extrabold">Low Stock</span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[9.5px] font-extrabold">In Stock</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
              <tfoot>
                <tr className="bg-slate-900 text-white font-black text-xs">
                  <td colSpan={3} className="p-3">
                    TOTAL STOCK VALUATION ({currentStockSummary.totalItems} SKUs)
                  </td>
                  <td className="p-3 text-center font-mono">
                    {currentStockSummary.totalStockUnits.toLocaleString()} Units
                  </td>
                  <td colSpan={2} className="p-3 text-right text-slate-300">
                    Grand Purchase Cost:
                  </td>
                  <td className="p-3 text-right font-mono text-teal-300 bg-slate-800 text-sm">
                    Rs. {currentStockSummary.totalPurchaseValuation.toLocaleString()}
                  </td>
                  <td className="p-3 text-right font-mono text-white text-sm">
                    Rs. {currentStockSummary.totalRetailValuation.toLocaleString()}
                  </td>
                  <td className="p-3 text-center text-emerald-400 font-mono">
                    +Rs. {(currentStockSummary.totalRetailValuation - currentStockSummary.totalPurchaseValuation).toLocaleString()}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
          {filteredStockItems.length > 50 && (
            <p className="text-[11px] text-slate-500 italic text-right">
              Showing top 50 medicines for quick preview. Full list of all {filteredStockItems.length} medicines prints on official A4 document.
            </p>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 2: CLINIC CASH EARNING BREAKDOWN WITH TOTAL */}
      {/* ========================================================================= */}
      {(activeSubSection === 'all' || activeSubSection === 'earnings') && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-3">
            <div className="space-y-0.5">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 bg-emerald-50 text-emerald-700 rounded-lg">
                  <Coins className="w-4 h-4" />
                </div>
                <h3 className="font-black text-slate-900 text-base">
                  Section 2: Clinic & Pharmacy Cash Earnings Breakdown
                </h3>
              </div>
              <p className="text-xs text-slate-500">
                Clinic se kamaya gaya cash (OPD Consultation, Cards, Dispensing, Pharmacy Counter Sales).
              </p>
            </div>

            <div className="bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl text-right shrink-0">
              <div className="text-[9.5px] font-bold uppercase text-emerald-800">Total Gross Cash Revenue</div>
              <div className="text-base font-black text-emerald-950 font-mono">
                Rs. {pnlSummaryData.totalIncome.toLocaleString()}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Box A: Clinical OPD Revenue */}
            <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <h4 className="font-bold text-slate-900 text-xs flex items-center space-x-1.5">
                  <Stethoscope className="w-4 h-4 text-emerald-600" />
                  <span>Clinical OPD Inflows (Consultation & Direct Care)</span>
                </h4>
                <span className="text-xs font-black text-emerald-800 font-mono">
                  Rs. {pnlSummaryData.totalOpdIncome.toLocaleString()}
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center p-2 bg-white rounded-lg border border-slate-200/80">
                  <span className="text-slate-600">Doctor OPD Consultation & Checkup Fees:</span>
                  <span className="font-bold font-mono text-slate-900">Rs. {pnlSummaryData.opdConsultationFees.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-white rounded-lg border border-slate-200/80">
                  <span className="text-slate-600">Patient Card, File & Registration Fees:</span>
                  <span className="font-bold font-mono text-slate-900">Rs. {pnlSummaryData.opdCardFees.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-white rounded-lg border border-slate-200/80">
                  <span className="text-slate-600">Clinical Medicine Dispensing Charges:</span>
                  <span className="font-bold font-mono text-slate-900">Rs. {pnlSummaryData.opdDispensingFees.toLocaleString()}</span>
                </div>
                {pnlSummaryData.standaloneApptFees > 0 && (
                  <div className="flex justify-between items-center p-2 bg-white rounded-lg border border-slate-200/80">
                    <span className="text-slate-600">Reception & Standalone Token Fees:</span>
                    <span className="font-bold font-mono text-slate-900">Rs. {pnlSummaryData.standaloneApptFees.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between items-center p-2.5 bg-emerald-100/70 text-emerald-950 rounded-lg font-bold">
                  <span>Subtotal Clinical OPD Collection:</span>
                  <span className="font-mono text-sm font-black">Rs. {pnlSummaryData.totalOpdIncome.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Box B: Pharmacy & Other Incomes */}
            <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <h4 className="font-bold text-slate-900 text-xs flex items-center space-x-1.5">
                  <Building2 className="w-4 h-4 text-blue-600" />
                  <span>Pharmacy Counter Sales & Direct Incomes</span>
                </h4>
                <span className="text-xs font-black text-blue-800 font-mono">
                  Rs. {(pnlSummaryData.netPosIncome + pnlSummaryData.otherIncome).toLocaleString()}
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center p-2 bg-white rounded-lg border border-slate-200/80">
                  <span className="text-slate-600">Gross POS Pharmacy Counter Sales:</span>
                  <span className="font-bold font-mono text-slate-900">Rs. {pnlSummaryData.grossPosSales.toLocaleString()}</span>
                </div>
                {pnlSummaryData.totalSalesReturns > 0 && (
                  <div className="flex justify-between items-center p-2 bg-rose-50 text-rose-700 rounded-lg border border-rose-200/80">
                    <span>Less: Customer Sales Returns & Refunds:</span>
                    <span className="font-bold font-mono">- Rs. {pnlSummaryData.totalSalesReturns.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between items-center p-2 bg-white rounded-lg border border-slate-200/80">
                  <span className="text-slate-600">Net Realized Pharmacy Counter Cash:</span>
                  <span className="font-bold font-mono text-emerald-700">Rs. {pnlSummaryData.netPosIncome.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-white rounded-lg border border-slate-200/80">
                  <span className="text-slate-600">Other Direct Receipts / Capital Inflow:</span>
                  <span className="font-bold font-mono text-slate-900">Rs. {pnlSummaryData.otherIncome.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center p-2.5 bg-blue-100/70 text-blue-950 rounded-lg font-bold">
                  <span>Subtotal Pharmacy & Other Receipts:</span>
                  <span className="font-mono text-sm font-black">Rs. {(pnlSummaryData.netPosIncome + pnlSummaryData.otherIncome).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 3: DETAILED EXPENSES BREAKDOWN WITH GRAND TOTAL */}
      {/* ========================================================================= */}
      {(activeSubSection === 'all' || activeSubSection === 'expenses') && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-3">
            <div className="space-y-0.5">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 bg-rose-50 text-rose-700 rounded-lg">
                  <DollarSign className="w-4 h-4" />
                </div>
                <h3 className="font-black text-slate-900 text-base">
                  Section 3: Detailed Expenses Breakdown & Summary
                </h3>
              </div>
              <p className="text-xs text-slate-500">
                Kiya kiya expense keya ha uski complete tafseel with categories aur grand total.
              </p>
            </div>

            <div className="bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-xl text-right shrink-0">
              <div className="text-[9.5px] font-bold uppercase text-rose-800">Total Operating Expenses</div>
              <div className="text-base font-black text-rose-950 font-mono">
                Rs. {expenseSummary.totalExpense.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Category-wise Summary Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
            {Object.entries(expenseSummary.byCategory).map(([cat, amt]) => (
              <div key={cat} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                <div className="text-[10px] font-bold text-slate-500 uppercase truncate" title={cat}>{cat}</div>
                <div className="text-xs font-black text-slate-900 font-mono mt-0.5">Rs. {amt.toLocaleString()}</div>
              </div>
            ))}
          </div>

          {/* Search expense input */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={expenseSearch}
              onChange={e => setExpenseSearch(e.target.value)}
              placeholder="Search expenses by category, description, payee, or voucher ID..."
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-rose-500"
            />
          </div>

          {/* Detailed Expenses Table */}
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-900 text-white font-bold text-[11px] uppercase tracking-wider">
                  <th className="p-2.5">Date</th>
                  <th className="p-2.5">Voucher / ID</th>
                  <th className="p-2.5">Category</th>
                  <th className="p-2.5">Description / Purpose</th>
                  <th className="p-2.5">Payee / Vendor</th>
                  <th className="p-2.5 text-center">Payment Mode</th>
                  <th className="p-2.5 text-right">Amount (PKR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredExpenseList.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-6 text-center text-slate-400 italic">
                      No expense records recorded for the selected period.
                    </td>
                  </tr>
                ) : (
                  filteredExpenseList.map((exp, idx) => (
                    <tr
                      key={exp.ExpenseID || idx}
                      className={idx % 2 === 0 ? 'bg-white hover:bg-slate-50' : 'bg-slate-50/50 hover:bg-slate-100'}
                    >
                      <td className="p-2.5 font-mono text-slate-700 whitespace-nowrap">{exp.ExpenseDate || '—'}</td>
                      <td className="p-2.5 font-mono font-bold text-rose-700">{exp.ExpenseID || `EXP-${idx+1}`}</td>
                      <td className="p-2.5">
                        <span className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-800 text-[10px] font-bold border border-rose-200">
                          {exp.Category || 'General'}
                        </span>
                      </td>
                      <td className="p-2.5 text-slate-800 font-medium">{exp.Description || 'Clinic Expense'}</td>
                      <td className="p-2.5 text-slate-600">{exp.Payee || exp.VendorName || 'Self / Cashier'}</td>
                      <td className="p-2.5 text-center">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-mono">
                          {exp.PaymentMethod || 'Cash'}
                        </span>
                      </td>
                      <td className="p-2.5 text-right font-mono font-black text-rose-800">
                        Rs. {Number(exp.Amount || 0).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              <tfoot>
                <tr className="bg-slate-900 text-white font-black text-xs">
                  <td colSpan={6} className="p-3 text-right">
                    TOTAL OPERATIONAL EXPENSES ({filteredExpenseList.length} Entries):
                  </td>
                  <td className="p-3 text-right font-mono text-rose-300 text-sm">
                    Rs. {expenseSummary.totalExpense.toLocaleString()}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 4: CASH INFLOW & OUTFLOW COMPREHENSIVE STATEMENT */}
      {/* ========================================================================= */}
      {(activeSubSection === 'all' || activeSubSection === 'cashflow') && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-3">
            <div className="space-y-0.5">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 bg-indigo-50 text-indigo-700 rounded-lg">
                  <Scale className="w-4 h-4" />
                </div>
                <h3 className="font-black text-slate-900 text-base">
                  Section 4: Comprehensive Cash Inflow vs Outflow Statement
                </h3>
              </div>
              <p className="text-xs text-slate-500">
                Clinic mein aane wala cash (Inflows) aur istemal hone wala cash (Outflows) ka aamnay saamnay audit.
              </p>
            </div>

            <div className="flex items-center space-x-2 shrink-0">
              <div className="bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-lg text-right">
                <div className="text-[9px] font-bold uppercase text-emerald-800">Total Inflow</div>
                <div className="text-xs font-black text-emerald-950 font-mono">
                  Rs. {pnlSummaryData.totalIncome.toLocaleString()}
                </div>
              </div>
              <div className="bg-rose-50 border border-rose-200 px-3 py-1 rounded-lg text-right">
                <div className="text-[9px] font-bold uppercase text-rose-800">Total Outflow</div>
                <div className="text-xs font-black text-rose-950 font-mono">
                  Rs. {pnlSummaryData.totalExpenses.toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* INFLOWS COLUMN */}
            <div className="border border-emerald-200 rounded-xl overflow-hidden bg-emerald-50/20">
              <div className="bg-emerald-700 text-white p-3 flex justify-between items-center font-bold text-xs">
                <span className="flex items-center space-x-1.5">
                  <ArrowDownRight className="w-4 h-4 text-emerald-300" />
                  <span>CASH INFLOWS (Clinic Cash Received)</span>
                </span>
                <span className="font-mono font-black text-sm">Rs. {pnlSummaryData.totalIncome.toLocaleString()}</span>
              </div>
              <div className="p-4 space-y-2.5 text-xs">
                <div className="flex justify-between p-2.5 bg-white rounded-lg border border-emerald-100">
                  <span className="text-slate-700 font-medium">Doctor OPD Consultation Fees</span>
                  <span className="font-bold font-mono text-slate-900">Rs. {pnlSummaryData.opdConsultationFees.toLocaleString()}</span>
                </div>
                <div className="flex justify-between p-2.5 bg-white rounded-lg border border-emerald-100">
                  <span className="text-slate-700 font-medium">Card, File & Registration Charges</span>
                  <span className="font-bold font-mono text-slate-900">Rs. {pnlSummaryData.opdCardFees.toLocaleString()}</span>
                </div>
                <div className="flex justify-between p-2.5 bg-white rounded-lg border border-emerald-100">
                  <span className="text-slate-700 font-medium">Clinic Medicine Dispensing Charges</span>
                  <span className="font-bold font-mono text-slate-900">Rs. {pnlSummaryData.opdDispensingFees.toLocaleString()}</span>
                </div>
                <div className="flex justify-between p-2.5 bg-white rounded-lg border border-emerald-100">
                  <span className="text-slate-700 font-medium">Pharmacy POS Net Cash Sales</span>
                  <span className="font-bold font-mono text-slate-900">Rs. {pnlSummaryData.netPosIncome.toLocaleString()}</span>
                </div>
                <div className="flex justify-between p-2.5 bg-white rounded-lg border border-emerald-100">
                  <span className="text-slate-700 font-medium">Other Direct Incomes & Receipts</span>
                  <span className="font-bold font-mono text-slate-900">Rs. {pnlSummaryData.otherIncome.toLocaleString()}</span>
                </div>
                <div className="pt-2">
                  <div className="flex justify-between p-3 bg-emerald-600 text-white rounded-lg font-black text-xs shadow-2xs">
                    <span>TOTAL CASH INFLOWS</span>
                    <span className="font-mono">Rs. {pnlSummaryData.totalIncome.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* OUTFLOWS COLUMN */}
            <div className="border border-rose-200 rounded-xl overflow-hidden bg-rose-50/20">
              <div className="bg-rose-700 text-white p-3 flex justify-between items-center font-bold text-xs">
                <span className="flex items-center space-x-1.5">
                  <ArrowUpRight className="w-4 h-4 text-rose-300" />
                  <span>CASH OUTFLOWS (Cash Paid / Disbursed)</span>
                </span>
                <span className="font-mono font-black text-sm">Rs. {pnlSummaryData.totalExpenses.toLocaleString()}</span>
              </div>
              <div className="p-4 space-y-2.5 text-xs">
                <div className="flex justify-between p-2.5 bg-white rounded-lg border border-rose-100">
                  <div>
                    <div className="text-slate-700 font-medium">Medicine Purchases & Vendor Procurements</div>
                    <div className="text-[10px] text-slate-400">Spot Cash: Rs. {pnlSummaryData.vendorCashPayments.toLocaleString()} | Credit Paid: Rs. {pnlSummaryData.vendorCreditPayments.toLocaleString()}</div>
                  </div>
                  <span className="font-bold font-mono text-slate-900">Rs. {pnlSummaryData.vendorOutflows.toLocaleString()}</span>
                </div>
                <div className="flex justify-between p-2.5 bg-white rounded-lg border border-rose-100">
                  <span className="text-slate-700 font-medium">Staff Salaries & Payroll Disbursed</span>
                  <span className="font-bold font-mono text-slate-900">Rs. {pnlSummaryData.salaryOutflows.toLocaleString()}</span>
                </div>
                <div className="flex justify-between p-2.5 bg-white rounded-lg border border-rose-100">
                  <div>
                    <div className="text-slate-700 font-medium">Operational, Clinic & Building Expenses</div>
                    <div className="text-[10px] text-slate-400">Rent, Bills, Maintenance, Clinic Consumables</div>
                  </div>
                  <span className="font-bold font-mono text-slate-900">Rs. {pnlSummaryData.totalOperatingExpenses.toLocaleString()}</span>
                </div>
                <div className="pt-2">
                  <div className="flex justify-between p-3 bg-rose-600 text-white rounded-lg font-black text-xs shadow-2xs">
                    <span>TOTAL CASH OUTFLOWS</span>
                    <span className="font-mono">Rs. {pnlSummaryData.totalExpenses.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 5: FINAL NET PROFIT & LOSS STATEMENT & CASH UTILIZATION */}
      {/* ========================================================================= */}
      {(activeSubSection === 'all' || activeSubSection === 'pnl') && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-5 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-3">
            <div className="space-y-0.5">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 bg-amber-50 text-amber-700 rounded-lg">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <h3 className="font-black text-slate-900 text-base">
                  Section 5: Final Net Profit & Loss (P&L) & Cash Utilization Flow
                </h3>
              </div>
              <p className="text-xs text-slate-500">
                Clinical cash kahan kahan use hone ke bad kitna cash aap ka asal munafa (profit) hai.
              </p>
            </div>

            <div className={`px-4 py-2 rounded-xl text-right border ${
              pnlSummaryData.netProfit >= 0 ? 'bg-emerald-50 border-emerald-300 text-emerald-950' : 'bg-rose-50 border-rose-300 text-rose-950'
            }`}>
              <div className="text-[9.5px] font-black uppercase tracking-wider">
                {pnlSummaryData.netProfit >= 0 ? '✓ Net Operational Profit' : '⚠️ Net Operating Deficit'}
              </div>
              <div className="text-lg font-black font-mono">
                Rs. {pnlSummaryData.netProfit.toLocaleString()}
              </div>
            </div>
          </div>

          {/* CASH UTILIZATION VISUAL BREAKDOWN BAR */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-extrabold text-slate-800 flex items-center space-x-1.5">
                <PieChart className="w-4 h-4 text-indigo-600" />
                <span>Cash Drainage & Utilization Flow (Kahan Kahan Cash Istemal Huwa)</span>
              </span>
              <span className="font-mono text-slate-500 font-bold">Total Inflow: Rs. {pnlSummaryData.totalIncome.toLocaleString()}</span>
            </div>

            {/* Visual multi-segment bar */}
            <div className="h-6 w-full rounded-xl overflow-hidden flex bg-slate-200 border border-slate-300 shadow-inner">
              <div
                style={{ width: `${vendorPct}%` }}
                className="bg-indigo-600 transition-all text-white text-[10px] font-bold flex items-center justify-center overflow-hidden"
                title={`Medicine Procurements: Rs. ${pnlSummaryData.vendorOutflows.toLocaleString()} (${vendorPct.toFixed(1)}%)`}
              >
                {vendorPct > 8 && `${vendorPct.toFixed(0)}% Stock`}
              </div>
              <div
                style={{ width: `${salaryPct}%` }}
                className="bg-purple-600 transition-all text-white text-[10px] font-bold flex items-center justify-center overflow-hidden"
                title={`Staff Salaries: Rs. ${pnlSummaryData.salaryOutflows.toLocaleString()} (${salaryPct.toFixed(1)}%)`}
              >
                {salaryPct > 8 && `${salaryPct.toFixed(0)}% Salary`}
              </div>
              <div
                style={{ width: `${operationalExpensePct}%` }}
                className="bg-rose-500 transition-all text-white text-[10px] font-bold flex items-center justify-center overflow-hidden"
                title={`Operational Expenses: Rs. ${pnlSummaryData.totalOperatingExpenses.toLocaleString()} (${operationalExpensePct.toFixed(1)}%)`}
              >
                {operationalExpensePct > 8 && `${operationalExpensePct.toFixed(0)}% Ops`}
              </div>
              <div
                style={{ width: `${netProfitPct}%` }}
                className="bg-emerald-500 transition-all text-white text-[10px] font-bold flex items-center justify-center overflow-hidden"
                title={`Net Profit / Surplus: Rs. ${pnlSummaryData.netProfit.toLocaleString()} (${netProfitPct.toFixed(1)}%)`}
              >
                {netProfitPct > 8 && `${netProfitPct.toFixed(0)}% Profit`}
              </div>
            </div>

            {/* Legend */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs pt-1">
              <div className="flex items-center space-x-2 bg-white p-2 rounded-lg border border-slate-200">
                <span className="w-3 h-3 rounded-full bg-indigo-600 shrink-0"></span>
                <div>
                  <span className="text-[10px] text-slate-500 font-bold block">Medicine Stock Restocking</span>
                  <span className="font-black text-slate-800 font-mono">Rs. {pnlSummaryData.vendorOutflows.toLocaleString()} ({vendorPct.toFixed(1)}%)</span>
                </div>
              </div>
              <div className="flex items-center space-x-2 bg-white p-2 rounded-lg border border-slate-200">
                <span className="w-3 h-3 rounded-full bg-purple-600 shrink-0"></span>
                <div>
                  <span className="text-[10px] text-slate-500 font-bold block">Staff Salaries & Payroll</span>
                  <span className="font-black text-slate-800 font-mono">Rs. {pnlSummaryData.salaryOutflows.toLocaleString()} ({salaryPct.toFixed(1)}%)</span>
                </div>
              </div>
              <div className="flex items-center space-x-2 bg-white p-2 rounded-lg border border-slate-200">
                <span className="w-3 h-3 rounded-full bg-rose-500 shrink-0"></span>
                <div>
                  <span className="text-[10px] text-slate-500 font-bold block">Clinic Bills, Rent & Ops</span>
                  <span className="font-black text-slate-800 font-mono">Rs. {pnlSummaryData.totalOperatingExpenses.toLocaleString()} ({operationalExpensePct.toFixed(1)}%)</span>
                </div>
              </div>
              <div className="flex items-center space-x-2 bg-white p-2 rounded-lg border border-emerald-300 bg-emerald-50/50">
                <span className="w-3 h-3 rounded-full bg-emerald-500 shrink-0"></span>
                <div>
                  <span className="text-[10px] text-emerald-700 font-bold block">★ Net Retained Profit</span>
                  <span className="font-black text-emerald-950 font-mono">Rs. {pnlSummaryData.netProfit.toLocaleString()} ({netProfitPct.toFixed(1)}%)</span>
                </div>
              </div>
            </div>
          </div>

          {/* FINAL P&L CALCULATION AUDIT CARD */}
          <div className="border border-slate-300 rounded-xl overflow-hidden bg-slate-50/60">
            <div className="bg-slate-900 text-white p-3 font-bold text-xs uppercase tracking-wider flex justify-between items-center">
              <span>Executive Profit & Loss Ledger Audit</span>
              <span className="text-emerald-400 font-mono">Net Margin: {pnlSummaryData.netMarginPct.toFixed(1)}%</span>
            </div>

            <div className="p-4 space-y-2 text-xs">
              <div className="flex justify-between items-center p-2.5 bg-white rounded-lg border border-slate-200">
                <span className="font-bold text-slate-800">1. Total Clinic & Pharmacy Gross Revenue:</span>
                <span className="font-black font-mono text-emerald-700 text-sm">Rs. {pnlSummaryData.totalIncome.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center p-2.5 bg-white rounded-lg border border-slate-200">
                <span className="text-slate-600">2. Less: Cost of Goods Sold (COGS) for Medicines Dispensed/Sold:</span>
                <span className="font-bold font-mono text-slate-800">- Rs. {pnlSummaryData.pharmacyCogs.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center p-2.5 bg-emerald-50 text-emerald-950 rounded-lg font-bold border border-emerald-200">
                <span>3. Gross Realized Operational Profit (Margin):</span>
                <span className="font-mono text-sm">Rs. {(pnlSummaryData.totalIncome - pnlSummaryData.pharmacyCogs).toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center p-2.5 bg-white rounded-lg border border-slate-200">
                <span className="text-slate-600">4. Less: Total Operating Expenses (Rent, Bills, Maintenance, Tea):</span>
                <span className="font-bold font-mono text-rose-700">- Rs. {pnlSummaryData.totalOperatingExpenses.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center p-2.5 bg-white rounded-lg border border-slate-200">
                <span className="text-slate-600">5. Less: Staff Salaries & Payroll Disbursements:</span>
                <span className="font-bold font-mono text-rose-700">- Rs. {pnlSummaryData.salaryOutflows.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center p-2.5 bg-white rounded-lg border border-slate-200">
                <span className="text-slate-600">6. Less: Direct Medicine Stock Procurement Outflows:</span>
                <span className="font-bold font-mono text-rose-700">- Rs. {pnlSummaryData.vendorOutflows.toLocaleString()}</span>
              </div>

              {/* FINAL NET RESULT BANNER */}
              <div className={`p-4 rounded-xl border flex flex-col sm:flex-row items-center justify-between gap-3 text-white shadow-md mt-4 ${
                pnlSummaryData.netProfit >= 0
                  ? 'bg-gradient-to-r from-emerald-800 via-teal-900 to-slate-900 border-emerald-600'
                  : 'bg-gradient-to-r from-rose-800 via-amber-900 to-slate-900 border-rose-600'
              }`}>
                <div>
                  <div className="text-[10px] font-black uppercase tracking-wider text-emerald-300">
                    Aap Ka Asal Net Profit / Cash Surplus
                  </div>
                  <div className="text-2xl font-black font-mono mt-0.5">
                    {pnlSummaryData.netProfit >= 0
                      ? `NET PROFIT: Rs. ${pnlSummaryData.netProfit.toLocaleString()}`
                      : `NET DEFICIT: - Rs. ${Math.abs(pnlSummaryData.netProfit).toLocaleString()}`}
                  </div>
                  <div className="text-[11px] text-slate-300 mt-0.5">
                    Tamam clinical aur pharmacy ikhrajat nikalne ke bad asal bachat.
                  </div>
                </div>

                <button
                  onClick={onPrintReport}
                  className="px-5 py-2.5 bg-white text-slate-900 hover:bg-slate-100 font-black text-xs rounded-xl shadow transition flex items-center space-x-2 cursor-pointer shrink-0"
                >
                  <Printer className="w-4 h-4 text-emerald-700" />
                  <span>Print Official A4 Report</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
