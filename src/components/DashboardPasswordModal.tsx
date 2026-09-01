/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Lock, ShieldCheck, Eye, EyeOff, X, KeyRound, AlertCircle } from 'lucide-react';
import { User } from '../types';

interface DashboardPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  currentUser: User;
}

export const DashboardPasswordModal: React.FC<DashboardPasswordModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  currentUser
}) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    // Strict Admin Role Check
    if (currentUser.Role !== 'Administrator') {
      setErrorMsg('Access Denied: Only Administrators are allowed to access the Dashboard.');
      return;
    }

    if (!password) {
      setErrorMsg('Please enter your administrator password.');
      return;
    }

    setIsVerifying(true);
    setTimeout(() => {
      // Validate password with current user password hash
      if (password === currentUser.PasswordHash) {
        setIsVerifying(false);
        setPassword('');
        setErrorMsg('');
        onSuccess();
      } else {
        setIsVerifying(false);
        setErrorMsg('Incorrect Password. Please enter your valid administrator password.');
      }
    }, 150);
  };

  const handleClose = () => {
    setPassword('');
    setErrorMsg('');
    setIsVerifying(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn">
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-scaleUp"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 p-5 text-white flex items-center justify-between relative">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-blue-600/40 rounded-xl border border-blue-400/40 shadow-inner">
              <Lock className="w-5 h-5 text-blue-200" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white flex items-center space-x-1.5">
                <span>Admin Password Required</span>
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
              </h3>
              <p className="text-[11px] text-blue-200/90 font-medium mt-0.5">
                Enter your password to unlock the Executive Dashboard
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
            title="Cancel"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-blue-50/80 border border-blue-200/80 rounded-xl p-3 flex items-center space-x-3">
            <div className="w-9 h-9 rounded-full bg-blue-600 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-xs uppercase">
              {currentUser.FullName ? currentUser.FullName.charAt(0) : 'A'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-slate-900 truncate">{currentUser.FullName}</p>
              <div className="flex items-center space-x-2 text-[11px] text-slate-600">
                <span className="font-semibold text-blue-700">{currentUser.Role}</span>
                <span>•</span>
                <span className="font-mono text-slate-500">ID: {currentUser.LoginName}</span>
              </div>
            </div>
          </div>

          {errorMsg && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3 rounded-xl text-xs font-semibold flex items-start space-x-2 animate-fadeIn">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
              <span>Password</span>
              <span className="text-[10px] text-slate-500 font-normal">Administrator credentials</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <KeyRound className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                autoFocus
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errorMsg) setErrorMsg('');
                }}
                placeholder="Enter your password..."
                className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-10 py-2.5 text-xs font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition shadow-2xs"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Buttons */}
          <div className="pt-3 flex items-center space-x-2 justify-end border-t border-slate-100">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isVerifying || !password}
              className="px-5 py-2 rounded-xl text-xs font-extrabold bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white transition flex items-center space-x-1.5 shadow-md hover:shadow-lg disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
            >
              {isVerifying ? (
                <span>Verifying...</span>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5" />
                  <span>Unlock Dashboard</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DashboardPasswordModal;
