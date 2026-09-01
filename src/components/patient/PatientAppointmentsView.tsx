/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState } from 'react';
import {
  CalendarPlus,
  Plus,
  Tag,
  Search,
  Filter,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Edit3,
  Trash2,
  Printer,
  Sparkles,
  Phone,
  UserCheck,
  Ban,
  Building2,
  X,
  CreditCard,
  History,
  Table,
  UserPlus
} from 'lucide-react';
import { Patient, Appointment, City, Token, NhcPatientHistory, Visit } from '../../types';
import { formatDisplayDate, isSamePatient } from './patientDeskUtils';

interface PatientAppointmentsViewProps {
  appointments: Appointment[];
  patients: Patient[];
  nhcPatients?: NhcPatientHistory[];
  visits?: Visit[];
  cities?: City[];
  tokens?: Token[];
  appDate?: string;
  setAppDate?: (d: string) => void;
  shift?: 1 | 2;
  setShift?: (s: 1 | 2) => void;
  canAddAppointment?: boolean;
  canDeleteAppointment?: boolean;
  onOpenAddModal?: () => void;
  onDeleteAppointment?: (id: string) => void;
  getPatientName?: (id: string) => string;
  getPatientPhone?: (id: string) => string;
  appSuccess?: string;
  appError?: string;
  setEditingAppointment?: (app: Appointment | null) => void;
  handleAddAppointmentSubmit?: (e: React.FormEvent) => void;
  handleEditAppointmentSubmit?: (e: React.FormEvent) => void;
  setSelectedPatientId?: (id: string) => void;
  setRemarks?: (r: string) => void;
  setEditAppDate?: (d: string) => void;
  setEditShift?: (s: 1 | 2) => void;
  setEditRemarks?: (r: string) => void;
  tokenFeeToCharge?: number;
  [key: string]: any;
}

export default function PatientAppointmentsView({
  appointments = [],
  patients = [],
  nhcPatients = [],
  visits = [],
  cities = [],
  tokens = [],
  appDate = new Date().toISOString().split('T')[0],
  setAppDate = () => {},
  shift = 1,
  setShift = () => {},
  canAddAppointment = true,
  canDeleteAppointment = true,
  onOpenAddModal = () => {},
  onDeleteAppointment = () => {},
  getPatientName = (id: string) => id,
  getPatientPhone = () => '',
  appSuccess = '',
  appError = '',
  setEditingAppointment = () => {},
  handleAddAppointmentSubmit = () => {},
  handleEditAppointmentSubmit = () => {},
  setSelectedPatientId = () => {},
  setRemarks = () => {},
  setEditAppDate = () => {},
  setEditShift = () => {},
  setEditRemarks = () => {},
  tokenFeeToCharge = 0
}: PatientAppointmentsViewProps) {
  const [appGridSearch, setAppGridSearch] = useState('');
  const [appGridDatePreset, setAppGridDatePreset] = useState<'today' | 'yesterday' | 'this_week' | 'this_month' | 'all' | 'custom'>('today');
  const [appGridStartDate, setAppGridStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [appGridEndDate, setAppGridEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [appGridShiftFilter, setAppGridShiftFilter] = useState<'all' | 'morning' | 'evening'>('all');
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);

  const [patientSearchQuery, setPatientSearchQuery] = useState('');
  const [isSearchingArchive, setIsSearchingArchive] = useState(false);
  const [nhcArchiveList, setNhcArchiveList] = useState<any[]>([]);

  const [formPatientId, setFormPatientId] = useState('');
  const [formPatientName, setFormPatientName] = useState('');
  const [formPhoneMobile, setFormPhoneMobile] = useState('');
  const [formAppDate, setFormAppDate] = useState(appDate || new Date().toISOString().split('T')[0]);
  const [formShift, setFormShift] = useState<1 | 2>(shift || 1);
  const [formFeeCharged, setFormFeeCharged] = useState(String(tokenFeeToCharge || 0));
  const [formRemarks, setFormRemarks] = useState('');

  const [editingApp, setEditingApp] = useState<Appointment | null>(null);
  const [isAddAppModalOpen, setIsAddAppModalOpen] = useState(false);

  const canBookAppointment = canAddAppointment;
  const canCancelAppointment = canDeleteAppointment;
  const pvNhcHistory = nhcPatients || [];

  const onAddPatient = () => {
    onOpenAddModal();
  };

  const getResolvedNhcPatientName = (nhc: any) => nhc?.PatientName || 'Unnamed Patient';
  
  const getPatientLastFee = (patId: string) => {
    if (!patId) return tokenFeeToCharge || 0;
    const cleanId = String(patId).trim().toLowerCase();

    // 1. Check in real doctor visits first
    const ptVisits = (visits || []).filter((v) => isSamePatient(v.PatientID, cleanId));
    if (ptVisits.length > 0) {
      const sorted = [...ptVisits].sort((a, b) => {
        const da = new Date(a.VisitDate || '').getTime() || 0;
        const db = new Date(b.VisitDate || '').getTime() || 0;
        return da - db;
      });
      const lastV = sorted[sorted.length - 1];
      let fee = Number(lastV.ConsultationFee) || 0;
      if (!fee && lastV.VisitRemarks) {
        const match = lastV.VisitRemarks.match(/OPD Fee PKR\s*(\d+)/i) || 
                      lastV.VisitRemarks.match(/Consultation Fee PKR\s*(\d+)/i) || 
                      lastV.VisitRemarks.match(/OPD PKR\s*(\d+)/i);
        if (match) fee = Number(match[1]);
      }
      if (fee > 0) return fee;
    }

    // 2. Check in nhc patients history
    const ptNhc = (nhcPatients || []).filter((nhc) => isSamePatient(nhc.PatientID, cleanId));
    if (ptNhc.length > 0) {
      const sorted = [...ptNhc].sort((a, b) => {
        const da = new Date((a as any).date || (a as any).VisitDate || '').getTime() || 0;
        const db = new Date((b as any).date || (b as any).VisitDate || '').getTime() || 0;
        return da - db;
      });
      const lastNhc = sorted[sorted.length - 1];
      let fee = Number((lastNhc as any).ConsultationFee) || Number((lastNhc as any).fee) || Number((lastNhc as any).FeeCharged) || 0;
      const rem = (lastNhc as any).VisitRemarks || (lastNhc as any).Remarks || '';
      if (!fee && rem) {
        const match = rem.match(/OPD Fee PKR\s*(\d+)/i) || 
                      rem.match(/Consultation Fee PKR\s*(\d+)/i) || 
                      rem.match(/OPD PKR\s*(\d+)/i);
        if (match) fee = Number(match[1]);
      }
      if (fee > 0) return fee;
    }

    return tokenFeeToCharge || 0;
  };

  const getPatientAppointmentHistory = (patId: string) => {
    if (!patId) return [];
    const cleanId = String(patId).trim().toLowerCase();
    return (appointments || [])
      .filter((a) => String(a.PatientID).trim().toLowerCase() === cleanId)
      .sort((a, b) => {
        const da = new Date(a.AppointmentDate || '').getTime() || 0;
        const db = new Date(b.AppointmentDate || '').getTime() || 0;
        return db - da; // most recent first
      });
  };

  const handleOpenAddModal = () => {
    setFormPatientId('');
    setFormPatientName('');
    setFormPhoneMobile('');
    setFormAppDate(appDate || new Date().toISOString().split('T')[0]);
    setFormShift(shift || 1);
    setFormFeeCharged(String(tokenFeeToCharge || 0));
    setFormRemarks('');
    setPatientSearchQuery('');
    setNhcArchiveList([]);
    setIsAddAppModalOpen(true);
  };

  const handleOpenEditModal = (app: Appointment) => {
    setEditingApp(app);
    setFormPatientId(app.PatientID);
    setFormPatientName(getPatientName(app.PatientID));
    setFormPhoneMobile(getPatientPhone(app.PatientID) || (app as any).MobileNo || '');
    setFormAppDate(app.AppointmentDate || new Date().toISOString().split('T')[0]);
    setFormShift((app.Shift as 1 | 2) || 1);
    setFormFeeCharged(String((app as any).FeeCharged || (app as any).Amount || 0));
    setFormRemarks(app.Remarks || '');
  };

  const handleDeleteAppointmentAction = (id: string) => {
    if (window.confirm(`Are you sure you want to delete appointment ${id}?`)) {
      onDeleteAppointment(id);
      setSelectedAppId(null);
      setEditingApp(null);
    }
  };

  const handleSaveAddAppointment = (e: React.FormEvent) => {
    e.preventDefault();
    setSelectedPatientId(formPatientId);
    setRemarks(formRemarks);
    setAppDate(formAppDate);
    setShift(formShift);
    handleAddAppointmentSubmit(e);
    setIsAddAppModalOpen(false);
  };

  const handleSaveEditAppointment = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingApp) {
      setEditingAppointment(editingApp);
      setEditAppDate(formAppDate);
      setEditShift(formShift);
      setEditRemarks(formRemarks);
      handleEditAppointmentSubmit(e);
      setEditingApp(null);
    }
  };

  const fetchNhcArchive = (query: string) => {
    if (!query || query.trim().length < 2) {
      setNhcArchiveList([]);
      return;
    }
    setIsSearchingArchive(true);
    const q = query.trim().toLowerCase();
    const matched = (nhcPatients || []).filter(
      (p) =>
        p.PatientID?.toLowerCase().includes(q) ||
        p.PatientName?.toLowerCase().includes(q) ||
        p.PhoneMobile?.includes(q)
    );
    setNhcArchiveList(matched);
    setIsSearchingArchive(false);
  };

  return (
    <div className="space-y-4" id="patients-view-book">
          {/* Header Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-emerald-100 text-emerald-800 rounded-xl border border-emerald-200 shadow-2xs">
                <CalendarPlus className="w-5 h-5 text-emerald-700" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                  <span>Book Appointments & Schedule Desk</span>
                </h2>
                <p className="text-xs text-slate-500 font-medium">Manage, view, and filter patient appointment schedules and booking details</p>
              </div>
            </div>

            {/* Search, Date Period & Shift Controls */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search Patient Name, PID, Mobile, Appt ID..."
                  value={appGridSearch}
                  onChange={(e) => setAppGridSearch(e.target.value)}
                  className="pl-8 pr-7 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-1 focus:ring-emerald-500 focus:outline-none w-64 bg-slate-50 font-medium"
                />
                {appGridSearch && (
                  <button
                    type="button"
                    onClick={() => setAppGridSearch('')}
                    className="absolute right-2 top-2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Date Period Preset Dropdown */}
              <div className="flex items-center space-x-1">
                <Calendar className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <select
                  value={appGridDatePreset}
                  onChange={(e) => {
                    const val = e.target.value as any;
                    setAppGridDatePreset(val);
                    const now = new Date();
                    const todayStr = now.toISOString().split('T')[0];
                    if (val === 'today') {
                      setAppGridStartDate(todayStr);
                      setAppGridEndDate(todayStr);
                    } else if (val === 'yesterday') {
                      const y = new Date(now);
                      y.setDate(y.getDate() - 1);
                      const yStr = y.toISOString().split('T')[0];
                      setAppGridStartDate(yStr);
                      setAppGridEndDate(yStr);
                    } else if (val === 'this_week') {
                      const w = new Date(now);
                      w.setDate(w.getDate() - 6);
                      setAppGridStartDate(w.toISOString().split('T')[0]);
                      setAppGridEndDate(todayStr);
                    } else if (val === 'this_month') {
                      const m = new Date(now.getFullYear(), now.getMonth(), 1);
                      setAppGridStartDate(m.toISOString().split('T')[0]);
                      setAppGridEndDate(todayStr);
                    } else if (val === 'all') {
                      setAppGridStartDate('');
                      setAppGridEndDate('');
                    }
                  }}
                  className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-slate-50 font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                >
                  <option value="today">📅 Today</option>
                  <option value="yesterday">Yesterday</option>
                  <option value="this_week">This Week</option>
                  <option value="this_month">This Month</option>
                  <option value="all">All Dates</option>
                  <option value="custom">Custom Period Range</option>
                </select>
              </div>

              {/* Custom Period Search Date Inputs */}
              {(appGridDatePreset === 'custom' || (appGridStartDate || appGridEndDate)) && (
                <div className="flex items-center space-x-1.5 bg-emerald-50/80 border border-emerald-200 px-2 py-1 rounded-lg text-xs">
                  <span className="text-[10px] font-bold text-emerald-800 uppercase shrink-0">From:</span>
                  <input
                    type="date"
                    value={appGridStartDate}
                    onChange={(e) => {
                      setAppGridStartDate(e.target.value);
                      setAppGridDatePreset('custom');
                    }}
                    className="bg-white text-slate-900 text-xs rounded px-1.5 py-0.5 border border-emerald-300 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono font-semibold"
                  />
                  <span className="text-[10px] font-bold text-emerald-800 uppercase shrink-0">To:</span>
                  <input
                    type="date"
                    value={appGridEndDate}
                    onChange={(e) => {
                      setAppGridEndDate(e.target.value);
                      setAppGridDatePreset('custom');
                    }}
                    className="bg-white text-slate-900 text-xs rounded px-1.5 py-0.5 border border-emerald-300 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono font-semibold"
                  />
                </div>
              )}

              <select
                value={appGridShiftFilter}
                onChange={(e) => setAppGridShiftFilter(e.target.value as any)}
                className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-slate-50 font-semibold focus:outline-none cursor-pointer"
              >
                <option value="all">All Shifts</option>
                <option value="1">Morning Shift (1)</option>
                <option value="2">Evening Shift (2)</option>
              </select>
            </div>
          </div>

          {appError && (
            <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg font-semibold border border-red-100">
              {appError}
            </div>
          )}
          {appSuccess && (
            <div className="p-3 bg-emerald-50 text-emerald-700 text-xs rounded-lg font-semibold border border-emerald-100 flex items-center">
              <CheckCircle2 className="w-4 h-4 mr-1.5 shrink-0" />
              {appSuccess}
            </div>
          )}

          {/* EXCEL SHEET WISE GRID VIEW TABLE */}
          {(() => {
            const todayStr = new Date().toISOString().split('T')[0];

            const normalizeDateStr = (dStr: string | undefined): string => {
              if (!dStr || dStr === 'Today' || dStr === 'today') return todayStr;
              const clean = dStr.split('T')[0].trim();
              if (clean.includes('-')) {
                const parts = clean.split('-');
                if (parts[0].length === 2 && parts[2]?.length === 4) {
                  return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
                }
              }
              if (clean.includes('/')) {
                const parts = clean.split('/');
                if (parts[0].length === 2 && parts[2]?.length === 4) {
                  return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
                }
              }
              return clean;
            };

            // Helper to get only the doctor's checkup consultation/OPD fee for this appointment
            const getDoctorCheckupFee = (app: Appointment): number => {
              const apptDateStr = normalizeDateStr(app.AppointmentDate);
              
              // 1. Look in recorded visits (from doctor clinical desk)
              const matchingVisits = (visits || []).filter(v => 
                isSamePatient(v.PatientID, app.PatientID) && 
                v.VisitDate && 
                normalizeDateStr(v.VisitDate) === apptDateStr
              );

              for (const v of matchingVisits) {
                let fee = Number(v.ConsultationFee) || 0;
                if (!fee && v.VisitRemarks) {
                  const match = v.VisitRemarks.match(/OPD Fee PKR\s*(\d+)/i) || 
                                v.VisitRemarks.match(/Consultation Fee PKR\s*(\d+)/i) || 
                                v.VisitRemarks.match(/OPD PKR\s*(\d+)/i);
                  if (match) fee = Number(match[1]);
                }
                if (fee > 0) return fee;
              }

              // 2. Look in NHC Patients history
              const matchingNhc = (nhcPatients || []).filter(nhc => 
                isSamePatient(nhc.PatientID, app.PatientID) && 
                ((nhc as any).date || (nhc as any).VisitDate) && 
                normalizeDateStr((nhc as any).date || (nhc as any).VisitDate) === apptDateStr
              );

              for (const nhc of matchingNhc) {
                let fee = Number((nhc as any).ConsultationFee) || Number((nhc as any).fee) || 0;
                const rem = (nhc as any).VisitRemarks || (nhc as any).Remarks || '';
                if (!fee && rem) {
                  const match = rem.match(/OPD Fee PKR\s*(\d+)/i) || 
                                rem.match(/Consultation Fee PKR\s*(\d+)/i) || 
                                rem.match(/OPD PKR\s*(\d+)/i);
                  if (match) fee = Number(match[1]);
                }
                if (fee > 0) return fee;
              }

              // 3. If the appointment entry was created directly from a doctor visit or has FeeCharged
              if (app.AppointmentID && app.AppointmentID.startsWith('APP-VIS-')) {
                return Number(app.FeeCharged) || 0;
              }

              if (Number(app.FeeCharged) > 0) {
                return Number(app.FeeCharged);
              }

              // Otherwise, if doctor has not yet conducted checkup & added fee, do NOT show
              return 0;
            };

            // Unified Appointment Records list (Only include records where doctor entered OPD / App fee)
            const combinedApps: Appointment[] = [];

            // Add registered appointments that have OPD / App fee entered
            (appointments || []).forEach(a => {
              const fee = getDoctorCheckupFee(a) || Number(a.FeeCharged) || 0;
              if (fee > 0) {
                combinedApps.push({
                  ...a,
                  FeeCharged: fee
                });
              }
            });

            // Add doctor visits where OPD / App fee was entered
            (visits || []).forEach((vis) => {
              let visFee = Number(vis.ConsultationFee) || 0;
              if (!visFee && vis.VisitRemarks) {
                const match = vis.VisitRemarks.match(/OPD Fee PKR\s*(\d+)/i) || 
                              vis.VisitRemarks.match(/Consultation Fee PKR\s*(\d+)/i) || 
                              vis.VisitRemarks.match(/OPD PKR\s*(\d+)/i);
                if (match) visFee = Number(match[1]);
              }
              if (visFee > 0) {
                const visDateNorm = normalizeDateStr(vis.VisitDate);
                const exists = combinedApps.some((a) => isSamePatient(a.PatientID, vis.PatientID) && normalizeDateStr(a.AppointmentDate) === visDateNorm);
                if (!exists) {
                  combinedApps.push({
                    AppointmentID: `APP-VIS-${vis.VisitID || Date.now()}`,
                    PatientID: vis.PatientID,
                    AppointmentDate: visDateNorm,
                    Shift: 1,
                    Status: 4,
                    Remarks: vis.VisitRemarks || 'OPD Consultation Visit',
                    FeeCharged: visFee,
                    PaymentStatus: 'Paid'
                  });
                }
              }
            });

            // Strictly filter: ONLY show records where doctor OPD / App fee has been entered (> 0)
            const validApps = combinedApps.filter((app) => {
              const fee = getDoctorCheckupFee(app) || Number(app.FeeCharged) || 0;
              return fee > 0;
            });

            const filteredApps = validApps.filter((app) => {
              // 1. Shift filter
              if (appGridShiftFilter !== 'all' && String(app.Shift) !== appGridShiftFilter) return false;

              // 2. Date period filter
              if (appGridDatePreset !== 'all') {
                const appDate = normalizeDateStr(app.AppointmentDate);
                if (appGridStartDate && appDate < appGridStartDate) return false;
                if (appGridEndDate && appDate > appGridEndDate) return false;
              }

              // 3. Search query
              if (appGridSearch.trim()) {
                const q = appGridSearch.toLowerCase().trim();
                const pat = patients.find((p) => isSamePatient(p.PatientID, app.PatientID));
                const matchName = String(pat?.PatientName || '').toLowerCase().includes(q);
                const matchPid = String(app.PatientID || '').toLowerCase().includes(q);
                const matchPhone = String(pat?.PhoneMobile || '').includes(q);
                const matchAppId = String(app.AppointmentID || '').toLowerCase().includes(q);
                const matchRemarks = String(app.Remarks || '').toLowerCase().includes(q);
                if (!matchName && !matchPid && !matchPhone && !matchAppId && !matchRemarks) return false;
              }
              return true;
            });

            return (
              <div className="bg-white rounded-xl border border-slate-300 shadow-xs overflow-hidden space-y-0">
                {/* Excel Ribbon Header Bar */}
                <div className="bg-emerald-800 text-white px-4 py-2 flex flex-wrap items-center justify-between text-xs font-bold border-b border-emerald-900 gap-2">
                  <div className="flex items-center space-x-2 font-mono">
                    <Table className="w-4 h-4 text-emerald-300" />
                    <span>Appointment Details Grid</span>
                  </div>
                  <div className="text-[11px] font-normal text-emerald-100 flex items-center space-x-2.5 flex-wrap">
                    {appGridShiftFilter !== 'all' && (
                      <span className="bg-amber-400 text-amber-950 font-extrabold px-2 py-0.5 rounded text-[10px] flex items-center gap-1 shadow-xs">
                        <span>Shift: {appGridShiftFilter === '1' ? 'Morning Shift (1)' : 'Evening Shift (2)'}</span>
                        <button
                          type="button"
                          onClick={() => setAppGridShiftFilter('all')}
                          className="bg-amber-950/20 hover:bg-amber-950/40 text-amber-950 px-1 rounded text-[9px] font-mono font-bold cursor-pointer transition"
                          title="Show All Shifts"
                        >
                          Show All Shifts
                        </button>
                      </span>
                    )}
                    {appGridDatePreset !== 'all' && (
                      <span className="bg-emerald-700 text-emerald-100 font-bold px-2 py-0.5 rounded text-[10px] flex items-center gap-1 border border-emerald-600">
                        <span>Date: {appGridDatePreset === 'today' ? 'Today' : appGridDatePreset}</span>
                        <button
                          type="button"
                          onClick={() => setAppGridDatePreset('all')}
                          className="bg-emerald-900/40 hover:bg-emerald-900/80 text-white px-1 rounded text-[9px] font-mono font-bold cursor-pointer transition"
                          title="Show All Dates"
                        >
                          Show All Dates
                        </button>
                      </span>
                    )}
                    <span>Filtered Records: <strong className="text-white font-mono">{filteredApps.length}</strong></span>
                    <span>|</span>
                    <span>Total Database: <strong className="text-emerald-200 font-mono">{validApps.length}</strong></span>
                  </div>
                </div>

                {/* Filter Notice Banner if Shift or Date Filter is active and hiding records */}
                {appGridShiftFilter !== 'all' && (
                  <div className="bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-2 text-xs font-medium flex items-center justify-between gap-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-amber-600 font-bold">💡 Filter Active:</span>
                      <span>
                        Showing only <strong>{appGridShiftFilter === '1' ? 'Morning Shift (1)' : 'Evening Shift (2)'}</strong> appointments.
                        {filteredApps.length < validApps.length && (
                          <span className="ml-1 text-amber-800 font-normal">
                            (Appointments booked for {appGridShiftFilter === '1' ? 'Evening Shift' : 'Morning Shift'} or other dates are hidden by this filter)
                          </span>
                        )}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAppGridShiftFilter('all')}
                      className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold rounded shadow-xs transition cursor-pointer shrink-0"
                    >
                      Show All Shifts
                    </button>
                  </div>
                )}

                {/* Table Sheet Container */}
                <div className="overflow-x-auto max-h-[550px]">
                  <table className="w-full text-left text-xs border-collapse font-sans">
                    {/* Excel Column Headers */}
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-300 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
                        <th className="py-2.5 px-3 border-r border-slate-300 text-center w-12 bg-slate-200/80 font-mono text-slate-600">
                          #
                        </th>
                        <th className="py-2.5 px-3 border-r border-slate-300 min-w-[140px]">
                          Appointment ID & Date
                        </th>
                        <th className="py-2.5 px-3 border-r border-slate-300 min-w-[200px]">
                          Patient Name
                        </th>
                        <th className="py-2.5 px-3 border-r border-slate-300 min-w-[140px]">
                          Mobile Number
                        </th>
                        <th className="py-2.5 px-3 border-r border-slate-300 min-w-[150px] text-right">
                          Appointment Fees
                        </th>
                        <th className="py-2.5 px-3 border-r border-slate-300 min-w-[120px] text-center">
                          Shift
                        </th>
                        <th className="py-2.5 px-3 border-r border-slate-300 min-w-[180px]">
                          Remarks / Reason
                        </th>
                        <th className="py-2.5 px-3 text-center min-w-[100px] bg-slate-200/50">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 font-medium text-slate-800">
                      {filteredApps.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="py-12 text-center text-slate-500 bg-slate-50">
                            <CalendarPlus className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-60" />
                            <p className="font-bold text-xs text-slate-700">No appointment records found in selected view.</p>
                            {validApps.length > 0 ? (
                              <div className="mt-2 space-y-1">
                                <p className="text-[11px] text-slate-500">There are {validApps.length} appointment records with OPD / App fee recorded outside this date range or shift.</p>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setAppGridDatePreset('all');
                                    setAppGridStartDate('');
                                    setAppGridEndDate('');
                                    setAppGridShiftFilter('all');
                                    setAppGridSearch('');
                                  }}
                                  className="mt-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-2xs transition cursor-pointer"
                                >
                                  Show All Dates & Records ({validApps.length})
                                </button>
                              </div>
                            ) : (
                              <p className="text-[11px] mt-1 text-slate-500 max-w-md mx-auto">
                                Appointment records appear automatically when the doctor enters <strong>OPD / App (PKR)</strong> consultation fee during the patient visit, or when you add an appointment with a consultation fee.
                              </p>
                            )}
                          </td>
                        </tr>
                      ) : (
                        filteredApps.map((app, index) => {
                          const pat = patients.find((p) => isSamePatient(p.PatientID, app.PatientID));
                          const isSelected = selectedAppId === app.AppointmentID;
                          const patientNameStr = pat?.PatientName || app.PatientID;
                          const mobileStr = pat?.PhoneMobile || 'N/A';
                          const apptDateStr = normalizeDateStr(app.AppointmentDate);
                          const feeVal = getDoctorCheckupFee(app);

                          return (
                            <tr
                              key={`app-${app.AppointmentID}-${index}`}
                              onClick={() => setSelectedAppId(app.AppointmentID)}
                              className={`cursor-pointer transition hover:bg-emerald-50/50 ${
                                isSelected ? 'bg-emerald-100/70 border-y-2 border-emerald-500 font-semibold' : index % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'
                              }`}
                            >
                              {/* Row Number */}
                              <td className="py-2.5 px-3 border-r border-slate-200 text-center font-mono text-slate-500 bg-slate-100/50 text-[11px] font-bold">
                                {index + 1}
                              </td>

                              {/* Appointment ID & Date */}
                              <td className="py-2.5 px-3 border-r border-slate-200">
                                <div className="font-mono text-slate-900 font-bold">{app.AppointmentID}</div>
                                <div className="text-[11px] text-slate-500 font-mono">{apptDateStr || 'Today'}</div>
                              </td>

                              {/* Patient Name */}
                              <td className="py-2.5 px-3 border-r border-slate-200 font-bold text-slate-950 text-xs">
                                <div>{patientNameStr}</div>
                                <div className="text-[10px] font-mono text-slate-500 font-normal">PID: {app.PatientID}</div>
                              </td>

                              {/* Mobile Number */}
                              <td className="py-2.5 px-3 border-r border-slate-200 font-mono text-slate-800 text-xs">
                                {mobileStr}
                              </td>

                              {/* Appointment Fees */}
                              <td className="py-2.5 px-3 border-r border-slate-200 text-right font-mono text-xs">
                                {feeVal > 0 ? (
                                  <span className="font-bold text-emerald-900 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-mono">
                                    PKR {Number(feeVal).toLocaleString()}
                                  </span>
                                ) : (
                                  <span className="text-[11px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded font-mono font-medium">
                                    PKR 0
                                  </span>
                                )}
                              </td>

                              {/* Shift */}
                              <td className="py-2.5 px-3 border-r border-slate-200 text-center">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                                  app.Shift === 1 ? 'bg-amber-100 text-amber-900' : 'bg-blue-100 text-blue-900'
                                }`}>
                                  {app.Shift === 1 ? 'Morning' : 'Evening'}
                                </span>
                              </td>

                              {/* Remarks */}
                              <td className="py-2.5 px-3 border-r border-slate-200 text-slate-600 text-xs italic truncate max-w-[200px]">
                                {app.Remarks || 'N/A'}
                              </td>

                              {/* Action Buttons */}
                              <td className="py-2.5 px-3 text-center space-x-1" onClick={(e) => e.stopPropagation()}>
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditModal(app)}
                                  title="Edit Appointment"
                                  className="p-1.5 text-blue-600 hover:bg-blue-100 rounded transition cursor-pointer"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteAppointmentAction(app.AppointmentID)}
                                  title="Delete Appointment"
                                  className="p-1.5 text-red-600 hover:bg-red-100 rounded transition cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* BOTTOM ACTION BAR WITH ADD, EDIT, DELETE BUTTONS */}
                <div className="bg-slate-100 p-3 border-t border-slate-300 flex flex-wrap items-center justify-between gap-3">
                  <div className="text-xs text-slate-600 font-medium">
                    {selectedAppId ? (
                      <span className="flex items-center space-x-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span>Selected Row ID: <strong className="font-mono text-slate-900">{selectedAppId}</strong></span>
                      </span>
                    ) : (
                      <span className="text-slate-400 italic">Click any row in the grid above to select, edit, or delete</span>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    {/* ADD BUTTON */}
                    <button
                      type="button"
                      disabled={!canBookAppointment}
                      onClick={handleOpenAddModal}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold rounded-lg shadow-xs transition flex items-center space-x-1.5 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>{canBookAppointment ? 'Add New Appointment' : 'Add Restricted'}</span>
                    </button>

                    {/* EDIT BUTTON */}
                    <button
                      type="button"
                      disabled={!selectedAppId || !canBookAppointment}
                      onClick={() => {
                        const target = appointments.find((a) => a.AppointmentID === selectedAppId);
                        if (target) handleOpenEditModal(target);
                      }}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold rounded-lg shadow-xs transition flex items-center space-x-1.5 cursor-pointer"
                    >
                      <Edit3 className="w-4 h-4" />
                      <span>Edit Selected</span>
                    </button>

                    {/* DELETE BUTTON */}
                    <button
                      type="button"
                      disabled={!selectedAppId || !canCancelAppointment}
                      onClick={() => {
                        if (selectedAppId) handleDeleteAppointmentAction(selectedAppId);
                      }}
                      className="px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold rounded-lg shadow-xs transition flex items-center space-x-1.5 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Delete Selected</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* ADD APPOINTMENT MODAL */}
          {isAddAppModalOpen && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="bg-emerald-800 text-white p-4 flex items-center justify-between">
                  <h3 className="text-sm font-bold flex items-center space-x-2">
                    <Plus className="w-4 h-4 text-emerald-300" />
                    <span>Add New Patient Appointment</span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => setIsAddAppModalOpen(false)}
                    className="text-emerald-200 hover:text-white transition cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSaveAddAppointment} className="p-5 space-y-4">
                  {/* PATIENT SELECTION / SEARCH SECTION */}
                  {!formPatientId ? (
                    <div className="space-y-3 bg-emerald-50/60 p-3.5 rounded-xl border border-emerald-200 shadow-2xs">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-black text-emerald-950 uppercase tracking-wide flex items-center">
                          <History className="w-4 h-4 text-emerald-700 mr-1.5" />
                          <span>Search PHC Patient History & Import to EMR</span>
                        </label>
                        <span className="text-[10px] font-mono font-bold bg-emerald-100 text-emerald-900 border border-emerald-300 px-2 py-0.5 rounded-full">
                          {patients.length} EMR Patients
                        </span>
                      </div>

                      {/* Search Box Input with Explicit Search Button */}
                      <div className="flex items-center space-x-2">
                        <div className="relative flex-1">
                          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                          <input
                            type="text"
                            placeholder=""
                            value={patientSearchQuery}
                            onChange={(e) => {
                              const val = e.target.value;
                              setPatientSearchQuery(val);
                              if (val.trim().length >= 2) {
                                fetchNhcArchive(val);
                              }
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                if (patientSearchQuery.trim()) {
                                  fetchNhcArchive(patientSearchQuery.trim());
                                }
                              }
                            }}
                            className="w-full pl-9 pr-8 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 bg-white font-medium shadow-inner"
                          />
                          {patientSearchQuery && (
                            <button
                              type="button"
                              onClick={() => setPatientSearchQuery('')}
                              className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 transition"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            if (patientSearchQuery.trim()) {
                              fetchNhcArchive(patientSearchQuery.trim());
                            }
                          }}
                          className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center space-x-1.5 shrink-0 cursor-pointer"
                          title="Search PHC Patient History Records"
                        >
                          <Search className="w-3.5 h-3.5" />
                          <span>Search History</span>
                        </button>
                      </div>

                      {/* Matching Patients Search Results List */}
                      {(() => {
                        if (!patientSearchQuery.trim()) return null;

                        const q = patientSearchQuery.toLowerCase().trim();

                        // Combine active patients and PHC patient history records
                        const candidateMap = new Map<string, {
                          PatientID: string;
                          PatientName: string;
                          PhoneMobile?: string;
                          Father_husband?: string;
                          AgeYears?: number;
                          Sex?: string;
                          isNhcHistory: boolean;
                        }>();

                        patients.forEach(p => {
                          candidateMap.set(p.PatientID, {
                            PatientID: p.PatientID,
                            PatientName: p.PatientName,
                            PhoneMobile: p.PhoneMobile,
                            Father_husband: p.Father_husband,
                            AgeYears: p.AgeYears,
                            Sex: p.Sex,
                            isNhcHistory: false
                          });
                        });

                        const allNhcRecords = [...(nhcPatients || []), ...nhcArchiveList, ...pvNhcHistory];
                        allNhcRecords.forEach(nhc => {
                          if (nhc.PatientID && !candidateMap.has(nhc.PatientID)) {
                            candidateMap.set(nhc.PatientID, {
                              PatientID: nhc.PatientID,
                              PatientName: getResolvedNhcPatientName(nhc),
                              PhoneMobile: nhc.PhoneMobile || '',
                              Father_husband: nhc.Father_husband || '',
                              AgeYears: nhc.AgeYears || 0,
                              Sex: nhc.Sex || 'Male',
                              isNhcHistory: true
                            });
                          }
                        });

                        const candidates = Array.from(candidateMap.values());
                        const filtered = candidates.filter((p) => {
                          const matchName = String(p.PatientName || '').toLowerCase().includes(q);
                          const matchId = String(p.PatientID || '').toLowerCase().includes(q);
                          const matchPhone = String(p.PhoneMobile || '').includes(q);
                          const matchGuardian = String(p.Father_husband || '').toLowerCase().includes(q);
                          return matchName || matchId || matchPhone || matchGuardian;
                        });

                        return (
                          <div className="space-y-1 pt-1">
                            <div className="flex items-center justify-between text-[10px] font-black text-emerald-900 uppercase tracking-wider">
                              <span>Found {filtered.length} Matching PHC / EMR History Records</span>
                              {isSearchingArchive && <span className="text-emerald-700 animate-pulse font-mono">Searching archive...</span>}
                            </div>

                            <div className="max-h-52 overflow-y-auto border border-emerald-300 rounded-xl divide-y divide-slate-100 bg-white shadow-2xs">
                              {filtered.length === 0 ? (
                                <div className="p-4 text-center text-slate-500 text-xs font-medium">
                                  No patient history record found matching "{patientSearchQuery}".
                                </div>
                              ) : (
                                filtered.map((p, pIdx) => {
                                  const prevFee = getPatientLastFee(p.PatientID);
                                  return (
                                    <div
                                      key={`cand-${p.PatientID}-${pIdx}`}
                                      className="p-2.5 hover:bg-emerald-50/80 transition flex items-center justify-between group"
                                    >
                                      <div>
                                        <div className="font-extrabold text-xs text-slate-950 group-hover:text-emerald-950 flex items-center space-x-1.5 flex-wrap">
                                          <span>{p.PatientName}</span>
                                          <span className="text-[10px] font-mono font-black bg-slate-100 text-slate-800 px-1.5 py-0.2 rounded border border-slate-300">
                                            {p.PatientID}
                                          </span>
                                          {p.isNhcHistory ? (
                                            <span className="text-[9px] font-black bg-amber-100 text-amber-950 px-1.5 py-0.2 rounded border border-amber-400">
                                              PHC History
                                            </span>
                                          ) : (
                                            <span className="text-[9px] font-black bg-emerald-100 text-emerald-950 px-1.5 py-0.2 rounded border border-emerald-300">
                                              EMR Active
                                            </span>
                                          )}
                                        </div>
                                        <div className="text-[11px] text-slate-600 font-mono flex items-center space-x-2.5 mt-0.5 flex-wrap">
                                          <span>Mobile: <strong>{p.PhoneMobile || 'N/A'}</strong></span>
                                          <span className="text-emerald-800 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200 font-bold">
                                            Appt Fee: <strong>PKR {prevFee}</strong>
                                          </span>
                                          {p.Father_husband ? <span>Guardian: <strong>{p.Father_husband}</strong></span> : null}
                                          {p.AgeYears ? <span>Age: <strong>{p.AgeYears}Y ({p.Sex || 'N/A'})</strong></span> : null}
                                        </div>
                                      </div>

                                      <button
                                        type="button"
                                        onClick={() => {
                                          setFormPatientId(p.PatientID);
                                          setFormPatientName(p.PatientName);
                                          setFormPhoneMobile(p.PhoneMobile || '');
                                          setPatientSearchQuery('');

                                          // Automatically populate payment/fee textbox with previous appointment fee
                                          setFormFeeCharged(String(prevFee));

                                          // If patient is from PHC History archive and not in active patients list, import into EMR
                                          if (p.isNhcHistory && !patients.some(ap => ap.PatientID === p.PatientID)) {
                                            const importedPat: Patient = {
                                              PatientID: p.PatientID,
                                              PatientName: p.PatientName,
                                              Father_husband: p.Father_husband || 'N/A',
                                              AgeYears: p.AgeYears || 0,
                                              Sex: (p.Sex as any) || 'Male',
                                              MaritalStatus: 'Single',
                                              Occupation: 'N/A',
                                              Address: 'N/A',
                                              CityID: 1,
                                              Country: 'Pakistan',
                                              PhoneMobile: p.PhoneMobile || '03000000000',
                                              RegistrationDate: new Date().toISOString().split('T')[0]
                                            };
                                            if (onAddPatient) {
                                              onAddPatient();
                                            }
                                          }
                                        }}
                                        className="text-[11px] font-extrabold text-white bg-emerald-700 hover:bg-emerald-800 px-3 py-1.5 rounded-lg transition shadow-2xs flex items-center space-x-1 shrink-0 cursor-pointer"
                                      >
                                        <UserPlus className="w-3.5 h-3.5 mr-0.5" />
                                        <span>Import into EMR</span>
                                      </button>
                                    </div>
                                  );
                                })
                              )}
                            </div>
                          </div>
                        );
                      })()}

                      {/* OR ENTER NEW PATIENT MANUALLY */}
                      <div className="pt-2 border-t border-slate-200">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                          Or Enter New Patient Details (Walk-in / First Visit):
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-white p-2.5 rounded-lg border border-slate-200">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-600 uppercase">Patient Name *</label>
                            <input
                              type="text"
                              placeholder=""
                              value={formPatientName}
                              onChange={(e) => {
                                setFormPatientName(e.target.value);
                                setFormPatientId('');
                              }}
                              className="mt-0.5 w-full text-xs border border-slate-300 rounded-md p-1.5 font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-600 uppercase">Mobile Number *</label>
                            <input
                              type="text"
                              placeholder=""
                              value={formPhoneMobile}
                              onChange={(e) => setFormPhoneMobile(e.target.value)}
                              className="mt-0.5 w-full text-xs border border-slate-300 rounded-md p-1.5 font-mono text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* SELECTED PREVIOUS PATIENT CARD */
                    <div className="bg-emerald-50 border-2 border-emerald-500 p-3.5 rounded-xl text-xs space-y-2 shadow-2xs">
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="flex items-center space-x-1.5">
                            <span className="text-[9px] font-extrabold text-emerald-900 uppercase tracking-wider bg-emerald-200 px-2 py-0.5 rounded">
                              Selected Patient
                            </span>
                            <span className="text-[10px] font-mono font-bold text-emerald-800 bg-white px-1.5 py-0.5 rounded border border-emerald-300">
                              {formPatientId}
                            </span>
                          </div>
                          <h4 className="font-extrabold text-slate-950 text-sm mt-1">{formPatientName}</h4>
                          <div className="text-[11px] font-mono text-slate-600 mt-0.5 flex items-center space-x-2.5 flex-wrap">
                            <span>Mobile: <strong className="text-slate-900">{formPhoneMobile || 'N/A'}</strong></span>
                            <span>|</span>
                            <span className="text-emerald-900 font-extrabold bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300">
                              Last Visit Fee: <strong>PKR {getPatientLastFee(formPatientId).toLocaleString()}</strong>
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setFormPatientId('');
                            setFormPatientName('');
                            setFormPhoneMobile('');
                          }}
                          className="px-3 py-1.5 bg-white border border-emerald-300 text-emerald-800 hover:bg-emerald-100 font-bold rounded-lg text-xs transition cursor-pointer shadow-2xs"
                        >
                          Search / Reselect
                        </button>
                      </div>

                      {/* Previous Appointment Visits Pill */}
                      {(() => {
                        const history = getPatientAppointmentHistory(formPatientId);
                        if (history.length === 0) return null;
                        const lastApp = history[0];
                        return (
                          <div className="bg-white/80 p-2 rounded-lg border border-emerald-200 text-[11px] flex items-center justify-between">
                            <div className="text-slate-700">
                              <span className="font-bold text-emerald-900">{history.length} Past Appointment{history.length > 1 ? 's' : ''} on record:</span>{' '}
                              Last on <span className="font-mono font-semibold">{lastApp.AppointmentDate || 'Recent'}</span> (Charged <span className="font-mono font-black text-emerald-800">PKR {(lastApp.FeeCharged || 0).toLocaleString()}</span>)
                            </div>
                            <button
                              type="button"
                              onClick={() => setFormFeeCharged(String(lastApp.FeeCharged || 0))}
                              className="text-[10px] font-bold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 px-2 py-0.5 rounded transition cursor-pointer"
                            >
                              Apply Last Fee
                            </button>
                          </div>
                        );
                      })()}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xxs font-bold text-slate-600 uppercase">Appointment Date *</label>
                      <input
                        type="date"
                        required
                        value={formAppDate}
                        onChange={(e) => setFormAppDate(e.target.value)}
                        className="mt-1 w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:ring-1 focus:ring-emerald-500 focus:outline-none font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xxs font-bold text-slate-600 uppercase">Shift *</label>
                      <select
                        value={formShift}
                        onChange={(e) => setFormShift(Number(e.target.value) as 1 | 2)}
                        className="mt-1 w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:ring-1 focus:ring-emerald-500 focus:outline-none font-semibold"
                      >
                        <option value={1}>Morning Shift</option>
                        <option value={2}>Evening Shift</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between">
                      <label className="block text-xxs font-bold text-slate-600 uppercase">Appointment Fees (PKR)</label>
                      {/* Fee Quick Chips */}
                      <div className="flex items-center space-x-1.5">
                        <span className="text-[10px] text-slate-400 font-semibold">Presets:</span>
                        {[500, 1000, 1500, 2000].map((amt) => (
                          <button
                            key={amt}
                            type="button"
                            onClick={() => setFormFeeCharged(String(amt))}
                            className={`text-[10px] font-mono px-1.5 py-0.5 rounded transition ${
                              Number(formFeeCharged) === amt
                                ? 'bg-emerald-600 text-white font-bold'
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium'
                            }`}
                          >
                            {amt}
                          </button>
                        ))}
                      </div>
                    </div>
                    <input
                      type="number"
                      placeholder="0"
                      value={formFeeCharged}
                      onChange={(e) => setFormFeeCharged(e.target.value)}
                      className="mt-1 w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:ring-1 focus:ring-emerald-500 focus:outline-none font-mono font-bold text-emerald-800 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xxs font-bold text-slate-600 uppercase">Remarks / Chief Reason</label>
                    <input
                      type="text"
                      placeholder=""
                      value={formRemarks}
                      onChange={(e) => setFormRemarks(e.target.value)}
                      className="mt-1 w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div className="pt-2 flex items-center justify-end space-x-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setIsAddAppModalOpen(false)}
                      className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition cursor-pointer shadow-xs"
                    >
                      Confirm & Save Appointment
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* EDIT APPOINTMENT MODAL */}
          {editingApp && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="bg-blue-800 text-white p-4 flex items-center justify-between">
                  <h3 className="text-sm font-bold flex items-center space-x-2">
                    <Edit3 className="w-4 h-4 text-blue-300" />
                    <span>Edit Appointment ({editingApp.AppointmentID})</span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => setEditingApp(null)}
                    className="text-blue-200 hover:text-white transition cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSaveEditAppointment} className="p-5 space-y-4">
                  <div className="bg-slate-100 p-3 rounded-xl border border-slate-200 space-y-1">
                    <p className="text-xxs font-bold text-slate-500 uppercase">Patient Profile</p>
                    <p className="text-sm font-bold text-slate-900">{formPatientName}</p>
                    <p className="text-xs text-slate-600 font-mono">Patient ID: {editingApp.PatientID}</p>
                  </div>

                  <div>
                    <label className="block text-xxs font-bold text-slate-600 uppercase">Mobile Number</label>
                    <input
                      type="text"
                      placeholder=""
                      value={formPhoneMobile}
                      onChange={(e) => setFormPhoneMobile(e.target.value)}
                      className="mt-1 w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:ring-1 focus:ring-blue-500 focus:outline-none font-mono text-slate-900"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xxs font-bold text-slate-600 uppercase">Appointment Date *</label>
                      <input
                        type="date"
                        required
                        value={formAppDate}
                        onChange={(e) => setFormAppDate(e.target.value)}
                        className="mt-1 w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:ring-1 focus:ring-blue-500 focus:outline-none font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xxs font-bold text-slate-600 uppercase">Shift *</label>
                      <select
                        value={formShift}
                        onChange={(e) => setFormShift(Number(e.target.value) as 1 | 2)}
                        className="mt-1 w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:ring-1 focus:ring-blue-500 focus:outline-none font-semibold"
                      >
                        <option value={1}>Morning Shift</option>
                        <option value={2}>Evening Shift</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xxs font-bold text-slate-600 uppercase">Appointment Fees (PKR)</label>
                    <input
                      type="number"
                      placeholder=""
                      value={formFeeCharged}
                      onChange={(e) => setFormFeeCharged(e.target.value)}
                      className="mt-1 w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:ring-1 focus:ring-blue-500 focus:outline-none font-mono font-bold text-emerald-800 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xxs font-bold text-slate-600 uppercase">Remarks / Chief Reason</label>
                    <input
                      type="text"
                      placeholder=""
                      value={formRemarks}
                      onChange={(e) => setFormRemarks(e.target.value)}
                      className="mt-1 w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => handleDeleteAppointmentAction(editingApp.AppointmentID)}
                      className="px-3 py-2 bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-bold rounded-lg transition cursor-pointer flex items-center space-x-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>

                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => setEditingApp(null)}
                        className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition cursor-pointer shadow-xs"
                      >
                        Update Appointment
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
  );
}
