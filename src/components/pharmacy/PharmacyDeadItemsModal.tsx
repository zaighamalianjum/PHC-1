/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  Search,
  CheckSquare,
  Square,
  AlertOctagon,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Printer,
  Download,
  Filter,
  Package,
  Layers,
  Sparkles,
  TrendingDown,
  DollarSign,
  Calendar,
  Check,
  Ban,
  ShieldAlert,
  Archive,
  Trash2,
  Eye,
  Info
} from 'lucide-react';
import { Item } from '../../types';

interface PharmacyDeadItemsModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: Item[];
  categories: string[];
  onUpdateItemDeadStatus: (itemId: string, isDead: boolean, reason?: string) => Promise<void> | void;
  onBulkUpdateDeadStatus: (updates: { itemId: string; isDead: boolean; reason?: string }[]) => Promise<void> | void;
  clinicName?: string;
}

const COMMON_DEAD_REASONS = [
  'Slow Mover / Zero Sale Demand',
  'Expired / Near Expiry Date',
  'Damaged / Broken Packaging',
  'Discontinued by Manufacturer',
  'Banned / Obsolete Formula',
  'Replaced by Alternative Item',
  'Customer Return / Unsellable',
  'Manual Dead Marking'
];

export const PharmacyDeadItemsModal: React.FC<PharmacyDeadItemsModalProps> = ({
  isOpen,
  onClose,
  items,
  categories,
  onUpdateItemDeadStatus,
  onBulkUpdateDeadStatus,
  clinicName = 'Smart Clinic Pharmacy'
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE_ONLY' | 'DEAD_ONLY'>('ALL');
  const [stockFilter, setStockFilter] = useState<'ALL' | 'ZERO_STOCK' | 'IN_STOCK'>('ALL');
  
  // Selection set for bulk operations
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());
  const [bulkReason, setBulkReason] = useState<string>('Slow Mover / Zero Sale Demand');
  
  // Inline editing / local pending changes for instant responsiveness
  const [customReasons, setCustomReasons] = useState<Record<string, string>>({});
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(50);
  
  // Notification feedback
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Clear selections & state on open
  useEffect(() => {
    if (isOpen) {
      setSelectedItemIds(new Set());
      setFeedbackMsg(null);
      setCurrentPage(1);
    }
  }, [isOpen]);

  // Extract all categories / units
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
      { id: 'ALL', label: 'All Categories / Units' },
      { id: 'C', label: 'Clinical Medicines (C)' },
      { id: 'P', label: 'Patent Medicines (P)' },
      ...list.map(c => ({ id: c, label: c }))
    ];
  }, [categories, items]);

  // Overall Catalog Statistics
  const stats = useMemo(() => {
    let totalItems = items.length;
    let deadItemsCount = 0;
    let activeItemsCount = 0;
    let deadStockUnits = 0;
    let deadStockCostVal = 0;
    let deadStockRetailVal = 0;

    items.forEach(itm => {
      const isDead = Boolean(itm.IsDead || itm.Status === 'Dead' || itm.Status === 'DEAD');
      if (isDead) {
        deadItemsCount++;
        deadStockUnits += (itm.CStock || 0);
        deadStockCostVal += ((itm.CStock || 0) * (itm.PurchasePrice || 0));
        deadStockRetailVal += ((itm.CStock || 0) * (itm.Price || 0));
      } else {
        activeItemsCount++;
      }
    });

    return {
      totalItems,
      deadItemsCount,
      activeItemsCount,
      deadStockUnits,
      deadStockCostVal,
      deadStockRetailVal
    };
  }, [items]);

  // Filtered Items
  const filteredItems = useMemo(() => {
    return items.filter(itm => {
      const isDead = Boolean(itm.IsDead || itm.Status === 'Dead' || itm.Status === 'DEAD');

      // Status filter
      if (statusFilter === 'ACTIVE_ONLY' && isDead) return false;
      if (statusFilter === 'DEAD_ONLY' && !isDead) return false;

      // Stock filter
      if (stockFilter === 'ZERO_STOCK' && (itm.CStock || 0) > 0) return false;
      if (stockFilter === 'IN_STOCK' && (itm.CStock || 0) <= 0) return false;

      // Category filter
      if (categoryFilter !== 'ALL') {
        if (categoryFilter === 'C') {
          if (itm.MedicineType !== 'C') return false;
        } else if (categoryFilter === 'P') {
          if (itm.MedicineType === 'C') return false;
        } else {
          const u = (itm.Unit || '').toLowerCase().trim();
          const c = categoryFilter.toLowerCase().trim();
          if (u !== c && !u.includes(c)) return false;
        }
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchId = (itm.ItemID || '').toLowerCase().includes(q);
        const matchName = (itm.ItemName || '').toLowerCase().includes(q);
        const matchUnit = (itm.Unit || '').toLowerCase().includes(q);
        const matchBatch = (itm.BatchNo || '').toLowerCase().includes(q);
        const matchReason = (itm.DeadReason || '').toLowerCase().includes(q);
        if (!matchId && !matchName && !matchUnit && !matchBatch && !matchReason) {
          return false;
        }
      }

      return true;
    });
  }, [items, statusFilter, stockFilter, categoryFilter, searchQuery]);

  // Pagination calculation
  const totalCount = filteredItems.length;
  const isAllPages = pageSize === -1;
  const effectivePageSize = isAllPages ? Math.max(1, totalCount) : pageSize;
  const totalPages = isAllPages ? 1 : Math.max(1, Math.ceil(totalCount / effectivePageSize));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = isAllPages ? 0 : (safePage - 1) * effectivePageSize;
  const endIndex = isAllPages ? totalCount : Math.min(startIndex + effectivePageSize, totalCount);
  const paginatedItems = isAllPages ? filteredItems : filteredItems.slice(startIndex, endIndex);

  // Selection handlers
  const handleToggleSelectRow = (itemId: string) => {
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

  const handleSelectAllVisible = () => {
    const visibleIds = paginatedItems.map(i => i.ItemID);
    const allSelected = visibleIds.every(id => selectedItemIds.has(id));
    setSelectedItemIds(prev => {
      const next = new Set(prev);
      if (allSelected) {
        visibleIds.forEach(id => next.delete(id));
      } else {
        visibleIds.forEach(id => next.add(id));
      }
      return next;
    });
  };

  const handleSelectAllFiltered = () => {
    const allFilteredIds = filteredItems.map(i => i.ItemID);
    const allSelected = allFilteredIds.every(id => selectedItemIds.has(id));
    if (allSelected) {
      setSelectedItemIds(new Set());
    } else {
      setSelectedItemIds(new Set(allFilteredIds));
    }
  };

  // Toggle single item Dead/Active status directly
  const handleToggleSingleItemDeadStatus = async (item: Item) => {
    const currentIsDead = Boolean(item.IsDead || item.Status === 'Dead' || item.Status === 'DEAD');
    const newIsDead = !currentIsDead;
    const reason = newIsDead ? (customReasons[item.ItemID] || item.DeadReason || bulkReason) : undefined;

    try {
      await onUpdateItemDeadStatus(item.ItemID, newIsDead, reason);
      setFeedbackMsg({
        type: 'success',
        text: `"${item.ItemName}" marked as ${newIsDead ? '⛔ DEAD ITEM' : '🟢 ACTIVE'}!`
      });
      setTimeout(() => setFeedbackMsg(null), 4000);
    } catch (err) {
      setFeedbackMsg({
        type: 'error',
        text: `Failed to update status for ${item.ItemName}.`
      });
    }
  };

  // Bulk Mark as Dead
  const handleBulkMarkAsDead = async () => {
    if (selectedItemIds.size === 0) {
      setFeedbackMsg({ type: 'error', text: 'Please select at least one medicine from the grid.' });
      return;
    }

    setIsProcessing(true);
    const updates = Array.from(selectedItemIds).map(itemId => ({
      itemId,
      isDead: true,
      reason: customReasons[itemId] || bulkReason
    }));

    try {
      await onBulkUpdateDeadStatus(updates);
      setFeedbackMsg({
        type: 'success',
        text: `Successfully marked ${updates.length} items as DEAD items!`
      });
      setSelectedItemIds(new Set());
      setTimeout(() => setFeedbackMsg(null), 5000);
    } catch (err) {
      setFeedbackMsg({ type: 'error', text: 'Failed to update selected items.' });
    } finally {
      setIsProcessing(false);
    }
  };

  // Bulk Mark as Active (Unmark Dead)
  const handleBulkMarkAsActive = async () => {
    if (selectedItemIds.size === 0) {
      setFeedbackMsg({ type: 'error', text: 'Please select at least one medicine from the grid.' });
      return;
    }

    setIsProcessing(true);
    const updates = Array.from(selectedItemIds).map(itemId => ({
      itemId,
      isDead: false,
      reason: ''
    }));

    try {
      await onBulkUpdateDeadStatus(updates);
      setFeedbackMsg({
        type: 'success',
        text: `Successfully restored ${updates.length} items to ACTIVE status!`
      });
      setSelectedItemIds(new Set());
      setTimeout(() => setFeedbackMsg(null), 5000);
    } catch (err) {
      setFeedbackMsg({ type: 'error', text: 'Failed to restore selected items.' });
    } finally {
      setIsProcessing(false);
    }
  };

  // Quick Mark All Filtered as Dead
  const handleMarkAllFilteredAsDead = async () => {
    if (filteredItems.length === 0) return;
    if (!window.confirm(`Are you sure you want to mark all ${filteredItems.length} currently filtered medicines as DEAD items?`)) {
      return;
    }

    setIsProcessing(true);
    const updates = filteredItems.map(itm => ({
      itemId: itm.ItemID,
      isDead: true,
      reason: customReasons[itm.ItemID] || bulkReason
    }));

    try {
      await onBulkUpdateDeadStatus(updates);
      setFeedbackMsg({
        type: 'success',
        text: `All ${updates.length} filtered items marked as DEAD items!`
      });
      setSelectedItemIds(new Set());
      setTimeout(() => setFeedbackMsg(null), 5000);
    } catch (err) {
      setFeedbackMsg({ type: 'error', text: 'Failed to update filtered items.' });
    } finally {
      setIsProcessing(false);
    }
  };

  // Quick Unmark All Filtered (Restore to Active)
  const handleUnmarkAllFiltered = async () => {
    const deadFiltered = filteredItems.filter(i => Boolean(i.IsDead || i.Status === 'Dead' || i.Status === 'DEAD'));
    if (deadFiltered.length === 0) {
      setFeedbackMsg({ type: 'error', text: 'No dead items found in current filter.' });
      return;
    }

    if (!window.confirm(`Are you sure you want to restore ${deadFiltered.length} dead items in this filter back to ACTIVE?`)) {
      return;
    }

    setIsProcessing(true);
    const updates = deadFiltered.map(itm => ({
      itemId: itm.ItemID,
      isDead: false,
      reason: ''
    }));

    try {
      await onBulkUpdateDeadStatus(updates);
      setFeedbackMsg({
        type: 'success',
        text: `Restored ${updates.length} items back to ACTIVE status!`
      });
      setSelectedItemIds(new Set());
      setTimeout(() => setFeedbackMsg(null), 5000);
    } catch (err) {
      setFeedbackMsg({ type: 'error', text: 'Failed to restore items.' });
    } finally {
      setIsProcessing(false);
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    const exportData = filteredItems.map((itm, idx) => {
      const isDead = Boolean(itm.IsDead || itm.Status === 'Dead' || itm.Status === 'DEAD');
      return [
        idx + 1,
        `"${(itm.ItemID || '').replace(/"/g, '""')}"`,
        `"${(itm.ItemName || '').replace(/"/g, '""')}"`,
        `"${(itm.Unit || 'Tab').replace(/"/g, '""')}"`,
        itm.MedicineType === 'C' ? 'Clinical' : 'Patent',
        isDead ? 'DEAD' : 'ACTIVE',
        `"${(itm.DeadReason || customReasons[itm.ItemID] || '').replace(/"/g, '""')}"`,
        itm.CStock || 0,
        itm.PurchasePrice || 0,
        itm.Price || 0,
        (itm.CStock || 0) * (itm.PurchasePrice || 0),
        `"${(itm.BatchNo || '').replace(/"/g, '""')}"`,
        `"${(itm.ExpDate || '').replace(/"/g, '""')}"`
      ];
    });

    const headers = [
      'S.No',
      'Item ID',
      'Medicine Name',
      'Category/Unit',
      'Type',
      'Dead Status',
      'Dead Reason',
      'Current Stock',
      'Unit Cost (Rs)',
      'Retail Price (Rs)',
      'Total Value (Cost Rs)',
      'Batch No',
      'Exp Date'
    ];

    const csvContent = [headers.join(','), ...exportData.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Dead_Items_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print A4 Dead Items List
  const handlePrintDeadReport = () => {
    const printItems = filteredItems;
    const totalUnits = printItems.reduce((acc, i) => acc + (i.CStock || 0), 0);
    const totalCost = printItems.reduce((acc, i) => acc + ((i.CStock || 0) * (i.PurchasePrice || 0)), 0);
    const totalRetail = printItems.reduce((acc, i) => acc + ((i.CStock || 0) * (i.Price || 0)), 0);

    const printWin = window.open('', '_blank');
    if (!printWin) {
      alert('Please allow popups to print the report.');
      return;
    }

    printWin.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Dead Items & Obsolete Inventory Report - ${clinicName}</title>
        <style>
          @page { size: A4 portrait; margin: 12mm 10mm; }
          body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 11px; color: #0f172a; margin: 0; padding: 0; line-height: 1.3; }
          .header { border-bottom: 2px solid #e11d48; padding-bottom: 8px; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: flex-end; }
          .title { font-size: 18px; font-weight: 800; color: #9f1239; text-transform: uppercase; margin: 0; }
          .sub { font-size: 11px; color: #475569; margin-top: 2px; }
          .meta { text-align: right; font-size: 10px; color: #64748b; }
          .summary-boxes { display: flex; gap: 8px; margin-bottom: 12px; }
          .box { flex: 1; background: #fff1f2; border: 1px solid #fecdd3; border-radius: 6px; padding: 6px 10px; }
          .box-label { font-size: 9px; font-weight: 700; color: #9f1239; text-transform: uppercase; }
          .box-val { font-size: 13px; font-weight: 800; color: #881337; font-family: monospace; }
          table { width: 100%; border-collapse: collapse; margin-top: 4px; }
          th { background: #881337; color: #ffffff; font-weight: 700; font-size: 9.5px; text-transform: uppercase; padding: 5px 6px; border: 1px solid #9f1239; text-align: left; }
          td { padding: 4.5px 6px; border: 1px solid #e2e8f0; font-size: 10px; }
          tr:nth-child(even) { background: #fafafa; }
          .dead-badge { background: #ffe4e6; color: #9f1239; border: 1px solid #fecdd3; padding: 1px 4px; border-radius: 3px; font-size: 8.5px; font-weight: 700; display: inline-block; }
          .active-badge { background: #dcfce7; color: #166534; border: 1px solid #bbf7d0; padding: 1px 4px; border-radius: 3px; font-size: 8.5px; font-weight: 700; display: inline-block; }
          .num { text-align: right; font-family: monospace; }
          .footer { margin-top: 16px; border-top: 1px solid #cbd5e1; padding-top: 8px; font-size: 9px; color: #64748b; display: flex; justify-content: space-between; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1 class="title">💀 Dead Items & Obsolete Inventory Report</h1>
            <div class="sub">${clinicName} • Stock Grid Control Manager</div>
          </div>
          <div class="meta">
            <div><strong>Generated:</strong> ${new Date().toLocaleString()}</div>
            <div><strong>Filter:</strong> ${categoryFilter} | Status: ${statusFilter}</div>
          </div>
        </div>

        <div class="summary-boxes">
          <div class="box">
            <div class="box-label">Total Listed Items</div>
            <div class="box-val">${printItems.length}</div>
          </div>
          <div class="box">
            <div class="box-label">Dead Stock Units</div>
            <div class="box-val">${totalUnits} Units</div>
          </div>
          <div class="box">
            <div class="box-label">Dead Cost Valuation</div>
            <div class="box-val">Rs. ${totalCost.toLocaleString()}</div>
          </div>
          <div class="box">
            <div class="box-label">Dead Retail Value</div>
            <div class="box-val">Rs. ${totalRetail.toLocaleString()}</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 25px;">#</th>
              <th style="width: 65px;">Item ID</th>
              <th>Medicine Name</th>
              <th style="width: 70px;">Category</th>
              <th style="width: 55px; text-align: center;">Status</th>
              <th>Dead Reason / Remarks</th>
              <th style="width: 45px; text-align: right;">Stock</th>
              <th style="width: 55px; text-align: right;">Cost (Rs)</th>
              <th style="width: 65px; text-align: right;">Total Cost</th>
              <th style="width: 60px;">Exp Date</th>
            </tr>
          </thead>
          <tbody>
            ${printItems.map((itm, idx) => {
              const isDead = Boolean(itm.IsDead || itm.Status === 'Dead' || itm.Status === 'DEAD');
              const itemCostVal = (itm.CStock || 0) * (itm.PurchasePrice || 0);
              return `
                <tr>
                  <td>${idx + 1}</td>
                  <td style="font-family: monospace; font-weight: bold;">${itm.ItemID}</td>
                  <td><strong>${itm.ItemName}</strong></td>
                  <td>${itm.Unit || 'Tab'} (${itm.MedicineType === 'C' ? 'C' : 'P'})</td>
                  <td style="text-align: center;">
                    <span class="${isDead ? 'dead-badge' : 'active-badge'}">${isDead ? 'DEAD' : 'ACTIVE'}</span>
                  </td>
                  <td style="font-size: 9px; color: #475569;">${itm.DeadReason || customReasons[itm.ItemID] || '-'}</td>
                  <td class="num" style="font-weight: bold; ${itm.CStock > 0 ? 'color: #9f1239;' : 'color: #94a3b8;'}">${itm.CStock || 0}</td>
                  <td class="num">${(itm.PurchasePrice || 0).toLocaleString()}</td>
                  <td class="num" style="font-weight: bold;">${itemCostVal.toLocaleString()}</td>
                  <td style="font-family: monospace; font-size: 9px;">${itm.ExpDate || '-'}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>

        <div class="footer">
          <span>Punjab Homeopathic Clinic & Pharmacy • Confidential Internal Inventory Audit</span>
          <span>Page 1 of 1 • System Report</span>
        </div>

        <script>
          window.onload = function() {
            window.print();
          };
        </script>
      </body>
      </html>
    `);
    printWin.document.close();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto animate-fadeIn">
      <div className="bg-white w-full max-w-7xl rounded-2xl shadow-2xl border border-slate-200 flex flex-col max-h-[94vh] overflow-hidden">
        
        {/* Header Section */}
        <div className="bg-gradient-to-r from-rose-950 via-slate-900 to-rose-950 text-white p-4 sm:p-5 flex items-center justify-between border-b border-rose-900/50 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-rose-500/20 text-rose-400 rounded-xl border border-rose-400/30">
              <AlertOctagon className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base sm:text-lg font-black tracking-wide text-white uppercase">
                  Dead Items Grid & Obsolete Inventory Manager
                </h3>
                <span className="px-2 py-0.5 bg-rose-500/30 text-rose-300 border border-rose-400/40 rounded-full text-[10px] font-black uppercase tracking-wider">
                  Stock Grid Control
                </span>
              </div>
              <p className="text-xs text-rose-200/80 mt-0.5">
                Mark or unmark items as Dead Items. Control slow-moving, expired, or discontinued stock with custom categories and real-time status.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 bg-slate-800 hover:bg-rose-900/60 text-slate-300 hover:text-white rounded-xl transition cursor-pointer border border-slate-700"
            title="Close Dead Items Manager"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Top Summary KPI Cards */}
        <div className="bg-slate-50 border-b border-slate-200 p-3 sm:p-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 shrink-0">
          <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Catalog Items</div>
            <div className="text-base font-black text-slate-900 font-mono mt-0.5">{stats.totalItems.toLocaleString()}</div>
          </div>

          <div className="bg-white p-2.5 rounded-xl border border-emerald-200 bg-emerald-50/30 shadow-2xs">
            <div className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Active Items</div>
            <div className="text-base font-black text-emerald-700 font-mono mt-0.5">{stats.activeItemsCount.toLocaleString()}</div>
          </div>

          <div className="bg-white p-2.5 rounded-xl border border-rose-300 bg-rose-50/40 shadow-2xs">
            <div className="text-[10px] font-bold text-rose-700 uppercase tracking-wider flex items-center justify-between">
              <span>Dead Items</span>
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
            </div>
            <div className="text-base font-black text-rose-700 font-mono mt-0.5">{stats.deadItemsCount.toLocaleString()}</div>
          </div>

          <div className="bg-white p-2.5 rounded-xl border border-amber-200 shadow-2xs">
            <div className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">Dead Stock Units</div>
            <div className="text-base font-black text-amber-800 font-mono mt-0.5">{stats.deadStockUnits.toLocaleString()}</div>
          </div>

          <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
            <div className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Dead Cost Valuation</div>
            <div className="text-sm font-black text-rose-900 font-mono mt-0.5">Rs. {stats.deadStockCostVal.toLocaleString()}</div>
          </div>

          <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
            <div className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Dead Retail Value</div>
            <div className="text-sm font-black text-indigo-900 font-mono mt-0.5">Rs. {stats.deadStockRetailVal.toLocaleString()}</div>
          </div>
        </div>

        {/* Filter Controls Toolbar */}
        <div className="p-3 sm:p-4 bg-white border-b border-slate-200 space-y-3 shrink-0">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
            
            {/* Search Input */}
            <div className="relative flex-1 min-w-[240px]">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by Medicine Name, Item ID, Category, Batch #, Reason..."
                value={searchQuery}
                onChange={e => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full text-xs border border-slate-300 bg-white placeholder-slate-400 rounded-xl pl-9 pr-8 py-2 focus:outline-none focus:ring-2 focus:ring-rose-500 font-medium"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setCurrentPage(1);
                  }}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Category Dropdown */}
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-slate-600 shrink-0">Category:</span>
              <select
                value={categoryFilter}
                onChange={e => {
                  setCategoryFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="text-xs font-bold bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500 cursor-pointer min-w-[170px]"
              >
                {categoryOptions.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter Pill Buttons */}
            <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl border border-slate-200 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setStatusFilter('ALL');
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  statusFilter === 'ALL'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All Items ({items.length})
              </button>
              <button
                type="button"
                onClick={() => {
                  setStatusFilter('ACTIVE_ONLY');
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center space-x-1 ${
                  statusFilter === 'ACTIVE_ONLY'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-emerald-700 hover:bg-emerald-50'
                }`}
              >
                <span>🟢 Active Only</span>
                <span className="text-[10px] font-mono font-black">({stats.activeItemsCount})</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setStatusFilter('DEAD_ONLY');
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center space-x-1 ${
                  statusFilter === 'DEAD_ONLY'
                    ? 'bg-rose-600 text-white shadow-xs ring-2 ring-rose-300'
                    : 'text-rose-700 hover:bg-rose-50'
                }`}
              >
                <span>💀 Dead Items Only</span>
                <span className="text-[10px] font-mono font-black">({stats.deadItemsCount})</span>
              </button>
            </div>

            {/* Stock filter */}
            <select
              value={stockFilter}
              onChange={e => {
                setStockFilter(e.target.value as any);
                setCurrentPage(1);
              }}
              className="text-xs font-bold bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500 cursor-pointer"
            >
              <option value="ALL">All Stock Levels</option>
              <option value="ZERO_STOCK">Zero Stock (0 Qty)</option>
              <option value="IN_STOCK">In Stock (&gt; 0 Qty)</option>
            </select>
          </div>

          {/* Bulk Action Controls Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-2 border-t border-slate-100">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleSelectAllVisible}
                className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition cursor-pointer border border-slate-200"
              >
                {paginatedItems.length > 0 && paginatedItems.every(i => selectedItemIds.has(i.ItemID)) ? (
                  <CheckSquare className="w-3.5 h-3.5 text-rose-600" />
                ) : (
                  <Square className="w-3.5 h-3.5 text-slate-400" />
                )}
                <span>Select Page ({paginatedItems.length})</span>
              </button>

              <button
                type="button"
                onClick={handleSelectAllFiltered}
                className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition cursor-pointer border border-slate-200"
              >
                {selectedItemIds.size === filteredItems.length && filteredItems.length > 0
                  ? 'Deselect All'
                  : `Select All Filtered (${filteredItems.length})`}
              </button>

              {selectedItemIds.size > 0 && (
                <div className="flex items-center space-x-2 pl-2 border-l border-slate-200">
                  <span className="text-xs font-black text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200 font-mono">
                    {selectedItemIds.size} selected
                  </span>

                  <select
                    value={bulkReason}
                    onChange={e => setBulkReason(e.target.value)}
                    className="text-xs font-medium bg-slate-50 border border-slate-300 rounded-lg px-2 py-1 text-slate-800"
                    title="Reason to attach when marking as Dead Item"
                  >
                    {COMMON_DEAD_REASONS.map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={handleBulkMarkAsDead}
                    disabled={isProcessing}
                    className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-black flex items-center space-x-1 transition cursor-pointer shadow-xs disabled:opacity-50"
                  >
                    <Ban className="w-3.5 h-3.5" />
                    <span>Mark Selected as DEAD</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleBulkMarkAsActive}
                    disabled={isProcessing}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-black flex items-center space-x-1 transition cursor-pointer shadow-xs disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Mark Selected as ACTIVE</span>
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-2 shrink-0">
              <button
                type="button"
                onClick={handlePrintDeadReport}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold flex items-center space-x-1.5 transition cursor-pointer border border-slate-700 shadow-2xs"
                title="Print official Dead Items audit report on A4 paper"
              >
                <Printer className="w-3.5 h-3.5 text-rose-400" />
                <span>Print Report (A4)</span>
              </button>

              <button
                type="button"
                onClick={handleExportCSV}
                className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold flex items-center space-x-1.5 transition cursor-pointer border border-emerald-600 shadow-2xs"
                title="Export list to Excel / CSV"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>
        </div>

        {/* Feedback Alert Message */}
        {feedbackMsg && (
          <div
            className={`px-4 py-2.5 text-xs font-bold flex items-center justify-between border-b ${
              feedbackMsg.type === 'success'
                ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                : 'bg-rose-50 text-rose-900 border-rose-200'
            }`}
          >
            <div className="flex items-center space-x-2">
              {feedbackMsg.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{feedbackMsg.text}</span>
            </div>
            <button
              type="button"
              onClick={() => setFeedbackMsg(null)}
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Main Grid Table Area */}
        <div className="flex-1 overflow-auto bg-slate-50 p-3 sm:p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-900 text-white text-[11px] font-bold uppercase tracking-wider sticky top-0 z-10 select-none shadow-sm">
                <tr>
                  <th className="p-3 w-10 text-center">
                    <button
                      type="button"
                      onClick={handleSelectAllVisible}
                      className="cursor-pointer text-slate-300 hover:text-white"
                    >
                      {paginatedItems.length > 0 && paginatedItems.every(i => selectedItemIds.has(i.ItemID)) ? (
                        <CheckSquare className="w-4 h-4 text-rose-400" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-400" />
                      )}
                    </button>
                  </th>
                  <th className="p-3 w-32 text-center text-rose-300 bg-rose-950/70 border-x border-rose-900">
                    Dead Status
                  </th>
                  <th className="p-3 w-12 text-center">#</th>
                  <th className="p-3 w-28">Item ID</th>
                  <th className="p-3 min-w-[200px]">Medicine Name</th>
                  <th className="p-3 w-28">Category / Unit</th>
                  <th className="p-3 w-20 text-center">Type</th>
                  <th className="p-3 w-24 text-right">Current Stock</th>
                  <th className="p-3 w-24 text-right">Cost (Rs)</th>
                  <th className="p-3 w-24 text-right">Retail (Rs)</th>
                  <th className="p-3 w-28 text-right">Dead Val (Rs)</th>
                  <th className="p-3 w-32">Batch & Exp</th>
                  <th className="p-3 min-w-[220px]">Dead Reason / Notes</th>
                  <th className="p-3 w-28 text-center">Quick Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {paginatedItems.length === 0 ? (
                  <tr>
                    <td colSpan={14} className="p-8 text-center text-slate-500">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <AlertOctagon className="w-8 h-8 text-slate-300" />
                        <span className="font-bold text-slate-700">No medicines found matching your criteria.</span>
                        <span className="text-xxs text-slate-400">Try changing your search keywords, category, or status filter.</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedItems.map((itm, index) => {
                    const isDead = Boolean(itm.IsDead || itm.Status === 'Dead' || itm.Status === 'DEAD');
                    const isSelected = selectedItemIds.has(itm.ItemID);
                    const stockVal = (itm.CStock || 0) * (itm.PurchasePrice || 0);

                    return (
                      <tr
                        key={itm.ItemID}
                        className={`transition-colors duration-150 ${
                          isDead
                            ? isSelected
                              ? 'bg-rose-100/90 hover:bg-rose-100'
                              : 'bg-rose-50/60 hover:bg-rose-100/70 text-slate-900'
                            : isSelected
                            ? 'bg-indigo-50/80 hover:bg-indigo-50'
                            : 'hover:bg-slate-50/80 text-slate-800'
                        }`}
                      >
                        {/* Checkbox for selection */}
                        <td className="p-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleToggleSelectRow(itm.ItemID)}
                            className="cursor-pointer text-slate-500 hover:text-slate-800"
                          >
                            {isSelected ? (
                              <CheckSquare className="w-4 h-4 text-indigo-600" />
                            ) : (
                              <Square className="w-4 h-4 text-slate-300" />
                            )}
                          </button>
                        </td>

                        {/* Direct Dead Status Checkbox & Toggle Switch */}
                        <td className="p-2.5 text-center bg-rose-50/30 border-x border-rose-100">
                          <label
                            className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg border font-black text-[11px] cursor-pointer transition select-none ${
                              isDead
                                ? 'bg-rose-600 hover:bg-rose-700 text-white border-rose-700 shadow-xs ring-1 ring-rose-400'
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-300'
                            }`}
                            title={isDead ? 'Click to unmark (Restore to Active)' : 'Click to mark as DEAD ITEM'}
                          >
                            <input
                              type="checkbox"
                              checked={isDead}
                              onChange={() => handleToggleSingleItemDeadStatus(itm)}
                              className="w-3.5 h-3.5 accent-rose-600 cursor-pointer rounded"
                            />
                            <span>{isDead ? '💀 DEAD' : 'ACTIVE'}</span>
                          </label>
                        </td>

                        {/* S.No */}
                        <td className="p-3 text-center text-slate-400 font-mono text-[11px]">
                          {startIndex + index + 1}
                        </td>

                        {/* Item ID */}
                        <td className="p-3 font-mono font-bold text-slate-700 text-[11px]">
                          <span className="px-1.5 py-0.5 bg-slate-100 rounded border border-slate-200">
                            {itm.ItemID}
                          </span>
                        </td>

                        {/* Medicine Name */}
                        <td className="p-3 font-bold text-slate-900">
                          <div className="flex items-center space-x-1.5">
                            <span className={isDead ? 'text-rose-950 font-black' : 'text-slate-900'}>
                              {itm.ItemName}
                            </span>
                            {isDead && (
                              <span className="px-1.5 py-0.2 bg-rose-200 text-rose-900 rounded text-[9px] font-black border border-rose-300">
                                DEAD
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Category / Unit */}
                        <td className="p-3 font-medium text-slate-700">
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-800 rounded-md border border-slate-200 text-[11px]">
                            {itm.Unit || 'Tab'}
                          </span>
                        </td>

                        {/* Type */}
                        <td className="p-3 text-center">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-black font-mono ${
                              itm.MedicineType === 'C'
                                ? 'bg-teal-100 text-teal-800 border border-teal-300'
                                : 'bg-purple-100 text-purple-800 border border-purple-300'
                            }`}
                          >
                            {itm.MedicineType === 'C' ? 'CLINICAL' : 'PATENT'}
                          </span>
                        </td>

                        {/* Current Stock */}
                        <td className="p-3 text-right font-mono font-black">
                          <span
                            className={
                              (itm.CStock || 0) <= 0
                                ? 'text-slate-400'
                                : isDead
                                ? 'text-rose-700 font-extrabold'
                                : 'text-emerald-700'
                            }
                          >
                            {(itm.CStock || 0).toLocaleString()}
                          </span>
                        </td>

                        {/* Purchase Price */}
                        <td className="p-3 text-right font-mono text-slate-700">
                          Rs. {(itm.PurchasePrice || 0).toLocaleString()}
                        </td>

                        {/* Retail Price */}
                        <td className="p-3 text-right font-mono font-bold text-slate-800">
                          Rs. {(itm.Price || 0).toLocaleString()}
                        </td>

                        {/* Dead Stock Valuation */}
                        <td className="p-3 text-right font-mono font-black text-rose-800">
                          {isDead && (itm.CStock || 0) > 0 ? (
                            `Rs. ${stockVal.toLocaleString()}`
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </td>

                        {/* Batch & Exp */}
                        <td className="p-3 font-mono text-[10px] text-slate-600">
                          <div>{itm.BatchNo ? `B# ${itm.BatchNo}` : 'No Batch'}</div>
                          <div className="text-slate-500 font-semibold">{itm.ExpDate ? `Exp: ${itm.ExpDate}` : '-'}</div>
                        </td>

                        {/* Reason / Notes */}
                        <td className="p-2">
                          <div className="flex items-center space-x-1">
                            <input
                              type="text"
                              placeholder={isDead ? 'Reason for dead status...' : 'Optional notes...'}
                              value={
                                customReasons[itm.ItemID] !== undefined
                                  ? customReasons[itm.ItemID]
                                  : itm.DeadReason || ''
                              }
                              onChange={e => {
                                const val = e.target.value;
                                setCustomReasons(prev => ({ ...prev, [itm.ItemID]: val }));
                              }}
                              onBlur={() => {
                                const val = customReasons[itm.ItemID];
                                if (val !== undefined && val !== itm.DeadReason) {
                                  onUpdateItemDeadStatus(itm.ItemID, isDead, val);
                                }
                              }}
                              className={`w-full text-[11px] px-2 py-1 rounded border ${
                                isDead
                                  ? 'bg-white border-rose-300 text-rose-950 placeholder-rose-300 focus:ring-1 focus:ring-rose-500'
                                  : 'bg-slate-50 border-slate-300 text-slate-800 placeholder-slate-400 focus:bg-white'
                              } focus:outline-none`}
                            />
                          </div>
                        </td>

                        {/* Quick Toggle Action Button */}
                        <td className="p-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleToggleSingleItemDeadStatus(itm)}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-black transition cursor-pointer border shadow-2xs ${
                              isDead
                                ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300'
                                : 'bg-rose-50 hover:bg-rose-100 text-rose-800 border-rose-300'
                            }`}
                          >
                            {isDead ? 'Restore Active' : 'Mark Dead'}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer Pagination & Close */}
        <div className="bg-slate-900 text-white p-3 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0 border-t border-slate-800">
          <div className="flex items-center space-x-3 text-xs">
            <span className="text-slate-400 font-medium">
              Showing <strong className="text-white font-mono">{filteredItems.length === 0 ? 0 : startIndex + 1}</strong> to{' '}
              <strong className="text-white font-mono">{endIndex}</strong> of{' '}
              <strong className="text-rose-400 font-mono">{filteredItems.length}</strong> matching medicines
            </span>

            <div className="flex items-center space-x-1.5 pl-3 border-l border-slate-700">
              <span className="text-slate-400 text-xxs font-bold uppercase">Page Size:</span>
              <select
                value={pageSize}
                onChange={e => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-slate-800 text-white text-xs border border-slate-700 rounded-lg px-2 py-1 cursor-pointer focus:outline-none"
              >
                <option value={25}>25 / page</option>
                <option value={50}>50 / page</option>
                <option value={100}>100 / page</option>
                <option value={250}>250 / page</option>
                <option value={-1}>All Items</option>
              </select>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {!isAllPages && totalPages > 1 && (
              <div className="flex items-center space-x-1 mr-2">
                <button
                  type="button"
                  disabled={safePage <= 1}
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-bold disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed border border-slate-700"
                >
                  Prev
                </button>
                <span className="px-2 text-xs font-mono text-slate-300">
                  {safePage} / {totalPages}
                </span>
                <button
                  type="button"
                  disabled={safePage >= totalPages}
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-bold disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed border border-slate-700"
                >
                  Next
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-black transition cursor-pointer shadow-sm"
            >
              Done / Close Manager
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default PharmacyDeadItemsModal;
