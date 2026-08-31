import React from 'react';
import { Patient, Appointment, Visit, NhcPatientHistory } from '../../types';

export function formatDisplayDate(dateStr: string | undefined | null): string {
  if (!dateStr || dateStr === 'N/A' || dateStr === '—') return dateStr || 'N/A';
  try {
    const cleanStr = String(dateStr).trim().split('T')[0].split(' ')[0];
    const parts = cleanStr.split('-');
    if (parts.length === 3 && parts[0].length === 4) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    if (parts.length === 3 && parts[2].length === 4) {
      return cleanStr;
    }
    const d = new Date(String(dateStr).trim());
    if (isNaN(d.getTime())) return String(dateStr);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${dd}-${mm}-${yyyy}`;
  } catch {
    return String(dateStr);
  }
}

export function isSamePatient(id1?: any, id2?: any): boolean {
  if (!id1 || !id2) return false;
  const s1 = String(id1).trim().toLowerCase();
  const s2 = String(id2).trim().toLowerCase();
  if (s1 === s2) return true;
  return s1.replace(/[^0-9a-zA-Z]/g, '') === s2.replace(/[^0-9a-zA-Z]/g, '');
}

export function formatReportDate(dateStr: string): string {
  if (!dateStr) return '';
  const pts = dateStr.split('-');
  if (pts.length !== 3) return dateStr;
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthIdx = parseInt(pts[1], 10) - 1;
  const monthStr = months[monthIdx] || pts[1];
  return `${pts[2]}-${monthStr}-${pts[0]}`;
}

export function parseCleanVisitDate(dateStr?: string | null): string {
  if (!dateStr || dateStr === 'N/A' || dateStr === '—') return '';
  try {
    const cleanStr = String(dateStr).trim().split('T')[0].split(' ')[0];
    const parts = cleanStr.split('-');
    if (parts.length === 3 && parts[0].length === 4) {
      return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
    }
    if (parts.length === 3 && parts[2].length === 4) {
      return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
    }
    const d = new Date(String(dateStr).trim());
    if (isNaN(d.getTime())) return '';
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  } catch {
    return '';
  }
}

export function getPatientType(
  patientId: string,
  patients: Patient[],
  visits: Visit[],
  nhcPatients: NhcPatientHistory[],
  appointments: Appointment[]
): 'New Patient' | 'Old Patient' {
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
}

export function isPakistaniMobilePrefix(str: string): boolean {
  const raw = str.trim().toLowerCase();
  if (!raw) return false;
  const digits = raw.replace(/\D/g, '');
  if (!digits) return false;
  return (
    raw.startsWith('030') || raw.startsWith('031') || raw.startsWith('032') || raw.startsWith('033') || raw.startsWith('034') || raw.startsWith('035') || raw.startsWith('037') ||
    raw.startsWith('30') || raw.startsWith('31') || raw.startsWith('32') || raw.startsWith('33') || raw.startsWith('34') || raw.startsWith('35') || raw.startsWith('37') ||
    raw.startsWith('+9230') || raw.startsWith('+9231') || raw.startsWith('+9232') || raw.startsWith('+9233') || raw.startsWith('+9234') || raw.startsWith('+9235') || raw.startsWith('+9237') ||
    raw.startsWith('9230') || raw.startsWith('9231') || raw.startsWith('9232') || raw.startsWith('9233') || raw.startsWith('9234') || raw.startsWith('9235') || raw.startsWith('9237')
  );
}

export function getWeeksLabel(dateStr: string): string | null {
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
}

export function matchPatientRecord(
  p: { PatientName?: string; PatientID?: string; PhoneMobile?: string | number; Address?: string },
  query: string
): boolean {
  const normalizedQuery = query.toLowerCase().trim();
  if (!normalizedQuery) return true;
  const terms = normalizedQuery.split(/\s+/).filter(Boolean);
  if (terms.length === 0) return true;

  const name = String(p.PatientName || '').toLowerCase();
  const id = String(p.PatientID || '').toLowerCase();
  const phone = String(p.PhoneMobile || '').toLowerCase();
  const address = String(p.Address || '').toLowerCase();

  const cleanPhone = phone.replace(/[^0-9]/g, '');
  const cleanId = id.replace(/[^0-9a-zA-Z]/g, '');

  return terms.every((term) => {
    const cleanTerm = term.replace(/[^0-9a-zA-Z]/g, '');

    if (name.includes(term)) return true;
    if (id.includes(term)) return true;
    if (phone.includes(term)) return true;
    if (address.includes(term)) return true;

    if (cleanTerm) {
      if (cleanId.includes(cleanTerm)) return true;
      if (cleanPhone.includes(cleanTerm)) return true;
    }

    return false;
  });
}

export function matchPatientIdOrNameOnly(
  p: { PatientName?: string; PatientID?: string; Address?: string },
  query: string
): boolean {
  const normalizedQuery = query.toLowerCase().trim();
  if (!normalizedQuery) return false;
  const terms = normalizedQuery.split(/\s+/).filter(Boolean);
  if (terms.length === 0) return false;

  const name = String(p.PatientName || '').toLowerCase();
  const id = String(p.PatientID || '').toLowerCase();
  const address = String(p.Address || '').toLowerCase();

  return terms.every((term) => {
    if (name.includes(term)) return true;
    if (id.includes(term)) return true;
    if (address.includes(term)) return true;
    return false;
  });
}

export function getResolvedNhcPatientName(
  nhcRecord: any,
  allPatients: Patient[] = [],
  allNhcList: NhcPatientHistory[] = []
): string {
  if (!nhcRecord) return '';
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
    directName.trim() !== 'NHC Record'
  ) {
    return directName.trim();
  }

  if (nhcRecord.PatientID) {
    const activeMatch = allPatients.find((p) => p.PatientID === nhcRecord.PatientID);
    if (activeMatch && activeMatch.PatientName && activeMatch.PatientName.trim()) {
      return activeMatch.PatientName.trim();
    }

    const namedNhc = allNhcList.find(
      (item) =>
        item.PatientID === nhcRecord.PatientID &&
        (item.PatientName || (item as any).patientName || (item as any).Name) &&
        String(item.PatientName || (item as any).patientName || (item as any).Name).trim() !== 'NHC Archive Patient' &&
        String(item.PatientName || (item as any).patientName || (item as any).Name).trim() !== 'NHC Record'
    );
    if (namedNhc) {
      const name = namedNhc.PatientName || (namedNhc as any).patientName || (namedNhc as any).Name;
      if (name && typeof name === 'string' && name.trim()) return name.trim();
    }
  }

  return nhcRecord.PatientID ? `Patient (${nhcRecord.PatientID})` : 'Patient Record';
}

export const WhatsAppIcon = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.573-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c-.001 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);
