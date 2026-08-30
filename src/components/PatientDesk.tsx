/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { TopProgressBar, GlobalLoadingOverlay } from './LoadingIndicator';
import {
  UserPlus,
  CalendarPlus,
  ListOrdered,
  Sparkles,
  Phone,
  MapPin,
  Clock,
  Calendar,
  UserCheck,
  Ban,
  CreditCard,
  Search,
  CheckCircle2,
  Users,
  Volume2,
  Stethoscope,
  History,
  Pill,
  Copy,
  Printer,
  FileText,
  Grid,
  Receipt,
  Building2,
  Plus,
  Edit3,
  Ticket,
  AlertCircle,
  AlertTriangle,
  X,
  Trash2,
  Eye,
  EyeOff,
  ChevronLeft,
  ChevronRight,
  Tag,
  HeartHandshake,
  Pencil,
  FlaskConical,
  Coins,
  LayoutGrid,
  Table,
  Maximize2,
  Minimize2,
  Database,
  Save,
  Download,
  Filter,
  Check,
  User as UserIcon
} from 'lucide-react';
import {
  Patient,
  Appointment,
  Token,
  City,
  UserRight,
  SmsSettings,
  NhcPatientHistory,
  ClinicSettings,
  Visit,
  VisitMedicine,
  Item,
  User,
  LabTest,
  SmartLocatorMedicine,
  InvoiceHeader,
  MedicalCertificate,
  MedicalCertificateSBP,
  MongoDbSettings,
  MultiPatientSearchResult
} from '../types';
import {
  formatDisplayDate,
  getPatientType as getPatientTypeUtil,
  matchPatientRecord,
  getResolvedNhcPatientName
} from './patient/patientDeskUtils';
import PatientDeskSubNav, { PatientDeskSubTab } from './patient/PatientDeskSubNav';
import LargeScreenTokenDisplay from './patient/LargeScreenTokenDisplay';
import PatientRegisterView from './patient/PatientRegisterView';
import PatientProfileView from './patient/PatientProfileView';
import InstantTokenIssueView from './patient/InstantTokenIssueView';
import RegistrationSuccessModal from './patient/RegistrationSuccessModal';
import EMRDesk from './EMRDesk';
import { generatePatientId } from '../utils/idGenerator';
import { openWhatsAppUrl } from '../utils/whatsappUtils';

const WhatsAppIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.573-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c-.001 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

interface PatientDeskProps {
  patients: Patient[];
  onAddPatient: (p: Patient) => void;
  onUpdatePatient?: (p: Patient) => void;
  onDeletePatient?: (patientId: string) => void;
  appointments: Appointment[];
  onAddAppointment: (app: Appointment) => void;
  onUpdateAppointment?: (app: Appointment) => void;
  onDeleteAppointment?: (appId: string) => void;
  onUpdateAppointmentStatus: (appId: string, status: 1 | 2 | 3 | 4) => void;
  tokens: Token[];
  onAddToken: (tok: Token) => void;
  onUpdateTokenStatus: (tokenNo: number, shift: 1 | 2, status: 1 | 2 | 3) => void;
  onDeleteToken?: (tokenNo: number, shift: 1 | 2) => void;
  cities: City[];
  userRights: UserRight[];
  smsSettings?: SmsSettings;
  nhcPatients?: NhcPatientHistory[];
  clinicSettings?: ClinicSettings;
  visits?: Visit[];
  visitMedicines?: VisitMedicine[];
  onAddVisit?: (v: Visit, medicines: VisitMedicine[], testIds: string[]) => void;
  onUpdateVisit?: (v: Visit, medicines: VisitMedicine[], testIds: string[]) => void;
  onDeleteVisit?: (visitId: string) => void;
  medicalCertificates?: MedicalCertificate[];
  onAddCertificate?: (c: MedicalCertificate) => void;
  sbpCertificates?: MedicalCertificateSBP[];
  onAddSbpCertificate?: (c: MedicalCertificateSBP) => void;
  mongoDbSettings?: MongoDbSettings;
  items?: Item[];
  currentUser?: User;
  labTests?: LabTest[];
  smartLocatorMedicines?: SmartLocatorMedicine[];
  invoices?: InvoiceHeader[];
  onUnauthorized?: (msg?: string) => void;
  initialPatientId?: string;
  initialSubTab?: PatientDeskSubTab;
  isFullScreenMode?: boolean;
}

export default function PatientDesk({
  patients,
  onAddPatient,
  onUpdatePatient,
  onDeletePatient,
  appointments,
  onAddAppointment,
  onUpdateAppointment,
  onDeleteAppointment,
  onUpdateAppointmentStatus,
  tokens,
  onAddToken,
  onUpdateTokenStatus,
  onDeleteToken,
  cities,
  userRights,
  smsSettings,
  nhcPatients = [],
  clinicSettings,
  visits = [],
  visitMedicines = [],
  onAddVisit,
  onUpdateVisit,
  onDeleteVisit,
  medicalCertificates = [],
  onAddCertificate,
  sbpCertificates = [],
  onAddSbpCertificate,
  mongoDbSettings,
  items = [],
  currentUser,
  labTests = [],
  smartLocatorMedicines = [],
  invoices = [],
  onUnauthorized,
  initialPatientId,
  initialSubTab,
  isFullScreenMode = false
}: PatientDeskProps) {
  const triggerAuthAlert = (featureName?: string) => {
    const msg = featureName ? `You are not authorized to access ${featureName}.` : 'You are not authorized to access.';
    if (onUnauthorized) {
      onUnauthorized(msg);
    }
  };

  // Access Control Permissions for Patient Intake & Queue Desk
  const perms = currentUser?.Permissions || {};
  const isAdministrator = currentUser?.Role === 'Administrator';
  const isReceptionist = currentUser?.Role === 'Receptionist';

  const canAccessQueue = isAdministrator || (perms.canAccessWaitingQueue !== undefined ? perms.canAccessWaitingQueue : true);
  const canAccessTokenIssue = isAdministrator || (perms.canAccessTokenIssue !== undefined ? perms.canAccessTokenIssue : true);
  const canAccessAppointments = isAdministrator || (perms.canAccessAppointmentsDesk !== undefined ? perms.canAccessAppointmentsDesk : true);

  const canAccessRegister = isAdministrator || (perms.canAccessPatientRegistration !== undefined ? perms.canAccessPatientRegistration : !isReceptionist);
  const canAccessPatientVisit = isAdministrator || (perms.canAccessPatientVisitDesk !== undefined ? perms.canAccessPatientVisitDesk : !isReceptionist);
  const canAccessGridView = isAdministrator || (perms.canAccessGridView !== undefined ? perms.canAccessGridView : !isReceptionist);
  const canAccessLargeScreen = isAdministrator || (perms.canAccessLargeScreenDisplay !== undefined ? perms.canAccessLargeScreenDisplay : !isReceptionist);

  const currentRight = userRights.find((r) => r.MenuID === 'patients');
  const rawCanAdd = currentRight ? currentRight.AddRec : false;
  const canPost = currentRight ? currentRight.PostRec : false;

  const canAddPatient = isAdministrator || (perms.canAddPatient !== false && rawCanAdd);
  const canEditPatient = isAdministrator || perms.canEditPatient !== false;
  const canIssueToken = isAdministrator || perms.canIssueToken !== false;
  const canBookAppointment = isAdministrator || perms.canBookAppointment !== false;
  const canCancelAppointment = isAdministrator || perms.canCancelAppointment === true;
  const canDeleteToken = isAdministrator || perms.canDeleteToken === true;
  const canCallServeToken = isAdministrator || perms.canCallServeToken !== false;

  // Sub-tabs state initialized to initialSubTab or queue
  const [activeSubTab, setActiveSubTab] = useState<PatientDeskSubTab>(initialSubTab || 'queue');
  const [isSubTabLoading, setIsSubTabLoading] = useState(false);
  const [subTabLoadingText, setSubTabLoadingText] = useState('Loading Sub-module...');
  const [isFullScreen, setIsFullScreen] = useState<boolean>(isFullScreenMode || false);

  useEffect(() => {
    if (initialSubTab) {
      setActiveSubTab(initialSubTab);
    }
  }, [initialSubTab]);

  useEffect(() => {
    if (isFullScreenMode !== undefined) {
      setIsFullScreen(isFullScreenMode);
    }
  }, [isFullScreenMode]);

  const handleSubTabChange = (tab: any) => {
    if (tab === activeSubTab) return;
    const labels: Record<string, string> = {
      queue: 'Waiting Queue',
      register: 'Registration Form',
      token_issue: 'Token Issue',
      patient_visit: 'Patient Visit & Prescriptions',
      grid_view: 'Grid-View',
      book: 'Appointments',
      status: 'Large Screen Display',
    };
    setSubTabLoadingText(`Opening ${labels[tab] || 'Patient Sub-desk'}...`);
    setIsSubTabLoading(true);
    setActiveSubTab(tab);
    setTimeout(() => {
      setIsSubTabLoading(false);
    }, 280);
  };
  const [fullscreenShift, setFullscreenShift] = useState<'both' | 'morning' | 'evening'>('both');
  const [isLcdFullScreenMode, setIsLcdFullScreenMode] = useState(false);

  // Auto-switch sub-tab if active one is restricted
  useEffect(() => {
    if (activeSubTab === 'queue' && !canAccessQueue) {
      if (canAccessRegister) setActiveSubTab('register');
      else if (canAccessTokenIssue) setActiveSubTab('token_issue');
      else if (canAccessPatientVisit) setActiveSubTab('patient_visit');
      else if (canAccessGridView) setActiveSubTab('grid_view');
      else if (canAccessAppointments) setActiveSubTab('book');
      else if (canAccessLargeScreen) setActiveSubTab('status');
    } else if (activeSubTab === 'register' && !canAccessRegister) {
      if (canAccessQueue) setActiveSubTab('queue');
      else if (canAccessTokenIssue) setActiveSubTab('token_issue');
      else if (canAccessPatientVisit) setActiveSubTab('patient_visit');
      else if (canAccessGridView) setActiveSubTab('grid_view');
      else if (canAccessAppointments) setActiveSubTab('book');
      else if (canAccessLargeScreen) setActiveSubTab('status');
    } else if (activeSubTab === 'token_issue' && !canAccessTokenIssue) {
      if (canAccessQueue) setActiveSubTab('queue');
      else if (canAccessRegister) setActiveSubTab('register');
      else if (canAccessPatientVisit) setActiveSubTab('patient_visit');
      else if (canAccessGridView) setActiveSubTab('grid_view');
      else if (canAccessAppointments) setActiveSubTab('book');
      else if (canAccessLargeScreen) setActiveSubTab('status');
    } else if (activeSubTab === 'patient_visit' && !canAccessPatientVisit) {
      if (canAccessQueue) setActiveSubTab('queue');
      else if (canAccessRegister) setActiveSubTab('register');
      else if (canAccessTokenIssue) setActiveSubTab('token_issue');
      else if (canAccessGridView) setActiveSubTab('grid_view');
      else if (canAccessAppointments) setActiveSubTab('book');
      else if (canAccessLargeScreen) setActiveSubTab('status');
    } else if (activeSubTab === 'grid_view' && !canAccessGridView) {
      if (canAccessQueue) setActiveSubTab('queue');
      else if (canAccessRegister) setActiveSubTab('register');
      else if (canAccessTokenIssue) setActiveSubTab('token_issue');
      else if (canAccessPatientVisit) setActiveSubTab('patient_visit');
      else if (canAccessAppointments) setActiveSubTab('book');
      else if (canAccessLargeScreen) setActiveSubTab('status');
    } else if (activeSubTab === 'book' && !canAccessAppointments) {
      if (canAccessQueue) setActiveSubTab('queue');
      else if (canAccessRegister) setActiveSubTab('register');
      else if (canAccessTokenIssue) setActiveSubTab('token_issue');
      else if (canAccessPatientVisit) setActiveSubTab('patient_visit');
      else if (canAccessGridView) setActiveSubTab('grid_view');
      else if (canAccessLargeScreen) setActiveSubTab('status');
    } else if (activeSubTab === 'status' && !canAccessLargeScreen) {
      if (canAccessQueue) setActiveSubTab('queue');
      else if (canAccessRegister) setActiveSubTab('register');
      else if (canAccessTokenIssue) setActiveSubTab('token_issue');
      else if (canAccessPatientVisit) setActiveSubTab('patient_visit');
      else if (canAccessGridView) setActiveSubTab('grid_view');
      else if (canAccessAppointments) setActiveSubTab('book');
    }
  }, [activeSubTab, canAccessQueue, canAccessRegister, canAccessTokenIssue, canAccessPatientVisit, canAccessGridView, canAccessAppointments, canAccessLargeScreen]);

  // Backward compatible alias
  const canAdd = canAddPatient;

  // Search filter state
  const [searchTerm, setSearchTerm] = useState(initialPatientId || '');

  useEffect(() => {
    if (initialPatientId) {
      setSelectedPatientId(initialPatientId);
      setSearchTerm(initialPatientId);
    }
  }, [initialPatientId]);

  // Form states for Patient Intake
  const [patientName, setPatientName] = useState('');
  const [fatherHusband, setFatherHusband] = useState('');
  const [ageYears, setAgeYears] = useState<number>(30);
  const [sex, setSex] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [maritalStatus, setMaritalStatus] = useState<'Single' | 'Married' | 'Widowed' | 'Divorced'>('Single');
  const [occupation, setOccupation] = useState('');
  const [address, setAddress] = useState('');
  const [cityId, setCityId] = useState<number>(1); // Default Lahore
  const [mobilePhone, setMobilePhone] = useState('');
  const [email, setEmail] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form states for Appointments
  const [showFollowUpConfirmModal, setShowFollowUpConfirmModal] = useState<boolean>(false);
  const [showFocFeeDetailsModal, setShowFocFeeDetailsModal] = useState<boolean>(false);
  const [focWaivedOpdFee, setFocWaivedOpdFee] = useState<number | string>('500');
  const [focWaivedClinicalFee, setFocWaivedClinicalFee] = useState<number | string>('0');
  const [focWaivedFileCardFee, setFocWaivedFileCardFee] = useState<number | string>('0');
  const [focReason, setFocReason] = useState<string>('Deserving / Needy Patient');
  const [selectedPatientId, setSelectedPatientId] = useState('');

  // Delete Patient Confirm Modal State
  const [deletePatientModalData, setDeletePatientModalData] = useState<{ isOpen: boolean; pt: Patient | null }>({ isOpen: false, pt: null });

  const [appDate, setAppDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [futureBookingModal, setFutureBookingModal] = useState<{
    isOpen: boolean;
    patientName: string;
    patientId: string;
    phoneMobile?: string;
    date: string;
    shift: number;
  } | null>(null);
  const [directVisitShiftModal, setDirectVisitShiftModal] = useState<{
    isOpen: boolean;
    patient: {
      PatientID: string;
      PatientName: string;
      PhoneMobile?: string;
      Sex?: string;
      AgeYears?: number;
    };
    shift: 1 | 2;
    fee: number;
    remarks: string;
    autoPrintTicket: boolean;
  } | null>(null);
  const [smsSentToast, setSmsSentToast] = useState<{ recipient: string; message: string; provider: string } | null>(null);
  const [shift, setShift] = useState<1 | 2>(() => {
    if (currentUser?.AssignedShift === 2) return 2;
    return 1;
  }); // 1 = Morning, 2 = Evening

  // Keep active shift automatically synchronized with the logged-in user's assigned shift
  useEffect(() => {
    const userShift = currentUser?.AssignedShift === 2 ? 2 : 1;
    setShift(userShift);
    setFormShift(userShift);
  }, [currentUser?.UserID, currentUser?.AssignedShift]);
  const [remarks, setRemarks] = useState('');
  const [appError, setAppError] = useState('');
  const [appSuccess, setAppSuccess] = useState('');

  // Patient Visit Sub-Tab States
  const [pvPatientSearch, setPvPatientSearch] = useState('');
  const [pvSelectedPatientId, setPvSelectedPatientId] = useState('');
  const [pvVisitDate, setPvVisitDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [pvSymptomsDiagnosis, setPvSymptomsDiagnosis] = useState('');

  // Multiple Patient Matches Popup Modal States
  const [isMultiPatientModalOpen, setIsMultiPatientModalOpen] = useState<boolean>(false);
  const [multiPatientSearchResults, setMultiPatientSearchResults] = useState<MultiPatientSearchResult[]>([]);
  const [multiPatientSearchQuery, setMultiPatientSearchQuery] = useState<string>('');
  const [multiPatientModalFilter, setMultiPatientModalFilter] = useState<string>('');

  // Structured Excel Sheet Grid items for Clinical & Patent Medicines
  const [pvClinicalItems, setPvClinicalItems] = useState<Array<{ id: string; medicineName: string; dosage: string }>>([
    { id: '1', medicineName: '', dosage: '' }
  ]);
  const [pvPatientItems, setPvPatientItems] = useState<Array<{ id: string; medicineName: string; dosage: string }>>([
    { id: '1', medicineName: '', dosage: '' }
  ]);

  const addClinicalItem = () => {
    setPvClinicalItems((prev) => [
      ...prev,
      { id: String(Date.now() + Math.random()), medicineName: '', dosage: '' }
    ]);
  };

  const removeClinicalItem = (id: string) => {
    setPvClinicalItems((prev) => (prev.length > 1 ? prev.filter((item) => item.id !== id) : prev));
  };

  const updateClinicalItem = (id: string, field: 'medicineName' | 'dosage', value: string) => {
    setPvClinicalItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const addPatientItem = () => {
    setPvPatientItems((prev) => [
      ...prev,
      { id: String(Date.now() + Math.random()), medicineName: '', dosage: '' }
    ]);
  };

  const removePatientItem = (id: string) => {
    setPvPatientItems((prev) => (prev.length > 1 ? prev.filter((item) => item.id !== id) : prev));
  };

  const updatePatientItem = (id: string, field: 'medicineName' | 'dosage', value: string) => {
    setPvPatientItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  // Smart Medicine Locator States for Patient Visit
  const [pvSmartLocatorModalOpen, setPvSmartLocatorModalOpen] = useState(false);
  const [pvSmartLocatorSearch, setPvSmartLocatorSearch] = useState('');
  const [pvSmartLocatorSelectedTag, setPvSmartLocatorSelectedTag] = useState('');
  const [pvSmartLocatorTargetBox, setPvSmartLocatorTargetBox] = useState<'clinical' | 'patient'>('clinical');
  const [mongoSmartLocatorList, setMongoSmartLocatorList] = useState<SmartLocatorMedicine[]>([]);
  const [pvSmartLocatorNotification, setPvSmartLocatorNotification] = useState<string | null>(null);

  // Helper for focusing Patient Visit input field (auto-scroll removed per user request)
  const handleFocusPatientVisitInput = () => {
    // Auto-scroll disabled per user request
  };

  // Fetch smart locator entries directly from MongoDB collection via backend API
  const fetchSmartLocatorFromMongoDB = useCallback(() => {
    const bridgeUrl = (window as any).cmsBridgeUrl || '';
    fetch(`${bridgeUrl}/api/smart-locator`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setMongoSmartLocatorList(data);
        }
      })
      .catch((e) => console.warn('Could not load smart locator from MongoDB:', e));
  }, []);

  const handleOpenSmartLocator = (target: 'clinical' | 'patient' = 'clinical') => {
    setPvSmartLocatorTargetBox(target);
    setPvSmartLocatorSearch('');
    setPvSmartLocatorSelectedTag('');
    setPvSmartLocatorModalOpen(true);
    fetchSmartLocatorFromMongoDB();
  };

  // Select medicine from Smart Locator popup -> populates Medicine Name ONLY into clinical or patent medicine box
  const handleSelectSmartMedicine = (m: SmartLocatorMedicine, targetBox: 'clinical' | 'patient') => {
    const medNameOnly = m.MedicineName.trim();
    const dosageVal = m.Dosage ? m.Dosage.trim() : '';

    if (targetBox === 'clinical') {
      setPvClinicalItems((prev) => {
        const emptyIdx = prev.findIndex((item) => !item.medicineName.trim());
        if (emptyIdx !== -1) {
          return prev.map((item, idx) =>
            idx === emptyIdx
              ? { ...item, medicineName: medNameOnly, dosage: item.dosage.trim() || dosageVal }
              : item
          );
        }
        return [
          ...prev,
          { id: String(Date.now() + Math.random()), medicineName: medNameOnly, dosage: dosageVal }
        ];
      });
      setPvSmartLocatorNotification(`Populated "${medNameOnly}" into Clinical Medicine Box!`);
    } else {
      setPvPatientItems((prev) => {
        const emptyIdx = prev.findIndex((item) => !item.medicineName.trim());
        if (emptyIdx !== -1) {
          return prev.map((item, idx) =>
            idx === emptyIdx
              ? { ...item, medicineName: medNameOnly, dosage: item.dosage.trim() || dosageVal }
              : item
          );
        }
        return [
          ...prev,
          { id: String(Date.now() + Math.random()), medicineName: medNameOnly, dosage: dosageVal }
        ];
      });
      setPvSmartLocatorNotification(`Populated "${medNameOnly}" into Patient Medicine Box!`);
    }

    setTimeout(() => {
      setPvSmartLocatorNotification(null);
    }, 2800);
  };

  const [pvClinicalMedicineExpireDate, setPvClinicalMedicineExpireDate] = useState('');

  const setExpireDateByWeeks = (weeks: number) => {
    const d = new Date();
    d.setDate(d.getDate() + weeks * 7);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    setPvClinicalMedicineExpireDate(`${year}-${month}-${day}`);
  };

  const getWeeksLabel = (dateStr: string) => {
    if (!dateStr) return null;
    const exp = new Date(dateStr);
    const now = new Date();
    exp.setHours(0, 0, 0, 0);
    now.setHours(0, 0, 0, 0);
    const diffMs = exp.getTime() - now.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays <= 0) return 'Expired / Today';
    const weeks = Math.round(diffDays / 7);
    if (weeks === 1) return '1 Week';
    if (weeks > 1) return `${weeks} Weeks`;
    return `${diffDays} Days`;
  };

  const [pvMedicalReportResult, setPvMedicalReportResult] = useState('');
  const [pvRemarks, setPvRemarks] = useState('');
  const [pvLabTestAdvice, setPvLabTestAdvice] = useState('');
  const [pvLabTestSearch, setPvLabTestSearch] = useState('');
  const [pvLabTestDropdownOpen, setPvLabTestDropdownOpen] = useState(false);
  const [pvLabTestModalOpen, setPvLabTestModalOpen] = useState(false);
  const [pvLabTestModalSearch, setPvLabTestModalSearch] = useState('');
  const [pvCustomTestInput, setPvCustomTestInput] = useState('');

  const getLabTestList = useCallback((adviceStr: string): string[] => {
    if (!adviceStr || adviceStr.trim() === 'None' || adviceStr.trim() === 'N/A') return [];
    const rawList = adviceStr
      .split(/[\n,;]+/)
      .map(s => s.trim())
      .filter(Boolean);

    const cleanList: string[] = [];
    rawList.forEach(item => {
      const cleaned = item.replace(/^[0-9]+[\.\)\-]\s*/, '').trim();
      if (cleaned && !cleanList.map(c => c.toLowerCase()).includes(cleaned.toLowerCase())) {
        cleanList.push(cleaned);
      }
    });

    return cleanList;
  }, []);

  const handleToggleLabTestAdvice = (testName: string) => {
    setPvLabTestAdvice(prev => {
      const currentList = getLabTestList(prev);
      const exists = currentList.map(c => c.toLowerCase()).includes(testName.trim().toLowerCase());
      if (exists) {
        const filtered = currentList.filter(c => c.toLowerCase() !== testName.trim().toLowerCase());
        return filtered.join(', ');
      } else {
        return [...currentList, testName.trim()].join(', ');
      }
    });
  };

  const handleAddCustomLabTest = () => {
    if (!pvCustomTestInput.trim()) return;
    handleToggleLabTestAdvice(pvCustomTestInput.trim());
    setPvCustomTestInput('');
  };

  const filteredCatalogLabTests = useMemo(() => {
    if (!labTests || labTests.length === 0) return [];
    const term = pvLabTestSearch.trim().toLowerCase();
    if (!term) return labTests.slice(0, 12);
    return labTests.filter(t => 
      String(t.TestName || '').toLowerCase().includes(term) || 
      String(t.TID || '').toLowerCase().includes(term)
    );
  }, [labTests, pvLabTestSearch]);

  const handleSelectLabTestAdvice = (test: LabTest) => {
    handleToggleLabTestAdvice(test.TestName);
    setPvLabTestSearch('');
    setPvLabTestDropdownOpen(false);
  };

  const handleRemoveLabTestAdviceItem = (testNameToRemove: string) => {
    setPvLabTestAdvice(prev => {
      const items = prev.split(',').map(s => s.trim()).filter(Boolean);
      const updated = items.filter(s => s.toLowerCase() !== testNameToRemove.toLowerCase());
      return updated.join(', ');
    });
  };

  // Derived strings for backwards compatibility & unified saving / printing
  const pvClinicalMedicine = pvClinicalItems.map((i) => i.medicineName).filter(Boolean).join('\n');
  const pvClinicalDosage = pvClinicalItems.map((i) => i.dosage).filter(Boolean).join('\n');
  const pvPatientMedicine = pvPatientItems.map((i) => i.medicineName).filter(Boolean).join('\n');
  const pvPatientDosage = pvPatientItems.map((i) => i.dosage).filter(Boolean).join('\n');

  const clinicalMedicineDosage = pvClinicalItems
    .filter((item) => item.medicineName.trim() || item.dosage.trim())
    .map((item) => (item.dosage.trim() ? `${item.medicineName.trim()} - ${item.dosage.trim()}` : item.medicineName.trim()))
    .join('\n');

  const patientMedicineDosage = pvPatientItems
    .filter((item) => item.medicineName.trim() || item.dosage.trim())
    .map((item) => (item.dosage.trim() ? `${item.medicineName.trim()} - ${item.dosage.trim()}` : item.medicineName.trim()))
    .join('\n');
  const [pvClinicalMedicinePkr, setPvClinicalMedicinePkr] = useState<number | string>('');
  const [pvFilePkr, setPvFilePkr] = useState<number | string>('');
  const [pvCardPkr, setPvCardPkr] = useState<number | string>('');
  const [pvOpdFeePkr, setPvOpdFeePkr] = useState<number | string>('');

  const resetPvConsultationFields = (targetPatId?: string) => {
    setEditingVisitId(null);
    setPvVisitDate(new Date().toISOString().split('T')[0]);
    setPvSymptomsDiagnosis('');
    setPvClinicalItems([{ id: '1', medicineName: '', dosage: '' }]);
    setPvPatientItems([{ id: '1', medicineName: '', dosage: '' }]);
    setPvClinicalMedicineExpireDate('');
    setPvMedicalReportResult('');
    setPvLabTestAdvice('');
    setPvClinicalMedicinePkr('');
    setPvFilePkr('');
    setPvCardPkr('');

    let initialOpdFee = '';
    const patId = targetPatId || pvSelectedPatientId;
    if (patId) {
      const todayStr = new Date().toISOString().split('T')[0];
      const matchedAppt = (appointments || []).find(a => a.PatientID === patId && a.AppointmentDate === todayStr);
      if (matchedAppt?.FeeCharged !== undefined && matchedAppt.FeeCharged !== null && matchedAppt.FeeCharged > 0) {
        initialOpdFee = String(matchedAppt.FeeCharged);
      } else {
        initialOpdFee = '';
      }
    } else {
      initialOpdFee = '';
    }
    setPvOpdFeePkr(initialOpdFee);
    setPvSaveError('');
    setPvSaveSuccess('');
  };

  // Shift-wise Daily Collection calculation (Clinical Medicine, File, Cards, OPD & Store Payments)
  const shiftDailyCollection = useMemo(() => {
    const targetDate = pvVisitDate || new Date().toISOString().split('T')[0];
    const targetShift = shift;

    let clinicalMedsTotal = 0;
    let fileTotal = 0;
    let cardTotal = 0;
    let opdConsultationTotal = 0;

    (visits || []).forEach((v) => {
      const vDate = v.VisitDate ? v.VisitDate.split('T')[0] : '';
      if (vDate === targetDate) {
        const matchedToken = (tokens || []).find(
          (t) => t.PatientID === v.PatientID && (t.Date ? t.Date.split('T')[0] : targetDate) === targetDate
        );
        const vShift = v.Shift || matchedToken?.Shift || targetShift;
        if (vShift === targetShift) {
          let clin = Number(v.ClinicalMedicinePayment) || 0;
          let file = Number(v.FileFee) || 0;
          let card = Number(v.CardFee) || Number(v.CardsPayment) || 0;
          if (v.VisitRemarks) {
            if (!clin) { const cPkr = v.VisitRemarks.match(/Clinical Meds PKR\s*(\d+)/); if (cPkr) clin = Number(cPkr[1]); }
            if (!file) { const fPkr = v.VisitRemarks.match(/File PKR\s*(\d+)/); if (fPkr) file = Number(fPkr[1]); }
            if (!card) { const kPkr = v.VisitRemarks.match(/Card PKR\s*(\d+)/); if (kPkr) card = Number(kPkr[1]); }
          }
          clinicalMedsTotal += clin;
          fileTotal += file;
          cardTotal += card;

          if (Number(v.ConsultationFee) > 0) {
            opdConsultationTotal += Number(v.ConsultationFee);
          }
        }
      }
    });

    let appointmentFeesTotal = 0;
    (appointments || []).forEach((app) => {
      const appDate = app.AppointmentDate ? app.AppointmentDate.split('T')[0] : '';
      const appShift = app.Shift || 1;
      if (appDate === targetDate && appShift === targetShift && app.Status !== 3) {
        appointmentFeesTotal += Number(app.FeeCharged) || 0;
      }
    });

    const opdTotal = Math.max(opdConsultationTotal, appointmentFeesTotal) || (opdConsultationTotal + appointmentFeesTotal);

    let storePaymentTotal = 0;
    (invoices || []).forEach((inv) => {
      const invDate = inv.InvoiceDate ? inv.InvoiceDate.split('T')[0] : '';
      const invShift = inv.shift || 1;
      if (invDate === targetDate && invShift === targetShift) {
        storePaymentTotal += Number(inv.NetAmount) || 0;
      }
    });

    const clinicalFileCardSubtotal = clinicalMedsTotal + fileTotal + cardTotal;
    const grandTotal = clinicalFileCardSubtotal + opdTotal + storePaymentTotal;

    return {
      clinicalMedsTotal,
      fileTotal,
      cardTotal,
      clinicalFileCardSubtotal,
      opdTotal,
      storePaymentTotal,
      grandTotal
    };
  }, [pvVisitDate, shift, visits, appointments, invoices, tokens]);
  const [pvSaveSuccess, setPvSaveSuccess] = useState('');
  const [pvSaveError, setPvSaveError] = useState('');
  const [isSavingVisit, setIsSavingVisit] = useState(false);
  const [editingVisitId, setEditingVisitId] = useState<string | null>(null);
  const [editingPatientId, setEditingPatientId] = useState<string | null>(null);
  const [pvNhcHistory, setPvNhcHistory] = useState<NhcPatientHistory[]>([]);
  const [isFetchingPvHistory, setIsFetchingPvHistory] = useState(false);
  const [pvPrescriptionModalOpen, setPvPrescriptionModalOpen] = useState(false);
  const [printDocType, setPrintDocType] = useState<'A5_VISIT_SLIP' | 'A4_PRESCRIPTION' | 'A4_LAB_TESTS' | 'A4_PATIENT_INVOICE'>('A5_VISIT_SLIP');
  const [pvSelectedHistoryDate, setPvSelectedHistoryDate] = useState<string>('ALL');
  const lastAutoSelectedPatientRef = useRef<string>('');
  const [isSearchLoadingModal, setIsSearchLoadingModal] = useState<boolean>(false);
  const [historyAlertModalOpen, setHistoryAlertModalOpen] = useState<boolean>(false);
  const [hidePreviousHistory, setHidePreviousHistory] = useState<boolean>(false);
  const [showDailyBreakdownMobile, setShowDailyBreakdownMobile] = useState<boolean>(false);

  // States for Daily Collection Report (Clinic & Store) Grid-View Modal
  const [isDailyCollectionReportModalOpen, setIsDailyCollectionReportModalOpen] = useState<boolean>(false);
  const [dailyCollectionStartDate, setDailyCollectionStartDate] = useState<string>('');
  const [dailyCollectionEndDate, setDailyCollectionEndDate] = useState<string>('');
  const [dailyCollectionReportData, setDailyCollectionReportData] = useState<any>(null);
  const [dailyCollectionReportFormat, setDailyCollectionReportFormat] = useState<'grid' | 'pdf' | 'patient_shift_wise'>('patient_shift_wise');
  const [selectedReportTypeInModal, setSelectedReportTypeInModal] = useState<'grid' | 'pdf' | 'patient_shift_wise'>('patient_shift_wise');

  // States for Date Range Selector Modal before Printing Report
  const [isReportDateModalOpen, setIsReportDateModalOpen] = useState<boolean>(false);
  const [reportStartDate, setReportStartDate] = useState<string>('');
  const [reportEndDate, setReportEndDate] = useState<string>('');

  // States for Print Detail Report Modal (Patient Wise, Shift Wise, Hybrid)
  const [isDetailReportModalOpen, setIsDetailReportModalOpen] = useState<boolean>(false);
  const [detailReportMode, setDetailReportMode] = useState<'patient_wise' | 'shift_wise' | 'hybrid'>('patient_wise');
  const [detailReportShiftFilter, setDetailReportShiftFilter] = useState<number>(0); // 0=All, 1=Morning, 2=Evening, 3=Night
  const [detailReportSearch, setDetailReportSearch] = useState<string>('');

  // States for All Patients Database Grid-View Visit Date Selector Modal
  const [isGridVisitSelectorModalOpen, setIsGridVisitSelectorModalOpen] = useState<boolean>(false);
  const [gridSelectorMode, setGridSelectorMode] = useState<'EDIT' | 'PRINT'>('PRINT');
  const [gridSelectorPatientId, setGridSelectorPatientId] = useState<string | null>(null);
  const [gridSelectorSelectedDate, setGridSelectorSelectedDate] = useState<string>('');

  // States for Edit Recent Visit Record Popup Modal
  const [isRecentVisitsModalOpen, setIsRecentVisitsModalOpen] = useState(false);
  const [recentModalSearch, setRecentModalSearch] = useState('');
  const [recentModalPatientOnly, setRecentModalPatientOnly] = useState<boolean>(true);

  // States for New Patient Search Token / Patient ID Popup Modal
  const [isNewPatientSearchModalOpen, setIsNewPatientSearchModalOpen] = useState(false);
  const [newPatientSearchQuery, setNewPatientSearchQuery] = useState('');
  const [modalEditingVisitId, setModalEditingVisitId] = useState<string>('');
  const [modalPatientId, setModalPatientId] = useState<string>('');
  const [modalPatientName, setModalPatientName] = useState<string>('');
  const [modalVisitDate, setModalVisitDate] = useState<string>('');
  const [modalSymptomsDiagnosis, setModalSymptomsDiagnosis] = useState<string>('');
  const [modalMedicalReportResult, setModalMedicalReportResult] = useState<string>('');
  const [modalLabTestAdvice, setModalLabTestAdvice] = useState<string>('');
  const [modalClinicalItems, setModalClinicalItems] = useState<{ id: string; medicineName: string; dosage: string }[]>([
    { id: '1', medicineName: '', dosage: '' }
  ]);
  const [modalPatentItems, setModalPatentItems] = useState<{ id: string; medicineName: string; dosage: string }[]>([
    { id: '1', medicineName: '', dosage: '' }
  ]);
  const [modalClinicalMedicineExpireDate, setModalClinicalMedicineExpireDate] = useState<string>('');
  const [modalConsultationFee, setModalConsultationFee] = useState<number | string>('');
  const [modalClinicalMedicinePkr, setModalClinicalMedicinePkr] = useState<number | string>('');
  const [modalFilePkr, setModalFilePkr] = useState<number | string>('');
  const [modalCardPkr, setModalCardPkr] = useState<number | string>('');
  const [modalPaymentOption, setModalPaymentOption] = useState<string>('Cash Paid');
  const [modalRemarks, setModalRemarks] = useState<string>('');
  const [modalSaveSuccess, setModalSaveSuccess] = useState<string>('');
  const [modalSaveError, setModalSaveError] = useState<string>('');

  // States for Organization Claim Bill Modal
  const [isClaimBillModalOpen, setIsClaimBillModalOpen] = useState<boolean>(false);
  const [claimBillOrg, setClaimBillOrg] = useState<string>('WAPDA');
  const [claimBillCustomOrg, setClaimBillCustomOrg] = useState<string>('');
  const [claimBillEmployeeId, setClaimBillEmployeeId] = useState<string>('');
  const [claimBillDesignation, setClaimBillDesignation] = useState<string>('');
  const [claimBillRemarks, setClaimBillRemarks] = useState<string>('');

  // Helper function for date normalization
  const parseDateToISOKey = (dateStr?: string | null): string => {
    if (!dateStr || dateStr === 'N/A' || dateStr === '‚Äî') return '';
    const clean = String(dateStr).trim().split('T')[0].split(' ')[0];
    const parts = clean.split('-');
    if (parts.length === 3) {
      if (parts[0].length === 4) {
        return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
      }
      if (parts[2].length === 4) {
        return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
      }
    }
    const d = new Date(String(dateStr).trim());
    if (isNaN(d.getTime())) return clean;
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  // States for All Patients Grid-View Tab
  const [gridViewSearch, setGridViewSearch] = useState('');
  const [gridViewDatePreset, setGridViewDatePreset] = useState<'all' | 'today' | 'yesterday' | 'this_week' | 'this_month' | 'custom'>('all');
  const [gridViewStartDate, setGridViewStartDate] = useState('');
  const [gridViewEndDate, setGridViewEndDate] = useState('');
  const [gridViewGenderFilter, setGridViewGenderFilter] = useState<string>('all');
  const [gridViewFocOnly, setGridViewFocOnly] = useState<boolean>(false);

  // States for Token Issue for NEW Patient
  const [isOpdTokenModalOpen, setIsOpdTokenModalOpen] = useState<boolean>(false);
  const [isSubmittingToken, setIsSubmittingToken] = useState<boolean>(false);
  const [opdTokenModalPatient, setOpdTokenModalPatient] = useState<Patient | null>(null);
  const [tokenIssueMode, setTokenIssueMode] = useState<'existing' | 'new_patient'>('existing');
  const [newPatName, setNewPatName] = useState('');
  const [newPatPhone, setNewPatPhone] = useState('');
  const [newPatFee, setNewPatFee] = useState<number | string>('');
  const [existingFee, setExistingFee] = useState<number | string>('');
  const [newPatRemarks, setNewPatRemarks] = useState('');

  // States for Appointments Grid View
  const [appDeskMode, setAppDeskMode] = useState<'schedule' | 'grid_view'>('grid_view');
  const [appGridDatePreset, setAppGridDatePreset] = useState<'today' | 'yesterday' | 'this_week' | 'this_month' | 'all' | 'custom'>('today');
  const [appGridStartDate, setAppGridStartDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [appGridEndDate, setAppGridEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [appGridShiftFilter, setAppGridShiftFilter] = useState<'all' | '1' | '2'>('all');
  const [appGridSearch, setAppGridSearch] = useState('');

  // States for Excel Sheet Grid View & Modals
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);
  const [isAddAppModalOpen, setIsAddAppModalOpen] = useState(false);
  const [editingApp, setEditingApp] = useState<Appointment | null>(null);

  // Form states for Add / Edit Appointment
  const [formPatientId, setFormPatientId] = useState('');
  const [formPatientName, setFormPatientName] = useState('');
  const [formPhoneMobile, setFormPhoneMobile] = useState('');
  const [patientSearchQuery, setPatientSearchQuery] = useState('');
  const [formAppDate, setFormAppDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [formShift, setFormShift] = useState<1 | 2>(1);
  const [formFeeCharged, setFormFeeCharged] = useState<number | string>('');
  const [formRemarks, setFormRemarks] = useState('');

  const handleOpenAddModal = () => {
    setFormPatientId('');
    setFormPatientName('');
    setFormPhoneMobile('');
    setPatientSearchQuery('');
    setFormAppDate(new Date().toISOString().split('T')[0]);
    setFormShift(currentUser?.AssignedShift === 2 ? 2 : 1);
    setFormFeeCharged('500');
    setFormRemarks('');
    setIsAddAppModalOpen(true);
  };

  const handleOpenEditModal = (app: Appointment) => {
    const pat = patients.find((p) => p.PatientID === app.PatientID);
    setEditingApp(app);
    setFormPatientId(app.PatientID);
    setFormPatientName(pat?.PatientName || app.PatientID);
    setFormPhoneMobile(pat?.PhoneMobile || '');
    setFormAppDate(app.AppointmentDate || new Date().toISOString().split('T')[0]);
    setFormShift(app.Shift || 1);
    setFormFeeCharged(app.FeeCharged !== undefined && app.FeeCharged !== null ? app.FeeCharged : '');
    setFormRemarks(app.Remarks || '');
  };

  const handleDeleteAppointmentAction = (appId: string) => {
    if (!canCancelAppointment) {
      alert('Access Control Security: You do not have permission to Delete / Cancel appointments. Administrator rights required.');
      return;
    }
    const app = appointments.find((a) => a.AppointmentID === appId);
    const pat = patients.find((p) => p.PatientID === app?.PatientID);
    if (window.confirm(`Are you sure you want to delete the appointment for ${pat?.PatientName || app?.PatientID || appId}?`)) {
      if (onDeleteAppointment) {
        onDeleteAppointment(appId);
      }
      if (selectedAppId === appId) {
        setSelectedAppId(null);
      }
      setAppSuccess('Appointment record deleted successfully.');
      setTimeout(() => setAppSuccess(''), 3000);
    }
  };

  const handlePrintAppointmentReceipt = (app: Appointment) => {
    const pat = patients.find(p => p.PatientID === app.PatientID);
    const tok = tokens.find(t => t.PatientID === app.PatientID && t.Date === app.AppointmentDate);
    handlePrintThermalTokenSlip({
      tokenNo: tok?.TokenNo || 1,
      patientId: app.PatientID,
      patientName: pat?.PatientName || app.PatientID,
      shift: app.Shift,
      date: app.AppointmentDate || new Date().toISOString().split('T')[0],
      fee: app.FeeCharged || 0,
      age: pat?.AgeYears,
      sex: pat?.Sex,
      phone: pat?.PhoneMobile
    });
  };

  const handleSaveAddAppointment = (e: React.FormEvent | React.MouseEvent, shouldPrint?: boolean) => {
    if (e && e.preventDefault) e.preventDefault();
    let patId = formPatientId;

    if (!patId && formPatientName.trim()) {
      patId = generatePatientId(patients);
      const newPat: Patient = {
        PatientID: patId,
        PatientName: formPatientName.trim(),
        Father_husband: 'N/A',
        AgeYears: 0,
        Sex: 'Male',
        MaritalStatus: 'Single',
        Occupation: 'N/A',
        Address: 'N/A',
        CityID: 1,
        Country: 'Pakistan',
        PhoneMobile: formPhoneMobile.trim() || '03000000000',
        RegistrationDate: new Date().toISOString().split('T')[0]
      };
      if (onAddPatient) {
        onAddPatient(newPat);
      }
    }

    if (!patId) {
      setAppError('Please select or enter a Patient Name.');
      return;
    }

    let nextAppNum = appointments.length + 1;
    let newAppId = `APP-${String(nextAppNum).padStart(3, '0')}`;
    while (appointments.some((a) => a.AppointmentID === newAppId)) {
      nextAppNum++;
      newAppId = `APP-${String(nextAppNum).padStart(3, '0')}`;
    }

    const newApp: Appointment = {
      AppointmentID: newAppId,
      PatientID: patId,
      AppointmentDate: formAppDate || new Date().toISOString().split('T')[0],
      Shift: formShift,
      FeeCharged: formFeeCharged !== '' ? (Number(formFeeCharged) || 0) : 0,
      Remarks: formRemarks.trim() || 'Booked Appointment',
      Status: 1
    };

    onAddAppointment(newApp);
    setIsAddAppModalOpen(false);
    setSelectedAppId(newApp.AppointmentID);
    setAppError('');
    setAppSuccess('New appointment booked successfully!');
    setTimeout(() => setAppSuccess(''), 3000);

    if (shouldPrint) {
      handlePrintAppointmentReceipt(newApp);
    }
  };

  const handleSaveEditAppointment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingApp) return;

    if (formPatientId) {
      const pat = patients.find((p) => p.PatientID === formPatientId);
      if (pat && onUpdatePatient && formPhoneMobile && pat.PhoneMobile !== formPhoneMobile) {
        onUpdatePatient({
          ...pat,
          PhoneMobile: formPhoneMobile.trim()
        });
      }
    }

    const updatedApp: Appointment = {
      ...editingApp,
      AppointmentDate: formAppDate,
      Shift: formShift,
      FeeCharged: formFeeCharged !== '' ? (Number(formFeeCharged) || 0) : 0,
      Remarks: formRemarks.trim()
    };

    if (onUpdateAppointment) {
      onUpdateAppointment(updatedApp);
    }
    setEditingApp(null);
    setAppError('');
    setAppSuccess('Appointment updated successfully!');
    setTimeout(() => setAppSuccess(''), 3000);
  };

  const handleIssueTokenForNewPatient = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingToken) return;
    if (!newPatName.trim()) {
      setAppError('Patient Name is required for registering new patient.');
      return;
    }

    setIsSubmittingToken(true);
    try {
      const newPatId = generatePatientId(patients);
      
      const newPatient: Patient = {
        PatientID: newPatId,
        PatientName: newPatName.trim(),
        Father_husband: 'N/A (Quick Register)',
        AgeYears: 0,
        Sex: 'Male',
        MaritalStatus: 'Single',
        Occupation: 'N/A',
        Address: 'Address Pending (Quick Registration)',
        CityID: 1, // Lahore
        Country: 'Pakistan',
        PhoneMobile: newPatPhone.trim() || '03000000000',
        RegistrationDate: new Date().toISOString()
      };

      if (onAddPatient) {
        onAddPatient(newPatient);
      }

      setSelectedPatientId(newPatId);
      setOpdTokenModalPatient(newPatient);
      setTokenIssueMode('existing');
      setExistingFee('');
      setNewPatName('');
      setNewPatPhone('');
      setNewPatFee('');
      setNewPatRemarks('');
      setAppError('');
      setAppSuccess(`New Patient ${newPatient.PatientName} (${newPatId}) registered! Ready to issue token.`);
      setTimeout(() => setAppSuccess(''), 5000);
    } finally {
      setIsSubmittingToken(false);
    }
  };

  const handlePrintPreviousVisitPrescription = (group: any) => {
    if (!group) return;

    const cItems = (group.clinicalItems || [])
      .filter((i: any) => i.medicineName && i.medicineName !== 'None prescribed' && i.medicineName !== 'None recorded')
      .map((i: any, idx: number) => ({ id: String(Date.now() + idx), medicineName: i.medicineName, dosage: i.dosage && i.dosage !== 'As directed' ? i.dosage : '' }));

    const pItems = (group.patentItems || [])
      .filter((i: any) => i.medicineName && i.medicineName !== 'None prescribed' && i.medicineName !== 'None recorded')
      .map((i: any, idx: number) => ({ id: String(Date.now() + idx + 100), medicineName: i.medicineName, dosage: i.dosage && i.dosage !== 'As directed' ? i.dosage : '' }));

    const cExp = (group.clinicalItems || []).map((i: any) => i.expireDate).find(Boolean) || '';

    if (cItems.length > 0) setPvClinicalItems(cItems);
    else setPvClinicalItems([{ id: '1', medicineName: '', dosage: '' }]);

    if (pItems.length > 0) setPvPatientItems(pItems);
    else setPvPatientItems([{ id: '1', medicineName: '', dosage: '' }]);

    if (cExp) setPvClinicalMedicineExpireDate(cExp);

    if (group.symptoms) {
      setPvSymptomsDiagnosis(group.symptoms);
    }
    if (group.medicalReportResult && group.medicalReportResult !== 'N/A') {
      setPvMedicalReportResult(group.medicalReportResult);
    }
    if (group.labTestAdvice && group.labTestAdvice !== 'N/A') {
      setPvLabTestAdvice(group.labTestAdvice);
    }

    if (group.date) {
      setPvVisitDate(group.date);
    }

    // Restore Visit Charges (PKR) for OPD Fee, Clinical Meds, File, and Card
    setPvOpdFeePkr(group.opdFeePkr !== undefined && group.opdFeePkr !== null ? group.opdFeePkr : (group.consultationFee !== undefined ? group.consultationFee : ''));
    setPvClinicalMedicinePkr(group.clinicalMedicinePkr !== undefined && group.clinicalMedicinePkr !== null ? group.clinicalMedicinePkr : '');
    setPvFilePkr(group.filePkr !== undefined && group.filePkr !== null ? group.filePkr : '');
    setPvCardPkr(group.cardPkr !== undefined && group.cardPkr !== null ? group.cardPkr : '');

    setPvPrescriptionModalOpen(true);
    setPvSaveSuccess(`Loaded prescription from ${group.date} for re-printing.`);
    setTimeout(() => setPvSaveSuccess(''), 4000);
  };

  const handleOpenPrintModal = (docType: 'A5_VISIT_SLIP' | 'A4_PRESCRIPTION' | 'A4_LAB_TESTS' | 'A4_PATIENT_INVOICE') => {
    if (!pvSelectedPatientId) {
      setPvSaveError('Please select a patient first to print.');
      return;
    }
    setPrintDocType(docType);
    setPvPrescriptionModalOpen(true);
  };

  const handleSendWhatsAppRx = (
    overridePatient?: Patient,
    overrideVisitDate?: string,
    overrideClinical?: any[],
    overridePatent?: any[],
    overrideSymptoms?: string,
    overrideLab?: string
  ) => {
    const pt = overridePatient || selectedPvPatient;
    if (!pt) {
      alert("Please select a patient first.");
      return;
    }

    const pName = pt.PatientName || 'Patient';
    const pId = pt.PatientID || 'N/A';
    const rawMobile = pt.PhoneMobile || (pt as any).mobileNo || (pt as any).Phone || '';
    const vDate = overrideVisitDate || pvVisitDate || new Date().toISOString().split('T')[0];
    const symptoms = overrideSymptoms !== undefined ? overrideSymptoms : pvSymptomsDiagnosis;
    const lab = overrideLab !== undefined ? overrideLab : pvLabTestAdvice;

    const clinicalMeds = overrideClinical || pvClinicalItems.filter(i => i.medicineName && i.medicineName.trim());
    const patentMeds = overridePatent || pvPatientItems.filter(i => i.medicineName && i.medicineName.trim());

    let clinText = '';
    if (clinicalMeds.length > 0) {
      clinText = clinicalMeds.map((m: any, idx: number) => `  ${idx + 1}. *${m.medicineName.trim()}* ${m.dosage ? `‚Äî Dosage: ${m.dosage.trim()}` : ''}`).join('\n');
    } else {
      clinText = '  ‚Ä¢ None';
    }

    let patText = '';
    if (patentMeds.length > 0) {
      patText = patentMeds.map((m: any, idx: number) => `  ${idx + 1}. *${m.medicineName.trim()}* ${m.dosage ? `‚Äî Dosage: ${m.dosage.trim()}` : ''}`).join('\n');
    } else {
      patText = '  ‚Ä¢ None';
    }

    const clinicNameStr = clinicSettings?.ClinicName || 'PUNJAB HOMEOPATHIC CLINIC';

    const message = 
`üè• *${clinicNameStr.toUpperCase()}*
----------------------------------------
üìã *PATIENT PRESCRIPTION & VISIT SUMMARY*

üë§ *Patient Name:* ${pName.toUpperCase()}
üÜî *Patient ID:* ${pId}
üìÖ *Visit Date:* ${vDate}

üìã *SYMPTOMS / DIAGNOSIS:*
${symptoms || 'Routine Consultation'}

üíä *1. CLINICAL / COMPOUNDED MEDICINES:*
${clinText}

üíä *2. PATENT / COMMERCIAL MEDICINES:*
${patText}

üß™ *LAB TESTS / INVESTIGATIONS:*
${lab || 'Routine Homeopathic Treatment'}

----------------------------------------
*Dr. Ejaz Ahmad* (PUNJAB HOMEOPATHIC CLINIC)
*Contact:* +92-311-4000608
Healing Naturally. Restoring Balance.`;

    // Format phone number
    let cleanPhone = rawMobile.replace(/\D/g, '');
    if (cleanPhone.startsWith('03') && cleanPhone.length === 11) {
      cleanPhone = '92' + cleanPhone.slice(1);
    } else if (cleanPhone.startsWith('0') && cleanPhone.length === 11) {
      cleanPhone = '92' + cleanPhone.slice(1);
    } else if (cleanPhone.length === 10 && cleanPhone.startsWith('3')) {
      cleanPhone = '92' + cleanPhone;
    }

    // Open WhatsApp Preview Modal with formatted prescription details
    setWaModalMobile(cleanPhone || rawMobile || '');
    setWaModalMessage(message);
    setWaModalPatientName(pName);
    setWaModalPatientId(pId);
    setWaCopied(false);
    setWaModalOpen(true);
  };

  // WhatsApp Message Preview Modal State
  const [waModalOpen, setWaModalOpen] = useState(false);
  const [waModalMobile, setWaModalMobile] = useState('');
  const [waModalMessage, setWaModalMessage] = useState('');
  const [waModalPatientName, setWaModalPatientName] = useState('');
  const [waModalPatientId, setWaModalPatientId] = useState('');
  const [waCopied, setWaCopied] = useState(false);

  // New Patient Registration Success Modal State
  const [regSuccessModalOpen, setRegSuccessModalOpen] = useState(false);
  const [regSuccessData, setRegSuccessData] = useState<{
    patientId: string;
    patientName: string;
    phoneMobile: string;
  } | null>(null);



  // Helper function to check if patient is New Patient or Old Patient
  const getPatientType = (patientId: string): 'New Patient' | 'Old Patient' => {
    if (!patientId) return 'New Patient';
    const pat = patients.find((p) => p.PatientID === patientId);
    if (!pat) return 'New Patient';

    const hasVisits = (visits || []).some((v) => v.PatientID === patientId);
    const hasNhc = (nhcPatients || []).some((n) => n.PatientID === patientId);
    const realToday = new Date().toISOString().split('T')[0];
    const hasPriorApp = (appointments || []).some(
      (a) => a.PatientID === patientId && a.AppointmentDate < realToday
    );

    return hasVisits || hasNhc || hasPriorApp ? 'Old Patient' : 'New Patient';
  };

  const getPhoneVariants = (phoneVal: string | number | undefined | null): string[] => {
    if (!phoneVal) return [];
    const raw = String(phoneVal).trim().toLowerCase();
    const cleanDigits = raw.replace(/\D/g, '');
    if (!cleanDigits) return [];

    let baseDigits = cleanDigits;
    if (baseDigits.startsWith('92') && baseDigits.length >= 11) {
      baseDigits = baseDigits.slice(2);
    }
    baseDigits = baseDigits.replace(/^0+/, '');

    const variants = new Set<string>();
    variants.add(raw);
    variants.add(cleanDigits);
    if (baseDigits) {
      variants.add(baseDigits);
      variants.add('0' + baseDigits);
      variants.add('92' + baseDigits);
      variants.add('+92' + baseDigits);
    }
    return Array.from(variants);
  };

  const getIdVariants = (idVal: string | number | undefined | null) => {
    if (!idVal) return { clean: '', digits: '', raw: '', strippedDigits: '' };
    const raw = String(idVal).trim().toLowerCase();
    const clean = raw.replace(/[^0-9a-zA-Z]/g, '');
    const digits = raw.replace(/[^0-9]/g, '');
    const strippedDigits = digits.replace(/^0+/, '');
    return { clean, digits, raw, strippedDigits };
  };

  const normalizePhone = (phoneStr: string | number | undefined | null): string => {
    if (!phoneStr) return '';
    let digits = String(phoneStr).replace(/\D/g, '');
    if (digits.startsWith('92') && digits.length >= 11) {
      digits = digits.slice(2);
    }
    digits = digits.replace(/^0+/, '');
    return digits;
  };

  // Helper to check if a search query starts with any Pakistani mobile network prefix
  const isPakistaniMobilePrefix = (str: string): boolean => {
    const raw = str.trim().toLowerCase();
    if (!raw) return false;
    const digits = raw.replace(/\D/g, '');
    if (!digits) return false;

    // Check raw string prefix or digits prefix for Pakistani mobile network codes:
    // Jazz: 0300-0309, 0320-0327
    // Zong: 0310-0319
    // Ufone: 0330-0339
    // Telenor: 0340-0349
    // SCO/Onic/Others: 0355, 0370
    return (
      raw.startsWith('030') || raw.startsWith('031') || raw.startsWith('032') || raw.startsWith('033') || raw.startsWith('034') || raw.startsWith('035') || raw.startsWith('037') ||
      raw.startsWith('30') || raw.startsWith('31') || raw.startsWith('32') || raw.startsWith('33') || raw.startsWith('34') || raw.startsWith('35') || raw.startsWith('37') ||
      raw.startsWith('+9230') || raw.startsWith('+9231') || raw.startsWith('+9232') || raw.startsWith('+9233') || raw.startsWith('+9234') || raw.startsWith('+9235') || raw.startsWith('+9237') ||
      raw.startsWith('9230') || raw.startsWith('9231') || raw.startsWith('9232') || raw.startsWith('9233') || raw.startsWith('9234') || raw.startsWith('9235') || raw.startsWith('9237')
    );
  };

  // Helper function to match ONLY Patient ID, MR#, Name or Address (EXCLUDING phone number match)
  const matchPatientIdOrNameOnly = (p: { PatientName?: string, PatientID?: string, Address?: string }, query: string): boolean => {
    const normalizedQuery = query.toLowerCase().trim();
    if (!normalizedQuery) return false;
    const terms = normalizedQuery.split(/\s+/).filter(Boolean);
    if (terms.length === 0) return false;
    
    const name = String(p.PatientName || '').toLowerCase();
    const address = String(p.Address || '').toLowerCase();
    const patIdVar = getIdVariants(p.PatientID);

    return terms.every(term => {
      const termIdVar = getIdVariants(term);
      
      // 1. Direct substring match on Patient Name or Address
      if (name.includes(term) || address.includes(term)) return true;
      
      // 2. Patient ID Matching (raw, clean alphanumeric, or digits with leading zero handling)
      if (patIdVar.raw && (patIdVar.raw === term || patIdVar.raw.includes(term) || term.includes(patIdVar.raw))) return true;
      if (termIdVar.clean && patIdVar.clean && (patIdVar.clean === termIdVar.clean || patIdVar.clean.includes(termIdVar.clean) || termIdVar.clean.includes(patIdVar.clean))) return true;
      if (termIdVar.strippedDigits && patIdVar.strippedDigits) {
        if (patIdVar.strippedDigits === termIdVar.strippedDigits || patIdVar.strippedDigits.includes(termIdVar.strippedDigits) || termIdVar.strippedDigits.includes(patIdVar.strippedDigits)) return true;
      }
      
      return false;
    });
  };

  // Helper function for extremely robust, multi-word, normalized patient search
  const matchPatientRecord = (p: { PatientName?: string, PatientID?: string, PhoneMobile?: string | number, Address?: string }, query: string): boolean => {
    const normalizedQuery = query.toLowerCase().trim();
    if (!normalizedQuery) return true;
    const terms = normalizedQuery.split(/\s+/).filter(Boolean);
    if (terms.length === 0) return true;
    
    const name = String(p.PatientName || '').toLowerCase();
    const address = String(p.Address || '').toLowerCase();
    const patIdVar = getIdVariants(p.PatientID);
    const patPhoneVars = getPhoneVariants(p.PhoneMobile);

    return terms.every(term => {
      const termIdVar = getIdVariants(term);
      const termPhoneVars = getPhoneVariants(term);
      
      // 1. Direct substring match on Patient Name or Address
      if (name.includes(term) || address.includes(term)) return true;
      
      // 2. Patient ID Matching (raw, clean alphanumeric, or digits with leading zero handling)
      if (patIdVar.raw && (patIdVar.raw.includes(term) || term.includes(patIdVar.raw))) return true;
      if (termIdVar.clean && patIdVar.clean && (patIdVar.clean.includes(termIdVar.clean) || termIdVar.clean.includes(patIdVar.clean))) return true;
      if (termIdVar.strippedDigits && patIdVar.strippedDigits) {
        if (patIdVar.strippedDigits === termIdVar.strippedDigits || patIdVar.strippedDigits.includes(termIdVar.strippedDigits) || termIdVar.strippedDigits.includes(patIdVar.strippedDigits)) return true;
      }
      
      // 3. Phone Mobile Matching (checks all phone variants including without leading 0, with 0, with 92)
      if (patPhoneVars.length > 0 && termPhoneVars.length > 0) {
        const hasPhoneMatch = patPhoneVars.some(pv => 
          termPhoneVars.some(tv => pv === tv || pv.includes(tv) || tv.includes(pv))
        );
        if (hasPhoneMatch) return true;
      }
      
      return false;
    });
  };

  // Filtered patients for search
  const filteredPatients = patients.filter((p) => matchPatientRecord(p, searchTerm));

  const [nhcArchiveList, setNhcArchiveList] = useState<NhcPatientHistory[]>([]);
  const [isSearchingArchive, setIsSearchingArchive] = useState(false);

  const fetchNhcArchive = (queryVal: string) => {
    const trimmed = queryVal.trim();
    if (!trimmed) {
      setNhcArchiveList([]);
      return;
    }
    setIsSearchingArchive(true);
    const bridgeUrl = window.location.origin;
    fetch(`${bridgeUrl}/api/nhc-patient-history?q=${encodeURIComponent(trimmed)}&limit=100`)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP status ${res.status}`);
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data)) {
          setNhcArchiveList(data);
        }
      })
      .catch(e => console.warn('Could not load filtered NHC patient history in PatientDesk:', e.message))
      .finally(() => {
        setIsSearchingArchive(false);
      });
  };

  // Helper to resolve actual patient name for NHC archive records
  const getResolvedNhcPatientName = (
    nhcRecord: any,
    allPatients: Patient[] = [],
    allNhcList: NhcPatientHistory[] = []
  ): string => {
    if (!nhcRecord) return '';
    // 1. Direct properties on nhcRecord
    const directName = 
      nhcRecord.PatientName ||
      nhcRecord.patientName ||
      nhcRecord.Name ||
      nhcRecord.Patient_Name ||
      nhcRecord.patient_name;
    if (directName && typeof directName === 'string' && directName.trim() && directName.trim() !== 'NHC Archive Patient' && directName.trim() !== 'NHC Record') {
      return directName.trim();
    }

    // 2. Lookup in active patients list
    if (nhcRecord.PatientID) {
      const activeMatch = allPatients.find(p => p.PatientID === nhcRecord.PatientID);
      if (activeMatch && activeMatch.PatientName && activeMatch.PatientName.trim()) {
        return activeMatch.PatientName.trim();
      }

      // 3. Lookup in any other NHC record with the same PatientID that has a valid name
      const namedNhc = allNhcList.find(
        item => item.PatientID === nhcRecord.PatientID && 
        (item.PatientName || (item as any).patientName || (item as any).Name) &&
        String(item.PatientName || (item as any).patientName || (item as any).Name).trim() !== 'NHC Archive Patient' &&
        String(item.PatientName || (item as any).patientName || (item as any).Name).trim() !== 'NHC Record'
      );
      if (namedNhc) {
        const name = namedNhc.PatientName || (namedNhc as any).patientName || (namedNhc as any).Name;
        if (name && typeof name === 'string' && name.trim()) return name.trim();
      }
    }

    // 4. Fallback to Patient ID if no name is available at all
    return nhcRecord.PatientID ? `Patient (${nhcRecord.PatientID})` : 'Patient Record';
  };

  // Filtered NHC archive patients
  const filteredNhcPatients = (() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return [];
    const uniqueMap = new Map<string, NhcPatientHistory>();
    nhcArchiveList.forEach((p) => {
      const matches = matchPatientRecord(p, term);
      const isAlreadyActive = patients.some(ap => ap.PatientID === p.PatientID);
      if (matches && !isAlreadyActive) {
        if (!uniqueMap.has(p.PatientID)) {
          uniqueMap.set(p.PatientID, p);
        }
      }
    });
    return Array.from(uniqueMap.values());
  })();

  // Combined dropdown list for Patient Visit including ONLY issued token patients
  const pvPatientDropdownOptions = (() => {
    const list: { PatientID: string; PatientName: string; PhoneMobile?: string; tokenNo?: number; isNhc?: boolean }[] = [];
    const seenIds = new Set<string>();

    // Map patient ID to their token number
    const tokenMap = new Map<string, number>();
    (tokens || []).forEach(t => {
      if (t.PatientID) {
        const cleanTId = String(t.PatientID).trim().toLowerCase();
        tokenMap.set(cleanTId, t.TokenNo);
        tokenMap.set(String(t.PatientID).trim(), t.TokenNo);
      }
    });

    // 1. Add all patients with issued tokens directly from tokens list
    (tokens || []).forEach(t => {
      if (!t || !t.PatientID) return;
      const cleanId = String(t.PatientID).trim().toLowerCase();
      if (!seenIds.has(cleanId)) {
        seenIds.add(cleanId);
        const emrMatch = patients.find(p => p && String(p.PatientID).trim().toLowerCase() === cleanId);
        const nhcMatch = [...(nhcPatients || []), ...nhcArchiveList, ...pvNhcHistory].find(n => n && String(n.PatientID).trim().toLowerCase() === cleanId);
        
        list.push({
          PatientID: t.PatientID,
          PatientName: (t as any).PatientName || (emrMatch ? emrMatch.PatientName : nhcMatch ? nhcMatch.PatientName : `Patient ${t.PatientID}`),
          PhoneMobile: emrMatch?.PhoneMobile || nhcMatch?.PhoneMobile || '',
          tokenNo: t.TokenNo,
          isNhc: !emrMatch && !!nhcMatch
        });
      }
    });

    // 2. Add local EMR patients
    patients.forEach(p => {
      if (!p || !p.PatientID) return;
      const cleanId = String(p.PatientID).trim().toLowerCase();
      if (!seenIds.has(cleanId)) {
        seenIds.add(cleanId);
        list.push({
          PatientID: p.PatientID,
          PatientName: p.PatientName,
          PhoneMobile: p.PhoneMobile,
          tokenNo: tokenMap.get(cleanId) ?? tokenMap.get(String(p.PatientID).trim()),
          isNhc: false
        });
      }
    });

    // 3. Add NHC archive patients so searching works seamlessly
    const allNhc = [...(nhcPatients || []), ...nhcArchiveList, ...pvNhcHistory];
    allNhc.forEach(nhc => {
      if (!nhc || !nhc.PatientID) return;
      const cleanId = String(nhc.PatientID).trim().toLowerCase();
      if (!seenIds.has(cleanId)) {
        seenIds.add(cleanId);
        list.push({
          PatientID: nhc.PatientID,
          PatientName: getResolvedNhcPatientName(nhc, patients, allNhc),
          PhoneMobile: nhc.PhoneMobile || '',
          tokenNo: tokenMap.get(cleanId) ?? tokenMap.get(String(nhc.PatientID).trim()),
          isNhc: true
        });
      }
    });

    // Sort options: Token Number ascending first (1, 2, 3...)
    list.sort((a, b) => {
      if (a.tokenNo !== undefined && b.tokenNo !== undefined) return a.tokenNo - b.tokenNo;
      if (a.tokenNo !== undefined) return -1;
      if (b.tokenNo !== undefined) return 1;
      return (a.PatientName || '').localeCompare(b.PatientName || '');
    });

    const term = pvPatientSearch.trim().toLowerCase();
    if (!term) return list;

    const cleanNum = term.replace(/\D/g, '');

    return list.filter(p => {
      if (matchPatientRecord(p, term)) return true;
      if (p.tokenNo && (String(p.tokenNo) === term || (cleanNum && String(p.tokenNo) === cleanNum))) return true;
      return false;
    });
  })();

  const handleSelectPatientFromMultiModal = (targetPatId: string, patObj?: any) => {
    setIsMultiPatientModalOpen(false);
    resetPvConsultationFields(targetPatId);

    if (targetPatId) {
      setPvSelectedPatientId(targetPatId);
      
      const p = patObj || patients.find(pt => pt.PatientID === targetPatId) 
        || [...(nhcPatients || []), ...nhcArchiveList, ...pvNhcHistory].find(pt => pt.PatientID === targetPatId);
      
      const displayName = p ? `${p.PatientName} (${targetPatId})` : targetPatId;
      setPvPatientSearch(displayName);
      setPvSelectedHistoryDate('ALL');
      loadPvPatientHistory(targetPatId, false);
      checkAndPromptDirectVisitToken(targetPatId);

      const tok = (tokens || []).find((t) => t.PatientID === targetPatId);
      const msg = `Selected Patient: ${p ? p.PatientName : targetPatId} (MR#: ${targetPatId})${tok ? ` - Token #${tok.TokenNo}` : ''}`;
      setPvSaveSuccess(msg);
      setTimeout(() => setPvSaveSuccess(''), 5000);
    }
  };

  const handleExecutePatientSearch = () => {
    setIsSearchLoadingModal(true);
    const rawQuery = pvPatientSearch.trim();
    const query = rawQuery.toLowerCase();
    const cleanNum = query.replace(/\D/g, '');
    
    if (!query) {
      setPvSelectedPatientId('');
      resetPvConsultationFields('');
      setPvNhcHistory([]);
      setPvSelectedHistoryDate('ALL');
      setIsMultiPatientModalOpen(false);
      setTimeout(() => setIsSearchLoadingModal(false), 200);
      return;
    }

    // Check if query matches Pakistani mobile network prefixes (0300-0309, 0310-0319, 0320-0327, 0330-0339, 0340-0349, 0355, 0370, +923)
    const isMobilePattern = isPakistaniMobilePrefix(rawQuery);
    const allPatsForSearch = [...patients, ...(nhcPatients || []), ...nhcArchiveList, ...pvNhcHistory];

    const exactPidMatch = allPatsForSearch.find(p => p && (
      String(p.PatientID || '').trim().toLowerCase() === query ||
      (cleanNum.length > 0 && String(p.PatientID || '').replace(/\D/g, '').replace(/^0+/, '') === cleanNum.replace(/^0+/, '')) ||
      matchPatientIdOrNameOnly(p, query)
    ));

    // If doctor searched by mobile number AND it's less than 9 digits AND no Patient ID/Name matched:
    if (isMobilePattern && cleanNum.length < 9 && !exactPidMatch) {
      // Check if exact token number matches
      const exactTok = (tokens || []).find(t => String(t.TokenNo) === cleanNum || `#${t.TokenNo}` === query);
      if (exactTok && exactTok.PatientID) {
        handleSelectPatientFromMultiModal(exactTok.PatientID);
        setTimeout(() => setIsSearchLoadingModal(false), 200);
        return;
      }

      setIsSearchLoadingModal(false);
      setPvSaveSuccess(`‚ö†Ô∏è Please enter at least 9 digits for mobile number search (⁄©ŸÖ ÿßÿ≤ ⁄©ŸÖ 9 €ÅŸÜÿØÿ≥€í ÿØÿ±ÿ¨ ⁄©ÿ±€å⁄∫)`);
      setTimeout(() => setPvSaveSuccess(''), 4000);
      return;
    }

    const bridgeUrl = window.location.origin;

    fetch(`${bridgeUrl}/api/nhc-patient-history?q=${encodeURIComponent(query)}&limit=100`)
      .then(res => res.ok ? res.json() : [])
      .then((nhcResults: NhcPatientHistory[]) => {
        if (Array.isArray(nhcResults) && nhcResults.length > 0) {
          setNhcArchiveList(prev => {
            const map = new Map<string, NhcPatientHistory>();
            prev.forEach(item => map.set(item.PatientID, item));
            nhcResults.forEach(item => map.set(item.PatientID, item));
            return Array.from(map.values());
          });
        }

        const matchedMap = new Map<string, MultiPatientSearchResult>();

        const tokenMap = new Map<string, { tokenNo: number; shift: number }>();
        (tokens || []).forEach(t => {
          if (t && t.PatientID) {
            tokenMap.set(String(t.PatientID).trim().toLowerCase(), { tokenNo: t.TokenNo, shift: t.Shift });
          }
        });

        // Search by phone number ONLY if cleanNum.length >= 9
        const isPhoneQuery = cleanNum.length >= 9;

        const isRecordMatch = (p: any): boolean => {
          if (!p) return false;
          // matchPatientRecord checks Patient ID, Name, Address, and Phone
          if (matchPatientRecord(p, query)) return true;
          const pPhone = String(p.PhoneMobile || p.PhoneRes || p.PhoneOff || '').replace(/\D/g, '');
          if (isPhoneQuery && pPhone.includes(cleanNum)) return true;
          const pToken = tokenMap.get(String(p.PatientID || '').trim().toLowerCase());
          if (pToken && (String(pToken.tokenNo) === cleanNum || `#${pToken.tokenNo}` === query)) return true;
          return false;
        };

        // 1. Active EMR Patients
        (patients || []).forEach(p => {
          if (!p || !p.PatientID) return;
          const pid = String(p.PatientID).trim();
          const cleanPid = pid.toLowerCase();
          if (isRecordMatch(p)) {
            const tokInfo = tokenMap.get(cleanPid);
            matchedMap.set(cleanPid, {
              PatientID: pid,
              PatientName: p.PatientName,
              PhoneMobile: p.PhoneMobile,
              Father_husband: p.Father_husband,
              AgeYears: p.AgeYears,
              Sex: p.Sex,
              Address: p.Address,
              tokenNo: tokInfo?.tokenNo,
              tokenShift: tokInfo?.shift,
              isNhc: false,
              source: tokInfo ? "Active OPD Token" : "EMR Patient"
            });
          }
        });

        // 2. NHC Patients & Archives
        const allNhc = [...(nhcPatients || []), ...nhcArchiveList, ...pvNhcHistory, ...(nhcResults || [])];
        allNhc.forEach(nhc => {
          if (!nhc || !nhc.PatientID) return;
          const pid = String(nhc.PatientID).trim();
          const cleanPid = pid.toLowerCase();
          if (isRecordMatch(nhc)) {
            if (!matchedMap.has(cleanPid)) {
              const tokInfo = tokenMap.get(cleanPid);
              matchedMap.set(cleanPid, {
                PatientID: pid,
                PatientName: getResolvedNhcPatientName(nhc, patients, allNhc),
                PhoneMobile: nhc.PhoneMobile,
                Father_husband: nhc.Father_husband,
                AgeYears: nhc.AgeYears,
                Sex: nhc.Sex,
                Address: nhc.Address,
                tokenNo: tokInfo?.tokenNo,
                tokenShift: tokInfo?.shift,
                isNhc: true,
                source: tokInfo ? "Active OPD Token" : "Patient History Archive"
              });
            }
          }
        });

        // 3. Tokens check
        (tokens || []).forEach(tok => {
          if (!tok || !tok.PatientID) return;
          const pid = String(tok.PatientID).trim();
          const cleanPid = pid.toLowerCase();
          const tokNoStr = String(tok.TokenNo);
          const isTokMatch = tokNoStr === query || tokNoStr === cleanNum || `token-${tokNoStr}` === query || `#${tokNoStr}` === query;
          if (isTokMatch && !matchedMap.has(cleanPid)) {
            matchedMap.set(cleanPid, {
              PatientID: pid,
              PatientName: (tok as any).PatientName || `Patient ${pid}`,
              tokenNo: tok.TokenNo,
              tokenShift: tok.Shift,
              isNhc: false,
              source: "Issued OPD Token"
            });
          }
        });

        const matchingList = Array.from(matchedMap.values());

        if (matchingList.length > 1) {
          // MULTIPLE MATCHES FOUND: Open selection popup modal!
          setMultiPatientSearchResults(matchingList);
          setMultiPatientSearchQuery(rawQuery);
          setMultiPatientModalFilter('');
          setIsMultiPatientModalOpen(true);
        } else if (matchingList.length === 1) {
          // EXACT SINGLE MATCH FOUND: Directly select
          const singleTarget = matchingList[0];
          handleSelectPatientFromMultiModal(singleTarget.PatientID, singleTarget);
        } else {
          // NO MATCH FOUND
          if (isMobilePattern && cleanNum.length < 9) {
            setPvSaveSuccess(`‚ö†Ô∏è Please enter at least 9 digits for mobile number search (⁄©ŸÖ ÿßÿ≤ ⁄©ŸÖ 9 €ÅŸÜÿØÿ≥€í ÿØÿ±ÿ¨ ⁄©ÿ±€å⁄∫)`);
          } else {
            setPvSaveSuccess(`‚ö†Ô∏è No patient record found matching "${rawQuery}"`);
          }
          setTimeout(() => setPvSaveSuccess(''), 4000);
        }
      })
      .catch((e) => {
        console.warn('Search query error in NHC history workstation:', e);
      })
      .finally(() => {
        setTimeout(() => {
          setIsSearchLoadingModal(false);
        }, 200);
      });
  };

  const isSamePatient = (id1?: any, id2?: any): boolean => {
    if (!id1 || !id2) return false;
    const s1 = String(id1).trim().toLowerCase();
    const s2 = String(id2).trim().toLowerCase();
    if (s1 === s2) return true;
    return s1.replace(/[^0-9a-zA-Z]/g, '') === s2.replace(/[^0-9a-zA-Z]/g, '');
  };

  const getPatientLastFee = (pid?: string): number => {
    if (!pid) return 500;
    // 1. Check appointments for this patient
    const matchingApps = (appointments || []).filter(a => isSamePatient(a.PatientID, pid) && Number(a.FeeCharged) > 0);
    if (matchingApps.length > 0) {
      return Number(matchingApps[matchingApps.length - 1].FeeCharged);
    }

    // 2. Check visits for this patient
    const matchingVisits = (visits || []).filter(v => isSamePatient(v.PatientID, pid) && Number(v.ConsultationFee) > 0);
    if (matchingVisits.length > 0) {
      return Number(matchingVisits[matchingVisits.length - 1].ConsultationFee);
    }

    // 3. Check invoices for this patient
    const matchingInvoices = (invoices || []).filter(inv => isSamePatient(inv.PatientID, pid) && (Number((inv as any).FeeCharged) > 0 || Number(inv.NetAmount) > 0 || Number(inv.GAmount) > 0));
    if (matchingInvoices.length > 0) {
      const lastInv = matchingInvoices[matchingInvoices.length - 1];
      return Number((lastInv as any).FeeCharged || lastInv.NetAmount || lastInv.GAmount);
    }

    return 500;
  };

  const loadPvPatientHistory = (patId: any, autoTriggerPopup = false) => {
    const cleanId = typeof patId === 'string' ? patId.trim() : String(patId || '').trim();
    if (!cleanId) {
      setPvNhcHistory([]);
      return;
    }
    setIsFetchingPvHistory(true);
    setPvNhcHistory([]);
    const bridgeUrl = window.location.origin;
    fetch(`${bridgeUrl}/api/nhc-patient-history?q=${encodeURIComponent(cleanId)}&limit=200`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data)) {
          setPvNhcHistory(data);
        }
        if (autoTriggerPopup) {
          setHistoryAlertModalOpen(true);
        }
      })
      .catch((e) => {
        console.warn('Could not fetch patient NHC history in Patient Visit:', e.message);
        const matched = (nhcPatients || []).filter((p) => isSamePatient(p.PatientID, cleanId));
        setPvNhcHistory(matched);
        if (autoTriggerPopup) {
          setHistoryAlertModalOpen(true);
        }
      })
      .finally(() => {
        setIsFetchingPvHistory(false);
      });
  };

  const checkAndPromptDirectVisitToken = (patientId: string) => {
    // Disabled direct walk-in popup when searching/selecting patient per user request
    return;
  };

  const handleConfirmDirectVisitToken = () => {
    if (!directVisitShiftModal || !directVisitShiftModal.patient) return;

    const { patient, shift: selectedShift, fee, remarks, autoPrintTicket } = directVisitShiftModal;
    const targetDate = pvVisitDate || new Date().toISOString().split('T')[0];
    const todayStr = new Date().toISOString().split('T')[0];

    // 1. Calculate next token number for this date
    const dailyTokens = (tokens || []).filter((t) => t.Date === targetDate || (!t.Date && targetDate === todayStr));
    const maxTokenNo = dailyTokens.reduce((max, t) => Math.max(max, t.TokenNo || 0), 0);
    const nextTokenNo = maxTokenNo + 1;

    // 2. Create Appointment record for shift revenue tracking
    let nextAppNum = (appointments || []).length + 1;
    let newAppId = `APP-${String(nextAppNum).padStart(3, '0')}`;
    while ((appointments || []).some((a) => a.AppointmentID === newAppId)) {
      nextAppNum++;
      newAppId = `APP-${String(nextAppNum).padStart(3, '0')}`;
    }

    const feeVal = Number(fee) || 0;
    const newApp: Appointment = {
      AppointmentID: newAppId,
      PatientID: patient.PatientID,
      AppointmentDate: targetDate,
      Shift: selectedShift,
      Status: 2, // In Assessment / Checked
      Remarks: remarks || 'Direct Walk-In Consultation',
      FeeCharged: feeVal
    };

    if (feeVal > 0 && onAddAppointment) {
      onAddAppointment(newApp);
    }

    // 3. Create Token record
    const newToken: Token = {
      TokenNo: nextTokenNo,
      PatientID: patient.PatientID,
      Shift: selectedShift,
      Status: 2, // Marked as active/checked
      Date: targetDate
    };

    if (onAddToken) {
      onAddToken(newToken);
    }

    if (autoPrintTicket) {
      handlePrintThermalTokenSlip({
        tokenNo: nextTokenNo,
        patientId: patient.PatientID,
        patientName: patient.PatientName,
        shift: selectedShift,
        date: targetDate,
        fee: feeVal,
        age: patient.AgeYears,
        sex: patient.Sex,
        phone: patient.PhoneMobile
      });
    }

    setPvSaveSuccess(`Direct Consultation Token #${nextTokenNo} generated for ${selectedShift === 1 ? 'Morning Shift (08:30 AM - 12:30 PM)' : 'Evening Shift (05:00 PM - 09:00 PM)'}. Fee charged: PKR ${feeVal}.`);
    setTimeout(() => setPvSaveSuccess(''), 6000);

    setDirectVisitShiftModal(null);
  };

  const selectedPvPatient: Patient | undefined = (() => {
    if (!pvSelectedPatientId) return undefined;
    const cleanSel = String(pvSelectedPatientId).trim().toLowerCase();
    const alphaSel = cleanSel.replace(/[^0-9a-zA-Z]/g, '');

    // 1. Direct or normalized match in main patients list
    const pMatch = patients.find((p) => {
      if (!p || !p.PatientID) return false;
      const pid = String(p.PatientID).trim().toLowerCase();
      return pid === cleanSel || (alphaSel && pid.replace(/[^0-9a-zA-Z]/g, '') === alphaSel);
    });
    if (pMatch) return pMatch;

    // 2. Match in NHC / Archive / pvNhcHistory list
    const allNhc = [...(nhcPatients || []), ...nhcArchiveList, ...pvNhcHistory];
    const nhcMatch = allNhc.find((p) => {
      if (!p || !p.PatientID) return false;
      const pid = String(p.PatientID).trim().toLowerCase();
      return pid === cleanSel || (alphaSel && pid.replace(/[^0-9a-zA-Z]/g, '') === alphaSel);
    });

    if (nhcMatch) {
      const synthPatient: Patient = {
        PatientID: nhcMatch.PatientID,
        PatientName: getResolvedNhcPatientName(nhcMatch, patients, allNhc),
        Father_husband: nhcMatch.Father_husband || '',
        AgeYears: nhcMatch.AgeYears || 0,
        Sex: (nhcMatch.Sex as any) || 'Male',
        MaritalStatus: 'Single',
        Occupation: '',
        Address: nhcMatch.Address || '',
        CityID: 1,
        Country: 'Pakistan',
        PhoneMobile: nhcMatch.PhoneMobile || '',
        RegistrationDate: nhcMatch.RegistrationDate || new Date().toISOString().split('T')[0]
      };
      return synthPatient;
    }

    // 3. Fallback match in dropdown options
    const optMatch = pvPatientDropdownOptions.find((p) => {
      if (!p || !p.PatientID) return false;
      const pid = String(p.PatientID).trim().toLowerCase();
      return pid === cleanSel || (alphaSel && pid.replace(/[^0-9a-zA-Z]/g, '') === alphaSel);
    });

    if (optMatch) {
      const synthPatient: Patient = {
        PatientID: optMatch.PatientID,
        PatientName: optMatch.PatientName,
        Father_husband: '',
        AgeYears: 0,
        Sex: 'Male',
        MaritalStatus: 'Single',
        Occupation: '',
        Address: '',
        CityID: 1,
        Country: 'Pakistan',
        PhoneMobile: optMatch.PhoneMobile || '',
        RegistrationDate: new Date().toISOString().split('T')[0]
      };
      return synthPatient;
    }

    return undefined;
  })();

  const parseCleanVisitDate = (raw: any): string => {
    if (!raw || raw === 'N/A' || String(raw).trim() === '') {
      return pvVisitDate || new Date().toISOString().split('T')[0];
    }
    const str = String(raw).trim();
    if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
      return str.slice(0, 10);
    }
    const parts = str.split(/[\/\-\s]/);
    if (parts.length >= 3 && parts[0].length <= 2 && parts[1].length <= 2 && parts[2].length === 4) {
      const p1 = parseInt(parts[0], 10);
      const p2 = parseInt(parts[1], 10);
      const yr = parts[2];
      if (!isNaN(p1) && !isNaN(p2) && yr) {
        if (p1 > 12) {
          return `${yr}-${String(p2).padStart(2, '0')}-${String(p1).padStart(2, '0')}`;
        } else {
          return `${yr}-${String(p2).padStart(2, '0')}-${String(p1).padStart(2, '0')}`;
        }
      }
    }
    const parsedDate = new Date(str);
    if (!isNaN(parsedDate.getTime())) {
      return parsedDate.toISOString().split('T')[0];
    }
    return str.split(' ')[0].split('T')[0];
  };

  const combinedPreviousHistory = (() => {
    if (!pvSelectedPatientId) return [];

    const historyItems: {
      date: string;
      source: string;
      symptoms: string;
      clinicalMedication: string;
      patientMedication: string;
      medicalReportResult?: string;
      labTestAdvice?: string;
    }[] = [];

    // 1. From local EMR visits
    (visits || [])
      .filter((v) => isSamePatient(v.PatientID, pvSelectedPatientId))
      .forEach((v) => {
        const vMeds = (visitMedicines || []).filter((m) => m.VisitID === v.VisitID);
        const clinicalList = vMeds.filter((m) => m.MedicineType === 'C').map((m) => `${m.ItemID} - ${m.Dosage} (${m.MedicineDetail})`).join('\n');
        const patentList = vMeds.filter((m) => m.MedicineType === 'P').map((m) => `${m.ItemID} - ${m.Dosage} (${m.MedicineDetail})`).join('\n');

        let cText = clinicalList;
        let pText = patentList;
        if (v.VisitRemarks && v.VisitRemarks.includes('Clinical:')) {
          const parts = v.VisitRemarks.split('|');
          const cPart = parts.find((p) => p.includes('Clinical:'));
          const pPart = parts.find((p) => p.includes('Patent:'));
          if (cPart) cText = cPart.replace('Clinical:', '').trim();
          if (pPart) pText = pPart.replace('Patent:', '').trim();
        }

        historyItems.push({
          date: parseCleanVisitDate(v.VisitDate),
          source: 'Clinical EMR Visit',
          symptoms: v.SymptomsDiagnosis || 'N/A',
          clinicalMedication: cText || 'None prescribed',
          patientMedication: pText || 'None prescribed',
          medicalReportResult: v.MedicalReportResult && v.MedicalReportResult !== 'N/A' ? v.MedicalReportResult : 'N/A',
          labTestAdvice: v.LabTestAdvice && v.LabTestAdvice !== 'N/A' ? v.LabTestAdvice : 'N/A'
        });
      });

    // 2. From NHC Patient History archive
    pvNhcHistory
      .filter((nhc) => isSamePatient(nhc.PatientID, pvSelectedPatientId) || !nhc.PatientID)
      .forEach((nhc) => {
        let cMed = nhc.clinicalMedication || nhc.ClinicalMedication || '';
        let pMed = nhc.patientMedication || nhc.PatientMedication || '';

        if (!cMed && nhc.MedicineType === 'C') {
          cMed = `${nhc.PrescribedMedicines || nhc.MedicineDetail || ''} ${nhc.Dosage || ''}`.trim();
        }
        if (!pMed && nhc.MedicineType === 'P') {
          pMed = `${nhc.PrescribedMedicines || nhc.MedicineDetail || ''} ${nhc.Dosage || ''}`.trim();
        }
        const generalMed = nhc.PrescribedMedicines || nhc.MedicineDetail || '';
        if (!cMed && !pMed && generalMed) {
          if (nhc.MedicineType === 'C') cMed = generalMed;
          else pMed = generalMed;
        }

        const mrRes = nhc.MedicalReportResult || (nhc as any).medicalReportResult || (nhc as any).MedicalReportResult || 'N/A';
        const labAdv = nhc.LabTestAdvice || nhc.LabTests || 'N/A';

        const rawNhcDate = nhc.VisitDate || nhc.RegistrationDate || nhc.Date || nhc.CreatedAt || nhc.date;

        historyItems.push({
          date: parseCleanVisitDate(rawNhcDate),
          source: 'NHC Archive',
          symptoms: nhc.SymptomsDiagnosis || nhc.Diagnosis || nhc.Symptoms || nhc.symptoms || nhc.MedicalCondition || 'N/A',
          clinicalMedication: cMed || 'None recorded',
          patientMedication: pMed || 'None recorded',
          medicalReportResult: mrRes !== 'N/A' ? mrRes : 'N/A',
          labTestAdvice: labAdv !== 'N/A' ? labAdv : 'N/A'
        });
      });

    return historyItems;
  })();

  const patientVisitRecords = (() => {
    if (!pvSelectedPatientId) return [];

    const list: {
      id: string;
      date: string;
      symptoms: string;
      visitObj?: Visit;
      nhcObj?: NhcPatientHistory;
    }[] = [];

    const seenIds = new Set<string>();

    (visits || [])
      .filter((v) => isSamePatient(v.PatientID, pvSelectedPatientId))
      .forEach((v) => {
        if (!seenIds.has(v.VisitID)) {
          seenIds.add(v.VisitID);
          list.push({
            id: v.VisitID,
            date: parseCleanVisitDate(v.VisitDate),
            symptoms: v.SymptomsDiagnosis || 'Routine Consultation',
            visitObj: v,
          });
        }
      });

    pvNhcHistory
      .filter((nhc) => isSamePatient(nhc.PatientID, pvSelectedPatientId) || !nhc.PatientID)
      .forEach((nhc, idx) => {
        const vId = ('VisitID' in nhc && nhc.VisitID) ? nhc.VisitID : ('date' in nhc ? `NHC-${nhc.date}` : `NHC-${idx}`);
        if (!seenIds.has(vId)) {
          seenIds.add(vId);
          const rawNhcDate = nhc.VisitDate || nhc.RegistrationDate || nhc.Date || nhc.CreatedAt || nhc.date;
          list.push({
            id: vId,
            date: parseCleanVisitDate(rawNhcDate),
            symptoms: nhc.SymptomsDiagnosis || nhc.Diagnosis || nhc.Symptoms || nhc.symptoms || 'Routine Consultation',
            nhcObj: nhc,
          });
        }
      });

    list.sort((a, b) => b.date.localeCompare(a.date));
    return list;
  })();

  const currentEditingVisitRecordIndex = editingVisitId && patientVisitRecords.length > 0
    ? patientVisitRecords.findIndex((r) => r.id === editingVisitId)
    : -1;

  const uniquePvVisitDates = Array.from(new Set(combinedPreviousHistory.map((item) => item.date)));

  useEffect(() => {
    if (pvSelectedPatientId) {
      if (!isFetchingPvHistory) {
        if (combinedPreviousHistory.length === 0) {
          setHidePreviousHistory(true);
        } else {
          setHidePreviousHistory(false);
        }
      }
    } else {
      setHidePreviousHistory(false);
    }
  }, [pvSelectedPatientId, isFetchingPvHistory, combinedPreviousHistory.length]);

  useEffect(() => {
    if (pvSelectedPatientId) {
      if (uniquePvVisitDates.length > 0) {
        if (lastAutoSelectedPatientRef.current !== pvSelectedPatientId) {
          lastAutoSelectedPatientRef.current = pvSelectedPatientId;
          setPvSelectedHistoryDate(uniquePvVisitDates[0]);
        }
      }
    } else {
      lastAutoSelectedPatientRef.current = '';
      setPvSelectedHistoryDate('ALL');
    }
  }, [pvSelectedPatientId, uniquePvVisitDates.join(',')]);

  const displayedPreviousHistory = combinedPreviousHistory.filter(
    (item) => !pvSelectedHistoryDate || pvSelectedHistoryDate === 'ALL' || item.date === pvSelectedHistoryDate
  );

  const { allClinicalMedText, allClinicalUsageText } = (() => {
    const items = displayedPreviousHistory.filter(
      (item) => item.clinicalMedication && item.clinicalMedication.trim() !== '' && item.clinicalMedication !== 'None prescribed' && item.clinicalMedication !== 'None recorded'
    );
    if (items.length === 0) {
      return { allClinicalMedText: 'No clinical medicines in history.', allClinicalUsageText: 'No clinical dosage in history.' };
    }
    const meds: string[] = [];
    const usages: string[] = [];
    items.forEach((item) => {
      const val = item.clinicalMedication || '';
      if (val.includes(' - ')) {
        const parts = val.split(' - ');
        meds.push(parts[0].trim());
        usages.push(parts.slice(1).join(' - ').trim());
      } else {
        meds.push(val.trim());
        usages.push('As directed');
      }
    });
    return {
      allClinicalMedText: meds.join('\n\n'),
      allClinicalUsageText: usages.join('\n\n')
    };
  })();

  const { allPatentMedText, allPatentUsageText } = (() => {
    const items = displayedPreviousHistory.filter(
      (item) => item.patientMedication && item.patientMedication.trim() !== '' && item.patientMedication !== 'None prescribed' && item.patientMedication !== 'None recorded'
    );
    if (items.length === 0) {
      return { allPatentMedText: 'No patent medicines in history.', allPatentUsageText: 'No patent dosage in history.' };
    }
    const meds: string[] = [];
    const usages: string[] = [];
    items.forEach((item) => {
      const val = item.patientMedication || '';
      if (val.includes(' - ')) {
        const parts = val.split(' - ');
        meds.push(parts[0].trim());
        usages.push(parts.slice(1).join(' - ').trim());
      } else {
        meds.push(val.trim());
        usages.push('As directed');
      }
    });
    return {
      allPatentMedText: meds.join('\n\n'),
      allPatentUsageText: usages.join('\n\n')
    };
  })();

  const allClinicalText = allClinicalMedText === 'No clinical medicines in history.'
    ? 'No clinical medicines in history.'
    : `${allClinicalMedText} - ${allClinicalUsageText}`;

  const allPatentText = allPatentMedText === 'No patent medicines in history.'
    ? 'No patent medicines in history.'
    : `${allPatentMedText} - ${allPatentUsageText}`;

  const allSymptomsText = Array.from(
    new Set(displayedPreviousHistory.map((item) => item.symptoms).filter((s) => s && s !== 'N/A'))
  ).join(' | ');

  const allMedicalReportResultsText = Array.from(
    new Set(displayedPreviousHistory.map((item) => item.medicalReportResult).filter((m) => m && m !== 'N/A'))
  ).join('\n\n');

  const allLabTestsText = Array.from(
    new Set(displayedPreviousHistory.map((item) => item.labTestAdvice).filter((l) => l && l !== 'N/A'))
  ).join(', ');

  const groupedRxByDate = (() => {
    if (!pvSelectedPatientId || displayedPreviousHistory.length === 0) return [];

    interface StructuredRxItem {
      medicineName: string;
      dosage: string;
      type: 'C' | 'P';
      expireDate?: string;
    }

    interface DateRxGroup {
      date: string;
      symptoms?: string;
      medicalReportResult?: string;
      labTestAdvice?: string;
      clinicalItems: StructuredRxItem[];
      patentItems: StructuredRxItem[];
      totalItems: number;
      clinicalMedicinePkr?: number | string;
      filePkr?: number | string;
      cardPkr?: number | string;
    }

    const groupsMap = new Map<string, DateRxGroup>();
    const filteredDates = Array.from(new Set(displayedPreviousHistory.map((item) => item.date)));

    filteredDates.forEach((dateStr) => {
      const clinicalItems: StructuredRxItem[] = [];
      const patentItems: StructuredRxItem[] = [];
      let dateSymptoms = '';
      let dateMedicalReportResult = '';
      let dateLabTestAdvice = '';
      let dateClinPkr: number | string = '';
      let dateFilePkr: number | string = '';
      let dateCardPkr: number | string = '';

      // 1. From local EMR visits for this date
      const dateVisits = (visits || []).filter(
        (v) => isSamePatient(v.PatientID, pvSelectedPatientId) && parseCleanVisitDate(v.VisitDate) === dateStr
      );

      dateVisits.forEach((v) => {
        if (v.SymptomsDiagnosis && v.SymptomsDiagnosis !== 'N/A') {
          dateSymptoms = v.SymptomsDiagnosis;
        }
        if (v.MedicalReportResult && v.MedicalReportResult !== 'N/A') {
          dateMedicalReportResult = v.MedicalReportResult;
        }
        if (v.LabTestAdvice && v.LabTestAdvice !== 'N/A') {
          dateLabTestAdvice = v.LabTestAdvice;
        }

        if (v.ClinicalMedicinePayment && v.ClinicalMedicinePayment !== '0') {
          dateClinPkr = String(v.ClinicalMedicinePayment);
        }
        if ((v as any).FileFee && (v as any).FileFee !== '0') {
          dateFilePkr = String((v as any).FileFee);
        } else if (v.ConsultationFee && v.ConsultationFee !== 0) {
          dateFilePkr = String(v.ConsultationFee);
        }
        if ((v as any).CardFee && (v as any).CardFee !== '0') {
          dateCardPkr = String((v as any).CardFee);
        } else if (v.CardsPayment && v.CardsPayment !== '0') {
          dateCardPkr = String(v.CardsPayment);
        }

        if (v.VisitRemarks) {
          const rem = v.VisitRemarks;
          if (!dateClinPkr || dateClinPkr === '0') {
            const cPkr = rem.match(/Clinical Meds PKR\s*(\d+)/);
            if (cPkr) dateClinPkr = cPkr[1];
          }
          if (!dateFilePkr || dateFilePkr === '0') {
            const fPkr = rem.match(/File PKR\s*(\d+)/);
            if (fPkr) dateFilePkr = fPkr[1];
          }
          if (!dateCardPkr || dateCardPkr === '0') {
            const kPkr = rem.match(/Card PKR\s*(\d+)/);
            if (kPkr) dateCardPkr = kPkr[1];
          }
        }

        const vMeds = (visitMedicines || []).filter((m) => m.VisitID === v.VisitID);
        if (vMeds.length > 0) {
          vMeds.forEach((m) => {
            const medName = m.MedicineDetail || m.ItemID || 'Prescribed Medicine';
            const dosageStr = m.Dosage || 'As directed';
            if (m.MedicineType === 'C') {
              clinicalItems.push({
                medicineName: medName,
                dosage: dosageStr,
                type: 'C',
                expireDate: m.ExpireDate
              });
            } else {
              patentItems.push({
                medicineName: medName,
                dosage: dosageStr,
                type: 'P'
              });
            }
          });
        } else {
          let cText = '';
          let pText = '';
          if (v.VisitRemarks && v.VisitRemarks.includes('Clinical:')) {
            const parts = v.VisitRemarks.split('|');
            const cPart = parts.find((p) => p.includes('Clinical:'));
            const pPart = parts.find((p) => p.includes('Patent:'));
            if (cPart) cText = cPart.replace('Clinical:', '').trim();
            if (pPart) pText = pPart.replace('Patent:', '').trim();
          }
          if (!cText && 'clinicalMedication' in v && (v as any).clinicalMedication) cText = String((v as any).clinicalMedication);
          if (!pText && 'patientMedication' in v && (v as any).patientMedication) pText = String((v as any).patientMedication);

          if (cText && cText !== 'None prescribed' && cText !== 'None recorded') {
            const parts = cText.includes(' - ') ? cText.split(' - ') : [cText, 'As directed'];
            let exp = '';
            const expMatch = cText.match(/\(EXP:\s*([^)]+)\)/);
            if (expMatch) exp = expMatch[1].trim();

            clinicalItems.push({
              medicineName: parts[0].replace(/\(EXP:.*?\)/, '').trim(),
              dosage: parts.slice(1).join(' - ').trim() || 'As directed',
              type: 'C',
              expireDate: exp
            });
          }

          if (pText && pText !== 'None prescribed' && pText !== 'None recorded') {
            const lines = pText.split('\n').filter(Boolean);
            lines.forEach((line) => {
              const parts = line.includes(' - ') ? line.split(' - ') : [line, 'As directed'];
              patentItems.push({
                medicineName: parts[0].trim(),
                dosage: parts.slice(1).join(' - ').trim() || 'As directed',
                type: 'P'
              });
            });
          }
        }
      });

      // 2. From NHC archive for this date
      const dateNhc = pvNhcHistory.filter((nhc) => {
        const rawNhcDate = nhc.VisitDate || nhc.RegistrationDate || nhc.Date || nhc.CreatedAt || nhc.date;
        return (isSamePatient(nhc.PatientID, pvSelectedPatientId) || !nhc.PatientID) && parseCleanVisitDate(rawNhcDate) === dateStr;
      });

      dateNhc.forEach((nhc) => {
        if (!dateSymptoms && (nhc.SymptomsDiagnosis || nhc.Diagnosis || nhc.Symptoms || nhc.symptoms)) {
          dateSymptoms = nhc.SymptomsDiagnosis || nhc.Diagnosis || nhc.Symptoms || nhc.symptoms || '';
        }

        const mr = nhc.MedicalReportResult || (nhc as any).medicalReportResult || (nhc as any).MedicalReportResult;
        if (!dateMedicalReportResult && mr && mr !== 'N/A') {
          dateMedicalReportResult = mr;
        }

        const la = nhc.LabTestAdvice || nhc.LabTests;
        if (!dateLabTestAdvice && la && la !== 'N/A') {
          dateLabTestAdvice = la;
        }

        if (!dateClinPkr && (nhc as any).ClinicalMedicinePayment && (nhc as any).ClinicalMedicinePayment !== '0') {
          dateClinPkr = String((nhc as any).ClinicalMedicinePayment);
        }
        if (!dateFilePkr && (nhc as any).FileFee && (nhc as any).FileFee !== '0') {
          dateFilePkr = String((nhc as any).FileFee);
        } else if (!dateFilePkr && (nhc as any).ConsultationFee && (nhc as any).ConsultationFee !== 0) {
          dateFilePkr = String((nhc as any).ConsultationFee);
        }
        if (!dateCardPkr && (nhc as any).CardFee && (nhc as any).CardFee !== '0') {
          dateCardPkr = String((nhc as any).CardFee);
        } else if (!dateCardPkr && (nhc as any).CardsPayment && (nhc as any).CardsPayment !== '0') {
          dateCardPkr = String((nhc as any).CardsPayment);
        }

        const rem = (nhc as any).VisitRemarks || (nhc as any).Remarks || '';
        if (rem) {
          if (!dateClinPkr || dateClinPkr === '0') {
            const cPkr = rem.match(/Clinical Meds PKR\s*(\d+)/);
            if (cPkr) dateClinPkr = cPkr[1];
          }
          if (!dateFilePkr || dateFilePkr === '0') {
            const fPkr = rem.match(/File PKR\s*(\d+)/);
            if (fPkr) dateFilePkr = fPkr[1];
          }
          if (!dateCardPkr || dateCardPkr === '0') {
            const kPkr = rem.match(/Card PKR\s*(\d+)/);
            if (kPkr) dateCardPkr = kPkr[1];
          }
        }

        const cMedStr = nhc.clinicalMedication || (nhc as any).ClinicalMedication;
        const pMedStr = nhc.patientMedication || (nhc as any).PatientMedication;

        if (cMedStr && cMedStr !== 'None prescribed' && cMedStr !== 'None recorded') {
          cMedStr.split('\n').filter(Boolean).forEach((line) => {
            const parts = line.includes(' - ') ? line.split(' - ') : [line, 'As directed'];
            clinicalItems.push({
              medicineName: parts[0].trim(),
              dosage: parts.slice(1).join(' - ').trim() || 'As directed',
              type: 'C'
            });
          });
        }

        if (pMedStr && pMedStr !== 'None prescribed' && pMedStr !== 'None recorded') {
          pMedStr.split('\n').filter(Boolean).forEach((line) => {
            const parts = line.includes(' - ') ? line.split(' - ') : [line, 'As directed'];
            patentItems.push({
              medicineName: parts[0].trim(),
              dosage: parts.slice(1).join(' - ').trim() || 'As directed',
              type: 'P'
            });
          });
        }

        const rawMed = nhc.MedicineDetail || nhc.PrescribedMedicines || '';
        let medName = rawMed;
        let dosage = nhc.Dosage || 'As directed';

        if (rawMed.includes(' - ')) {
          const parts = rawMed.split(' - ');
          medName = parts[0].trim();
          if (!nhc.Dosage) dosage = parts.slice(1).join(' - ').trim();
        }

        if (nhc.MedicineType === 'C') {
          clinicalItems.push({
            medicineName: medName || 'Clinical Compounded Medicine',
            dosage: dosage || 'As directed',
            type: 'C'
          });
        } else if (nhc.MedicineType === 'P') {
          patentItems.push({
            medicineName: medName || 'Patent Medicine',
            dosage: dosage || 'As directed',
            type: 'P'
          });
        } else if (rawMed && !cMedStr && !pMedStr) {
          patentItems.push({
            medicineName: medName || 'Prescribed Medicine',
            dosage: dosage || 'As directed',
            type: 'P'
          });
        }
      });

      // Filter duplicate items in date group
      const uniqueClinical = clinicalItems.filter(
        (item, index, self) => index === self.findIndex((t) => t.medicineName === item.medicineName && t.dosage === item.dosage)
      );
      const uniquePatent = patentItems.filter(
        (item, index, self) => index === self.findIndex((t) => t.medicineName === item.medicineName && t.dosage === item.dosage)
      );

      if (!dateFilePkr || dateFilePkr === '0') {
        const appMatch = (appointments || []).find(
          (a) =>
            isSamePatient(a.PatientID, pvSelectedPatientId) &&
            parseCleanVisitDate(a.AppointmentDate) === dateStr
        );
        if (appMatch) {
          const appFee = (appMatch as any).PaidAmount || (appMatch as any).ConsultationFee || appMatch.FeeCharged || 0;
          if (appFee) dateFilePkr = String(appFee);
        }
      }
      if (!dateFilePkr || dateFilePkr === '0') {
        const tokMatch = (tokens || []).find(
          (t) =>
            isSamePatient(t.PatientID, pvSelectedPatientId) &&
            parseCleanVisitDate(t.Date) === dateStr
        );
        if (tokMatch) {
          const tokFee = (tokMatch as any).Fee || (tokMatch as any).PaidAmount || 0;
          if (tokFee) dateFilePkr = String(tokFee);
        }
      }

      groupsMap.set(dateStr, {
        date: dateStr,
        symptoms: dateSymptoms,
        medicalReportResult: dateMedicalReportResult,
        labTestAdvice: dateLabTestAdvice,
        clinicalItems: uniqueClinical,
        patentItems: uniquePatent,
        totalItems: uniqueClinical.length + uniquePatent.length,
        clinicalMedicinePkr: dateClinPkr,
        filePkr: dateFilePkr,
        cardPkr: dateCardPkr
      });
    });

    return Array.from(groupsMap.values());
  })();

  const handlePrintThermalTokenSlip = (data: {
    tokenNo: number;
    patientId: string;
    patientName: string;
    shift: 1 | 2;
    date?: string;
    fee?: number;
    age?: number;
    sex?: string;
    phone?: string;
  }) => {
    const printWin = window.open('', '_blank', 'width=420,height=600');
    if (!printWin) {
      alert("Popup blocked! Please allow popups to print thermal token slips.");
      return;
    }

    const clinicName = clinicSettings?.ClinicName || 'PUNJAB HOMEOPATHIC CLINIC & PHARMACY';
    const cPhone = clinicSettings?.PhoneMobile || '+92-311-4000608';
    const cAddress = clinicSettings?.ClinicAddress || '10 Shalimar Road, Garhi Shahu, Lahore';
    const cWebsite = clinicSettings?.Website || 'https://punjabhomeopathic.pk';
    const shiftText = data.shift === 1 ? 'MORNING SHIFT (08:30 AM - 12:00 PM)' : 'EVENING SHIFT (04:30 PM - 09:00 PM)';
    const dateStr = data.date || new Date().toISOString().split('T')[0];
    const timeStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

    printWin.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Token Slip #${data.tokenNo} - ${data.patientName}</title>
          <meta charset="utf-8" />
          <style>
            * {
              box-sizing: border-box !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            @media print {
              @page {
                size: 80mm auto;
                margin: 0;
              }
              html, body {
                width: 100% !important;
                max-width: 100% !important;
                min-width: 100% !important;
                margin: 0 !important;
                padding: 1.5mm 1mm !important;
              }
              .no-print {
                display: none !important;
              }
            }
            html, body {
              width: 100%;
              max-width: 76mm;
              min-width: 72mm;
              margin: 0 auto;
              padding: 4px 2mm;
              color: #000000;
              background: #ffffff;
              font-family: 'Courier New', Courier, 'Lucida Console', Monaco, monospace;
              font-size: 11.5px;
              line-height: 1.25;
              word-wrap: break-word;
              overflow-wrap: break-word;
            }
            .text-center { text-align: center; }
            .full-width { width: 100%; box-sizing: border-box; }
            .clinic-header { text-align: center; margin-bottom: 3px; width: 100%; }
            .clinic-name { font-size: 13.5px; font-weight: 900; text-transform: uppercase; margin: 0; line-height: 1.15; font-family: 'Arial Black', Arial, sans-serif; word-break: break-word; }
            .clinic-sub { font-size: 9.5px; font-weight: bold; color: #111; margin-top: 1.5px; text-transform: uppercase; word-break: break-word; }
            .divider { border-top: 1.5px dashed #000000; margin: 4px 0; width: 100%; }
            
            .token-card {
              border: 2px solid #000000;
              padding: 6px 4px;
              margin: 5px 0;
              text-align: center;
              border-radius: 4px;
              background: #ffffff;
              width: 100%;
              box-sizing: border-box;
            }
            .token-title { font-size: 11px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; font-family: sans-serif; }
            .token-number { font-size: 38px; font-weight: 900; font-family: Arial, sans-serif; margin: 2px 0; line-height: 1; }
            .token-shift { font-size: 9.5px; font-weight: 800; text-transform: uppercase; background: #000000; color: #ffffff; padding: 2.5px 6px; display: inline-block; border-radius: 2px; margin-top: 2px; word-break: break-word; }
            
            .detail-row { display: flex; justify-content: space-between; align-items: baseline; margin: 2.5px 0; font-size: 11px; width: 100%; }
            .detail-label { font-weight: bold; width: 38%; flex-shrink: 0; }
            .detail-val { font-weight: bold; width: 62%; text-align: right; word-break: break-word; }
            
            .fee-box { font-size: 13px; font-weight: 900; text-align: center; padding: 4px; border: 1.5px solid #000000; margin-top: 5px; width: 100%; box-sizing: border-box; }
            .footer-msg { font-size: 9px; text-align: center; margin-top: 6px; font-weight: bold; line-height: 1.35; width: 100%; word-break: break-word; }
          </style>
        </head>
        <body>
          <div class="clinic-header">
            <h2 class="clinic-name">${clinicName}</h2>
            <div class="clinic-sub">OPD CONSULTATION TOKEN SLIP</div>
            <div style="font-size: 8.5px; margin-top: 2px;">${cAddress}</div>
            <div style="font-size: 8.5px; font-weight: bold;">üìû ${cPhone} &nbsp;|&nbsp; üåê ${cWebsite.replace(/^https?:\/\//, '')}</div>
          </div>

          <div class="divider"></div>

          <div class="token-card">
            <div class="token-title">OPD TOKEN NO</div>
            <div class="token-number">#${data.tokenNo}</div>
            <div class="token-shift">${shiftText}</div>
          </div>

          <div class="divider"></div>

          <div class="detail-row">
            <span class="detail-label">PATIENT ID:</span>
            <span class="detail-val" style="font-family: monospace; font-size: 12px;">${data.patientId}</span>
          </div>

          <div class="detail-row">
            <span class="detail-label">PATIENT NAME:</span>
            <span class="detail-val" style="font-size: 12px; text-transform: uppercase;">${data.patientName}</span>
          </div>

          ${data.phone ? `
          <div class="detail-row">
            <span class="detail-label">MOBILE NO:</span>
            <span class="detail-val" style="font-family: monospace;">${data.phone}</span>
          </div>` : ''}

          ${data.age ? `
          <div class="detail-row">
            <span class="detail-label">AGE / GENDER:</span>
            <span class="detail-val">${data.age} Yrs / ${data.sex || 'Male'}</span>
          </div>` : ''}

          <div class="detail-row">
            <span class="detail-label">DATE & TIME:</span>
            <span class="detail-val">${dateStr} ${timeStr}</span>
          </div>

          <div class="fee-box">
            OPD FEE CHARGED: PKR ${data.fee !== undefined ? Number(data.fee).toLocaleString() : '0'}
          </div>

          <div class="divider"></div>

          <div class="footer-msg">
            <p style="margin: 2px 0; text-transform: uppercase;">Please watch LED screen for Token #${data.tokenNo}</p>
            <p style="margin: 2px 0;">Kindly present this token slip to doctor.</p>
            <p style="margin: 4px 0 0 0; font-size: 8px; font-weight: normal;">* 80mm Thermal Printer Token Slip *</p>
          </div>

          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 250);
            };
          </script>
        </body>
      </html>
    `);
    printWin.document.close();
  };

  const handlePrintThermalFromToken = (tok: Token) => {
    const pat = patients.find(p => p.PatientID === tok.PatientID);
    const patName = pat?.PatientName || tok.PatientID;
    const app = appointments.find(a => a.PatientID === tok.PatientID && a.AppointmentDate === tok.Date);
    const feeVal = app?.FeeCharged || 0;

    handlePrintThermalTokenSlip({
      tokenNo: tok.TokenNo,
      patientId: tok.PatientID,
      patientName: patName,
      shift: tok.Shift,
      date: tok.Date,
      fee: feeVal,
      age: pat?.AgeYears,
      sex: pat?.Sex,
      phone: pat?.PhoneMobile
    });
  };

  const handleCleanTokenPrint = () => {
    if (currentUser?.Role !== 'Administrator' && (currentUser?.Permissions?.canPrintTokenSlip === false || userRights.find(r => r.MenuID === 'patients')?.PrintRec === false)) {
      alert("Printing Token Slips is restricted by administrator permissions.");
      return;
    }
    window.print();
  };

  const handleCleanPrintTab = (docType: 'A5_VISIT_SLIP' | 'A4_PRESCRIPTION' | 'A4_LAB_TESTS' | 'A4_PATIENT_INVOICE') => {
    if (docType === 'A5_VISIT_SLIP' && currentUser?.Role !== 'Administrator' && (currentUser?.Permissions?.canPrintVisitSlip === false || userRights.find(r => r.MenuID === 'patients')?.PrintRec === false)) {
      alert("Printing Visit Slips is restricted by administrator permissions.");
      return;
    }
    if (docType === 'A4_PRESCRIPTION' && currentUser?.Role !== 'Administrator' && (currentUser?.Permissions?.canPrintPrescription === false || userRights.find(r => r.MenuID === 'patients')?.PrintRec === false)) {
      alert("Printing Prescription Letterheads is restricted by administrator permissions.");
      return;
    }
    if (docType === 'A4_LAB_TESTS' && currentUser?.Role !== 'Administrator' && (currentUser?.Permissions?.canPrintLabAdvice === false || userRights.find(r => r.MenuID === 'patients')?.PrintRec === false)) {
      alert("Printing Lab Advice Slips is restricted by administrator permissions.");
      return;
    }
    if (docType === 'A4_PATIENT_INVOICE' && currentUser?.Role !== 'Administrator' && (currentUser?.Permissions?.canPrintVisitSlip === false || userRights.find(r => r.MenuID === 'patients')?.PrintRec === false)) {
      alert("Printing Patient Invoice is restricted by administrator permissions.");
      return;
    }

    const elem = document.getElementById('printable-patient-doc');
    if (!elem) {
      window.print();
      return;
    }

    const titleStr = docType === 'A5_VISIT_SLIP'
      ? "Visit Slip"
      : docType === 'A4_LAB_TESTS'
      ? "Lab Test Advice"
      : docType === 'A4_PATIENT_INVOICE'
      ? "Patient Invoice"
      : "Prescription";

    const printWin = window.open('', '_blank', 'width=1000,height=1200');
    if (!printWin) {
      // If popup is blocked by browser, fallback to current window printing
      window.print();
      return;
    }

    // Extract all local stylesheets from current document
    const parentStyles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
      .map(el => el.outerHTML)
      .join('\n');

    printWin.document.write(`
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>${titleStr} - ${selectedPvPatient?.PatientName || 'Patient'} (${selectedPvPatient?.PatientID || ''})</title>
          ${parentStyles}
          <style>
            @page {
              size: A4 portrait;
              margin: 0;
            }
            * {
              box-sizing: border-box !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            html, body {
              margin: 0 !important;
              padding: 0 !important;
              background-color: #f1f5f9;
              color: #0f172a;
              font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            
            /* Screen Preview Toolbar */
            .screen-preview-bar {
              background: #0f172a;
              color: #ffffff;
              padding: 10px 16px;
              display: flex;
              align-items: center;
              justify-content: space-between;
              box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
              position: sticky;
              top: 0;
              z-index: 9999;
            }
            .screen-preview-btn {
              background: #059669;
              color: #ffffff;
              border: none;
              padding: 8px 18px;
              font-size: 13px;
              font-weight: 800;
              border-radius: 8px;
              cursor: pointer;
              display: inline-flex;
              align-items: center;
              gap: 6px;
              box-shadow: 0 2px 4px rgba(0,0,0,0.2);
              transition: background 0.15s ease;
            }
            .screen-preview-btn:hover {
              background: #047857;
            }
            .screen-close-btn {
              background: #334155;
              color: #e2e8f0;
              border: none;
              padding: 8px 14px;
              font-size: 12px;
              font-weight: 700;
              border-radius: 8px;
              cursor: pointer;
              transition: background 0.15s ease;
            }
            .screen-close-btn:hover {
              background: #475569;
            }

            .page-preview-wrapper {
              display: flex;
              justify-content: center;
              padding: 20px 10px;
              background-color: #f1f5f9;
            }

            #printable-patient-doc, #print-container {
              background: #ffffff !important;
              color: #0f172a !important;
              visibility: visible !important;
              opacity: 1 !important;
              display: flex !important;
              justify-content: center !important;
              box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
            }

            img, svg {
              max-width: 100%;
            }
            img[alt*="Logo"], img[alt*="logo"], .logo-img, .brand-logo, .clinic-logo {
              max-height: 70px !important;
              max-width: 100px !important;
              object-fit: contain !important;
            }

            @media print {
              .screen-preview-bar, .no-print, .print\\:hidden, button, header, nav {
                display: none !important;
                visibility: hidden !important;
              }
              html, body {
                width: 100% !important;
                max-width: 100% !important;
                margin: 0 !important;
                padding: 0 !important;
                background: #ffffff !important;
                overflow: visible !important;
                visibility: visible !important;
                display: block !important;
              }
              .page-preview-wrapper {
                padding: 0 !important;
                margin: 0 !important;
                background: transparent !important;
                display: block !important;
              }
              #printable-patient-doc, #print-container {
                box-shadow: none !important;
                border: none !important;
                margin: 0 auto !important;
                padding: 0 !important;
                width: 100% !important;
                background: #ffffff !important;
                visibility: visible !important;
                display: block !important;
                page-break-inside: avoid !important;
                page-break-after: avoid !important;
                break-after: avoid !important;
              }
              /* Explicitly enforce visibility so parentStyles cannot hide children */
              #printable-patient-doc *, #print-container * {
                visibility: visible !important;
              }
            }
          </style>
        </head>
        <body>
          <div class="screen-preview-bar no-print">
            <div style="display: flex; align-items: center; gap: 10px;">
              <strong style="font-size: 14px; font-weight: 900; letter-spacing: 0.5px;">üñ®Ô∏è ${titleStr} Print Preview</strong>
              <span style="font-size: 11px; background: #1e293b; color: #38bdf8; padding: 2px 8px; border-radius: 4px; border: 1px solid #334155;">
                ${selectedPvPatient?.PatientName || 'Patient'} (${selectedPvPatient?.PatientID || ''})
              </span>
            </div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <button class="screen-preview-btn" onclick="window.focus(); window.print();">
                <span>üñ®Ô∏è Print Now (HP LaserJet / PDF)</span>
              </button>
              <button class="screen-close-btn" onclick="window.close();">
                <span>‚úï Close</span>
              </button>
            </div>
          </div>

          <div class="page-preview-wrapper">
            <div id="printable-patient-doc" class="printable-patient-doc">
              <div id="print-container">
                ${elem.innerHTML}
              </div>
            </div>
          </div>

          <script>
            // Ensure fonts and images are loaded before triggering print dialog
            window.addEventListener('load', function() {
              setTimeout(function() {
                try {
                  window.focus();
                  window.print();
                } catch(e) {
                  console.warn("Auto print failed, click 'Print Now' button", e);
                }
              }, 450);
            });
          </script>
        </body>
      </html>
    `);
    printWin.document.close();
  };

  const formatReportDate = (dateStr: string) => {
    if (!dateStr) return '';
    const pts = dateStr.split('-');
    if (pts.length !== 3) return dateStr;
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthIdx = parseInt(pts[1], 10) - 1;
    const monthStr = months[monthIdx] || pts[1];
    return `${pts[2]}-${monthStr}-${pts[0]}`;
  };

  const generateDailyCollectionReport = (start: string, end: string) => {
    const cleanStart = parseCleanVisitDate(start);
    const cleanEnd = parseCleanVisitDate(end);
    const datesSet = new Set<string>();

    const checkDateInRange = (dateStr: string) => {
      if (!dateStr) return false;
      const clean = parseCleanVisitDate(dateStr);
      return clean >= cleanStart && clean <= cleanEnd;
    };

    // Populate all dates sequentially in the selected range if valid
    if (cleanStart && cleanEnd && cleanStart <= cleanEnd) {
      const [sY, sM, sD] = cleanStart.split('-').map(Number);
      const [eY, eM, eD] = cleanEnd.split('-').map(Number);
      if (sY && sM && sD && eY && eM && eD) {
        const cur = new Date(sY, sM - 1, sD, 12, 0, 0);
        const endDate = new Date(eY, eM - 1, eD, 12, 0, 0);
        while (cur <= endDate) {
          const yyyy = cur.getFullYear();
          const mm = String(cur.getMonth() + 1).padStart(2, '0');
          const dd = String(cur.getDate()).padStart(2, '0');
          datesSet.add(`${yyyy}-${mm}-${dd}`);
          cur.setDate(cur.getDate() + 1);
        }
      }
    }

    (appointments || []).forEach(app => {
      if (checkDateInRange(app.AppointmentDate)) {
        datesSet.add(parseCleanVisitDate(app.AppointmentDate));
      }
    });

    (visits || []).forEach(vis => {
      if (checkDateInRange(vis.VisitDate)) {
        datesSet.add(parseCleanVisitDate(vis.VisitDate));
      }
    });

    (invoices || []).forEach(inv => {
      if (checkDateInRange(inv.InvoiceDate)) {
        datesSet.add(parseCleanVisitDate(inv.InvoiceDate));
      }
    });

    if (datesSet.size === 0 && cleanStart) {
      datesSet.add(cleanStart);
    }

    const sortedDates = Array.from(datesSet).sort();

    const getVisShift = (vis: Visit) => {
      if (vis.Shift) return vis.Shift;
      const visCleanDate = parseCleanVisitDate(vis.VisitDate);
      const matchedApp = appointments?.find(
        (a) => a.PatientID === vis.PatientID && parseCleanVisitDate(a.AppointmentDate) === visCleanDate
      );
      if (matchedApp) return matchedApp.Shift || 1;
      const matchedToken = (tokens || [])?.find(
        (t) => t.PatientID === vis.PatientID && parseCleanVisitDate(t.Date) === visCleanDate
      );
      if (matchedToken) return matchedToken.Shift || 1;
      return 1;
    };

    const getVisFees = (v: Visit) => {
      let clin = Number(v.ClinicalMedicinePayment) || 0;
      let file = Number(v.FileFee) || 0;
      let card = Number(v.CardFee) || Number(v.CardsPayment) || 0;
      if (v.VisitRemarks) {
        if (!clin) { const cPkr = v.VisitRemarks.match(/Clinical Meds PKR\s*(\d+)/); if (cPkr) clin = Number(cPkr[1]); }
        if (!file) { const fPkr = v.VisitRemarks.match(/File PKR\s*(\d+)/); if (fPkr) file = Number(fPkr[1]); }
        if (!card) { const kPkr = v.VisitRemarks.match(/Card PKR\s*(\d+)/); if (kPkr) card = Number(kPkr[1]); }
      }
      return { clin, file, card };
    };

    const reportRows = sortedDates.map(date => {
      const appsForDate = (appointments || []).filter(app => parseCleanVisitDate(app.AppointmentDate) === date && app.Status !== 3);
      const visitsForDate = (visits || []).filter(vis => parseCleanVisitDate(vis.VisitDate) === date);
      const invoicesForDate = (invoices || []).filter(inv => parseCleanVisitDate(inv.InvoiceDate) === date && (inv.Status as number) !== 3);

      // MORNING (Shift 1)
      const mAppFromAppointments = appsForDate.filter(a => a.Shift === 1).reduce((sum, a) => sum + (Number(a.FeeCharged) || 0), 0);
      const mAppFromVisits = visitsForDate.filter(v => getVisShift(v) === 1).reduce((sum, v) => {
        const fee = Number(v.ConsultationFee) || 0;
        const hasAppFee = appsForDate.some(a => a.PatientID === v.PatientID && a.Shift === 1 && (Number(a.FeeCharged) || 0) > 0);
        return sum + (hasAppFee ? 0 : fee);
      }, 0);
      const mApp = mAppFromAppointments + mAppFromVisits;

      const mCmed = visitsForDate.filter(v => getVisShift(v) === 1).reduce((sum, v) => sum + getVisFees(v).clin, 0);
      const mCards = visitsForDate.filter(v => getVisShift(v) === 1).reduce((sum, v) => sum + getVisFees(v).card, 0);
      const mFile = visitsForDate.filter(v => getVisShift(v) === 1).reduce((sum, v) => sum + getVisFees(v).file, 0);
      const mStore = invoicesForDate.filter(inv => (inv.shift || (inv as any).Shift || 1) === 1).reduce((sum, inv) => sum + (Number(inv.NetAmount || (inv as any).NetPayable || (inv as any).GrandTotal || (inv as any).GAmount || (inv as any).totalAmount) || 0), 0);
      const mTotal = mApp + mCmed + mCards + mFile + mStore;

      // EVENING (Shift 2)
      const eAppFromAppointments = appsForDate.filter(a => a.Shift === 2).reduce((sum, a) => sum + (Number(a.FeeCharged) || 0), 0);
      const eAppFromVisits = visitsForDate.filter(v => getVisShift(v) === 2).reduce((sum, v) => {
        const fee = Number(v.ConsultationFee) || 0;
        const hasAppFee = appsForDate.some(a => a.PatientID === v.PatientID && a.Shift === 2 && (Number(a.FeeCharged) || 0) > 0);
        return sum + (hasAppFee ? 0 : fee);
      }, 0);
      const eApp = eAppFromAppointments + eAppFromVisits;

      const eCmed = visitsForDate.filter(v => getVisShift(v) === 2).reduce((sum, v) => sum + getVisFees(v).clin, 0);
      const eCards = visitsForDate.filter(v => getVisShift(v) === 2).reduce((sum, v) => sum + getVisFees(v).card, 0);
      const eFile = visitsForDate.filter(v => getVisShift(v) === 2).reduce((sum, v) => sum + getVisFees(v).file, 0);
      const eStore = invoicesForDate.filter(inv => (inv.shift || (inv as any).Shift || 1) === 2).reduce((sum, inv) => sum + (Number(inv.NetAmount || (inv as any).NetPayable || (inv as any).GrandTotal || (inv as any).GAmount || (inv as any).totalAmount) || 0), 0);
      const eTotal = eApp + eCmed + eCards + eFile + eStore;

      const dayTotal = mTotal + eTotal;

      return {
        date,
        morning: { app: mApp, cmed: mCmed, cards: mCards, file: mFile, store: mStore, total: mTotal },
        evening: { app: eApp, cmed: eCmed, cards: eCards, file: eFile, store: eStore, total: eTotal },
        dayTotal
      };
    });

    const morningSummaryTotals = {
      app: reportRows.reduce((sum, r) => sum + r.morning.app, 0),
      cmed: reportRows.reduce((sum, r) => sum + r.morning.cmed, 0),
      cards: reportRows.reduce((sum, r) => sum + r.morning.cards, 0),
      file: reportRows.reduce((sum, r) => sum + r.morning.file, 0),
      store: reportRows.reduce((sum, r) => sum + r.morning.store, 0),
      total: reportRows.reduce((sum, r) => sum + r.morning.total, 0)
    };

    const eveningSummaryTotals = {
      app: reportRows.reduce((sum, r) => sum + r.evening.app, 0),
      cmed: reportRows.reduce((sum, r) => sum + r.evening.cmed, 0),
      cards: reportRows.reduce((sum, r) => sum + r.evening.cards, 0),
      file: reportRows.reduce((sum, r) => sum + r.evening.file, 0),
      store: reportRows.reduce((sum, r) => sum + r.evening.store, 0),
      total: reportRows.reduce((sum, r) => sum + r.evening.total, 0)
    };

    const grandSummaryTotals = {
      app: morningSummaryTotals.app + eveningSummaryTotals.app,
      cmed: morningSummaryTotals.cmed + eveningSummaryTotals.cmed,
      cards: morningSummaryTotals.cards + eveningSummaryTotals.cards,
      file: morningSummaryTotals.file + eveningSummaryTotals.file,
      store: morningSummaryTotals.store + eveningSummaryTotals.store,
      total: morningSummaryTotals.total + eveningSummaryTotals.total
    };

    const pdfRows: any[] = [];
    let pdfGrandTotal = 0;

    sortedDates.forEach((date) => {
      const dateParts = date.split('-');
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const monthIdx = parseInt(dateParts[1], 10) - 1;
      const monthStr = months[monthIdx] || dateParts[1];
      const formattedDate = dateParts.length === 3
        ? `${dateParts[2]}-${monthStr}-${dateParts[0].substring(2)}`
        : date;

      const appsForDate = (appointments || []).filter(app => parseCleanVisitDate(app.AppointmentDate) === date && app.Status !== 3);
      const visitsForDate = (visits || []).filter(vis => parseCleanVisitDate(vis.VisitDate) === date);
      const invoicesForDate = (invoices || []).filter(inv => parseCleanVisitDate(inv.InvoiceDate) === date && (inv.Status as number) !== 3);

      const shiftOrder = [
        { shiftNum: 2, label: 'Evening' },
        { shiftNum: 1, label: 'Morning' }
      ];

      const shiftBlocks: any[] = [];
      let dayTotalAmount = 0;

      shiftOrder.forEach(({ shiftNum, label }) => {
        const apps = appsForDate.filter(a => a.Shift === shiftNum);
        const vis = visitsForDate.filter(v => getVisShift(v) === shiftNum);
        const invs = invoicesForDate.filter(i => (i.shift || (i as any).Shift || 1) === shiftNum);

        const visitedCount = Math.max(vis.length, apps.length);
        const items: { count: number; description: string; amount: number }[] = [];

        const cardsVisits = vis.filter(v => getVisFees(v).card > 0);
        if (cardsVisits.length > 0) {
          items.push({ count: cardsVisits.length, description: 'Cards', amount: cardsVisits.reduce((sum, v) => sum + getVisFees(v).card, 0) });
        }

        const cmedVisits = vis.filter(v => getVisFees(v).clin > 0);
        if (cmedVisits.length > 0) {
          items.push({ count: cmedVisits.length, description: 'Clinical Medicine Charges', amount: cmedVisits.reduce((sum, v) => sum + getVisFees(v).clin, 0) });
        }

        const fileVisits = vis.filter(v => getVisFees(v).file > 0);
        if (fileVisits.length > 0) {
          items.push({ count: fileVisits.length, description: 'Registration File', amount: fileVisits.reduce((sum, v) => sum + getVisFees(v).file, 0) });
        }

        if (invs.length > 0) {
          const storeAmt = invs.reduce((sum, i) => sum + (i.NetAmount || 0), 0);
          if (storeAmt > 0) {
            items.push({ count: invs.length, description: 'Store Collection', amount: storeAmt });
          }
        }

        const appCharges = apps.filter(a => Number(a.FeeCharged || 0) > 0);
        if (appCharges.length > 0) {
          items.push({ count: appCharges.length, description: 'Appointment Charges', amount: appCharges.reduce((sum, a) => sum + Number(a.FeeCharged || 0), 0) });
        }

        if (items.length === 0 && visitedCount > 0) {
          items.push({ count: visitedCount, description: 'Free of Charge', amount: 0 });
        }

        const shiftTotal = items.reduce((sum, it) => sum + it.amount, 0);

        if (visitedCount > 0 || shiftTotal > 0 || items.length > 0) {
          dayTotalAmount += shiftTotal;
          shiftBlocks.push({ shiftLabel: label, visitedCount, items, shiftTotal });
        }
      });

      if (shiftBlocks.length > 0) {
        pdfGrandTotal += dayTotalAmount;
        pdfRows.push({
          date: formattedDate,
          rawDate: date,
          shiftBlocks,
          todayClosing: dayTotalAmount
        });
      }
    });

    // Generate Doctor Shift-Wise Patient Visit & Payment Report Data
    const doctorShiftBlocks: any[] = [];
    let doctorShiftTotalPatients = 0;
    let doctorShiftTotalClinical = 0;
    let doctorShiftTotalFile = 0;
    let doctorShiftTotalCard = 0;
    let doctorShiftTotalStore = 0;
    let doctorShiftTotalPayment = 0;

    sortedDates.forEach((date) => {
      const appsForDate = (appointments || []).filter(app => parseCleanVisitDate(app.AppointmentDate) === date && app.Status !== 3);
      const visitsForDate = (visits || []).filter(vis => parseCleanVisitDate(vis.VisitDate) === date);
      const invoicesForDate = (invoices || []).filter(inv => parseCleanVisitDate(inv.InvoiceDate) === date && (inv.Status as number) !== 3);

      const shifts = [
        { shiftNum: 1, label: 'Morning Shift (Shift 1)' },
        { shiftNum: 2, label: 'Evening Shift (Shift 2)' }
      ];

      shifts.forEach(({ shiftNum, label }) => {
        const visInShift = visitsForDate.filter(v => getVisShift(v) === shiftNum);
        const appsInShift = appsForDate.filter(a => (a.Shift || 1) === shiftNum);
        const invsInShift = invoicesForDate.filter(i => ((i as any).shift || (i as any).Shift || 1) === shiftNum);

        const patientMap = new Map<string, any>();

        visInShift.forEach(v => {
          const pid = v.PatientID || `VIS-${v.VisitID}`;
          if (!patientMap.has(pid)) {
            const pt = (patients || []).find(p => isSamePatient(p.PatientID, v.PatientID));
            patientMap.set(pid, {
              patientId: v.PatientID || 'N/A',
              patientName: pt?.PatientName || (v as any).PatientName || 'Walk-in Patient',
              age: pt?.AgeYears || (v as any).Age || 'N/A',
              gender: pt?.Sex || (v as any).Gender || 'N/A',
              mobileNo: pt?.PhoneMobile || pt?.PhoneRes || (v as any).Phone || 'N/A',
              clinicalFee: 0,
              fileFee: 0,
              cardFee: 0,
              storePayment: 0,
              totalPayment: 0
            });
          }
          const rec = patientMap.get(pid);
          const fees = getVisFees(v);
          const clin = fees.clin + (Number(v.ConsultationFee) || 0);
          rec.clinicalFee += clin;
          rec.fileFee += fees.file;
          rec.cardFee += fees.card;
        });

        appsInShift.forEach(a => {
          const pid = a.PatientID || `APP-${a.AppointmentID}`;
          if (!patientMap.has(pid)) {
            const pt = (patients || []).find(p => isSamePatient(p.PatientID, a.PatientID));
            patientMap.set(pid, {
              patientId: a.PatientID || 'N/A',
              patientName: pt?.PatientName || (a as any).PatientName || 'Appointment Patient',
              age: pt?.AgeYears || 'N/A',
              gender: pt?.Sex || 'N/A',
              mobileNo: pt?.PhoneMobile || pt?.PhoneRes || (a as any).Phone || 'N/A',
              clinicalFee: 0,
              fileFee: 0,
              cardFee: 0,
              storePayment: 0,
              totalPayment: 0
            });
          }
          const rec = patientMap.get(pid);
          if (rec.clinicalFee === 0 && Number(a.FeeCharged || 0) > 0) {
            rec.clinicalFee += Number(a.FeeCharged || 0);
          }
        });

        invsInShift.forEach(inv => {
          const pid = inv.PatientID;
          if (pid && patientMap.has(pid)) {
            const rec = patientMap.get(pid);
            rec.storePayment += Number(inv.NetAmount || (inv as any).GAmount || (inv as any).GrandTotal || 0);
          } else if (pid) {
            const pt = (patients || []).find(p => isSamePatient(p.PatientID, pid));
            patientMap.set(pid, {
              patientId: pid,
              patientName: pt?.PatientName || (inv as any).CustomerName || 'Pharmacy Customer',
              age: pt?.AgeYears || 'N/A',
              gender: pt?.Sex || 'N/A',
              mobileNo: pt?.PhoneMobile || pt?.PhoneRes || (inv as any).CustomerPhone || 'N/A',
              clinicalFee: 0,
              fileFee: 0,
              cardFee: 0,
              storePayment: Number(inv.NetAmount || (inv as any).GAmount || (inv as any).GrandTotal || 0),
              totalPayment: 0
            });
          }
        });

        const patientRows = Array.from(patientMap.values()).map((p, idx) => {
          const total = p.clinicalFee + p.fileFee + p.cardFee + p.storePayment;
          return {
            ...p,
            srNo: idx + 1,
            totalPayment: total
          };
        });

        if (patientRows.length > 0) {
          const shiftClin = patientRows.reduce((sum, p) => sum + p.clinicalFee, 0);
          const shiftFile = patientRows.reduce((sum, p) => sum + p.fileFee, 0);
          const shiftCard = patientRows.reduce((sum, p) => sum + p.cardFee, 0);
          const shiftStore = patientRows.reduce((sum, p) => sum + p.storePayment, 0);
          const shiftTotalPay = patientRows.reduce((sum, p) => sum + p.totalPayment, 0);

          doctorShiftTotalPatients += patientRows.length;
          doctorShiftTotalClinical += shiftClin;
          doctorShiftTotalFile += shiftFile;
          doctorShiftTotalCard += shiftCard;
          doctorShiftTotalStore += shiftStore;
          doctorShiftTotalPayment += shiftTotalPay;

          doctorShiftBlocks.push({
            date,
            shiftNum,
            shiftLabel: label,
            patients: patientRows,
            shiftTotals: {
              patientCount: patientRows.length,
              clinicalFee: shiftClin,
              fileFee: shiftFile,
              cardFee: shiftCard,
              storePayment: shiftStore,
              totalPayment: shiftTotalPay
            }
          });
        }
      });
    });

    return {
      startDate: start,
      endDate: end,
      rows: reportRows,
      morningTotals: morningSummaryTotals,
      eveningTotals: eveningSummaryTotals,
      grandTotals: grandSummaryTotals,
      pdfRows,
      pdfGrandTotal,
      doctorShiftBlocks,
      doctorShiftGrandTotals: {
        totalPatients: doctorShiftTotalPatients,
        clinicalFee: doctorShiftTotalClinical,
        fileFee: doctorShiftTotalFile,
        cardFee: doctorShiftTotalCard,
        storePayment: doctorShiftTotalStore,
        totalPayment: doctorShiftTotalPayment
      }
    };
  };

  const handleCleanPrintDailyCollectionReport = (data: any, format: 'pdf' | 'grid' | 'patient_shift_wise' = 'patient_shift_wise') => {
    if (!data) return;

    const clinicName = clinicSettings?.ClinicName || 'PUNJAB HOMEOPATHIC CLINIC & PHARMACY';
    const clinicAddress = clinicSettings?.ClinicAddress || '10 Shalimar Road, Garhi Shahu, Lahore';
    const phone = clinicSettings?.PhoneMobile || '+92-311-4000608';
    const website = clinicSettings?.Website || 'https://punjabhomeopathic.pk';

    if (format === 'patient_shift_wise') {
      const blocksHtml = (!data.doctorShiftBlocks || data.doctorShiftBlocks.length === 0) ? `
        <tr>
          <td colspan="9" style="padding: 20px; text-align: center; color: #64748b; font-style: italic; font-weight: bold;">
            No patient visit records found for the selected period (${formatReportDate(data.startDate)} to ${formatReportDate(data.endDate)}).
          </td>
        </tr>
      ` : data.doctorShiftBlocks.map((block: any) => {
        const patientRowsHtml = block.patients.map((p: any) => `
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 6px; text-align: center; font-weight: bold; color: #64748b;">${p.srNo}</td>
            <td style="padding: 6px; font-weight: bold; color: #0f172a;">${p.patientName}</td>
            <td style="padding: 6px; text-align: center; font-weight: 600;">${p.age} / ${p.gender}</td>
            <td style="padding: 6px; text-align: center; font-family: monospace;">${p.mobileNo}</td>
            <td style="padding: 6px; text-align: right; font-family: monospace;">Rs. ${(Number(p.clinicalFee) || 0).toLocaleString()}</td>
            <td style="padding: 6px; text-align: right; font-family: monospace;">Rs. ${(Number(p.fileFee) || 0).toLocaleString()}</td>
            <td style="padding: 6px; text-align: right; font-family: monospace;">Rs. ${(Number(p.cardFee) || 0).toLocaleString()}</td>
            <td style="padding: 6px; text-align: right; font-family: monospace;">Rs. ${(Number(p.storePayment) || 0).toLocaleString()}</td>
            <td style="padding: 6px; text-align: right; font-family: monospace; font-weight: 900; color: #047857;">Rs. ${(Number(p.totalPayment) || 0).toLocaleString()}</td>
          </tr>
        `).join('');

        const subtotalRowHtml = `
          <tr style="background-color: #f1f5f9; font-weight: 900; border-top: 2px solid #0f172a; border-bottom: 2px solid #0f172a;">
            <td colspan="4" style="padding: 8px; text-transform: uppercase; color: #0f172a; letter-spacing: 0.5px;">
              ${block.shiftLabel} Subtotal (${block.shiftTotals.patientCount} Patients Visited)
            </td>
            <td style="padding: 8px; text-align: right; font-family: monospace;">Rs. ${(Number(block.shiftTotals.clinicalFee) || 0).toLocaleString()}</td>
            <td style="padding: 8px; text-align: right; font-family: monospace;">Rs. ${(Number(block.shiftTotals.fileFee) || 0).toLocaleString()}</td>
            <td style="padding: 8px; text-align: right; font-family: monospace;">Rs. ${(Number(block.shiftTotals.cardFee) || 0).toLocaleString()}</td>
            <td style="padding: 8px; text-align: right; font-family: monospace;">Rs. ${(Number(block.shiftTotals.storePayment) || 0).toLocaleString()}</td>
            <td style="padding: 8px; text-align: right; font-family: monospace; font-size: 12px; color: #047857;">Rs. ${(Number(block.shiftTotals.totalPayment) || 0).toLocaleString()}</td>
          </tr>
        `;

        return `
          <div style="margin-bottom: 20px; page-break-inside: avoid;">
            <div style="background-color: #0f172a; color: white; padding: 6px 12px; font-weight: bold; font-size: 11px; border-radius: 4px 4px 0 0; display: flex; justify-content: space-between;">
              <span>üóìÔ∏è Date: ${block.date} &nbsp;|&nbsp; ${block.shiftLabel}</span>
              <span style="color: #fde047;">${block.shiftTotals.patientCount} Patients</span>
            </div>
            <table style="width: 100%; border-collapse: collapse; font-size: 10.5px; border: 1px solid #cbd5e1;">
              <thead>
                <tr style="background-color: #f8fafc; font-weight: 900; text-transform: uppercase; font-size: 9.5px; border-bottom: 2px solid #0f172a;">
                  <th style="padding: 6px; text-align: center; width: 35px;">Sr#</th>
                  <th style="padding: 6px; text-align: left;">Patient Name</th>
                  <th style="padding: 6px; text-align: center; width: 90px;">Age/Gender</th>
                  <th style="padding: 6px; text-align: center; width: 100px;">Mobile No</th>
                  <th style="padding: 6px; text-align: right; width: 95px;">Clinical Fee</th>
                  <th style="padding: 6px; text-align: right; width: 75px;">File Fee</th>
                  <th style="padding: 6px; text-align: right; width: 75px;">Card Fee</th>
                  <th style="padding: 6px; text-align: right; width: 85px;">Store Sales</th>
                  <th style="padding: 6px; text-align: right; width: 105px; background-color: #ecfdf5; color: #065f46;">Total Payment</th>
                </tr>
              </thead>
              <tbody>
                ${patientRowsHtml}
                ${subtotalRowHtml}
              </tbody>
            </table>
          </div>
        `;
      }).join('');

      const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Doctor Shift-Wise Patient Visit & Payment Report - ${clinicName}</title>
  <style>
    @page { size: A4 portrait; margin: 10mm; }
    body { font-family: system-ui, -apple-system, sans-serif; color: #0f172a; margin: 0; padding: 15px; background: #ffffff; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .no-print { display: flex; justify-content: space-between; align-items: center; background: #0f172a; color: white; padding: 10px 16px; border-radius: 8px; margin-bottom: 15px; }
    .no-print button { background: #4f46e5; color: white; border: none; padding: 6px 16px; font-weight: bold; border-radius: 6px; cursor: pointer; font-size: 12px; }
    @media print { .no-print { display: none !important; } body { padding: 0; } }
    .header { text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 10px; margin-bottom: 12px; }
    .clinic-title { font-size: 18px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.5px; color: #0f172a; }
    .clinic-address { font-size: 11px; font-weight: 700; color: #334155; margin-top: 2px; }
    .report-title { font-size: 13px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; color: #4338ca; margin-top: 6px; }
    .meta-bar { font-size: 11px; font-weight: 800; color: #1e293b; margin-top: 4px; display: flex; justify-content: center; gap: 20px; }
    .summary-cards { display: grid; grid-template-columns: repeat(6, 1fr); gap: 6px; margin-bottom: 15px; text-align: center; font-size: 10px; }
    .s-card { border: 1px solid #cbd5e1; padding: 6px; border-radius: 6px; background: #f8fafc; }
    .s-card-title { font-size: 8.5px; font-weight: 800; uppercase; color: #64748b; }
    .s-card-val { font-size: 11px; font-weight: 900; color: #0f172a; font-family: monospace; margin-top: 2px; }
    .grand-total-bar { border: 2px solid #0f172a; padding: 10px 14px; margin-top: 20px; background: #f8fafc; font-weight: 900; font-size: 11px; border-radius: 6px; }
    .footer { margin-top: 25px; padding-top: 10px; border-top: 1px solid #cbd5e1; display: flex; justify-content: space-between; font-size: 10px; font-weight: bold; color: #64748b; }
    .signatures { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-top: 35px; text-align: center; font-size: 9px; font-weight: 800; color: #475569; text-transform: uppercase; }
    .sig-line { border-top: 1px solid #94a3b8; padding-top: 6px; }
  </style>
</head>
<body>
  <div class="no-print">
    <div style="font-weight: bold; font-size: 13px;">Doctor Shift-Wise Patient Visit & Payment Report Preview</div>
    <button onclick="window.print()">üñ®Ô∏è Print / Save PDF</button>
  </div>

  <div class="header">
    <div class="clinic-title">${clinicName}</div>
    <div class="clinic-address">üìç ${clinicAddress} &nbsp;|&nbsp; üìû ${phone} &nbsp;|&nbsp; üåê ${website.replace(/^https?:\/\//, '')}</div>
    <div class="report-title">DOCTOR SHIFT-WISE PATIENT VISIT & PAYMENT REPORT</div>
    <div class="meta-bar">
      <span>From Date: <u>${formatReportDate(data.startDate)}</u></span>
      <span>To Date: <u>${formatReportDate(data.endDate)}</u></span>
    </div>
  </div>

  ${data.doctorShiftGrandTotals ? `
    <div class="summary-cards">
      <div class="s-card">
        <div class="s-card-title">Total Patients</div>
        <div class="s-card-val">${data.doctorShiftGrandTotals.totalPatients}</div>
      </div>
      <div class="s-card">
        <div class="s-card-title">Clinical Charges</div>
        <div class="s-card-val">Rs. ${data.doctorShiftGrandTotals.clinicalFee.toLocaleString()}</div>
      </div>
      <div class="s-card">
        <div class="s-card-title">File Fee</div>
        <div class="s-card-val">Rs. ${data.doctorShiftGrandTotals.fileFee.toLocaleString()}</div>
      </div>
      <div class="s-card">
        <div class="s-card-title">Card Fee</div>
        <div class="s-card-val">Rs. ${data.doctorShiftGrandTotals.cardFee.toLocaleString()}</div>
      </div>
      <div class="s-card">
        <div class="s-card-title">Store Sales</div>
        <div class="s-card-val">Rs. ${data.doctorShiftGrandTotals.storePayment.toLocaleString()}</div>
      </div>
      <div class="s-card" style="background-color: #047857; color: white;">
        <div class="s-card-title" style="color: #a7f3d0;">Total Payment</div>
        <div class="s-card-val" style="color: white;">Rs. ${data.doctorShiftGrandTotals.totalPayment.toLocaleString()}</div>
      </div>
    </div>
  ` : ''}

  ${blocksHtml}

  ${data.doctorShiftGrandTotals ? `
    <div class="grand-total-bar">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <span>PERIOD GRAND TOTAL COLLECTION (${data.doctorShiftGrandTotals.totalPatients} PATIENTS VISITED)</span>
        <span style="font-family: monospace; font-size: 15px; color: #047857;">Rs. ${data.doctorShiftGrandTotals.totalPayment.toLocaleString()}</span>
      </div>
    </div>
  ` : ''}

  <div class="signatures">
    <div class="sig-line">DOCTOR SIGNATURE</div>
    <div class="sig-line">CHECKED BY (CASHIER)</div>
    <div class="sig-line">APPROVED BY (ADMIN)</div>
  </div>

  <div class="footer">
    <span>Print Date: ${new Date().toLocaleDateString('en-GB')} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
    <span>Generated By: ${currentUser?.FullName || currentUser?.LoginName || 'ADMIN'}</span>
  </div>

  <script>
    window.onload = function() {
      setTimeout(function() { window.print(); }, 400);
    };
  </script>
</body>
</html>`;

      const printWin = window.open('', '_blank');
      if (printWin) {
        printWin.document.write(htmlContent);
        printWin.document.close();
        printWin.focus();
      }
    } else if (format === 'pdf') {
      const rowsHtml = data.pdfRows.length === 0 ? `
        <tr>
          <td colspan="5" style="padding: 20px; text-align: center; color: #64748b; font-style: italic; font-weight: bold;">
            No collection records found for the selected period (${formatReportDate(data.startDate)} to ${formatReportDate(data.endDate)}).
          </td>
        </tr>
      ` : data.pdfRows.map((dateBlock: any) => {
        return dateBlock.shiftBlocks.map((shiftBlock: any) => {
          const itemRows = shiftBlock.items.map((item: any, itemIdx: number) => `
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 6px 8px; font-weight: bold; color: #0f172a;">${itemIdx === 0 ? `${dateBlock.date} ${shiftBlock.shiftLabel}` : ''}</td>
              <td style="padding: 6px 8px; text-align: center; font-weight: bold; color: #0f172a;">${itemIdx === 0 ? shiftBlock.visitedCount : ''}</td>
              <td style="padding: 6px 8px; text-align: center; font-family: monospace; font-weight: bold;">${item.count || '-'}</td>
              <td style="padding: 6px 8px; color: #1e293b;">${item.description}</td>
              <td style="padding: 6px 8px; text-align: right; font-family: monospace; font-weight: bold;">Rs. ${(Number(item.amount) || 0).toLocaleString()}</td>
            </tr>
          `).join('');

          const shiftTotalRow = `
            <tr style="background-color: #f8fafc; font-weight: bold; border-top: 1px solid #cbd5e1; border-bottom: 1px solid #cbd5e1;">
              <td style="padding: 6px 8px;"></td>
              <td style="padding: 6px 8px;"></td>
              <td style="padding: 6px 8px;"></td>
              <td style="padding: 6px 8px; font-weight: 800; color: #0f172a; text-transform: uppercase;">Shift Total (${shiftBlock.shiftLabel})</td>
              <td style="padding: 6px 8px; text-align: right; font-family: monospace; font-weight: 900; color: #0f172a; border-top: 1px solid #0f172a;">Rs. ${(Number(shiftBlock.shiftTotal) || 0).toLocaleString()}</td>
            </tr>
          `;
          return itemRows + shiftTotalRow;
        }).join('') + `
          <tr style="background-color: #f1f5f9; font-weight: 900; border-top: 2px solid #0f172a; border-bottom: 2px solid #0f172a;">
            <td style="padding: 8px;"></td>
            <td style="padding: 8px;"></td>
            <td style="padding: 8px;"></td>
            <td style="padding: 8px; text-transform: uppercase; color: #0f172a; letter-spacing: 0.5px;">Today Closing (${dateBlock.date})</td>
            <td style="padding: 8px; text-align: right; font-family: monospace; font-size: 13px; color: #0f172a; border-top: 2px solid #0f172a;">Rs. ${(Number(dateBlock.todayClosing) || 0).toLocaleString()}</td>
          </tr>
        `;
      }).join('');

      const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Payment Collection Report - ${clinicName}</title>
  <style>
    @page { size: A4 portrait; margin: 10mm; }
    body { font-family: system-ui, -apple-system, sans-serif; color: #0f172a; margin: 0; padding: 15px; background: #ffffff; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .no-print { display: flex; justify-content: space-between; align-items: center; background: #0f172a; color: white; padding: 10px 16px; border-radius: 8px; margin-bottom: 15px; }
    .no-print button { background: #7e22ce; color: white; border: none; padding: 6px 16px; font-weight: bold; border-radius: 6px; cursor: pointer; font-size: 12px; }
    @media print { .no-print { display: none !important; } body { padding: 0; } }
    .header { text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 10px; margin-bottom: 12px; }
    .clinic-title { font-size: 18px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.5px; color: #0f172a; }
    .clinic-address { font-size: 11px; font-weight: 700; color: #334155; margin-top: 2px; }
    .report-title { font-size: 13px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; color: #0f172a; margin-top: 8px; }
    .meta-bar { font-size: 11px; font-weight: 800; color: #1e293b; margin-top: 4px; display: flex; justify-content: center; gap: 20px; }
    table { width: 100%; border-collapse: collapse; font-size: 11px; margin-top: 10px; border: 1px solid #cbd5e1; }
    th { background: #f8fafc; color: #0f172a; font-weight: 900; text-transform: uppercase; font-size: 10px; padding: 8px; border-bottom: 2px solid #0f172a; border-right: 1px solid #cbd5e1; text-align: left; }
    td { padding: 6px 8px; border-right: 1px solid #cbd5e1; }
    .grand-total-bar { border-top: 2px solid #0f172a; border-bottom: 2px solid #0f172a; padding: 10px 12px; margin-top: 15px; display: flex; justify-content: space-between; align-items: center; background: #f8fafc; font-weight: 900; }
    .footer { margin-top: 25px; padding-top: 10px; border-top: 1px solid #cbd5e1; display: flex; justify-content: space-between; font-size: 10px; font-weight: bold; color: #64748b; }
    .signatures { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-top: 40px; text-align: center; font-size: 9px; font-weight: 800; color: #475569; text-transform: uppercase; }
    .sig-line { border-top: 1px solid #94a3b8; padding-top: 6px; }
  </style>
</head>
<body>
  <div class="no-print">
    <div style="font-weight: bold; font-size: 13px;">Payment Collection Report Preview (A4 Portrait)</div>
    <button onclick="window.print()">üñ®Ô∏è Print / Save PDF</button>
  </div>

  <div class="header">
    <div class="clinic-title">${clinicName}</div>
    <div class="clinic-address">${clinicAddress} ‚Ä¢ Tel: ${phone}</div>
    <div class="report-title">PAYMENT COLLECTION REPORT</div>
    <div class="meta-bar">
      <span>From: <u>${formatReportDate(data.startDate)}</u></span>
      <span>To: <u>${formatReportDate(data.endDate)}</u></span>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width: 22%;">Date & Shift</th>
        <th style="width: 16%; text-align: center;">Patients Visited</th>
        <th style="width: 16%; text-align: center;">No of Patients</th>
        <th style="width: 31%;">Payment Description</th>
        <th style="width: 15%; text-align: right;">Amount</th>
      </tr>
    </thead>
    <tbody>
      ${rowsHtml}
    </tbody>
  </table>

  <div class="grand-total-bar">
    <span style="font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #0f172a;">GRAND TOTAL COLLECTION</span>
    <span style="font-family: monospace; font-size: 16px; color: #0f172a;">Rs. ${(Number(data.pdfGrandTotal) || 0).toLocaleString()}</span>
  </div>

  <div class="signatures">
    <div class="sig-line">PREPARED BY (CASHIER)</div>
    <div class="sig-line">CHECKED BY (ACCOUNTANT)</div>
    <div class="sig-line">APPROVED BY (ADMIN)</div>
  </div>

  <div class="footer">
    <span>Print Date: ${new Date().toLocaleDateString('en-GB')} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
    <span>Generated By: ${currentUser?.FullName || currentUser?.LoginName || 'ADMIN'}</span>
  </div>

  <script>
    window.onload = function() {
      setTimeout(function() { window.print(); }, 400);
    };
  </script>
</body>
</html>`;

      const printWin = window.open('', '_blank');
      if (printWin) {
        printWin.document.write(htmlContent);
        printWin.document.close();
        printWin.focus();
      }
    } else {
      // GRID FORMAT (A4 Landscape)
      const rowsHtml = data.rows.length === 0 ? `
        <tr>
          <td colspan="14" style="padding: 20px; text-align: center; color: #64748b; font-style: italic; font-weight: bold;">
            No transaction records found for the selected period.
          </td>
        </tr>
      ` : data.rows.map((row: any) => {
        const pts = row.date.split('-');
        const dateDisp = pts.length === 3 ? `${pts[2]}-${pts[1]}-${pts[0].substring(2)}` : row.date;
        return `
          <tr style="border-bottom: 1px solid #cbd5e1; font-family: monospace;">
            <td style="padding: 5px 6px; text-align: center; font-family: sans-serif; font-weight: bold; color: #0f172a;">${dateDisp}</td>
            <td style="padding: 5px 6px; text-align: right;">${row.morning.app || '-'}</td>
            <td style="padding: 5px 6px; text-align: right;">${row.morning.cmed || '-'}</td>
            <td style="padding: 5px 6px; text-align: right;">${row.morning.cards || '-'}</td>
            <td style="padding: 5px 6px; text-align: right;">${row.morning.file || '-'}</td>
            <td style="padding: 5px 6px; text-align: right;">${row.morning.store || '-'}</td>
            <td style="padding: 5px 6px; text-align: right; background-color: #f1f5f9; font-weight: bold; color: #0f172a;">${row.morning.total || '-'}</td>
            <td style="padding: 5px 6px; text-align: right;">${row.evening.app || '-'}</td>
            <td style="padding: 5px 6px; text-align: right;">${row.evening.cmed || '-'}</td>
            <td style="padding: 5px 6px; text-align: right;">${row.evening.cards || '-'}</td>
            <td style="padding: 5px 6px; text-align: right;">${row.evening.file || '-'}</td>
            <td style="padding: 5px 6px; text-align: right;">${row.evening.store || '-'}</td>
            <td style="padding: 5px 6px; text-align: right; background-color: #f1f5f9; font-weight: bold; color: #0f172a;">${row.evening.total || '-'}</td>
            <td style="padding: 5px 6px; text-align: right; background-color: #e2e8f0; font-family: sans-serif; font-weight: 900; color: #0f172a;">${(Number(row.dayTotal) || 0).toLocaleString()}</td>
          </tr>
        `;
      }).join('');

      const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Daily Collection Grid-View Summary - ${clinicName}</title>
  <style>
    @page { size: A4 landscape; margin: 8mm; }
    body { font-family: system-ui, -apple-system, sans-serif; color: #0f172a; margin: 0; padding: 12px; background: #ffffff; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .no-print { display: flex; justify-content: space-between; align-items: center; background: #0f172a; color: white; padding: 8px 14px; border-radius: 8px; margin-bottom: 12px; }
    .no-print button { background: #7e22ce; color: white; border: none; padding: 6px 16px; font-weight: bold; border-radius: 6px; cursor: pointer; font-size: 12px; }
    @media print { .no-print { display: none !important; } body { padding: 0; } }
    .header { text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 8px; margin-bottom: 12px; }
    .clinic-title { font-size: 18px; font-weight: 900; text-transform: uppercase; color: #0f172a; }
    .report-title { font-size: 13px; font-weight: 800; color: #334155; margin-top: 2px; }
    .meta-bar { font-size: 11px; font-weight: 700; color: #475569; margin-top: 4px; }
    table { width: 100%; border-collapse: collapse; font-size: 10px; margin-top: 8px; border: 1px solid #94a3b8; }
    th { border: 1px solid #94a3b8; padding: 5px; text-align: center; font-weight: 800; font-size: 9px; }
    td { border: 1px solid #cbd5e1; }
    .th-morn { background: #eff6ff; color: #1d4ed8; text-transform: uppercase; }
    .th-eve { background: #fef3c7; color: #b45309; text-transform: uppercase; }
    .summary-container { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 15px; }
    .summary-box { border: 1px solid #cbd5e1; border-radius: 6px; padding: 8px; background: #fafafa; }
    .summary-box h3 { font-size: 10px; font-weight: 900; text-transform: uppercase; margin: 0 0 6px 0; color: #0f172a; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; }
    .summary-table { width: 100%; border-collapse: collapse; font-size: 9.5px; }
    .summary-table th, .summary-table td { border: 1px solid #cbd5e1; padding: 4px 6px; }
    .summary-table th { background: #f1f5f9; font-weight: 800; }
    .signatures { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-top: 25px; text-align: center; font-size: 9px; font-weight: 800; color: #475569; text-transform: uppercase; }
    .sig-line { border-top: 1px solid #94a3b8; padding-top: 4px; }
  </style>
</head>
<body>
  <div class="no-print">
    <div style="font-weight: bold; font-size: 13px;">Daily Collection Grid-View Summary (A4 Landscape)</div>
    <button onclick="window.print()">üñ®Ô∏è Print / Save PDF</button>
  </div>

  <div class="header">
    <div class="clinic-title">${clinicName}</div>
    <div class="report-title">DAILY COLLECTION REPORT (CLINIC & STORE) - GRID-VIEW SUMMARY</div>
    <div class="meta-bar">
      Period: <strong>${formatReportDate(data.startDate)}</strong> to <strong>${formatReportDate(data.endDate)}</strong>
    </div>
  </div>

  <table>
    <thead>
      <tr style="background-color: #f8fafc;">
        <th rowSpan="2" style="width: 8%;">Date</th>
        <th colSpan="6" class="th-morn">Morning Shift</th>
        <th colSpan="6" class="th-eve">Evening Shift</th>
        <th rowSpan="2" style="width: 10%; background-color: #f1f5f9;">Day Total</th>
      </tr>
      <tr style="background-color: #f1f5f9; font-size: 8.5px;">
        <th style="width: 6.5%;">App</th>
        <th style="width: 6.5%;">C.med</th>
        <th style="width: 6.5%;">Cards</th>
        <th style="width: 6.5%;">File</th>
        <th style="width: 6.5%;">Store</th>
        <th style="width: 7.5%; background-color: #dbeafe; font-weight: 900;">Total</th>
        <th style="width: 6.5%;">App</th>
        <th style="width: 6.5%;">C.med</th>
        <th style="width: 6.5%;">Cards</th>
        <th style="width: 6.5%;">File</th>
        <th style="width: 6.5%;">Store</th>
        <th style="width: 7.5%; background-color: #fef3c7; font-weight: 900;">Total</th>
      </tr>
    </thead>
    <tbody>
      ${rowsHtml}
      ${data.rows.length > 0 ? `
        <tr style="background-color: #f8fafc; font-weight: 900; font-size: 10px; border-top: 2px solid #0f172a;">
          <td style="padding: 6px; text-align: center; text-transform: uppercase;">Total</td>
          <td style="padding: 6px; text-align: right; font-family: monospace;">${data.morningTotals.app || '-'}</td>
          <td style="padding: 6px; text-align: right; font-family: monospace;">${data.morningTotals.cmed || '-'}</td>
          <td style="padding: 6px; text-align: right; font-family: monospace;">${data.morningTotals.cards || '-'}</td>
          <td style="padding: 6px; text-align: right; font-family: monospace;">${data.morningTotals.file || '-'}</td>
          <td style="padding: 6px; text-align: right; font-family: monospace;">${data.morningTotals.store || '-'}</td>
          <td style="padding: 6px; text-align: right; font-family: monospace; background-color: #dbeafe; color: #1e3a8a;">${data.morningTotals.total || '-'}</td>
          <td style="padding: 6px; text-align: right; font-family: monospace;">${data.eveningTotals.app || '-'}</td>
          <td style="padding: 6px; text-align: right; font-family: monospace;">${data.eveningTotals.cmed || '-'}</td>
          <td style="padding: 6px; text-align: right; font-family: monospace;">${data.eveningTotals.cards || '-'}</td>
          <td style="padding: 6px; text-align: right; font-family: monospace;">${data.eveningTotals.file || '-'}</td>
          <td style="padding: 6px; text-align: right; font-family: monospace;">${data.eveningTotals.store || '-'}</td>
          <td style="padding: 6px; text-align: right; font-family: monospace; background-color: #fef3c7; color: #78350f;">${data.eveningTotals.total || '-'}</td>
          <td style="padding: 6px; text-align: right; font-family: sans-serif; font-size: 11px; background-color: #0f172a; color: #ffffff;">Rs. ${data.grandTotals.total.toLocaleString()}</td>
        </tr>
      ` : ''}
    </tbody>
  </table>

  <div class="summary-container">
    <div class="summary-box">
      <h3>Summary 1: Revenue Categories</h3>
      <table class="summary-table">
        <thead>
          <tr>
            <th>Category</th>
            <th style="text-align: right;">Morning</th>
            <th style="text-align: right;">Evening</th>
            <th style="text-align: right; background-color: #e2e8f0;">Total</th>
          </tr>
        </thead>
        <tbody style="font-family: monospace;">
          <tr>
            <td style="font-family: sans-serif; font-weight: bold;">Appointments (App)</td>
            <td style="text-align: right;">${data.morningTotals.app || '-'}</td>
            <td style="text-align: right;">${data.eveningTotals.app || '-'}</td>
            <td style="text-align: right; font-weight: bold; background: #f8fafc;">${data.grandTotals.app || '-'}</td>
          </tr>
          <tr>
            <td style="font-family: sans-serif; font-weight: bold;">Clinical Medicine (C.med)</td>
            <td style="text-align: right;">${data.morningTotals.cmed || '-'}</td>
            <td style="text-align: right;">${data.eveningTotals.cmed || '-'}</td>
            <td style="text-align: right; font-weight: bold; background: #f8fafc;">${data.grandTotals.cmed || '-'}</td>
          </tr>
          <tr>
            <td style="font-family: sans-serif; font-weight: bold;">Cards Fee</td>
            <td style="text-align: right;">${data.morningTotals.cards || '-'}</td>
            <td style="text-align: right;">${data.eveningTotals.cards || '-'}</td>
            <td style="text-align: right; font-weight: bold; background: #f8fafc;">${data.grandTotals.cards || '-'}</td>
          </tr>
          <tr>
            <td style="font-family: sans-serif; font-weight: bold;">File Fee</td>
            <td style="text-align: right;">${data.morningTotals.file || '-'}</td>
            <td style="text-align: right;">${data.eveningTotals.file || '-'}</td>
            <td style="text-align: right; font-weight: bold; background: #f8fafc;">${data.grandTotals.file || '-'}</td>
          </tr>
          <tr>
            <td style="font-family: sans-serif; font-weight: bold;">Store Sales</td>
            <td style="text-align: right;">${data.morningTotals.store || '-'}</td>
            <td style="text-align: right;">${data.eveningTotals.store || '-'}</td>
            <td style="text-align: right; font-weight: bold; background: #f8fafc;">${data.grandTotals.store || '-'}</td>
          </tr>
          <tr style="font-weight: 900; background-color: #f1f5f9;">
            <td style="font-family: sans-serif; text-transform: uppercase;">Total Cumulative</td>
            <td style="text-align: right;">${data.morningTotals.total || '-'}</td>
            <td style="text-align: right;">${data.eveningTotals.total || '-'}</td>
            <td style="text-align: right; background-color: #0f172a; color: white;">Rs. ${data.grandTotals.total.toLocaleString()}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="summary-box">
      <h3>Summary 2: Grouping Overview</h3>
      <table class="summary-table">
        <thead>
          <tr>
            <th>Grouping</th>
            <th style="text-align: right;">Morning</th>
            <th style="text-align: right;">Evening</th>
            <th style="text-align: right; background-color: #e2e8f0;">Total</th>
          </tr>
        </thead>
        <tbody style="font-family: monospace;">
          <tr>
            <td style="font-family: sans-serif; font-weight: bold;">App & C.med</td>
            <td style="text-align: right;">${(data.morningTotals.app + data.morningTotals.cmed) || '-'}</td>
            <td style="text-align: right;">${(data.eveningTotals.app + data.eveningTotals.cmed) || '-'}</td>
            <td style="text-align: right; font-weight: bold; background: #f8fafc;">${(data.grandTotals.app + data.grandTotals.cmed) || '-'}</td>
          </tr>
          <tr>
            <td style="font-family: sans-serif; font-weight: bold;">Cards & File</td>
            <td style="text-align: right;">${(data.morningTotals.cards + data.morningTotals.file) || '-'}</td>
            <td style="text-align: right;">${(data.eveningTotals.cards + data.eveningTotals.file) || '-'}</td>
            <td style="text-align: right; font-weight: bold; background: #f8fafc;">${(data.grandTotals.cards + data.grandTotals.file) || '-'}</td>
          </tr>
          <tr>
            <td style="font-family: sans-serif; font-weight: bold;">Store</td>
            <td style="text-align: right;">${data.morningTotals.store || '-'}</td>
            <td style="text-align: right;">${data.eveningTotals.store || '-'}</td>
            <td style="text-align: right; font-weight: bold; background: #f8fafc;">${data.grandTotals.store || '-'}</td>
          </tr>
          <tr style="font-weight: 900; background-color: #f1f5f9;">
            <td style="font-family: sans-serif; text-transform: uppercase;">Total Cumulative</td>
            <td style="text-align: right;">${data.morningTotals.total || '-'}</td>
            <td style="text-align: right;">${data.eveningTotals.total || '-'}</td>
            <td style="text-align: right; background-color: #0f172a; color: white;">Rs. ${data.grandTotals.total.toLocaleString()}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  <div class="signatures">
    <div class="sig-line">PREPARED BY (ACCOUNTANT)</div>
    <div class="sig-line">CHECKED BY (ACCOUNTANT)</div>
    <div class="sig-line">APPROVED BY (ADMIN)</div>
  </div>

  <div class="footer" style="margin-top: 15px; display: flex; justify-content: space-between; font-size: 9px; font-weight: bold; color: #64748b;">
    <span>Print Date: ${new Date().toLocaleDateString('en-GB')} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
    <span>Generated By: ${currentUser?.FullName || currentUser?.LoginName || 'ADMIN'}</span>
  </div>

  <script>
    window.onload = function() {
      setTimeout(function() { window.print(); }, 400);
    };
  </script>
</body>
</html>`;

      const printWin = window.open('', '_blank');
      if (printWin) {
        printWin.document.write(htmlContent);
        printWin.document.close();
        printWin.focus();
      }
    }
  };

  const handlePrintDailyReport = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    const targetDate = pvVisitDate || todayStr;
    setReportStartDate(targetDate);
    setReportEndDate(targetDate);
    setIsReportDateModalOpen(true);
  };

  const handlePrintDailyReportOld = () => {
    const targetDate = pvVisitDate || new Date().toISOString().split('T')[0];
    const targetShift = shift;
    const shiftLabel = targetShift === 1 ? 'MORNING SHIFT (08:30 - 12:30)' : 'EVENING SHIFT (17:00 - 21:00)';
    const currentUserTitle = currentUser?.FullName || currentUser?.LoginName || 'Staff';

    // Collect visits for this shift and date
    const shiftVisitsList: {
      srNo: number;
      tokenNo?: number;
      patientId: string;
      patientName: string;
      clinicalMeds: number;
      fileFee: number;
      cardFee: number;
      opdFee: number;
      total: number;
      remarks: string;
    }[] = [];

    (visits || []).forEach((v) => {
      const vDate = v.VisitDate ? v.VisitDate.split('T')[0] : '';
      if (vDate === targetDate) {
        const matchedToken = (tokens || []).find(
          (t) => t.PatientID === v.PatientID && (t.Date ? t.Date.split('T')[0] : targetDate) === targetDate
        );
        const vShift = v.Shift || matchedToken?.Shift || targetShift;
        if (vShift === targetShift) {
          let clin = Number(v.ClinicalMedicinePayment) || 0;
          let file = Number(v.FileFee) || 0;
          let card = Number(v.CardFee) || Number(v.CardsPayment) || 0;
          if (v.VisitRemarks) {
            if (!clin) { const cPkr = v.VisitRemarks.match(/Clinical Meds PKR\s*(\d+)/); if (cPkr) clin = Number(cPkr[1]); }
            if (!file) { const fPkr = v.VisitRemarks.match(/File PKR\s*(\d+)/); if (fPkr) file = Number(fPkr[1]); }
            if (!card) { const kPkr = v.VisitRemarks.match(/Card PKR\s*(\d+)/); if (kPkr) card = Number(kPkr[1]); }
          }
          const opdFee = Number(v.ConsultationFee) || 0;
          const total = clin + file + card + opdFee;

          const pObj = patients.find(p => p.PatientID === v.PatientID) || (nhcPatients || []).find(p => p.PatientID === v.PatientID);
          const patientName = pObj ? pObj.PatientName : `Patient ${v.PatientID}`;

          shiftVisitsList.push({
            srNo: shiftVisitsList.length + 1,
            tokenNo: matchedToken?.TokenNo,
            patientId: v.PatientID,
            patientName,
            clinicalMeds: clin,
            fileFee: file,
            cardFee: card,
            opdFee,
            total,
            remarks: v.SymptomsDiagnosis || v.VisitRemarks || 'Routine Visit'
          });
        }
      }
    });

    // Collect Store Invoices for this shift and date
    const shiftInvoicesList: {
      srNo: number;
      invoiceNo: string;
      patientId: string;
      patientName: string;
      amount: number;
    }[] = [];

    (invoices || []).forEach((inv) => {
      const invDate = inv.InvoiceDate ? inv.InvoiceDate.split('T')[0] : '';
      const invShift = inv.shift || 1;
      if (invDate === targetDate && invShift === targetShift) {
        const pObj = patients.find(p => p.PatientID === inv.PatientID) || (nhcPatients || []).find(p => p.PatientID === inv.PatientID);
        shiftInvoicesList.push({
          srNo: shiftInvoicesList.length + 1,
          invoiceNo: inv.InvoiceNo,
          patientId: inv.PatientID,
          patientName: pObj ? pObj.PatientName : (inv.PatientID || 'Walk-in'),
          amount: Number(inv.NetAmount) || 0
        });
      }
    });

    const printWin = window.open('', '_blank', 'width=1000,height=1100');
    if (!printWin) {
      window.print();
      return;
    }

    const todayDisplay = formatDisplayDate(targetDate);
    const printTimeStr = new Date().toLocaleString('en-US', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: true
    });

    const tableRowsHtml = shiftVisitsList.map(v => `
      <tr class="hover:bg-slate-50">
        <td class="p-1.5 border border-slate-300 text-center font-mono font-bold">${v.srNo}</td>
        <td class="p-1.5 border border-slate-300 text-center font-mono font-bold">${v.tokenNo ? `#${v.tokenNo}` : '-'}</td>
        <td class="p-1.5 border border-slate-300 font-semibold">
          <div>${v.patientName}</div>
          <div class="text-[9px] font-mono text-slate-500">${v.patientId}</div>
        </td>
        <td class="p-1.5 border border-slate-300 text-right font-mono">${v.clinicalMeds ? `PKR ${v.clinicalMeds.toLocaleString()}` : '-'}</td>
        <td class="p-1.5 border border-slate-300 text-right font-mono">${v.fileFee ? `PKR ${v.fileFee.toLocaleString()}` : '-'}</td>
        <td class="p-1.5 border border-slate-300 text-right font-mono">${v.cardFee ? `PKR ${v.cardFee.toLocaleString()}` : '-'}</td>
        <td class="p-1.5 border border-slate-300 text-right font-mono">${v.opdFee ? `PKR ${v.opdFee.toLocaleString()}` : '-'}</td>
        <td class="p-1.5 border border-slate-300 text-right font-mono font-bold text-slate-900">PKR ${v.total.toLocaleString()}</td>
      </tr>
    `).join('');

    const invoiceRowsHtml = shiftInvoicesList.map(inv => `
      <tr class="hover:bg-slate-50">
        <td class="p-1.5 border border-slate-300 text-center font-mono font-bold">${inv.srNo}</td>
        <td class="p-1.5 border border-slate-300 font-mono font-bold">${inv.invoiceNo}</td>
        <td class="p-1.5 border border-slate-300 font-semibold">${inv.patientName} (${inv.patientId})</td>
        <td class="p-1.5 border border-slate-300 text-right font-mono font-bold text-slate-900">PKR ${inv.amount.toLocaleString()}</td>
      </tr>
    `).join('');

    const parentStyles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
      .map(el => el.outerHTML)
      .join('\n');

    printWin.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Daily Shift Collection Report - ${shiftLabel}</title>
          ${parentStyles}
          <style>
            @page { size: A4 portrait; margin: 10mm; }
            body { font-family: system-ui, -apple-system, sans-serif; color: #0f172a; background: #ffffff; }
            img[alt*="Logo"], img[alt*="logo"], .logo-img, .brand-logo, .clinic-logo {
              max-height: 70px !important;
              max-width: 100px !important;
              object-fit: contain !important;
            }
            @media print {
              .no-print { display: none !important; }
              body { margin: 0; padding: 0; }
            }
          </style>
        </head>
        <body class="p-4 sm:p-6 text-slate-900">
          <div class="no-print mb-4 p-3 bg-slate-900 text-white rounded-xl flex items-center justify-between shadow-lg">
            <div class="text-xs font-bold">
              <span>Daily Shift Collection & Patient Visits Report</span>
              <span class="text-emerald-400 ml-2 font-mono">(${shiftLabel})</span>
            </div>
            <button onclick="window.print()" class="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-lg transition cursor-pointer flex items-center space-x-1">
              <span>Print Report</span>
            </button>
          </div>

          <div class="border-b-2 border-slate-900 pb-3 mb-3 text-center">
            <h1 class="text-xl font-black text-slate-900 uppercase tracking-wide">${clinicSettings?.ClinicName ? clinicSettings.ClinicName.toUpperCase() : 'PUNJAB HOMEOPATHIC CLINIC & HEALTHCARE SYSTEM'}</h1>
            <h2 class="text-xs font-extrabold text-emerald-800 uppercase tracking-wider mt-0.5">DAILY SHIFT COLLECTION & PATIENT VISITS REPORT</h2>
            <p class="text-[11px] font-semibold text-slate-600 mt-0.5">Patient Desk & Pharmacy Collection Ledger</p>
          </div>

          <div class="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-300 text-xs mb-4">
            <div>
              <p><span class="font-bold text-slate-600">Report Date:</span> <span class="font-mono font-extrabold text-slate-900">${todayDisplay}</span></p>
              <p class="mt-1"><span class="font-bold text-slate-600">Active Shift:</span> <span class="font-extrabold text-emerald-900">${shiftLabel}</span></p>
            </div>
            <div class="text-right">
              <p><span class="font-bold text-slate-600">Generated By:</span> <span class="font-bold text-slate-900">${currentUserTitle}</span></p>
              <p class="mt-1"><span class="font-bold text-slate-600">Printed At:</span> <span class="font-mono text-slate-700">${printTimeStr}</span></p>
            </div>
          </div>

          <div class="mb-5">
            <h3 class="text-xs font-black text-slate-900 uppercase tracking-wider mb-2 border-l-4 border-emerald-600 pl-2">Collection Summary Breakdown</h3>
            <div class="grid grid-cols-3 gap-2 text-center">
              <div class="p-2 bg-slate-50 rounded-lg border border-slate-200">
                <span class="text-[9px] uppercase font-bold text-slate-500">Clinical Medicine</span>
                <p class="text-xs font-black text-slate-900 font-mono mt-0.5">PKR ${shiftDailyCollection.clinicalMedsTotal.toLocaleString()}</p>
              </div>
              <div class="p-2 bg-slate-50 rounded-lg border border-slate-200">
                <span class="text-[9px] uppercase font-bold text-slate-500">File Fee</span>
                <p class="text-xs font-black text-slate-900 font-mono mt-0.5">PKR ${shiftDailyCollection.fileTotal.toLocaleString()}</p>
              </div>
              <div class="p-2 bg-slate-50 rounded-lg border border-slate-200">
                <span class="text-[9px] uppercase font-bold text-slate-500">Card Fee</span>
                <p class="text-xs font-black text-slate-900 font-mono mt-0.5">PKR ${shiftDailyCollection.cardTotal.toLocaleString()}</p>
              </div>
              <div class="p-2 bg-slate-50 rounded-lg border border-slate-200">
                <span class="text-[9px] uppercase font-bold text-slate-500">OPD / Token Fee</span>
                <p class="text-xs font-black text-slate-900 font-mono mt-0.5">PKR ${shiftDailyCollection.opdTotal.toLocaleString()}</p>
              </div>
              <div class="p-2 bg-slate-50 rounded-lg border border-slate-200">
                <span class="text-[9px] uppercase font-bold text-slate-500">Store / Pharmacy</span>
                <p class="text-xs font-black text-slate-900 font-mono mt-0.5">PKR ${shiftDailyCollection.storePaymentTotal.toLocaleString()}</p>
              </div>
              <div class="p-2 bg-slate-900 text-white rounded-lg border border-slate-950">
                <span class="text-[9px] uppercase font-bold text-emerald-400">Grand Total</span>
                <p class="text-sm font-black text-amber-300 font-mono mt-0.5">PKR ${shiftDailyCollection.grandTotal.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div class="mb-5">
            <h3 class="text-xs font-black text-slate-900 uppercase tracking-wider mb-2 border-l-4 border-emerald-600 pl-2">
              Patient Visit Details (${shiftVisitsList.length} Visits)
            </h3>
            ${shiftVisitsList.length === 0 ? `
              <div class="p-4 bg-slate-50 rounded-lg border border-slate-200 text-center text-xs text-slate-500 italic">
                No patient visit records recorded for this shift on ${todayDisplay}.
              </div>
            ` : `
              <table class="w-full text-left text-[11px] border-collapse border border-slate-300">
                <thead>
                  <tr class="bg-slate-800 text-white font-bold uppercase text-[10px]">
                    <th class="p-1.5 border border-slate-700 text-center">Sr #</th>
                    <th class="p-1.5 border border-slate-700 text-center">Token #</th>
                    <th class="p-1.5 border border-slate-700">Patient ID & Name</th>
                    <th class="p-1.5 border border-slate-700 text-right">Clinical</th>
                    <th class="p-1.5 border border-slate-700 text-right">File</th>
                    <th class="p-1.5 border border-slate-700 text-right">Card</th>
                    <th class="p-1.5 border border-slate-700 text-right">OPD</th>
                    <th class="p-1.5 border border-slate-700 text-right">Total</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-200">
                  ${tableRowsHtml}
                </tbody>
                <tfoot>
                  <tr class="bg-slate-100 font-extrabold text-slate-900 border-t-2 border-slate-800">
                    <td colspan="3" class="p-1.5 border border-slate-300 text-right uppercase text-[10px]">Subtotal:</td>
                    <td class="p-1.5 border border-slate-300 text-right font-mono">PKR ${shiftDailyCollection.clinicalMedsTotal.toLocaleString()}</td>
                    <td class="p-1.5 border border-slate-300 text-right font-mono">PKR ${shiftDailyCollection.fileTotal.toLocaleString()}</td>
                    <td class="p-1.5 border border-slate-300 text-right font-mono">PKR ${shiftDailyCollection.cardTotal.toLocaleString()}</td>
                    <td class="p-1.5 border border-slate-300 text-right font-mono">PKR ${shiftDailyCollection.opdTotal.toLocaleString()}</td>
                    <td class="p-1.5 border border-slate-300 text-right font-mono font-black text-emerald-900">
                      PKR ${(shiftDailyCollection.clinicalFileCardSubtotal + shiftDailyCollection.opdTotal).toLocaleString()}
                    </td>
                  </tr>
                </tfoot>
              </table>
            `}
          </div>

          ${shiftInvoicesList.length > 0 ? `
            <div class="mb-5">
              <h3 class="text-xs font-black text-slate-900 uppercase tracking-wider mb-2 border-l-4 border-blue-600 pl-2">
                Pharmacy / Store Collection Details (${shiftInvoicesList.length} Sales)
              </h3>
              <table class="w-full text-left text-[11px] border-collapse border border-slate-300">
                <thead>
                  <tr class="bg-slate-800 text-white font-bold uppercase text-[10px]">
                    <th class="p-1.5 border border-slate-700 text-center">Sr #</th>
                    <th class="p-1.5 border border-slate-700">Invoice #</th>
                    <th class="p-1.5 border border-slate-700">Patient ID & Name</th>
                    <th class="p-1.5 border border-slate-700 text-right">Amount (PKR)</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-200">
                  ${invoiceRowsHtml}
                </tbody>
                <tfoot>
                  <tr class="bg-slate-100 font-extrabold text-slate-900 border-t-2 border-slate-800">
                    <td colspan="3" class="p-1.5 border border-slate-300 text-right uppercase text-[10px]">Store Sales Subtotal:</td>
                    <td class="p-1.5 border border-slate-300 text-right font-mono font-black text-emerald-900">PKR ${shiftDailyCollection.storePaymentTotal.toLocaleString()}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          ` : ''}

          <div class="mt-10 pt-4 border-t border-slate-300 flex justify-between text-xs text-slate-700 font-semibold">
            <div>
              <p>Prepared By: __________________________</p>
              <p class="text-[10px] text-slate-500 mt-1">(${currentUserTitle})</p>
            </div>
            <div>
              <p>Accounts Verified By: __________________________</p>
              <p class="text-[10px] text-slate-500 mt-1">(Stamp & Signature)</p>
            </div>
          </div>

          <script>
            setTimeout(() => {
              window.focus();
              window.print();
            }, 300);
          </script>
        </body>
      </html>
    `);

    printWin.document.close();
  };

  const handlePrintClaimBill = (customPatient?: Patient | null) => {
    const pat = customPatient || selectedPvPatient;
    if (!pat) {
      alert('Please select a patient first to print the Organization Claim Bill.');
      return;
    }

    const orgName = claimBillOrg === 'Custom' ? (claimBillCustomOrg.trim() || 'Corporate / Private Organization') : claimBillOrg;
    const targetDate = pvVisitDate || new Date().toISOString().split('T')[0];
    const formattedDate = formatDisplayDate(targetDate);

    const appt = (appointments || []).find(a => a.PatientID === pat.PatientID && a.AppointmentDate.startsWith(targetDate));
    const consultationFee = Number(appt?.FeeCharged) || 0;

    // Calculate itemized charges
    const clinMedsFee = Number(pvClinicalMedicinePkr) || 0;
    const fileFee = Number(pvFilePkr) || 0;
    const cardFee = Number(pvCardPkr) || 0;
    const totalAmount = clinMedsFee + fileFee + cardFee + consultationFee;

    // Medicines prescribed
    const activeMedsList = [
      ...pvClinicalItems.filter(i => i.medicineName && i.medicineName.trim()),
      ...pvPatientItems.filter(i => i.medicineName && i.medicineName.trim())
    ];

    const printWin = window.open('', '_blank', 'width=950,height=1100');
    if (!printWin) {
      window.print();
      return;
    }

    const printTimeStr = new Date().toLocaleString('en-US', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: true
    });

    const currentUserTitle = currentUser?.FullName || currentUser?.LoginName || 'Attending Specialist';

    const parentStyles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
      .map(el => el.outerHTML)
      .join('\n');

    printWin.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Medical Reimbursement Claim Bill - ${pat.PatientName}</title>
          ${parentStyles}
          <style>
            @page { size: A4 portrait; margin: 12mm 15mm; }
            body { font-family: system-ui, -apple-system, sans-serif; color: #0f172a; background: #ffffff; }
            img[alt*="Logo"], img[alt*="logo"], .logo-img, .brand-logo, .clinic-logo {
              max-height: 70px !important;
              max-width: 100px !important;
              object-fit: contain !important;
            }
            @media print {
              .no-print { display: none !important; }
              body { margin: 0; padding: 0; }
            }
          </style>
        </head>
        <body class="p-6 text-slate-900 max-w-[210mm] mx-auto">
          <div class="no-print mb-4 p-3 bg-slate-900 text-white rounded-xl flex items-center justify-between shadow-lg">
            <div class="text-xs font-bold flex items-center space-x-2">
              <span>Organization Claim Bill / Receipt Preview</span>
              <span class="text-amber-300 bg-slate-800 px-2 py-0.5 rounded border border-slate-700 font-mono">
                Claim for: ${orgName}
              </span>
            </div>
            <button onclick="window.print()" class="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-lg transition cursor-pointer flex items-center space-x-1">
              <span>Print Claim Bill</span>
            </button>
          </div>

          <!-- Official Punjab Homeopathic Clinic A4 Letterhead -->
          <div class="border-b-4 border-slate-900 pb-4 mb-4">
            <div class="flex items-center justify-between gap-4">
              <!-- Official Clinic Logo -->
              <div class="w-20 h-20 shrink-0 flex items-center justify-center">
                <img src="${clinicSettings?.ClinicLogoImage || '/nhc_logo.svg'}" alt="PHC Logo" class="max-w-full max-h-full object-contain" />
              </div>

              <!-- Center Branding -->
              <div class="text-center flex-1">
                <h1 class="text-2xl sm:text-3xl font-black text-red-900 uppercase tracking-tight font-serif">${clinicSettings?.ClinicName || 'PUNJAB HOMEOPATHIC CLINIC'}</h1>
                <p class="text-[10px] font-extrabold text-emerald-800 tracking-widest uppercase mt-0.5">HEALING NATURALLY ‚Ä¢ RESTORING BALANCE</p>
                <p class="text-[11px] font-bold text-slate-800 mt-1">${clinicSettings?.DoctorName || 'Dr. Ejaz Ahmad, D.H.M.S (Pak)'} &nbsp;|&nbsp; PHC Regd. Healthcare Facility</p>
                <p class="text-[10px] text-slate-600 mt-0.5">${clinicSettings?.ClinicAddress || '10 Shalimar Road, Garhi Shahu, Lahore'} ‚Ä¢ Cell: ${clinicSettings?.PhoneMobile || '+92-311-4000608'} ‚Ä¢ Web: ${(clinicSettings?.Website || 'https://punjabhomeopathic.pk').replace(/^https?:\/\//, '')}</p>
                <div class="inline-block mt-2 px-3 py-1 bg-slate-900 text-white font-black text-[11px] uppercase tracking-wider rounded">
                  OFFICIAL MEDICAL REIMBURSEMENT CLAIM BILL & CASH RECEIPT
                </div>
              </div>

              <!-- Right Verification Stamp Badge -->
              <div class="w-20 h-20 shrink-0 text-right text-[9px] text-slate-500 font-mono hidden sm:block">
                <div class="border-2 border-slate-800 rounded p-1.5 text-center bg-slate-50">
                  <span class="block font-black text-slate-900 uppercase">A4 OFFICIAL</span>
                  <span class="block font-black text-emerald-800 text-[10px]">CLAIM BILL</span>
                  <span class="block text-[8px] text-slate-600">VERIFIED</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Invoice Metadata & Claim Target Box -->
          <div class="bg-slate-50 p-3.5 rounded-xl border border-slate-300 text-xs mb-4 grid grid-cols-2 gap-4">
            <div>
              <p><span class="font-bold text-slate-500">Bill / Receipt No:</span> <span class="font-mono font-extrabold text-slate-900">CLM-${Date.now().toString().slice(-6)}</span></p>
              <p class="mt-1"><span class="font-bold text-slate-500">Visit / Billing Date:</span> <span class="font-mono font-bold text-slate-900">${formattedDate}</span></p>
              <p class="mt-1"><span class="font-bold text-slate-500">Claim Organization / Employer:</span> <span class="font-extrabold text-emerald-900 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300 inline-block">${orgName}</span></p>
            </div>
            <div class="text-right">
              <p><span class="font-bold text-slate-500">Patient MR ID:</span> <span class="font-mono font-black text-slate-900">${pat.PatientID}</span></p>
              <p class="mt-1"><span class="font-bold text-slate-500">Employee / Designation:</span> <span class="font-bold text-slate-900">${claimBillEmployeeId || claimBillDesignation || 'N/A'}</span></p>
              <p class="mt-1"><span class="font-bold text-slate-500">Issued On:</span> <span class="font-mono text-slate-700">${printTimeStr}</span></p>
            </div>
          </div>

          <!-- Patient Particulars Box -->
          <div class="mb-4 bg-white p-3 rounded-xl border border-slate-300 text-xs">
            <h3 class="text-[11px] font-black text-slate-900 uppercase tracking-wider mb-2 border-l-4 border-slate-900 pl-2">Patient Particulars</h3>
            <div class="grid grid-cols-3 gap-2">
              <div>
                <span class="text-slate-500 text-[10px] font-bold block uppercase">Patient Name</span>
                <span class="font-extrabold text-slate-900 text-sm">${pat.PatientName}</span>
              </div>
              <div>
                <span class="text-slate-500 text-[10px] font-bold block uppercase">Father / Husband Name</span>
                <span class="font-bold text-slate-800">${pat.Father_husband || 'N/A'}</span>
              </div>
              <div>
                <span class="text-slate-500 text-[10px] font-bold block uppercase">Age / Gender / Contact</span>
                <span class="font-bold text-slate-800">${pat.AgeYears ? `${pat.AgeYears} Yrs` : ''} ${pat.Sex ? `/ ${pat.Sex}` : ''} ${pat.PhoneMobile ? `- ${pat.PhoneMobile}` : ''}</span>
              </div>
            </div>
          </div>

          <!-- Itemized Financial Breakdown Table -->
          <div class="mb-4">
            <h3 class="text-[11px] font-black text-slate-900 uppercase tracking-wider mb-2 border-l-4 border-emerald-600 pl-2">Itemized Medical & Treatment Charges</h3>
            <table class="w-full text-left text-xs border-collapse border border-slate-300">
              <thead>
                <tr class="bg-slate-900 text-white font-bold uppercase text-[10px]">
                  <th class="p-2 border border-slate-700 text-center w-12">Sr #</th>
                  <th class="p-2 border border-slate-700">Description of Healthcare Service / Medical Item</th>
                  <th class="p-2 border border-slate-700 text-center w-32">Category</th>
                  <th class="p-2 border border-slate-700 text-right w-36">Amount (PKR)</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-200">
                ${consultationFee > 0 ? `
                  <tr>
                    <td class="p-2 border border-slate-300 text-center font-mono font-bold">1</td>
                    <td class="p-2 border border-slate-300 font-bold">OPD Specialist Medical Consultation & Checkup Fee</td>
                    <td class="p-2 border border-slate-300 text-center text-[10px] font-semibold text-slate-600">Consultation</td>
                    <td class="p-2 border border-slate-300 text-right font-mono font-bold">PKR ${consultationFee.toLocaleString()}</td>
                  </tr>
                ` : ''}
                ${clinMedsFee > 0 ? `
                  <tr>
                    <td class="p-2 border border-slate-300 text-center font-mono font-bold">2</td>
                    <td class="p-2 border border-slate-300 font-bold">Clinical Medicines & Pharmacy Dispensing Charges</td>
                    <td class="p-2 border border-slate-300 text-center text-[10px] font-semibold text-slate-600">Pharmacy / Meds</td>
                    <td class="p-2 border border-slate-300 text-right font-mono font-bold">PKR ${clinMedsFee.toLocaleString()}</td>
                  </tr>
                ` : ''}
                ${fileFee > 0 ? `
                  <tr>
                    <td class="p-2 border border-slate-300 text-center font-mono font-bold">3</td>
                    <td class="p-2 border border-slate-300 font-bold">Patient Medical File Folder & Record Management Fee</td>
                    <td class="p-2 border border-slate-300 text-center text-[10px] font-semibold text-slate-600">Documentation</td>
                    <td class="p-2 border border-slate-300 text-right font-mono font-bold">PKR ${fileFee.toLocaleString()}</td>
                  </tr>
                ` : ''}
                ${cardFee > 0 ? `
                  <tr>
                    <td class="p-2 border border-slate-300 text-center font-mono font-bold">4</td>
                    <td class="p-2 border border-slate-300 font-bold">Hospital Identification Card & Registration Fee</td>
                    <td class="p-2 border border-slate-300 text-center text-[10px] font-semibold text-slate-600">Registration</td>
                    <td class="p-2 border border-slate-300 text-right font-mono font-bold">PKR ${cardFee.toLocaleString()}</td>
                  </tr>
                ` : ''}
                ${(consultationFee === 0 && clinMedsFee === 0 && fileFee === 0 && cardFee === 0) ? `
                  <tr>
                    <td class="p-2 border border-slate-300 text-center font-mono font-bold">1</td>
                    <td class="p-2 border border-slate-300 font-bold">OPD Specialist Consultation & Medical Examination Services</td>
                    <td class="p-2 border border-slate-300 text-center text-[10px] font-semibold text-slate-600">General OPD</td>
                    <td class="p-2 border border-slate-300 text-right font-mono font-bold">PKR 0</td>
                  </tr>
                ` : ''}
              </tbody>
              <tfoot>
                <tr class="bg-slate-900 text-white font-black border-t-2 border-slate-900">
                  <td colspan="3" class="p-2 text-right uppercase text-xs">Total Reimbursable Amount Claimed:</td>
                  <td class="p-2 text-right font-mono text-sm text-amber-300 font-black">PKR ${totalAmount.toLocaleString()}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          <!-- Prescribed Treatment Summary for Organization Audit -->
          ${activeMedsList.length > 0 ? `
            <div class="mb-4 bg-slate-50 p-3 rounded-xl border border-slate-300">
              <h4 class="text-[10px] font-black uppercase text-slate-700 tracking-wider mb-1">Prescribed Medical Treatment Summary</h4>
              <div class="flex flex-wrap gap-1.5 text-xs font-semibold text-slate-800">
                ${activeMedsList.map(m => `<span class="bg-white border border-slate-300 px-2 py-0.5 rounded font-mono text-[11px]">${m.medicineName} ${m.dosage ? `(${m.dosage})` : ''}</span>`).join('')}
              </div>
            </div>
          ` : ''}

          <!-- Diagnostic Advice Summary if any -->
          ${pvLabTestAdvice ? `
            <div class="mb-4 bg-purple-50 p-3 rounded-xl border border-purple-200">
              <h4 class="text-[10px] font-black uppercase text-purple-900 tracking-wider mb-1">Advised Laboratory & Diagnostic Investigations</h4>
              <p class="text-xs font-mono text-purple-950 font-bold">${pvLabTestAdvice}</p>
            </div>
          ` : ''}

          <!-- Payment Status Stamp & Authorization -->
          <div class="mt-8 pt-4 border-t-2 border-slate-300 grid grid-cols-2 gap-4 items-end">
            <div>
              <div class="inline-block border-2 border-emerald-600 p-2.5 rounded-lg text-emerald-800 bg-emerald-50 text-center shadow-xs">
                <span class="block text-[10px] font-black uppercase tracking-widest">PAYMENT RECEIPT STAMP</span>
                <span class="block text-xs font-black font-mono mt-0.5">PAID IN FULL - PKR ${totalAmount.toLocaleString()}</span>
              </div>
              ${claimBillRemarks ? `<p class="text-[10px] text-slate-600 mt-2 italic font-medium">Remarks: ${claimBillRemarks}</p>` : ''}
            </div>

            <div class="text-right space-y-8">
              <div>
                <p class="text-xs font-bold text-slate-900">Attending Specialist / Authorized Signatory</p>
                <div class="mt-8 border-b border-slate-400 w-48 ml-auto"></div>
                <p class="text-[10px] text-slate-500 mt-0.5">(${currentUserTitle} - Hospital Accounts Stamp)</p>
              </div>
            </div>
          </div>

          <div class="mt-8 text-center text-[9px] text-slate-400 border-t border-slate-200 pt-2">
            This is an official computer-generated medical reimbursement bill issued for claim with <strong>${orgName}</strong>. Valid for employer, health insurance & corporate medical reimbursement.
          </div>

          <script>
            setTimeout(() => {
              window.focus();
              window.print();
            }, 300);
          </script>
        </body>
      </html>
    `);

    printWin.document.close();
  };

  const handleOpenNewPatientModal = () => {
    setNewPatientSearchQuery('');
    setPvSelectedPatientId('');
    setPvPatientSearch('');
    resetPvConsultationFields('');
    setPvNhcHistory([]);
    setPvSelectedHistoryDate('ALL');
    setIsNewPatientSearchModalOpen(true);
  };

  const handleSelectPatientFromModal = (targetPatId: string) => {
    setIsNewPatientSearchModalOpen(false);

    // Reset visit fields for fresh entry
    resetPvConsultationFields(targetPatId);

    if (targetPatId) {
      setPvSelectedPatientId(targetPatId);
      setPvPatientSearch(targetPatId);
      setPvSelectedHistoryDate('ALL');
      loadPvPatientHistory(targetPatId, false);
      checkAndPromptDirectVisitToken(targetPatId);

      const ptObj = patients.find((p) => p.PatientID === targetPatId) || (nhcPatients || []).find((p) => p.PatientID === targetPatId);
      const name = ptObj ? ptObj.PatientName : targetPatId;
      const tok = (tokens || []).find((t) => t.PatientID === targetPatId);

      const msg = `Selected Patient Record: ${name} (ID: ${targetPatId})${tok ? ` - Token #${tok.TokenNo}` : ''}`;
      setPvSaveSuccess(msg);
      setTimeout(() => setPvSaveSuccess(''), 5000);
    } else {
      // Create blank form for walk-in patient
      setPvSelectedPatientId('');
      setPvPatientSearch('');
      setPvNhcHistory([]);
      setPvSaveSuccess('Form cleared for New Patient Entry');
      setTimeout(() => setPvSaveSuccess(''), 4000);
    }
  };

  const handleReadyForNextPatient = (prevPatientName?: string) => {
    // Find next waiting token or patient in queue
    const waitingTokens = (tokens || []).filter(
      (t) => t.Status === 1 && t.PatientID && t.PatientID !== pvSelectedPatientId
    );

    let nextPatId = '';
    let nextTokNo: number | undefined;
    let nextPatName = '';

    if (waitingTokens.length > 0) {
      const nextTok = waitingTokens[0];
      nextPatId = nextTok.PatientID;
      nextTokNo = nextTok.TokenNo;
      const pt = patients.find((p) => p.PatientID === nextPatId);
      nextPatName = pt?.PatientName || nextPatId;
    } else {
      const currIdx = pvPatientDropdownOptions.findIndex((p) => p.PatientID === pvSelectedPatientId);
      if (currIdx >= 0 && currIdx < pvPatientDropdownOptions.length - 1) {
        const nextOpt = pvPatientDropdownOptions[currIdx + 1];
        nextPatId = nextOpt.PatientID;
        nextTokNo = nextOpt.tokenNo;
        nextPatName = nextOpt.PatientName;
      }
    }

    resetPvConsultationFields(nextPatId);

    if (nextPatId) {
      setPvSelectedPatientId(nextPatId);
      setPvSelectedHistoryDate('ALL');
      loadPvPatientHistory(nextPatId, false);

      const msg = prevPatientName
        ? `‚úì Visit saved for ${prevPatientName} & token checked! Ready for Next Patient: ${nextTokNo ? `[Token #${nextTokNo}] ` : ''}${nextPatName}`
        : `Ready for Next Patient: ${nextTokNo ? `[Token #${nextTokNo}] ` : ''}${nextPatName}`;
      setPvSaveSuccess(msg);
    } else {
      setPvSelectedPatientId('');
      setPvNhcHistory([]);

      const msg = prevPatientName
        ? `‚úì Visit saved for ${prevPatientName} & token checked! Queue completed. Desk ready for next patient.`
        : `Desk cleared & ready for next patient.`;
      setPvSaveSuccess(msg);
    }

    setPvSaveError('');
    setTimeout(() => setPvSaveSuccess(''), 6000);
  };

  const handleAddNewVisit = () => {
    handleReadyForNextPatient();
  };

  const handleEditVisit = (visit: Visit | NhcPatientHistory) => {
    const vId = ('VisitID' in visit && visit.VisitID) ? visit.VisitID : ('date' in visit ? `NHC-${visit.date}` : `VIS-${Date.now()}`);
    setEditingVisitId(vId);

    if ('VisitDate' in visit && visit.VisitDate) {
      setPvVisitDate(visit.VisitDate.split('T')[0]);
    } else if ('date' in visit && visit.date) {
      setPvVisitDate(visit.date);
    }

    if ('SymptomsDiagnosis' in visit && visit.SymptomsDiagnosis) {
      setPvSymptomsDiagnosis(visit.SymptomsDiagnosis);
    } else if ('symptoms' in visit && visit.symptoms) {
      setPvSymptomsDiagnosis(visit.symptoms);
    }

    if ('MedicalReportResult' in visit && visit.MedicalReportResult && visit.MedicalReportResult !== 'N/A') {
      setPvMedicalReportResult(visit.MedicalReportResult);
    } else {
      setPvMedicalReportResult('');
    }

    if ('LabTestAdvice' in visit && visit.LabTestAdvice) {
      setPvLabTestAdvice(visit.LabTestAdvice);
    } else {
      setPvLabTestAdvice('');
    }

    let clinical = '';
    let patent = '';
    let expDate = '';

    const matchedVMeds = visitMedicines.filter(vm => vm.VisitID === vId && vm.MedicineType === 'C');
    if (matchedVMeds.length > 0 && matchedVMeds[0].ExpireDate) {
      expDate = matchedVMeds[0].ExpireDate;
    }

    if ('clinicalMedication' in visit && visit.clinicalMedication) {
      clinical = String(visit.clinicalMedication);
    }
    if ('patientMedication' in visit && visit.patientMedication) {
      patent = String(visit.patientMedication);
    }

    if ('VisitRemarks' in visit && visit.VisitRemarks) {
      const rem = visit.VisitRemarks;
      if (rem.includes('Clinical:')) {
        const cMatch = rem.match(/Clinical:\s*([^|]+)/);
        if (cMatch && !clinical) clinical = cMatch[1].trim();
      }
      if (rem.includes('Patent:')) {
        const pMatch = rem.match(/Patent:\s*([^|]+)/);
        if (pMatch && !patent) patent = pMatch[1].trim();
      }
      if (rem.includes('Medical Reports:')) {
        const mrMatch = rem.match(/Medical Reports:\s*([^|]+)/);
        if (mrMatch && mrMatch[1].trim() !== 'N/A') setPvMedicalReportResult(mrMatch[1].trim());
      }
      if (rem.includes('Lab Tests:')) {
        const lMatch = rem.match(/Lab Tests:\s*([^|]+)/);
        if (lMatch) setPvLabTestAdvice(lMatch[1].trim());
      }
      if (!expDate) {
        const expMatch = rem.match(/\(EXP:\s*([^)]+)\)/);
        if (expMatch) expDate = expMatch[1].trim();
      }
    }

    let opdFeePkr = ('ConsultationFee' in visit && visit.ConsultationFee) ? String(visit.ConsultationFee) : '';
    let clinPkr = ('ClinicalMedicinePayment' in visit && visit.ClinicalMedicinePayment && visit.ClinicalMedicinePayment !== '0') ? String(visit.ClinicalMedicinePayment) : '';
    let filePkr = ('FileFee' in visit && (visit as any).FileFee && (visit as any).FileFee !== '0') ? String((visit as any).FileFee) : '';
    let cardPkr = ('CardFee' in visit && (visit as any).CardFee && (visit as any).CardFee !== '0') ? String((visit as any).CardFee) : ('CardsPayment' in visit && visit.CardsPayment && visit.CardsPayment !== '0') ? String(visit.CardsPayment) : '';

    if ('VisitRemarks' in visit && visit.VisitRemarks) {
      const rem = visit.VisitRemarks;
      const oPkr = rem.match(/OPD Fee PKR\s*(\d+)/);
      if (oPkr) opdFeePkr = oPkr[1];

      const cPkr = rem.match(/Clinical Meds PKR\s*(\d+)/);
      if (cPkr) clinPkr = cPkr[1];

      const fPkr = rem.match(/File PKR\s*(\d+)/);
      if (fPkr) filePkr = fPkr[1];

      const kPkr = rem.match(/Card PKR\s*(\d+)/);
      if (kPkr) cardPkr = kPkr[1];
    }

    setPvOpdFeePkr(opdFeePkr);
    setPvClinicalMedicinePkr(clinPkr);
    setPvFilePkr(filePkr);
    setPvCardPkr(cardPkr);

    const cItems: Array<{ id: string; medicineName: string; dosage: string }> = [];
    const pItems: Array<{ id: string; medicineName: string; dosage: string }> = [];

    const matchedClinicalVMeds = visitMedicines.filter(vm => vm.VisitID === vId && vm.MedicineType === 'C');
    const matchedPatentVMeds = visitMedicines.filter(vm => vm.VisitID === vId && vm.MedicineType === 'P');

    if (matchedClinicalVMeds.length > 0) {
      matchedClinicalVMeds.forEach((vm, idx) => {
        cItems.push({
          id: String(idx + 1),
          medicineName: vm.MedicineDetail || '',
          dosage: vm.Dosage || ''
        });
      });
    }
    if (matchedPatentVMeds.length > 0) {
      matchedPatentVMeds.forEach((vm, idx) => {
        pItems.push({
          id: String(idx + 1),
          medicineName: vm.MedicineDetail || '',
          dosage: vm.Dosage || ''
        });
      });
    }

    if (cItems.length === 0 && clinical) {
      const lines = clinical.split('\n').map(l => l.trim()).filter(Boolean);
      lines.forEach((line, idx) => {
        if (line.includes(' - ')) {
          const parts = line.split(' - ');
          cItems.push({ id: String(idx + 1), medicineName: parts[0].trim(), dosage: parts.slice(1).join(' - ').trim() });
        } else {
          cItems.push({ id: String(idx + 1), medicineName: line.trim(), dosage: '' });
        }
      });
    }

    if (pItems.length === 0 && patent) {
      const lines = patent.split('\n').map(l => l.trim()).filter(Boolean);
      lines.forEach((line, idx) => {
        if (line.includes(' - ')) {
          const parts = line.split(' - ');
          pItems.push({ id: String(idx + 1), medicineName: parts[0].trim(), dosage: parts.slice(1).join(' - ').trim() });
        } else {
          pItems.push({ id: String(idx + 1), medicineName: line.trim(), dosage: '' });
        }
      });
    }

    if (cItems.length === 0) cItems.push({ id: '1', medicineName: '', dosage: '' });
    if (pItems.length === 0) pItems.push({ id: '1', medicineName: '', dosage: '' });

    setPvClinicalItems(cItems);
    setPvPatientItems(pItems);
    setPvClinicalMedicineExpireDate(expDate);
    setPvSaveSuccess(`Loaded Visit record (${vId}) for editing.`);
    setTimeout(() => setPvSaveSuccess(''), 3000);
  };

  const executeSavePatientVisit = (
    isFollowUp: boolean = false,
    isFoc: boolean = false,
    focCustomData?: { opd: number; clin: number; fileCard: number; reason: string }
  ) => {
    setIsSavingVisit(true);
    try {
      const validClinical = pvClinicalItems.filter((i) => i.medicineName.trim() || i.dosage.trim());
      const validPatent = pvPatientItems.filter((i) => i.medicineName.trim() || i.dosage.trim());

      if (validClinical.length === 0 && validPatent.length === 0) {
        setPvSaveError('Please enter at least one Clinical Medicine or Patient Medicine row.');
        setIsSavingVisit(false);
        return;
      }

      const totalPkr = (Number(pvOpdFeePkr) || 0) + (Number(pvClinicalMedicinePkr) || 0) + (Number(pvFilePkr) || 0) + (Number(pvCardPkr) || 0);
      const targetVisitId = editingVisitId || `VIS-${Date.now()}`;
      const clinicalTextWithExp = `${clinicalMedicineDosage.trim()}${pvClinicalMedicineExpireDate.trim() ? ` (EXP: ${pvClinicalMedicineExpireDate.trim()})` : ''}`;

      const focOpdVal = focCustomData ? focCustomData.opd : (Number(focWaivedOpdFee) || 0);
      const focClinVal = focCustomData ? focCustomData.clin : (Number(focWaivedClinicalFee) || 0);
      const focFileCardVal = focCustomData ? focCustomData.fileCard : (Number(focWaivedFileCardFee) || 0);
      const focReasonVal = focCustomData ? focCustomData.reason : (focReason || 'Deserving Patient');
      const totalWaivedVal = focOpdVal + focClinVal + focFileCardVal;

      const chargesRemarkText = isFoc
        ? `Charges: 0 PKR (FOC Case - Waived Value: PKR ${totalWaivedVal} [OPD:${focOpdVal}, Meds:${focClinVal}, Card:${focFileCardVal}] | Reason: ${focReasonVal})`
        : isFollowUp
        ? `Charges: 0 PKR (Follow-up Visit)`
        : `Charges: OPD Fee PKR ${pvOpdFeePkr || 0}, Clinical Meds PKR ${pvClinicalMedicinePkr || 0}, File PKR ${pvFilePkr || 0}, Card PKR ${pvCardPkr || 0} (Total PKR ${totalPkr})`;

      const baseRemarks = pvRemarks.trim() ? pvRemarks.trim() : `Clinical: ${clinicalTextWithExp} | Patent: ${patientMedicineDosage} | Medical Reports: ${pvMedicalReportResult.trim() || 'N/A'} | Lab Tests: ${pvLabTestAdvice || 'None'}`;

      const newVisit: Visit = {
        VisitID: targetVisitId,
        PatientID: pvSelectedPatientId,
        VisitDate: pvVisitDate || new Date().toISOString().split('T')[0],
        SymptomsDiagnosis: pvSymptomsDiagnosis || (isFoc ? 'FOC Consultation (Free of Charge)' : isFollowUp ? 'Follow-up Consultation' : 'Routine Consultation'),
        MedicalReportResult: pvMedicalReportResult.trim() || 'N/A',
        LabTestAdvice: pvLabTestAdvice || 'None',
        PatientAdvice: pvLabTestAdvice || 'Take medicines regularly.',
        VisitRemarks: `${baseRemarks} | ${chargesRemarkText}`,
        Status: 2,
        FocWaivedOpdFee: isFoc ? focOpdVal : 0,
        FocWaivedClinicalFee: isFoc ? focClinVal : 0,
        FocWaivedFileCardFee: isFoc ? focFileCardVal : 0,
        FocReason: isFoc ? focReasonVal : '',
        ConsultationFee: isFoc ? 0 : isFollowUp ? 0 : Number(pvOpdFeePkr) || 0,
        ClinicalMedicinePayment: isFoc ? 0 : isFollowUp ? 0 : pvClinicalMedicinePkr || '0',
        FileFee: isFoc ? 0 : isFollowUp ? 0 : pvFilePkr || '0',
        CardFee: isFoc ? 0 : isFollowUp ? 0 : pvCardPkr || '0',
        CardsPayment: isFoc ? '0' : isFollowUp ? '0' : String((Number(pvFilePkr) || 0) + (Number(pvCardPkr) || 0)),
        ConsultationPaymentOption: isFoc ? 'FOC' : isFollowUp ? 'Follow-Up' : 'Cash Paid'
      };

      const newVisitMedicines: VisitMedicine[] = [];

      // Save each clinical medicine row
      validClinical.forEach((item, idx) => {
        newVisitMedicines.push({
          VisitID: targetVisitId,
          ItemID: `CLIN-${idx + 1}`,
          MedicineType: 'C',
          MedicineDetail: item.medicineName.trim() || 'Clinical Compounding Medicine',
          Dosage: item.dosage.trim() || 'As directed',
          Qty: 1,
          ExpireDate: pvClinicalMedicineExpireDate.trim()
        });
      });

      // Save each patent medicine row
      validPatent.forEach((item, idx) => {
        newVisitMedicines.push({
          VisitID: targetVisitId,
          ItemID: `PAT-${idx + 1}`,
          MedicineType: 'P',
          MedicineDetail: item.medicineName.trim() || 'Commercial Medicine',
          Dosage: item.dosage.trim() || 'As directed',
          Qty: 1
        });
      });
      if (onAddPatient && selectedPvPatient && !patients.some(p => p.PatientID === pvSelectedPatientId)) {
        onAddPatient(selectedPvPatient);
      }

      if (onAddVisit) {
        onAddVisit(newVisit, newVisitMedicines, []);
      }

      // Also update in pvNhcHistory so side navigation updates dynamically
      setPvNhcHistory(prev => {
        const idx = prev.findIndex(item => item.VisitID === targetVisitId);
        const newHistoryRecord: NhcPatientHistory = {
          PatientID: pvSelectedPatientId,
          PatientName: selectedPvPatient?.PatientName || '',
          VisitID: targetVisitId,
          date: pvVisitDate || new Date().toISOString().split('T')[0],
          symptoms: pvSymptomsDiagnosis || (isFollowUp ? 'Follow-up Consultation' : 'Routine Consultation'),
          clinicalMedication: clinicalMedicineDosage,
          patientMedication: patientMedicineDosage,
          VisitRemarks: newVisit.VisitRemarks
        };
        if (idx >= 0) {
          const copy = [...prev];
          copy[idx] = { ...copy[idx], ...newHistoryRecord };
          return copy;
        }
        return [newHistoryRecord, ...prev];
      });

      const currentPatientId = pvSelectedPatientId;
      const currentPatientName = selectedPvPatient?.PatientName || currentPatientId;

      if (editingVisitId) {
        setPvSaveSuccess(`Patient visit #${targetVisitId} updated successfully!`);
        setPvSaveError('');
        setEditingVisitId(targetVisitId);
        setPvSelectedHistoryDate(pvVisitDate || new Date().toISOString().split('T')[0]);
        setTimeout(() => setPvSaveSuccess(''), 6000);
      } else {
        // Mark Token as Visited/Checked (Status = 2)
        if (onUpdateTokenStatus && currentPatientId) {
          const ptToken = (tokens || []).find(
            (t) => t.PatientID === currentPatientId && (t.Status === 1 || t.Status === 2)
          );
          if (ptToken) {
            onUpdateTokenStatus(ptToken.TokenNo, ptToken.Shift, 2);
          }
        }

        // Mark Appointment as Visited (Status = 2)
        if (onUpdateAppointmentStatus && currentPatientId) {
          const app = (appointments || []).find(
            (a) => a.PatientID === currentPatientId && a.Status === 1
          );
          if (app) {
            onUpdateAppointmentStatus(app.AppointmentID, 2);
          }
        }

        setPvSaveSuccess(`‚úì Visit saved for ${currentPatientName}! Opening print document...`);
        setPvSaveError('');
        setEditingVisitId(targetVisitId);
        setPvSelectedHistoryDate(pvVisitDate || new Date().toISOString().split('T')[0]);
        setTimeout(() => setPvSaveSuccess(''), 6000);
      }

      // Open Print Patient Document modal popup for current patient
      setPvPrescriptionModalOpen(true);
    } finally {
      setIsSavingVisit(false);
      setShowFollowUpConfirmModal(false);
    }
  };

  const handleSavePatientVisit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSavingVisit) return;
    if (!pvSelectedPatientId) {
      setPvSaveError('Please select a patient first.');
      return;
    }

    const validClinical = pvClinicalItems.filter((i) => i.medicineName.trim() || i.dosage.trim());
    const validPatent = pvPatientItems.filter((i) => i.medicineName.trim() || i.dosage.trim());

    if (validClinical.length === 0 && validPatent.length === 0) {
      setPvSaveError('Please enter at least one Clinical Medicine or Patient Medicine row.');
      return;
    }

    const totalPkr = (Number(pvOpdFeePkr) || 0) + (Number(pvClinicalMedicinePkr) || 0) + (Number(pvFilePkr) || 0) + (Number(pvCardPkr) || 0);
    const isPaymentEmpty = (!pvOpdFeePkr || String(pvOpdFeePkr).trim() === '' || Number(pvOpdFeePkr) === 0) &&
                           (!pvClinicalMedicinePkr || String(pvClinicalMedicinePkr).trim() === '' || Number(pvClinicalMedicinePkr) === 0) &&
                           (!pvFilePkr || String(pvFilePkr).trim() === '' || Number(pvFilePkr) === 0) &&
                           (!pvCardPkr || String(pvCardPkr).trim() === '' || Number(pvCardPkr) === 0);

    if (isPaymentEmpty || totalPkr === 0) {
      setShowFollowUpConfirmModal(true);
      return;
    }

    executeSavePatientVisit(false);
  };

  const handleStartEditPatient = (p: Patient) => {
    setEditingPatientId(p.PatientID);
    setPatientName(p.PatientName || '');
    setFatherHusband((p as any).Father_husband || p.Father_husband || '');
    setAgeYears(p.AgeYears || 0);
    setSex((p.Sex as any) || 'Male');
    setMaritalStatus((p.MaritalStatus as any) || 'Single');
    setOccupation(p.Occupation || '');
    setAddress(p.Address || '');
    setMobilePhone(p.PhoneMobile || '');
    setEmail(p.Email || '');
    setCityId(p.CityID || 1);
    setActiveSubTab('register');
    setErrorMsg('');
    setSuccessMsg('');
  };

  const handleCancelEditPatient = () => {
    setEditingPatientId(null);
    setPatientName('');
    setFatherHusband('');
    setAgeYears(30);
    setSex('Male');
    setMaritalStatus('Single');
    setOccupation('');
    setAddress('');
    setMobilePhone('');
    setEmail('');
    setCityId(1);
    setErrorMsg('');
  };

  const loadVisitIntoModalForm = useCallback((v: Visit | NhcPatientHistory, patName?: string) => {
    const vId = ('VisitID' in v && v.VisitID) ? v.VisitID : ('date' in v ? `NHC-${v.date}` : `VIS-${Date.now()}`);
    setModalEditingVisitId(vId);
    setModalPatientId(v.PatientID || '');

    const foundPt = patients.find(p => p.PatientID === v.PatientID);
    setModalPatientName(foundPt?.PatientName || ('PatientName' in v ? (v as any).PatientName : patName || 'Unknown Patient'));

    if ('VisitDate' in v && v.VisitDate) {
      setModalVisitDate(v.VisitDate.split('T')[0]);
    } else if ('date' in v && v.date) {
      setModalVisitDate(v.date);
    } else {
      setModalVisitDate(new Date().toISOString().split('T')[0]);
    }

    if ('SymptomsDiagnosis' in v && v.SymptomsDiagnosis) {
      setModalSymptomsDiagnosis(v.SymptomsDiagnosis);
    } else if ('symptoms' in v && v.symptoms) {
      setModalSymptomsDiagnosis(v.symptoms);
    } else {
      setModalSymptomsDiagnosis('');
    }

    if ('MedicalReportResult' in v && v.MedicalReportResult && v.MedicalReportResult !== 'N/A') {
      setModalMedicalReportResult(v.MedicalReportResult);
    } else {
      setModalMedicalReportResult('');
    }

    if ('LabTestAdvice' in v && v.LabTestAdvice && v.LabTestAdvice !== 'N/A') {
      setModalLabTestAdvice(v.LabTestAdvice);
    } else {
      setModalLabTestAdvice('');
    }

    let clinPkr = ('ClinicalMedicinePayment' in v && v.ClinicalMedicinePayment) ? String(v.ClinicalMedicinePayment) : '';
    let filePkr = ('FileFee' in v && v.FileFee) ? String(v.FileFee) : '';
    let cardPkr = ('CardFee' in v && v.CardFee) ? String(v.CardFee) : '';

    if ('VisitRemarks' in v && v.VisitRemarks) {
      const rem = v.VisitRemarks;
      setModalRemarks(rem);

      if (!clinPkr || clinPkr === '0') {
        const cPkr = rem.match(/Clinical Meds PKR\s*(\d+)/);
        if (cPkr) clinPkr = cPkr[1];
      }
      if (!filePkr || filePkr === '0') {
        const fPkr = rem.match(/File PKR\s*(\d+)/);
        if (fPkr) filePkr = fPkr[1];
      }
      if (!cardPkr || cardPkr === '0') {
        const kPkr = rem.match(/Card PKR\s*(\d+)/);
        if (kPkr) cardPkr = kPkr[1];
      }
    } else {
      setModalRemarks('');
    }

    setModalClinicalMedicinePkr(clinPkr && clinPkr !== '0' ? clinPkr : '');
    setModalFilePkr(filePkr && filePkr !== '0' ? filePkr : '');
    setModalCardPkr(cardPkr && cardPkr !== '0' ? cardPkr : '');

    if ('ConsultationFee' in v && v.ConsultationFee !== undefined && v.ConsultationFee !== null) {
      setModalConsultationFee(v.ConsultationFee);
    } else if ('fee' in v && (v as any).fee !== undefined && (v as any).fee !== null) {
      setModalConsultationFee((v as any).fee);
    } else {
      setModalConsultationFee('');
    }

    if ('ConsultationPaymentOption' in v && v.ConsultationPaymentOption) {
      setModalPaymentOption(v.ConsultationPaymentOption);
    } else {
      setModalPaymentOption('Cash Paid');
    }

    const matchedMeds = (visitMedicines || []).filter(m => m.VisitID === vId);
    if (matchedMeds.length > 0) {
      const cMeds = matchedMeds.filter(m => m.MedicineType === 'C').map((m, idx) => ({
        id: String(idx + 1),
        medicineName: m.MedicineDetail || '',
        dosage: m.Dosage || ''
      }));
      const pMeds = matchedMeds.filter(m => m.MedicineType === 'P').map((m, idx) => ({
        id: String(idx + 1),
        medicineName: m.MedicineDetail || '',
        dosage: m.Dosage || ''
      }));
      const expM = matchedMeds.find(m => m.ExpireDate);
      if (expM && expM.ExpireDate) setModalClinicalMedicineExpireDate(expM.ExpireDate);
      else setModalClinicalMedicineExpireDate('');

      setModalClinicalItems(cMeds.length > 0 ? cMeds : [{ id: '1', medicineName: '', dosage: '' }]);
      setModalPatentItems(pMeds.length > 0 ? pMeds : [{ id: '1', medicineName: '', dosage: '' }]);
    } else {
      let clinStr = '';
      let patStr = '';
      if ('clinicalMedication' in v && v.clinicalMedication) clinStr = v.clinicalMedication;
      if ('patientMedication' in v && v.patientMedication) patStr = v.patientMedication;

      const cItems: { id: string; medicineName: string; dosage: string }[] = [];
      const pItems: { id: string; medicineName: string; dosage: string }[] = [];

      if (clinStr) {
        clinStr.split('\n').forEach((line, idx) => {
          if (!line.trim()) return;
          if (line.includes(' - ')) {
            const parts = line.split(' - ');
            cItems.push({ id: String(idx + 1), medicineName: parts[0].trim(), dosage: parts.slice(1).join(' - ').trim() });
          } else {
            cItems.push({ id: String(idx + 1), medicineName: line.trim(), dosage: '' });
          }
        });
      }

      if (patStr) {
        patStr.split('\n').forEach((line, idx) => {
          if (!line.trim()) return;
          if (line.includes(' - ')) {
            const parts = line.split(' - ');
            pItems.push({ id: String(idx + 1), medicineName: parts[0].trim(), dosage: parts.slice(1).join(' - ').trim() });
          } else {
            pItems.push({ id: String(idx + 1), medicineName: line.trim(), dosage: '' });
          }
        });
      }

      setModalClinicalItems(cItems.length > 0 ? cItems : [{ id: '1', medicineName: '', dosage: '' }]);
      setModalPatentItems(pItems.length > 0 ? pItems : [{ id: '1', medicineName: '', dosage: '' }]);
      setModalClinicalMedicineExpireDate('');
    }
  }, [patients, visitMedicines, clinicSettings]);

  const handleOpenRecentVisitsModal = (targetPatientId?: string) => {
    setIsRecentVisitsModalOpen(true);
    setModalSaveSuccess('');
    setModalSaveError('');
    const pId = targetPatientId || pvSelectedPatientId;
    if (pId) {
      setRecentModalPatientOnly(true);
      const pVisits = (visits || []).filter(v => isSamePatient(v.PatientID, pId));
      const sortedVisits = [...pVisits].sort((a, b) => {
        const dA = parseCleanVisitDate(a.VisitDate);
        const dB = parseCleanVisitDate(b.VisitDate);
        if (dA !== dB) return dB.localeCompare(dA);
        return (Number(b.VisitID) || 0) - (Number(a.VisitID) || 0);
      });
      if (sortedVisits.length > 0) {
        loadVisitIntoModalForm(sortedVisits[0]);
        return;
      }
      const pNhc = (pvNhcHistory || []).filter(nhc => isSamePatient(nhc.PatientID, pId) || !nhc.PatientID);
      const sortedNhc = [...pNhc].sort((a, b) => {
        const dA = parseCleanVisitDate(a.date || (a as any).VisitDate || (a as any).Date);
        const dB = parseCleanVisitDate(b.date || (b as any).VisitDate || (b as any).Date);
        return dB.localeCompare(dA);
      });
      if (sortedNhc.length > 0) {
        loadVisitIntoModalForm(sortedNhc[0]);
        return;
      }
    }
    if (visits && visits.length > 0) {
      loadVisitIntoModalForm(visits[0]);
    } else if (pvNhcHistory && pvNhcHistory.length > 0) {
      loadVisitIntoModalForm(pvNhcHistory[0]);
    } else if (patients && patients.length > 0) {
      const pt = patients[0];
      setModalEditingVisitId(`VIS-${Date.now()}`);
      setModalPatientId(pt.PatientID);
      setModalPatientName(pt.PatientName);
      setModalVisitDate(new Date().toISOString().split('T')[0]);
      setModalSymptomsDiagnosis('');
      setModalMedicalReportResult('');
      setModalLabTestAdvice('');
      setModalClinicalItems([{ id: '1', medicineName: '', dosage: '' }]);
      setModalPatentItems([{ id: '1', medicineName: '', dosage: '' }]);
      setModalConsultationFee('');
      setModalClinicalMedicinePkr('');
      setModalFilePkr('');
      setModalCardPkr('');
      setModalPaymentOption('Cash Paid');
      setModalRemarks('');
    }
  };

  const handleEditRecentVisitRecord = () => {
    handleOpenRecentVisitsModal(pvSelectedPatientId);
  };

  const getPatientVisitDateOptions = (patientId: string) => {
    const pVisits = (visits || []).filter(v => isSamePatient(v.PatientID, patientId));
    const pNhc = (pvNhcHistory || []).filter(nhc => isSamePatient(nhc.PatientID, patientId));

    const dateMap = new Map<string, { date: string; vObj?: Visit; nhcObj?: any; symptoms: string; fee: number; summary: string }>();

    pVisits.forEach((v) => {
      const cleanD = parseCleanVisitDate(v.VisitDate);
      if (!cleanD) return;
      if (!dateMap.has(cleanD)) {
        dateMap.set(cleanD, {
          date: cleanD,
          vObj: v,
          symptoms: v.SymptomsDiagnosis || 'General Visit / Checkup',
          fee: v.ConsultationFee || 0,
          summary: (v as any).Prescription ? `Rx: ${(v as any).Prescription.slice(0, 40)}...` : 'Visit Record'
        });
      }
    });

    pNhc.forEach((nhc) => {
      const cleanD = parseCleanVisitDate(nhc.date || nhc.VisitDate || nhc.Date);
      if (!cleanD) return;
      if (!dateMap.has(cleanD)) {
        dateMap.set(cleanD, {
          date: cleanD,
          nhcObj: nhc,
          symptoms: nhc.symptoms || nhc.SymptomsDiagnosis || 'Historical Visit Record',
          fee: nhc.fee || 0,
          summary: nhc.summary || 'PHC History'
        });
      }
    });

    const sorted = Array.from(dateMap.values()).sort((a, b) => b.date.localeCompare(a.date));

    if (sorted.length === 0) {
      const todayStr = new Date().toISOString().split('T')[0];
      return [{
        date: todayStr,
        symptoms: 'Fresh Consultation Visit',
        fee: 0,
        summary: 'New Visit Record'
      }];
    }

    return sorted;
  };

  const openGridVisitSelectorModal = (patientId: string, mode: 'EDIT' | 'PRINT') => {
    setGridSelectorPatientId(patientId);
    setGridSelectorMode(mode);
    setPvSelectedPatientId(patientId);

    const options = getPatientVisitDateOptions(patientId);
    if (options.length > 0) {
      setGridSelectorSelectedDate(options[0].date);
    } else {
      setGridSelectorSelectedDate(new Date().toISOString().split('T')[0]);
    }
    setIsGridVisitSelectorModalOpen(true);
  };

  const handleConfirmGridVisitSelection = () => {
    if (!gridSelectorPatientId || !gridSelectorSelectedDate) return;

    const patientId = gridSelectorPatientId;
    const targetDate = gridSelectorSelectedDate;

    setPvSelectedPatientId(patientId);
    loadPvPatientHistory(patientId, false);

    const options = getPatientVisitDateOptions(patientId);
    const matchedOpt = options.find(o => o.date === targetDate);

    if (gridSelectorMode === 'EDIT') {
      setIsGridVisitSelectorModalOpen(false);
      setIsRecentVisitsModalOpen(true);
      setRecentModalPatientOnly(true);
      setModalSaveSuccess('');
      setModalSaveError('');

      if (matchedOpt?.vObj || matchedOpt?.nhcObj) {
        loadVisitIntoModalForm(matchedOpt.vObj || matchedOpt.nhcObj);
      } else {
        const pVisits = (visits || []).filter(v => isSamePatient(v.PatientID, patientId));
        const matchedVisit = pVisits.find(v => parseCleanVisitDate(v.VisitDate) === targetDate);
        if (matchedVisit) {
          loadVisitIntoModalForm(matchedVisit);
        } else {
          setModalEditingVisitId(`VIS-${Date.now()}`);
          setModalPatientId(patientId);
          const foundPt = patients.find(p => isSamePatient(p.PatientID, patientId));
          setModalPatientName(foundPt?.PatientName || patientId);
          setModalVisitDate(targetDate);
        }
      }
    } else if (gridSelectorMode === 'PRINT') {
      setIsGridVisitSelectorModalOpen(false);

      if (matchedOpt?.vObj || matchedOpt?.nhcObj) {
        handleEditVisit(matchedOpt.vObj || matchedOpt.nhcObj);
      } else {
        const pVisits = (visits || []).filter(v => isSamePatient(v.PatientID, patientId));
        const matchedVisit = pVisits.find(v => parseCleanVisitDate(v.VisitDate) === targetDate);
        if (matchedVisit) {
          handleEditVisit(matchedVisit);
        } else {
          setPvVisitDate(targetDate);
        }
      }

      setPrintDocType('A5_VISIT_SLIP');
      setPvPrescriptionModalOpen(true);
    }
  };

  const handleSaveFromRecentModal = (andPrint: boolean = false) => {
    if (!modalPatientId) {
      setModalSaveError('Please select a patient.');
      return;
    }

    const validClinical = modalClinicalItems.filter((i) => i.medicineName.trim() || i.dosage.trim());
    const validPatent = modalPatentItems.filter((i) => i.medicineName.trim() || i.dosage.trim());

    if (validClinical.length === 0 && validPatent.length === 0 && !modalSymptomsDiagnosis.trim()) {
      setModalSaveError('Please enter at least one medicine row or symptoms/diagnosis.');
      return;
    }

    const targetVisitId = modalEditingVisitId || `VIS-${Date.now()}`;
    const clinicalDosageText = validClinical
      .map((item) => (item.dosage.trim() ? `${item.medicineName.trim()} - ${item.dosage.trim()}` : item.medicineName.trim()))
      .join('\n');
    const patentDosageText = validPatent
      .map((item) => (item.dosage.trim() ? `${item.medicineName.trim()} - ${item.dosage.trim()}` : item.medicineName.trim()))
      .join('\n');

    const totalPkr = (Number(modalClinicalMedicinePkr) || 0) + (Number(modalFilePkr) || 0) + (Number(modalCardPkr) || 0);
    const chargesRemark = `Charges: Clinical Meds PKR ${modalClinicalMedicinePkr || 0}, File PKR ${modalFilePkr || 0}, Card PKR ${modalCardPkr || 0} (Total PKR ${totalPkr})`;

    const updatedVisit: Visit = {
      VisitID: targetVisitId,
      PatientID: modalPatientId,
      VisitDate: modalVisitDate || new Date().toISOString().split('T')[0],
      SymptomsDiagnosis: modalSymptomsDiagnosis || 'Routine Consultation',
      MedicalReportResult: modalMedicalReportResult.trim() || 'N/A',
      LabTestAdvice: modalLabTestAdvice || 'None',
      PatientAdvice: modalLabTestAdvice || 'Take medicines regularly.',
      VisitRemarks: `Clinical: ${clinicalDosageText} | Patent: ${patentDosageText} | Medical Reports: ${modalMedicalReportResult.trim() || 'N/A'} | Lab Tests: ${modalLabTestAdvice || 'None'} | ${chargesRemark}`,
      Status: 2,
      ConsultationFee: modalConsultationFee !== '' && !isNaN(Number(modalConsultationFee)) ? Number(modalConsultationFee) : 0,
      ConsultationPaymentOption: modalPaymentOption,
      ClinicalMedicinePayment: String(modalClinicalMedicinePkr || '0'),
      FileFee: String(modalFilePkr || '0'),
      CardFee: String(modalCardPkr || '0'),
      CardsPayment: String((Number(modalFilePkr) || 0) + (Number(modalCardPkr) || 0))
    };

    const newVisitMedicines: VisitMedicine[] = [];

    validClinical.forEach((item, idx) => {
      newVisitMedicines.push({
        VisitID: targetVisitId,
        ItemID: `CLIN-${idx + 1}`,
        MedicineType: 'C',
        MedicineDetail: item.medicineName.trim() || 'Clinical Compounding Medicine',
        Dosage: item.dosage.trim() || 'As directed',
        Qty: 1,
        ExpireDate: modalClinicalMedicineExpireDate.trim()
      });
    });

    validPatent.forEach((item, idx) => {
      newVisitMedicines.push({
        VisitID: targetVisitId,
        ItemID: `PAT-${idx + 1}`,
        MedicineType: 'P',
        MedicineDetail: item.medicineName.trim() || 'Commercial Medicine',
        Dosage: item.dosage.trim() || 'As directed',
        Qty: 1
      });
    });

    if (onAddVisit) {
      onAddVisit(updatedVisit, newVisitMedicines, []);
    }

    setPvNhcHistory((prev) => {
      const idx = prev.findIndex((item) => item.VisitID === targetVisitId);
      const foundPt = patients.find((p) => p.PatientID === modalPatientId);
      const newHistoryRecord: NhcPatientHistory = {
        PatientID: modalPatientId,
        PatientName: foundPt?.PatientName || modalPatientName || 'Patient',
        VisitID: targetVisitId,
        date: modalVisitDate || new Date().toISOString().split('T')[0],
        symptoms: modalSymptomsDiagnosis || 'Routine Consultation',
        clinicalMedication: clinicalDosageText,
        patientMedication: patentDosageText,
        VisitRemarks: updatedVisit.VisitRemarks
      };
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], ...newHistoryRecord };
        return copy;
      }
      return [newHistoryRecord, ...prev];
    });

    setModalSaveSuccess(`Visit record #${targetVisitId} updated successfully!`);
    setModalSaveError('');

    setPvSelectedPatientId(modalPatientId);
    setPvVisitDate(modalVisitDate);
    setPvSymptomsDiagnosis(modalSymptomsDiagnosis);
    setPvMedicalReportResult(modalMedicalReportResult);
    setPvLabTestAdvice(modalLabTestAdvice);
    setPvClinicalItems(validClinical.length > 0 ? validClinical : [{ id: '1', medicineName: '', dosage: '' }]);
    setPvPatientItems(validPatent.length > 0 ? validPatent : [{ id: '1', medicineName: '', dosage: '' }]);
    setPvClinicalMedicineExpireDate(modalClinicalMedicineExpireDate);
    setEditingVisitId(targetVisitId);
    setModalEditingVisitId(targetVisitId);

    if (andPrint) {
      setIsRecentVisitsModalOpen(false);
      setPrintDocType('A5_VISIT_SLIP');
      setPvPrescriptionModalOpen(true);
    } else {
      setTimeout(() => {
        setModalSaveSuccess('');
        setIsRecentVisitsModalOpen(false);
      }, 1200);
    }
  };

  const handleSelectPreviousVisitRecord = () => {
    if (!pvSelectedPatientId || patientVisitRecords.length === 0) return;

    let nextIdx = 0;
    if (currentEditingVisitRecordIndex >= 0) {
      nextIdx = currentEditingVisitRecordIndex + 1; // older visit record
    } else {
      nextIdx = 0; // latest visit record
    }

    if (nextIdx < patientVisitRecords.length) {
      const target = patientVisitRecords[nextIdx];
      const itemToEdit = target.visitObj || target.nhcObj;
      if (itemToEdit) {
        handleEditVisit(itemToEdit);
      }
    }
  };

  const handleSelectNextVisitRecord = () => {
    if (!pvSelectedPatientId || patientVisitRecords.length === 0) return;

    if (currentEditingVisitRecordIndex > 0) {
      const nextIdx = currentEditingVisitRecordIndex - 1; // newer visit record
      const target = patientVisitRecords[nextIdx];
      const itemToEdit = target.visitObj || target.nhcObj;
      if (itemToEdit) {
        handleEditVisit(itemToEdit);
      }
    } else if (currentEditingVisitRecordIndex === 0) {
      handleAddNewVisit();
    }
  };

  const handleSelectPreviousPatient = () => {
    if (pvPatientDropdownOptions.length === 0) return;
    const currIdx = pvPatientDropdownOptions.findIndex(p => p.PatientID === pvSelectedPatientId);
    if (currIdx > 0) {
      const prevPt = pvPatientDropdownOptions[currIdx - 1];
      setPvSelectedPatientId(prevPt.PatientID);
      setPvSelectedHistoryDate('ALL');
      loadPvPatientHistory(prevPt.PatientID, false);
    } else if (currIdx === -1 && pvPatientDropdownOptions.length > 0) {
      const firstPt = pvPatientDropdownOptions[0];
      setPvSelectedPatientId(firstPt.PatientID);
      setPvSelectedHistoryDate('ALL');
      loadPvPatientHistory(firstPt.PatientID, false);
    }
  };

  const handleSelectNextPatient = () => {
    if (pvPatientDropdownOptions.length === 0) return;
    const currIdx = pvPatientDropdownOptions.findIndex(p => p.PatientID === pvSelectedPatientId);
    if (currIdx >= 0 && currIdx < pvPatientDropdownOptions.length - 1) {
      const nextPt = pvPatientDropdownOptions[currIdx + 1];
      setPvSelectedPatientId(nextPt.PatientID);
      setPvSelectedHistoryDate('ALL');
      loadPvPatientHistory(nextPt.PatientID, false);
    }
  };

  const handlePrintPreviousRxDirect = () => {
    if (!pvSelectedPatientId || combinedPreviousHistory.length === 0 || groupedRxByDate.length === 0) {
      alert("No previous visit prescription records found for this patient.");
      return;
    }
    handlePrintPreviousVisitPrescription(groupedRxByDate[0]);
  };

  const handlePrintClinicalMedicineLabel = () => {
    if (!selectedPvPatient) {
      alert('Please select a patient first.');
      return;
    }

    const activeClinical = pvClinicalItems.filter(
      (i) => i.medicineName.trim() !== '' && i.medicineName !== 'None prescribed'
    );

    if (activeClinical.length === 0) {
      alert('No Clinical Medicines entered for current visit.');
      return;
    }

    const printWin = window.open('', '_blank', 'width=650,height=900');
    if (!printWin) {
      alert('Pop-up blocked. Please allow pop-ups for this site to print labels.');
      return;
    }

    const clinicName = clinicSettings?.ClinicName || 'PUNJAB HOMEOPATHIC CLINIC';
    const doctorName = clinicSettings?.DoctorName || 'Dr. Ejaz Ahmad, D.H.M.S (Pak)';

    printWin.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Clinical Medicine Usage Label (2x0.2 inch on A4 Paper)</title>
          <style>
            @page {
              size: A4;
              margin: 5mm;
            }
            body {
              font-family: Arial, Helvetica, sans-serif;
              margin: 0;
              padding: 2px 4px;
              width: 2in;
              min-height: 0.2in;
              box-sizing: border-box;
              color: #000;
              background: #fff;
              font-size: 9px;
              line-height: 1.1;
              display: flex;
              flex-direction: column;
              justify-content: flex-start;
              border: 1px dashed #475569;
              border-radius: 3px;
            }
            .header {
              border-bottom: 2px solid #000;
              padding-bottom: 8px;
              text-align: center;
            }
            .clinic-title {
              font-size: 14px;
              font-weight: 900;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .label-subtitle {
              font-size: 9px;
              font-weight: bold;
              color: #444;
              text-transform: uppercase;
              margin-top: 2px;
            }
            .patient-info {
              font-size: 11px;
              font-weight: bold;
              margin: 10px 0;
              border: 1px solid #333;
              background: #f8fafc;
              padding: 8px;
              border-radius: 6px;
            }
            .patient-line {
              display: flex;
              justify-content: space-between;
              margin-bottom: 4px;
            }
            .usage-box {
              border: 2px solid #000;
              background: #f1f5f9;
              padding: 12px;
              border-radius: 8px;
              text-align: center;
              margin: 12px 0;
              flex: 1;
              display: flex;
              flex-direction: column;
              justify-content: center;
            }
            .usage-title {
              font-size: 10px;
              font-weight: 900;
              background: #000;
              color: #fff;
              padding: 3px 8px;
              border-radius: 4px;
              display: inline-block;
              margin: 0 auto 10px auto;
              letter-spacing: 1px;
            }
            .med-item {
              margin-bottom: 12px;
              padding-bottom: 8px;
              border-bottom: 1px dashed #94a3b8;
            }
            .med-item:last-child {
              border-bottom: none;
              margin-bottom: 0;
              padding-bottom: 0;
            }
            .med-name {
              font-size: 12px;
              font-weight: 900;
              text-transform: uppercase;
              color: #0f172a;
            }
            .med-dosage {
              font-size: 15px;
              font-weight: 900;
              text-transform: uppercase;
              color: #000;
              margin-top: 4px;
            }
            .footer {
              border-top: 2px solid #000;
              padding-top: 8px;
              font-size: 9px;
              text-align: center;
              color: #334155;
            }
          </style>
        </head>
        <body>
          <div>
            <div class="header">
              <div class="clinic-title">${clinicName}</div>
              <div class="label-subtitle">Usage of Clinical Medicine ‚Ä¢ Roll Sticker (4" x 8")</div>
            </div>
            <div class="patient-info">
              <div class="patient-line">
                <span>PATIENT: <strong>${selectedPvPatient.PatientName.toUpperCase()}</strong></span>
                <span>ID: ${selectedPvPatient.PatientID}</span>
              </div>
              <div class="patient-line" style="margin-bottom:0; font-size: 9px; color: #475569;">
                <span>DATE: ${pvVisitDate || new Date().toISOString().split('T')[0]}</span>
                <span>AGE/SEX: ${selectedPvPatient.AgeYears}Y / ${selectedPvPatient.Sex}</span>
              </div>
            </div>
            <div class="usage-box">
              <div class="usage-title">USAGE OF CLINICAL MEDICINE</div>
              ${activeClinical.map(item => `
                <div class="med-item">
                  <div class="med-name">${item.medicineName}</div>
                  <div class="med-dosage">${item.dosage || 'AS DIRECTED BY PHYSICIAN'}</div>
                </div>
              `).join('')}
            </div>
          </div>
          <div class="footer">
            Prescribed by: ${doctorName} &bull; Homeopathic Clinic Lahore &bull; Keep out of reach of children
          </div>
          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `);
    printWin.document.close();
  };

  // Patient Register Handler
  const handleRegisterPatient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canAdd) {
      setErrorMsg('Unauthorized: Your role does not permit adding new patients.');
      return;
    }
    if (!patientName.trim()) {
      setErrorMsg('Patient Name is mandatory.');
      return;
    }
    // Validation check for AgeYears and Sex fields
    const isAgeBlank = !ageYears || Number(ageYears) <= 0 || isNaN(Number(ageYears));
    const isSexBlank = !sex || sex.toString().trim() === '';
    if (isAgeBlank && isSexBlank) {
      setErrorMsg("Warning: 'Age (Years)' and 'Gender / Sex' fields are required for accurate clinical records.");
      return;
    }
    if (isAgeBlank) {
      setErrorMsg("Warning: 'Age (Years)' field is required for accurate clinical records.");
      return;
    }
    if (isSexBlank) {
      setErrorMsg("Warning: 'Gender / Sex' field is required for accurate clinical records.");
      return;
    }

    // Validation for phone format Pakistani: e.g. 03xx-xxxxxxx or simply 11 digits
    const cleanPhone = mobilePhone.trim();
    if (!cleanPhone) {
      setErrorMsg('Mobile Phone number is mandatory.');
      return;
    }
    const phoneRegex = /^03\d{2}-\d{7}$|^03\d{9}$/;
    if (!phoneRegex.test(cleanPhone)) {
      setErrorMsg('Invalid format. Please use Pakistani mobile format (e.g., 0300-1234567 or 03001234567).');
      return;
    }

    if (editingPatientId) {
      const existingPatient = patients.find(p => p.PatientID === editingPatientId);
      const updatedPatient: Patient = {
        PatientID: editingPatientId,
        PatientName: patientName,
        Father_husband: fatherHusband || 'N/A',
        AgeYears: ageYears,
        Sex: sex,
        MaritalStatus: maritalStatus,
        Occupation: occupation || 'N/A',
        Address: address || 'N/A',
        CityID: cityId,
        Country: 'Pakistan',
        PhoneMobile: cleanPhone,
        Email: email || undefined,
        RegistrationDate: existingPatient?.RegistrationDate || new Date().toISOString().split('T')[0]
      };

      if (onUpdatePatient) {
        onUpdatePatient(updatedPatient);
      } else {
        onAddPatient(updatedPatient);
      }

      setRegSuccessData({
        patientId: editingPatientId,
        patientName: patientName,
        phoneMobile: cleanPhone
      });
      setRegSuccessModalOpen(true);
      setSuccessMsg(`Patient profile for ${patientName} (${editingPatientId}) updated successfully!`);
      setErrorMsg('');
      setEditingPatientId(null);
    } else {
      const newId = generatePatientId(patients);
      const newPatient: Patient = {
        PatientID: newId,
        PatientName: patientName,
        Father_husband: fatherHusband || 'N/A',
        AgeYears: ageYears,
        Sex: sex,
        MaritalStatus: maritalStatus,
        Occupation: occupation || 'N/A',
        Address: address || 'N/A',
        CityID: cityId,
        Country: 'Pakistan',
        PhoneMobile: cleanPhone,
        Email: email || undefined,
        RegistrationDate: new Date().toISOString().split('T')[0]
      };

      onAddPatient(newPatient);
      setRegSuccessData({
        patientId: newId,
        patientName: patientName,
        phoneMobile: cleanPhone
      });
      setRegSuccessModalOpen(true);
      setSuccessMsg(`Patient ${patientName} successfully registered with Patient ID: ${newId}`);
      setErrorMsg('');
    }
    
    // Clear Form
    setPatientName('');
    setFatherHusband('');
    setAgeYears(30);
    setSex('Male');
    setMaritalStatus('Single');
    setOccupation('');
    setAddress('');
    setMobilePhone('');
    setEmail('');

    setTimeout(() => setSuccessMsg(''), 6000);
  };

  const executeDeletePatientRecord = (targetPt: Patient) => {
    const targetId = targetPt.PatientID;
    if (!targetId) return;

    // 1. Delete patient profile
    if (onDeletePatient) {
      onDeletePatient(targetId);
    }

    // 2. Cascading delete all visits of this patient
    const ptVisits = (visits || []).filter(v => isSamePatient(v.PatientID, targetId));
    ptVisits.forEach(v => {
      if (v.VisitID && onDeleteVisit) {
        onDeleteVisit(v.VisitID);
      }
    });

    // 3. Cascading delete all tokens of this patient
    const ptTokens = (tokens || []).filter(t => isSamePatient(t.PatientID, targetId));
    ptTokens.forEach(t => {
      if (onDeleteToken) {
        onDeleteToken(t.TokenNo, t.Shift as 1 | 2);
      }
    });

    // 4. Cascading delete all appointments of this patient
    const ptAppointments = (appointments || []).filter(a => isSamePatient(a.PatientID, targetId));
    ptAppointments.forEach(a => {
      if (a.AppointmentID && onDeleteAppointment) {
        onDeleteAppointment(a.AppointmentID);
      }
    });

    // Reset selected patient state if deleting active patient
    if (pvSelectedPatientId === targetId) {
      setPvSelectedPatientId('');
    }
    if (selectedPatientId === targetId) {
      setSelectedPatientId('');
    }

    setDeletePatientModalData({ isOpen: false, pt: null });
    setPvSaveSuccess(`Patient ${targetPt.PatientName} (${targetId}) and all associated records permanently deleted!`);
    setTimeout(() => setPvSaveSuccess(''), 3500);
  };

  // Appointment Booking & Token Issuance Handler
  const handleBookAppointment = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingToken) return;
    if (!canAdd) {
      setAppError('Unauthorized: Your role does not permit booking appointments.');
      return;
    }
    if (!selectedPatientId) {
      setAppError('Please select a registered patient.');
      return;
    }

    const patient = patients.find((p) => p.PatientID === selectedPatientId);
    if (!patient) {
      setAppError('Selected patient invalid.');
      return;
    }

    const realTodayStr = new Date().toISOString().split('T')[0];

    // Check if a token was ALREADY issued for this patient today (prevent duplicate token generation)
    const existingActiveTodayToken = tokens.find(
      (t) => t.PatientID === selectedPatientId && (t.Date === appDate || (!t.Date && appDate === realTodayStr)) && t.Status !== 3
    );

    if (existingActiveTodayToken && appDate === realTodayStr) {
      const confirmIssue = window.confirm(
        `[DUPLICATE TOKEN WARNING]\n\nToken #${existingActiveTodayToken.TokenNo} has ALREADY been issued for ${patient.PatientName} (${patient.PatientID}) today (${appDate}).\n\nAre you sure you want to issue ANOTHER token for this patient?`
      );
      if (!confirmIssue) {
        return;
      }
    }

    setIsSubmittingToken(true);
    try {
      // Check if an appointment was ALREADY pre-booked for this patient on the selected appDate
      const existingPreBookedApp = appointments.find(
        (a) => a.PatientID === selectedPatientId && a.AppointmentDate === appDate && a.Status !== 3
      );

      const feeVal = existingFee !== '' && !isNaN(Number(existingFee))
        ? Number(existingFee)
        : 0;

      let activeAppId = '';

      // CASE 1: Future Advance Appointment Booking (appDate > today)
      if (appDate !== realTodayStr) {
        if (!existingPreBookedApp) {
          let nextAppNum = appointments.length + 1;
          let newAppId = `APP-${String(nextAppNum).padStart(3, '0')}`;
          while (appointments.some((a) => a.AppointmentID === newAppId)) {
            nextAppNum++;
            newAppId = `APP-${String(nextAppNum).padStart(3, '0')}`;
          }
          const newApp: Appointment = {
            AppointmentID: newAppId,
            PatientID: selectedPatientId,
            AppointmentDate: appDate,
            Shift: shift,
            Status: 1, // New
            Remarks: remarks || 'Advance Appointment Booking',
            FeeCharged: feeVal
          };
          if (feeVal > 0) {
            onAddAppointment(newApp);
            activeAppId = newAppId;
          }
        } else {
          activeAppId = existingPreBookedApp.AppointmentID;
        }

        setAppError('');
        setFutureBookingModal({
          isOpen: true,
          patientName: patient.PatientName,
          patientId: patient.PatientID,
          phoneMobile: patient.PhoneMobile,
          date: appDate,
          shift: shift
        });
        setAppSuccess(`Advance appointment booked for ${patient.PatientName} on ${appDate}. Appointment Fee PKR ${existingPreBookedApp ? existingPreBookedApp.FeeCharged : feeVal} recorded/paid. Token will be issued when patient arrives on appointment date.`);
        setSelectedPatientId('');
        setRemarks('');
        setIsOpdTokenModalOpen(false);
        setOpdTokenModalPatient(null);
        setTimeout(() => setAppSuccess(''), 6000);
        return;
      }

      // CASE 2 & 3: Token Issuance on Appointment Date (appDate === realTodayStr)
      let tokenFeeToCharge = feeVal;
      let finalRemarks = remarks || 'Routine OPD check';
      let isPrepaidAppointment = false;

      if (existingPreBookedApp) {
        // Patient already booked and paid for this appointment in advance!
        activeAppId = existingPreBookedApp.AppointmentID;
        tokenFeeToCharge = 0; // PKR 0 today because fee was ALREADY paid at booking time
        isPrepaidAppointment = true;
        finalRemarks = remarks ? `${remarks} (Pre-booked - Fee Paid)` : `Pre-booked Appointment - Fee PKR ${existingPreBookedApp.FeeCharged || 0} Paid on Booking`;
      } else {
        // Direct Walk-In Today: Create appointment record with today's fee
        let nextAppNum = appointments.length + 1;
        let newAppId = `APP-${String(nextAppNum).padStart(3, '0')}`;
        while (appointments.some((a) => a.AppointmentID === newAppId)) {
          nextAppNum++;
          newAppId = `APP-${String(nextAppNum).padStart(3, '0')}`;
        }
        activeAppId = newAppId;
        if (tokenFeeToCharge > 0) {
          const newApp: Appointment = {
            AppointmentID: newAppId,
            PatientID: selectedPatientId,
            AppointmentDate: appDate,
            Shift: shift,
            Status: 1, // New
            Remarks: finalRemarks,
            FeeCharged: tokenFeeToCharge
          };
          onAddAppointment(newApp);
        }
      }

      // Auto generate sequential daily token for this date across all shifts
      const todayStr = new Date().toISOString().split('T')[0];
      const dailyTokens = tokens.filter((t) => t.Date === appDate || (!t.Date && appDate === todayStr));
      const maxTokenNo = dailyTokens.reduce((max, t) => Math.max(max, t.TokenNo || 0), 0);
      const nextTokenNo = maxTokenNo + 1;

      const newToken: Token = {
        TokenNo: nextTokenNo,
        PatientID: selectedPatientId,
        Shift: shift,
        Status: 1, // New / Waiting
        Date: appDate
      };

      onAddToken(newToken);

      // Print Short Thermal Printer Token Slip
      handlePrintThermalTokenSlip({
        tokenNo: nextTokenNo,
        patientId: patient.PatientID,
        patientName: patient.PatientName,
        shift: shift,
        date: appDate,
        fee: tokenFeeToCharge,
        age: patient.AgeYears,
        sex: patient.Sex,
        phone: patient.PhoneMobile
      });

      // Automated SMS Sending engine
      if (smsSettings && smsSettings.Enabled) {
        const prevVisitsCount = appointments.filter((a) => a.PatientID === selectedPatientId).length;
        const isRepeat = prevVisitsCount > 0;
        const template = isRepeat ? smsSettings.RepeatTemplate : smsSettings.BookingTemplate;
        
        const parsedMessage = template
          .replace(/{PATIENT}/g, patient.PatientName)
          .replace(/{TOKEN}/g, String(nextTokenNo))
          .replace(/{SHIFT}/g, shift === 1 ? 'Morning' : 'Evening')
          .replace(/{DATE}/g, appDate)
          .replace(/{APPID}/g, activeAppId);

        setSmsSentToast({
          recipient: patient.PhoneMobile,
          message: parsedMessage,
          provider: smsSettings.Provider
        });

        console.log(`[AUTOMATED SMS DISPATCH] Sent to: ${patient.PhoneMobile} via provider [${smsSettings.Provider.toUpperCase()}] message: "${parsedMessage}"`);
      }



      if (isPrepaidAppointment) {
        setAppSuccess(`Pre-Booked Appointment Token No: ${nextTokenNo} allocated for ${shift === 1 ? 'Morning' : 'Evening'} shift. Fee: PKR 0 (Prepaid - PKR ${existingPreBookedApp?.FeeCharged || 0} paid on booking).`);
      } else {
        setAppSuccess(`Appointment booked & Token No: ${nextTokenNo} allocated for ${shift === 1 ? 'Morning' : 'Evening'} shift. Fee: PKR ${tokenFeeToCharge} charged.`);
      }

      setAppError('');
      setSelectedPatientId('');
      setRemarks('');
      setIsOpdTokenModalOpen(false);
      setOpdTokenModalPatient(null);

      setTimeout(() => setAppSuccess(''), 6000);
    } finally {
      setIsSubmittingToken(false);
    }
  };

  // Advanced Token queue handlers
  const speakVoice = (tok: Token) => {
    if ('speechSynthesis' in window) {
      const name = getPatientName(tok.PatientID);
      const text = `Attention please, Token number ${tok.TokenNo}, patient ${name}, please proceed to the doctor's room.`;
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95; // clear and slightly slower for readability
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleCallPatient = (tok: Token) => {
    if (!canCallServeToken) {
      alert('Access Control Security: You do not have permission to Call or Serve patients in the queue.');
      return;
    }
    // 1 (New) -> 2 (Visited)
    onUpdateTokenStatus(tok.TokenNo, tok.Shift, 2);
    // Corresponding appointment should also be marked Visited (2)
    const app = appointments.find(
      (a) => a.PatientID === tok.PatientID && a.AppointmentDate === tok.Date && a.Shift === tok.Shift && a.Status === 1
    );
    if (app) {
      onUpdateAppointmentStatus(app.AppointmentID, 2);
    }

    // Voice announcement speak
    speakVoice(tok);
  };

  const handlePostPayment = (tok: Token) => {
    if (!canPost) {
      alert('Security Protection: Accountant / Receptionist privileges with PostRec required.');
      return;
    }
    // Update appointment to Posted (4) which automatically fires dual-entry voucher
    const app = appointments.find(
      (a) => a.PatientID === tok.PatientID && a.AppointmentDate === tok.Date && a.Shift === tok.Shift && (a.Status === 1 || a.Status === 2)
    );
    if (app) {
      onUpdateAppointmentStatus(app.AppointmentID, 4); // Payment Posted
      alert(`OPD Ticket Fee payment of Rs. 1,500 posted to general ledger. Cash debited to Appointment Desk Cash.`);
    }
  };

  const handleCancelQueue = (tok: Token) => {
    if (!canDeleteToken && !canCallServeToken) {
      alert('Access Control Security: You do not have permission to delete queue tokens. Administrator rights required.');
      return;
    }

    const patName = getPatientName(tok.PatientID);
    const confirmDelete = window.confirm(
      `[DELETE TOKEN CONFIRMATION]\n\nAre you sure you want to DELETE Token #${tok.TokenNo} for ${patName} (${tok.PatientID})?\n\nIf this token was issued by mistake, deleting it will remove it from the active waiting queue.`
    );
    if (!confirmDelete) return;

    if (onDeleteToken) {
      onDeleteToken(tok.TokenNo, tok.Shift);
    } else {
      onUpdateTokenStatus(tok.TokenNo, tok.Shift, 3); // Canceled
    }

    const app = appointments.find(
      (a) => a.PatientID === tok.PatientID && a.AppointmentDate === tok.Date && a.Shift === tok.Shift && (a.Status === 1 || a.Status === 2)
    );
    if (app && onUpdateAppointmentStatus) {
      onUpdateAppointmentStatus(app.AppointmentID, 3); // Canceled
    }

    setAppSuccess(`Token #${tok.TokenNo} for ${patName} deleted successfully.`);
    setTimeout(() => setAppSuccess(''), 5000);
  };

  // Find Patient Details helper
  const getPatientName = (id: string) => {
    if (!id) return 'Unknown';
    const p = patients.find((pat) => pat.PatientID === id);
    if (p) return p.PatientName;
    const nhc = (nhcPatients || []).find((n) => n.PatientID === id);
    if (nhc) return nhc.PatientName;
    return `Patient (${id})`;
  };

  const getPatientPhone = (id: string) => {
    if (!id) return 'N/A';
    const p = patients.find((pat) => pat.PatientID === id);
    if (p) return p.PhoneMobile;
    const nhc = (nhcPatients || []).find((n) => n.PatientID === id);
    if (nhc) return nhc.PhoneMobile || 'N/A';
    return 'N/A';
  };

  return (
    <div className="p-2.5 sm:p-3 space-y-2.5 overflow-y-auto flex-1 bg-slate-50 text-slate-800 relative h-full w-full" id="patients-desk">
      <TopProgressBar active={isSubTabLoading} />

      {/* Top Section */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-end gap-2 border-b border-slate-200/80 pb-2">
        {/* Sub Navigation */}
        <PatientDeskSubNav
          activeSubTab={activeSubTab}
          setActiveSubTab={handleSubTabChange}
          canAccessQueue={canAccessQueue}
          canAccessRegister={canAccessRegister}
          canAccessTokenIssue={canAccessTokenIssue}
          canAccessPatientVisit={canAccessPatientVisit}
          canAccessGridView={canAccessGridView}
          canAccessAppointments={canAccessAppointments}
          canAccessLargeScreen={canAccessLargeScreen}
        />
      </div>

      {/* Access Restriction Banner if ALL sub-tabs are disabled for user */}
      {!canAccessQueue && !canAccessRegister && !canAccessTokenIssue && !canAccessPatientVisit && !canAccessGridView && !canAccessAppointments && !canAccessLargeScreen && (
        <div className="bg-rose-50 p-6 rounded-2xl border border-rose-200 text-rose-900 text-center space-y-3 my-6 animate-fadeIn">
          <AlertCircle className="w-10 h-10 text-rose-600 mx-auto" />
          <div>
            <h3 className="text-base font-extrabold text-rose-950">Sub-Desk Access Restricted</h3>
            <p className="text-xs text-rose-800 mt-1 max-w-md mx-auto">
              Your account <strong>({currentUser?.FullName || currentUser?.LoginName})</strong> does not have permission to access any sub-modules inside Patient Desk.
            </p>
          </div>
          <p className="text-[11px] text-rose-600 font-semibold italic">
            Contact your Administrator in Settings &gt; User Access Control to grant access.
          </p>
        </div>
      )}

      {/* RENDER VIEW ACCORDING TO SUB-TAB */}
      {activeSubTab === 'register' && (
        <PatientRegisterView
          editingPatientId={editingPatientId}
          handleCancelEditPatient={handleCancelEditPatient}
          errorMsg={errorMsg}
          successMsg={successMsg}
          handleRegisterPatient={handleRegisterPatient}
          patientName={patientName}
          setPatientName={setPatientName}
          fatherHusband={fatherHusband}
          setFatherHusband={setFatherHusband}
          ageYears={ageYears}
          setAgeYears={setAgeYears}
          sex={sex}
          setSex={setSex}
          maritalStatus={maritalStatus}
          setMaritalStatus={setMaritalStatus}
          occupation={occupation}
          setOccupation={setOccupation}
          mobilePhone={mobilePhone}
          setMobilePhone={setMobilePhone}
          email={email}
          setEmail={setEmail}
          address={address}
          setAddress={setAddress}
          cityId={cityId}
          setCityId={setCityId}
          cities={cities}
          canAdd={canAdd}
          canEditPatient={canEditPatient}
          canBookAppointment={canBookAppointment}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          fetchNhcArchive={fetchNhcArchive}
          isSearchingArchive={isSearchingArchive}
          filteredPatients={filteredPatients}
          filteredNhcPatients={filteredNhcPatients}
          handleStartEditPatient={handleStartEditPatient}
          setSelectedPatientId={setSelectedPatientId}
          setActiveSubTab={setActiveSubTab}
          handleImportNhcPatientToRegister={(nhc) => {
            const newPatient: Patient = {
              PatientID: nhc.PatientID,
              PatientName: nhc.PatientName,
              Father_husband: nhc.Father_husband || 'N/A',
              AgeYears: nhc.AgeYears || 30,
              Sex: (nhc.Sex === 'Male' || nhc.Sex === 'Female' || nhc.Sex === 'Other') ? nhc.Sex : 'Male',
              MaritalStatus: 'Single',
              Occupation: 'N/A',
              Address: nhc.Address || 'N/A',
              CityID: 1,
              Country: 'Pakistan',
              PhoneMobile: nhc.PhoneMobile || '03000000000',
              RegistrationDate: nhc.RegistrationDate || new Date().toISOString()
            };
            onAddPatient(newPatient);
            handleStartEditPatient(newPatient);
          }}
          getResolvedNhcPatientName={getResolvedNhcPatientName}
        />
      )}






      {/* PATIENT PROFILE SUB-TAB VIEW */}
      {activeSubTab === 'profile' && (
        <PatientProfileView
          patients={patients}
          visits={visits}
          visitMedicines={visitMedicines}
          appointments={appointments}
          tokens={tokens}
          cities={cities}
          nhcPatients={nhcPatients}
          selectedPatientId={selectedPatientId || pvSelectedPatientId || ''}
          setSelectedPatientId={(id) => {
            setSelectedPatientId(id);
            setPvSelectedPatientId(id);
          }}
          onOpenVisitDesk={(patId) => {
            setPvSelectedPatientId(patId);
            setSelectedPatientId(patId);
            setActiveSubTab('patient_visit');
          }}
          onOpenTokenIssue={(patId) => {
            setSelectedPatientId(patId);
            setActiveSubTab('token_issue');
          }}
          onOpenBookAppointment={(patId) => {
            setSelectedPatientId(patId);
            setActiveSubTab('book');
          }}
          onEditPatient={(pat) => {
            handleStartEditPatient(pat);
            setActiveSubTab('register');
          }}
          clinicSettings={clinicSettings}
          currentUser={currentUser}
        />
      )}

      {/* TOKEN ISSUE SUB-TAB VIEW */}
      {activeSubTab === 'token_issue' && (
        <InstantTokenIssueView
          patients={patients}
          nhcPatients={nhcPatients}
          nhcArchiveList={nhcArchiveList}
          cities={cities}
          tokens={tokens}
          appDate={appDate}
          shift={shift}
          canIssueToken={canIssueToken}
          canDeleteToken={canDeleteToken}
          onDeleteToken={onDeleteToken}
          onUpdateTokenStatus={onUpdateTokenStatus}
          onPrintThermalSlip={handlePrintThermalFromToken}
          visits={visits}
          appointments={appointments}
          isSearchingArchive={isSearchingArchive}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          fetchNhcArchive={fetchNhcArchive}
          selectedPatientId={selectedPatientId}
          setSelectedPatientId={setSelectedPatientId}
          setOpdTokenModalPatient={setOpdTokenModalPatient}
          setTokenIssueMode={setTokenIssueMode}
          setExistingFee={setExistingFee}
          setAppError={setAppError}
          setIsOpdTokenModalOpen={setIsOpdTokenModalOpen}
          setActiveSubTab={setActiveSubTab}
          onAddPatient={onAddPatient}
          handleStartEditPatient={handleStartEditPatient}
          filteredPatients={filteredPatients}
          filteredNhcPatients={filteredNhcPatients}
        />
      )}
      {false && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="patients-view-token-issue">
          {/* Left Column (2 cols): Patient Database Search Engine & Lookup */}
          <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                  <Ticket className="w-5 h-5" />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedPatientId('');
                    setOpdTokenModalPatient(null);
                    setTokenIssueMode('new_patient');
                    setAppError('');
                    setIsOpdTokenModalOpen(true);
                  }}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition flex items-center space-x-1.5 cursor-pointer shadow-2xs"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>+ Register New Patient Token</span>
                </button>
                {selectedPatientId && (
                  <div className="text-xs bg-emerald-50 text-emerald-800 font-bold px-3 py-1 rounded-lg border border-emerald-200 flex items-center space-x-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Selected: {patients.find(p => p.PatientID === selectedPatientId)?.PatientName || selectedPatientId}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Search Bar */}
            <div className="relative flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder=""
                  value={searchTerm}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSearchTerm(val);
                    if (val.trim().length >= 1) {
                      fetchNhcArchive(val);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      fetchNhcArchive(searchTerm);
                    }
                  }}
                  className="w-full text-xs border border-slate-200 rounded-lg pl-9 pr-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium shadow-2xs"
                />
              </div>
              <button
                type="button"
                onClick={() => fetchNhcArchive(searchTerm)}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition shrink-0 cursor-pointer flex items-center space-x-1.5 shadow-2xs"
              >
                <Search className="w-3.5 h-3.5" />
                <span>Search PHC Archive</span>
              </button>
            </div>

            {isSearchingArchive && (
              <div className="p-3 bg-emerald-50 text-emerald-800 text-xs rounded-lg border border-emerald-200 flex items-center space-x-2 animate-pulse">
                <div className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                <span className="font-semibold">Querying legacy PHC database archive for "{searchTerm}"...</span>
              </div>
            )}

            {/* Results Counter Banner */}
            <div className="flex items-center justify-between text-xs text-slate-500 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200">
              <span>
                Matching Records: <strong className="text-slate-800">{filteredPatients.length} Active</strong> + <strong className="text-indigo-800">{filteredNhcPatients.length} PHC Archive</strong>
              </span>
              <span className="text-[10px] text-slate-400">Click "Select for Token" on any record below to open OPD Token Issue popup</span>
            </div>

            {/* Search Results List */}
            <div className="max-h-[500px] overflow-y-auto space-y-3 divide-y divide-slate-100 pr-1">
              {filteredPatients.length === 0 && filteredNhcPatients.length === 0 ? (
                <div className="text-center py-10 space-y-2">
                  <Search className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-xs text-slate-500 font-semibold">No matching records found for "{searchTerm}"</p>
                  <p className="text-[11px] text-slate-400">Try searching by full or partial name, mobile number, or Patient ID.</p>
                </div>
              ) : (
                <>
                  {/* Active Clinic Patients */}
                  {filteredPatients.map((p, idx) => {
                    const city = cities.find((c) => c.CityID === p.CityID)?.CityName || 'Other';
                    const isSelected = selectedPatientId === p.PatientID;
                    const existingTodayToken = (tokens || []).find(t => t.PatientID === p.PatientID && t.Date === appDate);
                    
                    return (
                      <div 
                        key={`act-tok-${p.PatientID}-${idx}`} 
                        className={`pt-3 first:pt-0 p-3 rounded-xl border transition ${
                          isSelected ? 'bg-emerald-50/60 border-emerald-300 shadow-2xs' : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center space-x-2">
                              <strong className="text-slate-900 font-bold text-sm">{p.PatientName}</strong>
                              <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Active</span>
                              {existingTodayToken && (
                                <span className="text-[9px] bg-amber-100 text-amber-900 font-black px-2 py-0.5 rounded-full uppercase">
                                  Token #{existingTodayToken.TokenNo}
                                </span>
                              )}
                            </div>
                            <p className="text-xxs font-mono text-slate-500 font-semibold mt-0.5">
                              ID: {p.PatientID} {p.Father_husband && p.Father_husband !== 'N/A' ? `| S/O, W/O: ${p.Father_husband}` : ''}
                            </p>
                          </div>
                          <span className="text-xxs bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded uppercase">
                            {p.Sex} ({p.AgeYears} Yrs)
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 mt-2 text-xs text-slate-600">
                          <div className="flex items-center">
                            <Phone className="w-3 h-3 mr-1.5 text-slate-400 shrink-0" />
                            <span className="font-mono text-slate-800">{p.PhoneMobile}</span>
                          </div>
                          <div className="flex items-center">
                            <MapPin className="w-3 h-3 mr-1.5 text-slate-400 shrink-0" />
                            <span className="truncate">{p.Address}, {city}</span>
                          </div>
                        </div>

                        <div className="pt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 mt-2">
                          <span className="text-[10px] text-slate-400">Reg: {formatDisplayDate(p.RegistrationDate)}</span>
                          
                          <div className="flex items-center space-x-2">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedPatientId(p.PatientID);
                                setOpdTokenModalPatient(p);
                                setTokenIssueMode('existing');
                                setExistingFee('');
                                setAppError('');
                                setIsOpdTokenModalOpen(true);
                              }}
                              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition flex items-center space-x-1.5 cursor-pointer shadow-2xs"
                            >
                              <Ticket className="w-3.5 h-3.5" />
                              <span>Select for Token</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* PHC Archive Patients */}
                  {filteredNhcPatients.map((p, idx) => {
                    const isSelected = selectedPatientId === p.PatientID;
                    return (
                      <div 
                        key={`nhc-tok-${p.PatientID}-${idx}`} 
                        className={`pt-3 p-3 rounded-xl border transition ${
                          isSelected ? 'bg-indigo-50/60 border-indigo-300 shadow-2xs' : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center space-x-2">
                              <strong className="text-slate-900 font-bold text-sm">{p.PatientName}</strong>
                              <span className="text-[9px] bg-indigo-100 text-indigo-800 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">PHC Archive</span>
                            </div>
                            <p className="text-xxs font-mono text-slate-500 font-semibold mt-0.5">
                              ID: {p.PatientID} | Guardian: {p.Father_husband || 'N/A'}
                            </p>
                          </div>
                          <span className="text-xxs bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded uppercase">
                            {p.Sex} ({p.AgeYears} Yrs)
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 mt-2 text-xs text-slate-600">
                          <div className="flex items-center">
                            <Phone className="w-3 h-3 mr-1.5 text-slate-400 shrink-0" />
                            <span className="font-mono text-slate-800">{p.PhoneMobile || 'N/A'}</span>
                          </div>
                          <div className="flex items-center">
                            <MapPin className="w-3 h-3 mr-1.5 text-slate-400 shrink-0" />
                            <span className="truncate">{p.Address || 'N/A'}</span>
                          </div>
                        </div>

                        {p.MedicalCondition && (
                          <div className="text-[10px] bg-indigo-50/60 p-1.5 rounded-lg text-indigo-900 italic mt-2">
                            Legacy Condition: {p.MedicalCondition}
                          </div>
                        )}

                        <div className="pt-3 flex items-center justify-between border-t border-slate-100 mt-2">
                          <span className="text-[10px] text-slate-400">Legacy PHC File</span>
                          <button
                            type="button"
                            onClick={() => {
                              const newPatient: Patient = {
                                PatientID: p.PatientID,
                                PatientName: p.PatientName,
                                Father_husband: p.Father_husband || 'N/A',
                                AgeYears: p.AgeYears || 30,
                                Sex: (p.Sex === 'Male' || p.Sex === 'Female' || p.Sex === 'Other') ? p.Sex : 'Male',
                                MaritalStatus: 'Single',
                                Occupation: 'N/A',
                                Address: p.Address || 'N/A',
                                CityID: 1, // Lahore
                                Country: 'Pakistan',
                                PhoneMobile: p.PhoneMobile || '03000000000',
                                RegistrationDate: p.RegistrationDate || new Date().toISOString().split('T')[0]
                              };
                              onAddPatient(newPatient);
                              setSelectedPatientId(p.PatientID);
                              setOpdTokenModalPatient(newPatient);
                              setTokenIssueMode('existing');
                              setExistingFee('');
                              setAppError('');
                              setIsOpdTokenModalOpen(true);
                            }}
                            className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition flex items-center space-x-1.5 cursor-pointer shadow-2xs"
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                            <span>Import Archive & Select for Token</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          </div>

          {/* Right Column (1 col): Issued Tokens Summary Box for Today */}
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-2">
              <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                <h4 className="text-xs font-bold text-slate-900 flex items-center">
                  <ListOrdered className="w-3.5 h-3.5 text-emerald-600 mr-1.5" />
                  Today's Tokens ({tokens.filter(t => t.Date === appDate).length})
                </h4>
                <span className="text-[10px] text-slate-500 font-mono">{appDate}</span>
              </div>

              <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 text-xs">
                {tokens.filter(t => t.Date === appDate).length === 0 ? (
                  <p className="text-[11px] text-slate-400 italic text-center py-3">No tokens issued for {appDate} yet.</p>
                ) : (
                  tokens.filter(t => t.Date === appDate).map((t) => {
                    const patName = patients.find(p => p.PatientID === t.PatientID)?.PatientName || t.PatientID;
                    const isCompleted = t.Status === 2 ||
                      (visits || []).some(v => v.PatientID === t.PatientID && (v.VisitDate ? v.VisitDate.split('T')[0] === appDate : false)) ||
                      (appointments || []).some(a => a.PatientID === t.PatientID && a.AppointmentDate === appDate && a.Status === 4);

                    return (
                      <div key={`tok-${t.TokenNo}-${t.Shift}`} className="p-2 bg-slate-50 rounded-lg border border-slate-200 flex justify-between items-center text-xs">
                        <div>
                          <div className="flex items-center space-x-1.5">
                            <span className="font-mono font-black text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded text-[10px]">
                              #{t.TokenNo}
                            </span>
                            <strong className="text-slate-900 font-bold text-xs">{patName}</strong>
                          </div>
                          <span className="text-[10px] text-slate-500">{t.Shift === 1 ? 'Morning' : 'Evening'} Shift</span>
                        </div>
                        <div className="flex items-center space-x-1.5">
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                            isCompleted || t.Status === 2 ? 'bg-emerald-100 text-emerald-800' :
                            t.Status === 1 ? 'bg-amber-100 text-amber-800' : 'bg-slate-200 text-slate-700'
                          }`}>
                            {isCompleted || t.Status === 2 ? 'Visited' : t.Status === 1 ? 'Waiting' : 'Closed'}
                          </span>

                          <button
                            type="button"
                            onClick={() => {
                              if (!canDeleteToken) {
                                alert('Access Control Security: You do not have permission to delete issued tokens. Administrator rights required.');
                                return;
                              }
                              if (window.confirm(`Are you sure you want to delete issued Token #${t.TokenNo} for ${patName}?`)) {
                                if (onDeleteToken) {
                                  onDeleteToken(t.TokenNo, t.Shift);
                                } else {
                                  onUpdateTokenStatus(t.TokenNo, t.Shift, 3);
                                }
                                setAppSuccess(`Token #${t.TokenNo} deleted successfully.`);
                                setTimeout(() => setAppSuccess(''), 3000);
                              }
                            }}
                            title="Delete issued token"
                            className="p-1 rounded transition cursor-pointer flex items-center justify-center text-rose-600 hover:text-rose-800 hover:bg-rose-50"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PATIENT VISIT SUB-TAB VIEW */}
      {activeSubTab === 'patient_visit' && (
        <div className="space-y-3" id="patient-visit-subtab">
          
          {/* Combined Header & Patient Details Bar */}
          <div className="bg-white text-slate-800 p-2 rounded-xl border border-slate-200 shadow-2xs space-y-1.5">
            {/* Top Row: Title, Search, Dropdown, Visit Date, Nav Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-1.5 border-b border-slate-100 pb-1.5">
              {/* Title & Daily Collection */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2 w-full sm:w-auto">
                <div className="flex items-center space-x-1.5 shrink-0">
                  <div className="p-1 bg-emerald-50 text-emerald-600 rounded-lg shrink-0 border border-emerald-100">
                    <Stethoscope className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 tracking-tight">Patient Visit & Prescription Desk</h3>
                  </div>
                </div>

                {/* Shift-wise Daily Collection Display - Mobile Responsive */}
                <div 
                  onClick={() => setShowDailyBreakdownMobile(prev => !prev)}
                  className="group relative flex flex-wrap items-center justify-between sm:justify-start gap-1.5 bg-slate-900 text-white px-2.5 py-1 rounded-lg border border-emerald-500/40 shadow-2xs text-xs font-bold transition hover:bg-slate-800 cursor-pointer w-full sm:w-auto"
                >
                  <div className="flex items-center space-x-1.5 shrink-0">
                    <Coins className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span className="text-emerald-300 font-extrabold text-[10px] uppercase tracking-wider whitespace-nowrap">
                      Daily Collection ({shift === 1 ? 'Morning' : 'Evening'}):
                    </span>
                    <span className="text-amber-300 font-black text-xs font-mono whitespace-nowrap">
                      PKR {shiftDailyCollection.grandTotal.toLocaleString()}
                    </span>
                  </div>

                  {/* Shift Quick Switch Buttons */}
                  <div className="flex items-center space-x-1 shrink-0 ml-auto sm:ml-1">
                    <div className="flex items-center bg-slate-800 p-0.5 rounded-md border border-slate-700 text-[9px] font-extrabold">
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setShift(1); }}
                        className={`px-1.5 py-0.5 rounded cursor-pointer transition ${
                          shift === 1 ? 'bg-emerald-600 text-white font-black shadow-2xs' : 'text-slate-400 hover:text-white'
                        }`}
                        title="Switch to Morning Shift Collection"
                      >
                        Morning
                      </button>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setShift(2); }}
                        className={`px-1.5 py-0.5 rounded cursor-pointer transition ${
                          shift === 2 ? 'bg-blue-600 text-white font-black shadow-2xs' : 'text-slate-400 hover:text-white'
                        }`}
                        title="Switch to Evening Shift Collection"
                      >
                        Evening
                      </button>
                    </div>
                  </div>

                  {/* Hover & Tap Breakdown Tooltip */}
                  <div className={`absolute top-full left-0 sm:left-auto right-0 sm:right-auto mt-1.5 ${showDailyBreakdownMobile ? 'flex' : 'hidden group-hover:flex'} flex-col bg-slate-900 text-white p-3 rounded-xl border border-slate-700 shadow-xl z-50 min-w-[240px] max-w-[calc(100vw-24px)] text-xs space-y-1.5 pointer-events-auto sm:pointer-events-none`}>
                    <div className="font-extrabold text-emerald-400 border-b border-slate-800 pb-1 flex justify-between items-center text-[11px]">
                      <span>Shift Revenue Breakdown</span>
                      <span className="text-[9px] text-slate-400 uppercase font-mono">{shift === 1 ? 'Morning' : 'Evening'} Shift</span>
                    </div>
                    <div className="flex justify-between text-slate-300 text-[11px]">
                      <span>Clinical Medicine:</span>
                      <span className="font-mono font-bold text-white">PKR {shiftDailyCollection.clinicalMedsTotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-slate-300 text-[11px]">
                      <span>File Fee:</span>
                      <span className="font-mono font-bold text-white">PKR {shiftDailyCollection.fileTotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-slate-300 text-[11px]">
                      <span>Cards Fee:</span>
                      <span className="font-mono font-bold text-white">PKR {shiftDailyCollection.cardTotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-slate-300 text-[11px]">
                      <span>OPD / Tokens:</span>
                      <span className="font-mono font-bold text-white">PKR {shiftDailyCollection.opdTotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-slate-300 text-[11px]">
                      <span>Store / Pharmacy:</span>
                      <span className="font-mono font-bold text-white">PKR {shiftDailyCollection.storePaymentTotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-amber-300 font-extrabold border-t border-slate-800 pt-1 text-xs">
                      <span>Grand Total:</span>
                      <span className="font-mono text-sm font-black">PKR {shiftDailyCollection.grandTotal.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Controls */}
              <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
                {/* Search Box + Search Button */}
                <div className="flex items-center space-x-1 shrink-0 w-full sm:w-auto">
                  <div className="relative flex-1 sm:w-44">
                    <Search className="absolute left-2.5 top-2.5 sm:top-2 h-3.5 w-3.5 sm:h-3 sm:w-3 text-slate-400" />
                    <input
                      type="text"
                      placeholder=""
                      value={pvPatientSearch}
                      onFocus={() => {
                        // When doctor clicks/focuses search box, prepare form for new patient check
                        if (editingVisitId) {
                          setEditingVisitId(null);
                        }
                      }}
                      onChange={(e) => {
                        const val = e.target.value;
                        setPvPatientSearch(val);
                        const trimmed = val.trim();
                        const cleanNum = trimmed.replace(/\D/g, '');

                        if (!trimmed) {
                          // Search box is empty -> clear record, history & fields
                          setPvSelectedPatientId('');
                          resetPvConsultationFields('');
                          setPvSelectedHistoryDate('ALL');
                          setPvNhcHistory([]);
                          setIsMultiPatientModalOpen(false);
                          return;
                        }

                        // Fetch NHC archive records in background as doctor types
                        fetchNhcArchive(trimmed);

                        // 1. Check if typed query matches any Patient ID, MR#, or Name directly (EXCLUDING phone number)
                        const allPats = [...patients, ...(nhcPatients || []), ...nhcArchiveList, ...pvNhcHistory];
                        const idOrNameMatch = allPats.find(p => p && (
                          String(p.PatientID || '').trim().toLowerCase() === trimmed.toLowerCase() ||
                          (cleanNum.length > 0 && String(p.PatientID || '').replace(/\D/g, '').replace(/^0+/, '') === cleanNum.replace(/^0+/, '')) ||
                          matchPatientIdOrNameOnly(p, trimmed)
                        ));

                        if (idOrNameMatch && idOrNameMatch.PatientID) {
                          if (idOrNameMatch.PatientID !== pvSelectedPatientId) {
                            resetPvConsultationFields(idOrNameMatch.PatientID);
                            setPvSelectedPatientId(idOrNameMatch.PatientID);
                            setPvSelectedHistoryDate('ALL');
                            loadPvPatientHistory(idOrNameMatch.PatientID, false);
                          }
                          return;
                        }

                        // 2. Mobile Number Search (checks Pakistani mobile prefixes: 0300-0309, 0310-0319, 0320-0327, 0330-0339, 0340-0349, 0355, 0370, +923)
                        const isMobilePattern = isPakistaniMobilePrefix(trimmed);

                        if (isMobilePattern) {
                          if (cleanNum.length >= 9) {
                            const phoneMatches = allPats.filter(p => p && String(p.PhoneMobile || '').replace(/\D/g, '').includes(cleanNum));
                            const uniquePhoneMap = new Map<string, any>();
                            phoneMatches.forEach(p => uniquePhoneMap.set(String(p.PatientID).trim().toLowerCase(), p));

                            if (uniquePhoneMap.size > 1) {
                              // Multiple patients found with this mobile number -> Open popup selection modal!
                              setTimeout(() => {
                                handleExecutePatientSearch();
                              }, 300);
                            } else if (uniquePhoneMap.size === 1) {
                              // Exactly 1 patient found -> Auto select in real time
                              const matchedPt = Array.from(uniquePhoneMap.values())[0];
                              if (matchedPt && matchedPt.PatientID !== pvSelectedPatientId) {
                                resetPvConsultationFields(matchedPt.PatientID);
                                setPvSelectedPatientId(matchedPt.PatientID);
                                setPvSelectedHistoryDate('ALL');
                                loadPvPatientHistory(matchedPt.PatientID, false);
                              }
                            }
                          } else {
                            // Mobile search is < 9 digits -> Check if token number matches
                            const tokMatch = (tokens || []).find(t => String(t.TokenNo) === cleanNum);
                            if (tokMatch && tokMatch.PatientID && tokMatch.PatientID !== pvSelectedPatientId) {
                              resetPvConsultationFields(tokMatch.PatientID);
                              setPvSelectedPatientId(tokMatch.PatientID);
                              setPvSelectedHistoryDate('ALL');
                              loadPvPatientHistory(tokMatch.PatientID, false);
                            }
                          }
                        } else {
                          // 3. General Search for non-mobile queries
                          const generalMatch = pvPatientDropdownOptions.find(p => matchPatientRecord(p, trimmed))
                            || allPats.find(p => matchPatientRecord(p, trimmed));

                          if (generalMatch && generalMatch.PatientID && generalMatch.PatientID !== pvSelectedPatientId) {
                            resetPvConsultationFields(generalMatch.PatientID);
                            setPvSelectedPatientId(generalMatch.PatientID);
                            setPvSelectedHistoryDate('ALL');
                            loadPvPatientHistory(generalMatch.PatientID, false);
                          }
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleExecutePatientSearch();
                        }
                      }}
                      className="w-full text-xs sm:text-[11px] bg-slate-50 text-slate-800 border border-slate-200 rounded-lg sm:rounded-md pl-8 sm:pl-7 pr-7 sm:pr-6 py-2 sm:py-1 focus:outline-none focus:ring-1 focus:ring-emerald-500 placeholder-slate-400 focus:bg-white min-h-[38px] sm:min-h-0"
                    />
                    {pvPatientSearch && (
                      <button
                        type="button"
                        onClick={() => {
                          setPvPatientSearch('');
                          setPvSelectedPatientId('');
                          resetPvConsultationFields('');
                          setPvSelectedHistoryDate('ALL');
                          setPvNhcHistory([]);
                          setIsMultiPatientModalOpen(false);
                        }}
                        className="absolute right-2 top-2.5 sm:top-1.5 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                        title="Clear search"
                      >
                        <X className="w-3.5 h-3.5 sm:w-3 sm:h-3" />
                      </button>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={handleExecutePatientSearch}
                    className="px-3 sm:px-2 py-2 sm:py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-[11px] font-bold rounded-lg sm:rounded-md shadow-2xs transition flex items-center space-x-0.5 cursor-pointer shrink-0 min-h-[38px] sm:min-h-0"
                  >
                    <Search className="w-3.5 h-3.5 sm:w-3 sm:h-3" />
                    <span>Search</span>
                  </button>

                  {/* Multiple Patients Found Quick Action Button */}
                  {(() => {
                    const q = pvPatientSearch.trim().toLowerCase();
                    const cleanNum = q.replace(/\D/g, '');
                    const isMobile = isPakistaniMobilePrefix(q);

                    if (q.length >= 1 && !pvSelectedPatientId) {
                      const allPatsForBadge = [...patients, ...(nhcPatients || []), ...nhcArchiveList, ...pvNhcHistory];
                      const hasIdMatch = allPatsForBadge.some(p => p && matchPatientIdOrNameOnly(p, q));

                      // If query is a mobile prefix AND less than 9 digits AND no Patient ID matched -> don't show badge
                      if (isMobile && cleanNum.length < 9 && !hasIdMatch) return null;

                      const matchedCount = pvPatientDropdownOptions.filter(p => matchPatientRecord(p, q)).length;
                      if (matchedCount > 1) {
                        return (
                          <button
                            type="button"
                            onClick={() => handleExecutePatientSearch()}
                            className="text-[10px] font-extrabold text-amber-900 bg-amber-100 hover:bg-amber-200 border border-amber-300 px-2 py-1 rounded-md flex items-center space-x-1 cursor-pointer transition animate-pulse shrink-0"
                            title="Click to view all matching patients in selection modal"
                          >
                            <Users className="w-3 h-3 text-amber-700 shrink-0" />
                            <span>‚ö° {matchedCount} Patients Found - Click to Choose</span>
                          </button>
                        );
                      }
                    }
                    return null;
                  })()}
                </div>


                {/* Visit Date Display (Calendar Input Removed) */}
                <div className="flex items-center space-x-1 shrink-0">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Visit:</span>
                  <span className="text-[10px] font-extrabold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-mono">
                    {formatDisplayDate(pvVisitDate)}
                  </span>
                </div>

                {/* Visit Action Buttons */}
                <div className="flex items-center space-x-1 shrink-0">
                  {/* Print Report Button */}
                  <button
                    type="button"
                    onClick={handlePrintDailyReport}
                    className="px-1.5 py-0.5 bg-slate-900 hover:bg-slate-800 text-amber-300 border border-slate-700 text-[10px] font-bold rounded-md transition flex items-center space-x-0.5 cursor-pointer shadow-2xs"
                    title="Print Patient Visit & Financial Report with Custom Date Range"
                  >
                    <Printer className="w-3 h-3 text-amber-400" />
                    <span>Print Report</span>
                  </button>

                  {/* Organization Claim Bill Button */}
                  <button
                    type="button"
                    onClick={() => {
                      if (!pvSelectedPatientId) {
                        alert('Please select a patient first.');
                        return;
                      }
                      setIsClaimBillModalOpen(true);
                    }}
                    disabled={!pvSelectedPatientId}
                    className="px-1.5 py-0.5 bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-300 disabled:opacity-40 text-[10px] font-bold rounded-md transition flex items-center space-x-0.5 cursor-pointer shadow-2xs"
                    title="Generate Official Organization / Corporate Reimbursement Claim Bill"
                  >
                    <Building2 className="w-3 h-3 text-blue-700" />
                    <span>Claim Bill / Invoice</span>
                  </button>

                  <button
                    type="button"
                    onClick={handlePrintPreviousRxDirect}
                    disabled={!pvSelectedPatientId || combinedPreviousHistory.length === 0}
                    className="px-1.5 py-0.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-250 disabled:opacity-40 text-[10px] font-bold rounded-md transition flex items-center space-x-0.5 cursor-pointer shadow-2xs"
                    title="Print Previous Patient Prescription (Rx)"
                  >
                    <Printer className="w-3 h-3 text-emerald-700" />
                    <span>Print Previous Rx</span>
                  </button>

                  {/* Search Record Button */}
                  <button
                    type="button"
                    onClick={() => handleOpenNewPatientModal()}
                    className="px-2.5 py-1 text-xs font-black rounded-md transition flex items-center space-x-1 cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs"
                    title="Search Mobile No or Patient ID for next patient checkup"
                  >
                    <Search className="w-3.5 h-3.5" />
                    <span>Search Record</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Bottom Row: Selected Patient Details Bar */}
            {selectedPvPatient ? (() => {
              const activeTok = (tokens || []).find(t => t.PatientID === selectedPvPatient.PatientID);
              return (
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-1.5 text-xs">
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 rounded-full bg-emerald-600 text-white font-black text-[11px] flex items-center justify-center shrink-0 border border-emerald-500 shadow-2xs">
                      {selectedPvPatient.PatientName.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center space-x-1.5 flex-wrap gap-1">
                        <span className="font-extrabold text-xs text-slate-900">{selectedPvPatient.PatientName}</span>
                        <span className="text-[10px] bg-emerald-50 text-emerald-700 px-1.5 py-0.2 rounded-md font-mono font-bold border border-emerald-200">
                          {selectedPvPatient.PatientID}
                        </span>
                        {activeTok && (
                          <span className="text-[10px] bg-amber-100 text-amber-950 font-black px-2 py-0.2 rounded-md font-mono flex items-center border border-amber-300">
                            <ListOrdered className="w-3 h-3 mr-0.5" />
                            Token #{activeTok.TokenNo} ({activeTok.Shift === 1 ? 'Morning' : 'Evening'})
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-600">
                        Gender: <span className="font-bold text-slate-800">{selectedPvPatient.Sex}</span> | Age: <span className="font-bold text-slate-800">{selectedPvPatient.AgeYears} yrs</span> | Mobile: <span className="font-bold text-slate-800">{selectedPvPatient.PhoneMobile}</span> | Guardian: <span className="font-bold text-slate-800">{selectedPvPatient.Father_husband || 'N/A'}</span>
                      </p>
                    </div>
                  </div>
                  <div className="text-[10px] text-slate-600 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200 shrink-0">
                    City: <span className="font-bold text-slate-800">{cities.find(c => c.CityID === selectedPvPatient.CityID)?.CityName || 'Lahore'}</span> | Reg: <span className="font-bold text-slate-800">{formatDisplayDate(selectedPvPatient.RegistrationDate)}</span>
                  </div>
                </div>
              );
            })() : (
              <div className="text-[10px] text-slate-500 italic flex items-center space-x-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-pulse"></span>
                <span>No patient selected. Please enter a Mobile No or Patient ID in the search box above to view patient records.</span>
              </div>
            )}
          </div>

          {/* 2-COLUMN GRID LAYOUT FOR PREVIOUS HISTORY & CURRENT VISIT */}
          <div className={`grid grid-cols-1 ${hidePreviousHistory ? '' : 'lg:grid-cols-2'} gap-3 items-start`}>
            {/* BOX 1: PREVIOUS HISTORY (WITH VISIT DATE SEPARATE DROPDOWN) */}
            {hidePreviousHistory ? (
              <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-3 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                    <History className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900">Previous History & Prescriptions</h3>
                    <p className="text-[10px] text-slate-500">
                      {pvSelectedPatientId && combinedPreviousHistory.length === 0
                        ? 'No previous history or prescriptions recorded for this patient'
                        : 'Section hidden'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {pvSelectedPatientId && (
                    <button
                      type="button"
                      onClick={() => setHistoryAlertModalOpen(true)}
                      className="px-2.5 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 text-[10px] font-bold rounded-lg transition flex items-center space-x-1 cursor-pointer shadow-2xs"
                      title="Open Previous History Alert Popup"
                    >
                      <AlertCircle className="w-3.5 h-3.5 text-amber-700" />
                      <span>Alert Popup</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setHidePreviousHistory(false)}
                    className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-[10px] font-bold rounded-lg transition flex items-center space-x-1 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Show History</span>
                  </button>
                </div>
              </div>
            ) : (
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-3 space-y-2.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-2 gap-2">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                  <History className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900">Previous History & Prescriptions</h3>
                  <p className="text-[10px] text-slate-500">Select a visit date from the side navigation to inspect consultation history</p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setHidePreviousHistory(true)}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold rounded-lg transition flex items-center space-x-1 cursor-pointer"
                  title="Hide Previous History & Prescriptions"
                >
                  <EyeOff className="w-3.5 h-3.5 text-slate-600" />
                  <span>Hide History</span>
                </button>

                {pvSelectedPatientId && (
                  <>
                    <button
                      type="button"
                      onClick={() => setHistoryAlertModalOpen(true)}
                      className="px-2.5 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 text-[10px] font-bold rounded-lg transition flex items-center space-x-1 cursor-pointer shadow-2xs"
                      title="Open Previous History Alert Popup"
                    >
                      <AlertCircle className="w-3.5 h-3.5 text-amber-700" />
                      <span>Popup Alert</span>
                    </button>

                    {uniquePvVisitDates.length > 0 && (
                      <select
                        value={pvSelectedHistoryDate || (uniquePvVisitDates[0] || 'ALL')}
                        onChange={(e) => setPvSelectedHistoryDate(e.target.value)}
                        className="bg-indigo-50 hover:bg-indigo-100 text-indigo-950 border border-indigo-300 text-[10px] font-bold rounded-lg px-2 py-1 cursor-pointer focus:ring-1 focus:ring-indigo-500 focus:outline-none transition shadow-2xs"
                        title="Select Visit Date from Previous History"
                      >
                        {uniquePvVisitDates.map((d, idx) => (
                          <option key={d} value={d}>
                            {idx === 0 ? `Latest Visit Date: ${formatDisplayDate(d)}` : `Visit Date: ${formatDisplayDate(d)}`}
                          </option>
                        ))}
                        <option value="ALL">Show All Visit Dates ({uniquePvVisitDates.length})</option>
                      </select>
                    )}

                    <button
                      type="button"
                      onClick={() => loadPvPatientHistory(pvSelectedPatientId, true)}
                      className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold rounded-lg transition flex items-center space-x-1 cursor-pointer"
                      title="Reload PHC History"
                    >
                      <History className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Content of Previous History */}
            {!pvSelectedPatientId ? (
              <div className="text-center py-6 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                <Search className="w-6 h-6 text-slate-300 mx-auto mb-1" />
                <p className="text-xs font-bold text-slate-600">No Patient Selected</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Please search or select a Patient ID above to view visit history.</p>
              </div>
            ) : isFetchingPvHistory ? (
              <div className="text-center py-6 bg-indigo-50/30 rounded-lg border border-indigo-100 flex flex-col items-center justify-center space-y-1">
                <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-xs font-bold text-indigo-800">Fetching Previous PHC Patient History...</p>
              </div>
            ) : combinedPreviousHistory.length === 0 ? (
              <div className="text-center py-6 bg-amber-50/50 rounded-lg border border-amber-200/60 p-3">
                <p className="text-xs font-bold text-amber-800">No History Records Found for Patient</p>
                <p className="text-[10px] text-amber-600 mt-0.5">There are no previous consultation records for this patient.</p>
              </div>
            ) : (
              /* FULL-WIDTH HISTORY DETAILS LAYOUT */
              <div className="w-full space-y-2.5 min-h-[200px]">
                {displayedPreviousHistory.length === 0 ? (
                  <div className="text-center py-8 bg-amber-50/50 rounded-lg border border-amber-200 p-3">
                    <p className="text-xs font-bold text-amber-800">No Records Found for Selected Date</p>
                    <p className="text-[10px] text-amber-600 mt-0.5">Please select another visit date from the top dropdown.</p>
                  </div>
                ) : (
                    <>
                      {allSymptomsText && (
                        <div className="text-[10px] text-slate-700 bg-slate-100/80 px-2.5 py-1 rounded-md border border-slate-200 font-medium">
                          <strong className="font-bold text-slate-900">Diagnosis / Symptoms:</strong> {allSymptomsText}
                        </div>
                      )}

                      {(allLabTestsText || allMedicalReportResultsText) && (
                        <div className="text-[10px] bg-blue-50/80 p-2.5 rounded-lg border border-blue-200 text-blue-950 font-medium space-y-1.5 shadow-2xs">
                          <div className="flex items-center space-x-1.5 font-bold text-blue-900 border-b border-blue-200/80 pb-1">
                            <FileText className="w-3.5 h-3.5 text-blue-700 shrink-0" />
                            <span>Advised Lab Investigations & Medical Report Results:</span>
                          </div>
                          {allLabTestsText && (
                            <div>
                              <span className="text-slate-500 font-bold uppercase text-[8px] tracking-wider block">Advised Lab Tests:</span>
                              <p className="font-mono text-slate-800 font-semibold">{allLabTestsText}</p>
                            </div>
                          )}
                          {allMedicalReportResultsText && (
                            <div className={allLabTestsText ? 'pt-1 border-t border-blue-200/60' : ''}>
                              <span className="text-indigo-900 font-extrabold uppercase text-[8px] tracking-wider block mb-0.5">
                                Medical Report Result (nhc_Patient_history):
                              </span>
                              <div className="bg-white border border-indigo-100 rounded-md p-2 text-indigo-950 font-semibold text-[10px] whitespace-pre-wrap">
                                {allMedicalReportResultsText}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="space-y-3">
                        {groupedRxByDate.map((group, groupIdx) => (
                          <div key={`grp-rx-${group.date}-${groupIdx}`} className="border border-slate-300 rounded-xl bg-white p-2.5 space-y-2 shadow-2xs">
                            {/* Top Row: Date & Item Count Badge + Copy Date Rx Button */}
                            <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                              <span className="font-bold text-slate-900 text-xs font-mono flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                                <span>Visit Date: {formatDisplayDate(group.date)}</span>
                              </span>
                              <div className="flex items-center space-x-1.5">
                                <button
                                  type="button"
                                  title="Edit this visit record in current visit form"
                                  onClick={() => {
                                    const vMatch = (visits || []).find(v => v.PatientID === pvSelectedPatientId && (v.VisitDate ? v.VisitDate.split('T')[0] : '') === group.date);
                                    const nhcMatch = pvNhcHistory.find(nhc => (nhc.VisitDate ? nhc.VisitDate.split('T')[0] : nhc.date) === group.date);
                                    if (vMatch) handleEditVisit(vMatch);
                                    else if (nhcMatch) handleEditVisit(nhcMatch);
                                    else {
                                      setEditingVisitId(`VIS-${group.date}`);
                                      setPvVisitDate(group.date);
                                      if (group.symptoms) setPvSymptomsDiagnosis(group.symptoms);
                                      if (group.medicalReportResult && group.medicalReportResult !== 'N/A') setPvMedicalReportResult(group.medicalReportResult);
                                      if (group.labTestAdvice && group.labTestAdvice !== 'N/A') setPvLabTestAdvice(group.labTestAdvice);
                                      const cItems = group.clinicalItems.map((i, idx) => ({ id: String(idx + 1), medicineName: i.medicineName, dosage: i.dosage }));
                                      const pItems = group.patentItems.map((i, idx) => ({ id: String(idx + 1), medicineName: i.medicineName, dosage: i.dosage }));
                                      if (cItems.length > 0) setPvClinicalItems(cItems);
                                      if (pItems.length > 0) setPvPatientItems(pItems);
                                      setPvSaveSuccess(`Visit record for ${group.date} loaded for editing.`);
                                    }
                                  }}
                                  className="px-2 py-0.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-250 text-[9px] font-bold rounded flex items-center space-x-1 transition cursor-pointer"
                                >
                                  <Pencil className="w-2.5 h-2.5 text-amber-700" />
                                  <span>Edit Visit</span>
                                </button>
                                <button
                                  type="button"
                                  title="Copy this date's prescription to current visit"
                                  onClick={() => {
                                    const cItems = group.clinicalItems
                                      .filter(i => i.medicineName && i.medicineName !== 'None prescribed' && i.medicineName !== 'None recorded')
                                      .map((i, idx) => ({ id: String(Date.now() + idx), medicineName: i.medicineName, dosage: i.dosage && i.dosage !== 'As directed' ? i.dosage : '' }));

                                    const pItems = group.patentItems
                                      .filter(i => i.medicineName && i.medicineName !== 'None prescribed' && i.medicineName !== 'None recorded')
                                      .map((i, idx) => ({ id: String(Date.now() + idx + 100), medicineName: i.medicineName, dosage: i.dosage && i.dosage !== 'As directed' ? i.dosage : '' }));

                                    const cExp = group.clinicalItems.map(i => i.expireDate).find(Boolean) || '';

                                    if (cItems.length > 0) setPvClinicalItems(cItems);
                                    if (pItems.length > 0) setPvPatientItems(pItems);
                                    if (cExp) setPvClinicalMedicineExpireDate(cExp);

                                    if (group.symptoms) {
                                      setPvSymptomsDiagnosis(group.symptoms);
                                    }
                                    if (group.medicalReportResult && group.medicalReportResult !== 'N/A') {
                                      setPvMedicalReportResult(group.medicalReportResult);
                                    }
                                    if (group.labTestAdvice && group.labTestAdvice !== 'N/A') {
                                      setPvLabTestAdvice(group.labTestAdvice);
                                    }

                                    setPvSaveSuccess(`Prescription from ${group.date} copied into current visit form!`);
                                    setHidePreviousHistory(true);
                                    setTimeout(() => setPvSaveSuccess(''), 4000);
                                  }}
                                  className="px-2 py-0.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-[9px] font-bold rounded flex items-center space-x-1 transition cursor-pointer"
                                >
                                   <Copy className="w-2.5 h-2.5 text-indigo-600" />
                                  <span>Copy Rx</span>
                                </button>
                                <button
                                  type="button"
                                  title="Print this previous visit prescription"
                                  onClick={() => handlePrintPreviousVisitPrescription(group)}
                                  className="px-2 py-0.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-[9px] font-bold rounded flex items-center space-x-1 transition cursor-pointer"
                                >
                                  <Printer className="w-2.5 h-2.5 text-emerald-600" />
                                  <span>Print Rx</span>
                                </button>
                                <button
                                  type="button"
                                  title="Send this previous visit prescription via WhatsApp"
                                  onClick={() => {
                                    const cItems = (group.clinicalItems || [])
                                      .filter((i: any) => i.medicineName && i.medicineName !== 'None prescribed' && i.medicineName !== 'None recorded');
                                    const pItems = (group.patentItems || [])
                                      .filter((i: any) => i.medicineName && i.medicineName !== 'None prescribed' && i.medicineName !== 'None recorded');
                                    handleSendWhatsAppRx(
                                      selectedPvPatient,
                                      group.date,
                                      cItems,
                                      pItems,
                                      group.symptoms || 'Routine Consultation',
                                      (group as any).labAdvice || (group as any).labTestAdvice || 'None'
                                    );
                                  }}
                                  className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[9px] font-bold rounded flex items-center space-x-1 cursor-pointer transition shadow-2xs"
                                >
                                  <WhatsAppIcon className="w-2.5 h-2.5 fill-current text-white" />
                                  <span>WhatsApp</span>
                                </button>
                                <span className="text-[9px] font-extrabold text-slate-500 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded uppercase tracking-wider">
                                  {group.totalItems} ITEM(S)
                                </span>
                              </div>
                            </div>

                            {/* CLINICAL COMPOUNDED ('C') EXCEL TABLE */}
                            {group.clinicalItems.length > 0 && (
                              <div className="space-y-1">
                                <div className="inline-block bg-amber-100 text-amber-950 font-extrabold text-[9px] uppercase border border-amber-300 px-2 py-0.5 rounded">
                                  Clinical Compounded ('C')
                                </div>
                                <div className="overflow-x-auto border border-amber-300 rounded-lg bg-white shadow-2xs">
                                  <table className="w-full text-left border-collapse font-sans text-xs">
                                    <thead>
                                      <tr className="bg-amber-100/90 border-b border-amber-300 text-[10px] font-black text-amber-950 uppercase tracking-wider">
                                        <th className="py-1 px-2 w-7 text-center border-r border-amber-200">#</th>
                                        <th className="py-1 px-2 border-r border-amber-200">Clinical Medicine Name</th>
                                        <th className="py-1 px-2">Dosage / Usage</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-amber-100">
                                      {group.clinicalItems.map((item, idx) => (
                                        <tr key={idx} className="hover:bg-amber-50/50">
                                          <td className="py-1 px-1.5 text-center font-bold text-slate-500 text-[10px] border-r border-amber-100 bg-amber-50/50">
                                            {idx + 1}
                                          </td>
                                          <td className="py-1 px-2 font-bold text-slate-900 border-r border-amber-100">
                                            {item.medicineName}
                                          </td>
                                          <td className="py-1 px-2 font-mono font-bold text-amber-900">
                                            {item.dosage} {item.expireDate ? `(EXP: ${item.expireDate})` : ''}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            )}

                            {/* PATENT PRE-PACKAGED ('P') EXCEL TABLE */}
                            {group.patentItems.length > 0 && (
                              <div className="space-y-1">
                                <div className="inline-block bg-emerald-100 text-emerald-950 font-extrabold text-[9px] uppercase border border-emerald-300 px-2 py-0.5 rounded">
                                  Patent Pre-Packaged ('P')
                                </div>
                                <div className="overflow-x-auto border border-emerald-300 rounded-lg bg-white shadow-2xs">
                                  <table className="w-full text-left border-collapse font-sans text-xs">
                                    <thead>
                                      <tr className="bg-emerald-100/90 border-b border-emerald-300 text-[10px] font-black text-emerald-950 uppercase tracking-wider">
                                        <th className="py-1 px-2 w-7 text-center border-r border-emerald-200">#</th>
                                        <th className="py-1 px-2 border-r border-emerald-200">Patent Medicine Name</th>
                                        <th className="py-1 px-2">Dosage / Instructions</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-emerald-100">
                                      {group.patentItems.map((item, idx) => (
                                        <tr key={idx} className="hover:bg-emerald-50/50">
                                          <td className="py-1 px-1.5 text-center font-bold text-slate-500 text-[10px] border-r border-emerald-100 bg-emerald-50/50">
                                            {idx + 1}
                                          </td>
                                          <td className="py-1 px-2 font-bold text-slate-900 border-r border-emerald-100">
                                            {item.medicineName}
                                          </td>
                                          <td className="py-1 px-2 font-mono font-bold text-emerald-900">
                                            {item.dosage}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            )}

                            {group.clinicalItems.length === 0 && group.patentItems.length === 0 && (
                              <div className="bg-slate-50 p-2 rounded-lg text-center">
                                <p className="text-slate-400 italic text-[10px]">No structured medicine records found for this date.</p>
                              </div>
                            )}

                            {/* DOCTOR VISIT PAYMENT BREAKDOWN BADGE */}
                            <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-lg p-2 flex flex-wrap items-center justify-between gap-1.5 shadow-2xs border border-indigo-900/40">
                              <div className="flex items-center space-x-1.5">
                                <div className="p-1 bg-emerald-500/20 text-emerald-300 rounded shrink-0">
                                  <Coins className="w-3 h-3 text-emerald-300" />
                                </div>
                                <div className="text-[10px] font-mono">
                                  <span className="text-slate-300 font-extrabold uppercase text-[8.5px] block">
                                    Payment Received on this Visit:
                                  </span>
                                  <span className="text-blue-300 font-bold">
                                    Appointment: <strong className="text-white">PKR {Number(group.filePkr || 0).toLocaleString()}</strong>
                                  </span>
                                  <span className="text-slate-500 mx-1.5">‚Ä¢</span>
                                  <span className="text-amber-300 font-bold">
                                    Clinical Meds: <strong className="text-white">PKR {Number(group.clinicalMedicinePkr || 0).toLocaleString()}</strong>
                                  </span>
                                </div>
                              </div>
                              <div className="bg-emerald-600/90 text-white px-2 py-0.5 rounded text-[10px] font-mono font-black border border-emerald-400/40 shrink-0">
                                Total Paid: PKR {(Number(group.filePkr || 0) + Number(group.clinicalMedicinePkr || 0)).toLocaleString()}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="flex justify-end pt-0.5">
                        <button
                          type="button"
                          onClick={() => {
                            const copiedClinicalItems: Array<{ id: string; medicineName: string; dosage: string }> = [];
                            const copiedPatentItems: Array<{ id: string; medicineName: string; dosage: string }> = [];
                            let cExp = '';

                            const mrResults: string[] = [];
                            const labAdvList: string[] = [];

                            groupedRxByDate.forEach((g) => {
                              if (g.medicalReportResult && g.medicalReportResult !== 'N/A') {
                                if (!mrResults.includes(g.medicalReportResult)) mrResults.push(g.medicalReportResult);
                              }
                              if (g.labTestAdvice && g.labTestAdvice !== 'N/A') {
                                if (!labAdvList.includes(g.labTestAdvice)) labAdvList.push(g.labTestAdvice);
                              }

                              g.clinicalItems.forEach((item) => {
                                if (item.medicineName && item.medicineName !== 'None prescribed' && item.medicineName !== 'None recorded') {
                                  const exists = copiedClinicalItems.some(i => i.medicineName.toLowerCase() === item.medicineName.toLowerCase());
                                  if (!exists) {
                                    copiedClinicalItems.push({
                                      id: String(Date.now() + Math.random()),
                                      medicineName: item.medicineName,
                                      dosage: item.dosage && item.dosage !== 'As directed' ? item.dosage : ''
                                    });
                                  }
                                }
                                if (item.expireDate && !cExp) cExp = item.expireDate;
                              });

                              g.patentItems.forEach((item) => {
                                if (item.medicineName && item.medicineName !== 'None prescribed' && item.medicineName !== 'None recorded') {
                                  const exists = copiedPatentItems.some(i => i.medicineName.toLowerCase() === item.medicineName.toLowerCase());
                                  if (!exists) {
                                    copiedPatentItems.push({
                                      id: String(Date.now() + Math.random()),
                                      medicineName: item.medicineName,
                                      dosage: item.dosage && item.dosage !== 'As directed' ? item.dosage : ''
                                    });
                                  }
                                }
                              });
                            });

                            if (copiedClinicalItems.length > 0) {
                              setPvClinicalItems(copiedClinicalItems);
                            }
                            if (copiedPatentItems.length > 0) {
                              setPvPatientItems(copiedPatentItems);
                            }
                            if (cExp) setPvClinicalMedicineExpireDate(cExp);

                            if (allSymptomsText) {
                              setPvSymptomsDiagnosis(allSymptomsText);
                            }
                            if (mrResults.length > 0) {
                              setPvMedicalReportResult(mrResults.join('\n\n'));
                            }
                            if (labAdvList.length > 0) {
                              setPvLabTestAdvice(labAdvList.join('\n\n'));
                            }
                            setPvSaveSuccess('Selected history medicines & dosages copied into current visit Excel grid!');
                            setHidePreviousHistory(true);
                            setTimeout(() => setPvSaveSuccess(''), 4000);
                          }}
                          className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold rounded-lg shadow-2xs transition flex items-center space-x-1 cursor-pointer"
                        >
                          <Copy className="w-3 h-3 text-white" />
                          <span>Repeat Medicines</span>
                        </button>
                      </div>
                    </>
                  )}
              </div>
            )}
            </div>
          )}

          {/* BOX 2: CURRENT PATIENT VISIT */}
          <div id="prescription-entry-form" className="bg-white rounded-xl border border-slate-200 shadow-xs p-3 space-y-2.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-2 gap-2">
              <div className="flex items-center space-x-2">
                <div className="p-1 bg-emerald-50 text-emerald-600 rounded-md">
                  <Stethoscope className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <span>Current Patient Visit & Prescriptions</span>
                    {editingVisitId ? (
                      <span className="text-[9px] bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-full font-mono font-bold">
                        Editing #{editingVisitId}
                      </span>
                    ) : (
                      <span className="text-[9px] bg-emerald-100 text-emerald-900 border border-emerald-300 px-2 py-0.5 rounded-full font-bold">
                        New Visit Entry
                      </span>
                    )}
                  </h3>
                  <p className="text-[10px] text-slate-500">Record consultation & write clinical / patient prescriptions</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleOpenNewPatientModal()}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-lg shadow-2xs transition flex items-center space-x-1.5 cursor-pointer shrink-0 self-start sm:self-auto"
                title="Search Mobile No or Patient ID for next patient checkup"
              >
                <Search className="w-4 h-4" />
                <span>Search Record</span>
              </button>
            </div>

            {pvSaveSuccess && (
              <div className="p-2 bg-emerald-50 text-emerald-800 text-xs rounded-lg font-semibold border border-emerald-200 flex items-center justify-between">
                <div className="flex items-center space-x-1">
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600 shrink-0" />
                  <span>{pvSaveSuccess}</span>
                </div>
                {editingVisitId && (
                  <button
                    type="button"
                    onClick={handleAddNewVisit}
                    className="ml-2 text-[10px] bg-emerald-600 text-white font-bold px-2 py-0.5 rounded hover:bg-emerald-700 transition"
                  >
                    + Add New Visit
                  </button>
                )}
              </div>
            )}

            {pvSaveError && (
              <div className="p-2 bg-red-50 text-red-700 text-xs rounded-lg font-semibold border border-red-200">
                {pvSaveError}
              </div>
            )}

            <form
              onSubmit={handleSavePatientVisit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                }
              }}
              className="space-y-2.5"
            >
              {/* 2-COLUMN ROW: History of Patient and Medical Reports Results */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5 flex items-center justify-between">
                    <span>History of Patient</span>
                  </label>
                  <textarea
                    rows={3}
                    placeholder=""
                    value={pvSymptomsDiagnosis}
                    onChange={(e) => setPvSymptomsDiagnosis(e.target.value.toUpperCase())}
                    onFocus={handleFocusPatientVisitInput}
                    className="w-full min-h-[64px] text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none font-sans text-slate-800 resize-y transition-all uppercase"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-teal-800 uppercase mb-0.5 flex items-center justify-between">
                    <span className="flex items-center">
                      <FileText className="w-3.5 h-3.5 mr-1 text-teal-600" />
                      Medical Reports Results
                    </span>
                  </label>
                  <textarea
                    rows={3}
                    placeholder=""
                    value={pvMedicalReportResult}
                    onChange={(e) => setPvMedicalReportResult(e.target.value.toUpperCase())}
                    onFocus={handleFocusPatientVisitInput}
                    className="w-full min-h-[64px] text-xs border border-slate-200 bg-slate-50/50 rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono text-slate-800 resize-y transition-all uppercase"
                  />
                </div>
              </div>


              {/* SEPARATE EXCEL SHEET TABLES FOR CLINICAL MEDICINE & DOSAGE AND PATIENT MEDICINE & DOSAGE */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                
                {/* CLINICAL MEDICINE EXCEL GRID SECTION */}
                <div className="bg-emerald-50/40 p-2.5 rounded-xl border border-emerald-200/80 space-y-2">
                  <div className="flex items-center justify-between border-b border-emerald-200 pb-1">
                    <label className="text-[11px] font-extrabold text-emerald-900 uppercase flex items-center">
                      <Pill className="w-3.5 h-3.5 mr-1 text-emerald-700" />
                      1. Clinical Medicine (Excel Grid)
                    </label>
                    <div className="flex items-center space-x-1.5">
                      <button
                        type="button"
                        onClick={() => handleOpenSmartLocator('clinical')}
                        className="px-2 py-0.5 text-[10px] font-extrabold bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white rounded-md shadow-2xs transition flex items-center cursor-pointer"
                        title="Search medicines by symptom & insert name into Clinical Medicine box"
                      >
                        <Sparkles className="w-3 h-3 mr-1 text-amber-300 animate-pulse" />
                        <span>Smart Locator</span>
                      </button>
                      <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded">Compound Formula</span>
                    </div>
                  </div>

                  {/* Excel Sheet Table for Clinical Medicine */}
                  <div className="overflow-x-auto border border-emerald-300 rounded-lg bg-white shadow-2xs">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-emerald-100/80 border-b border-emerald-300 text-[10px] font-black text-emerald-950 uppercase tracking-wider">
                          <th className="py-1.5 px-2 w-8 text-center border-r border-emerald-200">#</th>
                          <th className="py-1.5 px-2 border-r border-emerald-200">Clinical Medicine Name</th>
                          <th className="py-1.5 px-2 border-r border-emerald-200">Dosage / Usage</th>
                          <th className="py-1.5 px-1 w-8 text-center"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-emerald-100 text-xs font-sans">
                        {pvClinicalItems.map((item, index) => (
                          <tr key={`clin-${item.id || index}-${index}`} className="hover:bg-emerald-50/50 transition">
                            <td className="py-1 px-1.5 text-center font-bold text-slate-400 text-[10px] border-r border-emerald-100 bg-slate-50/50">
                              {index + 1}
                            </td>
                            <td className="p-1 border-r border-emerald-100">
                              <input
                                type="text"
                                placeholder=""
                                value={item.medicineName}
                                onChange={(e) => updateClinicalItem(item.id, 'medicineName', e.target.value.toUpperCase())}
                                onFocus={handleFocusPatientVisitInput}
                                className="w-full text-xs font-semibold text-slate-900 px-2 py-1 bg-transparent focus:bg-amber-50/30 focus:outline-none rounded border border-transparent focus:border-emerald-400 uppercase"
                              />
                            </td>
                            <td className="p-1 border-r border-emerald-100">
                              <input
                                type="text"
                                placeholder=""
                                value={item.dosage}
                                onChange={(e) => updateClinicalItem(item.id, 'dosage', e.target.value.toUpperCase())}
                                onFocus={handleFocusPatientVisitInput}
                                className="w-full text-xs font-mono font-medium text-slate-900 px-2 py-1 bg-transparent focus:bg-amber-50/30 focus:outline-none rounded border border-transparent focus:border-emerald-400 uppercase"
                              />
                            </td>
                            <td className="p-1 text-center">
                              {pvClinicalItems.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => removeClinicalItem(item.id)}
                                  className="text-slate-400 hover:text-red-600 p-1 rounded transition cursor-pointer"
                                  title="Remove row"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex justify-start">
                    <button
                      type="button"
                      onClick={addClinicalItem}
                      className="inline-flex items-center space-x-1 px-2.5 py-1 text-[10px] font-extrabold bg-emerald-600 hover:bg-emerald-700 text-white rounded-md shadow-2xs transition cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>+ Add Clinical Row</span>
                    </button>
                  </div>

                  {/* EXPIRE DATE & WEEKS BOX FOR CLINICAL MEDICINE */}
                  <div className="bg-white p-2 rounded-lg border border-emerald-300 space-y-1.5 shadow-2xs">
                    <div className="flex flex-wrap items-center justify-between gap-1.5">
                      <div className="flex items-center space-x-2 flex-wrap gap-1">
                        <label className="text-[10px] font-extrabold text-emerald-950 uppercase tracking-wide flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-emerald-600" />
                          Expire Date:
                        </label>
                        <input
                          type="date"
                          value={pvClinicalMedicineExpireDate}
                          onChange={(e) => setPvClinicalMedicineExpireDate(e.target.value)}
                          onFocus={handleFocusPatientVisitInput}
                          className="text-xs font-mono font-bold border border-emerald-400 rounded-md px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-900 shadow-2xs"
                        />
                        {pvClinicalMedicineExpireDate && (
                          <span className="text-[10px] font-black bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded-full border border-emerald-200">
                            {getWeeksLabel(pvClinicalMedicineExpireDate)}
                          </span>
                        )}
                      </div>
                      <span className="text-[9px] text-emerald-700 font-bold italic">
                        Prints on usage label
                      </span>
                    </div>

                    {/* QUICK WEEK SELECTION BUTTONS */}
                    <div className="flex items-center space-x-1.5 pt-1 border-t border-emerald-100">
                      <span className="text-[9px] font-extrabold text-emerald-900 uppercase tracking-wide">Expire Weeks:</span>
                      {[1, 2, 3, 4].map((w) => {
                        const isSelected = getWeeksLabel(pvClinicalMedicineExpireDate) === (w === 1 ? '1 Week' : `${w} Weeks`);
                        return (
                          <button
                            key={w}
                            type="button"
                            onClick={() => setExpireDateByWeeks(w)}
                            className={`px-2 py-0.5 text-[10px] font-extrabold rounded-md border transition cursor-pointer ${
                              isSelected
                                ? 'bg-emerald-600 text-white border-emerald-700 shadow-2xs'
                                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border-emerald-300'
                            }`}
                            title={`Set expire date to Week ${w} (${w * 7} days from today)`}
                          >
                            Week {w}
                          </button>
                        );
                      })}
                      {pvClinicalMedicineExpireDate && (
                        <button
                          type="button"
                          onClick={() => setPvClinicalMedicineExpireDate('')}
                          className="px-1.5 py-0.5 text-[9px] text-slate-500 hover:text-slate-800 font-bold ml-auto cursor-pointer"
                          title="Clear expire date"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* PATIENT MEDICINE EXCEL GRID SECTION */}
                <div className="bg-blue-50/40 p-2.5 rounded-xl border border-blue-200/80 space-y-2">
                  <div className="flex items-center justify-between border-b border-blue-200 pb-1">
                    <label className="text-[11px] font-extrabold text-blue-900 uppercase flex items-center">
                      <Pill className="w-3.5 h-3.5 mr-1 text-blue-700" />
                      2. Patient Medicine (Excel Grid)
                    </label>
                    <div className="flex items-center space-x-1.5">
                      <button
                        type="button"
                        onClick={() => handleOpenSmartLocator('patient')}
                        className="px-2 py-0.5 text-[10px] font-extrabold bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white rounded-md shadow-2xs transition flex items-center cursor-pointer"
                        title="Search medicines by symptom & insert name into Patient Medicine box"
                      >
                        <Sparkles className="w-3 h-3 mr-1 text-amber-300 animate-pulse" />
                        <span>Smart Locator</span>
                      </button>
                      <span className="text-[9px] bg-blue-100 text-blue-800 font-bold px-1.5 py-0.5 rounded">Patent / Commercial</span>
                    </div>
                  </div>

                  {/* Excel Sheet Table for Patient Medicine */}
                  <div className="overflow-x-auto border border-blue-300 rounded-lg bg-white shadow-2xs">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-blue-100/80 border-b border-blue-300 text-[10px] font-black text-blue-950 uppercase tracking-wider">
                          <th className="py-1.5 px-2 w-8 text-center border-r border-blue-200">#</th>
                          <th className="py-1.5 px-2 border-r border-blue-200">Patient Medicine Name</th>
                          <th className="py-1.5 px-2 border-r border-blue-200">Dosage / Instructions</th>
                          <th className="py-1.5 px-1 w-8 text-center"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-blue-100 text-xs font-sans">
                        {pvPatientItems.map((item, index) => (
                          <tr key={`pat-itm-${item.id || index}-${index}`} className="hover:bg-blue-50/50 transition">
                            <td className="py-1 px-1.5 text-center font-bold text-slate-400 text-[10px] border-r border-blue-100 bg-slate-50/50">
                              {index + 1}
                            </td>
                            <td className="p-1 border-r border-blue-100">
                              <input
                                type="text"
                                placeholder=""
                                value={item.medicineName}
                                onChange={(e) => updatePatientItem(item.id, 'medicineName', e.target.value.toUpperCase())}
                                onFocus={handleFocusPatientVisitInput}
                                className="w-full text-xs font-semibold text-slate-900 px-2 py-1 bg-transparent focus:bg-amber-50/30 focus:outline-none rounded border border-transparent focus:border-blue-400 uppercase"
                              />
                            </td>
                            <td className="p-1 border-r border-blue-100">
                              <input
                                type="text"
                                placeholder=""
                                value={item.dosage}
                                onChange={(e) => updatePatientItem(item.id, 'dosage', e.target.value.toUpperCase())}
                                onFocus={handleFocusPatientVisitInput}
                                className="w-full text-xs font-mono font-medium text-slate-900 px-2 py-1 bg-transparent focus:bg-amber-50/30 focus:outline-none rounded border border-transparent focus:border-blue-400 uppercase"
                              />
                            </td>
                            <td className="p-1 text-center">
                              {pvPatientItems.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => removePatientItem(item.id)}
                                  className="text-slate-400 hover:text-red-600 p-1 rounded transition cursor-pointer"
                                  title="Remove row"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex justify-start">
                    <button
                      type="button"
                      onClick={addPatientItem}
                      className="inline-flex items-center space-x-1 px-2.5 py-1 text-[10px] font-extrabold bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow-2xs transition cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>+ Add Patient Row</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* SIDE-BY-SIDE GRID FOR VISITS CHARGES & LAB TESTS ADVICE BOX */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 items-stretch">
                
                {/* BOX 1: CHARGES & FEES SUMMARY */}
                <div className="bg-slate-50/80 p-2.5 rounded-xl border border-slate-300 space-y-2 flex flex-col justify-between">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                    <label className="text-[10px] font-black text-slate-800 uppercase tracking-wide flex items-center">
                      <Coins className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                      Visit Charges & Fees (PKR)
                    </label>
                    <div className="text-xs font-black text-emerald-950 bg-emerald-100 px-2.5 py-0.5 rounded-md border border-emerald-300 font-mono shadow-2xs">
                      Total: PKR {(Number(pvOpdFeePkr) || 0) + (Number(pvClinicalMedicinePkr) || 0) + (Number(pvFilePkr) || 0) + (Number(pvCardPkr) || 0)}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-0.5">
                    <div>
                      <label className="block text-[9px] font-extrabold text-slate-600 uppercase mb-0.5 truncate">Clinical Med (PKR):</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={4}
                        placeholder=""
                        value={pvClinicalMedicinePkr}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                          setPvClinicalMedicinePkr(val);
                        }}
                        onFocus={handleFocusPatientVisitInput}
                        className="w-full text-xs border border-slate-300 rounded px-2 py-1.5 bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono text-center font-bold text-slate-900 shadow-inner"
                      />
                    </div>

                    <div>
                      <label className="block text-[9px] font-extrabold text-slate-600 uppercase mb-0.5 truncate">File (PKR):</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={4}
                        placeholder=""
                        value={pvFilePkr}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                          setPvFilePkr(val);
                        }}
                        onFocus={handleFocusPatientVisitInput}
                        className="w-full text-xs border border-slate-300 rounded px-2 py-1.5 bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono text-center font-bold text-slate-900 shadow-inner"
                      />
                    </div>

                    <div>
                      <label className="block text-[9px] font-extrabold text-slate-600 uppercase mb-0.5 truncate">Card (PKR):</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={4}
                        placeholder=""
                        value={pvCardPkr}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                          setPvCardPkr(val);
                        }}
                        onFocus={handleFocusPatientVisitInput}
                        className="w-full text-xs border border-slate-300 rounded px-2 py-1.5 bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono text-center font-bold text-slate-900 shadow-inner"
                      />
                    </div>

                    <div>
                      <label className="block text-[9px] font-extrabold text-slate-600 uppercase mb-0.5 truncate">OPD / App (PKR):</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={5}
                        placeholder=""
                        value={pvOpdFeePkr}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '').slice(0, 5);
                          setPvOpdFeePkr(val);
                        }}
                        onFocus={handleFocusPatientVisitInput}
                        className="w-full text-xs border border-slate-300 rounded px-2 py-1.5 bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono text-center font-bold text-slate-900 shadow-inner"
                      />
                    </div>
                  </div>
                </div>

                {/* BOX 2: LAB TESTS / INVESTIGATIONS ADVICE */}
                <div className="bg-purple-50/40 p-2.5 rounded-xl border border-purple-200/90 space-y-1.5 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <label className="block text-[10px] font-bold text-purple-900 uppercase flex items-center">
                      <FlaskConical className="w-3.5 h-3.5 mr-1 text-purple-600" />
                      Lab Tests / Investigations Advice
                    </label>
                    <button
                      type="button"
                      onClick={() => setPvLabTestModalOpen(true)}
                      className="px-2 py-0.5 bg-purple-700 hover:bg-purple-800 text-white font-extrabold text-[10px] rounded-lg shadow-2xs transition flex items-center space-x-1 cursor-pointer"
                      title="Open Lab Tests Selection Modal"
                    >
                      <FlaskConical className="w-3 h-3 text-purple-200" />
                      <span>üìã Select Tests (Modal)</span>
                    </button>
                  </div>

                  {/* Compact Selected Tests Display Box */}
                  <div
                    onClick={() => setPvLabTestModalOpen(true)}
                    className="min-h-[34px] p-1 bg-purple-50/70 border border-purple-200 rounded-lg cursor-pointer hover:bg-purple-100/60 transition flex flex-wrap items-center gap-1"
                  >
                    {getLabTestList(pvLabTestAdvice).length === 0 ? (
                      <span className="text-[10px] text-purple-500 font-medium px-1 flex items-center">
                        Click here or button above to select lab tests in modal
                      </span>
                    ) : (
                      getLabTestList(pvLabTestAdvice).map((testItem, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center text-[10px] font-extrabold bg-purple-100 text-purple-900 border border-purple-300 px-1.5 py-0.2 rounded shadow-2xs"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <span>{testItem}</span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleLabTestAdvice(testItem);
                            }}
                            className="ml-1 text-purple-500 hover:text-purple-900 font-black p-0.5 focus:outline-none"
                            title="Remove test advice"
                          >
                            √ó
                          </button>
                        </span>
                      ))
                    )}
                  </div>

                  <textarea
                    rows={1}
                    placeholder=""
                    value={pvLabTestAdvice}
                    onChange={(e) => setPvLabTestAdvice(e.target.value.toUpperCase())}
                    onFocus={handleFocusPatientVisitInput}
                    className="w-full text-xs border border-purple-200 bg-purple-50/20 rounded-lg px-2.5 py-1 focus:ring-1 focus:ring-purple-500 focus:outline-none font-mono text-slate-800 resize-y uppercase"
                  />
                </div>

              </div>

              <div className="flex flex-wrap items-center justify-end gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => handleOpenPrintModal('A5_VISIT_SLIP')}
                  className="w-full sm:w-auto px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-950 text-xs font-bold rounded-lg border border-amber-300 transition flex items-center justify-center space-x-1.5 cursor-pointer shadow-2xs"
                  title="Print Patient Visit Slip (148mm x 210mm)"
                >
                  <FileText className="w-3.5 h-3.5 text-amber-600" />
                  <span>Visit Slip</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenPrintModal('A4_PRESCRIPTION')}
                  className="w-full sm:w-auto px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-950 text-xs font-bold rounded-lg border border-blue-300 transition flex items-center justify-center space-x-1.5 cursor-pointer shadow-2xs"
                  title="Print Prescription Letterhead (A4)"
                >
                  <Stethoscope className="w-3.5 h-3.5 text-blue-600" />
                  <span>Prescription</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenPrintModal('A4_LAB_TESTS')}
                  className="w-full sm:w-auto px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-950 text-xs font-bold rounded-lg border border-teal-300 transition flex items-center justify-center space-x-1.5 cursor-pointer shadow-2xs"
                  title="Print Clinical Lab Test Advice (A4)"
                >
                  <FlaskConical className="w-3.5 h-3.5 text-teal-700" />
                  <span>Lab Test</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenPrintModal('A4_PATIENT_INVOICE')}
                  className="w-full sm:w-auto px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-950 text-xs font-bold rounded-lg border border-purple-300 transition flex items-center justify-center space-x-1.5 cursor-pointer shadow-2xs"
                  title="Print Patient Official Invoice / Cash Receipt (A4)"
                >
                  <Receipt className="w-3.5 h-3.5 text-purple-700" />
                  <span>Patient Invoice</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSendWhatsAppRx()}
                  className="w-full sm:w-auto px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg border border-emerald-700 transition flex items-center justify-center space-x-1.5 cursor-pointer shadow-2xs"
                  title="Send Patient Prescription & Visit Summary via WhatsApp"
                >
                  <WhatsAppIcon className="w-3.5 h-3.5 fill-current text-white" />
                  <span>WhatsApp</span>
                </button>

                <button
                  type="submit"
                  disabled={isSavingVisit}
                  className="w-full sm:w-auto px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold rounded-lg border border-emerald-700 shadow-sm transition flex items-center justify-center space-x-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{isSavingVisit ? 'Saving...' : (editingVisitId ? 'Update & Print' : 'Save & Print')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>

      </div>
      )}

      {/* SEARCH LOADING MODAL POPUP */}
      {isSearchLoadingModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-5 shadow-2xl border border-slate-200 flex flex-col items-center space-y-3.5 max-w-sm w-full text-center animate-in fade-in zoom-in-95">
            <div className="relative flex items-center justify-center">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-full shadow-inner">
                <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
              <div className="absolute -bottom-1 -right-1 bg-emerald-600 text-white p-1 rounded-full text-[9px] shadow-sm animate-pulse">
                <Database className="w-3 h-3" />
              </div>
            </div>

            <div className="w-full space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100/80 text-emerald-800 text-[10px] font-bold tracking-wide uppercase mb-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-ping"></span>
                Database Query Active
              </div>
              <h4 className="text-xs sm:text-sm font-extrabold text-slate-900">Fetching Patient Records...</h4>
              <p className="text-[11px] text-slate-600 leading-snug">
                Searching database & PHC history for: <br />
                <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 inline-block mt-1 font-mono text-[11px]">
                  "{pvPatientSearch || pvSelectedPatientId || 'Patient'}"
                </span>
              </p>
            </div>

            {/* ANIMATED PROGRESS BAR */}
            <div className="w-full space-y-1.5 pt-1">
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200/80 shadow-inner relative">
                <div className="bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-600 h-full rounded-full animate-pulse w-full origin-left transition-all duration-300"></div>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent animate-[shimmer_1.5s_infinite] -translate-x-full"></div>
              </div>
              <div className="flex items-center justify-between text-[10px] font-semibold text-slate-500 px-0.5">
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Loading Records...
                </span>
                <span className="font-mono text-emerald-700 font-bold">Connecting API</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PATIENT VISIT PRESCRIPTION PRINT MODAL */}
      {pvPrescriptionModalOpen && selectedPvPatient && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto print:p-0 print:static print:bg-transparent print:overflow-visible">
          
          {/* Style tag for print paper dimensions */}
          <style>{`
            @media print {
              @page {
                size: A4 portrait;
                margin: 0 !important;
              }
              .print\\:hidden, .no-print, button, header, nav {
                display: none !important;
              }
              html, body {
                margin: 0 !important;
                padding: 0 !important;
                width: 210mm !important;
                max-width: 210mm !important;
                height: 297mm !important;
                max-height: 297mm !important;
                overflow: hidden !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                page-break-after: avoid !important;
                page-break-inside: avoid !important;
                break-after: avoid !important;
              }
              body * {
                visibility: hidden !important;
              }
              #printable-patient-doc, #printable-patient-doc * {
                visibility: visible !important;
              }
              #printable-patient-doc {
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 210mm !important;
                max-width: 210mm !important;
                height: 297mm !important;
                max-height: 297mm !important;
                margin: 0 !important;
                padding: 0 !important;
                background: white !important;
                box-shadow: none !important;
                border: none !important;
                box-sizing: border-box !important;
                overflow: hidden !important;
                page-break-inside: avoid !important;
                page-break-after: avoid !important;
                break-after: avoid !important;
              }
            }
          `}</style>

          <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto print:max-w-none print:shadow-none print:border-none print:rounded-none">
            
            {/* Modal Toolbar (hidden during print) */}
            <div className="bg-slate-900 text-white p-3.5 flex flex-col sm:flex-row justify-between items-center gap-3 print:hidden">
              <div className="flex items-center space-x-2">
                <Printer className="w-4 h-4 text-emerald-400" />
                <h4 className="font-bold text-xs sm:text-sm">
                  Print Patient Document
                </h4>
                <span className="text-[10px] bg-slate-800 text-emerald-300 font-mono px-2 py-0.5 rounded border border-slate-700">
                  {selectedPvPatient.PatientName} ({selectedPvPatient.PatientID})
                </span>
              </div>

              {/* DOCUMENT TYPE SELECTOR TABS */}
              <div className="flex flex-wrap items-center bg-slate-800 p-1 rounded-lg border border-slate-700 gap-1">
                <button
                  type="button"
                  onClick={() => setPrintDocType('A5_VISIT_SLIP')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-md transition flex items-center space-x-1.5 cursor-pointer ${
                    printDocType === 'A5_VISIT_SLIP'
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-700'
                  }`}
                  title="Patient Visit Slip (148mm x 210mm)"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Visit Slip</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPrintDocType('A4_PRESCRIPTION')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-md transition flex items-center space-x-1.5 cursor-pointer ${
                    printDocType === 'A4_PRESCRIPTION'
                      ? 'bg-blue-500 text-white shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-700'
                  }`}
                  title="Prescription Letterhead (A4)"
                >
                  <Stethoscope className="w-3.5 h-3.5" />
                  <span>Prescription</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPrintDocType('A4_LAB_TESTS')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-md transition flex items-center space-x-1.5 cursor-pointer ${
                    printDocType === 'A4_LAB_TESTS'
                      ? 'bg-teal-500 text-white shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-700'
                  }`}
                  title="Lab Test Advice (A4)"
                >
                  <FlaskConical className="w-3.5 h-3.5" />
                  <span>Lab Test</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPrintDocType('A4_PATIENT_INVOICE')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-md transition flex items-center space-x-1.5 cursor-pointer ${
                    printDocType === 'A4_PATIENT_INVOICE'
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-700'
                  }`}
                  title="Patient Official Invoice (A4)"
                >
                  <Receipt className="w-3.5 h-3.5" />
                  <span>Patient Invoice</span>
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSendWhatsAppRx()}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition shadow-md flex items-center space-x-1.5 cursor-pointer"
                  title="Send current document/prescription to patient via WhatsApp"
                >
                  <WhatsAppIcon className="w-3.5 h-3.5 fill-current text-white" />
                  <span>WhatsApp</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleCleanPrintTab(printDocType)}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition shadow-md flex items-center space-x-1.5 cursor-pointer"
                  title="Open clean printable document in new tab with exact page sizing"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Now ({printDocType === 'A5_VISIT_SLIP' ? '148x210mm on A4' : 'A4 Portrait'})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPvPrescriptionModalOpen(false)}
                  className="px-3 py-1.5 bg-slate-700 hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>

            {/* DOCUMENT PREVIEW CONTAINER */}
            <div className="p-4 sm:p-6 bg-slate-100 min-h-[480px] flex justify-center items-center print:p-0 print:bg-white print:min-h-0">
              <div id="printable-patient-doc" className="w-full bg-white shadow-md print:shadow-none flex justify-center">

                {/* ========================================================================= */}
                {/* OPTION 1: PATIENT VISIT SLIP (148mm x 210mm CONTAINER ON A4) */}
                {/* ========================================================================= */}
                {printDocType === 'A5_VISIT_SLIP' && (
                  <div className="w-[148mm] max-w-[148mm] h-[210mm] max-h-[210mm] mx-auto print:!ml-[30mm] print:!mr-auto print:!mt-0 p-3 sm:p-4 print:p-3 border border-slate-300 print:border-none text-slate-900 font-sans box-border overflow-hidden print:overflow-hidden flex flex-col justify-between bg-white">
                    
                    {/* Top Content Group */}
                    <div className="space-y-2">
                      {/* Slip Header with PHC Logo on Left */}
                      <div className="relative border-b-2 border-teal-800 pb-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <img src={clinicSettings?.ClinicLogoImage || "/nhc_logo.svg"} alt="PHC Logo" style={{ width: '36px', height: '36px', maxHeight: '36px', maxWidth: '36px', objectFit: 'contain' }} className="w-9 h-9 object-contain shrink-0" />
                          <div className="text-center flex-1">
                            <h2 className="text-center text-sm font-black uppercase text-teal-950 tracking-wide">
                              {clinicSettings?.ClinicName || 'PUNJAB HOMEOPATHIC CLINIC'}
                            </h2>
                            <p className="text-[9px] font-extrabold text-rose-700 tracking-wider uppercase">PATIENT VISIT SLIP</p>
                          </div>
                          <div className="w-9 h-9 shrink-0"></div>
                        </div>

                        <div className="mt-1 text-[11px] border-t border-slate-200 pt-1 space-y-0.5">
                          <div className="flex justify-between items-baseline">
                            <p className="font-bold text-slate-900 text-xs">
                              Patient Name: <strong className="text-teal-950 uppercase">{selectedPvPatient.PatientName}</strong> &nbsp;
                              <span className="font-semibold text-slate-700 text-[10px]">
                                ({selectedPvPatient.AgeYears}Y / {selectedPvPatient.Sex} {selectedPvPatient.MaritalStatus || ''})
                              </span>
                            </p>
                            <p className="text-slate-700 font-mono text-[10px]">
                              Patient ID: <strong className="text-slate-950">{selectedPvPatient.PatientID}</strong>
                            </p>
                          </div>

                          {/* S/O, D/O, W/O BELOW PATIENT NAME */}
                          <div className="flex justify-between items-baseline pt-0.5 text-[10px]">
                            <p className="font-bold text-slate-800">
                              S/O, D/O, W/O: <span className="font-bold text-slate-950 uppercase">{(selectedPvPatient as any).Father_husband || selectedPvPatient.Father_husband || '____________________'}</span>
                            </p>
                            <div className="text-right font-mono flex items-center space-x-2">
                              <span className="font-bold text-slate-900">Visit Date: <span className="underline">{formatDisplayDate(pvVisitDate)}</span></span>
                              <span className="font-bold text-emerald-800">
                                City: <span className="bg-emerald-100 text-emerald-950 px-1.5 py-0.2 rounded border border-emerald-300 font-bold">{cities.find(c => c.CityID === selectedPvPatient.CityID)?.CityName || 'Lahore'}</span>
                              </span>
                              <span className="font-bold text-slate-800">
                                Mobile: <span className="text-slate-950 font-bold">{selectedPvPatient.PhoneMobile || (selectedPvPatient as any).Mobile || (selectedPvPatient as any).Phone || (selectedPvPatient as any).MobileNumber || 'N/A'}</span>
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Symptoms / Diagnosis */}
                      <div className="space-y-0.5 text-[10px] border-b border-slate-200 pb-1">
                        <span className="font-bold uppercase text-[10px] text-slate-700 tracking-wider">Symptoms / Diagnosis:</span>
                        <p className="font-bold text-slate-900 uppercase leading-snug">
                          {pvSymptomsDiagnosis || 'N/A'}
                        </p>
                      </div>

                      {/* Medical Report Results */}
                      <div className="space-y-0.5 text-[10px] border-b border-slate-200 pb-1">
                        <span className="font-bold uppercase text-[10px] text-slate-700 tracking-wider">Medical Report Results:</span>
                        <p className="text-slate-800 font-mono text-[10px] italic whitespace-pre-wrap">
                          {pvMedicalReportResult || 'None Recorded'}
                        </p>
                      </div>

                      {/* Clinical Medicines Grid */}
                      <div className="space-y-0.5 text-[10px] border-b border-slate-200 pb-1.5">
                        <div className="flex items-center justify-between text-emerald-900 font-bold uppercase text-[10px] tracking-wider">
                          <span className="flex items-center space-x-1">
                            <Pill className="w-3 h-3 text-emerald-700" />
                            <span>1. Clinical / Compounded Medicines</span>
                          </span>
                          {pvClinicalMedicineExpireDate && (
                            <span className="text-[9px] bg-emerald-100 text-emerald-900 font-mono px-1.5 py-0.2 rounded font-bold">
                              EXP: {pvClinicalMedicineExpireDate}
                            </span>
                          )}
                        </div>
                        <div className="bg-emerald-50/30 p-1 rounded-md border border-emerald-200/80 font-mono text-[10px]">
                          {(() => {
                            const validItems = pvClinicalItems.filter((i) => i.medicineName.trim() || i.dosage.trim());
                            if (validItems.length === 0) {
                              return <p className="text-slate-400 italic text-[10px] p-0.5">No clinical medicines prescribed</p>;
                            }
                            return (
                              <table className="w-full text-left border-collapse bg-white rounded border border-emerald-300 text-[10px] shadow-2xs">
                                <thead>
                                  <tr className="bg-emerald-100/80 border-b border-emerald-300 text-[9px] font-black text-emerald-950 uppercase tracking-wider">
                                    <th className="py-0.5 px-1.5 w-6 text-center border-r border-emerald-200">#</th>
                                    <th className="py-0.5 px-1.5 border-r border-emerald-200">Clinical Medicine Name</th>
                                    <th className="py-0.5 px-1.5">Dosage / Usage</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-emerald-100">
                                  {validItems.map((item, idx) => (
                                    <tr key={item.id || idx} className="hover:bg-emerald-50/30">
                                      <td className="py-0.5 px-1 text-center font-bold text-slate-500 text-[9px] border-r border-emerald-100 bg-emerald-50/50">
                                        {idx + 1}
                                      </td>
                                      <td className="py-0.5 px-1.5 font-bold text-slate-900 border-r border-emerald-100">
                                        {item.medicineName.trim() || 'Clinical Compounding Formula'}
                                      </td>
                                      <td className="py-0.5 px-1.5 font-semibold text-emerald-800">
                                        {item.dosage.trim() || 'As directed'}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            );
                          })()}
                        </div>
                      </div>

                      {/* Patent Medicines Grid */}
                      <div className="space-y-0.5 text-[10px] border-b border-slate-200 pb-1.5">
                        <div className="flex items-center justify-between text-blue-900 font-bold uppercase text-[10px] tracking-wider">
                          <span className="flex items-center space-x-1">
                            <Pill className="w-3 h-3 text-blue-700" />
                            <span>2. Patent / Commercial Medicines</span>
                          </span>
                        </div>
                        <div className="bg-blue-50/30 p-1 rounded-md border border-blue-200/80 font-mono text-[10px]">
                          {(() => {
                            const validItems = pvPatientItems.filter((i) => i.medicineName.trim() || i.dosage.trim());
                            if (validItems.length === 0) {
                              return <p className="text-slate-400 italic text-[10px] p-0.5">No patent medicines prescribed</p>;
                            }
                            return (
                              <table className="w-full text-left border-collapse bg-white rounded border border-blue-300 text-[10px] shadow-2xs">
                                <thead>
                                  <tr className="bg-blue-100/80 border-b border-blue-300 text-[9px] font-black text-blue-950 uppercase tracking-wider">
                                    <th className="py-0.5 px-1.5 w-6 text-center border-r border-blue-200">#</th>
                                    <th className="py-0.5 px-1.5 border-r border-blue-200">Patient Medicine Name</th>
                                    <th className="py-0.5 px-1.5">Dosage / Instructions</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-blue-100">
                                  {validItems.map((item, idx) => (
                                    <tr key={item.id || idx} className="hover:bg-blue-50/30">
                                      <td className="py-0.5 px-1 text-center font-bold text-slate-500 text-[9px] border-r border-blue-100 bg-blue-50/50">
                                        {idx + 1}
                                      </td>
                                      <td className="py-0.5 px-1.5 font-bold text-slate-900 border-r border-blue-100">
                                        {item.medicineName.trim() || 'Commercial Medicine'}
                                      </td>
                                      <td className="py-0.5 px-1.5 font-semibold text-blue-800">
                                        {item.dosage.trim() || 'As directed'}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            );
                          })()}
                        </div>
                      </div>

                      {/* Advised Lab Investigations */}
                      <div className="text-[10px] border-b border-slate-200 pb-1 flex items-baseline gap-1">
                        <span className="font-bold uppercase text-[9px] text-slate-600 shrink-0">Advised Lab Investigations:</span>
                        <p className="font-mono text-slate-800 font-semibold">{pvLabTestAdvice || 'Routine Homeopathic Treatment'}</p>
                      </div>
                    </div>

                    {/* Charges / Remarks Footer */}
                    <div className="pt-1.5 border-t-2 border-slate-800 flex justify-between items-center text-[10px]">
                      <div className="font-mono text-[10px]">
                        <span className="font-bold uppercase text-slate-500 mr-1.5">Charges (PKR):</span>
                        <span>OPD/App: <strong>{pvOpdFeePkr || 0}</strong></span> &nbsp;|&nbsp; 
                        <span>Clinical: <strong>{pvClinicalMedicinePkr || 0}</strong></span> &nbsp;|&nbsp; 
                        <span>File: <strong>{pvFilePkr || 0}</strong></span> &nbsp;|&nbsp; 
                        <span>Card: <strong>{pvCardPkr || 0}</strong></span> &nbsp;|&nbsp; 
                        <span className="text-emerald-900 font-bold bg-emerald-100 px-1.5 py-0.2 rounded">
                          Total: PKR {(Number(pvOpdFeePkr)||0) + (Number(pvClinicalMedicinePkr)||0) + (Number(pvFilePkr)||0) + (Number(pvCardPkr)||0)}
                        </span>
                      </div>
                      <div className="text-slate-500 text-[9px] italic">
                        Printed via PHC Clinical CMS
                      </div>
                    </div>

                  </div>
                )}


                {/* ========================================================================= */}
                {/* OPTION 2: PATIENT PRESCRIPTION LETTERHEAD (A4 SIZE - MATCHING IMAGE EXACTLY) */}
                {/* ========================================================================= */}
                {printDocType === 'A4_PRESCRIPTION' && (
                  <div className="w-full max-w-[210mm] h-[297mm] max-h-[297mm] mx-auto p-5 sm:p-6 print:p-5 border border-slate-300 print:border-none text-slate-900 font-sans space-y-2.5 flex flex-col justify-between bg-white box-border overflow-hidden print:overflow-hidden">
                    
                    <div className="space-y-3">
                      {/* Top Header Section with PHC Official Logo on Left & Clinic Title */}
                      <div className="flex items-center justify-between border-b-2 border-teal-800 pb-2 gap-2">
                        {/* PHC Official Logo Left */}
                        <div className="flex items-center space-x-2 shrink-0">
                          <img src={clinicSettings?.ClinicLogoImage || "/nhc_logo.svg"} alt="PHC Logo" style={{ width: '80px', height: '80px', maxHeight: '80px', maxWidth: '80px', objectFit: 'contain' }} className="w-20 h-20 object-contain" />
                        </div>

                        {/* Main Clinic Title */}
                        <div className="text-center flex-1 px-2">
                          <h1 className="font-serif uppercase tracking-tight flex flex-col items-center justify-center">
                            <span className="text-2xl sm:text-3xl font-serif text-red-900 font-black tracking-tight">{clinicSettings?.ClinicName || 'PUNJAB HOMEOPATHIC CLINIC'}</span>
                          </h1>
                          <p className="text-[10px] font-extrabold text-rose-700 tracking-widest uppercase mt-0.5">HEALING NATURALLY. RESTORING BALANCE.</p>
                          <div className="flex justify-center space-x-8 text-xs font-bold text-slate-800 mt-1">
                            <span>PHC Reg. # <span className="underline decoration-slate-800">R-__________</span></span>
                            <span>PHC License #: ___________________</span>
                          </div>
                          <p className="text-[10.5px] font-bold text-teal-950 mt-1 uppercase tracking-tight">Clinic Timings: Morning 8:30 AM to 12:00 PM &nbsp;|&nbsp; Evening 4:30 PM to 9:00 PM</p>
                        </div>

                        {/* Right Spacer for balanced centering */}
                        <div className="w-20 h-20 shrink-0 hidden sm:block"></div>
                      </div>

                      {/* Patient Details Section */}
                      <div className="text-xs space-y-2 font-sans pt-1 border-b-2 border-teal-800 pb-2.5">
                        {/* ROW 1: Patient Name & Age/Sex & Visit Date */}
                        <div className="grid grid-cols-12 gap-2 items-baseline">
                          <div className="col-span-6 flex items-baseline">
                            <span className="font-bold text-slate-900 shrink-0 mr-1.5">Patient Name:</span>
                            <span className="font-black text-slate-950 uppercase border-b border-slate-400 flex-1 pl-1 text-sm">
                              {selectedPvPatient.PatientName}
                            </span>
                          </div>
                          <div className="col-span-3 flex items-baseline">
                            <span className="font-bold text-slate-900 shrink-0 mr-1.5">Age/Sex:</span>
                            <span className="font-semibold text-slate-900 border-b border-slate-400 flex-1 text-center">
                              {selectedPvPatient.AgeYears}Y ({selectedPvPatient.Sex})
                            </span>
                          </div>
                          <div className="col-span-3 flex items-baseline">
                            <span className="font-bold text-slate-900 shrink-0 mr-1.5">Visit Date:</span>
                            <span className="font-semibold text-slate-900 border-b border-slate-400 flex-1 text-center font-mono">
                              {pvVisitDate}
                            </span>
                          </div>
                        </div>

                        {/* ROW 2: S/O, D/O, W/O (EXACTLY BELOW PATIENT NAME) & PID Ref # & City & Mobile */}
                        <div className="grid grid-cols-12 gap-2 items-baseline pt-0.5">
                          <div className="col-span-4 flex items-baseline">
                            <span className="font-bold text-slate-900 shrink-0 mr-1.5">S/O, D/O, W/O:</span>
                            <span className="font-bold text-slate-950 uppercase border-b border-slate-400 flex-1 pl-1 truncate">
                              {(selectedPvPatient as any).Father_husband || selectedPvPatient.Father_husband || '________________________'}
                            </span>
                          </div>
                          <div className="col-span-3 flex items-baseline">
                            <span className="font-bold text-slate-900 shrink-0 mr-1.5">PID Ref #:</span>
                            <span className="font-mono font-bold text-slate-950 border-b border-slate-400 flex-1 pl-1 text-center">
                              {selectedPvPatient.PatientID}
                            </span>
                          </div>
                          <div className="col-span-2 flex items-baseline">
                            <span className="font-bold text-slate-900 shrink-0 mr-1.5">City:</span>
                            <span className="font-mono font-bold text-emerald-800 border-b border-slate-400 flex-1 text-center">
                              {cities.find(c => c.CityID === selectedPvPatient.CityID)?.CityName || 'Lahore'}
                            </span>
                          </div>
                          <div className="col-span-3 flex items-baseline">
                            <span className="font-bold text-slate-900 shrink-0 mr-1.5">Mobile:</span>
                            <span className="font-mono font-bold text-slate-950 border-b border-slate-400 flex-1 text-center">
                              {selectedPvPatient.PhoneMobile || (selectedPvPatient as any).Mobile || (selectedPvPatient as any).Phone || (selectedPvPatient as any).MobileNumber || 'N/A'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Prescription Main Body: Left Prescriptions + Right Vitals Sidebar */}
                      <div className="grid grid-cols-12 gap-4 pt-1 min-h-[480px]">
                        
                        {/* Left 8 columns: RX & Prescribed Medicines */}
                        <div className="col-span-8 space-y-3">
                          <div className="grid grid-cols-12 items-center border-b border-slate-200 pb-1">
                            <div className="col-span-2">
                              <span className="text-3xl font-serif italic font-black text-slate-950">Rx</span>
                            </div>
                            <div className="col-span-8 text-center">
                              <h3 className="text-center font-bold text-sm sm:text-base tracking-wider uppercase underline underline-offset-4 font-serif text-red-900">
                                PRESCRIPTION
                              </h3>
                            </div>
                            <div className="col-span-2"></div>
                          </div>

                          {/* Numbered Prescription Medicine Items (Name & Usage) */}
                          <div className="space-y-4 pt-1 text-xs font-sans">
                            {(() => {
                              const parsedItems: Array<{ name: string; usage: string }> = [];

                              const parseBlock = (medStr: string, dosageStr: string) => {
                                const m = medStr.trim();
                                const d = dosageStr.trim();

                                if (!m && !d) return;

                                if (m && !m.includes('\n') && d && !d.includes('\n')) {
                                  parsedItems.push({ name: m, usage: d });
                                  return;
                                }

                                const lines = `${m}\n${d}`.split('\n').map(l => l.trim()).filter(Boolean);
                                let currentItem: { name: string; usage: string } | null = null;

                                for (const line of lines) {
                                  const isNum = /^[0-9]+[\)\.]\s*/.test(line);
                                  const clean = line.replace(/^[0-9]+[\)\.]\s*/, '').trim();

                                  if (isNum) {
                                    if (currentItem) parsedItems.push(currentItem);
                                    if (clean.includes(' - ')) {
                                      const [n, ...u] = clean.split(' - ');
                                      currentItem = { name: n.trim(), usage: u.join(' - ').trim() };
                                    } else {
                                      currentItem = { name: clean, usage: '' };
                                    }
                                  } else if (line.includes(' - ')) {
                                    if (currentItem) parsedItems.push(currentItem);
                                    const [n, ...u] = line.split(' - ');
                                    currentItem = { name: n.trim(), usage: u.join(' - ').trim() };
                                  } else if (currentItem) {
                                    if (currentItem.usage) {
                                      currentItem.usage += ` / ${clean}`;
                                    } else {
                                      currentItem.usage = clean;
                                    }
                                  } else {
                                    currentItem = { name: clean, usage: '' };
                                  }
                                }
                                if (currentItem) parsedItems.push(currentItem);
                              };

                              // Requirement 4: In the A4 letterhead print, use Patent Medicine Prescription only
                              pvPatientItems.forEach((i) => {
                                if (i.medicineName.trim() || i.dosage.trim()) {
                                  parsedItems.push({ name: i.medicineName.trim(), usage: i.dosage.trim() });
                                }
                              });

                              if (parsedItems.length === 0) {
                                parseBlock(pvPatientMedicine, pvPatientDosage);
                              }

                              if (parsedItems.length === 0) {
                                return (
                                  <div className="pt-8 text-slate-300 italic text-center font-sans">
                                    Prescription area (Write medicines name and usage instructions here)
                                  </div>
                                );
                              }

                              return parsedItems.map((item, idx) => (
                                <div key={idx} className="space-y-0.5">
                                  <p className="font-bold text-slate-950 text-xs sm:text-sm uppercase flex items-baseline">
                                    <span className="w-6 text-slate-800 font-mono shrink-0">{idx + 1})</span>
                                    <span>{item.name}</span>
                                  </p>
                                  {item.usage && (
                                    <p className="pl-6 text-[11px] sm:text-xs font-semibold text-slate-700 font-mono uppercase tracking-tight">
                                      {item.usage}
                                    </p>
                                  )}
                                </div>
                              ));
                            })()}
                          </div>

                          {/* Advised Lab Investigations / Tests List (Numbered List: 1. CBC, 2. LFT etc.) */}
                          {(() => {
                            const labList = getLabTestList(pvLabTestAdvice);
                            if (labList.length === 0) return null;
                            return (
                              <div className="pt-3 border-t border-slate-300 mt-4 space-y-1.5 font-sans">
                                <h4 className="text-xs font-black text-teal-950 uppercase tracking-wider flex items-center font-serif">
                                  <FlaskConical className="w-3.5 h-3.5 mr-1 text-teal-800" />
                                  Advised Lab Tests / Investigations:
                                </h4>
                                <div className="pl-2 space-y-1 text-xs">
                                  {labList.map((testName, idx) => (
                                    <p key={idx} className="font-bold text-slate-900 uppercase flex items-baseline">
                                      <span className="w-5 text-slate-800 font-mono shrink-0">{idx + 1}.</span>
                                      <span>{testName}</span>
                                    </p>
                                  ))}
                                </div>
                              </div>
                            );
                          })()}
                        </div>

                        {/* Right 4 columns: Sidebar for Vitals, Urdu Contacts & Pill Badges */}
                        <div className="col-span-4 border-l border-slate-300 pl-3 space-y-3 text-xs flex flex-col justify-between">
                          <div className="space-y-2.5">
                            <div className="space-y-1 font-mono text-[11px]">
                              <div className="flex justify-between items-baseline border-b border-slate-200 pb-1">
                                <span className="text-slate-700 font-medium">Date:</span>
                                <strong className="text-slate-950 underline decoration-slate-300">{pvVisitDate}</strong>
                              </div>
                              <div className="flex justify-between items-baseline border-b border-slate-200 pb-1">
                                <span className="text-slate-700 font-medium">Visit:</span>
                                <span className="text-slate-400">________</span>
                                <span className="text-slate-700 font-medium">Time:</span>
                                <span className="text-slate-400">________</span>
                              </div>
                              <div className="flex justify-between items-baseline border-b border-slate-200 pb-1">
                                <span className="text-slate-700 font-medium">B.P</span>
                                <span className="text-slate-400">____</span>
                                <span className="text-slate-700 font-medium">Pulse</span>
                                <span className="text-slate-400">____</span>
                                <span className="text-slate-700 font-medium">Weight</span>
                                <span className="text-slate-400">____</span>
                              </div>
                            </div>

                            <div className="pt-1 space-y-1">
                              <span className="font-bold text-slate-800 text-[11px] block">Allergies (Any)</span>
                              <div className="border-b border-slate-300 pb-0.5 text-slate-400 italic text-[10px]">____________________</div>
                            </div>

                            <div className="pt-1 space-y-1">
                              <span className="font-bold text-slate-800 text-[11px] block">Findings</span>
                              <div className="text-slate-900 font-semibold text-[11px] min-h-[40px]">
                                ________________________
                              </div>
                            </div>
                          </div>

                          {/* Right Sidebar Urdu Section with Bordered Pill Badges */}
                          <div className="pt-4 border-t border-slate-300 text-right space-y-3 text-[10px]">
                            
                            {/* Clinic Appointment */}
                            <div className="space-y-0.5">
                              <p className="text-[10px] text-slate-700 font-bold">⁄©ŸÑ€åŸÜ⁄© ÿßŸæÿßÿ¶ŸÜŸπŸÖŸÜŸπ ÿßŸàÿ± ÿØ€å⁄Øÿ± ŸÖÿπŸÑŸàŸÖÿßÿ™ ⁄©€åŸÑÿ¶€í</p>
                              <div className="inline-block border-2 border-slate-900 text-slate-950 font-mono font-black text-xs px-3 py-0.5 rounded-full mt-0.5">
                                +92-311-4000608
                              </div>
                            </div>

                            {/* Address & Email */}
                            <div className="text-[10px] text-slate-700 pt-2 border-t border-slate-200 space-y-0.5">
                              <p className="font-semibold">10 ÿ¥ÿßŸÑ€åŸÖÿßÿ± ÿ±Ÿà⁄àÿå ⁄Ø⁄ë⁄æ€å ÿ¥ÿß€ÅŸàÿå ŸÑÿß€ÅŸàÿ±-39</p>
                              <p className="font-mono">+92 42 3631 2924, 3630 2873</p>
                              <p className="font-mono text-slate-600 text-[9px]">punjabhomeopathic@gmail.com</p>
                            </div>

                          </div>

                        </div>

                      </div>
                    </div>

                    {/* Bottom Footer Section with Doctor Details, Stamp & Signature, & Sunday Closed Banner */}
                    <div className="space-y-2 pt-2 border-t-2 border-slate-900 mt-auto">
                      <div className="flex justify-between items-end text-xs pb-1 border-b border-slate-200">
                        {/* Doctor Details */}
                        <div className="space-y-0.5 text-[10px] text-center sm:text-left text-red-900 pr-2">
                          <h5 className="font-black text-red-900 text-sm sm:text-base italic font-serif">Dr. Ejaz Ahmad <span className="text-xs font-sans not-italic font-bold text-red-900">(PUNJAB HOMEOPATHIC)</span></h5>
                          <p className="text-red-900 font-bold text-xs">Consultant Homeopathic Medical Practitioner</p>
                          <p className="text-red-900 font-semibold text-xs">D.H.M.S (Pak)</p>
                          <p className="text-[10px] text-red-900 font-medium">Registered Homeopathic Medical Practitioner No: <strong className="text-red-900 font-bold">48776</strong></p>
                        </div>

                        {/* Signature Line */}
                        <div className="text-center w-44 space-y-1 shrink-0">
                          <div className="h-10 border-b border-slate-800 flex items-end justify-center pb-1 font-serif italic text-slate-400 text-xs">
                            Doctor's Stamp & Signature
                          </div>
                          <span className="text-[10px] font-bold text-slate-700 block uppercase">Consultant Signature</span>
                        </div>
                      </div>

                      {/* Footer Banner */}
                      <div className="grid grid-cols-12 items-center border border-slate-300 rounded overflow-hidden text-[11px] font-sans">
                        <div className="col-span-7 p-1.5 pl-3 italic font-serif text-slate-800 bg-white border-r border-slate-300 text-[10px]">
                          Please don't forget to bring your prescription at your next visit.
                        </div>
                        <div className="col-span-5 p-1.5 text-center bg-slate-100 text-slate-950 font-bold text-[10px]">
                          Timings: Morning 8:30 AM - 12:00 PM | Evening 4:30 - 9:00 PM (Sunday Closed)
                        </div>
                      </div>
                    </div>

                  </div>
                )}

                {/* ========================================================================= */}
                {/* OPTION 3: CLINICAL LABORATORY TEST ADVICE (A4 LETTERHEAD) */}
                {/* ========================================================================= */}
                {printDocType === 'A4_LAB_TESTS' && (
                  <div className="w-full max-w-[210mm] h-[297mm] max-h-[297mm] mx-auto p-5 sm:p-6 print:p-5 border border-slate-300 print:border-none text-slate-900 font-sans space-y-2.5 flex flex-col justify-between bg-white box-border overflow-hidden print:overflow-hidden">
                    <div className="space-y-3">
                      {/* Top Header Section with PHC Official Logo on Left & Clinic Title */}
                      <div className="flex items-center justify-between border-b-2 border-teal-800 pb-2 gap-2">
                        <div className="flex items-center space-x-2 shrink-0">
                          <img src={clinicSettings?.ClinicLogoImage || "/nhc_logo.svg"} alt="PHC Logo" style={{ width: '80px', height: '80px', maxHeight: '80px', maxWidth: '80px', objectFit: 'contain' }} className="w-20 h-20 object-contain" />
                        </div>
                        <div className="text-center flex-1 px-2">
                          <h1 className="font-serif uppercase tracking-tight flex flex-col items-center justify-center">
                            <span className="text-2xl sm:text-3xl font-serif text-red-900 font-black tracking-tight">{clinicSettings?.ClinicName || 'PUNJAB HOMEOPATHIC CLINIC'}</span>
                          </h1>
                          <p className="text-[10px] font-extrabold text-rose-700 tracking-widest uppercase mt-0.5">HEALING NATURALLY. RESTORING BALANCE.</p>
                          <div className="flex justify-center space-x-8 text-xs font-bold text-slate-800 mt-1">
                            <span>PHC Reg. # <span className="underline decoration-slate-800">R-__________</span></span>
                            <span>PHC License #: ___________________</span>
                          </div>
                          <p className="text-[10.5px] font-bold text-teal-950 mt-1 uppercase tracking-tight">Clinic Timings: Morning 8:30 AM to 12:00 PM &nbsp;|&nbsp; Evening 4:30 PM to 9:00 PM</p>
                        </div>
                        <div className="w-20 h-20 shrink-0 hidden sm:block"></div>
                      </div>

                      {/* Patient Details Section */}
                      <div className="text-xs space-y-2 font-sans pt-1 border-b-2 border-teal-800 pb-2.5">
                        <div className="grid grid-cols-12 gap-2 items-baseline">
                          <div className="col-span-6 flex items-baseline">
                            <span className="font-bold text-slate-900 shrink-0 mr-1.5">Patient Name:</span>
                            <span className="font-black text-slate-950 uppercase border-b border-slate-400 flex-1 pl-1 text-sm">
                              {selectedPvPatient?.PatientName || 'N/A'}
                            </span>
                          </div>
                          <div className="col-span-3 flex items-baseline">
                            <span className="font-bold text-slate-900 shrink-0 mr-1.5">Age/Sex:</span>
                            <span className="font-semibold text-slate-900 border-b border-slate-400 flex-1 text-center">
                              {selectedPvPatient?.AgeYears || 0}Y ({selectedPvPatient?.Sex || 'M'})
                            </span>
                          </div>
                          <div className="col-span-3 flex items-baseline">
                            <span className="font-bold text-slate-900 shrink-0 mr-1.5">Visit Date:</span>
                            <span className="font-semibold text-slate-900 border-b border-slate-400 flex-1 text-center font-mono">
                              {pvVisitDate}
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-12 gap-2 items-baseline pt-0.5">
                          <div className="col-span-4 flex items-baseline">
                            <span className="font-bold text-slate-900 shrink-0 mr-1.5">S/O, D/O, W/O:</span>
                            <span className="font-bold text-slate-950 uppercase border-b border-slate-400 flex-1 pl-1 truncate">
                              {(selectedPvPatient as any)?.Father_husband || selectedPvPatient?.Father_husband || '________________________'}
                            </span>
                          </div>
                          <div className="col-span-3 flex items-baseline">
                            <span className="font-bold text-slate-900 shrink-0 mr-1.5">PID Ref #:</span>
                            <span className="font-mono font-bold text-slate-950 border-b border-slate-400 flex-1 pl-1 text-center">
                              {selectedPvPatient?.PatientID}
                            </span>
                          </div>
                          <div className="col-span-2 flex items-baseline">
                            <span className="font-bold text-slate-900 shrink-0 mr-1.5">City:</span>
                            <span className="font-mono font-bold text-emerald-800 border-b border-slate-400 flex-1 text-center">
                              {cities.find(c => c.CityID === selectedPvPatient?.CityID)?.CityName || 'Lahore'}
                            </span>
                          </div>
                          <div className="col-span-3 flex items-baseline">
                            <span className="font-bold text-slate-900 shrink-0 mr-1.5">Mobile:</span>
                            <span className="font-mono font-bold text-slate-950 border-b border-slate-400 flex-1 text-center">
                              {selectedPvPatient?.PhoneMobile || (selectedPvPatient as any)?.Mobile || (selectedPvPatient as any)?.Phone || (selectedPvPatient as any)?.MobileNumber || 'N/A'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* LAB TEST ADVICE MAIN SECTION */}
                      <div className="pt-2 min-h-[460px] space-y-6">
                        <div className="text-center border-b border-slate-300 pb-2">
                          <h2 className="text-lg font-black font-serif uppercase tracking-widest text-teal-950 underline underline-offset-8">
                            CLINICAL LABORATORY TEST ADVICE
                          </h2>
                          <p className="text-xs text-slate-600 italic mt-1 font-sans">
                            Recommended Diagnostic Investigations & Clinical Pathology Advice
                          </p>
                        </div>

                        {/* Prescribed Lab Tests Table / List */}
                        <div className="space-y-3">
                          <h4 className="text-xs font-black uppercase tracking-wider text-teal-950 flex items-center border-b border-teal-800/30 pb-1">
                            <FlaskConical className="w-4 h-4 mr-1.5 text-teal-700" />
                            Prescribed Diagnostic Tests:
                          </h4>

                          {(() => {
                            const labList = getLabTestList(pvLabTestAdvice);
                            if (labList.length === 0) {
                              return (
                                <div className="p-6 bg-slate-50 rounded-xl border border-dashed border-slate-300 text-center text-slate-500 text-xs italic">
                                  No specific lab test advice entered for this visit.
                                </div>
                              );
                            }
                            return (
                              <div className="grid grid-cols-1 gap-2 pt-1 font-mono">
                                {labList.map((testName, idx) => (
                                  <div key={idx} className="p-2.5 bg-teal-50/50 rounded-lg border border-teal-200/80 flex items-center justify-between text-xs">
                                    <div className="flex items-center space-x-3">
                                      <span className="w-6 h-6 rounded-full bg-teal-800 text-white font-mono font-bold flex items-center justify-center text-xs shrink-0">
                                        {idx + 1}
                                      </span>
                                      <span className="font-bold text-slate-900 text-sm uppercase">{testName}</span>
                                    </div>
                                    <span className="text-[10px] font-bold text-teal-800 uppercase bg-teal-100 px-2.5 py-0.5 rounded border border-teal-200">
                                      Advised Test
                                    </span>
                                  </div>
                                ))}
                              </div>
                            );
                          })()}
                        </div>


                      </div>
                    </div>

                    {/* Bottom Footer Section with Doctor Signature & Stamp */}
                    <div className="space-y-3 pt-4 border-t-2 border-slate-900 mt-auto">
                      <div className="flex justify-between items-end text-xs">
                        <div className="text-[10px] text-red-900 pr-2">
                          <div className="space-y-0.5">
                            <h5 className="font-black text-red-900 text-sm italic font-serif">Dr. Ejaz Ahmad <span className="text-xs font-sans not-italic font-bold text-red-900">(PUNJAB HOMEOPATHIC)</span></h5>
                            <p className="text-red-900 font-bold text-xs">Consultant Homeopathic Medical Practitioner</p>
                            <p className="text-red-900 font-semibold text-xs">D.H.M.S (Pak)</p>
                            <p className="text-[10px] text-red-900 font-medium">Registered Homeopathic Medical Practitioner No: <strong className="text-red-900 font-bold">48776</strong></p>
                          </div>
                        </div>

                        {/* Signature Line */}
                        <div className="text-center w-44 space-y-1 shrink-0">
                          <div className="h-10 border-b border-slate-800 flex items-end justify-center pb-1 font-serif italic text-slate-400 text-xs">
                            Doctor's Stamp & Signature
                          </div>
                          <span className="text-[10px] font-bold text-slate-700 block uppercase">Consultant Signature</span>
                        </div>
                      </div>

                      {/* Footer Banner */}
                      <div className="grid grid-cols-12 items-center border border-slate-300 rounded overflow-hidden text-[11px] font-sans">
                        <div className="col-span-7 p-1.5 pl-3 italic font-serif text-slate-800 bg-white border-r border-slate-300 text-[10px]">
                          Please present this Lab Advice slip to the diagnostic collection center.
                        </div>
                        <div className="col-span-5 p-1.5 text-center bg-slate-100 text-slate-950 font-bold text-[10px]">
                          Timings: Morning 8:30 AM - 12:00 PM | Evening 4:30 - 9:00 PM (Sunday Closed)
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ========================================================================= */}
                {/* OPTION 4: PATIENT PAYMENT INVOICE / RECEIPT (A4 LETTERHEAD) */}
                {/* ========================================================================= */}
                {printDocType === 'A4_PATIENT_INVOICE' && (() => {
                  const appt = (appointments || []).find(a => a.PatientID === selectedPvPatient?.PatientID && a.AppointmentDate && a.AppointmentDate.startsWith(pvVisitDate));
                  const currentVisit = (visits || []).find(v => v.PatientID === selectedPvPatient?.PatientID && v.VisitDate && v.VisitDate.startsWith(pvVisitDate));
                  const tokenFeeVal = Number(pvOpdFeePkr) || Number(currentVisit?.ConsultationFee) || Number(appt?.FeeCharged) || Number((selectedPvPatient as any)?.FeeCharged) || Number((selectedPvPatient as any)?.ConsultationFee) || 0;
                  const clinFeeVal = Number(pvClinicalMedicinePkr) || 0;
                  const fileFeeVal = Number(pvFilePkr) || 0;
                  const cardFeeVal = Number(pvCardPkr) || 0;

                  const validClinicalMeds = pvClinicalItems.filter(i => i.medicineName && i.medicineName.trim());
                  const validPatientMeds = pvPatientItems.filter(i => i.medicineName && i.medicineName.trim());

                  const totalPaidAmount = tokenFeeVal + clinFeeVal + fileFeeVal + cardFeeVal;

                  return (
                    <div className="w-full max-w-[210mm] h-[297mm] max-h-[297mm] mx-auto p-5 sm:p-6 print:p-5 border border-slate-300 print:border-none text-slate-900 font-sans space-y-3 flex flex-col justify-between bg-white box-border overflow-hidden print:overflow-hidden">
                      <div className="space-y-3">
                        {/* Top Header Section with PHC Official Logo & Letterhead */}
                        <div className="flex items-center justify-between border-b-2 border-purple-900 pb-2 gap-2">
                          <div className="flex items-center space-x-2 shrink-0">
                            <img src={clinicSettings?.ClinicLogoImage || "/nhc_logo.svg"} alt="PHC Logo" style={{ width: '80px', height: '80px', maxHeight: '80px', maxWidth: '80px', objectFit: 'contain' }} className="w-20 h-20 object-contain" />
                          </div>
                          <div className="text-center flex-1 px-2">
                            <h1 className="font-serif uppercase tracking-tight flex flex-col items-center justify-center">
                              <span className="text-2xl sm:text-3xl font-serif text-red-900 font-black tracking-tight">{clinicSettings?.ClinicName || 'PUNJAB HOMEOPATHIC CLINIC'}</span>
                            </h1>
                            <p className="text-[10px] font-extrabold text-rose-700 tracking-widest uppercase mt-0.5">HEALING NATURALLY. RESTORING BALANCE.</p>
                            <div className="flex justify-center space-x-8 text-xs font-bold text-slate-800 mt-1">
                              <span>PHC Reg. # <span className="underline decoration-slate-800">R-__________</span></span>
                              <span>Official Cash Receipt</span>
                            </div>
                            <p className="text-[10.5px] font-bold text-purple-950 mt-1 uppercase tracking-tight">Clinic Timings: Morning 8:30 AM to 12:00 PM &nbsp;|&nbsp; Evening 4:30 PM to 9:00 PM</p>
                          </div>
                          <div className="w-20 h-20 shrink-0 hidden sm:block"></div>
                        </div>

                        {/* Invoice Title Banner */}
                        <div className="bg-purple-950 text-white px-4 py-2 rounded-lg flex items-center justify-between shadow-sm">
                          <div>
                            <h2 className="text-sm font-extrabold uppercase tracking-wider font-serif text-purple-200">
                              PATIENT OFFICIAL PAYMENT INVOICE / RECEIPT
                            </h2>
                            <p className="text-[10px] text-purple-300 font-mono">Itemized Fee Breakdown & Acknowledged Payment</p>
                          </div>
                          <div className="text-right font-mono text-xs">
                            <div className="font-bold text-amber-300">
                              Invoice #: <span className="text-white">INV-{selectedPvPatient?.PatientID || '001'}-{pvVisitDate.replace(/[\/\-]/g, '')}</span>
                            </div>
                            <div className="text-[10px] text-slate-300">
                              Date: {pvVisitDate} &nbsp;|&nbsp; {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        </div>

                        {/* Patient Information Block */}
                        <div className="text-xs space-y-2 font-sans bg-purple-50/50 p-3 rounded-lg border border-purple-200">
                          <div className="grid grid-cols-12 gap-2 items-baseline">
                            <div className="col-span-6 flex items-baseline">
                              <span className="font-bold text-slate-900 shrink-0 mr-1.5">Patient Name:</span>
                              <span className="font-black text-purple-950 uppercase border-b border-purple-300 flex-1 pl-1 text-sm">
                                {selectedPvPatient?.PatientName || 'N/A'}
                              </span>
                            </div>
                            <div className="col-span-3 flex items-baseline">
                              <span className="font-bold text-slate-900 shrink-0 mr-1.5">MR / PID #:</span>
                              <span className="font-mono font-bold text-slate-900 border-b border-purple-300 flex-1 text-center">
                                {selectedPvPatient?.PatientID}
                              </span>
                            </div>
                            <div className="col-span-3 flex items-baseline">
                              <span className="font-bold text-slate-900 shrink-0 mr-1.5">Visit Date:</span>
                              <span className="font-semibold text-slate-900 border-b border-purple-300 flex-1 text-center font-mono">
                                {pvVisitDate}
                              </span>
                            </div>
                          </div>

                          <div className="grid grid-cols-12 gap-2 items-baseline pt-0.5">
                            <div className="col-span-4 flex items-baseline">
                              <span className="font-bold text-slate-900 shrink-0 mr-1.5">S/O, D/O, W/O:</span>
                              <span className="font-bold text-purple-950 uppercase border-b border-purple-300 flex-1 pl-1 truncate">
                                {(selectedPvPatient as any)?.Father_husband || selectedPvPatient?.Father_husband || '________________________'}
                              </span>
                            </div>
                            <div className="col-span-3 flex items-baseline">
                              <span className="font-bold text-slate-900 shrink-0 mr-1.5">Age / Gender:</span>
                              <span className="font-semibold text-slate-900 border-b border-purple-300 flex-1 text-center">
                                {selectedPvPatient?.AgeYears || 0}Y ({selectedPvPatient?.Sex || 'M'})
                              </span>
                            </div>
                            <div className="col-span-2 flex items-baseline">
                              <span className="font-bold text-slate-900 shrink-0 mr-1.5">City:</span>
                              <span className="font-mono font-bold text-purple-900 border-b border-purple-300 flex-1 text-center">
                                {cities.find(c => c.CityID === selectedPvPatient?.CityID)?.CityName || 'Lahore'}
                              </span>
                            </div>
                            <div className="col-span-3 flex items-baseline">
                              <span className="font-bold text-slate-900 shrink-0 mr-1.5">Mobile:</span>
                              <span className="font-mono font-bold text-purple-950 border-b border-purple-300 flex-1 text-center">
                                {selectedPvPatient?.PhoneMobile || (selectedPvPatient as any)?.Mobile || (selectedPvPatient as any)?.Phone || (selectedPvPatient as any)?.MobileNumber || 'N/A'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Itemized Services & Payments Table */}
                        <div className="pt-1">
                          <h3 className="text-xs font-black uppercase text-purple-950 mb-2 flex items-center">
                            <Coins className="w-3.5 h-3.5 text-purple-700 mr-1.5" />
                            Itemized Services & Payment Summary
                          </h3>

                          <table className="w-full text-left text-xs border-collapse border border-slate-300 font-sans">
                            <thead>
                              <tr className="bg-purple-900 text-white font-bold text-[11px] uppercase tracking-wider">
                                <th className="p-2 border border-purple-800 text-center w-10">#</th>
                                <th className="p-2 border border-purple-800">Particulars / Service Description</th>
                                <th className="p-2 border border-purple-800 text-center w-24">Status</th>
                                <th className="p-2 border border-purple-800 text-right w-28">Amount (PKR)</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 text-slate-800 text-xs">
                              {/* Row 1: Consultation / Token Fee */}
                              <tr className="hover:bg-purple-50/30">
                                <td className="p-2 border border-slate-300 text-center font-bold font-mono">1</td>
                                <td className="p-2 border border-slate-300 font-bold text-slate-900">
                                  Appointment / Token Consultation Fee
                                </td>
                                <td className="p-2 border border-slate-300 text-center">
                                  <span className="bg-emerald-100 text-emerald-800 font-bold text-[10px] px-2 py-0.5 rounded border border-emerald-300">
                                    PAID
                                  </span>
                                </td>
                                <td className="p-2 border border-slate-300 text-right font-mono font-bold text-slate-900">
                                  {tokenFeeVal > 0 ? tokenFeeVal.toLocaleString() : '0'}
                                </td>
                              </tr>

                              {/* Row 2: Clinical Formulated Medicine */}
                              <tr className="hover:bg-purple-50/30">
                                <td className="p-2 border border-slate-300 text-center font-bold font-mono">2</td>
                                <td className="p-2 border border-slate-300 font-bold text-slate-900">
                                  Clinical Formulated Medicine
                                </td>
                                <td className="p-2 border border-slate-300 text-center">
                                  <span className="bg-emerald-100 text-emerald-800 font-bold text-[10px] px-2 py-0.5 rounded border border-emerald-300">
                                    PAID
                                  </span>
                                </td>
                                <td className="p-2 border border-slate-300 text-right font-mono font-bold text-slate-900">
                                  {clinFeeVal > 0 ? clinFeeVal.toLocaleString() : '0'}
                                </td>
                              </tr>

                              {/* Row 3: Commercial / Patient Store Medicine */}
                              {validPatientMeds.length > 0 && (
                                <tr className="hover:bg-purple-50/30">
                                  <td className="p-2 border border-slate-300 text-center font-bold font-mono">3</td>
                                  <td className="p-2 border border-slate-300 font-bold text-slate-900">
                                    Store / Commercial Patent Medicine
                                  </td>
                                  <td className="p-2 border border-slate-300 text-center">
                                    <span className="bg-blue-100 text-blue-800 font-bold text-[10px] px-2 py-0.5 rounded border border-blue-300">
                                      ISSUED
                                    </span>
                                  </td>
                                  <td className="p-2 border border-slate-300 text-right font-mono font-bold text-slate-900">
                                    0
                                  </td>
                                </tr>
                              )}

                              {/* Row 4: File Registration Fee */}
                              <tr className="hover:bg-purple-50/30">
                                <td className="p-2 border border-slate-300 text-center font-bold font-mono">{validPatientMeds.length > 0 ? 4 : 3}</td>
                                <td className="p-2 border border-slate-300 font-bold text-slate-900">
                                  File Registration & Folder Charges
                                </td>
                                <td className="p-2 border border-slate-300 text-center">
                                  <span className="bg-emerald-100 text-emerald-800 font-bold text-[10px] px-2 py-0.5 rounded border border-emerald-300">
                                    PAID
                                  </span>
                                </td>
                                <td className="p-2 border border-slate-300 text-right font-mono font-bold text-slate-900">
                                  {fileFeeVal > 0 ? fileFeeVal.toLocaleString() : '0'}
                                </td>
                              </tr>

                              {/* Row 5: Card Fee */}
                              <tr className="hover:bg-purple-50/30">
                                <td className="p-2 border border-slate-300 text-center font-bold font-mono">{validPatientMeds.length > 0 ? 5 : 4}</td>
                                <td className="p-2 border border-slate-300 font-bold text-slate-900">
                                  Patient Card & Membership Fee
                                </td>
                                <td className="p-2 border border-slate-300 text-center">
                                  <span className="bg-emerald-100 text-emerald-800 font-bold text-[10px] px-2 py-0.5 rounded border border-emerald-300">
                                    PAID
                                  </span>
                                </td>
                                <td className="p-2 border border-slate-300 text-right font-mono font-bold text-slate-900">
                                  {cardFeeVal > 0 ? cardFeeVal.toLocaleString() : '0'}
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>

                        {/* Invoice Summary Totals & Paid Stamp */}
                        <div className="grid grid-cols-12 gap-4 pt-2 items-start">
                          <div className="col-span-7 bg-emerald-50/60 p-3 rounded-lg border border-emerald-200/90 space-y-2">
                            <div className="flex items-center space-x-2">
                              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                              <span className="font-black text-emerald-950 uppercase text-xs tracking-wide">Payment Status & Acknowledgment</span>
                            </div>
                            <p className="text-[11px] text-emerald-900 font-medium leading-relaxed">
                              Received total sum of <strong className="font-bold text-emerald-950 underline">PKR {totalPaidAmount.toLocaleString()}</strong> towards patient visit charges, and medicines. Payment acknowledged in cash at clinic reception.
                            </p>
                            <div className="pt-1 flex items-center justify-between border-t border-emerald-200 text-[10px] text-emerald-800 font-bold font-mono">
                              <span>Cashier / Collector: Reception Desk</span>
                              <span>Mode: Cash Counter</span>
                            </div>
                          </div>

                          <div className="col-span-5 bg-slate-50 p-3 rounded-lg border border-slate-300 space-y-1.5 font-mono text-xs">
                            <div className="flex justify-between text-slate-600 pb-1 border-b border-slate-200">
                              <span>Sub Total:</span>
                              <span className="font-bold text-slate-900">PKR {totalPaidAmount.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-slate-600 pb-1 border-b border-slate-200">
                              <span>Discount Allowed:</span>
                              <span className="font-bold text-slate-900">PKR 0</span>
                            </div>
                            <div className="flex justify-between text-sm font-black text-purple-950 bg-purple-100/80 p-1.5 rounded border border-purple-200">
                              <span>TOTAL PAYABLE:</span>
                              <span>PKR {totalPaidAmount.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between font-bold text-emerald-700 pt-0.5">
                              <span>Total Received:</span>
                              <span>PKR {totalPaidAmount.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between font-bold text-slate-500 text-[11px]">
                              <span>Balance Remaining:</span>
                              <span className="text-emerald-700">PKR 0 (PAID)</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Bottom Footer Section with Doctor Signature & Stamp */}
                      <div className="space-y-3 pt-3 border-t-2 border-slate-900 mt-auto">
                        <div className="flex justify-between items-end text-xs">
                          <div className="text-[10px] text-red-900 pr-2">
                            <div className="space-y-0.5">
                              <h5 className="font-black text-red-900 text-sm italic font-serif">Dr. Ejaz Ahmad <span className="text-xs font-sans not-italic font-bold text-red-900">(PUNJAB HOMEOPATHIC)</span></h5>
                              <p className="text-red-900 font-bold text-xs">Consultant Homeopathic Medical Practitioner</p>
                              <p className="text-red-900 font-semibold text-xs">D.H.M.S (Pak)</p>
                              <p className="text-[10px] text-red-900 font-medium">Registered Homeopathic Medical Practitioner No: <strong className="text-red-900 font-bold">48776</strong></p>
                            </div>
                          </div>

                          {/* Stamp / Signature Block */}
                          <div className="text-center w-48 space-y-1 shrink-0">
                            <div className="h-10 border-b border-slate-800 flex items-end justify-center pb-1 font-serif italic text-slate-400 text-xs">
                              Authorized Cashier / Doctor Stamp
                            </div>
                            <span className="text-[10px] font-bold text-slate-700 block uppercase">Accounts Stamp & Signature</span>
                          </div>
                        </div>

                        {/* Footer Banner */}
                        <div className="grid grid-cols-12 items-center border border-slate-300 rounded overflow-hidden text-[11px] font-sans">
                          <div className="col-span-7 p-1.5 pl-3 italic font-serif text-slate-800 bg-white border-r border-slate-300 text-[10px]">
                            Official receipt generated by Punjab Homeopathic Clinic. Please retain for your records.
                          </div>
                          <div className="col-span-5 p-1.5 text-center bg-purple-900 text-white font-bold text-[10px]">
                            Timings: Morning 8:30 AM - 12:00 PM | Evening 4:30 - 9:00 PM (Sunday Closed)
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}

              </div>
            </div>

          </div>
        </div>
      )}

      {/* GRID-VIEW TAB FOR ALL PATIENTS (Database: Patient, Visit, Visit Medicine) */}
      {activeSubTab === 'grid_view' && (() => {
        const term = gridViewSearch.trim().toLowerCase();
        
        const getLocalDateString = (d: Date = new Date()): string => {
          const year = d.getFullYear();
          const month = String(d.getMonth() + 1).padStart(2, '0');
          const day = String(d.getDate()).padStart(2, '0');
          return `${year}-${month}-${day}`;
        };

        const parseDateToISOKey = (dateStr?: string | null): string => {
          if (!dateStr || dateStr === 'N/A' || dateStr === '‚Äî') return '';
          const clean = String(dateStr).trim().split('T')[0].split(' ')[0];
          const parts = clean.split('-');
          if (parts.length === 3) {
            if (parts[0].length === 4) {
              return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
            }
            if (parts[2].length === 4) {
              return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
            }
          }
          const d = new Date(String(dateStr).trim());
          if (isNaN(d.getTime())) return clean;
          const yyyy = d.getFullYear();
          const mm = String(d.getMonth() + 1).padStart(2, '0');
          const dd = String(d.getDate()).padStart(2, '0');
          return `${yyyy}-${mm}-${dd}`;
        };

        // Master consolidate patients from EMR, NHC, and history
        const masterMap = new Map<string, Patient>();
        (patients || []).forEach(p => {
          if (p && p.PatientID) masterMap.set(String(p.PatientID).trim().toLowerCase(), p);
        });
        [...(nhcPatients || []), ...(nhcArchiveList || []), ...(pvNhcHistory || [])].forEach(p => {
          if (p && p.PatientID) {
            const k = String(p.PatientID).trim().toLowerCase();
            if (!masterMap.has(k)) {
              masterMap.set(k, p as any);
            }
          }
        });
        const masterPatientsList = Array.from(masterMap.values());

        // Effective date filter calculation (active across grid, stats, and print)
        let effStart = gridViewStartDate;
        let effEnd = gridViewEndDate;
        if (gridViewDatePreset !== 'all' && gridViewDatePreset !== 'custom') {
          const now = new Date();
          const todayStr = getLocalDateString(now);
          if (gridViewDatePreset === 'today') {
            effStart = todayStr;
            effEnd = todayStr;
          } else if (gridViewDatePreset === 'yesterday') {
            const y = new Date(now);
            y.setDate(y.getDate() - 1);
            const yStr = getLocalDateString(y);
            effStart = yStr;
            effEnd = yStr;
          } else if (gridViewDatePreset === 'this_week') {
            const w = new Date(now);
            w.setDate(w.getDate() - 6);
            effStart = getLocalDateString(w);
            effEnd = todayStr;
          } else if (gridViewDatePreset === 'this_month') {
            const m = new Date(now.getFullYear(), now.getMonth(), 1);
            effStart = getLocalDateString(m);
            effEnd = todayStr;
          }
        }

        // Filter patients
        let rawFilteredPatients = masterPatientsList.filter((pt) => {
          const ptVisits = (visits || []).filter(v => isSamePatient(v.PatientID, pt.PatientID));
          const ptVisitIds = new Set(ptVisits.map(v => String(v.VisitID || '').trim().toLowerCase()).filter(Boolean));
          const ptVisitDates = new Set(ptVisits.map(v => v.VisitDate ? parseDateToISOKey(v.VisitDate) : '').filter(Boolean));
          const ptNhc = (pvNhcHistory || []).filter(nhc => {
            if (!isSamePatient(nhc.PatientID, pt.PatientID)) return false;
            const nhcId = String(nhc.VisitID || '').trim().toLowerCase();
            if (nhcId && ptVisitIds.has(nhcId)) return false;
            const nhcDate = nhc.date || (nhc as any).VisitDate || '';
            if (nhcDate && ptVisitDates.has(parseDateToISOKey(nhcDate))) return false;
            return true;
          });
          const allPtVisits = [...ptVisits, ...ptNhc];

          if (effStart || effEnd) {
            const ptRegDate = parseDateToISOKey(pt.RegistrationDate);
            const matchesRegDate = ptRegDate && (!effStart || ptRegDate >= effStart) && (!effEnd || ptRegDate <= effEnd);
            
            const matchesVisitDate = allPtVisits.some(v => {
              const rawV = ('VisitDate' in v && v.VisitDate) ? v.VisitDate : ('date' in v ? (v as any).date : '');
              const vDate = parseDateToISOKey(rawV);
              return vDate && (!effStart || vDate >= effStart) && (!effEnd || vDate <= effEnd);
            });

            const ptApps = (appointments || []).filter(a => isSamePatient(a.PatientID, pt.PatientID) && a.Status !== 3);
            const matchesAppDate = ptApps.some(a => {
              const aDate = parseDateToISOKey(a.AppointmentDate);
              return aDate && (!effStart || aDate >= effStart) && (!effEnd || aDate <= effEnd);
            });

            // Only show by Reg Date if patient is newly registered with ZERO visits yet
            const isNewRegInDate = matchesRegDate && allPtVisits.length === 0;

            if (!matchesVisitDate && !matchesAppDate && !isNewRegInDate) {
              return false;
            }
          }

          if (gridViewGenderFilter !== 'all' && pt.Sex !== gridViewGenderFilter) return false;

          if (!term) return true;

          const matchedMeds = (visitMedicines || []).some(m => {
            const isPtVisit = ptVisits.some(v => v.VisitID === m.VisitID);
            return isPtVisit && (
              (m.MedicineDetail && m.MedicineDetail.toLowerCase().includes(term)) ||
              (m.Dosage && m.Dosage.toLowerCase().includes(term))
            );
          });

          const matchedSymptoms = allPtVisits.some(v => {
            const sx = 'SymptomsDiagnosis' in v ? v.SymptomsDiagnosis : ('symptoms' in v ? (v as any).symptoms : '');
            return sx && sx.toLowerCase().includes(term);
          });

          return (
            matchPatientRecord(pt, term) ||
            matchedMeds ||
            matchedSymptoms
          );
        });

        if (gridViewFocOnly) {
          rawFilteredPatients = rawFilteredPatients.filter(pt => {
            const pVisits = (visits || []).filter(v => isSamePatient(v.PatientID, pt.PatientID));
            const pNhc = (pvNhcHistory || []).filter(nhc => isSamePatient(nhc.PatientID, pt.PatientID));
            const hasFocVisit = pVisits.some(v =>
              v.ConsultationPaymentOption === 'FOC' ||
              (v.VisitRemarks && (v.VisitRemarks.includes('FOC') || v.VisitRemarks.includes('Free of Charge')))
            );
            const hasFocNhc = pNhc.some(nhc =>
              (nhc as any).ConsultationPaymentOption === 'FOC' ||
              ((nhc as any).VisitRemarks && ((nhc as any).VisitRemarks.includes('FOC') || (nhc as any).VisitRemarks.includes('Free of Charge'))) ||
              ((nhc as any).symptoms && (nhc as any).symptoms.includes('FOC'))
            );
            return hasFocVisit || hasFocNhc;
          });
        }

        // Helper to get latest activity date for sorting & deduplication
        const getPtLatestActivityDate = (p: typeof patients[0]) => {
          const pVisits = (visits || []).filter(v => isSamePatient(v.PatientID, p.PatientID));
          const pNhc = (pvNhcHistory || []).filter(nhc => isSamePatient(nhc.PatientID, p.PatientID));
          let maxDate = parseDateToISOKey(p.RegistrationDate);
          pVisits.forEach(v => {
            const vD = parseDateToISOKey(v.VisitDate);
            if (vD && vD > maxDate) maxDate = vD;
          });
          pNhc.forEach(nhc => {
            const nD = parseDateToISOKey(nhc.date || (nhc as any).VisitDate);
            if (nD && nD > maxDate) maxDate = nD;
          });
          return maxDate || '1970-01-01';
        };

        // Deduplicate patients by PatientID to ensure each patient appears once with latest entry
        const uniquePatientsMap = new Map<string, typeof patients[0]>();
        rawFilteredPatients.forEach(pt => {
          const key = String(pt.PatientID || '').trim().toLowerCase();
          if (!key) return;
          const existing = uniquePatientsMap.get(key);
          if (!existing) {
            uniquePatientsMap.set(key, pt);
          } else {
            const dateExisting = getPtLatestActivityDate(existing);
            const datePt = getPtLatestActivityDate(pt);
            if (datePt > dateExisting) {
              uniquePatientsMap.set(key, pt);
            }
          }
        });

        // Sort patients descending by latest entry/visit date (newest first)
        const filteredPatients = Array.from(uniquePatientsMap.values()).sort((a, b) => {
          const dateA = getPtLatestActivityDate(a);
          const dateB = getPtLatestActivityDate(b);
          if (dateA !== dateB) {
            return dateB.localeCompare(dateA); // Newest date first
          }
          return (Number(b.PatientID) || 0) - (Number(a.PatientID) || 0);
        });

        // Dynamic summary metrics based on date preset & filters
        const activeFilteredPatientIds = new Set(filteredPatients.map(p => String(p.PatientID || '').trim().toLowerCase()));
        const isPatientFilterActive = filteredPatients.length < masterPatientsList.length;

        // Filter visits according to date range (and patient filter if active)
        const dateFilteredVisits = (visits || []).filter(v => {
          const vDate = parseDateToISOKey(v.VisitDate);
          if (effStart && (!vDate || vDate < effStart)) return false;
          if (effEnd && (!vDate || vDate > effEnd)) return false;
          if (isPatientFilterActive) {
            return activeFilteredPatientIds.has(String(v.PatientID || '').trim().toLowerCase());
          }
          return true;
        });

        // Also include NHC visits in date range
        const existingVisitIds = new Set(dateFilteredVisits.map(v => String(v.VisitID || '').trim().toLowerCase()).filter(Boolean));
        const existingPtDates = new Set(dateFilteredVisits.map(v => `${String(v.PatientID || '').trim().toLowerCase()}_${parseDateToISOKey(v.VisitDate)}`));

        const dateFilteredNhcVisits = (pvNhcHistory || []).filter(nhc => {
          const nDate = parseDateToISOKey(nhc.date || (nhc as any).VisitDate);
          if (effStart && (!nDate || nDate < effStart)) return false;
          if (effEnd && (!nDate || nDate > effEnd)) return false;
          if (isPatientFilterActive) {
            if (!activeFilteredPatientIds.has(String(nhc.PatientID || '').trim().toLowerCase())) return false;
          }
          const id = String(nhc.VisitID || '').trim().toLowerCase();
          if (id && existingVisitIds.has(id)) return false;
          if (nDate && existingPtDates.has(`${String(nhc.PatientID || '').trim().toLowerCase()}_${nDate}`)) return false;
          return true;
        });

        // Dynamic Total Patients Count
        const totalPatientsCount = filteredPatients.length;

        // Dynamic Total Visits Count
        const totalVisitsCount = (effStart || effEnd || isPatientFilterActive)
          ? (dateFilteredVisits.length + dateFilteredNhcVisits.length)
          : (visits.length + dateFilteredNhcVisits.length);

        // Dynamic Total Prescribed Medicines Count
        const dateFilteredVisitIdSet = new Set(dateFilteredVisits.map(v => v.VisitID).filter(Boolean));

        let totalMedicinesCount = 0;

        if (!effStart && !effEnd && !isPatientFilterActive) {
          totalMedicinesCount = visitMedicines ? visitMedicines.length : 0;
          (pvNhcHistory || []).forEach(nhc => {
            if (Array.isArray((nhc as any).medicines)) {
              totalMedicinesCount += (nhc as any).medicines.length;
            } else if (typeof (nhc as any).medicines === 'string' && (nhc as any).medicines.trim()) {
              totalMedicinesCount += (nhc as any).medicines.split(',').filter((s: string) => s.trim().length > 0).length;
            } else if (typeof (nhc as any).PrescribedMedicines === 'string' && (nhc as any).PrescribedMedicines.trim()) {
              totalMedicinesCount += (nhc as any).PrescribedMedicines.split(',').filter((s: string) => s.trim().length > 0).length;
            }
          });
        } else {
          const matchingMeds = (visitMedicines || []).filter(m => dateFilteredVisitIdSet.has(m.VisitID));
          totalMedicinesCount += matchingMeds.length;

          dateFilteredNhcVisits.forEach(nhc => {
            if (Array.isArray((nhc as any).medicines)) {
              totalMedicinesCount += (nhc as any).medicines.length;
            } else if (typeof (nhc as any).medicines === 'string' && (nhc as any).medicines.trim()) {
              totalMedicinesCount += (nhc as any).medicines.split(',').filter((s: string) => s.trim().length > 0).length;
            } else if (typeof (nhc as any).PrescribedMedicines === 'string' && (nhc as any).PrescribedMedicines.trim()) {
              totalMedicinesCount += (nhc as any).PrescribedMedicines.split(',').filter((s: string) => s.trim().length > 0).length;
            }
          });
        }

        return (
          <div className="space-y-4" id="patients-view-grid-tab">
            {/* Top Metrics & Banner */}
            <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-blue-900 text-white p-4 sm:p-5 rounded-2xl shadow-md space-y-3">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-indigo-500/20 rounded-xl border border-indigo-400/30">
                    <Database className="w-6 h-6 text-indigo-300" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-extrabold tracking-tight flex items-center gap-2">
                      <span>All Patients Database Grid-View</span>
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 px-2 py-0.5 rounded-full">
                        MongoDB Live Sync
                      </span>
                    </h3>
                    <p className="text-xs text-indigo-200 font-medium mt-0.5">
                      Consolidated Master Database view merging <strong>Patient</strong>, <strong>Visit</strong>, <strong>Store Sales</strong>, and <strong>Medicines</strong>.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
                  <div className="bg-white/10 backdrop-blur-xs px-3 py-1.5 rounded-xl border border-white/15 flex items-center space-x-2">
                    <Users className="w-4 h-4 text-blue-300" />
                    <span>Total Patients: <strong className="text-white text-sm font-black">{totalPatientsCount}</strong></span>
                  </div>
                  <div className="bg-white/10 backdrop-blur-xs px-3 py-1.5 rounded-xl border border-white/15 flex items-center space-x-2">
                    <Stethoscope className="w-4 h-4 text-emerald-300" />
                    <span>Total Visits: <strong className="text-white text-sm font-black">{totalVisitsCount}</strong></span>
                  </div>
                  <div className="bg-white/10 backdrop-blur-xs px-3 py-1.5 rounded-xl border border-white/15 flex items-center space-x-2">
                    <Pill className="w-4 h-4 text-amber-300" />
                    <span>Prescribed Meds: <strong className="text-white text-sm font-black">{totalMedicinesCount}</strong></span>
                  </div>
                </div>
              </div>

              {/* Filters & Search Control Bar */}
              <div className="bg-white/10 backdrop-blur-md p-3 rounded-xl border border-white/15 flex flex-wrap items-center gap-2.5">
                <div className="flex-1 min-w-[220px] relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder=""
                    value={gridViewSearch}
                    onChange={(e) => setGridViewSearch(e.target.value)}
                    className="w-full bg-slate-900/90 text-white placeholder-slate-400 text-xs rounded-lg pl-9 pr-3 py-2 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 font-medium"
                  />
                  {gridViewSearch && (
                    <button
                      onClick={() => setGridViewSearch('')}
                      className="absolute right-2.5 top-2 text-slate-400 hover:text-white cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Date Preset Filter */}
                <div className="min-w-[150px]">
                  <select
                    value={gridViewDatePreset}
                    onChange={(e) => {
                      const val = e.target.value as any;
                      setGridViewDatePreset(val);
                      if (val !== 'custom' && val !== 'all') {
                        const now = new Date();
                        const todayStr = getLocalDateString(now);
                        if (val === 'today') {
                          setGridViewStartDate(todayStr);
                          setGridViewEndDate(todayStr);
                        } else if (val === 'yesterday') {
                          const y = new Date(now);
                          y.setDate(y.getDate() - 1);
                          const yStr = getLocalDateString(y);
                          setGridViewStartDate(yStr);
                          setGridViewEndDate(yStr);
                        } else if (val === 'this_week') {
                          const w = new Date(now);
                          w.setDate(w.getDate() - 6);
                          setGridViewStartDate(getLocalDateString(w));
                          setGridViewEndDate(todayStr);
                        } else if (val === 'this_month') {
                          const m = new Date(now.getFullYear(), now.getMonth(), 1);
                          setGridViewStartDate(getLocalDateString(m));
                          setGridViewEndDate(todayStr);
                        }
                      } else if (val === 'all') {
                        setGridViewStartDate('');
                        setGridViewEndDate('');
                      }
                    }}
                    className="w-full bg-slate-900/90 text-white text-xs rounded-lg px-2.5 py-2 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 font-medium cursor-pointer"
                  >
                    <option value="all">üìÖ All Dates</option>
                    <option value="today">Today</option>
                    <option value="yesterday">Yesterday</option>
                    <option value="this_week">This Week</option>
                    <option value="this_month">This Month</option>
                    <option value="custom">Custom Period Range</option>
                  </select>
                </div>

                {/* Custom Period Date Range Inputs */}
                {(gridViewDatePreset === 'custom' || (gridViewStartDate || gridViewEndDate)) && (
                  <div className="flex items-center space-x-1.5 bg-slate-900/90 px-2.5 py-1.5 rounded-lg border border-slate-700 text-xs">
                    <span className="text-[10px] font-bold text-indigo-300 uppercase shrink-0">From:</span>
                    <input
                      type="date"
                      value={gridViewStartDate}
                      onChange={(e) => {
                        setGridViewStartDate(e.target.value);
                        setGridViewDatePreset('custom');
                      }}
                      className="bg-slate-800 text-white text-xs rounded px-1.5 py-0.5 border border-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-400 font-mono"
                    />
                    <span className="text-[10px] font-bold text-indigo-300 uppercase shrink-0">To:</span>
                    <input
                      type="date"
                      value={gridViewEndDate}
                      onChange={(e) => {
                        setGridViewEndDate(e.target.value);
                        setGridViewDatePreset('custom');
                      }}
                      className="bg-slate-800 text-white text-xs rounded px-1.5 py-0.5 border border-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-400 font-mono"
                    />
                  </div>
                )}

                {/* Gender Filter */}
                <div className="min-w-[120px]">
                  <select
                    value={gridViewGenderFilter}
                    onChange={(e) => setGridViewGenderFilter(e.target.value)}
                    className="w-full bg-slate-900/90 text-white text-xs rounded-lg px-2.5 py-2 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 font-medium cursor-pointer"
                  >
                    <option value="all">All Genders</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {/* FOC Cases Filter Toggle Button */}
                <button
                  type="button"
                  onClick={() => setGridViewFocOnly(!gridViewFocOnly)}
                  className={`px-3 py-2 text-xs font-extrabold rounded-lg transition shadow-2xs flex items-center space-x-1.5 cursor-pointer border ${
                    gridViewFocOnly
                      ? 'bg-purple-600 text-white border-purple-700 ring-2 ring-purple-400 font-black'
                      : 'bg-purple-900/90 hover:bg-purple-800 text-purple-200 border-purple-700'
                  }`}
                  title="Filter Grid-View to show only Free of Charge (FOC) Cases"
                >
                  <HeartHandshake className={`w-3.5 h-3.5 ${gridViewFocOnly ? 'text-white' : 'text-purple-300'}`} />
                  <span>FOC Cases {gridViewFocOnly ? '‚úì' : ''}</span>
                </button>
              </div>
            </div>

            {/* Main Patient & Visit Grid Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden space-y-0">
              <div className="p-3 bg-slate-100 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                  <Table className="w-4 h-4 text-indigo-600" />
                  <span>Showing <strong className="text-indigo-700 font-extrabold">{filteredPatients.length}</strong> Patient Record(s)</span>
                </span>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => handleOpenRecentVisitsModal()}
                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg transition shadow-2xs flex items-center space-x-1 cursor-pointer"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    <span>Edit Recent Visit Record</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const printWin = window.open('', '_blank');
                      if (!printWin) return;

                      let sumClinMeds = 0;
                      let sumClinOpd = 0;
                      let sumStoreMed = 0;
                      let sumGrandTotal = 0;

                      const rowsHtml = filteredPatients.map(p => {
                        let pVisits = (visits || []).filter(v => isSamePatient(v.PatientID, p.PatientID));
                        const pVisitIds = new Set(pVisits.map(v => String(v.VisitID || '').trim().toLowerCase()).filter(Boolean));
                        const pVisitDates = new Set(pVisits.map(v => v.VisitDate ? parseDateToISOKey(v.VisitDate) : '').filter(Boolean));
                        let pNhc = (pvNhcHistory || []).filter(nhc => {
                          if (!isSamePatient(nhc.PatientID, p.PatientID)) return false;
                          const nhcId = String(nhc.VisitID || '').trim().toLowerCase();
                          if (nhcId && pVisitIds.has(nhcId)) return false;
                          const nhcDate = nhc.date || (nhc as any).VisitDate || '';
                          if (nhcDate && pVisitDates.has(parseDateToISOKey(nhcDate))) return false;
                          return true;
                        });
                        let pInvoices = (invoices || []).filter(inv => isSamePatient(inv.PatientID, p.PatientID));
                        let pApps = (appointments || []).filter(a => isSamePatient(a.PatientID, p.PatientID) && a.Status !== 3);

                        if (effStart || effEnd) {
                          pVisits = pVisits.filter(v => {
                            const d = parseDateToISOKey(v.VisitDate);
                            return d && (!effStart || d >= effStart) && (!effEnd || d <= effEnd);
                          });
                          pNhc = pNhc.filter(nhc => {
                            const d = parseDateToISOKey(nhc.date || (nhc as any).VisitDate);
                            return d && (!effStart || d >= effStart) && (!effEnd || d <= effEnd);
                          });
                          pApps = pApps.filter(a => {
                            const d = parseDateToISOKey(a.AppointmentDate);
                            return d && (!effStart || d >= effStart) && (!effEnd || d <= effEnd);
                          });
                          pInvoices = pInvoices.filter(inv => {
                            const d = parseDateToISOKey(inv.InvoiceDate);
                            return d && (!effStart || d >= effStart) && (!effEnd || d <= effEnd);
                          });
                        }

                        const sortedVisits = [...pVisits].sort((a, b) => {
                          const dA = parseDateToISOKey(a.VisitDate);
                          const dB = parseDateToISOKey(b.VisitDate);
                          if (dA !== dB) return dB.localeCompare(dA);
                          return (Number(b.VisitID) || 0) - (Number(a.VisitID) || 0);
                        });
                        const sortedNhc = [...pNhc].sort((a, b) => {
                          const dA = parseDateToISOKey(a.date || (a as any).VisitDate);
                          const dB = parseDateToISOKey(b.date || (b as any).VisitDate);
                          return dB.localeCompare(dA);
                        });

                        const lastV = sortedVisits[0];
                        const lastNhc = sortedNhc[0];
                        let isVisitNewer = true;
                        if (lastV && lastNhc) {
                          const vDate = parseDateToISOKey(lastV.VisitDate);
                          const nDate = parseDateToISOKey(lastNhc.date || (lastNhc as any).VisitDate);
                          if (nDate > vDate) isVisitNewer = false;
                        } else if (!lastV && lastNhc) {
                          isVisitNewer = false;
                        }

                        const pMeds = lastV ? (visitMedicines || []).filter(m => m.VisitID === lastV.VisitID) : [];
                        const medStr = pMeds.map(m => `${m.MedicineDetail} (${m.Dosage || '1-0-1'})`).join(', ') || 'N/A';
                        const symptomsText = isVisitNewer ? (lastV?.SymptomsDiagnosis || 'N/A') : (lastNhc?.symptoms || 'N/A');

                        const appDates = new Set(pApps.map(a => parseDateToISOKey(a.AppointmentDate)));

                        let appOpdTotal = pApps.reduce((acc, a) => acc + (Number(a.FeeCharged) || Number((a as any).ConsultationFee) || 0), 0);

                        pVisits.forEach(v => {
                          const vDate = parseDateToISOKey(v.VisitDate);
                          let vFee = Number(v.ConsultationFee) || 0;
                          if (!vFee && v.VisitRemarks) {
                            const oMatch = v.VisitRemarks.match(/OPD Fee PKR\s*(\d+)/i) || v.VisitRemarks.match(/Consultation Fee PKR\s*(\d+)/i) || v.VisitRemarks.match(/OPD PKR\s*(\d+)/i);
                            if (oMatch) vFee = Number(oMatch[1]);
                          }
                          if (!appDates.has(vDate) && vFee > 0) {
                            appOpdTotal += vFee;
                          }
                        });

                        pNhc.forEach(nhc => {
                          const nDate = (nhc as any).date || (nhc as any).VisitDate || '';
                          let nhcFee = Number((nhc as any).ConsultationFee) || Number((nhc as any).fee) || Number((nhc as any).FeeCharged) || 0;
                          const rem = (nhc as any).VisitRemarks || (nhc as any).Remarks || '';
                          if (!nhcFee && rem) {
                            const oMatch = rem.match(/OPD Fee PKR\s*(\d+)/i) || rem.match(/Consultation Fee PKR\s*(\d+)/i) || rem.match(/OPD PKR\s*(\d+)/i);
                            if (oMatch) nhcFee = Number(oMatch[1]);
                          }
                          if (!appDates.has(nDate) && nhcFee > 0) {
                            appOpdTotal += nhcFee;
                          }
                        });

                        let clinMedsTotal = pVisits.reduce((acc, v) => {
                          let clin = Number(v.ClinicalMedicinePayment) || 0;
                          let file = Number(v.FileFee) || 0;
                          let card = Number(v.CardFee) || Number(v.CardsPayment) || 0;
                          if (v.VisitRemarks) {
                            if (!clin) { const cPkr = v.VisitRemarks.match(/Clinical Meds PKR\s*(\d+)/); if (cPkr) clin = Number(cPkr[1]); }
                            if (!file) { const fPkr = v.VisitRemarks.match(/File PKR\s*(\d+)/); if (fPkr) file = Number(fPkr[1]); }
                            if (!card) { const kPkr = v.VisitRemarks.match(/Card PKR\s*(\d+)/); if (kPkr) card = Number(kPkr[1]); }
                          }
                          return acc + clin + file + card;
                        }, 0);

                        pNhc.forEach(nhc => {
                          let clin = Number((nhc as any).ClinicalMedicinePayment) || 0;
                          let file = Number((nhc as any).FileFee) || 0;
                          let card = Number((nhc as any).CardFee) || Number((nhc as any).CardsPayment) || 0;
                          const rem = (nhc as any).VisitRemarks || (nhc as any).Remarks || '';
                          if (rem) {
                            if (!clin) { const cPkr = rem.match(/Clinical Meds PKR\s*(\d+)/); if (cPkr) clin = Number(cPkr[1]); }
                            if (!file) { const fPkr = rem.match(/File PKR\s*(\d+)/); if (fPkr) file = Number(fPkr[1]); }
                            if (!card) { const kPkr = rem.match(/Card PKR\s*(\d+)/); if (kPkr) card = Number(kPkr[1]); }
                          }
                          clinMedsTotal += (clin + file + card);
                        });

                        const ptStorePayment = pInvoices.reduce((acc, inv) => acc + (Number(inv.NetAmount) || 0), 0);
                        const grandTotal = appOpdTotal + clinMedsTotal + ptStorePayment;

                        sumClinMeds += clinMedsTotal;
                        sumClinOpd += appOpdTotal;
                        sumStoreMed += ptStorePayment;
                        sumGrandTotal += grandTotal;

                        return `
                          <tr>
                            <td><strong>${p.PatientID}</strong></td>
                            <td>${p.PatientName}</td>
                            <td>${p.AgeYears} Y / ${p.Sex}</td>
                            <td>${symptomsText}</td>
                            <td>${medStr}</td>
                            <td style="text-align: right;">PKR ${clinMedsTotal.toLocaleString()}</td>
                            <td style="text-align: right;">PKR ${appOpdTotal.toLocaleString()}</td>
                            <td style="text-align: right; font-weight: bold; color: #1e1b4b;">PKR ${ptStorePayment.toLocaleString()}</td>
                            <td style="text-align: right; font-weight: 900;">PKR ${grandTotal.toLocaleString()}</td>
                          </tr>
                        `;
                      }).join('');

                      printWin.document.write(`
                        <html>
                          <head>
                            <title>Patients Database Grid View Report</title>
                            <style>
                              body { font-family: system-ui, -apple-system, sans-serif; padding: 20px; font-size: 11px; color: #0f172a; }
                              h2 { margin: 0; color: #1e293b; text-transform: uppercase; font-size: 16px; font-weight: 800; }
                              p { margin: 4px 0 12px 0; color: #475569; font-weight: 600; }
                              table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                              th, td { border: 1px solid #cbd5e1; padding: 6px 8px; text-align: left; }
                              th { background: #1e293b; color: white; font-size: 10px; text-transform: uppercase; }
                              tfoot td { background: #f1f5f9; font-weight: bold; font-size: 11px; }
                            </style>
                          </head>
                          <body>
                            <h2>PUNJAB CLINIC - PATIENTS DATABASE GRID REPORT</h2>
                            <p>Generated on: ${new Date().toLocaleString()} | Total Records: ${filteredPatients.length}</p>
                            <table>
                              <thead>
                                <tr>
                                  <th>Patient ID</th>
                                  <th>Patient Name</th>
                                  <th>Age / Sex</th>
                                  <th>Symptoms / Diagnosis</th>
                                  <th>Prescribed Medicines</th>
                                  <th style="text-align: right;">Clinical Meds</th>
                                  <th style="text-align: right;">App./OPD</th>
                                  <th style="text-align: right;">Store</th>
                                  <th style="text-align: right;">Total</th>
                                </tr>
                              </thead>
                              <tbody>
                                ${rowsHtml.length > 0 ? rowsHtml : '<tr><td colspan="9" style="text-align: center; padding: 20px;">No patient records found matching current criteria.</td></tr>'}
                              </tbody>
                              <tfoot>
                                <tr>
                                  <td colspan="5" style="text-align: right;">GRAND TOTALS (${filteredPatients.length} Patients):</td>
                                  <td style="text-align: right;">PKR ${sumClinMeds.toLocaleString()}</td>
                                  <td style="text-align: right;">PKR ${sumClinOpd.toLocaleString()}</td>
                                  <td style="text-align: right; color: #1e1b4b;">PKR ${sumStoreMed.toLocaleString()}</td>
                                  <td style="text-align: right; font-size: 12px;">PKR ${sumGrandTotal.toLocaleString()}</td>
                                </tr>
                              </tfoot>
                            </table>
                          </body>
                        </html>
                      `);
                      printWin.document.close();
                      printWin.focus();
                      setTimeout(() => printWin.print(), 500);
                    }}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-lg transition shadow-2xs flex items-center space-x-1 cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print Grid Report</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsDetailReportModalOpen(true)}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition shadow-2xs flex items-center space-x-1 cursor-pointer shadow-sm"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Print Detail Report</span>
                  </button>
                </div>
              </div>

              {filteredPatients.length === 0 ? (
                <div className="p-12 text-center text-slate-500 space-y-3">
                  <Search className="w-10 h-10 text-slate-300 mx-auto" />
                  <p className="text-sm font-bold text-slate-700">
                    No patient records found matching your search or filter settings.
                  </p>
                  <p className="text-xs text-slate-500">
                    Try clearing your search query or changing date filter settings.
                  </p>
                </div>
              ) : (
                <div className="w-full overflow-hidden rounded-lg border border-slate-300 shadow-sm bg-white overflow-x-auto">
                  <table className="table-auto w-full min-w-max text-left text-[11px] border-collapse bg-white border border-slate-300">
                    <thead>
                      <tr className="bg-slate-900 text-white font-bold text-[10px] uppercase tracking-tight">
                        <th className="p-2 border border-slate-700 text-center whitespace-nowrap px-3">Patient ID</th>
                        <th className="p-2 border border-slate-700 whitespace-nowrap min-w-[140px] px-3">Patient Profile</th>
                        <th className="p-2 border border-slate-700 whitespace-nowrap min-w-[110px] px-3">Reg / Last Visit</th>
                        <th className="p-2 border border-slate-700 text-right whitespace-nowrap px-3">Clinical Meds</th>
                        <th className="p-2 border border-slate-700 text-right whitespace-nowrap px-3">App./OPD</th>
                        <th className="p-2 border border-slate-700 text-right whitespace-nowrap px-3">Store</th>
                        <th className="p-2 border border-slate-700 text-right whitespace-nowrap px-3">Total</th>
                        <th className="p-2 border border-slate-700 text-center whitespace-nowrap px-2">Actions</th>
                        <th className="p-2 border border-slate-700 text-center whitespace-nowrap px-2">Visits</th>
                        <th className="p-2 border border-slate-700 min-w-[170px] px-3">Latest Symptoms</th>
                        <th className="p-2 border border-slate-700 min-w-[200px] px-3">Prescribed Medicines</th>
                      </tr>
                    </thead>
                    <tbody className="text-slate-800">
                      {filteredPatients.map((pt, idx) => {
                        let ptVisits = (visits || []).filter(v => isSamePatient(v.PatientID, pt.PatientID));
                        const ptVisitIds = new Set(ptVisits.map(v => String(v.VisitID || '').trim().toLowerCase()).filter(Boolean));
                        const ptVisitDates = new Set(ptVisits.map(v => v.VisitDate ? parseDateToISOKey(v.VisitDate) : '').filter(Boolean));
                        let ptNhc = (pvNhcHistory || []).filter(nhc => {
                          if (!isSamePatient(nhc.PatientID, pt.PatientID)) return false;
                          const nhcId = String(nhc.VisitID || '').trim().toLowerCase();
                          if (nhcId && ptVisitIds.has(nhcId)) return false;
                          const nhcDate = nhc.date || (nhc as any).VisitDate || '';
                          if (nhcDate && ptVisitDates.has(parseDateToISOKey(nhcDate))) return false;
                          return true;
                        });
                        let ptInvoices = (invoices || []).filter(inv => isSamePatient(inv.PatientID, pt.PatientID));
                        let ptApps = (appointments || []).filter(a => isSamePatient(a.PatientID, pt.PatientID) && a.Status !== 3);

                        if (effStart || effEnd) {
                          ptVisits = ptVisits.filter(v => {
                            const d = parseDateToISOKey(v.VisitDate);
                            return d && (!effStart || d >= effStart) && (!effEnd || d <= effEnd);
                          });
                          ptNhc = ptNhc.filter(nhc => {
                            const d = parseDateToISOKey(nhc.date || (nhc as any).VisitDate);
                            return d && (!effStart || d >= effStart) && (!effEnd || d <= effEnd);
                          });
                          ptApps = ptApps.filter(a => {
                            const d = parseDateToISOKey(a.AppointmentDate);
                            return d && (!effStart || d >= effStart) && (!effEnd || d <= effEnd);
                          });
                          ptInvoices = ptInvoices.filter(inv => {
                            const d = parseDateToISOKey(inv.InvoiceDate);
                            return d && (!effStart || d >= effStart) && (!effEnd || d <= effEnd);
                          });
                        }

                        const allPtVisits = [...ptVisits, ...ptNhc];

                        const sortedPtVisits = [...ptVisits].sort((a, b) => {
                          const dA = parseDateToISOKey(a.VisitDate);
                          const dB = parseDateToISOKey(b.VisitDate);
                          if (dA !== dB) return dB.localeCompare(dA);
                          return (Number(b.VisitID) || 0) - (Number(a.VisitID) || 0);
                        });

                        const sortedPtNhc = [...ptNhc].sort((a, b) => {
                          const dA = parseDateToISOKey(a.date || (a as any).VisitDate);
                          const dB = parseDateToISOKey(b.date || (b as any).VisitDate);
                          return dB.localeCompare(dA);
                        });

                        const latestVisit = sortedPtVisits.length > 0 ? sortedPtVisits[0] : null;
                        const latestNhc = sortedPtNhc.length > 0 ? sortedPtNhc[0] : null;

                        let isVisitNewer = true;
                        if (latestVisit && latestNhc) {
                          const vDate = parseDateToISOKey(latestVisit.VisitDate);
                          const nDate = parseDateToISOKey(latestNhc.date || (latestNhc as any).VisitDate);
                          if (nDate > vDate) isVisitNewer = false;
                        } else if (!latestVisit && latestNhc) {
                          isVisitNewer = false;
                        }

                        const latestRecord = isVisitNewer ? latestVisit : (latestNhc || latestVisit);

                        const rawVisitDateDisplay = isVisitNewer && latestVisit?.VisitDate
                          ? latestVisit.VisitDate
                          : (latestNhc ? (latestNhc.date || (latestNhc as any).VisitDate) : (pt.RegistrationDate || 'N/A'));
                        const visitDateDisplay = formatDisplayDate(rawVisitDateDisplay);

                        const symptomsDisplay = isVisitNewer ? (latestVisit?.SymptomsDiagnosis || 'N/A') : (latestNhc?.symptoms || 'N/A');
                        const labAdviceDisplay = latestVisit?.LabTestAdvice || 'None';

                        const matchedMedicines = latestVisit ? (visitMedicines || []).filter(m => m.VisitID === latestVisit.VisitID) : [];
                        const clinicalMeds = matchedMedicines.filter(m => m.MedicineType === 'C');
                        const patentMeds = matchedMedicines.filter(m => m.MedicineType === 'P');

                        const appDates = new Set(ptApps.map(a => parseDateToISOKey(a.AppointmentDate)));

                        let appOpdTotal = ptApps.reduce((acc, a) => acc + (Number(a.FeeCharged) || Number((a as any).ConsultationFee) || 0), 0);

                        ptVisits.forEach(v => {
                          const vDate = v.VisitDate ? v.VisitDate.split('T')[0] : '';
                          let vFee = Number(v.ConsultationFee) || 0;
                          if (!vFee && v.VisitRemarks) {
                            const oMatch = v.VisitRemarks.match(/OPD Fee PKR\s*(\d+)/i) || v.VisitRemarks.match(/Consultation Fee PKR\s*(\d+)/i) || v.VisitRemarks.match(/OPD PKR\s*(\d+)/i);
                            if (oMatch) vFee = Number(oMatch[1]);
                          }
                          if (!appDates.has(vDate) && vFee > 0) {
                            appOpdTotal += vFee;
                          }
                        });

                        ptNhc.forEach(nhc => {
                          const nDate = (nhc as any).date || (nhc as any).VisitDate || '';
                          let nhcFee = Number((nhc as any).ConsultationFee) || Number((nhc as any).fee) || Number((nhc as any).FeeCharged) || 0;
                          const rem = (nhc as any).VisitRemarks || (nhc as any).Remarks || '';
                          if (!nhcFee && rem) {
                            const oMatch = rem.match(/OPD Fee PKR\s*(\d+)/i) || rem.match(/Consultation Fee PKR\s*(\d+)/i) || rem.match(/OPD PKR\s*(\d+)/i);
                            if (oMatch) nhcFee = Number(oMatch[1]);
                          }
                          if (!appDates.has(nDate) && nhcFee > 0) {
                            appOpdTotal += nhcFee;
                          }
                        });

                        let clinMedsTotal = ptVisits.reduce((acc, v) => {
                          let clin = Number(v.ClinicalMedicinePayment) || 0;
                          let file = Number(v.FileFee) || 0;
                          let card = Number(v.CardFee) || Number(v.CardsPayment) || 0;
                          if (v.VisitRemarks) {
                            if (!clin) { const cPkr = v.VisitRemarks.match(/Clinical Meds PKR\s*(\d+)/); if (cPkr) clin = Number(cPkr[1]); }
                            if (!file) { const fPkr = v.VisitRemarks.match(/File PKR\s*(\d+)/); if (fPkr) file = Number(fPkr[1]); }
                            if (!card) { const kPkr = v.VisitRemarks.match(/Card PKR\s*(\d+)/); if (kPkr) card = Number(kPkr[1]); }
                          }
                          return acc + clin + file + card;
                        }, 0);

                        ptNhc.forEach(nhc => {
                          let clin = Number((nhc as any).ClinicalMedicinePayment) || 0;
                          let file = Number((nhc as any).FileFee) || 0;
                          let card = Number((nhc as any).CardFee) || Number((nhc as any).CardsPayment) || 0;
                          const rem = (nhc as any).VisitRemarks || (nhc as any).Remarks || '';
                          if (rem) {
                            if (!clin) { const cPkr = rem.match(/Clinical Meds PKR\s*(\d+)/); if (cPkr) clin = Number(cPkr[1]); }
                            if (!file) { const fPkr = rem.match(/File PKR\s*(\d+)/); if (fPkr) file = Number(fPkr[1]); }
                            if (!card) { const kPkr = rem.match(/Card PKR\s*(\d+)/); if (kPkr) card = Number(kPkr[1]); }
                          }
                          clinMedsTotal += (clin + file + card);
                        });

                        const ptStorePayment = ptInvoices.reduce((acc, inv) => acc + (Number(inv.NetAmount) || 0), 0);
                        const clinicalAndOpdTotal = appOpdTotal;
                        const grandTotalPayment = appOpdTotal + clinMedsTotal + ptStorePayment;
                        const rawOpt = latestVisit?.ConsultationPaymentOption || '';
                        const remStr = latestVisit?.VisitRemarks || '';
                        const isFocCase = rawOpt === 'FOC' || remStr.includes('FOC') || remStr.includes('Free of Charge') || (grandTotalPayment === 0 && rawOpt !== 'Follow-Up');
                        const paymentOpt = isFocCase ? 'FOC' : (rawOpt === 'Follow-Up' || remStr.includes('Follow-up')) ? 'Follow-Up' : (rawOpt || 'Cash Paid');

                        return (
                          <tr
                            key={`grid-${pt.PatientID}-${idx}`}
                            className={`hover:bg-indigo-50/60 transition ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}
                          >
                            <td className="p-1.5 border border-slate-200 font-mono font-bold text-slate-900 align-top text-center">
                              <span className="bg-slate-100 text-slate-900 border border-slate-300 px-1 py-0.5 rounded text-[10px] block truncate shadow-2xs">
                                {pt.PatientID}
                              </span>
                            </td>

                            <td className="p-1.5 border border-slate-200 align-top space-y-0.5">
                              <div className="font-extrabold text-slate-950 text-[11px] uppercase tracking-tight truncate">
                                {pt.PatientName}
                              </div>
                              <div className="text-[9px] text-slate-500 font-medium truncate">
                                S/O, W/O: {pt.Father_husband || 'N/A'}
                              </div>
                              <div className="flex items-center space-x-1 pt-0.5">
                                <span className="bg-blue-100 text-blue-800 text-[9px] font-bold px-1 py-0.2 rounded border border-blue-200">
                                  {pt.AgeYears} Yrs
                                </span>
                                <span className={`text-[9px] font-bold px-1 py-0.2 rounded border ${
                                  pt.Sex === 'Female' ? 'bg-pink-100 text-pink-800 border-pink-200' : 'bg-slate-100 text-slate-700 border-slate-200'
                                }`}>
                                  {pt.Sex}
                                </span>
                              </div>
                            </td>

                            <td className="p-1.5 border border-slate-200 align-top text-[10px] font-mono text-slate-700">
                              <span className="font-bold text-slate-900 block truncate">{visitDateDisplay}</span>
                              <span className="text-[8px] text-slate-400 uppercase block">Last Recorded</span>
                            </td>

                            <td className="p-2 border border-slate-200 align-top text-right whitespace-nowrap px-3 space-y-0.5">
                              <div className="font-bold text-slate-900 text-[10px] font-mono" title="Clinical Medicine, File & Card Charges">
                                PKR {clinMedsTotal.toLocaleString()}
                              </div>
                            </td>

                            <td className="p-2 border border-slate-200 align-top text-right whitespace-nowrap px-3 space-y-0.5">
                              <div className="font-bold text-slate-900 text-[10px] font-mono" title="Appointment / OPD Token Issue Fee Payment">
                                PKR {clinicalAndOpdTotal.toLocaleString()}
                              </div>
                              {allPtVisits.length > 0 && (
                                <span className="text-[8.5px] text-emerald-700 font-bold block">
                                  ({allPtVisits.length} visit{allPtVisits.length > 1 ? 's' : ''})
                                </span>
                              )}
                            </td>

                            <td className="p-2 border border-slate-200 align-top text-right whitespace-nowrap px-3 space-y-0.5">
                              <div className="font-bold text-slate-900 text-[10px] font-mono" title="Store Medicine Sales Payment">
                                PKR {ptStorePayment.toLocaleString()}
                              </div>
                              {ptInvoices.length > 0 && (
                                <span className="text-[8.5px] text-indigo-700 font-bold block">
                                  ({ptInvoices.length} store bill{ptInvoices.length > 1 ? 's' : ''})
                                </span>
                              )}
                            </td>

                            <td className="p-2 border border-slate-200 align-top text-right whitespace-nowrap px-3 space-y-0.5">
                              <div className="font-extrabold text-slate-950 text-[10.5px] font-mono" title={`Grand Total Payment: Clin Meds (PKR ${clinMedsTotal}) + App/OPD (PKR ${clinicalAndOpdTotal}) + Store (PKR ${ptStorePayment})`}>
                                PKR {grandTotalPayment.toLocaleString()}
                              </div>
                              <span className={`text-[8px] font-extrabold px-1.5 py-0.5 rounded border uppercase inline-block text-center ${
                                paymentOpt === 'FOC'
                                  ? 'bg-purple-100 text-purple-900 border-purple-300 font-black'
                                  : paymentOpt === 'Follow-Up'
                                  ? 'bg-amber-100 text-amber-900 border-amber-300'
                                  : paymentOpt === 'Cash Paid' || paymentOpt === 'Paid' || paymentOpt === 'Paid - Cash'
                                  ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                                  : 'bg-rose-100 text-rose-900 border-rose-300'
                              }`}>
                                {paymentOpt}
                              </span>
                            </td>

                            <td className="p-1.5 border border-slate-200 align-top text-center space-y-1">
                              <button
                                type="button"
                                onClick={() => openGridVisitSelectorModal(pt.PatientID, 'EDIT')}
                                className="w-full px-1.5 py-0.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold text-[9px] rounded transition flex items-center justify-center space-x-0.5 cursor-pointer"
                                title="Edit Medical Record in Popup Modal"
                              >
                                <Pencil className="w-2.5 h-2.5 text-amber-700" />
                                <span>Edit</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => setDeletePatientModalData({ isOpen: true, pt })}
                                className="w-full px-1.5 py-0.5 bg-red-50 hover:bg-red-100 text-red-900 border border-red-250 font-bold text-[9px] rounded transition flex items-center justify-center space-x-0.5 cursor-pointer"
                                title="Delete Patient and all associated records"
                              >
                                <Trash2 className="w-2.5 h-2.5 text-red-700" />
                                <span>Delete</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => openGridVisitSelectorModal(pt.PatientID, 'PRINT')}
                                className="w-full px-1.5 py-0.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-250 font-bold text-[9px] rounded transition flex items-center justify-center space-x-0.5 cursor-pointer"
                                title="Print Patient Document / Prescription Slip"
                              >
                                <Printer className="w-2.5 h-2.5 text-emerald-700" />
                                <span>Print</span>
                              </button>
                            </td>

                            <td className="p-1.5 border border-slate-200 align-top text-center">
                              <span className="bg-indigo-100 text-indigo-900 font-extrabold text-[10px] px-1.5 py-0.5 rounded-full border border-indigo-200 inline-block">
                                {allPtVisits.length}
                              </span>
                            </td>

                            <td className="p-1.5 border border-slate-200 align-top text-[10px]">
                              <div className="bg-slate-50 p-1 rounded border border-slate-200 font-medium text-slate-800 text-[9px] line-clamp-3">
                                {symptomsDisplay}
                              </div>
                            </td>

                            <td className="p-1.5 border border-slate-200 align-top space-y-1 text-[9px]">
                              {matchedMedicines.length > 0 ? (
                                <div className="space-y-1">
                                  {clinicalMeds.length > 0 && (
                                    <div className="bg-emerald-50/80 border border-emerald-200 p-1 rounded">
                                      <strong className="text-emerald-900 font-bold block text-[8px] uppercase">Clinical:</strong>
                                      {clinicalMeds.map((m, i) => (
                                        <div key={i} className="text-emerald-950 font-medium truncate">
                                          ‚Ä¢ {m.MedicineDetail} ({m.Dosage || '1-0-1'})
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                  {patentMeds.length > 0 && (
                                    <div className="bg-blue-50/80 border border-blue-200 p-1 rounded">
                                      <strong className="text-blue-900 font-bold block text-[8px] uppercase">Patent:</strong>
                                      {patentMeds.map((m, i) => (
                                        <div key={i} className="text-blue-950 font-medium truncate">
                                          ‚Ä¢ {m.MedicineDetail} ({m.Dosage || 'As directed'})
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <span className="text-slate-400 italic text-[9px]">No prescription</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {activeSubTab === 'book' && (
        <div className="space-y-4" id="patients-view-book">
          {/* Header Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-emerald-100 text-emerald-800 rounded-xl border border-emerald-200 shadow-2xs">
                <CalendarPlus className="w-5 h-5 text-emerald-700" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                  <span>Book Appointments & Schedule Desk</span>
                </h2>
                <p className="text-xs text-slate-500 font-medium">Manage, view, and filter patient appointment schedules and booking details</p>
              </div>
            </div>

            {/* Search, Date Period & Shift Controls */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search Patient Name, PID, Mobile, Appt ID..."
                  value={appGridSearch}
                  onChange={(e) => setAppGridSearch(e.target.value)}
                  className="pl-8 pr-7 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-1 focus:ring-emerald-500 focus:outline-none w-64 bg-slate-50 font-medium"
                />
                {appGridSearch && (
                  <button
                    type="button"
                    onClick={() => setAppGridSearch('')}
                    className="absolute right-2 top-2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Date Period Preset Dropdown */}
              <div className="flex items-center space-x-1">
                <Calendar className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <select
                  value={appGridDatePreset}
                  onChange={(e) => {
                    const val = e.target.value as any;
                    setAppGridDatePreset(val);
                    const now = new Date();
                    const todayStr = now.toISOString().split('T')[0];
                    if (val === 'today') {
                      setAppGridStartDate(todayStr);
                      setAppGridEndDate(todayStr);
                    } else if (val === 'yesterday') {
                      const y = new Date(now);
                      y.setDate(y.getDate() - 1);
                      const yStr = y.toISOString().split('T')[0];
                      setAppGridStartDate(yStr);
                      setAppGridEndDate(yStr);
                    } else if (val === 'this_week') {
                      const w = new Date(now);
                      w.setDate(w.getDate() - 6);
                      setAppGridStartDate(w.toISOString().split('T')[0]);
                      setAppGridEndDate(todayStr);
                    } else if (val === 'this_month') {
                      const m = new Date(now.getFullYear(), now.getMonth(), 1);
                      setAppGridStartDate(m.toISOString().split('T')[0]);
                      setAppGridEndDate(todayStr);
                    } else if (val === 'all') {
                      setAppGridStartDate('');
                      setAppGridEndDate('');
                    }
                  }}
                  className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-slate-50 font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                >
                  <option value="today">üìÖ Today</option>
                  <option value="yesterday">Yesterday</option>
                  <option value="this_week">This Week</option>
                  <option value="this_month">This Month</option>
                  <option value="all">All Dates</option>
                  <option value="custom">Custom Period Range</option>
                </select>
              </div>

              {/* Custom Period Search Date Inputs */}
              {(appGridDatePreset === 'custom' || (appGridStartDate || appGridEndDate)) && (
                <div className="flex items-center space-x-1.5 bg-emerald-50/80 border border-emerald-200 px-2 py-1 rounded-lg text-xs">
                  <span className="text-[10px] font-bold text-emerald-800 uppercase shrink-0">From:</span>
                  <input
                    type="date"
                    value={appGridStartDate}
                    onChange={(e) => {
                      setAppGridStartDate(e.target.value);
                      setAppGridDatePreset('custom');
                    }}
                    className="bg-white text-slate-900 text-xs rounded px-1.5 py-0.5 border border-emerald-300 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono font-semibold"
                  />
                  <span className="text-[10px] font-bold text-emerald-800 uppercase shrink-0">To:</span>
                  <input
                    type="date"
                    value={appGridEndDate}
                    onChange={(e) => {
                      setAppGridEndDate(e.target.value);
                      setAppGridDatePreset('custom');
                    }}
                    className="bg-white text-slate-900 text-xs rounded px-1.5 py-0.5 border border-emerald-300 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono font-semibold"
                  />
                </div>
              )}

              <select
                value={appGridShiftFilter}
                onChange={(e) => setAppGridShiftFilter(e.target.value as any)}
                className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-slate-50 font-semibold focus:outline-none cursor-pointer"
              >
                <option value="all">All Shifts</option>
                <option value="1">Morning Shift (1)</option>
                <option value="2">Evening Shift (2)</option>
              </select>
            </div>
          </div>

          {appError && (
            <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg font-semibold border border-red-100">
              {appError}
            </div>
          )}
          {appSuccess && (
            <div className="p-3 bg-emerald-50 text-emerald-700 text-xs rounded-lg font-semibold border border-emerald-100 flex items-center">
              <CheckCircle2 className="w-4 h-4 mr-1.5 shrink-0" />
              {appSuccess}
            </div>
          )}

          {/* EXCEL SHEET WISE GRID VIEW TABLE */}
          {(() => {
            const todayStr = new Date().toISOString().split('T')[0];

            const normalizeDateStr = (dStr: string | undefined): string => {
              if (!dStr || dStr === 'Today' || dStr === 'today') return todayStr;
              const clean = dStr.split('T')[0].trim();
              if (clean.includes('-')) {
                const parts = clean.split('-');
                if (parts[0].length === 2 && parts[2]?.length === 4) {
                  return `${parts[2]}-${partxúÏ}Îr€F∫‡ˇyäé&ëgLJ¢d[÷»r…íú®bKIN&õJÉ$$b ‘%ä™Œ3l’÷˛Ÿ™≠=Ø≤o2O∞è∞ﬂ◊› ∫›ç)YJF¨J,@£/ﬂ˝ö˛ºÚK7ˆÜ'ôód≠ﬁ3≤∏ºÿæÌ|}√˜ÙÁeÕ≈O˝Q>∑≤ŒHk˙ﬁ§L·tËß≠≈•≈võ‹TÜDì4#ÙÌ‰5a•qdÙâÍ´qËbÆ°?9œF‰ıÎ◊§Gæ˘ÜÛsÔó7‚ï5›k	I¸löL»ß|ÈΩ_ m¯{ƒﬂOW,?}˚◊?Iﬂóñ»«Ip¯C≤«Q0…∆˛$#«˛ JÜ)	ÿ¿ltîƒQ‚e¡‰\º/}FN£œ˛$%ﬂêÇ4»“∂4:;ÄA4Ó¶‚„?ˇ«Ús∑€my¬ò‰∑ﬂ»œø¥Qf⁄ ÿõÿ’ÓYîÏyÉQnì◊[ïs`ÔÜ´ª^ÊD…ﬁ5Åº0¯’«ﬂN≤Ó‚ﬂ``O˚W∞~
;¬∫i4ˆ[-èæ5HOº±;Soy]˛◊˛Ó3|u˘µç TyΩ◊vÉŒÉBï0È ƒFøbÛ“Éº0—xöéZ:¯ﬁ∫øªA>muNø0ƒI”#=ànŸ◊|&∑üûiF*∏!ØWwØ≤÷qù∫˚OF¡Y∆∆•‚—ØhoÃºlöÚ;Èﬂmﬂ¿ïüW·ÁU¯Y;‘±?ˆíœ0÷'∫‰œÚñêì¡»NC_ªÔ|g‰%Á˛pÉ,ÎwÎWoôÔ"E#∏\<Ú'C¿∏≈*˛W¿B¶ x]Fûäù‰Åü-»Wm»óªt∫˜ÖA¯ÇŸ0Hò˘ó√†ˆO eä]Ÿﬂ≈Ì∆it'—e´]ã@“rùHX¶Å¨8≥f≈Çb1¸\—‚·—.ŸÅ”ùÜ0FMÈ_¨√àÉÈ∏Ô3®üÜ[⁄8¨¬,y¡–ÅÉ7@=f<œÇ0Éô"W≤`\Õ8Í∞.W`Sè#c/å œÈ6¬P*≤ìaÎ¢ä*"™‡€dTπ(qSã9¬uÜ3¬z=Û˝ºg»œﬂZqõlëÂvÂtﬁ˝›ï7äq•y£ó π–√'	S˘´∞≥ˆs8(`¢@rZÈ2„ÉhË<¸mÈ]ÔËM‰+ÿÍE/ÒT`ØaôtgË=mzπ˙TªXù¶æ≤:ó^óí˚IkgÑ˜%~ÍgÂÑÃ"4<DüÃÂΩ@·6á |‡M¢^UWlqo2T«€"Ú5˚h∑ö˝\Ö≥ıΩd0"ˇò˙…µÂlÈ]]8»qÀ¢Ö¸ÉîÁ üàﬁGó~≤„•~´ÕüØÆ3◊aê0ƒ¡SFZ±Ü∆f¢`úb€Ø‡ 	ozì?JØ ›_l+s.∞ÿ«>
ÜÂ–“§ÊwM*ì∆ﬂ>D˝ ,&Ì:ÄÒæ2QâÕœ7ŸúÉJ„ãlµŸ»Tä)O`ˇ´bØÀ/tÉäØlÅ≈W˛Ú:‹êøÛ{≥dÍ◊–W~gK`s\ÄfÍ•)N¸ıBˇºs9ëó$—t2Ùáù´êÙA˘R…˛È§!`pguyô§#o]vÆR]¯…YèÇ·‰Ù4ˆ~Á∫≥º∞UŸ™õ•#{W?$«AøÚ wæá√øıÚoKÍµ3Ù«~‚Ö√Œ:L"ÛØ2>Â¯™≥F‚ÎNèúÖ˛˝_Á2Òb«ig `Ô˘o”4ŒÆ;}?ªÙaÆt X√Y4…:˝(ÊÌÁ‰Ø{Ø;˜‚NO≥™Í<È§7≥]π¬˘·ª∆—$“écùz}¿a¥KX⁄˛£≥Õ'á∞@ñC¿€&[¢a◊œº L	ΩÕ%zY∑å%XáÀ˙ËL~^YâØ~aÎaÃHû·
lôe#∫œÀS2l≈M”V!Z⁄ p<îg:k9ÿ∞ØØû/≥¿OâG! ∆CHZÜ	rD |ΩÀtΩï%!\¨îaXLy0\–≠•ø≈ïET??D…ç<LÆi≠¥©"∫w·ãøˆ⁄ã∑ÊÛ‰/ÌO≥,öØí]«∏GÙ∂À}—d'ü_ﬂ¥(øëeª≤Ñ`™∏\~tÁ±‘[&#§&“ØkïÉZQéÊUâàY>¶I%ä	∞øp»d˚:≥ ar'£Ëílá!€Ï‘¸ÑyÔQÛì1ü“€”X∂S6ÏˆçE¬lä=9RøÃÒG¬ÚbªgEôÕ‰cøX÷1iö[L˝÷,ï¢RΩkäNßÏØRπÛ1 P9õ∆¯#p(ƒïÉƒﬂ◊U^˘eÒW7/˙–1æ$ˆ0z«ï“‹øøgIXeáloÓ~#*¥‹UÅ∞Fﬂ≤ÕàΩ˙∑˙[N£Ã£[„ıAP5œ-áÖ^é¨|Ü•éÌ>=Éê¿÷ä|úπDY0AÿõL‡àÕåâE	”ó˘]AJºA\¯ƒõ	ï»ÓÓ—	â3I	…í1‡/™».Ù…ayY:%ArÏÉÈXCÎTÒ”,P6)ç4≤B»Ö˘øÈˆ¬÷ˇ˚ﬂˇ˝ˇ‰'∞M∑√N7Ì4Ò.öÑ◊9Xn›°ƒ√$¢∑™kúå…&Q°ﬂ∆µ€9Åê
{∫ûÔ)á-º?-—}∞}2sÿP≥M“Ü–-í6nÒ1* F‘â&ÒüpÂ¨M≤`€ê™·OXlS4r(+’2)uL÷Ö¡ﬁÅt*úmÃT¿nêNŒ§QD‘ó≤Z—å(Õôm©5óåTe±È(	&üA}÷Œ—t .b¶çIN¶]1»1äŒt‘ìëÇ÷,”ê§ª®Öπ‡™„M≥àåΩ´Œ®ÛÛÛÁ(ÍïÎ¨™üMCÆmÜ>PÖú¸rÇ=à¬–ãSŒçSÿiìÇYÿ#v¢p:ŒÌz>√Ê2Ç;å41Kû¬&(#´L•4•–…≥Ø/%az«~2 ∆é–2¯ﬁπPLÄÃ&E˙öÙUg5üÉ∆ÆCáÊÊ≤≥“#≈"zLé,ÖDaﬁvAùê?[∑lt«KìŒ%lœö¢Úèh!Ÿﬂ%ﬂP9‰¶
[[7Unß%8˙„‹LnÈe~£áò"• *ì‡|î9˝;ﬂ™Y‹€Ñ{ÂÑ∆YgL	˚CLsΩˆËs€˘¸Â•MyÊYäd)üEô>=∑ì!l£…lg◊ìPca
õY?^ãÀ~DºsM¯≈Ï%ÂA ÆÎ‚™ïlQV\I—,Ànö÷í_≈?
O@é{}≥~´ JO:a¶œëœù_j‰ﬂÕ&<Ùí£pö Ï}ùå‡?ad4€ésâ°
W Oê]Á1Z¡ã˜ƒíU∞◊\hê˘Ô¬÷A$™ÖÍyÜ2	& XÜ˛ iÓ"/ªõK±˝ı%‚÷”·”VßqÀŒù++5{[]∑(ò G∂∞u
∫ÇO’Ñ™EÄd‘∆ Ö≤-Åà¶Y
0Ãt
T6àµÁ>* )í´˙›°≠µØÂW;[˛QT]¯Pıc± Uùˆ
zk±˘√‹a>À£UçßÒ‘3Ó˙Ó[õπ2ˇ»∞º¬I;◊±‡¡f)ÈY”≥†iIæª‹mûÁäVœ¶i’P=Ë™Jê!ÛÄ›Vól˙6˚‘Ÿ1À˚åät˛icO›0FÅ'§‡Ö-äLÄÏ>Yÿ…Å) QÑÕùÙ}–ÔÄnêA‚#M»Ó¨“‘zÍ`5Éﬂ5jb6~]∑5K{1<zîË_’íë{Q_cÂºËu¡ñxÏ^í√&ÍGåÀ@Lß?ëÊY?Êò*‚pJ`»¡“ˆb˝0w‰ßôõ«‚˝E†_u≤≥˝âÁ @Ò∏bèÃÉ -£"P‰H•5ÙÍ≥˝˙ÊLæÛıM∫1Jû"ÈÌß:vT5ûàÿS8≤"¸îdÙÊì—gVÂiœQg!_◊&™ø!ã¬†-Ω,ÃKËãPú®œsÕ"ı«ÚI4”}"ˇÖÙ
ea1è˛°eAä_z±\çÛï?u^«Õ–w,Éß—¯V~®Ç“DüÌ)¶-≠KR_V®:©∑Á:ﬂ…_»JÌZ(sÿ!≠µÍû6ÀEΩPT∫-}%{ô4HÎ …ËﬁfVg$ß»4ê’∞( ∑ó:åhõª/‡U‘Væª9ÄZÉéƒ-‹∫ë9¸ú€ø,áË"wÖa^≈çƒ3Ô¯$‰ΩûÉ∫ÿ"—Èn
ÅË^HZ3ÔïÑR„j%X$ÙP5É^5⁄ï£Ôè…óNò†√Çp›*”≠e¬Œ˚≈|…˜œg\∞Rq*ﬂ|™‡ñ1≤™t9HÑπîÈØp¶œ‹ò+ïËÜ\ËáSøºLø·’⁄˜ÅP‡¢?ﬂhf≈˝Ÿ¢˚±ﬁ¬PÁ±ŒÔrÑë‹®}üPRxœ
kFêÅ∆0¿†Ó… Ÿ;∫G›<D|Êj,;*WwGg®ùº•z˛ú[#äcy(À Ç ö˚T6˜ªi≈GI{ÁT· 2àLä#o2˝√ÿüÏÉÏà!ÕSr1àÒ09|P≤£4≥•≈‘xV"ßd;+ê∑˜ª_kÿ&.fU6Ê£âoÑˇØµ‘”-`_¸åwAˇ |·ú2Ã†+“)±≥gÉﬁÕÈ'æb8≈æ‰Ÿü&^:Í}â√∑õ˛¯Vó≈‹b4”öEó®èOUCcWöEKæ=<==¸@∂wN˜»€ÌcÚ„˛Èwd{w˜Ÿ€›?}Fv˜ﬁÔùÓë∑·∆É◊Ãô2%.9SVı˚6I†¡∆Ußîç∑ÌÖÏÛ4≈Ë»ÜM≥„¨ûgôú©,ó¡∏@‹+4˙H≤‚,oåqQÒ4L˝kxoÒé≠¬¶É÷Tê4º&Ω¥[ig‹BãkB°-Üq}0iÈûeíKÓ$&◊∞]óË/E¡yâ◊ Ñ~6Ôgé˛%dH…`„ m›EÙ,wvw9íô¬Ê[)“à·ÎõØﬁ‰m}∏Åâï™î?∂áC*~∏≈6Ú∏eü[>¡ç‹Áæ&¸∆…$Õ!£À<£¿›G'ªË¨8Îƒ∂åp_3†iu∆ƒêÙ¶z,®§h<`Ta¡ﬂè}@≈ Q”ûûUÚ;#"≈ˇ¢@(ì[P!fÀ:;/	Ñﬁáå•cóa‹Ã[∆JíxJﬁ/™à“-|ÛrŸ⁄Z1ù_3`Ùiõ… }ˇëPH#›ª·’qrn7'FH“œ‚ƒé7¯·]bB¨›5∫á*4Ü‰$JH¶ø¸ë Yß´∏Å2WŸö≥Óö-ç™ˆGÈ∞o€-9P?^∂èé˜N?Ïúíáª€Ôtπ	R`W =î""y¨Ê¿TD©‡ «8∏‘œ:Çø”_¿woyòD1“æèÛWÃ®2ßBÒØ1l|e’uÂ	zW!∑è Òú ]ΩÇ^YØ Q‰í{ÄuÜÙﬂ_£hˇv^='√iBÕNØXÉ
 _µ)azUj¥Zïª«5ónM¬P„\ ]`â≤eéVµø[Hv=¡Æ˙Ù˜U‡n—∫5ﬁñ3…Ë†HÀöòR¯wyˇ—Nb≤íò	âI⁄<√Rq—‰d⁄YÆ'úx>€ìÇg…∆§ÁEÑiÒC›ù€ß˚HPNÄ3≈¸Ω}ºÛ¸√~–3ÂõØpRπ˚œ¨ ´8ïOiU÷πë‹ƒ‘¿d¨W"ûahŒó¨’]–ïèz}?îHCÂ.≤Çjºf@.â?U<∑:6ø“,JÆk—˘˙8°Fªë.7Z–bLGﬂÌhüøÈ≤?é£ã}íΩ«µFê%∫I,1zø≥PæE
å©˙#ı‡± ryUˇÂ(÷-æ)B¸ÚhiXuæ+∂<ªÅ∆d’†ØD˜%;Å∑—Ÿüƒ”å\ŸàÏ]≈@ ©úÕ.≥hL≥ìÊ.Rå´£$>0]Lﬂ¶&D{†˙&ü™∏◊O£p
$˚–M≤Dèë◊»eπeLj¿∏=VC1c,8™›
™˙#Ä1?yΩ`øı¬ΩÔulâ√“ev« 0∞FœÆØ:ünQ;4høÀ‘Ÿ.}y]Ã60«£ ÏZhm¥7™(p/íVd4º&=}˝e˘sÊcï¨—`ﬁ	 ‚ÙF˚¶’DûGìÔ˝Î›Ër‚º©∏@ø˚Ÿøf)◊{à⁄z|Í«Ô∆âÅ°ß˛ô73]	9›À™`b©`W˝®[jÆ~:ué´πé¢öøáùW$N:ÎrS…1ÅÀüEÉi∫ÅA!¥†VÒE0»/≠.Û+’¢2§P%ƒî+. Xù¬Ü‡Vä£¡˙∫≤ÆûÃ&^Ã™0¨¡˜E{ô¸Ë3çˇ°49ßÕä'@êñÖ ß 1ıûFUlÆS⁄˘SéEÀfÿY≤ÀŒX!»NÊ$wE:l@d%
≤˝âßINâó:ßÑ¢XW3˙J1É])/¿–¿Iû<2K∆<+h∂"H1…›≥.	Ì|:ıÇy]9•:ıœ(Ñ·\*=ˆ1u %Ô±üÅY6ΩiπKø≤@?O9ò ß±§&î%auCiÎ¬«ZZ";¨xu^¡(Wh)#˛q∞‡…•5”¿„¶W~bÃ}Ò/acÙ√?≥‚πP‘ú›nCe!œ«Èˆ2èÁçÀ˝Ô<,JÛÔ£i⁄á9=≤}Óˇí¬Õjª˘ƒør4HÅËqLÿ¿¬;’Ê‚ÁvÀzÍeñ/Â◊Êà	«Ÿ≈‰R)ÃNµÖÛåÌ%Í+œ∞cç≈lÆöÁ Û•œï_Ìœ…Áåè øÿüŒèüÀˇ∂?Áé7√?ˆ˚‰sß∂@Á≤Ü’í/·my2(oÆ2
z»j ?#˚§‡¡HÈOÒE9◊_ÃëﬁR@ åWÉH=·6°˛3#ñ s‰•Ú-µ"E∞•«Î@[n˘I∑ÁÄÉ<&
/¸·A±›x	gÛ¨@◊gÚﬁµkﬂ!"ùùZﬁ∫n-p˘7∑qJ¡Úo∆∆‚áb
>–ó}BøˆÖ2ﬁ`Ωiª8hÕÚ†R Üµù$ﬁu˜,â∆-	®$µJ≠r√l:Q\t–˜®é¢´Ÿ>g¡vÌ+ƒÇËÛ’m◊ØVpo\æ];Í∑S/ﬁDXÛ3ŒüÀxÂ¿`˘fÂ≤ÖÂﬂÚ	ÕH€ÚXMﬁãgµu;{ H≈"n»ƒ1´Õ)‡uPiıì¢‹LaÔ.Â|ênó®˘[Qy‹“2n0¡%oãÛB‰HzÄ®JqóbÓ_1Òÿx¿U˘\ÏVè:e_wN¨ä›Û^È\æf≈jÃAI’óZUﬁ´b+ïCr®dZVú‹ıµ~4UORT9àä/≤ìßõìù}¡\Ë≥XáKb°KÅå≤´É ±?¨/ëxUÖƒø¿<˘◊(úp ˝ﬁK3¯M$ÂN•Vú2ÈÛûß”çyj=ÚAlÅ($i‚WXr}R}˛ë‡á∫n4YÔÎÀvÉL%––%v…çpÀU¿œ¶SÊ´xw%,ªÏ†	oGO.ùvG0àän^ª™Æ9Çaö,dUí@júÜquºRÜ#%(π±1[ıÆQÙ&;£Â¢¡]Ä’&+lº'&Qv"®“ı{˙J·‹∆îÃÁnYÙπh∏ëÑ≤pæ∏fkºïn§WzáÛÊô˝ˇé(F?5›BîX˘Ï˚ﬁAwXwLÒ/nw´¥P&ÔPB`ÌÛ2ŒhX≈<-◊ºãR‚UÖf∫:&¡_dî5◊ô4V≤∞F∞$ïphU€qL≥˙À≈”\y.Tî+æo‚ßËmo¯…‰ït6ÚΩïS!‘.ﬂÑ^ﬂî÷¿‚’ÉÙ÷¸Ü€üHÎ&.å0⁄sœ°π(¬›Œ©¨Ï”4°ï}f™Ü»>©üΩc˜ã≠˙Å®YNíUf¨$ZªE√!ıûrky+ı≥¥D∂A˚=&xaxM‚ÙS⁄íµQ]:ÛY@|?∫b—[àŒA4M•:ypWÛÌ(Îzµrõ#Ì∆ãÿ?+5lêDcQH»kÍ›öD&˚©éØê¥À¢qÅ&A]‹≤‹ÖÜÍ¬ÈB˚{‘Â‚âV1‘y„¶kı√Ï—y˚Cg£pÈæn8‘lN„(ç›8’OùÉ¶†öM÷˘nú”Íá™[åÑ{Ë>Ωnª€´’œ/¡‰‘¢uÒ	‡ƒ√”òÊlÃ∏;√a‚ßÈåOÔŸ5Bê∂á¥ıAêL2¥‹/yüáºI„wõ=ÅÙTñATÊü∆C˚Á0'ñc¡zy°{õæE£˛…a^˝ßõ∆aêµO€?/ˇ“Ë5∑MX #:&‘rkJ<ê’ñO∑*“à’‰ÕvØSµ^ˆ±ı|TåÃNÈªCÀø¢øB
ò` ˜Zå$≥DÍàü:—«‘◊î)/Bp0|~Ÿ±∆E1&ïB˜eŒÿL0wØï¬Óvî_]"EÎJ◊Ëßµs©π¡úÎ®¶¬âL:<&{ß{«‰`Ô«"ïÂ√ˆ¡«Ì˜Ôj,ge©Õ¨íofãó◊’\Vä})vvc#òqø¶îp≠Ñ–f)M+o€˙—?c¬€y$ –ØÌÛ‰mõ’-¢Eÿê'E|oî_{¨˝YÈ‚`∆bÅ r˘Ïµ0nMÃ±ùƒÒ$∂‰™èµ©,Ù’ıÈÓ		çRä§Ñ3Y˘r(î€,'A´·……	‰•¢n:hqµ\MÆ?è)±èîC‡˘xHXπ%}1ŒÂ<‡<öfa0Ò;t<—È+ÜPu˚—ŸÉ;kÈË√•¸ÊÔ
!Jy∂1Bhl
∏a∏‘ó‡}\piΩlkh∫dv(`∫MT›€%G«{?Ï~<)¯˛ŒˆÒ.|˝ªÃô›eèPmµÌJRj·'GYVıl ≤≠[í™;ûµñÉ«Eëˇ]ÇMDı†ßO∫¨1é≥8o∞¬`ù,›8ΩTı`ì_ëO’∑íÆ¡ã—ZùèY©¸úéi´y"‹È;ZsáìävßiÒ'˙qÃŒ7/è÷´c®.ˆ™‹Ë9]>çïÖ≠æ cŒ±Ëz>∑ã—‡¸9ìÏº‘ƒÊ‰ö>Ìk\n.ã.ä¶2¢F.u|B`Ì÷',®íÈ$¥<‚fcòX*&ï	EÉJìbÈ5[∞√‘Õ†¬Ûy∞Á+CdÑõë¬Ã—µZ|çäŸ≥§¥sN{π©jëY+ƒ±Ê5Rpç¸Àp√íÕì¯ˇòâ?4ﬁ »π0?úñLM“-–]≤Uz}5ïhxô5¿AJ’∑y®aÜ¶¢6ØÌΩC/J_2Vdìéõÿ¸∞Ècyã!Âƒ—≥B~#ΩG~ˆyØõÊdm3ä)•‰˚∏rª%uWﬂ\b◊ùË›nI€Î M∏!π¥óB5v◊4è∂ûhÅÄ“∂±ïÍ1ö«í˝LßÁ§ÁàPJJñ}Z\|Èé¥Ô1@ç÷ík˙ù3†z *[Ôåˇå7ûºl∆§¶¿≈gÿ≤¯cø∞∫3H©xPÃëﬂ˛dXÍïOÀäQöø¸Áºı‰Â5´U0‡/‰˚2úZÔ$ùß˛%´]j`1Vy›a_SZsŒ¥ØÚÆTK>Ã›˚µV›1i;∆Õä&gA2&ﬂ¨ü'÷8lºÅ∆™üHI ~V~™÷˝§£kbÈuLµä„ßäüsW¸§uûuπOS·f°oL}±OµQi	`§¥ık?|˘œΩbn-Ùu,˚I˜‚èVÛ∑bˆ¢üµΩDåı7l¨i\Øâä0äàœóµé¯£$:Bﬂ¢†yÖÑVzã≥dQwŸ‘ÈÑ¶¶Ê3¶-;#j_ı`b∏‰‹}L“∑ÉÎˆ]∂˜-ÖS‚S´Ÿ)Äz≤˘ì]ı_”ÆÍÄOF’?ûQµˆ‡ü,™Âï'ãÍ…¢Í∆tüÃ©∫œì9µ1L=Ñ-5è5{p+™Ωùë…ö‡ha]ïÂ!REÔ"πõQQ†π—Twmà\
ªä≠àÊhßu Ó%«Ÿ|ÉüG`g∑…?[{}
è€Ó⁄-Ófõª•e›Ω[€m[ˆ1FÂ¨÷“>sp—}ò·µ◊–<ü£ﬁÀç>ôˆOΩ>Î.è©?ı©^xc	»âÔÖß—–ª>…^˘∑>5R»ÚÊiÃÈiÙŸüÏD„	le—ÁBÆD⁄—∆â—Á.Kò•3Ìıî±¸£«;9Fü©b˛ˇÍ“?˚Mö}ıôëó“t#úÕ˛ë◊DeI›“Ü∑.Ë,/îo|ôT¡¥u—•c“º!¬7yãÚßÈ}º¨ò“÷ÆN7H•-ªVZ¶ûw≤¨ô∫‘Íím¶0GzÉp k¶…Úc*6Ê%œºº˘∂(”‘Oò∆¸±9Åô`Ê„õÓvöÁH/˛Uy*Eó\•˚4<,ì]¡Y»?-æç≤—"m•X\–çÀ5=˝∏=◊qãÅ±D7V{&ﬂ†Ãq˝	í∂$/]@qí¥¸+ZÅíÑ˛π7∏∆åÅâA|…¢1ŸﬂeΩ£IxMx©J>^B”ôiU—¢û!¥ï“GNŸJ‚_íÚ:§ô?ø¢'˚U&ævSÑ≥Ù« µqˆãmÂ∂_xiy˘ÂÛµ^o±@räV,Ø≈qNDËm_¡ãƒ˚Íﬁ√wnÔ
∂íÓL±ï"ñÒ
≠j’aÖt≈ö¢À¸yF˘&ñÁ5à%ÕM¿•vô∆%~Ù®Àé[9›¨+"‡z&‚:˝Â+ïà√£mc|Ü-M_Ÿõ„ïÉ¸"-Ëo{£f4ëü©l#≤Ü~ËøçÆ¸îñ2@Ä®êú70Â≤‹&a%∫!\\QÁèFÓù(LwPD¬˘W_GwËYSY«C1ïï6~/áÁ¬Â’EaQö˙ç¶ä±/
G5z©˜'$Ç «aπs¯óJ≠Ÿ\˙Ç!9<–#∂0ıB#“Q?Úía%ÁYôŒÕ'Í¯˙F⁄©[ÍxÒÈVïñîØ¥7˜·4B}€áõ ÅjöÊ‘Üÿ¸èLM«j0ÄÉá]˘|¿~EsVzZC¨^ˇπU±Õj™Îˆ˜¬ÊÁ◊‰ÈÚ\sãól…%-ˆœJõ◊¿#Ù(MâHfÈ\õ|#õ∏lÖ˛÷eñ›»t∫®lÃøk'ÆW∏ç~yÂhÕÂ~«¡§3Í¸ _˝¢o¿©ùmMâﬂ*@ØÙƒ∫æf›~g‰>Ô… Ù+≈:@÷∫ºÔÿukq≈Jè˚ ™Fù”|-wöÆá≠≤ppöÀß Å]rÚLàèî8vÕn˚ÊŸ§ Ó”ö¿ Â< l/
,‘DßÌ∫µMÔç˙‹:DWP"JI√>sô∞⁄‚√“X)axkgº“˘˙_O9ˇAÑ≈ÑZKX•Øî‹—‘A`ôX(Ç˛ùDó¯∑L«™Y≥lÛ/ıu"‹»ÌjMûlu¨K¿e¿éï“†ƒ’DSìâO)ïsÖ†/K≠M%¥Æ(ã#u¥≥ØÅê?Ke_p}%ôJÅt†ló5gBü”R3#J¶ì˙Ò∑n “⁄4∑O¬ç∂9v«˛jE¢Á¿≤a∂hèÙ∫[ÚP¢>¸\NäFõÃ0´∫I´˚ú≈£gK˚Ê√:∞`}˝”2ı‡àZpñx˛ıE˛˘≥#B˛‰Ú,*÷;@XßaF#6ÎóÂT^…ºÎYÓ@…ò˘=RKŸ!:Vìú~1~æén›w€IÊÌ9jîùé¸dÏÖÔíhLIbBì π<∑"ìQ≈àØP–¬é}•≥^kêD0fõt≥Rcº1 ›¥gakl∂$NòôúZ}H5ÂÌk°ˆà(;ì–ïDª{+˛áZeÃ…ƒÊ~
«Íg.¯„VîÃˆ¥¥„Öa^Zo(b$ke∂îÉ∆p4Áô¢ıï ‡¶Su>F‹µºh∆ó>∆πIs°QmrŒ#œ=√_0˝VÇC˘€˙ùë:\ïí8‰‚€…à
Û˛r˙úë MßXi‚‘»4Û>[ÇÒS6Zﬂts¿„”§TˇÆ oûÚBÜ⁄äÜ@”é≠˝±Z¡Ä¶Áà°k&KòdΩ¸=Y¬
ÅÔ¬J)ÙÓÏ`Ú©r;XÔÀÿ¡J·YZ_C+òÏ:xÏV0Ìl÷
VÄ˛É¡d`º{#ò≤˘øo#XÔﬁç`~Ô…ˆd{2Ç=¡ûå`ÍÁ…ˆd{2ÇŸgd{2Ç=¡*€˘d˚˝¡v˝aÄÎêú¯÷Q©å¨˛Å≈ÇC(Œó•ûu¬£5Ñ	!a/“f¥\–“#"√lâ⁄M≠eö≥ﬁçô"»¶∂
÷ız ÛBO·ç…0p∏"1dØ˝&ßq‚ßÉ$à˘˚õ⁄LööÚRµí∫¬è≈zByŸ`Yü.ìlv=)>∑0Î)'†Ωãø!ã4º5]‘1úµg}F¿ìÃœFQ:àbﬂh,3EÔ◊˛W,úƒôƒ ík?+ÛÃV?WE?WÔ{Â»íz~J<ˆjC¯iJì’·öà?‘˘·¯Yi≠Ù§ûòc ª0O–ÇTXFﬂ©πRÜíﬂóµ≤˚VÊl»Æ™ô˜=eZuM©V ∫Ó»Ëäá˛ÄfWU'g1A#z|fY1ú∫A9˙;1ŒZ⁄ù‰üGbôΩÉÑia¥á≥ÛöDíJ√'˜@˚ûR∆FË∆Ó0∂ºzì®E‹e:õ≥∏´Ÿ™≠\˘Ü1.◊˜áÆ˝ÔÃÊ:ªÖævésò·>ÊQ£œãπl =Úò|*Dr◊§Vîîw¢Ço$.ß	ípﬁ:AK–tºY)éóeÛ´∆…>SÎ¬bñ*bJœºƒÒéØñDùi√“*ÿ=π« ù•ªÅw>â“ÄäãG¢<óôµßÁt~w‘!Ù…π‰\xr.ËÓö≈πê∆æ˜˘á(Ãdb.¿áó?R äÚÉ\ddn–…Kˆ:Ç ±ã§PBPEÍÆòxì	º|‡£&6'§¸Ö”±^id7Ês•'ÚØÊ∞x¸Óä?¢è‚Óù¯ì˝7Â—b"R[qî+ﬁcï9r2H–~oóº/‚<	Øg0“8ÙÆ—CS(•˜. Ú´© Ä\ûßÒ∑iÄnQÄÌ$
S'Ááä¨c¨ﬁ˝ Åµ.T¬∫
â›Bb-7á%÷#∂"-5∞sT[XÍœçj¶¨*-lΩﬂŸÂÍÀ;Z∞bCèÍtÉ	≠ÈGg]”µú* TA(wˇπ∂πÄë2◊Q„jµw†Öß@YÒŸ≈>ñ∆—Ra±⁄CÈhêigÈ§(76'•·¸˙ÊL~/És˙n‘ÀÄ(Ÿ¡A’CEâUK/ﬁ~™Œ^GD∞;“TCåuıÔsÛyÊ¯CÌ˛z~ÉΩœ»Ò'·ıc9∑¸PGêø^∆ÇÁ˜wyx£30Wªì”îÌêj[ª“KÔC<7∆X?DCêì©Øññ»vº"Œ»ƒ£I}‡G)ZãÕ'XîŒ:ùTF»ÎÒÎ‰5:∏¶(¸wœ˝l/§z¿€kÏ,[‘‹	ëÌwÿËù‚Q]SX¨UéÏΩ¯“≈“Ú~*¿g[ÎÉ≤<–jwhº…´ﬁj&†¬H•;≠$/2gÚx„íπ-ã*ëåeYcƒûÀ&lMÕòpËÂâ”*∆ ØtpPˇÄTgR¨
¸b¥X™K˛aXÁä˝6"∏±ÑJlÓ®"ãFx4JZœeW~g]ÍhƒEÖµ™Ã Ù0r,
•PE“@…Ò;ﬂ£&˜(!ß?é/5•†ÍÿÁ*yŸ≤MêÄ˙ÜûO>0Z©w¥˘”ê¬U¯[ÌéûyYp> dSiÈE @1ﬂ x“N2;N»·ë$ÃÔ2)~si¥¢ô¶ŸÅì˚Îe·S5”óSa]‹èBø\"rS?<¶Îhö∞2¬äπw…˜¿D¬kÚŸ˜cv9Ò~”Ä o®ıˇÎï#Âúôç˚®ìQµ¢76¢ÁáÉà≠©õÓ§xî|’F÷¬Yj≠ÆÙÃN¸®°	Ä‰F™ó˙>x°å˝ºl™Nu‘J˛n<—äÒ˚o±bZ2)=VV®∫¥æ@“Ï:)De	xÁ);‹™4/M“bóµj=jıûa0Õÿªj-?#+gIªM≈¯kQz«m•òõXΩçΩÄΩYó∑⁄≤ÃÂ∑ﬂÙ3-ÑbΩˇ∆™∫∆@
k¢¸÷Ö∆S/f±3îPÔk…õ±Cée˙àÍ"´¨R
&ß+Øî¢kÀÎ´À§CVzØ•Ôö-°•ÿŸuôôØJ~1åÿûNJ®'P®ô9îπl·iE®ñı&˙TõW’ÏBêﬁ)≤&πÔwSÔ!≤ÚtlùV¡íÛâu—Vó#äMÍ‚—
¯ÇËáL–≠W’Õ‹ÎßÄª‘wñIËüÒné‰∏ü_apÄßXÆµPó ›˘x|ºwp˙˛'≤@∂ONˆNN∞•≈Ó◊bzm∑†?Mÿüâ €µà“ÀÖaG¥˝›:rpx∞G:ù:kjÉ0÷B†`íò•|ûäxÜŸòª]k‡ü˘Ã1t⁄\´ÌÍgﬁÀÁöΩ¨Hk¨€ôlºÀE∂>u’⁄≈ÍÖ˝ÛLpÖaÇ¸Ns‘Ó∆Q¨ì ç≠9kì‹§
≤Â·À—2ık’ƒÕ≥Ú2¬É≠ùÜËÕ'.[`É<}l±çàÁ˘èGQ§öºãvÙfl∫ÙUπtö%˙Ö≠∑˜O˜æ%˚∏˜qè¥ˆ˛~J>Y9Ù\≥û÷≈WIç»à…ãı6/yi_3·iB[…xçJ∆=k”LWç∂≈)¶óNµ-%y¡ÏËï±CÖ¬√˜]‡+vßúxs]L ≥‘]Nµ(9¶“…ÛWÖ°ü◊©L†#T∂ã‡©Rå§AUûÃÕX„hl…’å‰»Ègó⁄?w´J∆Ì'UJØJq{ªB£ï¬=+/7ñQóÍ≠¿øø]JSøˇIóz“•AÃì.ı§KÕØKi·Í_Bó™[˘ì.ıÿt)◊|]*EΩ.•›∏˘t)ßièPó*Ö 'mÍ^µ)Î= ïåÏ/$t™ßˇƒ?å—¸=ëÚ›’H{åÊYpÂçSüãÇ◊ˇJè¸
≤~~QƒXU?*d”kîQÄÛ˘£ÿ	CÓÌØƒÜÓ‰Q°_$–êW… J0$≈%*I∏kÑ˙ÇÛ@P}à¶£WBœ´Pq¯≥Ò£¶˚[Suâo÷¯œÖ≠⁄`œM÷1^√ºKµ¨~´¿≠ÌP≠Ñ¢…]™âáÌØ+h“ÑÙ≤)*≤†‘¡z•Ë`≠4=◊7µï[ |≈}±¸1∂h«XÿB47óÿ5œqg±ÍˇƒË6«∏çD’˙Õ# lP@P~˝b±o,Y^\V´ï»c÷Ù·d≈˝˛Upè°dòû4`i]LŸY∫∞íW·%∆ÀJå)≥çiÆ;UåÓ^Ü]„Ωõ¿ÍN¡ Âˆ(‡‡&DW’D‚€c•^(Ïa<,√Óı1X¥Â'ﬁ«æ˙ì!¡œÛÌ5¯î—D^≠
ëWœC‰ï^¸Œßò´Å√Øz˜~•$2Ü^ôNÕ"ûÊ;PXWf¡zÅò∂*≤iá¨;¿“ÚbÉ¥ß`‹ƒy∞Õ6ÏÚçØ;Î∑Và6k•g≈∫Ô@,5À9ÎÓC∞jº∫0÷*<ŸÖ\õS·é]
’‡S˙Ω°"¨q'‹edñ1ô…Ÿï «LöjÅ›{HV”j`ç5Ó°§ç.®Zt <ü◊Å∞ft ‰$•æzŸ}¯–Uu(º`¿1áC·˛B≥4¶sÈ=¢¨›µ/A#^§„ZGBofG¬EÕ4˚∂NÍl≤¶|)»wÎ_»ôÖ¬≤j⁄Ëõ≤%X}
ïdSπxÚ`õÈıA∏¨˛n#å∞µ‰æ÷’‡ñ¸\‹mœn‰e»a∂±Ø·˛¢∂f†Dw≥ÂN|*>¿ûÚÎ*Nõi“LªóÜX£≈Ëıfæ≈Ûpñﬁe◊™l€lÓz0
£ÕN–ï√oSGÑŒÒ dZµπ!`ıw‰à∞óá0∞HTÌèj ós◊›q=)c_&∂ÎëhcÛu=icˇö⁄ÿÏ¡]O⁄y“∆Ó1∞Îè≠ç›qÿì6v?⁄ÿÏq_˜°çπF}=mLª{wßç›e ÿ√hcÇ,˙§è›á>VπÆxﬂEQVÎ{ÅAQta4
Õ‚¿ñ…PGı0åí*iò¡Ö{Ù›ÜÑ@qvBﬂ˝ﬂˇ¸èˇB|È'¨8‰ˆ>9…¶√ "oßLÇ^N¸4ÂA
YD0îÉjí4¶Ì"/´ª£˝äj≠«· «ø"@lVU˚; HQS	˝.FÒ4ÆÜ çÿMÙzÒ0…{∆`9Ïñ‘áÕ& w˜√iÇ‹„◊éµõxN^YåwP#Áîí9[¿®têÍ…Aj¶™≈ºÑì+®ÃÅŒÒj˘b§˙©Z òMSS•ám∂6öD;ıÛƒ‚Av≤®T.â∆l^^NùhXb§ˆf cuq~SÅ18¡ΩEÇ6
π⁄°ß'uQ]^Í…ùTWÂzï⁄¶™k4mH/≥‰@.ïå⁄cïØ—ñR5≤hﬂÊh’ò∑PJÏ$fh¯≈
J€±πh`¿⁄\1Ï∂ÂçVµøkÿ‘ J¡ß¯∂ô´ﬁﬂ∞ÿ:xt¡'l‡/ éù√«˛¯ÍÌ5m1√≈µ-÷,åÙ˘ÙÉ|}£‡±-b›åÜ´í∂©∂¯uuÇ]Åﬁ~≤ºyÉ|B9OúJÁ‰Ù
S£ú≤x‚{…`ÑMóÿƒÀÂJ‰» ˜Û7:xi¯æ{É?S≈F{Ω∆jµ∆Ôt\Ñ@Vß-—îs—H≠ôh¥ós÷lÀﬂ5TBCÙ≈M5£rt›üúØ˜™Ñæ
%éˆ·Çhb,&ÚG’$[ˆúX‘e‚≈v‚ü´uEöTb ÊÓä"ìrı∫≠só¥K¬Å˛b©e}≠k∫th⁄÷ {£lc¡#ƒ¬óG^“Êﬂ–®§òµQ¢maå3ﬂﬂ5…˛ñƒ¨ñ)ö}XaNV+¥&Ï`∆îR©ÉôjT°∫®eû∆ûiºµX˘>s⁄WìÉ`bkU3±ÊòÏXæU+e1®æ)&\ﬂÀÆs¢ia0U]◊€Ûö$X√\+íCŸAC/vlmü˚K'˛’Ü#Æ„HÜa~&öﬁíÎ$%K:(á∑‰xi–èa:¥%íi2JÆ√¥Ëp¢>0j!<X⁄^¥Nb_&S0ﬁF√ÎZıBßX6nÃ$aæŒ*gwÛUïãÈ0Õ¶©Sª∫–Tœ,˜ΩtTÙa™i¿¥…E)âµœ⁄’So#‘ m‡bbæ'|åêVìs vñeDŸ¶yÑº
§≈B⁄ÿ•	a‰ŒñﬂèÆ™í£$πÍmì˙î=†)A˙Œœ#‡“GπÓ1ÎâóíÃZΩ∂∑Rqt[kÁU!úÉóù /**Ñ¢ˆπu®C%ÕÿCá™LÈs{DìÖ-s◊`ó˛Ä%É_ÿzÅ˙èÊ¸F
†…f<Xã6¶=_ó}çYaV≠,˚π'k˙Bv!gU Ô
íKè©Ï®
¬öÍ Ho}AK4sò˜Ÿõ©Åvl·a|Å⁄v˘ÁC”±è Õè˙òˆj#-UÒ˝y˘ó7]‘rK÷b“1õ58õr—t—v\µçy¬0◊dSÇî«ËÎ@◊(Éã¶«ºø-(t1¸±c°^·Ô6]l]Øoù™ÂÖ·{Ø
OO—Á{?}†]Ô√c?éíÏÿ«Ë
zŸP≤âæDè%ºø÷“+OÚVX4°äd‰
ñ≈GÄè∆NsS÷f˝ÚÄfS)Èdø2˘∏oØÇÚéòÓ´	=ÈH"vZõ 1£Ÿˆ¿Ä	4Ò8ª‡úı°z…èé∞≥#¸çb—_ºQaƒ⁄¡“F=ä%TŸ)©fEé%≠6-ÓùgÕzÈD™§¨TéÑ04$‘‘ô«!e“Ñn,XX ¬ *ß˜Ü,∆Ã„¶˙Ür®^z±L≥Ω+U∂•˜hRP‚ççHjée÷˙>∞Z8'≠…hÔ\¶¯w.∂7l´®áì€≈(–IôÎΩÆlú/¬Ød«;–9:*£F ‘R€VÕÿÄƒ⁄DtûégÕ=®Zﬂ¬Z≠2¸RêîÃ¥≥·FŸ˝òÅK0ÒS“:æjs°CõK£5-ØlZV®¬◊À–y@ox∆d‘˝ö !¸‡<â;¥ahá;®îtõ€Ø!hÅØW‘y·R[-’7À‘Û”(&«—ÂM¢>¥<ñÏ¿2Ú÷û˚‰/-f=6=æ"o©ÂŸﬁÒˆÆbyW≥∂˜:w6“»≤	ãŒêÑZ‹ÌŒPûÃ∏¥H≥ãÀkªƒW4ë^∫√Ø…HZ~Ñ¿πæG∑K‘ÒÿM†Âß∆S7@•2Ñ˙eY¡*÷V[U:œø¨‰ØãÊ+Œ{€œ‚¥ê±Áê˙±É14FB0*9Y≥∂ÙbÁ‡„´ﬂQkÿzxÊ}πê‘•‰5#‰›ìÒB˙kÌÑ‰Òkæ3Ëé9£¬ΩGAO˘Â+Læ8¿⁄7q¡‹≠˜Ω–M⁄≥4 ò! Ó˛‹ ºÂcìË6Ë/ÙñgD|ÎÜ2ãgd•ﬁ9˝ù˝≈f ˇ¶s‹∆ˆ£	µ&bÇ‚" ü‰∂xÏx±|†ó£3Â_‡‡ˇ@u”QˆÆb=>–•ÒMˆØbxÆÜ˚…ﬁFQË{mÏ6⁄πéç[ˆ⁄»é.vƒ◊Úª∏
ÜÃttƒ∏…à∏! ºrÅtØÿvó„≤Ÿﬁ¶◊„8ã`ƒä∞˜üGvÔ|•A™Uø¢:Œ)Œp\UOÃŒ,m/6XìF2ø˛é2›-ø\ö¸Û,ãz/é†{ô”B\ƒ( 
{=~ö∂>â“Ã#íû84&2ãP°>fÙDq˜´OÆ≤€–œÖ@.«ôhjüû]Ú£`mühöµä®yÅûÆ-YΩG9≤ïb§!&¢*Dñ1kèOÜ§zûMÄ,=PŒÚ#Ût§LøºSA≤.¬Gõ¬É∂J—økä∂’Ö≤4¥fîéá:(ˇπ%˚ß{Z'v±¬A—t≤ô 2±(n‘jëÃó Á[Y¥!0n:SÀÅˆO«µıs≥$öú“‘UYpJ≤DrÓâˆe˙‡ñ∫ˆ9ÏnzSﬂ·ôÿJRÛÛ·9NS ≠k*\B≤H8Lß“Û∫9›≠€gÈE≠ÁáOCÔˇY•‰p5'áÕ|@|‰{ÚÒ—ÌÄäüõô‡±îËªk_]¨&7“˙›∫ë¯t8ìr√?Ê9U7´ÆÏ5}[˝ÒX ı„Áf^™pﬂ'©˙ëöe˜êÛ!œÍ	"B‰∑›ƒ…¶∆Tî‡r∫ıöçlÕÄÛ0B,˝~ˇ`g˚=Ÿ9¸pt¯Ò`woó¥wÄUÌ˝}gÔ=9›~˚~œÍV∏—Ÿ&Ñ‡†Ü,oV∂Lh-kÊˆ,bä
Èø®— °LB≤ê5qH´z	¥är+Ÿâ∆1b∫√Û≤uä0MØhZÑ(4‰hÁ‰õ‚ØÕºæ$E„€ËNbÕå¸ïÉ(Ω8Ô—≈rVq¢∫◊å|oËÇ¢õY¢êí‚ÏÀXôRÚ(7B$j˛A	/3k≈:‘‚å.;/•Ï‰º:v%˙maÎœõKŸhŒ◊YÜ/ 47§|x˛wb1jı\"Ò_◊·æƒ@ñ!d3Îc§≥0C@8¡Œ5·“Ñ%Tç±-îä›Z°à≥Kò33ﬁ≈IÜå<:r…®é:‘I¡:≈åxù:.)Z»YaÂ,ì√NÃ÷^œC˘rñ2'R`YzOøXA7©.∞—ä‡Ï%7¡ó_õ.Î†àîmºÊ±∏ÂﬂJ&X∂ˆ˛~¥AæV/›∂?±`ß;_∫I∞µ™ë∆BÇP/òQF7ßv7ßxv¥}∫wpJéé˜:G€;ﬂoK≈≥£Ê‚ô‡√{¬ô—≈?õÄñ?=´àvD7cú:G¿‚Ïálóø¨à&.„è/§	0†”ƒÕ∞	j"‰<î®&Ñ°‹è∞&ΩÄCÎ˝	k˚ì4K¶j¸z¥2õ >M§6ëﬁ£ÃV∆5=©M$π3O±KnMÅ"_”„î›
“6ªÙˆ$à9ﬁP'à}8‹›~‚ÿOX§ìº=ﬁ€˛~˜«Úv{˜[ª vO{ÑàcÊjR ÅVn‰	ΩŸ€y≠ŸAo˛í
¶ëòùWÆΩZ“IJ„°π<QÂe;Q ÇéÕì$º¢÷á4É$(¶œπ6(µªjäÇƒ5y"ıMêŸÁ»ª∆Œq4 ∏ â8öê˜^öáe∑j"≤≠©"l”\\˙S7üTÅŸaA€1œ†ãzÁ”‹}Ω√ö"»Yﬂìõ⁄ıãØ≥è>'Ë
^.{[}≠
Gˆ=Æºdˆc©˛œˇ¯œy,Õ°Mˆ≤b2úa7J¯ﬁ⁄Ÿy9Öñ¢q‹®ÃàÖ’h…3)÷¢hP,f=àäç^-\£‰ÿï»±lŸ#£]Èﬁ∑Ã†ù€…héfÓHò∆ı¢Ö±2â˙õæ¶ÍΩ†®´6∞3ÚüYÚyœXêB¨AŒKRò™Q8dÑï’Ï«[˛eQ=`	+F%xp À‰“º…•#:´éòéãYÎè’\:-JÚ‡pH…"¿S°§ZÜ—l<}ºK~ä¶d §Ó2AÙ@¿Ú”ë<Dﬂ£K]ZxÉö⁄˛‘“oe≠myR-%)C¥  ]Y¢‰JÈ∏ÏÍ$¯Hà!Åﬁl*4gé‘eã8eà∞xV‡[úZ
/’6–«ïb\±§9\XI=ûqL@yø£d%≈D‹nóDìﬂﬂf?|RâîJbÑÔªH(π≥4íªJπ´îÖö8•ãíD¥√òÊoíØ‘˘¬œÍnq ¶0&Ü‘å>˜¢*ëÊãÓëìAå#Z&o∏PMˇxœ ÿHíGÎÎÒù4§mN±‰ÄÃí˘1∫Ü˛Ïf»#—f{TV ⁄\2gYŸæGdï´ö;¸R6ñU*èà"<7É±∆=yëÿ⁄¬„b–≥Ω¢¨>ÕCì⁄QX†Lr}ôæ¡3‰èiÒ6ﬁæ	ÑÃdlnˇ§œﬂ®ËR ◊ØÙ´ÉµJe¶ ≠µ‘
 ∆⁄¿¢◊•æN0+–ˇÌGL¶¥VˇÆü~Vw‘V&ÿ¯C•ê?˚5åÉΩ1N`”«{ﬂÓüú√∑√rÚqggÔ‰Ñ}<‚l°Ñ‚üs§ó
¯ó?[ÙöîÙˇµÛÛ+¯¸"◊ˆ°©ÌÔP÷mÓ˙˝Öﬁ…A»Ïl*˝«ùBã±¢dö<>∆<(ÁW©∏Ç•©‡∂páÇ˝öUÉ≠€òº%ür0ôK“:ãU‡´15T(èFı≠¨ªÚMµ˚‹–å:∑êu∏◊∫ÚÛN∆1√Öï≈¨‡)Z;Ú¢ÈÄÊﬁg X)s‰•§OªxhÓÜMﬁ˚púT[A≈N†”ˇ-Ü¬¢:∑‹Æ¶¶ºEæ^¿!ño+Ç7‹:3®f‚tΩ]2DÚ±≤‘®1†∂hn5ºcùπ≠Kõ™öhƒÓÖ≠ô§u˘·ÔecÙ•uj©∂ÿl'5Ær„.Pw˜cﬁ^«ñ’[û¢¥eò’)k0ªÔàÔµBìMd™µÜá=ÆÚk£x-›éãka≠Ô çº*x≈¨x’]
‹Çº≈Ÿÿxhï°’c8¸û,bñrU· ]í:˘pBNÁﬁc[—”Ωù@6h∂t∫ÇÙîéSºï›‰ $ı#ò◊∏Îü√ø¥øQ!£ò◊™ûbÍGÙí∂?dñ0@πIµk=çKÉ’H?ñ0ÄJ;À*«™‡2é6¢qxΩ¢Î´Y…∑"∆Í≤EsWå G•@Œa]≈‡∆€, »Æ;/ücÌfG*T¥®ﬂ)Ω%_ñË`zÖ·W}÷Ω/©Îg&tâ€ëwjHQ ]˙^6aQÚÍ˚t4ê!ù™;Vµ¿iE≤ •»y•ªK•4∂ùh¸Û˝è¶§B+säAr∆aá°¿Ê	kœcmPâ9Ÿí(Lƒ– F~ùs&å™àêï ®	Á>‚ Û¬‡W_4N"å•L4‹Nëok?mØ•DÂ À≈ö∫7Ü>≠dŒkG+ª∏ œ}å#‹¨«ßç∫YW&˜<˜ßŸƒlÚ∑bp»≠”<vï&Úbmlã…wßßG¿≥Ü˛Aq˛{-n—üé˝≥rÛ¡ÀF›≥0äíËç!!Ù7‡û√h8ıo‰Ω†+ËŒÙﬁE!F§Oc¡¸!HSVRû≈ Ø=0⁄ô Ûh≤æÄ"CEól¨è1øü›9SS¿e}S@'√Â¨_∫˚à0já?≈z†ÈÙÁﬁ„/œ≥™6ñqj‹ßOÇ‘u[ô/¢œ\G_Ë≠WNﬁZ•A1#Ë“B˙R¨Üí*NhAr#{8c‰cs¬}66;1 Éã≈SŸ#%£Ä®Â`EÆˇÒËú9∂óy.µìQU¥‡dˆìY:HT[jîø9BÈ©ì5Ô&á∂Ë¨†üAJ& {>ÉΩ.ŸOYÄäß°µQBﬁÓê÷ªƒ˜qåùëóú˚m≤ê˝∆	bÎ¨b/ñ++“,Éu≤∑c≈ìw>÷w><⁄≈øûIÒ~œñbÅﬂºdÿ&^‚Á´ö¯„8£;À]ﬁŸ&è‹™¨Ω¨˚É!<g≈eÙVO√å2õgÂ„∞K∏) S∏mY‚{4¨Ûæ9‡ *oÕ¢¢·◊d»;‰ƒ¸‡lÕ3¯ÑŒ√¶
ÃˆüµªÒÒae,º«îøıàõ÷´' Â+ùUôı%`Jé‡‚—©'ÜiQÆëc∂bÚ§›…Ó˙W˛ tT¥ás,°àIù∫œ»¨˚ÀΩ¶3öq¥;\nÃﬁ3w™è2;.ÏnS&RˇÑ‘¨†@mìv}è'´ãJ®«%ù„ºxj §y◊œº dAìÎ_„io1Ò4âC_˛€„Ö≠ìÏ; ˜Êœ~sà¯ç3®Ã·ƒ≈◊˝Ë—<ãú	JÆÅã?zóUÔRa°ôﬂˆ˘]©^w„≥q6áJì∆·≈}™]òZP§X≥7Î∂JÁ÷Øl`-®X¬ˆÿu,Sü´z›«£`˜/ú˙§≈¢¿–Ç¿∫É¥µ/çGÂ2JX?@É-˛ØÔ”ÃÜÂäÙ¸H∫[®¥´
» L0{
á™Ë.Ä0•Ìl‚7z˛Ôˇ¸≤™ﬁ—(*é
ü¿ë*˙û∞C™¬«/©U0Î5#„¥efÊ!%í3Té˙>¬˜%É˚"	AÜDÄÃ√ù6Og ÷zÓO@Œ¬§Ñ˛qLº…  Ç}Èág®L%wRÏ”Y¢∆U5]%Yu«Œì Ù¯jig}˘uï™∫æ;F z}?î»$≠ÍQ±çÎzçÕï>9·'ifÎ"∞7óË˚µ3&Ò4”Œ0wBsúÙô/êpΩæ9ãl"áÒ¶°vLyìs∏ΩÂÁ∏˛N~∞Âw3Ä¨K6§I≈!†√ˆ…O^/†€G{ó∆'õÎLµeìïR"”GÈyÑıO”çÇ5≥Ø’NÛ‘ã/˛	V}›‰u«Pˇ¯Å‡M4l§u˘lf=·È‡Ô	˙æ<Ù°!Cê©<4Ï·\p"≥¡ûÙÏÏi‘0qÕ ˜åL—Õ¸sLµ\ô√K5≤Ø
7YÉwÕ¿%Ä±1up`Ä)ˆÄ =jqÃàXf€Øı¸‰Öæ%r‡˚ YsÕgaÀxisâç·0¸IÊùù¡Ûª— °ı∏ß1\h0Ùè\Ç]"ˇ’˚Ïe‰lÌ¬ñÓ◊ÉRÅ•¬o∫ºÙµ¡0|U;—4…¸˝$ˆ©‹MÈWÇÂØÏw4xŸ!h0"˝«¸ÿÊCwí†ı#–våj7Äzè∞z¢ımπEóR/2+7P∞µ\©°ˆ K‘¶ædDÆ´Um¸ÖÂAs¨ A^Ê@ë‰€E•É ÇÿdπK`pm˜b¶¬éÅ§ÇÈ_∆Ø4ãΩƒú$4£WÈJ;Ä
~¯h\ÜÌ’9LŒ(˙ƒ3¬|R˙lÀ(n&>3|¡§˙\Aıüq≠P¡]˝ 	ï:6H!±–dÁíÈÚMX‘<|{'nç”Â•∆È≤˛0NóÓÛπ‹tòµfq∏pÔ˘Ü–l K)∏}!Ã.bÿÃ‹ |‰'cobà}º/C˙ä^•©Aöß”nàùÇ∆≠á@™ŒCì¯√{wœ‡;^<ﬂç};MPh,—o˘æÃ˚ÜRê¥ÃŸR¬Æ!èÓ>}ªZp«#6gq∂A0 (Áûê|Ánê’9› ∏›6ﬂ’ÇøÀ=ÄÍ}€†∑]GSíN˘óe'q	bú¬)ïµ1Èò‹∑∞e¢úq÷=™f¶ë÷˛Æ5~æŸ–˚ª˘¿mCêù˙k’OYçÆcaÎ5Ûh„Eo¿X±7¡@¡æO`è `ªå°¨!V¥bﬁN¿yﬂ°ñY§æOı∑©d5
É4ÎÉt@Ë_¿dÇ°_¶ì™ñ£`‚PO¯¬`k;ƒ7e‡„›I(ˆ@
ä¡3∆Å˛6ıßòıŸß›◊Ñ¬ç©˝¡∑∞Q∏{ﬂà’+1}W˜ÿÊ“4|HÃ®môôÃc•“ööMï≠&u£“≈ï%igµå‰Ë´⁄]-Àù‰¢N±ß¯É=¸ \ÎD÷ÏGìü&^:j(¸ˇ‰ßœr|xÙor˛•bØ¶Ú7±>Ï€(¬îßƒó3˙8¢æ™˛*(3 ˝_M£î˚MI1ÜZœk‰~w—{µZBCÕn£}MpÉ¶V«2÷ÍX6&ÄV
wº¥ÒJù~KÕ÷Õÿ+9
ßJEÍ0©⁄<C^˛lzÑúv‹g	°.ú`&Ë4‘g—ËrâV⁄.)a“‹™Éc£ÇÅ¯ˆJPók:æÖOKe‘◊ÃPùßMÁ9*:3ËÔæBÑÜf˝^™D‹E’mçÛû4´¢®,8a(Øz€ÿp#ù mX7”ikKm∂±"15ﬁ"L‰ÌôeÛyQ§úXW≤!8™	éXËû7oÁ›øç’o˛?   ˇˇÏ}Îr‹8ñÊ´¿Ó⁄RÊîï∫Y.YÎK»∫∏eKjIU=ΩnGõ §$Æ2ìŸdJ≤Z•à~Äçò≥±—±O1œS/0˚ãs ê àÄô)_zä?™,&	‚rppÆﬂ©Wˇ∂RÉm9Ö–Êº˙b˜˚Fû'gC ,8ON«Sr?õ…Öö™æ«û?ŒñÿK6˜6ÕÜpLa7Xkqmù˜tû-=Êˇoœ4+gı'˛ƒÚ">1≈¨uMR#GÖIJù‡E˝¿J‘¨&˙‰„(ªT÷£Qî]Ù„‹¢Ëü–ã∂´Õ—«ÿ-]¨ªàñçDÊ/Ó;ô˝˜*ÓFó i†ÈE€ü¸œ\	7¬I±ù¡Ü`-’2πeäo¥q˘„–j¡Æ£ºLD‹?Ê_ /Uò0˝¶x±√éœ)_íAÌÚ·Îs~‚éï( ≤‰äOdä∑ì¨2ËœL@ *[∑bé@Œyo6âù⁄€BòAﬂﬁ|60∂]≈˙]õ≠¢1K7ö5¶.≤È«›ãazÕ)Ó¡"4Úﬁ}[à-s|…π0ío%…Ã¸k†nwua+ÿ∂Q®∫÷˛¥›2)H€]•ë#kª> áÜ*nuöH¯b4f8S∆Ò¯<ÕªÈ(Sô	±≈¯;°‚,∑öRGd≠§ΩTn≤]dÌM“°¶“•e
æÿÚﬂ*]ZÉuÈK.ÖdLmŸ8I¿1@CEï^öQ• œÁ@≈pge‘@˘¨&û—•y´DUn±˙nÑ0Ø¢ÿdÅáa„u÷])∑À¢˛≈¸ÓêaÙ»Â»‚È£úà÷£GUÇ±:√ﬁŸ›∫´'˛◊P$<ò6	k¢&îﬂ€z¨˚¸Ñ∞◊ìákˇeGÉããú^Ú'Ö¯® 7Ñ˜™√¶á–¢y(D4&≈Mp'*åÇ @ÜxµüûÂêÛvÂ+˛Kë≤61PÜ)x¯‹iæmù¶k°ïËm+ß©/åUÆ—Óû‹∫e:ônVerH	•ì‡¸ˇKvÀ:ù¸˚ëXÃuÆ≠ﬁ1·ÃÛƒ—ﬂ~ .S«$.ÅáM◊QKj
-F®Ÿ7ˆXA˚~‘ÙlÎ[¥Ô∫z[¢$1ôèˇ+±ìVK¿[$\Îÿ≤ë;P˜kπ÷∏¿ı…∂¸çB!òÈEvSJë€P¬+kL˛◊ˇı∑ˇ¯˜aÉÜ´û¡Gu˚ó˝k=πFÕÍº∞ÆÑ«‰¨¿ølPÈçµ+1Œ'Åæ∏∂æ≤»6ﬁ≤_ˇˆØli˛8xÎ/¶%ÓÙÂØvß/;w∫¨J[nHy√‹ÎÂÌﬂ6{e≥óUÖæ¯ˇÁ¸oV1MNµ◊óÔıb5?«f_ÏÅÿÏãO≈M+ß4I·à¡‘s∏–ÏGsgÏK!·H≠jø-: *,Èseòæ◊¶á/TjæÄ6ê	´î®ƒË‰T_jÍ °2£–Nåßˆº’ZÜ°´“ ˇ {Æ“åÏCL∞◊DöÄWüBb¯\¡´ß®ëTmI_lòˇ®U™≈äEB„í˛á^ÜT‹Ê:Ç[C»m}’¶ä^ò· ç71©BÀç…1ùIViqfT(;yOî¯’–_∞[ÑÄ¥∑Ûb;Q	íÍÇ°„$˝XÔo“{˛P£(∞ Å[€à{FÍÕc.U∆„˙˙ë°,)>•¢ºE ‘5%D£≥Î≈DÈŒØ™z∆ÕT›iDò≤ÆÁõÛ^ß'¡§Œ«É˛NöãGäg6y`_ÜW©Œ≥∞]iU>Í'#¥I„Uç‚-|èíU6Ñq&Œ40í∂UŒx…ñô z≠A'.¿õπY+*}4F ¥ôû1yúÛ—_yA•Î.»@=ısﬁ—Î«“•†Õ3ˆ&0ZúòZ·èÒÌNùÏ¯©≥ï+A ¸çSˆâÇùﬂlºb«€G«GlÅÌÓ˝Ãˇµ˚À±ç≠üw7∑©rÅ#U9µR-∞9≤?·÷-ä¯wW@%öùõ˛eıÛVPGØ'°—∞î¿'Œ˘ÿØŒﬂlÆ∆{ÖGΩ1:•Q2HÄ¢ÀÚ€HOk	»b°Øø?âZ3Y¯ÆL~∂˚wx´|K!róÛ¬2ìπ‹i:oqònîÎÅo/˚RûdµËq“e¢±#≥	¥ÊíZ”ì∞◊Êy
µM«ÿª”,∞n4é˙È ÆˇÂíüp Ñí8á¸¿àw:/"ó¨Ω˛"Œ5¶œ©M`≠4Q’◊lO‡ˇ“Í5l ˛Ç9Û‘xt9 ˛´®	S¬∏ïZ‹ä¸uIèˆs:˙ö⁄JÉK+ı±–H™9ö™≥∞æ’Ì\* ≤ú2•0k<œ^˛πXYÚ\¨NÎñkcíàﬂ$˘∏5™V8ow˙Òl|^sgSë¶ú¬Zd/ÿ¢=l›ÂÒ;Bú˚Tñmüõ#`Âú´\òÁf¶Ëé˜ J“e¿ÅØ∫∑›»ı†cæc -W  Ìíπ-Ã›öñ∫R`¢_‰∑%√¿W>º+X>¨[='ˆR∆µJy$‰ä4o‚qá·‚…c·$Íñ9ƒ.»˜„˙hz'Öxµc9⁄\ıLâ@iÎ:ãFEãªñó“⁄çÑY°≈÷poﬂl¢Q´#ﬁÂcxƒíﬁG§O€ê\á9]ƒ7œo˘ÎvÆP±^9∞¬˜¨ˆ^;,iY[¨¬Ñiïm¨=±∂í[n’Tê)Úi3ÄÀœ‡2òÇP?è”≥≥~\Â™Wá0Êw–/Cû\G∫vN‘Õé<B5˜˘G1u7ı,5ôî
u—ÏD¸J≠Q€
\ÊOæ°$	°∆u≥¥œYD?∆®o÷2ûwxaZÆm_ì/Ú^¸˘œf:p»É0»ãÃé4ã<
'#—™#Úà!Üß–.]ˆ˘"F"è˚•y¡^Â∑M¯zù√ßù1æ≥R‘‹Ê´ÕπGlÓÕŒ1¸ÔP¸ÔM2JzÏ KènºÍßièKëg|(;QjÊÌC,i8gáÂö˚)Éc¯pﬁ:ä≥À€ÑäO…êﬂÜ{¸wÆ&uì¸Ò√…∆R˛q|ÙŸ`üØAlêmú«CxÅãkúH˛y˛0∫Å?∑7_„Góc»x·'ÿ∆Œ+õ€ˇΩ8ºÉEÚ∫tíºÂû≥ê3'G)·Ø„™í¥⁄ÌN2Ïˆ/{q^~Ÿx¬Ó&íÖ∞ÏáñüY„—U|ëf±3fÍÂÏÜpı€ö3…ÉÒJ•I¬°◊Sq.‚*óŸÒê
n—jÏË&P”‚gó‘R1@ó⁄ôiØv∆Ω»◊à¿qŸ¬_ƒEüeRê–vüé_ˇ˛Øò9˜›úG∞(ﬁ/È—#â8OHª„3Ùp$$t|Âz@˜@ñQ ˛ñ+p=ÆnÁ„t ¶#""6 6d–≥«ÜPÆ6gKÌ¯îŸ_Ÿ˝o0(KÈÛ≥ËDVÎeV,°Ÿh¸ÿNÉcZ+BG4ı”®üF‡i,mvy1w≠€æ`c9'lıO•ï≠≥≈;Àéùwò˚ÏˆıâsTJ««Â∫Üâ¢\:
‹ÉtT‚h¸JÚÀ˘¯
 öÑﬁn¡pDZ¿Âé∂Ä´O=$√2™˛
1XäAŸ`»,ÔáA€€#äÃ¬˛¸–˛ääs∞4Á0˙öN¢'Ï…Œ÷n[ó,ú‹B*ÒòÆ°•?^´	˛ºmæÈÊo‘?¥Ç?eP…Ç57Æ€çÑãÎÉr'⁄ó¿lÑ“g…†’Æ
TvyJµ∆≈]¨˜ [lõ˛ó_ÿª˜Ìé¯≠5Ü>ëgŸÏC¬Iè;–L.‚–ŒΩ)Â?xØ]}qw+‰¢+|†ƒ/…)k©qVlKmr™Ω'\6]IV∑uîˆ(µôÑ]ä‰Ã‚⁄K9ôçªÄ'•Y¨NQ˙OÜ ,’a?Â†∆„°åL
“¨3®(m&ºT:NÖßäã$ô;jÜÂdì,LN•≠âûÊ˚—-¬hëgÿÍ{T∏PÌ¯¿◊o˛õ€ÇæÀ^›Ò€`O#EPqÖ)%pÖ[õä>84∏tÌD?0–|£¶åŒ•$î;Å⁄&ã√/Ø™‡]˝ˆöœáÚ∏[ÂpœΩ{èNºk¥Â1 Àág^E¥]9eÓıÜKì+ƒÓµÜQ™«∞ôó]0÷ﬁ&ñy>NmÂE9«çßB!ßòVøåz∑⁄Üˆi~Íí‹¿ñ~†¸∆	R÷Óy¿≤¢ë;GBe|n¶¯ˇÊ&◊¨^£±öåqq¢4Ç`©Ê0ƒOı¯ruäºãÄ•7ƒx¸ìÁ_◊∂˙tµÂVÂ±Ú%~πk€Jx–ë"ÑhåQîÜÜˇ*˝ÿLs&,±ÕmœO&≥=3}*2B∆ÜW¸…⁄tWáÊJ[	*¿πz∂P-2»Ö”Ö˘î
¶òòô]¯j3Ì“x9TµLá?∆7[Èı–ì= àÎqáãN(§œa%”9ó®ŒXåŸ¸ƒÿäO£À˛ò÷z‡bß1)πﬁ°ÜEå¥*íRP’óg¢<3Iÿ@ãˆ…∏!r©xkNz¯¸)√C„¬ÓVPa0™◊`ëñ˘3+Ó..“§[«MuówóØ!ó2ŸÙ8ıÜ€πOûpsâ5gD>ÍÆÛÍgtîü,Ä7äP¢èc÷⁄ÓqÖ˙ƒÍTc#QÚ°QGî^õ^Áœoó)*ù»∞':?ëMO*oSõÛH£óÓjYXv1•%í)Ÿ5πFù'Âgs+q;¿ë·vıOÑèO•É∏ÒÒ˝QÀÓlËö…ﬂ*IÑ∆‘!◊hÂmFx˙àò˛È ÃÃa†A¯+çLﬂ∞Rïö¢œ&…ﬂ¨µ9IGqZåF˝ŒÊ¬Ωdãágqh9ÎÏh{„pÛvºˇ„ˆ—6éw∑˜é◊äµÙç$ﬂãØe~ò∞qOô«A°Bø&9¶È⁄ú≤ U)!™d’"˚£ö≤QÛR»û9R9&…ﬁ0„T‰¯„ZÃ¥V.„SdsXåÍπBÑ‘2&ıcÆ6˘Í9@ÂX1í0Si6%Ï>ìÑ¿≥ÊïS≈|fIï‡Å„ê–⁄{)l“Ø‹)j∫‘}cˆÕY]^4≥Æç5∞‡Hã}Qäê~ê«Vú_R„W™!…+A9+®Ìjs^¶«g,"è<¯ÚZ&™®ôxk÷4Lb1ÔŒ(ãeóÊÌ!È,ËüCQ/øV≠µ™¶˝≈•≥nyäá—™# U^E0jçÓ¥X4È0®9‘Sc"sØ∆CÀ8=?]ûs˘†,Na≠ÕÂ ”–Åú2a¶IwY°
Ø≤£Lb´?Â±•4äÜ4©#◊í÷‰ANé‡™u@˛r;4ˆ›Ô/„ÏÜJäô©®ÿ¸Ê÷«.–	2∂ô%√C≤J%µ(ú“>¸Nùò$”ÿÃbç…£¿]öÑE—"áµÇ·PKÀlYN—ﬁ®2RJ£†Ì‘>+50¶0X∞§H;äïvÌDàX”≥Ü—Ãﬂ"Ì»`ÿÊø´(ïèˆú-ª¨€ßÒ∏{æwﬁ›‡ﬂ‡†µ‡à”∞ﬁ•f)‘4ﬂÿ0/Êı/»]û3Î 5
Y]xÄ∂eå˝¨Å·[u∏w	!S¯^'ãëÿZ⁄Z8{Q!d‡Prï^ºÖ`íã˙éEà‘∞Á	êbZÄºªó∂q˛äéÒ¶B^. ~ç…¬∆ƒˇÚã£°ÿsà"˙q˜!¯›ﬂØëÔx÷PÕ®€≠#|¬J%áøì•á¢ö–&∆ÂÙÒQ€§àÄ⁄ä§ÃùãÂ¡Úc∞VµÄ‚Ëëò£v€µæ@HùNß5<Ô ◊q=†°a±Ò¡§á∑FWú»ä§ÔCª‡^5∂)ñC51≥Âhrü`m/R‡ˇGôÑr÷ÄBB∂‰+¥ÑÚHS(Kç’3g˜Á’Å¡
π∫TNlb®)Åárûh:ÿâe†·Añûeqûc“¸∑úıDc.¬æÂw¢≥ÿ¢‹∂ ¨x9[í)Ø∫˚&Ep$êvX≠∞jÙ•I<ÆÃk><óf1A§>£tè = \ª†CƒÍe,ÑAMéV[r,ƒºQî°â@7ó¯/£dX¶é»°áTRµ8Hdçû"¶HêÁSnodÛë·S“c£Ù¿!√V⁄Éå˛JdÍÈ2`É1I€Â.í5õõì(C_m’Õb%òÓ¡˙≤V`ä.ÎªÓ,„„·À:?NÁ3\”
o∫J¢˘qıÒ˛H„J|˙∫JX£À~W:Á 3∑´Øz≥];™Åõ∆`Û ©tØûéŸ—YãzIìπ$Ω†Õn/Û#:¡›H¸!R≤K6«Çq*Ω(oÆlíÏ!‘ˆ·1	õÀeΩò˙≥X!˝°=X-∏d#Yq>?|!“ç•Q¥4õ~À3Ωˆ‘nÙÆ©t©¨,c'|Y Æ6_“«l5®i5"Ò> ôq¿
ÚuR`, çÆ≥UJ÷”jµ˙‰%ƒYÿ±Û9ƒ¨|Ô≥X˛Û•Øìg1òõºèqâ™xÜ˝‚˘rísëü?~í¶∞x§U"ΩÃ∫ûYº{˜û/¸ª˜Œ%Œ9ìŸÂG;í;ä«œDì/Zi,,∞•é®Ñ#jr6 Jÿ1©1ü&Yn7ô:uömG›s∏Î≥F<Äg¯kMÒhRüK ŸD©◊ï˜Âñrøœ_ŸK˘Î’FîäÔ~7…èKì¬•ÄkMjjyıÆn5(5z˘Ñ°–µ›ÚiΩã˙}Nn@%S(¶û…ﬂ?˘ÔvEZŒÂ®æ≥_C#•∫(˙?ª6}ky†Y`\/≠™8ˇEi„¸¨¨}EFÄgúŸl˝†∫u†øÀ=›âzº3¡cdvﬂ]ÊÁ-óç@c˚¸#v$ã ìÇÔÀy√Y“`!+Ò·õ[ﬁ‰›ò>ÛûÎCÚ‘Xg⁄˛Ù>/**·+¯OˇxÜ»7ﬂŒ¡c°jˆÀŒÅVPÛ‘\oä„e]Lã8óﬁ¥_v^„mx›¯·(˛ËjéCµ∂6ŒbKC¸Óπ‘·ûSÎΩ∑ÆÁ‘A5ßKäåÜ¶ñn«)µ¨N©~
0ú€o.d˜L,JK#Ô°4¬#i4’Åd·U.∑Ç⁄‹ÁQnŸ‹Â˜=ú¨~$πåäıïs$ùÖle}ám`˚Óm∫u-˚ˆû7-Ï99üfœÆ®=ª˜√¶20πwÌΩ2J∆êLaüÒ∞xˇˇT¨°˙˛∆xÁ˛S∞á≥òè8O˚WqoØ†+¯IÃÄ"ŒGíP⁄◊u"Q (À∆K*˜É∏IÂ≈OÃõ°eú]Ü1%Ã…-˜	ò
ê`ÖN¬`!º∞ ı ≠'$ƒj		·ÃUµ¬• oà‹:Ç
$D 	k  ıa:Ë∆ìi˚«Ùíu—ÑπáÇ≥W˝hx!*Ë&C∂ìfÉá%∫ÍuñŸçï‚±*»<y7C£kÆ:]TÆ≠ùö$YT*ÔC™Œ‚#∂º*!Xì ¯UAAdüûW18	¿9¯º’N¡ƒ%¨ÑS∑⁄x4)8„jU/VòaPà≥,Ω5áù.Äººƒ<KUí=‡l‹ß…1(‹π˛:Ù´ÖDMGt-Ëq`ƒ˛;3`π≠R˜„ä{√èRa7∆ØY
õ∞‰e4û™(ç–/EDºW-çÔÊ·ãﬂU÷(ä¡x`GsÆ4∏∏∫“Á∫,‹;ﬁÏS˚⁄jBÔíV°”=è≤çqkåc?¡*
âÀë‡üIGÄMD«L¡V<P’¿}ÿÅ»}ÊµËRΩúè®Ä¸aŒ˜,†'B –Å^ÒF“Éµ±Lx∆5'•ö≤¶cﬁı"–Ñçÿ≈ë…PÊÄ){*≥TÉ,ÊI÷ú&Á…ÿ¬6f≤çëiu©¡+ \#Æë,É;Á«Ê	õœi7x}ã∫<µé∫ÑÎ^ø$QÅ¬T‡ËºÚÓ∫˛c(>éxEËTeÉø˛ÌˇV~i÷ÑMYö‚∑Ôÿ≥<π«J®’bÄ≈f,ø"‘´ŸúÉûh ˘ª+-„¨î^}0"p≈ÆPé≤t	Ï70à'ƒ—êÜ]-9≥åä}Ó9§núñ◊Tè Q‚∆†ß¨TP.§∞
˚Ô"à£sÆ™	õèÉ*‹`G¢≤€wÏPG°ıófãÄ·<e>∞†ê‘˘„¯ÔåOüS˝L‰eGbÏ,íú‘nÕ≈©§Ò]À%EÅƒJ∫ùëÅgd;ìÎÉÙEKññ°:“ıB,!@¡ô[Tñå`ˆﬂ±ä°c°0u(#ò<|≈ÔcÕßOºt/º5Ìrπ.m:û
¨û"_s3v„>9’’ª◊©|˚”õ„›É7€ú¡€ç„Õ∂è$Ù¡—ˆõÌM([Y/Tô‰o/˚„D.KÂ¿å”°{Ÿs60_‹¡_<ÅaU¸_>YmMPá¸M·◊†Ë›?*g⁄~u.˝Ë”Ø;9IàVKªv/iËÎ;—¯<ŒÙ&ƒù?ü_Ê'êUÿZÍ+=1M˜é6‰$·tîÅj
˘€|îˆ˚¢≥ˆﬂ∞µü ÔV¨·Svç5C#ÃºÍlê3Äı»åï≤`™9ÉFÃ∞÷ÏqBhÑ[óß#ÑZk©mMÇn»pm∆Ûqîçk“Ñl\Ö`cÆ}¡m6ΩW‰çΩ£S[ƒ”‹8 ü£¸IÿQÓ	œã≠w©∫F!#:ÑB˝‡Î/‡òœjF‚"âH@gJ#))¨„È3‚º´ëÔ ÿ8 JàcÄî‚ÌÄ¯[Ûñ‘Áôf®6lr6$ê™Ú{Küw
.´:#‰4∏≤]hj°aCÙ<èçª«z√qú÷DÍ¶√≥Z´bKíä5pm1iWK0xhô8ëã˝êOˆÅö¬)‰o\YÙly∆∂“Óà6:èN	qË⁄L[Boü'¸ü‚‘1ÿ¬µÜu:Ï†Y
Á•ú€eÌc9¯r¿Äæœœg2)NütX¢gì¬'¥NGCÙﬁY¬´Ì⁄%—@åµOâ Ç„µ	7˚PÍ;à©àﬂ‚G≥B˛…â31)¯Â‘≤QßI¬äJ«∫Çï†¿a∫ÑPàmËÀµıü=òD.BŒvøNnä}>Ñ∏=ˆˆwèÿ©ê˘·Nß”q¬K∫T ¿ﬂ=µΩ#Ì¥&,?≠Tﬁ)0<œ*’÷úÄ¬Ó|‰%:ôà5!äÒXWôö—O7C≠J‡LAÊXY•,+Â‡s%åyÕR€jÊ◊øˇqn4ö±ü'ÑÄf√÷)-6§∏VHÂRì‚‚©®le,`CÜ •[√Q^ÈiÄxf™›™Fqkeë√Ã—ÕéÓ±ÇÀŒ≥	DH_’ÅïäÂÍ™M±d‘<8Í`€:¥Ê8£‘§zàô-ºL∆ûT#ÃT§cYõ®()πâ¥W/·-ƒﬁ„ÏÛû0Uƒ+i˘Çá˘ƒ'ﬁVà[[tÛ6’aŒ?Üm…zg”q["j	yû∑6ˇÕ≠l≥¥^y„∂-˜çè£˙â"(5Ñ„’πZ$◊3ﬁÑ(øÈBkÄ=©–•¨7ı˚∫Ú&öí7∏^G˚QÄÀxÖ°Òd+fÒÍmÚ”`0\gW—ë2J<…Az∆’˘s®¶h´úQ“ ∆Ÿµ¬*¬ÜfâSZÇ8••	Ç–>GŸ¥°gO'=≥Ì/µ4cQºÔæblû¥–u’ùÀ5ˇ[i5i18ÍL€≠vÎù?:ÿdÖìF†˘f—}F÷QwÑÊg>KÎlØ‘4é0ÊB‘lw0 €gga'î-ü?ÆQ´Ç12Çg·f[P_d—˘„âˆæ‹¶—2Á∂Ñˇ‚+◊S^|—k#Êßπgº~ñS¥)ÇxB⁄\·l4É¨ô[…8U¬‰:t9ÃôT·
‡€zyΩÃùxƒÑ◊m·È"“cæeG±ΩFñˆ—tc£/€¬Qü4‡©öKr
rë∑j	≤–P&tØ5*›ˆL∏_´t†|N8∫nm‰/lÛX—/ê2√ñÕpHO¥ré4°ÄÈ=ZÿáêïÖ˝¬üÇË›ù€ÿØuq3Th5*˝ﬁÚﬂâ»ú—+£4QÑ\ Ì˙ÖÒñµnΩdæ©›≈òœXìÙÆ|ºıç~ÁÆ-ü˚r8‚ :◊Cx¿∂ôåo Ó#∫äí>T_Ú@mÂd⁄¬Ac+GÑ[MUéä+^B}çí!…[JÎDúPÇ¥FsŸÂ∞Òa"6a–{XÓ0bäfî—B/ì–I(H$†∫±tëΩB#e]∏P.h5$ÊLëÎ¸ÍOTôÀ˙’ufç‹)K$5âG&2òÍïí=wXß#éSWQÚnÑüWÀ]Hé—©}{J+’\ÒûÕÆJßË˛aﬂæù"Nö¸©›Æ[=k∆l“$ÓâûYPtÄ—éå¶éÒö¨Ï=Œ7+Æ˝⁄ I«˛8e)ÑcBCÄs.R’πPIPæN≥§‡zZ2	:¯≈∏ÓeÔíéäÏè‡¶3öπÚ≠kÉAª oÄ{ø©gﬁyÀ∏QOëc ˇÄΩ˙pwã˝ºª˝˛ü£›c∂µqº-y˜mqºØ≥§˜s¬G-h)Õ*¡ºg¸WıÉb„=Gîo.kÙåÌxiI~ƒWO∂§ƒ>≤J@§Y¿P¶j”+NG∞ÊN|´≥ÁdãS–æ¯±eoÀl*…8Ä—ÎœÛ9çEÇÉ√›Ω„πôE∂⁄™√y-¢U≈!Ìæ¿)√ZÖà»wì¬ &h3éU2•˝Ó4Õ¶øe`Ì‡¢\o?å‘·IU!39˛7uqJ≠˝K6ÁÜ(^®ƒàPÃW$Ìo◊√˜‚˘4Éx€ƒπ˚p◊((6LÄåä≈)ZXrƒ√ä'ñ)Â˝∂ú©g¯˛¶•åMò·SıÏ vì>˘Fôæ üoPkﬁ&[iµßE|ÎI≈XÈée’ÊbNÁ»z ™–H˛ä$b˝

ä7ÎÍ	^À∑f\êºêéÂÖº_‹ñg√K3ì¬ [Kck›⁄ü®ãçb‹)÷nœT–°OŸ∆Åäbqæw≈)÷6ËÙ≤Õ} : »Ÿ∏PëGPé3¢Ω¸º–ΩX?§4åsXπç≤y¢≈¸8Û)´¸ÏG“…]Â”Ë*6^≈eß‰,≈sÖœÇ¸k5ƒ .ü•ΩM∑Rò*¬¢Jve¸ƒ^ò Dc∑ßÖ>˜‘÷p’Äw‡’S)bFjl€Z]îV≥..∂`m\ÇÍÏQ’…ÜOÖGÇæ&Zò4¥>â%IV%âZiêzTË«~=æ√^°¶†Â¢@MÖn·~pæ-\"«ò+˛G RñxEÑWÒwzpÄ«ÊÊÁ¯!öJ≠•˙—"“Èﬂœ0ƒ*bÓÊZo¯Õ\'∂∂‹]Ï◊ø˝OÒ^~3çSÙkeë¥≥>[˝¶ﬂâ]ãæo·ÄBû≤ dÒ\r(H1!å≤‰~ó¡ãOkÅé£å
wq)Y9¬jcé∞Q¯!ƒ:…™¨%¨;ºóbÿm'ß®ˇ‰ KW¡(Ä$6º°∂Í| iLëù›|Î¡¿ä„ÌœSwcx8S≠·¬ÅB∏b≠K Q¡VBãÊX^ÂZ8çÔ/ï≤ÈÒ‰UTãÜ|∫hâzR<cNÉYäK(™*ÍNk≠ƒlK¥T9 à¿ÃÚ80L{´5=∏ºh¢qX∂	n≤®≈D'√˘k´ÅónfrÏØÜR]Ã˛Tl5èõ. ®<áf˛cfZp_≈Å_ …ø◊jïŸΩí´~È«®o(3rj;I54úLπl}—7∫D‡Ó•~U¥s9DÆ⁄ÃŒô»[è+ŸüÅ„©ˆƒG÷Œ!˘}œ¡úGÖÈ8÷hdt”æ#clßqÃUßÄmÊLóq≥ó.]Ω~<,∫5-qo”d´|ûïärrœ{m‡ê´·>âÉœbÌ46Œ[≠∂°=†yÆr†jèó7¥áŒfÛƒTG¨Î]´ÒXøn5·∫}EÂ}Óˇ&ªãx˛› { ¸™Æ0î∂∆?X\Õê∏H+U∞ó= ı¸ÿFﬁe‰Y·≥Q÷µñÎB€J=ƒŸç1«¨√Ry3+‚c6”·iíåπÂqO&◊?>ŒÀÿñFq+=)à7ã[!ò¢[ﬂ®Û=ké®±¶ﬂµ8≥‘e≤∆¢≈“)V∂'Ó≠Ÿî´˛\≤q"mé‰GV7ûOé~#>),-⁄í◊vcvX√j»l«@,Œµ∞qÄ'Í~Üa„›·NÜ…É)M¨cd≈<FVloÌ≥√ÌM@L+ê”¯ÕÕç7p{ˇpÎ®cqwUDA^≈J+:1•œ]˙HVÀT˛ØŸj∏V¿ı•aXƒ<ëëÄ\µ|u˛ﬁreı¸{˝dËWú
"	´q`í≈ZPçÄ9ï3ﬁ‚äØd?:¡©äÙ≈ö™∏c7Ñí˛u¬ﬂg˜üR>v8îÈ:∑sT\Üœñ"xúøÛ?'PTB¡BlSÙ-∫—Ÿ[.'Ì±ç ~ÎJlei™ìæ\≥KTñ«ÜÖª¶¥Ñ¯OƒX“^=M¨]›€/u‰êæ∞hX"ü\·â°◊JÅ§y8?¯O|¡ä:+1kî≈y7K–Œ˝àı£Üö"ão–\/GIJq·Y !EWê˚Ù”].ﬂäà
[%´A†Åö0;»SÎâw˙Iç,ì&‡Ñ2%xº5@ÄÑ∏X%!.™z%ü=ﬁTD@’èˇ˝„?jR¡]ãªkVÃ]u?‰|ò}Ä™ˆéÒ“'î3ùÏ&V>äqÒk[†¥’˜ˆ‘ù>„¿]{vå8*ÜæP;ºbØdi’#•‚ÿSaZé¯çí-[º¿®‡:ºlÅYë¬ØN*Î±ThÎeA	ª?‘vpqVòÄ∏óª›‘ÃbBõ“Jg5|E‘ö∏L®.‘[mB˜á˝è∑Ì√éÇâ9M≥uÆ#Î¢¢ÿ™ãt«ZﬂÎv◊˛‡Òâ}P(C¸ÃW‚â√ˇÈM÷∏ál"uJZ'≤ı¿>¡N€Æ∂ÓÉ˛¸íÅÓXÈr›
†Eâ0]3ë"$˝Æ6@Â.Ø	Ë	√9A‘‘rN≠0√GÇ®»π¯ìW,pƒ≈0˜àO¯CﬂÒÖ·ìNqt"ü±πKY•
“WÄóuÏ ∂O#Û˘±˘t>ŸU±"PÜB·+¬Ø4-8ÄëjëWáÊÀa!WÆ†´ îΩQ~≠’GETïû}0ü&IŸß®	N±+:8&éÏÙT∂B>ä∂Ü«k5©–˘…ß™xÂ£=˝ ø7ÆãÂí -ãíY?ÂîCÛ◊Ç¢û’x±Ê,J!`©0rØ{qÉ€àvÁ=géSd|^≥>X%DÃ◊/cœû-åœg’™VÙ[Ñ¥òe„Grß≥∂ïDg√4OÚY∂ˇÜÎ©Ω´§;”^ã ·°¯ŒÆaëÔ·ãÙV∏ZÁø¥oq"¶¸:≠W|À&=Æ‚0˘k5éµ™JÁU‘2‘ÃKøe—µÆlØ≥ñ†ﬂ_XY)YV˙mø{Ø™s_	Œ£ÊnÈe∏ÂD5n∏ÿQö’>œzqŒˇî.@á∂qÒ©¬=|êÔÇÚIœπà3î@Ì+b∆∑ﬂw‡…V+zƒNº	„¢iËŸf˙eyºŸè£aë6◊ö+˛98ãóà¢Nq<s=˝«V§ 6ã–XàZuŒ÷˚*¨'¸3'T‡«÷I”>@51P”˚‚™óìƒg;˝R√7”Ô~,Zr'«{Á#È¡ä»°Ôn…˘Â£ú}®‚˛íÌ!zxKª«Ivëx—?„IÔUÌ'ÖÀNö}AN|bÜB?KVÀÜ´è°ñy√ù˝ﬁ—",4!ÍÛëWÖv7¿÷GÕ‡ÕõäÒ3«∏g0~™L)e#u4fíè¢æ›U)ú÷Uªû/{•ÁÀ√pP‚ã˚\∂'dnäô+·W[ <ˆEê›<S¬K{yåo`†Po˚(C⁄gÇ/‹xÂ€≈à6ç¿˙¥DKW Ü÷ß⁄∑˜ÂÀX®∫ÅÆÄåÆÙT¸QÂSW`éÿ˚as˛õ€+ª)¿w<pñzDWñzDXÑ)§•+Œ´üx©ˇ’…G˝d‹ö;ûkø[|_WÎ ¬Czsﬂæ¿ºB∫¯Hò»Æd ‹àk“Ê∂Uô/g√∞·GæΩ¨|P•¨Œyî„À˛∑ôAîù®◊√W›√VÊoõﬂÖ;˛wæ—]ÊÁú?¯^tG¯0’Ô∞b|≠}á)ÉæáLŸó7ÚâélÄòYÔŸÁÛZÁ´ú›ôX ì^≥S»OB≥wäçŒXZ£JàŸ€Òp£Äòâz¡µ6∆¶˚ˆïΩÓ[=_π5ß›∞q/˝yd6¡C ?ñ_ûSzi°îﬂ∫Í‘~Cv™lV∂N©ﬂˆHqz’)ì·W8| O¯∏'õH\PyÆBteA9 R¯é˚}Dù¶Ö¸„TØ„‰:[pºÓíœ\«Ç*k©Ä˜ª9p–∫8ÕIÍë'∞˛—(>ø}rg∆Œ“eX2é˙I7 ãc/≠	ÿ™He∂Ø…Ú ?®PÖVê≈^Ä!JâW
ÊÓl·ïŸXvÌ	Áú∫àÅ&πö5ô°K´mëLxıà%ÅFÅ{ên?¸º{…Äw¶8ÙÚõ@Á⁄Å”‡Pò¡i ˇl¬{Ô[ ﬁ[ÿ>úÓÒT:L/«	◊75î≤ê~ı£ìçﬁÙÌMtrÃïJal’˙Uπè#ÊËú´e0!t˚…p'Üê÷≠ﬂõ¸7à√†1ﬁiiáf_√|ø≈T√;‚∑∞Ü∫Q÷#{(~√ÜÏøÊç:ùéËOiFÚ4dT“,é°` sùTê¬„Aî]†ÌU˚Iª;Á\Va«¡∆}öäÃí¯≥≤g›ÉãÖ_l£É•eZä Ü0á§®?Âˇ‘˙SÔªˆB˚øbCZªNPp˚›“{˛ê[¡PUã„J_N≠}≤u·ªP#Ω”&]Ë*öR]∏∞OÃ÷Ö1&—^u¡o˚<≈F’$Wåıª‚ìﬂI*∞rÍYÒxƒCóÄ≈π’g»nœiFñ<“f«√πZ‡E¯†ñıT#¡CÄ¯FOÌz©Â[,â™…êLV3"˘ssÆq±#˝4…0ª√q*Íõ•Ÿ D<dùë"Ó`∏PÆ¨∫∫Ã¢ñ 2t•ä»®a
k_Hkë_2≥}3ﬁö›Mñº@4
¿]∆a@Ôû8e+î8FÔn≠≥[M@
ñüdÆò/˝niMÑì‹Ê'ú˛zìèÀè.≥Q_+§"ñoÖ1È'õ–fÕB∆Ï§√”]¥~"FÅ©+4L]Õ0¶’’kZ]>Œ“ä^Z]F&^⁄X1” dU,âãﬂì` F1§J†Ê˜%åd–©æïpZ‹úJ∑Dß‚UÊœÀÓ˝<.„Ëëá+◊ŸØu∞CAÎ≠,‡Ü+üªOEõ¸M‰ñüÉ@{úFMïì ¡SØˆèè˜ﬂñ±Ï’d5ëœ∂≥¯∂Y{Å√7Y˚„–8vgº:]vòéT∑úr≈óìıá&	<v4é«ÁiﬁMGtyHA-Á≤ö∂ƒ∂Dårw√QNAsj8Ä⁄·këvK0NG'UÀDa√‘™ïÊ	´˜NºH•5+ﬁk’Bµ≠„õéìö‡?¸óúPoΩ¸sÛ"l€B+ÊÁù¨ZAî©†På®ÍåûN.;≥5Ë<?˘´Tmë$Ä'ïç78Åù*⁄˝∫M~‹Åõ(.UFª∫ÙéjÒª!Ó~·Ê™ı∫%®]ÈSÄGXj¿h·≤˙õD£4ÿ6{k)~“çõ3)Î1A(3%|Øi(˛¯Ê	„ˇãôıw˝Hê‚™‡A~`©]7≤⁄U§™ˇËEBußøÌr,1Ó£∏ÏËèÍ}
R˝ÓBP˙ÑLEÉeı3W¶\B}£∫Ky“πNa¥oƒu‘n,#S‡˙≤˜ùmÁ≠+Codì3=ùî„[VÉ/àè∂ûA„QG¥£.ΩŒüﬂÆ–[…c°ÁW'æö≥∆	¥i'¡Z·§85!NL~ª—?JÓˆ–⁄◊!Jï*√¢–e	˘ Ë•SE©À.H´Ujï}]=ûàiZ⁄˘§ÏÛ^©÷œ@??ÒA68ceJÃóMu«ÒDÙVi·?•9~≤˛JÆ«¯LÚ9Ç£t'Êˇk¸xÿfØR∫v1	Ù#+Öò®úµlô“:ÂB'∞Ì8Wzsπ»Ñµ™n¨rco¶…0ßRvŸ¸R”“≈Ù¬:t_∞¡¨¶ºrvä¢‡´ãf—p´]	 >íÖ¬5ob∫còß∑.êR[“„çº≈5±ÿfﬂ±ÍSf†	∏–≠OÇ„ü˛|ÚÂØ˜RX’+ ÂÕ‡ıX¢çp≠w—Ω| …Œ”…VSﬁuB°üß@÷;Ω˙œ´ M1$3]\ÿ†9=8º‰dòt›œ¢èo0òÛ˘Ì™€m|VOD=∫ø”–hVƒæÒI7Õfù,∆^∑˛¥µpˆsVä`≈UØˇO…ñ!¥x˚û˜=û√âèÎ<eIØäB“:nø%#_CÃ÷"hIÁÜda…pË¿púı>ñyw/ÜB˝∂kÀ≥·k€©≤€øÌŒƒ›âQÇøÌŒR6˚⁄vßÏˆoªÛqwÓl±∂1˝∂E- ⁄W∑U´›ˇmÀNπeˇHW&y ƒ±jåˆ±Œ4\¶T;VÛp,≈ßt^¿%ëãÊ˚é’ß˚ﬁcà”Í<ﬂá)Œe]p"éúS7%YLm„≤∆è=0Ãmu;H˙} ËV˘¸˜^{õàsÆ§è€¯åËí=}Ê≤5 ‚+¯∞ã‡ﬂèÿ-KzÎ*1SﬂÜÈu´›~ƒrê0èêq¸àı“<:√≥ª˜°vw=ˆ◊®eQ+pa¿≤πCÖµ†`µÃ°ÚŸAˇ“4ÂM–FØ«”k?•AQÓfµˇ·Ä¿}+O¬yä´j´B:0”aA:ÿ-üIEÄ†9ºÖNÇP#úS∆ËÑ¬Ó˙ ˛˘•®p9™ëºSH<8D}§¯4x\"è?åﬂÕ ‡ˇb±˘Ç©ƒÂÉﬁ†J·KŒ7 ˛~´Ú	ËÃ[g¢ˆ.o"ÅA gRìêtÁB!#ILN¢H¯SÕùÁ^RÁˇrhMpÁT*SgœΩ—◊ı¸Ú⁄d‘U Œ3¶,÷
øá	L[jñ¥‘H‘¿5V ;.˘ÅXdW§∫™≈ƒTgik5≠ {kÆ–8q§{gQ~æLíûc •ô¶®)=qSƒpó”z7·õl¢ƒc"µÂÑsáùü˚¬Ï„g“V€°™ä\∞}ø"UEtˇKQT‘ÃóZ
ﬁ˘ME˘ÚTçp¶RP Å‡7˝Ñ∫>ì‰h„
_ôvÇå„7’‰ì¿>ßb‚"¨{÷Jtû˚Î$‰‚˛¶ëXØ/J#˘dâG[)Ÿe
kÅÌ•„ÿüq‰ÊÆ!|uÇå#Ÿ…	Úå‰õü0ªHãÅß"È'À
˛¡Û`πUπÁ-YOÜÃcXtY•–S∏ﬁZe–[bp%ºRnEπUáEBï)m—U|tŸÌ∆yN±sª˙¨ªv=⁄•˝8Í&k_‹<èªõI÷Ì«úı°6T<ıãeÁîÕngÁ(çÊØ8@f>y˝8ã…#ÁN}=x‚pÑ3ö∂6 {0ÕdöX∑oﬁF1ªI/3~>@rŒ¯¸_≈Z\	Ú¢Z~«Ç∏¿î´<MÜI~nØë81Dâ‹‡ÚîÀ4ãpâa>¡k˙jª¶›Â1ÿ]ñK∏íJï¬Út1é„xÁN336®Qh£ÜÕhÿç˚ñ„D	Q˜7ü¸Óıc ±ù,h•Ì&òNTû‘åXﬂ/∫ üU'R∆˚õa÷,.íN2·œpO’ô¡éd·X}“–2üsÕ†@¿í≠K¶ùaı 	Î¬ïYZ÷ïÑ⁄!']9‰} ⁄6≈‚Uò®gÕ˚î0Gﬁ®¸Ÿ.†ΩAﬁ;zªqx,–Ωv˜∂Ÿõ˝Õç„˝Cˆvk„;ÿ?¯È `æTŸjˆÛÓ—Ó±&ﬁéÆé∏ê=~ìv#ÆQú∞zv’8xÚëÎÓ…ês“y¥âkÏO¯ﬂ|y{Y:Ç≠õ°G:>‰üöË˘WLﬂÑy]?Oz=ﬁáƒ@"ï)¢ZÊT%– ·_R'(R¯Ïâ°K´¶ò+åΩÔû.^ùø/æ¢{∆AE»„?ƒQ/@◊do≥∑Íî)YW¶ïèˇ,ãzÄˆ2?NÁ3v 7∑fNπJ"ÖˇÖeqSÌ∑róz≈s«n5$õÔ_œØÒÕ∂¶+_Ü·‚¬≤Ω0ıc˛”c[ÌoÉö2∞Ì◊)˚qN ï%X¢¢º—%?∆¨¨ÅR‚(ùÔ|•.˜tÆHœÈL¥6ﬁ‚Í/pìæ5&∑ª≥8π¿„À+aû∏^mf•ÆXjÖ1–‡
]¥Ù-W”≠W¢.Ï:Á|\Óã·¸YŸŒsBwÄÿ≠XÔè(;M≤+ÛÉ%¶¨ı„≤ p—C(Î(aA¯•ú»‡X)¢7π˛ ›£Í>S≠ùMnF†E
∑@Q©Ï	)⁄ıü«Us§&5òÈi;÷òH!}‡kK
◊g◊øˇ[m˙l:eàŸK9O‚+âAÙyçˇßoÂãÚËà∂~bÒÚV .K)€aPJ–^mΩhÑ9‡µé ‹Ä ΩLÍ˙éy¥îâ¶‰5/l∂"†
“,uï>‘6Ó=∞≈≤€wîÔ‘ LtÔo9çç?·k[1_˛°$‘Ù#òãiù\Dƒ‹XÓÑ√ñ~tE€…M(å™°ºz~Z©≠ Â©É◊&c›B:Ñ}}
(ów…ÔQÚÒa1D>∞÷\Wû,sÑΩÇåÇ≥åùΩZ†6‡‰öBö¶ƒë\öœŸGâœr§§£@@lÃ≥`Ù˚u[„µe%mäÍ-U¨Õ€±∂	ÕéÂ1ã.uòsQl óêD˚„>èT•tVıêpa/˚œFøÀ
<5˘6DVóËáJ¢Qe√≥Ì#ÕY:L/∞eî≤S0Â€JÚòøˇ‹ˆ§TîOq∂e1ÔPrU7‡√≤⁄Û—Iûˆ/9°ı„”1ﬂç„TH
 Ê]+•ªê˛)Ì∫ˆπ≠\÷
h∑≤!≈HÏ|&8Úß∆ÀD´¶Kõ
ø±º. 'Gg-≤ò&¨C{«´Å]>_9ÌF˝˘ßÍ∏Ü*FX“tÌŸΩ“ µ™£”ŸSvdÀ2í@í!›„éÈ	â‰ÒZr°Á®£äY˜H·Ÿ8£jõ– q)ı÷‘={ß)õJ]’ïì‰8Ò-£j»G	J≈Mw0ºâs”ﬁô5pü∆QJC5à«M5àÍ I;[y+°r⁄´hvÜíA®4P°π∑Ô¨KvÀêãÛÛ}'ÊÑ†{˝ÀπG1|Õ˜3ø
˜Áÿ›#œ˚õÈÂﬂ@Ï¯<K£q•â.¸–ƒÎ‹Àºççn“´¥êÛÈä∫!mºISæoS<µ*mÙí(ÀŒ„(†ëΩËíÇº#?ß¨pQiËJ›Ù7t%CﬁÃ€Àº€è+çå¯/ÏO9ˇÜó˙ÀIq◊ﬂ¬Føgg7ï˜#yœZ.ÔΩàGgéì RˇŒd®≈¡É*oÆ#;`?Ñ<e|Aï‚Æ}Ñ˙
ª4ÿµ+R◊yËV+AŸ"≠ìŒ0Z«	·®.Ï&ÍU	HÀ•ö∂SØπ“\UÅ´π„!•ó»Cæπfó–N »4CıXÆFV8î˙3tE+GÓ¨4nC:l‘≤j]ÊªÈ“∑PÍhïâo‚öΩI¯¶∞‚Y√˝¿Â8CLé#”ÕzÇπ|îv≠¡ez’âékVŒU’!ñ≥E˙-√¨3ÍÇNÑ•Cág©æ’·~uæ»7âı&Z â¢zGÛÒÒø\∆ŸçÖe1
Õè≥d‡*Ω'óßOÄÜm £†ú"Ã>´.ûﬂ†(†®4-J˛∂´›ówE=6ÙVK≤ô∞±n:â∆gE2‘…⁄Í•πhjs3∑E{`… ëOV'v˚óΩ8á>‹Ö°[n√ ™∑€Eyx€˘>˙ )Øxbá\Ø»«*]î-!W˚XﬁØv≤ºœgÕºÌ*”'˜ü´Zü]õÊ›Ü"kyìÚ`nˇπ°rîjÂ;∆"XÖX˜√§5ËWhŸ2”•$C`Vë%'ùÓxÎ‰õüçgŒî_N√+
Êà2xCñ9v93V9+69=ã¸‰Ï±!k¸LlÒé"C¨'âPÌ@–˘€$Âyãûª<«îÀA78Œ?©†˝˘—£d¡vÆZ,˘‡#2;_z=(à*%
Ÿ	/ˆÄ{J©≥ˇE˚N”LEÂk èÛªıöﬁ`AqÃô[éÃæ”Òy\|ã.GPUôÛ”,Ãì…*,©¬í!{uŸø`?·c|ù∏{ÁL¥£»œN|j)˙C„E@r<ò€ö Ò⁄¥NököˆYÆ!
—„&∑Â¶Òú •^írcç‘c?zW>Ü∂edy6èáñqún,≠™Ω≥i»L™=Ó◊êRı∑’#($Ò◊´ñö9À´¡√cœ∏nÙ ó»2Œi2bqñ‰	Îù†¿È)9£^v\èµ}Z≥‡à˚À≤XKΩTãwz∑dí{1úiÈ«_<Ö∂iíògRÉx¸›sVÇ§B⁄˚q‘Î∏o?∆æÙTè~Zè’1•¢3»Ù2âÎEæôo£™7‹§Ï8êÃ®∫J˚Ûñd†R	9ﬂ–pGCF·Éùb~∂óIm£±V) a ]¿ûÍÉ#EE±U8UΩQaÍ2páî±yí¸„`êÆë∞V9~∆ÄD8ë…∏6Û›aŒÖCˆÛ§y» ÆÚZ√£H≥1\û-5‡3a}ùQ.≈;‡	üëÍ<a\Í¢âÆAû‡WBn∂h¶œGm™73"∂I‘Ì¿4`™õ¬k2Ë‚Î:¨Õá“‹%‚èD7ládÊ	nITKÎ°2r=oúCOO√˛ç†ƒÇãÃÂÄ;SÇŒü§Õ‹p"∆˝Û'î®dYm†Ã¿6<âO-Ï¢QZq”§í-åZ‡ÀíÊ¶’64ª$<5äyÔˇ∏Ω«vèé~⁄ñŸ†"3TÀ MÚ˝QÔ8Ωàáü-˚S¶}NõÈÈIÏuB$Ér¶/#‡ålNG‚ß±ªÁvB'—'@¢è›ô}ı‘ú@ïis4Gµ‰n∞ÖËxtæ(∂wÃws<Æû@ÙiÏù.ë“
ÇjÅ=uM5!†ÔÊ˘e,∂l´´%8yòáôH‰OTgÒÓpÄﬂäû∞◊Òê∑Çlh+Œ/¨=˚"2wÎ&àâ#˚ÆiO™®Mµ˘¨eN¡Æü˝s˝6Àlî›UGUˆ¬«5rëç«ú@ŒŒ ;v˚cŸLg	]Âl/æ.˛ÙáÜ‡61`¢ñt6Ä1ä˜å÷Ç¥ÉF◊öãÂ∞ÏÍÉ%Q.1§n©◊…®$"j\ÈÑH“(:BH∂/Õ4Ωnà7jùÕVüZÔS{åì-∫…∆[
˙(b⁄$eX∏ô=qè=åØˇÏTß]Îü&d°w€Iì&†›?e<˚âk´“ìù#î«Ôd\¥Œj„3Nk‚ºö1≈‰v—h‰¿Ÿ"∂,àâ k™™¥Ô àÄ◊ Ÿˆ†:®ü÷®pÇŸ„*·Íú¶·¯Ù≤\≥KÁ^Æ!ﬁï¬,ë“QNE¯l⁄éƒ˝≠m∂ƒO√ﬁ=:ﬁ›{]Ä·ÏÏæµúÅ∑NV∂*Ù!≠ze≤\
#@æëÀ«Â”ª~b√Ÿ{ŒR]˛Rﬂ˚Â&ôTﬁ9MÜΩ÷±f;Í[8⁄w	oÆ/‹€Y(ÓÈ"*Åç
≈-ÈYB]§vk:J›v˙¶q™˙.§#U’ä$aÖ `s˙a'\•_cYóüm7Pï=£›≠uë∫˝7>~ß´“¢^° gœÏy∫ ˘ı-ß˜óäæU<SΩœÓHá†LVQ˜ c⁄Ô	Ω†\oÖãÃy:åKoìÉªo”®·Q{sÓ¡Ñ~o„¨V\·‰‰Z˚,ˇÒèqîaîŸ‚˚c¡‘¯ÀﬂjEG⁄ìê∏ƒî}òÀHDÊ_ù)‰)∞p8˘PÈñÆ¨oÈ≈ˆ+Û&·j±ü{•@q«úy∞âDüÄÔ∆∞ó9—Ù!Xi°ex)0d8πdŒ"u8»Ë◊G7î°«Á#b\∆-û8âπzJëÀgw“>;Ö¬ßÈËÚdêåüﬂ
O“´4Ωÿ°Ê>‡ﬂº≥∂T}”†=KΩÏÑ	ÀÈv¶.<|!,:[
È©∏Ï-ë ‘.¿(t9¶≤¯/óIÊÃÂëY—\
ÉéπXπ¡{Cºﬁ]1˛p¢]bﬁÀãÜ∑8ÙºıÖªL¸Rá!£ßèt°˘ ‹3!ù'ßZXÉüöB∂∆êœ¡¿©	«’Z
ˆﬂ~˘Ã íú4kÄ`⁄$3Æ'$Ê%œìÂﬂ†√ÔC,EÂ•ßŒ≠irÄz®ãNõÉÀ-!æM≥!ﬂ}Nâ3-Ñ∂¸5⁄r °Ÿ0bÙz,ˇ8$∂}OMbS÷z∑˛˙˛As ‡Á|èirCÀ	uÊŒ¢©Ê—º¬ˆyÛÃ¢∏ì#~…¢≤C“¡W#ü- l!QGú¯¯®ƒG„h|ôcπö{é\Îvˇz‹#ÚDfB}¥tZB@bÇ«6·®¨j‘â‘À√€…fÏµ-–ÎÇÄVüﬁ€∏,ÖœHWi\ÑqBU'Ù≠x,U≥7J9»ª˙î∞—ÍóﬁCã"lyWf˙∂Nà˙Vÿ›∫+5ÂQπ˘AÕ*dj[µ}ú∫;!jÀtX∞nP+®j¢‘ÌJwj`†T¡8(˙b'éπ¬ÀÂMƒùL¡"Ê≠˘È˙êfË*Õ?öé´¿?≤€ΩKPç-l§√;ƒıÆ¨`≈Eë]÷ç˙±,‚Ÿv—WÕOº4«·Á#Æ^ÓX	|ß Íú’b‚©99N{—Mi&∏◊µ“‹Ô¬é^Qãº»Z|eGú∏⁄3Y2_!12©ò:»ÇÚÂú=öÖ∂®sø¥8ÎÎ›‚3Ÿˆjêâíç
6JÎÑÚÀéªEvõçbª|πâùb"KE	n±«óäUcFÅ¨vFg›ƒâ˙0,˜79Vóc]√Õ‚®è<ï/|†`QEãú;ªG˚Í–È‰£~2nÕœµﬂ-æw7ô‰;óú±@Í∂Í9ÙVˇ)[7N·pòÖr¥ı∫7|/…Ûø˜¸6…Öm∂Æ∞úÚ„˙A}U·n7B±h˛œV19/Ò∂aQÊÎw—Ìãç60»Ìœœ®ï¢õÎ)ó‹ìÒM°#[êŸKoaÛ*8D† rcÉBm6⁄ØÄk…o^Gâ±V]Î¨UùiÃµW´É9Ï-€Òßäá˚X∆…À”Ò|‘Ôß◊q/§£ué‘pr*ıÿµ˘∏lS3O-%&‘¶„À‰∫?√çeKøÙßÁÜá<§„÷ã‘ÖX©ÀÍ˚Ÿx˜Ë( –S¶πÀã`ˆ|îæP
∞RÉN!ËÛp.:ùN†¨Ìˇ
Ì’ö	Ë®-º€UBÀx=d4p›~VﬂB"ËÍ0ÊJ{ÇaÛÏ Œ	_	å±&!LÆâáÏÜ8Ém	]fû)eÜ}+jé±£~2
ÌK0ë=Ä.3yTV&ïœ∏ÇAI˝ˆú?_Äønu(›Oï?ïIÿ)€⁄˜v`Xæ#ûmyùÌmˇ°e˚˝Oªõ?≤√Ì◊ªG«á¸ﬁ˛^£Ë6=bïp≥zÂÀçπìf{ÒµîΩÏﬁy:˙≈mÅ5Ï¨~KV-ƒI/Î¨∫≥H Îí,ÿ¸Íß≈D˘âlØÓH[¬SAj∏CJ*¶4¢;€¢]î'›"<$û¶ÄY÷ÂjN±#YzöÙ„;>èoÿ5‘H∞D¸ë˛;â-^MêãDCd$H¿vÀ)14⁄7CõY&3∞<©X‘öÏÄDÄgˇ‰4®8M)~#ä'®#»∫"Ì*C‹Ã.‰õAeØx+‘û2°%e÷f˚j>•Ï'ˆ‡˜œEe2Ê„ˇò0oﬂ'ï5'#ÏYs:¬◊>=!›k¯–óE9õÁI|äHD˝(A#a<à≤ã¸À¢Ÿ©Ê$_¸ ò—Ã('–ZR√m°+ms“‡0√∫—,F¶âaÌ~mjÕ™k≤üOY*Ú°ä∏UíËOi7bë7?¿Y≥ãHπ∂*(∆ñ˘úà≠D¶¡ÊúeΩñ=µR∞_´ã’d≠)2òiB,ã9SÆúeÚÜn‚ı∆ﬁÓ ÁÊõç›∑Ï’Óõ7PwjÔÁ˝›ÕmÙƒ&?wØ∏Ù?=ˆƒ⁄L∞'ÄvÌ·ˇ{óBâú
åBÄNî»©@ÊO
FQ"†p¢Eˇ˙ä
1˙‚¿(Ï√É∑wï+πµÆ‚‡Ø.ì>†‰ŸB£>Mp±Ç8ª˜≥3N∫8áq28·"°Ö∞∑l.+˜oPÚ∫¬9_ të¯1KOOìn¬âñ(˘+Óﬂ´4È∆KsŸ3Ω·ã¥¿∫i6JÒ+äP∫M÷ﬁ!»u˛rL\œœ)Í{ÉûIò¢Ô´ÁÖΩF∂wÃÉ⁄˜É±⁄£_)©…ÊL≤z9ögÊZX+ní’≈ÖÔ=∂Àr3˘X≠#±…)?:sU5¨N÷Bï†∂Ç•»yq€ÊÌﬂ7ò]’‘Ú¢ærz∂¶'˙Æy,N¿At£˝˘›≠;g ô+.‹†Å< Ãù∂7X:wXWÓN¯~óIe≥ò∏ò tÊÎ*C4ﬁJrÆ€ﬂ`ÀË
?ˇváMíSG´∂(mÍÁ^	„*KÓUw%r|√ieq!]ªSæâ•ê©òï¡-∞myD÷äyrôj‹˘]+ŒÉ8◊ÔÊ˛∞q∞µ1˜àÕÌΩ>xÉˇ√!ÕŸ‚¸u]pïì–aîÙØ£õo¶}8·ÿÎÙ
™Œm^B—ø9Yç.Õ\’Ë‡≤T§Î™√ñœ˙≠x+ﬁ™CŒ»ˇÄ %ÑéÁr˚*ßI9⁄‘ÜÖ” ˜H÷∏^÷ÇÑ?u]πí(˙¶'#…Û)$f(§\a9HO¶ A™Á˘“íÓ1î%ïƒ©(f‡◊øˇÀ¸˚ø0qBm°"Ùñﬂ7Mád‰ÀSí}¨∞ Ù\Ì$1Ápd¶Rms„w`û[åîKnU‹ô”·‰÷ÆÛ≥bß´k´À6GhFèÜ78[vV-Ê6	ﬁæ`Í‡Pjii/÷OnﬂMò6ì˚f≠Ö	ìøm’©-8E»8¨ˆ˜¬ C‚•ÑÆLz›Í…≥æm?1 .…Fûˆ1€›bﬂ¥cr6$Ü;0T∂ir‡T$>…¶“GΩ cÖ~GÌ"œÚÏ†ê˝∏{ÃΩ£F·Bæqnù≤ÅΩ”|ÁPÆ´©6N©.PÛEl èÚÙyÈRﬂ¸ØQîa4‹WGö⁄@&§M≠ÖØé8gEín÷Ωì£!ö:è.É(ª}Ù*âØGüBv@q√E‹ç À≠•'π@ Ïª˜Ìê\ó∫I√öı“A¥¸…¯º¢√;K ¬/˚c$çù8ﬁªÑÑ2œ≤Ë˚K-ø#wùMÚ•3õ]©"™H¬¡EÊo
‚ÃÍMÌªAØw£¨gÈ	øÙ˙Wºz«È8Íã,sıù>⁄ÔÙ˛~ß}ùH‹iºg≈æ°˚«íŒæl›ûÆ@ãEâ‚Ã®öïÉrπç&pÌ*◊Ç∞Pn¯@∆ÏUG\ßë‘t$∏”>ˆˇ  ˇˇÏ}_S#IíÁ˚}äh¶ß›í@P]E/T;≈∫Î⁄j ¶)A9%)µô©öÂivÁaÌﬁ∆ŒÓÂÃˆ˘æ¬}ú˚˚.<˛dFdFDF¶R™al∫@ åàpˇπáªbS∫’™òÙMt9Â‹ˇ◊ÆÕ∆JŒ˝m·µ—5.Ñ±≠%$∞¨’u⁄º+øô+À´ÒÌÏÏˆ∞∏tù˜±Ã¥Ps(¨v™…·(Ãs,q~OÛBÆ/T;µ„I0àìõHﬂ”‰¬ëX˝‰∆«g‹¯@ú~nÛæ∂Æ˜∆#"~•éc2üòy^UâΩXQÜ¸ÅXø†gƒ»±Ûœ"CÉ∫◊t"UMî’\∆"+&i@Ÿú∆Âõ"Elô¨° ÎÎ%j'5B°%#v+2Xèx¨'uôë~Ëc%ØvDj99É•2Æ§˘E˝∆Fkâ¿ﬂù‘ª%bUÜ™&W˙çUS¸oˆ„L ßÚﬁg6–b#´≈∆.fuÃT6`(vÚÛ¥∂¸&P(&∏&ãåŒÒJ©S«⁄‰Àüc™Uú∆<SÀÖ=º»Tg‘uÌÇR+ö=¬BØ1í+©Òº÷î«ÉyÓ≥o‹eóCàíœ¿2yã∑/û°ÙeNàº*XAªûÊTt)r_oLF&€¥…Áh¥£2ÿí›éáõ*ÒAóD9j VÁ||≤xÜNˆéèNŒ–ÓˆŸ:Ÿ>|≥áN˜ﬁÌÌê‡gm°ΩwÏOªßR{ø—˚¥´Só⁄”Ö0g¢ûá=M©ΩiCòaò4¨\ˆ`ˇ4"ø†ã¿ä¯ñ/≤"°Õ”D4€◊„yÁ…e†t¯Ü`˜®N]Â.ög}=|»ã¡…tWÚàIzˆù àS÷/u‹Jûƒ“aRiAñsÄ
◊aÇ…à}Ò`‚É;ﬁÊ¥Œãˆã∞aÖ3/ºº∂Ú»ﬂ≠Â∫£ﬂIä+}–üöø≥Üò!´¢ S«ªÈ¬Ng2Ú¥∆ï∫¨ã—3Ö∞Â•YhHC=…ˇ8m¢2<tSúÇ£â¥C÷2≈/Ïçzπè+¥.2 9fé$îºñë3Er›dˇ∞„Œ6µV ê8‚Ïf‘Å@mÅwµ0Ië|ÛÎ‚!nàƒõQpu‰ùê Ìî6±·“„¸∂ÀçF“n—18<ÿƒ\Nû"\≤?ñPµ¥Ô%›–Ç‰’jv$k‘~Oö_»›ï‚¶,Ÿi¨
b‹⁄˘W{’‹˜´˜r4é¸++§O3·Ó_Qˆª…}ﬁª∏_`¸
Õ¸Äj§5,∫V∞Ùi¨cqë««Cî:^†eæ-†≥•)cŒÏÏ¢dœÈzÑ€‰¨ÔÖËΩÎ™ÎS?¬mr·!lè4ß‚= Y~†Zm©Œ∑≈ûÀ>¸›zàÃÀ«ÚƒæFˆ%ãXàM¶¶¬ñ!äﬁ>∏W–Ó+¿jøEmnÎ_Ìµ'µEQ‹:≤π:¯:át†¶X'S^]3Ê;JÈﬁjûT9é“õ√ oîıe=	zÆΩ¿^ËËjVÀ◊Ïx∫Ÿ±§LeU ˚å¡[h√ËQ¶á…Äg˛¸ÿèâÀ¢Ã«•ÏÎïe=Âá
âKÁΩ&˜VÖ˚£Bb ßL§ûou€KùÔ©RÕ
*¶1W•ˆ∑∞OìÊ‘ôﬂ˜/§fŸ_Æº–]ÃeÊ8õ:ô∫Å{±K=ŸkÙjo	`åX√6°n$Ù>õb49êã7Íyó>´,À∂K¸ﬁãtüêíèÒ±Ü]ÊÇ≥§ÿ*ﬁâEi∞Í≈Ωﬁxjãœ°<W2:µ(∏-ÎÖ¯—E<m¸‰›*ît´ÏEî¥oHÌfM_öˇØˇ¸?ˇÌ˙›»©:ÿxèßCH„J:ŒdkIí\ßgïIÚí¬{u¥}âˇC´;◊K&yË£Ô+;vnH>ôó(O˝ëH â˘˚ù‚A∏®ñc)øRûÍÆOﬂØÿù˙1*Bˇìh*(ö»¨ÕLΩcÌÀ¢¸÷éΩ¡6@\‚óòj@ºiGO#äú(Æπ%Â_*±X¯∞bû®¢⁄ˆx\'¡Òu"z? àÍT =j°3Ó]<fô‰?âú¢⁄û¥ôIÿg¯Ò-u˛-÷.DπÈe»áµ„›◊≥<ƒ¨¬V0Æê†˘Å·–«O	2Ö11q˙∫Ûx‚êL§XÂôNÓXΩ¢6e±Z<®(Ö –è” ÕV¨RµI!*)USA9Ó8¨P:˙0?⁄íXÂ ™ÃCU}ËübôçL
\ÚåÉ∞0ŒÂe‡^íøWP7‡%·cL9ˇœuâN+ù2E∆´¡™r[• ∆%°–k‰Áø»P·µl1],cÜ3Ã±6€lD÷ë–´6yçë–$=Ø6Óﬁ#´J≈A?˚Í„†°∞ˆ7È∞®ü'≥¨∆ìÜ˜z’è±Ñy· D± õ¿˛∞Ÿ€\‘∏êËefÂÌ—iö∑PäÍ∫Œh‰GPwƒπ vÆñR‚∆∆⁄ur»%~Ü¥4—üßﬁÁP±<Z’ª‹ª9ÿÇÁ"2’›LiRÍ(øı,eÒ∆tj–i°∑(‘Y”™M˙»|Ω8–æ¢§ y;
&ñq˝∫H˝‹îˆ_]l˛…dWs	∆ﬂ›ﬁ˜+⁄9z«cÔY\>æØa„≤€#2D—ôsŒ ı%9:ﬂÃô◊”q˙=EÒßs‚]v”9˝¡¢Ñ…üº_˙WRWõ¸9nîHmn¸øñ‰<ósôÛ<ÊåäæH>kñÃ%N"√≠QÎ9Û«‹èé^9ñjÀ)VD’âo˝“A–§Ì¢˛ƒ'-Ç9©˙NÅö»jK&YkÌ§ël^Ê:LYæTj…â'%óó&ev‰BπôÃŒøêªIŒI0µSﬁ:!Ï>qÖäj#ﬁæ*@A'(M@ÖáB.	ß±Ü2;BÖ=°µ6´‚#=j˛(8Gˇ>(^…»÷¨Úèˇ—“ÉvÔÉO¥@Á£`ì,d˜†∏D˙Ÿs ø°„›◊¥D+¡ƒË–≠Ÿƒ•ö—AGÔÚÓ`#tD†∂q¥:\›¥¯9ª #∏±≤ØféAen1`ƒlpÃç•±ø[(ÛêÜÉN˝¡öoaù:_\‡©YHı6Z§#¨ãj,zõPoQ*É_UI{Ï–¶≤ÚO√"eÿÄñéb	ãJ ≈Ge˝ó˝Ω˜heÌÌúù†”∑˚ØœÔ˜O˜‚™∆ÃòKÎÔ∑%’¿t˛ï\j¥≤VUc=æã∏.È˜43ûÂåk#3_0`v≥ôªUIÏÑ*âå÷É[ë±0©v¨N¸[<¡ëﬁLüóÀ.‹og‹7ÈÙC©ÛR¡¥XRñ|íó//Qa^$øÃÃ=U&Ä#nxπﬂ÷~óΩÏ,;«÷r›+¸Áÿ<ø∑ôˆ9$`ò˛∏£â>Û˝VmπóÜv^tµßÌ+®»’¡•åTô´b}pïP≈ª(ï›JäÉ5"mÊ.<)W<_9È∏ÿº€îÃ0ƒÖ≠ì∞ânk”#åM¯˙Múâ+¸©¡øúß!ãÈR67óy9Kf…˜.⁄È{„“©Ã√·fÚÁ∫qókìÁM:ëëßBJ$˝ö—⁄ö=Bˆ<kG¯‚>oSe%ÓY›Rüú6lB…"|rW∆›˝àV"ér§…äg≥B∂Ù“;∏À}Ì∫˙¸U/UíœÛÅ.À˙;]û$#Ë]ñLÙw∫<4j˚¯Ë[ÈÉ,ÁB†3WS©h©4i22'¶IåÒñ*ñJ‘XÖ≈"3¬mêió™∫µ±”"ÀÑ«i[™5K¢W&¶€+∏N•V/okﬂXçí5ÅáT‡ÒÊ¿]F}ö˘`IYv‘hﬁ∑‰$Ú6∂~aªQ»«I#‚P‡v°Uöñ3Íªq¨Øê_+¢¶]#u™Q∂ÆôGR$ê\ä€DŒË¶éŒ˜{◊õhD /O]ÄÃ-)Ÿ/‹MÎ ∆∂†9mùqU’Öx öy©¡[2©	Ãò
f⁄…d≤Sci√XV—ò[‰¬~ˇ◊?†ﬁ-Yﬂ&òM*ou=Ÿ$7´@ÉM⁄:A ﬂ¡Ω…‹>Ú≤Å+¶E®U!~k+º&£<7BËætQ&»∏"‚X®‡m≤-ºyæÔb≥ëbUÜ™åy®ïŒn'ﬂ¶¯+ﬁ◊'5q&u&iR,ìkå—ÕåAp∂È	x&PÓBEN	}	∆æj∞≥ùõıúPö ˜àπ@îÏWX‘c,¯√ãÂ®_¶5˘_ŸVd5s˚íl%´i1æL8]s¨\rlòì¢ÇÛ±
ÍbcßÇ∆®jŒ‘Ú©€C»ÙπBvJ˜>Û˚«O∆}ªúªq_DÁêR6^œm‹ ˆãêï®8©d’9˚íâQ&:ôí1f
∆ÿN¡I®¶1Nk)˜ûîä3Wt@√=≥–Ÿv¯–7√‡–«G]î#'µÈr@ê∆«R5ˆ“}àÉIEHH…ˆIüŒ•{á≈˛ÌíH¶™:N¡˛1	§”!\”Õ§∞ˇ2Ü÷ÿºõQﬂπ®‘¨∆ú∑Ã®_; °“ŒM>Y/ØÂÎ√ccqÁè√b¥yb[z9=ôî1=pƒo≈•Áƒ¸œπBô\ﬁ;≈JÓÀ€’ªÏZ©5Ωt‰Ñ§(Z¨N÷ÿ@ßìs≤R®f≠ΩÎ‘±¡Ÿ,Z¡›ë•MLÂv…Ù$0˘t_›31u_›ã“j∆4»©‹%/z"¢nÖ€i%1wShÜ' Ø¬í+Ù (®ö&ÄX´96r°Øñ≤;;3R≈À §Ÿ§ñém⁄HÚ¨≥ãÒ3 Ç›_´YG>)·h	ê∫°Œi¬ÿoÂGâ≤[]#ÌπˆàΩ•“Ó‘ç"‹D¯Sì⁄ò–ú≠ã«ì—_ùsÙ÷˙Æè•vﬂÎ≤,8ãÍ Ó˝ñr⁄˙rq)´ÉGCÛvØ∏!A¨;œß}g‡ù ù¯NØéﬁ8AﬂC¯√˛§éﬁ9},bùÁöAËã'‰«™io ≈Ü$%ômK*>—$Tƒê…˛MådŸqâ"G›àjPF~)—Ÿ‘≈.%XªaNœGä@F⁄ƒÉë‡¶Îf√\2Ä,|h8¿‚!¢ñé'É>M`#ëö-Mb\öô¢Ç˛¶Ÿ±}
U%%%’\ØUê—¿sA®ÖVÕ†jZÉgà®jò)‹ÑÆ…ó) 8∞Dñ1.∏dKWçÌˆ?.lëã‹ﬂQ?†µ2µ’Zˇ„G≈L£ÎU∂}ËC÷£$Ï´lÀùoôN#Yªnÿº1-›\öÏ5ﬁ8É'i}QSÉz5Ãà⁄‚Äm=®÷BËè!˛ÎQ'˛ïÏ¡’8p9©f=S¥D◊ÓRs´-≥(W◊ı∞™ÏustmÃBBæÍÃÖ√ÀQï◊6&–®Jõ‘hùÉó˛‰O1¡]¡Ì˜Jp¬ﬂE ÿ'Æ”çöØÁí0:Åb„FõÅs≈sX∞ñµôíËènòvD'0b…Öc≈º•ÍÖ	M¢)P‚‡WF¸Zî*Bá≤Yf4€∞ ⁄°XÅ£2E2[∑◊ı)•Ò>˝Ù≠∞Äƒ•È∑í	†ôOp1O©˘*F`Ö
«öã‹O5naà_ËÈD@•{bÇÄ&P~ë6ªd` 4Ê<åƒùú®iÔ%GÓ|IWB–%¿!'|	dπ»ÄÚf¯YRóÂN5•Åö◊Héõ±-ı,Éo9∞áŸØΩë0˙îâ®⁄4M∞›rWBπ⁄’íÑ&ôçÅ˛d2“Rõ¬“Ωd±!^,ÀzDæã¶êèFg·e¬êËŒY~fÈõQXv,˝ﬂ÷úk⁄Dˇ|G™⁄ëÀ∑¯•8Ñd⁄’˛ ïØE8ÏdârFJ±Ò›˛oª}®=˚BM•¡≥†ı)î«óî^›‡M´HÇy4©Ñ/faR5ÃîÅÁ¨±T≤Nd¶xK∑üb∆sño∂„ì uÂçF%!∂1éÏ'◊tc}•ËÒ§MÅäh∫íØp›JU¬ËË·O6ãÓ®ÒÊ’‚“ùÚ¡3o»¸±énQﬂüÿîh7zﬁ•-÷—–M†õ¯#tß‹9æ©è0±›I‡Éø~jB˝4ÓyëæxÁ_z£ÿ'≥Ω{∞∏ò∑íπ™Pûï†ΩâﬁúÏÔ6»g€ØﬁÌ°Ôóß˜∞≠€{ÿJ:“tí¢n4›qÜ∑ûµ«,„0”z«L˛U$Z&S=À\£=ÃÚ¡WÏãYMe‡–8ÓÙ†}é;&rÏπ''Ã‘îÃÕı¢pòh
e&Xò54N’≈ê8Œü
ˆJ*˙Ì.¥áˇä…Ìª¨Vê%íﬂÀhŸéJ)®r,?XQdúÁ_‡x¯∫aÁÉ	Ω èB1Ü$nå<n®ˇf´6Ò5âïÕòbHÖŸÃ∞B9Áì	(Rﬂ…πs%{Õs‘¢◊Å§ï_ÿ⁄èπÂ
w∞”tXÔ
±Ã∂∏®1€à¬0À.ÄÌôv9QgòÖ4À·=ÒŸüÂÛŸTN˚>˜`f˜÷™ÌŸE.„VÏé'◊}úÔèbg<˛ç∏êÛΩÓ‹Såﬂ`nV„≈'%≤òS+ZÊ™Y≈Éƒ¶⁄ª}nkÊJÒ…-ß0éBÙÒI‡ÿ∫j‚T≠¿Øã|ﬂ—ï©êhÕ	pu„˜?¥?ﬁ5Ëo≠¯∑ïèÕprRßΩt˜)üú|ÁÎñ6Ø…ª•<◊ƒµ^Y≤$¬ùC™€7ùÒò;íÁ€qüà˜‘3úî˜”5\›∏üû…µâ9u-≤À´ô⁄@"P-RHÔÕur\jŒéÁø	‚ûÁø	x◊ÛﬂºÁáª	8Ö3€Ì}iEÄ˙1’øMÃSzn D‰ç‘Ï∂4π"ßSª∑∞“-Ø…¶«KRÛÎ ’ã≤aE]«E◊>@i–3·>◊#∏¸'/Æ%wMÔ.„5=F≤aaŸA√.⁄ê˘˜LiëC‚æI-r™‹3≠Eé°{&µ–π5Z∞âı 
msüpv ?· S˙†ÖCä‘-dZ¥pêI}§¬AƒåÑC[7ÖﬁK®é°—1}xﬁ\À◊à£ΩL≤Ç“±Rêß ?Áåó…G	Ë7	3:Ù”Ò®mÚ˙~'£Ø˛"{YÂî&[ºÍHÎ≈rø£√Òs$4◊ºÄÖÒg^˛>À‹}&ØN“∑ökZÿ˙Xx≈?EÓ•‹‰%D+ﬁ∂dœ≥òÑ˜¬¬f⁄ãÏÈ∑Òrö¸ˆÊ$r∂G;+•ú6æßb”§ÙRP7mEGÉr›Ô◊z,J“tVﬂjÅâ°-Ck™Õ–ú8ê˚ÒŒFıüé	ÁFSµ\hOˆ√`CÎÒ0ÿp6f›î|87¢*fD{∫'≤ê†¡à≥±Ÿß„√π—T-⁄ì˝ ∏êáç=6ú3Œè®j± ›πúhÈ®ì/tfÔ˘pãñò»tÕª9¨M∑yﬂ8~yÚÊÇ$…+áÄf0¡È˘‹òæ”ê∫S_⁄‚!ÄrÌ'PïÂﬁ˛d<{∏Ï	î”}˜ª Â–wh.¿à·>eù˚¡⁄ù≈QñÊ•∞ôÓÑf‡<”≤∏À|∆`´ﬂö∆ˇL√L£4ñÉ|f	ÅiÊòáëlΩ7(¬`ø;¿|xª#Y;¸QÓè¸Å¶Ìˆ«¥Cû˜'√˝…p2‹ü˜ÈwÕ«Ecu:I¨N´eêSwÖòØ¸Ú“M—5]⁄&M&ØL“'}‚‹»xÎ¯dÔx˚doΩ˙’∂wvé~><€><[RVk–N[uÙlˇºªF»π7
éèOé~)AÇöwT)¢ƒÿ≤‘˜“ü…5(DΩstÄWÎÌﬁ·È˛/{Ë¯dˇÌÓùmÔøCxèNŒ–¡—Óˆ;°<ı≠Ó∫ﬁét¯=gp4vG‰jF˙fÍÚ2:‹±ÉOüÅFê?æG^¶9ã‚ÁËM’¿πzOΩD5¨;aw{q>{º©?|\bu£ÃÿÅ°Ò/¥F4~ùUãf/—∆j_‡%/<≈+…ö≠}i≤ﬂˆwÎx	ìøñ§€±p6Ê/û{u ”AÎ¸√=ñA(u76°à˝&ëíæGK'°O;AH2°ù˘˚ßGro0°§ﬁ/n¿	…-hrœ5sïWM0^°zÅ2_,Ò{≥Xàf.Õäm±q“ñ∂≤√7µ√æãÇIÍ´;â|ÈñY÷ÌÒò,*∂N}oE~`ÛÈdó÷—.-PÔ4ÒË£Iàæ!wö+YlF'˘W"¨»B;ÕÌdòª_˝⁄Óèæ¯^◊%ÎÎÒﬂÂµ≈gWh\_Ú [bºSxí˘
W[†<˛=ErëuzY3_ı™„a«é'PòÀu√?‡-~4&u7˘>¬g¿§Î÷j·dXGë˚¯WlÉ◊…ö‚ÉﬂÈ;¡%√£VñÍ¯ˇ"±ıÉ=ß€WI_Ë¸Ìóµ˚•πÉók2¿<ÑN¸m\(Ã‰7‰=<LFü∏C'¯fÛ$–Â˜ú®€«˝»è„ì\[>:ﬁÖ ÃË¯O'øØ˝π˜√“≤G∫V?/YËEËH~V≈&î⁄•‘‹–O?¥>¶ﬁë„€Èx˚NàR\“–∫T0fÑI1!ûu∞ïıWBó+íÙ	Àˇ¬Éw˝í|,q)n(≈çê>Ú¿ÌÖîxiÈ·k^öVÒØõ˙ í°_âYôKLã◊ıFº‡¢ä!	]‚ªØ)ë∫gªR?îjÚ¨ÙahË&<èÛ…¢¿®Wå-∫«üÌ&à´ß√ÏK\∫Ù#iﬁ^JÕ|FX2ì'ÑtëÙ}aÍõZWtyA∫Êˆ¬‹_7ÈÔ≥q¨Pã]—ﬂg:ƒ§øœö˛RõN‡YÃÂßº^úkÒóÚ7úi·5√Œ†c"êR≤9í#Pÿ¯TSàl8Î›àVf“»l⁄1Ëi¬Êïôå(ÅDﬁè©Ûõ/n0Ñ¢m§&@jÎí‰˘òP‹e+≠(˝õ\HOÛ:%˚K¢ÒHΩ”@≠èÚ¥bïÖT) æƒ-?5ΩQw0Èπamë>”^TwÒ1Ê°≈è˝Ñ⁄h”$m∞ì◊‡!¿5§πnÆ%üÒ»≈
ù$"‰ıS$åó<
ôÄ‚a∑¥äõY~2úFÅ`V	~2Õºp≤lÇ“x‚^bÉ3 ß'W¸ã*F¸Ïé—™>k¶Nœ»À>kR`ë>ÑNò&ïR1©FÑ÷•/ƒIêø·d÷ï3Æ¯îî⁄÷üø-<ûEE∞àR_∂·KŒZ0 r”Ò^≠´DO]%u≤O≤”h3ªøÎ:âó† “”D≈ä»k…öKÚÀã◊D©GÁ7t&Ä…{Bxó=Éô!~Ñ	}éÅﬁH:Ç›bhIﬁ8RS…±…πCb&AEi≈4=€˜N3\ÈM◊	∞⁄äIén∆nO?Ú\3
ºamI›IˇÇ^*&70Ø‹`«	IíwÚ˙èÖá/k&0lqÛ`ºT_±Ä˚êπ-ÏÔ⁄ø_ìË˚#˜¿?Î•∫Ôƒ3-≤™‰]æŸ%Ñßµ+L•-ËÚ‹4
«¸˙©&l&Ûòx–Vò;°P+ÌL+#.Ö⁄Ëàõó6rÈí&®è ÄÄ"7	«x$<êïRôî˚⁄$p&Ú≤lÒ«=ˆm¨	a=àjAXÑyÕD8Ç⁄£{Ê·òmÇKCs¢ÃÃ4ÀMsíxÕ4í∏eÃ≠pQ-hƒqfA%O^PiÅkˇÍ∏RÛ¶¿≥jN‘ºsiÊ-H2Èö˜÷ìOR$SÇ˙Ó`Ï©FIÉûŒ0ØÏ{b&]y£û’Ù«Ó®∂∏XGã98£œã8Ï˛G2Üq@∫=Û¢hÊãª€˚Ô~E;GÔﬁÌÌúÌr◊AÌx˚lÔΩﬂ?›[ZL˜”ì›‘¯_$ª˘/W^Ë..Ywt˙vˇu±n˙7ÁÅ◊+–Ö8®⁄˜àŒéŒ∂ﬂ--ff)L€3˜:Jü{¬aü÷∫®Ñı ÙÜ®äŸΩ—Å7à¬ñ<ø∏=–øBiÍà˙ÇuÃgtÈ2˙ï dI$.3Oﬁa•%ü≥áIÅK¯ïVS¡îBŸtB’fß‹∂;˛(¬GÍ€h8Äï“3;â9Á…B?€ÓßîÕˇBó®Au™çÍ¡ØlùË˙XWxÇ©#h◊Ó9–|ÃO3-ì 	Ê's VC–o›x»π3.Gõà∏˚\ÿbgÈ˜	BÛÇ#∞t¬T∫15]‰(¿“ÂO'K∫6‘°
⁄xf}äÎoo*.»ãœ„ﬁ59>“<Õ€3(Ë©∆F‡æΩ≈M„cæe∆¿≠lΩ¿V∏?∫Ñ7î:7îf°O‰µ§n∏?óˆ™h^ﬂ°ﬁËÏ+Ærﬂ-Y∂%‘ÚÕy√ƒ$¨±XsT’
õ∂qA´úEÛÇ∆9ãÊEe¥¬ˆidÕïl"àø√]‚Ωäb~†⁄kë.uëGüñöı=–ÕyÇ¥!I/¢ﬂWV4ú/$˚<‘8zπ∞∂PpÙD€A5IñP;ËÒhç•M√KŒ∑§Jc-∂WhŒ+Èîoë˘˜Ãwœ¸{é7÷å∫~æ≤¬>	Ωﬂ‹M‘ÍåØ5§\k%™i—ûù™]£Ì˚§Åπ-¨ó˚÷!	Ãì´˜O8˛äîjüJÂ;ÛzÚ§ˆ—&»⁄eÁ£öŒÑX˚Øˇ¸ˇééN˜ﬂP;◊B˘ WS7_Äü ä.‰&´<‘=T~ ®ª©\⁄´ªôµh'ß
h~∞â˛–r[Á´ÁR™Ìˆ<˛w¥˜À^≈<û∫UèÀMŒÇ«≥ó≥f¬„©πôè+nÏ‹èÀ§T…„ﬂﬁ
x4Â3ÊàVŸ∂;‚oËpˇÕ€≥
˜CÜ iWWlp{Alf;AöïYÌ±ì{›"!UÓÄégn*«dÁË‡’˛·ﬁ.≈˚O7ßﬁ J,c˘M≥kûÃÈﬂΩ9ΩäÕÈxgÆ¨Ø]¨Æ?bÛ:ˆ⁄©¢Ó ÀÍå$¢yâj¯ı6-3WGœùFÖÒWív™ƒ∆!µ[ì°\z£F‰è7Q{Êõ}rÓG‘N_áœ“ΩêG /B©ÚÕ‰Êû(I€œ;Á?∆9jX{ÌÒ5
˝Å◊√+z—z÷v~Dcß◊Éª~¸ëUÇ¢dVÊ€[2!wÄﬂE¢ÄI†ªÃ¢e≥˝¸û|]≥vd-x∆|›XÉ'ñÈ’*XOÓ®iörG)f„éZ-ÍéäO¥”ü_≈|ÆßhÆJr4Ì8öøZ›ì>‹ı·î•›≥"\–]É®Çñ°@iU∏∂HA})º¨.Ü˙÷”:Ø ∏é!-Àˇé‰¥∫\ó£1u=∆¡ï˝˝â¡mı$|∏.∆oÚû“´πT*=1°òÇÕ9Ë‹È~æ†N:f£ãçÁ¢À’tI?ÔtV[kk±8=oÇÕåµzû1*6ÒXW‡i§2ÎÙƒ¬çc|s≤}» , ∂O #«ªw‚;E”XR'ıd	=ì≤¢"ﬂd‰®aπ1eˆÆ mà
}nö…*‹îU)ˆï®ˆπçºÅà]—ai∞t~}NΩÆüßΩoI"≠ÑbU⁄A9Â‹úîssSŒœQY^5ôﬁ5©ﬂπ¸,ò”Òs1g‰<‹ëssHŒÕ%9?ßdy~ûﬁi‚ÁbÆ»\˛∏È∏øàÎqˆŒ«9πÁ‰Äúó≤<œOÎt4qºŒÒhÄEL¿à-@©¨† %ø¸ñ©ƒyOÓ»˚tHﬁßKÚ^ùí”¡0kí[rıŸ∆⁄≥
›íF#DΩïòReZ¸§MQ¡ÔM6{~w˘röWÅπ5˘ |—èÜÉL?:'Äõ[«ì—_ùsDçB‘ ¥∑ÔéBÔããËUP∑'ÜìR«)y?€.Y7’˝”ÿπt3	|Ë]ªÌUmé˝®|åC≠ï·m‡ˇÛ_Tè´ƒË˜uÙ˝ÊÊπ{ÅŸí¸Í\¿F5QÁ˛50¡fb?ÈµmW∞uÇµiöøÚzQ∆≤ÚGıh˚å≈ıOƒPé˙ÎY“|/CM‰}„aúëf	‚ùE‹√πèìùy·Ω¡Õ&
o¬»6&^5úÒx‡6Ë'uÙ
ÛﬂÁß{J˛~ç_™£ÖS˜“w—œ˚ut‚ü˚ë_Gê∫∫ÅwaËé	ó+¬}πçxrõù5ıcXƒúˆ¢Ÿ{2ÓÜ”˚Î¸¸Óµ”’å∏–„*∆Y˛Ωız.˘£ÜÜx≥{Œ Or.ÕP9>ª(ÏxSû;AXG›ö]<z¸aàæ_V¥{>â"ôì∆<Ω°;∫éö#ü±é67˘ò„∆5º€Û¬Ò¿¡Käâtsò@5F√∂ê‡P‘ZWØ¢™—&Ωp›ÄipÎàœŸx ¶ªD@6à–”4+ÚûÜjî=ªîOÈ·W5CªQ)É«Nónw®bo≥}s§
˛ﬂ*àmgiàœãú7⁄πèÁb‡jHÑ-„]‹êe$Iäh-™s7∫r›ë˙¢ 4HÊ_⁄t√ıL£ã√YËnbƒ¯…›Éπ14e¶o¨ô@æ8m›¬$kÃ<˘|∏Æ„Cqj⁄à·‰‹v√hWA"tCGh Ì6˝¶Rã∫,JÊåI0°g‚!ÛﬂrèP—9¢Â¡4WØÍπ˙Ô•¿u>7<¨‰ı0%Œ$Ú≠Á@∑±UÌ~Ò=Õ&û&XA"`è‰	≤Zl75@À[7zº]Ûd·Ê˚uÈ»ÁéæV"DûØ:ùÛç\6âœMŸ¯¸…}A¥¨†8^ÆxÆ;V‘£‘ç0V:r0¢µÍi©©äîÎv√‘mgπ•g>=dgÔ¢u±vÒ‹n:DìΩ»ÇÙ/°Êı;˘“ÇÔù∞P0lﬂÖòyùh∏·|’Q$w¥∫W »czsÑW~ O¡„ıŸ⁄⁄˙sÀ’,ø{ÌÜÇ;•»q†Z·∫=œ°∆îVTjmà|”W’'Ê´ÑlCÀÒ»(éÄG6∏rnB˚éTQoJÿ‰≈≤
ºy°	êã+äº\H[BÍêä~ã?/ö7[«?˛Ûˆ+¥Ûnˇp}áéﬂnülÔ¸ä…i)ztX]—MEÕ∏	ò±êQÎN[YÖ¥3ﬁ:vœÔ!ídj%A¥RÊ©$v˝+OOI<D‚©l[bº≠≤‡ä€ìFho{¡Ì°£ëH‹»Ω"°Êê⁄2bÊJ¶÷Ò}¸}öÚ±'ˆ¢ÎKOÉæÒ∑∑©Ë¥L0U<âåM2GÅâÌÙıÉå∂ıÀﬁ…˛Î}ˆﬁ¡ˆ·ˆõΩì‹óvèvŒéN–2ﬂHßg€«ysbıÒãÂ¨¿õ3Ö˛~íKd ‰Ó¿á4£ á.C°¸]ËFê"ÕüD¨O¸0˘•∂TGk+b™m1Ω"KxY⁄KW@∫Æ1w„”¬ç+I1∫Á++Àœ÷à‚”¸1îÓ
PiüË¥÷/[ü‰Ùœﬂ†⁄◊∏—A·ps‹X'/˛U„¶∆rFﬁ:∏¿≤jî‚öLy¶À∆U˜ÜàÓÂˆÌku·Èˆ 

˚N˜èùÎ∆Ucˇ∆äU≤	BÅO]ÚuøÒ·y˚KˇcB`ﬂÎı‹4E¥™)äÑﬁRå )ùd ;Uèéb‹X•”≤&t8cıå2eàîÎhÍZoêÅcN¯‹P’ À¨vf˘®ﬁu›ËXU7⁄Õ5‡o‘Û.˝∆∫<@æLx‚Ÿj{:¡ qu$°–<^3‘o¨/†Â{’t∂ΩË∑3”œ°ò^Ú«‡“¢ÿöÇÎaMtı¡¿3vF)/è…´C7µï≠˙.T˙ÑB|∞,„õ∆
˛á/≠“/ñÀ∂ZÏ#ÿ5Únb_¨“gÖBÉ‚ˆ∞…!©}Ã.ih®`ﬁI¯#dâ'ïæ2˜Üï¡íø≠˘f¨Z.°^_Rs´€ì°vvcñ°Ñë]yÿƒÁ◊‚ﬁ{°[gŸüÈÔ◊π„œ±ˆŸc_0ÌA3ÜÈk◊ÅfL|äÜ¸f˛ÓÁó∑ÙË¬gÃæ∫ÿ\ç‘#R\LA)È#N#‘†ÏÉ¯ﬁDP,{7‚o„èû·èEÏ*è˙p&AËRª´–2î≥Ùﬂe—µÜE◊öRta≈ÅÃê∆≠>p\tÊúCÅÎÓ_*~˛¥VÑ≥xUsÑÄ(~ Kd|
*7HñlÕÒ§!#¶wy∆’®j©œ0-{™4≈ûn-ïHV-*í1‹~À¢rÒ1#âÌ§¸Øñ	á?´°Âouñ≤E6\≠˝	-jœvv†_á˙◊7—¢∞=üe7 |ÀÎ+ÍÓ>©¶V#a› î∑_ß	ˇW£=Sy*œfaT•Íí^ÚÎ63˘nJV≥Õ=RFÜ¯Ÿlg‡c≠∞Z6KéÎ{b2ûs·ë2#ˇÒ3◊(]ä∑DI©Îcé‚óùä≥ïN∑É≥úÇp†älV.pñ+]m7•ﬂ\<›ﬁWg?≤6Í	L´âXÒP£\nƒXä|bÀÍgöÏhÿ≤äPÕ>´*“ü1∂'›>ﬁnrA˜–g0¡˚,[=Ggè‡Ì›ÔoWµ¡È€5∑AU≈®I:–lt§2Rb¿E≤tıãÅÒ äô‹Ùl…≥æAlúÓ$‹Ù'â˝"AKÙ#@J±./¸ë©¢eÑÆ´´ÍŸ3!äoÄèYôÅÂ´Ùh“ç–Rˆ©ZØ•VOsÓí%rz©ÂÀ‘π´ñZó,Ç .Îµ∏¢Âñ0%ˇcd.T≠•fˇ˘crî∞9_π€JÍZºX¶_ZΩŸ∫€ ﬁïFµ÷R°V⁄w[Ÿ˚œ®÷.÷JÁn+}´’:∆6∞0'©Âj‚†@Øà\◊Ò¥ç∆ê©Bc√vÓ<=rŒ∆Á$ˇY
˝º∆&hé6aÑ·Q≈0ÎÒAükŸk˘è:~˘ÄY≈«ÀjﬁÈL$⁄À=äï*†ZˆÎÜ\PVùÃYwU@üØIkîF¯Sx%H#ˇ=ƒ[?n&v–‡R¯sù°|q@‘mD”BsL}%dâômyM’æA˝ ±”J¨¿zP
2ÙlÅÖî€Œ∞æ N	ˆ,pzå∞
ã∞∞•s¸)ª“ÅuèkZYÍ≠™'îã"‹Ωçbw1Èkûi!üA’≥›ΩqF⁄©6]∆˙öÁ;ï˘°“	O∏œ°õr”¥Øy ≈$ïŒ∑˙πv∫ç◊Ó¶ùo.…ÅM—o„Ñzûq5É…=µ„ø4xy˘•ƒ-_»2BÛç‰a neˇ¨F∫∑5bæjX`EÙ⁄Cıé˜ãÁ^°WóØÉG+«¨'ﬁºzT±Ωi¨k|-Gª{®µâ§äÜ¨Ã°  ∏µpÄ∑¶Z•ºMÄF'	–¿Í`^ÃÖ∫/°	≠HcëLÔL¯S∏¬¸Zfgæ≤ÖMÉ´\Âµ Ö$«V13Îåò-º‹êú√®¶™Íƒ™-‡g“è—˜mé¥Ü/ı5·q˝,”{“‰ê*\l)« ï|©√4„ÜÙU¸â ≈ŒâÁTÌ.M·)œ8b•äTr®dî*‚lXí±¨øñ™[î˘Æ0±9IwÀu≥`ï®w⁄∂Õ…}À∂ŒˇπSs“óÌ#7≈YôfÈ⁄í¿TãåƒÙaëµ∏Ç^¨†M›ì]ä4C7IcÇÓaï9nVõkÑ}kK4}öH™^Î à˝íyÌ•Lˆ, ?§ˆQı"=Ü—GH“◊SH˙z€ZπìguCX)ﬂåM$TÚsà’$&8∫…È–#ù®€|6§ﬁ!?†Uõ≠0ØéÇFa»é?aú»EiûLs…VÛªÙº˙Ïﬁºº˝‘√Ê_‘–¶ßnêT◊wü§ïHπ2˚ãUãπ'ã,ácŸQ¬ä'ûXçøæ∂¨só$%Òs§zNåX @óÁ{6Ù§î’X´’Píõ/|Zò∑M d=GñUÇrMƒ™‰pßüÙE≥ögìöõTTa»ïOå’Ë”#%!me Æ<*eQ!ˇ$eàÒ%ïÊÒ¶¶ËDãÔ=˙'>†*|ˆ≠∂)ø∆˛fÔ¡eäü`√cd3ïúïÑÀ6po¸ë—àTëŒ≤TV}urª≤ÌìÑdç≈Ylw[™Öt˝)∫çâ¸ ÂB%ÄÂ∆Är±»@äts˝Å©i◊SHq7ÒÑZ[¡©ÂΩï.X Pñ£\aı*]ŒF˙R/1â¸¯§ê‡9P@î¨sJQ'„—ë´KKöÙ⁄ù—<I!:D"˜, Z5dîœ”éÛÙÁÛ)Æ,¬ª°ìΩ;Øb¢àõÀí¢r)KëïÀ6ÑïÀOXä∞X±°´dÓ¬RÑ	1a7îÆNïp/òiÕEÙŸEë.∑!ˇ≤ÿU◊%≈]ﬂÿ´–ﬁ§ÈHÀ˙ÑhπzbüâNèˇÍ|äPu¡∑¿ÂË¥Œ!‘¯$c¿≥?zr#<`7B«d·“’,âøZ±ü§éf®…®\û€ì ñü@rÙ…L∆#¿Âı@¶ÏeZ∏‹∂ü©¿Úé*ß?e.õ#¨ıâôß6v†RùfçDWXc®ıƒ¥JÛã_÷,p≥B"ÅHcà∂ÉNËÛG'á˚áoò.¿Æ0µ¨–πJõ•dQ¡∫ÿî.Zı•,FÉûhãSñäôaïö(ïSW©ùR9u’Z+Yy™bÑ†lQ≈HLınÖD&óè±·ÙhÂ„ﬂã»«Ω_ˆ≤Ú±˝0Âc—*Beâ»ﬂJSñöaM>VQ‰h^‘= ˘òà¢X@VQ@âëò' 5≈î4Xà8vµ`e _A¡˙ D´ \ˇfÌ∑#èÓøy{&◊é•kÿ ÌP≠Ä-V®™<˘{q™˙VÛ"lÒ:{Í¶Ø≥ßn*ÒZïÄMDR,`ßØ÷ìòo5üü¨Û
>◊\rI:∂Ò £Å[º»/Ø&6K7¥ùëi U.ø(/(
ó"´:Ÿßπ√W)•o∂UJ≈◊Ω*•cäkP≥“˘¬a∆—!¯s~øºŒ&z˚Î´ì˝]Óº´I∑Ñæ›{DÇ,qÔ±\<∂Æ=”E¶Ñjj|ıÓhÁOö¨(F:“’‰⁄ı<Ô/©˙c~∆ƒ%û>eûÆ»«H»∞˜3Ê)Ú	ÇúZ+∆XßV®Göm‹d<YpÒq]
måï¶8¨RÜÄï,˘‘Y<ëôMY>ÜXW;ùúì`®MTì3woÃ¿^ﬁqJﬁùÖÛî6úÁ@•Ou¢¶ú99Q≈ÂB›Ø[7±ävRÏ.V˘÷Ìº¡≈€Á˜±Ïnbï[Ç¢ó¶¶Í•¿µ©©˙)Ë	û™Ø"ﬁ`MG”_û"ÁFÇÊ:Ñ)}3q
√èt»î∏»#^ÂNqì'vˇ¨ºÃ3≈uûÏ˝ù‘ùÆ¬◊y™∫–√TÖÈÔÛî&®ÍÀ<^ÁQ›’—]ªôi*;nnó$*§u.W#*§w."*§wN◊ 
^ÑP_◊[ì]k^Ü∞9·BÑ˘öT.J'BÑ∆∑…¿Í ‹qà±O˛ãÄ	Â´˘ñóT¯-à’Ù-µñëVˆcªq!¿t˙Û+[¥4¶≈˙¬L<I¬YT]8–ÃËôŒ3#¢¶ÛæÃà®)ù.E©Jq∆F∏hTqº°ŒFı6ÅõÏ=¿I0’ë”©;·†C9
':d1 è:úoè;¸{j±fÜ&W|bP(~§D≥úqÔËaëÄï'Ù	=|Bü–√'Ù–¸ƒ˝¢á‚!3%zËNÅ&¡ëO·uï˘Äû√'¸	?|¬≠CÒ∂Ã◊ &â•Ïƒ$è˜√ÅÛq!u…g>¢x Uwgfv›äòC’=¡à9T›éò.˝â’›ã!‰=Z Qºoí#íH˜«"≤H‚«"˛MZ®ôAà|Æë}§Ö”\qÔ ¢˝Öå'¯	>|Çü‡√'¯–¸ƒ˝¬á…3%x8ö<L.˛=ÅáâR>Åá≥£ı	<ú-Ωè<3B|=‡aísﬁ<Ø∆>01§ÛÅ≈„®∫l≥!Áû`C#M˜i∫7»0aÂdX]¶á«∆ÿ]Î◊GGg{'x£lü¸äv∂Ovµ¢TÊ†Ä‚ê9 ·œ–CÍK^Œÿÿë›´˙T∫f®ßøöÅ†¥»W“Ö ÒÌ¡Ä¶—Ωî/&fEÕ_,˜W$åE
4ÊÄúAe«û{#Ô5¬≤»È~¢A[G{GêˇêÏâê“x·PJ> î¢áõF°ÀhmæXó`ßÏ¬Î—ıx}≈¬ÇS&`U¥à´Cˇ!∂Ùí¥æeÒJöæP©s´iù€ÔN3v⁄M• ÷¸HâíßùßäKã?¨ô≤,n;WïWX≥eS›€v™*/Ë]`™RáæP‡çØpGµw‘‡2uÊÛ÷V Ä+Ê}KÀªπGÇ‡Üﬂ9Ωs!—.Ö:ﬁâ´¢zﬁVb*DP<OÓsôèR,˝»~Ω[™≈ÌÅû˘˛ÌˆŸÈˆÒ1:ÿ;=›~≥áéOˆ~Ÿﬂ{π~∂ﬂ	*ÊÌïs‡˜ú¡—´yí;:£ux◊XÚF°5V–oçœ·Á£¡›À˛ı‘Âg+Ë/g/«xa'Ë*†∞¶*úKLöÎ
oc5ó˘º€ç8fË`]∂Û¶KÅ8#oœz#t·Ù»øø˘˛ˇã˜ÍM‘∏F+ì¥ç§#ÇYDo]∫N´Ü]ºæBvÒÏ‚U…«^ÿçnØ'∂ï%B“Ô_56Pˇ?ÌÁ&Ù-∑UI>Â•WäöÔ˚Nnè«˚]$w∑Üª[É
¨ÉW°ì	YPï#—Ï-›Û¢ﬂ1ÿ"L¢Äá¢˚ã∆ï◊s∂8Ω¯$	CÁ“E«Å˚≈sØ∞Õ—Qvíµ6>¥Z /%÷Jõ'§U4‹∞xcbﬁ–lZ!:w/‡,Û«‘Í‡$)-
Âú®?<üDë? ¥›åÅI…óôo˝VC∫ü_ﬁ÷à	ÀÉ˜â©]`˘Î*–æÙîP&⁄XA‘K$0~Ï6¢è¥V~}Ü9„ôÃàπr'q4ÅA˙AcÏ{IïY,íS*EnvRˇﬂˇ˛üô•§îÿ∆›?∆LŒ3úe≠j&‹Õ˝ È]Çj|‹˜G.zÌπòK≥Ä¿
Ç $IEôË˙Xñ7…ÔÅ≈f8åú ÇœsaÇéF∞(wäR€` Ö.MA™ÄH˚5©#£?ËÂj ŒWãüî¢sÃ®©Jå∂j©ˆ{q’Z˚m¨“d7‡•π“áŒº@ù‘‚3-V’£s=<á–ßÖ≠ˇ¨∂√	Ë≈/ñI˚ ûΩ—x)&*e†ü¨åÅü/Œ`‚æ‰≥F;T#cX"ıù—%~∏Ê¶d}≠Ê61_∫Qì4™qFåÒ∏}Ãnr¡m^6—
÷x[ÌŒÍ⁄˙3®˛ºù¸≠¶9)÷$«z+ã h]±Ò˘™Ó‘¸ø;	7AØm¥≈?Öü}ÏO"lÃπ\”°L£ÇÌ´ísLbß$^,¿&Á´≈NLçÏ gÚ\]¯RW˜L√¸Ÿ*”Bxñæ∏öÆLŸ»Ø˝ kê÷ì”JÉA6èÊ|ÜÛ?©sZW4z‰|Ò.l¿ÇΩ?>˜π
‡œú‘¯Ó££àÌçÙŸp;˛ÿs{µ(ò<ÛÜ.Ê«ö†>∞7©ÓPG¯DZ—¥pßﬁ∫ÖKÉ°¡jáT;TøÚi-‚\‹hâ÷"ÍwähQçmN,⁄$2F1Hﬂ·©ªëœÉ÷ï:Jmôº@¯KU:ÁP€õ˝˘hás¿7§§7iÿ`—`5´ı ˙çrsgüÉUp◊Q¥û:(™x¿t–∑l¨ÒÑ/o[-’wŸC4™Û‡R≈‹í–ƒπlP9ˇ·ÓÖÎ∏Ìèπ≤ko•e=6'ºﬂ ñåY»ﬁhÑª`C^‹ÅÉÌ˙,√eÿGOhl·◊æ€dõ8?Bõ8	§Âq'„øOÈ¨ C¡ıA‚˜dı TGıÅvr»«RC)¨cçÏ&0ã÷Ù…7tvúQ◊hmùYÃ•Íd∏´Á%í4¿f‡=≠∂¸Á›ÂÀ:Z\Tûﬁ™ë˜õƒt	ﬂ{Qø∂∏“Y\îã~√.b@ÇÍVkIs@r"ü∑—ÏÕìÔ÷Z ûÔêãyAG¿=Ù/v≥íÙ.íÖß•Hˇ nUNoX≈+ÁÁ` ,◊)3-[@Æé*ﬁËß~ç√ÕÂÂ+ß9tóøΩ%M‹˝ª„Â∑∑Ó®Î˜‹üOˆw¸·1 (4wüshŸ∑3ˆöW†Ô9„q≥ÎóC,Ä¶&A5üÄˇpÕQ#§‘ëV„RJ©ÏÉ
•J\âÿaÀå ÛLDêDTb`räI√kã˝çMAÇ`Ã¬“Õ >“"»Ö¿G¢‰<V˜	(ßRïåpëˆÈOvæƒü·ïº˚oˇ  ˇˇ =√∑9