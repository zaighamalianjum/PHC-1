import React from 'react';
import { Pencil, Boxes, Save } from 'lucide-react';

interface QuickAddMedicineModalProps {
  showQuickAddMedModal: boolean;
  setShowQuickAddMedModal: (show: boolean) => void;
  quickMedForm: any;
  setQuickMedForm: React.Dispatch<React.SetStateAction<any>>;
  editingQuickMed: any | null;
  setEditingQuickMed: (med: any | null) => void;
  medicineCategories: string[];
  handleQuickAddMedicine: (e: React.FormEvent) => void;
  resolveSmartMedicineCategory: (
    rawCategoryStr?: string,
    matchedInv?: any,
    matchedPoItem?: any,
    medicineName?: string
  ) => string;
}

export const QuickAddMedicineModal: React.FC<QuickAddMedicineModalProps> = ({
  showQuickAddMedModal,
  setShowQuickAddMedModal,
  quickMedForm,
  setQuickMedForm,
  editingQuickMed,
  setEditingQuickMed,
  medicineCategories,
  handleQuickAddMedicine,
  resolveSmartMedicineCategory,
}) => {
  if (!showQuickAddMedModal) return null;
  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 z-[60]">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-3">
            <div className={`p-2.5 rounded-xl font-bold ${editingQuickMed ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600'}`}>
              {editingQuickMed ? <Pencil className="w-6 h-6" /> : <Boxes className="w-6 h-6" />}
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base flex items-center space-x-2">
                <span>{editingQuickMed ? `Edit Medicine: ${editingQuickMed.ItemName || editingQuickMed.ItemID}` : 'Add New Medicine to Stock'}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                  editingQuickMed ? 'bg-indigo-100 text-indigo-800' : 'bg-emerald-100 text-emerald-800'
                }`}>
                  {editingQuickMed ? 'Master Inventory & PO' : 'Master Inventory'}
                </span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {editingQuickMed
                  ? `Update name, category, pricing, and stock details for item ${editingQuickMed.ItemID || ''}.`
                  : 'Save to stock inventory database and immediately include in current Purchase Order.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setShowQuickAddMedModal(false);
              setEditingQuickMed(null);
            }}
            className="text-slate-400 hover:text-slate-600 font-bold p-1 rounded-lg hover:bg-slate-100 cursor-pointer text-base"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleQuickAddMedicine} className="space-y-4">
          {/* Medicine Name */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-slate-700">
                Medicine Name / Formula <span className="text-rose-500">*</span>
              </label>
              {editingQuickMed && (
                <span className="text-[10px] font-mono text-indigo-600 font-bold">
                  ID: {editingQuickMed.ItemID}
                </span>
              )}
            </div>
            <input
              type="text"
              required
              autoFocus
              placeholder="e.g. BM 50, Arnica Montana 30C, Panadol 500mg"
              value={quickMedForm.ItemName}
              onChange={e => {
                const val = e.target.value;
                const autoCat = resolveSmartMedicineCategory(undefined, undefined, undefined, val);
                setQuickMedForm((prev: any) => ({
                  ...prev,
                  ItemName: val,
                  Category: prev.Category === 'BM Drops' || prev.Category === autoCat ? autoCat : prev.Category
                }));
              }}
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          {/* Category & Unit */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Medicine Category / Group <span className="text-rose-500">*</span>
              </label>
              <select
                value={quickMedForm.Category}
                onChange={e => setQuickMedForm({ ...quickMedForm, Category: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 cursor-pointer"
              >
                {medicineCategories.map((cat, idx) => (
                  <option key={idx} value={cat}>{cat}</option>
                ))}
                <option value="__custom__">➕ Type Custom Category...</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Packaging / Unit
              </label>
              <input
                type="text"
                list="quick-med-units"
                placeholder="e.g. Bottle, Pack, Strip, Box"
                value={quickMedForm.Unit}
                onChange={e => setQuickMedForm({ ...quickMedForm, Unit: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
              <datalist id="quick-med-units">
                <option value="Bottle" />
                <option value="Pack" />
                <option value="Strip" />
                <option value="Box" />
                <option value="Drops 30ml" />
                <option value="Syrup 120ml" />
                <option value="Vial" />
                <option value="Piece" />
              </datalist>
            </div>
          </div>

          {/* Custom Category Input if selected */}
          {quickMedForm.Category === '__custom__' && (
            <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl space-y-1">
              <label className="block text-xs font-extrabold text-indigo-900">
                New Category Name
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Biochemic Salts, Mother Tincture Special"
                value={quickMedForm.CustomCategory}
                onChange={e => setQuickMedForm({ ...quickMedForm, CustomCategory: e.target.value })}
                className="w-full p-2 bg-white border border-indigo-300 rounded-lg text-xs font-bold text-indigo-950 focus:ring-2 focus:ring-indigo-500/30"
              />
            </div>
          )}

          {/* Pricing (Trade Price & MRP) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Purchase / Trade Price (TP)
              </label>
              <div className="relative">
                <span className="absolute left-2.5 top-2 text-xs font-bold text-slate-400">Rs.</span>
                <input
                  type="number"
                  min="0"
                  step="any"
                  placeholder="0"
                  value={quickMedForm.TradePrice}
                  onChange={e => setQuickMedForm({ ...quickMedForm, TradePrice: e.target.value })}
                  className="w-full pl-8 pr-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold font-mono text-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Retail Sale Price (MRP)
              </label>
              <div className="relative">
                <span className="absolute left-2.5 top-2 text-xs font-bold text-slate-400">Rs.</span>
                <input
                  type="number"
                  min="0"
                  step="any"
                  placeholder="0"
                  value={quickMedForm.SalePrice}
                  onChange={e => setQuickMedForm({ ...quickMedForm, SalePrice: e.target.value })}
                  className="w-full pl-8 pr-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold font-mono text-slate-900"
                />
              </div>
            </div>
          </div>

          {/* Stock Levels */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Low Stock Alert Level
              </label>
              <input
                type="number"
                min="0"
                placeholder="10"
                value={quickMedForm.MinStock}
                onChange={e => setQuickMedForm({ ...quickMedForm, MinStock: e.target.value })}
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold font-mono text-slate-900"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Current Stock in Hand
              </label>
              <input
                type="number"
                min="0"
                placeholder="0"
                value={quickMedForm.InitialStock}
                onChange={e => setQuickMedForm({ ...quickMedForm, InitialStock: e.target.value })}
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold font-mono text-slate-900"
              />
            </div>
          </div>

          {/* Add to current Purchase Order checkbox & Requisition Qty */}
          <div className={`p-3.5 rounded-xl space-y-2.5 border ${
            editingQuickMed ? 'bg-indigo-50/70 border-indigo-200' : 'bg-emerald-50/70 border-emerald-200'
          }`}>
            <label className="flex items-center space-x-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={quickMedForm.AutoAddToPo}
                onChange={e => setQuickMedForm({ ...quickMedForm, AutoAddToPo: e.target.checked })}
                className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
              />
              <span className="text-xs font-extrabold text-slate-900">
                {editingQuickMed
                  ? 'Keep / Update this medicine in active Purchase Order requisition'
                  : 'Automatically add this medicine to current Purchase Order list'}
              </span>
            </label>

            {quickMedForm.AutoAddToPo && (
              <div className="flex items-center space-x-2 pl-6 pt-1">
                <label className="text-xs font-bold text-slate-800 whitespace-nowrap">
                  Required Order Quantity:
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={quickMedForm.RequisitionQty}
                  onChange={e => setQuickMedForm({ ...quickMedForm, RequisitionQty: e.target.value })}
                  className="w-24 p-1.5 bg-white border border-indigo-300 rounded-lg text-xs font-black font-mono text-indigo-950 text-center"
                />
                <span className="text-xs font-bold text-indigo-700">Units</span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                setShowQuickAddMedModal(false);
                setEditingQuickMed(null);
              }}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`px-5 py-2.5 rounded-xl font-bold text-xs text-white transition shadow-sm flex items-center space-x-1.5 cursor-pointer ${
                editingQuickMed
                  ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20'
                  : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
              }`}
            >
              <Save className="w-4 h-4" />
              <span>{editingQuickMed ? 'Update Medicine Details' : 'Save Medicine & Add to PO'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default QuickAddMedicineModal;
