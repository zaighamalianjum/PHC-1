import React from 'react';
import { AlertTriangle, X, CheckCircle2 } from 'lucide-react';

interface UnmatchedCategoryDialogProps {
  unmatchedCategoryDialog: {
    isOpen: boolean;
    unmatchedList: Array<{
      category: string;
      itemCount: number;
      action: 'add_new' | 'map';
      targetCategory?: string;
    }>;
    context?: 'po' | 'grn';
    parsedRows?: any[];
    targetPoId?: string;
  } | null;
  setUnmatchedCategoryDialog: React.Dispatch<React.SetStateAction<any>>;
  medicineCategories: string[];
  handleResolveUnmatchedCategories?: () => void;
  handleConfirmUnmatchedCategories?: () => void;
}

export const UnmatchedCategoryDialog: React.FC<UnmatchedCategoryDialogProps> = ({
  unmatchedCategoryDialog,
  setUnmatchedCategoryDialog,
  medicineCategories,
  handleResolveUnmatchedCategories,
  handleConfirmUnmatchedCategories,
}) => {
  if (!unmatchedCategoryDialog?.isOpen) return null;

  const onResolve = handleResolveUnmatchedCategories || handleConfirmUnmatchedCategories || (() => setUnmatchedCategoryDialog(null));

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 z-[90] animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-amber-300 space-y-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-700 font-black text-xl shrink-0">
              ⚠️
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base flex items-center space-x-2">
                <span>Unmatched Categories Detected</span>
                <span className="px-2 py-0.5 rounded-full text-xs font-black bg-amber-100 text-amber-900 border border-amber-300">
                  {unmatchedCategoryDialog.unmatchedList.length} Categories
                </span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                The following categories were found in your Excel/Paste data but do not exist in the system. Choose to add them as new categories or map them to existing categories.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setUnmatchedCategoryDialog(null)}
            className="text-slate-400 hover:text-slate-700 text-xl font-bold leading-none p-1 rounded-lg cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Categories List */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {unmatchedCategoryDialog.unmatchedList.map((item, idx) => (
            <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-xs font-black text-slate-900 bg-white px-2 py-1 border border-slate-200 rounded-md">
                    {item.category}
                  </span>
                  <span className="text-[11px] text-slate-500 font-bold">
                    ({item.itemCount} items)
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                <label className={`flex items-center space-x-2 p-2 rounded-lg border cursor-pointer text-xs font-bold ${
                  item.action === 'add_new' ? 'bg-emerald-50 border-emerald-300 text-emerald-900' : 'bg-white border-slate-200 text-slate-700'
                }`}>
                  <input
                    type="radio"
                    name={`action-${idx}`}
                    checked={item.action === 'add_new'}
                    onChange={() => {
                      setUnmatchedCategoryDialog((prev: any) => {
                        if (!prev) return null;
                        const nextList = [...prev.unmatchedList];
                        nextList[idx] = { ...nextList[idx], action: 'add_new' };
                        return { ...prev, unmatchedList: nextList };
                      });
                    }}
                    className="text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Create as New Category</span>
                </label>

                <div className="space-y-1">
                  <label className={`flex items-center space-x-2 p-2 rounded-lg border cursor-pointer text-xs font-bold ${
                    item.action === 'map' ? 'bg-indigo-50 border-indigo-300 text-indigo-900' : 'bg-white border-slate-200 text-slate-700'
                  }`}>
                    <input
                      type="radio"
                      name={`action-${idx}`}
                      checked={item.action === 'map'}
                      onChange={() => {
                        setUnmatchedCategoryDialog((prev: any) => {
                          if (!prev) return null;
                          const nextList = [...prev.unmatchedList];
                          nextList[idx] = { ...nextList[idx], action: 'map', targetCategory: medicineCategories[0] || '' };
                          return { ...prev, unmatchedList: nextList };
                        });
                      }}
                      className="text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Map to Existing Category</span>
                  </label>

                  {item.action === 'map' && (
                    <select
                      value={item.targetCategory || medicineCategories[0] || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        setUnmatchedCategoryDialog((prev: any) => {
                          if (!prev) return null;
                          const nextList = [...prev.unmatchedList];
                          nextList[idx] = { ...nextList[idx], targetCategory: val };
                          return { ...prev, unmatchedList: nextList };
                        });
                      }}
                      className="w-full p-2 bg-white border border-indigo-300 rounded-lg text-xs font-bold text-slate-800"
                    >
                      {medicineCategories.map((c, cIdx) => (
                        <option key={cIdx} value={c}>{c}</option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={() => setUnmatchedCategoryDialog(null)}
            className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onResolve}
            className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md transition flex items-center space-x-1.5 cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Apply Categories & Continue</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default UnmatchedCategoryDialog;
