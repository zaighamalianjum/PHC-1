/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ShoppingCart, X, Plus, FileText } from 'lucide-react';

interface PharmacyPatentSourcingModalProps {
  patients?: any[];
  patientSourcingOption?: string;
  setPatientSourcingOption?: (opt: string) => void;
  latestVisit?: any;
  showPatentSourcingModal: boolean;
  setShowPatentSourcingModal: (open: boolean) => void;
  selectedPatientId: string;
  selectedPatientName: string;
  patentSourcingNote: string;
  setPatentSourcingNote: (v: string) => void;
  handleConfirmPatentSourcing: (opt?: string) => void;
}

export const PharmacyPatentSourcingModal: React.FC<PharmacyPatentSourcingModalProps> = ({
  showPatentSourcingModal,
  setShowPatentSourcingModal,
  selectedPatientId,
  selectedPatientName,
  patentSourcingNote,
  setPatentSourcingNote,
  handleConfirmPatentSourcing,
  patients = [],
  patientSourcingOption = "all",
  setPatientSourcingOption = (_opt?: any) => {},
  latestVisit = null
}) => {
  if (!showPatentSourcingModal || !selectedPatientId) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-[10000] p-4 animate-fadeIn font-sans">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-5 animate-scaleIn">
            <div className="flex items-start space-x-3.5">
              <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl shrink-0">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide">Patent Sourcing Selection</h3>
                <p className="text-xxs text-slate-500 font-semibold mt-0.5 uppercase tracking-wide">
                  Patient ID: {selectedPatientId} • {patients.find(p => p.PatientID === selectedPatientId)?.PatientName}
                </p>
              </div>
            </div>

            <div className="space-y-3 pt-1">
              <p className="text-xs text-slate-600 leading-relaxed">
                Please decide the sourcing logistics for any prescribed <strong className="text-slate-900">patent (brand-name) medicines</strong> for this patient.
              </p>

              <div className="grid grid-cols-1 gap-3 pt-1">
                {/* Option A: Clinic Stock */}
                <button
                  type="button"
                  onClick={() => {
                    setPatientSourcingOption('Clinic');
                    // Modify the visit object directly in-place so all downstream modules update dynamically
                    if (latestVisit) {
                      latestVisit.PatentPaymentOption = 'Clinic';
                    }
                    setShowPatentSourcingModal(false);
                  }}
                  className={`p-3.5 rounded-xl border text-left flex items-start space-x-3 transition duration-150 cursor-pointer ${
                    patientSourcingOption === 'Clinic'
                      ? 'border-emerald-500 bg-emerald-50/50 hover:bg-emerald-50'
                      : 'border-slate-200 hover:border-slate-300 bg-slate-50/50 hover:bg-slate-50'
                  }`}
                >
                  <div className={`mt-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                    patientSourcingOption === 'Clinic' ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-slate-300'
                  }`}>
                    {patientSourcingOption === 'Clinic' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                  <div>
                    <span className="block text-xs font-bold text-slate-900">Clinic Stock (Clinic Sourced)</span>
                    <span className="block text-xxs text-slate-500 mt-0.5">Sourced and billed directly inside Punjab Health Clinic terminal.</span>
                  </div>
                </button>

                {/* Option B: Outside Rx */}
                <button
                  type="button"
                  onClick={() => {
                    setPatientSourcingOption('Outside');
                    // Modify the visit object directly in-place so all downstream modules update dynamically
                    if (latestVisit) {
                      latestVisit.PatentPaymentOption = 'Outside';
                    }
                    setShowPatentSourcingModal(false);
                  }}
                  className={`p-3.5 rounded-xl border text-left flex items-start space-x-3 transition duration-150 cursor-pointer ${
                    patientSourcingOption === 'Outside'
                      ? 'border-indigo-500 bg-indigo-50/50 hover:bg-indigo-50'
                      : 'border-slate-200 hover:border-slate-300 bg-slate-50/50 hover:bg-slate-50'
                  }`}
                >
                  <div className={`mt-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                    patientSourcingOption === 'Outside' ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-300'
                  }`}>
                    {patientSourcingOption === 'Outside' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                  <div>
                    <span className="block text-xs font-bold text-slate-900">Outside Rx (External Sourced)</span>
                    <span className="block text-xxs text-slate-500 mt-0.5">Patent medicines are bought externally. Do not bill them here.</span>
                  </div>
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-slate-100 pt-4 text-xxs font-bold text-slate-400 uppercase tracking-widest">
              <span>Selected: {patientSourcingOption === 'Clinic' ? 'Clinic Stock' : 'Outside Rx'}</span>
              <button
                type="button"
                onClick={() => setShowPatentSourcingModal(false)}
                className="px-4 py-2 bg-slate-950 text-white hover:bg-slate-800 text-xxs font-black uppercase rounded-lg transition"
              >
                Confirm Decision
              </button>
            </div>
          </div>
        </div>
  );
};

export default PharmacyPatentSourcingModal;
