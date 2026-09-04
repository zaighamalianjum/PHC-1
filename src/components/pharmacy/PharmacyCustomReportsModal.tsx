/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  X,
  Printer,
  Download,
  Filter,
  Package,
  AlertOctagon,
  AlertTriangle,
  TrendingUp,
  DollarSign,
  Calendar,
  Clock,
  Search,
  ShoppingCart,
  CheckCircle2,
  RefreshCw,
  BarChart3,
  SlidersHorizontal,
  ChevronDown,
  Layers,
  ArrowUpDown,
  ArrowLeft
} from 'lucide-react';
import { Item, InvoiceHeader, InvoiceDetail } from '../../types';

export type CustomReportType =
  | 'CURRENT_STOCK'
  | 'DEAD_STOCK'
  | 'MIN_THRESHOLD'
  | 'REORDER_QTY'
  | 'MAX_SALE'
  | 'SLOW_MOVING'
  | 'HIGH_VALUATION'
  | 'EXPIRY_ALERT';

interface PharmacyCustomReportsModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: Item[];
  categories?: string[];
  invoices?: InvoiceHeader[];
  invoiceDetails?: InvoiceDetail[];
  clinicSettings?: any;
  currentUser?: any;
  mode?: 'modal' | 'page';
}

export const PharmacyCustomReportsModal: React.FC<PharmacyCustomReportsModalProps> = ({
  isOpen,
  onClose,
  items,
  categories = [],
  invoices = [],
  invoiceDetails = [],
  clinicSettings,
  currentUser,
  mode = 'modal'
}) => {
  // Report Type Selection
  const [reportType, setReportType] = useState<CustomReportType>('MAX_SALE');

  // Filters & Parameters
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [stockScopeFilter, setStockScopeFilter] = useState<'ALL' | 'IN_STOCK' | 'LOW_STOCK' | 'ZERO_STOCK'>('ALL');
  const [salesPeriod, setSalesPeriod] = useState<'ALL_TIME' | 'TODAY' | 'LAST_7_DAYS' | 'LAST_30_DAYS' | 'LAST_90_DAYS'>('ALL_TIME');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [recordLimit, setRecordLimit] = useState<number>(50);
  const [sortBy, setSortBy] = useState<string>('DEFAULT');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Categories list options
  const categoryOptions = useMemo(() => {
    const set = new Set<string>();
    items.forEach((itm) => {
      if (itm.Unit && itm.Unit.trim()) set.add(itm.Unit.trim());
      if (itm.Category && itm.Category.trim()) set.add(itm.Category.trim());
    });
    categories.forEach((c) => {
      if (c && c.trim()) set.add(c.trim());
    });
    const sorted = Array.from(set).sort();
    return [
      { id: 'ALL', label: 'All Categories / Units' },
      { id: 'C', label: 'Clinical Compounding (/C)' },
      { id: 'P', label: 'Patent Medicines (/P)' },
      ...sorted.map((c) => ({ id: c, label: c }))
    ];
  }, [items, categories]);

  // Sales date filtering helper
  const isInvoiceInPeriod = useMemo(() => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    const ninetyDaysAgo = new Date(today);
    ninetyDaysAgo.setDate(today.getDate() - 90);
    ninetyDaysAgo.setHours(0, 0, 0, 0);

    const todayStart = new Date(today);
    todayStart.setHours(0, 0, 0, 0);

    return (invDateStr?: string) => {
      if (!invDateStr) return false;
      const invDate = new Date(invDateStr);
      if (isNaN(invDate.getTime())) return false;

      if (salesPeriod === 'TODAY') {
        return invDate >= todayStart && invDate <= today;
      }
      if (salesPeriod === 'LAST_7_DAYS') {
        return invDate >= sevenDaysAgo && invDate <= today;
      }
      if (salesPeriod === 'LAST_30_DAYS') {
        return invDate >= thirtyDaysAgo && invDate <= today;
      }
      if (salesPeriod === 'LAST_90_DAYS') {
        return invDate >= ninetyDaysAgo && invDate <= today;
      }
      return true; // ALL_TIME
    };
  }, [salesPeriod]);

  // Aggregated Sales Data per Item
  const itemSalesMap = useMemo(() => {
    const invDateMap = new Map<string, string>();
    invoices.forEach((inv) => {
      invDateMap.set(inv.InvoiceNo, inv.InvoiceDate || '');
    });

    const map = new Map<string, { unitsSold: number; revenue: number; invoiceCount: number }>();

    invoiceDetails.forEach((det) => {
      const invDate = invDateMap.get(det.InvoiceNo);
      if (salesPeriod === 'ALL_TIME' || (invDate && isInvoiceInPeriod(invDate))) {
        const existing = map.get(det.ItemID) || { unitsSold: 0, revenue: 0, invoiceCount: 0 };
        const qty = Number(det.Qty || 0);
        const price = Number(det.Price || 0);
        const lineTotal = det.LineTotal !== undefined ? Number(det.LineTotal) : qty * price;
        existing.unitsSold += qty;
        existing.revenue += lineTotal;
        existing.invoiceCount += 1;
        map.set(det.ItemID, existing);
      }
    });

    return map;
  }, [invoices, invoiceDetails, salesPeriod, isInvoiceInPeriod]);

  // Process and filter records based on current Report Type and Parameters
  const reportData = useMemo(() => {
    let list = [...items];

    // Filter by Category
    if (categoryFilter !== 'ALL') {
      if (categoryFilter === 'C') {
        list = list.filter((i) => i.MedicineType === 'C');
      } else if (categoryFilter === 'P') {
        list = list.filter((i) => i.MedicineType !== 'C');
      } else {
        const cat = categoryFilter.toLowerCase().trim();
        list = list.filter((i) => {
          const u = (i.Unit || '').toLowerCase().trim();
          const c = (i.Category || '').toLowerCase().trim();
          return u === cat || u.includes(cat) || c === cat || c.includes(cat);
        });
      }
    }

    // Filter by Stock Scope
    if (stockScopeFilter !== 'ALL') {
      list = list.filter((i) => {
        const stock = Number(i.CStock ?? (i as any).Stock ?? 0);
        const min = (i.MinStock !== undefined && i.MinStock !== null) ? Number(i.MinStock) : 1;
        if (stockScopeFilter === 'IN_STOCK') return stock > 0;
        if (stockScopeFilter === 'ZERO_STOCK') return stock <= 0;
        if (stockScopeFilter === 'LOW_STOCK') return stock <= min;
        return true;
      });
    }

    // Filter by Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((i) => {
        return (
          i.ItemID.toLowerCase().includes(q) ||
          i.ItemName.toLowerCase().includes(q) ||
          (i.Unit || '').toLowerCase().includes(q) ||
          (i.BatchNo || '').toLowerCase().includes(q) ||
          (i.VendorBarcode || '').toLowerCase().includes(q)
        );
      });
    }

    // Report Type specific filtering and scoring
    interface EnrichedItem {
      item: Item;
      isDead: boolean;
      stock: number;
      minStock: number;
      reorderQty: number;
      costValuation: number;
      retailValuation: number;
      unitsSold: number;
      salesRevenue: number;
      invoiceCount: number;
      deficitQty: number;
      daysToExpiry: number | null;
      expiryStatus: 'EXPIRED' | 'NEAR_EXPIRY' | 'VALID' | 'NO_EXPIRY';
    }

    const todayMs = new Date().getTime();

    let enriched: EnrichedItem[] = list.map((i) => {
      const isDead = Boolean(i.IsDead || i.Status === 'Dead' || i.Status === 'DEAD');
      const stock = Number(i.CStock ?? (i as any).Stock ?? 0);
      const minStock = (i.MinStock !== undefined && i.MinStock !== null) ? Number(i.MinStock) : 1;
      const reorderQty = Number(i.ReorderQty || 0);
      const costValuation = stock * (Number(i.PurchasePrice) || 0);
      const retailValuation = stock * (Number(i.Price) || 0);
      const sales = itemSalesMap.get(i.ItemID) || { unitsSold: 0, revenue: 0, invoiceCount: 0 };
      const deficitQty = Math.max(0, minStock - stock);

      let daysToExpiry: number | null = null;
      let expiryStatus: 'EXPIRED' | 'NEAR_EXPIRY' | 'VALID' | 'NO_EXPIRY' = 'NO_EXPIRY';
      const expDateStr = i.ExpDate || (i.Batches && i.Batches[0]?.ExpDate);

      if (expDateStr) {
        const expDate = new Date(expDateStr);
        if (!isNaN(expDate.getTime())) {
          const diffDays = Math.ceil((expDate.getTime() - todayMs) / (1000 * 60 * 60 * 24));
          daysToExpiry = diffDays;
          if (diffDays <= 0) {
            expiryStatus = 'EXPIRED';
          } else if (diffDays <= 90) {
            expiryStatus = 'NEAR_EXPIRY';
          } else {
            expiryStatus = 'VALID';
          }
        }
      }

      return {
        item: i,
        isDead,
        stock,
        minStock,
        reorderQty,
        costValuation,
        retailValuation,
        unitsSold: sales.unitsSold,
        salesRevenue: sales.revenue,
        invoiceCount: sales.invoiceCount,
        deficitQty,
        daysToExpiry,
        expiryStatus
      };
    });

    // Specific report type filters:
    switch (reportType) {
      case 'CURRENT_STOCK':
        // Strictly Active stock (exclude dead stock)
        enriched = enriched.filter((e) => !e.isDead);
        break;

      case 'DEAD_STOCK':
        // Strictly Dead items
        enriched = enriched.filter((e) => e.isDead);
        break;

      case 'MIN_THRESHOLD':
        // Strictly Active items where stock <= minStock
        enriched = enriched.filter((e) => !e.isDead && e.stock <= e.minStock);
        break;

      case 'REORDER_QTY':
        // Active items needing reorder (reorderQty > 0 or stock <= minStock)
        enriched = enriched.filter((e) => !e.isDead && (e.reorderQty > 0 || e.stock <= e.minStock));
        break;

      case 'MAX_SALE':
        // Fast moving / top selling medicines (exclude dead stock)
        enriched = enriched.filter((e) => !e.isDead && e.unitsSold > 0);
        break;

      case 'SLOW_MOVING':
        // Active items with 0 sales or lowest sales, with positive stock
        enriched = enriched.filter((e) => !e.isDead && e.stock > 0 && e.unitsSold === 0);
        break;

      case 'HIGH_VALUATION':
        // Active items with stock > 0
        enriched = enriched.filter((e) => !e.isDead && e.stock > 0);
        break;

      case 'EXPIRY_ALERT':
        // Expired or near expiry items
        enriched = enriched.filter((e) => e.expiryStatus === 'EXPIRED' || e.expiryStatus === 'NEAR_EXPIRY');
        break;
    }

    // Sorting
    enriched.sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'UNITS_SOLD' || reportType === 'MAX_SALE') {
        comparison = a.unitsSold - b.unitsSold;
      } else if (sortBy === 'STOCK') {
        comparison = a.stock - b.stock;
      } else if (sortBy === 'REORDER_QTY' || reportType === 'REORDER_QTY') {
        comparison = a.reorderQty - b.reorderQty;
      } else if (sortBy === 'VALUATION' || reportType === 'HIGH_VALUATION') {
        comparison = a.costValuation - b.costValuation;
      } else if (sortBy === 'NAME') {
        comparison = a.item.ItemName.localeCompare(b.item.ItemName);
      } else if (reportType === 'MIN_THRESHOLD') {
        // Sort by biggest shortage first
        comparison = b.deficitQty - a.deficitQty;
        return comparison;
      } else if (reportType === 'EXPIRY_ALERT') {
        comparison = (a.daysToExpiry ?? 9999) - (b.daysToExpiry ?? 9999);
        return comparison;
      } else {
        // Default
        if (reportType === 'MAX_SALE') {
          comparison = a.unitsSold - b.unitsSold;
        } else if (reportType === 'SLOW_MOVING') {
          comparison = b.costValuation - a.costValuation; // Most capital locked first
          return comparison;
        } else {
          comparison = a.item.ItemName.localeCompare(b.item.ItemName);
          return sortDirection === 'desc' ? -comparison : comparison;
        }
      }

      return sortDirection === 'desc' ? -comparison : comparison;
    });

    return enriched;
  }, [
    items,
    categoryFilter,
    stockScopeFilter,
    searchQuery,
    reportType,
    sortBy,
    sortDirection,
    itemSalesMap
  ]);

  // Paginated/Limited Slice for preview
  const previewList = useMemo(() => {
    if (recordLimit <= 0) return reportData;
    return reportData.slice(0, recordLimit);
  }, [reportData, recordLimit]);

  // Overall KPIs for this Report
  const kpiSummary = useMemo(() => {
    const totalCount = reportData.length;
    const totalUnits = reportData.reduce((sum, r) => sum + r.stock, 0);
    const totalCostValuation = reportData.reduce((sum, r) => sum + r.costValuation, 0);
    const totalRetailValuation = reportData.reduce((sum, r) => sum + r.retailValuation, 0);
    const totalUnitsSold = reportData.reduce((sum, r) => sum + r.unitsSold, 0);
    const totalSalesRevenue = reportData.reduce((sum, r) => sum + r.salesRevenue, 0);
    const totalReorderUnits = reportData.reduce((sum, r) => sum + r.reorderQty, 0);
    const totalDeficitUnits = reportData.reduce((sum, r) => sum + r.deficitQty, 0);

    return {
      totalCount,
      totalUnits,
      totalCostValuation,
      totalRetailValuation,
      totalUnitsSold,
      totalSalesRevenue,
      totalReorderUnits,
      totalDeficitUnits
    };
  }, [reportData]);

  // Report configuration metadata
  const reportMeta = useMemo(() => {
    switch (reportType) {
      case 'CURRENT_STOCK':
        return {
          title: 'CURRENT ACTIVE INVENTORY & VALUATION REPORT',
          shortTitle: 'Current Active Stock',
          icon: <Package className="w-4 h-4 text-emerald-600" />,
          color: 'emerald',
          description: 'Verified active stock catalog excluding dead items, with cost & retail valuation'
        };
      case 'DEAD_STOCK':
        return {
          title: 'DEAD & OBSOLETE INVENTORY AUDIT & WRITE-OFF REPORT',
          shortTitle: 'Dead Stock Audit',
          icon: <AlertOctagon className="w-4 h-4 text-rose-600" />,
          color: 'rose',
          description: 'Obsolete, damaged, or slow-moving items marked dead with capital write-off loss'
        };
      case 'MIN_THRESHOLD':
        return {
          title: 'MINIMUM THRESHOLD & CRITICAL SHORTAGE ALERT REPORT',
          shortTitle: 'Min Threshold Alerts',
          icon: <AlertTriangle className="w-4 h-4 text-amber-600" />,
          color: 'amber',
          description: 'Medicines running at or below minimum threshold requiring replenishment'
        };
      case 'REORDER_QTY':
        return {
          title: 'PURCHASE REORDER (PO) QUANTITY REQUISITION REPORT',
          shortTitle: 'PO Reorder Requisition',
          icon: <ShoppingCart className="w-4 h-4 text-indigo-600" />,
          color: 'indigo',
          description: 'Calculated order quantities to restore optimal pharmacy buffer stocks'
        };
      case 'MAX_SALE':
        return {
          title: 'MAXIMUM SALE MEDICINES (FAST-MOVING & HIGH VOLUME) REPORT',
          shortTitle: 'Top Selling Medicines',
          icon: <TrendingUp className="w-4 h-4 text-purple-600" />,
          color: 'purple',
          description: 'Top dispensed and sold medicines ranked by units sold and sales revenue'
        };
      case 'SLOW_MOVING':
        return {
          title: 'SLOW-MOVING & NON-SELLING INVENTORY CAPITAL REPORT',
          shortTitle: 'Slow Moving Stock',
          icon: <Clock className="w-4 h-4 text-slate-600" />,
          color: 'slate',
          description: 'Medicines with zero or minimal sales locking up working capital in inventory'
        };
      case 'HIGH_VALUATION':
        return {
          title: 'HIGH VALUATION CAPITAL ASSETS INVENTORY REPORT',
          shortTitle: 'High Value Stock',
          icon: <DollarSign className="w-4 h-4 text-cyan-600" />,
          color: 'cyan',
          description: 'Highest value inventory items holding the largest share of clinic capital'
        };
      case 'EXPIRY_ALERT':
        return {
          title: 'EXPIRY & SHELF-LIFE CRITICAL AUDIT REPORT',
          shortTitle: 'Expiry Date Alerts',
          icon: <Calendar className="w-4 h-4 text-rose-600" />,
          color: 'rose',
          description: 'Expired items and batches expiring within the next 90 days'
        };
    }
  }, [reportType]);

  // CSV Export Handler
  const handleExportCsv = () => {
    if (reportData.length === 0) {
      alert('No records available to export.');
      return;
    }

    let headers: string[] = [];
    let rows: any[][] = [];

    if (reportType === 'MAX_SALE') {
      headers = [
        'Rank',
        'Item ID',
        'Medicine Name',
        'Category / Unit',
        'Medicine Type',
        'Units Sold',
        'Sales Revenue (Rs)',
        'Invoices Count',
        'Current Stock',
        'Min Threshold',
        'Retail Price (Rs)',
        'Unit Cost (Rs)'
      ];
      rows = reportData.map((r, idx) => [
        idx + 1,
        `"${r.item.ItemID.replace(/"/g, '""')}"`,
        `"${r.item.ItemName.replace(/"/g, '""')}"`,
        `"${(r.item.Unit || 'Tab').replace(/"/g, '""')}"`,
        r.item.MedicineType === 'C' ? 'Clinical' : 'Patent',
        r.unitsSold,
        r.salesRevenue,
        r.invoiceCount,
        r.stock,
        r.minStock,
        r.item.Price,
        r.item.PurchasePrice
      ]);
    } else if (reportType === 'DEAD_STOCK') {
      headers = [
        'S.No',
        'Item ID',
        'Medicine Name',
        'Category / Unit',
        'Dead Reason',
        'Units Scrapped',
        'Unit Cost (Rs)',
        'Write-Off Loss (Rs)',
        'Retail Value (Rs)',
        'Batch No',
        'Exp Date'
      ];
      rows = reportData.map((r, idx) => [
        idx + 1,
        `"${r.item.ItemID.replace(/"/g, '""')}"`,
        `"${r.item.ItemName.replace(/"/g, '""')}"`,
        `"${(r.item.Unit || 'Tab').replace(/"/g, '""')}"`,
        `"${(r.item.DeadReason || 'Obsolete / Dead Stock').replace(/"/g, '""')}"`,
        r.stock,
        r.item.PurchasePrice,
        r.costValuation,
        r.retailValuation,
        `"${(r.item.BatchNo || '').replace(/"/g, '""')}"`,
        `"${(r.item.ExpDate || '').replace(/"/g, '""')}"`
      ]);
    } else if (reportType === 'REORDER_QTY') {
      headers = [
        'S.No',
        'Item ID',
        'Medicine Name',
        'Category / Unit',
        'Current Stock',
        'Min Threshold',
        'Suggested PO Reorder Qty',
        'Unit Cost (Rs)',
        'Est. Order Cost (Rs)',
        'Retail Price (Rs)'
      ];
      rows = reportData.map((r, idx) => [
        idx + 1,
        `"${r.item.ItemID.replace(/"/g, '""')}"`,
        `"${r.item.ItemName.replace(/"/g, '""')}"`,
        `"${(r.item.Unit || 'Tab').replace(/"/g, '""')}"`,
        r.stock,
        r.minStock,
        r.reorderQty || Math.max(1, r.minStock * 2),
        r.item.PurchasePrice,
        (r.reorderQty || Math.max(1, r.minStock * 2)) * r.item.PurchasePrice,
        r.item.Price
      ]);
    } else if (reportType === 'MIN_THRESHOLD') {
      headers = [
        'S.No',
        'Item ID',
        'Medicine Name',
        'Category / Unit',
        'Current Stock',
        'Min Threshold',
        'Deficit Shortage Units',
        'Recommended Reorder',
        'Unit Cost (Rs)',
        'Status'
      ];
      rows = reportData.map((r, idx) => [
        idx + 1,
        `"${r.item.ItemID.replace(/"/g, '""')}"`,
        `"${r.item.ItemName.replace(/"/g, '""')}"`,
        `"${(r.item.Unit || 'Tab').replace(/"/g, '""')}"`,
        r.stock,
        r.minStock,
        r.deficitQty,
        r.reorderQty || 1,
        r.item.PurchasePrice,
        r.stock <= 0 ? 'OUT OF STOCK' : 'LOW STOCK'
      ]);
    } else {
      // General inventory format
      headers = [
        'S.No',
        'Item ID',
        'Medicine Name',
        'Category / Unit',
        'Type',
        'Current Stock',
        'Min Threshold',
        'Unit Cost (Rs)',
        'Retail Price (Rs)',
        'Cost Valuation (Rs)',
        'Retail Valuation (Rs)',
        'Batch No',
        'Exp Date'
      ];
      rows = reportData.map((r, idx) => [
        idx + 1,
        `"${r.item.ItemID.replace(/"/g, '""')}"`,
        `"${r.item.ItemName.replace(/"/g, '""')}"`,
        `"${(r.item.Unit || 'Tab').replace(/"/g, '""')}"`,
        r.item.MedicineType === 'C' ? 'Clinical' : 'Patent',
        r.stock,
        r.minStock,
        r.item.PurchasePrice,
        r.item.Price,
        r.costValuation,
        r.retailValuation,
        `"${(r.item.BatchNo || '').replace(/"/g, '""')}"`,
        `"${(r.item.ExpDate || '').replace(/"/g, '""')}"`
      ]);
    }

    const csvContent = [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    const filename = `${reportType}_Report_${new Date().toISOString().slice(0, 10)}.csv`;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print A4 Formatted Report
  const handlePrintA4Report = () => {
    if (reportData.length === 0) {
      alert('No records available to print.');
      return;
    }

    const printWin = window.open('', '_blank', 'width=1100,height=900');
    if (!printWin) {
      alert('Please allow popups to generate and print the report.');
      return;
    }

    const clinicName = clinicSettings?.ClinicName || 'Punjab Homeopathic Clinic';
    const clinicAddress = clinicSettings?.ClinicAddress || clinicSettings?.Address || 'Opposite State Bank, Mall Road, Lahore';
    const clinicPhone = clinicSettings?.PhoneMobile || clinicSettings?.PhoneNo || '042-3111222';
    const clinicTagline = clinicSettings?.ClinicLogoText || 'Advanced Health Care & Clinical Pharmacy';
    const logoSrc = clinicSettings?.ClinicLogoImage || clinicSettings?.Logo || '/logo.png';
    const printDate = new Date().toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }) + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    let tableHeaderHtml = '';
    let tableRowsHtml = '';

    if (reportType === 'MAX_SALE') {
      tableHeaderHtml = `
        <tr>
          <th style="width: 5%;">Rank</th>
          <th style="width: 10%;">Item ID</th>
          <th style="width: 28%; text-align: left;">Medicine / Item Name</th>
          <th style="width: 12%;">Category</th>
          <th style="width: 10%; text-align: right;">Units Sold</th>
          <th style="width: 13%; text-align: right;">Sales Revenue (Rs)</th>
          <th style="width: 11%; text-align: right;">Current Stock</th>
          <th style="width: 11%; text-align: right;">Retail Price</th>
        </tr>
      `;
      tableRowsHtml = reportData.map((r, idx) => `
        <tr ${idx < 3 ? 'style="background: #fdf4ff;"' : ''}>
          <td style="text-align: center; font-weight: bold;">
            ${idx === 0 ? '🥇 1' : idx === 1 ? '🥈 2' : idx === 2 ? '🥉 3' : (idx + 1)}
          </td>
          <td style="text-align: center; font-family: monospace; font-weight: bold;">${r.item.ItemID}</td>
          <td style="text-align: left; font-weight: bold; color: #0f172a;">${r.item.ItemName}</td>
          <td style="text-align: center;">${r.item.Unit || 'Tab'}</td>
          <td style="text-align: right; font-weight: 900; color: #7e22ce; font-size: 11px;">${r.unitsSold.toLocaleString()}</td>
          <td style="text-align: right; font-weight: bold; color: #047857; font-family: monospace;">Rs. ${r.salesRevenue.toLocaleString()}</td>
          <td style="text-align: right; font-weight: bold; color: ${r.stock <= r.minStock ? '#dc2626' : '#334155'};">${r.stock}</td>
          <td style="text-align: right; font-family: monospace;">Rs. ${r.item.Price}</td>
        </tr>
      `).join('');
    } else if (reportType === 'DEAD_STOCK') {
      tableHeaderHtml = `
        <tr>
          <th style="width: 5%;">S#</th>
          <th style="width: 10%;">Item ID</th>
          <th style="width: 25%; text-align: left;">Medicine Name</th>
          <th style="width: 10%;">Category</th>
          <th style="width: 20%; text-align: left;">Reason for Dead Status</th>
          <th style="width: 10%; text-align: right;">Dead Units</th>
          <th style="width: 10%; text-align: right;">Unit Cost</th>
          <th style="width: 10%; text-align: right;">Write-Off Loss</th>
        </tr>
      `;
      tableRowsHtml = reportData.map((r, idx) => `
        <tr style="background: #fff1f2;">
          <td style="text-align: center;">${idx + 1}</td>
          <td style="text-align: center; font-family: monospace; font-weight: bold; color: #991b1b;">${r.item.ItemID}</td>
          <td style="text-align: left; font-weight: bold;">${r.item.ItemName}</td>
          <td style="text-align: center;">${r.item.Unit || 'Tab'}</td>
          <td style="text-align: left; font-size: 9px; color: #b91c1c;">${r.item.DeadReason || 'Obsolete / Zero Demand'}</td>
          <td style="text-align: right; font-weight: bold; color: #991b1b;">${r.stock}</td>
          <td style="text-align: right; font-family: monospace;">Rs. ${r.item.PurchasePrice}</td>
          <td style="text-align: right; font-weight: 900; color: #b91c1c; font-family: monospace;">Rs. ${r.costValuation.toLocaleString()}</td>
        </tr>
      `).join('');
    } else if (reportType === 'MIN_THRESHOLD') {
      tableHeaderHtml = `
        <tr>
          <th style="width: 5%;">S#</th>
          <th style="width: 10%;">Item ID</th>
          <th style="width: 28%; text-align: left;">Medicine Name</th>
          <th style="width: 11%;">Category</th>
          <th style="width: 11%; text-align: right;">Current Stock</th>
          <th style="width: 11%; text-align: right;">Min Threshold</th>
          <th style="width: 12%; text-align: right;">Shortage Deficit</th>
          <th style="width: 12%;">Status Alert</th>
        </tr>
      `;
      tableRowsHtml = reportData.map((r, idx) => `
        <tr style="background: ${r.stock <= 0 ? '#fef2f2' : '#fffbeb'};">
          <td style="text-align: center;">${idx + 1}</td>
          <td style="text-align: center; font-family: monospace; font-weight: bold;">${r.item.ItemID}</td>
          <td style="text-align: left; font-weight: bold;">${r.item.ItemName}</td>
          <td style="text-align: center;">${r.item.Unit || 'Tab'}</td>
          <td style="text-align: right; font-weight: 900; color: ${r.stock <= 0 ? '#dc2626' : '#d97706'}; font-size: 11px;">${r.stock}</td>
          <td style="text-align: right; font-weight: bold;">${r.minStock}</td>
          <td style="text-align: right; font-weight: 900; color: #b91c1c;">-${r.deficitQty}</td>
          <td style="text-align: center; font-weight: bold; font-size: 8.5px; color: ${r.stock <= 0 ? '#b91c1c' : '#b45309'};">
            ${r.stock <= 0 ? 'CRITICAL OUT OF STOCK' : 'LOW STOCK DEFICIT'}
          </td>
        </tr>
      `).join('');
    } else if (reportType === 'REORDER_QTY') {
      tableHeaderHtml = `
        <tr>
          <th style="width: 5%;">S#</th>
          <th style="width: 10%;">Item ID</th>
          <th style="width: 26%; text-align: left;">Medicine Name</th>
          <th style="width: 11%;">Category</th>
          <th style="width: 10%; text-align: right;">Current Stock</th>
          <th style="width: 10%; text-align: right;">Min Thresh</th>
          <th style="width: 13%; text-align: right;">Req. Reorder Qty</th>
          <th style="width: 15%; text-align: right;">Est. Order Cost (Rs)</th>
        </tr>
      `;
      tableRowsHtml = reportData.map((r, idx) => {
        const orderQty = r.reorderQty || Math.max(1, r.minStock * 2);
        const estCost = orderQty * (r.item.PurchasePrice || 0);
        return `
          <tr>
            <td style="text-align: center;">${idx + 1}</td>
            <td style="text-align: center; font-family: monospace; font-weight: bold;">${r.item.ItemID}</td>
            <td style="text-align: left; font-weight: bold;">${r.item.ItemName}</td>
            <td style="text-align: center;">${r.item.Unit || 'Tab'}</td>
            <td style="text-align: right; font-weight: bold; color: ${r.stock <= r.minStock ? '#dc2626' : '#334155'};">${r.stock}</td>
            <td style="text-align: right;">${r.minStock}</td>
            <td style="text-align: right; font-weight: 900; color: #4338ca; font-size: 11px;">${orderQty}</td>
            <td style="text-align: right; font-weight: bold; color: #047857; font-family: monospace;">Rs. ${estCost.toLocaleString()}</td>
          </tr>
        `;
      }).join('');
    } else {
      // General inventory / valuation / expiry
      tableHeaderHtml = `
        <tr>
          <th style="width: 4%;">S#</th>
          <th style="width: 10%;">Item ID</th>
          <th style="width: 26%; text-align: left;">Medicine Name</th>
          <th style="width: 10%;">Category</th>
          <th style="width: 7%; text-align: center;">Type</th>
          <th style="width: 8%; text-align: right;">Stock</th>
          <th style="width: 10%; text-align: right;">Unit Cost</th>
          <th style="width: 10%; text-align: right;">Retail (Rs)</th>
          <th style="width: 15%; text-align: right;">Cost Valuation (Rs)</th>
        </tr>
      `;
      tableRowsHtml = reportData.map((r, idx) => `
        <tr>
          <td style="text-align: center;">${idx + 1}</td>
          <td style="text-align: center; font-family: monospace; font-weight: bold;">${r.item.ItemID}</td>
          <td style="text-align: left; font-weight: bold;">${r.item.ItemName}</td>
          <td style="text-align: center;">${r.item.Unit || 'Tab'}</td>
          <td style="text-align: center; font-weight: bold;">${r.item.MedicineType === 'C' ? 'Clinical' : 'Patent'}</td>
          <td style="text-align: right; font-weight: 900;">${r.stock}</td>
          <td style="text-align: right; font-family: monospace;">Rs. ${r.item.PurchasePrice}</td>
          <td style="text-align: right; font-family: monospace;">Rs. ${r.item.Price}</td>
          <td style="text-align: right; font-weight: 900; color: #047857; font-family: monospace;">Rs. ${r.costValuation.toLocaleString()}</td>
        </tr>
      `).join('');
    }

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>${reportMeta.title} - ${clinicName}</title>
          <style>
            @page {
              size: A4 portrait;
              margin: 10mm 8mm 12mm 8mm;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
              color: #0f172a;
              background: #ffffff;
              margin: 0;
              padding: 0;
              font-size: 10px;
            }
            .no-print-bar {
              background: #0f172a;
              color: #ffffff;
              padding: 8px 16px;
              display: flex;
              justify-content: space-between;
              align-items: center;
              position: sticky;
              top: 0;
              z-index: 999;
            }
            @media print {
              .no-print-bar { display: none !important; }
            }
            .header-box {
              display: flex;
              justify-content: space-between;
              align-items: center;
              border-bottom: 2px solid #0f172a;
              padding-bottom: 8px;
              margin-bottom: 8px;
            }
            .brand-left {
              display: flex;
              align-items: center;
              gap: 10px;
            }
            .logo-img {
              height: 48px;
              width: 48px;
              object-fit: contain;
            }
            .clinic-name {
              font-size: 16px;
              font-weight: 900;
              color: #0f172a;
              text-transform: uppercase;
              letter-spacing: -0.2px;
            }
            .clinic-meta {
              font-size: 9px;
              color: #475569;
              font-weight: 600;
              margin-top: 2px;
            }
            .report-title-badge {
              background: #0f172a;
              color: #ffffff;
              padding: 5px 12px;
              border-radius: 4px;
              font-weight: 900;
              font-size: 11px;
              text-transform: uppercase;
              text-align: right;
              letter-spacing: 0.3px;
            }
            .criteria-bar {
              background: #f8fafc;
              border: 1px solid #cbd5e1;
              padding: 6px 10px;
              border-radius: 4px;
              display: flex;
              justify-content: space-between;
              font-size: 9px;
              font-weight: bold;
              margin-bottom: 8px;
            }
            .kpi-row {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 6px;
              margin-bottom: 8px;
            }
            .kpi-item {
              border: 1px solid #e2e8f0;
              background: #f8fafc;
              padding: 6px 8px;
              border-radius: 4px;
              text-align: center;
            }
            .kpi-label {
              font-size: 8px;
              font-weight: 800;
              color: #64748b;
              text-transform: uppercase;
            }
            .kpi-val {
              font-size: 13px;
              font-weight: 900;
              color: #0f172a;
              margin-top: 2px;
              font-family: monospace;
            }
            table.rep-table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 4px;
              font-size: 9px;
            }
            table.rep-table th, table.rep-table td {
              border: 1px solid #cbd5e1;
              padding: 4px 6px;
            }
            table.rep-table th {
              background: #0f172a;
              color: #ffffff;
              font-weight: 900;
              font-size: 8.5px;
              text-transform: uppercase;
            }
            table.rep-table tr:nth-child(even) {
              background: #f8fafc;
            }
            .footer-sig {
              margin-top: 25px;
              display: flex;
              justify-content: space-between;
              page-break-inside: avoid;
            }
            .sig-line {
              border-top: 1px dashed #64748b;
              width: 180px;
              text-align: center;
              font-size: 8.5px;
              font-weight: bold;
              padding-top: 4px;
              color: #334155;
            }
          </style>
        </head>
        <body>
          <div class="no-print-bar">
            <span><strong>Pharmacy Custom Reports Hub:</strong> ${reportMeta.title}</span>
            <div>
              <button onclick="window.print()" style="background:#4338ca;color:#fff;border:none;padding:6px 14px;border-radius:4px;font-weight:bold;cursor:pointer;margin-right:8px;">Print Report</button>
              <button onclick="window.close()" style="background:#64748b;color:#fff;border:none;padding:6px 14px;border-radius:4px;font-weight:bold;cursor:pointer;">Close</button>
            </div>
          </div>

          <div class="header-box">
            <div class="brand-left">
              ${logoSrc ? `<img src="${logoSrc}" class="logo-img" alt="Logo" onerror="this.style.display='none'" />` : ''}
              <div>
                <div class="clinic-name">${clinicName}</div>
                <div class="clinic-meta">📍 ${clinicAddress} &nbsp;|&nbsp; 📞 ${clinicPhone}</div>
                <div style="font-size: 8px; color: #94a3b8; font-weight: bold; text-transform: uppercase;">${clinicTagline}</div>
              </div>
            </div>
            <div>
              <div class="report-title-badge">${reportMeta.title}</div>
              <div style="font-size: 8.5px; color: #64748b; text-align: right; margin-top: 3px; font-weight: bold;">
                Printed: ${printDate} | Doc Ref: REP-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}
              </div>
            </div>
          </div>

          <div class="criteria-bar">
            <span><strong>Report Type:</strong> ${reportMeta.shortTitle}</span>
            <span><strong>Category:</strong> ${categoryFilter === 'ALL' ? 'All Categories' : categoryFilter}</span>
            <span><strong>Stock Scope:</strong> ${stockScopeFilter}</span>
            ${reportType === 'MAX_SALE' || reportType === 'SLOW_MOVING' ? `<span><strong>Period:</strong> ${salesPeriod.replace(/_/g, ' ')}</span>` : ''}
            <span><strong>Total Listed:</strong> ${reportData.length} Medicines</span>
          </div>

          <div class="kpi-row">
            <div class="kpi-item">
              <div class="kpi-label">Filtered Medicines</div>
              <div class="kpi-val">${kpiSummary.totalCount}</div>
            </div>
            ${
              reportType === 'MAX_SALE'
                ? `
                  <div class="kpi-item">
                    <div class="kpi-label">Total Units Sold</div>
                    <div class="kpi-val" style="color: #7e22ce;">${kpiSummary.totalUnitsSold.toLocaleString()}</div>
                  </div>
                  <div class="kpi-item">
                    <div class="kpi-label">Total Sales Revenue</div>
                    <div class="kpi-val" style="color: #047857;">Rs. ${kpiSummary.totalSalesRevenue.toLocaleString()}</div>
                  </div>
                  <div class="kpi-item">
                    <div class="kpi-label">Remaining In-Stock</div>
                    <div class="kpi-val">${kpiSummary.totalUnits.toLocaleString()}</div>
                  </div>
                `
                : reportType === 'DEAD_STOCK'
                ? `
                  <div class="kpi-item">
                    <div class="kpi-label">Dead Units Scrapped</div>
                    <div class="kpi-val" style="color: #b91c1c;">${kpiSummary.totalUnits.toLocaleString()}</div>
                  </div>
                  <div class="kpi-item">
                    <div class="kpi-label">Write-Off Capital Loss</div>
                    <div class="kpi-val" style="color: #b91c1c;">Rs. ${kpiSummary.totalCostValuation.toLocaleString()}</div>
                  </div>
                  <div class="kpi-item">
                    <div class="kpi-label">Retail Value Written Off</div>
                    <div class="kpi-val" style="color: #64748b;">Rs. ${kpiSummary.totalRetailValuation.toLocaleString()}</div>
                  </div>
                `
                : reportType === 'MIN_THRESHOLD'
                ? `
                  <div class="kpi-item">
                    <div class="kpi-label">Shortage Deficit Units</div>
                    <div class="kpi-val" style="color: #b91c1c;">${kpiSummary.totalDeficitUnits.toLocaleString()}</div>
                  </div>
                  <div class="kpi-item">
                    <div class="kpi-label">Total Stock Left</div>
                    <div class="kpi-val" style="color: #d97706;">${kpiSummary.totalUnits.toLocaleString()}</div>
                  </div>
                  <div class="kpi-item">
                    <div class="kpi-label">Suggested Reorder Units</div>
                    <div class="kpi-val" style="color: #4338ca;">${kpiSummary.totalReorderUnits.toLocaleString()}</div>
                  </div>
                `
                : reportType === 'REORDER_QTY'
                ? `
                  <div class="kpi-item">
                    <div class="kpi-label">Total Units to Order</div>
                    <div class="kpi-val" style="color: #4338ca;">${kpiSummary.totalReorderUnits.toLocaleString()}</div>
                  </div>
                  <div class="kpi-item">
                    <div class="kpi-label">Current Stock in Hand</div>
                    <div class="kpi-val">${kpiSummary.totalUnits.toLocaleString()}</div>
                  </div>
                  <div class="kpi-item">
                    <div class="kpi-label">Est. Inventory Cost</div>
                    <div class="kpi-val" style="color: #047857;">Rs. ${kpiSummary.totalCostValuation.toLocaleString()}</div>
                  </div>
                `
                : `
                  <div class="kpi-item">
                    <div class="kpi-label">Total Stock Units</div>
                    <div class="kpi-val">${kpiSummary.totalUnits.toLocaleString()}</div>
                  </div>
                  <div class="kpi-item">
                    <div class="kpi-label">Total Cost Valuation</div>
                    <div class="kpi-val" style="color: #b45309;">Rs. ${kpiSummary.totalCostValuation.toLocaleString()}</div>
                  </div>
                  <div class="kpi-item">
                    <div class="kpi-label">Total Retail Valuation</div>
                    <div class="kpi-val" style="color: #047857;">Rs. ${kpiSummary.totalRetailValuation.toLocaleString()}</div>
                  </div>
                `
            }
          </div>

          <table class="rep-table">
            <thead>
              ${tableHeaderHtml}
            </thead>
            <tbody>
              ${tableRowsHtml}
            </tbody>
          </table>

          <div class="footer-sig">
            <div class="sig-line">Prepared By (Pharmacist / Operator)</div>
            <div class="sig-line">Audited By (Internal Audit)</div>
            <div class="sig-line">Approved By (Clinic Administrator)</div>
          </div>

          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 300);
            };
          </script>
        </body>
      </html>
    `;

    printWin.document.open();
    printWin.document.write(html);
    printWin.document.close();
  };

  const isPageMode = mode === 'page';
  if (!isOpen && !isPageMode) return null;

  const contentJsx = (
    <div className={`bg-white rounded-2xl border border-slate-200 w-full flex flex-col overflow-hidden animate-fadeIn ${
      isPageMode ? 'shadow-sm min-h-[85vh]' : 'shadow-2xl max-w-6xl max-h-[92vh]'
    }`}>
      {/* Modal Header (Only shown in modal popup mode, hidden in page mode) */}
      {!isPageMode && (
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-4 sm:p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-indigo-500/20 text-indigo-300 rounded-xl border border-indigo-400/30">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base sm:text-lg font-black text-white tracking-tight">
                  Inventory & Sales Reports Generator
                </h2>
                <span className="px-2 py-0.5 bg-indigo-500 text-white text-[10px] font-black uppercase tracking-wider rounded-full">
                  Custom Parameters
                </span>
              </div>
              <p className="text-xs text-indigo-200/80 mt-0.5">
                Generate parameter-based reports: Maximum Sales, Dead Stock, Current Stock, Reorder Qty & Shortages
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

        {/* Report Types Tabs / Selector - Ultra-Compact */}
        <div className="bg-slate-100 px-2 py-1 border-b border-slate-200 overflow-x-auto shrink-0 flex items-center gap-1 scrollbar-thin">
          {[
            {
              id: 'MAX_SALE',
              label: 'Maximum Sales',
              badge: 'Top Selling',
              icon: <TrendingUp className="w-3 h-3 mr-1 text-purple-600" />
            },
            {
              id: 'CURRENT_STOCK',
              label: 'Current Stock',
              badge: 'Active Only',
              icon: <Package className="w-3 h-3 mr-1 text-emerald-600" />
            },
            {
              id: 'DEAD_STOCK',
              label: 'Dead Stock',
              badge: 'Obsolete',
              icon: <AlertOctagon className="w-3 h-3 mr-1 text-rose-600" />
            },
            {
              id: 'MIN_THRESHOLD',
              label: 'Min Threshold',
              badge: 'Alerts',
              icon: <AlertTriangle className="w-3 h-3 mr-1 text-amber-600" />
            },
            {
              id: 'REORDER_QTY',
              label: 'PO Reorder Qty',
              badge: 'Procurement',
              icon: <ShoppingCart className="w-3 h-3 mr-1 text-indigo-600" />
            },
            {
              id: 'SLOW_MOVING',
              label: 'Slow Moving',
              badge: 'Zero Sales',
              icon: <Clock className="w-3 h-3 mr-1 text-slate-600" />
            },
            {
              id: 'HIGH_VALUATION',
              label: 'High Valuation',
              badge: 'Capital Assets',
              icon: <DollarSign className="w-3 h-3 mr-1 text-cyan-600" />
            },
            {
              id: 'EXPIRY_ALERT',
              label: 'Expiry Alerts',
              badge: '<90 Days',
              icon: <Calendar className="w-3 h-3 mr-1 text-rose-600" />
            }
          ].map((tab) => {
            const isSelected = reportType === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setReportType(tab.id as CustomReportType);
                  setSortBy('DEFAULT');
                }}
                className={`px-2 py-1 rounded-lg font-bold text-[11px] flex items-center transition shrink-0 cursor-pointer shadow-2xs border ${
                  isSelected
                    ? 'bg-white text-slate-900 border-indigo-400 ring-1 ring-indigo-400/30 shadow-xs'
                    : 'bg-slate-200/70 hover:bg-white text-slate-700 border-slate-300/80'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
                <span
                  className={`ml-1 px-1 py-0 rounded text-[8.5px] font-mono ${
                    isSelected ? 'bg-indigo-100 text-indigo-800' : 'bg-slate-300 text-slate-700'
                  }`}
                >
                  {tab.badge}
                </span>
              </button>
            );
          })}
        </div>

        {/* Parameters & Filters Bar - Compact */}
        <div className="p-2 sm:p-2.5 bg-slate-50 border-b border-slate-200 shrink-0 space-y-1.5">
          <div className="flex flex-wrap items-center justify-between gap-1.5">
            <div className="flex items-center space-x-1.5">
              <span className="p-0.5 rounded bg-indigo-100 text-indigo-700">
                <SlidersHorizontal className="w-3 h-3" />
              </span>
              <span className="text-[11px] font-black text-slate-800 uppercase tracking-wider">
                Report Parameters & Criteria
              </span>
            </div>
            <span className="text-[10px] text-slate-500 font-medium">
              {reportMeta.description}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-1.5">
            {/* Category Filter */}
            <div>
              <label className="block text-[9.5px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">
                Category / Unit
              </label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded py-1 px-1.5 text-[11px] font-bold text-slate-800 focus:ring-1 focus:ring-indigo-500"
              >
                {categoryOptions.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Stock Level Scope */}
            <div>
              <label className="block text-[9.5px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">
                Stock Scope
              </label>
              <select
                value={stockScopeFilter}
                onChange={(e) => setStockScopeFilter(e.target.value as any)}
                className="w-full bg-white border border-slate-300 rounded py-1 px-1.5 text-[11px] font-bold text-slate-800 focus:ring-1 focus:ring-indigo-500"
              >
                <option value="ALL">All Stock Levels</option>
                <option value="IN_STOCK">In Stock (&gt; 0 Qty)</option>
                <option value="LOW_STOCK">Low Stock (&le; Min)</option>
                <option value="ZERO_STOCK">Out of Stock (0 Qty)</option>
              </select>
            </div>

            {/* Sales Date Range (Enabled for Sales reports) */}
            <div>
              <label className="block text-[9.5px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">
                Sales Period
              </label>
              <select
                value={salesPeriod}
                onChange={(e) => setSalesPeriod(e.target.value as any)}
                className="w-full bg-white border border-slate-300 rounded py-1 px-1.5 text-[11px] font-bold text-slate-800 focus:ring-1 focus:ring-indigo-500"
              >
                <option value="ALL_TIME">All Time Sales</option>
                <option value="TODAY">Today Only</option>
                <option value="LAST_7_DAYS">Last 7 Days</option>
                <option value="LAST_30_DAYS">Last 30 Days</option>
                <option value="LAST_90_DAYS">Last 90 Days</option>
              </select>
            </div>

            {/* Limit Rows */}
            <div>
              <label className="block text-[9.5px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">
                Show Limit
              </label>
              <select
                value={recordLimit}
                onChange={(e) => setRecordLimit(Number(e.target.value))}
                className="w-full bg-white border border-slate-300 rounded py-1 px-1.5 text-[11px] font-bold text-slate-800 focus:ring-1 focus:ring-indigo-500"
              >
                <option value={10}>Top 10 items</option>
                <option value={25}>Top 25 items</option>
                <option value={50}>Top 50 items (Standard)</option>
                <option value={100}>Top 100 items</option>
                <option value={-1}>All Matching items</option>
              </select>
            </div>

            {/* Quick Search */}
            <div>
              <label className="block text-[9.5px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">
                Quick Filter Search
              </label>
              <div className="relative">
                <Search className="w-3 h-3 absolute left-2 top-1.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Medicine name, ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded py-1 pl-7 pr-2 text-[11px] text-slate-800 focus:ring-1 focus:ring-indigo-500 font-medium"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Live KPI Summary Cards - Compact */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1.5 sm:p-2 bg-white border-b border-slate-200 shrink-0">
          <div className="bg-slate-50 border border-slate-200 p-1.5 rounded-lg">
            <span className="text-[9px] font-extrabold uppercase text-slate-400 tracking-wider block">
              Matching Medicines
            </span>
            <div className="text-xs sm:text-sm font-black text-slate-900 mt-0.5">
              {kpiSummary.totalCount} Medicines
            </div>
          </div>

          {reportType === 'MAX_SALE' ? (
            <>
              <div className="bg-purple-50 border border-purple-200 p-1.5 rounded-lg">
                <span className="text-[9px] font-extrabold uppercase text-purple-700 tracking-wider block">
                  Total Units Sold
                </span>
                <div className="text-xs sm:text-sm font-black text-purple-900 mt-0.5">
                  {kpiSummary.totalUnitsSold.toLocaleString()} Units
                </div>
              </div>
              <div className="bg-emerald-50 border border-emerald-200 p-1.5 rounded-lg">
                <span className="text-[9px] font-extrabold uppercase text-emerald-700 tracking-wider block">
                  Total Sales Revenue
                </span>
                <div className="text-xs sm:text-sm font-black text-emerald-900 mt-0.5 font-mono">
                  Rs. {kpiSummary.totalSalesRevenue.toLocaleString()}
                </div>
              </div>
              <div className="bg-slate-50 border border-slate-200 p-1.5 rounded-lg">
                <span className="text-[9px] font-extrabold uppercase text-slate-500 tracking-wider block">
                  Current Stock in Hand
                </span>
                <div className="text-xs sm:text-sm font-black text-slate-800 mt-0.5">
                  {kpiSummary.totalUnits.toLocaleString()} Units
                </div>
              </div>
            </>
          ) : reportType === 'DEAD_STOCK' ? (
            <>
              <div className="bg-rose-50 border border-rose-200 p-1.5 rounded-lg">
                <span className="text-[9px] font-extrabold uppercase text-rose-700 tracking-wider block">
                  Scrapped Units
                </span>
                <div className="text-xs sm:text-sm font-black text-rose-900 mt-0.5">
                  {kpiSummary.totalUnits.toLocaleString()} Units
                </div>
              </div>
              <div className="bg-rose-50 border border-rose-200 p-1.5 rounded-lg">
                <span className="text-[9px] font-extrabold uppercase text-rose-700 tracking-wider block">
                  Capital Write-Off Loss
                </span>
                <div className="text-xs sm:text-sm font-black text-rose-900 mt-0.5 font-mono">
                  Rs. {kpiSummary.totalCostValuation.toLocaleString()}
                </div>
              </div>
              <div className="bg-slate-50 border border-slate-200 p-1.5 rounded-lg">
                <span className="text-[9px] font-extrabold uppercase text-slate-500 tracking-wider block">
                  Retail Value Written Off
                </span>
                <div className="text-xs sm:text-sm font-black text-slate-800 mt-0.5 font-mono">
                  Rs. {kpiSummary.totalRetailValuation.toLocaleString()}
                </div>
              </div>
            </>
          ) : reportType === 'MIN_THRESHOLD' ? (
            <>
              <div className="bg-rose-50 border border-rose-200 p-1.5 rounded-lg">
                <span className="text-[9px] font-extrabold uppercase text-rose-700 tracking-wider block">
                  Shortage Deficit Units
                </span>
                <div className="text-xs sm:text-sm font-black text-rose-900 mt-0.5">
                  {kpiSummary.totalDeficitUnits.toLocaleString()} Units
                </div>
              </div>
              <div className="bg-amber-50 border border-amber-200 p-1.5 rounded-lg">
                <span className="text-[9px] font-extrabold uppercase text-amber-700 tracking-wider block">
                  Stock Left in Hand
                </span>
                <div className="text-xs sm:text-sm font-black text-amber-900 mt-0.5">
                  {kpiSummary.totalUnits.toLocaleString()} Units
                </div>
              </div>
              <div className="bg-indigo-50 border border-indigo-200 p-1.5 rounded-lg">
                <span className="text-[9px] font-extrabold uppercase text-indigo-700 tracking-wider block">
                  Suggested Reorders
                </span>
                <div className="text-xs sm:text-sm font-black text-indigo-900 mt-0.5 font-mono">
                  {kpiSummary.totalReorderUnits.toLocaleString()} Units
                </div>
              </div>
            </>
          ) : reportType === 'REORDER_QTY' ? (
            <>
              <div className="bg-indigo-50 border border-indigo-200 p-1.5 rounded-lg">
                <span className="text-[9px] font-extrabold uppercase text-indigo-700 tracking-wider block">
                  Total Reorder Units
                </span>
                <div className="text-xs sm:text-sm font-black text-indigo-900 mt-0.5">
                  {kpiSummary.totalReorderUnits.toLocaleString()} Units
                </div>
              </div>
              <div className="bg-slate-50 border border-slate-200 p-1.5 rounded-lg">
                <span className="text-[9px] font-extrabold uppercase text-slate-500 tracking-wider block">
                  Current Stock in Hand
                </span>
                <div className="text-xs sm:text-sm font-black text-slate-800 mt-0.5">
                  {kpiSummary.totalUnits.toLocaleString()} Units
                </div>
              </div>
              <div className="bg-emerald-50 border border-emerald-200 p-1.5 rounded-lg">
                <span className="text-[9px] font-extrabold uppercase text-emerald-700 tracking-wider block">
                  Est. Inventory Cost
                </span>
                <div className="text-xs sm:text-sm font-black text-emerald-900 mt-0.5 font-mono">
                  Rs. {kpiSummary.totalCostValuation.toLocaleString()}
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="bg-slate-50 border border-slate-200 p-1.5 rounded-lg">
                <span className="text-[9px] font-extrabold uppercase text-slate-500 tracking-wider block">
                  Total Stock Units
                </span>
                <div className="text-xs sm:text-sm font-black text-slate-800 mt-0.5">
                  {kpiSummary.totalUnits.toLocaleString()} Units
                </div>
              </div>
              <div className="bg-amber-50 border border-amber-200 p-1.5 rounded-lg">
                <span className="text-[9px] font-extrabold uppercase text-amber-700 tracking-wider block">
                  Cost Valuation
                </span>
                <div className="text-xs sm:text-sm font-black text-amber-900 mt-0.5 font-mono">
                  Rs. {kpiSummary.totalCostValuation.toLocaleString()}
                </div>
              </div>
              <div className="bg-emerald-50 border border-emerald-200 p-1.5 rounded-lg">
                <span className="text-[9px] font-extrabold uppercase text-emerald-700 tracking-wider block">
                  Retail Valuation
                </span>
                <div className="text-xs sm:text-sm font-black text-emerald-900 mt-0.5 font-mono">
                  Rs. {kpiSummary.totalRetailValuation.toLocaleString()}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Live Preview Table */}
        <div className="flex-1 overflow-y-auto p-2 sm:p-2.5 bg-slate-50/50">
          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-2xs">
            <div className="p-2 bg-slate-100 border-b border-slate-200 flex items-center justify-between">
              <span className="text-[11px] font-black text-slate-800">
                Live Data Preview ({previewList.length} of {reportData.length} records shown)
              </span>
              <div className="flex items-center space-x-2 text-[10px] text-slate-500">
                <span>Click column to sort</span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-[11px] border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-white text-[9px] uppercase font-black tracking-wider">
                    <th className="p-1.5 text-center w-10">#</th>
                    <th className="p-1.5 w-20">Item ID</th>
                    <th className="p-1.5">Medicine Name</th>
                    <th className="p-1.5 text-center">Category</th>
                    {reportType === 'MAX_SALE' ? (
                      <>
                        <th className="p-1.5 text-right text-purple-300">Units Sold</th>
                        <th className="p-1.5 text-right text-emerald-300">Revenue (Rs)</th>
                        <th className="p-1.5 text-right">In Stock</th>
                        <th className="p-1.5 text-right">Retail (Rs)</th>
                      </>
                    ) : reportType === 'DEAD_STOCK' ? (
                      <>
                        <th className="p-1.5 text-rose-300">Dead Reason</th>
                        <th className="p-1.5 text-right text-rose-300">Scrapped Units</th>
                        <th className="p-1.5 text-right">Unit Cost</th>
                        <th className="p-1.5 text-right text-rose-300">Loss (Rs)</th>
                      </>
                    ) : reportType === 'MIN_THRESHOLD' ? (
                      <>
                        <th className="p-1.5 text-right text-amber-300">In Stock</th>
                        <th className="p-1.5 text-right">Min Thresh</th>
                        <th className="p-1.5 text-right text-rose-300">Deficit</th>
                        <th className="p-1.5 text-center">Alert Status</th>
                      </>
                    ) : reportType === 'REORDER_QTY' ? (
                      <>
                        <th className="p-1.5 text-right">In Stock</th>
                        <th className="p-1.5 text-right">Min Thresh</th>
                        <th className="p-2.5 text-right text-indigo-300">PO Reorder Qty</th>
                        <th className="p-2.5 text-right text-emerald-300">Est. Order Cost</th>
                      </>
                    ) : (
                      <>
                        <th className="p-2.5 text-right">Current Stock</th>
                        <th className="p-2.5 text-right">Unit Cost</th>
                        <th className="p-2.5 text-right">Retail Price</th>
                        <th className="p-2.5 text-right text-emerald-300">Cost Value</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {previewList.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-400 font-bold">
                        No medicines match the selected report parameters.
                      </td>
                    </tr>
                  ) : (
                    previewList.map((r, idx) => (
                      <tr
                        key={r.item.ItemID}
                        className={`hover:bg-indigo-50/40 transition ${
                          idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'
                        }`}
                      >
                        <td className="p-2 text-center font-bold text-slate-500">
                          {reportType === 'MAX_SALE' && idx === 0
                            ? '🥇 1'
                            : reportType === 'MAX_SALE' && idx === 1
                            ? '🥈 2'
                            : reportType === 'MAX_SALE' && idx === 2
                            ? '🥉 3'
                            : idx + 1}
                        </td>
                        <td className="p-2 font-mono font-bold text-slate-700">{r.item.ItemID}</td>
                        <td className="p-2 font-bold text-slate-900">
                          {r.item.ItemName}
                          <span className="ml-1.5 text-[9px] px-1.5 py-0.2 rounded font-bold uppercase bg-slate-100 text-slate-600">
                            {r.item.MedicineType === 'C' ? 'Clinical' : 'Patent'}
                          </span>
                        </td>
                        <td className="p-2 text-center">
                          <span className="px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-semibold">
                            {r.item.Unit || 'Tab'}
                          </span>
                        </td>

                        {reportType === 'MAX_SALE' ? (
                          <>
                            <td className="p-2 text-right font-black text-purple-700 text-xs">
                              {r.unitsSold.toLocaleString()}
                            </td>
                            <td className="p-2 text-right font-bold text-emerald-700 font-mono">
                              Rs. {r.salesRevenue.toLocaleString()}
                            </td>
                            <td className="p-2 text-right font-bold text-slate-800">{r.stock}</td>
                            <td className="p-2 text-right font-mono text-slate-600">Rs. {r.item.Price}</td>
                          </>
                        ) : reportType === 'DEAD_STOCK' ? (
                          <>
                            <td className="p-2 text-rose-700 font-medium text-[11px]">
                              {r.item.DeadReason || 'Obsolete / Zero Demand'}
                            </td>
                            <td className="p-2 text-right font-black text-rose-700">{r.stock}</td>
                            <td className="p-2 text-right font-mono text-slate-600">
                              Rs. {r.item.PurchasePrice}
                            </td>
                            <td className="p-2 text-right font-bold text-rose-700 font-mono">
                              Rs. {r.costValuation.toLocaleString()}
                            </td>
                          </>
                        ) : reportType === 'MIN_THRESHOLD' ? (
                          <>
                            <td className="p-2 text-right font-black text-amber-700">{r.stock}</td>
                            <td className="p-2 text-right font-bold text-slate-700">{r.minStock}</td>
                            <td className="p-2 text-right font-black text-rose-700">-{r.deficitQty}</td>
                            <td className="p-2 text-center">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                                  r.stock <= 0
                                    ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                    : 'bg-amber-100 text-amber-800 border border-amber-300'
                                }`}
                              >
                                {r.stock <= 0 ? 'Out of Stock' : 'Low Stock'}
                              </span>
                            </td>
                          </>
                        ) : reportType === 'REORDER_QTY' ? (
                          <>
                            <td className="p-2 text-right font-bold text-slate-800">{r.stock}</td>
                            <td className="p-2 text-right font-bold text-slate-500">{r.minStock}</td>
                            <td className="p-2 text-right font-black text-indigo-700 text-xs">
                              {r.reorderQty || Math.max(1, r.minStock * 2)}
                            </td>
                            <td className="p-2 text-right font-bold text-emerald-700 font-mono">
                              Rs.{' '}
                              {(
                                (r.reorderQty || Math.max(1, r.minStock * 2)) *
                                (r.item.PurchasePrice || 0)
                              ).toLocaleString()}
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="p-2 text-right font-black text-slate-900">{r.stock}</td>
                            <td className="p-2 text-right font-mono text-slate-600">
                              Rs. {r.item.PurchasePrice}
                            </td>
                            <td className="p-2 text-right font-mono text-slate-800">Rs. {r.item.Price}</td>
                            <td className="p-2 text-right font-bold text-emerald-700 font-mono">
                              Rs. {r.costValuation.toLocaleString()}
                            </td>
                          </>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Modal Bottom Actions - Compact */}
        <div className="bg-white p-2 sm:p-2.5 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shrink-0">
          <div className="flex items-center space-x-1.5 text-[11px] text-slate-600">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>
              Active Report: <strong className="text-slate-900">{reportMeta.title}</strong>
            </span>
          </div>

          <div className="flex items-center space-x-1.5 self-end sm:self-auto">
            <button
              type="button"
              onClick={handleExportCsv}
              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 rounded-lg font-bold text-[11px] flex items-center transition cursor-pointer shadow-2xs"
            >
              <Download className="w-3 h-3 mr-1 text-slate-600" />
              <span>Export CSV</span>
            </button>

            <button
              type="button"
              onClick={handlePrintA4Report}
              className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold text-[11px] flex items-center transition cursor-pointer shadow-2xs ring-1 ring-indigo-500/30"
            >
              <Printer className="w-3 h-3 mr-1" />
              <span>Print Report (A4)</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-2.5 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-bold text-[11px] transition cursor-pointer"
            >
              {isPageMode ? '← Back to Stock Grid' : 'Close'}
            </button>
          </div>
        </div>
      </div>
  );

  if (isPageMode) {
    return (
      <div className="w-full font-sans pb-6">
        {contentJsx}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[9999] flex flex-col items-center justify-center p-2 sm:p-4 overflow-y-auto font-sans">
      {contentJsx}
    </div>
  );
};

export default PharmacyCustomReportsModal;
