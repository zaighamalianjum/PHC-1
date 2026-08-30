/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import {
  Calendar,
  CheckSquare,
  Square,
  Search,
  Filter,
  X,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Sparkles,
  RefreshCw,
  Tag,
  Clock,
  Layers,
  Check,
  Zap,
  ArrowRight,
  Boxes
} from 'lucide-react';
import { Item, ItemBatch } from '../../types';
import {
  isBatchExpired,
  isBatchNearExpiry,
  getItemExpirySummary,
  toMonthYearInput,
  formatMonthYearDisplay
} from '../../utils/pharmacyUtils';

interface PharmacyBulkExpiryModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: Item[];
  categories: string[];
  onBulkUpdateExpiry: (
    updates: { itemId: string; newExpDate: string; updateBatches: boolean }[]
  ) => Promise<void> | void;
}

export const PharmacyBulkExpiryModal: React.FC<PharmacyBulkExpiryModalProps> = ({
  isOpen,
  onClose,
  items,
  categories,
  onBulkUpdateExpiry
}) => {
  // Target Expiry Date state (Format: YYYY-MM)
  const defaultTargetDate = useMemo(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 2); // Default to +2 years in future
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  }, []);

  const [targetExpDate, setTargetExpDate] = useState<string>(defaultTargetDate);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'EXPIRED' | 'NEAR_EXPIRY' | 'NO_EXPIRY' | 'ACTIVE'>('ALL');
  const [stockOnlyFilter, setStockOnlyFilter] = useState<boolean>(false);
  const [updateBatchesOption, setUpdateBatchesOption] = useState<boolean>(true);

  // Selected item IDs for bulk update
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());

  // Execution & Feedback state
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Reset or clear errors on open
  useEffect(() => {
    if (isOpen) {
      setSuccessMsg('');
      setErrorMsg('');
      if (!targetExpDate) {
        setTargetExpDate(defaultTargetDate);
      }
    }
  }, [isOpen, defaultTargetDate]);

  // Unique categories list with counts
  const categoryOptions = useMemo(() => {
    const set = new Set<string>();
    categories.forEach(c => {
      if (c && c.trim()) set.add(c.trim());
    });
    items.forEach(itm => {
      if (itm.Unit && itm.Unit.trim()) set.add(itm.Unit.trim());
    });

    const list = Array.from(set).sort();
    return [
      { id: 'ALL', label: 'All Categories', count: items.length },
      { id: 'C', label: 'Clinical (/C)', count: items.filter(i => i.MedicineType === 'C').length },
      { id: 'P', label: 'Patent (/P)', count: items.filter(i => i.MedicineType !== 'C').length },
      ...list.map(c => ({
        id: c,
        label: c,
        count: items.filter(i => {
          const u = (i.Unit || '').toLowerCase().trim();
          const target = c.toLowerCase().trim();
          return u === target || u.includes(target);
        }).length
      }))
    ];
  }, [categories, items]);

  // Filtered items based on Category, Search query, Status, and Stock filter
  const filteredItems = useMemo(() => {
    return items.filter(itm => {
      // 1. Category Filter
      if (selectedCategory !== 'ALL') {
        if (selectedCategory === 'C') {
          if (itm.MedicineType !== 'C') return false;
        } else if (selectedCategory === 'P') {
          if (itm.MedicineType === 'C') return false;
        } else {
          const u = (itm.Unit || '').toLowerCase().trim();
          const target = selectedCategory.toLowerCase().trim();
          if (u !== target && !u.includes(target)) return false;
        }
      }

      // 2. Stock Filter
      if (stockOnlyFilter && itm.CStock <= 0) {
        return false;
      }

      // 3. Expiry Status Filter
      if (statusFilter !== 'ALL') {
        const expSum = getItemExpirySummary(itm);
        if (statusFilter === 'EXPIRED' && expSum.status !== 'EXPIRED' && expSum.status !== 'PARTIAL_EXPIRED') return false;
        if (statusFilter === 'NEAR_EXPIRY' && expSum.status !== 'NEAR_EXPIRY') return false;
        if (statusFilter === 'NO_EXPIRY' && expSum.status !== 'NO_EXPIRY') return false;
        if (statusFilter === 'ACTIVE' && expSum.status !== 'ACTIVE') return false;
      }

      // 4. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const idMatch = (itm.ItemID || '').toLowerCase().includes(q);
        const nameMatch = (itm.ItemName || '').toLowerCase().includes(q);
        const unitMatch = (itm.Unit || '').toLowerCase().includes(q);
        const batchMatch = (itm.BatchNo || '').toLowerCase().includes(q) ||
          (Array.isArray(itm.Batches) && itm.Batches.some(b => (b.BatchNo || '').toLowerCase().includes(q)));
        const barcodeMatch = (itm.VendorBarcode || '').toLowerCase().includes(q);

        if (!idMatch && !nameMatch && !unitMatch && !batchMatch && !barcodeMatch) {
          return false;
        }
      }

      return true;
    });
  }, [items, selectedCategory, stockOnlyFilter, statusFilter, searchQuery]);

  // Quick preset dates setter
  const applyQuickPreset = (monthsToAdd: number) => {
    const d = new Date();
    d.setMonth(d.getMonth() + monthsToAdd);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    setTargetExpDate(`${y}-${m}`);
  };

  const applyYearEndPreset = (yearsAhead: number) => {
    const d = new Date();
    const y = d.getFullYear() + yearsAhead;
    setTargetExpDate(`${y}-12`);
  };

  // Toggle single item checkbox
  const toggleItemSelection = (itemId: string) => {
    setSelectedItemIds(prev => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  };

  // Select all visible filtered items
  const handleSelectAllVisible = () => {
    setSelectedItemIds(prev => {
      const next = new Set(prev);
      filteredItems.forEach(i => next.add(i.ItemID));
      return next;
    });
  };

  // Deselect all items
  const handleDeselectAll = () => {
    setSelectedItemIds(new Set());
  };

  // Invert selection for visible items
  const handleInvertSelection = () => {
    setSelectedItemIds(prev => {
      const next = new Set(prev);
      filteredItems.forEach(i => {
        if (next.has(i.ItemID)) {
          next.delete(i.ItemID);
        } else {
          next.add(i.ItemID);
        }
      });
      return next;
    });
  };

  // Select only expired or near-expiry in visible list
  const handleSelectOnlyProblematic = (type: 'EXPIRED' | 'NEAR_EXPIRY') => {
    const next = new Set(selectedItemIds);
    filteredItems.forEach(itm => {
      const sum = getItemExpirySummary(itm);
      if (type === 'EXPIRED' && (sum.status === 'EXPIRED' || sum.status === 'PARTIAL_EXPIRED')) {
        next.add(itm.ItemID);
      } else if (type === 'NEAR_EXPIRY' && sum.status === 'NEAR_EXPIRY') {
        next.add(itm.ItemID);
      }
    });
    setSelectedItemIds(next);
  };

  // Execute Bulk Update
  const handleApplyBulkExpiry = async () => {
    setErrorMsg('');
    setSuccessMsg('');

    const cleanTarget = toMonthYearInput(targetExpDate);
    if (!cleanTarget) {
      setErrorMsg('Please specify a valid Target Expiration Month-Year (e.g. YYYY-MM).');
      return;
    }

    if (selectedItemIds.size === 0) {
      setErrorMsg('Please select at least one medicine from the list using the checkboxes.');
      return;
    }

    const updates = Array.from(selectedItemIds).map(itemId => ({
      itemId,
      newExpDate: cleanTarget,
      updateBatches: updateBatchesOption
    }));

    try {
      setIsSubmitting(true);
      await onBulkUpdateExpiry(updates);
      setSuccessMsg(`✅ Successfully updated Expiry Date to "${formatMonthYearDisplay(cleanTarget)}" for ${updates.length} selected medicines!`);
      // Keep selected or clear
      setSelectedItemIds(new Set());
    } catch (err: any) {
      setErrorMsg(`Failed to update expiry dates: ${err?.message || 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const isAllVisibleSelected = filteredItems.length > 0 && filteredItems.every(i => selectedItemIds.has(i.ItemID));
  const isSomeVisibleSelected = filteredItems.some(i => selectedItemIds.has(i.ItemID)) && !isAllVisibleSelected;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-6xl overflow-hidden flex flex-col max-h-[94vh] animate-scaleUp">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between gap-3 shrink-0 border-b border-slate-800">
          <div className="flex items-center space-x-3.5 min-w-0">
            <div className="p-3 bg-amber-500/20 text-amber-300 rounded-2xl border border-amber-500/30 shrink-0">
              <Calendar className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-2 flex-wrap">
                <h3 className="text-lg font-black text-white tracking-tight">
                  Bulk Medicine Expiry Date Manager
                </h3>
                <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-200 rounded-full text-xs font-black border border-amber-400/30 uppercase tracking-wide">
                  Month-Year Fast Update
                </span>
              </div>
              <p className="text-xs text-slate-300 font-medium mt-0.5">
                Select medicines category-wise, specify target expiry (Month-Year), and update all checked medicines in one click.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition cursor-pointer shrink-0"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-5 bg-slate-50/50">
          
          {/* Top Control Center: Step 1 (Target Expiry Date) & Presets */}
          <div className="bg-white p-5 rounded-2xl border border-indigo-100 shadow-sm space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              
              {/* Target Month-Year Input */}
              <div className="flex-1 min-w-[280px]">
                <label className="block text-xs font-black uppercase tracking-wider text-slate-800 mb-1.5 flex items-center space-x-1.5">
                  <Calendar className="w-4 h-4 text-indigo-600" />
                  <span>1. Specify Target Expiration (Month - Year)</span>
                  <span className="text-rose-500">*</span>
                </label>
                
                <div className="flex items-center space-x-3">
                  <div className="relative flex-1">
                    <input
                      type="month"
                      value={targetExpDate}
                      onChange={(e) => setTargetExpDate(e.target.value)}
                      className="w-full text-sm font-bold font-mono border-2 border-indigo-300 focus:border-indigo-600 rounded-xl px-3.5 py-2.5 bg-indigo-50/40 text-slate-900 focus:outline-none shadow-xs"
                      required
                    />
                  </div>

                  {/* Formatted Date Display Badge */}
                  <div className="px-4 py-2.5 bg-slate-900 text-white rounded-xl font-mono text-xs font-black flex items-center space-x-2 shrink-0 border border-slate-800 shadow-xs">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span>Formatted: <strong className="text-amber-300">{formatMonthYearDisplay(targetExpDate) || '—'}</strong></span>
                  </div>
                </div>
              </div>

              {/* Quick Preset Buttons */}
              <div className="flex-1">
                <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 mb-1.5">
                  ⚡ Quick Future Presets:
                </label>
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => applyQuickPreset(6)}
                    className="px-2.5 py-1.5 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 text-xs font-bold rounded-lg border border-slate-200 transition cursor-pointer"
                  >
                    +6 Months
                  </button>
                  <button
                    type="button"
                    onClick={() => applyQuickPreset(12)}
                    className="px-2.5 py-1.5 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 text-xs font-bold rounded-lg border border-slate-200 transition cursor-pointer"
                  >
                    +1 Year
                  </button>
                  <button
                    type="button"
                    onClick={() => applyQuickPreset(24)}
                    className="px-2.5 py-1.5 bg-indigo-50 text-indigo-800 text-xs font-bold rounded-lg border border-indigo-200 hover:bg-indigo-100 transition cursor-pointer"
                  >
                    +2 Years
                  </button>
                  <button
                    type="button"
                    onClick={() => applyQuickPreset(36)}
                    className="px-2.5 py-1.5 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 text-xs font-bold rounded-lg border border-slate-200 transition cursor-pointer"
                  >
                    +3 Years
                  </button>
                  <button
                    type="button"
                    onClick={() => applyYearEndPreset(1)}
                    className="px-2.5 py-1.5 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 text-xs font-bold rounded-lg border border-slate-200 transition cursor-pointer"
                  >
                    End Next Year (Dec)
                  </button>
                  <button
                    type="button"
                    onClick={() => applyYearEndPreset(2)}
                    className="px-2.5 py-1.5 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 text-xs font-bold rounded-lg border border-slate-200 transition cursor-pointer"
                  >
                    End +2 Years
                  </button>
                </div>
              </div>

            </div>

            {/* Batch sync toggle option */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <label className="flex items-center space-x-2 text-xs font-bold text-slate-700 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={updateBatchesOption}
                  onChange={(e) => setUpdateBatchesOption(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                />
                <span>Also synchronize & recalculate all underlying batch lot expiration records for selected medicines</span>
              </label>

              <span className="text-[11px] text-slate-400 italic">
                Will set Item master ExpDate and active batch expiry dates
              </span>
            </div>
          </div>

          {/* Step 2: Category Filter, Search Bar & Status Scope */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-wrap gap-2">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center space-x-1.5">
                <Tag className="w-4 h-4 text-emerald-600" />
                <span>2. Filter Medicines Category-Wise & Search</span>
              </h4>

              <div className="flex items-center space-x-2">
                <label className="flex items-center space-x-1.5 text-xs font-bold text-slate-600 cursor-pointer select-none bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
                  <input
                    type="checkbox"
                    checked={stockOnlyFilter}
                    onChange={(e) => setStockOnlyFilter(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5 cursor-pointer"
                  />
                  <span>Stock Available Only (&gt;0)</span>
                </label>
              </div>
            </div>

            {/* Category Selector Buttons / Dropdown */}
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-1.5 max-h-28 overflow-y-auto p-1 bg-slate-50 rounded-xl border border-slate-200">
                {categoryOptions.map((cat) => {
                  const isSelected = selectedCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <span>{cat.label}</span>
                      <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                        isSelected ? 'bg-indigo-800 text-white' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {cat.count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Search Input and Status Scope Toolbar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search medicine name, item ID, batch #, barcode..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 text-xs border border-slate-200 bg-slate-50 focus:bg-white focus:border-indigo-500 rounded-xl font-medium focus:outline-none shadow-2xs"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 text-xs"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Status Filter Scope */}
              <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl border border-slate-200 shrink-0">
                <button
                  type="button"
                  onClick={() => setStatusFilter('ALL')}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg transition cursor-pointer ${
                    statusFilter === 'ALL' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  All Status
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('EXPIRED')}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg transition cursor-pointer flex items-center space-x-1 ${
                    statusFilter === 'EXPIRED' ? 'bg-rose-600 text-white shadow-2xs' : 'text-rose-700 hover:bg-rose-50'
                  }`}
                >
                  <span>🔴 Expired</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('NEAR_EXPIRY')}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg transition cursor-pointer flex items-center space-x-1 ${
                    statusFilter === 'NEAR_EXPIRY' ? 'bg-amber-600 text-white shadow-2xs' : 'text-amber-800 hover:bg-amber-50'
                  }`}
                >
                  <span>🟡 &lt;90 Days</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('NO_EXPIRY')}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg transition cursor-pointer ${
                    statusFilter === 'NO_EXPIRY' ? 'bg-slate-700 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  ⚪ No Expiry
                </button>
              </div>
            </div>

          </div>

          {/* Feedback Messages */}
          {successMsg && (
            <div className="p-3.5 bg-emerald-50 text-emerald-900 text-xs rounded-2xl font-bold border border-emerald-300 flex items-center space-x-2 animate-fadeIn shadow-xs">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="p-3.5 bg-rose-50 text-rose-900 text-xs rounded-2xl font-bold border border-rose-300 flex items-center space-x-2 animate-fadeIn shadow-xs">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Step 3: Medicine List with Checkboxes & Live Preview */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-0">
            
            {/* Table Action Bar */}
            <div className="p-3.5 bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={isAllVisibleSelected ? handleDeselectAll : handleSelectAllVisible}
                  className="flex items-center space-x-2 text-xs font-bold text-white hover:text-indigo-300 transition cursor-pointer"
                >
                  {isAllVisibleSelected ? (
                    <CheckSquare className="w-4 h-4 text-emerald-400" />
                  ) : isSomeVisibleSelected ? (
                    <div className="w-4 h-4 bg-indigo-500 rounded flex items-center justify-center text-white font-bold text-xxs">
                      -
                    </div>
                  ) : (
                    <Square className="w-4 h-4 text-slate-400" />
                  )}
                  <span>
                    {isAllVisibleSelected ? 'Deselect All Visible' : 'Select All Visible'} ({filteredItems.length})
                  </span>
                </button>

                <div className="h-4 w-px bg-slate-700 hidden sm:block" />

                <span className="text-xs text-slate-300 font-mono">
                  Selected: <strong className="text-amber-400 text-sm">{selectedItemIds.size}</strong> medicines
                </span>
              </div>

              {/* Quick Bulk Selection Helpers */}
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleInvertSelection}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xxs font-bold transition border border-slate-700 cursor-pointer"
                >
                  Invert Selection
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectOnlyProblematic('EXPIRED')}
                  className="px-2.5 py-1 bg-rose-950 text-rose-300 hover:bg-rose-900 rounded-lg text-xxs font-bold transition border border-rose-800 cursor-pointer"
                >
                  Select Expired
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectOnlyProblematic('NEAR_EXPIRY')}
                  className="px-2.5 py-1 bg-amber-950 text-amber-300 hover:bg-amber-900 rounded-lg text-xxs font-bold transition border border-amber-800 cursor-pointer"
                >
                  Select Near Expiry
                </button>
                <button
                  type="button"
                  onClick={handleDeselectAll}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg text-xxs font-bold transition border border-slate-700 cursor-pointer"
                >
                  Clear All
                </button>
              </div>
            </div>

            {/* Table Container */}
            <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100">
              {filteredItems.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  No medicines match the selected category and filter criteria.
                </div>
              ) : (
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-extrabold uppercase text-[10px] tracking-wider sticky top-0 z-10 shadow-2xs">
                    <tr>
                      <th className="p-3 w-12 text-center">Select</th>
                      <th className="p-3 w-12 text-center">S.No</th>
                      <th className="p-3">Item ID & Medicine Name</th>
                      <th className="p-3">Category / Unit</th>
                      <th className="p-3 text-center">Current Stock</th>
                      <th className="p-3">Current Expiry / Batch</th>
                      <th className="p-3 text-right">➔ New Expiry Preview</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredItems.map((itm, idx) => {
                      const isSelected = selectedItemIds.has(itm.ItemID);
                      const expSummary = getItemExpirySummary(itm);
                      const currentExpFormatted = formatMonthYearDisplay(itm.ExpDate || (itm.Batches && itm.Batches[0]?.ExpDate) || '');
                      const activeBatch = itm.BatchNo || (itm.Batches && itm.Batches[0]?.BatchNo) || '';
                      const targetFormatted = formatMonthYearDisplay(targetExpDate);

                      return (
                        <tr
                          key={itm.ItemID}
                          onClick={() => toggleItemSelection(itm.ItemID)}
                          className={`transition cursor-pointer select-none ${
                            isSelected
                              ? 'bg-indigo-50/80 hover:bg-indigo-100/70 font-medium'
                              : 'hover:bg-slate-50'
                          }`}
                        >
                          {/* Checkbox Column */}
                          <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleItemSelection(itm.ItemID)}
                              className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                            />
                          </td>

                          {/* S.No */}
                          <td className="p-3 text-center font-mono text-slate-400 text-[11px]">
                            {idx + 1}
                          </td>

                          {/* Item ID & Name */}
                          <td className="p-3">
                            <div className="flex items-center space-x-2">
                              <span className={`font-bold ${isSelected ? 'text-indigo-950' : 'text-slate-900'}`}>
                                {itm.ItemName}
                              </span>
                              <span className="text-[10px] font-mono text-slate-400">
                                ({itm.ItemID})
                              </span>
                              <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                                itm.MedicineType === 'C'
                                  ? 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                                  : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                              }`}>
                                {itm.MedicineType === 'C' ? 'Clinical' : 'Patent'}
                              </span>
                            </div>
                          </td>

                          {/* Category / Unit */}
                          <td className="p-3 text-slate-600 font-medium">
                            {itm.Unit || 'Tab'}
                          </td>

                          {/* Stock */}
                          <td className="p-3 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-mono font-bold ${
                              itm.CStock <= 0
                                ? 'bg-rose-100 text-rose-700'
                                : itm.CStock <= 5
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}>
                              {itm.CStock}
                            </span>
                          </td>

                          {/* Current Expiry */}
                          <td className="p-3">
                            <div className="flex items-center space-x-2">
                              <span className="font-mono text-xs text-slate-700">
                                {currentExpFormatted || <span className="text-slate-400 italic">None</span>}
                              </span>
                              {activeBatch && (
                                <span className="text-[10px] text-slate-500 font-mono">
                                  [{activeBatch}]
                                </span>
                              )}
                              {expSummary.status === 'EXPIRED' && (
                                <span className="px-1.5 py-0.2 bg-rose-100 text-rose-700 rounded text-[9px] font-black uppercase">
                                  Expired
                                </span>
                              )}
                              {expSummary.status === 'NEAR_EXPIRY' && (
                                <span className="px-1.5 py-0.2 bg-amber-100 text-amber-800 rounded text-[9px] font-black uppercase">
                                  Near Expiry
                                </span>
                              )}
                            </div>
                          </td>

                          {/* New Expiry Preview */}
                          <td className="p-3 text-right">
                            {isSelected ? (
                              <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-lg font-mono font-black text-xs shadow-2xs">
                                <Sparkles className="w-3 h-3 text-emerald-600" />
                                <span>{targetFormatted}</span>
                              </div>
                            ) : (
                              <span className="text-slate-300 font-mono text-xs">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

          </div>

        </div>

        {/* Modal Footer / Action Execution Bar */}
        <div className="p-4 sm:p-5 bg-slate-900 text-white flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0 border-t border-slate-800">
          <div className="flex items-center space-x-3 text-xs">
            <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-xl shrink-0">
              <Boxes className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-white block">
                {selectedItemIds.size > 0
                  ? `Ready to update ${selectedItemIds.size} medicine${selectedItemIds.size > 1 ? 's' : ''} to expiration "${formatMonthYearDisplay(targetExpDate)}"`
                  : 'Check the boxes next to medicine names above to select items for expiry date update.'}
              </span>
              <span className="text-[11px] text-slate-400">
                Changes will sync to inventory database and update stock grid cards immediately.
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-initial px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition cursor-pointer border border-slate-700"
            >
              Cancel
            </button>

            <button
              type="button"
              disabled={selectedItemIds.size === 0 || !targetExpDate || isSubmitting}
              onClick={handleApplyBulkExpiry}
              className={`flex-1 sm:flex-initial px-6 py-2.5 text-white rounded-xl text-xs font-black transition flex items-center justify-center space-x-2 shadow-lg ${
                selectedItemIds.size > 0 && targetExpDate && !isSubmitting
                  ? 'bg-emerald-600 hover:bg-emerald-500 cursor-pointer shadow-emerald-900/30'
                  : 'bg-slate-700 opacity-50 cursor-not-allowed'
              }`}
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-emerald-200" />
                  <span>Updating Expiry Dates...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                  <span>
                    Update Expire Date ({selectedItemIds.size} Selected)
                  </span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default PharmacyBulkExpiryModal;
