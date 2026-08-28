import React from 'react';
import {
  Receipt, Search, Calendar, Filter, Plus, Printer,
  ArrowUpRight, ArrowDownRight, DollarSign, X, Trash2
} from 'lucide-react';
import { ErpTransaction } from '../../../types';

interface LedgerTabProps {
  transactions: ErpTransaction[];
  filteredTransactions: ErpTransaction[];
  ledgerSearchTerm: string;
  setLedgerSearchTerm: (val: string) => void;
  ledgerDateMode: 'filtered' | 'all';
  setLedgerDateMode: (val: 'filtered' | 'all') => void;
  cashBookDateFilter: string;
  cashBookStartDate: string;
  cashBookEndDate: string;
  selectedFiscalMonth?: string;
  selectedFiscalYear?: string;
  setShowTxnModal: (show: boolean) => void;
  handlePrintCashBookReport: () => void;
  handleDeleteTxn: (txn: ErpTransaction) => void;
}

export const LedgerTab: React.FC<LedgerTabProps> = ({
  transactions,
  filteredTransactions,
  ledgerSearchTerm,
  setLedgerSearchTerm,
  ledgerDateMode,
  setLedgerDateMode,
  cashBookDateFilter,
  cashBookStartDate,
  cashBookEndDate,
  selectedFiscalMonth = 'all',
  selectedFiscalYear = new Date().getFullYear().toString(),
  setShowTxnModal,
  handlePrintCashBookReport,
  handleDeleteTxn,
}) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-900">General Ledger & Transaction Vouchers</h2>
          <p className="text-xs text-slate-500">Record income receipts, expense vouchers, and bank/cash settlements</p>
        </div>
        <button
          onClick={() => setShowTxnModal(true)}
          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition flex items-center space-x-1.5 self-start cursor-pointer shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Log Financial Voucher</span>
        </button>
      </div>

      {/* Ledger Toolbar with Search and Period Scope Filter */}
      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex flex-col md:flex-row items-center gap-3 justify-between">
        <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full md:w-auto flex-1">
          {/* Search Box */}
          <div className="relative flex-1 w-full sm:min-w-[240px]">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search Txn ID, Category, Description, Method or User..."
              value={ledgerSearchTerm}
              onChange={e => setLedgerSearchTerm(e.target.value)}
              className="w-full pl-9 pr-8 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            />
            {ledgerSearchTerm && (
              <button
                type="button"
                onClick={() => setLedgerSearchTerm('')}
                className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Date Filter Mode Toggle */}
          <div className="inline-flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs shrink-0 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setLedgerDateMode('filtered')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition cursor-pointer ${
                ledgerDateMode === 'filtered'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              📅 Selected Fiscal Scope ({selectedFiscalMonth !== 'all' ? selectedFiscalMonth : selectedFiscalYear})
            </button>
            <button
              type="button"
              onClick={() => setLedgerDateMode('all')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition cursor-pointer ${
                ledgerDateMode === 'all'
                  ? 'bg-slate-800 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              🌐 All History
            </button>
          </div>
        </div>

        {/* Counter Pill */}
        <div className="flex items-center space-x-2 shrink-0 self-end sm:self-auto">
          <span className="text-[11px] font-bold text-slate-600 bg-white border border-slate-200 px-2.5 py-1 rounded-lg">
            Showing: <strong className="text-indigo-700 font-extrabold">{filteredTransactions.length}</strong> / {transactions.length} Vouchers
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
              <th className="p-3">Txn ID</th>
              <th className="p-3">Date</th>
              <th className="p-3">Category</th>
              <th className="p-3">Description</th>
              <th className="p-3">Method</th>
              <th className="p-3">Created By</th>
              <th className="p-3 text-right">Amount</th>
              <th className="p-3 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {filteredTransactions.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-slate-400 font-medium italic">
                  No transaction vouchers found matching the active filters.
                </td>
              </tr>
            ) : (
              filteredTransactions.map((t, idx) => (
                <tr key={idx} className="hover:bg-slate-50">
                  <td className="p-3 font-mono font-bold text-slate-800">{t.TransactionID}</td>
                  <td className="p-3 text-slate-500 whitespace-nowrap">{t.Date}</td>
                  <td className="p-3 font-bold text-slate-900">{t.Category}</td>
                  <td className="p-3 text-slate-600 max-w-xs truncate">{t.Description || 'N/A'}</td>
                  <td className="p-3 text-slate-600 font-bold">{t.PaymentMethod}</td>
                  <td className="p-3 text-slate-500">{t.CreatedBy}</td>
                  <td className={`p-3 text-right font-black ${
                    t.Type === 'Income' ? 'text-emerald-600' : 'text-slate-900'
                  }`}>
                    Rs. {(t.Amount || 0).toLocaleString()}
                  </td>
                  <td className="p-3 text-center">
                    <button
                      onClick={() => handleDeleteTxn(t)}
                      className="p-1 text-rose-600 hover:bg-rose-50 rounded transition cursor-pointer"
                      title="Delete Txn"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LedgerTab;
