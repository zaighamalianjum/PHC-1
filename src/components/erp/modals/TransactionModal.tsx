import React from 'react';
import { Receipt, X } from 'lucide-react';
import { ErpVendor, ErpGrn } from '../../../types';

interface TransactionModalProps {
  showTxnModal: boolean;
  setShowTxnModal: (show: boolean) => void;
  txnForm: any;
  setTxnForm: (form: any) => void;
  vendors: ErpVendor[];
  grns?: ErpGrn[];
  handleSaveTransaction?: (e: React.FormEvent) => void;
  handleAddTxn?: (e: React.FormEvent) => void;
  isSubmitting: boolean;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  showTxnModal,
  setShowTxnModal,
  txnForm,
  setTxnForm,
  vendors,
  grns = [],
  handleSaveTransaction,
  handleAddTxn,
  isSubmitting,
}) => {
  if (!showTxnModal) return null;
  const onSubmit = handleAddTxn || handleSaveTransaction || ((e) => e.preventDefault());

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border space-y-4">
        <h3 className="font-bold text-slate-900 text-base">Log Financial Voucher</h3>
        <form onSubmit={onSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-bold text-slate-600">Type</label>
              <select
                value={txnForm.Type}
                onChange={e => setTxnForm({ ...txnForm, Type: e.target.value as any })}
                className="w-full mt-1 p-2 border rounded-xl text-xs bg-white"
              >
                <option value="Expense">Expense</option>
                <option value="Income">Income</option>
                <option value="VendorPayment">Vendor Payment</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600">Payment Method</label>
              <select
                value={txnForm.PaymentMethod}
                onChange={e => setTxnForm({ ...txnForm, PaymentMethod: e.target.value as any })}
                className="w-full mt-1 p-2 border rounded-xl text-xs bg-white"
              >
                <option value="Cash">Cash</option>
                <option value="Bank">Bank Transfer</option>
                <option value="Cheque">Cheque</option>
              </select>
            </div>
          </div>

          {txnForm.Type === 'VendorPayment' && (
            <div className="space-y-3 bg-amber-50/70 p-3 rounded-xl border border-amber-200/80">
              <div>
                <label className="text-xs font-bold text-amber-900 block mb-1">Select Vendor / Supplier</label>
                <select
                  value={txnForm.VendorID || ''}
                  onChange={e => {
                    const selV = vendors.find(v => (v.VendorID === e.target.value || v._id === e.target.value));
                    setTxnForm({
                      ...txnForm,
                      VendorID: selV?.VendorID || e.target.value,
                      VendorName: selV?.VendorName || '',
                      Category: 'Vendor Payment',
                      Description: selV ? `Payment settlement to ${selV.VendorName}` : txnForm.Description
                    });
                  }}
                  className="w-full p-2 border border-amber-300 rounded-xl text-xs bg-white font-bold text-slate-800"
                >
                  <option value="">-- Choose Vendor --</option>
                  {vendors.map((v, idx) => (
                    <option key={idx} value={v.VendorID}>
                      {v.VendorName} (Outstanding: Rs. {(v.Balance || 0).toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-amber-900 block mb-1">Supplier Bill / Invoice Ref # (Optional)</label>
                <input
                  type="text"
                  value={txnForm.ReferenceNo || ''}
                  onChange={e => setTxnForm({ 
                    ...txnForm, 
                    ReferenceNo: e.target.value,
                    Description: e.target.value ? `Payment against Vendor Invoice #${e.target.value} for ${txnForm.VendorName || 'Vendor'}` : txnForm.Description
                  })}
                  placeholder=""
                  className="w-full p-2 border rounded-xl text-xs bg-white font-mono font-bold text-indigo-900 border-amber-300 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                />

                {(() => {
                  const matchingGrns = grns.filter(g => 
                    (txnForm.VendorID && g.VendorID === txnForm.VendorID) ||
                    (txnForm.VendorName && g.VendorName === txnForm.VendorName)
                  );
                  if (matchingGrns.length === 0) return null;

                  return (
                    <div className="mt-2">
                      <span className="text-[10px] font-bold text-amber-800 block mb-1">
                        Available GRNs/Invoices for this Vendor:
                      </span>
                      <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                        {matchingGrns.map((g, gIdx) => {
                          const invLabel = g.SupplierInvoiceNo || g.ChallanNo || g.GRNID;
                          return (
                            <button
                              type="button"
                              key={gIdx}
                              onClick={() => setTxnForm({
                                ...txnForm,
                                ReferenceNo: invLabel,
                                Amount: g.TotalAmount || txnForm.Amount || 0,
                                Description: `Payment against Vendor Invoice #${invLabel} (${g.GRNID})`
                              })}
                              className="text-[10px] px-2 py-1 bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg font-mono font-bold transition cursor-pointer"
                            >
                              Inv: {invLabel} (Rs. {(g.TotalAmount || 0).toLocaleString()})
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          <div>
            <label className="text-xs font-bold text-slate-600">Category</label>
            <input
              type="text"
              required
              value={txnForm.Category || ''}
              onChange={e => setTxnForm({ ...txnForm, Category: e.target.value })}
              className="w-full mt-1 p-2 border rounded-xl text-xs"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-600">Description</label>
            <textarea
              value={txnForm.Description || ''}
              onChange={e => setTxnForm({ ...txnForm, Description: e.target.value })}
              rows={2}
              className="w-full mt-1 p-2 border rounded-xl text-xs"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-600">Amount (Rs.)</label>
            <input
              type="number"
              required
              min="0"
              value={txnForm.Amount || ''}
              onChange={e => setTxnForm({ ...txnForm, Amount: Number(e.target.value) })}
              className="w-full mt-1 p-2 border rounded-xl text-xs font-bold font-mono"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-600">Transaction / Payment Date</label>
            <input
              type="date"
              required
              value={txnForm.Date || new Date().toISOString().split('T')[0]}
              onChange={e => setTxnForm({ ...txnForm, Date: e.target.value })}
              className="w-full mt-1 p-2 border rounded-xl text-xs"
            />
          </div>

          {/* ACCOUNTING MONTH SELECTOR */}
          <div className="bg-purple-50/80 border border-purple-200 rounded-xl p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-xs font-black text-purple-950 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-purple-600"></span>
                  P&amp;L Accounting Month (حساب کا مہینہ)
                </label>
                <p className="text-[10px] text-purple-700">
                  Yeh transaction kis month ke P&amp;L report mein count ho?
                </p>
              </div>
              <input
                type="month"
                value={txnForm.AccountingMonth || (txnForm.Date ? txnForm.Date.slice(0, 7) : new Date().toISOString().slice(0, 7))}
                onChange={e => setTxnForm({ ...txnForm, AccountingMonth: e.target.value })}
                className="text-xs font-black p-1 bg-white border border-purple-300 rounded-lg text-purple-950 focus:ring-2 focus:ring-purple-500 font-mono"
              />
            </div>

            {/* Quick month pills */}
            {(() => {
              const now = new Date();
              const curY = now.getFullYear();
              const curM = now.getMonth() + 1;
              const monthsList: { key: string; label: string; sub: string }[] = [];
              for (let i = 0; i < 4; i++) {
                const d = new Date(curY, curM - 1 - i, 1);
                const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                const label = d.toLocaleString('en-US', { month: 'short', year: 'numeric' });
                const sub = i === 0 ? 'Current' : (i === 1 ? 'Prev' : '');
                monthsList.push({ key, label, sub });
              }
              const selectedMonth = txnForm.AccountingMonth || (txnForm.Date ? txnForm.Date.slice(0, 7) : new Date().toISOString().slice(0, 7));

              return (
                <div className="flex flex-wrap items-center gap-1 pt-0.5">
                  <span className="text-[10px] font-bold text-purple-800 mr-1">Quick Select:</span>
                  {monthsList.map(m => {
                    const isSel = selectedMonth === m.key;
                    return (
                      <button
                        key={m.key}
                        type="button"
                        onClick={() => setTxnForm({ ...txnForm, AccountingMonth: m.key })}
                        className={`px-2 py-0.5 text-[11px] font-bold rounded-lg transition border cursor-pointer flex items-center gap-1 ${
                          isSel
                            ? 'bg-purple-700 text-white border-purple-800 shadow-xs'
                            : 'bg-white hover:bg-purple-100/70 text-purple-900 border-purple-200'
                        }`}
                      >
                        <span>{m.label}</span>
                        {m.sub && (
                          <span className={`text-[8px] px-1 py-0.2 rounded font-mono ${isSel ? 'bg-purple-900/60 text-purple-200' : 'bg-purple-100 text-purple-700'}`}>
                            {m.sub}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              );
            })()}
          </div>

          <div className="flex justify-end space-x-2 pt-3 border-t">
            <button
              type="button"
              onClick={() => setShowTxnModal(false)}
              className="px-4 py-2 border rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-xs disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Post Transaction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TransactionModal;
