import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Calendar,
  Lock,
  Unlock,
  Eye,
  Printer,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Building2,
  Users,
  ShoppingCart,
  Receipt,
  FileText,
  Boxes,
  CheckCircle2,
  AlertCircle,
  X,
  Search,
  Filter,
  BarChart3,
  CalendarDays,
  ShieldAlert,
  ChevronRight,
  Landmark,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Database
} from 'lucide-react';
import {
  FiscalMonthPeriod,
  User,
  ClinicSettings,
  ErpVendor,
  ErpGrn,
  ErpTransaction,
  ErpExpense,
  ErpPayroll
} from '../types';

interface FiscalCalendarDeskProps {
  currentUser: User | null;
  clinicSettings?: ClinicSettings;
  appointments?: any[];
  patientVisits?: any[];
  posSales?: any[];
  expenses?: ErpExpense[];
  payrolls?: ErpPayroll[];
  transactions?: ErpTransaction[];
  grns?: ErpGrn[];
  vendors?: ErpVendor[];
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

/**
 * Robust date normalizer that handles ISO (YYYY-MM-DD), DD/MM/YYYY, DD-MM-YYYY,
 * timestamps, and Date objects, returning a clean 'YYYY-MM-DD' string.
 */
function normalizeDateToYMD(rawDate: any): string | null {
  if (!rawDate) return null;

  if (typeof rawDate === 'object' && rawDate instanceof Date && !isNaN(rawDate.getTime())) {
    const y = rawDate.getFullYear();
    const m = String(rawDate.getMonth() + 1).padStart(2, '0');
    const d = String(rawDate.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  const str = String(rawDate).trim();
  if (!str) return null;

  // 1. ISO format: 2026-08-19 or 2026-08-19T...
  const isoMatch = str.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (isoMatch) {
    const y = isoMatch[1];
    const m = isoMatch[2].padStart(2, '0');
    const d = isoMatch[3].padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  // 2. DD/MM/YYYY or DD-MM-YYYY: 19/08/2026 or 19-08-2026
  const dmyMatch = str.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/);
  if (dmyMatch) {
    const d = dmyMatch[1].padStart(2, '0');
    const m = dmyMatch[2].padStart(2, '0');
    const y = dmyMatch[3];
    return `${y}-${m}-${d}`;
  }

  // 3. Fallback to JS Date parser
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    const y = parsed.getFullYear();
    const m = String(parsed.getMonth() + 1).padStart(2, '0');
    const d = String(parsed.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  return null;
}

export default function FiscalCalendarDesk({
  currentUser,
  clinicSettings,
  appointments: propAppointments = [],
  patientVisits: propVisits = [],
  posSales: propPosSales = [],
  expenses: propExpenses = [],
  payrolls: propPayrolls = [],
  transactions: propTransactions = [],
  grns: propGrns = [],
  vendors: propVendors = []
}: FiscalCalendarDeskProps) {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [yearType, setYearType] = useState<'CALENDAR' | 'JULY_JUNE'>('CALENDAR');
  const [isRefreshingDb, setIsRefreshingDb] = useState<boolean>(false);

  // Live collections fetched directly from Database / API
  const [dbInvoices, setDbInvoices] = useState<any[]>([]);
  const [dbAppointments, setDbAppointments] = useState<any[]>([]);
  const [dbTokens, setDbTokens] = useState<any[]>([]);
  const [dbVisits, setDbVisits] = useState<any[]>([]);
  const [dbExpenses, setDbExpenses] = useState<any[]>([]);
  const [dbVouchers, setDbVouchers] = useState<any[]>([]);
  const [dbPayrolls, setDbPayrolls] = useState<any[]>([]);
  const [dbTransactions, setDbTransactions] = useState<any[]>([]);
  const [dbGrns, setDbGrns] = useState<any[]>([]);
  const [dbVendors, setDbVendors] = useState<any[]>([]);

  // Closed/Open periods state stored in localStorage + synced with DB
  const [periodStatuses, setPeriodStatuses] = useState<{ [periodId: string]: FiscalMonthPeriod }>(() => {
    try {
      const saved = localStorage.getItem('phc_fiscal_periods_status');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Error loading fiscal periods status:', e);
    }
    return {};
  });

  // Save period statuses
  useEffect(() => {
    try {
      localStorage.setItem('phc_fiscal_periods_status', JSON.stringify(periodStatuses));
    } catch (e) {
      console.error('Error saving fiscal periods status:', e);
    }
  }, [periodStatuses]);

  // Selected Month for 360° Inspection Modal
  const [selectedAuditMonth, setSelectedAuditMonth] = useState<{
    year: number;
    month: number;
    monthName: string;
    startDate: string;
    endDate: string;
    periodId: string;
    isClosed: boolean;
    periodData: FiscalMonthPeriod | null;
  } | null>(null);

  const [closeNotesInput, setCloseNotesInput] = useState<string>('');
  const [auditSearchTerm, setAuditSearchTerm] = useState<string>('');
  const [auditTypeFilter, setAuditTypeFilter] = useState<'ALL' | 'INFLOW' | 'OUTFLOW' | 'VENDOR' | 'EXPENSE'>('ALL');
  const [statusNotification, setStatusNotification] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setStatusNotification(msg);
    setTimeout(() => setStatusNotification(null), 3500);
  };

  // Helper to safely fetch JSON from endpoint
  const safeFetch = async (url: string) => {
    try {
      const res = await fetch(url);
      if (!res.ok) return null;
      const ct = res.headers.get('content-type') || '';
      if (!ct.includes('application/json')) return null;
      return await res.json();
    } catch {
      return null;
    }
  };

  // Comprehensive DB Fetch: Loads directly from MongoDB Backend
  const fetchAllDatabaseRecords = useCallback(async () => {
    setIsRefreshingDb(true);
    try {
      const [
        invData,
        apptsData,
        tokensData,
        visitsData,
        expData,
        vouchersData,
        payData,
        txnData,
        grnData,
        vendorsData
      ] = await Promise.all([
        safeFetch('/api/billing/invoices'),
        safeFetch('/api/appointments'),
        safeFetch('/api/tokens'),
        safeFetch('/api/visits'),
        safeFetch('/api/query/erp_expenses'),
        safeFetch('/api/vouchers'),
        safeFetch('/api/query/erp_payroll'),
        safeFetch('/api/query/erp_transactions'),
        safeFetch('/api/query/erp_grn'),
        safeFetch('/api/query/erp_vendors')
      ]);

      // 1. Invoices
      let invoicesList: any[] = [];
      if (invData && Array.isArray(invData.headers)) {
        invoicesList = invData.headers;
      } else if (Array.isArray(invData)) {
        invoicesList = invData;
      } else {
        try {
          const local = localStorage.getItem('cms_invoices');
          if (local) invoicesList = JSON.parse(local);
        } catch (e) {}
      }
      setDbInvoices(invoicesList);

      // 2. Appointments
      let apptsList: any[] = [];
      if (Array.isArray(apptsData)) {
        apptsList = apptsData;
      } else {
        try {
          const local = localStorage.getItem('cms_appointments');
          if (local) apptsList = JSON.parse(local);
        } catch (e) {}
      }
      setDbAppointments(apptsList);

      // 3. Tokens
      let tokensList: any[] = [];
      if (Array.isArray(tokensData)) {
        tokensList = tokensData;
      } else {
        try {
          const local = localStorage.getItem('cms_tokens');
          if (local) tokensList = JSON.parse(local);
        } catch (e) {}
      }
      setDbTokens(tokensList);

      // 4. Patient Visits
      let visitsList: any[] = [];
      if (Array.isArray(visitsData)) {
        visitsList = visitsData;
      } else {
        try {
          const local = localStorage.getItem('cms_visits');
          if (local) visitsList = JSON.parse(local);
        } catch (e) {}
      }
      setDbVisits(visitsList);

      // 5. Expenses
      let expList: any[] = [];
      if (Array.isArray(expData)) {
        expList = expData;
      } else {
        try {
          const local = localStorage.getItem('phc_erp_expenses');
          if (local) expList = JSON.parse(local);
        } catch (e) {}
      }
      setDbExpenses(expList);

      // 6. Vouchers (Cash & Bank Payments / Receipts)
      let vouchersList: any[] = [];
      if (vouchersData && Array.isArray(vouchersData.headers)) {
        vouchersList = vouchersData.headers;
      } else if (Array.isArray(vouchersData)) {
        vouchersList = vouchersData;
      } else {
        try {
          const local = localStorage.getItem('cms_vouchers');
          if (local) vouchersList = JSON.parse(local);
        } catch (e) {}
      }
      setDbVouchers(vouchersList);

      // 7. Payroll
      let payList: any[] = [];
      if (Array.isArray(payData)) {
        payList = payData;
      } else {
        try {
          const local = localStorage.getItem('phc_erp_payroll');
          if (local) payList = JSON.parse(local);
        } catch (e) {}
      }
      setDbPayrolls(payList);

      // 8. Transactions
      let txnList: any[] = [];
      if (Array.isArray(txnData)) {
        txnList = txnData;
      } else {
        try {
          const local = localStorage.getItem('phc_erp_transactions');
          if (local) txnList = JSON.parse(local);
        } catch (e) {}
      }
      setDbTransactions(txnList);

      // 9. GRNs (Purchases)
      let grnList: any[] = [];
      if (Array.isArray(grnData)) {
        grnList = grnData;
      } else {
        try {
          const local = localStorage.getItem('cms_grns');
          if (local) grnList = JSON.parse(local);
        } catch (e) {}
      }
      setDbGrns(grnList);

      // 10. Vendors
      let vendorsList: any[] = [];
      if (Array.isArray(vendorsData)) {
        vendorsList = vendorsData;
      } else {
        try {
          const local = localStorage.getItem('cms_suppliers');
          if (local) vendorsList = JSON.parse(local);
        } catch (e) {}
      }
      setDbVendors(vendorsList);

      showNotification('✅ Database financial records synchronized successfully!');
    } catch (err) {
      console.error('Error fetching database records:', err);
    } finally {
      setIsRefreshingDb(false);
    }
  }, []);

  // Sync on mount & on global update events
  useEffect(() => {
    fetchAllDatabaseRecords();
    const handleDbUpdate = () => fetchAllDatabaseRecords();
    window.addEventListener('phc_db_updated', handleDbUpdate);
    return () => window.removeEventListener('phc_db_updated', handleDbUpdate);
  }, [fetchAllDatabaseRecords]);

  // Master merged datasets: Merging Props with Live DB state & Local storage
  const allAppointments = useMemo(() => {
    const map = new Map<string, any>();
    [...propAppointments, ...dbAppointments].forEach(item => {
      const id = String(item.AppointmentID || item._id || `${item.PatientName}-${item.AppointmentDate}`);
      if (!map.has(id)) map.set(id, item);
    });
    return Array.from(map.values());
  }, [propAppointments, dbAppointments]);

  const allTokens = useMemo(() => {
    const map = new Map<string, any>();
    [...dbTokens].forEach(item => {
      const id = String(item.TokenID || item.TokenNo || item._id || `${item.PatientName}-${item.Date}`);
      if (!map.has(id)) map.set(id, item);
    });
    return Array.from(map.values());
  }, [dbTokens]);

  const allVisits = useMemo(() => {
    const map = new Map<string, any>();
    [...propVisits, ...dbVisits].forEach(item => {
      const id = String(item.VisitID || item._id || `${item.PatientID}-${item.VisitDate}`);
      if (!map.has(id)) map.set(id, item);
    });
    return Array.from(map.values());
  }, [propVisits, dbVisits]);

  const allPosSales = useMemo(() => {
    const map = new Map<string, any>();
    [...propPosSales, ...dbInvoices].forEach(item => {
      const id = String(item.InvoiceNo || item.SaleID || item._id || `${item.PatientID}-${item.InvoiceDate}`);
      if (!map.has(id)) map.set(id, item);
    });
    return Array.from(map.values());
  }, [propPosSales, dbInvoices]);

  const allExpenses = useMemo(() => {
    const map = new Map<string, any>();
    [...propExpenses, ...dbExpenses].forEach(item => {
      const id = String(item.ExpenseID || item._id || `${item.Category}-${item.ExpenseDate}-${item.Amount}`);
      if (!map.has(id)) map.set(id, item);
    });
    return Array.from(map.values());
  }, [propExpenses, dbExpenses]);

  const allPayrolls = useMemo(() => {
    const map = new Map<string, any>();
    [...propPayrolls, ...dbPayrolls].forEach(item => {
      const id = String(item.PayrollID || item._id || `${item.EmployeeID}-${item.MonthYear}`);
      if (!map.has(id)) map.set(id, item);
    });
    return Array.from(map.values());
  }, [propPayrolls, dbPayrolls]);

  const allTransactions = useMemo(() => {
    const map = new Map<string, any>();
    [...propTransactions, ...dbTransactions].forEach(item => {
      const id = String(item.TransactionID || item._id || `${item.Type}-${item.Date}-${item.Amount}`);
      if (!map.has(id)) map.set(id, item);
    });
    return Array.from(map.values());
  }, [propTransactions, dbTransactions]);

  const allGrns = useMemo(() => {
    const map = new Map<string, any>();
    [...propGrns, ...dbGrns].forEach(item => {
      const id = String(item.GrnID || item._id || `${item.SupplierName}-${item.ReceivedDate}`);
      if (!map.has(id)) map.set(id, item);
    });
    return Array.from(map.values());
  }, [propGrns, dbGrns]);

  // Generate 12 months for the selected financial year
  const monthsList = useMemo(() => {
    if (yearType === 'CALENDAR') {
      return Array.from({ length: 12 }, (_, idx) => {
        const m = idx + 1;
        const padM = String(m).padStart(2, '0');
        const lastDay = new Date(selectedYear, m, 0).getDate();
        const periodId = `${selectedYear}-${padM}`;
        return {
          year: selectedYear,
          month: m,
          monthName: MONTH_NAMES[idx],
          startDate: `${selectedYear}-${padM}-01`,
          endDate: `${selectedYear}-${padM}-${String(lastDay).padStart(2, '0')}`,
          periodId,
          quarter: `Q${Math.ceil(m / 3)}`
        };
      });
    } else {
      // Pakistani Tax / Fiscal Year: July - June
      const monthsOrder = [7, 8, 9, 10, 11, 12, 1, 2, 3, 4, 5, 6];
      return monthsOrder.map((m, idx) => {
        const y = m >= 7 ? selectedYear : selectedYear + 1;
        const padM = String(m).padStart(2, '0');
        const lastDay = new Date(y, m, 0).getDate();
        const periodId = `${y}-${padM}`;
        return {
          year: y,
          month: m,
          monthName: MONTH_NAMES[m - 1],
          startDate: `${y}-${padM}-01`,
          endDate: `${y}-${padM}-${String(lastDay).padStart(2, '0')}`,
          periodId,
          quarter: `Q${Math.floor(idx / 3) + 1}`
        };
      });
    }
  }, [selectedYear, yearType]);

  // Accurate Calculation Engine for any Given Date Duration
  const calculatePeriodMetrics = (startDate: string, endDate: string) => {
    const isDateInRange = (rawDate?: any) => {
      const ymd = normalizeDateToYMD(rawDate);
      if (!ymd) return false;
      return ymd >= startDate && ymd <= endDate;
    };

    // 1. INFLOWS
    // OPD Appointments & Tokens
    let opdTokensSum = 0;
    let appointmentsCount = 0;

    allAppointments.forEach(app => {
      const d = app.AppointmentDate || app.BookingDate || app.Date || app.CreatedAt;
      if (isDateInRange(d)) {
        if (app.Status !== 3 && app.Status !== 'Cancelled') {
          const fee = Number(app.FeeCharged) || Number(app.Fee) || Number(app.ConsultationFee) || Number(app.Amount) || 0;
          opdTokensSum += fee;
          appointmentsCount += 1;
        }
      }
    });

    // Also check Tokens collection (avoid duplicate if already counted)
    allTokens.forEach(tok => {
      const d = tok.Date || tok.TokenDate || tok.CreatedAt;
      if (isDateInRange(d)) {
        const alreadyIn = allAppointments.some(a => a.AppointmentID === tok.AppointmentID || a.TokenNo === tok.TokenNo);
        if (!alreadyIn) {
          const fee = Number(tok.Fee) || Number(tok.FeeCharged) || Number(tok.Amount) || 0;
          opdTokensSum += fee;
          appointmentsCount += 1;
        }
      }
    });

    // Doctor Consultation, Card Fees & Clinical Compounding from Patient Visits
    let doctorConsultationSum = 0;
    let clinicCardFeesSum = 0;
    let clinicalCompoundingSum = 0;
    let visitsCount = 0;

    allVisits.forEach(vis => {
      const d = vis.VisitDate || vis.Date || vis.CreatedAt;
      if (isDateInRange(d)) {
        const consult = Number(vis.ConsultationFee) || Number(vis.DoctorFee) || Number(vis.Fee) || 0;
        const card = Number(vis.CardFee) || Number(vis.CardPkr) || Number(vis.FileFee) || Number(vis.FilePkr) || 0;
        const clinical = Number(vis.ClinicalMedicinePayment) || Number(vis.ClinicalMedicineFee) || Number(vis.ClinicalMedicinePkr) || 0;

        doctorConsultationSum += consult;
        clinicCardFeesSum += card;
        clinicalCompoundingSum += clinical;
        visitsCount += 1;
      }
    });

    // Pharmacy Store POS Sales
    let pharmacyPosSalesSum = 0;
    let posInvoicesCount = 0;

    allPosSales.forEach(sale => {
      const d = sale.InvoiceDate || sale.Date || sale.CreatedAt || sale.InvDate;
      if (isDateInRange(d)) {
        const net = Number(sale.NetAmount) || Number(sale.GAmount) || Number(sale.TotalAmount) || Number(sale.GrandTotal) || Number(sale.Total) || 0;
        pharmacyPosSalesSum += net;
        posInvoicesCount += 1;
      }
    });

    // Direct Cash Receipts (CRV, BRV Vouchers / General Ledger Inflows)
    let miscInflowsSum = 0;
    allTransactions.forEach(t => {
      const d = t.Date || t.TransactionDate || t.CreatedAt;
      if (isDateInRange(d) && (t.Type === 'Income' || t.Type === 'CustomerReceipt' || t.Type === 'INFLOW')) {
        miscInflowsSum += (Number(t.Amount) || 0);
      }
    });

    dbVouchers.forEach(v => {
      const d = v.VchDate || v.VDate || v.Date || v.CreatedAt;
      if (isDateInRange(d) && (v.VchType === 'CRV' || v.VchType === 'BRV')) {
        const amt = Number(v.Amount) || Number(v.VAmount) || Number(v.TotalAmount) || 0;
        miscInflowsSum += amt;
      }
    });

    const totalOpdInflow = opdTokensSum + doctorConsultationSum + clinicCardFeesSum;
    const totalGrossInflow = totalOpdInflow + clinicalCompoundingSum + pharmacyPosSalesSum + miscInflowsSum;

    // 2. OUTFLOWS
    // Clinic Expenses
    let operationalExpensesSum = 0;
    let expensesCount = 0;

    allExpenses.forEach(exp => {
      const d = exp.ExpenseDate || exp.Date || exp.CreatedAt;
      if (isDateInRange(d)) {
        const amt = Number(exp.Amount) || Number(exp.ExpenseAmount) || Number(exp.TotalAmount) || 0;
        operationalExpensesSum += amt;
        expensesCount += 1;
      }
    });

    // Cash Payment Vouchers (CPV, BPV) from Accounting Desk
    dbVouchers.forEach(v => {
      const d = v.VchDate || v.VDate || v.Date || v.CreatedAt;
      if (isDateInRange(d) && (v.VchType === 'CPV' || v.VchType === 'BPV')) {
        const amt = Number(v.Amount) || Number(v.VAmount) || Number(v.TotalAmount) || 0;
        // Exclude if already matched in allExpenses
        const alreadyIn = allExpenses.some(e => e.ExpenseID === v.VchNo || e._id === v._id);
        if (!alreadyIn) {
          operationalExpensesSum += amt;
          expensesCount += 1;
        }
      }
    });

    // Staff Salaries (Payroll)
    let payrollsSum = 0;
    let payrollCount = 0;

    allPayrolls.forEach(p => {
      const d = p.PaymentDate || p.Date || (p.MonthYear ? `${p.MonthYear}-01` : null);
      if (isDateInRange(d) || (p.MonthYear && startDate.startsWith(p.MonthYear))) {
        if (p.PaymentStatus === 'Paid' || p.Status === 'Paid' || !p.PaymentStatus) {
          const s = Number(p.NetSalary) || Number(p.BasicSalary) || Number(p.Amount) || 0;
          payrollsSum += s;
          payrollCount += 1;
        }
      }
    });

    // Vendor / Supplier Bill Payments
    let vendorPaymentsSum = 0;
    let vendorPaymentsCount = 0;

    allTransactions.forEach(t => {
      const d = t.Date || t.TransactionDate || t.CreatedAt;
      if (isDateInRange(d)) {
        const isVendor = t.Type === 'VendorPayment' || t.Type === 'VENDOR_PAYMENT' || (t.Category && t.Category.toLowerCase().includes('supplier'));
        if (isVendor) {
          vendorPaymentsSum += (Number(t.Amount) || 0);
          vendorPaymentsCount += 1;
        }
      }
    });

    const totalGrossOutflow = operationalExpensesSum + payrollsSum + vendorPaymentsSum;
    const netOperatingSurplus = totalGrossInflow - totalGrossOutflow;

    // 3. Stock Procurement (GRN Inward)
    let grnTotalAmount = 0;
    let grnCount = 0;

    allGrns.forEach(grn => {
      const d = grn.ReceivedDate || grn.Date || grn.GrnDate || grn.CreatedAt;
      if (isDateInRange(d)) {
        const amt = Number(grn.TotalAmount) || Number(grn.NetAmount) || Number(grn.BillAmount) || Number(grn.GAmount) || 0;
        grnTotalAmount += amt;
        grnCount += 1;
      }
    });

    return {
      totalGrossInflow,
      totalGrossOutflow,
      netOperatingSurplus,
      opdTokensSum,
      doctorConsultationSum,
      clinicCardFeesSum,
      totalOpdInflow,
      clinicalCompoundingSum,
      pharmacyPosSalesSum,
      miscInflowsSum,
      operationalExpensesSum,
      payrollsSum,
      vendorPaymentsSum,
      grnTotalAmount,
      grnCount,
      appointmentsCount,
      visitsCount,
      posInvoicesCount,
      expensesCount,
      payrollCount,
      vendorPaymentsCount
    };
  };

  // Pre-calculate metrics for each of the 12 months
  const monthsData = useMemo(() => {
    return monthsList.map(m => {
      const metrics = calculatePeriodMetrics(m.startDate, m.endDate);
      const savedStatus = periodStatuses[m.periodId];
      const isClosed = savedStatus?.Status === 'CLOSED';

      return {
        ...m,
        metrics,
        isClosed,
        savedStatus
      };
    });
  }, [
    monthsList,
    periodStatuses,
    allAppointments,
    allTokens,
    allVisits,
    allPosSales,
    allExpenses,
    allPayrolls,
    allTransactions,
    allGrns,
    dbVouchers
  ]);

  // Overall Financial Year Summary
  const yearSummary = useMemo(() => {
    let totalYearInflow = 0;
    let totalYearOutflow = 0;
    let totalYearOpd = 0;
    let totalYearPharmacy = 0;
    let totalYearExpenses = 0;
    let totalYearVendorPayments = 0;
    let totalYearGrn = 0;
    let closedMonthsCount = 0;

    monthsData.forEach(m => {
      totalYearInflow += m.metrics.totalGrossInflow;
      totalYearOutflow += m.metrics.totalGrossOutflow;
      totalYearOpd += m.metrics.totalOpdInflow;
      totalYearPharmacy += (m.metrics.pharmacyPosSalesSum + m.metrics.clinicalCompoundingSum);
      totalYearExpenses += (m.metrics.operationalExpensesSum + m.metrics.payrollsSum);
      totalYearVendorPayments += m.metrics.vendorPaymentsSum;
      totalYearGrn += m.metrics.grnTotalAmount;
      if (m.isClosed) closedMonthsCount += 1;
    });

    const netYearSurplus = totalYearInflow - totalYearOutflow;

    return {
      totalYearInflow,
      totalYearOutflow,
      netYearSurplus,
      totalYearOpd,
      totalYearPharmacy,
      totalYearExpenses,
      totalYearVendorPayments,
      totalYearGrn,
      closedMonthsCount,
      openMonthsCount: 12 - closedMonthsCount
    };
  }, [monthsData]);

  // Toggle Month Close / Re-open Action
  const handleToggleMonthStatus = (monthObj: typeof monthsData[0], notes = '') => {
    const periodId = monthObj.periodId;
    const currentlyClosed = monthObj.isClosed;

    if (currentlyClosed) {
      // Re-opening
      const updated = { ...periodStatuses };
      delete updated[periodId];
      setPeriodStatuses(updated);
      showNotification(`Month ${monthObj.monthName} ${monthObj.year} has been RE-OPENED for active transactions.`);
      if (selectedAuditMonth && selectedAuditMonth.periodId === periodId) {
        setSelectedAuditMonth(prev => prev ? { ...prev, isClosed: false, periodData: null } : null);
      }
    } else {
      // Closing Month
      const snapshot = {
        TotalInflow: monthObj.metrics.totalGrossInflow,
        TotalOutflow: monthObj.metrics.totalGrossOutflow,
        NetSurplus: monthObj.metrics.netOperatingSurplus,
        OpdInflow: monthObj.metrics.totalOpdInflow,
        PharmacyInflow: monthObj.metrics.pharmacyPosSalesSum + monthObj.metrics.clinicalCompoundingSum,
        VendorPayments: monthObj.metrics.vendorPaymentsSum,
        ExpenseOutflow: monthObj.metrics.operationalExpensesSum + monthObj.metrics.payrollsSum,
        GrnTotal: monthObj.metrics.grnTotalAmount
      };

      const newClosedPeriod: FiscalMonthPeriod = {
        PeriodID: periodId,
        Year: monthObj.year,
        Month: monthObj.month,
        MonthName: monthObj.monthName,
        StartDate: monthObj.startDate,
        EndDate: monthObj.endDate,
        Status: 'CLOSED',
        ClosedAt: new Date().toLocaleString('en-GB'),
        ClosedBy: currentUser?.FullName || currentUser?.LoginName || 'Administrator',
        Notes: notes || 'Period closed after standard financial and stock reconciliation.',
        ClosingSnapshot: snapshot
      };

      setPeriodStatuses(prev => ({
        ...prev,
        [periodId]: newClosedPeriod
      }));

      showNotification(`Month ${monthObj.monthName} ${monthObj.year} is now CLOSED & LOCKED against backdating.`);
      if (selectedAuditMonth && selectedAuditMonth.periodId === periodId) {
        setSelectedAuditMonth(prev => prev ? { ...prev, isClosed: true, periodData: newClosedPeriod } : null);
      }
    }
  };

  // Open 360° Monthly Audit Drawer/Modal
  const handleOpenAuditModal = (m: typeof monthsData[0]) => {
    setSelectedAuditMonth({
      year: m.year,
      month: m.month,
      monthName: m.monthName,
      startDate: m.startDate,
      endDate: m.endDate,
      periodId: m.periodId,
      isClosed: m.isClosed,
      periodData: m.savedStatus || null
    });
    setCloseNotesInput(m.savedStatus?.Notes || '');
    setAuditSearchTerm('');
    setAuditTypeFilter('ALL');
  };

  // Itemized transactions list for the selected audit month
  const auditMonthTransactions = useMemo(() => {
    if (!selectedAuditMonth) return [];
    const { startDate, endDate } = selectedAuditMonth;
    const isDateInRange = (rawDate?: any) => {
      const ymd = normalizeDateToYMD(rawDate);
      if (!ymd) return false;
      return ymd >= startDate && ymd <= endDate;
    };

    const rows: Array<{
      id: string;
      date: string;
      title: string;
      category: string;
      type: 'INFLOW' | 'OUTFLOW';
      amount: number;
      ref: string;
      source: string;
    }> = [];

    // 1. OPD Appointments
    allAppointments.forEach(app => {
      const d = app.AppointmentDate || app.BookingDate || app.Date || app.CreatedAt;
      if (isDateInRange(d) && app.Status !== 3 && app.Status !== 'Cancelled') {
        const amt = Number(app.FeeCharged) || Number(app.Fee) || Number(app.ConsultationFee) || 0;
        if (amt > 0) {
          const ymd = normalizeDateToYMD(d) || startDate;
          rows.push({
            id: `APP-${app.AppointmentID || app._id || Math.random()}`,
            date: ymd,
            title: `OPD Consultation Token: ${app.PatientName || 'Patient'}`,
            category: 'OPD Token Fee',
            type: 'INFLOW',
            amount: amt,
            ref: `TOKEN-${app.AppointmentID || app.TokenNo || '001'}`,
            source: 'Appointments Desk'
          });
        }
      }
    });

    // 2. Doctor Patient Visits
    allVisits.forEach(vis => {
      const d = vis.VisitDate || vis.Date || vis.CreatedAt;
      if (isDateInRange(d)) {
        const ymd = normalizeDateToYMD(d) || startDate;
        const consult = Number(vis.ConsultationFee) || Number(vis.DoctorFee) || 0;
        const card = Number(vis.CardFee) || Number(vis.CardPkr) || Number(vis.FileFee) || Number(vis.FilePkr) || 0;
        const clinical = Number(vis.ClinicalMedicinePayment) || Number(vis.ClinicalMedicineFee) || Number(vis.ClinicalMedicinePkr) || 0;

        if (consult > 0) {
          rows.push({
            id: `VIS-CONS-${vis.VisitID || vis._id || Math.random()}`,
            date: ymd,
            title: `Doctor OPD Consultation (Pt: ${vis.PatientName || vis.PatientID || 'Patient'})`,
            category: 'Doctor Consultation',
            type: 'INFLOW',
            amount: consult,
            ref: `VIS-${vis.VisitID || 'N/A'}`,
            source: 'EMR Doctor Desk'
          });
        }

        if (card > 0) {
          rows.push({
            id: `VIS-CARD-${vis.VisitID || vis._id || Math.random()}`,
            date: ymd,
            title: `Patient Registration / Card Fee (${vis.PatientName || vis.PatientID || 'N/A'})`,
            category: 'Registration & Card',
            type: 'INFLOW',
            amount: card,
            ref: `CARD-${vis.PatientID || '001'}`,
            source: 'Reception'
          });
        }

        if (clinical > 0) {
          rows.push({
            id: `VIS-CLIN-${vis.VisitID || vis._id || Math.random()}`,
            date: ymd,
            title: `Clinical Compounded Dispensing (${vis.PatientName || vis.PatientID || 'N/A'})`,
            category: 'Clinical Compounding',
            type: 'INFLOW',
            amount: clinical,
            ref: `PV-${vis.VisitID || '001'}`,
            source: 'Dispensary'
          });
        }
      }
    });

    // 3. POS Pharmacy Invoices
    allPosSales.forEach(sale => {
      const d = sale.InvoiceDate || sale.Date || sale.CreatedAt || sale.InvDate;
      if (isDateInRange(d)) {
        const ymd = normalizeDateToYMD(d) || startDate;
        const net = Number(sale.NetAmount) || Number(sale.GAmount) || Number(sale.TotalAmount) || Number(sale.GrandTotal) || 0;
        if (net > 0) {
          rows.push({
            id: `INV-${sale.InvoiceNo || sale._id || Math.random()}`,
            date: ymd,
            title: `Pharmacy Store Counter Sale (${sale.PatientID ? `Pt #${sale.PatientID}` : (sale.CustomerName || 'Walk-in')})`,
            category: 'Pharmacy POS Sale',
            type: 'INFLOW',
            amount: net,
            ref: sale.InvoiceNo || 'POS-INV',
            source: 'Pharmacy POS'
          });
        }
      }
    });

    // 4. Expenses
    allExpenses.forEach(exp => {
      const d = exp.ExpenseDate || exp.Date || exp.CreatedAt;
      if (isDateInRange(d)) {
        const ymd = normalizeDateToYMD(d) || startDate;
        const amt = Number(exp.Amount) || Number(exp.ExpenseAmount) || 0;
        if (amt > 0) {
          rows.push({
            id: `EXP-${exp.ExpenseID || exp._id || Math.random()}`,
            date: ymd,
            title: exp.Description || exp.Category || 'Clinic Operational Expense',
            category: exp.Category || 'Operating Expense',
            type: 'OUTFLOW',
            amount: amt,
            ref: exp.ExpenseID || 'EXP',
            source: 'Expenses Desk'
          });
        }
      }
    });

    // 5. Staff Salaries (Payroll)
    allPayrolls.forEach(p => {
      const d = p.PaymentDate || p.Date || (p.MonthYear ? `${p.MonthYear}-01` : null);
      if (isDateInRange(d) || (p.MonthYear && startDate.startsWith(p.MonthYear))) {
        const ymd = normalizeDateToYMD(d) || startDate;
        const s = Number(p.NetSalary) || Number(p.BasicSalary) || 0;
        if (s > 0) {
          rows.push({
            id: `PAY-${p.PayrollID || p._id || Math.random()}`,
            date: ymd,
            title: `Staff Salary Disbursement (${p.EmployeeName || p.EmployeeID || 'Staff'})`,
            category: 'Staff Salary & Payroll',
            type: 'OUTFLOW',
            amount: s,
            ref: p.PayrollID || 'PAYROLL',
            source: 'HR Payroll'
          });
        }
      }
    });

    // 6. Vendor Payments & GL Transactions
    allTransactions.forEach(t => {
      const d = t.Date || t.TransactionDate || t.CreatedAt;
      if (isDateInRange(d)) {
        const ymd = normalizeDateToYMD(d) || startDate;
        const amt = Number(t.Amount) || 0;
        if (amt > 0) {
          const isVendor = t.Type === 'VendorPayment' || t.Type === 'VENDOR_PAYMENT' || (t.Category && t.Category.toLowerCase().includes('supplier'));
          if (isVendor) {
            rows.push({
              id: `TXN-${t.TransactionID || t._id || Math.random()}`,
              date: ymd,
              title: `Vendor Payment to ${t.VendorName || 'Supplier'}`,
              category: 'Supplier Bill Settlement',
              type: 'OUTFLOW',
              amount: amt,
              ref: t.ReferenceNo || t.TransactionID || 'VND-PAY',
              source: 'Vendor Ledger'
            });
          } else if (t.Type === 'Income' || t.Type === 'CustomerReceipt') {
            rows.push({
              id: `TXN-${t.TransactionID || t._id || Math.random()}`,
              date: ymd,
              title: t.Description || 'Direct Income Receipt',
              category: t.Category || 'Other Income',
              type: 'INFLOW',
              amount: amt,
              ref: t.ReferenceNo || t.TransactionID || 'CRV',
              source: 'General Ledger'
            });
          }
        }
      }
    });

    // Sort descending by date
    rows.sort((a, b) => b.date.localeCompare(a.date));
    return rows;
  }, [selectedAuditMonth, allAppointments, allVisits, allPosSales, allExpenses, allPayrolls, allTransactions]);

  // Filtered transactions inside audit modal
  const filteredAuditTransactions = useMemo(() => {
    return auditMonthTransactions.filter(r => {
      if (auditTypeFilter === 'INFLOW' && r.type !== 'INFLOW') return false;
      if (auditTypeFilter === 'OUTFLOW' && r.type !== 'OUTFLOW') return false;
      if (auditTypeFilter === 'VENDOR' && !r.title.toLowerCase().includes('vendor') && !r.category.toLowerCase().includes('supplier')) return false;
      if (auditTypeFilter === 'EXPENSE' && !r.source.toLowerCase().includes('expense') && !r.category.toLowerCase().includes('operating')) return false;

      if (auditSearchTerm.trim()) {
        const q = auditSearchTerm.toLowerCase().trim();
        const matchTitle = r.title.toLowerCase().includes(q);
        const matchRef = r.ref.toLowerCase().includes(q);
        const matchCat = r.category.toLowerCase().includes(q);
        const matchDate = r.date.toLowerCase().includes(q);
        if (!matchTitle && !matchRef && !matchCat && !matchDate) return false;
      }
      return true;
    });
  }, [auditMonthTransactions, auditTypeFilter, auditSearchTerm]);

  // Printable A4 Statement for Single Month
  const handlePrintMonthlyStatement = (monthObj: typeof monthsData[0]) => {
    const printWin = window.open('', '_blank', 'width=900,height=950');
    if (!printWin) return alert('Popup blocked. Please allow popups to print Monthly Financial Statement.');

    const cName = clinicSettings?.ClinicName || 'PUNJAB HOMEOPATHIC CLINIC & PHARMACY';
    const cTag = clinicSettings?.ClinicLogoText || 'HEALING NATURALLY. RESTORING BALANCE.';
    const cAddress = clinicSettings?.Address || 'Opposite State Bank of Pakistan, Mall Road, Lahore';
    const cPhone = clinicSettings?.PhoneNo || '042-3111222 / 0300-1234567';

    const { metrics, isClosed, savedStatus } = monthObj;

    printWin.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Monthly Financial Audit & Closure Statement - ${monthObj.monthName} ${monthObj.year}</title>
          <style>
            @page { size: A4 portrait; margin: 12mm 14mm 14mm 14mm; }
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; color: #0f172a; margin: 0; padding: 0; font-size: 11px; line-height: 1.4; background: #fff; }
            * { box-sizing: border-box; }
            .header-wrap { display: flex; justify-content: space-between; align-items: center; border-bottom: 2.5px solid #064e3b; padding-bottom: 8px; margin-bottom: 12px; }
            .clinic-title { font-size: 16px; font-weight: 900; color: #064e3b; text-transform: uppercase; margin: 0; }
            .clinic-sub { font-size: 9.5px; color: #475569; margin-top: 2px; }
            .badge-box { text-align: right; }
            .status-tag { display: inline-block; padding: 3px 8px; font-size: 10px; font-weight: 800; border-radius: 4px; text-transform: uppercase; font-family: monospace; }
            .status-closed { background: #fef2f2; color: #991b1b; border: 1px solid #fecaca; }
            .status-open { background: #f0fdf4; color: #166534; border: 1px solid #bbf7d0; }
            
            .report-title-bar { background: #0f172a; color: #fff; padding: 6px 10px; font-weight: 800; font-size: 11px; text-transform: uppercase; display: flex; justify-content: space-between; margin-bottom: 12px; border-radius: 4px; }
            .meta-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 14px; }
            .meta-item { background: #f8fafc; border: 1px solid #e2e8f0; padding: 6px 8px; border-radius: 4px; }
            .meta-lbl { font-size: 8.5px; font-weight: 800; color: #64748b; text-transform: uppercase; display: block; }
            .meta-val { font-size: 11px; font-weight: 800; color: #0f172a; margin-top: 1px; }

            .section-head { font-size: 11px; font-weight: 800; color: #064e3b; text-transform: uppercase; border-bottom: 1.5px solid #cbd5e1; padding-bottom: 4px; margin: 14px 0 8px 0; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 12px; font-size: 10.5px; }
            th { background: #f1f5f9; color: #334155; font-weight: 800; text-align: left; padding: 6px 8px; border-bottom: 1.5px solid #cbd5e1; text-transform: uppercase; font-size: 9px; }
            td { padding: 5px 8px; border-bottom: 1px solid #e2e8f0; }
            .num { text-align: right; font-family: monospace; font-weight: 700; }
            .tot-row { background: #f8fafc; font-weight: 900; }
            .tot-row td { border-top: 1.5px solid #0f172a; border-bottom: 1.5px solid #0f172a; font-size: 11px; }

            .kpi-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin: 12px 0; }
            .kpi-card { border: 1px solid #e2e8f0; border-radius: 6px; padding: 8px 10px; }
            .kpi-inflow { background: #f0fdf4; border-color: #86efac; }
            .kpi-outflow { background: #fef2f2; border-color: #fca5a5; }
            .kpi-net { background: #eef2ff; border-color: #a5b4fc; }

            .sig-section { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 30px; padding-top: 15px; border-top: 1px solid #cbd5e1; }
            .sig-box { text-align: center; width: 160px; }
            .sig-line { border-top: 1.5px solid #0f172a; padding-top: 4px; font-weight: 800; font-size: 9.5px; text-transform: uppercase; }
            .sig-sub { font-size: 8.5px; color: #64748b; margin-top: 1px; }
            .footer-txt { text-align: center; font-size: 8.5px; color: #94a3b8; margin-top: 15px; border-top: 1px dashed #cbd5e1; padding-top: 6px; }
          </style>
        </head>
        <body>
          <div class="header-wrap">
            <div>
              <h1 class="clinic-title">${cName}</h1>
              <div class="clinic-sub">${cTag}</div>
              <div class="clinic-sub">${cAddress} • Ph: ${cPhone}</div>
            </div>
            <div class="badge-box">
              <span class="status-tag ${isClosed ? 'status-closed' : 'status-open'}">
                ${isClosed ? '🔒 PERIOD CLOSED & AUDITED' : '🟢 ACTIVE OPEN PERIOD'}
              </span>
              <div style="font-size: 8.5px; color: #64748b; margin-top: 3px; font-mono font-bold;">
                Period ID: ${monthObj.periodId}
              </div>
            </div>
          </div>

          <div class="report-title-bar">
            <span>OFFICIAL MONTHLY FINANCIAL AUDIT & REVENUE STATEMENT</span>
            <span>PERIOD: ${monthObj.monthName.toUpperCase()} ${monthObj.year}</span>
          </div>

          <div class="meta-grid">
            <div class="meta-item">
              <span class="meta-lbl">Operational Month</span>
              <span class="meta-val">${monthObj.monthName} ${monthObj.year}</span>
            </div>
            <div class="meta-item">
              <span class="meta-lbl">Date Duration</span>
              <span class="meta-val">${monthObj.startDate} to ${monthObj.endDate}</span>
            </div>
            <div class="meta-item">
              <span class="meta-lbl">Closure Status</span>
              <span class="meta-val" style="color: ${isClosed ? '#991b1b' : '#166534'};">
                ${isClosed ? 'Locked & Sealed' : 'Active (Open)'}
              </span>
            </div>
            <div class="meta-item">
              <span class="meta-lbl">Generated By</span>
              <span class="meta-val">${currentUser?.FullName || currentUser?.LoginName || 'Staff Accountant'}</span>
            </div>
          </div>

          <div class="kpi-row">
            <div class="kpi-card kpi-inflow">
              <span style="font-size: 8.5px; font-weight: 800; color: #166534; text-transform: uppercase;">Total Realized Inflows</span>
              <div style="font-size: 15px; font-weight: 900; color: #14532d; font-family: monospace; margin-top: 2px;">
                Rs. ${metrics.totalGrossInflow.toLocaleString('en-PK', { minimumFractionDigits: 2 })}
              </div>
              <span style="font-size: 8.5px; color: #15803d;">OPD Tokens (${metrics.appointmentsCount}) + Doctor (${metrics.visitsCount}) + Pharmacy POS (${metrics.posInvoicesCount})</span>
            </div>

            <div class="kpi-card kpi-outflow">
              <span style="font-size: 8.5px; font-weight: 800; color: #991b1b; text-transform: uppercase;">Total Realized Outflows</span>
              <div style="font-size: 15px; font-weight: 900; color: #7f1d1d; font-family: monospace; margin-top: 2px;">
                Rs. ${metrics.totalGrossOutflow.toLocaleString('en-PK', { minimumFractionDigits: 2 })}
              </div>
              <span style="font-size: 8.5px; color: #b91c1c;">Expenses (${metrics.expensesCount}) + Vendor Payments (${metrics.vendorPaymentsCount}) + Payroll (${metrics.payrollCount})</span>
            </div>

            <div class="kpi-card kpi-net">
              <span style="font-size: 8.5px; font-weight: 800; color: #3730a3; text-transform: uppercase;">Net Operating Surplus / Margin</span>
              <div style="font-size: 15px; font-weight: 900; color: #1e1b4b; font-family: monospace; margin-top: 2px;">
                Rs. ${metrics.netOperatingSurplus.toLocaleString('en-PK', { minimumFractionDigits: 2 })}
              </div>
              <span style="font-size: 8.5px; color: #4338ca;">Gross Inflows Minus Total Outflows</span>
            </div>
          </div>

          <!-- Section 1: Revenue Inflows -->
          <div class="section-head">1. Monthly Cash Inflows & Revenue Breakdown</div>
          <table>
            <thead>
              <tr>
                <th style="width: 35px;">#</th>
                <th>Revenue & Inflow Category</th>
                <th>Department / Stream</th>
                <th style="text-align: right; width: 140px;">Realized Cash (Rs.)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>1</td>
                <td><strong>OPD Consultation Token Fees</strong></td>
                <td>Reception / Appointments Desk (${metrics.appointmentsCount} tokens)</td>
                <td class="num">Rs. ${metrics.opdTokensSum.toLocaleString('en-PK', { minimumFractionDigits: 2 })}</td>
              </tr>
              <tr>
                <td>2</td>
                <td><strong>Doctor Consultation & File Card Charges</strong></td>
                <td>OPD Doctor Consultation Room (${metrics.visitsCount} patient visits)</td>
                <td class="num">Rs. ${(metrics.doctorConsultationSum + metrics.clinicCardFeesSum).toLocaleString('en-PK', { minimumFractionDigits: 2 })}</td>
              </tr>
              <tr>
                <td>3</td>
                <td><strong>Pharmacy Patent Medicine & Retail Sales</strong></td>
                <td>Pharmacy POS Counter (${metrics.posInvoicesCount} invoices)</td>
                <td class="num">Rs. ${metrics.pharmacyPosSalesSum.toLocaleString('en-PK', { minimumFractionDigits: 2 })}</td>
              </tr>
              <tr>
                <td>4</td>
                <td><strong>Clinical Compounding Dispensing Revenue</strong></td>
                <td>Dispensary / Compounding Room</td>
                <td class="num">Rs. ${metrics.clinicalCompoundingSum.toLocaleString('en-PK', { minimumFractionDigits: 2 })}</td>
              </tr>
              ${metrics.miscInflowsSum > 0 ? `
              <tr>
                <td>5</td>
                <td><strong>Miscellaneous Receipts / Cash Vouchers</strong></td>
                <td>General Accounts (CRV / BRV)</td>
                <td class="num">Rs. ${metrics.miscInflowsSum.toLocaleString('en-PK', { minimumFractionDigits: 2 })}</td>
              </tr>` : ''}
              <tr class="tot-row">
                <td colspan="3" style="text-align: right; text-transform: uppercase;">Total Realized Cash Inflow for ${monthObj.monthName}:</td>
                <td class="num" style="color: #14532d;">Rs. ${metrics.totalGrossInflow.toLocaleString('en-PK', { minimumFractionDigits: 2 })}</td>
              </tr>
            </tbody>
          </table>

          <!-- Section 2: Expenditures & Outflows -->
          <div class="section-head">2. Monthly Expenditures & Vendor Disbursements</div>
          <table>
            <thead>
              <tr>
                <th style="width: 35px;">#</th>
                <th>Expenditure & Outflow Head</th>
                <th>Payment Mode / Description</th>
                <th style="text-align: right; width: 140px;">Paid Outflow (Rs.)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>1</td>
                <td><strong>Clinic Operational & Maintenance Expenses</strong></td>
                <td>Utility bills, rent, office tea, maintenance (${metrics.expensesCount} vouchers)</td>
                <td class="num">Rs. ${metrics.operationalExpensesSum.toLocaleString('en-PK', { minimumFractionDigits: 2 })}</td>
              </tr>
              <tr>
                <td>2</td>
                <td><strong>Vendor & Medicine Supplier Bill Payments</strong></td>
                <td>Supplier settlements (${metrics.vendorPaymentsCount} payment vouchers)</td>
                <td class="num">Rs. ${metrics.vendorPaymentsSum.toLocaleString('en-PK', { minimumFractionDigits: 2 })}</td>
              </tr>
              <tr>
                <td>3</td>
                <td><strong>Staff Salaries & Payroll Disbursements</strong></td>
                <td>Doctor, pharmacist & staff salary payout (${metrics.payrollCount} salaries)</td>
                <td class="num">Rs. ${metrics.payrollsSum.toLocaleString('en-PK', { minimumFractionDigits: 2 })}</td>
              </tr>
              <tr class="tot-row">
                <td colspan="3" style="text-align: right; text-transform: uppercase;">Total Operating Outflow for ${monthObj.monthName}:</td>
                <td class="num" style="color: #7f1d1d;">Rs. ${metrics.totalGrossOutflow.toLocaleString('en-PK', { minimumFractionDigits: 2 })}</td>
              </tr>
            </tbody>
          </table>

          <!-- Section 3: Stock Purchases Inward (GRN) -->
          <div class="section-head">3. Medicine Procurement & Inventory Capitalization (GRN)</div>
          <table>
            <thead>
              <tr>
                <th>Stock Shipments Received</th>
                <th>Total Inward Valuation</th>
                <th>Suppliers Settlement Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>${metrics.grnCount} Goods Received Notes (GRN)</strong></td>
                <td class="num" style="font-size: 11px;">Rs. ${metrics.grnTotalAmount.toLocaleString('en-PK', { minimumFractionDigits: 2 })}</td>
                <td>Payments Paid: <strong>Rs. ${metrics.vendorPaymentsSum.toLocaleString('en-PK', { minimumFractionDigits: 2 })}</strong></td>
              </tr>
            </tbody>
          </table>

          ${savedStatus?.Notes ? `
          <div style="margin-top: 10px; padding: 6px 10px; background: #fffbeb; border: 1px solid #fef08a; border-radius: 4px; font-size: 9.5px;">
            <strong>Period Audit Remarks / Auditor Notes:</strong> ${savedStatus.Notes}
          </div>` : ''}

          <div class="sig-section">
            <div class="sig-box">
              <div class="sig-line">Prepared By</div>
              <div class="sig-sub">${currentUser?.FullName || currentUser?.LoginName || 'Staff Accountant'}</div>
            </div>
            <div class="sig-box">
              <div class="sig-line">Duty Auditor</div>
              <div class="sig-sub">Internal Audit & Accounts</div>
            </div>
            <div class="sig-box">
              <div class="sig-line">MR. ZAIGHAM ALI ANJUM</div>
              <div class="sig-sub">Operations Manager & Admin Head</div>
            </div>
          </div>

          <div class="footer-txt">
            Official Confidential Statement • Punjab Homeopathic Clinic & Pharmacy Management System • Generated on ${new Date().toLocaleString('en-GB')}
          </div>

          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `);
    printWin.document.close();
    printWin.focus();
    setTimeout(() => printWin.print(), 300);
  };

  // Printable A4 Annual Summary for Entire Year (All 12 Months)
  const handlePrintAnnualSummary = () => {
    const printWin = window.open('', '_blank', 'width=950,height=950');
    if (!printWin) return alert('Popup blocked. Please allow popups to print Annual Financial Report.');

    const cName = clinicSettings?.ClinicName || 'PUNJAB HOMEOPATHIC CLINIC & PHARMACY';
    const cAddress = clinicSettings?.Address || 'Opposite State Bank of Pakistan, Mall Road, Lahore';

    const rowsHtml = monthsData.map((m, idx) => `
      <tr style="${idx % 2 === 1 ? 'background: #f8fafc;' : ''}">
        <td style="text-align: center; font-weight: bold; font-family: monospace;">${idx + 1}</td>
        <td><strong>${m.monthName} ${m.year}</strong></td>
        <td style="text-align: center;">
          <span style="font-size: 8px; font-weight: 800; padding: 2px 5px; border-radius: 3px; background: ${m.isClosed ? '#fef2f2; color: #991b1b;' : '#f0fdf4; color: #166534;'}">
            ${m.isClosed ? 'CLOSED' : 'OPEN'}
          </span>
        </td>
        <td class="num">Rs. ${m.metrics.totalOpdInflow.toLocaleString('en-PK', { maximumFractionDigits: 0 })}</td>
        <td class="num">Rs. ${(m.metrics.pharmacyPosSalesSum + m.metrics.clinicalCompoundingSum).toLocaleString('en-PK', { maximumFractionDigits: 0 })}</td>
        <td class="num" style="font-weight: 800; color: #14532d; background: #f0fdf4;">Rs. ${m.metrics.totalGrossInflow.toLocaleString('en-PK', { maximumFractionDigits: 0 })}</td>
        <td class="num">Rs. ${(m.metrics.operationalExpensesSum + m.metrics.payrollsSum).toLocaleString('en-PK', { maximumFractionDigits: 0 })}</td>
        <td class="num">Rs. ${m.metrics.vendorPaymentsSum.toLocaleString('en-PK', { maximumFractionDigits: 0 })}</td>
        <td class="num" style="font-weight: 800; color: #7f1d1d; background: #fef2f2;">Rs. ${m.metrics.totalGrossOutflow.toLocaleString('en-PK', { maximumFractionDigits: 0 })}</td>
        <td class="num" style="font-weight: 900; color: ${m.metrics.netOperatingSurplus >= 0 ? '#14532d' : '#991b1b'};">Rs. ${m.metrics.netOperatingSurplus.toLocaleString('en-PK', { maximumFractionDigits: 0 })}</td>
      </tr>
    `).join('');

    printWin.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Annual Financial Audit Report - FY ${selectedYear}</title>
          <style>
            @page { size: A4 landscape; margin: 10mm 12mm 12mm 12mm; }
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; color: #0f172a; margin: 0; padding: 0; font-size: 10px; line-height: 1.35; background: #fff; }
            * { box-sizing: border-box; }
            .header-wrap { display: flex; justify-content: space-between; align-items: center; border-bottom: 2.5px solid #064e3b; padding-bottom: 6px; margin-bottom: 10px; }
            .clinic-title { font-size: 15px; font-weight: 900; color: #064e3b; text-transform: uppercase; margin: 0; }
            .clinic-sub { font-size: 9px; color: #475569; }
            .report-title-bar { background: #0f172a; color: #fff; padding: 5px 8px; font-weight: 800; font-size: 10px; text-transform: uppercase; display: flex; justify-content: space-between; margin-bottom: 10px; border-radius: 4px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 10px; font-size: 9.5px; }
            th { background: #f1f5f9; color: #334155; font-weight: 800; text-align: left; padding: 5px 6px; border-bottom: 1.5px solid #cbd5e1; text-transform: uppercase; font-size: 8px; }
            td { padding: 4px 6px; border-bottom: 1px solid #e2e8f0; }
            .num { text-align: right; font-family: monospace; }
            .tot-row { background: #f1f5f9; font-weight: 900; }
            .tot-row td { border-top: 2px solid #0f172a; border-bottom: 2px solid #0f172a; font-size: 10px; }
            .sig-section { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 20px; padding-top: 10px; border-top: 1px solid #cbd5e1; }
            .sig-box { text-align: center; width: 150px; }
            .sig-line { border-top: 1.5px solid #0f172a; padding-top: 3px; font-weight: 800; font-size: 9px; text-transform: uppercase; }
            .sig-sub { font-size: 8px; color: #64748b; }
          </style>
        </head>
        <body>
          <div class="header-wrap">
            <div>
              <h1 class="clinic-title">${cName}</h1>
              <div class="clinic-sub">${cAddress}</div>
            </div>
            <div style="text-align: right;">
              <span style="font-weight: 800; font-size: 11px; color: #064e3b;">ANNUAL FINANCIAL CALENDAR AUDIT</span>
              <div style="font-size: 9px; color: #64748b;">Fiscal Year: <strong>${selectedYear}</strong> (${yearType === 'CALENDAR' ? 'Jan-Dec' : 'Jul-Jun'})</div>
            </div>
          </div>

          <div class="report-title-bar">
            <span>12-Month Comparative Financial Revenue, Expenses & Surplus Audit</span>
            <span>Closed Periods: ${yearSummary.closedMonthsCount} / 12 Months</span>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 25px; text-align: center;">#</th>
                <th>Month & Year</th>
                <th style="text-align: center; width: 55px;">Status</th>
                <th style="text-align: right;">OPD Inflow</th>
                <th style="text-align: right;">Pharmacy Inflow</th>
                <th style="text-align: right; background: #e2fbe8;">Total Inflows</th>
                <th style="text-align: right;">Expenses & Salaries</th>
                <th style="text-align: right;">Vendor Payments</th>
                <th style="text-align: right; background: #fee2e2;">Total Outflows</th>
                <th style="text-align: right;">Net Surplus</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
              <tr class="tot-row">
                <td colspan="3" style="text-align: right; text-transform: uppercase;">Grand Annual Total:</td>
                <td class="num">Rs. ${yearSummary.totalYearOpd.toLocaleString('en-PK', { maximumFractionDigits: 0 })}</td>
                <td class="num">Rs. ${yearSummary.totalYearPharmacy.toLocaleString('en-PK', { maximumFractionDigits: 0 })}</td>
                <td class="num" style="color: #14532d; background: #dcfce7;">Rs. ${yearSummary.totalYearInflow.toLocaleString('en-PK', { maximumFractionDigits: 0 })}</td>
                <td class="num">Rs. ${yearSummary.totalYearExpenses.toLocaleString('en-PK', { maximumFractionDigits: 0 })}</td>
                <td class="num">Rs. ${yearSummary.totalYearVendorPayments.toLocaleString('en-PK', { maximumFractionDigits: 0 })}</td>
                <td class="num" style="color: #7f1d1d; background: #fee2e2;">Rs. ${yearSummary.totalYearOutflow.toLocaleString('en-PK', { maximumFractionDigits: 0 })}</td>
                <td class="num" style="color: ${yearSummary.netYearSurplus >= 0 ? '#14532d' : '#991b1b'};">Rs. ${yearSummary.netYearSurplus.toLocaleString('en-PK', { maximumFractionDigits: 0 })}</td>
              </tr>
            </tbody>
          </table>

          <div class="sig-section">
            <div class="sig-box">
              <div class="sig-line">Prepared By</div>
              <div class="sig-sub">${currentUser?.FullName || currentUser?.LoginName || 'Staff Accountant'}</div>
            </div>
            <div class="sig-box">
              <div class="sig-line">Internal Audit</div>
              <div class="sig-sub">Financial Audit Dept</div>
            </div>
            <div class="sig-box">
              <div class="sig-line">MR. ZAIGHAM ALI ANJUM</div>
              <div class="sig-sub">Manager Operations & Admin Head</div>
            </div>
          </div>
          <script>window.onload = function() { window.print(); }</script>
        </body>
      </html>
    `);
    printWin.document.close();
    printWin.focus();
    setTimeout(() => printWin.print(), 300);
  };

  return (
    <div className="space-y-6 animate-fadeIn font-sans" id="fiscal-calendar-desk">
      {/* Status Notification Toast */}
      {statusNotification && (
        <div className="fixed top-5 right-5 z-[99999] bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl border border-slate-700 flex items-center space-x-2.5 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="text-xs font-bold">{statusNotification}</span>
        </div>
      )}

      {/* TOP CONFIGURATION & GLOBAL YEAR CONTROL BAR */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-100 shrink-0">
              <CalendarDays className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base sm:text-lg font-black text-slate-950 tracking-tight">
                  Financial Year & Monthly Periods Calendar
                </h2>
                <span className="px-2 py-0.5 bg-indigo-50 border border-indigo-200 text-indigo-800 rounded-md font-mono text-[11px] font-bold">
                  FY-{selectedYear}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Live database synchronization: OPD Collections, Pharmacy POS Sales, Clinical Compounding, Expenses, and Vendor Settlements.
              </p>
            </div>
          </div>

          {/* Controls: Year Selector, Calendar Mode, Refresh, Print Annual */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Year Selector */}
            <div className="flex items-center space-x-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl shadow-xs">
              <Calendar className="w-4 h-4 text-slate-400" />
              <label className="text-xxs font-extrabold text-slate-500 uppercase">Year:</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="bg-transparent text-xs font-black text-slate-900 focus:outline-none cursor-pointer"
              >
                {[currentYear - 2, currentYear - 1, currentYear, currentYear + 1, currentYear + 2].map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>

            {/* Calendar Scheme Toggle */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
              <button
                type="button"
                onClick={() => setYearType('CALENDAR')}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                  yearType === 'CALENDAR' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Jan – Dec
              </button>
              <button
                type="button"
                onClick={() => setYearType('JULY_JUNE')}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                  yearType === 'JULY_JUNE' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Jul – Jun (PK FY)
              </button>
            </div>

            {/* Refresh Live DB Button */}
            <button
              type="button"
              onClick={fetchAllDatabaseRecords}
              disabled={isRefreshingDb}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-xs rounded-xl transition cursor-pointer flex items-center space-x-1.5 border border-slate-200 shadow-2xs"
              title="Sync latest live collections from Database"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-indigo-600 ${isRefreshingDb ? 'animate-spin' : ''}`} />
              <span>{isRefreshingDb ? 'Syncing...' : 'Sync DB'}</span>
            </button>

            {/* Print Annual Report */}
            <button
              type="button"
              onClick={handlePrintAnnualSummary}
              className="px-4 py-2 bg-slate-900 hover:bg-black text-white font-extrabold text-xs rounded-xl shadow-sm flex items-center space-x-1.5 transition cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Annual Audit (A4)</span>
            </button>
          </div>
        </div>

        {/* ANNUAL MACRO FINANCIAL METRICS STRIP */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-2 border-t border-slate-100">
          <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl">
            <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider block">Closed Periods</span>
            <div className="text-lg font-black text-slate-900 mt-0.5 flex items-center space-x-1.5">
              <span className="font-mono text-rose-700">{yearSummary.closedMonthsCount} Locked</span>
              <span className="text-xs font-bold text-slate-400">/ {yearSummary.openMonthsCount} Open</span>
            </div>
            <span className="text-[10px] text-slate-500 font-semibold mt-0.5 block">Audit & tamper protected</span>
          </div>

          <div className="bg-emerald-50/70 border border-emerald-200 p-3 rounded-xl">
            <span className="text-[10px] font-extrabold uppercase text-emerald-800 tracking-wider block">Total Year Inflows</span>
            <div className="text-lg font-black text-emerald-700 mt-0.5 font-mono">
              Rs. {yearSummary.totalYearInflow.toLocaleString('en-PK', { maximumFractionDigits: 0 })}
            </div>
            <span className="text-[10px] text-emerald-900/80 font-bold mt-0.5 block">
              OPD: Rs. {yearSummary.totalYearOpd.toLocaleString('en-PK', { maximumFractionDigits: 0 })}
            </span>
          </div>

          <div className="bg-rose-50/70 border border-rose-200 p-3 rounded-xl">
            <span className="text-[10px] font-extrabold uppercase text-rose-800 tracking-wider block">Total Year Outflows</span>
            <div className="text-lg font-black text-rose-700 mt-0.5 font-mono">
              Rs. {yearSummary.totalYearOutflow.toLocaleString('en-PK', { maximumFractionDigits: 0 })}
            </div>
            <span className="text-[10px] text-rose-900/80 font-bold mt-0.5 block">
              Vendor Pay: Rs. {yearSummary.totalYearVendorPayments.toLocaleString('en-PK', { maximumFractionDigits: 0 })}
            </span>
          </div>

          <div className="bg-indigo-50/70 border border-indigo-200 p-3 rounded-xl">
            <span className="text-[10px] font-extrabold uppercase text-indigo-800 tracking-wider block">Net Operating Surplus</span>
            <div className={`text-lg font-black mt-0.5 font-mono ${yearSummary.netYearSurplus >= 0 ? 'text-indigo-900' : 'text-rose-700'}`}>
              Rs. {yearSummary.netYearSurplus.toLocaleString('en-PK', { maximumFractionDigits: 0 })}
            </div>
            <span className="text-[10px] text-indigo-700 font-bold mt-0.5 block">Gross Profit Margin</span>
          </div>

          <div className="bg-amber-50/70 border border-amber-200 p-3 rounded-xl col-span-2 sm:col-span-1">
            <span className="text-[10px] font-extrabold uppercase text-amber-800 tracking-wider block">Total Stock Purchases</span>
            <div className="text-lg font-black text-amber-900 mt-0.5 font-mono">
              Rs. {yearSummary.totalYearGrn.toLocaleString('en-PK', { maximumFractionDigits: 0 })}
            </div>
            <span className="text-[10px] text-amber-800/80 font-bold mt-0.5 block">Goods Inward (GRN)</span>
          </div>
        </div>
      </div>

      {/* 12-MONTH PERIODS CALENDAR CARDS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
        {monthsData.map((m) => {
          const { metrics, isClosed, savedStatus } = m;
          const isSurplus = metrics.netOperatingSurplus >= 0;

          return (
            <div
              key={m.periodId}
              className={`rounded-2xl border transition-all duration-200 shadow-xs hover:shadow-md flex flex-col justify-between overflow-hidden bg-white ${
                isClosed
                  ? 'border-slate-300 ring-1 ring-slate-200/80'
                  : 'border-slate-200 hover:border-indigo-300'
              }`}
            >
              {/* Card Top Header */}
              <div className={`p-4 border-b flex items-center justify-between ${
                isClosed ? 'bg-slate-100/90 border-slate-200' : 'bg-slate-50/70 border-slate-150'
              }`}>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-sm font-black text-slate-900">{m.monthName} {m.year}</h3>
                    <span className="px-1.5 py-0.2 rounded text-[9.5px] font-extrabold font-mono bg-slate-200 text-slate-700">
                      {m.quarter}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono font-semibold">
                    {m.startDate} ~ {m.endDate}
                  </span>
                </div>

                {/* Status Pill */}
                <div>
                  {isClosed ? (
                    <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-200 shadow-2xs">
                      <Lock className="w-3 h-3" />
                      <span>Closed</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200 shadow-2xs">
                      <Unlock className="w-3 h-3 text-emerald-600" />
                      <span>Open</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Card Body: Financial Breakdown */}
              <div className="p-4 space-y-3 flex-1 text-xs">
                {/* Inflows & Outflows stats */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-600 font-semibold flex items-center">
                      <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600 mr-1" />
                      Total Inflow (Receipts):
                    </span>
                    <strong className="font-mono font-black text-emerald-700">
                      Rs. {metrics.totalGrossInflow.toLocaleString('en-PK', { maximumFractionDigits: 0 })}
                    </strong>
                  </div>

                  <div className="pl-4 text-[10.5px] text-slate-500 space-y-0.5 font-medium">
                    <div className="flex justify-between">
                      <span>• OPD Consultations ({metrics.appointmentsCount + metrics.visitsCount}):</span>
                      <span className="font-mono font-semibold">Rs. {metrics.totalOpdInflow.toLocaleString('en-PK', { maximumFractionDigits: 0 })}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>• Pharmacy & Clinical ({metrics.posInvoicesCount} sales):</span>
                      <span className="font-mono font-semibold">Rs. {(metrics.pharmacyPosSalesSum + metrics.clinicalCompoundingSum).toLocaleString('en-PK', { maximumFractionDigits: 0 })}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between py-1 border-b border-slate-100 pt-2">
                    <span className="text-slate-600 font-semibold flex items-center">
                      <ArrowDownRight className="w-3.5 h-3.5 text-rose-600 mr-1" />
                      Total Outflow (Payments):
                    </span>
                    <strong className="font-mono font-black text-rose-700">
                      Rs. {metrics.totalGrossOutflow.toLocaleString('en-PK', { maximumFractionDigits: 0 })}
                    </strong>
                  </div>

                  <div className="pl-4 text-[10.5px] text-slate-500 space-y-0.5 font-medium">
                    <div className="flex justify-between">
                      <span>• Expenses & Salaries ({metrics.expensesCount + metrics.payrollCount}):</span>
                      <span className="font-mono font-semibold">Rs. {(metrics.operationalExpensesSum + metrics.payrollsSum).toLocaleString('en-PK', { maximumFractionDigits: 0 })}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>• Supplier/Vendor Paid ({metrics.vendorPaymentsCount}):</span>
                      <span className="font-mono font-semibold">Rs. {metrics.vendorPaymentsSum.toLocaleString('en-PK', { maximumFractionDigits: 0 })}</span>
                    </div>
                  </div>
                </div>

                {/* Net Balance Pill */}
                <div className={`p-2.5 rounded-xl border flex items-center justify-between ${
                  isSurplus ? 'bg-indigo-50/60 border-indigo-200 text-indigo-950' : 'bg-rose-50 border-rose-200 text-rose-950'
                }`}>
                  <span className="font-extrabold text-[11px]">Net Surplus:</span>
                  <span className={`font-mono font-black text-sm ${isSurplus ? 'text-indigo-900' : 'text-rose-700'}`}>
                    Rs. {metrics.netOperatingSurplus.toLocaleString('en-PK', { maximumFractionDigits: 0 })}
                  </span>
                </div>

                {/* GRN Purchase indicator */}
                {metrics.grnTotalAmount > 0 && (
                  <div className="text-[10px] text-amber-800 bg-amber-50/60 border border-amber-200/80 px-2.5 py-1 rounded-lg flex justify-between items-center font-semibold">
                    <span>📦 GRN Stock Inward ({metrics.grnCount}):</span>
                    <span className="font-mono font-bold">Rs. {metrics.grnTotalAmount.toLocaleString('en-PK', { maximumFractionDigits: 0 })}</span>
                  </div>
                )}

                {/* Closed details if locked */}
                {isClosed && savedStatus?.ClosedAt && (
                  <div className="text-[9.5px] text-slate-500 italic bg-slate-50 p-2 rounded-lg border border-slate-200/70 space-y-0.5">
                    <div className="font-semibold text-slate-700">Locked by: {savedStatus.ClosedBy}</div>
                    <div className="text-slate-400 font-mono">{savedStatus.ClosedAt}</div>
                  </div>
                )}
              </div>

              {/* Card Footer Actions */}
              <div className="p-3 bg-slate-50 border-t border-slate-150 flex items-center justify-between gap-1.5">
                <button
                  type="button"
                  onClick={() => handleOpenAuditModal(m)}
                  className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-800 font-bold text-xs rounded-xl border border-slate-200 shadow-2xs flex items-center space-x-1 cursor-pointer transition"
                  title="View 360° detailed monthly financial breakdown"
                >
                  <Eye className="w-3.5 h-3.5 text-indigo-600" />
                  <span>360° Audit</span>
                </button>

                <div className="flex items-center space-x-1">
                  <button
                    type="button"
                    onClick={() => handlePrintMonthlyStatement(m)}
                    className="p-1.5 bg-white hover:bg-slate-100 text-slate-700 rounded-lg border border-slate-200 shadow-2xs transition cursor-pointer"
                    title="Print Monthly Financial Statement (A4)"
                  >
                    <Printer className="w-3.5 h-3.5 text-slate-600" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleToggleMonthStatus(m)}
                    className={`px-3 py-1.5 rounded-xl font-black text-xs transition cursor-pointer flex items-center space-x-1 shadow-2xs ${
                      isClosed
                        ? 'bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300'
                        : 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/10'
                    }`}
                  >
                    {isClosed ? (
                      <>
                        <Unlock className="w-3.5 h-3.5" />
                        <span>Re-open</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-3.5 h-3.5" />
                        <span>Close</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 360° DETAILED MONTHLY AUDIT INSPECTION MODAL */}
      {selectedAuditMonth && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 animate-fadeIn font-sans">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50 shrink-0">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-sm">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-base font-black text-slate-950">
                      {selectedAuditMonth.monthName} {selectedAuditMonth.year} — 360° Financial Audit
                    </h3>
                    {selectedAuditMonth.isClosed ? (
                      <span className="px-2 py-0.5 bg-rose-100 text-rose-800 border border-rose-200 rounded font-mono text-[10px] font-black uppercase">
                        🔒 Closed & Locked
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-200 rounded font-mono text-[10px] font-black uppercase">
                        🟢 Active (Open)
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 font-medium font-mono">
                    Duration: {selectedAuditMonth.startDate} to {selectedAuditMonth.endDate}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    const matchedM = monthsData.find(m => m.periodId === selectedAuditMonth.periodId);
                    if (matchedM) handlePrintMonthlyStatement(matchedM);
                  }}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition cursor-pointer flex items-center space-x-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Statement</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedAuditMonth(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto flex-1 space-y-5 text-xs">
              {(() => {
                const matchedM = monthsData.find(m => m.periodId === selectedAuditMonth.periodId);
                if (!matchedM) return null;
                const { metrics } = matchedM;

                return (
                  <>
                    {/* Top KPI Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="bg-emerald-50/80 border border-emerald-200 p-4 rounded-xl space-y-1">
                        <span className="text-[10px] font-extrabold uppercase text-emerald-800 tracking-wider block">
                          Total Realized Inflows
                        </span>
                        <div className="text-xl font-black text-emerald-700 font-mono">
                          Rs. {metrics.totalGrossInflow.toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                        </div>
                        <div className="text-[10.5px] text-emerald-900/80 font-semibold">
                          OPD: Rs. {metrics.totalOpdInflow.toLocaleString()} • POS: Rs. {(metrics.pharmacyPosSalesSum + metrics.clinicalCompoundingSum).toLocaleString()}
                        </div>
                      </div>

                      <div className="bg-rose-50/80 border border-rose-200 p-4 rounded-xl space-y-1">
                        <span className="text-[10px] font-extrabold uppercase text-rose-800 tracking-wider block">
                          Total Realized Outflows
                        </span>
                        <div className="text-xl font-black text-rose-700 font-mono">
                          Rs. {metrics.totalGrossOutflow.toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                        </div>
                        <div className="text-[10.5px] text-rose-900/80 font-semibold">
                          Expenses: Rs. {(metrics.operationalExpensesSum + metrics.payrollsSum).toLocaleString()} • Vendors: Rs. {metrics.vendorPaymentsSum.toLocaleString()}
                        </div>
                      </div>

                      <div className="bg-indigo-50/80 border border-indigo-200 p-4 rounded-xl space-y-1">
                        <span className="text-[10px] font-extrabold uppercase text-indigo-800 tracking-wider block">
                          Net Realized Margin / Surplus
                        </span>
                        <div className={`text-xl font-black font-mono ${metrics.netOperatingSurplus >= 0 ? 'text-indigo-950' : 'text-rose-700'}`}>
                          Rs. {metrics.netOperatingSurplus.toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                        </div>
                        <div className="text-[10.5px] text-indigo-800 font-semibold">
                          Operating Cash Position at Month End
                        </div>
                      </div>
                    </div>

                    {/* Detailed Revenue & Cost Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Left: Inflows Breakdown */}
                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2.5">
                        <h4 className="text-xs font-black text-slate-900 flex items-center text-emerald-800 uppercase tracking-wider">
                          <ArrowUpRight className="w-4 h-4 mr-1 text-emerald-600" />
                          Detailed Inflows Breakdown
                        </h4>
                        <div className="space-y-1.5 text-xs">
                          <div className="flex justify-between p-2 bg-white rounded-lg border border-slate-150">
                            <span className="text-slate-600 font-semibold">Doctor OPD Consultations:</span>
                            <strong className="font-mono text-slate-900">Rs. {metrics.doctorConsultationSum.toLocaleString()}</strong>
                          </div>
                          <div className="flex justify-between p-2 bg-white rounded-lg border border-slate-150">
                            <span className="text-slate-600 font-semibold">OPD Token / Card Charges:</span>
                            <strong className="font-mono text-slate-900">Rs. {(metrics.opdTokensSum + metrics.clinicCardFeesSum).toLocaleString()}</strong>
                          </div>
                          <div className="flex justify-between p-2 bg-white rounded-lg border border-slate-150">
                            <span className="text-slate-600 font-semibold">Pharmacy Retail / Patent Sales:</span>
                            <strong className="font-mono text-slate-900">Rs. {metrics.pharmacyPosSalesSum.toLocaleString()}</strong>
                          </div>
                          <div className="flex justify-between p-2 bg-white rounded-lg border border-slate-150">
                            <span className="text-slate-600 font-semibold">Clinical Compounding Sales:</span>
                            <strong className="font-mono text-slate-900">Rs. {metrics.clinicalCompoundingSum.toLocaleString()}</strong>
                          </div>
                        </div>
                      </div>

                      {/* Right: Outflows Breakdown */}
                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2.5">
                        <h4 className="text-xs font-black text-slate-900 flex items-center text-rose-800 uppercase tracking-wider">
                          <ArrowDownRight className="w-4 h-4 mr-1 text-rose-600" />
                          Detailed Outflows Breakdown
                        </h4>
                        <div className="space-y-1.5 text-xs">
                          <div className="flex justify-between p-2 bg-white rounded-lg border border-slate-150">
                            <span className="text-slate-600 font-semibold">Clinic Operational Expenses:</span>
                            <strong className="font-mono text-slate-900">Rs. {metrics.operationalExpensesSum.toLocaleString()}</strong>
                          </div>
                          <div className="flex justify-between p-2 bg-white rounded-lg border border-slate-150">
                            <span className="text-slate-600 font-semibold">Vendor & Supplier Settlements:</span>
                            <strong className="font-mono text-slate-900">Rs. {metrics.vendorPaymentsSum.toLocaleString()}</strong>
                          </div>
                          <div className="flex justify-between p-2 bg-white rounded-lg border border-slate-150">
                            <span className="text-slate-600 font-semibold">Staff Salaries & Payrolls:</span>
                            <strong className="font-mono text-slate-900">Rs. {metrics.payrollsSum.toLocaleString()}</strong>
                          </div>
                          <div className="flex justify-between p-2 bg-amber-50/50 rounded-lg border border-amber-200 text-amber-950">
                            <span className="font-semibold">📦 Total GRN Purchases (Inward):</span>
                            <strong className="font-mono">Rs. {metrics.grnTotalAmount.toLocaleString()}</strong>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Filterable Itemized Transactions Ledger */}
                    <div className="space-y-3 pt-2">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                        <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                          Itemized Audit Ledger for {selectedAuditMonth.monthName} ({filteredAuditTransactions.length} records)
                        </h4>

                        <div className="flex flex-wrap items-center gap-2">
                          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-[11px] font-bold">
                            {(['ALL', 'INFLOW', 'OUTFLOW', 'VENDOR', 'EXPENSE'] as const).map(type => (
                              <button
                                key={type}
                                type="button"
                                onClick={() => setAuditTypeFilter(type)}
                                className={`px-2 py-1 rounded-md transition cursor-pointer ${
                                  auditTypeFilter === type ? 'bg-indigo-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                                }`}
                              >
                                {type}
                              </button>
                            ))}
                          </div>

                          <div className="relative">
                            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-400" />
                            <input
                              type="text"
                              placeholder="Search transaction..."
                              value={auditSearchTerm}
                              onChange={(e) => setAuditSearchTerm(e.target.value)}
                              className="pl-7 pr-2 py-1 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 w-36 sm:w-48 bg-white font-medium"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="border border-slate-200 rounded-xl overflow-hidden max-h-64 overflow-y-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-100 text-slate-600 font-extrabold uppercase text-[10px] sticky top-0">
                            <tr>
                              <th className="p-2.5">Date</th>
                              <th className="p-2.5">Particulars / Description</th>
                              <th className="p-2.5">Category</th>
                              <th className="p-2.5 text-center">Ref</th>
                              <th className="p-2.5 text-right">Amount (Rs.)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {filteredAuditTransactions.length === 0 ? (
                              <tr>
                                <td colSpan={5} className="p-6 text-center text-slate-400 font-semibold italic">
                                  No transaction records found for the selected filter in this month.
                                </td>
                              </tr>
                            ) : (
                              filteredAuditTransactions.map((row, idx) => (
                                <tr key={`${row.id}-${idx}`} className="hover:bg-slate-50/80">
                                  <td className="p-2.5 font-mono text-[11px] font-bold text-slate-600">{row.date}</td>
                                  <td className="p-2.5 font-bold text-slate-900">{row.title}</td>
                                  <td className="p-2.5 text-slate-600">{row.category}</td>
                                  <td className="p-2.5 text-center font-mono text-[10px] text-slate-400 font-bold">{row.ref}</td>
                                  <td className={`p-2.5 text-right font-mono font-black ${
                                    row.type === 'INFLOW' ? 'text-emerald-700' : 'text-rose-700'
                                  }`}>
                                    {row.type === 'INFLOW' ? '+' : '-'} Rs. {row.amount.toLocaleString()}
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Period Status Control & Audit Notes */}
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-black text-slate-900 uppercase tracking-wider">
                          Auditor Remarks & Period Closure Notes:
                        </label>
                        <span className="text-[10px] text-slate-500 font-semibold">
                          Status: <strong className={selectedAuditMonth.isClosed ? 'text-rose-700' : 'text-emerald-700'}>
                            {selectedAuditMonth.isClosed ? 'Locked' : 'Open'}
                          </strong>
                        </span>
                      </div>

                      <textarea
                        rows={2}
                        value={closeNotesInput}
                        onChange={(e) => setCloseNotesInput(e.target.value)}
                        placeholder="Add formal audit remarks, discrepancy checks, or period sign-off notes here..."
                        className="w-full p-2.5 border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:ring-1 focus:ring-indigo-500 bg-white"
                      />

                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[10.5px] text-slate-500 font-medium">
                          Closing this period prevents backdated entries from altering accounting ledgers.
                        </span>

                        <button
                          type="button"
                          onClick={() => {
                            const matchedM = monthsData.find(m => m.periodId === selectedAuditMonth.periodId);
                            if (matchedM) {
                              handleToggleMonthStatus(matchedM, closeNotesInput);
                            }
                          }}
                          className={`px-4 py-2 rounded-xl font-extrabold text-xs transition cursor-pointer flex items-center space-x-1.5 shadow-sm ${
                            selectedAuditMonth.isClosed
                              ? 'bg-amber-600 hover:bg-amber-700 text-white'
                              : 'bg-rose-600 hover:bg-rose-700 text-white'
                          }`}
                        >
                          {selectedAuditMonth.isClosed ? (
                            <>
                              <Unlock className="w-4 h-4" />
                              <span>Re-open Period for Editing</span>
                            </>
                          ) : (
                            <>
                              <Lock className="w-4 h-4" />
                              <span>Finalize & Close Month</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-slate-100 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedAuditMonth(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl transition cursor-pointer"
              >
                Close Audit Inspection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
