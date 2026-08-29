/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Item, Supplier } from '../../types';
import { toMonthYearInput } from '../../utils/pharmacyUtils';
import {
  Pill,
  Database,
  AlertCircle,
  X,
  Sparkles,
  Tag,
  Plus,
  Boxes,
  Barcode,
  Save
} from 'lucide-react';

interface PharmacyAddMedicineModalProps {
  isAddMedicineModalOpen: boolean;
  setIsAddMedicineModalOpen: (open: boolean) => void;
  isEditingMedicine: boolean;
  editingMedicineId: string | null;
  medFormId: string;
  setMedFormId: (v: string) => void;
  medFormName: string;
  setMedFormName: (v: string) => void;
  medFormUnit: string;
  setMedFormUnit: (v: string) => void;
  medFormType: 'C' | 'P';
  setMedFormType: (v: 'C' | 'P') => void;
  medFormFormula: string;
  setMedFormFormula: (v: string) => void;
  medFormCost: number | '';
  setMedFormCost: (v: number | '') => void;
  medFormPrice: number | '';
  setMedFormPrice: (v: number | '') => void;
  medFormStock: number | '';
  setMedFormStock: (v: number | '') => void;
  medFormMinStock: number | '';
  setMedFormMinStock: (v: number | '') => void;
  medFormRack: string;
  setMedFormRack: (v: string) => void;
  medFormSupplier: string;
  setMedFormSupplier: (v: string) => void;
  medFormBarcode: string;
  setMedFormBarcode: (v: string) => void;
  medFormExpDate: string;
  setMedFormExpDate: (v: string) => void;
  medFormBatchNo: string;
  setMedFormBatchNo: (v: string) => void;
  medFormReorderQty: number | '';
  setMedFormReorderQty: (v: number | '') => void;
  medFormMaxStock: number | '';
  setMedFormMaxStock: (v: number | '') => void;
  handleSaveMedicine: (e: React.FormEvent) => void;
  setIsCategoryModalOpen: (open: boolean) => void;
  medicineCategories: string[];
  suppliers: Supplier[];
  items?: Item[];
}

export const PharmacyAddMedicineModal: React.FC<PharmacyAddMedicineModalProps> = ({
  isAddMedicineModalOpen,
  setIsAddMedicineModalOpen,
  isEditingMedicine,
  editingMedicineId,
  medFormId,
  setMedFormId,
  medFormName,
  setMedFormName,
  medFormUnit,
  setMedFormUnit,
  medFormType,
  setMedFormType,
  medFormFormula,
  setMedFormFormula,
  medFormCost,
  setMedFormCost,
  medFormPrice,
  setMedFormPrice,
  medFormStock,
  setMedFormStock,
  medFormMinStock,
  setMedFormMinStock,
  medFormRack,
  setMedFormRack,
  medFormSupplier,
  setMedFormSupplier,
  medFormBarcode,
  setMedFormBarcode,
  medFormExpDate,
  setMedFormExpDate,
  medFormBatchNo,
  setMedFormBatchNo,
  medFormReorderQty,
  setMedFormReorderQty,
  medFormMaxStock,
  setMedFormMaxStock,
  handleSaveMedicine,
  setIsCategoryModalOpen,
  medicineCategories,
  suppliers,
  items = []
}) => {
  
  const itemFormId = medFormId;
  const setItemFormId = setMedFormId;
  const itemFormName = medFormName;
  const setItemFormName = setMedFormName;
  const itemFormUnit = medFormUnit;
  const setItemFormUnit = setMedFormUnit;
  const itemFormMedicineType = medFormType;
  const setItemFormMedicineType = setMedFormType;
  const itemFormFormula = medFormFormula;
  const setItemFormFormula = setMedFormFormula;
  const itemFormPurchasePrice = medFormCost;
  const setItemFormPurchasePrice = setMedFormCost;
  const itemFormRetailPrice = medFormPrice;
  const setItemFormRetailPrice = setMedFormPrice;
  const itemFormCStock = medFormStock;
  const setItemFormCStock = setMedFormStock;
  const itemFormMinStock = medFormMinStock;
  const setItemFormMinStock = setMedFormMinStock;
  const itemFormRack = medFormRack;
  const setItemFormRack = setMedFormRack;
  const itemFormSupplier = medFormSupplier;
  const setItemFormSupplier = setMedFormSupplier;
  const itemFormBarcode = medFormBarcode;
  const setItemFormBarcode = setMedFormBarcode;
  const itemFormExpDate = medFormExpDate;
  const setItemFormExpDate = setMedFormExpDate;
  const itemFormBatchNo = medFormBatchNo;
  const setItemFormBatchNo = setMedFormBatchNo;
  const itemFormReorderQty = medFormReorderQty;
  const setItemFormReorderQty = setMedFormReorderQty;
  const itemFormMaxStock = medFormMaxStock;
  const setItemFormMaxStock = setMedFormMaxStock;
  const categories = medicineCategories;
  const editingItem = isEditingMedicine ? { ItemID: editingMedicineId, Batches: [] } : null;
  const canEditStock = true;
  const canAdd = Boolean(medFormName.trim() && medFormUnit.trim());
  const handleSaveItem = handleSaveMedicine;
  const resetItemForm = () => setIsAddMedicineModalOpen(false);
  const invErrorMsg = '';
  const itemFormMfgDate = '';
  const setItemFormMfgDate = (_?: string) => {};
  const handleOpenBatchManager = (_?: any) => {};
  const getAutoNextItemId = (_?: any[]) => 'MED-' + Math.floor(1000 + Math.random() * 9000);

  if (!isAddMedicineModalOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 animate-fadeIn font-sans" id="add-medicine-modal">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full max-h-[85vh] flex flex-col overflow-hidden">
            
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-150 flex items-center justify-between bg-slate-50 shrink-0">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-950">
                    {editingItem ? `Edit Medicine: ${editingItem.ItemID}` : 'Add New Medicine to Inventory'}
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    {editingItem ? 'Modify unit cost, retail price, minimum threshold, or stock level.' : 'Enter new medicine parameters, category dropdown, and initial stock.'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={resetItemForm}
                className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-100 rounded-full transition cursor-pointer font-bold"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleSaveItem} className="p-5 overflow-y-auto flex-1 space-y-3.5 text-xs">
              {invErrorMsg && (
                <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg font-semibold border border-red-100 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-2 shrink-0 text-red-500" />
                  {invErrorMsg}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Item ID *</label>
                  <input
                    type="text"
                    required
                    disabled={!!editingItem}
                    placeholder=""
                    value={itemFormId}
                    onChange={(e) => setItemFormId(e.target.value.toUpperCase())}
                    className="w-full p-2 border rounded-lg focus:ring-1 focus:ring-indigo-500 font-mono disabled:bg-slate-50 disabled:text-slate-500 border-slate-200 text-slate-900 font-bold"
                  />
                  {!editingItem && (
                    <button
                      type="button"
                      onClick={() => {
                        setItemFormId(getAutoNextItemId(items));
                      }}
                      className="text-[9px] text-indigo-600 font-extrabold mt-1 hover:underline text-left block"
                    >
                      + Auto-Generate ID ({getAutoNextItemId(items)})
                    </button>
                  )}
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Medicine Type</label>
                  <select
                    value={itemFormMedicineType}
                    onChange={(e) => setItemFormMedicineType(e.target.value as 'C' | 'P')}
                    className="w-full p-2 border rounded-lg focus:ring-1 focus:ring-indigo-500 border-slate-200 font-semibold bg-white text-slate-900"
                  >
                    <option value="P">Patent Medicine (/P)</option>
                    <option value="C">Clinical Compounding (/C)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Medicine / Item Name *</label>
                <input
                  type="text"
                  required
                  placeholder=""
                  value={itemFormName}
                  onChange={(e) => setItemFormName(e.target.value)}
                  className="w-full p-2 border rounded-lg focus:ring-1 focus:ring-indigo-500 border-slate-200 font-bold text-slate-900"
                />
              </div>



              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">
                    Medicine Category Dropdown *
                  </label>
                  <div className="space-y-1">
                    <select
                      value={categories.includes(itemFormUnit) ? itemFormUnit : 'Custom'}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val !== 'Custom') {
                          setItemFormUnit(val);
                        } else {
                          setItemFormUnit('');
                        }
                      }}
                      className="w-full p-2 border rounded-lg focus:ring-1 focus:ring-indigo-500 border-slate-200 font-semibold text-slate-800 bg-white"
                    >
                      {categories.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                      <option value="Custom">Custom / Other Category...</option>
                    </select>

                    {(!categories.includes(itemFormUnit) || itemFormUnit === '') && (
                      <input
                        type="text"
                        required
                        placeholder=""
                        value={itemFormUnit}
                        onChange={(e) => setItemFormUnit(e.target.value)}
                        className="w-full p-1.5 text-xs border rounded-lg focus:ring-1 focus:ring-indigo-500 border-slate-200 font-semibold text-slate-800 bg-amber-50/50"
                      />
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Minimum Threshold</label>
                  <input
                    type="number"
                    min="0"
                    placeholder=""
                    value={itemFormMinStock}
                    onChange={(e) => setItemFormMinStock(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full p-2 border rounded-lg focus:ring-1 focus:ring-indigo-500 border-slate-200 font-mono font-bold text-slate-900"
                  />
                </div>
              </div>

              {/* Multi-Batch Action Banner for existing medicine */}
              {editingItem && (
                <div className="p-3 bg-gradient-to-r from-indigo-50 via-slate-50 to-indigo-50/60 border border-indigo-200 rounded-xl flex items-center justify-between gap-3 shadow-xs">
                  <div className="flex items-center space-x-2.5 min-w-0">
                    <div className="p-2 bg-indigo-600 text-white rounded-lg shrink-0 shadow-xs">
                      <Boxes className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center space-x-1.5">
                        <span className="font-extrabold text-indigo-950 text-xs">Multi-Batch & Expiry Lots</span>
                        <span className="px-1.5 py-0.2 bg-indigo-100 text-indigo-800 rounded font-mono text-[9px] font-bold">
                          {Array.isArray(editingItem.Batches) && editingItem.Batches.length > 0
                            ? `${editingItem.Batches.length} Batches`
                            : '1 Default Lot'}
                        </span>
                      </div>
                      <p className="text-[10px] text-indigo-700/90 font-medium truncate">
                        View lot-by-lot stock, expiry dates, purchase costs, and receive new stock batches.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddMedicineModalOpen(false);
                      handleOpenBatchManager(editingItem);
                    }}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-[11px] rounded-lg shadow-xs flex items-center space-x-1 cursor-pointer transition shrink-0"
                  >
                    <Boxes className="w-3.5 h-3.5 mr-1" />
                    <span>Manage Batches</span>
                  </button>
                </div>
              )}

              {/* Batch No, Mfg Date, and Exp Date Fields (Extracted from Box QR / Scanner / Master Defaults) */}
              <div className="grid grid-cols-3 gap-3 p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-600 uppercase tracking-wider mb-1">Batch # (B#)</label>
                  <input
                    type="text"
                    placeholder="e.g. B-2026-001"
                    value={itemFormBatchNo}
                    onChange={(e) => setItemFormBatchNo(e.target.value)}
                    className="w-full p-2 border rounded-lg focus:ring-1 focus:ring-indigo-500 border-slate-300 bg-white font-mono font-bold text-xs text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold text-slate-600 uppercase tracking-wider mb-1">Mfg Date (Month/Year)</label>
                  <input
                    type="month"
                    value={toMonthYearInput(itemFormMfgDate)}
                    onChange={(e) => setItemFormMfgDate(e.target.value)}
                    className="w-full p-2 border rounded-lg focus:ring-1 focus:ring-indigo-500 border-slate-300 bg-white font-mono font-bold text-xs text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold text-slate-600 uppercase tracking-wider mb-1">Exp Date (Month/Year)</label>
                  <input
                    type="month"
                    value={toMonthYearInput(itemFormExpDate)}
                    onChange={(e) => setItemFormExpDate(e.target.value)}
                    className="w-full p-2 border rounded-lg focus:ring-1 focus:ring-indigo-500 border-slate-300 bg-white font-mono font-bold text-xs text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Purchase Price (Rs.)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder=""
                    value={itemFormPurchasePrice}
                    onChange={(e) => setItemFormPurchasePrice(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full p-2 border rounded-lg focus:ring-1 focus:ring-indigo-500 border-slate-200 font-mono font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Retail Price (Rs.)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder=""
                    value={itemFormRetailPrice}
                    onChange={(e) => setItemFormRetailPrice(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full p-2 border rounded-lg focus:ring-1 focus:ring-indigo-500 border-slate-200 font-mono font-bold text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-between">
                    <span>Current Stock Level</span>
                    {!canEditStock && <span className="text-rose-600 font-bold text-[9px] lowercase">(Edit Restricted)</span>}
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder=""
                    disabled={!canEditStock}
                    value={itemFormCStock}
                    onChange={(e) => setItemFormCStock(e.target.value === '' ? '' : Number(e.target.value))}
                    className={`w-full p-2 border rounded-lg focus:ring-1 focus:ring-indigo-500 font-mono font-bold text-slate-900 ${
                      !canEditStock ? 'bg-slate-100 text-slate-400 cursor-not-allowed border-slate-200' : 'border-slate-200'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold text-indigo-600 uppercase tracking-wider mb-1">Buy / Reorder QTY</label>
                  <input
                    type="number"
                    min="0"
                    placeholder=""
                    value={itemFormReorderQty}
                    onChange={(e) => setItemFormReorderQty(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full p-2 border rounded-lg focus:ring-1 focus:ring-indigo-500 border-indigo-200 bg-indigo-50/30 font-mono font-bold text-indigo-950"
                  />
                </div>
              </div>

              {/* Modal Footer Buttons */}
              <div className="pt-4 border-t border-slate-100 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={resetItemForm}
                  className="px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-lg transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!canAdd}
                  className={`px-5 py-2 rounded-lg text-white font-bold text-xs transition shadow-md ${
                    canAdd
                      ? 'bg-indigo-600 hover:bg-indigo-700'
                      : 'bg-slate-400 cursor-not-allowed'
                  }`}
                >
                  {editingItem ? 'Update Medicine' : 'Add to Inventory'}
                </button>
              </div>
            </form>

          </div>
        </div>
  );
};

export default PharmacyAddMedicineModal;
