import React from 'react';
import {
  Building2, Search, Filter, Plus, Edit, Trash2,
  FileSpreadsheet, CreditCard, Receipt, Printer,
  History, Pencil, Eye, Coins, DollarSign, Boxes, FileText
} from 'lucide-react';
import { ErpVendor, ErpPurchaseOrder } from '../../../types';

interface VendorsTabProps {
  vendors: ErpVendor[];
  searchTerm: string;
  setSearchTerm: (val: string) => void;
  filterCategory: string;
  setFilterCategory: (val: string) => void;
  handleOpenAddVendor: () => void;
  handleOpenEditVendor: (v: ErpVendor) => void;
  handleDeleteVendor: (v: ErpVendor) => void;
  handleOpenNewPoModal: (targetVendor?: ErpVendor) => void;
  handleOpenGrnForPo: () => void;
  setSelectedVendorId: (id: string) => void;
  setActiveTab: (tab: any) => void;
  setVendorPoModalData: (v: ErpVendor) => void;
  setPoHistoryFilterPo: (val: string) => void;
  setPoHistoryModalData: (data: any) => void;
  setPayVendorModalData: (data: any) => void;
  handlePrintVendorStatement: (targetVendor?: ErpVendor) => void;
  purchaseOrders?: ErpPurchaseOrder[];
  setHistoryVendorFilter?: (val: string) => void;
  setHistoryStartDate?: (val: string) => void;
  setHistoryEndDate?: (val: string) => void;
  setShowPaymentHistoryModal?: (show: boolean) => void;
  handleOpenEditVendorTop?: () => void;
  handlePayVendor?: (v: ErpVendor) => void;
}

export const VendorsTab: React.FC<VendorsTabProps> = ({
  vendors,
  searchTerm,
  setSearchTerm,
  filterCategory,
  setFilterCategory,
  handleOpenAddVendor,
  handleOpenEditVendor,
  handleDeleteVendor,
  handleOpenNewPoModal,
  handleOpenGrnForPo,
  setSelectedVendorId,
  setActiveTab,
  setVendorPoModalData,
  setPoHistoryFilterPo,
  setPoHistoryModalData,
  setPayVendorModalData,
  handlePrintVendorStatement,
  purchaseOrders = [],
  setHistoryVendorFilter = (_val?: any) => {},
  setHistoryStartDate = (_val?: any) => {},
  setHistoryEndDate = (_val?: any) => {},
  setShowPaymentHistoryModal = (_show?: any) => {},
  handleOpenEditVendorTop = () => {},
  handlePayVendor = (_v?: any) => {},
}) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-900">Distributors & Vendors Directory</h2>
          <p className="text-xs text-slate-500">Manage pharmaceutical suppliers, tax IDs, and outstanding balances</p>
        </div>
        <div className="flex items-center space-x-2.5 self-start flex-wrap gap-y-2">
          <button
            type="button"
            onClick={() => {
              setHistoryVendorFilter('ALL');
              setHistoryStartDate('');
              setHistoryEndDate('');
              setShowPaymentHistoryModal(true);
            }}
            className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition flex items-center space-x-1.5 cursor-pointer shadow-xs"
            title="View complete vendor payment history & settlement log"
          >
            <History className="w-4 h-4" />
            <span>Payment & Settlement History</span>
          </button>
          <button
            type="button"
            onClick={handleOpenEditVendorTop}
            disabled={vendors.length === 0}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition flex items-center space-x-1.5 cursor-pointer shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
            title="Edit existing supplier/vendor records (Name, Mobile, Address) while keeping SupplierID intact"
          >
            <Pencil className="w-4 h-4" />
            <span>Edit Vendor Info</span>
          </button>
          <button
            type="button"
            onClick={handleOpenAddVendor}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition flex items-center space-x-1.5 cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Register Vendor</span>
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-700 uppercase font-bold text-[10px] tracking-wider border-y">
            <tr>
              <th className="p-3">Vendor / Company</th>
              <th className="p-3">Contact Person</th>
              <th className="p-3">Phone & Address</th>
              <th className="p-3">Tax / NTN</th>
              <th className="p-3 text-right">Outstanding Balance</th>
              <th className="p-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {vendors.map((v, idx) => {
              const outstanding = v.Balance || 0;
              const vPos = purchaseOrders.filter(po => 
                (po.VendorID && po.VendorID === v.VendorID) || 
                (po.VendorName && po.VendorName.toLowerCase() === v.VendorName.toLowerCase())
              );
              return (
                <tr key={idx} className="hover:bg-slate-50/80 transition">
                  <td className="p-3">
                    <div className="font-bold text-slate-900 flex items-center space-x-2">
                      <span className="font-mono text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200">
                        {v.VendorID || 'N/A'}
                      </span>
                      <span>{v.VendorName}</span>
                    </div>
                  </td>
                  <td className="p-3 text-slate-600">{v.ContactPerson || '-'}</td>
                  <td className="p-3 text-slate-600">
                    <div>{v.Phone || '-'}</div>
                    <div className="text-[10px] text-slate-400 truncate max-w-xs">{v.Address}</div>
                  </td>
                  <td className="p-3 text-slate-600 font-mono">{v.TaxID || '-'}</td>
                  <td className="p-3 text-right font-mono font-bold">
                    <span className={outstanding > 0 ? 'text-amber-700 bg-amber-50 px-2 py-1 rounded-lg border border-amber-200' : 'text-slate-700'}>
                      Rs. {(outstanding || 0).toLocaleString()}
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    <div className="flex items-center justify-center space-x-1.5 flex-wrap gap-y-1">
                      <button
                        type="button"
                        onClick={() => handleOpenNewPoModal(v)}
                        className="px-2.5 py-1 text-[11px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded border border-indigo-200 transition cursor-pointer flex items-center space-x-1 shadow-2xs"
                        title="Create New Purchase Order for this Supplier"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Create PO</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenEditVendor(v)}
                        className="px-2.5 py-1 text-[11px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded border border-blue-200 transition cursor-pointer flex items-center space-x-1 shadow-2xs"
                        title="Edit Vendor Name, Mobile/Phone, Address, and Specifications"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => {
                          setSelectedVendorId(v.VendorID || v._id || '');
                          setActiveTab('vendor_statement');
                        }}
                        className="px-2.5 py-1 text-[11px] font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded border border-amber-200 transition cursor-pointer flex items-center space-x-1 shadow-2xs"
                        title="View detailed Vendor Account Statement & Payable Ledger"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>View Statement</span>
                      </button>
                      <button
                        onClick={() => setVendorPoModalData(v)}
                        className="px-2.5 py-1 text-[11px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded border border-indigo-200 transition cursor-pointer flex items-center space-x-1 shadow-2xs"
                        title="View all Purchase Orders for this vendor"
                      >
                        <Boxes className="w-3.5 h-3.5" />
                        <span>View PO</span>
                      </button>
                      <button
                        onClick={() => handlePayVendor(v)}
                        className="px-2.5 py-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded border border-emerald-200 transition cursor-pointer flex items-center space-x-1 shadow-2xs"
                        title="Pay vendor bill & clear Accounts Payable"
                      >
                        <Coins className="w-3.5 h-3.5" />
                        <span>Pay Bill</span>
                      </button>
                      <button
                        onClick={() => handleDeleteVendor(v)}
                        className="p-1 text-rose-600 hover:bg-rose-50 rounded transition cursor-pointer"
                        title="Delete Vendor"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default VendorsTab;
