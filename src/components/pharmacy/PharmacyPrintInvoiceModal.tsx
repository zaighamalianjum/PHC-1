/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Item, Patient } from '../../types';
import { numToWords as convertNumberToWords } from '../../utils/pharmacyUtils';
import {
  Printer,
  FileText,
  Receipt,
  X,
  Clock,
  Calendar
} from 'lucide-react';

interface PharmacyPrintInvoiceModalProps {
  setPrintBillData?: (data: any) => void;
  printModalOpen: boolean;
  setPrintModalOpen: (open: boolean) => void;
  printBillData: {
    patient: Patient | null;
    basket: { ItemID: string; Qty: number; Price: number; MedicineType?: 'C' | 'P' | 'S' }[];
    discount: number;
    netAmount: number;
    shift: 1 | 2;
    invoiceNo: string;
    invoiceDate: string;
  } | null;
  printModalFormat: 'a4' | 'thermal';
  setPrintModalFormat: (format: 'a4' | 'thermal') => void;
  handlePrintA4Invoice: (billData: any) => void;
  handlePrintThermalReceipt: (billData: any) => void;
  items: Item[];
  clinicSettings?: any;
}

export const PharmacyPrintInvoiceModal: React.FC<PharmacyPrintInvoiceModalProps> = ({
  printModalOpen,
  setPrintModalOpen,
  printBillData,
  printModalFormat,
  setPrintModalFormat,
  handlePrintA4Invoice,
  handlePrintThermalReceipt,
  items,
  clinicSettings,
  setPrintBillData
}) => {
  if (!printModalOpen || !printBillData) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-[9999] overflow-y-auto animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden">
            
            {/* Modal Controls Header */}
            <div className="p-4 border-b border-slate-150 flex flex-col sm:flex-row sm:items-center justify-between bg-slate-50 gap-3 shrink-0">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg shrink-0">
                  <Printer className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-bold text-slate-900 block">Print Invoice / Receipt</span>
                    <span className="px-1.5 py-0.5 bg-blue-100 text-blue-800 font-mono font-bold text-[10px] rounded">
                      {printBillData.invoiceNo}
                    </span>
                  </div>
                  <span className="text-xxs text-slate-500 font-medium">Select output format: Standard A4 printer vs 80mm Thermal Receipt</span>
                </div>
              </div>

              {/* Format Toggle & Action Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex rounded-lg border border-slate-200 p-0.5 bg-white text-[11px] font-bold">
                  <button
                    type="button"
                    onClick={() => setPrintModalFormat('a4')}
                    className={`px-2.5 py-1 rounded-md transition flex items-center space-x-1 cursor-pointer ${printModalFormat === 'a4' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                  >
                    <FileText className="w-3 h-3" />
                    <span>A4 Size</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPrintModalFormat('thermal')}
                    className={`px-2.5 py-1 rounded-md transition flex items-center space-x-1 cursor-pointer ${printModalFormat === 'thermal' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                  >
                    <Receipt className="w-3 h-3" />
                    <span>80mm Thermal</span>
                  </button>
                </div>

                {printModalFormat === 'a4' ? (
                  <button
                    type="button"
                    onClick={() => handlePrintA4Invoice(printBillData)}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg shadow-sm flex items-center space-x-1.5 transition cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>🖨️ Print A4 Invoice</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handlePrintThermalReceipt(printBillData)}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-sm flex items-center space-x-1.5 transition cursor-pointer"
                  >
                    <Receipt className="w-3.5 h-3.5" />
                    <span>🧾 Print Customer Receipt (Thermal)</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setPrintModalOpen(false);
                    setPrintBillData?.(null);
                  }}
                  className="px-2.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-lg transition cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>

            {/* Live Interactive Preview Container */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-100 flex justify-center">
              {printModalFormat === 'a4' ? (
                /* A4 Sheet Preview */
                <div className="bg-white border-2 border-slate-900 rounded-lg shadow-md w-full max-w-xl p-5 text-slate-800 text-xs font-sans space-y-4">
                  {/* A4 Header */}
                  <div className="flex items-center justify-between border-b-2 border-slate-900 pb-3">
                    <div>
                      <h2 className="text-base font-black text-indigo-950 uppercase tracking-tight">
                        {clinicSettings?.ClinicName || "PUNJAB HOMEOPATHIC CLINIC & PHARMACY"}
                      </h2>
                      <p className="text-[10px] text-slate-500 font-medium">
                        {clinicSettings?.Address || "Opposite State Bank, Mall Road, Lahore"} • Ph: {clinicSettings?.PhoneNo || "042-3111222"}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="inline-block bg-slate-900 text-white text-[10px] font-black px-2.5 py-1 rounded uppercase tracking-wider">
                        A4 OFFICIAL INVOICE
                      </span>
                    </div>
                  </div>

                  {/* Metadata Boxes */}
                  <div className="grid grid-cols-2 gap-3 text-xxs">
                    <div className="bg-slate-50 p-2.5 rounded border border-slate-200 space-y-1">
                      <div className="flex justify-between">
                        <span className="text-slate-500 font-semibold">Invoice No:</span>
                        <strong className="text-slate-950 font-mono">{printBillData.invoiceNo}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500 font-semibold">Date:</span>
                        <strong className="text-slate-900">{printBillData.invoiceDate}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500 font-semibold">Operational Shift:</span>
                        <strong className="text-slate-900">{printBillData.shift === 1 ? 'Morning Shift (1)' : 'Evening Shift (2)'}</strong>
                      </div>
                    </div>

                    <div className="bg-slate-50 p-2.5 rounded border border-slate-200 space-y-1">
                      <div className="flex justify-between">
                        <span className="text-slate-500 font-semibold">Patient/Customer:</span>
                        <strong className="text-slate-950 truncate max-w-[130px]">{printBillData.patient ? printBillData.patient.PatientName : "Walk-in Guest"}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500 font-semibold">Patient ID:</span>
                        <strong className="text-slate-900 font-mono">{printBillData.patient ? printBillData.patient.PatientID : "WALK-IN"}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500 font-semibold">Status:</span>
                        <strong className="text-emerald-700">PAID IN CASH</strong>
                      </div>
                    </div>
                  </div>

                  {/* Table */}
                  <div className="border border-slate-200 rounded overflow-hidden">
                    <table className="w-full text-left text-xxs">
                      <thead className="bg-slate-900 text-white font-bold uppercase">
                        <tr>
                          <th className="p-2 w-8 text-center">#</th>
                          <th className="p-2">Item Description</th>
                          <th className="p-2 w-12 text-center">Qty</th>
                          <th className="p-2 w-20 text-right">Rate</th>
                          <th className="p-2 w-24 text-right">Net Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {printBillData.basket.map((b, idx) => {
                          const item = items.find(i => i.ItemID === b.ItemID);
                          const lineTotal = b.Qty * b.Price;
                          return (
                            <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}>
                              <td className="p-2 text-center font-bold text-slate-400">{idx + 1}</td>
                              <td className="p-2">
                                <strong className="text-slate-900 block text-xs">{item ? item.ItemName : b.ItemID}</strong>
                                <span className="text-[10px] text-indigo-600 font-semibold">{item?.Category || (b.MedicineType === 'C' ? 'Clinical' : (item?.Unit || 'Patent'))}</span>
                              </td>
                              <td className="p-2 text-center font-bold font-mono">{b.Qty}</td>
                              <td className="p-2 text-right font-mono">Rs. {b.Price.toFixed(0)}</td>
                              <td className="p-2 text-right font-bold font-mono text-slate-950">Rs. {lineTotal.toLocaleString()}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Bottom Financial Summary & Notes */}
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="text-xxs text-slate-500 space-y-1">
                      <strong className="text-slate-800 uppercase block font-bold">Policy & Instructions:</strong>
                      <p>• Returns accepted within 3 days with this invoice.</p>
                      <p>• Clinical & opened medicines non-returnable.</p>
                      <p className="italic text-indigo-900 font-semibold mt-1">In Words: {convertNumberToWords(printBillData.netAmount)}</p>
                    </div>

                    <div className="bg-slate-50 p-2.5 rounded border border-slate-900 space-y-1 text-xxs">
                      <div className="flex justify-between">
                        <span className="text-slate-500 font-semibold">Subtotal:</span>
                        <strong className="font-mono">Rs. {printBillData.basket.reduce((sum, item) => sum + item.Qty * item.Price, 0).toLocaleString()}</strong>
                      </div>
                      {printBillData.discount > 0 && (
                        <div className="flex justify-between text-red-600">
                          <span className="font-semibold">Discount:</span>
                          <strong className="font-mono">- Rs. {printBillData.discount.toLocaleString()}</strong>
                        </div>
                      )}
                      <div className="flex justify-between border-t-2 border-slate-900 pt-1.5 text-xs font-black text-emerald-800">
                        <span>NET PAYABLE:</span>
                        <span className="font-mono text-sm">Rs. {printBillData.netAmount.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Signature block */}
                  <div className="flex justify-between pt-6 border-t border-slate-200 text-xxs font-bold text-slate-600">
                    <div className="text-center w-32 border-t border-slate-800 pt-1">
                      Duty Pharmacist
                    </div>
                    <div className="text-center font-mono text-xs font-black tracking-widest text-slate-400">
                      * {printBillData.invoiceNo} *
                    </div>
                    <div className="text-center w-32 border-t border-slate-800 pt-1">
                      Customer Signature
                    </div>
                  </div>
                </div>
              ) : (
                /* Thermal 80mm Receipt Preview */
                <div className="bg-white border border-slate-300 rounded shadow-md max-w-xs w-full p-4 font-mono text-xs text-black space-y-3">
                  <div className="text-center space-y-1">
                    <h3 className="font-bold text-xs uppercase">{clinicSettings?.ClinicName || "PUNJAB CLINIC & PHARMACY"}</h3>
                    <p className="text-[10px]">{clinicSettings?.Address || "Mall Road, Lahore"}</p>
                    <p className="text-[10px]">Ph: {clinicSettings?.PhoneNo || "042-3111222"}</p>
                    <div className="border-t border-b border-black py-0.5 my-1 font-bold text-[11px]">
                      *** CUSTOMER RECEIPT ***
                    </div>
                  </div>

                  <div className="space-y-0.5 text-xxs">
                    <div className="flex justify-between">
                      <span>Inv #:</span>
                      <strong className="font-bold">{printBillData.invoiceNo}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Date:</span>
                      <span>{printBillData.invoiceDate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Customer:</span>
                      <strong className="truncate max-w-[130px]">{printBillData.patient ? printBillData.patient.PatientName : "Walk-in Customer"}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Shift:</span>
                      <span>{printBillData.shift === 1 ? 'Morning (1)' : 'Evening (2)'}</span>
                    </div>
                  </div>

                  <div className="border-t border-dashed border-black pt-1 space-y-1 text-xxs">
                    <div className="flex justify-between font-bold border-b border-dashed border-black pb-1">
                      <span>ITEM</span>
                      <span className="w-10 text-center">QTY</span>
                      <span className="w-16 text-right">TOTAL</span>
                    </div>
                    {printBillData.basket.map((b, idx) => {
                      const itm = items.find(i => i.ItemID === b.ItemID);
                      const lineTotal = b.Qty * b.Price;
                      return (
                        <div key={idx} className="space-y-0.5">
                          <div className="font-bold truncate">{itm ? itm.ItemName : b.ItemID}</div>
                          <div className="flex justify-between text-slate-600">
                            <span>@ Rs. {b.Price.toFixed(0)}</span>
                            <span className="w-10 text-center font-bold text-black">{b.Qty}</span>
                            <span className="w-16 text-right font-bold text-black">Rs. {lineTotal.toLocaleString()}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="border-t border-dashed border-black pt-1 space-y-0.5 text-xxs">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>Rs. {printBillData.basket.reduce((sum, item) => sum + item.Qty * item.Price, 0).toLocaleString()}</span>
                    </div>
                    {printBillData.discount > 0 && (
                      <div className="flex justify-between text-red-600">
                        <span>Discount:</span>
                        <span>- Rs. {printBillData.discount.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-sm border-t border-b border-black py-1 my-1">
                      <span>TOTAL:</span>
                      <span>Rs. {printBillData.netAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-[10px]">
                      <span>Paid:</span>
                      <strong>CASH (POSTED)</strong>
                    </div>
                  </div>

                  <div className="text-center pt-2 space-y-1 text-xxs">
                    <div className="tracking-widest font-bold">||| {printBillData.invoiceNo} |||</div>
                    <div className="border-t border-dashed border-black pt-1 text-[9px] text-slate-700">
                      Returns accepted within 3 days with receipt.<br/>
                      <strong>* THANK YOU & GET WELL SOON *</strong>
                    </div>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
  );
};

export default PharmacyPrintInvoiceModal;
