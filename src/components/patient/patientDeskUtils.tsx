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

  const clean1 = s1.replace(/[^0-9a-zA-Z]/g, '');
  const clean2 = s2.replace(/[^0-9a-zA-Z]/g, '');
  if (clean1 && clean2 && clean1 === clean2) return true;

  // Strip common prefixes (mr, pat, patient, p, nhc, dr)
  const stripPrefix = (s: string) => s.replace(/^(mr|pat|patient|p|nhc|dr)[\s\-_#]*/i, '').trim();
  const stripped1 = stripPrefix(s1);
  const stripped2 = stripPrefix(s2);
  if (stripped1 && stripped2 && stripped1 === stripped2) return true;

  // Pure numeric check if both have numbers (e.g. "MR-1001" vs "1001")
  const num1 = s1.replace(/\D/g, '');
  const num2 = s2.replace(/\D/g, '');
  if (num1 && num2 && num1 === num2 && num1.length >= 1) return true;

  return false;
}

export function isSamePatientOrName(
  patA?: { PatientID?: any; PatientName?: any; PhoneMobile?: any } | string | null,
  patB?: { PatientID?: any; PatientName?: any; PhoneMobile?: any } | string | null
): boolean {
  if (!patA || !patB) return false;
  const idA = typeof patA === 'string' ? patA : patA.PatientID;
  const nameA = typeof patA === 'object' ? patA.PatientName : undefined;
  const phoneA = typeof patA === 'object' ? patA.PhoneMobile : undefined;

  const idB = typeof patB === 'string' ? patB : patB.PatientID;
  const nameB = typeof patB === 'object' ? patB.PatientName : undefined;
  const phoneB = typeof patB === 'object' ? patB.PhoneMobile : undefined;

  if (idA && idB && isSamePatient(idA, idB)) return true;

  if (nameA && nameB) {
    const nA = String(nameA).trim().toLowerCase();
    const nB = String(nameB).trim().toLowerCase();
    if (nA && nB && (nA === nB || nA.replace(/[^a-z0-9]/g, '') === nB.replace(/[^a-z0-9]/g, ''))) return true;
  }

  if (phoneA && phoneB) {
    const pA = String(phoneA).replace(/\D/g, '');
    const pB = String(phoneB).replace(/\D/g, '');
    if (pA && pB && pA.length >= 10 && pA === pB) return true;
  }

  // Check if one's ID matches the other's Name or vice versa
  if (idA && nameB && String(idA).trim().toLowerCase() === String(nameB).trim().toLowerCase()) return true;
  if (idB && nameA && String(idB).trim().toLowerCase() === String(nameA).trim().toLowerCase()) return true;

  return false;
}

export function formatReportDate(dateStr: string): string {
  if (!dateStr) return '';
  const clean = parseCleanVisitDate(dateStr);
  if (!clean) return dateStr;
  const pts = clean.split('-');
  if (pts.length !== 3) return dateStr;
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthIdx = parseInt(pts[1], 10) - 1;
  const monthStr = months[monthIdx] || pts[1];
  return `${pts[2]}-${monthStr}-${pts[0]}`;
}

export function parseCleanVisitDate(dateStr?: string | number | null): string {
  if (dateStr === undefined || dateStr === null || dateStr === '' || dateStr === 'N/A' || dateStr === '—') return '';
  try {
    const raw = String(dateStr).trim();
    if (!raw) return '';

    // Check for Excel serial number (e.g. 44927 or "44927")
    const num = Number(raw);
    if (!isNaN(num) && num > 30000 && num < 70000 && !raw.includes('-') && !raw.includes('/')) {
      const parsedExcelDate = new Date(Math.round((num - 25569) * 86400 * 1000));
      if (!isNaN(parsedExcelDate.getTime())) {
        return parsedExcelDate.toISOString().split('T')[0];
      }
    }

    // Standard ISO YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss
    if (/^\d{4}-\d{2}-\d{2}/.test(raw)) {
      return raw.slice(0, 10);
    }
    if (/^\d{4}\/\d{2}\/\d{2}/.test(raw)) {
      return raw.slice(0, 10).replace(/\//g, '-');
    }

    // Handle DD-MM-YYYY, DD/MM/YYYY, MM/DD/YYYY, DD.MM.YYYY
    const parts = raw.split(/[\/\-\.\s]/).filter(Boolean);
    if (parts.length >= 3) {
      const monthMap: Record<string, string> = {
        jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
        jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12',
        january: '01', february: '02', march: '03', april: '04', june: '06',
        july: '07', august: '08', september: '09', october: '10', november: '11', december: '12'
      };

      // Check for Month name (e.g., 31-Aug-2026 or Aug-31-2026)
      const p0Low = parts[0].toLowerCase();
      const p1Low = parts[1].toLowerCase();

      if (monthMap[p1Low] && parts[2].length === 4) {
        // DD-MMM-YYYY (e.g. 31-Aug-2026)
        const dd = parts[0].padStart(2, '0');
        const mm = monthMap[p1Low];
        const yr = parts[2];
        return `${yr}-${mm}-${dd}`;
      } else if (monthMap[p0Low] && parts[2].length === 4) {
        // MMM-DD-YYYY (e.g. Aug-31-2026)
        const mm = monthMap[p0Low];
        const dd = parts[1].padStart(2, '0');
        const yr = parts[2];
        return `${yr}-${mm}-${dd}`;
      }

      // Check numeric components:
      // DD-MM-YYYY or MM-DD-YYYY where parts[2] is 4 digits
      if (parts[2].length === 4 && parts[0].length <= 2 && parts[1].length <= 2) {
        const v1 = parseInt(parts[0], 10);
        const v2 = parseInt(parts[1], 10);
        const yr = parts[2];
        if (!isNaN(v1) && !isNaN(v2)) {
          if (v1 > 12) {
            // Definitely DD-MM-YYYY
            return `${yr}-${String(v2).padStart(2, '0')}-${String(v1).padStart(2, '0')}`;
          } else if (v2 > 12) {
            // Definitely MM-DD-YYYY
            return `${yr}-${String(v1).padStart(2, '0')}-${String(v2).padStart(2, '0')}`;
          } else {
            // Ambiguous (both <= 12). Default to DD-MM-YYYY in Pakistani medical context
            return `${yr}-${String(v2).padStart(2, '0')}-${String(v1).padStart(2, '0')}`;
          }
        }
      }

      // YYYY-MM-DD where parts[0] is 4 digits
      if (parts[0].length === 4 && parts[1].length <= 2 && parts[2].length <= 2) {
        const yr = parts[0];
        const mm = String(parseInt(parts[1], 10)).padStart(2, '0');
        const dd = String(parseInt(parts[2], 10)).padStart(2, '0');
        return `${yr}-${mm}-${dd}`;
      }
    }

    // Fallback using native Date
    const d = new Date(raw);
    if (!isNaN(d.getTime())) {
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    }

    return '';
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
