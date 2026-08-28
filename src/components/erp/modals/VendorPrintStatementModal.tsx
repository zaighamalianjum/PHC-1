import React from 'react';
import { Printer, X, Building2 } from 'lucide-react';
import { ErpVendor, ClinicSettings } from '../../../types';

interface VendorPrintStatementModalProps {
  vendorPrintModalOpen: boolean;
  setVendorPrintModalOpen: (open: boolean) => void;
  selectedVendor: ErpVendor | null;
  vendorStatement: any;
  clinicSettings?: ClinicSettings;
  handlePrintVendorStatement: (targetVendor?: ErpVendor) => void;
  vendorDateFilter?: string;
  currentUser?: any;
}

export const VendorPrintStatementModal: React.FC<VendorPrintStatementModalProps> = ({
  vendorPrintModalOpen,
  setVendorPrintModalOpen,
  selectedVendor,
  vendorStatement,
  clinicSettings,
  handlePrintVendorStatement,
  vendorDateFilter = 'all',
  currentUser,
}) => {
  if (!vendorPrintModalOpen || !selectedVendor) return null;
  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto print:absolute print:inset-0 print:bg-white print:p-0 print:m-0 print:overflow-visible">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-4xl w-full flex flex-col h-[92vh] print:h-auto print:max-w-none print:w-full print:border-0 print:shadow-none print:rounded-none animate-fadeIn">
        {/* Modal Control Bar (Hidden on Print) */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between print:hidden bg-slate-50 rounded-t-2xl shrink-0">
          <div>
            <span className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
              <Printer className="w-4 h-4 text-amber-600" />
              Vendor Account Statement A4 Letterhead Preview
            </span>
            <p className="text-[10px] text-slate-500">Official ledger statement for {selectedVendor.VendorName}</p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handlePrintVendorStatement()}
              className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition flex items-center shadow-xs cursor-pointer"
            >
              <Printer className="w-4 h-4 mr-1.5" />
              Print Statement (A4)
            </button>
            <button
              onClick={() => setVendorPrintModalOpen(false)}
              className="text-slate-400 hover:text-slate-600 p-2 rounded-xl hover:bg-slate-200 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable A4 Document Sheet */}
        <div className="p-8 flex-1 overflow-y-auto space-y-6 print:p-0 print:overflow-visible text-slate-900 bg-white" id="vendor-printable-sheet">
          {/* OFFICIAL PUNJAB HOMEOPATHIC CLINIC A4 LETTERHEAD HEADER */}
          {(() => {
            const cName = clinicSettings?.ClinicName || 'PUNJAB HOMEOPATHIC CLINIC & PHARMACY';
            const cTag = clinicSettings?.ClinicLogoText || 'HEALING NATURALLY • RESTORING BALANCE';
            const cDoc = clinicSettings?.DoctorName || '';
            const cDocSub = clinicSettings?.DoctorSignatureText || '';
            const cAddr = clinicSettings?.ClinicAddress || '10 Shalimar Road, Garhi Shahu, Lahore';
            const cPhone = clinicSettings?.ClinicPhone || '0300-4134444 / 042-36304444';
            const cEmail = clinicSettings?.ClinicEmail || 'info@punjabclinic.pk';

            return (
              <div className="border-b-2 border-slate-900 pb-5">
                <div className="flex justify-between items-start">
                  {/* Left Column: Brand Logo & Clinic Info */}
                  <div className="flex items-start space-x-3.5 max-w-[65%]">
                    {clinicSettings?.ClinicLogoUrl ? (
                      <img
                        src={clinicSettings.ClinicLogoUrl}
                        alt="Clinic Logo"
                        className="w-16 h-16 object-contain rounded-lg border border-slate-200 p-1 shrink-0"
                      />
                    ) : (
                      <div className="w-14 h-14 bg-gradient-to-br from-emerald-600 to-teal-800 rounded-xl flex items-center justify-center text-white font-black text-2xl shadow-sm shrink-0">
                        PH
                      </div>
                    )}
                    <div>
                      <h1 className="text-xl font-black text-slate-900 tracking-tight leading-tight uppercase font-serif">
                        {cName}
                      </h1>
                      <p className="text-[11px] font-bold text-emerald-800 tracking-wider uppercase mt-0.5">
                        {cTag}
                      </p>
                      {cDoc && (
                        <p className="text-[11px] font-bold text-slate-800 mt-1">
                          {cDoc} {cDocSub ? `(${cDocSub})` : ''}
                        </p>
                      )}
                      <div className="text-[10px] text-slate-600 mt-1.5 space-y-0.5 leading-relaxed">
                        <p>📍 {cAddr}</p>
                        <p>📞 Phone / Mobile: <span className="font-semibold text-slate-800">{cPhone}</span> | ✉️ {cEmail}</p>
                      </div>
                    </div>
                  </div>

                  {/* Right Statement Badge */}
                  <div className="text-right space-y-1 shrink-0">
                    <span className="inline-block px-3 py-1 bg-amber-100 print:bg-slate-100 text-amber-900 print:text-slate-900 border border-amber-300 print:border-slate-400 font-black text-xs uppercase tracking-wider rounded-md">
                      SUPPLIER STATEMENT
                    </span>
                    <p className="text-[10px] text-slate-500 font-mono pt-1">
                      Statement Date: <span className="font-bold text-slate-800">{new Date().toLocaleDateString('en-GB')}</span>
                    </p>
                    <p className="text-[10px] text-slate-500 font-mono">
                      Period Filter: <span className="font-bold text-slate-800 capitalize">{vendorDateFilter === 'all' ? 'All Time (Full Ledger)' : vendorDateFilter}</span>
                    </p>
                    <p className="text-[10px] text-slate-400 font-mono">
                      Doc Ref: STMT-{selectedVendor.VendorID || 'VND'}-{new Date().toISOString().slice(0,10).replace(/-/g,'')}
                    </p>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* SUPPLIER DETAILS & SUMMARY CARDS */}
          <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-300 text-xs print:bg-slate-50">
            <div className="space-y-1.5 border-r border-slate-200 pr-4">
              <p className="text-[10px] font-black uppercase text-amber-800 print:text-slate-800 tracking-wider flex items-center">
                <Building2 className="w-3.5 h-3.5 mr-1" />
                Supplier / Distributor Details
              </p>
              <p className="font-black text-sm text-slate-950">{selectedVendor.VendorName}</p>
              <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-slate-700 text-[11px]">
                <p>Vendor ID: <span className="font-mono font-bold text-slate-900">{selectedVendor.VendorID || 'N/A'}</span></p>
                <p>NTN / Tax ID: <span className="font-mono font-bold text-slate-900">{selectedVendor.TaxID || 'N/A'}</span></p>
                <p>Contact: <span className="font-bold text-slate-900">{selectedVendor.ContactPerson || 'N/A'}</span></p>
                <p>Phone: <span className="font-bold text-slate-900">{selectedVendor.Phone || 'N/A'}</span></p>
              </div>
              <p className="text-[11px] text-slate-600 truncate">Address: {selectedVendor.Address || 'N/A'}</p>
            </div>

            <div className="space-y-1.5 pl-2 text-right flex flex-col justify-between">
              <p className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
                Accounts Payable Financial Summary
              </p>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between items-center text-slate-700">
                  <span>Total Purchases / GRN Bills (Credit):</span>
                  <span className="font-mono font-bold text-amber-800 print:text-slate-900">Rs. {vendorStatement.totalInvoiced.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-slate-700">
                  <span>Total Bill Payments Settled (Debit):</span>
                  <span className="font-mono font-bold text-emerald-700 print:text-slate-900">Rs. {vendorStatement.totalPaid.toLocaleString()}</span>
                </div>
              </div>
              <div className="pt-2 border-t border-slate-300 flex justify-between items-center bg-amber-500/10 p-2 rounded-lg border border-amber-300/80 print:bg-slate-100 print:border-slate-400">
                <span className="text-xs font-black uppercase text-slate-900">Net Outstanding Balance:</span>
                <span className="text-base font-mono font-black text-amber-800 print:text-slate-950">Rs. {vendorStatement.closingBalance.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* STATEMENT ROWS TABLE (WITH PURCHASE ORDER NUMBER COLUMN) */}
          <div className="border border-slate-300 rounded-xl overflow-hidden print:border-slate-400">
            <table className="w-full text-left text-xs font-sans border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white uppercase text-[9px] font-black tracking-wider print:bg-slate-950">
                  <th className="p-2.5">Date</th>
                  <th className="p-2.5">Type</th>
                  <th className="p-2.5">Ref / Voucher #</th>
                  <th className="p-2.5">P.O. Number</th>
                  <th className="p-2.5">Description / Particulars</th>
                  <th className="p-2.5 text-right">Debit (Paid)</th>
                  <th className="p-2.5 text-right">Credit (Bill)</th>
                  <th className="p-2.5 text-right">Running Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white text-[11px]">
                {vendorStatement.statementRows.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-6 text-center text-slate-400 font-bold">
                      No transactions or GRNs recorded for this vendor in selected period.
                    </td>
                  </tr>
                ) : (
                  vendorStatement.statementRows.map((row: any, idx: number) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="p-2.5 font-mono text-slate-700 whitespace-nowrap">{row.date}</td>
                      <td className="p-2.5 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                          row.credit > 0 ? 'bg-amber-100 text-amber-900 print:bg-slate-100 print:text-slate-900' : 'bg-emerald-100 text-emerald-900 print:bg-slate-100 print:text-slate-900'
                        }`}>
                          {row.type}
                        </span>
                      </td>
                      <td className="p-2.5 font-mono font-bold text-slate-900 whitespace-nowrap">{row.refNo}</td>
                      <td className="p-2.5 font-mono font-bold text-indigo-700 print:text-slate-900 whitespace-nowrap">
                        {row.poNo !== 'N/A' ? row.poNo : '-'}
                      </td>
                      <td className="p-2.5 text-slate-700">{row.description}</td>
                      <td className="p-2.5 text-right font-mono font-bold text-emerald-700 print:text-slate-900 whitespace-nowrap">
                        {row.debit > 0 ? `Rs. ${row.debit.toLocaleString()}` : '-'}
                      </td>
                      <td className="p-2.5 text-right font-mono font-bold text-amber-700 print:text-slate-900 whitespace-nowrap">
                        {row.credit > 0 ? `Rs. ${row.credit.toLocaleString()}` : '-'}
                      </td>
                      <td className="p-2.5 text-right font-mono font-black text-slate-950 whitespace-nowrap">
                        Rs. {(row.runningBalance || 0).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              <tfoot>
                <tr className="bg-slate-100 font-bold border-t-2 border-slate-900 text-slate-900 text-xs">
                  <td colSpan={5} className="p-2.5 text-right uppercase font-black">Total Ledger Summary:</td>
                  <td className="p-2.5 text-right font-mono font-black text-emerald-800 print:text-slate-950 whitespace-nowrap">
                    Rs. {vendorStatement.totalPaid.toLocaleString()}
                  </td>
                  <td className="p-2.5 text-right font-mono font-black text-amber-800 print:text-slate-950 whitespace-nowrap">
                    Rs. {vendorStatement.totalInvoiced.toLocaleString()}
                  </td>
                  <td className="p-2.5 text-right font-mono font-black text-slate-950 whitespace-nowrap">
                    Rs. {vendorStatement.closingBalance.toLocaleString()}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* AUDIT & SIGNATURES BLOCK FOR A4 LETTERHEAD */}
          <div className="pt-8 mt-6 border-t border-slate-300 grid grid-cols-4 gap-4 text-center text-[10px] font-bold text-slate-700 print:pt-12">
            <div className="space-y-1">
              <div className="border-b border-slate-400 pb-1 h-8 flex items-end justify-center font-mono text-[9px] text-slate-600">
                {currentUser?.FullName || 'Accountant'}
              </div>
              <p className="uppercase tracking-wider font-extrabold text-[9px]">PREPARED BY (ACCOUNTANT)</p>
              <p className="text-[8px] text-slate-500 font-medium">Accounts & Audit Desk</p>
            </div>

            <div className="space-y-1">
              <div className="border-b border-slate-400 pb-1 h-8"></div>
              <p className="uppercase tracking-wider font-extrabold text-[9px]">CHECKED BY (AUDITOR)</p>
              <p className="text-[8px] text-slate-500 font-medium">Internal Audit Wing</p>
            </div>

            <div className="space-y-1">
              <div className="border-b border-slate-400 pb-1 h-8"></div>
              <p className="uppercase tracking-wider font-extrabold text-[9px]">VENDOR STAMP & SIGN</p>
              <p className="text-[8px] text-slate-500 font-medium">Authorized Distributor Seal</p>
            </div>

            <div className="space-y-1">
              <div className="border-b-2 border-slate-900 pb-1 h-8 flex items-end justify-center font-black text-xs text-slate-900 font-serif">
                Zaigham Ali Anjum
              </div>
              <p className="uppercase tracking-wider font-extrabold text-[10px] text-rose-900">MR. ZAIGHAM ALI ANJUM</p>
              <p className="text-[9px] text-slate-800 font-bold">Manager Operations & Administrative Head</p>
              <p className="text-[8px] text-emerald-800 font-bold">Punjab Homeopathic Clinic & Pharmacy</p>
            </div>
          </div>

          {/* FOOTER DISCLAIMER */}
          <div className="pt-4 border-t border-slate-200 text-between flex items-center justify-between text-[9px] text-slate-400 font-mono">
            <p>Punjab Homeopathic Clinic & Pharmacy • Accounts Payable Ledger System • Confidential Document</p>
            <p>Printed on: {new Date().toLocaleString('en-GB')}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorPrintStatementModal;
