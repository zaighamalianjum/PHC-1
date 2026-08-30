/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  Stethoscope,
  Search,
  Printer,
  Tag,
  CheckCircle2,
  Clock,
  Calendar,
  User,
  FlaskConical,
  FileText,
  AlertCircle,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  Package,
  Layers,
  Info,
  Check
} from 'lucide-react';
import { Patient, Visit, VisitMedicine, Item, Token, ClinicSettings, User as UserType } from '../../types';

interface ClinicalMedicinePrescriptionTabProps {
  activeSubTab: string;
  patients: Patient[];
  visits: Visit[];
  visitMedicines: VisitMedicine[];
  tokens?: Token[];
  items: Item[];
  clinicSettings: ClinicSettings;
  currentUser: UserType;
  selectedPatientId: string;
  setSelectedPatientId: (id: string) => void;
  getVisitMedicinesList: (v: Visit | null) => VisitMedicine[];
  onOpenLabelPrintModal: (labelData: any) => void;
}

export const ClinicalMedicinePrescriptionTab: React.FC<ClinicalMedicinePrescriptionTabProps> = ({
  activeSubTab,
  patients,
  visits,
  visitMedicines,
  tokens = [],
  items,
  clinicSettings,
  currentUser,
  selectedPatientId,
  setSelectedPatientId,
  getVisitMedicinesList,
  onOpenLabelPrintModal
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMode, setFilterMode] = useState<'today' | 'all'>('today');
  const [preparedItems, setPreparedItems] = useState<Record<string, boolean>>({});
  const [dispensedVisits, setDispensedVisits] = useState<Record<string, boolean>>({});
  const [isSlipPrintOpen, setIsSlipPrintOpen] = useState(false);

  const todayStr = new Date().toISOString().split('T')[0];

  // List of all patients who have visits or tokens
  const examinedPatients = useMemo(() => {
    return patients.filter((p) => {
      const pVisits = visits.filter((v) => v.PatientID === p.PatientID);
      const hasTodayVisit = pVisits.some((v) => v.VisitDate === todayStr);
      const hasTodayToken = tokens.some((t) => t.PatientID === p.PatientID && t.Date === todayStr);
      const hasAnyVisit = pVisits.length > 0;

      if (filterMode === 'today') {
        return hasTodayVisit || hasTodayToken;
      }
      return hasAnyVisit;
    });
  }, [patients, visits, tokens, filterMode, todayStr]);

  // Filtered patient list based on search term
  const filteredPatients = useMemo(() => {
    if (!searchTerm.trim()) return examinedPatients;
    const q = searchTerm.toLowerCase().trim();
    return examinedPatients.filter((p) => {
      const nameMatch = String(p.PatientName || '').toLowerCase().includes(q);
      const idMatch = String(p.PatientID || '').toLowerCase().includes(q);
      const phoneMatch = String(p.PhoneMobile || '').toLowerCase().includes(q);
      const tokenMatch = tokens.some((t) => t.PatientID === p.PatientID && String(t.TokenNo).includes(q));
      return nameMatch || idMatch || phoneMatch || tokenMatch;
    });
  }, [examinedPatients, searchTerm, tokens]);

  // Selected patient details
  const selectedPatient = useMemo(() => {
    return patients.find((p) => p.PatientID === selectedPatientId) || null;
  }, [patients, selectedPatientId]);

  // Get all visits of selected patient, sorted newest first
  const patientVisits = useMemo(() => {
    if (!selectedPatientId) return [];
    return visits
      .filter((v) => v.PatientID === selectedPatientId)
      .sort((a, b) => {
        if (a.VisitDate !== b.VisitDate) {
          return b.VisitDate.localeCompare(a.VisitDate);
        }
        return b.VisitID.localeCompare(a.VisitID);
      });
  }, [visits, selectedPatientId]);

  // Active visit (defaults to latest)
  const activeVisit = patientVisits.length > 0 ? patientVisits[0] : null;

  // Prescribed medicines for this visit
  const rawPrescribedList = useMemo(() => {
    return getVisitMedicinesList(activeVisit);
  }, [activeVisit, getVisitMedicinesList]);

  // Separate Clinical vs Patent medicines
  const clinicalMedicines = useMemo(() => {
    return rawPrescribedList.filter((m) => m.MedicineType === 'C' || !m.MedicineType);
  }, [rawPrescribedList]);

  const patentMedicines = useMemo(() => {
    return rawPrescribedList.filter((m) => m.MedicineType === 'P');
  }, [rawPrescribedList]);

  // Get patient token
  const patientToken = useMemo(() => {
    if (!selectedPatientId) return null;
    const t = tokens.find((tok) => tok.PatientID === selectedPatientId && tok.Date === (activeVisit?.VisitDate || todayStr));
    return t ? t.TokenNo : activeVisit?.TokenNo || null;
  }, [tokens, selectedPatientId, activeVisit, todayStr]);

  // Check if this visit is marked as dispensed
  const isDispensed = activeVisit ? Boolean(dispensedVisits[activeVisit.VisitID]) : false;

  // Toggle preparation status of an item
  const toggleItemPrepared = (key: string) => {
    setPreparedItems((prev) => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Toggle visit dispense
  const toggleVisitDispensed = () => {
    if (!activeVisit) return;
    setDispensedVisits((prev) => ({
      ...prev,
      [activeVisit.VisitID]: !prev[activeVisit.VisitID]
    }));
  };

  // Trigger bottle sticker label printing
  const handlePrintBottleLabels = () => {
    if (!selectedPatient || !activeVisit) return;
    const labelData = {
      patientName: selectedPatient.PatientName,
      patientAge: String(selectedPatient.AgeYears || ''),
      patientSex: selectedPatient.Sex || '',
      visitDate: activeVisit.VisitDate,
      visitId: activeVisit.VisitID,
      medicines: clinicalMedicines.map((cm, idx) => {
        let exp = cm.ExpireDate || '';
        if (!exp) {
          // Default expiry 1 year from visit
          const d = new Date(activeVisit.VisitDate || todayStr);
          d.setFullYear(d.getFullYear() + 1);
          exp = d.toISOString().split('T')[0];
        }
        return {
          name: cm.MedicineDetail || cm.ItemID || `Clinical Formula #${idx + 1}`,
          instructions: cm.Dosage || 'As directed by Doctor',
          notes: cm.Notes50 || 'Store in cool dry place away from direct sunlight',
          qty: String(cm.Qty || 1),
          expiry: exp
        };
      })
    };
    onOpenLabelPrintModal(labelData);
  };

  // Direct print of the Doctor's Visit Slip / Prescription
  const handlePrintPrescriptionSlip = () => {
    window.print();
  };

  return (
    <div className="space-y-3 animate-fadeIn" id="clinical-medicine-dispensary-view">
      
      {/* Top Patient Selector Header Bar */}
      <div className="bg-white p-2.5 sm:p-3 rounded-xl border border-slate-200/80 shadow-2xs space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-200 shrink-0">
              <FlaskConical className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="text-xs sm:text-sm font-black text-slate-900 tracking-tight">
                  Clinical Medicine Desk
                </h2>
                <span className="text-[9.5px] uppercase font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded-full">
                  Doctor Rx ➔ Dispense
                </span>
              </div>
              <p className="text-[10.5px] text-slate-500 font-medium hidden sm:block">
                Doctor visit slip, formulation compounding & sticker label printing
              </p>
            </div>
          </div>

          {/* Quick Filter Switch */}
          <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200 self-start sm:self-auto shrink-0">
            <button
              type="button"
              onClick={() => setFilterMode('today')}
              className={`px-2 py-1 rounded-md text-[11px] font-bold transition cursor-pointer flex items-center space-x-1 ${
                filterMode === 'today'
                  ? 'bg-white text-emerald-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Clock className="w-3 h-3" />
              <span>Today ({examinedPatients.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('all')}
              className={`px-2 py-1 rounded-md text-[11px] font-bold transition cursor-pointer flex items-center space-x-1 ${
                filterMode === 'all'
                  ? 'bg-white text-emerald-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Calendar className="w-3 h-3" />
              <span>All History</span>
            </button>
          </div>
        </div>

        {/* Dropdown & Live Search Row */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center pt-1 border-t border-slate-100">
          
          {/* Main Dropdown */}
          <div className="md:col-span-8">
            <div className="relative">
              <select
                value={selectedPatientId}
                onChange={(e) => setSelectedPatientId(e.target.value)}
                className="w-full text-[11px] font-bold border border-emerald-500/50 focus:border-emerald-600 rounded-lg p-1.5 sm:p-2 bg-emerald-50/40 text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-2xs cursor-pointer"
              >
                <option value="">-- Select Patient from Checked List ({filteredPatients.length} available) --</option>
                {filteredPatients.map((p, idx) => {
                  const pVis = visits.filter((v) => v.PatientID === p.PatientID);
                  const latestV = pVis.length > 0 ? pVis[pVis.length - 1] : null;
                  const medList = getVisitMedicinesList(latestV);
                  const clinCount = medList.filter((m) => m.MedicineType === 'C' || !m.MedicineType).length;
                  const tok = tokens.find((t) => t.PatientID === p.PatientID && t.Date === (latestV?.VisitDate || todayStr));
                  const tokenNo = tok?.TokenNo || latestV?.TokenNo;

                  return (
                    <option key={`disp-p-${p.PatientID}-${idx}`} value={p.PatientID}>
                      {p.PatientName} (ID: {p.PatientID}) {tokenNo ? `• [Token #${tokenNo}]` : ''} • {latestV ? latestV.VisitDate : 'No Visit'} {clinCount > 0 ? `• [${clinCount} Clinical Rx]` : ''}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          {/* Quick Name Search Filter Box */}
          <div className="md:col-span-4">
            <div className="relative">
              <Search className="w-3 h-3 absolute left-2.5 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search name, token or ID..."
                className="w-full text-[11px] font-semibold border border-slate-200 rounded-lg pl-7 pr-6 py-1.5 sm:py-2 bg-white text-slate-800 focus:outline-none focus:border-emerald-500 shadow-2xs"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2 top-2 text-slate-400 hover:text-slate-600 text-xs font-mono font-bold"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Quick Patient Pills (Today's Queue) */}
        {examinedPatients.length > 0 && (
          <div className="pt-1 flex items-center gap-1.5 overflow-hidden">
            <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
              ⚡ Queue:
            </span>
            <div className="flex flex-wrap gap-1 max-h-12 overflow-y-auto pr-1">
              {examinedPatients.slice(0, 10).map((p) => {
                const isSel = p.PatientID === selectedPatientId;
                const tok = tokens.find((t) => t.PatientID === p.PatientID && t.Date === todayStr);
                return (
                  <button
                    key={`quick-p-${p.PatientID}`}
                    type="button"
                    onClick={() => setSelectedPatientId(p.PatientID)}
                    className={`px-1.5 py-0.5 rounded-md text-[10.5px] font-bold transition flex items-center space-x-1 cursor-pointer ${
                      isSel
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                    }`}
                  >
                    <span className="truncate max-w-[110px]">{p.PatientName}</span>
                    {tok && <span className={`text-[9px] font-mono px-1 rounded ${isSel ? 'bg-emerald-700 text-white' : 'bg-slate-200 text-slate-800'}`}>#{tok.TokenNo}</span>}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Main Content Area: Doctor's Patient Visit Slip View */}
      {selectedPatient && activeVisit ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
          
          {/* Left / Main Column: The Doctor's Patient Visit Slip */}
          <div className="lg:col-span-8 space-y-3">
            
            {/* The Printable Patient Visit Slip Card */}
            <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-3.5 sm:p-4 space-y-3 relative overflow-hidden" id="doctor-visit-slip-card">
              
              {/* Top Accent Strip */}
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-blue-600"></div>

              {/* Slip Header */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 border-b border-slate-200 pb-2.5 pt-1">
                <div>
                  <h1 className="text-sm sm:text-base font-black text-slate-900 tracking-tight uppercase">
                    {clinicSettings.ClinicName || 'Homeopathic Clinic & Dispensary'}
                  </h1>
                  <p className="text-[10.5px] text-slate-500 font-medium">
                    {clinicSettings.Address || 'OPD Consultation & Clinical Compounding Pharmacy'}
                  </p>
                  <p className="text-[9.5px] text-slate-400 font-medium">
                    Phone: {clinicSettings.Phone || 'N/A'} {clinicSettings.Email ? `• ${clinicSettings.Email}` : ''}
                  </p>
                </div>

                <div className="bg-emerald-50/90 border border-emerald-200 rounded-lg p-2 text-right self-start shrink-0">
                  <span className="text-[9px] font-black uppercase tracking-wider text-emerald-800 block">
                    Doctor's Prescription Slip
                  </span>
                  <span className="text-xs font-black text-emerald-950 font-mono block">
                    Visit ID: {activeVisit.VisitID}
                  </span>
                  <div className="flex items-center justify-end gap-1.5 text-[10px] text-emerald-700 font-bold mt-0.5">
                    <span>Date: {activeVisit.VisitDate}</span>
                    <span>•</span>
                    <span>Shift {activeVisit.Shift === 1 ? '1 (M)' : '2 (E)'}</span>
                  </div>
                  {patientToken && (
                    <span className="inline-block mt-0.5 bg-emerald-600 text-white font-mono font-black text-[10px] px-1.5 py-0.2 rounded shadow-2xs">
                      Token #{patientToken}
                    </span>
                  )}
                </div>
              </div>

              {/* Patient Bio Data Grid */}
              <div className="bg-slate-50/80 border border-slate-200/80 rounded-lg p-2.5 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Patient Name:</span>
                  <span className="font-extrabold text-slate-900 text-xs truncate block">{selectedPatient.PatientName}</span>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Age / Gender:</span>
                  <span className="font-bold text-slate-800">{selectedPatient.AgeYears} Yrs • {selectedPatient.Sex}</span>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Patient ID:</span>
                  <span className="font-mono font-bold text-slate-700">{selectedPatient.PatientID}</span>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Contact Phone:</span>
                  <span className="font-bold text-slate-800">{selectedPatient.PhoneMobile || 'N/A'}</span>
                </div>
              </div>

              {/* Doctor's Diagnosis & Advice (if recorded) */}
              {(activeVisit.SymptomsDiagnosis || activeVisit.PatientAdvice) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                  {activeVisit.SymptomsDiagnosis && (
                    <div className="bg-amber-50/60 border border-amber-200/80 rounded-lg p-2">
                      <span className="text-[9px] font-black uppercase tracking-wider text-amber-800 block mb-0.5">
                        🩺 Symptoms & Diagnosis:
                      </span>
                      <p className="text-slate-800 font-medium whitespace-pre-line leading-snug">
                        {activeVisit.SymptomsDiagnosis}
                      </p>
                    </div>
                  )}
                  {activeVisit.PatientAdvice && (
                    <div className="bg-blue-50/60 border border-blue-200/80 rounded-lg p-2">
                      <span className="text-[9px] font-black uppercase tracking-wider text-blue-800 block mb-0.5">
                        💡 Doctor's Advice & Precautions:
                      </span>
                      <p className="text-slate-800 font-medium whitespace-pre-line leading-snug">
                        {activeVisit.PatientAdvice}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Prescribed Clinical Medicines (The Core Formulation Section) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between border-b border-emerald-200 pb-1.5">
                  <div className="flex items-center space-x-1.5">
                    <FlaskConical className="w-4 h-4 text-emerald-600" />
                    <div>
                      <h3 className="text-xs font-black text-slate-900 uppercase tracking-tight">
                        Prescribed Clinical Formulations
                      </h3>
                      <span className="text-[9.5px] text-slate-500 font-medium">
                        Custom Dilutions, Potencies & Compounded Medicines
                      </span>
                    </div>
                  </div>
                  <span className="bg-emerald-100 text-emerald-800 font-mono font-bold text-[10px] px-2 py-0.5 rounded-full">
                    {clinicalMedicines.length} Item(s)
                  </span>
                </div>

                {clinicalMedicines.length === 0 ? (
                  <div className="p-3 bg-slate-50 border border-dashed border-slate-300 rounded-lg text-center text-slate-400">
                    <p className="font-semibold text-[11px]">No Clinical Compounding Medicines prescribed in this visit slip.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-200 border border-slate-200 rounded-lg overflow-hidden shadow-2xs">
                    {clinicalMedicines.map((med, idx) => {
                      const prepKey = `${activeVisit.VisitID}-med-${idx}`;
                      const isItemPrep = Boolean(preparedItems[prepKey]);
                      let expDate = med.ExpireDate || '';
                      if (!expDate) {
                        const d = new Date(activeVisit.VisitDate || todayStr);
                        d.setFullYear(d.getFullYear() + 1);
                        expDate = d.toISOString().split('T')[0];
                      }

                      return (
                        <div
                          key={prepKey}
                          className={`p-2.5 transition ${
                            isItemPrep ? 'bg-emerald-50/50' : 'bg-white hover:bg-slate-50/60'
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div className="space-y-1 flex-1 min-w-0">
                              <div className="flex items-center space-x-1.5">
                                <span className="w-4 h-4 rounded-full bg-emerald-600 text-white font-mono font-bold text-[10px] flex items-center justify-center shrink-0">
                                  {idx + 1}
                                </span>
                                <h4 className="text-xs font-black text-slate-900 truncate">
                                  {med.MedicineDetail || med.ItemID || `Clinical Formulation #${idx + 1}`}
                                </h4>
                                <span className="bg-emerald-100 text-emerald-800 text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded shrink-0">
                                  Clinical Formula
                                </span>
                              </div>

                              {/* Dosage & Usage (Tareeqa-e-Istemal) */}
                              <div className="pl-6 space-y-0.5">
                                <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                                  <span className="text-slate-500 font-bold uppercase text-[9px]">Usage:</span>
                                  <span className="bg-blue-50 text-blue-900 border border-blue-200 px-1.5 py-0.2 rounded font-bold text-[10.5px]">
                                    {med.Dosage || '10 Drops 3 Times Daily before meals with water'}
                                  </span>
                                </div>

                                {med.Notes50 && (
                                  <div className="flex items-center gap-1.5 text-[10.5px] text-slate-600">
                                    <span className="text-slate-400 font-bold uppercase text-[9px]">Note:</span>
                                    <span className="italic">{med.Notes50}</span>
                                  </div>
                                )}

                                <div className="flex flex-wrap items-center gap-2 pt-0.5 text-[10.5px]">
                                  <div className="flex items-center space-x-1 text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.2 rounded text-[10px] font-bold font-mono">
                                    <Clock className="w-2.5 h-2.5 text-rose-500" />
                                    <span>Exp: <strong>{expDate}</strong></span>
                                  </div>
                                  <div className="flex items-center space-x-1 text-slate-600 font-mono text-[10px]">
                                    <Package className="w-2.5 h-2.5 text-slate-400" />
                                    <span>Qty: <strong>{med.Qty || 1} Bottle</strong></span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Pharmacist Ticking Checklist */}
                            <div className="sm:self-center shrink-0 pl-6 sm:pl-0">
                              <button
                                type="button"
                                onClick={() => toggleItemPrepared(prepKey)}
                                className={`px-2 py-1 rounded-lg text-[10.5px] font-bold flex items-center space-x-1 transition cursor-pointer ${
                                  isItemPrep
                                    ? 'bg-emerald-600 text-white shadow-2xs'
                                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200'
                                }`}
                              >
                                <Check className="w-3 h-3" />
                                <span>{isItemPrep ? '✓ Prepared' : 'Mark Prepared'}</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Patent Medicines Section (If Doctor Prescribed any outside/patent items) */}
              {patentMedicines.length > 0 && (
                <div className="space-y-1.5 pt-1.5 border-t border-slate-200">
                  <h4 className="text-[10px] font-black uppercase text-slate-600 flex items-center gap-1">
                    <Package className="w-3 h-3 text-blue-600" />
                    Additional Patent Medicines:
                  </h4>
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-2 divide-y divide-slate-200 text-[10.5px]">
                    {patentMedicines.map((pm, pIdx) => (
                      <div key={`pat-med-${pIdx}`} className="py-1 flex justify-between items-center">
                        <span className="font-bold text-slate-800">{pm.MedicineDetail || pm.ItemID}</span>
                        <span className="text-slate-500 font-mono">{pm.Dosage || 'As directed'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Doctor's Signature Footer Line */}
              <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between text-[10.5px] text-slate-500 gap-1.5">
                <div className="space-y-0.2">
                  <span className="font-bold text-slate-700">Examining Consultant: Dr. Muhammad Anjum</span>
                  <p className="text-[9.5px] text-slate-400">BHMS (Gold Medalist), R.H.M.P • Punjab Homeopathic Clinic</p>
                </div>
                <div className="text-right sm:border-t sm:border-slate-300 sm:pt-0.5 sm:w-40">
                  <span className="text-[9.5px] font-bold text-slate-600 block">Doctor's Stamp & Signature</span>
                </div>
              </div>

            </div>

          </div>

          {/* Right Column: Pharmacist Action & Label Printing Controls */}
          <div className="lg:col-span-4 space-y-2.5">
            
            {/* Store Preparation & Labeling Actions Box */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-3.5 space-y-2.5">
              <h3 className="text-xs font-black text-slate-900 border-b border-slate-100 pb-1.5 flex items-center justify-between">
                <span>Dispensary Actions</span>
                <span className="text-[9.5px] font-bold bg-blue-50 text-blue-700 px-1.5 py-0.2 rounded-full">
                  Pharmacist Store
                </span>
              </h3>

              {/* Status Indicator */}
              <div className={`p-2 rounded-lg border flex items-center space-x-2.5 ${
                isDispensed
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-amber-50 border-amber-200 text-amber-900'
              }`}>
                <div className={`p-1.5 rounded-lg shrink-0 ${
                  isDispensed ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'
                }`}>
                  {isDispensed ? <CheckCircle2 className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                </div>
                <div>
                  <span className="text-[11px] font-black uppercase tracking-wide block">
                    {isDispensed ? 'Dispensed & Handed Over' : 'Ready for Preparation'}
                  </span>
                  <span className="text-[10px] font-medium block mt-0.2 opacity-80">
                    {isDispensed
                      ? 'Clinical medicines given to patient.'
                      : 'Prepare formula & paste label.'}
                  </span>
                </div>
              </div>

              {/* Big Action Button 1: Print Bottle / Usage Sticker */}
              <button
                type="button"
                onClick={handlePrintBottleLabels}
                disabled={clinicalMedicines.length === 0}
                className={`w-full py-2 px-3 rounded-lg text-xs font-black text-white shadow-2xs transition flex items-center justify-center space-x-1.5 cursor-pointer ${
                  clinicalMedicines.length > 0
                    ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20 active:scale-[0.99]'
                    : 'bg-slate-400 cursor-not-allowed'
                }`}
              >
                <Tag className="w-3.5 h-3.5" />
                <span>🖨️ Print Bottle Usage Label</span>
              </button>

              {/* Big Action Button 2: Print Full Patient Visit Slip */}
              <button
                type="button"
                onClick={handlePrintPrescriptionSlip}
                className="w-full py-1.5 px-3 bg-white hover:bg-slate-50 border border-slate-300 hover:border-slate-400 text-slate-800 font-bold text-[11px] rounded-lg shadow-2xs transition flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5 text-slate-600" />
                <span>📄 Print Patient Visit Slip (Rx)</span>
              </button>

              {/* Big Action Button 3: Toggle Dispensed Status */}
              <button
                type="button"
                onClick={toggleVisitDispensed}
                className={`w-full py-1.5 px-3 rounded-lg text-[11px] font-bold transition flex items-center justify-center space-x-1.5 cursor-pointer border ${
                  isDispensed
                    ? 'bg-emerald-100 border-emerald-300 text-emerald-900 hover:bg-emerald-200'
                    : 'bg-slate-900 border-slate-900 text-white hover:bg-slate-800 shadow-2xs'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{isDispensed ? '✓ Mark as Pending' : '✓ Mark Completed / Dispensed'}</span>
              </button>

              {/* Information callout */}
              <div className="p-2 bg-slate-50 rounded-lg border border-slate-200 text-[10.5px] text-slate-600 space-y-0.5">
                <div className="flex items-center space-x-1 font-bold text-slate-800 text-[9.5px] uppercase tracking-wider">
                  <Info className="w-3 h-3 text-blue-500" />
                  <span>Clinical Workflow</span>
                </div>
                <p className="text-[10px] leading-tight text-slate-500">
                  Doctor enters the formulation during check-up. Pharmacist compounds formula, prints sticker label, and hands over to patient.
                </p>
              </div>

            </div>

            {/* Visit History of this patient (if they visited multiple times) */}
            {patientVisits.length > 1 && (
              <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-3 space-y-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                  Past Visit History ({patientVisits.length} visits)
                </span>
                <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                  {patientVisits.map((v, vIdx) => {
                    const isCur = v.VisitID === activeVisit.VisitID;
                    return (
                      <div
                        key={`v-hist-${v.VisitID}`}
                        className={`p-1.5 rounded-md border text-[10.5px] flex items-center justify-between ${
                          isCur
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-bold'
                            : 'bg-slate-50 border-slate-200 text-slate-700'
                        }`}
                      >
                        <div>
                          <span className="block font-mono text-[10px]">{v.VisitID}</span>
                          <span className="text-[9.5px] text-slate-500">{v.VisitDate}</span>
                        </div>
                        {isCur && <span className="text-[9px] bg-emerald-600 text-white px-1 py-0.2 rounded font-bold">Active</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

          </div>

        </div>
      ) : (
        /* Empty State: Prompting User to Select a Patient */
        <div className="bg-white rounded-xl border-2 border-dashed border-slate-300 p-6 sm:p-8 text-center space-y-3 shadow-2xs">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mx-auto border border-emerald-200">
            <Stethoscope className="w-6 h-6" />
          </div>
          <div className="max-w-md mx-auto space-y-0.5">
            <h3 className="text-sm font-black text-slate-900">
              No Patient Selected
            </h3>
            <p className="text-[11px] text-slate-500">
              Please choose a patient from the dropdown above or click any patient from Today's Queue to display the Doctor's Visit Slip, Clinical Formulations, Usage Directions & Expiry.
            </p>
          </div>

          {examinedPatients.length > 0 && (
            <div className="pt-2 max-w-xl mx-auto">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1.5">
                Available Checked Patients Today:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-left">
                {examinedPatients.slice(0, 6).map((p) => {
                  const pVis = visits.filter((v) => v.PatientID === p.PatientID);
                  const latestV = pVis.length > 0 ? pVis[pVis.length - 1] : null;
                  const tok = tokens.find((t) => t.PatientID === p.PatientID && t.Date === todayStr);

                  return (
                    <button
                      key={`empty-p-${p.PatientID}`}
                      type="button"
                      onClick={() => setSelectedPatientId(p.PatientID)}
                      className="p-2 bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 rounded-lg transition text-left cursor-pointer flex items-center justify-between group"
                    >
                      <div>
                        <span className="font-extrabold text-[11px] text-slate-900 group-hover:text-emerald-900 block truncate">
                          {p.PatientName}
                        </span>
                        <span className="text-[9.5px] text-slate-500 font-mono block">
                          ID: {p.PatientID} {tok ? `• Token #${tok.TokenNo}` : ''}
                        </span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600 transition group-hover:translate-x-0.5" />
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
};
