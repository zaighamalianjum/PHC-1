import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
  PhoneCall,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Menu,
  PanelLeft
} from 'lucide-react';
import ItemQRScannerModal from './ItemQRScannerModal';
import ItemQRGeneratorModal from './ItemQRGeneratorModal';
import ReportingDesk from './ReportingDesk';
import FiscalCalendarDesk from './FiscalCalendarDesk';
import { GrnPrintPreviewModal } from './GrnPrintPreviewModal';
import {
  openWhatsAppUrl,
  generateWhatsAppPurchaseOrderUrl,
  generateWhatsAppPurchaseOrderText,
  formatWhatsAppPhone
} from '../utils/whatsappUtils';
import { dispatchSafeCustomEvent } from '../utils/userSync';
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
import {
  getEffectiveAppointmentFee,
  isAppointmentRevenueEligible
} from '../utils/appointmentRevenue';
import { toMonthYearInput } from '../utils/pharmacyUtils';


// Modular ERP Tabs
import OverviewTab from './erp/tabs/OverviewTab';
import FiscalCalendarTab from './erp/tabs/FiscalCalendarTab';
import CashBookPnlTab from './erp/tabs/CashBookPnlTab';
import VendorsTab from './erp/tabs/VendorsTab';
import VendorStatementTab from './erp/tabs/VendorStatementTab';
import PurchaseOrdersTab from './erp/tabs/PurchaseOrdersTab';
import LedgerTab from './erp/tabs/LedgerTab';
import HrTab from './erp/tabs/HrTab';
import ExpensesAssetsTab from './erp/tabs/ExpensesAssetsTab';
import ReportingTab from './erp/tabs/ReportingTab';

// Modular ERP Modals
import RegisterEditVendorModal from './erp/modals/RegisterEditVendorModal';
import PurchaseOrderModal from './erp/modals/PurchaseOrderModal';
import QuickAddMedicineModal from './erp/modals/QuickAddMedicineModal';
import BulkPoUploadModal from './erp/modals/BulkPoUploadModal';
import BulkGrnUploadModal from './erp/modals/BulkGrnUploadModal';
import UnmatchedCategoryDialog from './erp/modals/UnmatchedCategoryDialog';
import GrnModal from './erp/modals/GrnModal';
import TransactionModal from './erp/modals/TransactionModal';
import EmployeeModal from './erp/modals/EmployeeModal';
import PayrollModal from './erp/modals/PayrollModal';
import ExpenseModal from './erp/modals/ExpenseModal';
import AssetModal from './erp/modals/AssetModal';
import VendorPrintStatementModal from './erp/modals/VendorPrintStatementModal';
import PayVendorModal from './erp/modals/PayVendorModal';
import VendorPurchaseOrdersModal from './erp/modals/VendorPurchaseOrdersModal';
import PoPaymentHistoryModal from './erp/modals/PoPaymentHistoryModal';
import VendorPaymentHistoryStandaloneModal from './erp/modals/VendorPaymentHistoryStandaloneModal';
import WhatsAppPoModal from './erp/modals/WhatsAppPoModal';

const WhatsAppIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.573-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c-.001 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

interface ErpDeskProps {
  currentUser: User | null;
  rights: UserRight[];
  clinicSettings?: ClinicSettings;
}

export default function ErpDesk({ currentUser, rights, clinicSettings }: ErpDeskProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'fiscal_calendar' | 'cash_book_pnl' | 'vendors' | 'vendor_statement' | 'po' | 'ledger' | 'hr' | 'expenses_assets' | 'reporting'>('overview');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
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

  // Cash Book & Financial Period Filter States - Default to Current Year & Current Month
  const [cashBookDateFilter, setCashBookDateFilter] = useState<'today' | 'this_week' | 'this_month' | 'this_year' | 'custom' | 'all_time'>('custom');
  const [cashBookStartDate, setCashBookStartDate] = useState<string>(firstDayOfCurrentMonth);
  const [cashBookEndDate, setCashBookEndDate] = useState<string>(lastDayOfCurrentMonth);
  const [cashBookCategoryFilter, setCashBookCategoryFilter] = useState<'ALL' | 'INFLOW' | 'OUTFLOW'>('ALL');
  const [cashBookSearch, setCashBookSearch] = useState<string>('');

  // Dedicated Fiscal Year and Month Selection
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

  const handleFiscalYearSelect = (fyKey: string) => {
    setSelectedFiscalYear(fyKey);
    if (fyKey === 'all') {
      setSelectedFiscalMonth('all');
      setCashBookDateFilter('all_time');
      setCashBookStartDate('2020-01-01');
      setCashBookEndDate(new Date().toISOString().split('T')[0]);
    } else if (fyKey === 'custom') {
      setCashBookDateFilter('custom');
    } else if (fyKey.startsWith('FY ')) {
      const parts = fyKey.replace('FY ', '').split('-');
      const y1 = Number(parts[0]);
      const y2 = Number(parts[1]);
      if (selectedFiscalMonth !== 'all' && (selectedFiscalMonth.startsWith(`${y1}-`) || selectedFiscalMonth.startsWith(`${y2}-`))) {
        const [yrStr, mStr] = selectedFiscalMonth.split('-');
        const y = parseInt(yrStr);
        const m = parseInt(mStr);
        const firstD = `${yrStr}-${mStr}-01`;
        const lastD = new Date(y, m, 0).toISOString().split('T')[0];
        setCashBookStartDate(firstD);
        setCashBookEndDate(lastD);
        setCashBookDateFilter('custom');
      } else {
        setSelectedFiscalMonth('all');
        setCashBookStartDate(`${y1}-07-01`);
        setCashBookEndDate(`${y2}-06-30`);
        setCashBookDateFilter('custom');
      }
    } else if (fyKey.startsWith('CY ')) {
      const yr = Number(fyKey.replace('CY ', '')) || currentYear;
      if (selectedFiscalMonth !== 'all' && selectedFiscalMonth.startsWith(`${yr}-`)) {
        const [yrStr, mStr] = selectedFiscalMonth.split('-');
        const y = parseInt(yrStr);
        const m = parseInt(mStr);
        const firstD = `${yrStr}-${mStr}-01`;
        const lastD = new Date(y, m, 0).toISOString().split('T')[0];
        setCashBookStartDate(firstD);
        setCashBookEndDate(lastD);
        setCashBookDateFilter('custom');
      } else {
        setSelectedFiscalMonth('all');
        setCashBookStartDate(`${yr}-01-01`);
        setCashBookEndDate(`${yr}-12-31`);
        setCashBookDateFilter('custom');
      }
    }
  };

  const handleFiscalMonthSelect = (ym: string) => {
    setSelectedFiscalMonth(ym);
    if (ym === 'all') {
      if (selectedFiscalYear.startsWith('FY ')) {
        const parts = selectedFiscalYear.replace('FY ', '').split('-');
        setCashBookStartDate(`${parts[0]}-07-01`);
        setCashBookEndDate(`${parts[1]}-06-30`);
      } else if (selectedFiscalYear.startsWith('CY ')) {
        const yr = selectedFiscalYear.replace('CY ', '');
        setCashBookStartDate(`${yr}-01-01`);
        setCashBookEndDate(`${yr}-12-31`);
      } else {
        setCashBookDateFilter('all_time');
        return;
      }
      setCashBookDateFilter('custom');
    } else {
      const [yrStr, mStr] = ym.split('-');
      const y = parseInt(yrStr);
      const m = parseInt(mStr);
      const firstDay = `${yrStr}-${mStr}-01`;
      const lastDay = new Date(y, m, 0).toISOString().split('T')[0];
      setCashBookStartDate(firstDay);
      setCashBookEndDate(lastDay);
      setCashBookDateFilter('custom');
    }
  };

  const handleQuickPresetChange = (preset: 'today' | 'this_week' | 'this_month' | 'this_year' | 'custom' | 'all_time') => {
    setCashBookDateFilter(preset);
    const today = new Date().toISOString().split('T')[0];
    if (preset === 'today') {
      setSelectedFiscalMonth('all');
      setCashBookStartDate(today);
      setCashBookEndDate(today);
    } else if (preset === 'this_week') {
      setSelectedFiscalMonth('all');
      const d = new Date();
      d.setDate(d.getDate() - 7);
      setCashBookStartDate(d.toISOString().split('T')[0]);
      setCashBookEndDate(today);
    } else if (preset === 'this_month') {
      setSelectedFiscalYear(`CY ${currentYear}`);
      setSelectedFiscalMonth(currentYearMonth);
      setCashBookStartDate(firstDayOfCurrentMonth);
      setCashBookEndDate(lastDayOfCurrentMonth);
    } else if (preset === 'this_year') {
      setSelectedFiscalYear(`CY ${currentYear}`);
      setSelectedFiscalMonth('all');
      setCashBookStartDate(`${currentYear}-01-01`);
      setCashBookEndDate(`${currentYear}-12-31`);
    } else if (preset === 'all_time') {
      setSelectedFiscalYear('all');
      setSelectedFiscalMonth('all');
      setCashBookStartDate('2020-01-01');
      setCashBookEndDate(today);
    }
  };

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
  const [poGridPage, setPoGridPage] = useState<number>(1);
  const [poGridPageSize, setPoGridPageSize] = useState<number>(24);
  const [customCategoryUpdate, setCustomCategoryUpdate] = useState<number>(0);

  // Financial Ledger Tab Filter States
  const [ledgerSearchTerm, setLedgerSearchTerm] = useState<string>('');
  const [ledgerDateMode, setLedgerDateMode] = useState<'filtered' | 'all'>('filtered');

  // WhatsApp PO Share State
  const [selectedPoForWhatsApp, setSelectedPoForWhatsApp] = useState<ErpPurchaseOrder | null>(null);
  const [whatsAppTargetPhone, setWhatsAppTargetPhone] = useState<string>('');
  const [whatsAppCustomNote, setWhatsAppCustomNote] = useState<string>('');
  const [showWhatsAppPoModal, setShowWhatsAppPoModal] = useState<boolean>(false);

  // Helper to extract clean category matching Stock Manager / Pharmacy POS
  const getMedicineItemCategory = useCallback((item: any): string => {
    if (!item) return 'Patent / Pre-packaged';
    const c = item.Category || item.category;
    if (c && typeof c === 'string' && c.trim()) return c.trim();
    if (item.MedicineType === 'C') return 'Clinical Compounding (/C)';
    const u = item.Unit || item.unit;
    if (u && typeof u === 'string' && u.trim()) return u.trim();
    if (item.MedicineType === 'P') return 'Patent Medicine (/P)';
    return 'Tablet / Capsule';
  }, []);

  // Dynamic Medicine Categories List (Fully Synchronized with Stock Manager & Pharmacy POS)
  const medicineCategories = useMemo(() => {
    const defaultCats = [
      'BM Drops',
      'Clinical Compounding (/C)',
      'Patent Medicine (/P)',
      'Q D DROPS (Mother Tincture)',
      'Potency 30',
      'Potency 200',
      'Syrup',
      'Drops',
      'Tablet / Capsule',
      'Ointment / Cream',
      'Injection / Ampoule',
      'Clinical / Compounded',
      'Patent / Pre-packaged',
      'Surgical / Supplies'
    ];

    const customCats: string[] = [];
    try {
      const saved = localStorage.getItem('pharmacy_custom_categories');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          parsed.forEach((cat: any) => {
            if (cat && typeof cat === 'string' && cat.trim()) {
              customCats.push(cat.trim());
            }
          });
        }
      }
    } catch (e) {
      // ignore
    }

    const itemCats = (inventoryItems || [])
      .map((i: any) => getMedicineItemCategory(i))
      .filter(Boolean);

    // Combine and deduplicate preserving case-insensitivity
    const seen = new Set<string>();
    const result: string[] = [];

    [...defaultCats, ...customCats, ...itemCats].forEach((cat) => {
      if (!cat) return;
      const clean = cat.trim();
      const lower = clean.toLowerCase();
      if (!seen.has(lower)) {
        seen.add(lower);
        result.push(clean);
      }
    });

    return result;
  }, [inventoryItems, getMedicineItemCategory, customCategoryUpdate]);

  // Intelligent Category Matcher & Auto-Detector (Handles raw strings, inventory items, PO items, and medicine names)
  const resolveSmartMedicineCategory = useCallback((
    rawCategoryStr?: string,
    matchedInv?: any,
    matchedPoItem?: any,
    medicineName?: string
  ): string => {
    const norm = (s: any) => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');

    // Check against all available categories & aliases
    const matchCategoryCandidate = (candidate?: string): string | null => {
      if (!candidate || typeof candidate !== 'string') return null;
      const clean = candidate.trim();
      if (!clean) return null;
      const lower = clean.toLowerCase();
      const normCand = norm(clean);

      // 1. Exact case-insensitive match
      const exactMatch = medicineCategories.find(c => c.toLowerCase() === lower);
      if (exactMatch) return exactMatch;

      // 2. Alphanumeric normalized match
      const normMatch = medicineCategories.find(c => norm(c) === normCand);
      if (normMatch) return normMatch;

      // 3. Known Aliases mapping to standard categories
      if (normCand.startsWith('bm') || normCand.includes('bmdrop')) {
        const bm = medicineCategories.find(c => norm(c).includes('bmdrop') || c === 'BM Drops');
        if (bm) return bm;
      }
      if (normCand === 'qd' || normCand.includes('qddrop') || normCand.includes('mothertincture') || normCand === 'mt' || normCand === 'q' || normCand === 'qdrops') {
        const qd = medicineCategories.find(c => norm(c).includes('qddrop') || norm(c).includes('mothertincture') || c.includes('Mother Tincture') || c === 'Q D DROPS (Mother Tincture)');
        if (qd) return qd;
      }
      if (normCand === '30' || normCand === '30c' || normCand === '30ch' || normCand === '30x' || normCand.includes('potency30') || normCand.includes('30potency')) {
        const p30 = medicineCategories.find(c => norm(c).includes('potency30') || c === 'Potency 30');
        if (p30) return p30;
      }
      if (normCand === '200' || normCand === '200c' || normCand === '200ch' || normCand === '200x' || normCand.includes('potency200') || normCand.includes('200potency')) {
        const p200 = medicineCategories.find(c => norm(c).includes('potency200') || c === 'Potency 200');
        if (p200) return p200;
      }
      if (normCand.includes('syrup') || normCand === 'syp') {
        const syp = medicineCategories.find(c => norm(c) === 'syrup' || norm(c).includes('syrup'));
        if (syp) return syp;
      }
      if (normCand === 'drop' || normCand === 'drops' || normCand.includes('drops')) {
        const drops = medicineCategories.find(c => c === 'Drops' || norm(c) === 'drops');
        if (drops) return drops;
      }
      if (normCand.includes('tab') || normCand.includes('tablet') || normCand.includes('cap') || normCand.includes('capsule')) {
        const tab = medicineCategories.find(c => norm(c).includes('tablet') || norm(c).includes('capsule') || c === 'Tablet / Capsule');
        if (tab) return tab;
      }
      if (normCand.includes('ointment') || normCand.includes('cream') || normCand.includes('gel')) {
        const oint = medicineCategories.find(c => norm(c).includes('ointment') || norm(c).includes('cream') || c === 'Ointment / Cream');
        if (oint) return oint;
      }
      if (normCand.includes('inj') || normCand.includes('injection') || normCand.includes('ampoule')) {
        const inj = medicineCategories.find(c => norm(c).includes('injection') || norm(c).includes('ampoule') || c === 'Injection / Ampoule');
        if (inj) return inj;
      }
      if (normCand === 'c' || normCand === 'clinical' || normCand.includes('compounding') || normCand === 'clinicalcompounding') {
        const clin = medicineCategories.find(c => norm(c).includes('clinical') || c === 'Clinical Compounding (/C)');
        if (clin) return clin;
      }
      if (normCand === 'p' || normCand === 'patent' || normCand.includes('prepackaged') || normCand === 'patentmedicine') {
        const pat = medicineCategories.find(c => norm(c).includes('patent') || c === 'Patent Medicine (/P)');
        if (pat) return pat;
      }

      // 4. Substring / partial match with custom categories
      const subMatch = medicineCategories.find(c => {
        const nc = norm(c);
        return nc.length > 2 && (normCand.includes(nc) || nc.includes(normCand));
      });
      if (subMatch) return subMatch;

      return clean;
    };

    // 1. First priority: explicit category string provided in file/text
    if (rawCategoryStr && rawCategoryStr.trim()) {
      const match = matchCategoryCandidate(rawCategoryStr);
      if (match) return match;
    }

    // 2. Second priority: PO Item category
    if (matchedPoItem && (matchedPoItem as any).Category) {
      const match = matchCategoryCandidate((matchedPoItem as any).Category);
      if (match) return match;
    }

    // 3. Third priority: Matched Master Inventory Item attributes (Category, Unit, MedicineType)
    if (matchedInv) {
      const invCat = matchedInv.Category || matchedInv.category || matchedInv.Unit || matchedInv.unit;
      if (invCat) {
        const match = matchCategoryCandidate(invCat);
        if (match) return match;
      }
      if (matchedInv.MedicineType === 'C') {
        const clin = medicineCategories.find(c => norm(c).includes('clinical') || c === 'Clinical Compounding (/C)');
        if (clin) return clin;
      }
      if (matchedInv.MedicineType === 'P') {
        const pat = medicineCategories.find(c => norm(c).includes('patent') || c === 'Patent Medicine (/P)');
        if (pat) return pat;
      }
    }

    // 4. Fourth priority: Smart auto-inference from Medicine Name itself!
    if (medicineName && medicineName.trim()) {
      const name = medicineName.trim();
      const normName = norm(name);

      // Check if medicine starts with or contains BM pattern (e.g. BM 101, BM-25, BM#12)
      if (/^bm[- #_0-9]/i.test(name) || /\bbm[- #_0-9]/i.test(name) || /^bm\b/i.test(name) || (normName.startsWith('bm') && /\d/.test(normName.slice(0, 5)))) {
        const bm = medicineCategories.find(c => norm(c).includes('bmdrop') || c === 'BM Drops');
        if (bm) return bm;
      }

      // Check if ends with Q, MT, Q.D., or Mother Tincture
      if (/\b(q|mt|q\.d\.|qd)\b/i.test(name) || /(mother\s*tincture|q\s*d\s*drops)/i.test(name) || /\s+q$/i.test(name)) {
        const qd = medicineCategories.find(c => norm(c).includes('qddrop') || norm(c).includes('mothertincture') || c.includes('Mother Tincture') || c === 'Q D DROPS (Mother Tincture)');
        if (qd) return qd;
      }

      // Check Potency 30 (e.g. Acid Phos 30, Arnica 30C, 30CH, 30X)
      if (/\b30(c|ch|x|k)?\b/i.test(name) || /\bpotency\s*30\b/i.test(name) || /\s+30$/i.test(name)) {
        const p30 = medicineCategories.find(c => norm(c).includes('potency30') || c === 'Potency 30');
        if (p30) return p30;
      }

      // Check Potency 200 (e.g. Belladonna 200, Nux Vomica 200C, 200CH)
      if (/\b200(c|ch|x|k)?\b/i.test(name) || /\bpotency\s*200\b/i.test(name) || /\s+200$/i.test(name)) {
        const p200 = medicineCategories.find(c => norm(c).includes('potency200') || c === 'Potency 200');
        if (p200) return p200;
      }

      // Check Potency 1M / 10M / CM
      if (/\b(1m|10m|cm)\b/i.test(name)) {
        const pHigh = medicineCategories.find(c => norm(c).includes('1m') || norm(c).includes('potency200') || c === 'Potency 200');
        if (pHigh) return pHigh;
      }

      // Check Syrup
      if (/\b(syrup|syp)\b/i.test(name)) {
        const syp = medicineCategories.find(c => norm(c) === 'syrup' || norm(c).includes('syrup'));
        if (syp) return syp;
      }

      // Check Drops
      if (/\b(drops?|gtts?)\b/i.test(name)) {
        const drops = medicineCategories.find(c => c === 'Drops' || norm(c) === 'drops');
        if (drops) return drops;
      }

      // Check Tablet / Capsule
      if (/\b(tabs?|tablets?|caps?|capsules?)\b/i.test(name)) {
        const tab = medicineCategories.find(c => norm(c).includes('tablet') || norm(c).includes('capsule') || c === 'Tablet / Capsule');
        if (tab) return tab;
      }

      // Check Ointment / Cream
      if (/\b(ointments?|creams?|gels?|lotions?)\b/i.test(name)) {
        const oint = medicineCategories.find(c => norm(c).includes('ointment') || norm(c).includes('cream') || c === 'Ointment / Cream');
        if (oint) return oint;
      }

      // Check Injection
      if (/\b(injections?|inj|ampoules?|vials?)\b/i.test(name)) {
        const inj = medicineCategories.find(c => norm(c).includes('injection') || norm(c).includes('ampoule') || c === 'Injection / Ampoule');
        if (inj) return inj;
      }

      // Check Clinical / Patent suffixes
      if (name.includes('/C') || /\bclinical\b/i.test(name)) {
        const clin = medicineCategories.find(c => norm(c).includes('clinical') || c === 'Clinical Compounding (/C)');
        if (clin) return clin;
      }
      if (name.includes('/P') || /\bpatent\b/i.test(name)) {
        const pat = medicineCategories.find(c => norm(c).includes('patent') || c === 'Patent Medicine (/P)');
        if (pat) return pat;
      }

      // Check custom categories by matching words
      for (const cat of medicineCategories) {
        const nc = norm(cat);
        if (nc.length >= 3 && normName.includes(nc)) {
          return cat;
        }
      }
    }

    // 5. Default fallback
    return medicineCategories[0] || 'BM Drops';
  }, [medicineCategories]);

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
      const isCash = g.PaymentMethod === 'Cash' || (g as any).PaymentMode === 'Cash';
      rows.push({
        id: g.GrnID || g._id || `GRN-${Math.random()}`,
        date: g.ReceivedDate || new Date().toISOString().split('T')[0],
        type: isCash ? 'GRN (Cash Purchase)' : 'GRN (Credit Purchase)',
        refNo: g.GrnID || 'GRN-N/A',
        poNo: g.POID || (g as any).PoID || 'N/A',
        description: `GRN Inward [${isCash ? 'Spot Cash Paid' : 'Credit / Payable'}] - Invoice #${g.VendorInvoiceNo || g.SupplierInvoiceNo || 'N/A'} (${g.ItemsReceived?.length || g.Items?.length || 0} items)`,
        debit: 0,
        credit: Number(g.TotalAmount || 0),
        rawItem: g
      });
    });

    vendorTxns.forEach(t => {
      const isSpotPay = t.Category?.includes('Cash Spot') || t.Description?.includes('Spot Cash Payment');
      rows.push({
        id: t.TransactionID || t._id || `TXN-${Math.random()}`,
        date: t.Date || new Date().toISOString().split('T')[0],
        type: isSpotPay ? 'Spot Cash Voucher (CPV)' : 'Vendor Bill Payment',
        refNo: t.TransactionID || 'PAY-N/A',
        poNo: t.ReferenceNo && t.ReferenceNo.toUpperCase().startsWith('PO') ? t.ReferenceNo : (t.ReferenceNo || 'N/A'),
        description: isSpotPay ? `Instant Spot Cash Paid on Delivery (${t.Description})` : `Payment Settled via ${t.PaymentMethod || 'Cash'} - ${t.Description || 'Vendor Settlement'}`,
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

    // Calculate Running Balance and Cash vs Credit Breakdown
    let running = 0;
    let totalInvoiced = 0;
    let totalPaid = 0;
    let totalCashPaid = 0;
    let totalCreditPaid = 0;

    const statementRows = filteredRows.map(r => {
      totalInvoiced += r.credit;
      totalPaid += r.debit;
      if (r.debit > 0) {
        const isCash = r.type?.includes('Spot Cash') || r.type?.includes('Cash') || (r.rawItem?.PaymentMethod || '').toLowerCase() === 'cash';
        if (isCash) {
          totalCashPaid += r.debit;
        } else {
          totalCreditPaid += r.debit;
        }
      }
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
      totalCashPaid,
      totalCreditPaid,
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
    // STRICT RULE: Only include revenue if appointment is booked via app OR patient has been checked by doctor
    (appointments || []).forEach((app: any) => {
      if (app.Status === 3) return;
      const amt = getEffectiveAppointmentFee(app, patientVisits);
      if (amt > 0) {
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

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      if (ledgerDateMode === 'filtered' && t.Date) {
        const cleanDate = t.Date.includes('T') ? t.Date.split('T')[0] : t.Date;
        if (cashBookDateFilter !== 'all_time') {
          if (cashBookStartDate && cleanDate < cashBookStartDate) return false;
          if (cashBookEndDate && cleanDate > cashBookEndDate) return false;
        }
      }

      if (ledgerSearchTerm.trim()) {
        const q = ledgerSearchTerm.toLowerCase();
        const match = (t.TransactionID || '').toLowerCase().includes(q) ||
                      (t.Category || '').toLowerCase().includes(q) ||
                      (t.Description || '').toLowerCase().includes(q) ||
                      (t.PaymentMethod || '').toLowerCase().includes(q) ||
                      (t.CreatedBy || '').toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [transactions, ledgerDateMode, cashBookDateFilter, cashBookStartDate, cashBookEndDate, ledgerSearchTerm]);

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
      dispensaryInflow: clinicalInflow + storeInflow,
      storeInflow,
      regInflow,
      otherInflow: regInflow,
      salariesOutflow,
      payrollOutflow: salariesOutflow,
      rentOutflow,
      billsOutflow,
      expenseOutflow: rentOutflow + billsOutflow + miscOutflow,
      medicinePurchasesOutflow,
      grnOutflow: medicinePurchasesOutflow,
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
      dispatchSafeCustomEvent('phc_db_updated');
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

    const cName = clinicSettings?.ClinicName || 'PUNJAB HOMEOPATHIC CLINIC & PHARMACY';
    const cTag = clinicSettings?.ClinicLogoText || 'HEALING NATURALLY. RESTORING BALANCE.';
    const cDoc = clinicSettings?.DoctorName || '';
    const cDocSub = clinicSettings?.DoctorSignatureText || '';
    const cAddr = clinicSettings?.ClinicAddress || '10 Shalimar Road, Garhi Shahu, Lahore';
    const cPhone = clinicSettings?.PhoneMobile || '+92-311-4000608';
    const cWebsite = clinicSettings?.Website || 'https://punjabhomeopathic.pk';
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
              <div class="clinic-address" style="font-size: 11px; font-weight: 700; color: #1e293b; margin-top: 2px;">
                📍 ${cAddr} &nbsp;|&nbsp; 📞 ${cPhone} &nbsp;|&nbsp; 🌐 ${cWebsite.replace(/^https?:\/\//, '')}
              </div>
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
            <div>Punjab Homeopathic Clinic & Pharmacy • 🌐 ${cWebsite.replace(/^https?:\/\//, '')} • 📞 Helpline: ${cPhone}</div>
            <div>Authorized Administrator: <strong>Mr. Zaigham Ali Anjum</strong></div>
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
  const [editingPurchaseOrder, setEditingPurchaseOrder] = useState<ErpPurchaseOrder | null>(null);
  const [showGrnModal, setShowGrnModal] = useState(false);
  const [showTxnModal, setShowTxnModal] = useState(false);
  const [showEmpModal, setShowEmpModal] = useState(false);
  const [showPayrollModal, setShowPayrollModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showAssetModal, setShowAssetModal] = useState(false);
  const [showQrScannerModal, setShowQrScannerModal] = useState(false);
  const [showQrGeneratorModal, setShowQrGeneratorModal] = useState(false);

  // Quick Add / Edit Medicine in PO Modal State
  const [showQuickAddMedModal, setShowQuickAddMedModal] = useState(false);
  const [editingQuickMed, setEditingQuickMed] = useState<any | null>(null);
  const [quickMedForm, setQuickMedForm] = useState<{
    ItemName: string;
    Category: string;
    Unit: string;
    TradePrice: number | string;
    SalePrice: number | string;
    MinStock: number | string;
    InitialStock: number | string;
    RequisitionQty: number | string;
    AutoAddToPo: boolean;
    CustomCategory: string;
  }>({
    ItemName: '',
    Category: 'BM Drops',
    Unit: 'Bottle',
    TradePrice: '',
    SalePrice: '',
    MinStock: 10,
    InitialStock: 0,
    RequisitionQty: 10,
    AutoAddToPo: true,
    CustomCategory: ''
  });

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

  // Bulk GRN Upload Modal State
  const [showUploadBulkGrnModal, setShowUploadBulkGrnModal] = useState(false);
  const [bulkGrnSelectedPoId, setBulkGrnSelectedPoId] = useState<string>('');
  const [bulkGrnRawText, setBulkGrnRawText] = useState('');
  const [bulkGrnParsedItems, setBulkGrnParsedItems] = useState<{
    ItemID: string;
    ItemName: string;
    Category: string;
    OrderedQty: number;
    AlreadyReceivedQty: number;
    PendingQty: number;
    ReceivedQty: number;
    UnitPrice: number;
    MfgDate: string;
    ExpiryDate: string;
    BatchNo: string;
    isMatchedPo: boolean;
    isMatchedInventory: boolean;
    stockInHand?: number;
  }[]>([]);
  const [bulkGrnDragActive, setBulkGrnDragActive] = useState(false);
  const [bulkGrnFileError, setBulkGrnFileError] = useState('');
  const bulkGrnFileInputRef = React.useRef<HTMLInputElement>(null);

  // Unmatched Category Resolution Prompt Modal State
  const [unmatchedCategoryDialog, setUnmatchedCategoryDialog] = useState<{
    isOpen: boolean;
    unmatchedList: Array<{
      originalCategory: string;
      count: number;
      sampleItems: string[];
      action: 'new' | 'map';
      mappedTo: string;
    }>;
    parsedRows: Array<{ name: string; batchNo?: string; mfgDate?: string; expiryDate?: string; price?: number; qty?: number; category?: string }>;
    targetPoId?: string;
  } | null>(null);

  // Dedicated GRN Print Preview Modal State
  const [showGrnPrintPreviewModal, setShowGrnPrintPreviewModal] = useState<boolean>(false);
  const [grnPrintPreviewData, setGrnPrintPreviewData] = useState<ErpGrn | null>(null);

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
    PaymentMethod: 'Credit' | 'Cash';
    Remarks: string;
    Items: {
      ItemID: string;
      ItemName: string;
      OrderedQty: number;
      AlreadyReceivedQty?: number;
      PendingQty?: number;
      ReceivedQty: number | string;
      UnitPrice: number | string;
      LineTotal: number;
      BatchNo?: string;
      MfgDate?: string;
      ExpiryDate?: string;
    }[];
  }>({
    POID: '',
    GRNID: '',
    VendorID: '',
    VendorName: '',
    ReceivedDate: new Date().toISOString().split('T')[0],
    ChallanNo: '',
    SupplierInvoiceNo: '',
    PaymentMethod: 'Credit',
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
    PaymentMethod: 'Credit' | 'Cash';
    Notes: string;
    Items: { ItemID: string; ItemName: string; Category?: string; Qty: number; UnitPrice: number; BatchNo?: string; ExpiryDate?: string }[];
  }>({
    VendorID: '',
    VendorName: '',
    ExpectedDeliveryDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
    PaymentMethod: 'Credit',
    Notes: '',
    Items: []
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
      let id = data._id;
      if (collection === 'erp_purchase_orders') {
        id = id || data.POID;
      } else if (collection === 'erp_grn') {
        id = id || data.GRNID;
      } else if (collection === 'erp_vendors') {
        id = id || data.VendorID || data.SID || data.SupplierID;
      } else if (collection === 'erp_transactions') {
        id = id || data.TransactionID || data.VoucherNo;
      } else if (collection === 'erp_expenses') {
        id = id || data.ExpenseID;
      } else if (collection === 'erp_employees') {
        id = id || data.EmployeeID;
      } else if (collection === 'erp_assets') {
        id = id || data.AssetID;
      } else if (collection === 'erp_payroll') {
        id = id || data.PayrollID;
      } else {
        id = id || data.POID || data.GRNID || data.VendorID || data.TransactionID || data.ExpenseID;
      }

      const method = forceMethod || (id ? 'PUT' : 'POST');
      const url = (method === 'PUT' && id) ? `/api/query/${collection}/${encodeURIComponent(id)}` : `/api/query/${collection}`;
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const ct = res.headers.get('content-type') || '';
      const result = ct.includes('application/json') ? await res.json() : { success: false };
      dispatchSafeCustomEvent('phc_db_updated');
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
      dispatchSafeCustomEvent('phc_db_updated');
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

  const getMedicinePriceInfo = useCallback((med: any, targetVendorName?: string, targetVendorId?: string) => {
    if (!med) return { unitPrice: null, priceSource: 'none' as const, label: 'Price: Not Mentioned', grnInfo: null, hasPrice: false, grnNo: '', grnDate: '' };

    const medId = String(med.ItemID || med.id || '').toUpperCase().trim();
    const medName = String(med.ItemName || med.name || '').toLowerCase().trim();
    const cleanNorm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

    const currentVName = targetVendorName || poForm?.VendorName || '';
    const currentVId = targetVendorId || poForm?.VendorID || '';

    // 1. Look up in previous GRNs (sorted newest first by ReceivedDate)
    const sortedGrns = [...(grns || [])].sort((a, b) => {
      const dateA = new Date(a.ReceivedDate || 0).getTime();
      const dateB = new Date(b.ReceivedDate || 0).getTime();
      return dateB - dateA;
    });

    // 1A. If vendor is specified, prioritize previous GRNs from THIS same vendor
    if (currentVName || currentVId) {
      const vendorGrns = sortedGrns.filter(g => 
        (currentVId && g.VendorID === currentVId) ||
        (currentVName && g.VendorName && g.VendorName.trim().toLowerCase() === currentVName.trim().toLowerCase())
      );

      for (const grn of vendorGrns) {
        if (grn.Items && Array.isArray(grn.Items)) {
          const match = grn.Items.find(gi => 
            (medId && String(gi.ItemID || '').toUpperCase().trim() === medId) ||
            (medName && String(gi.ItemName || '').toLowerCase().trim() === medName) ||
            (medName && cleanNorm(String(gi.ItemName || '')) === cleanNorm(medName))
          );
          if (match && match.UnitPrice !== undefined && match.UnitPrice !== null && match.UnitPrice !== '') {
            const p = Number(match.UnitPrice);
            if (p > 0) {
              return {
                unitPrice: p,
                priceSource: 'grn' as const,
                label: `Vendor GRN Price (GRN #${grn.GRNID})`,
                grnInfo: `GRN #${grn.GRNID} • ${grn.VendorName || currentVName} • ${grn.ReceivedDate || 'Recent'}`,
                hasPrice: true,
                grnNo: grn.GRNID,
                grnDate: grn.ReceivedDate || ''
              };
            }
          }
        }
      }
    }

    // 1B. Search across all recent GRNs from any vendor
    for (const grn of sortedGrns) {
      if (grn.Items && Array.isArray(grn.Items)) {
        const match = grn.Items.find(gi => 
          (medId && String(gi.ItemID || '').toUpperCase().trim() === medId) ||
          (medName && String(gi.ItemName || '').toLowerCase().trim() === medName) ||
          (medName && cleanNorm(String(gi.ItemName || '')) === cleanNorm(medName))
        );
        if (match && match.UnitPrice !== undefined && match.UnitPrice !== null && match.UnitPrice !== '') {
          const p = Number(match.UnitPrice);
          if (p > 0) {
            return {
              unitPrice: p,
              priceSource: 'grn' as const,
              label: `Last GRN Price (GRN #${grn.GRNID})`,
              grnInfo: `GRN #${grn.GRNID} • ${grn.VendorName || 'Vendor'} • ${grn.ReceivedDate || 'Recent'}`,
              hasPrice: true,
              grnNo: grn.GRNID,
              grnDate: grn.ReceivedDate || ''
            };
          }
        }
      }
    }

    // 2. Check Item Master PurchasePrice / TP / costPrice / Price
    const pPrice = Number(med.PurchasePrice ?? med.purchasePrice ?? med.TP ?? med.costPrice ?? med.Price);
    if (pPrice > 0) {
      return {
        unitPrice: pPrice,
        priceSource: 'master' as const,
        label: 'Master TP Price',
        grnInfo: 'Master TP Price',
        hasPrice: true,
        grnNo: '',
        grnDate: ''
      };
    }

    // 3. Check if unit price was manually configured on med
    if (med.UnitPrice !== undefined && Number(med.UnitPrice) > 0) {
      return {
        unitPrice: Number(med.UnitPrice),
        priceSource: 'entered' as const,
        label: 'Unit Price',
        grnInfo: 'Configured Price',
        hasPrice: true,
        grnNo: '',
        grnDate: ''
      };
    }

    // 4. No price exists
    return {
      unitPrice: null,
      priceSource: 'none' as const,
      label: 'Price: Not Mentioned',
      grnInfo: null,
      hasPrice: false,
      grnNo: '',
      grnDate: ''
    };
  }, [grns, poForm?.VendorID, poForm?.VendorName]);

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
      const priceInfo = getMedicinePriceInfo(med);
      const unitPrice = priceInfo.unitPrice ?? 0;
      const cat = getMedicineItemCategory(med);
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

    const newPoItems = lowStockItems.map(med => {
      const priceInfo = getMedicinePriceInfo(med);
      return {
        ItemID: med.ItemID || `ITM-${Math.floor(100 + Math.random() * 900)}`,
        ItemName: med.ItemName,
        Category: getMedicineItemCategory(med),
        Qty: getRequiredQty(med),
        UnitPrice: priceInfo.unitPrice ?? 0,
        BatchNo: med.BatchNo || `B-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`
      };
    });

    setPoForm(prev => ({
      ...prev,
      Items: newPoItems
    }));
  };

  const handleSelectAllFilteredMedicines = (filteredMeds: any[]) => {
    if (!filteredMeds || filteredMeds.length === 0) {
      alert('No medicines currently match the search or category filter.');
      return;
    }
    const newItems = [...poForm.Items];
    let addedCount = 0;
    filteredMeds.forEach(med => {
      const exists = newItems.some(i => (i.ItemID && i.ItemID === med.ItemID) || i.ItemName === med.ItemName);
      if (!exists) {
        const priceInfo = getMedicinePriceInfo(med);
        newItems.push({
          ItemID: med.ItemID || `ITM-${Math.floor(100 + Math.random() * 900)}`,
          ItemName: med.ItemName,
          Category: getMedicineItemCategory(med),
          Qty: getRequiredQty(med),
          UnitPrice: priceInfo.unitPrice ?? 0,
          BatchNo: med.BatchNo || `B-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`
        });
        addedCount++;
      }
    });

    setPoForm(prev => ({
      ...prev,
      Items: newItems
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

      const cat = resolveSmartMedicineCategory((row as any).category, matched, null, cleanName);

      if (matched) {
        const priceInfo = getMedicinePriceInfo(matched);
        const unitPrice = (customPrice !== undefined && customPrice >= 0)
          ? customPrice
          : (priceInfo.unitPrice ?? (matched.PurchasePrice ?? matched.Price ?? 0));

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
        const priceInfo = getMedicinePriceInfo({ ItemName: cleanName });
        const unitPrice = (customPrice !== undefined && customPrice >= 0) ? customPrice : (priceInfo.unitPrice ?? 0);
        result.push({
          ItemID: `ITM-${Math.floor(100 + Math.random() * 900)}`,
          ItemName: cleanName,
          Category: cat,
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

  // HANDLERS FOR BULK GRN STOCK INWARD UPLOAD
  const parseAndMatchBulkGrnData = (
    parsedRows: Array<{ name: string; batchNo?: string; mfgDate?: string; expiryDate?: string; price?: number; qty?: number; category?: string }>,
    targetPoId?: string,
    explicitCategoryMappings?: Record<string, string>,
    bypassPrompt: boolean = false
  ) => {
    if (!parsedRows || parsedRows.length === 0) {
      setBulkGrnParsedItems([]);
      return;
    }

    const norm = (s: any) => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');

    // Step 1: Detect unmatched categories in the uploaded file / paste data
    if (!bypassPrompt) {
      const unmatchedMap = new Map<string, { count: number; items: string[] }>();

      parsedRows.forEach((row) => {
        const rawCat = (row.category || '').trim();
        if (rawCat) {
          if (explicitCategoryMappings && explicitCategoryMappings[rawCat]) return;
          const exactOrNorm = medicineCategories.find(c => c.toLowerCase() === rawCat.toLowerCase() || norm(c) === norm(rawCat));
          if (!exactOrNorm) {
            const entry = unmatchedMap.get(rawCat) || { count: 0, items: [] };
            entry.count++;
            if (entry.items.length < 3 && row.name) {
              entry.items.push(row.name.trim());
            }
            unmatchedMap.set(rawCat, entry);
          }
        }
      });

      if (unmatchedMap.size > 0) {
        const promptList = Array.from(unmatchedMap.entries()).map(([catName, data]) => {
          const suggested = resolveSmartMedicineCategory(catName, null, null, catName);
          return {
            originalCategory: catName,
            count: data.count,
            sampleItems: data.items,
            action: 'new' as const,
            mappedTo: (suggested && suggested !== catName) ? suggested : (medicineCategories[0] || 'BM Drops')
          };
        });

        setUnmatchedCategoryDialog({
          isOpen: true,
          unmatchedList: promptList,
          parsedRows,
          targetPoId
        });
        return; // Halt and prompt user!
      }
    }

    const poIdToUse = targetPoId || bulkGrnSelectedPoId || grnForm.POID;
    const selectedPo = purchaseOrders.find(p => p.POID === poIdToUse);
    const poPendingItems = selectedPo ? getPoItemsReceiptInfo(selectedPo) : [];

    const result: typeof bulkGrnParsedItems = [];

    parsedRows.forEach((row) => {
      const cleanName = (row.name || '').trim();
      if (!cleanName) return;

      const normRowName = norm(cleanName);

      // Match against selected PO items first
      const matchedPoItem = poPendingItems.find(pi =>
        (pi.ItemName && norm(pi.ItemName) === normRowName) ||
        (pi.ItemID && norm(pi.ItemID) === normRowName)
      );

      // Match against master inventory items (exact or normalized or relaxed match)
      const matchedInv = (inventoryItems || []).find((inv: any) => {
        const invName = String(inv.ItemName || inv.Name || '').toLowerCase().trim();
        if (invName === cleanName.toLowerCase() || norm(invName) === normRowName) return true;
        // Substring / word match
        const normInv = norm(invName);
        if (normInv.length >= 4 && normRowName.length >= 4) {
          return normInv === normRowName || normInv.startsWith(normRowName) || normRowName.startsWith(normInv);
        }
        return false;
      });

      const orderedQty = matchedPoItem ? matchedPoItem.OrderedQty : (selectedPo?.Items?.find(i => norm(i.ItemName) === normRowName)?.Qty || 0);
      const alreadyRecv = matchedPoItem ? (matchedPoItem.AlreadyReceivedQty || 0) : 0;
      const pendingQty = matchedPoItem ? (matchedPoItem.PendingQty ?? Math.max(0, orderedQty - alreadyRecv)) : 0;

      const parsedQty = row.qty !== undefined && row.qty !== null && !isNaN(Number(row.qty))
        ? Math.max(0, Number(row.qty))
        : (pendingQty > 0 ? pendingQty : 0);

      const parsedPrice = row.price !== undefined && row.price !== null && !isNaN(Number(row.price))
        ? Math.max(0, Number(row.price))
        : (matchedInv?.PurchasePrice ?? matchedInv?.Price ?? 0);

      const todayMonthStr = new Date().toISOString().slice(0, 7);
      const twoYearsMonthStr = new Date(Date.now() + 365 * 2 * 86400000).toISOString().slice(0, 7);

      // Auto-match & select Category strictly with mappings and smart detection
      let matchedCategory = '';
      const rawCat = (row.category || '').trim();
      if (rawCat && explicitCategoryMappings && explicitCategoryMappings[rawCat]) {
        matchedCategory = explicitCategoryMappings[rawCat];
      } else if (rawCat) {
        const exact = medicineCategories.find(c => c.toLowerCase() === rawCat.toLowerCase() || norm(c) === norm(rawCat));
        matchedCategory = exact || rawCat;
      } else {
        matchedCategory = resolveSmartMedicineCategory(
          row.category,
          matchedInv,
          matchedPoItem,
          cleanName
        );
      }

      result.push({
        ItemID: matchedPoItem?.ItemID || matchedInv?.ItemID || `ITM-${Math.floor(100 + Math.random() * 900)}`,
        ItemName: matchedPoItem?.ItemName || matchedInv?.ItemName || cleanName,
        Category: matchedCategory,
        OrderedQty: Number(orderedQty) || 0,
        AlreadyReceivedQty: Number(alreadyRecv) || 0,
        PendingQty: Number(pendingQty) || 0,
        ReceivedQty: parsedQty,
        UnitPrice: parsedPrice,
        MfgDate: toMonthYearInput(row.mfgDate) || todayMonthStr,
        ExpiryDate: toMonthYearInput(row.expiryDate) || twoYearsMonthStr,
        BatchNo: row.batchNo || matchedPoItem?.BatchNo || matchedInv?.BatchNo || `B-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
        isMatchedPo: Boolean(matchedPoItem),
        isMatchedInventory: Boolean(matchedInv),
        stockInHand: matchedInv?.CStock ?? matchedInv?.Stock ?? 0
      });
    });

    setBulkGrnParsedItems(result);
  };

  const handleResolveUnmatchedCategories = () => {
    if (!unmatchedCategoryDialog) return;

    const { unmatchedList, parsedRows, targetPoId } = unmatchedCategoryDialog;
    const mappings: Record<string, string> = {};
    const newCategoriesToAdd: string[] = [];

    unmatchedList.forEach((item) => {
      if (item.action === 'new') {
        const catName = item.originalCategory.trim();
        mappings[item.originalCategory] = catName;
        if (catName && !medicineCategories.some(c => c.toLowerCase() === catName.toLowerCase())) {
          newCategoriesToAdd.push(catName);
        }
      } else {
        mappings[item.originalCategory] = item.mappedTo;
      }
    });

    if (newCategoriesToAdd.length > 0) {
      try {
        const saved = localStorage.getItem('pharmacy_custom_categories');
        let currentCustom: string[] = [];
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) currentCustom = parsed;
        }
        newCategoriesToAdd.forEach((newCat) => {
          if (!currentCustom.some(c => c.toLowerCase() === newCat.toLowerCase())) {
            currentCustom.push(newCat);
          }
        });
        localStorage.setItem('pharmacy_custom_categories', JSON.stringify(currentCustom));
        setCustomCategoryUpdate(prev => prev + 1);
      } catch (err) {
        console.error('Error saving custom categories:', err);
      }
    }

    setUnmatchedCategoryDialog(null);
    parseAndMatchBulkGrnData(parsedRows, targetPoId, mappings, true);
  };

  const handleBulkGrnExcelRead = (file: File) => {
    if (!file) return;
    const fileExt = file.name.split('.').pop()?.toLowerCase();
    if (fileExt !== 'xlsx' && fileExt !== 'xls' && fileExt !== 'csv') {
      setBulkGrnFileError('Invalid file format. Please upload an Excel (.xlsx, .xls) or CSV (.csv) file.');
      return;
    }
    setBulkGrnFileError('');

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
            setBulkGrnFileError('The uploaded sheet is empty.');
            return;
          }

          let nameIdx = 0;
          let batchIdx = -1;
          let mfgIdx = -1;
          let expIdx = -1;
          let priceIdx = -1;
          let qtyIdx = -1;
          let categoryIdx = -1;
          let startRow = 0;

          const firstRow = rawData[0].map(c => String(c || '').toLowerCase().trim());
          const hasHeader = firstRow.some(c =>
            c.includes('item') || c.includes('name') || c.includes('qty') ||
            c.includes('mfg') || c.includes('exp') || c.includes('price') || c.includes('rate') || c.includes('cat') || c.includes('batch')
          );

          if (hasHeader) {
            startRow = 1;
            const foundName = firstRow.findIndex(c => c.includes('item') || c.includes('name') || c.includes('medicine') || c.includes('desc'));
            const foundBatch = firstRow.findIndex(c => c.includes('batch') || c.includes('lot') || c.includes('ref'));
            const foundMfg = firstRow.findIndex(c => c.includes('mfg') || c.includes('mfd') || c.includes('manufactur') || c.includes('prod'));
            const foundExp = firstRow.findIndex(c => c.includes('exp') || c.includes('expiry') || c.includes('expiration') || c.includes('best before'));
            const foundPrice = firstRow.findIndex(c => c.includes('price') || c.includes('rate') || c.includes('cost') || c.includes('unit') || c.includes('tp'));
            const foundQty = firstRow.findIndex(c => c.includes('recv') || c.includes('received') || c.includes('qty') || c.includes('quantity') || c.includes('inward'));
            const foundCategory = firstRow.findIndex(c => c.includes('cat') || c.includes('category') || c.includes('type') || c.includes('group') || c.includes('unit'));

            if (foundName >= 0) nameIdx = foundName;
            if (foundBatch >= 0) batchIdx = foundBatch;
            if (foundMfg >= 0) mfgIdx = foundMfg;
            if (foundExp >= 0) expIdx = foundExp;
            if (foundPrice >= 0) priceIdx = foundPrice;
            if (foundQty >= 0) qtyIdx = foundQty;
            if (foundCategory >= 0) categoryIdx = foundCategory;
          } else {
            // Default 7-column order: Name (0), Batch (1), Mfg (2), Expiry (3), Price (4), QTY (5), Category (6)
            if (rawData[0].length >= 7) {
              nameIdx = 0; batchIdx = 1; mfgIdx = 2; expIdx = 3; priceIdx = 4; qtyIdx = 5; categoryIdx = 6;
            } else if (rawData[0].length === 6) {
              nameIdx = 0; batchIdx = 1; mfgIdx = 2; expIdx = 3; priceIdx = 4; qtyIdx = 5;
            } else if (rawData[0].length === 5) {
              nameIdx = 0; mfgIdx = 1; expIdx = 2; priceIdx = 3; qtyIdx = 4;
            }
          }

          const parsedRows: Array<{ name: string; batchNo?: string; mfgDate?: string; expiryDate?: string; price?: number; qty?: number; category?: string }> = [];
          for (let i = startRow; i < rawData.length; i++) {
            const row = rawData[i];
            if (!row || row.length === 0) continue;
            const nameStr = String(row[nameIdx] || '').trim();
            if (!nameStr) continue;

            const batchStr = batchIdx >= 0 && row[batchIdx] ? String(row[batchIdx]).trim() : undefined;
            const mfgStr = mfgIdx >= 0 && row[mfgIdx] ? String(row[mfgIdx]).trim() : undefined;
            const expStr = expIdx >= 0 && row[expIdx] ? String(row[expIdx]).trim() : undefined;
            const priceRaw = priceIdx >= 0 && row[priceIdx] !== undefined && row[priceIdx] !== null ? parseFloat(String(row[priceIdx])) : NaN;
            const priceVal = !isNaN(priceRaw) ? priceRaw : undefined;
            const qtyVal = qtyIdx >= 0 ? (parseFloat(String(row[qtyIdx] || '0')) || 0) : 0;
            const catStr = categoryIdx >= 0 && row[categoryIdx] ? String(row[categoryIdx]).trim() : undefined;

            parsedRows.push({
              name: nameStr,
              batchNo: batchStr,
              mfgDate: mfgStr,
              expiryDate: expStr,
              price: priceVal,
              qty: qtyVal,
              category: catStr
            });
          }

          parseAndMatchBulkGrnData(parsedRows);
        });
      } catch (err: any) {
        setBulkGrnFileError('Failed to read Excel file: ' + err.message);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleParseBulkGrnText = (text: string) => {
    setBulkGrnRawText(text);
    if (!text.trim()) {
      setBulkGrnParsedItems([]);
      return;
    }

    const lines = text.split(/\r?\n/);
    const parsedRows: Array<{ name: string; batchNo?: string; mfgDate?: string; expiryDate?: string; price?: number; qty?: number; category?: string }> = [];

    const isNumericStr = (s: string) => !isNaN(parseFloat(s)) && isFinite(Number(s));

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

        // Supported order: Item name, batch, mfg, expiry, price, QTY, Category
        let batchNo: string | undefined;
        let mfgDate: string | undefined;
        let expiryDate: string | undefined;
        let priceVal: number | undefined;
        let qtyVal = 0;
        let category: string | undefined;

        if (parts.length >= 7) {
          batchNo = parts[1].trim() || undefined;
          mfgDate = parts[2].trim() || undefined;
          expiryDate = parts[3].trim() || undefined;
          const p = parseFloat(parts[4].trim());
          priceVal = !isNaN(p) ? p : undefined;
          qtyVal = parseFloat(parts[5].trim()) || 0;
          category = parts[6].trim() || undefined;
        } else if (parts.length === 6) {
          const lastCol = parts[5].trim();
          if (!isNumericStr(lastCol) && lastCol.length > 0) {
            batchNo = parts[1].trim() || undefined;
            mfgDate = parts[2].trim() || undefined;
            expiryDate = parts[3].trim() || undefined;
            qtyVal = parseFloat(parts[4].trim()) || 0;
            category = lastCol;
          } else {
            batchNo = parts[1].trim() || undefined;
            mfgDate = parts[2].trim() || undefined;
            expiryDate = parts[3].trim() || undefined;
            const p = parseFloat(parts[4].trim());
            priceVal = !isNaN(p) ? p : undefined;
            qtyVal = parseFloat(parts[5].trim()) || 0;
          }
        } else if (parts.length === 5) {
          const lastCol = parts[4].trim();
          if (!isNumericStr(lastCol) && lastCol.length > 0) {
            batchNo = parts[1].trim() || undefined;
            expiryDate = parts[2].trim() || undefined;
            qtyVal = parseFloat(parts[3].trim()) || 0;
            category = lastCol;
          } else {
            mfgDate = parts[1].trim() || undefined;
            expiryDate = parts[2].trim() || undefined;
            const num1 = parseFloat(parts[3].trim());
            const num2 = parseFloat(parts[4].trim());
            priceVal = !isNaN(num1) ? num1 : undefined;
            qtyVal = !isNaN(num2) ? num2 : 0;
          }
        } else if (parts.length === 4) {
          const lastCol = parts[3].trim();
          if (!isNumericStr(lastCol) && lastCol.length > 0) {
            const p = parseFloat(parts[1].trim());
            const q = parseFloat(parts[2].trim());
            if (!isNaN(p) && !isNaN(q)) {
              priceVal = p;
              qtyVal = q;
            } else {
              batchNo = parts[1].trim() || undefined;
              qtyVal = parseFloat(parts[2].trim()) || 0;
            }
            category = lastCol;
          } else {
            expiryDate = parts[1].trim() || undefined;
            const p = parseFloat(parts[2].trim());
            priceVal = !isNaN(p) ? p : undefined;
            qtyVal = parseFloat(parts[3].trim()) || 0;
          }
        } else if (parts.length === 3) {
          const lastCol = parts[2].trim();
          if (!isNumericStr(lastCol) && lastCol.length > 0) {
            qtyVal = parseFloat(parts[1].trim()) || 0;
            category = lastCol;
          } else {
            qtyVal = parseFloat(parts[1].trim()) || 0;
            const p = parseFloat(parts[2].trim());
            priceVal = !isNaN(p) ? p : undefined;
          }
        } else if (parts.length === 2) {
          const col1 = parts[1].trim();
          if (!isNumericStr(col1) && col1.length > 0) {
            category = col1;
            qtyVal = 0;
          } else {
            qtyVal = parseFloat(col1) || 0;
          }
        }

        parsedRows.push({
          name: col0,
          batchNo,
          mfgDate,
          expiryDate,
          price: priceVal,
          qty: qtyVal,
          category
        });
      }
    });

    parseAndMatchBulkGrnData(parsedRows);
  };

  const handleApplyBulkGrnToForm = () => {
    if (bulkGrnParsedItems.length === 0) return;

    const poIdToUse = bulkGrnSelectedPoId || grnForm.POID;
    const selectedPo = purchaseOrders.find(p => p.POID === poIdToUse);

    const grnItems = bulkGrnParsedItems.map(item => ({
      ItemID: item.ItemID,
      ItemName: item.ItemName,
      OrderedQty: item.OrderedQty,
      AlreadyReceivedQty: item.AlreadyReceivedQty,
      PendingQty: item.PendingQty,
      ReceivedQty: item.ReceivedQty > 0 ? item.ReceivedQty : ('' as any),
      UnitPrice: item.UnitPrice > 0 ? item.UnitPrice : ('' as any),
      LineTotal: (item.ReceivedQty || 0) * (item.UnitPrice || 0),
      BatchNo: item.BatchNo,
      MfgDate: toMonthYearInput(item.MfgDate),
      ExpiryDate: toMonthYearInput(item.ExpiryDate)
    }));

    setGrnForm(prev => ({
      ...prev,
      POID: poIdToUse || prev.POID,
      VendorID: selectedPo?.VendorID || prev.VendorID,
      VendorName: selectedPo?.VendorName || prev.VendorName,
      Items: grnItems
    }));

    setShowUploadBulkGrnModal(false);
    setShowGrnModal(true);
    setSyncMessage(`${grnItems.length} Bulk items loaded into GRN stock inward form!`);
    setTimeout(() => setSyncMessage(null), 4000);
  };

  // Helper to generate guaranteed unique, sequential PO numbers (e.g. PO-1001, PO-1002, etc.)
  const generateNextPoNumber = () => {
    const existingNums = purchaseOrders
      .map(p => {
        const match = String(p.POID || '').match(/PO-(\d+)/i);
        return match ? parseInt(match[1], 10) : 0;
      })
      .filter(n => !isNaN(n) && n > 0);
    const maxNum = existingNums.length > 0 ? Math.max(...existingNums, 1000) : 1000;
    return `PO-${maxNum + 1}`;
  };

  // Helper to check if a Purchase Order has already processed stock / GRNs
  const isPoStockReceivedOrLocked = (po: ErpPurchaseOrder): boolean => {
    if (!po) return false;
    if (po.Status === 'Received' || po.Status === 'Partially Received') return true;
    const hasLinkedGrn = grns.some(g => String(g.POID || '').trim().toLowerCase() === String(po.POID || '').trim().toLowerCase());
    return hasLinkedGrn;
  };

  // Dedicated opener for creating a FRESH new Purchase Order
  const handleOpenNewPoModal = (vendor?: { VendorID?: string; VendorName?: string }) => {
    setEditingPurchaseOrder(null);
    const defaultDelivery = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];
    setPoForm({
      VendorID: vendor?.VendorID || '',
      VendorName: vendor?.VendorName || '',
      ExpectedDeliveryDate: defaultDelivery,
      PaymentMethod: 'Credit',
      Notes: '',
      Items: []
    });
    setMedicineSearchTerm('');
    setPoGridPage(1);
    setShowPoModal(true);
  };

  // Dedicated opener for EDITING an existing Purchase Order (Locked if GRN/Stock processed)
  const handleOpenEditPoModal = (po: ErpPurchaseOrder) => {
    if (isPoStockReceivedOrLocked(po)) {
      alert(`🔒 Locked: Purchase Order ${po.POID} cannot be edited because Goods Received Note (GRN) / Stock inward has already been processed.`);
      return;
    }

    setEditingPurchaseOrder(po);
    setPoForm({
      VendorID: po.VendorID || '',
      VendorName: po.VendorName || '',
      ExpectedDeliveryDate: po.ExpectedDeliveryDate || new Date().toISOString().split('T')[0],
      PaymentMethod: (po.PaymentMethod === 'Cash' || (po as any).PaymentTerms === 'Cash') ? 'Cash' : 'Credit',
      Notes: po.Notes || '',
      Items: (po.Items || []).map(i => ({
        ItemID: i.ItemID || `ITM-${Math.floor(1000 + Math.random() * 9000)}`,
        ItemName: i.ItemName || '',
        Category: i.Category || 'Tablet / Capsule',
        Qty: Number(i.Qty) || 1,
        UnitPrice: Number(i.UnitPrice) || 0,
        BatchNo: i.BatchNo || '',
        ExpiryDate: (i as any).ExpiryDate || ''
      }))
    });
    setMedicineSearchTerm('');
    setPoGridPage(1);
    setShowPoModal(true);
  };

  const handleOpenQuickAddMedModal = (initialName?: string) => {
    setEditingQuickMed(null);
    const rawName = (initialName || medicineSearchTerm || '').trim();
    const suggestedCategory = rawName ? resolveSmartMedicineCategory(undefined, undefined, undefined, rawName) : (poCategoryFilter !== 'all' ? poCategoryFilter : 'BM Drops');
    
    setQuickMedForm({
      ItemName: rawName,
      Category: suggestedCategory,
      Unit: 'Bottle',
      TradePrice: '',
      SalePrice: '',
      MinStock: 10,
      InitialStock: 0,
      RequisitionQty: 10,
      AutoAddToPo: true,
      CustomCategory: ''
    });
    setShowQuickAddMedModal(true);
  };

  const handleOpenEditMedModal = (med: any) => {
    setEditingQuickMed(med);
    const itemName = String(med.ItemName || med.Name || med.title || '').trim();
    const medCat = getMedicineItemCategory(med);
    const isCustomCat = !medicineCategories.includes(medCat);
    const tp = med.TP ?? med.TradePrice ?? med.UnitPrice ?? '';
    const mrp = med.SalePrice ?? med.MRP ?? med.Price ?? '';
    const minStk = (med.MinStock !== undefined && med.MinStock !== null) ? med.MinStock : 10;
    const currStk = med.CStock ?? med.Stock ?? 0;
    const currentPoItem = poForm.Items.find(i => (i.ItemID && i.ItemID === med.ItemID) || i.ItemName === itemName);

    setQuickMedForm({
      ItemName: itemName,
      Category: isCustomCat ? '__custom__' : medCat,
      Unit: med.Unit || 'Bottle',
      TradePrice: tp !== undefined && tp !== null && tp !== '' ? tp : '',
      SalePrice: mrp !== undefined && mrp !== null && mrp !== '' ? mrp : '',
      MinStock: minStk,
      InitialStock: currStk,
      RequisitionQty: currentPoItem ? currentPoItem.Qty : getRequiredQty(med),
      AutoAddToPo: Boolean(currentPoItem),
      CustomCategory: isCustomCat ? medCat : ''
    });
    setShowQuickAddMedModal(true);
  };

  const handleQuickAddMedicine = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = quickMedForm.ItemName.trim();
    if (!cleanName) return alert('Please enter medicine name.');

    const finalCategory = (quickMedForm.Category === '__custom__' && quickMedForm.CustomCategory.trim())
      ? quickMedForm.CustomCategory.trim()
      : quickMedForm.Category;

    const tpPrice = parseFloat(String(quickMedForm.TradePrice || '0')) || 0;
    const mrpPrice = parseFloat(String(quickMedForm.SalePrice || '0')) || 0;
    const minStk = parseFloat(String(quickMedForm.MinStock || '10')) || 10;
    const initStk = parseFloat(String(quickMedForm.InitialStock || '0')) || 0;

    if (editingQuickMed) {
      // EDIT EXISTING MEDICINE IN DATABASE & MASTER INVENTORY
      const targetItemId = editingQuickMed.ItemID || editingQuickMed.id || `ITM-${Math.floor(10000 + Math.random() * 90000)}`;
      const prevName = String(editingQuickMed.ItemName || editingQuickMed.Name || '').trim();

      const updatedItemPayload: any = {
        ...editingQuickMed,
        ItemID: targetItemId,
        ItemName: cleanName,
        Name: cleanName,
        Category: finalCategory,
        Unit: quickMedForm.Unit || editingQuickMed.Unit || 'Bottle',
        TP: tpPrice,
        TradePrice: tpPrice,
        UnitPrice: tpPrice,
        SalePrice: mrpPrice,
        MRP: mrpPrice,
        Price: mrpPrice,
        Stock: initStk,
        CStock: initStk,
        MinStock: minStk,
        updatedAt: new Date().toISOString()
      };

      try {
        // 1. Save / Update to backend database items endpoint
        await fetch(`/api/items/${encodeURIComponent(targetItemId)}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedItemPayload)
        });

        // 2. Update React local inventoryItems state
        setInventoryItems(prev => prev.map(item => {
          if (item.ItemID === targetItemId || (editingQuickMed._id && item._id === editingQuickMed._id)) {
            return updatedItemPayload;
          }
          return item;
        }));

        // 3. Save custom category if new
        if (quickMedForm.Category === '__custom__' && quickMedForm.CustomCategory.trim()) {
          try {
            const saved = localStorage.getItem('pharmacy_custom_categories');
            let currentCustom: string[] = [];
            if (saved) {
              const parsed = JSON.parse(saved);
              if (Array.isArray(parsed)) currentCustom = parsed;
            }
            if (!currentCustom.some(c => c.toLowerCase() === finalCategory.toLowerCase())) {
              currentCustom.push(finalCategory);
              localStorage.setItem('pharmacy_custom_categories', JSON.stringify(currentCustom));
              setCustomCategoryUpdate(prev => prev + 1);
            }
          } catch (errCustom) {
            console.error(errCustom);
          }
        }

        // 4. Update in active PO items if present, or add if checked
        const reqQty = parseFloat(String(quickMedForm.RequisitionQty || '10')) || 10;
        setPoForm(prev => {
          const itemExists = prev.Items.some(i => i.ItemID === targetItemId || i.ItemName.toLowerCase() === prevName.toLowerCase());
          if (itemExists) {
            return {
              ...prev,
              Items: prev.Items.map(i => {
                if (i.ItemID === targetItemId || i.ItemName.toLowerCase() === prevName.toLowerCase()) {
                  return {
                    ...i,
                    ItemName: cleanName,
                    Category: finalCategory,
                    Qty: quickMedForm.AutoAddToPo ? reqQty : i.Qty,
                    UnitPrice: tpPrice > 0 ? tpPrice : i.UnitPrice
                  };
                }
                return i;
              })
            };
          } else if (quickMedForm.AutoAddToPo) {
            return {
              ...prev,
              Items: [
                ...prev.Items,
                {
                  ItemID: targetItemId,
                  ItemName: cleanName,
                  Category: finalCategory,
                  Qty: reqQty,
                  UnitPrice: tpPrice,
                  BatchNo: updatedItemPayload.BatchNo || `B-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`
                }
              ]
            };
          }
          return prev;
        });

        dispatchSafeCustomEvent('phc_db_updated');
        setShowQuickAddMedModal(false);
        setEditingQuickMed(null);
        setSyncMessage(`Medicine "${cleanName}" (${targetItemId}) successfully updated in stock & PO!`);
        setTimeout(() => setSyncMessage(null), 3500);
      } catch (err: any) {
        alert('Failed to update medicine: ' + err.message);
      }
    } else {
      // CREATE BRAND NEW MEDICINE
      const nextItemId = `ITM-${Math.floor(10000 + Math.random() * 90000)}`;

      const newItemPayload: any = {
        ItemID: nextItemId,
        ItemName: cleanName,
        Name: cleanName,
        Category: finalCategory,
        Unit: quickMedForm.Unit || 'Bottle',
        TP: tpPrice,
        TradePrice: tpPrice,
        UnitPrice: tpPrice,
        SalePrice: mrpPrice,
        MRP: mrpPrice,
        Price: mrpPrice,
        Stock: initStk,
        CStock: initStk,
        MinStock: minStk,
        BatchNo: `B-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
        createdAt: new Date().toISOString()
      };

      try {
        // 1. Save to database items collection
        await fetch('/api/items', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newItemPayload)
        });

        // 2. Update React local inventoryItems state
        setInventoryItems(prev => [newItemPayload, ...prev]);

        // If custom category was used, save to localStorage
        if (quickMedForm.Category === '__custom__' && quickMedForm.CustomCategory.trim()) {
          try {
            const saved = localStorage.getItem('pharmacy_custom_categories');
            let currentCustom: string[] = [];
            if (saved) {
              const parsed = JSON.parse(saved);
              if (Array.isArray(parsed)) currentCustom = parsed;
            }
            if (!currentCustom.some(c => c.toLowerCase() === finalCategory.toLowerCase())) {
              currentCustom.push(finalCategory);
              localStorage.setItem('pharmacy_custom_categories', JSON.stringify(currentCustom));
              setCustomCategoryUpdate(prev => prev + 1);
            }
          } catch (e) {
            console.error(e);
          }
        }

        // 3. Automatically add to current PO items if selected
        if (quickMedForm.AutoAddToPo) {
          const reqQty = parseFloat(String(quickMedForm.RequisitionQty || '10')) || 10;
          setPoForm(prev => {
            const existingIdx = prev.Items.findIndex(i => i.ItemID === nextItemId || i.ItemName.toLowerCase() === cleanName.toLowerCase());
            if (existingIdx >= 0) {
              const updated = [...prev.Items];
              updated[existingIdx].Qty = reqQty;
              if (tpPrice > 0) updated[existingIdx].UnitPrice = tpPrice;
              return { ...prev, Items: updated };
            } else {
              return {
                ...prev,
                Items: [
                  ...prev.Items,
                  {
                    ItemID: nextItemId,
                    ItemName: cleanName,
                    Category: finalCategory,
                    Qty: reqQty,
                    UnitPrice: tpPrice,
                    BatchNo: newItemPayload.BatchNo
                  }
                ]
              };
            }
          });
        }

        dispatchSafeCustomEvent('phc_db_updated');
        setShowQuickAddMedModal(false);
        setEditingQuickMed(null);
        setSyncMessage(`Medicine "${cleanName}" (${nextItemId}) created & added to stock list!`);
        setTimeout(() => setSyncMessage(null), 3500);
      } catch (err: any) {
        alert('Failed to save medicine: ' + err.message);
      }
    }
  };

  const handleAddPoItem = () => {
    setPoForm(prev => ({
      ...prev,
      Items: [
        ...prev.Items,
        {
          ItemID: `ITM-${Date.now().toString().slice(-4)}`,
          ItemName: '',
          Category: 'Tablet / Capsule',
          Qty: 1,
          UnitPrice: 0,
          BatchNo: `B-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`
        }
      ]
    }));
  };

  const handleUpdatePoItem = (index: number, field: string, value: any) => {
    setPoForm(prev => {
      const updated = [...prev.Items];
      const current = { ...updated[index], [field]: value };

      // When medicine name is changed or selected, auto-resolve category and fetch latest GRN/Master unit price!
      if (field === 'ItemName') {
        const trimmed = String(value || '').trim();
        const matched = (inventoryItems || []).find((inv: any) => {
          const invName = String(inv.ItemName || inv.Name || '').toLowerCase().trim();
          return invName === trimmed.toLowerCase() || invName.replace(/[^a-z0-9]/g, '') === trimmed.toLowerCase().replace(/[^a-z0-9]/g, '');
        });

        if (matched) {
          current.ItemID = matched.ItemID || current.ItemID;
          current.Category = getMedicineItemCategory(matched);
          const priceInfo = getMedicinePriceInfo(matched);
          if (priceInfo.unitPrice && priceInfo.unitPrice > 0) {
            current.UnitPrice = priceInfo.unitPrice;
          }
          if (matched.BatchNo && !current.BatchNo) {
            current.BatchNo = matched.BatchNo;
          }
        } else if (trimmed) {
          const priceInfo = getMedicinePriceInfo({ ItemName: trimmed });
          if (priceInfo.unitPrice && priceInfo.unitPrice > 0) {
            current.UnitPrice = priceInfo.unitPrice;
          }
        }
      }

      updated[index] = current;
      return { ...prev, Items: updated };
    });
  };

  const handleCreatePo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (!poForm.VendorName) return alert('Please select a supplier / vendor.');
    if (!poForm.Items || poForm.Items.length === 0) return alert('Please select at least one medicine item for the Purchase Order.');

    // If updating, double check lock condition
    if (editingPurchaseOrder && isPoStockReceivedOrLocked(editingPurchaseOrder)) {
      return alert(`🔒 Cannot update: Stock or GRN has already been added for ${editingPurchaseOrder.POID}.`);
    }

    setIsSubmitting(true);
    try {
      const selectedVendor = vendors.find(v => v.VendorName === poForm.VendorName);
      const isEditing = !!editingPurchaseOrder;
      const targetPoId = isEditing ? editingPurchaseOrder.POID : generateNextPoNumber();
      const totalPoValuation = poForm.Items.reduce((sum, i) => sum + ((Number(i.Qty) || 0) * (Number(i.UnitPrice) || 0)), 0);

      const poPayload: ErpPurchaseOrder = {
        ...(editingPurchaseOrder || {}),
        POID: targetPoId,
        VendorID: poForm.VendorID || selectedVendor?.VendorID || (editingPurchaseOrder?.VendorID) || `VND-${Math.floor(100 + Math.random() * 900)}`,
        VendorName: poForm.VendorName,
        OrderDate: isEditing ? (editingPurchaseOrder.OrderDate || new Date().toISOString().split('T')[0]) : new Date().toISOString().split('T')[0],
        ExpectedDeliveryDate: poForm.ExpectedDeliveryDate || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
        TotalAmount: totalPoValuation,
        PaidAmount: isEditing ? (editingPurchaseOrder.PaidAmount || 0) : 0,
        Status: isEditing ? (editingPurchaseOrder.Status || 'Sent') : 'Sent',
        PaymentMethod: poForm.PaymentMethod || 'Credit',
        PaymentTerms: poForm.PaymentMethod || 'Credit',
        Notes: poForm.Notes || '',
        Items: poForm.Items.map(i => ({
          ItemID: i.ItemID,
          ItemName: i.ItemName || 'General Item',
          Category: i.Category || 'General Medicine',
          Qty: Number(i.Qty) || 1,
          UnitPrice: Number(i.UnitPrice || 0),
          LineTotal: (Number(i.Qty) || 0) * (Number(i.UnitPrice) || 0),
          BatchNo: i.BatchNo || `B-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`
        }))
      };

      if (isEditing) {
        // Update existing PO in database
        await saveToDatabase('erp_purchase_orders', poPayload, 'PUT');
        setPurchaseOrders(prev => prev.map(p => p.POID === targetPoId ? poPayload : p));
        setSyncMessage(`Purchase Order ${targetPoId} updated successfully with ${poPayload.Items.length} items!`);
      } else {
        // Create brand new PO
        await saveToDatabase('erp_purchase_orders', poPayload, 'POST');
        setPurchaseOrders(prev => [poPayload, ...prev]);
        setSyncMessage(`New Purchase Order ${targetPoId} created successfully for ${poPayload.VendorName} (${poPayload.PaymentMethod === 'Cash' ? 'Cash Spot' : 'Credit'})!`);
      }

      // Reset form completely for subsequent orders
      setEditingPurchaseOrder(null);
      setPoForm({
        VendorID: '',
        VendorName: '',
        ExpectedDeliveryDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
        PaymentMethod: 'Credit',
        Notes: '',
        Items: []
      });
      setShowPoModal(false);
      setTimeout(() => setSyncMessage(null), 3500);
    } catch (err: any) {
      alert('Error saving Purchase Order: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenPoWhatsAppModal = (po: ErpPurchaseOrder) => {
    // Find vendor phone number
    const targetVendor = vendors.find(v =>
      (po.VendorID && (v.VendorID === po.VendorID || (v as any).SupplierID === po.VendorID)) ||
      (po.VendorName && v.VendorName && v.VendorName.trim().toLowerCase() === po.VendorName.trim().toLowerCase())
    );
    const phone = targetVendor?.Phone || (po as any).VendorPhone || '';
    setSelectedPoForWhatsApp(po);
    setWhatsAppTargetPhone(phone);
    setWhatsAppCustomNote(po.Notes || '');
    setShowWhatsAppPoModal(true);
  };

  const handleSendPoWhatsApp = (includePdfPrint: boolean = false) => {
    if (!selectedPoForWhatsApp) return;

    const cName = clinicSettings?.ClinicName || 'PUNJAB HOMEOPATHIC CLINIC & PHARMACY';
    const cAddress = clinicSettings?.ClinicAddress || '10 Shalimar Road, Garhi Shahu, Lahore';
    const cPhone = clinicSettings?.PhoneMobile || '+92-311-4000608';

    const url = generateWhatsAppPurchaseOrderUrl({
      poId: selectedPoForWhatsApp.POID,
      vendorName: selectedPoForWhatsApp.VendorName,
      vendorPhone: whatsAppTargetPhone,
      orderDate: selectedPoForWhatsApp.OrderDate,
      expectedDeliveryDate: selectedPoForWhatsApp.ExpectedDeliveryDate,
      totalAmount: selectedPoForWhatsApp.TotalAmount,
      paymentMethod: selectedPoForWhatsApp.PaymentMethod || (selectedPoForWhatsApp as any).PaymentTerms,
      items: selectedPoForWhatsApp.Items || [],
      notes: whatsAppCustomNote,
      clinicName: cName,
      clinicAddress: cAddress,
      clinicPhone: cPhone,
      preparedBy: currentUser?.FullName || 'Mr. Zaigham Ali Anjum (Admin)'
    });

    openWhatsAppUrl(url, false);

    if (includePdfPrint) {
      handlePrintPo(selectedPoForWhatsApp);
    }

    setSyncMessage(`Purchase Order ${selectedPoForWhatsApp.POID} shared to WhatsApp!`);
    setTimeout(() => setSyncMessage(null), 3500);
    setShowWhatsAppPoModal(false);
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
    dispatchSafeCustomEvent('phc_db_updated');
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
        ReceivedQty: '' as any, // Empty textbox for physical verification
        UnitPrice: '' as any, // Empty textbox for supplier invoice rate
        LineTotal: 0,
        BatchNo: i.BatchNo || `B-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
        MfgDate: new Date().toISOString().split('T')[0],
        ExpiryDate: new Date(Date.now() + 365 * 2 * 86400000).toISOString().split('T')[0]
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
        PaymentMethod: (po.PaymentMethod === 'Cash' || (po as any).PaymentTerms === 'Cash') ? 'Cash' : 'Credit',
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
          PaymentMethod: 'Credit',
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
        PaymentMethod: (foundPo.PaymentMethod === 'Cash' || (foundPo as any).PaymentTerms === 'Cash') ? 'Cash' : 'Credit',
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

  const handleIncludeGrnItem = (itemToInclude: any) => {
    setGrnForm((prev: any) => {
      const exists = prev.Items.some((i: any) =>
        (itemToInclude.ItemID && i.ItemID && String(i.ItemID).toLowerCase() === String(itemToInclude.ItemID).toLowerCase()) ||
        (itemToInclude.ItemName && i.ItemName && String(i.ItemName).toLowerCase().trim() === String(itemToInclude.ItemName).toLowerCase().trim())
      );
      if (exists) return prev;
      return {
        ...prev,
        Items: [...prev.Items, itemToInclude]
      };
    });
  };

  // Transfer a single unreceived/pending medicine item to a brand new Purchase Order & update old PO status to complete
  const handleTransferGrnItemToNewPo = async (itemToTransfer: any, oldPoId: string) => {
    if (!oldPoId) {
      alert('No Purchase Order selected.');
      return;
    }
    const oldPo = purchaseOrders.find(p => p.POID === oldPoId);
    if (!oldPo) {
      alert(`Purchase Order ${oldPoId} not found.`);
      return;
    }

    const pendingQty = Number(itemToTransfer.PendingQty ?? (itemToTransfer.OrderedQty - (itemToTransfer.AlreadyReceivedQty || 0))) || Number(itemToTransfer.Qty || 1);
    const unitPrice = Number(itemToTransfer.UnitPrice) || Number(itemToTransfer.OriginalUnitPrice) || 0;
    const itemName = itemToTransfer.ItemName || 'Medicine Item';
    const itemId = itemToTransfer.ItemID || '';
    const category = itemToTransfer.Category || getMedicineItemCategory({ ItemID: itemId, ItemName: itemName }) || 'General Medicine';

    // 1. Update Old PO: settle this item (set quantity to what was already received, or remove if 0 received)
    const approvedGrns = grns.filter(g => g.POID === oldPo.POID && (g.Status === 'Approved' || !g.Status));
    
    const updatedOldPoItems = oldPo.Items.map(i => {
      const isMatch = (itemId && i.ItemID && String(itemId).toLowerCase() === String(i.ItemID).toLowerCase()) ||
                      (itemName && i.ItemName && String(itemName).toLowerCase().trim() === String(i.ItemName).toLowerCase().trim());
      if (isMatch) {
        let rec = 0;
        approvedGrns.forEach(g => {
          if (Array.isArray(g.Items)) {
            const gi = g.Items.find(gi => (itemId && gi.ItemID && String(gi.ItemID).toLowerCase() === String(itemId).toLowerCase()) ||
                                          (itemName && gi.ItemName && String(gi.ItemName).toLowerCase().trim() === String(itemName).toLowerCase().trim()));
            if (gi) rec += Number(gi.ReceivedQty || gi.Qty || 0);
          }
        });
        return {
          ...i,
          Qty: rec,
          LineTotal: rec * Number(i.UnitPrice || 0)
        };
      }
      return i;
    }).filter(i => (Number(i.Qty) || 0) > 0);

    const newOldPoTotal = updatedOldPoItems.reduce((sum, i) => sum + ((Number(i.Qty) || 0) * (Number(i.UnitPrice) || 0)), 0);
    
    // Check if any other items remain unreceived in old PO
    const tempOldPo = { ...oldPo, Items: updatedOldPoItems, TotalAmount: newOldPoTotal };
    const remainingPendingInOldPo = getPoItemsReceiptInfo(tempOldPo);
    const updatedStatus = remainingPendingInOldPo.length === 0 ? 'Received' : 'Partially Received';

    const updatedOldPo: ErpPurchaseOrder = {
      ...tempOldPo,
      Status: updatedStatus
    };

    try {
      await saveToDatabase('erp_purchase_orders', updatedOldPo, 'PUT');
      setPurchaseOrders(prev => prev.map(p => p.POID === oldPoId ? updatedOldPo : p));
    } catch (e) {
      console.error('Error updating old PO in DB:', e);
    }

    // 2. Remove item from current GRN form items
    setGrnForm((prev: any) => ({
      ...prev,
      Items: prev.Items.filter((i: any) => {
        const isMatch = (itemId && i.ItemID && String(itemId).toLowerCase() === String(i.ItemID).toLowerCase()) ||
                        (itemName && i.ItemName && String(itemName).toLowerCase().trim() === String(i.ItemName).toLowerCase().trim());
        return !isMatch;
      })
    }));

    // 3. Prepare New Purchase Order in poForm
    const newPoId = generateNextPoNumber();
    const selectedVendor = vendors.find(v => v.VendorName === oldPo.VendorName || v.VendorID === oldPo.VendorID);

    setEditingPurchaseOrder(null);
    setPoForm({
      POID: newPoId,
      VendorID: oldPo.VendorID || selectedVendor?.VendorID || '',
      VendorName: oldPo.VendorName || selectedVendor?.VendorName || '',
      ExpectedDeliveryDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      PaymentMethod: oldPo.PaymentMethod || 'Credit',
      Notes: `Transferred unreceived item "${itemName}" from PO ${oldPoId}`,
      Items: [
        {
          ItemID: itemId || `ITM-${Date.now().toString().slice(-4)}`,
          ItemName: itemName,
          Category: category,
          Qty: pendingQty > 0 ? pendingQty : 1,
          UnitPrice: unitPrice,
          LineTotal: (pendingQty > 0 ? pendingQty : 1) * unitPrice,
          BatchNo: itemToTransfer.BatchNo || `B-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`
        }
      ]
    });

    // Close GRN Modal & Open PO Modal
    setShowGrnModal(false);
    setShowPoModal(true);
    setMedicineSearchTerm('');
    setPoGridPage(1);

    setSyncMessage(`Medicine "${itemName}" (Qty: ${pendingQty}) transferred to New Purchase Order (${newPoId})! Old PO ${oldPoId} status updated.`);
    setTimeout(() => setSyncMessage(null), 5000);
  };

  // Transfer ALL unreceived/pending medicine items to a brand new Purchase Order & mark old PO Complete
  const handleTransferAllUnreceivedToNewPo = async (oldPoId: string) => {
    if (!oldPoId) {
      alert('No Purchase Order selected.');
      return;
    }
    const oldPo = purchaseOrders.find(p => p.POID === oldPoId);
    if (!oldPo) {
      alert(`Purchase Order ${oldPoId} not found.`);
      return;
    }

    const pendingItemsInfo = getPoItemsReceiptInfo(oldPo);
    if (pendingItemsInfo.length === 0) {
      alert('No unreceived or pending items found for this Purchase Order.');
      return;
    }

    const approvedGrns = grns.filter(g => g.POID === oldPo.POID && (g.Status === 'Approved' || !g.Status));

    // 1. Update Old PO: keep only the already-received quantities and mark status Complete
    const updatedOldPoItems = oldPo.Items.map(i => {
      let rec = 0;
      approvedGrns.forEach(g => {
        if (Array.isArray(g.Items)) {
          const gi = g.Items.find(gi => (i.ItemID && gi.ItemID && String(gi.ItemID).toLowerCase() === String(i.ItemID).toLowerCase()) ||
                                        (i.ItemName && gi.ItemName && String(gi.ItemName).toLowerCase().trim() === String(i.ItemName).toLowerCase().trim()));
          if (gi) rec += Number(gi.ReceivedQty || gi.Qty || 0);
        }
      });
      return {
        ...i,
        Qty: rec,
        LineTotal: rec * Number(i.UnitPrice || 0)
      };
    }).filter(i => (Number(i.Qty) || 0) > 0);

    const newOldPoTotal = updatedOldPoItems.reduce((sum, i) => sum + ((Number(i.Qty) || 0) * (Number(i.UnitPrice) || 0)), 0);

    const updatedOldPo: ErpPurchaseOrder = {
      ...oldPo,
      Items: updatedOldPoItems,
      TotalAmount: newOldPoTotal,
      Status: 'Received' // Mark old PO Complete
    };

    try {
      await saveToDatabase('erp_purchase_orders', updatedOldPo, 'PUT');
      setPurchaseOrders(prev => prev.map(p => p.POID === oldPoId ? updatedOldPo : p));
    } catch (e) {
      console.error('Error updating old PO in DB:', e);
    }

    // 2. Prepare items for New PO
    const newPoId = generateNextPoNumber();
    const selectedVendor = vendors.find(v => v.VendorName === oldPo.VendorName || v.VendorID === oldPo.VendorID);

    const transferredItems = pendingItemsInfo.map(item => {
      const pQty = Number(item.PendingQty) || 1;
      const uPrice = Number(item.UnitPrice) || Number((item as any).OriginalUnitPrice) || 0;
      return {
        ItemID: item.ItemID || `ITM-${Date.now().toString().slice(-4)}`,
        ItemName: item.ItemName || 'Medicine Item',
        Category: (item as any).Category || getMedicineItemCategory({ ItemID: item.ItemID, ItemName: item.ItemName }) || 'General Medicine',
        Qty: pQty,
        UnitPrice: uPrice,
        LineTotal: pQty * uPrice,
        BatchNo: item.BatchNo || `B-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`
      };
    });

    setEditingPurchaseOrder(null);
    setPoForm({
      POID: newPoId,
      VendorID: oldPo.VendorID || selectedVendor?.VendorID || '',
      VendorName: oldPo.VendorName || selectedVendor?.VendorName || '',
      ExpectedDeliveryDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      PaymentMethod: oldPo.PaymentMethod || 'Credit',
      Notes: `Transferred unreceived items from PO ${oldPoId}`,
      Items: transferredItems
    });

    setShowGrnModal(false);
    setShowPoModal(true);
    setMedicineSearchTerm('');
    setPoGridPage(1);

    setSyncMessage(`${transferredItems.length} unreceived medicines transferred to New Purchase Order (${newPoId})! Old PO ${oldPoId} marked complete.`);
    setTimeout(() => setSyncMessage(null), 5000);
  };

  // Delete/cancel unreceived medicine item from Purchase Order & update PO status
  const handleDeleteGrnItemFromPo = async (itemToDelete: any, oldPoId: string) => {
    if (!oldPoId) {
      alert('No Purchase Order selected.');
      return;
    }
    const itemName = itemToDelete.ItemName || 'Medicine Item';
    const itemId = itemToDelete.ItemID || '';

    const confirmDelete = window.confirm(
      `Are you sure you want to cancel / delete "${itemName}" from Purchase Order ${oldPoId}?\n\nThis unreceived item will be removed from the PO and old PO status will update.`
    );
    if (!confirmDelete) return;

    const oldPo = purchaseOrders.find(p => p.POID === oldPoId);
    if (!oldPo) return;

    const approvedGrns = grns.filter(g => g.POID === oldPo.POID && (g.Status === 'Approved' || !g.Status));

    // Update old PO by dropping unreceived portion of this item
    const updatedOldPoItems = oldPo.Items.map(i => {
      const isMatch = (itemId && i.ItemID && String(itemId).toLowerCase() === String(i.ItemID).toLowerCase()) ||
                      (itemName && i.ItemName && String(itemName).toLowerCase().trim() === String(i.ItemName).toLowerCase().trim());
      if (isMatch) {
        let rec = 0;
        approvedGrns.forEach(g => {
          if (Array.isArray(g.Items)) {
            const gi = g.Items.find(gi => (itemId && gi.ItemID && String(gi.ItemID).toLowerCase() === String(itemId).toLowerCase()) ||
                                          (itemName && gi.ItemName && String(gi.ItemName).toLowerCase().trim() === String(itemName).toLowerCase().trim()));
            if (gi) rec += Number(gi.ReceivedQty || gi.Qty || 0);
          }
        });
        return {
          ...i,
          Qty: rec,
          LineTotal: rec * Number(i.UnitPrice || 0)
        };
      }
      return i;
    }).filter(i => (Number(i.Qty) || 0) > 0);

    const newOldPoTotal = updatedOldPoItems.reduce((sum, i) => sum + ((Number(i.Qty) || 0) * (Number(i.UnitPrice) || 0)), 0);

    // Recalculate if any items remain pending in old PO
    const tempOldPo = { ...oldPo, Items: updatedOldPoItems, TotalAmount: newOldPoTotal };
    const remainingPending = getPoItemsReceiptInfo(tempOldPo);
    const newStatus = remainingPending.length === 0 ? 'Received' : 'Partially Received';

    const updatedOldPo: ErpPurchaseOrder = {
      ...tempOldPo,
      Status: newStatus
    };

    try {
      await saveToDatabase('erp_purchase_orders', updatedOldPo, 'PUT');
      setPurchaseOrders(prev => prev.map(p => p.POID === oldPoId ? updatedOldPo : p));
    } catch (e) {
      console.error('Error updating old PO in DB:', e);
    }

    // Remove from current GRN form items
    setGrnForm((prev: any) => ({
      ...prev,
      Items: prev.Items.filter((i: any) => {
        const isMatch = (itemId && i.ItemID && String(itemId).toLowerCase() === String(i.ItemID).toLowerCase()) ||
                        (itemName && i.ItemName && String(itemName).toLowerCase().trim() === String(i.ItemName).toLowerCase().trim());
        return !isMatch;
      })
    }));

    setSyncMessage(`Medicine "${itemName}" deleted/cancelled from PO ${oldPoId}. Status: ${newStatus === 'Received' ? 'Complete (All Received)' : 'Partially Received'}.`);
    setTimeout(() => setSyncMessage(null), 4000);
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
    const isCashPurchase = grnForm.PaymentMethod === 'Cash';

    const payload = {
      ...grnForm,
      PaymentMethod: isCashPurchase ? 'Cash' : 'Credit',
      PaymentStatus: isCashPurchase ? 'Paid' : 'Unpaid',
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
          PaymentMethod: isCashPurchase ? 'Cash' : 'Credit',
          PaymentStatus: isCashPurchase ? 'Paid' : 'Unpaid',
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
            LineTotal: Number(i.ReceivedQty) * Number(i.UnitPrice)
          }))
        };

        setGrns(prev => [newGrnRecord, ...prev]);

        // If cash purchase, also inject immediate cash voucher into local transactions state
        if (isCashPurchase && totalAmount > 0) {
          const autoCashVoucher: ErpTransaction = {
            TransactionID: `TXN-PAY-${Date.now().toString().slice(-4)}`,
            Type: 'VendorPayment',
            Category: 'Medicine Purchase (Cash Spot Payment)',
            Description: `Spot Cash Payment on Delivery for GRN (${payload.GRNID}) - Invoice #${payload.SupplierInvoiceNo || 'N/A'} - ${payload.VendorName || 'Vendor'}`,
            Amount: totalAmount,
            PaymentMethod: 'Cash',
            ReferenceNo: payload.GRNID,
            Date: payload.ReceivedDate,
            CreatedBy: payload.CreatedBy,
            VendorID: payload.VendorID,
            VendorName: payload.VendorName
          };
          setTransactions(prev => [autoCashVoucher, ...prev]);
        }

        // Re-fetch inventory items, vendors & transactions to show updated stock & balances immediately
        const [itemsRes, vendorsRes, txnsRes] = await Promise.all([
          safeFetchJson('/api/items'),
          safeFetchJson('/api/query/erp_vendors'),
          safeFetchJson('/api/query/erp_transactions')
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
              const newBatch = {
                BatchID: `${inv.ItemID}-${matched.BatchNo || 'B' + Date.now().toString().slice(-4)}`,
                ItemID: inv.ItemID,
                ItemName: inv.ItemName,
                BatchNo: matched.BatchNo || `B-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
                MfgDate: toMonthYearInput(matched.MfgDate) || '',
                ExpDate: toMonthYearInput(matched.ExpiryDate || matched.ExpDate) || '',
                PurchasePrice: uPrice > 0 ? uPrice : inv.PurchasePrice,
                SalePrice: inv.Price,
                Qty: qtyRec,
                InitialQty: qtyRec,
                GRNID: payload.GRNID,
                POID: payload.POID,
                VendorName: payload.VendorName,
                ReceivedDate: payload.ReceivedDate,
                Status: 'ACTIVE' as const,
                CreatedAt: new Date().toISOString()
              };
              const existingBatches = Array.isArray(inv.Batches) ? inv.Batches : [];
              return {
                ...inv,
                CStock: (Number(inv.CStock) || 0) + qtyRec,
                PurchasePrice: uPrice > 0 ? uPrice : inv.PurchasePrice,
                BatchNo: matched.BatchNo || inv.BatchNo,
                MfgDate: toMonthYearInput(matched.MfgDate) || inv.MfgDate,
                ExpDate: toMonthYearInput(matched.ExpiryDate || matched.ExpDate) || inv.ExpDate,
                Batches: [newBatch, ...existingBatches]
              };
            }
            return inv;
          }));
        }
        if (Array.isArray(vendorsRes) && vendorsRes.length > 0) {
          setVendors(vendorsRes);
        } else if (!isCashPurchase && (payload.VendorID || payload.VendorName)) {
          setVendors(prev => prev.map(v => (v.VendorID === payload.VendorID || v.VendorName === payload.VendorName) ? { ...v, Balance: (v.Balance || 0) + totalAmount } : v));
        }

        if (Array.isArray(txnsRes) && txnsRes.length > 0) {
          setTransactions(txnsRes);
        }

        setShowGrnModal(false);
        setSyncMessage(isCashPurchase
          ? `GRN ${payload.GRNID} approved as CASH purchase! Rs. ${totalAmount.toLocaleString()} expensed in Clinic Cash Book & stock updated.`
          : `GRN ${payload.GRNID} approved as CREDIT purchase! Rs. ${totalAmount.toLocaleString()} added to Vendor Payable ledger & stock updated.`);
        setTimeout(() => setSyncMessage(null), 3500);
        dispatchSafeCustomEvent('phc_db_updated');
      } else {
        alert(data.error || 'Failed to approve GRN.');
      }
    } catch (err) {
      console.error('GRN approval error:', err);
      alert('Network error while processing GRN approval.');
    } finally {
      setIsSubmitting(false);
      setLoading(false);
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
      dispatchSafeCustomEvent('phc_db_updated');
    } catch (err: any) {
      console.error('Error deleting GRN:', err);
      alert(`Error deleting GRN: ${err.message || 'Unknown error'}`);
    }
  };

  const handleOpenGrnPrintPreview = (grn: ErpGrn) => {
    setGrnPrintPreviewData(grn);
    setShowGrnPrintPreviewModal(true);
  };

  const handlePreviewCurrentGrnForm = () => {
    if (!grnForm.Items || grnForm.Items.length === 0) {
      alert('Please add or select at least one medicine item to preview GRN.');
      return;
    }
    const previewGrnObj: ErpGrn = {
      GRNID: grnForm.GRNID || `GRN-${Math.floor(1000 + Math.random() * 9000)}`,
      POID: grnForm.POID || 'PO-DIRECT',
      VendorID: grnForm.VendorID || '',
      VendorName: grnForm.VendorName || 'Selected Supplier',
      ReceivedDate: grnForm.ReceivedDate || new Date().toISOString().split('T')[0],
      ChallanNo: grnForm.ChallanNo,
      SupplierInvoiceNo: grnForm.SupplierInvoiceNo,
      Remarks: grnForm.Remarks,
      CreatedBy: currentUser?.FullName || 'Warehouse Officer',
      TotalAmount: grnForm.Items.reduce((acc, i) => acc + ((Number(i.ReceivedQty) || 0) * (Number(i.UnitPrice) || 0)), 0),
      Status: 'Draft',
      Items: grnForm.Items.map(i => ({
        ItemID: i.ItemID,
        ItemName: i.ItemName,
        OrderedQty: Number(i.OrderedQty) || 0,
        ReceivedQty: Number(i.ReceivedQty) || 0,
        UnitPrice: Number(i.UnitPrice) || 0,
        LineTotal: (Number(i.ReceivedQty) || 0) * (Number(i.UnitPrice) || 0),
        BatchNo: i.BatchNo,
        MfgDate: i.MfgDate,
        ExpiryDate: i.ExpiryDate
      }))
    };
    setGrnPrintPreviewData(previewGrnObj);
    setShowGrnPrintPreviewModal(true);
  };

  const handlePrintGrn = (grn: ErpGrn) => {
    handleOpenGrnPrintPreview(grn);
  };

  const handleLegacyPrintGrn = (grn: ErpGrn) => {
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
    const cPhone = clinicSettings?.PhoneMobile || '+92-311-4000608';
    const cWebsite = clinicSettings?.Website || 'https://punjabhomeopathic.pk';
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
                <div class="addr">📍 ${cAddr} &nbsp;|&nbsp; 📞 ${cPhone} &nbsp;|&nbsp; 🌐 ${cWebsite.replace(/^https?:\/\//, '')}</div>
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
              <span>Punjab Homeopathic Clinic & Pharmacy • 🌐 ${cWebsite.replace(/^https?:\/\//, '')} • 📞 Helpline: ${cPhone}</span>
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
    const cPhone = clinicSettings?.PhoneMobile || '+92-311-4000608';
    const cWebsite = clinicSettings?.Website || 'https://punjabhomeopathic.pk';
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
                <div class="addr">📍 ${cAddr} &nbsp;|&nbsp; 📞 ${cPhone} &nbsp;|&nbsp; 🌐 <a href="${cWebsite}" target="_blank" style="color: #2563eb; text-decoration: underline;">${cWebsite.replace(/^https?:\/\//, '')}</a></div>
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
              <span>Punjab Homeopathic Clinic & Pharmacy • 🌐 <a href="${cWebsite}" target="_blank" style="color: #2563eb; text-decoration: underline;">${cWebsite.replace(/^https?:\/\//, '')}</a> • 📞 Helpline: ${cPhone}</span>
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
      const isCash = paymentMethod === 'Cash';
      const defaultCat = isCash ? 'Spot Cash Vendor Payment' : 'Supplier Credit Bill Payment';
      const newTxn: ErpTransaction = {
        TransactionID: `TXN-${Math.floor(10000 + Math.random() * 90000)}`,
        Type: 'VendorPayment',
        Category: category || defaultCat,
        Description: description || `Payment against Vendor Invoice #${invNo.trim()} for ${vendor.VendorName} (${isCash ? 'Cash Payment' : 'Credit Settlement'})`,
        Amount: Number(amount),
        PaymentMethod: paymentMethod || (isCash ? 'Cash' : 'Bank'),
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

  // CASH BOOK LEDGER DELETE HANDLER
  const handleDeleteCashBookEntry = async (entry: any) => {
    if (!entry) return;
    const confirmMsg = `Are you sure you want to delete this Cash Book entry?\n\nRef: ${entry.ref || entry.id}\nParticulars: ${entry.particulars}\nAmount: PKR ${(entry.amount || 0).toLocaleString()}\n\nThis will remove the transaction record from the database and update all Cash Book & P&L calculations.`;
    if (!window.confirm(confirmMsg)) return;

    setIsSubmitting(true);
    try {
      const entryId = (entry.id || '').toString();
      const entryRef = (entry.ref || '').toString();
      const rawExpId = entryId.replace(/^EXP-/, '');
      const rawPayId = entryId.replace(/^PAY-/, '');
      const rawTxId = entryId.replace(/^TXN-/, '');
      const rawAppId = entryId.replace(/^APP-/, '').replace(/^TOKEN-/, '');
      const rawVisId = entryId.replace(/^VIS-(CONS|CLIN|FILE|CARD)-/, '').replace(/^VISIT-/, '').replace(/^PV-/, '').replace(/^FILE-/, '').replace(/^CARD-/, '');
      const rawSaleId = entryId.replace(/^SALE-/, '').replace(/^INV-/, '');

      let deletedSomething = false;

      // 1. If Expense entry or source === 'Expenses'
      const matchedExpense = expenses.find(e => {
        const expId = (e.ExpenseID || e._id || '').toString();
        return expId === entryId || expId === entryRef || expId === rawExpId || entryId === `EXP-${expId}`;
      });
      if (matchedExpense) {
        const targetId = matchedExpense._id || matchedExpense.ExpenseID;
        await deleteFromDatabase('erp_expenses', targetId);
        setExpenses(prev => prev.filter(e => (e._id ? e._id !== targetId : e.ExpenseID !== targetId)));
        deletedSomething = true;
      }

      // 2. If Payroll entry or source === 'Payroll'
      const matchedPayroll = payrolls.find(p => {
        const pId = (p.PayrollID || p._id || '').toString();
        return pId === entryId || pId === entryRef || pId === rawPayId || entryId === `PAY-${pId}`;
      });
      if (matchedPayroll) {
        const targetId = matchedPayroll._id || matchedPayroll.PayrollID;
        await deleteFromDatabase('erp_payroll', targetId);
        setPayrolls(prev => prev.filter(p => (p._id ? p._id !== targetId : p.PayrollID !== targetId)));
        deletedSomething = true;
      }

      // 3. If ERP Transaction entry or linked to transaction
      const matchedTxn = transactions.find(t => {
        const tId = (t.TransactionID || t._id || '').toString();
        const refNo = (t.ReferenceNo || '').toString();
        return tId === entryId || tId === entryRef || tId === rawTxId || refNo === entryId || refNo === entryRef || refNo === rawExpId || refNo === rawPayId;
      });
      if (matchedTxn) {
        const targetId = matchedTxn._id || matchedTxn.TransactionID;
        await deleteFromDatabase('erp_transactions', targetId);
        setTransactions(prev => prev.filter(t => (t._id ? t._id !== targetId : t.TransactionID !== targetId)));
        deletedSomething = true;
      }

      // 4. If Appointment entry
      const matchedApp = appointments.find(a => {
        const aId = (a.AppointmentID || a._id || '').toString();
        return aId === entryId || aId === entryRef || aId === rawAppId;
      });
      if (matchedApp) {
        const targetId = matchedApp._id || matchedApp.AppointmentID;
        await deleteFromDatabase('appointments', targetId);
        try {
          await fetch(`/api/appointments/${targetId}`, { method: 'DELETE' });
        } catch (e) {}
        setAppointments(prev => prev.filter(a => (a._id ? a._id !== targetId : a.AppointmentID !== targetId)));
        deletedSomething = true;
      }

      // 5. If Patient Visit entry
      const matchedVis = patientVisits.find(v => {
        const vId = (v.VisitID || v._id || '').toString();
        return vId === entryId || vId === rawVisId;
      });
      if (matchedVis) {
        const targetId = matchedVis._id || matchedVis.VisitID;
        await deleteFromDatabase('visits', targetId);
        try {
          await fetch(`/api/visits/${targetId}`, { method: 'DELETE' });
        } catch (e) {}
        setPatientVisits(prev => prev.filter(v => (v._id ? v._id !== targetId : v.VisitID !== targetId)));
        deletedSomething = true;
      }

      // 6. If POS Sale entry
      const matchedSale = posSales.find(s => {
        const sId = (s.InvoiceNo || s.SaleID || s._id || '').toString();
        return sId === entryId || sId === rawSaleId || sId === entryRef;
      });
      if (matchedSale) {
        const targetId = matchedSale._id || matchedSale.InvoiceNo || matchedSale.SaleID;
        await deleteFromDatabase('invoices', targetId);
        try {
          await fetch(`/api/billing/invoices/${targetId}`, { method: 'DELETE' });
        } catch (e) {}
        setPosSales(prev => prev.filter(s => (s._id ? s._id !== targetId : (s.InvoiceNo !== targetId && s.SaleID !== targetId))));
        deletedSomething = true;
      }

      // If generic fallback or ID wasn't matched above
      if (!deletedSomething) {
        if (entryId.startsWith('EXP-') || entry.source === 'Expenses') {
          await deleteFromDatabase('erp_expenses', entryId);
          setExpenses(prev => prev.filter(e => (e.ExpenseID !== entryId && e._id !== entryId)));
        } else if (entryId.startsWith('PAY-') || entry.source === 'Payroll') {
          await deleteFromDatabase('erp_payroll', entryId);
          setPayrolls(prev => prev.filter(p => (p.PayrollID !== entryId && p._id !== entryId)));
        } else {
          await deleteFromDatabase('erp_transactions', entryId);
          setTransactions(prev => prev.filter(t => (t.TransactionID !== entryId && t._id !== entryId)));
        }
      }

      dispatchSafeCustomEvent('phc_db_updated');
      setSyncMessage(`Cash Book record "${entry.ref || entry.id}" deleted successfully.`);
      setTimeout(() => setSyncMessage(null), 3500);
    } catch (err: any) {
      alert('Error deleting cash book entry: ' + (err.message || err));
    } finally {
      setIsSubmitting(false);
    }
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

    const isCashOrder = String(po.PaymentMethod || (po as any).PaymentTerms || '').trim().toLowerCase() === 'cash';
    const poBannerTitle = isCashOrder ? 'Cash Order PO' : 'Credit Order PO';
    const poOfficialBannerText = isCashOrder ? 'OFFICIAL CASH ORDER PO' : 'OFFICIAL CREDIT ORDER PO';
    const poHeaderColor = isCashOrder ? '#047857' : '#1e1b4b';
    const poBadgeBg = isCashOrder ? '#d1fae5' : '#e0e7ff';
    const poBadgeText = isCashOrder ? '#065f46' : '#3730a3';

    // Find all GRNs recorded for this Purchase Order
    const poGrns = (grns || []).filter(
      g => (g.POID === po.POID || (g as any).PoID === po.POID) && g.Status !== 'Cancelled'
    );
    const hasGrns = poGrns.length > 0;

    // Collect all unique Supplier / Vendor Invoice Numbers linked to this PO via GRNs
    const supplierInvoiceNumbers = Array.from(new Set(
      poGrns.map(g => (g.SupplierInvoiceNo || g.VendorInvoiceNo || g.ChallanNo || '').trim()).filter(Boolean)
    ));

    // Resolve matching Vendor profile
    const targetVendor = vendors.find(v => 
      (po.VendorID && (v.VendorID === po.VendorID || (v as any).SupplierID === po.VendorID)) ||
      (po.VendorName && v.VendorName && v.VendorName.trim().toLowerCase() === po.VendorName.trim().toLowerCase())
    );

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

    // Calculate Total PO Value & Total GRN Invoiced Value for this PO
    const poTotalAmount = Number(po.TotalAmount || 0);
    const grnTotalAmount = poGrns.reduce((sum, g) => sum + Number(g.TotalAmount || 0), 0);
    const effectivePoBilledValue = grnTotalAmount > 0 ? grnTotalAmount : poTotalAmount;

    // Find all payment transactions linked to this PO or its GRN Supplier Invoice Numbers
    const poPayments = (transactions || []).filter(t => {
      const isVendorMatch = targetVendor 
        ? (t.VendorID === targetVendor.VendorID || (t.VendorName && t.VendorName.toLowerCase() === targetVendor.VendorName.toLowerCase()))
        : (po.VendorID && t.VendorID === po.VendorID) || (po.VendorName && t.VendorName && t.VendorName.toLowerCase() === po.VendorName.toLowerCase());
      
      const isPay = t.Type === 'VendorPayment' || t.Category === 'Vendor Payment' || (t.Type === 'Expense' && (t.VendorID || t.VendorName));
      if (!isPay) return false;

      // Match by PO ID or Supplier Invoice Number
      const ref = (t.ReferenceNo || '').trim();
      const desc = (t.Description || '').trim();
      const matchesPo = ref === po.POID || desc.includes(po.POID);
      const matchesInvoice = supplierInvoiceNumbers.length > 0 && supplierInvoiceNumbers.some(inv => ref === inv || desc.includes(inv));
      
      return matchesPo || matchesInvoice;
    });

    const totalPoPaymentsPaid = poPayments.reduce((sum, t) => sum + Number(t.Amount || 0), 0);
    const pendingPoDues = Math.max(0, effectivePoBilledValue - totalPoPaymentsPaid);

    // Vendor overall ledger dues (if vendor found)
    const vendorTotalOutstandingBalance = targetVendor ? Number(targetVendor.Balance || 0) : pendingPoDues;

    const totalItems = po.Items.length;
    const colSize = Math.max(1, Math.ceil(totalItems / 3));

    const col1Items = po.Items.slice(0, colSize);
    const col2Items = po.Items.slice(colSize, colSize * 2);
    const col3Items = po.Items.slice(colSize * 2);

    const renderColumnTable = (items: typeof po.Items, startIdx: number) => {
      if (!items || items.length === 0) return `<div style="flex: 1;"></div>`;

      const rowsHtml = items.map((item, idx) => {
        const itemKey = (item.ItemID || item.ItemName || '').trim();
        const itemKeyName = (item.ItemName || '').trim();
        const recQty = (receivedQtyMap[itemKey] || receivedQtyMap[itemKeyName] || 0);

        if (hasGrns) {
          return `
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="text-align: center; border: 1px solid #cbd5e1; padding: 4px; font-weight: bold; color: #475569; width: 22px;">${startIdx + idx + 1}</td>
              <td style="border: 1px solid #cbd5e1; padding: 4px; font-weight: bold; color: #0f172a;">
                ${item.ItemName}
                ${item.Category ? `<div style="font-size: 8px; color: #4338ca; font-weight: 600; margin-top: 1px;">Cat: ${item.Category}</div>` : ''}
              </td>
              <td style="text-align: center; border: 1px solid #cbd5e1; padding: 4px; font-weight: bold; color: #0284c7; width: 36px; background: #f0f9ff;">${item.Qty}</td>
              <td style="text-align: center; border: 1px solid #cbd5e1; padding: 4px; font-weight: 800; color: ${recQty > 0 ? '#047857' : '#94a3b8'}; width: 36px; background: ${recQty > 0 ? '#ecfdf5' : '#ffffff'};">${recQty}</td>
            </tr>
          `;
        }

        return `
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="text-align: center; border: 1px solid #cbd5e1; padding: 5px; font-weight: bold; color: #475569; width: 24px;">${startIdx + idx + 1}</td>
            <td style="border: 1px solid #cbd5e1; padding: 5px; font-weight: bold; color: #0f172a;">
              ${item.ItemName}
              ${item.Category ? `<div style="font-size: 8.5px; color: #4338ca; font-weight: 600; margin-top: 1px;">Cat: ${item.Category}</div>` : ''}
            </td>
            <td style="text-align: center; border: 1px solid #cbd5e1; padding: 5px; font-weight: bold; color: #0284c7; width: 50px; background: #f0f9ff;">${item.Qty}</td>
          </tr>
        `;
      }).join('');

      return `
        <div style="flex: 1; min-width: 0;">
          <table style="width: 100%; border-collapse: collapse; font-size: 10.5px;">
            <thead>
              <tr style="background: #1e293b; color: #ffffff;">
                <th style="border: 1px solid #334155; padding: 5px; text-align: center; width: 22px; font-size: 8.5px; text-transform: uppercase;">#</th>
                <th style="border: 1px solid #334155; padding: 5px; text-align: left; font-size: 8.5px; text-transform: uppercase;">Medicine Name</th>
                <th style="border: 1px solid #334155; padding: 5px; text-align: center; width: ${hasGrns ? '36px' : '50px'}; font-size: 8.5px; text-transform: uppercase; background: #0369a1;">ORD</th>
                ${hasGrns ? `
                  <th style="border: 1px solid #334155; padding: 5px; text-align: center; width: 36px; font-size: 8.5px; text-transform: uppercase; background: #047857;">REC</th>
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
    const col3Html = renderColumnTable(col3Items, colSize * 2);

    // Build Payments Settlement Table if any payments recorded against this PO
    let paymentHistoryHtml = '';
    if (poPayments.length > 0) {
      const payRows = poPayments.map((p, pIdx) => `
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 4px 6px; border: 1px solid #cbd5e1; text-align: center; font-weight: bold; color: #64748b;">${pIdx + 1}</td>
          <td style="padding: 4px 6px; border: 1px solid #cbd5e1; font-family: monospace; font-weight: bold; color: #334155;">${p.Date || 'N/A'}</td>
          <td style="padding: 4px 6px; border: 1px solid #cbd5e1; font-family: monospace; font-weight: bold; color: #4338ca;">${p.TransactionID || 'N/A'}</td>
          <td style="padding: 4px 6px; border: 1px solid #cbd5e1; font-family: monospace; font-weight: bold; color: #0369a1;">${p.ReferenceNo || 'N/A'}</td>
          <td style="padding: 4px 6px; border: 1px solid #cbd5e1; color: #334155;">${p.Description || 'Payment Voucher Recorded'}</td>
          <td style="padding: 4px 6px; border: 1px solid #cbd5e1; text-align: center; font-weight: 700; color: #475569;">${p.PaymentMethod || 'Bank'}</td>
          <td style="padding: 4px 6px; border: 1px solid #cbd5e1; text-align: right; font-family: monospace; font-weight: 900; color: #047857;">Rs. ${Number(p.Amount || 0).toLocaleString()}</td>
        </tr>
      `).join('');

      paymentHistoryHtml = `
        <div style="margin-top: 14px; border: 1.5px solid #4338ca; border-radius: 8px; overflow: hidden; background: #eef2ff;">
          <div style="background: #4338ca; color: #ffffff; padding: 6px 12px; font-weight: 900; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; display: flex; justify-content: space-between; align-items: center;">
            <span>💳 BILL PAYMENTS & SETTLEMENT HISTORY (RECORDED PAYMENTS)</span>
            <span>${poPayments.length} Payment Voucher(s) Paid</span>
          </div>
          <div style="padding: 8px; background: #ffffff;">
            <table style="width: 100%; border-collapse: collapse; font-size: 10px;">
              <thead>
                <tr style="background: #f1f5f9; color: #334155; font-size: 8.5px; text-transform: uppercase;">
                  <th style="padding: 4px 6px; border: 1px solid #cbd5e1; width: 24px; text-align: center;">#</th>
                  <th style="padding: 4px 6px; border: 1px solid #cbd5e1; width: 75px; text-align: left;">Date</th>
                  <th style="padding: 4px 6px; border: 1px solid #cbd5e1; width: 100px; text-align: left;">Voucher / TXN #</th>
                  <th style="padding: 4px 6px; border: 1px solid #cbd5e1; width: 100px; text-align: left;">Vendor Inv #</th>
                  <th style="padding: 4px 6px; border: 1px solid #cbd5e1; text-align: left;">Payment Narration</th>
                  <th style="padding: 4px 6px; border: 1px solid #cbd5e1; width: 65px; text-align: center;">Method</th>
                  <th style="padding: 4px 6px; border: 1px solid #cbd5e1; width: 95px; text-align: right;">Amount Paid</th>
                </tr>
              </thead>
              <tbody>
                ${payRows}
              </tbody>
              <tfoot>
                <tr style="background: #f8fafc; font-weight: 900; border-top: 1.5px solid #4338ca;">
                  <td colspan="6" style="padding: 6px; text-align: right; text-transform: uppercase; color: #1e293b;">Total Bill Payments Settled:</td>
                  <td style="padding: 6px; text-align: right; font-family: monospace; font-size: 11px; color: #047857;">Rs. ${totalPoPaymentsPaid.toLocaleString()}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      `;
    }

    // Note: GRN Received Goods Summary section removed per user request to keep PO printout focused on PO Order Items

    printWin.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${poBannerTitle} ${po.POID} - ${cName}</title>
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
              margin-bottom: 10px;
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

            .financial-summary-card {
              background: #ffffff;
              border: 2px solid #0f172a;
              border-radius: 8px;
              padding: 10px 14px;
              margin-bottom: 12px;
              box-shadow: 0 1px 3px rgba(0,0,0,0.05);
            }
            .financial-title {
              font-size: 11px;
              font-weight: 900;
              color: #0f172a;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              border-bottom: 1.5px solid #e2e8f0;
              padding-bottom: 5px;
              margin-bottom: 8px;
              display: flex;
              justify-content: space-between;
              align-items: center;
            }
            .financial-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 12px;
            }
            .financial-stat {
              background: #f8fafc;
              border: 1px solid #e2e8f0;
              border-radius: 6px;
              padding: 7px 10px;
              display: flex;
              flex-direction: column;
            }
            .financial-stat-label {
              font-size: 8.5px;
              font-weight: 800;
              color: #64748b;
              text-transform: uppercase;
              letter-spacing: 0.3px;
            }
            .financial-stat-value {
              font-size: 13px;
              font-weight: 900;
              font-family: monospace;
              margin-top: 2px;
            }
            .financial-stat-sub {
              font-size: 8.5px;
              color: #64748b;
              margin-top: 2px;
              font-weight: 600;
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
          <div class="report-banner" style="background: ${poHeaderColor};">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span class="report-banner-title">${poBannerTitle}</span>
              <span style="font-size: 9.5px; font-weight: 800; background: ${poBadgeBg}; color: ${poBadgeText}; padding: 2px 7px; border-radius: 4px; text-transform: uppercase;">
                ${isCashOrder ? '💵 Spot Cash' : '💳 Credit (Payable)'}
              </span>
            </div>
            <span class="report-banner-ref">REF: PHC-PO-${po.POID}</span>
          </div>

          <div class="meta-grid">
            <div class="meta-item">
              <span class="meta-label">PO Ref Number</span>
              <span class="meta-value" style="color: #4338ca;">${po.POID}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Order Type / Terms</span>
              <span class="meta-value" style="color: ${isCashOrder ? '#047857' : '#4338ca'}; font-weight: 800;">
                ${isCashOrder ? '💵 Cash Order PO (Spot Paid)' : '💳 Credit Order PO (Vendor Payable)'}
              </span>
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
              <span class="meta-label">Audit Prepared By</span>
              <span class="meta-value">${currentUser?.FullName || 'Staff Accountant'}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Responsible Manager</span>
              <span class="meta-value" style="color: #881337;">Mr. Zaigham Ali Anjum</span>
            </div>
          </div>

          <!-- FINANCIAL SUMMARY & OUTSTANDING DUES CARD -->
          <div class="financial-summary-card">
            <div class="financial-title">
              <span>📊 PO Financial Status, Payments & Outstanding Dues</span>
              <span style="font-size: 9.5px; font-weight: bold; color: #475569;">Vendor Code: ${po.VendorID || 'N/A'}</span>
            </div>
            <div class="financial-grid">
              <div class="financial-stat" style="border-left: 3px solid #047857; background: #f0fdf4;">
                <span class="financial-stat-label" style="color: #047857;">Total Payments Settled</span>
                <span class="financial-stat-value" style="color: #047857;">Rs. ${totalPoPaymentsPaid.toLocaleString()}</span>
                <span class="financial-stat-sub">${poPayments.length} Payment Voucher(s) Paid</span>
              </div>
              <div class="financial-stat" style="border-left: 3px solid #881337; background: #fff1f2;">
                <span class="financial-stat-label" style="color: #9f1239;">Vendor Total Outstanding</span>
                <span class="financial-stat-value" style="color: #9f1239;">Rs. ${vendorTotalOutstandingBalance.toLocaleString()}</span>
                <span class="financial-stat-sub">Cumulative Payable Balance</span>
              </div>
            </div>
          </div>

          <!-- Main Purchase Order Items Table -->
          <div class="grid-container">
            ${col1Html}
            ${col2Html}
            ${col3Html}
          </div>

          ${po.Notes ? `<div style="margin-top: 10px; padding: 8px 12px; background: #fffbeb; border: 1px solid #fde68a; border-radius: 6px; font-size: 10.5px;"><strong>Special Instructions / Vendor Notes:</strong> ${po.Notes}</div>` : ''}



          <!-- Bill Payments Settlement Section -->
          ${paymentHistoryHtml}

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

  const erpNavTabs = useMemo(() => {
    const list = [
      { id: 'overview', label: 'ERP Dashboard', shortLabel: 'ED', icon: PieChart, perm: 'canAccessErpOverview', desc: 'KPIs, revenue overview & cash position' },
      { id: 'fiscal_calendar', label: 'Fiscal Year', shortLabel: 'FY', icon: Calendar, perm: 'canAccessErpFiscalCalendar', desc: 'Fiscal periods & financial calendar' },
      { id: 'cash_book_pnl', label: 'Clinic Cash', shortLabel: 'CC', icon: Landmark, perm: 'canAccessErpCashBook', desc: 'Cash in/outflows & net cash book' },
      { id: 'vendors', label: 'Vendor', shortLabel: 'VNDR', icon: Building2, perm: 'canAccessErpVendors', desc: 'Vendor directory & supplier records' },
      { id: 'vendor_statement', label: 'Vendor Statement', shortLabel: 'VS', icon: FileText, perm: 'canAccessErpVendorStatement', desc: 'Vendor ledgers, bills & statements' },
      { id: 'po', label: 'PO & GRN', shortLabel: 'PO', icon: ShoppingCart, perm: 'canAccessErpPoGrn', desc: 'Purchase orders & receiving notes' },
      { id: 'ledger', label: 'Financial Ledger', shortLabel: 'FL', icon: Receipt, perm: 'canAccessErpLedger', desc: 'Double-entry journal & accounts ledger' },
      { id: 'hr', label: 'HR & Payroll', shortLabel: 'HR', icon: Users, perm: 'canAccessErpHrPayroll', desc: 'Staff payroll, attendance & salaries' },
      { id: 'expenses_assets', label: 'Expense Assets', shortLabel: 'EA', icon: Boxes, perm: 'canAccessErpExpensesAssets', desc: 'Clinic expenses & asset management' },
      { id: 'reporting', label: 'Reporting & Analytics', shortLabel: 'Rep', icon: BarChart3, perm: 'canAccessErpReporting', desc: 'Financial audit reports & analytics' }
    ];
    return list.filter((tab) => {
      if (!currentUser?.Permissions) return true;
      return (currentUser.Permissions as any)[tab.perm] !== false;
    });
  }, [currentUser]);

  return (
    <div className="min-h-full bg-slate-50 text-slate-800 p-4 md:p-6 space-y-4 pb-24 relative">
      {/* MOBILE SIDE NAVIGATION DRAWER (Only Active in Mobile View) */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 sm:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileNavOpen(false)}
          />
          {/* Slide-out Drawer */}
          <div className="relative w-4/5 max-w-xs bg-white h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-200">
            {/* Drawer Header */}
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-900 text-white">
              <div className="flex items-center space-x-2.5">
                <div className="p-1.5 bg-blue-600 rounded-lg text-white">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-100">Mini ERP Menu</h2>
                  <p className="text-[10px] text-slate-400">Navigation Modules</p>
                </div>
              </div>
              <button
                onClick={() => setMobileNavOpen(false)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modules List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
              {erpNavTabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={`mobile-side-${tab.id}`}
                    onClick={() => {
                      setActiveTab(tab.id as any);
                      setMobileNavOpen(false);
                    }}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-slate-900 border border-slate-150'
                    }`}
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      <div className={`p-2 rounded-lg shrink-0 ${isActive ? 'bg-white/20 text-white' : 'bg-white text-blue-600 border border-slate-200'}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center space-x-1.5">
                          <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${
                            isActive ? 'bg-white/25 text-white' : 'bg-blue-100 text-blue-800'
                          }`}>
                            {tab.shortLabel}
                          </span>
                          <span className="text-xs font-bold truncate">{tab.label}</span>
                        </div>
                        <p className={`text-[10px] truncate mt-0.5 ${isActive ? 'text-blue-100' : 'text-slate-400'}`}>
                          {tab.desc}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  </button>
                );
              })}
            </div>

            {/* Drawer Footer */}
            <div className="p-3 border-t border-slate-200 bg-slate-50 text-center">
              <span className="text-[10px] text-slate-400 font-semibold">Punjab CMS • Enterprise ERP</span>
            </div>
          </div>
        </div>
      )}

      {/* TOP HORIZONTAL ERP NAVIGATION MENU BAR */}
      <div className="bg-white rounded-xl border border-slate-200 p-1.5 shadow-xs flex items-center space-x-1 overflow-x-auto scrollbar-none touch-pan-x z-20">
        {/* Mobile Side-Navigation Toggle Button */}
        <button
          type="button"
          onClick={() => setMobileNavOpen(true)}
          className="sm:hidden flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-[11px] border border-indigo-200 shrink-0 cursor-pointer min-h-[36px] active:scale-95 transition"
          title="Open Side Menu"
        >
          <Menu className="w-3.5 h-3.5" />
          <span className="font-extrabold uppercase">Menu</span>
        </button>

        {erpNavTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              title={tab.label}
              className={`flex items-center space-x-1.5 px-2.5 py-1.5 sm:py-1 rounded-lg text-[10.5px] sm:text-[10px] font-bold uppercase tracking-tight transition-all duration-150 shrink-0 cursor-pointer min-h-[36px] sm:min-h-0 ${
                isActive
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 active:bg-slate-200'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 sm:w-3 sm:h-3 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              <span className="whitespace-nowrap sm:hidden">{tab.shortLabel}</span>
              <span className="whitespace-nowrap hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* FINANCIAL TIMEFRAME SCOPE HEADER BAR */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 md:p-5 space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-11 h-11 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-100 shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg md:text-xl font-bold text-slate-900 tracking-tight">Financial Timeframe Scope</h1>
              <p className="text-xs text-slate-500">Filter Dashboard, Vouchers, Sales & Cash Book by Fiscal Year, Month or Date Range</p>
            </div>
          </div>

          {/* Timeframe Scope Buttons & Sync Action */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Quick Presets */}
            <div className="inline-flex flex-wrap items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-2xs">
              {[
                { id: 'today', label: '☀️ Daily' },
                { id: 'this_week', label: '📅 Weekly' },
                { id: 'this_month', label: '📊 This Month' },
                { id: 'this_year', label: `📈 CY ${currentYear}` },
                { id: 'all_time', label: '🌐 All Time' }
              ].map(p => (
                <button
                  key={p.id}
                  onClick={() => handleQuickPresetChange(p.id as any)}
                  className={`h-8 px-3 text-xs font-bold rounded-lg transition whitespace-nowrap shrink-0 inline-flex items-center justify-center cursor-pointer ${
                    cashBookDateFilter === p.id && selectedFiscalMonth === (p.id === 'this_month' ? currentYearMonth : 'all')
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Fiscal Year Selector Dropdown */}
            <div className="flex items-center space-x-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 h-10 shadow-2xs">
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
            <div className="flex items-center space-x-1.5 bg-indigo-50/80 border-2 border-indigo-300 rounded-xl px-2.5 h-10 shadow-2xs">
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

            {syncMessage && (
              <div className="h-10 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200 inline-flex items-center space-x-1.5 animate-pulse shrink-0">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span className="whitespace-nowrap">{syncMessage}</span>
              </div>
            )}

            <button
              type="button"
              onClick={fetchErpData}
              disabled={loading}
              className="h-10 px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition inline-flex items-center justify-center space-x-1.5 border border-slate-200 cursor-pointer shrink-0 shadow-2xs"
              title="Sync ERP data from database"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-indigo-600' : 'text-slate-600'}`} />
              <span className="whitespace-nowrap">Sync Data</span>
            </button>
          </div>
        </div>

        {/* Custom Range Date Pickers */}
        {(cashBookDateFilter === 'custom' || selectedFiscalYear === 'custom') && (
          <div className="pt-2.5 border-t border-slate-100 flex flex-wrap items-center gap-3 animate-fadeIn">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-slate-700 whitespace-nowrap">From Date:</span>
              <input
                type="date"
                value={cashBookStartDate}
                onChange={(e) => {
                  setCashBookStartDate(e.target.value);
                  setCashBookDateFilter('custom');
                }}
                className="text-xs font-bold h-8 px-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:bg-white"
              />
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-slate-700 whitespace-nowrap">To Date:</span>
              <input
                type="date"
                value={cashBookEndDate}
                onChange={(e) => {
                  setCashBookEndDate(e.target.value);
                  setCashBookDateFilter('custom');
                }}
                className="text-xs font-bold h-8 px-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:bg-white"
              />
            </div>
          </div>
        )}

        {/* Active Scope Badge */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs bg-indigo-50/70 border border-indigo-100 rounded-xl px-3.5 py-2 gap-2">
          <div className="font-bold text-indigo-950 inline-flex items-center text-xs flex-wrap gap-1">
            <BarChart3 className="w-3.5 h-3.5 text-indigo-600 mr-1 shrink-0" />
            <span>Active Scope:</span>
            <span className="font-extrabold text-indigo-800">
              {selectedFiscalMonth !== 'all'
                ? `Month: ${monthOptions.find(m => m.value === selectedFiscalMonth)?.label || selectedFiscalMonth} (${cashBookStartDate} to ${cashBookEndDate})`
                : selectedFiscalYear !== 'all' && selectedFiscalYear !== 'custom'
                  ? `${selectedFiscalYear} (${cashBookStartDate} to ${cashBookEndDate})`
                  : cashBookDateFilter === 'today' ? `Daily (${new Date().toLocaleDateString('en-GB')})` :
                    cashBookDateFilter === 'this_week' ? 'Weekly (Past 7 Days)' :
                    cashBookDateFilter === 'custom' ? `Custom (${cashBookStartDate} to ${cashBookEndDate})` : 'All Time History'}
            </span>
          </div>
          <span className="text-[10.5px] font-extrabold text-indigo-800 bg-white px-2.5 py-1 rounded-full border border-indigo-200 inline-flex items-center shrink-0 shadow-2xs self-start sm:self-auto">
            {cashBookMetrics.activeDaysCount} Active Operational {cashBookMetrics.activeDaysCount === 1 ? 'Day' : 'Days'} Records
          </span>
        </div>
      </div>

      {/* MAIN ERP CONTENT AREA - FULL WIDTH */}
      <div className="w-full space-y-6">

      {/* TAB 1: OVERVIEW DASHBOARD */}

        {/* TAB 1: OVERVIEW DASHBOARD */}
        {activeTab === 'overview' && (
          <OverviewTab
            vendors={vendors}
            purchaseOrders={purchaseOrders}
            grns={grns}
            transactions={transactions}
            employees={employees}
            payrolls={payrolls}
            expenses={expenses}
            assets={assets}
            cashBookMetrics={cashBookMetrics}
            cashBookDateFilter={cashBookDateFilter}
            cashBookEntries={cashBookEntries}
            setActiveTab={setActiveTab}
            handleOpenAddVendor={handleOpenAddVendor}
            handleOpenNewPoModal={handleOpenNewPoModal}
            handleOpenGrnForPo={handleOpenGrnForPo}
            setShowTxnModal={setShowTxnModal}
            setShowExpenseModal={setShowExpenseModal}
            setShowEmpModal={setShowEmpModal}
            setShowPayrollModal={setShowPayrollModal}
            setShowAssetModal={setShowAssetModal}
          />
        )}

        {/* TAB 2: FISCAL CALENDAR DESK */}
        {activeTab === 'fiscal_calendar' && (
          <FiscalCalendarTab clinicSettings={clinicSettings} />
        )}

        {/* TAB 2: CASH BOOK & PNL REPORT */}
        {activeTab === 'cash_book_pnl' && (
          <CashBookPnlTab
            cashBookDateFilter={cashBookDateFilter}
            setCashBookDateFilter={setCashBookDateFilter}
            cashBookStartDate={cashBookStartDate}
            setCashBookStartDate={setCashBookStartDate}
            cashBookEndDate={cashBookEndDate}
            setCashBookEndDate={setCashBookEndDate}
            cashBookCategoryFilter={cashBookCategoryFilter}
            setCashBookCategoryFilter={setCashBookCategoryFilter}
            cashBookSearch={cashBookSearch}
            setCashBookSearch={setCashBookSearch}
            selectedFiscalYear={selectedFiscalYear}
            handleFiscalYearSelect={handleFiscalYearSelect}
            selectedFiscalMonth={selectedFiscalMonth}
            handleFiscalMonthSelect={handleFiscalMonthSelect}
            fiscalYearOptions={fiscalYearOptions}
            monthOptions={monthOptions}
            handleQuickPresetChange={handleQuickPresetChange}
            cashBookMetrics={cashBookMetrics}
            filteredCashBookEntries={filteredCashBookEntries}
            quickOutflowForm={quickOutflowForm}
            setQuickOutflowForm={setQuickOutflowForm}
            handleQuickOutflowSubmit={handleQuickOutflowSubmit}
            isSubmitting={isSubmitting}
            handlePrintCashBookReport={handlePrintCashBookReport}
            customExpenseCategories={customExpenseCategories}
            handleDeleteCashBookEntry={handleDeleteCashBookEntry}
          />
        )}

        {/* TAB 3: VENDORS DIRECTORY */}
        {activeTab === 'vendors' && (
          <VendorsTab
            vendors={vendors}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            filterCategory={filterCategory}
            setFilterCategory={setFilterCategory}
            handleOpenAddVendor={handleOpenAddVendor}
            handleOpenEditVendor={handleOpenEditVendor}
            handleDeleteVendor={handleDeleteVendor}
            handleOpenNewPoModal={handleOpenNewPoModal}
            handleOpenGrnForPo={handleOpenGrnForPo}
            setSelectedVendorId={setSelectedVendorId}
            setActiveTab={setActiveTab}
            setVendorPoModalData={setVendorPoModalData}
            setPoHistoryFilterPo={setPoHistoryFilterPo}
            setPoHistoryModalData={setPoHistoryModalData}
            setPayVendorModalData={setPayVendorModalData}
            handlePrintVendorStatement={handlePrintVendorStatement}
            purchaseOrders={purchaseOrders}
            setHistoryVendorFilter={setHistoryVendorFilter}
            setHistoryStartDate={setHistoryStartDate}
            setHistoryEndDate={setHistoryEndDate}
            setShowPaymentHistoryModal={setShowPaymentHistoryModal}
            handleOpenEditVendorTop={handleOpenEditVendorTop}
            handlePayVendor={handlePayVendor}
          />
        )}

        {/* TAB 2B: VENDOR ACCOUNT STATEMENT & PAYABLE LEDGER */}
        {activeTab === 'vendor_statement' && (
          <VendorStatementTab
            vendors={vendors}
            selectedVendorId={selectedVendorId}
            setSelectedVendorId={setSelectedVendorId}
            selectedVendor={selectedVendor}
            vendorDateFilter={vendorDateFilter}
            setVendorDateFilter={setVendorDateFilter}
            vendorStatement={vendorStatement}
            expandedGrnId={expandedGrnId}
            setExpandedGrnId={setExpandedGrnId}
            handleOpenEditVendorTop={handleOpenEditVendorTop}
            handleOpenNewPoModal={handleOpenNewPoModal}
            setPayVendorModalData={setPayVendorModalData}
            setVendorPoModalData={setVendorPoModalData}
            setPoHistoryFilterPo={setPoHistoryFilterPo}
            setPoHistoryModalData={setPoHistoryModalData}
            setShowPaymentHistoryModal={setShowPaymentHistoryModal}
            setVendorPrintModalOpen={setVendorPrintModalOpen}
            handlePrintVendorStatement={handlePrintVendorStatement}
            handlePayVendor={handlePayVendor}
            handleOpenEditVendor={handleOpenEditVendor}
            handleOpenAddVendor={handleOpenAddVendor}
            fetchErpData={fetchErpData}
            handleDeleteTxn={handleDeleteTxn}
          />
        )}

        {/* TAB 3: PURCHASE ORDERS */}
        {activeTab === 'po' && (
          <PurchaseOrdersTab
            purchaseOrders={purchaseOrders}
            filteredPurchaseOrders={filteredPurchaseOrders}
            totalPoFilteredAmount={totalPoFilteredAmount}
            poLogSearchTerm={poLogSearchTerm}
            setPoLogSearchTerm={setPoLogSearchTerm}
            poLogVendorFilter={poLogVendorFilter}
            setPoLogVendorFilter={setPoLogVendorFilter}
            poLogStatusFilter={poLogStatusFilter}
            setPoLogStatusFilter={setPoLogStatusFilter}
            poVendorList={poVendorList}
            handleOpenNewPoModal={handleOpenNewPoModal}
            setShowUploadBulkPoModal={setShowUploadBulkPoModal}
            isPoStockReceivedOrLocked={isPoStockReceivedOrLocked}
            handleOpenEditPoModal={handleOpenEditPoModal}
            handleDeletePo={handleDeletePo}
            handleOpenPoWhatsAppModal={handleOpenPoWhatsAppModal}
            handlePrintPo={handlePrintPo}
            handleOpenGrnForPo={handleOpenGrnForPo}
            setPayVendorModalData={setPayVendorModalData}
            setPoHistoryFilterPo={setPoHistoryFilterPo}
            setPoHistoryModalData={setPoHistoryModalData}
            vendors={vendors}
            grns={grns}
            filteredGrns={filteredGrns}
            totalGrnFilteredAmount={totalGrnFilteredAmount}
            grnLogSearchTerm={grnLogSearchTerm}
            setGrnLogSearchTerm={setGrnLogSearchTerm}
            grnLogVendorFilter={grnLogVendorFilter}
            setGrnLogVendorFilter={setGrnLogVendorFilter}
            grnVendorList={grnVendorList}
            setShowUploadBulkGrnModal={setShowUploadBulkGrnModal}
            setShowQrScannerModal={setShowQrScannerModal}
            setShowQrGeneratorModal={setShowQrGeneratorModal}
            handleOpenGrnPrintPreview={handleOpenGrnPrintPreview}
            handleDeleteGrn={handleDeleteGrn}
            inventoryItems={inventoryItems}
            handleSelectAllLowStockMedicines={handleSelectAllLowStockMedicines}
            setShowPoModal={setShowPoModal}
            setBulkPoRawText={setBulkPoRawText}
            setBulkPoParsedItems={setBulkPoParsedItems}
            setBulkPoFileError={setBulkPoFileError}
            setBulkGrnSelectedPoId={setBulkGrnSelectedPoId}
            setBulkGrnRawText={setBulkGrnRawText}
            setBulkGrnParsedItems={setBulkGrnParsedItems}
            setBulkGrnFileError={setBulkGrnFileError}
          />
        )}

        {/* TAB 4: FINANCIAL LEDGER & VOUCHERS */}
        {activeTab === 'ledger' && (
          <LedgerTab
            transactions={transactions}
            filteredTransactions={filteredTransactions}
            ledgerSearchTerm={ledgerSearchTerm}
            setLedgerSearchTerm={setLedgerSearchTerm}
            ledgerDateMode={ledgerDateMode}
            setLedgerDateMode={setLedgerDateMode}
            cashBookDateFilter={cashBookDateFilter}
            cashBookStartDate={cashBookStartDate}
            cashBookEndDate={cashBookEndDate}
            selectedFiscalMonth={selectedFiscalMonth}
            selectedFiscalYear={selectedFiscalYear}
            setShowTxnModal={setShowTxnModal}
            handlePrintCashBookReport={handlePrintCashBookReport}
            handleDeleteTxn={handleDeleteTxn}
          />
        )}

        {/* TAB 5: HR & PAYROLL */}
        {activeTab === 'hr' && (
          <HrTab
            employees={employees}
            payrolls={payrolls}
            setShowEmpModal={setShowEmpModal}
            setShowPayrollModal={setShowPayrollModal}
            setEmpForm={setEmpForm}
            setPayrollForm={setPayrollForm}
            handleDeleteEmp={handleDeleteEmp}
          />
        )}

        {/* TAB 6: EXPENSES & ASSETS */}
        {activeTab === 'expenses_assets' && (
          <ExpensesAssetsTab
            expenses={expenses}
            assets={assets}
            setShowExpenseModal={setShowExpenseModal}
            setShowAssetModal={setShowAssetModal}
            setExpenseForm={setExpenseForm}
            setAssetForm={setAssetForm}
            handleDeleteExpense={handleDeleteExpense}
            handleDeleteAsset={handleDeleteAsset}
          />
        )}

        {/* TAB 7: REPORTING & ANALYTICS */}
        {activeTab === 'reporting' && (
          <ReportingTab clinicSettings={clinicSettings} />
        )}
      </div>

      {/* ========================================================================= */}
      {/* ERP MODALS (SPLIT INTO DEDICATED SUB-COMPONENTS) */}
      {/* ========================================================================= */}

      {/* 1. Register / Edit Vendor Modal */}
      <RegisterEditVendorModal
        showVendorModal={showVendorModal}
        setShowVendorModal={setShowVendorModal}
        editingVendor={editingVendor}
        setEditingVendor={setEditingVendor}
        vendorForm={vendorForm}
        setVendorForm={setVendorForm}
        handleSaveVendor={handleSaveVendor}
        isSubmitting={isSubmitting}
        vendors={vendors}
        handleOpenEditVendor={handleOpenEditVendor}
      />

      {/* 2. Create / Edit Purchase Order Modal */}
      <PurchaseOrderModal
        showPoModal={showPoModal}
        setShowPoModal={setShowPoModal}
        editingPurchaseOrder={editingPurchaseOrder}
        poForm={poForm}
        setPoForm={setPoForm}
        vendors={vendors}
        handleOpenAddVendor={handleOpenAddVendor}
        medicineSearchTerm={medicineSearchTerm}
        setMedicineSearchTerm={setMedicineSearchTerm}
        poCategoryFilter={poCategoryFilter}
        setPoCategoryFilter={setPoCategoryFilter}
        medicineFilterMode={medicineFilterMode}
        setMedicineFilterMode={setMedicineFilterMode}
        poGridPageSize={poGridPageSize}
        setPoGridPageSize={setPoGridPageSize}
        poGridPage={poGridPage}
        setPoGridPage={setPoGridPage}
        medicineCategories={medicineCategories}
        setShowUploadBulkPoModal={setShowUploadBulkPoModal}
        handleOpenQuickAddMedicineModal={handleOpenQuickAddMedModal}
        pagedMedicines={inventoryItems}
        totalPoMedicinePages={1}
        filteredCatalogMedicines={inventoryItems}
        allCatalogMedicines={inventoryItems}
        isMedicineSelectedInPo={isMedicineSelectedInPo}
        getMedicineItemCategory={getMedicineItemCategory}
        getMedicinePriceInfo={getMedicinePriceInfo}
        getRequiredQty={getRequiredQty}
        handleToggleMedicineInPo={handleToggleMedicineForPo}
        handlePoItemChange={handleUpdatePoItem}
        handleRemovePoItem={(idx) => setPoForm(prev => ({ ...prev, Items: prev.Items.filter((_, i) => i !== idx) }))}
        totalPoAmount={poForm.Items.reduce((sum, i) => sum + ((Number(i.Qty) || 0) * (Number(i.UnitPrice) || 0)), 0)}
        totalPoRequisitionQty={poForm.Items.reduce((sum, i) => sum + (Number(i.Qty) || 0), 0)}
        handleSavePurchaseOrder={handleCreatePo}
        isSubmitting={isSubmitting}
        setShowQrScannerModal={setShowQrScannerModal}
      />

      {/* 3. Quick Add / Edit Medicine in PO */}
      <QuickAddMedicineModal
        showQuickAddMedModal={showQuickAddMedModal}
        setShowQuickAddMedModal={setShowQuickAddMedModal}
        quickMedForm={quickMedForm}
        setQuickMedForm={setQuickMedForm}
        editingQuickMed={editingQuickMed}
        setEditingQuickMed={setEditingQuickMed}
        medicineCategories={medicineCategories}
        handleQuickAddMedicine={handleQuickAddMedicine}
        resolveSmartMedicineCategory={resolveSmartMedicineCategory}
      />

      {/* 4. Upload Bulk PO */}
      <BulkPoUploadModal
        showUploadBulkPoModal={showUploadBulkPoModal}
        setShowUploadBulkPoModal={setShowUploadBulkPoModal}
        bulkPoRawText={bulkPoRawText}
        setBulkPoRawText={setBulkPoRawText}
        bulkPoParsedItems={bulkPoParsedItems}
        setBulkPoParsedItems={setBulkPoParsedItems}
        bulkPoFileError={bulkPoFileError}
        setBulkPoFileError={setBulkPoFileError}
        handleBulkPoExcelRead={handleBulkPoExcelRead}
        handleParseBulkPoText={handleParseBulkPoText}
        handleApplyBulkPoToForm={handleApplyBulkPoToForm}
      />

      {/* 5. Upload Bulk GRN Received Stock */}
      <BulkGrnUploadModal
        showUploadBulkGrnModal={showUploadBulkGrnModal}
        setShowUploadBulkGrnModal={setShowUploadBulkGrnModal}
        bulkGrnSelectedPoId={bulkGrnSelectedPoId}
        setBulkGrnSelectedPoId={setBulkGrnSelectedPoId}
        bulkGrnRawText={bulkGrnRawText}
        setBulkGrnRawText={setBulkGrnRawText}
        bulkGrnParsedItems={bulkGrnParsedItems}
        setBulkGrnParsedItems={setBulkGrnParsedItems}
        bulkGrnFileError={bulkGrnFileError}
        setBulkGrnFileError={setBulkGrnFileError}
        handleBulkGrnExcelRead={handleBulkGrnExcelRead}
        handleParseBulkGrnText={handleParseBulkGrnText}
        handleApplyBulkGrnToForm={handleApplyBulkGrnToForm}
        grnForm={grnForm}
        purchaseOrders={purchaseOrders}
        medicineCategories={medicineCategories}
      />

      {/* 6. Unmatched Categories Confirmation Dialog */}
      <UnmatchedCategoryDialog
        unmatchedCategoryDialog={unmatchedCategoryDialog}
        setUnmatchedCategoryDialog={setUnmatchedCategoryDialog}
        medicineCategories={medicineCategories}
        handleConfirmUnmatchedCategories={handleResolveUnmatchedCategories}
      />

      {/* 7. Goods Received Note (GRN) Modal */}
      <GrnModal
        showGrnModal={showGrnModal}
        setShowGrnModal={setShowGrnModal}
        grnForm={grnForm}
        setGrnForm={setGrnForm}
        vendors={vendors}
        purchaseOrders={purchaseOrders}
        handleApproveGrn={handleApproveGrn}
        isSubmitting={isSubmitting}
        handleSelectPoForGrn={handleSelectPoForGrn}
        handleRemoveGrnItem={handleRemoveGrnItem}
        handleResetGrnItems={handleResetGrnItems}
        handleIncludeGrnItem={handleIncludeGrnItem}
        handleTransferGrnItemToNewPo={handleTransferGrnItemToNewPo}
        handleTransferAllUnreceivedToNewPo={handleTransferAllUnreceivedToNewPo}
        handleDeleteGrnItemFromPo={handleDeleteGrnItemFromPo}
        getPoItemsReceiptInfo={getPoItemsReceiptInfo}
        handlePreviewCurrentGrnForm={handlePreviewCurrentGrnForm}
        setShowUploadBulkGrnModal={setShowUploadBulkGrnModal}
        setBulkGrnSelectedPoId={setBulkGrnSelectedPoId}
        setBulkGrnRawText={setBulkGrnRawText}
        setBulkGrnParsedItems={setBulkGrnParsedItems}
        setBulkGrnFileError={setBulkGrnFileError}
      />

      {/* 8. Log Transaction Modal */}
      <TransactionModal
        showTxnModal={showTxnModal}
        setShowTxnModal={setShowTxnModal}
        txnForm={txnForm}
        setTxnForm={setTxnForm}
        vendors={vendors}
        grns={grns}
        handleSaveTransaction={handleAddTxn}
        isSubmitting={isSubmitting}
      />

      {/* 9. Employee Modal */}
      <EmployeeModal
        showEmpModal={showEmpModal}
        setShowEmpModal={setShowEmpModal}
        empForm={empForm}
        setEmpForm={setEmpForm}
        handleSaveEmployee={handleAddEmployee}
        isSubmitting={isSubmitting}
      />

      {/* 10. Payroll Modal */}
      <PayrollModal
        showPayrollModal={showPayrollModal}
        setShowPayrollModal={setShowPayrollModal}
        payrollForm={payrollForm}
        setPayrollForm={setPayrollForm}
        employees={employees}
        handleSavePayroll={handleProcessPayroll}
        isSubmitting={isSubmitting}
      />

      {/* 11. Expense Modal */}
      <ExpenseModal
        showExpenseModal={showExpenseModal}
        setShowExpenseModal={setShowExpenseModal}
        expenseForm={expenseForm}
        setExpenseForm={setExpenseForm}
        handleSaveExpense={handleAddExpense}
        isSubmitting={isSubmitting}
        showAddCategoryInput={showAddCategoryInput}
        setShowAddCategoryInput={setShowAddCategoryInput}
        newCategoryName={newCategoryName}
        setNewCategoryName={setNewCategoryName}
        handleSaveNewCategory={handleSaveNewCategory}
        customExpenseCategories={customExpenseCategories}
        editingCategoryName={editingCategoryName}
        setEditingCategoryName={setEditingCategoryName}
        editCategoryNewValue={editCategoryNewValue}
        setEditCategoryNewValue={setEditCategoryNewValue}
        handleUpdateCustomCategory={handleSaveEditedCategory}
        handleDeleteCustomCategory={handleDeleteCategory}
        allExpenseCategories={allExpenseCategories}
        DEFAULT_EXPENSE_CATEGORIES={DEFAULT_EXPENSE_CATEGORIES}
      />

      {/* 12. Asset Modal */}
      <AssetModal
        showAssetModal={showAssetModal}
        setShowAssetModal={setShowAssetModal}
        assetForm={assetForm}
        setAssetForm={setAssetForm}
        handleSaveAsset={handleAddAsset}
        isSubmitting={isSubmitting}
      />

      {/* 13. Printable Vendor Statement Preview Modal */}
      <VendorPrintStatementModal
        vendorPrintModalOpen={vendorPrintModalOpen}
        setVendorPrintModalOpen={setVendorPrintModalOpen}
        selectedVendor={selectedVendor}
        vendorStatement={vendorStatement}
        clinicSettings={clinicSettings}
        handlePrintVendorStatement={handlePrintVendorStatement}
        vendorDateFilter={vendorDateFilter}
        currentUser={currentUser}
      />

      {/* 14. Pay Vendor Bill Popup Modal */}
      <PayVendorModal
        payVendorModalData={payVendorModalData}
        setPayVendorModalData={setPayVendorModalData}
        purchaseOrders={purchaseOrders}
        grns={grns}
        transactions={transactions}
        setPoHistoryFilterPo={setPoHistoryFilterPo}
        setPoHistoryModalData={setPoHistoryModalData}
        handlePrintVendorStatement={handlePrintVendorStatement}
        handleSavePayVendorBill={handleConfirmPayVendor}
        isSubmitting={isSubmitting}
      />

      {/* 15. Vendor Purchase Orders Modal */}
      <VendorPurchaseOrdersModal
        vendorPoModalData={vendorPoModalData}
        setVendorPoModalData={setVendorPoModalData}
        purchaseOrders={purchaseOrders}
        grns={grns}
        transactions={transactions}
        handleOpenNewPoModal={handleOpenNewPoModal}
        handleOpenEditPoModal={handleOpenEditPoModal}
        handlePrintPo={handlePrintPo}
        setPayVendorModalData={setPayVendorModalData}
        setPoHistoryFilterPo={setPoHistoryFilterPo}
        setPoHistoryModalData={setPoHistoryModalData}
        isPoStockReceivedOrLocked={isPoStockReceivedOrLocked}
        handleOpenGrnForPo={handleOpenGrnForPo}
      />

      {/* 16. Payment History for PO Modal */}
      <PoPaymentHistoryModal
        poHistoryModalData={poHistoryModalData}
        setPoHistoryModalData={setPoHistoryModalData}
        poHistoryFilterPo={poHistoryFilterPo}
        setPoHistoryFilterPo={setPoHistoryFilterPo}
        purchaseOrders={purchaseOrders}
        grns={grns}
        transactions={transactions}
        handlePrintVendorStatement={handlePrintVendorStatement}
        setPayVendorModalData={setPayVendorModalData}
        handlePrintSinglePaymentVoucher={handlePrintSinglePaymentVoucher}
      />

      {/* 17. Vendor Payment History Standalone Modal */}
      <VendorPaymentHistoryStandaloneModal
        showPaymentHistoryModal={showPaymentHistoryModal}
        setShowPaymentHistoryModal={setShowPaymentHistoryModal}
        paymentHistoryVendorFilter={historyVendorFilter}
        setPaymentHistoryVendorFilter={setHistoryVendorFilter}
        vendors={vendors}
        transactions={transactions}
        setPayVendorModalData={setPayVendorModalData}
        handlePrintSinglePaymentVoucher={handlePrintSinglePaymentVoucher}
      />

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

      {/* Dedicated GRN Print Preview Modal */}
      <GrnPrintPreviewModal
        isOpen={showGrnPrintPreviewModal}
        onClose={() => {
          setShowGrnPrintPreviewModal(false);
          setGrnPrintPreviewData(null);
        }}
        grn={grnPrintPreviewData}
        clinicSettings={clinicSettings}
        currentUser={currentUser}
      />

      {/* WhatsApp Purchase Order Modal */}
      <WhatsAppPoModal
        showWhatsAppPoModal={showWhatsAppPoModal}
        setShowWhatsAppPoModal={setShowWhatsAppPoModal}
        selectedPoForWhatsApp={selectedPoForWhatsApp}
        whatsAppVendorPhone={whatsAppTargetPhone}
        setWhatsAppVendorPhone={setWhatsAppTargetPhone}
        whatsAppCustomPoNotes={whatsAppCustomNote}
        setWhatsAppCustomPoNotes={setWhatsAppCustomNote}
        handleSendPoWhatsApp={handleSendPoWhatsApp}
        clinicSettings={clinicSettings}
        currentUser={currentUser}
      />
    </div>
  );
}
