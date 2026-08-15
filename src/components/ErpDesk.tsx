import React, { useState, useEffect, useMemo } from 'react';
import {
  Building2,
  Users,
  ShoppingCart,
  Receipt,
  Briefcase,
  DollarSign,
  Plus,
  Trash2,
  Edit,
  Printer,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Search,
  Filter,
  FileSpreadsheet,
  PackageCheck,
  CreditCard,
  UserPlus,
  FileText,
  Boxes,
  PieChart,
  QrCode,
  Coins,
  Calendar,
  X,
  Eye,
  Calculator,
  History,
  Landmark,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  RotateCcw,
  XCircle,
  Pencil,
  Save,
  Lock,
  PhoneCall
} from 'lucide-react';
import ItemQRScannerModal from './ItemQRScannerModal';
import ItemQRGeneratorModal from './ItemQRGeneratorModal';
import ReportingDesk from './ReportingDesk';

import {
  ErpVendor,
  ErpPurchaseOrder,
  ErpGrn,
  ErpGrnItem,
  ErpTransaction,
  ErpEmployee,
  ErpPayroll,
  ErpExpense,
  ErpAsset,
  User,
  UserRight,
  ClinicSettings
} from '../types';

interface ErpDeskProps {
  currentUser: User | null;
  rights: UserRight[];
  clinicSettings?: ClinicSettings;
}

export default function ErpDesk({ currentUser, rights, clinicSettings }: ErpDeskProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'cash_book_pnl' | 'vendors' | 'vendor_statement' | 'po' | 'ledger' | 'hr' | 'expenses_assets' | 'reporting'>('overview');
  const [loading, setLoading] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  // Vendor Statement States
  const [selectedVendorId, setSelectedVendorId] = useState<string>('');
  const [vendorDateFilter, setVendorDateFilter] = useState<'all' | 'daily' | 'weekly' | 'monthly' | 'yearly'>('all');
  const [vendorPrintModalOpen, setVendorPrintModalOpen] = useState<boolean>(false);
  const [expandedGrnId, setExpandedGrnId] = useState<string | null>(null);

  // Core ERP State Collections
  const [vendors, setVendors] = useState<ErpVendor[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<ErpPurchaseOrder[]>([]);
  const [grns, setGrns] = useState<ErpGrn[]>([]);
  const [transactions, setTransactions] = useState<ErpTransaction[]>([]);
  const [employees, setEmployees] = useState<ErpEmployee[]>([]);
  const [payrolls, setPayrolls] = useState<ErpPayroll[]>([]);
  const [expenses, setExpenses] = useState<ErpExpense[]>([]);
  const [assets, setAssets] = useState<ErpAsset[]>([]);
  const [inventoryItems, setInventoryItems] = useState<any[]>([]);

  // Additional Collections for Cash Book & P&L
  const [appointments, setAppointments] = useState<any[]>([]);
  const [patientVisits, setPatientVisits] = useState<any[]>([]);
  const [posSales, setPosSales] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Cash Book & Financial Period Filter States
  const [cashBookDateFilter, setCashBookDateFilter] = useState<'today' | 'this_week' | 'this_month' | 'this_year' | 'custom' | 'all_time'>('today');
  const [cashBookStartDate, setCashBookStartDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [cashBookEndDate, setCashBookEndDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [cashBookCategoryFilter, setCashBookCategoryFilter] = useState<'ALL' | 'INFLOW' | 'OUTFLOW'>('ALL');
  const [cashBookSearch, setCashBookSearch] = useState<string>('');

  // Quick Outflow Logger State
  const [quickOutflowForm, setQuickOutflowForm] = useState<{
    category: string;
    amount: number | string;
    payee: string;
    paymentMethod: 'Cash' | 'Bank' | 'Online';
    date: string;
    description: string;
  }>({
    category: 'Building Rent & Maintenance',
    amount: '',
    payee: '',
    paymentMethod: 'Cash',
    date: new Date().toISOString().split('T')[0],
    description: ''
  });

  // Search & Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [medicineSearchTerm, setMedicineSearchTerm] = useState('');
  const [medicineFilterMode, setMedicineFilterMode] = useState<'all' | 'lowStock' | 'selected'>('all');
  const [poCategoryFilter, setPoCategoryFilter] = useState<string>('all');

  // Dynamic Medicine Categories List
  const medicineCategories = useMemo(() => {
    const defaultCats = [
      'Tablet / Capsule',
      'Syrup / Liquid',
      'Injection / Ampoule',
      'Ointment / Cream',
      'Drops',
      'Clinical / Compounded',
      'Patent / Pre-packaged',
      'Surgical / Supplies'
    ];
    const itemCats = (inventoryItems || [])
      .map((i: any) => i.Category || (i.MedicineType === 'C' ? 'Clinical / Compounded' : i.MedicineType === 'P' ? 'Patent / Pre-packaged' : 'Tablet / Capsule'))
      .filter(Boolean);
    return Array.from(new Set([...defaultCats, ...itemCats]));
  }, [inventoryItems]);

  // Selected Vendor for Statement View
  const selectedVendor = useMemo(() => {
    if (!selectedVendorId && vendors.length > 0) {
      return vendors[0];
    }
    return vendors.find(v => v.VendorID === selectedVendorId || v._id === selectedVendorId) || vendors[0] || null;
  }, [vendors, selectedVendorId]);

  // Vendor Statement & Payable Ledger Calculation
  const vendorStatement = useMemo(() => {
    if (!selectedVendor) {
      return { statementRows: [], totalInvoiced: 0, totalPaid: 0, closingBalance: 0 };
    }

    const vName = (selectedVendor.VendorName || '').trim().toLowerCase();
    const vId = (selectedVendor.VendorID || selectedVendor._id || '').trim().toLowerCase();

    // Filter GRNs for this vendor
    const vendorGrns = (grns || []).filter(g => {
      const sName = (g.SupplierName || '').trim().toLowerCase();
      const sId = (g.SupplierID || '').trim().toLowerCase();
      return (vName && sName === vName) || (vId && sId === vId) || (sName && vName.includes(sName));
    });

    // Filter Payments / Transactions for this vendor
    const vendorTxns = (transactions || []).filter(t => {
      const tVName = (t.VendorName || '').trim().toLowerCase();
      const tVId = (t.VendorID || '').trim().toLowerCase();
      const isVendorPay = t.Type === 'VendorPayment' || t.Category === 'Vendor Payment' || (t.Type === 'Expense' && tVName);
      return isVendorPay && ((vName && tVName === vName) || (vId && tVId === vId) || (tVName && vName.includes(tVName)));
    });

    type LedgerRow = {
      id: string;
      date: string;
      type: string;
      refNo: string;
      poNo: string;
      description: string;
      debit: number;   // Payment (settlement)
      credit: number;  // GRN Bill (invoice)
      runningBalance?: number;
      rawItem?: any;
    };

    const rows: LedgerRow[] = [];

    vendorGrns.forEach(g => {
      rows.push({
        id: g.GrnID || g._id || `GRN-${Math.random()}`,
        date: g.ReceivedDate || new Date().toISOString().split('T')[0],
        type: 'Goods Received (GRN)',
        refNo: g.GrnID || 'GRN-N/A',
        poNo: g.POID || (g as any).PoID || 'N/A',
        description: `GRN Received - Invoice #${g.VendorInvoiceNo || g.SupplierInvoiceNo || 'N/A'} (${g.ItemsReceived?.length || g.Items?.length || 0} items)`,
        debit: 0,
        credit: Number(g.TotalAmount || 0),
        rawItem: g
      });
    });

    vendorTxns.forEach(t => {
      rows.push({
        id: t.TransactionID || t._id || `TXN-${Math.random()}`,
        date: t.Date || new Date().toISOString().split('T')[0],
        type: 'Vendor Bill Payment',
        refNo: t.TransactionID || 'PAY-N/A',
        poNo: t.ReferenceNo && t.ReferenceNo.toUpperCase().startsWith('PO') ? t.ReferenceNo : 'N/A',
        description: `Payment Settled via ${t.PaymentMethod || 'Cash'} - ${t.Description || 'Vendor Settlement'}`,
        debit: Number(t.Amount || 0),
        credit: 0,
        rawItem: t
      });
    });

    // Sort chronologically
    rows.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Date Filtering
    const now = new Date();
    const filteredRows = rows.filter(r => {
      if (vendorDateFilter === 'all') return true;
      const rDate = new Date(r.date);
      if (isNaN(rDate.getTime())) return true;

      if (vendorDateFilter === 'daily') {
        return rDate.toDateString() === now.toDateString();
      }
      if (vendorDateFilter === 'weekly') {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(now.getDate() - 7);
        return rDate >= oneWeekAgo;
      }
      if (vendorDateFilter === 'monthly') {
        return rDate.getMonth() === now.getMonth() && rDate.getFullYear() === now.getFullYear();
      }
      if (vendorDateFilter === 'yearly') {
        return rDate.getFullYear() === now.getFullYear();
      }
      return true;
    });

    // Calculate Running Balance
    let running = 0;
    let totalInvoiced = 0;
    let totalPaid = 0;

    const statementRows = filteredRows.map(r => {
      totalInvoiced += r.credit;
      totalPaid += r.debit;
      running = running + r.credit - r.debit;
      return {
        ...r,
        runningBalance: running
      };
    });

    const closingBalance = Math.max(0, selectedVendor.Balance ?? running);

    return {
      statementRows,
      totalInvoiced,
      totalPaid,
      closingBalance
    };
  }, [selectedVendor, grns, transactions, vendorDateFilter]);

  // UNIFIED CLINIC CASH BOOK & P&L LEDGER COMPUTATIONS
  const cashBookEntries = useMemo(() => {
    const entries: Array<{
      id: string;
      date: string;
      time: string;
      ref: string;
      particulars: string;
      category: string;
      type: 'INFLOW' | 'OUTFLOW';
      amount: number;
      paymentMode: string;
      source: string;
    }> = [];

    // 1. Appointments (OPD Token Collections)
    (appointments || []).forEach((app: any) => {
      const amt = typeof app.FeeCharged === 'number' ? app.FeeCharged : (Number(app.FeeCharged) || 0);
      if (amt > 0 && app.Status !== 3) {
        entries.push({
          id: `APP-${app.AppointmentID || app._id || Math.random()}`,
          date: app.AppointmentDate || app.BookingDate || new Date().toISOString().split('T')[0],
          time: app.Time || 'OPD Shift',
          ref: `TOKEN-${app.AppointmentID || '001'}`,
          particulars: `OPD Consultation Token: ${app.PatientName || 'Patient'}${app.DoctorName ? ` (${app.DoctorName})` : ''}`,
          category: 'OPD Token Consultation Fee',
          type: 'INFLOW',
          amount: amt,
          paymentMode: 'Cash',
          source: 'Appointments'
        });
      }
    });

    // 2. Patient Visits (Clinical Medicines, File & Card Registration)
    (patientVisits || []).forEach((vis: any) => {
      const vDate = vis.VisitDate || vis.Date || new Date().toISOString().split('T')[0];
      const pName = vis.PatientName || `Patient #${vis.PatientID || ''}`;
      
      const consultAmt = Number(vis.ConsultationFee) || 0;
      const isPaid = vis.ConsultationPaymentOption === 'Paid - Cash' || vis.ConsultationPaymentOption === 'Paid - Online/Card' || vis.ConsultationPaymentOption === 'Paid' || vis.Status === 2;
      if (consultAmt > 0 && isPaid) {
        entries.push({
          id: `VIS-CONS-${vis.VisitID || vis._id || Math.random()}`,
          date: vDate,
          time: vis.VisitTime || 'EMR Consultation',
          ref: `VISIT-${vis.VisitID || vis.PatientID || '001'}`,
          particulars: `OPD Consultation Fee: ${pName}${vis.DoctorName ? ` (${vis.DoctorName})` : ''}`,
          category: 'OPD Token Consultation Fee',
          type: 'INFLOW',
          amount: consultAmt,
          paymentMode: 'Cash',
          source: 'PatientVisits'
        });
      }

      const clinAmt = Number(vis.ClinicalMedicinePayment) || Number(vis.ClinicalMedicinePkr) || 0;
      if (clinAmt > 0) {
        entries.push({
          id: `VIS-CLIN-${vis.VisitID || vis._id || Math.random()}`,
          date: vDate,
          time: vis.VisitTime || 'Dispensary',
          ref: `PV-${vis.PatientID || '001'}`,
          particulars: `Clinical Formulated Medicine: ${pName}`,
          category: 'Clinical Formulated Medicine',
          type: 'INFLOW',
          amount: clinAmt,
          paymentMode: 'Cash',
          source: 'PatientVisits'
        });
      }

      const fileAmt = Number(vis.FileFee) || Number(vis.FilePkr) || 0;
      if (fileAmt > 0) {
        entries.push({
          id: `VIS-FILE-${vis.VisitID || vis._id || Math.random()}`,
          date: vDate,
          time: vis.VisitTime || 'Reception',
          ref: `FILE-${vis.PatientID || '001'}`,
          particulars: `File Registration & Folder Fee: ${pName}`,
          category: 'File Registration Fee',
          type: 'INFLOW',
          amount: fileAmt,
          paymentMode: 'Cash',
          source: 'PatientVisits'
        });
      }

      const cardAmt = Number(vis.CardFee) || Number(vis.CardPkr) || 0;
      if (cardAmt > 0) {
        entries.push({
          id: `VIS-CARD-${vis.VisitID || vis._id || Math.random()}`,
          date: vDate,
          time: vis.VisitTime || 'Reception',
          ref: `CARD-${vis.PatientID || '001'}`,
          particulars: `Health Identity Card Fee: ${pName}`,
          category: 'Patient Card Fee',
          type: 'INFLOW',
          amount: cardAmt,
          paymentMode: 'Cash',
          source: 'PatientVisits'
        });
      }
    });

    // 3. POS / Store Pharmacy Sales
    (posSales || []).forEach((sale: any) => {
      const sAmt = Number(sale.NetAmount) || Number(sale.GAmount) || Number(sale.TotalAmount) || Number(sale.GrandTotal) || Number(sale.Total) || 0;
      if (sAmt > 0) {
        entries.push({
          id: `SALE-${sale.InvoiceNo || sale.SaleID || sale._id || Math.random()}`,
          date: sale.InvoiceDate || sale.Date || sale.CreatedDate || new Date().toISOString().split('T')[0],
          time: sale.Time || 'Pharmacy Counter',
          ref: `INV-${sale.InvoiceNo || 'STORE'}`,
          particulars: `Pharmacy Store Counter Sale: ${sale.PatientID ? `Patient #${sale.PatientID}` : (sale.CustomerName || 'Walk-in Customer')}`,
          category: 'Pharmacy Store Sale',
          type: 'INFLOW',
          amount: sAmt,
          paymentMode: sale.PaymentMethod || sale.PaymentMode || 'Cash',
          source: 'POS Sales'
        });
      }
    });

    // 4. ERP Expenses (Outflows)
    (expenses || []).forEach((exp: any) => {
      const eAmt = Number(exp.Amount) || 0;
      if (eAmt > 0) {
        const rawId = (exp.ExpenseID || exp._id || '').toString();
        const cleanId = rawId ? (rawId.startsWith('EXP-') ? rawId : `EXP-${rawId}`) : `EXP-${Math.random()}`;
        entries.push({
          id: cleanId,
          date: exp.ExpenseDate || exp.Date || new Date().toISOString().split('T')[0],
          time: 'Expenses Ledger',
          ref: cleanId,
          particulars: `${exp.Category}: ${exp.Description || 'Clinic Expense Outflow'}`,
          category: exp.Category || 'General Expense',
          type: 'OUTFLOW',
          amount: eAmt,
          paymentMode: exp.PaymentMethod || 'Cash',
          source: 'Expenses'
        });
      }
    });

    // 5. ERP Payroll / Salaries Paid (Outflows)
    (payrolls || []).forEach((pay: any) => {
      const pAmt = Number(pay.NetSalary) || Number(pay.BasicSalary) || 0;
      if (pAmt > 0) {
        const emp = (employees || []).find(e => e.EmployeeID === pay.EmployeeID);
        const rawId = (pay.PayrollID || pay._id || '').toString();
        const cleanId = rawId ? (rawId.startsWith('PAY-') ? rawId : `PAY-${rawId}`) : `PAY-${Math.random()}`;
        entries.push({
          id: cleanId,
          date: pay.PaymentDate || `${pay.MonthYear || '2026-08'}-01`,
          time: 'HR Accounts',
          ref: cleanId,
          particulars: `Staff Salary Disbursement: ${emp?.FullName || pay.EmployeeID || 'Employee'} (${pay.MonthYear || ''})`,
          category: 'Staff Salary & Payroll',
          type: 'OUTFLOW',
          amount: pAmt,
          paymentMode: pay.PaymentMethod || 'Cash',
          source: 'Payroll'
        });
      }
    });

    // 6. ERP General Ledger Transactions
    (transactions || []).forEach((tx: any) => {
      const tAmt = Number(tx.Amount) || 0;
      if (tAmt > 0) {
        const typeUpper = (tx.Type || '').toUpperCase();

        // Cash Book is a Cash Flow ledger (Cash Inflows vs Cash Outflows).
        // GRN stock receipts on credit create Accounts Payable vendor liabilities, NOT cash outflows.
        // Outflows are ONLY recorded when an actual cash/bank payment is made (VendorPayment, Expense, PayrollPayment, AssetPurchase).
        const isActualOutflow =
          typeUpper === 'EXPENSE' ||
          typeUpper === 'VENDORPAYMENT' ||
          typeUpper === 'VENDOR_PAYMENT' ||
          typeUpper === 'PAYROLLPAYMENT' ||
          typeUpper === 'ASSETPURCHASE';

        const isActualInflow =
          typeUpper === 'INCOME' ||
          typeUpper === 'CUSTOMERRECEIPT' ||
          typeUpper === 'INFLOW';

        if (!isActualOutflow && !isActualInflow) {
          // Non-cash transactions (e.g. unpaid GRN goods receiving or credit accruals) are excluded from Cash Outflows & Inflows
          return;
        }

        const isOut = isActualOutflow;
        const rawTxId = (tx.TransactionID || tx._id || '').toString();
        const rawRefNo = (tx.ReferenceNo || '').toString();
        const cleanRef = rawTxId ? (rawTxId.startsWith('TXN-') ? rawTxId : `TXN-${rawTxId}`) : `TXN-${Math.random()}`;

        // Check if this transaction is ALREADY covered by Expenses, Payroll, or prior entries
        const isAlreadyIn = entries.some(e => {
          if (rawTxId && (e.id === rawTxId || e.ref === rawTxId)) return true;
          if (rawRefNo && (e.id === rawRefNo || e.ref === rawRefNo || e.id === `EXP-${rawRefNo.replace(/^EXP-/, '')}`)) return true;
          if (tx.Type === 'Expense' && (expenses || []).some((exp: any) => {
            const expId = (exp.ExpenseID || exp._id || '').toString();
            return (expId && (expId === rawRefNo || expId === rawTxId)) || 
                   (Number(exp.Amount) === tAmt && (exp.ExpenseDate === tx.Date || exp.Date === tx.Date));
          })) return true;
          if (tx.Type === 'PayrollPayment' && (payrolls || []).some((pay: any) => {
            const payId = (pay.PayrollID || pay._id || '').toString();
            return payId && (payId === rawRefNo || payId === rawTxId);
          })) return true;
          return false;
        });

        if (!isAlreadyIn) {
          entries.push({
            id: cleanRef,
            date: tx.Date || new Date().toISOString().split('T')[0],
            time: 'General Ledger',
            ref: cleanRef,
            particulars: tx.Description || `${tx.Type} - ${tx.Category}`,
            category: tx.Category || tx.Type,
            type: isOut ? 'OUTFLOW' : 'INFLOW',
            amount: tAmt,
            paymentMode: tx.PaymentMethod || 'Cash',
            source: 'ERP Transactions'
          });
        }
      }
    });

    return entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [appointments, patientVisits, posSales, expenses, payrolls, transactions, employees]);

  const filteredCashBookEntries = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const now = new Date();

    return cashBookEntries.filter(e => {
      if (cashBookDateFilter === 'today') {
        if (e.date !== todayStr) return false;
      } else if (cashBookDateFilter === 'this_week') {
        const d = new Date(e.date);
        const diffTime = Math.abs(now.getTime() - d.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays > 7) return false;
      } else if (cashBookDateFilter === 'this_month') {
        if (!e.date.startsWith(todayStr.slice(0, 7))) return false;
      } else if (cashBookDateFilter === 'this_year') {
        if (!e.date.startsWith(todayStr.slice(0, 4))) return false;
      } else if (cashBookDateFilter === 'custom') {
        if (cashBookStartDate && e.date < cashBookStartDate) return false;
        if (cashBookEndDate && e.date > cashBookEndDate) return false;
      }

      if (cashBookCategoryFilter === 'INFLOW' && e.type !== 'INFLOW') return false;
      if (cashBookCategoryFilter === 'OUTFLOW' && e.type !== 'OUTFLOW') return false;

      if (cashBookSearch.trim()) {
        const q = cashBookSearch.toLowerCase();
        const match = e.particulars.toLowerCase().includes(q) ||
                      e.category.toLowerCase().includes(q) ||
                      e.ref.toLowerCase().includes(q) ||
                      e.paymentMode.toLowerCase().includes(q);
        if (!match) return false;
      }

      return true;
    });
  }, [cashBookEntries, cashBookDateFilter, cashBookStartDate, cashBookEndDate, cashBookCategoryFilter, cashBookSearch]);

  const cashBookMetrics = useMemo(() => {
    let totalInflow = 0;
    let totalOutflow = 0;

    let opdInflow = 0;
    let clinicalInflow = 0;
    let storeInflow = 0;
    let regInflow = 0;

    let salariesOutflow = 0;
    let rentOutflow = 0;
    let billsOutflow = 0;
    let medicinePurchasesOutflow = 0;
    let miscOutflow = 0;

    const uniqueDates = new Set<string>();

    filteredCashBookEntries.forEach(e => {
      if (e.date) uniqueDates.add(e.date);

      if (e.type === 'INFLOW') {
        totalInflow += e.amount;
        if (e.category.includes('OPD')) opdInflow += e.amount;
        else if (e.category.includes('Clinical')) clinicalInflow += e.amount;
        else if (e.category.includes('Store') || e.category.includes('Pharmacy')) storeInflow += e.amount;
        else regInflow += e.amount;
      } else {
        totalOutflow += e.amount;
        const catLower = e.category.toLowerCase();
        if (catLower.includes('salary') || catLower.includes('payroll')) salariesOutflow += e.amount;
        else if (catLower.includes('rent')) rentOutflow += e.amount;
        else if (catLower.includes('electric') || catLower.includes('water') || catLower.includes('utility') || catLower.includes('bill')) billsOutflow += e.amount;
        else if (catLower.includes('medicine') || catLower.includes('purchase') || catLower.includes('vendor')) medicinePurchasesOutflow += e.amount;
        else miscOutflow += e.amount;
      }
    });

    const netBalance = totalInflow - totalOutflow;
    const marginPercent = totalInflow > 0 ? ((netBalance / totalInflow) * 100).toFixed(1) : '0';

    const activeDaysCount = Math.max(1, uniqueDates.size);
    const dailyAvgInflow = Math.round(totalInflow / activeDaysCount);
    const dailyAvgOutflow = Math.round(totalOutflow / activeDaysCount);
    const dailyAvgNet = Math.round(netBalance / activeDaysCount);

    return {
      totalInflow,
      totalOutflow,
      netBalance,
      marginPercent,
      opdInflow,
      clinicalInflow,
      storeInflow,
      regInflow,
      salariesOutflow,
      rentOutflow,
      billsOutflow,
      medicinePurchasesOutflow,
      miscOutflow,
      activeDaysCount,
      dailyAvgInflow,
      dailyAvgOutflow,
      dailyAvgNet
    };
  }, [filteredCashBookEntries]);

  const handleQuickOutflowSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const amt = Number(quickOutflowForm.amount) || 0;
    if (amt <= 0) {
      alert("Please enter a valid expense amount.");
      return;
    }

    setIsSubmitting(true);
    try {
      const expCatRaw = quickOutflowForm.category || 'Building Rent & Maintenance';
      let expCatMapped: 'Rent' | 'Utilities' | 'Salaries' | 'Maintenance' | 'Marketing' | 'Supplies' | 'Refreshment' | 'Other' = 'Other';
      if (expCatRaw.includes('Rent')) expCatMapped = 'Rent';
      else if (expCatRaw.includes('Salary') || expCatRaw.includes('Payroll')) expCatMapped = 'Salaries';
      else if (expCatRaw.includes('Utility') || expCatRaw.includes('Electricity')) expCatMapped = 'Utilities';
      else if (expCatRaw.includes('Tea') || expCatRaw.includes('Refreshment')) expCatMapped = 'Refreshment';
      else if (expCatRaw.includes('Repair') || expCatRaw.includes('Maintenance')) expCatMapped = 'Maintenance';

      const newExp: ErpExpense = {
        ExpenseID: `EXP-${Date.now().toString().slice(-6)}`,
        Category: expCatMapped,
        Description: quickOutflowForm.description ? `${quickOutflowForm.description} (Paid to: ${quickOutflowForm.payee})` : `${expCatRaw} to ${quickOutflowForm.payee || 'Payee'}`,
        Amount: amt,
        ExpenseDate: quickOutflowForm.date || new Date().toISOString().split('T')[0],
        PaymentMethod: quickOutflowForm.paymentMethod as any || 'Cash',
        ReceiptRef: `REC-${Math.floor(1000 + Math.random() * 9000)}`
      };

      const newTxn: ErpTransaction = {
        TransactionID: `TXN-${Date.now().toString().slice(-6)}`,
        Type: 'Expense',
        Category: expCatRaw,
        Description: newExp.Description,
        Amount: amt,
        PaymentMethod: newExp.PaymentMethod,
        ReferenceNo: newExp.ExpenseID,
        Date: newExp.ExpenseDate,
        CreatedBy: currentUser?.FullName || 'Admin',
        VendorName: quickOutflowForm.payee || 'Expense Account'
      };

      await saveToDatabase('erp_expenses', newExp);
      await saveToDatabase('erp_transactions', newTxn);

      setExpenses(prev => [newExp, ...prev]);
      setTransactions(prev => [newTxn, ...prev]);

      setQuickOutflowForm({
        category: 'Building Rent & Maintenance',
        amount: '',
        payee: '',
        paymentMethod: 'Cash',
        date: new Date().toISOString().split('T')[0],
        description: ''
      });

      setSyncMessage(`Outflow of Rs. ${amt.toLocaleString()} recorded in Cash Book & P&L!`);
      setTimeout(() => setSyncMessage(null), 3000);
      window.dispatchEvent(new CustomEvent('phc_db_updated'));
    } catch (err: any) {
      console.error('Failed to submit quick outflow:', err);
      alert('Error recording outflow: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrintCashBookReport = () => {
    const printWin = window.open('', '_blank');
    if (!printWin) {
      alert("Please allow popups to print the report.");
      return;
    }

    const cName = clinicSettings?.ClinicName || 'PUNJAB HOMEOPATHIC CLINIC';
    const cTag = clinicSettings?.ClinicLogoText || 'HEALING NATURALLY. RESTORING BALANCE.';
    const cDoc = clinicSettings?.DoctorName || '';
    const cDocSub = clinicSettings?.DoctorSignatureText || '';
    const cAddr = clinicSettings?.ClinicAddress || '10 Shalimar Road, Garhi Shahu, Lahore';
    const cPhone = clinicSettings?.PhoneMobile || '+92 300 1234567';
    const logoSrc = clinicSettings?.ClinicLogoImage || '/nhc_logo.svg';

    const dateLabel = cashBookDateFilter === 'today' ? `Daily (${new Date().toLocaleDateString('en-GB')})` :
                      cashBookDateFilter === 'this_week' ? 'Weekly (Past 7 Days)' :
                      cashBookDateFilter === 'this_month' ? `Monthly (${new Date().toLocaleString('default', { month: 'long', year: 'numeric' })})` :
                      cashBookDateFilter === 'this_year' ? `Yearly (Year ${new Date().getFullYear()})` :
                      cashBookDateFilter === 'custom' ? `Custom Period (${cashBookStartDate} to ${cashBookEndDate})` : 'All Time Records';

    const rowsHtml = filteredCashBookEntries.map((e, idx) => `
      <tr style="border-bottom: 1px solid #e2e8f0; font-size: 11px; page-break-inside: avoid;">
        <td style="padding: 7px 6px; text-align: center; font-weight: bold; font-family: monospace; color: #64748b;">${idx + 1}</td>
        <td style="padding: 7px 6px; font-family: monospace; white-space: nowrap; font-weight: 600;">${e.date}</td>
        <td style="padding: 7px 6px; font-weight: bold; font-family: monospace; color: #4338ca;">${e.ref}</td>
        <td style="padding: 7px 6px; font-weight: bold; color: #0f172a;">${e.particulars}</td>
        <td style="padding: 7px 6px; color: #475569; font-size: 10px;">${e.category}</td>
        <td style="padding: 7px 6px; text-align: center;">
          <span style="background: ${e.type === 'INFLOW' ? '#dcfce7' : '#ffe4e6'}; color: ${e.type === 'INFLOW' ? '#166534' : '#9f1239'}; font-weight: 800; padding: 2px 7px; border-radius: 4px; font-size: 9px; letter-spacing: 0.5px;">
            ${e.type}
          </span>
        </td>
        <td style="padding: 7px 6px; text-align: right; font-family: monospace; font-weight: 800; color: ${e.type === 'INFLOW' ? '#15803d' : '#be123c'}; font-size: 11px;">
          ${e.type === 'INFLOW' ? '+' : '-'} Rs. ${e.amount.toLocaleString()}
        </td>
      </tr>
    `).join('');

    printWin.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Cash Book & P&L Statement - ${cName}</title>
          <style>
            @page { size: A4 portrait; margin: 12mm 15mm; }
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #0f172a; margin: 0; padding: 0; background: #fff; line-height: 1.4; }
            .letterhead-header { display: flex; align-items: center; justify-content: space-between; border-bottom: 3px double #0f172a; padding-bottom: 12px; margin-bottom: 14px; }
            .clinic-brand { flex: 1; text-align: center; padding: 0 10px; }
            .clinic-title { font-size: 22px; font-weight: 900; color: #881337; letter-spacing: -0.5px; text-transform: uppercase; font-family: Georgia, serif; }
            .clinic-tagline { font-size: 10px; font-weight: 800; color: #be123c; letter-spacing: 1px; margin-top: 2px; text-transform: uppercase; }
            .doc-details { font-size: 11px; font-weight: 800; color: #1e293b; margin-top: 4px; }
            .contact-line { font-size: 10px; color: #475569; font-weight: 600; margin-top: 2px; }
            .report-banner { background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 10px 14px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; }
            .report-title { font-size: 14px; font-weight: 900; color: #0f172a; text-transform: uppercase; letter-spacing: 0.5px; }
            .summary-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 16px; }
            .summary-card { background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 10px 12px; text-align: center; }
            .card-label { font-size: 9px; font-weight: 800; uppercase; tracking-wider; }
            .card-val { font-size: 16px; font-weight: 900; margin-top: 4px; font-family: monospace; }
            table { width: 100%; border-collapse: collapse; margin-top: 6px; }
            th { background: #0f172a; color: #ffffff; font-size: 9.5px; text-transform: uppercase; padding: 8px 6px; text-align: left; font-weight: 800; letter-spacing: 0.5px; }
            .footer-sign { margin-top: 40px; padding-top: 15px; border-top: 1px solid #cbd5e1; display: flex; justify-content: space-between; align-items: flex-end; font-size: 10px; color: #475569; page-break-inside: avoid; }
            .sign-box { text-align: center; width: 180px; }
            .sign-line { border-bottom: 1.5px dashed #64748b; height: 35px; margin-bottom: 6px; }
          </style>
        </head>
        <body>
          <!-- OFFICIAL A4 LETTERHEAD HEADER -->
          <div class="letterhead-header">
            <img src="${logoSrc}" style="width: 70px; height: 70px; object-fit: contain;" alt="Logo" />
            <div class="clinic-brand">
              <div class="clinic-title">${cName}</div>
              <div class="clinic-tagline">${cTag}</div>
              <div class="clinic-address" style="font-size: 11px; font-weight: 700; color: #1e293b; margin-top: 2px;">10 Shalimar Road, Garhi Shahu, Lahore</div>
              <div class="clinic-timings" style="font-size: 10px; font-weight: 700; color: #047857; margin-top: 2px;">
                Clinic Timings: Morning 8:30 AM to 12:00 PM &nbsp;|&nbsp; Evening 4:30 PM to 9:00 PM
              </div>
            </div>
            <div style="width: 70px; text-align: right;">
              <span style="font-size: 9px; font-weight: 900; background: #0f172a; color: #fff; padding: 3px 6px; border-radius: 4px;">FINANCIAL</span>
            </div>
          </div>

          <!-- REPORT TITLE & TIMESTAMP BANNER -->
          <div class="report-banner">
            <div>
              <div class="report-title">CASH BOOK & FINANCIAL STATEMENT</div>
              <div style="font-size: 11px; font-weight: 700; color: #0284c7; margin-top: 2px;">Filter Period: ${dateLabel}</div>
            </div>
            <div style="text-align: right; font-size: 10px; color: #475569; font-weight: 600;">
              <div>Generated On: <strong>${new Date().toLocaleString('en-GB')}</strong></div>
              <div>Generated By: <strong>${currentUser?.FullName || currentUser?.LoginName || 'Authorized Officer'}</strong></div>
            </div>
          </div>

          <!-- SUMMARY FINANCIAL CARDS -->
          <div class="summary-grid">
            <div class="summary-card">
              <div class="card-label" style="color: #15803d;">TOTAL CASH COLLECTIONS (INFLOW)</div>
              <div class="card-val" style="color: #15803d;">Rs. ${cashBookMetrics.totalInflow.toLocaleString()}</div>
            </div>
            <div class="summary-card">
              <div class="card-label" style="color: #be123c;">TOTAL EXPENSES & OUTFLOWS</div>
              <div class="card-val" style="color: #be123c;">Rs. ${cashBookMetrics.totalOutflow.toLocaleString()}</div>
            </div>
            <div class="summary-card" style="background: #f0fdf4; border-color: #86efac;">
              <div class="card-label" style="color: #166534;">NET OPERATING BALANCE</div>
              <div class="card-val" style="color: ${cashBookMetrics.netBalance >= 0 ? '#15803d' : '#be123c'};">Rs. ${cashBookMetrics.netBalance.toLocaleString()}</div>
            </div>
          </div>

          <!-- TRANSACTIONS LEDGER TABLE -->
          <table>
            <thead>
              <tr>
                <th style="width: 25px; text-align: center;">#</th>
                <th style="width: 85px;">Date</th>
                <th style="width: 95px;">Ref / Vch #</th>
                <th>Particulars / Description</th>
                <th style="width: 140px;">Category</th>
                <th style="width: 65px; text-align: center;">Type</th>
                <th style="width: 110px; text-align: right;">Amount (PKR)</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
            <tfoot>
              <tr style="background: #f1f5f9; font-weight: bold; border-top: 2px solid #0f172a; font-size: 11px;">
                <td colspan="6" style="padding: 8px 6px; text-align: right; font-weight: 900; text-transform: uppercase;">Net Operating Ledger Balance:</td>
                <td style="padding: 8px 6px; text-align: right; font-family: monospace; font-size: 12px; font-weight: 900; color: ${cashBookMetrics.netBalance >= 0 ? '#15803d' : '#be123c'};">
                  Rs. ${cashBookMetrics.netBalance.toLocaleString()}
                </td>
              </tr>
            </tfoot>
          </table>

          <!-- LETTERHEAD FOOTER & SIGNATURES -->
          <div style="margin-top: 35px; padding-top: 15px; border-top: 2px solid #cbd5e1; display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; text-align: center; page-break-inside: avoid;">
            <div>
              <div style="border-bottom: 1.5px dashed #64748b; height: 35px; margin-bottom: 6px; display: flex; align-items: flex-end; justify-content: center; font-size: 10px; font-weight: 700; color: #334155;">
                ${currentUser?.FullName || 'Accountant'}
              </div>
              <div style="font-weight: 800; font-size: 9.5px; uppercase; color: #0f172a;">PREPARED BY</div>
              <div style="font-size: 8.5px; color: #64748b;">Accounts & Audit Desk</div>
            </div>

            <div>
              <div style="border-bottom: 1.5px dashed #64748b; height: 35px; margin-bottom: 6px;"></div>
              <div style="font-weight: 800; font-size: 9.5px; uppercase; color: #0f172a;">CHECKED BY</div>
              <div style="font-size: 8.5px; color: #64748b;">Internal Audit Wing</div>
            </div>

            <div>
              <div style="border-bottom: 1.5px dashed #64748b; height: 35px; margin-bottom: 6px;"></div>
              <div style="font-weight: 800; font-size: 9.5px; uppercase; color: #0f172a;">VERIFIED BY</div>
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

          <div style="margin-top: 15px; border-top: 1px solid #e2e8f0; padding-top: 8px; display: flex; justify-content: space-between; align-items: center; font-size: 9px; color: #64748b; font-weight: 600;">
            <div>Punjab Homeopathic Clinic & Pharmacy • Official Cash Book & Financial Statement</div>
            <div>Authorized Administrator: Mr. Zaigham Ali Anjum</div>
          </div>
        </body>
      </html>
    `);

    printWin.document.close();
    printWin.focus();
    setTimeout(() => printWin.print(), 400);
  };

  // Modals visibility state
  const [showVendorModal, setShowVendorModal] = useState(false);
  const [editingVendor, setEditingVendor] = useState<ErpVendor | null>(null);
  const [showPoModal, setShowPoModal] = useState(false);
  const [showGrnModal, setShowGrnModal] = useState(false);
  const [showTxnModal, setShowTxnModal] = useState(false);
  const [showEmpModal, setShowEmpModal] = useState(false);
  const [showPayrollModal, setShowPayrollModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showAssetModal, setShowAssetModal] = useState(false);
  const [showQrScannerModal, setShowQrScannerModal] = useState(false);
  const [showQrGeneratorModal, setShowQrGeneratorModal] = useState(false);

  // Bulk PO Upload Modal State
  const [showUploadBulkPoModal, setShowUploadBulkPoModal] = useState(false);
  const [bulkPoRawText, setBulkPoRawText] = useState('');
  const [bulkPoParsedItems, setBulkPoParsedItems] = useState<{
    ItemID: string;
    ItemName: string;
    Category: string;
    Qty: number;
    UnitPrice: number;
    BatchNo: string;
    isMatched: boolean;
    stockInHand?: number;
  }[]>([]);
  const [bulkPoDragActive, setBulkPoDragActive] = useState(false);
  const [bulkPoFileError, setBulkPoFileError] = useState('');
  const bulkPoFileInputRef = React.useRef<HTMLInputElement>(null);

  // Pay Vendor Popup Modal State
  const [payVendorModalData, setPayVendorModalData] = useState<{
    vendor: ErpVendor;
    invNo: string;
    poId: string;
    amount: number;
    paymentMethod: 'Cash' | 'Bank' | 'Cheque' | 'Online';
    date: string;
    category: string;
    description: string;
  } | null>(null);

  // Pay Vendor Payment History Date Filter State
  const [payHistoryStartDate, setPayHistoryStartDate] = useState<string>('');
  const [payHistoryEndDate, setPayHistoryEndDate] = useState<string>('');

  // Standalone Vendor Payment & Settlement History Modal State
  const [showPaymentHistoryModal, setShowPaymentHistoryModal] = useState(false);
  const [historyVendorFilter, setHistoryVendorFilter] = useState<string>('ALL');
  const [historyStartDate, setHistoryStartDate] = useState<string>('');
  const [historyEndDate, setHistoryEndDate] = useState<string>('');

  // Purchase Order Log Grid Search & Vendor Filters
  const [poLogSearchTerm, setPoLogSearchTerm] = useState<string>('');
  const [poLogVendorFilter, setPoLogVendorFilter] = useState<string>('ALL');
  const [poLogStatusFilter, setPoLogStatusFilter] = useState<string>('ALL');

  // GRN Inward Stock Log Grid Search & Vendor Filters
  const [grnLogSearchTerm, setGrnLogSearchTerm] = useState<string>('');
  const [grnLogVendorFilter, setGrnLogVendorFilter] = useState<string>('ALL');

  // Vendor Name options for Purchase Orders filter dropdown
  const poVendorList = useMemo(() => {
    const listSet = new Set<string>();
    vendors.forEach(v => {
      if (v.VendorName) listSet.add(v.VendorName.trim());
    });
    purchaseOrders.forEach(po => {
      if (po.VendorName) listSet.add(po.VendorName.trim());
    });
    return Array.from(listSet).sort();
  }, [vendors, purchaseOrders]);

  // Vendor Name options for GRN filter dropdown
  const grnVendorList = useMemo(() => {
    const listSet = new Set<string>();
    vendors.forEach(v => {
      if (v.VendorName) listSet.add(v.VendorName.trim());
    });
    grns.forEach(g => {
      if (g.VendorName) listSet.add(g.VendorName.trim());
    });
    return Array.from(listSet).sort();
  }, [vendors, grns]);

  // Filtered Purchase Orders
  const filteredPurchaseOrders = useMemo(() => {
    return purchaseOrders.filter(po => {
      if (poLogVendorFilter !== 'ALL' && po.VendorName !== poLogVendorFilter) {
        return false;
      }
      if (poLogStatusFilter !== 'ALL' && po.Status !== poLogStatusFilter) {
        return false;
      }
      if (poLogSearchTerm.trim()) {
        const q = poLogSearchTerm.trim().toLowerCase();
        const matchPoId = (po.POID || '').toLowerCase().includes(q);
        const matchVendor = (po.VendorName || '').toLowerCase().includes(q);
        const matchOrderDate = (po.OrderDate || '').toLowerCase().includes(q);
        const matchDelivDate = (po.ExpectedDeliveryDate || '').toLowerCase().includes(q);
        const matchItems = po.Items?.some(item =>
          (item.ItemName || '').toLowerCase().includes(q) ||
          (item.BatchNo || '').toLowerCase().includes(q)
        );
        if (!matchPoId && !matchVendor && !matchOrderDate && !matchDelivDate && !matchItems) {
          return false;
        }
      }
      return true;
    });
  }, [purchaseOrders, poLogSearchTerm, poLogVendorFilter, poLogStatusFilter]);

  const totalPoFilteredAmount = useMemo(() => {
    return filteredPurchaseOrders.reduce((sum, po) => sum + (po.TotalAmount || 0), 0);
  }, [filteredPurchaseOrders]);

  // Filtered GRNs
  const filteredGrns = useMemo(() => {
    return grns.filter(grn => {
      if (grnLogVendorFilter !== 'ALL' && grn.VendorName !== grnLogVendorFilter) {
        return false;
      }
      if (grnLogSearchTerm.trim()) {
        const q = grnLogSearchTerm.trim().toLowerCase();
        const matchGrnId = (grn.GRNID || '').toLowerCase().includes(q);
        const matchPoId = (grn.POID || '').toLowerCase().includes(q);
        const matchVendor = (grn.VendorName || '').toLowerCase().includes(q);
        const matchChallan = (grn.ChallanNo || '').toLowerCase().includes(q);
        const matchInvoice = (grn.SupplierInvoiceNo || '').toLowerCase().includes(q);
        const matchDate = (grn.ReceivedDate || '').toLowerCase().includes(q);
        const matchItems = grn.Items?.some(item =>
          (item.ItemName || '').toLowerCase().includes(q) ||
          (item.BatchNo || '').toLowerCase().includes(q)
        );
        if (!matchGrnId && !matchPoId && !matchVendor && !matchChallan && !matchInvoice && !matchDate && !matchItems) {
          return false;
        }
      }
      return true;
    });
  }, [grns, grnLogSearchTerm, grnLogVendorFilter]);

  const totalGrnFilteredAmount = useMemo(() => {
    return filteredGrns.reduce((sum, grn) => sum + (grn.TotalAmount || 0), 0);
  }, [filteredGrns]);

  // PO Payment History Grid View Modal State
  const [poHistoryModalData, setPoHistoryModalData] = useState<{
    vendor: ErpVendor;
    poId?: string;
  } | null>(null);
  const [poHistoryFilterPo, setPoHistoryFilterPo] = useState<string>('ALL');

  // Vendor POs Modal State
  const [vendorPoModalData, setVendorPoModalData] = useState<ErpVendor | null>(null);

  // Selected item for Edit/Print
  const [selectedPoForPrint, setSelectedPoForPrint] = useState<ErpPurchaseOrder | null>(null);

  // GRN Form State
  const [grnForm, setGrnForm] = useState<{
    POID: string;
    GRNID: string;
    VendorID: string;
    VendorName: string;
    ReceivedDate: string;
    ChallanNo: string;
    SupplierInvoiceNo: string;
    Remarks: string;
    Items: { ItemID: string; ItemName: string; OrderedQty: number; ReceivedQty: number; UnitPrice: number; LineTotal: number; BatchNo?: string; ExpiryDate?: string }[];
  }>({
    POID: '',
    GRNID: '',
    VendorID: '',
    VendorName: '',
    ReceivedDate: new Date().toISOString().split('T')[0],
    ChallanNo: '',
    SupplierInvoiceNo: '',
    Remarks: '',
    Items: []
  });

  // Form States
  const [vendorForm, setVendorForm] = useState<Partial<ErpVendor>>({
    VendorID: '',
    VendorName: '',
    ContactPerson: '',
    Phone: '',
    Email: '',
    Address: '',
    TaxID: '',
    Balance: 0,
    Status: 'Active'
  });

  const [poForm, setPoForm] = useState<{
    VendorID: string;
    VendorName: string;
    ExpectedDeliveryDate: string;
    Notes: string;
    Items: { ItemID: string; ItemName: string; Category?: string; Qty: number; UnitPrice: number; BatchNo?: string; ExpiryDate?: string }[];
  }>({
    VendorID: '',
    VendorName: '',
    ExpectedDeliveryDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
    Notes: '',
    Items: [{ ItemID: 'ITM-001', ItemName: 'Panadol Extra 500mg', Category: 'Tablet / Capsule', Qty: 100, UnitPrice: 120, BatchNo: 'B-2026-001' }]
  });

  const [txnForm, setTxnForm] = useState<Partial<ErpTransaction> & { VendorID?: string; VendorName?: string }>({
    Type: 'Expense',
    Category: 'Office Maintenance',
    Description: '',
    Amount: 0,
    PaymentMethod: 'Cash',
    ReferenceNo: '',
    Date: new Date().toISOString().split('T')[0],
    VendorID: '',
    VendorName: ''
  });

  const [empForm, setEmpForm] = useState<Partial<ErpEmployee>>({
    FullName: '',
    Role: 'Pharmacist Assistant',
    Department: 'Pharmacy',
    Phone: '',
    Email: '',
    JoiningDate: new Date().toISOString().split('T')[0],
    Salary: 45000,
    Status: 'Active',
    CNIC: '',
    BankAccount: ''
  });

  const [payrollForm, setPayrollForm] = useState<{
    EmployeeID: string;
    MonthYear: string;
    BasicSalary: number;
    Allowances: number;
    Deductions: number;
    PaymentMethod: 'Cash' | 'Bank' | 'Cheque' | 'Online';
  }>({
    EmployeeID: '',
    MonthYear: new Date().toISOString().slice(0, 7),
    BasicSalary: 0,
    Allowances: 2000,
    Deductions: 0,
    PaymentMethod: 'Bank'
  });

  const DEFAULT_EXPENSE_CATEGORIES = useMemo(() => [
    'Utilities',
    'Rent',
    'Maintenance',
    'Refreshment',
    'Marketing',
    'Supplies',
    'Salaries',
    'Other'
  ], []);

  const [customExpenseCategories, setCustomExpenseCategories] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('phc_custom_expense_categories');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [showAddCategoryInput, setShowAddCategoryInput] = useState<boolean>(false);
  const [newCategoryName, setNewCategoryName] = useState<string>('');
  const [editingCategoryName, setEditingCategoryName] = useState<string | null>(null);
  const [editCategoryNewValue, setEditCategoryNewValue] = useState<string>('');

  const [expenseForm, setExpenseForm] = useState<Partial<ErpExpense>>({
    Category: 'Utilities',
    Description: '',
    Amount: 0,
    ExpenseDate: new Date().toISOString().split('T')[0],
    PaymentMethod: 'Cash',
    ReceiptRef: ''
  });

  const allExpenseCategories = useMemo(() => {
    const existingFromDb = (expenses || []).map(e => e.Category).filter(Boolean);
    const combined = [...DEFAULT_EXPENSE_CATEGORIES, ...customExpenseCategories, ...existingFromDb];
    return Array.from(new Set(combined));
  }, [DEFAULT_EXPENSE_CATEGORIES, customExpenseCategories, expenses]);

  const handleSaveNewCategory = () => {
    const trimmed = newCategoryName.trim();
    if (!trimmed) return;

    if (!allExpenseCategories.some(c => c.toLowerCase() === trimmed.toLowerCase())) {
      const updated = [...customExpenseCategories, trimmed];
      setCustomExpenseCategories(updated);
      try {
        localStorage.setItem('phc_custom_expense_categories', JSON.stringify(updated));
      } catch (err) {
        console.error(err);
      }
    }

    setExpenseForm(prev => ({ ...prev, Category: trimmed }));
    setShowAddCategoryInput(false);
    setNewCategoryName('');
  };

  const handleStartEditCategory = (cat: string) => {
    setEditingCategoryName(cat);
    setEditCategoryNewValue(cat);
    setShowAddCategoryInput(false);
  };

  const handleSaveEditedCategory = () => {
    if (!editingCategoryName) return;
    const trimmed = editCategoryNewValue.trim();
    if (!trimmed) return;

    if (trimmed !== editingCategoryName) {
      let updatedCustoms = [...customExpenseCategories];
      if (updatedCustoms.includes(editingCategoryName)) {
        updatedCustoms = updatedCustoms.map(c => c === editingCategoryName ? trimmed : c);
      } else {
        updatedCustoms.push(trimmed);
      }
      setCustomExpenseCategories(updatedCustoms);
      try {
        localStorage.setItem('phc_custom_expense_categories', JSON.stringify(updatedCustoms));
      } catch (e) {
        console.error(e);
      }

      if (expenseForm.Category === editingCategoryName) {
        setExpenseForm(prev => ({ ...prev, Category: trimmed }));
      }
    }

    setEditingCategoryName(null);
    setEditCategoryNewValue('');
  };

  const handleDeleteCategory = (catToDelete: string) => {
    const updatedCustoms = customExpenseCategories.filter(c => c !== catToDelete);
    setCustomExpenseCategories(updatedCustoms);
    try {
      localStorage.setItem('phc_custom_expense_categories', JSON.stringify(updatedCustoms));
    } catch (e) {
      console.error(e);
    }

    if (expenseForm.Category === catToDelete) {
      const remaining = allExpenseCategories.filter(c => c !== catToDelete);
      setExpenseForm(prev => ({ ...prev, Category: remaining[0] || 'Utilities' }));
    }
  };

  const [assetForm, setAssetForm] = useState<Partial<ErpAsset>>({
    AssetName: '',
    Category: 'Equipment',
    PurchaseDate: new Date().toISOString().split('T')[0],
    PurchaseCost: 0,
    CurrentValue: 0,
    DepreciationRate: 10,
    Status: 'Active'
  });

  // Safe JSON Fetch Helper
  const safeFetchJson = async (url: string, fallback: any = []) => {
    try {
      const res = await fetch(url);
      if (!res.ok) return fallback;
      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) return fallback;
      return await res.json();
    } catch {
      return fallback;
    }
  };

  // Initial Fetching from API Database
  const fetchErpData = async () => {
    setLoading(true);
    try {
      const [
        vRes, poRes, grnRes, txRes, empRes, payRes, expRes, astRes, itemsRes, apptsRes, visitsRes, salesRes
      ] = await Promise.all([
        safeFetchJson('/api/query/erp_vendors'),
        safeFetchJson('/api/query/erp_purchase_orders'),
        safeFetchJson('/api/query/erp_grn'),
        safeFetchJson('/api/query/erp_transactions'),
        safeFetchJson('/api/query/erp_employees'),
        safeFetchJson('/api/query/erp_payroll'),
        safeFetchJson('/api/query/erp_expenses'),
        safeFetchJson('/api/query/erp_assets'),
        safeFetchJson('/api/items'),
        safeFetchJson('/api/appointments'),
        safeFetchJson('/api/visits'),
        safeFetchJson('/api/billing/invoices')
      ]);

      if (Array.isArray(vRes)) setVendors(vRes);
      if (Array.isArray(grnRes)) setGrns(grnRes);
      if (Array.isArray(poRes)) {
        const loadedGrns = Array.isArray(grnRes) ? grnRes : [];
        const normalizedPos = poRes.map((po: any) => {
          const currentComputedStatus = calculatePoStatus(po, loadedGrns);
          if (currentComputedStatus !== po.Status) {
            const updatedPo = { ...po, Status: currentComputedStatus };
            saveToDatabase('erp_purchase_orders', updatedPo);
            return updatedPo;
          }
          return po;
        });
        setPurchaseOrders(normalizedPos);
      }
      if (Array.isArray(txRes)) setTransactions(txRes);
      if (Array.isArray(empRes)) setEmployees(empRes);
      if (Array.isArray(payRes)) setPayrolls(payRes);
      if (Array.isArray(expRes)) setExpenses(expRes);
      if (Array.isArray(astRes)) setAssets(astRes);
      if (Array.isArray(apptsRes)) setAppointments(apptsRes);
      if (Array.isArray(visitsRes)) setPatientVisits(visitsRes);
      if (Array.isArray(salesRes)) {
        setPosSales(salesRes);
      } else if (salesRes && Array.isArray(salesRes.headers)) {
        setPosSales(salesRes.headers);
      }

      if (Array.isArray(itemsRes)) {
        setInventoryItems(itemsRes);
      }

      setSyncMessage('Data retrieved successfully!');
      setTimeout(() => setSyncMessage(null), 3000);
    } catch (err) {
      console.error('Failed to load ERP data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchErpData();
    const handleDbUpdate = () => fetchErpData();
    window.addEventListener('phc_db_updated', handleDbUpdate);
    return () => window.removeEventListener('phc_db_updated', handleDbUpdate);
  }, []);

  // Universal Database Helper (Insert, Retrieve, Delete)
  const saveToDatabase = async (collection: string, data: any, forceMethod?: 'PUT' | 'POST') => {
    try {
      const id = data._id || data.VendorID || data.SID || data.SupplierID || data.TransactionID || data.ExpenseID || data.EmployeeID || data.AssetID || data.POID || data.GRNID;
      const method = forceMethod || (id ? 'PUT' : 'POST');
      const url = (method === 'PUT' && id) ? `/api/query/${collection}/${encodeURIComponent(id)}` : `/api/query/${collection}`;
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const ct = res.headers.get('content-type') || '';
      const result = ct.includes('application/json') ? await res.json() : { success: false };
      window.dispatchEvent(new CustomEvent('phc_db_updated'));
      return result;
    } catch (e) {
      console.error(`Failed to save to ${collection}:`, e);
      return { success: false };
    }
  };

  const deleteFromDatabase = async (collection: string, id: string) => {
    try {
      const res = await fetch(`/api/query/${collection}/${id}`, {
        method: 'DELETE'
      });
      const ct = res.headers.get('content-type') || '';
      const result = ct.includes('application/json') ? await res.json() : { success: false };
      window.dispatchEvent(new CustomEvent('phc_db_updated'));
      return result;
    } catch (e) {
      console.error(`Failed to delete from ${collection}:`, e);
      return { success: false };
    }
  };

  // Purge All Dummy & Test Records Function
  const handlePurgeAllDummyData = async () => {
    if (!window.confirm('Are you sure you want to completely purge and remove all dummy, test, and sample records from the ERP database and system state? Real entries will be retained.')) {
      return;
    }
    setLoading(true);
    setSyncMessage('Purging all dummy and test records from ERP & database...');

    try {
      const res = await fetch('/api/admin/purge-dummy-records', { method: 'POST' });
      const data = await res.json();

      // Clean local React state
      setExpenses(prev => prev.filter(e => !e.ExpenseID?.startsWith('EXP-50') && !e.ExpenseID?.startsWith('TEST-')));
      setAssets(prev => prev.filter(a => !a.AssetID?.startsWith('AST-10') && !a.AssetID?.startsWith('TEST-')));
      setTransactions(prev => prev.filter(t => !t.TransactionID?.startsWith('TXN-80') && !t.TransactionID?.startsWith('TEST-')));
      setPurchaseOrders(prev => prev.filter(p => !p.POID?.startsWith('PO-100') && !p.POID?.startsWith('TEST-')));
      setPayrolls(prev => prev.filter(p => !p.PayrollID?.startsWith('PAY-2026-07') && !p.PayrollID?.startsWith('TEST-')));
      setVendors(prev => prev.filter(v => !v.VendorID?.startsWith('VND-00') && !v.VendorID?.startsWith('TEST-')));
      setEmployees(prev => prev.filter(e => !e.EmployeeID?.startsWith('EMP-10') && !e.EmployeeID?.startsWith('TEST-')));

      // Re-fetch clean database records
      await fetchErpData();

      alert(data.message || 'Clean slate initialized! All dummy entries have been permanently removed.');
    } catch (err: any) {
      alert(`Purge Failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // HANDLERS FOR VENDORS
  const handleOpenAddVendor = () => {
    setEditingVendor(null);
    setVendorForm({
      VendorID: `VND-${Math.floor(100 + Math.random() * 900)}`,
      VendorName: '',
      ContactPerson: '',
      Phone: '',
      Email: '',
      Address: '',
      TaxID: '',
      Balance: 0,
      Status: 'Active'
    });
    setShowVendorModal(true);
  };

  const handleOpenEditVendor = (vendor: ErpVendor) => {
    setEditingVendor(vendor);
    setVendorForm({
      _id: vendor._id,
      VendorID: vendor.VendorID || '',
      VendorName: vendor.VendorName || '',
      ContactPerson: vendor.ContactPerson || '',
      Phone: vendor.Phone || '',
      Email: vendor.Email || '',
      Address: vendor.Address || '',
      TaxID: vendor.TaxID || '',
      Balance: vendor.Balance || 0,
      Status: vendor.Status || 'Active'
    });
    setShowVendorModal(true);
  };

  const handleOpenEditVendorTop = () => {
    if (vendors.length === 0) {
      alert('No suppliers / vendors found in database to edit. Please add a vendor first.');
      return;
    }
    const target = (selectedVendorId ? vendors.find(v => (v.VendorID === selectedVendorId || v._id === selectedVendorId)) : null) || vendors[0];
    handleOpenEditVendor(target);
  };

  const handleSaveVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (!vendorForm.VendorName?.trim()) return alert('Vendor Name is required.');

    // Prevent duplicate vendor name except when editing the same vendor
    const trimmedName = vendorForm.VendorName.trim().toLowerCase();
    const duplicate = vendors.find(v => {
      const isSameVendor = editingVendor 
        ? ((editingVendor._id && v._id === editingVendor._id) || (editingVendor.VendorID && v.VendorID === editingVendor.VendorID))
        : false;
      if (isSameVendor) return false;
      return v.VendorName?.trim().toLowerCase() === trimmedName;
    });

    if (duplicate) {
      return alert('Another vendor with this name already exists! Duplicate entry prevented.');
    }

    setIsSubmitting(true);
    try {
      if (editingVendor) {
        // UPDATE EXISTING VENDOR
        const updatedVendor: ErpVendor = {
          ...editingVendor,
          VendorName: vendorForm.VendorName.trim(),
          ContactPerson: vendorForm.ContactPerson || 'N/A',
          Phone: vendorForm.Phone || 'N/A',
          Email: vendorForm.Email || '',
          Address: vendorForm.Address || 'Lahore, Pakistan',
          TaxID: vendorForm.TaxID || '',
          Balance: Number(vendorForm.Balance) || 0,
          Status: (vendorForm.Status as 'Active' | 'Inactive') || 'Active'
        };

        await saveToDatabase('erp_vendors', updatedVendor, 'PUT');

        setVendors(prev => prev.map(v => {
          const isMatch = (editingVendor._id && v._id === editingVendor._id) ||
                          (editingVendor.VendorID && v.VendorID === editingVendor.VendorID);
          return isMatch ? updatedVendor : v;
        }));

        // Cascade vendor name change if name was edited
        if (editingVendor.VendorName !== updatedVendor.VendorName) {
          setPurchaseOrders(prev => prev.map(po => {
            if (po.VendorID === updatedVendor.VendorID || po.VendorName === editingVendor.VendorName) {
              return { ...po, VendorName: updatedVendor.VendorName };
            }
            return po;
          }));
        }

        setShowVendorModal(false);
        setEditingVendor(null);
        setVendorForm({ VendorName: '', ContactPerson: '', Phone: '', Address: '', Balance: 0, Status: 'Active' });
        setSyncMessage('Vendor details updated successfully in database!');
        setTimeout(() => setSyncMessage(null), 3000);
      } else {
        // REGISTER NEW VENDOR
        const newVendor: ErpVendor = {
          VendorID: vendorForm.VendorID || `VND-${Math.floor(100 + Math.random() * 900)}`,
          VendorName: vendorForm.VendorName.trim(),
          ContactPerson: vendorForm.ContactPerson || 'N/A',
          Phone: vendorForm.Phone || 'N/A',
          Email: vendorForm.Email || '',
          Address: vendorForm.Address || 'Lahore, Pakistan',
          TaxID: vendorForm.TaxID || '',
          Balance: Number(vendorForm.Balance) || 0,
          Status: (vendorForm.Status as 'Active' | 'Inactive') || 'Active'
        };

        await saveToDatabase('erp_vendors', newVendor, 'POST');
        setVendors(prev => [newVendor, ...prev]);
        setShowVendorModal(false);
        setEditingVendor(null);
        setVendorForm({ VendorName: '', ContactPerson: '', Phone: '', Address: '', Balance: 0, Status: 'Active' });
        setSyncMessage('Vendor saved successfully!');
        setTimeout(() => setSyncMessage(null), 3000);
      }
    } catch (err: any) {
      alert('Error saving vendor: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteVendor = async (vendor: ErpVendor) => {
    if (!confirm(`Are you sure you want to delete Vendor "${vendor.VendorName}"?`)) return;
    const targetId = vendor._id || vendor.VendorID;
    await deleteFromDatabase('erp_vendors', targetId);
    setVendors(prev => prev.filter(v => (v._id ? v._id !== vendor._id : v.VendorID !== vendor.VendorID)));
    setSyncMessage('Vendor deleted successfully!');
    setTimeout(() => setSyncMessage(null), 3000);
  };

  // HANDLERS FOR PURCHASE ORDERS & STOCK REQUISITION
  const getRequiredQty = (item: any) => {
    const reorder = Number(item?.ReorderQty) || Number(item?.reorderQty) || 0;
    if (reorder > 0) return reorder;
    const minStock = Number(item?.MinStock ?? item?.minStock ?? 1);
    const cStock = Number(item?.CStock ?? item?.Stock ?? 0);
    const diff = (minStock * 2) - cStock;
    return diff > 0 ? diff : (minStock > 0 ? minStock * 2 : 10);
  };

  const isMedicineSelectedInPo = (itemId: string, itemName: string) => {
    return poForm.Items.some(i => (i.ItemID && i.ItemID === itemId) || i.ItemName === itemName);
  };

  const handleToggleMedicineForPo = (med: any) => {
    const isSelected = isMedicineSelectedInPo(med.ItemID, med.ItemName);
    if (isSelected) {
      setPoForm(prev => ({
        ...prev,
        Items: prev.Items.filter(i => i.ItemID !== med.ItemID && i.ItemName !== med.ItemName)
      }));
    } else {
      const reqQty = getRequiredQty(med);
      const unitPrice = med.PurchasePrice ?? med.Price ?? 0;
      const cat = med.Category || (med.MedicineType === 'C' ? 'Clinical / Compounded' : med.MedicineType === 'P' ? 'Patent / Pre-packaged' : 'Tablet / Capsule');
      setPoForm(prev => ({
        ...prev,
        Items: [
          ...prev.Items.filter(i => i.ItemName !== ''),
          {
            ItemID: med.ItemID || `ITM-${Math.floor(100 + Math.random() * 900)}`,
            ItemName: med.ItemName,
            Category: cat,
            Qty: reqQty,
            UnitPrice: unitPrice,
            BatchNo: med.BatchNo || `B-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`
          }
        ]
      }));
    }
  };

  const handleSelectAllLowStockMedicines = () => {
    const lowStockItems = inventoryItems.filter(med => (med.CStock ?? 0) <= ((med.MinStock !== undefined && med.MinStock !== null) ? med.MinStock : 1));
    if (lowStockItems.length === 0) {
      alert('All medicine stock levels are currently adequate!');
      return;
    }

    const newPoItems = lowStockItems.map(med => ({
      ItemID: med.ItemID || `ITM-${Math.floor(100 + Math.random() * 900)}`,
      ItemName: med.ItemName,
      Category: med.Category || (med.MedicineType === 'C' ? 'Clinical / Compounded' : med.MedicineType === 'P' ? 'Patent / Pre-packaged' : 'Tablet / Capsule'),
      Qty: getRequiredQty(med),
      UnitPrice: med.PurchasePrice ?? med.Price ?? 0,
      BatchNo: med.BatchNo || `B-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`
    }));

    setPoForm(prev => ({
      ...prev,
      Items: newPoItems
    }));
  };

  // BULK PO EXCEL & TEXT PARSING HANDLERS
  const parseAndMatchBulkPoData = (rows: { name: string; qty: number; price?: number }[]) => {
    const result: {
      ItemID: string;
      ItemName: string;
      Category: string;
      Qty: number;
      UnitPrice: number;
      BatchNo: string;
      isMatched: boolean;
      stockInHand?: number;
    }[] = [];

    rows.forEach((row) => {
      const cleanName = String(row.name || '').trim();
      if (!cleanName) return;

      const qty = Math.max(0, Number(row.qty) || 0);
      const customPrice = row.price !== undefined && row.price !== null && !isNaN(Number(row.price)) ? Number(row.price) : undefined;

      const matched = (inventoryItems || []).find((inv: any) => {
        const invName = String(inv.ItemName || inv.Name || '').toLowerCase().trim();
        const searchName = cleanName.toLowerCase();
        return invName === searchName || invName.replace(/[^a-z0-9]/g, '') === searchName.replace(/[^a-z0-9]/g, '');
      });

      if (matched) {
        const unitPrice = (customPrice !== undefined && customPrice >= 0)
          ? customPrice
          : (matched.PurchasePrice ?? matched.Price ?? 0);

        const cat = matched.Category || (matched.MedicineType === 'C' ? 'Clinical / Compounded' : matched.MedicineType === 'P' ? 'Patent / Pre-packaged' : 'Tablet / Capsule');

        result.push({
          ItemID: matched.ItemID || matched._id || `ITM-${Math.floor(100 + Math.random() * 900)}`,
          ItemName: matched.ItemName || matched.Name || cleanName,
          Category: cat,
          Qty: qty,
          UnitPrice: unitPrice,
          BatchNo: matched.BatchNo || `B-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
          isMatched: true,
          stockInHand: matched.CStock ?? matched.Stock ?? 0
        });
      } else {
        const unitPrice = (customPrice !== undefined && customPrice >= 0) ? customPrice : 0;
        result.push({
          ItemID: `ITM-${Math.floor(100 + Math.random() * 900)}`,
          ItemName: cleanName,
          Category: 'Tablet / Capsule',
          Qty: qty,
          UnitPrice: unitPrice,
          BatchNo: `B-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
          isMatched: false,
          stockInHand: 0
        });
      }
    });

    setBulkPoParsedItems(result);
  };

  const handleBulkPoExcelRead = (file: File) => {
    if (!file) return;
    const fileExt = file.name.split('.').pop()?.toLowerCase();
    if (fileExt !== 'xlsx' && fileExt !== 'xls' && fileExt !== 'csv') {
      setBulkPoFileError('Invalid file format. Please upload an Excel (.xlsx, .xls) or CSV (.csv) file.');
      return;
    }
    setBulkPoFileError('');

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        import('xlsx').then((XLSX) => {
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

          if (!rawData || rawData.length === 0) {
            setBulkPoFileError('The uploaded sheet is empty.');
            return;
          }

          let nameIdx = 0;
          let qtyIdx = 1;
          let priceIdx = 2;
          let startRow = 0;

          const firstRow = rawData[0].map(c => String(c || '').toLowerCase().trim());
          const hasHeader = firstRow.some(c => c.includes('item') || c.includes('name') || c.includes('qty') || c.includes('quantity') || c.includes('price') || c.includes('rate'));

          if (hasHeader) {
            startRow = 1;
            const foundName = firstRow.findIndex(c => c.includes('item') || c.includes('name') || c.includes('medicine') || c.includes('desc'));
            const foundQty = firstRow.findIndex(c => c.includes('qty') || c.includes('quantity') || c.includes('po') || c.includes('required'));
            const foundPrice = firstRow.findIndex(c => c.includes('price') || c.includes('rate') || c.includes('cost') || c.includes('unit'));

            if (foundName >= 0) nameIdx = foundName;
            if (foundQty >= 0) qtyIdx = foundQty;
            if (foundPrice >= 0) priceIdx = foundPrice;
          }

          const parsedRows: { name: string; qty: number; price?: number }[] = [];
          for (let i = startRow; i < rawData.length; i++) {
            const row = rawData[i];
            if (!row || row.length === 0) continue;
            const nameStr = String(row[nameIdx] || '').trim();
            if (!nameStr) continue;

            const qtyVal = parseFloat(String(row[qtyIdx] || '0')) || 0;
            const priceRaw = row[priceIdx] !== undefined && row[priceIdx] !== null ? parseFloat(String(row[priceIdx])) : NaN;
            const priceVal = !isNaN(priceRaw) ? priceRaw : undefined;

            parsedRows.push({ name: nameStr, qty: qtyVal, price: priceVal });
          }

          parseAndMatchBulkPoData(parsedRows);
        });
      } catch (err: any) {
        setBulkPoFileError('Failed to read Excel file: ' + err.message);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleParseBulkPoText = (text: string) => {
    setBulkPoRawText(text);
    if (!text.trim()) {
      setBulkPoParsedItems([]);
      return;
    }

    const lines = text.split(/\r?\n/);
    const parsedRows: { name: string; qty: number; price?: number }[] = [];

    lines.forEach((line, idx) => {
      const trimmed = line.trim();
      if (!trimmed) return;

      let parts = trimmed.split('\t');
      if (parts.length < 2) parts = trimmed.split(',');
      if (parts.length < 2) parts = trimmed.split(';');

      if (parts.length >= 1) {
        const col0 = parts[0].trim();
        if (idx === 0 && (col0.toLowerCase().includes('item') || col0.toLowerCase().includes('name') || col0.toLowerCase().includes('medicine'))) {
          return;
        }

        const col1Val = parts.length >= 2 ? parseFloat(parts[1].trim()) : 0;
        const col2Val = parts.length >= 3 ? parseFloat(parts[2].trim()) : NaN;

        parsedRows.push({
          name: col0,
          qty: !isNaN(col1Val) ? col1Val : 0,
          price: !isNaN(col2Val) ? col2Val : undefined
        });
      }
    });

    parseAndMatchBulkPoData(parsedRows);
  };

  const handleApplyBulkPoToForm = () => {
    if (bulkPoParsedItems.length === 0) return;

    const poItems = bulkPoParsedItems.map(item => ({
      ItemID: item.ItemID,
      ItemName: item.ItemName,
      Category: item.Category,
      Qty: item.Qty,
      UnitPrice: item.UnitPrice,
      BatchNo: item.BatchNo
    }));

    setPoForm(prev => ({
      ...prev,
      Items: poItems
    }));

    setShowUploadBulkPoModal(false);
    setShowPoModal(true);
    setSyncMessage(`${poItems.length} Bulk items loaded into Purchase Order form!`);
    setTimeout(() => setSyncMessage(null), 4000);
  };

  const handleAddPoItem = () => {
    setPoForm(prev => ({
      ...prev,
      Items: [...prev.Items, { ItemID: `ITM-${Date.now().toString().slice(-3)}`, ItemName: '', Category: 'Tablet / Capsule', Qty: 0, UnitPrice: 100, BatchNo: `B-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}` }]
    }));
  };

  const handleUpdatePoItem = (index: number, field: string, value: any) => {
    setPoForm(prev => {
      const updated = [...prev.Items];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, Items: updated };
    });
  };

  const handleCreatePo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (!poForm.VendorName) return alert('Please select a supplier / vendor.');
    if (!poForm.Items || poForm.Items.length === 0) return alert('Please select at least one medicine item for the Purchase Order.');

    setIsSubmitting(true);
    try {
      const selectedVendor = vendors.find(v => v.VendorName === poForm.VendorName);
      const newPo: ErpPurchaseOrder = {
        POID: `PO-${Math.floor(1000 + Math.random() * 9000)}`,
        VendorID: poForm.VendorID || selectedVendor?.VendorID || `VND-${Math.floor(100 + Math.random() * 900)}`,
        VendorName: poForm.VendorName,
        OrderDate: new Date().toISOString().split('T')[0],
        ExpectedDeliveryDate: poForm.ExpectedDeliveryDate,
        TotalAmount: 0, // Valuation determined when invoice is entered in GRN
        PaidAmount: 0,
        Status: 'Sent',
        Notes: poForm.Notes,
        Items: poForm.Items.map(i => ({
          ItemID: i.ItemID,
          ItemName: i.ItemName || 'General Item',
          Category: i.Category || 'General Medicine',
          Qty: Number(i.Qty) || 1,
          UnitPrice: Number(i.UnitPrice || 0),
          LineTotal: 0,
          BatchNo: i.BatchNo || `B-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`
        }))
      };

      await saveToDatabase('erp_purchase_orders', newPo);
      setPurchaseOrders(prev => [newPo, ...prev]);
      setShowPoModal(false);
      setSyncMessage('Purchase Order saved successfully!');
      setTimeout(() => setSyncMessage(null), 3000);
    } catch (err: any) {
      alert('Error creating Purchase Order: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePo = async (po: ErpPurchaseOrder) => {
    if (!confirm(`Delete Purchase Order ${po.POID}? This will also remove linked Goods Received Notes and revert inventory stock.`)) return;
    const targetId = po._id || po.POID;

    // Delete linked GRNs on server and revert stock / vendor balances
    const matchGrns = grns.filter(g => g.POID === po.POID);
    for (const g of matchGrns) {
      await fetch('/api/erp/grn/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: g._id, grnId: g.GRNID })
      });

      if (Array.isArray(g.Items) && g.Items.length > 0) {
        setInventoryItems(prev => prev.map((inv: any) => {
          const matchedItemInGrn = g.Items.find(gi =>
            (gi.ItemID && inv.ItemID && String(inv.ItemID).toLowerCase() === String(gi.ItemID).toLowerCase()) ||
            (gi.ItemName && inv.ItemName && String(inv.ItemName).trim().toLowerCase() === String(gi.ItemName).trim().toLowerCase())
          );
          if (matchedItemInGrn) {
            const qtyRec = Number(matchedItemInGrn.ReceivedQty) || Number(matchedItemInGrn.Qty) || 0;
            const currentStock = Number(inv.CStock) || Number(inv.Stock) || 0;
            const newStock = Math.max(0, currentStock - qtyRec);
            return { ...inv, CStock: newStock, Stock: newStock };
          }
          return inv;
        }));
      }
    }
    setGrns(prev => prev.filter(g => g.POID !== po.POID));

    await deleteFromDatabase('erp_purchase_orders', targetId);
    setPurchaseOrders(prev => prev.filter(p => (p._id ? p._id !== po._id : p.POID !== po.POID)));

    setSyncMessage('Purchase Order and linked GRNs deleted successfully!');
    setTimeout(() => setSyncMessage(null), 3000);
    window.dispatchEvent(new CustomEvent('phc_db_updated'));
  };

  const calculatePoStatus = (po: ErpPurchaseOrder, grnsList: ErpGrn[], extraReceivingItems?: any[]): 'Received' | 'Partially Received' | 'Approved' | 'Sent' | 'Draft' => {
    if (!po || !Array.isArray(po.Items) || po.Items.length === 0) return (po?.Status as any) || 'Approved';
    
    const approvedGrns = grnsList.filter(g => g.POID === po.POID && (g.Status === 'Approved' || !g.Status));
    
    let isFullyReceived = true;
    let isPartiallyReceived = false;

    let totalOrderedSum = 0;
    let totalReceivedSum = 0;

    po.Items.forEach((poItem, idx) => {
      const ordered = Number(poItem.Qty) || 0;
      totalOrderedSum += ordered;
      let cumulativeReceived = 0;

      approvedGrns.forEach(g => {
        if (Array.isArray(g.Items)) {
          let matched = null;
          if (poItem.ItemID && String(poItem.ItemID).trim() !== '') {
            matched = g.Items.find((gi: any) => gi.ItemID && String(gi.ItemID).trim().toLowerCase() === String(poItem.ItemID).trim().toLowerCase());
          }
          if (!matched && poItem.ItemName && String(poItem.ItemName).trim() !== '') {
            matched = g.Items.find((gi: any) => gi.ItemName && String(gi.ItemName).trim().toLowerCase() === String(poItem.ItemName).trim().toLowerCase());
          }
          if (!matched && g.Items[idx]) {
            matched = g.Items[idx];
          }
          if (matched) {
            cumulativeReceived += Number(matched.ReceivedQty) || Number(matched.Qty) || 0;
          }
        }
      });

      if (extraReceivingItems && extraReceivingItems.length > 0) {
        let currentGrnItem = null;
        if (poItem.ItemID && String(poItem.ItemID).trim() !== '') {
          currentGrnItem = extraReceivingItems.find((gi: any) => gi.ItemID && String(gi.ItemID).trim().toLowerCase() === String(poItem.ItemID).trim().toLowerCase());
        }
        if (!currentGrnItem && poItem.ItemName && String(poItem.ItemName).trim() !== '') {
          currentGrnItem = extraReceivingItems.find((gi: any) => gi.ItemName && String(gi.ItemName).trim().toLowerCase() === String(poItem.ItemName).trim().toLowerCase());
        }
        if (!currentGrnItem && extraReceivingItems[idx]) {
          currentGrnItem = extraReceivingItems[idx];
        }
        if (currentGrnItem) {
          cumulativeReceived += Number(currentGrnItem.ReceivedQty) || Number(currentGrnItem.Qty) || 0;
        }
      }

      totalReceivedSum += cumulativeReceived;

      if (cumulativeReceived < ordered) {
        isFullyReceived = false;
      }
      if (cumulativeReceived > 0) {
        isPartiallyReceived = true;
      }
    });

    if (totalOrderedSum > 0 && totalReceivedSum >= totalOrderedSum) {
      isFullyReceived = true;
    }

    if (approvedGrns.length > 0 || (extraReceivingItems && extraReceivingItems.length > 0)) {
      if (isFullyReceived) return 'Received';
      if (isPartiallyReceived) return 'Partially Received';
    }

    return (po.Status && po.Status !== 'Received' && po.Status !== 'Partially Received') ? (po.Status as any) : 'Approved';
  };

  // HANDLERS FOR GOODS RECEIVED NOTE (GRN) & PARTIAL BATCH RECEIVING
  const getPoItemsReceiptInfo = (po: ErpPurchaseOrder) => {
    const approvedGrns = grns.filter(g => g.POID === po.POID && (g.Status === 'Approved' || !g.Status));
    const items = po.Items.map((i, idx) => {
      const ordered = Number(i.Qty) || 0;
      let alreadyReceived = 0;
      approvedGrns.forEach(g => {
        if (Array.isArray(g.Items)) {
          let matched = null;
          if (i.ItemID && String(i.ItemID).trim() !== '') {
            matched = g.Items.find(gi => gi.ItemID && String(gi.ItemID).trim().toLowerCase() === String(i.ItemID).trim().toLowerCase());
          }
          if (!matched && i.ItemName && String(i.ItemName).trim() !== '') {
            matched = g.Items.find(gi => gi.ItemName && String(gi.ItemName).trim().toLowerCase() === String(i.ItemName).trim().toLowerCase());
          }
          if (!matched && g.Items[idx]) {
            matched = g.Items[idx];
          }
          if (matched) {
            alreadyReceived += Number(matched.ReceivedQty) || Number(matched.Qty) || 0;
          }
        }
      });
      const pending = Math.max(0, ordered - alreadyReceived);

      const norm = (s: any) => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      const matchedInv = (inventoryItems || []).find((inv: any) =>
        (i.ItemID && inv.ItemID && String(inv.ItemID).trim().toLowerCase() === String(i.ItemID).trim().toLowerCase()) ||
        (i.ItemName && inv.ItemName && norm(inv.ItemName) === norm(i.ItemName))
      );

      const displayItemId = matchedInv?.ItemID || i.ItemID;

      return {
        ItemID: displayItemId,
        ItemName: i.ItemName,
        OrderedQty: ordered,
        AlreadyReceivedQty: alreadyReceived,
        PendingQty: pending,
        ReceivedQty: pending, // Default proposal is remaining pending items
        UnitPrice: i.UnitPrice,
        LineTotal: pending * i.UnitPrice,
        BatchNo: i.BatchNo || `B-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`
      };
    });
    return items.filter(i => i.PendingQty > 0);
  };

  const handleOpenGrnForPo = (po?: ErpPurchaseOrder) => {
    if (po) {
      setGrnForm({
        POID: po.POID,
        GRNID: `GRN-${Math.floor(1000 + Math.random() * 9000)}`,
        VendorID: po.VendorID,
        VendorName: po.VendorName,
        ReceivedDate: new Date().toISOString().split('T')[0],
        ChallanNo: `DC-${Math.floor(10000 + Math.random() * 90000)}`,
        SupplierInvoiceNo: `INV-${Math.floor(10000 + Math.random() * 90000)}`,
        Remarks: `Stock inward receiving against PO ${po.POID}`,
        Items: getPoItemsReceiptInfo(po)
      });
    } else {
      const firstOpenPo = purchaseOrders.find(p => p.Status !== 'Received') || purchaseOrders[0];
      if (firstOpenPo) {
        handleOpenGrnForPo(firstOpenPo);
        return;
      } else {
        setGrnForm({
          POID: '',
          GRNID: `GRN-${Math.floor(1000 + Math.random() * 9000)}`,
          VendorID: '',
          VendorName: '',
          ReceivedDate: new Date().toISOString().split('T')[0],
          ChallanNo: '',
          SupplierInvoiceNo: '',
          Remarks: '',
          Items: []
        });
      }
    }
    setShowGrnModal(true);
  };

  const handleSelectPoForGrn = (poid: string) => {
    const foundPo = purchaseOrders.find(p => p.POID === poid);
    if (foundPo) {
      setGrnForm(prev => ({
        ...prev,
        POID: foundPo.POID,
        VendorID: foundPo.VendorID,
        VendorName: foundPo.VendorName,
        Items: getPoItemsReceiptInfo(foundPo)
      }));
    }
  };

  const handleRemoveGrnItem = (index: number) => {
    setGrnForm(prev => ({
      ...prev,
      Items: prev.Items.filter((_, idx) => idx !== index)
    }));
  };

  const handleResetGrnItems = () => {
    const foundPo = purchaseOrders.find(p => p.POID === grnForm.POID);
    if (foundPo) {
      setGrnForm(prev => ({
        ...prev,
        Items: getPoItemsReceiptInfo(foundPo)
      }));
    }
  };

  const handleApproveGrn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (!grnForm.POID) return alert('Please select a valid Purchase Order ID.');
    if (grnForm.Items.length === 0) return alert('No items remaining in GRN to receive.');

    // Only include items with ReceivedQty > 0
    const receivingItems = grnForm.Items.filter(i => (Number(i.ReceivedQty) || 0) > 0);
    if (receivingItems.length === 0) {
      return alert('Please enter receiving quantity greater than 0 for at least one medicine item in this batch.');
    }

    setIsSubmitting(true);
    const totalAmount = receivingItems.reduce((sum, i) => sum + (Number(i.ReceivedQty) * Number(i.UnitPrice)), 0);

    const payload = {
      ...grnForm,
      Items: receivingItems,
      TotalAmount: totalAmount,
      CreatedBy: currentUser?.FullName || 'Store Manager'
    };

    setLoading(true);
    try {
      const res = await fetch('/api/erp/grn/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        // Compute updated PO status locally
        const targetPo = purchaseOrders.find(p => p.POID === grnForm.POID);
        let calculatedPoStatus: 'Received' | 'Partially Received' | 'Approved' = 'Received';

        if (targetPo) {
          calculatedPoStatus = calculatePoStatus(targetPo, grns, receivingItems) as any;
        }

        setPurchaseOrders(prev => prev.map(p => p.POID === grnForm.POID ? { ...p, Status: calculatedPoStatus } : p));
        
        const newGrnRecord: ErpGrn = {
          GRNID: payload.GRNID,
          POID: payload.POID,
          VendorID: payload.VendorID,
          VendorName: payload.VendorName,
          ReceivedDate: payload.ReceivedDate,
          ChallanNo: payload.ChallanNo,
          SupplierInvoiceNo: payload.SupplierInvoiceNo,
          TotalAmount: totalAmount,
          Status: 'Approved',
          Remarks: payload.Remarks,
          CreatedBy: payload.CreatedBy,
          Items: payload.Items.map(i => ({
            ItemID: i.ItemID,
            ItemName: i.ItemName,
            OrderedQty: i.OrderedQty,
            AlreadyReceivedQty: i.AlreadyReceivedQty,
            PendingQty: i.PendingQty,
            ReceivedQty: i.ReceivedQty,
            UnitPrice: i.UnitPrice,
            LineTotal: i.ReceivedQty * i.UnitPrice
          }))
        };

        setGrns(prev => [newGrnRecord, ...prev]);

        // Re-fetch inventory items & vendors to show updated stock & balance immediately
        const [itemsRes, vendorsRes] = await Promise.all([
          safeFetchJson('/api/items'),
          safeFetchJson('/api/query/erp_vendors')
        ]);
        if (Array.isArray(itemsRes) && itemsRes.length > 0) {
          setInventoryItems(itemsRes);
        } else {
          const norm = (s: any) => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
          setInventoryItems(prev => prev.map(inv => {
            const matched = receivingItems.find(i => 
              (i.ItemID && inv.ItemID && String(i.ItemID).trim().toLowerCase() === String(inv.ItemID).trim().toLowerCase()) ||
              (i.ItemName && inv.ItemName && norm(i.ItemName) === norm(inv.ItemName))
            );
            if (matched) {
              const qtyRec = Number(matched.ReceivedQty) || Number(matched.Qty) || 0;
              const uPrice = Number(matched.UnitPrice) || Number(matched.UnitCost) || Number(matched.PurchasePrice) || 0;
              return {
                ...inv,
                CStock: (Number(inv.CStock) || 0) + qtyRec,
                PurchasePrice: uPrice > 0 ? uPrice : inv.PurchasePrice
              };
            }
            return inv;
          }));
        }
        if (Array.isArray(vendorsRes) && vendorsRes.length > 0) {
          setVendors(vendorsRes);
        } else if (payload.VendorID || payload.VendorName) {
          setVendors(prev => prev.map(v => (v.VendorID === payload.VendorID || v.VendorName === payload.VendorName) ? { ...v, Balance: (v.Balance || 0) + totalAmount } : v));
        }

        setShowGrnModal(false);
        setSyncMessage(`GRN ${payload.GRNID} approved! Stock updated for PO ${payload.POID} (${calculatedPoStatus === 'Received' ? 'Fully Received' : 'Partially Received'}).`);
        setTimeout(() => setSyncMessage(null), 3000);
        window.dispatchEvent(new CustomEvent('phc_db_updated'));
      } else {
        alert(data.error || 'Failed to approve GRN.');
      }
    } catch (err) {
      console.error('GRN approval error:', err);
      alert('Network error while processing GRN approval.');
    } finally {
      setLoading(false);
      setIsSubmitting(false);
    }
  };

  const handleDeleteGrn = async (grn: ErpGrn) => {
    if (!confirm(`Are you sure you want to delete Goods Received Note ${grn.GRNID}? This will remove the GRN record, deduct the vendor outstanding balance, revert stock levels, remove linked financial entries, and revert Purchase Order status.`)) return;

    try {
      // 1. Call backend server endpoint for complete database rollback
      await fetch('/api/erp/grn/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: grn._id, grnId: grn.GRNID })
      });

      // 2. Revert Inventory Stock (CStock) locally for instant UI update
      if (Array.isArray(grn.Items) && grn.Items.length > 0) {
        setInventoryItems(prev => prev.map((inv: any) => {
          const matchedGrnItem = grn.Items.find(gi =>
            (gi.ItemID && inv.ItemID && String(inv.ItemID).toLowerCase() === String(gi.ItemID).toLowerCase()) ||
            (gi.ItemName && inv.ItemName && String(inv.ItemName).trim().toLowerCase() === String(gi.ItemName).trim().toLowerCase())
          );

          if (matchedGrnItem) {
            const qtyRec = Number(matchedGrnItem.ReceivedQty) || Number((matchedGrnItem as any).Qty) || 0;
            const currentStock = Number(inv.CStock) || Number(inv.Stock) || 0;
            const newStock = Math.max(0, currentStock - qtyRec);
            return { ...inv, CStock: newStock, Stock: newStock };
          }
          return inv;
        }));
      }

      // 3. Deduct Vendor Outstanding Balance locally
      const grnTotal = Number(grn.TotalAmount) || 0;
      if (grnTotal > 0 && (grn.VendorID || grn.VendorName)) {
        setVendors(prev => prev.map(v => {
          const isMatch = (grn.VendorID && (v.VendorID === grn.VendorID || v._id === grn.VendorID)) ||
                          (grn.VendorName && v.VendorName && v.VendorName.trim().toLowerCase() === grn.VendorName.trim().toLowerCase());
          if (isMatch) {
            const newBalance = Math.max(0, Number(v.Balance || 0) - grnTotal);
            return { ...v, Balance: newBalance };
          }
          return v;
        }));
      }

      // 4. Remove linked transactions locally
      setTransactions(prev => prev.filter(t =>
        t.ReferenceNo !== grn.GRNID &&
        t.ReferenceNo !== grn.POID &&
        (!t.Description || !t.Description.includes(grn.GRNID))
      ));

      // 5. Update PO status if linked to a PO
      if (grn.POID) {
        const remainingGrns = grns.filter(g => (g._id ? g._id !== grn._id : g.GRNID !== grn.GRNID) && g.POID === grn.POID);
        const linkedPo = purchaseOrders.find(p => p.POID === grn.POID);
        const newPoStatus = linkedPo ? calculatePoStatus(linkedPo, remainingGrns) : 'Approved';

        setPurchaseOrders(prev => prev.map(p => p.POID === grn.POID ? { ...p, Status: newPoStatus as any } : p));
      }

      // 6. Remove from GRNs state & notify
      setGrns(prev => prev.filter(g => (g._id ? g._id !== grn._id : g.GRNID !== grn.GRNID)));

      setSyncMessage(`GRN ${grn.GRNID} deleted! Inventory stock level reverted and vendor balance updated.`);
      setTimeout(() => setSyncMessage(null), 3000);
      window.dispatchEvent(new CustomEvent('phc_db_updated'));
    } catch (err: any) {
      console.error('Error deleting GRN:', err);
      alert(`Error deleting GRN: ${err.message || 'Unknown error'}`);
    }
  };

  const handlePrintGrn = (grn: ErpGrn) => {
    const printWin = window.open('', '_blank', 'width=900,height=900');
    if (!printWin) return alert('Popup blocked. Allow popups to print Goods Received Note.');

    const cName = clinicSettings?.ClinicName || 'PUNJAB HOMEOPATHIC CLINIC & PHARMACY';
    const cTag = clinicSettings?.ClinicLogoText || 'HEALING NATURALLY. RESTORING BALANCE.';
    const logoSrc = clinicSettings?.ClinicLogoImage || '/nhc_logo.svg';

    let totalOrderedQty = 0;
    let totalReceivedQty = 0;
    let totalGrnAmount = 0;

    const itemsRows = grn.Items.map((item, idx) => {
      const ordQty = Number(item.OrderedQty) || 0;
      const recQty = Number(item.ReceivedQty) || 0;
      const uPrice = Number(item.UnitPrice) || 0;
      const lineSubtotal = item.LineTotal || (recQty * uPrice);

      totalOrderedQty += ordQty;
      totalReceivedQty += recQty;
      totalGrnAmount += lineSubtotal;

      return `
      <tr style="border-bottom: 1px solid #e2e8f0; font-size: 11px;">
        <td style="text-align: center; padding: 7px 6px; font-weight: bold; font-family: monospace; color: #64748b;">${idx + 1}</td>
        <td style="padding: 7px 6px; font-family: monospace; font-weight: bold; color: #475569;">${item.ItemID}</td>
        <td style="padding: 7px 6px; font-weight: bold; color: #0f172a;">${item.ItemName}</td>
        <td style="text-align: center; padding: 7px 6px; font-family: monospace; font-weight: bold; color: #b45309; background: #fffbeb;">${item.BatchNo || 'N/A'}</td>
        <td style="text-align: center; padding: 7px 6px; font-weight: bold; color: #475569;">${ordQty}</td>
        <td style="text-align: center; padding: 7px 6px; font-weight: 800; color: #15803d; background: #f0fdf4;">${recQty}</td>
        <td style="text-align: right; padding: 7px 6px; font-weight: 700; color: #334155; font-family: monospace;">Rs. ${uPrice.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
        <td style="text-align: right; padding: 7px 6px; font-weight: 800; color: #0f172a; font-family: monospace; background: #f8fafc;">Rs. ${lineSubtotal.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
      </tr>
    `;
    }).join('');

    const calculatedGrandTotal = grn.TotalAmount || totalGrnAmount;

    printWin.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Goods Received Note ${grn.GRNID} - Punjab Homeopathic Clinic</title>
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
            * { box-sizing: border-box; }

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
              <h1 class="clinic-name">${cName}</h1>
              <div class="clinic-tagline">${cTag}</div>
              <div class="clinic-address" style="font-size: 11px; font-weight: 700; color: #1e293b; margin-top: 2px;">10 Shalimar Road, Garhi Shahu, Lahore</div>
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
            <span class="report-banner-title">GOODS RECEIVED NOTE (GRN) - OFFICIAL INWARD AUDIT</span>
            <span class="report-banner-ref">REF: PHC-GRN-${grn.GRNID}</span>
          </div>

          <div class="meta-grid">
            <div class="meta-item">
              <span class="meta-label">GRN Ref Number</span>
              <span class="meta-value" style="color: #047857;">${grn.GRNID}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Purchase Order Ref</span>
              <span class="meta-value" style="color: #4338ca;">${grn.POID}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Goods Received Date</span>
              <span class="meta-value">${grn.ReceivedDate}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Supplier / Vendor</span>
              <span class="meta-value" style="color: #0f172a;">${grn.VendorName} (${grn.VendorID || 'N/A'})</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Supplier Bill / Invoice #</span>
              <span class="meta-value" style="color: #0369a1;">${grn.SupplierInvoiceNo || 'N/A'}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Delivery Challan No</span>
              <span class="meta-value">${grn.ChallanNo || 'N/A'}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Store Receiver</span>
              <span class="meta-value">${grn.CreatedBy || 'Warehouse Officer'}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Audit Prepared By</span>
              <span class="meta-value">${currentUser?.FullName || 'Staff Accountant'}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Responsible Manager</span>
              <span class="meta-value" style="color: #881337;">Mr. Zaigham Ali Anjum</span>
            </div>
          </div>

          <!-- Items Table -->
          <table class="report-table">
            <thead>
              <tr>
                <th style="width: 30px; text-align: center;">#</th>
                <th style="width: 85px;">Item Code</th>
                <th>Medicine Description & Category</th>
                <th style="width: 100px; text-align: center;">Batch No.</th>
                <th style="width: 75px; text-align: center;">Ordered</th>
                <th style="width: 80px; text-align: center;">Received</th>
                <th style="width: 95px; text-align: right;">Unit Price</th>
                <th style="width: 110px; text-align: right;">Sub Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsRows}
            </tbody>
            <tfoot>
              <tr style="background: #f1f5f9; font-weight: 800; font-size: 11px; border-top: 2px solid #0f172a;">
                <td colspan="4" style="padding: 8px 10px; text-align: right; text-transform: uppercase; color: #475569; font-weight: 800;">
                  Total Batch Quantity / Inward Summary:
                </td>
                <td style="padding: 8px 6px; text-align: center; font-weight: 800; color: #475569; font-family: monospace;">
                  ${totalOrderedQty}
                </td>
                <td style="padding: 8px 6px; text-align: center; font-weight: 900; color: #15803d; background: #dcfce7; font-family: monospace;">
                  ${totalReceivedQty}
                </td>
                <td style="padding: 8px 10px; text-align: right; font-weight: 800; color: #334155; text-transform: uppercase;">
                  SUB TOTAL:
                </td>
                <td style="padding: 8px 10px; text-align: right; font-weight: 900; color: #0f172a; font-family: monospace; font-size: 11.5px; background: #e2e8f0;">
                  Rs. ${calculatedGrandTotal.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
              </tr>
            </tfoot>
          </table>

          <!-- Grand Total Summary Card -->
          <div style="margin-top: 12px; display: flex; justify-content: flex-end;">
            <div style="background: #0f172a; color: #ffffff; border-radius: 8px; padding: 10px 16px; min-width: 290px; text-align: right; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <div style="font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.8px; color: #94a3b8;">
                GRAND TOTAL (OFFICIAL INWARD BILL AMOUNT)
              </div>
              <div style="font-size: 18px; font-weight: 900; font-family: monospace; color: #34d399; margin-top: 2px;">
                Rs. ${calculatedGrandTotal.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div style="font-size: 9px; font-weight: 700; color: #cbd5e1; margin-top: 2px;">
                Total Items: ${grn.Items.length} &nbsp;|&nbsp; Received Qty: ${totalReceivedQty} Units
              </div>
            </div>
          </div>

          <div style="margin-top: 12px; padding: 10px 12px; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 11px;">
            <strong>Remarks / Physical Inspection Note:</strong> ${grn.Remarks || 'All received medicines verified for physical condition, batch integrity & quantity.'}
          </div>

          <!-- Executive Signatures & Stamps Block -->
          <div class="signature-section">
            <div class="sig-box">
              <div class="sig-line-text">
                ${grn.CreatedBy || currentUser?.FullName || 'Accountant / Audit Officer'}
              </div>
              <div class="sig-title-primary" style="color: #0f172a;">PREPARED BY</div>
              <div class="sig-title-sub" style="font-size: 9px; color: #475569;">Warehouse & GRN Receiving Desk</div>
            </div>

            <div class="stamp-box">
              <span>PHC OFFICIAL STAMP</span>
              <span style="font-size: 7px; color: #94a3b8; margin-top: 2px;">[ SEAL & STAMP ]</span>
            </div>

            <div class="sig-box" style="width: 250px;">
              <div class="sig-line-manager">
                Zaigham Ali Anjum
              </div>
              <div class="sig-title-primary">MR. ZAIGHAM ALI ANJUM</div>
              <div class="sig-title-sub">Manager Operations & Administrative Head</div>
              <div class="sig-title-dept">Punjab Homeopathic Clinic & Pharmacy</div>
            </div>
          </div>

          <!-- Official Footer -->
          <div class="official-footer">
            <span>Punjab Homeopathic Clinic & Pharmacy • Goods Received Note (GRN) Stock Audit • Confidential Document</span>
            <span>Generated Date: ${new Date().toLocaleString('en-GB')}</span>
          </div>

          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `);
    printWin.document.close();
  };

  // HANDLER FOR PRINTING VENDOR ACCOUNT STATEMENT & PAYABLE LEDGER
  const handlePrintVendorStatement = (targetVendor?: ErpVendor) => {
    const vVendor = targetVendor || selectedVendor;
    if (!vVendor) return;

    const cName = clinicSettings?.ClinicName || 'PUNJAB HOMEOPATHIC CLINIC & PHARMACY';
    const cTag = clinicSettings?.ClinicLogoText || 'HEALING NATURALLY • RESTORING BALANCE';
    const cDoc = clinicSettings?.DoctorName || '';
    const cDocSub = clinicSettings?.DoctorSignatureText || '';
    const cAddr = clinicSettings?.ClinicAddress || '10 Shalimar Road, Garhi Shahu, Lahore';
    const cPhone = clinicSettings?.PhoneMobile || '+92 300 1234567';
    const logoSrc = clinicSettings?.ClinicLogoImage || '/nhc_logo.svg';

    // Calculate vendor statement dynamically for vVendor
    const vName = (vVendor.VendorName || '').trim().toLowerCase();
    const vId = (vVendor.VendorID || vVendor._id || '').trim().toLowerCase();

    // Filter GRNs for this vendor
    const vendorGrns = (grns || []).filter(g => {
      const sName = (g.SupplierName || '').trim().toLowerCase();
      const sId = (g.SupplierID || '').trim().toLowerCase();
      return (vName && sName === vName) || (vId && sId === vId) || (sName && vName.includes(sName));
    });

    // Filter Payments / Transactions for this vendor
    const vendorTxns = (transactions || []).filter(t => {
      const tVName = (t.VendorName || '').trim().toLowerCase();
      const tVId = (t.VendorID || '').trim().toLowerCase();
      const isVendorPay = t.Type === 'VendorPayment' || t.Category === 'Vendor Payment' || (t.Type === 'Expense' && tVName);
      return isVendorPay && ((vName && tVName === vName) || (vId && tVId === vId) || (tVName && vName.includes(tVName)));
    });

    type LedgerRow = {
      id: string;
      date: string;
      type: string;
      refNo: string;
      poNo: string;
      description: string;
      debit: number;   // Payment (settlement)
      credit: number;  // GRN Bill (invoice)
      runningBalance?: number;
    };

    const rows: LedgerRow[] = [];

    vendorGrns.forEach(g => {
      rows.push({
        id: g.GrnID || g._id || `GRN-${Math.random()}`,
        date: g.ReceivedDate || new Date().toISOString().split('T')[0],
        type: 'Goods Received (GRN)',
        refNo: g.GrnID || 'GRN-N/A',
        poNo: g.POID || (g as any).PoID || 'N/A',
        description: `GRN Received - Invoice #${g.VendorInvoiceNo || g.SupplierInvoiceNo || 'N/A'} (${g.ItemsReceived?.length || g.Items?.length || 0} items)`,
        debit: 0,
        credit: Number(g.TotalAmount || 0)
      });
    });

    vendorTxns.forEach(t => {
      rows.push({
        id: t.TransactionID || t._id || `TXN-${Math.random()}`,
        date: t.Date || new Date().toISOString().split('T')[0],
        type: 'Vendor Bill Payment',
        refNo: t.TransactionID || 'PAY-N/A',
        poNo: t.ReferenceNo && t.ReferenceNo.toUpperCase().startsWith('PO') ? t.ReferenceNo : 'N/A',
        description: `Payment Settled via ${t.PaymentMethod || 'Cash'} - ${t.Description || 'Vendor Settlement'}`,
        debit: Number(t.Amount || 0),
        credit: 0
      });
    });

    rows.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    let rBal = 0;
    let computedTotalInvoiced = 0;
    let computedTotalPaid = 0;

    const statementRows = rows.map(r => {
      computedTotalInvoiced += r.credit;
      computedTotalPaid += r.debit;
      rBal += (r.credit - r.debit);
      return { ...r, runningBalance: rBal };
    });

    const closingBalance = vVendor.Balance !== undefined ? vVendor.Balance : rBal;

    const printWin = window.open('', '_blank', 'width=950,height=1100');
    if (printWin) {
      const rowsHtml = statementRows.length === 0
        ? `<tr><td colspan="8" style="padding: 20px; text-align: center; color: #94a3b8; font-weight: bold;">No transactions or GRNs recorded for this vendor in selected period.</td></tr>`
        : statementRows.map(row => `
          <tr>
            <td style="padding: 8px; font-family: monospace; color: #334155; white-space: nowrap;">${row.date}</td>
            <td style="padding: 8px; white-space: nowrap;">
              <span style="padding: 2px 6px; border-radius: 4px; font-size: 9px; font-weight: bold; background: ${row.credit > 0 ? '#fef3c7; color: #78350f;' : '#d1fae5; color: #065f46;'}">
                ${row.type}
              </span>
            </td>
            <td style="padding: 8px; font-family: monospace; font-weight: bold; color: #0f172a; white-space: nowrap;">${row.refNo}</td>
            <td style="padding: 8px; font-family: monospace; font-weight: bold; color: #4338ca; white-space: nowrap;">${row.poNo !== 'N/A' ? row.poNo : '-'}</td>
            <td style="padding: 8px; color: #334155;">${row.description}</td>
            <td style="padding: 8px; text-align: right; font-family: monospace; font-weight: bold; color: #047857; white-space: nowrap;">${row.debit > 0 ? `Rs. ${row.debit.toLocaleString()}` : '-'}</td>
            <td style="padding: 8px; text-align: right; font-family: monospace; font-weight: bold; color: #b45309; white-space: nowrap;">${row.credit > 0 ? `Rs. ${row.credit.toLocaleString()}` : '-'}</td>
            <td style="padding: 8px; text-align: right; font-family: monospace; font-weight: 900; color: #020617; white-space: nowrap;">Rs. ${(row.runningBalance || 0).toLocaleString()}</td>
          </tr>
        `).join('');

      printWin.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Vendor Account Statement - ${vVendor.VendorName}</title>
            <style>
              @page { size: A4 portrait; margin: 10mm; }
              * { box-sizing: border-box; }
              body { font-family: system-ui, -apple-system, sans-serif; color: #0f172a; background: #fff; margin: 0; padding: 20px; font-size: 11px; line-height: 1.4; }
              .header { border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 16px; display: flex; align-items: center; justify-content: space-between; gap: 16px; }
              .logo { width: 64px; height: 64px; object-fit: contain; }
              .branding { text-align: center; flex: 1; }
              .title { font-size: 20px; font-weight: 900; color: #4c0519; text-transform: uppercase; font-family: serif; margin: 0; letter-spacing: -0.5px; }
              .tagline { font-size: 9px; font-weight: 800; color: #9f1239; letter-spacing: 1px; text-transform: uppercase; margin-top: 2px; }
              .doc-info { font-size: 11px; font-weight: 800; color: #1e293b; margin-top: 2px; }
              .addr { font-size: 10px; color: #475569; font-weight: 600; margin-top: 2px; }
              .badge-box { text-align: right; }
              .badge { display: inline-block; padding: 4px 10px; background: #fef3c7; color: #78350f; border: 1px solid #fde68a; font-weight: 900; font-size: 10px; text-transform: uppercase; border-radius: 4px; }
              .meta { font-size: 10px; color: #64748b; font-family: monospace; margin-top: 4px; }
              
              .cards-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; background: #f8fafc; padding: 14px; border-radius: 8px; border: 1px solid #cbd5e1; margin-bottom: 16px; }
              .card-title { font-size: 10px; font-weight: 900; text-transform: uppercase; color: #b45309; margin-bottom: 6px; letter-spacing: 0.5px; }
              .vendor-name { font-size: 14px; font-weight: 900; color: #020617; margin-bottom: 4px; }
              .info-row { display: grid; grid-template-columns: 1fr 1fr; gap: 4px; color: #334155; font-size: 10px; }
              
              .summary-box { font-size: 11px; text-align: right; }
              .summary-row { display: flex; justify-content: space-between; margin-bottom: 4px; color: #475569; }
              .net-box { margin-top: 8px; padding-top: 8px; border-top: 1px solid #cbd5e1; display: flex; justify-content: space-between; align-items: center; background: #fef3c7; padding: 8px; border-radius: 6px; border: 1px solid #fde68a; }
              .net-title { font-size: 11px; font-weight: 900; text-transform: uppercase; color: #0f172a; }
              .net-amount { font-size: 15px; font-family: monospace; font-weight: 900; color: #92400e; }

              table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 11px; }
              th { background: #0f172a; color: #ffffff; text-transform: uppercase; font-size: 9px; font-weight: 900; letter-spacing: 0.5px; padding: 8px; text-align: left; }
              td { padding: 8px; border-bottom: 1px solid #e2e8f0; }
              tr:nth-child(even) { background: #f8fafc; }
              tfoot td { background: #f1f5f9; font-weight: 900; border-top: 2px solid #0f172a; border-bottom: 2px solid #0f172a; }

              .signatures { margin-top: 30px; padding-top: 16px; border-top: 1px solid #cbd5e1; display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; text-align: center; }
              .sig-line { border-bottom: 1px solid #94a3b8; height: 32px; margin-bottom: 4px; display: flex; align-items: flex-end; justify-content: center; font-family: monospace; font-size: 9px; color: #475569; }
              .sig-role { font-size: 9px; font-weight: 900; text-transform: uppercase; color: #1e293b; letter-spacing: 0.5px; }
              .sig-sub { font-size: 8px; color: #64748b; margin-top: 1px; }
              .sig-mgr { font-family: serif; font-weight: 900; font-size: 12px; color: #0f172a; border-bottom: 2px solid #0f172a; height: 32px; display: flex; align-items: flex-end; justify-content: center; }

              .footer-disc { border-top: 1px solid #e2e8f0; padding-top: 10px; margin-top: 20px; display: flex; justify-content: space-between; font-family: monospace; font-size: 8px; color: #94a3b8; }
            </style>
          </head>
          <body>
            <div class="header">
              <img src="${logoSrc}" class="logo" alt="Logo" />
              <div class="branding">
                <h1 class="title">${cName}</h1>
                <div class="tagline">${cTag}</div>
                <div class="addr">📍 ${cAddr} &nbsp;|&nbsp; 📞 ${cPhone}</div>
              </div>
              <div class="badge-box">
                <div class="badge">SUPPLIER ACCOUNT STATEMENT</div>
                <div class="meta">Date: <strong>${new Date().toLocaleDateString('en-GB')}</strong></div>
                <div class="meta">Period: <strong>${vendorDateFilter === 'all' ? 'All Time (Full Ledger)' : vendorDateFilter}</strong></div>
                <div class="meta">Ref: STMT-${vVendor.VendorID || 'VND'}-${new Date().toISOString().slice(0,10).replace(/-/g,'')}</div>
              </div>
            </div>

            <div class="cards-grid">
              <div>
                <div class="card-title">🏢 Supplier / Distributor Details</div>
                <div class="vendor-name">${vVendor.VendorName}</div>
                <div class="info-row">
                  <div>Vendor ID: <strong>${vVendor.VendorID || 'N/A'}</strong></div>
                  <div>NTN / Tax ID: <strong>${vVendor.TaxID || 'N/A'}</strong></div>
                  <div>Contact: <strong>${vVendor.ContactPerson || 'N/A'}</strong></div>
                  <div>Phone: <strong>${vVendor.Phone || 'N/A'}</strong></div>
                </div>
                <div style="font-size: 10px; color: #475569; margin-top: 4px;">Address: ${vVendor.Address || 'N/A'}</div>
              </div>

              <div class="summary-box">
                <div class="card-title" style="text-align: right;">📊 Accounts Payable Summary</div>
                <div class="summary-row">
                  <span>Total Purchases / GRN Bills (Credit):</span>
                  <strong style="font-family: monospace; color: #b45309;">Rs. ${computedTotalInvoiced.toLocaleString()}</strong>
                </div>
                <div class="summary-row">
                  <span>Total Payments Settled (Debit):</span>
                  <strong style="font-family: monospace; color: #047857;">Rs. ${computedTotalPaid.toLocaleString()}</strong>
                </div>
                <div class="net-box">
                  <span class="net-title">Net Outstanding Balance:</span>
                  <span class="net-amount">Rs. ${closingBalance.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Ref / Voucher #</th>
                  <th>P.O. Number</th>
                  <th>Description / Particulars</th>
                  <th style="text-align: right;">Debit (Paid)</th>
                  <th style="text-align: right;">Credit (Bill)</th>
                  <th style="text-align: right;">Running Balance</th>
                </tr>
              </thead>
              <tbody>
                ${rowsHtml}
              </tbody>
              <tfoot>
                <tr>
                  <td colspan="5" style="text-align: right; font-weight: 900; text-transform: uppercase;">Total Ledger Summary:</td>
                  <td style="text-align: right; font-family: monospace; font-weight: 900; color: #047857;">Rs. ${computedTotalPaid.toLocaleString()}</td>
                  <td style="text-align: right; font-family: monospace; font-weight: 900; color: #b45309;">Rs. ${computedTotalInvoiced.toLocaleString()}</td>
                  <td style="text-align: right; font-family: monospace; font-weight: 900; color: #0f172a;">Rs. ${closingBalance.toLocaleString()}</td>
                </tr>
              </tfoot>
            </table>

            <div class="signatures">
              <div>
                <div class="sig-line">${currentUser?.FullName || 'Accountant'}</div>
                <div class="sig-role">PREPARED BY (ACCOUNTANT)</div>
                <div class="sig-sub">Accounts & Audit Desk</div>
              </div>
              <div>
                <div class="sig-line"></div>
                <div class="sig-role">CHECKED BY (AUDITOR)</div>
                <div class="sig-sub">Internal Audit Wing</div>
              </div>
              <div>
                <div class="sig-line"></div>
                <div class="sig-role">VENDOR STAMP & SIGN</div>
                <div class="sig-sub">Authorized Distributor Seal</div>
              </div>
              <div>
                <div class="sig-mgr">Zaigham Ali Anjum</div>
                <div class="sig-role" style="color: #881337;">MR. ZAIGHAM ALI ANJUM</div>
                <div class="sig-sub" style="font-weight: bold; color: #1e293b;">Manager Operations & Administrative Head</div>
                <div class="sig-sub" style="color: #047857; font-weight: bold;">Punjab Homeopathic Clinic & Pharmacy</div>
              </div>
            </div>

            <div class="footer-disc">
              <span>Punjab Homeopathic Clinic & Pharmacy • Accounts Payable Ledger System • Confidential Document</span>
              <span>Printed on: ${new Date().toLocaleString('en-GB')}</span>
            </div>

            <script>
              window.onload = function() { window.print(); }
            </script>
          </body>
        </html>
      `);
      printWin.document.close();
    } else {
      document.body.classList.add('printing-vendor-sheet');
      window.print();
      setTimeout(() => {
        document.body.classList.remove('printing-vendor-sheet');
      }, 1000);
    }
  };

  // HANDLER FOR PRINTING INDIVIDUAL VENDOR PAYMENT VOUCHER / RECEIPT
  const handlePrintSinglePaymentVoucher = (pt: any, vendor: ErpVendor) => {
    const cName = clinicSettings?.ClinicName || 'PUNJAB HOMEOPATHIC CLINIC & PHARMACY';
    const cTag = clinicSettings?.ClinicLogoText || 'HEALING NATURALLY • RESTORING BALANCE';
    const cDoc = clinicSettings?.DoctorName || '';
    const cDocSub = clinicSettings?.DoctorSignatureText || '';
    const cAddr = clinicSettings?.ClinicAddress || '10 Shalimar Road, Garhi Shahu, Lahore';
    const cPhone = clinicSettings?.PhoneMobile || '+92 300 1234567';
    const logoSrc = clinicSettings?.ClinicLogoImage || '/nhc_logo.svg';

    const voucherNo = pt.TransactionID || pt.ReferenceNo || `VCH-${Date.now().toString().slice(-6)}`;
    const paymentDate = pt.Date || pt.TransactionDate || new Date().toISOString().split('T')[0];
    const amount = Number(pt.Amount || 0);
    const method = pt.PaymentMethod || 'Bank / Cash';
    const desc = pt.Description || `Vendor Payment to ${vendor.VendorName}`;
    const category = pt.Category || 'Vendor Bill Payment';

    const printWin = window.open('', '_blank', 'width=850,height=950');
    if (printWin) {
      printWin.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Payment Voucher - ${voucherNo} (${vendor.VendorName})</title>
            <style>
              @page { size: A4 portrait; margin: 12mm; }
              * { box-sizing: border-box; }
              body { font-family: system-ui, -apple-system, sans-serif; color: #0f172a; background: #fff; margin: 0; padding: 24px; font-size: 11px; line-height: 1.4; }
              .header { border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 16px; display: flex; align-items: center; justify-content: space-between; gap: 16px; }
              .logo { width: 60px; height: 60px; object-fit: contain; }
              .branding { text-align: center; flex: 1; }
              .title { font-size: 18px; font-weight: 900; color: #4c0519; text-transform: uppercase; font-family: serif; margin: 0; }
              .tagline { font-size: 9px; font-weight: 800; color: #9f1239; letter-spacing: 0.5px; text-transform: uppercase; margin-top: 2px; }
              .doc-info { font-size: 10px; font-weight: 800; color: #1e293b; margin-top: 2px; }
              .addr { font-size: 9px; color: #475569; font-weight: 600; margin-top: 2px; }
              .badge-box { text-align: right; }
              .badge { display: inline-block; padding: 4px 10px; background: #d1fae5; color: #065f46; border: 1px solid #a7f3d0; font-weight: 900; font-size: 11px; text-transform: uppercase; border-radius: 4px; }
              .vch-no { font-size: 11px; font-weight: 900; font-family: monospace; color: #0f172a; margin-top: 4px; }
              .meta { font-size: 9px; color: #64748b; font-family: monospace; margin-top: 2px; }

              .grid-box { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; }
              .card { background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 12px; }
              .card-title { font-size: 9px; font-weight: 900; text-transform: uppercase; color: #0369a1; margin-bottom: 6px; letter-spacing: 0.5px; }
              .vendor-name { font-size: 13px; font-weight: 900; color: #0f172a; margin-bottom: 4px; }
              .info-line { font-size: 10px; color: #334155; margin-bottom: 3px; }

              .amount-card { background: #f0fdf4; border: 1.5px solid #86efac; border-radius: 8px; padding: 14px; text-align: center; margin-bottom: 20px; }
              .amount-label { font-size: 10px; font-weight: 900; color: #166534; text-transform: uppercase; letter-spacing: 0.5px; }
              .amount-val { font-size: 26px; font-weight: 900; font-family: monospace; color: #15803d; margin: 4px 0; }
              .amount-words { font-size: 10px; font-weight: 700; color: #166534; font-style: italic; }

              table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 11px; }
              th { background: #0f172a; color: #ffffff; text-transform: uppercase; font-size: 9px; font-weight: 900; padding: 8px; text-align: left; }
              td { padding: 9px 8px; border-bottom: 1px solid #e2e8f0; color: #334155; }

              .signatures { margin-top: 36px; padding-top: 16px; border-top: 1px solid #cbd5e1; display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; text-align: center; }
              .sig-line { border-bottom: 1px solid #94a3b8; height: 32px; margin-bottom: 4px; display: flex; align-items: flex-end; justify-content: center; font-family: monospace; font-size: 9px; color: #475569; }
              .sig-role { font-size: 8.5px; font-weight: 900; text-transform: uppercase; color: #1e293b; letter-spacing: 0.5px; }
              .sig-sub { font-size: 8px; color: #64748b; margin-top: 1px; }
              .sig-mgr { font-family: serif; font-weight: 900; font-size: 11px; color: #0f172a; border-bottom: 2px solid #0f172a; height: 32px; display: flex; align-items: flex-end; justify-content: center; }

              .footer { border-top: 1px solid #e2e8f0; padding-top: 8px; margin-top: 24px; display: flex; justify-content: space-between; font-family: monospace; font-size: 8px; color: #94a3b8; }
            </style>
          </head>
          <body>
            <div class="header">
              <img src="${logoSrc}" class="logo" alt="Logo" />
              <div class="branding">
                <h1 class="title">${cName}</h1>
                <div class="tagline">${cTag}</div>
                <div class="doc-info">${cDoc ? `${cDoc} ${cDocSub ? `(${cDocSub})` : ''}` : ''}</div>
                <div class="addr">📍 ${cAddr} &nbsp;|&nbsp; 📞 ${cPhone}</div>
              </div>
              <div class="badge-box">
                <div class="badge">PAYMENT VOUCHER / RECEIPT</div>
                <div class="vch-no">VCH #${voucherNo}</div>
                <div class="meta">Date: <strong>${paymentDate}</strong></div>
              </div>
            </div>

            <div class="grid-box">
              <div class="card">
                <div class="card-title">🏢 Payee / Vendor Details</div>
                <div class="vendor-name">${vendor.VendorName}</div>
                <div class="info-line">Vendor ID: <strong>${vendor.VendorID || 'N/A'}</strong></div>
                <div class="info-line">Contact Person: <strong>${vendor.ContactPerson || 'N/A'}</strong></div>
                <div class="info-line">Phone: <strong>${vendor.Phone || 'N/A'}</strong></div>
                <div class="info-line">Address: <strong>${vendor.Address || 'N/A'}</strong></div>
              </div>

              <div class="card">
                <div class="card-title">💳 Payment Voucher Particulars</div>
                <div class="info-line">Payment Method: <strong>${method}</strong></div>
                <div class="info-line">Category: <strong>${category}</strong></div>
                <div class="info-line">Ref / P.O. No: <strong>${pt.ReferenceNo || 'N/A'}</strong></div>
                <div class="info-line">Entered By: <strong>${currentUser?.FullName || 'Accountant'}</strong></div>
                <div class="info-line">Status: <strong style="color: #15803d;">PAID & SETTLED</strong></div>
              </div>
            </div>

            <div class="amount-card">
              <div class="amount-label">Paid Amount</div>
              <div class="amount-val">Rs. ${amount.toLocaleString()}</div>
              <div class="amount-words">Payment Voucher recorded in Accounts Payable Ledger</div>
            </div>

            <table>
              <thead>
                <tr>
                  <th style="width: 15%;">Date</th>
                  <th style="width: 20%;">Voucher ID</th>
                  <th style="width: 15%;">Method</th>
                  <th>Payment Narration / Description</th>
                  <th style="width: 20%; text-align: right;">Amount Paid</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style="font-family: monospace; font-weight: bold;">${paymentDate}</td>
                  <td style="font-family: monospace; font-weight: bold; color: #4338ca;">${voucherNo}</td>
                  <td><span style="background: #e2e8f0; padding: 2px 6px; border-radius: 4px; font-size: 9px; font-weight: bold; font-family: monospace;">${method}</span></td>
                  <td>${desc}</td>
                  <td style="text-align: right; font-family: monospace; font-weight: 900; font-size: 13px; color: #15803d;">Rs. ${amount.toLocaleString()}</td>
                </tr>
              </tbody>
            </table>

            <div class="signatures">
              <div>
                <div class="sig-line">${currentUser?.FullName || 'Accountant'}</div>
                <div class="sig-role">PREPARED BY</div>
                <div class="sig-sub">Accounts Officer</div>
              </div>
              <div>
                <div class="sig-line"></div>
                <div class="sig-role">CHECKED & VERIFIED</div>
                <div class="sig-sub">Internal Auditor</div>
              </div>
              <div>
                <div class="sig-line"></div>
                <div class="sig-role">RECEIVED BY (VENDOR)</div>
                <div class="sig-sub">Signature & Stamp</div>
              </div>
              <div>
                <div class="sig-mgr">Zaigham Ali Anjum</div>
                <div class="sig-role" style="color: #881337;">MR. ZAIGHAM ALI ANJUM</div>
                <div class="sig-sub" style="font-weight: bold; color: #1e293b;">Manager Operations & Administrative Head</div>
                <div class="sig-sub" style="color: #047857; font-weight: bold;">Punjab Homeopathic Clinic & Pharmacy</div>
              </div>
            </div>

            <div class="footer">
              <span>Punjab Homeopathic Clinic & Pharmacy • Official Vendor Payment Voucher • Computer Generated Document</span>
              <span>Printed on: ${new Date().toLocaleString('en-GB')}</span>
            </div>

            <script>
              window.onload = function() { window.print(); }
            </script>
          </body>
        </html>
      `);
      printWin.document.close();
    }
  };

  // HANDLERS FOR TRANSACTIONS & VENDOR BILL PAYMENTS
  const handlePayVendor = (vendor: ErpVendor) => {
    const vendorPOs = purchaseOrders.filter(po => 
      (po.VendorID && po.VendorID === vendor.VendorID) || 
      (po.VendorName && po.VendorName.toLowerCase() === vendor.VendorName.toLowerCase())
    );
    const vendorGrns = grns.filter(g => 
      (g.VendorID && g.VendorID === vendor.VendorID) || 
      (g.VendorName && g.VendorName.toLowerCase() === vendor.VendorName.toLowerCase())
    );

    let suggestedInv = '';
    let suggestedPoId = '';
    let suggestedAmount = vendor.Balance > 0 ? vendor.Balance : 0;

    if (vendorPOs.length > 0) {
      const topPo = vendorPOs[0];
      suggestedPoId = topPo.POID;
      const matchGrn = vendorGrns.find(g => g.POID === topPo.POID);
      suggestedInv = matchGrn?.SupplierInvoiceNo || topPo.POID;

      // Calculate initial PO bill and already paid for this top PO
      const poTotal = topPo.TotalAmount || 0;
      const alreadyPaidForPo = transactions
        .filter(t => 
          (t.VendorID === vendor.VendorID || (t.VendorName && t.VendorName.toLowerCase() === vendor.VendorName.toLowerCase())) &&
          t.Type === 'VendorPayment' &&
          (t.ReferenceNo === topPo.POID || t.ReferenceNo === suggestedInv || (t.Description && t.Description.includes(topPo.POID)))
        )
        .reduce((sum, t) => sum + Number(t.Amount || 0), 0);

      const poOutstanding = Math.max(0, poTotal - alreadyPaidForPo);
      if (poOutstanding > 0) {
        suggestedAmount = poOutstanding;
      }
    } else if (vendorGrns.length > 0) {
      const latest = vendorGrns.find(g => g.SupplierInvoiceNo) || vendorGrns[0];
      suggestedInv = latest.SupplierInvoiceNo || latest.ChallanNo || latest.GRNID || '';
    }

    setPayVendorModalData({
      vendor,
      invNo: suggestedInv,
      poId: suggestedPoId,
      amount: suggestedAmount,
      paymentMethod: 'Bank',
      date: new Date().toISOString().split('T')[0],
      category: 'Supplier Sales Invoice Payment',
      description: suggestedPoId 
        ? `Payment against PO #${suggestedPoId} (Invoice #${suggestedInv}) for ${vendor.VendorName}`
        : suggestedInv
        ? `Payment against Vendor Invoice #${suggestedInv} for ${vendor.VendorName}`
        : `Payment towards outstanding bill for Vendor ${vendor.VendorName}`
    });
  };

  const handleConfirmPayVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payVendorModalData) return;
    const { vendor, invNo, amount, paymentMethod, date, description, category } = payVendorModalData;

    if (!invNo || invNo.trim() === '') {
      return alert('Vendor Invoice Number is required to process vendor bill payment.');
    }
    if (!amount || amount <= 0) {
      return alert('Please enter a valid payment amount greater than zero.');
    }

    setIsSubmitting(true);
    try {
      const newTxn: ErpTransaction = {
        TransactionID: `TXN-${Math.floor(10000 + Math.random() * 90000)}`,
        Type: 'VendorPayment',
        Category: category || 'Supplier Sales Invoice Payment',
        Description: description || `Payment against Vendor Invoice #${invNo.trim()} for ${vendor.VendorName}`,
        Amount: Number(amount),
        PaymentMethod: paymentMethod || 'Bank',
        ReferenceNo: invNo.trim(),
        Date: date || new Date().toISOString().split('T')[0],
        CreatedBy: currentUser?.FullName || 'Admin',
        VendorID: vendor.VendorID || '',
        VendorName: vendor.VendorName || ''
      };

      await saveToDatabase('erp_transactions', newTxn);
      setTransactions(prev => [newTxn, ...prev]);

      // Settle Vendor's Outstanding Balance in DB
      const pAmt = Number(amount);
      const newBalance = Math.max(0, vendor.Balance - pAmt);
      await saveToDatabase('erp_vendors', { ...vendor, Balance: newBalance });
      setVendors(prev => prev.map(v => (v.VendorID === vendor.VendorID ? { ...v, Balance: newBalance } : v)));

      setPayVendorModalData(null);
      setSyncMessage('Vendor Bill Payment logged and balance updated successfully!');
      setTimeout(() => setSyncMessage(null), 3000);
    } catch (err: any) {
      alert('Error logging vendor payment: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddTxn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (!txnForm.Amount || !txnForm.Category) return alert('Category and Amount are required.');

    if (txnForm.Type === 'VendorPayment') {
      if (!txnForm.ReferenceNo || txnForm.ReferenceNo.trim() === '') {
        return alert('Vendor Invoice Number is required to process vendor bill payment.');
      }
    }

    setIsSubmitting(true);
    try {
      const newTxn: ErpTransaction = {
        TransactionID: `TXN-${Math.floor(10000 + Math.random() * 90000)}`,
        Type: txnForm.Type || 'Expense',
        Category: txnForm.Category,
        Description: txnForm.Description || '',
        Amount: Number(txnForm.Amount),
        PaymentMethod: txnForm.PaymentMethod || 'Cash',
        ReferenceNo: txnForm.ReferenceNo || 'N/A',
        Date: txnForm.Date || new Date().toISOString().split('T')[0],
        CreatedBy: currentUser?.FullName || 'Admin',
        VendorID: txnForm.VendorID || '',
        VendorName: txnForm.VendorName || ''
      };

      await saveToDatabase('erp_transactions', newTxn);
      setTransactions(prev => [newTxn, ...prev]);

      // If this is a Vendor Payment, settle the Vendor's Outstanding Balance in DB
      if (txnForm.Type === 'VendorPayment' && (txnForm.VendorID || txnForm.VendorName)) {
        const pAmt = Number(txnForm.Amount);
        const targetVendor = vendors.find(v => v.VendorID === txnForm.VendorID || v.VendorName === txnForm.VendorName);
        if (targetVendor) {
          const newBalance = Math.max(0, targetVendor.Balance - pAmt);
          const targetId = targetVendor._id || targetVendor.VendorID;
          await saveToDatabase('erp_vendors', { ...targetVendor, Balance: newBalance });
          setVendors(prev => prev.map(v => (v.VendorID === targetVendor.VendorID ? { ...v, Balance: newBalance } : v)));
        }
      }

      setShowTxnModal(false);
      setTxnForm({ Type: 'Expense', Category: 'Office Maintenance', Description: '', Amount: 0, PaymentMethod: 'Cash', VendorID: '', VendorName: '' });
      setSyncMessage('Transaction saved successfully!');
      setTimeout(() => setSyncMessage(null), 3000);
    } catch (err: any) {
      alert('Error saving transaction: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTxn = async (txn: ErpTransaction) => {
    if (!confirm(`Delete transaction ${txn.TransactionID}?`)) return;
    const targetId = txn._id || txn.TransactionID;
    await deleteFromDatabase('erp_transactions', targetId);

    // Delete matching expense if exists
    if (txn.ReferenceNo && txn.ReferenceNo !== 'N/A') {
      const matchExp = expenses.find(e => e.ExpenseID === txn.ReferenceNo || e._id === txn.ReferenceNo);
      if (matchExp) {
        await deleteFromDatabase('erp_expenses', matchExp._id || matchExp.ExpenseID);
        setExpenses(prev => prev.filter(e => e.ExpenseID !== matchExp.ExpenseID && e._id !== matchExp._id));
      }
      const matchPay = payrolls.find(p => p.PayrollID === txn.ReferenceNo || p._id === txn.ReferenceNo);
      if (matchPay) {
        await deleteFromDatabase('erp_payroll', matchPay._id || matchPay.PayrollID);
        setPayrolls(prev => prev.filter(p => p.PayrollID !== matchPay.PayrollID && p._id !== matchPay._id));
      }
    }

    setTransactions(prev => prev.filter(t => (t._id ? t._id !== txn._id : t.TransactionID !== txn.TransactionID)));
    setSyncMessage('Transaction deleted successfully!');
    setTimeout(() => setSyncMessage(null), 3000);
  };

  // HANDLERS FOR EMPLOYEES & PAYROLL
  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (!empForm.FullName || !empForm.Salary) return alert('Employee Name and Salary are required.');

    // Prevent double entry: check duplicate employee name
    const trimmedEmpName = empForm.FullName.trim().toLowerCase();
    if (employees.some(emp => emp.FullName.trim().toLowerCase() === trimmedEmpName)) {
      return alert('An employee with this name already exists! Duplicate entry prevented.');
    }

    setIsSubmitting(true);
    try {
      const newEmp: ErpEmployee = {
        EmployeeID: `EMP-${Math.floor(100 + Math.random() * 900)}`,
        FullName: empForm.FullName.trim(),
        Role: empForm.Role || 'Staff Member',
        Department: empForm.Department || 'General',
        Phone: empForm.Phone || 'N/A',
        Email: empForm.Email || '',
        JoiningDate: empForm.JoiningDate || new Date().toISOString().split('T')[0],
        Salary: Number(empForm.Salary),
        Status: empForm.Status || 'Active',
        CNIC: empForm.CNIC || '35202-0000000-0',
        BankAccount: empForm.BankAccount || ''
      };

      await saveToDatabase('erp_employees', newEmp);
      setEmployees(prev => [newEmp, ...prev]);
      setShowEmpModal(false);
      setEmpForm({ FullName: '', Role: 'Pharmacist Assistant', Salary: 45000, Phone: '', CNIC: '' });
      setSyncMessage('Employee saved successfully!');
      setTimeout(() => setSyncMessage(null), 3000);
    } catch (err: any) {
      alert('Error saving employee: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteEmp = async (emp: ErpEmployee) => {
    if (!confirm(`Remove employee ${emp.FullName}?`)) return;
    const targetId = emp._id || emp.EmployeeID;
    await deleteFromDatabase('erp_employees', targetId);
    setEmployees(prev => prev.filter(e => (e._id ? e._id !== emp._id : e.EmployeeID !== emp.EmployeeID)));
    setSyncMessage('Employee deleted successfully!');
    setTimeout(() => setSyncMessage(null), 3000);
  };

  const handleProcessPayroll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    const emp = employees.find(e => e.EmployeeID === payrollForm.EmployeeID);
    if (!emp) return alert('Select a valid employee.');

    // Duplicate check for Payroll in same month/year
    if (payrolls.some(p => p.EmployeeID === emp.EmployeeID && p.MonthYear === payrollForm.MonthYear)) {
      return alert(`Payroll for ${emp.FullName} for period ${payrollForm.MonthYear} has already been processed! Duplicate entry prevented.`);
    }

    setIsSubmitting(true);
    try {
      const basic = Number(payrollForm.BasicSalary) || emp.Salary;
      const allow = Number(payrollForm.Allowances) || 0;
      const ded = Number(payrollForm.Deductions) || 0;
      const net = basic + allow - ded;

      const newPayroll: ErpPayroll = {
        PayrollID: `PAY-${payrollForm.MonthYear}-${emp.EmployeeID}`,
        EmployeeID: emp.EmployeeID,
        EmployeeName: emp.FullName,
        MonthYear: payrollForm.MonthYear,
        BasicSalary: basic,
        Allowances: allow,
        Deductions: ded,
        NetSalary: net,
        PaymentStatus: 'Paid',
        PaymentDate: new Date().toISOString().split('T')[0],
        PaymentMethod: payrollForm.PaymentMethod
      };

      await saveToDatabase('erp_payroll', newPayroll);
      setPayrolls(prev => [newPayroll, ...prev]);

      // Also record transaction for accounting ledger automatically
      const salaryTxn: ErpTransaction = {
        TransactionID: `TXN-PAY-${Date.now().toString().slice(-4)}`,
        Type: 'PayrollPayment',
        Category: 'Staff Salaries Expense',
        Description: `Salary disbursement for ${emp.FullName} (${payrollForm.MonthYear})`,
        Amount: net,
        PaymentMethod: payrollForm.PaymentMethod,
        ReferenceNo: newPayroll.PayrollID,
        Date: new Date().toISOString().split('T')[0],
        CreatedBy: currentUser?.FullName || 'Admin'
      };
      await saveToDatabase('erp_transactions', salaryTxn);
      setTransactions(prev => [salaryTxn, ...prev]);

      setShowPayrollModal(false);
      setSyncMessage('Payroll processed successfully!');
      setTimeout(() => setSyncMessage(null), 3000);
    } catch (err: any) {
      alert('Error processing payroll: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePayroll = async (pay: ErpPayroll) => {
    if (!confirm(`Delete payroll record for ${pay.EmployeeName} (${pay.MonthYear})?`)) return;
    const targetId = pay._id || pay.PayrollID;
    await deleteFromDatabase('erp_payroll', targetId);

    // Delete corresponding transaction
    const matchTxn = transactions.find(t => t.ReferenceNo === pay.PayrollID || t.TransactionID === `TXN-PAY-${pay.PayrollID}`);
    if (matchTxn) {
      await deleteFromDatabase('erp_transactions', matchTxn._id || matchTxn.TransactionID);
      setTransactions(prev => prev.filter(t => t.TransactionID !== matchTxn.TransactionID && t._id !== matchTxn._id));
    }

    setPayrolls(prev => prev.filter(p => (p._id ? p._id !== pay._id : p.PayrollID !== pay.PayrollID)));
    setSyncMessage('Payroll record deleted successfully!');
    setTimeout(() => setSyncMessage(null), 3000);
  };

  // HANDLERS FOR EXPENSES & ASSETS
  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (!expenseForm.Amount || !expenseForm.Description) return alert('Expense Description and Amount are required.');

    setIsSubmitting(true);
    try {
      const newExpense: ErpExpense = {
        ExpenseID: `EXP-${Math.floor(100 + Math.random() * 900)}`,
        Category: expenseForm.Category || 'Other',
        Description: expenseForm.Description,
        Amount: Number(expenseForm.Amount),
        ExpenseDate: expenseForm.ExpenseDate || new Date().toISOString().split('T')[0],
        PaymentMethod: expenseForm.PaymentMethod || 'Cash',
        ReceiptRef: expenseForm.ReceiptRef || 'N/A'
      };

      await saveToDatabase('erp_expenses', newExpense);
      setExpenses(prev => [newExpense, ...prev]);

      // Auto log transaction
      const expTxn: ErpTransaction = {
        TransactionID: `TXN-EXP-${Date.now().toString().slice(-4)}`,
        Type: 'Expense',
        Category: `Operating Expense (${newExpense.Category})`,
        Description: newExpense.Description,
        Amount: newExpense.Amount,
        PaymentMethod: newExpense.PaymentMethod,
        ReferenceNo: newExpense.ExpenseID,
        Date: newExpense.ExpenseDate,
        CreatedBy: currentUser?.FullName || 'Admin'
      };
      await saveToDatabase('erp_transactions', expTxn);
      setTransactions(prev => [expTxn, ...prev]);

      setShowExpenseModal(false);
      setExpenseForm({ Category: 'Utilities', Description: '', Amount: 0 });
      setSyncMessage('Expense saved successfully!');
      setTimeout(() => setSyncMessage(null), 3000);
    } catch (err: any) {
      alert('Error saving expense: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteExpense = async (exp: ErpExpense) => {
    if (!confirm(`Delete expense ${exp.ExpenseID}?`)) return;
    const targetId = exp._id || exp.ExpenseID;
    await deleteFromDatabase('erp_expenses', targetId);

    // Delete matching transaction from erp_transactions so it doesn't linger in GL/CashBook
    const matchTxn = transactions.find(t => t.ReferenceNo === exp.ExpenseID || t.TransactionID === exp.ExpenseID || t.ReferenceNo === exp._id || (t.Type === 'Expense' && t.Amount === exp.Amount && t.Date === exp.ExpenseDate));
    if (matchTxn) {
      await deleteFromDatabase('erp_transactions', matchTxn._id || matchTxn.TransactionID);
      setTransactions(prev => prev.filter(t => t.TransactionID !== matchTxn.TransactionID && t._id !== matchTxn._id));
    }

    setExpenses(prev => prev.filter(e => (e._id ? e._id !== exp._id : e.ExpenseID !== exp.ExpenseID)));
    setSyncMessage('Expense deleted successfully!');
    setTimeout(() => setSyncMessage(null), 3000);
  };

  const handleAddAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (!assetForm.AssetName || !assetForm.PurchaseCost) return alert('Asset Name and Cost are required.');

    // Prevent double entry: check duplicate asset name
    if (assets.some(a => a.AssetName.trim().toLowerCase() === assetForm.AssetName?.trim().toLowerCase())) {
      return alert('An asset with this name already exists! Duplicate entry prevented.');
    }

    setIsSubmitting(true);
    try {
      const cost = Number(assetForm.PurchaseCost);
      const newAsset: ErpAsset = {
        AssetID: `AST-${Math.floor(100 + Math.random() * 900)}`,
        AssetName: assetForm.AssetName.trim(),
        Category: assetForm.Category || 'Equipment',
        PurchaseDate: assetForm.PurchaseDate || new Date().toISOString().split('T')[0],
        PurchaseCost: cost,
        CurrentValue: Number(assetForm.CurrentValue) || cost,
        DepreciationRate: Number(assetForm.DepreciationRate) || 10,
        Status: assetForm.Status || 'Active'
      };

      await saveToDatabase('erp_assets', newAsset);
      setAssets(prev => [newAsset, ...prev]);
      setShowAssetModal(false);
      setAssetForm({ AssetName: '', PurchaseCost: 0, DepreciationRate: 10 });
      setSyncMessage('Asset saved successfully!');
      setTimeout(() => setSyncMessage(null), 3000);
    } catch (err: any) {
      alert('Error saving asset: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAsset = async (ast: ErpAsset) => {
    if (!confirm(`Delete asset ${ast.AssetName}?`)) return;
    const targetId = ast._id || ast.AssetID;
    await deleteFromDatabase('erp_assets', targetId);
    setAssets(prev => prev.filter(a => (a._id ? a._id !== ast._id : a.AssetID !== ast.AssetID)));
    setSyncMessage('Asset deleted successfully!');
    setTimeout(() => setSyncMessage(null), 3000);
  };

  // PRINT PURCHASE ORDER FUNCTION (3 Columns Layout: Medicine Name & Required Qty / Received / Balance)
  const handlePrintPo = (po: ErpPurchaseOrder) => {
    const printWin = window.open('', '_blank', 'width=950,height=900');
    if (!printWin) return alert('Popup blocked. Allow popups to print Purchase Order.');

    const cName = clinicSettings?.ClinicName || 'PUNJAB HOMEOPATHIC CLINIC & PHARMACY';
    const cTag = clinicSettings?.ClinicLogoText || 'HEALING NATURALLY. RESTORING BALANCE.';
    const logoSrc = clinicSettings?.ClinicLogoImage || '/nhc_logo.svg';

    // Find all GRNs recorded for this Purchase Order
    const poGrns = (grns || []).filter(
      g => (g.POID === po.POID || (g as any).PoID === po.POID) && g.Status !== 'Cancelled'
    );
    const hasGrns = poGrns.length > 0;

    // Calculate aggregated received quantity per item
    const receivedQtyMap: Record<string, number> = {};
    poGrns.forEach(grn => {
      (grn.Items || []).forEach(gItem => {
        const key = (gItem.ItemID || gItem.ItemName || '').trim();
        const keyName = (gItem.ItemName || '').trim();
        const qty = Number(gItem.ReceivedQty || 0);
        if (key) receivedQtyMap[key] = (receivedQtyMap[key] || 0) + qty;
        if (keyName && keyName !== key) receivedQtyMap[keyName] = (receivedQtyMap[keyName] || 0) + qty;
      });
    });

    const totalItems = po.Items.length;
    const colSize = Math.max(1, Math.ceil(totalItems / (hasGrns ? 2 : 3)));

    const col1Items = po.Items.slice(0, colSize);
    const col2Items = po.Items.slice(colSize, colSize * 2);
    const col3Items = !hasGrns ? po.Items.slice(colSize * 2) : [];

    const renderColumnTable = (items: typeof po.Items, startIdx: number) => {
      if (!items || items.length === 0) return `<div style="flex: 1;"></div>`;

      const rowsHtml = items.map((item, idx) => {
        const itemKey = (item.ItemID || item.ItemName || '').trim();
        const itemKeyName = (item.ItemName || '').trim();
        const recQty = (receivedQtyMap[itemKey] || receivedQtyMap[itemKeyName] || 0);
        const balQty = Math.max(0, Number(item.Qty) - recQty);

        if (hasGrns) {
          return `
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="text-align: center; border: 1px solid #cbd5e1; padding: 4px; font-weight: bold; color: #475569; width: 24px;">${startIdx + idx + 1}</td>
              <td style="border: 1px solid #cbd5e1; padding: 4px; font-weight: bold; color: #0f172a;">
                ${item.ItemName}
                ${item.Category ? `<div style="font-size: 8px; color: #4338ca; font-weight: 600; margin-top: 1px;">Cat: ${item.Category}</div>` : ''}
              </td>
              <td style="text-align: center; border: 1px solid #cbd5e1; padding: 4px; font-weight: bold; color: #0284c7; width: 42px; background: #f0f9ff;">${item.Qty}</td>
              <td style="text-align: center; border: 1px solid #cbd5e1; padding: 4px; font-weight: 800; color: ${recQty > 0 ? '#047857' : '#94a3b8'}; width: 42px; background: ${recQty > 0 ? '#ecfdf5' : '#ffffff'};">${recQty}</td>
              <td style="text-align: center; border: 1px solid #cbd5e1; padding: 4px; font-weight: 800; color: ${balQty > 0 ? '#b45309' : '#047857'}; width: 42px; background: ${balQty > 0 ? '#fffbeb' : '#f0fdf4'};">${balQty}</td>
            </tr>
          `;
        }

        return `
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="text-align: center; border: 1px solid #cbd5e1; padding: 5px; font-weight: bold; color: #475569; width: 26px;">${startIdx + idx + 1}</td>
            <td style="border: 1px solid #cbd5e1; padding: 5px; font-weight: bold; color: #0f172a;">
              ${item.ItemName}
              ${item.Category ? `<div style="font-size: 8.5px; color: #4338ca; font-weight: 600; margin-top: 1px;">Cat: ${item.Category}</div>` : ''}
            </td>
            <td style="text-align: center; border: 1px solid #cbd5e1; padding: 5px; font-weight: bold; color: #0284c7; width: 60px; background: #f0f9ff;">${item.Qty}</td>
          </tr>
        `;
      }).join('');

      return `
        <div style="flex: 1; min-width: 0;">
          <table style="width: 100%; border-collapse: collapse; font-size: 10.5px;">
            <thead>
              <tr style="background: #1e293b; color: #ffffff;">
                <th style="border: 1px solid #334155; padding: 5px; text-align: center; width: 24px; font-size: 8.5px; text-transform: uppercase;">#</th>
                <th style="border: 1px solid #334155; padding: 5px; text-align: left; font-size: 8.5px; text-transform: uppercase;">Medicine Name</th>
                <th style="border: 1px solid #334155; padding: 5px; text-align: center; width: ${hasGrns ? '42px' : '60px'}; font-size: 8.5px; text-transform: uppercase;">Ord</th>
                ${hasGrns ? `
                  <th style="border: 1px solid #334155; padding: 5px; text-align: center; width: 42px; font-size: 8.5px; text-transform: uppercase; background: #047857;">Rec</th>
                  <th style="border: 1px solid #334155; padding: 5px; text-align: center; width: 42px; font-size: 8.5px; text-transform: uppercase; background: #b45309;">Bal</th>
                ` : ''}
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
        </div>
      `;
    };

    const col1Html = renderColumnTable(col1Items, 0);
    const col2Html = renderColumnTable(col2Items, colSize);
    const col3Html = !hasGrns ? renderColumnTable(col3Items, colSize * 2) : '';

    // Build Received Goods Summary HTML if GRNs exist
    let grnSummaryHtml = '';
    if (hasGrns) {
      const grnBatchesHtml = poGrns.map((g, gIdx) => {
        const itemRows = (g.Items || []).filter(i => Number(i.ReceivedQty || 0) > 0).map((i, iIdx) => `
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 4px; border: 1px solid #cbd5e1; text-align: center; font-weight: bold; color: #64748b; width: 24px;">${iIdx + 1}</td>
            <td style="padding: 4px; border: 1px solid #cbd5e1; font-weight: bold; color: #0f172a;">
              ${i.ItemName}
              ${i.BatchNo ? `<span style="font-size: 8.5px; color: #047857; font-weight: 700; margin-left: 6px;">[Batch: ${i.BatchNo} ${i.ExpiryDate ? `| Exp: ${i.ExpiryDate}` : ''}]</span>` : ''}
            </td>
            <td style="padding: 4px; border: 1px solid #cbd5e1; text-align: center; font-weight: 800; color: #047857; background: #ecfdf5; width: 80px;">${i.ReceivedQty}</td>
            <td style="padding: 4px; border: 1px solid #cbd5e1; text-align: right; font-weight: 700; color: #0f172a; width: 85px;">Rs. ${Number(i.UnitPrice || 0).toLocaleString()}</td>
            <td style="padding: 4px; border: 1px solid #cbd5e1; text-align: right; font-weight: 800; color: #0f172a; width: 95px;">Rs. ${Number(i.LineTotal || (i.ReceivedQty * i.UnitPrice) || 0).toLocaleString()}</td>
          </tr>
        `).join('');

        return `
          <div style="margin: 8px 0; border: 1px solid #cbd5e1; border-radius: 6px; overflow: hidden; background: #ffffff;">
            <div style="background: #1e293b; color: #ffffff; padding: 5px 10px; font-size: 10px; font-weight: 800; display: flex; justify-content: space-between; align-items: center;">
              <span>GRN #${gIdx + 1}: <u style="color: #6ee7b7; text-decoration: none;">${g.GRNID}</u> &nbsp;|&nbsp; Date: ${g.ReceivedDate}</span>
              <span>Inv / Challan #: <u style="color: #fde047; text-decoration: none;">${g.SupplierInvoiceNo || g.ChallanNo || 'N/A'}</u> &nbsp;|&nbsp; GRN Amount: Rs. ${(g.TotalAmount || 0).toLocaleString()}</span>
            </div>
            <table style="width: 100%; border-collapse: collapse; font-size: 10px;">
              <thead>
                <tr style="background: #f1f5f9; color: #334155; font-size: 8.5px; text-transform: uppercase;">
                  <th style="padding: 4px; border: 1px solid #cbd5e1; width: 24px;">#</th>
                  <th style="padding: 4px; border: 1px solid #cbd5e1; text-align: left;">Received Item Name & Batch Info</th>
                  <th style="padding: 4px; border: 1px solid #cbd5e1; text-align: center; width: 80px;">Received Qty</th>
                  <th style="padding: 4px; border: 1px solid #cbd5e1; text-align: right; width: 85px;">Unit Price</th>
                  <th style="padding: 4px; border: 1px solid #cbd5e1; text-align: right; width: 95px;">Sub Total</th>
                </tr>
              </thead>
              <tbody>
                ${itemRows || `<tr><td colspan="5" style="text-align: center; padding: 6px; color: #64748b;">No items recorded in this GRN batch.</td></tr>`}
              </tbody>
            </table>
          </div>
        `;
      }).join('');

      grnSummaryHtml = `
        <div style="margin-top: 14px; border: 1.5px solid #047857; border-radius: 8px; overflow: hidden; background: #f0fdf4;">
          <div style="background: #047857; color: #ffffff; padding: 6px 12px; font-weight: 900; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; display: flex; justify-content: space-between; align-items: center;">
            <span>⚡ ITEMS RECEIVED IN GRN (GOODS RECEIVING SUMMARY)</span>
            <span>Total ${poGrns.length} GRN Batch(es) Received</span>
          </div>
          <div style="padding: 8px;">
            ${grnBatchesHtml}
          </div>
        </div>
      `;
    }

    printWin.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Purchase Order ${po.POID} - Punjab Homeopathic Clinic</title>
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
              font-size: 11px;
              line-height: 1.4;
              background: #ffffff;
            }
            * { box-sizing: border-box; }

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
              margin-bottom: 12px;
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

            .grid-container {
              display: flex;
              gap: 10px;
              align-items: flex-start;
              width: 100%;
            }

            .signature-section {
              margin-top: 25px;
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
              <h1 class="clinic-name">${cName}</h1>
              <div class="clinic-tagline">${cTag}</div>
              <div class="clinic-address" style="font-size: 11px; font-weight: 700; color: #1e293b; margin-top: 2px;">10 Shalimar Road, Garhi Shahu, Lahore</div>
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
            <span class="report-banner-title">OFFICIAL PURCHASE ORDER (PO) ${hasGrns ? '- GRN RECEIVING REPORT' : '- STOCK REQUISITION'}</span>
            <span class="report-banner-ref">REF: PHC-PO-${po.POID}</span>
          </div>

          <div class="meta-grid">
            <div class="meta-item">
              <span class="meta-label">PO Ref Number</span>
              <span class="meta-value" style="color: #4338ca;">${po.POID}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Order Date</span>
              <span class="meta-value">${po.OrderDate}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Expected Delivery</span>
              <span class="meta-value">${po.ExpectedDeliveryDate || 'Immediate'}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Supplier / Vendor</span>
              <span class="meta-value" style="color: #0f172a;">${po.VendorName} (${po.VendorID || 'N/A'})</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">PO Status</span>
              <span class="meta-value" style="color: ${po.Status === 'Partially Received' ? '#d97706' : po.Status === 'Received' ? '#047857' : '#047857'}; font-weight: 800;">
                ${po.Status ? po.Status.toUpperCase() : 'APPROVED'}
              </span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Total Line Items</span>
              <span class="meta-value" style="color: #881337;">${po.Items.length} Medicines</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Total Order Est Amount</span>
              <span class="meta-value">Rs. ${(po.TotalAmount || 0).toLocaleString()}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Audit Prepared By</span>
              <span class="meta-value">${currentUser?.FullName || 'Staff Accountant'}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Responsible Manager</span>
              <span class="meta-value" style="color: #881337;">Mr. Zaigham Ali Anjum</span>
            </div>
          </div>

          <!-- Main Purchase Order Items Table -->
          <div class="grid-container">
            ${col1Html}
            ${col2Html}
            ${col3Html}
          </div>

          ${po.Notes ? `<div style="margin-top: 10px; padding: 8px 12px; background: #fffbeb; border: 1px solid #fde68a; border-radius: 6px; font-size: 10.5px;"><strong>Special Instructions / Vendor Notes:</strong> ${po.Notes}</div>` : ''}

          <!-- Items Received via GRN Breakdown Section -->
          ${grnSummaryHtml}

          <!-- Executive Signatures & Stamps Block -->
          <div class="signature-section">
            <div class="sig-box">
              <div class="sig-line-text">
                ${currentUser?.FullName || 'Accountant / Audit Officer'}
              </div>
              <div class="sig-title-primary" style="color: #0f172a;">PREPARED BY</div>
              <div class="sig-title-sub" style="font-size: 9px; color: #475569;">Procurement & Inventory Desk</div>
            </div>

            <div class="stamp-box">
              <span>PHC OFFICIAL STAMP</span>
              <span style="font-size: 7px; color: #94a3b8; margin-top: 2px;">[ SEAL & STAMP ]</span>
            </div>

            <div class="sig-box" style="width: 250px;">
              <div class="sig-line-manager">
                Zaigham Ali Anjum
              </div>
              <div class="sig-title-primary">MR. ZAIGHAM ALI ANJUM</div>
              <div class="sig-title-sub">Manager Operations & Administrative Head</div>
              <div class="sig-title-dept">Punjab Homeopathic Clinic & Pharmacy</div>
            </div>
          </div>

          <!-- Official Footer -->
          <div class="official-footer">
            <span>Punjab Homeopathic Clinic & Pharmacy • Official Purchase Order (PO) • Confidential Document</span>
            <span>Generated Date: ${new Date().toLocaleString('en-GB')}</span>
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

  // CALCULATED ERP METRICS
  const totalVendorBalance = vendors.reduce((sum, v) => sum + v.Balance, 0);
  const totalIncome = cashBookMetrics.totalInflow;
  const totalExpenseTxns = cashBookMetrics.totalOutflow;
  const netOperatingProfit = cashBookMetrics.netBalance;
  const totalAssetValuation = assets.reduce((sum, a) => sum + a.CurrentValue, 0);
  const totalMonthlyPayroll = payrolls.reduce((sum, p) => sum + p.NetSalary, 0);

  return (
    <div className="min-h-full bg-slate-50 text-slate-800 p-4 md:p-6 space-y-6 pb-24">
      {/* HEADER BAR */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-100">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Mini ERP System</h1>
            <p className="text-xs text-slate-500">Integrated Procurement, General Ledger, HR & Payroll, Assets & Operating Expenses</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {syncMessage && (
            <div className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200 flex items-center space-x-1.5 animate-pulse">
              <CheckCircle2 className="w-4 h-4" />
              <span>{syncMessage}</span>
            </div>
          )}

          <button
            type="button"
            onClick={fetchErpData}
            disabled={loading}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition flex items-center space-x-1.5 border border-slate-200 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-indigo-600' : ''}`} />
            <span>Sync Data</span>
          </button>
        </div>
      </div>

      {/* SIDEBAR NAVIGATION & MAIN ERP CONTENT AREA */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* LEFT SIDEBAR TABS NAVIGATION */}
        <div className="w-full lg:w-64 shrink-0 bg-white rounded-2xl border border-slate-200 p-3.5 shadow-sm space-y-1.5 sticky top-4">
          <div className="px-3 py-1 text-[10px] font-black uppercase text-slate-400 tracking-wider">
            ERP Navigation
          </div>
          {[
            { id: 'overview', label: 'ERP Dashboard', icon: PieChart },
            { id: 'cash_book_pnl', label: 'Cash Book & Clinic P&L', icon: Landmark },
            { id: 'vendors', label: 'Vendors Directory', icon: Building2 },
            { id: 'vendor_statement', label: 'Vendor Statement & Ledger', icon: FileText },
            { id: 'po', label: 'Purchase Orders', icon: ShoppingCart },
            { id: 'ledger', label: 'Financial Ledger', icon: Receipt },
            { id: 'hr', label: 'HR & Payroll', icon: Users },
            { id: 'expenses_assets', label: 'Expenses & Assets', icon: Boxes },
            { id: 'reporting', label: 'Reporting & Analytics', icon: BarChart3 }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`w-full px-3.5 py-2.5 rounded-xl font-bold text-xs transition flex items-center justify-between cursor-pointer ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center space-x-2.5 min-w-0">
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{tab.label}</span>
                </div>
                {isActive && (
                  <div className="w-1.5 h-1.5 rounded-full bg-white shrink-0" />
                )}
              </button>
            );
          })}
        </div>

        {/* RIGHT MAIN CONTENT AREA */}
        <div className="flex-1 min-w-0 w-full space-y-6">

      {/* TAB 1: OVERVIEW DASHBOARD */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* FINANCIAL TIMEFRAME SELECTOR BAR */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              <div className="flex items-center space-x-2.5">
                <div className="p-2.5 bg-indigo-50 text-indigo-700 rounded-xl">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">Financial Timeframe Scope</h3>
                  <p className="text-xs text-slate-500 font-medium">Filter Dashboard Metrics by Daily, Weekly, Monthly, Yearly or Custom Date Range</p>
                </div>
              </div>

              {/* Timeframe Scope Buttons */}
              <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
                {[
                  { id: 'today', label: '☀️ Daily (Today)' },
                  { id: 'this_week', label: '📅 Weekly (Past 7 Days)' },
                  { id: 'this_month', label: '📊 Monthly (This Month)' },
                  { id: 'this_year', label: '📈 Yearly (This Year)' },
                  { id: 'custom', label: '📆 Custom Period' },
                  { id: 'all_time', label: '🌐 All Time' }
                ].map(p => (
                  <button
                    key={p.id}
                    onClick={() => setCashBookDateFilter(p.id as any)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                      cashBookDateFilter === p.id
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Range Date Pickers */}
            {cashBookDateFilter === 'custom' && (
              <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-3">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-slate-700">From Date:</span>
                  <input
                    type="date"
                    value={cashBookStartDate}
                    onChange={(e) => setCashBookStartDate(e.target.value)}
                    className="text-xs font-bold p-1.5 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-slate-700">To Date:</span>
                  <input
                    type="date"
                    value={cashBookEndDate}
                    onChange={(e) => setCashBookEndDate(e.target.value)}
                    className="text-xs font-bold p-1.5 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            )}

            {/* Active Scope Badge */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs bg-indigo-50/70 border border-indigo-100 rounded-xl px-3.5 py-2 gap-2">
              <span className="font-bold text-indigo-950 flex items-center">
                <BarChart3 className="w-4 h-4 text-indigo-600 mr-1.5 shrink-0" />
                Active Timeframe Scope: {
                  cashBookDateFilter === 'today' ? `Daily Operations (${new Date().toLocaleDateString('en-GB')})` :
                  cashBookDateFilter === 'this_week' ? 'Weekly Performance (Past 7 Days)' :
                  cashBookDateFilter === 'this_month' ? `Monthly P&L Ledger (${new Date().toLocaleString('default', { month: 'long', year: 'numeric' })})` :
                  cashBookDateFilter === 'this_year' ? `Yearly Annual P&L (Year ${new Date().getFullYear()})` :
                  cashBookDateFilter === 'custom' ? `Custom Range (${cashBookStartDate} to ${cashBookEndDate})` : 'All Time Historical Data'
                }
              </span>
              <span className="text-[11px] font-extrabold text-indigo-800 bg-white px-2.5 py-0.5 rounded-full border border-indigo-200 self-start sm:self-auto">
                {cashBookMetrics.activeDaysCount} Active Operational {cashBookMetrics.activeDaysCount === 1 ? 'Day' : 'Days'} Records
              </span>
            </div>
          </div>

          {/* KPI CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500">Total Income Receipts</p>
                <h3 className="text-2xl font-black text-emerald-600 mt-1">Rs. {totalIncome.toLocaleString()}</h3>
                <p className="text-[10px] text-slate-400 mt-1">OPD, Dispensary & Pharmacy Sales</p>
              </div>
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                <TrendingUp className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500">Total Outflow / Expenses</p>
                <h3 className="text-2xl font-black text-rose-600 mt-1">Rs. {totalExpenseTxns.toLocaleString()}</h3>
                <p className="text-[10px] text-slate-400 mt-1">Utilities, Rent, Salaries & Purchases</p>
              </div>
              <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
                <TrendingDown className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500">Net Cash Balance</p>
                <h3 className={`text-2xl font-black mt-1 ${netOperatingProfit >= 0 ? 'text-indigo-600' : 'text-rose-600'}`}>
                  Rs. {netOperatingProfit.toLocaleString()}
                </h3>
                <p className="text-[10px] text-slate-400 mt-1">Margin: {cashBookMetrics.marginPercent}%</p>
              </div>
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                <Landmark className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500">Vendor Payables</p>
                <h3 className="text-2xl font-black text-amber-600 mt-1">Rs. {totalVendorBalance.toLocaleString()}</h3>
                <p className="text-[10px] text-slate-400 mt-1">{vendors.length} Active Distributors</p>
              </div>
              <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                <Building2 className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500">Fixed Asset Valuation</p>
                <h3 className="text-2xl font-black text-slate-800 mt-1">Rs. {totalAssetValuation.toLocaleString()}</h3>
                <p className="text-[10px] text-slate-400 mt-1">{assets.length} Equipment & Fixtures</p>
              </div>
              <div className="p-3 bg-slate-100 text-slate-700 rounded-xl">
                <Boxes className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* REVENUE & EXPENSE STRUCTURE BREAKDOWN */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Income Stream Composition */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center">
                  <TrendingUp className="w-4 h-4 text-emerald-600 mr-1.5" />
                  Income Streams Composition ({cashBookDateFilter === 'today' ? 'Daily' : cashBookDateFilter === 'this_week' ? 'Weekly' : cashBookDateFilter === 'this_month' ? 'Monthly' : cashBookDateFilter === 'this_year' ? 'Yearly' : 'Selected Scope'})
                </h3>
                <span className="text-xs font-black font-mono text-emerald-700">Rs. {cashBookMetrics.totalInflow.toLocaleString()}</span>
              </div>

              <div className="space-y-2.5 text-xs font-medium">
                <div>
                  <div className="flex justify-between text-slate-700 mb-1">
                    <span>OPD Consultation Tokens</span>
                    <span className="font-bold font-mono">Rs. {cashBookMetrics.opdInflow.toLocaleString()} ({cashBookMetrics.totalInflow > 0 ? ((cashBookMetrics.opdInflow / cashBookMetrics.totalInflow) * 100).toFixed(0) : 0}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div className="bg-emerald-500 h-2 rounded-full transition-all duration-300" style={{ width: `${cashBookMetrics.totalInflow > 0 ? (cashBookMetrics.opdInflow / cashBookMetrics.totalInflow) * 100 : 0}%` }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-slate-700 mb-1">
                    <span>Clinical Formulated Medicines</span>
                    <span className="font-bold font-mono">Rs. {cashBookMetrics.clinicalInflow.toLocaleString()} ({cashBookMetrics.totalInflow > 0 ? ((cashBookMetrics.clinicalInflow / cashBookMetrics.totalInflow) * 100).toFixed(0) : 0}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div className="bg-teal-500 h-2 rounded-full transition-all duration-300" style={{ width: `${cashBookMetrics.totalInflow > 0 ? (cashBookMetrics.clinicalInflow / cashBookMetrics.totalInflow) * 100 : 0}%` }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-slate-700 mb-1">
                    <span>Pharmacy Store Sales</span>
                    <span className="font-bold font-mono">Rs. {cashBookMetrics.storeInflow.toLocaleString()} ({cashBookMetrics.totalInflow > 0 ? ((cashBookMetrics.storeInflow / cashBookMetrics.totalInflow) * 100).toFixed(0) : 0}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div className="bg-indigo-500 h-2 rounded-full transition-all duration-300" style={{ width: `${cashBookMetrics.totalInflow > 0 ? (cashBookMetrics.storeInflow / cashBookMetrics.totalInflow) * 100 : 0}%` }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-slate-700 mb-1">
                    <span>Registration & Card Fees</span>
                    <span className="font-bold font-mono">Rs. {cashBookMetrics.regInflow.toLocaleString()} ({cashBookMetrics.totalInflow > 0 ? ((cashBookMetrics.regInflow / cashBookMetrics.totalInflow) * 100).toFixed(0) : 0}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div className="bg-amber-500 h-2 rounded-full transition-all duration-300" style={{ width: `${cashBookMetrics.totalInflow > 0 ? (cashBookMetrics.regInflow / cashBookMetrics.totalInflow) * 100 : 0}%` }}></div>
                  </div>
                </div>
              </div>

              <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600 bg-emerald-50/50 p-2.5 rounded-xl font-medium">
                <span>Daily Average Revenue Rate:</span>
                <span className="font-black font-mono text-emerald-800">Rs. {cashBookMetrics.dailyAvgInflow.toLocaleString()} / Day</span>
              </div>
            </div>

            {/* Outflows & Overheads Structure */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center">
                  <TrendingDown className="w-4 h-4 text-rose-600 mr-1.5" />
                  Outflows & Overheads Structure ({cashBookDateFilter === 'today' ? 'Daily' : cashBookDateFilter === 'this_week' ? 'Weekly' : cashBookDateFilter === 'this_month' ? 'Monthly' : cashBookDateFilter === 'this_year' ? 'Yearly' : 'Selected Scope'})
                </h3>
                <span className="text-xs font-black font-mono text-rose-700">Rs. {cashBookMetrics.totalOutflow.toLocaleString()}</span>
              </div>

              <div className="space-y-2.5 text-xs font-medium">
                <div>
                  <div className="flex justify-between text-slate-700 mb-1">
                    <span>Staff Salary & Payroll</span>
                    <span className="font-bold font-mono">Rs. {cashBookMetrics.salariesOutflow.toLocaleString()} ({cashBookMetrics.totalOutflow > 0 ? ((cashBookMetrics.salariesOutflow / cashBookMetrics.totalOutflow) * 100).toFixed(0) : 0}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div className="bg-rose-500 h-2 rounded-full transition-all duration-300" style={{ width: `${cashBookMetrics.totalOutflow > 0 ? (cashBookMetrics.salariesOutflow / cashBookMetrics.totalOutflow) * 100 : 0}%` }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-slate-700 mb-1">
                    <span>Building Rent & Upkeep</span>
                    <span className="font-bold font-mono">Rs. {cashBookMetrics.rentOutflow.toLocaleString()} ({cashBookMetrics.totalOutflow > 0 ? ((cashBookMetrics.rentOutflow / cashBookMetrics.totalOutflow) * 100).toFixed(0) : 0}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div className="bg-purple-500 h-2 rounded-full transition-all duration-300" style={{ width: `${cashBookMetrics.totalOutflow > 0 ? (cashBookMetrics.rentOutflow / cashBookMetrics.totalOutflow) * 100 : 0}%` }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-slate-700 mb-1">
                    <span>Electricity & Utility Bills</span>
                    <span className="font-bold font-mono">Rs. {cashBookMetrics.billsOutflow.toLocaleString()} ({cashBookMetrics.totalOutflow > 0 ? ((cashBookMetrics.billsOutflow / cashBookMetrics.totalOutflow) * 100).toFixed(0) : 0}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div className="bg-amber-500 h-2 rounded-full transition-all duration-300" style={{ width: `${cashBookMetrics.totalOutflow > 0 ? (cashBookMetrics.billsOutflow / cashBookMetrics.totalOutflow) * 100 : 0}%` }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-slate-700 mb-1">
                    <span>Medicine Purchases & Vendor Invoices</span>
                    <span className="font-bold font-mono">Rs. {cashBookMetrics.medicinePurchasesOutflow.toLocaleString()} ({cashBookMetrics.totalOutflow > 0 ? ((cashBookMetrics.medicinePurchasesOutflow / cashBookMetrics.totalOutflow) * 100).toFixed(0) : 0}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div className="bg-blue-500 h-2 rounded-full transition-all duration-300" style={{ width: `${cashBookMetrics.totalOutflow > 0 ? (cashBookMetrics.medicinePurchasesOutflow / cashBookMetrics.totalOutflow) * 100 : 0}%` }}></div>
                  </div>
                </div>
              </div>

              <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600 bg-rose-50/50 p-2.5 rounded-xl font-medium">
                <span>Daily Average Expense Rate:</span>
                <span className="font-black font-mono text-rose-800">Rs. {cashBookMetrics.dailyAvgOutflow.toLocaleString()} / Day</span>
              </div>
            </div>
          </div>

          {/* RECENT TRANSACTIONS TABLE & QUICK ACTIONS */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
                  <Receipt className="w-4 h-4 text-indigo-600" />
                  <span>Recent Clinic Operational & Financial Receipts</span>
                </h3>
                <button
                  onClick={() => setActiveTab('cash_book_pnl')}
                  className="text-xs font-bold text-indigo-600 hover:underline"
                >
                  View Full Cash Book &rarr;
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                      <th className="p-2.5">Date</th>
                      <th className="p-2.5">Ref No</th>
                      <th className="p-2.5">Particulars / Category</th>
                      <th className="p-2.5">Type</th>
                      <th className="p-2.5 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {cashBookEntries.slice(0, 8).map((txn, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="p-2.5 text-slate-500 whitespace-nowrap">{txn.date}</td>
                        <td className="p-2.5 font-mono font-bold text-slate-700">{txn.ref}</td>
                        <td className="p-2.5 text-slate-800">
                          <div className="font-bold text-slate-900">{txn.particulars}</div>
                          <div className="text-[10px] text-slate-400">{txn.category}</div>
                        </td>
                        <td className="p-2.5">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                            txn.type === 'INFLOW' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                          }`}>
                            {txn.type}
                          </span>
                        </td>
                        <td className={`p-2.5 text-right font-bold ${
                          txn.type === 'INFLOW' ? 'text-emerald-600' : 'text-rose-600'
                        }`}>
                          Rs. {txn.amount.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                    {cashBookEntries.length === 0 && (
                      <tr>
                        <td colSpan={5} className="text-center p-6 text-slate-400">
                          No clinic cash collection or transaction records found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* QUICK MODULE LAUNCHPAD */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
              <h3 className="font-bold text-slate-900 text-sm">Quick ERP Actions</h3>
              
              <div className="space-y-2.5">
                <button
                  onClick={handleOpenAddVendor}
                  className="w-full p-3 rounded-xl bg-slate-50 hover:bg-indigo-50 hover:border-indigo-200 border border-slate-200 text-left transition flex items-center justify-between group cursor-pointer"
                >
                  <div className="flex items-center space-x-3">
                    <Building2 className="w-5 h-5 text-indigo-600" />
                    <div>
                      <div className="font-bold text-xs text-slate-800 group-hover:text-indigo-600">Add Supplier Vendor</div>
                      <div className="text-[10px] text-slate-400">Register new distributor</div>
                    </div>
                  </div>
                  <Plus className="w-4 h-4 text-slate-400 group-hover:text-indigo-600" />
                </button>

                <button
                  onClick={() => setShowPoModal(true)}
                  className="w-full p-3 rounded-xl bg-slate-50 hover:bg-indigo-50 hover:border-indigo-200 border border-slate-200 text-left transition flex items-center justify-between group cursor-pointer"
                >
                  <div className="flex items-center space-x-3">
                    <ShoppingCart className="w-5 h-5 text-emerald-600" />
                    <div>
                      <div className="font-bold text-xs text-slate-800 group-hover:text-indigo-600">Create Purchase Order</div>
                      <div className="text-[10px] text-slate-400">Requisition stock from vendor</div>
                    </div>
                  </div>
                  <Plus className="w-4 h-4 text-slate-400 group-hover:text-indigo-600" />
                </button>

                <button
                  onClick={() => setShowTxnModal(true)}
                  className="w-full p-3 rounded-xl bg-slate-50 hover:bg-indigo-50 hover:border-indigo-200 border border-slate-200 text-left transition flex items-center justify-between group cursor-pointer"
                >
                  <div className="flex items-center space-x-3">
                    <Receipt className="w-5 h-5 text-amber-600" />
                    <div>
                      <div className="font-bold text-xs text-slate-800 group-hover:text-indigo-600">Log Income / Expense Voucher</div>
                      <div className="text-[10px] text-slate-400">General ledger posting</div>
                    </div>
                  </div>
                  <Plus className="w-4 h-4 text-slate-400 group-hover:text-indigo-600" />
                </button>

                <button
                  onClick={() => setShowEmpModal(true)}
                  className="w-full p-3 rounded-xl bg-slate-50 hover:bg-indigo-50 hover:border-indigo-200 border border-slate-200 text-left transition flex items-center justify-between group cursor-pointer"
                >
                  <div className="flex items-center space-x-3">
                    <UserPlus className="w-5 h-5 text-blue-600" />
                    <div>
                      <div className="font-bold text-xs text-slate-800 group-hover:text-indigo-600">Add Staff / Employee</div>
                      <div className="text-[10px] text-slate-400">HR profile & salary setup</div>
                    </div>
                  </div>
                  <Plus className="w-4 h-4 text-slate-400 group-hover:text-indigo-600" />
                </button>

                <button
                  onClick={() => setShowExpenseModal(true)}
                  className="w-full p-3 rounded-xl bg-slate-50 hover:bg-indigo-50 hover:border-indigo-200 border border-slate-200 text-left transition flex items-center justify-between group cursor-pointer"
                >
                  <div className="flex items-center space-x-3">
                    <CreditCard className="w-5 h-5 text-rose-600" />
                    <div>
                      <div className="font-bold text-xs text-slate-800 group-hover:text-indigo-600">Record Operational Expense</div>
                      <div className="text-[10px] text-slate-400">Utilities, Rent & Maintenance</div>
                    </div>
                  </div>
                  <Plus className="w-4 h-4 text-slate-400 group-hover:text-indigo-600" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: CLINIC DAILY CASH BOOK & MONTHLY P&L LEDGER DASHBOARD */}
      {/* ========================================================================= */}
      {activeTab === 'cash_book_pnl' && (
        <div className="space-y-6">
          {/* Header Banner & Print Button */}
          <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white p-5 rounded-2xl shadow-md border border-purple-800/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2">
                <Landmark className="w-6 h-6 text-amber-400" />
                <h2 className="text-xl font-extrabold tracking-tight">Clinic Daily Cash Book & P&L Ledger</h2>
              </div>
              <p className="text-xs text-purple-200 mt-1">
                Real-time tracking of Patient Collections (OPD Tokens, Clinical Meds, Pharmacy) vs Operating Outflows (Staff Salaries, Building Rent, Electricity Bills & Medicine Purchases).
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={handlePrintCashBookReport}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-md transition flex items-center space-x-1.5 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Print Cash Book Statement</span>
              </button>
            </div>
          </div>

          {/* Executive KPI Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Total Inflow */}
            <div className="bg-emerald-950/20 border border-emerald-500/30 p-4 rounded-2xl bg-white shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider flex items-center">
                  <ArrowUpRight className="w-4 h-4 text-emerald-600 mr-1" />
                  Total Cash Collections (Inflow)
                </span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-extrabold px-2 py-0.5 rounded-full">
                  Income
                </span>
              </div>
              <div className="text-2xl font-black text-emerald-700 font-mono">
                PKR {cashBookMetrics.totalInflow.toLocaleString()}
              </div>
              <div className="text-[11px] text-slate-600 pt-1 border-t border-emerald-100 grid grid-cols-2 gap-1 font-medium">
                <span>OPD Tokens: <strong>{cashBookMetrics.opdInflow.toLocaleString()}</strong></span>
                <span>Clinical Meds: <strong>{cashBookMetrics.clinicalInflow.toLocaleString()}</strong></span>
                <span>Store Pharmacy: <strong>{cashBookMetrics.storeInflow.toLocaleString()}</strong></span>
                <span>Cards & Reg: <strong>{cashBookMetrics.regInflow.toLocaleString()}</strong></span>
              </div>
            </div>

            {/* Total Outflow */}
            <div className="bg-rose-950/20 border border-rose-500/30 p-4 rounded-2xl bg-white shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-rose-800 uppercase tracking-wider flex items-center">
                  <ArrowDownRight className="w-4 h-4 text-rose-600 mr-1" />
                  Total Outflows & Deductions
                </span>
                <span className="text-[10px] bg-rose-100 text-rose-800 font-extrabold px-2 py-0.5 rounded-full">
                  Expenses
                </span>
              </div>
              <div className="text-2xl font-black text-rose-700 font-mono">
                PKR {cashBookMetrics.totalOutflow.toLocaleString()}
              </div>
              <div className="text-[11px] text-slate-600 pt-1 border-t border-rose-100 grid grid-cols-2 gap-1 font-medium">
                <span>Salaries Paid: <strong>{cashBookMetrics.salariesOutflow.toLocaleString()}</strong></span>
                <span>Building Rent: <strong>{cashBookMetrics.rentOutflow.toLocaleString()}</strong></span>
                <span>Electricity/Bills: <strong>{cashBookMetrics.billsOutflow.toLocaleString()}</strong></span>
                <span>Meds Purchase: <strong>{cashBookMetrics.medicinePurchasesOutflow.toLocaleString()}</strong></span>
              </div>
            </div>

            {/* Net Operating Profit / Balance */}
            <div className={`border p-4 rounded-2xl bg-white shadow-xs space-y-2 ${cashBookMetrics.netBalance >= 0 ? 'bg-purple-50/50 border-purple-300' : 'bg-red-50/50 border-red-300'}`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-purple-950 uppercase tracking-wider flex items-center">
                  <Wallet className="w-4 h-4 text-purple-700 mr-1" />
                  Net Cash Profit / Remaining Balance
                </span>
                <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${cashBookMetrics.netBalance >= 0 ? 'bg-purple-200 text-purple-900' : 'bg-red-200 text-red-900'}`}>
                  {cashBookMetrics.marginPercent}% Net Margin
                </span>
              </div>
              <div className={`text-2xl font-black font-mono ${cashBookMetrics.netBalance >= 0 ? 'text-purple-950' : 'text-red-700'}`}>
                PKR {cashBookMetrics.netBalance.toLocaleString()}
              </div>
              <p className="text-[11px] text-slate-600 pt-1 border-t border-purple-200 font-medium leading-tight">
                Net remaining liquidity available in clinic cash box after deducting all operational overheads and salaries.
              </p>
            </div>
          </div>

          {/* Quick Record Outflow / Expense Form Section */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center">
                <Coins className="w-4 h-4 text-rose-600 mr-1.5" />
                Quick Outflow Logger (Rent, Salaries, Electricity Bills & Purchases)
              </h3>
              <span className="text-[11px] text-slate-500 font-medium">Instantly record any clinic cash deduction</span>
            </div>

            <form onSubmit={handleQuickOutflowSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-end">
              <div className="lg:col-span-3 space-y-1">
                <label className="text-xs font-bold text-slate-700">Outflow Category</label>
                <select
                  value={quickOutflowForm.category}
                  onChange={(e) => setQuickOutflowForm({ ...quickOutflowForm, category: e.target.value })}
                  className="w-full text-xs font-medium p-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                >
                  <option value="Building Rent & Maintenance">Building Rent & Maintenance</option>
                  <option value="Staff Salary & Payroll">Staff Salary & Payroll</option>
                  <option value="Electricity & Utility Bills">Electricity & Utility Bills</option>
                  <option value="Medicine Stock Purchase">Medicine Stock Purchase</option>
                  <option value="Tea, Refreshment & Pantry">Tea, Refreshment & Pantry</option>
                  <option value="Repair & Clinic Upkeep">Repair & Clinic Upkeep</option>
                  <option value="Miscellaneous Overhead">Miscellaneous Overhead</option>
                </select>
              </div>

              <div className="lg:col-span-2 space-y-1">
                <label className="text-xs font-bold text-slate-700">Amount (PKR)</label>
                <input
                  type="number"
                  placeholder=""
                  value={quickOutflowForm.amount}
                  onChange={(e) => setQuickOutflowForm({ ...quickOutflowForm, amount: e.target.value })}
                  required
                  className="w-full text-xs font-bold font-mono p-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="lg:col-span-2 space-y-1">
                <label className="text-xs font-bold text-slate-700">Paid To / Payee</label>
                <input
                  type="text"
                  placeholder=""
                  value={quickOutflowForm.payee}
                  onChange={(e) => setQuickOutflowForm({ ...quickOutflowForm, payee: e.target.value })}
                  className="w-full text-xs font-medium p-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="lg:col-span-2 space-y-1">
                <label className="text-xs font-bold text-slate-700">Payment Date</label>
                <input
                  type="date"
                  value={quickOutflowForm.date}
                  onChange={(e) => setQuickOutflowForm({ ...quickOutflowForm, date: e.target.value })}
                  className="w-full text-xs font-medium p-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="lg:col-span-3">
                <button
                  type="submit"
                  className="w-full py-2 px-3 bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs rounded-lg shadow-xs transition flex items-center justify-center space-x-1 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Deduct Outflow Payment</span>
                </button>
              </div>
            </form>
          </div>

          {/* Filter Toolbar & Ledger Controls */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3">
              {/* Period Quick Filters */}
              <div className="flex flex-wrap items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 w-full xl:w-auto">
                {[
                  { id: 'today', label: '☀️ Daily' },
                  { id: 'this_week', label: '📅 Weekly' },
                  { id: 'this_month', label: '📊 Monthly' },
                  { id: 'this_year', label: '📈 Yearly' },
                  { id: 'custom', label: '📆 Custom Range' },
                  { id: 'all_time', label: '🌐 All Time' }
                ].map(p => (
                  <button
                    key={p.id}
                    onClick={() => setCashBookDateFilter(p.id as any)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                      cashBookDateFilter === p.id
                        ? 'bg-purple-900 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-2 w-full xl:w-auto">
                {/* Type Category Filter */}
                <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl border border-slate-200 w-full sm:w-auto">
                  {[
                    { id: 'ALL', label: 'All Transactions' },
                    { id: 'INFLOW', label: 'Inflows Only' },
                    { id: 'OUTFLOW', label: 'Outflows Only' }
                  ].map(c => (
                    <button
                      key={c.id}
                      onClick={() => setCashBookCategoryFilter(c.id as any)}
                      className={`px-3 py-1 text-xs font-bold rounded-lg transition cursor-pointer flex-1 sm:flex-none ${
                        cashBookCategoryFilter === c.id
                          ? 'bg-slate-800 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>

                {/* Search Box */}
                <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder=""
                  value={cashBookSearch}
                  onChange={(e) => setCashBookSearch(e.target.value)}
                  className="w-full text-xs font-medium pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
          </div>

            {/* Custom Range Date Pickers */}
            {cashBookDateFilter === 'custom' && (
              <div className="pt-2.5 border-t border-slate-100 flex flex-wrap items-center gap-3">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-slate-700">From Date:</span>
                  <input
                    type="date"
                    value={cashBookStartDate}
                    onChange={(e) => setCashBookStartDate(e.target.value)}
                    className="text-xs font-bold p-1.5 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-slate-700">To Date:</span>
                  <input
                    type="date"
                    value={cashBookEndDate}
                    onChange={(e) => setCashBookEndDate(e.target.value)}
                    className="text-xs font-bold p-1.5 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>
            )}

            {/* Period Operational Stats Pill Bar */}
            <div className="pt-2 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-medium">
              <div className="bg-purple-50/70 border border-purple-100 p-2 rounded-xl text-center">
                <span className="text-[10px] font-bold text-purple-800 uppercase block">Operating Days</span>
                <span className="text-sm font-black text-purple-950 font-mono">{cashBookMetrics.activeDaysCount} Days</span>
              </div>
              <div className="bg-emerald-50/70 border border-emerald-100 p-2 rounded-xl text-center">
                <span className="text-[10px] font-bold text-emerald-800 uppercase block">Daily Avg Inflow</span>
                <span className="text-sm font-black text-emerald-900 font-mono">Rs. {cashBookMetrics.dailyAvgInflow.toLocaleString()}</span>
              </div>
              <div className="bg-rose-50/70 border border-rose-100 p-2 rounded-xl text-center">
                <span className="text-[10px] font-bold text-rose-800 uppercase block">Daily Avg Outflow</span>
                <span className="text-sm font-black text-rose-900 font-mono">Rs. {cashBookMetrics.dailyAvgOutflow.toLocaleString()}</span>
              </div>
              <div className="bg-indigo-50/70 border border-indigo-100 p-2 rounded-xl text-center">
                <span className="text-[10px] font-bold text-indigo-800 uppercase block">Daily Net Retention</span>
                <span className="text-sm font-black text-indigo-950 font-mono">Rs. {cashBookMetrics.dailyAvgNet.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Cash Book Ledger Table */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
            <div className="px-5 py-3 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="text-xs font-extrabold uppercase tracking-wider flex items-center">
                <FileText className="w-4 h-4 text-amber-400 mr-2" />
                Cash Book Transaction Ledger Records ({filteredCashBookEntries.length})
              </h3>
              <span className="text-[11px] text-slate-400 font-mono">Real-time synchronized with Patient Desk & ERP</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[10px]">
                    <th className="p-3 text-center w-12">#</th>
                    <th className="p-3 w-28">Date</th>
                    <th className="p-3 w-28">Ref #</th>
                    <th className="p-3">Particulars / Description</th>
                    <th className="p-3 w-40">Category</th>
                    <th className="p-3 text-center w-24">Type</th>
                    <th className="p-3 text-right w-32">Amount (PKR)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {filteredCashBookEntries.length > 0 ? (
                    filteredCashBookEntries.map((e, idx) => (
                      <tr key={e.id} className="hover:bg-slate-50/80 transition">
                        <td className="p-3 text-center font-bold text-slate-400 font-mono text-[11px]">{idx + 1}</td>
                        <td className="p-3 font-mono text-[11px] text-slate-600">{e.date}</td>
                        <td className="p-3 font-mono font-bold text-purple-950 text-[11px]">{e.ref}</td>
                        <td className="p-3 font-bold text-slate-900">{e.particulars}</td>
                        <td className="p-3 font-medium text-slate-600">
                          <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px] font-bold border border-slate-200">
                            {e.category}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          {e.type === 'INFLOW' ? (
                            <span className="bg-emerald-100 text-emerald-800 font-black text-[10px] px-2 py-0.5 rounded-full border border-emerald-300 inline-flex items-center">
                              <ArrowUpRight className="w-3 h-3 mr-0.5" />
                              INFLOW
                            </span>
                          ) : (
                            <span className="bg-rose-100 text-rose-800 font-black text-[10px] px-2 py-0.5 rounded-full border border-rose-300 inline-flex items-center">
                              <ArrowDownRight className="w-3 h-3 mr-0.5" />
                              OUTFLOW
                            </span>
                          )}
                        </td>
                        <td className={`p-3 text-right font-mono font-black text-sm ${e.type === 'INFLOW' ? 'text-emerald-700' : 'text-rose-700'}`}>
                          {e.type === 'INFLOW' ? '+' : '-'} PKR {e.amount.toLocaleString()}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400 font-medium">
                        No financial records found matching the current filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: VENDORS DIRECTORY */}
      {activeTab === 'vendors' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">Distributors & Vendors Directory</h2>
              <p className="text-xs text-slate-500">Manage pharmaceutical suppliers, tax IDs, and outstanding balances</p>
            </div>
            <div className="flex items-center space-x-2.5 self-start flex-wrap gap-y-2">
              <button
                type="button"
                onClick={() => {
                  setHistoryVendorFilter('ALL');
                  setHistoryStartDate('');
                  setHistoryEndDate('');
                  setShowPaymentHistoryModal(true);
                }}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition flex items-center space-x-1.5 cursor-pointer shadow-xs"
                title="View complete vendor payment history & settlement log"
              >
                <History className="w-4 h-4" />
                <span>Payment & Settlement History</span>
              </button>
              <button
                type="button"
                onClick={handleOpenEditVendorTop}
                disabled={vendors.length === 0}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition flex items-center space-x-1.5 cursor-pointer shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
                title="Edit existing supplier/vendor records (Name, Mobile, Address) while keeping SupplierID intact"
              >
                <Pencil className="w-4 h-4" />
                <span>Edit Vendor</span>
              </button>
              <button
                type="button"
                onClick={handleOpenAddVendor}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition flex items-center space-x-1.5 cursor-pointer shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Add New Vendor</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                  <th className="p-3">Vendor ID</th>
                  <th className="p-3">Vendor Name</th>
                  <th className="p-3">Contact Person</th>
                  <th className="p-3">Phone</th>
                  <th className="p-3">Address</th>
                  <th className="p-3 text-right">Total PO Cost</th>
                  <th className="p-3 text-right">Outstanding Balance</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {vendors.map((v, idx) => {
                  const vendorPOs = purchaseOrders.filter(po => 
                    ((po.VendorID && po.VendorID === v.VendorID) || 
                     (po.VendorName && po.VendorName.trim().toLowerCase() === v.VendorName.trim().toLowerCase())) &&
                    po.Status !== 'Cancelled'
                  );
                  const totalPoCost = vendorPOs.reduce((sum, po) => sum + Number(po.TotalAmount || 0), 0);

                  return (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="p-3 font-mono font-bold text-slate-700">{v.VendorID}</td>
                      <td className="p-3 font-bold text-slate-900">{v.VendorName}</td>
                      <td className="p-3 text-slate-600">{v.ContactPerson}</td>
                      <td className="p-3 text-slate-600">{v.Phone}</td>
                      <td className="p-3 text-slate-500 max-w-xs truncate">{v.Address}</td>
                      <td className="p-3 text-right font-bold text-slate-900">
                        Rs. {totalPoCost.toLocaleString()}
                        {vendorPOs.length > 0 && (
                          <div className="text-[10px] text-slate-500 font-normal">({vendorPOs.length} PO{vendorPOs.length > 1 ? 's' : ''})</div>
                        )}
                      </td>
                      <td className="p-3 text-right font-bold text-amber-600">Rs. {v.Balance.toLocaleString()}</td>
                      <td className="p-3 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          {v.Status}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                      <div className="flex items-center justify-center space-x-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEditVendor(v)}
                          className="px-2.5 py-1 text-[11px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded border border-blue-200 transition cursor-pointer flex items-center space-x-1 shadow-2xs"
                          title="Edit Vendor Name, Mobile/Phone, Address, and Specifications"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => {
                            setSelectedVendorId(v.VendorID || v._id || '');
                            setActiveTab('vendor_statement');
                          }}
                          className="px-2.5 py-1 text-[11px] font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded border border-amber-200 transition cursor-pointer flex items-center space-x-1 shadow-2xs"
                          title="View detailed Vendor Account Statement & Payable Ledger"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>View Statement</span>
                        </button>
                        <button
                          onClick={() => setVendorPoModalData(v)}
                          className="px-2.5 py-1 text-[11px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded border border-indigo-200 transition cursor-pointer flex items-center space-x-1 shadow-2xs"
                          title="View all Purchase Orders for this vendor"
                        >
                          <Boxes className="w-3.5 h-3.5" />
                          <span>View PO</span>
                        </button>
                        <button
                          onClick={() => handlePayVendor(v)}
                          className="px-2.5 py-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded border border-emerald-200 transition cursor-pointer flex items-center space-x-1 shadow-2xs"
                          title="Pay vendor bill & clear Accounts Payable"
                        >
                          <Coins className="w-3.5 h-3.5" />
                          <span>Pay Bill</span>
                        </button>
                        <button
                          onClick={() => handleDeleteVendor(v)}
                          className="p-1 text-rose-600 hover:bg-rose-50 rounded transition cursor-pointer"
                          title="Delete Vendor"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2B: VENDOR ACCOUNT STATEMENT & PAYABLE LEDGER */}
      {activeTab === 'vendor_statement' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-6 animate-fadeIn" id="erp-vendor-statement-tab">
          {/* Header & Controls */}
          <div className="border-b border-slate-200 pb-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center">
                <Building2 className="w-5 h-5 text-amber-600 mr-2" />
                <span>Vendor Account Statement & Payable Ledger</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Synchronized statement of Goods Received Notes (GRNs), vendor payments, and Accounts Payable ledger
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 print:hidden">
              <button
                onClick={() => {
                  if (selectedVendor) {
                    setVendorPoModalData(selectedVendor);
                  }
                }}
                disabled={!selectedVendor}
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                title="View Purchase Orders for selected vendor"
              >
                <Boxes className="w-4 h-4" />
                <span>View PO</span>
              </button>

              <button
                onClick={() => {
                  if (selectedVendor) {
                    handlePayVendor(selectedVendor);
                  }
                }}
                disabled={!selectedVendor}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
              >
                <Coins className="w-4 h-4" />
                <span>Record Payment</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (selectedVendor) {
                    handleOpenEditVendor(selectedVendor);
                  } else {
                    handleOpenEditVendorTop();
                  }
                }}
                disabled={vendors.length === 0}
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                title="Edit vendor name and mobile number while keeping SupplierID intact"
              >
                <Pencil className="w-4 h-4" />
                <span>Edit Vendor</span>
              </button>

              <button
                onClick={handleOpenAddVendor}
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center space-x-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Vendor</span>
              </button>

              <button
                onClick={() => fetchErpData()}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border border-slate-300 transition flex items-center space-x-1.5 cursor-pointer shadow-xs"
              >
                <RefreshCw className="w-4 h-4 text-slate-600" />
                <span>Refresh Data</span>
              </button>

              <button
                onClick={() => setVendorPrintModalOpen(true)}
                disabled={!selectedVendor}
                className="px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-bold rounded-xl border border-amber-300 transition flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                title="Preview Statement Modal"
              >
                <Eye className="w-4 h-4 text-amber-700" />
                <span>Preview A4</span>
              </button>

              <button
                onClick={() => {
                  if (selectedVendor) {
                    setPoHistoryFilterPo('ALL');
                    setPoHistoryModalData({ vendor: selectedVendor });
                  }
                }}
                disabled={!selectedVendor}
                className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                title="View Payment History for P.O. in Grid View"
              >
                <History className="w-4 h-4" />
                <span>Payment History for P.O.</span>
              </button>

              <button
                onClick={() => handlePrintVendorStatement()}
                disabled={!selectedVendor}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                title="Print Official Vendor Account Statement (A4)"
              >
                <Printer className="w-4 h-4" />
                <span>Print Statement</span>
              </button>
            </div>
          </div>

          {/* Vendor Selector Banner */}
          <div className="bg-amber-50/70 p-4 rounded-xl border border-amber-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center font-black text-lg shadow-xs shrink-0">
                {selectedVendor?.VendorName ? selectedVendor.VendorName.charAt(0).toUpperCase() : 'V'}
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase text-amber-800 tracking-wider">
                  Select Vendor / Distributor ({vendors.length} Total):
                </label>
                <select
                  value={selectedVendorId || (selectedVendor?.VendorID || selectedVendor?._id || '')}
                  onChange={(e) => setSelectedVendorId(e.target.value)}
                  className="mt-0.5 bg-white text-slate-900 font-bold text-xs rounded-lg px-3 py-1.5 border border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-2xs cursor-pointer min-w-[280px]"
                >
                  {vendors.length === 0 ? (
                    <option value="">No Vendors Found in Database</option>
                  ) : (
                    vendors.map(v => (
                      <option key={v.VendorID || v._id} value={v.VendorID || v._id}>
                        {v.VendorName} ({v.VendorID || 'N/A'}) - Balance: Rs. {(v.Balance || 0).toLocaleString()}
                      </option>
                    ))
                  )}
                </select>
              </div>
            </div>

            {selectedVendor && (
              <div className="flex flex-wrap items-center gap-3 text-xs">
                <div className="bg-white px-3 py-1.5 rounded-lg border border-amber-200/80 text-slate-700 shadow-2xs">
                  <span className="text-[9px] text-slate-400 block font-bold uppercase">Contact Person</span>
                  <span className="font-bold text-slate-900">{selectedVendor.ContactPerson || 'N/A'}</span>
                </div>
                <div className="bg-white px-3 py-1.5 rounded-lg border border-amber-200/80 text-slate-700 shadow-2xs">
                  <span className="text-[9px] text-slate-400 block font-bold uppercase">Phone Number</span>
                  <span className="font-bold text-slate-900">{selectedVendor.Phone || 'N/A'}</span>
                </div>
                <div className="bg-white px-3 py-1.5 rounded-lg border border-amber-200/80 text-slate-700 shadow-2xs">
                  <span className="text-[9px] text-slate-400 block font-bold uppercase">Tax / NTN No</span>
                  <span className="font-mono font-bold text-slate-900">{selectedVendor.TaxID || 'N/A'}</span>
                </div>
              </div>
            )}
          </div>

          {/* Statement Date Range Filter Pills */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-amber-600" />
              <span className="text-xs font-bold uppercase text-slate-800 tracking-wider">Statement Period Filter:</span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {(['all', 'daily', 'weekly', 'monthly', 'yearly'] as const).map((filterKey) => (
                <button
                  key={filterKey}
                  onClick={() => setVendorDateFilter(filterKey)}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition cursor-pointer capitalize ${
                    vendorDateFilter === filterKey
                      ? 'bg-amber-600 text-white shadow-2xs'
                      : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
                  }`}
                >
                  {filterKey === 'all' ? 'All Time (Full Statement)' : filterKey}
                </button>
              ))}
            </div>
          </div>

          {/* Metric Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Total Invoiced / Goods Received (GRN)
              </span>
              <p className="text-xl font-black text-amber-700 font-mono">
                Rs. {vendorStatement.totalInvoiced.toLocaleString()}
              </p>
              <p className="text-[10px] text-slate-400">Total Goods Received (Credit)</p>
            </div>

            <div className="bg-emerald-50/70 p-4 rounded-xl border border-emerald-200 space-y-1">
              <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                Total Payments Cleared
              </span>
              <p className="text-xl font-black text-emerald-700 font-mono">
                Rs. {vendorStatement.totalPaid.toLocaleString()}
              </p>
              <p className="text-[10px] text-emerald-600">Total Payments Settled (Debit)</p>
            </div>

            <div className="bg-amber-500 text-white p-4 rounded-xl shadow-xs space-y-1">
              <span className="text-[10px] font-bold text-amber-100 uppercase tracking-wider block">
                Closing Accounts Payable Balance
              </span>
              <p className="text-xl font-black font-mono">
                Rs. {vendorStatement.closingBalance.toLocaleString()}
              </p>
              <p className="text-[10px] text-amber-100">Net Outstanding Amount Due</p>
            </div>
          </div>

          {/* Statement Rows Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
            <div className="bg-slate-100 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center">
                <FileText className="w-4 h-4 text-amber-600 mr-1.5" />
                Ledger Statement Audit Entries ({vendorStatement.statementRows.length} Records)
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-sans">
                <thead>
                  <tr className="bg-slate-800 text-slate-200 uppercase text-[10px] font-bold tracking-wider">
                    <th className="p-3">Date</th>
                    <th className="p-3">Type</th>
                    <th className="p-3">Ref / Voucher #</th>
                    <th className="p-3">P.O. Number</th>
                    <th className="p-3">Description</th>
                    <th className="p-3 text-right">Debit (Paid)</th>
                    <th className="p-3 text-right">Credit (Bill)</th>
                    <th className="p-3 text-right">Running Balance</th>
                    <th className="p-3 text-center">Audit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white font-medium text-slate-700">
                  {vendorStatement.statementRows.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-slate-400 font-bold">
                        No transactions or GRNs recorded for this vendor in selected period.
                      </td>
                    </tr>
                  ) : (
                    vendorStatement.statementRows.map((row, idx) => (
                      <React.Fragment key={row.id || idx}>
                        <tr className="hover:bg-slate-50 transition">
                          <td className="p-3 font-mono text-slate-600">{row.date}</td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              row.credit > 0 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                            }`}>
                              {row.type}
                            </span>
                          </td>
                          <td className="p-3 font-mono font-bold text-slate-900">{row.refNo}</td>
                          <td className="p-3 font-mono font-bold text-indigo-600">
                            {row.poNo !== 'N/A' ? (
                              <span className="px-1.5 py-0.5 bg-indigo-50 border border-indigo-200 rounded text-indigo-700 font-mono text-[11px]">
                                {row.poNo}
                              </span>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </td>
                          <td className="p-3 max-w-xs truncate text-slate-600">{row.description}</td>
                          <td className="p-3 text-right font-mono font-bold text-emerald-700">
                            {row.debit > 0 ? `Rs. ${row.debit.toLocaleString()}` : '-'}
                          </td>
                          <td className="p-3 text-right font-mono font-bold text-amber-700">
                            {row.credit > 0 ? `Rs. ${row.credit.toLocaleString()}` : '-'}
                          </td>
                          <td className="p-3 text-right font-mono font-black text-slate-900">
                            Rs. {(row.runningBalance || 0).toLocaleString()}
                          </td>
                          <td className="p-3 text-center">
                            {row.type === 'Goods Received (GRN)' && row.rawItem?.ItemsReceived ? (
                              <button
                                onClick={() => setExpandedGrnId(expandedGrnId === row.id ? null : row.id)}
                                className="text-indigo-600 hover:text-indigo-800 font-bold text-[11px] underline cursor-pointer"
                              >
                                {expandedGrnId === row.id ? 'Hide Items' : 'View Items'}
                              </button>
                            ) : row.debit > 0 ? (
                              <button
                                onClick={() => handleDeleteTxn(row.rawItem)}
                                className="text-rose-600 hover:bg-rose-50 p-1 rounded transition cursor-pointer"
                                title="Delete Payment Transaction"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            ) : (
                              <span className="text-slate-300">-</span>
                            )}
                          </td>
                        </tr>

                        {/* Expandable GRN items line breakdown */}
                        {expandedGrnId === row.id && row.rawItem?.ItemsReceived && (
                          <tr className="bg-slate-50">
                            <td colSpan={9} className="p-4">
                              <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-2">
                                <h4 className="text-[11px] font-bold text-slate-800 uppercase tracking-wider">
                                  GRN Itemized Audit Breakdown ({row.rawItem.ItemsReceived.length} Items)
                                </h4>
                                <table className="w-full text-left text-[11px] border-collapse">
                                  <thead>
                                    <tr className="bg-slate-100 text-slate-600 font-bold">
                                      <th className="p-1.5">Medicine Name</th>
                                      <th className="p-1.5 text-center">Qty Received</th>
                                      <th className="p-1.5 text-right">Unit Price</th>
                                      <th className="p-1.5 text-right">Subtotal</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100">
                                    {row.rawItem.ItemsReceived.map((item: any, itemIdx: number) => (
                                      <tr key={itemIdx}>
                                        <td className="p-1.5 font-bold text-slate-800">{item.MedicineName}</td>
                                        <td className="p-1.5 text-center font-mono">{item.QuantityReceived}</td>
                                        <td className="p-1.5 text-right font-mono">Rs. {(item.UnitPrice || 0).toLocaleString()}</td>
                                        <td className="p-1.5 text-right font-mono font-bold text-slate-900">
                                          Rs. {((item.QuantityReceived || 0) * (item.UnitPrice || 0)).toLocaleString()}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: PURCHASE ORDERS */}
      {activeTab === 'po' && (
        <div className="space-y-4">
          {/* Inventory Stock Requisition Banner */}
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-amber-500/10 text-amber-700 rounded-xl font-bold">
                <Boxes className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h3 className="text-xs font-extrabold text-amber-900 uppercase tracking-wider">Inventory Stock Requisition Status</h3>
                <p className="text-xs text-amber-800 mt-0.5">
                  <span className="font-extrabold text-amber-900">
                    {inventoryItems.filter(med => (med.CStock ?? 0) <= ((med.MinStock !== undefined && med.MinStock !== null) ? med.MinStock : 1)).length} Medicines
                  </span> currently below minimum stock level and require purchase order replenishment.
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  handleSelectAllLowStockMedicines();
                  setShowPoModal(true);
                }}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition shadow-xs flex items-center space-x-1.5 cursor-pointer whitespace-nowrap"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Auto-Create PO for Low Stock Items</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setBulkPoRawText('');
                  setBulkPoParsedItems([]);
                  setBulkPoFileError('');
                  setShowUploadBulkPoModal(true);
                }}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition shadow-xs flex items-center space-x-1.5 cursor-pointer whitespace-nowrap"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Upload Bulk PO</span>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-slate-900">Purchase Orders & Stock Requisitions Log</h2>
                <p className="text-xs text-slate-500">Create, track, and print official POs for medicine stock replenishment</p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleOpenGrnForPo()}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition flex items-center space-x-1.5 cursor-pointer shadow-xs"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Process GRN (Receive Goods)</span>
                </button>
                <button
                  onClick={() => setShowPoModal(true)}
                  className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition flex items-center space-x-1.5 cursor-pointer shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Purchase Order</span>
                </button>
              </div>
            </div>

            {/* PO GRID SEARCH & VENDOR DROPDOWN FILTER BAR */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex flex-col md:flex-row items-center gap-3 justify-between">
              <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full md:w-auto flex-1">
                {/* Search Box */}
                <div className="relative flex-1 w-full sm:min-w-[240px]">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search PO#, Vendor Name, Medicine, Batch, or Date..."
                    value={poLogSearchTerm}
                    onChange={e => setPoLogSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-8 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                  {poLogSearchTerm && (
                    <button
                      type="button"
                      onClick={() => setPoLogSearchTerm('')}
                      className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Vendor Dropdown Filter */}
                <div className="flex items-center space-x-1.5 w-full sm:w-auto shrink-0">
                  <Filter className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <select
                    value={poLogVendorFilter}
                    onChange={e => setPoLogVendorFilter(e.target.value)}
                    className="w-full sm:w-auto bg-white border border-slate-200 text-slate-800 text-xs font-bold rounded-xl px-3 py-1.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none cursor-pointer"
                  >
                    <option value="ALL">All Suppliers / Vendor Names ({poVendorList.length})</option>
                    {poVendorList.map((vName, idx) => (
                      <option key={idx} value={vName}>
                        Vendor: {vName}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Status Dropdown Filter */}
                <div className="w-full sm:w-auto shrink-0">
                  <select
                    value={poLogStatusFilter}
                    onChange={e => setPoLogStatusFilter(e.target.value)}
                    className="w-full sm:w-auto bg-white border border-slate-200 text-slate-800 text-xs font-bold rounded-xl px-3 py-1.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none cursor-pointer"
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="Pending">Pending Orders</option>
                    <option value="Partially Received">Partially Received</option>
                    <option value="Received">Fully Received</option>
                  </select>
                </div>
              </div>

              {/* Counter Pill & Reset Button */}
              <div className="flex items-center space-x-2 shrink-0 self-end sm:self-auto">
                <span className="text-[11px] font-bold text-slate-600 bg-white border border-slate-200 px-2.5 py-1 rounded-lg">
                  Total: <strong className="text-indigo-600 font-extrabold">{filteredPurchaseOrders.length}</strong> / {purchaseOrders.length} POs
                  <span className="text-slate-400 mx-1">|</span>
                  <span className="text-emerald-700">Rs. {totalPoFilteredAmount.toLocaleString()}</span>
                </span>
                {(poLogSearchTerm || poLogVendorFilter !== 'ALL' || poLogStatusFilter !== 'ALL') && (
                  <button
                    type="button"
                    onClick={() => {
                      setPoLogSearchTerm('');
                      setPoLogVendorFilter('ALL');
                      setPoLogStatusFilter('ALL');
                    }}
                    className="px-2.5 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-lg transition flex items-center space-x-1 cursor-pointer"
                    title="Reset All PO Filters"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset</span>
                  </button>
                )}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                    <th className="p-3">PO Number</th>
                    <th className="p-3">Supplier / Vendor Name</th>
                    <th className="p-3">Order Date</th>
                    <th className="p-3">Expected Delivery</th>
                    <th className="p-3 text-center">Items Count</th>
                    <th className="p-3 text-right">Total Amount</th>
                    <th className="p-3 text-center">Status</th>
                    <th className="p-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredPurchaseOrders.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-400 font-medium">
                        {purchaseOrders.length === 0 ? (
                          <span>No Purchase Orders created yet. Click "Create Purchase Order" above.</span>
                        ) : (
                          <span>No Purchase Orders match your search and vendor filter criteria.</span>
                        )}
                      </td>
                    </tr>
                  ) : (
                    filteredPurchaseOrders.map((po, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="p-3 font-mono font-bold text-indigo-600">{po.POID}</td>
                        <td className="p-3 font-bold text-slate-900">{po.VendorName}</td>
                        <td className="p-3 text-slate-600">{po.OrderDate}</td>
                        <td className="p-3 text-slate-600">{po.ExpectedDeliveryDate}</td>
                        <td className="p-3 text-center">
                          <div className="font-bold text-slate-700">{po.Items?.length || 0} items</div>
                          {po.Items && po.Items.some(i => i.BatchNo) && (
                            <div
                              className="text-[10px] font-mono text-amber-800 font-semibold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 inline-block mt-0.5 cursor-help"
                              title={po.Items.map(i => `${i.ItemName}: Batch ${i.BatchNo || 'N/A'}`).join(' | ')}
                            >
                              Batch: {po.Items.find(i => i.BatchNo)?.BatchNo} {po.Items.length > 1 ? `+${po.Items.length - 1}` : ''}
                            </div>
                          )}
                        </td>
                        <td className="p-3 text-right font-bold text-slate-900">Rs. {po.TotalAmount.toLocaleString()}</td>
                        <td className="p-3 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            po.Status === 'Received'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : po.Status === 'Partially Received'
                              ? 'bg-amber-100 text-amber-900 border border-amber-300'
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {po.Status === 'Received' ? '✓ Fully Received' : po.Status === 'Partially Received' ? '⚡ Partially Received' : po.Status}
                          </span>
                        </td>
                        <td className="p-3 text-center space-x-1.5 whitespace-nowrap">
                          {po.Status !== 'Received' ? (
                            <button
                              type="button"
                              onClick={() => handleOpenGrnForPo(po)}
                              className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-[11px] font-bold transition inline-flex items-center space-x-1 cursor-pointer"
                              title="Process GRN stock inward for this PO"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>{po.Status === 'Partially Received' ? 'Receive Next Batch' : 'Receive Stock (GRN)'}</span>
                            </button>
                          ) : (
                            <span className="text-[11px] font-extrabold text-emerald-600 px-2 py-1 bg-emerald-50 rounded-lg">
                              Stock Added
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => handlePrintPo(po)}
                            className="p-1 text-slate-600 hover:bg-slate-100 rounded transition cursor-pointer"
                            title="Print Official PO"
                          >
                            <Printer className="w-4 h-4 text-slate-700" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeletePo(po)}
                            className="p-1 text-rose-600 hover:bg-rose-50 rounded transition cursor-pointer"
                            title="Delete PO"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Goods Received Notes (GRN) Received Stock Log */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <h2 className="text-base font-bold text-slate-900">Goods Received Notes (GRN) & Inward Stock Log</h2>
                </div>
                <p className="text-xs text-slate-500">Official verified receipts of PO shipments received and added to pharmacy stock</p>
              </div>
              <button
                type="button"
                onClick={() => handleOpenGrnForPo()}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-bold text-xs transition flex items-center space-x-1.5 self-start cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Create New GRN</span>
              </button>
            </div>

            {/* GRN GRID SEARCH & VENDOR DROPDOWN FILTER BAR */}
            <div className="bg-emerald-50/50 p-3 rounded-xl border border-emerald-200/60 flex flex-col md:flex-row items-center gap-3 justify-between">
              <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full md:w-auto flex-1">
                {/* Search Box */}
                <div className="relative flex-1 w-full sm:min-w-[240px]">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search GRN#, PO#, Vendor Name, Item, Batch, or Invoice..."
                    value={grnLogSearchTerm}
                    onChange={e => setGrnLogSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-8 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                  {grnLogSearchTerm && (
                    <button
                      type="button"
                      onClick={() => setGrnLogSearchTerm('')}
                      className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Vendor Dropdown Filter */}
                <div className="flex items-center space-x-1.5 w-full sm:w-auto shrink-0">
                  <Filter className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                  <select
                    value={grnLogVendorFilter}
                    onChange={e => setGrnLogVendorFilter(e.target.value)}
                    className="w-full sm:w-auto bg-white border border-slate-200 text-slate-800 text-xs font-bold rounded-xl px-3 py-1.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none cursor-pointer"
                  >
                    <option value="ALL">All Suppliers / Vendor Names ({grnVendorList.length})</option>
                    {grnVendorList.map((vName, idx) => (
                      <option key={idx} value={vName}>
                        Vendor: {vName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Counter Pill & Reset Button */}
              <div className="flex items-center space-x-2 shrink-0 self-end sm:self-auto">
                <span className="text-[11px] font-bold text-slate-600 bg-white border border-slate-200 px-2.5 py-1 rounded-lg">
                  Total: <strong className="text-emerald-700 font-extrabold">{filteredGrns.length}</strong> / {grns.length} GRNs
                  <span className="text-slate-400 mx-1">|</span>
                  <span className="text-emerald-800">Rs. {totalGrnFilteredAmount.toLocaleString()}</span>
                </span>
                {(grnLogSearchTerm || grnLogVendorFilter !== 'ALL') && (
                  <button
                    type="button"
                    onClick={() => {
                      setGrnLogSearchTerm('');
                      setGrnLogVendorFilter('ALL');
                    }}
                    className="px-2.5 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-lg transition flex items-center space-x-1 cursor-pointer"
                    title="Reset All GRN Filters"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset</span>
                  </button>
                )}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                    <th className="p-3">GRN Number</th>
                    <th className="p-3">PO Reference</th>
                    <th className="p-3">Supplier / Vendor Name</th>
                    <th className="p-3">Received Date</th>
                    <th className="p-3">Challan / Inv No.</th>
                    <th className="p-3 text-center">Items Received</th>
                    <th className="p-3 text-right">Total Value</th>
                    <th className="p-3 text-center">Status</th>
                    <th className="p-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredGrns.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-slate-400 font-medium">
                        {grns.length === 0 ? (
                          <span>No Goods Received Notes (GRNs) logged yet. Click "Process GRN" or select a Purchase Order to receive stock into inventory.</span>
                        ) : (
                          <span>No Goods Received Notes match your search and vendor filter criteria.</span>
                        )}
                      </td>
                    </tr>
                  ) : (
                    filteredGrns.map((grn, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="p-3 font-mono font-bold text-emerald-700">{grn.GRNID}</td>
                        <td className="p-3 font-mono font-bold text-indigo-600">{grn.POID}</td>
                        <td className="p-3 font-bold text-slate-900">{grn.VendorName}</td>
                        <td className="p-3 text-slate-600">{grn.ReceivedDate}</td>
                        <td className="p-3 text-slate-500 font-mono">{grn.ChallanNo || grn.SupplierInvoiceNo || 'N/A'}</td>
                        <td className="p-3 text-center font-bold text-slate-700">{grn.Items?.length || 0}</td>
                        <td className="p-3 text-right font-bold text-slate-900">Rs. {(grn.TotalAmount || 0).toLocaleString()}</td>
                        <td className="p-3 text-center">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            ✓ Stock Approved
                          </span>
                          <div className="text-[10px] font-mono text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded mt-1 font-semibold inline-block cursor-help" title="Double Entry GL Posted: Debit Inventory (103001) | Credit Accounts Payable (201001)">
                            GL: Dr 103001 | Cr 201001
                          </div>
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center space-x-1.5">
                            <button
                              type="button"
                              onClick={() => handlePrintGrn(grn)}
                              className="px-2 py-1 text-slate-700 hover:bg-slate-100 rounded transition cursor-pointer flex items-center space-x-1 font-bold border border-slate-200 text-[11px]"
                              title="Print Official GRN Voucher"
                            >
                              <Printer className="w-3.5 h-3.5 text-slate-600" />
                              <span>Print GRN</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteGrn(grn)}
                              className="px-2 py-1 text-rose-700 hover:bg-rose-50 rounded transition cursor-pointer flex items-center space-x-1 font-bold border border-rose-200 text-[11px]"
                              title="Delete Goods Received Note (GRN)"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                              <span>Delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: FINANCIAL LEDGER & VOUCHERS */}
      {activeTab === 'ledger' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">General Ledger & Transaction Vouchers</h2>
              <p className="text-xs text-slate-500">Record income receipts, expense vouchers, and bank/cash settlements</p>
            </div>
            <button
              onClick={() => setShowTxnModal(true)}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition flex items-center space-x-1.5 self-start cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Log Financial Voucher</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                  <th className="p-3">Txn ID</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Description</th>
                  <th className="p-3">Method</th>
                  <th className="p-3">Created By</th>
                  <th className="p-3 text-right">Amount</th>
                  <th className="p-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {transactions.map((t, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="p-3 font-mono font-bold text-slate-800">{t.TransactionID}</td>
                    <td className="p-3 text-slate-500 whitespace-nowrap">{t.Date}</td>
                    <td className="p-3 font-bold text-slate-900">{t.Category}</td>
                    <td className="p-3 text-slate-600 max-w-xs truncate">{t.Description || 'N/A'}</td>
                    <td className="p-3 text-slate-600 font-bold">{t.PaymentMethod}</td>
                    <td className="p-3 text-slate-500">{t.CreatedBy}</td>
                    <td className={`p-3 text-right font-black ${
                      t.Type === 'Income' ? 'text-emerald-600' : 'text-slate-900'
                    }`}>
                      Rs. {t.Amount.toLocaleString()}
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => handleDeleteTxn(t)}
                        className="p-1 text-rose-600 hover:bg-rose-50 rounded transition cursor-pointer"
                        title="Delete Txn"
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
      )}

      {/* TAB 5: HR & PAYROLL */}
      {activeTab === 'hr' && (
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
                      <td className="p-3 text-right font-black text-slate-900">Rs. {emp.Salary.toLocaleString()}</td>
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
                      <td className="p-3 text-right text-slate-600">Rs. {p.BasicSalary.toLocaleString()}</td>
                      <td className="p-3 text-right text-emerald-600">+ Rs. {p.Allowances.toLocaleString()}</td>
                      <td className="p-3 text-right text-rose-600">- Rs. {p.Deductions.toLocaleString()}</td>
                      <td className="p-3 text-right font-black text-slate-900">Rs. {p.NetSalary.toLocaleString()}</td>
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
      )}

      {/* TAB 6: EXPENSES & ASSETS */}
      {activeTab === 'expenses_assets' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* OPERATIONAL EXPENSES */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Operational Expenses Tracker</h3>
                <p className="text-xs text-slate-500">Utilities, Rent, Refreshments & Maintenance</p>
              </div>
              <button
                onClick={() => setShowExpenseModal(true)}
                className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition flex items-center space-x-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Expense</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                    <th className="p-2.5">Date</th>
                    <th className="p-2.5">Category</th>
                    <th className="p-2.5">Description</th>
                    <th className="p-2.5 text-right">Amount</th>
                    <th className="p-2.5 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {expenses.map((exp, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="p-2.5 text-slate-500 whitespace-nowrap">{exp.ExpenseDate}</td>
                      <td className="p-2.5 font-bold text-slate-800">{exp.Category}</td>
                      <td className="p-2.5 text-slate-600 max-w-xs truncate">{exp.Description}</td>
                      <td className="p-2.5 text-right font-black text-rose-600">Rs. {exp.Amount.toLocaleString()}</td>
                      <td className="p-2.5 text-center">
                        <button
                          onClick={() => handleDeleteExpense(exp)}
                          className="p-1 text-rose-600 hover:bg-rose-50 rounded transition cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* FIXED ASSETS REGISTER */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Fixed Asset Register</h3>
                <p className="text-xs text-slate-500">Refrigerators, POS hardware, Furniture & Equipment</p>
              </div>
              <button
                onClick={() => setShowAssetModal(true)}
                className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition flex items-center space-x-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Asset</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                    <th className="p-2.5">Asset Name</th>
                    <th className="p-2.5">Category</th>
                    <th className="p-2.5 text-right">Cost</th>
                    <th className="p-2.5 text-right">Current Value</th>
                    <th className="p-2.5 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {assets.map((ast, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="p-2.5 font-bold text-slate-900">{ast.AssetName}</td>
                      <td className="p-2.5 text-slate-600">{ast.Category}</td>
                      <td className="p-2.5 text-right text-slate-500">Rs. {ast.PurchaseCost.toLocaleString()}</td>
                      <td className="p-2.5 text-right font-black text-indigo-600">Rs. {ast.CurrentValue.toLocaleString()}</td>
                      <td className="p-2.5 text-center">
                        <button
                          onClick={() => handleDeleteAsset(ast)}
                          className="p-1 text-rose-600 hover:bg-rose-50 rounded transition cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 7: REPORTING & ANALYTICS */}
      {activeTab === 'reporting' && (
        <ReportingDesk
          vendors={vendors}
          purchaseOrders={purchaseOrders}
          grns={grns}
          transactions={transactions}
          employees={employees}
          payrolls={payrolls}
          expenses={expenses}
          assets={assets}
          inventoryItems={inventoryItems}
          appointments={appointments}
          patientVisits={patientVisits}
          posSales={posSales}
          currentUser={currentUser}
          clinicSettings={clinicSettings}
        />
      )}

      {/* MODAL: REGISTER / EDIT VENDOR */}
      {showVendorModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-150 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className={`p-2 rounded-xl border ${editingVendor ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-indigo-50 border-indigo-200 text-indigo-600'}`}>
                  {editingVendor ? <Pencil className="w-5 h-5" /> : <Building2 className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm md:text-base flex items-center space-x-1.5">
                    <span>{editingVendor ? 'Edit Supplier / Vendor Record' : 'Register New Supplier Vendor'}</span>
                  </h3>
                  <p className="text-xxs text-slate-500 font-medium">
                    {editingVendor
                      ? 'Update vendor name, mobile/phone, & specs. Existing Supplier ID remains locked and intact.'
                      : 'Create a new pharmaceutical distributor & accounts payable profile'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowVendorModal(false);
                  setEditingVendor(null);
                }}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* If Editing and multiple vendors exist: Quick Switcher Dropdown */}
            {editingVendor && vendors.length > 1 && (
              <div className="bg-blue-50/70 p-2.5 rounded-xl border border-blue-200 space-y-1">
                <label className="text-[10px] font-bold text-blue-900 uppercase tracking-wider flex items-center justify-between">
                  <span>Switch Supplier To Edit</span>
                  <span className="text-[10px] font-semibold text-blue-700 font-mono">ID: {editingVendor.VendorID}</span>
                </label>
                <select
                  value={editingVendor.VendorID || editingVendor._id}
                  onChange={(e) => {
                    const chosen = vendors.find(v => (v.VendorID === e.target.value || v._id === e.target.value));
                    if (chosen) handleOpenEditVendor(chosen);
                  }}
                  className="w-full p-2 bg-white border border-blue-300 rounded-lg text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
                >
                  {vendors.map(v => (
                    <option key={v.VendorID || v._id} value={v.VendorID || v._id}>
                      {v.VendorName} (ID: {v.VendorID}) {v.Phone ? `• 📞 ${v.Phone}` : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <form onSubmit={handleSaveVendor} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-1">
                  <label className="text-xxs font-bold text-slate-600 uppercase tracking-wide flex items-center justify-between">
                    <span>Supplier ID</span>
                    <span className="text-[9px] text-amber-700 bg-amber-100 px-1 py-0.5 rounded font-bold">Locked / Intact</span>
                  </label>
                  <div className="relative mt-1">
                    <input
                      type="text"
                      disabled
                      value={vendorForm.VendorID || (editingVendor ? editingVendor.VendorID : 'Auto Generated')}
                      title="Existing Supplier ID is kept strictly intact to preserve PO and ledger history"
                      className="w-full p-2.5 pl-7 border border-slate-200 bg-slate-100 text-slate-700 rounded-xl text-xs font-mono font-bold cursor-not-allowed select-none"
                    />
                    <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-3" />
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xxs font-bold text-slate-700 uppercase tracking-wide flex items-center justify-between">
                    <span>Vendor / Company Name <span className="text-rose-500">*</span></span>
                    {editingVendor && <span className="text-[10px] text-blue-600 font-semibold">Editable</span>}
                  </label>
                  <input
                    type="text"
                    required
                    value={vendorForm.VendorName || ''}
                    onChange={e => setVendorForm({ ...vendorForm, VendorName: e.target.value })}
                    placeholder="e.g. High-Tech Pharma Distributors Ltd"
                    className="w-full mt-1 p-2.5 border border-slate-300 bg-white rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none shadow-2xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xxs font-bold text-slate-700 uppercase tracking-wide">Contact Person / Rep</label>
                  <input
                    type="text"
                    value={vendorForm.ContactPerson || ''}
                    onChange={e => setVendorForm({ ...vendorForm, ContactPerson: e.target.value })}
                    placeholder="e.g. Mr. Tariq Mahmood"
                    className="w-full mt-1 p-2.5 border border-slate-200 bg-white rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="text-xxs font-bold text-slate-700 uppercase tracking-wide flex items-center justify-between">
                    <span>Mobile / Phone Number <span className="text-rose-500">*</span></span>
                    {editingVendor && <span className="text-[10px] text-blue-600 font-semibold">Editable</span>}
                  </label>
                  <div className="relative mt-1">
                    <input
                      type="text"
                      required
                      value={vendorForm.Phone || ''}
                      onChange={e => setVendorForm({ ...vendorForm, Phone: e.target.value })}
                      placeholder="e.g. 0300-1234567 / 042-35889900"
                      className="w-full p-2.5 pl-8 border border-slate-300 bg-white rounded-xl text-xs font-mono font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none shadow-2xs"
                    />
                    <PhoneCall className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xxs font-bold text-slate-700 uppercase tracking-wide">Tax NTN ID</label>
                  <input
                    type="text"
                    value={vendorForm.TaxID || ''}
                    onChange={e => setVendorForm({ ...vendorForm, TaxID: e.target.value })}
                    placeholder="e.g. 1234567-8"
                    className="w-full mt-1 p-2.5 border border-slate-200 bg-white rounded-xl text-xs font-mono text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="text-xxs font-bold text-slate-700 uppercase tracking-wide">Email Address</label>
                  <input
                    type="email"
                    value={vendorForm.Email || ''}
                    onChange={e => setVendorForm({ ...vendorForm, Email: e.target.value })}
                    placeholder="e.g. sales@hightechpharma.pk"
                    className="w-full mt-1 p-2.5 border border-slate-200 bg-white rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xxs font-bold text-slate-700 uppercase tracking-wide">Corporate / Warehouse Address</label>
                <input
                  type="text"
                  value={vendorForm.Address || ''}
                  onChange={e => setVendorForm({ ...vendorForm, Address: e.target.value })}
                  placeholder="e.g. Plot 14-B, Industrial Area, Kot Lakhpat, Lahore"
                  className="w-full mt-1 p-2.5 border border-slate-200 bg-white rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xxs font-bold text-slate-700 uppercase tracking-wide">Account Status</label>
                  <select
                    value={vendorForm.Status || 'Active'}
                    onChange={e => setVendorForm({ ...vendorForm, Status: e.target.value as any })}
                    className="w-full mt-1 p-2.5 border border-slate-200 bg-white rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  >
                    <option value="Active">Active Supplier</option>
                    <option value="Inactive">Inactive / Suspended</option>
                  </select>
                </div>
                <div>
                  <label className="text-xxs font-bold text-slate-700 uppercase tracking-wide">Outstanding Balance (Rs.)</label>
                  <input
                    type="number"
                    value={vendorForm.Balance ?? 0}
                    onChange={e => setVendorForm({ ...vendorForm, Balance: Number(e.target.value) || 0 })}
                    placeholder="0"
                    className="w-full mt-1 p-2.5 border border-slate-200 bg-white rounded-xl text-xs font-mono font-bold text-amber-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowVendorModal(false);
                    setEditingVendor(null);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`px-5 py-2.5 rounded-xl text-white font-bold text-xs transition flex items-center space-x-2 cursor-pointer shadow-md disabled:opacity-50 ${
                    editingVendor
                      ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/20'
                      : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20'
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-white" />
                      <span>Saving Data...</span>
                    </>
                  ) : (
                    <>
                      {editingVendor ? <Pencil className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                      <span>{editingVendor ? 'Update Supplier Record' : 'Save Supplier'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* END OF RIGHT MAIN CONTENT AREA & SIDEBAR WRAPPER */}
        </div>
      </div>
      {showPoModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-5xl w-full p-6 shadow-xl border space-y-5 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-lg flex items-center space-x-2">
                  <ShoppingCart className="w-5 h-5 text-indigo-600" />
                  <span>Create Purchase Order & Stock Requisition</span>
                </h3>
                <p className="text-xs text-slate-500">Pick medicines directly from inventory stock list or auto-fill required stock quantities</p>
              </div>
              <button
                type="button"
                onClick={() => setShowPoModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreatePo} className="space-y-5">
              {/* TOP VENDOR & DATE SELECTOR */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <label className="text-xs font-bold text-slate-700">Select Supplier Vendor</label>
                  <select
                    required
                    value={poForm.VendorName}
                    onChange={e => {
                      const v = vendors.find(item => item.VendorName === e.target.value);
                      setPoForm({ ...poForm, VendorName: e.target.value, VendorID: v?.VendorID || '' });
                    }}
                    className="w-full mt-1 p-2 border rounded-xl text-xs bg-white font-bold text-slate-900"
                  >
                    <option value="">-- Choose Vendor / Supplier --</option>
                    {vendors.map((v, idx) => (
                      <option key={idx} value={v.VendorName}>{v.VendorName} ({v.VendorID})</option>
                    ))}
                    {vendors.length === 0 && <option value="High-Tech Pharma Distributors Ltd">High-Tech Pharma Distributors Ltd</option>}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700">Expected Delivery Date</label>
                  <input
                    type="date"
                    value={poForm.ExpectedDeliveryDate}
                    onChange={e => setPoForm({ ...poForm, ExpectedDeliveryDate: e.target.value })}
                    className="w-full mt-1 p-2 border rounded-xl text-xs bg-white font-bold text-slate-900"
                  />
                </div>
              </div>

              {/* GRID-VIEW MEDICINE STOCK PICKER */}
              <div className="border border-indigo-100 bg-indigo-50/40 rounded-2xl p-4 space-y-3">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                  <div>
                    <h4 className="text-xs font-extrabold text-indigo-900 uppercase tracking-wider flex items-center space-x-1.5">
                      <Boxes className="w-4 h-4 text-indigo-600" />
                      <span>Medicine Inventory & Required Stock Grid View</span>
                    </h4>
                    <p className="text-[11px] text-indigo-700">Click any medicine card to automatically calculate & add required stock to PO</p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => {
                        setBulkPoRawText('');
                        setBulkPoParsedItems([]);
                        setBulkPoFileError('');
                        setShowUploadBulkPoModal(true);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition shadow-xs flex items-center space-x-1 cursor-pointer"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                      <span>Upload Bulk PO</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleSelectAllLowStockMedicines}
                      className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs transition shadow-xs flex items-center space-x-1 cursor-pointer"
                      title="Auto-select all items where CStock <= MinStock"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>⚡ Auto-Select All Low Stock Items</span>
                    </button>
                    {poForm.Items.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setPoForm(prev => ({ ...prev, Items: [] }))}
                        className="px-2.5 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs cursor-pointer"
                      >
                        Clear List
                      </button>
                    )}
                  </div>
                </div>

                  {/* SEARCH & FILTERS */}
                  <div className="flex flex-col sm:flex-row items-center gap-2">
                    <div className="relative flex-1 w-full flex space-x-1.5">
                      <div className="relative flex-1">
                        <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Search medicine name, ID, category..."
                          value={medicineSearchTerm}
                          onChange={e => setMedicineSearchTerm(e.target.value)}
                          className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-medium"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowQrScannerModal(true)}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center space-x-1 shrink-0 cursor-pointer shadow-xs"
                      >
                        <QrCode className="w-3.5 h-3.5" />
                        <span>Scan QR</span>
                      </button>
                    </div>

                  {/* Medicine Category Dropdown Filter */}
                  <div className="w-full sm:w-auto">
                    <select
                      value={poCategoryFilter}
                      onChange={e => setPoCategoryFilter(e.target.value)}
                      className="w-full sm:w-auto py-1.5 px-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-indigo-900 cursor-pointer shadow-2xs"
                    >
                      <option value="all">🏷️ All Medicine Categories</option>
                      {medicineCategories.map((cat, idx) => (
                        <option key={idx} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center space-x-1 self-start sm:self-auto text-xs">
                    <button
                      type="button"
                      onClick={() => setMedicineFilterMode('all')}
                      className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                        medicineFilterMode === 'all' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 border'
                      }`}
                    >
                      All ({inventoryItems.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setMedicineFilterMode('lowStock')}
                      className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                        medicineFilterMode === 'lowStock' ? 'bg-amber-600 text-white' : 'bg-white text-slate-600 border'
                      }`}
                    >
                      Low Stock ({inventoryItems.filter(i => (i.CStock ?? 0) <= ((i.MinStock !== undefined && i.MinStock !== null) ? i.MinStock : 1)).length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setMedicineFilterMode('selected')}
                      className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                        medicineFilterMode === 'selected' ? 'bg-emerald-600 text-white' : 'bg-white text-slate-600 border'
                      }`}
                    >
                      Selected ({poForm.Items.length})
                    </button>
                  </div>
                </div>

                {/* MEDICINES GRID VIEW */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-[380px] overflow-y-auto p-1">
                  {inventoryItems
                    .filter(med => {
                      const itemName = String(med.ItemName || med.Name || med.title || '');
                      const itemId = String(med.ItemID || med.id || '');
                      const medCat = med.Category || (med.MedicineType === 'C' ? 'Clinical / Compounded' : med.MedicineType === 'P' ? 'Patent / Pre-packaged' : 'Tablet / Capsule');
                      const matchCategory = poCategoryFilter === 'all' || medCat.toLowerCase().includes(poCategoryFilter.toLowerCase());
                      const sTerm = medicineSearchTerm.toLowerCase().trim();
                      const matchSearch = !sTerm ||
                                          itemName.toLowerCase().includes(sTerm) ||
                                          itemId.toLowerCase().includes(sTerm) ||
                                          medCat.toLowerCase().includes(sTerm);
                      const cStock = med.CStock ?? med.Stock ?? 0;
                      const minStock = (med.MinStock !== undefined && med.MinStock !== null) ? med.MinStock : 1;
                      if (!matchSearch || !matchCategory) return false;
                      if (medicineFilterMode === 'lowStock') return cStock <= minStock;
                      if (medicineFilterMode === 'selected') return isMedicineSelectedInPo(med.ItemID || itemId, med.ItemName || itemName);
                      return true;
                    })
                    .map((med, idx) => {
                      const cStock = med.CStock ?? med.Stock ?? 0;
                      const minStock = (med.MinStock !== undefined && med.MinStock !== null) ? med.MinStock : 1;
                      const isLow = cStock <= minStock;
                      const reqQty = getRequiredQty(med);
                      const isSelected = isMedicineSelectedInPo(med.ItemID, med.ItemName);
                      const currentPoItem = poForm.Items.find(i => (i.ItemID && i.ItemID === med.ItemID) || i.ItemName === med.ItemName);
                      const medCat = med.Category || (med.MedicineType === 'C' ? 'Clinical / Compounded' : med.MedicineType === 'P' ? 'Patent / Pre-packaged' : 'Tablet / Capsule');

                      return (
                        <div
                          key={idx}
                          className={`p-3 rounded-xl border transition flex flex-col justify-between ${
                            isSelected
                              ? 'bg-emerald-50 border-emerald-300 ring-2 ring-emerald-400/40 shadow-xs'
                              : isLow
                              ? 'bg-amber-50/60 border-amber-200 hover:border-amber-400'
                              : 'bg-white border-slate-200 hover:border-indigo-300'
                          }`}
                        >
                          <div>
                            <div className="flex items-start justify-between gap-1">
                              <div>
                                <p className="font-bold text-xs text-slate-900 leading-tight">{med.ItemName}</p>
                                <p className="text-[10px] font-mono text-slate-500">{med.ItemID || 'ITM'}</p>
                              </div>
                              <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                isLow ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                              }`}>
                                {isLow ? 'LOW STOCK' : 'In Stock'}
                              </span>
                            </div>

                            {/* Medicine Category Badge */}
                            <div className="mt-1.5 flex items-center">
                              <span className="text-[9.5px] font-extrabold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-150 flex items-center space-x-1">
                                <span>🏷️</span>
                                <span>{medCat}</span>
                              </span>
                            </div>

                            <div className="mt-2 text-[11px] space-y-0.5 text-slate-600">
                              <div className="flex justify-between">
                                <span>Current Stock:</span>
                                <span className={`font-bold ${isLow ? 'text-amber-700' : 'text-slate-800'}`}>
                                  {cStock} {med.Unit || 'Tab'}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span>Required Demand:</span>
                                <span className="font-extrabold text-indigo-700 bg-indigo-100/60 px-1 rounded">
                                  +{reqQty} {med.Unit || 'Tab'}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex items-center justify-between gap-1">
                            {isSelected ? (
                              <div className="flex items-center justify-between w-full">
                                <span className="text-[10px] font-extrabold text-emerald-700 flex items-center">
                                  <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" />
                                  In PO List
                                </span>
                                <div className="flex items-center space-x-1">
                                  <label className="text-[10px] text-slate-500 font-bold">Qty:</label>
                                  <input
                                    type="number"
                                    min="1"
                                    value={currentPoItem?.Qty ?? reqQty}
                                    onChange={e => {
                                      const val = Math.max(1, Number(e.target.value));
                                      setPoForm(prev => ({
                                        ...prev,
                                        Items: prev.Items.map(i =>
                                          (i.ItemID === med.ItemID || i.ItemName === med.ItemName)
                                            ? { ...i, Qty: val }
                                            : i
                                        )
                                      }));
                                    }}
                                    className="w-14 p-0.5 text-center text-xs border rounded font-bold bg-white"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleToggleMedicineForPo(med)}
                                    className="text-[10px] text-rose-600 hover:text-rose-800 font-bold px-1 cursor-pointer"
                                    title="Remove from PO"
                                  >
                                    ✕
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleToggleMedicineForPo(med)}
                                className={`w-full py-1 rounded-lg text-xs font-bold transition flex items-center justify-center space-x-1 cursor-pointer ${
                                  isLow
                                    ? 'bg-amber-600 hover:bg-amber-700 text-white'
                                    : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700'
                                }`}
                              >
                                <Plus className="w-3.5 h-3.5" />
                                <span>Add to Requisition (+{reqQty})</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* REQUISITION ORDER SUMMARY TABLE */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Selected Order Items Requisition List ({poForm.Items.length} Items)
                  </label>
                  <button
                    type="button"
                    onClick={handleAddPoItem}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center space-x-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Custom Item Line</span>
                  </button>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
                        <th className="p-2.5 w-10 text-center">#</th>
                        <th className="p-2.5">Medicine Name</th>
                        <th className="p-2.5 w-44">Medicine Category</th>
                        <th className="p-2.5 w-36">Batch No. (Optional)</th>
                        <th className="p-2.5 w-32 text-center">Required Order Qty</th>
                        <th className="p-2.5 w-12 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {poForm.Items.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-6 text-center text-slate-400 font-medium">
                            No medicines selected yet. Choose items from the grid above or auto-select low stock items!
                          </td>
                        </tr>
                      ) : (
                        poForm.Items.map((item, idx) => {
                          return (
                            <tr key={idx} className="hover:bg-slate-50">
                              <td className="p-2.5 text-center font-bold text-slate-400 font-mono">
                                {idx + 1}
                              </td>
                              <td className="p-2 font-medium">
                                <input
                                  type="text"
                                  placeholder="Enter medicine name..."
                                  value={item.ItemName}
                                  onChange={e => handleUpdatePoItem(idx, 'ItemName', e.target.value)}
                                  className="w-full p-1.5 border rounded-lg text-xs font-bold text-slate-900 bg-white"
                                />
                              </td>
                              <td className="p-2">
                                <select
                                  value={item.Category || 'Tablet / Capsule'}
                                  onChange={e => handleUpdatePoItem(idx, 'Category', e.target.value)}
                                  className="w-full p-1.5 border rounded-lg text-xs font-bold text-indigo-900 bg-indigo-50/60 cursor-pointer"
                                >
                                  {medicineCategories.map((c, cIdx) => (
                                    <option key={cIdx} value={c}>{c}</option>
                                  ))}
                                </select>
                              </td>
                              <td className="p-2">
                                <input
                                  type="text"
                                  placeholder="Batch / Ref #"
                                  value={item.BatchNo || ''}
                                  onChange={e => handleUpdatePoItem(idx, 'BatchNo', e.target.value)}
                                  className="w-full p-1.5 border rounded-lg text-xs font-mono font-bold bg-amber-50/60 text-amber-900 text-center"
                                />
                              </td>
                              <td className="p-2 text-center">
                                <input
                                  type="number"
                                  min="1"
                                  placeholder="1"
                                  value={item.Qty}
                                  onChange={e => handleUpdatePoItem(idx, 'Qty', Math.max(1, Number(e.target.value)))}
                                  className="w-24 mx-auto p-1.5 border border-indigo-300 rounded-lg text-xs text-center font-black font-mono bg-indigo-50/40 text-indigo-950"
                                />
                              </td>
                              <td className="p-2 text-center">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setPoForm(prev => ({
                                      ...prev,
                                      Items: prev.Items.filter((_, i) => i !== idx)
                                    }));
                                  }}
                                  className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                                  title="Remove item"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* FOOTER & REQUISITION QUANTITY TOTAL */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-200">
                <div className="text-xs space-y-0.5">
                  <div className="flex items-center space-x-2">
                    <span className="text-slate-500 font-bold">Total Requisition Demand:</span>
                    <span className="text-sm font-black text-indigo-700 font-mono">
                      {poForm.Items.reduce((sum, i) => sum + (Number(i.Qty) || 0), 0).toLocaleString()} Units
                    </span>
                    <span className="text-slate-400 font-medium">({poForm.Items.length} Selected Medicines)</span>
                  </div>
                  <p className="text-[11px] text-slate-500 italic">
                    💡 Vendor invoice price, discounts, and challan numbers will be recorded during Goods Received Note (GRN) entry.
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowPoModal(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={poForm.Items.length === 0}
                    className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs transition shadow-sm flex items-center space-x-1.5 cursor-pointer"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    <span>Generate & Post Purchase Order</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* UPLOAD BULK PO POPUP MODAL (Paste or Upload Excel Bulk PO) */}
      {showUploadBulkPoModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-5xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 max-h-[92vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl font-bold">
                  <FileSpreadsheet className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">
                    Upload Bulk Purchase Order (Excel / Paste)
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Upload an Excel spreadsheet (.xlsx, .csv) or paste rows containing 3 columns: <span className="font-bold text-indigo-700">Item Name</span>, <span className="font-bold text-indigo-700">PO Quantity</span>, and <span className="font-bold text-indigo-700">Item Price</span>.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowUploadBulkPoModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold p-1 rounded-lg hover:bg-slate-100 cursor-pointer text-lg"
              >
                ✕
              </button>
            </div>

            {/* Error banner if any */}
            {bulkPoFileError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-bold flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{bulkPoFileError}</span>
              </div>
            )}

            {/* Main Split Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* Left Column: Dropzone & Paste Text Area (5 cols) */}
              <div className="lg:col-span-5 space-y-4">
                {/* Excel File Dropzone */}
                <div
                  onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); setBulkPoDragActive(true); }}
                  onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setBulkPoDragActive(true); }}
                  onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setBulkPoDragActive(false); }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setBulkPoDragActive(false);
                    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                      handleBulkPoExcelRead(e.dataTransfer.files[0]);
                    }
                  }}
                  onClick={() => bulkPoFileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition flex flex-col items-center justify-center space-y-2 ${
                    bulkPoDragActive
                      ? 'border-indigo-500 bg-indigo-50/80 scale-[0.99]'
                      : 'border-indigo-200 bg-indigo-50/30 hover:bg-indigo-50/70 hover:border-indigo-400'
                  }`}
                >
                  <input
                    ref={bulkPoFileInputRef}
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleBulkPoExcelRead(e.target.files[0]);
                      }
                    }}
                  />
                  <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-black text-slate-800 block">Drop Excel (.xlsx, .csv) File Here</span>
                    <span className="text-[10px] text-slate-500 block mt-0.5">or click to browse from device</span>
                  </div>
                </div>

                <div className="relative flex py-1 items-center">
                  <div className="flex-grow border-t border-slate-200"></div>
                  <span className="shrink mx-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">OR PASTE DATA BELOW</span>
                  <div className="flex-grow border-t border-slate-200"></div>
                </div>

                {/* Direct Paste Area */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700 flex items-center space-x-1">
                      <FileText className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Paste Raw Excel / Text Data</span>
                    </label>
                    <span className="text-[10px] text-slate-400">3 Cols: Name, Qty, Price</span>
                  </div>
                  <textarea
                    rows={7}
                    value={bulkPoRawText}
                    onChange={(e) => handleParseBulkPoText(e.target.value)}
                    placeholder={`Paste 3-column rows from Excel or Notepad:\nItem Name\tPO Quantity\tItem Price\nParacetamol 500mg\t100\t15\nAmoxicillin 250mg\t50\t45\nIbuprofen 400mg\t200\t25`}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Right Column: Parsed Items Preview & Summary (7 cols) */}
              <div className="lg:col-span-7 bg-slate-50/70 border border-slate-200 rounded-2xl p-4 flex flex-col justify-between space-y-3">
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <div>
                      <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                        Parsed PO Items Preview ({bulkPoParsedItems.length})
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        {bulkPoParsedItems.filter(i => i.isMatched).length} Matched in Inventory • {bulkPoParsedItems.filter(i => !i.isMatched).length} New / Unmatched
                      </p>
                    </div>

                    {bulkPoParsedItems.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setBulkPoParsedItems([]);
                          setBulkPoRawText('');
                        }}
                        className="text-[11px] font-bold text-rose-600 hover:text-rose-800 hover:underline cursor-pointer"
                      >
                        Clear Items
                      </button>
                    )}
                  </div>

                  {/* Summary Bar */}
                  {bulkPoParsedItems.length > 0 && (
                    <div className="grid grid-cols-3 gap-2 bg-white p-2.5 rounded-xl border border-slate-200 text-center shadow-2xs">
                      <div>
                        <span className="text-[10px] text-slate-500 block">Total Items</span>
                        <span className="text-xs font-black text-indigo-900">{bulkPoParsedItems.length}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block">Total Qty</span>
                        <span className="text-xs font-black text-amber-700">
                          {bulkPoParsedItems.reduce((acc, curr) => acc + (curr.Qty || 0), 0)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block">Est. Subtotal</span>
                        <span className="text-xs font-black text-emerald-700">
                          Rs. {bulkPoParsedItems.reduce((acc, curr) => acc + ((curr.Qty || 0) * (curr.UnitPrice || 0)), 0).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Items Scrollable Table */}
                  <div className="max-h-64 overflow-y-auto border border-slate-200 rounded-xl bg-white shadow-2xs">
                    {bulkPoParsedItems.length === 0 ? (
                      <div className="p-10 text-center text-slate-400 space-y-1">
                        <FileSpreadsheet className="w-8 h-8 mx-auto text-slate-300" />
                        <p className="text-xs font-bold text-slate-600">No items loaded yet</p>
                        <p className="text-[11px]">Upload an Excel spreadsheet or paste 3-column rows on the left to preview.</p>
                      </div>
                    ) : (
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-100 text-slate-700 text-[10px] uppercase font-extrabold sticky top-0 border-b border-slate-200">
                          <tr>
                            <th className="p-2 w-8 text-center">#</th>
                            <th className="p-2">Item Name</th>
                            <th className="p-2 w-20 text-center">Status</th>
                            <th className="p-2 w-16 text-center">Qty</th>
                            <th className="p-2 w-20 text-right">Price (Rs.)</th>
                            <th className="p-2 w-20 text-right">Total</th>
                            <th className="p-2 w-8 text-center"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {bulkPoParsedItems.map((item, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/80">
                              <td className="p-2 text-center text-[10px] text-slate-400 font-bold">{idx + 1}</td>
                              <td className="p-2">
                                <span className="font-bold text-slate-800 block text-xs">{item.ItemName}</span>
                                <span className="text-[10px] text-slate-400">{item.Category}</span>
                              </td>
                              <td className="p-2 text-center">
                                {item.isMatched ? (
                                  <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold text-[9px]">
                                    Matched
                                  </span>
                                ) : (
                                  <span className="px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded font-bold text-[9px]">
                                    New Item
                                  </span>
                                )}
                              </td>
                              <td className="p-2 text-center">
                                <input
                                  type="number"
                                  min="0"
                                  value={item.Qty}
                                  onChange={(e) => {
                                    const val = Number(e.target.value);
                                    setBulkPoParsedItems(prev => prev.map((it, i) => i === idx ? { ...it, Qty: val } : it));
                                  }}
                                  className="w-14 p-1 border border-slate-200 rounded text-center text-xs font-bold bg-white"
                                />
                              </td>
                              <td className="p-2 text-right">
                                <input
                                  type="number"
                                  min="0"
                                  value={item.UnitPrice}
                                  onChange={(e) => {
                                    const val = Number(e.target.value);
                                    setBulkPoParsedItems(prev => prev.map((it, i) => i === idx ? { ...it, UnitPrice: val } : it));
                                  }}
                                  className="w-16 p-1 border border-slate-200 rounded text-right text-xs font-bold bg-white"
                                />
                              </td>
                              <td className="p-2 text-right font-extrabold text-slate-900 text-xs">
                                Rs. {(item.Qty * item.UnitPrice).toLocaleString()}
                              </td>
                              <td className="p-2 text-center">
                                <button
                                  type="button"
                                  onClick={() => setBulkPoParsedItems(prev => prev.filter((_, i) => i !== idx))}
                                  className="text-slate-400 hover:text-rose-600 font-bold p-0.5 rounded cursor-pointer"
                                  title="Remove Item"
                                >
                                  ✕
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>

                {/* Modal Actions */}
                <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setShowUploadBulkPoModal(false)}
                    className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={bulkPoParsedItems.length === 0}
                    onClick={handleApplyBulkPoToForm}
                    className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-extrabold text-xs shadow-md transition flex items-center space-x-1.5 cursor-pointer"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    <span>Create Purchase Order ({bulkPoParsedItems.length} Items)</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CREATE / PROCESS GOODS RECEIVED NOTE (GRN) */}
      {showGrnModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-6 shadow-xl border space-y-5 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-lg flex items-center space-x-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span>Receive Goods & Approve GRN (Stock Inward)</span>
                </h3>
                <p className="text-xs text-slate-500">Enter or select Purchase Order (PO Number) to fetch items, verify received quantities, and add stock to inventory</p>
              </div>
              <button
                type="button"
                onClick={() => setShowGrnModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleApproveGrn} className="space-y-4">
              {/* PO SELECTOR & METADATA GRID */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Select Purchase Order (PO Number)</label>
                  <select
                    value={grnForm.POID}
                    onChange={e => handleSelectPoForGrn(e.target.value)}
                    className="w-full p-2 border rounded-xl text-xs font-mono font-bold bg-white text-indigo-700 border-indigo-200 focus:outline-hidden"
                  >
                    <option value="">-- Choose Purchase Order --</option>
                    {purchaseOrders.map((p, idx) => (
                      <option key={idx} value={p.POID}>
                        {p.POID} ({p.VendorName}) - {p.Status === 'Received' ? '✓ Fully Received' : p.Status === 'Partially Received' ? '⚡ Partially Received' : 'Pending Order'}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">GRN Number</label>
                  <input
                    type="text"
                    readOnly
                    value={grnForm.GRNID}
                    className="w-full p-2 border rounded-xl text-xs font-mono font-bold bg-slate-100 text-emerald-700"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Received Date</label>
                  <input
                    type="date"
                    required
                    value={grnForm.ReceivedDate}
                    onChange={e => setGrnForm({ ...grnForm, ReceivedDate: e.target.value })}
                    className="w-full p-2 border rounded-xl text-xs bg-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Supplier / Vendor</label>
                  <input
                    type="text"
                    readOnly
                    value={grnForm.VendorName || 'No Vendor Selected'}
                    className="w-full p-2 border rounded-xl text-xs font-bold bg-slate-100 text-slate-800"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Delivery Challan No.</label>
                  <input
                    type="text"
                    placeholder=""
                    value={grnForm.ChallanNo}
                    onChange={e => setGrnForm({ ...grnForm, ChallanNo: e.target.value })}
                    className="w-full p-2 border rounded-xl text-xs bg-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Supplier Invoice No.</label>
                  <input
                    type="text"
                    placeholder=""
                    value={grnForm.SupplierInvoiceNo}
                    onChange={e => setGrnForm({ ...grnForm, SupplierInvoiceNo: e.target.value })}
                    className="w-full p-2 border rounded-xl text-xs bg-white"
                  />
                </div>
              </div>

              {/* RECEIVED MEDICINES TABLE WITH PARTIAL DELIVERY COLUMNS */}
              <div className="space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    PO Order Items & Partial Batch Receiving ({grnForm.Items.length} Line Items)
                  </label>
                  <div className="flex items-center space-x-2">
                    {(() => {
                      const selectedPo = purchaseOrders.find(p => p.POID === grnForm.POID);
                      const pendingPoItems = selectedPo ? getPoItemsReceiptInfo(selectedPo) : [];
                      const fullCount = pendingPoItems.length;
                      if (fullCount > grnForm.Items.length) {
                        return (
                          <button
                            type="button"
                            onClick={handleResetGrnItems}
                            className="text-[11px] text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 px-2 py-0.5 rounded-md font-bold border border-indigo-200 transition flex items-center space-x-1 cursor-pointer"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>Restore Excluded Items ({fullCount - grnForm.Items.length} excluded)</span>
                          </button>
                        );
                      }
                      return null;
                    })()}
                    <span className="text-[11px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      Partial receiving supported: Excluded items remain pending in PO for next batch
                    </span>
                  </div>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden grn-summary-card">
                  <table className="w-full text-left text-xs grn-summary-table">
                    <thead>
                      <tr className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
                        <th className="p-2.5">Item ID</th>
                        <th className="p-2.5">Medicine Description</th>
                        <th className="p-2.5 text-center w-24">Batch No.</th>
                        <th className="p-2.5 text-center w-20">Ordered</th>
                        <th className="p-2.5 text-center w-20">Prev. Recv</th>
                        <th className="p-2.5 text-center w-20">Pending</th>
                        <th className="p-2.5 text-center w-24">Now Receiving</th>
                        <th className="p-2.5 text-right w-20 grn-unit-price">Unit Price</th>
                        <th className="p-2.5 text-right w-24 grn-subtotal">Subtotal</th>
                        <th className="p-2.5 text-center w-20 exclude-col">Exclude</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {grnForm.Items.length === 0 ? (
                        <tr>
                          <td colSpan={10} className="p-6 text-center text-slate-400 font-medium">
                            No items in current GRN batch. {grnForm.POID ? 'All items were excluded from this delivery.' : 'Please select a Purchase Order from above!'}
                            {grnForm.POID && (
                              <div className="mt-2">
                                <button
                                  type="button"
                                  onClick={handleResetGrnItems}
                                  className="text-xs text-indigo-600 underline font-bold"
                                >
                                  Click here to restore all PO items
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ) : (
                        grnForm.Items.map((item, idx) => {
                          const prevReceived = item.AlreadyReceivedQty || 0;
                          const pending = item.PendingQty ?? Math.max(0, item.OrderedQty - prevReceived);
                          const subtotal = (Number(item.ReceivedQty) || 0) * (Number(item.UnitPrice) || 0);

                          return (
                            <tr key={idx} className="hover:bg-slate-50">
                              <td className="p-2.5 font-mono text-slate-500 font-bold">{item.ItemID}</td>
                              <td className="p-2.5 font-bold text-slate-900">{item.ItemName}</td>
                              <td className="p-2.5 text-center">
                                <input
                                  type="text"
                                  placeholder=""
                                  value={item.BatchNo || ''}
                                  onChange={e => {
                                    const val = e.target.value;
                                    setGrnForm(prev => {
                                      const updated = [...prev.Items];
                                      updated[idx] = { ...updated[idx], BatchNo: val };
                                      return { ...prev, Items: updated };
                                    });
                                  }}
                                  className="w-22 p-1 border border-amber-200 rounded-lg text-xs text-center font-mono font-bold bg-amber-50 text-amber-900 focus:outline-hidden"
                                />
                              </td>
                              <td className="p-2.5 text-center font-bold text-slate-600">{item.OrderedQty}</td>
                              <td className="p-2.5 text-center font-bold text-indigo-600 bg-indigo-50/50">{prevReceived}</td>
                              <td className="p-2.5 text-center font-bold text-amber-700 bg-amber-50/50">{pending}</td>
                              <td className="p-2.5 text-center">
                                <input
                                  type="number"
                                  min="0"
                                  max={pending > 0 ? pending * 2 : 9999}
                                  value={item.ReceivedQty}
                                  onChange={e => {
                                    const val = Number(e.target.value);
                                    setGrnForm(prev => {
                                      const updated = [...prev.Items];
                                      updated[idx] = { ...updated[idx], ReceivedQty: val, LineTotal: val * updated[idx].UnitPrice };
                                      return { ...prev, Items: updated };
                                    });
                                  }}
                                  className="w-20 p-1 border border-emerald-300 rounded-lg text-xs text-center font-black bg-emerald-50 text-emerald-900 focus:outline-hidden"
                                />
                              </td>
                              <td className="p-2.5 text-right font-semibold text-slate-700 grn-unit-price">
                                <div className="flex items-center justify-end space-x-1">
                                  <span className="text-slate-400 font-bold">Rs.</span>
                                  <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={item.UnitPrice}
                                    onChange={e => {
                                      const val = Number(e.target.value);
                                      setGrnForm(prev => {
                                        const updated = [...prev.Items];
                                        updated[idx] = { ...updated[idx], UnitPrice: val, LineTotal: (updated[idx].ReceivedQty || 0) * val };
                                        return { ...prev, Items: updated };
                                      });
                                    }}
                                    className="w-20 p-1 border border-slate-300 rounded-lg text-xs text-right font-bold bg-white text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                                    title="Edit Unit Cost for Inward Stock"
                                  />
                                </div>
                              </td>
                              <td className="p-2.5 text-right font-bold text-slate-900 grn-subtotal">Rs. {subtotal.toLocaleString()}</td>
                              <td className="p-2.5 text-center exclude-col">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveGrnItem(idx)}
                                  title="Exclude medicine item from this GRN batch (will remain pending in PO for next batch)"
                                  className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-md text-[11px] font-bold transition inline-flex items-center space-x-1 cursor-pointer"
                                >
                                  <XCircle className="w-3.5 h-3.5 text-amber-600" />
                                  <span>Exclude</span>
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Verification / Quality Remarks</label>
                <input
                  type="text"
                  placeholder=""
                  value={grnForm.Remarks}
                  onChange={e => setGrnForm({ ...grnForm, Remarks: e.target.value })}
                  className="w-full p-2 border rounded-xl text-xs bg-white"
                />
              </div>

              {/* FOOTER & APPROVE BUTTON */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-200">
                <div className="text-sm">
                  <span className="text-slate-500 font-bold">Total GRN Inward Value: </span>
                  <span className="text-lg font-black text-emerald-700 ml-1">
                    Rs. {grnForm.Items.reduce((sum, i) => sum + (Number(i.ReceivedQty) * Number(i.UnitPrice)), 0).toLocaleString()}
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowGrnModal(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={grnForm.Items.length === 0 || !grnForm.POID}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs transition shadow-sm flex items-center space-x-1.5 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Approve GRN & Update Inventory Stock</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: LOG TRANSACTION */}
      {showTxnModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border space-y-4">
            <h3 className="font-bold text-slate-900 text-base">Log Financial Voucher</h3>
            <form onSubmit={handleAddTxn} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-slate-600">Type</label>
                  <select
                    value={txnForm.Type}
                    onChange={e => setTxnForm({ ...txnForm, Type: e.target.value as any })}
                    className="w-full mt-1 p-2 border rounded-xl text-xs bg-white"
                  >
                    <option value="Expense">Expense</option>
                    <option value="Income">Income</option>
                    <option value="VendorPayment">Vendor Payment</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600">Payment Method</label>
                  <select
                    value={txnForm.PaymentMethod}
                    onChange={e => setTxnForm({ ...txnForm, PaymentMethod: e.target.value as any })}
                    className="w-full mt-1 p-2 border rounded-xl text-xs bg-white"
                  >
                    <option value="Cash">Cash</option>
                    <option value="Bank">Bank Transfer</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>
              </div>

              {txnForm.Type === 'VendorPayment' && (
                <div className="space-y-3 bg-amber-50/70 p-3 rounded-xl border border-amber-200/80">
                  <div>
                    <label className="text-xs font-bold text-amber-900 block mb-1">Select Vendor / Supplier</label>
                    <select
                      value={txnForm.VendorName}
                      onChange={e => {
                        const v = vendors.find(item => item.VendorName === e.target.value);
                        setTxnForm({
                          ...txnForm,
                          VendorName: e.target.value,
                          VendorID: v?.VendorID || '',
                          Amount: v?.Balance || txnForm.Amount || 0
                        });
                      }}
                      className="w-full p-2 border rounded-xl text-xs bg-white font-bold text-slate-800 border-amber-300"
                    >
                      <option value="">-- Choose Vendor / Supplier --</option>
                      {vendors.map((v, idx) => (
                        <option key={idx} value={v.VendorName}>
                          {v.VendorName} (Outstanding: Rs. {v.Balance.toLocaleString()})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-amber-900 block mb-1">
                      Vendor Invoice Number / Bill No <span className="text-rose-600">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={txnForm.ReferenceNo || ''}
                      onChange={e => setTxnForm({ 
                        ...txnForm, 
                        ReferenceNo: e.target.value,
                        Description: e.target.value ? `Payment against Vendor Invoice #${e.target.value} for ${txnForm.VendorName || 'Vendor'}` : txnForm.Description
                      })}
                      placeholder=""
                      className="w-full p-2 border rounded-xl text-xs bg-white font-mono font-bold text-indigo-900 border-amber-300 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                    />

                    {(() => {
                      const matchingGrns = grns.filter(g => 
                        (txnForm.VendorID && g.VendorID === txnForm.VendorID) ||
                        (txnForm.VendorName && g.VendorName === txnForm.VendorName)
                      );
                      if (matchingGrns.length === 0) return null;

                      return (
                        <div className="mt-2">
                          <span className="text-[10px] font-bold text-amber-800 block mb-1">
                            Available GRNs/Invoices for this Vendor:
                          </span>
                          <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                            {matchingGrns.map((g, gIdx) => {
                              const invLabel = g.SupplierInvoiceNo || g.ChallanNo || g.GRNID;
                              return (
                                <button
                                  type="button"
                                  key={gIdx}
                                  onClick={() => setTxnForm({
                                    ...txnForm,
                                    ReferenceNo: invLabel,
                                    Amount: g.TotalAmount || txnForm.Amount || 0,
                                    Description: `Payment against Vendor Invoice #${invLabel} (${g.GRNID})`
                                  })}
                                  className="text-[10px] px-2 py-1 bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg font-mono font-bold transition cursor-pointer"
                                >
                                  #{invLabel} (Rs. {(g.TotalAmount || 0).toLocaleString()})
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-slate-600">Category Name</label>
                <input
                  type="text"
                  required
                  value={txnForm.Category}
                  onChange={e => setTxnForm({ ...txnForm, Category: e.target.value })}
                  placeholder=""
                  className="w-full mt-1 p-2 border rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600">Amount (Rs.)</label>
                <input
                  type="number"
                  required
                  value={txnForm.Amount || ''}
                  onChange={e => setTxnForm({ ...txnForm, Amount: Number(e.target.value) })}
                  placeholder=""
                  className="w-full mt-1 p-2 border rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600">Description</label>
                <input
                  type="text"
                  value={txnForm.Description}
                  onChange={e => setTxnForm({ ...txnForm, Description: e.target.value })}
                  placeholder=""
                  className="w-full mt-1 p-2 border rounded-xl text-xs"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowTxnModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs"
                >
                  Post Voucher
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD EMPLOYEE */}
      {showEmpModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border space-y-4">
            <h3 className="font-bold text-slate-900 text-base">Add Staff Employee Profile</h3>
            <form onSubmit={handleAddEmployee} className="space-y-3">
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
      )}

      {/* MODAL: PROCESS PAYROLL */}
      {showPayrollModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border space-y-4">
            <h3 className="font-bold text-slate-900 text-base">Process Monthly Staff Salary Payroll</h3>
            <form onSubmit={handleProcessPayroll} className="space-y-3">
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
                    <option key={idx} value={emp.EmployeeID}>{emp.FullName} ({emp.Role}) - Rs. {emp.Salary.toLocaleString()}</option>
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
      )}

      {/* MODAL: ADD EXPENSE */}
      {showExpenseModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-base">Record Operational Expense</h3>
              <button
                type="button"
                onClick={() => {
                  setShowExpenseModal(false);
                  setShowAddCategoryInput(false);
                  setNewCategoryName('');
                }}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddExpense} className="space-y-3">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700">Categories (Grid View)</label>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddCategoryInput(!showAddCategoryInput);
                      setEditingCategoryName(null);
                      setNewCategoryName('');
                    }}
                    className="text-[11px] font-extrabold text-indigo-600 hover:text-indigo-800 flex items-center space-x-1 cursor-pointer bg-indigo-50 hover:bg-indigo-100 px-2 py-0.5 rounded-lg border border-indigo-200 transition"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Category</span>
                  </button>
                </div>

                {/* Inline New Category Creation Input */}
                {showAddCategoryInput && (
                  <div className="p-2.5 bg-indigo-50/90 border border-indigo-200 rounded-xl space-y-2 animate-fadeIn">
                    <label className="text-[10px] font-extrabold text-indigo-900 uppercase tracking-wide block">
                      New Category Name
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        placeholder=""
                        className="flex-1 p-2 text-xs border border-indigo-300 rounded-lg bg-white font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleSaveNewCategory();
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={handleSaveNewCategory}
                        className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg transition cursor-pointer shadow-2xs whitespace-nowrap"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowAddCategoryInput(false);
                          setNewCategoryName('');
                        }}
                        className="px-2.5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-lg transition cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Inline Edit Category Input */}
                {editingCategoryName && (
                  <div className="p-2.5 bg-amber-50/90 border border-amber-300 rounded-xl space-y-2 animate-fadeIn">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-extrabold text-amber-900 uppercase tracking-wide block">
                        Edit Category: <span className="underline">{editingCategoryName}</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setEditingCategoryName(null)}
                        className="text-slate-400 hover:text-slate-600 p-0.5"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={editCategoryNewValue}
                        onChange={(e) => setEditCategoryNewValue(e.target.value)}
                        className="flex-1 p-2 text-xs border border-amber-300 rounded-lg bg-white font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleSaveEditedCategory();
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={handleSaveEditedCategory}
                        className="px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-lg transition cursor-pointer shadow-2xs whitespace-nowrap"
                      >
                        Update
                      </button>
                    </div>
                  </div>
                )}

                {/* Grid View of Categories */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-40 overflow-y-auto p-1.5 bg-slate-50 border border-slate-200 rounded-xl">
                  {allExpenseCategories.map((cat) => {
                    const isSelected = expenseForm.Category === cat;

                    return (
                      <div
                        key={cat}
                        onClick={() => setExpenseForm(prev => ({ ...prev, Category: cat }))}
                        className={`group p-2 rounded-lg border text-[11px] font-bold transition cursor-pointer flex items-center justify-between gap-1 select-none ${
                          isSelected
                            ? 'bg-indigo-600 text-white border-indigo-700 shadow-2xs'
                            : 'bg-white text-slate-800 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/60'
                        }`}
                      >
                        <span className="truncate flex-1">{cat}</span>

                        <div className="flex items-center space-x-0.5 shrink-0">
                          {isSelected && (
                            <CheckCircle2 className="w-3.5 h-3.5 text-white stroke-[2.5]" />
                          )}

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStartEditCategory(cat);
                            }}
                            title={`Edit ${cat}`}
                            className={`p-0.5 rounded transition cursor-pointer ${
                              isSelected
                                ? 'hover:bg-white/20 text-white/90 hover:text-white'
                                : 'hover:bg-slate-200 text-slate-400 hover:text-slate-700'
                            }`}
                          >
                            <Edit className="w-3 h-3" />
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm(`Delete category "${cat}"?`)) {
                                handleDeleteCategory(cat);
                              }
                            }}
                            title={`Delete ${cat}`}
                            className={`p-0.5 rounded transition cursor-pointer ${
                              isSelected
                                ? 'hover:bg-rose-500/80 text-white/90 hover:text-white'
                                : 'hover:bg-rose-100 text-slate-400 hover:text-rose-600'
                            }`}
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="pt-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                    Selected Category: <strong className="text-indigo-700">{expenseForm.Category}</strong>
                  </label>
                  <select
                    value={expenseForm.Category}
                    onChange={e => setExpenseForm({ ...expenseForm, Category: e.target.value })}
                    className="w-full mt-0.5 p-1.5 border rounded-lg text-xs bg-white font-bold focus:ring-2 focus:ring-indigo-500 text-slate-700"
                  >
                    {allExpenseCategories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600">Description</label>
                <input
                  type="text"
                  required
                  value={expenseForm.Description}
                  onChange={e => setExpenseForm({ ...expenseForm, Description: e.target.value })}
                  placeholder=""
                  className="w-full mt-1 p-2 border rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600">Amount (Rs.)</label>
                <input
                  type="number"
                  required
                  value={expenseForm.Amount || ''}
                  onChange={e => setExpenseForm({ ...expenseForm, Amount: Number(e.target.value) })}
                  placeholder=""
                  className="w-full mt-1 p-2 border rounded-xl text-xs"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowExpenseModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs"
                >
                  Save Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD ASSET */}
      {showAssetModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border space-y-4">
            <h3 className="font-bold text-slate-900 text-base">Add Fixed Asset Record</h3>
            <form onSubmit={handleAddAsset} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-600">Asset Name</label>
                <input
                  type="text"
                  required
                  value={assetForm.AssetName}
                  onChange={e => setAssetForm({ ...assetForm, AssetName: e.target.value })}
                  placeholder=""
                  className="w-full mt-1 p-2 border rounded-xl text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-slate-600">Category</label>
                  <select
                    value={assetForm.Category}
                    onChange={e => setAssetForm({ ...assetForm, Category: e.target.value as any })}
                    className="w-full mt-1 p-2 border rounded-xl text-xs bg-white"
                  >
                    <option value="Equipment">Equipment</option>
                    <option value="IT Hardware">IT Hardware</option>
                    <option value="Furniture">Furniture</option>
                    <option value="Vehicle">Vehicle</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600">Purchase Cost (Rs.)</label>
                  <input
                    type="number"
                    required
                    value={assetForm.PurchaseCost || ''}
                    onChange={e => {
                      const val = Number(e.target.value);
                      setAssetForm({ ...assetForm, PurchaseCost: val, CurrentValue: val });
                    }}
                    placeholder=""
                    className="w-full mt-1 p-2 border rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAssetModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs"
                >
                  Save Fixed Asset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PRINTABLE VENDOR STATEMENT PREVIEW MODAL */}
      {vendorPrintModalOpen && selectedVendor && (
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
                const cPhone = clinicSettings?.PhoneMobile || '+92 300 1234567';
                const logoSrc = clinicSettings?.ClinicLogoImage || '/nhc_logo.svg';

                return (
                  <div className="border-b-2 border-slate-900 pb-3 mb-4 space-y-2">
                    <div className="flex items-center justify-between gap-4">
                      {/* Official Clinic Logo */}
                      <div className="w-16 h-16 shrink-0 flex items-center justify-center">
                        <img src={logoSrc} alt={cName} className="max-w-full max-h-full object-contain" />
                      </div>

                      {/* Center Branding */}
                      <div className="text-center flex-1">
                        <h1 className="text-xl sm:text-2xl font-black text-rose-950 uppercase tracking-tight font-serif leading-tight">
                          {cName}
                        </h1>
                        <p className="text-[10px] font-extrabold text-rose-800 tracking-widest uppercase mt-0.5">
                          {cTag}
                        </p>
                        <p className="text-[10px] text-slate-600 font-semibold mt-0.5">
                          📍 {cAddr} &nbsp;|&nbsp; 📞 {cPhone}
                        </p>
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
                      vendorStatement.statementRows.map((row, idx) => (
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
      )}

      {/* PAY VENDOR BILL POPUP MODAL */}
      {payVendorModalData && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-emerald-100 text-emerald-800 rounded-xl font-bold">
                  <Coins className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">Pay Vendor Bill & Clear Payable</h3>
                  <p className="text-xs text-slate-500">
                    Vendor: <strong className="text-slate-800">{payVendorModalData.vendor.VendorName}</strong> ({payVendorModalData.vendor.VendorID || 'N/A'})
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                <button
                  type="button"
                  onClick={() => {
                    setPoHistoryFilterPo(payVendorModalData.poId || payVendorModalData.invNo || 'ALL');
                    setPoHistoryModalData({
                      vendor: payVendorModalData.vendor,
                      poId: payVendorModalData.poId || payVendorModalData.invNo
                    });
                  }}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg shadow-xs transition flex items-center space-x-1.5 cursor-pointer"
                  title="View Payment History for P.O. in Grid View"
                >
                  <History className="w-4 h-4" />
                  <span>Payment History for P.O.</span>
                </button>
                <button
                  type="button"
                  onClick={() => handlePrintVendorStatement(payVendorModalData.vendor)}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-xs transition flex items-center space-x-1.5 cursor-pointer"
                  title="Print official Vendor Statement summary & bill history"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Vendor Statement</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPayVendorModalData(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* VENDOR FINANCIAL SUMMARY CARD (BASED ON GRN HISTORY & PAYMENTS) */}
            {(() => {
              const vVendor = payVendorModalData.vendor;
              const vName = (vVendor.VendorName || '').trim().toLowerCase();
              const vId = (vVendor.VendorID || vVendor._id || '').trim().toLowerCase();

              const vGrns = (grns || []).filter(g => {
                const sName = (g.SupplierName || g.VendorName || '').trim().toLowerCase();
                const sId = (g.SupplierID || g.VendorID || '').trim().toLowerCase();
                return (vName && sName === vName) || (vId && sId === vId) || (sName && vName.includes(sName));
              });

              const totalGrnBilled = vGrns.reduce((sum, g) => sum + Number(g.TotalAmount || 0), 0);
              const totalGrnsCount = vGrns.length;

              const vTxns = (transactions || []).filter(t => {
                const tVName = (t.VendorName || '').trim().toLowerCase();
                const tVId = (t.VendorID || '').trim().toLowerCase();
                const isVendorPay = t.Type === 'VendorPayment' || t.Category === 'Vendor Payment' || (t.Type === 'Expense' && tVName);
                return isVendorPay && ((vName && tVName === vName) || (vId && tVId === vId) || (tVName && vName.includes(tVName)));
              });

              const totalPaidToVendor = vTxns.reduce((sum, t) => sum + Number(t.Amount || 0), 0);
              const currentBalance = vVendor.Balance || 0;

              return (
                <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 text-white rounded-xl p-4 shadow-md space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-700/80 pb-2.5">
                    <div className="flex items-center space-x-2">
                      <div className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg border border-emerald-500/30">
                        <Coins className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-[11px] font-black uppercase tracking-wider text-emerald-400 block">Vendor Financial Summary</span>
                        <p className="text-[10px] text-slate-300">Based on verified GRN delivery records and payment logs</p>
                      </div>
                    </div>
                    <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full border ${
                      currentBalance > 0
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    }`}>
                      {currentBalance > 0 ? '● Outstanding Due' : '✓ Account Cleared'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* Card 1: Total Outstanding Payable */}
                    <div className="bg-white/10 backdrop-blur-xs border border-white/15 rounded-lg p-3 space-y-0.5">
                      <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider block">Total Outstanding Payable</span>
                      <div className="text-xl font-black font-mono text-emerald-400">
                        Rs. {currentBalance.toLocaleString()}
                      </div>
                      <span className="text-[9px] text-slate-400 block">Current Ledger Balance</span>
                    </div>

                    {/* Card 2: Total Billed from GRNs */}
                    <div className="bg-white/10 backdrop-blur-xs border border-white/15 rounded-lg p-3 space-y-0.5">
                      <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider block">Total GRN Purchases</span>
                      <div className="text-xl font-black font-mono text-amber-300">
                        Rs. {totalGrnBilled.toLocaleString()}
                      </div>
                      <span className="text-[9px] text-slate-400 block">{totalGrnsCount} Received {totalGrnsCount === 1 ? 'GRN' : 'GRNs'} Logged</span>
                    </div>

                    {/* Card 3: Total Payments Settled */}
                    <div className="bg-white/10 backdrop-blur-xs border border-white/15 rounded-lg p-3 space-y-0.5">
                      <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider block">Total Settled Payments</span>
                      <div className="text-xl font-black font-mono text-teal-300">
                        Rs. {totalPaidToVendor.toLocaleString()}
                      </div>
                      <span className="text-[9px] text-slate-400 block">{vTxns.length} Payment {vTxns.length === 1 ? 'Voucher' : 'Vouchers'}</span>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Purchase Orders & GRNs for this Vendor */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Boxes className="w-4 h-4 text-indigo-600" />
                  <span>Select Purchase Order / Invoice Number</span>
                </label>
                <span className="text-[11px] text-slate-500 italic">Click PO to auto-fill invoice & amount</span>
              </div>

              {(() => {
                const vPos = purchaseOrders.filter(po => 
                  (po.VendorID && po.VendorID === payVendorModalData.vendor.VendorID) || 
                  (po.VendorName && po.VendorName.toLowerCase() === payVendorModalData.vendor.VendorName.toLowerCase())
                );
                const vGrns = grns.filter(g => 
                  (g.VendorID && g.VendorID === payVendorModalData.vendor.VendorID) || 
                  (g.VendorName && g.VendorName.toLowerCase() === payVendorModalData.vendor.VendorName.toLowerCase())
                );

                if (vPos.length === 0 && vGrns.length === 0) {
                  return (
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500 font-medium text-center">
                      No prior Purchase Orders or GRNs logged for this vendor. Enter Supplier Invoice Number manually below.
                    </div>
                  );
                }

                return (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto p-1 bg-slate-50 border border-slate-200 rounded-xl">
                    {vPos.map((po, idx) => {
                      const matchGrn = vGrns.find(g => g.POID === po.POID);
                      const invStr = matchGrn?.SupplierInvoiceNo || po.POID;
                      const isSelected = payVendorModalData.invNo === invStr || payVendorModalData.poId === po.POID;

                      const poTotal = po.TotalAmount || 0;
                      const alreadyPaidForPo = transactions
                        .filter(t => 
                          (t.VendorID === payVendorModalData.vendor.VendorID || (t.VendorName && t.VendorName.toLowerCase() === payVendorModalData.vendor.VendorName.toLowerCase())) &&
                          t.Type === 'VendorPayment' &&
                          (t.ReferenceNo === po.POID || t.ReferenceNo === invStr || (t.Description && t.Description.includes(po.POID)))
                        )
                        .reduce((sum, t) => sum + Number(t.Amount || 0), 0);

                      const poOutstanding = Math.max(0, poTotal - alreadyPaidForPo);

                      return (
                        <button
                          key={po.POID || idx}
                          type="button"
                          onClick={() => {
                            setPayVendorModalData(prev => prev ? ({
                              ...prev,
                              invNo: invStr,
                              poId: po.POID,
                              amount: poOutstanding > 0 ? poOutstanding : poTotal,
                              description: `Payment against PO #${po.POID} (Invoice #${invStr}) for ${prev.vendor.VendorName}`
                            }) : null);
                          }}
                          className={`p-2.5 rounded-lg border text-left transition flex items-center justify-between cursor-pointer ${
                            isSelected
                              ? 'bg-indigo-50 border-indigo-500 ring-2 ring-indigo-200 text-indigo-950 font-bold'
                              : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-100/80 text-slate-700'
                          }`}
                        >
                          <div>
                            <div className="flex items-center space-x-1.5">
                              <span className="font-mono text-xs font-black text-indigo-700">P.O. #{po.POID}</span>
                              {matchGrn?.SupplierInvoiceNo && (
                                <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded border font-mono">
                                  Inv: {matchGrn.SupplierInvoiceNo}
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-500 mt-0.5">
                              Total: Rs. {poTotal.toLocaleString()} {alreadyPaidForPo > 0 && `| Paid: Rs. ${alreadyPaidForPo.toLocaleString()}`}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-[10px] text-slate-500 uppercase font-bold">Remaining</div>
                            <div className="text-xs font-black font-mono text-amber-800">Rs. {poOutstanding.toLocaleString()}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                );
              })()}
            </div>

            {/* Payment Form */}
            <form onSubmit={handleConfirmPayVendor} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1 block">
                    Vendor Invoice / Supplier Bill No <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder=""
                    value={payVendorModalData.invNo}
                    onChange={e => setPayVendorModalData({ ...payVendorModalData, invNo: e.target.value })}
                    className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-xl font-mono font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-700">
                      Payment Amount (PKR) <span className="text-rose-500">*</span>
                    </label>
                    
                    {/* Quick percentage calculation buttons based on selected PO balance or vendor balance */}
                    {(() => {
                      const vPos = purchaseOrders.filter(po => 
                        (po.VendorID && po.VendorID === payVendorModalData.vendor.VendorID) || 
                        (po.VendorName && po.VendorName.toLowerCase() === payVendorModalData.vendor.VendorName.toLowerCase())
                      );
                      const vGrns = grns.filter(g => 
                        (g.VendorID && g.VendorID === payVendorModalData.vendor.VendorID) || 
                        (g.VendorName && g.VendorName.toLowerCase() === payVendorModalData.vendor.VendorName.toLowerCase())
                      );
                      const selectedPo = vPos.find(p => p.POID === payVendorModalData.poId || p.POID === payVendorModalData.invNo);
                      
                      let maxAmt = payVendorModalData.vendor.Balance;
                      if (selectedPo) {
                        const poTotal = selectedPo.TotalAmount || 0;
                        const matchGrn = vGrns.find(g => g.POID === selectedPo.POID);
                        const invStr = matchGrn?.SupplierInvoiceNo || selectedPo.POID;
                        const alreadyPaid = transactions
                          .filter(t => 
                            (t.VendorID === payVendorModalData.vendor.VendorID || (t.VendorName && t.VendorName.toLowerCase() === payVendorModalData.vendor.VendorName.toLowerCase())) &&
                            t.Type === 'VendorPayment' &&
                            (t.ReferenceNo === selectedPo.POID || t.ReferenceNo === invStr || (t.Description && t.Description.includes(selectedPo.POID)))
                          )
                          .reduce((sum, t) => sum + Number(t.Amount || 0), 0);
                        const rem = Math.max(0, poTotal - alreadyPaid);
                        if (rem > 0) maxAmt = rem;
                      }

                      return (
                        <div className="flex items-center space-x-1">
                          {[25, 50, 75, 100].map(pct => {
                            const calculated = Math.round((maxAmt * pct) / 100);
                            return (
                              <button
                                key={pct}
                                type="button"
                                onClick={() => setPayVendorModalData({ ...payVendorModalData, amount: calculated })}
                                className="px-1.5 py-0.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[10px] font-black rounded border border-emerald-300 transition cursor-pointer"
                                title={`Set ${pct}% of balance (Rs. ${calculated.toLocaleString()})`}
                              >
                                {pct}%
                              </button>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>
                  <input
                    type="number"
                    required
                    min={1}
                    step="any"
                    placeholder=""
                    value={payVendorModalData.amount || ''}
                    onChange={e => setPayVendorModalData({ ...payVendorModalData, amount: Number(e.target.value) })}
                    className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-xl font-mono font-bold text-emerald-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1 block">Payment Method</label>
                  <select
                    value={payVendorModalData.paymentMethod}
                    onChange={e => setPayVendorModalData({ ...payVendorModalData, paymentMethod: e.target.value as any })}
                    className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-xl font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="Cash">Cash</option>
                    <option value="Bank">Bank Transfer / Online</option>
                    <option value="Cheque">Cheque</option>
                    <option value="Online">Online Gateway</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1 block">Payment Date</label>
                  <input
                    type="date"
                    required
                    value={payVendorModalData.date}
                    onChange={e => setPayVendorModalData({ ...payVendorModalData, date: e.target.value })}
                    className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 mb-1 block">Payment Description / Notes</label>
                <input
                  type="text"
                  placeholder=""
                  value={payVendorModalData.description}
                  onChange={e => setPayVendorModalData({ ...payVendorModalData, description: e.target.value })}
                  className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              {/* LIVE PO & PAYABLE CALCULATION BREAKDOWN */}
              {(() => {
                const vPos = purchaseOrders.filter(po => 
                  (po.VendorID && po.VendorID === payVendorModalData.vendor.VendorID) || 
                  (po.VendorName && po.VendorName.toLowerCase() === payVendorModalData.vendor.VendorName.toLowerCase())
                );
                const vGrns = grns.filter(g => 
                  (g.VendorID && g.VendorID === payVendorModalData.vendor.VendorID) || 
                  (g.VendorName && g.VendorName.toLowerCase() === payVendorModalData.vendor.VendorName.toLowerCase())
                );
                
                const selectedPo = vPos.find(p => p.POID === payVendorModalData.poId || p.POID === payVendorModalData.invNo);
                
                let poTotal = 0;
                let poPaid = 0;
                let poOutstandingBefore = 0;

                if (selectedPo) {
                  poTotal = selectedPo.TotalAmount || 0;
                  const matchGrn = vGrns.find(g => g.POID === selectedPo.POID);
                  const invStr = matchGrn?.SupplierInvoiceNo || selectedPo.POID;
                  poPaid = transactions
                    .filter(t => 
                      (t.VendorID === payVendorModalData.vendor.VendorID || (t.VendorName && t.VendorName.toLowerCase() === payVendorModalData.vendor.VendorName.toLowerCase())) &&
                      t.Type === 'VendorPayment' &&
                      (t.ReferenceNo === selectedPo.POID || t.ReferenceNo === invStr || (t.Description && t.Description.includes(selectedPo.POID)))
                    )
                    .reduce((sum, t) => sum + Number(t.Amount || 0), 0);
                  poOutstandingBefore = Math.max(0, poTotal - poPaid);
                } else {
                  poTotal = payVendorModalData.vendor.Balance;
                  poOutstandingBefore = payVendorModalData.vendor.Balance;
                }

                const payingAmt = Number(payVendorModalData.amount || 0);
                const poResidualAfter = Math.max(0, poOutstandingBefore - payingAmt);
                const vendorPayableAfter = Math.max(0, payVendorModalData.vendor.Balance - payingAmt);

                return (
                  <div className="bg-slate-900 text-white rounded-xl p-3.5 space-y-2.5 border border-slate-800 shadow-inner">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <div className="flex items-center space-x-2">
                        <Calculator className="w-4 h-4 text-emerald-400" />
                        <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                          {selectedPo ? `P.O. #${selectedPo.POID} Payment Breakdown` : 'Vendor Payable Breakdown'}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                        Automatic Adjustment
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      <div className="bg-slate-800/60 p-2 rounded-lg border border-slate-700/60">
                        <span className="text-slate-400 text-[10px] uppercase font-semibold block">Total PO Bill</span>
                        <span className="font-mono font-bold text-slate-100">
                          Rs. {poTotal.toLocaleString()}
                        </span>
                      </div>

                      <div className="bg-slate-800/60 p-2 rounded-lg border border-slate-700/60">
                        <span className="text-slate-400 text-[10px] uppercase font-semibold block">Already Settled</span>
                        <span className="font-mono font-bold text-emerald-400">
                          Rs. {poPaid.toLocaleString()}
                        </span>
                      </div>

                      <div className="bg-slate-800/60 p-2 rounded-lg border border-slate-700/60">
                        <span className="text-slate-400 text-[10px] uppercase font-semibold block">Paying Now</span>
                        <span className="font-mono font-black text-amber-400">
                          - Rs. {payingAmt.toLocaleString()}
                        </span>
                      </div>

                      <div className="bg-slate-800/60 p-2 rounded-lg border border-slate-700/60">
                        <span className="text-slate-400 text-[10px] uppercase font-bold block">
                          {selectedPo ? 'Residual PO Balance' : 'Payable Remaining'}
                        </span>
                        <span className={`font-mono font-black ${poResidualAfter === 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                          Rs. {poResidualAfter.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <div className="text-[11px] text-slate-300 bg-slate-800/90 p-2 rounded-lg border border-slate-700/80 flex items-center justify-between">
                      <span className="font-medium">Total Vendor Payable After This Payment:</span>
                      <strong className="font-mono text-emerald-400 font-black text-xs">
                        Rs. {vendorPayableAfter.toLocaleString()}
                      </strong>
                    </div>
                  </div>
                );
              })()}

              {/* Modal Buttons */}
              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setPayVendorModalData(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-100 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition flex items-center space-x-2 cursor-pointer disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirm & Post Vendor Payment</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VENDOR PURCHASE ORDERS MODAL */}
      {vendorPoModalData && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-indigo-100 text-indigo-800 rounded-xl font-bold">
                  <Boxes className="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">
                    Purchase Orders — {vendorPoModalData.VendorName}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Vendor Code: <strong className="text-slate-800">{vendorPoModalData.VendorID || 'N/A'}</strong> | Contact: {vendorPoModalData.Phone || 'N/A'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setVendorPoModalData(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {(() => {
              const vPos = purchaseOrders.filter(po => 
                (po.VendorID && po.VendorID === vendorPoModalData.VendorID) || 
                (po.VendorName && po.VendorName.toLowerCase() === vendorPoModalData.VendorName.toLowerCase())
              );

              if (vPos.length === 0) {
                return (
                  <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-300 rounded-2xl space-y-3">
                    <Boxes className="w-10 h-10 text-slate-300 mx-auto" />
                    <div className="text-slate-700 font-bold text-sm">No Purchase Orders Found</div>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      No official purchase orders have been created for {vendorPoModalData.VendorName} yet.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setVendorPoModalData(null);
                        setPoForm(prev => ({
                          ...prev,
                          VendorID: vendorPoModalData.VendorID || '',
                          VendorName: vendorPoModalData.VendorName || ''
                        }));
                        setShowPoModal(true);
                      }}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition inline-flex items-center space-x-1.5 shadow-xs cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Create New PO for this Vendor</span>
                    </button>
                  </div>
                );
              }

              const totalValue = vPos.reduce((acc, p) => acc + (p.TotalAmount || 0), 0);

              return (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-slate-50 border border-slate-200 rounded-xl p-3 gap-2">
                    <div className="text-xs font-bold text-slate-700">
                      Total Purchase Orders: <span className="text-indigo-700 font-black">{vPos.length} Orders</span>
                    </div>
                    <div className="text-xs font-bold text-slate-700">
                      Total Orders Value: <span className="text-emerald-700 font-mono font-black">Rs. {totalValue.toLocaleString()}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setVendorPoModalData(null);
                        setPoForm(prev => ({
                          ...prev,
                          VendorID: vendorPoModalData.VendorID || '',
                          VendorName: vendorPoModalData.VendorName || ''
                        }));
                        setShowPoModal(true);
                      }}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg transition inline-flex items-center space-x-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>New PO</span>
                    </button>
                  </div>

                  <div className="overflow-x-auto border border-slate-200 rounded-xl">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="bg-slate-100 text-slate-700 font-extrabold uppercase text-[10px] tracking-wider">
                          <th className="p-3">PO Ref No</th>
                          <th className="p-3">Order Date</th>
                          <th className="p-3">Expected Delivery</th>
                          <th className="p-3 text-center">Items Count</th>
                          <th className="p-3 text-right">Total Amount</th>
                          <th className="p-3 text-center">Status</th>
                          <th className="p-3 text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        {vPos.map((po, idx) => (
                          <tr key={po.POID || idx} className="hover:bg-slate-50 transition">
                            <td className="p-3 font-mono font-bold text-indigo-700">{po.POID}</td>
                            <td className="p-3 text-slate-600">{po.OrderDate}</td>
                            <td className="p-3 text-slate-600">{po.ExpectedDeliveryDate || 'Immediate'}</td>
                            <td className="p-3 text-center font-bold text-slate-700">
                              {po.Items?.length || 0} items
                            </td>
                            <td className="p-3 text-right font-mono font-bold text-slate-900">
                              Rs. {(po.TotalAmount || 0).toLocaleString()}
                            </td>
                            <td className="p-3 text-center">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                po.Status === 'Received'
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                  : po.Status === 'Partially Received'
                                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                  : 'bg-indigo-100 text-indigo-900 border border-indigo-300'
                              }`}>
                                {po.Status || 'Pending'}
                              </span>
                            </td>
                            <td className="p-3 text-center">
                              <div className="flex items-center justify-center space-x-1.5">
                                <button
                                  type="button"
                                  onClick={() => handlePrintPo(po)}
                                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded border border-slate-300 transition cursor-pointer flex items-center space-x-1"
                                  title="Print Official PO"
                                >
                                  <Printer className="w-3 h-3 text-slate-600" />
                                  <span>Print</span>
                                </button>
                                {po.Status !== 'Received' && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setVendorPoModalData(null);
                                      handleOpenGrnForPo(po);
                                    }}
                                    className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold rounded border border-emerald-200 transition cursor-pointer flex items-center space-x-1"
                                    title="Process Goods Received Note (GRN)"
                                  >
                                    <PackageCheck className="w-3 h-3 text-emerald-600" />
                                    <span>GRN</span>
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })()}

            <div className="flex items-center justify-end pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setVendorPoModalData(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
              >
                Close Window
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PAYMENT HISTORY FOR P.O. POPUP MODAL (GRID-VIEW) */}
      {poHistoryModalData && (() => {
        const vVendor = poHistoryModalData.vendor;
        const vPos = purchaseOrders.filter(po => 
          (po.VendorID && po.VendorID === vVendor.VendorID) || 
          (po.VendorName && po.VendorName.toLowerCase() === vVendor.VendorName.toLowerCase())
        );
        const vGrns = grns.filter(g => 
          (g.VendorID && g.VendorID === vVendor.VendorID) || 
          (g.VendorName && g.VendorName.toLowerCase() === vVendor.VendorName.toLowerCase())
        );

        const activePoObj = vPos.find(p => p.POID === poHistoryFilterPo);

        const poPaymentTxns = transactions.filter(t => {
          const isVendorMatch = (t.VendorID === vVendor.VendorID) || 
                                (t.VendorName && t.VendorName.toLowerCase() === vVendor.VendorName.toLowerCase());
          const isPay = t.Type === 'VendorPayment' || t.Category === 'Vendor Payment' || (t.Type === 'Expense' && t.VendorName);
          if (!isVendorMatch || !isPay) return false;

          if (poHistoryFilterPo !== 'ALL') {
            const matchGrn = vGrns.find(g => g.POID === poHistoryFilterPo);
            const invStr = matchGrn?.SupplierInvoiceNo || poHistoryFilterPo;
            return (t.ReferenceNo === poHistoryFilterPo || t.ReferenceNo === invStr || (t.Description && t.Description.includes(poHistoryFilterPo)));
          }
          return true;
        });

        const totalPaidInHistory = poPaymentTxns.reduce((sum, t) => sum + Number(t.Amount || 0), 0);
        let totalPoCost = 0;
        if (activePoObj) {
          totalPoCost = Number(activePoObj.TotalAmount || 0);
        } else {
          totalPoCost = vPos.reduce((sum, p) => sum + Number(p.TotalAmount || 0), 0);
        }
        const remainingPoBalance = Math.max(0, totalPoCost - totalPaidInHistory);

        return (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto animate-fadeIn">
            <div className="bg-white rounded-2xl max-w-5xl w-full p-6 space-y-5 shadow-2xl border border-slate-200 my-8 max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-4 gap-3">
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-amber-500 text-white rounded-xl shadow-xs">
                    <History className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 text-lg">
                      {poHistoryFilterPo !== 'ALL' ? `Payment History for P.O. #${poHistoryFilterPo}` : `P.O. Payment History & Clearing`}
                    </h3>
                    <p className="text-xs text-slate-500">
                      Vendor: <strong className="text-slate-800">{vVendor.VendorName}</strong> ({vVendor.VendorID || 'N/A'})
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                  <button
                    type="button"
                    onClick={() => handlePrintVendorStatement(vVendor)}
                    className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center space-x-1.5 cursor-pointer"
                    title="Print Official Vendor Statement (A4)"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Print Vendor Statement</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPoHistoryModalData(null)}
                    className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* PO Selection & Filter Bar */}
              <div className="bg-amber-50/70 p-3.5 rounded-xl border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center space-x-2 w-full sm:w-auto">
                  <label className="font-extrabold text-amber-950 uppercase tracking-wider text-[11px] whitespace-nowrap flex items-center gap-1">
                    <Boxes className="w-4 h-4 text-amber-700" />
                    <span>Select Purchase Order:</span>
                  </label>
                  <select
                    value={poHistoryFilterPo}
                    onChange={(e) => setPoHistoryFilterPo(e.target.value)}
                    className="p-2 bg-white border border-amber-300 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-2xs cursor-pointer w-full sm:w-auto min-w-[220px]"
                  >
                    <option value="ALL">All Purchase Orders ({vPos.length} POs)</option>
                    {vPos.map((po, idx) => (
                      <option key={po.POID || idx} value={po.POID}>
                        P.O. #{po.POID} - Total: Rs. {Number(po.TotalAmount || 0).toLocaleString()} ({po.Status || 'Active'})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center space-x-2 text-[11px] text-amber-900 font-bold">
                  <span className="bg-white/90 px-3 py-1 rounded-lg border border-amber-200 shadow-2xs">
                    {poPaymentTxns.length} Payment {poPaymentTxns.length === 1 ? 'Voucher' : 'Vouchers'} Found
                  </span>
                </div>
              </div>

              {/* Summary Metrics Banner */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-slate-900 text-white rounded-xl p-3.5 shadow-sm space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    {activePoObj ? `P.O. #${activePoObj.POID} Total Cost` : `Total Vendor PO Cost`}
                  </span>
                  <div className="text-xl font-black font-mono text-amber-300">
                    Rs. {totalPoCost.toLocaleString()}
                  </div>
                  <span className="text-[10px] text-slate-400 block">{vPos.length} Purchase Orders Logged</span>
                </div>

                <div className="bg-emerald-900 text-white rounded-xl p-3.5 shadow-sm space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300 block">Total Payments Paid</span>
                  <div className="text-xl font-black font-mono text-emerald-200">
                    Rs. {totalPaidInHistory.toLocaleString()}
                  </div>
                  <span className="text-[10px] text-emerald-300 block">{poPaymentTxns.length} Settled Payment Transactions</span>
                </div>

                <div className="bg-amber-900 text-white rounded-xl p-3.5 shadow-sm space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300 block">Remaining Due Balance</span>
                  <div className="text-xl font-black font-mono text-amber-200">
                    Rs. {remainingPoBalance.toLocaleString()}
                  </div>
                  <span className="text-[10px] text-amber-300 block">{remainingPoBalance === 0 ? '✓ Fully Cleared' : '● Outstanding Payable'}</span>
                </div>
              </div>

              {/* GRID-VIEW CARDS DISPLAY */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-emerald-600" />
                    <span>Payment History Grid View</span>
                  </h4>
                  <span className="text-[11px] text-slate-500 italic">Individual payment receipts & voucher cards</span>
                </div>

                {poPaymentTxns.length === 0 ? (
                  <div className="p-10 text-center bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                    <History className="w-10 h-10 text-slate-300 mx-auto" />
                    <p className="text-slate-600 text-xs font-bold">
                      No payment history recorded for {poHistoryFilterPo !== 'ALL' ? `P.O. #${poHistoryFilterPo}` : 'this vendor'} yet.
                    </p>
                    <p className="text-slate-400 text-[11px]">
                      Payments logged using "Pay Vendor Bill" will appear here in this grid view.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                    {poPaymentTxns.map((pt, idx) => (
                      <div 
                        key={pt.TransactionID || pt._id || idx}
                        className="bg-white border border-slate-200 hover:border-emerald-400 rounded-xl p-4 shadow-xs hover:shadow-md transition space-y-3 flex flex-col justify-between relative group"
                      >
                        <div className="space-y-2">
                          {/* Card Header */}
                          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                            <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                              {pt.Date || pt.TransactionDate || 'N/A'}
                            </span>
                            <span className="text-[10px] font-mono font-black text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                              #{pt.TransactionID || pt.ReferenceNo || 'PAY-VOUCHER'}
                            </span>
                          </div>

                          {/* Amount Paid */}
                          <div>
                            <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block">Amount Paid</span>
                            <div className="text-lg font-black font-mono text-emerald-700">
                              Rs. {Number(pt.Amount || 0).toLocaleString()}
                            </div>
                          </div>

                          {/* Mode & Ref Info */}
                          <div className="flex items-center space-x-2 text-[11px]">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                              {pt.PaymentMethod || 'Cash'}
                            </span>
                            <span className="text-slate-500 text-[10px] truncate max-w-[140px]" title={pt.ReferenceNo}>
                              Ref: {pt.ReferenceNo || 'N/A'}
                            </span>
                          </div>

                          {/* Description */}
                          <div className="bg-slate-50 p-2 rounded-lg text-[11px] text-slate-600 border border-slate-100 italic line-clamp-2">
                            "{pt.Description || 'Vendor bill settlement payment'}"
                          </div>
                        </div>

                        {/* Footer Action */}
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                          <span className="text-[10px] text-slate-400 font-medium">Verified Payment Log</span>
                          <button
                            type="button"
                            onClick={() => handlePrintSinglePaymentVoucher(pt, vVendor)}
                            className="px-2.5 py-1 text-[11px] font-bold text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded-lg transition flex items-center space-x-1 cursor-pointer shadow-2xs"
                            title="Print Payment Voucher Receipt"
                          >
                            <Printer className="w-3.5 h-3.5 text-amber-700" />
                            <span>Print Voucher</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-200 text-xs">
                <span className="text-slate-500 font-medium">
                  Showing payment records for {vVendor.VendorName}
                </span>
                <button
                  type="button"
                  onClick={() => setPoHistoryModalData(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl transition cursor-pointer"
                >
                  Close Window
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* VENDOR PAYMENT & SETTLEMENT HISTORY STANDALONE MODAL */}
      {showPaymentHistoryModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-5xl w-full p-6 space-y-5 shadow-2xl border border-slate-200 my-8">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-amber-100 text-amber-800 rounded-xl">
                  <History className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">Vendor Payment & Settlement History</h3>
                  <p className="text-xs text-slate-500">View complete accounts payable settlement logs & payment vouchers</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPaymentHistoryModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Filter Toolbar */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center space-x-3 flex-wrap gap-y-2">
                <div className="flex items-center space-x-1.5">
                  <label className="font-bold text-slate-700 flex items-center space-x-1">
                    <Building2 className="w-3.5 h-3.5 text-slate-500" />
                    <span>Vendor:</span>
                  </label>
                  <select
                    value={historyVendorFilter}
                    onChange={(e) => setHistoryVendorFilter(e.target.value)}
                    className="p-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="ALL">All Vendors / Distributors ({vendors.length})</option>
                    {vendors.map((v) => (
                      <option key={v.VendorID || v._id} value={v.VendorName}>
                        {v.VendorName} ({v.VendorID})
                      </option>
                    ))}
                  </select>
                </div>

                <span className="text-slate-300 font-bold hidden sm:inline">|</span>

                <div className="flex items-center space-x-1.5">
                  <label className="font-bold text-slate-700 flex items-center space-x-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    <span>Dates:</span>
                  </label>
                  <input
                    type="date"
                    value={historyStartDate}
                    onChange={(e) => setHistoryStartDate(e.target.value)}
                    className="p-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono text-slate-800 focus:outline-none"
                  />
                  <span className="text-slate-400 font-bold">to</span>
                  <input
                    type="date"
                    value={historyEndDate}
                    onChange={(e) => setHistoryEndDate(e.target.value)}
                    className="p-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono text-slate-800 focus:outline-none"
                  />
                </div>
              </div>

              {/* Presets */}
              <div className="flex items-center space-x-1">
                {(historyStartDate || historyEndDate || historyVendorFilter !== 'ALL') && (
                  <button
                    type="button"
                    onClick={() => { setHistoryStartDate(''); setHistoryEndDate(''); setHistoryVendorFilter('ALL'); }}
                    className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg text-[11px] font-bold text-slate-700 transition cursor-pointer"
                  >
                    Reset Filters
                  </button>
                )}
              </div>
            </div>

            {/* Payment Transactions Table */}
            {(() => {
              const paymentTxns = transactions.filter(t => {
                if (t.Type !== 'VendorPayment') return false;
                if (historyVendorFilter !== 'ALL') {
                  const vMatch = (t.VendorName && t.VendorName.trim().toLowerCase() === historyVendorFilter.trim().toLowerCase()) ||
                                 (t.VendorID && t.VendorID === historyVendorFilter);
                  if (!vMatch) return false;
                }
                const tDate = t.Date || t.TransactionDate || '';
                if (historyStartDate && tDate < historyStartDate) return false;
                if (historyEndDate && tDate > historyEndDate) return false;
                return true;
              });

              const totalPaidAmount = paymentTxns.reduce((sum, t) => sum + Number(t.Amount || 0), 0);

              return (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-600 bg-amber-50/80 p-3 rounded-xl border border-amber-200/80">
                    <span className="flex items-center space-x-1.5">
                      <Receipt className="w-4 h-4 text-amber-700" />
                      <span>Found {paymentTxns.length} payment voucher(s)</span>
                    </span>
                    <span className="text-emerald-700 font-black text-sm">
                      Total Settlement Paid: Rs. {totalPaidAmount.toLocaleString()}
                    </span>
                  </div>

                  <div className="max-h-96 overflow-y-auto border border-slate-200 rounded-xl">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-800 text-white font-bold sticky top-0 z-10">
                        <tr>
                          <th className="p-3">#</th>
                          <th className="p-3">Payment Date</th>
                          <th className="p-3">Voucher Ref #</th>
                          <th className="p-3">Vendor / Distributor</th>
                          <th className="p-3">Payment Mode</th>
                          <th className="p-3 text-right">Amount Paid</th>
                          <th className="p-3">Description / Remarks</th>
                          <th className="p-3 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        {paymentTxns.length === 0 ? (
                          <tr>
                            <td colSpan={8} className="p-8 text-center text-slate-400">
                              No vendor payment voucher records found.
                            </td>
                          </tr>
                        ) : (
                          paymentTxns.map((pt, idx) => {
                            const vendorObj = vendors.find(v => 
                              (pt.VendorID && v.VendorID === pt.VendorID) ||
                              (pt.VendorName && v.VendorName.trim().toLowerCase() === pt.VendorName.trim().toLowerCase())
                            ) || ({ VendorName: pt.VendorName || 'Supplier', VendorID: pt.VendorID || 'N/A', Phone: '', Address: '' } as ErpVendor);

                            return (
                              <tr key={pt._id || idx} className="hover:bg-slate-50">
                                <td className="p-3 text-slate-400 font-bold">{idx + 1}</td>
                                <td className="p-3 font-mono font-bold text-slate-700">{pt.Date || pt.TransactionDate || 'N/A'}</td>
                                <td className="p-3 font-mono font-bold text-indigo-700">{pt.TransactionID || pt.ReferenceNo || 'N/A'}</td>
                                <td className="p-3 font-bold text-slate-900">{pt.VendorName || 'N/A'}</td>
                                <td className="p-3">
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                                    {pt.PaymentMethod || 'Cash'}
                                  </span>
                                </td>
                                <td className="p-3 text-right font-black text-emerald-600 bg-emerald-50/50">
                                  Rs. {Number(pt.Amount || 0).toLocaleString()}
                                </td>
                                <td className="p-3 text-slate-600 max-w-xs truncate">{pt.Description || 'Vendor Bill Settlement'}</td>
                                <td className="p-3 text-center">
                                  <button
                                    type="button"
                                    onClick={() => handlePrintSinglePaymentVoucher(pt, vendorObj)}
                                    className="px-2.5 py-1 text-[10px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded border border-indigo-200 transition cursor-pointer flex items-center space-x-1 mx-auto"
                                    title="Print Official Payment Voucher"
                                  >
                                    <Printer className="w-3 h-3" />
                                    <span>Print Voucher</span>
                                  </button>
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
            })()}

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowPaymentHistoryModal(false)}
                className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs transition cursor-pointer"
              >
                Close Window
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR Code Scanner & Generator Modals */}
      <ItemQRScannerModal
        isOpen={showQrScannerModal}
        onClose={() => setShowQrScannerModal(false)}
        onScanSuccess={(parsed) => {
          setMedicineSearchTerm(parsed.itemId || parsed.itemName);
          setShowQrScannerModal(false);
        }}
      />

      <ItemQRGeneratorModal
        isOpen={showQrGeneratorModal}
        onClose={() => setShowQrGeneratorModal(false)}
        items={inventoryItems.map((itm: any) => ({
          ItemID: itm.ItemID || `ITM-${Math.floor(100 + Math.random() * 900)}`,
          ItemName: itm.ItemName || 'Medicine Item',
          MedicineType: itm.MedicineType || 'P',
          Category: itm.Category || 'General',
          Price: itm.Price || itm.PurchasePrice || 100,
          CStock: itm.CStock ?? itm.Stock ?? 0,
          Unit: itm.Unit || 'Pack'
        }))}
        clinicName="ERP Pharmacy Operations"
      />
    </div>
  );
}
