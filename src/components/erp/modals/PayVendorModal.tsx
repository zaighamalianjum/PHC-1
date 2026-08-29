import React, { useState } from 'react';
import { DollarSign, Printer, X, History, Coins, Calculator, CheckCircle2, Boxes, ChevronDown, ChevronUp, CreditCard, Banknote } from 'lucide-react';
import { ErpVendor, ErpPurchaseOrder, ErpGrn, ErpTransaction } from '../../../types';

interface PayVendorModalProps {
  payVendorModalData: {
    vendor: ErpVendor;
    poId?: string;
    invNo?: string;
    amount?: number;
    paymentMethod?: 'Cash' | 'Credit' | 'Bank' | 'Bank Transfer' | 'Cheque' | 'Online' | 'Online/Card';
    date?: string;
    description?: string;
  } | null;
  setPayVendorModalData: (data: any) => void;
  purchaseOrders: ErpPurchaseOrder[];
  grns: ErpGrn[];
  transactions: ErpTransaction[];
  setPoHistoryFilterPo: (val: string) => void;
  setPoHistoryModalData: (data: any) => void;
  handlePrintVendorStatement: (targetVendor?: ErpVendor) => void;
  handleSavePayVendorBill: (e: React.FormEvent) => void;
  isSubmitting: boolean;
}

export const PayVendorModal: React.FC<PayVendorModalProps> = ({
  payVendorModalData,
  setPayVendorModalData,
  purchaseOrders,
  grns,
  transactions,
  setPoHistoryFilterPo,
  setPoHistoryModalData,
  handlePrintVendorStatement,
  handleSavePayVendorBill,
  isSubmitting,
}) => {
  const [showHistoryTable, setShowHistoryTable] = useState(false);
  const [historyFilter, setHistoryFilter] = useState<'ALL' | 'CASH' | 'CREDIT'>('ALL');

  if (!payVendorModalData) return null;
  return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-emerald-100 text-emerald-800 rounded-xl font-bold">
                  <Coins className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">Pay Vendor Bill & Clear Payable</h3>
                  <p className="text-xs text-slate-500">
                    Vendor: <strong className="text-slate-800">{payVendorModalData.vendor.VendorName}</strong> ({payVendorModalData.vendor.VendorID || 'N/A'})
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                <button
                  type="button"
                  onClick={() => {
                    setPoHistoryFilterPo(payVendorModalData.poId || payVendorModalData.invNo || 'ALL');
                    setPoHistoryModalData({
                      vendor: payVendorModalData.vendor,
                      poId: payVendorModalData.poId || payVendorModalData.invNo
                    });
                  }}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg shadow-xs transition flex items-center space-x-1.5 cursor-pointer"
                  title="View Payment History for P.O. in Grid View"
                >
                  <History className="w-4 h-4" />
                  <span>Payment History for P.O.</span>
                </button>
                <button
                  type="button"
                  onClick={() => handlePrintVendorStatement(payVendorModalData.vendor)}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-xs transition flex items-center space-x-1.5 cursor-pointer"
                  title="Print official Vendor Statement summary & bill history"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Vendor Statement</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPayVendorModalData(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* VENDOR FINANCIAL SUMMARY CARD (BASED ON GRN HISTORY & PAYMENTS) */}
            {(() => {
              const vVendor = payVendorModalData.vendor;
              const vName = (vVendor.VendorName || '').trim().toLowerCase();
              const vId = (vVendor.VendorID || vVendor._id || '').trim().toLowerCase();

              const vGrns = (grns || []).filter(g => {
                const sName = (g.SupplierName || g.VendorName || '').trim().toLowerCase();
                const sId = (g.SupplierID || g.VendorID || '').trim().toLowerCase();
                return (vName && sName === vName) || (vId && sId === vId) || (sName && vName.includes(sName));
              });

              const totalGrnBilled = vGrns.reduce((sum, g) => sum + Number(g.TotalAmount || 0), 0);
              const totalGrnsCount = vGrns.length;

              const vTxns = (transactions || []).filter(t => {
                const tVName = (t.VendorName || '').trim().toLowerCase();
                const tVId = (t.VendorID || '').trim().toLowerCase();
                const isVendorPay = t.Type === 'VendorPayment' || t.Category === 'Vendor Payment' || (t.Type === 'Expense' && tVName);
                return isVendorPay && ((vName && tVName === vName) || (vId && tVId === vId) || (tVName && vName.includes(tVName)));
              });

              // Separate Cash vs Credit / Non-Cash Settlements
              const cashTxns = vTxns.filter(t => {
                const method = (t.PaymentMethod || '').toLowerCase();
                const cat = (t.Category || '').toLowerCase();
                const desc = (t.Description || '').toLowerCase();
                return method === 'cash' || cat.includes('spot') || desc.includes('spot cash') || desc.includes('cash spot');
              });

              const creditTxns = vTxns.filter(t => {
                const method = (t.PaymentMethod || '').toLowerCase();
                const cat = (t.Category || '').toLowerCase();
                const desc = (t.Description || '').toLowerCase();
                return !(method === 'cash' || cat.includes('spot') || desc.includes('spot cash') || desc.includes('cash spot'));
              });

              const totalCashPaid = cashTxns.reduce((sum, t) => sum + Number(t.Amount || 0), 0);
              const totalCreditPaid = creditTxns.reduce((sum, t) => sum + Number(t.Amount || 0), 0);
              const grandTotalPaid = totalCashPaid + totalCreditPaid;
              const currentBalance = vVendor.Balance || 0;

              return (
                <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 text-white rounded-xl p-4 shadow-md space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-700/80 pb-2.5">
                    <div className="flex items-center space-x-2">
                      <div className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg border border-emerald-500/30">
                        <Coins className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-[11px] font-black uppercase tracking-wider text-emerald-400 block">Vendor Financial & Settlement Summary</span>
                        <p className="text-[10px] text-slate-300">Detailed breakdown of GRN purchases, cash payments, credit clearances & balance</p>
                      </div>
                    </div>
                    <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full border ${
                      currentBalance > 0
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    }`}>
                      {currentBalance > 0 ? `● Outstanding Due: Rs. ${currentBalance.toLocaleString()}` : '✓ Account Cleared'}
                    </span>
                  </div>

                  {/* 4-GRID FINANCIAL SNAPSHOT WITH CASH, CREDIT & GRAND TOTAL */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                    {/* Card 1: Total Outstanding Payable */}
                    <div className="bg-white/10 backdrop-blur-xs border border-amber-500/30 rounded-lg p-2.5 space-y-0.5">
                      <span className="text-[9px] font-bold text-amber-300 uppercase tracking-wider block">Remaining Payable (Due)</span>
                      <div className="text-lg font-black font-mono text-amber-400">
                        Rs. {(currentBalance || 0).toLocaleString()}
                      </div>
                      <span className="text-[9px] text-slate-400 block">Payable Balance</span>
                    </div>

                    {/* Card 2: Cash Payments Settled */}
                    <div className="bg-white/10 backdrop-blur-xs border border-emerald-500/30 rounded-lg p-2.5 space-y-0.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-bold text-emerald-300 uppercase tracking-wider block">Cash Payments Paid</span>
                        <span className="text-[8px] bg-emerald-500/30 text-emerald-200 px-1 rounded font-bold">{cashTxns.length} Vouchers</span>
                      </div>
                      <div className="text-lg font-black font-mono text-emerald-300">
                        Rs. {(totalCashPaid || 0).toLocaleString()}
                      </div>
                      <span className="text-[9px] text-slate-400 block">Spot / Direct Cash</span>
                    </div>

                    {/* Card 3: Credit / Non-Cash Payments Settled */}
                    <div className="bg-white/10 backdrop-blur-xs border border-indigo-500/30 rounded-lg p-2.5 space-y-0.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-bold text-indigo-300 uppercase tracking-wider block">Credit / Bank Settled</span>
                        <span className="text-[8px] bg-indigo-500/30 text-indigo-200 px-1 rounded font-bold">{creditTxns.length} Vouchers</span>
                      </div>
                      <div className="text-lg font-black font-mono text-indigo-300">
                        Rs. {(totalCreditPaid || 0).toLocaleString()}
                      </div>
                      <span className="text-[9px] text-slate-400 block">Ledger / Bank Clearance</span>
                    </div>

                    {/* Card 4: Grand Total Settled Payments */}
                    <div className="bg-teal-500/20 backdrop-blur-xs border border-teal-400/50 rounded-lg p-2.5 space-y-0.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-black text-teal-300 uppercase tracking-wider block">Grand Total Settled</span>
                        <span className="text-[8px] bg-teal-400/30 text-teal-100 px-1 rounded font-bold">{vTxns.length} Total</span>
                      </div>
                      <div className="text-lg font-black font-mono text-teal-200">
                        Rs. {(grandTotalPaid || 0).toLocaleString()}
                      </div>
                      <span className="text-[9px] text-teal-300/80 block">Cash + Credit Cleared</span>
                    </div>
                  </div>

                  {/* Summary Bar showing Total GRN Invoiced vs Cleared */}
                  <div className="flex flex-wrap items-center justify-between text-[10px] text-slate-300 bg-black/30 p-2 rounded-lg border border-white/10 gap-y-1">
                    <div>
                      <span>Total GRN Purchases: </span>
                      <strong className="text-amber-300 font-mono">Rs. {(totalGrnBilled || 0).toLocaleString()}</strong>
                      <span className="text-slate-400 ml-1">({totalGrnsCount} {totalGrnsCount === 1 ? 'GRN' : 'GRNs'})</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span>Cash Paid: <strong className="text-emerald-400 font-mono">Rs. {totalCashPaid.toLocaleString()}</strong></span>
                      <span>•</span>
                      <span>Credit Paid: <strong className="text-indigo-400 font-mono">Rs. {totalCreditPaid.toLocaleString()}</strong></span>
                      <span>•</span>
                      <span>Grand Total Settled: <strong className="text-teal-300 font-mono">Rs. {grandTotalPaid.toLocaleString()}</strong></span>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Purchase Orders & GRNs for this Vendor */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Boxes className="w-4 h-4 text-indigo-600" />
                  <span>Select Purchase Order / Invoice Number</span>
                </label>
                <span className="text-[11px] text-slate-500 italic">Click PO to auto-fill invoice & amount</span>
              </div>

              {(() => {
                const vPos = purchaseOrders.filter(po => 
                  (po.VendorID && po.VendorID === payVendorModalData.vendor.VendorID) || 
                  (po.VendorName && po.VendorName.toLowerCase() === payVendorModalData.vendor.VendorName.toLowerCase())
                );
                const vGrns = grns.filter(g => 
                  (g.VendorID && g.VendorID === payVendorModalData.vendor.VendorID) || 
                  (g.VendorName && g.VendorName.toLowerCase() === payVendorModalData.vendor.VendorName.toLowerCase())
                );

                if (vPos.length === 0 && vGrns.length === 0) {
                  return (
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500 font-medium text-center">
                      No prior Purchase Orders or GRNs logged for this vendor. Enter Supplier Invoice Number manually below.
                    </div>
                  );
                }

                return (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto p-1 bg-slate-50 border border-slate-200 rounded-xl">
                    {vPos.map((po, idx) => {
                      const matchGrn = vGrns.find(g => g.POID === po.POID);
                      const invStr = matchGrn?.SupplierInvoiceNo || po.POID;
                      const isSelected = payVendorModalData.invNo === invStr || payVendorModalData.poId === po.POID;

                      const poTotal = po.TotalAmount || 0;
                      const alreadyPaidForPo = transactions
                        .filter(t => 
                          (t.VendorID === payVendorModalData.vendor.VendorID || (t.VendorName && t.VendorName.toLowerCase() === payVendorModalData.vendor.VendorName.toLowerCase())) &&
                          t.Type === 'VendorPayment' &&
                          (t.ReferenceNo === po.POID || t.ReferenceNo === invStr || (t.Description && t.Description.includes(po.POID)))
                        )
                        .reduce((sum, t) => sum + Number(t.Amount || 0), 0);

                      const poOutstanding = Math.max(0, poTotal - alreadyPaidForPo);

                      return (
                        <button
                          key={po.POID || idx}
                          type="button"
                          onClick={() => {
                            setPayVendorModalData(prev => prev ? ({
                              ...prev,
                              invNo: invStr,
                              poId: po.POID,
                              amount: poOutstanding > 0 ? poOutstanding : poTotal,
                              description: `Payment against PO #${po.POID} (Invoice #${invStr}) for ${prev.vendor.VendorName}`
                            }) : null);
                          }}
                          className={`p-2.5 rounded-lg border text-left transition flex items-center justify-between cursor-pointer ${
                            isSelected
                              ? 'bg-indigo-50 border-indigo-500 ring-2 ring-indigo-200 text-indigo-950 font-bold'
                              : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-100/80 text-slate-700'
                          }`}
                        >
                          <div>
                            <div className="flex items-center space-x-1.5">
                              <span className="font-mono text-xs font-black text-indigo-700">P.O. #{po.POID}</span>
                              {matchGrn?.SupplierInvoiceNo && (
                                <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded border font-mono">
                                  Inv: {matchGrn.SupplierInvoiceNo}
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-500 mt-0.5">
                              Total: Rs. {(poTotal || 0).toLocaleString()} {alreadyPaidForPo > 0 && `| Paid: Rs. ${(alreadyPaidForPo || 0).toLocaleString()}`}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-[10px] text-slate-500 uppercase font-bold">Remaining</div>
                            <div className="text-xs font-black font-mono text-amber-800">Rs. {(poOutstanding || 0).toLocaleString()}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                );
              })()}
            </div>

            {/* Payment Form */}
            <form onSubmit={handleSavePayVendorBill} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1 block">
                    Vendor Invoice / Supplier Bill No <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder=""
                    value={payVendorModalData.invNo}
                    onChange={e => setPayVendorModalData({ ...payVendorModalData, invNo: e.target.value })}
                    className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-xl font-mono font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-700">
                      Payment Amount (PKR) <span className="text-rose-500">*</span>
                    </label>
                    
                    {/* Quick percentage calculation buttons based on selected PO balance or vendor balance */}
                    {(() => {
                      const vPos = purchaseOrders.filter(po => 
                        (po.VendorID && po.VendorID === payVendorModalData.vendor.VendorID) || 
                        (po.VendorName && po.VendorName.toLowerCase() === payVendorModalData.vendor.VendorName.toLowerCase())
                      );
                      const vGrns = grns.filter(g => 
                        (g.VendorID && g.VendorID === payVendorModalData.vendor.VendorID) || 
                        (g.VendorName && g.VendorName.toLowerCase() === payVendorModalData.vendor.VendorName.toLowerCase())
                      );
                      const selectedPo = vPos.find(p => p.POID === payVendorModalData.poId || p.POID === payVendorModalData.invNo);
                      
                      let maxAmt = payVendorModalData.vendor.Balance;
                      if (selectedPo) {
                        const poTotal = selectedPo.TotalAmount || 0;
                        const matchGrn = vGrns.find(g => g.POID === selectedPo.POID);
                        const invStr = matchGrn?.SupplierInvoiceNo || selectedPo.POID;
                        const alreadyPaid = transactions
                          .filter(t => 
                            (t.VendorID === payVendorModalData.vendor.VendorID || (t.VendorName && t.VendorName.toLowerCase() === payVendorModalData.vendor.VendorName.toLowerCase())) &&
                            t.Type === 'VendorPayment' &&
                            (t.ReferenceNo === selectedPo.POID || t.ReferenceNo === invStr || (t.Description && t.Description.includes(selectedPo.POID)))
                          )
                          .reduce((sum, t) => sum + Number(t.Amount || 0), 0);
                        const rem = Math.max(0, poTotal - alreadyPaid);
                        if (rem > 0) maxAmt = rem;
                      }

                      return (
                        <div className="flex items-center space-x-1">
                          {[25, 50, 75, 100].map(pct => {
                            const calculated = Math.round((maxAmt * pct) / 100);
                            return (
                              <button
                                key={pct}
                                type="button"
                                onClick={() => setPayVendorModalData({ ...payVendorModalData, amount: calculated })}
                                className="px-1.5 py-0.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[10px] font-black rounded border border-emerald-300 transition cursor-pointer"
                                title={`Set ${pct}% of balance (Rs. ${(calculated || 0).toLocaleString()})`}
                              >
                                {pct}%
                              </button>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>
                  <input
                    type="number"
                    required
                    min={1}
                    step="any"
                    placeholder=""
                    value={payVendorModalData.amount || ''}
                    onChange={e => setPayVendorModalData({ ...payVendorModalData, amount: Number(e.target.value) })}
                    className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-xl font-mono font-bold text-emerald-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1 block">Payment Method / Mode</label>
                  <select
                    value={payVendorModalData.paymentMethod || 'Bank'}
                    onChange={e => setPayVendorModalData({ ...payVendorModalData, paymentMethod: e.target.value as any })}
                    className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-xl font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="Cash">Cash (Spot / Direct Cash Payment)</option>
                    <option value="Credit">Credit / Payable Settlement (Clear Ledger Bill)</option>
                    <option value="Bank">Bank Transfer / Online (Credit Settlement)</option>
                    <option value="Cheque">Cheque (Payable Settlement)</option>
                    <option value="Online">Online Gateway Payment</option>
                  </select>
                  <p className="text-[10px] text-slate-500 mt-1">
                    {payVendorModalData.paymentMethod === 'Cash'
                      ? '💵 Recorded as Direct Cash Outflow / Spot Cash Settlement.'
                      : '🏦 Recorded as Credit Bill / Accounts Payable Clearance.'}
                  </p>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1 block">Payment Date</label>
                  <input
                    type="date"
                    required
                    value={payVendorModalData.date}
                    onChange={e => setPayVendorModalData({ ...payVendorModalData, date: e.target.value })}
                    className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 mb-1 block">Payment Description / Notes</label>
                <input
                  type="text"
                  placeholder=""
                  value={payVendorModalData.description}
                  onChange={e => setPayVendorModalData({ ...payVendorModalData, description: e.target.value })}
                  className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              {/* COLLAPSIBLE SETTLED PAYMENTS HISTORY (CASH VS CREDIT BREAKDOWN) */}
              {(() => {
                const vVendor = payVendorModalData.vendor;
                const vName = (vVendor.VendorName || '').trim().toLowerCase();
                const vId = (vVendor.VendorID || vVendor._id || '').trim().toLowerCase();

                const vTxns = (transactions || []).filter(t => {
                  const tVName = (t.VendorName || '').trim().toLowerCase();
                  const tVId = (t.VendorID || '').trim().toLowerCase();
                  const isVendorPay = t.Type === 'VendorPayment' || t.Category === 'Vendor Payment' || (t.Type === 'Expense' && tVName);
                  return isVendorPay && ((vName && tVName === vName) || (vId && tVId === vId) || (tVName && vName.includes(tVName)));
                });

                const cashTxns = vTxns.filter(t => {
                  const method = (t.PaymentMethod || '').toLowerCase();
                  const cat = (t.Category || '').toLowerCase();
                  const desc = (t.Description || '').toLowerCase();
                  return method === 'cash' || cat.includes('spot') || desc.includes('spot cash') || desc.includes('cash spot');
                });

                const creditTxns = vTxns.filter(t => {
                  const method = (t.PaymentMethod || '').toLowerCase();
                  const cat = (t.Category || '').toLowerCase();
                  const desc = (t.Description || '').toLowerCase();
                  return !(method === 'cash' || cat.includes('spot') || desc.includes('spot cash') || desc.includes('cash spot'));
                });

                const totalCashPaid = cashTxns.reduce((sum, t) => sum + Number(t.Amount || 0), 0);
                const totalCreditPaid = creditTxns.reduce((sum, t) => sum + Number(t.Amount || 0), 0);
                const grandTotalPaid = totalCashPaid + totalCreditPaid;

                const displayedTxns = historyFilter === 'CASH'
                  ? cashTxns
                  : historyFilter === 'CREDIT'
                  ? creditTxns
                  : vTxns;

                return (
                  <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50">
                    <button
                      type="button"
                      onClick={() => setShowHistoryTable(!showHistoryTable)}
                      className="w-full p-3 flex items-center justify-between text-left hover:bg-slate-100/80 transition cursor-pointer"
                    >
                      <div className="flex items-center space-x-2">
                        <History className="w-4 h-4 text-indigo-600" />
                        <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                          Settled Payments Log & Mode Breakdown ({vTxns.length} records)
                        </span>
                      </div>
                      <div className="flex items-center space-x-3 text-xs">
                        <span className="text-emerald-700 font-bold font-mono">Cash: Rs. {totalCashPaid.toLocaleString()}</span>
                        <span className="text-slate-400">|</span>
                        <span className="text-indigo-700 font-bold font-mono">Credit: Rs. {totalCreditPaid.toLocaleString()}</span>
                        <span className="text-slate-400">|</span>
                        <span className="text-teal-800 font-black font-mono">Grand Total: Rs. {grandTotalPaid.toLocaleString()}</span>
                        {showHistoryTable ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                      </div>
                    </button>

                    {showHistoryTable && (
                      <div className="p-3 border-t border-slate-200 space-y-2.5 bg-white">
                        {/* Filter Tabs */}
                        <div className="flex items-center space-x-2">
                          <button
                            type="button"
                            onClick={() => setHistoryFilter('ALL')}
                            className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition cursor-pointer ${
                              historyFilter === 'ALL'
                                ? 'bg-slate-900 text-white'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            All Payments ({vTxns.length}) - Rs. {grandTotalPaid.toLocaleString()}
                          </button>
                          <button
                            type="button"
                            onClick={() => setHistoryFilter('CASH')}
                            className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition cursor-pointer ${
                              historyFilter === 'CASH'
                                ? 'bg-emerald-600 text-white'
                                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
                            }`}
                          >
                            Cash Payments ({cashTxns.length}) - Rs. {totalCashPaid.toLocaleString()}
                          </button>
                          <button
                            type="button"
                            onClick={() => setHistoryFilter('CREDIT')}
                            className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition cursor-pointer ${
                              historyFilter === 'CREDIT'
                                ? 'bg-indigo-600 text-white'
                                : 'bg-indigo-50 text-indigo-800 hover:bg-indigo-100 border border-indigo-200'
                            }`}
                          >
                            Credit / Bank Settlements ({creditTxns.length}) - Rs. {totalCreditPaid.toLocaleString()}
                          </button>
                        </div>

                        {/* Transactions Table */}
                        <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-lg">
                          <table className="w-full text-left text-xs font-sans">
                            <thead className="bg-slate-100 text-slate-700 font-bold sticky top-0 text-[10px] uppercase">
                              <tr>
                                <th className="p-2">Date</th>
                                <th className="p-2">Voucher #</th>
                                <th className="p-2">Type / Mode</th>
                                <th className="p-2 text-right">Amount Paid</th>
                                <th className="p-2">Remarks / Ref</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {displayedTxns.length === 0 ? (
                                <tr>
                                  <td colSpan={5} className="p-4 text-center text-slate-400">
                                    No payment records found for this category.
                                  </td>
                                </tr>
                              ) : (
                                displayedTxns.map((pt, idx) => {
                                  const method = (pt.PaymentMethod || '').toLowerCase();
                                  const cat = (pt.Category || '').toLowerCase();
                                  const desc = (pt.Description || '').toLowerCase();
                                  const isCash = method === 'cash' || cat.includes('spot') || desc.includes('spot cash') || desc.includes('cash spot');

                                  return (
                                    <tr key={pt._id || pt.TransactionID || idx} className="hover:bg-slate-50">
                                      <td className="p-2 font-mono text-slate-600">{pt.Date || pt.TransactionDate || 'N/A'}</td>
                                      <td className="p-2 font-mono font-bold text-slate-800">{pt.TransactionID || pt.ReferenceNo || 'N/A'}</td>
                                      <td className="p-2">
                                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                                          isCash
                                            ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                                            : 'bg-indigo-100 text-indigo-900 border border-indigo-300'
                                        }`}>
                                          {isCash ? '💵 CASH PAYMENT' : '🏦 CREDIT / BANK SETTLED'} ({pt.PaymentMethod || 'Bank'})
                                        </span>
                                      </td>
                                      <td className="p-2 text-right font-mono font-bold text-emerald-700">
                                        Rs. {Number(pt.Amount || 0).toLocaleString()}
                                      </td>
                                      <td className="p-2 text-slate-600 max-w-xs truncate text-[11px]">{pt.Description || pt.ReferenceNo || '-'}</td>
                                    </tr>
                                  );
                                })
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* LIVE PO & PAYABLE CALCULATION BREAKDOWN */}
              {(() => {
                const vPos = purchaseOrders.filter(po => 
                  (po.VendorID && po.VendorID === payVendorModalData.vendor.VendorID) || 
                  (po.VendorName && po.VendorName.toLowerCase() === payVendorModalData.vendor.VendorName.toLowerCase())
                );
                const vGrns = grns.filter(g => 
                  (g.VendorID && g.VendorID === payVendorModalData.vendor.VendorID) || 
                  (g.VendorName && g.VendorName.toLowerCase() === payVendorModalData.vendor.VendorName.toLowerCase())
                );
                
                const selectedPo = vPos.find(p => p.POID === payVendorModalData.poId || p.POID === payVendorModalData.invNo);
                
                let poTotal = 0;
                let poPaid = 0;
                let poOutstandingBefore = 0;

                if (selectedPo) {
                  poTotal = selectedPo.TotalAmount || 0;
                  const matchGrn = vGrns.find(g => g.POID === selectedPo.POID);
                  const invStr = matchGrn?.SupplierInvoiceNo || selectedPo.POID;
                  poPaid = transactions
                    .filter(t => 
                      (t.VendorID === payVendorModalData.vendor.VendorID || (t.VendorName && t.VendorName.toLowerCase() === payVendorModalData.vendor.VendorName.toLowerCase())) &&
                      t.Type === 'VendorPayment' &&
                      (t.ReferenceNo === selectedPo.POID || t.ReferenceNo === invStr || (t.Description && t.Description.includes(selectedPo.POID)))
                    )
                    .reduce((sum, t) => sum + Number(t.Amount || 0), 0);
                  poOutstandingBefore = Math.max(0, poTotal - poPaid);
                } else {
                  poTotal = payVendorModalData.vendor.Balance;
                  poOutstandingBefore = payVendorModalData.vendor.Balance;
                }

                const payingAmt = Number(payVendorModalData.amount || 0);
                const poResidualAfter = Math.max(0, poOutstandingBefore - payingAmt);
                const vendorPayableAfter = Math.max(0, payVendorModalData.vendor.Balance - payingAmt);

                return (
                  <div className="bg-slate-900 text-white rounded-xl p-3.5 space-y-2.5 border border-slate-800 shadow-inner">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <div className="flex items-center space-x-2">
                        <Calculator className="w-4 h-4 text-emerald-400" />
                        <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                          {selectedPo ? `P.O. #${selectedPo.POID} Payment Breakdown` : 'Vendor Payable Breakdown'}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                        Automatic Adjustment
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      <div className="bg-slate-800/60 p-2 rounded-lg border border-slate-700/60">
                        <span className="text-slate-400 text-[10px] uppercase font-semibold block">Total PO Bill</span>
                        <span className="font-mono font-bold text-slate-100">
                          Rs. {(poTotal || 0).toLocaleString()}
                        </span>
                      </div>

                      <div className="bg-slate-800/60 p-2 rounded-lg border border-slate-700/60">
                        <span className="text-slate-400 text-[10px] uppercase font-semibold block">Already Settled</span>
                        <span className="font-mono font-bold text-emerald-400">
                          Rs. {(poPaid || 0).toLocaleString()}
                        </span>
                      </div>

                      <div className="bg-slate-800/60 p-2 rounded-lg border border-slate-700/60">
                        <span className="text-slate-400 text-[10px] uppercase font-semibold block">Paying Now</span>
                        <span className="font-mono font-black text-amber-400">
                          - Rs. {(payingAmt || 0).toLocaleString()}
                        </span>
                      </div>

                      <div className="bg-slate-800/60 p-2 rounded-lg border border-slate-700/60">
                        <span className="text-slate-400 text-[10px] uppercase font-bold block">
                          {selectedPo ? 'Residual PO Balance' : 'Payable Remaining'}
                        </span>
                        <span className={`font-mono font-black ${poResidualAfter === 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                          Rs. {(poResidualAfter || 0).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <div className="text-[11px] text-slate-300 bg-slate-800/90 p-2 rounded-lg border border-slate-700/80 flex items-center justify-between">
                      <span className="font-medium">Total Vendor Payable After This Payment:</span>
                      <strong className="font-mono text-emerald-400 font-black text-xs">
                        Rs. {(vendorPayableAfter || 0).toLocaleString()}
                      </strong>
                    </div>
                  </div>
                );
              })()}

              {/* Modal Buttons */}
              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setPayVendorModalData(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-100 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition flex items-center space-x-2 cursor-pointer disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirm & Post Vendor Payment</span>
                </button>
              </div>
            </form>
          </div>
        </div>
  );
};

export default PayVendorModal;
