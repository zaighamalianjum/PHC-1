import React from 'react';
import { Receipt, X, Plus, Edit, Trash2, Save, CheckCircle2 } from 'lucide-react';
import { ErpExpense } from '../../../types';

interface ExpenseModalProps {
  showExpenseModal: boolean;
  setShowExpenseModal: (show: boolean) => void;
  expenseForm: Partial<ErpExpense>;
  setExpenseForm: React.Dispatch<React.SetStateAction<Partial<ErpExpense>>>;
  handleSaveExpense: (e: React.FormEvent) => void;
  isSubmitting: boolean;
  showAddCategoryInput: boolean;
  setShowAddCategoryInput: (show: boolean) => void;
  newCategoryName: string;
  setNewCategoryName: (name: string) => void;
  handleSaveNewCategory: () => void;
  customExpenseCategories: string[];
  editingCategoryName: string | null;
  setEditingCategoryName: (name: string | null) => void;
  editCategoryNewValue: string;
  setEditCategoryNewValue: (val: string) => void;
  handleUpdateCustomCategory: (oldVal: string) => void;
  handleDeleteCustomCategory: (cat: string) => void;
  allExpenseCategories: string[];
  DEFAULT_EXPENSE_CATEGORIES: string[];
}

export const ExpenseModal: React.FC<ExpenseModalProps> = ({
  showExpenseModal,
  setShowExpenseModal,
  expenseForm,
  setExpenseForm,
  handleSaveExpense,
  isSubmitting,
  showAddCategoryInput,
  setShowAddCategoryInput,
  newCategoryName,
  setNewCategoryName,
  handleSaveNewCategory,
  customExpenseCategories,
  editingCategoryName,
  setEditingCategoryName,
  editCategoryNewValue,
  setEditCategoryNewValue,
  handleUpdateCustomCategory,
  handleDeleteCustomCategory,
  allExpenseCategories,
  DEFAULT_EXPENSE_CATEGORIES,
}) => {
  if (!showExpenseModal) return null;

  const handleStartEditCategory = (cat: string) => {
    setEditingCategoryName(cat);
    setEditCategoryNewValue(cat);
    setShowAddCategoryInput(false);
  };

  const handleSaveEditedCategory = () => {
    if (editingCategoryName) {
      handleUpdateCustomCategory(editingCategoryName);
    }
  };

  const handleDeleteCategory = (cat: string) => {
    handleDeleteCustomCategory(cat);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-base">Record Operational Expense</h3>
          <button
            type="button"
            onClick={() => {
              setShowExpenseModal(false);
              setShowAddCategoryInput(false);
              setNewCategoryName('');
            }}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSaveExpense} className="space-y-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700">Categories (Grid View)</label>
              <button
                type="button"
                onClick={() => {
                  setShowAddCategoryInput(!showAddCategoryInput);
                  setEditingCategoryName(null);
                }}
                className="text-[11px] font-bold text-indigo-600 hover:text-indigo-700 flex items-center space-x-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{showAddCategoryInput ? 'Close' : '+ New Category'}</span>
              </button>
            </div>

            {/* Add Custom Category Inline Input */}
            {showAddCategoryInput && (
              <div className="p-2.5 bg-indigo-50/70 border border-indigo-200 rounded-xl space-y-2 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-indigo-900">Add New Custom Expense Category</span>
                  <button
                    type="button"
                    onClick={() => setShowAddCategoryInput(false)}
                    className="text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    placeholder="e.g. Clinic Air Condition Service"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    className="flex-1 p-2 text-xs border border-indigo-200 rounded-lg bg-white font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleSaveNewCategory();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleSaveNewCategory}
                    disabled={!newCategoryName.trim()}
                    className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs rounded-lg transition cursor-pointer shadow-2xs whitespace-nowrap"
                  >
                    Save
                  </button>
                </div>
              </div>
            )}

            {/* Edit Category Inline Input */}
            {editingCategoryName && (
              <div className="p-2.5 bg-amber-50/70 border border-amber-200 rounded-xl space-y-2 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-amber-900">
                    Edit Category: <u>{editingCategoryName}</u>
                  </span>
                  <button
                    type="button"
                    onClick={() => setEditingCategoryName(null)}
                    className="text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={editCategoryNewValue}
                    onChange={(e) => setEditCategoryNewValue(e.target.value)}
                    className="flex-1 p-2 text-xs border border-amber-300 rounded-lg bg-white font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleSaveEditedCategory();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleSaveEditedCategory}
                    className="px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-lg transition cursor-pointer shadow-2xs whitespace-nowrap"
                  >
                    Update
                  </button>
                </div>
              </div>
            )}

            {/* Grid View of Categories */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-40 overflow-y-auto p-1.5 bg-slate-50 border border-slate-200 rounded-xl">
              {allExpenseCategories.map((cat) => {
                const isSelected = expenseForm.Category === cat;

                return (
                  <div
                    key={cat}
                    onClick={() => setExpenseForm(prev => ({ ...prev, Category: cat }))}
                    className={`group p-2 rounded-lg border text-[11px] font-bold transition cursor-pointer flex items-center justify-between gap-1 select-none ${
                      isSelected
                        ? 'bg-indigo-600 text-white border-indigo-700 shadow-2xs'
                        : 'bg-white text-slate-800 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/60'
                    }`}
                  >
                    <span className="truncate flex-1">{cat}</span>

                    <div className="flex items-center space-x-0.5 shrink-0">
                      {isSelected && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-white stroke-[2.5]" />
                      )}

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStartEditCategory(cat);
                        }}
                        title={`Edit ${cat}`}
                        className={`p-0.5 rounded transition cursor-pointer ${
                          isSelected
                            ? 'hover:bg-white/20 text-white/90 hover:text-white'
                            : 'hover:bg-slate-200 text-slate-400 hover:text-slate-700'
                        }`}
                      >
                        <Edit className="w-3 h-3" />
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`Delete category "${cat}"?`)) {
                            handleDeleteCategory(cat);
                          }
                        }}
                        title={`Delete ${cat}`}
                        className={`p-0.5 rounded transition cursor-pointer ${
                          isSelected
                            ? 'hover:bg-rose-500/80 text-white/90 hover:text-white'
                            : 'hover:bg-rose-100 text-slate-400 hover:text-rose-600'
                        }`}
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                Selected Category: <strong className="text-indigo-700">{expenseForm.Category}</strong>
              </label>
              <select
                value={expenseForm.Category}
                onChange={e => setExpenseForm({ ...expenseForm, Category: e.target.value })}
                className="w-full mt-0.5 p-1.5 border rounded-lg text-xs bg-white font-bold focus:ring-2 focus:ring-indigo-500 text-slate-700"
              >
                {allExpenseCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-600">Description</label>
            <input
              type="text"
              required
              value={expenseForm.Description}
              onChange={e => setExpenseForm({ ...expenseForm, Description: e.target.value })}
              placeholder=""
              className="w-full mt-1 p-2 border rounded-xl text-xs"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-600">Amount (Rs.)</label>
            <input
              type="number"
              required
              value={expenseForm.Amount || ''}
              onChange={e => setExpenseForm({ ...expenseForm, Amount: Number(e.target.value) })}
              placeholder=""
              className="w-full mt-1 p-2 border rounded-xl text-xs"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-3">
            <button
              type="button"
              onClick={() => setShowExpenseModal(false)}
              className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs"
            >
              Save Expense
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ExpenseModal;
