import React, { useState, useMemo } from 'react';
import {
  Building2, Search, Filter, Plus, Trash2,
  FileSpreadsheet, CreditCard, Receipt, Printer,
  History, Pencil, Coins, Banknote, Boxes, FileText, CheckCircle2
} from 'lucide-react';
import { ErpVendor, ErpPurchaseOrder, ErpGrn, ErpTransaction } from '../../../types';
import { computeVendorBalanceBreakdown } from '../erpUtils';

interface VendorsTabProps {
  vendors: ErpVendor[];
  searchTerm: string;
  setSearchTerm: (val: string) => void;
  filterCategory: string;
  setFilterCategory: (val: string) => void;
  handleOpenAddVendor: () => void;
  handleOpenEditVendor: (v: ErpVendor) => void;
  handleDeleteVendor: (v: ErpVendor) => void;
  handleOpenNewPoModal: (targetVendor?: ErpVendor) => void;
  handleOpenGrnForPo: () => void;
  setSelectedVendorId: (id: string) => void;
  setActiveTab: (tab: any) => void;
  setVendorPoModalData: (v: ErpVendor) => void;
  setPoHistoryFilterPo: (val: string) => void;
  setPoHistoryModalData: (data: any) => void;
  setPayVendorModalData: (data: any) => void;
  handlePrintVendorStatement: (targetVendor?: ErpVendor) => void;
  purchaseOrders?: ErpPurchaseOrder[];
  grns?: ErpGrn[];
  transactions?: ErpTransaction[];
  setHistoryVendorFilter?: (val: string) => void;
  setHistoryStartDate?: (val: string) => void;
  setHistoryEndDate?: (val: string) => void;
  setShowPaymentHistoryModal?: (show: boolean) => void;
  handleOpenEditVendorTop?: () => void;
  handlePayVendor?: (v: ErpVendor, targetBillType?: 'Credit' | 'Cash') => void;
}

export const VendorsTab: React.FC<VendorsTabProps> = ({
  vendors,
  searchTerm,
  setSearchTerm,
  filterCategory,
  setFilterCategory,
  handleOpenAddVendor,
  handleOpenEditVendor,
  handleDeleteVendor,
  handleOpenNewPoModal,
  handleOpenGrnForPo,
  setSelectedVendorId,
  setActiveTab,
  setVendorPoModalData,
  setPoHistoryFilterPo,
  setPoHistoryModalData,
  setPayVendorModalData,
  handlePrintVendorStatement,
  purchaseOrders = [],
  grns = [],
  transactions = [],
  setHistoryVendorFilter = (_val?: any) => {},
  setHistoryStartDate = (_val?: any) => {},
  setHistoryEndDate = (_val?: any) => {},
  setShowPaymentHistoryModal = (_show?: any) => {},
  handleOpenEditVendorTop = () => {},
  handlePayVendor = (_v?: any, _type?: any) => {},
}) => {
  const [balanceFilter, setBalanceFilter] = useState<'ALL' | 'CREDIT_DUE' | 'CASH_DUE' | 'ALL_DUE' | 'CLEARED'>('ALL');

  // Compute vendor balances with split cash vs credit breakdown
  const vendorsWithBreakdown = useMemo(() => {
    return vendors.map(v => {
      const breakdown = computeVendorBalanceBreakdown(v, grns, transactions);
      const creditDue = v.CreditBalance !== undefined && v.CreditBalance !== null ? Number(v.CreditBalance) : breakdown.creditBalance;
      const cashDue = v.CashBalance !== undefined && v.CashBalance !== null ? Number(v.CashBalance) : breakdown.cashBalance;
      const totalDue = creditDue + cashDue > 0 ? (creditDue + cashDue) : Number(v.Balance || 0);

      return {
        vendor: v,
        breakdown,
        creditDue,
        cashDue,
        totalDue
      };
    });
  }, [vendors, grns, transactions]);

  // Calculate high-level summary KPIs
  const kpis = useMemo(() => {
    let totalCredit = 0;
    let totalCash = 0;
    let totalOutstanding = 0;

    vendorsWithBreakdown.forEach(item => {
      totalCredit += item.creditDue;
      totalCash += item.cashDue;
      totalOutstanding += item.totalDue;
    });

    return {
      totalVendors: vendors.length,
      totalCredit,
      totalCash,
      totalOutstanding
    };
  }, [vendorsWithBreakdown, vendors.length]);

  // Filter vendors based on search and balance filter
  const filteredVendors = useMemo(() => {
    return vendorsWithBreakdown.filter(({ vendor: v, creditDue, cashDue, totalDue }) => {
      // Balance filter
      if (balanceFilter === 'CREDIT_DUE' && creditDue <= 0) return false;
      if (balanceFilter === 'CASH_DUE' && cashDue <= 0) return false;
      if (balanceFilter === 'ALL_DUE' && totalDue <= 0) return false;
      if (balanceFilter === 'CLEARED' && totalDue > 0) return false;

      // Search term filter
      if (!searchTerm) return true;
      const q = searchTerm.toLowerCase().trim();
      const matchName = (v.VendorName || '').toLowerCase().includes(q);
      const matchId = (v.VendorID || '').toLowerCase().includes(q);
      const matchContact = (v.ContactPerson || '').toLowerCase().includes(q);
      const matchPhone = (v.Phone || '').toLowerCase().includes(q);
      const matchNtn = (v.TaxID || '').toLowerCase().includes(q);

      return matchName || matchId || matchContact || matchPhone || matchNtn;
    });
  }, [vendorsWithBreakdown, balanceFilter, searchTerm]);

  return (
    <div className="space-y-4">
      {/* TOP KPI SUMMARY CARDS (CREDIT VS CASH BILL BREAKDOWN) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Card 1: Total Registered Vendors */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex items-center space-x-3.5">
          <div className="p-3 bg-blue-50 text-blue-700 rounded-xl border border-blue-100">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Vendors Registered</span>
            <span className="text-xl font-black text-slate-900 font-mono">{kpis.totalVendors}</span>
            <span className="text-[10px] text-slate-400 block">Active Pharmaceutical Suppliers</span>
          </div>
        </div>

        {/* Card 2: Total Credit Balance Due */}
        <div className="bg-white rounded-2xl border border-indigo-200 p-4 shadow-xs flex items-center space-x-3.5">
          <div className="p-3 bg-indigo-50 text-indigo-700 rounded-xl border border-indigo-100">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider block">Credit Balance Due</span>
            <span className="text-xl font-black text-indigo-900 font-mono">Rs. {kpis.totalCredit.toLocaleString()}</span>
            <span className="text-[10px] text-slate-400 block">Payable against credit terms</span>
          </div>
        </div>

        {/* Card 3: Total Cash Purchases Due */}
        <div className="bg-white rounded-2xl border border-emerald-200 p-4 shadow-xs flex items-center space-x-3.5">
          <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100">
            <Banknote className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider block">Cash Purchases Due</span>
            <span className="text-xl font-black text-emerald-900 font-mono">Rs. {kpis.totalCash.toLocaleString()}</span>
            <span className="text-[10px] text-slate-400 block">Pending spot cash bills</span>
          </div>
        </div>

        {/* Card 4: Net Total Outstanding Payable */}
        <div className="bg-white rounded-2xl border border-amber-300 p-4 shadow-xs flex items-center space-x-3.5 bg-amber-50/20">
          <div className="p-3 bg-amber-100 text-amber-800 rounded-xl border border-amber-200">
            <Coins className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider block">Total Outstanding</span>
            <span className="text-xl font-black text-amber-900 font-mono">Rs. {kpis.totalOutstanding.toLocaleString()}</span>
            <span className="text-[10px] text-slate-500 block">Credit + Cash Purchases combined</span>
          </div>
        </div>
      </div>

      {/* DIRECTORY CONTAINER */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
        {/* Header and Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900">Distributors &amp; Vendors Directory</h2>
            <p className="text-xs text-slate-500">
              Manage suppliers, separate credit &amp; cash purchase bills, and view real-time settlement balances
            </p>
          </div>
          <div className="flex items-center space-x-2.5 self-start flex-wrap gap-y-2">
            <button
              type="button"
              onClick={() => {
                setHistoryVendorFilter('ALL');
                setHistoryStartDate('');
                setHistoryEndDate('');
                setShowPaymentHistoryModal(true);
              }}
              className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition flex items-center space-x-1.5 cursor-pointer shadow-xs"
              title="View complete vendor payment history & settlement log"
            >
              <History className="w-4 h-4" />
              <span>Payment History</span>
            </button>
            <button
              type="button"
              onClick={handleOpenEditVendorTop}
              disabled={vendors.length === 0}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition flex items-center space-x-1.5 cursor-pointer shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
              title="Edit existing supplier/vendor records"
            >
              <Pencil className="w-4 h-4" />
              <span>Edit Vendor Info</span>
            </button>
            <button
              type="button"
              onClick={handleOpenAddVendor}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition flex items-center space-x-1.5 cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Register Vendor</span>
            </button>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-2 border-t border-slate-100">
          {/* Quick Balance Filter Tabs */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => setBalanceFilter('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                balanceFilter === 'ALL'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Vendors ({vendors.length})
            </button>
            <button
              type="button"
              onClick={() => setBalanceFilter('CREDIT_DUE')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                balanceFilter === 'CREDIT_DUE'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Credit Due ({vendorsWithBreakdown.filter(x => x.creditDue > 0).length})</span>
            </button>
            <button
              type="button"
              onClick={() => setBalanceFilter('CASH_DUE')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                balanceFilter === 'CASH_DUE'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
              }`}
            >
              <Banknote className="w-3.5 h-3.5" />
              <span>Cash Due ({vendorsWithBreakdown.filter(x => x.cashDue > 0).length})</span>
            </button>
            <button
              type="button"
              onClick={() => setBalanceFilter('ALL_DUE')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                balanceFilter === 'ALL_DUE'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
              }`}
            >
              <Coins className="w-3.5 h-3.5" />
              <span>All Outstanding ({vendorsWithBreakdown.filter(x => x.totalDue > 0).length})</span>
            </button>
            <button
              type="button"
              onClick={() => setBalanceFilter('CLEARED')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                balanceFilter === 'CLEARED'
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'bg-teal-50 text-teal-700 hover:bg-teal-100'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Cleared ({vendorsWithBreakdown.filter(x => x.totalDue <= 0).length})</span>
            </button>
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search vendor, phone, NTN..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
            />
          </div>
        </div>

        {/* Vendors Table */}
        <div className="overflow-x-auto border border-slate-100 rounded-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="p-3">Vendor / Company</th>
                <th className="p-3">Contact Person</th>
                <th className="p-3">Phone &amp; Address</th>
                <th className="p-3">Tax / NTN</th>
                <th className="p-3 text-right">Outstanding Balance</th>
                <th className="p-3 text-center">Settlement &amp; Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredVendors.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    No distributors or vendors match the selected filter.
                  </td>
                </tr>
              ) : (
                filteredVendors.map(({ vendor: v, creditDue, cashDue, totalDue }, idx) => {
                  return (
                    <tr key={v.VendorID || idx} className="hover:bg-slate-50/80 transition">
                      {/* Vendor Identification */}
                      <td className="p-3">
                        <div className="flex items-center space-x-2.5">
                          <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0 shadow-2xs">
                            {(v.LogoUrl || v.LogoImage) ? (
                              <img src={v.LogoUrl || v.LogoImage} alt={v.VendorName} className="w-full h-full object-contain" />
                            ) : (
                              <span className="text-xs font-black text-slate-500">{(v.VendorName || 'V').charAt(0).toUpperCase()}</span>
                            )}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 flex items-center space-x-1.5">
                              <span className="font-mono text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200">
                                {v.VendorID || 'N/A'}
                              </span>
                              <span>{v.VendorName}</span>
                            </div>
                            <span className="text-[10px] text-slate-400 block">
                              Status: <strong className={v.Status === 'Inactive' ? 'text-rose-600' : 'text-emerald-600'}>{v.Status || 'Active'}</strong>
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Contact Person */}
                      <td className="p-3 text-slate-600 font-medium">
                        {v.ContactPerson || '-'}
                      </td>

                      {/* Phone & Address */}
                      <td className="p-3 text-slate-600">
                        <div className="font-medium">{v.Phone || '-'}</div>
                        <div className="text-[10px] text-slate-400 truncate max-w-xs">{v.Address || 'Lahore, Pakistan'}</div>
                      </td>

                      {/* Tax ID / NTN */}
                      <td className="p-3 text-slate-600 font-mono">
                        {v.TaxID || '-'}
                      </td>

                      {/* Outstanding Balance Breakdown */}
                      <td className="p-3 text-right">
                        <div className="space-y-1">
                          <div className="font-mono font-black text-sm text-slate-900">
                            {totalDue > 0 ? (
                              <span className="text-amber-800 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200 inline-block">
                                Rs. {totalDue.toLocaleString()}
                              </span>
                            ) : (
                              <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200 inline-flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                <span>Rs. 0 (Cleared)</span>
                              </span>
                            )}
                          </div>

                          {/* Split Badges: Credit Due vs Cash Due */}
                          <div className="flex items-center justify-end gap-1.5 flex-wrap">
                            <span
                              className={`text-[10px] font-bold px-1.5 py-0.5 rounded border flex items-center gap-1 ${
                                creditDue > 0
                                  ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                  : 'bg-slate-50 text-slate-400 border-slate-200'
                              }`}
                              title="Credit Purchases Balance"
                            >
                              <CreditCard className="w-2.5 h-2.5" />
                              <span>Credit: Rs. {creditDue.toLocaleString()}</span>
                            </span>

                            <span
                              className={`text-[10px] font-bold px-1.5 py-0.5 rounded border flex items-center gap-1 ${
                                cashDue > 0
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : 'bg-slate-50 text-slate-400 border-slate-200'
                              }`}
                              title="Spot Cash Purchases Balance"
                            >
                              <Banknote className="w-2.5 h-2.5" />
                              <span>Cash: Rs. {cashDue.toLocaleString()}</span>
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center space-x-1.5 flex-wrap gap-y-1">
                          {/* Settle Credit Bill Button */}
                          {creditDue > 0 && (
                            <button
                              type="button"
                              onClick={() => handlePayVendor(v, 'Credit')}
                              className="px-2.5 py-1 text-[11px] font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition cursor-pointer flex items-center space-x-1 shadow-2xs"
                              title="Pay Credit Bill & settle supplier credit ledger"
                            >
                              <CreditCard className="w-3 h-3" />
                              <span>Pay Credit</span>
                            </button>
                          )}

                          {/* Settle Cash Bill Button */}
                          {cashDue > 0 && (
                            <button
                              type="button"
                              onClick={() => handlePayVendor(v, 'Cash')}
                              className="px-2.5 py-1 text-[11px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition cursor-pointer flex items-center space-x-1 shadow-2xs"
                              title="Pay Cash Purchase Bill & settle spot cash"
                            >
                              <Banknote className="w-3 h-3" />
                              <span>Pay Cash Bill</span>
                            </button>
                          )}

                          {/* Fallback Pay Bill button if both are zero or general */}
                          {creditDue <= 0 && cashDue <= 0 && (
                            <button
                              type="button"
                              onClick={() => handlePayVendor(v)}
                              className="px-2.5 py-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition cursor-pointer flex items-center space-x-1 shadow-2xs"
                              title="Log payment or record advance voucher"
                            >
                              <Coins className="w-3 h-3" />
                              <span>Pay Bill</span>
                            </button>
                          )}

                          {/* View Statement */}
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedVendorId(v.VendorID || v._id || '');
                              setActiveTab('vendor_statement');
                            }}
                            className="px-2.5 py-1 text-[11px] font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg border border-amber-200 transition cursor-pointer flex items-center space-x-1 shadow-2xs"
                            title="View detailed Vendor Account Statement & Payable Ledger"
                          >
                            <FileText className="w-3 h-3" />
                            <span>Statement</span>
                          </button>

                          {/* Edit Vendor */}
                          <button
                            type="button"
                            onClick={() => handleOpenEditVendor(v)}
                            className="px-2 py-1 text-[11px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition cursor-pointer flex items-center space-x-1 shadow-2xs"
                            title="Edit Vendor details, contact, and balances"
                          >
                            <Pencil className="w-3 h-3" />
                            <span>Edit</span>
                          </button>

                          {/* Create PO */}
                          <button
                            type="button"
                            onClick={() => handleOpenNewPoModal(v)}
                            className="px-2 py-1 text-[11px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg border border-indigo-200 transition cursor-pointer flex items-center space-x-1 shadow-2xs"
                            title="Create New Purchase Order"
                          >
                            <Plus className="w-3 h-3" />
                            <span>PO</span>
                          </button>

                          {/* Delete Vendor */}
                          <button
                            type="button"
                            onClick={() => handleDeleteVendor(v)}
                            className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                            title="Delete Vendor Record"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default VendorsTab;
