import React from 'react';
import { PackageCheck, X, Plus, Trash2, RotateCcw, CheckCircle2, FileSpreadsheet, Coins, CreditCard, XCircle, Eye } from 'lucide-react';
import { ErpVendor, ErpPurchaseOrder, ErpGrnItem } from '../../../types';

interface GrnModalProps {
  showGrnModal: boolean;
  setShowGrnModal: (show: boolean) => void;
  grnForm: any;
  setGrnForm: React.Dispatch<React.SetStateAction<any>>;
  vendors: ErpVendor[];
  purchaseOrders: ErpPurchaseOrder[];
  handleApproveGrn: (e: React.FormEvent) => void;
  isSubmitting: boolean;
  handleSelectPoForGrn: (poid: string) => void;
  handleRemoveGrnItem: (index: number) => void;
  handleResetGrnItems: () => void;
  getPoItemsReceiptInfo: (po: ErpPurchaseOrder) => any[];
  handlePreviewCurrentGrnForm: () => void;
  setShowUploadBulkGrnModal: (show: boolean) => void;
  setBulkGrnSelectedPoId: (poid: string) => void;
  setBulkGrnRawText: (txt: string) => void;
  setBulkGrnParsedItems: (items: any[]) => void;
  setBulkGrnFileError: (err: string) => void;
}

export const GrnModal: React.FC<GrnModalProps> = ({
  showGrnModal,
  setShowGrnModal,
  grnForm,
  setGrnForm,
  vendors,
  purchaseOrders,
  handleApproveGrn,
  isSubmitting,
  handleSelectPoForGrn,
  handleRemoveGrnItem,
  handleResetGrnItems,
  getPoItemsReceiptInfo,
  handlePreviewCurrentGrnForm,
  setShowUploadBulkGrnModal,
  setBulkGrnSelectedPoId,
  setBulkGrnRawText,
  setBulkGrnParsedItems,
  setBulkGrnFileError,
}) => {
  if (!showGrnModal) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-6xl w-full p-6 shadow-2xl border border-slate-100 space-y-5 max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-bold text-slate-900 text-lg flex items-center space-x-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>Receive Goods & Approve GRN (Stock Inward)</span>
            </h3>
            <p className="text-xs text-slate-500">
              Enter or select Purchase Order (PO Number) to fetch items, verify received quantities, and add stock to inventory
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => {
                setBulkGrnSelectedPoId(grnForm.POID);
                setBulkGrnRawText('');
                setBulkGrnParsedItems([]);
                setBulkGrnFileError('');
                setShowUploadBulkGrnModal(true);
              }}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition shadow-xs flex items-center space-x-1 cursor-pointer"
              title="Upload Excel or Paste Bulk GRN Receipts"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Upload Bulk GRN</span>
            </button>
            <button
              type="button"
              onClick={() => setShowGrnModal(false)}
              className="text-slate-400 hover:text-slate-600 font-bold p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>

        <form onSubmit={handleApproveGrn} className="space-y-4">
          {/* PO SELECTOR & METADATA GRID */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Select Purchase Order (PO Number)</label>
              <select
                value={grnForm.POID}
                onChange={e => handleSelectPoForGrn(e.target.value)}
                className="w-full p-2 border rounded-xl text-xs font-mono font-bold bg-white text-indigo-700 border-indigo-200 focus:outline-hidden"
              >
                <option value="">-- Choose Purchase Order --</option>
                {purchaseOrders.map((p, idx) => (
                  <option key={idx} value={p.POID}>
                    {p.POID} ({p.VendorName}) - {p.Status === 'Received' ? '✓ Fully Received' : p.Status === 'Partially Received' ? '⚡ Partially Received' : 'Pending Order'}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">GRN Number</label>
              <input
                type="text"
                readOnly
                value={grnForm.GRNID}
                className="w-full p-2 border rounded-xl text-xs font-mono font-bold bg-slate-100 text-emerald-700"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Received Date</label>
              <input
                type="date"
                required
                value={grnForm.ReceivedDate}
                onChange={e => setGrnForm((prev: any) => ({ ...prev, ReceivedDate: e.target.value }))}
                className="w-full p-2 border rounded-xl text-xs bg-white"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Supplier / Vendor</label>
              <input
                type="text"
                readOnly
                value={grnForm.VendorName || 'No Vendor Selected'}
                className="w-full p-2 border rounded-xl text-xs font-bold bg-slate-100 text-slate-800"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Delivery Challan No.</label>
              <input
                type="text"
                placeholder=""
                value={grnForm.ChallanNo}
                onChange={e => setGrnForm((prev: any) => ({ ...prev, ChallanNo: e.target.value }))}
                className="w-full p-2 border rounded-xl text-xs bg-white"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Supplier Invoice No.</label>
              <input
                type="text"
                placeholder=""
                value={grnForm.SupplierInvoiceNo}
                onChange={e => setGrnForm((prev: any) => ({ ...prev, SupplierInvoiceNo: e.target.value }))}
                className="w-full p-2 border rounded-xl text-xs bg-white"
              />
            </div>
          </div>

          {/* PAYMENT TERMS & REAL-TIME SETTLEMENT ROUTING TOGGLE */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shadow-xs shrink-0 ${grnForm.PaymentMethod === 'Cash' ? 'bg-emerald-600' : 'bg-indigo-600'}`}>
                {grnForm.PaymentMethod === 'Cash' ? <Coins className="w-5 h-5" /> : <CreditCard className="w-5 h-5" />}
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-black text-slate-900 uppercase tracking-wider">Purchase Payment Mode:</span>
                  <span className={`px-2 py-0.5 rounded-md text-[11px] font-black uppercase ${grnForm.PaymentMethod === 'Cash' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-indigo-100 text-indigo-800 border border-indigo-300'}`}>
                    {grnForm.PaymentMethod === 'Cash' ? '💵 Cash Spot Payment (Cash Book Outflow)' : '💳 Credit Purchase (Vendor Payable Account)'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 mt-0.5">
                  {grnForm.PaymentMethod === 'Cash'
                    ? '✅ Cash Outflow: Generates Cash Payment Voucher (CPV), deducts cash from Clinic Cash Book & P&L, leaving vendor balance net zero (Rs. 0).'
                    : '📋 Credit Liability: Posts unpaid stock inward to Vendor Accounts Payable (AP) ledger for deferred settlement without deducting cash.'}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-1.5 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs self-start md:self-auto shrink-0">
              <button
                type="button"
                onClick={() => setGrnForm((prev: any) => ({ ...prev, PaymentMethod: 'Credit' }))}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition cursor-pointer flex items-center space-x-1.5 ${
                  grnForm.PaymentMethod !== 'Cash'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Credit (Payable)</span>
              </button>

              <button
                type="button"
                onClick={() => setGrnForm((prev: any) => ({ ...prev, PaymentMethod: 'Cash' }))}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition cursor-pointer flex items-center space-x-1.5 ${
                  grnForm.PaymentMethod === 'Cash'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Coins className="w-3.5 h-3.5" />
                <span>Cash (Spot Paid)</span>
              </button>
            </div>
          </div>

          {/* RECEIVED MEDICINES TABLE WITH PARTIAL DELIVERY COLUMNS */}
          <div className="space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                PO Order Items & Partial Batch Receiving ({grnForm.Items.length} Line Items)
              </label>
              <div className="flex items-center space-x-2">
                {(() => {
                  const selectedPo = purchaseOrders.find(p => p.POID === grnForm.POID);
                  const pendingPoItems = selectedPo ? getPoItemsReceiptInfo(selectedPo) : [];
                  const fullCount = pendingPoItems.length;
                  if (fullCount > grnForm.Items.length) {
                    return (
                      <button
                        type="button"
                        onClick={handleResetGrnItems}
                        className="text-[11px] text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 px-2 py-0.5 rounded-md font-bold border border-indigo-200 transition flex items-center space-x-1 cursor-pointer"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Restore Excluded Items ({fullCount - grnForm.Items.length} excluded)</span>
                      </button>
                    );
                  }
                  return null;
                })()}
                <span className="text-[11px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  Partial receiving supported: Excluded items remain pending in PO for next batch
                </span>
              </div>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-x-auto w-full grn-summary-card">
              <table className="w-full text-left text-xs min-w-[920px] grn-summary-table">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <th className="p-2.5 w-24">Item ID</th>
                    <th className="p-2.5 min-w-[150px]">Medicine Description</th>
                    <th className="p-2.5 text-center w-24">Batch No.</th>
                    <th className="p-2.5 text-center w-16">Ordered</th>
                    <th className="p-2.5 text-center w-16">Prev. Recv</th>
                    <th className="p-2.5 text-center w-16">Pending</th>
                    <th className="p-2.5 text-center w-24">Now Receiving</th>
                    <th className="p-2.5 text-right w-28 grn-unit-price">Unit Price</th>
                    <th className="p-2.5 text-right w-24 grn-subtotal">Subtotal</th>
                    <th className="p-2.5 text-center w-28 shrink-0 exclude-col">Exclude</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {grnForm.Items.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="p-6 text-center text-slate-400 font-medium">
                        No items in current GRN batch. {grnForm.POID ? 'All items were excluded from this delivery.' : 'Please select a Purchase Order from above!'}
                        {grnForm.POID && (
                          <div className="mt-2">
                            <button
                              type="button"
                              onClick={handleResetGrnItems}
                              className="text-xs text-indigo-600 underline font-bold"
                            >
                              Click here to restore all PO items
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ) : (
                    grnForm.Items.map((item: any, idx: number) => {
                      const prevReceived = item.AlreadyReceivedQty || 0;
                      const pending = item.PendingQty ?? Math.max(0, item.OrderedQty - prevReceived);
                      const currentRecvQty = item.ReceivedQty === '' || item.ReceivedQty === undefined || item.ReceivedQty === null ? '' : item.ReceivedQty;
                      const currentUnitPrice = item.UnitPrice === '' || item.UnitPrice === undefined || item.UnitPrice === null ? '' : item.UnitPrice;
                      const numRecv = Number(currentRecvQty) || 0;
                      const numPrice = Number(currentUnitPrice) || 0;
                      const subtotal = numRecv * numPrice;

                      return (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="p-2.5 font-mono text-slate-500 font-bold">{item.ItemID}</td>
                          <td className="p-2.5 font-bold text-slate-900">{item.ItemName}</td>
                          <td className="p-2.5 text-center">
                            <input
                              type="text"
                              placeholder=""
                              value={item.BatchNo || ''}
                              onChange={e => {
                                const val = e.target.value;
                                setGrnForm((prev: any) => {
                                  const updated = [...prev.Items];
                                  updated[idx] = { ...updated[idx], BatchNo: val };
                                  return { ...prev, Items: updated };
                                });
                              }}
                              className="w-22 p-1 border border-amber-200 rounded-lg text-xs text-center font-mono font-bold bg-amber-50 text-amber-900 focus:outline-hidden"
                            />
                          </td>
                          <td className="p-2.5 text-center font-bold text-slate-600">{item.OrderedQty}</td>
                          <td className="p-2.5 text-center font-bold text-indigo-600 bg-indigo-50/50">{prevReceived}</td>
                          <td className="p-2.5 text-center font-bold text-amber-700 bg-amber-50/50">{pending}</td>
                          <td className="p-2.5 text-center">
                            <input
                              type="number"
                              min="0"
                              max={pending > 0 ? pending * 2 : 9999}
                              placeholder="0"
                              value={currentRecvQty}
                              onChange={e => {
                                const raw = e.target.value;
                                const val = raw === '' ? '' : Number(raw);
                                setGrnForm((prev: any) => {
                                  const updated = [...prev.Items];
                                  const uPrice = Number(updated[idx].UnitPrice) || 0;
                                  updated[idx] = {
                                    ...updated[idx],
                                    ReceivedQty: val as any,
                                    LineTotal: (Number(val) || 0) * uPrice
                                  };
                                  return { ...prev, Items: updated };
                                });
                              }}
                              className="w-20 p-1.5 border border-emerald-400 rounded-lg text-xs text-center font-bold bg-white text-emerald-950 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                            />
                          </td>
                          <td className="p-2.5 text-right font-semibold text-slate-700 grn-unit-price">
                            <div className="flex items-center justify-end space-x-1">
                              <span className="text-slate-400 font-bold text-xs">Rs.</span>
                              <input
                                type="number"
                                min="0"
                                step="any"
                                placeholder="0.00"
                                value={currentUnitPrice}
                                onChange={e => {
                                  const raw = e.target.value;
                                  const val = raw === '' ? '' : Number(raw);
                                  setGrnForm((prev: any) => {
                                    const updated = [...prev.Items];
                                    const rQty = Number(updated[idx].ReceivedQty) || 0;
                                    updated[idx] = {
                                      ...updated[idx],
                                      UnitPrice: val as any,
                                      LineTotal: rQty * (Number(val) || 0)
                                    };
                                    return { ...prev, Items: updated };
                                  });
                                }}
                                className="w-22 p-1.5 border border-slate-300 rounded-lg text-xs text-right font-bold bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                title="Edit Unit Cost for Inward Stock"
                              />
                            </div>
                          </td>
                          <td className="p-2.5 text-right font-bold text-slate-900 grn-subtotal">Rs. {subtotal.toLocaleString()}</td>
                          <td className="p-2.5 text-center w-28 shrink-0 exclude-col">
                            <button
                              type="button"
                              onClick={() => handleRemoveGrnItem(idx)}
                              title="Exclude medicine item from this GRN batch (will remain pending in PO for next batch)"
                              className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg text-xs font-bold transition inline-flex items-center space-x-1 cursor-pointer whitespace-nowrap shrink-0 shadow-2xs"
                            >
                              <XCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                              <span>Exclude</span>
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

          <div>
            <label className="text-xs font-bold text-slate-600 block mb-1">Verification / Quality Remarks</label>
            <input
              type="text"
              placeholder=""
              value={grnForm.Remarks}
              onChange={e => setGrnForm((prev: any) => ({ ...prev, Remarks: e.target.value }))}
              className="w-full p-2 border rounded-xl text-xs bg-white"
            />
          </div>

          {/* FOOTER & APPROVE BUTTON */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-200">
            <div className="text-sm">
              <span className="text-slate-500 font-bold">Total GRN Inward Value: </span>
              <span className="text-lg font-black text-emerald-700 ml-1">
                Rs. {grnForm.Items.reduce((sum: number, i: any) => sum + ((Number(i.ReceivedQty) || 0) * (Number(i.UnitPrice) || 0)), 0).toLocaleString()}
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={handlePreviewCurrentGrnForm}
                disabled={grnForm.Items.length === 0}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition border border-slate-300 flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                title="Preview Printable A4 GRN Document"
              >
                <Eye className="w-4 h-4 text-slate-600" />
                <span>Print Preview</span>
              </button>
              <button
                type="button"
                onClick={() => setShowGrnModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={grnForm.Items.length === 0 || !grnForm.POID}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs transition shadow-sm flex items-center space-x-1.5 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Approve GRN & Update Inventory Stock</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GrnModal;
