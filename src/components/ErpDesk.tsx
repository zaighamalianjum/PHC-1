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
  const [expandedPoId, setExpandedPoId] = useState<string | null>(null);

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
                üìç ${cAddr} &nbsp;|&nbsp; üìû ${cPhone} &nbsp;|&nbsp; üåê ${cWebsite.replace(/^https?:\/\//, '')}
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
            <div>Punjab Homeopathic Clinic & Pharmacy ‚Ä¢ üåê ${cWebsite.replace(/^https?:\/\//, '')} ‚Ä¢ üìû Helpline: ${cPhone}</div>
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
                grnInfo: `GRN #${grn.GRNID} ‚Ä¢ ${grn.VendorName || currentVName} ‚Ä¢ ${grn.ReceivedDate || 'Recent'}`,
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
              grnInfo: `GRN #${grn.GRNID} ‚Ä¢ ${grn.VendorName || 'Vendor'} ‚Ä¢ ${grn.ReceivedDate || 'Recent'}`,
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

      const todayStr = new Date().toISOString().split('T')[0];
      const twoYearsStr = new Date(Date.now() + 365 * 2 * 86400000).toISOString().split('T')[0];

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
        MfgDate: row.mfgDate || todayStr,
        ExpiryDate: row.expiryDate || twoYearsStr,
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
      MfgDate: item.MfgDate,
      ExpiryDate: item.ExpiryDate
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
      alert(`üîí Locked: Purchase Order ${po.POID} cannot be edited because Goods Received Note (GRN) / Stock inward has already been processed.`);
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

        window.dispatchEvent(new CustomEvent('phc_db_updated'));
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

        window.dispatchEvent(new CustomEvent('phc_db_updated'));
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
      return alert(`üîí Cannot update: Stock or GRN has already been added for ${editingPurchaseOrder.POID}.`);
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

    const breakdown = getPoItemFulfillmentBreakdown(selectedPoForWhatsApp, grns);
    const isPartial = selectedPoForWhatsApp.Status === 'Partially Received' || (breakdown.totalRemainingQty > 0 && breakdown.totalReceivedQty > 0);

    const url = generateWhatsAppPurchaseOrderUrl({
      poId: selectedPoForWhatsApp.POID,
      vendorName: selectedPoForWhatsApp.VendorName,
      vendorPhone: whatsAppTargetPhone,
      orderDate: selectedPoForWhatsApp.OrderDate,
      expectedDeliveryDate: selectedPoForWhatsApp.ExpectedDeliveryDate,
      totalAmount: selectedPoForWhatsApp.TotalAmount,
      paymentMethod: selectedPoForWhatsApp.PaymentMethod || (selectedPoForWhatsApp as any).PaymentTerms,
      status: selectedPoForWhatsApp.Status,
      isPartialDelivery: isPartial,
      totalReceivedQty: breakdown.totalReceivedQty,
      totalRemainingQty: breakdown.totalRemainingQty,
      items: breakdown.items.map(i => ({
        ItemName: i.ItemName,
        Qty: i.OrderedQty,
        ReceivedQty: i.ReceivedQty,
        RemainingQty: i.RemainingQty,
        UnitPrice: i.UnitPrice,
        Category: i.Category,
        BatchNo: i.BatchNo
      })),
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
    window.dispatchEvent(new CustomEvent('phc_db_updated'));
  };

  // Robust PO Item Fulfillment and Remaining / Balance Calculation
  const getPoItemFulfillmentBreakdown = (po: ErpPurchaseOrder, grnsList: ErpGrn[] = grns) => {
    if (!po) {
      return {
        items: [],
        remainingItemsList: [],
        totalOrderedQty: 0,
        totalReceivedQty: 0,
        totalRemainingQty: 0,
        totalOrderedAmount: 0,
        totalReceivedAmount: 0,
        totalRemainingAmount: 0,
        totalItemsCount: 0,
        fulfilledItemsCount: 0,
        partiallyReceivedItemsCount: 0,
        pendingItemsCount: 0,
        hasPendingItems: false,
        isFullyReceived: false,
        linkedGrns: []
      };
    }

    const targetPoId = String(po.POID || '').trim().toLowerCase();
    const approvedGrns = (grnsList || []).filter(g => {
      const gPoId = String(g.POID || (g as any).PoID || '').trim().toLowerCase();
      return gPoId === targetPoId && g.Status !== 'Cancelled';
    });

    const norm = (s: any) => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');

    const items = (po.Items || []).map((poItem, idx) => {
      const ordered = Number(poItem.Qty) || 0;
      const unitPrice = Number(poItem.UnitPrice) || 0;
      let receivedQty = 0;
      const receivingGrnIds: string[] = [];

      approvedGrns.forEach(g => {
        if (Array.isArray(g.Items)) {
          let matched = null;
          if (poItem.ItemID && String(poItem.ItemID).trim() !== '') {
            matched = g.Items.find((gi: any) => gi.ItemID && String(gi.ItemID).trim().toLowerCase() === String(poItem.ItemID).trim().toLowerCase());
          }
          if (!matched && poItem.ItemName && String(poItem.ItemName).trim() !== '') {
            matched = g.Items.find((gi: any) => gi.ItemName && norm(gi.ItemName) === norm(poItem.ItemName));
          }
          if (!matched && g.Items[idx]) {
            matched = g.Items[idx];
          }
          if (matched) {
            const qty = Number(matched.ReceivedQty ?? matched.Qty ?? matched.QtyReceived ?? matched.Quantity ?? 0);
            if (qty > 0) {
              receivedQty += qty;
              if (g.GRNID && !receivingGrnIds.includes(g.GRNID)) {
                receivingGrnIds.push(g.GRNID);
              }
            }
          }
        }
      });

      const remainingQty = Math.max(0, ordered - receivedQty);
      const orderedTotal = ordered * unitPrice;
      const receivedTotal = receivedQty * unitPrice;
      const remainingTotal = remainingQty * unitPrice;

      let fulfillmentStatus: 'Fulfilled' | 'Partially Received' | 'Pending Delivery' = 'Pending Delivery';
      if (receivedQty >= ordered && ordered > 0) {
        fulfillmentStatus = 'Fulfilled';
      } else if (receivedQty > 0) {
        fulfillmentStatus = 'Partially Received';
      }

      return {
        ItemID: poItem.ItemID,
        ItemName: poItem.ItemName,
        Category: poItem.Category,
        BatchNo: poItem.BatchNo,
        OrderedQty: ordered,
        ReceivedQty: receivedQty,
        RemainingQty: remainingQty,
        UnitPrice: unitPrice,
        OrderedTotal: orderedTotal,
        ReceivedTotal: receivedTotal,
        RemainingTotal: remainingTotal,
        FulfillmentStatus: fulfillmentStatus,
        GrnNumbers: receivingGrnIds
      };
    });

    const totalOrderedQty = items.reduce((sum, i) => sum + i.OrderedQty, 0);
    const totalReceivedQty = items.reduce((sum, i) => sum + i.ReceivedQty, 0);
    const totalRemainingQty = items.reduce((sum, i) => sum + i.RemainingQty, 0);
    const totalOrderedAmount = items.reduce((sum, i) => sum + i.OrderedTotal, 0);
    const totalReceivedAmount = items.reduce((sum, i) => sum + i.ReceivedTotal, 0);
    const totalRemainingAmount = items.reduce((sum, i) => sum + i.RemainingTotal, 0);

    const totalItemsCount = items.length;
    const fulfilledItemsCount = items.filter(i => i.FulfillmentStatus === 'Fulfilled').length;
    const partiallyReceivedItemsCount = items.filter(i => i.FulfillmentStatus === 'Partially Received').length;
    const pendingItemsCount = items.filter(i => i.FulfillmentStatus === 'Pending Delivery').length;

    const remainingItemsList = items.filter(i => i.RemainingQty > 0);

    return {
      items,
      remainingItemsList,
      totalOrderedQty,
      totalReceivedQty,
      totalRemainingQty,
      totalOrderedAmount,
      totalReceivedAmount,
      totalRemainingAmount,
      totalItemsCount,
      fulfilledItemsCount,
      partiallyReceivedItemsCount,
      pendingItemsCount,
      hasPendingItems: totalRemainingQty > 0,
      isFullyReceived: totalOrderedQty > 0 && totalReceivedQty >= totalOrderedQty,
      linkedGrns: approvedGrns
    };
  };

  const calculatePoStatus = (po: ErpPurchaseOrder, grnsList: ErpGrn[], extraReceivingItems?: any[]): 'Received' | 'Partially Received' | 'Approved' | 'Sent' | 'Draft' => {
    if (!po || !Array.isArray(po.Items) || po.Items.length === 0) return (po?.Status as any) || 'Approved';
    
    const breakdown = getPoItemFulfillmentBreakdown(po, grnsList);
    
    let extraReceived = 0;
    if (extraReceivingItems && extraReceivingItems.length > 0) {
      extraReceivingItems.forEach(gi => {
        extraReceived += Number(gi.ReceivedQty ?? gi.Qty ?? 0);
      });
    }

    const effectiveTotalReceived = breakdown.totalReceivedQty + extraReceived;
    if (breakdown.totalOrderedQty > 0 && effectiveTotalReceived >= breakdown.totalOrderedQty) {
      return 'Received';
    }
    if (effectiveTotalReceived > 0) {
      return 'Partially Received';
    }

    return (po.Status && po.Status !== 'Received' && po.Status !== 'Partially Received') ? (po.Status as any) : 'Approved';
  };

  // HANDLERS FOR GOODS RECEIVED NOTE (GRN) & PARTIAL BATCH RECEIVING
  const getPoItemsReceiptInfo = (po: ErpPurchaseOrder) => {
    const breakdown = getPoItemFulfillmentBreakdown(po, grns);
    const norm = (s: any) => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');

    // Return only items that still have pending remaining quantities to receive
    return breakdown.remainingItemsList.map(item => {
      const matchedInv = (inventoryItems || []).find((inv: any) =>
        (item.ItemID && inv.ItemID && String(inv.ItemID).trim().toLowerCase() === String(item.ItemID).trim().toLowerCase()) ||
        (item.ItemName && inv.ItemName && norm(inv.ItemName) === norm(item.ItemName))
      );
      const displayItemId = matchedInv?.ItemID || item.ItemID;

      return {
        ItemID: displayItemId,
        ItemName: item.ItemName,
        OrderedQty: item.OrderedQty,
        AlreadyReceivedQty: item.ReceivedQty,
        PendingQty: item.RemainingQty,
        ReceivedQty: '' as any, // Empty textbox for physical verification
        UnitPrice: item.UnitPrice > 0 ? item.UnitPrice : ('' as any), // Default to PO rate
        LineTotal: 0,
        BatchNo: item.BatchNo || `B-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
        MfgDate: new Date().toISOString().split('T')[0],
        ExpiryDate: new Date(Date.now() + 365 * 2 * 86400000).toISOString().split('T')[0]
      };
    });
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
                MfgDate: matched.MfgDate || '',
                ExpDate: matched.ExpiryDate || '',
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
                MfgDate: matched.MfgDate || inv.MfgDate,
                ExpDate: matched.ExpiryDate || inv.ExpDate,
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
        window.dispatchEvent(new CustomEvent('phc_db_updated'));
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
      window.dispatchEvent(new CustomEvent('phc_db_updated'));
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
            <span>Punjab Homeopathic Clinic & Pharmacy ‚Ä¢ Goods Received Note (GRN) Stock Audit ‚Ä¢ Confidential Document</span>
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
    const cTag = clinicSettings?.ClinicLogoText || 'HEALING NATURALLY ‚Ä¢ RESTORING BALANCE';
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
                <div class="addr">üìç ${cAddr} &nbsp;|&nbsp; üìû ${cPhone} &nbsp;|&nbsp; üåê ${cWebsite.replace(/^https?:\/\//, '')}</div>
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
                <div class="card-title">üè¢ Supplier / Distributor Details</div>
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
                <div class="card-title" style="text-align: right;">üìä Accounts Payable Summary</div>
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
              <span>Punjab Homeopathic Clinic & Pharmacy ‚Ä¢ üåê ${cWebsite.replace(/^https?:\/\//, '')} ‚Ä¢ üìû Helpline: ${cPhone}</span>
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
    const cTag = clinicSettings?.ClinicLogoText || 'HEALING NATURALLY ‚Ä¢ RESTORING BALANCE';
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
                <div class="addr">üìç ${cAddr} &nbsp;|&nbsp; üìû ${cPhone} &nbsp;|&nbsp; üåê <a href="${cWebsite}" target="_blank" style="color: #2563eb; text-decoration: underline;">${cWebsite.replace(/^https?:\/\//, '')}</a></div>
              </div>
              <div class="badge-box">
                <div class="badge">PAYMENT VOUCHER / RECEIPT</div>
                <div class="vch-no">VCH #${voucherNo}</div>
                <div class="meta">Date: <strong>${paymentDate}</strong></div>
              </div>
            </div>

            <div class="grid-box">
              <div class="card">
                <div class="card-title">üè¢ Payee / Vendor Details</div>
                <div class="vendor-name">${vendor.VendorName}</div>
                <div class="info-line">Vendor ID: <strong>${vendor.VendorID || 'N/A'}</strong></div>
                <div class="info-line">Contact Person: <strong>${vendor.ContactPerson || 'N/A'}</strong></div>
                <div class="info-line">Phone: <strong>${vendor.Phone || 'N/A'}</strong></div>
                <div class="info-line">Address: <strong>${vendor.Address || 'N/A'}</strong></div>
              </div>

              <div class="card">
                <div class="card-title">üí≥ Payment Voucher Particulars</div>
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
              <span>Punjab Homeopathic Clinic & Pharmacy ‚Ä¢ üåê <a href="${cWebsite}" target="_blank" style="color: #2563eb; text-decoration: underline;">${cWebsite.replace(/^https?:\/\//, '')}</a> ‚Ä¢ üìû Helpline: ${cPhone}</span>
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
            <span>üí≥ BILL PAYMENTS & SETTLEMENT HISTORY (RECORDED PAYMENTS)</span>
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
            <span>‚ö° ITEMS RECEIVED IN GRN (GOODS RECEIVING SUMMARY)</span>
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
                ${isCashOrder ? 'üíµ Spot Cash' : 'üí≥ Credit (Payable)'}
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
                ${isCashOrder ? 'üíµ Cash Order PO (Spot Paid)' : 'üí≥ Credit Order PO (Vendor Payable)'}
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
              <span>üìä PO Financial Status, Payments & Outstanding Dues</span>
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

          <!-- Items Received via GRN Breakdown Section -->
          ${grnSummaryHtml}

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
            <span>Punjab Homeopathic Clinic & Pharmacy ‚Ä¢ Official Purchase Order (PO) ‚Ä¢ Confidential Document</span>
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
              <span className="text-[10px] text-slate-400 font-semibold">Punjab CMS ‚Ä¢ Enterprise ERP</span>
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
                { id: 'today', label: '‚òÄÔ∏è Daily' },
                { id: 'this_week', label: 'üìÖ Weekly' },
                { id: 'this_month', label: 'üìä This Month' },
                { id: 'this_year', label: `üìà CY ${currentYear}` },
                { id: 'all_time', label: 'üåê All Time' }
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
                <option value="all">üìÖ All Months (Full Period)</option>
                {monthOptions.map(m => (
                  <option key={m.value} value={m.value}>
                    üìÖ {m.label}
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
      {activeTab === 'overview' && (
        <div className="space-y-6">
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
                  onClick={() => handleOpenNewPoModal()}
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
      {/* TAB: FINANCIAL YEAR & CALENDAR PERIODS AUDIT */}
      {/* ========================================================================= */}
      {activeTab === 'fiscal_calendar' && (
        <FiscalCalendarDesk
          currentUser={currentUser}
          clinicSettings={clinicSettings}
          appointments={appointments}
          patientVisits={patientVisits}
          posSales={posSales}
          expenses={expenses}
          payrolls={payrolls}
          transactions={transactions}
          grns={grns}
          vendors={vendors}
        />
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
              {/* Period Quick Filters & Fiscal Dropdowns */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex flex-wrap items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
                  {[
                    { id: 'today', label: '‚òÄÔ∏è Daily' },
                    { id: 'this_week', label: 'üìÖ Weekly' },
                    { id: 'this_month', label: 'üìä This Month' },
                    { id: 'this_year', label: `üìà CY ${currentYear}` },
                    { id: 'all_time', label: 'üåê All Time' }
                  ].map(p => (
                    <button
                      key={p.id}
                      onClick={() => handleQuickPresetChange(p.id as any)}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                        cashBookDateFilter === p.id && selectedFiscalMonth === (p.id === 'this_month' ? currentYearMonth : 'all')
                          ? 'bg-purple-900 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>

                {/* Year Dropdown */}
                <div className="flex items-center space-x-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 h-8.5 shadow-2xs">
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

                {/* Month Dropdown */}
                <div className="flex items-center space-x-1.5 bg-purple-50/80 border border-purple-300 rounded-xl px-2.5 h-8.5 shadow-2xs">
                  <span className="text-[10px] font-black text-purple-950 uppercase tracking-wider">Month:</span>
                  <select
                    value={selectedFiscalMonth}
                    onChange={e => handleFiscalMonthSelect(e.target.value)}
                    className="text-xs font-black text-purple-900 bg-transparent focus:outline-hidden cursor-pointer font-mono"
                  >
                    <option value="all">üìÖ All Months (Full Period)</option>
                    {monthOptions.map(m => (
                      <option key={m.value} value={m.value}>
                        üìÖ {m.label}
                      </option>
                    ))}
                  </select>
                </div>
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
                              row.type?.includes('Spot Cash') || row.type?.includes('Cash Purchase')
                                ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                                : row.credit > 0
                                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                : 'bg-indigo-100 text-indigo-900 border border-indigo-300'
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
                            {(row.type.includes('GRN') || row.type === 'Goods Received (GRN)') && (row.rawItem?.ItemsReceived || row.rawItem?.Items) ? (
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
                  onClick={() => handleOpenNewPoModal()}
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
                    filteredPurchaseOrders.map((po, idx) => {
                      const breakdown = getPoItemFulfillmentBreakdown(po, grns);
                      const isExpanded = expandedPoId === po.POID;

                      return (
                        <React.Fragment key={po.POID || po._id || idx}>
                          <tr className={`hover:bg-slate-50 transition-colors ${isExpanded ? 'bg-indigo-50/40' : ''}`}>
                            <td className="p-3">
                              <div className="flex items-center space-x-2">
                                <button
                                  type="button"
                                  onClick={() => setExpandedPoId(isExpanded ? null : po.POID)}
                                  className={`w-6 h-6 rounded-md flex items-center justify-center transition cursor-pointer border ${
                                    isExpanded
                                      ? 'bg-indigo-600 text-white border-indigo-600'
                                      : 'bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-200'
                                  }`}
                                  title={isExpanded ? 'Hide item breakdown & remaining balance' : 'View item breakdown & remaining balance'}
                                >
                                  <ChevronRight className={`w-3.5 h-3.5 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} />
                                </button>
                                <div className="flex items-center space-x-1.5">
                                  <span className="font-mono font-bold text-indigo-600">{po.POID}</span>
                                  {po.PaymentMethod === 'Cash' || (po as any).PaymentTerms === 'Cash' ? (
                                    <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300 shrink-0">CASH</span>
                                  ) : (
                                    <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-indigo-100 text-indigo-800 border border-indigo-200 shrink-0">CREDIT</span>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="p-3 font-bold text-slate-900">{po.VendorName}</td>
                            <td className="p-3 text-slate-600">{po.OrderDate}</td>
                            <td className="p-3 text-slate-600">{po.ExpectedDeliveryDate || 'N/A'}</td>
                            <td className="p-3 text-center">
                              <div className="font-bold text-slate-700">{po.Items?.length || 0} items</div>
                              {breakdown.totalReceivedQty > 0 && breakdown.totalRemainingQty > 0 ? (
                                <div className="inline-block mt-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-900 border border-amber-200">
                                  ‚ö° {breakdown.totalRemainingQty} pcs remaining
                                </div>
                              ) : breakdown.isFullyReceived ? (
                                <div className="inline-block mt-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                  ‚úì All {breakdown.totalOrderedQty} received
                                </div>
                              ) : (
                                <div className="inline-block mt-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600">
                                  All {breakdown.totalOrderedQty} pending
                                </div>
                              )}
                            </td>
                            <td className="p-3 text-right font-bold text-slate-900">Rs. {po.TotalAmount.toLocaleString()}</td>
                            <td className="p-3 text-center">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                po.Status === 'Received' || breakdown.isFullyReceived
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                  : po.Status === 'Partially Received' || breakdown.totalReceivedQty > 0
                                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                  : 'bg-blue-100 text-blue-800'
                              }`}>
                                {po.Status === 'Received' || breakdown.isFullyReceived
                                  ? '‚úì Fully Received'
                                  : po.Status === 'Partially Received' || breakdown.totalReceivedQty > 0
                                  ? '‚ö° Partially Received'
                                  : po.Status || 'Approved'}
                              </span>
                            </td>
                            <td className="p-3 text-center whitespace-nowrap">
                              <div className="inline-flex items-center justify-center gap-1.5 align-middle">
                                {/* Toggle Items Details */}
                                <button
                                  type="button"
                                  onClick={() => setExpandedPoId(isExpanded ? null : po.POID)}
                                  className={`h-7 px-2 border rounded-lg text-[11px] font-bold transition inline-flex items-center space-x-1 cursor-pointer shrink-0 ${
                                    isExpanded
                                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                                      : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200'
                                  }`}
                                  title="View Item-Wise Ordered, Received, and Remaining Balance"
                                >
                                  <FileText className="w-3.5 h-3.5" />
                                  <span>{isExpanded ? 'Hide' : 'Items'}</span>
                                </button>

                                {/* EDIT PO BUTTON: Enabled when pending/sent, locked when stock/GRN processed */}
                                {isPoStockReceivedOrLocked(po) ? (
                                  <button
                                    type="button"
                                    disabled
                                    className="w-7 h-7 bg-slate-100 text-slate-400 border border-slate-200 rounded-lg inline-flex items-center justify-center cursor-not-allowed opacity-60 shadow-2xs"
                                    title="üîí Locked: Stock/GRN has already been added for this PO. Editing is not allowed."
                                  >
                                    <Lock className="w-3.5 h-3.5 text-slate-400" />
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => handleOpenEditPoModal(po)}
                                    className="w-7 h-7 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-lg transition inline-flex items-center justify-center cursor-pointer shadow-2xs"
                                    title="Edit Purchase Order (Add/Update items before stock receipt)"
                                  >
                                    <Pencil className="w-3.5 h-3.5" />
                                  </button>
                                )}

                                {po.Status !== 'Received' && !breakdown.isFullyReceived ? (
                                  <button
                                    type="button"
                                    onClick={() => handleOpenGrnForPo(po)}
                                    className="h-7 px-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-[11px] font-bold transition inline-flex items-center justify-center space-x-1 cursor-pointer shrink-0"
                                    title="Process GRN stock inward for remaining items of this PO"
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                    <span className="whitespace-nowrap">
                                      {po.Status === 'Partially Received' || breakdown.totalReceivedQty > 0
                                        ? `Receive (${breakdown.totalRemainingQty})`
                                        : 'Receive Stock'}
                                    </span>
                                  </button>
                                ) : (
                                  <span className="h-7 px-2.5 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-lg text-[11px] font-extrabold inline-flex items-center justify-center shrink-0">
                                    Stock Added
                                  </span>
                                )}

                                <button
                                  type="button"
                                  onClick={() => handleOpenPoWhatsAppModal(po)}
                                  className="h-7 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold transition inline-flex items-center justify-center space-x-1 cursor-pointer shadow-xs shrink-0"
                                  title="Send Purchase Order & Remaining Items to Vendor via WhatsApp"
                                >
                                  <WhatsAppIcon className="w-3.5 h-3.5 text-white" />
                                  <span className="whitespace-nowrap">WhatsApp</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handlePrintPo(po)}
                                  className="w-7 h-7 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg transition inline-flex items-center justify-center cursor-pointer shrink-0 shadow-2xs"
                                  title="Print Official PO with Balance Tracking"
                                >
                                  <Printer className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeletePo(po)}
                                  className="w-7 h-7 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-lg transition inline-flex items-center justify-center cursor-pointer shrink-0 shadow-2xs"
                                  title="Delete PO"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>

                          {/* EXPANDABLE ROW: ITEM-WISE ORDERED, RECEIVED, AND REMAINING BREAKDOWN */}
                          {isExpanded && (
                            <tr className="bg-slate-50/90 border-b-2 border-indigo-200">
                              <td colSpan={8} className="p-4 sm:p-5">
                                <div className="bg-white rounded-2xl border border-indigo-100 shadow-sm p-4 sm:p-5 space-y-4">
                                  {/* Header & Status Alert */}
                                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                                    <div>
                                      <div className="flex items-center space-x-2">
                                        <span className="font-mono font-black text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-lg text-xs">
                                          {po.POID}
                                        </span>
                                        <h4 className="text-sm font-black text-slate-900">
                                          PO Items Fulfillment & Remaining Stock Balance
                                        </h4>
                                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                                          breakdown.isFullyReceived
                                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                            : breakdown.totalReceivedQty > 0
                                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                            : 'bg-blue-100 text-blue-800'
                                        }`}>
                                          {breakdown.isFullyReceived
                                            ? '‚úì All Items Received'
                                            : breakdown.totalReceivedQty > 0
                                            ? `‚ö° Partially Received (${breakdown.totalRemainingQty} pcs pending)`
                                            : '‚è≥ Awaiting Full Delivery'}
                                        </span>
                                      </div>
                                      <p className="text-xs text-slate-500 mt-1">
                                        Supplier: <strong className="text-slate-800">{po.VendorName}</strong> &nbsp;|&nbsp; Ordered: {po.OrderDate} &nbsp;|&nbsp; Expected Delivery: {po.ExpectedDeliveryDate || 'N/A'}
                                      </p>
                                    </div>

                                    {/* Action Buttons in Expanded Row */}
                                    <div className="flex items-center flex-wrap gap-2 shrink-0">
                                      {breakdown.hasPendingItems && (
                                        <button
                                          type="button"
                                          onClick={() => handleOpenGrnForPo(po)}
                                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shadow-xs cursor-pointer"
                                          title="Open GRN Stock Inward for the remaining pending items"
                                        >
                                          <CheckCircle2 className="w-3.5 h-3.5" />
                                          <span>Receive Remaining Items ({breakdown.totalRemainingQty} pcs)</span>
                                        </button>
                                      )}
                                      {breakdown.hasPendingItems && (
                                        <button
                                          type="button"
                                          onClick={() => handleOpenPoWhatsAppModal(po)}
                                          className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer"
                                          title="Send WhatsApp Reminder to vendor with only pending items"
                                        >
                                          <WhatsAppIcon className="w-3.5 h-3.5 text-emerald-600" />
                                          <span>WhatsApp Remaining Reminder</span>
                                        </button>
                                      )}
                                      <button
                                        type="button"
                                        onClick={() => handlePrintPo(po)}
                                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer"
                                        title="Print Official PO with fulfillment and balance summary"
                                      >
                                        <Printer className="w-3.5 h-3.5" />
                                        <span>Print PO Audit</span>
                                      </button>
                                    </div>
                                  </div>

                                  {/* 4 Summary Cards */}
                                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                                      <div className="text-[10px] font-bold text-slate-500 uppercase">Total Ordered</div>
                                      <div className="text-sm font-black text-slate-900 mt-0.5">
                                        {breakdown.totalItemsCount} items ({breakdown.totalOrderedQty} units)
                                      </div>
                                      <div className="text-[10px] text-slate-500 font-medium">Rs. {breakdown.totalOrderedAmount.toLocaleString()}</div>
                                    </div>
                                    <div className="bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
                                      <div className="text-[10px] font-bold text-emerald-700 uppercase">Received in GRN</div>
                                      <div className="text-sm font-black text-emerald-800 mt-0.5">
                                        {breakdown.fulfilledItemsCount} complete ({breakdown.totalReceivedQty} units)
                                      </div>
                                      <div className="text-[10px] text-emerald-600 font-medium">Rs. {breakdown.totalReceivedAmount.toLocaleString()}</div>
                                    </div>
                                    <div className={`p-2.5 rounded-xl border ${breakdown.hasPendingItems ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 border-slate-200'}`}>
                                      <div className={`text-[10px] font-bold uppercase ${breakdown.hasPendingItems ? 'text-amber-700' : 'text-slate-500'}`}>
                                        Remaining / Pending
                                      </div>
                                      <div className={`text-sm font-black mt-0.5 ${breakdown.hasPendingItems ? 'text-amber-900' : 'text-slate-400'}`}>
                                        {breakdown.totalRemainingQty > 0 ? `${breakdown.remainingItemsList.length} items (${breakdown.totalRemainingQty} units)` : '0 units (All Complete)'}
                                      </div>
                                      <div className={`text-[10px] font-bold ${breakdown.hasPendingItems ? 'text-amber-700' : 'text-slate-400'}`}>
                                        Pending Val: Rs. {breakdown.totalRemainingAmount.toLocaleString()}
                                      </div>
                                    </div>
                                    <div className="bg-indigo-50 p-2.5 rounded-xl border border-indigo-200">
                                      <div className="text-[10px] font-bold text-indigo-700 uppercase">Linked GRN Receipts</div>
                                      <div className="text-sm font-black text-indigo-900 mt-0.5">
                                        {breakdown.linkedGrns.length > 0 ? `${breakdown.linkedGrns.length} GRN(s) Logged` : 'No GRN yet'}
                                      </div>
                                      <div className="text-[10px] text-indigo-600 font-mono font-medium truncate">
                                        {breakdown.linkedGrns.map(g => g.GRNID).join(', ') || 'Pending initial receipt'}
                                      </div>
                                    </div>
                                  </div>

                                  {/* Item-by-item Table */}
                                  <div className="overflow-x-auto rounded-xl border border-slate-200">
                                    <table className="w-full text-left text-xs">
                                      <thead>
                                        <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                                          <th className="p-2.5 text-center w-10">#</th>
                                          <th className="p-2.5">Medicine / Item Name</th>
                                          <th className="p-2.5 text-center">Ordered Qty</th>
                                          <th className="p-2.5 text-center">Received in GRN</th>
                                          <th className="p-2.5 text-center bg-amber-50 text-amber-900 border-x border-amber-200">Remaining / Pending</th>
                                          <th className="p-2.5 text-right">Unit Rate (Rs.)</th>
                                          <th className="p-2.5 text-right">Pending Value (Rs.)</th>
                                          <th className="p-2.5 text-center">Fulfillment</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-slate-100 bg-white">
                                        {breakdown.items.map((it, iIdx) => (
                                          <tr key={iIdx} className={it.RemainingQty > 0 ? 'bg-amber-50/20 hover:bg-amber-50/40' : 'hover:bg-slate-50'}>
                                            <td className="p-2.5 text-center font-bold text-slate-400">{iIdx + 1}</td>
                                            <td className="p-2.5">
                                              <div className="font-bold text-slate-900">{it.ItemName}</div>
                                              {it.Category && <div className="text-[10px] text-indigo-600 font-semibold">{it.Category}</div>}
                                            </td>
                                            <td className="p-2.5 text-center font-bold text-slate-700">{it.OrderedQty}</td>
                                            <td className="p-2.5 text-center">
                                              <span className={`font-bold ${it.ReceivedQty > 0 ? 'text-emerald-700' : 'text-slate-400'}`}>
                                                {it.ReceivedQty}
                                              </span>
                                              {it.GrnNumbers.length > 0 && (
                                                <div className="text-[9px] font-mono text-slate-500">{it.GrnNumbers.join(', ')}</div>
                                              )}
                                            </td>
                                            <td className="p-2.5 text-center border-x border-amber-200 bg-amber-50/40">
                                              {it.RemainingQty > 0 ? (
                                                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300">
                                                  {it.RemainingQty} Pending
                                                </span>
                                              ) : (
                                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                                  ‚úì Fulfilled
                                                </span>
                                              )}
                                            </td>
                                            <td className="p-2.5 text-right text-slate-600">Rs. {it.UnitPrice.toLocaleString()}</td>
                                            <td className="p-2.5 text-right font-bold text-slate-900">
                                              {it.RemainingQty > 0 ? `Rs. ${it.RemainingTotal.toLocaleString()}` : '‚Äî'}
                                            </td>
                                            <td className="p-2.5 text-center">
                                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                                it.FulfillmentStatus === 'Fulfilled'
                                                  ? 'bg-emerald-100 text-emerald-800'
                                                  : it.FulfillmentStatus === 'Partially Received'
                                                  ? 'bg-amber-100 text-amber-900'
                                                  : 'bg-rose-100 text-rose-800'
                                              }`}>
                                                {it.FulfillmentStatus}
                                              </span>
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })
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
              <div className="flex items-center space-x-2 self-start">
                <button
                  type="button"
                  onClick={() => {
                    setBulkGrnSelectedPoId('');
                    setBulkGrnRawText('');
                    setBulkGrnParsedItems([]);
                    setBulkGrnFileError('');
                    setShowUploadBulkGrnModal(true);
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition flex items-center space-x-1.5 shadow-sm cursor-pointer"
                  title="Upload Excel or Paste Bulk GRN Receipts"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Upload Bulk GRN</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenGrnForPo()}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-bold text-xs transition flex items-center space-x-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create New GRN</span>
                </button>
              </div>
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
                    filteredGrns.map((grn, idx) => {
                      const isCashGrn = grn.PaymentMethod === 'Cash' || (grn as any).PaymentMode === 'Cash';
                      return (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="p-3">
                            <div className="flex items-center space-x-1.5">
                              <span className="font-mono font-bold text-emerald-700">{grn.GRNID}</span>
                              {isCashGrn ? (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300 shrink-0">CASH</span>
                              ) : (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-indigo-100 text-indigo-800 border border-indigo-200 shrink-0">CREDIT</span>
                              )}
                            </div>
                          </td>
                          <td className="p-3 font-mono font-bold text-indigo-600">{grn.POID}</td>
                          <td className="p-3 font-bold text-slate-900">{grn.VendorName}</td>
                          <td className="p-3 text-slate-600">{grn.ReceivedDate}</td>
                          <td className="p-3 text-slate-500 font-mono">{grn.ChallanNo || grn.SupplierInvoiceNo || 'N/A'}</td>
                          <td className="p-3 text-center font-bold text-slate-700">{grn.Items?.length || 0}</td>
                          <td className="p-3 text-right font-bold text-slate-900">Rs. {(grn.TotalAmount || 0).toLocaleString()}</td>
                          <td className="p-3 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              isCashGrn
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : 'bg-indigo-100 text-indigo-800 border border-indigo-300'
                            }`}>
                              {isCashGrn ? 'üíµ Cash Paid' : 'üí≥ Credit (Payable)'}
                            </span>
                            <div className="text-[10px] font-mono text-slate-600 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded mt-1 font-semibold inline-block cursor-help" title={isCashGrn ? "Double Entry GL Posted: Debit Inventory (103001) | Credit Cash in Hand (101001)" : "Double Entry GL Posted: Debit Inventory (103001) | Credit Accounts Payable (201001)"}>
                              {isCashGrn ? 'GL: Dr Stock | Cr Cash' : 'GL: Dr Stock | Cr AP'}
                            </div>
                          </td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center space-x-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenGrnPrintPreview(grn)}
                              className="px-2.5 py-1 text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition cursor-pointer flex items-center space-x-1 font-bold border border-emerald-200 text-[11px]"
                              title="Print Preview & Dedicated A4 Official GRN Template"
                            >
                              <Eye className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Print Preview</span>
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
                    );
                  })
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
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition flex items-center space-x-1.5 self-start cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Log Financial Voucher</span>
            </button>
          </div>

          {/* Ledger Toolbar with Search and Period Scope Filter */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex flex-col md:flex-row items-center gap-3 justify-between">
            <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full md:w-auto flex-1">
              {/* Search Box */}
              <div className="relative flex-1 w-full sm:min-w-[240px]">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search Txn ID, Category, Description, Method or User..."
                  value={ledgerSearchTerm}
                  onChange={e => setLedgerSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-8 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
                {ledgerSearchTerm && (
                  <button
                    type="button"
                    onClick={() => setLedgerSearchTerm('')}
                    className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Date Filter Mode Toggle */}
              <div className="inline-flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs shrink-0 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setLedgerDateMode('filtered')}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition cursor-pointer ${
                    ledgerDateMode === 'filtered'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  üìÖ Selected Fiscal Scope ({selectedFiscalMonth !== 'all' ? selectedFiscalMonth : selectedFiscalYear})
                </button>
                <button
                  type="button"
                  onClick={() => setLedgerDateMode('all')}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition cursor-pointer ${
                    ledgerDateMode === 'all'
                      ? 'bg-slate-800 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  üåê All History
                </button>
              </div>
            </div>

            {/* Counter Pill */}
            <div className="flex items-center space-x-2 shrink-0 self-end sm:self-auto">
              <span className="text-[11px] font-bold text-slate-600 bg-white border border-slate-200 px-2.5 py-1 rounded-lg">
                Showing: <strong className="text-indigo-700 font-extrabold">{filteredTransactions.length}</strong> / {transactions.length} Vouchers
              </span>
            </div>
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
                {filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-400 font-medium italic">
                      No transaction vouchers found matching the active filters.
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((t, idx) => (
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
                  ))
                )}
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
                      {v.VendorName} (ID: {v.VendorID}) {v.Phone ? `‚Ä¢ üìû ${v.Phone}` : ''}
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

      {/* END OF MAIN ERP CONTENT AREA */}
      </div>
      {showPoModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-5xl w-full p-6 shadow-xl border space-y-5 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="font-bold text-slate-900 text-lg flex items-center space-x-2">
                    <ShoppingCart className="w-5 h-5 text-indigo-600" />
                    <span>{editingPurchaseOrder ? 'Edit & Update Purchase Order' : 'Create Purchase Order & Stock Requisition'}</span>
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-black bg-indigo-50 text-indigo-700 border border-indigo-200">
                    {editingPurchaseOrder ? editingPurchaseOrder.POID : generateNextPoNumber()}
                  </span>
                  {editingPurchaseOrder && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                      ‚úèÔ∏è Edit Mode
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  {editingPurchaseOrder
                    ? 'Modify quantities, update unit rates, add missing medicine items, or adjust order delivery details.'
                    : 'Pick medicines directly from inventory stock list or auto-fill required stock quantities.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowPoModal(false);
                  setEditingPurchaseOrder(null);
                }}
                className="text-slate-400 hover:text-slate-600 font-bold p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                ‚úï
              </button>
            </div>

            <form onSubmit={handleCreatePo} className="space-y-5">
              {/* TOP VENDOR, DATE & PAYMENT TERMS SELECTOR */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
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
                <div>
                  <label className="text-xs font-bold text-slate-700">Purchase Payment Terms</label>
                  <select
                    value={poForm.PaymentMethod || 'Credit'}
                    onChange={e => setPoForm({ ...poForm, PaymentMethod: e.target.value as any })}
                    className="w-full mt-1 p-2 border rounded-xl text-xs bg-white font-bold text-slate-900"
                  >
                    <option value="Credit">üí≥ Credit (Vendor Payable / Udhar)</option>
                    <option value="Cash">üíµ Cash (Spot Payment on Delivery)</option>
                  </select>
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
                      onClick={() => handleOpenQuickAddMedModal()}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition shadow-xs flex items-center space-x-1.5 cursor-pointer"
                      title="Add a brand new medicine to stock master & include in Purchase Order"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Add Medicine</span>
                    </button>
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
                      <span>‚ö° Auto-Select Low Stock</span>
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
                          onChange={e => {
                            setMedicineSearchTerm(e.target.value);
                            setPoGridPage(1);
                          }}
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
                      onChange={e => {
                        setPoCategoryFilter(e.target.value);
                        setPoGridPage(1);
                      }}
                      className="w-full sm:w-auto py-1.5 px-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-indigo-900 cursor-pointer shadow-2xs"
                    >
                      <option value="all">üè∑Ô∏è All Medicine Categories</option>
                      {medicineCategories.map((cat, idx) => (
                        <option key={idx} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center space-x-1 self-start sm:self-auto text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        setMedicineFilterMode('all');
                        setPoGridPage(1);
                      }}
                      className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                        medicineFilterMode === 'all' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 border'
                      }`}
                    >
                      All ({inventoryItems.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setMedicineFilterMode('lowStock');
                        setPoGridPage(1);
                      }}
                      className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                        medicineFilterMode === 'lowStock' ? 'bg-amber-600 text-white' : 'bg-white text-slate-600 border'
                      }`}
                    >
                      Low Stock ({inventoryItems.filter(i => (i.CStock ?? 0) <= ((i.MinStock !== undefined && i.MinStock !== null) ? i.MinStock : 1)).length})
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setMedicineFilterMode('selected');
                        setPoGridPage(1);
                      }}
                      className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                        medicineFilterMode === 'selected' ? 'bg-emerald-600 text-white' : 'bg-white text-slate-600 border'
                      }`}
                    >
                      Selected ({poForm.Items.length})
                    </button>
                  </div>
                </div>

                {/* MEDICINES GRID VIEW WITH PAGINATION */}
                {(() => {
                  const filteredPoMedicines = inventoryItems.filter(med => {
                    const itemName = String(med.ItemName || med.Name || med.title || '');
                    const itemId = String(med.ItemID || med.id || '');
                    const medCat = getMedicineItemCategory(med);
                    const matchCategory = poCategoryFilter === 'all' || 
                                          medCat.toLowerCase() === poCategoryFilter.toLowerCase() ||
                                          medCat.toLowerCase().includes(poCategoryFilter.toLowerCase()) ||
                                          poCategoryFilter.toLowerCase().includes(medCat.toLowerCase());
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
                  });

                  const totalPoItems = filteredPoMedicines.length;
                  const isAll = poGridPageSize === -1;
                  const effectiveSize = isAll ? Math.max(1, totalPoItems) : poGridPageSize;
                  const totalPoPages = isAll ? 1 : Math.max(1, Math.ceil(totalPoItems / effectiveSize));
                  const safePoPage = Math.min(Math.max(1, poGridPage), totalPoPages);
                  const startPoIdx = isAll ? 0 : (safePoPage - 1) * effectiveSize;
                  const endPoIdx = isAll ? totalPoItems : Math.min(startPoIdx + effectiveSize, totalPoItems);
                  const paginatedPoMedicines = isAll ? filteredPoMedicines : filteredPoMedicines.slice(startPoIdx, endPoIdx);

                  return (
                    <div className="space-y-2.5">
                      {/* Sub-header info bar */}
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-indigo-900 px-1">
                        <div className="flex items-center space-x-2 flex-wrap gap-1">
                          <span className="font-semibold">
                            Showing <strong className="font-mono">{totalPoItems === 0 ? 0 : startPoIdx + 1}‚Äì{endPoIdx}</strong> of <strong className="font-mono">{totalPoItems}</strong> medicines
                          </span>
                          {totalPoItems > 0 && (
                            <button
                              type="button"
                              onClick={() => handleSelectAllFilteredMedicines(filteredPoMedicines)}
                              className="px-2.5 py-0.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] transition shadow-2xs flex items-center space-x-1 cursor-pointer"
                              title="Add all currently filtered medicines to requisition list"
                            >
                              <Plus className="w-3 h-3" />
                              <span>‚ö° Add All {totalPoItems} Filtered to PO</span>
                            </button>
                          )}
                        </div>
                        <div className="flex items-center space-x-1.5 self-end sm:self-auto">
                          <label className="text-[11px] text-slate-500 font-bold">Cards per view:</label>
                          <select
                            value={poGridPageSize}
                            onChange={(e) => {
                              setPoGridPageSize(Number(e.target.value));
                              setPoGridPage(1);
                            }}
                            className="py-0.5 px-2 bg-white border border-indigo-200 rounded-lg text-xs font-bold text-indigo-900 cursor-pointer shadow-2xs"
                          >
                            <option value={12}>12 cards</option>
                            <option value={24}>24 cards (Fast)</option>
                            <option value={48}>48 cards</option>
                            <option value={96}>96 cards</option>
                            <option value={-1}>All cards</option>
                          </select>
                        </div>
                      </div>

                      {/* Card Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-[380px] overflow-y-auto p-1">
                        {paginatedPoMedicines.length === 0 ? (
                          <div className="col-span-full py-8 px-4 text-center bg-white rounded-xl border border-dashed border-slate-300 space-y-3">
                            <div className="text-slate-500 font-bold text-xs">
                              {medicineSearchTerm ? (
                                <span>No medicine found matching &quot;<strong>{medicineSearchTerm}</strong>&quot; in inventory stock master.</span>
                              ) : (
                                <span>No medicines found matching the current search &amp; category filter.</span>
                              )}
                            </div>
                            <div>
                              <button
                                type="button"
                                onClick={() => handleOpenQuickAddMedModal(medicineSearchTerm)}
                                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs inline-flex items-center space-x-1.5 cursor-pointer shadow-sm shadow-emerald-600/20"
                              >
                                <Plus className="w-4 h-4" />
                                <span>+ Add {medicineSearchTerm ? `"${medicineSearchTerm}"` : 'New Medicine'} to Stock &amp; PO</span>
                              </button>
                            </div>
                          </div>
                        ) : (
                          paginatedPoMedicines.map((med, idx) => {
                            const cStock = med.CStock ?? med.Stock ?? 0;
                            const minStock = (med.MinStock !== undefined && med.MinStock !== null) ? med.MinStock : 1;
                            const isLow = cStock <= minStock;
                            const reqQty = getRequiredQty(med);
                            const isSelected = isMedicineSelectedInPo(med.ItemID, med.ItemName);
                            const currentPoItem = poForm.Items.find(i => (i.ItemID && i.ItemID === med.ItemID) || i.ItemName === med.ItemName);
                            const medCat = getMedicineItemCategory(med);
                            const priceInfo = getMedicinePriceInfo(med);
                            const unitPrice = priceInfo.unitPrice;
                            const estTotalCost = unitPrice ? unitPrice * reqQty : null;

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
                                    <div className="flex-1 min-w-0 pr-1">
                                      <div className="flex items-center space-x-1.5 group">
                                        <p className="font-bold text-xs text-slate-900 leading-tight truncate" title={med.ItemName}>
                                          {med.ItemName}
                                        </p>
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleOpenEditMedModal(med);
                                          }}
                                          className="p-1 rounded-md text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition cursor-pointer shrink-0"
                                          title={`Edit "${med.ItemName}" Name, Price & Category`}
                                        >
                                          <Pencil className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                      <p className="text-[10px] font-mono text-slate-500">{med.ItemID || 'ITM'}</p>
                                    </div>
                                    <div className="flex items-center space-x-1 shrink-0">
                                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                        isLow ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                                      }`}>
                                        {isLow ? 'LOW STOCK' : 'In Stock'}
                                      </span>
                                    </div>
                                  </div>

                                  {/* Medicine Category Badge */}
                                  <div className="mt-1.5 flex items-center justify-between">
                                    <span className="text-[9.5px] font-extrabold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-150 flex items-center space-x-1">
                                      <span>üè∑Ô∏è</span>
                                      <span>{medCat}</span>
                                    </span>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleOpenEditMedModal(med);
                                      }}
                                      className="text-[10px] text-indigo-600 hover:text-indigo-800 font-bold hover:underline cursor-pointer flex items-center space-x-0.5"
                                    >
                                      <span>‚úèÔ∏è Edit Master</span>
                                    </button>
                                  </div>

                                  <div className="mt-2 text-[11px] space-y-1 text-slate-600">
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

                                    {/* Unit Price (GRN or Last Price) */}
                                    <div className="flex justify-between items-center pt-1 border-t border-slate-100">
                                      <span className="text-slate-500 font-medium flex items-center space-x-1">
                                        <span>Unit Price:</span>
                                        {priceInfo.hasPrice && (
                                          <span className="text-[9px] px-1 py-0.2 bg-emerald-100 text-emerald-800 font-extrabold rounded border border-emerald-200" title={priceInfo.grnInfo || ''}>
                                            {priceInfo.priceSource === 'grn' ? 'Last GRN' : 'Master TP'}
                                          </span>
                                        )}
                                      </span>
                                      {priceInfo.hasPrice ? (
                                        <span className="font-extrabold text-emerald-800 font-mono text-xs">
                                          Rs. {unitPrice?.toLocaleString()}
                                        </span>
                                      ) : (
                                        <span className="text-[9.5px] font-bold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded border border-amber-200">
                                          ‚ö†Ô∏è Price: Not Mentioned
                                        </span>
                                      )}
                                    </div>

                                    {/* Estimate Total Price */}
                                    <div className="flex justify-between items-center pt-0.5">
                                      <span className="text-slate-600 font-semibold">Est. Total Cost:</span>
                                      {estTotalCost !== null ? (
                                        <span className="font-black text-indigo-950 font-mono bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200">
                                          Rs. {estTotalCost.toLocaleString()}
                                        </span>
                                      ) : (
                                        <span className="text-[10px] text-slate-400 italic">
                                          ‚Äî (Price not mentioned)
                                        </span>
                                      )}
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
                                          ‚úï
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
                          })
                        )}
                      </div>

                      {/* Pagination Controls */}
                      {!isAll && totalPoPages > 1 && (
                        <div className="flex items-center justify-between pt-1 text-xs border-t border-indigo-100">
                          <span className="text-[11px] text-indigo-800 font-medium">
                            Page <strong>{safePoPage}</strong> of <strong>{totalPoPages}</strong>
                          </span>
                          <div className="flex items-center space-x-1">
                            <button
                              type="button"
                              onClick={() => setPoGridPage(1)}
                              disabled={safePoPage <= 1}
                              className="p-1 rounded bg-white border border-indigo-200 hover:bg-indigo-50 disabled:opacity-40 disabled:cursor-not-allowed text-indigo-800 cursor-pointer"
                              title="First Page"
                            >
                              <ChevronsLeft className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setPoGridPage(prev => Math.max(1, prev - 1))}
                              disabled={safePoPage <= 1}
                              className="px-2 py-1 rounded bg-white border border-indigo-200 hover:bg-indigo-50 disabled:opacity-40 disabled:cursor-not-allowed text-indigo-800 font-bold flex items-center space-x-1 cursor-pointer"
                            >
                              <ChevronLeft className="w-3 h-3" />
                              <span>Prev</span>
                            </button>
                            <span className="px-2 py-0.5 bg-indigo-600 text-white rounded font-mono font-bold text-[11px]">
                              {safePoPage}
                            </span>
                            <button
                              type="button"
                              onClick={() => setPoGridPage(prev => Math.min(totalPoPages, prev + 1))}
                              disabled={safePoPage >= totalPoPages}
                              className="px-2 py-1 rounded bg-white border border-indigo-200 hover:bg-indigo-50 disabled:opacity-40 disabled:cursor-not-allowed text-indigo-800 font-bold flex items-center space-x-1 cursor-pointer"
                            >
                              <span>Next</span>
                              <ChevronRight className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setPoGridPage(totalPoPages)}
                              disabled={safePoPage >= totalPoPages}
                              className="p-1 rounded bg-white border border-indigo-200 hover:bg-indigo-50 disabled:opacity-40 disabled:cursor-not-allowed text-indigo-800 cursor-pointer"
                              title="Last Page"
                            >
                              <ChevronsRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>

              {/* REQUISITION ORDER SUMMARY TABLE */}
              {(() => {
                const sTerm = medicineSearchTerm.toLowerCase().trim();
                const isFiltered = Boolean(sTerm || poCategoryFilter !== 'all' || medicineFilterMode !== 'all');

                const filteredPoSelectedItems = poForm.Items
                  .map((item, originalIndex) => ({ item, originalIndex }))
                  .filter(({ item }) => {
                    const itemName = String(item.ItemName || '').toLowerCase().trim();
                    const itemId = String(item.ItemID || '').toLowerCase().trim();
                    const category = String(item.Category || '').toLowerCase().trim();
                    const batch = String(item.BatchNo || '').toLowerCase().trim();

                    const matchSearch = !sTerm ||
                      itemName.includes(sTerm) ||
                      itemId.includes(sTerm) ||
                      category.includes(sTerm) ||
                      batch.includes(sTerm);

                    const matchCategory = poCategoryFilter === 'all' || category.includes(poCategoryFilter.toLowerCase());

                    if (!matchSearch || !matchCategory) return false;

                    if (medicineFilterMode === 'lowStock') {
                      const invMed = inventoryItems.find(i => (i.ItemID && i.ItemID === item.ItemID) || i.ItemName === item.ItemName);
                      if (invMed) {
                        const cStock = invMed.CStock ?? invMed.Stock ?? 0;
                        const minStock = (invMed.MinStock !== undefined && invMed.MinStock !== null) ? invMed.MinStock : 1;
                        return cStock <= minStock;
                      }
                    }

                    return true;
                  });

                // Calculate summary metrics
                const totalUnits = poForm.Items.reduce((sum, i) => sum + (Number(i.Qty) || 0), 0);
                const totalEstValuation = poForm.Items.reduce((sum, i) => sum + ((Number(i.Qty) || 0) * (Number(i.UnitPrice) || 0)), 0);
                const pricedItemsCount = poForm.Items.filter(i => (Number(i.UnitPrice) || 0) > 0).length;
                const unpricedItemsCount = poForm.Items.length - pricedItemsCount;

                return (
                  <div className="space-y-2">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                      <div className="flex items-center space-x-2 flex-wrap gap-1">
                        <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                          Selected Order Items Requisition List
                        </label>
                        {isFiltered ? (
                          <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
                            Showing {filteredPoSelectedItems.length} of {poForm.Items.length} Items (Filtered)
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
                            {poForm.Items.length} Items
                          </span>
                        )}
                        {totalEstValuation > 0 && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-200 font-mono">
                            Est. Total: Rs. {totalEstValuation.toLocaleString()}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center space-x-2">
                        {isFiltered && poForm.Items.length > filteredPoSelectedItems.length && (
                          <button
                            type="button"
                            onClick={() => {
                              setMedicineSearchTerm('');
                              setPoCategoryFilter('all');
                              setMedicineFilterMode('all');
                            }}
                            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 underline cursor-pointer"
                          >
                            Show All {poForm.Items.length} Selected Items
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleOpenQuickAddMedModal()}
                          className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center space-x-1 cursor-pointer bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200"
                          title="Register brand new medicine into stock master"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>+ Add Medicine</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleAddPoItem}
                          className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center space-x-1 cursor-pointer bg-indigo-50 px-2 py-1 rounded-lg border border-indigo-150"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add Custom Item Line</span>
                        </button>
                      </div>
                    </div>

                    <div className="border border-slate-200 rounded-xl overflow-hidden max-h-[380px] overflow-y-auto">
                      <datalist id="inventory-med-picker-datalist">
                        {inventoryItems.map((inv: any, invIdx: number) => (
                          <option key={invIdx} value={inv.ItemName || inv.Name}>
                            {inv.ItemID ? `[${inv.ItemID}] ` : ''}{inv.ItemName || inv.Name} - {getMedicineItemCategory(inv)}
                          </option>
                        ))}
                      </datalist>

                      <table className="w-full text-left text-xs">
                        <thead className="sticky top-0 z-10 bg-slate-100 shadow-2xs">
                          <tr className="text-slate-600 font-bold border-b border-slate-200">
                            <th className="p-2.5 w-10 text-center">#</th>
                            <th className="p-2.5">Medicine Name</th>
                            <th className="p-2.5 w-36">Category</th>
                            <th className="p-2.5 w-28">Batch No.</th>
                            <th className="p-2.5 w-24 text-center">Required Qty</th>
                            <th className="p-2.5 w-36 text-center">Unit Price (GRN / Rate)</th>
                            <th className="p-2.5 w-28 text-right">Est. Total</th>
                            <th className="p-2.5 w-12 text-center">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {poForm.Items.length === 0 ? (
                            <tr>
                              <td colSpan={8} className="p-6 text-center text-slate-400 font-medium">
                                No medicines selected yet. Choose items from the grid above or auto-select low stock items!
                              </td>
                            </tr>
                          ) : filteredPoSelectedItems.length === 0 ? (
                            <tr>
                              <td colSpan={8} className="p-6 text-center text-slate-500 font-medium bg-amber-50/50">
                                <p className="font-bold text-slate-700">No selected order items match the active search query or filter.</p>
                                <p className="text-xs text-slate-500 mt-1">({poForm.Items.length} items exist in the total purchase requisition list)</p>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setMedicineSearchTerm('');
                                    setPoCategoryFilter('all');
                                    setMedicineFilterMode('all');
                                  }}
                                  className="mt-2 px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-xs cursor-pointer"
                                >
                                  Clear Search & View All Selected Items
                                </button>
                              </td>
                            </tr>
                          ) : (
                            filteredPoSelectedItems.map(({ item, originalIndex }, filteredIdx) => {
                              const rowPriceInfo = getMedicinePriceInfo(item);
                              const lineValuation = (Number(item.Qty) || 0) * (Number(item.UnitPrice) || 0);

                              return (
                                <tr key={originalIndex} className="hover:bg-slate-50">
                                  <td className="p-2.5 text-center font-bold text-slate-400 font-mono">
                                    {filteredIdx + 1}
                                  </td>
                                  <td className="p-2 font-medium">
                                    <input
                                      type="text"
                                      list="inventory-med-picker-datalist"
                                      placeholder="Search or enter medicine..."
                                      value={item.ItemName}
                                      onChange={e => handleUpdatePoItem(originalIndex, 'ItemName', e.target.value)}
                                      className="w-full p-1.5 border rounded-lg text-xs font-bold text-slate-900 bg-white"
                                    />
                                    {item.ItemID && (
                                      <span className="text-[10px] font-mono text-slate-400 block mt-0.5">
                                        ID: {item.ItemID}
                                      </span>
                                    )}
                                  </td>
                                  <td className="p-2">
                                    <select
                                      value={item.Category || 'Tablet / Capsule'}
                                      onChange={e => handleUpdatePoItem(originalIndex, 'Category', e.target.value)}
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
                                      placeholder="Batch / Ref"
                                      value={item.BatchNo || ''}
                                      onChange={e => handleUpdatePoItem(originalIndex, 'BatchNo', e.target.value)}
                                      className="w-full p-1.5 border rounded-lg text-xs font-mono font-bold bg-amber-50/60 text-amber-900 text-center"
                                    />
                                  </td>
                                  <td className="p-2 text-center">
                                    <input
                                      type="number"
                                      min="1"
                                      placeholder="1"
                                      value={item.Qty}
                                      onChange={e => handleUpdatePoItem(originalIndex, 'Qty', Math.max(1, Number(e.target.value)))}
                                      className="w-20 mx-auto p-1.5 border border-indigo-300 rounded-lg text-xs text-center font-black font-mono bg-indigo-50/40 text-indigo-950"
                                    />
                                  </td>
                                  <td className="p-2 text-center">
                                    <div className="space-y-1">
                                      <div className="relative">
                                        <span className="absolute left-1.5 top-1.5 text-[10px] text-slate-400 font-bold">Rs.</span>
                                        <input
                                          type="number"
                                          min="0"
                                          step="any"
                                          placeholder="0"
                                          value={item.UnitPrice ?? 0}
                                          onChange={e => handleUpdatePoItem(originalIndex, 'UnitPrice', Math.max(0, Number(e.target.value)))}
                                          className="w-28 mx-auto pl-6 pr-1.5 py-1 border border-emerald-300 rounded-lg text-xs text-right font-black font-mono bg-emerald-50/50 text-emerald-950"
                                        />
                                      </div>
                                      {rowPriceInfo.hasPrice && rowPriceInfo.priceSource === 'grn' && (
                                        <span
                                          className="inline-block text-[9.5px] font-extrabold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded border border-emerald-300 max-w-[130px] truncate cursor-help"
                                          title={rowPriceInfo.grnInfo || ''}
                                        >
                                          üè∑Ô∏è GRN #{rowPriceInfo.grnNo || 'Rate'}
                                        </span>
                                      )}
                                      {rowPriceInfo.hasPrice && rowPriceInfo.priceSource === 'master' && (
                                        <span
                                          className="inline-block text-[9.5px] font-bold text-indigo-800 bg-indigo-100 px-1.5 py-0.5 rounded border border-indigo-250 max-w-[130px] truncate cursor-help"
                                          title="Master Item TP Cost Price"
                                        >
                                          üì¶ Master TP
                                        </span>
                                      )}
                                      {!rowPriceInfo.hasPrice && (
                                        <span className="inline-block text-[9px] font-bold text-amber-700 bg-amber-50 px-1 py-0.5 rounded">
                                          Manual Rate
                                        </span>
                                      )}
                                    </div>
                                  </td>
                                  <td className="p-2 text-right">
                                    <span className="font-mono font-bold text-slate-900 text-xs">
                                      Rs. {lineValuation.toLocaleString()}
                                    </span>
                                  </td>
                                  <td className="p-2 text-center">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setPoForm(prev => ({
                                          ...prev,
                                          Items: prev.Items.filter((_, i) => i !== originalIndex)
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
                );
              })()}

              {/* FOOTER & REQUISITION QUANTITY TOTAL */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-200">
                <div className="text-xs space-y-1">
                  <div className="flex items-center space-x-3 flex-wrap gap-1">
                    <div className="flex items-center space-x-1.5">
                      <span className="text-slate-500 font-bold">Total Demand:</span>
                      <span className="text-sm font-black text-indigo-700 font-mono">
                        {poForm.Items.reduce((sum, i) => sum + (Number(i.Qty) || 0), 0).toLocaleString()} Units
                      </span>
                      <span className="text-slate-400 font-medium">({poForm.Items.length} Medicines)</span>
                    </div>

                    <div className="h-4 w-px bg-slate-300 hidden sm:block" />

                    <div className="flex items-center space-x-1.5">
                      <span className="text-slate-500 font-bold">Est. Total Valuation:</span>
                      <span className="text-sm font-black text-emerald-700 font-mono bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        Rs. {poForm.Items.reduce((sum, i) => sum + ((Number(i.Qty) || 0) * (Number(i.UnitPrice) || 0)), 0).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-500 italic">
                    üí° Last unit prices are fetched automatically from previous GRNs and Item TP masters. Final invoice price & discounts are finalized during GRN receipt.
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowPoModal(false);
                      setEditingPurchaseOrder(null);
                    }}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={poForm.Items.length === 0}
                    className={`px-5 py-2.5 rounded-xl disabled:opacity-50 text-white font-bold text-xs transition shadow-sm flex items-center space-x-1.5 cursor-pointer ${
                      editingPurchaseOrder
                        ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/20'
                        : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20'
                    }`}
                  >
                    {editingPurchaseOrder ? (
                      <>
                        <Save className="w-4 h-4" />
                        <span>Save & Update Purchase Order</span>
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="w-4 h-4" />
                        <span>Generate & Post Purchase Order</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QUICK ADD / EDIT MEDICINE POPUP MODAL (Add / Edit Master Stock & Current PO) */}
      {showQuickAddMedModal && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 z-[60]">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 max-h-[92vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-3">
                <div className={`p-2.5 rounded-xl font-bold ${editingQuickMed ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600'}`}>
                  {editingQuickMed ? <Pencil className="w-6 h-6" /> : <Boxes className="w-6 h-6" />}
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base flex items-center space-x-2">
                    <span>{editingQuickMed ? `Edit Medicine: ${editingQuickMed.ItemName || editingQuickMed.ItemID}` : 'Add New Medicine to Stock'}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                      editingQuickMed ? 'bg-indigo-100 text-indigo-800' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {editingQuickMed ? 'Master Inventory & PO' : 'Master Inventory'}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {editingQuickMed
                      ? `Update name, category, pricing, and stock details for item ${editingQuickMed.ItemID || ''}.`
                      : 'Save to stock inventory database and immediately include in current Purchase Order.'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowQuickAddMedModal(false);
                  setEditingQuickMed(null);
                }}
                className="text-slate-400 hover:text-slate-600 font-bold p-1 rounded-lg hover:bg-slate-100 cursor-pointer text-base"
              >
                ‚úï
              </button>
            </div>

            <form onSubmit={handleQuickAddMedicine} className="space-y-4">
              {/* Medicine Name */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">
                    Medicine Name / Formula <span className="text-rose-500">*</span>
                  </label>
                  {editingQuickMed && (
                    <span className="text-[10px] font-mono text-indigo-600 font-bold">
                      ID: {editingQuickMed.ItemID}
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="e.g. BM 50, Arnica Montana 30C, Panadol 500mg"
                  value={quickMedForm.ItemName}
                  onChange={e => {
                    const val = e.target.value;
                    const autoCat = resolveSmartMedicineCategory(undefined, undefined, undefined, val);
                    setQuickMedForm(prev => ({
                      ...prev,
                      ItemName: val,
                      Category: prev.Category === 'BM Drops' || prev.Category === autoCat ? autoCat : prev.Category
                    }));
                  }}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              {/* Category & Unit */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Medicine Category / Group <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={quickMedForm.Category}
                    onChange={e => setQuickMedForm({ ...quickMedForm, Category: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 cursor-pointer"
                  >
                    {medicineCategories.map((cat, idx) => (
                      <option key={idx} value={cat}>{cat}</option>
                    ))}
                    <option value="__custom__">‚ûï Type Custom Category...</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Packaging / Unit
                  </label>
                  <input
                    type="text"
                    list="quick-med-units"
                    placeholder="e.g. Bottle, Pack, Strip, Box"
                    value={quickMedForm.Unit}
                    onChange={e => setQuickMedForm({ ...quickMedForm, Unit: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                  <datalist id="quick-med-units">
                    <option value="Bottle" />
                    <option value="Pack" />
                    <option value="Strip" />
                    <option value="Box" />
                    <option value="Drops 30ml" />
                    <option value="Syrup 120ml" />
                    <option value="Vial" />
                    <option value="Piece" />
                  </datalist>
                </div>
              </div>

              {/* Custom Category Input if selected */}
              {quickMedForm.Category === '__custom__' && (
                <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl space-y-1">
                  <label className="block text-xs font-extrabold text-indigo-900">
                    New Category Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Biochemic Salts, Mother Tincture Special"
                    value={quickMedForm.CustomCategory}
                    onChange={e => setQuickMedForm({ ...quickMedForm, CustomCategory: e.target.value })}
                    className="w-full p-2 bg-white border border-indigo-300 rounded-lg text-xs font-bold text-indigo-950 focus:ring-2 focus:ring-indigo-500/30"
                  />
                </div>
              )}

              {/* Pricing (Trade Price & MRP) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Purchase / Trade Price (TP)
                  </label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-2 text-xs font-bold text-slate-400">Rs.</span>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      placeholder="0"
                      value={quickMedForm.TradePrice}
                      onChange={e => setQuickMedForm({ ...quickMedForm, TradePrice: e.target.value })}
                      className="w-full pl-8 pr-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold font-mono text-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Retail Sale Price (MRP)
                  </label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-2 text-xs font-bold text-slate-400">Rs.</span>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      placeholder="0"
                      value={quickMedForm.SalePrice}
                      onChange={e => setQuickMedForm({ ...quickMedForm, SalePrice: e.target.value })}
                      className="w-full pl-8 pr-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold font-mono text-slate-900"
                    />
                  </div>
                </div>
              </div>

              {/* Stock Levels */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Low Stock Alert Level
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="10"
                    value={quickMedForm.MinStock}
                    onChange={e => setQuickMedForm({ ...quickMedForm, MinStock: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold font-mono text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Current Stock in Hand
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={quickMedForm.InitialStock}
                    onChange={e => setQuickMedForm({ ...quickMedForm, InitialStock: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold font-mono text-slate-900"
                  />
                </div>
              </div>

              {/* Add to current Purchase Order checkbox & Requisition Qty */}
              <div className={`p-3.5 rounded-xl space-y-2.5 border ${
                editingQuickMed ? 'bg-indigo-50/70 border-indigo-200' : 'bg-emerald-50/70 border-emerald-200'
              }`}>
                <label className="flex items-center space-x-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={quickMedForm.AutoAddToPo}
                    onChange={e => setQuickMedForm({ ...quickMedForm, AutoAddToPo: e.target.checked })}
                    className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                  />
                  <span className="text-xs font-extrabold text-slate-900">
                    {editingQuickMed
                      ? 'Keep / Update this medicine in active Purchase Order requisition'
                      : 'Automatically add this medicine to current Purchase Order list'}
                  </span>
                </label>

                {quickMedForm.AutoAddToPo && (
                  <div className="flex items-center space-x-2 pl-6 pt-1">
                    <label className="text-xs font-bold text-slate-800 whitespace-nowrap">
                      Required Order Quantity:
                    </label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={quickMedForm.RequisitionQty}
                      onChange={e => setQuickMedForm({ ...quickMedForm, RequisitionQty: e.target.value })}
                      className="w-24 p-1.5 bg-white border border-indigo-300 rounded-lg text-xs font-black font-mono text-indigo-950 text-center"
                    />
                    <span className="text-xs font-bold text-indigo-700">Units</span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowQuickAddMedModal(false);
                    setEditingQuickMed(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2.5 rounded-xl font-bold text-xs text-white transition shadow-sm flex items-center space-x-1.5 cursor-pointer ${
                    editingQuickMed
                      ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20'
                      : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
                  }`}
                >
                  <Save className="w-4 h-4" />
                  <span>{editingQuickMed ? 'Update Medicine Details' : 'Save Medicine & Add to PO'}</span>
                </button>
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
                ‚úï
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
                        {bulkPoParsedItems.filter(i => i.isMatched).length} Matched in Inventory ‚Ä¢ {bulkPoParsedItems.filter(i => !i.isMatched).length} New / Unmatched
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
                                  ‚úï
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

      {/* MODAL: UPLOAD BULK GRN RECEIVED STOCK (EXCEL / PASTE) */}
      {showUploadBulkGrnModal && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 z-[70] animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-5xl w-full p-6 shadow-2xl border border-slate-100 space-y-4 max-h-[92vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 shrink-0">
              <div className="flex items-center space-x-2.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-black">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base flex items-center space-x-2">
                    <span>Upload Bulk GRN Received Stock (Excel / Paste)</span>
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase">
                      Stock Inward
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Upload supplier invoice / delivery challan (.xlsx, .csv) or paste rows. Order QTY is automatically matched from the selected Purchase Order.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowUploadBulkGrnModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                ‚úï
              </button>
            </div>

            {/* Error Banner */}
            {bulkGrnFileError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center space-x-2 text-rose-800 text-xs font-bold shrink-0">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{bulkGrnFileError}</span>
              </div>
            )}

            {/* Modal Body: 2 Columns */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 overflow-y-auto flex-1 pr-1">
              {/* Left Column: PO Selection & Upload/Paste Inputs (5 cols) */}
              <div className="lg:col-span-5 space-y-3.5 flex flex-col justify-between">
                <div className="space-y-3">
                  {/* PO Selector */}
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Link with Purchase Order (Auto-Picks Order QTY)
                    </label>
                    <select
                      value={bulkGrnSelectedPoId || grnForm.POID}
                      onChange={e => {
                        const newPoId = e.target.value;
                        setBulkGrnSelectedPoId(newPoId);
                        if (bulkGrnRawText) {
                          handleParseBulkGrnText(bulkGrnRawText);
                        }
                      }}
                      className="w-full p-2 border border-emerald-300 rounded-xl text-xs font-mono font-bold bg-white text-emerald-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="">-- Choose Purchase Order --</option>
                      {purchaseOrders.map((p, idx) => (
                        <option key={idx} value={p.POID}>
                          {p.POID} ({p.VendorName}) - {p.Status === 'Received' ? '‚úì Fully Received' : p.Status === 'Partially Received' ? '‚ö° Partial' : 'Pending Order'}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Excel Upload Dropzone */}
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setBulkGrnDragActive(true);
                    }}
                    onDragLeave={() => setBulkGrnDragActive(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setBulkGrnDragActive(false);
                      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                        handleBulkGrnExcelRead(e.dataTransfer.files[0]);
                      }
                    }}
                    onClick={() => bulkGrnFileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-all flex flex-col items-center justify-center space-y-2 ${
                      bulkGrnDragActive
                        ? 'border-emerald-500 bg-emerald-50/50 scale-[0.99]'
                        : 'border-slate-300 hover:border-emerald-500 hover:bg-slate-50/80 bg-white'
                    }`}
                  >
                    <input
                      ref={bulkGrnFileInputRef}
                      type="file"
                      accept=".xlsx,.xls,.csv"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          handleBulkGrnExcelRead(e.target.files[0]);
                        }
                      }}
                    />
                    <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                      <FileSpreadsheet className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-xs font-black text-slate-800 block">Drop Delivery Challan / Excel File Here</span>
                      <span className="text-[10px] text-slate-500 block mt-0.5">Supports .xlsx, .xls, .csv</span>
                    </div>
                  </div>

                  <div className="relative flex py-0.5 items-center">
                    <div className="flex-grow border-t border-slate-200"></div>
                    <span className="shrink mx-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">OR PASTE DATA BELOW</span>
                    <div className="flex-grow border-t border-slate-200"></div>
                  </div>

                  {/* Direct Paste Area */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-700 flex items-center space-x-1">
                        <FileText className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Paste 7-Column Text Data</span>
                      </label>
                      <span className="text-[10px] text-slate-400 font-mono font-medium">Item name, Batch, Mfg, Expiry, Price, QTY, Category</span>
                    </div>
                    <textarea
                      rows={6}
                      value={bulkGrnRawText}
                      onChange={(e) => handleParseBulkGrnText(e.target.value)}
                      placeholder={`Paste tab/comma separated rows from Excel:\nItem Name\tBatch\tMfg Date\tExpiry Date\tPrice\tQTY\tCategory\nPanadol Extra 500mg\tB-2026-101\t2026-01-10\t2028-01-10\t12.50\t100\tTablet / Capsule\nAmoxicillin 250mg\tB-2026-202\t2026-02-01\t2027-12-31\t45.00\t50\tSyrup / Suspension\nBrufen 400mg\tB-2026-303\t2026-01-15\t2028-06-30\t8.75\t200\tTablet / Capsule`}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* Right Column: Parsed Items Preview & Summary (7 cols) */}
              <div className="lg:col-span-7 bg-slate-50/70 border border-slate-200 rounded-2xl p-4 flex flex-col justify-between space-y-3">
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <div>
                      <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                        Parsed GRN Items Preview ({bulkGrnParsedItems.length})
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        {bulkGrnParsedItems.filter(i => i.isMatchedPo).length} Matched in PO ‚Ä¢ {bulkGrnParsedItems.filter(i => !i.isMatchedPo).length} Extra / Unmatched
                      </p>
                    </div>

                    {bulkGrnParsedItems.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setBulkGrnParsedItems([]);
                          setBulkGrnRawText('');
                        }}
                        className="text-[11px] font-bold text-rose-600 hover:text-rose-800 hover:underline cursor-pointer"
                      >
                        Clear Items
                      </button>
                    )}
                  </div>

                  {/* Summary Bar */}
                  {bulkGrnParsedItems.length > 0 && (
                    <div className="grid grid-cols-3 gap-2 bg-white p-2.5 rounded-xl border border-slate-200 text-center shadow-2xs">
                      <div>
                        <span className="text-[10px] text-slate-500 block">Total Items</span>
                        <span className="text-xs font-black text-slate-900">{bulkGrnParsedItems.length}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block">Total Received Qty</span>
                        <span className="text-xs font-black text-amber-700">
                          {bulkGrnParsedItems.reduce((acc, curr) => acc + (Number(curr.ReceivedQty) || 0), 0)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block">Total Inward Value</span>
                        <span className="text-xs font-black text-emerald-700">
                          Rs. {bulkGrnParsedItems.reduce((acc, curr) => acc + ((Number(curr.ReceivedQty) || 0) * (Number(curr.UnitPrice) || 0)), 0).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Items Scrollable Table */}
                  <div className="max-h-64 overflow-y-auto overflow-x-auto border border-slate-200 rounded-xl bg-white shadow-2xs">
                    {bulkGrnParsedItems.length === 0 ? (
                      <div className="p-8 text-center text-slate-400 space-y-1">
                        <FileSpreadsheet className="w-8 h-8 mx-auto text-slate-300" />
                        <p className="text-xs font-bold text-slate-600">No items loaded yet</p>
                        <p className="text-[11px]">Upload an Excel file or paste rows with Item name, Batch, Mfg, Expiry, Price, QTY, Category.</p>
                      </div>
                    ) : (
                      <table className="w-full text-left text-xs min-w-[760px]">
                        <thead className="bg-slate-100 text-slate-700 text-[10px] uppercase font-extrabold sticky top-0 border-b border-slate-200">
                          <tr>
                            <th className="p-2 w-7 text-center">#</th>
                            <th className="p-2 min-w-[120px]">Item Name</th>
                            <th className="p-2 w-28 text-center">Batch</th>
                            <th className="p-2 w-24 text-center">Mfg</th>
                            <th className="p-2 w-24 text-center">Expiry</th>
                            <th className="p-2 w-20 text-right">Price (Rs.)</th>
                            <th className="p-2 w-16 text-center">QTY</th>
                            <th className="p-2 w-32">Category</th>
                            <th className="p-2 w-20 text-right">Subtotal</th>
                            <th className="p-2 w-7 text-center"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {bulkGrnParsedItems.map((item, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/80">
                              <td className="p-2 text-center text-[10px] text-slate-xúÏ}Îr€Jöÿˇ<EÕâEû1u≥‰ãFíã¢hõ;í»°hü={ˆdëâ1Hp P≤F£™˝ë¸JRõ⁄Ÿ≠TmmÌ$yÖT™Ú<ÛôGH}çÓFÉ§$˚ÿ®:«"	4˙Ú›Ø€Ë"òƒµÛ¿¨‹xÉèËóhÛvo=¸;dºˆ‚Í˚Nù:cweZ€Z)z?Mùâ¯XÚvª„Z‰;±[{éßuÓ˝ÙÀèL-v«k-¸?xO≤xﬂ¿ªÃºŒw?"*™ı›IÏÜè”wkkõh◊6÷v,Åùçù8q‰:zâ*œ)6`
Øû^„Wo°ÛaÕª°„jõx»‚˘∞'a0õ‹í6Ì«”è?YÕÆ÷u⁄®Bó–nË~_ﬂ¢Ä˛]µ[áÂ TEªK⁄g|ÓÜÈŒ–èK€óÊ«8t@ÿ≤7‡∂L◊1ú"‹\HI∑ÇªÇzìÈ,∂XU|=≈/Ä¡W,Óû˙ÀF¯d‹pÂ∞˝¬ÊπK«üπ˚V…cß˙√–ÍjÒû"L#g2ƒœW‹*⁄?@7V'€&QoF˚»]ãùpË∆kd"ø≤z>r„√ôˇ·u8È8a‰ §¢ 4t/aÔ⁄ÿôV*^¸yd^⁄ﬂﬂG@|_¢¥∂∂?±ÂÓíô‹b$Ú‚j’f∑6{# …UmkM1¶ù
¿˛a§xK@/äTõõ´(™çÉI  ]Ç¢;Î;$}¡qñ¡a·◊?Gd‡+‘'√#¸ÿó‘lπü<PcPæy6«˘≈@jÛ„‘Øø$`MW¸^•{4z√Qº|pùÃÄãÿ ÏÿõÏØlÿ‹≈Ót≈ô\ó≈É∑/ÓÑ^ﬂΩ'8%ãØdÒ¿
óÜ…íÔ6ü⁄„Å7Æ$f%ëOÓä|ﬂ>à ﬁu˚ÆwI’¬/»ÖEﬂò´»=Wˆü»ÄŒåJHÁa©˚©d4x±cqˆwÑV÷ ◊w˚6p/BgìÇa^É2v^ﬂõ∏Ï;œç~‹¯â»'á'Ë(¶— ßπ∞Ωò˘æpΩ…¿fA%5Ã∞ªA+ƒÀ>Q•±?£ ¨MœNQ¥≤÷Â°ÑÓkﬂ¡ªáˇ◊|$ªki¶
¶±L–˜zˇÜ>}Àº= ˇﬂ[ß∑YYà,LD‹Ëò@ˇ£GË≈¬ºIﬂü‹®íπª
∑ó[û
Ân§œ•Vic£·ŒeT
ë.ò¸d„sb´‡tlb÷ç÷–M•¬8ôÃG´@î6™Ë;îπ#ë¨ÿÔ’µ88˙éÔû≈°7V
7Ì~‰ìÛYkÖﬁn#v` Î{˝ò¥†àûè']©¸]Jø°4—çÑçN}ü˙(∏t√]
$A‰÷ûäﬁLÙ6÷vÍVñN·ùÒbø≥ÎéÒkàùy9‘Ìœˇ˙œxEOdqº¬wÑ¶;LgÄü=◊∫«ÒœŒπÔ™V´1õ≥Øsﬂﬂ¨áNÇÊëı>≠}∑û∂ÿeÙ€Y{◊5w2H‹G[h„ˇ1vÁÙ%íô–™ëÚ®s6
ÆﬁN˝¿0$"´≠\8~‰jŒ%ÎmŸoÀÚ⁄G¯s™{QIæz¬)%˝¯,É.úÑb
;â<¬QäqF}ˆg“w}Â˘Î¡z±Ωx¿‚`ˇÊ<Gé÷|w2åGD€PÔjr4X™¯n}:ıØŸëÙÇWA8∂9å’ap…˛©x¸K8>Û› C¶_cπ*˝éù¿$àkéÔW\L# ≤í'‚åFŒ ∏™ç‚Y©òJŒ{“{çë€ˇ–¬æÔneœm4™mØËî‚:< ˚å‚ ΩÓû¢ä˛Ën	˘ç™zû≤î4GÒeÓ+ÈãÃGåúÏ/†QùvÁmù¥èÍ«ªËÌÈIΩ◊x”<BçzØ˘∫›m5œP£}˙™’≈?¥⁄ßË:©w:≠”◊9ªôM∆‘7ÕEµ#œÒÉ·À5/jO›IVÃë<Ô#ÜoÇIJm#%X2ZÜ?;˝¨Z’Œ˝YH§$-Ödß¯Ù~_˚ÒVÕúâ7Ü±<BŒÄ¸;òÖ¿Tms'K&Âiq´NÇ['∆Œ«⁄˘+QNûrêÖo≥z
uG·¢‡zçg#å`vó£üËZ‡µ~‡KDŒÊçÎ¿p2„00çÎÖq≤#Án|Â‚˝gÛ9œ2
mOœkOr‹¬>é!ˇl˛È+¸"åNõqIÏ∫]+<j¡ÈóÚﬂIB9||6X∞˝PSsƒ?ˇÀˇ¯ˇ˜ÏêéÆKâΩ£'π≥¨ÓDÆÅ¶ÈåîÏºÂ∏ÜR=π1Vd‹Å)N@∞EIìu÷CˆSÒB|ZI_G.÷íÔèΩ(N®g∫Lı≤duÙD˘˝4'ñÉËê‘^î1>ß7˛<kM†”Ûs∏rC¯Ô%&hË:òÖ®˘ãÎ'¬§d‡ƒ¬¥ÑŸ"r?‚Ö¬ù10∫é@ICçQÄı`,Œ` øåë°â{%æ(1%ô“_Òùd†Ï\÷î;2ùü«Ë•≥Ñìóﬂ™œø2¡¿ßê≠t®T*‰®üJá>&£xs∞$2qâ9âCª?,ÚªïWÄ‘‹[• IˇÕÔÒıÇ·–wµÍÅΩjêê˘a¿xô[ZÁXS*f'AoÚ≤¨ÇÁûû”5±uÏ™“ûß®»ü^æ.íÆ%ËSõZ0…≠:≠wÅ*ﬂ¿MU∫Ò,ú Äbù9î›¢7¯Æ≠≠¡`èµ7dh‰.5RdÈ&acâçëôm›Òc‰êÛŸE´òî¨¢€™.ÙÓV=˘[•çWi”ïxÃ—-6ÂÄ√úBë@£Ö®wY§(†≥h.°*•É˚gtÊ∆®Ó˚ª®éI1¶¬ßò
s QR≠ˇ|Ÿµ≈7<¯2ÁAzgÑËn»√.˚·>@˜/˙ßˇò¬Ó	
D®å`∑z=3«’Œ˙!á@ÌG>à4¡Ez“¢ÿRƒ„`S/∞XÖU%gÜÁÃ¥•ÌÁ†-q%Í	õ⁄féKXäïÃ« Âi=1d^ƒÂ‚Åø%cŒ~b«Wfz¨dÕ⁄IuB ∞Ùº’¶ª≤¢ÄNÉXà	≥1‘rÅ†uEHD¬%Ôœ˙s[=¬ /≤B]E ÜﬁƒÒóëŒÍm®Œ≠—‡^LT√ÏX¸{oE|K7|óyÿ"g<ı]j/ä0©w+è—VuÌ∑ﬂ+´è—jıVx†-Ù≠b™∏äv!.NGçö†. \gÀŒCŒ0Ù˛ñãs4ﬁM?n°°3•VÍ<û“®Fõ˙˛6ˆ
Jé JNfÄ…ãÎs∏yü≥{ˆq¡ñ	êGA+KKE*˚-›d dà±ïäIxØ3A≤ ≤-À,/vÚNŒ(1$©Eo˙ÒÈ∆∆ÍÌ˚[-@öCv®b-'–ªy&t”05Æ—e÷æ%‘ÌΩﬁá“)ÿ•ïõ£Nàp(pX@x°W9Ü-åƒRL˛O@˚ËG&πdô≈OÊQ¯Û?‚m¸	B§ïÃó9©€< óØ9JñóíRÀ:Ï7√ißËM≠xÚ¿2n ;W§6 G¶#:ÌSˇÑêA¶ r[îØˇqsÉ»\jP#tÒWòßπ·ÿô‡Ì‡ÚÃ5n®—∆¯V√è{ÎÑ®))nÜDn%R\bÈ)K'πô9ë;6óA$â0NâdY#	º€íd|Gr	¢çEh§•ùã÷ö®-Ï≤È…2Ùv	w>öª,™[íÓRu±h»%Q^3Ì-Å†ó^Ü1ˆt◊_©ñj≈ œïIW,ìMdOC+åëa≈!öbúoÍzÅ%fÿƒZŒc˘E†ﬂo˘˘ô°sÿb∂æI| ¯µF|ïp'9ö4E3 2Ö?w-äÉi'¶Œê8¢MAw¶ÿ'}úÈc‘∑ã1Õ∆ñf"K!Æ‘*ﬁ“Çe∞‘<öHE™üL1XÊôÈlWØÇ ƒga7L.BÎâ&BkSa,xxﬂ⁄GdÂOUâ•5V.∂4t™ÎFÅÈ {àQ´hÁÊüzÄp(ÚÃ%Ü@	qèPØ√õÃ\àä“xM˛RÌÜ&ª‘Ë6ÎΩ&ZGùnª—<;CØ€Ì£3‘m6ö≠wÕ#t⁄∆øV¥™bËR4
ÆxÏ‚‹qJ;Û«)·GÔ(JÈ©eîRƒ5√ù$JiÏÓíQ^"]s∏©ÀG#) Pu£∏¡ mY}–Ä;+v≤V?å·öhAä(,6ΩÇ`	Fú≥IË‡Y≈gZì+'h£’¡,6°,+M≤ﬁ /ô∞c‘ôÖ˝ƒ ëÇ,®“i≥î∏*»˛.Ã [ı·£«Gáe9ö[Ä~7s0~«◊±äÖ˘Ñ®Dd˛¯Iorâ∑ñXarq&ÍÄíO<(ÄE—ûëmÉ ;≠AeN ¶v≠”ni”Ù…Æs’√áQY]-ºULA¯Òß¬€_yæ€√ 4é≠â—éCMæ£Ö?Ù	qÎH>∞9xùNJ`tJIA”ÚI≈Í0ÀÄ†´ßQXÄ4ãƒﬂ Úƒú∆ëù_uv˝+3Œ πnú•‡¡ˇç§ÄMàœ@èÔwL¿‡√"røDñú∆íq J‰¶Ö]Cô°HBY–âΩwÅqo–ŸÏ|Ï≈B(=êiºCpÕõ˜AìÄjt÷<n6zÌ.DK7{ı£zØéœ∫u§0⁄:÷∆¡±ˆÑ8÷ûHë^viM®ÆRerﬁT$K˛¥Ç⁄¯~gEl∆§·L@L9)∞6#ÇY}\ tzòtV»à¿*gÊH$¢œª∑<ó¬ß(ê±<€êÕ‰[q˙≥h7ò≈>÷Îk#o0pïà¨Ò&dr)WVj5L*E≠fVÌo¶Ï~r;≥+LMŸ§ëÏ»¶Ù∞ÙÜ~™‡øﬁaM:IÈΩ*™¡og±œ"jF‰yéƒÔÁ˝#zÖœÂ•_Ô¢Ïò≥∆X	Œ‹è˛ÀˇD™üvÒx‡c!À◊ZﬁÕ{®6åËM":ﬂ˚·(0?äç&d‘ªCä*≤èlO¸|î\"„πË0yIòÚõåÿ—´ä◊™Ù›˚=çÍ-r@˙⁄K°˚ªô∫õ‚”ÅŸXQ\,Zº¶œ“>6PZ˜Ç÷9 “`tª$*l*»Úg{6õN}œ|QB˜ò\RÕ‚4`3C\Û—–¿π∞SÉìI1÷OÛ‘é\√mxç9*ÊŒùkwspôÍïÍ[§„cS:’x¬lq3ÊKGÃ÷‰2˙Óßtƒ|nljãun∏OÏ»ï_™t≠˙'Õ”Í5ª'gX€Í6Î«µ^Î§âU∞^Ô∏I~Ï∂ﬂˆ aµ◊~˝˙∏i°ÉÕ£]es9Ak#á¡¸m¥áïŒ"ë≤\fÓ˘õ˜ LÃB;µÑ;TóI≠4<√}õ*fŒı?{‚∆£`@eÜç‰hJàËa·?i†É>∆«f¯ΩF‡M"ÖπL2¯]{,Òxq√	öõJT~–¢;ä¥V‰eJ÷nå÷nÿE/ÒœêÙvÂ†ÍJ¢≤›É⁄Æ&WK7Åõ˜™î—±™˙ô\:õ“∞°¨HÆÕí¿hs√>√Sfs´˘”?˛ü–Ÿ4àìÆêØÉ‡jœbp†T…<ÒÌˇQ8LıÚ
∏√$ã¢ﬁ'ÒﬁUÉÚ9G|∑“a¿SN≤6ºÇ˙ÙÖ£›R¢¥ˇ'∫_l_v—kwÇ¬,…˜|ﬂ≥˛LGçŒªÍcÑ°m÷è1z√=a0Fﬂõx}îÓÙ#‘yt¸2>/AÅø§ªzÓ¯‡KF7Føw√ U†~“FuM?MrP¸œ¸†é=Á‹Û=®÷◊	"<áŸdÍx‹˜·ﬂ∏@ÿ1≤„ãíÛ¨‘;U<´¡ê‘/Â¬Ò–¿¢cﬂ%´ΩÚBr0Y&ÕÊçFkPÊÚEH,¿c¿‰üò≤DªÆÅ'&>«\O,JÛCÚâd¯Ùó]≤ÜC<&´"'e ü>=xíiV$	∫òÛãî.â`Î‚!
º˙ﬂÍ‚«‘à¯ç"f8ØíΩD"9_¿ã|Ã&ÕÍ!’°±"¶„‚EÓÉaH]aÿiUöÂSO¬}>O‡¥„íSÒ3ÇŒºjò¿»*LåÙ— Fˇ`9*âè9iµ≠”ÊÍ’±ûÙ}´˜+X›^´~åéö«¯¶Ó®—>~{rzf°E%˘ç∂™Mö°0Nï'¸w°Ú§â‡(gxnüïg÷i3
Ò⁄ÉÏA›	¥õ≥uØ$‚R∂0‘±7qYu(ÂÎm´7s™ ,éí»¥è$ß–fï)©îH|7≠-¢#¯ÿSÍdÈt˜ˆ≈óΩDC7fø0}krT“[†—œè⁄∞f˙0O4H⁄‰æÙ6v∫«!;}¯ ©NØjàËf°œ¶Ë[õ"óˆÂ-ÛqåÑõê˘öÀTö¥¡W)POM=›\F<	ËRÎãÇXWÿ◊.‹±DeLS3>énc*–Ë_IÑ»∂ñh'O≥ /¨Ñ.ƒö@Q‹#ïõîjJP∫E.{ƒ@ìwV◊‘‚ù
Ûn´∫(uc¶¥Ïk”UWÇ	±-™5~]ÖK∏8	‚a™ÑòhÏ¶'C†	ﬂ3vº	'êŒá):hgêôÄïFLƒ5™óû+/§}¥! U+	∆¸Hı'fÑ≈`Uãf„±^◊˙X.VsDRÚTa¬•AíÓE⁄›`ÏMjW JR#≈—…∫˙Ò»u¥5]˜‚Pieï\@†(ÉEM@¶!U ∆p=OV ÌPÎho=ï|ûÌ»ÊŒÈÛv¬≤/–ëıCèÃ1™XoüŒê ƒı∞‡hõOWXÀΩ•å’Å¥"êj.ó3Eª•l⁄)ñqkﬁi≠n<‡s≥â◊¶P.{Â *g#R:{·¡∑6ù«ò„¯‡u¢-æœS[<„'¥¨$£z¶Ë-√SZúﬁ#%ñ≈âaÇÜÊ⁄5bË^¯•çiπ[cüÀ=sihRÖ<œ0°ﬁøŸ‹êj∏<Õ7∫Hci	∆ÔŸ∏†Z˘i¿8âGÊ¨xXCX« D™ÅJ[«¥ñ>@
rÆOmôÒ»ã–ÄπôiyèéÔÇ2¬¬∂9åã<ÊúcñMA„âÏL,™ÛÀúi€ıÿ∏˚“Ì•%\zÈ¬‰˚ÿ"ÔÏ2˚ËUº'ëô£9Êÿ!Xﬁ Pº±÷5’{{Î÷õk≤õÍ±õ;Øfë\QÉ…îÀÙEÃ~í∏®}≤oku¬\ÆÖ÷§≥Å)_4£|Úq/ÇÁ_æD'N<¬s¸•x§∆µXÇÁaÃL•obtÿ&<œ^(Œòò√Va‚ ü ,±Æç≠ªw /´§KˆÎ	&Õ!¯Ö/≤Ã˛êü^ˆ˜‹‰íüãß6ôçaﬂ“ñMŸÕ¨Z6ÜØ,;é‘£x$Œ∂—~2∑Ôí·•.„A/ì ïêïU«r’√
iqæ“ËH©ÿI¶-7Ô}›:ö≥57ì"K—[{Œ7‹iœ3}ËNˆ≤‰…^Kj1Ïﬁk€(Ÿ/a˜b˛ÍŸÇPbm¬
kãê)M ~'w/∂7_††E+≥Ò[édÆOê‹UæGÁñ¢˜UR@OÂ Ö⁄Çû…rÒ=€‘ÉÏuG›‹$›FILû¶ƒDË+ÔDD©ÅûÄ(‹…€”ÚˆŸé◊n*µ|¢4Ù.˙Fb°lü/ë˙ma	„æl-C∏À¥¨ÃJ wLµCÁjN™-R}2
·ò∆§ ¸É}◊ÀflIéŸÄ‹ﬁl^ˆb˘ ±!ÎsÕ?ù9ìk˚¿oÿ9t7iÜáIªæ—m≤ÓÁ√/!ZóÑ))Ω€ñ<Së¥ó-Ó	å⁄Â’∂ƒ©;Cf¶–v‡¡Y©–à0r«û*^6z3ÑπJ„Ë*¬Jc+KíëNÃ!_9ËFk≈Ó≥d|[fVûùïah%[ÉÀåkMù.ìø≤‹´TWÒ99ÿ‚<lÈ\l!>∂4Nñl5©8YÆïß˝ÿss≥¯í{∂óÂgéFˆÂ;c≥Œö£-èßŸr5Kæ¶‘sú--√•„k’W∞µ4N«‘eg>û´√—ÑÄK‚FköÑ¨‚"Âol∆*‰êVÊÔ%2RUΩ°¨sè¥ÈÂÛ›vó¢/<üÇøÜÜôqØÕòñ” $´ÄÈﬂ8—ï%]ÿâ§!∏Œ«™\yæo›QµYâæHbKIÃ≥e{§È„q	h•1PﬁÑ†ù}("xNùW°3Ma$À_ékÔØiù,MÃ´∏OIV ˘∑¡h\ï8±Ìº{ÏAl®µÆcY⁄¬ó⁄ñ≈⁄v≈%¢}5Ö‘ Ö…>ïífﬂAÅ0ØO™’°uÙõôY2X≈;·áH¬™øÕˆ˜B{{ÆpôÜjªÌ+ê!,dóóõ√}˜´vª◊ÑbCıNß€~◊Dáo{Ωˆ©Eå∂>Ó∫8c’T·T_n(Ø“©É,L˙ü‰±"r#!ˇL¢x¥k
”SU•ÃJ1xqÏkUW¬Ê≥.Óí∏‹J%öçyÎx¸'˙%™p¡÷Àã˘UAÓıd{Vµ˙R÷rBÑíZËää-ö¶	µ_N" ÃÃsØTUeH©&òi„l}ë}'Ú\Mª4<QÚøJ≠	ûUæ’âÌe
π™zm´˜ì…Kl!lmB?Î€Ké∞$Ÿ8%*K5Ø%ÊN*√ Ósnôb≥ö'±e˘	WñÂÔJîI.uô‰O¨[}D ‡u´7DÓaÇıMqù6UÂÚï%UMËKVõå∆ülè˘§NÏ#Ùñÿ$†<	-≥JUÁªÌ+u≈ÔJóe>nøFΩn˝Ù¨ﬁ ‰•⁄ÀΩèY{yﬁ⁄ „Å¢¥rö≠+Y™h1t	_98ÜËï7¡hY,!>_XSør0¿˚´¨]Y‹ı]™Dπ•Mµ[R9‚–ÔaÚ≥Xu»¯#•:0ímëúﬁGAÚg<F0BNÏß¶ÕÂqX√âyk‰h®C∂‘cÛ„‘ù ¥∞?Ãï	•á[ì~0∆œ“K=J´∞‰^–y¯l©∞bÓÎ%¬XRÖd#/⁄2	ŒãÅùîÈ˝9¿§-Øê‰ÂR‡sËL>@¬À‰ÍKæ  V‚yÃ[7√êKˇ]"ºiTmë¥P_T4Õçty—O2=œH©)}Q±q™∂⁄ìf◊lqD0WÊ´˘2‰^Ojá«å:9‰ÍΩj∞ˆ@2è!⁄g•_Xö2o(M¬≈ÑjápàR!`Ω9OƒXÉAP¿e√]È$d/~™u¥ã._ÆÒ4Ä‘ÙX}Ÿß‰°CV
?√∑ü˛JlS¶6©TwfÛö¬ÙÈ˘≤ı\≠ühsúÙÂës∞]X!S`$ô·≤∏82“óGæQ¿dlŒﬁâ*ÌY≈qpÏR+‘%?·º°HÔ@-Z´Æ à©¡ìπóùP*ÕÏŸÈ&Uâ}ˆ!xâNç50ƒÄAÂÖÔÃµ∂LT–dRin,—õ£¢]()ÂN†ö£9§‹$àhADîP¥7	S∞ßjBmN⁄yâﬁsiÕ:–vÈ4ÒÌMˆô[‚„˚V¡\»Æ–è´∑Ô—nB ÖËàú÷Qiï∞)îÇ∏sEÚ˝“Û°‹Z?@4ƒt]◊õ÷™|i£ÖﬂÚ:ú@Åè!˛Ûck‡ï!<≠ÖâJˆÙhŒ‚0˝|[æ¨‰∂pÜLÑÅ¸mZû©xà∏åaLjÓ®E¸Çd°“Èô∫:äéˆ$û€Wz’/œ'6Ê◊›”hù!gDPë8ÁÈ~ÓöfX\˘BÎº"Óm0Ol≤ŒU[€]´‰Î&sbÑ•£aÀ";.
Óﬁ‰Úò00Í˘äΩ@~Üi≠f˙ëîæ∑Ï§Yî≥{ó·DdÅÌ∞åxóÌ6rszŸI–Èïa;¸ÏÂíÒpçxSQX!€çòag‹ãœKsﬂﬁ0Ä∏≠æ∑xóû)âóÁy…ïÕîŸ,%äE…±l{@Ê/õ ë_à{HÑ‡JÓ8Ué”‚ÄB€(íÇ–?ÛAµ¨7˝¨y±Æ^O©ˆ©∑w?ñ"⁄õ¡Àé1HÕíƒÃßa¢∂÷Ò1,„C
≈≈yxsè,ÔD¶˙Èª;®>¬ﬁ˛HSåWÎ?∂« ˘∆êlD_ÿ·fJ-Y•„ﬁ¥»ÈôT œÂËríÆæÕÙ]ˆ∆dQ‹Mk◊$∞8F¢( ¬Æ†&˙a˛ﬁâ˙∏ã’©K)œπ4®2Œ›Ω÷º~˝Ë5O:«ÌöMŸ}ﬂOø∫ÔÓ˚˙ úãÑw Æ]u¬‡¬Û›>|˛h	G˛r?t÷{ ÕO	GÄ)Ë<Cyv–§OQv¿Üxå¯?^ a›¿_®ùﬁ -7º»÷}Æ>l¡∫õëÖıv9ámﬂÏhπwÇ˘◊ËÃÒ¨oôÂsãÉ4e¡⁄t‰ÁÃÊcSÿû7©§§˛Iû¸'åˇùQ0π@ﬁ¥Dê!æíÄƒÿr⁄j‹À—¡ã;9·s>∏œEõ„R˚WmÓû¥π3Á“M4ÄVÁ:›v£yvΩªÌ„cY£Î8◊a‡˚_µ:ÉVáU∏æE(ëÆàÜ«d∂Å∂˙ã=uÔ*ãÓ„∞©WÙ¥}≈∫‹îÆç0	˛"uJàUúu∂b¶uEÿp™8øÙUˆq~ñ;Èlµ˛J®ëﬁ¶s¶∞çÜ9t"Øœ%Zº∂óÇ†¨ŒSÊ)ÉÚä6’DVä˙hªƒb≤ªIœñ¯„Ò«¢ ;mÄ~VÑºÚEbZ@ÚôËûUT£Åt›|U›˝¥U±r∫8πOX‚'§≠£\g°Âcg~}Q$dJ0[!3É…2Œ¢d∏zNz °-åI›ï	@qjI[ŒπehdI≠.h¨ˇ3PÓÎæ\ÅÏ›≠}HÈ´óÈx˜ür—û±X2∫˜3L_Ωú3L«˚‰œs—˜EùÓ´ŒØ_ù¶ﬂËºk&÷¯°#/:üÖ¥˘:ƒ[ àC˜Ø;Õ”≥º?ó&ê~A⁄øuSV¸&Øãó∑t›>ûjO°È9¶txØìÃ]Ÿj†y3-ê(ÅJìÂ÷@·ÃuPÈîÏÓ˙`¿cﬁZ¿HÃOú∫W¸nÿû Í™‚NÖ∂ö©x∑)wh ıÚ}*ïR≥8U–óøŒr®a¶Í⁄´∆XC–ªıÈæœôû_∫Ωn)†&£îìCû	ëù»íØAò}ÁπWFidô%]tÊË~)æ’ÛÇ€bÄ°j2ÃÄ4dròû±B∏4ôîöÊö‰Á–Qv*»7l}n.8$óö´∑+∆=ãéÆ%ÚÃ;˛Ln•mÏ»  ¶I`ÓÂQrﬂmëJåüjÚ
‘]Z è ê¢Ó„Æ2®È:±…¯Kã~föOºê£ÒÖùÑöÑJ g‚çM/úÅ€R#ºÂ≈<!5»Ω–wœ¶YD⁄¸õÃF¬;’3¶Y.‹€®¡e”àÈFì,æÎCˇS≈®‚ri]&íÊ£Ã≤ë¥KL9JåΩ*àí<§‹D“&qŸıÉÉ…Ø›Î£‡jílç)qÓ‹µ.Î§÷Ñ_5µÁÜÀ%Âû1tπŒÃè+9îkÉO8"ÛC˙√“ÊÃk¢evŸÂsIïˆ§’ËÁõUùûP’)Î#ï9ƒ≥ J\*’ÊÎŸÍñ©O•ÅıÍˆ∑ ”g…˚oW‡*/mOZãp
í+Ko°Li;©⁄›õjwÛàÍ¸2dJI¢{RÄÿPhÿ|Ó⁄‹+Õ˘ú©åÃ@j†'ºŒ +∏y1≥¥®êTñ…I
˘ºΩ9Ö•hd§“"Göè8üƒÅ≤±õOéN:¡Æ®Œ‚÷ú´lîUÓàîòt+¸∂—∞ß Î“x˘©…Ç <…Å∏W§0q9Å∞©¡^*,#Ó)”yKI{I-âüè∞€Ô~FÚ^vAÂEæ¥åøî.˛)
|¥`ÍÉ≤˛ƒÜÇ$X«T|ø–çw”èOh≈LLiÕãÌπÊoì∂VV¢ŒöîTÒ∆Ò}fÆL◊@√r˙Nl@ZV#¢af§míK«…d`d∆#i*¢¿Ä}”¬ â¬C…ÆÃJ”)&}¢*Bè†Tt¿£[]y,≤…qﬁº‚]û
ú∑óÂL{Ê 	äX§—¿#BÇ—∑F¬öúëë4æD´⁄‡ÿ¨›‡ŸÜÿid’8Í.5◊öH(˙ñS8r6
Y≈¢Ô”˝koﬂÎÕ …‰™ËÑ≥Ij2SÓä≈EÄ4.Í«±R¿∏öÙK—Oc®ÄcUAxøæ*µ‘µÖIá¡∑ˆ#V-~*Ë⁄¢¢É¬ã-
‘ÿó¶I∑XnÄÀ]ã‚`⁄	É©3$ˆ⁄"9 ë∞∏ïëƒ’+(˙a.ŒBãÙﬂº'™»∑l¥ I/ëíLE´ªÅJ1.K¨ác~Çb,÷∑DÏ=S–»wf§ákWTY._©å`“b⁄ºó&¯≈0Jé§ÑœÅ=ñà?'¯qªO„*Ôè0®`j–ÁL{Ö¬Ì À˜’"	.äKtêàd¨…Øvà∆&ˇŸ°©CπCÍ˛.€»∏õFd„%0Ô◊z°çdT
€ÙwÍ&~T«”+É∫ÌöÈLcM˘<ÀóÏcﬂ—Ω4“A"àÊ.ÃŒ'√‹ãSπÃ^
)Ú®Z/Z§é∫Úu πÑÇ¥NÛ	”/Jh“»¥‡T4ÓS0∂ãIä)©÷B%”ÍKböê√§=0˛[èQ&- \AX≠ -•(˚gQÂ»¢‹Ö ˇ•ã ô‡ÁPi9'¸–E ƒC._®Ã| ?ìÇeüV‹¥"2Úk‹Ù˝‰J”ù∑^‡›J◊œŒö=9L∫a˘ÇÇ§Á+|ıä¨ûÏ¢!œ%ä^ë«Ó=öNˆaJ^9n ‡/˚™Wu˛ Â…8èQ2–gÀ˘<;.ç#]DøIœ∂¨v£?\≠fÛIˆàjbü“>a…üÂ˙îı–'\9!4+K?î‰’,úxÒÜH˛,ŸÚl‰ı}öùë?J=‹éGXv< ˇ|∫Ì—faÊÖî†|äa)ÊâëyŸW3∑®¿oA˚©Ÿ‘Ø«Jqñª0<FT⁄ òµ•Ü7Í⁄)ilô_K°yE¯TR˚*¿ﬂß /»~%ƒw∫≠”^˝∏âﬁ5Oè⁄]t÷´˜ö'Õ”˛©˘Æ’¸û ˘¢pOõzëV’h⁄X?bfT÷øa^°ˇŸ<B?¸DÚœÖw¿4wùÛ(g¯∏ËG˛^˙)—Ë«iÚ√8˘+ı“ãºsﬂ-Ø[ËÇJÔ?W?∂Ò_å:•Õ[∞,áFµ_l]é~bSâÎ£èí ˙◊`ËÈK˘bÿ+Öª˘D…W∆ÿV¢¯ùÆÅ?ƒ”:tBTyC(a.N¿¢ö›…á‡nÛΩ8œoJq‡€˙Z1xá/%&[™–hC @â$Ä9Ãùk!Ã5ªœ≠ÅÖ"©˝dﬂM%têOb 4NÜtı~üÿÃŒb<“U•æçé›=rùo-Ø 7Íh›Ω©Œ˜íı∏`ÅÌ‚¬#˝ó}w0=9ô48∫…±Cﬂﬁ˙‘Ç»-µ™gO‰«q–I&[©ÓíE|€–?%ìQ»ù©+U±\föà
≥ B‹8$Ä™Ü4Úú `ï˙væKÃ<<:/úºSp;≈.T;≥˚™˚ƒÂ[ÊIó‰ˆy°íprÿ%“^c¸Q–üë√9πn>Å"Oçü≥Ë¨ˇ‰•ß9Ó(ÛDŸ–ïh√»ÏØP°°6Â≥¨E0≥¢¬J⁄Ø^µ-,stﬁû˛U˝Ωiü4€ùzÔM´Å«≠S¸µfØ◊Ïæi÷è¸ØŸUÑãÍ;Q≈¶O≤FˆÒVxØÜ…$&Á—Àµ˘L~J?èG®Û¶ﬁ=©7~XÕ++Ï=g®}≈q0zx€»k2®Ø—iΩ˜∂[?>˛˝˘ÔˇÍ6œzÌ.|X?Æü6ö˙7·SWº	ÕçèüÕŒµ#úy√â∂Äd¬˙°ÍÉA®]4¸ï!aàÕ¢éè%éugΩv¬ë_éfè—±3
BWˇR∆XÒ"Ú˝IpÓ˘t—ø|±U{≤π	¥`„È∆s˝ÄﬂªÁ–Á¸ê¸n«”hw}}:õ¸÷9c7ò:Ò»ÎØM?h«ˆÒYüÖ™Ja°5vÜÙÎìQˇÔ‡ëµËr∏™à˘5ƒ˚ÊR&h%zÆÄ•”Û⁄Ë^∏çL≈T£⁄E◊ fÚÙ"®ŒÖ∫ˆ@ˆ≠û¬UmÛ)¶©õOAØPS0àÓy„!ä¬˛˛;™[‰¯Ò˛Mü@[IqõZH\9˘38ˇ-Ñ„”éobL‹—µ˝Â˚“†S?iﬂ‚[Bà0[9∏’Øx¥ôóv}°'Ç-Hæiº”ãeàMÏG1}"rCÔãÇŒ ˘¡ö€7ÁÅÔ≠è6Î–J©™‹8≤ÑÁîΩß<∆–tI4ö•`∆ò∞õ&úìjmÊ+â(l/«ôΩ≈¨˛Úß?˛W<5 ±∑Ë—‰<ö˛ÍÙ¯ÈﬂO¥x|Ó∑ˇÚﬂoå∆≠Ö.±¶U÷ˇ°t/wˇv˝o◊◊cäoà‚7¨∏‡ªtR°Ú–¡JDY∞… úém⁄ÖÁ4>è§°÷hWWû’≥ôfıê™‹l º“§Kzá,iR…2Jz*≥ òáÂ|≠Ó…≈ÿÒ¿go;ù„VS∞ÚN”‹j÷V1ö]jÉ¸íÈ%«ÑˇP‰úÍ∫ﬁØ@E	ÚT%mb	Y9⁄UwR{}∏Z-»J]⁄f÷l\n”» <¿–ÏπƒjQﬂôz1ö~π∑T∞Üµ“ÅhŒü„˚´"[«|©Áa—ØB˙›º∫ävë¸‹=lÕ∂ı÷Ä$€u/v1†ûÙjj„AÎà6+?=ZΩ≠eœøu÷Êuà◊"¨S∫ïç«õ’îÆ’÷áè$f•~“%ƒ…≤"mJ™–âÃ=jˆÍ≠„3¨yúΩ=9©w@çz˜ËLA*≠<√€„|çﬁ
õeRª ì#âÓ®≠Æ$W&ZSXEß°Fp,‡Ù9]Jñü´»rN
P$çÈƒ·√ôÁÉt£M+äV
‰≠Ø—:T>ƒ¿zéµÌπXvÙ#%)!2ª!2œà∆≠N®ú%Œê>≤i≠+…ˇ#$ÓÈvsz¿€>ÈH°‹19√]ucT‚tΩæ )ú∑Ò$N{ß¯DzŒ«ÂÕVr`Zw˙±-KPæïçÅyLLJΩùµZ‡›T+∑|ßûf™P}S!$ÛCPñÖ›úπY49∞9)&cõ≠ “∞©œãPÈ3Î≥±*!8IKEç,ı“`Û
DP[ïò_ygBÔ≥ŸxÏÑ◊%én3h	ÛÅl1»(Ór›D?&–Ezô'ÅF‚◊›StË˘~Ñ*çäLTwjíXcªÅ£Ñ Õ.≥ﬁ,ñ‡≤¶ˆUø˝‹ ÷ÚXˆ∂¬6Ï¿:"Ü+ﬂ† ë{æÃ]ÂïÖüÕ±Ø«[÷ûÍ»'-%µ8/%üÑPÅhc}sCìı.Îãê‰¶–@’Z§À9:•c8uc‘û≈QÃ¨SáéëF@Pø‚`ë©¯b¬≥<Ù˝ ¬≥bì*∫¿1˚ÿ"™'›ˆ˜gàFWTæoıﬁ†Œ€n„M˝¨â⁄]pXúæ=9ƒˇ4⁄«oONÛ>sù!7jÇÃûxeòo‹,ˆ®Û(#E6›w/‚¨2r&º:∞:ﬂôFÍ¸∫Ω<œ®à3˛G1DÙñJ†¯„â;J"ºÑ/îäI2π\e∞ïP$˜÷„Qπßz◊”9û¬j.fV¨ã5˙E˘:kÌ5úW˛a!Ò	œ¢„Ñ±◊ü˘NïJêÅ`TÃPàru°Å(„F`@ãç‘ùM&≠“èÖ	’ƒA«{Òy0∏ﬂèÒCbÌ±?RÕ6[¬√®Â([R—Æ¢5ﬂùÒ™¡‹≥Å^Í’À·?Fﬁ3L˜oûﬂf∑)ù	*;i¯b≤„ú‘áÓ∞æXø√bYÑBíÈ‡HlH<Ú"féBﬁ$	#CSb[3ÿhbY—ü"BU¥´›+ÛÜìº—0∏*Í∞E76:l	€*EHfêÎî_Jjvæ‘¡ûÔx∫5ÌñˆUäC‰π¸Õ{EÏ<∞∞6 ¨§OÈ¡Å¯’åQ^iÅWHHYafïï’·≤g2ˇ¢ÃX∆‹æ7§”ãD™ö+/jÕòA~7Éï6wI`°{qÃa⁄∑
íîﬁî≤†I&:0E˙‰`¿0î|â¡†¶âï_`Oe]ã¢£êª<ˇ®aÍlùGôöoˇÑ±SÙ{“˜∑È◊yI˚˝]Ój¡˙”®ªÂ≠>C}ÑÂ”Ô?âı¶_.˚ñ^+—™*Ø©–ƒd&“`≥ö_Ê‹À”3i(á†ÊﬁÍ"	D SãfA†»¢ø©ïèÕL∆WU¡3™‘N≠Lí∂vnçõ™<È¡Æ0sı‚q”›ÆQö~8—iﬂ•¿™¨·F/’›¡JÕVÜ%≠So¯ª◊µ.qYEvñ“Î2h^j$∆?ÄÕ¬ﬁ4S{‘ÍÅÎ¥ıöY6œ–·qªÒkÙ™›ïbJãç1”∏ˆBrûlÄí´lõ˘\szï©ûQ √ Ä¬¶ïQbíW€c4—Å(Å2=Øm¢ãf¶KHPìro$}Ñ
ˆr∆§Z√Ì”¨ø∑ëæLz/sY8ìX…?-ΩF⁄ÄU\ô¯ Aß€Ï‘ªÕ#t¯™‘çˆ€”^˝¥Wµr¿“ÅûkcBHqËïÉƒ!Û’g Sπ—áÂ¯§ñtÊ+w∏≈ç7Õ∆Ø˘N∂ªK›ﬁ¿%tå£õ˚=û‘ó≥πi"ﬂIá—∫•ÇÓ,°˜{¨«ãÅgÆ„?¿kBö≠…V6æNíÁ“HV˝˙≥[gåÍæáÍìﬂŒ∆˜E©Ñ–*êK⁄ëw◊–ﬂ‘[Øﬂ‘OP˝∏ÖÍßıˆ§ƒ—Àt˚y÷Ãw‚L;ìéåÑz∆ﬁ¿ sÈ¢7Æ3òÿDiSxgáÿ£7iÑ=èÑ:#';˝k‘)øTØ⁄ÌWµŒ«ı÷â2ôD¡ˇ∑5¨?©œ ›~≈±ÚÍ#(äòÉpã-"â$π  ÆF\Gxb‰“çuÄ'ë<áHΩø¯≈$lÄ†dö*¸2ziìÁó˚™D.s˝û≈|ÿ:>FùvÁm'üæ<uÆiTI)√ìvÊNU~∫H}"S¢mârE[iæ∞PØ»òrÃ(-/äˇ„ãH+ñ2ø¥âøÄ„xÿ¢ú≤bê◊Áˇb
ûˇ≥œˇT÷L–ı “Z~üg´fá«^#¿íıûBj ”Ïò∫¸›≤%Kµ¶$°,8Ö1ü'
ìêéGòT∏N»)Ç™±.y]ûtgôÂéV¬ßo”◊SC∏Ûàπv©àQdÂUQ•1ÏNeN*Õ9ÚßcôêL#¬@ÀfAí*)gie=‘ûh*º¡º:Øi»w'®(∂p¥∞oäüº…Âi@’≥„c]ø4Ò=…£ùwÁíàˆ,kÑi*+öør<u±e©ôl©ö"∂+N˛ŒÁyQ?iV∑9˘õ˜§≈Ø.n
G|Øê+,é±#".XC‡M“N,ñ	Œ|å|π&ôFïÈ¶†≠B0w≈kú1§˝kA”¢Néˆù @hn¿≥2ØHÛr"jr∆å„¯«àûﬂ¬Ã¿BÊ$OÂA\$Ùm‰2B«f÷)®≠M Ö	lŒŸª˝®K¿$ÚW≠”˙)…ÍÛVPÂ∞~÷<BÌSÆ˚¶πÓ?ÄÊRˇBËŒÚQq∫ú~V™å¡…æû°»Ñû=»JT.sy4◊+6°7f˙Õï6∞DïÔ¡kÚCQiÑ˜wﬁ¿<Æz‡◊!ñ2Ò–C¯?ˇ„O’µ¬Ã+CS•Éà/o∏∆3O¯“Üs.5ö.6ò.tò¬¨ÂyÌÙ@†¨ù˙˛>=£*WÅÜﬂ‡›Kk@øè¯S‰^Ã˚˛l‡FÙ˚™"ﬂJ≥—ƒgÉ7ƒd“ëãÏ¸ZËf}∑R¡t1Rj0£_Ú‚x√5‚°KWoT„ˇ‘P¬ﬂ5»›¸4ÆK Ωè 2aUY@àMÄø„ê/xÓÒ;zÒúÕ€û±"/X5ŸGÒQ“∆‰{ ˜´0vúÌÖ∆Ó@‚-qV y‡ÅÆ[o‚<¿ê¬ﬂ1% “M!ê›ûA6É≤@“^êê5 Y8åÛpØŸÅ Ûøpˇ~BûDónv⁄“
≥≈0t~E-jÁ!∫É±†õ^zéòâ§aW;ÅH–√¡|¬D†Ò ±e®T˛ÂŸ$û±®˚s4´ˆ^.£©jŒH±ô5R@¢¿ñdßÿñ∫ëf¨>‚ÉOåâ
ÜI6#œ€«~”•dz˚YT[∑Äı3fàíKpZJ>˚∞S‚ŸÄ’´Æ°w··øAt∏æáø∏f°≠P]x 2õ˝`-9£Xki(|ë∂&ﬂLÄÖÿ∏h£/%
qÄ6¥[(FdäÄöV:»§≤¿-€Ü†…l`¶
ÚÖ!≈€tÉ"0oÚÀÑÂ¸˘øˇC&—ÂhÊíÄ—?ˇÎìJ{ƒÇÊ4Q^Ö…&TK
"ÿTµ8U”?VL∆	hs—‡!q=‹†´≥°3CC≤RŒù%<Ïæë4·i&€T»DGÙ1OÙ=üBN¥À/»_SU…∆ë ™TSìª14&¬´ﬁ=ïkâÌ´ΩÃBIäDaÚú‰∂8»1!x?ˇˇÇ‡xCíï∫lHK(kúe’ôáÇ≥õ¨∆s/\Ã5ËF÷Ö∞DΩ	o°∏ 6´∑PlËÜÃ'2s9≠_dÚ%Û=X6p∆Æ„[√¶®Â<xR›äÍﬂ∑âù<Ûu
ô,cè@'˚;Z]j∆±ÚkIëSå!Æpﬁü† ÅÑÓ&ŸVLJ.Ú·ÍKñ÷¨T˛.s„•CÛô	ºKñ\>>∫*ç'ì¢Ø∏L≠”¥w§¥·h±xﬂ$1Sg≠÷5–1ÈGRx©’«lå‘®”∆z4~ÌlÙõ»#‰ìÄz*ö–òÇ˙©óù åQS∂x
l‹5‡Q≈∆·_Rì—£GH¸ËUÏ÷%ñ„»‹ì˘"kë≤zW˛±º#Yk€‚÷Z0÷f¨¥™©3{2\⁄ñ•ﬁÀÜ‰æÉ&… .Ÿ¥U∞í	FO˙≠∫O≤°ﬁ© pÚ$SÿJ
£(æ≠è}√∂µLÌîî‰´§DÇyÍ´OD9Òu5	¡J BeÈ;ìô„˚◊Sã‡Jù´Â/
 Ut†/QP÷¨ë≤ûS,∫h{#ﬂìÅT,q:⁄iÄ(íó;“¥\s7õ±˜GËÉ˚&ı/ákù6«∏Ä¸≠Ìo√¨◊ìK,§‡ë¯†/S/=@/¡F+,i~≠v_—Ëò{≠:»Åƒ?KP £¯÷i@≈ArøÏΩ0OÿÒC◊\ÉÏˆ*;∑ÑVÏÀ8*¥w°åk¡é
2@ñ‚≈KßxU<¨aﬁ/ÜÒ9<ÛÆ{·b]ú¿çpÜ‘˚!ˇòÇ~R¨‰@-|ë:!8Xk“Î‡“ˇ2ó€° ¯D{Ã>:q‚∆Áèïç«	`÷rp¶’»$‡“ãdÌ€	¸¶≥.à‡óUàø‘”–ΩÑg…ø/ë6§ä_kkkp´.Ää_Ñ¨Ï2`*∫ôE]—Ì)∫Ÿa˝v≥ßLm´ŸÔv˘i95øÁ*ö3t< ',˚˛‚[~x∑®¬ô(˛í.Ô∂J/æoå"∫ΩÒı∑P;ÇƒyËË"πÀ.ô“ƒ$üw›wL>≤Î*	RTO!e6;N≠˙I3vŒ•ÖÓÏ¨uªÿ¥=	Ägü¡ùóò+Ãu∏·ü:˛r2åëÌÚÒ2‡∞À*é¶˜ﬁæ◊üö1?€ËÂ‚wÿ˘uäjf4}55E	/©ê´ÙãCä+I¿ucn2°Û÷≥ÕX∫∆q§Eç_#ıCí⁄hOÏJ	ÛOy7]J~%ÊödVªeÃá/∞Y±[T¶6u°iãäp“∫KÕmå–ÊçlË&'œPÌ˝|G¯6wõ¢¡Ç{P|É∂¸{QÅ˚Ωï3IË◊cVCÚ	Á;«,Ç*Ì˘œìRá&©™d∑ÿ>Íc%È•k¿©)¬P¶ƒµ‚…ºìqwËö7U*{bì¶púO ﬁÿ≈©%6˙≠.…Di*,◊båúcHbdÜiÂ)r…LƒYOM$µìf5’%˘Ç$a„;ìsz˛f∂ñ9ZŸZÙoe›nu™±m∑hÖhM‘Ê«}ÃÖc´∆‡™≥¸úìt#Q¨1rTU∂π˙≥hó…[¬A£ﬂ≥ò¥±ÄÜéÂ:ÿ⁄√tÈÿ* i]Ti—“yN5ò&ZÈ¸∫[]å»Ä‘Ê†^øôÅ5Xûtu¬§J+iû“›ùÛX¢§ËVaŒY
∆nVè£ÛNÍÌÙÙZƒZOØª≥ŸÀ„ﬂßÂû^6æ2V|∂ò;≤ÂK£ﬂ£Eﬂj£8C ±ÃÀÍîÿ,À™!eÀx°≈⁄9hæˆ]∞¯~¨ècSN èw’ﬁãtyjÖ∏©Q5} ⁄∏ZŒP-º¿h∞.k≤ñ∆-VP
lÕ¿ˆÜ‡œ◊<ø1XiñeifaàÊaìÅxN±n0
Y°;∂±∆ÏÖQ¿∑ò¸çÓÖwå^≈ˆe{kèπª‹è[;è—^Ï3¸ÔÊ∆∆OƒÕ5Ìkí;ƒãÖˆ3qÉxì»Ó·≤Ra¬ÉU±ﬁÄ7⁄3-VÕ÷^h[ßµ∞˜„bãã≠qù^VizZIü´Ö}”â˘‚ïM˜LåUR‘~jü4ñ»Gw+Åd˜íBûüîkTú€cí˘yÛ˛3 o…±¸{\$"gÖ⁄|“]…õ!™Ê≥ï^Ù≈E V`Ø†óŸ8oÏ˘e∞ñhm!Í4}¨Wë˙<!trzÏMˆo6’Àãbw∫ø‚L©∫p-§{;	=_’¡/¶Çsƒd$´äWLWî-R+ÁBj¬=jÁãYú∏}‚∆£``≤Q…°$»∞º:˙]¿LÊ9ÛçŸ9◊˜9I◊•Ÿo4ÜäÄ yt„W∞Ñ:Z9ÄˇÔ≠”_¨;t& ÀiÚıÄ≠\êx∆6ÈãZj†∆ì+œÄ¸[ÍQ˙∂ï˙/zçwˆ π6±∑N!ÒìA⁄Cd~3*ÌüÉËëét∏\Éq–BJCÛÓ¡2™¸R·H(ËlQô^-ßA	%∫¯axômÙÖÇÄºÑ™ˆäÑ11Ï√
‘ñhKÆhÈÎ∑ﬁ5¡L
aêRç˙q„ÌqΩ◊jü¢√n≥˛Î£ˆ˜ß
É◊êÌØ!€ÀŸÕ=îï7˜XvS;´¬öJo`IÌÔÇá˝–ΩBóﬁúª€∆<∑ŸwŸﬂ•õzì},¥Ï⁄ÿt?GkÓ<v‹OœÇ´˛vIV[52©-∑†Tô	»ı#∑ ΩÊr‰®ß7«P
Û0s˚8◊xhj^f;g4ò®∂ë;ê∫n‰fòr\Ä’Xﬁ∆¸JjÈ€ı‹ç√-§Ω+.⁄È5π˜îH"—5{Ã‘zÅ>ÍIb“2>+≠ÅÒÖUÑÒ&}√ˆ%ÉyN‘⁄Wqôßda&◊@U1/_i@_¶E©”?∂9ñfßÖ ºDÔi∞È∑7iJ3kC◊˘ÄèmB%±Ä&^ì"˘—–?© eyéÙ`¡ˆÆ,Ë öı!®Y’ﬁNm¶nÃÑÆœ‚ siØèÍ CÿÌ≤ÊÀ~/r€ πm≥$Æ¬ûF:¨~NÎc{ß’ïûk)œ*ÕﬂèNä⁄LLoô‘w¨YAê\aM Î÷’I ≥?ÃÒ∑ãA˘œ„xÍ‘üÀk,ÔÄÏj≤$GT™+’uB¬˝—ipµ·»∏äŒ¶∆NáÀ_(mRg¶Wñ7ØrÈíêB*⁄ëJú˚&qÓss_UÅ2%@¬ñ$Ï≤ñ∆´2Íí)f!fµ†Ø*CËÃñ8Üü¨8±¶∂√ì°› €k`{æQú0f_t&”ˇárPIX£Á÷É|v&‹ÌÏ\æÄAË ∑Í±kV'j:%™ ∞¶sµ˛Aìˇ†∞˘“Óá,2∏∏ˇå˛ÄÒ⁄”^hC1]üöªÏC∞@°ÏèX ù^g$5Mûl»y~2Ô«zé¢úˆÇ5¥@2}ÖØhﬁÚ„IdQÌÍ¿ã ä˚7^D”]b¿≈;∏£⁄¡°ÿã$ñ$¢œÔdZz’™˙¸ñúñ ≥‡;º¯:†[m¯^c‰ˆ?4º∞Ôª[ek»≥º ßQ,PØyJ…+ãüC:í¯ù}€"V ΩÛ∂€xS?k¢v˜®Ÿ=À˜-b$-¯y¥-⁄˛⁄∂h°∂EÃ˜òÑ≤œÂö)*`	Mã
*`›Sœ"%ñãÎ¸˘ÔˇIÅ bføícﬂQª#‘Æ]œ#›ú≈÷EiÀ£?@á∂ÿÈ«ª™’vF¡ƒMSÆx±ÜGfÚB¡;yÍ:ô‡![g(6 ≤mÜöo(≥\ÕΩ,Êp’9Íı¶ˆFówœõ∞–ÏÖŒ˚îE√TÆ◊náiÌy¶ˇ≤æ’¿âFâ9WÃ \^Mb71å¬ˇ$Uo¸ë20ù!_©5jÖﬁ´jßAéPæÇπõ‘V⁄«8x4N¶l(ÜñÙ‚`å:ìësÈ¢sR∏$tI∏=Tf1qtÌ∆∫⁄göÍÍÊ§õÎ =¨iâMbå`ﬂò™¡Qo◊Äñ4Æ⁄T'›˝8y…H⁄ÅnıaÛzí≠ÜÊ„∑ßÓ‰‘ΩbœUƒΩ—>´≠ü£“Àı’ ´3b¿î3x$Ï¥fn™ïˆ·≤Iπ–B:˛¨l€™“¨Aß–—≠-Wv5˚àÙY÷FC√íw$*è≈Ò¿ßﬂå¶ÅüËóò±ËZÂH#[7—ówP›MŒñteÏ>∏æ»ﬂapõÂˇru%ß¨BøŒ◊kÆR"Òùπ∂≤WcZ#5ÆÅ<ör€[6ƒ\%çóæ.∆øpÈ%1T¶fVU%ÖRUIï˘˚ïÀ¸<πÃ|˝ı|&´ÅÛôeÛàß¡ˇ˘e,2Búÿo®,91ÿΩò∏"4Åﬂ¥û^Q0C<rùÅ¡£áíyKYπ,°?©}Càß+NŸ«÷‡©IéW0ﬂÔ∫X ﬁ[èGe¶Ö iñJ˘ß°µ©Wrƒ˙ï$[Nπ‡è¥B˘|C±˙_î_‘«ã≈gÌFg—¢£‘i∏¨y¸k®˜3s/>ô&º«0D’Æ˚#”å/O;MaeS8‡Ü™v™8-…4≥#zaä
∑≈yèµ¡b≈C°÷al¿lÕ+≤¶%:A¿õÂ…±â#åNikGÖ?≠.2∆SJ^¸ÇÙ|…Ì0 ≠ﬂRéeû—‹s&∏¨?·ƒR\8y"ÒU•≠´%¢ [KA≈¯‰Ò\∏Ñ"∏P‡hπ.0_·¬˚@IçcÁ˝wä*≤¬ı2”éMYæ@[ü¿f¸]yr'å=RÛæ¸4ixH2I˙ÒEnäIˇ$ª	ÆÍ˝.˘±ŸÉD∞–Î&› óƒ~¢sËeS≥ÙÓ!€⁄«6GE\º5^‘	Œ‚†ˇÅJ;ƒò˝¡`ºØB•lã”µ-^Wπ≤$pqØ∑’ÕYdã6m‘…ö€”Ø:9¢ô61	0N¯XËÜ‚sÃˇT2î´±€⁄E˛/˙ßDÙv9òuhÉ6Çº{‡IøŒ` v¬Ë¥◊l^SpÌ¡˚%›4iÔåaÛôÒ—EŸ&OYU,ÅJã?<úñ™Rü^Û®ÓŸ+U‰õ/Êö¸T_Ó-{kÆßó≥xC“TØW2êÁ∏FÔ‹2-œ`´‰ŒSdÿıﬂÕú	æ…s£%bÊ9}œ◊‚]πæ_ñbDÇF∞ä;¡(ãäﬁ÷»Tï$D¢‡›¡r&Üm kx-Êí>µ•1C≤c	©E¡ï+Y<jsw`ß]¸¨<êq›∞Ä‘€É%J2™-T⁄√§ ≈}ì¿ÌÍË‰ˇu8!EÂÔçˆó.“VÑR¸ﬁ˚·ù0ËªQÑ^¡ J™BuT¡RWuô¿ÈpÜ.	ƒ‘‚õ^Zí‡Ÿ>∞)Â_†"ôåwxÜXsb∫”Ÿ◊âEªÑüvŒé°Â"ÀK∆ì?h–ò&0€4
î!k¯ñ‘æ˜RÆ‰}2Eçiø0ƒwÍ?ú4O{ËMÎ¨◊Ó˛Ä^Aê1§‰v⁄ù∑_åIDÎ®ˆÆ’¸æ*∆OÉ7^·u6ÿXf,N-qCÊcÈ„øí)⁄V‘ˆŒ\Xeé ∂Ãà¶–µjnidÃïc
óS≤>L©≈H´ÅJón'hüˇ÷\ÓÖü¸+≤‚lè6^“Ä≈€C;e©íH¶hà(vŒà,âÍò‡GÂ˙!E;¶æ ÷)‹«_)&é◊k’!@òÒÓâw Òñä8∏&ëª*œ93àù¸&ªqxúo»å™<™Ê¬Ò#7rèÂì
´ı„„U9¯≤\KÕ<å‰«≤o©)çñåá©Z* ´[^sEyÅYòyõ_ŒÑ#∑y¨I∫£∑&lpBgTZ®x‘@¢Øêì)î∞ ÄÏŸgübØÓŒ;\ÑuÊkºdáÀƒéëuMÛÎ“FêÂ˜;©$NìZ;/gí-"N¢¶ÿzÒxqi˜ñÇ#7‘5§‰îJ ŸëíríåãÙúÒuÌyôÃã‹ú•FÌ≥våùÊœﬁQEü?é∫¬7Il©.÷Ö”Ç|Óé.Nõ∑™jSdÏI∏R∂é?‘∫jnÖäaı`¯¢¿#¿ã«‰ΩÖb1¥∂å¸‹#,_ª8s5…u?Â¸ÿ8ÀÑüú!‰˜TndI&MÁQWÓ“ƒΩõı√†|ãbﬂUËL	Œ\k˙òÏT≈v)ΩıîÓò–\8˙
€Ø‚j≥ÀGãÛóåœ«≠™‘.	m˙‘&S&&ãGï˙∂“º£q••‘l.CsØ7uè3.0 ¡<ßrÍÃ•Ñ≤≠E”… ÿ‡“Ï±eZôygK)&∆Å6¢˝âDã(qEáé¯◊˙≥V§Mõ•ü:ƒÊgﬁÑ;¢7À–/&ﬂ‡W^ÈìóÚõU˘™,¨dG_.çGÍê“Ñû–âLBAÛÛÑïjõ‰)r…Ñbpt6œfWäÕÙ‹%ø°°\«Ç’ˇs¸[áÿ¨<t≈Õ°6TÓ˝`Ö„öBœIËO&4€î£êˆxÀ<kãCß"^"<ÀôB9XÑXˇqkBªÊ.¸èÂ*(•ïK˘BÃÔË¥£™π,…8P>eh4So.óöTcMLÏ_Ãï?´à>º‚l‹Tù(®:i
Ä›¥jC˛|≠lÈUÆ8PÃVê›/Á»pL uÑxjÉæöPJ∏S ÷P¶õ¨A"Å/&ü+&FñMà◊{Ã˙#7$≈ùÿﬂ—Í-MUUo∑¶\G)x6è¨4ú∏X˙Ê}P;‘Ç˝ôõ?±V%ÌÎü“Ìè∆âBÆëπKZ ©
^ïJC¶öb7¢]X(ı)⁄(Ú“h|∞®Ω-[=™M– ïé)À|!œK›V˚âVÉK≥¬®Ì«*2XØPõéAΩ«)Y˛ˇ   ˇˇ‘]€r€8}üØ¿z∂bg∆ñØ…8Œ≠€Iºe«éÂd*;µµ√H¥≈â$™H…è÷ﬂ∞˚∞/˚uÛ%€Ä$ 6@Pí/ÒCbKºÄ@£Ÿó”ß˘∂1¥ˆa|qaù˘Íï∏Ù>	ú⁄∆L'È*#ÂΩÁÁ)JÇæZ ‘ﬂMÀ1Õ*˘1s{¶‰RÊ (≈+ÊﬁàIaØ…ô…
Ÿﬁ8Ã8ÁØ5*Ñ§Ræi!)M1ÜÇAÒœˇ˝áΩ#àûá∆ioŸ?ˇ˚o¶0àg4~ã÷Ú◊öÔ÷<©Ãvõß{-∂w–:9l~Úxπ∫¯4ÊL’Dd?În˘—Â˝¡¨∑ä.Ì‡YK¡9|g8™‰˚vakd»∆çæA£Âc:X[ü≠v∑Íà§IWâÆN*3j/º8¬3$ï≠ÿX"û-eÿ•0ÚX;H:µ’ï›ò\≥@˝À1¯å|•í¶\~™íæX◊ëåŒOK˚RéL¡©í√Í¢b…V¢+G+ÇO)âW™bÙŒx¸"¨«‚T4-∂ßTÿoQ‡¨œó[=n-±qääm”Ô“⁄D∆Ôˆ˛eÏ◊ a É!ã¢˙Äõıó∞Cjç‹FòaAÛW˙˝ŒéJ…ﬁª(ª÷öcgØ}‰·µ„†¨ﬁ∏ÂG≈ƒN=|ˆœ®ìπ˜÷Û©Ã£mì…X´é£‹2˘4∂î∞ª8É$•Ã_%F‡—|I$!‹ºXáx<¥¡%ÖªñWò´πÉxMÓÇ˛≥Á>]˜òˆ’∑^’ªBﬁŒØ9&{§≤Û˚ï´=JNGç¨VóΩº4÷∆qß<ÖOÌ[ù'-rüJ™Ë≥“Œ£Ñ<÷nV?ﬂ€∂ù
U·≈ÄÕO+è?Ïæ›?ùyJ‹\Ë¯Éí+£nº'Tµ‰Œ∫ÉÇÚv–MÆ¨ì@1B/9†‹ÉﬁÖáÈSA≠.u8NÌ*‰ä˘Ù[ø£∏Ç!ÜÏÉÛxfÌCÜ+Î*ôöÂŒ”U#˚l<‹w'jaæÀ∞ëÓçiúBwÍ¸ „AûÄÁ¸≤æ≈ÛYœv]T√±;lBËèy®R?πSqtıdNµ—|ã?Ú∏$≈;I¯)ågq‡&}ªOñ˝,Wí2|ú8iY~Fõ2Â!n`KC{Ò⁄U{Q±ì´ÊgÛu„ÊÙ"Œ˘,π@#Ãåë˛ıµYzõ’Äjt$√$:èî∞÷a|·!y%Q˛•PvËI‘3¸*Ü&Û‹ævcP≤C—	, ∫&ºÜ=•∞∏KT}2õ^3?©$~‹”´‚U≤≈ìSƒdP√uÖ
çIó¯eLVæŸÔ¸r*¶Eå—GΩUïπªçŸø¥Âiø≤?≥∆‡≤R™àY∫IdÖªÓ«ÖŒ®x„UQµ∫ÒWtÊïH‹<ï|±e<J≤ÑòÊŸË¢…]°¥]ë¯˘T'Y˙Zÿ+îÏªÄÏà‡.\ a⁄Z=ö⁄Añ/=`≠˝≥≥√}≠ñ©u÷|∑◊<<~∑_ÓìêÇ∏H§.…uKpÅ†oô}Wm÷oπ-Çï∑°Ç>∞.†z∂ÊÑwi“ZÈ5@∏
˚Réu∂˛ò`Ì∏?ÏÖ qAªç>iäJñ”(*Êl/æ¿®}¶~eÙ>Ω'ÕZÙv_‚•MU=nJÃ÷¸;
†[ ¿úgq‹˚L :›ûïÀYËî"§ Åå3†7k(Çˆúr⁄¸Øgcó≤Ä?	Í<gøƒ9ézòt›pö≥≈FuÁ˘dÈ¡M°7e™H‹E»ï?~Ûm˘‰)úí|◊û8pa8ÛÓïs¿qŒ«3ë≤U∂SìD∞©cÅ _déJP¶<úgx.˝ôóZY…%¶orXÊ•jA€Ω˝8z~Õª∆T:ºåM≠§øu:†ñtŒ˘ó^¸+€?ﬂú6Ÿ@f:Å€7ˆU&ò[Iß‘%—`8¶Uâx°w‡⁄t@W5-–#ŒÆZWœ‰gﬁ∂í)r.C=ºΩcù#Æ‰˙G±c±Êµ"˚ÉŒTÎ!œ˚¶W£nUM¬ÛO◊º”µ’'KÊÓ@ÆØèÚâ˙∆UK˜-Ss-…öê;rqÒ·SB4åè5KAå˘©çﬁ…NÕ≈Ü∞Ÿ}%âé∆jz5_ß('“Pß(îÌ·F[ê¯®‰PhQv∆›=Sb›ù…Üıâ<ƒ2
H&ãøîπ0LZ
ÍÏ
ß(À$/Kâ<Ñ¶˝H¢˛“CÇ˝É∏1y0rèT$‚”Lî!H¶‚^$Á¯V5wÑ#,¯%∏Ó@ÜíLâ–pãEÁrz	ÜˇÚåôﬂ’XﬁLßÂW{ahª™këÙr& =Ü™ôüÆ ˘T,∆mj∑2Ú„®éÕ9Î⁄Î	&Ïé˛zuA'i3KKƒkõÕ¸2UxXü§è0my1õ	,Ω◊Z¬ö8W”«w~]â‘ÄüΩ	É(ÇP¢~(ô;FiÇ9OâÀ∞˜Ì÷">û<.Qê‹}€2¶µmÀú¿iπÇ=?\YcÄ}‡Hi?së˚1≤? ˜”4U…ﬁœ”6e)2ÆÁl™»†≥üòÂAf4c7«U$*bcïaÕHÚeN˝\æ•v.eΩÁDÃ#q
>ç‚^Ù Û…ˆµ>kzüUÉwΩ
¨Ù.ñprS?+È_–,4X;ﬁl¥ùîÏCÿ⁄Õù+MR˛ÄíZO∆Ù8s⁄%Ÿ€WˇA °jB^Í&§Ú≠áEZ\,3ä/Ωå‚a•Ìl
äN‘∑4—∫ÀÈCA€3„[\VöŸ©èüÅÿñÔÅΩÉΩÏX≥”w<≈?ÿ5R∂üÛ¶pŒQ9∫	´?E«#	Ôlx‰—Œ¬›3»à M‡é`ÉÆ{¥≤\ªŒ-õ(˘¡±Á?ΩïìzC!;M í9”≠<da.(Ykè:ãÕÊ5ÆP≤Ú¡º…’ß\»¬ä(ô›JùNæÍµCÁ	Ëû˝/N@E8ï¿ÀùK£V±JÒ/fÿ2uzÒK‹&âΩÇ3{{ıe®¬rÆ—C[¡àI>¶`¨Ö#”± ÁÖÜ~”N7m–°ùÛ§ñ∑vq®I"_◊ôüÏM'Ô≥K‹v%˛8{X3©2˚{Ã$oê«;ÄÁ7F?HË˜I®Fƒfk~#¸ÒÔOŸ.ñ	µ⁄ÇÁ{¬ˇÃû¿™yÆgÿ Ú˝©<ñùﬂ#J±±«sÃ|ü®áèKèf,ô~tiµ‚~›∑±ú:í4Ïî‹/∏ÿx»Ìh∂¬ iwœ¬§/n†≤<‡¶ãÚÆº&ÏÆÒ(|√Ÿ–VÛXöúó|Ê\3£T=7˙Ò•Ÿ·ØÅÁìh o7îxﬁ¬S8™—®ø√Ç¡ïÄé®sÖ°wG4ƒÔ85øú≠¸u¬©íœ{qú,·{ÍG¡ù“‹â¡Ôc?0˝á◊ø.◊n]v≈‹vŒ÷Ñ£ıœæ¡<ë8Q˝Dî<j'dÙÈ‚‡úLì‘”áwD[^òˇ =7¸CÔ‰¬Sj∑·ΩÏ‰M¯ÔÏÂK˛W˛áv¸áA4G„ob‹`É˝ ØUKª¢∂P:˚ß'‡ I?h_1êXfÃÆ-î‰KU¡‰ÿåªÏ…"å$ƒZv	ÚUˆÈõd ⁄PâÏÚHhï…IyØPÁóv?⁄8íÍ§$Å/‡E˘s"—≤{vÄ˛∑r‹8∑qÙ!8®¯£ºãqñÓ£¥9ö◊ÃÊìó,€ï`@E‡ô¬ŒI¸:NÚã’ •s8˘<êÈõ}BÄ˙ú∞È4=£ˇﬁ@˙oÉÓ≥ßû±òGò’Îˇˇà„>˛ﬂã∞≤˛à„Ÿ	‚Œ€Ö¥K£@– Å$~U˙çqg ºnêπ1Û¸Ø+€`'oÊI·”Í÷HeÎ’úZ!{.:ôIA;Ë£QÚs¸û7ÖüGﬁ©æÄj∆Ìh‹∞»"9G"£–B;‘ÿƒóQêo∞zíGﬁ·<Ì=B≠,ƒΩéÇ®á@˙ìΩ◊¨%†zòÄí1Õ{ß7¥óèïÏ£¿.mC`tÓò^®îV;â{=û®|Öπ›.∑ô$’‘Ü5«/˘ô‰ƒ5IûÁ|ï^¸ÃJDk€Q	op∫MU˜k›≤£Q´ˆmTZ/Ù-ÎÏg@’ød∫‘F5©√åN»W∂‡µ¨}{+•∞Y„ÀÇS√Õ¬y÷ëh=¸›xÀ E®‘≠ıÁΩ¶‰ ¬ß3Ø®A”¶≤]ÊÀÏ‚ÚìÒ\zÆ=»Ü˝£+µf≤h`j)†Ã›ΩóY∂á|ù;V©ÿCd?Ú:ídG¬J’UÕòóìP)vÄ»‰dÄ$∂´Áƒ/n®ìç´≈≠'çÁI¿ÔÔ˘Ï‹u†ºî-^”x}*®:]v·a¿SY∂∂π∂∂æ±πıËÒO`_∞ülPWêêÓØÚ	œ8"õ/
%∂™;îf¡œÂ}Ä›eTON<-0ﬁNﬁΩM˝UÜy[M>¯Œr[mèj$˚`ƒ)Cñ≤
◊èrD√%¶küøs%Ó°é¿ﬁY\¢ñù[FÓÅUe‡aAòˆ˝ªÔ˝∏œ€»Úz•∞Å-s[7ÖñÑﬂ£‹Ü<CAtï} A¥Øÿ“ÒPÃV9ƒ~ÛõñbûÄ„ yûΩÄ~ú`'å‡W4éçF√cãe¬U™∑çãÛÓlì%7øcÌ"ükˇ3Y@õQ∆Î∆<K»|wJ˛LGaöaˆXŒ™PíΩÁâPi+OÁ„‚0bä˘Ø	é– ÎÃ9ÆE8\ûœºÓﬂHΩ–Ö⁄ör.ﬁ"J_ñaä˙b…⁄‹»Ïp¯›Û∫≠(zdñƒûå©Dò9 xr!B˘aÓy´çqQóh<Ÿ0>ËÏ–°EÓß,ìg]*h´*œ¬u	∂"å
˙,>Oà≤›ˆ8;Ä>?¸}»O îºÎR˚ƒ±ÙUGÖeoªòb¸”◊™8ÎÇò`⁄’@®Êf≤„1[ï“∑Âöƒv;Ó ‡m~˘}ˆ _Ó≈ÚÔ˙"?±cÑÿ_6vÛÔDñ„√ªø5_±∑«G˚«'Õ≥∑ªl˜‡¸˜Äùºmû5w?-∫Óíc˜Ë…Ø˘Ω÷◊X´Ù¢~ê∞”8Ë,≥7A“ç√Óxô›8	ù7ìblﬁä|$å0ºÿÿ+õÎÎﬂZ{º∂mπ$hê!Ú¨ø∫⁄Q/»¬^‰æí˚{ v`–gÕ^ƒöÉﬂ∆˝E‚Ç◊ƒŸ7(ËiΩÊ…?î≥Ô&Ë5ÿQ‡Õ´-º* 6äËóÉyN1&∞MM¶Ω?ﬁm[l‚éÉü•6N´”F(∞YF‰ïﬂËsÍ;è]z%ë…°>
≤q[ô⁄ﬁßø⁄‹x∑∂√Ì'q∂n÷´±d*>0_4µéG…®¯.YuÊ≈⁄$Ri[z™õHŒF`©wùÃrp[nR$OlˆúE÷nZ∞p6a(LKcˇnﬂ° ê∂ÁO4IâƒÚaj?-ºúÊª=ñôù)ãsàﬂ1œO9ä çŸU<fmê∞÷Év∆ç´Q7î&†ß@⁄[èÍ~ƒñµîœ["aπ∂jë4?ØMfg¢®¥œ>˝Ó˙ªˇ  ˇˇ 26\K