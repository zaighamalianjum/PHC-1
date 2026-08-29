/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Item, ItemBatch } from '../../types';
import { isBatchExpired, isBatchNearExpiry, toMonthYearInput, formatMonthYearDisplay } from '../../utils/pharmacyUtils';
import {
  Boxes,
  X,
  Sparkles,
  Layers,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Zap,
  Tag,
  Edit,
  PlusCircle,
  Plus,
  Trash2,
  Save,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface PharmacyBatchesModalProps {
  isBatchesModalOpen: boolean;
  selectedBatchItem: Item | null;
  setIsBatchesModalOpen: (open: boolean) => void;
  setSelectedBatchItem: (item: Item | null) => void;
  setEditingBatchId: (id: string | null) => void;
  batchModalMsg: { type: 'success' | 'error'; text: string } | null;
  editingBatchId: string | null;
  batchFormNo: string;
  setBatchFormNo: (v: string) => void;
  batchFormMfgDate: string;
  setBatchFormMfgDate: (v: string) => void;
  batchFormExpDate: string;
  setBatchFormExpDate: (v: string) => void;
  batchFormQty: number | '';
  setBatchFormQty: (v: number | '') => void;
  batchFormCost: number | '';
  setBatchFormCost: (v: number | '') => void;
  batchFormSalePrice: number | '';
  setBatchFormSalePrice: (v: number | '') => void;
  batchFormPoGrnRef: string;
  setBatchFormPoGrnRef: (v: string) => void;
  handleStartEditBatch: (batch: ItemBatch) => void;
  handleDeleteBatch: (batchId: string) => void;
  handleSaveBatch: (e: React.FormEvent) => void;
}

export const PharmacyBatchesModal: React.FC<PharmacyBatchesModalProps> = ({
  isBatchesModalOpen,
  selectedBatchItem,
  setIsBatchesModalOpen,
  setSelectedBatchItem,
  setEditingBatchId,
  batchModalMsg,
  editingBatchId,
  batchFormNo,
  setBatchFormNo,
  batchFormMfgDate,
  setBatchFormMfgDate,
  batchFormExpDate,
  setBatchFormExpDate,
  batchFormQty,
  setBatchFormQty,
  batchFormCost,
  setBatchFormCost,
  batchFormSalePrice,
  setBatchFormSalePrice,
  batchFormPoGrnRef,
  setBatchFormPoGrnRef,
  handleStartEditBatch,
  handleDeleteBatch,
  handleSaveBatch
}) => {
  if (!isBatchesModalOpen || !selectedBatchItem) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl overflow-hidden flex flex-col max-h-[92vh] animate-scaleUp">
            
            {/* Modal Header */}
            <div className="p-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center space-x-3 min-w-0">
                <div className="p-2.5 bg-indigo-500/20 text-indigo-300 rounded-xl border border-indigo-500/30 shrink-0">
                  <Boxes className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center space-x-2 flex-wrap">
                    <h3 className="text-base font-extrabold text-white truncate">
                      {selectedBatchItem.ItemName}
                    </h3>
                    <span className="px-2 py-0.5 bg-indigo-500/30 text-indigo-200 rounded-full font-mono text-[11px] font-bold border border-indigo-400/30">
                      ID: {selectedBatchItem.ItemID}
                    </span>
                    <span className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded-full text-[10px] font-bold">
                      {selectedBatchItem.Unit || 'Tab'} • {selectedBatchItem.MedicineType === 'C' ? 'Clinical' : 'Patent'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 font-medium mt-0.5">
                    Multi-Batch Tracking, Lot-by-Lot Expiry Dates & Automatic FEFO Stock Allocation
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3 shrink-0">
                <div className="text-right hidden sm:block bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Live Stock</div>
                  <div className="text-base font-black font-mono text-emerald-400">
                    {selectedBatchItem.CStock} {selectedBatchItem.Unit || 'Units'}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsBatchesModalOpen(false);
                    setSelectedBatchItem(null);
                    setEditingBatchId(null);
                  }}
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Notification messages */}
            {batchModalMsg && (
              <div className={`px-4 py-2 text-xs font-bold shrink-0 flex items-center ${
                batchModalMsg.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-b border-emerald-200' : 'bg-rose-50 text-rose-800 border-b border-rose-200'
              }`}>
                {batchModalMsg.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 mr-2 text-rose-600 shrink-0" />
                )}
                <span>{batchModalMsg.text}</span>
              </div>
            )}

            {/* Modal Body: 2-Column Grid */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 grid grid-cols-1 lg:grid-cols-12 gap-5 bg-slate-50/50">
              
              {/* Left Column: Batches Table (7 cols) */}
              <div className="lg:col-span-7 flex flex-col space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Boxes className="w-4 h-4 text-indigo-600" />
                    <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-800">
                      Active Stock Batches / Lots
                    </h4>
                  </div>
                  <span className="text-[11px] font-bold text-slate-500 font-mono">
                    {Array.isArray(selectedBatchItem.Batches) ? selectedBatchItem.Batches.length : (selectedBatchItem.ExpDate ? 1 : 0)} Recorded Lots
                  </span>
                </div>

                {/* Batches Table */}
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
                  {(() => {
                    const batchesList: ItemBatch[] = Array.isArray(selectedBatchItem.Batches) && selectedBatchItem.Batches.length > 0
                      ? selectedBatchItem.Batches
                      : (selectedBatchItem.CStock > 0 || selectedBatchItem.BatchNo || selectedBatchItem.ExpDate
                          ? [{
                              BatchID: `${selectedBatchItem.ItemID}-B-initial`,
                              ItemID: selectedBatchItem.ItemID,
                              ItemName: selectedBatchItem.ItemName,
                              BatchNo: selectedBatchItem.BatchNo || 'B# 001',
                              MfgDate: selectedBatchItem.MfgDate || '',
                              ExpDate: selectedBatchItem.ExpDate || '',
                              PurchasePrice: selectedBatchItem.PurchasePrice,
                              SalePrice: selectedBatchItem.Price,
                              Qty: selectedBatchItem.CStock,
                              InitialQty: selectedBatchItem.CStock,
                              Status: selectedBatchItem.CStock === 0 ? 'EXHAUSTED' : isBatchExpired(selectedBatchItem.ExpDate) ? 'EXPIRED' : 'ACTIVE',
                              CreatedAt: new Date().toISOString()
                            }]
                          : []);

                    if (batchesList.length === 0) {
                      return (
                        <div className="p-8 text-center text-slate-400 space-y-2">
                          <Boxes className="w-8 h-8 mx-auto text-slate-300" />
                          <p className="text-xs font-bold text-slate-600">No stock batches recorded yet for this medicine.</p>
                          <p className="text-[11px] text-slate-400">Use the form on the right to inward a new stock lot with its expiry date.</p>
                        </div>
                      );
                    }

                    // Sort by Expiry Date (FEFO)
                    const sortedBatches = [...batchesList].sort((a, b) => (a.ExpDate || '9999').localeCompare(b.ExpDate || '9999'));

                    return (
                      <div className="overflow-x-auto max-h-[360px] overflow-y-auto">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead className="bg-slate-100 text-slate-700 font-extrabold text-[10px] uppercase tracking-wider border-b border-slate-200 sticky top-0">
                            <tr>
                              <th className="px-3 py-2">Batch #</th>
                              <th className="px-2.5 py-2">Expiry Date</th>
                              <th className="px-2.5 py-2 text-right">Available Qty</th>
                              <th className="px-2.5 py-2 text-right">Cost (Rs)</th>
                              <th className="px-2.5 py-2 text-center">Status</th>
                              <th className="px-2.5 py-2 text-center">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-slate-800">
                            {sortedBatches.map((b, idx) => {
                              const isExp = isBatchExpired(b.ExpDate);
                              const isNearExp = isBatchNearExpiry(b.ExpDate, 90);
                              const isSelectedForEdit = editingBatchId === b.BatchID;

                              return (
                                <tr
                                  key={b.BatchID || idx}
                                  className={`transition hover:bg-slate-50 ${
                                    isSelectedForEdit
                                      ? 'bg-indigo-50/80 ring-1 ring-indigo-400'
                                      : isExp
                                      ? 'bg-rose-50/50'
                                      : isNearExp
                                      ? 'bg-amber-50/40'
                                      : 'bg-white'
                                  }`}
                                >
                                  {/* Batch # & Ref */}
                                  <td className="px-3 py-2 font-mono font-bold text-slate-900">
                                    <div>
                                      <span>{b.BatchNo || 'N/A'}</span>
                                      {b.GRNID && (
                                        <div className="text-[9px] font-sans font-medium text-slate-400">
                                          Ref: {b.GRNID}
                                        </div>
                                      )}
                                    </div>
                                  </td>

                                  {/* Expiry Date */}
                                  <td className="px-2.5 py-2">
                                    <div className="flex flex-col">
                                      <span className="font-mono font-bold text-slate-800">
                                        {formatMonthYearDisplay(b.ExpDate) || b.ExpDate || 'Not set'}
                                      </span>
                                      {b.MfgDate && (
                                        <span className="text-[9px] text-slate-400 font-mono">
                                          Mfg: {formatMonthYearDisplay(b.MfgDate) || b.MfgDate}
                                        </span>
                                      )}
                                    </div>
                                  </td>

                                  {/* Qty */}
                                  <td className="px-2.5 py-2 text-right font-mono font-extrabold text-slate-900">
                                    <span className={b.Qty === 0 ? 'text-slate-400' : 'text-emerald-700'}>
                                      {b.Qty}
                                    </span>
                                  </td>

                                  {/* Purchase Price */}
                                  <td className="px-2.5 py-2 text-right font-mono text-slate-700">
                                    {b.PurchasePrice !== undefined ? Number(b.PurchasePrice).toFixed(2) : '-'}
                                  </td>

                                  {/* Status Badge */}
                                  <td className="px-2.5 py-2 text-center">
                                    {b.Qty === 0 ? (
                                      <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[9px] font-bold">
                                        Exhausted
                                      </span>
                                    ) : isExp ? (
                                      <span className="px-1.5 py-0.5 bg-rose-100 text-rose-800 rounded text-[9px] font-black uppercase">
                                        🔴 Expired
                                      </span>
                                    ) : isNearExp ? (
                                      <span className="px-1.5 py-0.5 bg-amber-100 text-amber-900 rounded text-[9px] font-bold">
                                        🟡 &lt;90 Days
                                      </span>
                                    ) : (
                                      <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded text-[9px] font-bold">
                                        🟢 Active
                                      </span>
                                    )}
                                  </td>

                                  {/* Actions */}
                                  <td className="px-2.5 py-2 text-center">
                                    <div className="flex items-center justify-center space-x-1">
                                      <button
                                        type="button"
                                        onClick={() => handleStartEditBatch(b)}
                                        className="p-1 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded transition cursor-pointer"
                                        title="Edit Batch Parameters"
                                      >
                                        <Edit className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteBatch(b.BatchID)}
                                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition cursor-pointer"
                                        title="Delete Batch Lot"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    );
                  })()}
                </div>

                {/* FEFO Dispensing Note */}
                <div className="p-3 bg-indigo-50/70 border border-indigo-200/80 rounded-xl flex items-start space-x-2.5">
                  <div className="p-1.5 bg-indigo-600 text-white rounded-lg shrink-0 mt-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                  <div className="text-[11px] text-indigo-950 leading-relaxed font-medium">
                    <strong className="text-indigo-900">FEFO (First-Expired, First-Out) Automated Engine:</strong> When billing prescriptions or selling at POS, stock will automatically be consumed from the earliest expiring valid lot first. Expired stock lots are prevented from being dispensed.
                  </div>
                </div>
              </div>

              {/* Right Column: Inward / Edit Batch Form (5 cols) */}
              <div className="lg:col-span-5 bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
                    <div className="flex items-center space-x-2">
                      <div className={`p-1.5 rounded-lg ${editingBatchId ? 'bg-amber-100 text-amber-800' : 'bg-indigo-100 text-indigo-800'}`}>
                        <PlusCircle className="w-4 h-4" />
                      </div>
                      <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-900">
                        {editingBatchId ? 'Edit Selected Batch Lot' : 'Receive / Add New Stock Batch'}
                      </h4>
                    </div>
                    {editingBatchId && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingBatchId(null);
                          setBatchFormNo('');
                          setBatchFormExpDate('');
                          setBatchFormQty('');
                        }}
                        className="text-[11px] font-bold text-indigo-600 hover:underline cursor-pointer"
                      >
                        + New Batch
                      </button>
                    )}
                  </div>

                  <form id="save-batch-form" onSubmit={handleSaveBatch} className="space-y-3">
                    <div>
                      <label className="block text-[10px] font-extrabold text-slate-600 uppercase tracking-wider mb-1">
                        Batch # (Lot Number) *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. B-2026-002"
                        value={batchFormNo}
                        onChange={(e) => setBatchFormNo(e.target.value)}
                        className="w-full p-2 border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[10px] font-extrabold text-slate-600 uppercase tracking-wider mb-1">
                          Mfg Date (Month/Year)
                        </label>
                        <input
                          type="month"
                          value={toMonthYearInput(batchFormMfgDate)}
                          onChange={(e) => setBatchFormMfgDate(e.target.value)}
                          className="w-full p-2 border border-slate-300 rounded-lg text-xs font-mono font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-extrabold text-rose-600 uppercase tracking-wider mb-1">
                          Expiry Date (Month/Year) *
                        </label>
                        <input
                          type="month"
                          required
                          value={toMonthYearInput(batchFormExpDate)}
                          onChange={(e) => setBatchFormExpDate(e.target.value)}
                          className="w-full p-2 border border-rose-300 rounded-lg text-xs font-mono font-bold text-rose-950 focus:ring-2 focus:ring-rose-500 focus:outline-none bg-rose-50/30"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[10px] font-extrabold text-slate-600 uppercase tracking-wider mb-1">
                          Quantity in Batch *
                        </label>
                        <input
                          type="number"
                          min="0"
                          required
                          placeholder="e.g. 50"
                          value={batchFormQty}
                          onChange={(e) => setBatchFormQty(e.target.value === '' ? '' : Number(e.target.value))}
                          className="w-full p-2 border border-slate-300 rounded-lg text-xs font-mono font-black text-emerald-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-extrabold text-slate-600 uppercase tracking-wider mb-1">
                          Unit Cost (Rs.)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="Cost Price"
                          value={batchFormCost}
                          onChange={(e) => setBatchFormCost(e.target.value === '' ? '' : Number(e.target.value))}
                          className="w-full p-2 border border-slate-300 rounded-lg text-xs font-mono font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[10px] font-extrabold text-slate-600 uppercase tracking-wider mb-1">
                          Retail Price (Rs.)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="Sale Price"
                          value={batchFormSalePrice}
                          onChange={(e) => setBatchFormSalePrice(e.target.value === '' ? '' : Number(e.target.value))}
                          className="w-full p-2 border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-extrabold text-slate-600 uppercase tracking-wider mb-1">
                          PO / GRN Ref (Opt)
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. GRN-104"
                          value={batchFormPoGrnRef}
                          onChange={(e) => setBatchFormPoGrnRef(e.target.value)}
                          className="w-full p-2 border border-slate-300 rounded-lg text-xs font-mono font-medium text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  </form>
                </div>

                <div className="pt-4 border-t border-slate-200 mt-4 flex items-center justify-end space-x-2">
                  {editingBatchId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingBatchId(null);
                        setBatchFormNo('');
                        setBatchFormExpDate('');
                        setBatchFormQty('');
                      }}
                      className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
                    >
                      Cancel Edit
                    </button>
                  )}
                  <button
                    type="submit"
                    form="save-batch-form"
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-extrabold text-xs rounded-xl transition cursor-pointer shadow-md flex items-center space-x-1.5"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>{editingBatchId ? 'Update Batch' : 'Save Batch & Update Master Stock'}</span>
                  </button>
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-slate-100 border-t border-slate-200 flex justify-between items-center px-5">
              <div className="text-[11px] text-slate-500 font-medium">
                Medicine ID: <span className="font-mono font-bold text-slate-800">{selectedBatchItem.ItemID}</span> • Total Batches: <span className="font-mono font-bold text-slate-800">{Array.isArray(selectedBatchItem.Batches) ? selectedBatchItem.Batches.length : (selectedBatchItem.ExpDate ? 1 : 0)}</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsBatchesModalOpen(false);
                  setSelectedBatchItem(null);
                  setEditingBatchId(null);
                }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl transition cursor-pointer shadow-xs"
              >
                Close Manager
              </button>
            </div>
          </div>
        </div>
  );
};

export default PharmacyBatchesModal;
