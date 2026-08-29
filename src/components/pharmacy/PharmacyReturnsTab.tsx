/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  Undo2,
  Search,
  Calendar,
  AlertTriangle,
  RotateCcw,
  CheckCircle,
  FileText
} from 'lucide-react';
import { Item, InvoiceHeader, InvoiceDetail, SRInvHeader, SRInvDetail } from '../../types';

interface PharmacyReturnsTabProps {
  lookupInvoiceNo?: string;
  setLookupInvoiceNo?: (v: string) => void;
  matchedInvoice?: any;
  setMatchedInvoice?: (inv: any) => void;
  returnBasket?: any[];
  setReturnBasket?: (b: any[]) => void;
  returnRemarks?: string;
  setReturnRemarks?: (r: string) => void;
  returnSuccess?: string;
  handleLookupInvoice?: (e: React.FormEvent) => void;
  handlePostSalesReturn?: () => void;
  getPatientName?: (id: string) => string;
  canPost?: boolean;
  activeSubTab: string;
  salesReturns: SRInvHeader[];
  returnDetails: SRInvDetail[];
  returnSearchTerm: string;
  setReturnSearchTerm: (v: string) => void;
  returnDateFilter: string;
  setReturnDateFilter: (v: string) => void;
  isReturnSubmitting: boolean;
  setIsReturnSubmitting: (v: boolean) => void;
  items: Item[];
  invoices: InvoiceHeader[];
  invoiceDetails: InvoiceDetail[];
  onAddSalesReturn: (srHeader: SRInvHeader, srDetails: SRInvDetail[]) => void;
  currentUser?: any;
}

export const PharmacyReturnsTab: React.FC<PharmacyReturnsTabProps> = ({
  activeSubTab,
  salesReturns,
  returnDetails,
  returnSearchTerm,
  setReturnSearchTerm,
  returnDateFilter,
  setReturnDateFilter,
  isReturnSubmitting,
  setIsReturnSubmitting,
  items,
  invoices,
  invoiceDetails,
  onAddSalesReturn,
  currentUser,
  lookupInvoiceNo = "",
  setLookupInvoiceNo = (_v?: any) => {},
  matchedInvoice = null,
  setMatchedInvoice = () => {},
  returnBasket = [],
  setReturnBasket = (_b?: any) => {},
  returnRemarks = "",
  setReturnRemarks = (_r?: any) => {},
  returnSuccess = "",
  handleLookupInvoice = () => {},
  handlePostSalesReturn = () => {},
  getPatientName = (id: string) => id,
  canPost = false
}) => {
  if (activeSubTab !== 'return') return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fadeIn" id="pos-returns-tab">
          
          {/* Invoice lookup & return calculator */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-950 flex items-center border-b border-slate-100 pb-3">
              <Undo2 className="w-4.5 h-4.5 text-emerald-500 mr-2" />
              Invoice Reversals / Returns Worksheet
            </h3>

            {returnSuccess && (
              <div className="p-3 bg-emerald-50 text-emerald-700 text-xs rounded-lg font-semibold border border-emerald-100">
                {returnSuccess}
              </div>
            )}

            <form onSubmit={handleLookupInvoice} className="flex space-x-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder=""
                  value={lookupInvoiceNo}
                  onChange={(e) => setLookupInvoiceNo(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-lg pl-8 pr-3 py-2 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition"
              >
                Lookup Invoice
              </button>
            </form>

            {matchedInvoice && (
              <form onSubmit={handlePostSalesReturn} className="space-y-4 pt-2 animate-fadeIn">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1.5 text-xxs font-medium text-slate-600">
                  <div className="flex justify-between font-bold text-slate-900">
                    <span>Invoice Ref: {matchedInvoice.InvoiceNo}</span>
                    <span>Date: {matchedInvoice.InvoiceDate}</span>
                  </div>
                  <p>Original Customer: <strong className="text-slate-800 font-bold">{getPatientName(matchedInvoice.PatientID)}</strong></p>
                  <p>Gross: Rs. {matchedInvoice.GAmount} | Net Paid: Rs. {matchedInvoice.NetAmount} (Discount: Rs. {matchedInvoice.Discount})</p>
                </div>

                {/* Return rows table */}
                <div className="overflow-x-auto border border-slate-200 rounded-xl p-3 bg-slate-50/20">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-400 uppercase text-xxs font-bold">
                        <th className="py-2">Medicine ID</th>
                        <th className="py-2">Item</th>
                        <th className="py-2 text-center">Original Qty</th>
                        <th className="py-2 text-center">Qty to Return</th>
                        <th className="py-2 text-right">Refund Rate</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {returnBasket.map((row, idx) => {
                        const originalQty = invoiceDetails.find(
                          (d) => d.InvoiceNo === matchedInvoice.InvoiceNo && d.ItemID === row.ItemID
                        )?.Qty || 0;
                        const name = items.find((i) => i.ItemID === row.ItemID)?.ItemName || row.ItemID;

                        return (
                          <tr key={idx} className="hover:bg-slate-50/50">
                            <td className="py-2 font-mono text-xxs font-semibold text-slate-400">{row.ItemID}</td>
                            <td className="py-2 font-bold text-slate-800 truncate max-w-[150px]">{name}</td>
                            <td className="py-2 text-center font-bold font-mono">{originalQty}</td>
                            <td className="py-2 text-center">
                              <input
                                type="number"
                                min="0"
                                max={originalQty}
                                value={row.QtyReturned}
                                onChange={(e) => {
                                  const updated = [...returnBasket];
                                  updated[idx].QtyReturned = Math.min(originalQty, parseInt(e.target.value) || 0);
                                  setReturnBasket(updated);
                                }}
                                className="w-12 text-center text-xs font-mono border border-slate-200 rounded bg-white p-1 focus:outline-none"
                              />
                            </td>
                            <td className="py-2 text-right font-mono text-slate-600 font-bold">Rs. {row.PriceRef}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div>
                  <label className="block text-xxs font-bold text-slate-500 uppercase">Return Reason / Internal remarks</label>
                  <textarea
                    placeholder=""
                    required
                    rows={2}
                    value={returnRemarks}
                    onChange={(e) => setReturnRemarks(e.target.value)}
                    className="mt-1 w-full text-xs border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={!canPost}
                  className={`w-full py-2.5 rounded-lg text-xs font-bold text-white transition ${
                    canPost ? 'bg-red-600 hover:bg-red-700 shadow-md shadow-red-600/10' : 'bg-slate-400 cursor-not-allowed'
                  }`}
                >
                  Finalize Sales Return & Credit Refund Cash
                </button>
              </form>
            )}
          </div>

          {/* Return ledger summary */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col h-[520px]">
            <h3 className="text-sm font-bold text-slate-900 mb-3">Reversal Transaction Logs</h3>
            <div className="flex-1 overflow-y-auto space-y-3">
              {invoices.filter((inv) => inv.Status === 2).length === 0 ? (
                <p className="text-xs text-slate-400 font-semibold text-center py-16">No posted invoices to reverse.</p>
              ) : (
                <p className="text-xxs text-slate-400 font-medium">Lookup returned items, check safety restock levels, or audit active cash box refunds here.</p>
              )}
            </div>
          </div>

        </div>
  );
};

export default PharmacyReturnsTab;
