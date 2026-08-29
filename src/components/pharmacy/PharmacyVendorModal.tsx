/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Supplier } from '../../types';
import {
  Database,
  Truck,
  X,
  Plus,
  Save,
  Trash2,
  Building,
  Phone,
  MapPin,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface PharmacyVendorModalProps {
  vendorSuccessMsg?: string;
  vendorErrorMsg?: string;
  editingSupplier?: Supplier | null;
  isVendorModalOpen: boolean;
  setIsVendorModalOpen: (open: boolean) => void;
  suppliers: Supplier[];
  supplierFormId: string;
  setSupplierFormId: (v: string) => void;
  supplierFormName: string;
  setSupplierFormName: (v: string) => void;
  supplierFormPhone: string;
  setSupplierFormPhone: (v: string) => void;
  supplierFormCompany: string;
  setSupplierFormCompany: (v: string) => void;
  supplierFormAddress: string;
  setSupplierFormAddress: (v: string) => void;
  isEditingSupplier: boolean;
  editingSupplierSid: string | null;
  handleSaveSupplier: (e: React.FormEvent) => void;
  handleDeleteSupplier: (sid: string) => void;
  handleSelectEditSupplier: (sup: Supplier) => void;
  resetSupplierForm: () => void;
}

export const PharmacyVendorModal: React.FC<PharmacyVendorModalProps> = ({
  isVendorModalOpen,
  setIsVendorModalOpen,
  suppliers,
  supplierFormId,
  setSupplierFormId,
  supplierFormName,
  setSupplierFormName,
  supplierFormPhone,
  setSupplierFormPhone,
  supplierFormCompany,
  setSupplierFormCompany,
  supplierFormAddress,
  setSupplierFormAddress,
  isEditingSupplier,
  editingSupplierSid,
  handleSaveSupplier,
  handleDeleteSupplier,
  handleSelectEditSupplier,
  resetSupplierForm,
  vendorSuccessMsg = "",
  vendorErrorMsg = "",
  editingSupplier = null
}) => {
  if (!isVendorModalOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 animate-fadeIn font-sans" id="vendor-directory-modal">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-150 flex items-center justify-between bg-slate-50 shrink-0">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-950">Supplier & Vendor Registry</h3>
                  <p className="text-[11px] text-slate-500 font-medium">Manage and register active pharmaceutical supply partners</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsVendorModalOpen(false);
                  resetSupplierForm();
                }}
                className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-100 rounded-full transition cursor-pointer font-bold"
              >
                ✕
              </button>
            </div>

            {/* Modal Content - Split layout */}
            <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-12 gap-6">
              
              {/* Left Column: Form to Add/Edit (5 cols) */}
              <div className="md:col-span-5 bg-slate-50 p-5 rounded-2xl border border-slate-200 h-fit space-y-4">
                <div className="flex items-center justify-between border-b border-slate-150 pb-2">
                  <h4 className="text-xs font-bold text-slate-900 uppercase">
                    {editingSupplier ? '✏️ Modify Vendor Specifications' : '➕ Register New Vendor'}
                  </h4>
                  {editingSupplier && (
                    <button
                      type="button"
                      onClick={resetSupplierForm}
                      className="text-[10px] font-bold text-blue-600 hover:text-blue-800 transition uppercase"
                    >
                      New Vendor
                    </button>
                  )}
                </div>

                {vendorSuccessMsg && (
                  <div className="p-2.5 bg-emerald-50 border border-emerald-100 text-emerald-700 text-xxs font-bold rounded-lg">
                    ✅ {vendorSuccessMsg}
                  </div>
                )}

                {vendorErrorMsg && (
                  <div className="p-2.5 bg-rose-50 border border-rose-100 text-rose-700 text-xxs font-bold rounded-lg">
                    ⚠️ {vendorErrorMsg}
                  </div>
                )}

                <form onSubmit={handleSaveSupplier} className="space-y-3 text-xs">
                  <div>
                    <label className="block text-xxs font-bold text-slate-500 uppercase">Vendor/Supplier ID</label>
                    <input
                      type="text"
                      placeholder=""
                      disabled={!!editingSupplier}
                      value={supplierFormId}
                      onChange={(e) => setSupplierFormId(e.target.value)}
                      className={`mt-1 w-full text-xs border rounded-lg p-2 focus:ring-1 focus:ring-emerald-500 focus:outline-none font-mono ${
                        editingSupplier ? 'bg-slate-100 border-slate-200 text-slate-500 cursor-not-allowed font-bold' : 'bg-white border-slate-200'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-xxs font-bold text-slate-500 uppercase">Vendor Name *</label>
                    <input
                      type="text"
                      required
                      placeholder=""
                      value={supplierFormName}
                      onChange={(e) => setSupplierFormName(e.target.value)}
                      className="mt-1 w-full text-xs border border-slate-200 bg-white rounded-lg p-2 focus:ring-1 focus:ring-emerald-500 focus:outline-none font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-xxs font-bold text-slate-500 uppercase">Contact Phone</label>
                    <input
                      type="text"
                      placeholder=""
                      value={supplierFormPhone}
                      onChange={(e) => setSupplierFormPhone(e.target.value)}
                      className="mt-1 w-full text-xs border border-slate-200 bg-white rounded-lg p-2 focus:ring-1 focus:ring-emerald-500 focus:outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xxs font-bold text-slate-500 uppercase">Corporate Address</label>
                    <textarea
                      rows={2}
                      placeholder=""
                      value={supplierFormAddress}
                      onChange={(e) => setSupplierFormAddress(e.target.value)}
                      className="mt-1 w-full text-xs border border-slate-200 bg-white rounded-lg p-2 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-md hover:shadow-emerald-600/10 transition text-xs cursor-pointer"
                  >
                    {editingSupplier ? 'Update Supplier' : 'Save Supplier'}
                  </button>

                  {editingSupplier && (
                    <button
                      type="button"
                      onClick={resetSupplierForm}
                      className="w-full py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold rounded-lg transition text-xs cursor-pointer"
                    >
                      Cancel Editing
                    </button>
                  )}
                </form>
              </div>

              {/* Right Column: Interactive Grid View (7 cols) */}
              <div className="md:col-span-7 flex flex-col h-[420px]">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">
                  Supplier Directory Grid-View ({suppliers.length})
                </h4>
                
                <div className="flex-1 overflow-y-auto border border-slate-150 rounded-2xl bg-white">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="sticky top-0 bg-slate-50 border-b border-slate-150 z-10">
                      <tr className="text-slate-400 uppercase text-xxs font-bold">
                        <th className="p-3">ID</th>
                        <th className="p-3">Vendor Name</th>
                        <th className="p-3">Phone</th>
                        <th className="p-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                      {suppliers.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="p-8 text-center text-slate-400 font-semibold">
                            No vendors registered in directory.
                          </td>
                        </tr>
                      ) : (
                        suppliers.map((sup) => (
                          <tr key={sup.SID} className="hover:bg-slate-50/50">
                            <td className="p-3 font-mono text-xxs font-bold text-slate-400">{sup.SID}</td>
                            <td className="p-3">
                              <span className="font-bold text-slate-900 block text-xs">{sup.SupplierName}</span>
                              <span className="text-[10px] text-slate-400 block max-w-xs truncate font-normal" title={sup.Address}>
                                {sup.Address || 'No Address'}
                              </span>
                            </td>
                            <td className="p-3 font-mono text-slate-600 text-[11px]">{sup.Phone || 'N/A'}</td>
                            <td className="p-3 text-right space-x-1 whitespace-nowrap">
                              <button
                                type="button"
                                onClick={() => handleSelectEditSupplier(sup)}
                                className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 hover:text-blue-800 text-[10px] font-bold rounded transition cursor-pointer"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteSupplier(sup.SID)}
                                className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-700 text-[10px] font-bold rounded transition cursor-pointer"
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-150 bg-slate-50 flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => {
                  setIsVendorModalOpen(false);
                  resetSupplierForm();
                }}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-lg transition cursor-pointer"
              >
                Close Directory
              </button>
            </div>

          </div>
        </div>
  );
};

export default PharmacyVendorModal;
