import React from 'react';
import {
  Receipt, Boxes, Plus, DollarSign, Trash2
} from 'lucide-react';
import { ErpExpense, ErpAsset } from '../../../types';

interface ExpensesAssetsTabProps {
  expenses: ErpExpense[];
  assets: ErpAsset[];
  setShowExpenseModal: (show: boolean) => void;
  setShowAssetModal: (show: boolean) => void;
  setExpenseForm: (val: any) => void;
  setAssetForm: (val: any) => void;
  handleDeleteExpense: (exp: ErpExpense) => void;
  handleDeleteAsset: (ast: ErpAsset) => void;
}

export const ExpensesAssetsTab: React.FC<ExpensesAssetsTabProps> = ({
  expenses,
  assets,
  setShowExpenseModal,
  setShowAssetModal,
  setExpenseForm,
  setAssetForm,
  handleDeleteExpense,
  handleDeleteAsset,
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* OPERATIONAL EXPENSES */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Operational Expenses Tracker</h3>
            <p className="text-xs text-slate-500">Utilities, Rent, Refreshments & Maintenance</p>
          </div>
          <button
            onClick={() => setShowExpenseModal(true)}
            className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition flex items-center space-x-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Expense</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                <th className="p-2.5">Date</th>
                <th className="p-2.5">Category</th>
                <th className="p-2.5">Description</th>
                <th className="p-2.5 text-right">Amount</th>
                <th className="p-2.5 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {expenses.map((exp, idx) => (
                <tr key={idx} className="hover:bg-slate-50">
                  <td className="p-2.5 text-slate-500 whitespace-nowrap">{exp.ExpenseDate}</td>
                  <td className="p-2.5 font-bold text-slate-800">{exp.Category}</td>
                  <td className="p-2.5 text-slate-600 max-w-xs truncate">{exp.Description}</td>
                  <td className="p-2.5 text-right font-black text-rose-600">Rs. {(exp.Amount || 0).toLocaleString()}</td>
                  <td className="p-2.5 text-center">
                    <button
                      onClick={() => handleDeleteExpense(exp)}
                      className="p-1 text-rose-600 hover:bg-rose-50 rounded transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* FIXED ASSETS REGISTER */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Fixed Asset Register</h3>
            <p className="text-xs text-slate-500">Refrigerators, POS hardware, Furniture & Equipment</p>
          </div>
          <button
            onClick={() => setShowAssetModal(true)}
            className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition flex items-center space-x-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Asset</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                <th className="p-2.5">Asset Name</th>
                <th className="p-2.5">Category</th>
                <th className="p-2.5 text-right">Cost</th>
                <th className="p-2.5 text-right">Current Value</th>
                <th className="p-2.5 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {assets.map((ast, idx) => (
                <tr key={idx} className="hover:bg-slate-50">
                  <td className="p-2.5 font-bold text-slate-900">{ast.AssetName}</td>
                  <td className="p-2.5 text-slate-600">{ast.Category}</td>
                  <td className="p-2.5 text-right text-slate-500">Rs. {(ast.PurchaseCost || 0).toLocaleString()}</td>
                  <td className="p-2.5 text-right font-black text-indigo-600">Rs. {(ast.CurrentValue || 0).toLocaleString()}</td>
                  <td className="p-2.5 text-center">
                    <button
                      onClick={() => handleDeleteAsset(ast)}
                      className="p-1 text-rose-600 hover:bg-rose-50 rounded transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ExpensesAssetsTab;
