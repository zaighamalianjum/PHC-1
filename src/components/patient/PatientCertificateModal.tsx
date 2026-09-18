import React, { useState, useEffect } from 'react';
import {
  X,
  Printer,
  FileCheck,
  Calendar,
  User,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Building2,
  Clock,
  FileText
} from 'lucide-react';
import { Patient, ClinicSettings, MedicalCertificate } from '../../types';
import { formatDisplayDate, ensureAppFullScreen } from './patientDeskUtils';

interface PatientCertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: Patient | null | undefined;
  clinicSettings?: ClinicSettings;
  pvVisitDate?: string;
  pvSymptomsDiagnosis?: string;
  currentUser?: any;
  onAddCertificate?: (c: MedicalCertificate) => void;
}

export default function PatientCertificateModal({
  isOpen,
  onClose,
  patient,
  clinicSettings,
  pvVisitDate,
  pvSymptomsDiagnosis = '',
  currentUser,
  onAddCertificate
}: PatientCertificateModalProps) {
  // Today's date string YYYY-MM-DD
  const todayStr = new Date().toISOString().split('T')[0];
  const defaultFromDate = pvVisitDate && pvVisitDate.length >= 10 ? pvVisitDate.slice(0, 10) : todayStr;

  // Form states
  const [sufferingFrom, setSufferingFrom] = useState('');
  const [restPeriod, setRestPeriod] = useState('07 (Seven) Days');
  const [durationFrom, setDurationFrom] = useState(defaultFromDate);
  const [durationTo, setDurationTo] = useState('');
  const [certificateNo, setCertificateNo] = useState('');
  const [dateIssued, setDateIssued] = useState(todayStr);
  const [doctorRemarks, setDoctorRemarks] = useState('Advised complete bed rest and to avoid physical exertion. Fitness review upon completion of rest.');
  const [printLetterheadMode, setPrintLetterheadMode] = useState<'with_header' | 'pad_spacing'>('with_header');
  const [errorMsg, setErrorMsg] = useState('');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');

  // Helper to calculate end date based on days count
  const calculateEndDate = (start: string, days: number): string => {
    try {
      const d = new Date(start);
      if (isNaN(d.getTime())) return start;
      d.setDate(d.getDate() + (days - 1)); // inclusive
      return d.toISOString().split('T')[0];
    } catch {
      return start;
    }
  };

  // Pre-fill on modal open or patient change
  useEffect(() => {
    if (isOpen) {
      // Auto-generate reference certificate number
      const randomNum = Math.floor(1000 + Math.random() * 9000);
      setCertificateNo(`MC-${new Date().getFullYear()}-${randomNum}`);
      setDateIssued(todayStr);

      const fromD = pvVisitDate && pvVisitDate.length >= 10 ? pvVisitDate.slice(0, 10) : todayStr;
      setDurationFrom(fromD);
      setRestPeriod('07 (Seven) Days');
      setDurationTo(calculateEndDate(fromD, 7));

      // If visit diagnosis exists, pre-fill as suggestion
      if (pvSymptomsDiagnosis && pvSymptomsDiagnosis.trim() && !sufferingFrom) {
        setSufferingFrom(pvSymptomsDiagnosis.trim());
      } else if (!sufferingFrom) {
        setSufferingFrom('Acute Viral Infection & Pyrexia');
      }

      setErrorMsg('');
      setSaveSuccessMsg('');
    }
  }, [isOpen, patient, pvVisitDate]);

  // Handle ESC key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleModalClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  if (!isOpen || !patient) return null;

  const handleModalClose = () => {
    setErrorMsg('');
    setSaveSuccessMsg('');
    onClose();
    ensureAppFullScreen();
  };

  // Quick preset days handler
  const handleSelectDays = (days: number, label: string) => {
    setRestPeriod(label);
    if (durationFrom) {
      setDurationTo(calculateEndDate(durationFrom, days));
    }
  };

  // Gender titles and pronouns
  const isFemale = patient.Sex === 'Female';
  const titlePrefix = isFemale ? (patient.MaritalStatus === 'Married' ? 'Mrs.' : 'Miss') : 'Mr.';
  const genderPronoun = isFemale ? 'her' : 'his';
  const patientDisplayName = patient.PatientName || 'Patient';

  // Common clinical condition quick-chips
  const commonConditions = [
    'Acute Viral Infection & Pyrexia',
    'Severe Gastroenteritis & Dehydration',
    'Typhoid Fever (Enteric Fever)',
    'Lumbar Spondylosis & Acute Backache',
    'Acute Respiratory Infection & Cough',
    'Cervical Spondylosis & Radiculopathy',
    'Physical Exhaustion & General Debility',
    'Severe Migraine Cephalea'
  ];

  // Direct A4 Print on Letterhead
  const handlePrintCertificate = () => {
    if (!sufferingFrom.trim()) {
      setErrorMsg('Please enter what the patient is suffering from.');
      return;
    }
    if (!restPeriod.trim()) {
      setErrorMsg('Please specify the advised rest period.');
      return;
    }
    if (!durationFrom || !durationTo) {
      setErrorMsg('Please specify both From (w.e.f) and To dates.');
      return;
    }

    // Save record if onAddCertificate handler available
    if (onAddCertificate) {
      try {
        const certRecord: MedicalCertificate = {
          CertificateID: certificateNo,
          VisitID: pvVisitDate || 'VIS-ACTIVE',
          PatientID: patient.PatientID,
          SufferingFrom: sufferingFrom.trim(),
          DurationFrom: durationFrom,
          DurationTo: durationTo,
          DateIssued: dateIssued || todayStr
        };
        onAddCertificate(certRecord);
      } catch (e) {
        console.error('Failed to save certificate record:', e);
      }
    }

    const printWin = window.open('', '_blank', 'width=950,height=1100');
    if (!printWin) {
      window.print();
      return;
    }

    const formattedFromDate = formatDisplayDate(durationFrom);
    const formattedToDate = formatDisplayDate(durationTo);
    const formattedIssuedDate = formatDisplayDate(dateIssued || todayStr);

    const clinicName = clinicSettings?.ClinicName || 'PUNJAB HOMEOPATHIC CLINIC';
    const clinicLogo = clinicSettings?.ClinicLogoImage || '/nhc_logo.svg';
    const doctorName = clinicSettings?.DoctorName || 'Dr. Ejaz Ahmad, D.H.M.S (Pak)';
    const clinicAddress = clinicSettings?.ClinicAddress || '10 Shalimar Road, Garhi Shahu, Lahore 39 Pakistan';
    const clinicPhone = clinicSettings?.PhoneMobile || '+92-300-4202383';
    const clinicWeb = (clinicSettings?.Website || 'https://punjabhomeopathic.pk').replace(/^https?:\/\//, '');

    const parentStyles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
      .map((el) => el.outerHTML)
      .join('\n');

    printWin.document.write(`
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="utf-8" />
          <title>Medical Certificate - ${patientDisplayName} (${patient.PatientID})</title>
          ${parentStyles}
          <style>
            @page {
              size: A4 portrait;
              margin: 12mm 15mm;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              color: #0f172a;
              background: #ffffff;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            @media print {
              .no-print { display: none !important; }
              body { margin: 0; padding: 0; }
              .page-break { page-break-after: always; }
            }
            .certificate-border {
              border: 2px solid #0f172a;
              border-radius: 8px;
              padding: 24px 28px;
              position: relative;
              background-color: #ffffff;
            }
            .certificate-border::before {
              content: "";
              position: absolute;
              top: 4px;
              left: 4px;
              right: 4px;
              bottom: 4px;
              border: 1px solid #94a3b8;
              border-radius: 6px;
              pointer-events: none;
            }
            .watermark {
              position: absolute;
              top: 52%;
              left: 50%;
              transform: translate(-50%, -50%) rotate(-25deg);
              font-size: 70px;
              font-weight: 900;
              color: rgba(15, 23, 42, 0.035);
              text-transform: uppercase;
              letter-spacing: 0.25em;
              pointer-events: none;
              white-space: nowrap;
              z-index: 0;
            }
          </style>
        </head>
        <body class="p-6 text-slate-900 max-w-[210mm] mx-auto min-h-screen flex flex-col justify-between">
          
          <!-- Screen Toolbar (hidden in print) -->
          <div class="no-print mb-4 p-3 bg-slate-900 text-white rounded-xl flex items-center justify-between shadow-lg">
            <div class="text-xs font-bold flex items-center space-x-2">
              <span class="bg-emerald-600 px-2 py-0.5 rounded text-white font-mono uppercase">A4 Letter Head Preview</span>
              <span>Medical Certificate for: <strong>${patientDisplayName}</strong> (${patient.PatientID})</span>
            </div>
            <div class="flex items-center space-x-2">
              <button onclick="window.print()" class="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-lg transition cursor-pointer flex items-center space-x-1.5 shadow-md">
                <span>Print Certificate (A4)</span>
              </button>
              <button onclick="window.close()" class="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs rounded-lg transition cursor-pointer">
                <span>Close</span>
              </button>
            </div>
          </div>

          <!-- Main A4 Container -->
          <div class="relative z-10 flex-1 flex flex-col justify-between">
            <div>
              ${
                printLetterheadMode === 'with_header'
                  ? `
                <!-- Official Clinic A4 Letterhead -->
                <div class="border-b-4 border-slate-900 pb-4 mb-5">
                  <div class="flex items-center justify-between gap-4">
                    <!-- Clinic Logo -->
                    <div class="w-20 h-20 shrink-0 flex items-center justify-center">
                      <img src="${clinicLogo}" alt="PHC Logo" style="max-width: 80px; max-height: 80px; object-fit: contain;" />
                    </div>

                    <!-- Center Branding -->
                    <div class="text-center flex-1">
                      <h1 class="text-2xl sm:text-3xl font-black text-red-900 uppercase tracking-tight font-serif" style="color: #7f1d1d;">
                        ${clinicName}
                      </h1>
                      <p class="text-[10px] font-extrabold text-emerald-800 tracking-widest uppercase mt-0.5">
                        HEALING NATURALLY. RESTORING BALANCE.
                      </p>
                      <p class="text-[11px] font-bold text-slate-800 mt-1">
                        ${doctorName} &nbsp;|&nbsp; PHC Regd. Healthcare Facility
                      </p>
                      <p class="text-[10px] text-slate-600 mt-0.5">
                        ${clinicAddress} • Cell: ${clinicPhone} • Web: ${clinicWeb}
                      </p>
                    </div>

                    <!-- Right Verification Badge -->
                    <div class="w-20 h-20 shrink-0 text-right text-[9px] text-slate-500 font-mono hidden sm:flex flex-col items-center justify-center">
                      <div class="border-2 border-slate-800 rounded p-1.5 text-center bg-slate-50 w-full">
                        <span class="block font-black text-slate-900 text-[8px] uppercase">OFFICIAL</span>
                        <span class="block font-black text-emerald-800 text-[9px]">CERTIFICATE</span>
                        <span class="block text-[7px] text-slate-600 font-mono">VERIFIED</span>
                      </div>
                    </div>
                  </div>
                </div>
              `
                  : `
                <!-- Blank spacing for Pre-Printed Stationery Pad -->
                <div style="height: 65mm;"></div>
              `
              }

              <!-- Certificate Inner Frame -->
              <div class="certificate-border relative">
                <div class="watermark">MEDICAL CERTIFICATE</div>

                <!-- Certificate Title Header -->
                <div class="text-center mb-6 relative z-10">
                  <div class="inline-block border-b-2 border-slate-900 pb-1 px-6">
                    <h2 class="text-xl sm:text-2xl font-black tracking-wider text-slate-900 uppercase font-serif">
                      Medical Certificate
                    </h2>
                  </div>
                  <p class="text-[11px] font-semibold text-slate-500 tracking-wide uppercase mt-1">
                    (Medical Fitness & Recommended Rest Period)
                  </p>
                </div>

                <!-- Reference & Date Header Line -->
                <div class="flex items-center justify-between text-xs mb-5 pb-3 border-b border-slate-200 relative z-10 font-mono">
                  <div>
                    <span class="font-bold text-slate-600">Ref / Cert. No:</span>
                    <span class="font-black text-slate-900 ml-1 bg-slate-100 px-2 py-0.5 rounded border border-slate-300">${certificateNo}</span>
                  </div>
                  <div>
                    <span class="font-bold text-slate-600">Date of Issue:</span>
                    <span class="font-bold text-slate-900 ml-1">${formattedIssuedDate}</span>
                  </div>
                </div>

                <!-- Patient Demographics Summary Bar -->
                <div class="bg-slate-50/90 rounded-lg border border-slate-300 p-3 mb-6 relative z-10 text-xs">
                  <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <div>
                      <span class="block text-[9px] font-bold text-slate-500 uppercase">Patient Name</span>
                      <span class="font-black text-slate-900 text-sm uppercase">${titlePrefix} ${patientDisplayName}</span>
                    </div>
                    <div>
                      <span class="block text-[9px] font-bold text-slate-500 uppercase">S/O, D/O, W/O</span>
                      <span class="font-bold text-slate-800">${patient.Father_husband || 'N/A'}</span>
                    </div>
                    <div>
                      <span class="block text-[9px] font-bold text-slate-500 uppercase">Age / Gender</span>
                      <span class="font-bold text-slate-800 font-mono">${patient.AgeYears || '—'} Y / ${patient.Sex}</span>
                    </div>
                    <div>
                      <span class="block text-[9px] font-bold text-slate-500 uppercase">Patient MR ID</span>
                      <span class="font-black text-slate-900 font-mono">${patient.PatientID}</span>
                    </div>
                  </div>
                  ${
                    patient.Address && patient.Address !== 'N/A'
                      ? `
                    <div class="mt-2 pt-2 border-t border-slate-200 text-[11px] text-slate-600">
                      <span class="font-bold text-slate-500">Address:</span> ${patient.Address}
                    </div>
                  `
                      : ''
                  }
                </div>

                <!-- CERTIFICATE BODY - EXACT WORDING REQUESTED BY USER -->
                <div class="space-y-6 text-slate-900 text-[15px] leading-relaxed relative z-10 px-2 sm:px-4">
                  
                  <!-- Clause 1 -->
                  <div class="flex items-start space-x-2">
                    <span class="font-black text-slate-900 text-base">1.</span>
                    <p class="text-justify flex-1">
                      This is to certify that 
                      <span class="font-black text-slate-950 border-b border-slate-900 pb-0.5 px-1">${titlePrefix} ${patientDisplayName}</span>, 
                      is suffering from 
                      <span class="font-black text-slate-950 border-b border-slate-900 pb-0.5 px-1 bg-amber-50/60">${sufferingFrom}</span>.
                    </p>
                  </div>

                  <!-- Clause 2 -->
                  <div class="flex items-start space-x-2">
                    <span class="font-black text-slate-900 text-base">2.</span>
                    <p class="text-justify flex-1">
                      <span class="font-black text-slate-950 border-b border-slate-900 pb-0.5 px-1">${titlePrefix} ${patientDisplayName}</span> 
                      is under my Treatment and in my opinion a rest period of 
                      <span class="font-black text-slate-950 border-b border-slate-900 pb-0.5 px-1 bg-amber-50/60">${restPeriod}</span> 
                      w.e.f 
                      <span class="font-black text-slate-950 border-b border-slate-900 pb-0.5 px-1 font-mono">${formattedFromDate}</span> 
                      to 
                      <span class="font-black text-slate-950 border-b border-slate-900 pb-0.5 px-1 font-mono">${formattedToDate}</span> 
                      is required for ${genderPronoun} complete restoration and fitness.
                    </p>
                  </div>

                  ${
                    doctorRemarks && doctorRemarks.trim()
                      ? `
                    <!-- Additional Doctor's Recommendation / Advice -->
                    <div class="mt-4 p-3 bg-slate-50/80 rounded border-l-4 border-slate-800 text-xs text-slate-700">
                      <span class="font-black text-slate-900 uppercase block text-[10px] tracking-wider mb-0.5">Special Advice / Clinical Directions:</span>
                      <p class="italic text-slate-800">${doctorRemarks}</p>
                    </div>
                  `
                      : ''
                  }
                </div>

                <!-- Verification Disclaimer -->
                <div class="mt-8 pt-4 border-t border-dashed border-slate-300 text-[10px] text-slate-500 relative z-10">
                  <p class="italic">
                    * This certificate is issued based on professional clinical examination at ${clinicName}. Not valid for court of law unless accompanied by official registration stamp and signature.
                  </p>
                </div>
              </div>
            </div>

            <!-- Sign-Off & Official Seal Section -->
            <div class="mt-12 pt-4 border-t border-slate-200">
              <div class="flex items-end justify-between">
                <!-- Left: Clinic Seal Placeholder -->
                <div class="text-left">
                  <div class="w-32 h-20 border border-dashed border-slate-300 rounded flex flex-col items-center justify-center text-slate-400 text-[9px] p-2 text-center bg-slate-50/50">
                    <span class="font-bold uppercase tracking-wider text-slate-500">Official Seal</span>
                    <span class="text-[8px] text-slate-400 mt-0.5">${clinicName}</span>
                  </div>
                  <p class="text-[10px] font-mono text-slate-500 mt-1">Issued On: ${formattedIssuedDate}</p>
                </div>

                <!-- Right: Doctor Signature & Reg -->
                <div class="text-right min-w-[220px]">
                  <div class="h-12 flex items-end justify-end mb-1">
                    <span class="text-xs font-serif italic text-slate-400 font-semibold">(Authorized Signature)</span>
                  </div>
                  <div class="border-t-2 border-slate-900 pt-1.5">
                    <p class="font-black text-sm text-slate-900 uppercase">${doctorName}</p>
                    <p class="text-[10px] font-bold text-slate-600">Consultant Homeopathic Physician</p>
                    <p class="text-[9px] text-slate-500 font-mono">Reg. No: DHMS-PK-2004 / NCH Registered</p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </body>
      </html>
    `);

    printWin.document.close();
  };

  return (
    <div
      className="fixed inset-0 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleModalClose();
        }
      }}
    >
      <div
        className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-auto flex flex-col max-h-[92vh]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="certificate-modal-title"
      >
        {/* Modal Header */}
        <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 id="certificate-modal-title" className="text-sm font-bold text-white tracking-tight">
                  Medical Rest & Fitness Certificate
                </h3>
                <span className="text-[10px] font-mono font-bold bg-amber-950 text-amber-300 px-2 py-0.5 rounded border border-amber-800">
                  A4 Letterhead
                </span>
              </div>
              <p className="text-[11px] text-slate-300">
                Generate official medical rest certificate with customized illness, w.e.f from and to dates
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleModalClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition cursor-pointer"
            title="Close (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs">
          {/* Selected Patient Banner */}
          <div className="bg-gradient-to-r from-amber-50 via-slate-50 to-amber-50/40 p-3.5 rounded-xl border border-amber-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-full bg-amber-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                {titlePrefix}
              </div>
              <div>
                <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">
                  Certificate Patient
                </span>
                <span className="text-sm font-black text-slate-900 uppercase">
                  {patientDisplayName}
                </span>
                <span className="text-xs font-mono font-bold text-amber-900 ml-2">
                  ({patient.PatientID})
                </span>
                <div className="text-[11px] text-slate-600 mt-0.5">
                  <span>S/O, D/O, W/O: <strong>{patient.Father_husband || 'N/A'}</strong></span>
                  <span className="mx-1.5">•</span>
                  <span>Age: <strong>{patient.AgeYears || '—'} Y</strong></span>
                  <span className="mx-1.5">•</span>
                  <span>Gender: <strong>{patient.Sex}</strong></span>
                </div>
              </div>
            </div>

            <div className="text-right shrink-0">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Visit Date</span>
              <span className="text-xs font-mono font-extrabold text-slate-900">
                {formatDisplayDate(pvVisitDate || todayStr)}
              </span>
            </div>
          </div>

          {/* Validation Alert */}
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-semibold flex items-center space-x-2 animate-in fade-in">
              <span>⚠️ {errorMsg}</span>
            </div>
          )}

          {/* Form Fields Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* 1. Suffering From */}
            <div className="sm:col-span-2 space-y-1.5">
              <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-800">
                1. Suffering From (Illness / Diagnosis) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Stethoscope className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  value={sufferingFrom}
                  onChange={(e) => setSufferingFrom(e.target.value)}
                  placeholder="e.g. Acute Viral Infection & High Fever"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 focus:bg-white border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 transition text-xs"
                />
              </div>

              {/* Quick condition chips */}
              <div className="flex flex-wrap gap-1 pt-1">
                <span className="text-[10px] font-bold text-slate-500 self-center mr-1">Suggestions:</span>
                {commonConditions.map((cond) => (
                  <button
                    key={cond}
                    type="button"
                    onClick={() => setSufferingFrom(cond)}
                    className={`text-[10px] px-2 py-0.5 rounded-md font-medium transition cursor-pointer border ${
                      sufferingFrom === cond
                        ? 'bg-amber-600 text-white border-amber-600 font-bold'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                    }`}
                  >
                    {cond}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Rest Period */}
            <div className="sm:col-span-2 space-y-1.5">
              <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-800">
                2. Rest Period Duration <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Clock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  value={restPeriod}
                  onChange={(e) => setRestPeriod(e.target.value)}
                  placeholder="e.g. 07 (Seven) Days or 02 (Two) Weeks"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 focus:bg-white border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 transition text-xs"
                />
              </div>

              {/* Quick Days Selector Chips */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {[
                  { days: 3, label: '03 (Three) Days' },
                  { days: 5, label: '05 (Five) Days' },
                  { days: 7, label: '07 (Seven) Days' },
                  { days: 10, label: '10 (Ten) Days' },
                  { days: 14, label: '14 Days (Two Weeks)' },
                  { days: 21, label: '21 Days (Three Weeks)' },
                  { days: 30, label: '01 (One) Month' }
                ].map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => handleSelectDays(item.days, item.label)}
                    className={`text-[10px] px-2.5 py-1 rounded-lg font-bold transition cursor-pointer border ${
                      restPeriod === item.label
                        ? 'bg-amber-600 text-white border-amber-600 shadow-2xs'
                        : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-200'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* w.e.f (From Date) */}
            <div>
              <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-800 mb-1">
                Rest w.e.f (From Date) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="date"
                  required
                  value={durationFrom}
                  onChange={(e) => {
                    const newFrom = e.target.value;
                    setDurationFrom(newFrom);
                    // If 7 days default
                    if (newFrom) {
                      setDurationTo(calculateEndDate(newFrom, 7));
                    }
                  }}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 focus:bg-white border border-slate-300 rounded-xl font-bold font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 transition text-xs"
                />
              </div>
            </div>

            {/* To Date */}
            <div>
              <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-800 mb-1">
                To Date <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="date"
                  required
                  value={durationTo}
                  onChange={(e) => setDurationTo(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 focus:bg-white border border-slate-300 rounded-xl font-bold font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 transition text-xs"
                />
              </div>
            </div>

            {/* Certificate Serial No. */}
            <div>
              <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-800 mb-1">
                Certificate Number
              </label>
              <input
                type="text"
                value={certificateNo}
                onChange={(e) => setCertificateNo(e.target.value)}
                placeholder="MC-2026-XXXX"
                className="w-full px-3 py-2 bg-slate-50 focus:bg-white border border-slate-300 rounded-xl font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 transition text-xs"
              />
            </div>

            {/* Date Issued */}
            <div>
              <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-800 mb-1">
                Date Issued
              </label>
              <input
                type="date"
                value={dateIssued}
                onChange={(e) => setDateIssued(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 focus:bg-white border border-slate-300 rounded-xl font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 transition text-xs"
              />
            </div>

            {/* Additional Advice / Notes */}
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-800 mb-1">
                Doctor Advice / Clinical Notes (Optional)
              </label>
              <input
                type="text"
                value={doctorRemarks}
                onChange={(e) => setDoctorRemarks(e.target.value)}
                placeholder="e.g. Advised complete bed rest, light diet, and avoid exertion."
                className="w-full px-3 py-2 bg-slate-50 focus:bg-white border border-slate-300 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 transition text-xs"
              />
            </div>

            {/* Print Header Option */}
            <div className="sm:col-span-2 p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-700">Printing Mode:</span>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setPrintLetterheadMode('with_header')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition border cursor-pointer ${
                    printLetterheadMode === 'with_header'
                      ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Full Letterhead (Plain Paper)
                </button>
                <button
                  type="button"
                  onClick={() => setPrintLetterheadMode('pad_spacing')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition border cursor-pointer ${
                    printLetterheadMode === 'pad_spacing'
                      ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Pre-Printed Pad (Top Space)
                </button>
              </div>
            </div>
          </div>

          {/* LIVE PREVIEW OF THE EXACT CERTIFICATE TEXT */}
          <div className="border-2 border-amber-200 bg-amber-50/40 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-amber-200/80 pb-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-900 flex items-center space-x-1">
                <FileText className="w-3.5 h-3.5 text-amber-700" />
                <span>Live Certificate Text Preview</span>
              </span>
              <span className="text-[10px] font-mono font-bold text-amber-800">
                {clinicSettings?.ClinicName || 'PUNJAB HOMEOPATHIC CLINIC'}
              </span>
            </div>

            <div className="space-y-3 text-xs text-slate-800 leading-relaxed font-sans">
              <p className="p-2 bg-white/90 rounded border border-amber-100 shadow-2xs">
                <strong>1.</strong> This is to certify that{' '}
                <span className="font-black text-slate-900 underline underline-offset-2">
                  {titlePrefix} {patientDisplayName}
                </span>
                , is suffering from{' '}
                <span className="font-black text-emerald-800 bg-emerald-50 px-1 py-0.5 rounded border border-emerald-200">
                  {sufferingFrom || '__________'}
                </span>
                .
              </p>

              <p className="p-2 bg-white/90 rounded border border-amber-100 shadow-2xs">
                <strong>2.</strong>{' '}
                <span className="font-black text-slate-900 underline underline-offset-2">
                  {titlePrefix} {patientDisplayName}
                </span>{' '}
                is under my Treatment and in my opinion a rest period of{' '}
                <span className="font-black text-amber-900 bg-amber-100 px-1 py-0.5 rounded border border-amber-300">
                  {restPeriod || '__________'}
                </span>{' '}
                w.e.f{' '}
                <span className="font-bold text-slate-900 font-mono underline underline-offset-2">
                  {formatDisplayDate(durationFrom) || '__________'}
                </span>{' '}
                to{' '}
                <span className="font-bold text-slate-900 font-mono underline underline-offset-2">
                  {formatDisplayDate(durationTo) || '__________'}
                </span>{' '}
                is required for {genderPronoun} complete restoration and fitness.
              </p>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-1.5 text-slate-500 text-[11px]">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Ready to print on standard A4 portrait letterhead</span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handleModalClose}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handlePrintCertificate}
              className="px-5 py-2 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-extrabold text-xs rounded-xl transition flex items-center space-x-1.5 cursor-pointer shadow-md"
            >
              <Printer className="w-4 h-4" />
              <span>Print A4 Certificate</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
