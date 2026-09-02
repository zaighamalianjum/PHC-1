import React from 'react';
import {
  DollarSign, Printer, ArrowUpRight, ArrowDownRight, TrendingUp,
  Search, Calendar, Filter, Plus, Landmark, Wallet, Coins, FileText, Trash2
} from 'lucide-react';
import { DEFAULT_EXPENSE_CATEGORIES } from '../erpUtils';

interface CashBookPnlTabProps {
  cashBookDateFilter: 'today' | 'this_week' | 'this_month' | 'fiscal_month' | 'fiscal_year' | 'custom';
  setCashBookDateFilter: (val: any) => void;
  cashBookStartDate: string;
  setCashBookStartDate: (val: string) => void;
  cashBookEndDate: string;
  setCashBookEndDate: (val: string) => void;
  cashBookCategoryFilter: string;
  setCashBookCategoryFilter: (val: any) => void;
  cashBookSearch: string;
  setCashBookSearch: (val: string) => void;
  selectedFiscalYear: string;
  handleFiscalYearSelect: (val: string) => void;
  selectedFiscalMonth: string;
  handleFiscalMonthSelect: (val: string) => void;
  fiscalYearOptions: any[];
  monthOptions: any[];
  handleQuickPresetChange: (preset: any) => void;
  cashBookMetrics: any;
  filteredCashBookEntries: any[];
  quickOutflowForm: any;
  setQuickOutflowForm: (val: any) => void;
  handleQuickOutflowSubmit: (e: React.FormEvent) => void;
  isSubmitting: boolean;
  handlePrintCashBookReport: () => void;
  customExpenseCategories: string[];
  handleDeleteCashBookEntry?: (entry: any) => void;
}

export const CashBookPnlTab: React.FC<CashBookPnlTabProps> = ({
  cashBookDateFilter,
  setCashBookDateFilter,
  cashBookStartDate,
  setCashBookStartDate,
  cashBookEndDate,
  setCashBookEndDate,
  cashBookCategoryFilter,
  setCashBookCategoryFilter,
  cashBookSearch,
  setCashBookSearch,
  selectedFiscalYear,
  handleFiscalYearSelect,
  selectedFiscalMonth,
  handleFiscalMonthSelect,
  fiscalYearOptions,
  monthOptions,
  handleQuickPresetChange,
  cashBookMetrics,
  filteredCashBookEntries,
  quickOutflowForm,
  setQuickOutflowForm,
  handleQuickOutflowSubmit,
  isSubmitting,
  handlePrintCashBookReport,
  customExpenseCategories,
  handleDeleteCashBookEntry
}) => {
  const currentYear = new Date().getFullYear().toString();
  const currentYearMonth = new Date().toISOString().slice(0, 7);
  return (
        <div className="space-y-6">
          {/* Header Banner & Print Button */}
          <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white p-5 rounded-2xl shadow-md border border-purple-800/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2">
                <Landmark className="w-6 h-6 text-amber-400" />
                <h2 className="text-xl font-extrabold tracking-tight">Clinic Daily Cash Book & P&L Ledger</h2>
              </div>
              <p className="text-xs text-purple-200 mt-1">
                Real-time tracking of Patient Collections (OPD Tokens, Clinical Meds, Pharmacy) vs Operating Outflows (Staff Salaries, Building Rent, Electricity Bills & Medicine Purchases).
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={handlePrintCashBookReport}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-md transition flex items-center space-x-1.5 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Print Cash Book Statement</span>
              </button>
            </div>
          </div>

          {/* Executive KPI Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Total Inflow */}
            <div className="bg-emerald-950/20 border border-emerald-500/30 p-4 rounded-2xl bg-white shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider flex items-center">
                  <ArrowUpRight className="w-4 h-4 text-emerald-600 mr-1" />
                  Total Cash Collections (Inflow)
                </span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-extrabold px-2 py-0.5 rounded-full">
                  Income
                </span>
              </div>
              <div className="text-2xl font-black text-emerald-700 font-mono">
                PKR {(cashBookMetrics?.totalInflow || 0).toLocaleString()}
              </div>
              <div className="text-[11px] text-slate-600 pt-1 border-t border-emerald-100 grid grid-cols-2 gap-1 font-medium">
                <span>OPD Tokens: <strong>{(cashBookMetrics?.opdInflow || 0).toLocaleString()}</strong></span>
                <span>Clinical Meds: <strong>{(cashBookMetrics?.clinicalInflow || 0).toLocaleString()}</strong></span>
                <span>Store Pharmacy: <strong>{(cashBookMetrics?.storeInflow || 0).toLocaleString()}</strong></span>
                <span>Cards & Reg: <strong>{(cashBookMetrics?.regInflow || 0).toLocaleString()}</strong></span>
              </div>
            </div>

            {/* Total Outflow */}
            <div className="bg-rose-950/20 border border-rose-500/30 p-4 rounded-2xl bg-white shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-rose-800 uppercase tracking-wider flex items-center">
                  <ArrowDownRight className="w-4 h-4 text-rose-600 mr-1" />
                  Total Outflows & Deductions
                </span>
                <span className="text-[10px] bg-rose-100 text-rose-800 font-extrabold px-2 py-0.5 rounded-full">
                  Expenses
                </span>
              </div>
              <div className="text-2xl font-black text-rose-700 font-mono">
                PKR {(cashBookMetrics?.totalOutflow || 0).toLocaleString()}
              </div>
              <div className="text-[11px] text-slate-600 pt-1 border-t border-rose-100 grid grid-cols-2 gap-1 font-medium">
                <span>Salaries Paid: <strong>{(cashBookMetrics?.salariesOutflow || 0).toLocaleString()}</strong></span>
                <span>Building Rent: <strong>{(cashBookMetrics?.rentOutflow || 0).toLocaleString()}</strong></span>
                <span>Electricity/Bills: <strong>{(cashBookMetrics?.billsOutflow || 0).toLocaleString()}</strong></span>
                <span>Meds Purchase: <strong>{(cashBookMetrics?.medicinePurchasesOutflow || 0).toLocaleString()}</strong></span>
              </div>
            </div>

            {/* Net Operating Profit / Balance */}
            <div className={`border p-4 rounded-2xl bg-white shadow-xs space-y-2 ${(cashBookMetrics?.netBalance || 0) >= 0 ? 'bg-purple-50/50 border-purple-300' : 'bg-red-50/50 border-red-300'}`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-purple-950 uppercase tracking-wider flex items-center">
                  <Wallet className="w-4 h-4 text-purple-700 mr-1" />
                  Net Cash Profit / Remaining Balance
                </span>
                <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${(cashBookMetrics?.netBalance || 0) >= 0 ? 'bg-purple-200 text-purple-900' : 'bg-red-200 text-red-900'}`}>
                  {cashBookMetrics?.marginPercent || 0}% Net Margin
                </span>
              </div>
              <div className={`text-2xl font-black font-mono ${(cashBookMetrics?.netBalance || 0) >= 0 ? 'text-purple-950' : 'text-red-700'}`}>
                PKR {(cashBookMetrics?.netBalance || 0).toLocaleString()}
              </div>
              <p className="text-[11px] text-slate-600 pt-1 border-t border-purple-200 font-medium leading-tight">
                Net remaining liquidity available in clinic cash box after deducting all operational overheads and salaries.
              </p>
            </div>
          </div>

          {/* Quick Record Outflow / Expense Form Section */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center">
                <Coins className="w-4 h-4 text-rose-600 mr-1.5" />
                Quick Outflow Logger (Rent, Salaries, Electricity Bills & Purchases)
              </h3>
              <span className="text-[11px] text-slate-500 font-medium">Instantly record any clinic cash deduction</span>
            </div>

            <form onSubmit={handleQuickOutflowSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-end">
              <div className="lg:col-span-3 space-y-1">
                <label className="text-xs font-bold text-slate-700">Outflow Category</label>
                <select
                  value={quickOutflowForm.category}
                  onChange={(e) => setQuickOutflowForm({ ...quickOutflowForm, category: e.target.value })}
                  className="w-full text-xs font-medium p-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                >
                  <option value="Building Rent & Maintenance">Building Rent & Maintenance</option>
                  <option value="Staff Salary & Payroll">Staff Salary & Payroll</option>
                  <option value="Electricity & Utility Bills">Electricity & Utility Bills</option>
                  <option value="Medicine Stock Purchase">Medicine Stock Purchase</option>
                  <option value="Tea, Refreshment & Pantry">Tea, Refreshment & Pantry</option>
                  <option value="Repair & Clinic Upkeep">Repair & Clinic Upkeep</option>
                  <option value="Miscellaneous Overhead">Miscellaneous Overhead</option>
                </select>
              </div>

              <div className="lg:col-span-2 space-y-1">
                <label className="text-xs font-bold text-slate-700">Amount (PKR)</label>
                <input
                  type="number"
                  placeholder=""
                  value={quickOutflowForm.amount}
                  onChange={(e) => setQuickOutflowForm({ ...quickOutflowForm, amount: e.target.value })}
                  required
                  className="w-full text-xs font-bold font-mono p-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="lg:col-span-2 space-y-1">
                <label className="text-xs font-bold text-slate-700">Paid To / Payee</label>
                <input
                  type="text"
                  placeholder=""
                  value={quickOutflowForm.payee}
                  onChange={(e) => setQuickOutflowForm({ ...quickOutflowForm, payee: e.target.value })}
                  className="w-full text-xs font-medium p-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="lg:col-span-2 space-y-1">
                <label className="text-xs font-bold text-slate-700">Payment Date</label>
                <input
                  type="date"
                  value={quickOutflowForm.date}
                  onChange={(e) => setQuickOutflowForm({ ...quickOutflowForm, date: e.target.value })}
                  className="w-full text-xs font-medium p-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="lg:col-span-2 space-y-1">
                <label className="text-xs font-bold text-purple-900 flex items-center gap-1">
                  <span>P&amp;L Month</span>
                </label>
                <input
                  type="month"
                  value={quickOutflowForm.accountingMonth || (quickOutflowForm.date ? quickOutflowForm.date.slice(0, 7) : new Date().toISOString().slice(0, 7))}
                  onChange={(e) => setQuickOutflowForm({ ...quickOutflowForm, accountingMonth: e.target.value })}
                  className="w-full text-xs font-black p-2 bg-purple-50/70 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-purple-950 font-mono"
                />
              </div>

              <div className="lg:col-span-3">
                <button
                  type="submit"
                  className="w-full py-2 px-3 bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs rounded-lg shadow-xs transition flex items-center justify-center space-x-1 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Deduct Outflow Payment</span>
                </button>
              </div>
            </form>
          </div>

          {/* Filter Toolbar & Ledger Controls */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3">
              {/* Period Quick Filters & Fiscal Dropdowns */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex flex-wrap items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
                  {[
                    { id: 'today', label: '☀️ Daily' },
                    { id: 'this_week', label: '📅 Weekly' },
                    { id: 'this_month', label: '📊 This Month' },
                    { id: 'this_year', label: `📈 CY ${currentYear}` },
                    { id: 'all_time', label: '🌐 All Time' }
                  ].map(p => (
                    <button
                      key={p.id}
                      onClick={() => handleQuickPresetChange(p.id as any)}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                        cashBookDateFilter === p.id && selectedFiscalMonth === (p.id === 'this_month' ? currentYearMonth : 'all')
                          ? 'bg-purple-900 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>

                {/* Year Dropdown */}
                <div className="flex items-center space-x-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 h-8.5 shadow-2xs">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Year:</span>
                  <select
                    value={selectedFiscalYear}
                    onChange={e => handleFiscalYearSelect(e.target.value)}
                    className="text-xs font-bold text-slate-800 bg-transparent focus:outline-hidden cursor-pointer font-mono"
                  >
                    {fiscalYearOptions.map(fy => (
                      <option key={fy.key} value={fy.key}>
                        {fy.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Month Dropdown */}
                <div className="flex items-center space-x-1.5 bg-purple-50/80 border border-purple-300 rounded-xl px-2.5 h-8.5 shadow-2xs">
                  <span className="text-[10px] font-black text-purple-950 uppercase tracking-wider">Month:</span>
                  <select
                    value={selectedFiscalMonth}
                    onChange={e => handleFiscalMonthSelect(e.target.value)}
                    className="text-xs font-black text-purple-900 bg-transparent focus:outline-hidden cursor-pointer font-mono"
                  >
                    <option value="all">📅 All Months (Full Period)</option>
                    {monthOptions.map(m => (
                      <option key={m.value} value={m.value}>
                        📅 {m.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-2 w-full xl:w-auto">
                {/* Type Category Filter */}
                <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl border border-slate-200 w-full sm:w-auto">
                  {[
                    { id: 'ALL', label: 'All Transactions' },
                    { id: 'INFLOW', label: 'Inflows Only' },
                    { id: 'OUTFLOW', label: 'Outflows Only' }
                  ].map(c => (
                    <button
                      key={c.id}
                      onClick={() => setCashBookCategoryFilter(c.id as any)}
                      className={`px-3 py-1 text-xs font-bold rounded-lg transition cursor-pointer flex-1 sm:flex-none ${
                        cashBookCategoryFilter === c.id
                          ? 'bg-slate-800 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>

                {/* Search Box */}
                <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder=""
                  value={cashBookSearch}
                  onChange={(e) => setCashBookSearch(e.target.value)}
                  className="w-full text-xs font-medium pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
          </div>

            {/* Custom Range Date Pickers */}
            {cashBookDateFilter === 'custom' && (
              <div className="pt-2.5 border-t border-slate-100 flex flex-wrap items-center gap-3">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-slate-700">From Date:</span>
                  <input
                    type="date"
                    value={cashBookStartDate}
                    onChange={(e) => setCashBookStartDate(e.target.value)}
                    className="text-xs font-bold p-1.5 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-slate-700">To Date:</span>
                  <input
                    type="date"
                    value={cashBookEndDate}
                    onChange={(e) => setCashBookEndDate(e.target.value)}
                    className="text-xs font-bold p-1.5 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>
            )}

            {/* Period Operational Stats Pill Bar */}
            <div className="pt-2 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-medium">
              <div className="bg-purple-50/70 border border-purple-100 p-2 rounded-xl text-center">
                <span className="text-[10px] font-bold text-purple-800 uppercase block">Operating Days</span>
                <span className="text-sm font-black text-purple-950 font-mono">{cashBookMetrics.activeDaysCount} Days</span>
              </div>
              <div className="bg-emerald-50/70 border border-emerald-100 p-2 rounded-xl text-center">
                <span className="text-[10px] font-bold text-emerald-800 uppercase block">Daily Avg Inflow</span>
                <span className="text-sm font-black text-emerald-900 font-mono">Rs. {(cashBookMetrics?.dailyAvgInflow || 0).toLocaleString()}</span>
              </div>
              <div className="bg-rose-50/70 border border-rose-100 p-2 rounded-xl text-center">
                <span className="text-[10px] font-bold text-rose-800 uppercase block">Daily Avg Outflow</span>
                <span className="text-sm font-black text-rose-900 font-mono">Rs. {(cashBookMetrics?.dailyAvgOutflow || 0).toLocaleString()}</span>
              </div>
              <div className="bg-indigo-50/70 border border-indigo-100 p-2 rounded-xl text-center">
                <span className="text-[10px] font-bold text-indigo-800 uppercase block">Daily Net Retention</span>
                <span className="text-sm font-black text-indigo-950 font-mono">Rs. {(cashBookMetrics?.dailyAvgNet || 0).toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Cash Book Ledger Table */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
            <div className="px-5 py-3 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="text-xs font-extrabold uppercase tracking-wider flex items-center">
                <FileText className="w-4 h-4 text-amber-400 mr-2" />
                Cash Book Transaction Ledger Records ({filteredCashBookEntries.length})
              </h3>
              <span className="text-[11px] text-slate-400 font-mono">Real-time synchronized with Patient Desk & ERP</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[10px]">
                    <th className="p-3 text-center w-12">#</th>
                    <th className="p-3 w-28">Date</th>
                    <th className="p-3 w-28">Ref #</th>
                    <th className="p-3">Particulars / Description</th>
                    <th className="p-3 w-40">Category</th>
                    <th className="p-3 text-center w-24">Type</th>
                    <th className="p-3 text-right w-32">Amount (PKR)</th>
                    <th className="p-3 text-center w-14">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {filteredCashBookEntries.length > 0 ? (
                    filteredCashBookEntries.map((e, idx) => (
                      <tr key={e.id} className="hover:bg-slate-50/80 transition">
                        <td className="p-3 text-center font-bold text-slate-400 font-mono text-[11px]">{idx + 1}</td>
                        <td className="p-3 font-mono text-[11px] text-slate-600">{e.date}</td>
                        <td className="p-3 font-mono font-bold text-purple-950 text-[11px]">{e.ref}</td>
                        <td className="p-3 font-bold text-slate-900">{e.particulars}</td>
                        <td className="p-3 font-medium text-slate-600">
                          <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px] font-bold border border-slate-200">
                            {e.category}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          {e.type === 'INFLOW' ? (
                            <span className="bg-emerald-100 text-emerald-800 font-black text-[10px] px-2 py-0.5 rounded-full border border-emerald-300 inline-flex items-center">
                              <ArrowUpRight className="w-3 h-3 mr-0.5" />
                              INFLOW
                            </span>
                          ) : (
                            <span className="bg-rose-100 text-rose-800 font-black text-[10px] px-2 py-0.5 rounded-full border border-rose-300 inline-flex items-center">
                              <ArrowDownRight className="w-3 h-3 mr-0.5" />
                              OUTFLOW
                            </span>
                          )}
                        </td>
                        <td className={`p-3 text-right font-mono font-black text-sm ${e.type === 'INFLOW' ? 'text-emerald-700' : 'text-rose-700'}`}>
                          {e.type === 'INFLOW' ? '+' : '-'} PKR {(e.amount || 0).toLocaleString()}
                        </td>
                        <td className="p-3 text-center">
                          {handleDeleteCashBookEntry ? (
                            <button
                              type="button"
                              onClick={() => handleDeleteCashBookEntry(e)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer inline-flex items-center justify-center"
                              title={`Delete entry: ${e.ref || e.id} (${e.particulars})`}
                              aria-label={`Delete Cash Book Entry ${e.ref || e.id}`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          ) : null}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-400 font-medium">
                        No financial records found matching the current filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
    
  );
};

export default CashBookPnlTab;
