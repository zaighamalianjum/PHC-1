import React from 'react';
import { DollarSign, X } from 'lucide-react';
import { ErpEmployee } from '../../../types';

interface PayrollModalProps {
  showPayrollModal: boolean;
  setShowPayrollModal: (show: boolean) => void;
  payrollForm: any;
  setPayrollForm: (form: any) => void;
  employees: ErpEmployee[];
  handleSavePayroll: (e: React.FormEvent) => void;
  isSubmitting: boolean;
}

export const PayrollModal: React.FC<PayrollModalProps> = ({
  showPayrollModal,
  setShowPayrollModal,
  payrollForm,
  setPayrollForm,
  employees,
  handleSavePayroll,
  isSubmitting,
}) => {
  if (!showPayrollModal) return null;
  return (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border space-y-4">
            <h3 className="font-bold text-slate-900 text-base">Process Monthly Staff Salary Payroll</h3>
            <form onSubmit={handleSavePayroll} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-600">Select Employee</label>
                <select
                  required
                  value={payrollForm.EmployeeID}
                  onChange={e => {
                    const emp = employees.find(item => item.EmployeeID === e.target.value);
                    setPayrollForm({
                      ...payrollForm,
                      EmployeeID: e.target.value,
                      BasicSalary: emp?.Salary || 0
                    });
                  }}
                  className="w-full mt-1 p-2 border rounded-xl text-xs bg-white font-bold"
                >
                  <option value="">-- Choose Employee --</option>
                  {employees.map((emp, idx) => (
                    <option key={idx} value={emp.EmployeeID}>{emp.FullName} ({emp.Role}) - Rs. {(emp.Salary || 0).toLocaleString()}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-slate-600">Month / Year</label>
                  <input
                    type="month"
                    required
                    value={payrollForm.MonthYear}
                    onChange={e => setPayrollForm({ ...payrollForm, MonthYear: e.target.value })}
                    className="w-full mt-1 p-2 border rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600">Basic Salary</label>
                  <input
                    type="number"
                    value={payrollForm.BasicSalary}
                    onChange={e => setPayrollForm({ ...payrollForm, BasicSalary: Number(e.target.value) })}
                    className="w-full mt-1 p-2 border rounded-xl text-xs font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-slate-600">Allowances (Rs.)</label>
                  <input
                    type="number"
                    value={payrollForm.Allowances}
                    onChange={e => setPayrollForm({ ...payrollForm, Allowances: Number(e.target.value) })}
                    className="w-full mt-1 p-2 border rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600">Deductions (Rs.)</label>
                  <input
                    type="number"
                    value={payrollForm.Deductions}
                    onChange={e => setPayrollForm({ ...payrollForm, Deductions: Number(e.target.value) })}
                    className="w-full mt-1 p-2 border rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowPayrollModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs"
                >
                  Confirm & Disburse Payroll
                </button>
              </div>
            </form>
          </div>
        </div>
  );
};

export default PayrollModal;
