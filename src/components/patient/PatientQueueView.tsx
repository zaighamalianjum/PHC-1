/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import {
  ListOrdered,
  Plus,
  Clock,
  CheckCircle2,
  Calendar,
  Sparkles,
  Printer,
  Trash2,
  Phone,
  Search,
  Filter,
  Stethoscope,
  UserCheck,
  Volume2
} from 'lucide-react';
import { Patient, Appointment, Token, NhcPatientHistory, Visit } from '../../types';

interface PatientQueueViewProps {
  tokens: Token[];
  appointments: Appointment[];
  visits: Visit[];
  patients: Patient[];
  nhcPatients: NhcPatientHistory[];
  appDate: string;
  shift: 1 | 2;
  setShift: (s: 1 | 2) => void;
  queueStatusFilter: 'all' | 'waiting' | 'completed' | 'called';
  setQueueStatusFilter: (f: 'all' | 'waiting' | 'completed' | 'called') => void;
  queueSearchTerm: string;
  setQueueSearchTerm: (t: string) => void;
  queueShiftFilter: 'all' | 'morning' | 'evening';
  setQueueShiftFilter: (s: 'all' | 'morning' | 'evening') => void;
  canAddToken: boolean;
  canCallServeToken: boolean;
  canDeleteToken: boolean;
  canPost: boolean;
  onOpenDirectVisitModal: (tok: Token) => void;
  handleCallPatient: (tok: Token) => void;
  handlePostPayment: (tok: Token) => void;
  handleCancelQueue: (tok: Token) => void;
  handlePrintThermalTokenSlip: (data: any) => void;
  getPatientName: (id: string) => string;
  getPatientPhone: (id: string) => string;
  getPatientAgeGender: (id: string) => string;
  onOpenTokenIssue: () => void;
  currentUser?: any;
  speakVoice?: (tok: Token) => void;
}

export default function PatientQueueView({
  tokens,
  appointments,
  visits,
  patients,
  nhcPatients,
  appDate,
  shift,
  setShift,
  queueStatusFilter,
  setQueueStatusFilter,
  queueSearchTerm,
  setQueueSearchTerm,
  queueShiftFilter,
  setQueueShiftFilter,
  canAddToken,
  canCallServeToken,
  canDeleteToken,
  canPost,
  onOpenDirectVisitModal,
  handleCallPatient,
  handlePostPayment,
  handleCancelQueue,
  handlePrintThermalTokenSlip,
  getPatientName,
  getPatientPhone,
  getPatientAgeGender,
  onOpenTokenIssue,
  currentUser,
  speakVoice
}: PatientQueueViewProps) {
  const realTodayStr = new Date().toISOString().split('T')[0];

  const isTokenCompleted = (tok: Token) => {
    if (tok.Status === 2) return true;
    const tokDate = tok.Date || realTodayStr;
    const hasVisit = (visits || []).some(
      (v) => v.PatientID === tok.PatientID && (v.VisitDate ? v.VisitDate.split('T')[0] === tokDate : false)
    );
    const isAppCompleted = (appointments || []).some(
      (a) => a.PatientID === tok.PatientID && a.AppointmentDate === tokDate && a.Status === 4
    );
    return hasVisit || isAppCompleted;
  };

  const userShift = currentUser?.AssignedShift;
  const showMorningQueue = userShift === 1 || userShift === 'Both' || !userShift;
  const showEveningQueue = userShift === 2 || userShift === 'Both' || !userShift;

  const filterTokensByShift = (shiftNum: 1 | 2) => {
    return (tokens || [])
      .filter((t) => {
        if (t.Shift !== shiftNum) return false;
        if (t.Date && t.Date !== appDate) return false;

        const isCompleted = isTokenCompleted(t);
        const isCalled = t.Status === 3;
        const isWaiting = !isCompleted && !isCalled;

        if (queueStatusFilter === 'waiting' && !isWaiting) return false;
        if (queueStatusFilter === 'completed' && !isCompleted) return false;
        if (queueStatusFilter === 'called' && !isCalled) return false;

        if (queueSearchTerm.trim()) {
          const q = queueSearchTerm.toLowerCase().trim();
          const pName = getPatientName(t.PatientID).toLowerCase();
          const pPhone = getPatientPhone(t.PatientID).toLowerCase();
          const tokStr = String(t.TokenNo);
          const pId = String(t.PatientID || '').toLowerCase();
          if (!pName.includes(q) && !pPhone.includes(q) && !tokStr.includes(q) && !pId.includes(q)) {
            return false;
          }
        }
        return true;
      })
      .sort((a, b) => a.TokenNo - b.TokenNo);
  };

  const morningTokens = filterTokensByShift(1);
  const eveningTokens = filterTokensByShift(2);

  return (
    <div className="space-y-4" id="patient-queue-view">
      {/* Header & Controls */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <ListOrdered className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">Live Patient Queue & Tokens</h2>
              <p className="text-xs text-slate-500">Real-time token management and calling console</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {canAddToken && (
              <button
                type="button"
                onClick={onOpenTokenIssue}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg flex items-center space-x-1.5 shadow-2xs cursor-pointer transition"
              >
                <Plus className="w-4 h-4" />
                <span>Issue Instant Token</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={queueSearchTerm}
              onChange={(e) => setQueueSearchTerm(e.target.value)}
              placeholder="Search token #, patient name, ID, mobile..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            />
          </div>

          <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-lg">
            <button
              type="button"
              onClick={() => setQueueStatusFilter('all')}
              className={`px-2.5 py-1 text-xs font-bold rounded-md transition ${
                queueStatusFilter === 'all' ? 'bg-white text-indigo-600 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setQueueStatusFilter('waiting')}
              className={`px-2.5 py-1 text-xs font-bold rounded-md transition ${
                queueStatusFilter === 'waiting' ? 'bg-white text-amber-600 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Waiting
            </button>
            <button
              type="button"
              onClick={() => setQueueStatusFilter('called')}
              className={`px-2.5 py-1 text-xs font-bold rounded-md transition ${
                queueStatusFilter === 'called' ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Called
            </button>
            <button
              type="button"
              onClick={() => setQueueStatusFilter('completed')}
              className={`px-2.5 py-1 text-xs font-bold rounded-md transition ${
                queueStatusFilter === 'completed' ? 'bg-white text-emerald-600 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Completed
            </button>
          </div>
        </div>
      </div>

      {/* Shift Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Morning Shift Queue */}
        {showMorningQueue && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="bg-amber-50/80 px-4 py-3 border-b border-amber-100 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-amber-600" />
                <h3 className="text-sm font-bold text-amber-900">Morning Shift Queue</h3>
              </div>
              <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-xs font-bold rounded-full">
                {morningTokens.length} Patients
              </span>
            </div>

            <div className="p-3 space-y-2 max-h-[600px] overflow-y-auto">
              {morningTokens.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">No tokens in morning queue</div>
              ) : (
                morningTokens.map((tok) => {
                  const isCompleted = isTokenCompleted(tok);
                  const isCalled = tok.Status === 3;
                  return (
                    <div
                      key={`m-${tok.TokenNo}`}
                      className={`p-3 rounded-lg border transition ${
                        isCompleted
                          ? 'bg-slate-50/80 border-slate-200 opacity-75'
                          : isCalled
                          ? 'bg-blue-50/60 border-blue-200'
                          : 'bg-white border-slate-200 hover:border-indigo-200 shadow-2xs'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          <div
                            className={`w-9 h-9 rounded-lg flex items-center justify-center font-black text-sm ${
                              isCompleted
                                ? 'bg-emerald-100 text-emerald-800'
                                : isCalled
                                ? 'bg-blue-100 text-blue-800 animate-pulse'
                                : 'bg-indigo-100 text-indigo-800'
                            }`}
                          >
                            #{tok.TokenNo}
                          </div>
                          <div>
                            <div className="text-xs font-bold text-slate-800">{getPatientName(tok.PatientID)}</div>
                            <div className="text-xxs text-slate-500 flex items-center space-x-2">
                              <span>ID: {tok.PatientID}</span>
                              <span>•</span>
                              <span>{getPatientAgeGender(tok.PatientID)}</span>
                              <span>•</span>
                              <span>{getPatientPhone(tok.PatientID)}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-1">
                          {isCompleted ? (
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xxs font-bold rounded">
                              Completed
                            </span>
                          ) : isCalled ? (
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xxs font-bold rounded">
                              Called / In
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xxs font-bold rounded">
                              Waiting
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex flex-wrap items-center gap-1.5 mt-2.5 pt-2 border-t border-slate-100">
                        {canCallServeToken && !isCompleted && (
                          <button
                            type="button"
                            onClick={() => handleCallPatient(tok)}
                            className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xxs font-bold rounded flex items-center transition border border-indigo-200 cursor-pointer"
                            title="Call patient into consultation room"
                          >
                            <UserCheck className="w-3 h-3 mr-1" />
                            <span>Call</span>
                          </button>
                        )}
                        {onOpenDirectVisitModal && !isCompleted && (
                          <button
                            type="button"
                            onClick={() => onOpenDirectVisitModal(tok)}
                            className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xxs font-bold rounded flex items-center transition border border-emerald-200 cursor-pointer"
                            title="Start consultation directly"
                          >
                            <Stethoscope className="w-3 h-3 mr-1" />
                            <span>Consult</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handlePrintThermalTokenSlip(tok)}
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xxs font-bold rounded flex items-center transition border border-slate-200 cursor-pointer"
                          title="Print short thermal printer token slip"
                        >
                          <Printer className="w-3 h-3 mr-1 text-slate-600" />
                          <span>Print Ticket</span>
                        </button>
                        {speakVoice && (
                          <button
                            type="button"
                            onClick={() => speakVoice(tok)}
                            className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xxs font-bold rounded flex items-center transition border border-blue-200"
                            title="Repeat the calling voice announcement"
                          >
                            <Volume2 className="w-3 h-3 mr-1" />
                            <span>Repeat Voice</span>
                          </button>
                        )}
                        {canDeleteToken && (
                          <button
                            type="button"
                            onClick={() => handleCancelQueue(tok)}
                            className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-800 text-xxs font-bold rounded flex items-center transition border border-rose-200 cursor-pointer"
                            title="Delete token if issued by mistake"
                          >
                            <Trash2 className="w-3 h-3 mr-1" />
                            <span>Delete</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Evening Shift Queue */}
        {showEveningQueue && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="bg-purple-50/80 px-4 py-3 border-b border-purple-100 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-purple-600" />
                <h3 className="text-sm font-bold text-purple-900">Evening Shift Queue</h3>
              </div>
              <span className="px-2 py-0.5 bg-purple-100 text-purple-800 text-xs font-bold rounded-full">
                {eveningTokens.length} Patients
              </span>
            </div>

            <div className="p-3 space-y-2 max-h-[600px] overflow-y-auto">
              {eveningTokens.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">No tokens in evening queue</div>
              ) : (
                eveningTokens.map((tok) => {
                  const isCompleted = isTokenCompleted(tok);
                  const isCalled = tok.Status === 3;
                  return (
                    <div
                      key={`e-${tok.TokenNo}`}
                      className={`p-3 rounded-lg border transition ${
                        isCompleted
                          ? 'bg-slate-50/80 border-slate-200 opacity-75'
                          : isCalled
                          ? 'bg-blue-50/60 border-blue-200'
                          : 'bg-white border-slate-200 hover:border-purple-200 shadow-2xs'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          <div
                            className={`w-9 h-9 rounded-lg flex items-center justify-center font-black text-sm ${
                              isCompleted
                                ? 'bg-emerald-100 text-emerald-800'
                                : isCalled
                                ? 'bg-blue-100 text-blue-800 animate-pulse'
                                : 'bg-purple-100 text-purple-800'
                            }`}
                          >
                            #{tok.TokenNo}
                          </div>
                          <div>
                            <div className="text-xs font-bold text-slate-800">{getPatientName(tok.PatientID)}</div>
                            <div className="text-xxs text-slate-500 flex items-center space-x-2">
                              <span>ID: {tok.PatientID}</span>
                              <span>•</span>
                              <span>{getPatientAgeGender(tok.PatientID)}</span>
                              <span>•</span>
                              <span>{getPatientPhone(tok.PatientID)}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-1">
                          {isCompleted ? (
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xxs font-bold rounded">
                              Completed
                            </span>
                          ) : isCalled ? (
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xxs font-bold rounded">
                              Called / In
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xxs font-bold rounded">
                              Waiting
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex flex-wrap items-center gap-1.5 mt-2.5 pt-2 border-t border-slate-100">
                        {canCallServeToken && !isCompleted && (
                          <button
                            type="button"
                            onClick={() => handleCallPatient(tok)}
                            className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xxs font-bold rounded flex items-center transition border border-indigo-200 cursor-pointer"
                            title="Call patient into consultation room"
                          >
                            <UserCheck className="w-3 h-3 mr-1" />
                            <span>Call</span>
                          </button>
                        )}
                        {onOpenDirectVisitModal && !isCompleted && (
                          <button
                            type="button"
                            onClick={() => onOpenDirectVisitModal(tok)}
                            className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xxs font-bold rounded flex items-center transition border border-emerald-200 cursor-pointer"
                            title="Start consultation directly"
                          >
                            <Stethoscope className="w-3 h-3 mr-1" />
                            <span>Consult</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handlePrintThermalTokenSlip(tok)}
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xxs font-bold rounded flex items-center transition border border-slate-200 cursor-pointer"
                          title="Print short thermal printer token slip"
                        >
                          <Printer className="w-3 h-3 mr-1 text-slate-600" />
                          <span>Print Ticket</span>
                        </button>
                        {speakVoice && (
                          <button
                            type="button"
                            onClick={() => speakVoice(tok)}
                            className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xxs font-bold rounded flex items-center transition border border-blue-200"
                            title="Repeat the calling voice announcement"
                          >
                            <Volume2 className="w-3 h-3 mr-1" />
                            <span>Repeat Voice</span>
                          </button>
                        )}
                        {canDeleteToken && (
                          <button
                            type="button"
                            onClick={() => handleCancelQueue(tok)}
                            className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-800 text-xxs font-bold rounded flex items-center transition border border-rose-200 cursor-pointer"
                            title="Delete token if issued by mistake"
                          >
                            <Trash2 className="w-3 h-3 mr-1" />
                            <span>Delete</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
