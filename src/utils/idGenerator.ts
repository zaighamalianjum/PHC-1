import { Patient } from '../types';

/**
 * Generates a standard Patient ID in the format YYYYMMDD-### (e.g. 20260805-001)
 * @param existingPatients List of existing patients
 * @param date Registration date (defaults to current date)
 */
export const generatePatientId = (existingPatients: Patient[] = [], date: Date = new Date()): string => {
  const prefix = 'PUN-';

  // Find all existing sequence numbers from patient IDs in PUN-XXXXXX format or numbers
  let maxSeq = 0;

  (existingPatients || []).forEach(p => {
    if (!p || !p.PatientID) return;
    const pid = String(p.PatientID).trim();
    if (pid.toUpperCase().startsWith(prefix)) {
      const numStr = pid.substring(prefix.length);
      const num = parseInt(numStr, 10);
      if (!isNaN(num) && num > maxSeq) {
        maxSeq = num;
      }
    } else {
      const num = parseInt(pid, 10);
      if (!isNaN(num) && num > maxSeq) {
        maxSeq = num;
      }
    }
  });

  let nextSeq = maxSeq + 1;
  let candidateId = `${prefix}${String(nextSeq).padStart(6, '0')}`;

  // Safety check to ensure complete uniqueness
  while ((existingPatients || []).some(p => p && String(p.PatientID).trim().toLowerCase() === candidateId.toLowerCase())) {
    nextSeq++;
    candidateId = `${prefix}${String(nextSeq).padStart(6, '0')}`;
  }

  return candidateId;
};
