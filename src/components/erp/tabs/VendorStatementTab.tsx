import React from 'react';
import {
  Building2, Calendar, FileSpreadsheet, Plus, CreditCard,
  History, Eye, Printer, Edit, DollarSign, Boxes, Coins,
  Pencil, RefreshCw, FileText, Trash2
} from 'lucide-react';
import { ErpVendor } from '../../../types';

interface VendorStatementTabProps {
  vendors: ErpVendor[];
  selectedVendorId: string;
  setSelectedVendorId: (id: string) => void;
  selectedVendor: ErpVendor | null;
  vendorDateFilter: 'all' | '30days' | '60days' | 'this_year';
  setVendorDateFilter: (val: any) => void;
  vendorStatement: any;
  expandedGrnId: string | null;
  setExpandedGrnId: React.Dispatch<React.SetStateAction<string | null>>;
  handleOpenEditVendorTop: () => void;
  handleOpenNewPoModal: (targetVendor?: ErpVendor) => void;
  setPayVendorModalData: (data: any) => void;
  setVendorPoModalData: (v: ErpVendor) => void;
  setPoHistoryFilterPo: (val: string) => void;
  setPoHistoryModalData: (data: any) => void;
  setShowPaymentHistoryModal: (show: boolean) => void;
  setVendorPrintModalOpen: (show: boolean) => void;
  handlePrintVendorStatement: (targetVendor?: ErpVendor) => void;
  handlePayVendor?: (vendor: ErpVendor) => void;
  handleOpenEditVendor?: (vendor: ErpVendor) => void;
  handleOpenAddVendor?: () => void;
  fetchErpData?: () => void;
  handleDeleteTxn?: (txn: any) => void;
}

export const VendorStatementTab: React.FC<VendorStatementTabProps> = ({
  vendors,
  selectedVendorId,
  setSelectedVendorId,
  selectedVendor,
  vendorDateFilter,
  setVendorDateFilter,
  vendorStatement,
  expandedGrnId,
  setExpandedGrnId,
  handleOpenEditVendorTop,
  handleOpenNewPoModal,
  setPayVendorModalData,
  setVendorPoModalData,
  setPoHistoryFilterPo,
  setPoHistoryModalData,
  setShowPaymentHistoryModal,
  setVendorPrintModalOpen,
  handlePrintVendorStatement,
  handlePayVendor = (_vendor?: any) => {},
  handleOpenEditVendor = (_vendor?: any) => {},
  handleOpenAddVendor = () => {},
  fetchErpData = () => {},
  handleDeleteTxn = (_txn?: any) => {},
}) => {
  return (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-6 animate-fadeIn" id="erp-vendor-statement-tab">
          {/* Header & Controls */}
          <div className="border-b border-slate-200 pb-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center">
                <Building2 className="w-5 h-5 text-amber-600 mr-2" />
                <span>Vendor Account Statement & Payable Ledger</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Synchronized statement of Goods Received Notes (GRNs), vendor payments, and Accounts Payable ledger
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 print:hidden">
              <button
                onClick={() => {
                  if (selectedVendor) {
                    setVendorPoModalData(selectedVendor);
                  }
                }}
                disabled={!selectedVendor}
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                title="View Purchase Orders for selected vendor"
              >
                <Boxes className="w-4 h-4" />
                <span>View PO</span>
              </button>

              <button
                onClick={() => {
                  if (selectedVendor) {
                    handlePayVendor(selectedVendor);
                  }
                }}
                disabled={!selectedVendor}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
              >
                <Coins className="w-4 h-4" />
                <span>Record Payment</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (selectedVendor) {
                    handleOpenEditVendor(selectedVendor);
                  } else {
                    handleOpenEditVendorTop();
                  }
                }}
                disabled={vendors.length === 0}
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                title="Edit vendor name and mobile number while keeping SupplierID intact"
              >
                <Pencil className="w-4 h-4" />
                <span>Edit Vendor</span>
              </button>

              <button
                onClick={handleOpenAddVendor}
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center space-x-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Vendor</span>
              </button>

              <button
                onClick={() => fetchErpData()}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border border-slate-300 transition flex items-center space-x-1.5 cursor-pointer shadow-xs"
              >
                <RefreshCw className="w-4 h-4 text-slate-600" />
                <span>Refresh Data</span>
              </button>

              <button
                onClick={() => setVendorPrintModalOpen(true)}
                disabled={!selectedVendor}
                className="px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-bold rounded-xl border border-amber-300 transition flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                title="Preview Statement Modal"
              >
                <Eye className="w-4 h-4 text-amber-700" />
                <span>Preview A4</span>
              </button>

              <button
                onClick={() => {
                  if (selectedVendor) {
                    setPoHistoryFilterPo('ALL');
                    setPoHistoryModalData({ vendor: selectedVendor });
                  }
                }}
                disabled={!selectedVendor}
                className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                title="View Payment History for P.O. in Grid View"
              >
                <History className="w-4 h-4" />
                <span>Payment History for P.O.</span>
              </button>

              <button
                onClick={() => handlePrintVendorStatement()}
                disabled={!selectedVendor}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                title="Print Official Vendor Account Statement (A4)"
              >
                <Printer className="w-4 h-4" />
                <span>Print Statement</span>
              </button>
            </div>
          </div>

          {/* Vendor Selector Banner */}
          <div className="bg-amber-50/70 p-4 rounded-xl border border-amber-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center font-black text-lg shadow-xs shrink-0">
                {selectedVendor?.VendorName ? selectedVendor.VendorName.charAt(0).toUpperCase() : 'V'}
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase text-amber-800 tracking-wider">
                  Select Vendor / Distributor ({vendors.length} Total):
                </label>
                <select
                  value={selectedVendorId || (selectedVendor?.VendorID || selectedVendor?._id || '')}
                  onChange={(e) => setSelectedVendorId(e.target.value)}
                  className="mt-0.5 bg-white text-slate-900 font-bold text-xs rounded-lg px-3 py-1.5 border border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-2xs cursor-pointer min-w-[280px]"
                >
                  {vendors.length === 0 ? (
                    <option value="">No Vendors Found in Database</option>
                  ) : (
                    vendors.map(v => (
                      <option key={v.VendorID || v._id} value={v.VendorID || v._id}>
                        {v.VendorName} ({v.VendorID || 'N/A'}) - Balance: Rs. {(v.Balance || 0).toLocaleString()}
                      </option>
                    ))
                  )}
                </select>
              </div>
            </div>

            {selectedVendor && (
              <div className="flex flex-wrap items-center gap-3 text-xs">
                <div className="bg-white px-3 py-1.5 rounded-lg border border-amber-200/80 text-slate-700 shadow-2xs">
                  <span className="text-[9px] text-slate-400 block font-bold uppercase">Contact Person</span>
                  <span className="font-bold text-slate-900">{selectedVendor.ContactPerson || 'N/A'}</span>
                </div>
                <div className="bg-white px-3 py-1.5 rounded-lg border border-amber-200/80 text-slate-700 shadow-2xs">
                  <span className="text-[9px] text-slate-400 block font-bold uppercase">Phone Number</span>
                  <span className="font-bold text-slate-900">{selectedVendor.Phone || 'N/A'}</span>
                </div>
                <div className="bg-white px-3 py-1.5 rounded-lg border border-amber-200/80 text-slate-700 shadow-2xs">
                  <span className="text-[9px] text-slate-400 block font-bold uppercase">Tax / NTN No</span>
                  <span className="font-mono font-bold text-slate-900">{selectedVendor.TaxID || 'N/A'}</span>
                </div>
              </div>
            )}
          </div>

          {/* Statement Date Range Filter Pills */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-amber-600" />
              <span className="text-xs font-bold uppercase text-slate-800 tracking-wider">Statement Period Filter:</span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {(['all', 'daily', 'weekly', 'monthly', 'yearly'] as const).map((filterKey) => (
                <button
                  key={filterKey}
                  onClick={() => setVendorDateFilter(filterKey)}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition cursor-pointer capitalize ${
                    vendorDateFilter === filterKey
                      ? 'bg-amber-600 text-white shadow-2xs'
                      : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
                  }`}
                >
                  {filterKey === 'all' ? 'All Time (Full Statement)' : filterKey}
                </button>
              ))}
            </div>
          </div>

          {/* Metric Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Total Invoiced / Goods Received (GRN)
              </span>
              <p className="text-xl font-black text-amber-700 font-mono">
                Rs. {(vendorStatement?.totalInvoiced || 0).toLocaleString()}
              </p>
              <p className="text-[10px] text-slate-400">Total Goods Received (Credit Bills)</p>
            </div>

            <div className="bg-emerald-50/70 p-4 rounded-xl border border-emerald-200 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                  Total Payments Cleared (Debit)
                </span>
                <span className="text-[9px] font-bold bg-emerald-200 text-emerald-900 px-1.5 py-0.2 rounded font-mono">Grand Total</span>
              </div>
              <p className="text-xl font-black text-emerald-700 font-mono">
                Rs. {(vendorStatement?.totalPaid || 0).toLocaleString()}
              </p>
              <div className="flex items-center space-x-2 text-[10px] pt-0.5">
                <span className="text-emerald-800 font-semibold bg-emerald-100/80 px-1.5 py-0.5 rounded border border-emerald-300">
                  Cash: Rs. {(vendorStatement?.totalCashPaid || 0).toLocaleString()}
                </span>
                <span className="text-indigo-800 font-semibold bg-indigo-100/80 px-1.5 py-0.5 rounded border border-indigo-300">
                  Credit/Bank: Rs. {(vendorStatement?.totalCreditPaid || 0).toLocaleString()}
                </span>
              </div>
            </div>

            <div className="bg-amber-500 text-white p-4 rounded-xl shadow-xs space-y-1">
              <span className="text-[10px] font-bold text-amber-100 uppercase tracking-wider block">
                Closing Accounts Payable Balance
              </span>
              <p className="text-xl font-black font-mono">
                Rs. {(vendorStatement?.closingBalance || 0).toLocaleString()}
              </p>
              <p className="text-[10px] text-amber-100">Net Outstanding Amount Due</p>
            </div>
          </div>

          {/* Statement Rows Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
            <div className="bg-slate-100 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center">
                <FileText className="w-4 h-4 text-amber-600 mr-1.5" />
                Ledger Statement Audit Entries ({vendorStatement.statementRows.length} Records)
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-sans">
                <thead>
                  <tr className="bg-slate-800 text-slate-200 uppercase text-[10px] font-bold tracking-wider">
                    <th className="p-3">Date</th>
                    <th className="p-3">Type</th>
                    <th className="p-3">Ref / Voucher #</th>
                    <th className="p-3">P.O. Number</th>
                    <th className="p-3">Description</th>
                    <th className="p-3 text-right">Debit (Paid)</th>
                    <th className="p-3 text-right">Credit (Bill)</th>
                    <th className="p-3 text-right">Running Balance</th>
                    <th className="p-3 text-center">Audit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white font-medium text-slate-700">
                  {vendorStatement.statementRows.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-slate-400 font-bold">
                        No transactions or GRNs recorded for this vendor in selected period.
                      </td>
                    </tr>
                  ) : (
                    vendorStatement.statementRows.map((row, idx) => (
                      <React.Fragment key={row.id || idx}>
                        <tr className="hover:bg-slate-50 transition">
                          <td className="p-3 font-mono text-slate-600">{row.date}</td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              row.type?.includes('Spot Cash') || row.type?.includes('Cash Purchase')
                                ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                                : row.credit > 0
                                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                : 'bg-indigo-100 text-indigo-900 border border-indigo-300'
                            }`}>
                              {row.type}
                            </span>
                          </td>
                          <td className="p-3 font-mono font-bold text-slate-900">{row.refNo}</td>
                          <td className="p-3 font-mono font-bold text-indigo-600">
                            {row.poNo !== 'N/A' ? (
                              <span className="px-1.5 py-0.5 bg-indigo-50 border border-indigo-200 rounded text-indigo-700 font-mono text-[11px]">
                                {row.poNo}
                              </span>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </td>
                          <td className="p-3 max-w-xs truncate text-slate-600">{row.description}</td>
                          <td className="p-3 text-right font-mono font-bold text-emerald-700">
                            {row.debit > 0 ? `Rs. ${(row.debit || 0).toLocaleString()}` : '-'}
                          </td>
                          <td className="p-3 text-right font-mono font-bold text-amber-700">
                            {row.credit > 0 ? `Rs. ${(row.credit || 0).toLocaleString()}` : '-'}
                          </td>
                          <td className="p-3 text-right font-mono font-black text-slate-900">
                            Rs. {(row.runningBalance || 0).toLocaleString()}
                          </td>
                          <td className="p-3 text-center">
                            {(row.type.includes('GRN') || row.type === 'Goods Received (GRN)') && (row.rawItem?.ItemsReceived || row.rawItem?.Items) ? (
                              <button
                                onClick={() => setExpandedGrnId(expandedGrnId === row.id ? null : row.id)}
                                className="text-indigo-600 hover:text-indigo-800 font-bold text-[11px] underline cursor-pointer"
                              >
                                {expandedGrnId === row.id ? 'Hide Items' : 'View Items'}
                              </button>
                            ) : row.debit > 0 ? (
                              <button
                                onClick={() => handleDeleteTxn(row.rawItem)}
                                className="text-rose-600 hover:bg-rose-50 p-1 rounded transition cursor-pointer"
                                title="Delete Payment Transaction"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            ) : (
                              <span className="text-slate-300">-</span>
                            )}
                          </td>
                        </tr>

                        {/* Expandable GRN items line breakdown */}
                        {expandedGrnId === row.id && row.rawItem?.ItemsReceived && (
                          <tr className="bg-slate-50">
                            <td colSpan={9} className="p-4">
                              <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-2">
                                <h4 className="text-[11px] font-bold text-slate-800 uppercase tracking-wider">
                                  GRN Itemized Audit Breakdown ({row.rawItem.ItemsReceived.length} Items)
                                </h4>
                                <table className="w-full text-left text-[11px] border-collapse">
                                  <thead>
                                    <tr className="bg-slate-100 text-slate-600 font-bold">
                                      <th className="p-1.5">Medicine Name</th>
                                      <th className="p-1.5 text-center">Qty Received</th>
                                      <th className="p-1.5 text-right">Unit Price</th>
                                      <th className="p-1.5 text-right">Subtotal</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100">
                                    {row.rawItem.ItemsReceived.map((item: any, itemIdx: number) => (
                                      <tr key={itemIdx}>
                                        <td className="p-1.5 font-bold text-slate-800">{item.MedicineName}</td>
                                        <td className="p-1.5 text-center font-mono">{item.QuantityReceived}</td>
                                        <td className="p-1.5 text-right font-mono">Rs. {(item.UnitPrice || 0).toLocaleString()}</td>
                                        <td className="p-1.5 text-right font-mono font-bold text-slate-900">
                                          Rs. {((item.QuantityReceived || 0) * (item.UnitPrice || 0)).toLocaleString()}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
    
  );
};

export default VendorStatementTab;
