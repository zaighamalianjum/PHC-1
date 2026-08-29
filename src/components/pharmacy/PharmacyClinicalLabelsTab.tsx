/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  Tag,
  Printer,
  Search,
  User,
  Calendar,
  Clock,
  Sparkles,
  Pill,
  FileText,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { Patient, Visit, VisitMedicine, Item } from '../../types';

interface PharmacyClinicalLabelsTabProps {
  activeSubTab: string;
  labelPatientId: string;
  setLabelPatientId: (v: string) => void;
  labelVisitId: string;
  setLabelVisitId: (v: string) => void;
  labelSearchQuery: string;
  setLabelSearchQuery: (v: string) => void;
  customLabelStates: { [medId: string]: { instructions: string; notes: string; qty: string; expiry: string } };
  setCustomLabelStates: React.Dispatch<React.SetStateAction<{ [medId: string]: { instructions: string; notes: string; qty: string; expiry: string } }>>;
  allKnownPatients: Patient[];
  visits: Visit[];
  visitMedicines: VisitMedicine[];
  items: Item[];
  getVisitMedicinesList: (vis: Visit | null) => { ItemID: string; MedicineDetail: string; Dosage: string; Qty?: number; ExpireDate?: string }[];
  setIsLabelPrintModalOpen: (open: boolean) => void;
  setLabelPrintData: React.Dispatch<React.SetStateAction<any>>;
}

export const PharmacyClinicalLabelsTab: React.FC<PharmacyClinicalLabelsTabProps> = ({
  activeSubTab,
  labelPatientId,
  setLabelPatientId,
  labelVisitId,
  setLabelVisitId,
  labelSearchQuery,
  setLabelSearchQuery,
  customLabelStates,
  setCustomLabelStates,
  allKnownPatients,
  visits,
  visitMedicines,
  items,
  getVisitMedicinesList,
  setIsLabelPrintModalOpen,
  setLabelPrintData
}) => {
  if (activeSubTab !== 'clinical_labels') return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn" id="pos-clinical-labels-tab">
          
          {/* Left Column: Patients & Visits List */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center border-b border-slate-100 pb-2">
              <Search className="w-4 h-4 text-indigo-600 mr-2" />
              Patient & Visit Selection
            </h3>
            
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder=""
                value={labelSearchQuery}
                onChange={(e) => setLabelSearchQuery(e.target.value)}
                className="w-full text-xs font-semibold border border-slate-300 rounded-lg pl-9 pr-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
              />
            </div>

            {/* Patients List with Clinical Prescriptions */}
            <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-1">
              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Patients with Clinical compounding prescriptions
              </span>
              {(() => {
                const clinicalPatients = allKnownPatients.filter(p => {
                  const pVisits = visits.filter(v => v.PatientID === p.PatientID);
                  const searchLower = labelSearchQuery.toLowerCase();
                  const matchesSearch = String(p.PatientName || '').toLowerCase().includes(searchLower) || String(p.PatientID || '').toLowerCase().includes(searchLower);
                  
                  if (labelSearchQuery.trim()) {
                    return matchesSearch;
                  }
                  
                  return pVisits.length > 0;
                });

                if (clinicalPatients.length === 0) {
                  return (
                    <div className="p-4 text-center text-xs text-slate-400 bg-slate-50 border border-dashed rounded-lg italic">
                      No matching patients found.
                    </div>
                  );
                }

                return clinicalPatients.map((p, idx) => {
                  const hasMeds = visits.filter(v => v.PatientID === p.PatientID).some(v => 
                    getVisitMedicinesList(v).length > 0
                  );

                  return (
                    <button
                      key={`lbl-pt-${p.PatientID}-${idx}`}
                      onClick={() => {
                        setLabelPatientId(p.PatientID);
                        // Auto-select latest visit if available
                        const pVisits = visits
                          .filter(v => v.PatientID === p.PatientID)
                          .sort((a, b) => b.VisitDate.localeCompare(a.VisitDate));
                        if (pVisits.length > 0) {
                          setLabelVisitId(pVisits[0].VisitID);
                        } else {
                          setLabelVisitId('');
                        }
                      }}
                      className={`w-full text-left p-3 rounded-xl border text-xs font-semibold transition cursor-pointer flex justify-between items-center ${
                        labelPatientId === p.PatientID
                          ? 'bg-indigo-50/80 border-indigo-300 text-indigo-900 shadow-xs'
                          : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="min-w-0 pr-2">
                        <p className="font-extrabold uppercase truncate">{p.PatientName}</p>
                        <p className="text-[10px] text-slate-400 font-mono truncate">ID: {p.PatientID} • {p.AgeYears || 0}Y • {p.Sex || 'N/A'}</p>
                      </div>
                      {hasMeds && (
                        <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-800 shrink-0 font-mono">
                          Rx Meds
                        </span>
                      )}
                    </button>
                  );
                });
              })()}
            </div>

            {/* Visits List */}
            {labelPatientId && (
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Select Consultation Visit Date:
                </span>
                {(() => {
                  const pVisits = visits
                    .filter((v) => v.PatientID === labelPatientId)
                    .sort((a, b) => b.VisitDate.localeCompare(a.VisitDate));

                  if (pVisits.length === 0) {
                    return (
                      <p className="text-xs text-slate-400 italic">No visit history found.</p>
                    );
                  }

                  return (
                    <div className="space-y-1 max-h-[220px] overflow-y-auto pr-1">
                      {pVisits.map((v) => {
                        const hasMeds = getVisitMedicinesList(v).length > 0;
                        return (
                          <button
                            key={v.VisitID}
                            onClick={() => setLabelVisitId(v.VisitID)}
                            className={`w-full text-left p-2.5 rounded-lg border text-xs transition cursor-pointer flex justify-between items-center ${
                              labelVisitId === v.VisitID
                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/10 font-bold'
                                : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
                            }`}
                          >
                            <div className="min-w-0 pr-2">
                              <p className="font-bold">{v.VisitDate}</p>
                              <p className="text-[9px] opacity-70 font-mono leading-none mt-0.5 truncate">Visit ID: {v.VisitID}</p>
                            </div>
                            {hasMeds && (
                              <span className={`text-[8px] font-black uppercase tracking-wider px-1 py-0.5 rounded shrink-0 font-mono ${
                                labelVisitId === v.VisitID
                                  ? 'bg-indigo-800 text-indigo-100'
                                  : 'bg-indigo-50 border border-indigo-100 text-indigo-700'
                              }`}>
                                🧪 Prescribed
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            )}

          </div>

          {/* Right Column: Prescribed Clinical Medicines Label Configuration & Live Sticker Preview */}
          <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
            
            {/* Header with Print-All option */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-3 gap-2">
              <h3 className="text-sm font-bold text-slate-900 flex items-center">
                <Tag className="w-4 h-4 text-indigo-600 mr-2" />
                Prescribed Medicines for Patient Label Printer
              </h3>
              {(() => {
                const pat = allKnownPatients.find(p => p.PatientID === labelPatientId);
                const vis = visits.find(v => v.VisitID === labelVisitId);
                const cMeds = getVisitMedicinesList(vis || null);
                
                if (pat && vis && cMeds.length > 0) {
                  return (
                    <button
                      onClick={() => {
                        const labelsToPrint = cMeds.map(m => {
                          const matchedItem = items.find(i => i.ItemID === m.ItemID);
                          const name = matchedItem ? matchedItem.ItemName : m.MedicineDetail;
                          const instructions = customLabelStates[m.ItemID]?.instructions ?? m.Dosage;
                          const notes = customLabelStates[m.ItemID]?.notes ?? "Take as directed by the physician.";
                          const qty = customLabelStates[m.ItemID]?.qty ?? String(m.Qty || 30);
                          const expiry = customLabelStates[m.ItemID]?.expiry ?? (m.ExpireDate || "No Expiry Specified");
                          
                          return { name, instructions, notes, qty, expiry };
                        });

                        setLabelPrintData({
                          patientName: pat.PatientName,
                          patientAge: String(pat.AgeYears),
                          patientSex: pat.Sex,
                          visitDate: vis.VisitDate,
                          visitId: vis.VisitID,
                          medicines: labelsToPrint
                        });
                        setIsLabelPrintModalOpen(true);
                      }}
                      className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-lg flex items-center shadow-md shadow-indigo-600/10 self-start cursor-pointer transition"
                    >
                      <Printer className="w-3.5 h-3.5 mr-1.5" />
                      Print All ({cMeds.length}) Labels for This Visit
                    </button>
                  );
                }
                return null;
              })()}
            </div>

            {/* Medicines List */}
            {(() => {
              if (!labelPatientId || !labelVisitId) {
                return (
                  <div className="p-12 text-center text-slate-400 italic text-xs">
                    Please select a Patient and a Visit Date from the left panel to load prescribed medicines.
                  </div>
                );
              }

              const pat = allKnownPatients.find(p => p.PatientID === labelPatientId);
              const vis = visits.find(v => v.VisitID === labelVisitId);
              const clinicalMeds = getVisitMedicinesList(vis || null);

              if (clinicalMeds.length === 0) {
                return (
                  <div className="p-12 text-center text-slate-400 italic text-xs bg-slate-50 border border-dashed rounded-xl">
                    No prescribed medicines found in this visit.
                  </div>
                );
              }

              return (
                <div className="space-y-6">
                  
                  {/* Selected Patient Mini Header */}
                  <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl flex flex-wrap justify-between gap-3 text-xs">
                    <div className="space-y-0.5">
                      <span className="block text-[8px] font-black text-slate-400 uppercase tracking-wider">Patient Name</span>
                      <span className="font-extrabold text-slate-900 uppercase">{pat?.PatientName}</span>
                      <span className="text-slate-500 block text-[10px]">ID: {pat?.PatientID} • {pat?.AgeYears} Years • {pat?.Sex}</span>
                    </div>
                    <div className="space-y-0.5 text-right">
                      <span className="block text-[8px] font-black text-slate-400 uppercase tracking-wider">Prescribed Date</span>
                      <span className="font-mono text-slate-800 font-bold">{vis?.VisitDate}</span>
                      <span className="text-[10px] text-indigo-600 font-bold block">Visit ID: {vis?.VisitID}</span>
                    </div>
                  </div>

                  {/* Individual Med Label Customizer & Preview Grid */}
                  <div className="space-y-6">
                    {clinicalMeds.map((m, idx) => {
                      const matchedItem = items.find((i) => i.ItemID === m.ItemID);
                      const medicineName = matchedItem ? matchedItem.ItemName : m.MedicineDetail;
                      
                      // Fallback-safe customized label state
                      const instructionsValue = customLabelStates[m.ItemID]?.instructions ?? m.Dosage;
                      const notesValue = customLabelStates[m.ItemID]?.notes ?? "Take as directed by the physician.";
                      const qtyValue = customLabelStates[m.ItemID]?.qty ?? String(m.Qty || 30);
                      const expiryValue = customLabelStates[m.ItemID]?.expiry ?? (m.ExpireDate || "No Expiry Specified");

                      const updateLabelState = (key: 'instructions' | 'notes' | 'qty' | 'expiry', val: string) => {
                        setCustomLabelStates(prev => {
                          const existing = prev[m.ItemID] || {
                            instructions: m.Dosage,
                            notes: "Take as directed by the physician.",
                            qty: String(m.Qty || 30),
                            expiry: m.ExpireDate || ""
                          };
                          return {
                            ...prev,
                            [m.ItemID]: {
                              ...existing,
                              [key]: val
                            }
                          };
                        });
                      };

                      return (
                        <div key={`${m.ItemID}-${idx}`} className="p-4 bg-slate-50/60 border border-slate-200 rounded-2xl flex flex-col xl:flex-row gap-5">
                          
                          {/* Label Settings/Configuration Panel */}
                          <div className="flex-1 space-y-3.5">
                            <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
                              <span className="font-extrabold text-slate-900 uppercase text-xs truncate max-w-[200px]">
                                {medicineName}
                              </span>
                              <span className="text-[8px] font-black bg-indigo-50 border border-indigo-150 px-1.5 py-0.5 rounded text-indigo-700 uppercase tracking-wider">
                                Clinical Compounded
                              </span>
                            </div>

                            {/* Inputs */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                              <div className="space-y-1 sm:col-span-2">
                                <label className="block text-[9px] font-black text-slate-500 uppercase tracking-wider">
                                  Usage Instructions (Dosage)
                                </label>
                                <textarea
                                  rows={2}
                                  value={instructionsValue}
                                  onChange={(e) => updateLabelState('instructions', e.target.value)}
                                  placeholder=""
                                  className="w-full text-xs font-semibold border border-slate-200 rounded-lg p-2 focus:outline-none focus:border-indigo-500 bg-white"
                                />
                              </div>

                              <div className="space-y-1">
                                <label className="block text-[9px] font-black text-slate-500 uppercase tracking-wider">
                                  Prescribed Quantity
                                </label>
                                <input
                                  type="text"
                                  value={qtyValue}
                                  onChange={(e) => updateLabelState('qty', e.target.value)}
                                  placeholder=""
                                  className="w-full text-xs font-semibold border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-indigo-500 bg-white"
                                />
                              </div>

                              <div className="space-y-1">
                                <label className="block text-[9px] font-black text-slate-500 uppercase tracking-wider">
                                  Sticker Expiry Date
                                </label>
                                <input
                                  type="text"
                                  value={expiryValue}
                                  onChange={(e) => updateLabelState('expiry', e.target.value)}
                                  placeholder=""
                                  className="w-full text-xs font-semibold border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-indigo-500 bg-white font-mono"
                                />
                              </div>

                              <div className="space-y-1 sm:col-span-2">
                                <label className="block text-[9px] font-black text-slate-500 uppercase tracking-wider">
                                  Special Warnings / Notes
                                </label>
                                <input
                                  type="text"
                                  value={notesValue}
                                  onChange={(e) => updateLabelState('notes', e.target.value)}
                                  placeholder=""
                                  className="w-full text-xs font-semibold border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-indigo-500 bg-white"
                                />
                              </div>
                            </div>
                          </div>

                          {/* Live Sticker Preview Panel - 3-Line Simple Label Format */}
                          <div className="w-full xl:w-[280px] shrink-0 flex flex-col justify-between bg-white border border-slate-300 rounded-xl p-4 text-slate-900 min-h-[180px]">
                            <div className="space-y-2 text-xs font-sans">
                              <div className="border-b border-slate-100 pb-1.5 mb-2">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">3-Line Label Preview</span>
                              </div>
                              <div className="font-bold text-slate-900 text-xs">
                                <span>Patient Name: </span>
                                <span className="font-extrabold text-slate-900">{pat?.PatientName}</span>
                              </div>
                              <div className="font-bold text-slate-900 text-xs">
                                <span>Medicine Usage: </span>
                                <span className="font-extrabold text-indigo-700">{instructionsValue || "Take as directed"}</span>
                              </div>
                              <div className="font-bold text-slate-900 text-xs">
                                <span>Expire Date: </span>
                                <span className="font-extrabold text-slate-800 font-mono">{expiryValue || "N/A"}</span>
                              </div>
                            </div>

                            {/* Print Trigger Button */}
                            <div className="mt-4 pt-2 border-t border-slate-100">
                              <button
                                onClick={() => {
                                  setLabelPrintData({
                                    patientName: pat?.PatientName || "Unknown",
                                    patientAge: String(pat?.AgeYears || ""),
                                    patientSex: pat?.Sex || "Male",
                                    visitDate: vis?.VisitDate || "",
                                    visitId: vis?.VisitID || "",
                                    medicines: [{
                                      name: medicineName,
                                      instructions: instructionsValue,
                                      notes: notesValue,
                                      qty: qtyValue,
                                      expiry: expiryValue
                                    }]
                                  });
                                  setIsLabelPrintModalOpen(true);
                                }}
                                className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg flex items-center justify-center transition shadow-xs cursor-pointer"
                              >
                                <Printer className="w-3.5 h-3.5 mr-1.5" />
                                Print Label (3 Lines)
                              </button>
                            </div>

                          </div>

                        </div>
                      );
                    })}
                  </div>

                </div>
              );
            })()}

          </div>

        </div>
  );
};

export default PharmacyClinicalLabelsTab;
