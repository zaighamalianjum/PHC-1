import React, { useState } from 'react';
import { History, X, Printer, Plus, CreditCard, Building2, Calendar, Receipt } from 'lucide-react';
import { ErpVendor, ErpTransaction } from '../../../types';

interface VendorPaymentHistoryStandaloneModalProps {
  showPaymentHistoryModal: boolean;
  setShowPaymentHistoryModal: (show: boolean) => void;
  paymentHistoryVendorFilter: string;
  setPaymentHistoryVendorFilter: (val: string) => void;
  vendors: ErpVendor[];
  transactions: ErpTransaction[];
  setPayVendorModalData: (data: any) => void;
  handlePrintSinglePaymentVoucher: (pt: any, vendor: ErpVendor) => void;
}

export const VendorPaymentHistoryStandaloneModal: React.FC<VendorPaymentHistoryStandaloneModalProps> = ({
  showPaymentHistoryModal,
  setShowPaymentHistoryModal,
  paymentHistoryVendorFilter,
  setPaymentHistoryVendorFilter,
  vendors,
  transactions,
  setPayVendorModalData,
  handlePrintSinglePaymentVoucher,
}) => {
  const [historyStartDate, setHistoryStartDate] = useState('');
  const [historyEndDate, setHistoryEndDate] = useState('');

  if (!showPaymentHistoryModal) return null;

  const paymentTxns = transactions.filter(t => {
    if (t.Type !== 'VendorPayment' && t.Category !== 'Vendor Payment') return false;
    if (paymentHistoryVendorFilter !== 'ALL') {
      const vMatch = (t.VendorName && t.VendorName.trim().toLowerCase() === paymentHistoryVendorFilter.trim().toLowerCase()) ||
                     (t.VendorID && t.VendorID === paymentHistoryVendorFilter);
      if (!vMatch) return false;
    }
    const tDate = t.Date || t.TransactionDate || '';
    if (historyStartDate && tDate < historyStartDate) return false;
    if (historyEndDate && tDate > historyEndDate) return false;
    return true;
  });

  const totalPaidAmount = paymentTxns.reduce((sum, t) => sum + Number(t.Amount || 0), 0);

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-5xl w-full p-6 space-y-5 shadow-2xl border border-slate-200 my-8 max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-amber-100 text-amber-800 rounded-xl">
              <History className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900">Vendor Payment & Settlement History</h3>
              <p className="text-xs text-slate-500">View complete accounts payable settlement logs & payment vouchers</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowPaymentHistoryModal(false)}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Toolbar */}
        <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-3 flex-wrap gap-y-2">
            <div className="flex items-center space-x-1.5">
              <label className="font-bold text-slate-700 flex items-center space-x-1">
                <Building2 className="w-3.5 h-3.5 text-slate-500" />
                <span>Vendor:</span>
              </label>
              <select
                value={paymentHistoryVendorFilter}
                onChange={(e) => setPaymentHistoryVendorFilter(e.target.value)}
                className="p-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="ALL">All Vendors / Distributors ({vendors.length})</option>
                {vendors.map((v) => (
                  <option key={v.VendorID || v._id} value={v.VendorName}>
                    {v.VendorName} ({v.VendorID})
                  </option>
                ))}
              </select>
            </div>

            <span className="text-slate-300 font-bold hidden sm:inline">|</span>

            <div className="flex items-center space-x-1.5">
              <label className="font-bold text-slate-700 flex items-center space-x-1">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                <span>Dates:</span>
              </label>
              <input
                type="date"
                value={historyStartDate}
                onChange={(e) => setHistoryStartDate(e.target.value)}
                className="p-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono text-slate-800 focus:outline-none"
              />
              <span className="text-slate-400 font-bold">to</span>
              <input
                type="date"
                value={historyEndDate}
                onChange={(e) => setHistoryEndDate(e.target.value)}
                className="p-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono text-slate-800 focus:outline-none"
              />
            </div>
          </div>

          {/* Presets */}
          <div className="flex items-center space-x-1">
            {(historyStartDate || historyEndDate || paymentHistoryVendorFilter !== 'ALL') && (
              <button
                type="button"
                onClick={() => { setHistoryStartDate(''); setHistoryEndDate(''); setPaymentHistoryVendorFilter('ALL'); }}
                className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg text-[11px] font-bold text-slate-700 transition cursor-pointer"
              >
                Reset Filters
              </button>
            )}
          </div>
        </div>

        {/* Payment Transactions Table */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-slate-600 bg-amber-50/80 p-3 rounded-xl border border-amber-200/80">
            <span className="flex items-center space-x-1.5">
              <Receipt className="w-4 h-4 text-amber-700" />
              <span>Found {paymentTxns.length} payment voucher(s)</span>
            </span>
            <span className="text-emerald-700 font-black text-sm">
              Total Settlement Paid: Rs. {totalPaidAmount.toLocaleString()}
            </span>
          </div>

          <div className="max-h-96 overflow-y-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800 text-white font-bold sticky top-0 z-10">
                <tr>
                  <th className="p-3">#</th>
                  <th className="p-3">Payment Date</th>
                  <th className="p-3">Voucher Ref #</th>
                  <th className="p-3">Vendor / Distributor</th>
                  <th className="p-3">Payment Mode</th>
                  <th className="p-3 text-right">Amount Paid</th>
                  <th className="p-3">Description / Remarks</th>
                  <th className="p-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {paymentTxns.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-400">
                      No vendor payment voucher records found.
                    </td>
                  </tr>
                ) : (
                  paymentTxns.map((pt, idx) => {
                    const vendorObj = vendors.find(v => 
                      (pt.VendorID && v.VendorID === pt.VendorID) ||
                      (pt.VendorName && v.VendorName.trim().toLowerCase() === pt.VendorName.trim().toLowerCase())
                    ) || ({ VendorName: pt.VendorName || 'Supplier', VendorID: pt.VendorID || 'N/A', Phone: '', Address: '' } as ErpVendor);

                    return (
                      <tr key={pt._id || idx} className="hover:bg-slate-50">
                        <td className="p-3 text-slate-400 font-bold">{idx + 1}</td>
                        <td className="p-3 font-mono font-bold text-slate-700">{pt.Date || pt.TransactionDate || 'N/A'}</td>
                        <td className="p-3 font-mono font-bold text-indigo-700">{pt.TransactionID || pt.ReferenceNo || 'N/A'}</td>
                        <td className="p-3 font-bold text-slate-900">{pt.VendorName || 'N/A'}</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                            {pt.PaymentMethod || 'Cash'}
                          </span>
                        </td>
                        <td className="p-3 text-right font-black text-emerald-600 bg-emerald-50/50">
                          Rs. {Number(pt.Amount || 0).toLocaleString()}
                        </td>
                        <td className="p-3 text-slate-600 max-w-xs truncate">{pt.Description || 'Vendor Bill Settlement'}</td>
                        <td className="p-3 text-center">
                          <button
                            type="button"
                            onClick={() => handlePrintSinglePaymentVoucher(pt, vendorObj)}
                            className="px-2.5 py-1 text-[10px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded border border-indigo-200 transition cursor-pointer flex items-center space-x-1 mx-auto"
                            title="Print Official Payment Voucher"
                          >
                            <Printer className="w-3 h-3" />
                            <span>Print Voucher</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex justify-end pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={() => setShowPaymentHistoryModal(false)}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs transition cursor-pointer"
          >
            Close Window
          </button>
        </div>
      </div>
    </div>
  );
};

export default VendorPaymentHistoryStandaloneModal;
