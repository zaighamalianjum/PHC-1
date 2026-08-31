/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import {
  Grid,
  Search,
  Users,
  Calendar,
  Sparkles,
  Printer,
  ChevronLeft,
  ChevronRight,
  Database,
  FlaskConical,
  Pill,
  Clock,
  X,
  Plus,
  Stethoscope,
  HeartHandshake,
  Table,
  Pencil,
  FileText,
  Trash2
} from 'lucide-react';
import { Patient, Visit, VisitMedicine, Item, City, NhcPatientHistory, Appointment, InvoiceHeader } from '../../types';
import { formatDisplayDate, matchPatientRecord, isSamePatient } from './patientDeskUtils';

export default function PatientGridView(props: any) {
  const {
    patients,
    nhcPatients,
    visits,
    visitMedicines,
    items,
    cities,
    gridViewSearch,
    setGridViewSearch,
    gridViewSelectedDate,
    setGridViewSelectedDate,
    gridViewPage,
    setGridViewPage,
    gridViewPageSize,
    setGridViewPageSize,
    onOpenDateSelectorModal,
    onOpenEditRecentRecordsModal,
    onStartVisitDeskForPatient,
    getPatientCity,
    nhcArchiveList,
    pvNhcHistory,
    gridViewStartDate,
    setGridViewStartDate,
    gridViewEndDate,
    setGridViewEndDate,
    gridViewDatePreset,
    setGridViewDatePreset,
    gridViewGenderFilter,
    setGridViewGenderFilter,
    gridViewFocOnly,
    setGridViewFocOnly,
    appointments,
    invoices,
    handleOpenRecentVisitsModal,
    setIsDetailReportModalOpen,
    openGridVisitSelectorModal,
    setDeletePatientModalData
  } = props;

  const term = gridViewSearch.trim().toLowerCase();
  
  const getLocalDateString = (d: Date = new Date()): string => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

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
                    <option value="all">📅 All Dates</option>
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
                  <span>FOC Cases {gridViewFocOnly ? '✓' : ''}</span>
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
                                          • {m.MedicineDetail} ({m.Dosage || '1-0-1'})
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                  {patentMeds.length > 0 && (
                                    <div className="bg-blue-50/80 border border-blue-200 p-1 rounded">
                                      <strong className="text-blue-900 font-bold block text-[8px] uppercase">Patent:</strong>
                                      {patentMeds.map((m, i) => (
                                        <div key={i} className="text-blue-950 font-medium truncate">
                                          • {m.MedicineDetail} ({m.Dosage || 'As directed'})
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
}
