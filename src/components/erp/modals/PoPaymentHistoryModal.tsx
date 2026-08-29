import React, { useState } from 'react';
import { History, X, Printer, DollarSign, Receipt, CreditCard, Building2, Calendar } from 'lucide-react';
import { ErpVendor, ErpPurchaseOrder, ErpGrn, ErpTransaction } from '../../../types';

interface PoPaymentHistoryModalProps {
  poHistoryModalData: {
    vendor: ErpVendor;
    poId?: string;
  } | null;
  setPoHistoryModalData: (data: any) => void;
  poHistoryFilterPo: string;
  setPoHistoryFilterPo: (val: string) => void;
  purchaseOrders: ErpPurchaseOrder[];
  grns: ErpGrn[];
  transactions: ErpTransaction[];
  handlePrintVendorStatement: (targetVendor?: ErpVendor) => void;
  setPayVendorModalData: (data: any) => void;
  handlePrintSinglePaymentVoucher: (pt: any, vendor: ErpVendor) => void;
}

export const PoPaymentHistoryModal: React.FC<PoPaymentHistoryModalProps> = ({
  poHistoryModalData,
  setPoHistoryModalData,
  poHistoryFilterPo,
  setPoHistoryFilterPo,
  purchaseOrders,
  grns,
  transactions,
  handlePrintVendorStatement,
  setPayVendorModalData,
  handlePrintSinglePaymentVoucher,
}) => {
  const [methodFilter, setMethodFilter] = useState<'ALL' | 'CASH' | 'CREDIT'>('ALL');

  if (!poHistoryModalData) return null;

  const vVendor = poHistoryModalData.vendor;
  const vPos = purchaseOrders.filter(po => 
    (po.VendorID && po.VendorID === vVendor.VendorID) || 
    (po.VendorName && po.VendorName.toLowerCase() === vVendor.VendorName.toLowerCase())
  );
  const vGrns = grns.filter(g => 
    (g.VendorID && g.VendorID === vVendor.VendorID) || 
    (g.VendorName && g.VendorName.toLowerCase() === vVendor.VendorName.toLowerCase())
  );

  const activePoObj = vPos.find(p => p.POID === poHistoryFilterPo);

  const poPaymentTxns = transactions.filter(t => {
    const isVendorMatch = (t.VendorID === vVendor.VendorID) || 
                          (t.VendorName && t.VendorName.toLowerCase() === vVendor.VendorName.toLowerCase());
    const isPay = t.Type === 'VendorPayment' || t.Category === 'Vendor Payment' || (t.Type === 'Expense' && t.VendorName);
    if (!isVendorMatch || !isPay) return false;

    if (poHistoryFilterPo !== 'ALL') {
      const matchGrn = vGrns.find(g => g.POID === poHistoryFilterPo);
      const invStr = matchGrn?.SupplierInvoiceNo || poHistoryFilterPo;
      return (t.ReferenceNo === poHistoryFilterPo || t.ReferenceNo === invStr || (t.Description && t.Description.includes(poHistoryFilterPo)));
    }
    return true;
  });

  const cashTxns = poPaymentTxns.filter(t => {
    const method = (t.PaymentMethod || '').toLowerCase();
    const cat = (t.Category || '').toLowerCase();
    const desc = (t.Description || '').toLowerCase();
    return method === 'cash' || cat.includes('spot') || desc.includes('spot cash') || desc.includes('cash spot');
  });

  const creditTxns = poPaymentTxns.filter(t => {
    const method = (t.PaymentMethod || '').toLowerCase();
    const cat = (t.Category || '').toLowerCase();
    const desc = (t.Description || '').toLowerCase();
    return !(method === 'cash' || cat.includes('spot') || desc.includes('spot cash') || desc.includes('cash spot'));
  });

  const totalCashPaid = cashTxns.reduce((sum, t) => sum + Number(t.Amount || 0), 0);
  const totalCreditPaid = creditTxns.reduce((sum, t) => sum + Number(t.Amount || 0), 0);
  const totalPaidInHistory = totalCashPaid + totalCreditPaid;

  let totalPoCost = 0;
  if (activePoObj) {
    totalPoCost = Number(activePoObj.TotalAmount || 0);
  } else {
    totalPoCost = vPos.reduce((sum, p) => sum + Number(p.TotalAmount || 0), 0);
  }
  const remainingPoBalance = Math.max(0, totalPoCost - totalPaidInHistory);

  const displayedTxns = methodFilter === 'CASH'
    ? cashTxns
    : methodFilter === 'CREDIT'
    ? creditTxns
    : poPaymentTxns;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-6xl w-full p-6 space-y-5 shadow-2xl border border-slate-200 my-8 max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-4 gap-3">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-amber-500 text-white rounded-xl shadow-xs">
              <History className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-lg">
                {poHistoryFilterPo !== 'ALL' ? `Payment History for P.O. #${poHistoryFilterPo}` : `P.O. Payment History & Clearing`}
              </h3>
              <p className="text-xs text-slate-500">
                Vendor: <strong className="text-slate-800">{vVendor.VendorName}</strong> ({vVendor.VendorID || 'N/A'})
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 flex-wrap gap-y-1">
            <button
              type="button"
              onClick={() => handlePrintVendorStatement(vVendor)}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center space-x-1.5 cursor-pointer"
              title="Print Official Vendor Statement (A4)"
            >
              <Printer className="w-4 h-4" />
              <span>Print Vendor Statement</span>
            </button>
            <button
              type="button"
              onClick={() => setPoHistoryModalData(null)}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PO Filter and 5 Summary Cards (Including Cash, Credit & Grand Total) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* PO Selector */}
          <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">P.O. Filter</label>
            <select
              value={poHistoryFilterPo}
              onChange={(e) => setPoHistoryFilterPo(e.target.value)}
              className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-800 focus:ring-2 focus:ring-amber-500"
            >
              <option value="ALL">All Purchase Orders ({vPos.length})</option>
              {vPos.map((p) => (
                <option key={p._id || p.POID} value={p.POID}>
                  {p.POID} - Rs. {Number(p.TotalAmount || 0).toLocaleString()} ({p.Status})
                </option>
              ))}
            </select>
            <p className="text-[9px] text-slate-400">Filter specific PO or all</p>
          </div>

          {/* Cash Payments Settled */}
          <div className="bg-emerald-50/80 border border-emerald-200 p-3 rounded-xl flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-1">
                <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">Cash Settled</span>
                <span className="text-[8px] bg-emerald-200 text-emerald-900 font-bold px-1 rounded">{cashTxns.length}</span>
              </div>
              <h4 className="text-lg font-black font-mono text-emerald-900 mt-0.5">Rs. {totalCashPaid.toLocaleString()}</h4>
              <p className="text-[9px] text-emerald-700">Spot / Hand Cash Paid</p>
            </div>
          </div>

          {/* Credit / Bank Payments Settled */}
          <div className="bg-indigo-50/80 border border-indigo-200 p-3 rounded-xl flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-1">
                <span className="text-[10px] font-bold text-indigo-800 uppercase tracking-wider">Credit Settled</span>
                <span className="text-[8px] bg-indigo-200 text-indigo-900 font-bold px-1 rounded">{creditTxns.length}</span>
              </div>
              <h4 className="text-lg font-black font-mono text-indigo-900 mt-0.5">Rs. {totalCreditPaid.toLocaleString()}</h4>
              <p className="text-[9px] text-indigo-700">Bank / Ledger Clearance</p>
            </div>
          </div>

          {/* Grand Total Settled */}
          <div className="bg-teal-50/90 border border-teal-200 p-3 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-[10px] font-black text-teal-800 uppercase tracking-wider block">Grand Total Paid</span>
              <h4 className="text-lg font-black font-mono text-teal-950 mt-0.5">Rs. {totalPaidInHistory.toLocaleString()}</h4>
              <p className="text-[9px] text-teal-700">{poPaymentTxns.length} Total Vouchers</p>
            </div>
          </div>

          {/* Remaining Balance Due */}
          <div className="bg-rose-50/80 border border-rose-200 p-3 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-rose-800 uppercase tracking-wider block">Remaining Balance</span>
              <h4 className="text-lg font-black font-mono text-rose-950 mt-0.5">Rs. {remainingPoBalance.toLocaleString()}</h4>
              <p className="text-[9px] text-rose-600">Total Billed: Rs. {totalPoCost.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Payments Table & Filter Tabs */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs font-bold text-slate-700 gap-2">
            {/* Filter Buttons */}
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setMethodFilter('ALL')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  methodFilter === 'ALL'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                All Payments ({poPaymentTxns.length}) - Rs. {totalPaidInHistory.toLocaleString()}
              </button>
              <button
                type="button"
                onClick={() => setMethodFilter('CASH')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  methodFilter === 'CASH'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
                }`}
              >
                💵 Cash Payments ({cashTxns.length}) - Rs. {totalCashPaid.toLocaleString()}
              </button>
              <button
                type="button"
                onClick={() => setMethodFilter('CREDIT')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  methodFilter === 'CREDIT'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-indigo-50 text-indigo-800 hover:bg-indigo-100 border border-indigo-200'
                }`}
              >
                🏦 Credit / Bank Payments ({creditTxns.length}) - Rs. {totalCreditPaid.toLocaleString()}
              </button>
            </div>

            {remainingPoBalance > 0 && (
              <button
                type="button"
                onClick={() => {
                  setPayVendorModalData({
                    vendor: vVendor,
                    poId: poHistoryFilterPo !== 'ALL' ? poHistoryFilterPo : undefined,
                    amount: remainingPoBalance,
                    paymentMethod: 'Cash',
                    date: new Date().toISOString().split('T')[0],
                    description: `Payment for ${poHistoryFilterPo !== 'ALL' ? `PO #${poHistoryFilterPo}` : `${vVendor.VendorName} settlement`}`
                  });
                }}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition flex items-center space-x-1 shadow-xs cursor-pointer self-start sm:self-auto"
              >
                <DollarSign className="w-3.5 h-3.5" />
                <span>Pay Remaining (Rs. {remainingPoBalance.toLocaleString()})</span>
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800 text-white font-bold sticky top-0 z-10 text-[10px] uppercase tracking-wider">
                <tr>
                  <th className="p-3">#</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Voucher Ref #</th>
                  <th className="p-3">P.O. / Invoice Ref</th>
                  <th className="p-3">Payment Mode & Category</th>
                  <th className="p-3 text-right">Amount Paid</th>
                  <th className="p-3">Description / Remarks</th>
                  <th className="p-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {displayedTxns.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-400">
                      No payment records found for the selected filter.
                    </td>
                  </tr>
                ) : (
                  displayedTxns.map((pt, idx) => {
                    const method = (pt.PaymentMethod || '').toLowerCase();
                    const cat = (pt.Category || '').toLowerCase();
                    const desc = (pt.Description || '').toLowerCase();
                    const isCash = method === 'cash' || cat.includes('spot') || desc.includes('spot cash') || desc.includes('cash spot');

                    return (
                      <tr key={pt._id || idx} className="hover:bg-slate-50 transition">
                        <td className="p-3 text-slate-400 font-bold">{idx + 1}</td>
                        <td className="p-3 font-mono font-bold text-slate-700">{pt.Date || pt.TransactionDate || 'N/A'}</td>
                        <td className="p-3 font-mono font-bold text-indigo-700">{pt.TransactionID || pt.ReferenceNo || 'N/A'}</td>
                        <td className="p-3 font-mono font-semibold text-slate-800">{pt.ReferenceNo || 'N/A'}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isCash
                              ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                              : 'bg-indigo-100 text-indigo-900 border border-indigo-300'
                          }`}>
                            {isCash ? '💵 CASH' : '🏦 CREDIT / BANK'} ({pt.PaymentMethod || 'Bank'})
                          </span>
                        </td>
                        <td className="p-3 text-right font-mono font-black text-emerald-700 bg-emerald-50/50">
                          Rs. {Number(pt.Amount || 0).toLocaleString()}
                        </td>
                        <td className="p-3 text-slate-600 max-w-xs truncate">{pt.Description || 'Payment settlement'}</td>
                        <td className="p-3 text-center">
                          <button
                            type="button"
                            onClick={() => handlePrintSinglePaymentVoucher(pt, vVendor)}
                            className="px-2.5 py-1 text-[10px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded border border-indigo-200 transition cursor-pointer flex items-center space-x-1 mx-auto"
                            title="Print Payment Voucher"
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

        {/* Modal Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-200">
          <div className="text-xs text-slate-500 font-semibold">
            {vVendor.VendorName} Current Account Balance: <span className="font-bold text-rose-600">Rs. {Number(vVendor.Balance || 0).toLocaleString()}</span>
          </div>
          <button
            type="button"
            onClick={() => setPoHistoryModalData(null)}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl transition cursor-pointer"
          >
            Close Window
          </button>
        </div>
      </div>
    </div>
  );
};

export default PoPaymentHistoryModal;
