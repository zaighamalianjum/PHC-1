/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  X, 
  Check, 
  ShieldCheck, 
  Sliders, 
  Eye, 
  EyeOff, 
  Printer, 
  Upload, 
  FileText, 
  Users, 
  Briefcase, 
  Building2, 
  ShoppingCart, 
  Database, 
  Settings, 
  Calendar, 
  PieChart, 
  Landmark, 
  Boxes, 
  BarChart3, 
  Undo2, 
  History, 
  Tag, 
  Smartphone, 
  UserPlus, 
  ListOrdered, 
  Ticket, 
  Stethoscope, 
  LayoutGrid, 
  CalendarPlus, 
  Edit3, 
  Ban, 
  Trash2, 
  CheckCircle2, 
  Download, 
  UserCheck, 
  Shield, 
  Lock,
  Sparkles,
  Key,
  Layers
} from 'lucide-react';
import { User, UserRight } from '../types';

export interface MainMenuDefinition {
  id: string;
  name: string;
  permKey: keyof NonNullable<User['Permissions']>;
  menuRightId: string;
  icon: any;
  color: string;
  desc: string;
  subMenus: {
    key: keyof NonNullable<User['Permissions']>;
    label: string;
    icon: any;
    desc: string;
  }[];
  actionItems: {
    key: keyof NonNullable<User['Permissions']>;
    label: string;
    icon: any;
    desc: string;
    type?: 'action' | 'print' | 'feature';
  }[];
}

interface MainMenuConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  mainMenu?: MainMenuDefinition | null;
  menu?: MainMenuDefinition | null;
  targetUser?: User | null;
  user?: User | null;
  currentUser?: User | null;
  accessPermissions?: NonNullable<User['Permissions']>;
  permissions?: NonNullable<User['Permissions']>;
  onTogglePermission?: (key: keyof NonNullable<User['Permissions']>) => void;
  onSetPermissions?: React.Dispatch<React.SetStateAction<NonNullable<User['Permissions']>>>;
  accessUserRights?: UserRight[];
  userRights?: UserRight[];
  onToggleUserRight?: (menuId: string, field: 'Status' | 'AddRec' | 'PostRec' | 'CancelPosted' | 'PrintRec' | 'ExportRec') => void;
  onApproveAndSave?: () => void;
}

export const MainMenuConfigModal: React.FC<MainMenuConfigModalProps> = ({
  isOpen,
  onClose,
  mainMenu: propMainMenu,
  menu: propMenu,
  targetUser: propTargetUser,
  user: propUser,
  currentUser: propCurrentUser,
  accessPermissions: propAccessPermissions,
  permissions: propPermissions,
  onTogglePermission = (_key: keyof NonNullable<User['Permissions']>) => {},
  onSetPermissions,
  accessUserRights: propAccessUserRights,
  userRights: propUserRights,
  onToggleUserRight = (_menuId: string, _field: 'Status' | 'AddRec' | 'PostRec' | 'CancelPosted' | 'PrintRec' | 'ExportRec') => {},
  onApproveAndSave = () => {}
}) => {
  const [activeTab, setActiveTab] = useState<'submenus' | 'items' | 'rights'>('submenus');

  const mainMenu = propMainMenu || propMenu;
  const targetUser = propTargetUser || propUser || { FullName: 'Staff User', Role: 'Doctor' as const, UserID: 'USR-01' };
  const currentUser = propCurrentUser || { FullName: 'Administrator', LoginName: 'admin', Role: 'Administrator' as const, UserID: 'USR-00' };
  const accessPermissions = propAccessPermissions || propPermissions || {} as NonNullable<User['Permissions']>;
  const accessUserRights = propAccessUserRights || propUserRights || [];

  if (!isOpen || !mainMenu) return null;

  const currentRight = accessUserRights.find(r => r.MenuID === mainMenu.menuRightId);
  const isMainMenuActive = !!accessPermissions[mainMenu.permKey];

  // Helper to enable all submenus for this main menu
  const handleEnableAllSubMenus = () => {
    if (onSetPermissions) {
      onSetPermissions(prev => {
        const next = { ...prev, [mainMenu.permKey]: true };
        mainMenu.subMenus.forEach(sub => {
          (next as any)[sub.key] = true;
        });
        return next;
      });
    } else {
      if (!accessPermissions[mainMenu.permKey]) {
        onTogglePermission(mainMenu.permKey);
      }
      mainMenu.subMenus.forEach(sub => {
        if (!accessPermissions[sub.key]) {
          onTogglePermission(sub.key);
        }
      });
    }
  };

  // Helper to disable all submenus
  const handleDisableAllSubMenus = () => {
    if (onSetPermissions) {
      onSetPermissions(prev => {
        const next = { ...prev };
        mainMenu.subMenus.forEach(sub => {
          (next as any)[sub.key] = false;
        });
        return next;
      });
    } else {
      mainMenu.subMenus.forEach(sub => {
        if (accessPermissions[sub.key] !== false) {
          onTogglePermission(sub.key);
        }
      });
    }
  };

  // Helper to enable all action items for this main menu
  const handleEnableAllItems = () => {
    if (onSetPermissions) {
      onSetPermissions(prev => {
        const next = { ...prev };
        mainMenu.actionItems.forEach(item => {
          (next as any)[item.key] = true;
        });
        return next;
      });
    } else {
      mainMenu.actionItems.forEach(item => {
        if (!accessPermissions[item.key]) {
          onTogglePermission(item.key);
        }
      });
    }
  };

  // Helper to disable all action items
  const handleDisableAllItems = () => {
    if (onSetPermissions) {
      onSetPermissions(prev => {
        const next = { ...prev };
        mainMenu.actionItems.forEach(item => {
          (next as any)[item.key] = false;
        });
        return next;
      });
    } else {
      mainMenu.actionItems.forEach(item => {
        if (accessPermissions[item.key] !== false) {
          onTogglePermission(item.key);
        }
      });
    }
  };

  const allowedSubCount = mainMenu.subMenus.filter(sub => accessPermissions[sub.key] !== false).length;
  const allowedItemCount = mainMenu.actionItems.filter(item => accessPermissions[item.key] !== false).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs animate-fadeIn overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-scaleUp">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-purple-950 p-6 text-white border-b border-indigo-900/50 flex items-start justify-between">
          <div className="flex items-center space-x-3.5">
            <div className="p-3 bg-indigo-600/30 rounded-2xl border border-indigo-400/30 text-indigo-300">
              <mainMenu.icon className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-500/30 text-indigo-200 px-2 py-0.5 rounded-md border border-indigo-400/30">
                  Step 2 & 3: Granular Menu & Item Access
                </span>
                <span className="text-[10px] font-bold bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-md border border-amber-400/30">
                  Target: {targetUser.FullName} ({targetUser.Role})
                </span>
              </div>
              <h3 className="text-lg font-black text-white mt-1 flex items-center space-x-2">
                <span>{mainMenu.name}</span>
              </h3>
              <p className="text-xs text-indigo-200/80 mt-0.5">
                {mainMenu.desc}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs inside Pop-up */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex space-x-2">
            <button
              type="button"
              onClick={() => setActiveTab('submenus')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition flex items-center space-x-2 ${
                activeTab === 'submenus'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Sub-Menus & Desks ({allowedSubCount}/{mainMenu.subMenus.length})</span>
            </button>

            {mainMenu.actionItems.length > 0 && (
              <button
                type="button"
                onClick={() => setActiveTab('items')}
                className={`px-4 py-2 rounded-xl text-xs font-black transition flex items-center space-x-2 ${
                  activeTab === 'items'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Sliders className="w-4 h-4" />
                <span>Show / Hide Items ({allowedItemCount}/{mainMenu.actionItems.length})</span>
              </button>
            )}

            {currentRight && (
              <button
                type="button"
                onClick={() => setActiveTab('rights')}
                className={`px-4 py-2 rounded-xl text-xs font-black transition flex items-center space-x-2 ${
                  activeTab === 'rights'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Key className="w-4 h-4" />
                <span>Action Rights (Add/Post/Print)</span>
              </button>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {activeTab === 'submenus' && (
              <>
                <button
                  type="button"
                  onClick={handleEnableAllSubMenus}
                  className="px-2.5 py-1 text-xxs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition"
                >
                  Allow All Sub-Menus
                </button>
                <button
                  type="button"
                  onClick={handleDisableAllSubMenus}
                  className="px-2.5 py-1 text-xxs font-bold bg-slate-100 text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-200 transition"
                >
                  Restrict All
                </button>
              </>
            )}

            {activeTab === 'items' && (
              <>
                <button
                  type="button"
                  onClick={handleEnableAllItems}
                  className="px-2.5 py-1 text-xxs font-bold bg-purple-50 text-purple-700 border border-purple-200 rounded-lg hover:bg-purple-100 transition"
                >
                  Allow All Items
                </button>
                <button
                  type="button"
                  onClick={handleDisableAllItems}
                  className="px-2.5 py-1 text-xxs font-bold bg-slate-100 text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-200 transition"
                >
                  Hide All
                </button>
              </>
            )}
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          
          {/* Main Menu Overall Status Bar */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`w-3 h-3 rounded-full ${isMainMenuActive ? 'bg-emerald-500 animate-pulse' : 'bg-rose-400'}`} />
              <div>
                <span className="text-xs font-black text-slate-800 block">
                  Main Menu Access Switch: {isMainMenuActive ? 'ALLOWED & ENABLED' : 'RESTRICTED / DISABLED'}
                </span>
                <span className="text-[11px] text-slate-500">
                  Toggle main navigation bar button for "{mainMenu.name}"
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onTogglePermission(mainMenu.permKey)}
              className={`px-4 py-1.5 rounded-xl font-bold text-xs transition border cursor-pointer flex items-center space-x-1.5 ${
                isMainMenuActive
                  ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                  : 'bg-rose-100 text-rose-800 border-rose-200 hover:bg-rose-200'
              }`}
            >
              {isMainMenuActive ? (
                <>
                  <Eye className="w-3.5 h-3.5" />
                  <span>Allowed</span>
                </>
              ) : (
                <>
                  <EyeOff className="w-3.5 h-3.5" />
                  <span>Disabled</span>
                </>
              )}
            </button>
          </div>

          {/* TAB 1: Sub-Menus Selection */}
          {activeTab === 'submenus' && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-black text-slate-900 flex items-center space-x-2">
                  <Layers className="w-4 h-4 text-indigo-600" />
                  <span>Select & Allow Sub-Menus / Sub-Desks</span>
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Choose which individual screens and sub-desks within "{mainMenu.name}" are accessible to <strong className="text-slate-800">{targetUser.FullName}</strong>.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {mainMenu.subMenus.map((sub) => {
                  const isEnabled = accessPermissions[sub.key] !== false;
                  return (
                    <label
                      key={sub.key}
                      onClick={() => onTogglePermission(sub.key)}
                      className={`p-4 rounded-2xl border transition-all flex items-start justify-between cursor-pointer select-none ${
                        isEnabled
                          ? 'bg-indigo-50/70 border-indigo-300 text-slate-900 shadow-2xs'
                          : 'bg-slate-50 border-slate-200 text-slate-500 opacity-60 hover:opacity-100'
                      }`}
                    >
                      <div className="space-y-1 pr-3">
                        <div className="flex items-center space-x-2 font-black text-xs">
                          <div className={`p-1.5 rounded-lg ${isEnabled ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
                            <sub.icon className="w-3.5 h-3.5" />
                          </div>
                          <span>{sub.label}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 font-medium">{sub.desc}</p>
                      </div>

                      <div className="mt-1 shrink-0">
                        <div className={`w-9 h-5 rounded-full transition-colors relative ${isEnabled ? 'bg-indigo-600' : 'bg-slate-300'}`}>
                          <div className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition-transform ${isEnabled ? 'left-4.5' : 'left-0.5'}`} />
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: Item-Level Show / Hide Controls */}
          {activeTab === 'items' && mainMenu.actionItems.length > 0 && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-black text-slate-900 flex items-center space-x-2">
                  <Sliders className="w-4 h-4 text-purple-600" />
                  <span>Item-Level Show / Hide & Action Controls</span>
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Configure visibility for individual form buttons, printing templates, and operational actions for <strong className="text-slate-800">{targetUser.FullName}</strong>.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {mainMenu.actionItems.map((item) => {
                  const isEnabled = accessPermissions[item.key] !== false;
                  return (
                    <label
                      key={item.key}
                      onClick={() => onTogglePermission(item.key)}
                      className={`p-4 rounded-2xl border transition-all flex items-start justify-between cursor-pointer select-none ${
                        isEnabled
                          ? 'bg-purple-50/70 border-purple-300 text-slate-900 shadow-2xs'
                          : 'bg-slate-50 border-slate-200 text-slate-500 opacity-60 hover:opacity-100'
                      }`}
                    >
                      <div className="space-y-1 pr-3">
                        <div className="flex items-center space-x-2 font-black text-xs">
                          <div className={`p-1.5 rounded-lg ${isEnabled ? 'bg-purple-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
                            <item.icon className="w-3.5 h-3.5" />
                          </div>
                          <span>{item.label}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 font-medium">{item.desc}</p>
                      </div>

                      <div className="mt-1 shrink-0">
                        {isEnabled ? (
                          <span className="flex items-center space-x-1 px-2.5 py-1 bg-purple-100 text-purple-800 text-[10px] font-black rounded-lg border border-purple-300">
                            <Eye className="w-3 h-3 text-purple-700" />
                            <span>Visible</span>
                          </span>
                        ) : (
                          <span className="flex items-center space-x-1 px-2.5 py-1 bg-slate-200 text-slate-600 text-[10px] font-bold rounded-lg border border-slate-300">
                            <EyeOff className="w-3 h-3 text-slate-500" />
                            <span>Hidden</span>
                          </span>
                        )}
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: Action Rights (Add/Post/Cancel/Print/Export) */}
          {activeTab === 'rights' && currentRight && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-black text-slate-900 flex items-center space-x-2">
                  <Key className="w-4 h-4 text-emerald-600" />
                  <span>Menu Action Rights Matrix</span>
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Set transaction recording and cancellation privileges for <strong className="text-slate-800">{targetUser.FullName}</strong>.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {[
                  { field: 'AddRec' as const, label: 'Add Record / Create', desc: 'Allows saving new records', val: currentRight.AddRec, color: 'emerald' },
                  { field: 'PostRec' as const, label: 'Post Record / Finalize', desc: 'Allows finalizing transactions', val: currentRight.PostRec, color: 'indigo' },
                  { field: 'CancelPosted' as const, label: 'Cancel / Void Record', desc: 'Authorized to strike out/reverse', val: currentRight.CancelPosted, color: 'rose' },
                  { field: 'PrintRec' as const, label: 'Print Slips & Documents', desc: 'Allows generating printouts', val: currentRight.PrintRec !== false, color: 'amber' },
                  { field: 'ExportRec' as const, label: 'Export Data to CSV/Excel', desc: 'Allows spreadsheet downloads', val: currentRight.ExportRec !== false, color: 'teal' }
                ].map((act) => (
                  <div
                    key={act.field}
                    onClick={() => onToggleUserRight(currentRight.MenuID, act.field)}
                    className={`p-4 rounded-2xl border transition-all flex items-start justify-between cursor-pointer select-none ${
                      act.val
                        ? 'bg-slate-50 border-slate-300 text-slate-900 shadow-2xs'
                        : 'bg-slate-50/50 border-slate-200 text-slate-400 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <div className="space-y-1">
                      <span className="font-black text-xs block text-slate-900">{act.label}</span>
                      <p className="text-[11px] text-slate-500">{act.desc}</p>
                    </div>

                    <div className="mt-0.5 shrink-0">
                      <span className={`px-2.5 py-1 text-[10px] font-black rounded-lg border ${
                        act.val ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-slate-200 text-slate-600 border-slate-300'
                      }`}>
                        {act.val ? 'Allowed' : 'Locked'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="bg-slate-900 p-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-white">
          <div className="flex items-center space-x-2 text-xs text-slate-300">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              Configured by Administrator: <strong className="text-white">{currentUser.FullName || currentUser.LoginName}</strong>
            </span>
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 text-xs font-bold transition"
            >
              Keep in Draft & Close
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                onApproveAndSave();
              }}
              className="w-full sm:w-auto px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black shadow-md transition flex items-center justify-center space-x-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Confirm & Approve Access</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
