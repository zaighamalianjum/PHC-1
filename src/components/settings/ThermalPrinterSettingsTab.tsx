/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Printer,
  Sliders,
  Maximize2,
  Minimize2,
  ZoomIn,
  Type,
  AlignLeft,
  CheckCircle2,
  RefreshCw,
  Sparkles,
  Receipt,
  Ticket,
  Scissors,
  Save,
  RotateCcw,
  Eye,
  Info,
  Layers,
  FileSpreadsheet
} from 'lucide-react';
import { ThermalPrinterSettings, ClinicSettings } from '../../types';
import {
  DEFAULT_THERMAL_SETTINGS,
  THERMAL_PRESETS,
  getThermalSettings,
  saveThermalSettings,
  printThermalTestSlip,
  generateThermalStyles
} from '../../utils/thermalPrinterConfig';

interface ThermalPrinterSettingsTabProps {
  clinicSettings: ClinicSettings;
}

export const ThermalPrinterSettingsTab: React.FC<ThermalPrinterSettingsTabProps> = ({
  clinicSettings
}) => {
  const [settings, setSettings] = useState<ThermalPrinterSettings>(getThermalSettings());
  const [previewMode, setPreviewMode] = useState<'pharmacy' | 'token'>('pharmacy');
  const [activePresetId, setActivePresetId] = useState<string>('pos_80mm_standard');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSaved, setIsSaved] = useState(true);

  useEffect(() => {
    const current = getThermalSettings();
    setSettings(current);
  }, []);

  const updateSetting = <K extends keyof ThermalPrinterSettings>(
    key: K,
    value: ThermalPrinterSettings[K]
  ) => {
    setSettings(prev => {
      const next = { ...prev, [key]: value };
      setIsSaved(false);
      return next;
    });
    setActivePresetId('custom');
  };

  const handleApplyPreset = (presetId: string) => {
    const preset = THERMAL_PRESETS.find(p => p.id === presetId);
    if (!preset) return;
    const nextSettings: ThermalPrinterSettings = {
      ...settings,
      ...preset.settings
    };
    setSettings(nextSettings);
    setActivePresetId(presetId);
    setIsSaved(false);
  };

  const handleSave = () => {
    saveThermalSettings(settings);
    setIsSaved(true);
    setSuccessMsg('Thermal Printer configuration saved and applied across all POS and Token print modules!');
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const handleResetDefaults = () => {
    if (window.confirm('Reset all thermal printer dimensions, margins, and typography to system defaults (80mm standard)?')) {
      setSettings({ ...DEFAULT_THERMAL_SETTINGS });
      saveThermalSettings({ ...DEFAULT_THERMAL_SETTINGS });
      setActivePresetId('pos_80mm_standard');
      setIsSaved(true);
      setSuccessMsg('Thermal Printer configuration reset to defaults successfully.');
      setTimeout(() => setSuccessMsg(''), 4000);
    }
  };

  const handleTestPrint = () => {
    printThermalTestSlip(settings, clinicSettings, previewMode);
  };

  // Derived styles for live preview container
  const previewFontFam = settings.fontFamily === 'sans-serif'
    ? 'Arial, sans-serif'
    : settings.fontFamily === 'courier'
      ? '"Courier New", Courier, monospace'
      : '"Courier New", Courier, Monaco, monospace';

  const previewDivider = settings.dividerStyle === 'dotted'
    ? '1.5px dotted #000000'
    : settings.dividerStyle === 'solid'
      ? '1.5px solid #000000'
      : settings.dividerStyle === 'double'
        ? '3px double #000000'
        : '1.5px dashed #000000';

  const clinicName = clinicSettings?.ClinicName || 'PUNJAB HOMEOPATHIC CLINIC & PHARMACY';
  const cPhone = clinicSettings?.PhoneMobile || '+92-311-4000608';
  const cAddress = clinicSettings?.ClinicAddress || '10 Shalimar Road, Garhi Shahu, Lahore';
  const cWebsite = clinicSettings?.Website || 'https://punjabhomeopathic.pk';

  return (
    <div className="space-y-6" id="thermal-settings-tab-root">
      {/* Top Banner & Quick Presets */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl border border-blue-200 shadow-xs">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                <span>Thermal Printer Hardware & Layout Setup</span>
                {!isSaved && (
                  <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold rounded-full animate-pulse">
                    Unsaved Changes
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Customize paper roll dimensions, printable widths, margins, scaling, font density and auto-cutter feed
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleResetDefaults}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg transition border border-slate-200 flex items-center gap-1.5 cursor-pointer"
              title="Reset all settings to standard 80mm defaults"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Defaults</span>
            </button>
            <button
              type="button"
              onClick={handleSave}
              className={`px-4 py-1.5 font-bold text-xs rounded-lg shadow-xs flex items-center gap-1.5 transition cursor-pointer ${
                isSaved
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white ring-2 ring-blue-400'
              }`}
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaved ? 'Settings Saved' : 'Save Configuration'}</span>
            </button>
          </div>
        </div>

        {/* Preset Selector Chips */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>Standard Hardware Profile Presets</span>
            </span>
            <span className="text-[10px] text-slate-400 font-medium">Click a profile to auto-apply standard dimensions</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
            {THERMAL_PRESETS.map(preset => {
              const isSelected = activePresetId === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleApplyPreset(preset.id)}
                  className={`p-2.5 rounded-xl border text-left transition relative cursor-pointer ${
                    isSelected
                      ? 'bg-blue-50/80 border-blue-500 ring-1 ring-blue-500 shadow-xs'
                      : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-[10px] font-black uppercase px-1.5 py-0.5 rounded ${
                      isSelected ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700'
                    }`}>
                      {preset.badge}
                    </span>
                    {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />}
                  </div>
                  <div className="text-xs font-bold text-slate-900 truncate">{preset.name}</div>
                  <div className="text-[10px] text-slate-500 line-clamp-2 mt-0.5">{preset.description}</div>
                </button>
              );
            })}
          </div>
        </div>

        {successMsg && (
          <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-lg text-emerald-800 text-xs font-semibold shadow-xs flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}
      </div>

      {/* Main Two-Column Layout: Controls & Live Mockup */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Configuration Controls (7 Columns) */}
        <div className="lg:col-span-7 space-y-5">
          
          {/* Group 1: Paper Dimensions & Printable Area */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center space-x-2 border-b border-slate-100 pb-2.5">
              <Maximize2 className="w-4 h-4 text-indigo-600" />
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                1. Paper Dimensions & Printable Width
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              
              {/* Paper Roll Physical Width */}
              <div className="space-y-1">
                <label className="block font-bold text-slate-700">
                  Paper Roll Total Width (mm)
                </label>
                <div className="flex gap-2">
                  <select
                    value={[80, 76, 58, 57].includes(settings.paperWidth) ? settings.paperWidth : 'custom'}
                    onChange={(e) => {
                      if (e.target.value === 'custom') return;
                      const val = Number(e.target.value);
                      updateSetting('paperWidth', val);
                      if (val === 58 || val === 57) {
                        updateSetting('printableWidth', 48);
                      } else if (val === 80) {
                        updateSetting('printableWidth', 72);
                      }
                    }}
                    className="flex-1 p-2 bg-slate-50 border border-slate-300 rounded-lg font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={80}>80mm (Standard 3.15" Roll - Recommended)</option>
                    <option value={76}>76mm (Standard 3.0" Roll)</option>
                    <option value={58}>58mm (Compact 2.28" Roll)</option>
                    <option value={57}>57mm (Compact 2.25" Roll)</option>
                    <option value="custom">Custom Width (mm)</option>
                  </select>
                  <input
                    type="number"
                    min={40}
                    max={120}
                    value={settings.paperWidth}
                    onChange={(e) => updateSetting('paperWidth', Math.max(40, Math.min(120, Number(e.target.value) || 80)))}
                    className="w-18 p-2 bg-slate-50 border border-slate-300 rounded-lg text-center font-mono font-bold text-slate-900"
                    title="Exact width in mm"
                  />
                </div>
                <p className="text-[10px] text-slate-500">Total physical width of paper roll inside printer</p>
              </div>

              {/* Printable Content Safe Width */}
              <div className="space-y-1">
                <label className="block font-bold text-slate-700">
                  Printable Content Width (mm)
                </label>
                <div className="flex gap-2">
                  <select
                    value={[76, 72, 70, 68, 54, 48].includes(settings.printableWidth) ? settings.printableWidth : 'custom'}
                    onChange={(e) => {
                      if (e.target.value === 'custom') return;
                      updateSetting('printableWidth', Number(e.target.value));
                    }}
                    className="flex-1 p-2 bg-slate-50 border border-slate-300 rounded-lg font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={76}>76mm (Full Edge-to-Edge)</option>
                    <option value={72}>72mm (Standard Safe 80mm - 576 dots)</option>
                    <option value={70}>70mm (Narrow Safe 80mm)</option>
                    <option value={68}>68mm (Compact Safe 80mm)</option>
                    <option value={54}>54mm (Wide 58mm Roll)</option>
                    <option value={48}>48mm (Standard 58mm - 384 dots)</option>
                    <option value="custom">Custom Width (mm)</option>
                  </select>
                  <input
                    type="number"
                    min={35}
                    max={settings.paperWidth}
                    value={settings.printableWidth}
                    onChange={(e) => updateSetting('printableWidth', Math.max(35, Math.min(settings.paperWidth, Number(e.target.value) || 72)))}
                    className="w-18 p-2 bg-slate-50 border border-slate-300 rounded-lg text-center font-mono font-bold text-slate-900"
                    title="Printable area in mm"
                  />
                </div>
                <p className="text-[10px] text-slate-500">Effective printable width so text never cuts off edges</p>
              </div>

              {/* Paper Height Mode */}
              <div className="space-y-1">
                <label className="block font-bold text-slate-700">
                  Paper Height & Cut Mode
                </label>
                <select
                  value={settings.paperHeightMode}
                  onChange={(e) => updateSetting('paperHeightMode', e.target.value as 'auto' | 'fixed')}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value="auto">Continuous Roll (Auto Height per Receipt items)</option>
                  <option value="fixed">Fixed Page Length (Cut at fixed mm)</option>
                </select>
              </div>

              {/* Fixed Height mm (if mode == fixed) */}
              {settings.paperHeightMode === 'fixed' && (
                <div className="space-y-1 animate-fadeIn">
                  <label className="block font-bold text-slate-700">
                    Fixed Cut Length (mm)
                  </label>
                  <input
                    type="number"
                    min={100}
                    max={500}
                    step={10}
                    value={settings.fixedHeightMm}
                    onChange={(e) => updateSetting('fixedHeightMm', Number(e.target.value) || 200)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold text-slate-900"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Group 2: Margins & Auto-Cut Spacing */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center space-x-2 border-b border-slate-100 pb-2.5">
              <Sliders className="w-4 h-4 text-emerald-600" />
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                2. Print Margins & Auto-Cutter Feed Spacing
              </h3>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              {/* Left Margin */}
              <div className="space-y-1">
                <label className="block font-bold text-slate-700">Left Margin</label>
                <select
                  value={settings.marginLeft}
                  onChange={(e) => updateSetting('marginLeft', Number(e.target.value))}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold text-slate-800"
                >
                  <option value={0}>0 mm (Zero)</option>
                  <option value={0.5}>0.5 mm</option>
                  <option value={1}>1.0 mm (Std)</option>
                  <option value={1.5}>1.5 mm</option>
                  <option value={2}>2.0 mm</option>
                  <option value={3}>3.0 mm</option>
                </select>
              </div>

              {/* Right Margin */}
              <div className="space-y-1">
                <label className="block font-bold text-slate-700">Right Margin</label>
                <select
                  value={settings.marginRight}
                  onChange={(e) => updateSetting('marginRight', Number(e.target.value))}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold text-slate-800"
                >
                  <option value={0}>0 mm (Zero)</option>
                  <option value={0.5}>0.5 mm</option>
                  <option value={1}>1.0 mm (Std)</option>
                  <option value={1.5}>1.5 mm</option>
                  <option value={2}>2.0 mm</option>
                  <option value={3}>3.0 mm</option>
                </select>
              </div>

              {/* Top Margin */}
              <div className="space-y-1">
                <label className="block font-bold text-slate-700">Top Margin</label>
                <select
                  value={settings.marginTop}
                  onChange={(e) => updateSetting('marginTop', Number(e.target.value))}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold text-slate-800"
                >
                  <option value={0}>0 mm</option>
                  <option value={1}>1.0 mm (Std)</option>
                  <option value={2}>2.0 mm</option>
                  <option value={3}>3.0 mm</option>
                  <option value={5}>5.0 mm</option>
                </select>
              </div>

              {/* Bottom Cut Feed Margin */}
              <div className="space-y-1">
                <label className="block font-bold text-slate-700">Cutter Feed Spacing</label>
                <select
                  value={settings.marginBottom}
                  onChange={(e) => updateSetting('marginBottom', Number(e.target.value))}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold text-emerald-800"
                >
                  <option value={2}>2 mm (Eco)</option>
                  <option value={5}>5 mm (Compact)</option>
                  <option value={8}>8 mm (Standard)</option>
                  <option value={10}>10 mm (Safe)</option>
                  <option value={15}>15 mm (Long Feed)</option>
                  <option value={20}>20 mm (Extended)</option>
                </select>
              </div>
            </div>
            <p className="text-[10px] text-slate-500">
              💡 <b>Cutter Feed Spacing:</b> Distance between the bottom of receipt text and printer tear bar / autocut blade.
            </p>
          </div>

          {/* Group 3: Typography, Density & Scaling */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center space-x-2 border-b border-slate-100 pb-2.5">
              <Type className="w-4 h-4 text-purple-600" />
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                3. Font Scaling, Density & Typography
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              
              {/* Zoom Scale Factor */}
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="font-bold text-slate-700">Scaling / Zoom</label>
                  <span className="font-mono font-bold text-blue-600">{settings.scalePercent}%</span>
                </div>
                <select
                  value={settings.scalePercent}
                  onChange={(e) => updateSetting('scalePercent', Number(e.target.value))}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold text-slate-800"
                >
                  <option value={80}>80% (Ultra-Compact)</option>
                  <option value={85}>85% (High Density)</option>
                  <option value={90}>90% (Compact)</option>
                  <option value={95}>95% (Fitted)</option>
                  <option value={100}>100% (Standard Scale)</option>
                  <option value={105}>105% (Slightly Enlarged)</option>
                  <option value={110}>110% (Large Print)</option>
                </select>
              </div>

              {/* Base Font Size */}
              <div className="space-y-1">
                <label className="block font-bold text-slate-700">Base Font Size</label>
                <select
                  value={settings.baseFontSize}
                  onChange={(e) => updateSetting('baseFontSize', Number(e.target.value))}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-bold text-slate-800"
                >
                  <option value={9.5}>9.5 px (Ultra-Small 58mm)</option>
                  <option value={10.5}>10.5 px (Compact)</option>
                  <option value={11.5}>11.5 px (Standard POS Receipt)</option>
                  <option value={12.5}>12.5 px (Large Clear)</option>
                  <option value={13.5}>13.5 px (Extra Large)</option>
                </select>
              </div>

              {/* Line Height Spacing */}
              <div className="space-y-1">
                <label className="block font-bold text-slate-700">Line Spacing</label>
                <select
                  value={settings.lineHeight}
                  onChange={(e) => updateSetting('lineHeight', Number(e.target.value))}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-bold text-slate-800"
                >
                  <option value={1.15}>1.15 (Tight Eco-Spacing)</option>
                  <option value={1.25}>1.25 (Standard POS Spacing)</option>
                  <option value={1.35}>1.35 (Relaxed Legible)</option>
                  <option value={1.50}>1.50 (Spacious)</option>
                </select>
              </div>

              {/* Font Family */}
              <div className="space-y-1">
                <label className="block font-bold text-slate-700">Font Typeface</label>
                <select
                  value={settings.fontFamily}
                  onChange={(e) => updateSetting('fontFamily', e.target.value as any)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-bold text-slate-800"
                >
                  <option value="monospace">Monospace (Crisp Courier POS Alignment)</option>
                  <option value="sans-serif">Sans-Serif (Clean Modern Arial)</option>
                  <option value="courier">Courier New Classic</option>
                </select>
              </div>

              {/* Header Title Size */}
              <div className="space-y-1">
                <label className="block font-bold text-slate-700">Clinic Name Font Size</label>
                <select
                  value={settings.headerTitleSize}
                  onChange={(e) => updateSetting('headerTitleSize', Number(e.target.value))}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-bold text-slate-800"
                >
                  <option value={12}>12 px (Small)</option>
                  <option value={13}>13 px (Compact)</option>
                  <option value={14}>14 px (Standard 80mm)</option>
                  <option value={15}>15 px (Prominent Bold)</option>
                  <option value={16.5}>16.5 px (Large Banner)</option>
                </select>
              </div>

              {/* Divider Style */}
              <div className="space-y-1">
                <label className="block font-bold text-slate-700">Section Divider Style</label>
                <select
                  value={settings.dividerStyle}
                  onChange={(e) => updateSetting('dividerStyle', e.target.value as any)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-bold text-slate-800"
                >
                  <option value="dashed">Dashed Line (- - - - - -)</option>
                  <option value="dotted">Dotted Line (. . . . . .)</option>
                  <option value="solid">Solid Line (────────)</option>
                  <option value="double">Double Line (════════)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Group 4: Header, Footer & Formatting Toggles */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center space-x-2 border-b border-slate-100 pb-2.5">
              <Layers className="w-4 h-4 text-amber-600" />
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                4. Header, Footer & Visual Elements
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              
              <label className="flex items-center space-x-2.5 p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 cursor-pointer transition">
                <input
                  type="checkbox"
                  checked={settings.showHeaderAddress}
                  onChange={(e) => updateSetting('showHeaderAddress', e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <div className="font-bold text-slate-800">Print Clinic Address</div>
                  <div className="text-[10px] text-slate-500">Include street address under header</div>
                </div>
              </label>

              <label className="flex items-center space-x-2.5 p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 cursor-pointer transition">
                <input
                  type="checkbox"
                  checked={settings.showHeaderPhone}
                  onChange={(e) => updateSetting('showHeaderPhone', e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <div className="font-bold text-slate-800">Print Phone & Website</div>
                  <div className="text-[10px] text-slate-500">Show clinic contact in header</div>
                </div>
              </label>

              <label className="flex items-center space-x-2.5 p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 cursor-pointer transition">
                <input
                  type="checkbox"
                  checked={settings.showCutLine}
                  onChange={(e) => updateSetting('showCutLine', e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <div className="font-bold text-slate-800">Print Tear / Cut Mark</div>
                  <div className="text-[10px] text-slate-500">Include "-- ✂ -- CUT HERE --" guide</div>
                </div>
              </label>

              <label className="flex items-center space-x-2.5 p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 cursor-pointer transition">
                <input
                  type="checkbox"
                  checked={settings.showFooterTimestamp}
                  onChange={(e) => updateSetting('showFooterTimestamp', e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <div className="font-bold text-slate-800">Print System Timestamp</div>
                  <div className="text-[10px] text-slate-500">Print date & time footer log</div>
                </div>
              </label>
            </div>

            {/* Footer Custom Message */}
            <div className="space-y-1 text-xs pt-1">
              <label className="block font-bold text-slate-700">
                Custom Footer Message / Recovery Wish
              </label>
              <input
                type="text"
                value={settings.footerCustomMessage}
                onChange={(e) => updateSetting('footerCustomMessage', e.target.value)}
                placeholder="Thank you for choosing our clinic. Wish you a speedy recovery!"
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Live Thermal Mockup & Test Print (5 Columns) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-xl flex flex-col items-center sticky top-4">
            
            {/* Live Preview Header Controls */}
            <div className="w-full flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
              <div className="flex items-center space-x-2">
                <Eye className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                  Live Thermal Output Simulator
                </span>
              </div>

              {/* Mode Toggle: Pharmacy Bill vs Token Slip */}
              <div className="flex rounded-lg border border-slate-700 p-0.5 bg-slate-800 text-[10px] font-bold">
                <button
                  type="button"
                  onClick={() => setPreviewMode('pharmacy')}
                  className={`px-2 py-1 rounded transition flex items-center gap-1 cursor-pointer ${
                    previewMode === 'pharmacy' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Receipt className="w-3 h-3" />
                  <span>POS Bill</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewMode('token')}
                  className={`px-2 py-1 rounded transition flex items-center gap-1 cursor-pointer ${
                    previewMode === 'token' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Ticket className="w-3 h-3" />
                  <span>Token Slip</span>
                </button>
              </div>
            </div>

            {/* Spec Tag Pills */}
            <div className="w-full flex flex-wrap items-center justify-between text-[10px] text-slate-400 mb-3 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700/60 font-mono">
              <span>Roll: <b className="text-white">{settings.paperWidth}mm</b></span>
              <span>Printable: <b className="text-emerald-400">{settings.printableWidth}mm</b></span>
              <span>Margins: <b className="text-white">{settings.marginLeft}mm / {settings.marginRight}mm</b></span>
              <span>Font: <b className="text-blue-300">{settings.baseFontSize}px</b></span>
            </div>

            {/* Thermal Paper Realistic Mockup */}
            <div className="w-full flex justify-center py-2 overflow-x-auto">
              <div
                style={{
                  width: `${Math.min(320, settings.printableWidth * 4.2)}px`,
                  fontFamily: previewFontFam,
                  fontSize: `${settings.baseFontSize}px`,
                  lineHeight: settings.lineHeight,
                  padding: `${settings.marginTop * 3}px ${settings.marginRight * 3 + 6}px ${settings.marginBottom * 3 + 10}px ${settings.marginLeft * 3 + 6}px`,
                  transform: `scale(${settings.scalePercent / 100})`,
                  transformOrigin: 'top center'
                }}
                className="bg-white text-black shadow-2xl rounded-sm border border-slate-300 select-none transition-all"
              >
                {/* Clinic Header */}
                <div className="text-center mb-2">
                  <h4
                    style={{ fontSize: `${settings.headerTitleSize}px` }}
                    className="font-black uppercase tracking-tight leading-tight m-0"
                  >
                    {clinicName}
                  </h4>
                  {settings.showHeaderLogoText && (
                    <div className="text-[10px] font-bold text-slate-800 uppercase mt-0.5">
                      {previewMode === 'pharmacy' ? 'RETAIL PHARMACY & DISPENSARY' : 'OPD CONSULTATION TOKEN SLIP'}
                    </div>
                  )}
                  {settings.showHeaderAddress && (
                    <div className="text-[9px] text-slate-700 mt-0.5 leading-tight">{cAddress}</div>
                  )}
                  {settings.showHeaderPhone && (
                    <div className="text-[9px] font-bold text-slate-800 mt-0.5">
                      📞 {cPhone} • 🌐 {cWebsite.replace(/^https?:\/\//, '')}
                    </div>
                  )}
                </div>

                <div style={{ borderTop: previewDivider }} className="my-1.5" />

                {previewMode === 'pharmacy' ? (
                  /* Pharmacy POS Receipt Content */
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[10px]">
                      <span><b>INV:</b> POS-2026-0891</span>
                      <span><b>SHIFT:</b> MORNING (1)</span>
                    </div>
                    <div className="flex justify-between text-[10px]">
                      <span><b>DATE:</b> 2026-09-01</span>
                      <span><b>TIME:</b> 10:45 AM</span>
                    </div>
                    <div className="text-[10px]">
                      <b>PATIENT:</b> Zaigham Ali (ID: P-1024)
                    </div>

                    <div style={{ borderTop: previewDivider }} className="my-1.5" />

                    <table className="w-full text-left" style={{ fontSize: `${settings.baseFontSize}px` }}>
                      <thead>
                        <tr style={{ borderTop: previewDivider, borderBottom: previewDivider }} className="font-bold text-[10px]">
                          <th className="py-1">ITEM</th>
                          <th className="py-1 text-center">QTY</th>
                          <th className="py-1 text-right">RATE</th>
                          <th className="py-1 text-right">TOTAL</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        <tr>
                          <td className="py-1">
                            <div className="font-bold leading-tight">ARNICA MONT 200C</div>
                            <div className="text-[9px] text-slate-500">Clinical Drops 30ml</div>
                          </td>
                          <td className="py-1 text-center">1</td>
                          <td className="py-1 text-right">350</td>
                          <td className="py-1 text-right font-bold">350</td>
                        </tr>
                        <tr>
                          <td className="py-1">
                            <div className="font-bold leading-tight">ECHINACEA Q</div>
                            <div className="text-[9px] text-slate-500">Mother Tincture 60ml</div>
                          </td>
                          <td className="py-1 text-center">2</td>
                          <td className="py-1 text-right">450</td>
                          <td className="py-1 text-right font-bold">900</td>
                        </tr>
                      </tbody>
                    </table>

                    <div style={{ borderTop: previewDivider }} className="my-1.5" />

                    <div className="flex justify-between text-[10px]">
                      <span>GROSS TOTAL:</span>
                      <span className="font-bold">PKR 1,250</span>
                    </div>
                    <div className="flex justify-between text-[10px]">
                      <span>DISCOUNT:</span>
                      <span>PKR 0</span>
                    </div>
                    <div
                      style={{ borderTop: previewDivider, borderBottom: previewDivider }}
                      className="py-1 font-black flex justify-between text-xs"
                    >
                      <span>NET PAID:</span>
                      <span>PKR 1,250</span>
                    </div>
                  </div>
                ) : (
                  /* Token Ticket Content */
                  <div className="space-y-2">
                    <div className="border-2 border-black p-2 text-center rounded-sm my-1">
                      <div className="text-[10px] font-black uppercase tracking-wider">OPD TOKEN NO</div>
                      <div className="text-3xl font-black font-sans my-0.5">#14</div>
                      <div className="text-[9px] font-extrabold uppercase bg-black text-white px-2 py-0.5 inline-block rounded-xs">
                        MORNING SHIFT (1)
                      </div>
                    </div>

                    <div style={{ borderTop: previewDivider }} className="my-1.5" />

                    <div className="space-y-1 text-[10px]">
                      <div className="flex justify-between">
                        <span><b>PATIENT ID:</b></span>
                        <span className="font-mono font-bold">P-1024</span>
                      </div>
                      <div className="flex justify-between">
                        <span><b>NAME:</b></span>
                        <span className="font-bold">Zaigham Ali</span>
                      </div>
                      <div className="flex justify-between">
                        <span><b>DATE / TIME:</b></span>
                        <span>2026-09-01 10:45 AM</span>
                      </div>
                    </div>

                    <div
                      style={{ borderTop: previewDivider, borderBottom: previewDivider }}
                      className="py-1 text-center font-black text-[11px]"
                    >
                      OPD CONSULTATION FEE: PKR 1,000
                    </div>
                  </div>
                )}

                {/* Footer Note */}
                {settings.footerCustomMessage && (
                  <div className="text-[9px] text-center font-bold text-slate-700 mt-2 leading-tight">
                    {settings.footerCustomMessage}
                  </div>
                )}

                {settings.showFooterTimestamp && (
                  <div className="text-[8px] text-center text-slate-500 mt-1">
                    System Printed: 2026-09-01 10:45 AM
                  </div>
                )}

                {/* Cut Line Simulation */}
                {settings.showCutLine && (
                  <div className="mt-2 pt-1 border-t border-dashed border-slate-400 text-center text-[8px] text-slate-500">
                    -- ✂ -- TEAR OR CUT HERE -- ✂ --
                  </div>
                )}
              </div>
            </div>

            {/* Test Print Action Button */}
            <div className="w-full mt-4 pt-3 border-t border-slate-800 flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={handleTestPrint}
                className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg flex items-center justify-center gap-2 transition cursor-pointer active:scale-98"
              >
                <Printer className="w-4 h-4" />
                <span>🖨️ Test Print On Thermal Printer</span>
              </button>
            </div>
            <p className="text-[10px] text-slate-400 text-center mt-2">
              Click to open browser print dialog and test your physical thermal printer hardware
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};
