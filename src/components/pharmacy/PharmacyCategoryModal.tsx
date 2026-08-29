/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Item } from '../../types';
import {
  Tag,
  Edit,
  X,
  CheckCircle,
  AlertCircle,
  Plus,
  Save,
  Trash2,
  Layers,
  Edit2
} from 'lucide-react';

interface PharmacyCategoryModalProps {
  isCategoryModalOpen: boolean;
  setIsCategoryModalOpen: (open: boolean) => void;
  setEditingCatIndex: (idx: number | null) => void;
  setCatErrorMsg: (msg: string) => void;
  setCatSuccessMsg: (msg: string) => void;
  catSuccessMsg: string;
  catErrorMsg: string;
  handleAddCategory: (e: React.FormEvent) => void;
  handleEditCategory: (index: number) => void;
  handleDeleteCategory: (catName: string) => void;
  newCategoryName: string;
  setNewCategoryName: (v: string) => void;
  editingCatIndex: number | null;
  editingCatName: string;
  setEditingCatName: (v: string) => void;
  medicineCategories: string[];
  items: Item[];
}

export const PharmacyCategoryModal: React.FC<PharmacyCategoryModalProps> = ({
  isCategoryModalOpen,
  setIsCategoryModalOpen,
  setEditingCatIndex,
  setCatErrorMsg,
  setCatSuccessMsg,
  catSuccessMsg,
  catErrorMsg,
  handleAddCategory,
  handleEditCategory,
  handleDeleteCategory,
  newCategoryName,
  setNewCategoryName,
  editingCatIndex,
  editingCatName,
  setEditingCatName,
  medicineCategories,
  items
}) => {
  if (!isCategoryModalOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-4 bg-slate-900 text-white flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <Tag className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="text-base font-bold text-white">Medicine Category Manager</h3>
                  <p className="text-[11px] text-slate-300 font-medium">Add, Edit, Rename or Remove Medicine Categories</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsCategoryModalOpen(false);
                  setEditingCatIndex(null);
                  setCatErrorMsg('');
                  setCatSuccessMsg('');
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 overflow-y-auto flex-1">
              {/* Feedback messages */}
              {catSuccessMsg && (
                <div className="p-2.5 bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs rounded-lg font-bold flex items-center">
                  <CheckCircle className="w-4 h-4 text-emerald-600 mr-2 shrink-0" />
                  {catSuccessMsg}
                </div>
              )}
              {catErrorMsg && (
                <div className="p-2.5 bg-red-50 text-red-800 border border-red-200 text-xs rounded-lg font-bold flex items-center">
                  <AlertCircle className="w-4 h-4 text-red-600 mr-2 shrink-0" />
                  {catErrorMsg}
                </div>
              )}

              {/* Add New Category Form */}
              <form onSubmit={handleAddCategory} className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wide">
                  Add New Category
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder=""
                    className="flex-1 px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold bg-white text-slate-900"
                  />
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition cursor-pointer flex items-center shadow-xs shrink-0"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    <span>Add Category</span>
                  </button>
                </div>
              </form>

              {/* Categories List */}
              <div className="space-y-2">
                <div className="flex justify-between items-center px-1">
                  <span className="text-xs font-black text-slate-700 uppercase tracking-wider">
                    Existing Categories ({medicineCategories.length})
                  </span>
                  <button
                    type="button"
                    onClick={() => {}}
                    className="text-[10px] font-bold text-slate-500 hover:text-indigo-600 underline cursor-pointer"
                  >
                    Reset to Defaults
                  </button>
                </div>

                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-white max-h-[300px] overflow-y-auto">
                  {medicineCategories.map((cat, idx) => {
                    const itemCount = items.filter(itm => (itm.Unit || '').toLowerCase().trim() === cat.toLowerCase().trim()).length;
                    const isEditing = editingCatIndex === idx;

                    return (
                      <div key={idx} className="p-2.5 flex items-center justify-between hover:bg-slate-50/80 transition">
                        {isEditing ? (
                          <div className="flex items-center space-x-2 w-full">
                            <input
                              type="text"
                              value={editingCatName}
                              onChange={(e) => setEditingCatName(e.target.value)}
                              className="flex-1 px-2 py-1 text-xs border border-indigo-400 rounded focus:outline-none font-bold text-slate-900 bg-indigo-50/50"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleEditCategory(idx);
                                if (e.key === 'Escape') setEditingCatIndex(null);
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => handleEditCategory(idx)}
                              className="px-2.5 py-1 bg-indigo-600 text-white font-bold text-xs rounded hover:bg-indigo-700 cursor-pointer"
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingCatIndex(null)}
                              className="px-2 py-1 bg-slate-200 text-slate-700 font-bold text-xs rounded hover:bg-slate-300 cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center space-x-2 truncate">
                              <span className="text-xs font-extrabold text-slate-800">{cat}</span>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-100 text-slate-600">
                                {itemCount} {itemCount === 1 ? 'item' : 'items'}
                              </span>
                            </div>

                            <div className="flex items-center space-x-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingCatIndex(idx);
                                  setEditingCatName(cat);
                                }}
                                className="p-1 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded transition cursor-pointer"
                                title="Edit / Rename Category"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteCategory(medicineCategories[idx])}
                                className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition cursor-pointer"
                                title="Delete Category"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setIsCategoryModalOpen(false);
                  setEditingCatIndex(null);
                  setCatErrorMsg('');
                  setCatSuccessMsg('');
                }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl transition cursor-pointer shadow-xs"
              >
                Done
              </button>
            </div>
          </div>
        </div>
  );
};

export default PharmacyCategoryModal;
