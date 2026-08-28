import React from 'react';
import {
  Building2, Users, ShoppingCart, DollarSign, Plus, CheckCircle2,
  TrendingUp, TrendingDown, FileSpreadsheet, PackageCheck,
  CreditCard, UserPlus, FileText, Boxes, ArrowUpRight, ArrowDownRight,
  Wallet, History, Landmark, Receipt
} from 'lucide-react';
import {
  ErpVendor, ErpPurchaseOrder, ErpGrn, ErpTransaction,
  ErpEmployee, ErpPayroll, ErpExpense, ErpAsset
} from '../../../types';

interface OverviewTabProps {
  vendors: ErpVendor[];
  purchaseOrders: ErpPurchaseOrder[];
  grns: ErpGrn[];
  transactions: ErpTransaction[];
  employees: ErpEmployee[];
  payrolls: ErpPayroll[];
  expenses: ErpExpense[];
  assets: ErpAsset[];
  cashBookMetrics: any;
  cashBookDateFilter?: string;
  cashBookEntries?: any[];
  setActiveTab: (tab: any) => void;
  handleOpenAddVendor: () => void;
  handleOpenNewPoModal: (targetVendor?: ErpVendor) => void;
  handleOpenGrnForPo: (targetPo?: ErpPurchaseOrder) => void;
  setShowTxnModal: (show: boolean) => void;
  setShowExpenseModal: (show: boolean) => void;
  setShowEmpModal: (show: boolean) => void;
  setShowPayrollModal: (show: boolean) => void;
  setShowAssetModal: (show: boolean) => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  vendors,
  purchaseOrders,
  grns,
  transactions,
  employees,
  payrolls,
  expenses,
  assets,
  cashBookMetrics,
  cashBookDateFilter = 'today',
  cashBookEntries = [],
  setActiveTab,
  handleOpenAddVendor,
  handleOpenNewPoModal,
  handleOpenGrnForPo,
  setShowTxnModal,
  setShowExpenseModal,
  setShowEmpModal,
  setShowPayrollModal,
  setShowAssetModal,
}) => {
  const totalVendorBalance = vendors.reduce((sum, v) => sum + (v.Balance || 0), 0);
  const totalIncome = cashBookMetrics.totalInflow || 0;
  const totalExpenseTxns = cashBookMetrics.totalOutflow || 0;
  const netOperatingProfit = cashBookMetrics.netBalance || 0;
  const totalAssetValuation = assets.reduce((sum, a) => sum + (a.CurrentValue || 0), 0);
  const totalMonthlyPayroll = payrolls.reduce((sum, p) => sum + (p.NetSalary || 0), 0);

  return (
    <div className="space-y-6">
      {/* KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500">Total Income Receipts</p>
            <h3 className="text-2xl font-black text-emerald-600 mt-1">Rs. {(totalIncome || 0).toLocaleString()}</h3>
            <p className="text-[10px] text-slate-400 mt-1">OPD, Dispensary & Pharmacy Sales</p>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500">Total Outflow / Expenses</p>
            <h3 className="text-2xl font-black text-rose-600 mt-1">Rs. {(totalExpenseTxns || 0).toLocaleString()}</h3>
            <p className="text-[10px] text-slate-400 mt-1">Utilities, Rent, Salaries & Purchases</p>
          </div>
          <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
            <TrendingDown className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500">Net Cash Balance</p>
            <h3 className={`text-2xl font-black mt-1 ${netOperatingProfit >= 0 ? 'text-indigo-600' : 'text-rose-600'}`}>
              Rs. {(netOperatingProfit || 0).toLocaleString()}
            </h3>
            <p className="text-[10px] text-slate-400 mt-1">Margin: {cashBookMetrics?.marginPercent || 0}%</p>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <Landmark className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500">Vendor Payables</p>
            <h3 className="text-2xl font-black text-amber-600 mt-1">Rs. {(totalVendorBalance || 0).toLocaleString()}</h3>
            <p className="text-[10px] text-slate-400 mt-1">{vendors.length} Active Distributors</p>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <Building2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500">Fixed Asset Valuation</p>
            <h3 className="text-2xl font-black text-slate-800 mt-1">Rs. {(totalAssetValuation || 0).toLocaleString()}</h3>
            <p className="text-[10px] text-slate-400 mt-1">{assets.length} Equipment & Fixtures</p>
          </div>
          <div className="p-3 bg-slate-100 text-slate-700 rounded-xl">
            <Boxes className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* REVENUE & EXPENSE STRUCTURE BREAKDOWN */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Income Stream Composition */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center">
              <TrendingUp className="w-4 h-4 text-emerald-600 mr-1.5" />
              Income Streams Composition ({cashBookDateFilter === 'today' ? 'Daily' : cashBookDateFilter === 'this_week' ? 'Weekly' : cashBookDateFilter === 'this_month' ? 'Monthly' : cashBookDateFilter === 'this_year' ? 'Yearly' : 'Selected Scope'})
            </h3>
            <span className="text-xs font-black font-mono text-emerald-700">Rs. {(cashBookMetrics?.totalInflow || 0).toLocaleString()}</span>
          </div>

          <div className="space-y-2.5 text-xs font-medium">
            <div>
              <div className="flex justify-between text-slate-700 mb-1">
                <span>OPD Consultation Tokens</span>
                <span className="font-bold font-mono">Rs. {(cashBookMetrics?.opdInflow || 0).toLocaleString()} ({(cashBookMetrics?.totalInflow || 0) > 0 ? (((cashBookMetrics?.opdInflow || 0) / (cashBookMetrics?.totalInflow || 1)) * 100).toFixed(0) : 0}%)</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${(cashBookMetrics?.totalInflow || 0) > 0 ? (((cashBookMetrics?.opdInflow || 0) / (cashBookMetrics?.totalInflow || 1)) * 100) : 0}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-slate-700 mb-1">
                <span>Dispensary & Pharmacy Revenue</span>
                <span className="font-bold font-mono">Rs. {(cashBookMetrics?.dispensaryInflow || 0).toLocaleString()} ({(cashBookMetrics?.totalInflow || 0) > 0 ? (((cashBookMetrics?.dispensaryInflow || 0) / (cashBookMetrics?.totalInflow || 1)) * 100).toFixed(0) : 0}%)</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-teal-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${(cashBookMetrics?.totalInflow || 0) > 0 ? (((cashBookMetrics?.dispensaryInflow || 0) / (cashBookMetrics?.totalInflow || 1)) * 100) : 0}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-slate-700 mb-1">
                <span>Other Miscellaneous Collections</span>
                <span className="font-bold font-mono">Rs. {(cashBookMetrics?.otherInflow || 0).toLocaleString()} ({(cashBookMetrics?.totalInflow || 0) > 0 ? (((cashBookMetrics?.otherInflow || 0) / (cashBookMetrics?.totalInflow || 1)) * 100).toFixed(0) : 0}%)</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${(cashBookMetrics?.totalInflow || 0) > 0 ? (((cashBookMetrics?.otherInflow || 0) / (cashBookMetrics?.totalInflow || 1)) * 100) : 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Outflow Category Breakdown */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center">
              <TrendingDown className="w-4 h-4 text-rose-600 mr-1.5" />
              Expenditure & Outflow Allocation
            </h3>
            <span className="text-xs font-black font-mono text-rose-700">Rs. {(cashBookMetrics?.totalOutflow || 0).toLocaleString()}</span>
          </div>

          <div className="space-y-2.5 text-xs font-medium">
            <div>
              <div className="flex justify-between text-slate-700 mb-1">
                <span>Vendor Stock Purchases (GRNs / POs)</span>
                <span className="font-bold font-mono">Rs. {(cashBookMetrics?.grnOutflow || 0).toLocaleString()} ({(cashBookMetrics?.totalOutflow || 0) > 0 ? (((cashBookMetrics?.grnOutflow || 0) / (cashBookMetrics?.totalOutflow || 1)) * 100).toFixed(0) : 0}%)</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-amber-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${(cashBookMetrics?.totalOutflow || 0) > 0 ? (((cashBookMetrics?.grnOutflow || 0) / (cashBookMetrics?.totalOutflow || 1)) * 100) : 0}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-slate-700 mb-1">
                <span>Operational & Utility Expenses</span>
                <span className="font-bold font-mono">Rs. {(cashBookMetrics?.expenseOutflow || 0).toLocaleString()} ({(cashBookMetrics?.totalOutflow || 0) > 0 ? (((cashBookMetrics?.expenseOutflow || 0) / (cashBookMetrics?.totalOutflow || 1)) * 100).toFixed(0) : 0}%)</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-rose-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${(cashBookMetrics?.totalOutflow || 0) > 0 ? (((cashBookMetrics?.expenseOutflow || 0) / (cashBookMetrics?.totalOutflow || 1)) * 100) : 0}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-slate-700 mb-1">
                <span>Staff Salary Disbursements</span>
                <span className="font-bold font-mono">Rs. {(cashBookMetrics?.payrollOutflow || 0).toLocaleString()} ({(cashBookMetrics?.totalOutflow || 0) > 0 ? (((cashBookMetrics?.payrollOutflow || 0) / (cashBookMetrics?.totalOutflow || 1)) * 100).toFixed(0) : 0}%)</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-purple-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${(cashBookMetrics?.totalOutflow || 0) > 0 ? (((cashBookMetrics?.payrollOutflow || 0) / (cashBookMetrics?.totalOutflow || 1)) * 100) : 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* RECENT TRANSACTIONS TABLE & QUICK ACTIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
              <Receipt className="w-4 h-4 text-indigo-600" />
              <span>Recent Clinic Operational & Financial Receipts</span>
            </h3>
            <button
              onClick={() => setActiveTab('cash_book_pnl')}
              className="text-xs font-bold text-indigo-600 hover:underline"
            >
              View Full Cash Book &rarr;
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                  <th className="p-2.5">Date</th>
                  <th className="p-2.5">Ref No</th>
                  <th className="p-2.5">Particulars / Category</th>
                  <th className="p-2.5">Type</th>
                  <th className="p-2.5 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {cashBookEntries.slice(0, 8).map((txn, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="p-2.5 text-slate-500 whitespace-nowrap">{txn.date}</td>
                    <td className="p-2.5 font-mono font-bold text-slate-700">{txn.ref}</td>
                    <td className="p-2.5 text-slate-800">
                      <div className="font-bold text-slate-900">{txn.particulars}</div>
                      <div className="text-[10px] text-slate-400">{txn.category}</div>
                    </td>
                    <td className="p-2.5">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                        txn.type === 'INFLOW' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {txn.type}
                      </span>
                    </td>
                    <td className={`p-2.5 text-right font-bold ${
                      txn.type === 'INFLOW' ? 'text-emerald-600' : 'text-rose-600'
                    }`}>
                      Rs. {(txn.amount || 0).toLocaleString()}
                    </td>
                  </tr>
                ))}
                {cashBookEntries.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center p-6 text-slate-400">
                      No clinic cash collection or transaction records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* QUICK MODULE LAUNCHPAD */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-900 text-sm">Quick ERP Actions</h3>
          
          <div className="space-y-2.5">
            <button
              onClick={handleOpenAddVendor}
              className="w-full p-3 rounded-xl bg-slate-50 hover:bg-indigo-50 hover:border-indigo-200 border border-slate-200 text-left transition flex items-center justify-between group cursor-pointer"
            >
              <div className="flex items-center space-x-3">
                <Building2 className="w-5 h-5 text-indigo-600" />
                <div>
                  <div className="font-bold text-xs text-slate-800 group-hover:text-indigo-600">Add Supplier Vendor</div>
                  <div className="text-[10px] text-slate-400">Register new distributor</div>
                </div>
              </div>
              <Plus className="w-4 h-4 text-slate-400 group-hover:text-indigo-600" />
            </button>

            <button
              onClick={() => handleOpenNewPoModal()}
              className="w-full p-3 rounded-xl bg-slate-50 hover:bg-indigo-50 hover:border-indigo-200 border border-slate-200 text-left transition flex items-center justify-between group cursor-pointer"
            >
              <div className="flex items-center space-x-3">
                <ShoppingCart className="w-5 h-5 text-emerald-600" />
                <div>
                  <div className="font-bold text-xs text-slate-800 group-hover:text-indigo-600">Create Purchase Order</div>
                  <div className="text-[10px] text-slate-400">Requisition stock from vendor</div>
                </div>
              </div>
              <Plus className="w-4 h-4 text-slate-400 group-hover:text-indigo-600" />
            </button>

            <button
              onClick={() => setShowTxnModal(true)}
              className="w-full p-3 rounded-xl bg-slate-50 hover:bg-indigo-50 hover:border-indigo-200 border border-slate-200 text-left transition flex items-center justify-between group cursor-pointer"
            >
              <div className="flex items-center space-x-3">
                <Receipt className="w-5 h-5 text-amber-600" />
                <div>
                  <div className="font-bold text-xs text-slate-800 group-hover:text-indigo-600">Log Income / Expense Voucher</div>
                  <div className="text-[10px] text-slate-400">General ledger posting</div>
                </div>
              </div>
              <Plus className="w-4 h-4 text-slate-400 group-hover:text-indigo-600" />
            </button>

            <button
              onClick={() => setShowEmpModal(true)}
              className="w-full p-3 rounded-xl bg-slate-50 hover:bg-indigo-50 hover:border-indigo-200 border border-slate-200 text-left transition flex items-center justify-between group cursor-pointer"
            >
              <div className="flex items-center space-x-3">
                <UserPlus className="w-5 h-5 text-blue-600" />
                <div>
                  <div className="font-bold text-xs text-slate-800 group-hover:text-indigo-600">Add Staff / Employee</div>
                  <div className="text-[10px] text-slate-400">HR profile & salary setup</div>
                </div>
              </div>
              <Plus className="w-4 h-4 text-slate-400 group-hover:text-indigo-600" />
            </button>

            <button
              onClick={() => setShowExpenseModal(true)}
              className="w-full p-3 rounded-xl bg-slate-50 hover:bg-indigo-50 hover:border-indigo-200 border border-slate-200 text-left transition flex items-center justify-between group cursor-pointer"
            >
              <div className="flex items-center space-x-3">
                <CreditCard className="w-5 h-5 text-rose-600" />
                <div>
                  <div className="font-bold text-xs text-slate-800 group-hover:text-indigo-600">Record Operational Expense</div>
                  <div className="text-[10px] text-slate-400">Utilities, Rent & Maintenance</div>
                </div>
              </div>
              <Plus className="w-4 h-4 text-slate-400 group-hover:text-indigo-600" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OverviewTab;
