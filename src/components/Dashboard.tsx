/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  Users,
  CalendarDays,
  CalendarRange,
  Calendar,
  Sun,
  Moon,
  Activity,
  DollarSign,
  AlertTriangle,
  FileCheck,
  TrendingUp,
  Clock,
  ShoppingBag,
  Layers,
  Sparkles,
  ArrowUpRight,
  Filter,
  CheckCircle2,
  Receipt,
  Building2,
  PieChart,
  BarChart3,
  Pill,
  CreditCard,
  Stethoscope,
  SlidersHorizontal,
  History,
  Eye,
  X,
  Percent
} from 'lucide-react';
import {
  Patient,
  Appointment,
  Token,
  Item,
  TLAccount,
  Config,
  VchHeader,
  InvoiceHeader,
  InvoiceDetail,
  SRInvHeader,
  Visit
} from '../types';

interface DashboardProps {
  patients: Patient[];
  appointments: Appointment[];
  tokens: Token[];
  items: Item[];
  accounts: TLAccount[];
  config: Config;
  vouchers: VchHeader[];
  invoices?: InvoiceHeader[];
  invoiceDetails?: InvoiceDetail[];
  salesReturns?: SRInvHeader[];
  visits?: Visit[];
}

export default function Dashboard({
  patients,
  appointments,
  tokens,
  items,
  accounts,
  config,
  vouchers,
  invoices = [],
  invoiceDetails = [],
  salesReturns = [],
  visits = []
}: DashboardProps) {
  // Operational / Filter States
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonthNum = (now.getMonth() + 1).toString().padStart(2, '0');
  const currentYearMonth = `${currentYear}-${currentMonthNum}`; // e.g. "2026-08"

  const [dateFilter, setDateFilter] = useState<'today' | 'this_week' | 'this_month' | 'this_year' | 'month_select' | 'custom' | 'all'>('month_select');
  const [selectedMonthYear, setSelectedMonthYear] = useState<string>(currentYearMonth);
  const [shiftFilter, setShiftFilter] = useState<'all' | 'morning' | 'evening'>('all');
  const [showProfitCogsModal, setShowProfitCogsModal] = useState<boolean>(false);
  const todayStr = new Date().toISOString().split('T')[0]; // Current dynamic system date
  const [customStartDate, setCustomStartDate] = useState<string>(todayStr);
  const [customEndDate, setCustomEndDate] = useState<string>(todayStr);

  // Helper to extract clean YYYY-MM-DD from any date representation
  const getNormalizedYMD = (dateField?: any): string => {
    if (!dateField) return '';
    if (typeof dateField === 'string') {
      const trimmed = dateField.trim();
      if (trimmed.includes('T')) {
        return trimmed.split('T')[0];
      }
      if (trimmed.includes(' ')) {
        const first = trimmed.split(' ')[0].replace(/\//g, '-');
        if (first.length === 10 && first.startsWith('20')) return first;
      }
      if (trimmed.includes('/')) {
        const parts = trimmed.split('/');
        if (parts[0].length === 4) {
          return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
        } else if (parts[2]?.length === 4) {
          return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
        }
      }
      if (trimmed.includes('-')) {
        const parts = trimmed.split('-');
        if (parts[0].length === 4) {
          return `${parts[0]}-${parts[1].padStart(2, '0')}-${(parts[2] || '01').slice(0, 2).padStart(2, '0')}`;
        } else if (parts[2]?.length === 4) {
          return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
        }
      }
      return trimmed.slice(0, 10);
    }
    if (dateField instanceof Date && !isNaN(dateField.getTime())) {
      return dateField.toISOString().split('T')[0];
    }
    return '';
  };

  // Month labels list for the dropdown (Months of Current Year + any months found in database)
  const monthOptions = useMemo(() => {
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    // Collect all distinct months from data to ensure historical months are always selectable
    const ymSet = new Set<string>();
    
    // Add current year months
    for (let m = 1; m <= 12; m++) {
      ymSet.add(`${currentYear}-${m.toString().padStart(2, '0')}`);
    }

    // Add previous year months
    for (let m = 1; m <= 12; m++) {
      ymSet.add(`${currentYear - 1}-${m.toString().padStart(2, '0')}`);
    }

    // Scan existing data for any extra recorded months
    const scanDates = (arr: any[], field: string) => {
      arr.forEach(item => {
        if (item && item[field]) {
          const ymd = getNormalizedYMD(item[field]);
          if (ymd && ymd.length >= 7) {
            ymSet.add(ymd.slice(0, 7));
          }
        }
      });
    };

    scanDates(appointments, 'AppointmentDate');
    scanDates(tokens, 'Date');
    scanDates(invoices, 'InvoiceDate');
    scanDates(salesReturns, 'ReturnDate');
    scanDates(visits, 'VisitDate');

    // Sort descending (most recent first)
    const sorted = Array.from(ymSet).sort().reverse();

    return sorted.map(ym => {
      const [y, mStr] = ym.split('-');
      const mIndex = parseInt(mStr, 10) - 1;
      const mName = monthNames[mIndex] || `Month ${mStr}`;
      const isCurrent = ym === currentYearMonth;
      return {
        value: ym,
        label: `${mName} ${y}${isCurrent ? ' (Current)' : ''}`,
        isCurrent
      };
    });
  }, [currentYear, currentYearMonth, appointments, tokens, invoices, salesReturns, visits]);

  // Selected month display name
  const selectedMonthLabel = useMemo(() => {
    const matched = monthOptions.find(m => m.value === selectedMonthYear);
    if (matched) return matched.label.replace(' (Current)', '');
    return selectedMonthYear;
  }, [monthOptions, selectedMonthYear]);

  const isInDateRange = (dateField?: any) => {
    if (!dateField) return false;
    const d = getNormalizedYMD(dateField);
    if (!d) return false;

    if (dateFilter === 'month_select') {
      return d.startsWith(selectedMonthYear);
    }
    if (dateFilter === 'today') {
      return d === todayStr;
    }
    if (dateFilter === 'this_week') {
      const targetDate = new Date(d);
      const now = new Date(todayStr);
      const diffTime = Math.abs(now.getTime() - targetDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 7;
    }
    if (dateFilter === 'this_month') {
      return d.startsWith(todayStr.slice(0, 7));
    }
    if (dateFilter === 'this_year') {
      return d.startsWith(todayStr.slice(0, 4));
    }
    if (dateFilter === 'custom') {
      if (customStartDate && customEndDate) {
        return d >= customStartDate && d <= customEndDate;
      }
      if (customStartDate) return d >= customStartDate;
      if (customEndDate) return d <= customEndDate;
      return true;
    }
    return true; // 'all'
  };

  // Filtered dataset references - Re-computes whenever selectedMonthYear or dateFilter changes!
  const targetApps = useMemo(() => {
    if (dateFilter === 'all') return appointments;
    return appointments.filter((a) => isInDateRange(a.AppointmentDate));
  }, [appointments, dateFilter, selectedMonthYear, todayStr, customStartDate, customEndDate]);

  const targetTokens = useMemo(() => {
    if (dateFilter === 'all') return tokens;
    return tokens.filter((t) => isInDateRange(t.Date));
  }, [tokens, dateFilter, selectedMonthYear, todayStr, customStartDate, customEndDate]);

  const targetInvoices = useMemo(() => {
    if (dateFilter === 'all') return invoices;
    return invoices.filter((i) => isInDateRange(i.InvoiceDate));
  }, [invoices, dateFilter, selectedMonthYear, todayStr, customStartDate, customEndDate]);

  const targetSalesReturns = useMemo(() => {
    if (dateFilter === 'all') return salesReturns;
    return salesReturns.filter((r) => isInDateRange(r.ReturnDate));
  }, [salesReturns, dateFilter, selectedMonthYear, todayStr, customStartDate, customEndDate]);

  const targetVisits = useMemo(() => {
    if (dateFilter === 'all') return visits;
    return visits.filter((v) => isInDateRange(v.VisitDate));
  }, [visits, dateFilter, selectedMonthYear, todayStr, customStartDate, customEndDate]);

  // Helper to determine shift for visit if not directly set
  const getVisitShift = (v: Visit): 1 | 2 => {
    if (v.Shift === 1 || v.Shift === 2) return v.Shift;
    const matchingApp = targetApps.find((a) => a.PatientID === v.PatientID);
    if (matchingApp && (matchingApp.Shift === 1 || matchingApp.Shift === 2)) {
      return matchingApp.Shift;
    }
    const matchingToken = targetTokens.find((t) => t.PatientID === v.PatientID);
    if (matchingToken && (matchingToken.Shift === 1 || matchingToken.Shift === 2)) {
      return matchingToken.Shift;
    }
    return 1; // Default to Morning Shift
  };

  const getClinMedPayment = (v: Visit) => Number(v.ClinicalMedicinePayment) || 0;
  const getCardFileFee = (v: Visit) => (Number(v.CardFee) || Number(v.CardsPayment) || 0) + (Number(v.FileFee) || 0);

  // Clinical Medicine Payments Shift-wise
  const morningClinMed = targetVisits.filter((v) => getVisitShift(v) === 1).reduce((sum, v) => sum + getClinMedPayment(v), 0);
  const eveningClinMed = targetVisits.filter((v) => getVisitShift(v) === 2).reduce((sum, v) => sum + getClinMedPayment(v), 0);
  const totalClinMedCollection = morningClinMed + eveningClinMed;

  // Card & Registration Fees Shift-wise
  const morningCardFileFee = targetVisits.filter((v) => getVisitShift(v) === 1).reduce((sum, v) => sum + getCardFileFee(v), 0);
  const eveningCardFileFee = targetVisits.filter((v) => getVisitShift(v) === 2).reduce((sum, v) => sum + getCardFileFee(v), 0);
  const totalCardFileFeeCollection = morningCardFileFee + eveningCardFileFee;

  // --- 1. DAILY OPD COLLECTION SHIFT-WISE ---
  const morningOpdApps = targetApps.filter((a) => (a.Shift || 1) === 1 && a.Status !== 3);
  const eveningOpdApps = targetApps.filter((a) => a.Shift === 2 && a.Status !== 3);

  const morningOpdAppFees = morningOpdApps.reduce((acc, curr) => acc + (Number(curr.FeeCharged) || 0), 0);
  const eveningOpdAppFees = eveningOpdApps.reduce((acc, curr) => acc + (Number(curr.FeeCharged) || 0), 0);

  const morningOpdVisitFees = targetVisits.filter((v) => getVisitShift(v) === 1 && (v as any).Status !== 3).reduce((acc, v) => {
    const fee = Number(v.ConsultationFee) || 0;
    const hasAppFee = morningOpdApps.some(a => a.PatientID === v.PatientID && (Number(a.FeeCharged) || 0) > 0);
    return acc + (hasAppFee ? 0 : fee);
  }, 0);

  const eveningOpdVisitFees = targetVisits.filter((v) => getVisitShift(v) === 2 && (v as any).Status !== 3).reduce((acc, v) => {
    const fee = Number(v.ConsultationFee) || 0;
    const hasAppFee = eveningOpdApps.some(a => a.PatientID === v.PatientID && (Number(a.FeeCharged) || 0) > 0);
    return acc + (hasAppFee ? 0 : fee);
  }, 0);

  const morningOpdConsultation = morningOpdAppFees + morningOpdVisitFees;
  const eveningOpdConsultation = eveningOpdAppFees + eveningOpdVisitFees;
  const totalOpdConsultation = morningOpdConsultation + eveningOpdConsultation;

  const morningOpdCollection = morningOpdConsultation + morningClinMed + morningCardFileFee;
  const eveningOpdCollection = eveningOpdConsultation + eveningClinMed + eveningCardFileFee;
  const totalOpdCollection = morningOpdCollection + eveningOpdCollection;

  // --- 2. STORE / PHARMACY COLLECTION SHIFT-WISE ---
  const morningInvoices = targetInvoices.filter((i) => i.shift === 1 && (i as any).Status !== 3);
  const eveningInvoices = targetInvoices.filter((i) => i.shift === 2 && (i as any).Status !== 3);

  const morningReturns = targetSalesReturns.filter((r) => r.shift === 1);
  const eveningReturns = targetSalesReturns.filter((r) => r.shift === 2);

  const morningStoreGross = morningInvoices.reduce((acc, curr) => acc + (curr.NetAmount || 0), 0);
  const morningStoreReturns = morningReturns.reduce((acc, curr) => acc + (curr.NetPaid || 0), 0);
  const morningStoreCollection = Math.max(0, morningStoreGross - morningStoreReturns);

  const eveningStoreGross = eveningInvoices.reduce((acc, curr) => acc + (curr.NetAmount || 0), 0);
  const eveningStoreReturns = eveningReturns.reduce((acc, curr) => acc + (curr.NetPaid || 0), 0);
  const eveningStoreCollection = Math.max(0, eveningStoreGross - eveningStoreReturns);

  const totalStoreCollection = morningStoreCollection + eveningStoreCollection;

  // --- STORE COGS (PURCHASE COST) & NET GROSS PROFIT / MARGIN CALCULATIONS ---
  const calculateShiftCogs = (shiftInvoices: InvoiceHeader[], shiftReturns: SRInvHeader[]) => {
    let totalCogs = 0;
    
    // Fast lookup map for items
    const itemMap = new Map<string, Item>();
    items.forEach(it => {
      if (it.ItemID) itemMap.set(String(it.ItemID).toUpperCase(), it);
      if (it.ItemName) itemMap.set(String(it.ItemName).toLowerCase(), it);
    });

    // Group invoice details by InvoiceNo
    const detailsByInvoice = new Map<string, InvoiceDetail[]>();
    invoiceDetails.forEach(d => {
      const invNo = String(d.InvoiceNo || '');
      if (invNo) {
        const existing = detailsByInvoice.get(invNo) || [];
        existing.push(d);
        detailsByInvoice.set(invNo, existing);
      }
    });

    shiftInvoices.forEach(inv => {
      const invNo = String(inv.InvoiceNo || '');
      const details = detailsByInvoice.get(invNo);

      if (details && details.length > 0) {
        details.forEach(d => {
          const itemKey = String(d.ItemID || '').trim();
          const item = itemMap.get(itemKey.toUpperCase()) || itemMap.get(itemKey.toLowerCase());
          const unitPurCost = (item?.PurchasePrice && Number(item.PurchasePrice) > 0)
            ? Number(item.PurchasePrice)
            : ((item as any)?.TP && Number((item as any).TP) > 0 ? Number((item as any).TP) : (d.Price ? Math.round(d.Price * 0.75) : 0));
          const lineQty = Number(d.Qty) || 0;
          totalCogs += lineQty * unitPurCost;
        });
      } else {
        // Fallback for summarized invoices: standard estimated purchase cost (~75%)
        const invNet = Number(inv.NetAmount) || 0;
        totalCogs += Math.round(invNet * 0.75);
      }
    });

    // Adjust for returns
    const returnNet = shiftReturns.reduce((sum, r) => sum + (Number(r.NetPaid) || 0), 0);
    const returnCogs = Math.round(returnNet * 0.75);
    const finalCogs = Math.max(0, Math.round(totalCogs - returnCogs));

    return finalCogs;
  };

  const morningStoreCogs = calculateShiftCogs(morningInvoices, morningReturns);
  const eveningStoreCogs = calculateShiftCogs(eveningInvoices, eveningReturns);
  const totalStoreCogs = morningStoreCogs + eveningStoreCogs;

  const morningStoreGrossProfit = Math.max(0, morningStoreCollection - morningStoreCogs);
  const eveningStoreGrossProfit = Math.max(0, eveningStoreCollection - eveningStoreCogs);
  const totalStoreGrossProfit = Math.max(0, totalStoreCollection - totalStoreCogs);

  const morningStoreMarginPct = morningStoreCollection > 0 ? (morningStoreGrossProfit / morningStoreCollection) * 100 : 0;
  const eveningStoreMarginPct = eveningStoreCollection > 0 ? (eveningStoreGrossProfit / eveningStoreCollection) * 100 : 0;
  const totalStoreMarginPct = totalStoreCollection > 0 ? (totalStoreGrossProfit / totalStoreCollection) * 100 : 0;

  const activeStoreCollection = shiftFilter === 'morning' ? morningStoreCollection : shiftFilter === 'evening' ? eveningStoreCollection : totalStoreCollection;
  const activeStoreCogs = shiftFilter === 'morning' ? morningStoreCogs : shiftFilter === 'evening' ? eveningStoreCogs : totalStoreCogs;
  const activeStoreGrossProfit = shiftFilter === 'morning' ? morningStoreGrossProfit : shiftFilter === 'evening' ? eveningStoreGrossProfit : totalStoreGrossProfit;
  const activeStoreMarginPct = shiftFilter === 'morning' ? morningStoreMarginPct : shiftFilter === 'evening' ? eveningStoreMarginPct : totalStoreMarginPct;

  // --- 3. TOTAL PAYMENT COLLECTION BOTH SHIFTS ---
  const morningTotalPayment = morningOpdCollection + morningStoreCollection;
  const eveningTotalPayment = eveningOpdCollection + eveningStoreCollection;
  const combinedTotalPayment = morningTotalPayment + eveningTotalPayment;

  // --- 4. NUMBER OF PATIENTS SHIFT-WISE (ACCURATE AUDIT COUNT) ---
  const morningTokens = targetTokens.filter((t) => (t.Shift || 1) === 1 && t.Status !== 3);
  const eveningTokens = targetTokens.filter((t) => t.Shift === 2 && t.Status !== 3);

  const getUniquePatientCountForShift = (shiftNum: 1 | 2) => {
    const datesSet = new Set<string>();
    targetApps.forEach(a => { const d = getNormalizedYMD(a.AppointmentDate); if (d) datesSet.add(d); });
    targetTokens.forEach(t => { const d = getNormalizedYMD(t.Date); if (d) datesSet.add(d); });
    targetVisits.forEach(v => { const d = getNormalizedYMD(v.VisitDate); if (d) datesSet.add(d); });

    let totalUniqueVisits = 0;

    datesSet.forEach(dateStr => {
      const shiftApps = targetApps.filter(a => getNormalizedYMD(a.AppointmentDate) === dateStr && (a.Shift || 1) === shiftNum && a.Status !== 3);
      const shiftTokens = targetTokens.filter(t => getNormalizedYMD(t.Date) === dateStr && (t.Shift || 1) === shiftNum && t.Status !== 3);
      const shiftVisits = targetVisits.filter(v => getNormalizedYMD(v.VisitDate) === dateStr && getVisitShift(v) === shiftNum && (v as any).Status !== 3);

      const patientSet = new Set<string>();
      shiftApps.forEach(a => {
        if (a.PatientID) patientSet.add(a.PatientID);
        else patientSet.add(`app-${a.AppointmentID}`);
      });
      shiftTokens.forEach(t => {
        if (t.PatientID) patientSet.add(t.PatientID);
        else patientSet.add(`tok-${t.TokenNo}`);
      });
      shiftVisits.forEach(v => {
        if (v.PatientID) patientSet.add(v.PatientID);
        else patientSet.add(`vis-${v.VisitID}`);
      });

      totalUniqueVisits += patientSet.size;
    });

    if (totalUniqueVisits === 0) {
      const shiftApps = targetApps.filter(a => (a.Shift || 1) === shiftNum && a.Status !== 3);
      const shiftTokens = targetTokens.filter(t => (t.Shift || 1) === shiftNum && t.Status !== 3);
      const shiftVisits = targetVisits.filter(v => getVisitShift(v) === shiftNum && (v as any).Status !== 3);

      const patientSet = new Set<string>();
      shiftApps.forEach(a => patientSet.add(a.PatientID || `app-${a.AppointmentID}`));
      shiftTokens.forEach(t => patientSet.add(t.PatientID || `tok-${t.TokenNo}`));
      shiftVisits.forEach(v => patientSet.add(v.PatientID || `vis-${v.VisitID}`));

      totalUniqueVisits = patientSet.size;
    }

    return totalUniqueVisits;
  };

  const morningPatientsCount = getUniquePatientCountForShift(1);
  const eveningPatientsCount = getUniquePatientCountForShift(2);
  const totalPatientsShiftCount = morningPatientsCount + eveningPatientsCount;

  // --- 5. GRAND TOTAL COLLECTION BOTH SHIFTS + STORE COLLECTION ---
  const grandTotalCollection = totalOpdCollection + totalStoreCollection;

  // Account balances mapping
  const getAccountBalance = (tlid: number) => {
    const acc = accounts.find((a) => a.TLID === tlid);
    return acc ? acc.AcBalance : 0;
  };

  const clinicCash = getAccountBalance(config.ClinicCIH_);
  const storeCash = getAccountBalance(config.StoreCIH_);
  const appCash = getAccountBalance(config.AppCIH_);
  const bankBal = getAccountBalance(101004);
  const totalCashAndBank = clinicCash + storeCash + appCash + bankBal;

  // Inventory & Vouchers
  const lowStockItems = items.filter((item) => item.CStock <= ((item.MinStock !== undefined && item.MinStock !== null) ? item.MinStock : 1));
  const postedVchCount = vouchers.filter((v) => v.Status === 2).length;

  // Ratios for visual progress bars
  const morningRatio = combinedTotalPayment > 0 ? Math.round((morningTotalPayment / combinedTotalPayment) * 100) : 50;
  const eveningRatio = combinedTotalPayment > 0 ? 100 - morningRatio : 50;

  const opdRatio = grandTotalCollection > 0 ? Math.round((totalOpdCollection / grandTotalCollection) * 100) : 50;
  const storeRatio = grandTotalCollection > 0 ? 100 - opdRatio : 50;

  return (
    <div className="p-6 md:p-8 space-y-6 md:space-y-8 overflow-y-auto flex-1 bg-slate-50 text-slate-800" id="cms-dashboard">
      
      {/* Top Header & Operational Filters */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">Shift-wise Financial & Operational Dashboard</h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">Real-time daily collection, store revenue, and shift analytics</p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Operational Date / Scope Indicator */}
          <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600">
            <Clock className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span>
              Scope:{' '}
              <strong className="text-slate-900 font-bold">
                {dateFilter === 'month_select'
                  ? `📅 ${selectedMonthLabel}`
                  : dateFilter === 'today'
                  ? 'Daily (Today)'
                  : dateFilter === 'this_week'
                  ? 'Weekly (Past 7 Days)'
                  : dateFilter === 'this_month'
                  ? 'Monthly (This Month)'
                  : dateFilter === 'this_year'
                  ? `Yearly (Full Year ${currentYear})`
                  : dateFilter === 'custom'
                  ? `${customStartDate} to ${customEndDate}`
                  : 'All Time History'}
              </strong>
            </span>
          </div>

          {/* Month-wise Fiscal Dropdown Selector */}
          <div className="flex items-center space-x-1.5 bg-blue-50/80 border-2 border-blue-300 px-2.5 py-1 rounded-xl shadow-2xs">
            <Calendar className="w-4 h-4 text-blue-700 shrink-0" />
            <span className="text-[10px] font-black uppercase tracking-wider text-blue-950 shrink-0">Month:</span>
            <select
              value={dateFilter === 'month_select' ? selectedMonthYear : ''}
              onChange={(e) => {
                if (e.target.value) {
                  setSelectedMonthYear(e.target.value);
                  setDateFilter('month_select');
                }
              }}
              className="bg-white text-slate-900 font-extrabold text-xs rounded-lg px-2.5 py-1 border border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-600 cursor-pointer shadow-2xs font-mono"
            >
              {monthOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  📅 {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Date Scope Filter - Compact pills by default, smoothly expand label on hover/active */}
          <div className="flex flex-wrap items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs gap-1">
            {/* Daily */}
            <button
              type="button"
              onClick={() => setDateFilter('today')}
              title="Daily (Today)"
              className={`group flex items-center space-x-1 px-2 py-1 rounded-lg font-bold transition-all duration-300 cursor-pointer ${
                dateFilter === 'today' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Sun className={`w-3.5 h-3.5 shrink-0 ${dateFilter === 'today' ? 'text-amber-500' : 'text-slate-500 group-hover:text-amber-500'} transition-colors`} />
              <div className={`transition-all duration-300 ease-in-out flex items-center ${
                dateFilter === 'today'
                  ? 'max-w-[100px] opacity-100 pl-0.5'
                  : 'max-w-0 overflow-hidden group-hover:max-w-[100px] focus-within:max-w-[100px] opacity-0 group-hover:opacity-100 focus-within:opacity-100 group-hover:pl-0.5'
              }`}>
                <span className="whitespace-nowrap text-xs">Daily</span>
              </div>
            </button>

            {/* Weekly */}
            <button
              type="button"
              onClick={() => setDateFilter('this_week')}
              title="Weekly (Past 7 Days)"
              className={`group flex items-center space-x-1 px-2 py-1 rounded-lg font-bold transition-all duration-300 cursor-pointer ${
                dateFilter === 'this_week' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <CalendarRange className={`w-3.5 h-3.5 shrink-0 ${dateFilter === 'this_week' ? 'text-blue-600' : 'text-slate-500 group-hover:text-blue-600'} transition-colors`} />
              <div className={`transition-all duration-300 ease-in-out flex items-center ${
                dateFilter === 'this_week'
                  ? 'max-w-[100px] opacity-100 pl-0.5'
                  : 'max-w-0 overflow-hidden group-hover:max-w-[100px] focus-within:max-w-[100px] opacity-0 group-hover:opacity-100 focus-within:opacity-100 group-hover:pl-0.5'
              }`}>
                <span className="whitespace-nowrap text-xs">Weekly</span>
              </div>
            </button>

            {/* Yearly */}
            <button
              type="button"
              onClick={() => setDateFilter('this_year')}
              title={`Yearly (Full Year ${currentYear})`}
              className={`group flex items-center space-x-1 px-2 py-1 rounded-lg font-bold transition-all duration-300 cursor-pointer ${
                dateFilter === 'this_year' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Calendar className={`w-3.5 h-3.5 shrink-0 ${dateFilter === 'this_year' ? 'text-emerald-600' : 'text-slate-500 group-hover:text-emerald-600'} transition-colors`} />
              <div className={`transition-all duration-300 ease-in-out flex items-center ${
                dateFilter === 'this_year'
                  ? 'max-w-[100px] opacity-100 pl-0.5'
                  : 'max-w-0 overflow-hidden group-hover:max-w-[100px] focus-within:max-w-[100px] opacity-0 group-hover:opacity-100 focus-within:opacity-100 group-hover:pl-0.5'
              }`}>
                <span className="whitespace-nowrap text-xs">Full Year</span>
              </div>
            </button>

            {/* Custom Range */}
            <button
              type="button"
              onClick={() => setDateFilter('custom')}
              title="Custom Date Range"
              className={`group flex items-center space-x-1 px-2 py-1 rounded-lg font-bold transition-all duration-300 cursor-pointer ${
                dateFilter === 'custom' ? 'bg-white text-amber-700 shadow-xs border border-amber-200' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <SlidersHorizontal className={`w-3.5 h-3.5 shrink-0 ${dateFilter === 'custom' ? 'text-amber-600' : 'text-slate-500 group-hover:text-amber-600'} transition-colors`} />
              <div className={`transition-all duration-300 ease-in-out flex items-center ${
                dateFilter === 'custom'
                  ? 'max-w-[130px] opacity-100 pl-0.5'
                  : 'max-w-0 overflow-hidden group-hover:max-w-[130px] focus-within:max-w-[130px] opacity-0 group-hover:opacity-100 focus-within:opacity-100 group-hover:pl-0.5'
              }`}>
                <span className="whitespace-nowrap text-xs">Custom</span>
              </div>
            </button>

            {/* All Time */}
            <button
              type="button"
              onClick={() => setDateFilter('all')}
              title="All Time History"
              className={`group flex items-center space-x-1 px-2 py-1 rounded-lg font-bold transition-all duration-300 cursor-pointer ${
                dateFilter === 'all' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <History className={`w-3.5 h-3.5 shrink-0 ${dateFilter === 'all' ? 'text-purple-600' : 'text-slate-500 group-hover:text-purple-600'} transition-colors`} />
              <div className={`transition-all duration-300 ease-in-out flex items-center ${
                dateFilter === 'all'
                  ? 'max-w-[100px] opacity-100 pl-0.5'
                  : 'max-w-0 overflow-hidden group-hover:max-w-[100px] focus-within:max-w-[100px] opacity-0 group-hover:opacity-100 focus-within:opacity-100 group-hover:pl-0.5'
              }`}>
                <span className="whitespace-nowrap text-xs">All Time</span>
              </div>
            </button>
          </div>

          {/* Custom Date Inputs (shown when dateFilter === 'custom') */}
          {dateFilter === 'custom' && (
            <div className="flex items-center space-x-2 bg-amber-50 border border-amber-300 px-2.5 py-1 rounded-xl text-xs shadow-2xs animate-fadeIn">
              <div className="flex items-center space-x-1">
                <span className="text-[10px] font-extrabold text-amber-900 uppercase">From:</span>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="bg-white text-slate-900 font-bold text-xs rounded-lg px-2 py-1 border border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
                />
              </div>
              <div className="flex items-center space-x-1">
                <span className="text-[10px] font-extrabold text-amber-900 uppercase">To:</span>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="bg-white text-slate-900 font-bold text-xs rounded-lg px-2 py-1 border border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
                />
              </div>
            </div>
          )}

          {/* Shift Filter - Compact pills by default, smoothly expand on hover/active */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs gap-1">
            {/* Both Shifts */}
            <button
              type="button"
              onClick={() => setShiftFilter('all')}
              title="Both Shifts (Morning & Evening)"
              className={`group flex items-center space-x-1 px-2 py-1 rounded-lg font-bold transition-all duration-300 cursor-pointer ${
                shiftFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Clock className={`w-3.5 h-3.5 shrink-0 ${shiftFilter === 'all' ? 'text-indigo-600' : 'text-slate-500 group-hover:text-indigo-600'} transition-colors`} />
              <div className={`transition-all duration-300 ease-in-out flex items-center ${
                shiftFilter === 'all'
                  ? 'max-w-[120px] opacity-100 pl-0.5'
                  : 'max-w-0 overflow-hidden group-hover:max-w-[120px] focus-within:max-w-[120px] opacity-0 group-hover:opacity-100 focus-within:opacity-100 group-hover:pl-0.5'
              }`}>
                <span className="whitespace-nowrap text-xs">Both Shifts</span>
              </div>
            </button>

            {/* Morning Shift */}
            <button
              type="button"
              onClick={() => setShiftFilter('morning')}
              title="Morning Shift (Shift 1)"
              className={`group flex items-center space-x-1 px-2 py-1 rounded-lg font-bold transition-all duration-300 cursor-pointer ${
                shiftFilter === 'morning' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Sun className={`w-3.5 h-3.5 shrink-0 ${shiftFilter === 'morning' ? 'text-amber-300' : 'text-amber-500 group-hover:text-amber-600'} transition-colors`} />
              <div className={`transition-all duration-300 ease-in-out flex items-center ${
                shiftFilter === 'morning'
                  ? 'max-w-[100px] opacity-100 pl-0.5'
                  : 'max-w-0 overflow-hidden group-hover:max-w-[100px] focus-within:max-w-[100px] opacity-0 group-hover:opacity-100 focus-within:opacity-100 group-hover:pl-0.5'
              }`}>
                <span className="whitespace-nowrap text-xs">Morning</span>
              </div>
            </button>

            {/* Evening Shift */}
            <button
              type="button"
              onClick={() => setShiftFilter('evening')}
              title="Evening Shift (Shift 2)"
              className={`group flex items-center space-x-1 px-2 py-1 rounded-lg font-bold transition-all duration-300 cursor-pointer ${
                shiftFilter === 'evening' ? 'bg-purple-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Moon className={`w-3.5 h-3.5 shrink-0 ${shiftFilter === 'evening' ? 'text-purple-200' : 'text-purple-500 group-hover:text-purple-600'} transition-colors`} />
              <div className={`transition-all duration-300 ease-in-out flex items-center ${
                shiftFilter === 'evening'
                  ? 'max-w-[100px] opacity-100 pl-0.5'
                  : 'max-w-0 overflow-hidden group-hover:max-w-[100px] focus-within:max-w-[100px] opacity-0 group-hover:opacity-100 focus-within:opacity-100 group-hover:pl-0.5'
              }`}>
                <span className="whitespace-nowrap text-xs">Evening</span>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Hero Banner: Grand Total Collection Both Shift-wise with Store Collection (Compact & Space-efficient) */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white rounded-2xl p-3.5 md:p-4 shadow-md relative overflow-hidden border border-slate-800">
        <div className="absolute top-0 right-0 -mt-6 -mr-6 w-48 h-48 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-8 w-56 h-56 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-700/60">
            <div>
              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 rounded-full text-[9.5px] font-extrabold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Unified Financial Summary
                </span>
                <span className="text-[11px] text-slate-400 font-medium truncate max-w-xs sm:max-w-md">
                  {dateFilter === 'month_select'
                    ? `Monthly Shift Ledger (${selectedMonthLabel})`
                    : dateFilter === 'today'
                    ? "Today's Shift Ledger"
                    : dateFilter === 'this_week'
                    ? "Weekly Shift Ledger (Past 7 Days)"
                    : dateFilter === 'this_month'
                    ? "Monthly Shift Ledger (This Month)"
                    : dateFilter === 'this_year'
                    ? `Yearly Shift Ledger (Full Year ${currentYear})`
                    : dateFilter === 'custom'
                    ? `Custom (${customStartDate} to ${customEndDate})`
                    : 'All Register Entries'}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-1">
                Grand Total Collection (Both Shifts + Store)
              </p>
            </div>

            <div className="flex items-center space-x-2.5 shrink-0">
              <h1 className="text-xl md:text-2xl font-extrabold text-white font-mono tracking-tight">
                Rs. {grandTotalCollection.toLocaleString()}
              </h1>
              <span className="text-[10px] font-semibold text-emerald-400 flex items-center bg-emerald-500/15 px-2 py-0.5 rounded-md border border-emerald-500/25 shrink-0">
                <ArrowUpRight className="w-3 h-3 mr-0.5" /> 100% Consolidated
              </span>
            </div>
          </div>

          {/* Quick Metrics Split Pill Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="bg-white/5 p-2 rounded-lg border border-white/10 space-y-0.5">
              <p className="text-[9.5px] uppercase font-bold text-blue-300 tracking-wider truncate">Morning OPD</p>
              <p className="text-xs sm:text-sm font-extrabold font-mono text-white truncate">Rs. {morningOpdCollection.toLocaleString()}</p>
              <p className="text-[9.5px] text-slate-400 truncate">{morningOpdApps.length} Appointments</p>
            </div>

            <div className="bg-white/5 p-2 rounded-lg border border-white/10 space-y-0.5">
              <p className="text-[9.5px] uppercase font-bold text-amber-300 tracking-wider truncate">Evening OPD</p>
              <p className="text-xs sm:text-sm font-extrabold font-mono text-white truncate">Rs. {eveningOpdCollection.toLocaleString()}</p>
              <p className="text-[9.5px] text-slate-400 truncate">{eveningOpdApps.length} Appointments</p>
            </div>

            <div className="bg-white/5 p-2 rounded-lg border border-white/10 space-y-0.5">
              <p className="text-[9.5px] uppercase font-bold text-emerald-300 tracking-wider truncate">Morning Store</p>
              <p className="text-xs sm:text-sm font-extrabold font-mono text-white truncate">Rs. {morningStoreCollection.toLocaleString()}</p>
              <p className="text-[9.5px] text-slate-400 truncate">{morningInvoices.length} Invoices</p>
            </div>

            <div className="bg-white/5 p-2 rounded-lg border border-white/10 space-y-0.5">
              <p className="text-[9.5px] uppercase font-bold text-purple-300 tracking-wider truncate">Evening Store</p>
              <p className="text-xs sm:text-sm font-extrabold font-mono text-white truncate">Rs. {eveningStoreCollection.toLocaleString()}</p>
              <p className="text-[9.5px] text-slate-400 truncate">{eveningInvoices.length} Invoices</p>
            </div>
          </div>
        </div>
      </div>

      {/* Core Requirement Metrics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-4">
        
        {/* Requirement 1: Total Daily OPD Collection Shift-wise */}
        {(shiftFilter === 'all' || shiftFilter === 'morning' || shiftFilter === 'evening') && (
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition duration-200 flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <div className="p-2.5 bg-blue-50 text-blue-600 border border-blue-100 rounded-xl">
                <CalendarDays className="w-4 h-4" />
              </div>
              <span className="text-[9px] font-extrabold uppercase tracking-wider bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-100">
                1. Total OPD
              </span>
            </div>

            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total OPD Collection</p>
              <h3 className="text-lg font-extrabold text-slate-900 mt-0.5 font-mono">
                Rs. {(shiftFilter === 'morning' ? morningOpdCollection : shiftFilter === 'evening' ? eveningOpdCollection : totalOpdCollection).toLocaleString()}
              </h3>
            </div>

            <div className="border-t border-slate-100 pt-2 space-y-1 text-xxs">
              <div className="flex justify-between items-center text-slate-600">
                <span className="flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                  <span>Morning:</span>
                </span>
                <strong className="font-mono text-slate-900">Rs. {morningOpdCollection.toLocaleString()}</strong>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span className="flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  <span>Evening:</span>
                </span>
                <strong className="font-mono text-slate-900">Rs. {eveningOpdCollection.toLocaleString()}</strong>
              </div>
            </div>
          </div>
        )}

        {/* OPD & Appointment Consultant Fees Card */}
        {(shiftFilter === 'all' || shiftFilter === 'morning' || shiftFilter === 'evening') && (
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition duration-200 flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <div className="p-2.5 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-xl">
                <Stethoscope className="w-4 h-4" />
              </div>
              <span className="text-[9px] font-extrabold uppercase tracking-wider bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-100">
                Consult Fees
              </span>
            </div>

            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">OPD / App Consult Fees</p>
              <h3 className="text-lg font-extrabold text-slate-900 mt-0.5 font-mono">
                Rs. {(shiftFilter === 'morning' ? morningOpdConsultation : shiftFilter === 'evening' ? eveningOpdConsultation : totalOpdConsultation).toLocaleString()}
              </h3>
            </div>

            <div className="border-t border-slate-100 pt-2 space-y-1 text-xxs">
              <div className="flex justify-between items-center text-slate-600">
                <span className="flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                  <span>Morning:</span>
                </span>
                <strong className="font-mono text-slate-900">Rs. {morningOpdConsultation.toLocaleString()}</strong>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span className="flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  <span>Evening:</span>
                </span>
                <strong className="font-mono text-slate-900">Rs. {eveningOpdConsultation.toLocaleString()}</strong>
              </div>
            </div>
          </div>
        )}

        {/* Clinical Medicine Payment Card */}
        {(shiftFilter === 'all' || shiftFilter === 'morning' || shiftFilter === 'evening') && (
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition duration-200 flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <div className="p-2.5 bg-rose-50 text-rose-600 border border-rose-100 rounded-xl">
                <Pill className="w-4 h-4" />
              </div>
              <span className="text-[9px] font-extrabold uppercase tracking-wider bg-rose-50 text-rose-700 px-2 py-0.5 rounded-full border border-rose-100">
                Clinical Meds
              </span>
            </div>

            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Clinical Medicine Fees</p>
              <h3 className="text-lg font-extrabold text-slate-900 mt-0.5 font-mono">
                Rs. {(shiftFilter === 'morning' ? morningClinMed : shiftFilter === 'evening' ? eveningClinMed : totalClinMedCollection).toLocaleString()}
              </h3>
            </div>

            <div className="border-t border-slate-100 pt-2 space-y-1 text-xxs">
              <div className="flex justify-between items-center text-slate-600">
                <span className="flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                  <span>Morning:</span>
                </span>
                <strong className="font-mono text-slate-900">Rs. {morningClinMed.toLocaleString()}</strong>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span className="flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  <span>Evening:</span>
                </span>
                <strong className="font-mono text-slate-900">Rs. {eveningClinMed.toLocaleString()}</strong>
              </div>
            </div>
          </div>
        )}

        {/* Card & Registration / File Fee Card */}
        {(shiftFilter === 'all' || shiftFilter === 'morning' || shiftFilter === 'evening') && (
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition duration-200 flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <div className="p-2.5 bg-cyan-50 text-cyan-600 border border-cyan-100 rounded-xl">
                <CreditCard className="w-4 h-4" />
              </div>
              <span className="text-[9px] font-extrabold uppercase tracking-wider bg-cyan-50 text-cyan-700 px-2 py-0.5 rounded-full border border-cyan-100">
                Card & File
              </span>
            </div>

            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Card / File Fees</p>
              <h3 className="text-lg font-extrabold text-slate-900 mt-0.5 font-mono">
                Rs. {(shiftFilter === 'morning' ? morningCardFileFee : shiftFilter === 'evening' ? eveningCardFileFee : totalCardFileFeeCollection).toLocaleString()}
              </h3>
            </div>

            <div className="border-t border-slate-100 pt-2 space-y-1 text-xxs">
              <div className="flex justify-between items-center text-slate-600">
                <span className="flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
                  <span>Morning:</span>
                </span>
                <strong className="font-mono text-slate-900">Rs. {morningCardFileFee.toLocaleString()}</strong>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span className="flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  <span>Evening:</span>
                </span>
                <strong className="font-mono text-slate-900">Rs. {eveningCardFileFee.toLocaleString()}</strong>
              </div>
            </div>
          </div>
        )}

        {/* Requirement 2: Total Store Collection Shift-wise with sleek Profit / COGS button */}
        {(shiftFilter === 'all' || shiftFilter === 'morning' || shiftFilter === 'evening') && (
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition duration-200 flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <div className="p-2.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-xl">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <button
                type="button"
                onClick={() => setShowProfitCogsModal(true)}
                className="text-[9.5px] font-bold tracking-tight bg-emerald-50 hover:bg-emerald-100 text-emerald-700 hover:text-emerald-800 px-2 py-1 rounded-lg border border-emerald-200/80 transition flex items-center space-x-1 cursor-pointer shadow-2xs group"
                title="Click to view full Purchase Cost (COGS) & Net Gross Profit breakdown"
              >
                <Eye className="w-3 h-3 text-emerald-600 group-hover:scale-110 transition-transform" />
                <span>Profit & COGS</span>
              </button>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Store Collection</p>
                <span className="text-[9.5px] font-bold text-emerald-600 font-mono bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100/80">
                  {activeStoreMarginPct.toFixed(0)}% Margin
                </span>
              </div>
              <h3 className="text-lg font-extrabold text-slate-900 mt-0.5 font-mono">
                Rs. {activeStoreCollection.toLocaleString()}
              </h3>
            </div>

            <div className="border-t border-slate-100 pt-2 space-y-1 text-xxs">
              <div className="flex justify-between items-center text-slate-600">
                <span className="flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span>Morning:</span>
                </span>
                <strong className="font-mono text-slate-900">Rs. {morningStoreCollection.toLocaleString()}</strong>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span className="flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                  <span>Evening:</span>
                </span>
                <strong className="font-mono text-slate-900">Rs. {eveningStoreCollection.toLocaleString()}</strong>
              </div>
            </div>
          </div>
        )}

        {/* Requirement 3: Total Payment Collection Both Shifts */}
        {(shiftFilter === 'all' || shiftFilter === 'morning' || shiftFilter === 'evening') && (
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition duration-200 flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <div className="p-2.5 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-xl">
                <DollarSign className="w-4 h-4" />
              </div>
              <span className="text-[9px] font-extrabold uppercase tracking-wider bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-100">
                3. Both Shifts
              </span>
            </div>

            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Revenue</p>
              <h3 className="text-lg font-extrabold text-slate-900 mt-0.5 font-mono">
                Rs. {(shiftFilter === 'morning' ? morningTotalPayment : shiftFilter === 'evening' ? eveningTotalPayment : combinedTotalPayment).toLocaleString()}
              </h3>
            </div>

            <div className="border-t border-slate-100 pt-2 space-y-1 text-xxs">
              <div className="flex justify-between items-center text-slate-600">
                <span>Morning:</span>
                <strong className="font-mono text-slate-900">Rs. {morningTotalPayment.toLocaleString()}</strong>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span>Evening:</span>
                <strong className="font-mono text-slate-900">Rs. {eveningTotalPayment.toLocaleString()}</strong>
              </div>
            </div>
          </div>
        )}

        {/* Requirement 4: Total Number of Patients Shift-wise */}
        {(shiftFilter === 'all' || shiftFilter === 'morning' || shiftFilter === 'evening') && (
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition duration-200 flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <div className="p-2.5 bg-purple-50 text-purple-600 border border-purple-100 rounded-xl">
                <Users className="w-4 h-4" />
              </div>
              <span className="text-[9px] font-extrabold uppercase tracking-wider bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full border border-purple-100">
                4. Patients
              </span>
            </div>

            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Shift Traffic</p>
              <h3 className="text-lg font-extrabold text-slate-900 mt-0.5 font-mono">
                {(shiftFilter === 'morning' ? morningPatientsCount : shiftFilter === 'evening' ? eveningPatientsCount : totalPatientsShiftCount)} Patients
              </h3>
            </div>

            <div className="border-t border-slate-100 pt-2 space-y-1 text-xxs">
              <div className="flex justify-between items-center text-slate-600">
                <span>Morning:</span>
                <strong className="font-mono text-slate-900">{morningPatientsCount} Patients</strong>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span>Evening:</span>
                <strong className="font-mono text-slate-900">{eveningPatientsCount} Patients</strong>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Shift-wise Collection & Patient Breakdown Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-150 flex flex-col sm:flex-row sm:items-center justify-between bg-slate-50/60 gap-3">
          <div className="flex items-center space-x-2">
            <Layers className="w-5 h-5 text-blue-600 shrink-0" />
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm">Comprehensive Shift Collection Register</h3>
              <p className="text-xs text-slate-500 font-medium">Comparative matrix across Morning vs Evening shifts for OPD Consultations, Clinical Medicine, Card/File Fees, and Store Pharmacy</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold text-slate-600 bg-white border border-slate-200 px-3 py-1 rounded-xl shadow-2xs">
              Total Patients Registered: <strong className="text-slate-900">{patients.length}</strong>
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/80 text-slate-600 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                <th className="py-3.5 px-4">Shift Title</th>
                <th className="py-3.5 px-4 text-center">Patient Count</th>
                <th className="py-3.5 px-4 text-right">OPD Consult Fees</th>
                <th className="py-3.5 px-4 text-right">Clinical Medicine</th>
                <th className="py-3.5 px-4 text-right">Card / File Fees</th>
                <th className="py-3.5 px-4 text-right">Store Pharmacy (2)</th>
                <th className="py-3.5 px-4 text-right">Total Shift Revenue (3)</th>
                <th className="py-3.5 px-4 text-center">% Share</th>
                <th className="py-3.5 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              
              {/* Morning Shift Row */}
              <tr className="hover:bg-blue-50/40 transition duration-150">
                <td className="py-4 px-4 font-bold text-slate-900">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                      M
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">Morning Shift</p>
                      <p className="text-[10px] text-slate-400">08:00 AM - 02:00 PM</p>
                    </div>
                  </div>
                </td>
                <td className="py-4 px-4 text-center font-bold font-mono text-slate-800">
                  {morningPatientsCount}
                  <span className="block text-[10px] font-normal text-slate-400">({morningOpdApps.length} Apps / {morningTokens.length} Tokens)</span>
                </td>
                <td className="py-4 px-4 text-right font-bold font-mono text-slate-800">
                  Rs. {morningOpdConsultation.toLocaleString()}
                </td>
                <td className="py-4 px-4 text-right font-bold font-mono text-rose-700">
                  Rs. {morningClinMed.toLocaleString()}
                </td>
                <td className="py-4 px-4 text-right font-bold font-mono text-cyan-700">
                  Rs. {morningCardFileFee.toLocaleString()}
                </td>
                <td className="py-4 px-4 text-right font-bold font-mono text-emerald-700">
                  <div>Rs. {morningStoreCollection.toLocaleString()}</div>
                  <span className="block text-[9px] font-normal text-slate-400">COGS: {morningStoreCogs.toLocaleString()} | Profit: {morningStoreGrossProfit.toLocaleString()} ({morningStoreMarginPct.toFixed(0)}%)</span>
                </td>
                <td className="py-4 px-4 text-right font-extrabold font-mono text-blue-700 text-sm">
                  Rs. {morningTotalPayment.toLocaleString()}
                </td>
                <td className="py-4 px-4 text-center">
                  <span className="inline-block px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 font-mono">
                    {morningRatio}%
                  </span>
                </td>
                <td className="py-4 px-4 text-center">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    COMPLETED
                  </span>
                </td>
              </tr>

              {/* Evening Shift Row */}
              <tr className="hover:bg-amber-50/40 transition duration-150">
                <td className="py-4 px-4 font-bold text-slate-900">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                      E
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">Evening Shift</p>
                      <p className="text-[10px] text-slate-400">02:00 PM - 10:00 PM</p>
                    </div>
                  </div>
                </td>
                <td className="py-4 px-4 text-center font-bold font-mono text-slate-800">
                  {eveningPatientsCount}
                  <span className="block text-[10px] font-normal text-slate-400">({eveningOpdApps.length} Apps / {eveningTokens.length} Tokens)</span>
                </td>
                <td className="py-4 px-4 text-right font-bold font-mono text-slate-800">
                  Rs. {eveningOpdConsultation.toLocaleString()}
                </td>
                <td className="py-4 px-4 text-right font-bold font-mono text-rose-700">
                  Rs. {eveningClinMed.toLocaleString()}
                </td>
                <td className="py-4 px-4 text-right font-bold font-mono text-cyan-700">
                  Rs. {eveningCardFileFee.toLocaleString()}
                </td>
                <td className="py-4 px-4 text-right font-bold font-mono text-purple-700">
                  <div>Rs. {eveningStoreCollection.toLocaleString()}</div>
                  <span className="block text-[9px] font-normal text-slate-400">COGS: {eveningStoreCogs.toLocaleString()} | Profit: {eveningStoreGrossProfit.toLocaleString()} ({eveningStoreMarginPct.toFixed(0)}%)</span>
                </td>
                <td className="py-4 px-4 text-right font-extrabold font-mono text-amber-700 text-sm">
                  Rs. {eveningTotalPayment.toLocaleString()}
                </td>
                <td className="py-4 px-4 text-center">
                  <span className="inline-block px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 font-mono">
                    {eveningRatio}%
                  </span>
                </td>
                <td className="py-4 px-4 text-center">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                    ACTIVE / OPEN
                  </span>
                </td>
              </tr>

              {/* Grand Total Row */}
              <tr className="bg-slate-900 text-white font-extrabold">
                <td className="py-4 px-4 uppercase tracking-wider text-xs">
                  <div className="flex items-center space-x-2">
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    <span>Grand Total</span>
                  </div>
                </td>
                <td className="py-4 px-4 text-center font-mono text-sm text-slate-200">
                  {totalPatientsShiftCount} Patients
                </td>
                <td className="py-4 px-4 text-right font-mono text-xs text-blue-300">
                  Rs. {totalOpdConsultation.toLocaleString()}
                </td>
                <td className="py-4 px-4 text-right font-mono text-xs text-rose-300">
                  Rs. {totalClinMedCollection.toLocaleString()}
                </td>
                <td className="py-4 px-4 text-right font-mono text-xs text-cyan-300">
                  Rs. {totalCardFileFeeCollection.toLocaleString()}
                </td>
                <td className="py-4 px-4 text-right font-mono text-xs text-emerald-300">
                  <div>Rs. {totalStoreCollection.toLocaleString()}</div>
                  <span className="block text-[9px] font-normal text-slate-400">COGS: {totalStoreCogs.toLocaleString()} | Profit: {totalStoreGrossProfit.toLocaleString()} ({totalStoreMarginPct.toFixed(0)}%)</span>
                </td>
                <td className="py-4 px-4 text-right font-mono text-base text-white">
                  Rs. {grandTotalCollection.toLocaleString()}
                </td>
                <td className="py-4 px-4 text-center font-mono text-emerald-400">
                  100%
                </td>
                <td className="py-4 px-4 text-center">
                  <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    BALANCED
                  </span>
                </td>
              </tr>

            </tbody>
          </table>
        </div>
      </div>

      {/* Visual Revenue Ratios & Progress Analytics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Morning vs Evening Shift Revenue Ratio */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <PieChart className="w-4 h-4 text-blue-600" />
              <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider">Shift Revenue Distribution Ratio</h4>
            </div>
            <span className="text-[10px] font-bold text-slate-400">Shift 1 vs Shift 2</span>
          </div>

          <div className="space-y-2">
            <div className="h-4 bg-slate-100 rounded-full overflow-hidden flex">
              <div
                className="bg-blue-600 h-full transition-all duration-500 flex items-center justify-center text-[9px] font-bold text-white"
                style={{ width: `${morningRatio}%` }}
              >
                {morningRatio > 15 ? `${morningRatio}%` : ''}
              </div>
              <div
                className="bg-amber-500 h-full transition-all duration-500 flex items-center justify-center text-[9px] font-bold text-white"
                style={{ width: `${eveningRatio}%` }}
              >
                {eveningRatio > 15 ? `${eveningRatio}%` : ''}
              </div>
            </div>

            <div className="flex justify-between items-center text-xs font-medium pt-1">
              <span className="flex items-center space-x-1.5 text-blue-700 font-bold">
                <span className="w-3 h-3 rounded-md bg-blue-600" />
                <span>Morning Shift: Rs. {morningTotalPayment.toLocaleString()} ({morningRatio}%)</span>
              </span>
              <span className="flex items-center space-x-1.5 text-amber-700 font-bold">
                <span className="w-3 h-3 rounded-md bg-amber-500" />
                <span>Evening Shift: Rs. {eveningTotalPayment.toLocaleString()} ({eveningRatio}%)</span>
              </span>
            </div>
          </div>
        </div>

        {/* OPD vs Store Pharmacy Revenue Stream Ratio */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <BarChart3 className="w-4 h-4 text-emerald-600" />
              <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider">Revenue Stream Split (OPD vs Store)</h4>
            </div>
            <span className="text-[10px] font-bold text-slate-400">Clinic vs Pharmacy</span>
          </div>

          <div className="space-y-2">
            <div className="h-4 bg-slate-100 rounded-full overflow-hidden flex">
              <div
                className="bg-indigo-600 h-full transition-all duration-500 flex items-center justify-center text-[9px] font-bold text-white"
                style={{ width: `${opdRatio}%` }}
              >
                {opdRatio > 15 ? `${opdRatio}%` : ''}
              </div>
              <div
                className="bg-emerald-600 h-full transition-all duration-500 flex items-center justify-center text-[9px] font-bold text-white"
                style={{ width: `${storeRatio}%` }}
              >
                {storeRatio > 15 ? `${storeRatio}%` : ''}
              </div>
            </div>

            <div className="flex justify-between items-center text-xs font-medium pt-1">
              <span className="flex items-center space-x-1.5 text-indigo-700 font-bold">
                <span className="w-3 h-3 rounded-md bg-indigo-600" />
                <span>OPD Daily: Rs. {totalOpdCollection.toLocaleString()} ({opdRatio}%)</span>
              </span>
              <span className="flex items-center space-x-1.5 text-emerald-700 font-bold">
                <span className="w-3 h-3 rounded-md bg-emerald-600" />
                <span>Store Sales: Rs. {totalStoreCollection.toLocaleString()} ({storeRatio}%)</span>
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* Grid: Low Stock Alert vs Recent Journal Entries */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Inventory Safety Alert */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col" id="dashboard-inventory-alerts">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
              <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Critical Pharmacy Re-order Alerts</h4>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-50 text-amber-600 rounded border border-amber-200">
              {lowStockItems.length} Warnings
            </span>
          </div>

          <div className="divide-y divide-slate-100 max-h-[300px] overflow-y-auto flex-1">
            {lowStockItems.length === 0 ? (
              <p className="p-5 text-xs text-slate-400 font-medium text-center">All pharmaceutical products have satisfactory inventory balances.</p>
            ) : (
              lowStockItems.map((item, idx) => (
                <div key={`${item.ItemID}-${idx}`} className="p-4 flex items-center justify-between hover:bg-slate-50/50 transition duration-150">
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-800 truncate">{item.ItemName}</p>
                    <p className="text-xxs text-slate-400 font-mono mt-0.5">ID: {item.ItemID} | Unit: {item.Unit}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs font-bold font-mono text-red-600 bg-red-50 px-2 py-0.5 rounded">
                      {item.CStock} {item.Unit}s left
                    </span>
                    <p className="text-xxs text-slate-400 font-semibold mt-1">Min. Threshold: {(item.MinStock !== undefined && item.MinStock !== null) ? item.MinStock : 1}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Voucher Status Ledger Summary */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col" id="dashboard-voucher-alerts">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center space-x-2">
              <FileCheck className="w-4 h-4 text-blue-600 shrink-0" />
              <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Double-Entry Financial Audits</h4>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-50 text-blue-700 rounded border border-blue-200">
              {postedVchCount} General Ledger Postings
            </span>
          </div>

          <div className="divide-y divide-slate-100 max-h-[300px] overflow-y-auto flex-1">
            {vouchers.length === 0 ? (
              <p className="p-5 text-xs text-slate-400 font-medium text-center">No accounting vouchers registered in system journals.</p>
            ) : (
              vouchers.map((v) => (
                <div key={v.VchNo} className="p-4 flex items-center justify-between hover:bg-slate-50/50 transition duration-150">
                  <div className="min-w-0">
                    <div className="flex items-center space-x-1.5">
                      <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase tracking-wider ${
                        v.VchType === 'JV' ? 'bg-indigo-50 text-indigo-600 border border-indigo-150' :
                        v.VchType === 'CRV' ? 'bg-emerald-50 text-emerald-600 border border-emerald-150' :
                        'bg-rose-50 text-rose-600 border border-rose-150'
                      }`}>
                        {v.VchType}
                      </span>
                      <p className="text-xs font-bold text-slate-800 font-mono truncate">{v.VchNo}</p>
                    </div>
                    <p className="text-xxs text-slate-500 mt-1 truncate font-medium">{v.Remarks || 'Operational journal posting'}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded tracking-wider ${
                      v.Status === 2 ? 'bg-blue-100 text-blue-800' : 'bg-slate-150 text-slate-600'
                    }`}>
                      {v.Status === 2 ? 'GL POSTED' : 'DRAFT'}
                    </span>
                    <p className="text-xxs text-slate-400 mt-1 font-mono">{v.VchDate}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Pop-up Modal: Purchase Cost (COGS) & Net Gross Profit Details */}
      {showProfitCogsModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setShowProfitCogsModal(false)}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-between border-b border-slate-700">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold tracking-tight text-white flex items-center space-x-2">
                    <span>Store Pharmacy Financial Breakdown</span>
                  </h3>
                  <p className="text-xxs text-slate-300 font-medium mt-0.5">
                    {dateFilter === 'today'
                      ? `Today's Audited Position (${todayStr})`
                      : dateFilter === 'month_select'
                      ? `Monthly Position (${monthOptions.find(o => o.value === selectedMonthYear)?.label || selectedMonthYear})`
                      : `Selected Period (${shiftFilter.toUpperCase()} Shift)`}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowProfitCogsModal(false)}
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
              
              {/* Primary 3 KPI Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* 1. Total Store Sales */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1">
                  <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Total Sales Revenue</p>
                  <p className="text-lg font-extrabold text-slate-900 font-mono">
                    Rs. {activeStoreCollection.toLocaleString()}
                  </p>
                  <p className="text-[10px] text-slate-500 font-medium">Net Sales After Returns</p>
                </div>

                {/* 2. Purchase Cost (COGS) */}
                <div className="bg-purple-50/60 border border-purple-200/80 rounded-xl p-3.5 space-y-1">
                  <p className="text-[10px] uppercase font-bold text-purple-700 tracking-wider">Purchase Cost (COGS)</p>
                  <p className="text-lg font-extrabold text-purple-900 font-mono">
                    Rs. {activeStoreCogs.toLocaleString()}
                  </p>
                  <p className="text-[10px] text-purple-600 font-medium">Cost of Goods Sold</p>
                </div>

                {/* 3. Net Gross Profit & Margin */}
                <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-3.5 space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] uppercase font-bold text-emerald-800 tracking-wider">Net Gross Profit</p>
                    <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded-full bg-emerald-200/80 text-emerald-900">
                      {activeStoreMarginPct.toFixed(1)}% Margin
                    </span>
                  </div>
                  <p className="text-lg font-extrabold text-emerald-900 font-mono">
                    Rs. {activeStoreGrossProfit.toLocaleString()}
                  </p>
                  <p className="text-[10px] text-emerald-700 font-medium">Sales Revenue − COGS</p>
                </div>
              </div>

              {/* Shift-Wise Comparative Table */}
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Shift-wise Cost & Profit Analysis
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium">
                    Itemized Catalog Cost Mapping
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-100/50 text-[11px] text-slate-600 font-bold uppercase">
                        <th className="py-2.5 px-3">Shift</th>
                        <th className="py-2.5 px-3 text-right">Store Sales</th>
                        <th className="py-2.5 px-3 text-right text-purple-800">Purchase Cost (COGS)</th>
                        <th className="py-2.5 px-3 text-right text-emerald-800">Gross Profit</th>
                        <th className="py-2.5 px-3 text-right">Margin %</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono text-xs">
                      {/* Morning Row */}
                      <tr className="hover:bg-slate-50/80 transition">
                        <td className="py-2.5 px-3 font-sans font-semibold text-slate-800 flex items-center space-x-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                          <span>Morning Shift</span>
                        </td>
                        <td className="py-2.5 px-3 text-right text-slate-800 font-semibold">
                          Rs. {morningStoreCollection.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3 text-right text-purple-900 font-semibold">
                          Rs. {morningStoreCogs.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3 text-right text-emerald-700 font-bold">
                          Rs. {morningStoreGrossProfit.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3 text-right text-emerald-700 font-bold">
                          {morningStoreMarginPct.toFixed(1)}%
                        </td>
                      </tr>

                      {/* Evening Row */}
                      <tr className="hover:bg-slate-50/80 transition">
                        <td className="py-2.5 px-3 font-sans font-semibold text-slate-800 flex items-center space-x-1.5">
                          <span className="w-2 h-2 rounded-full bg-purple-500 shrink-0" />
                          <span>Evening Shift</span>
                        </td>
                        <td className="py-2.5 px-3 text-right text-slate-800 font-semibold">
                          Rs. {eveningStoreCollection.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3 text-right text-purple-900 font-semibold">
                          Rs. {eveningStoreCogs.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3 text-right text-purple-700 font-bold">
                          Rs. {eveningStoreGrossProfit.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3 text-right text-purple-700 font-bold">
                          {eveningStoreMarginPct.toFixed(1)}%
                        </td>
                      </tr>

                      {/* Total Consolidated Row */}
                      <tr className="bg-slate-900 text-white font-bold">
                        <td className="py-2.5 px-3 font-sans text-white">
                          Grand Total (Consolidated)
                        </td>
                        <td className="py-2.5 px-3 text-right text-emerald-300">
                          Rs. {totalStoreCollection.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3 text-right text-purple-300">
                          Rs. {totalStoreCogs.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3 text-right text-emerald-400">
                          Rs. {totalStoreGrossProfit.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3 text-right text-emerald-400">
                          {totalStoreMarginPct.toFixed(1)}%
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Information / Audit Note */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 text-xxs text-slate-500 flex items-start space-x-2">
                <span className="text-base leading-none">💡</span>
                <p className="leading-relaxed">
                  <strong>Accounting & Audit Rule:</strong> Cost of Goods Sold (COGS) is computed from line-item invoice quantities multiplied by item acquisition purchase prices recorded in your pharmacy catalog.
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setShowProfitCogsModal(false)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-xs"
              >
                Close Statement
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

