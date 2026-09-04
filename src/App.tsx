/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, lazy, Suspense } from 'react';
import {
  INITIAL_CITIES,
  INITIAL_ITEMS,
  INITIAL_SUPPLIERS,
  INITIAL_LAB_TESTS,
  INITIAL_FL_ACCOUNTS,
  INITIAL_SL_ACCOUNTS,
  INITIAL_TL_ACCOUNTS,
  INITIAL_CONFIG,
  INITIAL_USERS,
  ROLE_RIGHTS,
  INITIAL_PATIENTS,
  INITIAL_APPOINTMENTS,
  INITIAL_TOKENS
} from './data/initialData';

import {
  City,
  Patient,
  Appointment,
  Token,
  Item,
  ItemBatch,
  Supplier,
  LabTest,
  Visit,
  VisitMedicine,
  MedicalCertificate,
  MedicalCertificateSBP,
  InvoiceHeader,
  InvoiceDetail,
  SRInvHeader,
  SRInvDetail,
  InvVchHeader,
  InvVchDetail,
  InvLedger,
  FLAccount,
  SLAccount,
  TLAccount,
  Config,
  VchHeader,
  VchDetail,
  ACLedger,
  User,
  UserRight,
  NhcPatientHistory,
  SmartLocatorMedicine
} from './types';

import {
  LayoutDashboard,
  Users,
  FileText,
  ShoppingCart,
  BookOpen,
  UploadCloud,
  BarChart3,
  Settings,
  ShieldCheck,
  LogOut,
  DatabaseBackup,
  Code,
  RefreshCw,
  CheckCircle,
  Lock,
  ChevronDown,
  User as UserIcon,
  Building2,
  Menu,
  X,
  Stethoscope,
  Maximize2,
  Minimize2
} from 'lucide-react';
import UnauthorizedModal from './components/UnauthorizedModal';
import DashboardPasswordModal from './components/DashboardPasswordModal';
import GlobalSearchHeader from './components/GlobalSearchHeader';
import PwaInstallModal from './components/PwaInstallModal';
import LoginDesk from './components/LoginDesk';
import { TopProgressBar, GlobalLoadingOverlay } from './components/LoadingIndicator';
import {
  ErpDeskSkeleton,
  DashboardSkeleton,
  PatientDeskSkeleton,
  PharmacyPOSSkeleton,
  UploadingDeskSkeleton,
  ReportingDeskSkeleton,
  SettingsDeskSkeleton,
  NhcPatientHistoryDeskSkeleton,
  QueryHandlerDeskSkeleton,
  GenericModuleSkeleton
} from './components/ModuleSkeletons';
import { ClinicSettings, SmsSettings, MongoDbSettings } from './types';
import { subscribeToUserSync, haveUserPermissionsChanged, broadcastUserSync, dispatchSafeCustomEvent } from './utils/userSync';
import { ShieldAlert, BellRing } from 'lucide-react';

const MENU_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, restricted: true },
  { id: 'patient_visit', label: 'Patient Visit', icon: Stethoscope, restricted: false },
  { id: 'erp_system', label: 'Mini ERP System', icon: Building2, restricted: false },
  { id: 'nhc_history', label: 'Patient Record', icon: DatabaseBackup, restricted: false },
  { id: 'patients', label: 'Patients', icon: Users, restricted: true },
  { id: 'pharmacy', label: 'Store & Dispensary', icon: ShoppingCart, restricted: true },
  { id: 'uploads', label: 'Uploading', icon: UploadCloud, restricted: true },
  { id: 'reports', label: 'Financials', icon: BarChart3, restricted: true },
  { id: 'query_handler', label: 'Query Handler Console', icon: Code, restricted: true },
  { id: 'settings', label: 'Clinic Setup & Users', icon: Settings, restricted: true }
];

// Lazy-loaded Major Modules for React Suspense
const Dashboard = lazy(() => import('./components/Dashboard'));
const ErpDesk = lazy(() => import('./components/ErpDesk'));
const PatientDesk = lazy(() => import('./components/PatientDesk'));
const PharmacyPOS = lazy(() => import('./components/PharmacyPOS'));
const UploadingDesk = lazy(() => import('./components/UploadingDesk'));
const SettingsDesk = lazy(() => import('./components/SettingsDesk'));
const ReportingDesk = lazy(() => import('./components/ReportingDesk'));
const NhcPatientHistoryDesk = lazy(() => import('./components/NhcPatientHistoryDesk'));
const QueryHandlerDesk = lazy(() => import('./components/QueryHandlerDesk'));

// Safe helper to load local state from localStorage fallback
function getStoredState<T>(key: string, defaultVal: T): T {
  try {
    const cached = localStorage.getItem(key);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed)) {
        return parsed as T;
      }
      if (parsed && typeof parsed === 'object') return parsed;
    }
  } catch (e) {}
  return defaultVal;
}

// Safe helper to write to localStorage without crashing React when quota is exceeded
function safeSetLocalStorage(key: string, value: any): void {
  try {
    localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
  } catch (e) {
    console.warn(`[LocalStorage Quota Warning] Could not persist "${key}" to browser storage. Data remains safely available in memory and synced to database.`, e);
  }
}

export default function App() {
  // Users List State (backed up by local storage)
  const [usersList, setUsersList] = useState<User[]>(INITIAL_USERS);

  // Current Active Applet Session State
  const [currentUser, setCurrentUser] = useState<User>(() => {
    const cachedUser = sessionStorage.getItem('cms_current_user');
    if (cachedUser) {
      try {
        const parsed = JSON.parse(cachedUser);
        if (parsed.UserID === 'USR-04' && parsed.FullName === 'Sana Fatima (R.Ph)') {
          parsed.FullName = 'Store User';
        }
        return parsed;
      } catch (e) {}
    }
    return INITIAL_USERS[0]; // Default: Admin
  });

  // Authentication validation state (Session-based: strictly requires login on every new session / browser restart)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      localStorage.removeItem('cms_is_authenticated');
      localStorage.removeItem('cms_current_user');
    } catch (e) {}
    return sessionStorage.getItem('cms_is_authenticated') === 'true';
  });

  // MongoDB Connection settings
  const [mongoDbSettings, setMongoDbSettings] = useState<MongoDbSettings>(() => {
    const cached = localStorage.getItem('cms_mongodb_settings');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (parsed.BridgeUrl === 'http://localhost:5000' || !parsed.BridgeUrl) {
          parsed.BridgeUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5000';
        }
        return parsed;
      } catch (e) {}
    }
    return {
      ConnectionString: 'mongodb://localhost:27017/PharmacyPOSDB',
      DatabaseName: 'PharmacyPOSDB',
      SyncEnabled: true,
      BridgeUrl: typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5000'
    };
  });

  // User Access Notification Banner State (shown when Admin updates permissions from any session)
  const [userAccessToast, setUserAccessToast] = useState<{ message: string; timestamp: number } | null>(null);

  // Session Revocation Alert (shown on login screen if Admin deactivated or removed the user's account)
  const [sessionRevokedAlert, setSessionRevokedAlert] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      sessionStorage.setItem('cms_current_user', JSON.stringify(currentUser));
    }
  }, [currentUser, isAuthenticated]);

  // Auto-dismiss user access toast after 5 seconds
  useEffect(() => {
    if (userAccessToast) {
      const timer = setTimeout(() => {
        setUserAccessToast(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [userAccessToast]);

  // Real-time synchronization function for users and access permissions across all browsers & tabs
  const syncUsersAndPermissions = async () => {
    // 1. If user is offline, gracefully return without disrupting the application or triggering alerts
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return;
    }

    const bridgeUrl = mongoDbSettings.BridgeUrl || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5000');
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);
      const res = await fetch(`${bridgeUrl}/api/users?_t=${Date.now()}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' },
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          // Update usersList in memory if anything changed
          setUsersList(prev => {
            if (JSON.stringify(prev) !== JSON.stringify(data)) {
              return data;
            }
            return prev;
          });

          // If session is active, verify active user's status & permissions
          if (isAuthenticated && currentUser) {
            const freshSelf = data.find(
              (u: User) => u.UserID === currentUser.UserID || (u.LoginName && u.LoginName.toLowerCase() === currentUser.LoginName.toLowerCase())
            );

            // Case 1: User account was deleted or deactivated by Admin -> immediately revoke active session!
            if (!freshSelf || freshSelf.Status === 'Inactive') {
              sessionStorage.removeItem('cms_current_user');
              sessionStorage.removeItem('cms_is_authenticated');
              setIsAuthenticated(false);
              setSessionRevokedAlert(
                `Your account profile (${currentUser.FullName || currentUser.LoginName}) has been deactivated or removed by the Administrator. Active session terminated.`
              );
              return;
            }

            // Case 2: Permissions, UserRights, Role, FullName, Shift, or Password changed by Admin
            if (haveUserPermissionsChanged(currentUser, freshSelf)) {
              setCurrentUser(freshSelf);
              sessionStorage.setItem('cms_current_user', JSON.stringify(freshSelf));
              // Only notify if permission changes were not initiated by the current active user themselves
              if (freshSelf.AccessApprovedBy !== currentUser.FullName && freshSelf.UserID === currentUser.UserID) {
                setUserAccessToast({
                  message: `User Access & Permissions updated by Administrator for "${freshSelf.FullName || freshSelf.LoginName}"!`,
                  timestamp: Date.now()
                });
              }
              dispatchSafeCustomEvent('phc_local_user_updated', freshSelf);
              dispatchSafeCustomEvent('phc_db_updated');
            }
          }
        }
      }
    } catch (e) {
      // Ignore background network transient and offline errors cleanly
    }
  };

  // Continuous multi-device, multi-browser & multi-tab synchronization listeners
  useEffect(() => {
    // 1. Initial fast sync on component mount / auth change
    syncUsersAndPermissions();

    // 2. High-speed periodic poller (every 3.5 seconds) ensuring cross-browser/cross-device live sync
    const pollerId = setInterval(syncUsersAndPermissions, 3500);

    // 3. Tab-to-tab & storage event subscription (instant 0ms sync within same browser)
    const unsubscribe = subscribeToUserSync(() => {
      syncUsersAndPermissions();
    });

    // 4. Instant sync on focus / window activation
    const handleFocus = () => syncUsersAndPermissions();

    // 5. Instant sync on visibility change (when tab is switched back to foreground)
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        syncUsersAndPermissions();
      }
    };

    // 6. Instant sync on network reconnect
    const handleOnline = () => syncUsersAndPermissions();

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('online', handleOnline);

    return () => {
      clearInterval(pollerId);
      unsubscribe();
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('online', handleOnline);
    };
  }, [currentUser.UserID, currentUser.LoginName, isAuthenticated, mongoDbSettings.BridgeUrl]);

  // Synchronize currentUser if updated in usersList locally
  useEffect(() => {
    const updatedSelf = usersList.find(u => u.UserID === currentUser.UserID);
    if (updatedSelf && JSON.stringify(updatedSelf) !== JSON.stringify(currentUser)) {
      setCurrentUser(updatedSelf);
    }
  }, [usersList, currentUser.UserID]);

  const [activeTab, setActiveTab] = useState<string>(() => {
    try {
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        if (params.get('app') === 'store_medicine' || params.get('module') === 'store_medicine' || params.get('tab') === 'pharmacy') {
          return 'pharmacy';
        }
      }
    } catch (e) {}
    return 'dashboard';
  });
  const [activePatientId, setActivePatientId] = useState<string>('');
  const [activePatientSubTab, setActivePatientSubTab] = useState<string>('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  // Store Medicine Mobile PWA Install Modal State
  const [showPwaInstallModal, setShowPwaInstallModal] = useState<boolean>(false);

  // Dashboard Password Verification Modal State
  const [showDashboardPasswordModal, setShowDashboardPasswordModal] = useState<boolean>(false);

  const handleTabChange = (tabId: string, patientId?: string, subTab?: string) => {
    setIsMobileMenuOpen(false);
    if (patientId !== undefined) {
      setActivePatientId(patientId);
    }
    if (subTab !== undefined) {
      setActivePatientSubTab(subTab);
    }
    if (tabId === 'emr') {
      setActivePatientSubTab('patient_visit');
      setActiveTab('patients');
      return;
    }

    // Intercept Dashboard navigation: Only allowed for Administrator and always requires password verification
    if (tabId === 'dashboard') {
      if (currentUser.Role !== 'Administrator') {
        setUnauthorizedModalState({
          isOpen: true,
          title: 'Dashboard Access Restricted',
          message: 'The Executive Dashboard is strictly confidential and restricted to the Administrator account only.'
        });
        return;
      }
      // Trigger password prompt popup every time user attempts to switch to dashboard
      setShowDashboardPasswordModal(true);
      return;
    }

    if (tabId === activeTab && patientId === undefined && subTab === undefined) return;
    setActiveTab(tabId);
  };

  // User Profile Popover Modal State
  const [showProfileModal, setShowProfileModal] = useState<boolean>(false);

  // App-Wide Native Full Screen State & Listener
  const [isAppFullScreen, setIsAppFullScreen] = useState<boolean>(false);

  useEffect(() => {
    const handleFsChange = () => {
      setIsAppFullScreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const toggleAppFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  // Global Unauthorized Modal State
  const [unauthorizedModalState, setUnauthorizedModalState] = useState<{
    isOpen: boolean;
    title?: string;
    message?: string;
  }>({ isOpen: false });

  const triggerGlobalUnauthorized = (message?: string) => {
    setUnauthorizedModalState({
      isOpen: true,
      title: 'Access Restricted',
      message: message || 'You are not authorized to access.'
    });
  };

  // Clinic setup settings
  const [clinicSettings, setClinicSettings] = useState<ClinicSettings>(() => {
    const cached = localStorage.getItem('cms_clinic_settings');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (parsed && parsed.ClinicName) {
          if (parsed.DoctorSignatureText && parsed.DoctorSignatureText.includes('Dr. Ejaz Ahmad, D.H.M.S (Pak) •')) {
            parsed.DoctorSignatureText = parsed.DoctorSignatureText.replace('Dr. Ejaz Ahmad, D.H.M.S (Pak) • ', '');
          }
          if (!parsed.Website) {
            parsed.Website = 'https://punjabhomeopathic.pk';
          }
          if (!parsed.PhoneMobile || parsed.PhoneMobile === '+92-300-4208323' || parsed.PhoneMobile === '0300-1234567') {
            parsed.PhoneMobile = '+92-311-4000608';
          }
          if (!parsed.ClinicAddress || parsed.ClinicAddress === '10 Shalimar Road, Garhi Shahu, Lahore') {
            parsed.ClinicAddress = '10 Shalimar Road, Garhi Shahu, Lahore 39 Pakistan';
          }
          if (!parsed.ClinicLogoText || parsed.ClinicLogoText === 'PHC' || parsed.ClinicLogoText === 'Punjab Homeopathic Clinic') {
            parsed.ClinicLogoText = 'HEALING NATURALLY. RESTORING BALANCE.';
          }
          return parsed;
        }
      } catch (e) {}
    }
    return {
      ClinicName: 'Punjab Homeopathic Clinic',
      ClinicLogoText: 'HEALING NATURALLY. RESTORING BALANCE.',
      DoctorName: 'Dr. Ejaz Ahmad, D.H.M.S (Pak)',
      DoctorSignatureText: 'Registered Homeopathic Medical Practitioner No: 48776',
      ClinicAddress: '10 Shalimar Road, Garhi Shahu, Lahore 39 Pakistan',
      PhoneMobile: '+92-311-4000608',
      Website: 'https://punjabhomeopathic.pk',
      OPDFee: 1500,
      ClinicLogoImage: '/nhc_logo.svg'
    };
  });

  useEffect(() => {
    localStorage.setItem('cms_clinic_settings', JSON.stringify(clinicSettings));
  }, [clinicSettings]);

  // SMS Service settings
  const [smsSettings, setSmsSettings] = useState<SmsSettings>({
    Provider: 'twilio',
    Enabled: true,
    ApiUrl: 'https://api.twilio.com/2010-04-01/Accounts/AC72680cf793/Messages.json',
    ApiKey: 'SG.twilio_secret_token_placeholder_key',
    SenderID: 'PUNJAB_CL',
    BookingTemplate: 'Dear {PATIENT}, your OPD Token No. {TOKEN} for {SHIFT} Shift is booked successfully at Punjab Clinic for {DATE}. Ref ID: {APPID}.',
    RepeatTemplate: 'Dear {PATIENT}, your Follow-up OPD Token No. {TOKEN} ({SHIFT} Shift) is booked at Punjab Clinic for {DATE}. Ref ID: {APPID}.'
  });

  // Master Database States (backed by both MongoDB/API and localStorage persistent fallbacks)
  const [cities, setCities] = useState<City[]>(() => getStoredState('cms_cities', INITIAL_CITIES));
  const [patients, setPatients] = useState<Patient[]>(() => getStoredState('cms_patients', INITIAL_PATIENTS));
  const [appointments, setAppointments] = useState<Appointment[]>(() => getStoredState('cms_appointments', INITIAL_APPOINTMENTS));
  const [tokens, setTokens] = useState<Token[]>(() => getStoredState('cms_tokens', INITIAL_TOKENS));
  const [items, setItems] = useState<Item[]>(() => getStoredState('cms_items', INITIAL_ITEMS));
  const [suppliers, setSuppliers] = useState<Supplier[]>(() => getStoredState('cms_suppliers', INITIAL_SUPPLIERS));
  const [labTests, setLabTests] = useState<LabTest[]>(() => getStoredState('cms_lab_tests', INITIAL_LAB_TESTS));
  const [visits, setVisits] = useState<Visit[]>(() => getStoredState('cms_visits', []));
  const [visitMedicines, setVisitMedicines] = useState<VisitMedicine[]>(() => getStoredState('cms_visit_medicines', []));
  const [medicalCertificates, setMedicalCertificates] = useState<MedicalCertificate[]>(() => getStoredState('cms_med_certs', []));
  const [sbpCertificates, setSbpCertificates] = useState<MedicalCertificateSBP[]>(() => getStoredState('cms_sbp_certs', []));
  const [nhcPatients, setNhcPatients] = useState<NhcPatientHistory[]>(() => getStoredState('cms_nhc_patients', []));
  const [smartLocatorMedicines, setSmartLocatorMedicines] = useState<SmartLocatorMedicine[]>(() => {
    const cached = localStorage.getItem('cms_smart_locator_medicines');
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) {}
    }
    return [
      { Symptoms: 'fever, headache, body ache, high temperature, pain', MedicineName: 'Paracetamol', Dosage: '1-0-1', Composition: 'Paracetamol 500mg' },
      { Symptoms: 'throat infection, cough, dry cough, sore throat, bronchitis', MedicineName: 'Acefyl Cough Syrup', Dosage: '1-1-1', Composition: 'Acefylline Piperazine' },
      { Symptoms: 'heartburn, acidity, GERD, gastric, stomach pain, reflux', MedicineName: 'Omeprazole', Dosage: '1-0-0', Composition: 'Omeprazole 20mg' },
      { Symptoms: 'allergic rhinitis, sneezing, runny nose, allergy, itching', MedicineName: 'Loratadine', Dosage: '0-0-1', Composition: 'Loratadine 10mg' },
      { Symptoms: 'bacterial infection, fever, throat infection, tonsillitis', MedicineName: 'Co-Amoxiclav', Dosage: '1-0-1', Composition: 'Amoxicillin + Clavulanic Acid' }
    ];
  });

  const [invoices, setInvoices] = useState<InvoiceHeader[]>(() => getStoredState('cms_invoices', []));
  const [invoiceDetails, setInvoiceDetails] = useState<InvoiceDetail[]>(() => getStoredState('cms_invoice_details', []));
  const [salesReturns, setSalesReturns] = useState<SRInvHeader[]>(() => getStoredState('cms_sales_returns', []));
  const [grns, setGrns] = useState<InvVchHeader[]>(() => getStoredState('cms_grns', []));
  const [grnDetails, setGrnDetails] = useState<InvVchDetail[]>(() => getStoredState('cms_grn_details', []));
  const [invLedger, setInvLedger] = useState<InvLedger[]>(() => getStoredState('cms_inv_ledger', []));
  const [tlAccounts, setTlAccounts] = useState<TLAccount[]>(() => getStoredState('cms_tl_accounts', INITIAL_TL_ACCOUNTS));
  const [flAccounts, setFlAccounts] = useState<FLAccount[]>(() => getStoredState('cms_fl_accounts', INITIAL_FL_ACCOUNTS));
  const [slAccounts, setSlAccounts] = useState<SLAccount[]>(() => getStoredState('cms_sl_accounts', INITIAL_SL_ACCOUNTS));
  const [vouchers, setVouchers] = useState<VchHeader[]>(() => getStoredState('cms_vouchers', []));
  const [voucherDetails, setVoucherDetails] = useState<VchDetail[]>(() => getStoredState('cms_voucher_details', []));
  const [acLedger, setAcLedger] = useState<ACLedger[]>(() => getStoredState('cms_ac_ledger', []));

  // Automatic Persistent LocalStorage Backups
  useEffect(() => { safeSetLocalStorage('cms_cities', cities); }, [cities]);
  useEffect(() => { safeSetLocalStorage('cms_patients', patients); }, [patients]);
  useEffect(() => { safeSetLocalStorage('cms_appointments', appointments); }, [appointments]);
  useEffect(() => { safeSetLocalStorage('cms_tokens', tokens); }, [tokens]);
  useEffect(() => { safeSetLocalStorage('cms_items', items); }, [items]);
  useEffect(() => { safeSetLocalStorage('cms_suppliers', suppliers); }, [suppliers]);
  useEffect(() => { safeSetLocalStorage('cms_lab_tests', labTests); }, [labTests]);
  useEffect(() => { safeSetLocalStorage('cms_visits', visits); }, [visits]);
  useEffect(() => { safeSetLocalStorage('cms_visit_medicines', visitMedicines); }, [visitMedicines]);
  useEffect(() => { safeSetLocalStorage('cms_med_certs', medicalCertificates); }, [medicalCertificates]);
  useEffect(() => { safeSetLocalStorage('cms_sbp_certs', sbpCertificates); }, [sbpCertificates]);
  useEffect(() => { safeSetLocalStorage('cms_nhc_patients', nhcPatients); }, [nhcPatients]);
  useEffect(() => { safeSetLocalStorage('cms_smart_locator_medicines', smartLocatorMedicines); }, [smartLocatorMedicines]);
  useEffect(() => { safeSetLocalStorage('cms_invoices', invoices); }, [invoices]);
  useEffect(() => { safeSetLocalStorage('cms_invoice_details', invoiceDetails); }, [invoiceDetails]);
  useEffect(() => { safeSetLocalStorage('cms_sales_returns', salesReturns); }, [salesReturns]);
  useEffect(() => { safeSetLocalStorage('cms_grns', grns); }, [grns]);
  useEffect(() => { safeSetLocalStorage('cms_grn_details', grnDetails); }, [grnDetails]);
  useEffect(() => { safeSetLocalStorage('cms_vouchers', vouchers); }, [vouchers]);
  useEffect(() => { safeSetLocalStorage('cms_voucher_details', voucherDetails); }, [voucherDetails]);
  useEffect(() => { safeSetLocalStorage('cms_ac_ledger', acLedger); }, [acLedger]);

  // Synchronize appointments and tokens reliably without removing valid patient IDs
  useEffect(() => {
    // Keep local cache in sync
  }, []);

  useEffect(() => {
    // Auto-sync general ledger postings to MongoDB
    if (mongoDbSettings.SyncEnabled && acLedger.length > 0) {
      const bridgeUrl = mongoDbSettings.BridgeUrl || 'http://localhost:5000';
      const timer = setTimeout(() => {
        fetch(`${bridgeUrl}/api/acledger`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(acLedger)
        })
          .then(res => res.json())
          .then(data => {
            console.log('General ledger postings synced to MongoDB:', data);
          })
          .catch(e => console.warn('Could not sync acLedger postings with MongoDB:', e.message));
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [acLedger, mongoDbSettings.SyncEnabled, mongoDbSettings.BridgeUrl]);

  // Refresh All state
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [refreshMessage, setRefreshMessage] = useState<string>('');

  // Function to refresh all app data and sync from backend/MongoDB
  const refreshAllData = async () => {
    setIsRefreshing(true);
    setRefreshMessage('');
    const bridgeUrl = mongoDbSettings.BridgeUrl || 'http://localhost:5000';

    try {
      const tasks = [
        fetch(`${bridgeUrl}/api/users`).then(r => r.ok ? r.json() : null).then(data => Array.isArray(data) && setUsersList(data)).catch(() => {}),
        fetch(`${bridgeUrl}/api/cities`).then(r => r.ok ? r.json() : null).then(data => Array.isArray(data) && data.length > 0 && setCities(data)).catch(() => {}),
        fetch(`${bridgeUrl}/api/settings/clinic`).then(r => r.ok ? r.json() : null).then(data => data && data.ClinicName && setClinicSettings(data)).catch(() => {}),
        fetch(`${bridgeUrl}/api/settings/sms`).then(r => r.ok ? r.json() : null).then(data => data && data.ApiUrl && setSmsSettings(data)).catch(() => {}),
        fetch(`${bridgeUrl}/api/patients`).then(r => r.ok ? r.json() : null).then(data => Array.isArray(data) && setPatients(data)).catch(() => {}),
        fetch(`${bridgeUrl}/api/items`).then(r => r.ok ? r.json() : null).then(data => Array.isArray(data) && setItems(data)).catch(() => {}),
        fetch(`${bridgeUrl}/api/lab-tests`).then(r => r.ok ? r.json() : null).then(data => Array.isArray(data) && setLabTests(data)).catch(() => {}),
        fetch(`${bridgeUrl}/api/smart-locator`).then(r => r.ok ? r.json() : null).then(data => Array.isArray(data) && setSmartLocatorMedicines(data)).catch(() => {}),
        fetch(`${bridgeUrl}/api/appointments`).then(r => r.ok ? r.json() : null).then(data => {
          if (Array.isArray(data)) {
            setAppointments(data);
          }
        }).catch(() => {}),
        fetch(`${bridgeUrl}/api/tokens`).then(r => r.ok ? r.json() : null).then(data => {
          if (Array.isArray(data)) {
            setTokens(data);
          }
        }).catch(() => {}),
        fetch(`${bridgeUrl}/api/visits`).then(r => r.ok ? r.json() : null).then(data => Array.isArray(data) && setVisits(data)).catch(() => {}),
        fetch(`${bridgeUrl}/api/visit-medicines`).then(r => r.ok ? r.json() : null).then(data => Array.isArray(data) && setVisitMedicines(data)).catch(() => {}),
        fetch(`${bridgeUrl}/api/billing/invoices`).then(r => r.ok ? r.json() : null).then(data => {
          if (data && Array.isArray(data.headers)) setInvoices(data.headers);
          if (data && Array.isArray(data.details)) setInvoiceDetails(data.details);
        }).catch(() => {}),
        fetch(`${bridgeUrl}/api/certificates`).then(r => r.ok ? r.json() : null).then(data => Array.isArray(data) && setMedicalCertificates(data)).catch(() => {}),
        fetch(`${bridgeUrl}/api/sbp-certificates`).then(r => r.ok ? r.json() : null).then(data => Array.isArray(data) && setSbpCertificates(data)).catch(() => {}),
        fetch(`${bridgeUrl}/api/billing/returns`).then(r => r.ok ? r.json() : null).then(data => Array.isArray(data) && setSalesReturns(data)).catch(() => {}),
        fetch(`${bridgeUrl}/api/grns`).then(r => r.ok ? r.json() : null).then(data => {
          if (data && Array.isArray(data.headers)) setGrns(data.headers);
          if (data && Array.isArray(data.details)) setGrnDetails(data.details);
        }).catch(() => {}),
        fetch(`${bridgeUrl}/api/suppliers`).then(r => r.ok ? r.json() : null).then(data => Array.isArray(data) && setSuppliers(data)).catch(() => {}),
        fetch(`${bridgeUrl}/api/accounts/fl`).then(r => r.ok ? r.json() : null).then(data => Array.isArray(data) && setFlAccounts(data)).catch(() => {}),
        fetch(`${bridgeUrl}/api/accounts/sl`).then(r => r.ok ? r.json() : null).then(data => Array.isArray(data) && setSlAccounts(data)).catch(() => {}),
        fetch(`${bridgeUrl}/api/accounts`).then(r => r.ok ? r.json() : null).then(data => Array.isArray(data) && setTlAccounts(data)).catch(() => {}),
        fetch(`${bridgeUrl}/api/vouchers`).then(r => r.ok ? r.json() : null).then(data => {
          if (data && Array.isArray(data.headers)) setVouchers(data.headers);
          if (data && Array.isArray(data.details)) setVoucherDetails(data.details);
        }).catch(() => {}),
        fetch(`${bridgeUrl}/api/acledger`).then(r => r.ok ? r.json() : null).then(data => Array.isArray(data) && setAcLedger(data)).catch(() => {})
      ];

      await Promise.allSettled(tasks);
      setRefreshMessage('All app records & database data updated to latest!');
    } catch (e) {
      setRefreshMessage('App data refreshed.');
    } finally {
      setIsRefreshing(false);
      setTimeout(() => setRefreshMessage(''), 4000);
    }
  };

  // Synchronize master states with MongoDB on startup or when bridge connection changes
  useEffect(() => {
    if (!mongoDbSettings.SyncEnabled) return;
    refreshAllData();
  }, [mongoDbSettings.BridgeUrl, mongoDbSettings.SyncEnabled]);

  // Global listener for DB mutations/deletions across components
  useEffect(() => {
    const handleDbUpdate = () => {
      refreshAllData();
    };
    window.addEventListener('phc_db_updated', handleDbUpdate);
    return () => window.removeEventListener('phc_db_updated', handleDbUpdate);
  }, []);

  // Active User Rights Matrix helper
  const currentUserRights = currentUser.UserRights || ROLE_RIGHTS[currentUser.Role] || ROLE_RIGHTS['Administrator'];

  // Check if a tab is accessible based on custom permissions and rights
  const isAccessible = (menuId: string) => {
    // Dashboard is STRICTLY restricted to Administrator only
    if (menuId === 'dashboard') {
      return currentUser.Role === 'Administrator';
    }

    // Administrator has universal access to all clinic management, query handler, audit and setup desks by default
    if (currentUser.Role === 'Administrator') {
      if (menuId === 'query_handler' || menuId === 'queryhandler' || menuId === 'queries') {
        return currentUser.Permissions?.canViewQueryHandlerDesk !== false;
      }
      if (menuId === 'settings') return currentUser.Permissions?.canViewSettingsDesk !== false;
      if (menuId === 'uploads') return currentUser.Permissions?.canViewUploadingDesk !== false;
      if (menuId === 'reports') return currentUser.Permissions?.canViewReportingDesk !== false;
      if (menuId === 'erp_system') return currentUser.Permissions?.canViewErpDesk !== false;
      if (menuId === 'nhc_history' || menuId === 'nhchistory') return currentUser.Permissions?.canViewNhcHistoryDesk !== false;
      if (menuId === 'pharmacy') return currentUser.Permissions?.canViewPharmacyPOS !== false;
      if (menuId === 'patients') return currentUser.Permissions?.canViewPatientDesk !== false;
      if (menuId === 'accounts') return currentUser.Permissions?.canViewAccountingDesk !== false;
      if (menuId === 'patient_visit') return true;
      return true;
    }

    // 1. Check custom permissions object if configured on user
    if (currentUser.Permissions) {
      if (menuId === 'patients') return !!currentUser.Permissions.canViewPatientDesk;
      if (menuId === 'patient_visit') {
        if (currentUser.Permissions.canAccessPatientVisitDesk !== undefined) {
          return !!currentUser.Permissions.canAccessPatientVisitDesk;
        }
        return !!currentUser.Permissions.canViewPatientDesk || !!currentUser.Permissions.canViewEMRDesk || currentUser.Role === 'Doctor';
      }
      if (menuId === 'emr') return !!currentUser.Permissions.canViewEMRDesk;
      if (menuId === 'erp_system') return currentUser.Permissions.canViewErpDesk !== false && (currentUser.Role === 'Accountant' || !!currentUser.Permissions.canViewErpDesk);
      if (menuId === 'pharmacy') return !!currentUser.Permissions.canViewPharmacyPOS;
      if (menuId === 'accounts') return !!currentUser.Permissions.canViewAccountingDesk;
      if (menuId === 'reports') return !!currentUser.Permissions.canViewReportingDesk;
      if (menuId === 'uploads') return !!currentUser.Permissions.canViewUploadingDesk;
      if (menuId === 'settings') return !!currentUser.Permissions.canViewSettingsDesk;
      if (menuId === 'query_handler' || menuId === 'queryhandler' || menuId === 'queries') return !!currentUser.Permissions.canViewQueryHandlerDesk;
      if (menuId === 'nhc_history' || menuId === 'nhchistory') return !!currentUser.Permissions.canViewNhcHistoryDesk;
    }

    if (menuId === 'erp_system') return currentUser.Role === 'Accountant';
    if (menuId === 'patient_visit') return true;
    if (menuId === 'settings') return false;
    if (menuId === 'uploads') return false;
    if (menuId === 'reports') return currentUser.Role === 'Accountant';
    if (menuId === 'query_handler' || menuId === 'queryhandler' || menuId === 'queries') return false;

    const right = currentUserRights.find((r) => r.MenuID === menuId || (menuId === 'query_handler' && (r.MenuID === 'queries' || r.MenuID === 'query_handler')));
    return right ? right.Status : false;
  };

  // Auto-switch active tab if non-admin is currently on an inaccessible tab (or permissions changed in another session)
  useEffect(() => {
    if (!isAccessible(activeTab)) {
      const allModules = ['patients', 'pharmacy', 'reports', 'erp_system', 'patient_visit', 'nhc_history', 'accounts', 'emr', 'settings', 'uploads', 'query_handler'];
      const firstAllowed = allModules.find(tabId => isAccessible(tabId)) || 'patient_visit';
      setActiveTab(firstAllowed);
    }
  }, [currentUser, activeTab]);

  // User-to-User Access Control Helper
  const canUserAccessTargetUser = (targetUserOrId: User | string): boolean => {
    if (currentUser.Role === 'Administrator') return true;
    const targetId = typeof targetUserOrId === 'string' ? targetUserOrId : targetUserOrId.UserID;
    const targetLogin = typeof targetUserOrId === 'string' ? targetUserOrId : targetUserOrId.LoginName;

    if (currentUser.UserID === targetId) return true;
    const allowed = currentUser.AllowedUserIDs || ['ALL'];
    if (allowed.includes('ALL') || allowed.includes('*')) return true;
    return allowed.includes(targetId) || (!!targetLogin && allowed.includes(targetLogin));
  };

  // -------------------------------------------------------------
  // CORE DB MUTATORS & AUTOMATED DOUBLE-ENTRY ENGINES
  // -------------------------------------------------------------

  // City Management Master Mutators
  const handleAddCity = async (newCity: City) => {
    const bridgeUrl = mongoDbSettings.BridgeUrl || 'http://localhost:5000';
    try {
      const res = await fetch(`${bridgeUrl}/api/cities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCity)
      });
      if (res.ok) {
        const data = await res.json();
        const savedCity: City = data.data || newCity;
        setCities(prev => {
          const idx = prev.findIndex(c => c.CityID === savedCity.CityID);
          if (idx >= 0) {
            const copy = [...prev];
            copy[idx] = savedCity;
            return copy;
          }
          return [...prev, savedCity];
        });
        return;
      }
    } catch (e) {
      console.warn('Could not sync city to backend/MongoDB:', e);
    }
    // Local fallback
    setCities(prev => {
      const idx = prev.findIndex(c => c.CityID === newCity.CityID);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = newCity;
        return copy;
      }
      return [...prev, newCity];
    });
  };

  const handleDeleteCity = async (cityId: number) => {
    const bridgeUrl = mongoDbSettings.BridgeUrl || 'http://localhost:5000';
    try {
      await fetch(`${bridgeUrl}/api/cities/${cityId}`, { method: 'DELETE' });
    } catch (e) {
      console.warn('Could not delete city from backend/MongoDB:', e);
    }
    setCities(prev => prev.filter(c => c.CityID !== cityId));
  };

  // Add Patient Intake file
  const handleAddPatient = (newPatient: Patient) => {
    setPatients((prev) => [...prev, newPatient]);
    if (mongoDbSettings.SyncEnabled) {
      const bridgeUrl = mongoDbSettings.BridgeUrl || 'http://localhost:5000';
      fetch(`${bridgeUrl}/api/patients`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPatient)
      }).catch(err => console.error('Failed to synchronize patient to MongoDB:', err.message));
    }
  };

  // Update Patient profile
  const handleUpdatePatient = (updatedPatient: Patient) => {
    setPatients((prev) => prev.map(p => p.PatientID === updatedPatient.PatientID ? updatedPatient : p));
    if (mongoDbSettings.SyncEnabled) {
      const bridgeUrl = mongoDbSettings.BridgeUrl || 'http://localhost:5000';
      fetch(`${bridgeUrl}/api/patients/${updatedPatient.PatientID}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedPatient)
      }).catch(err => console.error('Failed to synchronize updated patient to MongoDB:', err.message));
    }
  };

  // Delete Patient profile
  const handleDeletePatient = (patientId: string) => {
    setPatients((prev) => prev.filter(p => p.PatientID !== patientId));
    if (mongoDbSettings.SyncEnabled) {
      const bridgeUrl = mongoDbSettings.BridgeUrl || 'http://localhost:5000';
      fetch(`${bridgeUrl}/api/patients/${patientId}`, {
        method: 'DELETE'
      }).catch(err => console.error('Failed to delete patient from MongoDB:', err.message));
    }
  };

  // Delete Visit
  const handleDeleteVisit = (visitId: string) => {
    setVisits((prev) => prev.filter(v => v.VisitID !== visitId));
    setVisitMedicines((prev) => prev.filter(m => m.VisitID !== visitId));
    if (mongoDbSettings.SyncEnabled) {
      const bridgeUrl = mongoDbSettings.BridgeUrl || 'http://localhost:5000';
      fetch(`${bridgeUrl}/api/visits/${visitId}`, {
        method: 'DELETE'
      }).catch(err => console.error('Failed to delete visit from MongoDB:', err.message));
    }
  };

  // Book OPD Consultation Appointment
  const handleAddAppointment = (newApp: Appointment) => {
    setAppointments((prev) => [...prev, newApp]);
    if (mongoDbSettings.SyncEnabled) {
      const bridgeUrl = mongoDbSettings.BridgeUrl || 'http://localhost:5000';
      fetch(`${bridgeUrl}/api/appointments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newApp)
      }).catch(err => console.error('Failed to synchronize appointment to MongoDB:', err.message));
    }
  };

  const handleUpdateAppointment = (updatedApp: Appointment) => {
    setAppointments((prev) => prev.map(a => a.AppointmentID === updatedApp.AppointmentID ? updatedApp : a));
    if (mongoDbSettings.SyncEnabled) {
      const bridgeUrl = mongoDbSettings.BridgeUrl || 'http://localhost:5000';
      fetch(`${bridgeUrl}/api/appointments/${updatedApp.AppointmentID}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedApp)
      }).catch(err => console.error('Failed to sync updated appointment to MongoDB:', err.message));
    }
  };

  const handleDeleteAppointment = (appId: string) => {
    setAppointments((prev) => prev.filter(a => a.AppointmentID !== appId));
    if (mongoDbSettings.SyncEnabled) {
      const bridgeUrl = mongoDbSettings.BridgeUrl || 'http://localhost:5000';
      fetch(`${bridgeUrl}/api/appointments/${appId}`, {
        method: 'DELETE'
      }).catch(err => console.error('Failed to delete appointment from MongoDB:', err.message));
    }
  };

  // Queue tokens waiting list
  const handleAddToken = (newToken: Token) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const tokenDate = newToken.Date || todayStr;

    // Conditional check: If selected date is in the future (> today), cancel token process and create future-dated appointment record instead
    if (tokenDate > todayStr) {
      console.warn(`[TOKEN ISSUANCE CANCELLED] Selected date ${tokenDate} is a future date. Token generation cancelled; creating future-dated appointment record instead.`);
      const existingApp = appointments.find(
        a => a.PatientID === newToken.PatientID && a.AppointmentDate === tokenDate
      );
      if (!existingApp) {
        let nextNum = appointments.length + 1;
        let newAppId = `APP-${String(nextNum).padStart(3, '0')}`;
        while (appointments.some((a) => a.AppointmentID === newAppId)) {
          nextNum++;
          newAppId = `APP-${String(nextNum).padStart(3, '0')}`;
        }
        const futureApp: Appointment = {
          AppointmentID: newAppId,
          PatientID: newToken.PatientID,
          AppointmentDate: tokenDate,
          Shift: newToken.Shift,
          FeeCharged: (newToken as any).FeeCharged !== undefined ? Number((newToken as any).FeeCharged) : 0,
          Remarks: 'Future Appointment Booking (Token Process Cancelled)',
          Status: 1
        };
        handleAddAppointment(futureApp);
      }
      return; // Cancel token issuance
    }

    setTokens((prev) => [...prev, newToken]);
    if (mongoDbSettings.SyncEnabled) {
      const bridgeUrl = mongoDbSettings.BridgeUrl || 'http://localhost:5000';
      fetch(`${bridgeUrl}/api/tokens`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newToken)
      }).catch(err => console.error('Failed to synchronize token to MongoDB:', err.message));
    }
  };

  const handleDeleteToken = (tokenNo: number, shift: 1 | 2) => {
    setTokens((prev) => prev.filter(t => !(t.TokenNo === tokenNo && t.Shift === shift)));
    if (mongoDbSettings.SyncEnabled) {
      const bridgeUrl = mongoDbSettings.BridgeUrl || 'http://localhost:5000';
      fetch(`${bridgeUrl}/api/tokens/${tokenNo}/${shift}`, {
        method: 'DELETE'
      }).catch(err => console.error('Failed to delete token from MongoDB:', err.message));
    }
  };

  // Helper: Update third level account live balance algebraically
  const updateAccountBalanceAlgebraically = (tlid: number, debitAmt: number, creditAmt: number, currentAccountsList: TLAccount[]) => {
    return currentAccountsList.map((acc) => {
      if (acc.TLID === tlid) {
        // Assets (Prefix 1) & Expenses (Prefix 5): Debit increases, Credit decreases balance
        // Liabilities (Prefix 2), Equity (Prefix 3), Revenue (Prefix 4): Credit increases, Debit decreases balance
        const firstDigit = Math.floor(tlid / 100000);
        let delta = 0;
        if (firstDigit === 1 || firstDigit === 5) {
          delta = debitAmt - creditAmt;
        } else {
          delta = creditAmt - debitAmt;
        }
        return {
          ...acc,
          AcBalance: acc.AcBalance + delta
        };
      }
      return acc;
    });
  };

  // Helper: Append voucher details into GL General Ledger Log
  const createLedgerPostingLog = (vchNo: string, tlid: number, debit: number, credit: number, remarks: string, currentBalance: number) => {
    const nextLogId = `GL-POST-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    const firstDigit = Math.floor(tlid / 100000);
    let updatedBalance = currentBalance;
    if (firstDigit === 1 || firstDigit === 5) {
      updatedBalance += (debit - credit);
    } else {
      updatedBalance += (credit - debit);
    }

    return {
      ACLedgerID: nextLogId,
      VchNo: vchNo,
      TLID: tlid,
      TxDate: new Date().toISOString().split('T')[0],
      Debit: debit,
      Credit: credit,
      Remarks: remarks,
      BalanceAfter: updatedBalance
    };
  };

  // Update Appointment queue workflows
  const handleUpdateAppointmentStatus = (appId: string, status: 1 | 2 | 3 | 4) => {
    // 1. Find the target appointment to see if its status is changing to 4 and if it's not already 4
    const targetApp = appointments.find(a => a.AppointmentID === appId);
    if (!targetApp) return;

    // Check if we are transitioning to status 4
    const isTransitioningToPaid = status === 4 && targetApp.Status !== 4;

    // 2. Update appointments list
    setAppointments((prevApps) =>
      prevApps.map((app) => (app.AppointmentID === appId ? { ...app, Status: status } : app))
    );

    // Sync status change to MongoDB
    if (mongoDbSettings.SyncEnabled) {
      const bridgeUrl = mongoDbSettings.BridgeUrl || 'http://localhost:5000';
      fetch(`${bridgeUrl}/api/appointments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...targetApp, Status: status })
      }).catch(err => console.error('Failed to sync updated appointment to MongoDB:', err.message));
    }

    // 3. Trigger financial postings outside of the setAppointments updater callback!
    if (isTransitioningToPaid) {
      const opdRate = targetApp.FeeCharged;
      const nextVchNo = `CRV-OPD-${String(vouchers.length + 1).padStart(4, '0')}`;
      const journalDate = new Date().toISOString().split('T')[0];
      const shift = targetApp.Shift || 1;

      // Shift-based Doctor Cash and Revenue Account mapping
      const targetCashTLID = shift === 1 ? 101001 : 101002;
      const targetRevTLID = shift === 1 ? 401101 : 401201;

      // 1. Save voucher header
      const newVchHeader: VchHeader = {
        VchNo: nextVchNo,
        VchDate: journalDate,
        VchType: 'CRV',
        Status: 2, // Posted
        Remarks: `OPD Consultation Fee collected. Patient ID: ${targetApp.PatientID}, Shift: ${shift}`
      };

      // 2. Debit cash and Credit Revenue details
      const detailDebit: VchDetail = {
        VchNo: nextVchNo,
        TLID: targetCashTLID,
        Debit: opdRate,
        Credit: 0,
        Description: `OPD Consultation Ticket cash collected`
      };

      const detailCredit: VchDetail = {
        VchNo: nextVchNo,
        TLID: targetRevTLID,
        Debit: 0,
        Credit: opdRate,
        Description: `OPD Ticket Revenue posted`
      };

      setVouchers((prevVch) => {
        // Double check to make sure nextVchNo is unique to prevent duplicate key issue in edge cases
        let finalVchNo = nextVchNo;
        let suffixNum = 1;
        while (prevVch.some(v => v.VchNo === finalVchNo)) {
          finalVchNo = `${nextVchNo}-${suffixNum++}`;
        }
        newVchHeader.VchNo = finalVchNo;
        detailDebit.VchNo = finalVchNo;
        detailCredit.VchNo = finalVchNo;
        return [...prevVch, newVchHeader];
      });

      setVoucherDetails((prevDet) => [...prevDet, detailDebit, detailCredit]);

      // 3. Update Chart of Accounts balances live
      setTlAccounts((prevAccs) => {
        let updated = updateAccountBalanceAlgebraically(targetCashTLID, opdRate, 0, prevAccs);
        updated = updateAccountBalanceAlgebraically(targetRevTLID, 0, opdRate, updated);
        
        // 4. Record transactions in ACLedger
        const accDebitBal = prevAccs.find(a => a.TLID === targetCashTLID)?.AcBalance || 0;
        const accCreditBal = prevAccs.find(a => a.TLID === targetRevTLID)?.AcBalance || 0;

        // Since newVchHeader.VchNo is updated dynamically, we must use the correct final VchNo
        const finalVchNo = newVchHeader.VchNo;
        const logDebit = createLedgerPostingLog(finalVchNo, targetCashTLID, opdRate, 0, `OPD Ticket Payment Received (Shift ${shift})`, accDebitBal);
        const logCredit = createLedgerPostingLog(finalVchNo, targetRevTLID, 0, opdRate, `OPD Consultation Revenue Mapped (Shift ${shift})`, accCreditBal);

        setAcLedger((prevLogs) => [...prevLogs, logDebit, logCredit]);

        return updated;
      });

      // Synchronize appointment payment voucher & details with MongoDB
      if (mongoDbSettings.SyncEnabled) {
        const bridgeUrl = mongoDbSettings.BridgeUrl || 'http://localhost:5000';
        fetch(`${bridgeUrl}/api/vouchers`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...newVchHeader,
            detailsRows: [detailDebit, detailCredit]
          })
        }).catch(err => console.error('Failed to sync appointment payment voucher to MongoDB:', err.message));
      }
    }
  };

  const handleUpdateTokenStatus = (tokenNo: number, shift: 1 | 2, status: 1 | 2 | 3) => {
    setTokens((prev) =>
      prev.map((t) => (t.TokenNo === tokenNo && t.Shift === shift ? { ...t, Status: status } : t))
    );

    const targetToken = tokens.find(t => t.TokenNo === tokenNo && t.Shift === shift);
    if (targetToken && mongoDbSettings.SyncEnabled) {
      const bridgeUrl = mongoDbSettings.BridgeUrl || 'http://localhost:5000';
      fetch(`${bridgeUrl}/api/tokens`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...targetToken, Status: status })
      }).catch(err => console.error('Failed to sync updated token to MongoDB:', err.message));
    }
  };

  // Helper to trigger all EMR-related financial postings upon posting a consultation visit
  const triggerEMRFinancialPostings = (visit: Visit, shift: number, testIds: string[]) => {
    const targetCashTLID = shift === 1 ? 101001 : 101002;
    const targetRevTLID = shift === 1 ? 401101 : 401201;

    // 1. Process Consultation Fee walk-in payment
    const targetApp = appointments.find(a => a.PatientID === visit.PatientID && a.Status !== 3 && a.Status !== 4);
    const isPaid = visit.ConsultationPaymentOption === 'Paid - Cash' || visit.ConsultationPaymentOption === 'Paid - Online/Card' || visit.ConsultationPaymentOption === 'Paid' || visit.ConsultationPaymentOption === 'Cash Paid' || (visit.ConsultationFee && visit.ConsultationFee > 0);
    
    if (targetApp) {
      if (visit.ConsultationFee !== undefined && visit.ConsultationFee > 0) {
        targetApp.FeeCharged = visit.ConsultationFee;
      }
      handleUpdateAppointmentStatus(targetApp.AppointmentID, isPaid ? 4 : 2);
    } else if (isPaid && visit.ConsultationFee && visit.ConsultationFee > 0) {
      const opdRate = visit.ConsultationFee;
      const nextVchNo = `CRV-OPD-WALK-${String(vouchers.length + 1).padStart(4, '0')}`;
      const journalDate = new Date().toISOString().split('T')[0];

      const newVchHeader: VchHeader = {
        VchNo: nextVchNo,
        VchDate: journalDate,
        VchType: 'CRV',
        Status: 2, // Posted
        Remarks: `OPD Walk-in Consultation Fee collected. Patient ID: ${visit.PatientID}, Shift: ${shift}`
      };

      const detailDebit: VchDetail = {
        VchNo: nextVchNo,
        TLID: targetCashTLID,
        Debit: opdRate,
        Credit: 0,
        Description: `Walk-in Consultation Ticket cash collected`
      };

      const detailCredit: VchDetail = {
        VchNo: nextVchNo,
        TLID: targetRevTLID,
        Debit: 0,
        Credit: opdRate,
        Description: `Walk-in OPD Ticket Revenue posted`
      };

      setVouchers((prevVch) => {
        let finalVchNo = nextVchNo;
        let suffixNum = 1;
        while (prevVch.some(v => v.VchNo === finalVchNo)) {
          finalVchNo = `${nextVchNo}-${suffixNum++}`;
        }
        newVchHeader.VchNo = finalVchNo;
        detailDebit.VchNo = finalVchNo;
        detailCredit.VchNo = finalVchNo;
        return [...prevVch, newVchHeader];
      });

      setVoucherDetails((prevDet) => [...prevDet, detailDebit, detailCredit]);

      setTlAccounts((prevAccs) => {
        let updated = updateAccountBalanceAlgebraically(targetCashTLID, opdRate, 0, prevAccs);
        updated = updateAccountBalanceAlgebraically(targetRevTLID, 0, opdRate, updated);

        const accDebitBal = prevAccs.find(a => a.TLID === targetCashTLID)?.AcBalance || 0;
        const accCreditBal = prevAccs.find(a => a.TLID === targetRevTLID)?.AcBalance || 0;

        const finalVchNo = newVchHeader.VchNo;
        const logDebit = createLedgerPostingLog(finalVchNo, targetCashTLID, opdRate, 0, `OPD Walk-in Ticket Paid (Shift ${shift})`, accDebitBal);
        const logCredit = createLedgerPostingLog(finalVchNo, targetRevTLID, 0, opdRate, `OPD Walk-in Consultation Revenue (Shift ${shift})`, accCreditBal);

        setAcLedger((prevLogs) => [...prevLogs, logDebit, logCredit]);

        return updated;
      });

      if (mongoDbSettings.SyncEnabled) {
        const bridgeUrl = mongoDbSettings.BridgeUrl || 'http://localhost:5000';
        fetch(`${bridgeUrl}/api/vouchers`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...newVchHeader,
            detailsRows: [detailDebit, detailCredit]
          })
        }).catch(err => console.error('Failed to sync walk-in ticket voucher to MongoDB:', err.message));
      }
    }

    // 2. Process Clinical Medicine manual payment (Clinical Compounding fee)
    const clinicalPayAmt = Number(visit.ClinicalMedicinePayment) || 0;
    if (clinicalPayAmt > 0) {
      const nextVchNo = `CRV-EMR-CLIN-${String(vouchers.length + 1).padStart(4, '0')}`;
      const journalDate = new Date().toISOString().split('T')[0];
      const clinicalTLID = shift === 1 ? 401102 : 401202; // Morning vs Evening Clinical Medicine Revenue

      const newVchHeader: VchHeader = {
        VchNo: nextVchNo,
        VchDate: journalDate,
        VchType: 'CRV',
        Status: 2, // Posted
        Remarks: `EMR Clinical Medicine manual compounding fee collected. Patient ID: ${visit.PatientID}, Shift: ${shift}`
      };

      const detailDebit: VchDetail = {
        VchNo: nextVchNo,
        TLID: targetCashTLID,
        Debit: clinicalPayAmt,
        Credit: 0,
        Description: `Clinical compounding medicine payment cash collected (Shift ${shift})`
      };

      const detailCredit: VchDetail = {
        VchNo: nextVchNo,
        TLID: clinicalTLID,
        Debit: 0,
        Credit: clinicalPayAmt,
        Description: `Clinical compounding medicine revenue mapped`
      };

      setVouchers((prevVch) => {
        let finalVchNo = nextVchNo;
        let suffixNum = 1;
        while (prevVch.some(v => v.VchNo === finalVchNo)) {
          finalVchNo = `${nextVchNo}-${suffixNum++}`;
        }
        newVchHeader.VchNo = finalVchNo;
        detailDebit.VchNo = finalVchNo;
        detailCredit.VchNo = finalVchNo;
        return [...prevVch, newVchHeader];
      });

      setVoucherDetails((prevDet) => [...prevDet, detailDebit, detailCredit]);

      setTlAccounts((prevAccs) => {
        let updated = updateAccountBalanceAlgebraically(targetCashTLID, clinicalPayAmt, 0, prevAccs);
        updated = updateAccountBalanceAlgebraically(clinicalTLID, 0, clinicalPayAmt, updated);

        const accDebitBal = prevAccs.find(a => a.TLID === targetCashTLID)?.AcBalance || 0;
        const accCreditBal = prevAccs.find(a => a.TLID === clinicalTLID)?.AcBalance || 0;

        const finalVchNo = newVchHeader.VchNo;
        const logDebit = createLedgerPostingLog(finalVchNo, targetCashTLID, clinicalPayAmt, 0, `Clinical Compounding Medicine Paid (Shift ${shift})`, accDebitBal);
        const logCredit = createLedgerPostingLog(finalVchNo, clinicalTLID, 0, clinicalPayAmt, `Clinical Compounding Revenue Credit (Shift ${shift})`, accCreditBal);

        setAcLedger((prevLogs) => [...prevLogs, logDebit, logCredit]);

        return updated;
      });

      if (mongoDbSettings.SyncEnabled) {
        const bridgeUrl = mongoDbSettings.BridgeUrl || 'http://localhost:5000';
        fetch(`${bridgeUrl}/api/vouchers`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...newVchHeader,
            detailsRows: [detailDebit, detailCredit]
          })
        }).catch(err => console.error('Failed to sync clinical compounding voucher to MongoDB:', err.message));
      }
    }

    // 2.5 Process File Fee & Card Fee payment
    const fileFeeAmt = Number(visit.FileFee) || 0;
    const cardFeeAmt = Number(visit.CardFee) || 0;
    const fileCardTotal = fileFeeAmt + cardFeeAmt;

    if (fileCardTotal > 0) {
      const nextVchNo = `CRV-EMR-CARD-${String(vouchers.length + 1).padStart(4, '0')}`;
      const journalDate = new Date().toISOString().split('T')[0];
      const fileCardTLID = shift === 1 ? 401105 : 401205; // Morning vs Evening File & Card Fee Revenue

      const newVchHeader: VchHeader = {
        VchNo: nextVchNo,
        VchDate: journalDate,
        VchType: 'CRV',
        Status: 2, // Posted
        Remarks: `EMR File & Patient Card fee collected. Patient ID: ${visit.PatientID}, Shift: ${shift}`
      };

      const detailDebit: VchDetail = {
        VchNo: nextVchNo,
        TLID: targetCashTLID,
        Debit: fileCardTotal,
        Credit: 0,
        Description: `File & Card fee cash collected (Shift ${shift})`
      };

      const detailCredit: VchDetail = {
        VchNo: nextVchNo,
        TLID: fileCardTLID,
        Debit: 0,
        Credit: fileCardTotal,
        Description: `File & Card fee revenue mapped (File PKR ${fileFeeAmt}, Card PKR ${cardFeeAmt})`
      };

      setVouchers((prevVch) => {
        let finalVchNo = nextVchNo;
        let suffixNum = 1;
        while (prevVch.some(v => v.VchNo === finalVchNo)) {
          finalVchNo = `${nextVchNo}-${suffixNum++}`;
        }
        newVchHeader.VchNo = finalVchNo;
        detailDebit.VchNo = finalVchNo;
        detailCredit.VchNo = finalVchNo;
        return [...prevVch, newVchHeader];
      });

      setVoucherDetails((prevDet) => [...prevDet, detailDebit, detailCredit]);

      setTlAccounts((prevAccs) => {
        let updated = updateAccountBalanceAlgebraically(targetCashTLID, fileCardTotal, 0, prevAccs);
        updated = updateAccountBalanceAlgebraically(fileCardTLID, 0, fileCardTotal, updated);

        const accDebitBal = prevAccs.find(a => a.TLID === targetCashTLID)?.AcBalance || 0;
        const accCreditBal = prevAccs.find(a => a.TLID === fileCardTLID)?.AcBalance || 0;

        const finalVchNo = newVchHeader.VchNo;
        const logDebit = createLedgerPostingLog(finalVchNo, targetCashTLID, fileCardTotal, 0, `File & Card Fee Paid (Shift ${shift})`, accDebitBal);
        const logCredit = createLedgerPostingLog(finalVchNo, fileCardTLID, 0, fileCardTotal, `File & Card Revenue Credit (Shift ${shift})`, accCreditBal);

        setAcLedger((prevLogs) => [...prevLogs, logDebit, logCredit]);

        return updated;
      });

      if (mongoDbSettings.SyncEnabled) {
        const bridgeUrl = mongoDbSettings.BridgeUrl || 'http://localhost:5000';
        fetch(`${bridgeUrl}/api/vouchers`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...newVchHeader,
            detailsRows: [detailDebit, detailCredit]
          })
        }).catch(err => console.error('Failed to sync file & card voucher to MongoDB:', err.message));
      }
    }

    // 3. Process Lab diagnostics billing
    if (testIds && testIds.length > 0) {
      const labCostSum = testIds.reduce((sum, tid) => {
        const test = labTests.find((t) => t.TID === tid);
        return sum + (test ? test.Cost : 0);
      }, 0);

      const nextVchNo = `CRV-LAB-${String(vouchers.length + 1).padStart(4, '0')}`;
      const journalDate = new Date().toISOString().split('T')[0];

      const newVchHeader: VchHeader = {
        VchNo: nextVchNo,
        VchDate: journalDate,
        VchType: 'CRV',
        Status: 2, // Posted
        Remarks: `Advised Lab test billing. Visit ID: ${visit.VisitID}, Shift: ${shift}`
      };

      const detailDebit: VchDetail = {
        VchNo: nextVchNo,
        TLID: targetCashTLID,
        Debit: labCostSum,
        Credit: 0,
        Description: `Lab tests fees collection`
      };

      const detailCredit: VchDetail = {
        VchNo: nextVchNo,
        TLID: 401002, // Lab & Diagnostics Revenue
        Debit: 0,
        Credit: labCostSum,
        Description: `Diagnostics test revenue mapped`
      };

      setVouchers((prevVch) => {
        let finalVchNo = nextVchNo;
        let suffixNum = 1;
        while (prevVch.some(v => v.VchNo === finalVchNo)) {
          finalVchNo = `${nextVchNo}-${suffixNum++}`;
        }
        newVchHeader.VchNo = finalVchNo;
        detailDebit.VchNo = finalVchNo;
        detailCredit.VchNo = finalVchNo;
        return [...prevVch, newVchHeader];
      });

      setVoucherDetails((prevDet) => [...prevDet, detailDebit, detailCredit]);

      setTlAccounts((prevAccs) => {
        let updated = updateAccountBalanceAlgebraically(targetCashTLID, labCostSum, 0, prevAccs);
        updated = updateAccountBalanceAlgebraically(401002, 0, labCostSum, updated);
        
        const accDebitBal = prevAccs.find(a => a.TLID === targetCashTLID)?.AcBalance || 0;
        const accCreditBal = prevAccs.find(a => a.TLID === 401002)?.AcBalance || 0;

        const finalVchNo = newVchHeader.VchNo;
        const logDebit = createLedgerPostingLog(finalVchNo, targetCashTLID, labCostSum, 0, `Advised Lab tests collection (Shift ${shift})`, accDebitBal);
        const logCredit = createLedgerPostingLog(finalVchNo, 401002, 0, labCostSum, `Diagnostics test revenue balance`, accCreditBal);

        setAcLedger((prevLogs) => [...prevLogs, logDebit, logCredit]);

        return updated;
      });

      if (mongoDbSettings.SyncEnabled) {
        const bridgeUrl = mongoDbSettings.BridgeUrl || 'http://localhost:5000';
        fetch(`${bridgeUrl}/api/vouchers`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...newVchHeader,
            detailsRows: [detailDebit, detailCredit]
          })
        }).catch(err => console.error('Failed to sync lab tests voucher to MongoDB:', err.message));
      }
    }
  };

  // EMR Doctor Consult Assessment
  const handleAddVisit = (newVisit: Visit, medicines: VisitMedicine[], testIds: string[]) => {
    const existingVisit = visits.find((v) => v.VisitID === newVisit.VisitID);
    const wasAlreadyPosted = existingVisit?.Status === 2;

    setPatients((prev) => {
      if (prev.some((p) => p.PatientID === newVisit.PatientID)) return prev;
      return [
        ...prev,
        {
          PatientID: newVisit.PatientID,
          PatientName: `Patient (${newVisit.PatientID})`,
          Father_husband: '',
          AgeYears: 0,
          Sex: 'Male',
          MaritalStatus: 'Single',
          Occupation: '',
          Address: '',
          CityID: 1,
          Country: 'Pakistan',
          PhoneMobile: '',
          RegistrationDate: newVisit.VisitDate || new Date().toISOString().split('T')[0]
        }
      ];
    });

    setVisits((prev) => {
      const idx = prev.findIndex((v) => v.VisitID === newVisit.VisitID);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], ...newVisit };
        return copy;
      }
      return [...prev, newVisit];
    });

    setVisitMedicines((prev) => {
      const filtered = prev.filter((m) => m.VisitID !== newVisit.VisitID);
      return [...filtered, ...medicines];
    });

    const visitDateStr = newVisit.VisitDate ? newVisit.VisitDate.split('T')[0] : new Date().toISOString().split('T')[0];

    // Mark token as Visited (Status = 2) for this patient today
    setTokens((prev) =>
      prev.map(t =>
        (t.PatientID === newVisit.PatientID && (t.Date === visitDateStr || !t.Date))
          ? { ...t, Status: 2 }
          : t
      )
    );

    const assocToken = tokens.find(t => t.PatientID === newVisit.PatientID && (t.Date === visitDateStr || t.Status === 2));
    const shift = assocToken ? assocToken.Shift : (currentUser.AssignedShift !== 'Both' && typeof currentUser.AssignedShift === 'number' ? currentUser.AssignedShift : 1);

    // Mark appointment as Completed (Status = 4) & update FeeCharged if ConsultationFee set (or auto-create appointment record only if fee > 0)
    setAppointments((prev) => {
      const consFee = Number(newVisit.ConsultationFee) || 0;
      const matchFound = prev.some(a => a.PatientID === newVisit.PatientID && (a.AppointmentDate?.slice(0, 10) === visitDateStr || !a.AppointmentDate));

      if (consFee > 0) {
        if (matchFound) {
          return prev.map(a =>
            (a.PatientID === newVisit.PatientID && (a.AppointmentDate?.slice(0, 10) === visitDateStr || !a.AppointmentDate))
              ? {
                  ...a,
                  AppointmentDate: a.AppointmentDate || visitDateStr,
                  Status: 4,
                  FeeCharged: consFee,
                  PaymentStatus: 'Paid'
                }
              : a
          );
        } else {
          const autoAppt: Appointment = {
            AppointmentID: `APP-${newVisit.PatientID}-${Date.now().toString().slice(-4)}`,
            PatientID: newVisit.PatientID,
            AppointmentDate: visitDateStr,
            Shift: shift,
            Status: 4,
            FeeCharged: consFee,
            PaymentStatus: 'Paid',
            Remarks: 'Consultation Visit'
          };
          return [...prev, autoAppt];
        }
      } else {
        // No OPD/App fee charged by doctor (consFee <= 0)
        // Filter out zero-fee appointment entries if any exist, or keep pre-paid non-zero appointments marked Visited
        if (matchFound) {
          return prev
            .filter(a => {
              const isMatch = a.PatientID === newVisit.PatientID && (a.AppointmentDate?.slice(0, 10) === visitDateStr || !a.AppointmentDate);
              if (isMatch && (!a.FeeCharged || Number(a.FeeCharged) <= 0)) {
                return false; // Remove zero payment appointment entry
              }
              return true;
            })
            .map(a => {
              const isMatch = a.PatientID === newVisit.PatientID && (a.AppointmentDate?.slice(0, 10) === visitDateStr || !a.AppointmentDate);
              if (isMatch) {
                return { ...a, AppointmentDate: a.AppointmentDate || visitDateStr, Status: 4, PaymentStatus: 'Paid' };
              }
              return a;
            });
        }
        return prev;
      }
    });

    // Trigger financial postings on finalized post ONLY if it was not already posted
    if (newVisit.Status === 2 && !wasAlreadyPosted) {
      triggerEMRFinancialPostings(newVisit, shift, testIds);
    }

    if (mongoDbSettings.SyncEnabled) {
      const bridgeUrl = mongoDbSettings.BridgeUrl || 'http://localhost:5000';
      fetch(`${bridgeUrl}/api/visits`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newVisit)
      }).catch(err => console.error('Failed to synchronize EMR consultation visit to MongoDB:', err.message));

      if (medicines && medicines.length > 0) {
        fetch(`${bridgeUrl}/api/visit-medicines`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(medicines)
        }).catch(err => console.error('Failed to synchronize EMR visit medicines to MongoDB:', err.message));
      }
    }
  };

  // EMR Doctor Consult Assessment Update
  const handleUpdateVisit = (updatedVisit: Visit, medicines: VisitMedicine[], testIds: string[]) => {
    const existingVisit = visits.find((v) => v.VisitID === updatedVisit.VisitID);
    const wasAlreadyPosted = existingVisit?.Status === 2;

    setVisits((prev) => prev.map((v) => v.VisitID === updatedVisit.VisitID ? updatedVisit : v));
    setVisitMedicines((prev) => {
      const filtered = prev.filter((m) => m.VisitID !== updatedVisit.VisitID);
      return [...filtered, ...medicines];
    });

    const visitDateStr = updatedVisit.VisitDate ? updatedVisit.VisitDate.split('T')[0] : new Date().toISOString().split('T')[0];

    // Mark token as Visited (Status = 2) for this patient today
    setTokens((prev) =>
      prev.map(t =>
        (t.PatientID === updatedVisit.PatientID && (t.Date === visitDateStr || !t.Date))
          ? { ...t, Status: 2 }
          : t
      )
    );

    // Mark appointment as Completed (Status = 4) & update FeeCharged if ConsultationFee set (or auto-create appointment record only if fee > 0)
    setAppointments((prev) => {
      const consFee = Number(updatedVisit.ConsultationFee) || 0;
      const matchFound = prev.some(a => a.PatientID === updatedVisit.PatientID && (a.AppointmentDate?.slice(0, 10) === visitDateStr || !a.AppointmentDate));

      if (consFee > 0) {
        if (matchFound) {
          return prev.map(a =>
            (a.PatientID === updatedVisit.PatientID && (a.AppointmentDate?.slice(0, 10) === visitDateStr || !a.AppointmentDate))
              ? {
                  ...a,
                  AppointmentDate: a.AppointmentDate || visitDateStr,
                  Status: 4,
                  FeeCharged: consFee,
                  PaymentStatus: 'Paid'
                }
              : a
          );
        } else {
          const assocToken = tokens.find(t => t.PatientID === updatedVisit.PatientID && (t.Date === visitDateStr || t.Status === 2));
          const shift = assocToken ? assocToken.Shift : (currentUser.AssignedShift !== 'Both' && typeof currentUser.AssignedShift === 'number' ? currentUser.AssignedShift : 1);
          const autoAppt: Appointment = {
            AppointmentID: `APP-${updatedVisit.PatientID}-${Date.now().toString().slice(-4)}`,
            PatientID: updatedVisit.PatientID,
            AppointmentDate: visitDateStr,
            Shift: shift,
            Status: 4,
            FeeCharged: consFee,
            PaymentStatus: 'Paid',
            Remarks: 'Consultation Visit'
          };
          return [...prev, autoAppt];
        }
      } else {
        // No OPD/App fee charged by doctor (consFee <= 0)
        // Filter out zero-fee appointment entries if any exist, or keep pre-paid non-zero appointments marked Visited
        if (matchFound) {
          return prev
            .filter(a => {
              const isMatch = a.PatientID === updatedVisit.PatientID && (a.AppointmentDate?.slice(0, 10) === visitDateStr || !a.AppointmentDate);
              if (isMatch && (!a.FeeCharged || Number(a.FeeCharged) <= 0)) {
                return false; // Remove zero payment appointment entry
              }
              return true;
            })
            .map(a => {
              const isMatch = a.PatientID === updatedVisit.PatientID && (a.AppointmentDate?.slice(0, 10) === visitDateStr || !a.AppointmentDate);
              if (isMatch) {
                return { ...a, AppointmentDate: a.AppointmentDate || visitDateStr, Status: 4, PaymentStatus: 'Paid' };
              }
              return a;
            });
        }
        return prev;
      }
    });

    // Trigger financial postings if transitioning to Posted (Status = 2)
    if (updatedVisit.Status === 2 && !wasAlreadyPosted) {
      const assocToken = tokens.find(t => t.PatientID === updatedVisit.PatientID && t.Status === 2);
      const shift = assocToken ? assocToken.Shift : (currentUser.AssignedShift !== 'Both' && typeof currentUser.AssignedShift === 'number' ? currentUser.AssignedShift : 1);
      triggerEMRFinancialPostings(updatedVisit, shift, testIds);
    }

    if (mongoDbSettings.SyncEnabled) {
      const bridgeUrl = mongoDbSettings.BridgeUrl || 'http://localhost:5000';
      fetch(`${bridgeUrl}/api/visits/${updatedVisit.VisitID}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedVisit)
      }).catch(err => console.error('Failed to synchronize updated EMR visit to MongoDB:', err.message));

      if (medicines && medicines.length > 0) {
        fetch(`${bridgeUrl}/api/visit-medicines`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(medicines)
        }).catch(err => console.error('Failed to synchronize updated EMR visit medicines to MongoDB:', err.message));
      }
    }
  };

  const handleAddCertificate = (newCert: MedicalCertificate) => {
    setMedicalCertificates((prev) => [...prev, newCert]);
    if (mongoDbSettings.SyncEnabled) {
      const bridgeUrl = mongoDbSettings.BridgeUrl || 'http://localhost:5000';
      fetch(`${bridgeUrl}/api/certificates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCert)
      }).catch(err => console.error('Failed to synchronize standard medical certificate to MongoDB:', err.message));
    }
  };

  const handleAddSbpCertificate = (newSbpCert: MedicalCertificateSBP) => {
    setSbpCertificates((prev) => [...prev, newSbpCert]);
    if (mongoDbSettings.SyncEnabled) {
      const bridgeUrl = mongoDbSettings.BridgeUrl || 'http://localhost:5000';
      fetch(`${bridgeUrl}/api/sbp-certificates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSbpCert)
      }).catch(err => console.error('Failed to synchronize SBP medical claim certificate to MongoDB:', err.message));
    }
  };

  // Pharmacy Point of Sale Checkout
  const handleAddInvoice = (newHeader: InvoiceHeader, details: InvoiceDetail[]) => {
    setInvoices((prev) => [...prev, newHeader]);
    setInvoiceDetails((prev) => [...prev, ...details]);

    let vchHdr: VchHeader | null = null;
    let detailsRows: VchDetail[] = [];

    // If checkout is posted (Status = 2)
    if (newHeader.Status === 2) {
      
      // 1. Deduct CStock in items, apply FEFO (First Expired First Out) across batches, and write InvLedger transactions
      let cogsSum = 0;
      setItems((prevItems) => {
        return prevItems.map((itm) => {
          const matchedDetails = details.find((d) => d.ItemID === itm.ItemID);
          if (matchedDetails) {
            const updatedStock = Math.max(0, itm.CStock - matchedDetails.Qty);
            cogsSum += itm.PurchasePrice * matchedDetails.Qty;

            // Apply FEFO Batch Deduction if item has batch tracking or active stock
            let updatedBatches: ItemBatch[] = [];
            let remainingToDeduct = matchedDetails.Qty;

            const existingBatches: ItemBatch[] = Array.isArray(itm.Batches) && itm.Batches.length > 0
              ? itm.Batches.map(b => ({ ...b }))
              : (itm.CStock > 0 || itm.BatchNo || itm.ExpDate
                  ? [{
                      BatchID: `${itm.ItemID}-B-initial`,
                      ItemID: itm.ItemID,
                      ItemName: itm.ItemName,
                      BatchNo: itm.BatchNo || 'B# 001',
                      MfgDate: itm.MfgDate || '',
                      ExpDate: itm.ExpDate || '',
                      PurchasePrice: itm.PurchasePrice,
                      SalePrice: itm.Price,
                      Qty: itm.CStock,
                      InitialQty: itm.CStock,
                      Status: 'ACTIVE' as const,
                      CreatedAt: new Date().toISOString()
                    }]
                  : []);

            if (existingBatches.length > 0) {
              // Sort batches by Expiry Date ascending (FEFO) - earliest expiry first, items without expiry at end
              const sortedBatches = [...existingBatches].sort((a, b) => {
                if (!a.ExpDate && !b.ExpDate) return 0;
                if (!a.ExpDate) return 1;
                if (!b.ExpDate) return -1;
                return a.ExpDate.localeCompare(b.ExpDate);
              });

              updatedBatches = sortedBatches.map(batch => {
                const currentBatchQty = Number(batch.Qty) || 0;
                if (remainingToDeduct <= 0 || currentBatchQty <= 0) {
                  return batch;
                }
                const canDeduct = Math.min(currentBatchQty, remainingToDeduct);
                const newBatchQty = currentBatchQty - canDeduct;
                remainingToDeduct -= canDeduct;

                const isExp = batch.ExpDate ? new Date(batch.ExpDate) < new Date() : false;
                return {
                  ...batch,
                  Qty: newBatchQty,
                  Status: newBatchQty === 0 ? ('EXHAUSTED' as const) : (isExp ? ('EXPIRED' as const) : ('ACTIVE' as const))
                };
              });
            }

            // Find next earliest active batch to show on main item card
            const activeBatches = updatedBatches.filter(b => (Number(b.Qty) || 0) > 0);
            const earliestActiveBatch = activeBatches.length > 0
              ? [...activeBatches].sort((a, b) => (a.ExpDate || '9999').localeCompare(b.ExpDate || '9999'))[0]
              : updatedBatches[0];

            // Log ledger movement
            const nextLedgerId = `LEDG-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
            const newLedgerRow: InvLedger = {
              LedgerID: nextLedgerId,
              ItemID: itm.ItemID,
              DocType: 'INV',
              DocNo: newHeader.InvoiceNo,
              TxDate: newHeader.InvoiceDate,
              QtyIn: 0,
              QtyOut: matchedDetails.Qty,
              Balance: updatedStock
            };
            setInvLedger((prevLedg) => [...prevLedg, newLedgerRow]);

            const updatedItem: Item = {
              ...itm,
              CStock: updatedStock,
              BatchNo: earliestActiveBatch?.BatchNo || itm.BatchNo,
              MfgDate: earliestActiveBatch?.MfgDate || itm.MfgDate,
              ExpDate: earliestActiveBatch?.ExpDate || itm.ExpDate,
              Batches: updatedBatches.length > 0 ? updatedBatches : itm.Batches
            };

            // Sync updated item specifications to MongoDB backend
            if (mongoDbSettings.SyncEnabled) {
              const bridgeUrl = mongoDbSettings.BridgeUrl || 'http://localhost:5000';
              fetch(`${bridgeUrl}/api/items/${encodeURIComponent(updatedItem.ItemID)}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedItem)
              }).catch(err => console.warn('Failed to sync item stock & batches to backend:', err.message));
            }

            return updatedItem;
          }
          return itm;
        });
      });

      // 2. Financial Double-Entry Postings
      const nextVchNo = `CRV-PH-${String(vouchers.length + 1).padStart(4, '0')}`;
      const journalDate = new Date().toISOString().split('T')[0];
      const shift = newHeader.shift || 1;

      // Shift-based Doctor Cash account
      const targetCashTLID = shift === 1 ? 101001 : 101002;

      let clinicalSum = 0;
      let patentSum = 0;
      let storeSum = 0;

      details.forEach((d) => {
        const type = d.MedicineType || 'S';
        if (type === 'C') {
          clinicalSum += d.LineTotal;
        } else if (type === 'P') {
          patentSum += d.LineTotal;
        } else {
          storeSum += d.LineTotal;
        }
      });

      const clinicalTLID = shift === 1 ? 401102 : 401202;
      const patentTLID = shift === 1 ? 401103 : 401203;
      const storeTLID = shift === 1 ? 401104 : 401204;

      vchHdr = {
        VchNo: nextVchNo,
        VchDate: journalDate,
        VchType: 'CRV',
        Status: 2, // Posted
        Remarks: `Pharmacy Checkout invoice. Ref: ${newHeader.InvoiceNo}, Shift: ${shift}`
      };

      detailsRows = [];
      detailsRows.push({
        VchNo: nextVchNo,
        TLID: targetCashTLID,
        Debit: newHeader.NetAmount,
        Credit: 0,
        Description: `Pharmacy cash receipt checkout (Shift ${shift})`
      });

      if (newHeader.Discount > 0) {
        detailsRows.push({
          VchNo: nextVchNo,
          TLID: INITIAL_CONFIG.StoreDisc_,
          Debit: newHeader.Discount,
          Credit: 0,
          Description: `Pharmacy customer discount allowed`
        });
      }

      if (clinicalSum > 0) {
        detailsRows.push({
          VchNo: nextVchNo,
          TLID: clinicalTLID,
          Debit: 0,
          Credit: clinicalSum,
          Description: `Clinical medicine sales revenue (Shift ${shift})`
        });
      }

      if (patentSum > 0) {
        detailsRows.push({
          VchNo: nextVchNo,
          TLID: patentTLID,
          Debit: 0,
          Credit: patentSum,
          Description: `Patent medicine sales revenue (Shift ${shift})`
        });
      }

      if (storeSum > 0) {
        detailsRows.push({
          VchNo: nextVchNo,
          TLID: storeTLID,
          Debit: 0,
          Credit: storeSum,
          Description: `Store medicine sales revenue (Shift ${shift})`
        });
      }

      // perpetual inventory values
      detailsRows.push({
        VchNo: nextVchNo,
        TLID: 501001, // Cost of Goods Sold
        Debit: cogsSum,
        Credit: 0,
        Description: `Pharmacy perpetual COGS clearance`
      });

      detailsRows.push({
        VchNo: nextVchNo,
        TLID: 103001, // Stock Inventory Asset
        Debit: 0,
        Credit: cogsSum,
        Description: `Pharmacy inventory asset clearance`
      });

      setVouchers((prevVch) => [...prevVch, vchHdr]);
      setVoucherDetails((prevDet) => [...prevDet, ...detailsRows]);

      // 3. Update Chart of Accounts balances live
      setTlAccounts((prevAccs) => {
        let updated = updateAccountBalanceAlgebraically(targetCashTLID, newHeader.NetAmount, 0, prevAccs);
        if (newHeader.Discount > 0) {
          updated = updateAccountBalanceAlgebraically(INITIAL_CONFIG.StoreDisc_, newHeader.Discount, 0, updated);
        }
        if (clinicalSum > 0) {
          updated = updateAccountBalanceAlgebraically(clinicalTLID, 0, clinicalSum, updated);
        }
        if (patentSum > 0) {
          updated = updateAccountBalanceAlgebraically(patentTLID, 0, patentSum, updated);
        }
        if (storeSum > 0) {
          updated = updateAccountBalanceAlgebraically(storeTLID, 0, storeSum, updated);
        }
        
        // perpetual inventory balances
        updated = updateAccountBalanceAlgebraically(501001, cogsSum, 0, updated);
        updated = updateAccountBalanceAlgebraically(103001, 0, cogsSum, updated);

        // 4. Record transactions in ACLedger
        const storeCashBal = prevAccs.find(a => a.TLID === targetCashTLID)?.AcBalance || 0;
        const discountBal = prevAccs.find(a => a.TLID === INITIAL_CONFIG.StoreDisc_)?.AcBalance || 0;
        const clinicalBal = prevAccs.find(a => a.TLID === clinicalTLID)?.AcBalance || 0;
        const patentBal = prevAccs.find(a => a.TLID === patentTLID)?.AcBalance || 0;
        const storeBal = prevAccs.find(a => a.TLID === storeTLID)?.AcBalance || 0;
        const cogsBal = prevAccs.find(a => a.TLID === 501001)?.AcBalance || 0;
        const stockBal = prevAccs.find(a => a.TLID === 103001)?.AcBalance || 0;

        const logs: ACLedger[] = [];
        logs.push(createLedgerPostingLog(nextVchNo, targetCashTLID, newHeader.NetAmount, 0, `Store cash sales receipt (Shift ${shift})`, storeCashBal));
        if (newHeader.Discount > 0) {
          logs.push(createLedgerPostingLog(nextVchNo, INITIAL_CONFIG.StoreDisc_, newHeader.Discount, 0, `Store sales discount debit`, discountBal));
        }
        if (clinicalSum > 0) {
          logs.push(createLedgerPostingLog(nextVchNo, clinicalTLID, 0, clinicalSum, `Clinical medicine revenue credit`, clinicalBal));
        }
        if (patentSum > 0) {
          logs.push(createLedgerPostingLog(nextVchNo, patentTLID, 0, patentSum, `Patent medicine revenue credit`, patentBal));
        }
        if (storeSum > 0) {
          logs.push(createLedgerPostingLog(nextVchNo, storeTLID, 0, storeSum, `Store medicine revenue credit`, storeBal));
        }
        logs.push(createLedgerPostingLog(nextVchNo, 501001, cogsSum, 0, `Perpetual COGS clearance debit`, cogsBal));
        logs.push(createLedgerPostingLog(nextVchNo, 103001, 0, cogsSum, `Perpetual Inventory asset credit`, stockBal));

        setAcLedger((prevLogs) => [...prevLogs, ...logs]);

        return updated;
      });
    }

    if (mongoDbSettings.SyncEnabled) {
      const bridgeUrl = mongoDbSettings.BridgeUrl || 'http://localhost:5000';
      fetch(`${bridgeUrl}/api/billing/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          InvoiceNo: newHeader.InvoiceNo,
          PatientID: newHeader.PatientID,
          InvoiceDate: newHeader.InvoiceDate,
          GAmount: newHeader.GAmount,
          Discount: newHeader.Discount,
          NetAmount: newHeader.NetAmount,
          shift: newHeader.shift,
          basketItems: details
        })
      })
        .then(res => res.json())
        .then(resData => {
          console.log('POS Checkout synchronized to MongoDB successfully!', resData);
          
          // Sync pharmacy sales voucher and details rows to MongoDB
          if (vchHdr && detailsRows.length > 0) {
            fetch(`${bridgeUrl}/api/vouchers`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                ...vchHdr,
                detailsRows
              })
            })
              .then(vRes => vRes.json())
              .then(vData => console.log('Pharmacy sales voucher synced successfully:', vData))
              .catch(vErr => console.warn('Failed to sync pharmacy sales voucher:', vErr.message));
          }
        })
        .catch(err => {
          console.error('Failed to synchronize POS checkout to MongoDB:', err.message);
        });
    }
  };

  // Pharmacy Sales Returns Reversal
  const handleAddSalesReturn = (srHeader: SRInvHeader, srDetails: SRInvDetail[]) => {
    setSalesReturns((prev) => [...prev, srHeader]);

    // Reinstate stock & write InvLedger transactions
    setItems((prevItems) => {
      return prevItems.map((itm) => {
        const matchedDetails = srDetails.find((d) => d.ItemID === itm.ItemID);
        if (matchedDetails) {
          const updatedStock = itm.CStock + matchedDetails.QtyReturned;

          const nextLedgerId = `LEDG-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
          const newLedgerRow: InvLedger = {
            LedgerID: nextLedgerId,
            ItemID: itm.ItemID,
            DocType: 'SR',
            DocNo: srHeader.SRInvoiceNo,
            TxDate: srHeader.ReturnDate,
            QtyIn: matchedDetails.QtyReturned,
            QtyOut: 0,
            Balance: updatedStock
          };
          setInvLedger((prevLedg) => [...prevLedg, newLedgerRow]);

          return { ...itm, CStock: updatedStock };
        }
        return itm;
      });
    });

    // Accounting posting: Debit Sales Returns (StoreSR_ = 501003) & Credit Pharmacy Cash (StoreCIH_ = 101002)
    const nextVchNo = `CPV-SR-${String(vouchers.length + 1).padStart(4, '0')}`;
    const journalDate = new Date().toISOString().split('T')[0];

    const vchHdr: VchHeader = {
      VchNo: nextVchNo,
      VchDate: journalDate,
      VchType: 'CPV',
      Status: 2, // Posted
      Remarks: `Pharmacy Sales Return reversal. Original Ref: ${srHeader.OriginalInvoiceNo}`
    };

    const dRowDebit: VchDetail = {
      VchNo: nextVchNo,
      TLID: INITIAL_CONFIG.StoreSR_,
      Debit: srHeader.NetPaid,
      Credit: 0,
      Description: `Pharmacy Sales Return reversal debit`
    };

    const dRowCredit: VchDetail = {
      VchNo: nextVchNo,
      TLID: INITIAL_CONFIG.StoreCIH_,
      Debit: 0,
      Credit: srHeader.NetPaid,
      Description: `Pharmacy refund paid credit`
    };

    setVouchers((prevVch) => [...prevVch, vchHdr]);
    setVoucherDetails((prevDet) => [...prevDet, dRowDebit, dRowCredit]);

    // COA update
    setTlAccounts((prevAccs) => {
      let updated = updateAccountBalanceAlgebraically(INITIAL_CONFIG.StoreSR_, srHeader.NetPaid, 0, prevAccs);
      updated = updateAccountBalanceAlgebraically(INITIAL_CONFIG.StoreCIH_, 0, srHeader.NetPaid, updated);
      
      const srBal = prevAccs.find(a => a.TLID === INITIAL_CONFIG.StoreSR_)?.AcBalance || 0;
      const cashBal = prevAccs.find(a => a.TLID === INITIAL_CONFIG.StoreCIH_)?.AcBalance || 0;

      const logDebit = createLedgerPostingLog(nextVchNo, INITIAL_CONFIG.StoreSR_, srHeader.NetPaid, 0, `Sales return debit`, srBal);
      const logCredit = createLedgerPostingLog(nextVchNo, INITIAL_CONFIG.StoreCIH_, 0, srHeader.NetPaid, `Sales return cash refund paid`, cashBal);

      setAcLedger((prevLogs) => [...prevLogs, logDebit, logCredit]);

      return updated;
    });

    if (mongoDbSettings.SyncEnabled) {
      const bridgeUrl = mongoDbSettings.BridgeUrl || 'http://localhost:5000';
      fetch(`${bridgeUrl}/api/billing/returns`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...srHeader,
          returnedItems: srDetails
        })
      })
        .then(res => res.json())
        .then(resData => {
          console.log('Pharmacy sales return synced successfully:', resData);
          
          // Sync sales return voucher and details to MongoDB
          fetch(`${bridgeUrl}/api/vouchers`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...vchHdr,
              detailsRows: [dRowDebit, dRowCredit]
            })
          })
            .then(vRes => vRes.json())
            .then(vData => console.log('Pharmacy sales return voucher synced successfully:', vData))
            .catch(vErr => console.warn('Failed to sync sales return voucher:', vErr.message));
        })
        .catch(err => console.error('Failed to synchronize pharmacy sales return to MongoDB:', err.message));
    }
  };

  // Supplier GRN Inward
  const handleAddGRN = (vchHeader: InvVchHeader, vchDetails: InvVchDetail[]) => {
    setGrns((prev) => [...prev, vchHeader]);
    setGrnDetails((prev) => [...prev, ...vchDetails]);

    // Capitalize inventory levels & logs InvLedger
    let grnTotalCostSum = 0;
    setItems((prevItems) => {
      return prevItems.map((itm) => {
        const matchedDetails = vchDetails.find((d) => d.ItemID === itm.ItemID);
        if (matchedDetails) {
          const updatedStock = itm.CStock + matchedDetails.QtyIn;
          grnTotalCostSum += (matchedDetails.QtyIn * matchedDetails.PurchaseRate);

          const nextLedgerId = `LEDG-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
          const newLedgerRow: InvLedger = {
            LedgerID: nextLedgerId,
            ItemID: itm.ItemID,
            DocType: 'GRN',
            DocNo: vchHeader.VchNo,
            TxDate: vchHeader.VchDate,
            QtyIn: matchedDetails.QtyIn,
            QtyOut: 0,
            Balance: updatedStock
          };
          setInvLedger((prevLedg) => [...prevLedg, newLedgerRow]);

          return { ...itm, CStock: updatedStock, PurchasePrice: matchedDetails.PurchaseRate };
        }
        return itm;
      });
    });

    // Accounting postings: Debit Stock Inventory (103001) & Credit Supplier accounts payable (e.g. SUP-001 Standipharm = 201001)
    const nextVchNo = `JV-GRN-${String(vouchers.length + 1).padStart(4, '0')}`;
    const journalDate = new Date().toISOString().split('T')[0];

    // Determine target supplier payable account code mapping (SUP-001 Standipharm = 201001, SUP-002 Getz = 201002, others defaults 201001)
    const payableAccountID = vchHeader.SID === 'SUP-002' ? 201002 : 201001;

    const vchHdr: VchHeader = {
      VchNo: nextVchNo,
      VchDate: journalDate,
      VchType: 'JV',
      Status: 2, // Posted
      Remarks: `Supplier Goods Inward GRN ${vchHeader.VchNo}. Supplier Ref: ${vchHeader.SID}`
    };

    const dRowDebit: VchDetail = {
      VchNo: nextVchNo,
      TLID: 103001, // Stock Inventory Account
      Debit: grnTotalCostSum,
      Credit: 0,
      Description: `GRN inventory asset capitalization`
    };

    const dRowCredit: VchDetail = {
      VchNo: nextVchNo,
      TLID: payableAccountID,
      Debit: 0,
      Credit: grnTotalCostSum,
      Description: `GRN Accounts Payable to supplier`
    };

    setVouchers((prevVch) => [...prevVch, vchHdr]);
    setVoucherDetails((prevDet) => [...prevDet, dRowDebit, dRowCredit]);

    // COA update
    setTlAccounts((prevAccs) => {
      let updated = updateAccountBalanceAlgebraically(103001, grnTotalCostSum, 0, prevAccs);
      updated = updateAccountBalanceAlgebraically(payableAccountID, 0, grnTotalCostSum, updated);
      
      const stockBal = prevAccs.find(a => a.TLID === 103001)?.AcBalance || 0;
      const APBal = prevAccs.find(a => a.TLID === payableAccountID)?.AcBalance || 0;

      const logDebit = createLedgerPostingLog(nextVchNo, 103001, grnTotalCostSum, 0, `GRN asset capitalization debit`, stockBal);
      const logCredit = createLedgerPostingLog(nextVchNo, payableAccountID, 0, grnTotalCostSum, `Accounts Payable supplier credit`, APBal);

      setAcLedger((prevLogs) => [...prevLogs, logDebit, logCredit]);

      return updated;
    });

    if (mongoDbSettings.SyncEnabled) {
      const bridgeUrl = mongoDbSettings.BridgeUrl || 'http://localhost:5000';
      fetch(`${bridgeUrl}/api/grns`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...vchHeader,
          grnItems: vchDetails
        })
      })
        .then(res => res.json())
        .then(resData => {
          console.log('Supplier GRN synced successfully:', resData);
          
          // Sync GRN capitalization voucher and details rows to MongoDB
          fetch(`${bridgeUrl}/api/vouchers`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...vchHdr,
              detailsRows: [dRowDebit, dRowCredit]
            })
          })
            .then(vRes => vRes.json())
            .then(vData => console.log('GRN capitalization voucher synced successfully:', vData))
            .catch(vErr => console.warn('Failed to sync GRN capitalization voucher:', vErr.message));
        })
        .catch(err => console.error('Failed to synchronize Supplier GRN purchase to MongoDB:', err.message));
    }
  };

  // Update Supplier GRN
  const handleUpdateGRN = (vchHeader: InvVchHeader, vchDetails: InvVchDetail[]) => {
    // Step A: Reverse/void the old GRN's stock levels and accounting balances
    const oldDetails = grnDetails.filter(d => d.VchNo === vchHeader.VchNo);
    
    // Reverse stocks for old items
    setItems((prevItems) => {
      return prevItems.map((itm) => {
        const matched = oldDetails.find(d => d.ItemID === itm.ItemID);
        if (matched) {
          return { ...itm, CStock: Math.max(0, itm.CStock - matched.QtyIn) };
        }
        return itm;
      });
    });

    // Reverse voucher balances for the old journal voucher
    const matchedVoucher = vouchers.find(v => v.Remarks.includes(vchHeader.VchNo) || v.VchNo === `JV-${vchHeader.VchNo}`);
    let oldJVNo = '';
    if (matchedVoucher) {
      oldJVNo = matchedVoucher.VchNo;
      const oldVchDetails = voucherDetails.filter(d => d.VchNo === oldJVNo);
      
      setVouchers(prev => prev.filter(v => v.VchNo !== oldJVNo));
      setVoucherDetails(prev => prev.filter(d => d.VchNo !== oldJVNo));
      setAcLedger(prev => prev.filter(l => l.VchNo !== oldJVNo));

      setTlAccounts(prevAccs => {
        let updated = [...prevAccs];
        oldVchDetails.forEach(line => {
          updated = updateAccountBalanceAlgebraically(line.TLID, -line.Debit, -line.Credit, updated);
        });
        return updated;
      });
    }

    // Step B: Apply the new GRN's stock levels and accounting balances
    let grnTotalCostSum = 0;
    setItems((prevItems) => {
      return prevItems.map((itm) => {
        const matchedDetails = vchDetails.find((d) => d.ItemID === itm.ItemID);
        if (matchedDetails) {
          const updatedStock = itm.CStock + matchedDetails.QtyIn;
          grnTotalCostSum += (matchedDetails.QtyIn * matchedDetails.PurchaseRate);

          const nextLedgerId = `LEDG-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
          const newLedgerRow: InvLedger = {
            LedgerID: nextLedgerId,
            ItemID: itm.ItemID,
            DocType: 'GRN',
            DocNo: vchHeader.VchNo,
            TxDate: vchHeader.VchDate,
            QtyIn: matchedDetails.QtyIn,
            QtyOut: 0,
            Balance: updatedStock
          };
          setInvLedger((prevLedg) => [...prevLedg, newLedgerRow]);

          return { ...itm, CStock: updatedStock, PurchasePrice: matchedDetails.PurchaseRate };
        }
        return itm;
      });
    });

    // Update header and details state (overwriting existing one for VchNo)
    setGrns(prev => {
      const filtered = prev.filter(g => g.VchNo !== vchHeader.VchNo);
      return [...filtered, vchHeader];
    });
    setGrnDetails(prev => {
      const filtered = prev.filter(d => d.VchNo !== vchHeader.VchNo);
      return [...filtered, ...vchDetails];
    });

    // Post new Journal Voucher
    const nextVchNo = oldJVNo || `JV-GRN-${String(vouchers.length + 1).padStart(4, '0')}`;
    const journalDate = vchHeader.VchDate || new Date().toISOString().split('T')[0];
    const payableAccountID = vchHeader.SID === 'SUP-002' ? 201002 : 201001;

    const vchHdr: VchHeader = {
      VchNo: nextVchNo,
      VchDate: journalDate,
      VchType: 'JV',
      Status: 2,
      Remarks: `Supplier Goods Inward GRN ${vchHeader.VchNo}. Supplier Ref: ${vchHeader.SID}`
    };

    const dRowDebit: VchDetail = {
      VchNo: nextVchNo,
      TLID: 103001,
      Debit: grnTotalCostSum,
      Credit: 0,
      Description: `GRN inventory asset capitalization`
    };

    const dRowCredit: VchDetail = {
      VchNo: nextVchNo,
      TLID: payableAccountID,
      Debit: 0,
      Credit: grnTotalCostSum,
      Description: `GRN Accounts Payable to supplier`
    };

    setVouchers((prevVch) => [...prevVch, vchHdr]);
    setVoucherDetails((prevDet) => [...prevDet, dRowDebit, dRowCredit]);

    // Update COA
    setTlAccounts((prevAccs) => {
      let updated = updateAccountBalanceAlgebraically(103001, grnTotalCostSum, 0, prevAccs);
      updated = updateAccountBalanceAlgebraically(payableAccountID, 0, grnTotalCostSum, updated);

      const stockBal = prevAccs.find(a => a.TLID === 103001)?.AcBalance || 0;
      const APBal = prevAccs.find(a => a.TLID === payableAccountID)?.AcBalance || 0;

      const logDebit = createLedgerPostingLog(nextVchNo, 103001, grnTotalCostSum, 0, `GRN asset capitalization debit`, stockBal);
      const logCredit = createLedgerPostingLog(nextVchNo, payableAccountID, 0, grnTotalCostSum, `Accounts Payable supplier credit`, APBal);

      setAcLedger((prevLogs) => [...prevLogs, logDebit, logCredit]);

      return updated;
    });

    if (mongoDbSettings.SyncEnabled) {
      const bridgeUrl = mongoDbSettings.BridgeUrl || 'http://localhost:5000';
      fetch(`${bridgeUrl}/api/grns/${vchHeader.VchNo}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...vchHeader,
          grnItems: vchDetails
        })
      })
        .then(res => res.json())
        .then(resData => {
          console.log('Supplier GRN updated successfully in MongoDB:', resData);

          if (oldJVNo) {
            fetch(`${bridgeUrl}/api/vouchers/${oldJVNo}`, { method: 'DELETE' })
              .then(() => {
                fetch(`${bridgeUrl}/api/vouchers`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    ...vchHdr,
                    detailsRows: [dRowDebit, dRowCredit]
                  })
                })
                  .then(vRes => vRes.json())
                  .then(vData => console.log('New GRN capitalization voucher synced:', vData))
                  .catch(vErr => console.warn('Failed to sync new GRN capitalization voucher:', vErr.message));
              })
              .catch(e => console.error('Failed to void old capitalization voucher:', e.message));
          }
        })
        .catch(err => console.error('Failed to update Supplier GRN in MongoDB:', err.message));
    }
  };

  // Void Supplier GRN
  const handleVoidGRN = (vchNo: string) => {
    const oldDetails = grnDetails.filter(d => d.VchNo === vchNo);

    // Subtract quantities from item stock
    setItems((prevItems) => {
      return prevItems.map((itm) => {
        const matched = oldDetails.find(d => d.ItemID === itm.ItemID);
        if (matched) {
          return { ...itm, CStock: Math.max(0, itm.CStock - matched.QtyIn) };
        }
        return itm;
      });
    });

    // Remove from grns and grnDetails state
    setGrns(prev => prev.filter(g => g.VchNo !== vchNo));
    setGrnDetails(prev => prev.filter(d => d.VchNo !== vchNo));

    // Find the related journal voucher
    const matchedVoucher = vouchers.find(v => v.Remarks.includes(vchNo) || v.VchNo === `JV-${vchNo}`);
    if (matchedVoucher) {
      const vchNoToDelete = matchedVoucher.VchNo;
      const detailsToReverseAcc = voucherDetails.filter(d => d.VchNo === vchNoToDelete);

      setVouchers(prev => prev.filter(v => v.VchNo !== vchNoToDelete));
      setVoucherDetails(prev => prev.filter(d => d.VchNo !== vchNoToDelete));
      setAcLedger(prev => prev.filter(l => l.VchNo !== vchNoToDelete));

      setTlAccounts(prevAccs => {
        let updated = [...prevAccs];
        detailsToReverseAcc.forEach(line => {
          updated = updateAccountBalanceAlgebraically(line.TLID, -line.Debit, -line.Credit, updated);
        });
        return updated;
      });

      if (mongoDbSettings.SyncEnabled) {
        const bridgeUrl = mongoDbSettings.BridgeUrl || 'http://localhost:5000';
        fetch(`${bridgeUrl}/api/grns/${vchNo}`, { method: 'DELETE' })
          .then(res => res.json())
          .then(resData => {
            console.log('Supplier GRN deleted from MongoDB:', resData);
            fetch(`${bridgeUrl}/api/vouchers/${vchNoToDelete}`, { method: 'DELETE' })
              .then(vRes => vRes.json())
              .then(vData => console.log('GRN capitalization voucher deleted:', vData))
              .catch(vErr => console.warn('Failed to delete GRN capitalization voucher:', vErr.message));
          })
          .catch(err => console.error('Failed to delete Supplier GRN from MongoDB:', err.message));
      }
    } else {
      if (mongoDbSettings.SyncEnabled) {
        const bridgeUrl = mongoDbSettings.BridgeUrl || 'http://localhost:5000';
        fetch(`${bridgeUrl}/api/grns/${vchNo}`, { method: 'DELETE' }).catch(err => console.error(err));
      }
    }
  };

  // Direct Double Entry Voucher Management
  const handleAddVoucher = (newVch: VchHeader, details: VchDetail[]) => {
    setVouchers((prev) => [...prev, newVch]);
    setVoucherDetails((prev) => [...prev, ...details]);

    // Apply journal lines updates directly into Chart of Accounts
    setTlAccounts((prevAccs) => {
      let updated = [...prevAccs];
      
      details.forEach((line) => {
        updated = updateAccountBalanceAlgebraically(line.TLID, line.Debit, line.Credit, updated);
        
        // Log transaction in GL
        const currentBal = prevAccs.find(a => a.TLID === line.TLID)?.AcBalance || 0;
        const logLine = createLedgerPostingLog(newVch.VchNo, line.TLID, line.Debit, line.Credit, line.Description || newVch.Remarks, currentBal);
        
        setAcLedger((prevLogs) => [...prevLogs, logLine]);
      });

      return updated;
    });

    if (mongoDbSettings.SyncEnabled) {
      const bridgeUrl = mongoDbSettings.BridgeUrl || 'http://localhost:5000';
      fetch(`${bridgeUrl}/api/vouchers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newVch,
          detailsRows: details
        })
      }).catch(err => console.error('Failed to synchronize financial voucher to MongoDB:', err.message));
    }
  };

  const handleUpdateItemStock = (itemId: string, newStock: number) => {
    setItems((prev) => prev.map((i) => (i.ItemID === itemId ? { ...i, CStock: newStock } : i)));
    const bridgeUrl = (mongoDbSettings.SyncEnabled && mongoDbSettings.BridgeUrl) ? mongoDbSettings.BridgeUrl : '';
    const matched = items.find(i => i.ItemID === itemId);
    const payload = matched ? { ...matched, CStock: newStock } : { ItemID: itemId, CStock: newStock };
    fetch(`${bridgeUrl}/api/items/${encodeURIComponent(itemId)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).catch(err => console.error('Failed to sync updated drug stock level to MongoDB:', err.message));
  };

  const handleUpdateAccountBalance = (tlid: number, balanceAmt: number) => {
    setTlAccounts((prev) => prev.map((a) => (a.TLID === tlid ? { ...a, AcBalance: balanceAmt } : a)));
    if (mongoDbSettings.SyncEnabled) {
      const bridgeUrl = mongoDbSettings.BridgeUrl || 'http://localhost:5000';
      const matched = tlAccounts.find(a => a.TLID === tlid);
      if (matched) {
        fetch(`${bridgeUrl}/api/accounts/${tlid}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...matched, AcBalance: balanceAmt })
        }).catch(err => console.error('Failed to sync updated account balance to MongoDB:', err.message));
      }
    }
  };

  const handleAddAccount = (newAcc: TLAccount) => {
    setTlAccounts((prev) => {
      if (prev.some(a => a.TLID === newAcc.TLID)) return prev;
      return [...prev, newAcc];
    });
    if (mongoDbSettings.SyncEnabled) {
      const bridgeUrl = mongoDbSettings.BridgeUrl || 'http://localhost:5000';
      fetch(`${bridgeUrl}/api/accounts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAcc)
      }).catch(err => console.error('Failed to sync added account to MongoDB:', err.message));
    }
  };

  const handleDeleteAccount = (tlid: number) => {
    setTlAccounts((prev) => prev.filter(a => a.TLID !== tlid));
    if (mongoDbSettings.SyncEnabled) {
      const bridgeUrl = mongoDbSettings.BridgeUrl || 'http://localhost:5000';
      fetch(`${bridgeUrl}/api/accounts/${tlid}`, {
        method: 'DELETE'
      }).catch(err => console.error('Failed to sync deleted account to MongoDB:', err.message));
    }
  };

  const handleLoginSuccess = (user: User, selectedShift?: 1 | 2 | 'Both') => {
    const finalShift = selectedShift !== undefined ? selectedShift : (user.AssignedShift || 1);
    const userWithShift: User = {
      ...user,
      AssignedShift: finalShift
    };
    setCurrentUser(userWithShift);
    setIsAuthenticated(true);
    sessionStorage.setItem('cms_current_user', JSON.stringify(userWithShift));
    sessionStorage.setItem('cms_is_authenticated', 'true');
    // Auto route to corresponding desk based on staff user role
    if (user.Role === 'Doctor') {
      setActiveTab('patients');
      setActivePatientSubTab('patient_visit');
    } else if (user.Role === 'Pharmacist') {
      setActiveTab('pharmacy');
    } else if (user.Role === 'Accountant') {
      setActiveTab('reports');
    } else if (user.Role === 'Receptionist') {
      setActiveTab('patients');
    } else {
      setActiveTab('dashboard');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('cms_is_authenticated');
    sessionStorage.removeItem('cms_current_user');
    localStorage.removeItem('cms_is_authenticated');
    localStorage.removeItem('cms_current_user');
  };


  // Filter lists based on assigned shift (1=Morning, 2=Evening, Both)
  const activeShiftFilter = currentUser.AssignedShift;

  const filteredAppointments = appointments.filter(app => {
    if (activeShiftFilter === 1) return app.Shift === 1;
    if (activeShiftFilter === 2) return app.Shift === 2;
    return true;
  });

  const filteredTokens = tokens.filter(tok => {
    if (activeShiftFilter === 1) return tok.Shift === 1;
    if (activeShiftFilter === 2) return tok.Shift === 2;
    return true;
  });

  const filteredInvoices = invoices.filter(inv => {
    if (activeShiftFilter === 1) return inv.shift === 1;
    if (activeShiftFilter === 2) return inv.shift === 2;
    return true;
  });

  if (!isAuthenticated) {
    return (
      <LoginDesk
        usersList={usersList}
        onLoginSuccess={handleLoginSuccess}
        onUserUpdated={(updatedUser) => {
          setUsersList(prev => prev.map(u => u.UserID === updatedUser.UserID ? updatedUser : u));
        }}
        clinicName={clinicSettings.ClinicName}
        clinicLogoImage={clinicSettings.ClinicLogoImage}
        sessionRevokedAlert={sessionRevokedAlert}
        onDismissSessionRevokedAlert={() => setSessionRevokedAlert(null)}
      />
    );
  }

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden font-sans antialiased relative" id="punjab-cms-app">
      <TopProgressBar active={isRefreshing} />

      {/* Floating Live User Access & Permissions Update Notification */}
      {userAccessToast && (
        <div className="fixed top-16 right-4 sm:right-6 z-50 animate-bounce flex items-center space-x-3 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl border border-emerald-500/50 backdrop-blur-md">
          <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl">
            <BellRing className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <p className="text-xs font-bold text-emerald-300">Live Access Update</p>
            <p className="text-xs text-slate-200 font-medium">{userAccessToast.message}</p>
          </div>
          <button
            onClick={() => setUserAccessToast(null)}
            className="text-slate-400 hover:text-white text-xs font-bold px-1 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main workspace container with Bento theme layout */}
      <main className="flex-1 flex flex-col min-w-0 bg-slate-100 relative overflow-hidden h-screen" id="main-workspace">
        
        {/* Bento Header */}
        <header className="h-14 sm:h-16 bg-blue-900 text-white flex items-center justify-between px-2 sm:px-4 md:px-6 shadow-md shrink-0 gap-1.5 sm:gap-3">
            <div className="flex items-center space-x-1.5 sm:space-x-3 shrink-0">
              {/* Mobile Hamburger Menu Toggle Button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-1.5 rounded-lg bg-blue-800/90 hover:bg-blue-700 active:bg-blue-950 text-white transition cursor-pointer shrink-0 border border-blue-600/60 shadow-xs"
                aria-label="Toggle navigation menu"
                id="mobile-hamburger-btn"
                title="Open menu"
              >
                {isMobileMenuOpen ? <X className="w-5 h-5 text-amber-300" /> : <Menu className="w-5 h-5 text-white" />}
              </button>

              <h1 className="text-xs sm:text-sm md:text-base lg:text-lg font-black tracking-tight uppercase truncate max-w-[100px] xs:max-w-[160px] sm:max-w-none">
                {clinicSettings.ClinicName || 'Punjab Homeopathic Clinic'}
              </h1>
            </div>
            <div className="flex items-center space-x-1 sm:space-x-2 lg:space-x-2.5 text-xs shrink-0">
              {/* Refresh All Button - Collapsed icon pill by default, expands smoothly on hover */}
              <button
                onClick={refreshAllData}
                disabled={isRefreshing}
                className="group flex items-center space-x-1 bg-emerald-700/60 hover:bg-emerald-600 active:bg-emerald-700 text-white font-extrabold text-[10px] px-1.5 sm:px-2 py-1 rounded-md border border-emerald-500/30 hover:border-emerald-400/70 shadow-xs transition-all duration-300 cursor-pointer disabled:opacity-60 shrink-0"
                title="Refresh All - Sync patient records, tokens, appointments, pharmacy stock & ledgers"
                id="top-refresh-all-btn"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-emerald-300 group-hover:text-white shrink-0 ${isRefreshing ? 'animate-spin' : ''} transition-colors`} />
                <div className="max-w-0 overflow-hidden group-hover:max-w-[120px] focus-within:max-w-[120px] transition-all duration-300 ease-in-out flex items-center opacity-0 group-hover:opacity-100 focus-within:opacity-100">
                  <span className="uppercase tracking-wider text-[9.5px] whitespace-nowrap pl-0.5">{isRefreshing ? 'Refreshing...' : 'Refresh All'}</span>
                </div>
              </button>

              {/* Global Search input field next to Refresh All */}
              <GlobalSearchHeader
                patients={patients}
                invoices={invoices}
                invoiceDetails={invoiceDetails}
                visits={visits}
                appointments={appointments}
                tokens={tokens}
                onNavigateTab={handleTabChange}
              />

              <div className="hidden lg:flex flex-col items-end">
                <span className="font-medium uppercase tracking-wider text-[8px] text-blue-200">Active Shift</span>
                <select
                  value={currentUser.AssignedShift ?? 1}
                  onChange={(e) => {
                    const val = e.target.value;
                    const newShift = val === '1' ? 1 : val === '2' ? 2 : 'Both';
                    const updatedUser = { ...currentUser, AssignedShift: newShift };
                    setCurrentUser(updatedUser);
                    sessionStorage.setItem('cms_current_user', JSON.stringify(updatedUser));
                  }}
                  className="bg-blue-900/90 text-emerald-300 font-bold text-[10px] rounded px-1.5 py-0.5 border border-blue-600 focus:outline-none cursor-pointer hover:bg-blue-900 transition"
                  title="Switch active session shift"
                >
                  <option value={1}>Morning (08:00 - 14:00)</option>
                  <option value={2}>Evening (17:00 - 21:00)</option>
                  <option value="Both">Both Shifts (1 & 2)</option>
                </select>
              </div>
              
              <div className="hidden lg:block h-6 w-[1px] bg-blue-700"></div>

              {/* Role Swap dropdown inside Top Header - Collapsed by default, expands on hover */}
              {currentUser.Role === 'Administrator' && (
                <div 
                  className="hidden sm:flex items-center space-x-1 bg-blue-900/40 hover:bg-blue-800/90 px-1.5 sm:px-2 py-1 rounded-md border border-blue-800 hover:border-blue-700 shadow-xs shrink-0 group transition-all duration-300 cursor-pointer"
                  title="Hover to swap user role"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400/60 group-hover:text-emerald-400 shrink-0 transition-colors" />
                  <div className="max-w-0 overflow-hidden group-hover:max-w-[260px] focus-within:max-w-[260px] transition-all duration-300 ease-in-out flex items-center space-x-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100">
                    <span className="hidden xl:inline text-[9px] font-extrabold text-blue-200 uppercase tracking-wider whitespace-nowrap">Role Swap:</span>
                    <select
                      value={currentUser.UserID}
                      onChange={(e) => {
                        const selected = usersList.find((u) => u.UserID === e.target.value);
                        if (selected) {
                          setCurrentUser(selected);
                          
                          // Validate authorizations for new switched user
                          const isAdmin = selected.Role === 'Administrator';
                          const isAccountant = selected.Role === 'Accountant';
                          const canAccessReports = isAdmin || isAccountant;
                          
                          const fallbackDesk = selected.Role === 'Pharmacist' ? 'pharmacy' : selected.Role === 'Accountant' ? 'reports' : 'patients';
                          if (activeTab === 'dashboard' && !isAdmin) {
                            handleTabChange(fallbackDesk);
                          } else if (activeTab === 'settings' && !isAdmin) {
                            handleTabChange(fallbackDesk);
                          } else if (activeTab === 'uploads' && !isAdmin) {
                            handleTabChange(fallbackDesk);
                          } else if (activeTab === 'reports' && !canAccessReports) {
                            handleTabChange(fallbackDesk);
                          }
                        }
                      }}
                      className="bg-blue-950 text-white font-bold text-[9.5px] sm:text-[10px] rounded px-1 py-0.5 border border-blue-600 focus:outline-none focus:ring-1 focus:ring-emerald-400 cursor-pointer max-w-[120px] sm:max-w-none truncate"
                      id="top-role-selector"
                    >
                      {usersList
                        .filter((usr) => canUserAccessTargetUser(usr))
                        .map((usr) => (
                          <option key={usr.UserID} value={usr.UserID} className="bg-slate-900 text-white">
                            {usr.FullName} ({usr.Role})
                          </option>
                        ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Ultra-Compact User Profile Pill & Profile Details Card */}
              <div className="relative shrink-0">
                <button
                  onClick={() => setShowProfileModal(!showProfileModal)}
                  className="flex items-center space-x-1 sm:space-x-1.5 bg-blue-950/80 hover:bg-blue-800 active:bg-blue-900 border border-blue-700/80 p-1 sm:pr-2 rounded-full transition cursor-pointer shadow-xs group"
                  title={`User Profile: ${currentUser.FullName} (${currentUser.Role}) - Click to view details`}
                  id="top-user-profile-btn"
                >
                  <div className="w-6 h-6 rounded-full bg-emerald-600 border border-emerald-400/80 flex items-center justify-center font-black text-[10px] text-white uppercase shadow-xs shrink-0">
                    {currentUser.FullName.charAt(0)}
                  </div>
                  <span className="text-[10px] font-bold text-white max-w-[75px] xl:max-w-[100px] truncate hidden sm:inline">
                    {currentUser.FullName.split(' ')[0]}
                  </span>
                  <span className="text-[8.5px] font-extrabold text-emerald-300 bg-emerald-950/80 px-1.5 py-0.2 rounded-full uppercase border border-emerald-800/80 hidden md:inline">
                    {currentUser.Role.slice(0, 5)}
                  </span>
                  <ChevronDown className={`w-3 h-3 text-blue-300 transition-transform duration-150 ${showProfileModal ? 'rotate-180' : ''}`} />
                </button>

                {/* User Profile Details Dropdown Card */}
                {showProfileModal && (
                  <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 text-slate-800 p-4 sm:p-5 z-50 animate-fadeIn">
                    <div className="flex items-center space-x-3.5 pb-4 border-b border-slate-100">
                      <div className="w-12 h-12 rounded-full bg-blue-900 text-emerald-400 border-2 border-emerald-400 flex items-center justify-center font-black text-xl uppercase shadow-md shrink-0">
                        {currentUser.FullName.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-sm text-slate-900 truncate">{currentUser.FullName}</h4>
                        <span className="inline-block bg-blue-100 text-blue-800 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider mt-0.5">
                          {currentUser.Role}
                        </span>
                      </div>
                    </div>

                    <div className="py-3 space-y-2.5 text-xs">
                      <div className="flex justify-between items-center py-1 border-b border-slate-50">
                        <span className="text-slate-500 font-medium">User ID:</span>
                        <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">{currentUser.UserID}</span>
                      </div>
                      <div className="flex justify-between items-center py-1 border-b border-slate-50">
                        <span className="text-slate-500 font-medium">Username:</span>
                        <span className="font-mono font-bold text-slate-800">{currentUser.LoginName}</span>
                      </div>
                      <div className="flex justify-between items-center py-1 border-b border-slate-50">
                        <span className="text-slate-500 font-medium">Assigned Shift:</span>
                        <span className="font-bold text-emerald-700">
                          {currentUser.AssignedShift === 1 ? 'Morning (08:00 - 14:00)' : currentUser.AssignedShift === 2 ? 'Evening (17:00 - 21:00)' : 'Both Shifts'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-1 border-b border-slate-50">
                        <span className="text-slate-500 font-medium">Access Status:</span>
                        <span className="inline-flex items-center text-xs font-bold text-emerald-600">
                          <span className="w-2 h-2 bg-emerald-500 rounded-full mr-1.5 animate-pulse"></span> Active Session
                        </span>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                      <button
                        onClick={() => setShowProfileModal(false)}
                        className="text-xs font-bold text-slate-500 hover:text-slate-800 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer"
                      >
                        Close
                      </button>
                      <button
                        onClick={() => {
                          setShowProfileModal(false);
                          handleLogout();
                        }}
                        className="flex items-center space-x-1.5 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-extrabold text-xs px-3.5 py-1.5 rounded-lg transition shadow-sm cursor-pointer"
                        id="profile-card-logout-btn"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Exit System</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* App-Wide Full Screen Toggle Button */}
              <button
                onClick={toggleAppFullScreen}
                className={`p-1.5 rounded-md border shadow-xs flex items-center justify-center transition cursor-pointer shrink-0 ${
                  isAppFullScreen
                    ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 border-amber-400'
                    : 'bg-blue-900/90 hover:bg-blue-800 text-amber-300 border-blue-700/80'
                }`}
                title={isAppFullScreen ? "Exit Full Screen Mode" : "Go Full Screen LCD Mode"}
                id="top-fullscreen-btn"
              >
                {isAppFullScreen ? (
                  <Minimize2 className="w-3.5 h-3.5 text-slate-950" />
                ) : (
                  <Maximize2 className="w-3.5 h-3.5 text-amber-300" />
                )}
              </button>

              {/* Compact Icon-Only Exit Button */}
              <button
                onClick={handleLogout}
                className="bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white p-1.5 rounded-md border border-rose-400/40 shadow-xs flex items-center justify-center transition cursor-pointer shrink-0"
                title={`Exit System & Log out (${currentUser.FullName})`}
                id="top-exit-btn"
              >
                <LogOut className="w-3.5 h-3.5 text-white" />
              </button>
            </div>
          </header>

        {/* Mobile Responsive Collapsible Navigation Drawer */}
        {isMobileMenuOpen && (
          <div className="lg:hidden bg-slate-900 border-b border-blue-800 text-white shadow-2xl animate-fadeIn z-50 shrink-0">
            <div className="p-3 border-b border-slate-800 flex items-center justify-between bg-blue-950">
              <div className="flex items-center space-x-2">
                <Menu className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-black uppercase tracking-wider text-emerald-300">Workspace Navigation</span>
              </div>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1 hover:bg-slate-800 rounded-md text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-2.5 grid grid-cols-2 gap-2 max-h-[65vh] overflow-y-auto">
              {MENU_ITEMS.filter((item) => {
                if (currentUser.Role !== 'Administrator' && item.id === 'dashboard') {
                  return false;
                }
                return isAccessible(item.id);
              }).map((item) => {
                const active = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleTabChange(item.id)}
                    className={`flex items-center space-x-2 px-3 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer min-h-[44px] ${
                      active
                        ? 'bg-blue-600 text-white shadow-md ring-2 ring-blue-400/50'
                        : 'bg-slate-800/90 hover:bg-slate-700/80 text-slate-200 border border-slate-700/60'
                    }`}
                  >
                    <item.icon className={`w-4 h-4 shrink-0 ${active ? 'text-white' : 'text-emerald-400'}`} />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Mobile Role Switcher & User Details Footer */}
            <div className="p-3 bg-slate-950 border-t border-slate-800 flex flex-col gap-2 text-xs">
              <div className="flex items-center justify-between text-[11px] text-slate-300">
                <span>User: <strong className="text-white">{currentUser.FullName}</strong> ({currentUser.Role})</span>
                <span className="text-emerald-400 font-bold">Shift {currentUser.AssignedShift === 1 ? '1 (Morning)' : currentUser.AssignedShift === 2 ? '2 (Evening)' : 'Both'}</span>
              </div>
              {currentUser.Role === 'Administrator' && (
                <div className="flex items-center justify-between bg-slate-900/60 hover:bg-slate-900 p-2 rounded-xl border border-slate-800/80 hover:border-slate-700 opacity-40 hover:opacity-100 focus-within:opacity-100 transition-all duration-300">
                  <span className="text-[11px] font-extrabold text-blue-300 uppercase">Role Swap:</span>
                  <select
                    value={currentUser.UserID}
                    onChange={(e) => {
                      const selected = usersList.find((u) => u.UserID === e.target.value);
                      if (selected) {
                        setCurrentUser(selected);
                        setIsMobileMenuOpen(false);
                      }
                    }}
                    className="bg-slate-950 text-emerald-300 font-bold text-xs rounded px-2 py-1 border border-slate-700 focus:outline-none cursor-pointer"
                  >
                    {usersList.filter((usr) => canUserAccessTargetUser(usr)).map((usr) => (
                      <option key={usr.UserID} value={usr.UserID}>
                        {usr.FullName} ({usr.Role})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Global Refresh Toast Banner */}
        {refreshMessage && (
          <div className="bg-emerald-600 text-white px-6 py-1.5 text-xs font-bold flex items-center justify-between shadow-inner animate-fadeIn z-50 shrink-0">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-emerald-200" />
              <span>{refreshMessage}</span>
            </div>
            <span className="text-[10px] text-emerald-200 uppercase font-mono tracking-wider">Live Sync Verified</span>
          </div>
        )}

        {/* Upper Navigation Tabs Row (Hidden on mobile; accessible via top header hamburger drawer) */}
        <div className="hidden lg:flex bg-white border-b border-slate-200 px-2 py-0.5 lg:flex-row lg:items-center justify-between shadow-2xs shrink-0 gap-1">
            <div className="flex-1 min-w-0 flex items-center space-x-0.5 overflow-x-auto py-0.5 scrollbar-none pr-1 touch-pan-x">
              {MENU_ITEMS.filter((item) => {
                if (currentUser.Role !== 'Administrator' && item.id === 'dashboard') {
                  return false;
                }
                return isAccessible(item.id);
              }).map((item) => {
                const active = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleTabChange(item.id)}
                    className={`flex items-center space-x-1 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-tight transition-all duration-150 shrink-0 cursor-pointer ${
                      active
                        ? 'bg-blue-600 text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 active:bg-slate-200'
                    }`}
                    id={`nav-btn-${item.id}`}
                  >
                    <item.icon className={`w-3 h-3 shrink-0 ${active ? 'text-white' : 'text-slate-400'}`} />
                    <span className="whitespace-nowrap">{item.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="hidden lg:flex items-center space-x-1 shrink-0">
              <button
                onClick={refreshAllData}
                disabled={isRefreshing}
                className="bg-slate-50 hover:bg-emerald-50 hover:text-emerald-700 border border-slate-200 hover:border-emerald-300 text-slate-700 text-[9.5px] font-extrabold px-2 py-0.5 rounded-md flex items-center space-x-1 transition cursor-pointer disabled:opacity-50 shrink-0"
                title="Click to fetch latest updates and refresh records across all modules"
              >
                <RefreshCw className={`w-2.5 h-2.5 text-emerald-600 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span className="uppercase tracking-tight text-[9px]">{isRefreshing ? 'Syncing...' : 'Refresh'}</span>
              </button>
            </div>
          </div>

        {/* Viewport for Active Tabs */}
        <div className="flex-1 overflow-hidden relative flex flex-col bg-slate-100 pb-14 lg:pb-0">
          <TopProgressBar active={isRefreshing} />
          {isRefreshing && (
            <div className="absolute top-3 right-5 z-40 bg-slate-900/90 text-white px-3 py-1.5 rounded-xl text-xs font-semibold shadow-lg backdrop-blur-xs flex items-center space-x-2 animate-fadeIn">
              <RefreshCw className="w-3.5 h-3.5 text-blue-400 animate-spin" />
              <span>Syncing records...</span>
            </div>
          )}
          {activeTab === 'dashboard' && (
            <Suspense fallback={<DashboardSkeleton />}>
              <Dashboard
                patients={patients}
                appointments={filteredAppointments}
                tokens={filteredTokens}
                items={items}
                accounts={tlAccounts}
                config={INITIAL_CONFIG}
                vouchers={vouchers}
                invoices={filteredInvoices}
                invoiceDetails={invoiceDetails}
                salesReturns={salesReturns}
                visits={visits}
              />
            </Suspense>
          )}

          {activeTab === 'patient_visit' && (
            <Suspense fallback={<PatientDeskSkeleton />}>
              <PatientDesk
                patients={patients}
                onAddPatient={handleAddPatient}
                appointments={appointments}
                onAddAppointment={handleAddAppointment}
                onUpdateAppointment={handleUpdateAppointment}
                onDeleteAppointment={handleDeleteAppointment}
                onUpdateAppointmentStatus={handleUpdateAppointmentStatus}
                tokens={tokens}
                onAddToken={handleAddToken}
                onUpdateTokenStatus={handleUpdateTokenStatus}
                onDeleteToken={handleDeleteToken}
                cities={cities}
                userRights={currentUserRights}
                smsSettings={smsSettings}
                nhcPatients={nhcPatients}
                clinicSettings={clinicSettings}
                visits={visits}
                visitMedicines={visitMedicines}
                onAddVisit={handleAddVisit}
                onUpdateVisit={handleUpdateVisit}
                medicalCertificates={medicalCertificates}
                onAddCertificate={handleAddCertificate}
                sbpCertificates={sbpCertificates}
                onAddSbpCertificate={handleAddSbpCertificate}
                mongoDbSettings={mongoDbSettings}
                onUpdatePatient={handleUpdatePatient}
                onDeletePatient={handleDeletePatient}
                onDeleteVisit={handleDeleteVisit}
                items={items}
                currentUser={currentUser}
                labTests={labTests}
                smartLocatorMedicines={smartLocatorMedicines}
                invoices={invoices}
                onUnauthorized={triggerGlobalUnauthorized}
                initialPatientId={activePatientId}
                initialSubTab="patient_visit"
                isFullScreenMode={true}
              />
            </Suspense>
          )}

          {activeTab === 'erp_system' && (
            <div className="flex-1 overflow-y-auto h-full">
              <Suspense fallback={<ErpDeskSkeleton />}>
                <ErpDesk
                  currentUser={currentUser}
                  rights={currentUserRights}
                  clinicSettings={clinicSettings}
                />
              </Suspense>
            </div>
          )}

          {activeTab === 'nhc_history' && (
            <Suspense fallback={<NhcPatientHistoryDeskSkeleton />}>
              <NhcPatientHistoryDesk
                mongoDbSettings={mongoDbSettings}
                setNhcPatients={setNhcPatients}
              />
            </Suspense>
          )}

          {activeTab === 'patients' && currentUserRights.find(r => r.MenuID === 'patients')?.Status && (
            <Suspense fallback={<PatientDeskSkeleton />}>
              <PatientDesk
                patients={patients}
                onAddPatient={handleAddPatient}
                appointments={appointments}
                onAddAppointment={handleAddAppointment}
                onUpdateAppointment={handleUpdateAppointment}
                onDeleteAppointment={handleDeleteAppointment}
                onUpdateAppointmentStatus={handleUpdateAppointmentStatus}
                tokens={tokens}
                onAddToken={handleAddToken}
                onUpdateTokenStatus={handleUpdateTokenStatus}
                onDeleteToken={handleDeleteToken}
                cities={cities}
                userRights={currentUserRights}
                smsSettings={smsSettings}
                nhcPatients={nhcPatients}
                clinicSettings={clinicSettings}
                visits={visits}
                visitMedicines={visitMedicines}
                onAddVisit={handleAddVisit}
                onUpdateVisit={handleUpdateVisit}
                medicalCertificates={medicalCertificates}
                onAddCertificate={handleAddCertificate}
                sbpCertificates={sbpCertificates}
                onAddSbpCertificate={handleAddSbpCertificate}
                mongoDbSettings={mongoDbSettings}
                onUpdatePatient={handleUpdatePatient}
                onDeletePatient={handleDeletePatient}
                onDeleteVisit={handleDeleteVisit}
                items={items}
                currentUser={currentUser}
                labTests={labTests}
                smartLocatorMedicines={smartLocatorMedicines}
                invoices={invoices}
                onUnauthorized={triggerGlobalUnauthorized}
                initialPatientId={activePatientId}
                initialSubTab={activePatientSubTab as any}
              />
            </Suspense>
          )}

          {activeTab === 'pharmacy' && currentUserRights.find(r => r.MenuID === 'pharmacy')?.Status && (
            <Suspense fallback={<PharmacyPOSSkeleton />}>
              <PharmacyPOS
                patients={patients}
                items={items}
                onUpdateItemStock={handleUpdateItemStock}
                setItems={setItems}
                suppliers={suppliers}
                setSuppliers={setSuppliers}
                invoices={filteredInvoices}
                invoiceDetails={invoiceDetails}
                onAddInvoice={handleAddInvoice}
                onAddSalesReturn={handleAddSalesReturn}
                grns={grns}
                grnDetails={grnDetails}
                onAddGRN={handleAddGRN}
                onUpdateGRN={handleUpdateGRN}
                onVoidGRN={handleVoidGRN}
                userRights={currentUserRights}
                visits={visits}
                visitMedicines={visitMedicines}
                appointments={appointments}
                tokens={tokens}
                clinicSettings={clinicSettings}
                currentUser={currentUser}
                onUnauthorized={triggerGlobalUnauthorized}
              />
            </Suspense>
          )}

          {activeTab === 'uploads' && isAccessible('uploads') && (
            <Suspense fallback={<UploadingDeskSkeleton />}>
              <UploadingDesk
                items={items}
                setItems={setItems}
                labTests={labTests}
                setLabTests={setLabTests}
                mongoDbSettings={mongoDbSettings}
                nhcPatients={nhcPatients}
                setNhcPatients={setNhcPatients}
                smartLocatorMedicines={smartLocatorMedicines}
                setSmartLocatorMedicines={setSmartLocatorMedicines}
                appointments={appointments}
                setAppointments={setAppointments}
                patients={patients}
                setPatients={setPatients}
              />
            </Suspense>
          )}

          {activeTab === 'reports' && isAccessible('reports') && (
            <div className="flex-1 overflow-y-auto h-full">
              <Suspense fallback={<ReportingDeskSkeleton />}>
                <ReportingDesk
                  invoices={invoices}
                  invoiceDetails={invoiceDetails}
                  salesReturns={salesReturns}
                  acLedger={acLedger}
                  tlAccounts={tlAccounts}
                  flAccounts={flAccounts}
                  slAccounts={slAccounts}
                  vouchers={vouchers}
                  voucherDetails={voucherDetails}
                  grns={grns}
                  grnDetails={grnDetails}
                  suppliers={suppliers}
                  tokens={tokens}
                  patients={patients}
                  appointments={appointments}
                  visits={visits}
                  visitMedicines={visitMedicines}
                  items={items}
                  inventoryItems={items}
                  currentUser={currentUser}
                  clinicSettings={clinicSettings}
                  onUnauthorized={triggerGlobalUnauthorized}
                />
              </Suspense>
            </div>
          )}

          {activeTab === 'settings' && isAccessible('settings') && (
            <Suspense fallback={<SettingsDeskSkeleton />}>
              <SettingsDesk
                clinicSettings={clinicSettings}
                setClinicSettings={setClinicSettings}
                usersList={usersList}
                setUsersList={setUsersList}
                currentUser={currentUser}
                smsSettings={smsSettings}
                setSmsSettings={setSmsSettings}
                mongoDbSettings={mongoDbSettings}
                setMongoDbSettings={setMongoDbSettings}
                cities={cities}
                setCities={setCities}
                onAddCity={handleAddCity}
                onDeleteCity={handleDeleteCity}
                patients={patients}
              />
            </Suspense>
          )}

          {activeTab === 'query_handler' && isAccessible('query_handler') && (
            <Suspense fallback={<QueryHandlerDeskSkeleton />}>
              <QueryHandlerDesk bridgeUrl={mongoDbSettings.BridgeUrl || 'http://localhost:5000'} />
            </Suspense>
          )}
        </div>

        {/* Global Unauthorized Popup Modal */}
        <UnauthorizedModal
          isOpen={unauthorizedModalState.isOpen}
          onClose={() => setUnauthorizedModalState({ isOpen: false })}
          title={unauthorizedModalState.title}
          message={unauthorizedModalState.message}
        />

        {/* Admin Dashboard Password Verification Modal */}
        <DashboardPasswordModal
          isOpen={showDashboardPasswordModal}
          onClose={() => setShowDashboardPasswordModal(false)}
          onSuccess={() => {
            setShowDashboardPasswordModal(false);
            setActiveTab('dashboard');
          }}
          currentUser={currentUser}
        />

        {/* PWA Mobile App Install / QR Guide Modal */}
        <PwaInstallModal
          isOpen={showPwaInstallModal}
          onClose={() => setShowPwaInstallModal(false)}
          onLaunchStoreMode={() => handleTabChange('pharmacy')}
        />

        {/* Bento Footer (Desktop Only) */}
        <footer className="hidden lg:flex h-8 bg-slate-200/60 border-t border-slate-300 px-6 items-center justify-between shrink-0 text-slate-600">
          <div className="flex space-x-4 text-[10px] font-medium uppercase tracking-tight italic">
            <span>Config Mapping: CIH: 0101-01</span>
            <span>Rev: 0401-02</span>
            <span>Disc: 0501-10</span>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-[10px] text-slate-500 hidden sm:inline">System Ready: Stable Connection to MongoDB Instance PharmacyPOSDB</span>
            <div className="hidden sm:block h-3 w-[1px] bg-slate-300"></div>
            <span className="text-[10px] font-bold text-blue-900">Licensed to: {clinicSettings.ClinicName}</span>
          </div>
        </footer>

        {/* Mobile Fixed Bottom Navigation Bar */}
        <nav 
          aria-label="Mobile Bottom Navigation"
          className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 lg:hidden shadow-2xl safe-area-pb"
        >
          <div className="grid grid-cols-5 h-14 items-center justify-around px-1 max-w-lg mx-auto">
            {/* 1. Patient Visit */}
            <button
              type="button"
              onClick={() => {
                handleTabChange('patient_visit');
                setIsMobileMenuOpen(false);
              }}
              className={`flex flex-col items-center justify-center py-1 px-0.5 rounded-lg transition cursor-pointer min-h-[44px] ${
                activeTab === 'patient_visit' || activeTab === 'patients'
                  ? 'text-emerald-400 font-black'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Stethoscope className={`w-5 h-5 ${activeTab === 'patient_visit' || activeTab === 'patients' ? 'text-emerald-400 stroke-[2.5]' : 'text-slate-400'}`} />
              <span className="text-[10px] tracking-tight mt-0.5 whitespace-nowrap">Visit Desk</span>
            </button>

            {/* 2. Pharmacy / Stock */}
            <button
              type="button"
              onClick={() => {
                handleTabChange('pharmacy');
                setIsMobileMenuOpen(false);
              }}
              className={`flex flex-col items-center justify-center py-1 px-0.5 rounded-lg transition cursor-pointer min-h-[44px] ${
                activeTab === 'pharmacy'
                  ? 'text-emerald-400 font-black'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ShoppingCart className={`w-5 h-5 ${activeTab === 'pharmacy' ? 'text-emerald-400 stroke-[2.5]' : 'text-slate-400'}`} />
              <span className="text-[10px] tracking-tight mt-0.5 whitespace-nowrap">Stock & POS</span>
            </button>

            {/* 3. Mini ERP */}
            <button
              type="button"
              onClick={() => {
                handleTabChange('erp_system');
                setIsMobileMenuOpen(false);
              }}
              className={`flex flex-col items-center justify-center py-1 px-0.5 rounded-lg transition cursor-pointer min-h-[44px] ${
                activeTab === 'erp_system'
                  ? 'text-emerald-400 font-black'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Building2 className={`w-5 h-5 ${activeTab === 'erp_system' ? 'text-emerald-400 stroke-[2.5]' : 'text-slate-400'}`} />
              <span className="text-[10px] tracking-tight mt-0.5 whitespace-nowrap">Mini ERP</span>
            </button>

            {/* 4. Patient Record */}
            <button
              type="button"
              onClick={() => {
                handleTabChange('nhc_history');
                setIsMobileMenuOpen(false);
              }}
              className={`flex flex-col items-center justify-center py-1 px-0.5 rounded-lg transition cursor-pointer min-h-[44px] ${
                activeTab === 'nhc_history'
                  ? 'text-emerald-400 font-black'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <DatabaseBackup className={`w-5 h-5 ${activeTab === 'nhc_history' ? 'text-emerald-400 stroke-[2.5]' : 'text-slate-400'}`} />
              <span className="text-[10px] tracking-tight mt-0.5 whitespace-nowrap">Records</span>
            </button>

            {/* 5. More Menus / Full Drawer */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className={`flex flex-col items-center justify-center py-1 px-0.5 rounded-lg transition cursor-pointer min-h-[44px] relative ${
                isMobileMenuOpen || !['patient_visit', 'patients', 'pharmacy', 'erp_system', 'nhc_history'].includes(activeTab)
                  ? 'text-amber-400 font-black'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5 text-amber-400 stroke-[2.5]" />
              ) : (
                <Menu className={`w-5 h-5 ${!['patient_visit', 'patients', 'pharmacy', 'erp_system', 'nhc_history'].includes(activeTab) ? 'text-amber-400 stroke-[2.5]' : 'text-slate-400'}`} />
              )}
              <span className="text-[10px] tracking-tight mt-0.5 whitespace-nowrap">
                {isMobileMenuOpen ? 'Close' : 'All Menus'}
              </span>
              {!['patient_visit', 'patients', 'pharmacy', 'erp_system', 'nhc_history'].includes(activeTab) && !isMobileMenuOpen && (
                <span className="absolute top-1 right-3 w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
              )}
            </button>
          </div>
        </nav>
      </main>
    </div>
  );
}
