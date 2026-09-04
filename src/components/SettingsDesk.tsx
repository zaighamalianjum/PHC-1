/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { BackupProgressModal } from './BackupProgressModal';
import { MainMenuConfigModal, MainMenuDefinition } from './MainMenuConfigModal';
import { ThermalPrinterSettingsTab } from './settings/ThermalPrinterSettingsTab';
import { 
  Building, 
  UserCheck, 
  Plus, 
  Trash2, 
  Save, 
  ShieldCheck, 
  Settings, 
  Lock, 
  Briefcase, 
  MessageSquare, 
  Database, 
  Server, 
  Wifi, 
  Globe, 
  Key, 
  RefreshCw, 
  CheckCircle2, 
  Sliders, 
  Download, 
  Image, 
  Upload, 
  Printer, 
  FileText, 
  Users, 
  Shield, 
  ShieldAlert, 
  Eye, 
  EyeOff, 
  CheckSquare, 
  Square, 
  UserCog, 
  Unlock, 
  FolderLock, 
  UserPlus, 
  ListOrdered, 
  Ticket, 
  Stethoscope, 
  LayoutGrid, 
  Edit3, 
  CalendarPlus, 
  Calendar, 
  Ban, 
  Zap, 
  Boxes, 
  MapPin, 
  Search, 
  Edit2, 
  Check, 
  Building2, 
  PieChart, 
  Landmark, 
  ShoppingCart, 
  Receipt, 
  BarChart3, 
  Undo2, 
  History, 
  Tag, 
  Smartphone, 
  Menu, 
  X, 
  ChevronRight,
  Layers,
  BadgeCheck,
  AlertCircle
} from 'lucide-react';
import { User, ClinicSettings, SmsSettings, MongoDbSettings, UserRight, City, Patient } from '../types';
import { ROLE_RIGHTS, INITIAL_CITIES } from '../data/initialData';
import { broadcastUserSync } from '../utils/userSync';

interface SettingsDeskProps {
  clinicSettings: ClinicSettings;
  setClinicSettings: (settings: ClinicSettings) => void;
  usersList: User[];
  setUsersList: React.Dispatch<React.SetStateAction<User[]>>;
  currentUser: User;
  smsSettings: SmsSettings;
  setSmsSettings: (settings: SmsSettings) => void;
  mongoDbSettings: MongoDbSettings;
  setMongoDbSettings: (settings: MongoDbSettings) => void;
  cities?: City[];
  setCities?: React.Dispatch<React.SetStateAction<City[]>>;
  onAddCity?: (city: City) => Promise<boolean | void>;
  onDeleteCity?: (cityId: number) => Promise<boolean | void>;
  patients?: Patient[];
}

export default function SettingsDesk({
  clinicSettings,
  setClinicSettings,
  usersList,
  setUsersList,
  currentUser,
  smsSettings,
  setSmsSettings,
  mongoDbSettings,
  setMongoDbSettings,
  cities = INITIAL_CITIES,
  setCities,
  onAddCity,
  onDeleteCity,
  patients = []
}: SettingsDeskProps) {
  // Tabs: settings details vs user management vs access control vs cities
  const [activeSettingsTab, setActiveSettingsTab] = useState<'details' | 'prescription_logo' | 'users' | 'access' | 'thermal' | 'cities' | 'sms' | 'mongodb' | 'maintenance'>('details');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // Cities Management State
  const [citySearchQuery, setCitySearchQuery] = useState('');
  const [editingCityId, setEditingCityId] = useState<number | null>(null);
  const [cityFormName, setCityFormName] = useState('');
  const [cityFormId, setCityFormId] = useState<number | ''>('');
  const [cityFormProvince, setCityFormProvince] = useState('Punjab');
  const [isSavingCity, setIsSavingCity] = useState(false);

  // Custom Access Management System State
  const [selectedAccessUserId, setSelectedAccessUserId] = useState<string>(usersList[0]?.UserID || 'USR-01');
  const selectedAccessUser = usersList.find(u => u.UserID === selectedAccessUserId) || usersList[0];

  // Default permission template
  const defaultPermissionTemplate: NonNullable<User['Permissions']> = {
    canViewDashboard: true,
    canViewPatientDesk: true,
    canViewEMRDesk: true,
    canViewPharmacyPOS: true,
    canViewAccountingDesk: true,
    canViewReportingDesk: true,
    canViewUploadingDesk: true,
    canViewSettingsDesk: true,
    canViewQueryHandlerDesk: true,
    canViewNhcHistoryDesk: true,
    canViewErpDesk: true,

    canAccessWaitingQueue: true,
    canAccessPatientRegistration: true,
    canAccessTokenIssue: true,
    canAccessPatientVisitDesk: true,
    canAccessGridView: true,
    canAccessAppointmentsDesk: true,
    canAccessLargeScreenDisplay: true,

    canAccessClinicalMedicine: true,
    canAccessStoreMedicine: true,
    canAccessSalesReturns: true,
    canAccessStockManager: true,
    canAccessInvoiceLogs: true,
    canAccessMedicineLabels: true,
    canViewPwaInstall: true,

    canAccessErpOverview: true,
    canAccessErpFiscalCalendar: true,
    canAccessErpCashBook: true,
    canAccessErpVendors: true,
    canAccessErpVendorStatement: true,
    canAccessErpPoGrn: true,
    canAccessErpLedger: true,
    canAccessErpHrPayroll: true,
    canAccessErpExpensesAssets: true,
    canAccessErpReporting: true,

    canAddPatient: true,
    canEditPatient: true,
    canIssueToken: true,
    canBookAppointment: true,
    canCancelAppointment: true,
    canDeleteToken: true,
    canCallServeToken: true,
    canEditStockLevel: true,

    canPrintPrescription: true,
    canPrintLabAdvice: true,
    canPrintVisitSlip: true,
    canPrintTokenSlip: true,
    canPrintPOSInvoice: true,
    canPrintVouchers: true,
    canPrintFinancialReports: true,
    canExportCSVExcel: true
  };

  // Main Menus with their sub-menus, item privileges, and descriptions definition
  const MAIN_MENU_CONFIGS: MainMenuDefinition[] = [
    {
      id: 'patients',
      name: 'Patient Intake & OPD Queue Desk',
      permKey: 'canViewPatientDesk',
      menuRightId: 'patients',
      icon: Users,
      color: 'teal',
      desc: 'Token booking, patient registration, OPD waiting queue, clinical visits & appointments',
      subMenus: [
        { key: 'canAccessWaitingQueue', label: 'Waiting Queue Desk', icon: ListOrdered, desc: 'View OPD waiting queue list & live token status' },
        { key: 'canAccessPatientRegistration', label: 'Patient Registration Form', icon: UserPlus, desc: 'Register new patient profiles & manage directory' },
        { key: 'canAccessTokenIssue', label: 'Token Issue Counter', icon: Ticket, desc: 'Generate & issue clinic OPD shift tokens' },
        { key: 'canAccessPatientVisitDesk', label: 'Patient Clinical Visit', icon: Stethoscope, desc: 'Examine patient, record symptoms & clinical diagnosis' },
        { key: 'canAccessGridView', label: 'Patient Master Grid View', icon: LayoutGrid, desc: 'View comprehensive searchable patient master records grid' },
        { key: 'canAccessAppointmentsDesk', label: 'Book Appointment & Calendar', icon: CalendarPlus, desc: 'Schedule future patient appointments & doctor timings' },
        { key: 'canAccessLargeScreenDisplay', label: 'Large Screen Queue Display', icon: Users, desc: 'Full-screen waiting room queue display for TV screens' },
      ],
      actionItems: [
        { key: 'canAddPatient', label: 'Add / Register New Patient Form', icon: UserPlus, desc: 'Allow submitting new patient registration' },
        { key: 'canEditPatient', label: 'Edit Existing Patient Record', icon: Edit3, desc: 'Allow editing patient demographics, age & contact data' },
        { key: 'canIssueToken', label: 'Issue / Generate Tokens', icon: Ticket, desc: 'Allow generating new queue token numbers' },
        { key: 'canCallServeToken', label: 'Call / Serve / Cancel Token', icon: CheckCircle2, desc: 'Allow updating queue token status (Calling / Served / Cancelled)' },
        { key: 'canBookAppointment', label: 'Book / Reschedule Appointment', icon: Calendar, desc: 'Allow scheduling and moving patient appointments' },
        { key: 'canCancelAppointment', label: 'Cancel / Delete Appointment', icon: Ban, desc: 'Allow cancelling or deleting booked appointments' },
        { key: 'canDeleteToken', label: 'Delete Issued Token', icon: Trash2, desc: 'Allow deleting or voiding mistakenly generated tokens' },
        { key: 'canPrintTokenSlip', label: 'Print OPD Queue Token Ticket', icon: Ticket, desc: 'Allow printing thermal token tickets' },
        { key: 'canPrintVisitSlip', label: 'Print A5 Patient Visit Receipt', icon: Printer, desc: 'Allow printing consultation visit receipt' },
        { key: 'canExportCSVExcel', label: 'Export Patients Directory to CSV/Excel', icon: Upload, desc: 'Allow exporting patient records to spreadsheet' }
      ]
    },
    {
      id: 'emr',
      name: 'EMR & Clinical Consultations Desk',
      permKey: 'canViewEMRDesk',
      menuRightId: 'emr',
      icon: Briefcase,
      color: 'blue',
      desc: 'Doctor clinical consultations, prescriptions, lab investigations & history',
      subMenus: [
        { key: 'canAccessPatientVisitDesk', label: 'Doctor Consultation Desk', icon: Stethoscope, desc: 'Record symptoms, diagnoses & prescribe medication' },
        { key: 'canViewNhcHistoryDesk', label: 'Historical Consultations Archive', icon: UserCheck, desc: 'Access past patient clinical visits & prescription history' }
      ],
      actionItems: [
        { key: 'canPrintPrescription', label: 'Print A4 Prescription Letterhead', icon: Printer, desc: 'Allow printing doctor prescription with clinic letterhead' },
        { key: 'canPrintLabAdvice', label: 'Print Lab Test Investigation Advice', icon: Printer, desc: 'Allow printing laboratory test advice slips' },
        { key: 'canPrintVisitSlip', label: 'Print A5 Consultation Visit Slip', icon: Printer, desc: 'Allow printing patient visit receipt' }
      ]
    },
    {
      id: 'erp_system',
      name: 'Mini ERP System & Financial Accounting',
      permKey: 'canViewErpDesk',
      menuRightId: 'accounts',
      icon: Building2,
      color: 'indigo',
      desc: 'Comprehensive clinic accounting, fiscal calendar, cash book, vendors, PO/GRN, payroll & expenses',
      subMenus: [
        { key: 'canAccessErpOverview', label: 'ERP Dashboard & KPI Overview', icon: PieChart, desc: 'Financial summaries, gross margins, cash position & revenue stats' },
        { key: 'canAccessErpFiscalCalendar', label: 'Fiscal Year & Calendar Setup', icon: Calendar, desc: 'Financial accounting periods, quarterly reviews & fiscal year closing' },
        { key: 'canAccessErpCashBook', label: 'Clinic Cash Book & P&L Log', icon: Landmark, desc: 'Real-time cash inflows, patient fees, expenses & profit/loss tracking' },
        { key: 'canAccessErpVendors', label: 'Vendors & Suppliers Management', icon: Building2, desc: 'Vendor directory, supplier profiles, contact numbers & tax details' },
        { key: 'canAccessErpVendorStatement', label: 'Vendor Payments & Statements', icon: FileText, desc: 'Pay supplier bills, issue payment vouchers & print vendor ledger statements' },
        { key: 'canAccessErpPoGrn', label: 'Purchase Orders & GRN Receiving', icon: ShoppingCart, desc: 'Draft PO requisitions, record Goods Received Notes (GRN) & partial receiving' },
        { key: 'canAccessErpLedger', label: 'Financial Ledger & Journal', icon: Receipt, desc: 'Double-entry transaction audit trails & general ledger journals' },
        { key: 'canAccessErpHrPayroll', label: 'HR & Staff Payroll Management', icon: Users, desc: 'Employee records, monthly salaries, advances & payroll disbursement' },
        { key: 'canAccessErpExpensesAssets', label: 'Clinic Expenses & Fixed Assets', icon: Boxes, desc: 'Track clinic operating expenses & maintain fixed asset register' },
        { key: 'canAccessErpReporting', label: 'ERP Reporting & Performance Analytics', icon: BarChart3, desc: 'Comprehensive financial statements & income performance reports' }
      ],
      actionItems: [
        { key: 'canPrintVouchers', label: 'Print Payment & Journal Vouchers', icon: Printer, desc: 'Allow printing Cash Payment Vouchers & Journal Vouchers' },
        { key: 'canPrintFinancialReports', label: 'Print Financial Statements & Ledgers', icon: Printer, desc: 'Allow printing P&L, Ledgers & Balance Sheets' },
        { key: 'canExportCSVExcel', label: 'Export ERP Ledgers to CSV/Excel', icon: Upload, desc: 'Allow exporting accounting transactions to spreadsheet' }
      ]
    },
    {
      id: 'pharmacy',
      name: 'Pharmacy POS & Medicine Inventory',
      permKey: 'canViewPharmacyPOS',
      menuRightId: 'pharmacy',
      icon: ShoppingCart,
      color: 'emerald',
      desc: 'Dispensary sales counter, store medicine POS, stock manager, returns & medicine labels',
      subMenus: [
        { key: 'canAccessClinicalMedicine', label: 'Clinical Medicine POS Counter', icon: ShoppingCart, desc: 'Doctor prescription dispensing checkout counter' },
        { key: 'canAccessStoreMedicine', label: 'Store Medicine Retail Sales Counter', icon: ShoppingCart, desc: 'Direct retail store medicine billing & barcode POS' },
        { key: 'canAccessSalesReturns', label: 'Sales Returns & Customer Refunds', icon: Undo2, desc: 'Customer return processing & bill adjustment vouchers' },
        { key: 'canAccessStockManager', label: 'Stock Grid & Medicine Inventory Manager', icon: Database, desc: 'Inventory catalog, batches, expiry alerts & pricing overview' },
        { key: 'canAccessInvoiceLogs', label: 'Invoice Logs & Past Receipts History', icon: History, desc: 'View past transaction receipts & reprint customer bills' },
        { key: 'canAccessMedicineLabels', label: 'Clinic Medicine Bottle Label Printer', icon: Tag, desc: 'Print thermal bottle & strip dosage instruction labels' },
        { key: 'canViewPwaInstall', label: '📱 Install Mobile / Android App Button', icon: Smartphone, desc: 'Show/Hide the Store Medicine APK / PWA install modal and header button' }
      ],
      actionItems: [
        { key: 'canEditStockLevel', label: 'Edit Current Stock Level & Rates', icon: Boxes, desc: 'Allow editing medicine stock quantities & thresholds in Inventory' },
        { key: 'canPrintPOSInvoice', label: 'Print Pharmacy POS Thermal Invoice', icon: Printer, desc: 'Allow printing customer receipts on POS thermal printer' },
        { key: 'canPrintFinancialReports', label: 'Print Inventory Stock Valuation Reports', icon: Printer, desc: 'Allow printing inventory stock balance reports' },
        { key: 'canExportCSVExcel', label: 'Export Medicine Catalog to CSV/Excel', icon: Upload, desc: 'Allow downloading medicine stock inventory list' }
      ]
    },
    {
      id: 'reports',
      name: 'Financial & Executive Reports Desk',
      permKey: 'canViewReportingDesk',
      menuRightId: 'reports',
      icon: Printer,
      color: 'purple',
      desc: 'General ledger, Income statements, Trial balance, Patient directories & audits',
      subMenus: [
        { key: 'canAccessErpReporting', label: 'ERP & Financial Statements', icon: BarChart3, desc: 'Trial balance, profit and loss & cash flow reports' },
        { key: 'canAccessGridView', label: 'Patient Master Directory Report', icon: LayoutGrid, desc: 'Full patient master roster and clinical history logs' }
      ],
      actionItems: [
        { key: 'canPrintFinancialReports', label: 'Print Reports & Statements', icon: Printer, desc: 'Allow generating printable report documents' },
        { key: 'canExportCSVExcel', label: 'Export Reports Data to CSV/Excel', icon: Upload, desc: 'Allow exporting generated report datasets' }
      ]
    },
    {
      id: 'uploads',
      name: 'CSV Imports & Bulk Uploads Desk',
      permKey: 'canViewUploadingDesk',
      menuRightId: 'uploads',
      icon: Upload,
      color: 'amber',
      desc: 'Bulk import patient directories and medicine catalog spreadsheets',
      subMenus: [
        { key: 'canViewUploadingDesk', label: 'Bulk Data CSV Uploader', icon: Upload, desc: 'Import CSV records into database' }
      ],
      actionItems: [
        { key: 'canExportCSVExcel', label: 'Download Template Samples', icon: Download, desc: 'Download sample CSV template files' }
      ]
    },
    {
      id: 'settings',
      name: 'System Setup & Settings Desk',
      permKey: 'canViewSettingsDesk',
      menuRightId: 'settings',
      icon: Settings,
      color: 'slate',
      desc: 'Clinic profile setup, SMS gateway, system database backups & user access management',
      subMenus: [
        { key: 'canViewSettingsDesk', label: 'Clinic Configuration Panel', icon: Settings, desc: 'Configure clinic branding, SMS & database connections' }
      ],
      actionItems: [
        { key: 'canExportCSVExcel', label: 'Export System Backup Archive', icon: Download, desc: 'Export full database backup archives' }
      ]
    },
    {
      id: 'query_handler',
      name: 'Query Handler & System Audit Desk',
      permKey: 'canViewQueryHandlerDesk',
      menuRightId: 'query_handler',
      icon: Database,
      color: 'cyan',
      desc: 'Live database query inspection, collections browser & audit log trails',
      subMenus: [
        { key: 'canViewQueryHandlerDesk', label: 'Live Database Query Console', icon: Database, desc: 'Inspect database tables and collections' }
      ],
      actionItems: []
    },
    {
      id: 'nhc_history',
      name: 'NHC Patient Clinical History Desk',
      permKey: 'canViewNhcHistoryDesk',
      menuRightId: 'nhc_history',
      icon: UserCheck,
      color: 'rose',
      desc: 'Search historical patient clinical consultations and archive prescription logs',
      subMenus: [
        { key: 'canViewNhcHistoryDesk', label: 'NHC Archive Consultations Browser', icon: UserCheck, desc: 'Browse historical clinic consultations' }
      ],
      actionItems: [
        { key: 'canPrintPrescription', label: 'Reprint Historical Prescriptions', icon: Printer, desc: 'Print past prescription archive' }
      ]
    },
    {
      id: 'dashboard',
      name: 'Executive Dashboard & Analytics',
      permKey: 'canViewDashboard',
      menuRightId: 'dashboard',
      icon: Shield,
      color: 'violet',
      desc: 'Clinic revenue analytics, patient footfall & executive KPIs (Admin Only)',
      subMenus: [
        { key: 'canViewDashboard', label: 'Executive Analytics Overview', icon: Shield, desc: 'View top-level revenue and performance stats' }
      ],
      actionItems: []
    }
  ];

  // Selected User's Permissions & Access Controls
  const [accessPermissions, setAccessPermissions] = useState<NonNullable<User['Permissions']>>(defaultPermissionTemplate);
  const [accessUserRights, setAccessUserRights] = useState<UserRight[]>(ROLE_RIGHTS['Administrator']);
  const [accessAllowedUserIDs, setAccessAllowedUserIDs] = useState<string[]>(['ALL']);
  const [accessApprovalStatus, setAccessApprovalStatus] = useState<'Pending' | 'Approved' | 'Rejected'>('Approved');
  const [accessApprovedBy, setAccessApprovedBy] = useState<string>('Administrator');
  const [accessApprovedAt, setAccessApprovedAt] = useState<string>('');

  // Active Main Menu being configured in Pop-up Modal
  const [configuringMainMenuId, setConfiguringMainMenuId] = useState<string | null>(null);

  // Synchronize state whenever selectedAccessUserId changes
  useEffect(() => {
    if (selectedAccessUser) {
      setAccessPermissions({
        ...defaultPermissionTemplate,
        ...(selectedAccessUser.Permissions || {})
      });
      setAccessUserRights(selectedAccessUser.UserRights || ROLE_RIGHTS[selectedAccessUser.Role] || ROLE_RIGHTS['Administrator']);
      setAccessAllowedUserIDs(selectedAccessUser.AllowedUserIDs || ['ALL']);
      setAccessApprovalStatus(selectedAccessUser.AccessApprovalStatus || (selectedAccessUser.Role === 'Administrator' ? 'Approved' : 'Approved'));
      setAccessApprovedBy(selectedAccessUser.AccessApprovedBy || (selectedAccessUser.Role === 'Administrator' ? 'System Administrator' : 'Administrator'));
      setAccessApprovedAt(selectedAccessUser.AccessApprovedAt || selectedAccessUser.CreatedAt || '');
    }
  }, [selectedAccessUserId, usersList]);

  const handleToggleDeskPermission = (key: keyof NonNullable<User['Permissions']>) => {
    if (selectedAccessUser?.Role === 'Administrator') return;
    setAccessPermissions(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleToggleMainMenu = (menuId: string) => {
    const config = MAIN_MENU_CONFIGS.find(m => m.id === menuId);
    if (!config) return;

    const currentVal = !!accessPermissions[config.permKey];
    if (!currentVal) {
      // If enabling, set main menu switch ON and open pop-up modal to configure sub-menus & items
      setAccessPermissions(prev => ({ ...prev, [config.permKey]: true }));
      setConfiguringMainMenuId(menuId);
    } else {
      // If disabling, turn off main menu
      setAccessPermissions(prev => ({ ...prev, [config.permKey]: false }));
    }
  };

  const handleOpenMainMenuConfig = (menuId: string) => {
    setConfiguringMainMenuId(menuId);
  };

  const handleToggleUserRight = (menuId: string, field: 'Status' | 'AddRec' | 'PostRec' | 'CancelPosted' | 'PrintRec' | 'ExportRec') => {
    setAccessUserRights(prev => prev.map(r => {
      if (r.MenuID === menuId) {
        return { ...r, [field]: !r[field] };
      }
      return r;
    }));
  };

  const handleToggleTargetUserAccess = (targetUserId: string) => {
    if (selectedAccessUser?.Role === 'Administrator') return;
    setAccessAllowedUserIDs(prev => {
      const filtered = prev.filter(id => id !== 'ALL' && id !== '*');
      if (filtered.includes(targetUserId)) {
        const remaining = filtered.filter(id => id !== targetUserId);
        return remaining.length === 0 ? ['ALL'] : remaining;
      } else {
        return [...filtered, targetUserId];
      }
    });
  };

  const handleToggleWildcardAll = () => {
    if (selectedAccessUser?.Role === 'Administrator') return;
    if (accessAllowedUserIDs.includes('ALL') || accessAllowedUserIDs.includes('*')) {
      setAccessAllowedUserIDs([selectedAccessUserId]);
    } else {
      setAccessAllowedUserIDs(['ALL']);
    }
  };

  const handleApplyRolePreset = (role: User['Role']) => {
    if (selectedAccessUser?.Role === 'Administrator') return;
    setAccessUserRights(ROLE_RIGHTS[role] || ROLE_RIGHTS['Doctor']);
    if (role === 'Administrator') {
      setAccessPermissions({
        canViewDashboard: true,
        canViewPatientDesk: true,
        canViewEMRDesk: true,
        canViewPharmacyPOS: true,
        canViewAccountingDesk: true,
        canViewReportingDesk: true,
        canViewUploadingDesk: true,
        canViewSettingsDesk: true,
        canViewQueryHandlerDesk: true,
        canViewNhcHistoryDesk: true,
        canViewErpDesk: true,
        canAccessWaitingQueue: true,
        canAccessPatientRegistration: true,
        canAccessTokenIssue: true,
        canAccessPatientVisitDesk: true,
        canAccessGridView: true,
        canAccessAppointmentsDesk: true,
        canAccessLargeScreenDisplay: true,
        canAccessClinicalMedicine: true,
        canAccessStoreMedicine: true,
        canAccessSalesReturns: true,
        canAccessStockManager: true,
        canAccessInvoiceLogs: true,
        canAccessMedicineLabels: true,
        canViewPwaInstall: true,
        canAccessErpOverview: true,
        canAccessErpFiscalCalendar: true,
        canAccessErpCashBook: true,
        canAccessErpVendors: true,
        canAccessErpVendorStatement: true,
        canAccessErpPoGrn: true,
        canAccessErpLedger: true,
        canAccessErpHrPayroll: true,
        canAccessErpExpensesAssets: true,
        canAccessErpReporting: true,
        canAddPatient: true,
        canEditPatient: true,
        canIssueToken: true,
        canBookAppointment: true,
        canCancelAppointment: true,
        canCallServeToken: true,
        canDeleteToken: true,
        canEditStockLevel: true,
        canPrintPrescription: true,
        canPrintLabAdvice: true,
        canPrintVisitSlip: true,
        canPrintTokenSlip: true,
        canPrintPOSInvoice: true,
        canPrintVouchers: true,
        canPrintFinancialReports: true,
        canExportCSVExcel: true
      });
      setAccessAllowedUserIDs(['ALL']);
    } else if (role === 'Doctor') {
      setAccessPermissions({
        canViewDashboard: false,
        canViewPatientDesk: true,
        canViewEMRDesk: true,
        canViewPharmacyPOS: false,
        canViewAccountingDesk: false,
        canViewReportingDesk: false,
        canViewUploadingDesk: false,
        canViewSettingsDesk: false,
        canViewQueryHandlerDesk: false,
        canViewNhcHistoryDesk: true,
        canViewErpDesk: false,
        canAccessWaitingQueue: true,
        canAccessPatientRegistration: false,
        canAccessTokenIssue: false,
        canAccessPatientVisitDesk: true,
        canAccessGridView: true,
        canAccessAppointmentsDesk: true,
        canAccessLargeScreenDisplay: true,
        canAccessClinicalMedicine: false,
        canAccessStoreMedicine: false,
        canAccessSalesReturns: false,
        canAccessStockManager: false,
        canAccessInvoiceLogs: false,
        canAccessMedicineLabels: false,
        canViewPwaInstall: false,
        canAccessErpOverview: false,
        canAccessErpFiscalCalendar: false,
        canAccessErpCashBook: false,
        canAccessErpVendors: false,
        canAccessErpVendorStatement: false,
        canAccessErpPoGrn: false,
        canAccessErpLedger: false,
        canAccessErpHrPayroll: false,
        canAccessErpExpensesAssets: false,
        canAccessErpReporting: false,
        canAddPatient: false,
        canEditPatient: false,
        canIssueToken: false,
        canBookAppointment: true,
        canCancelAppointment: false,
        canCallServeToken: true,
        canDeleteToken: false,
        canEditStockLevel: false,
        canPrintPrescription: true,
        canPrintLabAdvice: true,
        canPrintVisitSlip: true,
        canPrintTokenSlip: false,
        canPrintPOSInvoice: false,
        canPrintVouchers: false,
        canPrintFinancialReports: false,
        canExportCSVExcel: true
      });
      setAccessAllowedUserIDs([selectedAccessUserId]);
    } else if (role === 'Receptionist') {
      setAccessPermissions({
        canViewDashboard: false,
        canViewPatientDesk: true,
        canViewEMRDesk: false,
        canViewPharmacyPOS: false,
        canViewAccountingDesk: false,
        canViewReportingDesk: false,
        canViewUploadingDesk: false,
        canViewSettingsDesk: false,
        canViewQueryHandlerDesk: false,
        canViewNhcHistoryDesk: false,
        canViewErpDesk: false,
        canAccessWaitingQueue: true,
        canAccessPatientRegistration: false,
        canAccessTokenIssue: true,
        canAccessPatientVisitDesk: false,
        canAccessGridView: false,
        canAccessAppointmentsDesk: true,
        canAccessLargeScreenDisplay: false,
        canAccessClinicalMedicine: false,
        canAccessStoreMedicine: false,
        canAccessSalesReturns: false,
        canAccessStockManager: false,
        canAccessInvoiceLogs: false,
        canAccessMedicineLabels: false,
        canViewPwaInstall: false,
        canAccessErpOverview: false,
        canAccessErpFiscalCalendar: false,
        canAccessErpCashBook: false,
        canAccessErpVendors: false,
        canAccessErpVendorStatement: false,
        canAccessErpPoGrn: false,
        canAccessErpLedger: false,
        canAccessErpHrPayroll: false,
        canAccessErpExpensesAssets: false,
        canAccessErpReporting: false,
        canAddPatient: true,
        canEditPatient: true,
        canIssueToken: true,
        canBookAppointment: true,
        canCancelAppointment: false,
        canCallServeToken: true,
        canDeleteToken: false,
        canEditStockLevel: false,
        canPrintPrescription: false,
        canPrintLabAdvice: false,
        canPrintVisitSlip: true,
        canPrintTokenSlip: true,
        canPrintPOSInvoice: false,
        canPrintVouchers: false,
        canPrintFinancialReports: false,
        canExportCSVExcel: false
      });
      setAccessAllowedUserIDs([selectedAccessUserId]);
    } else if (role === 'Pharmacist') {
      setAccessPermissions({
        canViewDashboard: false,
        canViewPatientDesk: false,
        canViewEMRDesk: false,
        canViewPharmacyPOS: true,
        canViewAccountingDesk: false,
        canViewReportingDesk: false,
        canViewUploadingDesk: false,
        canViewSettingsDesk: false,
        canViewQueryHandlerDesk: false,
        canViewNhcHistoryDesk: false,
        canViewErpDesk: false,
        canAccessWaitingQueue: false,
        canAccessPatientRegistration: false,
        canAccessTokenIssue: false,
        canAccessPatientVisitDesk: false,
        canAccessGridView: false,
        canAccessAppointmentsDesk: false,
        canAccessLargeScreenDisplay: false,
        canAccessClinicalMedicine: true,
        canAccessStoreMedicine: true,
        canAccessSalesReturns: true,
        canAccessStockManager: true,
        canAccessInvoiceLogs: true,
        canAccessMedicineLabels: true,
        canViewPwaInstall: true,
        canAccessErpOverview: false,
        canAccessErpFiscalCalendar: false,
        canAccessErpCashBook: false,
        canAccessErpVendors: false,
        canAccessErpVendorStatement: false,
        canAccessErpPoGrn: false,
        canAccessErpLedger: false,
        canAccessErpHrPayroll: false,
        canAccessErpExpensesAssets: false,
        canAccessErpReporting: false,
        canAddPatient: false,
        canEditPatient: false,
        canIssueToken: false,
        canBookAppointment: false,
        canCancelAppointment: false,
        canCallServeToken: false,
        canDeleteToken: false,
        canEditStockLevel: false,
        canPrintPrescription: false,
        canPrintLabAdvice: false,
        canPrintVisitSlip: false,
        canPrintTokenSlip: false,
        canPrintPOSInvoice: true,
        canPrintVouchers: false,
        canPrintFinancialReports: false,
        canExportCSVExcel: true
      });
      setAccessAllowedUserIDs([selectedAccessUserId]);
    } else if (role === 'Accountant') {
      setAccessPermissions({
        canViewDashboard: false,
        canViewPatientDesk: false,
        canViewEMRDesk: false,
        canViewPharmacyPOS: true,
        canViewAccountingDesk: true,
        canViewReportingDesk: true,
        canViewUploadingDesk: false,
        canViewSettingsDesk: false,
        canViewQueryHandlerDesk: false,
        canViewNhcHistoryDesk: false,
        canViewErpDesk: true,
        canAccessWaitingQueue: false,
        canAccessPatientRegistration: false,
        canAccessTokenIssue: false,
        canAccessPatientVisitDesk: false,
        canAccessGridView: false,
        canAccessAppointmentsDesk: false,
        canAccessLargeScreenDisplay: false,
        canAccessClinicalMedicine: false,
        canAccessStoreMedicine: true,
        canAccessSalesReturns: true,
        canAccessStockManager: true,
        canAccessInvoiceLogs: true,
        canAccessMedicineLabels: false,
        canViewPwaInstall: false,
        canAccessErpOverview: true,
        canAccessErpFiscalCalendar: true,
        canAccessErpCashBook: true,
        canAccessErpVendors: true,
        canAccessErpVendorStatement: true,
        canAccessErpPoGrn: true,
        canAccessErpLedger: true,
        canAccessErpHrPayroll: true,
        canAccessErpExpensesAssets: true,
        canAccessErpReporting: true,
        canAddPatient: false,
        canEditPatient: false,
        canIssueToken: false,
        canBookAppointment: false,
        canCancelAppointment: false,
        canCallServeToken: false,
        canDeleteToken: false,
        canEditStockLevel: false,
        canPrintPrescription: false,
        canPrintLabAdvice: false,
        canPrintVisitSlip: false,
        canPrintTokenSlip: false,
        canPrintPOSInvoice: true,
        canPrintVouchers: true,
        canPrintFinancialReports: true,
        canExportCSVExcel: true
      });
      setAccessAllowedUserIDs([selectedAccessUserId]);
    }
  };

  const handleSaveAccessPermissions = (status?: 'Pending' | 'Approved' | 'Rejected') => {
    if (!selectedAccessUser) return;
    if (selectedAccessUser.Role === 'Administrator') {
      setErrorMsg('Administrator access profile is locked and cannot be modified. Admin accounts maintain full system permissions by default.');
      return;
    }
    setSuccessMsg('');
    setErrorMsg('');

    const newApprovalStatus = status || accessApprovalStatus;
    const adminName = currentUser.FullName || currentUser.LoginName || 'Administrator';
    const approvedTimestamp = newApprovalStatus === 'Approved' ? (accessApprovedAt || new Date().toISOString()) : '';

    const updatedUser: User = {
      ...selectedAccessUser,
      Permissions: accessPermissions,
      UserRights: accessUserRights,
      AllowedUserIDs: accessAllowedUserIDs,
      AccessApprovalStatus: newApprovalStatus,
      AccessApprovedBy: newApprovalStatus === 'Approved' ? (accessApprovedBy || adminName) : undefined,
      AccessApprovedAt: approvedTimestamp
    };

    setAccessApprovalStatus(newApprovalStatus);
    if (newApprovalStatus === 'Approved') {
      setAccessApprovedBy(adminName);
      setAccessApprovedAt(approvedTimestamp);
    }

    setUsersList(prev => prev.map(u => u.UserID === selectedAccessUser.UserID ? updatedUser : u));
    broadcastUserSync('PERMISSIONS_UPDATED', updatedUser, selectedAccessUser.UserID);

    const bridgeUrl = mongoDbSettings.BridgeUrl || (typeof window !== 'undefined' ? window.location.origin : '');
    if (bridgeUrl && typeof navigator !== 'undefined' && navigator.onLine) {
      fetch(`${bridgeUrl}/api/users/${selectedAccessUser.UserID}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedUser)
      })
        .then(res => res.json())
        .then(() => {
          broadcastUserSync('PERMISSIONS_UPDATED', updatedUser, selectedAccessUser.UserID);
          setSuccessMsg(`Access Profile & Permissions for "${selectedAccessUser.FullName}" (${newApprovalStatus.toUpperCase()}) saved & synced successfully!`);
        })
        .catch(err => {
          setSuccessMsg(`Saved locally! (Database sync pending network reconnection: ${err.message})`);
        });
    } else {
      setSuccessMsg(`Access Profile & Permissions for "${selectedAccessUser.FullName}" saved locally and applied successfully!`);
    }
  };

  const handleApproveAndGrantAccess = () => {
    handleSaveAccessPermissions('Approved');
  };

  const handleRejectOrSuspendAccess = () => {
    handleSaveAccessPermissions('Rejected');
  };

  // SMS settings form states
  const [smsProvider, setSmsProvider] = useState<SmsSettings['Provider']>(smsSettings.Provider);
  const [smsEnabled, setSmsEnabled] = useState(smsSettings.Enabled);
  const [smsApiUrl, setSmsApiUrl] = useState(smsSettings.ApiUrl);
  const [smsApiKey, setSmsApiKey] = useState(smsSettings.ApiKey);
  const [smsSenderId, setSmsSenderId] = useState(smsSettings.SenderID);
  const [smsBookingTemplate, setSmsBookingTemplate] = useState(smsSettings.BookingTemplate);
  const [smsRepeatTemplate, setSmsRepeatTemplate] = useState(smsSettings.RepeatTemplate);

  // MongoDB connection form states
  const [mongoConnString, setMongoConnString] = useState(mongoDbSettings.ConnectionString);
  const [mongoDatabase, setMongoDatabase] = useState(mongoDbSettings.DatabaseName);
  const [mongoSync, setMongoSync] = useState(mongoDbSettings.SyncEnabled);
  const [mongoBridgeUrl, setMongoBridgeUrl] = useState(mongoDbSettings.BridgeUrl || (typeof window !== 'undefined' ? window.location.origin : ''));

  // Connection testing feedback states
  const [testingConnection, setTestingConnection] = useState(false);
  const [testSuccess, setTestSuccess] = useState<boolean | null>(null);


  // Clinic state
  const [clinicName, setClinicName] = useState(clinicSettings.ClinicName);
  const [logoText, setLogoText] = useState(clinicSettings.ClinicLogoText);
  const [doctorName, setDoctorName] = useState(clinicSettings.DoctorName);
  const [signature, setSignature] = useState(clinicSettings.DoctorSignatureText);
  const [address, setAddress] = useState(clinicSettings.ClinicAddress);
  const [phone, setPhone] = useState(clinicSettings.PhoneMobile || '+92-311-4000608');
  const [website, setWebsite] = useState(clinicSettings.Website || 'https://punjabhomeopathic.pk');
  const [opdFee, setOpdFee] = useState(clinicSettings.OPDFee);
  const [clinicLogoImage, setClinicLogoImage] = useState<string>(clinicSettings.ClinicLogoImage || '');
  const [prescriptionLogoImage, setPrescriptionLogoImage] = useState<string>(clinicSettings.PrescriptionLogoImage || clinicSettings.LetterHeadImage || '');
  const [letterHeadImage, setLetterHeadImage] = useState<string>(clinicSettings.LetterHeadImage || '');
  const [clinicalLabelImage, setClinicalLabelImage] = useState<string>(clinicSettings.ClinicalLabelImage || '');
  // User list states
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // New user form state
  const [newLoginName, setNewLoginName] = useState('');
  const [newFullName, setNewFullName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<User['Role']>('Doctor');
  const [newShift, setNewShift] = useState<1 | 2 | 'Both'>('Both');

  // Edit user state
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editFullName, setEditFullName] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editRole, setEditRole] = useState<User['Role']>('Doctor');
  const [editShift, setEditShift] = useState<1 | 2 | 'Both'>('Both');

  const handleSaveClinicSettings = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');

    const updated: ClinicSettings = {
      ClinicName: clinicName,
      ClinicLogoText: logoText,
      DoctorName: doctorName,
      DoctorSignatureText: signature,
      ClinicAddress: address,
      PhoneMobile: phone,
      Website: website,
      OPDFee: Number(opdFee) || 1500,
      ClinicLogoImage: clinicLogoImage,
      LetterHeadImage: letterHeadImage,
      PrescriptionLogoImage: prescriptionLogoImage,
      ClinicalLabelImage: clinicalLabelImage
    };

    setClinicSettings(updated);
    
    const bridgeUrl = mongoDbSettings.BridgeUrl || window.location.origin;
    fetch(`${bridgeUrl}/api/settings/clinic`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated)
    })
      .then(res => res.json())
      .then(() => {
        setSuccessMsg('Clinic configurations saved and synchronized in MongoDB successfully!');
      })
      .catch(err => {
        setErrorMsg(`Saved locally, but failed to sync to MongoDB: ${err.message}`);
      });
  };

  const handleSaveSmsSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');

    const updated: SmsSettings = {
      Provider: smsProvider,
      Enabled: smsEnabled,
      ApiUrl: smsApiUrl,
      ApiKey: smsApiKey,
      SenderID: smsSenderId,
      BookingTemplate: smsBookingTemplate,
      RepeatTemplate: smsRepeatTemplate
    };

    setSmsSettings(updated);
    
    const bridgeUrl = mongoDbSettings.BridgeUrl || window.location.origin;
    fetch(`${bridgeUrl}/api/settings/sms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated)
    })
      .then(res => res.json())
      .then(() => {
        setSuccessMsg('SMS integration parameters saved and synchronized in MongoDB successfully!');
      })
      .catch(err => {
        setErrorMsg(`Saved locally, but failed to sync to MongoDB: ${err.message}`);
      });
  };

  const handleSaveMongoDbSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');

    const updated: MongoDbSettings = {
      ConnectionString: mongoConnString,
      DatabaseName: mongoDatabase,
      SyncEnabled: mongoSync,
      BridgeUrl: mongoBridgeUrl
    };

    setMongoDbSettings(updated);
    localStorage.setItem('cms_mongodb_settings', JSON.stringify(updated));
    setSuccessMsg('MongoDB connection settings and collection parameters successfully synchronized!');
  };

  const handleTestMongoDbConnection = () => {
    setTestingConnection(true);
    setTestSuccess(null);
    setSuccessMsg('');
    setErrorMsg('');

    const bridgeUrl = mongoBridgeUrl || window.location.origin;
    fetch(`${bridgeUrl}/api/mongodb/test-connection`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        connectionString: mongoConnString,
        databaseName: mongoDatabase
      })
    })
      .then(res => res.json())
      .then(data => {
        setTestingConnection(false);
        if (data.success) {
          setTestSuccess(true);
          setSuccessMsg(`MongoDB connection handshake verified successfully! Active connection established. Database "${data.database}" is active and contains ${data.collectionsCount} collections.`);
        } else {
          setTestSuccess(false);
          setErrorMsg(`MongoDB Connection failed: ${data.error}`);
        }
      })
      .catch(err => {
        setTestingConnection(false);
        setTestSuccess(false);
        setErrorMsg(`Failed to connect to API server: ${err.message}`);
      });
  };

  const [downloadingBackup, setDownloadingBackup] = useState(false);
  const [backupSuccess, setBackupSuccess] = useState<string | null>(null);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);

  const handleTriggerManualBackup = async () => {
    setIsBackupModalOpen(true);
  };


  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');

    if (!newLoginName.trim() || !newFullName.trim() || !newPassword.trim()) {
      setErrorMsg('Please fill in all user login credentials.');
      return;
    }

    const exists = usersList.some(u => u.LoginName.toLowerCase() === newLoginName.trim().toLowerCase());
    if (exists) {
      setErrorMsg(`User with login name "${newLoginName}" already exists.`);
      return;
    }

    const newUser: User = {
      UserID: `USR-${Math.floor(100 + Math.random() * 900)}`,
      LoginName: newLoginName.trim(),
      FullName: newFullName.trim(),
      PasswordHash: newPassword,
      Role: newRole,
      AssignedShift: newShift
    };

    setUsersList(prev => [...prev, newUser]);
    broadcastUserSync('USER_CREATED', newUser, newUser.UserID);

    const bridgeUrl = mongoDbSettings.BridgeUrl || window.location.origin;
    fetch(`${bridgeUrl}/api/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newUser)
    })
      .then(res => res.json())
      .then(() => {
        broadcastUserSync('USER_CREATED', newUser, newUser.UserID);
        setSuccessMsg(`User profile for "${newUser.FullName}" created and saved to MongoDB successfully!`);
      })
      .catch(err => {
        setErrorMsg(`Saved locally, but failed to sync user to MongoDB: ${err.message}`);
      });

    setNewLoginName('');
    setNewFullName('');
    setNewPassword('');
    setNewRole('Doctor');
    setNewShift('Both');
  };

  const handleStartEdit = (user: User) => {
    setEditingUserId(user.UserID);
    setEditFullName(user.FullName);
    setEditPassword(user.PasswordHash);
    setEditRole(user.Role);
    setEditShift(user.AssignedShift || 'Both');
  };

  const handleSaveEditUser = (userId: string) => {
    setSuccessMsg('');
    setErrorMsg('');

    if (!editFullName.trim() || !editPassword.trim()) {
      setErrorMsg('Full Name and Password cannot be blank.');
      return;
    }

    const targetUser = usersList.find(u => u.UserID === userId);
    if (!targetUser) return;

    const updatedUser = {
      ...targetUser,
      FullName: editFullName.trim(),
      PasswordHash: editPassword,
      Role: editRole,
      AssignedShift: editShift
    };

    setUsersList(prev => prev.map(u => u.UserID === userId ? updatedUser : u));
    broadcastUserSync('USER_UPDATED', updatedUser, userId);

    const bridgeUrl = mongoDbSettings.BridgeUrl || window.location.origin;
    fetch(`${bridgeUrl}/api/users/${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedUser)
    })
      .then(res => res.json())
      .then(() => {
        broadcastUserSync('USER_UPDATED', updatedUser, userId);
        setSuccessMsg('User profile updated and saved to MongoDB successfully.');
      })
      .catch(err => {
        setErrorMsg(`Updated locally, but failed to sync to MongoDB: ${err.message}`);
      });

    setEditingUserId(null);
  };

  const handleDeleteUser = (userId: string) => {
    if (userId === currentUser.UserID) {
      setErrorMsg('You cannot delete your own logged-in session account!');
      return;
    }

    if (window.confirm('Are you sure you want to delete this user profile? This action cannot be reversed.')) {
      setUsersList(prev => prev.filter(u => u.UserID !== userId));
      broadcastUserSync('USER_DELETED', undefined, userId);

      const bridgeUrl = mongoDbSettings.BridgeUrl || window.location.origin;
      fetch(`${bridgeUrl}/api/users/${userId}`, {
        method: 'DELETE'
      })
        .then(res => res.json())
        .then(() => {
          broadcastUserSync('USER_DELETED', undefined, userId);
          setSuccessMsg('User profile deleted from MongoDB successfully.');
        })
        .catch(err => {
          setErrorMsg(`Deleted locally, but failed to remove from MongoDB: ${err.message}`);
        });
    }
  };

  // ------------------------------------------------------------------------------------------
  // 🏙️ CITY & GEOGRAPHIC MASTERS MANAGEMENT
  // ------------------------------------------------------------------------------------------
  const filteredCitiesList = (cities || []).filter(c => {
    const q = citySearchQuery.toLowerCase().trim();
    if (!q) return true;
    const nameMatch = c.CityName?.toLowerCase().includes(q);
    const idMatch = c.CityID?.toString().includes(q);
    const provMatch = (c as any).Province?.toLowerCase().includes(q);
    return nameMatch || idMatch || provMatch;
  });

  const getPatientCountForCity = (cityId: number) => {
    return (patients || []).filter(p => Number(p.CityID) === Number(cityId)).length;
  };

  const handleStartEditCity = (city: City) => {
    setEditingCityId(city.CityID);
    setCityFormName(city.CityName);
    setCityFormId(city.CityID);
    setCityFormProvince((city as any).Province || 'Punjab');
    setErrorMsg('');
    setSuccessMsg('');
    // Scroll to top of settings
    const formEl = document.getElementById('city-management-form');
    if (formEl) formEl.scrollIntoView({ behavior: 'smooth' });
  };

  const handleCancelCityEdit = () => {
    setEditingCityId(null);
    setCityFormName('');
    setCityFormId('');
    setCityFormProvince('Punjab');
  };

  const handleSaveCitySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cityFormName.trim()) {
      setErrorMsg('Please enter a valid City Name.');
      return;
    }

    setIsSavingCity(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      let targetId = typeof cityFormId === 'number' && cityFormId > 0 ? cityFormId : 0;
      if (!targetId && editingCityId) {
        targetId = editingCityId;
      }
      if (!targetId) {
        // Compute next available City ID
        const maxId = (cities || []).reduce((max, c) => Math.max(max, Number(c.CityID) || 0), 0);
        targetId = maxId + 1;
      }

      const cityPayload: City = {
        CityID: targetId,
        CityName: cityFormName.trim(),
        Province: cityFormProvince.trim() || 'Punjab'
      };

      if (onAddCity) {
        await onAddCity(cityPayload);
      } else {
        const bridgeUrl = mongoDbSettings.BridgeUrl || 'http://localhost:5000';
        await fetch(`${bridgeUrl}/api/cities`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(cityPayload)
        });
        if (setCities) {
          setCities(prev => {
            const idx = prev.findIndex(c => c.CityID === targetId);
            if (idx >= 0) {
              const copy = [...prev];
              copy[idx] = cityPayload;
              return copy;
            }
            return [...prev, cityPayload];
          });
        }
      }

      setSuccessMsg(`City "${cityPayload.CityName}" (City ID: #${cityPayload.CityID}) has been successfully saved to the database!`);
      handleCancelCityEdit();
    } catch (err: any) {
      setErrorMsg(`Failed to save city: ${err.message}`);
    } finally {
      setIsSavingCity(false);
    }
  };

  const handleDeleteCityAction = async (city: City) => {
    const mappedCount = getPatientCountForCity(city.CityID);
    let confirmPrompt = `Are you sure you want to permanently delete city "${city.CityName}" (ID: #${city.CityID})?`;
    if (mappedCount > 0) {
      confirmPrompt += `\n\n⚠️ Caution: There are currently ${mappedCount} patient(s) registered under this City ID in the EMR and Patient Desk.`;
    }

    if (!window.confirm(confirmPrompt)) {
      return;
    }

    try {
      if (onDeleteCity) {
        await onDeleteCity(city.CityID);
      } else {
        const bridgeUrl = mongoDbSettings.BridgeUrl || 'http://localhost:5000';
        await fetch(`${bridgeUrl}/api/cities/${city.CityID}`, { method: 'DELETE' });
        if (setCities) {
          setCities(prev => prev.filter(c => c.CityID !== city.CityID));
        }
      }
      setSuccessMsg(`City "${city.CityName}" was deleted successfully from the database.`);
      if (editingCityId === city.CityID) {
        handleCancelCityEdit();
      }
    } catch (err: any) {
      setErrorMsg(`Failed to delete city: ${err.message}`);
    }
  };

  const handleRestorePunjabDefaults = async () => {
    if (!window.confirm('Restore standard baseline Punjab & Pakistan cities (Lahore, Faisalabad, Rawalpindi, Multan, Gujranwala, Sialkot, Sargodha, Bahawalpur, Sahiwal, Islamabad)? Any custom added cities will be preserved.')) {
      return;
    }
    try {
      for (const defCity of INITIAL_CITIES) {
        if (!cities.some(c => c.CityID === defCity.CityID || c.CityName.toLowerCase() === defCity.CityName.toLowerCase())) {
          if (onAddCity) {
            await onAddCity({ ...defCity, Province: 'Punjab' });
          }
        }
      }
      setSuccessMsg('Standard Punjab & Pakistan cities verified and synchronized in database!');
    } catch (err: any) {
      setErrorMsg(`Failed to restore cities: ${err.message}`);
    }
  };

  const handleExportCitiesCSV = () => {
    try {
      const rows = [
        ['CityID', 'CityName', 'Province', 'Country', 'RegisteredPatients'],
        ...(cities || []).map(c => [
          c.CityID,
          `"${c.CityName}"`,
          `"${(c as any).Province || 'Punjab'}"`,
          '"Pakistan"',
          getPatientCountForCity(c.CityID)
        ])
      ];
      const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(e => e.join(',')).join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `PHC_Cities_Master_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err: any) {
      setErrorMsg(`Export failed: ${err.message}`);
    }
  };

  const settingsNavTabs = [
    { id: 'details', label: 'Clinic Details', shortLabel: 'Details', icon: Building, desc: 'Clinic Profile, Timings & Receipt Config' },
    { id: 'prescription_logo', label: 'Prescription Logo & Branding', shortLabel: 'Rx Logo', icon: FileText, desc: 'Upload Secondary Brand / Logo for Prescription Letterhead' },
    { id: 'thermal', label: 'Thermal Printer Settings', shortLabel: 'Thermal POS', icon: Printer, desc: 'Paper Roll Width, Margins, Scale & Cutter Feed Setup' },
    { id: 'users', label: `Staff Accounts (${usersList.length})`, shortLabel: `Staff (${usersList.length})`, icon: UserCheck, desc: 'Doctor, Dispenser & Receptionist Logins' },
    { id: 'access', label: 'User Access Control', shortLabel: 'Access', icon: ShieldCheck, desc: 'Granular Role Permissions & Feature Rights' },
    { id: 'sms', label: 'SMS Config', shortLabel: 'SMS', icon: MessageSquare, desc: 'Branded SMS Gateway & Alerts' },
    { id: 'mongodb', label: 'MongoDB Sync', shortLabel: 'MongoDB', icon: Database, desc: 'Cloud Sync & Database Connectivity' },
    { id: 'cities', label: `Cities & Locations (${(cities || []).length})`, shortLabel: `Cities (${(cities || []).length})`, icon: MapPin, desc: 'Districts, Cities Directory & Demographics' },
    { id: 'maintenance', label: 'System Maintenance', shortLabel: 'System', icon: Sliders, desc: 'Database Backups, Purge & Diagnostics' }
  ];

  return (
    <div className="flex-1 overflow-y-auto p-3.5 sm:p-6 space-y-4 sm:space-y-6 relative" id="settings-desk-root">
      
      {/* MOBILE SIDE NAVIGATION DRAWER (Only in Mobile View) */}
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
                  <Settings className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-100">Settings Menu</h2>
                  <p className="text-[10px] text-slate-400">Configuration Modules</p>
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
              {settingsNavTabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeSettingsTab === tab.id;
                return (
                  <button
                    key={`mobile-settings-side-${tab.id}`}
                    onClick={() => {
                      setActiveSettingsTab(tab.id as any);
                      setErrorMsg('');
                      setSuccessMsg('');
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
              <span className="text-[10px] text-slate-400 font-semibold">Punjab CMS • System Configuration</span>
            </div>
          </div>
        </div>
      )}

      {/* Banner Title & Tab Selector */}
      <div className="flex justify-end items-center bg-white p-2.5 sm:p-4 rounded-xl border border-slate-200 shadow-xs">
        {/* Tab Selector */}
        <div className="flex space-x-1 sm:space-x-1.5 bg-slate-100 p-1 rounded-lg border border-slate-200 overflow-x-auto scrollbar-none touch-pan-x w-full sm:w-auto">
          {/* Mobile Side-Navigation Toggle Button */}
          <button
            type="button"
            onClick={() => setMobileNavOpen(true)}
            className="sm:hidden flex items-center space-x-1 px-2.5 py-1.5 rounded-md bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-[11px] border border-blue-200 shrink-0 cursor-pointer min-h-[32px] active:scale-95 transition"
            title="Open Settings Menu"
          >
            <Menu className="w-3.5 h-3.5" />
            <span className="font-extrabold uppercase">Menu</span>
          </button>

          {settingsNavTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSettingsTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveSettingsTab(tab.id as any);
                  setErrorMsg('');
                  setSuccessMsg('');
                }}
                className={`px-2.5 sm:px-3 py-1.5 rounded-md text-xs font-semibold transition flex items-center space-x-1 shrink-0 ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 mr-0.5 sm:mr-1 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span className="whitespace-nowrap sm:hidden">{tab.shortLabel}</span>
                <span className="whitespace-nowrap hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Message Notifications */}
      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-lg text-emerald-800 text-xs font-semibold shadow-xs animate-fadeIn">
          {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="bg-rose-50 border border-rose-200 p-3.5 rounded-lg text-rose-800 text-xs font-semibold shadow-xs animate-fadeIn">
          {errorMsg}
        </div>
      )}

      {/* View 1: Clinic configuration */}
      {activeSettingsTab === 'details' && (
        <form onSubmit={handleSaveClinicSettings} className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-3 flex items-center space-x-2">
            <Building className="w-4 h-4 text-blue-500" />
            <span className="text-xs font-black text-slate-800 uppercase tracking-wider">Configure General Hospital & Clinic Settings</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
            
            <div className="space-y-1">
              <label className="font-bold text-slate-700 block">Clinic Name</label>
              <input
                type="text"
                required
                value={clinicName}
                onChange={(e) => setClinicName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-medium focus:ring-1 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700 block">Clinic Logo Text (Header Avatar)</label>
              <input
                type="text"
                required
                value={logoText}
                onChange={(e) => setLogoText(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-medium focus:ring-1 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700 block">Consultant Doctor Name</label>
              <input
                type="text"
                required
                value={doctorName}
                onChange={(e) => setDoctorName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-medium focus:ring-1 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700 block">Doctor Signature Text (Prints on Prescription)</label>
              <input
                type="text"
                required
                value={signature}
                onChange={(e) => setSignature(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-medium focus:ring-1 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700 block">Clinic Contact Address</label>
              <input
                type="text"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-medium focus:ring-1 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700 block">Clinic Contact Helpline / Mobile</label>
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+92-311-4000608"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-medium focus:ring-1 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700 block">Clinic Official Website URL</label>
              <input
                type="text"
                required
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://punjabhomeopathic.pk"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-medium focus:ring-1 focus:ring-blue-500 focus:outline-none"
              />
            </div>



            <div className="bg-slate-50 p-4 rounded-lg border border-slate-150 flex flex-col justify-center space-y-1">
              <span className="font-extrabold text-blue-700 uppercase tracking-wider text-[10px] block">Global App Configs Mapped</span>
              <p className="text-[10px] text-slate-500">
                Any alterations on this page instantly apply to the OPD tickets, medicine invoices, certificates, and EMR consultations.
              </p>
            </div>
          </div>

          {/* Printing Media & Letter Head Upload Section */}
          <div className="border-t border-slate-100 pt-5 space-y-4">
            <div className="flex items-center space-x-2">
              <Printer className="w-4 h-4 text-indigo-600" />
              <span className="text-xs font-black text-slate-800 uppercase tracking-wider">
                Printing Media & Layout Templates
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs max-w-4xl">
              {/* Card 1: Clinic Brand Logo Upload */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Building className="w-4 h-4 text-teal-600" />
                    <div>
                      <h4 className="font-bold text-slate-800 text-xs">Clinic Main Logo (Left Side)</h4>
                      <p className="text-[10px] text-slate-500 font-medium">Header logo, login screen & visit slips</p>
                    </div>
                  </div>
                  {clinicLogoImage && (
                    <span className="text-[9px] font-extrabold bg-teal-100 text-teal-800 px-2 py-0.5 rounded-full uppercase">
                      Active
                    </span>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="block text-[11px] font-bold text-slate-600">
                    Upload Clinic Emblem / Logo (PNG / SVG / JPEG)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        if (file.size > 5 * 1024 * 1024) {
                          alert('Image file size should be less than 5MB');
                          return;
                        }
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setClinicLogoImage(reader.result as string);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100 cursor-pointer"
                  />
                </div>

                {clinicLogoImage ? (
                  <div className="relative border border-slate-200 rounded-lg overflow-hidden bg-white p-2">
                    <div className="h-32 w-full flex items-center justify-center bg-slate-50 rounded overflow-hidden p-2">
                      <img
                        src={clinicLogoImage}
                        alt="Clinic Logo Preview"
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>
                    <div className="mt-2 flex justify-between items-center text-xxs">
                      <span className="text-slate-500 font-medium">Custom Logo Active</span>
                      <button
                        type="button"
                        onClick={() => setClinicLogoImage('')}
                        className="text-rose-600 hover:text-rose-800 font-bold flex items-center px-2 py-0.5 bg-rose-50 rounded hover:bg-rose-100 transition"
                      >
                        <Trash2 className="w-3 h-3 mr-1" />
                        Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 border border-dashed border-slate-300 rounded-lg text-center text-slate-400 text-xxs italic">
                    No custom logo uploaded. Standard emblem is currently used.
                  </div>
                )}
              </div>

              {/* Card 2: Prescription Secondary Logo Upload (Right Side Dual Header) */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <FileText className="w-4 h-4 text-rose-600" />
                    <div>
                      <h4 className="font-bold text-slate-800 text-xs">Prescription Secondary Logo (Right Side)</h4>
                      <p className="text-[10px] text-slate-500 font-medium">Opposite side of PHC logo on prescription</p>
                    </div>
                  </div>
                  {prescriptionLogoImage && (
                    <span className="text-[9px] font-extrabold bg-rose-100 text-rose-800 px-2 py-0.5 rounded-full uppercase">
                      Active
                    </span>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="block text-[11px] font-bold text-slate-600">
                    Upload Prescription Dual Logo (PNG / SVG / JPEG)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        if (file.size > 5 * 1024 * 1024) {
                          alert('Image file size should be less than 5MB');
                          return;
                        }
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setPrescriptionLogoImage(reader.result as string);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-rose-50 file:text-rose-700 hover:file:bg-rose-100 cursor-pointer"
                  />
                </div>

                {prescriptionLogoImage ? (
                  <div className="relative border border-slate-200 rounded-lg overflow-hidden bg-white p-2">
                    <div className="h-32 w-full flex items-center justify-center bg-slate-50 rounded overflow-hidden p-2">
                      <img
                        src={prescriptionLogoImage}
                        alt="Prescription Secondary Logo Preview"
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>
                    <div className="mt-2 flex justify-between items-center text-xxs">
                      <span className="text-slate-500 font-medium">Prescription Logo Active</span>
                      <button
                        type="button"
                        onClick={() => setPrescriptionLogoImage('')}
                        className="text-rose-600 hover:text-rose-800 font-bold flex items-center px-2 py-0.5 bg-rose-50 rounded hover:bg-rose-100 transition"
                      >
                        <Trash2 className="w-3 h-3 mr-1" />
                        Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 border border-dashed border-slate-300 rounded-lg text-center text-slate-400 text-xxs italic">
                    No prescription secondary logo uploaded. Header will remain standard.
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg flex items-center space-x-1.5 transition shadow-sm"
            >
              <Save className="w-4 h-4 text-white" />
              <span>Apply Clinic Settings</span>
            </button>
          </div>
        </form>
      )}

      {/* View: Dedicated Prescription Logo & Dual Header Branding Tab */}
      {activeSettingsTab === 'prescription_logo' && (
        <div className="space-y-6 max-w-5xl">
          {/* Header Banner */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-rose-50 text-rose-700 rounded-xl border border-rose-100 shrink-0">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 font-serif">Prescription Dual Logo & Header Branding</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Upload and customize your secondary logo / pharmacy emblem to appear on the opposite (right) side of the main Punjab Homeopathic Clinic logo.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleSaveClinicSettings}
              className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl flex items-center space-x-2 transition shadow-sm self-start sm:self-auto shrink-0"
            >
              <Save className="w-4 h-4 text-white" />
              <span>Save & Apply Logo</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Upload & Controls Card */}
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
                <div className="border-b border-slate-100 pb-2.5 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Upload className="w-4 h-4 text-rose-600" />
                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Logo File Upload</h4>
                  </div>
                  {prescriptionLogoImage ? (
                    <span className="text-[10px] font-extrabold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full uppercase border border-emerald-300 flex items-center">
                      <Check className="w-3 h-3 mr-1 text-emerald-600" /> Logo Attached
                    </span>
                  ) : (
                    <span className="text-[10px] font-extrabold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full uppercase">
                      No File
                    </span>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700">
                    Select Logo File (PNG, SVG, JPEG, WebP)
                  </label>
                  <p className="text-[11px] text-slate-500 leading-normal">
                    Recommended: Transparent PNG or crisp SVG with square or balanced aspect ratio. Max file size: 5MB.
                  </p>
                  <div className="mt-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          if (file.size > 5 * 1024 * 1024) {
                            alert('Image file size should be less than 5MB');
                            return;
                          }
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setPrescriptionLogoImage(reader.result as string);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="w-full text-xs text-slate-500 file:mr-3 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-rose-50 file:text-rose-700 hover:file:bg-rose-100 cursor-pointer border border-dashed border-slate-300 rounded-xl p-2 bg-slate-50/50"
                    />
                  </div>
                </div>

                {/* Uploaded Thumbnail Card */}
                {prescriptionLogoImage ? (
                  <div className="border border-rose-200 rounded-xl p-3 bg-rose-50/30 space-y-2.5">
                    <div className="h-36 w-full flex items-center justify-center bg-white rounded-lg border border-slate-200 p-2 shadow-2xs">
                      <img
                        src={prescriptionLogoImage}
                        alt="Prescription Secondary Logo Preview"
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[11px] font-bold text-slate-700">Custom Secondary Logo</span>
                      <button
                        type="button"
                        onClick={() => setPrescriptionLogoImage('')}
                        className="text-rose-700 hover:text-rose-900 font-bold text-xs flex items-center px-2.5 py-1 bg-white border border-rose-200 rounded-lg hover:bg-rose-50 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5 mr-1 text-rose-600" />
                        Remove Logo
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-6 border-2 border-dashed border-slate-200 rounded-xl text-center space-y-2 bg-slate-50">
                    <Image className="w-8 h-8 text-slate-300 mx-auto" />
                    <p className="text-xs text-slate-500 font-medium">
                      No secondary logo uploaded yet.
                    </p>
                    <p className="text-[10px] text-slate-400">
                      When uploaded, it will automatically render on the right-hand side of all prescription headers opposite the main clinic logo.
                    </p>
                  </div>
                )}

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleSaveClinicSettings}
                    className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl flex items-center justify-center space-x-2 transition shadow-xs"
                  >
                    <Save className="w-4 h-4 text-white" />
                    <span>Apply & Save to System</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Live Dual Header Preview */}
            <div className="lg:col-span-7 space-y-4">
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
                <div className="border-b border-slate-100 pb-2 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Eye className="w-4 h-4 text-blue-600" />
                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                      Live Prescription Letterhead Header Preview
                    </h4>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase font-mono">A4 Header Simulation</span>
                </div>

                <p className="text-[11px] text-slate-500">
                  This is exactly how your official header appears with both logos rendered side-by-side during printouts:
                </p>

                {/* Simulated Prescription Header */}
                <div className="p-4 bg-white border-2 border-teal-800 rounded-xl shadow-xs space-y-2">
                  <div className="flex items-center justify-between border-b-2 border-teal-800 pb-3 gap-2">
                    {/* Left: PHC Logo */}
                    <div className="w-16 h-16 shrink-0 flex items-center justify-center p-1 bg-slate-50 rounded-lg border border-slate-200">
                      <img
                        src={clinicLogoImage || clinicSettings.ClinicLogoImage || "/nhc_logo.svg"}
                        alt="Punjab Homeopathic Logo"
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>

                    {/* Center: Clinic Information */}
                    <div className="text-center flex-1 px-2">
                      <h1 className="font-serif uppercase tracking-tight text-lg sm:text-xl font-black text-red-900 leading-tight">
                        {clinicName || clinicSettings.ClinicName || 'PUNJAB HOMEOPATHIC CLINIC'}
                      </h1>
                      <p className="text-[9px] font-extrabold text-rose-700 tracking-widest uppercase mt-0.5">
                        {logoText || clinicSettings.ClinicLogoText || 'HEALING NATURALLY. RESTORING BALANCE.'}
                      </p>
                      <p className="text-[10px] font-bold text-slate-800 mt-1">
                        {doctorName || clinicSettings.DoctorName || 'Dr. Ejaz Ahmad, D.H.M.S (Pak)'} &nbsp;|&nbsp; {signature || clinicSettings.DoctorSignatureText || 'Registered Homeopathic Medical Practitioner No: 48776'}
                      </p>
                      <div className="text-[9px] text-slate-600 mt-0.5 flex flex-wrap items-center justify-center gap-x-1.5">
                        <span>{address || clinicSettings.ClinicAddress || '10 Shalimar Road, Garhi Shahu, Lahore 39 Pakistan'}</span>
                        <span>•</span>
                        <span>📞 {phone || clinicSettings.PhoneMobile || '+92-311-4000608'}</span>
                      </div>
                      <p className="text-[9px] font-bold text-teal-950 mt-0.5 uppercase tracking-tight">
                        Clinic Timings: Morning 8:30 AM to 12:00 PM &nbsp;|&nbsp; Evening 4:30 PM to 9:00 PM
                      </p>
                    </div>

                    {/* Right: Secondary Prescription Logo */}
                    <div className="w-16 h-16 shrink-0 flex items-center justify-center p-1 bg-slate-50 rounded-lg border border-slate-200 text-center">
                      {prescriptionLogoImage ? (
                        <img
                          src={prescriptionLogoImage}
                          alt="Prescription Secondary Logo"
                          className="max-h-full max-w-full object-contain"
                        />
                      ) : (
                        <div className="text-[9px] text-slate-400 font-bold uppercase flex flex-col items-center justify-center">
                          <Image className="w-4 h-4 text-slate-300 mb-0.5" />
                          <span>Logo Space</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="text-[10px] text-slate-400 text-center italic pt-1">
                    (Patient demographic details, RX remedies, clinical compounding formulations, and dosage notes follow below)
                  </div>
                </div>

                {/* Helpful Guidelines Card */}
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
                  <span className="font-extrabold text-slate-800 text-[11px] block uppercase tracking-wider">
                    Prescription Header Layout Details:
                  </span>
                  <ul className="list-disc pl-4 text-slate-600 text-[11px] space-y-1">
                    <li><strong>Left Side:</strong> Official Punjab Homeopathic Clinic Emblem.</li>
                    <li><strong>Center:</strong> Complete Clinic Title, Healing Tagline, Doctor Credentials &amp; Timings.</li>
                    <li><strong>Right Side:</strong> Your uploaded secondary brand logo / partner certification emblem.</li>
                    <li>Both logos are automatically scaled to high-resolution vector proportions (80x80px print standard).</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}



      {/* View 2: Users credentials management */}
      {activeSettingsTab === 'users' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* New User Panel */}
          <form onSubmit={handleAddUser} className="lg:col-span-5 bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <div className="border-b border-slate-100 pb-2 flex items-center space-x-2">
              <Plus className="w-4 h-4 text-blue-500" />
              <span className="text-xs font-black text-slate-800 uppercase tracking-wider">Create Staff Profile</span>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Login ID (Username)</label>
                <input
                  type="text"
                  required
                  placeholder=""
                  value={newLoginName}
                  onChange={(e) => setNewLoginName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Full Name & Credentials</label>
                <input
                  type="text"
                  required
                  placeholder=""
                  value={newFullName}
                  onChange={(e) => setNewFullName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Secure Password</label>
                <input
                  type="text"
                  required
                  placeholder=""
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">System Access Role</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as User['Role'])}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 cursor-pointer focus:outline-none"
                >
                  <option value="Administrator">Administrator (All Access)</option>
                  <option value="Doctor">Doctor (EMR Consultations)</option>
                  <option value="Receptionist">Receptionist (OPD Booking & Cash)</option>
                  <option value="Pharmacist">Pharmacist (Store Inventory & POS)</option>
                  <option value="Accountant">Accountant (General Ledger & Double-Entry)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Assigned Doctor Shift Access</label>
                <select
                  value={newShift}
                  onChange={(e) => {
                    const val = e.target.value;
                    setNewShift(val === 'Both' ? 'Both' : Number(val) as 1 | 2);
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 cursor-pointer focus:outline-none"
                >
                  <option value="Both">Both Shifts (Unrestricted)</option>
                  <option value="1">Morning Only (08:00 - 14:00)</option>
                  <option value="2">Evening Only (14:00 - 20:00)</option>
                </select>
                <p className="text-[10px] text-slate-400 mt-1 italic">
                  *When assigned to a shift, this user's view will filter all dashboards, appointments, and token logs to only that shift.
                </p>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg flex items-center justify-center space-x-1 transition shadow-sm mt-4"
            >
              <Plus className="w-4 h-4" />
              <span>Create User Profile</span>
            </button>
          </form>

          {/* Users List Grid */}
          <div className="lg:col-span-7 bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col h-[520px]">
            <div className="border-b border-slate-100 pb-2 mb-4 flex justify-between items-center shrink-0">
              <div>
                <span className="text-xs font-black text-slate-800 uppercase tracking-wider">System Users Accounts</span>
                <p className="text-[10px] text-slate-400 mt-0.5">Manage active logins, passwords, and access restrictions.</p>
              </div>
            </div>

            {/* List Table */}
            <div className="flex-1 overflow-auto border border-slate-100 rounded-lg">
              <table className="min-w-full divide-y divide-slate-100 text-xxs">
                <thead className="bg-slate-50 sticky top-0 text-slate-500 text-[10px] font-semibold text-left">
                  <tr>
                    <th className="px-3 py-2.5">User</th>
                    <th className="px-3 py-2.5">Access Role</th>
                    <th className="px-3 py-2.5">Assigned Shift</th>
                    <th className="px-3 py-2.5">Password</th>
                    <th className="px-3 py-2.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {usersList.map((usr) => {
                    const isEditing = editingUserId === usr.UserID;
                    return (
                      <tr key={usr.UserID} className="hover:bg-slate-50/60">
                        <td className="px-3 py-2">
                          {isEditing ? (
                            <div className="space-y-1">
                              <span className="font-mono text-slate-400 font-bold block">{usr.LoginName}</span>
                              <input
                                type="text"
                                required
                                value={editFullName}
                                onChange={(e) => setEditFullName(e.target.value)}
                                className="bg-slate-50 border border-slate-200 p-1 rounded font-bold w-36 text-xxs"
                              />
                            </div>
                          ) : (
                            <div>
                              <span className="font-extrabold text-slate-900 block">{usr.FullName}</span>
                              <span className="font-mono text-slate-500">ID: {usr.LoginName}</span>
                            </div>
                          )}
                        </td>
                        <td className="px-3 py-2 font-medium">
                          {isEditing ? (
                            <select
                              value={editRole}
                              onChange={(e) => setEditRole(e.target.value as User['Role'])}
                              className="bg-slate-50 border border-slate-200 p-1 rounded font-bold text-xxs"
                            >
                              <option value="Administrator">Administrator</option>
                              <option value="Doctor">Doctor</option>
                              <option value="Receptionist">Receptionist</option>
                              <option value="Pharmacist">Pharmacist</option>
                              <option value="Accountant">Accountant</option>
                            </select>
                          ) : (
                            <span className="px-2 py-0.5 bg-blue-50 text-blue-700 font-bold rounded border border-blue-150 uppercase">
                              {usr.Role}
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2 font-bold text-slate-700">
                          {isEditing ? (
                            <select
                              value={editShift}
                              onChange={(e) => {
                                const val = e.target.value;
                                setEditShift(val === 'Both' ? 'Both' : Number(val) as 1 | 2);
                              }}
                              className="bg-slate-50 border border-slate-200 p-1 rounded text-xxs font-bold"
                            >
                              <option value="Both">Both Shifts</option>
                              <option value="1">Morning Only</option>
                              <option value="2">Evening Only</option>
                            </select>
                          ) : (
                            <span className={`px-1.5 py-0.5 rounded text-xxs ${
                              usr.AssignedShift === 1 
                                ? 'bg-amber-50 text-amber-700 border border-amber-150' 
                                : usr.AssignedShift === 2 
                                ? 'bg-indigo-50 text-indigo-700 border border-indigo-150' 
                                : 'bg-slate-100 text-slate-600 border border-slate-200'
                            }`}>
                              {usr.AssignedShift === 1 
                                ? 'Morning (08:00 - 14:00)' 
                                : usr.AssignedShift === 2 
                                ? 'Evening (14:00 - 20:00)' 
                                : 'Both Shifts'}
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2">
                          {isEditing ? (
                            <input
                              type="text"
                              required
                              value={editPassword}
                              onChange={(e) => setEditPassword(e.target.value)}
                              className="bg-slate-50 border border-slate-200 p-1 rounded font-mono w-24 text-xxs"
                            />
                          ) : (
                            <span className="font-mono text-slate-600">{usr.PasswordHash}</span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-right">
                          <div className="flex items-center space-x-1.5 justify-end">
                            {isEditing ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleSaveEditUser(usr.UserID)}
                                  className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded"
                                >
                                  Save
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingUserId(null)}
                                  className="px-2 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded"
                                >
                                  Cancel
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedAccessUserId(usr.UserID);
                                    setActiveSettingsTab('access');
                                  }}
                                  className="px-2 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold rounded border border-purple-200 flex items-center space-x-1"
                                  title="Configure Desk Permissions & User-to-User Access Matrix"
                                >
                                  <Shield className="w-3 h-3 mr-0.5 text-purple-600" />
                                  <span>Rights</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleStartEdit(usr)}
                                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded"
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteUser(usr.UserID)}
                                  className="px-2 py-1 bg-rose-100 hover:bg-rose-200 text-rose-700 font-bold rounded"
                                >
                                  Delete
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* View: Custom Access Management System (User-to-User & Desk Permissions) */}
      {activeSettingsTab === 'access' && (
        <div className="space-y-6 animate-fadeIn">
          
          {/* Header Card with User Selector & Quick Presets */}
          <div className="bg-gradient-to-r from-slate-900 via-purple-950 to-indigo-950 p-6 rounded-2xl border border-purple-800/40 shadow-lg text-white space-y-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-purple-800/40 pb-4">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-purple-600/30 rounded-xl border border-purple-400/30">
                  <ShieldCheck className="w-6 h-6 text-purple-300" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white flex items-center space-x-2">
                    <span>Custom Access Management System</span>
                    <span className="text-[10px] bg-purple-500/30 text-purple-200 font-mono font-bold px-2 py-0.5 rounded-full border border-purple-400/30 uppercase">
                      Admin Control Center
                    </span>
                  </h3>
                  <p className="text-xs text-purple-200/80 mt-0.5">
                    Define desk access switches, menu rights, and configure User-to-User peer details visibility restrictions.
                  </p>
                </div>
              </div>

              {/* Target Staff Member Selector Dropdown */}
              <div className="flex items-center space-x-2 bg-slate-900/90 p-2 rounded-xl border border-purple-500/30">
                <UserCog className="w-4 h-4 text-purple-400" />
                <span className="text-xs font-bold text-purple-200 shrink-0">Configuring Staff:</span>
                <select
                  value={selectedAccessUserId}
                  onChange={(e) => setSelectedAccessUserId(e.target.value)}
                  className="bg-purple-950 text-white font-bold text-xs rounded-lg p-2 border border-purple-400/40 focus:ring-2 focus:ring-purple-400 focus:outline-none cursor-pointer"
                >
                  {usersList.map((usr) => (
                    <option key={usr.UserID} value={usr.UserID}>
                      {usr.FullName} ({usr.Role} • {usr.LoginName})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Quick Role Template Presets */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <div className="flex items-center space-x-2">
                <Sliders className="w-4 h-4 text-purple-400" />
                <span className="text-xs font-bold text-purple-200">Quick Permission Templates:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={selectedAccessUser?.Role === 'Administrator'}
                  onClick={() => handleApplyRolePreset('Administrator')}
                  className={`px-2.5 py-1 bg-purple-800/50 hover:bg-purple-700/60 text-purple-100 text-xxs font-bold rounded-lg border border-purple-400/30 transition flex items-center space-x-1 ${
                    selectedAccessUser?.Role === 'Administrator' ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                  }`}
                >
                  <Shield className="w-3 h-3 text-purple-300" />
                  <span>Admin (Full Control)</span>
                </button>
                <button
                  type="button"
                  disabled={selectedAccessUser?.Role === 'Administrator'}
                  onClick={() => handleApplyRolePreset('Doctor')}
                  className={`px-2.5 py-1 bg-teal-800/50 hover:bg-teal-700/60 text-teal-100 text-xxs font-bold rounded-lg border border-teal-400/30 transition flex items-center space-x-1 ${
                    selectedAccessUser?.Role === 'Administrator' ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                  }`}
                >
                  <Briefcase className="w-3 h-3 text-teal-300" />
                  <span>Doctor (Clinical)</span>
                </button>
                <button
                  type="button"
                  disabled={selectedAccessUser?.Role === 'Administrator'}
                  onClick={() => handleApplyRolePreset('Receptionist')}
                  className={`px-2.5 py-1 bg-amber-800/50 hover:bg-amber-700/60 text-amber-100 text-xxs font-bold rounded-lg border border-amber-400/30 transition flex items-center space-x-1 ${
                    selectedAccessUser?.Role === 'Administrator' ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                  }`}
                >
                  <Users className="w-3 h-3 text-amber-300" />
                  <span>Receptionist (OPD Queue)</span>
                </button>
                <button
                  type="button"
                  disabled={selectedAccessUser?.Role === 'Administrator'}
                  onClick={() => handleApplyRolePreset('Pharmacist')}
                  className={`px-2.5 py-1 bg-blue-800/50 hover:bg-blue-700/60 text-blue-100 text-xxs font-bold rounded-lg border border-blue-400/30 transition flex items-center space-x-1 ${
                    selectedAccessUser?.Role === 'Administrator' ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                  }`}
                >
                  <Building className="w-3 h-3 text-blue-300" />
                  <span>Pharmacist (Store POS)</span>
                </button>
                <button
                  type="button"
                  disabled={selectedAccessUser?.Role === 'Administrator'}
                  onClick={() => handleApplyRolePreset('Accountant')}
                  className={`px-2.5 py-1 bg-emerald-800/50 hover:bg-emerald-700/60 text-emerald-100 text-xxs font-bold rounded-lg border border-emerald-400/30 transition flex items-center space-x-1 ${
                    selectedAccessUser?.Role === 'Administrator' ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                  }`}
                >
                  <FileText className="w-3 h-3 text-emerald-300" />
                  <span>Accountant (Ledger)</span>
                </button>
              </div>
            </div>
          </div>

          {/* Admin Lock Notice Banner */}
          {selectedAccessUser?.Role === 'Administrator' && (
            <div className="bg-amber-500/10 border border-amber-300/60 p-4 rounded-2xl text-amber-900 flex items-start space-x-3 text-xs shadow-2xs">
              <Lock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-extrabold text-amber-950 text-sm">🔒 Administrator Access Control Locked (Self-Access Protected)</p>
                <p className="text-amber-900/90 mt-0.5">
                  Administrators have full system rights by default. The Administrator account access rights cannot be edited or restricted, but you can configure and control access rights for all other staff accounts (Doctors, Receptionists, Pharmacists, Accountants).
                </p>
                <p className="text-amber-900 mt-1 font-bold">
                  👉 Select a Doctor, Receptionist, Pharmacist, or Accountant from the "Configuring Staff" dropdown above to manage their permissions.
                </p>
              </div>
            </div>
          )}

          {/* Administrator Authorization & Approval Control Center */}
          <div className={`p-5 rounded-2xl border transition-all shadow-sm ${
            accessApprovalStatus === 'Approved'
              ? 'bg-emerald-950/20 border-emerald-500/30 text-slate-800'
              : accessApprovalStatus === 'Pending'
              ? 'bg-amber-950/20 border-amber-500/30 text-slate-800'
              : 'bg-rose-950/20 border-rose-500/30 text-slate-800'
          }`}>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start space-x-3">
                <div className={`p-2.5 rounded-xl mt-0.5 shrink-0 ${
                  accessApprovalStatus === 'Approved'
                    ? 'bg-emerald-500/20 text-emerald-600 border border-emerald-500/30'
                    : accessApprovalStatus === 'Pending'
                    ? 'bg-amber-500/20 text-amber-600 border border-amber-500/30'
                    : 'bg-rose-500/20 text-rose-600 border border-rose-500/30'
                }`}>
                  {accessApprovalStatus === 'Approved' ? (
                    <CheckCircle2 className="w-6 h-6" />
                  ) : accessApprovalStatus === 'Pending' ? (
                    <RefreshCw className="w-6 h-6 animate-spin-slow" />
                  ) : (
                    <Ban className="w-6 h-6" />
                  )}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h4 className="text-sm font-black text-slate-900">
                      Access Approval Status for {selectedAccessUser?.FullName}:
                    </h4>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wide border ${
                      accessApprovalStatus === 'Approved'
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                        : accessApprovalStatus === 'Pending'
                        ? 'bg-amber-100 text-amber-800 border-amber-300'
                        : 'bg-rose-100 text-rose-800 border-rose-300'
                    }`}>
                      {accessApprovalStatus === 'Approved' ? '✅ Approved & Active' : accessApprovalStatus === 'Pending' ? '⏳ Pending Approval' : '🚫 Suspended / Denied'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">
                    {accessApprovalStatus === 'Approved'
                      ? `Access officially approved by ${accessApprovedBy || 'Administrator'}${accessApprovedAt ? ` on ${new Date(accessApprovedAt).toLocaleDateString()} ${new Date(accessApprovedAt).toLocaleTimeString()}` : ''}. User has full access to approved modules.`
                      : accessApprovalStatus === 'Pending'
                      ? 'Permissions have been customized and are awaiting final Administrator review and authorization before activation.'
                      : 'User account access has been revoked/suspended. The user will be blocked from accessing protected menus until approved.'}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  disabled={selectedAccessUser?.Role === 'Administrator'}
                  onClick={handleApproveAndGrantAccess}
                  className={`px-3.5 py-2 text-xs font-bold rounded-xl transition flex items-center space-x-1.5 shadow-xs ${
                    accessApprovalStatus === 'Approved'
                      ? 'bg-emerald-600 text-white cursor-default ring-2 ring-emerald-400'
                      : 'bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-emerald-600 hover:text-white cursor-pointer'
                  }`}
                  title="Approve permissions and immediately grant access to user"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Approve & Grant Access</span>
                </button>

                <button
                  type="button"
                  disabled={selectedAccessUser?.Role === 'Administrator'}
                  onClick={() => handleSaveAccessPermissions('Pending')}
                  className={`px-3 py-2 text-xs font-bold rounded-xl transition flex items-center space-x-1.5 shadow-xs ${
                    accessApprovalStatus === 'Pending'
                      ? 'bg-amber-600 text-white cursor-default ring-2 ring-amber-400'
                      : 'bg-amber-50 text-amber-700 border border-amber-300 hover:bg-amber-600 hover:text-white cursor-pointer'
                  }`}
                  title="Set status to Pending"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Mark Pending</span>
                </button>

                <button
                  type="button"
                  disabled={selectedAccessUser?.Role === 'Administrator'}
                  onClick={handleRejectOrSuspendAccess}
                  className={`px-3 py-2 text-xs font-bold rounded-xl transition flex items-center space-x-1.5 shadow-xs ${
                    accessApprovalStatus === 'Rejected'
                      ? 'bg-rose-600 text-white cursor-default ring-2 ring-rose-400'
                      : 'bg-rose-50 text-rose-700 border border-rose-300 hover:bg-rose-600 hover:text-white cursor-pointer'
                  }`}
                  title="Suspend or reject user access"
                >
                  <Ban className="w-3.5 h-3.5" />
                  <span>Suspend Access</span>
                </button>
              </div>
            </div>
          </div>

          {/* Section 1: User-to-User Access Control Matrix */}
          <div className="bg-white p-6 rounded-2xl border border-purple-200 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-2">
              <div>
                <h4 className="text-sm font-black text-slate-800 flex items-center space-x-2">
                  <FolderLock className="w-4 h-4 text-purple-600" />
                  <span>User-to-User Access Control Matrix (Peer Visibility)</span>
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Decide specifically which target staff members <strong className="text-purple-900">{selectedAccessUser?.FullName}</strong> is authorized to view or access details, consultations, and audit profiles of.
                </p>
              </div>

              {/* Master Wildcard All Users Switch */}
              <button
                type="button"
                onClick={handleToggleWildcardAll}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer border ${
                  accessAllowedUserIDs.includes('ALL') || accessAllowedUserIDs.includes('*')
                    ? 'bg-purple-600 text-white border-purple-700 shadow-sm'
                    : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                }`}
              >
                {accessAllowedUserIDs.includes('ALL') || accessAllowedUserIDs.includes('*') ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-purple-200" />
                    <span>Unrestricted: Can View ALL Users</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4 text-slate-500" />
                    <span>Restricted: Specific Target Users Only</span>
                  </>
                )}
              </button>
            </div>

            {/* Target User Peer Selection Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
              {usersList.map((targetUsr) => {
                const isSelf = targetUsr.UserID === selectedAccessUser?.UserID;
                const isAllowedAll = accessAllowedUserIDs.includes('ALL') || accessAllowedUserIDs.includes('*');
                const isExplicitlyAllowed = accessAllowedUserIDs.includes(targetUsr.UserID) || (targetUsr.LoginName && accessAllowedUserIDs.includes(targetUsr.LoginName));
                const isChecked = isAllowedAll || isExplicitlyAllowed || isSelf;

                return (
                  <div
                    key={targetUsr.UserID}
                    onClick={() => {
                      if (!isSelf && !isAllowedAll) {
                        handleToggleTargetUserAccess(targetUsr.UserID);
                      }
                    }}
                    className={`p-3.5 rounded-xl border transition-all flex items-center justify-between ${
                      isSelf 
                        ? 'bg-slate-50 border-slate-200 opacity-80 cursor-default'
                        : isChecked
                        ? 'bg-purple-50/70 border-purple-300 shadow-2xs cursor-pointer hover:bg-purple-50'
                        : 'bg-white border-slate-200 opacity-60 hover:opacity-100 cursor-pointer hover:border-purple-200'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs uppercase ${
                        isChecked ? 'bg-purple-600 text-white' : 'bg-slate-200 text-slate-600'
                      }`}>
                        {targetUsr.FullName.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center space-x-1.5">
                          <span className="font-extrabold text-slate-900 text-xs">{targetUsr.FullName}</span>
                          {isSelf && (
                            <span className="text-[9px] bg-slate-200 text-slate-700 font-bold px-1.5 py-0.2 rounded uppercase">
                              Self
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] font-mono text-slate-500 block">
                          {targetUsr.Role} • Login: {targetUsr.LoginName}
                        </span>
                      </div>
                    </div>

                    <div className="shrink-0">
                      {isChecked ? (
                        <span className="flex items-center space-x-1 px-2 py-1 bg-purple-100 text-purple-800 text-[10px] font-extrabold rounded-lg border border-purple-200">
                          <Eye className="w-3 h-3 text-purple-700" />
                          <span>Allowed</span>
                        </span>
                      ) : (
                        <span className="flex items-center space-x-1 px-2 py-1 bg-slate-100 text-slate-500 text-[10px] font-bold rounded-lg border border-slate-200">
                          <EyeOff className="w-3 h-3 text-slate-400" />
                          <span>Restricted</span>
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 2: 3-Step Hierarchical Main Menu & Pop-up Sub-Menu Access Control */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-100 pb-4 gap-3">
              <div>
                <div className="flex items-center space-x-2">
                  <h4 className="text-sm font-black text-slate-900 flex items-center space-x-2">
                    <Sliders className="w-4 h-4 text-blue-600" />
                    <span>Main Menu & Sub-Menu Hierarchical Access Control</span>
                  </h4>
                  <span className="text-[10px] bg-blue-100 text-blue-800 font-extrabold px-2 py-0.5 rounded-md border border-blue-200 uppercase">
                    3-Step Workflow
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  <strong>Step 1:</strong> Toggle Main Menu Desk ➔ <strong>Step 2:</strong> Configure Pop-up Sub-Menus ➔ <strong>Step 3:</strong> Show/Hide Items & Transaction Rights ➔ <strong>Step 4:</strong> Administrator Approval.
                </p>
              </div>

              {/* Quick Bulk Main Menu Switch */}
              <div className="flex items-center space-x-2 shrink-0">
                <button
                  type="button"
                  disabled={selectedAccessUser?.Role === 'Administrator'}
                  onClick={() => {
                    const updated = { ...accessPermissions };
                    MAIN_MENU_CONFIGS.forEach(m => {
                      if (m.id === 'dashboard' && selectedAccessUser?.Role !== 'Administrator') {
                        updated[m.permKey] = false;
                      } else {
                        updated[m.permKey] = true;
                      }
                    });
                    setAccessPermissions(updated);
                  }}
                  className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white rounded-xl text-xs font-bold transition border border-blue-200 cursor-pointer disabled:opacity-50"
                >
                  Allow All Menus
                </button>
                <button
                  type="button"
                  disabled={selectedAccessUser?.Role === 'Administrator'}
                  onClick={() => {
                    const updated = { ...accessPermissions };
                    MAIN_MENU_CONFIGS.forEach(m => {
                      updated[m.permKey] = false;
                    });
                    setAccessPermissions(updated);
                  }}
                  className="px-3 py-1.5 bg-slate-100 text-slate-700 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300 rounded-xl text-xs font-bold transition border border-slate-200 cursor-pointer disabled:opacity-50"
                >
                  Restrict All
                </button>
              </div>
            </div>

            {/* Main Menu Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {MAIN_MENU_CONFIGS.filter(menu => {
                if (selectedAccessUser?.Role !== 'Administrator' && menu.id === 'dashboard') {
                  return false;
                }
                return true;
              }).map((menu) => {
                const isMainAllowed = !!accessPermissions[menu.permKey];
                
                // Count enabled sub-menus
                const allowedSubCount = menu.subMenus.filter(sub => accessPermissions[sub.key] !== false).length;
                const totalSubCount = menu.subMenus.length;

                // Count enabled action items
                const allowedActionCount = menu.actionItems.filter(item => accessPermissions[item.key] !== false).length;
                const totalActionCount = menu.actionItems.length;

                // Menu color classes
                const colorMap: Record<string, { bg: string; border: string; text: string; badge: string }> = {
                  teal: { bg: 'bg-teal-50/60', border: 'border-teal-300', text: 'text-teal-700', badge: 'bg-teal-100 text-teal-800' },
                  blue: { bg: 'bg-blue-50/60', border: 'border-blue-300', text: 'text-blue-700', badge: 'bg-blue-100 text-blue-800' },
                  indigo: { bg: 'bg-indigo-50/60', border: 'border-indigo-300', text: 'text-indigo-700', badge: 'bg-indigo-100 text-indigo-800' },
                  emerald: { bg: 'bg-emerald-50/60', border: 'border-emerald-300', text: 'text-emerald-700', badge: 'bg-emerald-100 text-emerald-800' },
                  purple: { bg: 'bg-purple-50/60', border: 'border-purple-300', text: 'text-purple-700', badge: 'bg-purple-100 text-purple-800' },
                  amber: { bg: 'bg-amber-50/60', border: 'border-amber-300', text: 'text-amber-700', badge: 'bg-amber-100 text-amber-800' },
                  slate: { bg: 'bg-slate-50/80', border: 'border-slate-300', text: 'text-slate-700', badge: 'bg-slate-200 text-slate-800' },
                  cyan: { bg: 'bg-cyan-50/60', border: 'border-cyan-300', text: 'text-cyan-700', badge: 'bg-cyan-100 text-cyan-800' },
                  rose: { bg: 'bg-rose-50/60', border: 'border-rose-300', text: 'text-rose-700', badge: 'bg-rose-100 text-rose-800' },
                  violet: { bg: 'bg-violet-50/60', border: 'border-violet-300', text: 'text-violet-700', badge: 'bg-violet-100 text-violet-800' },
                };
                const colors = colorMap[menu.color] || colorMap.blue;

                return (
                  <div
                    key={menu.id}
                    className={`p-5 rounded-2xl border transition-all space-y-4 shadow-2xs ${
                      isMainAllowed
                        ? `${colors.bg} ${colors.border} ring-1 ring-${menu.color}-300/30`
                        : 'bg-slate-50/60 border-slate-200 opacity-70 hover:opacity-100'
                    }`}
                  >
                    {/* Top Row: Icon, Menu Title, Toggle Switch */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center space-x-3">
                        <div className={`p-3 rounded-xl border shrink-0 ${
                          isMainAllowed
                            ? `bg-white shadow-2xs ${colors.text} ${colors.border}`
                            : 'bg-slate-200 text-slate-500 border-slate-300'
                        }`}>
                          <menu.icon className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <h5 className="font-extrabold text-slate-900 text-sm">{menu.name}</h5>
                          </div>
                          <p className="text-[11px] text-slate-500 font-medium line-clamp-2 mt-0.5">
                            {menu.desc}
                          </p>
                        </div>
                      </div>

                      {/* Main Menu Toggle Switch */}
                      <button
                        type="button"
                        disabled={selectedAccessUser?.Role === 'Administrator'}
                        onClick={() => handleToggleMainMenu(menu.id)}
                        className={`w-11 h-6 rounded-full transition-colors relative shrink-0 cursor-pointer disabled:opacity-50 ${
                          isMainAllowed ? 'bg-blue-600' : 'bg-slate-300'
                        }`}
                        title={isMainAllowed ? 'Click to Restrict Main Menu' : 'Click to Allow Main Menu & Configure Sub-Menus in Pop-up'}
                      >
                        <div className={`w-5 h-5 rounded-full bg-white shadow-xs absolute top-0.5 transition-transform ${
                          isMainAllowed ? 'left-5.5' : 'left-0.5'
                        }`} />
                      </button>
                    </div>

                    {/* Middle Row: Sub-menu and Action Items Statistics Badges */}
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <span className={`px-2.5 py-1 rounded-lg text-xxs font-bold border ${
                        isMainAllowed 
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-200' 
                          : 'bg-slate-200 text-slate-600 border-slate-300'
                      }`}>
                        {isMainAllowed ? '🟢 Main Menu Allowed' : '⚪ Main Menu Restricted'}
                      </span>

                      {totalSubCount > 0 && (
                        <span className="px-2.5 py-1 rounded-lg text-xxs font-semibold bg-white/90 text-slate-700 border border-slate-200 shadow-2xs">
                          📑 Sub-Menus: <strong className={isMainAllowed ? 'text-blue-700' : 'text-slate-500'}>{isMainAllowed ? allowedSubCount : 0}/{totalSubCount}</strong>
                        </span>
                      )}

                      {totalActionCount > 0 && (
                        <span className="px-2.5 py-1 rounded-lg text-xxs font-semibold bg-white/90 text-slate-700 border border-slate-200 shadow-2xs">
                          ⚡ Action Items: <strong className={isMainAllowed ? 'text-purple-700' : 'text-slate-500'}>{isMainAllowed ? allowedActionCount : 0}/{totalActionCount}</strong>
                        </span>
                      )}
                    </div>

                    {/* Bottom Row: Pop-up Sub-Menu & Item Configuration Button */}
                    <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between gap-2">
                      <span className="text-[10px] text-slate-500 italic">
                        {isMainAllowed
                          ? 'Click configure to manage individual sub-menus, buttons & actions in pop-up'
                          : 'Turn switch ON to configure sub-menus & specific buttons'}
                      </span>

                      <button
                        type="button"
                        onClick={() => handleOpenMainMenuConfig(menu.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shrink-0 ${
                          isMainAllowed
                            ? 'bg-slate-900 text-white hover:bg-blue-600 shadow-xs cursor-pointer'
                            : 'bg-slate-200 text-slate-700 hover:bg-slate-300 cursor-pointer'
                        }`}
                      >
                        <Sliders className="w-3.5 h-3.5 text-blue-400" />
                        <span>⚙️ Configure Sub-Menus (Pop-up)</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 3: Action Level Permissions Matrix (Add, Post, Cancel, Print, Export Rights) */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
              <div>
                <h4 className="text-sm font-black text-slate-800 flex items-center space-x-2">
                  <Key className="w-4 h-4 text-emerald-600" />
                  <span>Action Level Menu Rights Matrix (Create, Post, Cancel, Print & Export)</span>
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Control specific transaction privileges for each menu module for <strong className="text-slate-800">{selectedAccessUser?.FullName}</strong>.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="min-w-full divide-y divide-slate-200 text-xs">
                <thead className="bg-slate-50 font-bold text-slate-600 text-[11px] uppercase tracking-wider text-left">
                  <tr>
                    <th className="px-4 py-3">Menu / Desk Module</th>
                    <th className="px-4 py-3 text-center">Menu Access</th>
                    <th className="px-4 py-3 text-center">Add Record</th>
                    <th className="px-4 py-3 text-center">Post Record</th>
                    <th className="px-4 py-3 text-center">Cancel / Void</th>
                    <th className="px-4 py-3 text-center">Print Slip/Doc</th>
                    <th className="px-4 py-3 text-center">Export Data</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {accessUserRights.map((right) => (
                    <tr key={right.MenuID} className="hover:bg-slate-50/80 transition font-medium">
                      <td className="px-4 py-3 text-slate-900 font-extrabold flex items-center space-x-2">
                        <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                        <span>{right.MenuName}</span>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleUserRight(right.MenuID, 'Status')}
                          className={`px-3 py-1 rounded-lg text-xxs font-bold transition cursor-pointer border ${
                            right.Status ? 'bg-blue-100 text-blue-800 border-blue-200' : 'bg-slate-100 text-slate-400 border-slate-200'
                          }`}
                        >
                          {right.Status ? 'Enabled' : 'Disabled'}
                        </button>
                      </td>

                      {/* AddRec */}
                      <td className="px-4 py-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleUserRight(right.MenuID, 'AddRec')}
                          className={`px-3 py-1 rounded-lg text-xxs font-bold transition cursor-pointer border ${
                            right.AddRec ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-slate-100 text-slate-400 border-slate-200'
                          }`}
                        >
                          {right.AddRec ? 'Allowed' : 'Denied'}
                        </button>
                      </td>

                      {/* PostRec */}
                      <td className="px-4 py-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleUserRight(right.MenuID, 'PostRec')}
                          className={`px-3 py-1 rounded-lg text-xxs font-bold transition cursor-pointer border ${
                            right.PostRec ? 'bg-indigo-100 text-indigo-800 border-indigo-200' : 'bg-slate-100 text-slate-400 border-slate-200'
                          }`}
                        >
                          {right.PostRec ? 'Allowed' : 'Denied'}
                        </button>
                      </td>

                      {/* CancelPosted */}
                      <td className="px-4 py-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleUserRight(right.MenuID, 'CancelPosted')}
                          className={`px-3 py-1 rounded-lg text-xxs font-bold transition cursor-pointer border ${
                            right.CancelPosted ? 'bg-rose-100 text-rose-800 border-rose-200' : 'bg-slate-100 text-slate-400 border-slate-200'
                          }`}
                        >
                          {right.CancelPosted ? 'Authorized' : 'Restricted'}
                        </button>
                      </td>

                      {/* PrintRec */}
                      <td className="px-4 py-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleUserRight(right.MenuID, 'PrintRec')}
                          className={`px-3 py-1 rounded-lg text-xxs font-bold transition cursor-pointer border ${
                            right.PrintRec !== false ? 'bg-amber-100 text-amber-800 border-amber-200' : 'bg-slate-100 text-slate-400 border-slate-200'
                          }`}
                        >
                          {right.PrintRec !== false ? 'Print Allowed' : 'Print Locked'}
                        </button>
                      </td>

                      {/* ExportRec */}
                      <td className="px-4 py-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleUserRight(right.MenuID, 'ExportRec')}
                          className={`px-3 py-1 rounded-lg text-xxs font-bold transition cursor-pointer border ${
                            right.ExportRec !== false ? 'bg-teal-100 text-teal-800 border-teal-200' : 'bg-slate-100 text-slate-400 border-slate-200'
                          }`}
                        >
                          {right.ExportRec !== false ? 'Export Allowed' : 'Export Locked'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Bottom Save Action Floating Bar */}
          <div className="bg-slate-900 text-white p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-xl shrink-0 ${
                accessApprovalStatus === 'Approved'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : accessApprovalStatus === 'Pending'
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
              }`}>
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold block text-white">
                    {selectedAccessUser?.Role === 'Administrator'
                      ? 'Administrator Access Locked (Full Privileges)'
                      : `Save Access Profile for ${selectedAccessUser?.FullName}`}
                  </span>
                  <span className={`text-[10px] font-black uppercase px-2 py-0.2 rounded-md border ${
                    accessApprovalStatus === 'Approved'
                      ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40'
                      : accessApprovalStatus === 'Pending'
                      ? 'bg-amber-950/80 text-amber-300 border-amber-500/40'
                      : 'bg-rose-950/80 text-rose-300 border-rose-500/40'
                  }`}>
                    {accessApprovalStatus}
                  </span>
                </div>
                <span className="text-[10px] text-slate-400">
                  {selectedAccessUser?.Role === 'Administrator'
                    ? 'Admin accounts maintain full system permissions by default.'
                    : 'Modifications broadcast instantly across open windows without requiring page refresh.'}
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <button
                type="button"
                disabled={selectedAccessUser?.Role === 'Administrator'}
                onClick={handleApproveAndGrantAccess}
                className={`flex-1 sm:flex-initial px-4 py-2.5 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center space-x-2 ${
                  selectedAccessUser?.Role === 'Administrator'
                    ? 'bg-slate-700 opacity-50 cursor-not-allowed'
                    : 'bg-emerald-600 hover:bg-emerald-500 cursor-pointer shadow-emerald-900/30'
                }`}
                title="Approve permissions and grant immediate access"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                <span>Approve & Grant Access</span>
              </button>

              <button
                type="button"
                disabled={selectedAccessUser?.Role === 'Administrator'}
                onClick={() => handleSaveAccessPermissions()}
                className={`flex-1 sm:flex-initial px-5 py-2.5 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center space-x-2 ${
                  selectedAccessUser?.Role === 'Administrator'
                    ? 'bg-slate-700 opacity-60 cursor-not-allowed'
                    : 'bg-purple-600 hover:bg-purple-500 cursor-pointer shadow-purple-900/30'
                }`}
              >
                <Save className="w-4 h-4" />
                <span>Save Matrix</span>
              </button>
            </div>
          </div>

        </div>
      )}

      {/* View 3: SMS Gateway settings */}
      {activeSettingsTab === 'sms' && (
        <form onSubmit={handleSaveSmsSettings} className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-6 animate-fadeIn">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <MessageSquare className="w-4 h-4 text-blue-500" />
              <span className="text-xs font-black text-slate-800 uppercase tracking-wider">Configure Automated SMS Gateway Integration</span>
            </div>
            
            {/* Enabled Switch */}
            <label className="relative inline-flex items-center cursor-pointer select-none">
              <input 
                type="checkbox" 
                checked={smsEnabled} 
                onChange={(e) => setSmsEnabled(e.target.checked)} 
                className="sr-only peer" 
              />
              <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
              <span className="ml-2 text-xxs font-bold text-slate-700 uppercase">
                {smsEnabled ? 'Active' : 'Disabled'}
              </span>
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
            
            <div className="space-y-1">
              <label className="font-bold text-slate-700 block flex items-center">
                <Sliders className="w-3.5 h-3.5 mr-1 text-slate-400" />
                SMS Service Provider
              </label>
              <select
                value={smsProvider}
                onChange={(e) => {
                  const p = e.target.value as any;
                  setSmsProvider(p);
                  // Auto-fill template URLs for easier config
                  if (p === 'twilio') {
                    setSmsApiUrl('https://api.twilio.com/2010-04-01/Accounts/AC72680cf793/Messages.json');
                  } else if (p === 'infobip') {
                    setSmsApiUrl('https://api.infobip.com/sms/2/text/advanced');
                  } else if (p === 'jazz') {
                    setSmsApiUrl('https://api.jazz.com.pk/sms/v1/send');
                  } else if (p === 'telenor') {
                    setSmsApiUrl('https://telenor-api.pk/corporate/v2/messages');
                  } else {
                    setSmsApiUrl('https://your-custom-gateway.com/api/send-sms');
                  }
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-medium focus:ring-1 focus:ring-blue-500 focus:outline-none"
              >
                <option value="twilio">Twilio (US/Global)</option>
                <option value="infobip">Infobip (Global)</option>
                <option value="jazz">Mobilink Jazz Corporate (Pakistan Local Gateway)</option>
                <option value="telenor">Telenor Corporate SMS Gateway (Pakistan Local Gateway)</option>
                <option value="custom_webhook">Custom Webhook / REST Endpoint (JSON API)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700 block flex items-center">
                <Globe className="w-3.5 h-3.5 mr-1 text-slate-400" />
                API Gateway URL
              </label>
              <input
                type="url"
                required
                value={smsApiUrl}
                onChange={(e) => setSmsApiUrl(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-mono focus:ring-1 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700 block flex items-center">
                <Key className="w-3.5 h-3.5 mr-1 text-slate-400" />
                API Key / Authorization Token
              </label>
              <input
                type="password"
                required
                value={smsApiKey}
                onChange={(e) => setSmsApiKey(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-mono focus:ring-1 focus:ring-blue-500 focus:outline-none"
                placeholder=""
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700 block flex items-center">
                <MessageSquare className="w-3.5 h-3.5 mr-1 text-slate-400" />
                Sender Mask ID / Shortcode
              </label>
              <input
                type="text"
                required
                value={smsSenderId}
                onChange={(e) => setSmsSenderId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-medium focus:ring-1 focus:ring-blue-500 focus:outline-none"
                placeholder=""
              />
            </div>

          </div>

          {/* Guidelines on place-holders */}
          <div className="bg-blue-50/50 border border-blue-200 rounded-lg p-3.5 text-blue-900 text-xxs space-y-1 leading-normal">
            <p className="font-bold uppercase tracking-wider text-[9px] text-blue-800">Dynamic Template Parameters Supported:</p>
            <p>Customize dispatch copy using curly-bracket placeholders. The billing system automatically injects active data:</p>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2 pt-1 font-mono font-bold text-slate-700">
              <div className="bg-white px-1.5 py-0.5 rounded border border-slate-200 text-center">{"{PATIENT}"} : Patient Name</div>
              <div className="bg-white px-1.5 py-0.5 rounded border border-slate-200 text-center">{"{TOKEN}"} : Daily Serial Token</div>
              <div className="bg-white px-1.5 py-0.5 rounded border border-slate-200 text-center">{"{SHIFT}"} : Morning/Evening</div>
              <div className="bg-white px-1.5 py-0.5 rounded border border-slate-200 text-center">{"{DATE}"} : Booking Date</div>
              <div className="bg-white px-1.5 py-0.5 rounded border border-slate-200 text-center">{"{APPID}"} : Appointment ID</div>
            </div>
          </div>

          <div className="space-y-4 text-xs">
            <div className="space-y-1">
              <label className="font-bold text-slate-700 block">Initial / Booking Appointment SMS Message Template</label>
              <textarea
                required
                rows={3}
                value={smsBookingTemplate}
                onChange={(e) => setSmsBookingTemplate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-medium focus:ring-1 focus:ring-blue-500 focus:outline-none leading-normal"
                placeholder=""
              />
              <span className="text-xxs text-slate-400 font-medium">Character length will trigger segmented multi-part SMS messages depending on GSM carrier rules.</span>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700 block">Repeat / Follow-Up Appointment SMS Message Template</label>
              <textarea
                required
                rows={3}
                value={smsRepeatTemplate}
                onChange={(e) => setSmsRepeatTemplate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-medium focus:ring-1 focus:ring-blue-500 focus:outline-none leading-normal"
                placeholder=""
              />
              <span className="text-xxs text-slate-400 font-medium">Automatically triggered when repeat patients with existing profiles book an OPD slot.</span>
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg flex items-center space-x-2 shadow-md transition"
            >
              <Save className="w-4 h-4" />
              <span>Apply & Save Gateway Settings</span>
            </button>
          </div>
        </form>
      )}

      {/* View 4: MongoDB configuration */}
      {activeSettingsTab === 'mongodb' && (
        <div className="space-y-6 animate-fadeIn text-slate-800">

          <form onSubmit={handleSaveMongoDbSettings} className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-6">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Database className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-black text-slate-800 uppercase tracking-wider">MongoDB Database Connection & Sync Center</span>
              </div>
              
              {/* Sync Enabled toggle */}
              <label className="relative inline-flex items-center cursor-pointer select-none">
                <input 
                  type="checkbox" 
                  checked={mongoSync} 
                  onChange={(e) => setMongoSync(e.target.checked)} 
                  className="sr-only peer" 
                />
                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                <span className="ml-2 text-xxs font-bold text-slate-700 uppercase">
                  {mongoSync ? 'Live Auto-Sync' : 'Manual Sync'}
                </span>
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs pt-2">
              
              <div className="space-y-1">
                <label className="font-bold text-slate-700 block flex items-center">
                  <Globe className="w-3.5 h-3.5 mr-1 text-slate-400" />
                  MongoDB Connection URI
                </label>
                <input
                  type="text"
                  required
                  value={mongoConnString}
                  onChange={(e) => setMongoConnString(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-mono focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                  placeholder=""
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Database Name</label>
                <input
                  type="text"
                  required
                  value={mongoDatabase}
                  onChange={(e) => setMongoDatabase(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-medium focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                  placeholder=""
                />
              </div>

            </div>

            <div className="space-y-1 text-xs">
              <label className="font-bold text-slate-700 block">API / Bridge Server Endpoint</label>
              <input
                type="text"
                required
                value={mongoBridgeUrl}
                onChange={(e) => setMongoBridgeUrl(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-mono focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                placeholder=""
              />
            </div>

            {/* Connection String Generator */}
            <div className="space-y-2 text-xs pt-2">
              <label className="font-bold text-slate-700 block flex items-center">
                <span>Active MongoDB Connection Target</span>
                <span className="ml-1.5 text-[9px] text-emerald-600 font-bold bg-emerald-50 border border-emerald-150 rounded px-1 text-xxs font-black uppercase">AUTO GENERATED FOR COLD COUPLING</span>
              </label>
              <textarea
                readOnly
                rows={2}
                value={mongoConnString}
                className="w-full bg-slate-950 text-emerald-300 border border-slate-800 rounded-lg p-2.5 font-mono text-[10px] leading-relaxed cursor-not-allowed"
              />
              <p className="text-slate-400 text-xxs leading-normal font-semibold">
                This app connects directly to MongoDB via the native MongoDB driver. Database structure, collections (OPD consultations, patients, inventory), and initial accounting charts are built and populated automatically upon cold connection boot.
              </p>
            </div>

            <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={handleTestMongoDbConnection}
                  disabled={testingConnection}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 text-xs font-bold rounded-lg flex items-center space-x-1.5 transition disabled:opacity-50"
                >
                  {testingConnection ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                  ) : (
                    <Wifi className="w-3.5 h-3.5 text-emerald-600" />
                  )}
                  <span>{testingConnection ? 'Pinging MongoDB...' : 'Test Connection Handshake'}</span>
                </button>

                {testSuccess && !testingConnection && (
                  <div className="flex items-center text-emerald-600 text-xxs font-bold bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-100 animate-fadeIn">
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                    <span>Handshake Verified</span>
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg flex items-center space-x-2 shadow-md transition"
              >
                <Save className="w-4 h-4" />
                <span>Apply & Save Connection Parameters</span>
              </button>
            </div>
          </form>

          {/* Manual MongoDB Backup & Export Panel */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-slate-750 text-white rounded-xl p-6 shadow-xl space-y-4 animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-4">
              <div className="flex items-start space-x-3">
                <div className="bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 p-2.5 rounded-xl shrink-0">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h4 className="font-extrabold text-sm text-white uppercase tracking-wider">Manual MongoDB Database Backup & JSON Export</h4>
                    <span className="px-2 py-0.5 text-[9px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded uppercase tracking-wider">
                      Instant Download
                    </span>
                  </div>
                  <p className="text-slate-300 text-xs mt-1 leading-normal">
                    Trigger a manual snapshot of your MongoDB collections (Patients, Consultations, POS Sales, Inventory, Accounts) and download a complete JSON backup file.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleTriggerManualBackup}
                disabled={downloadingBackup}
                className="px-5 py-3 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-xs font-black uppercase tracking-wider rounded-xl flex items-center space-x-2.5 shadow-lg shadow-emerald-950/50 transition cursor-pointer shrink-0 disabled:opacity-50"
              >
                {downloadingBackup ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                ) : (
                  <Download className="w-4 h-4 text-white" />
                )}
                <span>{downloadingBackup ? 'Generating Backup...' : 'Trigger Manual Backup (.JSON)'}</span>
              </button>
            </div>

            {backupSuccess && (
              <div className="flex items-center space-x-2 text-emerald-400 text-xs font-semibold bg-emerald-950/60 border border-emerald-800/80 p-3 rounded-lg animate-fadeIn">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{backupSuccess}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xxs pt-1">
              <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-800/80 space-y-1">
                <span className="font-bold text-slate-400 uppercase block">Target Database</span>
                <span className="font-mono text-emerald-300 font-bold text-xs">{mongoDatabase || 'PharmacyPOSDB'}</span>
              </div>
              <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-800/80 space-y-1">
                <span className="font-bold text-slate-400 uppercase block">Collections Included</span>
                <span className="font-semibold text-slate-200">Patients, Visits, POS Sales, Medicines, Users, Accounts</span>
              </div>
              <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-800/80 space-y-1">
                <span className="font-bold text-slate-400 uppercase block">Format & Compatibility</span>
                <span className="font-semibold text-emerald-400">JSON (Universal MongoDB / Atlas import)</span>
              </div>
            </div>
          </div>

          {/* MongoDB Connection Instructions Panel */}
          <div className="bg-slate-900 border border-slate-800 text-white rounded-xl p-6 shadow-lg space-y-4 animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-start space-x-3">
                <div className="bg-emerald-600/10 border border-emerald-500/20 text-emerald-400 p-2 rounded-lg shrink-0 mt-0.5">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-white uppercase tracking-wider">🍃 MongoDB Deployment & Autocreation Guideline</h4>
                  <p className="text-slate-400 text-xxs mt-0.5 leading-normal">
                    This modern application has been completely migrated to MongoDB. It is built to instantiate databases, collections, and sample records natively on startup.
                  </p>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-800 pt-4 text-xxs space-y-3 leading-normal">
              <div>
                <span className="font-black text-emerald-400 uppercase text-[9px] tracking-wider block mb-1">What MongoDB Handles Automatically:</span>
                <ul className="list-disc pl-4 space-y-1 text-slate-300">
                  <li><strong>Automatic Database Provisioning:</strong> Connect to any empty MongoDB cluster or localhost daemon. The server automatically spins up <code>PharmacyPOSDB</code> on demand.</li>
                  <li><strong>Collection Generation:</strong> Standardized documents for OPD Consultations, Patients, Medicines (Panadol, Augmentin, etc.), Cities, and Financial Ledgers are initialized.</li>
                  <li><strong>Initial Seed injection:</strong> Zero manual scripts required. System boots loaded with pre-packaged reference data.</li>
                </ul>
              </div>

              <div className="bg-slate-950 p-3.5 rounded border border-slate-850 space-y-2">
                <span className="font-bold text-slate-200 block text-[10px] uppercase">How to Bind Your App to an External MongoDB Service:</span>
                <ol className="list-decimal pl-4 space-y-1.5 text-slate-400">
                  <li>Retrieve your MongoDB Connection String from MongoDB Atlas (e.g. <code>mongodb+srv://...</code>) or use local <code>mongodb://localhost:27017</code>.</li>
                  <li>Provide your Connection URI and Target Database Name in the Connection Center fields above.</li>
                  <li>Click <strong>Apply & Save Connection Parameters</strong> to preserve settings across sessions.</li>
                  <li>The Express backend (Server.js) reads this URI dynamically to initialize database connection pools on the server side securely.</li>
                </ol>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* View 5: System Maintenance & Database Safeguards */}
      {activeSettingsTab === 'maintenance' && (
        <div className="space-y-6">
          {/* Main Maintenance Header Card */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-slate-750 text-white rounded-xl p-6 shadow-xl space-y-6 animate-fadeIn">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
              <div className="flex items-start space-x-3.5">
                <div className="bg-amber-500/20 border border-amber-500/30 text-amber-400 p-3 rounded-xl shrink-0">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="font-extrabold text-base text-white uppercase tracking-wider">System Maintenance & Data Protection Center</h3>
                    <span className="px-2.5 py-0.5 text-[9px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full uppercase tracking-wider">
                      Active
                    </span>
                  </div>
                  <p className="text-slate-300 text-xs mt-1 max-w-2xl leading-relaxed">
                    Perform system maintenance tasks, manage database health, and export full manual snapshots of your active MongoDB collections for safe offline storage and disaster recovery.
                  </p>
                </div>
              </div>

              <div className="bg-slate-950/80 px-4 py-2.5 rounded-xl border border-slate-800 shrink-0 text-right">
                <span className="text-slate-400 text-[10px] font-bold uppercase block">Target Database</span>
                <span className="text-emerald-400 font-mono font-bold text-xs">{mongoDatabase || 'PharmacyPOSDB'}</span>
              </div>
            </div>

            {/* Manual Backup Spotlight Feature Box */}
            <div className="bg-slate-950/90 border border-emerald-500/30 rounded-xl p-5 space-y-4 shadow-lg">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start space-x-3">
                  <div className="bg-emerald-500/20 text-emerald-400 p-2.5 rounded-lg shrink-0">
                    <Database className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-white uppercase tracking-wide flex items-center gap-2">
                      <span>Manual MongoDB Database Backup & High-Ratio ZIP Archive</span>
                      <span className="text-xxs font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded">.ZIP / .JSON</span>
                    </h4>
                    <p className="text-slate-300 text-xs mt-1 leading-normal">
                      Instantly aggregate all live records from your MongoDB collections (Patients, EMR Consultations, OPD Tokens, Pharmacy POS Inventory, Sales Bills, and Financial Ledgers) into an ultra-compressed downloadable ZIP archive (reduces ~250MB raw JSON down to ~15MB).
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleTriggerManualBackup}
                  disabled={downloadingBackup}
                  className="px-6 py-3.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-xs font-black uppercase tracking-wider rounded-xl flex items-center justify-center space-x-2.5 shadow-lg shadow-emerald-950/80 transition cursor-pointer shrink-0 disabled:opacity-50"
                >
                  {downloadingBackup ? (
                    <RefreshCw className="w-4 h-4 animate-spin text-white" />
                  ) : (
                    <Download className="w-4 h-4 text-white" />
                  )}
                  <span>{downloadingBackup ? 'Generating Snapshot...' : 'Trigger Manual Backup (.ZIP)'}</span>
                </button>
              </div>

              {backupSuccess && (
                <div className="flex items-center space-x-2 text-emerald-400 text-xs font-semibold bg-emerald-950/80 border border-emerald-800 p-3 rounded-lg animate-fadeIn">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>{backupSuccess}</span>
                </div>
              )}

              {/* Collections Grid Summary */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xxs pt-2">
                <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-slate-400 font-medium block">Patients & Medical Records</span>
                  <span className="text-slate-200 font-bold">EMR & History</span>
                </div>
                <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-slate-400 font-medium block">Pharmacy & POS</span>
                  <span className="text-slate-200 font-bold">Inventory & Sales</span>
                </div>
                <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-slate-400 font-medium block">Accounts & Finance</span>
                  <span className="text-slate-200 font-bold">Journal & Ledgers</span>
                </div>
                <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-slate-400 font-medium block">System Profiles</span>
                  <span className="text-slate-200 font-bold">Users & Configs</span>
                </div>
              </div>
            </div>

            {/* Maintenance Instructions & Safety Specs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-1">
              <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 space-y-2">
                <h5 className="font-bold text-amber-400 uppercase text-xs flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Backup Best Practices</span>
                </h5>
                <ul className="list-disc pl-4 space-y-1.5 text-slate-300 text-xxs leading-relaxed">
                  <li>Store generated JSON backup files in a secure external drive or cloud storage.</li>
                  <li>Trigger a manual backup before major inventory updates or system maintenance.</li>
                  <li>Backup files contain raw collection JSON data fully formatted for standard MongoDB restoration.</li>
                </ul>
              </div>

              <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 space-y-2">
                <h5 className="font-bold text-blue-400 uppercase text-xs flex items-center gap-1.5">
                  <Database className="w-4 h-4" />
                  <span>Restoration & Import Protocol</span>
                </h5>
                <p className="text-slate-300 text-xxs leading-relaxed">
                  JSON backup exports can be directly imported back into local MongoDB or MongoDB Atlas using standard <code className="bg-slate-900 px-1 rounded text-emerald-300">mongoimport</code> or via the admin restore console.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View 7: Cities & Geographic Masters */}
      {activeSettingsTab === 'cities' && (
        <div className="space-y-6 animate-fadeIn" id="cities-management-tab">
          {/* Header Card */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-start space-x-3">
              <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-100 text-emerald-600">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <span>Cities & Geographic Locations Master</span>
                  <span className="bg-emerald-100 text-emerald-800 text-xxs px-2 py-0.5 rounded-full font-bold">Punjab & Pakistan</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Manage master list of cities for patient registration, token generation, demographic tracking, and EMR medical profiles.
                </p>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={handleRestorePunjabDefaults}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer"
                title="Restore default Punjab cities if missing"
              >
                <RefreshCw className="w-3.5 h-3.5 text-blue-600" />
                <span>Sync Defaults</span>
              </button>

              <button
                type="button"
                onClick={handleExportCitiesCSV}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer"
                title="Export cities master table as CSV"
              >
                <Download className="w-3.5 h-3.5 text-emerald-600" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-xxs font-bold uppercase text-slate-400">Total Cities</span>
                <p className="text-xl font-black text-slate-800 mt-0.5">{(cities || []).length}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <MapPin className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-xxs font-bold uppercase text-slate-400">Punjab Province Cities</span>
                <p className="text-xl font-black text-blue-600 mt-0.5">
                  {(cities || []).filter(c => !c.Province || c.Province.toLowerCase() === 'punjab').length}
                </p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <Building className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-xxs font-bold uppercase text-slate-400">Registered Patients Mapped</span>
                <p className="text-xl font-black text-indigo-600 mt-0.5">
                  {(patients || []).filter(p => p.CityID).length}
                </p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                <Users className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Add / Edit City Form */}
          <form
            id="city-management-form"
            onSubmit={handleSaveCitySubmit}
            className={`p-5 rounded-xl border transition shadow-xs ${
              editingCityId ? 'bg-amber-50/50 border-amber-200' : 'bg-white border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center space-x-2">
                {editingCityId ? (
                  <>
                    <Edit2 className="w-4 h-4 text-amber-600" />
                    <span className="text-xs font-black text-amber-900 uppercase tracking-wider">
                      Edit Existing City Record (ID #{editingCityId})
                    </span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-black text-slate-800 uppercase tracking-wider">
                      Add New City (Punjab Province / Pakistan)
                    </span>
                  </>
                )}
              </div>

              {editingCityId && (
                <button
                  type="button"
                  onClick={handleCancelCityEdit}
                  className="text-xs font-bold text-slate-500 hover:text-slate-800 transition underline cursor-pointer"
                >
                  Cancel Edit
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
              {/* City ID (Optional custom or auto) */}
              <div className="sm:col-span-3">
                <label className="block text-xxs font-bold text-slate-500 uppercase mb-1">
                  City ID {editingCityId ? '(Locked)' : '(Auto / Custom #)'}
                </label>
                <input
                  type="number"
                  placeholder="Auto-assigned"
                  value={cityFormId}
                  disabled={!!editingCityId}
                  onChange={(e) => setCityFormId(e.target.value ? Number(e.target.value) : '')}
                  className="w-full text-xs font-semibold border border-slate-200 rounded-lg p-2.5 focus:ring-1 focus:ring-emerald-500 focus:outline-none disabled:bg-slate-100 disabled:text-slate-400"
                />
              </div>

              {/* City Name */}
              <div className="sm:col-span-5">
                <label className="block text-xxs font-bold text-slate-500 uppercase mb-1">
                  City Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Lahore, Faisalabad, Kasur, Gujranwala..."
                  value={cityFormName}
                  onChange={(e) => setCityFormName(e.target.value)}
                  className="w-full text-xs font-semibold border border-slate-200 rounded-lg p-2.5 focus:ring-1 focus:ring-emerald-500 focus:outline-none bg-white"
                />
              </div>

              {/* Province / Region */}
              <div className="sm:col-span-4">
                <label className="block text-xxs font-bold text-slate-500 uppercase mb-1">
                  Province / Region
                </label>
                <select
                  value={cityFormProvince}
                  onChange={(e) => setCityFormProvince(e.target.value)}
                  className="w-full text-xs font-semibold border border-slate-200 rounded-lg p-2.5 focus:ring-1 focus:ring-emerald-500 focus:outline-none bg-white"
                >
                  <option value="Punjab">Punjab Province</option>
                  <option value="Sindh">Sindh</option>
                  <option value="Khyber Pakhtunkhwa">Khyber Pakhtunkhwa (KPK)</option>
                  <option value="Balochistan">Balochistan</option>
                  <option value="Islamabad Capital Territory">Islamabad Capital Territory</option>
                  <option value="Azad Jammu & Kashmir">Azad Jammu & Kashmir (AJK)</option>
                  <option value="Gilgit-Baltistan">Gilgit-Baltistan</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 mt-4 pt-3 border-t border-slate-100">
              {editingCityId && (
                <button
                  type="button"
                  onClick={handleCancelCityEdit}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
              )}

              <button
                type="submit"
                disabled={isSavingCity || !cityFormName.trim()}
                className={`px-5 py-2 rounded-lg text-xs font-bold text-white shadow-xs transition flex items-center space-x-2 cursor-pointer ${
                  editingCityId
                    ? 'bg-amber-600 hover:bg-amber-700'
                    : 'bg-emerald-600 hover:bg-emerald-700'
                } disabled:bg-slate-400 disabled:cursor-not-allowed`}
              >
                <Save className="w-4 h-4" />
                <span>{isSavingCity ? 'Saving...' : editingCityId ? 'Update City Record' : 'Save & Register City'}</span>
              </button>
            </div>
          </form>

          {/* Cities Directory Table Card */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            {/* Search & Filter Header */}
            <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-50/50">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search city by name, ID or province (e.g. Lahore, Faisalabad, 1)..."
                  value={citySearchQuery}
                  onChange={(e) => setCitySearchQuery(e.target.value)}
                  className="w-full text-xs pl-9 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white"
                />
                {citySearchQuery && (
                  <button
                    onClick={() => setCitySearchQuery('')}
                    className="absolute right-2.5 top-2 text-xxs font-bold text-slate-400 hover:text-slate-600"
                  >
                    Clear
                  </button>
                )}
              </div>

              <div className="text-xs text-slate-500 font-semibold">
                Showing <span className="font-bold text-slate-800">{filteredCitiesList.length}</span> of {(cities || []).length} cities
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100/80 text-slate-600 font-bold uppercase text-xxs tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4 w-24">City ID</th>
                    <th className="py-3 px-4">City Name</th>
                    <th className="py-3 px-4">Province / Territory</th>
                    <th className="py-3 px-4 text-center">Registered Patients</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredCitiesList.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-10 text-slate-400">
                        <MapPin className="w-8 h-8 mx-auto mb-2 text-slate-300 opacity-60" />
                        <p className="font-bold text-xs">No cities found matching "{citySearchQuery}"</p>
                        <p className="text-xxs text-slate-400 mt-1">Try a different search term or add a new city using the form above.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredCitiesList.map((c) => {
                      const patientCount = getPatientCountForCity(c.CityID);
                      const isEditingThis = editingCityId === c.CityID;

                      return (
                        <tr
                          key={c.CityID}
                          className={`hover:bg-slate-50/80 transition ${
                            isEditingThis ? 'bg-amber-50/60 font-semibold' : ''
                          }`}
                        >
                          <td className="py-3 px-4">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xxs font-black bg-slate-100 text-slate-700 border border-slate-200">
                              #{c.CityID}
                            </span>
                          </td>

                          <td className="py-3 px-4 font-bold text-slate-900 flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                            <span>{c.CityName}</span>
                          </td>

                          <td className="py-3 px-4">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xxs font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                              {(c as any).Province || 'Punjab'}
                            </span>
                          </td>

                          <td className="py-3 px-4 text-center">
                            {patientCount > 0 ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xxs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                {patientCount} patient{patientCount > 1 ? 's' : ''}
                              </span>
                            ) : (
                              <span className="text-slate-400 text-xxs">0 patients</span>
                            )}
                          </td>

                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end space-x-2">
                              <button
                                type="button"
                                onClick={() => handleStartEditCity(c)}
                                className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-md transition cursor-pointer"
                                title={`Edit ${c.CityName}`}
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDeleteCityAction(c)}
                                className="p-1.5 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-md transition cursor-pointer"
                                title={`Delete ${c.CityName}`}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
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

      {/* View: Thermal Printer Hardware Settings */}
      {activeSettingsTab === 'thermal' && (
        <ThermalPrinterSettingsTab clinicSettings={clinicSettings} />
      )}

      {/* Backup Progress Modal */}
      <BackupProgressModal
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
        targetDbName={mongoDatabase || 'PharmacyPOSDB'}
        bridgeUrl={mongoDbSettings.BridgeUrl || ''}
      />

      {/* 3-Step Main Menu Granular Pop-up Configuration Modal */}
      <MainMenuConfigModal
        isOpen={!!configuringMainMenuId}
        onClose={() => setConfiguringMainMenuId(null)}
        mainMenu={MAIN_MENU_CONFIGS.find(m => m.id === configuringMainMenuId) || null}
        menu={MAIN_MENU_CONFIGS.find(m => m.id === configuringMainMenuId) || null}
        targetUser={selectedAccessUser}
        user={selectedAccessUser}
        currentUser={currentUser}
        accessPermissions={accessPermissions}
        permissions={accessPermissions}
        onTogglePermission={handleToggleDeskPermission}
        onSetPermissions={setAccessPermissions}
        accessUserRights={accessUserRights}
        userRights={accessUserRights}
        onToggleUserRight={handleToggleUserRight}
        onApproveAndSave={() => {
          setConfiguringMainMenuId(null);
          handleSaveAccessPermissions('Approved');
        }}
      />

    </div>
  );
}

