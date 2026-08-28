import React from 'react';
import { Building2, X, Pencil, Save, RefreshCw, PhoneCall } from 'lucide-react';
import { ErpVendor } from '../../../types';

interface RegisterEditVendorModalProps {
  showVendorModal: boolean;
  setShowVendorModal: (show: boolean) => void;
  editingVendor: ErpVendor | null;
  setEditingVendor: (v: ErpVendor | null) => void;
  vendorForm: Partial<ErpVendor>;
  setVendorForm: (form: any) => void;
  handleSaveVendor: (e: React.FormEvent) => void;
  isSubmitting: boolean;
  vendors: ErpVendor[];
  handleOpenEditVendor: (v: ErpVendor) => void;
}

export const RegisterEditVendorModal: React.FC<RegisterEditVendorModalProps> = ({
  showVendorModal,
  setShowVendorModal,
  editingVendor,
  setEditingVendor,
  vendorForm,
  setVendorForm,
  handleSaveVendor,
  isSubmitting,
  vendors,
  handleOpenEditVendor,
}) => {
  if (!showVendorModal) return null;
  return (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-150 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className={`p-2 rounded-xl border ${editingVendor ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-indigo-50 border-indigo-200 text-indigo-600'}`}>
                  {editingVendor ? <Pencil className="w-5 h-5" /> : <Building2 className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm md:text-base flex items-center space-x-1.5">
                    <span>{editingVendor ? 'Edit Supplier / Vendor Record' : 'Register New Supplier Vendor'}</span>
                  </h3>
                  <p className="text-xxs text-slate-500 font-medium">
                    {editingVendor
                      ? 'Update vendor name, mobile/phone, & specs. Existing Supplier ID remains locked and intact.'
                      : 'Create a new pharmaceutical distributor & accounts payable profile'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowVendorModal(false);
                  setEditingVendor(null);
                }}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* If Editing and multiple vendors exist: Quick Switcher Dropdown */}
            {editingVendor && vendors.length > 1 && (
              <div className="bg-blue-50/70 p-2.5 rounded-xl border border-blue-200 space-y-1">
                <label className="text-[10px] font-bold text-blue-900 uppercase tracking-wider flex items-center justify-between">
                  <span>Switch Supplier To Edit</span>
                  <span className="text-[10px] font-semibold text-blue-700 font-mono">ID: {editingVendor.VendorID}</span>
                </label>
                <select
                  value={editingVendor.VendorID || editingVendor._id}
                  onChange={(e) => {
                    const chosen = vendors.find(v => (v.VendorID === e.target.value || v._id === e.target.value));
                    if (chosen) handleOpenEditVendor(chosen);
                  }}
                  className="w-full p-2 bg-white border border-blue-300 rounded-lg text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
                >
                  {vendors.map(v => (
                    <option key={v.VendorID || v._id} value={v.VendorID || v._id}>
                      {v.VendorName} (ID: {v.VendorID}) {v.Phone ? `• 📞 ${v.Phone}` : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <form onSubmit={handleSaveVendor} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-1">
                  <label className="text-xxs font-bold text-slate-600 uppercase tracking-wide flex items-center justify-between">
                    <span>Supplier ID</span>
                    <span className="text-[9px] text-amber-700 bg-amber-100 px-1 py-0.5 rounded font-bold">Locked / Intact</span>
                  </label>
                  <div className="relative mt-1">
                    <input
                      type="text"
                      disabled
                      value={vendorForm.VendorID || (editingVendor ? editingVendor.VendorID : 'Auto Generated')}
                      title="Existing Supplier ID is kept strictly intact to preserve PO and ledger history"
                      className="w-full p-2.5 pl-7 border border-slate-200 bg-slate-100 text-slate-700 rounded-xl text-xs font-mono font-bold cursor-not-allowed select-none"
                    />
                    <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-3" />
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xxs font-bold text-slate-700 uppercase tracking-wide flex items-center justify-between">
                    <span>Vendor / Company Name <span className="text-rose-500">*</span></span>
                    {editingVendor && <span className="text-[10px] text-blue-600 font-semibold">Editable</span>}
                  </label>
                  <input
                    type="text"
                    required
                    value={vendorForm.VendorName || ''}
                    onChange={e => setVendorForm({ ...vendorForm, VendorName: e.target.value })}
                    placeholder="e.g. High-Tech Pharma Distributors Ltd"
                    className="w-full mt-1 p-2.5 border border-slate-300 bg-white rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none shadow-2xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xxs font-bold text-slate-700 uppercase tracking-wide">Contact Person / Rep</label>
                  <input
                    type="text"
                    value={vendorForm.ContactPerson || ''}
                    onChange={e => setVendorForm({ ...vendorForm, ContactPerson: e.target.value })}
                    placeholder="e.g. Mr. Tariq Mahmood"
                    className="w-full mt-1 p-2.5 border border-slate-200 bg-white rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="text-xxs font-bold text-slate-700 uppercase tracking-wide flex items-center justify-between">
                    <span>Mobile / Phone Number <span className="text-rose-500">*</span></span>
                    {editingVendor && <span className="text-[10px] text-blue-600 font-semibold">Editable</span>}
                  </label>
                  <div className="relative mt-1">
                    <input
                      type="text"
                      required
                      value={vendorForm.Phone || ''}
                      onChange={e => setVendorForm({ ...vendorForm, Phone: e.target.value })}
                      placeholder="e.g. 0300-1234567 / 042-35889900"
                      className="w-full p-2.5 pl-8 border border-slate-300 bg-white rounded-xl text-xs font-mono font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none shadow-2xs"
                    />
                    <PhoneCall className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xxs font-bold text-slate-700 uppercase tracking-wide">Tax NTN ID</label>
                  <input
                    type="text"
                    value={vendorForm.TaxID || ''}
                    onChange={e => setVendorForm({ ...vendorForm, TaxID: e.target.value })}
                    placeholder="e.g. 1234567-8"
                    className="w-full mt-1 p-2.5 border border-slate-200 bg-white rounded-xl text-xs font-mono text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="text-xxs font-bold text-slate-700 uppercase tracking-wide">Email Address</label>
                  <input
                    type="email"
                    value={vendorForm.Email || ''}
                    onChange={e => setVendorForm({ ...vendorForm, Email: e.target.value })}
                    placeholder="e.g. sales@hightechpharma.pk"
                    className="w-full mt-1 p-2.5 border border-slate-200 bg-white rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xxs font-bold text-slate-700 uppercase tracking-wide">Corporate / Warehouse Address</label>
                <input
                  type="text"
                  value={vendorForm.Address || ''}
                  onChange={e => setVendorForm({ ...vendorForm, Address: e.target.value })}
                  placeholder="e.g. Plot 14-B, Industrial Area, Kot Lakhpat, Lahore"
                  className="w-full mt-1 p-2.5 border border-slate-200 bg-white rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xxs font-bold text-slate-700 uppercase tracking-wide">Account Status</label>
                  <select
                    value={vendorForm.Status || 'Active'}
                    onChange={e => setVendorForm({ ...vendorForm, Status: e.target.value as any })}
                    className="w-full mt-1 p-2.5 border border-slate-200 bg-white rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  >
                    <option value="Active">Active Supplier</option>
                    <option value="Inactive">Inactive / Suspended</option>
                  </select>
                </div>
                <div>
                  <label className="text-xxs font-bold text-slate-700 uppercase tracking-wide">Outstanding Balance (Rs.)</label>
                  <input
                    type="number"
                    value={vendorForm.Balance ?? 0}
                    onChange={e => setVendorForm({ ...vendorForm, Balance: Number(e.target.value) || 0 })}
                    placeholder="0"
                    className="w-full mt-1 p-2.5 border border-slate-200 bg-white rounded-xl text-xs font-mono font-bold text-amber-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowVendorModal(false);
                    setEditingVendor(null);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`px-5 py-2.5 rounded-xl text-white font-bold text-xs transition flex items-center space-x-2 cursor-pointer shadow-md disabled:opacity-50 ${
                    editingVendor
                      ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/20'
                      : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20'
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-white" />
                      <span>Saving Data...</span>
                    </>
                  ) : (
                    <>
                      {editingVendor ? <Pencil className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                      <span>{editingVendor ? 'Update Supplier Record' : 'Save Supplier'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
  );
};

export default RegisterEditVendorModal;
