import React, { useState, useRef } from 'react';
import { FileSpreadsheet, PackageCheck, X, AlertTriangle, Plus, FileText, CheckCircle2 } from 'lucide-react';
import { ErpPurchaseOrder } from '../../../types';
import { toMonthYearInput } from '../../../utils/pharmacyUtils';

interface BulkGrnUploadModalProps {
  showUploadBulkGrnModal: boolean;
  setShowUploadBulkGrnModal: (show: boolean) => void;
  bulkGrnSelectedPoId: string;
  setBulkGrnSelectedPoId: (val: string) => void;
  bulkGrnRawText: string;
  setBulkGrnRawText: (val: string) => void;
  bulkGrnParsedItems: any[];
  setBulkGrnParsedItems: React.Dispatch<React.SetStateAction<any[]>>;
  bulkGrnFileError: string;
  setBulkGrnFileError: (val: string) => void;
  handleBulkGrnExcelRead: (file: File) => void;
  handleParseBulkGrnText: (text: string) => void;
  handleApplyBulkGrnToForm: () => void;
  grnForm: any;
  purchaseOrders: ErpPurchaseOrder[];
  medicineCategories?: string[];
}

export const BulkGrnUploadModal: React.FC<BulkGrnUploadModalProps> = ({
  showUploadBulkGrnModal,
  setShowUploadBulkGrnModal,
  bulkGrnSelectedPoId,
  setBulkGrnSelectedPoId,
  bulkGrnRawText,
  setBulkGrnRawText,
  bulkGrnParsedItems,
  setBulkGrnParsedItems,
  bulkGrnFileError,
  setBulkGrnFileError,
  handleBulkGrnExcelRead,
  handleParseBulkGrnText,
  handleApplyBulkGrnToForm,
  grnForm,
  purchaseOrders,
  medicineCategories = [],
}) => {
  const [bulkGrnDragActive, setBulkGrnDragActive] = useState(false);
  const bulkGrnFileInputRef = useRef<HTMLInputElement>(null);

  if (!showUploadBulkGrnModal) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 z-[70] animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-5xl w-full p-6 shadow-2xl border border-slate-100 space-y-4 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-black">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base flex items-center space-x-2">
                <span>Upload Bulk GRN Received Stock (Excel / Paste)</span>
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase">
                  Stock Inward
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Upload supplier invoice / delivery challan (.xlsx, .csv) or paste rows. Order QTY is automatically matched from the selected Purchase Order.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowUploadBulkGrnModal(false)}
            className="text-slate-400 hover:text-slate-600 font-bold p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Error Banner */}
        {bulkGrnFileError && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center space-x-2 text-rose-800 text-xs font-bold shrink-0">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{bulkGrnFileError}</span>
          </div>
        )}

        {/* Modal Body: 2 Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 overflow-y-auto flex-1 pr-1">
          {/* Left Column: PO Selection & Upload/Paste Inputs (5 cols) */}
          <div className="lg:col-span-5 space-y-3.5 flex flex-col justify-between">
            <div className="space-y-3">
              {/* PO Selector */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Link with Purchase Order (Auto-Picks Order QTY)
                </label>
                <select
                  value={bulkGrnSelectedPoId || grnForm.POID}
                  onChange={e => {
                    const newPoId = e.target.value;
                    setBulkGrnSelectedPoId(newPoId);
                    if (bulkGrnRawText) {
                      handleParseBulkGrnText(bulkGrnRawText);
                    }
                  }}
                  className="w-full p-2 border border-emerald-300 rounded-xl text-xs font-mono font-bold bg-white text-emerald-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">-- Choose Purchase Order --</option>
                  {purchaseOrders.map((p, idx) => (
                    <option key={idx} value={p.POID}>
                      {p.POID} ({p.VendorName}) - {p.Status === 'Received' ? '✓ Fully Received' : p.Status === 'Partially Received' ? '⚡ Partial' : 'Pending Order'}
                    </option>
                  ))}
                </select>
              </div>

              {/* Drag & Drop Upload Zone */}
              <div
                onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); setBulkGrnDragActive(true); }}
                onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setBulkGrnDragActive(true); }}
                onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setBulkGrnDragActive(false); }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setBulkGrnDragActive(false);
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    handleBulkGrnExcelRead(e.dataTransfer.files[0]);
                  }
                }}
                onClick={() => bulkGrnFileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition flex flex-col items-center justify-center space-y-2 ${
                  bulkGrnDragActive
                    ? 'border-emerald-500 bg-emerald-50/80 scale-[0.99]'
                    : 'border-emerald-200 bg-emerald-50/30 hover:bg-emerald-50/70 hover:border-emerald-400'
                }`}
              >
                <input
                  ref={bulkGrnFileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleBulkGrnExcelRead(e.target.files[0]);
                    }
                  }}
                />
                <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-black text-slate-800 block">Drop Invoice / GRN (.xlsx, .csv) File</span>
                  <span className="text-[10px] text-slate-500 block mt-0.5">Auto-maps columns: Name, Batch, Expiry, Qty, Rate</span>
                </div>
              </div>

              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-slate-200"></div>
                <span className="shrink mx-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">OR PASTE DATA BELOW</span>
                <div className="flex-grow border-t border-slate-200"></div>
              </div>

              {/* Direct Paste Textarea */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 flex items-center space-x-1">
                    <FileText className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Paste Raw Delivery Challan / Invoice Text</span>
                  </label>
                  <span className="text-[10px] text-slate-400">Cols: Name, Batch, Expiry, Qty, Rate</span>
                </div>
                <textarea
                  rows={6}
                  value={bulkGrnRawText}
                  onChange={(e) => handleParseBulkGrnText(e.target.value)}
                  placeholder={`Paste table copied from Excel or Invoice:\nItem Name\tBatch#\tExpiry\tQty\tRate\nParacetamol 500mg\tB-101\t2027-12-31\t100\t15\nAmoxicillin 250mg\tB-102\t2026-06-30\t50\t45`}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Right Column: Parsed Items Preview & Summary (7 cols) */}
          <div className="lg:col-span-7 bg-slate-50/70 border border-slate-200 rounded-2xl p-4 flex flex-col justify-between space-y-3">
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <div>
                  <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                    Parsed GRN Items Preview ({bulkGrnParsedItems.length})
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    {bulkGrnParsedItems.filter(i => i.isMatchedInPo).length} Matched with PO • {bulkGrnParsedItems.filter(i => !i.isMatchedInPo).length} Extra Items
                  </p>
                </div>

                {bulkGrnParsedItems.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setBulkGrnParsedItems([]);
                      setBulkGrnRawText('');
                    }}
                    className="text-[11px] font-bold text-rose-600 hover:text-rose-800 hover:underline cursor-pointer"
                  >
                    Clear Items
                  </button>
                )}
              </div>

              {/* Summary Bar */}
              {bulkGrnParsedItems.length > 0 && (
                <div className="grid grid-cols-3 gap-2 bg-white p-2.5 rounded-xl border border-slate-200 text-center shadow-2xs">
                  <div>
                    <span className="text-[10px] text-slate-500 block">Total Items</span>
                    <span className="text-xs font-black text-indigo-900">{bulkGrnParsedItems.length}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Total Qty</span>
                    <span className="text-xs font-black text-amber-700">
                      {bulkGrnParsedItems.reduce((acc, curr) => acc + (Number(curr.ReceivedQty) || 0), 0)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Total GRN Amount</span>
                    <span className="text-xs font-black text-emerald-700">
                      Rs. {bulkGrnParsedItems.reduce((acc, curr) => acc + ((Number(curr.ReceivedQty) || 0) * (Number(curr.UnitPrice) || 0)), 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              )}

              {/* Items Scrollable Table */}
              <div className="max-h-64 overflow-y-auto border border-slate-200 rounded-xl bg-white shadow-2xs">
                {bulkGrnParsedItems.length === 0 ? (
                  <div className="p-10 text-center text-slate-400 space-y-1">
                    <FileSpreadsheet className="w-8 h-8 mx-auto text-slate-300" />
                    <p className="text-xs font-bold text-slate-600">No GRN items loaded yet</p>
                    <p className="text-[11px]">Upload an Excel file or paste rows on the left to preview verified receipts.</p>
                  </div>
                ) : (
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-700 text-[10px] uppercase font-extrabold sticky top-0 border-b border-slate-200">
                      <tr>
                        <th className="p-2 w-8 text-center">#</th>
                        <th className="p-2">Medicine / Item</th>
                        <th className="p-2 text-center">Batch #</th>
                        <th className="p-2 text-center">Mfg Date</th>
                        <th className="p-2 text-center">Expiry</th>
                        <th className="p-2 text-right">Price</th>
                        <th className="p-2 text-center">Rec. Qty</th>
                        <th className="p-2">Category</th>
                        <th className="p-2 text-right">Total</th>
                        <th className="p-2 w-8 text-center"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {bulkGrnParsedItems.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/80">
                          <td className="p-2 text-center text-[10px] text-slate-400 font-bold">{idx + 1}</td>
                          <td className="p-2">
                            <span className="font-bold text-slate-800 block text-xs">{item.ItemName}</span>
                            <div>
                              {item.isMatchedInPo ? (
                                <span className="px-1 py-0.2 bg-emerald-100 text-emerald-800 rounded font-bold text-[9px]">
                                  In PO ({item.OrderedQty} ordered)
                                </span>
                              ) : (
                                <span className="px-1 py-0.2 bg-amber-100 text-amber-800 rounded font-bold text-[9px]">
                                  Extra Item
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="p-2 text-center">
                            <input
                              type="text"
                              placeholder="Batch #"
                              value={item.BatchNo || ''}
                              onChange={(e) => {
                                const val = e.target.value;
                                setBulkGrnParsedItems(prev => prev.map((it, i) => i === idx ? { ...it, BatchNo: val } : it));
                              }}
                              className="w-24 p-1 border border-slate-200 rounded text-[11px] font-mono font-bold bg-amber-50/50 text-amber-900 text-center"
                            />
                          </td>
                          <td className="p-2 text-center">
                            <input
                              type="month"
                              value={toMonthYearInput(item.MfgDate) || ''}
                              onChange={(e) => {
                                const val = e.target.value;
                                setBulkGrnParsedItems(prev => prev.map((it, i) => i === idx ? { ...it, MfgDate: val } : it));
                              }}
                              className="w-24 p-1 border border-slate-200 rounded text-[11px] font-mono bg-white"
                            />
                          </td>
                          <td className="p-2 text-center">
                            <input
                              type="month"
                              value={toMonthYearInput(item.ExpiryDate) || ''}
                              onChange={(e) => {
                                const val = e.target.value;
                                setBulkGrnParsedItems(prev => prev.map((it, i) => i === idx ? { ...it, ExpiryDate: val } : it));
                              }}
                              className="w-24 p-1 border border-slate-200 rounded text-[11px] font-mono bg-white"
                            />
                          </td>
                          <td className="p-2 text-right">
                            <input
                              type="number"
                              min="0"
                              step="any"
                              value={item.UnitPrice}
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                setBulkGrnParsedItems(prev => prev.map((it, i) => i === idx ? { ...it, UnitPrice: val } : it));
                              }}
                              className="w-16 p-1 border border-slate-200 rounded text-right text-xs font-bold bg-white"
                            />
                          </td>
                          <td className="p-2 text-center">
                            <input
                              type="number"
                              min="0"
                              value={item.ReceivedQty}
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                setBulkGrnParsedItems(prev => prev.map((it, i) => i === idx ? { ...it, ReceivedQty: val } : it));
                              }}
                              className="w-14 p-1 border border-emerald-300 rounded text-center text-xs font-bold bg-emerald-50/60 text-emerald-950"
                            />
                          </td>
                          <td className="p-2">
                            <select
                              value={item.Category || medicineCategories[0] || 'BM Drops'}
                              onChange={(e) => {
                                const val = e.target.value;
                                setBulkGrnParsedItems(prev => prev.map((it, i) => i === idx ? { ...it, Category: val } : it));
                              }}
                              className="w-full p-1 border border-indigo-200 rounded text-[11px] font-bold text-indigo-900 bg-indigo-50/50 cursor-pointer"
                            >
                              {medicineCategories.map((cat, catIdx) => (
                                <option key={catIdx} value={cat}>{cat}</option>
                              ))}
                              {item.Category && !medicineCategories.includes(item.Category) && (
                                <option value={item.Category}>{item.Category}</option>
                              )}
                            </select>
                          </td>
                          <td className="p-2 text-right font-extrabold text-slate-900 text-xs font-mono">
                            Rs. {((Number(item.ReceivedQty) || 0) * (Number(item.UnitPrice) || 0)).toLocaleString()}
                          </td>
                          <td className="p-2 text-center">
                            <button
                              type="button"
                              onClick={() => setBulkGrnParsedItems(prev => prev.filter((_, i) => i !== idx))}
                              className="text-slate-400 hover:text-rose-600 font-bold p-0.5 rounded cursor-pointer"
                              title="Remove Item"
                            >
                              ✕
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setShowUploadBulkGrnModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={bulkGrnParsedItems.length === 0}
                onClick={handleApplyBulkGrnToForm}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-extrabold text-xs shadow-md transition flex items-center space-x-1.5 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Apply to GRN ({bulkGrnParsedItems.length} Items)</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulkGrnUploadModal;
