import React, { useState, useMemo } from 'react';
import {
  Search,
  Users,
  UserCheck,
  Calendar,
  Phone,
  MapPin,
  FileText,
  Stethoscope,
  Ticket,
  CalendarPlus,
  Pencil,
  Printer,
  ChevronRight,
  TrendingUp,
  Clock,
  HeartPulse,
  Pill,
  Coins,
  CreditCard,
  Building,
  CheckCircle2,
  AlertCircle,
  FlaskConical,
  MessageCircle,
  ShieldCheck,
  User,
  Activity,
  ArrowUpRight,
  FileBadge
} from 'lucide-react';
import {
  Patient,
  Visit,
  VisitMedicine,
  Appointment,
  City,
  NhcPatientHistory,
  ClinicSettings,
  User as UserType
} from '../../types';
import { formatDisplayDate } from './patientDeskUtils';
import { generateWhatsAppPrescriptionUrl, openWhatsAppUrl } from '../../utils/whatsappUtils';

interface PatientProfileViewProps {
  patients: Patient[];
  visits: Visit[];
  visitMedicines?: VisitMedicine[];
  appointments: Appointment[];
  tokens: any[];
  cities: City[];
  nhcPatients?: NhcPatientHistory[];
  selectedPatientId: string;
  setSelectedPatientId: (id: string) => void;
  onOpenVisitDesk: (patientId: string) => void;
  onOpenTokenIssue: (patientId: string) => void;
  onOpenBookAppointment: (patientId: string) => void;
  onEditPatient: (patient: Patient) => void;
  clinicSettings?: ClinicSettings;
  currentUser?: UserType;
}

export default function PatientProfileView({
  patients = [],
  visits = [],
  visitMedicines = [],
  appointments = [],
  tokens = [],
  cities = [],
  nhcPatients = [],
  selectedPatientId,
  setSelectedPatientId,
  onOpenVisitDesk,
  onOpenTokenIssue,
  onOpenBookAppointment,
  onEditPatient,
  clinicSettings,
  currentUser
}: PatientProfileViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [historyFilterDate, setHistoryFilterDate] = useState<string>('ALL');

  // Find currently selected patient
  const selectedPatient = useMemo(() => {
    if (!selectedPatientId) return null;
    return patients.find(
      (p) => String(p.PatientID).trim().toLowerCase() === String(selectedPatientId).trim().toLowerCase()
    ) || null;
  }, [selectedPatientId, patients]);

  // Combine search matching patients
  const searchResults = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return patients.slice(0, 50);

    return patients.filter((p) => {
      const name = String(p.PatientName || '').toLowerCase();
      const id = String(p.PatientID || '').toLowerCase();
      const phone = String(p.PhoneMobile || '').toLowerCase();
      const cnic = String((p as any).CNIC || '').toLowerCase();
      const fName = String(p.Father_husband || (p as any).FatherHusband || '').toLowerCase();
      const addr = String(p.Address || '').toLowerCase();

      return (
        name.includes(term) ||
        id.includes(term) ||
        phone.includes(term) ||
        cnic.includes(term) ||
        fName.includes(term) ||
        addr.includes(term)
      );
    });
  }, [searchTerm, patients]);

  // All visits for selected patient
  const patientVisits = useMemo(() => {
    if (!selectedPatient) return [];
    const patId = String(selectedPatient.PatientID).trim().toLowerCase();

    // 1. Local visits
    const local = (visits || []).filter(
      (v) => String(v.PatientID).trim().toLowerCase() === patId
    );

    // 2. NHC Archive visits if any
    const nhc = (nhcPatients || []).filter(
      (n) => String(n.PatientID).trim().toLowerCase() === patId
    );

    // Map each visit to unified structure
    const allMapped: Array<{
      id: string;
      date: string;
      rawDate: string;
      doctorName: string;
      symptoms: string;
      physicalExam: string;
      labTestAdvice: string;
      patientAdvice: string;
      vitals: {
        bp?: string;
        pulse?: string;
        temp?: string;
        weight?: string;
        sugar?: string;
        spo2?: string;
      };
      clinicalItems: Array<{
        name: string;
        dosage: string;
        type: 'C' | 'P';
        expireDate?: string;
      }>;
      patentItems: Array<{
        name: string;
        dosage: string;
        type: 'C' | 'P';
      }>;
      // Financial breakdown
      appointmentFee: number;
      clinicalMedicineFee: number;
      cardFee: number;
      totalPaid: number;
      remarks?: string;
    }> = [];

    // Process local visits
    local.forEach((v) => {
      const vDate = v.VisitDate ? v.VisitDate.split('T')[0] : '';
      const vMeds = (visitMedicines || []).filter((m) => m.VisitID === v.VisitID);

      const cItems: any[] = [];
      const pItems: any[] = [];

      if (vMeds.length > 0) {
        vMeds.forEach((m) => {
          const mName = m.MedicineDetail || m.ItemID || 'Prescribed Medicine';
          const mDose = m.Dosage || 'As directed';
          if (m.MedicineType === 'C') {
            cItems.push({ name: mName, dosage: mDose, type: 'C', expireDate: m.ExpireDate });
          } else {
            pItems.push({ name: mName, dosage: mDose, type: 'P' });
          }
        });
      } else if (v.VisitRemarks) {
        if (v.VisitRemarks.includes('Clinical:')) {
          const parts = v.VisitRemarks.split('|');
          const cPart = parts.find((p) => p.includes('Clinical:'));
          const pPart = parts.find((p) => p.includes('Patent:'));
          if (cPart) {
            const rawC = cPart.replace('Clinical:', '').trim();
            if (rawC && rawC !== 'None prescribed') {
              cItems.push({ name: rawC, dosage: 'As directed', type: 'C' });
            }
          }
          if (pPart) {
            const rawP = pPart.replace('Patent:', '').trim();
            if (rawP && rawP !== 'None prescribed') {
              pItems.push({ name: rawP, dosage: 'As directed', type: 'P' });
            }
          }
        }
      }

      // Extract payments
      let appFee = Number(v.ConsultationFee) || 0;
      if (!appFee && (v as any).FileFee) appFee = Number((v as any).FileFee) || 0;

      let clinFee = Number(v.ClinicalMedicinePayment) || 0;
      if (!clinFee && v.VisitRemarks) {
        const cMatch = v.VisitRemarks.match(/Clinical Meds PKR\s*(\d+)/i);
        if (cMatch) clinFee = Number(cMatch[1]) || 0;
      }

      let cFee = Number(v.CardsPayment) || Number((v as any).CardFee) || 0;

      // Look in appointments / tokens for this date
      if (appFee === 0) {
        const matchingApp = appointments.find(
          (a) =>
            String(a.PatientID).trim().toLowerCase() === patId &&
            a.AppointmentDate &&
            a.AppointmentDate.split('T')[0] === vDate
        );
        if (matchingApp) {
          appFee = Number((matchingApp as any).PaidAmount || (matchingApp as any).ConsultationFee || matchingApp.FeeCharged || 0);
        }
      }

      if (appFee === 0) {
        const matchingTok = tokens.find(
          (t) =>
            String(t.PatientID).trim().toLowerCase() === patId &&
            t.Date &&
            t.Date.split('T')[0] === vDate
        );
        if (matchingTok) {
          appFee = Number(matchingTok.Fee || matchingTok.PaidAmount || 0);
        }
      }

      allMapped.push({
        id: v.VisitID,
        date: formatDisplayDate(v.VisitDate),
        rawDate: vDate,
        doctorName: (v as any).DoctorName || clinicSettings?.DoctorName || 'Consultant Physician',
        symptoms: v.SymptomsDiagnosis || 'Routine Checkup & Examination',
        physicalExam: v.MedicalReportResult || '',
        labTestAdvice: v.LabTestAdvice || '',
        patientAdvice: v.PatientAdvice || '',
        vitals: {
          bp: (v as any).BloodPressure,
          pulse: (v as any).PulseRate ? String((v as any).PulseRate) : undefined,
          temp: (v as any).Temperature ? String((v as any).Temperature) : undefined,
          weight: (v as any).Weight ? String((v as any).Weight) : undefined,
          sugar: (v as any).BloodSugar,
          spo2: (v as any).OxygenSaturation ? String((v as any).OxygenSaturation) : undefined
        },
        clinicalItems: cItems,
        patentItems: pItems,
        appointmentFee: appFee,
        clinicalMedicineFee: clinFee,
        cardFee: cFee,
        totalPaid: appFee + clinFee + cFee,
        remarks: v.VisitRemarks
      });
    });

    // Process NHC visits if unique
    nhc.forEach((n) => {
      const nDate = n.VisitDate || n.RegistrationDate || (n as any).Date || '';
      const rawD = nDate.split('T')[0];
      const isAlreadyIn = allMapped.some((m) => m.rawDate === rawD);
      if (!isAlreadyIn) {
        const cItems: any[] = [];
        const pItems: any[] = [];
        if (n.clinicalMedication && n.clinicalMedication !== 'None prescribed') {
          n.clinicalMedication.split('\n').filter(Boolean).forEach((line) => {
            const parts = line.split(' - ');
            cItems.push({ name: parts[0]?.trim() || line, dosage: parts[1]?.trim() || 'As directed', type: 'C' });
          });
        }
        if (n.patientMedication && n.patientMedication !== 'None prescribed') {
          n.patientMedication.split('\n').filter(Boolean).forEach((line) => {
            const parts = line.split(' - ');
            pItems.push({ name: parts[0]?.trim() || line, dosage: parts[1]?.trim() || 'As directed', type: 'P' });
          });
        }

        let appFee = Number((n as any).ConsultationFee) || Number((n as any).FileFee) || 0;
        let clinFee = Number((n as any).ClinicalMedicinePayment) || 0;

        allMapped.push({
          id: (n as any).id || (n as any)._id || `NHC-${rawD}`,
          date: formatDisplayDate(nDate),
          rawDate: rawD,
          doctorName: clinicSettings?.DoctorName || 'Consultant Physician',
          symptoms: n.SymptomsDiagnosis || n.Diagnosis || 'OPD Consultation',
          physicalExam: n.MedicalReportResult || '',
          labTestAdvice: n.LabTestAdvice || n.LabTests || '',
          patientAdvice: (n as any).PatientAdvice || '',
          vitals: {
            bp: (n as any).BloodPressure,
            pulse: (n as any).PulseRate ? String((n as any).PulseRate) : undefined,
            temp: (n as any).Temperature ? String((n as any).Temperature) : undefined,
            weight: (n as any).Weight ? String((n as any).Weight) : undefined,
            sugar: (n as any).BloodSugar,
            spo2: (n as any).OxygenSaturation
          },
          clinicalItems: cItems,
          patentItems: pItems,
          appointmentFee: appFee,
          clinicalMedicineFee: clinFee,
          cardFee: 0,
          totalPaid: appFee + clinFee
        });
      }
    });

    // Sort descending by date
    return allMapped.sort((a, b) => (b.rawDate || '').localeCompare(a.rawDate || ''));
  }, [selectedPatient, visits, visitMedicines, nhcPatients, appointments, tokens, clinicSettings]);

  // Aggregate Patient Stats
  const patientStats = useMemo(() => {
    const totalVisitsCount = patientVisits.length;
    const totalConsultationPaid = patientVisits.reduce((sum, v) => sum + (v.appointmentFee || 0), 0);
    const totalClinicalMedsPaid = patientVisits.reduce((sum, v) => sum + (v.clinicalMedicineFee || 0), 0);
    const totalLifetimePaid = totalConsultationPaid + totalClinicalMedsPaid;

    const totalPrescriptionsCount = patientVisits.reduce(
      (sum, v) => sum + v.clinicalItems.length + v.patentItems.length,
      0
    );

    const firstVisit = patientVisits.length > 0 ? patientVisits[patientVisits.length - 1]?.date : 'None';
    const lastVisit = patientVisits.length > 0 ? patientVisits[0]?.date : 'None';

    return {
      totalVisitsCount,
      totalConsultationPaid,
      totalClinicalMedsPaid,
      totalLifetimePaid,
      totalPrescriptionsCount,
      firstVisit,
      lastVisit
    };
  }, [patientVisits]);

  // Filtered visits by date selection
  const displayedVisits = useMemo(() => {
    if (historyFilterDate === 'ALL') return patientVisits;
    return patientVisits.filter((v) => v.rawDate === historyFilterDate);
  }, [patientVisits, historyFilterDate]);

  // Resolved city name
  const cityName = useMemo(() => {
    if (!selectedPatient) return 'N/A';
    const c = cities.find((ct) => ct.CityID === selectedPatient.CityID);
    return c ? c.CityName : 'N/A';
  }, [selectedPatient, cities]);

  // Print Patient Profile & Medical History Sheet
  const handlePrintPatientProfile = () => {
    if (!selectedPatient) return;
    const cName = clinicSettings?.ClinicName || 'Pakistan Homoeopathic Clinic';
    const cPhone = clinicSettings?.PhoneMobile || (clinicSettings as any)?.Phone || '0300-1234567';
    const cAddress = clinicSettings?.ClinicAddress || (clinicSettings as any)?.Address || 'Main Boulevard, Clinic Area';
    const docName = clinicSettings?.DoctorName || 'Dr. Zaigham Ali Anjum';

    const printWin = window.open('', '_blank');
    if (!printWin) {
      alert('Please allow popups to print Patient Profile Sheet.');
      return;
    }

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Patient Profile & Clinical History - ${selectedPatient.PatientName}</title>
        <style>
          @page { size: A4; margin: 15mm; }
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 11pt; color: #1e293b; margin: 0; padding: 0; line-height: 1.4; }
          .header { border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: flex-start; }
          .clinic-name { font-size: 18pt; font-weight: 800; color: #0f172a; }
          .clinic-sub { font-size: 9pt; color: #475569; }
          .doc-badge { text-align: right; }
          .doc-name { font-size: 12pt; font-weight: 700; color: #1e3a8a; }
          .title-bar { background: #f1f5f9; border: 1px solid #cbd5e1; padding: 8px 12px; font-size: 13pt; font-weight: 800; text-transform: uppercase; color: #0f172a; text-align: center; margin-bottom: 16px; border-radius: 4px; }
          .section-title { font-size: 11pt; font-weight: 800; color: #0f172a; border-bottom: 1.5px solid #cbd5e1; padding-bottom: 4px; margin-top: 16px; margin-bottom: 8px; text-transform: uppercase; }
          .info-table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
          .info-table td { padding: 5px 8px; font-size: 10pt; border: 1px solid #e2e8f0; }
          .info-table .label { background: #f8fafc; font-weight: 700; width: 22%; color: #334155; }
          .info-table .val { width: 28%; font-weight: 600; color: #0f172a; }
          .stats-grid { display: flex; gap: 8px; margin-bottom: 16px; }
          .stat-box { flex: 1; background: #f8fafc; border: 1px solid #cbd5e1; padding: 8px; border-radius: 4px; text-align: center; }
          .stat-box .num { font-size: 14pt; font-weight: 800; color: #1e3a8a; }
          .stat-box .lbl { font-size: 8pt; text-transform: uppercase; color: #64748b; font-weight: 700; }
          .visit-card { border: 1px solid #94a3b8; border-radius: 6px; padding: 10px; margin-bottom: 14px; page-break-inside: avoid; background: #fff; }
          .visit-header { display: flex; justify-content: space-between; border-bottom: 1px dashed #cbd5e1; padding-bottom: 6px; margin-bottom: 8px; font-weight: 700; }
          .visit-date { color: #1e3a8a; font-size: 11pt; font-weight: 800; }
          .payment-bar { background: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 4px; padding: 6px 10px; margin-top: 8px; display: flex; justify-content: space-between; font-size: 9pt; font-weight: 700; }
          .med-table { width: 100%; border-collapse: collapse; margin-top: 6px; }
          .med-table th, .med-table td { border: 1px solid #cbd5e1; padding: 4px 6px; font-size: 9pt; text-align: left; }
          .med-table th { background: #f1f5f9; font-weight: 800; font-size: 8.5pt; text-transform: uppercase; }
          .footer { text-align: center; font-size: 8pt; color: #64748b; border-top: 1px solid #cbd5e1; padding-top: 8px; margin-top: 24px; }
          @media print { button { display: none !important; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="clinic-name">${cName}</div>
            <div class="clinic-sub">${cAddress} • Tel: ${cPhone}</div>
          </div>
          <div class="doc-badge">
            <div class="doc-name">${docName}</div>
            <div class="clinic-sub">Consultant Homeopathic Physician</div>
          </div>
        </div>

        <div class="title-bar">PATIENT PROFILE & COMPLETE CLINICAL VISIT HISTORY</div>

        <table class="info-table">
          <tr>
            <td class="label">Patient MR / ID:</td>
            <td class="val" style="font-size: 11pt; color: #1e3a8a;">${selectedPatient.PatientID}</td>
            <td class="label">Registration Date:</td>
            <td class="val">${formatDisplayDate(selectedPatient.RegistrationDate || selectedPatient.CreatedAt)}</td>
          </tr>
          <tr>
            <td class="label">Patient Full Name:</td>
            <td class="val" style="font-size: 11pt; font-weight: 800;">${selectedPatient.PatientName}</td>
            <td class="label">Father / Husband:</td>
            <td class="val">${selectedPatient.FatherHusband || 'N/A'}</td>
          </tr>
          <tr>
            <td class="label">Age & Gender:</td>
            <td class="val">${selectedPatient.AgeYears || 'N/A'} Yrs / ${selectedPatient.Sex || 'N/A'}</td>
            <td class="label">Marital Status:</td>
            <td class="val">${selectedPatient.MaritalStatus || 'N/A'}</td>
          </tr>
          <tr>
            <td class="label">Mobile / Phone:</td>
            <td class="val" style="font-weight: 800;">${selectedPatient.PhoneMobile || 'N/A'}</td>
            <td class="label">CNIC / ID:</td>
            <td class="val">${selectedPatient.CNIC || 'N/A'}</td>
          </tr>
          <tr>
            <td class="label">City / Region:</td>
            <td class="val">${cityName}</td>
            <td class="label">Occupation:</td>
            <td class="val">${selectedPatient.Occupation || 'N/A'}</td>
          </tr>
          <tr>
            <td class="label">Residential Address:</td>
            <td class="val" colspan="3">${selectedPatient.Address || 'N/A'}</td>
          </tr>
        </table>

        <div class="stats-grid">
          <div class="stat-box">
            <div class="num">${patientStats.totalVisitsCount}</div>
            <div class="lbl">Total Visits</div>
          </div>
          <div class="stat-box">
            <div class="num">${patientStats.firstVisit}</div>
            <div class="lbl">First Visit Date</div>
          </div>
          <div class="stat-box">
            <div class="num">${patientStats.lastVisit}</div>
            <div class="lbl">Latest Visit Date</div>
          </div>
          <div class="stat-box">
            <div class="num">Rs. ${patientStats.totalConsultationPaid.toLocaleString()}</div>
            <div class="lbl">Consultation Paid</div>
          </div>
          <div class="stat-box">
            <div class="num">Rs. ${patientStats.totalClinicalMedsPaid.toLocaleString()}</div>
            <div class="lbl">Clinical Meds Paid</div>
          </div>
          <div class="stat-box">
            <div class="num" style="color: #059669;">Rs. ${patientStats.totalLifetimePaid.toLocaleString()}</div>
            <div class="lbl">Total Lifetime Paid</div>
          </div>
        </div>

        <div class="section-title">Chronological Clinical Visit Records (${patientVisits.length} Visits)</div>

        ${
          patientVisits.length === 0
            ? '<p style="text-align: center; color: #64748b; padding: 20px;">No visit records logged yet for this patient.</p>'
            : patientVisits
                .map(
                  (v, idx) => `
          <div class="visit-card">
            <div class="visit-header">
              <div>
                <span class="visit-date">Visit #${patientVisits.length - idx} • Date: ${v.date}</span>
                <span style="color: #64748b; margin-left: 8px;">(${v.id})</span>
              </div>
              <div>Doctor: <strong>${v.doctorName}</strong></div>
            </div>

            <div style="margin-bottom: 6px;">
              <span style="font-weight: 700; color: #334155;">Diagnosis & Symptoms: </span>
              <span style="color: #0f172a;">${v.symptoms || 'Routine Examination'}</span>
            </div>

            ${
              v.vitals.bp || v.vitals.pulse || v.vitals.weight || v.vitals.temp
                ? `<div style="font-size: 8.5pt; background: #f8fafc; padding: 4px 8px; border-radius: 4px; margin-bottom: 6px;">
                     <strong>Vitals:</strong> 
                     ${v.vitals.bp ? `BP: ${v.vitals.bp} | ` : ''}
                     ${v.vitals.pulse ? `Pulse: ${v.vitals.pulse} bpm | ` : ''}
                     ${v.vitals.temp ? `Temp: ${v.vitals.temp}°F | ` : ''}
                     ${v.vitals.weight ? `Weight: ${v.vitals.weight} kg | ` : ''}
                     ${v.vitals.sugar ? `Sugar: ${v.vitals.sugar} mg/dL | ` : ''}
                     ${v.vitals.spo2 ? `SpO2: ${v.vitals.spo2}%` : ''}
                   </div>`
                : ''
            }

            ${
              v.clinicalItems.length > 0
                ? `<table class="med-table">
                    <thead>
                      <tr>
                        <th style="width: 30px;">#</th>
                        <th>Clinical Compounded Medication ('C')</th>
                        <th>Dosage & Instructions</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${v.clinicalItems
                        .map(
                          (m, mIdx) => `
                        <tr>
                          <td>${mIdx + 1}</td>
                          <td><strong>${m.name}</strong></td>
                          <td>${m.dosage} ${m.expireDate ? `(EXP: ${m.expireDate})` : ''}</td>
                        </tr>
                      `
                        )
                        .join('')}
                    </tbody>
                  </table>`
                : ''
            }

            ${
              v.patentItems.length > 0
                ? `<table class="med-table" style="margin-top: 4px;">
                    <thead>
                      <tr>
                        <th style="width: 30px;">#</th>
                        <th>Patent Medicines ('P')</th>
                        <th>Dosage / Directions</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${v.patentItems
                        .map(
                          (m, mIdx) => `
                        <tr>
                          <td>${mIdx + 1}</td>
                          <td><strong>${m.name}</strong></td>
                          <td>${m.dosage}</td>
                        </tr>
                      `
                        )
                        .join('')}
                    </tbody>
                  </table>`
                : ''
            }

            <div class="payment-bar">
              <div>
                <span>💳 Payment Breakdown: </span>
                <span style="color: #1e3a8a; margin-left: 6px;">Appointment Fee: <strong>PKR ${v.appointmentFee.toLocaleString()}</strong></span>
                <span style="color: #d97706; margin-left: 12px;">Clinical Meds: <strong>PKR ${v.clinicalMedicineFee.toLocaleString()}</strong></span>
              </div>
              <div style="color: #059669; font-weight: 800; font-size: 10pt;">
                Total Paid: PKR ${v.totalPaid.toLocaleString()}
              </div>
            </div>
          </div>
        `
                )
                .join('')
        }

        <div class="footer">
          Printed on ${new Date().toLocaleString()} • ${cName} Management Information System
        </div>
      </body>
      </html>
    `;

    printWin.document.write(html);
    printWin.document.close();
    printWin.focus();
    setTimeout(() => {
      printWin.print();
    }, 400);
  };

  return (
    <div className="space-y-4 animate-fadeIn pb-12">
      {/* Top Header & Patient Selection Bar */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="p-2.5 bg-indigo-50 text-indigo-700 rounded-xl border border-indigo-100">
              <UserCheck className="w-5 h-5 text-indigo-700" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                <span>Patient Profile & Complete Records Desk</span>
                {selectedPatient && (
                  <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
                    {selectedPatient.PatientID}
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Complete personal demographics, contact details, total visits count, and historical payment ledger.
              </p>
            </div>
          </div>
        </div>

        {/* Live Patient Search Input */}
        <div className="flex items-center gap-2 max-w-md w-full">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by Name, MR #, Phone, CNIC..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all placeholder:text-slate-400"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold px-1.5 py-0.5"
              >
                ✕
              </button>
            )}
          </div>

          {selectedPatient && (
            <button
              type="button"
              onClick={handlePrintPatientProfile}
              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all shadow-xs cursor-pointer shrink-0"
              title="Print Complete Patient Profile Sheet"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Print Profile</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column: Quick Patient Directory Selector (4 cols) */}
        <div className="lg:col-span-4 space-y-3">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-indigo-600" />
                <span>Patient Directory ({searchResults.length})</span>
              </span>
              <span className="text-[10px] font-bold text-slate-500 bg-slate-200/80 px-2 py-0.5 rounded-md">
                Click to Inspect
              </span>
            </div>

            <div className="max-h-[600px] overflow-y-auto divide-y divide-slate-100">
              {searchResults.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  <Search className="w-6 h-6 mx-auto mb-2 text-slate-300" />
                  No patients match your search criteria.
                </div>
              ) : (
                searchResults.map((p) => {
                  const isSelected =
                    selectedPatient &&
                    String(selectedPatient.PatientID).trim().toLowerCase() ===
                      String(p.PatientID).trim().toLowerCase();
                  const pVisitsCount = (visits || []).filter(
                    (v) => String(v.PatientID).trim().toLowerCase() === String(p.PatientID).trim().toLowerCase()
                  ).length;

                  return (
                    <button
                      key={p.PatientID}
                      type="button"
                      onClick={() => {
                        setSelectedPatientId(p.PatientID);
                        setHistoryFilterDate('ALL');
                      }}
                      className={`w-full text-left p-3 transition-all flex items-center justify-between cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-50/90 text-indigo-950 border-l-4 border-indigo-600'
                          : 'hover:bg-slate-50/80 text-slate-800'
                      }`}
                    >
                      <div className="min-w-0 flex-1 pr-2">
                        <div className="flex items-center space-x-1.5">
                          <span className="font-extrabold text-xs text-slate-950 truncate">
                            {p.PatientName}
                          </span>
                          <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 bg-slate-100 text-slate-700 rounded border border-slate-200">
                            {p.PatientID}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-1">
                          <span>{p.PhoneMobile || 'No Phone'}</span>
                          {p.AgeYears ? <span>• {p.AgeYears} Yrs</span> : null}
                          {p.Sex ? <span>• {p.Sex}</span> : null}
                        </div>
                      </div>

                      <div className="flex flex-col items-end shrink-0">
                        <span
                          className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                            pVisitsCount > 0
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : 'bg-slate-100 text-slate-600 border border-slate-200'
                          }`}
                        >
                          {pVisitsCount} {pVisitsCount === 1 ? 'Visit' : 'Visits'}
                        </span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Selected Patient Full Profile & Detailed Visit History (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          {!selectedPatient ? (
            <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center text-slate-500 space-y-3">
              <UserCheck className="w-12 h-12 mx-auto text-slate-300" />
              <h3 className="text-base font-bold text-slate-800">No Patient Selected</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Please search or select a patient from the directory on the left to view their complete personal details, demographic profile, total visits count, and financial records.
              </p>
            </div>
          ) : (
            <>
              {/* Patient Identity & Key Stat Highlights */}
              <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-5 shadow-lg border border-indigo-900/50 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center space-x-3.5">
                    <div className="w-14 h-14 rounded-2xl bg-indigo-600/30 border border-indigo-400/40 text-indigo-200 flex items-center justify-center font-black text-xl shadow-inner shrink-0">
                      {selectedPatient.PatientName?.charAt(0) || 'P'}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h1 className="text-xl font-black text-white tracking-tight">
                          {selectedPatient.PatientName}
                        </h1>
                        <span className="px-2 py-0.5 bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 text-xs font-mono font-bold rounded-lg">
                          MR #{selectedPatient.PatientID}
                        </span>
                      </div>
                      <p className="text-xs text-indigo-200 mt-0.5 flex flex-wrap items-center gap-2">
                        <span>S/O, D/O, W/O: <strong>{selectedPatient.FatherHusband || 'N/A'}</strong></span>
                        <span>•</span>
                        <span>Age: <strong>{selectedPatient.AgeYears || 'N/A'} Yrs</strong></span>
                        <span>•</span>
                        <span>Gender: <strong>{selectedPatient.Sex || 'N/A'}</strong></span>
                      </p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onOpenVisitDesk(selectedPatient.PatientID)}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer shadow-xs"
                      title="Open Patient in Clinical Consultation Desk"
                    >
                      <Stethoscope className="w-3.5 h-3.5 text-indigo-200" />
                      <span>Start Visit</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onOpenTokenIssue(selectedPatient.PatientID)}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer shadow-xs"
                      title="Issue Token for this Patient"
                    >
                      <Ticket className="w-3.5 h-3.5 text-emerald-200" />
                      <span>Issue Token</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onOpenBookAppointment(selectedPatient.PatientID)}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer shadow-xs"
                      title="Book an Appointment"
                    >
                      <CalendarPlus className="w-3.5 h-3.5 text-blue-200" />
                      <span>Book App</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onEditPatient(selectedPatient)}
                      className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-bold border border-slate-700 transition-all cursor-pointer"
                      title="Edit Patient Details in Registration Form"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* 5 KPI Metric Highlights */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-2 border-t border-indigo-800/40 text-center">
                  <div className="bg-slate-800/60 p-2.5 rounded-xl border border-indigo-900/40">
                    <span className="text-[10px] uppercase font-extrabold tracking-wider text-indigo-300 block">
                      Total Visits
                    </span>
                    <span className="text-base font-black text-emerald-400 font-mono">
                      {patientStats.totalVisitsCount} Visits
                    </span>
                  </div>

                  <div className="bg-slate-800/60 p-2.5 rounded-xl border border-indigo-900/40">
                    <span className="text-[10px] uppercase font-extrabold tracking-wider text-indigo-300 block">
                      First Visit
                    </span>
                    <span className="text-xs font-bold text-white font-mono">
                      {patientStats.firstVisit}
                    </span>
                  </div>

                  <div className="bg-slate-800/60 p-2.5 rounded-xl border border-indigo-900/40">
                    <span className="text-[10px] uppercase font-extrabold tracking-wider text-indigo-300 block">
                      Latest Visit
                    </span>
                    <span className="text-xs font-bold text-white font-mono">
                      {patientStats.lastVisit}
                    </span>
                  </div>

                  <div className="bg-slate-800/60 p-2.5 rounded-xl border border-indigo-900/40">
                    <span className="text-[10px] uppercase font-extrabold tracking-wider text-indigo-300 block">
                      Consultation Paid
                    </span>
                    <span className="text-xs font-bold text-blue-300 font-mono">
                      PKR {patientStats.totalConsultationPaid.toLocaleString()}
                    </span>
                  </div>

                  <div className="bg-slate-800/60 p-2.5 rounded-xl border border-indigo-900/40">
                    <span className="text-[10px] uppercase font-extrabold tracking-wider text-indigo-300 block">
                      Clinical Meds Paid
                    </span>
                    <span className="text-xs font-bold text-amber-300 font-mono">
                      PKR {patientStats.totalClinicalMedsPaid.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Complete Personal Details Breakdown Card */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                  <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <User className="w-4 h-4 text-indigo-600" />
                    <span>Complete Personal & Demographic Details</span>
                  </h3>
                  <span className="text-[11px] font-bold text-slate-500">
                    Registered: {formatDisplayDate(selectedPatient.RegistrationDate || selectedPatient.CreatedAt)}
                  </span>
                </div>

                <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                  <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-100 space-y-1">
                    <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider block">
                      Full Name
                    </span>
                    <p className="font-extrabold text-slate-900 text-sm">{selectedPatient.PatientName}</p>
                  </div>

                  <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-100 space-y-1">
                    <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider block">
                      Father / Husband
                    </span>
                    <p className="font-bold text-slate-800">{selectedPatient.FatherHusband || 'N/A'}</p>
                  </div>

                  <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-100 space-y-1">
                    <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider block">
                      MR / Patient ID
                    </span>
                    <p className="font-mono font-extrabold text-indigo-700">{selectedPatient.PatientID}</p>
                  </div>

                  <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-100 space-y-1">
                    <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider block">
                      Age & Gender
                    </span>
                    <p className="font-bold text-slate-800">
                      {selectedPatient.AgeYears || 'N/A'} Years • {selectedPatient.Sex || 'N/A'}
                    </p>
                  </div>

                  <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-100 space-y-1">
                    <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider block">
                      Marital Status
                    </span>
                    <p className="font-bold text-slate-800">{selectedPatient.MaritalStatus || 'Single'}</p>
                  </div>

                  <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-100 space-y-1">
                    <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider block">
                      Occupation
                    </span>
                    <p className="font-bold text-slate-800">{selectedPatient.Occupation || 'N/A'}</p>
                  </div>

                  <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-100 space-y-1">
                    <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider block">
                      Mobile / Phone
                    </span>
                    <p className="font-bold text-slate-900 font-mono flex items-center justify-between">
                      <span>{selectedPatient.PhoneMobile || 'N/A'}</span>
                      {selectedPatient.PhoneMobile && (
                        <button
                          type="button"
                          onClick={() => {
                            const cleanPhone = selectedPatient.PhoneMobile.replace(/[^0-9]/g, '');
                            window.open(`https://wa.me/${cleanPhone}`, '_blank');
                          }}
                          className="text-emerald-600 hover:text-emerald-700 font-bold text-[10px] flex items-center gap-0.5 cursor-pointer"
                        >
                          <MessageCircle className="w-3 h-3" />
                          <span>WA</span>
                        </button>
                      )}
                    </p>
                  </div>

                  <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-100 space-y-1">
                    <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider block">
                      CNIC / National ID
                    </span>
                    <p className="font-mono font-bold text-slate-800">{selectedPatient.CNIC || 'N/A'}</p>
                  </div>

                  <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-100 space-y-1">
                    <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider block">
                      City & District
                    </span>
                    <p className="font-bold text-slate-800">{cityName}</p>
                  </div>

                  <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-100 sm:col-span-2 lg:col-span-3 space-y-1">
                    <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider block">
                      Residential Address
                    </span>
                    <p className="font-semibold text-slate-800">{selectedPatient.Address || 'No address provided.'}</p>
                  </div>
                </div>
              </div>

              {/* Chronological Visit History Ledger (with Doctor Payment Breakdown) */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden space-y-3">
                <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center space-x-2">
                    <History className="w-4 h-4 text-indigo-600" />
                    <div>
                      <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                        Chronological Clinical Visit Records ({patientVisits.length} Total Visits)
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        Detailed examination history, clinical medicines prescribed, and fee breakdowns.
                      </p>
                    </div>
                  </div>

                  {/* Filter by Date dropdown */}
                  {patientVisits.length > 1 && (
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-slate-600">Filter Date:</span>
                      <select
                        value={historyFilterDate}
                        onChange={(e) => setHistoryFilterDate(e.target.value)}
                        className="bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="ALL">All Visits ({patientVisits.length})</option>
                        {patientVisits.map((v) => (
                          <option key={v.rawDate} value={v.rawDate}>
                            {v.date} ({v.id})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                <div className="p-4 space-y-4">
                  {displayedVisits.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                      <Stethoscope className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="text-xs font-bold text-slate-700">No Clinical Visits Found</p>
                      <p className="text-[11px] text-slate-400 mt-1">
                        This patient has not completed any clinical consultations yet.
                      </p>
                    </div>
                  ) : (
                    displayedVisits.map((v, idx) => (
                      <div
                        key={v.id + '-' + idx}
                        className="border border-slate-300 rounded-2xl bg-white p-4 space-y-3.5 shadow-2xs hover:border-indigo-300 transition-all"
                      >
                        {/* Visit Top Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-2.5 gap-2">
                          <div className="flex items-center space-x-2">
                            <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 font-extrabold text-[11px] rounded-md font-mono">
                              Visit #{displayedVisits.length - idx}
                            </span>
                            <span className="font-black text-slate-900 text-sm flex items-center gap-1.5">
                              <Calendar className="w-4 h-4 text-indigo-600" />
                              <span>{v.date}</span>
                            </span>
                            <span className="text-slate-400 font-mono text-xs">({v.id})</span>
                          </div>

                          <div className="flex items-center space-x-2 text-xs font-bold text-slate-600">
                            <Stethoscope className="w-3.5 h-3.5 text-indigo-600" />
                            <span>Dr. {v.doctorName}</span>
                          </div>
                        </div>

                        {/* Symptoms & Clinical Diagnosis */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                            <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider block">
                              Chief Complaint & Clinical Diagnosis
                            </span>
                            <p className="font-semibold text-slate-900 mt-1 italic">
                              "{v.symptoms || 'Routine OPD Consultation'}"
                            </p>
                          </div>

                          {/* Vitals */}
                          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                            <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider block">
                              Recorded Vital Signs
                            </span>
                            <div className="flex flex-wrap gap-2 text-[11px] font-mono font-bold mt-1 text-slate-800">
                              {v.vitals.bp && <span className="bg-white px-2 py-0.5 rounded border">BP: {v.vitals.bp}</span>}
                              {v.vitals.pulse && <span className="bg-white px-2 py-0.5 rounded border">Pulse: {v.vitals.pulse}</span>}
                              {v.vitals.temp && <span className="bg-white px-2 py-0.5 rounded border">Temp: {v.vitals.temp}°F</span>}
                              {v.vitals.weight && <span className="bg-white px-2 py-0.5 rounded border">Weight: {v.vitals.weight}kg</span>}
                              {v.vitals.sugar && <span className="bg-white px-2 py-0.5 rounded border">Sugar: {v.vitals.sugar}</span>}
                              {v.vitals.spo2 && <span className="bg-white px-2 py-0.5 rounded border">SpO2: {v.vitals.spo2}%</span>}
                              {!v.vitals.bp && !v.vitals.pulse && !v.vitals.temp && !v.vitals.weight && (
                                <span className="text-slate-400 italic">No vitals logged</span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Prescribed Clinical Compounded Medicines ('C') */}
                        {v.clinicalItems.length > 0 && (
                          <div className="space-y-1.5">
                            <div className="inline-block bg-amber-100 text-amber-950 font-extrabold text-[10px] uppercase border border-amber-300 px-2 py-0.5 rounded">
                              Clinical Compounded Medicines ('C') ({v.clinicalItems.length})
                            </div>
                            <div className="overflow-x-auto border border-amber-300 rounded-xl bg-white shadow-2xs">
                              <table className="w-full text-left border-collapse text-xs">
                                <thead>
                                  <tr className="bg-amber-100/80 border-b border-amber-300 text-[10px] font-black text-amber-950 uppercase tracking-wider">
                                    <th className="py-1.5 px-3 w-8 text-center border-r border-amber-200">#</th>
                                    <th className="py-1.5 px-3 border-r border-amber-200">Medicine Name</th>
                                    <th className="py-1.5 px-3">Dosage & Usage Instructions</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-amber-100">
                                  {v.clinicalItems.map((item, mIdx) => (
                                    <tr key={mIdx} className="hover:bg-amber-50/50">
                                      <td className="py-1.5 px-2 text-center font-bold text-slate-500 text-[11px] border-r border-amber-100 bg-amber-50/40">
                                        {mIdx + 1}
                                      </td>
                                      <td className="py-1.5 px-3 font-bold text-slate-900 border-r border-amber-100">
                                        {item.name}
                                      </td>
                                      <td className="py-1.5 px-3 font-mono font-bold text-amber-900">
                                        {item.dosage} {item.expireDate ? `(EXP: ${item.expireDate})` : ''}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}

                        {/* Prescribed Patent Medicines ('P') */}
                        {v.patentItems.length > 0 && (
                          <div className="space-y-1.5">
                            <div className="inline-block bg-blue-100 text-blue-950 font-extrabold text-[10px] uppercase border border-blue-300 px-2 py-0.5 rounded">
                              Patent Prescribed Medicines ('P') ({v.patentItems.length})
                            </div>
                            <div className="overflow-x-auto border border-blue-300 rounded-xl bg-white shadow-2xs">
                              <table className="w-full text-left border-collapse text-xs">
                                <thead>
                                  <tr className="bg-blue-100/80 border-b border-blue-300 text-[10px] font-black text-blue-950 uppercase tracking-wider">
                                    <th className="py-1.5 px-3 w-8 text-center border-r border-blue-200">#</th>
                                    <th className="py-1.5 px-3 border-r border-blue-200">Medicine Name</th>
                                    <th className="py-1.5 px-3">Dosage / Directions</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-blue-100">
                                  {v.patentItems.map((item, mIdx) => (
                                    <tr key={mIdx} className="hover:bg-blue-50/50">
                                      <td className="py-1.5 px-2 text-center font-bold text-slate-500 text-[11px] border-r border-blue-100 bg-blue-50/40">
                                        {mIdx + 1}
                                      </td>
                                      <td className="py-1.5 px-3 font-bold text-slate-900 border-r border-blue-100">
                                        {item.name}
                                      </td>
                                      <td className="py-1.5 px-3 font-mono font-bold text-blue-900">
                                        {item.dosage}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}

                        {/* Lab tests or advice */}
                        {v.labTestAdvice && (
                          <div className="p-2.5 bg-indigo-50/60 rounded-xl border border-indigo-100 text-xs">
                            <span className="text-indigo-900 font-bold uppercase text-[10px] tracking-wider block">
                              Lab Advice / Diagnostics
                            </span>
                            <p className="font-mono font-bold text-indigo-950 mt-0.5">{v.labTestAdvice}</p>
                          </div>
                        )}

                        {/* PAYMENT BREAKDOWN BOX (Appointment & Clinical Medicine) */}
                        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shadow-xs border border-indigo-900/40">
                          <div className="flex items-center space-x-2.5">
                            <div className="p-1.5 bg-emerald-500/20 text-emerald-300 rounded-lg shrink-0">
                              <Coins className="w-4 h-4 text-emerald-300" />
                            </div>
                            <div>
                              <span className="text-[10px] uppercase font-extrabold tracking-wider text-slate-300 block">
                                Payment Received on this Visit:
                              </span>
                              <div className="flex flex-wrap items-center gap-3 text-xs font-mono font-bold mt-0.5">
                                <span className="text-blue-300">
                                  Appointment / Consultation Fee:{' '}
                                  <strong className="text-white">
                                    PKR {v.appointmentFee.toLocaleString()}
                                  </strong>
                                </span>
                                <span className="text-amber-300">
                                  Clinical Medicine:{' '}
                                  <strong className="text-white">
                                    PKR {v.clinicalMedicineFee.toLocaleString()}
                                  </strong>
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="bg-emerald-600/90 text-white px-3 py-1.5 rounded-lg text-xs font-mono font-black border border-emerald-400/40 shrink-0 text-center">
                            Total Paid: PKR {v.totalPaid.toLocaleString()}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
