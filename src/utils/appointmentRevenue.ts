/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Appointment, Visit } from '../types';

/**
 * Normalizes date string to YYYY-MM-DD format for reliable matching
 */
export function normalizeDateToYMD(dateField?: any): string {
  if (!dateField) return '';
  if (typeof dateField === 'string') {
    const trimmed = dateField.trim();
    if (trimmed.includes('T')) {
      return trimmed.split('T')[0];
    }
    if (trimmed.includes(' ')) {
      const first = trimmed.split(' ')[0].replace(/\//g, '-');
      if (first.length === 10 && first.startsWith('20')) return first;
    }
    if (trimmed.includes('/')) {
      const parts = trimmed.split('/');
      if (parts[0].length === 4) {
        return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
      } else if (parts[2]?.length === 4) {
        return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
      }
    }
    if (trimmed.includes('-')) {
      const parts = trimmed.split('-');
      if (parts[0].length === 4) {
        return `${parts[0]}-${parts[1].padStart(2, '0')}-${(parts[2] || '01').slice(0, 2).padStart(2, '0')}`;
      } else if (parts[2]?.length === 4) {
        return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
      }
    }
    return trimmed.slice(0, 10);
  }
  if (dateField instanceof Date && !isNaN(dateField.getTime())) {
    return dateField.toISOString().split('T')[0];
  }
  return '';
}

/**
 * Checks if two patient IDs refer to the same patient
 */
export function isSamePatientId(id1?: any, id2?: any): boolean {
  if (!id1 || !id2) return false;
  const s1 = String(id1).trim().toLowerCase();
  const s2 = String(id2).trim().toLowerCase();
  if (s1 === s2) return true;
  
  // Numerical equality fallback (e.g. "005" vs "5")
  const n1 = parseInt(s1, 10);
  const n2 = parseInt(s2, 10);
  if (!isNaN(n1) && !isNaN(n2) && n1 === n2) return true;
  return false;
}

/**
 * Identifies if an appointment is an uploaded/imported sheet record
 */
export function isImportedAppointment(app: any): boolean {
  if (!app) return false;
  if (app.IsImported === true) return true;
  if (app.Source === 'Uploaded' || app.Source === 'Import' || app.Source === 'Excel') return true;
  
  const appId = String(app.AppointmentID || app.id || app._id || '');
  if (appId.startsWith('APP-IMP-') || appId.startsWith('IMP-')) return true;
  
  const remarks = String(app.Remarks || app.remarks || '').toLowerCase();
  if (
    remarks.includes('imported appointment') ||
    remarks.includes('imported history') ||
    remarks.includes('uploaded record') ||
    remarks.includes('excel upload')
  ) {
    return true;
  }
  return false;
}

/**
 * Identifies if an appointment was explicitly booked via the app UI
 * (e.g., Book Appointment modal, reception walk-in scheduling, advance booking)
 */
export function isExplicitlyBookedAppointment(app: any): boolean {
  if (!app) return false;
  if (isImportedAppointment(app)) return false;
  
  if (app.Source === 'Booked' || app.Source === 'Reception' || app.Source === 'Desk') return true;
  
  const remarks = String(app.Remarks || app.remarks || '').toLowerCase();
  if (
    remarks.includes('booked appointment') ||
    remarks.includes('advance appointment') ||
    remarks.includes('direct walk-in') ||
    remarks.includes('pre-booked') ||
    remarks.includes('routine opd check')
  ) {
    return true;
  }
  
  // Standard app ID generated in session and not imported
  const appId = String(app.AppointmentID || '');
  if (appId.startsWith('APP-') && !appId.startsWith('APP-IMP-')) {
    return true;
  }
  return false;
}

/**
 * Checks if a doctor has conducted a patient checkup/visit for this appointment/patient
 */
export function getDoctorCheckupForAppointment(
  app: any,
  visits: Visit[] = [],
  nhcPatients: any[] = []
): { isChecked: boolean; consultationFee: number } {
  if (!app) return { isChecked: false, consultationFee: 0 };
  
  const appDate = normalizeDateToYMD(app.AppointmentDate || app.BookingDate || app.Date);

  // 1. Direct Visit Checkup in Visits collection
  const matchingVisits = (visits || []).filter(v => {
    if (!v || !isSamePatientId(v.PatientID, app.PatientID)) return false;
    if ((v as any).Status === 3) return false; // Cancelled
    const vDate = normalizeDateToYMD(v.VisitDate || (v as any).Date);
    return vDate === appDate;
  });

  for (const v of matchingVisits) {
    let fee = Number(v.ConsultationFee) || (v as any).FeeReceived !== undefined ? Number((v as any).FeeReceived) : 0;
    if (!fee && v.VisitRemarks) {
      const match = v.VisitRemarks.match(/OPD Fee PKR\s*(\d+)/i) || 
                    v.VisitRemarks.match(/Consultation Fee PKR\s*(\d+)/i) || 
                    v.VisitRemarks.match(/OPD PKR\s*(\d+)/i);
      if (match) fee = Number(match[1]);
    }
    // Return doctor visit checkup fee if present, or indicate checked
    if (fee > 0 || (v.Status as number) === 2 || (v.Status as number) === 4) {
      return { isChecked: true, consultationFee: fee > 0 ? fee : (Number(app.FeeCharged) || 0) };
    }
  }

  // 2. NHC Patients History checkup
  const matchingNhc = (nhcPatients || []).filter(nhc => {
    if (!nhc || !isSamePatientId(nhc.PatientID, app.PatientID)) return false;
    const nDate = normalizeDateToYMD(nhc.date || nhc.VisitDate);
    return nDate === appDate;
  });

  for (const nhc of matchingNhc) {
    let fee = Number((nhc as any).ConsultationFee) || Number((nhc as any).fee) || 0;
    const rem = (nhc as any).VisitRemarks || (nhc as any).Remarks || '';
    if (!fee && rem) {
      const match = rem.match(/OPD Fee PKR\s*(\d+)/i) || 
                    rem.match(/Consultation Fee PKR\s*(\d+)/i) || 
                    rem.match(/OPD PKR\s*(\d+)/i);
      if (match) fee = Number(match[1]);
    }
    if (fee > 0) {
      return { isChecked: true, consultationFee: fee };
    }
  }

  // 3. Appointment was generated directly from a doctor visit checkup
  const appId = String(app.AppointmentID || '');
  if (appId.startsWith('APP-VIS-')) {
    return { isChecked: true, consultationFee: Number(app.FeeCharged) || 0 };
  }

  return { isChecked: false, consultationFee: 0 };
}

/**
 * Central rule: Calculates effective appointment revenue/fee.
 * 
 * STRICT COMPLIANCE RULE:
 * - When an appointment is uploaded/imported, its payment MUST NOT show up anywhere in the app
 *   UNLESS a doctor has actually checked the patient (recorded in visits/checkup).
 * - When an appointment is booked via "Book Appointment" or walk-in registration, its fee is valid.
 * - Otherwise (imported and no doctor checkup), it strictly returns 0.
 */
export function getEffectiveAppointmentFee(
  app: any,
  visits: Visit[] = [],
  nhcPatients: any[] = []
): number {
  if (!app) return 0;
  if (app.Status === 3 || app.Status === 'Cancelled') return 0;

  // Case 1: Check if Doctor checked the patient
  const doctorCheck = getDoctorCheckupForAppointment(app, visits, nhcPatients);
  if (doctorCheck.isChecked && doctorCheck.consultationFee > 0) {
    return doctorCheck.consultationFee;
  }

  // Case 2: Check if explicitly booked via Book Appointment & Schedule
  if (isExplicitlyBookedAppointment(app)) {
    return Number(app.FeeCharged || app.Fee || app.PaidAmount || 0);
  }

  // Case 3: If imported/uploaded and doctor has NOT checked the patient -> 0
  if (isImportedAppointment(app)) {
    return 0;
  }

  // Case 4: Default non-imported appointment
  return Number(app.FeeCharged || app.Fee || app.PaidAmount || 0);
}

/**
 * Returns true if the appointment's payment should be counted towards revenue/collections
 */
export function isAppointmentRevenueEligible(
  app: any,
  visits: Visit[] = [],
  nhcPatients: any[] = []
): boolean {
  return getEffectiveAppointmentFee(app, visits, nhcPatients) > 0;
}
