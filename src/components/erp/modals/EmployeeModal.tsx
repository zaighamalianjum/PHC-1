import React from 'react';
import { UserPlus, X } from 'lucide-react';
import { ErpEmployee } from '../../../types';

interface EmployeeModalProps {
  showEmpModal: boolean;
  setShowEmpModal: (show: boolean) => void;
  empForm: Partial<ErpEmployee>;
  setEmpForm: (form: any) => void;
  handleSaveEmployee: (e: React.FormEvent) => void;
  isSubmitting: boolean;
}

export const EmployeeModal: React.FC<EmployeeModalProps> = ({
  showEmpModal,
  setShowEmpModal,
  empForm,
  setEmpForm,
  handleSaveEmployee,
  isSubmitting,
}) => {
  if (!showEmpModal) return null;
  return (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border space-y-4">
            <h3 className="font-bold text-slate-900 text-base">Add Staff Employee Profile</h3>
            <form onSubmit={handleSaveEmployee} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-600">Full Name</label>
                <input
                  type="text"
                  required
                  value={empForm.FullName}
                  onChange={e => setEmpForm({ ...empForm, FullName: e.target.value })}
                  placeholder=""
                  className="w-full mt-1 p-2 border rounded-xl text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-slate-600">Role</label>
                  <input
                    type="text"
                    value={empForm.Role}
                    onChange={e => setEmpForm({ ...empForm, Role: e.target.value })}
                    placeholder=""
                    className="w-full mt-1 p-2 border rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600">Monthly Salary (Rs.)</label>
                  <input
                    type="number"
                    required
                    value={empForm.Salary || ''}
                    onChange={e => setEmpForm({ ...empForm, Salary: Number(e.target.value) })}
                    placeholder=""
                    className="w-full mt-1 p-2 border rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-slate-600">Phone</label>
                  <input
                    type="text"
                    value={empForm.Phone}
                    onChange={e => setEmpForm({ ...empForm, Phone: e.target.value })}
                    placeholder=""
                    className="w-full mt-1 p-2 border rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600">CNIC</label>
                  <input
                    type="text"
                    value={empForm.CNIC}
                    onChange={e => setEmpForm({ ...empForm, CNIC: e.target.value })}
                    placeholder=""
                    className="w-full mt-1 p-2 border rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowEmpModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs"
                >
                  Save Employee
                </button>
              </div>
            </form>
          </div>
        </div>
  );
};

export default EmployeeModal;
