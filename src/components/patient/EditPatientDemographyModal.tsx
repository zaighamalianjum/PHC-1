import React, { useState, useEffect } from 'react';
import {
  X,
  Save,
  User,
  Phone,
  MapPin,
  Calendar,
  Briefcase,
  CheckCircle2,
  AlertCircle,
  UserPen,
  Mail,
  ShieldCheck
} from 'lucide-react';
import { Patient, City } from '../../types';
import CitySearchSelect from '../common/CitySearchSelect';
import { ensureAppFullScreen } from './patientDeskUtils';

interface EditPatientDemographyModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: Patient | null | undefined;
  onSave: (updatedPatient: Patient) => void;
  cities: City[];
}

export default function EditPatientDemographyModal({
  isOpen,
  onClose,
  patient,
  onSave,
  cities = []
}: EditPatientDemographyModalProps) {
  const [patientName, setPatientName] = useState('');
  const [fatherHusband, setFatherHusband] = useState('');
  const [ageYears, setAgeYears] = useState<number | string>('');
  const [sex, setSex] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [maritalStatus, setMaritalStatus] = useState<'Single' | 'Married' | 'Widowed' | 'Divorced'>('Single');
  const [mobilePhone, setMobilePhone] = useState('');
  const [phoneRes, setPhoneRes] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [cityId, setCityId] = useState<number>(1);
  const [occupation, setOccupation] = useState('');
  
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync state whenever the selected patient changes or modal opens
  useEffect(() => {
    if (patient && isOpen) {
      setPatientName(patient.PatientName || '');
      setFatherHusband(patient.Father_husband && patient.Father_husband !== 'N/A' ? patient.Father_husband : '');
      setAgeYears(patient.AgeYears !== undefined ? patient.AgeYears : '');
      setSex(patient.Sex === 'Female' ? 'Female' : patient.Sex === 'Other' ? 'Other' : 'Male');
      setMaritalStatus(
        patient.MaritalStatus === 'Married' || patient.MaritalStatus === 'Widowed' || patient.MaritalStatus === 'Divorced'
          ? patient.MaritalStatus
          : 'Single'
      );
      setMobilePhone(patient.PhoneMobile || '');
      setPhoneRes(patient.PhoneRes || '');
      setEmail(patient.Email || '');
      setAddress(patient.Address && patient.Address !== 'N/A' ? patient.Address : '');
      setCityId(patient.CityID || 1);
      setOccupation(patient.Occupation && patient.Occupation !== 'N/A' ? patient.Occupation : '');
      setErrorMsg('');
      setSuccessMsg('');
    }
  }, [patient, isOpen]);

  // Handle ESC key to safely exit modal
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleModalClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  if (!isOpen || !patient) return null;

  const handleModalClose = () => {
    setErrorMsg('');
    setSuccessMsg('');
    onClose();
    ensureAppFullScreen();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const cleanName = patientName.trim();
    if (!cleanName) {
      setErrorMsg('Patient Name is mandatory.');
      return;
    }

    const numAge = Number(ageYears);
    if (ageYears === '' || isNaN(numAge) || numAge < 0 || numAge > 130) {
      setErrorMsg('Please enter a valid age between 0 and 130 years.');
      return;
    }

    if (!sex) {
      setErrorMsg('Gender / Sex selection is mandatory.');
      return;
    }

    const cleanPhone = mobilePhone.trim();
    if (!cleanPhone) {
      setErrorMsg('Mobile Phone number is mandatory.');
      return;
    }

    // Pakistani mobile number validation: 03xx-xxxxxxx, 03xxxxxxxxx, or 11 digits
    const cleanDigits = cleanPhone.replace(/\D/g, '');
    const isPakMobile = /^03\d{2}-?\d{7}$/.test(cleanPhone) || (cleanDigits.length === 11 && cleanDigits.startsWith('03'));
    if (!isPakMobile && cleanDigits.length < 10) {
      setErrorMsg('Please enter a valid Pakistani mobile number (e.g. 0300-1234567 or 03001234567).');
      return;
    }

    setIsSubmitting(true);

    const updatedPatient: Patient = {
      ...patient,
      PatientID: patient.PatientID,
      PatientName: cleanName.toUpperCase(),
      Father_husband: fatherHusband.trim() || 'N/A',
      AgeYears: numAge,
      Sex: sex,
      MaritalStatus: maritalStatus,
      Occupation: occupation.trim() || 'N/A',
      Address: address.trim() || 'N/A',
      CityID: cityId,
      Country: 'Pakistan',
      PhoneMobile: cleanPhone,
      PhoneRes: phoneRes.trim() || undefined,
      Email: email.trim() || undefined,
      RegistrationDate: patient.RegistrationDate || new Date().toISOString().split('T')[0]
    };

    try {
      onSave(updatedPatient);
      setSuccessMsg(`Demographics for ${updatedPatient.PatientName} (${updatedPatient.PatientID}) saved successfully!`);
      
      // Auto close after brief confirmation
      setTimeout(() => {
        setIsSubmitting(false);
        handleModalClose();
      }, 700);
    } catch (err: any) {
      setIsSubmitting(false);
      setErrorMsg(err.message || 'Failed to save patient demographics.');
    }
  };

  return (
    <div
      className="fixed inset-0 bg-slate-900/75 backdrop-blur-xs flex items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleModalClose();
        }
      }}
    >
      <div 
        className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-demography-title"
      >
        {/* Header Bar */}
        <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
              <UserPen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 id="edit-demography-title" className="text-sm font-bold text-white tracking-tight">
                  Edit Patient Demography
                </h3>
                <span className="text-[11px] font-mono font-bold bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded border border-emerald-800">
                  {patient.PatientID}
                </span>
              </div>
              <p className="text-[11px] text-slate-300">
                Update demographic, contact & residential details without leaving Visit Desk
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleModalClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition cursor-pointer"
            title="Close (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 text-xs">
          {/* Alerts */}
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 flex items-center space-x-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span className="font-semibold text-xs">{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 flex items-center space-x-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-semibold text-xs">{successMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Patient Name */}
            <div className="sm:col-span-2">
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-700 mb-1">
                Patient Full Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  placeholder="e.g. AYMA AHSAN"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 focus:bg-white border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition uppercase"
                />
              </div>
            </div>

            {/* Father / Husband / Guardian */}
            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-700 mb-1">
                S/O, D/O, W/O (Father / Husband)
              </label>
              <input
                type="text"
                value={fatherHusband}
                onChange={(e) => setFatherHusband(e.target.value)}
                placeholder="e.g. MR AHSAN"
                className="w-full px-3 py-2 bg-slate-50 focus:bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
              />
            </div>

            {/* Age in Years */}
            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-700 mb-1">
                Age (Years) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="number"
                  required
                  min="0"
                  max="130"
                  value={ageYears}
                  onChange={(e) => setAgeYears(e.target.value)}
                  placeholder="e.g. 28"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 focus:bg-white border border-slate-300 rounded-xl font-bold font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                />
              </div>
            </div>

            {/* Gender / Sex */}
            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-700 mb-1">
                Gender / Sex <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {(['Male', 'Female', 'Other'] as const).map((genderOption) => (
                  <button
                    key={genderOption}
                    type="button"
                    onClick={() => setSex(genderOption)}
                    className={`py-2 px-2 rounded-xl text-xs font-bold transition border cursor-pointer text-center ${
                      sex === genderOption
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {genderOption}
                  </button>
                ))}
              </div>
            </div>

            {/* Marital Status */}
            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-700 mb-1">
                Marital Status
              </label>
              <select
                value={maritalStatus}
                onChange={(e) => setMaritalStatus(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-50 focus:bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
              >
                <option value="Single">Single</option>
                <option value="Married">Married</option>
                <option value="Widowed">Widowed</option>
                <option value="Divorced">Divorced</option>
              </select>
            </div>

            {/* Mobile Phone */}
            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-700 mb-1">
                Mobile Phone <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  value={mobilePhone}
                  onChange={(e) => setMobilePhone(e.target.value)}
                  placeholder="0300-1234567"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 focus:bg-white border border-slate-300 rounded-xl font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                />
              </div>
              <span className="text-[10px] text-slate-400 mt-0.5 block">Format: 03xx-xxxxxxx (Pakistani mobile)</span>
            </div>

            {/* Residence Phone / Alt */}
            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-700 mb-1">
                Phone Res / Alt Contact
              </label>
              <input
                type="text"
                value={phoneRes}
                onChange={(e) => setPhoneRes(e.target.value)}
                placeholder="e.g. 042-35123456"
                className="w-full px-3 py-2 bg-slate-50 focus:bg-white border border-slate-300 rounded-xl font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
              />
            </div>

            {/* City Selection */}
            <div>
              <CitySearchSelect
                cities={cities}
                selectedCityId={cityId}
                onSelectCity={(newCityId) => setCityId(newCityId)}
                label="City / Location"
                placeholder="Search city (e.g. Lahore, Rawalpindi)..."
              />
            </div>

            {/* Occupation */}
            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-700 mb-1">
                Occupation
              </label>
              <div className="relative">
                <Briefcase className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={occupation}
                  onChange={(e) => setOccupation(e.target.value)}
                  placeholder="e.g. Teacher, Student, Housewife"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 focus:bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                />
              </div>
            </div>

            {/* Residential Address */}
            <div className="sm:col-span-2">
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-700 mb-1">
                Residential / Street Address
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. House # 12, Street 4, Sector B"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 focus:bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                />
              </div>
            </div>

            {/* Email Address */}
            <div className="sm:col-span-2">
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-700 mb-1">
                Email Address (Optional)
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="patient@example.com"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 focus:bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            <div className="flex items-center space-x-1 text-[11px] text-slate-500">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Saves directly to Patient database</span>
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={handleModalClose}
                disabled={isSubmitting}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold rounded-xl shadow-md transition flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{isSubmitting ? 'Saving...' : 'Save Demographics'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
