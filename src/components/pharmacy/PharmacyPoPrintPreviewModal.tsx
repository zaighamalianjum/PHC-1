/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Item } from '../../types';
import {
  FileText,
  X,
  Printer,
  Calendar,
  AlertTriangle,
  Building,
  Phone,
  Mail,
  Layers,
  CheckSquare
} from 'lucide-react';

interface PharmacyPoPrintPreviewModalProps {
  setPoCategoryFilter?: (cat: string) => void;
  setPoOnlyLowStock?: (val: boolean) => void;
  categoryDropdownOptions?: string[];
  isPOPrintPreviewOpen: boolean;
  setIsPOPrintPreviewOpen: (open: boolean) => void;
  items: Item[];
  poCategoryFilter: string;
  poOnlyLowStock: boolean;
  poPrintLayout: '3col' | '2col' | 'tabular';
  setPoPrintLayout: (layout: '3col' | '2col' | 'tabular') => void;
  clinicSettings?: any;
  handleOpenPoPrintWindow: () => void;
  getFilteredPoItems: (items: Item[], catFilter: string, lowOnly: boolean) => Item[];
}

export const PharmacyPoPrintPreviewModal: React.FC<PharmacyPoPrintPreviewModalProps> = ({
  isPOPrintPreviewOpen,
  setIsPOPrintPreviewOpen,
  items,
  poCategoryFilter,
  poOnlyLowStock,
  poPrintLayout,
  setPoPrintLayout,
  clinicSettings,
  handleOpenPoPrintWindow,
  getFilteredPoItems,
  setPoCategoryFilter = (_cat?: any) => {},
  setPoOnlyLowStock = (_v?: any) => {},
  categoryDropdownOptions = []
}) => {
  if (!isPOPrintPreviewOpen) return null;
  const filteredPoItems = getFilteredPoItems(items, poCategoryFilter, poOnlyLowStock);
  const poRows: any[] = [];
  for (let i = 0; i < filteredPoItems.length; i += 3) {
    poRows.push([filteredPoItems[i], filteredPoItems[i + 1] || null, filteredPoItems[i + 2] || null]);
  }

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[9999] flex flex-col items-center justify-start p-2 sm:p-4 overflow-y-auto po-modal-backdrop print:p-0 print:bg-white print:static print:overflow-visible font-sans">
            
            {/* Style Injector for Direct Print Engine (HP LaserJet Compatible, Multi-page) */}
            <style dangerouslySetInnerHTML={{ __html: `
              @media print {
                @page {
                  size: A4 portrait;
                  margin: 12mm 12mm 12mm 12mm;
                }
                
                body * {
                  visibility: hidden !important;
                }

                html, body {
                  background: #ffffff !important;
                  color: #000000 !important;
                  height: auto !important;
                  min-height: auto !important;
                  overflow: visible !important;
                  margin: 0 !important;
                  padding: 0 !important;
                }

                .po-modal-backdrop {
                  position: static !important;
                  inset: auto !important;
                  overflow: visible !important;
                  max-height: none !important;
                  height: auto !important;
                  background: #ffffff !important;
                  padding: 0 !important;
                  margin: 0 !important;
                  box-shadow: none !important;
                  backdrop-filter: none !important;
                }

                .po-modal-container {
                  position: static !important;
                  max-height: none !important;
                  height: auto !important;
                  width: 100% !important;
                  max-width: 100% !important;
                  overflow: visible !important;
                  box-shadow: none !important;
                  border: none !important;
                  background: #ffffff !important;
                  padding: 0 !important;
                  margin: 0 !important;
                  border-radius: 0 !important;
                }

                #po-master-printable-area,
                #po-master-printable-area * {
                  visibility: visible !important;
                }

                #po-master-printable-area {
                  position: absolute !important;
                  left: 0 !important;
                  top: 0 !important;
                  width: 100% !important;
                  max-width: 100% !important;
                  margin: 0 !important;
                  padding: 0 !important;
                  background: #ffffff !important;
                  color: #000000 !important;
                  box-shadow: none !important;
                  border: none !important;
                  overflow: visible !important;
                  display: block !important;
                }

                table.po-print-table {
                  width: 100% !important;
                  border-collapse: collapse !important;
                  page-break-inside: auto !important;
                  border: 2px solid #000 !important;
                }

                table.po-print-table thead {
                  display: table-header-group !important;
                }

                table.po-print-table tbody tr {
                  page-break-inside: avoid !important;
                  break-inside: avoid !important;
                }

                table.po-print-table th,
                table.po-print-table td {
                  border: 1px solid #000 !important;
                  padding: 4px 6px !important;
                  color: #000 !important;
                }

                .no-print {
                  display: none !important;
                  visibility: hidden !important;
                }
              }
            ` }} />

            <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl overflow-hidden my-auto flex flex-col max-h-[92vh] po-modal-container print:max-h-none print:shadow-none print:border-none print:rounded-none">
              
              {/* Modal Header Controls */}
              <div className="p-4 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3 shrink-0 print:hidden no-print">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-lg border border-indigo-500/30">
                    <Printer className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="font-extrabold text-sm uppercase tracking-wider text-white flex items-center gap-2">
                      A4 Purchase Order Print Dialog & Preview
                    </h2>
                    <p className="text-[11px] text-slate-300">Filter by category, threshold scope, and layout format to generate printable Purchase Orders</p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={handleOpenPoPrintWindow}
                    className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-xs rounded-xl transition flex items-center shadow-md cursor-pointer"
                    title="Open printable document in a new window to print with full browser print options"
                  >
                    <Printer className="w-4 h-4 mr-1.5" />
                    <span>Open & Print in Pop-up</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      window.print();
                    }}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs rounded-xl transition flex items-center shadow-md cursor-pointer"
                    title="Trigger direct browser printing"
                  >
                    <Printer className="w-4 h-4 mr-1.5" />
                    <span>Trigger Direct Print</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsPOPrintPreviewOpen(false)}
                    className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition cursor-pointer"
                    title="Close Print Dialog"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Filter Toolbar (Category, Scope, Layout Selector) */}
              <div className="bg-slate-100 border-b border-slate-200 p-3.5 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs shrink-0 print:hidden no-print">
                {/* Category Selector */}
                <div className="space-y-1">
                  <label className="block text-[10px] font-black uppercase text-slate-500 tracking-wider">
                    Filter Medicine Category
                  </label>
                  <select
                    value={poCategoryFilter}
                    onChange={(e) => setPoCategoryFilter(e.target.value)}
                    className="w-full text-xs font-bold text-slate-800 bg-white border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="ALL">All Categories ({items.length} Medicines)</option>
                    <option value="C">Clinical Compounding (/C)</option>
                    <option value="P">Patent Medicine (/P)</option>
                    {categoryDropdownOptions.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                {/* Scope Selector */}
                <div className="space-y-1">
                  <label className="block text-[10px] font-black uppercase text-slate-500 tracking-wider">
                    Report Stock Scope
                  </label>
                  <select
                    value={poOnlyLowStock ? 'LOW_STOCK' : 'ALL_ITEMS'}
                    onChange={(e) => setPoOnlyLowStock(e.target.value === 'LOW_STOCK')}
                    className="w-full text-xs font-bold text-slate-800 bg-white border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="LOW_STOCK">Below Minimum Stock Threshold (Shortage PO)</option>
                    <option value="ALL_ITEMS">All Selected Category Medicines (Full Requisition)</option>
                  </select>
                </div>

                {/* Layout Format Selector */}
                <div className="space-y-1">
                  <label className="block text-[10px] font-black uppercase text-slate-500 tracking-wider">
                    Print Layout Format
                  </label>
                  <div className="flex items-center space-x-1.5 pt-0.5">
                    <button
                      type="button"
                      onClick={() => setPoPrintLayout('3col')}
                      className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold border transition cursor-pointer ${
                        poPrintLayout === '3col'
                          ? 'bg-indigo-600 text-white border-indigo-700 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      3-Column Grid
                    </button>
                    <button
                      type="button"
                      onClick={() => setPoPrintLayout('detail')}
                      className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold border transition cursor-pointer ${
                        poPrintLayout === 'detail'
                          ? 'bg-indigo-600 text-white border-indigo-700 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      Full Detail List
                    </button>
                  </div>
                </div>
              </div>

              {/* Selected Items Status Banner */}
              <div className="bg-indigo-50 border-b border-indigo-100 px-4 py-2 flex items-center justify-between text-xs font-semibold text-indigo-950 shrink-0 print:hidden no-print">
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>
                    Category: <strong className="text-indigo-700">{poCategoryFilter === 'ALL' ? 'All Categories' : poCategoryFilter}</strong>
                  </span>
                  <span className="text-slate-300">|</span>
                  <span>
                    Selected Items: <strong className="text-indigo-700">{filteredPoItems.length} Medicines</strong>
                  </span>
                </div>
                <span className="text-[10px] font-bold text-slate-500 hidden sm:inline">
                  📄 A4 Standard Letterhead (HP LaserJet Ready)
                </span>
              </div>

              {/* Interactive Sheet Preview Container */}
              <div className="p-4 sm:p-6 overflow-y-auto bg-slate-200/70 flex justify-center flex-1 print:p-0 print:bg-white print:overflow-visible">
                <div
                  id="po-master-printable-area"
                  className="bg-white shadow-2xl border border-slate-300 p-6 sm:p-8 w-full max-w-[210mm] min-h-[297mm] text-black font-sans text-xs shrink-0 print:shadow-none print:border-none print:p-0 print:w-full print:max-w-full print:min-h-0"
                >
                  {/* Clinic Letterhead Header */}
                  <div className="text-center mb-4 pb-3 border-b-2 border-black">
                    <h1 className="text-xl sm:text-2xl font-black uppercase text-black tracking-wide">
                      {clinicSettings?.ClinicName || "Punjab Homeopathic Clinic"}
                    </h1>
                    <p className="text-xs font-extrabold text-black uppercase tracking-wider mt-0.5">
                      PURCHASE ORDER & MINIMUM THRESHOLD REQUISITION
                    </p>
                    <div className="flex flex-wrap items-center justify-between text-[10px] font-bold text-slate-800 mt-2 pt-2 border-t border-slate-200">
                      <span>Date: {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                      <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-300 uppercase">
                        Category: {poCategoryFilter === 'ALL' ? 'All Categories' : poCategoryFilter}
                      </span>
                      <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-300 uppercase">
                        Scope: {poOnlyLowStock ? 'Shortage Items Only' : 'Full Category List'}
                      </span>
                      <span>Total Items: {filteredPoItems.length}</span>
                    </div>
                  </div>

                  {/* Printable Items Table */}
                  {filteredPoItems.length === 0 ? (
                    <div className="p-12 text-center border-2 border-dashed border-slate-300 rounded-xl my-8">
                      <p className="text-sm font-bold text-slate-500">
                        No medicine items found matching category "<strong>{poCategoryFilter}</strong>" with selected stock filter options.
                      </p>
                      <p className="text-xs text-slate-400 mt-1">Try selecting "All Categories" or changing the stock scope.</p>
                    </div>
                  ) : poPrintLayout === '3col' ? (
                    /* 3-Column Grid Layout */
                    <table className="w-full text-left border-collapse border-2 border-black text-xs font-sans po-print-table">
                      <thead>
                        <tr>
                          <th colSpan={6} className="border border-black p-2 text-center font-bold text-xs bg-slate-50 uppercase text-black">
                            Purchase Order Requisition List ({filteredPoItems.length} Items)
                          </th>
                        </tr>
                        <tr className="bg-slate-100">
                          <th className="border border-black p-1.5 font-bold text-left w-[23%] text-black text-[10px]">MEDICINE NAME</th>
                          <th className="border border-black p-1.5 font-bold text-center w-[10.33%] text-black text-[10px]">REQ QTY</th>
                          <th className="border border-black p-1.5 font-bold text-left w-[23%] text-black text-[10px]">MEDICINE NAME</th>
                          <th className="border border-black p-1.5 font-bold text-center w-[10.33%] text-black text-[10px]">REQ QTY</th>
                          <th className="border border-black p-1.5 font-bold text-left w-[23%] text-black text-[10px]">MEDICINE NAME</th>
                          <th className="border border-black p-1.5 font-bold text-center w-[10.33%] text-black text-[10px]">REQ QTY</th>
                        </tr>
                      </thead>
                      <tbody>
                        {poRows.map((row, rIdx) => {
                          const getQtyStr = (itm: Item | null) => {
                            if (!itm) return '';
                            return (itm.ReorderQty !== undefined && itm.ReorderQty !== null)
                              ? itm.ReorderQty
                              : 0;
                          };
                          return (
                            <tr key={rIdx}>
                              <td className="border border-black px-2 py-1 font-medium text-left text-black">{row[0]?.ItemName || ''}</td>
                              <td className="border border-black px-2 py-1 font-bold text-center text-black bg-slate-50/50">
                                {getQtyStr(row[0])}
                              </td>

                              <td className="border border-black px-2 py-1 font-medium text-left text-black">{row[1]?.ItemName || ''}</td>
                              <td className="border border-black px-2 py-1 font-bold text-center text-black bg-slate-50/50">
                                {getQtyStr(row[1])}
                              </td>

                              <td className="border border-black px-2 py-1 font-medium text-left text-black">{row[2]?.ItemName || ''}</td>
                              <td className="border border-black px-2 py-1 font-bold text-center text-black bg-slate-50/50">
                                {getQtyStr(row[2])}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  ) : (
                    /* Full Detail List Layout */
                    <table className="w-full text-left border-collapse border-2 border-black text-xs font-sans po-print-table">
                      <thead>
                        <tr className="bg-slate-100">
                          <th className="border border-black p-1.5 font-bold text-center w-[6%] text-black text-[10px]">S.No</th>
                          <th className="border border-black p-1.5 font-bold text-center w-[12%] text-black text-[10px]">Item ID</th>
                          <th className="border border-black p-1.5 font-bold text-left w-[42%] text-black text-[10px]">Medicine Name</th>
                          <th className="border border-black p-1.5 font-bold text-center w-[12%] text-black text-[10px]">Category</th>
                          <th className="border border-black p-1.5 font-bold text-center w-[14%] text-black text-[10px]">Current Stock</th>
                          <th className="border border-black p-1.5 font-bold text-center w-[14%] text-black text-[10px]">Required Qty</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredPoItems.map((itm, idx) => {
                          const reorderQty = (itm.ReorderQty !== undefined && itm.ReorderQty !== null)
                            ? itm.ReorderQty
                            : 0;
                          return (
                            <tr key={`${itm.ItemID}-${idx}`}>
                              <td className="border border-black px-2 py-1 text-center font-bold text-slate-500">{idx + 1}</td>
                              <td className="border border-black px-2 py-1 text-center font-mono font-bold">{itm.ItemID}</td>
                              <td className="border border-black px-2 py-1 font-bold text-black">{itm.ItemName}</td>
                              <td className="border border-black px-2 py-1 text-center font-semibold">{itm.Unit || 'Tab'}</td>
                              <td className="border border-black px-2 py-1 text-center font-mono font-bold text-rose-700 bg-rose-50/30">{itm.CStock}</td>
                              <td className="border border-black px-2 py-1 text-center font-mono font-black text-indigo-900 bg-indigo-50/40">{reorderQty} {itm.Unit || 'Tab'}s</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}

                  {/* Footer Signatures */}
                  <div className="mt-12 flex justify-between items-center px-6 pt-4 border-t border-black text-xs font-bold text-black">
                    <div className="text-center w-48 border-t border-black pt-1 uppercase">
                      Prepared By (Pharmacy Manager)
                    </div>
                    <div className="text-center w-48 border-t border-black pt-1 uppercase">
                      Approved By (Clinic Administrator)
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer Controls */}
              <div className="p-3.5 bg-slate-100 border-t border-slate-200 flex flex-wrap justify-between items-center gap-2 text-xs text-slate-600 shrink-0 print:hidden no-print">
                <span className="text-[11px] font-semibold text-slate-500">
                  Tip: Click <strong>Open & Print in Pop-up</strong> to launch in a clean browser tab for laser printing.
                </span>
                <button
                  type="button"
                  onClick={() => setIsPOPrintPreviewOpen(false)}
                  className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl transition cursor-pointer shadow-sm"
                >
                  Close Print Dialog
                </button>
              </div>

            </div>
          </div>
  );
};

export default PharmacyPoPrintPreviewModal;
