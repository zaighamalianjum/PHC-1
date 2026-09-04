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
  getResolvedNhcPatientName,
  isSamePatient,
  isSamePatientOrName,
  parseCleanVisitDate
} from './patient/patientDeskUtils';
import {
  getEffectiveAppointmentFee,
  isAppointmentRevenueEligible
} from '../utils/appointmentRevenue';
import { getThermalSettings, generateThermalStyles } from '../utils/thermalPrinterConfig';
import PatientDeskSubNav, { PatientDeskSubTab } from './patient/PatientDeskSubNav';
import LargeScreenTokenDisplay from './patient/LargeScreenTokenDisplay';
import PatientRegisterView from './patient/PatientRegisterView';
import InstantTokenIssueView from './patient/InstantTokenIssueView';
import RegistrationSuccessModal from './patient/RegistrationSuccessModal';
import EMRDesk from './EMRDesk';
import { generatePatientId } from '../utils/idGenerator';
import { openWhatsAppUrl } from '../utils/whatsappUtils';

import PatientQueueView from './patient/PatientQueueView';
import PatientAppointmentsView from './patient/PatientAppointmentsView';
import PatientGridView from './patient/PatientGridView';
import PatientVisitDeskView from './patient/PatientVisitDeskView';
import PatientDeskModals from './patient/PatientDeskModals';

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
  const [queueStatusFilter, setQueueStatusFilter] = useState<'all' | 'waiting' | 'completed' | 'called'>('all');
  const [queueSearchTerm, setQueueSearchTerm] = useState('');
  const [queueShiftFilter, setQueueShiftFilter] = useState<'all' | 'morning' | 'evening'>('all');

  const onOpenDirectVisitModal = (tok: Token) => {
    const pat = patients.find(p => p.PatientID === tok.PatientID) || (nhcPatients || []).find(p => p.PatientID === tok.PatientID);
    if (pat) {
      setDirectVisitShiftModal({
        patient: pat,
        shift: (tok.Shift as 1 | 2) || shift || 1,
        fee: (tok as any).FeeCharged || 0,
        remarks: (tok as any).Remarks || '',
        autoPrintTicket: false
      });
    }
  };

  const getPatientAgeGender = (id: string) => {
    const p = patients.find(x => x.PatientID === id) || (nhcPatients || []).find(x => x.PatientID === id);
    if (!p) return 'N/A';
    return `${(p as any).AgeYears || 0} Y / ${p.Sex || 'N/A'}`;
  };

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
      const todayStr = parseCleanVisitDate(pvVisitDate || new Date().toISOString().split('T')[0]);
      const matchedAppt = (appointments || []).find(a => 
        isSamePatient(a.PatientID, patId) && parseCleanVisitDate(a.AppointmentDate) === todayStr
      );
      if (matchedAppt) {
        const fee = (matchedAppt as any).PaidAmount || (matchedAppt as any).ConsultationFee || matchedAppt.FeeCharged || 0;
        if (fee) initialOpdFee = String(fee);
      } else {
        // Check most recent appointment for this patient with fee
        const recentAppt = (appointments || []).find(a => 
          isSamePatient(a.PatientID, patId) && 
          (Number(a.FeeCharged) > 0 || Number((a as any).PaidAmount) > 0 || Number((a as any).ConsultationFee) > 0)
        );
        if (recentAppt) {
          const fee = (recentAppt as any).PaidAmount || (recentAppt as any).ConsultationFee || recentAppt.FeeCharged || 0;
          if (fee) initialOpdFee = String(fee);
        }
      }
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

    // OPD Total only includes actual consultation fees charged by doctor during visits
    const opdTotal = opdConsultationTotal;

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
    if (!dateStr || dateStr === 'N/A' || dateStr === '—') return '';
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

    setActiveSubTab('patient_visit');
    setPvPrescriptionModalOpen(true);
    setPvSaveSuccess(`Loaded prescription from ${group.date} for re-printing.`);
    setTimeout(() => setPvSaveSuccess(''), 4000);
  };

  const handleOpenPrintModal = (docType: 'A5_VISIT_SLIP' | 'A4_PRESCRIPTION' | 'A4_LAB_TESTS' | 'A4_PATIENT_INVOICE') => {
    if (!pvSelectedPatientId) {
      setPvSaveError('Please select a patient first to print.');
      return;
    }
    setActiveSubTab('patient_visit');
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
      clinText = clinicalMeds.map((m: any, idx: number) => `  ${idx + 1}. *${m.medicineName.trim()}* ${m.dosage ? `— Dosage: ${m.dosage.trim()}` : ''}`).join('\n');
    } else {
      clinText = '  • None';
    }

    let patText = '';
    if (patentMeds.length > 0) {
      patText = patentMeds.map((m: any, idx: number) => `  ${idx + 1}. *${m.medicineName.trim()}* ${m.dosage ? `— Dosage: ${m.dosage.trim()}` : ''}`).join('\n');
    } else {
      patText = '  • None';
    }

    const clinicNameStr = clinicSettings?.ClinicName || 'PUNJAB HOMEOPATHIC CLINIC';

    const message = 
`🏥 *${clinicNameStr.toUpperCase()}*
----------------------------------------
📋 *PATIENT PRESCRIPTION & VISIT SUMMARY*

👤 *Patient Name:* ${pName.toUpperCase()}
🆔 *Patient ID:* ${pId}
📅 *Visit Date:* ${vDate}

📋 *SYMPTOMS / DIAGNOSIS:*
${symptoms || 'Routine Consultation'}

💊 *1. CLINICAL / COMPOUNDED MEDICINES:*
${clinText}

💊 *2. PATENT / COMMERCIAL MEDICINES:*
${patText}

🧪 *LAB TESTS / INVESTIGATIONS:*
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
    allNhcList: NhcPatientHistory[] = [],
    allAppointments: Appointment[] = appointments || []
  ): string => {
    if (!nhcRecord) return '';
    // 1. Direct properties on nhcRecord
    const directName = 
      nhcRecord.PatientName ||
      nhcRecord.patientName ||
      nhcRecord.Name ||
      nhcRecord.Patient_Name ||
      nhcRecord.patient_name;
    if (
      directName &&
      typeof directName === 'string' &&
      directName.trim() &&
      directName.trim() !== 'NHC Archive Patient' &&
      directName.trim() !== 'NHC Record' &&
      !directName.trim().startsWith('Patient (PAT-') &&
      !directName.trim().startsWith('Patient PAT-')
    ) {
      return directName.trim();
    }

    // 2. Lookup in active patients list
    if (nhcRecord.PatientID) {
      const activeMatch = allPatients.find(p => p.PatientID === nhcRecord.PatientID);
      if (activeMatch && activeMatch.PatientName && activeMatch.PatientName.trim() && !activeMatch.PatientName.startsWith('Patient PAT-')) {
        return activeMatch.PatientName.trim();
      }

      // 3. Lookup in appointments list (for uploaded or booked appointments)
      const appMatch = (allAppointments || []).find(
        a => (a.PatientID === nhcRecord.PatientID || String(a.PatientID).trim().toLowerCase() === String(nhcRecord.PatientID).trim().toLowerCase()) &&
             (a as any).PatientName &&
             typeof (a as any).PatientName === 'string' &&
             (a as any).PatientName.trim() &&
             !(a as any).PatientName.startsWith('Patient PAT-')
      );
      if (appMatch && (appMatch as any).PatientName) {
        return (appMatch as any).PatientName.trim();
      }

      // 4. Lookup in any other NHC record with the same PatientID that has a valid name
      const namedNhc = allNhcList.find(
        item => item.PatientID === nhcRecord.PatientID && 
        (item.PatientName || (item as any).patientName || (item as any).Name) &&
        String(item.PatientName || (item as any).patientName || (item as any).Name).trim() !== 'NHC Archive Patient' &&
        String(item.PatientName || (item as any).patientName || (item as any).Name).trim() !== 'NHC Record' &&
        !String(item.PatientName || (item as any).patientName || (item as any).Name).trim().startsWith('Patient PAT-')
      );
      if (namedNhc) {
        const name = namedNhc.PatientName || (namedNhc as any).patientName || (namedNhc as any).Name;
        if (name && typeof name === 'string' && name.trim()) return name.trim();
      }
    }

    // 5. Fallback to Patient ID if no name is available at all
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
        const appMatch = (appointments || []).find(a => a && String(a.PatientID).trim().toLowerCase() === cleanId && (a as any).PatientName);
        
        let resolvedName = (t as any).PatientName;
        if (!resolvedName || resolvedName.startsWith('Patient PAT-') || resolvedName === 'Patient Record') {
          resolvedName = (emrMatch && emrMatch.PatientName && !emrMatch.PatientName.startsWith('Patient PAT-'))
            ? emrMatch.PatientName
            : (appMatch && (appMatch as any).PatientName && !(appMatch as any).PatientName.startsWith('Patient PAT-'))
            ? (appMatch as any).PatientName
            : (nhcMatch && nhcMatch.PatientName && !nhcMatch.PatientName.startsWith('Patient PAT-'))
            ? nhcMatch.PatientName
            : `Patient ${t.PatientID}`;
        }

        list.push({
          PatientID: t.PatientID,
          PatientName: resolvedName,
          PhoneMobile: emrMatch?.PhoneMobile || (appMatch as any)?.PhoneMobile || nhcMatch?.PhoneMobile || '',
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
      setPvSaveSuccess(`⚠️ Please enter at least 9 digits for mobile number search (کم از کم 9 ہندسے درج کریں)`);
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
            setPvSaveSuccess(`⚠️ Please enter at least 9 digits for mobile number search (کم از کم 9 ہندسے درج کریں)`);
          } else {
            setPvSaveSuccess(`⚠️ No patient record found matching "${rawQuery}"`);
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

    // 0. Match in appointments list (for uploaded or booked appointments)
    const appMatch = (appointments || []).find((a) => {
      if (!a || !a.PatientID) return false;
      const pid = String(a.PatientID).trim().toLowerCase();
      return pid === cleanSel || (alphaSel && pid.replace(/[^0-9a-zA-Z]/g, '') === alphaSel);
    });

    // 1. Direct or normalized match in main patients list
    const pMatch = patients.find((p) => {
      if (!p || !p.PatientID) return false;
      const pid = String(p.PatientID).trim().toLowerCase();
      return pid === cleanSel || (alphaSel && pid.replace(/[^0-9a-zA-Z]/g, '') === alphaSel);
    });
    if (pMatch) {
      if ((!pMatch.PatientName || pMatch.PatientName.startsWith('Patient PAT-') || pMatch.PatientName === 'Patient Record') && appMatch && (appMatch as any).PatientName) {
        return {
          ...pMatch,
          PatientName: (appMatch as any).PatientName,
          PhoneMobile: pMatch.PhoneMobile || (appMatch as any).PhoneMobile || (appMatch as any).Phone || ''
        };
      }
      return pMatch;
    }

    // 2. Match in NHC / Archive / pvNhcHistory list
    const allNhc = [...(nhcPatients || []), ...nhcArchiveList, ...pvNhcHistory];
    const nhcMatch = allNhc.find((p) => {
      if (!p || !p.PatientID) return false;
      const pid = String(p.PatientID).trim().toLowerCase();
      return pid === cleanSel || (alphaSel && pid.replace(/[^0-9a-zA-Z]/g, '') === alphaSel);
    });

    if (nhcMatch) {
      let resolvedName = getResolvedNhcPatientName(nhcMatch, patients, allNhc, appointments);
      if ((!resolvedName || resolvedName.startsWith('Patient (') || resolvedName.startsWith('Patient PAT-') || resolvedName === 'Patient Record') && appMatch && (appMatch as any).PatientName) {
        resolvedName = (appMatch as any).PatientName;
      }
      const synthPatient: Patient = {
        PatientID: nhcMatch.PatientID,
        PatientName: resolvedName,
        Father_husband: nhcMatch.Father_husband || '',
        AgeYears: nhcMatch.AgeYears || 0,
        Sex: (nhcMatch.Sex as any) || 'Male',
        MaritalStatus: 'Single',
        Occupation: '',
        Address: nhcMatch.Address || '',
        CityID: 1,
        Country: 'Pakistan',
        PhoneMobile: nhcMatch.PhoneMobile || (appMatch as any)?.PhoneMobile || (appMatch as any)?.Phone || '',
        RegistrationDate: nhcMatch.RegistrationDate || new Date().toISOString().split('T')[0]
      };
      return synthPatient;
    }

    // 3. Match directly from appointment record
    if (appMatch) {
      const synthPatient: Patient = {
        PatientID: appMatch.PatientID,
        PatientName: (appMatch as any).PatientName || `Patient ${appMatch.PatientID}`,
        Father_husband: '',
        AgeYears: 0,
        Sex: 'Male',
        MaritalStatus: 'Single',
        Occupation: '',
        Address: '',
        CityID: 1,
        Country: 'Pakistan',
        PhoneMobile: (appMatch as any).PhoneMobile || (appMatch as any).Phone || '',
        RegistrationDate: appMatch.AppointmentDate || new Date().toISOString().split('T')[0]
      };
      return synthPatient;
    }

    // 4. Fallback match in dropdown options
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

    // 5. Ultimate fallback: synthesize patient from ID so selectedPvPatient is never undefined
    const foundVisit = (visits || []).find(v => isSamePatient(v.PatientID, pvSelectedPatientId));
    return {
      PatientID: pvSelectedPatientId,
      PatientName: (foundVisit as any)?.PatientName || `Patient ${pvSelectedPatientId}`,
      Father_husband: '',
      AgeYears: 0,
      Sex: 'Male',
      MaritalStatus: 'Single',
      Occupation: '',
      Address: '',
      CityID: 1,
      Country: 'Pakistan',
      PhoneMobile: '',
      RegistrationDate: new Date().toISOString().split('T')[0]
    };
  })();

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

    const selPat = selectedPvPatient || (patients || []).find(p => isSamePatient(p.PatientID, pvSelectedPatientId));
    const selPatName = selPat?.PatientName && !selPat.PatientName.startsWith('Patient PAT-') ? selPat.PatientName : undefined;

    // 1. From local EMR visits
    (visits || [])
      .filter((v) => isSamePatient(v.PatientID, pvSelectedPatientId) || (selPatName && (v as any).PatientName && String((v as any).PatientName).trim().toLowerCase() === String(selPatName).trim().toLowerCase()))
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

        const vDate = parseCleanVisitDate(v.VisitDate);
        if (vDate) {
          historyItems.push({
            date: vDate,
            source: 'Clinical EMR Visit',
            symptoms: v.SymptomsDiagnosis || 'N/A',
            clinicalMedication: cText || 'None prescribed',
            patientMedication: pText || 'None prescribed',
            medicalReportResult: v.MedicalReportResult && v.MedicalReportResult !== 'N/A' ? v.MedicalReportResult : 'N/A',
            labTestAdvice: v.LabTestAdvice && v.LabTestAdvice !== 'N/A' ? v.LabTestAdvice : 'N/A'
          });
        }
      });

    // 2. From NHC Patient History archive (only if actual patient matches)
    pvNhcHistory
      .filter((nhc) => (nhc.PatientID && isSamePatient(nhc.PatientID, pvSelectedPatientId)) || (selPatName && (nhc.PatientName || (nhc as any).patientName) && String(nhc.PatientName || (nhc as any).patientName).trim().toLowerCase() === String(selPatName).trim().toLowerCase()))
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
        const cleanNhcDate = parseCleanVisitDate(rawNhcDate);

        if (cleanNhcDate) {
          historyItems.push({
            date: cleanNhcDate,
            source: 'NHC Archive',
            symptoms: nhc.SymptomsDiagnosis || nhc.Diagnosis || nhc.Symptoms || nhc.symptoms || nhc.MedicalCondition || 'N/A',
            clinicalMedication: cMed || 'None recorded',
            patientMedication: pMed || 'None recorded',
            medicalReportResult: mrRes !== 'N/A' ? mrRes : 'N/A',
            labTestAdvice: labAdv !== 'N/A' ? labAdv : 'N/A'
          });
        }
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
      appObj?: Appointment;
    }[] = [];

    const seenIds = new Set<string>();
    const selPat = selectedPvPatient || (patients || []).find(p => isSamePatient(p.PatientID, pvSelectedPatientId));
    const selPatName = selPat?.PatientName && !selPat.PatientName.startsWith('Patient PAT-') ? selPat.PatientName : undefined;

    (visits || [])
      .filter((v) => isSamePatient(v.PatientID, pvSelectedPatientId) || (selPatName && (v as any).PatientName && String((v as any).PatientName).trim().toLowerCase() === String(selPatName).trim().toLowerCase()))
      .forEach((v) => {
        if (!seenIds.has(v.VisitID)) {
          seenIds.add(v.VisitID);
          const vDate = parseCleanVisitDate(v.VisitDate);
          if (vDate) {
            list.push({
              id: v.VisitID,
              date: vDate,
              symptoms: v.SymptomsDiagnosis || 'Routine Consultation',
              visitObj: v,
            });
          }
        }
      });

    pvNhcHistory
      .filter((nhc) => (nhc.PatientID && isSamePatient(nhc.PatientID, pvSelectedPatientId)) || (selPatName && (nhc.PatientName || (nhc as any).patientName) && String(nhc.PatientName || (nhc as any).patientName).trim().toLowerCase() === String(selPatName).trim().toLowerCase()))
      .forEach((nhc, idx) => {
        const vId = ('VisitID' in nhc && nhc.VisitID) ? nhc.VisitID : ('date' in nhc ? `NHC-${nhc.date}` : `NHC-${idx}`);
        if (!seenIds.has(vId)) {
          seenIds.add(vId);
          const rawNhcDate = nhc.VisitDate || nhc.RegistrationDate || nhc.Date || nhc.CreatedAt || nhc.date;
          const cleanNhcDate = parseCleanVisitDate(rawNhcDate);
          if (cleanNhcDate) {
            list.push({
              id: vId,
              date: cleanNhcDate,
              symptoms: nhc.SymptomsDiagnosis || nhc.Diagnosis || nhc.Symptoms || nhc.symptoms || 'Routine Consultation',
              nhcObj: nhc,
            });
          }
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
        if (v.ConsultationFee !== undefined && v.ConsultationFee !== null && Number(v.ConsultationFee) > 0) {
          dateFilePkr = String(v.ConsultationFee);
        } else if ((v as any).FileFee && (v as any).FileFee !== '0') {
          dateFilePkr = String((v as any).FileFee);
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
            const opdMatch = rem.match(/OPD Fee PKR\s*(\d+)/i) || rem.match(/Consultation Fee PKR\s*(\d+)/i) || rem.match(/OPD PKR\s*(\d+)/i) || rem.match(/File PKR\s*(\d+)/i);
            if (opdMatch) dateFilePkr = opdMatch[1];
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
        if (!dateFilePkr || dateFilePkr === '0') {
          if ((nhc as any).ConsultationFee !== undefined && (nhc as any).ConsultationFee !== null && Number((nhc as any).ConsultationFee) > 0) {
            dateFilePkr = String((nhc as any).ConsultationFee);
          } else if ((nhc as any).fee !== undefined && (nhc as any).fee !== null && Number((nhc as any).fee) > 0) {
            dateFilePkr = String((nhc as any).fee);
          } else if ((nhc as any).FeeCharged !== undefined && (nhc as any).FeeCharged !== null && Number((nhc as any).FeeCharged) > 0) {
            dateFilePkr = String((nhc as any).FeeCharged);
          } else if ((nhc as any).FileFee && (nhc as any).FileFee !== '0') {
            dateFilePkr = String((nhc as any).FileFee);
          }
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
            const opdMatch = rem.match(/OPD Fee PKR\s*(\d+)/i) || rem.match(/Consultation Fee PKR\s*(\d+)/i) || rem.match(/OPD PKR\s*(\d+)/i) || rem.match(/File PKR\s*(\d+)/i);
            if (opdMatch) dateFilePkr = opdMatch[1];
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

      const selPat = (patients || []).find(p => isSamePatient(p.PatientID, pvSelectedPatientId));
      const selPatName = selPat?.PatientName;

      if (!dateFilePkr || dateFilePkr === '0') {
        const appMatch = (appointments || []).find(
          (a) =>
            (isSamePatient(a.PatientID, pvSelectedPatientId) || (selPatName && (a as any).PatientName && String((a as any).PatientName).trim().toLowerCase() === String(selPatName).trim().toLowerCase())) &&
            parseCleanVisitDate(a.AppointmentDate) === dateStr
        );
        if (appMatch) {
          const appFee = (appMatch as any).PaidAmount || (appMatch as any).ConsultationFee || appMatch.FeeCharged || (appMatch as any).Fee || 0;
          if (appFee) dateFilePkr = String(appFee);
        }
      }
      if (!dateFilePkr || dateFilePkr === '0') {
        const tokMatch = (tokens || []).find(
          (t) =>
            (isSamePatient(t.PatientID, pvSelectedPatientId) || (selPatName && (t as any).PatientName && String((t as any).PatientName).trim().toLowerCase() === String(selPatName).trim().toLowerCase())) &&
            parseCleanVisitDate(t.Date) === dateStr
        );
        if (tokMatch) {
          const tokFee = (tokMatch as any).Fee || (tokMatch as any).PaidAmount || 0;
          if (tokFee) dateFilePkr = String(tokFee);
        }
      }
      // If still 0, check if this patient has a single appointment or if this date matches the patient's most recent appointment
      if (!dateFilePkr || dateFilePkr === '0') {
        const anyApp = (appointments || []).find(
          (a) =>
            (isSamePatient(a.PatientID, pvSelectedPatientId) || (selPatName && (a as any).PatientName && String((a as any).PatientName).trim().toLowerCase() === String(selPatName).trim().toLowerCase())) &&
            (Number(a.FeeCharged) > 0 || Number((a as any).PaidAmount) > 0 || Number((a as any).ConsultationFee) > 0)
        );
        if (anyApp && (filteredDates.length <= 1 || dateStr === parseCleanVisitDate(anyApp.AppointmentDate))) {
          const fallbackFee = (anyApp as any).PaidAmount || (anyApp as any).ConsultationFee || anyApp.FeeCharged || 0;
          if (fallbackFee) dateFilePkr = String(fallbackFee);
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
    const cAddress = clinicSettings?.ClinicAddress || '10 Shalimar Road, Garhi Shahu, Lahore 39 Pakistan';
    const cWebsite = clinicSettings?.Website || 'https://punjabhomeopathic.pk';
    const shiftText = data.shift === 1 ? 'MORNING SHIFT (08:30 AM - 12:00 PM)' : 'EVENING SHIFT (04:30 PM - 09:00 PM)';
    const dateStr = data.date || new Date().toISOString().split('T')[0];
    const timeStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    const thermalConf = getThermalSettings();
    const thermalCss = generateThermalStyles(thermalConf);

    printWin.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Token Slip #${data.tokenNo} - ${data.patientName}</title>
          <meta charset="utf-8" />
          <style>
            ${thermalCss}
            .detail-row { display: flex; justify-content: space-between; align-items: baseline; margin: 2.5px 0; font-size: ${Math.max(9.5, thermalConf.baseFontSize - 1)}px; width: 100%; }
            .detail-label { font-weight: bold; width: 38%; flex-shrink: 0; }
            .detail-val { font-weight: bold; width: 62%; text-align: right; word-break: break-word; }
            .fee-box { font-size: ${thermalConf.baseFontSize + 2}px; font-weight: 900; text-align: center; padding: 4px; border: 1.5px solid #000000; margin-top: 5px; width: 100%; box-sizing: border-box; }
            .footer-msg { font-size: ${Math.max(8.5, thermalConf.baseFontSize - 2.5)}px; text-align: center; margin-top: 6px; font-weight: bold; line-height: 1.35; width: 100%; word-break: break-word; }
          </style>
        </head>
        <body>
          <div class="clinic-header">
            <h2 class="clinic-name">${clinicName}</h2>
            <div class="clinic-sub">OPD CONSULTATION TOKEN SLIP</div>
            ${thermalConf.showHeaderAddress ? `<div style="font-size: ${Math.max(8.5, thermalConf.baseFontSize - 2.5)}px; margin-top: 2px;">${cAddress}</div>` : ''}
            ${thermalConf.showHeaderPhone ? `<div style="font-size: ${Math.max(8.5, thermalConf.baseFontSize - 2.5)}px; font-weight: bold;">📞 ${cPhone} &nbsp;|&nbsp; 🌐 ${cWebsite.replace(/^https?:\/\//, '')}</div>` : ''}
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
              <strong style="font-size: 14px; font-weight: 900; letter-spacing: 0.5px;">🖨️ ${titleStr} Print Preview</strong>
              <span style="font-size: 11px; background: #1e293b; color: #38bdf8; padding: 2px 8px; border-radius: 4px; border: 1px solid #334155;">
                ${selectedPvPatient?.PatientName || 'Patient'} (${selectedPvPatient?.PatientID || ''})
              </span>
            </div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <button class="screen-preview-btn" onclick="window.focus(); window.print();">
                <span>🖨️ Print Now (HP LaserJet / PDF)</span>
              </button>
              <button class="screen-close-btn" onclick="window.close();">
                <span>✕ Close</span>
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
      const mAppFromAppointments = appsForDate.filter(a => a.Shift === 1 && isAppointmentRevenueEligible(a, visitsForDate)).reduce((sum, a) => sum + getEffectiveAppointmentFee(a, visitsForDate), 0);
      const mAppFromVisits = visitsForDate.filter(v => getVisShift(v) === 1).reduce((sum, v) => {
        const fee = Number(v.ConsultationFee) || 0;
        const hasAppFee = appsForDate.some(a => a.PatientID === v.PatientID && a.Shift === 1 && getEffectiveAppointmentFee(a, visitsForDate) > 0);
        return sum + (hasAppFee ? 0 : fee);
      }, 0);
      const mApp = mAppFromAppointments + mAppFromVisits;

      const mCmed = visitsForDate.filter(v => getVisShift(v) === 1).reduce((sum, v) => sum + getVisFees(v).clin, 0);
      const mCards = visitsForDate.filter(v => getVisShift(v) === 1).reduce((sum, v) => sum + getVisFees(v).card, 0);
      const mFile = visitsForDate.filter(v => getVisShift(v) === 1).reduce((sum, v) => sum + getVisFees(v).file, 0);
      const mStore = invoicesForDate.filter(inv => (inv.shift || (inv as any).Shift || 1) === 1).reduce((sum, inv) => sum + (Number(inv.NetAmount || (inv as any).NetPayable || (inv as any).GrandTotal || (inv as any).GAmount || (inv as any).totalAmount) || 0), 0);
      const mTotal = mApp + mCmed + mCards + mFile + mStore;

      // EVENING (Shift 2)
      const eAppFromAppointments = appsForDate.filter(a => a.Shift === 2 && isAppointmentRevenueEligible(a, visitsForDate)).reduce((sum, a) => sum + getEffectiveAppointmentFee(a, visitsForDate), 0);
      const eAppFromVisits = visitsForDate.filter(v => getVisShift(v) === 2).reduce((sum, v) => {
        const fee = Number(v.ConsultationFee) || 0;
        const hasAppFee = appsForDate.some(a => a.PatientID === v.PatientID && a.Shift === 2 && getEffectiveAppointmentFee(a, visitsForDate) > 0);
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

        const appCharges = apps.filter(a => isAppointmentRevenueEligible(a, vis) && getEffectiveAppointmentFee(a, vis) > 0);
        if (appCharges.length > 0) {
          items.push({ count: appCharges.length, description: 'Appointment Charges', amount: appCharges.reduce((sum, a) => sum + getEffectiveAppointmentFee(a, vis), 0) });
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
          const appFee = getEffectiveAppointmentFee(a, visInShift);
          if (appFee > 0) {
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
            if (rec.clinicalFee === 0) {
              rec.clinicalFee += appFee;
            }
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
    const clinicAddress = clinicSettings?.ClinicAddress || '10 Shalimar Road, Garhi Shahu, Lahore 39 Pakistan';
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
              <span>🗓️ Date: ${block.date} &nbsp;|&nbsp; ${block.shiftLabel}</span>
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
    <button onclick="window.print()">🖨️ Print / Save PDF</button>
  </div>

  <div class="header">
    <div class="clinic-title">${clinicName}</div>
    <div class="clinic-address">📍 ${clinicAddress} &nbsp;|&nbsp; 📞 ${phone} &nbsp;|&nbsp; 🌐 ${website.replace(/^https?:\/\//, '')}</div>
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
    <button onclick="window.print()">🖨️ Print / Save PDF</button>
  </div>

  <div class="header">
    <div class="clinic-title">${clinicName}</div>
    <div class="clinic-address">${clinicAddress} • Tel: ${phone}</div>
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
    <button onclick="window.print()">🖨️ Print / Save PDF</button>
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
                <p class="text-[10px] font-extrabold text-emerald-800 tracking-widest uppercase mt-0.5">HEALING NATURALLY. RESTORING BALANCE.</p>
                <p class="text-[11px] font-bold text-slate-800 mt-1">${clinicSettings?.DoctorName || 'Dr. Ejaz Ahmad, D.H.M.S (Pak)'} &nbsp;|&nbsp; PHC Regd. Healthcare Facility</p>
                <p class="text-[10px] text-slate-600 mt-0.5">${clinicSettings?.ClinicAddress || '10 Shalimar Road, Garhi Shahu, Lahore 39 Pakistan'} • Cell: ${clinicSettings?.PhoneMobile || '+92-311-4000608'} • Web: ${(clinicSettings?.Website || 'https://punjabhomeopathic.pk').replace(/^https?:\/\//, '')}</p>
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
        ? `✓ Visit saved for ${prevPatientName} & token checked! Ready for Next Patient: ${nextTokNo ? `[Token #${nextTokNo}] ` : ''}${nextPatName}`
        : `Ready for Next Patient: ${nextTokNo ? `[Token #${nextTokNo}] ` : ''}${nextPatName}`;
      setPvSaveSuccess(msg);
    } else {
      setPvSelectedPatientId('');
      setPvNhcHistory([]);

      const msg = prevPatientName
        ? `✓ Visit saved for ${prevPatientName} & token checked! Queue completed. Desk ready for next patient.`
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

        setPvSaveSuccess(`✓ Visit saved for ${currentPatientName}! Opening print document...`);
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
      setIsRecentVisitsModalOpen(false);
      setIsMultiPatientModalOpen(false);

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

      setActiveSubTab('patient_visit');
      setPrintDocType('A5_VISIT_SLIP');
      setPvPrescriptionModalOpen(true);
      setTimeout(() => {
        handleCleanPrintTab('A5_VISIT_SLIP');
      }, 350);
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
      setActiveSubTab('patient_visit');
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
              <div class="label-subtitle">Usage of Clinical Medicine • Roll Sticker (4" x 8")</div>
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
    try {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window && (window as any).SpeechSynthesisUtterance) {
        const name = getPatientName(tok.PatientID);
        const text = `Attention please, Token number ${tok.TokenNo}, patient ${name}, please proceed to the doctor's room.`;
        try {
          const utterance = new (window as any).SpeechSynthesisUtterance(text);
          utterance.rate = 0.95; // clear and slightly slower for readability
          utterance.pitch = 1.0;
          window.speechSynthesis.speak(utterance);
        } catch (_uttErr) {
          // Fallback if SpeechSynthesisUtterance has an illegal constructor in sandboxed context
        }
      }
    } catch (e) {
      console.warn('Voice announcement error:', e);
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

  const handleImportNhcPatientToRegister = (nhc: NhcPatientHistory) => {
    setPatientName(getResolvedNhcPatientName(nhc));
    setMobilePhone(nhc.PhoneMobile || '');
    setAddress(nhc.Address || '');
    setActiveSubTab('register');
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
          canAdd={canAddPatient}
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
          setActiveSubTab={handleSubTabChange}
          handleImportNhcPatientToRegister={handleImportNhcPatientToRegister}
          getResolvedNhcPatientName={getResolvedNhcPatientName}
        />
      )}

      {/* TOKEN ISSUE SUB-TAB VIEW */}
      {activeSubTab === 'token_issue' && (
        <InstantTokenIssueView
          tokens={tokens}
          patients={patients}
          nhcPatients={nhcPatients}
          nhcArchiveList={nhcArchiveList}
          cities={cities}
          appDate={appDate}
          shift={shift}
          canIssueToken={canAccessTokenIssue}
          canDeleteToken={canDeleteToken}
          onDeleteToken={onDeleteToken}
          onUpdateTokenStatus={onUpdateTokenStatus}
          onPrintThermalSlip={handlePrintThermalFromToken}
          visits={visits}
          appointments={appointments}
          selectedPatientId={searchTerm || pvSelectedPatientId}
          setSelectedPatientId={(id) => {
            setSearchTerm(id);
            setPvSelectedPatientId(id);
          }}
          setOpdTokenModalPatient={(pat) => {
            if (pat) {
              setPvPatientSearch(pat.PatientID);
              setPvSelectedPatientId(pat.PatientID);
            }
          }}
          setTokenIssueMode={() => {}}
          setAppError={setAppError}
          setIsOpdTokenModalOpen={setIsOpdTokenModalOpen}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          fetchNhcArchive={fetchNhcArchive}
          isSearchingArchive={isSearchingArchive}
          filteredPatients={filteredPatients}
          filteredNhcPatients={filteredNhcPatients}
          onAddPatient={onAddPatient}
          handleStartEditPatient={(pat) => {
            handleStartEditPatient(pat);
            setActiveSubTab('register');
          }}
          setActiveSubTab={setActiveSubTab}
        />
      )}

      {activeSubTab === 'patient_visit' && (
        <PatientVisitDeskView
          selectedPvPatient={selectedPvPatient}
          pvPrescriptionModalOpen={pvPrescriptionModalOpen}
          setPvPrescriptionModalOpen={setPvPrescriptionModalOpen}
          handleSendWhatsAppRx={handleSendWhatsAppRx}
          handleCleanPrintTab={handleCleanPrintTab}
          printDocType={printDocType}
          setPrintDocType={setPrintDocType}
          pvOpdFeePkr={pvOpdFeePkr}
          setPvOpdFeePkr={setPvOpdFeePkr}
          pvClinicalMedicinePkr={pvClinicalMedicinePkr}
          setPvClinicalMedicinePkr={setPvClinicalMedicinePkr}
          pvFilePkr={pvFilePkr}
          setPvFilePkr={setPvFilePkr}
          pvCardPkr={pvCardPkr}
          setPvCardPkr={setPvCardPkr}
          pvLabTestAdvice={pvLabTestAdvice}
          setPvLabTestAdvice={setPvLabTestAdvice}
          getLabTestList={getLabTestList}
          shift={shift}
          setShift={setShift}
          showDailyBreakdownMobile={showDailyBreakdownMobile}
          setShowDailyBreakdownMobile={setShowDailyBreakdownMobile}
          shiftDailyCollection={shiftDailyCollection}
          pvPatientSearch={pvPatientSearch}
          setPvPatientSearch={setPvPatientSearch}
          editingVisitId={editingVisitId}
          setEditingVisitId={setEditingVisitId}
          pvSelectedPatientId={pvSelectedPatientId}
          setPvSelectedPatientId={setPvSelectedPatientId}
          pvVisitDate={pvVisitDate}
          setPvVisitDate={setPvVisitDate}
          pvSymptomsDiagnosis={pvSymptomsDiagnosis}
          setPvSymptomsDiagnosis={setPvSymptomsDiagnosis}
          setPvClinicalItems={setPvClinicalItems}
          pvClinicalItems={pvClinicalItems}
          items={items}
          clinicSettings={clinicSettings}
          pvPatientItems={pvPatientItems}
          setPvPatientItems={setPvPatientItems}
          handleSavePatientVisit={handleSavePatientVisit}
          groupedRxByDate={groupedRxByDate}
          tokens={tokens}
          appointments={appointments}
          visits={visits}
          patients={patients}
          nhcPatients={nhcPatients}
          cities={cities}
          addClinicalItem={addClinicalItem}
          removeClinicalItem={removeClinicalItem}
          updateClinicalItem={updateClinicalItem}
          addPatientItem={addPatientItem}
          removePatientItem={removePatientItem}
          updatePatientItem={updatePatientItem}
          handleOpenSmartLocator={handleOpenSmartLocator}
          handleFocusPatientVisitInput={handleFocusPatientVisitInput}
          handleToggleLabTestAdvice={handleToggleLabTestAdvice}
          handleOpenPrintModal={handleOpenPrintModal}
          handlePrintPreviousVisitPrescription={handlePrintPreviousVisitPrescription}
          handlePrintPreviousRxDirect={handlePrintPreviousRxDirect}
          handlePrintDailyReport={handlePrintDailyReport}
          handleAddNewVisit={handleAddNewVisit}
          handleEditVisit={handleEditVisit}
          handleOpenNewPatientModal={handleOpenNewPatientModal}
          handleExecutePatientSearch={handleExecutePatientSearch}
          loadPvPatientHistory={loadPvPatientHistory}
          resetPvConsultationFields={resetPvConsultationFields}
          fetchNhcArchive={fetchNhcArchive}
          allSymptomsText={allSymptomsText}
          allMedicalReportResultsText={allMedicalReportResultsText}
          allLabTestsText={allLabTestsText}
          combinedPreviousHistory={combinedPreviousHistory}
          displayedPreviousHistory={displayedPreviousHistory}
          uniquePvVisitDates={uniquePvVisitDates}
          pvPatientDropdownOptions={pvPatientDropdownOptions}
          pvNhcHistory={pvNhcHistory}
          setPvNhcHistory={setPvNhcHistory}
          nhcArchiveList={nhcArchiveList}
          hidePreviousHistory={hidePreviousHistory}
          setHidePreviousHistory={setHidePreviousHistory}
          isFetchingPvHistory={isFetchingPvHistory}
          isSavingVisit={isSavingVisit}
          isSearchLoadingModal={isSearchLoadingModal}
          pvClinicalMedicineExpireDate={pvClinicalMedicineExpireDate}
          setPvClinicalMedicineExpireDate={setPvClinicalMedicineExpireDate}
          pvMedicalReportResult={pvMedicalReportResult}
          setPvMedicalReportResult={setPvMedicalReportResult}
          pvSelectedHistoryDate={pvSelectedHistoryDate}
          setPvSelectedHistoryDate={setPvSelectedHistoryDate}
          pvSaveSuccess={pvSaveSuccess}
          setPvSaveSuccess={setPvSaveSuccess}
          pvSaveError={pvSaveError}
          setPvLabTestModalOpen={setPvLabTestModalOpen}
          setHistoryAlertModalOpen={setHistoryAlertModalOpen}
          setIsClaimBillModalOpen={setIsClaimBillModalOpen}
          setIsMultiPatientModalOpen={setIsMultiPatientModalOpen}
          setExpireDateByWeeks={setExpireDateByWeeks}
        />
      )}

      {/* GRID-VIEW TAB FOR ALL PATIENTS */}
      {activeSubTab === 'grid_view' && (
        <PatientGridView
          patients={patients}
          nhcPatients={nhcPatients}
          visits={visits}
          visitMedicines={visitMedicines}
          items={items}
          gridViewSearch={gridViewSearch}
          setGridViewSearch={setGridViewSearch}
          nhcArchiveList={nhcArchiveList}
          pvNhcHistory={pvNhcHistory}
          gridViewStartDate={gridViewStartDate}
          setGridViewStartDate={setGridViewStartDate}
          gridViewEndDate={gridViewEndDate}
          setGridViewEndDate={setGridViewEndDate}
          gridViewDatePreset={gridViewDatePreset}
          setGridViewDatePreset={setGridViewDatePreset}
          gridViewGenderFilter={gridViewGenderFilter}
          setGridViewGenderFilter={setGridViewGenderFilter}
          gridViewFocOnly={gridViewFocOnly}
          setGridViewFocOnly={setGridViewFocOnly}
          appointments={appointments}
          invoices={invoices}
          handleOpenRecentVisitsModal={handleOpenRecentVisitsModal}
          setIsDetailReportModalOpen={setIsDetailReportModalOpen}
          openGridVisitSelectorModal={openGridVisitSelectorModal}
          setDeletePatientModalData={setDeletePatientModalData}
        />
      )}

      {/* APPOINTMENTS TAB */}
      {activeSubTab === 'book' && (
        <PatientAppointmentsView
          appointments={appointments}
          patients={patients}
          nhcPatients={nhcPatients}
          visits={visits}
          cities={cities}
          tokens={tokens}
          appDate={appDate}
          setAppDate={setAppDate}
          shift={shift}
          setShift={setShift}
          canAddAppointment={canBookAppointment}
          canDeleteAppointment={canCancelAppointment}
          getPatientName={getPatientName}
          getPatientPhone={getPatientPhone}
        />
      )}

      {/* QUEUE TAB */}
      {activeSubTab === 'queue' && (
        <PatientQueueView
          tokens={tokens}
          appointments={appointments}
          visits={visits}
          patients={patients}
          nhcPatients={nhcPatients}
          appDate={appDate}
          shift={shift}
          setShift={setShift}
          queueStatusFilter={queueStatusFilter}
          setQueueStatusFilter={setQueueStatusFilter}
          queueSearchTerm={queueSearchTerm}
          setQueueSearchTerm={setQueueSearchTerm}
          queueShiftFilter={queueShiftFilter}
          setQueueShiftFilter={setQueueShiftFilter}
          canAddToken={canAccessTokenIssue}
          canCallServeToken={canAccessTokenIssue}
          canDeleteToken={canDeleteToken}
          canPost={canPost}
          onOpenDirectVisitModal={onOpenDirectVisitModal}
          handleCallPatient={handleCallPatient}
          handlePostPayment={handlePostPayment}
          handleCancelQueue={handleCancelQueue}
          handlePrintThermalTokenSlip={handlePrintThermalFromToken}
          getPatientName={getPatientName}
          getPatientPhone={getPatientPhone}
          getPatientAgeGender={getPatientAgeGender}
          onOpenTokenIssue={() => setActiveSubTab('token_issue')}
        />
      )}

      {/* STATUS LCD SUBTAB */}
      {activeSubTab === 'status' && (
        <LargeScreenTokenDisplay
          tokens={tokens}
          patients={patients}
          fullscreenShift={fullscreenShift}
          setFullscreenShift={setFullscreenShift}
          isFullScreenMode={isLcdFullScreenMode}
          setIsFullScreenMode={setIsLcdFullScreenMode}
        />
      )}

      {/* ALL MODALS & DIALOGS */}
      <PatientDeskModals
        allLabTestsText={allLabTestsText}
        allMedicalReportResultsText={allMedicalReportResultsText}
        appDate={appDate}
        appError={appError}
        appSuccess={appSuccess}
        appointments={appointments}
        canAdd={canAdd}
        canBookAppointment={canBookAppointment}
        canIssueToken={canIssueToken}
        claimBillCustomOrg={claimBillCustomOrg}
        claimBillDesignation={claimBillDesignation}
        claimBillEmployeeId={claimBillEmployeeId}
        claimBillOrg={claimBillOrg}
        claimBillRemarks={claimBillRemarks}
        clinicSettings={clinicSettings}
        currentUser={currentUser}
        dailyCollectionReportData={dailyCollectionReportData}
        dailyCollectionReportFormat={dailyCollectionReportFormat}
        deletePatientModalData={deletePatientModalData}
        detailReportMode={detailReportMode}
        detailReportSearch={detailReportSearch}
        detailReportShiftFilter={detailReportShiftFilter}
        directVisitShiftModal={directVisitShiftModal}
        executeDeletePatientRecord={executeDeletePatientRecord}
        executeSavePatientVisit={executeSavePatientVisit}
        existingFee={existingFee}
        fetchNhcArchive={fetchNhcArchive}
        filteredPatients={filteredPatients}
        focReason={focReason}
        focWaivedClinicalFee={focWaivedClinicalFee}
        focWaivedFileCardFee={focWaivedFileCardFee}
        focWaivedOpdFee={focWaivedOpdFee}
        futureBookingModal={futureBookingModal}
        generateDailyCollectionReport={generateDailyCollectionReport}
        getLabTestList={getLabTestList}
        getPatientVisitDateOptions={getPatientVisitDateOptions}
        getResolvedNhcPatientName={getResolvedNhcPatientName}
        gridSelectorMode={gridSelectorMode}
        gridSelectorPatientId={gridSelectorPatientId}
        gridSelectorSelectedDate={gridSelectorSelectedDate}
        gridViewEndDate={gridViewEndDate}
        gridViewStartDate={gridViewStartDate}
        groupedRxByDate={groupedRxByDate}
        handleAddCustomLabTest={handleAddCustomLabTest}
        handleBookAppointment={handleBookAppointment}
        handleCleanPrintDailyCollectionReport={handleCleanPrintDailyCollectionReport}
        handleConfirmDirectVisitToken={handleConfirmDirectVisitToken}
        handleConfirmGridVisitSelection={handleConfirmGridVisitSelection}
        handleIssueTokenForNewPatient={handleIssueTokenForNewPatient}
        handlePrintClaimBill={handlePrintClaimBill}
        handlePrintPreviousVisitPrescription={handlePrintPreviousVisitPrescription}
        handleSaveFromRecentModal={handleSaveFromRecentModal}
        handleSelectPatientFromModal={handleSelectPatientFromModal}
        handleSelectPatientFromMultiModal={handleSelectPatientFromMultiModal}
        handleSelectSmartMedicine={handleSelectSmartMedicine}
        handleToggleLabTestAdvice={handleToggleLabTestAdvice}
        historyAlertModalOpen={historyAlertModalOpen}
        invoices={invoices}
        isClaimBillModalOpen={isClaimBillModalOpen}
        isDailyCollectionReportModalOpen={isDailyCollectionReportModalOpen}
        isDetailReportModalOpen={isDetailReportModalOpen}
        isFetchingPvHistory={isFetchingPvHistory}
        isGridVisitSelectorModalOpen={isGridVisitSelectorModalOpen}
        isMultiPatientModalOpen={isMultiPatientModalOpen}
        isNewPatientSearchModalOpen={isNewPatientSearchModalOpen}
        isOpdTokenModalOpen={isOpdTokenModalOpen}
        isRecentVisitsModalOpen={isRecentVisitsModalOpen}
        isReportDateModalOpen={isReportDateModalOpen}
        isSearchLoadingModal={isSearchLoadingModal}
        isSearchingArchive={isSearchingArchive}
        isSubmittingToken={isSubmittingToken}
        items={items}
        labTests={labTests}
        loadVisitIntoModalForm={loadVisitIntoModalForm}
        modalCardPkr={modalCardPkr}
        modalClinicalItems={modalClinicalItems}
        modalClinicalMedicinePkr={modalClinicalMedicinePkr}
        modalConsultationFee={modalConsultationFee}
        modalEditingVisitId={modalEditingVisitId}
        modalFilePkr={modalFilePkr}
        modalLabTestAdvice={modalLabTestAdvice}
        modalMedicalReportResult={modalMedicalReportResult}
        modalPatentItems={modalPatentItems}
        modalPatientId={modalPatientId}
        modalPatientName={modalPatientName}
        modalRemarks={modalRemarks}
        modalSaveError={modalSaveError}
        modalSaveSuccess={modalSaveSuccess}
        modalSymptomsDiagnosis={modalSymptomsDiagnosis}
        modalVisitDate={modalVisitDate}
        mongoSmartLocatorList={mongoSmartLocatorList}
        multiPatientModalFilter={multiPatientModalFilter}
        multiPatientSearchQuery={multiPatientSearchQuery}
        multiPatientSearchResults={multiPatientSearchResults}
        newPatName={newPatName}
        newPatPhone={newPatPhone}
        newPatRemarks={newPatRemarks}
        newPatientSearchQuery={newPatientSearchQuery}
        nhcArchiveList={nhcArchiveList}
        nhcPatients={nhcPatients}
        opdTokenModalPatient={opdTokenModalPatient}
        openWhatsAppUrl={openWhatsAppUrl}
        patients={patients}
        pvCardPkr={pvCardPkr}
        pvClinicalMedicinePkr={pvClinicalMedicinePkr}
        pvCustomTestInput={pvCustomTestInput}
        pvFilePkr={pvFilePkr}
        pvLabTestAdvice={pvLabTestAdvice}
        pvLabTestModalOpen={pvLabTestModalOpen}
        pvLabTestModalSearch={pvLabTestModalSearch}
        pvNhcHistory={pvNhcHistory}
        pvSmartLocatorModalOpen={pvSmartLocatorModalOpen}
        pvSmartLocatorNotification={pvSmartLocatorNotification}
        pvSmartLocatorSearch={pvSmartLocatorSearch}
        pvSmartLocatorSelectedTag={pvSmartLocatorSelectedTag}
        pvSmartLocatorTargetBox={pvSmartLocatorTargetBox}
        pvVisitDate={pvVisitDate}
        recentModalPatientOnly={recentModalPatientOnly}
        recentModalSearch={recentModalSearch}
        regSuccessData={regSuccessData}
        regSuccessModalOpen={regSuccessModalOpen}
        reportEndDate={reportEndDate}
        reportStartDate={reportStartDate}
        selectedPatientId={selectedPatientId}
        selectedPvPatient={selectedPvPatient}
        selectedReportTypeInModal={selectedReportTypeInModal}
        setAppDate={setAppDate}
        setClaimBillCustomOrg={setClaimBillCustomOrg}
        setClaimBillDesignation={setClaimBillDesignation}
        setClaimBillEmployeeId={setClaimBillEmployeeId}
        setClaimBillOrg={setClaimBillOrg}
        setClaimBillRemarks={setClaimBillRemarks}
        setDailyCollectionEndDate={setDailyCollectionEndDate}
        setDailyCollectionReportData={setDailyCollectionReportData}
        setDailyCollectionReportFormat={setDailyCollectionReportFormat}
        setDailyCollectionStartDate={setDailyCollectionStartDate}
        setDeletePatientModalData={setDeletePatientModalData}
        setDetailReportMode={setDetailReportMode}
        setDetailReportSearch={setDetailReportSearch}
        setDetailReportShiftFilter={setDetailReportShiftFilter}
        setDirectVisitShiftModal={setDirectVisitShiftModal}
        setExistingFee={setExistingFee}
        setFocReason={setFocReason}
        setFocWaivedClinicalFee={setFocWaivedClinicalFee}
        setFocWaivedFileCardFee={setFocWaivedFileCardFee}
        setFocWaivedOpdFee={setFocWaivedOpdFee}
        setFutureBookingModal={setFutureBookingModal}
        setGridSelectorSelectedDate={setGridSelectorSelectedDate}
        setHidePreviousHistory={setHidePreviousHistory}
        setHistoryAlertModalOpen={setHistoryAlertModalOpen}
        setIsClaimBillModalOpen={setIsClaimBillModalOpen}
        setIsDailyCollectionReportModalOpen={setIsDailyCollectionReportModalOpen}
        setIsDetailReportModalOpen={setIsDetailReportModalOpen}
        setIsGridVisitSelectorModalOpen={setIsGridVisitSelectorModalOpen}
        setIsMultiPatientModalOpen={setIsMultiPatientModalOpen}
        setIsNewPatientSearchModalOpen={setIsNewPatientSearchModalOpen}
        setIsOpdTokenModalOpen={setIsOpdTokenModalOpen}
        setIsRecentVisitsModalOpen={setIsRecentVisitsModalOpen}
        setIsReportDateModalOpen={setIsReportDateModalOpen}
        setModalCardPkr={setModalCardPkr}
        setModalClinicalItems={setModalClinicalItems}
        setModalClinicalMedicinePkr={setModalClinicalMedicinePkr}
        setModalConsultationFee={setModalConsultationFee}
        setModalFilePkr={setModalFilePkr}
        setModalLabTestAdvice={setModalLabTestAdvice}
        setModalMedicalReportResult={setModalMedicalReportResult}
        setModalPatentItems={setModalPatentItems}
        setModalPatientId={setModalPatientId}
        setModalPatientName={setModalPatientName}
        setModalRemarks={setModalRemarks}
        setModalSymptomsDiagnosis={setModalSymptomsDiagnosis}
        setModalVisitDate={setModalVisitDate}
        setMultiPatientModalFilter={setMultiPatientModalFilter}
        setNewPatName={setNewPatName}
        setNewPatPhone={setNewPatPhone}
        setNewPatRemarks={setNewPatRemarks}
        setNewPatientSearchQuery={setNewPatientSearchQuery}
        setPvClinicalItems={setPvClinicalItems}
        setPvClinicalMedicineExpireDate={setPvClinicalMedicineExpireDate}
        setPvCustomTestInput={setPvCustomTestInput}
        setPvLabTestAdvice={setPvLabTestAdvice}
        setPvLabTestModalOpen={setPvLabTestModalOpen}
        setPvLabTestModalSearch={setPvLabTestModalSearch}
        setPvMedicalReportResult={setPvMedicalReportResult}
        setPvPatientItems={setPvPatientItems}
        setPvSaveSuccess={setPvSaveSuccess}
        setPvSmartLocatorModalOpen={setPvSmartLocatorModalOpen}
        setPvSmartLocatorSearch={setPvSmartLocatorSearch}
        setPvSmartLocatorSelectedTag={setPvSmartLocatorSelectedTag}
        setPvSmartLocatorTargetBox={setPvSmartLocatorTargetBox}
        setPvSymptomsDiagnosis={setPvSymptomsDiagnosis}
        setRecentModalPatientOnly={setRecentModalPatientOnly}
        setRecentModalSearch={setRecentModalSearch}
        setRegSuccessData={setRegSuccessData}
        setRegSuccessModalOpen={setRegSuccessModalOpen}
        setReportEndDate={setReportEndDate}
        setReportStartDate={setReportStartDate}
        setSelectedReportTypeInModal={setSelectedReportTypeInModal}
        setShift={setShift}
        setShowFocFeeDetailsModal={setShowFocFeeDetailsModal}
        setShowFollowUpConfirmModal={setShowFollowUpConfirmModal}
        setSmsSentToast={setSmsSentToast}
        setTokenIssueMode={setTokenIssueMode}
        setWaCopied={setWaCopied}
        setWaModalMessage={setWaModalMessage}
        setWaModalMobile={setWaModalMobile}
        setWaModalOpen={setWaModalOpen}
        shift={shift}
        showFocFeeDetailsModal={showFocFeeDetailsModal}
        showFollowUpConfirmModal={showFollowUpConfirmModal}
        smartLocatorMedicines={smartLocatorMedicines}
        smsSentToast={smsSentToast}
        tokenIssueMode={tokenIssueMode}
        tokens={tokens}
        visits={visits}
        waCopied={waCopied}
        waModalMessage={waModalMessage}
        waModalMobile={waModalMobile}
        waModalOpen={waModalOpen}
        waModalPatientId={waModalPatientId}
        waModalPatientName={waModalPatientName}
      />
    </div>
  );
}
