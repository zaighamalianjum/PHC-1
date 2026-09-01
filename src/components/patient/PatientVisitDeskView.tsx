/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState } from 'react';
import {
  Stethoscope,
  Coins,
  Search,
  Users,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Printer,
  History,
  Phone,
  MapPin,
  Calendar,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  FileText,
  Copy,
  Receipt,
  Building2,
  Pill,
  Trash2,
  X,
  Plus,
  Edit3,
  FlaskConical,
  HeartHandshake,
  Tag,
  Clock,
  Pencil,
  Database,
  Eye,
  EyeOff,
  ListOrdered
} from 'lucide-react';
import {
  Patient,
  Visit,
  VisitMedicine,
  Item,
  City,
  NhcPatientHistory,
  Appointment,
  Token,
  LabTest,
  InvoiceHeader,
  ClinicSettings
} from '../../types';
import {
  formatDisplayDate,
  matchPatientRecord,
  matchPatientIdOrNameOnly,
  isPakistaniMobilePrefix,
  getWeeksLabel,
  WhatsAppIcon,
  isSamePatient,
  parseCleanVisitDate
} from './patientDeskUtils';

export default function PatientVisitDeskView(props: any) {
  const {
    selectedPvPatient,
    pvPrescriptionModalOpen,
    setPvPrescriptionModalOpen,
    handleSendWhatsAppRx,
    handleCleanPrintTab,
    printDocType,
    setPrintDocType,
    pvOpdFeePkr,
    setPvOpdFeePkr,
    pvClinicalMedicinePkr,
    setPvClinicalMedicinePkr,
    pvFilePkr,
    setPvFilePkr,
    pvCardPkr,
    setPvCardPkr,
    pvLabTestAdvice,
    setPvLabTestAdvice,
    getLabTestList,
    shift,
    setShift,
    showDailyBreakdownMobile,
    setShowDailyBreakdownMobile,
    shiftDailyCollection,
    pvPatientSearch,
    setPvPatientSearch,
    editingVisitId,
    setEditingVisitId,
    pvSelectedPatientId,
    setPvSelectedPatientId,
    pvVisitDate,
    setPvVisitDate,
    pvSymptomsDiagnosis,
    setPvSymptomsDiagnosis,
    setPvClinicalItems,
    pvClinicalItems,
    items,
    clinicSettings,
    pvPatientItems,
    setPvPatientItems,
    handleSavePatientVisit,
    groupedRxByDate,
    tokens,
    appointments,
    visits,
    patients,
    nhcPatients,
    cities,
    addClinicalItem,
    removeClinicalItem,
    updateClinicalItem,
    addPatientItem,
    removePatientItem,
    updatePatientItem,
    handleOpenSmartLocator,
    handleFocusPatientVisitInput,
    handleToggleLabTestAdvice,
    handleOpenPrintModal,
    handlePrintPreviousVisitPrescription,
    handlePrintPreviousRxDirect,
    handlePrintDailyReport,
    handleAddNewVisit,
    handleEditVisit,
    handleOpenNewPatientModal,
    handleExecutePatientSearch,
    loadPvPatientHistory,
    resetPvConsultationFields,
    fetchNhcArchive,
    allSymptomsText,
    allMedicalReportResultsText,
    allLabTestsText,
    combinedPreviousHistory,
    displayedPreviousHistory,
    uniquePvVisitDates,
    pvPatientDropdownOptions,
    pvNhcHistory,
    setPvNhcHistory,
    nhcArchiveList,
    hidePreviousHistory,
    setHidePreviousHistory,
    isFetchingPvHistory,
    isSavingVisit,
    isSearchLoadingModal,
    pvClinicalMedicineExpireDate,
    setPvClinicalMedicineExpireDate,
    pvMedicalReportResult,
    setPvMedicalReportResult,
    pvSelectedHistoryDate,
    setPvSelectedHistoryDate,
    pvSaveSuccess,
    setPvSaveSuccess,
    pvSaveError,
    setPvLabTestModalOpen,
    setHistoryAlertModalOpen,
    setIsClaimBillModalOpen,
    setIsMultiPatientModalOpen,
    setExpireDateByWeeks
  } = props;

  const pvPatientMedicine = (pvPatientItems || []).map((i: any) => i.medicineName).filter(Boolean).join('\n');
  const pvPatientDosage = (pvPatientItems || []).map((i: any) => i.dosage).filter(Boolean).join('\n');

  // ------------------------------------------------------------------------------------------
  // 📅 MATCHED APPOINTMENT HISTORY & LAST FEE FOR SELECTED PATIENT
  // ------------------------------------------------------------------------------------------
  const patientAppointments: Appointment[] = React.useMemo(() => {
    if (!selectedPvPatient?.PatientID && !selectedPvPatient?.PatientName) return [];
    return (props.appointments || [])
      .filter((a: Appointment) => 
        isSamePatient(a.PatientID, selectedPvPatient?.PatientID) || 
        (selectedPvPatient?.PatientName && (a as any).PatientName && String((a as any).PatientName).trim().toLowerCase() === String(selectedPvPatient.PatientName).trim().toLowerCase())
      )
      .sort((a: Appointment, b: Appointment) => {
        const da = new Date(parseCleanVisitDate(a.AppointmentDate) || '').getTime() || 0;
        const db = new Date(parseCleanVisitDate(b.AppointmentDate) || '').getTime() || 0;
        return db - da; // Most recent first
      });
  }, [selectedPvPatient?.PatientID, selectedPvPatient?.PatientName, props.appointments]);

  const lastAppointmentFee: number = React.useMemo(() => {
    const validApp = patientAppointments.find(a => 
      Number(a.FeeCharged) > 0 || Number((a as any).PaidAmount) > 0 || Number((a as any).ConsultationFee) > 0 || Number((a as any).Fee) > 0
    );
    return validApp ? Number((validApp as any).PaidAmount || (validApp as any).ConsultationFee || validApp.FeeCharged || (validApp as any).Fee || 0) : 0;
  }, [patientAppointments]);

  return (
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
                            <span>⚡ {matchedCount} Patients Found - Click to Choose</span>
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
                        {lastAppointmentFee > 0 && (
                          <span
                            className="text-[10px] bg-emerald-100 text-emerald-950 font-black px-2 py-0.2 rounded-md font-mono flex items-center border border-emerald-300 shadow-2xs cursor-pointer hover:bg-emerald-200 transition"
                            title={`Appointment payment on record for this patient: PKR ${lastAppointmentFee}. Click to apply as OPD fee.`}
                            onClick={() => setPvOpdFeePkr(String(lastAppointmentFee))}
                          >
                            <Coins className="w-3 h-3 mr-1 text-emerald-700" />
                            <span>Appointment Fee: PKR {lastAppointmentFee.toLocaleString()}</span>
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
                <p className="text-[10px] text-amber-600 mt-0.5">There are no previous consultation or prescription records for this patient.</p>
              </div>
            ) : (
              /* FULL-WIDTH HISTORY DETAILS LAYOUT */
              <div className="w-full space-y-2.5 min-h-[200px]">
                {displayedPreviousHistory.length === 0 && combinedPreviousHistory.length > 0 ? (
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
                            {(() => {
                              const resolvedOpdFee = Number(group.filePkr || 0);
                              const resolvedClinPkr = Number(group.clinicalMedicinePkr || 0);
                              const resolvedCardPkr = Number(group.cardPkr || 0);
                              const totalPaidPkr = resolvedOpdFee + resolvedClinPkr + resolvedCardPkr;

                              return (
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
                                        OPD Fee: <strong className="text-white">PKR {resolvedOpdFee.toLocaleString()}</strong>
                                      </span>
                                      <span className="text-slate-500 mx-1.5">•</span>
                                      <span className="text-amber-300 font-bold">
                                        Clinical Meds: <strong className="text-white">PKR {resolvedClinPkr.toLocaleString()}</strong>
                                      </span>
                                      {resolvedCardPkr > 0 && (
                                        <>
                                          <span className="text-slate-500 mx-1.5">•</span>
                                          <span className="text-purple-300 font-bold">
                                            Card: <strong className="text-white">PKR {resolvedCardPkr.toLocaleString()}</strong>
                                          </span>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                  <div className="bg-emerald-600/90 text-white px-2 py-0.5 rounded text-[10px] font-mono font-black border border-emerald-400/40 shrink-0">
                                    Total Paid: PKR {totalPaidPkr.toLocaleString()}
                                  </div>
                                </div>
                              );
                            })()}
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
                      <div className="flex items-center justify-between mb-0.5">
                        <label className="block text-[9px] font-extrabold text-slate-600 uppercase truncate">OPD / App (PKR):</label>
                        {lastAppointmentFee > 0 && (
                          <button
                            type="button"
                            onClick={() => setPvOpdFeePkr(String(lastAppointmentFee))}
                            className="text-[8px] font-extrabold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 px-1 py-0.2 rounded transition cursor-pointer border border-emerald-300"
                            title={`Click to set OPD fee to last appointment fee: PKR ${lastAppointmentFee}`}
                          >
                            Last: {lastAppointmentFee}
                          </button>
                        )}
                      </div>
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
                      <span>📋 Select Tests (Modal)</span>
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
                            ×
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
                              <p className="text-[10px] text-slate-700 font-bold">کلینک اپائنٹمنٹ اور دیگر معلومات کیلئے</p>
                              <div className="inline-block border-2 border-slate-900 text-slate-950 font-mono font-black text-xs px-3 py-0.5 rounded-full mt-0.5">
                                0300-4202383
                              </div>
                            </div>

                            {/* Address & Email */}
                            <div className="text-[10px] text-slate-700 pt-2 border-t border-slate-200 space-y-0.5">
                              <p className="font-semibold">10 شالیمار روڈ، گڑھی شاہو، لاہور-39</p>
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
    </div>
  );
}
