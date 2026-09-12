import React, { useState } from 'react';
import { DollarSign, Printer, X, History, Coins, Calculator, CheckCircle2, Boxes, ChevronDown, ChevronUp, CreditCard, Banknote } from 'lucide-react';
import { ErpVendor, ErpPurchaseOrder, ErpGrn, ErpTransaction } from '../../../types';
import { computeVendorBalanceBreakdown } from '../erpUtils';

interface PayVendorModalProps {
  payVendorModalData: {
    vendor: ErpVendor;
    poId?: string;
    invNo?: string;
    amount?: number;
    paymentMethod?: 'Cash' | 'Credit' | 'Bank' | 'Bank Transfer' | 'Cheque' | 'Online' | 'Online/Card';
    targetBillType?: 'Credit' | 'Cash';
    category?: string;
    date?: string;
    accountingMonth?: string; // e.g. "2026-08" for P&L posting
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
              const vBreakdown = computeVendorBalanceBreakdown(vVendor, grns, transactions);
              const vName = (vVendor.VendorName || '').trim().toLowerCase();
              const vId = (vVendor.VendorID || vVendor._id || '').trim().toLowerCase();

              const vGrns = (grns || []).filter(g => {
                const sName = (g.SupplierName || g.VendorName || '').trim().toLowerCase();
                const sId = (g.SupplierID || g.VendorID || '').trim().toLowerCase();
                return (vName && sName === vName) || (vId && sId === vId) || (sName && vName.includes(sName));
              });

              const totalGrnBilled = vBreakdown.totalPurchased;
              const totalGrnsCount = vGrns.length;

              const vTxns = (transactions || []).filter(t => {
                const tVName = (t.VendorName || '').trim().toLowerCase();
                const tVId = (t.VendorID || '').trim().toLowerCase();
                const isVendorPay = t.Type === 'VendorPayment' || t.Category === 'Vendor Payment' || (t.Type === 'Expense' && tVName);
                return isVendorPay && ((vName && tVName === vName) || (vId && tVId === vId) || (tVName && vName.includes(tVName)));
              });

              const totalCashPaid = vBreakdown.cashPaid;
              const totalCreditPaid = vBreakdown.creditPaid;
              const grandTotalPaid = vBreakdown.totalPaid;
              const currentBalance = vBreakdown.outstandingBalance;

              return (
                <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white rounded-xl p-4 shadow-md space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-700/80 pb-2.5">
                    <div className="flex items-center space-x-2">
                      <div className="p-1.5 bg-indigo-500/20 text-indigo-400 rounded-lg border border-indigo-500/30">
                        <Coins className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-[11px] font-black uppercase tracking-wider text-indigo-300 block">Vendor Financial & Settlement Summary</span>
                        <p className="text-[10px] text-slate-300">Separate balances for Credit Purchases &amp; Cash Purchases</p>
                      </div>
                    </div>
                    <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full border ${
                      currentBalance > 0
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    }`}>
                      {currentBalance > 0 ? `● Total Due: Rs. ${currentBalance.toLocaleString()}` : '✓ Account Cleared'}
                    </span>
                  </div>

                  {/* 4-GRID FINANCIAL SNAPSHOT WITH CASH DUE, CREDIT DUE & TOTAL */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                    {/* Card 1: Credit Balance Due */}
                    <div className="bg-indigo-950/50 backdrop-blur-xs border border-indigo-500/40 rounded-lg p-2.5 space-y-0.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-bold text-indigo-300 uppercase tracking-wider block">Credit Balance Due</span>
                        <CreditCard className="w-3.5 h-3.5 text-indigo-400" />
                      </div>
                      <div className="text-lg font-black font-mono text-indigo-300">
                        Rs. {(vBreakdown.creditBalance || 0).toLocaleString()}
                      </div>
                      <span className="text-[9px] text-slate-400 block">From Credit Purchases</span>
                    </div>

                    {/* Card 2: Cash Purchases Balance Due */}
                    <div className="bg-emerald-950/50 backdrop-blur-xs border border-emerald-500/40 rounded-lg p-2.5 space-y-0.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-bold text-emerald-300 uppercase tracking-wider block">Cash Purchases Due</span>
                        <Banknote className="w-3.5 h-3.5 text-emerald-400" />
                      </div>
                      <div className="text-lg font-black font-mono text-emerald-300">
                        Rs. {(vBreakdown.cashBalance || 0).toLocaleString()}
                      </div>
                      <span className="text-[9px] text-slate-400 block">From Cash Purchases</span>
                    </div>

                    {/* Card 3: Total Outstanding Payable */}
                    <div className="bg-amber-950/40 backdrop-blur-xs border border-amber-500/40 rounded-lg p-2.5 space-y-0.5">
                      <span className="text-[9px] font-bold text-amber-300 uppercase tracking-wider block">Total Payable Due</span>
                      <div className="text-lg font-black font-mono text-amber-300">
                        Rs. {(currentBalance || 0).toLocaleString()}
                      </div>
                      <span className="text-[9px] text-amber-200/70 block">Credit + Cash Due</span>
                    </div>

                    {/* Card 4: Total Settled Payments */}
                    <div className="bg-white/10 backdrop-blur-xs border border-slate-700 rounded-lg p-2.5 space-y-0.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-black text-slate-300 uppercase tracking-wider block">Total Settled (Paid)</span>
                        <span className="text-[8px] bg-slate-700 text-slate-200 px-1 rounded font-bold">{vTxns.length} Vouchers</span>
                      </div>
                      <div className="text-lg font-black font-mono text-white">
                        Rs. {(grandTotalPaid || 0).toLocaleString()}
                      </div>
                      <span className="text-[9px] text-slate-400 block">
                        Cash: {totalCashPaid.toLocaleString()} | Credit: {totalCreditPaid.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Summary Bar showing Total GRN Invoiced vs Cleared */}
                  <div className="flex flex-wrap items-center justify-between text-[10px] text-slate-300 bg-black/30 p-2 rounded-lg border border-white/10 gap-y-1">
                    <div>
                      <span>Total Purchases: </span>
                      <strong className="text-white font-mono">Rs. {(totalGrnBilled || 0).toLocaleString()}</strong>
                      <span className="text-slate-400 ml-1.5">
                        (Credit: <strong className="text-indigo-300">Rs. {vBreakdown.creditPurchased.toLocaleString()}</strong> • Cash: <strong className="text-emerald-300">Rs. {vBreakdown.cashPurchased.toLocaleString()}</strong>)
                      </span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span>Total Settled: <strong className="text-teal-300 font-mono">Rs. {grandTotalPaid.toLocaleString()}</strong></span>
                      <span>•</span>
                      <span>Net Balance: <strong className="text-amber-300 font-mono">Rs. {currentBalance.toLocaleString()}</strong></span>
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
                      const isCashPurchase = matchGrn?.PaymentMethod === 'Cash' || po.PaymentTerms === 'Cash';

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
                              targetBillType: isCashPurchase ? 'Cash' : 'Credit',
                              paymentMethod: isCashPurchase ? 'Cash' : (prev.paymentMethod === 'Cash' ? 'Bank' : prev.paymentMethod),
                              amount: poOutstanding > 0 ? poOutstanding : poTotal,
                              description: `Payment against PO #${po.POID} (${isCashPurchase ? 'Cash Purchase' : 'Credit Bill'} Inv #${invStr}) for ${prev.vendor.VendorName}`
                            }) : null);
                          }}
                          className={`p-2.5 rounded-lg border text-left transition flex items-center justify-between cursor-pointer ${
                            isSelected
                              ? 'bg-indigo-50 border-indigo-500 ring-2 ring-indigo-200 text-indigo-950 font-bold'
                              : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-100/80 text-slate-700'
                          }`}
                        >
                          <div>
                            <div className="flex items-center space-x-1.5 flex-wrap gap-1">
                              <span className="font-mono text-xs font-black text-indigo-700">P.O. #{po.POID}</span>
                              {isCashPurchase ? (
                                <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-bold border border-emerald-200">
                                  💵 Cash Purchase
                                </span>
                              ) : (
                                <span className="text-[9px] bg-indigo-100 text-indigo-800 px-1.5 py-0.2 rounded font-bold border border-indigo-200">
                                  💳 Credit Bill
                                </span>
                              )}
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

            {/* BILL CATEGORY SELECTION: CREDIT BILL VS CASH PURCHASE BILL */}
            {(() => {
              const vVendor = payVendorModalData.vendor;
              const vBreakdown = computeVendorBalanceBreakdown(vVendor, grns, transactions);
              const currentTarget = payVendorModalData.targetBillType || 'Credit';

              return (
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <span>Select Bill / Ledger to Settle</span>
                      <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[10px] font-bold text-slate-500">
                      Total Due: <strong className="text-amber-800 font-mono">Rs. {vBreakdown.outstandingBalance.toLocaleString()}</strong>
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {/* Option 1: Credit Bill Payment */}
                    <button
                      type="button"
                      onClick={() => {
                        setPayVendorModalData(prev => prev ? ({
                          ...prev,
                          targetBillType: 'Credit',
                          amount: vBreakdown.creditBalance > 0 ? vBreakdown.creditBalance : prev.amount
                        }) : null);
                      }}
                      className={`p-3 rounded-xl border text-left transition cursor-pointer flex items-center justify-between relative overflow-hidden ${
                        currentTarget === 'Credit'
                          ? 'bg-indigo-600 text-white border-indigo-700 shadow-md ring-2 ring-indigo-300'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100/90'
                      }`}
                    >
                      <div className="space-y-0.5">
                        <div className="font-bold text-xs flex items-center gap-1.5">
                          <CreditCard className={`w-4 h-4 ${currentTarget === 'Credit' ? 'text-indigo-200' : 'text-indigo-600'}`} />
                          <span>Pay Credit Bill</span>
                        </div>
                        <p className={`text-[10px] ${currentTarget === 'Credit' ? 'text-indigo-100' : 'text-slate-500'}`}>
                          Regular supplier credit ledger settlement
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-[9px] uppercase font-bold block opacity-80">Credit Due</span>
                        <span className={`text-sm font-black font-mono ${currentTarget === 'Credit' ? 'text-white' : 'text-indigo-700'}`}>
                          Rs. {vBreakdown.creditBalance.toLocaleString()}
                        </span>
                      </div>
                    </button>

                    {/* Option 2: Cash Purchase Bill Payment */}
                    <button
                      type="button"
                      onClick={() => {
                        setPayVendorModalData(prev => prev ? ({
                          ...prev,
                          targetBillType: 'Cash',
                          paymentMethod: 'Cash',
                          amount: vBreakdown.cashBalance > 0 ? vBreakdown.cashBalance : prev.amount
                        }) : null);
                      }}
                      className={`p-3 rounded-xl border text-left transition cursor-pointer flex items-center justify-between relative overflow-hidden ${
                        currentTarget === 'Cash'
                          ? 'bg-emerald-600 text-white border-emerald-700 shadow-md ring-2 ring-emerald-300'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100/90'
                      }`}
                    >
                      <div className="space-y-0.5">
                        <div className="font-bold text-xs flex items-center gap-1.5">
                          <Banknote className={`w-4 h-4 ${currentTarget === 'Cash' ? 'text-emerald-200' : 'text-emerald-600'}`} />
                          <span>Pay Cash Purchase Bill</span>
                        </div>
                        <p className={`text-[10px] ${currentTarget === 'Cash' ? 'text-emerald-100' : 'text-slate-500'}`}>
                          Settling spot/cash purchase bills
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-[9px] uppercase font-bold block opacity-80">Cash Due</span>
                        <span className={`text-sm font-black font-mono ${currentTarget === 'Cash' ? 'text-white' : 'text-emerald-700'}`}>
                          Rs. {vBreakdown.cashBalance.toLocaleString()}
                        </span>
                      </div>
                    </button>
                  </div>
                </div>
              );
            })()}

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
                    
                    {/* Quick percentage calculation buttons based on selected target balance */}
                    {(() => {
                      const vVendor = payVendorModalData.vendor;
                      const vBreakdown = computeVendorBalanceBreakdown(vVendor, grns, transactions);
                      const currentTarget = payVendorModalData.targetBillType || 'Credit';

                      const vPos = purchaseOrders.filter(po => 
                        (po.VendorID && po.VendorID === vVendor.VendorID) || 
                        (po.VendorName && po.VendorName.toLowerCase() === vVendor.VendorName.toLowerCase())
                      );
                      const vGrns = grns.filter(g => 
                        (g.VendorID && g.VendorID === vVendor.VendorID) || 
                        (g.VendorName && g.VendorName.toLowerCase() === vVendor.VendorName.toLowerCase())
                      );
                      const selectedPo = vPos.find(p => p.POID === payVendorModalData.poId || p.POID === payVendorModalData.invNo);
                      
                      let maxAmt = currentTarget === 'Cash' ? vBreakdown.cashBalance : vBreakdown.creditBalance;
                      if (selectedPo) {
                        const poTotal = selectedPo.TotalAmount || 0;
                        const matchGrn = vGrns.find(g => g.POID === selectedPo.POID);
                        const invStr = matchGrn?.SupplierInvoiceNo || selectedPo.POID;
                        const alreadyPaid = transactions
                          .filter(t => 
                            (t.VendorID === vVendor.VendorID || (t.VendorName && t.VendorName.toLowerCase() === vVendor.VendorName.toLowerCase())) &&
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
                                title={`Set ${pct}% of ${currentTarget} balance (Rs. ${(calculated || 0).toLocaleString()})`}
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
                  <label className="text-xs font-bold text-slate-700 mb-1 block">Actual Payment Date</label>
                  <input
                    type="date"
                    required
                    value={payVendorModalData.date}
                    onChange={e => setPayVendorModalData({ ...payVendorModalData, date: e.target.value })}
                    className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    Date when payment was physically disbursed.
                  </p>
                </div>
              </div>

              {/* ACCOUNTING MONTH / P&L PERIOD SELECTOR */}
              <div className="bg-purple-50/80 border border-purple-200 rounded-xl p-3.5 space-y-2.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                  <div>
                    <label className="text-xs font-black text-purple-950 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-purple-600 animate-pulse"></span>
                      Accounting Month / P&amp;L Posting Period
                    </label>
                    <p className="text-[10px] text-purple-700 font-medium">
                      Financial accounting month for Profit &amp; Loss reporting.
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <input
                      type="month"
                      value={payVendorModalData.accountingMonth || (payVendorModalData.date ? payVendorModalData.date.slice(0, 7) : new Date().toISOString().slice(0, 7))}
                      onChange={e => setPayVendorModalData({ ...payVendorModalData, accountingMonth: e.target.value })}
                      className="text-xs font-black p-1.5 bg-white border border-purple-300 rounded-lg text-purple-950 focus:ring-2 focus:ring-purple-500 focus:outline-none font-mono"
                    />
                  </div>
                </div>

                {/* Quick month pills */}
                {(() => {
                  const now = new Date();
                  const curY = now.getFullYear();
                  const curM = now.getMonth() + 1;
                  const monthsList: { key: string; label: string; sub: string }[] = [];
                  for (let i = 0; i < 5; i++) {
                    const d = new Date(curY, curM - 1 - i, 1);
                    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                    const label = d.toLocaleString('en-US', { month: 'short', year: 'numeric' });
                    const sub = i === 0 ? 'Current' : (i === 1 ? 'Previous' : '');
                    monthsList.push({ key, label, sub });
                  }
                  const selectedMonth = payVendorModalData.accountingMonth || (payVendorModalData.date ? payVendorModalData.date.slice(0, 7) : new Date().toISOString().slice(0, 7));

                  return (
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="text-[10px] font-bold text-purple-800 mr-1">Quick Select:</span>
                      {monthsList.map(m => {
                        const isSel = selectedMonth === m.key;
                        return (
                          <button
                            key={m.key}
                            type="button"
                            onClick={() => setPayVendorModalData({ ...payVendorModalData, accountingMonth: m.key })}
                            className={`px-2.5 py-1 text-xs font-bold rounded-lg transition border cursor-pointer flex items-center gap-1 ${
                              isSel
                                ? 'bg-purple-700 text-white border-purple-800 shadow-xs'
                                : 'bg-white hover:bg-purple-100/70 text-purple-900 border-purple-200'
                            }`}
                          >
                            <span>{m.label}</span>
                            {m.sub && (
                              <span className={`text-[9px] px-1 py-0.2 rounded font-mono ${isSel ? 'bg-purple-900/60 text-purple-200' : 'bg-purple-100 text-purple-700'}`}>
                                {m.sub}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  );
                })()}

                <div className="text-[11px] text-purple-800 bg-white/70 p-2 rounded-lg border border-purple-100 flex items-start gap-1.5">
                  <span className="font-bold text-purple-900 shrink-0">💡 Note:</span>
                  <span>
                    If a purchase bill belongs to <strong>August</strong> but payment is made in <strong>September</strong>, select <strong>August</strong> here to correctly attribute the expense to the August accounting period.
                  </span>
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

              {/* LIVE CREDIT VS CASH CALCULATION BREAKDOWN */}
              {(() => {
                const vVendor = payVendorModalData.vendor;
                const vBreakdown = computeVendorBalanceBreakdown(vVendor, grns, transactions);
                const currentTarget = payVendorModalData.targetBillType || 'Credit';
                const payingAmt = Number(payVendorModalData.amount || 0);

                let creditAfter = vBreakdown.creditBalance;
                let cashAfter = vBreakdown.cashBalance;

                if (currentTarget === 'Credit') {
                  creditAfter = Math.max(0, vBreakdown.creditBalance - payingAmt);
                } else {
                  cashAfter = Math.max(0, vBreakdown.cashBalance - payingAmt);
                }
                const totalAfter = creditAfter + cashAfter;

                return (
                  <div className="bg-slate-900 text-white rounded-xl p-3.5 space-y-2.5 border border-slate-800 shadow-inner">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <div className="flex items-center space-x-2">
                        <Calculator className="w-4 h-4 text-emerald-400" />
                        <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                          Balance Impact Preview
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                        Paying towards {currentTarget === 'Credit' ? 'Credit Bill' : 'Cash Purchase Bill'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                      {/* Credit Balance */}
                      <div className={`p-2.5 rounded-lg border ${currentTarget === 'Credit' ? 'bg-indigo-950/70 border-indigo-500/50' : 'bg-slate-800/60 border-slate-700/60'}`}>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 text-[10px] uppercase font-semibold">Credit Due</span>
                          {currentTarget === 'Credit' && <span className="text-[9px] text-indigo-300 font-bold">Deducting</span>}
                        </div>
                        <div className="flex items-baseline space-x-2 mt-1">
                          <span className="text-slate-400 font-mono text-xs line-through">
                            Rs. {vBreakdown.creditBalance.toLocaleString()}
                          </span>
                          <span className="text-indigo-300 font-mono font-black text-sm">
                            → Rs. {creditAfter.toLocaleString()}
                          </span>
                        </div>
                        <span className="text-[9px] text-slate-400 block mt-0.5">
                          {currentTarget === 'Credit' && payingAmt > 0
                            ? `- Rs. ${payingAmt.toLocaleString()} paid from Credit`
                            : 'Unchanged'}
                        </span>
                      </div>

                      {/* Cash Balance */}
                      <div className={`p-2.5 rounded-lg border ${currentTarget === 'Cash' ? 'bg-emerald-950/70 border-emerald-500/50' : 'bg-slate-800/60 border-slate-700/60'}`}>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 text-[10px] uppercase font-semibold">Cash Due</span>
                          {currentTarget === 'Cash' && <span className="text-[9px] text-emerald-300 font-bold">Deducting</span>}
                        </div>
                        <div className="flex items-baseline space-x-2 mt-1">
                          <span className="text-slate-400 font-mono text-xs line-through">
                            Rs. {vBreakdown.cashBalance.toLocaleString()}
                          </span>
                          <span className="text-emerald-300 font-mono font-black text-sm">
                            → Rs. {cashAfter.toLocaleString()}
                          </span>
                        </div>
                        <span className="text-[9px] text-slate-400 block mt-0.5">
                          {currentTarget === 'Cash' && payingAmt > 0
                            ? `- Rs. ${payingAmt.toLocaleString()} paid from Cash Bill`
                            : 'Unchanged'}
                        </span>
                      </div>

                      {/* Total Outstanding */}
                      <div className="bg-amber-950/50 p-2.5 rounded-lg border border-amber-500/40">
                        <span className="text-amber-300 text-[10px] uppercase font-bold block">Total Outstanding Balance</span>
                        <div className="flex items-baseline space-x-2 mt-1">
                          <span className="text-slate-400 font-mono text-xs line-through">
                            Rs. {vBreakdown.outstandingBalance.toLocaleString()}
                          </span>
                          <span className="text-amber-400 font-mono font-black text-base">
                            → Rs. {totalAfter.toLocaleString()}
                          </span>
                        </div>
                        <span className="text-[9px] text-amber-200/80 block mt-0.5">
                          Remaining Credit + Cash Due
                        </span>
                      </div>
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
