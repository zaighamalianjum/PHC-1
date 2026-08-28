import React from 'react';
import {
  Briefcase, Plus, UserPlus, DollarSign, Users,
  CheckCircle2, AlertCircle, Trash2
} from 'lucide-react';
import { ErpEmployee, ErpPayroll } from '../../../types';

interface HrTabProps {
  employees: ErpEmployee[];
  payrolls: ErpPayroll[];
  setShowEmpModal: (show: boolean) => void;
  setShowPayrollModal: (show: boolean) => void;
  setEmpForm: (val: any) => void;
  setPayrollForm: (val: any) => void;
  handleDeleteEmp: (emp: ErpEmployee) => void;
}

export const HrTab: React.FC<HrTabProps> = ({
  employees,
  payrolls,
  setShowEmpModal,
  setShowPayrollModal,
  setEmpForm,
  setPayrollForm,
  handleDeleteEmp,
}) => {
  return (
    <div className="space-y-6">
      {/* EMPLOYEES DIRECTORY */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900">Staff & Human Resources Directory</h2>
            <p className="text-xs text-slate-500">Employee profiles, monthly salaries, and bank accounts</p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowPayrollModal(true)}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition flex items-center space-x-1.5 cursor-pointer"
            >
              <DollarSign className="w-4 h-4" />
              <span>Process Payroll</span>
            </button>

            <button
              onClick={() => setShowEmpModal(true)}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition flex items-center space-x-1.5 cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add Employee</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                <th className="p-3">Emp ID</th>
                <th className="p-3">Full Name</th>
                <th className="p-3">Role / Designation</th>
                <th className="p-3">Department</th>
                <th className="p-3">Phone</th>
                <th className="p-3">CNIC</th>
                <th className="p-3 text-right">Monthly Salary</th>
                <th className="p-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {employees.map((emp, idx) => (
                <tr key={idx} className="hover:bg-slate-50">
                  <td className="p-3 font-mono font-bold text-slate-700">{emp.EmployeeID}</td>
                  <td className="p-3 font-bold text-slate-900">{emp.FullName}</td>
                  <td className="p-3 text-slate-700 font-semibold">{emp.Role}</td>
                  <td className="p-3 text-slate-600">{emp.Department}</td>
                  <td className="p-3 text-slate-600">{emp.Phone}</td>
                  <td className="p-3 font-mono text-slate-500">{emp.CNIC}</td>
                  <td className="p-3 text-right font-black text-slate-900">Rs. {(emp.Salary || 0).toLocaleString()}</td>
                  <td className="p-3 text-center">
                    <button
                      onClick={() => handleDeleteEmp(emp)}
                      className="p-1 text-rose-600 hover:bg-rose-50 rounded transition cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* PAYROLL HISTORY */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
        <h3 className="font-bold text-slate-900 text-sm">Monthly Payroll Disbursement History</h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                <th className="p-3">Payroll ID</th>
                <th className="p-3">Month</th>
                <th className="p-3">Employee Name</th>
                <th className="p-3 text-right">Basic</th>
                <th className="p-3 text-right">Allowances</th>
                <th className="p-3 text-right">Deductions</th>
                <th className="p-3 text-right">Net Salary</th>
                <th className="p-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {payrolls.map((p, idx) => (
                <tr key={idx} className="hover:bg-slate-50">
                  <td className="p-3 font-mono font-bold text-slate-700">{p.PayrollID}</td>
                  <td className="p-3 text-slate-600 font-bold">{p.MonthYear}</td>
                  <td className="p-3 font-bold text-slate-900">{p.EmployeeName}</td>
                  <td className="p-3 text-right text-slate-600">Rs. {(p.BasicSalary || 0).toLocaleString()}</td>
                  <td className="p-3 text-right text-emerald-600">+ Rs. {(p.Allowances || 0).toLocaleString()}</td>
                  <td className="p-3 text-right text-rose-600">- Rs. {(p.Deductions || 0).toLocaleString()}</td>
                  <td className="p-3 text-right font-black text-slate-900">Rs. {(p.NetSalary || 0).toLocaleString()}</td>
                  <td className="p-3 text-center">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      {p.PaymentStatus}
                    </span>
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

export default HrTab;
