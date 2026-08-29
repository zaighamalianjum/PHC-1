import React, { useState, useMemo } from 'react';
import {
  FileText,
  Printer,
  Download,
  Calendar,
  Filter,
  Search,
  DollarSign,
  Users,
  Building2,
  ShoppingCart,
  Boxes,
  AlertTriangle,
  Package,
  PackagePlus,
  TrendingUp,
  TrendingDown,
  PieChart,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Info,
  HeartHandshake,
  BookOpen,
  Receipt,
  Scale,
  Layers,
  CalendarRange,
  ArrowRightLeft,
  CheckCheck,
  FileSpreadsheet,
  Phone
} from 'lucide-react';

import {
  ErpVendor,
  ErpPurchaseOrder,
  ErpGrn,
  ErpTransaction,
  ErpEmployee,
  ErpPayroll,
  ErpExpense,
  ErpAsset,
  User,
  ACLedger,
  TLAccount
} from '../types';
import { INITIAL_TL_ACCOUNTS } from '../data/initialData';

export type ReportType =
  | 'pending_payments'
  | 'payroll_disbursement'
  | 'expense_analysis'
  | 'purchase_orders'
  | 'current_stock'
  | 'minimum_stock'
  | 'required_stock'
  | 'pnl_summary'
  | 'shift_collection_summary'
  | 'foc_cases_summary'
  | 'store_medicine_report'
  | 'ledger_postings';

interface ReportingDeskProps {
  vendors?: ErpVendor[];
  purchaseOrders?: ErpPurchaseOrder[];
  grns?: ErpGrn[];
  grnDetails?: any[];
  suppliers?: any[];
  tokens?: any[];
  transactions?: ErpTransaction[];
  employees?: ErpEmployee[];
  payrolls?: ErpPayroll[];
  expenses?: ErpExpense[];
  assets?: ErpAsset[];
  inventoryItems?: any[];
  appointments?: any[];
  patientVisits?: any[];
  posSales?: any[];
  invoices?: any[];
  invoiceDetails?: any[];
  salesReturns?: any[];
  acLedger?: any[];
  tlAccounts?: any[];
  flAccounts?: any[];
  slAccounts?: any[];
  vouchers?: any[];
  voucherDetails?: any[];
  patients?: any[];
  visits?: any[];
  visitMedicines?: any[];
  items?: any[];
  currentUser?: User | null;
  clinicSettings?: any;
  onUnauthorized?: any;
  [key: string]: any;
}

export default function ReportingDesk({
  vendors = [],
  purchaseOrders = [],
  grns = [],
  grnDetails = [],
  suppliers = [],
  tokens = [],
  transactions = [],
  employees = [],
  payrolls = [],
  expenses = [],
  assets = [],
  inventoryItems = [],
  items = [],
  appointments = [],
  patientVisits = [],
  posSales = [],
  invoices = [],
  invoiceDetails = [],
  salesReturns = [],
  acLedger = [],
  tlAccounts = [],
  flAccounts = [],
  slAccounts = [],
  vouchers = [],
  voucherDetails = [],
  visits = [],
  patients = [],
  currentUser,
  clinicSettings
}: ReportingDeskProps) {
  // Self-fetching fallback for ERP & Inventory items
  const [fetchedItems, setFetchedItems] = useState<any[]>([]);
  const [fetchedVendors, setFetchedVendors] = useState<ErpVendor[]>([]);
  const [fetchedPOs, setFetchedPOs] = useState<ErpPurchaseOrder[]>([]);
  const [fetchedGrns, setFetchedGrns] = useState<ErpGrn[]>([]);
  const [fetchedTxns, setFetchedTxns] = useState<ErpTransaction[]>([]);
  const [fetchedPayrolls, setFetchedPayrolls] = useState<ErpPayroll[]>([]);
  const [fetchedExpenses, setFetchedExpenses] = useState<ErpExpense[]>([]);
  const [fetchedInvoices, setFetchedInvoices] = useState<any[]>([]);
  const [fetchedInvoiceDetails, setFetchedInvoiceDetails] = useState<any[]>([]);
  const [fetchedSalesReturns, setFetchedSalesReturns] = useState<any[]>([]);
  const [fetchedAppointments, setFetchedAppointments] = useState<any[]>([]);
  const [fetchedTokens, setFetchedTokens] = useState<any[]>([]);
  const [fetchedVisits, setFetchedVisits] = useState<any[]>([]);
  const [fetchedVouchers, setFetchedVouchers] = useState<any[]>([]);
  const [fetchedAcLedger, setFetchedAcLedger] = useState<any[]>([]);

  const loadReportData = React.useCallback(async () => {
    try {
      const [itRes, vRes, poRes, grnRes, txRes, payRes, expRes, billingRes, invRes, invDetRes, srRes, appRes, tokRes, visRes, vchRes, acRes] = await Promise.all([
        fetch('/api/query/items').then(r => r.ok ? r.json() : []).catch(() => []),
        fetch('/api/query/erp_vendors').then(r => r.ok ? r.json() : []).catch(() => []),
        fetch('/api/query/erp_purchase_orders').then(r => r.ok ? r.json() : []).catch(() => []),
        fetch('/api/query/erp_grn').then(r => r.ok ? r.json() : []).catch(() => []),
        fetch('/api/query/erp_transactions').then(r => r.ok ? r.json() : []).catch(() => []),
        fetch('/api/query/erp_payroll').then(r => r.ok ? r.json() : []).catch(() => []),
        fetch('/api/query/erp_expenses').then(r => r.ok ? r.json() : []).catch(() => []),
        fetch('/api/billing/invoices').then(r => r.ok ? r.json() : null).catch(() => null),
        fetch('/api/query/invoice_headers').then(r => r.ok ? r.json() : []).catch(() => []),
        fetch('/api/query/invoice_details').then(r => r.ok ? r.json() : []).catch(() => []),
        fetch('/api/query/sales_returns').then(r => r.ok ? r.json() : []).catch(() => []),
        fetch('/api/query/appointments').then(r => r.ok ? r.json() : []).catch(() => []),
        fetch('/api/query/tokens').then(r => r.ok ? r.json() : []).catch(() => []),
        fetch('/api/query/visits').then(r => r.ok ? r.json() : []).catch(() => []),
        fetch('/api/query/vouchers').then(r => r.ok ? r.json() : []).catch(() => []),
        fetch('/api/query/ac_ledger').then(r => r.ok ? r.json() : []).catch(() => [])
      ]);

      // Fallbacks from localStorage for resilient data availability
      let finalItems = Array.isArray(itRes) && itRes.length > 0 ? itRes : [];
      if (finalItems.length === 0) {
        try { finalItems = JSON.parse(localStorage.getItem('cms_items') || '[]'); } catch (_) {}
      }
      if (finalItems.length > 0) setFetchedItems(finalItems);

      let finalVendors = Array.isArray(vRes) && vRes.length > 0 ? vRes : [];
      if (finalVendors.length === 0) {
        try { finalVendors = JSON.parse(localStorage.getItem('cms_erp_vendors') || localStorage.getItem('cms_suppliers') || '[]'); } catch (_) {}
      }
      if (finalVendors.length > 0) setFetchedVendors(finalVendors);

      let finalPOs = Array.isArray(poRes) && poRes.length > 0 ? poRes : [];
      if (finalPOs.length === 0) {
        try { finalPOs = JSON.parse(localStorage.getItem('cms_erp_purchase_orders') || '[]'); } catch (_) {}
      }
      if (finalPOs.length > 0) setFetchedPOs(finalPOs);

      let finalGrns = Array.isArray(grnRes) && grnRes.length > 0 ? grnRes : [];
      if (finalGrns.length === 0) {
        try { finalGrns = JSON.parse(localStorage.getItem('cms_erp_grn') || localStorage.getItem('cms_grns') || '[]'); } catch (_) {}
      }
      if (finalGrns.length > 0) setFetchedGrns(finalGrns);

      let finalTxns = Array.isArray(txRes) && txRes.length > 0 ? txRes : [];
      if (finalTxns.length === 0) {
        try { finalTxns = JSON.parse(localStorage.getItem('phc_erp_transactions') || localStorage.getItem('cms_erp_transactions') || '[]'); } catch (_) {}
      }
      if (finalTxns.length > 0) setFetchedTxns(finalTxns);

      let finalPayrolls = Array.isArray(payRes) && payRes.length > 0 ? payRes : [];
      if (finalPayrolls.length === 0) {
        try { finalPayrolls = JSON.parse(localStorage.getItem('phc_erp_payroll') || localStorage.getItem('cms_erp_payroll') || '[]'); } catch (_) {}
      }
      if (finalPayrolls.length > 0) setFetchedPayrolls(finalPayrolls);

      let finalExpenses = Array.isArray(expRes) && expRes.length > 0 ? expRes : [];
      if (finalExpenses.length === 0) {
        try {
          finalExpenses = JSON.parse(
            localStorage.getItem('phc_erp_expenses') ||
            localStorage.getItem('cms_erp_expenses') ||
            localStorage.getItem('erp_expenses') ||
            localStorage.getItem('cms_expenses') ||
            localStorage.getItem('phc_expenses') ||
            localStorage.getItem('expenses') ||
            '[]'
          );
        } catch (_) {}
      }
      if (finalExpenses.length > 0) setFetchedExpenses(finalExpenses);

      let finalReturns = Array.isArray(srRes) && srRes.length > 0 ? srRes : [];
      if (finalReturns.length === 0) {
        try { finalReturns = JSON.parse(localStorage.getItem('cms_sales_returns') || '[]'); } catch (_) {}
      }
      if (finalReturns.length > 0) setFetchedSalesReturns(finalReturns);

      let finalApps = Array.isArray(appRes) && appRes.length > 0 ? appRes : [];
      if (finalApps.length === 0) {
        try { finalApps = JSON.parse(localStorage.getItem('cms_appointments') || '[]'); } catch (_) {}
      }
      if (finalApps.length > 0) setFetchedAppointments(finalApps);

      let finalTokens = Array.isArray(tokRes) && tokRes.length > 0 ? tokRes : [];
      if (finalTokens.length === 0) {
        try { finalTokens = JSON.parse(localStorage.getItem('cms_tokens') || '[]'); } catch (_) {}
      }
      if (finalTokens.length > 0) setFetchedTokens(finalTokens);

      let finalVisits = Array.isArray(visRes) && visRes.length > 0 ? visRes : [];
      if (finalVisits.length === 0) {
        try { finalVisits = JSON.parse(localStorage.getItem('cms_visits') || '[]'); } catch (_) {}
      }
      if (finalVisits.length > 0) setFetchedVisits(finalVisits);

      let finalVouchers = Array.isArray(vchRes) && vchRes.length > 0 ? vchRes : [];
      if (finalVouchers.length === 0) {
        try { finalVouchers = JSON.parse(localStorage.getItem('cms_vouchers') || '[]'); } catch (_) {}
      }
      if (finalVouchers.length > 0) setFetchedVouchers(finalVouchers);

      let finalAc = Array.isArray(acRes) && acRes.length > 0 ? acRes : [];
      if (finalAc.length === 0) {
        try { finalAc = JSON.parse(localStorage.getItem('cms_ac_ledger') || '[]'); } catch (_) {}
      }
      if (finalAc.length > 0) setFetchedAcLedger(finalAc);

      let allInvs: any[] = [];
      let allDet: any[] = [];
      if (billingRes && Array.isArray(billingRes.headers)) allInvs = billingRes.headers;
      if (billingRes && Array.isArray(billingRes.details)) allDet = billingRes.details;
      if (Array.isArray(invRes) && invRes.length > 0) {
        allInvs = [...allInvs, ...invRes.filter(r => !allInvs.some(h => (h.InvoiceNo || h.id) === (r.InvoiceNo || r.id)))];
      }
      if (Array.isArray(invDetRes) && invDetRes.length > 0) {
        allDet = [...allDet, ...invDetRes];
      }
      if (allInvs.length === 0) {
        try { allInvs = JSON.parse(localStorage.getItem('cms_invoices') || '[]'); } catch (_) {}
      }
      if (allDet.length === 0) {
        try { allDet = JSON.parse(localStorage.getItem('cms_invoice_details') || '[]'); } catch (_) {}
      }
      if (allInvs.length > 0) setFetchedInvoices(allInvs);
      if (allDet.length > 0) setFetchedInvoiceDetails(allDet);
    } catch (err) {
      console.error('ReportingDesk fetch error:', err);
    }
  }, []);

  React.useEffect(() => {
    loadReportData();
    window.addEventListener('phc_db_updated', loadReportData);
    return () => window.removeEventListener('phc_db_updated', loadReportData);
  }, [loadReportData]);

  // Effective datasets combining props and fetched state
  const effectiveAppointments = useMemo(() => {
    if (Array.isArray(appointments) && appointments.length > 0) return appointments;
    if (Array.isArray(fetchedAppointments) && fetchedAppointments.length > 0) return fetchedAppointments;
    return [];
  }, [appointments, fetchedAppointments]);

  const effectiveTokens = useMemo(() => {
    if (Array.isArray(tokens) && tokens.length > 0) return tokens;
    if (Array.isArray(fetchedTokens) && fetchedTokens.length > 0) return fetchedTokens;
    return [];
  }, [tokens, fetchedTokens]);

  const effectiveVisits = useMemo(() => {
    if (Array.isArray(visits) && visits.length > 0) return visits;
    if (Array.isArray(patientVisits) && patientVisits.length > 0) return patientVisits;
    if (Array.isArray(fetchedVisits) && fetchedVisits.length > 0) return fetchedVisits;
    return [];
  }, [visits, patientVisits, fetchedVisits]);

  const effectiveVouchers = useMemo(() => {
    if (Array.isArray(vouchers) && vouchers.length > 0) return vouchers;
    if (Array.isArray(fetchedVouchers) && fetchedVouchers.length > 0) return fetchedVouchers;
    return [];
  }, [vouchers, fetchedVouchers]);

  const effectiveAcLedger = useMemo(() => {
    if (Array.isArray(acLedger) && acLedger.length > 0) return acLedger;
    if (Array.isArray(fetchedAcLedger) && fetchedAcLedger.length > 0) return fetchedAcLedger;
    return [];
  }, [acLedger, fetchedAcLedger]);

  // Effective datasets combining props and fetched state
  const effectiveItems = useMemo(() => {
    if (Array.isArray(inventoryItems) && inventoryItems.length > 0) return inventoryItems;
    if (Array.isArray(items) && items.length > 0) return items;
    if (Array.isArray(fetchedItems) && fetchedItems.length > 0) return fetchedItems;
    return [];
  }, [inventoryItems, items, fetchedItems]);

  const effectiveVendors = useMemo(() => {
    if (Array.isArray(vendors) && vendors.length > 0) return vendors;
    if (Array.isArray(suppliers) && suppliers.length > 0) return suppliers;
    if (Array.isArray(fetchedVendors) && fetchedVendors.length > 0) return fetchedVendors;
    return [];
  }, [vendors, suppliers, fetchedVendors]);

  const effectivePOs = useMemo(() => {
    if (Array.isArray(purchaseOrders) && purchaseOrders.length > 0) return purchaseOrders;
    if (Array.isArray(fetchedPOs) && fetchedPOs.length > 0) return fetchedPOs;
    return [];
  }, [purchaseOrders, fetchedPOs]);

  const effectiveGrns = useMemo(() => {
    if (Array.isArray(grns) && grns.length > 0) return grns;
    if (Array.isArray(fetchedGrns) && fetchedGrns.length > 0) return fetchedGrns;
    return [];
  }, [grns, fetchedGrns]);

  const effectiveTransactions = useMemo(() => {
    if (Array.isArray(transactions) && transactions.length > 0) return transactions;
    if (Array.isArray(fetchedTxns) && fetchedTxns.length > 0) return fetchedTxns;
    try {
      const local = localStorage.getItem('phc_erp_transactions') || localStorage.getItem('cms_erp_transactions') || localStorage.getItem('erp_transactions') || localStorage.getItem('cms_transactions');
      if (local) return JSON.parse(local);
    } catch (_) {}
    return [];
  }, [transactions, fetchedTxns]);

  const effectivePayrolls = useMemo(() => {
    if (Array.isArray(payrolls) && payrolls.length > 0) return payrolls;
    if (Array.isArray(fetchedPayrolls) && fetchedPayrolls.length > 0) return fetchedPayrolls;
    try {
      const local = localStorage.getItem('phc_erp_payroll') || localStorage.getItem('cms_erp_payroll') || localStorage.getItem('erp_payroll') || localStorage.getItem('cms_payroll');
      if (local) return JSON.parse(local);
    } catch (_) {}
    return [];
  }, [payrolls, fetchedPayrolls]);

  const effectiveExpenses = useMemo(() => {
    if (Array.isArray(expenses) && expenses.length > 0) return expenses;
    if (Array.isArray(fetchedExpenses) && fetchedExpenses.length > 0) return fetchedExpenses;
    try {
      const local = localStorage.getItem('phc_erp_expenses') || localStorage.getItem('cms_erp_expenses') || localStorage.getItem('erp_expenses') || localStorage.getItem('cms_expenses') || localStorage.getItem('phc_expenses') || localStorage.getItem('expenses');
      if (local) return JSON.parse(local);
    } catch (_) {}
    return [];
  }, [expenses, fetchedExpenses]);

  const effectiveInvoices = useMemo(() => {
    if (Array.isArray(invoices) && invoices.length > 0) return invoices;
    if (Array.isArray(posSales) && posSales.length > 0) return posSales;
    if (Array.isArray(fetchedInvoices) && fetchedInvoices.length > 0) return fetchedInvoices;
    return [];
  }, [invoices, posSales, fetchedInvoices]);

  const effectiveInvoiceDetails = useMemo(() => {
    if (Array.isArray(invoiceDetails) && invoiceDetails.length > 0) return invoiceDetails;
    if (Array.isArray(fetchedInvoiceDetails) && fetchedInvoiceDetails.length > 0) return fetchedInvoiceDetails;
    return [];
  }, [invoiceDetails, fetchedInvoiceDetails]);

  const effectiveSalesReturns = useMemo(() => {
    if (Array.isArray(salesReturns) && salesReturns.length > 0) return salesReturns;
    if (Array.isArray(fetchedSalesReturns) && fetchedSalesReturns.length > 0) return fetchedSalesReturns;
    return [];
  }, [salesReturns, fetchedSalesReturns]);

  // Helper stock extractors
  const getItemStock = (item: any) => {
    if (!item) return 0;
    if (item.CStock !== undefined && item.CStock !== null) return Number(item.CStock);
    if (item.cStock !== undefined && item.cStock !== null) return Number(item.cStock);
    if (item.Stock !== undefined && item.Stock !== null) return Number(item.Stock);
    if (item.stock !== undefined && item.stock !== null) return Number(item.stock);
    if (item.Qty !== undefined && item.Qty !== null) return Number(item.Qty);
    return 0;
  };

  const getItemMinStock = (item: any) => {
    if (!item) return 1;
    if (item.MinStock !== undefined && item.MinStock !== null) return Number(item.MinStock);
    if (item.minStock !== undefined && item.minStock !== null) return Number(item.minStock);
    return 1;
  };

  const getItemCategory = (item: any): string => {
    if (!item) return 'General';
    const c = item.Category || item.category;
    if (c && typeof c === 'string' && c.trim()) return c.trim();
    if (item.MedicineType === 'C') return 'Clinical Compounding';
    const u = item.Unit || item.unit;
    if (u && typeof u === 'string' && u.trim()) return u.trim();
    return 'Patent Medicine';
  };

  const matchesCategoryFilter = (item: any, selCat: string): boolean => {
    if (!selCat || selCat === 'all') return true;
    const cat = getItemCategory(item).toLowerCase().trim();
    const target = selCat.toLowerCase().trim();
    if (cat === target) return true;
    const unit = String(item.Unit || item.unit || '').toLowerCase().trim();
    if (unit === target) return true;
    if (target === 'clinical compounding' || target === 'clinical' || target === 'c') {
      return item.MedicineType === 'C' || cat.includes('clinical');
    }
    if (target === 'patent medicine' || target === 'patent' || target === 'p') {
      return item.MedicineType !== 'C' && !cat.includes('clinical');
    }
    return false;
  };

  // Active Report Type Selection
  const [activeReport, setActiveReport] = useState<ReportType>('pending_payments');

  // Dynamic Date, Fiscal Year & Month Calculation
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonthIdx = now.getMonth(); // 0 = Jan, 7 = Aug
  const currentMonthNum = (currentMonthIdx + 1).toString().padStart(2, '0');
  const currentYearMonth = `${currentYear}-${currentMonthNum}`; // e.g. "2026-08"

  const defaultFyKey = `CY ${currentYear}`;
  const firstDayOfCurrentMonth = `${currentYear}-${currentMonthNum}-01`;
  const lastDayOfCurrentMonth = new Date(currentYear, currentMonthIdx + 1, 0).toISOString().split('T')[0];
  const todayStr = now.toISOString().split('T')[0];

  // Date Range & Fiscal Period Filters - Default to Current Year & Current Month
  const [datePreset, setDatePreset] = useState<'today' | 'this_week' | 'this_month' | 'last_30_days' | 'this_quarter' | 'this_fiscal_year' | 'last_fiscal_year' | 'this_year' | 'custom' | 'all'>('this_month');
  
  const [startDate, setStartDate] = useState<string>(firstDayOfCurrentMonth);
  const [endDate, setEndDate] = useState<string>(lastDayOfCurrentMonth);

  // Dedicated Fiscal Period State - Default to Current Year & Current Month
  const [selectedFiscalYear, setSelectedFiscalYear] = useState<string>(defaultFyKey);
  const [selectedFiscalMonth, setSelectedFiscalMonth] = useState<string>(currentYearMonth);

  // Available Fiscal Years
  const fiscalYearOptions = useMemo(() => {
    return [
      { key: `CY ${currentYear}`, label: `CY ${currentYear} (Jan - Dec ${currentYear}) [Current Year]` },
      { key: `FY ${currentYear}-${currentYear + 1}`, label: `FY ${currentYear}-${currentYear + 1} (Jul ${currentYear} - Jun ${currentYear + 1})` },
      { key: `FY ${currentYear - 1}-${currentYear}`, label: `FY ${currentYear - 1}-${currentYear} (Jul ${currentYear - 1} - Jun ${currentYear})` },
      { key: `CY ${currentYear - 1}`, label: `CY ${currentYear - 1} (Jan - Dec ${currentYear - 1})` },
      { key: `FY ${currentYear - 2}-${currentYear - 1}`, label: `FY ${currentYear - 2}-${currentYear - 1} (Jul ${currentYear - 2} - Jun ${currentYear - 1})` },
      { key: 'all', label: 'All Fiscal Years / All Time' },
      { key: 'custom', label: 'Custom Range...' }
    ];
  }, [currentYear]);

  // Available Months for the selected Fiscal Year / Calendar Year
  const monthOptions = useMemo(() => {
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    if (selectedFiscalYear.startsWith('FY ')) {
      // Fiscal Year (July Y1 to June Y2)
      const parts = selectedFiscalYear.replace('FY ', '').split('-');
      const y1 = Number(parts[0]) || currentYear;
      const y2 = Number(parts[1]) || (y1 + 1);

      const fyMonths: { value: string; label: string; isCurrent: boolean }[] = [];
      // Jul - Dec of Y1
      for (let m = 7; m <= 12; m++) {
        const mStr = m.toString().padStart(2, '0');
        const ym = `${y1}-${mStr}`;
        const isCurrent = ym === currentYearMonth;
        fyMonths.push({
          value: ym,
          label: `${monthNames[m - 1]}-${y1} (M${m - 6})${isCurrent ? ' (Current)' : ''}`,
          isCurrent
        });
      }
      // Jan - Jun of Y2
      for (let m = 1; m <= 6; m++) {
        const mStr = m.toString().padStart(2, '0');
        const ym = `${y2}-${mStr}`;
        const isCurrent = ym === currentYearMonth;
        fyMonths.push({
          value: ym,
          label: `${monthNames[m - 1]}-${y2} (M${m + 6})${isCurrent ? ' (Current)' : ''}`,
          isCurrent
        });
      }
      return fyMonths;
    }

    // Default Calendar Year (e.g. CY 2026 or fallback)
    let yr = currentYear;
    if (selectedFiscalYear.startsWith('CY ')) {
      yr = Number(selectedFiscalYear.replace('CY ', '')) || currentYear;
    }

    return monthNames.map((name, idx) => {
      const mNum = (idx + 1).toString().padStart(2, '0');
      const ym = `${yr}-${mNum}`;
      const isCurrent = ym === currentYearMonth;
      return {
        value: ym,
        label: `${name}-${yr}${isCurrent ? ' (Current)' : ''}`,
        isCurrent
      };
    });
  }, [selectedFiscalYear, currentYear, currentYearMonth]);

  // General Ledger Specific Filters
  const [ledgerAccountFilter, setLedgerAccountFilter] = useState<string>('all');
  const [ledgerVchTypeFilter, setLedgerVchTypeFilter] = useState<string>('all');
  const [ledgerDrCrFilter, setLedgerDrCrFilter] = useState<'all' | 'dr' | 'cr'>('all');

  // Search & Category Filter
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [storeMedicineTypeFilter, setStoreMedicineTypeFilter] = useState<'all' | 'P' | 'C'>('all');
  const [storeSortField, setStoreSortField] = useState<'itemId' | 'itemName' | 'category' | 'company' | 'qtySold' | 'unitPurchasePrice' | 'unitSalePrice' | 'totalCogs' | 'totalGrossSales' | 'totalDiscount' | 'totalNetSales' | 'grossProfit' | 'marginPct'>('totalNetSales');
  const [storeSortOrder, setStoreSortOrder] = useState<'asc' | 'desc'>('desc');

  const parseCleanDate = (raw: any): string => {
    if (!raw) return '';
    const str = String(raw).trim();
    if (str.includes('T')) return str.split('T')[0];
    if (str.includes(' ')) return str.split(' ')[0];
    if (str.includes('/')) {
      const parts = str.split('/');
      if (parts.length === 3) {
        if (parts[0].length === 4) return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
        if (parts[2].length === 4) return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
      }
    }
    return str;
  };

  // Helper check date range
  const isWithinDateRange = (dateStr?: string) => {
    if (!dateStr) return true;
    if (datePreset === 'all') return true;
    const cleanDate = parseCleanDate(dateStr).slice(0, 10);
    if (!cleanDate) return true;
    return cleanDate >= startDate && cleanDate <= endDate;
  };

  // Handle Preset Changes (Including Fiscal Years)
  const handlePresetChange = (preset: typeof datePreset) => {
    setDatePreset(preset);
    setSelectedFiscalMonth('all');
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-indexed (6 = July)

    if (preset === 'today') {
      setStartDate(todayStr);
      setEndDate(todayStr);
      setSelectedFiscalYear('custom');
    } else if (preset === 'this_week') {
      const day = now.getDay();
      const diffToMon = now.getDate() - day + (day === 0 ? -6 : 1);
      const mon = new Date(now.setDate(diffToMon));
      setStartDate(mon.toISOString().split('T')[0]);
      setEndDate(todayStr);
      setSelectedFiscalYear('custom');
    } else if (preset === 'this_month') {
      setStartDate(new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]);
      setEndDate(todayStr);
      setSelectedFiscalYear('custom');
    } else if (preset === 'last_30_days') {
      const past30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      setStartDate(past30.toISOString().split('T')[0]);
      setEndDate(todayStr);
      setSelectedFiscalYear('custom');
    } else if (preset === 'this_quarter') {
      const qMonth = Math.floor(now.getMonth() / 3) * 3;
      setStartDate(new Date(now.getFullYear(), qMonth, 1).toISOString().split('T')[0]);
      setEndDate(todayStr);
      setSelectedFiscalYear('custom');
    } else if (preset === 'this_fiscal_year') {
      // Standard Fiscal Year: 1st July to 30th June
      const fyStartYear = currentMonth >= 6 ? currentYear : currentYear - 1;
      const fyEndYear = fyStartYear + 1;
      setStartDate(`${fyStartYear}-07-01`);
      setEndDate(`${fyEndYear}-06-30`);
      setSelectedFiscalYear(`FY ${fyStartYear}-${fyEndYear}`);
    } else if (preset === 'last_fiscal_year') {
      const currentFyStart = currentMonth >= 6 ? currentYear : currentYear - 1;
      const lastFyStart = currentFyStart - 1;
      const lastFyEnd = currentFyStart;
      setStartDate(`${lastFyStart}-07-01`);
      setEndDate(`${lastFyEnd}-06-30`);
      setSelectedFiscalYear(`FY ${lastFyStart}-${lastFyEnd}`);
    } else if (preset === 'this_year') {
      setStartDate(new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0]);
      setEndDate(`${currentYear}-12-31`);
      setSelectedFiscalYear(`CY ${currentYear}`);
    } else if (preset === 'all') {
      setStartDate('2020-01-01');
      setEndDate('2030-12-31');
      setSelectedFiscalYear('all');
    }
  };

  // Fiscal Year Dropdown Quick Handler
  const handleFiscalYearSelect = (fyKey: string) => {
    setSelectedFiscalYear(fyKey);
    setSelectedFiscalMonth('all');
    if (fyKey === 'all') {
      setDatePreset('all');
      setStartDate('2020-01-01');
      setEndDate('2030-12-31');
    } else if (fyKey.startsWith('FY ')) {
      const years = fyKey.replace('FY ', '').split('-');
      if (years.length === 2) {
        setDatePreset('custom');
        setStartDate(`${years[0]}-07-01`);
        setEndDate(`${years[1]}-06-30`);
      }
    } else if (fyKey.startsWith('CY ')) {
      const year = fyKey.replace('CY ', '');
      setDatePreset('custom');
      setStartDate(`${year}-01-01`);
      setEndDate(`${year}-12-31`);
    }
  };

  // Fiscal Month Quick Jump Handler
  const handleFiscalMonthSelect = (monthYearStr: string) => {
    setSelectedFiscalMonth(monthYearStr);
    if (monthYearStr === 'all') {
      // Re-apply fiscal year or preset
      if (selectedFiscalYear.startsWith('FY ')) {
        handleFiscalYearSelect(selectedFiscalYear);
      } else {
        handlePresetChange(datePreset);
      }
      return;
    }
    const [yr, mo] = monthYearStr.split('-').map(Number);
    if (yr && mo) {
      const start = new Date(yr, mo - 1, 1);
      const end = new Date(yr, mo, 0); // last day of month
      setDatePreset('custom');
      setStartDate(start.toISOString().split('T')[0]);
      setEndDate(end.toISOString().split('T')[0]);
    }
  };

  // Report 1: Pending Vendor Payments
  const pendingPaymentsData = useMemo(() => {
    return effectiveVendors
      .map(v => {
        // Calculate GRNs for this vendor
        const vGrns = effectiveGrns.filter(g => g.VendorID === v.VendorID || g.VendorName === v.VendorName);
        const totalGrnBills = vGrns.reduce((sum, g) => sum + (Number(g.TotalAmount) || 0), 0);

        // Payments made to vendor
        const vPayments = effectiveTransactions.filter(
          t => (t.VendorID === v.VendorID || t.VendorName === v.VendorName) && t.Type === 'VendorPayment'
        );
        const totalPaid = vPayments.reduce((sum, t) => sum + (Number(t.Amount) || 0), 0);

        const currentBalance = v.Balance !== undefined ? Number(v.Balance) : Math.max(0, totalGrnBills - totalPaid);

        return {
          ...v,
          totalGrnBills,
          totalPaid,
          pendingBalance: currentBalance,
          lastGrnDate: vGrns.length > 0 ? vGrns[0].ReceivedDate : 'N/A'
        };
      })
      .filter(v => {
        const matchesSearch = v.VendorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          v.ContactPerson.toLowerCase().includes(searchQuery.toLowerCase()) ||
          v.Phone.includes(searchQuery);
        return matchesSearch;
      });
  }, [effectiveVendors, effectiveGrns, effectiveTransactions, searchQuery]);

  const pendingPaymentsSummary = useMemo(() => {
    const totalOwed = pendingPaymentsData.reduce((sum, v) => sum + (v.pendingBalance > 0 ? v.pendingBalance : 0), 0);
    const vendorsWithDues = pendingPaymentsData.filter(v => v.pendingBalance > 0).length;
    return { totalOwed, vendorsWithDues, totalVendors: pendingPaymentsData.length };
  }, [pendingPaymentsData]);

  // Report 2: Salary Disbursement
  const payrollData = useMemo(() => {
    return effectivePayrolls
      .filter(p => {
        const pDate = p.PaymentDate || `${p.MonthYear}-01`;
        return isWithinDateRange(pDate);
      })
      .filter(p => {
        const matchesSearch = p.EmployeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.MonthYear.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.PayrollID.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesSearch;
      });
  }, [effectivePayrolls, startDate, endDate, datePreset, searchQuery]);

  const payrollSummary = useMemo(() => {
    const totalDisbursed = payrollData.reduce((sum, p) => sum + (Number(p.NetSalary) || 0), 0);
    const totalBasic = payrollData.reduce((sum, p) => sum + (Number(p.BasicSalary) || 0), 0);
    const totalAllowances = payrollData.reduce((sum, p) => sum + (Number(p.Allowances) || 0), 0);
    const totalDeductions = payrollData.reduce((sum, p) => sum + (Number(p.Deductions) || 0), 0);
    return { totalDisbursed, totalBasic, totalAllowances, totalDeductions, recordCount: payrollData.length };
  }, [payrollData]);

  // Report 3: Expense Analysis
  const expenseData = useMemo(() => {
    return effectiveExpenses
      .filter(e => isWithinDateRange(e.ExpenseDate))
      .filter(e => {
        const matchesSearch = e.Description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          e.Category.toLowerCase().includes(searchQuery.toLowerCase()) ||
          e.ExpenseID.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCat = selectedCategory === 'all' || e.Category === selectedCategory;
        return matchesSearch && matchesCat;
      });
  }, [effectiveExpenses, startDate, endDate, datePreset, searchQuery, selectedCategory]);

  const expenseSummary = useMemo(() => {
    const totalExpense = expenseData.reduce((sum, e) => sum + (Number(e.Amount) || 0), 0);
    const byCategory: Record<string, number> = {};
    expenseData.forEach(e => {
      byCategory[e.Category] = (byCategory[e.Category] || 0) + (Number(e.Amount) || 0);
    });
    return { totalExpense, byCategory, count: expenseData.length };
  }, [expenseData]);

  // Report 4: Purchase Orders & GRN Details
  const poData = useMemo(() => {
    return effectivePOs
      .filter(p => isWithinDateRange(p.OrderDate))
      .filter(p => {
        const matchesSearch = p.POID.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.VendorName.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesSearch;
      })
      .map(p => {
        const linkedGrn = effectiveGrns.find(g => g.POID === p.POID);
        return {
          ...p,
          linkedGrn
        };
      });
  }, [effectivePOs, effectiveGrns, startDate, endDate, datePreset, searchQuery]);

  const poSummary = useMemo(() => {
    const totalPoAmount = poData.reduce((sum, p) => sum + (Number(p.TotalAmount) || 0), 0);
    const receivedCount = poData.filter(p => p.linkedGrn || p.Status === 'Received').length;
    const pendingCount = poData.length - receivedCount;
    return { totalPoAmount, receivedCount, pendingCount, totalPos: poData.length };
  }, [poData]);

  // Report 5: Current Stock & Inventory Valuation
  const currentStockData = useMemo(() => {
    return effectiveItems.filter(item => {
      const name = item.ItemName || item.name || '';
      const cat = getItemCategory(item);
      const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cat.toLowerCase().includes(searchQuery.toLowerCase()) ||
        String(item.ItemID || item._id || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCat = matchesCategoryFilter(item, selectedCategory);
      return matchesSearch && matchesCat;
    });
  }, [effectiveItems, searchQuery, selectedCategory]);

  const currentStockSummary = useMemo(() => {
    let totalItems = currentStockData.length;
    let totalStockUnits = 0;
    let totalPurchasePriceSum = 0;
    let totalRetailPriceSum = 0;
    let totalPurchaseValuation = 0;
    let totalRetailValuation = 0;

    currentStockData.forEach(i => {
      const cStock = getItemStock(i);
      const pPrice = Number(i.PurchasePrice ?? i.purchasePrice ?? i.Price ?? i.price ?? 0);
      const rPrice = Number(i.Price ?? i.price ?? 0);

      totalStockUnits += cStock;
      totalPurchasePriceSum += pPrice;
      totalRetailPriceSum += rPrice;
      totalPurchaseValuation += cStock * pPrice;
      totalRetailValuation += cStock * rPrice;
    });

    return { totalItems, totalStockUnits, totalPurchasePriceSum, totalRetailPriceSum, totalPurchaseValuation, totalRetailValuation };
  }, [currentStockData]);

  // Report 6: Minimum Stock / Low Stock Alert
  const minimumStockData = useMemo(() => {
    return effectiveItems
      .filter(item => {
        const cStock = getItemStock(item);
        const minStock = getItemMinStock(item);
        return cStock <= minStock;
      })
      .filter(item => {
        const name = item.ItemName || item.name || '';
        const cat = getItemCategory(item);
        const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          cat.toLowerCase().includes(searchQuery.toLowerCase()) ||
          String(item.ItemID || item._id || '').toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCat = matchesCategoryFilter(item, selectedCategory);
        return matchesSearch && matchesCat;
      });
  }, [effectiveItems, searchQuery, selectedCategory]);

  const minimumStockSummary = useMemo(() => {
    const totalOut = minimumStockData.filter(i => getItemStock(i) === 0).length;
    const totalLow = minimumStockData.length - totalOut;
    return { totalLowStock: minimumStockData.length, totalOut, totalLow };
  }, [minimumStockData]);

  // Report 7: Required Stock Quantity Requisition
  const requiredStockData = useMemo(() => {
    return effectiveItems
      .map(item => {
        const cStock = getItemStock(item);
        const minStock = getItemMinStock(item);
        const reorderTarget = Number(item.ReorderQty) || (minStock * 2);
        const requiredQty = Math.max(0, reorderTarget - cStock);
        const unitCost = Number(item.PurchasePrice ?? item.purchasePrice ?? item.Price ?? item.price ?? 0);
        const estCost = requiredQty * unitCost;

        return {
          ...item,
          cStock,
          minStock,
          reorderTarget,
          requiredQty,
          unitCost,
          estCost
        };
      })
      .filter(item => item.requiredQty > 0)
      .filter(item => {
        const name = item.ItemName || item.name || '';
        const cat = getItemCategory(item);
        const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          cat.toLowerCase().includes(searchQuery.toLowerCase()) ||
          String(item.ItemID || item._id || '').toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCat = matchesCategoryFilter(item, selectedCategory);
        return matchesSearch && matchesCat;
      });
  }, [effectiveItems, searchQuery, selectedCategory]);

  const requiredStockSummary = useMemo(() => {
    const totalItemsToOrder = requiredStockData.length;
    const totalUnitsRequired = requiredStockData.reduce((sum, i) => sum + i.requiredQty, 0);
    const totalEstCapitalNeeded = requiredStockData.reduce((sum, i) => sum + i.estCost, 0);
    return { totalItemsToOrder, totalUnitsRequired, totalEstCapitalNeeded };
  }, [requiredStockData]);

  // Report 8: P&L Summary Statement (Exact Dashboard-aligned financial engine)
  const pnlSummaryData = useMemo(() => {
    // 1. FILTER TARGET DATASETS BY DATE RANGE
    const targetApps = effectiveAppointments.filter((a: any) => {
      const d = parseCleanDate(a.AppointmentDate || a.Date || a.CreatedAt);
      return isWithinDateRange(d);
    });

    const targetTokens = effectiveTokens.filter((t: any) => {
      const d = parseCleanDate(t.Date || t.CreatedAt);
      return isWithinDateRange(d);
    });

    const targetVisits = effectiveVisits.filter((v: any) => {
      const d = parseCleanDate(v.VisitDate || v.Date || v.CreatedAt);
      return isWithinDateRange(d);
    });

    const targetInvoices = effectiveInvoices.filter((inv: any) => {
      const d = parseCleanDate(inv.InvoiceDate || inv.date || inv.Date || inv.CreatedAt);
      return isWithinDateRange(d);
    });

    const targetSalesReturns = effectiveSalesReturns.filter((r: any) => {
      const d = parseCleanDate(r.ReturnDate || r.Date || r.CreatedAt);
      return isWithinDateRange(d);
    });

    // Helper to determine shift for visit if not directly set (matches Dashboard getVisitShift)
    const getVisitShift = (v: any): 1 | 2 => {
      if (v.Shift === 1 || v.Shift === 2) return v.Shift;
      if (v.shift === 1 || v.shift === 2) return v.shift;
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

    const getClinMedPayment = (v: any) =>
      Number(v.ClinicalMedicinePayment || v.ClinicalMedicineCharges || v.ClinicalMedicinePkr || v.clinicMedicineCharges || v.medicineCharges || v.MedicineCost || v.ClinicalPayment || 0);

    const getCardFileFee = (v: any) =>
      (Number(v.CardFee || v.cardFee || v.CardsPayment || 0) + (Number(v.FileFee || v.fileFee || v.FilePkr || v.RegFee || 0)));

    // Clinical Medicine Payments Shift-wise
    const morningClinMed = targetVisits.filter((v) => getVisitShift(v) === 1).reduce((sum, v) => sum + getClinMedPayment(v), 0);
    const eveningClinMed = targetVisits.filter((v) => getVisitShift(v) === 2).reduce((sum, v) => sum + getClinMedPayment(v), 0);
    const totalClinMedCollection = morningClinMed + eveningClinMed;

    // Card & Registration Fees Shift-wise
    const morningCardFileFee = targetVisits.filter((v) => getVisitShift(v) === 1).reduce((sum, v) => sum + getCardFileFee(v), 0);
    const eveningCardFileFee = targetVisits.filter((v) => getVisitShift(v) === 2).reduce((sum, v) => sum + getCardFileFee(v), 0);
    const totalCardFileFeeCollection = morningCardFileFee + eveningCardFileFee;

    // OPD Consultation Fees Shift-wise (Appointments + Uncounted Visits)
    const morningOpdApps = targetApps.filter((a) => (a.Shift || 1) === 1 && a.Status !== 3);
    const eveningOpdApps = targetApps.filter((a) => a.Shift === 2 && a.Status !== 3);

    const morningOpdAppFees = morningOpdApps.reduce((acc, curr) => acc + (Number(curr.FeeCharged) || Number(curr.FeeReceived) || Number(curr.Fee) || 0), 0);
    const eveningOpdAppFees = eveningOpdApps.reduce((acc, curr) => acc + (Number(curr.FeeCharged) || Number(curr.FeeReceived) || Number(curr.Fee) || 0), 0);

    const morningOpdVisitFees = targetVisits.filter((v) => getVisitShift(v) === 1 && (v as any).Status !== 3).reduce((acc, v) => {
      const fee = Number(v.ConsultationFee) || (v.FeeReceived !== undefined ? Number(v.FeeReceived) : 0);
      const hasAppFee = morningOpdApps.some(a => a.PatientID === v.PatientID && (Number(a.FeeCharged) || Number(a.FeeReceived) || 0) > 0);
      return acc + (hasAppFee ? 0 : fee);
    }, 0);

    const eveningOpdVisitFees = targetVisits.filter((v) => getVisitShift(v) === 2 && (v as any).Status !== 3).reduce((acc, v) => {
      const fee = Number(v.ConsultationFee) || (v.FeeReceived !== undefined ? Number(v.FeeReceived) : 0);
      const hasAppFee = eveningOpdApps.some(a => a.PatientID === v.PatientID && (Number(a.FeeCharged) || Number(a.FeeReceived) || 0) > 0);
      return acc + (hasAppFee ? 0 : fee);
    }, 0);

    const morningOpdConsultation = morningOpdAppFees + morningOpdVisitFees;
    const eveningOpdConsultation = eveningOpdAppFees + eveningOpdVisitFees;
    const totalOpdConsultation = morningOpdConsultation + eveningOpdConsultation;

    // Standalone token fees if not attached to any appointment/visit
    const standaloneTokenFees = targetTokens.filter(t => (t as any).Status !== 3).reduce((acc, t) => {
      const fee = Number(t.FeeCharged || t.FeeReceived || t.Fee || 0);
      if (!fee) return acc;
      const hasApp = targetApps.some(a => a.PatientID === t.PatientID || a.AppointmentID === t.AppointmentID);
      const hasVisit = targetVisits.some(v => v.PatientID === t.PatientID);
      return acc + (hasApp || hasVisit ? 0 : fee);
    }, 0);

    const morningOpdCollection = morningOpdConsultation + morningClinMed + morningCardFileFee;
    const eveningOpdCollection = eveningOpdConsultation + eveningClinMed + eveningCardFileFee;
    const totalOpdIncome = morningOpdCollection + eveningOpdCollection + standaloneTokenFees;

    // 2. STORE / PHARMACY POS SALES & COGS (Exact Dashboard Calculation)
    const morningInvoices = targetInvoices.filter((i) => ((i.shift === 1 || i.Shift === 1 || !i.shift)) && (i as any).Status !== 3);
    const eveningInvoices = targetInvoices.filter((i) => ((i.shift === 2 || i.Shift === 2)) && (i as any).Status !== 3);

    const morningReturns = targetSalesReturns.filter((r) => (r.shift === 1 || r.Shift === 1 || !r.shift));
    const eveningReturns = targetSalesReturns.filter((r) => (r.shift === 2 || r.Shift === 2));

    const morningStoreGross = morningInvoices.reduce((acc, curr) => {
      const net = Number(curr.NetAmount ?? curr.NetPayable ?? curr.GrandTotal ?? curr.GAmount ?? curr.totalAmount ?? curr.TotalAmount ?? 0);
      return acc + (net || 0);
    }, 0);
    const morningStoreReturns = morningReturns.reduce((acc, curr) => acc + (Number(curr.NetPaid ?? curr.RefundAmount ?? curr.TotalAmount ?? 0) || 0), 0);
    const morningStoreCollection = Math.max(0, morningStoreGross - morningStoreReturns);

    const eveningStoreGross = eveningInvoices.reduce((acc, curr) => {
      const net = Number(curr.NetAmount ?? curr.NetPayable ?? curr.GrandTotal ?? curr.GAmount ?? curr.totalAmount ?? curr.TotalAmount ?? 0);
      return acc + (net || 0);
    }, 0);
    const eveningStoreReturns = eveningReturns.reduce((acc, curr) => acc + (Number(curr.NetPaid ?? curr.RefundAmount ?? curr.TotalAmount ?? 0) || 0), 0);
    const eveningStoreCollection = Math.max(0, eveningStoreGross - eveningStoreReturns);

    const grossPosSales = morningStoreGross + eveningStoreGross;
    const totalSalesReturns = morningStoreReturns + eveningStoreReturns;
    const netPosIncome = morningStoreCollection + eveningStoreCollection;

    // Calculate Pharmacy COGS (Purchase Cost of Goods Sold)
    const itemMap = new Map<string, any>();
    effectiveItems.forEach((it: any) => {
      if (it.ItemID) itemMap.set(String(it.ItemID).toUpperCase(), it);
      if (it.ItemName) itemMap.set(String(it.ItemName).toLowerCase(), it);
    });

    const detailsByInvoice = new Map<string, any[]>();
    effectiveInvoiceDetails.forEach((d: any) => {
      const invNo = String(d.InvoiceNo || d.invoiceNo || '');
      if (invNo) {
        const existing = detailsByInvoice.get(invNo) || [];
        existing.push(d);
        detailsByInvoice.set(invNo, existing);
      }
    });

    let pharmacyCogs = 0;
    targetInvoices.forEach((inv: any) => {
      if ((inv as any).Status === 3) return;
      const invNo = String(inv.InvoiceNo || inv.id || '');
      const details = detailsByInvoice.get(invNo);

      if (details && details.length > 0) {
        details.forEach((d: any) => {
          const itemKey = String(d.ItemID || d.itemId || '').trim();
          const item = itemMap.get(itemKey.toUpperCase()) || itemMap.get(String(d.ItemName || '').toLowerCase());
          const unitPurCost = (item?.PurchasePrice && Number(item.PurchasePrice) > 0)
            ? Number(item.PurchasePrice)
            : (item?.TP && Number(item.TP) > 0 ? Number(item.TP) : (d.Price ? Math.round(d.Price * 0.75) : 0));
          const lineQty = Number(d.Qty || d.qty) || 0;
          pharmacyCogs += lineQty * unitPurCost;
        });
      } else {
        const invNet = Number(inv.NetAmount ?? inv.NetPayable ?? inv.GrandTotal ?? inv.GAmount ?? 0);
        pharmacyCogs += Math.round(invNet * 0.75);
      }
    });

    const returnsCogs = Math.round(totalSalesReturns * 0.75);
    pharmacyCogs = Math.max(0, Math.round(pharmacyCogs - returnsCogs));

    const pharmacyGrossProfit = Math.max(0, netPosIncome - pharmacyCogs);
    const pharmacyMarginPct = netPosIncome > 0 ? (pharmacyGrossProfit / netPosIncome) * 100 : 0;

    // 3. OTHER DIRECT INFLOWS
    const otherIncome = effectiveTransactions
      .filter((t: any) => isWithinDateRange(t.Date || t.TransactionDate) && (t.Type === 'Income' || t.Type === 'Deposit') && !t.VendorID && !t.VendorName && !t.Category?.toLowerCase().includes('vendor') && !t.Category?.toLowerCase().includes('payable') && !t.Category?.toLowerCase().includes('supplier') && !t.Category?.toLowerCase().includes('invoice') && !t.Category?.toLowerCase().includes('pos'))
      .reduce((sum: number, t: any) => sum + (Number(t.Amount) || 0), 0);

    const totalIncome = totalOpdIncome + netPosIncome + otherIncome;

    // 4. OUTFLOWS & EXPENSES (Comprehensive, deduplicated audit across expenses, payroll, vendor payments, vouchers & transactions)
    let totalOperatingExpenses = 0;
    const countedExpenseKeys = new Set<string>();

    // 4A. Primary: Direct Operational & Clinic Expense Records (from erp_expenses / Expense Analysis)
    effectiveExpenses.forEach((exp: any, idx: number) => {
      const d = parseCleanDate(exp.ExpenseDate || exp.Date || exp.CreatedAt);
      if (isWithinDateRange(d)) {
        const amt = Number(exp.Amount || exp.ExpenseAmount || exp.TotalAmount || 0);
        if (amt > 0) {
          totalOperatingExpenses += amt;
          const idKey = String(exp.ExpenseID || exp._id || `exp_${idx}`).trim();
          if (idKey) countedExpenseKeys.add(idKey);
          if (exp.ReceiptRef) countedExpenseKeys.add(String(exp.ReceiptRef).trim());
          if (exp.ReferenceNo) countedExpenseKeys.add(String(exp.ReferenceNo).trim());
          // Also mark date+amount key to prevent double counting from synced transactions
          countedExpenseKeys.add(`${d}_${amt}`);
        }
      }
    });

    // 4B. Staff Salaries & Payroll Disbursements
    let salaryOutflows = 0;
    const countedPayrollKeys = new Set<string>();

    effectivePayrolls.forEach((p: any, idx: number) => {
      const d = parseCleanDate(p.PaymentDate || p.Date || (p.MonthYear ? `${p.MonthYear}-01` : ''));
      if (isWithinDateRange(d) || (p.MonthYear && startDate.startsWith(p.MonthYear))) {
        if (p.PaymentStatus === 'Paid' || p.Status === 'Paid' || !p.PaymentStatus) {
          const amt = Number(p.NetSalary || p.BasicSalary || p.Amount || 0);
          if (amt > 0) {
            salaryOutflows += amt;
            const pKey = String(p.PayrollID || p._id || `pay_${idx}`).trim();
            if (pKey) countedPayrollKeys.add(pKey);
            if (p.ReferenceNo) countedPayrollKeys.add(String(p.ReferenceNo).trim());
            countedPayrollKeys.add(`${d}_${amt}`);
          }
        }
      }
    });

    // 4C. Vendor Payments & Supplier Settlements (Cash & Settled Credit Bills ONLY)
    // Note: Items purchased on credit create Accounts Payable liabilities and are ONLY counted in Cash Outflows
    // when the vendor bill is actually paid (Vendor Payment voucher / cash settlement).
    let vendorOutflows = 0;
    const countedVendorKeys = new Set<string>();

    // 4D. Evaluate Transactions for uncounted expenses, salaries, or actual vendor disbursements
    effectiveTransactions.forEach((t: any, idx: number) => {
      const d = parseCleanDate(t.Date || t.TransactionDate || t.CreatedAt);
      if (isWithinDateRange(d)) {
        const amt = Number(t.Amount || 0);
        if (amt <= 0) return;

        const type = (t.Type || '').toLowerCase();
        const cat = (t.Category || '').toLowerCase();
        const desc = (t.Description || '').toLowerCase();
        const refNo = String(t.ReferenceNo || t.TransactionID || t.LinkedExpenseID || t.ExpenseID || t.LinkedPayrollID || t.PayrollID || '').trim();
        const dateAmtKey = `${d}_${amt}`;

        // Strict Check: Only actual paid vendor disbursements (VendorPayment, Paid Cash Purchase) count as cash outflows
        const isPaidVendorPayment = (
          type === 'vendorpayment' || 
          type === 'vendor_payment' || 
          (type === 'expense' && (cat.includes('vendor') || cat.includes('supplier'))) ||
          (desc.includes('vendor payment') || desc.includes('paid to vendor') || desc.includes('spot cash payment on delivery'))
        ) && t.PaymentStatus !== 'Unpaid';

        const isSalary = type === 'payroll' || type === 'salary' || cat.includes('salary') || cat.includes('payroll');
        const isExpense = !isPaidVendorPayment && !isSalary && (
          type === 'expense' || type === 'debit' || type === 'outflow' ||
          cat.includes('expense') || cat.includes('utility') || cat.includes('rent') ||
          cat.includes('maintenance') || cat.includes('tea') || cat.includes('stationery') ||
          cat.includes('fuel') || cat.includes('cleaning') || cat.includes('supplies') ||
          cat.includes('office') || cat.includes('repair') ||
          (type !== 'income' && type !== 'deposit' && type !== 'receipt' && type !== 'credit' && type !== 'grn_credit' && type !== 'purchase')
        );

        if (isPaidVendorPayment) {
          if (!countedVendorKeys.has(refNo) && !countedVendorKeys.has(dateAmtKey)) {
            vendorOutflows += amt;
            if (refNo) countedVendorKeys.add(refNo);
            countedVendorKeys.add(dateAmtKey);
          }
        } else if (isSalary) {
          if (!countedPayrollKeys.has(refNo) && !countedPayrollKeys.has(dateAmtKey)) {
            salaryOutflows += amt;
            if (refNo) countedPayrollKeys.add(refNo);
            countedPayrollKeys.add(dateAmtKey);
          }
        } else if (isExpense) {
          if (!countedExpenseKeys.has(refNo) && !countedExpenseKeys.has(dateAmtKey)) {
            totalOperatingExpenses += amt;
            if (refNo) countedExpenseKeys.add(refNo);
            countedExpenseKeys.add(dateAmtKey);
          }
        }
      }
    });

    // 4E. Accounting Vouchers (Cash/Bank Payment Vouchers: CPV, BPV, CP, BP, PV)
    effectiveVouchers.forEach((v: any, idx: number) => {
      const d = parseCleanDate(v.VchDate || v.VDate || v.Date || v.CreatedAt);
      if (isWithinDateRange(d)) {
        const vType = (v.VchType || v.Type || '').toUpperCase();
        if (vType === 'CPV' || vType === 'BPV' || vType === 'CP' || vType === 'BP' || vType === 'PV' || vType === 'PAYMENT') {
          const amt = Number(v.Amount || v.VAmount || v.TotalAmount || v.NetDebit || 0);
          if (amt <= 0) return;

          const remarks = (v.Remarks || v.Description || '').toLowerCase();
          const vKey = String(v.VchNo || v._id || v.VoucherID || `vch_${idx}`).trim();
          const ref = String(v.RefNo || '').trim();
          const dateAmtKey = `${d}_${amt}`;

          // Cash payment vouchers to suppliers / vendors
          const isVendor = (remarks.includes('supplier') || remarks.includes('vendor payment') || remarks.includes('pay vendor') || Boolean(v.VendorID || v.SupplierID)) && !remarks.includes('stock received on credit');
          const isSalary = remarks.includes('salary') || remarks.includes('payroll') || remarks.includes('staff pay') || remarks.includes('wages');

          if (isVendor) {
            if (!countedVendorKeys.has(vKey) && !countedVendorKeys.has(ref) && !countedVendorKeys.has(dateAmtKey)) {
              vendorOutflows += amt;
              countedVendorKeys.add(vKey);
              countedVendorKeys.add(dateAmtKey);
            }
          } else if (isSalary) {
            if (!countedPayrollKeys.has(vKey) && !countedPayrollKeys.has(ref) && !countedPayrollKeys.has(dateAmtKey)) {
              salaryOutflows += amt;
              countedPayrollKeys.add(vKey);
              countedPayrollKeys.add(dateAmtKey);
            }
          } else {
            // General / Clinic Operational Expense Voucher
            if (!countedExpenseKeys.has(vKey) && !countedExpenseKeys.has(ref) && !countedExpenseKeys.has(dateAmtKey)) {
              totalOperatingExpenses += amt;
              countedExpenseKeys.add(vKey);
              countedExpenseKeys.add(dateAmtKey);
            }
          }
        }
      }
    });

    const totalExpenses = vendorOutflows + salaryOutflows + totalOperatingExpenses;
    const netProfit = totalIncome - totalExpenses;
    const netMarginPct = totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0;
    const expenseRatio = totalIncome > 0 ? (totalExpenses / totalIncome) * 100 : 0;

    return {
      opdConsultationFees: totalOpdConsultation,
      opdCardFees: totalCardFileFeeCollection,
      opdDispensingFees: totalClinMedCollection,
      standaloneApptFees: standaloneTokenFees,
      totalOpdIncome,
      grossPosSales,
      totalSalesReturns,
      netPosIncome,
      pharmacyCogs,
      pharmacyGrossProfit,
      pharmacyMarginPct,
      otherIncome,
      totalIncome,
      vendorOutflows,
      salaryOutflows,
      expenseOutflows: totalOperatingExpenses,
      totalOperatingExpenses,
      totalExpenses,
      netProfit,
      netMarginPct,
      expenseRatio,
      // Backward compatibility aliases:
      apptFees: totalOpdIncome,
      posIncome: netPosIncome
    };
  }, [effectiveAppointments, effectiveTokens, effectiveVisits, effectiveInvoices, effectiveInvoiceDetails, effectiveSalesReturns, effectiveItems, effectiveTransactions, effectivePayrolls, effectiveExpenses, effectiveVouchers, startDate, endDate, datePreset]);

  // Report 9: Shift-Wise Collection Summary Report Data
  const shiftCollectionData = useMemo(() => {
    const datesSet = new Set<string>();

    const cleanStart = parseCleanDate(startDate);
    const cleanEnd = parseCleanDate(endDate);

    const checkDateInRange = (dateStr: string) => {
      const clean = parseCleanDate(dateStr);
      if (!clean) return false;
      if (datePreset === 'all') return true;
      if (!cleanStart || !cleanEnd) return true;
      return clean >= cleanStart && clean <= cleanEnd;
    };

    if (datePreset !== 'all' && cleanStart && cleanEnd && cleanStart <= cleanEnd) {
      const [sY, sM, sD] = cleanStart.split('-').map(Number);
      const [eY, eM, eD] = cleanEnd.split('-').map(Number);
      if (sY && sM && sD && eY && eM && eD) {
        const cur = new Date(sY, sM - 1, sD, 12, 0, 0);
        const endDateObj = new Date(eY, eM - 1, eD, 12, 0, 0);
        while (cur <= endDateObj) {
          const yyyy = cur.getFullYear();
          const mm = String(cur.getMonth() + 1).padStart(2, '0');
          const dd = String(cur.getDate()).padStart(2, '0');
          datesSet.add(`${yyyy}-${mm}-${dd}`);
          cur.setDate(cur.getDate() + 1);
        }
      }
    }

    effectiveAppointments.forEach(a => {
      const d = parseCleanDate(a.AppointmentDate || a.Date);
      if (d && checkDateInRange(d)) datesSet.add(d);
    });
    effectiveVisits.forEach(v => {
      const d = parseCleanDate(v.VisitDate || v.Date);
      if (d && checkDateInRange(d)) datesSet.add(d);
    });
    effectiveInvoices.forEach(inv => {
      const d = parseCleanDate(inv.InvoiceDate || inv.date || inv.Date);
      if (d && checkDateInRange(d)) datesSet.add(d);
    });

    const sortedDates = Array.from(datesSet).sort();

    const getVisShift = (vis: any) => {
      if (vis.Shift === 1 || vis.Shift === 2) return vis.Shift;
      if (vis.shift === 1 || vis.shift === 2) return vis.shift;
      const visCleanDate = parseCleanDate(vis.VisitDate || vis.Date);
      const matchedApp = effectiveAppointments.find(
        (a: any) => a.PatientID === vis.PatientID && parseCleanDate(a.AppointmentDate || a.Date) === visCleanDate
      );
      if (matchedApp && (matchedApp.Shift === 1 || matchedApp.Shift === 2)) return matchedApp.Shift;
      return 1;
    };

    const getVisFees = (v: any) => {
      let clin = Number(v.ClinicalMedicinePayment || v.ClinicalMedicineCharges || v.ClinicalMedicinePkr || v.clinicMedicineCharges || v.medicineCharges || v.MedicineCost || 0) || 0;
      let file = Number(v.FileFee || v.fileFee || v.FilePkr || v.RegFee || 0) || 0;
      let card = Number(v.CardFee || v.cardFee || v.CardsPayment || 0) || 0;
      if (v.VisitRemarks) {
        if (!clin) { const cPkr = v.VisitRemarks.match(/Clinical Meds PKR\s*(\d+)/); if (cPkr) clin = Number(cPkr[1]); }
        if (!file) { const fPkr = v.VisitRemarks.match(/File PKR\s*(\d+)/); if (fPkr) file = Number(fPkr[1]); }
        if (!card) { const kPkr = v.VisitRemarks.match(/Card PKR\s*(\d+)/); if (kPkr) card = Number(kPkr[1]); }
      }
      return { clin, file, card };
    };

    const getInvoiceAmount = (inv: any) => {
      return Number(inv.NetAmount ?? inv.NetPayable ?? inv.GrandTotal ?? inv.GAmount ?? inv.totalAmount ?? inv.TotalAmount ?? inv.amount ?? 0);
    };

    let totalMorningClinic = 0;
    let totalMorningStore = 0;
    let totalEveningClinic = 0;
    let totalEveningStore = 0;

    const dailyRows = sortedDates.map(dateStr => {
      const appsForDate = effectiveAppointments.filter(a => parseCleanDate(a.AppointmentDate || a.Date) === dateStr && a.Status !== 3);
      const visitsForDate = effectiveVisits.filter(v => parseCleanDate(v.VisitDate || v.Date) === dateStr && (v.Status as number) !== 3);
      const invoicesForDate = effectiveInvoices.filter(inv => parseCleanDate(inv.InvoiceDate || inv.date || inv.Date) === dateStr && (inv.Status as number) !== 3);
      const returnsForDate = effectiveSalesReturns.filter(r => parseCleanDate(r.ReturnDate || r.Date) === dateStr);

      // MORNING (Shift 1)
      const mAppFromAppointments = appsForDate.filter(a => (a.Shift || a.shift || 1) === 1).reduce((sum, a) => sum + (Number(a.FeeCharged || a.FeeReceived || a.Fee) || 0), 0);
      const mAppFromVisits = visitsForDate.filter(v => getVisShift(v) === 1).reduce((sum, v) => {
        const fee = Number(v.ConsultationFee || v.FeeCharged || v.FeeReceived) || 0;
        const hasAppFee = appsForDate.some(a => a.PatientID === v.PatientID && (a.Shift || 1) === 1 && (Number(a.FeeCharged || a.FeeReceived) || 0) > 0);
        return sum + (hasAppFee ? 0 : fee);
      }, 0);
      const mApp = mAppFromAppointments + mAppFromVisits;

      const mVisFees = visitsForDate.filter(v => getVisShift(v) === 1).reduce((sum, v) => {
        const fees = getVisFees(v);
        return sum + fees.clin + fees.card + fees.file;
      }, 0);

      const morningClinic = mApp + mVisFees;

      const morningStoreGross = invoicesForDate
        .filter(i => (i.Shift === 1 || i.shift === 1 || (!i.Shift && !i.shift)))
        .reduce((sum, i) => sum + getInvoiceAmount(i), 0);
      const morningStoreRet = returnsForDate
        .filter(r => (r.Shift === 1 || r.shift === 1 || (!r.Shift && !r.shift)))
        .reduce((sum, r) => sum + (Number(r.NetPaid ?? r.RefundAmount ?? r.TotalAmount ?? 0) || 0), 0);
      const morningStore = Math.max(0, morningStoreGross - morningStoreRet);

      const morningTotal = morningClinic + morningStore;

      // EVENING (Shift 2)
      const eAppFromAppointments = appsForDate.filter(a => (a.Shift || a.shift) === 2).reduce((sum, a) => sum + (Number(a.FeeCharged || a.FeeReceived || a.Fee) || 0), 0);
      const eAppFromVisits = visitsForDate.filter(v => getVisShift(v) === 2).reduce((sum, v) => {
        const fee = Number(v.ConsultationFee || v.FeeCharged || v.FeeReceived) || 0;
        const hasAppFee = appsForDate.some(a => a.PatientID === v.PatientID && a.Shift === 2 && (Number(a.FeeCharged || a.FeeReceived) || 0) > 0);
        return sum + (hasAppFee ? 0 : fee);
      }, 0);
      const eApp = eAppFromAppointments + eAppFromVisits;

      const eVisFees = visitsForDate.filter(v => getVisShift(v) === 2).reduce((sum, v) => {
        const fees = getVisFees(v);
        return sum + fees.clin + fees.card + fees.file;
      }, 0);

      const eveningClinic = eApp + eVisFees;

      const eveningStoreGross = invoicesForDate
        .filter(i => (i.Shift === 2 || i.shift === 2))
        .reduce((sum, i) => sum + getInvoiceAmount(i), 0);
      const eveningStoreRet = returnsForDate
        .filter(r => (r.Shift === 2 || r.shift === 2))
        .reduce((sum, r) => sum + (Number(r.NetPaid ?? r.RefundAmount ?? r.TotalAmount ?? 0) || 0), 0);
      const eveningStore = Math.max(0, eveningStoreGross - eveningStoreRet);

      const eveningTotal = eveningClinic + eveningStore;

      const dailyTotal = morningTotal + eveningTotal;

      totalMorningClinic += morningClinic;
      totalMorningStore += morningStore;
      totalEveningClinic += eveningClinic;
      totalEveningStore += eveningStore;

      return {
        date: dateStr,
        morningClinic,
        morningStore,
        morningTotal,
        eveningClinic,
        eveningStore,
        eveningTotal,
        dailyTotal
      };
    });

    const totalMorning = totalMorningClinic + totalMorningStore;
    const totalEvening = totalEveningClinic + totalEveningStore;
    const grandTotal = totalMorning + totalEvening;

    return {
      dailyRows,
      totalMorningClinic,
      totalMorningStore,
      totalMorning,
      totalEveningClinic,
      totalEveningStore,
      totalEvening,
      grandTotal
    };
  }, [effectiveAppointments, effectiveVisits, effectiveInvoices, effectiveSalesReturns, startDate, endDate, datePreset]);

  const filteredShiftCollectionRows = useMemo(() => {
    if (!searchQuery.trim()) return shiftCollectionData.dailyRows;
    const q = searchQuery.toLowerCase();
    return shiftCollectionData.dailyRows.filter(r => r.date.toLowerCase().includes(q));
  }, [shiftCollectionData.dailyRows, searchQuery]);

  // Report 10: FOC (Free of Charge) Cases Summary
  const focReportData = useMemo(() => {
    const allVisits = visits.length > 0 ? visits : patientVisits;
    const focVisits = allVisits.filter(v => {
      if (!isWithinDateRange(v.VisitDate)) return false;
      const opt = v.ConsultationPaymentOption || '';
      const rem = v.VisitRemarks || '';
      return (
        opt === 'FOC' ||
        rem.includes('FOC') ||
        rem.includes('Free of Charge') ||
        v.FocReason ||
        (Number(v.FocWaivedOpdFee) || 0) > 0
      );
    });

    let totalOpdWaived = 0;
    let totalClinWaived = 0;
    let totalFileCardWaived = 0;

    const rows = focVisits.map(v => {
      const opd = Number(v.FocWaivedOpdFee) || (v.ConsultationFee ? Number(v.ConsultationFee) : 500);
      const clin = Number(v.FocWaivedClinicalFee) || 0;
      const fc = Number(v.FocWaivedFileCardFee) || 0;
      const totalWaived = opd + clin + fc;

      totalOpdWaived += opd;
      totalClinWaived += clin;
      totalFileCardWaived += fc;

      const ptList = (patients as any[]) || [];
      const pt = ptList.find(p => p.PatientID === v.PatientID) || {};

      return {
        visitId: v.VisitID || 'VIS',
        date: v.VisitDate ? v.VisitDate.split('T')[0] : 'N/A',
        patientId: v.PatientID || 'N/A',
        patientName: pt.PatientName || v.PatientName || 'Patient',
        phone: pt.PhoneNumber || pt.Phone || 'N/A',
        symptoms: v.SymptomsDiagnosis || 'FOC Consultation',
        opdWaived: opd,
        clinWaived: clin,
        fileCardWaived: fc,
        totalWaived,
        reason: v.FocReason || (v.VisitRemarks?.includes('Reason:') ? v.VisitRemarks.split('Reason:')[1]?.replace(')', '').trim() : 'Deserving / Needy Patient')
      };
    });

    const grandTotalWaived = totalOpdWaived + totalClinWaived + totalFileCardWaived;

    return {
      rows,
      totalCount: focVisits.length,
      totalOpdWaived,
      totalClinWaived,
      totalFileCardWaived,
      grandTotalWaived
    };
  }, [visits, patientVisits, patients, startDate, endDate, datePreset]);

  const filteredFocRows = useMemo(() => {
    if (!searchQuery.trim()) return focReportData.rows;
    const q = searchQuery.toLowerCase();
    return focReportData.rows.filter(r =>
      r.patientName.toLowerCase().includes(q) ||
      r.patientId.toLowerCase().includes(q) ||
      r.phone.toLowerCase().includes(q) ||
      r.symptoms.toLowerCase().includes(q) ||
      r.reason.toLowerCase().includes(q) ||
      r.date.includes(q)
    );
  }, [focReportData.rows, searchQuery]);

  // Report 11: Store Medicine Sales, Purchase Cost & Profit Margin Analysis
  const storeMedicineReportData = useMemo(() => {
    const validInvoices = effectiveInvoices.filter(inv => {
      const invDate = parseCleanDate(inv.InvoiceDate || inv.date || inv.Date);
      const isNotReversed = inv.Status !== 3 && inv.status !== 'Reversed';
      return isNotReversed && isWithinDateRange(invDate);
    });

    const validInvoiceMap = new Map<string, any>();
    validInvoices.forEach(inv => {
      const invNo = String(inv.InvoiceNo || inv.invoiceNo || inv.id || '');
      if (invNo) validInvoiceMap.set(invNo, inv);
    });

    // Track which invoice details have been processed to prevent duplicates
    const processedInvoiceNos = new Set<string>();

    const itemSalesMap: Record<string, {
      itemId: string;
      itemName: string;
      category: string;
      company: string;
      medicineType: string;
      qtySold: number;
      unitPurchasePrice: number;
      unitSalePrice: number;
      totalGrossSales: number;
      totalDiscount: number;
      totalNetSales: number;
      totalCogs: number;
      grossProfit: number;
      marginPct: number;
      markupPct: number;
    }> = {};

    let totalGrossSalesAll = 0;
    let totalDiscountsAll = 0;
    let totalNetSalesAll = 0;
    let totalCogsAll = 0;

    // Helper to register / aggregate detail line
    const aggregateItemLine = (
      rawItemId: string,
      rawQty: number,
      rawPrice: number,
      rawCost: number | null,
      rawDiscount: number | null,
      parentInvoice: any,
      explicitMedType?: string
    ) => {
      const itemId = String(rawItemId || 'UNKNOWN').trim().toUpperCase();
      const itemObj = effectiveItems.find(it => 
        String(it.ItemID || it.id || '').toUpperCase() === itemId ||
        String(it.ItemName || it.itemName || '').toLowerCase() === itemId.toLowerCase()
      );

      const itemName = itemObj?.ItemName || itemObj?.itemName || itemId;
      const category = itemObj?.Category || itemObj?.category || itemObj?.Unit || 'Pharmacy Store';
      const company = itemObj?.Company || itemObj?.company || itemObj?.Brand || '-';
      const medType = explicitMedType || itemObj?.MedicineType || 'P';

      const qty = Number(rawQty) || 0;
      if (qty <= 0) return;

      const salePrice = Number(rawPrice) > 0 
        ? Number(rawPrice) 
        : (Number(itemObj?.Price ?? itemObj?.SalePrice) || 0);

      const purPrice = rawCost !== null && Number(rawCost) > 0
        ? Number(rawCost)
        : (Number(itemObj?.PurchasePrice ?? itemObj?.TP ?? itemObj?.costPrice) || (salePrice > 0 ? Math.round(salePrice * 0.75) : 0));

      const lineGross = qty * salePrice;

      // Allocate discount: explicit line discount OR proportional header discount
      let lineDisc = 0;
      if (rawDiscount !== null && Number(rawDiscount) > 0) {
        lineDisc = Number(rawDiscount);
      } else if (parentInvoice) {
        const invGross = Number(parentInvoice.GAmount || parentInvoice.TotalAmount || parentInvoice.GrandTotal) || 0;
        const invDisc = Number(parentInvoice.Discount) || 0;
        if (invDisc > 0 && invGross > 0) {
          lineDisc = Math.round((lineGross / invGross) * invDisc);
        }
      }

      const lineNet = Math.max(0, lineGross - lineDisc);
      const lineCogs = qty * purPrice;

      totalGrossSalesAll += lineGross;
      totalDiscountsAll += lineDisc;
      totalNetSalesAll += lineNet;
      totalCogsAll += lineCogs;

      if (!itemSalesMap[itemId]) {
        itemSalesMap[itemId] = {
          itemId,
          itemName,
          category,
          company,
          medicineType: medType,
          qtySold: 0,
          unitPurchasePrice: purPrice,
          unitSalePrice: salePrice,
          totalGrossSales: 0,
          totalDiscount: 0,
          totalNetSales: 0,
          totalCogs: 0,
          grossProfit: 0,
          marginPct: 0,
          markupPct: 0
        };
      }

      itemSalesMap[itemId].qtySold += qty;
      itemSalesMap[itemId].totalGrossSales += lineGross;
      itemSalesMap[itemId].totalDiscount += lineDisc;
      itemSalesMap[itemId].totalNetSales += lineNet;
      itemSalesMap[itemId].totalCogs += lineCogs;
      if (purPrice > 0) itemSalesMap[itemId].unitPurchasePrice = purPrice;
      if (salePrice > 0) itemSalesMap[itemId].unitSalePrice = salePrice;
    };

    // 1. Process explicit detail lines in effectiveInvoiceDetails
    effectiveInvoiceDetails.forEach(detail => {
      const invNo = String(detail.InvoiceNo || detail.invoiceNo || '');
      if (!invNo || !validInvoiceMap.has(invNo)) return;

      processedInvoiceNos.add(invNo);
      const parentInv = validInvoiceMap.get(invNo);

      aggregateItemLine(
        detail.ItemID || detail.itemId,
        Number(detail.Qty || detail.qty || detail.quantity) || 1,
        Number(detail.Price || detail.price || detail.SalePrice || detail.salePrice) || 0,
        detail.CostPrice !== undefined ? Number(detail.CostPrice) : null,
        detail.Discount !== undefined ? Number(detail.Discount) : null,
        parentInv,
        detail.MedicineType
      );
    });

    // 2. Process invoices that had items embedded in invoice headers
    validInvoices.forEach(inv => {
      const invNo = String(inv.InvoiceNo || inv.invoiceNo || inv.id || '');
      if (processedInvoiceNos.has(invNo)) return;

      const invItems = inv.items || inv.basket || inv.InvoiceDetails || [];
      if (Array.isArray(invItems) && invItems.length > 0) {
        invItems.forEach((it: any) => {
          aggregateItemLine(
            it.ItemID || it.itemId || it.id,
            Number(it.Qty || it.qty) || 1,
            Number(it.Price || it.price || it.SalePrice || it.salePrice) || 0,
            it.CostPrice !== undefined ? Number(it.CostPrice) : (it.PurchasePrice !== undefined ? Number(it.PurchasePrice) : null),
            it.Discount !== undefined ? Number(it.Discount) : null,
            inv,
            it.MedicineType
          );
        });
      } else {
        // Flat invoice summary fallback
        const invGross = Number(inv.GAmount || inv.GrandTotal || inv.TotalAmount) || 0;
        const invDisc = Number(inv.Discount) || 0;
        const invNet = Number(inv.NetAmount || inv.NetPayable) || (invGross - invDisc);
        const estCogs = Math.round(invNet * 0.75);

        totalGrossSalesAll += invGross;
        totalDiscountsAll += invDisc;
        totalNetSalesAll += invNet;
        totalCogsAll += estCogs;
      }
    });

    // 3. Process Sales Returns within date range
    if (Array.isArray(effectiveSalesReturns) && effectiveSalesReturns.length > 0) {
      effectiveSalesReturns.forEach(sr => {
        const srDate = parseCleanDate(sr.ReturnDate || sr.date || sr.Date);
        if (!isWithinDateRange(srDate)) return;

        const returnedItems = sr.returnedItems || sr.items || sr.details || [];
        if (Array.isArray(returnedItems) && returnedItems.length > 0) {
          returnedItems.forEach((rItm: any) => {
            const rItemId = String(rItm.ItemID || rItm.itemId || '').trim().toUpperCase();
            const rQty = Number(rItm.QtyReturned || rItm.Qty || rItm.qty) || 0;
            const rPrice = Number(rItm.PriceRef || rItm.Price || rItm.price) || 0;
            const rAmount = Number(rItm.LineTotal) || (rQty * rPrice);

            if (itemSalesMap[rItemId] && rQty > 0) {
              const purPrice = itemSalesMap[rItemId].unitPurchasePrice;
              const rCogs = rQty * purPrice;

              itemSalesMap[rItemId].qtySold = Math.max(0, itemSalesMap[rItemId].qtySold - rQty);
              itemSalesMap[rItemId].totalGrossSales = Math.max(0, itemSalesMap[rItemId].totalGrossSales - rAmount);
              itemSalesMap[rItemId].totalNetSales = Math.max(0, itemSalesMap[rItemId].totalNetSales - rAmount);
              itemSalesMap[rItemId].totalCogs = Math.max(0, itemSalesMap[rItemId].totalCogs - rCogs);

              totalGrossSalesAll = Math.max(0, totalGrossSalesAll - rAmount);
              totalNetSalesAll = Math.max(0, totalNetSalesAll - rAmount);
              totalCogsAll = Math.max(0, totalCogsAll - rCogs);
            }
          });
        }
      });
    }

    // Finalize item calculations
    const rows = Object.values(itemSalesMap).map(row => {
      const profit = row.totalNetSales - row.totalCogs;
      const margin = row.totalNetSales > 0 ? (profit / row.totalNetSales) * 100 : 0;
      const markup = row.totalCogs > 0 ? (profit / row.totalCogs) * 100 : 0;
      return {
        ...row,
        grossProfit: profit,
        marginPct: margin,
        markupPct: markup
      };
    });

    const totalGrossProfitAll = totalNetSalesAll - totalCogsAll;
    const overallMarginPctAll = totalNetSalesAll > 0 ? (totalGrossProfitAll / totalNetSalesAll) * 100 : 0;

    return {
      validInvoicesCount: validInvoices.length,
      rows,
      totalGrossSalesAll,
      totalDiscountsAll,
      totalNetSalesAll,
      totalCogsAll,
      totalGrossProfitAll,
      overallMarginPctAll
    };
  }, [effectiveInvoices, effectiveInvoiceDetails, effectiveItems, effectiveSalesReturns, startDate, endDate, datePreset]);

  // Filtered & Sorted Store Medicine Rows
  const filteredStoreMedicineRows = useMemo(() => {
    let list = [...storeMedicineReportData.rows];

    // Category Filter
    if (selectedCategory && selectedCategory !== 'all') {
      list = list.filter(r => r.category?.toLowerCase() === selectedCategory.toLowerCase());
    }

    // Medicine Type Filter
    if (storeMedicineTypeFilter && storeMedicineTypeFilter !== 'all') {
      if (storeMedicineTypeFilter === 'P') {
        list = list.filter(r => r.medicineType === 'P' || r.medicineType === 'S');
      } else if (storeMedicineTypeFilter === 'C') {
        list = list.filter(r => r.medicineType === 'C');
      }
    }

    // Search Query Filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(r =>
        r.itemName.toLowerCase().includes(q) ||
        r.itemId.toLowerCase().includes(q) ||
        r.company.toLowerCase().includes(q) ||
        r.category.toLowerCase().includes(q)
      );
    }

    // Dynamic Multi-Column Sort
    list.sort((a, b) => {
      let aVal: any = a[storeSortField];
      let bVal: any = b[storeSortField];

      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = (bVal || '').toString().toLowerCase();
        return storeSortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }

      aVal = Number(aVal) || 0;
      bVal = Number(bVal) || 0;
      return storeSortOrder === 'asc' ? aVal - bVal : bVal - aVal;
    });

    return list;
  }, [storeMedicineReportData.rows, selectedCategory, storeMedicineTypeFilter, searchQuery, storeSortField, storeSortOrder]);

  // Computed Totals for the Filtered Rows (guarantee exact numbers in UI / Print / CSV)
  const filteredStoreMedicineSummary = useMemo(() => {
    const count = filteredStoreMedicineRows.length;
    const totalQtySold = filteredStoreMedicineRows.reduce((sum, r) => sum + r.qtySold, 0);
    const totalGrossSales = filteredStoreMedicineRows.reduce((sum, r) => sum + r.totalGrossSales, 0);
    const totalDiscount = filteredStoreMedicineRows.reduce((sum, r) => sum + r.totalDiscount, 0);
    const totalNetSales = filteredStoreMedicineRows.reduce((sum, r) => sum + r.totalNetSales, 0);
    const totalCogs = filteredStoreMedicineRows.reduce((sum, r) => sum + r.totalCogs, 0);
    const totalGrossProfit = totalNetSales - totalCogs;
    const overallMarginPct = totalNetSales > 0 ? (totalGrossProfit / totalNetSales) * 100 : 0;

    return {
      count,
      totalQtySold,
      totalGrossSales,
      totalDiscount,
      totalNetSales,
      totalCogs,
      totalGrossProfit,
      overallMarginPct
    };
  }, [filteredStoreMedicineRows]);

  // Report 12: General Ledger & Double-Entry Postings Query Engine
  const effectiveTlAccounts = useMemo(() => {
    if (Array.isArray(tlAccounts) && tlAccounts.length > 0) return tlAccounts;
    return INITIAL_TL_ACCOUNTS;
  }, [tlAccounts]);

  const accountLookup = useMemo(() => {
    const map = new Map<number, { name: string; category: string }>();
    effectiveTlAccounts.forEach(acc => {
      let cat = 'Asset';
      const slid = acc.SLID || Math.floor(acc.TLID / 1000);
      if (acc.FLID === 1 || slid === 101 || slid === 102 || slid === 103) cat = 'Asset';
      else if (acc.FLID === 2 || slid === 201) cat = 'Liability';
      else if (acc.FLID === 3 || slid === 301) cat = 'Equity';
      else if (acc.FLID === 4 || slid === 401 || slid === 402) cat = 'Income';
      else if (acc.FLID === 5 || slid === 501 || slid === 502) cat = 'Expense';
      map.set(acc.TLID, { name: acc.TLName, category: cat });
    });
    return map;
  }, [effectiveTlAccounts]);

  const rawLedgerLines = useMemo(() => {
    const lines: Array<{
      id: string;
      txDate: string;
      vchNo: string;
      vchType: 'CPV' | 'CRV' | 'BPV' | 'BRV' | 'JV' | 'GRN' | 'INV' | 'SR';
      tlid: number;
      accountName: string;
      accountCategory: string;
      description: string;
      payeeOrParty: string;
      sourceModule: string;
      debit: number;
      credit: number;
    }> = [];

    // 1. Direct acLedger records from storage/props
    if (Array.isArray(acLedger) && acLedger.length > 0) {
      acLedger.forEach((entry, idx) => {
        const tlid = Number(entry.TLID) || 101001;
        const accInfo = accountLookup.get(tlid) || { name: `Account #${tlid}`, category: 'General' };
        const vch = entry.VchNo || `VCH-${idx + 1}`;
        let vType: any = 'JV';
        if (vch.startsWith('CPV')) vType = 'CPV';
        else if (vch.startsWith('CRV')) vType = 'CRV';
        else if (vch.startsWith('BPV')) vType = 'BPV';
        else if (vch.startsWith('BRV')) vType = 'BRV';
        else if (vch.startsWith('GRN')) vType = 'GRN';
        else if (vch.startsWith('INV') || vch.startsWith('POS')) vType = 'INV';
        else if (vch.startsWith('SR')) vType = 'SR';

        lines.push({
          id: entry.ACLedgerID || `ACL-${idx + 1}`,
          txDate: parseCleanDate(entry.TxDate || entry.Date || todayStr),
          vchNo: vch,
          vchType: vType,
          tlid: tlid,
          accountName: accInfo.name,
          accountCategory: accInfo.category,
          description: entry.Remarks || entry.Description || 'General Ledger Entry',
          payeeOrParty: entry.Payee || entry.VendorName || entry.CustomerName || '',
          sourceModule: entry.SourceModule || 'Accounts Ledger',
          debit: Number(entry.Debit) || 0,
          credit: Number(entry.Credit) || 0
        });
      });
    }

    // 2. Synthesize from transactions (Vouchers, Income, Expense, Vendor Payments)
    effectiveTransactions.forEach((tx, idx) => {
      const vch = tx.TransactionID || `TXN-${idx + 1}`;
      if (lines.some(l => l.vchNo === vch)) return;

      const txDate = parseCleanDate(tx.Date || todayStr);
      const amt = Number(tx.Amount) || 0;
      const isBank = tx.PaymentMethod?.toLowerCase().includes('bank') || tx.PaymentMethod?.toLowerCase().includes('online');
      const cashOrBankTlid = isBank ? 101004 : 101001;
      const cashOrBankName = isBank ? 'Main Bank Current Account' : 'Cash-in-Hand (Morning Shift)';

      if (tx.Type === 'Income') {
        const vType = isBank ? 'BRV' : 'CRV';
        // Dr Cash / Bank
        lines.push({
          id: `TXN-DR-${tx.TransactionID || idx}`,
          txDate,
          vchNo: vch,
          vchType: vType,
          tlid: cashOrBankTlid,
          accountName: cashOrBankName,
          accountCategory: 'Asset',
          description: tx.Description || `Income Receipt: ${tx.Category}`,
          payeeOrParty: tx.VendorName || tx.CreatedBy || '',
          sourceModule: 'Financial Desk',
          debit: amt,
          credit: 0
        });
        // Cr Income
        lines.push({
          id: `TXN-CR-${tx.TransactionID || idx}`,
          txDate,
          vchNo: vch,
          vchType: vType,
          tlid: 401001,
          accountName: 'Appointment OPD Ticket Revenue',
          accountCategory: 'Income',
          description: tx.Description || `Income Received - ${tx.Category}`,
          payeeOrParty: tx.VendorName || '',
          sourceModule: 'Financial Desk',
          debit: 0,
          credit: amt
        });
      } else if (tx.Type === 'VendorPayment') {
        const vType = isBank ? 'BPV' : 'CPV';
        // Dr Accounts Payable (Vendor)
        lines.push({
          id: `TXN-DR-${tx.TransactionID || idx}`,
          txDate,
          vchNo: vch,
          vchType: vType,
          tlid: 201001,
          accountName: `Accounts Payable: ${tx.VendorName || 'Suppliers'}`,
          accountCategory: 'Liability',
          description: tx.Description || `Payment to Vendor ${tx.VendorName}`,
          payeeOrParty: tx.VendorName || '',
          sourceModule: 'Vendor Ledger',
          debit: amt,
          credit: 0
        });
        // Cr Cash / Bank
        lines.push({
          id: `TXN-CR-${tx.TransactionID || idx}`,
          txDate,
          vchNo: vch,
          vchType: vType,
          tlid: cashOrBankTlid,
          accountName: cashOrBankName,
          accountCategory: 'Asset',
          description: tx.Description || `Cash/Bank Disbursed to ${tx.VendorName}`,
          payeeOrParty: tx.VendorName || '',
          sourceModule: 'Vendor Ledger',
          debit: 0,
          credit: amt
        });
      } else {
        // Operating Expense
        const vType = isBank ? 'BPV' : 'CPV';
        // Dr Expense
        lines.push({
          id: `TXN-DR-${tx.TransactionID || idx}`,
          txDate,
          vchNo: vch,
          vchType: vType,
          tlid: 502001,
          accountName: `Operating Expense (${tx.Category || 'General'})`,
          accountCategory: 'Expense',
          description: tx.Description || `Expense - ${tx.Category}`,
          payeeOrParty: tx.VendorName || '',
          sourceModule: 'Expense Desk',
          debit: amt,
          credit: 0
        });
        // Cr Cash / Bank
        lines.push({
          id: `TXN-CR-${tx.TransactionID || idx}`,
          txDate,
          vchNo: vch,
          vchType: vType,
          tlid: cashOrBankTlid,
          accountName: cashOrBankName,
          accountCategory: 'Asset',
          description: tx.Description || `Payment for ${tx.Category}`,
          payeeOrParty: tx.VendorName || '',
          sourceModule: 'Expense Desk',
          debit: 0,
          credit: amt
        });
      }
    });

    // 3. Synthesize from Goods Received Notes (GRN)
    effectiveGrns.forEach((grn, idx) => {
      const vch = grn.GRNID || `GRN-${idx + 1}`;
      if (lines.some(l => l.vchNo === vch)) return;

      const txDate = parseCleanDate(grn.ReceivedDate || todayStr);
      const amt = Number(grn.TotalAmount) || 0;
      const isCashGrn = grn.PaymentMethod === 'Cash' || (grn as any).PaymentMode === 'Cash';

      // Dr Inventory (103001)
      lines.push({
        id: `GRN-DR-${grn.GRNID || idx}`,
        txDate,
        vchNo: vch,
        vchType: 'GRN',
        tlid: 103001,
        accountName: 'Pharmacy Stock Ledger',
        accountCategory: 'Asset',
        description: `Stock Received: PO ${grn.POID} (${grn.Items?.length || 0} items)`,
        payeeOrParty: grn.VendorName || '',
        sourceModule: 'Procurement & GRN',
        debit: amt,
        credit: 0
      });

      if (isCashGrn) {
        // Cr Cash-in-Hand (101001)
        lines.push({
          id: `GRN-CR-${grn.GRNID || idx}`,
          txDate,
          vchNo: vch,
          vchType: 'CPV',
          tlid: 101001,
          accountName: 'Cash-in-Hand (Morning Shift)',
          accountCategory: 'Asset',
          description: `Spot Cash Disbursed for GRN ${grn.GRNID} to ${grn.VendorName}`,
          payeeOrParty: grn.VendorName || '',
          sourceModule: 'Procurement & GRN',
          debit: 0,
          credit: amt
        });
      } else {
        // Cr Accounts Payable (201001)
        lines.push({
          id: `GRN-CR-${grn.GRNID || idx}`,
          txDate,
          vchNo: vch,
          vchType: 'GRN',
          tlid: 201001,
          accountName: `Accounts Payable: ${grn.VendorName}`,
          accountCategory: 'Liability',
          description: `Credit Bill Payable for GRN ${grn.GRNID}`,
          payeeOrParty: grn.VendorName || '',
          sourceModule: 'Procurement & GRN',
          debit: 0,
          credit: amt
        });
      }
    });

    // 4. Synthesize from Payrolls
    effectivePayrolls.forEach((pay, idx) => {
      const vch = pay.PayrollID || `PAY-${idx + 1}`;
      if (lines.some(l => l.vchNo === vch)) return;

      const txDate = parseCleanDate(pay.PaymentDate || `${pay.MonthYear}-01`);
      const amt = Number(pay.NetSalary) || 0;
      const isBank = pay.PaymentMethod?.toLowerCase().includes('bank');

      // Dr Salary Expense
      lines.push({
        id: `PAY-DR-${pay.PayrollID || idx}`,
        txDate,
        vchNo: vch,
        vchType: isBank ? 'BPV' : 'CPV',
        tlid: 501001,
        accountName: 'Staff & Medical Salaries Expense',
        accountCategory: 'Expense',
        description: `Monthly Salary: ${pay.EmployeeName} (${pay.MonthYear})`,
        payeeOrParty: pay.EmployeeName || '',
        sourceModule: 'Payroll & HR',
        debit: amt,
        credit: 0
      });
      // Cr Cash / Bank
      lines.push({
        id: `PAY-CR-${pay.PayrollID || idx}`,
        txDate,
        vchNo: vch,
        vchType: isBank ? 'BPV' : 'CPV',
        tlid: isBank ? 101004 : 101001,
        accountName: isBank ? 'Main Bank Current Account' : 'Cash-in-Hand (Morning Shift)',
        accountCategory: 'Asset',
        description: `Salary Outflow for ${pay.EmployeeName}`,
        payeeOrParty: pay.EmployeeName || '',
        sourceModule: 'Payroll & HR',
        debit: 0,
        credit: amt
      });
    });

    // 5. Synthesize from Expenses
    effectiveExpenses.forEach((exp, idx) => {
      const vch = exp.ExpenseID || `EXP-${idx + 1}`;
      if (lines.some(l => l.vchNo === vch)) return;

      const txDate = parseCleanDate(exp.ExpenseDate || todayStr);
      const amt = Number(exp.Amount) || 0;
      const isBank = exp.PaymentMethod?.toLowerCase().includes('bank');

      // Dr Expense
      lines.push({
        id: `EXP-DR-${exp.ExpenseID || idx}`,
        txDate,
        vchNo: vch,
        vchType: isBank ? 'BPV' : 'CPV',
        tlid: 502001,
        accountName: `Operating Expense (${exp.Category || 'General'})`,
        accountCategory: 'Expense',
        description: exp.Description || `Expense - ${exp.Category}`,
        payeeOrParty: '',
        sourceModule: 'Expense Desk',
        debit: amt,
        credit: 0
      });
      // Cr Cash / Bank
      lines.push({
        id: `EXP-CR-${exp.ExpenseID || idx}`,
        txDate,
        vchNo: vch,
        vchType: isBank ? 'BPV' : 'CPV',
        tlid: isBank ? 101004 : 101001,
        accountName: isBank ? 'Main Bank Current Account' : 'Cash-in-Hand (Morning Shift)',
        accountCategory: 'Asset',
        description: `Cash Payment for ${exp.Category}`,
        payeeOrParty: '',
        sourceModule: 'Expense Desk',
        debit: 0,
        credit: amt
      });
    });

    // Sort by Date ascending, then Voucher No
    lines.sort((a, b) => {
      if (a.txDate !== b.txDate) return a.txDate.localeCompare(b.txDate);
      return a.vchNo.localeCompare(b.vchNo);
    });

    return lines;
  }, [acLedger, effectiveTransactions, effectiveGrns, effectivePayrolls, effectiveExpenses, accountLookup, todayStr]);

  // Filtered Ledger Rows with Opening and Running Balance
  const filteredLedgerData = useMemo(() => {
    let list = rawLedgerLines;

    // Filter by Account
    if (ledgerAccountFilter !== 'all') {
      const targetTlid = Number(ledgerAccountFilter);
      list = list.filter(l => l.tlid === targetTlid);
    }

    // Filter by Voucher Type
    if (ledgerVchTypeFilter !== 'all') {
      list = list.filter(l => l.vchType === ledgerVchTypeFilter);
    }

    // Filter by Dr / Cr
    if (ledgerDrCrFilter === 'dr') {
      list = list.filter(l => l.debit > 0);
    } else if (ledgerDrCrFilter === 'cr') {
      list = list.filter(l => l.credit > 0);
    }

    // Calculate Opening Balance prior to startDate
    let openingDebit = 0;
    let openingCredit = 0;
    list.forEach(l => {
      if (l.txDate < startDate) {
        openingDebit += l.debit;
        openingCredit += l.credit;
      }
    });
    const openingBalance = openingDebit - openingCredit;

    // Filter by Selected Date Range / Fiscal Period
    const periodList = list.filter(l => isWithinDateRange(l.txDate));

    // Filter by Search Query
    const searchedList = periodList.filter(l => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        l.vchNo.toLowerCase().includes(q) ||
        l.accountName.toLowerCase().includes(q) ||
        String(l.tlid).includes(q) ||
        l.description.toLowerCase().includes(q) ||
        l.payeeOrParty.toLowerCase().includes(q) ||
        String(l.debit).includes(q) ||
        String(l.credit).includes(q) ||
        l.vchType.toLowerCase().includes(q)
      );
    });

    // Compute running balance progressively
    let running = openingBalance;
    const rowsWithBalance = searchedList.map(item => {
      running += (item.debit - item.credit);
      return {
        ...item,
        runningBalance: running
      };
    });

    const totalDebits = rowsWithBalance.reduce((sum, r) => sum + r.debit, 0);
    const totalCredits = rowsWithBalance.reduce((sum, r) => sum + r.credit, 0);
    const netPeriodMovement = totalDebits - totalCredits;
    const uniqueVouchers = new Set(rowsWithBalance.map(r => r.vchNo)).size;
    const uniqueAccounts = new Set(rowsWithBalance.map(r => r.tlid)).size;
    const isBalanced = Math.abs(totalDebits - totalCredits) < 0.01;
    const balanceDifference = Math.abs(totalDebits - totalCredits);

    return {
      rows: rowsWithBalance,
      openingBalance,
      openingDebit,
      openingCredit,
      closingBalance: running,
      totalDebits,
      totalCredits,
      netPeriodMovement,
      postingsCount: rowsWithBalance.length,
      uniqueVouchersCount: uniqueVouchers,
      activeAccountsCount: uniqueAccounts,
      isBalanced,
      balanceDifference
    };
  }, [rawLedgerLines, ledgerAccountFilter, ledgerVchTypeFilter, ledgerDrCrFilter, startDate, endDate, datePreset, searchQuery]);

  // Available Item Categories (Fully synchronized with Stock Manager & Pharmacy POS)
  const categoriesList = useMemo(() => {
    const set = new Set<string>();

    // 1. Fetch custom categories configured in Stock Manager (localStorage)
    try {
      const saved = localStorage.getItem('pharmacy_custom_categories');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          parsed.forEach((cat: string) => {
            if (cat && typeof cat === 'string' && cat.trim()) set.add(cat.trim());
          });
        }
      }
    } catch (e) {
      // ignore
    }

    // 2. Fetch categories from all existing inventory medicines
    effectiveItems.forEach(i => {
      const cat = getItemCategory(i);
      if (cat && cat.trim()) set.add(cat.trim());
    });

    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [effectiveItems]);

  // CSV Export Handler
  const handleExportCSV = () => {
    let filename = `ERP_Report_${activeReport}_${startDate}_to_${endDate}.csv`;
    let headers: string[] = [];
    let rows: (string | number)[][] = [];

    if (activeReport === 'pending_payments') {
      headers = ['Vendor ID', 'Vendor Name', 'Contact Person', 'Phone', 'Total Bills', 'Total Paid', 'Pending Balance (Rs.)'];
      rows = pendingPaymentsData.map(v => [
        v.VendorID, v.VendorName, v.ContactPerson, v.Phone, v.totalGrnBills, v.totalPaid, v.pendingBalance
      ]);
    } else if (activeReport === 'payroll_disbursement') {
      headers = ['Payroll ID', 'Employee Name', 'Month / Year', 'Basic Salary', 'Allowances', 'Deductions', 'Net Salary', 'Payment Date', 'Payment Method'];
      rows = payrollData.map(p => [
        p.PayrollID, p.EmployeeName, p.MonthYear, p.BasicSalary, p.Allowances, p.Deductions, p.NetSalary, p.PaymentDate || 'N/A', p.PaymentMethod || 'Cash'
      ]);
    } else if (activeReport === 'expense_analysis') {
      headers = ['Expense ID', 'Category', 'Description', 'Amount (Rs.)', 'Expense Date', 'Payment Method', 'Receipt Ref'];
      rows = expenseData.map(e => [
        e.ExpenseID, e.Category, e.Description, e.Amount, e.ExpenseDate, e.PaymentMethod, e.ReceiptRef || 'N/A'
      ]);
    } else if (activeReport === 'purchase_orders') {
      headers = ['PO ID', 'Vendor Name', 'Order Date', 'Delivery Date', 'Total Amount', 'Status', 'GRN ID'];
      rows = poData.map(p => [
        p.POID, p.VendorName, p.OrderDate, p.ExpectedDeliveryDate, p.TotalAmount, p.Status, p.linkedGrn?.GRNID || 'Pending GRN'
      ]);
    } else if (activeReport === 'current_stock') {
      headers = ['Item ID', 'Medicine / Item Name', 'Category', 'Current Stock', 'Purchase Price', 'Retail Price', 'Total Stock Valuation (Rs.)'];
      rows = currentStockData.map(i => [
        i.ItemID || i._id,
        i.ItemName || i.name,
        getItemCategory(i),
        getItemStock(i),
        Number(i.PurchasePrice ?? i.purchasePrice ?? i.Price ?? i.price ?? 0),
        Number(i.Price ?? i.price ?? 0),
        getItemStock(i) * Number(i.PurchasePrice ?? i.purchasePrice ?? i.Price ?? i.price ?? 0)
      ]);
      rows.push([
        'TOTAL',
        `Grand Total (${currentStockSummary.totalItems} Items)`,
        '—',
        currentStockSummary.totalStockUnits,
        currentStockSummary.totalPurchasePriceSum,
        currentStockSummary.totalRetailPriceSum,
        currentStockSummary.totalPurchaseValuation
      ]);
    } else if (activeReport === 'minimum_stock') {
      headers = ['Item ID', 'Medicine Name', 'Category', 'Current Stock', 'Min Threshold', 'Deficit'];
      rows = minimumStockData.map(i => [
        i.ItemID || i._id,
        i.ItemName || i.name,
        getItemCategory(i),
        i.CStock || 0,
        (i.MinStock !== undefined && i.MinStock !== null) ? i.MinStock : 1,
        Math.max(0, ((i.MinStock !== undefined && i.MinStock !== null) ? i.MinStock : 1) - (i.CStock || 0))
      ]);
    } else if (activeReport === 'required_stock') {
      headers = ['Item ID', 'Medicine Name', 'Category', 'Current Stock', 'Min Stock', 'Target Reorder Qty', 'Required Qty to Order', 'Unit Cost (Rs.)', 'Est Total Cost (Rs.)'];
      rows = requiredStockData.map(i => [
        i.ItemID || i._id,
        i.ItemName || i.name,
        getItemCategory(i),
        i.cStock,
        i.minStock,
        i.reorderTarget,
        i.requiredQty,
        i.unitCost,
        i.estCost
      ]);
    } else if (activeReport === 'pnl_summary') {
      headers = ['Category / Stream', 'Details', 'Amount (Rs.)'];
      rows = [
        ['REVENUE & INFLOWS', 'OPD Patient Consultation Fees', pnlSummaryData.opdConsultationFees || 0],
        ['REVENUE & INFLOWS', 'OPD Registration / Card Fees', pnlSummaryData.opdCardFees || 0],
        ['REVENUE & INFLOWS', 'Clinical Medicine Dispensing', pnlSummaryData.opdDispensingFees || 0],
        ['REVENUE & INFLOWS', 'Standalone Appointment Fees', pnlSummaryData.standaloneApptFees || 0],
        ['REVENUE & INFLOWS', 'Subtotal Clinical OPD Inflows', pnlSummaryData.totalOpdIncome || 0],
        ['REVENUE & INFLOWS', 'Gross POS Pharmacy Sales', pnlSummaryData.grossPosSales || pnlSummaryData.posIncome || 0],
        ['REVENUE & INFLOWS', 'Less: POS Sales Returns / Refunds', -(pnlSummaryData.totalSalesReturns || 0)],
        ['REVENUE & INFLOWS', 'Net POS Pharmacy Realized Revenue', pnlSummaryData.netPosIncome || 0],
        ['REVENUE & INFLOWS', 'Other Direct Income Receipts', pnlSummaryData.otherIncome || 0],
        ['REVENUE & INFLOWS', 'TOTAL GROSS INFLOWS', pnlSummaryData.totalIncome || 0],
        ['EXPENSES & OUTFLOWS', 'Vendor Payments (Inventory Purchases)', pnlSummaryData.vendorOutflows || 0],
        ['EXPENSES & OUTFLOWS', 'Staff Salaries & Payroll Disbursements', pnlSummaryData.salaryOutflows || 0],
        ['EXPENSES & OUTFLOWS', 'Operational & Clinic Expenses', pnlSummaryData.totalOperatingExpenses || 0],
        ['EXPENSES & OUTFLOWS', 'TOTAL GROSS OUTFLOWS', pnlSummaryData.totalExpenses || 0],
        ['ANALYSIS & METRICS', 'Est. Cost of Goods Sold (COGS)', pnlSummaryData.pharmacyCogs || 0],
        ['ANALYSIS & METRICS', 'Pharmacy Gross Margin (%)', (pnlSummaryData.pharmacyMarginPct || 0).toFixed(1) + '%'],
        ['ANALYSIS & METRICS', 'Operating Outflow Ratio (%)', (pnlSummaryData.expenseRatio || 0).toFixed(1) + '%'],
        ['ANALYSIS & METRICS', 'Net Profit Margin (%)', (pnlSummaryData.netMarginPct || 0).toFixed(1) + '%'],
        ['NET SUMMARY', 'NET OPERATING PROFIT / (LOSS)', pnlSummaryData.netProfit || 0]
      ];
    } else if (activeReport === 'shift_collection_summary') {
      headers = [
        'Date',
        'Morning Clinic Collection (Rs.)',
        'Morning Pharmacy Store Sales (Rs.)',
        'Morning Total (Rs.)',
        'Evening Clinic Collection (Rs.)',
        'Evening Pharmacy Store Sales (Rs.)',
        'Evening Total (Rs.)',
        'Daily Grand Total (Rs.)'
      ];
      rows = shiftCollectionData.dailyRows.map(r => [
        r.date,
        r.morningClinic,
        r.morningStore,
        r.morningTotal,
        r.eveningClinic,
        r.eveningStore,
        r.eveningTotal,
        r.dailyTotal
      ]);
      rows.push([
        'GRAND TOTALS',
        shiftCollectionData.totalMorningClinic,
        shiftCollectionData.totalMorningStore,
        shiftCollectionData.totalMorning,
        shiftCollectionData.totalEveningClinic,
        shiftCollectionData.totalEveningStore,
        shiftCollectionData.totalEvening,
        shiftCollectionData.grandTotal
      ]);
    } else if (activeReport === 'foc_cases_summary') {
      headers = [
        'Visit ID',
        'Date',
        'Patient ID',
        'Patient Name',
        'Phone',
        'Diagnosis / Symptoms',
        'Waived OPD Fee (Rs.)',
        'Waived Clinical Meds (Rs.)',
        'Waived File/Card (Rs.)',
        'Total Waived Value (Rs.)',
        'FOC Category / Reason'
      ];
      rows = focReportData.rows.map(r => [
        r.visitId,
        r.date,
        r.patientId,
        r.patientName,
        r.phone,
        r.symptoms,
        r.opdWaived,
        r.clinWaived,
        r.fileCardWaived,
        r.totalWaived,
        r.reason
      ]);
      rows.push([
        'TOTALS',
        '',
        '',
        `${focReportData.totalCount} Visits`,
        '',
        '',
        focReportData.totalOpdWaived,
        focReportData.totalClinWaived,
        focReportData.totalFileCardWaived,
        focReportData.grandTotalWaived,
        ''
      ]);
    } else if (activeReport === 'store_medicine_report') {
      headers = [
        'Item ID',
        'Medicine / Item Name',
        'Category',
        'Company / Brand',
        'Qty Sold',
        'Unit Purchase Price (Rs.)',
        'Unit Retail / Sale Price (Rs.)',
        'Total Purchase Cost / COGS (Rs.)',
        'Gross Sales (Rs.)',
        'Discount Allowed (Rs.)',
        'Net Revenue (Rs.)',
        'Gross Profit (Rs.)',
        'Margin (%)'
      ];
      rows = filteredStoreMedicineRows.map(r => [
        r.itemId,
        r.itemName,
        r.category,
        r.company,
        r.qtySold,
        r.unitPurchasePrice,
        r.unitSalePrice,
        r.totalCogs,
        r.totalGrossSales,
        r.totalDiscount,
        r.totalNetSales,
        r.grossProfit,
        r.marginPct.toFixed(1) + '%'
      ]);
      rows.push([
        'TOTALS',
        '',
        '',
        '',
        filteredStoreMedicineSummary.totalQtySold,
        '',
        '',
        filteredStoreMedicineSummary.totalCogs,
        filteredStoreMedicineSummary.totalGrossSales,
        filteredStoreMedicineSummary.totalDiscount,
        filteredStoreMedicineSummary.totalNetSales,
        filteredStoreMedicineSummary.totalGrossProfit,
        filteredStoreMedicineSummary.overallMarginPct.toFixed(1) + '%'
      ]);
    } else if (activeReport === 'ledger_postings') {
      headers = [
        'Posting ID',
        'Date',
        'Voucher No',
        'Type',
        'Account Code (TLID)',
        'Account Title',
        'Account Category',
        'Party / Payee / Reference',
        'Narration / Description',
        'Debit Dr (Rs.)',
        'Credit Cr (Rs.)',
        'Running Balance (Rs.)',
        'Source Module'
      ];
      rows = filteredLedgerData.rows.map(r => [
        r.id,
        r.txDate,
        r.vchNo,
        r.vchType,
        r.tlid,
        r.accountName,
        r.accountCategory,
        r.payeeOrParty || 'N/A',
        r.description,
        r.debit,
        r.credit,
        r.runningBalance ?? 0,
        r.sourceModule
      ]);
      rows.push([
        'TOTALS',
        `Period: ${startDate} to ${endDate}`,
        `${filteredLedgerData.uniqueVouchersCount} Vouchers`,
        '',
        '',
        `${filteredLedgerData.activeAccountsCount} Accounts`,
        filteredLedgerData.isBalanced ? 'BALANCED' : 'UNBALANCED',
        '',
        `Total Movement: Rs. ${filteredLedgerData.netPeriodMovement.toLocaleString()}`,
        filteredLedgerData.totalDebits,
        filteredLedgerData.totalCredits,
        filteredLedgerData.closingBalance,
        ''
      ]);
    }

    const cName = clinicSettings?.ClinicName || 'Punjab Homeopathic Clinic & Pharmacy';
    const cWeb = clinicSettings?.Website || 'https://punjabhomeopathic.pk';
    const cPhone = clinicSettings?.PhoneMobile || '+92-311-4000608';
    const cAddr = clinicSettings?.ClinicAddress || '10 Shalimar Road, Garhi Shahu, Lahore';

    const clinicHeaderMeta = [
      `"${cName}"`,
      `"Website: ${cWeb} | Helpline / Mobile: ${cPhone}"`,
      `"Address: ${cAddr}"`,
      `"Report: ${activeReport.toUpperCase()} | Audit Period: ${startDate} to ${endDate} | Generated: ${new Date().toLocaleString('en-GB')}"`,
      ''
    ].join('\n');

    const csvContent = 'data:text/csv;charset=utf-8,' +
      clinicHeaderMeta + '\n' +
      [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print Handler
  const handlePrintReport = () => {
    const printWin = window.open('', '_blank');
    if (!printWin) return alert('Pop-up blocked! Please allow popups to print reports.');

    let savedSettings: any = null;
    try {
      const saved = localStorage.getItem('phc_clinic_settings');
      if (saved) savedSettings = JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }

    const clinicName = savedSettings?.ClinicName || (clinicSettings as any)?.ClinicName || 'PUNJAB HOMEOPATHIC CLINIC';
    const logoSrc = savedSettings?.ClinicLogoImage || (clinicSettings as any)?.ClinicLogoImage || '/nhc_logo.svg';
    const clinicAddress = savedSettings?.ClinicAddress || (clinicSettings as any)?.ClinicAddress || '10 Shalimar Road, Garhi Shahu, Lahore';
    const clinicPhone = savedSettings?.PhoneMobile || (clinicSettings as any)?.PhoneMobile || '+92-311-4000608';
    const clinicWebsite = savedSettings?.Website || (clinicSettings as any)?.Website || 'https://punjabhomeopathic.pk';

    const reportTitles: Record<ReportType, string> = {
      pending_payments: 'Pending Vendor Payments & Payable Balance Report',
      payroll_disbursement: 'Salary & Payroll Disbursement Audit Report',
      expense_analysis: 'Operational Expenses Analysis & Categorization Report',
      purchase_orders: 'Purchase Orders & Inventory Procurement Audit',
      current_stock: 'Current Stock Inventory & Stock Valuation Audit',
      minimum_stock: 'Low Stock & Minimum Inventory Threshold Alert Report',
      required_stock: 'Required Stock Requisition & Procurement Calculation Report',
      pnl_summary: 'Executive Profit & Loss Financial Summary Statement',
      shift_collection_summary: 'Shift-Wise Collection & Revenue Summary Statement',
      foc_cases_summary: 'Free of Charge (FOC) Cases & Welfare Waiver Report',
      store_medicine_report: 'Store Medicine Sales, Cost Price & Profit Margin Analysis Report',
      ledger_postings: 'General Ledger & Double-Entry Postings Audit Report'
    };

    const recordCountText =
      activeReport === 'pending_payments' ? `${pendingPaymentsData.length} Vendors` :
      activeReport === 'payroll_disbursement' ? `${payrollData.length} Disbursed Records` :
      activeReport === 'expense_analysis' ? `${expenseData.length} Expense Records` :
      activeReport === 'current_stock' ? `${currentStockData.length} Stock Items` :
      activeReport === 'minimum_stock' ? `${minimumStockData.length} Alert Items` :
      activeReport === 'required_stock' ? `${requiredStockData.length} Requisition Items` :
      activeReport === 'pnl_summary' ? 'Executive Financial Summary' :
      activeReport === 'foc_cases_summary' ? `${focReportData.totalCount} FOC Patients` :
      activeReport === 'shift_collection_summary' ? `${shiftCollectionData.dailyRows.length} Daily Records` :
      activeReport === 'store_medicine_report' ? `${filteredStoreMedicineRows.length} Store Medicine Lines` :
      activeReport === 'ledger_postings' ? `${filteredLedgerData.rows.length} Ledger Postings (${filteredLedgerData.uniqueVouchersCount} Vouchers)` : `${poData.length} Purchase Orders`;

    let tableHtml = '';

    if (activeReport === 'pending_payments') {
      tableHtml = `
        <table class="report-table">
          <thead>
            <tr>
              <th>Vendor ID</th>
              <th>Vendor Name</th>
              <th>Contact Person</th>
              <th>Phone</th>
              <th style="text-align: right">Total Bills</th>
              <th style="text-align: right">Total Paid</th>
              <th style="text-align: right">Pending Payable Balance</th>
            </tr>
          </thead>
          <tbody>
            ${pendingPaymentsData.map(v => `
              <tr>
                <td><b>${v.VendorID}</b></td>
                <td><b>${v.VendorName}</b></td>
                <td>${v.ContactPerson}</td>
                <td>${v.Phone}</td>
                <td style="text-align: right">Rs. ${v.totalGrnBills.toLocaleString()}</td>
                <td style="text-align: right; color: #047857; font-weight: 700;">Rs. ${v.totalPaid.toLocaleString()}</td>
                <td style="text-align: right; font-weight: 800; color: ${v.pendingBalance > 0 ? '#b91c1c' : '#15803d'};">
                  Rs. ${v.pendingBalance.toLocaleString()}
                </td>
              </tr>
            `).join('')}
          </tbody>
          <tfoot>
            <tr style="background: #f1f5f9; font-weight: bold;">
              <td colspan="6" style="text-align: right">TOTAL OUTSTANDING PAYABLE BALANCE:</td>
              <td style="text-align: right; color: #b91c1c; font-size: 13px; font-weight: 900;">Rs. ${pendingPaymentsSummary.totalOwed.toLocaleString()}</td>
            </tr>
          </tfoot>
        </table>
      `;
    } else if (activeReport === 'payroll_disbursement') {
      tableHtml = `
        <table class="report-table">
          <thead>
            <tr>
              <th>Payroll ID</th>
              <th>Employee Name</th>
              <th>Period</th>
              <th style="text-align: right">Basic</th>
              <th style="text-align: right">Allowances</th>
              <th style="text-align: right">Deductions</th>
              <th style="text-align: right">Net Salary</th>
              <th style="text-align: center">Method</th>
              <th style="text-align: center">Payment Date</th>
            </tr>
          </thead>
          <tbody>
            ${payrollData.map(p => `
              <tr>
                <td><b>${p.PayrollID}</b></td>
                <td><b>${p.EmployeeName}</b></td>
                <td>${p.MonthYear}</td>
                <td style="text-align: right">Rs. ${p.BasicSalary.toLocaleString()}</td>
                <td style="text-align: right; color: #047857;">+ Rs. ${p.Allowances.toLocaleString()}</td>
                <td style="text-align: right; color: #b91c1c;">- Rs. ${p.Deductions.toLocaleString()}</td>
                <td style="text-align: right; font-weight: 800; color: #0f172a;">Rs. ${p.NetSalary.toLocaleString()}</td>
                <td style="text-align: center">${p.PaymentMethod || 'Cash'}</td>
                <td style="text-align: center">${p.PaymentDate || 'N/A'}</td>
              </tr>
            `).join('')}
          </tbody>
          <tfoot>
            <tr style="background: #f1f5f9; font-weight: bold;">
              <td colspan="6" style="text-align: right">TOTAL SALARIES DISBURSED:</td>
              <td style="text-align: right; color: #4338ca; font-size: 13px; font-weight: 900;">Rs. ${payrollSummary.totalDisbursed.toLocaleString()}</td>
              <td colspan="2"></td>
            </tr>
          </tfoot>
        </table>
      `;
    } else if (activeReport === 'expense_analysis') {
      tableHtml = `
        <table class="report-table">
          <thead>
            <tr>
              <th>Expense ID</th>
              <th>Category</th>
              <th>Description</th>
              <th style="text-align: center">Date</th>
              <th style="text-align: center">Payment Method</th>
              <th style="text-align: right">Amount (Rs.)</th>
            </tr>
          </thead>
          <tbody>
            ${expenseData.map(e => `
              <tr>
                <td><b>${e.ExpenseID}</b></td>
                <td><span class="badge">${e.Category}</span></td>
                <td>${e.Description}</td>
                <td style="text-align: center">${e.ExpenseDate}</td>
                <td style="text-align: center">${e.PaymentMethod}</td>
                <td style="text-align: right; font-weight: 800; color: #b91c1c;">Rs. ${e.Amount.toLocaleString()}</td>
              </tr>
            `).join('')}
          </tbody>
          <tfoot>
            <tr style="background: #f1f5f9; font-weight: bold;">
              <td colspan="5" style="text-align: right">TOTAL OPERATIONAL EXPENSES:</td>
              <td style="text-align: right; color: #b91c1c; font-size: 13px; font-weight: 900;">Rs. ${expenseSummary.totalExpense.toLocaleString()}</td>
            </tr>
          </tfoot>
        </table>
      `;
    } else if (activeReport === 'current_stock') {
      tableHtml = `
        <table class="report-table">
          <thead>
            <tr>
              <th>Item ID</th>
              <th>Medicine / Item Name</th>
              <th>Category</th>
              <th style="text-align: center">Current Stock</th>
              <th style="text-align: right">Purchase Unit Price</th>
              <th style="text-align: right">Retail Price</th>
              <th style="text-align: right">Stock Valuation (Rs.)</th>
            </tr>
          </thead>
          <tbody>
            ${currentStockData.map(i => {
              const cStock = Number(i.CStock) || 0;
              const pPrice = Number(i.PurchasePrice) || Number(i.Price) || 0;
              const val = cStock * pPrice;
              return `
                <tr>
                  <td><b>${i.ItemID || i._id}</b></td>
                  <td><b>${i.ItemName || i.name}</b></td>
                  <td>${i.Category || i.category || 'General'}</td>
                  <td style="text-align: center; font-weight: 800;">${cStock} ${i.Unit || 'Units'}</td>
                  <td style="text-align: right">Rs. ${pPrice.toLocaleString()}</td>
                  <td style="text-align: right">Rs. ${(Number(i.Price) || 0).toLocaleString()}</td>
                  <td style="text-align: right; font-weight: 800; color: #0369a1;">Rs. ${val.toLocaleString()}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
          <tfoot>
            <tr style="background: #f1f5f9; font-weight: 900; border-top: 2px solid #334155;">
              <td colspan="3" style="text-align: right; font-weight: 900; font-size: 11.5px; text-transform: uppercase;">
                GRAND TOTAL (${currentStockSummary.totalItems} MEDICINES):
              </td>
              <td style="text-align: center; font-size: 12px; font-weight: 900; color: #4338ca;">
                ${currentStockSummary.totalStockUnits.toLocaleString()} Units
              </td>
              <td style="text-align: right; font-size: 12px; font-weight: 900; color: #0f172a;">
                Rs. ${currentStockSummary.totalPurchasePriceSum.toLocaleString()}
              </td>
              <td style="text-align: right; font-size: 12px; font-weight: 900; color: #047857;">
                Rs. ${currentStockSummary.totalRetailPriceSum.toLocaleString()}
              </td>
              <td style="text-align: right; color: #0369a1; font-size: 13px; font-weight: 900; background: #e0f2fe;">
                Rs. ${currentStockSummary.totalPurchaseValuation.toLocaleString()}
              </td>
            </tr>
          </tfoot>
        </table>
      `;
    } else if (activeReport === 'minimum_stock') {
      tableHtml = `
        <table class="report-table">
          <thead>
            <tr>
              <th>Item ID</th>
              <th>Medicine Name</th>
              <th>Category</th>
              <th style="text-align: center">Current Stock</th>
              <th style="text-align: center">Min Threshold</th>
              <th style="text-align: center">Deficit Units</th>
              <th style="text-align: center">Stock Status</th>
            </tr>
          </thead>
          <tbody>
            ${minimumStockData.map(i => {
              const cStock = Number(i.CStock) || 0;
              const minStock = (i.MinStock !== undefined && i.MinStock !== null) ? Number(i.MinStock) : 1;
              const deficit = Math.max(0, minStock - cStock);
              const isOut = cStock === 0;
              return `
                <tr>
                  <td><b>${i.ItemID || i._id}</b></td>
                  <td><b>${i.ItemName || i.name}</b></td>
                  <td>${i.Category || i.category || 'General'}</td>
                  <td style="text-align: center; font-weight: 800; color: ${isOut ? '#b91c1c' : '#d97706'};">${cStock}</td>
                  <td style="text-align: center">${minStock}</td>
                  <td style="text-align: center; font-weight: 800; color: #b91c1c;">+ ${deficit}</td>
                  <td style="text-align: center">
                    <span class="badge ${isOut ? 'badge-red' : 'badge-amber'}">
                      ${isOut ? 'OUT OF STOCK' : 'LOW STOCK ALERT'}
                    </span>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      `;
    } else if (activeReport === 'required_stock') {
      tableHtml = `
        <table class="report-table">
          <thead>
            <tr>
              <th>Item ID</th>
              <th>Medicine Name</th>
              <th>Category</th>
              <th style="text-align: center">Current Stock</th>
              <th style="text-align: center">Target Stock</th>
              <th style="text-align: center">Required Requisition Qty</th>
              <th style="text-align: right">Est Unit Cost</th>
              <th style="text-align: right">Total Est Capital (Rs.)</th>
            </tr>
          </thead>
          <tbody>
            ${requiredStockData.map(i => `
              <tr>
                <td><b>${i.ItemID || i._id}</b></td>
                <td><b>${i.ItemName || i.name}</b></td>
                <td>${i.Category || i.category || 'General'}</td>
                <td style="text-align: center">${i.cStock}</td>
                <td style="text-align: center">${i.reorderTarget}</td>
                <td style="text-align: center; font-weight: 900; color: #4338ca; font-size: 12px;">${i.requiredQty}</td>
                <td style="text-align: right">Rs. ${i.unitCost.toLocaleString()}</td>
                <td style="text-align: right; font-weight: 800; color: #4338ca;">Rs. ${i.estCost.toLocaleString()}</td>
              </tr>
            `).join('')}
          </tbody>
          <tfoot>
            <tr style="background: #f1f5f9; font-weight: bold;">
              <td colspan="5" style="text-align: right">TOTAL REQUISITION CAPITAL NEEDED:</td>
              <td style="text-align: center; font-size: 12px; color: #4338ca;">${requiredStockSummary.totalUnitsRequired.toLocaleString()} Units</td>
              <td></td>
              <td style="text-align: right; color: #4338ca; font-size: 13px; font-weight: 900;">Rs. ${requiredStockSummary.totalEstCapitalNeeded.toLocaleString()}</td>
            </tr>
          </tfoot>
        </table>
      `;
    } else if (activeReport === 'pnl_summary') {
      tableHtml = `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 10px;">
          <div>
            <h3 style="color: #15803d; border-bottom: 2px solid #15803d; padding-bottom: 4px; margin-bottom: 8px; font-size: 12px; text-transform: uppercase;">REVENUE & INFLOWS</h3>
            <table class="report-table">
              <tr><td>OPD Patient Consultation Fees</td><td style="text-align: right; font-weight: bold;">Rs. ${(pnlSummaryData.opdConsultationFees || 0).toLocaleString()}</td></tr>
              <tr><td>OPD Registration / Card Fees</td><td style="text-align: right; font-weight: bold;">Rs. ${(pnlSummaryData.opdCardFees || 0).toLocaleString()}</td></tr>
              <tr><td>Clinical Medicine Dispensing</td><td style="text-align: right; font-weight: bold;">Rs. ${(pnlSummaryData.opdDispensingFees || 0).toLocaleString()}</td></tr>
              ${pnlSummaryData.standaloneApptFees > 0 ? `<tr><td>Standalone Appointment Fees</td><td style="text-align: right; font-weight: bold;">Rs. ${pnlSummaryData.standaloneApptFees.toLocaleString()}</td></tr>` : ''}
              <tr style="background: #f0fdf4; font-weight: 700;">
                <td style="color: #166534; font-size: 11px;">Subtotal OPD Inflows</td>
                <td style="text-align: right; color: #166534; font-size: 11px; font-weight: bold;">Rs. ${pnlSummaryData.totalOpdIncome.toLocaleString()}</td>
              </tr>
              <tr><td>Gross POS Pharmacy Counter Sales</td><td style="text-align: right; font-weight: bold;">Rs. ${(pnlSummaryData.grossPosSales || pnlSummaryData.posIncome).toLocaleString()}</td></tr>
              ${pnlSummaryData.totalSalesReturns > 0 ? `<tr><td style="color: #b91c1c;">Less: Pharmacy Sales Returns</td><td style="text-align: right; font-weight: bold; color: #b91c1c;">- Rs. ${pnlSummaryData.totalSalesReturns.toLocaleString()}</td></tr>` : ''}
              <tr style="background: #f0fdf4; font-weight: 700;">
                <td style="color: #166534; font-size: 11px;">Net Pharmacy Realized Sales</td>
                <td style="text-align: right; color: #166534; font-size: 11px; font-weight: bold;">Rs. ${pnlSummaryData.netPosIncome.toLocaleString()}</td>
              </tr>
              <tr><td>Other Direct Inflows & Income</td><td style="text-align: right; font-weight: bold;">Rs. ${pnlSummaryData.otherIncome.toLocaleString()}</td></tr>
              <tr style="background: #dcfce7; font-weight: 900; border-top: 2px solid #16a34a;">
                <td style="color: #15803d; font-size: 12px;">TOTAL GROSS INFLOWS</td>
                <td style="text-align: right; color: #15803d; font-size: 13px;">Rs. ${pnlSummaryData.totalIncome.toLocaleString()}</td>
              </tr>
            </table>
          </div>
          <div>
            <h3 style="color: #b91c1c; border-bottom: 2px solid #b91c1c; padding-bottom: 4px; margin-bottom: 8px; font-size: 12px; text-transform: uppercase;">EXPENSES & OUTFLOWS</h3>
            <table class="report-table">
              <tr><td>Vendor Payments (Stock & Purchases)</td><td style="text-align: right; font-weight: bold;">Rs. ${pnlSummaryData.vendorOutflows.toLocaleString()}</td></tr>
              <tr><td>Staff Salaries & Payroll Disbursements</td><td style="text-align: right; font-weight: bold;">Rs. ${pnlSummaryData.salaryOutflows.toLocaleString()}</td></tr>
              <tr><td>Operational, Clinic & Building Expenses</td><td style="text-align: right; font-weight: bold;">Rs. ${pnlSummaryData.totalOperatingExpenses.toLocaleString()}</td></tr>
              <tr style="background: #fee2e2; font-weight: 900; border-top: 2px solid #dc2626;">
                <td style="color: #b91c1c; font-size: 12px;">TOTAL GROSS OUTFLOWS</td>
                <td style="text-align: right; color: #b91c1c; font-size: 13px;">Rs. ${pnlSummaryData.totalExpenses.toLocaleString()}</td>
              </tr>
            </table>

            <div style="margin-top: 12px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 8px 10px; font-size: 11px;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                <span style="color: #64748b;">Est. Cost of Goods Sold (COGS):</span>
                <span style="font-weight: bold; color: #334155;">Rs. ${(pnlSummaryData.pharmacyCogs || 0).toLocaleString()}</span>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span style="color: #64748b;">Pharmacy Gross Profit Margin:</span>
                <span style="font-weight: bold; color: #16a34a;">${(pnlSummaryData.pharmacyMarginPct || 0).toFixed(1)}%</span>
              </div>
            </div>
          </div>
        </div>
        <div style="margin-top: 15px; background: #f8fafc; border: 2px dashed #64748b; padding: 12px; text-align: center; border-radius: 8px;">
          <div style="font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">NET OPERATING FINANCIAL RESULT FOR PERIOD</div>
          <div style="font-size: 22px; font-weight: 900; color: ${pnlSummaryData.netProfit >= 0 ? '#15803d' : '#b91c1c'}; margin-top: 4px;">
            ${pnlSummaryData.netProfit >= 0 ? 'NET PROFIT: Rs. ' + pnlSummaryData.netProfit.toLocaleString() : 'NET LOSS: - Rs. ' + Math.abs(pnlSummaryData.netProfit).toLocaleString()}
          </div>
          <div style="font-size: 11px; color: #64748b; margin-top: 2px;">
            Net Profit Margin: ${pnlSummaryData.netMarginPct.toFixed(1)}% | Operating Outflow Ratio: ${pnlSummaryData.expenseRatio.toFixed(1)}%
          </div>
        </div>
      `;
    } else if (activeReport === 'shift_collection_summary') {
      tableHtml = `
        <table class="report-table">
          <thead>
            <tr>
              <th rowspan="2" style="vertical-align: middle;">Date</th>
              <th colspan="3" style="text-align: center; background: #eff6ff;">Morning Shift</th>
              <th colspan="3" style="text-align: center; background: #fef3c7;">Evening Shift</th>
              <th rowspan="2" style="vertical-align: middle; text-align: right;">Daily Total</th>
            </tr>
            <tr>
              <th style="text-align: right; background: #eff6ff;">Clinic</th>
              <th style="text-align: right; background: #eff6ff;">Store Sales</th>
              <th style="text-align: right; background: #dbeafe;">Total</th>
              <th style="text-align: right; background: #fef3c7;">Clinic</th>
              <th style="text-align: right; background: #fef3c7;">Store Sales</th>
              <th style="text-align: right; background: #fde68a;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${shiftCollectionData.dailyRows.map(r => `
              <tr>
                <td><b>${r.date}</b></td>
                <td style="text-align: right;">Rs. ${r.morningClinic.toLocaleString()}</td>
                <td style="text-align: right;">Rs. ${r.morningStore.toLocaleString()}</td>
                <td style="text-align: right; font-weight: bold; background: #f8fafc;">Rs. ${r.morningTotal.toLocaleString()}</td>
                <td style="text-align: right;">Rs. ${r.eveningClinic.toLocaleString()}</td>
                <td style="text-align: right;">Rs. ${r.eveningStore.toLocaleString()}</td>
                <td style="text-align: right; font-weight: bold; background: #f8fafc;">Rs. ${r.eveningTotal.toLocaleString()}</td>
                <td style="text-align: right; font-weight: 900; color: #047857;">Rs. ${r.dailyTotal.toLocaleString()}</td>
              </tr>
            `).join('')}
          </tbody>
          <tfoot>
            <tr style="background: #0f172a; color: white; font-weight: bold;">
              <td>GRAND TOTALS</td>
              <td style="text-align: right;">Rs. ${shiftCollectionData.totalMorningClinic.toLocaleString()}</td>
              <td style="text-align: right;">Rs. ${shiftCollectionData.totalMorningStore.toLocaleString()}</td>
              <td style="text-align: right; color: #93c5fd;">Rs. ${shiftCollectionData.totalMorning.toLocaleString()}</td>
              <td style="text-align: right;">Rs. ${shiftCollectionData.totalEveningClinic.toLocaleString()}</td>
              <td style="text-align: right;">Rs. ${shiftCollectionData.totalEveningStore.toLocaleString()}</td>
              <td style="text-align: right; color: #fde047;">Rs. ${shiftCollectionData.totalEvening.toLocaleString()}</td>
              <td style="text-align: right; font-size: 13px; color: #34d399;">Rs. ${shiftCollectionData.grandTotal.toLocaleString()}</td>
            </tr>
          </tfoot>
        </table>
      `;
    } else if (activeReport === 'foc_cases_summary') {
      tableHtml = `
        <table class="report-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Patient ID</th>
              <th>Patient Name</th>
              <th>Contact Phone</th>
              <th>Diagnosis / Symptoms</th>
              <th style="text-align: right">Waived OPD Fee</th>
              <th style="text-align: right">Waived Clinical Meds</th>
              <th style="text-align: right">Waived File/Card</th>
              <th style="text-align: right">Total Waived (Rs.)</th>
              <th>FOC Category / Reason</th>
            </tr>
          </thead>
          <tbody>
            ${focReportData.rows.map(r => `
              <tr>
                <td><b>${r.date}</b></td>
                <td>${r.patientId}</td>
                <td><b>${r.patientName}</b></td>
                <td>${r.phone}</td>
                <td>${r.symptoms}</td>
                <td style="text-align: right">Rs. ${r.opdWaived.toLocaleString()}</td>
                <td style="text-align: right">Rs. ${r.clinWaived.toLocaleString()}</td>
                <td style="text-align: right">Rs. ${r.fileCardWaived.toLocaleString()}</td>
                <td style="text-align: right; font-weight: bold; color: #7e22ce;">Rs. ${r.totalWaived.toLocaleString()}</td>
                <td><span class="badge" style="background: #f3e8ff; color: #6b21a8; font-weight: 800;">${r.reason}</span></td>
              </tr>
            `).join('')}
          </tbody>
          <tfoot>
            <tr style="background: #581c87; color: white; font-weight: bold;">
              <td colspan="5">GRAND TOTALS (${focReportData.totalCount} FOC PATIENTS)</td>
              <td style="text-align: right">Rs. ${focReportData.totalOpdWaived.toLocaleString()}</td>
              <td style="text-align: right">Rs. ${focReportData.totalClinWaived.toLocaleString()}</td>
              <td style="text-align: right">Rs. ${focReportData.totalFileCardWaived.toLocaleString()}</td>
              <td style="text-align: right; font-size: 13px; color: #f3e8ff; font-weight: 900;">Rs. ${focReportData.grandTotalWaived.toLocaleString()}</td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      `;
    } else if (activeReport === 'store_medicine_report') {
      tableHtml = `
        <table class="report-table">
          <thead>
            <tr>
              <th>Item ID</th>
              <th>Medicine Name</th>
              <th>Category</th>
              <th>Company</th>
              <th style="text-align: right">Qty Sold</th>
              <th style="text-align: right">Unit Pur. Price</th>
              <th style="text-align: right">Unit Sale Price</th>
              <th style="text-align: right">Total COGS</th>
              <th style="text-align: right">Gross Sales</th>
              <th style="text-align: right">Discount</th>
              <th style="text-align: right">Net Revenue</th>
              <th style="text-align: right">Gross Profit</th>
              <th style="text-align: right">Margin %</th>
            </tr>
          </thead>
          <tbody>
            ${filteredStoreMedicineRows.map(r => `
              <tr>
                <td><b>${r.itemId}</b></td>
                <td><b>${r.itemName}</b></td>
                <td>${r.category}</td>
                <td>${r.company}</td>
                <td style="text-align: right; font-weight: bold;">${r.qtySold}</td>
                <td style="text-align: right">Rs. ${r.unitPurchasePrice.toLocaleString()}</td>
                <td style="text-align: right">Rs. ${r.unitSalePrice.toLocaleString()}</td>
                <td style="text-align: right; color: #475569;">Rs. ${r.totalCogs.toLocaleString()}</td>
                <td style="text-align: right">Rs. ${r.totalGrossSales.toLocaleString()}</td>
                <td style="text-align: right; color: #d97706;">Rs. ${r.totalDiscount.toLocaleString()}</td>
                <td style="text-align: right; font-weight: bold; color: #0284c7;">Rs. ${r.totalNetSales.toLocaleString()}</td>
                <td style="text-align: right; font-weight: 800; color: ${r.grossProfit >= 0 ? '#15803d' : '#b91c1c'};">Rs. ${r.grossProfit.toLocaleString()}</td>
                <td style="text-align: right; font-weight: bold;"><span class="badge" style="background: ${r.marginPct >= 20 ? '#dcfce7; color: #166534' : '#fef3c7; color: #92400e'};">${r.marginPct.toFixed(1)}%</span></td>
              </tr>
            `).join('')}
          </tbody>
          <tfoot>
            <tr style="background: #0f172a; color: white; font-weight: bold;">
              <td colspan="4">TOTALS (${filteredStoreMedicineSummary.count} MEDICINES)</td>
              <td style="text-align: right">${filteredStoreMedicineSummary.totalQtySold}</td>
              <td></td>
              <td></td>
              <td style="text-align: right; color: #cbd5e1;">Rs. ${filteredStoreMedicineSummary.totalCogs.toLocaleString()}</td>
              <td style="text-align: right; color: #cbd5e1;">Rs. ${filteredStoreMedicineSummary.totalGrossSales.toLocaleString()}</td>
              <td style="text-align: right; color: #fde68a;">Rs. ${filteredStoreMedicineSummary.totalDiscount.toLocaleString()}</td>
              <td style="text-align: right; color: #38bdf8; font-size: 13px;">Rs. ${filteredStoreMedicineSummary.totalNetSales.toLocaleString()}</td>
              <td style="text-align: right; color: #4ade80; font-size: 13px;">Rs. ${filteredStoreMedicineSummary.totalGrossProfit.toLocaleString()}</td>
              <td style="text-align: right; color: #facc15; font-size: 13px;">${filteredStoreMedicineSummary.overallMarginPct.toFixed(1)}%</td>
            </tr>
          </tfoot>
        </table>
      `;
    } else if (activeReport === 'ledger_postings') {
      const selectedAccLabel = ledgerAccountFilter === 'all'
        ? 'All General Ledger Accounts'
        : (effectiveTlAccounts.find(a => String(a.TLID) === String(ledgerAccountFilter))?.TLName || `Account #${ledgerAccountFilter}`);

      tableHtml = `
        <div style="margin-bottom: 12px; font-size: 11px; background: #f8fafc; padding: 10px 14px; border: 1.5px solid #cbd5e1; border-radius: 8px; display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px;">
          <div>
            <div style="font-size: 9px; font-weight: 800; color: #64748b; text-transform: uppercase;">QUERY ACCOUNT</div>
            <div style="font-weight: 700; color: #0f172a; margin-top: 2px;">${selectedAccLabel}</div>
          </div>
          <div>
            <div style="font-size: 9px; font-weight: 800; color: #64748b; text-transform: uppercase;">OPENING BALANCE (PRE-PERIOD)</div>
            <div style="font-weight: 800; color: ${filteredLedgerData.openingBalance >= 0 ? '#047857' : '#be123c'}; margin-top: 2px; font-family: monospace;">Rs. ${filteredLedgerData.openingBalance.toLocaleString()}</div>
          </div>
          <div>
            <div style="font-size: 9px; font-weight: 800; color: #64748b; text-transform: uppercase;">DOUBLE-ENTRY STATUS</div>
            <div style="font-weight: 800; margin-top: 2px;">
              ${filteredLedgerData.isBalanced 
                ? '<span style="color: #059669; font-weight: bold;">✓ Balanced (Dr = Cr)</span>' 
                : `<span style="color: #dc2626; font-weight: bold;">Variance: Rs. ${filteredLedgerData.balanceDifference.toLocaleString()}</span>`}
            </div>
          </div>
        </div>

        <table class="report-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Voucher #</th>
              <th>Type</th>
              <th>Account Code & Title</th>
              <th>Party / Reference</th>
              <th>Narration / Details</th>
              <th style="text-align: right">Debit Dr (Rs.)</th>
              <th style="text-align: right">Credit Cr (Rs.)</th>
              <th style="text-align: right">Balance (Rs.)</th>
            </tr>
          </thead>
          <tbody>
            <tr style="background: #f1f5f9; font-weight: bold;">
              <td>${startDate}</td>
              <td style="font-family: monospace;">OPENING</td>
              <td><span class="badge">BF</span></td>
              <td colspan="3"><b>Opening Balance Brought Forward</b> (Prior to ${startDate})</td>
              <td style="text-align: right; color: #64748b;">—</td>
              <td style="text-align: right; color: #64748b;">—</td>
              <td style="text-align: right; font-family: monospace; font-weight: 800; color: #0f172a;">Rs. ${filteredLedgerData.openingBalance.toLocaleString()}</td>
            </tr>
            ${filteredLedgerData.rows.length === 0 ? `
              <tr>
                <td colspan="9" style="text-align: center; color: #94a3b8; padding: 20px; font-style: italic;">
                  No double-entry ledger transactions found for the selected fiscal date period and query filters.
                </td>
              </tr>
            ` : filteredLedgerData.rows.map(r => `
              <tr>
                <td>${r.txDate}</td>
                <td style="font-family: monospace; font-weight: bold;">${r.vchNo}</td>
                <td><span class="badge" style="background: #e0e7ff; color: #3730a3;">${r.vchType}</span></td>
                <td><b>${r.tlid}</b> - ${r.accountName}</td>
                <td>${r.payeeOrParty || '—'}</td>
                <td style="color: #334155;">${r.description}</td>
                <td style="text-align: right; font-weight: bold; color: ${r.debit > 0 ? '#059669' : '#94a3b8'};">${r.debit > 0 ? `Rs. ${r.debit.toLocaleString()}` : '-'}</td>
                <td style="text-align: right; font-weight: bold; color: ${r.credit > 0 ? '#d97706' : '#94a3b8'};">${r.credit > 0 ? `Rs. ${r.credit.toLocaleString()}` : '-'}</td>
                <td style="text-align: right; font-family: monospace; font-weight: 800; color: #0f172a;">Rs. ${(r.runningBalance ?? 0).toLocaleString()}</td>
              </tr>
            `).join('')}
          </tbody>
          <tfoot>
            <tr style="background: #0f172a; color: white; font-weight: bold;">
              <td colspan="6">PERIOD GRAND TOTALS (${filteredLedgerData.rows.length} POSTINGS • ${filteredLedgerData.uniqueVouchersCount} VOUCHERS)</td>
              <td style="text-align: right; color: #6ee7b7; font-size: 12.5px;">Rs. ${filteredLedgerData.totalDebits.toLocaleString()}</td>
              <td style="text-align: right; color: #fde68a; font-size: 12.5px;">Rs. ${filteredLedgerData.totalCredits.toLocaleString()}</td>
              <td style="text-align: right; color: #38bdf8; font-size: 13px;">Rs. ${filteredLedgerData.closingBalance.toLocaleString()}</td>
            </tr>
          </tfoot>
        </table>
      `;
    } else {
      tableHtml = `
        <table class="report-table">
          <thead>
            <tr>
              <th>PO ID</th>
              <th>Vendor Name</th>
              <th>Order Date</th>
              <th style="text-align: right">Total PO Amount</th>
              <th style="text-align: center">Status</th>
              <th>GRN Status</th>
            </tr>
          </thead>
          <tbody>
            ${poData.map(p => `
              <tr>
                <td><b>${p.POID}</b></td>
                <td><b>${p.VendorName}</b></td>
                <td>${p.OrderDate}</td>
                <td style="text-align: right">Rs. ${p.TotalAmount.toLocaleString()}</td>
                <td style="text-align: center">${p.Status}</td>
                <td>${p.linkedGrn ? 'APPROVED (GRN #' + p.linkedGrn.GRNID + ')' : 'Pending GRN Receipt'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    }

    printWin.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${reportTitles[activeReport]} - Punjab Homeopathic Clinic</title>
          <style>
            @page {
              size: A4 portrait;
              margin: 10mm 12mm 12mm 12mm;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
              color: #0f172a;
              margin: 0;
              padding: 0;
              font-size: 11.5px;
              line-height: 1.4;
              background: #ffffff;
            }
            * {
              box-sizing: border-box;
            }

            /* Letterhead Header Section */
            .letterhead-header {
              display: flex;
              align-items: center;
              justify-content: space-between;
              border-bottom: 3px double #064e3b;
              padding-bottom: 10px;
              margin-bottom: 12px;
              gap: 12px;
            }
            .logo-col {
              width: 80px;
              height: 80px;
              display: flex;
              align-items: center;
              justify-content: center;
              flex-shrink: 0;
            }
            .logo-img {
              max-width: 100%;
              max-height: 100%;
              object-fit: contain;
            }
            .clinic-info {
              text-align: center;
              flex: 1;
            }
            .clinic-name {
              font-family: Georgia, "Times New Roman", serif;
              font-size: 24px;
              font-weight: 900;
              color: #881337;
              text-transform: uppercase;
              margin: 0;
              letter-spacing: -0.5px;
              line-height: 1.1;
            }
            .clinic-tagline {
              font-size: 10px;
              font-weight: 800;
              color: #be123c;
              letter-spacing: 1.5px;
              text-transform: uppercase;
              margin-top: 2px;
            }
            .clinic-reg {
              font-size: 11px;
              font-weight: 700;
              color: #1e293b;
              margin-top: 4px;
            }
            .clinic-timings {
              font-size: 10px;
              font-weight: 800;
              color: #064e3b;
              text-transform: uppercase;
              margin-top: 3px;
            }

            /* Official Report Banner & Meta Box */
            .report-banner {
              background: #0f172a;
              color: #ffffff;
              padding: 8px 14px;
              border-radius: 6px;
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 10px;
            }
            .report-banner-title {
              font-size: 12.5px;
              font-weight: 900;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              color: #f8fafc;
            }
            .report-banner-ref {
              font-size: 10px;
              font-family: monospace;
              color: #cbd5e1;
              font-weight: 700;
            }

            .meta-grid {
              background: #f8fafc;
              border: 1.5px solid #cbd5e1;
              border-radius: 8px;
              padding: 10px 14px;
              margin-bottom: 14px;
              display: grid;
              grid-template-columns: 1fr 1fr 1fr;
              gap: 8px;
              font-size: 11px;
            }
            .meta-item {
              display: flex;
              flex-direction: column;
            }
            .meta-label {
              font-size: 9px;
              font-weight: 800;
              color: #64748b;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .meta-value {
              font-size: 11px;
              font-weight: 700;
              color: #0f172a;
              margin-top: 1px;
            }

            /* Table Styles */
            .report-table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 8px;
              font-size: 11px;
            }
            .report-table th {
              background: #1e293b;
              color: #ffffff;
              font-weight: 800;
              text-align: left;
              padding: 7px 10px;
              font-size: 10.5px;
              text-transform: uppercase;
              letter-spacing: 0.3px;
              border: 1px solid #1e293b;
            }
            .report-table td {
              border: 1px solid #e2e8f0;
              padding: 7px 10px;
              color: #0f172a;
            }
            .report-table tbody tr:nth-child(even) {
              background-color: #f8fafc;
            }
            .report-table tfoot tr {
              background-color: #f1f5f9;
              font-weight: 800;
            }
            .report-table tfoot td {
              border-top: 2px solid #0f172a;
              padding: 8px 10px;
            }

            .badge {
              padding: 2px 6px;
              border-radius: 4px;
              font-size: 9.5px;
              font-weight: 800;
              background: #e2e8f0;
              display: inline-block;
            }
            .badge-red { background: #fecdd3; color: #9f1239; }
            .badge-amber { background: #fef3c7; color: #92400e; }

            /* Manager Signature Section */
            .signature-section {
              margin-top: 35px;
              padding-top: 15px;
              border-top: 2px solid #cbd5e1;
              display: flex;
              justify-content: space-between;
              align-items: flex-end;
              page-break-inside: avoid;
            }
            .sig-box {
              text-align: center;
              width: 220px;
            }
            .sig-line-text {
              border-bottom: 1.5px dashed #475569;
              height: 38px;
              margin-bottom: 6px;
              display: flex;
              align-items: flex-end;
              justify-content: center;
              font-size: 11px;
              font-weight: 700;
              color: #334155;
              padding-bottom: 2px;
            }
            .sig-line-manager {
              border-bottom: 2.5px solid #0f172a;
              height: 38px;
              margin-bottom: 6px;
              display: flex;
              align-items: flex-end;
              justify-content: center;
              font-size: 13px;
              font-weight: 900;
              color: #0f172a;
              font-family: Georgia, 'Times New Roman', serif;
              padding-bottom: 2px;
            }
            .sig-title-primary {
              font-size: 11px;
              font-weight: 900;
              color: #881337;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .sig-title-sub {
              font-size: 10px;
              font-weight: 800;
              color: #0f172a;
              text-transform: uppercase;
            }
            .sig-title-dept {
              font-size: 9px;
              font-weight: 700;
              color: #047857;
            }

            .stamp-box {
              text-align: center;
              width: 130px;
              height: 65px;
              border: 2px dashed #94a3b8;
              border-radius: 8px;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              color: #64748b;
              font-size: 8px;
              font-weight: 800;
              text-transform: uppercase;
              background: #fafafa;
            }

            /* Footer Disclaimer */
            .official-footer {
              margin-top: 15px;
              border-top: 1px solid #e2e8f0;
              padding-top: 8px;
              display: flex;
              justify-content: space-between;
              align-items: center;
              font-size: 9px;
              color: #64748b;
              font-weight: 600;
            }
          </style>
        </head>
        <body>
          <!-- A4 Official Letterhead Header -->
          <div class="letterhead-header">
            <div class="logo-col">
              <img src="${logoSrc}" alt="PHC Logo" class="logo-img" />
            </div>
            <div class="clinic-info">
              <h1 class="clinic-name">${clinicName}</h1>
              <div class="clinic-tagline">HEALING NATURALLY. RESTORING BALANCE.</div>
              <div class="clinic-address" style="font-size: 11px; font-weight: 700; color: #1e293b; margin-top: 2px;">
                ${clinicAddress} &nbsp;|&nbsp; 📞 <a href="tel:${clinicPhone.replace(/[^0-9+]/g, '')}" style="color: #1e293b; text-decoration: none;">${clinicPhone}</a>
              </div>
              <div style="font-size: 10.5px; font-weight: 700; color: #1d4ed8; margin-top: 2px;">
                🌐 <a href="${clinicWebsite}" target="_blank" rel="noopener noreferrer" style="color: #1d4ed8; text-decoration: underline; font-weight: bold;">${clinicWebsite.replace(/^https?:\/\//, '')}</a>
              </div>
              <div class="clinic-timings">
                Clinic Timings: Morning 8:30 AM to 12:00 PM &nbsp;|&nbsp; Evening 4:30 PM to 9:00 PM
              </div>
            </div>
            <div class="logo-col" style="visibility: hidden;">
              <img src="${logoSrc}" alt="PHC Logo" class="logo-img" />
            </div>
          </div>

          <!-- Official Report Banner & Meta Details -->
          <div class="report-banner">
            <span class="report-banner-title">OFFICIAL CLINIC & FINANCIAL AUDIT STATEMENT</span>
            <span class="report-banner-ref">REF: PHC-RPT-${Date.now().toString().slice(-6)}</span>
          </div>

          <div class="meta-grid">
            <div class="meta-item">
              <span class="meta-label">Statement Type</span>
              <span class="meta-value" style="color: #4338ca;">${reportTitles[activeReport]}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Audit Period</span>
              <span class="meta-value">${startDate} to ${endDate} (${datePreset.toUpperCase()})</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Generated Date & Time</span>
              <span class="meta-value">${new Date().toLocaleString('en-GB')}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Audit Prepared By</span>
              <span class="meta-value">${currentUser?.FullName || 'Staff Accountant'}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Responsible Manager</span>
              <span class="meta-value" style="color: #881337;">Mr. Zaigham Ali Anjum</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Total Verified Records</span>
              <span class="meta-value">${recordCountText}</span>
            </div>
          </div>

          <!-- Main Report Data Table -->
          ${tableHtml}

          <!-- Executive Signatures & Stamps Block -->
          <div style="margin-top: 35px; padding-top: 15px; border-top: 2px solid #cbd5e1; display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; text-align: center; page-break-inside: avoid;">
            <div>
              <div style="border-bottom: 1.5px dashed #64748b; height: 35px; margin-bottom: 6px; display: flex; align-items: flex-end; justify-content: center; font-size: 10px; font-weight: 700; color: #334155;">
                ${currentUser?.FullName || 'Accountant'}
              </div>
              <div style="font-weight: 800; font-size: 9.5px; text-transform: uppercase; color: #0f172a;">PREPARED BY</div>
              <div style="font-size: 8.5px; color: #64748b;">Accounts & Audit Desk</div>
            </div>

            <div>
              <div style="border-bottom: 1.5px dashed #64748b; height: 35px; margin-bottom: 6px;"></div>
              <div style="font-weight: 800; font-size: 9.5px; text-transform: uppercase; color: #0f172a;">CHECKED BY</div>
              <div style="font-size: 8.5px; color: #64748b;">Internal Audit Wing</div>
            </div>

            <div>
              <div style="border-bottom: 1.5px dashed #64748b; height: 35px; margin-bottom: 6px;"></div>
              <div style="font-weight: 800; font-size: 9.5px; text-transform: uppercase; color: #0f172a;">VERIFIED BY</div>
              <div style="font-size: 8.5px; color: #64748b;">Finance Desk</div>
            </div>

            <div>
              <div style="border-bottom: 2.5px solid #0f172a; height: 35px; margin-bottom: 6px; display: flex; align-items: flex-end; justify-content: center; font-size: 13px; font-weight: 900; color: #0f172a; font-family: Georgia, serif;">
                Zaigham Ali Anjum
              </div>
              <div style="font-weight: 900; font-size: 10px; color: #881337; text-transform: uppercase;">MR. ZAIGHAM ALI ANJUM</div>
              <div style="font-weight: 800; font-size: 8.5px; color: #0f172a; text-transform: uppercase;">Manager Operations & Administrative Head</div>
              <div style="font-weight: 700; font-size: 8px; color: #047857;">Punjab Homeopathic Clinic & Pharmacy</div>
            </div>
          </div>

          <!-- Official Footer Note -->
          <div class="official-footer">
            <div>Punjab Homeopathic Clinic & Pharmacy • 🌐 <a href="${clinicWebsite}" target="_blank" rel="noopener noreferrer" style="color: #2563eb; text-decoration: underline; font-weight: bold;">${clinicWebsite.replace(/^https?:\/\//, '')}</a> • 📞 Helpline: <a href="tel:${clinicPhone.replace(/[^0-9+]/g, '')}" style="color: inherit; text-decoration: none; font-weight: bold;">${clinicPhone}</a></div>
            <div>Authorized Administrator: <strong>Mr. Zaigham Ali Anjum</strong></div>
          </div>

          <script>
            window.onload = function() {
              window.print();
            }
          </script>
        </body>
      </html>
    `);
    printWin.document.close();
  };

  return (
    <div className="p-6 md:p-8 space-y-6 overflow-y-auto flex-1 h-full bg-slate-50 text-slate-800" id="reporting-desk-root">
      {/* HEADER BAR */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 shadow-md border border-slate-800">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-indigo-400 font-bold text-xs uppercase tracking-wider mb-1">
              <PieChart className="w-4 h-4" />
              <span>Executive Business Intelligence & ERP Analytics</span>
            </div>
            <h2 className="text-2xl font-black tracking-tight text-white">Comprehensive Reporting Desk</h2>
            <p className="text-slate-300 text-xs mt-1">
              Filter custom date periods, evaluate liabilities, disburse records, current stock valuation & reorder requirements.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handlePrintReport}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center space-x-1.5 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print Official Report</span>
            </button>
            <button
              onClick={handleExportCSV}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs rounded-xl shadow-sm transition flex items-center space-x-1.5 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* REPORT TYPE SELECTOR BUTTONS */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-12 gap-2 mt-6 pt-5 border-t border-slate-800">
          {[
            { id: 'ledger_postings', label: 'GL & Ledger Postings', icon: BookOpen, badge: filteredLedgerData.rows.length },
            { id: 'pending_payments', label: 'Pending Vendor Payments', icon: Building2, badge: pendingPaymentsSummary.vendorsWithDues },
            { id: 'payroll_disbursement', label: 'Salary Disbursement', icon: Users, badge: payrollSummary.recordCount },
            { id: 'expense_analysis', label: 'Expense Analysis', icon: DollarSign, badge: expenseSummary.count },
            { id: 'purchase_orders', label: 'Purchase Orders', icon: ShoppingCart, badge: poSummary.totalPos },
            { id: 'shift_collection_summary', label: 'Shift Collection', icon: PieChart },
            { id: 'foc_cases_summary', label: 'FOC Cases', icon: HeartHandshake, badge: focReportData.totalCount },
            { id: 'store_medicine_report', label: 'Store Sales & Margins', icon: Boxes, badge: storeMedicineReportData.rows.length },
            { id: 'current_stock', label: 'Current Stock', icon: Boxes, badge: currentStockSummary.totalItems },
            { id: 'minimum_stock', label: 'Minimum Stock Alert', icon: AlertTriangle, badge: minimumStockSummary.totalLowStock, isAlert: true },
            { id: 'required_stock', label: 'Required Requisition', icon: PackagePlus, badge: requiredStockSummary.totalItemsToOrder },
            { id: 'pnl_summary', label: 'Executive P&L', icon: TrendingUp }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeReport === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveReport(tab.id as ReportType)}
                className={`p-2.5 rounded-xl transition flex flex-col items-center text-center space-y-1.5 cursor-pointer border ${
                  isActive
                    ? 'bg-indigo-600 border-indigo-400 text-white shadow-md font-bold'
                    : 'bg-slate-800/80 hover:bg-slate-800 border-slate-700/80 text-slate-300 font-medium'
                }`}
              >
                <div className="relative">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : tab.isAlert ? 'text-amber-400' : 'text-indigo-400'}`} />
                  {tab.badge !== undefined && tab.badge > 0 && (
                    <span className={`absolute -top-2 -right-3 px-1.5 py-0.2 text-[9px] font-bold rounded-full ${
                      tab.isAlert ? 'bg-rose-500 text-white' : 'bg-slate-900 text-indigo-300 border border-slate-700'
                    }`}>
                      {tab.badge}
                    </span>
                  )}
                </div>
                <span className="text-[10.5px] leading-tight line-clamp-2">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* FILTER & DATE CONTROLS BAR */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Quick Date & Fiscal Presets */}
          <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar pb-1">
            <span className="text-xs font-bold text-slate-500 flex items-center space-x-1 pr-1 shrink-0">
              <Calendar className="w-3.5 h-3.5 text-indigo-600" />
              <span>Period:</span>
            </span>
            {[
              { id: 'today', label: 'Today' },
              { id: 'this_week', label: 'This Week' },
              { id: 'this_month', label: 'This Month' },
              { id: 'last_30_days', label: 'Last 30 Days' },
              { id: 'this_quarter', label: 'This Quarter' },
              { id: 'this_fiscal_year', label: `This FY (${(currentMonthIdx >= 6 ? currentYear : currentYear - 1).toString().slice(-2)}-${(currentMonthIdx >= 6 ? currentYear + 1 : currentYear).toString().slice(-2)})` },
              { id: 'this_year', label: `CY ${currentYear}` },
              { id: 'all', label: 'All Time' }
            ].map(p => (
              <button
                key={p.id}
                onClick={() => handlePresetChange(p.id as any)}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition cursor-pointer border whitespace-nowrap shrink-0 ${
                  datePreset === p.id
                    ? 'bg-indigo-50 border-indigo-300 text-indigo-700 shadow-2xs'
                    : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Date Picker Range Inputs & Fiscal Pickers */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Fiscal Year Selector */}
            <div className="flex items-center space-x-1 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 shadow-2xs">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Year:</span>
              <select
                value={selectedFiscalYear}
                onChange={e => handleFiscalYearSelect(e.target.value)}
                className="text-xs font-bold text-slate-800 bg-transparent focus:outline-hidden cursor-pointer font-mono"
              >
                {fiscalYearOptions.map(fy => (
                  <option key={fy.key} value={fy.key}>
                    {fy.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Fiscal Month Selector Dropdown */}
            <div className="flex items-center space-x-1 bg-indigo-50/80 border-2 border-indigo-300 rounded-lg px-2 py-1 shadow-2xs">
              <span className="text-[10px] font-black text-indigo-950 uppercase tracking-wider">Month:</span>
              <select
                value={selectedFiscalMonth}
                onChange={e => handleFiscalMonthSelect(e.target.value)}
                className="text-xs font-black text-indigo-900 bg-transparent focus:outline-hidden cursor-pointer font-mono"
              >
                <option value="all">📅 All Months (Full Period)</option>
                {monthOptions.map(m => (
                  <option key={m.value} value={m.value}>
                    📅 {m.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Exact Date Pickers */}
            <div className="flex items-center space-x-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">From:</span>
              <input
                type="date"
                value={startDate}
                onChange={e => {
                  setStartDate(e.target.value);
                  setDatePreset('custom');
                  setSelectedFiscalYear('custom');
                  setSelectedFiscalMonth('all');
                }}
                className="text-xs font-bold text-slate-800 bg-transparent focus:outline-hidden"
              />
              <span className="text-slate-400 font-bold text-xs">-</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase">To:</span>
              <input
                type="date"
                value={endDate}
                onChange={e => {
                  setEndDate(e.target.value);
                  setDatePreset('custom');
                  setSelectedFiscalYear('custom');
                  setSelectedFiscalMonth('all');
                }}
                className="text-xs font-bold text-slate-800 bg-transparent focus:outline-hidden"
              />
            </div>
          </div>
        </div>

        {/* Sub-Filters & General Ledger Advanced Filter Controls */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2 border-t border-slate-100">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder={activeReport === 'ledger_postings' ? 'Search Voucher #, Account Code/Name, Payee, Description, or Amount...' : 'Search records, items, vendors, or descriptions...'}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            />
          </div>

          {/* GL Specific Dropdown Filters */}
          {activeReport === 'ledger_postings' && (
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              {/* Account Filter */}
              <div className="flex items-center space-x-1.5">
                <Scale className="w-3.5 h-3.5 text-indigo-500" />
                <select
                  value={ledgerAccountFilter}
                  onChange={e => setLedgerAccountFilter(e.target.value)}
                  className="px-2.5 py-1.5 bg-indigo-50/80 border border-indigo-200 rounded-xl text-xs font-bold text-indigo-950 focus:outline-hidden cursor-pointer"
                >
                  <option value="all">All Accounts ({effectiveTlAccounts.length})</option>
                  {effectiveTlAccounts.map(acc => (
                    <option key={acc.TLID} value={acc.TLID}>
                      {acc.TLID} - {acc.TLName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Voucher Type Filter */}
              <select
                value={ledgerVchTypeFilter}
                onChange={e => setLedgerVchTypeFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-hidden cursor-pointer"
              >
                <option value="all">All Voucher Types</option>
                <option value="CPV">CPV - Cash Payment</option>
                <option value="CRV">CRV - Cash Receipt</option>
                <option value="BPV">BPV - Bank Payment</option>
                <option value="BRV">BRV - Bank Receipt</option>
                <option value="JV">JV - Journal Voucher</option>
                <option value="GRN">GRN - Goods Received</option>
                <option value="INV">INV - Sales Invoice</option>
                <option value="SR">SR - Sales Return</option>
              </select>

              {/* Dr / Cr Filter */}
              <select
                value={ledgerDrCrFilter}
                onChange={e => setLedgerDrCrFilter(e.target.value as any)}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-hidden cursor-pointer"
              >
                <option value="all">All Postings (Dr & Cr)</option>
                <option value="dr">Debits (Dr) Only</option>
                <option value="cr">Credits (Cr) Only</option>
              </select>
            </div>
          )}

          {activeReport === 'store_medicine_report' && (
            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <select
                value={storeMedicineTypeFilter}
                onChange={e => setStoreMedicineTypeFilter(e.target.value as any)}
                className="px-3 py-1.5 bg-indigo-50/80 border border-indigo-200 rounded-xl text-xs font-bold text-indigo-900 focus:outline-hidden"
              >
                <option value="all">All Medicine Types</option>
                <option value="P">Pharmacy / Patent Store Only</option>
                <option value="C">Clinical Dispenses Only</option>
              </select>
            </div>
          )}

          {(activeReport === 'expense_analysis' || activeReport === 'current_stock' || activeReport === 'minimum_stock' || activeReport === 'required_stock' || activeReport === 'store_medicine_report') && (
            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={selectedCategory}
                onChange={e => setSelectedCategory(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-hidden cursor-pointer"
              >
                <option value="all">
                  All Categories ({activeReport === 'expense_analysis' ? expenseData.length : effectiveItems.length} items)
                </option>
                {activeReport === 'expense_analysis' ? (
                  ['Rent', 'Utilities', 'Salaries', 'Maintenance', 'Marketing', 'Supplies', 'Refreshment', 'Other'].map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))
                ) : (
                  categoriesList.map(c => {
                    const count = effectiveItems.filter(it => matchesCategoryFilter(it, c)).length;
                    return (
                      <option key={c} value={c}>
                        {c} {count > 0 ? `(${count})` : ''}
                      </option>
                    );
                  })
                )}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* SUMMARY KPI METRIC CARDS FOR ACTIVE REPORT */}
      {activeReport === 'ledger_postings' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {/* Total Debits */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <div className="text-[11px] font-extrabold text-emerald-700 uppercase tracking-wider">Total Debits (Dr)</div>
                <div className="text-xl font-black text-emerald-950 mt-1">Rs. {filteredLedgerData.totalDebits.toLocaleString()}</div>
                <div className="text-[11px] font-medium text-emerald-700 mt-0.5">
                  {filteredLedgerData.rows.filter(r => r.debit > 0).length} Debit Postings
                </div>
              </div>
              <ArrowDownRight className="w-7 h-7 text-emerald-600 opacity-80" />
            </div>

            {/* Total Credits */}
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <div className="text-[11px] font-extrabold text-amber-700 uppercase tracking-wider">Total Credits (Cr)</div>
                <div className="text-xl font-black text-amber-950 mt-1">Rs. {filteredLedgerData.totalCredits.toLocaleString()}</div>
                <div className="text-[11px] font-medium text-amber-700 mt-0.5">
                  {filteredLedgerData.rows.filter(r => r.credit > 0).length} Credit Postings
                </div>
              </div>
              <ArrowUpRight className="w-7 h-7 text-amber-600 opacity-80" />
            </div>

            {/* Net Period Movement */}
            <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <div className="text-[11px] font-extrabold text-indigo-700 uppercase tracking-wider">Net Movement</div>
                <div className="text-xl font-black text-indigo-950 mt-1">
                  Rs. {Math.abs(filteredLedgerData.netPeriodMovement).toLocaleString()}
                  <span className="text-xs font-bold ml-1 text-indigo-700">
                    {filteredLedgerData.netPeriodMovement >= 0 ? 'Dr' : 'Cr'}
                  </span>
                </div>
                <div className="text-[11px] font-medium text-indigo-700 mt-0.5">
                  Period Balance Change
                </div>
              </div>
              <ArrowRightLeft className="w-7 h-7 text-indigo-600 opacity-80" />
            </div>

            {/* Double Entry Status */}
            <div className={`border rounded-2xl p-4 flex items-center justify-between ${
              filteredLedgerData.isBalanced ? 'bg-teal-50 border-teal-200' : 'bg-rose-50 border-rose-200'
            }`}>
              <div>
                <div className={`text-[11px] font-extrabold uppercase tracking-wider ${
                  filteredLedgerData.isBalanced ? 'text-teal-700' : 'text-rose-700'
                }`}>
                  Double-Entry Audit
                </div>
                <div className={`text-xl font-black mt-1 ${
                  filteredLedgerData.isBalanced ? 'text-teal-950' : 'text-rose-950'
                }`}>
                  {filteredLedgerData.isBalanced ? '✓ Balanced' : 'Imbalance'}
                </div>
                <div className={`text-[11px] font-medium mt-0.5 ${
                  filteredLedgerData.isBalanced ? 'text-teal-700' : 'text-rose-700 font-bold'
                }`}>
                  {filteredLedgerData.isBalanced ? 'Dr = Cr (Zero Variance)' : `Diff: Rs. ${filteredLedgerData.balanceDifference.toLocaleString()}`}
                </div>
              </div>
              <Scale className={`w-7 h-7 opacity-80 ${filteredLedgerData.isBalanced ? 'text-teal-600' : 'text-rose-600'}`} />
            </div>

            {/* Vouchers & Accounts Count */}
            <div className="bg-slate-100 border border-slate-300 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <div className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider">Vouchers & Accounts</div>
                <div className="text-xl font-black text-slate-900 mt-1">{filteredLedgerData.uniqueVouchersCount} Vouchers</div>
                <div className="text-[11px] font-medium text-slate-600 mt-0.5">
                  Across {filteredLedgerData.activeAccountsCount} Active GL Accounts
                </div>
              </div>
              <Receipt className="w-7 h-7 text-slate-600 opacity-80" />
            </div>
          </div>

          {/* Detailed Double-Entry General Ledger Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="font-extrabold text-slate-900 text-sm">General Ledger & Double-Entry Postings Audit</h3>
                  <span className="px-2 py-0.5 text-[10px] font-extrabold rounded-md bg-indigo-100 text-indigo-800 border border-indigo-200">
                    {filteredLedgerData.rows.length} Postings
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Fiscal Period: <strong className="text-slate-800 font-bold">{startDate}</strong> to <strong className="text-slate-800 font-bold">{endDate}</strong>
                  {ledgerAccountFilter !== 'all' && (
                    <span className="ml-2 px-1.5 py-0.5 bg-slate-200 text-slate-800 rounded font-bold text-[10px]">
                      Account: {effectiveTlAccounts.find(a => String(a.TLID) === String(ledgerAccountFilter))?.TLName || ledgerAccountFilter}
                    </span>
                  )}
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <div className="text-right">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Pre-Period Opening Balance</div>
                  <div className="text-xs font-black font-mono text-slate-800">
                    Rs. {filteredLedgerData.openingBalance.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-white font-extrabold text-[11px] uppercase tracking-wider">
                    <th className="p-3">Date</th>
                    <th className="p-3">Voucher #</th>
                    <th className="p-3">Type</th>
                    <th className="p-3">Account Code & Title</th>
                    <th className="p-3">Party / Reference</th>
                    <th className="p-3">Narration / Description</th>
                    <th className="p-3 text-center">Module</th>
                    <th className="p-3 text-right">Debit Dr (Rs.)</th>
                    <th className="p-3 text-right">Credit Cr (Rs.)</th>
                    <th className="p-3 text-right">Running Balance (Rs.)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {/* Opening Balance Row */}
                  <tr className="bg-slate-100/90 font-bold text-slate-800">
                    <td className="p-3 font-mono">{startDate}</td>
                    <td className="p-3 font-mono text-slate-500">OPENING</td>
                    <td className="p-3">
                      <span className="px-1.5 py-0.5 text-[9.5px] font-extrabold rounded-md bg-slate-200 text-slate-800">
                        BF
                      </span>
                    </td>
                    <td className="p-3 font-bold" colSpan={4}>
                      Opening Balance Brought Forward (Prior to {startDate})
                    </td>
                    <td className="p-3 text-right text-slate-400 font-mono">—</td>
                    <td className="p-3 text-right text-slate-400 font-mono">—</td>
                    <td className="p-3 text-right font-mono font-black text-slate-900 bg-slate-200/60">
                      Rs. {filteredLedgerData.openingBalance.toLocaleString()}
                    </td>
                  </tr>

                  {filteredLedgerData.rows.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="p-8 text-center text-slate-400 italic">
                        No double-entry ledger postings recorded for the selected fiscal period and query criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredLedgerData.rows.map((r, idx) => (
                      <tr
                        key={r.id + '-' + idx}
                        className={idx % 2 === 0 ? 'bg-white hover:bg-slate-50/80' : 'bg-slate-50/40 hover:bg-slate-100/50'}
                      >
                        <td className="p-3 font-mono font-bold text-slate-800 whitespace-nowrap">{r.txDate}</td>
                        <td className="p-3 font-mono font-extrabold text-indigo-700 whitespace-nowrap">{r.vchNo}</td>
                        <td className="p-3 whitespace-nowrap">
                          <span className={`px-2 py-0.5 text-[9.5px] font-extrabold rounded-md border ${
                            r.vchType === 'CPV' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                            r.vchType === 'CRV' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                            r.vchType === 'BPV' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                            r.vchType === 'BRV' ? 'bg-teal-50 text-teal-700 border-teal-200' :
                            r.vchType === 'GRN' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                            r.vchType === 'INV' ? 'bg-cyan-50 text-cyan-700 border-cyan-200' :
                            r.vchType === 'SR' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                            'bg-slate-100 text-slate-700 border-slate-200'
                          }`}>
                            {r.vchType}
                          </span>
                        </td>
                        <td className="p-3">
                          <div className="font-extrabold text-slate-900">{r.accountName}</div>
                          <div className="text-[10px] text-slate-400 font-mono flex items-center space-x-1 mt-0.5">
                            <span>Code: {r.tlid}</span>
                            <span>•</span>
                            <span className="capitalize">{r.accountCategory}</span>
                          </div>
                        </td>
                        <td className="p-3 font-semibold text-slate-700">{r.payeeOrParty || '—'}</td>
                        <td className="p-3 text-slate-600 max-w-xs">{r.description}</td>
                        <td className="p-3 text-center whitespace-nowrap">
                          <span className="px-1.5 py-0.5 text-[9px] font-bold rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                            {r.sourceModule}
                          </span>
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-emerald-700 whitespace-nowrap">
                          {r.debit > 0 ? `Rs. ${r.debit.toLocaleString()}` : <span className="text-slate-300 font-normal">-</span>}
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-amber-700 whitespace-nowrap">
                          {r.credit > 0 ? `Rs. ${r.credit.toLocaleString()}` : <span className="text-slate-300 font-normal">-</span>}
                        </td>
                        <td className="p-3 text-right font-mono font-black text-slate-900 bg-slate-50 whitespace-nowrap">
                          Rs. {(r.runningBalance ?? 0).toLocaleString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-950 text-white font-extrabold text-xs">
                    <td className="p-3.5 uppercase tracking-wider" colSpan={7}>
                      Period Totals ({filteredLedgerData.rows.length} Postings • {filteredLedgerData.uniqueVouchersCount} Vouchers)
                    </td>
                    <td className="p-3.5 text-right font-mono font-black text-emerald-400 text-sm">
                      Rs. {filteredLedgerData.totalDebits.toLocaleString()}
                    </td>
                    <td className="p-3.5 text-right font-mono font-black text-amber-300 text-sm">
                      Rs. {filteredLedgerData.totalCredits.toLocaleString()}
                    </td>
                    <td className="p-3.5 text-right font-mono font-black text-sky-300 text-sm bg-slate-900">
                      Rs. {filteredLedgerData.closingBalance.toLocaleString()}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUMMARY KPI METRIC CARDS FOR ACTIVE REPORT */}
      {activeReport === 'pending_payments' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-rose-600 uppercase tracking-wider">Total Outstanding Payables</div>
              <div className="text-2xl font-black text-rose-900 mt-1">Rs. {pendingPaymentsSummary.totalOwed.toLocaleString()}</div>
              <div className="text-[11px] font-medium text-rose-700 mt-0.5">Owed across vendors for received inventory</div>
            </div>
            <Building2 className="w-8 h-8 text-rose-500 opacity-80" />
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-amber-700 uppercase tracking-wider">Vendors With Pending Dues</div>
              <div className="text-2xl font-black text-amber-900 mt-1">{pendingPaymentsSummary.vendorsWithDues} Vendors</div>
              <div className="text-[11px] font-medium text-amber-700 mt-0.5">Out of {pendingPaymentsSummary.totalVendors} total registered vendors</div>
            </div>
            <Clock className="w-8 h-8 text-amber-500 opacity-80" />
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-slate-600 uppercase tracking-wider">Filtered Vendor Records</div>
              <div className="text-2xl font-black text-slate-900 mt-1">{pendingPaymentsData.length} Vendors</div>
              <div className="text-[11px] font-medium text-slate-500 mt-0.5">Matches current search filter</div>
            </div>
            <Filter className="w-8 h-8 text-slate-400 opacity-80" />
          </div>
        </div>
      )}

      {activeReport === 'payroll_disbursement' && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4">
            <div className="text-xs font-bold text-indigo-700 uppercase tracking-wider">Total Salary Disbursed</div>
            <div className="text-2xl font-black text-indigo-950 mt-1">Rs. {payrollSummary.totalDisbursed.toLocaleString()}</div>
            <div className="text-[11px] text-indigo-700 font-medium mt-0.5">Net salary payout in period</div>
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
            <div className="text-xs font-bold text-slate-600 uppercase tracking-wider">Total Basic Salary</div>
            <div className="text-xl font-bold text-slate-900 mt-1">Rs. {payrollSummary.totalBasic.toLocaleString()}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Base contract commitments</div>
          </div>
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
            <div className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Total Allowances</div>
            <div className="text-xl font-bold text-emerald-900 mt-1">+ Rs. {payrollSummary.totalAllowances.toLocaleString()}</div>
            <div className="text-[11px] text-emerald-700 mt-0.5">Bonuses & Overtime</div>
          </div>
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4">
            <div className="text-xs font-bold text-rose-700 uppercase tracking-wider">Total Deductions</div>
            <div className="text-xl font-bold text-rose-900 mt-1">- Rs. {payrollSummary.totalDeductions.toLocaleString()}</div>
            <div className="text-[11px] text-rose-700 mt-0.5">Taxes & Advances</div>
          </div>
        </div>
      )}

      {activeReport === 'expense_analysis' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-rose-700 uppercase tracking-wider">Total Period Expenses</div>
              <div className="text-2xl font-black text-rose-950 mt-1">Rs. {expenseSummary.totalExpense.toLocaleString()}</div>
              <div className="text-[11px] text-rose-700 mt-0.5">{expenseSummary.count} expense vouchers logged</div>
            </div>
            <DollarSign className="w-8 h-8 text-rose-500 opacity-80" />
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-4 md:col-span-2">
            <div className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Expense Category Breakdown</div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {Object.entries(expenseSummary.byCategory).map(([cat, amt]) => (
                <div key={cat} className="bg-slate-50 p-2 rounded-xl border border-slate-200">
                  <div className="text-[10px] font-bold text-slate-500 uppercase">{cat}</div>
                  <div className="text-sm font-black text-slate-900">Rs. {amt.toLocaleString()}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeReport === 'current_stock' && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-slate-900 text-white border border-slate-800 rounded-2xl p-4">
            <div className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Total Inventory Items</div>
            <div className="text-2xl font-black text-white mt-1">{currentStockSummary.totalItems} Medicines</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Catalog SKUs</div>
          </div>
          <div className="bg-sky-50 border border-sky-200 rounded-2xl p-4">
            <div className="text-xs font-bold text-sky-700 uppercase tracking-wider">Total Units in Stock</div>
            <div className="text-2xl font-black text-sky-950 mt-1">{currentStockSummary.totalStockUnits.toLocaleString()}</div>
            <div className="text-[11px] text-sky-700 mt-0.5">Physical quantity in pharmacy</div>
          </div>
          <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4">
            <div className="text-xs font-bold text-indigo-700 uppercase tracking-wider">Total Purchase Valuation</div>
            <div className="text-2xl font-black text-indigo-950 mt-1">Rs. {currentStockSummary.totalPurchaseValuation.toLocaleString()}</div>
            <div className="text-[11px] text-indigo-700 mt-0.5">Based on cost price</div>
          </div>
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
            <div className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Total Retail Valuation</div>
            <div className="text-2xl font-black text-emerald-950 mt-1">Rs. {currentStockSummary.totalRetailValuation.toLocaleString()}</div>
            <div className="text-[11px] text-emerald-700 mt-0.5">Based on MRP sales price</div>
          </div>
        </div>
      )}

      {activeReport === 'minimum_stock' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-amber-800 uppercase tracking-wider">Total Low Stock Alerts</div>
              <div className="text-2xl font-black text-amber-950 mt-1">{minimumStockSummary.totalLowStock} Items</div>
              <div className="text-[11px] text-amber-700 mt-0.5">Stock is below minimum threshold</div>
            </div>
            <AlertTriangle className="w-8 h-8 text-amber-600 opacity-80" />
          </div>

          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-rose-800 uppercase tracking-wider">Critical Out-of-Stock</div>
              <div className="text-2xl font-black text-rose-950 mt-1">{minimumStockSummary.totalOut} Items</div>
              <div className="text-[11px] text-rose-700 mt-0.5">0 units available</div>
            </div>
            <AlertTriangle className="w-8 h-8 text-rose-600 opacity-80" />
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-blue-800 uppercase tracking-wider">Action Recommended</div>
              <div className="text-sm font-bold text-blue-900 mt-1">Generate Purchase Order immediately for low stock items</div>
              <div className="text-[11px] text-blue-700 mt-0.5">Prevent pharmacy stockouts</div>
            </div>
            <ShoppingCart className="w-8 h-8 text-blue-500 opacity-80" />
          </div>
        </div>
      )}

      {activeReport === 'required_stock' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4">
            <div className="text-xs font-bold text-indigo-800 uppercase tracking-wider">Items Requiring Reorder</div>
            <div className="text-2xl font-black text-indigo-950 mt-1">{requiredStockSummary.totalItemsToOrder} Medicines</div>
            <div className="text-[11px] text-indigo-700 mt-0.5">Need procurement</div>
          </div>

          <div className="bg-sky-50 border border-sky-200 rounded-2xl p-4">
            <div className="text-xs font-bold text-sky-800 uppercase tracking-wider">Total Quantity Needed</div>
            <div className="text-2xl font-black text-sky-950 mt-1">{requiredStockSummary.totalUnitsRequired.toLocaleString()} Units</div>
            <div className="text-[11px] text-sky-700 mt-0.5">Reorder target - Current stock</div>
          </div>

          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
            <div className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Est Capital Procurement Needed</div>
            <div className="text-2xl font-black text-emerald-950 mt-1">Rs. {requiredStockSummary.totalEstCapitalNeeded.toLocaleString()}</div>
            <div className="text-[11px] text-emerald-700 mt-0.5">Estimated PO investment</div>
          </div>
        </div>
      )}

      {/* DETAILED DATA TABLE / A4 REPORT CONTAINER */}
      <div className="bg-white rounded-2xl border border-slate-300 p-6 sm:p-8 shadow-sm space-y-6">
        {/* OFFICIAL A4 LETTERHEAD HEADER */}
        <div className="border-b-4 border-double border-slate-900 pb-4 mb-2 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3 text-center sm:text-left">
            <img src={clinicSettings?.ClinicLogoImage || '/nhc_logo.svg'} alt="Clinic Logo" className="w-16 h-16 object-contain" />
            <div>
              <h1 className="text-xl font-black text-rose-900 tracking-tight font-serif uppercase">
                {clinicSettings?.ClinicName || 'PUNJAB HOMEOPATHIC CLINIC'}
              </h1>
              <p className="text-[10px] font-extrabold text-rose-700 tracking-wider uppercase mt-0.5">
                HEALING NATURALLY. RESTORING BALANCE.
              </p>
              <div className="text-[11px] font-bold text-slate-800 mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                <span>{clinicSettings?.ClinicAddress || '10 Shalimar Road, Garhi Shahu, Lahore'}</span>
                <span className="text-slate-400">•</span>
                <a
                  href={`tel:${(clinicSettings?.PhoneMobile || '+92-311-4000608').replace(/[^0-9+]/g, '')}`}
                  className="text-emerald-800 hover:text-emerald-950 font-bold hover:underline inline-flex items-center gap-1"
                >
                  📞 {clinicSettings?.PhoneMobile || '+92-311-4000608'}
                </a>
                <span className="text-slate-400">•</span>
                <a
                  href={clinicSettings?.Website || 'https://punjabhomeopathic.pk'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-700 hover:text-blue-900 font-bold hover:underline inline-flex items-center gap-1"
                >
                  🌐 {(clinicSettings?.Website || 'https://punjabhomeopathic.pk').replace(/^https?:\/\//, '')}
                </a>
              </div>
              <p className="text-[9px] text-emerald-800 font-bold uppercase mt-1">
                Clinic Timings: Morning 8:30 AM to 12:00 PM &nbsp;|&nbsp; Evening 4:30 PM to 9:00 PM
              </p>
            </div>
          </div>
          <div className="text-center sm:text-right flex flex-col items-center sm:items-end">
            <span className="bg-slate-900 text-white font-black text-[10px] px-3 py-1 rounded-md uppercase tracking-wider shadow-xs">
              OFFICIAL FINANCIAL AUDIT REPORT
            </span>
            <p className="text-[10px] text-slate-500 font-mono font-bold mt-1">
              REF: PHC-RPT-{Date.now().toString().slice(-6)}
            </p>
            <p className="text-[10px] text-slate-600 font-bold mt-0.5">
              Period: {startDate} to {endDate}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
            <FileText className="w-4 h-4 text-indigo-600" />
            <span>
              {activeReport === 'pending_payments' && 'Pending Vendor Payments & Payable Balance Report'}
              {activeReport === 'payroll_disbursement' && 'Salary & Payroll Disbursement Records'}
              {activeReport === 'expense_analysis' && 'Operational Expense Analysis'}
              {activeReport === 'purchase_orders' && 'Purchase Orders & Inventory Procurement Audit'}
              {activeReport === 'current_stock' && 'Current Stock Inventory & Stock Valuation Audit'}
              {activeReport === 'minimum_stock' && 'Low Stock & Minimum Inventory Alert List'}
              {activeReport === 'required_stock' && 'Required Stock Requisition & Quantity Calculation'}
              {activeReport === 'pnl_summary' && 'Executive Profit & Loss Financial Summary'}
              {activeReport === 'shift_collection_summary' && 'Shift-Wise Collection & Revenue Summary Statement'}
            </span>
          </h3>

          <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
            Period: {startDate} to {endDate}
          </span>
        </div>

        {/* REPORT TABLE 1: PENDING PAYMENTS */}
        {activeReport === 'pending_payments' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                  <th className="p-3">Vendor ID</th>
                  <th className="p-3">Vendor / Supplier Name</th>
                  <th className="p-3">Contact Person</th>
                  <th className="p-3">Phone</th>
                  <th className="p-3 text-right">Total GRN Bills</th>
                  <th className="p-3 text-right">Total Paid</th>
                  <th className="p-3 text-right">Pending Balance</th>
                  <th className="p-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {pendingPaymentsData.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-6 text-center text-slate-400 font-medium">
                      No vendor payments or dues found for the selected search filter.
                    </td>
                  </tr>
                ) : (
                  pendingPaymentsData.map((v, idx) => (
                    <tr key={v._id || v.VendorID || idx} className="hover:bg-slate-50">
                      <td className="p-3 font-mono font-bold text-indigo-600">{v.VendorID}</td>
                      <td className="p-3 font-bold text-slate-900">{v.VendorName}</td>
                      <td className="p-3 text-slate-600">{v.ContactPerson || 'N/A'}</td>
                      <td className="p-3 text-slate-500 font-mono">{v.Phone}</td>
                      <td className="p-3 text-right text-slate-700">Rs. {v.totalGrnBills.toLocaleString()}</td>
                      <td className="p-3 text-right text-emerald-600">Rs. {v.totalPaid.toLocaleString()}</td>
                      <td className={`p-3 text-right font-black ${v.pendingBalance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                        Rs. {v.pendingBalance.toLocaleString()}
                      </td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          v.pendingBalance > 0 ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {v.pendingBalance > 0 ? 'PAYABLE DUE' : 'CLEAR'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* REPORT TABLE 2: PAYROLL DISBURSEMENT */}
        {activeReport === 'payroll_disbursement' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                  <th className="p-3">Payroll ID</th>
                  <th className="p-3">Employee Name</th>
                  <th className="p-3">Period</th>
                  <th className="p-3 text-right">Basic Salary</th>
                  <th className="p-3 text-right">Allowances</th>
                  <th className="p-3 text-right">Deductions</th>
                  <th className="p-3 text-right">Net Disbursed</th>
                  <th className="p-3 text-center">Method</th>
                  <th className="p-3 text-center">Payment Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {payrollData.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-6 text-center text-slate-400 font-medium">
                      No payroll disbursement records found for period ({startDate} to {endDate}).
                    </td>
                  </tr>
                ) : (
                  payrollData.map((p, idx) => (
                    <tr key={p._id || p.PayrollID || idx} className="hover:bg-slate-50">
                      <td className="p-3 font-mono font-bold text-indigo-600">{p.PayrollID}</td>
                      <td className="p-3 font-bold text-slate-900">{p.EmployeeName}</td>
                      <td className="p-3 text-slate-600 font-bold">{p.MonthYear}</td>
                      <td className="p-3 text-right text-slate-700">Rs. {p.BasicSalary.toLocaleString()}</td>
                      <td className="p-3 text-right text-emerald-600">+ Rs. {p.Allowances.toLocaleString()}</td>
                      <td className="p-3 text-right text-rose-600">- Rs. {p.Deductions.toLocaleString()}</td>
                      <td className="p-3 text-right font-black text-slate-900">Rs. {p.NetSalary.toLocaleString()}</td>
                      <td className="p-3 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                          {p.PaymentMethod || 'Cash'}
                        </span>
                      </td>
                      <td className="p-3 text-center text-slate-600">{p.PaymentDate || 'N/A'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* REPORT TABLE 3: EXPENSE ANALYSIS */}
        {activeReport === 'expense_analysis' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                  <th className="p-3">Expense ID</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Description</th>
                  <th className="p-3 text-center">Expense Date</th>
                  <th className="p-3 text-center">Payment Method</th>
                  <th className="p-3 text-center">Receipt Ref</th>
                  <th className="p-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {expenseData.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-6 text-center text-slate-400 font-medium">
                      No expense records found for period ({startDate} to {endDate}).
                    </td>
                  </tr>
                ) : (
                  expenseData.map((e, idx) => (
                    <tr key={e._id || e.ExpenseID || idx} className="hover:bg-slate-50">
                      <td className="p-3 font-mono font-bold text-rose-600">{e.ExpenseID}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          {e.Category}
                        </span>
                      </td>
                      <td className="p-3 font-bold text-slate-800">{e.Description}</td>
                      <td className="p-3 text-center text-slate-600">{e.ExpenseDate}</td>
                      <td className="p-3 text-center text-slate-600">{e.PaymentMethod}</td>
                      <td className="p-3 text-center font-mono text-slate-500">{e.ReceiptRef || 'N/A'}</td>
                      <td className="p-3 text-right font-black text-rose-700">Rs. {e.Amount.toLocaleString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* REPORT TABLE 4: PURCHASE ORDERS */}
        {activeReport === 'purchase_orders' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                  <th className="p-3">PO ID</th>
                  <th className="p-3">Supplier / Vendor</th>
                  <th className="p-3 text-center">Order Date</th>
                  <th className="p-3 text-center">Expected Delivery</th>
                  <th className="p-3 text-center">Items Count</th>
                  <th className="p-3 text-right">Total Amount</th>
                  <th className="p-3 text-center">PO Status</th>
                  <th className="p-3 text-center">GRN Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {poData.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-6 text-center text-slate-400 font-medium">
                      No Purchase Orders found for period ({startDate} to {endDate}).
                    </td>
                  </tr>
                ) : (
                  poData.map((p, idx) => (
                    <tr key={p._id || p.POID || idx} className="hover:bg-slate-50">
                      <td className="p-3">
                        <div className="flex items-center space-x-1.5">
                          <span className="font-mono font-bold text-indigo-600">{p.POID}</span>
                          {(p.PaymentMethod === 'Cash' || (p as any).PaymentTerms === 'Cash') ? (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">CASH</span>
                          ) : (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-indigo-100 text-indigo-800 border border-indigo-200">CREDIT</span>
                          )}
                        </div>
                      </td>
                      <td className="p-3 font-bold text-slate-900">{p.VendorName}</td>
                      <td className="p-3 text-center text-slate-600">{p.OrderDate}</td>
                      <td className="p-3 text-center text-slate-600">{p.ExpectedDeliveryDate || 'N/A'}</td>
                      <td className="p-3 text-center font-bold text-slate-700">{p.Items?.length || 0}</td>
                      <td className="p-3 text-right font-black text-slate-900">Rs. {p.TotalAmount.toLocaleString()}</td>
                      <td className="p-3 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                          {p.Status}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        {p.linkedGrn ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            GRN #{p.linkedGrn.GRNID} Approved
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                            Pending GRN
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* REPORT TABLE 5: CURRENT STOCK */}
        {activeReport === 'current_stock' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                  <th className="p-3">Item ID</th>
                  <th className="p-3">Medicine / Item Name</th>
                  <th className="p-3">Category</th>
                  <th className="p-3 text-center">Current Stock</th>
                  <th className="p-3 text-right">Purchase Price</th>
                  <th className="p-3 text-right">Retail Sale Price</th>
                  <th className="p-3 text-right">Stock Valuation (Cost)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {currentStockData.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-6 text-center text-slate-400 font-medium">
                      No inventory medicines found matching search query.
                    </td>
                  </tr>
                ) : (
                  currentStockData.map((i, idx) => {
                    const cStock = getItemStock(i);
                    const pPrice = Number(i.PurchasePrice ?? i.purchasePrice ?? i.Price ?? i.price ?? 0);
                    const val = cStock * pPrice;
                    return (
                      <tr key={i._id || i.ItemID || idx} className="hover:bg-slate-50">
                        <td className="p-3 font-mono font-bold text-slate-700">{i.ItemID || i._id}</td>
                        <td className="p-3 font-bold text-slate-900">{i.ItemName || i.name}</td>
                        <td className="p-3 text-slate-600 font-semibold">{getItemCategory(i)}</td>
                        <td className="p-3 text-center font-bold text-indigo-700">{cStock} {i.Unit || 'Units'}</td>
                        <td className="p-3 text-right text-slate-600">Rs. {pPrice.toLocaleString()}</td>
                        <td className="p-3 text-right text-emerald-600 font-bold">Rs. {(Number(i.Price ?? i.price) || 0).toLocaleString()}</td>
                        <td className="p-3 text-right font-black text-sky-900">Rs. {val.toLocaleString()}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
              <tfoot className="bg-slate-100 border-t-2 border-slate-300 font-extrabold text-slate-900">
                <tr>
                  <td colSpan={3} className="p-3.5 text-right font-black uppercase text-xs tracking-wider text-slate-800">
                    Grand Total ({currentStockSummary.totalItems} Medicines):
                  </td>
                  <td className="p-3.5 text-center font-black font-mono text-xs text-indigo-700">
                    {currentStockSummary.totalStockUnits.toLocaleString()} Units
                  </td>
                  <td className="p-3.5 text-right font-black font-mono text-xs text-slate-900">
                    Rs. {currentStockSummary.totalPurchasePriceSum.toLocaleString()}
                  </td>
                  <td className="p-3.5 text-right font-black font-mono text-xs text-emerald-700">
                    Rs. {currentStockSummary.totalRetailPriceSum.toLocaleString()}
                  </td>
                  <td className="p-3.5 text-right font-black font-mono text-xs text-sky-900 bg-sky-50/70">
                    Rs. {currentStockSummary.totalPurchaseValuation.toLocaleString()}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {/* REPORT TABLE 6: MINIMUM STOCK ALERT */}
        {activeReport === 'minimum_stock' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                  <th className="p-3">Item ID</th>
                  <th className="p-3">Medicine Name</th>
                  <th className="p-3">Category</th>
                  <th className="p-3 text-center">Current Stock</th>
                  <th className="p-3 text-center">Min Threshold</th>
                  <th className="p-3 text-center">Deficit Units</th>
                  <th className="p-3 text-center">Stock Alert Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {minimumStockData.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-6 text-center text-emerald-600 font-bold py-8">
                      <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-500" />
                      All inventory items are currently above their minimum threshold level!
                    </td>
                  </tr>
                ) : (
                  minimumStockData.map((i, idx) => {
                    const cStock = getItemStock(i);
                    const minStock = getItemMinStock(i);
                    const deficit = Math.max(0, minStock - cStock);
                    const isOut = cStock === 0;
                    return (
                      <tr key={i._id || i.ItemID || idx} className="hover:bg-slate-50">
                        <td className="p-3 font-mono font-bold text-slate-700">{i.ItemID || i._id}</td>
                        <td className="p-3 font-bold text-slate-900">{i.ItemName || i.name}</td>
                        <td className="p-3 text-slate-600 font-semibold">{getItemCategory(i)}</td>
                        <td className={`p-3 text-center font-black ${isOut ? 'text-rose-600' : 'text-amber-600'}`}>{cStock}</td>
                        <td className="p-3 text-center text-slate-600">{minStock}</td>
                        <td className="p-3 text-center font-bold text-rose-600">+ {deficit}</td>
                        <td className="p-3 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isOut ? 'bg-rose-100 text-rose-800 border border-rose-300' : 'bg-amber-100 text-amber-800 border border-amber-300'
                          }`}>
                            {isOut ? 'OUT OF STOCK' : 'LOW STOCK ALERT'}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* REPORT TABLE 7: REQUIRED STOCK REQUISITION */}
        {activeReport === 'required_stock' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                  <th className="p-3">Item ID</th>
                  <th className="p-3">Medicine Name</th>
                  <th className="p-3">Category</th>
                  <th className="p-3 text-center">Current Stock</th>
                  <th className="p-3 text-center">Target Reorder Qty</th>
                  <th className="p-3 text-center">Required Qty to Order</th>
                  <th className="p-3 text-right">Unit Purchase Cost</th>
                  <th className="p-3 text-right">Est. Total Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {requiredStockData.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-6 text-center text-emerald-600 font-bold py-8">
                      <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-500" />
                      No stock reorders required at this moment.
                    </td>
                  </tr>
                ) : (
                  requiredStockData.map((i, idx) => (
                    <tr key={i._id || i.ItemID || idx} className="hover:bg-slate-50">
                      <td className="p-3 font-mono font-bold text-slate-700">{i.ItemID || i._id}</td>
                      <td className="p-3 font-bold text-slate-900">{i.ItemName || i.name}</td>
                      <td className="p-3 text-slate-600 font-semibold">{getItemCategory(i)}</td>
                      <td className="p-3 text-center font-bold text-slate-600">{i.cStock}</td>
                      <td className="p-3 text-center font-bold text-slate-600">{i.reorderTarget}</td>
                      <td className="p-3 text-center font-black text-indigo-700 bg-indigo-50/50">{i.requiredQty} Units</td>
                      <td className="p-3 text-right text-slate-600">Rs. {i.unitCost.toLocaleString()}</td>
                      <td className="p-3 text-right font-black text-indigo-900">Rs. {i.estCost.toLocaleString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* REPORT TABLE 8: P&L SUMMARY STATEMENT */}
        {activeReport === 'pnl_summary' && (
          <div className="space-y-6 pt-2">
            {/* EXECUTIVE FINANCIAL KPI CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50/60 border border-emerald-200/80 rounded-2xl p-4 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">Total Gross Revenue</span>
                  <div className="p-1.5 bg-emerald-600 text-white rounded-lg">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-black text-emerald-950 mt-2">
                  Rs. {pnlSummaryData.totalIncome.toLocaleString()}
                </div>
                <div className="text-[11px] font-medium text-emerald-700 mt-1 flex items-center gap-1.5">
                  <span>OPD: Rs. {pnlSummaryData.totalOpdIncome.toLocaleString()}</span>
                  <span>•</span>
                  <span>POS: Rs. {pnlSummaryData.netPosIncome.toLocaleString()}</span>
                </div>
              </div>

              <div className="bg-gradient-to-br from-rose-50 to-amber-50/60 border border-rose-200/80 rounded-2xl p-4 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-rose-800 uppercase tracking-wider">Total Outflows & Costs</span>
                  <div className="p-1.5 bg-rose-600 text-white rounded-lg">
                    <TrendingDown className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-black text-rose-950 mt-2">
                  Rs. {pnlSummaryData.totalExpenses.toLocaleString()}
                </div>
                <div className="text-[11px] font-medium text-rose-700 mt-1">
                  Operating Ratio: <span className="font-bold">{pnlSummaryData.expenseRatio.toFixed(1)}%</span> of Revenue
                </div>
              </div>

              <div className={`border rounded-2xl p-4 shadow-xs ${
                pnlSummaryData.netProfit >= 0
                  ? 'bg-gradient-to-br from-emerald-600 to-teal-700 text-white border-emerald-700'
                  : 'bg-gradient-to-br from-rose-600 to-amber-700 text-white border-rose-700'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider opacity-90">Net Operating Result</span>
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-white/20 uppercase">
                    {pnlSummaryData.netProfit >= 0 ? 'Surplus' : 'Deficit'}
                  </span>
                </div>
                <div className="text-2xl font-black mt-2">
                  {pnlSummaryData.netProfit >= 0 ? 'Rs. ' + pnlSummaryData.netProfit.toLocaleString() : '- Rs. ' + Math.abs(pnlSummaryData.netProfit).toLocaleString()}
                </div>
                <div className="text-[11px] font-semibold mt-1 opacity-90">
                  Net Margin: <span className="font-bold">{pnlSummaryData.netMarginPct.toFixed(1)}%</span>
                </div>
              </div>

              <div className="bg-gradient-to-br from-indigo-50 to-blue-50/60 border border-indigo-200/80 rounded-2xl p-4 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-indigo-800 uppercase tracking-wider">Pharmacy COGS & Margin</span>
                  <div className="p-1.5 bg-indigo-600 text-white rounded-lg">
                    <Package className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-black text-indigo-950 mt-2">
                  Rs. {(pnlSummaryData.pharmacyCogs || 0).toLocaleString()}
                </div>
                <div className="text-[11px] font-medium text-indigo-700 mt-1 flex items-center justify-between">
                  <span>Gross Margin:</span>
                  <span className="font-bold text-indigo-900 bg-indigo-100 px-1.5 py-0.5 rounded-md">
                    {(pnlSummaryData.pharmacyMarginPct || 0).toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* REVENUES / INFLOWS */}
              <div className="bg-emerald-50/40 border border-emerald-200/80 rounded-2xl p-5 space-y-4 shadow-xs">
                <div className="flex items-center justify-between border-b border-emerald-200 pb-2.5">
                  <h4 className="font-black text-emerald-950 text-sm flex items-center space-x-2">
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                    <span>Inflows & Revenue Streams</span>
                  </h4>
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-md">Realized Inflows</span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between p-2.5 bg-white rounded-xl border border-emerald-100 hover:border-emerald-200 transition">
                    <span className="font-medium text-slate-700">OPD Patient Consultation Fees</span>
                    <span className="font-bold text-slate-900">Rs. {(pnlSummaryData.opdConsultationFees || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between p-2.5 bg-white rounded-xl border border-emerald-100 hover:border-emerald-200 transition">
                    <span className="font-medium text-slate-700">OPD Card / Registration Fees</span>
                    <span className="font-bold text-slate-900">Rs. {(pnlSummaryData.opdCardFees || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between p-2.5 bg-white rounded-xl border border-emerald-100 hover:border-emerald-200 transition">
                    <span className="font-medium text-slate-700">Clinical Dispensing / Procedure Fees</span>
                    <span className="font-bold text-slate-900">Rs. {(pnlSummaryData.opdDispensingFees || 0).toLocaleString()}</span>
                  </div>
                  {pnlSummaryData.standaloneApptFees > 0 && (
                    <div className="flex justify-between p-2.5 bg-white rounded-xl border border-emerald-100 hover:border-emerald-200 transition">
                      <span className="font-medium text-slate-700">Standalone Token / Booking Fees</span>
                      <span className="font-bold text-slate-900">Rs. {pnlSummaryData.standaloneApptFees.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between p-2.5 bg-emerald-50 rounded-xl border border-emerald-200 font-bold text-emerald-900">
                    <span>Subtotal Clinical OPD Inflows</span>
                    <span>Rs. {pnlSummaryData.totalOpdIncome.toLocaleString()}</span>
                  </div>

                  <div className="pt-2 border-t border-emerald-200/60"></div>

                  <div className="flex justify-between p-2.5 bg-white rounded-xl border border-emerald-100 hover:border-emerald-200 transition">
                    <span className="font-medium text-slate-700">Gross POS Pharmacy Counter Sales</span>
                    <span className="font-bold text-slate-900">Rs. {(pnlSummaryData.grossPosSales || pnlSummaryData.posIncome).toLocaleString()}</span>
                  </div>
                  {pnlSummaryData.totalSalesReturns > 0 && (
                    <div className="flex justify-between p-2.5 bg-white rounded-xl border border-rose-100 text-rose-700 hover:border-rose-200 transition">
                      <span className="font-medium">Less: Customer Sales Returns / Refunds</span>
                      <span className="font-bold">- Rs. {pnlSummaryData.totalSalesReturns.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between p-2.5 bg-emerald-50 rounded-xl border border-emerald-200 font-bold text-emerald-900">
                    <span>Net Pharmacy Realized Revenue</span>
                    <span>Rs. {pnlSummaryData.netPosIncome.toLocaleString()}</span>
                  </div>

                  <div className="pt-2 border-t border-emerald-200/60"></div>

                  <div className="flex justify-between p-2.5 bg-white rounded-xl border border-emerald-100 hover:border-emerald-200 transition">
                    <span className="font-medium text-slate-700">Other Direct Income / Cash Receipts</span>
                    <span className="font-bold text-slate-900">Rs. {pnlSummaryData.otherIncome.toLocaleString()}</span>
                  </div>

                  <div className="flex justify-between p-3.5 bg-gradient-to-r from-emerald-600 to-teal-700 text-white rounded-xl font-black text-sm shadow-xs mt-3">
                    <span>TOTAL GROSS INFLOWS</span>
                    <span>Rs. {pnlSummaryData.totalIncome.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* EXPENSES / OUTFLOWS */}
              <div className="bg-rose-50/40 border border-rose-200/80 rounded-2xl p-5 space-y-4 shadow-xs">
                <div className="flex items-center justify-between border-b border-rose-200 pb-2.5">
                  <h4 className="font-black text-rose-950 text-sm flex items-center space-x-2">
                    <TrendingDown className="w-4 h-4 text-rose-600" />
                    <span>Outflows & Operating Expenses</span>
                  </h4>
                  <span className="text-[11px] font-bold text-rose-700 bg-rose-100/80 px-2 py-0.5 rounded-md">Total Disbursements</span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between p-2.5 bg-white rounded-xl border border-rose-100 hover:border-rose-200 transition">
                    <span className="font-medium text-slate-700">Vendor Payments & Inventory Procurements</span>
                    <span className="font-bold text-slate-900">Rs. {pnlSummaryData.vendorOutflows.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between p-2.5 bg-white rounded-xl border border-rose-100 hover:border-rose-200 transition">
                    <span className="font-medium text-slate-700">Staff Salaries & Payroll Disbursements</span>
                    <span className="font-bold text-slate-900">Rs. {pnlSummaryData.salaryOutflows.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between p-2.5 bg-white rounded-xl border border-rose-100 hover:border-rose-200 transition">
                    <span className="font-medium text-slate-700">Operational, Clinic & Building Expenses</span>
                    <span className="font-bold text-slate-900">Rs. {pnlSummaryData.totalOperatingExpenses.toLocaleString()}</span>
                  </div>

                  <div className="pt-2 border-t border-rose-200/60"></div>

                  <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1.5 text-[11px]">
                    <div className="flex justify-between text-slate-600">
                      <span>Calculated Pharmacy COGS (Cost of Goods):</span>
                      <span className="font-bold text-slate-900">Rs. {(pnlSummaryData.pharmacyCogs || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Pharmacy Gross Realized Margin:</span>
                      <span className="font-bold text-emerald-600">{(pnlSummaryData.pharmacyMarginPct || 0).toFixed(1)}%</span>
                    </div>
                  </div>

                  <div className="flex justify-between p-3.5 bg-gradient-to-r from-rose-600 to-amber-700 text-white rounded-xl font-black text-sm shadow-xs mt-3">
                    <span>TOTAL GROSS OUTFLOWS</span>
                    <span>Rs. {pnlSummaryData.totalExpenses.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* NET RESULT BANNER */}
            <div className={`p-6 rounded-2xl border flex flex-col sm:flex-row items-center justify-between text-center sm:text-left gap-4 shadow-sm ${
              pnlSummaryData.netProfit >= 0
                ? 'bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white border-emerald-700'
                : 'bg-gradient-to-r from-rose-900 via-amber-900 to-slate-900 text-white border-rose-700'
            }`}>
              <div>
                <div className="text-xs font-bold text-emerald-300 uppercase tracking-wider">NET OPERATING FINANCIAL RESULT</div>
                <div className="text-3xl font-black mt-1">
                  {pnlSummaryData.netProfit >= 0 ? 'NET PROFIT: Rs. ' + pnlSummaryData.netProfit.toLocaleString() : 'NET LOSS: - Rs. ' + Math.abs(pnlSummaryData.netProfit).toLocaleString()}
                </div>
                <div className="text-xs text-slate-300 mt-1 flex items-center gap-2">
                  <span>Calculated for period: {startDate} to {endDate}</span>
                  <span>•</span>
                  <span>Net Margin: {pnlSummaryData.netMarginPct.toFixed(1)}%</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handlePrintReport}
                  className="px-5 py-2.5 bg-white text-slate-900 hover:bg-slate-100 font-bold text-xs rounded-xl shadow-md transition flex items-center space-x-2 cursor-pointer"
                >
                  <Printer className="w-4 h-4 text-indigo-600" />
                  <span>Print Official P&L Statement</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* REPORT TABLE 9: SHIFT-WISE COLLECTION SUMMARY */}
        {activeReport === 'shift_collection_summary' && (
          <div className="space-y-6 pt-2">
            {/* KPI SUMMARY CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* MORNING SHIFT SUMMARY CARD */}
              <div className="bg-blue-50/80 border border-blue-200 rounded-2xl p-5 space-y-3 shadow-xs">
                <div className="flex items-center justify-between border-b border-blue-200/80 pb-2">
                  <div className="flex items-center space-x-2">
                    <span className="p-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold">🌅</span>
                    <h4 className="font-extrabold text-blue-950 text-sm">Morning Shift Collection</h4>
                  </div>
                  <span className="text-[10px] font-extrabold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full uppercase">Shift 1</span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between p-2.5 bg-white rounded-xl border border-blue-100">
                    <span className="font-medium text-slate-700">Clinic OPD / Consultation</span>
                    <span className="font-bold text-slate-900">Rs. {shiftCollectionData.totalMorningClinic.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between p-2.5 bg-white rounded-xl border border-blue-100">
                    <span className="font-medium text-slate-700">Pharmacy Store Sales</span>
                    <span className="font-bold text-slate-900">Rs. {shiftCollectionData.totalMorningStore.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between p-3 bg-blue-600 text-white rounded-xl font-extrabold text-sm shadow-xs">
                    <span>Morning Shift Total</span>
                    <span>Rs. {shiftCollectionData.totalMorning.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* EVENING SHIFT SUMMARY CARD */}
              <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-5 space-y-3 shadow-xs">
                <div className="flex items-center justify-between border-b border-amber-200/80 pb-2">
                  <div className="flex items-center space-x-2">
                    <span className="p-1.5 bg-amber-600 text-white rounded-lg text-xs font-bold">🌆</span>
                    <h4 className="font-extrabold text-amber-950 text-sm">Evening Shift Collection</h4>
                  </div>
                  <span className="text-[10px] font-extrabold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full uppercase">Shift 2</span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between p-2.5 bg-white rounded-xl border border-amber-100">
                    <span className="font-medium text-slate-700">Clinic OPD / Consultation</span>
                    <span className="font-bold text-slate-900">Rs. {shiftCollectionData.totalEveningClinic.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between p-2.5 bg-white rounded-xl border border-amber-100">
                    <span className="font-medium text-slate-700">Pharmacy Store Sales</span>
                    <span className="font-bold text-slate-900">Rs. {shiftCollectionData.totalEveningStore.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between p-3 bg-amber-600 text-white rounded-xl font-extrabold text-sm shadow-xs">
                    <span>Evening Shift Total</span>
                    <span>Rs. {shiftCollectionData.totalEvening.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* COMBINED GRAND TOTAL CARD */}
              <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-5 space-y-3 shadow-xs">
                <div className="flex items-center justify-between border-b border-emerald-200/80 pb-2">
                  <div className="flex items-center space-x-2">
                    <span className="p-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold">💰</span>
                    <h4 className="font-extrabold text-emerald-950 text-sm">Combined Period Total</h4>
                  </div>
                  <span className="text-[10px] font-extrabold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full uppercase">All Shifts</span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between p-2.5 bg-white rounded-xl border border-emerald-100">
                    <span className="font-medium text-slate-700">Total Clinic Revenue</span>
                    <span className="font-bold text-slate-900">Rs. {(shiftCollectionData.totalMorningClinic + shiftCollectionData.totalEveningClinic).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between p-2.5 bg-white rounded-xl border border-emerald-100">
                    <span className="font-medium text-slate-700">Total Pharmacy Sales</span>
                    <span className="font-bold text-slate-900">Rs. {(shiftCollectionData.totalMorningStore + shiftCollectionData.totalEveningStore).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between p-3 bg-emerald-700 text-white rounded-xl font-black text-sm shadow-xs">
                    <span>Period Grand Total</span>
                    <span>Rs. {shiftCollectionData.grandTotal.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* DETAILED DAILY BREAKDOWN TABLE */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm text-white">Daily Shift-Wise Revenue Breakdown</h4>
                  <p className="text-xs text-slate-300">Detailed day-by-day record of Morning vs Evening collections for Clinic OPD and Store Sales</p>
                </div>
                <span className="text-xs font-bold text-slate-300 bg-slate-800 px-3 py-1 rounded-full border border-slate-700">
                  {filteredShiftCollectionRows.length} Days Found
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-800 font-extrabold border-b border-slate-300 text-[11px] uppercase">
                      <th className="p-3 border-r border-slate-200" rowSpan={2}>Date</th>
                      <th className="p-2 text-center bg-blue-100/70 border-r border-slate-200 text-blue-900" colSpan={3}>🌅 Morning Shift (Shift 1)</th>
                      <th className="p-2 text-center bg-amber-100/70 border-r border-slate-200 text-amber-900" colSpan={3}>🌆 Evening Shift (Shift 2)</th>
                      <th className="p-3 text-right bg-emerald-100/70 text-emerald-950 font-black" rowSpan={2}>Combined Daily Total</th>
                    </tr>
                    <tr className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 text-[10px] uppercase">
                      <th className="p-2 text-right bg-blue-50/50">Clinic OPD</th>
                      <th className="p-2 text-right bg-blue-50/50">Store Sales</th>
                      <th className="p-2 text-right bg-blue-100/50 font-extrabold text-blue-900 border-r border-slate-200">Shift Total</th>
                      <th className="p-2 text-right bg-amber-50/50">Clinic OPD</th>
                      <th className="p-2 text-right bg-amber-50/50">Store Sales</th>
                      <th className="p-2 text-right bg-amber-100/50 font-extrabold text-amber-900 border-r border-slate-200">Shift Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-medium text-slate-800">
                    {filteredShiftCollectionRows.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="p-8 text-center text-slate-400 italic">
                          No collection records found for the selected date range.
                        </td>
                      </tr>
                    ) : (
                      filteredShiftCollectionRows.map((r, idx) => (
                        <tr key={r.date} className={idx % 2 === 0 ? 'bg-white hover:bg-slate-50/80' : 'bg-slate-50/50 hover:bg-slate-100/50'}>
                          <td className="p-3 font-bold text-slate-900 border-r border-slate-100">{r.date}</td>
                          <td className="p-2 text-right text-slate-700">Rs. {r.morningClinic.toLocaleString()}</td>
                          <td className="p-2 text-right text-slate-700">Rs. {r.morningStore.toLocaleString()}</td>
                          <td className="p-2 text-right font-extrabold text-blue-950 bg-blue-50/40 border-r border-slate-100">
                            Rs. {r.morningTotal.toLocaleString()}
                          </td>
                          <td className="p-2 text-right text-slate-700">Rs. {r.eveningClinic.toLocaleString()}</td>
                          <td className="p-2 text-right text-slate-700">Rs. {r.eveningStore.toLocaleString()}</td>
                          <td className="p-2 text-right font-extrabold text-amber-950 bg-amber-50/40 border-r border-slate-100">
                            Rs. {r.eveningTotal.toLocaleString()}
                          </td>
                          <td className="p-3 text-right font-black text-emerald-700 bg-emerald-50/30">
                            Rs. {r.dailyTotal.toLocaleString()}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-900 text-white font-extrabold text-xs">
                      <td className="p-3 uppercase tracking-wider">Grand Totals</td>
                      <td className="p-2 text-right text-slate-200">Rs. {shiftCollectionData.totalMorningClinic.toLocaleString()}</td>
                      <td className="p-2 text-right text-slate-200">Rs. {shiftCollectionData.totalMorningStore.toLocaleString()}</td>
                      <td className="p-2 text-right font-black text-blue-300 bg-slate-800">Rs. {shiftCollectionData.totalMorning.toLocaleString()}</td>
                      <td className="p-2 text-right text-slate-200">Rs. {shiftCollectionData.totalEveningClinic.toLocaleString()}</td>
                      <td className="p-2 text-right text-slate-200">Rs. {shiftCollectionData.totalEveningStore.toLocaleString()}</td>
                      <td className="p-2 text-right font-black text-amber-300 bg-slate-800">Rs. {shiftCollectionData.totalEvening.toLocaleString()}</td>
                      <td className="p-3 text-right font-black text-emerald-400 bg-slate-950 text-sm">
                        Rs. {shiftCollectionData.grandTotal.toLocaleString()}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* REPORT TABLE 10: FOC CASES SUMMARY */}
        {activeReport === 'foc_cases_summary' && (
          <div className="space-y-6 pt-2">
            {/* KPI SUMMARY CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-purple-600 uppercase tracking-wider">Total FOC Patients</div>
                  <div className="text-2xl font-black text-purple-900 mt-1">{focReportData.totalCount} Visits</div>
                  <div className="text-[11px] font-medium text-purple-700 mt-0.5">Free consultations & waivers</div>
                </div>
                <HeartHandshake className="w-8 h-8 text-purple-500 opacity-80" />
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-amber-600 uppercase tracking-wider">Waived OPD Fees</div>
                  <div className="text-2xl font-black text-amber-900 mt-1">Rs. {focReportData.totalOpdWaived.toLocaleString()}</div>
                  <div className="text-[11px] font-medium text-amber-700 mt-0.5">Consultation fees exempted</div>
                </div>
                <Users className="w-8 h-8 text-amber-500 opacity-80" />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-blue-600 uppercase tracking-wider">Waived Medicine / Cards</div>
                  <div className="text-2xl font-black text-blue-900 mt-1">Rs. {(focReportData.totalClinWaived + focReportData.totalFileCardWaived).toLocaleString()}</div>
                  <div className="text-[11px] font-medium text-blue-700 mt-0.5">Meds (Rs. {focReportData.totalClinWaived.toLocaleString()}) + Card/File</div>
                </div>
                <Boxes className="w-8 h-8 text-blue-500 opacity-80" />
              </div>

              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Total Financial Waived</div>
                  <div className="text-2xl font-black text-emerald-900 mt-1">Rs. {focReportData.grandTotalWaived.toLocaleString()}</div>
                  <div className="text-[11px] font-medium text-emerald-700 mt-0.5">Total welfare assistance provided</div>
                </div>
                <DollarSign className="w-8 h-8 text-emerald-500 opacity-80" />
              </div>
            </div>

            {/* DETAILED FOC PATIENTS TABLE */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 bg-purple-900 text-white flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm text-white">Free of Charge (FOC) Patient Visits Register</h4>
                  <p className="text-xs text-purple-200">Detailed list of free consultations, waived fees, and reasons recorded during the selected period</p>
                </div>
                <span className="text-xs font-bold text-purple-200 bg-purple-800 px-3 py-1 rounded-full border border-purple-700">
                  {filteredFocRows.length} Records Found
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-800 font-extrabold border-b border-slate-300 text-[11px] uppercase">
                      <th className="p-3 border-r border-slate-200">Date</th>
                      <th className="p-3 border-r border-slate-200">Patient ID</th>
                      <th className="p-3 border-r border-slate-200">Patient Name</th>
                      <th className="p-3 border-r border-slate-200">Phone</th>
                      <th className="p-3 border-r border-slate-200">Diagnosis / Symptoms</th>
                      <th className="p-3 text-right border-r border-slate-200">Waived OPD</th>
                      <th className="p-3 text-right border-r border-slate-200">Waived Meds</th>
                      <th className="p-3 text-right border-r border-slate-200">Waived File/Card</th>
                      <th className="p-3 text-right border-r border-slate-200 text-purple-900 font-black">Total Waived</th>
                      <th className="p-3">Category / Reason</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-medium text-slate-800">
                    {filteredFocRows.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="p-8 text-center text-slate-400 italic">
                          No FOC Case visits recorded for the selected date range.
                        </td>
                      </tr>
                    ) : (
                      filteredFocRows.map((r, idx) => (
                        <tr key={r.visitId + idx} className={idx % 2 === 0 ? 'bg-white hover:bg-slate-50/80' : 'bg-slate-50/50 hover:bg-slate-100/50'}>
                          <td className="p-3 font-bold text-slate-900 border-r border-slate-100">{r.date}</td>
                          <td className="p-3 font-mono font-bold text-slate-600 border-r border-slate-100">{r.patientId}</td>
                          <td className="p-3 font-bold text-slate-900 border-r border-slate-100">{r.patientName}</td>
                          <td className="p-3 text-slate-600 border-r border-slate-100 font-mono">{r.phone}</td>
                          <td className="p-3 text-slate-700 border-r border-slate-100">{r.symptoms}</td>
                          <td className="p-3 text-right text-slate-700 font-mono">Rs. {r.opdWaived.toLocaleString()}</td>
                          <td className="p-3 text-right text-slate-700 font-mono">Rs. {r.clinWaived.toLocaleString()}</td>
                          <td className="p-3 text-right text-slate-700 font-mono">Rs. {r.fileCardWaived.toLocaleString()}</td>
                          <td className="p-3 text-right font-black text-purple-900 bg-purple-50/50 border-r border-slate-100 font-mono">
                            Rs. {r.totalWaived.toLocaleString()}
                          </td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 text-[10px] font-extrabold rounded-md bg-purple-100 text-purple-800 border border-purple-200 inline-block">
                              {r.reason}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  <tfoot>
                    <tr className="bg-purple-950 text-white font-extrabold text-xs">
                      <td className="p-3 uppercase tracking-wider" colSpan={5}>
                        Grand Totals ({focReportData.totalCount} FOC Patients)
                      </td>
                      <td className="p-3 text-right text-purple-200 font-mono">Rs. {focReportData.totalOpdWaived.toLocaleString()}</td>
                      <td className="p-3 text-right text-purple-200 font-mono">Rs. {focReportData.totalClinWaived.toLocaleString()}</td>
                      <td className="p-3 text-right text-purple-200 font-mono">Rs. {focReportData.totalFileCardWaived.toLocaleString()}</td>
                      <td className="p-3 text-right font-black text-amber-300 bg-purple-900 font-mono text-sm">
                        Rs. {focReportData.grandTotalWaived.toLocaleString()}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* REPORT TABLE 11: STORE MEDICINE SALES, COST & PROFIT MARGIN ANALYSIS */}
        {activeReport === 'store_medicine_report' && (
          <div className="space-y-6 pt-2">
            {/* KPI SUMMARY CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-sky-50 border border-sky-200 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-sky-600 uppercase tracking-wider">Gross Pharmacy Sales</div>
                  <div className="text-2xl font-black text-sky-950 mt-1">Rs. {filteredStoreMedicineSummary.totalGrossSales.toLocaleString()}</div>
                  <div className="text-[11px] font-medium text-sky-700 mt-0.5">
                    {filteredStoreMedicineSummary.count} Medicines • {filteredStoreMedicineSummary.totalQtySold} Units Sold
                  </div>
                </div>
                <ShoppingCart className="w-8 h-8 text-sky-500 opacity-80" />
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-amber-600 uppercase tracking-wider">Discounts Allowed</div>
                  <div className="text-2xl font-black text-amber-950 mt-1">Rs. {filteredStoreMedicineSummary.totalDiscount.toLocaleString()}</div>
                  <div className="text-[11px] font-medium text-amber-700 mt-0.5">
                    Net: Rs. {filteredStoreMedicineSummary.totalNetSales.toLocaleString()}
                  </div>
                </div>
                <DollarSign className="w-8 h-8 text-amber-500 opacity-80" />
              </div>

              <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-purple-600 uppercase tracking-wider">Purchase Cost (COGS)</div>
                  <div className="text-2xl font-black text-purple-950 mt-1">Rs. {filteredStoreMedicineSummary.totalCogs.toLocaleString()}</div>
                  <div className="text-[11px] font-medium text-purple-700 mt-0.5">Stock cost of sold goods</div>
                </div>
                <Boxes className="w-8 h-8 text-purple-500 opacity-80" />
              </div>

              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Net Gross Profit & Margin</div>
                  <div className="text-2xl font-black text-emerald-950 mt-1">Rs. {filteredStoreMedicineSummary.totalGrossProfit.toLocaleString()}</div>
                  <div className="text-[11px] font-extrabold text-emerald-700 mt-0.5 flex items-center space-x-1">
                    <span className="px-1.5 py-0.5 bg-emerald-200 text-emerald-900 rounded-md">
                      {filteredStoreMedicineSummary.overallMarginPct.toFixed(1)}% Margin
                    </span>
                    <span>• {filteredStoreMedicineSummary.count} Items</span>
                  </div>
                </div>
                <TrendingUp className="w-8 h-8 text-emerald-500 opacity-80" />
              </div>
            </div>

            {/* DETAILED MEDICINES PROFIT MARGIN TABLE */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h4 className="font-bold text-sm text-white">Store Medicine Sales, Cost Price & Profit Margin Ledger</h4>
                  <p className="text-xs text-slate-300">
                    Comprehensive audit statement showing itemized purchase costs (COGS), sale prices, discounts, net revenue, and gross profit margins. Click column headers to sort.
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-slate-300 bg-slate-800 px-3 py-1 rounded-full border border-slate-700">
                    {filteredStoreMedicineRows.length} of {storeMedicineReportData.rows.length} Medicines
                  </span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-800 font-extrabold border-b border-slate-300 text-[11px] uppercase select-none">
                      <th 
                        onClick={() => {
                          if (storeSortField === 'itemId') setStoreSortOrder(storeSortOrder === 'asc' ? 'desc' : 'asc');
                          else { setStoreSortField('itemId'); setStoreSortOrder('asc'); }
                        }}
                        className="p-3 border-r border-slate-200 cursor-pointer hover:bg-slate-200"
                      >
                        Item ID {storeSortField === 'itemId' && (storeSortOrder === 'asc' ? '▲' : '▼')}
                      </th>
                      <th 
                        onClick={() => {
                          if (storeSortField === 'itemName') setStoreSortOrder(storeSortOrder === 'asc' ? 'desc' : 'asc');
                          else { setStoreSortField('itemName'); setStoreSortOrder('asc'); }
                        }}
                        className="p-3 border-r border-slate-200 cursor-pointer hover:bg-slate-200"
                      >
                        Medicine / Item Name {storeSortField === 'itemName' && (storeSortOrder === 'asc' ? '▲' : '▼')}
                      </th>
                      <th 
                        onClick={() => {
                          if (storeSortField === 'category') setStoreSortOrder(storeSortOrder === 'asc' ? 'desc' : 'asc');
                          else { setStoreSortField('category'); setStoreSortOrder('asc'); }
                        }}
                        className="p-3 border-r border-slate-200 cursor-pointer hover:bg-slate-200"
                      >
                        Category {storeSortField === 'category' && (storeSortOrder === 'asc' ? '▲' : '▼')}
                      </th>
                      <th 
                        onClick={() => {
                          if (storeSortField === 'company') setStoreSortOrder(storeSortOrder === 'asc' ? 'desc' : 'asc');
                          else { setStoreSortField('company'); setStoreSortOrder('asc'); }
                        }}
                        className="p-3 border-r border-slate-200 cursor-pointer hover:bg-slate-200"
                      >
                        Company {storeSortField === 'company' && (storeSortOrder === 'asc' ? '▲' : '▼')}
                      </th>
                      <th 
                        onClick={() => {
                          if (storeSortField === 'qtySold') setStoreSortOrder(storeSortOrder === 'asc' ? 'desc' : 'asc');
                          else { setStoreSortField('qtySold'); setStoreSortOrder('desc'); }
                        }}
                        className="p-3 text-right border-r border-slate-200 cursor-pointer hover:bg-slate-200"
                      >
                        Qty Sold {storeSortField === 'qtySold' && (storeSortOrder === 'asc' ? '▲' : '▼')}
                      </th>
                      <th 
                        onClick={() => {
                          if (storeSortField === 'unitPurchasePrice') setStoreSortOrder(storeSortOrder === 'asc' ? 'desc' : 'asc');
                          else { setStoreSortField('unitPurchasePrice'); setStoreSortOrder('desc'); }
                        }}
                        className="p-3 text-right border-r border-slate-200 cursor-pointer hover:bg-slate-200"
                      >
                        Unit Pur. Price {storeSortField === 'unitPurchasePrice' && (storeSortOrder === 'asc' ? '▲' : '▼')}
                      </th>
                      <th 
                        onClick={() => {
                          if (storeSortField === 'unitSalePrice') setStoreSortOrder(storeSortOrder === 'asc' ? 'desc' : 'asc');
                          else { setStoreSortField('unitSalePrice'); setStoreSortOrder('desc'); }
                        }}
                        className="p-3 text-right border-r border-slate-200 cursor-pointer hover:bg-slate-200"
                      >
                        Unit Sale Price {storeSortField === 'unitSalePrice' && (storeSortOrder === 'asc' ? '▲' : '▼')}
                      </th>
                      <th 
                        onClick={() => {
                          if (storeSortField === 'totalCogs') setStoreSortOrder(storeSortOrder === 'asc' ? 'desc' : 'asc');
                          else { setStoreSortField('totalCogs'); setStoreSortOrder('desc'); }
                        }}
                        className="p-3 text-right border-r border-slate-200 text-purple-900 bg-purple-50/50 cursor-pointer hover:bg-purple-100"
                      >
                        Total Cost (COGS) {storeSortField === 'totalCogs' && (storeSortOrder === 'asc' ? '▲' : '▼')}
                      </th>
                      <th 
                        onClick={() => {
                          if (storeSortField === 'totalGrossSales') setStoreSortOrder(storeSortOrder === 'asc' ? 'desc' : 'asc');
                          else { setStoreSortField('totalGrossSales'); setStoreSortOrder('desc'); }
                        }}
                        className="p-3 text-right border-r border-slate-200 cursor-pointer hover:bg-slate-200"
                      >
                        Gross Sales {storeSortField === 'totalGrossSales' && (storeSortOrder === 'asc' ? '▲' : '▼')}
                      </th>
                      <th 
                        onClick={() => {
                          if (storeSortField === 'totalDiscount') setStoreSortOrder(storeSortOrder === 'asc' ? 'desc' : 'asc');
                          else { setStoreSortField('totalDiscount'); setStoreSortOrder('desc'); }
                        }}
                        className="p-3 text-right border-r border-slate-200 text-amber-900 cursor-pointer hover:bg-amber-100"
                      >
                        Discount {storeSortField === 'totalDiscount' && (storeSortOrder === 'asc' ? '▲' : '▼')}
                      </th>
                      <th 
                        onClick={() => {
                          if (storeSortField === 'totalNetSales') setStoreSortOrder(storeSortOrder === 'asc' ? 'desc' : 'asc');
                          else { setStoreSortField('totalNetSales'); setStoreSortOrder('desc'); }
                        }}
                        className="p-3 text-right border-r border-slate-200 text-sky-900 bg-sky-50/50 cursor-pointer hover:bg-sky-100"
                      >
                        Net Revenue {storeSortField === 'totalNetSales' && (storeSortOrder === 'asc' ? '▲' : '▼')}
                      </th>
                      <th 
                        onClick={() => {
                          if (storeSortField === 'grossProfit') setStoreSortOrder(storeSortOrder === 'asc' ? 'desc' : 'asc');
                          else { setStoreSortField('grossProfit'); setStoreSortOrder('desc'); }
                        }}
                        className="p-3 text-right border-r border-slate-200 text-emerald-950 bg-emerald-50/50 cursor-pointer hover:bg-emerald-100"
                      >
                        Gross Profit {storeSortField === 'grossProfit' && (storeSortOrder === 'asc' ? '▲' : '▼')}
                      </th>
                      <th 
                        onClick={() => {
                          if (storeSortField === 'marginPct') setStoreSortOrder(storeSortOrder === 'asc' ? 'desc' : 'asc');
                          else { setStoreSortField('marginPct'); setStoreSortOrder('desc'); }
                        }}
                        className="p-3 text-center cursor-pointer hover:bg-slate-200"
                      >
                        Margin % {storeSortField === 'marginPct' && (storeSortOrder === 'asc' ? '▲' : '▼')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-medium text-slate-800">
                    {filteredStoreMedicineRows.length === 0 ? (
                      <tr>
                        <td colSpan={13} className="p-8 text-center text-slate-400 italic">
                          No store medicine sales found for the selected date range and filters.
                        </td>
                      </tr>
                    ) : (
                      filteredStoreMedicineRows.map((r, idx) => (
                        <tr key={r.itemId + idx} className={idx % 2 === 0 ? 'bg-white hover:bg-slate-50/80' : 'bg-slate-50/50 hover:bg-slate-100/50'}>
                          <td className="p-3 font-mono font-bold text-slate-600 border-r border-slate-100">{r.itemId}</td>
                          <td className="p-3 font-extrabold text-slate-900 border-r border-slate-100">{r.itemName}</td>
                          <td className="p-3 text-slate-600 border-r border-slate-100">{r.category}</td>
                          <td className="p-3 text-slate-600 border-r border-slate-100">{r.company}</td>
                          <td className="p-3 text-right font-black text-slate-900 border-r border-slate-100">{r.qtySold}</td>
                          <td className="p-3 text-right text-slate-700 font-mono border-r border-slate-100">Rs. {r.unitPurchasePrice.toLocaleString()}</td>
                          <td className="p-3 text-right text-slate-700 font-mono border-r border-slate-100">Rs. {r.unitSalePrice.toLocaleString()}</td>
                          <td className="p-3 text-right font-bold text-purple-900 bg-purple-50/30 border-r border-slate-100 font-mono">
                            Rs. {r.totalCogs.toLocaleString()}
                          </td>
                          <td className="p-3 text-right text-slate-800 font-mono border-r border-slate-100">Rs. {r.totalGrossSales.toLocaleString()}</td>
                          <td className="p-3 text-right text-amber-700 font-mono border-r border-slate-100">
                            {r.totalDiscount > 0 ? `Rs. ${r.totalDiscount.toLocaleString()}` : '-'}
                          </td>
                          <td className="p-3 text-right font-bold text-sky-900 bg-sky-50/30 border-r border-slate-100 font-mono">
                            Rs. {r.totalNetSales.toLocaleString()}
                          </td>
                          <td className={`p-3 text-right font-black font-mono border-r border-slate-100 ${
                            r.grossProfit >= 0 ? 'text-emerald-700 bg-emerald-50/30' : 'text-rose-700 bg-rose-50/30'
                          }`}>
                            Rs. {r.grossProfit.toLocaleString()}
                          </td>
                          <td className="p-3 text-center">
                            <span className={`px-2 py-0.5 text-[10px] font-extrabold rounded-md border inline-block ${
                              r.marginPct >= 20
                                ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                : r.marginPct >= 10
                                ? 'bg-amber-100 text-amber-800 border-amber-300'
                                : 'bg-rose-100 text-rose-800 border-rose-300'
                            }`}>
                              {r.marginPct.toFixed(1)}%
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-900 text-white font-extrabold text-xs">
                      <td className="p-3 uppercase tracking-wider" colSpan={4}>
                        Summary Totals ({filteredStoreMedicineSummary.count} Items)
                      </td>
                      <td className="p-3 text-right text-slate-100 font-black">
                        {filteredStoreMedicineSummary.totalQtySold}
                      </td>
                      <td></td>
                      <td></td>
                      <td className="p-3 text-right font-black text-purple-300 bg-slate-800 font-mono">
                        Rs. {filteredStoreMedicineSummary.totalCogs.toLocaleString()}
                      </td>
                      <td className="p-3 text-right text-slate-200 font-mono">
                        Rs. {filteredStoreMedicineSummary.totalGrossSales.toLocaleString()}
                      </td>
                      <td className="p-3 text-right text-amber-300 font-mono">
                        Rs. {filteredStoreMedicineSummary.totalDiscount.toLocaleString()}
                      </td>
                      <td className="p-3 text-right font-black text-sky-300 bg-slate-800 font-mono">
                        Rs. {filteredStoreMedicineSummary.totalNetSales.toLocaleString()}
                      </td>
                      <td className="p-3 text-right font-black text-emerald-400 bg-slate-950 font-mono text-sm">
                        Rs. {filteredStoreMedicineSummary.totalGrossProfit.toLocaleString()}
                      </td>
                      <td className="p-3 text-center font-black text-amber-300 bg-slate-950 font-mono text-sm">
                        {filteredStoreMedicineSummary.overallMarginPct.toFixed(1)}%
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* EXECUTIVE AUDIT SIGNATURES & STAMPS FOOTER */}
        <div className="pt-8 mt-8 border-t-2 border-slate-300 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          <div className="space-y-1">
            <div className="border-b-2 border-dashed border-slate-400 pb-1 h-10 flex items-end justify-center font-mono text-[11px] font-bold text-slate-700">
              {currentUser?.FullName || 'Accountant / Audit Officer'}
            </div>
            <p className="uppercase tracking-wider font-extrabold text-[10px] text-slate-900">PREPARED BY</p>
            <p className="text-[9px] text-slate-500 font-medium">Accounts & ERP Audit Desk</p>
          </div>

          <div className="space-y-1">
            <div className="border-b-2 border-dashed border-slate-400 pb-1 h-10"></div>
            <p className="uppercase tracking-wider font-extrabold text-[10px] text-slate-900">CHECKED BY</p>
            <p className="text-[9px] text-slate-500 font-medium">Internal Audit Wing</p>
          </div>

          <div className="space-y-1">
            <div className="border-b-2 border-dashed border-slate-400 pb-1 h-10"></div>
            <p className="uppercase tracking-wider font-extrabold text-[10px] text-slate-900">VERIFIED BY</p>
            <p className="text-[9px] text-slate-500 font-medium">Finance & Treasury Desk</p>
          </div>

          <div className="space-y-1">
            <div className="border-b-2 border-slate-900 pb-1 h-10 flex items-end justify-center font-black text-sm text-slate-900 font-serif">
              Zaigham Ali Anjum
            </div>
            <p className="uppercase tracking-wider font-extrabold text-[10px] text-rose-900">MR. ZAIGHAM ALI ANJUM</p>
            <p className="text-[10px] text-slate-900 font-bold uppercase">Manager Operations & Administrative Head</p>
            <p className="text-[9px] text-emerald-800 font-bold">Punjab Homeopathic Clinic & Pharmacy</p>
          </div>
        </div>

        <div className="pt-4 mt-2 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-[10px] text-slate-500 font-medium gap-2">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span>Punjab Homeopathic Clinic & Pharmacy • Official Audit Document</span>
            <span className="text-slate-300">•</span>
            <a
              href={clinicSettings?.Website || 'https://punjabhomeopathic.pk'}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 font-bold hover:underline"
            >
              🌐 {(clinicSettings?.Website || 'https://punjabhomeopathic.pk').replace(/^https?:\/\//, '')}
            </a>
            <span className="text-slate-300">•</span>
            <a
              href={`tel:${(clinicSettings?.PhoneMobile || '+92-311-4000608').replace(/[^0-9+]/g, '')}`}
              className="text-emerald-700 hover:text-emerald-900 font-bold hover:underline font-mono"
            >
              📞 {clinicSettings?.PhoneMobile || '+92-311-4000608'}
            </a>
          </div>
          <div>Authorized Administrator: <strong className="text-slate-800 font-bold">Mr. Zaigham Ali Anjum</strong></div>
        </div>
      </div>
    </div>
  );
}
