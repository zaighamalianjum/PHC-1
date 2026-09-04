/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  History,
  Printer,
  FileText,
  Search,
  Calendar,
  AlertTriangle,
  RotateCcw,
  CheckCircle,
  Receipt,
  User,
  Clock,
  Eye,
  Trash2
} from 'lucide-react';
import { InvoiceHeader, InvoiceDetail, Item, Patient } from '../../types';

interface PharmacyInvoiceLogsTabProps {
  setPrintBillData?: (data: any) => void;
  setPrintModalOpen?: (open: boolean) => void;
  activeSubTab: string;
  invoices: InvoiceHeader[];
  invoiceDetails: InvoiceDetail[];
  items: Item[];
  patients: Patient[];
  selectedDailyReportDate: string;
  setSelectedDailyReportDate: (v: string) => void;
  salesReportPeriodMode: 'single' | 'range' | 'all';
  setSalesReportPeriodMode: (v: 'single' | 'range' | 'all') => void;
  salesReportStartDate: string;
  setSalesReportStartDate: (v: string) => void;
  salesReportEndDate: string;
  setSalesReportEndDate: (v: string) => void;
  handlePrintDailySalesReport: (start?: string, end?: string) => void;
  handlePrintA4Invoice: (billData: any) => void;
  handlePrintThermalReceipt: (billData: any) => void;
  handleOpenInvoicePrintModal: (billData: any, format?: 'a4' | 'thermal') => void;
  onVoidInvoice?: (invoiceNo: string) => void;
  currentUser?: any;
}

export const PharmacyInvoiceLogsTab: React.FC<PharmacyInvoiceLogsTabProps> = ({
  activeSubTab,
  invoices,
  invoiceDetails,
  items,
  patients,
  selectedDailyReportDate,
  setSelectedDailyReportDate,
  salesReportPeriodMode,
  setSalesReportPeriodMode,
  salesReportStartDate,
  setSalesReportStartDate,
  salesReportEndDate,
  setSalesReportEndDate,
  handlePrintDailySalesReport,
  handlePrintA4Invoice,
  handlePrintThermalReceipt,
  handleOpenInvoicePrintModal,
  onVoidInvoice,
  currentUser,
  setPrintBillData,
  setPrintModalOpen
}) => {
  
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedShiftFilter, setSelectedShiftFilter] = React.useState<'all' | '1' | '2'>('all');
  const [searchHistoryQuery, setSearchHistoryQuery] = React.useState('');
  const [showAllInvoicesInHistory, setShowAllInvoicesInHistory] = React.useState(false);

  const isAdmin = currentUser?.Role === 'Administrator' ||
    currentUser?.Role?.toLowerCase() === 'admin' ||
    currentUser?.Role?.toLowerCase() === 'administrator' ||
    currentUser?.LoginName?.toLowerCase() === 'admin';

  // Security guard: If non-admin, automatically reset to daily mode
  React.useEffect(() => {
    if (!isAdmin) {
      if (salesReportPeriodMode === 'range' || salesReportPeriodMode === 'all' || showAllInvoicesInHistory) {
        setSalesReportPeriodMode('daily');
        setSelectedDailyReportDate(todayStr);
        setShowAllInvoicesInHistory(false);
      }
    }
  }, [isAdmin, salesReportPeriodMode, showAllInvoicesInHistory, setSalesReportPeriodMode, setSelectedDailyReportDate, todayStr]);

  const getPatientName = (id: string) => {
    const p = patients.find((pat) => pat.PatientID === id);
    return p ? p.PatientName : 'Walk-in Customer';
  };

  const filteredInvoices = React.useMemo(() => {
    return invoices.filter((inv) => {
      const invDate = String(inv.InvoiceDate || '').trim().slice(0, 10);
      let matchesPeriod = true;
      if (!isAdmin) {
        matchesPeriod = invDate === (selectedDailyReportDate || todayStr);
      } else if (!showAllInvoicesInHistory) {
        if (salesReportPeriodMode === 'range') {
          matchesPeriod = invDate >= salesReportStartDate && invDate <= salesReportEndDate;
        } else if (salesReportPeriodMode === 'all') {
          matchesPeriod = true;
        } else {
          matchesPeriod = invDate === (selectedDailyReportDate || todayStr);
        }
      }

      const matchesShift = selectedShiftFilter === 'all' || String(inv.shift) === selectedShiftFilter;
      const pName = getPatientName(inv.PatientID).toLowerCase();
      const q = searchHistoryQuery.toLowerCase().trim();
      const matchesSearch = !q || (inv.InvoiceNo && inv.InvoiceNo.toLowerCase().includes(q)) || pName.includes(q) || (inv.PatientID && inv.PatientID.toLowerCase().includes(q));

      return matchesPeriod && matchesShift && matchesSearch;
    });
  }, [invoices, salesReportPeriodMode, salesReportStartDate, salesReportEndDate, selectedDailyReportDate, todayStr, showAllInvoicesInHistory, selectedShiftFilter, searchHistoryQuery, patients]);

  const periodSalesSummary = React.useMemo(() => {
    let totalInvoices = filteredInvoices.length;
    let totalUnits = 0;
    let grossAmount = 0;
    let discount = 0;
    let netAmount = 0;
    let shift1Net = 0;
    let shift2Net = 0;

    filteredInvoices.forEach((inv) => {
      const details = invoiceDetails.filter((d) => d.InvoiceNo === inv.InvoiceNo);
      let detailsGross = 0;
      details.forEach((d) => {
        totalUnits += Number(d.Qty || 0);
        detailsGross += (Number(d.Qty || 0) * Number(d.Price || 0));
      });

      const invNet = Number(inv.NetAmount ?? (inv as any).Total ?? 0);
      const invDisc = Number(inv.Discount || 0);
      // Accurate gross calculation:
      // In InvoiceHeader, GAmount is Gross Amount before discount.
      // If GAmount is missing, 0, or improperly stored equal to NetAmount while Discount > 0,
      // fallback to detailsGross or (NetAmount + Discount).
      let invGross = Number(inv.GAmount ?? (inv as any).GrossAmount ?? 0);
      if (invGross <= 0 || (invGross === invNet && invDisc > 0)) {
        invGross = detailsGross > 0 ? detailsGross : (invNet + invDisc);
      }

      grossAmount += invGross;
      discount += invDisc;
      netAmount += invNet;
      if (inv.shift === 1) shift1Net += invNet;
      if (inv.shift === 2) shift2Net += invNet;
    });

    return {
      totalInvoices,
      totalUnits,
      grossAmount,
      discount,
      netAmount,
      shift1Net,
      shift2Net
    };
  }, [filteredInvoices, invoiceDetails]);

  if (activeSubTab !== 'invoice_logs') return null;

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4 animate-fadeIn" id="today-receipts-history">
          <div className="flex flex-col xl:flex-row xl:items-center justify-between border-b border-slate-100 pb-4 gap-4">
            <div className="flex items-center space-x-2.5">
              <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                <History className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-950">Invoice logs & Sales Reports</h3>
                <p className="text-[11px] text-slate-500 font-medium">History of issued medicine bills with A4 invoices, thermal slips, and customizable daily / periodic sales audit reports</p>
              </div>
            </div>

            {/* Print & Action Trigger */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  if (isAdmin && salesReportPeriodMode === 'range') {
                    handlePrintDailySalesReport(salesReportStartDate, salesReportEndDate);
                  } else if (isAdmin && salesReportPeriodMode === 'all') {
                    handlePrintDailySalesReport();
                  } else {
                    handlePrintDailySalesReport(selectedDailyReportDate || todayStr);
                  }
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-extrabold text-xs rounded-xl shadow-sm flex items-center space-x-1.5 transition cursor-pointer whitespace-nowrap"
                title="Print sales audit report on A4 paper"
              >
                <Printer className="w-4 h-4 shrink-0" />
                <span>Print</span>
              </button>
            </div>
          </div>

          {/* PERIOD SELECTION & ADVANCED FILTER TOOLBAR */}
          <div className="bg-slate-50 border border-slate-200/80 p-3.5 rounded-xl space-y-3">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              {/* Presets / Period Mode Tabs */}
              <div className="flex flex-wrap items-center gap-1.5 bg-white border border-slate-200 p-1 rounded-xl shadow-xs text-xs font-bold">
                <button
                  type="button"
                  onClick={() => {
                    setSalesReportPeriodMode('daily');
                    setSelectedDailyReportDate(todayStr);
                    setShowAllInvoicesInHistory(false);
                  }}
                  className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                    salesReportPeriodMode === 'daily' && selectedDailyReportDate === todayStr
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSalesReportPeriodMode('daily');
                    const yesterday = new Date();
                    yesterday.setDate(yesterday.getDate() - 1);
                    setSelectedDailyReportDate(yesterday.toISOString().split('T')[0]);
                    setShowAllInvoicesInHistory(false);
                  }}
                  className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                    salesReportPeriodMode === 'daily' && selectedDailyReportDate !== todayStr
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  Specific Date
                </button>
                {isAdmin && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setSalesReportPeriodMode('range');
                        const d = new Date();
                        d.setDate(1);
                        setSalesReportStartDate(d.toISOString().split('T')[0]);
                        setSalesReportEndDate(todayStr);
                        setShowAllInvoicesInHistory(false);
                      }}
                      className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                        salesReportPeriodMode === 'range'
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      📅 Custom Period
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSalesReportPeriodMode('all');
                        setShowAllInvoicesInHistory(true);
                      }}
                      className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                        salesReportPeriodMode === 'all'
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      All History ({invoices.length})
                    </button>
                  </>
                )}
              </div>

              {/* Shift & Search Filters */}
              <div className="flex flex-wrap items-center gap-2.5">
                {/* Shift Selector */}
                <div className="flex items-center space-x-1.5 bg-white border border-slate-200 px-2.5 py-1.5 rounded-xl shadow-xs">
                  <span className="text-xxs font-bold text-slate-500 uppercase">Shift:</span>
                  <select
                    value={selectedShiftFilter}
                    onChange={(e) => setSelectedShiftFilter(e.target.value as any)}
                    className="text-xs bg-transparent border-0 font-bold text-slate-800 focus:outline-none cursor-pointer"
                  >
                    <option value="all">All Shifts</option>
                    <option value="1">☀️ Morning (Shift 1)</option>
                    <option value="2">🌙 Evening (Shift 2)</option>
                  </select>
                </div>

                {/* Search Bar */}
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search invoice or patient..."
                    value={searchHistoryQuery}
                    onChange={(e) => setSearchHistoryQuery(e.target.value)}
                    className="w-full sm:w-48 text-xs border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white shadow-xs transition"
                  />
                </div>
              </div>
            </div>

            {/* Custom Date Pickers (Shown when Daily or Custom Period is Active) */}
            {salesReportPeriodMode === 'daily' && (
              <div className="flex items-center space-x-2 pt-1 border-t border-slate-200/60">
                <span className="text-xs font-bold text-slate-600 flex items-center space-x-1">
                  <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Selected Date:</span>
                </span>
                <input
                  type="date"
                  value={selectedDailyReportDate}
                  onChange={(e) => setSelectedDailyReportDate(e.target.value)}
                  className="text-xs bg-white border border-slate-200 px-3 py-1 rounded-lg font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-xs cursor-pointer"
                />
                <span className="text-xxs font-semibold text-slate-400">
                  Showing sales records strictly for {selectedDailyReportDate === todayStr ? "Today" : selectedDailyReportDate}
                </span>
              </div>
            )}

            {isAdmin && salesReportPeriodMode === 'range' && (
              <div className="flex flex-wrap items-center gap-3 pt-1 border-t border-slate-200/60">
                <span className="text-xs font-black text-indigo-900 flex items-center space-x-1">
                  <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Custom Date Range:</span>
                </span>
                <div className="flex items-center space-x-1.5 bg-white border border-slate-200 px-2.5 py-1 rounded-lg shadow-xs">
                  <span className="text-xxs font-bold text-slate-500 uppercase">From:</span>
                  <input
                    type="date"
                    value={salesReportStartDate}
                    onChange={(e) => setSalesReportStartDate(e.target.value)}
                    className="text-xs bg-transparent border-0 font-bold text-slate-800 focus:outline-none cursor-pointer"
                  />
                </div>
                <div className="flex items-center space-x-1.5 bg-white border border-slate-200 px-2.5 py-1 rounded-lg shadow-xs">
                  <span className="text-xxs font-bold text-slate-500 uppercase">To:</span>
                  <input
                    type="date"
                    value={salesReportEndDate}
                    onChange={(e) => setSalesReportEndDate(e.target.value)}
                    className="text-xs bg-transparent border-0 font-bold text-slate-800 focus:outline-none cursor-pointer"
                  />
                </div>
                <span className="text-xxs font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full">
                  Filtering {filteredInvoices.length} Invoices between {salesReportStartDate} and {salesReportEndDate}
                </span>
              </div>
            )}
          </div>

          {/* LIVE SUMMARY KPI METRICS STRIP */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl">
              <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider block">Invoices Filtered</span>
              <div className="text-lg font-black text-slate-900 mt-0.5">{periodSalesSummary.totalInvoices} Bills</div>
              <span className="text-[9.5px] font-medium text-slate-400 block mt-0.5">Dispatched receipts</span>
            </div>
            <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl">
              <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider block">Medicine Units Sold</span>
              <div className="text-lg font-black text-sky-900 mt-0.5">{periodSalesSummary.totalUnits.toLocaleString()} Units</div>
              <span className="text-[9.5px] font-medium text-sky-600/70 block mt-0.5">Dispensed items</span>
            </div>
            <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl">
              <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider block">Gross Sales</span>
              <div className="text-lg font-black text-slate-800 mt-0.5 font-mono">Rs. {periodSalesSummary.grossAmount.toLocaleString()}</div>
              <span className="text-[9.5px] font-medium text-slate-500 block mt-0.5">Pre-discount subtotal</span>
            </div>
            <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl">
              <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider block">Total Discounts</span>
              <div className="text-lg font-black text-rose-600 mt-0.5 font-mono">- Rs. {periodSalesSummary.discount.toLocaleString()}</div>
              <span className="text-[9.5px] font-medium text-rose-500 block mt-0.5">
                {periodSalesSummary.grossAmount > 0 ? ((periodSalesSummary.discount / periodSalesSummary.grossAmount) * 100).toFixed(1) : '0'}% conceded
              </span>
            </div>
            <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl col-span-2 sm:col-span-1">
              <span className="text-[10px] font-extrabold uppercase text-emerald-800 tracking-wider block">Net Realized Cash</span>
              <div className="text-lg font-black text-emerald-700 mt-0.5 font-mono">Rs. {periodSalesSummary.netAmount.toLocaleString()}</div>
              <div className="text-[9.5px] font-semibold text-emerald-900/80 mt-0.5">
                ☀️ Rs. {periodSalesSummary.shift1Net.toLocaleString()} • 🌙 Rs. {periodSalesSummary.shift2Net.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Invoices List Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 uppercase text-xxs font-bold">
                  <th className="py-2.5 font-bold">Invoice Ref</th>
                  <th className="py-2.5 font-bold">Patient / Customer</th>
                  <th className="py-2.5 font-bold">Shift & Date</th>
                  <th className="py-2.5 font-bold">Dispatched Medications (Rx)</th>
                  <th className="py-2.5 text-right font-bold">Net Total Paid</th>
                  <th className="py-2.5 text-center font-bold">Print & Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400 font-semibold bg-slate-50/50 rounded-lg">
                      No medicine dispatch receipts match the selected date or search filter.
                    </td>
                  </tr>
                ) : (
                  filteredInvoices.map((inv) => {
                    const patientName = getPatientName(inv.PatientID);
                    const isToday = inv.InvoiceDate === new Date().toISOString().split('T')[0];
                    const details = invoiceDetails.filter((d) => d.InvoiceNo === inv.InvoiceNo);
                    const basket = details.map((d) => ({
                      ItemID: d.ItemID,
                      Qty: d.Qty,
                      Price: d.Price,
                      MedicineType: d.MedicineType
                    }));
                    const billObj = {
                      patient: patients.find((p) => p.PatientID === inv.PatientID) || null,
                      basket: basket,
                      discount: inv.Discount,
                      netAmount: inv.NetAmount,
                      shift: inv.shift,
                      invoiceNo: inv.InvoiceNo,
                      invoiceDate: inv.InvoiceDate
                    };

                    return (
                      <tr key={inv.InvoiceNo} className="hover:bg-slate-50/50 group transition duration-150">
                        <td className="py-3 font-mono font-bold text-xs text-slate-900">
                          <span className="block">{inv.InvoiceNo}</span>
                          <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider mt-1 ${inv.Status === 2 ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-amber-100 text-amber-800 border border-amber-200'}`}>
                            {inv.Status === 2 ? 'Posted' : 'Draft'}
                          </span>
                        </td>
                        <td className="py-3">
                          <span className="font-bold text-slate-800 block text-xs">{patientName}</span>
                          <span className="text-xxs text-slate-400 font-mono block">ID: {inv.PatientID || 'Walk-in'}</span>
                        </td>
                        <td className="py-3">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${inv.shift === 1 ? 'bg-orange-50 text-orange-700 border border-orange-100' : 'bg-purple-50 text-purple-700 border border-purple-100'}`}>
                            {inv.shift === 1 ? 'Morning (1)' : 'Evening (2)'}
                          </span>
                          <span className="text-xxs text-slate-400 font-mono block mt-1">{inv.InvoiceDate} {isToday && '• Today'}</span>
                        </td>
                        <td className="py-3 max-w-xs">
                          <div className="flex flex-wrap gap-1">
                            {details.map((d, idx) => {
                              const item = items.find((itm) => itm.ItemID === d.ItemID);
                              return (
                                <span key={`${d.ItemID}-${idx}`} className="inline-flex items-center px-1.5 py-0.5 rounded text-xxs font-semibold bg-slate-100 text-slate-700 border border-slate-200/60 hover:bg-slate-200 transition">
                                  {item ? item.ItemName : d.ItemID} <span className="text-[10px] text-slate-400 ml-1 font-mono">x{d.Qty}</span>
                                </span>
                              );
                            })}
                          </div>
                        </td>
                        <td className="py-3 text-right font-mono text-slate-900">
                          <span className="font-bold text-sm block">Rs. {Number(inv.NetAmount || 0).toLocaleString()}</span>
                          {Number(inv.Discount || 0) > 0 && (
                            <span className="text-[10px] text-rose-600 font-medium block">
                              Disc: -Rs. {Number(inv.Discount).toLocaleString()}
                              <span className="text-slate-400 font-sans ml-1 text-[9px]">
                                (Gross: Rs. {Number(inv.GAmount && inv.GAmount > inv.NetAmount ? inv.GAmount : (Number(inv.NetAmount || 0) + Number(inv.Discount || 0))).toLocaleString()})
                              </span>
                            </span>
                          )}
                        </td>
                        <td className="py-3 text-center">
                          <div className="flex items-center justify-center space-x-1">
                            {/* A4 Print Button */}
                            <button
                              type="button"
                              onClick={() => handlePrintA4Invoice(billObj)}
                              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xxs font-bold rounded border border-slate-300 transition flex items-center cursor-pointer shadow-xs"
                              title="Print full A4 size invoice"
                            >
                              <FileText className="w-3 h-3 mr-1 text-slate-600" />
                              A4 Print
                            </button>

                            {/* Thermal Slip Print Button */}
                            <button
                              type="button"
                              onClick={() => handlePrintThermalReceipt(billObj)}
                              className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xxs font-bold rounded border border-emerald-300 transition flex items-center cursor-pointer shadow-xs"
                              title="Print 80mm POS customer thermal receipt"
                            >
                              <Receipt className="w-3 h-3 mr-1 text-emerald-600" />
                              Thermal
                            </button>

                            {/* Preview Modal Button */}
                            <button
                              type="button"
                              onClick={() => {
                                setPrintBillData?.(billObj);
                                setPrintModalOpen?.(true);
                              }}
                              className="p-1 bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 rounded transition flex items-center justify-center cursor-pointer"
                              title="Open visual print preview"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
  );
};

export default PharmacyInvoiceLogsTab;
