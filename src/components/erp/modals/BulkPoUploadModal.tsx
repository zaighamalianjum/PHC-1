import React, { useState, useRef } from 'react';
import { FileSpreadsheet, Plus, X, AlertCircle, FileText, ShoppingCart } from 'lucide-react';

interface BulkPoUploadModalProps {
  showUploadBulkPoModal: boolean;
  setShowUploadBulkPoModal: (show: boolean) => void;
  bulkPoRawText: string;
  setBulkPoRawText: (val: string) => void;
  bulkPoParsedItems: any[];
  setBulkPoParsedItems: React.Dispatch<React.SetStateAction<any[]>>;
  bulkPoFileError: string;
  setBulkPoFileError: (val: string) => void;
  handleBulkPoExcelRead: (file: File) => void;
  handleParseBulkPoText: (text: string) => void;
  handleApplyBulkPoToForm: () => void;
}

export const BulkPoUploadModal: React.FC<BulkPoUploadModalProps> = ({
  showUploadBulkPoModal,
  setShowUploadBulkPoModal,
  bulkPoRawText,
  setBulkPoRawText,
  bulkPoParsedItems,
  setBulkPoParsedItems,
  bulkPoFileError,
  setBulkPoFileError,
  handleBulkPoExcelRead,
  handleParseBulkPoText,
  handleApplyBulkPoToForm,
}) => {
  const [bulkPoDragActive, setBulkPoDragActive] = useState(false);
  const bulkPoFileInputRef = useRef<HTMLInputElement>(null);

  if (!showUploadBulkPoModal) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-5xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl font-bold">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">
                Upload Bulk Purchase Order (Excel / Paste)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Upload an Excel spreadsheet (.xlsx, .csv) or paste rows containing 3 columns: <span className="font-bold text-indigo-700">Item Name</span>, <span className="font-bold text-indigo-700">PO Quantity</span>, and <span className="font-bold text-indigo-700">Item Price</span>.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowUploadBulkPoModal(false)}
            className="text-slate-400 hover:text-slate-600 font-bold p-1 rounded-lg hover:bg-slate-100 cursor-pointer text-lg"
          >
            ✕
          </button>
        </div>

        {/* Error banner if any */}
        {bulkPoFileError && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-bold flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{bulkPoFileError}</span>
          </div>
        )}

        {/* Main Split Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left Column: Dropzone & Paste Text Area (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            {/* Excel File Dropzone */}
            <div
              onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); setBulkPoDragActive(true); }}
              onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setBulkPoDragActive(true); }}
              onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setBulkPoDragActive(false); }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setBulkPoDragActive(false);
                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                  handleBulkPoExcelRead(e.dataTransfer.files[0]);
                }
              }}
              onClick={() => bulkPoFileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition flex flex-col items-center justify-center space-y-2 ${
                bulkPoDragActive
                  ? 'border-indigo-500 bg-indigo-50/80 scale-[0.99]'
                  : 'border-indigo-200 bg-indigo-50/30 hover:bg-indigo-50/70 hover:border-indigo-400'
              }`}
            >
              <input
                ref={bulkPoFileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleBulkPoExcelRead(e.target.files[0]);
                  }
                }}
              />
              <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-black text-slate-800 block">Drop Excel (.xlsx, .csv) File Here</span>
                <span className="text-[10px] text-slate-500 block mt-0.5">or click to browse from device</span>
              </div>
            </div>

            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-slate-200"></div>
              <span className="shrink mx-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">OR PASTE DATA BELOW</span>
              <div className="flex-grow border-t border-slate-200"></div>
            </div>

            {/* Direct Paste Area */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 flex items-center space-x-1">
                  <FileText className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Paste Raw Excel / Text Data</span>
                </label>
                <span className="text-[10px] text-slate-400">3 Cols: Name, Qty, Price</span>
              </div>
              <textarea
                rows={7}
                value={bulkPoRawText}
                onChange={(e) => handleParseBulkPoText(e.target.value)}
                placeholder={`Paste 3-column rows from Excel or Notepad:\nItem Name\tPO Quantity\tItem Price\nParacetamol 500mg\t100\t15\nAmoxicillin 250mg\t50\t45\nIbuprofen 400mg\t200\t25`}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Right Column: Parsed Items Preview & Summary (7 cols) */}
          <div className="lg:col-span-7 bg-slate-50/70 border border-slate-200 rounded-2xl p-4 flex flex-col justify-between space-y-3">
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <div>
                  <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                    Parsed PO Items Preview ({bulkPoParsedItems.length})
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    {bulkPoParsedItems.filter(i => i.isMatched).length} Matched in Inventory • {bulkPoParsedItems.filter(i => !i.isMatched).length} New / Unmatched
                  </p>
                </div>

                {bulkPoParsedItems.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setBulkPoParsedItems([]);
                      setBulkPoRawText('');
                    }}
                    className="text-[11px] font-bold text-rose-600 hover:text-rose-800 hover:underline cursor-pointer"
                  >
                    Clear Items
                  </button>
                )}
              </div>

              {/* Summary Bar */}
              {bulkPoParsedItems.length > 0 && (
                <div className="grid grid-cols-3 gap-2 bg-white p-2.5 rounded-xl border border-slate-200 text-center shadow-2xs">
                  <div>
                    <span className="text-[10px] text-slate-500 block">Total Items</span>
                    <span className="text-xs font-black text-indigo-900">{bulkPoParsedItems.length}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Total Qty</span>
                    <span className="text-xs font-black text-amber-700">
                      {bulkPoParsedItems.reduce((acc, curr) => acc + (curr.Qty || 0), 0)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Est. Subtotal</span>
                    <span className="text-xs font-black text-emerald-700">
                      Rs. {bulkPoParsedItems.reduce((acc, curr) => acc + ((curr.Qty || 0) * (curr.UnitPrice || 0)), 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              )}

              {/* Items Scrollable Table */}
              <div className="max-h-64 overflow-y-auto border border-slate-200 rounded-xl bg-white shadow-2xs">
                {bulkPoParsedItems.length === 0 ? (
                  <div className="p-10 text-center text-slate-400 space-y-1">
                    <FileSpreadsheet className="w-8 h-8 mx-auto text-slate-300" />
                    <p className="text-xs font-bold text-slate-600">No items loaded yet</p>
                    <p className="text-[11px]">Upload an Excel spreadsheet or paste 3-column rows on the left to preview.</p>
                  </div>
                ) : (
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-700 text-[10px] uppercase font-extrabold sticky top-0 border-b border-slate-200">
                      <tr>
                        <th className="p-2 w-8 text-center">#</th>
                        <th className="p-2">Item Name</th>
                        <th className="p-2 w-20 text-center">Status</th>
                        <th className="p-2 w-16 text-center">Qty</th>
                        <th className="p-2 w-20 text-right">Price (Rs.)</th>
                        <th className="p-2 w-20 text-right">Total</th>
                        <th className="p-2 w-8 text-center"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {bulkPoParsedItems.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/80">
                          <td className="p-2 text-center text-[10px] text-slate-400 font-bold">{idx + 1}</td>
                          <td className="p-2">
                            <span className="font-bold text-slate-800 block text-xs">{item.ItemName}</span>
                            <span className="text-[10px] text-slate-400">{item.Category}</span>
                          </td>
                          <td className="p-2 text-center">
                            {item.isMatched ? (
                              <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold text-[9px]">
                                Matched
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded font-bold text-[9px]">
                                New Item
                              </span>
                            )}
                          </td>
                          <td className="p-2 text-center">
                            <input
                              type="number"
                              min="0"
                              value={item.Qty}
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                setBulkPoParsedItems(prev => prev.map((it, i) => i === idx ? { ...it, Qty: val } : it));
                              }}
                              className="w-14 p-1 border border-slate-200 rounded text-center text-xs font-bold bg-white"
                            />
                          </td>
                          <td className="p-2 text-right">
                            <input
                              type="number"
                              min="0"
                              value={item.UnitPrice}
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                setBulkPoParsedItems(prev => prev.map((it, i) => i === idx ? { ...it, UnitPrice: val } : it));
                              }}
                              className="w-16 p-1 border border-slate-200 rounded text-right text-xs font-bold bg-white"
                            />
                          </td>
                          <td className="p-2 text-right font-extrabold text-slate-900 text-xs">
                            Rs. {(item.Qty * item.UnitPrice).toLocaleString()}
                          </td>
                          <td className="p-2 text-center">
                            <button
                              type="button"
                              onClick={() => setBulkPoParsedItems(prev => prev.filter((_, i) => i !== idx))}
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
                onClick={() => setShowUploadBulkPoModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={bulkPoParsedItems.length === 0}
                onClick={handleApplyBulkPoToForm}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-extrabold text-xs shadow-md transition flex items-center space-x-1.5 cursor-pointer"
              >
                <ShoppingCart className="w-4 h-4" />
                <span>Create Purchase Order ({bulkPoParsedItems.length} Items)</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulkPoUploadModal;
