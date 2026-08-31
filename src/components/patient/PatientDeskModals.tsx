/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import {
  History,
  X,
  Printer,
  FileText,
  FlaskConical,
  Sparkles,
  Search,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Tag,
  Building2,
  Copy,
  Receipt,
  Users,
  Coins,
  Calendar,
  Clock,
  Pill,
  Trash2,
  Edit3,
  CreditCard,
  Phone,
  Plus,
  Grid,
  UserPlus,
  Ticket,
  Save,
  MapPin,
  Pencil,
  Check,
  Table,
  User as UserIcon,
  Stethoscope,
  CalendarPlus,
  HeartHandshake
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
  ClinicSettings,
  SmartLocatorMedicine,
  MultiPatientSearchResult
} from '../../types';
import { formatDisplayDate, matchPatientRecord, matchPatientIdOrNameOnly, isSamePatient, formatReportDate, parseCleanVisitDate } from './patientDeskUtils';

const WhatsAppIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.573-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c-.001 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

const parseDateToISOKey = (dateStr?: string | null): string => {
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
};

export default function PatientDeskModals(props: any) {
  const {
    allLabTestsText,
    allMedicalReportResultsText,
    appDate,
    appError,
    appSuccess,
    appointments,
    canAdd,
    canBookAppointment,
    canIssueToken,
    claimBillCustomOrg,
    claimBillDesignation,
    claimBillEmployeeId,
    claimBillOrg,
    claimBillRemarks,
    clinicSettings,
    currentUser,
    dailyCollectionReportData,
    dailyCollectionReportFormat,
    deletePatientModalData,
    detailReportMode,
    detailReportSearch,
    detailReportShiftFilter,
    directVisitShiftModal,
    executeDeletePatientRecord,
    executeSavePatientVisit,
    existingFee,
    fetchNhcArchive,
    filteredPatients,
    focReason,
    focWaivedClinicalFee,
    focWaivedFileCardFee,
    focWaivedOpdFee,
    futureBookingModal,
    generateDailyCollectionReport,
    getLabTestList,
    getPatientVisitDateOptions,
    getResolvedNhcPatientName,
    gridSelectorMode,
    gridSelectorPatientId,
    gridSelectorSelectedDate,
    gridViewEndDate,
    gridViewStartDate,
    groupedRxByDate,
    handleAddCustomLabTest,
    handleBookAppointment,
    handleCleanPrintDailyCollectionReport,
    handleConfirmDirectVisitToken,
    handleConfirmGridVisitSelection,
    handleIssueTokenForNewPatient,
    handlePrintClaimBill,
    handlePrintPreviousVisitPrescription,
    handleSaveFromRecentModal,
    handleSelectPatientFromModal,
    handleSelectPatientFromMultiModal,
    handleSelectSmartMedicine,
    handleToggleLabTestAdvice,
    historyAlertModalOpen,
    invoices,
    isClaimBillModalOpen,
    isDailyCollectionReportModalOpen,
    isDetailReportModalOpen,
    isFetchingPvHistory,
    isGridVisitSelectorModalOpen,
    isMultiPatientModalOpen,
    isNewPatientSearchModalOpen,
    isOpdTokenModalOpen,
    isRecentVisitsModalOpen,
    isReportDateModalOpen,
    isSearchLoadingModal,
    isSearchingArchive,
    isSubmittingToken,
    items,
    labTests,
    loadVisitIntoModalForm,
    modalCardPkr,
    modalClinicalItems,
    modalClinicalMedicinePkr,
    modalConsultationFee,
    modalEditingVisitId,
    modalFilePkr,
    modalLabTestAdvice,
    modalMedicalReportResult,
    modalPatentItems,
    modalPatientId,
    modalPatientName,
    modalRemarks,
    modalSaveError,
    modalSaveSuccess,
    modalSymptomsDiagnosis,
    modalVisitDate,
    mongoSmartLocatorList,
    multiPatientModalFilter,
    multiPatientSearchQuery,
    multiPatientSearchResults,
    newPatName,
    newPatPhone,
    newPatRemarks,
    newPatientSearchQuery,
    nhcArchiveList,
    nhcPatients,
    opdTokenModalPatient,
    openWhatsAppUrl,
    patients,
    pvCardPkr,
    pvClinicalMedicinePkr,
    pvCustomTestInput,
    pvFilePkr,
    pvLabTestAdvice,
    pvLabTestModalOpen,
    pvLabTestModalSearch,
    pvNhcHistory,
    pvSmartLocatorModalOpen,
    pvSmartLocatorNotification,
    pvSmartLocatorSearch,
    pvSmartLocatorSelectedTag,
    pvSmartLocatorTargetBox,
    pvVisitDate,
    recentModalPatientOnly,
    recentModalSearch,
    regSuccessData,
    regSuccessModalOpen,
    reportEndDate,
    reportStartDate,
    selectedPatientId,
    selectedPvPatient,
    selectedReportTypeInModal,
    setAppDate,
    setClaimBillCustomOrg,
    setClaimBillDesignation,
    setClaimBillEmployeeId,
    setClaimBillOrg,
    setClaimBillRemarks,
    setDailyCollectionEndDate,
    setDailyCollectionReportData,
    setDailyCollectionReportFormat,
    setDailyCollectionStartDate,
    setDeletePatientModalData,
    setDetailReportMode,
    setDetailReportSearch,
    setDetailReportShiftFilter,
    setDirectVisitShiftModal,
    setExistingFee,
    setFocReason,
    setFocWaivedClinicalFee,
    setFocWaivedFileCardFee,
    setFocWaivedOpdFee,
    setFutureBookingModal,
    setGridSelectorSelectedDate,
    setHidePreviousHistory,
    setHistoryAlertModalOpen,
    setIsClaimBillModalOpen,
    setIsDailyCollectionReportModalOpen,
    setIsDetailReportModalOpen,
    setIsGridVisitSelectorModalOpen,
    setIsMultiPatientModalOpen,
    setIsNewPatientSearchModalOpen,
    setIsOpdTokenModalOpen,
    setIsRecentVisitsModalOpen,
    setIsReportDateModalOpen,
    setModalCardPkr,
    setModalClinicalItems,
    setModalClinicalMedicinePkr,
    setModalConsultationFee,
    setModalFilePkr,
    setModalLabTestAdvice,
    setModalMedicalReportResult,
    setModalPatentItems,
    setModalPatientId,
    setModalPatientName,
    setModalRemarks,
    setModalSymptomsDiagnosis,
    setModalVisitDate,
    setMultiPatientModalFilter,
    setNewPatName,
    setNewPatPhone,
    setNewPatRemarks,
    setNewPatientSearchQuery,
    setPvClinicalItems,
    setPvClinicalMedicineExpireDate,
    setPvCustomTestInput,
    setPvLabTestAdvice,
    setPvLabTestModalOpen,
    setPvLabTestModalSearch,
    setPvMedicalReportResult,
    setPvPatientItems,
    setPvSaveSuccess,
    setPvSmartLocatorModalOpen,
    setPvSmartLocatorSearch,
    setPvSmartLocatorSelectedTag,
    setPvSmartLocatorTargetBox,
    setPvSymptomsDiagnosis,
    setRecentModalPatientOnly,
    setRecentModalSearch,
    setRegSuccessData,
    setRegSuccessModalOpen,
    setReportEndDate,
    setReportStartDate,
    setSelectedReportTypeInModal,
    setShift,
    setShowFocFeeDetailsModal,
    setShowFollowUpConfirmModal,
    setSmsSentToast,
    setTokenIssueMode,
    setWaCopied,
    setWaModalMessage,
    setWaModalMobile,
    setWaModalOpen,
    shift,
    showFocFeeDetailsModal,
    showFollowUpConfirmModal,
    smartLocatorMedicines,
    smsSentToast,
    tokenIssueMode,
    tokens,
    visits,
    waCopied,
    waModalMessage,
    waModalMobile,
    waModalOpen,
    waModalPatientId,
    waModalPatientName
  } = props;

  return (
    <>
      {/* Patient Previous Visit History Alert Popup Modal */}
      {historyAlertModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden my-auto">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-4 flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-indigo-500/20 text-indigo-300 rounded-xl border border-indigo-400/30">
                  <History className="w-5 h-5 text-indigo-300" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                    <span>Patient Previous Visit History & Prescriptions Alert</span>
                  </h3>
                  <p className="text-[11px] text-indigo-200">
                    {selectedPvPatient
                      ? (groupedRxByDate.length > 0 
                          ? `Found ${groupedRxByDate.length} previous visit date(s) for ${selectedPvPatient.PatientName}`
                          : `No previous visit history found for ${selectedPvPatient.PatientName}`)
                      : 'Search or select a patient to view previous history'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setHistoryAlertModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Patient Info Bar */}
            {selectedPvPatient && (
              <div className="bg-indigo-50/80 p-3 border-b border-indigo-100 flex flex-wrap items-center justify-between text-xs shrink-0 gap-2">
                <div>
                  <span className="text-[9px] font-black text-indigo-800 uppercase tracking-wider block">Patient Profile</span>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-900 text-sm">{selectedPvPatient.PatientName}</span>
                    <span className="font-mono text-[10px] bg-indigo-100 text-indigo-900 px-2 py-0.5 rounded font-bold">
                      ID: {selectedPvPatient.PatientID}
                    </span>
                    {(() => {
                      const activeTok = (tokens || []).find(t => t.PatientID === selectedPvPatient.PatientID);
                      return activeTok ? (
                        <span className="font-mono text-[10px] bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full font-black">
                          Token #{activeTok.TokenNo}
                        </span>
                      ) : null;
                    })()}
                  </div>
                </div>
                <div className="text-right text-[11px] text-slate-600">
                  <p>Age/Sex: <span className="font-bold text-slate-800">{selectedPvPatient.AgeYears} yrs / {selectedPvPatient.Sex}</span></p>
                  <p>Phone: <span className="font-mono font-bold text-slate-800">{selectedPvPatient.PhoneMobile || 'N/A'}</span></p>
                </div>
              </div>
            )}

            {/* Modal Body */}
            <div className="p-4 overflow-y-auto space-y-3.5 flex-1 text-xs">
              {!selectedPvPatient ? (
                <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <Search className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-bold text-slate-700">No Patient Selected</p>
                  <p className="text-xs text-slate-400 mt-1">Please enter a Mobile No or Patient ID in the search box to view previous visit history.</p>
                </div>
              ) : isFetchingPvHistory ? (
                <div className="text-center py-8 bg-indigo-50/40 rounded-xl border border-indigo-100 flex flex-col items-center justify-center space-y-2">
                  <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-xs font-bold text-indigo-900">Loading Patient Previous Visit History & Prescriptions...</p>
                </div>
              ) : groupedRxByDate.length > 0 ? (
                <>
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs font-semibold flex items-start space-x-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-amber-950">
                        Most Recent Visit Record ({groupedRxByDate[0]?.date || 'N/A'})
                      </p>
                      <p className="text-[11px] text-amber-800 font-normal mt-0.5">
                        Displaying patient's latest visit record. Total recorded visits on profile: {groupedRxByDate.length}.
                      </p>
                    </div>
                  </div>

                  {(allLabTestsText || allMedicalReportResultsText) && (
                    <div className="p-3 bg-blue-50/90 border border-blue-200 rounded-xl text-blue-950 text-xs font-semibold space-y-1.5 shadow-2xs">
                      <div className="flex items-center space-x-1.5 font-bold text-blue-900 border-b border-blue-200 pb-1">
                        <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                        <span>Advised Lab Investigations & Medical Report Results:</span>
                      </div>
                      {allLabTestsText && (
                        <div>
                          <span className="text-slate-500 font-bold uppercase text-[9px] tracking-wider block">Advised Lab Tests:</span>
                          <p className="font-mono text-slate-800 font-bold text-xs">{allLabTestsText}</p>
                        </div>
                      )}
                      {allMedicalReportResultsText && (
                        <div className={allLabTestsText ? 'pt-1.5 border-t border-blue-200/60' : ''}>
                          <span className="text-indigo-900 font-extrabold uppercase text-[9px] tracking-wider block mb-0.5">
                            Medical Report Result (nhc_Patient_history):
                          </span>
                          <div className="bg-white border border-indigo-100 rounded-lg p-2.5 text-indigo-950 font-semibold text-xs whitespace-pre-wrap">
                            {allMedicalReportResultsText}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <h4 className="font-bold text-slate-700 text-xs uppercase tracking-wider">
                    Recent Prescribed Medicines (Rx) Record:
                  </h4>

                  <div className="space-y-3">
                    {groupedRxByDate.slice(0, 1).map((group, groupIdx) => (
                      <div key={`grp-print-${group.date}-${groupIdx}`} className="border border-slate-900 rounded-xl bg-white p-3 space-y-2.5 shadow-2xs">
                        {/* Top Row: Date & Item Count Badge + Copy & Print Rx Buttons */}
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                          <span className="font-bold text-slate-800 text-xs font-mono">Recent Visit Date: {formatDisplayDate(group.date)}</span>
                          <div className="flex items-center space-x-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                handlePrintPreviousVisitPrescription(group);
                                setHistoryAlertModalOpen(false);
                              }}
                              className="px-2 py-0.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-[9px] font-bold rounded flex items-center space-x-1 cursor-pointer transition"
                            >
                              <Printer className="w-2.5 h-2.5 text-emerald-600" />
                              <span>Print Rx</span>
                            </button>
                            <button
                              type="button"
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
                                setHistoryAlertModalOpen(false);
                                setTimeout(() => setPvSaveSuccess(''), 4000);
                              }}
                              className="px-2 py-0.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-[9px] font-bold rounded flex items-center space-x-1 cursor-pointer transition"
                            >
                              <Copy className="w-2.5 h-2.5 text-indigo-600" />
                              <span>Copy This Date Rx</span>
                            </button>
                            <span className="text-[9px] font-extrabold text-slate-500 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded uppercase tracking-wider">
                              {group.totalItems} ITEM(S)
                            </span>
                          </div>
                        </div>

                        {group.symptoms && (
                          <div className="text-[10px] text-slate-700 bg-slate-50 px-2 py-1 rounded border border-slate-200 font-medium">
                            <strong className="text-slate-900">Diagnosis / Symptoms:</strong> {group.symptoms}
                          </div>
                        )}

                        {(group.labTestAdvice && group.labTestAdvice !== 'N/A' || group.medicalReportResult && group.medicalReportResult !== 'N/A') && (
                          <div className="text-[10px] bg-blue-50/80 p-2.5 rounded-lg border border-blue-200 text-blue-950 font-medium space-y-1">
                            <div className="flex items-center space-x-1.5 font-bold text-blue-900 border-b border-blue-200/60 pb-1">
                              <FileText className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                              <span>Advised Lab Investigations & Medical Report Results:</span>
                            </div>
                            {group.labTestAdvice && group.labTestAdvice !== 'N/A' && (
                              <div>
                                <span className="text-slate-500 font-bold uppercase text-[8px] tracking-wider block">Advised Lab Tests:</span>
                                <p className="font-mono text-slate-800 font-semibold">{group.labTestAdvice}</p>
                              </div>
                            )}
                            {group.medicalReportResult && group.medicalReportResult !== 'N/A' && (
                              <div>
                                <span className="text-indigo-900 font-bold uppercase text-[8px] tracking-wider block">Medical Report Result (nhc_Patient_history):</span>
                                <div className="bg-white border border-indigo-100 rounded p-1.5 text-indigo-950 font-semibold text-[10px] whitespace-pre-wrap mt-0.5">
                                  {group.medicalReportResult}
                                </div>
                              </div>
                            )}
                          </div>
                        )}

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

                        {/* MODAL PAYMENT BREAKDOWN BADGE */}
                        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-xl p-2.5 flex flex-wrap items-center justify-between gap-2 shadow-2xs border border-indigo-900/40">
                          <div className="flex items-center space-x-2">
                            <div className="p-1.5 bg-emerald-500/20 text-emerald-300 rounded-md shrink-0">
                              <Coins className="w-3.5 h-3.5 text-emerald-300" />
                            </div>
                            <div className="text-[11px] font-mono">
                              <span className="text-slate-300 font-extrabold uppercase text-[9px] block">
                                Payment Received on Last Visit ({formatDisplayDate(group.date)}):
                              </span>
                              <span className="text-blue-300 font-bold">
                                Appointment Fee: <strong className="text-white">PKR {Number(group.filePkr || 0).toLocaleString()}</strong>
                              </span>
                              <span className="text-slate-500 mx-1.5">•</span>
                              <span className="text-amber-300 font-bold">
                                Clinical Medicine: <strong className="text-white">PKR {Number(group.clinicalMedicinePkr || 0).toLocaleString()}</strong>
                              </span>
                            </div>
                          </div>
                          <div className="bg-emerald-600/90 text-white px-2.5 py-1 rounded-lg text-xs font-mono font-black border border-emerald-400/40 shrink-0">
                            Total Paid: PKR {(Number(group.filePkr || 0) + Number(group.clinicalMedicinePkr || 0)).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200 space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                  <h4 className="font-bold text-slate-800 text-sm">New Patient / No Previous History</h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    No previous visit history or prescription records found for this patient. You can write a fresh prescription below.
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 p-3 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2 shrink-0">
              {groupedRxByDate.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    const latestGroup = groupedRxByDate[0];
                    if (latestGroup) {
                      const cItems = latestGroup.clinicalItems
                        .filter(i => i.medicineName && i.medicineName !== 'None prescribed' && i.medicineName !== 'None recorded')
                        .map((i, idx) => ({ id: String(Date.now() + idx), medicineName: i.medicineName, dosage: i.dosage && i.dosage !== 'As directed' ? i.dosage : '' }));

                      const pItems = latestGroup.patentItems
                        .filter(i => i.medicineName && i.medicineName !== 'None prescribed' && i.medicineName !== 'None recorded')
                        .map((i, idx) => ({ id: String(Date.now() + idx + 100), medicineName: i.medicineName, dosage: i.dosage && i.dosage !== 'As directed' ? i.dosage : '' }));

                      const cExp = latestGroup.clinicalItems.map(i => i.expireDate).find(Boolean) || '';

                      if (cItems.length > 0) setPvClinicalItems(cItems);
                      if (pItems.length > 0) setPvPatientItems(pItems);
                      if (cExp) setPvClinicalMedicineExpireDate(cExp);

                      if (latestGroup.symptoms) {
                        setPvSymptomsDiagnosis(latestGroup.symptoms);
                      }
                      if (latestGroup.medicalReportResult && latestGroup.medicalReportResult !== 'N/A') {
                        setPvMedicalReportResult(latestGroup.medicalReportResult);
                      }
                      if (latestGroup.labTestAdvice && latestGroup.labTestAdvice !== 'N/A') {
                        setPvLabTestAdvice(latestGroup.labTestAdvice);
                      }

                      setPvSaveSuccess(`Latest prescription (${latestGroup.date}) copied into current visit!`);
                      setHidePreviousHistory(true);
                      setTimeout(() => setPvSaveSuccess(''), 4000);
                    }
                    setHistoryAlertModalOpen(false);
                  }}
                  className="w-full sm:w-auto px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center space-x-1.5 cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Recent Rx to Current Form</span>
                </button>
              )}
              
              <button
                type="button"
                onClick={() => setHistoryAlertModalOpen(false)}
                className="w-full sm:w-auto px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl transition cursor-pointer text-center"
              >
                Close & Continue to Desk
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NEW PATIENT REGISTRATION SUCCESS POPUP MODAL */}
      {regSuccessModalOpen && regSuccessData && (
        <div className="fixed inset-0 z-[9999] bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-sm w-full border border-emerald-300 shadow-2xl p-6 space-y-4 animate-scaleUp text-center">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner border border-emerald-200">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            
            <div>
              <h3 className="text-lg font-black text-slate-900">Save Successfully</h3>
              <p className="text-xs text-slate-500 font-medium mt-1">
                New patient intake file has been saved to EMR records.
              </p>
            </div>

            <div className="bg-emerald-50/80 p-3.5 rounded-xl border border-emerald-200 text-xs text-left space-y-1.5 font-sans">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Patient ID:</span>
                <span className="font-mono font-black text-emerald-800 bg-white px-2 py-0.5 rounded border border-emerald-300">{regSuccessData.patientId}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Patient Name:</span>
                <span className="font-bold text-slate-900">{regSuccessData.patientName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Mobile Phone:</span>
                <span className="font-mono font-bold text-slate-800">{regSuccessData.phoneMobile}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setRegSuccessModalOpen(false);
                setRegSuccessData(null);
              }}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition shadow-md cursor-pointer"
            >
              OK / Continue
            </button>
          </div>
        </div>
      )}

      {/* SMS Sent Live Toast Notification */}
      {smsSentToast && (
        <div className="fixed bottom-5 right-5 z-50 max-w-sm bg-slate-900 text-white rounded-xl shadow-2xl border border-slate-700 p-4 animate-slideIn flex flex-col space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-emerald-400">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-[10px] font-bold tracking-widest uppercase">Automated SMS Dispatched</span>
            </div>
            <button 
              onClick={() => setSmsSentToast(null)}
              className="text-slate-400 hover:text-white text-xs font-bold"
            >
              ✕
            </button>
          </div>
          <p className="text-[11px] font-semibold text-slate-300">
            Sent to: <span className="font-mono text-emerald-300">{smsSentToast.recipient}</span> via <span className="underline font-bold capitalize">{smsSentToast.provider}</span>
          </p>
          <div className="bg-slate-950 p-2 rounded text-[10px] text-slate-400 font-mono border border-slate-800 leading-normal">
            "{smsSentToast.message}"
          </div>
          <div className="text-[8px] text-slate-500 flex justify-between items-center pt-1 border-t border-slate-800/60">
            <span>Provider HTTP Code: 200 OK</span>
            <span>Ref: {Math.floor(100000 + Math.random() * 900000)}</span>
          </div>
        </div>
      )}

      {/* Follow-up Patient / Missing Payment Confirmation Modal Popup */}
      {showFollowUpConfirmModal && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-scaleUp">
            {/* Header */}
            <div className="bg-amber-500 text-slate-950 p-4 flex items-center justify-between border-b border-amber-600">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-5 h-5 text-slate-950 shrink-0" />
                <h3 className="font-extrabold text-base tracking-tight">Payment Not Entered</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowFollowUpConfirmModal(false)}
                className="text-slate-950 hover:bg-amber-400/80 p-1.5 rounded-lg transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-3.5 text-slate-800">
              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs font-bold text-amber-950 leading-relaxed shadow-2xs">
                Payment of Patient is not entered. Is this a Follow-up Patient or FOC (Free of Charge) Case?
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Visit Charges & Fees (OPD Fee, Clinical Med, File, Card) are currently empty or 0. Select <strong>Follow-up Patient</strong> for follow-up consultation, <strong>FOC Case</strong> for free treatment, or <strong>No</strong> to return and enter payment charges.
              </p>
            </div>

            {/* Footer Buttons */}
            <div className="bg-slate-50 p-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => setShowFollowUpConfirmModal(false)}
                className="w-full sm:w-auto px-3 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-extrabold rounded-xl transition cursor-pointer"
              >
                No (Enter Payment)
              </button>
              <button
                type="button"
                onClick={() => executeSavePatientVisit(true, false)}
                className="w-full sm:w-auto px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl shadow-md transition cursor-pointer flex items-center justify-center space-x-1"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Yes (Follow-up)</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowFollowUpConfirmModal(false);
                  setShowFocFeeDetailsModal(true);
                }}
                className="w-full sm:w-auto px-3.5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-extrabold rounded-xl shadow-md transition cursor-pointer flex items-center justify-center space-x-1"
              >
                <HeartHandshake className="w-3.5 h-3.5" />
                <span>FOC Case</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FOC Waived Charges Entry Secondary Modal Popup */}
      {showFocFeeDetailsModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-purple-200 overflow-hidden animate-scaleUp">
            {/* Header */}
            <div className="bg-purple-700 px-5 py-4 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <HeartHandshake className="w-5 h-5 text-purple-200 shrink-0" />
                <div>
                  <h3 className="font-extrabold text-sm">Enter FOC Waived Value (Reporting Record)</h3>
                  <p className="text-[10px] text-purple-200">Patient bill will be PKR 0 (Free of Charge)</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowFocFeeDetailsModal(false)}
                className="text-white hover:text-purple-200 font-bold text-lg leading-none cursor-pointer"
              >
                ×
              </button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4 text-xs text-slate-800">
              <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl text-purple-950 font-medium leading-relaxed">
                Enter the standard fees being waived for this Free of Charge (FOC) visit to generate accurate financial welfare reports in Reporting Desk.
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Waived OPD Fee (PKR)
                  </label>
                  <input
                    type="number"
                    value={focWaivedOpdFee}
                    onChange={(e) => setFocWaivedOpdFee(e.target.value)}
                    placeholder="500"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-purple-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Waived Clinical Meds (PKR)
                  </label>
                  <input
                    type="number"
                    value={focWaivedClinicalFee}
                    onChange={(e) => setFocWaivedClinicalFee(e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-purple-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Waived File / Card (PKR)
                  </label>
                  <input
                    type="number"
                    value={focWaivedFileCardFee}
                    onChange={(e) => setFocWaivedFileCardFee(e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-purple-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  FOC Category / Reason
                </label>
                <select
                  value={focReason}
                  onChange={(e) => setFocReason(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-purple-500"
                >
                  <option value="Deserving / Needy Patient">Deserving / Needy Patient</option>
                  <option value="Staff / Doctor Relative">Staff / Doctor Relative</option>
                  <option value="Welfare / Zakat Fund">Welfare / Zakat Fund</option>
                  <option value="Free OPD Camp">Free OPD Camp</option>
                  <option value="Doctor Courtesy / Special Waiver">Doctor Courtesy / Special Waiver</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="bg-slate-100 p-2.5 rounded-lg flex items-center justify-between font-mono text-xs">
                <span className="font-bold text-slate-600">Total Waived Financial Value:</span>
                <strong className="text-purple-900 font-extrabold text-sm">
                  PKR {((Number(focWaivedOpdFee) || 0) + (Number(focWaivedClinicalFee) || 0) + (Number(focWaivedFileCardFee) || 0)).toLocaleString()}
                </strong>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-slate-50 p-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => setShowFocFeeDetailsModal(false)}
                className="w-full sm:w-auto px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowFocFeeDetailsModal(false);
                  executeSavePatientVisit(false, true, {
                    opd: Number(focWaivedOpdFee) || 0,
                    clin: Number(focWaivedClinicalFee) || 0,
                    fileCard: Number(focWaivedFileCardFee) || 0,
                    reason: focReason || 'Deserving Patient'
                  });
                }}
                className="w-full sm:w-auto px-5 py-2.5 bg-purple-700 hover:bg-purple-800 text-white font-extrabold rounded-xl shadow-md transition cursor-pointer flex items-center justify-center space-x-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirm & Save FOC Visit</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Patient Permanent Confirmation Modal */}
      {deletePatientModalData.isOpen && deletePatientModalData.pt && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-red-200 overflow-hidden animate-scaleUp">
            {/* Header */}
            <div className="bg-red-600 px-5 py-4 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-red-200 shrink-0" />
                <h3 className="font-extrabold text-sm">Delete Patient Record Permanently</h3>
              </div>
              <button
                type="button"
                onClick={() => setDeletePatientModalData({ isOpen: false, pt: null })}
                className="text-white hover:text-red-200 font-bold text-lg leading-none cursor-pointer"
              >
                ×
              </button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-3 text-xs text-slate-800">
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-900 font-bold leading-relaxed">
                Are you sure you want to permanently delete patient <span className="underline font-black">{deletePatientModalData.pt.PatientName}</span> (ID: <span className="font-mono font-black">{deletePatientModalData.pt.PatientID}</span>)?
              </div>

              <p className="text-slate-600 leading-normal font-medium">
                This action cannot be undone. Deleting this patient will also permanently remove:
              </p>

              <ul className="list-disc list-inside space-y-1 text-slate-700 font-bold pl-2">
                <li>All Consultation Visits & Prescriptions History</li>
                <li>All Queue Tokens & Appointments</li>
                <li>All Billing & Payment Records</li>
              </ul>
            </div>

            {/* Footer */}
            <div className="bg-slate-50 p-4 border-t border-slate-200 flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={() => setDeletePatientModalData({ isOpen: false, pt: null })}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => executeDeletePatientRecord(deletePatientModalData.pt!)}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs rounded-xl shadow-md transition flex items-center space-x-1.5 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Yes, Delete Everything</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Future Appointment Booking Confirmation Modal Popup */}
      {futureBookingModal && futureBookingModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl p-6 space-y-5 animate-scaleUp">
            <div className="flex items-center space-x-3 text-emerald-600 border-b border-slate-100 pb-3">
              <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold shrink-0">
                <CalendarPlus className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">Appointment Scheduled</h3>
                <p className="text-xxs text-emerald-700 font-semibold uppercase tracking-wider">Future Booking Confirmed</p>
              </div>
            </div>

            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-2.5 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Patient Name:</span>
                <span className="font-bold text-slate-900">{futureBookingModal.patientName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Patient ID:</span>
                <span className="font-mono font-bold text-slate-800">{futureBookingModal.patientId}</span>
              </div>
              {futureBookingModal.phoneMobile && (
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Mobile Phone:</span>
                  <span className="font-mono text-slate-800">{futureBookingModal.phoneMobile}</span>
                </div>
              )}
              <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                <span className="text-slate-500 font-medium">Appointment Date:</span>
                <span className="font-extrabold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  {futureBookingModal.date}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Assigned Shift:</span>
                <span className="font-bold text-slate-800">
                  {futureBookingModal.shift === 1 ? 'Morning Shift (08:00 - 14:00)' : 'Evening Shift (14:00 - 20:00)'}
                </span>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xxs text-amber-900 font-medium flex items-start space-x-2">
              <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p>
                <strong>Important Note:</strong> Because this appointment is scheduled for a future date (<strong>{futureBookingModal.date}</strong>), an OPD Token was <strong>NOT issued for today</strong>. The token will be issued when the patient arrives on their appointment date.
              </p>
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setFutureBookingModal(null)}
                className="bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs py-2.5 px-4 rounded-xl transition shadow-md cursor-pointer"
              >
                Acknowledge & Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Direct Visit Shift Selection & Token Auto-Generation Modal */}
      {directVisitShiftModal && directVisitShiftModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl p-5 space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-3 text-emerald-600">
                <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold shrink-0">
                  <Stethoscope className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">Direct Patient Visit (No Token Issued)</h3>
                  <p className="text-xxs text-emerald-700 font-semibold uppercase tracking-wider">Select Shift & Confirm Payment Collection</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDirectVisitShiftModal(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-amber-50/90 border border-amber-200 rounded-xl p-3 text-xs text-amber-900 space-y-1">
              <p className="font-bold flex items-center gap-1.5 text-amber-950">
                <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                Direct Walk-In Checkup: <span className="underline font-black">{directVisitShiftModal.patient.PatientName}</span> ({directVisitShiftModal.patient.PatientID})
              </p>
              <p className="text-[11px] text-amber-800/90 leading-relaxed">
                This patient arrived directly for consultation without a token. Selecting the shift auto-issues a direct token so payment collection and shift logs stay 100% accurate.
              </p>
            </div>

            {/* Shift Selection */}
            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">Select Shift:</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setDirectVisitShiftModal(prev => prev ? { ...prev, shift: 1 } : null)}
                  className={`p-3 rounded-xl border text-left transition flex flex-col justify-between cursor-pointer ${
                    directVisitShiftModal.shift === 1
                      ? 'bg-amber-50 border-amber-400 ring-2 ring-amber-400/50 shadow-xs'
                      : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-xs font-black text-amber-950">☀️ Morning Shift</span>
                    {directVisitShiftModal.shift === 1 && <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>}
                  </div>
                  <span className="text-[11px] font-bold text-slate-600 mt-1">08:30 AM – 12:30 PM</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDirectVisitShiftModal(prev => prev ? { ...prev, shift: 2 } : null)}
                  className={`p-3 rounded-xl border text-left transition flex flex-col justify-between cursor-pointer ${
                    directVisitShiftModal.shift === 2
                      ? 'bg-indigo-50 border-indigo-400 ring-2 ring-indigo-400/50 shadow-xs'
                      : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-xs font-black text-indigo-950">🌙 Evening Shift</span>
                    {directVisitShiftModal.shift === 2 && <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>}
                  </div>
                  <span className="text-[11px] font-bold text-slate-600 mt-1">05:00 PM – 09:00 PM</span>
                </button>
              </div>
            </div>

            {/* Fee & Remarks */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="text-[11px] font-extrabold text-slate-700 uppercase">OPD Fee Charged (PKR):</label>
                <input
                  type="number"
                  min="0"
                  value={directVisitShiftModal.fee}
                  onChange={(e) => {
                    const val = Number(e.target.value) || 0;
                    setDirectVisitShiftModal(prev => prev ? { ...prev, fee: val } : null);
                  }}
                  className="w-full mt-1 text-xs font-bold bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[11px] font-extrabold text-slate-700 uppercase">Remarks:</label>
                <input
                  type="text"
                  value={directVisitShiftModal.remarks}
                  onChange={(e) => {
                    const val = e.target.value;
                    setDirectVisitShiftModal(prev => prev ? { ...prev, remarks: val } : null);
                  }}
                  className="w-full mt-1 text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2 pt-1">
              <input
                type="checkbox"
                id="directVisitAutoPrint"
                checked={directVisitShiftModal.autoPrintTicket}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setDirectVisitShiftModal(prev => prev ? { ...prev, autoPrintTicket: checked } : null);
                }}
                className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4"
              />
              <label htmlFor="directVisitAutoPrint" className="text-xs font-semibold text-slate-700 cursor-pointer">
                Print Token Slip for Patient
              </label>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDirectVisitShiftModal(null)}
                className="px-3.5 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
              >
                Skip Token Generation
              </button>
              <button
                type="button"
                onClick={handleConfirmDirectVisitToken}
                className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md transition cursor-pointer flex items-center space-x-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirm Shift & Issue Direct Token</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LAB TESTS / INVESTIGATIONS ADVICE POPUP MODAL */}
      {pvLabTestModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-[9999] flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-purple-200 shadow-2xl overflow-hidden animate-scaleUp flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="bg-purple-900 text-white p-3.5 sm:p-4 flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-purple-800 rounded-xl border border-purple-700">
                  <FlaskConical className="w-5 h-5 text-purple-200" />
                </div>
                <div>
                  <h3 className="text-sm font-bold flex items-center space-x-1.5">
                    <span>Select Lab Tests & Diagnostic Advice</span>
                  </h3>
                  <p className="text-[11px] text-purple-200 font-medium">
                    Choose tests from catalog or quick categories to advise patient
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPvLabTestModalOpen(false)}
                className="text-purple-200 hover:text-white p-1 rounded-lg hover:bg-purple-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Currently Selected Tests Summary Bar */}
            <div className="bg-purple-50 p-3 border-b border-purple-100 shrink-0 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase text-purple-900 tracking-wider flex items-center">
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-purple-700" />
                  Selected Advice Tests ({getLabTestList(pvLabTestAdvice).length})
                </span>
                {getLabTestList(pvLabTestAdvice).length > 0 && (
                  <button
                    type="button"
                    onClick={() => setPvLabTestAdvice('')}
                    className="text-[10px] font-bold text-rose-600 hover:text-rose-800 hover:underline cursor-pointer"
                  >
                    Clear All Tests
                  </button>
                )}
              </div>

              {getLabTestList(pvLabTestAdvice).length === 0 ? (
                <p className="text-xs text-slate-400 italic font-medium">No lab tests selected yet. Click quick badges or catalog items below to select.</p>
              ) : (
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pt-0.5">
                  {getLabTestList(pvLabTestAdvice).map((testItem, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center text-xs font-bold bg-purple-700 text-white px-2.5 py-0.5 rounded-lg shadow-2xs"
                    >
                      <span>{testItem}</span>
                      <button
                        type="button"
                        onClick={() => handleToggleLabTestAdvice(testItem)}
                        className="ml-1.5 text-purple-200 hover:text-white font-black focus:outline-none cursor-pointer"
                        title="Remove test"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-4 overflow-y-auto space-y-4 flex-1 text-xs">
              
              {/* Quick Common Test Badges */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  Popular Quick Tests (1-Click Toggle):
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    'CBC', 'LFT', 'RFT', 'Lipid Profile', 'Blood Sugar Fasting', 'Blood Sugar Random',
                    'Urine RE', 'Serum Creatinine', 'Uric Acid', 'HbA1c', 'TSH',
                    'Ultrasound Abdomen', 'Chest X-Ray', 'ECG', 'Sputum for AFB'
                  ].map((quickTest) => {
                    const isSelected = getLabTestList(pvLabTestAdvice).map(s => s.toLowerCase()).includes(quickTest.toLowerCase());
                    return (
                      <button
                        key={quickTest}
                        type="button"
                        onClick={() => handleToggleLabTestAdvice(quickTest)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer border flex items-center space-x-1 ${
                          isSelected
                            ? 'bg-purple-600 text-white border-purple-700 shadow-xs'
                            : 'bg-slate-100 hover:bg-purple-50 text-slate-800 border-slate-200 hover:border-purple-300'
                        }`}
                      >
                        <span>{isSelected ? '✓' : '+'}</span>
                        <span>{quickTest}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Search Catalog & Add Custom Test Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                
                {/* Catalog Search & List */}
                <div className="space-y-2 border-r border-slate-100 pr-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-purple-950 uppercase tracking-wider">
                      Uploaded Diagnostics Catalog ({labTests ? labTests.length : 0}):
                    </span>
                  </div>

                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-purple-600 pointer-events-none" />
                    <input
                      type="text"
                      placeholder=""
                      value={pvLabTestModalSearch}
                      onChange={(e) => setPvLabTestModalSearch(e.target.value)}
                      className="w-full text-xs pl-8 pr-3 py-1.5 border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none font-medium text-slate-800"
                    />
                  </div>

                  <div className="border border-purple-200 rounded-xl overflow-hidden max-h-48 overflow-y-auto divide-y divide-purple-50 bg-slate-50/50">
                    {(() => {
                      const term = pvLabTestModalSearch.trim().toLowerCase();
                      const filtered = (labTests || []).filter(t => 
                        !term || String(t.TestName || '').toLowerCase().includes(term) || String(t.TID || '').toLowerCase().includes(term)
                      );

                      if (filtered.length === 0) {
                        return (
                          <div className="p-4 text-center text-slate-400 text-xs italic">
                            No matching lab tests found in catalog. Use custom input on right.
                          </div>
                        );
                      }

                      return filtered.map((t, idx) => {
                        const isSelected = getLabTestList(pvLabTestAdvice).map(s => s.toLowerCase()).includes(String(t.TestName || '').toLowerCase());
                        return (
                          <button
                            key={`lab-${t.TID || t.TestName}-${idx}`}
                            type="button"
                            onClick={() => handleToggleLabTestAdvice(t.TestName)}
                            className={`w-full text-left p-2 hover:bg-purple-100/60 transition flex items-center justify-between cursor-pointer ${
                              isSelected ? 'bg-purple-100/80 font-bold' : ''
                            }`}
                          >
                            <div className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => {}}
                                className="rounded text-purple-600 focus:ring-purple-500 cursor-pointer pointer-events-none"
                              />
                              <div>
                                <span className="font-bold text-slate-900 block text-xs">{t.TestName}</span>
                                {t.TID && <span className="text-[10px] text-slate-400 font-mono">ID: {t.TID}</span>}
                              </div>
                            </div>
                            {t.Cost ? (
                              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 font-mono">
                                PKR {t.Cost}
                              </span>
                            ) : null}
                          </button>
                        );
                      });
                    })()}
                  </div>
                </div>

                {/* Add Custom Test Box */}
                <div className="space-y-2.5">
                  <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block">
                    Add Custom Lab Test / Investigation:
                  </span>
                  <div className="space-y-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                    <input
                      type="text"
                      placeholder=""
                      value={pvCustomTestInput}
                      onChange={(e) => setPvCustomTestInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddCustomLabTest();
                        }
                      }}
                      className="w-full text-xs border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-purple-500 focus:outline-none font-medium text-slate-800 bg-white"
                    />
                    <button
                      type="button"
                      onClick={handleAddCustomLabTest}
                      className="w-full py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-lg transition shadow-2xs cursor-pointer flex items-center justify-center space-x-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Custom Test to Advice</span>
                    </button>
                  </div>

                  <div className="pt-1">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                      Direct Advice Text (Editable):
                    </label>
                    <textarea
                      rows={2}
                      placeholder=""
                      value={pvLabTestAdvice}
                      onChange={(e) => setPvLabTestAdvice(e.target.value)}
                      className="w-full text-xs border border-purple-200 bg-purple-50/20 rounded-lg p-2 focus:ring-1 focus:ring-purple-500 font-mono text-slate-800 resize-y"
                    />
                  </div>
                </div>

              </div>

            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 p-3 border-t border-slate-200 flex items-center justify-between shrink-0">
              <span className="text-xs font-bold text-purple-900">
                {getLabTestList(pvLabTestAdvice).length} Test(s) Selected
              </span>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setPvLabTestModalOpen(false)}
                  className="px-5 py-2 bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer flex items-center space-x-1"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Apply & Done</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* POPUP MODAL: SEARCH TOKEN / PATIENT ID */}
      {isNewPatientSearchModalOpen && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-300 w-full max-w-2xl flex flex-col overflow-hidden my-auto max-h-[90vh]">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-4 border-b border-slate-800 flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-emerald-500/20 rounded-xl border border-emerald-400/30 text-emerald-400">
                  <Search className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white flex items-center space-x-2">
                    <span>Search Mobile No / Patient ID</span>
                    <span className="text-[10px] bg-emerald-500/30 text-emerald-200 border border-emerald-400/30 px-2 py-0.5 rounded-full uppercase font-mono">
                      Patient Desk
                    </span>
                  </h3>
                  <p className="text-xs text-slate-300 font-medium">
                    Enter Mobile No or Patient ID to select and load patient record for consultation
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsNewPatientSearchModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-5 overflow-y-auto space-y-4 bg-slate-50 flex-1">
              {/* Search Input Card */}
              <div className="bg-white p-3.5 rounded-xl border-2 border-emerald-500 shadow-sm space-y-2">
                <label className="text-xs font-black text-slate-800 flex items-center justify-between">
                  <span className="flex items-center space-x-1.5 text-emerald-950">
                    <UserPlus className="w-4 h-4 text-emerald-600" />
                    <span>Enter Mobile No or Patient ID:</span>
                  </span>
                  {newPatientSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setNewPatientSearchQuery('')}
                      className="text-[11px] text-slate-500 hover:text-slate-800 underline font-medium cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </label>
                <div className="relative">
                  <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    autoFocus
                    placeholder=""
                    value={newPatientSearchQuery}
                    onChange={(e) => {
                      const val = e.target.value;
                      setNewPatientSearchQuery(val);
                      if (val.trim().length >= 2) {
                        fetchNhcArchive(val.trim());
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const query = newPatientSearchQuery.trim().toLowerCase();
                        if (!query) return;
                        const cleanNum = query.replace(/\D/g, '');

                        const tokMatch = (tokens || []).find(t => 
                          String(t.TokenNo) === cleanNum || 
                          String(t.PatientID).toLowerCase() === query ||
                          `token-${t.TokenNo}` === query ||
                          `#${t.TokenNo}` === query
                        );
                        if (tokMatch) {
                          handleSelectPatientFromModal(tokMatch.PatientID);
                          return;
                        }

                        const patMatch = patients.find(p => matchPatientRecord(p, query)) 
                          || [...(nhcPatients || []), ...nhcArchiveList, ...pvNhcHistory].find(p => matchPatientRecord(p, query));
                        if (patMatch) {
                          handleSelectPatientFromModal(patMatch.PatientID);
                          return;
                        }
                      }
                    }}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 text-slate-900 text-sm font-semibold rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
                  />
                </div>
              </div>

              {/* Database Fetching Progress Bar & Status Message */}
              {(isSearchingArchive || isSearchLoadingModal) && (
                <div className="bg-emerald-50 border-2 border-emerald-400 rounded-xl p-3 shadow-2xs space-y-2">
                  <div className="flex items-center justify-between text-xs font-black text-emerald-950">
                    <span className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                      <span>Fetching patient records from database archive...</span>
                    </span>
                    <span className="font-mono text-[10px] text-emerald-800 font-extrabold uppercase bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300">
                      Loading Database Records
                    </span>
                  </div>
                  <div className="w-full bg-emerald-200 h-2 rounded-full overflow-hidden">
                    <div className="bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 h-full w-full animate-pulse rounded-full"></div>
                  </div>
                </div>
              )}

              {/* Results List */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
                <div className="bg-slate-100 px-3.5 py-2 border-b border-slate-200 flex items-center justify-between text-xs font-bold text-slate-700">
                  <span>
                    {newPatientSearchQuery.trim() ? 'Matching Tokens & Patient Records' : "Today's Issued Tokens & Patient Queue"}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">Click record to select & show</span>
                </div>

                <div className="max-h-[320px] overflow-y-auto divide-y divide-slate-100">
                  {(() => {
                    const query = newPatientSearchQuery.trim().toLowerCase();
                    const cleanNum = query.replace(/\D/g, '');

                    const matchedItems: {
                      patientId: string;
                      patientName: string;
                      tokenNo?: number;
                      tokenShift?: number;
                      tokenStatus?: number;
                      phone?: string;
                      gender?: string;
                      age?: string | number;
                      isNhc?: boolean;
                      source: string;
                    }[] = [];

                    const seenIds = new Set<string>();

                    // 1. Check today's active tokens first
                    (tokens || []).forEach(tok => {
                      if (!tok || !tok.PatientID) return;
                      const pid = String(tok.PatientID).trim();
                      const tokNoStr = String(tok.TokenNo);
                      const isTokMatch = !query || tokNoStr === query || tokNoStr === cleanNum || `token-${tokNoStr}` === query || `#${tokNoStr}` === query;

                      const allNhc = [...(nhcPatients || []), ...nhcArchiveList, ...pvNhcHistory];
                      const pObj = patients.find(p => String(p.PatientID).trim().toLowerCase() === pid.toLowerCase()) || allNhc.find(p => String(p.PatientID).trim().toLowerCase() === pid.toLowerCase());
                      const isPatMatch = pObj ? matchPatientRecord(pObj, query) : pid.toLowerCase().includes(query);

                      if (isTokMatch || isPatMatch) {
                        seenIds.add(pid.toLowerCase());
                        matchedItems.push({
                          patientId: pid,
                          patientName: pObj ? (pObj.PatientName || `Patient ${pid}`) : `Patient ${pid}`,
                          tokenNo: tok.TokenNo,
                          tokenShift: tok.Shift,
                          tokenStatus: tok.Status,
                          phone: pObj?.PhoneMobile || '',
                          gender: (pObj as any)?.Gender || (pObj as any)?.Sex,
                          age: (pObj as any)?.Age || (pObj as any)?.AgeYears,
                          isNhc: false,
                          source: 'Issued Token'
                        });
                      }
                    });

                    // 2. Check local EMR patients
                    patients.forEach(p => {
                      if (!p || !p.PatientID) return;
                      const pid = String(p.PatientID).trim();
                      if (seenIds.has(pid.toLowerCase())) return;

                      const isMatch = !query || matchPatientRecord(p, query);

                      if (isMatch) {
                        seenIds.add(pid.toLowerCase());
                        matchedItems.push({
                          patientId: pid,
                          patientName: p.PatientName,
                          phone: p.PhoneMobile,
                          gender: (p as any)?.Gender || (p as any)?.Sex,
                          age: (p as any)?.Age || (p as any)?.AgeYears,
                          isNhc: false,
                          source: 'EMR Patient'
                        });
                      }
                    });

                    // 3. Check NHC archive patients
                    const allNhc = [...(nhcPatients || []), ...nhcArchiveList, ...pvNhcHistory];
                    allNhc.forEach(nhc => {
                      if (!nhc || !nhc.PatientID) return;
                      const pid = String(nhc.PatientID).trim();
                      if (seenIds.has(pid.toLowerCase())) return;

                      const isMatch = !query || matchPatientRecord(nhc, query);

                      if (isMatch) {
                        seenIds.add(pid.toLowerCase());
                        matchedItems.push({
                          patientId: pid,
                          patientName: getResolvedNhcPatientName(nhc, patients, allNhc),
                          phone: nhc.PhoneMobile || '',
                          gender: (nhc as any)?.Gender || (nhc as any)?.Sex,
                          age: (nhc as any)?.Age || (nhc as any)?.AgeYears,
                          isNhc: true,
                          source: 'Patient History'
                        });
                      }
                    });

                    if (matchedItems.length === 0) {
                      return (
                        <div className="p-6 text-center text-slate-500 text-xs">
                          <p className="font-semibold text-slate-700 mb-1">No matching Mobile No or Patient ID found</p>
                          <p className="text-[11px] text-slate-500">
                            You can click "Create Blank Walk-in Form" below to write a new consultation record from scratch.
                          </p>
                        </div>
                      );
                    }

                    return matchedItems.slice(0, 25).map((item, idx) => (
                      <div
                        key={`tok-search-${item.patientId}-${idx}`}
                        onClick={() => handleSelectPatientFromModal(item.patientId)}
                        className="p-3 hover:bg-emerald-50/80 transition flex items-center justify-between cursor-pointer group"
                      >
                        <div className="flex items-center space-x-3">
                          {item.tokenNo !== undefined ? (
                            <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-900 font-black text-sm flex flex-col items-center justify-center shrink-0 border border-amber-400 shadow-2xs">
                              <span className="text-[8px] font-extrabold uppercase text-slate-800 leading-none">Token</span>
                              <span className="leading-tight">#{item.tokenNo}</span>
                            </div>
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 font-extrabold text-xs flex items-center justify-center shrink-0 border border-emerald-200">
                              {item.patientName.charAt(0).toUpperCase()}
                            </div>
                          )}

                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="font-bold text-xs text-slate-900 group-hover:text-emerald-700 transition">
                                {item.patientName}
                              </span>
                              <span className="text-[10px] font-mono bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded border border-slate-200 font-bold">
                                {item.patientId}
                              </span>
                              {item.tokenNo !== undefined && (
                                <span className="text-[9px] bg-amber-100 text-amber-900 px-1.5 py-0.2 rounded font-extrabold border border-amber-200">
                                  {item.tokenShift === 1 ? 'Morning' : 'Evening'}
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-500 flex items-center space-x-2 mt-0.5">
                              {item.phone && <span>Mobile: {item.phone}</span>}
                              {item.gender && <span>• {item.gender}</span>}
                              {item.age && <span>• {item.age} Yrs</span>}
                              <span className="text-emerald-600 font-bold">• {item.source}</span>
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectPatientFromModal(item.patientId);
                          }}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-md shadow-2xs transition shrink-0 cursor-pointer"
                        >
                          Show Record
                        </button>
                      </div>
                    ));
                  })()}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-100 p-3 sm:p-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2 shrink-0">
              <button
                type="button"
                onClick={() => handleSelectPatientFromModal('')}
                className="w-full sm:w-auto px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl transition flex items-center justify-center space-x-1.5 cursor-pointer shadow-2xs"
              >
                <UserPlus className="w-4 h-4 text-emerald-400" />
                <span>+ Create Blank / Walk-in Patient Form</span>
              </button>

              <button
                type="button"
                onClick={() => setIsNewPatientSearchModalOpen(false)}
                className="w-full sm:w-auto px-4 py-2 bg-white hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl border border-slate-300 transition cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MULTIPLE PATIENT MATCHES POPUP SELECTION MODAL */}
      {isMultiPatientModalOpen && (() => {
        const filter = multiPatientModalFilter.trim().toLowerCase();
        const filteredResults = multiPatientSearchResults.filter(p => {
          if (!filter) return true;
          const pName = String(p.PatientName || '').toLowerCase();
          const pId = String(p.PatientID || '').toLowerCase();
          const pFather = String(p.Father_husband || '').toLowerCase();
          const pPhone = String(p.PhoneMobile || '').toLowerCase();
          return pName.includes(filter) || pId.includes(filter) || pFather.includes(filter) || pPhone.includes(filter);
        });

        return (
          <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-3xl w-full flex flex-col overflow-hidden max-h-[90vh]">
              
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white p-4 sm:p-5 flex items-start justify-between border-b border-emerald-500/30">
                <div className="flex items-start space-x-3">
                  <div className="p-2.5 bg-emerald-500/20 rounded-xl border border-emerald-400/30 text-emerald-300 shrink-0 mt-0.5">
                    <Users className="w-6 h-6 text-emerald-400" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2 flex-wrap gap-1">
                      <h3 className="text-base sm:text-lg font-black text-white tracking-tight">
                        Multiple Patients Found for Search
                      </h3>
                      <span className="text-[10px] font-black uppercase tracking-wider bg-amber-400 text-slate-900 px-2 py-0.5 rounded-md shadow-2xs font-mono">
                        {multiPatientSearchResults.length} Patients Found
                      </span>
                    </div>
                    <p className="text-xs text-emerald-200 mt-1">
                      Search Term: <strong className="text-amber-300 font-mono bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">"{multiPatientSearchQuery}"</strong>
                    </p>
                    <p className="text-[11px] text-slate-300 mt-0.5">
                      Doctor Sahab, multiple patient records match this mobile number/search term. Please click <strong>"Select Patient"</strong> on the intended record below:
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsMultiPatientModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition cursor-pointer"
                  title="Close Modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Filter inside Modal */}
              <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Filter list by patient name, MR#, father name..."
                    value={multiPatientModalFilter}
                    onChange={(e) => setMultiPatientModalFilter(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 font-semibold text-slate-800"
                  />
                  {multiPatientModalFilter && (
                    <button
                      type="button"
                      onClick={() => setMultiPatientModalFilter('')}
                      className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                    >
                      ✕
                    </button>
                  )}
                </div>
                <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider shrink-0 hidden sm:inline">
                  Showing {filteredResults.length} of {multiPatientSearchResults.length}
                </span>
              </div>

              {/* Patient List Content Body */}
              <div className="p-3 sm:p-4 overflow-y-auto space-y-2.5 flex-1 max-h-[55vh]">
                {filteredResults.length === 0 ? (
                  <div className="p-8 text-center text-slate-500">
                    <p className="font-bold text-slate-700 text-sm">No matching patients found in filtered list</p>
                    <p className="text-xs text-slate-400 mt-1">Try clearing the filter text above.</p>
                  </div>
                ) : (
                  filteredResults.map((patient, idx) => (
                    <div
                      key={`multi-pat-${patient.PatientID}-${idx}`}
                      onClick={() => handleSelectPatientFromMultiModal(patient.PatientID, patient)}
                      className="bg-white hover:bg-emerald-50/60 border border-slate-200 hover:border-emerald-400 rounded-xl p-3 sm:p-3.5 transition-all shadow-2xs hover:shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer group"
                    >
                      {/* Left Column: Avatar & Patient Demographics */}
                      <div className="flex items-start space-x-3">
                        {patient.tokenNo ? (
                          <div className="w-11 h-11 rounded-xl bg-amber-500 text-slate-900 font-black flex flex-col items-center justify-center shrink-0 border border-amber-400 shadow-2xs">
                            <span className="text-[8px] font-extrabold uppercase text-slate-900 leading-none">Token</span>
                            <span className="text-base leading-tight">#{patient.tokenNo}</span>
                          </div>
                        ) : (
                          <div className="w-11 h-11 rounded-xl bg-emerald-600 text-white font-black text-lg flex items-center justify-center shrink-0 shadow-2xs border border-emerald-500">
                            {patient.PatientName.charAt(0).toUpperCase()}
                          </div>
                        )}

                        <div className="space-y-1">
                          {/* Row 1: Name, MR#, Source Badge */}
                          <div className="flex items-center space-x-2 flex-wrap gap-1">
                            <h4 className="text-sm font-extrabold text-slate-900 group-hover:text-emerald-700 transition">
                              {patient.PatientName}
                            </h4>
                            <span className="text-[10px] font-mono font-black bg-slate-100 text-slate-800 px-2 py-0.5 rounded border border-slate-200">
                              MR# {patient.PatientID}
                            </span>
                            {patient.source && (
                              <span className="text-[9px] font-extrabold uppercase tracking-wider bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded border border-emerald-300">
                                {patient.source}
                              </span>
                            )}
                          </div>

                          {/* Row 2: Mobile No, Father/Husband Name, Age & Sex */}
                          <div className="flex items-center space-x-3 flex-wrap gap-2 text-xs text-slate-600">
                            {patient.PhoneMobile && (
                              <span className="flex items-center space-x-1 font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 font-mono">
                                <Phone className="w-3 h-3 text-emerald-600" />
                                <span>{patient.PhoneMobile}</span>
                              </span>
                            )}

                            {patient.Father_husband && (
                              <span className="font-semibold text-slate-700">
                                S/O / W/O: <strong>{patient.Father_husband}</strong>
                              </span>
                            )}

                            {(patient.AgeYears || patient.Sex) && (
                              <span className="text-slate-500 font-medium">
                                • {patient.AgeYears ? `${patient.AgeYears} Yrs` : ''} {patient.Sex ? `(${patient.Sex})` : ''}
                              </span>
                            )}
                          </div>

                          {/* Row 3: Address / City if available */}
                          {(patient.Address || patient.City) && (
                            <div className="text-[11px] text-slate-500 flex items-center space-x-1">
                              <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                              <span className="truncate max-w-md">{patient.Address || patient.City}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right Column: Select Button */}
                      <div className="shrink-0 flex items-center justify-end sm:justify-start">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectPatientFromMultiModal(patient.PatientID, patient);
                          }}
                          className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-md transition flex items-center space-x-1.5 cursor-pointer group-hover:scale-105 shrink-0"
                        >
                          <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                          <span>Select Patient</span>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Modal Footer */}
              <div className="bg-slate-100 p-3 sm:p-4 border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
                <span className="text-xs text-slate-600 font-medium">
                  Click <strong>Select Patient</strong> to open medical history & consultation workspace.
                </span>
                <button
                  type="button"
                  onClick={() => setIsMultiPatientModalOpen(false)}
                  className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-lg transition cursor-pointer"
                >
                  Cancel / Close
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* GRID VIEW VISIT DATE SELECTOR MODAL */}
      {isGridVisitSelectorModalOpen && gridSelectorPatientId && (() => {
        const selectedPt = patients.find(p => isSamePatient(p.PatientID, gridSelectorPatientId)) || (nhcPatients || []).find(p => isSamePatient(p.PatientID, gridSelectorPatientId));
        const options = getPatientVisitDateOptions(gridSelectorPatientId);
        const isPrint = gridSelectorMode === 'PRINT';

        return (
          <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center z-50 p-3 sm:p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden space-y-0 transform transition-all my-auto">
              
              {/* Modal Header */}
              <div className={`p-4 text-white flex items-center justify-between ${
                isPrint ? 'bg-gradient-to-r from-emerald-800 to-teal-900' : 'bg-gradient-to-r from-amber-700 to-orange-800'
              }`}>
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 bg-white/10 rounded-xl border border-white/20">
                    {isPrint ? <Printer className="w-5 h-5 text-emerald-200" /> : <Pencil className="w-5 h-5 text-amber-200" />}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm sm:text-base tracking-tight">
                      {isPrint ? 'Select Visit Date to Print' : 'Select Visit Date to Edit'}
                    </h3>
                    <p className="text-[11px] text-white/80 font-medium">
                      Patient: <strong className="text-white">{selectedPt?.PatientName || gridSelectorPatientId}</strong> ({gridSelectorPatientId})
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsGridVisitSelectorModalOpen(false)}
                  className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-4 sm:p-5 space-y-4 text-slate-800">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-600">Total Recorded Visits:</span>
                  <span className="font-mono font-extrabold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                    {options.length} Visit Date{options.length > 1 ? 's' : ''}
                  </span>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
                    Select Visit Date:
                  </label>

                  <select
                    value={gridSelectorSelectedDate}
                    onChange={(e) => setGridSelectorSelectedDate(e.target.value)}
                    className="w-full text-xs font-bold font-mono p-2.5 bg-white border-2 border-slate-300 rounded-xl text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 cursor-pointer shadow-2xs"
                  >
                    {options.map((opt, idx) => (
                      <option key={opt.date + '-' + idx} value={opt.date}>
                        {opt.date} {idx === 0 ? '(Latest Visit Date)' : ''} — {opt.symptoms.slice(0, 30)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Cards List for Visual Selection */}
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                    Available Visit Records (Click to Select):
                  </label>
                  {options.map((opt, idx) => {
                    const isSelected = gridSelectorSelectedDate === opt.date;
                    return (
                      <div
                        key={`opt-${opt.date}-${idx}`}
                        onClick={() => setGridSelectorSelectedDate(opt.date)}
                        className={`p-3 rounded-xl border-2 transition cursor-pointer flex items-center justify-between gap-3 ${
                          isSelected
                            ? isPrint
                              ? 'bg-emerald-50/90 border-emerald-500 shadow-xs'
                              : 'bg-amber-50/90 border-amber-500 shadow-xs'
                            : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <div className="space-y-0.5 flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <span className="font-mono font-extrabold text-xs text-slate-900">
                              {opt.date}
                            </span>
                            {idx === 0 && (
                              <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-indigo-100 text-indigo-800 border border-indigo-200">
                                Latest Visit
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-600 font-medium truncate">
                            {opt.symptoms}
                          </p>
                          {opt.summary && (
                            <p className="text-[10px] text-slate-400 font-mono truncate">
                              {opt.summary}
                            </p>
                          )}
                        </div>

                        <div className="text-right flex flex-col items-end shrink-0">
                          {opt.fee > 0 && (
                            <span className="text-[11px] font-mono font-extrabold text-slate-800">
                              PKR {opt.fee}
                            </span>
                          )}
                          <div className={`w-4 h-4 rounded-full border flex items-center justify-center mt-1 ${
                            isSelected
                              ? isPrint ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-amber-600 border-amber-600 text-white'
                              : 'border-slate-300 bg-white'
                          }`}>
                            {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsGridVisitSelectorModalOpen(false)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-extrabold text-xs rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleConfirmGridVisitSelection}
                  className={`px-5 py-2 text-white font-extrabold text-xs rounded-xl transition shadow-xs flex items-center space-x-1.5 cursor-pointer ${
                    isPrint
                      ? 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800'
                      : 'bg-amber-600 hover:bg-amber-700 active:bg-amber-800'
                  }`}
                >
                  {isPrint ? (
                    <>
                      <Printer className="w-4 h-4" />
                      <span>Print Visit ({gridSelectorSelectedDate})</span>
                    </>
                  ) : (
                    <>
                      <Pencil className="w-4 h-4" />
                      <span>Edit Visit ({gridSelectorSelectedDate})</span>
                    </>
                  )}
                </button>
              </div>

            </div>
          </div>
        );
      })()}

      {/* POPUP MODAL: GRID-VIEW EDIT RECENT PATIENT MEDICAL RECORDS */}
      {isRecentVisitsModalOpen && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-300 w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden my-auto">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-3.5 sm:p-4 border-b border-slate-800 flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-amber-500/20 rounded-xl border border-amber-400/30 text-amber-400">
                  <Pencil className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-extrabold text-white flex items-center space-x-2">
                    <span>Grid-View Show Recent Patients & Edit Medical Records</span>
                    <span className="text-[10px] bg-amber-500/30 text-amber-200 border border-amber-400/30 px-2 py-0.5 rounded-full uppercase font-mono">
                      Edit Mode
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-300 font-medium">
                    Select any patient visit record from the grid view below to edit prescription, lab tests, payment details, and click Save & Update & Print.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsRecentVisitsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-3 sm:p-5 overflow-y-auto space-y-4 bg-slate-50 flex-1">
              {/* TOP SECTION: GRID-VIEW OF RECENT PATIENTS */}
              <div className="bg-white p-3 sm:p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-slate-900 flex items-center space-x-1.5">
                      <Table className="w-4 h-4 text-amber-600" />
                      <span>Select Recent Patient Visit Record to Edit:</span>
                    </span>

                    {modalPatientId && (
                      <div className="flex items-center space-x-1.5 bg-amber-50 border border-amber-300 text-amber-900 text-[11px] font-bold px-2 py-0.5 rounded-lg shadow-2xs">
                        <UserIcon className="w-3.5 h-3.5 text-amber-600" />
                        <span>
                          {recentModalPatientOnly
                            ? `Filtered for: ${modalPatientName || modalPatientId} (${modalPatientId})`
                            : `Showing All Patients`}
                        </span>
                        <button
                          type="button"
                          onClick={() => setRecentModalPatientOnly(!recentModalPatientOnly)}
                          className="ml-1 px-1.5 py-0.5 bg-amber-200 hover:bg-amber-300 rounded text-[10px] font-black text-amber-950 transition cursor-pointer"
                        >
                          {recentModalPatientOnly ? 'Show All Patients' : `Show Only ${modalPatientName || modalPatientId}`}
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="relative min-w-[200px]">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                    <input
                      type="text"
                      placeholder="Search date, symptoms..."
                      value={recentModalSearch}
                      onChange={(e) => setRecentModalSearch(e.target.value)}
                      className="w-full text-xs border border-slate-300 rounded-lg pl-8 pr-3 py-1.5 focus:ring-2 focus:ring-amber-500 focus:outline-none bg-slate-50"
                    />
                  </div>
                </div>

                {/* Grid Table of Recent Visits */}
                <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-lg overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-800 text-white font-bold text-[10px] uppercase sticky top-0">
                      <tr>
                        <th className="p-2 border-b border-slate-700">Visit Date</th>
                        <th className="p-2 border-b border-slate-700">Patient ID & Name</th>
                        <th className="p-2 border-b border-slate-700">Symptoms / Diagnosis</th>
                        <th className="p-2 border-b border-slate-700">Lab Advice</th>
                        <th className="p-2 border-b border-slate-700">Total Payment</th>
                        <th className="p-2 border-b border-slate-700 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-slate-800 text-[11px]">
                      {(() => {
                        const rawRecentVisits: (Visit | NhcPatientHistory)[] = [...(visits || []), ...(pvNhcHistory || [])];
                        // Sort rawRecentVisits descending by visit date, then by VisitID descending
                        const sortedRecentVisits = [...rawRecentVisits].sort((a, b) => {
                          const dateA = parseCleanVisitDate('VisitDate' in a ? a.VisitDate : ('date' in a ? (a as any).date : ''));
                          const dateB = parseCleanVisitDate('VisitDate' in b ? b.VisitDate : ('date' in b ? (b as any).date : ''));
                          if (dateA !== dateB) {
                            return dateB.localeCompare(dateA);
                          }
                          const idA = ('VisitID' in a && a.VisitID) ? Number(a.VisitID) || 0 : 0;
                          const idB = ('VisitID' in b && b.VisitID) ? Number(b.VisitID) || 0 : 0;
                          return idB - idA;
                        });

                        let allRecentVisits: (Visit | NhcPatientHistory)[] = [];

                        if (recentModalPatientOnly && modalPatientId) {
                          // Show ALL visit records for the selected patient
                          allRecentVisits = sortedRecentVisits.filter((v) => isSamePatient(v.PatientID, modalPatientId));
                        } else {
                          // Show all recent patients (one latest per patient)
                          const seenKeys = new Set<string>();
                          const seenPatientIds = new Set<string>();

                          for (const v of sortedRecentVisits) {
                            const vId = ('VisitID' in v && v.VisitID) ? v.VisitID : ('date' in v ? `NHC-${v.date}` : '');
                            const pId = String(v.PatientID || '').trim();
                            const vDate = 'VisitDate' in v && v.VisitDate ? v.VisitDate.split('T')[0] : ('date' in v ? (v as any).date : '');
                            const key = vId || (pId && vDate ? `${pId}_${vDate}` : '');

                            if (pId) {
                              if (!seenPatientIds.has(pId)) {
                                seenPatientIds.add(pId);
                                if (key) seenKeys.add(key);
                                allRecentVisits.push(v);
                              }
                            } else {
                              if (!key || !seenKeys.has(key)) {
                                if (key) seenKeys.add(key);
                                allRecentVisits.push(v);
                              }
                            }
                          }
                        }

                        const filteredRecent = allRecentVisits.filter((v) => {
                          if (!recentModalSearch.trim()) return true;
                          const term = recentModalSearch.toLowerCase();
                          const pId = String(v.PatientID || '');
                          const pt = patients.find(p => String(p.PatientID) === pId);
                          const pName = String(pt?.PatientName || ('PatientName' in v ? (v as any).PatientName : '') || '');
                          const sx = String('SymptomsDiagnosis' in v ? v.SymptomsDiagnosis : ('symptoms' in v ? (v as any).symptoms : '') || '');
                          const vDate = String('VisitDate' in v ? v.VisitDate : ('date' in v ? (v as any).date : '') || '');
                          return (
                            pId.toLowerCase().includes(term) ||
                            pName.toLowerCase().includes(term) ||
                            sx.toLowerCase().includes(term) ||
                            vDate.toLowerCase().includes(term)
                          );
                        });

                        if (filteredRecent.length === 0) {
                          return (
                            <tr>
                              <td colSpan={6} className="p-4 text-center text-slate-500 italic">
                                No visit records found for {recentModalPatientOnly && modalPatientId ? `patient (${modalPatientName || modalPatientId})` : 'recent visits'}.
                              </td>
                            </tr>
                          );
                        }

                        return filteredRecent.slice(0, 15).map((v, i) => {
                          const vId = ('VisitID' in v && v.VisitID) ? v.VisitID : ('date' in v ? `NHC-${v.date}` : `VIS-${i}`);
                          const pt = patients.find(p => p.PatientID === v.PatientID);
                          const pName = pt?.PatientName || ('PatientName' in v ? (v as any).PatientName : 'Patient');
                          const vDate = 'VisitDate' in v && v.VisitDate ? v.VisitDate.split('T')[0] : ('date' in v ? (v as any).date : 'N/A');
                          const sx = 'SymptomsDiagnosis' in v ? v.SymptomsDiagnosis : ('symptoms' in v ? (v as any).symptoms : 'Routine Consultation');
                          const labAdv = 'LabTestAdvice' in v ? v.LabTestAdvice : 'None';
                          let clinFee = Number((v as any).ClinicalMedicinePayment) || 0;
                          let fileFee = Number((v as any).FileFee) || 0;
                          let cardFee = Number((v as any).CardFee) || Number((v as any).CardsPayment) || 0;
                          let opdFee = Number((v as any).ConsultationFee) || Number((v as any).fee) || 0;
                          const remText = (v as any).VisitRemarks || (v as any).Remarks || '';
                          if (remText) {
                            if (!clinFee) { const cPkr = remText.match(/Clinical Meds PKR\s*(\d+)/); if (cPkr) clinFee = Number(cPkr[1]); }
                            if (!fileFee) { const fPkr = remText.match(/File PKR\s*(\d+)/); if (fPkr) fileFee = Number(fPkr[1]); }
                            if (!cardFee) { const kPkr = remText.match(/Card PKR\s*(\d+)/); if (kPkr) cardFee = Number(kPkr[1]); }
                          }
                          const fee = clinFee + fileFee + cardFee + opdFee;
                          const isSelected = modalEditingVisitId === vId;

                          return (
                            <tr
                              key={vId + '-' + i}
                              className={`cursor-pointer transition ${isSelected ? 'bg-amber-100/80 font-semibold' : 'hover:bg-slate-100'}`}
                              onClick={() => loadVisitIntoModalForm(v, pName)}
                            >
                              <td className="p-2 font-mono font-bold text-slate-900 whitespace-nowrap">{vDate}</td>
                              <td className="p-2">
                                <span className="font-extrabold text-slate-900 block">{pName}</span>
                                <span className="text-[10px] text-slate-500 font-mono">ID: {v.PatientID}</span>
                              </td>
                              <td className="p-2 truncate max-w-[180px]">{sx}</td>
                              <td className="p-2 truncate max-w-[140px] text-purple-900 font-medium">{labAdv}</td>
                              <td className="p-2 font-bold text-slate-900 whitespace-nowrap">PKR {fee}</td>
                              <td className="p-2 text-center">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    loadVisitIntoModalForm(v, pName);
                                  }}
                                  className={`px-2 py-0.5 text-[10px] font-bold rounded border cursor-pointer transition ${
                                    isSelected ? 'bg-amber-600 text-white border-amber-700' : 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
                                  }`}
                                >
                                  {isSelected ? 'Editing Now' : 'Select Record'}
                                </button>
                              </td>
                            </tr>
                          );
                        });
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* BOTTOM SECTION: MEDICAL RECORD EDIT FORM */}
              <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-1.5">
                    <Stethoscope className="w-4 h-4 text-emerald-600" />
                    <span>Edit Medical Record Details (Visit ID: <strong className="text-indigo-700 font-mono">{modalEditingVisitId}</strong>)</span>
                  </h4>
                  <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded border border-slate-200">
                    Patient: {modalPatientName} ({modalPatientId})
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Left Form Column */}
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Select Patient:</label>
                        <select
                          value={modalPatientId}
                          onChange={(e) => {
                            const pId = e.target.value;
                            setModalPatientId(pId);
                            const found = patients.find(p => p.PatientID === pId);
                            if (found) setModalPatientName(found.PatientName);
                          }}
                          className="w-full text-xs border border-slate-300 rounded-lg p-2 font-bold text-slate-800 bg-white focus:ring-2 focus:ring-amber-500"
                        >
                          {patients.map((p, idx) => (
                            <option key={`m-pat-opt-${p.PatientID}-${idx}`} value={p.PatientID}>
                              {p.PatientName} ({p.PatientID})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Visit Date:</label>
                        <input
                          type="date"
                          value={modalVisitDate}
                          onChange={(e) => setModalVisitDate(e.target.value)}
                          className="w-full text-xs border border-slate-300 rounded-lg p-2 font-bold text-slate-800 bg-white focus:ring-2 focus:ring-amber-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Symptoms & Clinical Diagnosis:</label>
                      <textarea
                        rows={3}
                        placeholder=""
                        value={modalSymptomsDiagnosis}
                        onChange={(e) => setModalSymptomsDiagnosis(e.target.value)}
                        className="w-full text-xs border border-slate-300 rounded-lg p-2 text-slate-800 bg-white focus:ring-2 focus:ring-amber-500 font-medium"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Medical Report Results:</label>
                        <textarea
                          rows={2}
                          placeholder=""
                          value={modalMedicalReportResult}
                          onChange={(e) => setModalMedicalReportResult(e.target.value)}
                          className="w-full text-xs border border-slate-300 rounded-lg p-2 text-slate-800 bg-white focus:ring-2 focus:ring-amber-500 font-medium"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Lab Test Advice:</label>
                        <textarea
                          rows={2}
                          placeholder=""
                          value={modalLabTestAdvice}
                          onChange={(e) => setModalLabTestAdvice(e.target.value)}
                          className="w-full text-xs border border-slate-300 rounded-lg p-2 text-slate-800 bg-white focus:ring-2 focus:ring-amber-500 font-medium"
                        />
                      </div>
                    </div>

                    {/* Visit Charges & Fees (PKR) Box */}
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                        <label className="text-[10px] font-black text-slate-800 uppercase tracking-wide flex items-center">
                          <Coins className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                          Visit Charges & Fees (PKR)
                        </label>
                        <div className="text-xs font-black text-emerald-950 bg-emerald-100 px-2.5 py-0.5 rounded-md border border-emerald-300 font-mono shadow-2xs">
                          Total: PKR {(Number(modalConsultationFee) || 0) + (Number(modalClinicalMedicinePkr) || 0) + (Number(modalFilePkr) || 0) + (Number(modalCardPkr) || 0)}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-0.5">
                        <div>
                          <label className="block text-[9px] font-extrabold text-slate-600 uppercase mb-0.5 truncate">Clinical Med (PKR):</label>
                          <input
                            type="text"
                            inputMode="numeric"
                            maxLength={5}
                            placeholder=""
                            value={modalClinicalMedicinePkr}
                            onChange={(e) => {
                              const val = e.target.value.replace(/\D/g, '').slice(0, 5);
                              setModalClinicalMedicinePkr(val);
                            }}
                            className="w-full text-xs border border-slate-300 rounded px-2 py-1.5 bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono text-center font-bold text-slate-900 shadow-inner"
                          />
                        </div>

                        <div>
                          <label className="block text-[9px] font-extrabold text-slate-600 uppercase mb-0.5 truncate">File (PKR):</label>
                          <input
                            type="text"
                            inputMode="numeric"
                            maxLength={5}
                            placeholder=""
                            value={modalFilePkr}
                            onChange={(e) => {
                              const val = e.target.value.replace(/\D/g, '').slice(0, 5);
                              setModalFilePkr(val);
                            }}
                            className="w-full text-xs border border-slate-300 rounded px-2 py-1.5 bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono text-center font-bold text-slate-900 shadow-inner"
                          />
                        </div>

                        <div>
                          <label className="block text-[9px] font-extrabold text-slate-600 uppercase mb-0.5 truncate">Card (PKR):</label>
                          <input
                            type="text"
                            inputMode="numeric"
                            maxLength={5}
                            placeholder=""
                            value={modalCardPkr}
                            onChange={(e) => {
                              const val = e.target.value.replace(/\D/g, '').slice(0, 5);
                              setModalCardPkr(val);
                            }}
                            className="w-full text-xs border border-slate-300 rounded px-2 py-1.5 bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono text-center font-bold text-slate-900 shadow-inner"
                          />
                        </div>

                        <div>
                          <label className="block text-[9px] font-extrabold text-slate-600 uppercase mb-0.5 truncate">OPD / App (PKR):</label>
                          <input
                            type="text"
                            inputMode="numeric"
                            maxLength={5}
                            placeholder=""
                            value={modalConsultationFee}
                            onChange={(e) => {
                              const val = e.target.value.replace(/\D/g, '').slice(0, 5);
                              setModalConsultationFee(val);
                            }}
                            className="w-full text-xs border border-slate-300 rounded px-2 py-1.5 bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono text-center font-bold text-slate-900 shadow-inner"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Form Column: Prescription Medicines */}
                  <div className="space-y-3">
                    {/* Clinical Compounded Medicines */}
                    <div className="bg-emerald-50/70 p-3 rounded-xl border border-emerald-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-extrabold text-emerald-950 uppercase tracking-tight flex items-center space-x-1">
                          <Pill className="w-3.5 h-3.5 text-emerald-700" />
                          <span>Clinical Compounded Medicines:</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => setModalClinicalItems(prev => [...prev, { id: String(Date.now()), medicineName: '', dosage: '' }])}
                          className="px-2 py-0.5 bg-emerald-700 hover:bg-emerald-800 text-white text-[10px] font-bold rounded transition flex items-center space-x-1 cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Add Row</span>
                        </button>
                      </div>

                      <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                        {modalClinicalItems.map((item, idx) => (
                          <div key={`m-clin-row-${item.id || idx}-${idx}`} className="flex items-center space-x-1.5">
                            <input
                              type="text"
                              placeholder=""
                              value={item.medicineName}
                              onChange={(e) => {
                                const val = e.target.value;
                                setModalClinicalItems(prev => prev.map((row, i) => i === idx ? { ...row, medicineName: val } : row));
                              }}
                              className="flex-1 text-xs border border-emerald-300 rounded p-1.5 font-semibold text-slate-900 bg-white"
                            />
                            <input
                              type="text"
                              placeholder=""
                              value={item.dosage}
                              onChange={(e) => {
                                const val = e.target.value;
                                setModalClinicalItems(prev => prev.map((row, i) => i === idx ? { ...row, dosage: val } : row));
                              }}
                              className="w-28 text-xs border border-emerald-300 rounded p-1.5 font-mono text-slate-900 bg-white"
                            />
                            {modalClinicalItems.length > 1 && (
                              <button
                                type="button"
                                onClick={() => setModalClinicalItems(prev => prev.filter((_, i) => i !== idx))}
                                className="p-1 text-rose-600 hover:text-rose-800"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Commercial / Patent Medicines */}
                    <div className="bg-blue-50/70 p-3 rounded-xl border border-blue-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-extrabold text-blue-950 uppercase tracking-tight flex items-center space-x-1">
                          <Pill className="w-3.5 h-3.5 text-blue-700" />
                          <span>Patent / Commercial Medicines:</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => setModalPatentItems(prev => [...prev, { id: String(Date.now()), medicineName: '', dosage: '' }])}
                          className="px-2 py-0.5 bg-blue-700 hover:bg-blue-800 text-white text-[10px] font-bold rounded transition flex items-center space-x-1 cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Add Row</span>
                        </button>
                      </div>

                      <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                        {modalPatentItems.map((item, idx) => (
                          <div key={`m-pat-row-${item.id || idx}-${idx}`} className="flex items-center space-x-1.5">
                            <input
                              type="text"
                              placeholder=""
                              value={item.medicineName}
                              onChange={(e) => {
                                const val = e.target.value;
                                setModalPatentItems(prev => prev.map((row, i) => i === idx ? { ...row, medicineName: val } : row));
                              }}
                              className="flex-1 text-xs border border-blue-300 rounded p-1.5 font-semibold text-slate-900 bg-white"
                            />
                            <input
                              type="text"
                              placeholder=""
                              value={item.dosage}
                              onChange={(e) => {
                                const val = e.target.value;
                                setModalPatentItems(prev => prev.map((row, i) => i === idx ? { ...row, dosage: val } : row));
                              }}
                              className="w-28 text-xs border border-blue-300 rounded p-1.5 font-mono text-slate-900 bg-white"
                            />
                            {modalPatentItems.length > 1 && (
                              <button
                                type="button"
                                onClick={() => setModalPatentItems(prev => prev.filter((_, i) => i !== idx))}
                                className="p-1 text-rose-600 hover:text-rose-800"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Doctor Remarks / Notes:</label>
                      <input
                        type="text"
                        placeholder=""
                        value={modalRemarks}
                        onChange={(e) => setModalRemarks(e.target.value)}
                        className="w-full text-xs border border-slate-300 rounded-lg p-2 font-medium text-slate-800 bg-white"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-100 p-3 sm:p-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
              <div className="text-xs font-semibold">
                {modalSaveSuccess && (
                  <span className="text-emerald-700 font-extrabold flex items-center space-x-1 animate-fadeIn">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>{modalSaveSuccess}</span>
                  </span>
                )}
                {modalSaveError && (
                  <span className="text-rose-600 font-extrabold flex items-center space-x-1 animate-fadeIn">
                    <AlertCircle className="w-4 h-4 text-rose-600" />
                    <span>{modalSaveError}</span>
                  </span>
                )}
                {!modalSaveSuccess && !modalSaveError && (
                  <span className="text-slate-500 italic text-[11px]">
                    Make your updates above and click <strong>Save & Update and Print</strong> to finish.
                  </span>
                )}
              </div>

              <div className="flex items-center space-x-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsRecentVisitsModalOpen(false)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={() => handleSaveFromRecentModal(false)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center space-x-1.5 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Save & Update</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSaveFromRecentModal(true)}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-md transition flex items-center space-x-1.5 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Save & Update and Print</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SMART MEDICINE LOCATOR MODAL POPUP FOR PATIENT VISIT */}
      {pvSmartLocatorModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 print:hidden animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-150 flex flex-col max-h-[90vh] overflow-hidden">
            
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-150 flex justify-between items-center bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-400/40 flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2">
                    <span>Smart Medicine Locator</span>
                    <span className="text-[9px] bg-emerald-500/20 text-emerald-300 font-extrabold px-2 py-0.5 rounded border border-emerald-500/30">
                      MongoDB Table: smart_locator_medicines
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-300 font-medium">
                    Search medicines by symptom to populate Clinical or Patent medicine box
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPvSmartLocatorModalOpen(false)}
                className="text-slate-400 hover:text-white font-extrabold text-sm p-1.5 rounded-lg hover:bg-white/10 transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Notification Banner */}
            {pvSmartLocatorNotification && (
              <div className="bg-emerald-600 text-white text-xs font-bold px-4 py-2 flex items-center justify-between shadow-xs animate-fadeIn">
                <span className="flex items-center">
                  <CheckCircle2 className="w-4 h-4 mr-1.5 text-emerald-200" />
                  {pvSmartLocatorNotification}
                </span>
                <span className="text-[10px] text-emerald-100 italic">Medicine name populated!</span>
              </div>
            )}

            {/* Modal Body */}
            <div className="p-4 overflow-y-auto space-y-3.5">
              
              {/* Destination Box Selector */}
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 space-y-1.5">
                <label className="block text-[10px] font-black text-slate-600 uppercase tracking-wider">
                  Target Medicine Box Destination:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPvSmartLocatorTargetBox('clinical')}
                    className={`py-2 px-3 rounded-lg text-xs font-black uppercase tracking-wider flex items-center justify-center space-x-1.5 transition cursor-pointer ${
                      pvSmartLocatorTargetBox === 'clinical'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Pill className="w-3.5 h-3.5" />
                    <span>1. Clinical Medicine Box</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPvSmartLocatorTargetBox('patient')}
                    className={`py-2 px-3 rounded-lg text-xs font-black uppercase tracking-wider flex items-center justify-center space-x-1.5 transition cursor-pointer ${
                      pvSmartLocatorTargetBox === 'patient'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Pill className="w-3.5 h-3.5" />
                    <span>2. Patient Medicine Box</span>
                  </button>
                </div>
              </div>

              {/* Symptom Search Bar */}
              <div>
                <label className="block text-xxs font-extrabold text-slate-500 uppercase mb-1">
                  Search Symptoms / Diseases / Indications:
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder=""
                    value={pvSmartLocatorSearch}
                    onChange={(e) => {
                      setPvSmartLocatorSearch(e.target.value);
                      setPvSmartLocatorSelectedTag('');
                    }}
                    className="w-full text-xs font-semibold border border-slate-300 rounded-xl pl-9 pr-8 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-slate-900 shadow-2xs"
                  />
                  {pvSmartLocatorSearch && (
                    <button
                      type="button"
                      onClick={() => setPvSmartLocatorSearch('')}
                      className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 text-xs font-bold"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              {/* Quick Symptom Filter Badges */}
              <div className="space-y-1">
                <span className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">
                  Quick Symptom Presets:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { label: 'Fever & Flu', keyword: 'fever' },
                    { label: 'Cough & Throat', keyword: 'cough' },
                    { label: 'Gastro & Acid', keyword: 'stomach' },
                    { label: 'Loose Motions', keyword: 'diarrhea' },
                    { label: 'Nausea & Vomiting', keyword: 'vomiting' },
                    { label: 'Pain & Muscle', keyword: 'pain' },
                    { label: 'Infection', keyword: 'infection' },
                    { label: 'Allergy', keyword: 'allergy' }
                  ].map((tag) => {
                    const isSelected = pvSmartLocatorSelectedTag === tag.keyword;
                    return (
                      <button
                        key={tag.keyword}
                        type="button"
                        onClick={() => {
                          setPvSmartLocatorSelectedTag(isSelected ? '' : tag.keyword);
                          setPvSmartLocatorSearch('');
                        }}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                        }`}
                      >
                        {tag.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Matching Medicines Result List */}
              <div className="border-t border-slate-150 pt-2 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                    Matching Smart Medicines ({
                      (() => {
                        const activeList = mongoSmartLocatorList.length > 0 ? mongoSmartLocatorList : smartLocatorMedicines;
                        const query = pvSmartLocatorSearch.toLowerCase().trim();
                        const tag = pvSmartLocatorSelectedTag.toLowerCase().trim();
                        return activeList.filter(m => {
                          const sym = (m.Symptoms || '').toLowerCase();
                          const name = (m.MedicineName || '').toLowerCase();
                          const comp = (m.Composition || '').toLowerCase();
                          const dos = (m.Dosage || '').toLowerCase();
                          if (tag && !sym.includes(tag) && !name.includes(tag) && !comp.includes(tag)) return false;
                          if (!query) return true;
                          return sym.includes(query) || name.includes(query) || comp.includes(query) || dos.includes(query);
                        }).length;
                      })()
                    } records)
                  </span>
                  <span className="text-[9px] text-slate-400 font-bold">
                    Select medicine to populate name
                  </span>
                </div>

                <div className="overflow-y-auto max-h-[300px] space-y-2 pr-1">
                  {(() => {
                    const activeList = mongoSmartLocatorList.length > 0 ? mongoSmartLocatorList : smartLocatorMedicines;
                    const query = pvSmartLocatorSearch.toLowerCase().trim();
                    const tag = pvSmartLocatorSelectedTag.toLowerCase().trim();

                    const filtered = activeList.filter(m => {
                      const sym = (m.Symptoms || '').toLowerCase();
                      const name = (m.MedicineName || '').toLowerCase();
                      const comp = (m.Composition || '').toLowerCase();
                      const dos = (m.Dosage || '').toLowerCase();
                      if (tag && !sym.includes(tag) && !name.includes(tag) && !comp.includes(tag)) return false;
                      if (!query) return true;
                      return sym.includes(query) || name.includes(query) || comp.includes(query) || dos.includes(query);
                    });

                    if (filtered.length === 0) {
                      return (
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 text-center space-y-2">
                          <AlertCircle className="w-6 h-6 text-slate-400 mx-auto" />
                          <p className="text-xs font-bold text-slate-600">No matching medicines found for symptoms.</p>
                          <p className="text-[10px] text-slate-400">Try searching another symptom or upload more smart locator rows in Bulk Uploader tab.</p>
                        </div>
                      );
                    }

                    return filtered.map((m, idx) => (
                      <div
                        key={idx}
                        className="bg-slate-50/80 hover:bg-indigo-50/40 border border-slate-200 hover:border-indigo-300 rounded-xl p-3 transition space-y-2"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div>
                            <span className="text-xs font-extrabold text-slate-900 block">
                              {m.MedicineName}
                            </span>
                            {m.Composition && (
                              <span className="text-[10px] font-mono text-slate-500 block">
                                Comp: {m.Composition}
                              </span>
                            )}
                          </div>
                          {m.Dosage && (
                            <span className="text-[10px] font-mono font-bold bg-amber-100 text-amber-900 border border-amber-200 px-2 py-0.5 rounded-md">
                              Dosage: {m.Dosage}
                            </span>
                          )}
                        </div>

                        {m.Symptoms && (
                          <p className="text-[10px] text-slate-600 bg-white p-1.5 rounded-lg border border-slate-150 leading-relaxed">
                            <strong className="text-indigo-900 font-extrabold uppercase text-[9px] mr-1">Symptoms:</strong>
                            {m.Symptoms}
                          </p>
                        )}

                        {/* Direct Selection Buttons */}
                        <div className="flex items-center justify-end space-x-2 pt-1">
                          <button
                            type="button"
                            onClick={() => handleSelectSmartMedicine(m, 'clinical')}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[10px] rounded-lg shadow-2xs transition flex items-center space-x-1 cursor-pointer"
                            title={`Insert "${m.MedicineName}" into Clinical Medicine Box`}
                          >
                            <Plus className="w-3 h-3" />
                            <span>Clinical Box</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSelectSmartMedicine(m, 'patient')}
                            className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-[10px] rounded-lg shadow-2xs transition flex items-center space-x-1 cursor-pointer"
                            title={`Insert "${m.MedicineName}" into Patient Medicine Box`}
                          >
                            <Plus className="w-3 h-3" />
                            <span>Patient Box</span>
                          </button>
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-slate-50 border-t border-slate-150 flex justify-between items-center">
              <span className="text-[10px] text-slate-400 font-medium">
                Clicking a medicine populates its name directly into doctor's prescription box.
              </span>
              <button
                type="button"
                onClick={() => setPvSmartLocatorModalOpen(false)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
              >
                Done / Close
              </button>
            </div>

          </div>
        </div>
      )}

      {/* OPD TOKEN ISSUE POPUP MODAL */}
      {isOpdTokenModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="bg-emerald-700 px-6 py-4 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-emerald-600/80 rounded-xl text-white">
                  <Ticket className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base tracking-tight text-white flex items-center">
                    Issue OPD Token
                  </h3>
                  <p className="text-xs text-emerald-100 font-medium">
                    Patient Intake & Token Generation Desk
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpdTokenModalOpen(false)}
                className="p-1.5 hover:bg-emerald-600 rounded-lg text-emerald-100 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-4">
              {/* Mode Toggle: Existing Patient vs New Patient */}
              <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
                <button
                  type="button"
                  onClick={() => setTokenIssueMode('existing')}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${
                    tokenIssueMode === 'existing'
                      ? 'bg-white text-emerald-800 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Existing Selected Patient
                </button>
                <button
                  type="button"
                  onClick={() => setTokenIssueMode('new_patient')}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition flex items-center justify-center space-x-1 ${
                    tokenIssueMode === 'new_patient'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>+ Quick New Patient Registration</span>
                </button>
              </div>

              {appError && (
                <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl font-semibold border border-red-200">
                  {appError}
                </div>
              )}
              {appSuccess && (
                <div className="p-3 bg-emerald-50 text-emerald-800 text-xs rounded-xl font-semibold border border-emerald-200 flex items-center">
                  <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-600 shrink-0" />
                  {appSuccess}
                </div>
              )}

              {/* MODE 1: EXISTING PATIENT FORM */}
              {tokenIssueMode === 'existing' && (
                <div className="space-y-4">
                  {/* Selected Patient Banner */}
                  {selectedPatientId ? (() => {
                    const pat = opdTokenModalPatient || patients.find(p => p.PatientID === selectedPatientId);
                    return (
                      <div className="bg-emerald-50/90 p-4 rounded-xl border border-emerald-200 space-y-1 shadow-2xs">
                        <div className="flex justify-between items-start">
                          <span className="text-[10px] font-extrabold text-emerald-800 uppercase tracking-wider">Patient Selected for OPD Token</span>
                          <span className="text-xs font-mono font-bold text-emerald-900 bg-emerald-100 px-2 py-0.5 rounded-full">
                            ID: {selectedPatientId}
                          </span>
                        </div>
                        <p className="text-base font-black text-slate-950">{pat?.PatientName || selectedPatientId}</p>
                        <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 pt-1">
                          <p><strong className="text-slate-800">Phone:</strong> {pat?.PhoneMobile || 'N/A'}</p>
                          <p><strong className="text-slate-800">Age / Gender:</strong> {pat?.AgeYears || 0} Yrs ({pat?.Sex || 'N/A'})</p>
                        </div>
                      </div>
                    );
                  })() : (
                    <div className="bg-amber-50/80 p-4 rounded-xl border border-amber-200 text-xs text-amber-900 font-medium">
                      <p className="font-bold">No Patient Selected</p>
                      <p className="text-[11px] text-amber-800 mt-0.5">Please search and click "Select for Token" on a patient record, or register a new patient below.</p>
                    </div>
                  )}

                  <form onSubmit={handleBookAppointment} className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xxs font-bold text-slate-500 uppercase">Token Date</label>
                        <input
                          type="date"
                          required
                          value={appDate}
                          onChange={(e) => setAppDate(e.target.value)}
                          className="mt-1 w-full text-xs border border-slate-200 rounded-lg p-2 font-mono focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xxs font-bold text-slate-500 uppercase">Shift Selection</label>
                        <div className="grid grid-cols-2 gap-1 mt-1">
                          <button
                            type="button"
                            onClick={() => setShift(1)}
                            className={`p-2 text-xs font-bold rounded-lg border transition text-center cursor-pointer ${
                              shift === 1
                                ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            Morning
                          </button>
                          <button
                            type="button"
                            onClick={() => setShift(2)}
                            className={`p-2 text-xs font-bold rounded-lg border transition text-center cursor-pointer ${
                              shift === 2
                                ? 'bg-blue-600 text-white border-blue-700 shadow-xs'
                                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            Evening
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Pre-booked Appointment Check */}
                    {(() => {
                      const activePreBookedApp = selectedPatientId
                        ? appointments.find(a => a.PatientID === selectedPatientId && a.AppointmentDate === appDate && a.Status !== 3)
                        : undefined;

                      if (activePreBookedApp) {
                        return (
                          <div className="bg-emerald-50 border border-emerald-300 p-3 rounded-xl space-y-1.5 shadow-xs">
                            <div className="flex items-center space-x-1.5 text-xs font-bold text-emerald-950">
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                              <span>Pre-Booked Appointment Detected</span>
                            </div>
                            <p className="text-xs text-emerald-900">
                              Appointment <strong className="font-mono text-emerald-950">{activePreBookedApp.AppointmentID}</strong> pre-booked for {appDate}.
                            </p>
                            <div className="bg-white/90 p-2 rounded-lg border border-emerald-200 text-xs flex justify-between items-center">
                              <span className="font-semibold text-slate-700">Fee Paid on Booking:</span>
                              <span className="font-mono font-black text-emerald-800">PKR {Number(activePreBookedApp.FeeCharged || 0).toLocaleString()}</span>
                            </div>
                            <div className="bg-emerald-100/90 px-2.5 py-1.5 rounded-md text-[11px] font-bold text-emerald-950 flex justify-between items-center">
                              <span>Fee Charged Today for Token:</span>
                              <span className="font-mono font-black text-emerald-800 bg-white px-1.5 py-0.5 rounded border border-emerald-300">PKR 0 (Prepaid)</span>
                            </div>
                          </div>
                        );
                      }

                      return (
                        <div>
                          <label className="block text-xxs font-bold text-slate-500 uppercase">Appointment / OPD Fee Charged (PKR)</label>
                          <input
                            type="text"
                            placeholder=""
                            value={existingFee}
                            onChange={(e) => setExistingFee(e.target.value)}
                            className="mt-1 w-full text-xs border border-slate-300 font-mono font-bold text-slate-800 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                          />
                        </div>
                      );
                    })()}

                    {(() => {
                      const activePreBookedApp = selectedPatientId
                        ? appointments.find(a => a.PatientID === selectedPatientId && a.AppointmentDate === appDate && a.Status !== 3)
                        : undefined;
                      const realTodayStr = new Date().toISOString().split('T')[0];
                      const isFuture = appDate !== realTodayStr;

                      return (
                        <div className="pt-2">
                          <button
                            type="submit"
                            disabled={isSubmittingToken || !selectedPatientId || !canAdd || (isFuture ? !canBookAppointment : !canIssueToken)}
                            className={`w-full py-3 disabled:opacity-50 text-white text-xs font-extrabold rounded-xl shadow-md transition flex items-center justify-center space-x-2 cursor-pointer ${
                              isSubmittingToken
                                ? 'bg-emerald-800 cursor-wait'
                                : (!canIssueToken && !isFuture) || (!canBookAppointment && isFuture)
                                ? 'bg-slate-400 cursor-not-allowed'
                                : activePreBookedApp
                                ? 'bg-emerald-700 hover:bg-emerald-800'
                                : isFuture
                                ? 'bg-blue-600 hover:bg-blue-700'
                                : 'bg-emerald-600 hover:bg-emerald-700'
                            }`}
                          >
                            {isSubmittingToken ? (
                              <div className="flex items-center space-x-2">
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                <span>Processing Token...</span>
                              </div>
                            ) : (
                              <>
                                <Ticket className="w-4 h-4" />
                                <span>
                                  {(!canIssueToken && !isFuture) || (!canBookAppointment && isFuture)
                                    ? 'Access Restricted - Permission Denied'
                                    : activePreBookedApp
                                    ? 'Issue Token (PKR 0 - Prepaid) & Print Slip'
                                    : isFuture
                                    ? 'Book Future Appointment & Record Fee'
                                    : 'Issue OPD Token & Print Slip'}
                                </span>
                              </>
                            )}
                          </button>
                        </div>
                      );
                    })()}
                  </form>
                </div>
              )}

              {/* MODE 2: NEW PATIENT QUICK REGISTRATION FORM */}
              {tokenIssueMode === 'new_patient' && (
                <form onSubmit={handleIssueTokenForNewPatient} className="space-y-3 pt-1">
                  <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200 text-xs text-emerald-900 font-medium space-y-0.5">
                    <p className="font-bold flex items-center text-emerald-950">
                      <UserPlus className="w-3.5 h-3.5 mr-1 text-emerald-600 shrink-0" />
                      Quick New Patient Registration
                    </p>
                    <p className="text-[11px] text-emerald-800">
                      Enter basic patient info to create a new profile. They will immediately be selected to issue an OPD token.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xxs font-bold text-slate-600 uppercase">Patient Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder=""
                      value={newPatName}
                      onChange={(e) => setNewPatName(e.target.value)}
                      className="mt-1 w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-bold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xxs font-bold text-slate-600 uppercase">Mobile Phone Number</label>
                    <input
                      type="text"
                      placeholder=""
                      value={newPatPhone}
                      onChange={(e) => setNewPatPhone(e.target.value)}
                      className="mt-1 w-full text-xs border border-slate-300 rounded-lg p-2.5 font-mono focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xxs font-bold text-slate-600 uppercase">Chief Complaint / Remarks</label>
                    <input
                      type="text"
                      placeholder=""
                      value={newPatRemarks}
                      onChange={(e) => setNewPatRemarks(e.target.value)}
                      className="mt-1 w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={!canAdd}
                      className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center justify-center space-x-2 cursor-pointer"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span>Register Patient & Proceed to Token</span>
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-slate-50 border-t border-slate-150 flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setIsOpdTokenModalOpen(false)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-xl transition cursor-pointer"
              >
                Close Modal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ORGANIZATION CLAIM BILL / INVOICE MODAL */}
      {isClaimBillModalOpen && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="bg-slate-900 px-5 py-3.5 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shrink-0">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black tracking-tight text-white">
                    Organization Reimbursement Claim Bill
                  </h3>
                  <p className="text-[10px] text-blue-200 font-medium">
                    Generate official itemized invoice for employer / corporate medical claim
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsClaimBillModalOpen(false)}
                className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4">
              {selectedPvPatient ? (
                <>
                  {/* Selected Patient Banner */}
                  <div className="bg-blue-50/70 p-3 rounded-xl border border-blue-200 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider block">Claim Patient</span>
                      <span className="text-sm font-black text-slate-900">{selectedPvPatient.PatientName}</span>
                      <span className="text-xs font-mono font-bold text-blue-900 ml-2">({selectedPvPatient.PatientID})</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-bold text-slate-500 block uppercase">Visit Date</span>
                      <span className="text-xs font-mono font-extrabold text-slate-900">{formatDisplayDate(pvVisitDate)}</span>
                    </div>
                  </div>

                  {/* Organization Selection Presets */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                      Select Organization / Employer:
                    </label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {['WAPDA', 'SNGPL', 'State Bank', 'Pakistan Railways', 'Police / Govt', 'Custom'].map((org) => {
                        const isSelected = claimBillOrg === org;
                        return (
                          <button
                            key={org}
                            type="button"
                            onClick={() => setClaimBillOrg(org)}
                            className={`py-2 px-2.5 rounded-xl text-xs font-black transition cursor-pointer text-center border ${
                              isSelected
                                ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                            }`}
                          >
                            {org === 'Custom' ? '✏️ Custom / Other' : org}
                          </button>
                        );
                      })}
                    </div>

                    {/* Custom Organization Name Field */}
                    {claimBillOrg === 'Custom' && (
                      <div className="pt-1 animate-in fade-in duration-100">
                        <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                          Custom Organization / Company Name:
                        </label>
                        <input
                          type="text"
                          placeholder=""
                          value={claimBillCustomOrg}
                          onChange={(e) => setClaimBillCustomOrg(e.target.value)}
                          className="w-full text-xs font-bold border border-blue-300 rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                      </div>
                    )}
                  </div>

                  {/* Employee ID & Designation Fields */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                        Employee ID / Token #:
                      </label>
                      <input
                        type="text"
                        placeholder=""
                        value={claimBillEmployeeId}
                        onChange={(e) => setClaimBillEmployeeId(e.target.value)}
                        className="w-full text-xs font-bold border border-slate-300 rounded-lg p-2 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                        Designation / Department:
                      </label>
                      <input
                        type="text"
                        placeholder=""
                        value={claimBillDesignation}
                        onChange={(e) => setClaimBillDesignation(e.target.value)}
                        className="w-full text-xs font-bold border border-slate-300 rounded-lg p-2 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Financial Summary Preview Box */}
                  {(() => {
                    const claimAppt = (appointments || []).find(a => a.PatientID === selectedPvPatient.PatientID && a.AppointmentDate.startsWith(pvVisitDate));
                    const consultationFeeNum = Number(claimAppt?.FeeCharged) || 0;
                    const clinFeeNum = Number(pvClinicalMedicinePkr) || 0;
                    const fileFeeNum = Number(pvFilePkr) || 0;
                    const cardFeeNum = Number(pvCardPkr) || 0;
                    const grandTotalNum = consultationFeeNum + clinFeeNum + fileFeeNum + cardFeeNum;

                    return (
                      <div className="bg-slate-900 text-white p-3.5 rounded-xl space-y-2 border border-slate-800">
                        <span className="block text-[10px] font-black uppercase text-amber-400 tracking-wider">
                          Itemized Claim Amount Breakdown (PKR)
                        </span>
                        <div className="grid grid-cols-4 gap-2 text-center text-xs">
                          <div className="bg-slate-800 p-2 rounded-lg border border-slate-700">
                            <span className="block text-[9px] text-slate-400 font-bold uppercase">Consultation</span>
                            <span className="font-mono font-bold text-emerald-400">PKR {consultationFeeNum}</span>
                          </div>
                          <div className="bg-slate-800 p-2 rounded-lg border border-slate-700">
                            <span className="block text-[9px] text-slate-400 font-bold uppercase">Clinical Meds</span>
                            <span className="font-mono font-bold text-blue-400">PKR {clinFeeNum}</span>
                          </div>
                          <div className="bg-slate-800 p-2 rounded-lg border border-slate-700">
                            <span className="block text-[9px] text-slate-400 font-bold uppercase">File Fee</span>
                            <span className="font-mono font-bold text-purple-400">PKR {fileFeeNum}</span>
                          </div>
                          <div className="bg-slate-800 p-2 rounded-lg border border-slate-700">
                            <span className="block text-[9px] text-slate-400 font-bold uppercase">Card Fee</span>
                            <span className="font-mono font-bold text-amber-400">PKR {cardFeeNum}</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between pt-1 border-t border-slate-800">
                          <span className="text-xs font-bold uppercase text-slate-300">Total Claimable Amount:</span>
                          <span className="text-base font-black font-mono text-emerald-400">
                            PKR {grandTotalNum.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Claim Remarks Field */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                      Official Remarks / Claim Note (Optional):
                    </label>
                    <input
                      type="text"
                      placeholder=""
                      value={claimBillRemarks}
                      onChange={(e) => setClaimBillRemarks(e.target.value)}
                      className="w-full text-xs font-semibold border border-slate-300 rounded-lg p-2 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </>
              ) : (
                <div className="p-8 text-center text-slate-500">
                  <p className="text-sm font-bold">No patient selected for claim bill.</p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
              <button
                type="button"
                onClick={() => setIsClaimBillModalOpen(false)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  handlePrintClaimBill();
                  setIsClaimBillModalOpen(false);
                }}
                disabled={!selectedPvPatient}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl transition flex items-center space-x-1.5 cursor-pointer shadow-md"
              >
                <Printer className="w-4 h-4 text-white" />
                <span>Print Official Claim Bill</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PRINT REPORT DATE RANGE SELECTION POPUP MODAL */}
      {isReportDateModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-amber-500/20 rounded-xl text-amber-400">
                  <Printer className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-white">Print Patient Visit & Financial Report</h3>
                  <p className="text-[11px] text-slate-300">Select report date range to run report</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsReportDateModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-700/50 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4">
              {/* Quick Date Presets */}
              <div>
                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1.5">Quick Date Range Presets</label>
                <div className="grid grid-cols-4 gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      const today = new Date().toISOString().split('T')[0];
                      setReportStartDate(today);
                      setReportEndDate(today);
                    }}
                    className={`py-1.5 px-2 rounded-lg text-xs font-bold transition border cursor-pointer ${
                      reportStartDate === new Date().toISOString().split('T')[0] && reportEndDate === new Date().toISOString().split('T')[0]
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Today
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const yest = new Date();
                      yest.setDate(yest.getDate() - 1);
                      const yestStr = yest.toISOString().split('T')[0];
                      setReportStartDate(yestStr);
                      setReportEndDate(yestStr);
                    }}
                    className="py-1.5 px-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-bold transition cursor-pointer"
                  >
                    Yesterday
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const now = new Date();
                      const day = now.getDay();
                      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
                      const monday = new Date(now.setDate(diff)).toISOString().split('T')[0];
                      const today = new Date().toISOString().split('T')[0];
                      setReportStartDate(monday);
                      setReportEndDate(today);
                    }}
                    className="py-1.5 px-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-bold transition cursor-pointer"
                  >
                    This Week
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const now = new Date();
                      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
                      const today = new Date().toISOString().split('T')[0];
                      setReportStartDate(firstDay);
                      setReportEndDate(today);
                    }}
                    className="py-1.5 px-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-bold transition cursor-pointer"
                  >
                    This Month
                  </button>
                </div>
              </div>

              {/* Date Input Controls */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">From Date *</label>
                  <input
                    type="date"
                    value={reportStartDate}
                    onChange={(e) => setReportStartDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition cursor-pointer"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">To Date *</label>
                  <input
                    type="date"
                    value={reportEndDate}
                    onChange={(e) => setReportEndDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition cursor-pointer"
                  />
                </div>
              </div>

              {/* Report Format Selection */}
              <div>
                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1.5">Select Report Format *</label>
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => setSelectedReportTypeInModal('patient_shift_wise')}
                    className={`w-full text-left p-2.5 rounded-xl border transition flex items-start space-x-2.5 cursor-pointer ${
                      selectedReportTypeInModal === 'patient_shift_wise'
                        ? 'bg-indigo-50/80 border-indigo-500 ring-2 ring-indigo-500/20'
                        : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <div className={`p-1.5 rounded-lg shrink-0 ${selectedReportTypeInModal === 'patient_shift_wise' ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                      <Users className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-extrabold text-xs text-slate-900">🩺 Doctor Shift-Wise Patient Report</div>
                      <div className="text-[10px] text-slate-500 leading-tight">Patient Name, Age, Gender, Mobile No & Total Payment = Clinical + File + Card + Store (Shift-Wise)</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedReportTypeInModal('grid')}
                    className={`w-full text-left p-2.5 rounded-xl border transition flex items-start space-x-2.5 cursor-pointer ${
                      selectedReportTypeInModal === 'grid'
                        ? 'bg-indigo-50/80 border-indigo-500 ring-2 ring-indigo-500/20'
                        : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <div className={`p-1.5 rounded-lg shrink-0 ${selectedReportTypeInModal === 'grid' ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                      <Grid className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-extrabold text-xs text-slate-900">📊 Daily Collection Summary (Grid)</div>
                      <div className="text-[10px] text-slate-500 leading-tight">Matrix view of Morning & Evening collections (App, Meds, Cards, File, Store)</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedReportTypeInModal('pdf')}
                    className={`w-full text-left p-2.5 rounded-xl border transition flex items-start space-x-2.5 cursor-pointer ${
                      selectedReportTypeInModal === 'pdf'
                        ? 'bg-indigo-50/80 border-indigo-500 ring-2 ring-indigo-500/20'
                        : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <div className={`p-1.5 rounded-lg shrink-0 ${selectedReportTypeInModal === 'pdf' ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-extrabold text-xs text-slate-900">📄 Payment Collection Statement (PDF)</div>
                      <div className="text-[10px] text-slate-500 leading-tight">Formal printable letterhead collection statement itemized by date and shift</div>
                    </div>
                  </button>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-2.5 flex items-start space-x-2 text-[11px] text-amber-900 font-medium">
                <Calendar className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  Report will generate and aggregate all OPD visits, payments, and clinic collections from <strong>{formatDisplayDate(reportStartDate)}</strong> to <strong>{formatDisplayDate(reportEndDate)}</strong>.
                </span>
              </div>
            </div>

            {/* Modal Actions Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={() => setIsReportDateModalOpen(false)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!reportStartDate || !reportEndDate) {
                    alert('Please select valid From Date and To Date.');
                    return;
                  }
                  if (reportStartDate > reportEndDate) {
                    alert('From Date cannot be after To Date.');
                    return;
                  }
                  setDailyCollectionStartDate(reportStartDate);
                  setDailyCollectionEndDate(reportEndDate);
                  const data = generateDailyCollectionReport(reportStartDate, reportEndDate);
                  setDailyCollectionReportData(data);
                  setDailyCollectionReportFormat(selectedReportTypeInModal);
                  setIsReportDateModalOpen(false);
                  setIsDailyCollectionReportModalOpen(true);
                }}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl transition flex items-center space-x-1.5 cursor-pointer shadow-md"
              >
                <Printer className="w-4 h-4 text-white" />
                <span>Run Report</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DAILY COLLECTION REPORT MODAL (Matching Financials Tab Format) */}
      {isDailyCollectionReportModalOpen && dailyCollectionReportData && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto print:absolute print:inset-0 print:bg-white print:p-0">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-5xl w-full flex flex-col h-[90vh] print:h-auto print:border-0 print:shadow-none animate-fadeIn">
            {/* Modal Top Control Bar */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between print:hidden bg-slate-50 rounded-t-2xl">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setDailyCollectionReportFormat('patient_shift_wise')}
                  className={`px-3 py-1.5 rounded-lg text-xxs font-black uppercase transition cursor-pointer flex items-center ${
                    dailyCollectionReportFormat === 'patient_shift_wise' ? 'bg-indigo-700 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 bg-slate-200/60'
                  }`}
                >
                  <Users className="w-3.5 h-3.5 mr-1.5" />
                  🩺 Doctor Shift-Wise Patients
                </button>
                <button
                  onClick={() => setDailyCollectionReportFormat('grid')}
                  className={`px-3 py-1.5 rounded-lg text-xxs font-black uppercase transition cursor-pointer flex items-center ${
                    dailyCollectionReportFormat === 'grid' ? 'bg-indigo-700 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 bg-slate-200/60'
                  }`}
                >
                  <Grid className="w-3.5 h-3.5 mr-1.5" />
                  📊 Collection Grid Summary
                </button>
                <button
                  onClick={() => setDailyCollectionReportFormat('pdf')}
                  className={`px-3 py-1.5 rounded-lg text-xxs font-black uppercase transition cursor-pointer flex items-center ${
                    dailyCollectionReportFormat === 'pdf' ? 'bg-indigo-700 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 bg-slate-200/60'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5 mr-1.5" />
                  📄 PDF Printable Format
                </button>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleCleanPrintDailyCollectionReport(dailyCollectionReportData, dailyCollectionReportFormat)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-1.5 rounded-lg text-xxs font-black uppercase tracking-wider transition flex items-center shadow-xs cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 mr-1" />
                  Send to Printer / Save PDF
                </button>
                <button
                  onClick={() => {
                    setDailyCollectionReportData(null);
                    setIsDailyCollectionReportModalOpen(false);
                  }}
                  className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-3 py-1.5 rounded-lg text-xxs font-black uppercase tracking-wider transition cursor-pointer"
                >
                  Close Preview
                </button>
              </div>
            </div>

            {/* VIEW 0: DOCTOR SHIFT-WISE PATIENT REPORT */}
            {dailyCollectionReportFormat === 'patient_shift_wise' ? (
              <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50 font-sans text-slate-900">
                {/* Header Summary Card */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div>
                      <h2 className="text-base font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                        <span>🩺 Doctor Shift-Wise Patient Visit & Payment Report</span>
                      </h2>
                      <p className="text-xs text-slate-500 font-medium">
                        Period: <strong>{formatReportDate(dailyCollectionReportData.startDate)}</strong> to <strong>{formatReportDate(dailyCollectionReportData.endDate)}</strong>
                      </p>
                    </div>
                    <div className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1.5 rounded-xl font-mono text-xs font-bold flex items-center space-x-1.5">
                      <span>Total Collection:</span>
                      <strong className="text-sm font-black text-emerald-700">Rs. {(dailyCollectionReportData.doctorShiftGrandTotals?.totalPayment || 0).toLocaleString()}</strong>
                    </div>
                  </div>

                  {/* Stat Chips */}
                  <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-center">
                      <div className="text-[10px] font-bold text-slate-500 uppercase">Total Patients</div>
                      <div className="text-sm font-black text-slate-900 mt-0.5">{dailyCollectionReportData.doctorShiftGrandTotals?.totalPatients || 0}</div>
                    </div>
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-center">
                      <div className="text-[10px] font-bold text-slate-500 uppercase">Clinical Charges</div>
                      <div className="text-sm font-black text-slate-900 mt-0.5 font-mono">Rs. {(dailyCollectionReportData.doctorShiftGrandTotals?.clinicalFee || 0).toLocaleString()}</div>
                    </div>
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-center">
                      <div className="text-[10px] font-bold text-slate-500 uppercase">File Fee</div>
                      <div className="text-sm font-black text-slate-900 mt-0.5 font-mono">Rs. {(dailyCollectionReportData.doctorShiftGrandTotals?.fileFee || 0).toLocaleString()}</div>
                    </div>
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-center">
                      <div className="text-[10px] font-bold text-slate-500 uppercase">Card Fee</div>
                      <div className="text-sm font-black text-slate-900 mt-0.5 font-mono">Rs. {(dailyCollectionReportData.doctorShiftGrandTotals?.cardFee || 0).toLocaleString()}</div>
                    </div>
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-center">
                      <div className="text-[10px] font-bold text-slate-500 uppercase">Store POS Sales</div>
                      <div className="text-sm font-black text-slate-900 mt-0.5 font-mono">Rs. {(dailyCollectionReportData.doctorShiftGrandTotals?.storePayment || 0).toLocaleString()}</div>
                    </div>
                    <div className="bg-emerald-600 text-white p-2.5 rounded-xl text-center shadow-xs">
                      <div className="text-[10px] font-bold text-emerald-200 uppercase">Grand Payment</div>
                      <div className="text-sm font-black mt-0.5 font-mono">Rs. {(dailyCollectionReportData.doctorShiftGrandTotals?.totalPayment || 0).toLocaleString()}</div>
                    </div>
                  </div>
                </div>

                {/* Shift-Wise Blocks */}
                {(!dailyCollectionReportData.doctorShiftBlocks || dailyCollectionReportData.doctorShiftBlocks.length === 0) ? (
                  <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 text-slate-500 font-medium">
                    No patient visits recorded for the selected date range.
                  </div>
                ) : (
                  dailyCollectionReportData.doctorShiftBlocks.map((block: any, bIdx: number) => (
                    <div key={bIdx} className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                      <div className="bg-slate-900 text-white px-4 py-2.5 flex items-center justify-between text-xs font-bold">
                        <div className="flex items-center space-x-2">
                          <span className="bg-indigo-500 text-white px-2 py-0.5 rounded text-[10px] font-black uppercase">🗓️ {block.date}</span>
                          <span className="text-slate-200 font-extrabold">{block.shiftLabel}</span>
                        </div>
                        <span className="bg-amber-400 text-slate-950 px-2.5 py-0.5 rounded-full text-[11px] font-black">
                          {block.shiftTotals.patientCount} Patients Visited
                        </span>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className="bg-slate-100 text-slate-700 font-black uppercase text-[10px] border-b border-slate-200">
                              <th className="p-2.5 text-center w-12">Sr#</th>
                              <th className="p-2.5">Patient Name</th>
                              <th className="p-2.5 text-center">Age / Gender</th>
                              <th className="p-2.5 text-center">Mobile No</th>
                              <th className="p-2.5 text-right">Clinical Fee</th>
                              <th className="p-2.5 text-right">File Fee</th>
                              <th className="p-2.5 text-right">Card Fee</th>
                              <th className="p-2.5 text-right">Store Sales</th>
                              <th className="p-2.5 text-right bg-emerald-50 text-emerald-900 font-extrabold">Total Payment</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                            {block.patients.map((p: any, pIdx: number) => (
                              <tr key={pIdx} className="hover:bg-slate-50 transition">
                                <td className="p-2.5 text-center font-bold text-slate-500">{p.srNo}</td>
                                <td className="p-2.5 font-bold text-slate-900">{p.patientName}</td>
                                <td className="p-2.5 text-center text-slate-600 font-semibold">{p.age} / {p.gender}</td>
                                <td className="p-2.5 text-center font-mono text-slate-600">{p.mobileNo}</td>
                                <td className="p-2.5 text-right font-mono">Rs. {(p.clinicalFee || 0).toLocaleString()}</td>
                                <td className="p-2.5 text-right font-mono">Rs. {(p.fileFee || 0).toLocaleString()}</td>
                                <td className="p-2.5 text-right font-mono">Rs. {(p.cardFee || 0).toLocaleString()}</td>
                                <td className="p-2.5 text-right font-mono">Rs. {(p.storePayment || 0).toLocaleString()}</td>
                                <td className="p-2.5 text-right font-mono font-black text-emerald-700 bg-emerald-50/50">
                                  Rs. {(p.totalPayment || 0).toLocaleString()}
                                </td>
                              </tr>
                            ))}
                            <tr className="bg-slate-100 font-black text-slate-900 border-t-2 border-slate-300">
                              <td colSpan={4} className="p-2.5 uppercase text-[10px] tracking-wider text-slate-700">
                                {block.shiftLabel} Subtotal ({block.shiftTotals.patientCount} Patients)
                              </td>
                              <td className="p-2.5 text-right font-mono">Rs. {block.shiftTotals.clinicalFee.toLocaleString()}</td>
                              <td className="p-2.5 text-right font-mono">Rs. {block.shiftTotals.fileFee.toLocaleString()}</td>
                              <td className="p-2.5 text-right font-mono">Rs. {block.shiftTotals.cardFee.toLocaleString()}</td>
                              <td className="p-2.5 text-right font-mono">Rs. {block.shiftTotals.storePayment.toLocaleString()}</td>
                              <td className="p-2.5 text-right font-mono text-sm text-emerald-800 bg-emerald-100/80 font-extrabold">
                                Rs. {block.shiftTotals.totalPayment.toLocaleString()}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : dailyCollectionReportFormat === 'pdf' ? (
              <div className="flex-1 overflow-y-auto p-8 space-y-4 print:overflow-visible print:p-0 bg-white font-sans text-slate-900">
                <div className="text-center space-y-0.5">
                  <h1 className="text-base font-black tracking-wide uppercase text-slate-950">
                    {clinicSettings?.ClinicName || 'Punjab Homoeopathic Clinic'}
                  </h1>
                  <p className="text-[11px] font-semibold text-slate-700">
                    {clinicSettings?.ClinicAddress || '39-Shalimar Road, Garhi Shahu, Lahore-39'}
                  </p>
                </div>

                <div className="border-t-2 border-slate-950 my-2"></div>

                <div className="text-center space-y-1">
                  <h2 className="text-sm font-black uppercase tracking-widest text-slate-950">
                    Payment Collection Report
                  </h2>
                  <div className="flex justify-center items-center space-x-8 text-xs font-bold text-slate-800 pt-0.5">
                    <span>From: <span className="underline ml-1 font-extrabold">{formatReportDate(dailyCollectionReportData.startDate)}</span></span>
                    <span>To: <span className="underline ml-1 font-extrabold">{formatReportDate(dailyCollectionReportData.endDate)}</span></span>
                  </div>
                </div>

                <div className="border-t-2 border-slate-950 my-2"></div>

                <div className="overflow-x-auto pt-1">
                  <table className="w-full border-collapse text-xs">
                    <thead>
                      <tr className="border-b-2 border-slate-950 text-slate-950 font-black uppercase text-[11px] bg-slate-50 text-left">
                        <th className="py-2 px-2 w-[22%]">Date & Shift</th>
                        <th className="py-2 px-2 w-[16%] text-center">Patients Visited</th>
                        <th className="py-2 px-2 w-[16%] text-center">No of Patients</th>
                        <th className="py-2 px-2 w-[31%] text-left">Payment Description</th>
                        <th className="py-2 px-2 w-[15%] text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 font-medium text-slate-900">
                      {dailyCollectionReportData.pdfRows.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-slate-400 font-bold italic">
                            No collection records found.
                          </td>
                        </tr>
                      ) : (
                        dailyCollectionReportData.pdfRows.map((dateBlock: any, dateIdx: number) => (
                          <React.Fragment key={dateBlock.rawDate || dateIdx}>
                            {dateBlock.shiftBlocks.map((shiftBlock: any, shiftIdx: number) => (
                              <React.Fragment key={shiftIdx}>
                                {shiftBlock.items.map((item: any, itemIdx: number) => (
                                  <tr key={itemIdx} className="hover:bg-slate-50/50">
                                    <td className="py-1 px-2 font-bold text-slate-950">
                                      {itemIdx === 0 ? `${dateBlock.date} ${shiftBlock.shiftLabel}` : ''}
                                    </td>
                                    <td className="py-1 px-2 text-center font-bold text-slate-950">
                                      {itemIdx === 0 ? shiftBlock.visitedCount : ''}
                                    </td>
                                    <td className="py-1 px-2 text-center font-mono font-semibold">
                                      {item.count || '-'}
                                    </td>
                                    <td className="py-1 px-2 text-left text-slate-900">
                                      {item.description}
                                    </td>
                                    <td className="py-1 px-2 text-right font-mono font-semibold">
                                      {item.amount.toLocaleString()}
                                    </td>
                                  </tr>
                                ))}

                                <tr className="bg-slate-50/60 font-bold">
                                  <td className="py-1 px-2"></td>
                                  <td className="py-1 px-2"></td>
                                  <td className="py-1 px-2"></td>
                                  <td className="py-1.5 px-2 text-left font-bold text-slate-950">
                                    Shift Total
                                  </td>
                                  <td className="py-1.5 px-2 text-right font-mono font-bold text-slate-950 border-t border-slate-300">
                                    {shiftBlock.shiftTotal.toLocaleString()}
                                  </td>
                                </tr>
                              </React.Fragment>
                            ))}

                            <tr className="border-b-2 border-slate-900 font-extrabold bg-slate-100/70">
                              <td className="py-2 px-2"></td>
                              <td className="py-2 px-2"></td>
                              <td className="py-2 px-2"></td>
                              <td className="py-2 px-2 text-left text-slate-950 uppercase tracking-wide">
                                Today Closing
                              </td>
                              <td className="py-2 px-2 text-right font-mono text-slate-950 font-black border-t-2 border-slate-900">
                                {dateBlock.todayClosing.toLocaleString()}
                              </td>
                            </tr>
                          </React.Fragment>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="border-t-2 border-b-2 border-slate-950 py-3 my-4 flex justify-between items-center text-sm font-black">
                  <span className="uppercase tracking-widest text-slate-950">Grand Total</span>
                  <span className="font-mono text-base text-slate-950">{dailyCollectionReportData.pdfGrandTotal.toLocaleString()}</span>
                </div>

                <div className="pt-4 flex justify-between items-center text-[10px] font-bold text-slate-600 border-t border-slate-300">
                  <span>
                    Print Date: {new Date().toLocaleDateString('en-GB')} {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span>User: {currentUser?.FullName || currentUser?.LoginName || 'ADMIN'}</span>
                </div>
              </div>
            ) : (
              /* VIEW 2: GRID-VIEW TABLE */
              <div className="flex-1 overflow-y-auto p-8 space-y-6 print:overflow-visible print:p-0 bg-white">
                <div className="text-center space-y-1">
                  <h1 className="text-base font-black tracking-wide text-slate-950 uppercase">{clinicSettings?.ClinicName || 'Punjab Homeopathic Clinic'}</h1>
                  <h2 className="text-sm font-bold text-slate-900">Daily Collection Report (Clinic & Store)</h2>
                  <div className="flex justify-center items-center space-x-4 text-xxs font-semibold text-slate-700 pt-1">
                    <span>From: <span className="font-bold underline">{formatReportDate(dailyCollectionReportData.startDate)}</span></span>
                    <span>To: <span className="font-bold underline">{formatReportDate(dailyCollectionReportData.endDate)}</span></span>
                  </div>
                </div>

                <div className="overflow-x-auto pt-2">
                  <table className="min-w-full border-collapse border border-slate-400 text-[10px]">
                    <thead>
                      <tr className="bg-white">
                        <th rowSpan={2} className="border border-slate-400 px-2 py-1.5 text-center font-bold text-slate-900 bg-slate-50">
                          Date
                        </th>
                        <th colSpan={6} className="border border-blue-500 px-2 py-1 text-center font-black text-blue-700 uppercase tracking-wide">
                          Morning
                        </th>
                        <th colSpan={6} className="border border-blue-500 px-2 py-1 text-center font-black text-blue-700 uppercase tracking-wide">
                          Evening
                        </th>
                        <th rowSpan={2} className="border border-slate-400 px-2 py-1.5 text-center font-bold text-slate-900 bg-slate-50">
                          Total
                        </th>
                      </tr>
                      <tr className="bg-slate-50 text-slate-700 font-bold">
                        <th className="border border-slate-400 px-1.5 py-1 text-center">App</th>
                        <th className="border border-slate-400 px-1.5 py-1 text-center">C.med</th>
                        <th className="border border-slate-400 px-1.5 py-1 text-center">Cards</th>
                        <th className="border border-slate-400 px-1.5 py-1 text-center">File</th>
                        <th className="border border-slate-400 px-1.5 py-1 text-center">Store</th>
                        <th className="border border-slate-400 px-1.5 py-1 text-center bg-blue-50 text-blue-900">Total</th>
                        <th className="border border-slate-400 px-1.5 py-1 text-center">App</th>
                        <th className="border border-slate-400 px-1.5 py-1 text-center">C.med</th>
                        <th className="border border-slate-400 px-1.5 py-1 text-center">Cards</th>
                        <th className="border border-slate-400 px-1.5 py-1 text-center">File</th>
                        <th className="border border-slate-400 px-1.5 py-1 text-center">Store</th>
                        <th className="border border-slate-400 px-1.5 py-1 text-center bg-blue-50 text-blue-900">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dailyCollectionReportData.rows.length === 0 ? (
                        <tr>
                          <td colSpan={14} className="border border-slate-400 px-4 py-8 text-center text-slate-400 font-bold italic">
                            No transaction records found.
                          </td>
                        </tr>
                      ) : (
                        dailyCollectionReportData.rows.map((row: any) => (
                          <tr key={row.date} className="hover:bg-slate-50 font-mono text-slate-800">
                            <td className="border border-slate-400 px-2 py-1 text-center font-sans font-bold">
                              {(() => {
                                const pts = row.date.split('-');
                                if (pts.length === 3) {
                                  return `${pts[2]}-${pts[1]}-${pts[0].substring(2)}`;
                                }
                                return row.date;
                              })()}
                            </td>
                            <td className="border border-slate-400 px-1.5 py-1 text-right">{row.morning.app || '-'}</td>
                            <td className="border border-slate-400 px-1.5 py-1 text-right">{row.morning.cmed || '-'}</td>
                            <td className="border border-slate-400 px-1.5 py-1 text-right">{row.morning.cards || '-'}</td>
                            <td className="border border-slate-400 px-1.5 py-1 text-right">{row.morning.file || '-'}</td>
                            <td className="border border-slate-400 px-1.5 py-1 text-right">{row.morning.store || '-'}</td>
                            <td className="border border-slate-400 px-1.5 py-1 text-right bg-blue-50/40 font-bold text-slate-950">{row.morning.total || '-'}</td>
                            <td className="border border-slate-400 px-1.5 py-1 text-right">{row.evening.app || '-'}</td>
                            <td className="border border-slate-400 px-1.5 py-1 text-right">{row.evening.cmed || '-'}</td>
                            <td className="border border-slate-400 px-1.5 py-1 text-right">{row.evening.cards || '-'}</td>
                            <td className="border border-slate-400 px-1.5 py-1 text-right">{row.evening.file || '-'}</td>
                            <td className="border border-slate-400 px-1.5 py-1 text-right">{row.evening.store || '-'}</td>
                            <td className="border border-slate-400 px-1.5 py-1 text-right bg-blue-50/40 font-bold text-slate-950">{row.evening.total || '-'}</td>
                            <td className="border border-slate-400 px-2 py-1 text-right font-sans font-black bg-slate-50 text-slate-950">
                              {row.dayTotal.toLocaleString()}
                            </td>
                          </tr>
                        ))
                      )}

                      {dailyCollectionReportData.rows.length > 0 && (
                        <tr className="bg-slate-50 font-sans font-extrabold text-slate-950 border-t-2 border-slate-900">
                          <td className="border border-slate-400 px-2 py-1.5 text-center uppercase tracking-wide text-[9px]">
                            Total
                          </td>
                          <td className="border border-slate-400 px-1.5 py-1.5 text-right font-mono text-[9px]">{dailyCollectionReportData.morningTotals.app || '-'}</td>
                          <td className="border border-slate-400 px-1.5 py-1.5 text-right font-mono text-[9px]">{dailyCollectionReportData.morningTotals.cmed || '-'}</td>
                          <td className="border border-slate-400 px-1.5 py-1.5 text-right font-mono text-[9px]">{dailyCollectionReportData.morningTotals.cards || '-'}</td>
                          <td className="border border-slate-400 px-1.5 py-1.5 text-right font-mono text-[9px]">{dailyCollectionReportData.morningTotals.file || '-'}</td>
                          <td className="border border-slate-400 px-1.5 py-1.5 text-right font-mono text-[9px]">{dailyCollectionReportData.morningTotals.store || '-'}</td>
                          <td className="border border-slate-400 px-1.5 py-1.5 text-right font-mono text-[9px] bg-blue-50 text-blue-900">{dailyCollectionReportData.morningTotals.total || '-'}</td>
                          <td className="border border-slate-400 px-1.5 py-1.5 text-right font-mono text-[9px]">{dailyCollectionReportData.eveningTotals.app || '-'}</td>
                          <td className="border border-slate-400 px-1.5 py-1.5 text-right font-mono text-[9px]">{dailyCollectionReportData.eveningTotals.cmed || '-'}</td>
                          <td className="border border-slate-400 px-1.5 py-1.5 text-right font-mono text-[9px]">{dailyCollectionReportData.eveningTotals.cards || '-'}</td>
                          <td className="border border-slate-400 px-1.5 py-1.5 text-right font-mono text-[9px]">{dailyCollectionReportData.eveningTotals.file || '-'}</td>
                          <td className="border border-slate-400 px-1.5 py-1.5 text-right font-mono text-[9px]">{dailyCollectionReportData.eveningTotals.store || '-'}</td>
                          <td className="border border-slate-400 px-1.5 py-1.5 text-right font-mono text-[9px] bg-blue-50 text-blue-900">{dailyCollectionReportData.eveningTotals.total || '-'}</td>
                          <td className="border border-slate-400 px-2 py-1.5 text-right font-sans font-black bg-blue-100 text-blue-950 text-[9.5px]">
                            {dailyCollectionReportData.grandTotals.total.toLocaleString()}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="grid grid-cols-2 gap-8 pt-4 bg-white">
                  <div className="space-y-2">
                    <h3 className="text-xxs font-black uppercase text-slate-900 tracking-wider">Summary 1</h3>
                    <table className="min-w-full border border-slate-400 text-xxs text-left">
                      <thead>
                        <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-400">
                          <th className="border border-slate-400 px-3 py-1.5">Category</th>
                          <th className="border border-slate-400 px-3 py-1.5 text-right">Morning</th>
                          <th className="border border-slate-400 px-3 py-1.5 text-right">Evening</th>
                          <th className="border border-slate-400 px-3 py-1.5 text-right bg-slate-50">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-300 font-mono text-slate-800">
                        <tr>
                          <td className="border border-slate-400 px-3 py-1.5 font-sans font-bold">App</td>
                          <td className="border border-slate-400 px-3 py-1.5 text-right">{dailyCollectionReportData.morningTotals.app || '-'}</td>
                          <td className="border border-slate-400 px-3 py-1.5 text-right">{dailyCollectionReportData.eveningTotals.app || '-'}</td>
                          <td className="border border-slate-400 px-3 py-1.5 text-right font-sans font-extrabold bg-slate-50">{dailyCollectionReportData.grandTotals.app || '-'}</td>
                        </tr>
                        <tr>
                          <td className="border border-slate-400 px-3 py-1.5 font-sans font-bold">C.med</td>
                          <td className="border border-slate-400 px-3 py-1.5 text-right">{dailyCollectionReportData.morningTotals.cmed || '-'}</td>
                          <td className="border border-slate-400 px-3 py-1.5 text-right">{dailyCollectionReportData.eveningTotals.cmed || '-'}</td>
                          <td className="border border-slate-400 px-3 py-1.5 text-right font-sans font-extrabold bg-slate-50">{dailyCollectionReportData.grandTotals.cmed || '-'}</td>
                        </tr>
                        <tr>
                          <td className="border border-slate-400 px-3 py-1.5 font-sans font-bold">Cards</td>
                          <td className="border border-slate-400 px-3 py-1.5 text-right">{dailyCollectionReportData.morningTotals.cards || '-'}</td>
                          <td className="border border-slate-400 px-3 py-1.5 text-right">{dailyCollectionReportData.eveningTotals.cards || '-'}</td>
                          <td className="border border-slate-400 px-3 py-1.5 text-right font-sans font-extrabold bg-slate-50">{dailyCollectionReportData.grandTotals.cards || '-'}</td>
                        </tr>
                        <tr>
                          <td className="border border-slate-400 px-3 py-1.5 font-sans font-bold">File</td>
                          <td className="border border-slate-400 px-3 py-1.5 text-right">{dailyCollectionReportData.morningTotals.file || '-'}</td>
                          <td className="border border-slate-400 px-3 py-1.5 text-right">{dailyCollectionReportData.eveningTotals.file || '-'}</td>
                          <td className="border border-slate-400 px-3 py-1.5 text-right font-sans font-extrabold bg-slate-50">{dailyCollectionReportData.grandTotals.file || '-'}</td>
                        </tr>
                        <tr>
                          <td className="border border-slate-400 px-3 py-1.5 font-sans font-bold">Store</td>
                          <td className="border border-slate-400 px-3 py-1.5 text-right">{dailyCollectionReportData.morningTotals.store || '-'}</td>
                          <td className="border border-slate-400 px-3 py-1.5 text-right">{dailyCollectionReportData.eveningTotals.store || '-'}</td>
                          <td className="border border-slate-400 px-3 py-1.5 text-right font-sans font-extrabold bg-slate-50">{dailyCollectionReportData.grandTotals.store || '-'}</td>
                        </tr>
                        <tr className="bg-slate-50 font-sans font-black border-t border-slate-900 text-slate-950">
                          <td className="border border-slate-400 px-3 py-1.5 uppercase">Total</td>
                          <td className="border border-slate-400 px-3 py-1.5 text-right font-mono">{dailyCollectionReportData.morningTotals.total || '-'}</td>
                          <td className="border border-slate-400 px-3 py-1.5 text-right font-mono">{dailyCollectionReportData.eveningTotals.total || '-'}</td>
                          <td className="border border-slate-400 px-3 py-1.5 text-right font-mono bg-blue-50 text-blue-900">{dailyCollectionReportData.grandTotals.total || '-'}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-xxs font-black uppercase text-slate-900 tracking-wider">Summary 2</h3>
                    <table className="min-w-full border border-slate-400 text-xxs text-left">
                      <thead>
                        <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-400">
                          <th className="border border-slate-400 px-3 py-1.5">Grouping</th>
                          <th className="border border-slate-400 px-3 py-1.5 text-right">Morning</th>
                          <th className="border border-slate-400 px-3 py-1.5 text-right">Evening</th>
                          <th className="border border-slate-400 px-3 py-1.5 text-right bg-slate-50">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-300 font-mono text-slate-800">
                        <tr>
                          <td className="border border-slate-400 px-3 py-1.5 font-sans font-bold">App & C.med</td>
                          <td className="border border-slate-400 px-3 py-1.5 text-right">{(dailyCollectionReportData.morningTotals.app + dailyCollectionReportData.morningTotals.cmed) || '-'}</td>
                          <td className="border border-slate-400 px-3 py-1.5 text-right">{(dailyCollectionReportData.eveningTotals.app + dailyCollectionReportData.eveningTotals.cmed) || '-'}</td>
                          <td className="border border-slate-400 px-3 py-1.5 text-right font-sans font-extrabold bg-slate-50">{(dailyCollectionReportData.grandTotals.app + dailyCollectionReportData.grandTotals.cmed) || '-'}</td>
                        </tr>
                        <tr>
                          <td className="border border-slate-400 px-3 py-1.5 font-sans font-bold">Cards & File</td>
                          <td className="border border-slate-400 px-3 py-1.5 text-right">{(dailyCollectionReportData.morningTotals.cards + dailyCollectionReportData.morningTotals.file) || '-'}</td>
                          <td className="border border-slate-400 px-3 py-1.5 text-right">{(dailyCollectionReportData.eveningTotals.cards + dailyCollectionReportData.eveningTotals.file) || '-'}</td>
                          <td className="border border-slate-400 px-3 py-1.5 text-right font-sans font-extrabold bg-slate-50">{(dailyCollectionReportData.grandTotals.cards + dailyCollectionReportData.grandTotals.file) || '-'}</td>
                        </tr>
                        <tr>
                          <td className="border border-slate-400 px-3 py-1.5 font-sans font-bold">Store</td>
                          <td className="border border-slate-400 px-3 py-1.5 text-right">{dailyCollectionReportData.morningTotals.store || '-'}</td>
                          <td className="border border-slate-400 px-3 py-1.5 text-right">{dailyCollectionReportData.eveningTotals.store || '-'}</td>
                          <td className="border border-slate-400 px-3 py-1.5 text-right font-sans font-extrabold bg-slate-50">{dailyCollectionReportData.grandTotals.store || '-'}</td>
                        </tr>
                        <tr className="bg-slate-50 font-sans font-black border-t border-slate-900 text-slate-950">
                          <td className="border border-slate-400 px-3 py-1.5 uppercase">Total</td>
                          <td className="border border-slate-400 px-3 py-1.5 text-right font-mono">{dailyCollectionReportData.morningTotals.total || '-'}</td>
                          <td className="border border-slate-400 px-3 py-1.5 text-right font-mono">{dailyCollectionReportData.eveningTotals.total || '-'}</td>
                          <td className="border border-slate-400 px-3 py-1.5 text-right font-mono bg-blue-50 text-blue-900">{dailyCollectionReportData.grandTotals.total || '-'}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-8 pt-12 mt-12 text-center text-[9px] font-black uppercase tracking-wider text-slate-500">
                  <div className="border-t border-slate-300 pt-2">
                    <p>PREPARED BY (ACCOUNTANT)</p>
                  </div>
                  <div className="border-t border-slate-300 pt-2">
                    <p>AUDITED BY</p>
                  </div>
                  <div className="border-t border-slate-300 pt-2">
                    <p>APPROVED BY</p>
                  </div>
                </div>

              </div>
            )}
          </div>
        </div>
      )}

      {/* COMPREHENSIVE PRINT DETAIL REPORT MODAL */}
      {isDetailReportModalOpen && (() => {
        // Prepare list of detail items
        const rawList = (filteredPatients || []).map((pt) => {
          let pVisits = (visits || []).filter(v => isSamePatient(v.PatientID, pt.PatientID));
          if (gridViewStartDate || gridViewEndDate) {
            pVisits = pVisits.filter(v => {
              const d = parseDateToISOKey(v.VisitDate || (v as any).date);
              if (gridViewStartDate && d < gridViewStartDate) return false;
              if (gridViewEndDate && d > gridViewEndDate) return false;
              return true;
            });
          }

          let pApps = (appointments || []).filter(a => isSamePatient(a.PatientID, pt.PatientID) && a.Status !== 3);
          if (gridViewStartDate || gridViewEndDate) {
            pApps = pApps.filter(a => {
              const d = parseDateToISOKey(a.AppointmentDate);
              if (gridViewStartDate && d < gridViewStartDate) return false;
              if (gridViewEndDate && d > gridViewEndDate) return false;
              return true;
            });
          }

          let pInvoices = (invoices || []).filter(inv => isSamePatient(inv.PatientID, pt.PatientID) && (inv.Status as number) !== 3);
          if (gridViewStartDate || gridViewEndDate) {
            pInvoices = pInvoices.filter(inv => {
              const d = parseDateToISOKey(inv.InvoiceDate);
              if (gridViewStartDate && d < gridViewStartDate) return false;
              if (gridViewEndDate && d > gridViewEndDate) return false;
              return true;
            });
          }

          // Compute fees
          let appOpdFee = pApps.reduce((sum, a) => sum + (Number(a.FeeCharged) || 0), 0);
          pVisits.forEach(v => {
            let vFee = Number(v.ConsultationFee) || 0;
            if (!vFee && v.VisitRemarks) {
              const oMatch = v.VisitRemarks.match(/OPD Fee PKR\s*(\d+)/i) || v.VisitRemarks.match(/Consultation Fee PKR\s*(\d+)/i) || v.VisitRemarks.match(/OPD PKR\s*(\d+)/i);
              if (oMatch) vFee = Number(oMatch[1]);
            }
            const hasAppFee = pApps.some(a => a.AppointmentDate === v.VisitDate && (Number(a.FeeCharged) || 0) > 0);
            if (!hasAppFee && vFee > 0) appOpdFee += vFee;
          });

          let clinMedsFee = 0;
          let fileFee = 0;
          let cardFee = 0;
          pVisits.forEach(v => {
            let clin = Number(v.ClinicalMedicinePayment) || 0;
            let f = Number(v.FileFee) || 0;
            let c = Number(v.CardFee) || Number(v.CardsPayment) || 0;
            if (v.VisitRemarks) {
              if (!clin) { const cPkr = v.VisitRemarks.match(/Clinical Meds PKR\s*(\d+)/); if (cPkr) clin = Number(cPkr[1]); }
              if (!f) { const fPkr = v.VisitRemarks.match(/File PKR\s*(\d+)/); if (fPkr) f = Number(fPkr[1]); }
              if (!c) { const kPkr = v.VisitRemarks.match(/Card PKR\s*(\d+)/); if (kPkr) c = Number(kPkr[1]); }
            }
            clinMedsFee += clin;
            fileFee += f;
            cardFee += c;
          });

          const storeMedsFee = pInvoices.reduce((sum, inv) => sum + (Number(inv.NetAmount) || 0), 0);
          const totalFee = appOpdFee + clinMedsFee + fileFee + cardFee + storeMedsFee;

          // Determine Shift
          let shiftNum = 1;
          if (pVisits.length > 0) {
            const v = pVisits[pVisits.length - 1];
            shiftNum = v.Shift || (v.VisitRemarks?.includes('Shift 2') || v.VisitRemarks?.includes('Evening') ? 2 : v.VisitRemarks?.includes('Shift 3') || v.VisitRemarks?.includes('Night') ? 3 : 1);
          } else if (pApps.length > 0) {
            shiftNum = pApps[0].Shift || 1;
          }

          const visitDateStr = pVisits.length > 0 ? pVisits[pVisits.length - 1].VisitDate : pt.RegistrationDate || '-';
          const tokenNum = pVisits.length > 0 ? (pVisits[pVisits.length - 1].TokenNo || '-') : '-';

          return {
            patient: pt,
            visitDateStr,
            tokenNum,
            shiftNum,
            shiftLabel: shiftNum === 1 ? 'Morning' : shiftNum === 2 ? 'Evening' : 'Night',
            appOpdFee,
            fileFee,
            cardFee,
            fileCardFee: fileFee + cardFee,
            clinMedsFee,
            storeMedsFee,
            totalFee
          };
        });

        // Filter by shift if detailReportShiftFilter > 0
        let detailList = rawList;
        if (detailReportShiftFilter > 0) {
          detailList = detailList.filter(item => item.shiftNum === detailReportShiftFilter);
        }

        // Filter by detailReportSearch if typed
        if (detailReportSearch.trim()) {
          const q = detailReportSearch.toLowerCase().trim();
          detailList = detailList.filter(item =>
            item.patient.PatientName.toLowerCase().includes(q) ||
            item.patient.PatientID.toLowerCase().includes(q) ||
            (item.patient.PhoneMobile && item.patient.PhoneMobile.includes(q)) ||
            String(item.tokenNum).includes(q)
          );
        }

        // Shift Summaries
        const morningList = detailList.filter(i => i.shiftNum === 1);
        const eveningList = detailList.filter(i => i.shiftNum === 2);
        const nightList = detailList.filter(i => i.shiftNum === 3);

        const getListTotals = (list: typeof detailList) => {
          return {
            count: list.length,
            opd: list.reduce((s, i) => s + i.appOpdFee, 0),
            fileCard: list.reduce((s, i) => s + i.fileCardFee, 0),
            clinMeds: list.reduce((s, i) => s + i.clinMedsFee, 0),
            storeMeds: list.reduce((s, i) => s + i.storeMedsFee, 0),
            grandTotal: list.reduce((s, i) => s + i.totalFee, 0)
          };
        };

        const morningTotals = getListTotals(morningList);
        const eveningTotals = getListTotals(eveningList);
        const nightTotals = getListTotals(nightList);
        const overallTotals = getListTotals(detailList);

        // Printing helper
        const printDetailReport = () => {
          const printWin = window.open('', '_blank');
          if (!printWin) return;

          let reportTitle = 'DAILY COLLECTION REPORT (PATIENT WISE)';
          if (detailReportMode === 'shift_wise') reportTitle = 'DAILY COLLECTION REPORT (SHIFT WISE)';
          if (detailReportMode === 'hybrid') reportTitle = 'DAILY COLLECTION REPORT (PATIENT WISE & SHIFT WISE TOTAL)';

          let shiftFilterText = detailReportShiftFilter === 1 ? 'Morning Shift' : detailReportShiftFilter === 2 ? 'Evening Shift' : detailReportShiftFilter === 3 ? 'Night Shift' : 'All Shifts';
          let dateRangeText = gridViewStartDate && gridViewEndDate ? `${gridViewStartDate} to ${gridViewEndDate}` : gridViewStartDate || gridViewEndDate || 'All Time Records';

          let bodyContentHtml = '';

          if (detailReportMode === 'patient_wise') {
            bodyContentHtml = `
              <table>
                <thead>
                  <tr>
                    <th>Sr #</th>
                    <th>Patient ID</th>
                    <th>Patient Name</th>
                    <th>Token / Date</th>
                    <th>Shift</th>
                    <th style="text-align: right;">OPD Fee</th>
                    <th style="text-align: right;">File & Card</th>
                    <th style="text-align: right;">Clinical Meds</th>
                    <th style="text-align: right;">Store Meds</th>
                    <th style="text-align: right;">Total (PKR)</th>
                  </tr>
                </thead>
                <tbody>
                  ${detailList.map((item, idx) => `
                    <tr>
                      <td style="text-align: center;">${idx + 1}</td>
                      <td><strong>${item.patient.PatientID}</strong></td>
                      <td>${item.patient.PatientName}</td>
                      <td>${item.visitDateStr} (Tok #${item.tokenNum})</td>
                      <td>${item.shiftLabel}</td>
                      <td style="text-align: right;">${item.appOpdFee.toLocaleString()}</td>
                      <td style="text-align: right;">${item.fileCardFee.toLocaleString()}</td>
                      <td style="text-align: right;">${item.clinMedsFee.toLocaleString()}</td>
                      <td style="text-align: right;">${item.storeMedsFee.toLocaleString()}</td>
                      <td style="text-align: right; font-weight: bold;">PKR ${item.totalFee.toLocaleString()}</td>
                    </tr>
                  `).join('')}
                </tbody>
                <tfoot>
                  <tr>
                    <td colspan="5" style="text-align: right; font-weight: bold;">TOTAL (${detailList.length} Patients):</td>
                    <td style="text-align: right; font-weight: bold;">PKR ${overallTotals.opd.toLocaleString()}</td>
                    <td style="text-align: right; font-weight: bold;">PKR ${overallTotals.fileCard.toLocaleString()}</td>
                    <td style="text-align: right; font-weight: bold;">PKR ${overallTotals.clinMeds.toLocaleString()}</td>
                    <td style="text-align: right; font-weight: bold;">PKR ${overallTotals.storeMeds.toLocaleString()}</td>
                    <td style="text-align: right; font-weight: 900; font-size: 13px;">PKR ${overallTotals.grandTotal.toLocaleString()}</td>
                  </tr>
                </tfoot>
              </table>
            `;
          } else if (detailReportMode === 'shift_wise') {
            bodyContentHtml = `
              <table>
                <thead>
                  <tr>
                    <th>Shift Name</th>
                    <th style="text-align: center;">Patients Count</th>
                    <th style="text-align: right;">OPD Revenue</th>
                    <th style="text-align: right;">File & Card</th>
                    <th style="text-align: right;">Clinical Meds</th>
                    <th style="text-align: right;">Store Meds</th>
                    <th style="text-align: right;">Shift Collection (PKR)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>🌅 MORNING SHIFT</strong></td>
                    <td style="text-align: center;">${morningTotals.count}</td>
                    <td style="text-align: right;">PKR ${morningTotals.opd.toLocaleString()}</td>
                    <td style="text-align: right;">PKR ${morningTotals.fileCard.toLocaleString()}</td>
                    <td style="text-align: right;">PKR ${morningTotals.clinMeds.toLocaleString()}</td>
                    <td style="text-align: right;">PKR ${morningTotals.storeMeds.toLocaleString()}</td>
                    <td style="text-align: right; font-weight: bold; color: #1e1b4b;">PKR ${morningTotals.grandTotal.toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td><strong>🌆 EVENING SHIFT</strong></td>
                    <td style="text-align: center;">${eveningTotals.count}</td>
                    <td style="text-align: right;">PKR ${eveningTotals.opd.toLocaleString()}</td>
                    <td style="text-align: right;">PKR ${eveningTotals.fileCard.toLocaleString()}</td>
                    <td style="text-align: right;">PKR ${eveningTotals.clinMeds.toLocaleString()}</td>
                    <td style="text-align: right;">PKR ${eveningTotals.storeMeds.toLocaleString()}</td>
                    <td style="text-align: right; font-weight: bold; color: #1e1b4b;">PKR ${eveningTotals.grandTotal.toLocaleString()}</td>
                  </tr>
                  ${nightTotals.count > 0 ? `
                  <tr>
                    <td><strong>🌃 NIGHT SHIFT</strong></td>
                    <td style="text-align: center;">${nightTotals.count}</td>
                    <td style="text-align: right;">PKR ${nightTotals.opd.toLocaleString()}</td>
                    <td style="text-align: right;">PKR ${nightTotals.fileCard.toLocaleString()}</td>
                    <td style="text-align: right;">PKR ${nightTotals.clinMeds.toLocaleString()}</td>
                    <td style="text-align: right;">PKR ${nightTotals.storeMeds.toLocaleString()}</td>
                    <td style="text-align: right; font-weight: bold; color: #1e1b4b;">PKR ${nightTotals.grandTotal.toLocaleString()}</td>
                  </tr>
                  ` : ''}
                </tbody>
                <tfoot>
                  <tr>
                    <td><strong>COMBINED TOTALS:</strong></td>
                    <td style="text-align: center; font-weight: bold;">${overallTotals.count}</td>
                    <td style="text-align: right; font-weight: bold;">PKR ${overallTotals.opd.toLocaleString()}</td>
                    <td style="text-align: right; font-weight: bold;">PKR ${overallTotals.fileCard.toLocaleString()}</td>
                    <td style="text-align: right; font-weight: bold;">PKR ${overallTotals.clinMeds.toLocaleString()}</td>
                    <td style="text-align: right; font-weight: bold;">PKR ${overallTotals.storeMeds.toLocaleString()}</td>
                    <td style="text-align: right; font-weight: 900; font-size: 14px; color: #065f46;">PKR ${overallTotals.grandTotal.toLocaleString()}</td>
                  </tr>
                </tfoot>
              </table>
            `;
          } else if (detailReportMode === 'hybrid') {
            const renderShiftTable = (title: string, list: typeof detailList, totals: typeof morningTotals) => `
              <h3 style="margin-top: 20px; margin-bottom: 6px; font-size: 13px; text-transform: uppercase; color: #1e293b; border-bottom: 2px solid #0f172a; padding-bottom: 4px;">
                ${title} (${totals.count} Patients)
              </h3>
              <table>
                <thead>
                  <tr>
                    <th>Sr #</th>
                    <th>Patient ID</th>
                    <th>Patient Name</th>
                    <th>Token / Date</th>
                    <th style="text-align: right;">OPD Fee</th>
                    <th style="text-align: right;">File/Card</th>
                    <th style="text-align: right;">Clinical Meds</th>
                    <th style="text-align: right;">Store Meds</th>
                    <th style="text-align: right;">Total (PKR)</th>
                  </tr>
                </thead>
                <tbody>
                  ${list.map((item, idx) => `
                    <tr>
                      <td style="text-align: center;">${idx + 1}</td>
                      <td><strong>${item.patient.PatientID}</strong></td>
                      <td>${item.patient.PatientName}</td>
                      <td>${item.visitDateStr} (Tok #${item.tokenNum})</td>
                      <td style="text-align: right;">${item.appOpdFee.toLocaleString()}</td>
                      <td style="text-align: right;">${item.fileCardFee.toLocaleString()}</td>
                      <td style="text-align: right;">${item.clinMedsFee.toLocaleString()}</td>
                      <td style="text-align: right;">${item.storeMedsFee.toLocaleString()}</td>
                      <td style="text-align: right; font-weight: bold;">PKR ${item.totalFee.toLocaleString()}</td>
                    </tr>
                  `).join('')}
                </tbody>
                <tfoot>
                  <tr>
                    <td colspan="4" style="text-align: right; font-weight: bold;">${title} SUBTOTAL:</td>
                    <td style="text-align: right; font-weight: bold;">PKR ${totals.opd.toLocaleString()}</td>
                    <td style="text-align: right; font-weight: bold;">PKR ${totals.fileCard.toLocaleString()}</td>
                    <td style="text-align: right; font-weight: bold;">PKR ${totals.clinMeds.toLocaleString()}</td>
                    <td style="text-align: right; font-weight: bold;">PKR ${totals.storeMeds.toLocaleString()}</td>
                    <td style="text-align: right; font-weight: 900; font-size: 12px; color: #1e1b4b;">PKR ${totals.grandTotal.toLocaleString()}</td>
                  </tr>
                </tfoot>
              </table>
            `;

            bodyContentHtml = `
              ${morningList.length > 0 ? renderShiftTable('🌅 Morning Shift', morningList, morningTotals) : ''}
              ${eveningList.length > 0 ? renderShiftTable('🌆 Evening Shift', eveningList, eveningTotals) : ''}
              ${nightList.length > 0 ? renderShiftTable('🌃 Night Shift', nightList, nightTotals) : ''}

              <div style="margin-top: 24px; padding: 12px; background: #f8fafc; border: 2px solid #334155; border-radius: 8px;">
                <h3 style="margin: 0 0 8px 0; font-size: 14px; text-transform: uppercase;">DAILY GRAND TOTAL SUMMARY (ALL SHIFTS COMBINED)</h3>
                <table style="margin-top: 0;">
                  <thead>
                    <tr>
                      <th>Shift</th>
                      <th style="text-align: center;">Patients</th>
                      <th style="text-align: right;">OPD Total</th>
                      <th style="text-align: right;">File & Card</th>
                      <th style="text-align: right;">Clinical Meds</th>
                      <th style="text-align: right;">Store Meds</th>
                      <th style="text-align: right;">Grand Net Collection</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Morning Shift</td>
                      <td style="text-align: center;">${morningTotals.count}</td>
                      <td style="text-align: right;">PKR ${morningTotals.opd.toLocaleString()}</td>
                      <td style="text-align: right;">PKR ${morningTotals.fileCard.toLocaleString()}</td>
                      <td style="text-align: right;">PKR ${morningTotals.clinMeds.toLocaleString()}</td>
                      <td style="text-align: right;">PKR ${morningTotals.storeMeds.toLocaleString()}</td>
                      <td style="text-align: right; font-weight: bold;">PKR ${morningTotals.grandTotal.toLocaleString()}</td>
                    </tr>
                    <tr>
                      <td>Evening Shift</td>
                      <td style="text-align: center;">${eveningTotals.count}</td>
                      <td style="text-align: right;">PKR ${eveningTotals.opd.toLocaleString()}</td>
                      <td style="text-align: right;">PKR ${eveningTotals.fileCard.toLocaleString()}</td>
                      <td style="text-align: right;">PKR ${eveningTotals.clinMeds.toLocaleString()}</td>
                      <td style="text-align: right;">PKR ${eveningTotals.storeMeds.toLocaleString()}</td>
                      <td style="text-align: right; font-weight: bold;">PKR ${eveningTotals.grandTotal.toLocaleString()}</td>
                    </tr>
                    ${nightTotals.count > 0 ? `
                    <tr>
                      <td>Night Shift</td>
                      <td style="text-align: center;">${nightTotals.count}</td>
                      <td style="text-align: right;">PKR ${nightTotals.opd.toLocaleString()}</td>
                      <td style="text-align: right;">PKR ${nightTotals.fileCard.toLocaleString()}</td>
                      <td style="text-align: right;">PKR ${nightTotals.clinMeds.toLocaleString()}</td>
                      <td style="text-align: right;">PKR ${nightTotals.storeMeds.toLocaleString()}</td>
                      <td style="text-align: right; font-weight: bold;">PKR ${nightTotals.grandTotal.toLocaleString()}</td>
                    </tr>
                    ` : ''}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td style="font-weight: bold;">ALL SHIFTS TOTAL</td>
                      <td style="text-align: center; font-weight: bold;">${overallTotals.count}</td>
                      <td style="text-align: right; font-weight: bold;">PKR ${overallTotals.opd.toLocaleString()}</td>
                      <td style="text-align: right; font-weight: bold;">PKR ${overallTotals.fileCard.toLocaleString()}</td>
                      <td style="text-align: right; font-weight: bold;">PKR ${overallTotals.clinMeds.toLocaleString()}</td>
                      <td style="text-align: right; font-weight: bold;">PKR ${overallTotals.storeMeds.toLocaleString()}</td>
                      <td style="text-align: right; font-weight: 900; font-size: 15px; color: #047857;">PKR ${overallTotals.grandTotal.toLocaleString()}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            `;
          }

          printWin.document.write(`
            <html>
              <head>
                <title>Punjab Clinic - Comprehensive Detailed Collection Report</title>
                <style>
                  @page {
                    size: A4 portrait;
                    margin: 10mm 8mm 10mm 8mm;
                  }
                  *, *::before, *::after {
                    box-sizing: border-box;
                  }
                  html, body {
                    width: 100%;
                    height: 100%;
                    margin: 0;
                    padding: 0;
                    background: #ffffff !important;
                    color: #0f172a !important;
                    font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                    font-size: 10px;
                    line-height: 1.35;
                    -webkit-print-color-adjust: exact;
                    print-color-adjust: exact;
                  }
                  /* Hide non-essential UI elements like scrollbars, action controls */
                  button, input, select, .no-print, ::-webkit-scrollbar {
                    display: none !important;
                  }
                  body {
                    padding: 12px 16px;
                  }
                  .report-container {
                    width: 100%;
                  }
                  .clinic-title {
                    font-size: 16px;
                    font-weight: 900;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    color: #0f172a;
                    margin: 0 0 4px 0;
                  }
                  .meta-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-end;
                    margin-bottom: 12px;
                    padding-bottom: 8px;
                    border-bottom: 2px solid #0f172a;
                  }
                  .meta-header p {
                    margin: 2px 0;
                    color: #334155;
                    font-weight: 600;
                    font-size: 10px;
                  }
                  .report-subtitle {
                    font-size: 12px;
                    font-weight: 800;
                    color: #1e1b4b;
                    text-transform: uppercase;
                  }
                  table {
                    width: 100%;
                    border-collapse: collapse !important;
                    margin-top: 8px;
                    margin-bottom: 14px;
                    page-break-inside: auto;
                  }
                  tr {
                    page-break-inside: avoid;
                    page-break-after: auto;
                  }
                  thead {
                    display: table-header-group;
                  }
                  tfoot {
                    display: table-footer-group;
                  }
                  th, td {
                    border: 1px solid #94a3b8 !important;
                    padding: 4px 6px !important;
                    text-align: left;
                    font-size: 9.5px;
                  }
                  th {
                    background-color: #1e293b !important;
                    color: #ffffff !important;
                    font-size: 9px;
                    text-transform: uppercase;
                    letter-spacing: 0.3px;
                    font-weight: 800;
                  }
                  tfoot td {
                    background-color: #f1f5f9 !important;
                    font-weight: bold !important;
                    font-size: 10px !important;
                  }
                  h3 {
                    page-break-after: avoid;
                  }
                  .footer-signatures {
                    display: flex;
                    justify-content: space-between;
                    margin-top: 36px;
                    padding-top: 10px;
                    border-top: 1.5px solid #475569;
                    font-weight: bold;
                    font-size: 9.5px;
                    color: #334155;
                    text-transform: uppercase;
                    page-break-inside: avoid;
                  }
                  @media print {
                    body {
                      padding: 0;
                    }
                    .page-break {
                      page-break-before: always;
                    }
                  }
                </style>
              </head>
              <body>
                <div class="report-container">
                  <h1 class="clinic-title">PUNJAB CLINIC & PHARMACY</h1>
                  <div class="meta-header">
                    <div>
                      <div class="report-subtitle">${reportTitle}</div>
                      <p>Period Range: <strong>${dateRangeText}</strong> | Filter Shift: <strong>${shiftFilterText}</strong></p>
                    </div>
                    <div style="text-align: right;">
                      <p>Printed On: <strong>${new Date().toLocaleString()}</strong></p>
                      <p>Total Patients Included: <strong>${overallTotals.count}</strong></p>
                    </div>
                  </div>

                  ${bodyContentHtml}

                  <div class="footer-signatures">
                    <div>PREPARED BY (ACCOUNTANT)</div>
                    <div>VERIFIED BY (MANAGER)</div>
                    <div>DOCTOR / CLINIC STAMP</div>
                  </div>
                </div>
              </body>
            </html>
          `);
          printWin.document.close();
          printWin.focus();
          setTimeout(() => printWin.print(), 500);
        };

        return (
          <div className="fixed inset-0 bg-slate-900/75 backdrop-blur-xs flex items-center justify-center z-50 p-3 sm:p-6 overflow-y-auto animate-fadeIn">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-6xl w-full flex flex-col max-h-[92vh] overflow-hidden">
              {/* Modal Header */}
              <div className="bg-slate-900 text-white p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 shrink-0">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-md">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-black uppercase tracking-wide flex items-center gap-2">
                      <span>Punjab Clinic Detailed Collection Report</span>
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 font-mono">
                        {gridViewStartDate && gridViewEndDate
                          ? `${gridViewStartDate} to ${gridViewEndDate}`
                          : gridViewStartDate || gridViewEndDate || 'All Dates Record'}
                      </span>
                    </h2>
                    <p className="text-xs text-slate-300 font-medium">
                      Detailed reporting with Patient Wise, Shift Wise, and Combined Shift Totals.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setIsDetailReportModalOpen(false)}
                  className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Mode Tabs & Controls Header */}
              <div className="bg-slate-100 p-3 sm:p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
                {/* Report Style Tabs */}
                <div className="flex flex-wrap items-center bg-slate-200/80 p-1 rounded-xl gap-1">
                  <button
                    onClick={() => setDetailReportMode('patient_wise')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition cursor-pointer flex items-center space-x-1.5 ${
                      detailReportMode === 'patient_wise'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-700 hover:bg-slate-300/60'
                    }`}
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>Daily Collection Report (Patient Wise)</span>
                  </button>
                  <button
                    onClick={() => setDetailReportMode('shift_wise')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition cursor-pointer flex items-center space-x-1.5 ${
                      detailReportMode === 'shift_wise'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-700 hover:bg-slate-300/60'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>Daily Collection Report (Shift Wise)</span>
                  </button>
                  <button
                    onClick={() => setDetailReportMode('hybrid')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition cursor-pointer flex items-center space-x-1.5 ${
                      detailReportMode === 'hybrid'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-700 hover:bg-slate-300/60'
                    }`}
                  >
                    <Grid className="w-3.5 h-3.5" />
                    <span>Patient Wise & Shift Wise Total</span>
                  </button>
                </div>

                {/* Filters & Actions */}
                <div className="flex items-center space-x-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                    <input
                      type="text"
                      placeholder=""
                      value={detailReportSearch}
                      onChange={(e) => setDetailReportSearch(e.target.value)}
                      className="text-xs bg-white border border-slate-300 rounded-lg pl-8 pr-2.5 py-1.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium w-44"
                    />
                  </div>

                  {/* Shift Selector */}
                  <select
                    value={detailReportShiftFilter}
                    onChange={(e) => setDetailReportShiftFilter(Number(e.target.value))}
                    className="bg-white border border-slate-300 text-slate-800 text-xs font-bold rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer shadow-2xs"
                  >
                    <option value={0}>All Shifts</option>
                    <option value={1}>🌅 Morning Shift (1)</option>
                    <option value={2}>🌆 Evening Shift (2)</option>
                    <option value={3}>🌃 Night Shift (3)</option>
                  </select>

                  {/* Print Button */}
                  <button
                    onClick={printDetailReport}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition flex items-center space-x-1.5 shadow-xs cursor-pointer"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Print Report</span>
                  </button>
                </div>
              </div>

              {/* Summary Cards */}
              <div className="p-4 bg-indigo-950 text-white border-b border-indigo-900 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs shrink-0">
                <div className="bg-indigo-900/60 p-2.5 rounded-xl border border-indigo-700/50">
                  <span className="text-[10px] font-extrabold uppercase text-indigo-300 block">Total Patients</span>
                  <span className="text-base font-black font-mono text-white">{overallTotals.count}</span>
                </div>
                <div className="bg-indigo-900/60 p-2.5 rounded-xl border border-indigo-700/50">
                  <span className="text-[10px] font-extrabold uppercase text-indigo-300 block">OPD Fees</span>
                  <span className="text-base font-black font-mono text-emerald-300">PKR {overallTotals.opd.toLocaleString()}</span>
                </div>
                <div className="bg-indigo-900/60 p-2.5 rounded-xl border border-indigo-700/50">
                  <span className="text-[10px] font-extrabold uppercase text-indigo-300 block">File & Cards</span>
                  <span className="text-base font-black font-mono text-cyan-300">PKR {overallTotals.fileCard.toLocaleString()}</span>
                </div>
                <div className="bg-indigo-900/60 p-2.5 rounded-xl border border-indigo-700/50">
                  <span className="text-[10px] font-extrabold uppercase text-indigo-300 block">Clinical Meds</span>
                  <span className="text-base font-black font-mono text-purple-300">PKR {overallTotals.clinMeds.toLocaleString()}</span>
                </div>
                <div className="bg-indigo-900/60 p-2.5 rounded-xl border border-indigo-700/50">
                  <span className="text-[10px] font-extrabold uppercase text-indigo-300 block">Store Meds</span>
                  <span className="text-base font-black font-mono text-amber-300">PKR {overallTotals.storeMeds.toLocaleString()}</span>
                </div>
                <div className="bg-emerald-950/80 p-2.5 rounded-xl border border-emerald-600/50 col-span-2 sm:col-span-1">
                  <span className="text-[10px] font-extrabold uppercase text-emerald-300 block">Net Grand Total</span>
                  <span className="text-lg font-black font-mono text-emerald-200">PKR {overallTotals.grandTotal.toLocaleString()}</span>
                </div>
              </div>

              {/* Report Preview Body */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50 space-y-6">
                {/* MODE 1: PATIENT WISE REPORT */}
                {detailReportMode === 'patient_wise' && (
                  <div className="bg-white rounded-xl border border-slate-300 shadow-xs overflow-hidden">
                    <div className="p-3 bg-slate-900 text-white font-extrabold text-xs uppercase flex items-center justify-between">
                      <span className="flex items-center space-x-1.5">
                        <Users className="w-4 h-4 text-indigo-400" />
                        <span>Daily Collection Report - Patient Wise ({detailList.length} Records)</span>
                      </span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-100 border-b border-slate-300 text-slate-700 font-extrabold uppercase text-[10px]">
                            <th className="p-2.5 border-r border-slate-200 text-center w-10">Sr #</th>
                            <th className="p-2.5 border-r border-slate-200">Patient ID</th>
                            <th className="p-2.5 border-r border-slate-200">Patient Name</th>
                            <th className="p-2.5 border-r border-slate-200">Token / Visit Date</th>
                            <th className="p-2.5 border-r border-slate-200">Shift</th>
                            <th className="p-2.5 border-r border-slate-200 text-right">OPD Fee</th>
                            <th className="p-2.5 border-r border-slate-200 text-right">File/Card</th>
                            <th className="p-2.5 border-r border-slate-200 text-right">Clinical Meds</th>
                            <th className="p-2.5 border-r border-slate-200 text-right">Store Meds</th>
                            <th className="p-2.5 text-right font-black">Total (PKR)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 text-slate-800">
                          {detailList.length === 0 ? (
                            <tr>
                              <td colSpan={10} className="p-8 text-center text-slate-400 font-medium">
                                No patient collection records matching search or shift filter.
                              </td>
                            </tr>
                          ) : (
                            detailList.map((item, idx) => (
                              <tr key={`dt-pt-${item.patient.PatientID}-${idx}`} className="hover:bg-slate-50 transition">
                                <td className="p-2 border-r border-slate-200 text-center text-slate-500 font-mono text-xxs">{idx + 1}</td>
                                <td className="p-2 border-r border-slate-200 font-bold font-mono text-indigo-900">{item.patient.PatientID}</td>
                                <td className="p-2 border-r border-slate-200 font-extrabold text-slate-900">{item.patient.PatientName}</td>
                                <td className="p-2 border-r border-slate-200 font-medium text-slate-600">
                                  {item.visitDateStr} <span className="text-xxs font-bold text-indigo-600">(Tok #{item.tokenNum})</span>
                                </td>
                                <td className="p-2 border-r border-slate-200">
                                  <span className={`px-2 py-0.5 rounded-full text-xxs font-extrabold uppercase ${
                                    item.shiftNum === 1 ? 'bg-amber-100 text-amber-800' : item.shiftNum === 2 ? 'bg-indigo-100 text-indigo-800' : 'bg-purple-100 text-purple-800'
                                  }`}>
                                    {item.shiftLabel}
                                  </span>
                                </td>
                                <td className="p-2 border-r border-slate-200 text-right font-mono font-medium">{item.appOpdFee ? `PKR ${item.appOpdFee.toLocaleString()}` : '-'}</td>
                                <td className="p-2 border-r border-slate-200 text-right font-mono font-medium">{item.fileCardFee ? `PKR ${item.fileCardFee.toLocaleString()}` : '-'}</td>
                                <td className="p-2 border-r border-slate-200 text-right font-mono font-medium">{item.clinMedsFee ? `PKR ${item.clinMedsFee.toLocaleString()}` : '-'}</td>
                                <td className="p-2 border-r border-slate-200 text-right font-mono font-medium">{item.storeMedsFee ? `PKR ${item.storeMedsFee.toLocaleString()}` : '-'}</td>
                                <td className="p-2 text-right font-mono font-black text-slate-950 bg-slate-50/80">PKR {item.totalFee.toLocaleString()}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                        <tfoot className="bg-slate-100 border-t-2 border-slate-400 font-bold text-xs">
                          <tr>
                            <td colSpan={5} className="p-2.5 text-right uppercase text-slate-700 font-extrabold">
                              Grand Total ({detailList.length} Patients):
                            </td>
                            <td className="p-2.5 text-right font-mono text-emerald-800 font-extrabold">PKR {overallTotals.opd.toLocaleString()}</td>
                            <td className="p-2.5 text-right font-mono text-cyan-800 font-extrabold">PKR {overallTotals.fileCard.toLocaleString()}</td>
                            <td className="p-2.5 text-right font-mono text-purple-800 font-extrabold">PKR {overallTotals.clinMeds.toLocaleString()}</td>
                            <td className="p-2.5 text-right font-mono text-amber-800 font-extrabold">PKR {overallTotals.storeMeds.toLocaleString()}</td>
                            <td className="p-2.5 text-right font-mono text-indigo-950 font-black text-sm bg-indigo-50">PKR {overallTotals.grandTotal.toLocaleString()}</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                )}

                {/* MODE 2: SHIFT WISE REPORT */}
                {detailReportMode === 'shift_wise' && (
                  <div className="bg-white rounded-xl border border-slate-300 shadow-xs overflow-hidden space-y-0">
                    <div className="p-3 bg-slate-900 text-white font-extrabold text-xs uppercase flex items-center justify-between">
                      <span className="flex items-center space-x-1.5">
                        <Clock className="w-4 h-4 text-emerald-400" />
                        <span>Daily Collection Report - Shift Wise Breakdown</span>
                      </span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-100 border-b border-slate-300 text-slate-700 font-extrabold uppercase text-[10px]">
                            <th className="p-3 border-r border-slate-200">Shift Name</th>
                            <th className="p-3 border-r border-slate-200 text-center">Patients Count</th>
                            <th className="p-3 border-r border-slate-200 text-right">OPD Revenue</th>
                            <th className="p-3 border-r border-slate-200 text-right">File & Card</th>
                            <th className="p-3 border-r border-slate-200 text-right">Clinical Meds</th>
                            <th className="p-3 border-r border-slate-200 text-right">Store Meds</th>
                            <th className="p-3 text-right font-black">Net Shift Collection</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 text-slate-800">
                          <tr className="hover:bg-amber-50/50 transition">
                            <td className="p-3 border-r border-slate-200 font-black text-slate-900 flex items-center space-x-2">
                              <span>🌅</span>
                              <span>MORNING SHIFT (Shift 1)</span>
                            </td>
                            <td className="p-3 border-r border-slate-200 text-center font-bold font-mono">{morningTotals.count}</td>
                            <td className="p-3 border-r border-slate-200 text-right font-mono font-medium">PKR {morningTotals.opd.toLocaleString()}</td>
                            <td className="p-3 border-r border-slate-200 text-right font-mono font-medium">PKR {morningTotals.fileCard.toLocaleString()}</td>
                            <td className="p-3 border-r border-slate-200 text-right font-mono font-medium">PKR {morningTotals.clinMeds.toLocaleString()}</td>
                            <td className="p-3 border-r border-slate-200 text-right font-mono font-medium">PKR {morningTotals.storeMeds.toLocaleString()}</td>
                            <td className="p-3 text-right font-mono font-black text-indigo-900 bg-amber-50/80">PKR {morningTotals.grandTotal.toLocaleString()}</td>
                          </tr>

                          <tr className="hover:bg-indigo-50/50 transition">
                            <td className="p-3 border-r border-slate-200 font-black text-slate-900 flex items-center space-x-2">
                              <span>🌆</span>
                              <span>EVENING SHIFT (Shift 2)</span>
                            </td>
                            <td className="p-3 border-r border-slate-200 text-center font-bold font-mono">{eveningTotals.count}</td>
                            <td className="p-3 border-r border-slate-200 text-right font-mono font-medium">PKR {eveningTotals.opd.toLocaleString()}</td>
                            <td className="p-3 border-r border-slate-200 text-right font-mono font-medium">PKR {eveningTotals.fileCard.toLocaleString()}</td>
                            <td className="p-3 border-r border-slate-200 text-right font-mono font-medium">PKR {eveningTotals.clinMeds.toLocaleString()}</td>
                            <td className="p-3 border-r border-slate-200 text-right font-mono font-medium">PKR {eveningTotals.storeMeds.toLocaleString()}</td>
                            <td className="p-3 text-right font-mono font-black text-indigo-900 bg-indigo-50/80">PKR {eveningTotals.grandTotal.toLocaleString()}</td>
                          </tr>

                          {nightTotals.count > 0 && (
                            <tr className="hover:bg-purple-50/50 transition">
                              <td className="p-3 border-r border-slate-200 font-black text-slate-900 flex items-center space-x-2">
                                <span>🌃</span>
                                <span>NIGHT SHIFT (Shift 3)</span>
                              </td>
                              <td className="p-3 border-r border-slate-200 text-center font-bold font-mono">{nightTotals.count}</td>
                              <td className="p-3 border-r border-slate-200 text-right font-mono font-medium">PKR {nightTotals.opd.toLocaleString()}</td>
                              <td className="p-3 border-r border-slate-200 text-right font-mono font-medium">PKR {nightTotals.fileCard.toLocaleString()}</td>
                              <td className="p-3 border-r border-slate-200 text-right font-mono font-medium">PKR {nightTotals.clinMeds.toLocaleString()}</td>
                              <td className="p-3 border-r border-slate-200 text-right font-mono font-medium">PKR {nightTotals.storeMeds.toLocaleString()}</td>
                              <td className="p-3 text-right font-mono font-black text-indigo-900 bg-purple-50/80">PKR {nightTotals.grandTotal.toLocaleString()}</td>
                            </tr>
                          )}
                        </tbody>
                        <tfoot className="bg-slate-900 text-white font-extrabold text-xs border-t-2 border-slate-950">
                          <tr>
                            <td className="p-3 uppercase">COMBINED SHIFTS GRAND TOTAL:</td>
                            <td className="p-3 text-center font-mono font-black text-amber-300">{overallTotals.count} Patients</td>
                            <td className="p-3 text-right font-mono text-emerald-300">PKR {overallTotals.opd.toLocaleString()}</td>
                            <td className="p-3 text-right font-mono text-cyan-300">PKR {overallTotals.fileCard.toLocaleString()}</td>
                            <td className="p-3 text-right font-mono text-purple-300">PKR {overallTotals.clinMeds.toLocaleString()}</td>
                            <td className="p-3 text-right font-mono text-amber-300">PKR {overallTotals.storeMeds.toLocaleString()}</td>
                            <td className="p-3 text-right font-mono font-black text-sm text-emerald-400 bg-slate-950">PKR {overallTotals.grandTotal.toLocaleString()}</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                )}

                {/* MODE 3: HYBRID REPORT (PATIENT WISE & SHIFT WISE TOTAL) */}
                {detailReportMode === 'hybrid' && (
                  <div className="space-y-6">
                    {/* MORNING SHIFT BLOCK */}
                    {morningList.length > 0 && (
                      <div className="bg-white rounded-xl border border-slate-300 shadow-xs overflow-hidden">
                        <div className="p-3 bg-amber-800 text-white font-black text-xs uppercase flex items-center justify-between">
                          <span className="flex items-center space-x-2">
                            <span>🌅 MORNING SHIFT PATIENTS</span>
                            <span className="px-2 py-0.5 rounded-full bg-amber-950/60 text-amber-200 text-xxs font-mono">{morningList.length} Patients</span>
                          </span>
                          <span className="font-mono text-sm">Subtotal: PKR {morningTotals.grandTotal.toLocaleString()}</span>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead>
                              <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-extrabold uppercase text-[10px]">
                                <th className="p-2 border-r border-slate-200 text-center w-8">#</th>
                                <th className="p-2 border-r border-slate-200">Patient ID</th>
                                <th className="p-2 border-r border-slate-200">Patient Name</th>
                                <th className="p-2 border-r border-slate-200">Token / Date</th>
                                <th className="p-2 border-r border-slate-200 text-right">OPD Fee</th>
                                <th className="p-2 border-r border-slate-200 text-right">File/Card</th>
                                <th className="p-2 border-r border-slate-200 text-right">Clinical Meds</th>
                                <th className="p-2 border-r border-slate-200 text-right">Store Meds</th>
                                <th className="p-2 text-right font-black">Total (PKR)</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 text-slate-800">
                              {morningList.map((item, idx) => (
                                <tr key={`m-pt-${item.patient.PatientID}-${idx}`} className="hover:bg-amber-50/40 transition">
                                  <td className="p-2 border-r border-slate-200 text-center font-mono text-xxs text-slate-400">{idx + 1}</td>
                                  <td className="p-2 border-r border-slate-200 font-bold font-mono text-amber-900">{item.patient.PatientID}</td>
                                  <td className="p-2 border-r border-slate-200 font-bold text-slate-900">{item.patient.PatientName}</td>
                                  <td className="p-2 border-r border-slate-200 font-medium text-slate-600">{item.visitDateStr} (Tok #{item.tokenNum})</td>
                                  <td className="p-2 border-r border-slate-200 text-right font-mono">{item.appOpdFee ? `PKR ${item.appOpdFee.toLocaleString()}` : '-'}</td>
                                  <td className="p-2 border-r border-slate-200 text-right font-mono">{item.fileCardFee ? `PKR ${item.fileCardFee.toLocaleString()}` : '-'}</td>
                                  <td className="p-2 border-r border-slate-200 text-right font-mono">{item.clinMedsFee ? `PKR ${item.clinMedsFee.toLocaleString()}` : '-'}</td>
                                  <td className="p-2 border-r border-slate-200 text-right font-mono">{item.storeMedsFee ? `PKR ${item.storeMedsFee.toLocaleString()}` : '-'}</td>
                                  <td className="p-2 text-right font-mono font-extrabold text-slate-950 bg-amber-50/50">PKR {item.totalFee.toLocaleString()}</td>
                                </tr>
                              ))}
                            </tbody>
                            <tfoot className="bg-amber-100/60 font-bold text-xs border-t border-amber-300">
                              <tr>
                                <td colSpan={4} className="p-2 text-right font-black uppercase text-amber-950">MORNING SHIFT SUBTOTAL:</td>
                                <td className="p-2 text-right font-mono font-bold text-amber-900">PKR {morningTotals.opd.toLocaleString()}</td>
                                <td className="p-2 text-right font-mono font-bold text-amber-900">PKR {morningTotals.fileCard.toLocaleString()}</td>
                                <td className="p-2 text-right font-mono font-bold text-amber-900">PKR {morningTotals.clinMeds.toLocaleString()}</td>
                                <td className="p-2 text-right font-mono font-bold text-amber-900">PKR {morningTotals.storeMeds.toLocaleString()}</td>
                                <td className="p-2 text-right font-mono font-black text-amber-950 text-xs">PKR {morningTotals.grandTotal.toLocaleString()}</td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* EVENING SHIFT BLOCK */}
                    {eveningList.length > 0 && (
                      <div className="bg-white rounded-xl border border-slate-300 shadow-xs overflow-hidden">
                        <div className="p-3 bg-indigo-900 text-white font-black text-xs uppercase flex items-center justify-between">
                          <span className="flex items-center space-x-2">
                            <span>🌆 EVENING SHIFT PATIENTS</span>
                            <span className="px-2 py-0.5 rounded-full bg-indigo-950/60 text-indigo-200 text-xxs font-mono">{eveningList.length} Patients</span>
                          </span>
                          <span className="font-mono text-sm">Subtotal: PKR {eveningTotals.grandTotal.toLocaleString()}</span>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead>
                              <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-extrabold uppercase text-[10px]">
                                <th className="p-2 border-r border-slate-200 text-center w-8">#</th>
                                <th className="p-2 border-r border-slate-200">Patient ID</th>
                                <th className="p-2 border-r border-slate-200">Patient Name</th>
                                <th className="p-2 border-r border-slate-200">Token / Date</th>
                                <th className="p-2 border-r border-slate-200 text-right">OPD Fee</th>
                                <th className="p-2 border-r border-slate-200 text-right">File/Card</th>
                                <th className="p-2 border-r border-slate-200 text-right">Clinical Meds</th>
                                <th className="p-2 border-r border-slate-200 text-right">Store Meds</th>
                                <th className="p-2 text-right font-black">Total (PKR)</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 text-slate-800">
                              {eveningList.map((item, idx) => (
                                <tr key={`e-pt-${item.patient.PatientID}-${idx}`} className="hover:bg-indigo-50/40 transition">
                                  <td className="p-2 border-r border-slate-200 text-center font-mono text-xxs text-slate-400">{idx + 1}</td>
                                  <td className="p-2 border-r border-slate-200 font-bold font-mono text-indigo-900">{item.patient.PatientID}</td>
                                  <td className="p-2 border-r border-slate-200 font-bold text-slate-900">{item.patient.PatientName}</td>
                                  <td className="p-2 border-r border-slate-200 font-medium text-slate-600">{item.visitDateStr} (Tok #{item.tokenNum})</td>
                                  <td className="p-2 border-r border-slate-200 text-right font-mono">{item.appOpdFee ? `PKR ${item.appOpdFee.toLocaleString()}` : '-'}</td>
                                  <td className="p-2 border-r border-slate-200 text-right font-mono">{item.fileCardFee ? `PKR ${item.fileCardFee.toLocaleString()}` : '-'}</td>
                                  <td className="p-2 border-r border-slate-200 text-right font-mono">{item.clinMedsFee ? `PKR ${item.clinMedsFee.toLocaleString()}` : '-'}</td>
                                  <td className="p-2 border-r border-slate-200 text-right font-mono">{item.storeMedsFee ? `PKR ${item.storeMedsFee.toLocaleString()}` : '-'}</td>
                                  <td className="p-2 text-right font-mono font-extrabold text-slate-950 bg-indigo-50/50">PKR {item.totalFee.toLocaleString()}</td>
                                </tr>
                              ))}
                            </tbody>
                            <tfoot className="bg-indigo-100/60 font-bold text-xs border-t border-indigo-300">
                              <tr>
                                <td colSpan={4} className="p-2 text-right font-black uppercase text-indigo-950">EVENING SHIFT SUBTOTAL:</td>
                                <td className="p-2 text-right font-mono font-bold text-indigo-900">PKR {eveningTotals.opd.toLocaleString()}</td>
                                <td className="p-2 text-right font-mono font-bold text-indigo-900">PKR {eveningTotals.fileCard.toLocaleString()}</td>
                                <td className="p-2 text-right font-mono font-bold text-indigo-900">PKR {eveningTotals.clinMeds.toLocaleString()}</td>
                                <td className="p-2 text-right font-mono font-bold text-indigo-900">PKR {eveningTotals.storeMeds.toLocaleString()}</td>
                                <td className="p-2 text-right font-mono font-black text-indigo-950 text-xs">PKR {eveningTotals.grandTotal.toLocaleString()}</td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* NIGHT SHIFT BLOCK */}
                    {nightList.length > 0 && (
                      <div className="bg-white rounded-xl border border-slate-300 shadow-xs overflow-hidden">
                        <div className="p-3 bg-purple-900 text-white font-black text-xs uppercase flex items-center justify-between">
                          <span className="flex items-center space-x-2">
                            <span>🌃 NIGHT SHIFT PATIENTS</span>
                            <span className="px-2 py-0.5 rounded-full bg-purple-950/60 text-purple-200 text-xxs font-mono">{nightList.length} Patients</span>
                          </span>
                          <span className="font-mono text-sm">Subtotal: PKR {nightTotals.grandTotal.toLocaleString()}</span>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead>
                              <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-extrabold uppercase text-[10px]">
                                <th className="p-2 border-r border-slate-200 text-center w-8">#</th>
                                <th className="p-2 border-r border-slate-200">Patient ID</th>
                                <th className="p-2 border-r border-slate-200">Patient Name</th>
                                <th className="p-2 border-r border-slate-200">Token / Date</th>
                                <th className="p-2 border-r border-slate-200 text-right">OPD Fee</th>
                                <th className="p-2 border-r border-slate-200 text-right">File/Card</th>
                                <th className="p-2 border-r border-slate-200 text-right">Clinical Meds</th>
                                <th className="p-2 border-r border-slate-200 text-right">Store Meds</th>
                                <th className="p-2 text-right font-black">Total (PKR)</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 text-slate-800">
                              {nightList.map((item, idx) => (
                                <tr key={`n-pt-${item.patient.PatientID}-${idx}`} className="hover:bg-purple-50/40 transition">
                                  <td className="p-2 border-r border-slate-200 text-center font-mono text-xxs text-slate-400">{idx + 1}</td>
                                  <td className="p-2 border-r border-slate-200 font-bold font-mono text-purple-900">{item.patient.PatientID}</td>
                                  <td className="p-2 border-r border-slate-200 font-bold text-slate-900">{item.patient.PatientName}</td>
                                  <td className="p-2 border-r border-slate-200 font-medium text-slate-600">{item.visitDateStr} (Tok #{item.tokenNum})</td>
                                  <td className="p-2 border-r border-slate-200 text-right font-mono">{item.appOpdFee ? `PKR ${item.appOpdFee.toLocaleString()}` : '-'}</td>
                                  <td className="p-2 border-r border-slate-200 text-right font-mono">{item.fileCardFee ? `PKR ${item.fileCardFee.toLocaleString()}` : '-'}</td>
                                  <td className="p-2 border-r border-slate-200 text-right font-mono">{item.clinMedsFee ? `PKR ${item.clinMedsFee.toLocaleString()}` : '-'}</td>
                                  <td className="p-2 border-r border-slate-200 text-right font-mono">{item.storeMedsFee ? `PKR ${item.storeMedsFee.toLocaleString()}` : '-'}</td>
                                  <td className="p-2 text-right font-mono font-extrabold text-slate-950 bg-purple-50/50">PKR {item.totalFee.toLocaleString()}</td>
                                </tr>
                              ))}
                            </tbody>
                            <tfoot className="bg-purple-100/60 font-bold text-xs border-t border-purple-300">
                              <tr>
                                <td colSpan={4} className="p-2 text-right font-black uppercase text-purple-950">NIGHT SHIFT SUBTOTAL:</td>
                                <td className="p-2 text-right font-mono font-bold text-purple-900">PKR {nightTotals.opd.toLocaleString()}</td>
                                <td className="p-2 text-right font-mono font-bold text-purple-900">PKR {nightTotals.fileCard.toLocaleString()}</td>
                                <td className="p-2 text-right font-mono font-bold text-purple-900">PKR {nightTotals.clinMeds.toLocaleString()}</td>
                                <td className="p-2 text-right font-mono font-bold text-purple-900">PKR {nightTotals.storeMeds.toLocaleString()}</td>
                                <td className="p-2 text-right font-mono font-black text-purple-950 text-xs">PKR {nightTotals.grandTotal.toLocaleString()}</td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* COMBINED HYBRID FOOTER SUMMARY CARD */}
                    <div className="bg-slate-900 text-white p-4 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <h4 className="font-extrabold uppercase text-xs text-amber-300">All Shifts Overall Collection Summary</h4>
                        <p className="text-xxs text-slate-400 font-medium">Combined totals across Morning, Evening and Night shifts for current date selection.</p>
                      </div>
                      <div className="flex items-center space-x-6 text-xs font-mono">
                        <div>
                          <span className="text-slate-400 text-[10px] block uppercase font-sans">Patients</span>
                          <span className="font-bold">{overallTotals.count}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 text-[10px] block uppercase font-sans">OPD</span>
                          <span className="font-bold text-emerald-300">PKR {overallTotals.opd.toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 text-[10px] block uppercase font-sans">File & Card</span>
                          <span className="font-bold text-cyan-300">PKR {overallTotals.fileCard.toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 text-[10px] block uppercase font-sans">Clinical Meds</span>
                          <span className="font-bold text-purple-300">PKR {overallTotals.clinMeds.toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 text-[10px] block uppercase font-sans">Store Meds</span>
                          <span className="font-bold text-amber-300">PKR {overallTotals.storeMeds.toLocaleString()}</span>
                        </div>
                        <div className="bg-emerald-950 px-3 py-1.5 rounded-lg border border-emerald-500/40">
                          <span className="text-emerald-300 text-[10px] block uppercase font-sans font-bold">Net Total</span>
                          <span className="font-black text-emerald-200 text-sm">PKR {overallTotals.grandTotal.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}
      {/* WHATSAPP MESSAGE PREVIEW MODAL */}
      {waModalOpen && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="bg-emerald-600 px-5 py-4 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                  <WhatsAppIcon className="w-5 h-5 fill-current text-white" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm tracking-wide">WhatsApp Message Preview</h3>
                  <p className="text-[11px] text-emerald-100 font-medium">Review prescription details before opening WhatsApp</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setWaModalOpen(false)}
                className="text-white/80 hover:text-white hover:bg-white/10 w-7 h-7 rounded-full flex items-center justify-center transition cursor-pointer text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Patient Badge & Phone Field */}
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">Patient</span>
                  <p className="font-extrabold text-slate-900 text-xs">{waModalPatientName} <span className="text-slate-500 font-mono">({waModalPatientId})</span></p>
                </div>
                <div className="w-full sm:w-auto">
                  <label className="text-[10px] font-black uppercase text-emerald-800 block mb-0.5">Mobile Number</label>
                  <input
                    type="text"
                    value={waModalMobile}
                    onChange={(e) => setWaModalMobile(e.target.value)}
                    placeholder="e.g. 03001234567 or 923001234567"
                    className="px-2.5 py-1 text-xs font-mono font-bold text-slate-900 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden w-full"
                  />
                </div>
              </div>

              {/* Message Chat Bubble Preview */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center space-x-1">
                    <span>Formatted WhatsApp Message</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(waModalMessage);
                      setWaCopied(true);
                      setTimeout(() => setWaCopied(false), 2000);
                    }}
                    className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 flex items-center space-x-1 cursor-pointer bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded border border-emerald-200 transition"
                  >
                    <Copy className="w-3 h-3" />
                    <span>{waCopied ? 'Copied to Clipboard!' : 'Copy Text'}</span>
                  </button>
                </div>
                
                <textarea
                  value={waModalMessage}
                  onChange={(e) => setWaModalMessage(e.target.value)}
                  rows={11}
                  className="w-full p-3 font-sans text-xs sm:text-sm font-medium text-slate-800 bg-[#efeae2] border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden resize-y shadow-inner leading-relaxed"
                />
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="bg-slate-100 px-5 py-3 border-t border-slate-200 flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={() => setWaModalOpen(false)}
                className="px-3.5 py-2 bg-white hover:bg-slate-200 text-slate-700 border border-slate-300 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => {
                  let phone = waModalMobile.replace(/\D/g, '');
                  if (phone.startsWith('03') && phone.length === 11) {
                    phone = '92' + phone.slice(1);
                  } else if (phone.startsWith('0') && phone.length === 11) {
                    phone = '92' + phone.slice(1);
                  } else if (phone.length === 10 && phone.startsWith('3')) {
                    phone = '92' + phone;
                  }

                  let waUrl = '';
                  if (phone && phone.length >= 10) {
                    waUrl = `https://wa.me/${phone}?text=${encodeURIComponent(waModalMessage)}`;
                  } else {
                    waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(waModalMessage)}`;
                  }

                  openWhatsAppUrl(waUrl, true);
                  setWaModalOpen(false);
                }}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold rounded-xl shadow-md hover:shadow-lg transition flex items-center space-x-2 cursor-pointer"
              >
                <WhatsAppIcon className="w-4 h-4 fill-current text-white" />
                <span>Open WhatsApp App</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
