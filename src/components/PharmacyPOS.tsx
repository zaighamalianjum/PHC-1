/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { TopProgressBar, GlobalLoadingOverlay } from './LoadingIndicator';
import {
  ShoppingCart,
  Plus,
  PlusCircle,
  Trash2,
  Lock,
  Search,
  CheckCircle,
  FileText,
  AlertCircle,
  AlertTriangle,
  Undo2,
  Truck,
  Check,
  Printer,
  History,
  Database,
  Edit,
  Tag,
  Stethoscope,
  Pill,
  X,
  Filter,
  Layers,
  ShieldAlert,
  TrendingUp,
  BarChart3,
  CheckSquare,
  Square,
  PackageCheck,
  Sparkles,
  Calendar,
  ArrowUpDown,
  RefreshCw,
  QrCode,
  CheckCircle2,
  Zap,
  Barcode,
  Download,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronsLeft,
  ChevronsRight,
  Receipt,
  Boxes,
  Clock,
  CheckCheck,
  Layers3,
  Smartphone,
  FlaskConical,
  AlertOctagon,
  Ban,
  Archive,
  Package,
  SlidersHorizontal,
  Maximize2,
  Minimize2
} from 'lucide-react';
import ItemQRScannerModal from './ItemQRScannerModal';
import ItemQRGeneratorModal from './ItemQRGeneratorModal';
import PwaInstallModal from './PwaInstallModal';
import { parseScannedItemQR, playBeepSound, ParsedQRResult } from '../utils/qrUtils';
import {
  Patient,
  Item,
  ItemBatch,
  Supplier,
  InvoiceHeader,
  InvoiceDetail,
  SRInvHeader,
  SRInvDetail,
  InvVchHeader,
  InvVchDetail,
  UserRight,
  User,
  Visit,
  VisitMedicine,
  Appointment,
  Token
} from '../types';
import {
  isBatchExpired,
  isBatchNearExpiry,
  getItemExpirySummary,
  MEDICINE_CATEGORIES,
  numToWords,
  toMonthYearInput,
  formatMonthYearDisplay
} from '../utils/pharmacyUtils';
import {
  createPharmacyPrintHelpers
} from '../utils/pharmacyPrintHelpers';
import PharmacyBatchesModal from './pharmacy/PharmacyBatchesModal';
import PharmacyCategoryModal from './pharmacy/PharmacyCategoryModal';
import PharmacyPoPrintPreviewModal from './pharmacy/PharmacyPoPrintPreviewModal';
import PharmacyAddMedicineModal from './pharmacy/PharmacyAddMedicineModal';
import PharmacyPatentSourcingModal from './pharmacy/PharmacyPatentSourcingModal';
import PharmacyVendorModal from './pharmacy/PharmacyVendorModal';
import PharmacyPrintInvoiceModal from './pharmacy/PharmacyPrintInvoiceModal';
import PharmacyLabelPrintModal from './pharmacy/PharmacyLabelPrintModal';
import PharmacyInvoiceLogsTab from './pharmacy/PharmacyInvoiceLogsTab';
import PharmacyReturnsTab from './pharmacy/PharmacyReturnsTab';
import PharmacyClinicalLabelsTab from './pharmacy/PharmacyClinicalLabelsTab';
import PharmacyBulkExpiryModal from './pharmacy/PharmacyBulkExpiryModal';
import PharmacyDeadItemsModal from './pharmacy/PharmacyDeadItemsModal';
import PharmacyCustomReportsModal from './pharmacy/PharmacyCustomReportsModal';
import { ClinicalMedicinePrescriptionTab } from './pharmacy/ClinicalMedicinePrescriptionTab';

export { isBatchExpired, isBatchNearExpiry, getItemExpirySummary };

interface PharmacyPOSProps {
  patients: Patient[];
  items: Item[];
  onUpdateItemStock: (itemId: string, newStock: number) => void;
  setItems?: React.Dispatch<React.SetStateAction<Item[]>>;
  suppliers: Supplier[];
  setSuppliers?: React.Dispatch<React.SetStateAction<Supplier[]>>;
  invoices: InvoiceHeader[];
  invoiceDetails: InvoiceDetail[];
  onAddInvoice: (inv: InvoiceHeader, details: InvoiceDetail[]) => void;
  onAddSalesReturn: (srHeader: SRInvHeader, srDetails: SRInvDetail[]) => void;
  grns: InvVchHeader[];
  grnDetails: InvVchDetail[];
  onAddGRN: (vchHeader: InvVchHeader, vchDetails: InvVchDetail[]) => void;
  onUpdateGRN?: (vchHeader: InvVchHeader, vchDetails: InvVchDetail[]) => void;
  onVoidGRN?: (vchNo: string) => void;
  userRights: UserRight[];
  visits: Visit[];
  visitMedicines: VisitMedicine[];
  appointments?: Appointment[];
  tokens?: Token[];
  clinicSettings?: any;
  currentUser?: User;
  onUnauthorized?: (msg?: string) => void;
}

export default function PharmacyPOS({
  patients,
  items,
  onUpdateItemStock,
  setItems,
  suppliers,
  setSuppliers,
  invoices,
  invoiceDetails,
  onAddInvoice,
  onAddSalesReturn,
  grns,
  grnDetails,
  onAddGRN,
  onUpdateGRN,
  onVoidGRN,
  userRights,
  visits,
  visitMedicines,
  appointments = [],
  tokens = [],
  clinicSettings,
  currentUser,
  onUnauthorized
}: PharmacyPOSProps) {
  const triggerAuthAlert = (featureName?: string) => {
    const msg = featureName ? `You are not authorized to access ${featureName}.` : 'You are not authorized to access.';
    if (onUnauthorized) {
      onUnauthorized(msg);
    }
  };
  // QR Code Modals & Scanner state
  const [isQRGeneratorOpen, setIsQRGeneratorOpen] = useState(false);
  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);

  // Quick Hardware Barcode/QR Scanner Auto-Focus Interceptor state
  const quickScannerInputRef = React.useRef<HTMLInputElement | null>(null);
  const [quickScannerInput, setQuickScannerInput] = useState('');
  const [autoAddOnScan, setAutoAddOnScan] = useState(true);
  const [scanToastMsg, setScanToastMsg] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [lastMappedScan, setLastMappedScan] = useState<{
    barcode: string;
    itemId: string;
    itemName: string;
    price: number;
    stock: number;
    time: string;
    matchedBy: string;
    status: string;
    batchNo?: string;
    mfgDate?: string;
    expDate?: string;
    mrp?: number;
  } | null>(null);

  // Auto-dismiss scan toast
  useEffect(() => {
    if (!scanToastMsg) return;
    const t = setTimeout(() => setScanToastMsg(null), 4000);
    return () => clearTimeout(t);
  }, [scanToastMsg]);

  // Keep focus on hardware scanner input and register F2 shortcut
  useEffect(() => {
    const timer = setTimeout(() => {
      quickScannerInputRef.current?.focus();
    }, 400);

    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        e.preventDefault();
        quickScannerInputRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, []);

  // PWA Install / Mobile App Modal
  const [isPwaModalOpen, setIsPwaModalOpen] = useState(false);

  // Navigation tabs
  const [activeSubTab, setActiveSubTab] = useState<'checkout' | 'store_sales' | 'return' | 'grn' | 'inventory_manager' | 'custom_reports' | 'invoice_logs' | 'clinical_labels' | 'barcode_mapper'>(() => {
    try {
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        const sub = params.get('sub');
        if (sub && ['checkout', 'store_sales', 'return', 'grn', 'inventory_manager', 'custom_reports', 'invoice_logs', 'clinical_labels', 'barcode_mapper'].includes(sub)) {
          return sub as any;
        }
        if (params.get('app') === 'store_medicine') {
          return 'store_sales';
        }
      }
    } catch (e) {}
    return 'checkout';
  });
  const [isSubTabLoading, setIsSubTabLoading] = useState(false);
  const [subTabLoadingMsg, setSubTabLoadingMsg] = useState('Loading Sub-module...');

  // Compact / Collapsed Toolbars state to give maximum space to Stock Grid
  const [isGridToolbarCollapsed, setIsGridToolbarCollapsed] = useState(false);
  const [showSpreadsheetFilters, setShowSpreadsheetFilters] = useState(true);

  const handleSubTabSwitch = (newSubTab: typeof activeSubTab, label: string) => {
    if (newSubTab === activeSubTab) return;
    setSubTabLoadingMsg(`Opening ${label}...`);
    setIsSubTabLoading(true);
    setActiveSubTab(newSubTab);
    setTimeout(() => {
      setIsSubTabLoading(false);
    }, 280);
  };

  // Auto-switch subtab if permissions change in another session
  useEffect(() => {
    if (activeSubTab === 'checkout' && currentUser.Permissions?.canAccessClinicalMedicine === false) {
      setActiveSubTab('store_sales');
    } else if (activeSubTab === 'store_sales' && currentUser.Permissions?.canAccessStoreMedicine === false) {
      setActiveSubTab('checkout');
    } else if (activeSubTab === 'return' && currentUser.Permissions?.canAccessSalesReturns === false) {
      setActiveSubTab('checkout');
    } else if (activeSubTab === 'inventory_manager' && currentUser.Permissions?.canAccessStockManager === false) {
      setActiveSubTab('checkout');
    } else if (activeSubTab === 'invoice_logs' && currentUser.Permissions?.canAccessInvoiceLogs === false) {
      setActiveSubTab('checkout');
    } else if (activeSubTab === 'clinical_labels' && currentUser.Permissions?.canAccessMedicineLabels === false) {
      setActiveSubTab('checkout');
    } else if (activeSubTab === 'grn' && (currentUser.Permissions?.canAccessErpPoGrn === false || currentUser.Permissions?.canAccessStockManager === false)) {
      setActiveSubTab('checkout');
    }
  }, [currentUser?.Permissions, activeSubTab]);

  // Inventory Manager State
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [invSearchQuery, setInvSearchQuery] = useState('');
  const [invSortField, setInvSortField] = useState<'ItemID' | 'ItemName' | 'Unit' | 'MedicineType' | 'CStock' | 'MinStock' | 'ReorderQty' | 'PurchasePrice' | 'Price'>('ItemName');
  const [invSortOrder, setInvSortOrder] = useState<'asc' | 'desc'>('asc');
  const [invCurrentPage, setInvCurrentPage] = useState<number>(1);
  const [invPageSize, setInvPageSize] = useState<number>(50);
  
  // New/Edit Item Form State
  const [itemFormId, setItemFormId] = useState('');
  const [itemFormName, setItemFormName] = useState('');
  const [itemFormRetailPrice, setItemFormRetailPrice] = useState<number | ''>('');
  const [itemFormPurchasePrice, setItemFormPurchasePrice] = useState<number | ''>('');
  const [itemFormCStock, setItemFormCStock] = useState<number | ''>('');
  const [itemFormMinStock, setItemFormMinStock] = useState<number | ''>('');
  const [itemFormReorderQty, setItemFormReorderQty] = useState<number | ''>('');
  const [itemFormUnit, setItemFormUnit] = useState('Tab');
  const [itemFormMedicineType, setItemFormMedicineType] = useState<'C' | 'P'>('P');
  const [itemFormVendorBarcode, setItemFormVendorBarcode] = useState('');
  const [itemFormBatchNo, setItemFormBatchNo] = useState('');
  const [itemFormMfgDate, setItemFormMfgDate] = useState('');
  const [itemFormExpDate, setItemFormExpDate] = useState('');
  const [invSuccessMsg, setInvSuccessMsg] = useState('');
  const [invErrorMsg, setInvErrorMsg] = useState('');

  // Multi-Batch & Expiry Management States
  const [selectedBatchItem, setSelectedBatchItem] = useState<Item | null>(null);
  const [isBatchesModalOpen, setIsBatchesModalOpen] = useState(false);
  const [batchFormNo, setBatchFormNo] = useState('');
  const [batchFormMfgDate, setBatchFormMfgDate] = useState('');
  const [batchFormExpDate, setBatchFormExpDate] = useState('');
  const [batchFormQty, setBatchFormQty] = useState<number | ''>('');
  const [batchFormCost, setBatchFormCost] = useState<number | ''>('');
  const [batchFormSalePrice, setBatchFormSalePrice] = useState<number | ''>('');
  const [batchFormPoGrnRef, setBatchFormPoGrnRef] = useState('');
  const [editingBatchId, setEditingBatchId] = useState<string | null>(null);
  const [batchModalMsg, setBatchModalMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [invExpiryFilterScope, setInvExpiryFilterScope] = useState<'ALL' | 'EXPIRED' | 'NEAR_EXPIRY' | 'ACTIVE'>('ALL');

  // Vendor / Supplier Management States
  const [isVendorModalOpen, setIsVendorModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [supplierFormId, setSupplierFormId] = useState('');
  const [supplierFormName, setSupplierFormName] = useState('');
  const [supplierFormPhone, setSupplierFormPhone] = useState('');
  const [supplierFormAddress, setSupplierFormAddress] = useState('');
  const [vendorSuccessMsg, setVendorSuccessMsg] = useState('');
  const [vendorErrorMsg, setVendorErrorMsg] = useState('');

  // Clinical labels state
  const [labelPatientId, setLabelPatientId] = useState('');
  const [labelVisitId, setLabelVisitId] = useState('');
  const [labelSearchQuery, setLabelSearchQuery] = useState('');
  const [customLabelStates, setCustomLabelStates] = useState<Record<string, any>>({});
  const [isLabelPrintModalOpen, setIsLabelPrintModalOpen] = useState(false);
  const [labelPrintData, setLabelPrintData] = useState<any>(null);

  // Sales return state
  const [salesReturns, setSalesReturns] = useState<any[]>([]);
  const [returnDetails, setReturnDetails] = useState<any[]>([]);
  const [returnSearchTerm, setReturnSearchTerm] = useState('');
  const [returnDateFilter, setReturnDateFilter] = useState('');
  const [isReturnSubmitting, setIsReturnSubmitting] = useState(false);

  // Patent sourcing quick modal state
  const [showPatentSourcingModal, setShowPatentSourcingModal] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [selectedPatientName, setSelectedPatientName] = useState('');
  const [patentSourcingNote, setPatentSourcingNote] = useState('');
  const handleConfirmPatentSourcing = (_opt?: string) => {
    setShowPatentSourcingModal(false);
  };
  const onVoidInvoice = (_invoiceNo: string) => {};

  const resetSupplierForm = () => {
    setEditingSupplier(null);
    setSupplierFormId('');
    setSupplierFormName('');
    setSupplierFormPhone('');
    setSupplierFormAddress('');
    setVendorSuccessMsg('');
    setVendorErrorMsg('');
  };

  const handleSelectEditSupplier = (sup: Supplier) => {
    setEditingSupplier(sup);
    setSupplierFormId(sup.SID);
    setSupplierFormName(sup.SupplierName);
    setSupplierFormPhone(sup.Phone);
    setSupplierFormAddress(sup.Address);
    setVendorSuccessMsg('');
    setVendorErrorMsg('');
  };

  const handleSaveSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!setSuppliers) {
      setVendorErrorMsg('System error: setSuppliers state updater not provided.');
      return;
    }
    if (!supplierFormName.trim()) {
      setVendorErrorMsg('Supplier Name is required.');
      return;
    }

    const sid = supplierFormId.trim() || `SUP-${Date.now().toString().slice(-4)}`;
    const newSupplier: Supplier = {
      SID: sid,
      SupplierName: supplierFormName.trim(),
      Phone: supplierFormPhone.trim(),
      Address: supplierFormAddress.trim()
    };

    const bridgeUrl = window.location.origin;
    fetch(`${bridgeUrl}/api/suppliers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newSupplier)
    })
      .then(res => {
        if (!res.ok) throw new Error(`HTTP status ${res.status}`);
        return res.json();
      })
      .then(() => {
        setSuppliers(prev => {
          const index = prev.findIndex(s => s.SID === newSupplier.SID);
          if (index >= 0) {
            const updated = [...prev];
            updated[index] = newSupplier;
            return updated;
          } else {
            return [...prev, newSupplier];
          }
        });
        setVendorSuccessMsg(editingSupplier ? 'Supplier updated successfully!' : 'Supplier registered successfully!');
        setVendorErrorMsg('');
        if (!editingSupplier) {
          resetSupplierForm();
        } else {
          setEditingSupplier(newSupplier);
        }
      })
      .catch(err => {
        console.warn('Backend supplier sync failed, falling back to local only:', err.message);
        setSuppliers(prev => {
          const index = prev.findIndex(s => s.SID === newSupplier.SID);
          if (index >= 0) {
            const updated = [...prev];
            updated[index] = newSupplier;
            return updated;
          } else {
            return [...prev, newSupplier];
          }
        });
        setVendorSuccessMsg(editingSupplier ? 'Supplier updated locally.' : 'Supplier registered locally.');
        setVendorErrorMsg('');
        if (!editingSupplier) {
          resetSupplierForm();
        } else {
          setEditingSupplier(newSupplier);
        }
      });
  };

  const handleDeleteSupplier = (sid: string) => {
    if (!window.confirm('Are you sure you want to delete this supplier?')) return;
    if (!setSuppliers) return;

    const bridgeUrl = window.location.origin;
    fetch(`${bridgeUrl}/api/suppliers/${sid}`, {
      method: 'DELETE'
    })
      .then(res => {
        if (!res.ok) throw new Error(`HTTP status ${res.status}`);
        return res.json();
      })
      .then(() => {
        setSuppliers(prev => prev.filter(s => s.SID !== sid));
        setVendorSuccessMsg('Supplier deleted successfully!');
        if (editingSupplier && editingSupplier.SID === sid) {
          resetSupplierForm();
        }
      })
      .catch(err => {
        console.warn('Backend supplier delete failed, falling back to local only:', err.message);
        setSuppliers(prev => prev.filter(s => s.SID !== sid));
        setVendorSuccessMsg('Supplier deleted locally.');
        if (editingSupplier && editingSupplier.SID === sid) {
          resetSupplierForm();
        }
      });
  };

  // Helper to auto-generate next sequential numeric Item ID (base 1443)
  const getAutoNextItemId = (itemList: Item[] = []) => {
    let maxNum = 1443;
    (itemList || []).forEach(i => {
      if (i && i.ItemID) {
        const rawDigits = String(i.ItemID).replace(/\D/g, '');
        if (rawDigits) {
          const num = parseInt(rawDigits, 10);
          if (!isNaN(num) && num > maxNum) {
            maxNum = num;
          }
        }
      }
    });
    return String(maxNum + 1);
  };

  // Open modal for adding a brand new medicine
  const handleOpenAddMedicineModal = () => {
    setEditingItem(null);
    const nextAutoId = getAutoNextItemId(items);
    setItemFormId(nextAutoId);
    setItemFormName('');
    setItemFormRetailPrice('');
    setItemFormPurchasePrice('');
    setItemFormCStock('');
    setItemFormMinStock(1);
    setItemFormReorderQty('');
    setItemFormUnit('Tab');
    setItemFormMedicineType('P');
    setItemFormVendorBarcode('');
    setItemFormBatchNo('');
    setItemFormMfgDate('');
    setItemFormExpDate('');
    setInvErrorMsg('');
    setIsAddMedicineModalOpen(true);
  };

  // Reset Item Form
  const resetItemForm = () => {
    setEditingItem(null);
    setItemFormId('');
    setItemFormName('');
    setItemFormRetailPrice('');
    setItemFormPurchasePrice('');
    setItemFormCStock('');
    setItemFormMinStock(1);
    setItemFormReorderQty('');
    setItemFormUnit('Tab');
    setItemFormMedicineType('P');
    setItemFormVendorBarcode('');
    setItemFormBatchNo('');
    setItemFormMfgDate('');
    setItemFormExpDate('');
    setInvErrorMsg('');
    setIsAddMedicineModalOpen(false);
  };

  // Select Item for editing
  const handleSelectEditItem = (itm: Item) => {
    setEditingItem(itm);
    setItemFormId(itm.ItemID);
    setItemFormName(itm.ItemName);
    setItemFormRetailPrice(itm.Price);
    setItemFormPurchasePrice(itm.PurchasePrice);
    setItemFormCStock(itm.CStock);
    setItemFormMinStock((itm.MinStock !== undefined && itm.MinStock !== null) ? itm.MinStock : 1);
    setItemFormReorderQty(itm.ReorderQty !== undefined ? itm.ReorderQty : '');
    setItemFormUnit(itm.Unit || 'Tab');
    setItemFormMedicineType(itm.MedicineType || 'P');
    setItemFormVendorBarcode(itm.VendorBarcode || '');
    setItemFormBatchNo(itm.BatchNo || '');
    setItemFormMfgDate(toMonthYearInput(itm.MfgDate));
    setItemFormExpDate(toMonthYearInput(itm.ExpDate));
    setInvErrorMsg('');
    setIsAddMedicineModalOpen(true);
  };

  // Sync Item changes to database helper
  const syncItemToBackend = async (action: 'CREATE' | 'UPDATE' | 'DELETE', item: Partial<Item> & { ItemID: string }) => {
    try {
      if (action === 'CREATE') {
        await fetch('/api/items', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item)
        });
      } else if (action === 'UPDATE') {
        await fetch(`/api/items/${encodeURIComponent(item.ItemID)}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item)
        });
      } else if (action === 'DELETE') {
        await fetch(`/api/items/${encodeURIComponent(item.ItemID)}`, {
          method: 'DELETE'
        });
      }
    } catch (err) {
      console.error(`Failed to ${action} item in database:`, err);
    }
  };

  // Add/Update Item handler
  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!setItems) {
      setInvErrorMsg('System error: items state updater not provided.');
      return;
    }

    if (!editingItem && !canAddStock) {
      setInvErrorMsg('Access Denied: You do not have "Add Record" permission to create new stock items.');
      return;
    }

    const finalItemId = (itemFormId.trim() || (!editingItem ? getAutoNextItemId(items) : '')).trim();

    if (!finalItemId) {
      setInvErrorMsg('Item ID is required.');
      return;
    }
    if (!itemFormName.trim()) {
      setInvErrorMsg('Item Name is required.');
      return;
    }

    const rPrice = itemFormRetailPrice === '' ? 0 : Number(itemFormRetailPrice);
    const pPrice = itemFormPurchasePrice === '' ? 0 : Number(itemFormPurchasePrice);
    const stock = (editingItem && !canEditStock) ? editingItem.CStock : (itemFormCStock === '' ? 0 : Number(itemFormCStock));
    const minS = itemFormMinStock === '' ? 1 : Number(itemFormMinStock);
    const reorderQ = itemFormReorderQty === '' ? undefined : Number(itemFormReorderQty);
    const vendorBarcodeVal = itemFormVendorBarcode.trim() || undefined;
    const batchNoVal = itemFormBatchNo.trim() || undefined;
    const mfgDateVal = itemFormMfgDate.trim() ? toMonthYearInput(itemFormMfgDate.trim()) : undefined;
    const expDateVal = itemFormExpDate.trim() ? toMonthYearInput(itemFormExpDate.trim()) : undefined;

    if (editingItem) {
      const updatedItem: Item = {
        ...editingItem,
        ItemID: finalItemId,
        ItemName: itemFormName.trim(),
        Price: rPrice,
        PurchasePrice: pPrice,
        CStock: stock,
        MinStock: minS,
        ReorderQty: reorderQ,
        Unit: itemFormUnit,
        MedicineType: itemFormMedicineType,
        VendorBarcode: vendorBarcodeVal,
        BatchNo: batchNoVal,
        MfgDate: mfgDateVal,
        ExpDate: expDateVal,
        Batches: editingItem.Batches
      };

      // Update existing item in local state and database
      setItems(prev => prev.map(itm => itm.ItemID === editingItem.ItemID ? updatedItem : itm));
      syncItemToBackend('UPDATE', updatedItem);
      setInvSuccessMsg(`Medicine "${itemFormName.trim()}" updated successfully!`);
      resetItemForm();
    } else {
      // Check if ItemID already exists
      const idExists = items.some(itm => itm.ItemID.toLowerCase() === finalItemId.toLowerCase());
      if (idExists) {
        setInvErrorMsg(`Item ID "${finalItemId}" already exists in inventory!`);
        return;
      }

      // Prepare initial batch if stock or batch info is supplied
      let initialBatches: ItemBatch[] = [];
      if (stock > 0 || batchNoVal || expDateVal) {
        initialBatches = [{
          BatchID: `${finalItemId}-B1`,
          ItemID: finalItemId,
          ItemName: itemFormName.trim(),
          BatchNo: batchNoVal || `B-${new Date().getFullYear()}-001`,
          MfgDate: mfgDateVal || new Date().toISOString().slice(0, 7),
          ExpDate: expDateVal || '',
          PurchasePrice: pPrice,
          SalePrice: rPrice,
          Qty: stock,
          InitialQty: stock,
          Status: stock === 0 ? 'EXHAUSTED' : isBatchExpired(expDateVal) ? 'EXPIRED' : 'ACTIVE',
          CreatedAt: new Date().toISOString()
        }];
      }

      // Add new item
      const newItem: Item = {
        ItemID: finalItemId,
        ItemName: itemFormName.trim(),
        Price: rPrice,
        PurchasePrice: pPrice,
        CStock: stock,
        MinStock: minS,
        ReorderQty: reorderQ,
        Unit: itemFormUnit,
        MedicineType: itemFormMedicineType,
        VendorBarcode: vendorBarcodeVal,
        BatchNo: batchNoVal,
        MfgDate: mfgDateVal,
        ExpDate: expDateVal,
        Batches: initialBatches.length > 0 ? initialBatches : undefined
      };

      setItems(prev => [...prev, newItem]);
      syncItemToBackend('CREATE', newItem);
      setInvSuccessMsg(`New medicine "${itemFormName.trim()}" (ID: ${finalItemId}) added successfully!`);
      resetItemForm();
    }

    setTimeout(() => setInvSuccessMsg(''), 5000);
  };

  // Open Multi-Batch Management Modal
  const handleOpenBatchManager = (itm: Item) => {
    setSelectedBatchItem(itm);
    setEditingBatchId(null);
    setBatchFormNo('');
    setBatchFormMfgDate(new Date().toISOString().slice(0, 7));
    setBatchFormExpDate('');
    setBatchFormQty('');
    setBatchFormCost(itm.PurchasePrice || '');
    setBatchFormSalePrice(itm.Price || '');
    setBatchFormPoGrnRef('');
    setBatchModalMsg(null);
    setIsBatchesModalOpen(true);
  };

  // Populate form for editing existing batch
  const handleStartEditBatch = (batch: ItemBatch) => {
    setEditingBatchId(batch.BatchID);
    setBatchFormNo(batch.BatchNo || '');
    setBatchFormMfgDate(toMonthYearInput(batch.MfgDate));
    setBatchFormExpDate(toMonthYearInput(batch.ExpDate));
    setBatchFormQty(batch.Qty !== undefined ? batch.Qty : '');
    setBatchFormCost(batch.PurchasePrice !== undefined ? batch.PurchasePrice : '');
    setBatchFormSalePrice(batch.SalePrice !== undefined ? batch.SalePrice : '');
    setBatchFormPoGrnRef(batch.GRNID || batch.POID || '');
    setBatchModalMsg(null);
  };

  // Save / Receive New Batch
  const handleSaveBatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBatchItem || !setItems) return;

    if (!batchFormNo.trim()) {
      setBatchModalMsg({ type: 'error', text: 'Batch Number is required.' });
      return;
    }
    if (!batchFormExpDate.trim()) {
      setBatchModalMsg({ type: 'error', text: 'Expiry Date is required.' });
      return;
    }
    const qty = batchFormQty === '' ? 0 : Number(batchFormQty);
    if (qty < 0) {
      setBatchModalMsg({ type: 'error', text: 'Quantity cannot be negative.' });
      return;
    }

    const mfgVal = toMonthYearInput(batchFormMfgDate.trim()) || new Date().toISOString().slice(0, 7);
    const expVal = toMonthYearInput(batchFormExpDate.trim());

    // Existing batches array or migrate legacy item batch
    const existingBatches: ItemBatch[] = Array.isArray(selectedBatchItem.Batches) && selectedBatchItem.Batches.length > 0
      ? [...selectedBatchItem.Batches]
      : (selectedBatchItem.CStock > 0 || selectedBatchItem.BatchNo || selectedBatchItem.ExpDate
          ? [{
              BatchID: `${selectedBatchItem.ItemID}-B-initial`,
              ItemID: selectedBatchItem.ItemID,
              ItemName: selectedBatchItem.ItemName,
              BatchNo: selectedBatchItem.BatchNo || 'B# 001',
              MfgDate: toMonthYearInput(selectedBatchItem.MfgDate) || '',
              ExpDate: toMonthYearInput(selectedBatchItem.ExpDate) || '',
              PurchasePrice: selectedBatchItem.PurchasePrice,
              SalePrice: selectedBatchItem.Price,
              Qty: selectedBatchItem.CStock,
              InitialQty: selectedBatchItem.CStock,
              Status: selectedBatchItem.CStock === 0 ? 'EXHAUSTED' : isBatchExpired(selectedBatchItem.ExpDate) ? 'EXPIRED' : 'ACTIVE',
              CreatedAt: new Date().toISOString()
            }]
          : []);

    let updatedBatches: ItemBatch[] = [];
    if (editingBatchId) {
      updatedBatches = existingBatches.map(b => {
        if (b.BatchID === editingBatchId) {
          return {
            ...b,
            BatchNo: batchFormNo.trim(),
            MfgDate: mfgVal,
            ExpDate: expVal,
            Qty: qty,
            PurchasePrice: batchFormCost === '' ? b.PurchasePrice : Number(batchFormCost),
            SalePrice: batchFormSalePrice === '' ? b.SalePrice : Number(batchFormSalePrice),
            GRNID: batchFormPoGrnRef.trim() || b.GRNID,
            Status: qty === 0 ? 'EXHAUSTED' : isBatchExpired(expVal) ? 'EXPIRED' : 'ACTIVE'
          };
        }
        return b;
      });
    } else {
      const newBatchId = `${selectedBatchItem.ItemID}-B-${Date.now().toString().slice(-4)}`;
      const newBatch: ItemBatch = {
        BatchID: newBatchId,
        ItemID: selectedBatchItem.ItemID,
        ItemName: selectedBatchItem.ItemName,
        BatchNo: batchFormNo.trim(),
        MfgDate: mfgVal,
        ExpDate: expVal,
        PurchasePrice: batchFormCost === '' ? selectedBatchItem.PurchasePrice : Number(batchFormCost),
        SalePrice: batchFormSalePrice === '' ? selectedBatchItem.Price : Number(batchFormSalePrice),
        Qty: qty,
        InitialQty: qty,
        GRNID: batchFormPoGrnRef.trim() || undefined,
        Status: qty === 0 ? 'EXHAUSTED' : isBatchExpired(expVal) ? 'EXPIRED' : 'ACTIVE',
        CreatedAt: new Date().toISOString()
      };
      updatedBatches = [newBatch, ...existingBatches];
    }

    // Recalculate total current stock across all batches
    const newTotalStock = updatedBatches.reduce((sum, b) => sum + (Number(b.Qty) || 0), 0);
    
    // Sort active batches by FEFO (First Expired, First Out)
    const activeBatches = updatedBatches.filter(b => (Number(b.Qty) || 0) > 0);
    const earliestBatch = activeBatches.length > 0
      ? [...activeBatches].sort((a, b) => (a.ExpDate || '9999').localeCompare(b.ExpDate || '9999'))[0]
      : updatedBatches[0];

    const updatedItem: Item = {
      ...selectedBatchItem,
      CStock: newTotalStock,
      BatchNo: earliestBatch?.BatchNo || selectedBatchItem.BatchNo,
      MfgDate: earliestBatch?.MfgDate || selectedBatchItem.MfgDate,
      ExpDate: earliestBatch?.ExpDate || selectedBatchItem.ExpDate,
      Batches: updatedBatches
    };

    setItems(prev => prev.map(i => i.ItemID === updatedItem.ItemID ? updatedItem : i));
    syncItemToBackend('UPDATE', updatedItem);
    setSelectedBatchItem(updatedItem);
    setEditingBatchId(null);
    setBatchFormNo('');
    setBatchFormMfgDate(new Date().toISOString().slice(0, 7));
    setBatchFormExpDate('');
    setBatchFormQty('');
    setBatchFormPoGrnRef('');
    setBatchModalMsg({
      type: 'success',
      text: editingBatchId ? 'Batch updated successfully!' : 'New stock batch added and master stock recalculated!'
    });
    setTimeout(() => setBatchModalMsg(null), 3500);
  };

  // Delete Batch handler
  const handleDeleteBatch = (batchId: string) => {
    if (!selectedBatchItem || !setItems) return;
    if (!window.confirm('Are you sure you want to remove this batch? The master stock level will be recalculated.')) return;

    const existingBatches: ItemBatch[] = Array.isArray(selectedBatchItem.Batches) ? selectedBatchItem.Batches : [];
    const updatedBatches = existingBatches.filter(b => b.BatchID !== batchId);
    const newTotalStock = updatedBatches.reduce((sum, b) => sum + (Number(b.Qty) || 0), 0);
    const activeBatches = updatedBatches.filter(b => (Number(b.Qty) || 0) > 0);
    const earliestBatch = activeBatches.length > 0
      ? [...activeBatches].sort((a, b) => (a.ExpDate || '9999').localeCompare(b.ExpDate || '9999'))[0]
      : updatedBatches[0];

    const updatedItem: Item = {
      ...selectedBatchItem,
      CStock: newTotalStock,
      BatchNo: earliestBatch?.BatchNo || '',
      MfgDate: earliestBatch?.MfgDate || '',
      ExpDate: earliestBatch?.ExpDate || '',
      Batches: updatedBatches
    };

    setItems(prev => prev.map(i => i.ItemID === updatedItem.ItemID ? updatedItem : i));
    syncItemToBackend('UPDATE', updatedItem);
    setSelectedBatchItem(updatedItem);
    if (editingBatchId === batchId) {
      setEditingBatchId(null);
    }
    setBatchModalMsg({ type: 'success', text: 'Batch deleted and total stock recalculated.' });
    setTimeout(() => setBatchModalMsg(null), 3500);
  };

  // Remove Item handler
  const handleRemoveItem = (itemId: string, itemName: string) => {
    if (!setItems) return;
    if (!canCancelStock) {
      setInvErrorMsg('Access Denied: You do not have "Cancel/Void Record" permission to delete inventory items.');
      return;
    }
    const targetItem = items.find(i => i.ItemID === itemId);
    const availableStock = Number(targetItem?.CStock || 0);
    if (availableStock > 0) {
      setInvErrorMsg(`Deletion Restricted: "${itemName}" currently has active stock (${availableStock} ${targetItem?.Unit || 'Units'}). Stock must be 0 before deleting from inventory.`);
      return;
    }
    if (window.confirm(`Are you sure you want to delete "${itemName}" from the inventory list?`)) {
      setItems(prev => prev.filter(itm => itm.ItemID !== itemId));
      syncItemToBackend('DELETE', { ItemID: itemId });
      setInvSuccessMsg(`Medicine "${itemName}" removed from inventory successfully.`);
      setTimeout(() => setInvSuccessMsg(''), 5000);
      if (editingItem?.ItemID === itemId) {
        resetItemForm();
      }
    }
  };

  // Print states for pharmacy cash invoice bill and reports
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [printModalFormat, setPrintModalFormat] = useState<'a4' | 'thermal'>('a4');
  const [selectedDailyReportDate, setSelectedDailyReportDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [lastPostedInvoiceData, setLastPostedInvoiceData] = useState<{
    patient: Patient | null;
    basket: { ItemID: string; Qty: number; Price: number; MedicineType?: 'C' | 'P' | 'S' }[];
    discount: number;
    netAmount: number;
    shift: 1 | 2;
    invoiceNo: string;
    invoiceDate: string;
  } | null>(null);
  const [printBillData, setPrintBillData] = useState<{
    patient: Patient | null;
    basket: { ItemID: string; Qty: number; Price: number; MedicineType?: 'C' | 'P' | 'S' }[];
    discount: number;
    netAmount: number;
    shift: 1 | 2;
    invoiceNo: string;
    invoiceDate: string;
  } | null>(null);

  // Add Medicine Popup Modal & Grid Filters States
  const [isAddMedicineModalOpen, setIsAddMedicineModalOpen] = useState(false);
  const [isBulkExpiryModalOpen, setIsBulkExpiryModalOpen] = useState(false);
  const [isDeadItemsModalOpen, setIsDeadItemsModalOpen] = useState(false);
  const [invCategoryFilter, setInvCategoryFilter] = useState<string>('ALL');
  const [invStockFilter, setInvStockFilter] = useState<'ALL' | 'IN_STOCK' | 'LOW_STOCK' | 'ZERO_STOCK'>('ALL');
  const [invLowStockFilter, setInvLowStockFilter] = useState<boolean>(false);
  const [invDeadFilterScope, setInvDeadFilterScope] = useState<'ALL' | 'ACTIVE_ONLY' | 'DEAD_ONLY'>('ACTIVE_ONLY');
  const [categorySidebarSearch, setCategorySidebarSearch] = useState<string>('');

  // Handle Single Item Dead Status Update
  const handleUpdateItemDeadStatus = async (itemId: string, isDead: boolean, reason?: string) => {
    if (!setItems) return;

    let targetUpdatedItem: Item | null = null;
    const nowIso = new Date().toISOString();

    setItems(prev => {
      return prev.map(itm => {
        if (itm.ItemID !== itemId) return itm;
        const updated: Item = {
          ...itm,
          IsDead: isDead,
          DeadReason: isDead ? (reason || itm.DeadReason || 'Manual Dead Marking') : '',
          DeadMarkedDate: isDead ? (itm.DeadMarkedDate || nowIso) : undefined,
          Status: isDead ? 'Dead' : 'Active'
        };
        targetUpdatedItem = updated;
        return updated;
      });
    });

    if (targetUpdatedItem) {
      syncItemToBackend('UPDATE', targetUpdatedItem);
    }
  };

  // Bulk Dead Status Update Handler across multiple items
  const handleBulkUpdateDeadStatus = async (
    updates: { itemId: string; isDead: boolean; reason?: string }[]
  ) => {
    if (!setItems || updates.length === 0) return;

    const updatesMap = new Map<string, { isDead: boolean; reason?: string }>();
    updates.forEach(u => updatesMap.set(u.itemId, u));

    const updatedItemsList: Item[] = [];
    const nowIso = new Date().toISOString();

    setItems(prev => {
      return prev.map(itm => {
        const up = updatesMap.get(itm.ItemID);
        if (!up) return itm;

        const updated: Item = {
          ...itm,
          IsDead: up.isDead,
          DeadReason: up.isDead ? (up.reason || itm.DeadReason || 'Manual Dead Marking') : '',
          DeadMarkedDate: up.isDead ? (itm.DeadMarkedDate || nowIso) : undefined,
          Status: up.isDead ? 'Dead' : 'Active'
        };

        updatedItemsList.push(updated);
        return updated;
      });
    });

    // Synchronize items with backend
    for (const updatedItem of updatedItemsList) {
      syncItemToBackend('UPDATE', updatedItem);
    }

    setInvSuccessMsg(`✅ Dead status updated for ${updates.length} medicines!`);
    setTimeout(() => setInvSuccessMsg(''), 5000);
  };

  // Bulk Expiry Date Update Handler across multiple items
  const handleBulkUpdateExpiry = async (
    updates: { itemId: string; newExpDate: string; updateBatches: boolean }[]
  ) => {
    if (!setItems || updates.length === 0) return;

    const updatesMap = new Map<string, { newExpDate: string; updateBatches: boolean }>();
    updates.forEach((u) => updatesMap.set(u.itemId, u));

    const updatedItemsList: Item[] = [];

    setItems((prev) => {
      return prev.map((itm) => {
        const up = updatesMap.get(itm.ItemID);
        if (!up) return itm;

        let updatedBatches = itm.Batches;
        if (up.updateBatches) {
          if (Array.isArray(itm.Batches) && itm.Batches.length > 0) {
            updatedBatches = itm.Batches.map((b) => ({
              ...b,
              ExpDate: up.newExpDate,
              Status: isBatchExpired(up.newExpDate) ? ('EXPIRED' as const) : ('ACTIVE' as const)
            }));
          } else {
            updatedBatches = [
              {
                BatchID: `${itm.ItemID}-B-initial`,
                ItemID: itm.ItemID,
                ItemName: itm.ItemName,
                BatchNo: itm.BatchNo || `B-${new Date().getFullYear()}-001`,
                MfgDate: itm.MfgDate || new Date().toISOString().slice(0, 7),
                ExpDate: up.newExpDate,
                PurchasePrice: itm.PurchasePrice,
                SalePrice: itm.Price,
                Qty: itm.CStock,
                InitialQty: itm.CStock,
                Status: isBatchExpired(up.newExpDate) ? ('EXPIRED' as const) : ('ACTIVE' as const),
                CreatedAt: new Date().toISOString()
              }
            ];
          }
        }

        const updatedItem: Item = {
          ...itm,
          ExpDate: up.newExpDate,
          Batches: updatedBatches
        };

        updatedItemsList.push(updatedItem);
        return updatedItem;
      });
    });

    // Synchronize each item with the backend API
    for (const updatedItem of updatedItemsList) {
      syncItemToBackend('UPDATE', updatedItem);
    }

    setInvSuccessMsg(`✅ Expiry date successfully updated for ${updates.length} selected medicines!`);
    setTimeout(() => setInvSuccessMsg(''), 6000);
  };

  // Custom Category Add & Edit States
  const [categories, setCategories] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('pharmacy_custom_categories');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error("Error loading categories", e);
    }
    return MEDICINE_CATEGORIES;
  });

  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCatInput, setNewCatInput] = useState('');
  const [editingCatIndex, setEditingCatIndex] = useState<number | null>(null);
  const [editingCatName, setEditingCatName] = useState('');
  const [catSuccessMsg, setCatSuccessMsg] = useState('');
  const [catErrorMsg, setCatErrorMsg] = useState('');

  useEffect(() => {
    try {
      localStorage.setItem('pharmacy_custom_categories', JSON.stringify(categories));
    } catch (e) {
      console.error("Error saving categories", e);
    }
  }, [categories]);

  // Navigation categories memo for Side Navigation Bar of Medicine Categories & PO Required Quantity Manager
  const navCategories = useMemo(() => {
    const defaultList = [
      { id: 'ALL', label: 'All Categories' },
      { id: 'BM Drops', label: 'BM Drops', isFeatured: true },
      { id: 'C', label: 'Clinical Compounding (/C)' },
      { id: 'P', label: 'Patent Medicine (/P)' },
      { id: 'Q D DROPS', label: 'Q D DROPS (Mother Tincture)' },
      { id: 'Potency 30', label: 'Potency 30' },
      { id: 'Potency 200', label: 'Potency 200' },
      { id: 'Syrup', label: 'Syrup' },
      { id: 'Drops', label: 'Drops' },
    ];

    const existing = new Set(defaultList.map((d) => d.id.toLowerCase().trim()));
    categories.forEach((catName) => {
      if (catName && !existing.has(catName.toLowerCase().trim())) {
        defaultList.push({ id: catName, label: catName, isFeatured: false });
        existing.add(catName.toLowerCase().trim());
      }
    });

    return defaultList;
  }, [categories]);

  const getCategoryMetrics = useCallback((catId: string) => {
    const catItems = items.filter((itm) => {
      if (catId === 'ALL') return true;
      if (catId === 'C') return itm.MedicineType === 'C';
      if (catId === 'P') return itm.MedicineType !== 'C';
      const u = (itm.Unit || '').toLowerCase().trim();
      const c = catId.toLowerCase().trim();
      return u === c || u.includes(c) || c.includes(u);
    });

    const totalReqQty = catItems.reduce((acc, itm) => {
      const rq = (itm.ReorderQty !== undefined && itm.ReorderQty !== null)
        ? itm.ReorderQty
        : 0;
      return acc + rq;
    }, 0);

    const lowStockCount = catItems.filter((itm) => {
      const stock = Number(itm.CStock ?? (itm as any).Stock ?? 0);
      const minStock = (itm.MinStock !== undefined && itm.MinStock !== null) ? Number(itm.MinStock) : 1;
      return stock <= minStock;
    }).length;

    return { catItemsCount: catItems.length, totalReqQty, lowStockCount };
  }, [items]);

  // Overall Inventory Statistics for Accurate Dynamic Filter Badges
  const inventoryStats = useMemo(() => {
    let totalCatalog = items.length;
    let activeCount = 0;
    let deadCount = 0;

    let activeInStockCount = 0;
    let activeLowStockCount = 0;
    let activeZeroStockCount = 0;

    let allInStockCount = 0;
    let allLowStockCount = 0;
    let allZeroStockCount = 0;

    let deadInStockCount = 0;
    let deadLowStockCount = 0;
    let deadZeroStockCount = 0;

    items.forEach((itm) => {
      const isDead = Boolean(itm.IsDead || itm.Status === 'Dead' || itm.Status === 'DEAD');
      const stock = Number(itm.CStock ?? (itm as any).Stock ?? 0);
      const minThreshold = (itm.MinStock !== undefined && itm.MinStock !== null) ? Number(itm.MinStock) : 1;
      const isLow = stock <= minThreshold;
      const isZero = stock <= 0;
      const isInStock = stock > 0;

      if (isInStock) allInStockCount++;
      if (isLow) allLowStockCount++;
      if (isZero) allZeroStockCount++;

      if (isDead) {
        deadCount++;
        if (isInStock) deadInStockCount++;
        if (isLow) deadLowStockCount++;
        if (isZero) deadZeroStockCount++;
      } else {
        activeCount++;
        if (isInStock) activeInStockCount++;
        if (isLow) activeLowStockCount++;
        if (isZero) activeZeroStockCount++;
      }
    });

    return {
      totalCatalog,
      activeCount,
      deadCount,
      activeInStockCount,
      activeLowStockCount,
      activeZeroStockCount,
      allInStockCount,
      allLowStockCount,
      allZeroStockCount,
      deadInStockCount,
      deadLowStockCount,
      deadZeroStockCount,
    };
  }, [items]);

  // Dynamic counts according to current Dead Status Scope
  const currentScopeCounts = useMemo(() => {
    if (invDeadFilterScope === 'ACTIVE_ONLY') {
      return {
        total: inventoryStats.activeCount,
        inStock: inventoryStats.activeInStockCount,
        lowStock: inventoryStats.activeLowStockCount,
        zeroStock: inventoryStats.activeZeroStockCount,
      };
    } else if (invDeadFilterScope === 'DEAD_ONLY') {
      return {
        total: inventoryStats.deadCount,
        inStock: inventoryStats.deadInStockCount,
        lowStock: inventoryStats.deadLowStockCount,
        zeroStock: inventoryStats.deadZeroStockCount,
      };
    } else {
      return {
        total: inventoryStats.totalCatalog,
        inStock: inventoryStats.allInStockCount,
        lowStock: inventoryStats.allLowStockCount,
        zeroStock: inventoryStats.allZeroStockCount,
      };
    }
  }, [invDeadFilterScope, inventoryStats]);

  const handleAddCategory = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = newCatInput.trim();
    if (!trimmed) {
      setCatErrorMsg('Please enter a valid category name.');
      return;
    }
    if (categories.some(c => c.toLowerCase() === trimmed.toLowerCase())) {
      setCatErrorMsg(`Category "${trimmed}" already exists.`);
      return;
    }
    setCategories(prev => [...prev, trimmed]);
    setNewCatInput('');
    setCatErrorMsg('');
    setCatSuccessMsg(`Category "${trimmed}" added successfully.`);
    setTimeout(() => setCatSuccessMsg(''), 3000);
  };

  const handleSaveEditCategory = (index: number) => {
    const trimmed = editingCatName.trim();
    if (!trimmed) {
      setCatErrorMsg('Category name cannot be empty.');
      return;
    }
    const oldName = categories[index];
    if (categories.some((c, idx) => idx !== index && c.toLowerCase() === trimmed.toLowerCase())) {
      setCatErrorMsg(`Category "${trimmed}" already exists.`);
      return;
    }

    setCategories(prev => {
      const updated = [...prev];
      updated[index] = trimmed;
      return updated;
    });

    if (setItems && oldName !== trimmed) {
      setItems(prevItems => prevItems.map(item => {
        if (item.Unit && item.Unit.toLowerCase().trim() === oldName.toLowerCase().trim()) {
          return { ...item, Unit: trimmed };
        }
        return item;
      }));
    }

    setEditingCatIndex(null);
    setEditingCatName('');
    setCatErrorMsg('');
    setCatSuccessMsg(`Category renamed from "${oldName}" to "${trimmed}".`);
    setTimeout(() => setCatSuccessMsg(''), 3000);
  };

  const handleDeleteCategory = (index: number) => {
    const catToDelete = categories[index];
    if (confirm(`Are you sure you want to delete category "${catToDelete}"?`)) {
      setCategories(prev => prev.filter((_, idx) => idx !== index));
      setCatSuccessMsg(`Category "${catToDelete}" deleted.`);
      setTimeout(() => setCatSuccessMsg(''), 3000);
    }
  };

  const handleResetCategories = () => {
    if (confirm("Reset categories to default system categories?")) {
      setCategories(MEDICINE_CATEGORIES);
      setCatSuccessMsg("Categories reset to system defaults.");
      setTimeout(() => setCatSuccessMsg(''), 3000);
    }
  };

  // Low Stock / Minimum Threshold Purchase Order Report States
  const [isPOPrintPreviewOpen, setIsPOPrintPreviewOpen] = useState(false);
  const [isPOGridModalOpen, setIsPOGridModalOpen] = useState(false);
  const [poModalTab, setPoModalTab] = useState<'po_builder' | 'sales_velocity'>('po_builder');

  // Grid Builder Selection & Custom Order Quantities
  const [selectedPoItemIds, setSelectedPoItemIds] = useState<Set<string>>(new Set());
  const [customOrderQtyMap, setCustomOrderQtyMap] = useState<Record<string, number>>({});
  const [poGridSearch, setPoGridSearch] = useState<string>('');
  const [poStockFilterScope, setPoStockFilterScope] = useState<'THRESHOLD' | 'ALL' | 'SELECTED_ONLY' | 'OUT_OF_STOCK'>('THRESHOLD');
  const [poCategoryFilter, setPoCategoryFilter] = useState<string>('ALL');
  const [poOnlyLowStock, setPoOnlyLowStock] = useState<boolean>(true);
  const [poSupplierId, setPoSupplierId] = useState<string>('');
  const [poPrintLayout, setPoPrintLayout] = useState<'3col' | 'detail'>('detail');

  // Monthly Top-Selling Medicine Sales Velocity States
  const [poSalesPeriodDays, setPoSalesPeriodDays] = useState<number>(30);
  const [salesGridSearch, setSalesGridSearch] = useState<string>('');
  const [salesCategoryFilter, setSalesCategoryFilter] = useState<string>('ALL');
  const [salesFilterScope, setSalesFilterScope] = useState<'ALL' | 'HIGH_DEMAND' | 'TOP_20' | 'LOW_STOCK_ONLY'>('ALL');
  const [salesSortBy, setSalesSortBy] = useState<'units_sold' | 'revenue' | 'stock_deficit'>('units_sold');

  // Open PO Grid Modal & Pre-select low stock items
  const handleOpenPOGridModal = (initialTab: 'po_builder' | 'sales_velocity' = 'po_builder') => {
    setPoModalTab(initialTab);
    
    // Auto-populate low stock items into selection if set is empty
    const lowStockSet = new Set<string>();
    const qtyMap: Record<string, number> = { ...customOrderQtyMap };

    items.forEach(itm => {
      const minStock = (itm.MinStock !== undefined && itm.MinStock !== null) ? itm.MinStock : 1;
      if (itm.CStock <= minStock) {
        lowStockSet.add(itm.ItemID);
      }
      if (!qtyMap[itm.ItemID]) {
        const calcQty = (itm.ReorderQty !== undefined && itm.ReorderQty !== null)
          ? itm.ReorderQty
          : 0;
        qtyMap[itm.ItemID] = calcQty;
      }
    });

    if (selectedPoItemIds.size === 0) {
      setSelectedPoItemIds(lowStockSet);
    }
    setCustomOrderQtyMap(qtyMap);
    setIsPOGridModalOpen(true);
  };

  const handleTogglePoItem = (itemId: string) => {
    setSelectedPoItemIds(prev => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  };

  const handleSelectAllLowStock = () => {
    const lowStockSet = new Set<string>();
    items.forEach(itm => {
      const minStock = (itm.MinStock !== undefined && itm.MinStock !== null) ? itm.MinStock : 1;
      if (itm.CStock <= minStock) {
        lowStockSet.add(itm.ItemID);
      }
    });
    setSelectedPoItemIds(lowStockSet);
  };

  const handleSelectAllVisible = (visibleItems: Item[]) => {
    setSelectedPoItemIds(prev => {
      const next = new Set(prev);
      visibleItems.forEach(i => next.add(i.ItemID));
      return next;
    });
  };

  const handleDeselectAll = () => {
    setSelectedPoItemIds(new Set());
  };

  const handleOrderQtyChange = (itemId: string, qty: number) => {
    const validQty = Math.max(1, isNaN(qty) ? 1 : qty);
    setCustomOrderQtyMap(prev => ({
      ...prev,
      [itemId]: validQty
    }));
  };

  // Unified Category Options for PO Filter
  const categoryDropdownOptions = useMemo(() => {
    const set = new Set<string>();
    categories.forEach(c => {
      if (c && c.trim()) set.add(c.trim());
    });
    items.forEach(itm => {
      if (itm.Unit && itm.Unit.trim()) {
        set.add(itm.Unit.trim());
      }
    });
    return Array.from(set).sort();
  }, [categories, items]);

  // Robust Purchase Order Category & Stock Filter Helper
  const getFilteredPoItems = useCallback((itemsList: Item[], catFilter: string, lowStockOnly: boolean) => {
    return itemsList.filter((itm) => {
      // 1. Stock threshold check
      const minStock = (itm.MinStock !== undefined && itm.MinStock !== null) ? itm.MinStock : 1;
      if (lowStockOnly && itm.CStock > minStock) {
        return false;
      }

      // 2. Category check
      if (!catFilter || catFilter === 'ALL') {
        return true;
      }

      if (catFilter === 'C') {
        return itm.MedicineType === 'C';
      }

      if (catFilter === 'P') {
        return itm.MedicineType !== 'C';
      }

      const c = catFilter.toLowerCase().trim();
      const unit = (itm.Unit || '').toLowerCase().trim();
      const itemName = (itm.ItemName || '').toLowerCase().trim();

      // Exact or partial unit match
      if (unit === c || unit.includes(c) || c.includes(unit)) {
        return true;
      }

      // Fallback matching in ItemName
      if (itemName.includes(c)) {
        return true;
      }

      return false;
    });
  }, []);

  // Real-Time Calculation of Monthly Sales & Demand Velocity across Store Invoices & EMR Prescriptions
  const salesVelocityData = useMemo(() => {
    const cutoffDate = new Date();
    if (poSalesPeriodDays > 0) {
      cutoffDate.setDate(cutoffDate.getDate() - poSalesPeriodDays);
    } else {
      cutoffDate.setFullYear(2000); // All-time
    }

    const salesMap: Record<string, { totalQty: number; totalRevenue: number }> = {};

    // 1. Process Pharmacy POS Store Invoices
    if (Array.isArray(invoices) && Array.isArray(invoiceDetails)) {
      const validInvoiceNos = new Set(
        invoices
          .filter(inv => {
            if (!inv.InvoiceDate) return true;
            const d = new Date(inv.InvoiceDate);
            return isNaN(d.getTime()) || d >= cutoffDate;
          })
          .map(inv => inv.InvoiceNo)
      );

      invoiceDetails.forEach(det => {
        if (!det.ItemID) return;
        if (validInvoiceNos.has(det.InvoiceNo)) {
          if (!salesMap[det.ItemID]) {
            salesMap[det.ItemID] = { totalQty: 0, totalRevenue: 0 };
          }
          const qty = det.Qty || 0;
          const rev = det.LineTotal || (qty * (det.Price || 0));
          salesMap[det.ItemID].totalQty += qty;
          salesMap[det.ItemID].totalRevenue += rev;
        }
      });
    }

    // 2. Process EMR Visit Medicines (Clinical prescriptions)
    if (Array.isArray(visits) && Array.isArray(visitMedicines)) {
      const validVisitIDs = new Set(
        visits
          .filter(v => {
            if (!v.VisitDate) return true;
            const d = new Date(v.VisitDate);
            return isNaN(d.getTime()) || d >= cutoffDate;
          })
          .map(v => v.VisitID)
      );

      visitMedicines.forEach(vm => {
        if (!vm.ItemID) return;
        if (validVisitIDs.has(vm.VisitID)) {
          if (!salesMap[vm.ItemID]) {
            salesMap[vm.ItemID] = { totalQty: 0, totalRevenue: 0 };
          }
          const qty = vm.Qty || 1;
          const matchedItem = items.find(i => i.ItemID === vm.ItemID);
          const price = vm.Price || matchedItem?.Price || 0;
          salesMap[vm.ItemID].totalQty += qty;
          salesMap[vm.ItemID].totalRevenue += (qty * price);
        }
      });
    }

    // Build item sales list with urgency metrics
    const result = items.map(itm => {
      const sales = salesMap[itm.ItemID] || { totalQty: 0, totalRevenue: 0 };
      const minStock = (itm.MinStock !== undefined && itm.MinStock !== null) ? itm.MinStock : 10;
      const isLowStock = itm.CStock <= minStock;
      const stockDeficit = Math.max(0, minStock - itm.CStock);

      let urgency: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'SUFFICIENT' = 'SUFFICIENT';
      if (sales.totalQty > 0 && isLowStock) {
        urgency = 'CRITICAL';
      } else if (isLowStock) {
        urgency = 'HIGH';
      } else if (sales.totalQty >= 10) {
        urgency = 'MODERATE';
      }

      return {
        item: itm,
        totalQtySold: sales.totalQty,
        totalRevenue: sales.totalRevenue,
        isLowStock,
        minStock,
        stockDeficit,
        urgency
      };
    });

    // Sort according to user preference
    if (salesSortBy === 'revenue') {
      result.sort((a, b) => b.totalRevenue - a.totalRevenue || b.totalQtySold - a.totalQtySold);
    } else if (salesSortBy === 'stock_deficit') {
      result.sort((a, b) => b.stockDeficit - a.stockDeficit || b.totalQtySold - a.totalQtySold);
    } else {
      result.sort((a, b) => b.totalQtySold - a.totalQtySold || b.totalRevenue - a.totalRevenue);
    }

    return result.map((entry, idx) => ({
      ...entry,
      rank: idx + 1
    }));
  }, [items, invoices, invoiceDetails, visits, visitMedicines, poSalesPeriodDays, salesSortBy]);

  // Open Pop-Up Window specifically for Custom Selected Purchase Order
  const handleOpenSelectedPoPrintWindow = (mode: 'with_stock' | 'clean_po' = 'clean_po') => {
    const selectedItemsList = items.filter(itm => selectedPoItemIds.has(itm.ItemID));
    if (selectedItemsList.length === 0) {
      alert("Please select at least one medicine item to generate a Purchase Order.");
      return;
    }

    const clinicName = clinicSettings?.ClinicName || "Punjab Homeopathic Clinic";
    const printDate = new Date().toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }) + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    let totalQtySum = 0;
    let totalCostSum = 0;

    const getCustomQty = (itm: Item) => {
      return customOrderQtyMap[itm.ItemID] !== undefined
        ? customOrderQtyMap[itm.ItemID]
        : (itm.ReorderQty !== undefined && itm.ReorderQty !== null ? itm.ReorderQty : 0);
    };

    selectedItemsList.forEach(itm => {
      const q = getCustomQty(itm);
      totalQtySum += q;
      totalCostSum += q * (itm.PurchasePrice || 0);
    });

    let tableHtml = '';

    if (poPrintLayout === '3col') {
      const poRows = [];
      for (let i = 0; i < selectedItemsList.length; i += 3) {
        poRows.push([
          selectedItemsList[i],
          selectedItemsList[i + 1] || null,
          selectedItemsList[i + 2] || null
        ]);
      }

      tableHtml = `
        <table class="po-table">
          <thead>
            <tr>
              <th colspan="6" class="table-title">
                ${mode === 'clean_po' ? 'OFFICIAL PURCHASE ORDER & REQUISITION' : 'INVENTORY STOCK & PURCHASE REQUISITION REPORT'} (${selectedItemsList.length} SELECTED ITEMS)
              </th>
            </tr>
            <tr class="header-row">
              <th style="width: 23%;">MEDICINE NAME</th>
              <th style="width: 10.33%; text-align: center;">ORDER QTY</th>
              <th style="width: 23%;">MEDICINE NAME</th>
              <th style="width: 10.33%; text-align: center;">ORDER QTY</th>
              <th style="width: 23%;">MEDICINE NAME</th>
              <th style="width: 10.33%; text-align: center;">ORDER QTY</th>
            </tr>
          </thead>
          <tbody>
            ${poRows.map((row) => `
              <tr>
                <td class="col-name">${row[0]?.ItemName || ''}</td>
                <td class="col-qty">${row[0] ? `${getCustomQty(row[0])} ${row[0].Unit || ''}` : ''}</td>
                <td class="col-name">${row[1]?.ItemName || ''}</td>
                <td class="col-qty">${row[1] ? `${getCustomQty(row[1])} ${row[1].Unit || ''}` : ''}</td>
                <td class="col-name">${row[2]?.ItemName || ''}</td>
                <td class="col-qty">${row[2] ? `${getCustomQty(row[2])} ${row[2].Unit || ''}` : ''}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    } else if (mode === 'clean_po') {
      // Clean Purchase Order with Medicine Names and Required Quantity ONLY
      tableHtml = `
        <table class="po-table">
          <thead>
            <tr class="header-row">
              <th style="width: 8%; text-align: center;">S.No</th>
              <th style="width: 17%; text-align: center;">Item ID</th>
              <th style="width: 50%;">Medicine Name</th>
              <th style="width: 25%; text-align: center;">Required Quantity</th>
            </tr>
          </thead>
          <tbody>
            ${selectedItemsList.map((itm, idx) => {
              const reqQty = getCustomQty(itm);
              return `
                <tr>
                  <td style="text-align: center; font-weight: bold; color: #555;">${idx + 1}</td>
                  <td style="text-align: center; font-family: monospace; font-weight: bold;">${itm.ItemID}</td>
                  <td class="col-name" style="font-weight: bold; font-size: 12px;">${itm.ItemName}</td>
                  <td class="col-qty" style="font-weight: 900; text-align: center; font-size: 12px; color: #1e1b4b;">${reqQty} ${itm.Unit || 'Tab'}s</td>
                </tr>
              `;
            }).join('')}
            <tr style="background: #f8fafc; font-weight: bold;">
              <td colspan="3" style="text-align: right; font-weight: 900; font-size: 11px;">TOTAL REQUIRED PURCHASE REQUISITION:</td>
              <td style="text-align: center; font-weight: 900; font-size: 12px; color: #1e1b4b;">${totalQtySum} Units</td>
            </tr>
          </tbody>
        </table>
      `;
    } else {
      // Detailed Report with Current Stock & Estimated Cost
      tableHtml = `
        <table class="po-table">
          <thead>
            <tr class="header-row">
              <th style="width: 5%; text-align: center;">S.No</th>
              <th style="width: 12%; text-align: center;">Item ID</th>
              <th style="width: 35%;">Medicine Name</th>
              <th style="width: 12%; text-align: center;">Category</th>
              <th style="width: 12%; text-align: center;">Current Stock</th>
              <th style="width: 12%; text-align: center;">Order Qty</th>
              <th style="width: 12%; text-align: right;">Est. Cost</th>
            </tr>
          </thead>
          <tbody>
            ${selectedItemsList.map((itm, idx) => {
              const reqQty = getCustomQty(itm);
              const lineCost = reqQty * (itm.PurchasePrice || 0);
              return `
                <tr>
                  <td style="text-align: center; font-weight: bold; color: #555;">${idx + 1}</td>
                  <td style="text-align: center; font-family: monospace; font-weight: bold;">${itm.ItemID}</td>
                  <td class="col-name" style="font-weight: bold;">${itm.ItemName}</td>
                  <td style="text-align: center;">${itm.Unit || 'Tab'}</td>
                  <td style="text-align: center; font-family: monospace; font-weight: bold; color: ${itm.CStock <= (itm.MinStock || 10) ? '#b91c1c' : '#15803d'};">${itm.CStock}</td>
                  <td class="col-qty" style="font-weight: 900; text-align: center;">${reqQty} ${itm.Unit || 'Tab'}s</td>
                  <td style="text-align: right; font-family: monospace; font-weight: bold;">Rs. ${lineCost.toLocaleString()}</td>
                </tr>
              `;
            }).join('')}
            <tr style="background: #f8fafc; font-weight: bold;">
              <td colspan="5" style="text-align: right; font-weight: 900; font-size: 11px;">TOTAL PURCHASE REQUISITION:</td>
              <td style="text-align: center; font-weight: 900; color: #1e1b4b;">${totalQtySum} Units</td>
              <td style="text-align: right; font-weight: 900; color: #047857;">Rs. ${totalCostSum.toLocaleString()}</td>
            </tr>
          </tbody>
        </table>
      `;
    }

    const win = window.open('', '_blank', 'width=1000,height=900');
    if (!win) {
      alert("Pop-up blocker prevented opening print window. Please allow pop-ups for this site or use Direct Print.");
      return;
    }

    win.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${mode === 'clean_po' ? 'Purchase Order' : 'Inventory Stock Report'} - ${clinicName}</title>
          <style>
            @page { size: A4 portrait; margin: 10mm; }
            body { font-family: Arial, sans-serif; margin: 0; padding: 15px; color: #000; font-size: 12px; }
            .header { text-align: center; margin-bottom: 15px; border-bottom: 2px solid #000; padding-bottom: 8px; }
            .clinic-name { font-size: 18px; font-weight: 900; text-transform: uppercase; margin: 0; }
            .sub-title { font-size: 11px; margin: 3px 0; color: #444; font-weight: bold; }
            .meta-info { display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 10px; font-weight: bold; }
            .po-table { width: 100%; border-collapse: collapse; margin-top: 5px; }
            .po-table th, .po-table td { border: 1px solid #333; padding: 5px 8px; font-size: 11px; }
            .table-title { background: #1e1b4b; color: #fff; text-align: center; font-size: 12px; font-weight: 900; padding: 6px; }
            .header-row th { background: #f1f5f9; font-weight: 900; text-transform: uppercase; font-size: 10px; }
            .col-name { font-weight: bold; }
            .col-qty { text-align: center; font-weight: bold; }
            .footer { margin-top: 25px; display: flex; justify-content: space-between; font-size: 10px; padding-top: 15px; }
            .sig-line { border-top: 1px solid #000; width: 180px; text-align: center; padding-top: 4px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 class="clinic-name">${clinicName}</h1>
            <p class="sub-title">${mode === 'clean_po' ? 'OFFICIAL MEDICINE PURCHASE REQUISITION ORDER' : 'PHARMACY INVENTORY STOCK & REQUISITION REPORT'}</p>
          </div>
          <div class="meta-info">
            <span>Date: ${printDate}</span>
            <span>Order Scope: Custom Selected (${selectedItemsList.length} Items)</span>
            <span>${mode === 'clean_po' ? `Total Units: ${totalQtySum} Units` : `Est. Total: Rs. ${totalCostSum.toLocaleString()}`}</span>
          </div>
          ${tableHtml}
          <div class="footer">
            <div class="sig-line">Prepared By (Store Incharge)</div>
            <div class="sig-line">Authorized Signatory</div>
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
    `);
    win.document.close();
  };

  // Open Pop-Up Window specifically for Monthly Sales Velocity Report
  const handleOpenSalesReportPrintWindow = () => {
    const topSellingList = salesVelocityData;
    const clinicName = clinicSettings?.ClinicName || "Punjab Homeopathic Clinic";
    const printDate = new Date().toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }) + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const totalUnitsSoldSum = topSellingList.reduce((acc, cur) => acc + cur.totalQtySold, 0);
    const totalRevenueSum = topSellingList.reduce((acc, cur) => acc + cur.totalRevenue, 0);

    const win = window.open('', '_blank', 'width=1000,height=900');
    if (!win) {
      alert("Pop-up blocker prevented opening print window. Please allow pop-ups for this site.");
      return;
    }

    win.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Monthly Medicine Sales Velocity & Demand Report - ${clinicName}</title>
          <style>
            @page { size: A4 portrait; margin: 10mm; }
            body { font-family: Arial, sans-serif; margin: 0; padding: 15px; color: #000; font-size: 11px; }
            .header { text-align: center; margin-bottom: 12px; border-bottom: 2px solid #000; padding-bottom: 6px; }
            .clinic-name { font-size: 18px; font-weight: 900; text-transform: uppercase; margin: 0; }
            .sub-title { font-size: 12px; font-weight: bold; margin: 3px 0; color: #333; }
            .meta-info { display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 10px; font-weight: bold; }
            .report-table { width: 100%; border-collapse: collapse; margin-top: 5px; }
            .report-table th, .report-table td { border: 1px solid #333; padding: 5px 7px; font-size: 10.5px; }
            .header-row th { background: #0f172a; color: #fff; font-weight: 900; text-transform: uppercase; font-size: 10px; }
            .col-rank { text-align: center; font-weight: 900; }
            .col-name { font-weight: bold; }
            .col-num { text-align: center; font-family: monospace; font-weight: bold; }
            .col-rev { text-align: right; font-family: monospace; font-weight: bold; }
            .urgency-critical { background: #fef2f2; color: #991b1b; font-weight: bold; text-align: center; }
            .urgency-high { background: #fffbebf; color: #b45309; font-weight: bold; text-align: center; }
            .urgency-ok { background: #f0fdf4; color: #166534; text-align: center; }
            .summary-row { background: #f8fafc; font-weight: 900; font-size: 11px; }
            .footer { margin-top: 25px; display: flex; justify-content: space-between; font-size: 10px; padding-top: 15px; }
            .sig-line { border-top: 1px solid #000; width: 180px; text-align: center; padding-top: 4px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 class="clinic-name">${clinicName}</h1>
            <p class="sub-title">MONTHLY MEDICINE SALES VELOCITY & DEMAND ANALYTICS REPORT</p>
            <p style="font-size: 10px; color: #555; margin: 2px 0;">Analysis Period: ${poSalesPeriodDays > 0 ? `${poSalesPeriodDays} Days` : 'All Time'} | Generated: ${printDate}</p>
          </div>
          <div class="meta-info">
            <span>Total Medicines Analyzed: ${topSellingList.length}</span>
            <span>Total Units Sold: ${totalUnitsSoldSum.toLocaleString()}</span>
            <span>Total Sales Revenue: Rs. ${totalRevenueSum.toLocaleString()}</span>
          </div>
          <table class="report-table">
            <thead>
              <tr class="header-row">
                <th style="width: 6%;">Rank</th>
                <th style="width: 10%;">Item ID</th>
                <th style="width: 32%;">Medicine Name</th>
                <th style="width: 12%;">Category</th>
                <th style="width: 10%;">Units Sold</th>
                <th style="width: 12%;">Revenue (PKR)</th>
                <th style="width: 8%;">Stock</th>
                <th style="width: 10%;">Demand Status</th>
              </tr>
            </thead>
            <tbody>
              ${topSellingList.map(row => {
                const uClass = row.urgency === 'CRITICAL' ? 'urgency-critical' : row.urgency === 'HIGH' ? 'urgency-high' : 'urgency-ok';
                const statusText = row.urgency === 'CRITICAL' ? '🚨 Reorder Critical' : row.urgency === 'HIGH' ? '⚠️ Low Stock' : row.totalQtySold >= 10 ? '🔥 Fast Mover' : '🟢 Sufficient';
                return `
                  <tr>
                    <td class="col-rank">#${row.rank}</td>
                    <td class="col-num">${row.item.ItemID}</td>
                    <td class="col-name">${row.item.ItemName}</td>
                    <td style="text-align: center;">${row.item.Unit || 'Tab'}</td>
                    <td class="col-num" style="color: #1e1b4b;">${row.totalQtySold}</td>
                    <td class="col-rev">Rs. ${row.totalRevenue.toLocaleString()}</td>
                    <td class="col-num" style="color: ${row.isLowStock ? '#b91c1c' : '#15803d'};">${row.item.CStock}</td>
                    <td class="${uClass}">${statusText}</td>
                  </tr>
                `;
              }).join('')}
              <tr class="summary-row">
                <td colspan="4" style="text-align: right; font-weight: 900;">TOTAL MONTHLY DEMAND METRICS:</td>
                <td class="col-num" style="font-weight: 900; color: #1e1b4b;">${totalUnitsSoldSum.toLocaleString()}</td>
                <td class="col-rev" style="font-weight: 900; color: #047857;">Rs. ${totalRevenueSum.toLocaleString()}</td>
                <td colspan="2"></td>
              </tr>
            </tbody>
          </table>
          <div class="footer">
            <div class="sig-line">Pharmacist / Inventory Auditor</div>
            <div class="sig-line">Managing Director Approval</div>
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
    `);
    win.document.close();
  };

  // Helper to convert number to words for formal A4 invoices
  const convertNumberToWords = (amount: number): string => {
    if (amount <= 0) return 'Zero Rupees Only';
    const units = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    const numToWordsLessThanThousand = (n: number): string => {
      let str = '';
      if (n >= 100) {
        str += units[Math.floor(n / 100)] + ' Hundred ';
        n %= 100;
      }
      if (n >= 20) {
        str += tens[Math.floor(n / 10)] + ' ';
        n %= 10;
      }
      if (n > 0) {
        str += units[n] + ' ';
      }
      return str.trim();
    };

    let num = Math.floor(amount);
    let words = '';

    if (num >= 10000000) {
      words += numToWordsLessThanThousand(Math.floor(num / 10000000)) + ' Crore ';
      num %= 10000000;
    }
    if (num >= 100000) {
      words += numToWordsLessThanThousand(Math.floor(num / 100000)) + ' Lakh ';
      num %= 100000;
    }
    if (num >= 1000) {
      words += numToWordsLessThanThousand(Math.floor(num / 1000)) + ' Thousand ';
      num %= 1000;
    }
    if (num > 0) {
      words += numToWordsLessThanThousand(num) + ' ';
    }

    return 'Rupees ' + words.trim() + ' Only';
  };

  // Rights verification & permissions
  const currentRight = userRights.find((r) => r.MenuID === 'pharmacy') || userRights.find((r) => r.MenuID === 'pos') || userRights[0];
  const canAdd = currentRight ? currentRight.AddRec : true;
  const canEdit = currentRight ? currentRight.AddRec : true;
  const canDelete = currentRight ? currentRight.CancelPosted : true;
  const canPost = currentRight ? currentRight.PostRec : true;
  const canAddStock = canAdd;
  const canEditStock = canEdit && (currentUser?.Permissions?.canEditStockLevel !== false);
  const canCancelStock = canDelete;
  const canViewStock = currentRight ? currentRight.Status : true;

  // Patient directory with visit archives included
  const allKnownPatients = useMemo(() => {
    const map = new Map<string, Patient>();
    (patients || []).forEach(p => {
      if (p && p.PatientID) map.set(p.PatientID, p);
    });
    (visits || []).forEach(v => {
      if (v.PatientID && !map.has(v.PatientID)) {
        map.set(v.PatientID, {
          PatientID: v.PatientID,
          PatientName: `Patient (${v.PatientID})`,
          Father_husband: '',
          AgeYears: 0,
          Sex: 'Male',
          MaritalStatus: 'Single',
          Occupation: '',
          Address: '',
          CityID: 1,
          Country: 'Pakistan',
          PhoneMobile: '',
          RegistrationDate: v.VisitDate || new Date().toISOString().split('T')[0]
        });
      }
    });
    return Array.from(map.values());
  }, [patients, visits]);

  // History & Sales Report Period Filter state
  const todayStr = new Date().toISOString().split('T')[0];
  const [salesReportPeriodMode, setSalesReportPeriodMode] = useState<'daily' | 'range' | 'all'>('daily');
  const [salesReportStartDate, setSalesReportStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().split('T')[0];
  });
  const [salesReportEndDate, setSalesReportEndDate] = useState<string>(todayStr);
  const [selectedShiftFilter, setSelectedShiftFilter] = useState<'all' | '1' | '2'>('all');
  const [showAllInvoicesInHistory, setShowAllInvoicesInHistory] = useState(false);
  const [searchHistoryQuery, setSearchHistoryQuery] = useState('');

  const isAdministrator = currentUser?.Role === 'Administrator' ||
    currentUser?.Role?.toLowerCase() === 'admin' ||
    currentUser?.Role?.toLowerCase() === 'administrator' ||
    currentUser?.LoginName?.toLowerCase() === 'admin';

  useEffect(() => {
    if (!isAdministrator && (salesReportPeriodMode === 'range' || salesReportPeriodMode === 'all' || showAllInvoicesInHistory)) {
      setSalesReportPeriodMode('daily');
      setShowAllInvoicesInHistory(false);
      setSelectedDailyReportDate(todayStr);
    }
  }, [isAdministrator, salesReportPeriodMode, showAllInvoicesInHistory, todayStr]);

  // Checkout billing & discount state
  const [discountInput, setDiscountInput] = useState<number>(0);
  const [billingShift, setBillingShift] = useState<'1' | '2'>('1');

  // Store sales discount & patient state
  const [storePatientId, setStorePatientId] = useState<string>('');
  const [storeDiscountInput, setStoreDiscountInput] = useState<number | string>('');
  const [storeDiscountPercent, setStoreDiscountPercent] = useState<number | null>(0);
  const [storeShift, setStoreShift] = useState<'1' | '2'>('1');

  const handleOpenInvoicePrintModal = (inv: InvoiceHeader, details: InvoiceDetail[], format: 'a4' | 'thermal' = 'thermal') => {
    const pat = allKnownPatients.find((p) => p.PatientID === inv.PatientID) || null;
    const itemsInInv = details.filter(d => d.InvoiceNo === inv.InvoiceNo).map(d => ({
      ItemID: d.ItemID,
      Qty: d.Qty,
      Price: d.Price,
      MedicineType: d.MedicineType as any
    }));
    setPrintBillData({
      patient: pat,
      basket: itemsInInv,
      discount: Number(inv.Discount) || 0,
      netAmount: Number(inv.NetAmount) || 0,
      shift: (inv.shift as any) || 1,
      invoiceNo: inv.InvoiceNo,
      invoiceDate: inv.InvoiceDate || todayStr
    });
    setPrintModalFormat(format);
    setPrintModalOpen(true);
  };

  const {
    handlePrintA4Invoice,
    handlePrintThermalReceipt,
    handlePrintDailySalesReport,
    handlePrintStockGrid,
    handleOpenPoPrintWindow,
    handlePrintDeadStockReport,
    handlePrintCurrentStockReport,
    handlePrintReorderQtyReport,
    handlePrintMinThresholdReport
  } = createPharmacyPrintHelpers({
    currentUser,
    userRights,
    clinicSettings,
    items,
    invoices,
    invoiceDetails,
    patients: allKnownPatients,
    selectedDailyReportDate,
    salesReportPeriodMode,
    salesReportStartDate,
    salesReportEndDate,
    todayStr,
    invLowStockFilter,
    invCategoryFilter,
    invSearchQuery,
    poCategoryFilter,
    poOnlyLowStock,
    poPrintLayout,
    getFilteredPoItems
  });
  const [isCustomReportsModalOpen, setIsCustomReportsModalOpen] = useState(false);
  const [storeBasket, setStoreBasket] = useState<{ ItemID: string; Qty: number; Price: number; MedicineType?: 'C' | 'P' | 'S' }[]>([]);
  const [storeRowItemId, setStoreRowItemId] = useState('');
  const [storeRowQty, setStoreRowQty] = useState<number>(1);
  const [storeRowPrice, setStoreRowPrice] = useState<number | string>('');
  const [storeSearchQuery, setStoreSearchQuery] = useState('');
  const [storeSearchDropdownOpen, setStoreSearchDropdownOpen] = useState(false);
  const [storeValidationError, setStoreValidationError] = useState('');
  const [storeSuccessMsg, setStoreSuccessMsg] = useState('');
  
  // Basket list of checkout items
  const [checkoutBasket, setCheckoutBasket] = useState<{ ItemID: string; Qty: number; Price: number; MedicineType?: 'C' | 'P' | 'S' }[]>([]);
  // Row scratchpad inputs
  const [rowItemId, setRowItemId] = useState('');
  const [rowQty, setRowQty] = useState<number>(1);
  const [posSearchQuery, setPosSearchQuery] = useState('');
  const [posSearchDropdownOpen, setPosSearchDropdownOpen] = useState(false);
  const [stockValidationError, setStockValidationError] = useState('');

  const processScannedCode = useCallback(
    (rawCode: string) => {
      const trimmed = rawCode.trim();
      if (!trimmed) return;

      const parsed = parseScannedItemQR(trimmed);
      const searchId = parsed.itemId.toLowerCase();
      const searchName = parsed.itemName.toLowerCase();

      // Find item in inventory by VendorBarcode, ItemID, or ItemName
      const matched = items.find((i) => {
        const iId = i.ItemID.toLowerCase().trim();
        const iName = i.ItemName.toLowerCase().trim();
        const iBarcode = (i.VendorBarcode || '').toLowerCase().trim();
        const searchCode = trimmed.toLowerCase();

        return (
          (iBarcode && iBarcode === searchCode) ||
          iId === searchId ||
          iId === searchCode ||
          iName === searchName ||
          (searchName && iName.includes(searchName))
        );
      });

      if (!matched) {
        playBeepSound('error');
        setScanToastMsg({
          text: `No medicine item matched scanned barcode/QR: "${trimmed}"`,
          type: 'error'
        });
        return;
      }

      // Record visual indicator for successful barcode mapping
      const matchType = (matched.VendorBarcode && matched.VendorBarcode.toLowerCase().trim() === trimmed.toLowerCase())
        ? 'Vendor Barcode'
        : (matched.ItemID.toLowerCase().trim() === trimmed.toLowerCase())
        ? 'Item ID'
        : 'Item Name / QR';

      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      
      const statusLabel = autoAddOnScan
        ? (activeSubTab === 'store_sales' || activeSubTab === 'checkout' ? 'Auto-Added to Basket' : 'Selected')
        : 'Selected in Dropdown';

      setLastMappedScan({
        barcode: trimmed,
        itemId: matched.ItemID,
        itemName: matched.ItemName,
        price: parsed.mrp || matched.Price || 0,
        stock: matched.CStock || 0,
        time: timeStr,
        matchedBy: matchType,
        status: statusLabel,
        batchNo: parsed.batchNo || matched.BatchNo,
        mfgDate: parsed.mfgDate || matched.MfgDate,
        expDate: parsed.expDate || matched.ExpDate,
        mrp: parsed.mrp || matched.Price
      });

      // Matched Item handling
      if (autoAddOnScan) {
        if (activeSubTab === 'store_sales') {
          const isDead = Boolean(matched.IsDead || matched.Status === 'Dead' || matched.Status === 'DEAD');
          if (isDead) {
            playBeepSound('error');
            setScanToastMsg({
              text: `Cannot sell dead/obsolete item: "${matched.ItemName}" (${matched.ItemID})`,
              type: 'error'
            });
            return;
          }

          const existingBasketQty = storeBasket.find((b) => b.ItemID === matched.ItemID)?.Qty || 0;
          if (existingBasketQty + 1 > matched.CStock) {
            playBeepSound('error');
            setScanToastMsg({
              text: `Insufficient stock for ${matched.ItemName} (Current Stock: ${matched.CStock})`,
              type: 'error'
            });
            return;
          }

          playBeepSound('success');
          const existsIndex = storeBasket.findIndex((b) => b.ItemID === matched.ItemID);
          if (existsIndex >= 0) {
            const updated = [...storeBasket];
            updated[existsIndex].Qty += 1;
            setStoreBasket(updated);
          } else {
            setStoreBasket([
              ...storeBasket,
              { ItemID: matched.ItemID, Qty: 1, Price: matched.Price, MedicineType: matched.MedicineType || 'P' }
            ]);
          }

          setScanToastMsg({
            text: `⚡ Auto-Added 1x "${matched.ItemName}" (Rs. ${matched.Price}) to Store Sales Basket!`,
            type: 'success'
          });
        } else if (activeSubTab === 'checkout') {
          const existingBasketQty = checkoutBasket.find((b) => b.ItemID === matched.ItemID)?.Qty || 0;
          if (existingBasketQty + 1 > matched.CStock) {
            playBeepSound('error');
            setScanToastMsg({
              text: `Insufficient stock for ${matched.ItemName} (Current Stock: ${matched.CStock})`,
              type: 'error'
            });
            return;
          }

          playBeepSound('success');
          const existsIndex = checkoutBasket.findIndex((b) => b.ItemID === matched.ItemID);
          const itemPrice = matched.MedicineType === 'C' ? 0 : matched.Price;
          if (existsIndex >= 0) {
            const updated = [...checkoutBasket];
            updated[existsIndex].Qty += 1;
            updated[existsIndex].Price = itemPrice;
            setCheckoutBasket(updated);
          } else {
            setCheckoutBasket([
              ...checkoutBasket,
              { ItemID: matched.ItemID, Qty: 1, Price: itemPrice, MedicineType: matched.MedicineType || 'S' }
            ]);
          }

          setScanToastMsg({
            text: `⚡ Auto-Added 1x "${matched.ItemName}" to Invoice Basket!`,
            type: 'success'
          });
        } else if (activeSubTab === 'inventory_manager') {
          playBeepSound('success');
          setInvSearchQuery(matched.ItemID);
          setScanToastMsg({
            text: `🔍 Loaded Item: ${matched.ItemName} (ID: ${matched.ItemID})`,
            type: 'info'
          });
        } else if (activeSubTab === 'grn') {
          playBeepSound('success');
          setGrnRowItemId(matched.ItemID);
          setScanToastMsg({
            text: `📦 Selected for GRN: ${matched.ItemName}`,
            type: 'info'
          });
        }
      } else {
        // Search & select mode
        if (activeSubTab === 'store_sales') {
          const isDead = Boolean(matched.IsDead || matched.Status === 'Dead' || matched.Status === 'DEAD');
          if (isDead) {
            playBeepSound('error');
            setScanToastMsg({
              text: `Dead/obsolete stock cannot be selected for store sale: "${matched.ItemName}"`,
              type: 'error'
            });
            return;
          }
          playBeepSound('success');
          setStoreRowItemId(matched.ItemID);
          setStoreSearchQuery(matched.ItemName);
        } else {
          playBeepSound('success');
          if (activeSubTab === 'checkout') {
            setRowItemId(matched.ItemID);
            setPosSearchQuery(matched.ItemName);
          } else if (activeSubTab === 'inventory_manager') {
            setInvSearchQuery(matched.ItemID);
          }
          setScanToastMsg({
            text: `🎯 Selected Item: ${matched.ItemName} (ID: ${matched.ItemID})`,
            type: 'info'
          });
        }
      }
    },
    [items, activeSubTab, autoAddOnScan, storeBasket, checkoutBasket]
  );

  const handleQuickScannerKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      processScannedCode(quickScannerInput);
      setQuickScannerInput('');
    }
  };

  const handleQRScanResult = (parsed: ParsedQRResult) => {
    const scannedCode = parsed.rawText || parsed.itemId;
    if (isAddMedicineModalOpen) {
      setItemFormVendorBarcode(scannedCode);
      if (parsed.batchNo) setItemFormBatchNo(parsed.batchNo);
      if (parsed.mfgDate) setItemFormMfgDate(parsed.mfgDate);
      if (parsed.expDate) setItemFormExpDate(parsed.expDate);
      if (parsed.mrp) setItemFormRetailPrice(parsed.mrp);
      if (parsed.itemName && !itemFormName) setItemFormName(parsed.itemName);

      playBeepSound('success');
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setLastMappedScan({
        barcode: scannedCode,
        itemId: itemFormId || parsed.itemId || 'FORM-FIELD',
        itemName: itemFormName || parsed.itemName || 'New Medicine Item',
        price: parsed.mrp || Number(itemFormRetailPrice) || 0,
        stock: Number(itemFormCStock) || 0,
        time: timeStr,
        matchedBy: 'Vendor QR Scanner',
        status: 'Mapped to Item Form',
        batchNo: parsed.batchNo,
        mfgDate: parsed.mfgDate,
        expDate: parsed.expDate,
        mrp: parsed.mrp
      });
      setScanToastMsg({
        text: `🔗 Scanned & Mapped QR Metadata (Batch: ${parsed.batchNo || 'N/A'}, Mfg: ${parsed.mfgDate || 'N/A'}, Exp: ${parsed.expDate || 'N/A'}, MRP: ${parsed.mrp ? 'PKR ' + parsed.mrp : 'N/A'}) to form!`,
        type: 'success'
      });
      setIsQRScannerOpen(false);
      return;
    }
    processScannedCode(scannedCode);
    setIsQRScannerOpen(false);
  };

  // Compounding Formula Wizard State (for Clinical medicine type 'C')
  const [compoundingDose, setCompoundingDose] = useState<number>(1);
  const [compoundingDays, setCompoundingDays] = useState<number>(30);
  const [compoundingInstructions, setCompoundingInstructions] = useState<string>('Daily 1 after meal');

  // Helper to fetch the Token No of a patient
  const getPatientTokenNo = (patientId: string) => {
    // 1. Look for the token associated with this patient's latest visit
    const latestV = visits.slice().reverse().find((v) => v.PatientID === patientId);
    if (latestV?.TokenNo) {
      return latestV.TokenNo;
    }
    
    // 2. Look for the visited token in tokens list
    const token = tokens.slice().reverse().find((t) => t.PatientID === patientId && t.Status === 2);
    if (token) {
      return token.TokenNo;
    }

    // 3. Look for any active token
    const anyToken = tokens.slice().reverse().find((t) => t.PatientID === patientId);
    if (anyToken) {
      return anyToken.TokenNo;
    }

    return null;
  };

  // Filter patients: show only patients checked by Doctor
  const checkedPatients = patients.filter((p) => {
    const hasVisit = visits.some((v) => v.PatientID === p.PatientID);
    const hasVisitedAppt = appointments.some((a) => a.PatientID === p.PatientID && a.Status === 2);
    const hasVisitedToken = tokens.some((t) => t.PatientID === p.PatientID && t.Status === 2);
    // Exclude if pharmacy bill is posted (Status === 2)
    const hasPostedBill = invoices.some((inv) => inv.PatientID === p.PatientID && inv.Status === 2);
    return (hasVisit || hasVisitedAppt || hasVisitedToken) && !hasPostedBill;
  });

  // Helper to extract prescribed medicines from visitMedicines or fallback to visit.VisitRemarks text
  const getVisitMedicinesList = (v: Visit | null): VisitMedicine[] => {
    if (!v) return [];
    
    // 1. Direct match in visitMedicines state
    const directMeds = visitMedicines.filter((vm) => vm.VisitID === v.VisitID);

    // 2. Fallback: Parse VisitRemarks if available
    const parsedMeds: VisitMedicine[] = [];
    if (v.VisitRemarks) {
      const rem = v.VisitRemarks;
      
      // Parse Clinical
      if (rem.includes('Clinical:')) {
        const cMatch = rem.match(/Clinical:\s*([^|]+)/);
        if (cMatch && cMatch[1].trim() && !['None', 'undefined', 'None prescribed', 'N/A', '0'].includes(cMatch[1].trim())) {
          let cText = cMatch[1].trim();
          let expDate = '';
          const expMatch = cText.match(/\(EXP:\s*([^)]+)\)/);
          if (expMatch) {
            expDate = expMatch[1].trim();
            cText = cText.replace(/\(EXP:\s*([^)]+)\)/, '').trim();
          }
          const lines = cText.split(/\n/).map(l => l.trim()).filter(Boolean);
          lines.forEach((line, idx) => {
            parsedMeds.push({
              VisitID: v.VisitID,
              ItemID: `CLIN-${idx + 1}`,
              MedicineType: 'C',
              MedicineDetail: line,
              Dosage: line,
              Qty: 1,
              ExpireDate: expDate
            });
          });
        }
      }

      // Parse Patent
      if (rem.includes('Patent:')) {
        const pMatch = rem.match(/Patent:\s*([^|]+)/);
        if (pMatch && pMatch[1].trim() && !['None', 'undefined', 'None prescribed', 'N/A', '0'].includes(pMatch[1].trim())) {
          const pText = pMatch[1].trim();
          const lines = pText.split(/\n/).map(l => l.trim()).filter(Boolean);
          lines.forEach((line, idx) => {
            parsedMeds.push({
              VisitID: v.VisitID,
              ItemID: `PAT-${idx + 1}`,
              MedicineType: 'P',
              MedicineDetail: line,
              Dosage: line,
              Qty: 1
            });
          });
        }
      }

      // Fallback for plain text remark without explicit "Clinical:" / "Patent:" markers
      if (!rem.includes('Clinical:') && !rem.includes('Patent:') && rem.trim() && !rem.includes('OPD clinical desk consultation') && !rem.includes('Archived NHC Clinical History')) {
        parsedMeds.push({
          VisitID: v.VisitID,
          ItemID: `MED-1`,
          MedicineType: 'C',
          MedicineDetail: rem.trim(),
          Dosage: rem.trim(),
          Qty: 1
        });
      }
    }

    if (directMeds.length > 0) {
      return directMeds;
    }

    return parsedMeds;
  };

  const handleCleanLabelPrint = (presetSize: '4x8' | '8x5' | '4x3' | '2x4' | '2x0.2' = '2x0.2') => {
    if (currentUser?.Role !== 'Administrator' && (currentUser?.Permissions?.canPrintPOSInvoice === false || userRights.find(r => r.MenuID === 'pharmacy')?.PrintRec === false)) {
      alert("Printing Clinical Label Stickers is restricted by administrator permissions.");
      return;
    }
    const elem = document.getElementById('sticker-print-container');
    if (!elem) {
      window.print();
      return;
    }

    const parentStyles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
      .map(el => el.outerHTML)
      .join('\n');

    const printHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Clinical Medicine Label Print (2" x 0.2" - 2x2 Grid on A4)</title>
          ${parentStyles}
          <style>
            @page {
              size: A4 portrait;
              margin: 10mm;
            }
            * {
              box-sizing: border-box;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            body {
              margin: 0;
              padding: 10mm;
              background: white;
              color: #000;
              font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
              font-size: 8.5px;
              line-height: 1.15;
            }
            .label-grid-page {
              display: grid;
              grid-template-columns: 2in 2in;
              column-gap: 2in;
              row-gap: 0.25in;
              page-break-inside: avoid;
              page-break-after: always;
              margin-bottom: 10mm;
            }
            .label-grid-page:last-child {
              page-break-after: avoid;
              margin-bottom: 0;
            }
            .label-sticker-page {
              width: 2in;
              min-height: 0.2in;
              max-width: 2in;
              box-sizing: border-box;
              border: 1px dashed #475569;
              border-radius: 3px;
              padding: 2px 4px;
              font-size: 8.5px;
              line-height: 1.15;
              background: #fff;
              color: #000;
            }
          </style>
        </head>
        <body>
          <div>
            ${elem.innerHTML}
          </div>
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.focus();
                window.print();
              }, 250);
            };
          </script>
        </body>
      </html>
    `;

    const printWin = window.open('', '_blank', 'width=750,height=850');
    if (printWin) {
      printWin.document.open();
      printWin.document.write(printHtml);
      printWin.document.close();
    } else {
      let printIframe = document.getElementById('label-print-hidden-iframe') as HTMLIFrameElement | null;
      if (!printIframe) {
        printIframe = document.createElement('iframe');
        printIframe.id = 'label-print-hidden-iframe';
        printIframe.style.position = 'fixed';
        printIframe.style.right = '0';
        printIframe.style.bottom = '0';
        printIframe.style.width = '0';
        printIframe.style.height = '0';
        printIframe.style.border = '0';
        document.body.appendChild(printIframe);
      }
      const iframeDoc = printIframe.contentDocument || printIframe.contentWindow?.document;
      if (iframeDoc) {
        iframeDoc.open();
        iframeDoc.write(printHtml);
        iframeDoc.close();
        setTimeout(() => {
          printIframe?.contentWindow?.focus();
          printIframe?.contentWindow?.print();
        }, 350);
      } else {
        window.print();
      }
    }
  };

  // Load the prescribed medicines for the selected patient
  const selectedPatientVisits = visits
    .filter((v) => v.PatientID === selectedPatientId)
    .sort((a, b) => {
      if (a.VisitDate !== b.VisitDate) {
        return a.VisitDate.localeCompare(b.VisitDate);
      }
      return a.VisitID.localeCompare(b.VisitID);
    });
  const latestVisit = selectedPatientVisits.length > 0 ? selectedPatientVisits[selectedPatientVisits.length - 1] : null;
  const prescribedMedicinesList = getVisitMedicinesList(latestVisit);

  // Add individual prescribed item to the basket
  const handleAddPrescribedToBasket = (prescription: VisitMedicine) => {
    const selectedItem = items.find((i) => i.ItemID === prescription.ItemID);
    if (!selectedItem) {
      const isCustom = prescription.ItemID === 'CUSTOM' || prescription.ItemID.startsWith('CLIN') || prescription.ItemID.startsWith('PAT') || prescription.MedicineType === 'C';
      if (isCustom) {
        const qtyToAdd = prescription.Qty || 1;
        const existsIndex = checkoutBasket.findIndex(
          (b) => b.ItemID === prescription.ItemID || b.ItemName === prescription.MedicineDetail
        );
        if (existsIndex >= 0) {
          const updated = [...checkoutBasket];
          updated[existsIndex].Qty += qtyToAdd;
          setCheckoutBasket(updated);
        } else {
          setCheckoutBasket([
            ...checkoutBasket,
            {
              ItemID: prescription.ItemID,
              Qty: qtyToAdd,
              Price: 0, // Since it is 'C' Clinical, rate is 0
              MedicineType: prescription.MedicineType || 'C',
              ItemName: prescription.MedicineDetail
            }
          ]);
        }
        return;
      }
      alert(`Medicine ID ${prescription.ItemID} not found in the inventory system.`);
      return;
    }

    // Verify stock
    const existingBasketQty = checkoutBasket.find((b) => b.ItemID === prescription.ItemID)?.Qty || 0;
    const qtyToAdd = prescription.MedicineType === 'C' && prescription.Qty ? prescription.Qty : 1; // Default: dispense prescribed Qty or 1 unit
    const totalRequired = existingBasketQty + qtyToAdd;

    if (totalRequired > selectedItem.CStock) {
      setStockValidationError(
        `Critical Alert: Insufficient stock for ${selectedItem.ItemName}. Current stock is only ${selectedItem.CStock} ${selectedItem.Unit}s.`
      );
      return;
    }

    setStockValidationError('');

    const existsIndex = checkoutBasket.findIndex((b) => b.ItemID === prescription.ItemID);
    const itemPrice = (selectedItem.MedicineType === 'C' || prescription.MedicineType === 'C') ? 0 : selectedItem.Price;
    if (existsIndex >= 0) {
      const updated = [...checkoutBasket];
      updated[existsIndex].Qty += qtyToAdd;
      updated[existsIndex].Price = itemPrice;
      setCheckoutBasket(updated);
    } else {
      setCheckoutBasket([
        ...checkoutBasket,
        { ItemID: prescription.ItemID, Qty: qtyToAdd, Price: itemPrice, MedicineType: prescription.MedicineType || selectedItem.MedicineType || 'S' }
      ]);
    }
  };

  // Add all prescribed items to basket at once
  const handleAddAllPrescribedToBasket = (prescribedList: VisitMedicine[]) => {
    const newBasketItems = [...checkoutBasket];
    let errors: string[] = [];

    prescribedList.forEach((prescription) => {
      const selectedItem = items.find((i) => i.ItemID === prescription.ItemID);
      if (!selectedItem) {
        const isCustom = prescription.ItemID === 'CUSTOM' || prescription.MedicineType === 'C';
        if (isCustom) {
          const qtyToAdd = prescription.Qty || 1;
          const existsIndex = newBasketItems.findIndex(
            (b) => b.ItemID === prescription.ItemID && b.ItemName === prescription.MedicineDetail
          );
          if (existsIndex >= 0) {
            newBasketItems[existsIndex].Qty += qtyToAdd;
          } else {
            newBasketItems.push({
              ItemID: prescription.ItemID,
              Qty: qtyToAdd,
              Price: 0, // Since it is 'C' Clinical, rate is 0
              MedicineType: prescription.MedicineType || 'C',
              ItemName: prescription.MedicineDetail
            });
          }
        }
        return;
      }

      const existingBasketQty = newBasketItems.find((b) => b.ItemID === prescription.ItemID)?.Qty || 0;
      const qtyToAdd = prescription.MedicineType === 'C' && prescription.Qty ? prescription.Qty : 1;
      const totalRequired = existingBasketQty + qtyToAdd;

      if (totalRequired > selectedItem.CStock) {
        errors.push(selectedItem.ItemName);
        return;
      }

      const existsIndex = newBasketItems.findIndex((b) => b.ItemID === prescription.ItemID);
      const itemPrice = (selectedItem.MedicineType === 'C' || prescription.MedicineType === 'C') ? 0 : selectedItem.Price;
      if (existsIndex >= 0) {
        newBasketItems[existsIndex].Qty += qtyToAdd;
        newBasketItems[existsIndex].Price = itemPrice;
      } else {
        newBasketItems.push({
          ItemID: prescription.ItemID,
          Qty: qtyToAdd,
          Price: itemPrice,
          MedicineType: prescription.MedicineType || selectedItem.MedicineType || 'S'
        });
      }
    });

    setCheckoutBasket(newBasketItems);

    if (errors.length > 0) {
      setStockValidationError(
        `Stock warning: Could not add [${errors.join(', ')}] to ticket due to insufficient inventory.`
      );
    } else {
      setStockValidationError('');
    }
  };

  // Sales Returns Form
  const [lookupInvoiceNo, setLookupInvoiceNo] = useState('');
  const [matchedInvoice, setMatchedInvoice] = useState<InvoiceHeader | null>(null);
  const [returnBasket, setReturnBasket] = useState<{ ItemID: string; QtyReturned: number; PriceRef: number }[]>([]);
  const [returnRemarks, setReturnRemarks] = useState('');
  const [returnSuccess, setReturnSuccess] = useState('');

  // Supplier GRN Inward Form
  const [grnSupplierId, setGrnSupplierId] = useState('');
  const [grnRemarks, setGrnRemarks] = useState('');
  const [grnBasket, setGrnBasket] = useState<{ ItemID: string; QtyIn: number; PurchaseRate: number }[]>([]);
  // Row scratchpad inputs for GRN
  const [grnRowItemId, setGrnRowItemId] = useState('');
  const [grnRowQty, setGrnRowQty] = useState<number>(100);
  const [grnRowPrice, setGrnRowPrice] = useState<number>(10);
  const [grnSuccessMsg, setGrnSuccessMsg] = useState('');
  const [editingGrn, setEditingGrn] = useState<InvVchHeader | null>(null);
  const [grnRightTab, setGrnRightTab] = useState<'suppliers' | 'grn_history'>('suppliers');

  // Active View Checkout Invoice (for print or success simulation)
  const [activeInvoiceLookupId, setActiveInvoiceLookupId] = useState('');
  const [billingSuccess, setBillingSuccess] = useState('');

  // Grid checkout calculations
  const calculateTotals = () => {
    const gAmount = checkoutBasket.reduce((sum, item) => sum + item.Qty * item.Price, 0);
    const netAmount = Math.max(0, gAmount - discountInput);
    return { gAmount, netAmount };
  };

  const { gAmount, netAmount } = calculateTotals();

  // Handle adding product to POS checkout basket
  const handleAddToBasket = () => {
    if (!rowItemId) return;
    const selectedItem = items.find((i) => i.ItemID === rowItemId);
    if (!selectedItem) return;

    // Check Stock validation!
    const existingBasketQty = checkoutBasket.find((b) => b.ItemID === rowItemId)?.Qty || 0;
    const totalRequired = existingBasketQty + rowQty;

    if (totalRequired > selectedItem.CStock) {
      setStockValidationError(
        `Critical Alert: Insufficient stock for ${selectedItem.ItemName}. Current stock is only ${selectedItem.CStock} ${selectedItem.Unit}s.`
      );
      return;
    }

    setStockValidationError('');

    const existsIndex = checkoutBasket.findIndex((b) => b.ItemID === rowItemId);
    const itemPrice = selectedItem.MedicineType === 'C' ? 0 : selectedItem.Price;
    if (existsIndex >= 0) {
      const updated = [...checkoutBasket];
      updated[existsIndex].Qty += rowQty;
      updated[existsIndex].Price = itemPrice;
      setCheckoutBasket(updated);
    } else {
      setCheckoutBasket([
        ...checkoutBasket,
        { ItemID: rowItemId, Qty: rowQty, Price: itemPrice, MedicineType: selectedItem.MedicineType || 'S' }
      ]);
    }

    // Reset scratchpad
    setRowItemId('');
    setRowQty(1);
    setPosSearchQuery('');
    setPosSearchDropdownOpen(false);
    setCompoundingDose(1);
    setCompoundingDays(30);
    setCompoundingInstructions('Daily 1 after meal');
  };

  const handleRemoveFromBasket = (itemId: string) => {
    setCheckoutBasket(checkoutBasket.filter((b) => b.ItemID !== itemId));
  };

  // Checkout and finalize invoice posting
  const handleCheckoutInvoice = (postRecord: boolean) => {
    if (checkoutBasket.length === 0) {
      alert('Checkout basket is empty.');
      return;
    }
    if (postRecord && !canPost) {
      alert('Unauthorized: Your role does not possess GL Posting rights (PostRec).');
      return;
    }

    const nextInvoiceNo = `INV-PH-${String(invoices.length + 1).padStart(4, '0')}`;
    const effectivePatientId = selectedPatientId || 'CLINICAL-WALKIN';
    
    // Validate stock one final time before database entry
    for (const basketItem of checkoutBasket) {
      const dbItem = items.find((itm) => itm.ItemID === basketItem.ItemID);
      if (!dbItem || dbItem.CStock < basketItem.Qty) {
        alert(`Stock validation failed for ${dbItem ? dbItem.ItemName : basketItem.ItemID}. Aborting checkout.`);
        return;
      }
    }

    const newHeader: InvoiceHeader = {
      InvoiceNo: nextInvoiceNo,
      PatientID: effectivePatientId,
      InvoiceDate: new Date().toISOString().split('T')[0],
      GAmount: gAmount,
      Discount: discountInput,
      NetAmount: netAmount,
      shift: billingShift,
      Status: postRecord ? 2 : 1 // 1=New, 2=Posted
    };

    const newDetails: InvoiceDetail[] = checkoutBasket.map((b) => ({
      InvoiceNo: nextInvoiceNo,
      ItemID: b.ItemID,
      Qty: b.Qty,
      Price: b.Price,
      LineTotal: b.Qty * b.Price,
      MedicineType: b.MedicineType || 'S'
    }));

    // Trigger state change
    onAddInvoice(newHeader, newDetails);
    
    setBillingSuccess(`Clinical Dispense Invoice ${nextInvoiceNo} completed successfully!`);
    
    // Set print bill data first so they can print immediately!
    const billDataObj = {
      patient: patients.find(p => p.PatientID === effectivePatientId) || null,
      basket: [...checkoutBasket],
      discount: discountInput,
      netAmount: netAmount,
      shift: billingShift,
      invoiceNo: nextInvoiceNo,
      invoiceDate: newHeader.InvoiceDate
    };
    setPrintBillData(billDataObj);
    setLastPostedInvoiceData(billDataObj);
    setPrintModalFormat('thermal');
    setPrintModalOpen(true);

    // Reset forms
    setCheckoutBasket([]);
    setDiscountInput(0);
    setSelectedPatientId('');

    setTimeout(() => setBillingSuccess(''), 6000);
  };

  // Store Patent Medicine Sales (Store Sales) Helpers & Actions
  const calculateStoreTotals = () => {
    const gAmount = storeBasket.reduce((sum, item) => sum + item.Qty * item.Price, 0);
    const rawDisc = storeDiscountInput === '' ? 0 : (Number(storeDiscountInput) || 0);
    const discVal = Math.min(gAmount, Math.max(0, rawDisc));
    const netAmount = Math.max(0, gAmount - discVal);
    const calculatedPercent = gAmount > 0 && discVal > 0 ? (discVal / gAmount) * 100 : 0;
    return { 
      storeGAmount: gAmount, 
      storeNetAmount: netAmount, 
      storeDiscVal: discVal,
      storeCalculatedPercent: calculatedPercent
    };
  };

  const { storeGAmount, storeNetAmount, storeDiscVal, storeCalculatedPercent } = calculateStoreTotals();

  useEffect(() => {
    if (storeDiscountPercent !== null && storeDiscountPercent > 0) {
      const computed = Math.round((storeGAmount * storeDiscountPercent) / 100);
      setStoreDiscountInput(computed);
    }
  }, [storeGAmount, storeDiscountPercent]);

  const handleStorePriceChange = (val: string) => {
    setStoreRowPrice(val);
    const num = parseFloat(val);
    if (!isNaN(num) && num >= 0 && storeRowItemId) {
      if (setItems) {
        setItems((prev) => prev.map((i) => (i.ItemID === storeRowItemId ? { ...i, Price: num } : i)));
      }
      syncItemToBackend('UPDATE', { ItemID: storeRowItemId, Price: num });
    }
  };

  const handleDeleteStoreItem = (itemId: string, itemName: string) => {
    if (!itemId) return;
    const targetItem = items.find((i) => i.ItemID === itemId);
    const availableStock = Number(targetItem?.CStock || 0);

    if (availableStock > 0) {
      alert(
        `🔒 Deletion Restricted:\n\nMedicine "${itemName || 'Item'}" (ID: ${itemId}) has active available stock (${availableStock} ${targetItem?.Unit || 'Units'}).\n\nYou cannot delete a medicine from the Stock Grid while current stock is available. Please adjust or issue the stock to 0 before deleting.`
      );
      return;
    }

    const confirmDelete = window.confirm(
      'Are you sure you want to permanently delete "' + (itemName || 'Item') + '" (Item ID: ' + itemId + ') from Stock Grid Manager / Inventory? This will delete duplicate or obsolete entries.'
    );
    if (confirmDelete) {
      if (setItems) {
        setItems((prev) => prev.filter((i) => i.ItemID !== itemId));
      }
      syncItemToBackend('DELETE', { ItemID: itemId });
      if (storeRowItemId === itemId) {
        setStoreRowItemId('');
        setStoreSearchQuery('');
        setStoreRowPrice('');
        setStoreRowQty(1);
      }
      setStoreSuccessMsg('Medicine "' + itemName + '" (' + itemId + ') successfully deleted from Stock Grid Manager.');
      setTimeout(() => setStoreSuccessMsg(''), 4500);
    }
  };

  const handleAddToStoreBasket = () => {
    if (!storeRowItemId) return;
    const selectedItem = items.find((i) => i.ItemID === storeRowItemId);
    if (!selectedItem) return;

    // Check if dead stock
    const isDead = Boolean(selectedItem.IsDead || selectedItem.Status === 'Dead' || selectedItem.Status === 'DEAD');
    if (isDead) {
      setStoreValidationError(`Cannot sell "${selectedItem.ItemName}": Item is classified as Dead / Obsolete stock.`);
      return;
    }

    // Verify Stock
    const existingBasketQty = storeBasket.find((b) => b.ItemID === storeRowItemId)?.Qty || 0;
    const totalRequired = existingBasketQty + storeRowQty;

    if (totalRequired > selectedItem.CStock) {
      setStoreValidationError(
        `Critical Alert: Insufficient stock for ${selectedItem.ItemName}. Current stock is only ${selectedItem.CStock} ${selectedItem.Unit || 'Units'}.`
      );
      return;
    }

    setStoreValidationError('');

    const existsIndex = storeBasket.findIndex((b) => b.ItemID === storeRowItemId);
    if (existsIndex >= 0) {
      const updated = [...storeBasket];
      updated[existsIndex].Qty += storeRowQty;
      setStoreBasket(updated);
    } else {
      const effectivePrice = (storeRowPrice !== '' && !isNaN(Number(storeRowPrice)) && Number(storeRowPrice) >= 0)
        ? Number(storeRowPrice)
        : (selectedItem.Price || 0);
      setStoreBasket([
        ...storeBasket,
        { ItemID: storeRowItemId, Qty: storeRowQty, Price: effectivePrice, MedicineType: selectedItem.MedicineType || 'P' }
      ]);
    }

    // Reset scratchpad
    setStoreRowItemId('');
    setStoreRowQty(1);
    setStoreRowPrice('');
    setStoreSearchQuery('');
    setStoreSearchDropdownOpen(false);
  };

  const handleRemoveFromStoreBasket = (itemId: string) => {
    setStoreBasket(storeBasket.filter((b) => b.ItemID !== itemId));
  };

  const handleStoreCheckoutInvoice = (postRecord: boolean) => {
    if (storeBasket.length === 0) {
      alert('Store checkout basket is empty.');
      return;
    }
    if (postRecord && !canPost) {
      alert('Unauthorized: Your role does not possess GL Posting rights (PostRec).');
      return;
    }

    const nextInvoiceNo = `INV-PH-${String(invoices.length + 1).padStart(4, '0')}`;
    
    // Validate stock one final time before database entry
    for (const basketItem of storeBasket) {
      const dbItem = items.find((itm) => itm.ItemID === basketItem.ItemID);
      if (!dbItem) {
        alert(`Product ID ${basketItem.ItemID} not found in the inventory system.`);
        return;
      }
      const isDead = Boolean(dbItem.IsDead || dbItem.Status === 'Dead' || dbItem.Status === 'DEAD');
      if (isDead) {
        alert(`Checkout aborted: Medicine "${dbItem.ItemName}" is classified as Dead/Obsolete stock.`);
        return;
      }
      if (dbItem.CStock < basketItem.Qty) {
        alert(`Stock validation failed for ${dbItem.ItemName}. Aborting checkout.`);
        return;
      }
    }

    const newHeader: InvoiceHeader = {
      InvoiceNo: nextInvoiceNo,
      PatientID: storePatientId || '', // Empty means Walk-in Customer
      InvoiceDate: new Date().toISOString().split('T')[0],
      GAmount: storeGAmount,
      Discount: storeDiscVal,
      NetAmount: storeNetAmount,
      shift: storeShift,
      Status: postRecord ? 2 : 1 // 1=Draft, 2=Posted
    };

    const newDetails: InvoiceDetail[] = storeBasket.map((b) => {
      const matched = items.find(i => i.ItemID === b.ItemID);
      return {
        InvoiceNo: nextInvoiceNo,
        ItemID: b.ItemID,
        Qty: b.Qty,
        Price: b.Price,
        LineTotal: b.Qty * b.Price,
        MedicineType: b.MedicineType || matched?.MedicineType || 'P'
      };
    });

    // Trigger state change
    onAddInvoice(newHeader, newDetails);
    
    setStoreSuccessMsg(`Store Sale ${nextInvoiceNo} checked out! Status: ${postRecord ? 'POSTED & DEBITED TO CASH (Read-Only)' : 'DRAFT'}.`);
    
    // Set print bill data first so they can print immediately!
    const storeBillObj = {
      patient: patients.find(p => p.PatientID === storePatientId) || null,
      basket: [...storeBasket],
      discount: storeDiscVal,
      netAmount: storeNetAmount,
      shift: storeShift,
      invoiceNo: nextInvoiceNo,
      invoiceDate: newHeader.InvoiceDate
    };
    setPrintBillData(storeBillObj);
    setLastPostedInvoiceData(storeBillObj);
    setPrintModalFormat('thermal');
    setPrintModalOpen(true);

    // Reset forms
    setStoreBasket([]);
    setStoreDiscountPercent(0);
    setStoreDiscountInput('');
    setStorePatientId('');

    setTimeout(() => setStoreSuccessMsg(''), 6000);
  };

  // Lookup Invoice for Sales Returns
  const handleLookupInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    const matched = invoices.find((inv) => inv.InvoiceNo === lookupInvoiceNo.trim());
    if (!matched) {
      alert('No invoice found matching the entered reference.');
      setMatchedInvoice(null);
      return;
    }
    
    setMatchedInvoice(matched);
    
    // Pre-populate return basket with invoice details for editing
    const details = invoiceDetails.filter((d) => d.InvoiceNo === matched.InvoiceNo);
    const initialReturnRows = details.map((d) => ({
      ItemID: d.ItemID,
      QtyReturned: 0, // start at 0, user inputs how much to return
      PriceRef: d.Price
    }));
    setReturnBasket(initialReturnRows);
  };

  // Process Sales Return Post
  const handlePostSalesReturn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!matchedInvoice) return;
    if (!canPost) {
      alert('Security Protection: PostRec authorization required.');
      return;
    }

    const activeReturns = returnBasket.filter((r) => r.QtyReturned > 0);
    if (activeReturns.length === 0) {
      alert('Please specify quantity to return for at least one item.');
      return;
    }

    // Check that we aren't returning more than purchased
    const originalDetails = invoiceDetails.filter((d) => d.InvoiceNo === matchedInvoice.InvoiceNo);
    for (const rRow of activeReturns) {
      const origQty = originalDetails.find((od) => od.ItemID === rRow.ItemID)?.Qty || 0;
      if (rRow.QtyReturned > origQty) {
        alert(`Cannot return more than originally purchased quantity of ${origQty} units.`);
        return;
      }
    }

    const nextSRNo = `SR-${String(invoices.length + 2).padStart(4, '0')}`;
    const refundSum = activeReturns.reduce((sum, item) => sum + item.QtyReturned * item.PriceRef, 0);

    const srHeader: SRInvHeader = {
      SRInvoiceNo: nextSRNo,
      OriginalInvoiceNo: matchedInvoice.InvoiceNo,
      ReturnDate: new Date().toISOString().split('T')[0],
      shift: matchedInvoice.shift,
      NetPaid: refundSum,
      Remarks: returnRemarks || 'Pharmacy Sales Return reversal'
    };

    const srDetails: SRInvDetail[] = activeReturns.map((r) => ({
      SRInvoiceNo: nextSRNo,
      ItemID: r.ItemID,
      QtyReturned: r.QtyReturned,
      PriceRef: r.PriceRef,
      LineTotal: r.QtyReturned * r.PriceRef
    }));

    onAddSalesReturn(srHeader, srDetails);
    setReturnSuccess(`Sales Return ${nextSRNo} finalized. Stock reinstated. Rs. ${refundSum.toLocaleString()} refunded.`);
    
    // Clear return workspace
    setMatchedInvoice(null);
    setLookupInvoiceNo('');
    setReturnBasket([]);
    setReturnRemarks('');

    setTimeout(() => setReturnSuccess(''), 6000);
  };

  // GRN add row handler
  const handleAddToGrnBasket = () => {
    if (!grnRowItemId) return;
    const isDuplicate = grnBasket.some((b) => b.ItemID === grnRowItemId);
    if (isDuplicate) {
      alert('Product already exists in current GRN worksheet.');
      return;
    }

    setGrnBasket([
      ...grnBasket,
      { ItemID: grnRowItemId, QtyIn: grnRowQty, PurchaseRate: grnRowPrice }
    ]);

    setGrnRowItemId('');
  };

  // Process Goods Inward GRN
  const handlePostGRN = (e: React.FormEvent) => {
    e.preventDefault();
    if (!grnSupplierId) {
      alert('Please select a supplier.');
      return;
    }
    if (grnBasket.length === 0) {
      alert('GRN basket is empty.');
      return;
    }
    if (editingGrn ? !canEditStock : !canAddStock) {
      alert('Unauthorized: Stock Management permission ("Add Record" or "Post Record") is required to process GRN stock inward.');
      return;
    }

    if (editingGrn) {
      // Edit Mode
      const grnHeader: InvVchHeader = {
        ...editingGrn,
        SID: grnSupplierId,
        Remarks: grnRemarks || 'Supplier stock inward'
      };

      const grnDetailsList: InvVchDetail[] = grnBasket.map((b) => ({
        VchNo: editingGrn.VchNo,
        ItemID: b.ItemID,
        QtyIn: b.QtyIn,
        PurchaseRate: b.PurchaseRate
      }));

      if (onUpdateGRN) {
        onUpdateGRN(grnHeader, grnDetailsList);
      }
      setGrnSuccessMsg(`Inward GRN ${editingGrn.VchNo} modified successfully! Stocks recalculated.`);
      setEditingGrn(null);
    } else {
      // Add Mode
      const nextGrnNo = `GRN-${String(grns.length + 1).padStart(3, '0')}`;
      const grnHeader: InvVchHeader = {
        VchNo: nextGrnNo,
        SID: grnSupplierId,
        VchDate: new Date().toISOString().split('T')[0],
        Status: 2, // Posted
        Remarks: grnRemarks || 'Supplier stock inward'
      };

      const grnDetailsList: InvVchDetail[] = grnBasket.map((b) => ({
        VchNo: nextGrnNo,
        ItemID: b.ItemID,
        QtyIn: b.QtyIn,
        PurchaseRate: b.PurchaseRate
      }));

      onAddGRN(grnHeader, grnDetailsList);
      setGrnSuccessMsg(`Inward GRN ${nextGrnNo} posted successfully! Inventory levels increased.`);
    }
    
    // Reset GRN form
    setGrnBasket([]);
    setGrnSupplierId('');
    setGrnRemarks('');

    setTimeout(() => setGrnSuccessMsg(''), 6000);
  };

  // Filter invoices for today, custom period range, or all history
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      const invDate = String(inv.InvoiceDate || '').trim().slice(0, 10);

      // Period Mode Filter
      if (!isAdministrator) {
        const targetDate = selectedDailyReportDate || todayStr;
        if (invDate !== targetDate) return false;
      } else if (salesReportPeriodMode === 'daily') {
        const targetDate = selectedDailyReportDate || todayStr;
        if (invDate !== targetDate) return false;
      } else if (salesReportPeriodMode === 'range') {
        const start = salesReportStartDate || '2000-01-01';
        const end = salesReportEndDate || '2099-12-31';
        if (invDate < start || invDate > end) return false;
      }
      // 'all' passes through all dates

      // Shift Filter
      if (selectedShiftFilter !== 'all') {
        if (String(inv.shift) !== selectedShiftFilter) return false;
      }

      // Search query filter
      if (searchHistoryQuery.trim()) {
        const q = searchHistoryQuery.toLowerCase().trim();
        const invoiceNoMatch = String(inv.InvoiceNo || '').toLowerCase().includes(q);
        const patientNameMatch = String(patients.find((p) => p.PatientID === inv.PatientID)?.PatientName || 'Walk-in Customer').toLowerCase().includes(q);
        const patientIdMatch = String(inv.PatientID || '').toLowerCase().includes(q);
        
        const medicinesMatch = invoiceDetails
          .filter((d) => d.InvoiceNo === inv.InvoiceNo)
          .some((d) => {
            const item = items.find((itm) => itm.ItemID === d.ItemID);
            return String(item?.ItemName || '').toLowerCase().includes(q) || String(d.ItemID || '').toLowerCase().includes(q);
          });

        return invoiceNoMatch || patientNameMatch || patientIdMatch || medicinesMatch;
      }
      return true;
    }).sort((a, b) => b.InvoiceNo.localeCompare(a.InvoiceNo)); // Newest first
  }, [invoices, salesReportPeriodMode, selectedDailyReportDate, salesReportStartDate, salesReportEndDate, selectedShiftFilter, searchHistoryQuery, patients, invoiceDetails, items, todayStr]);

  // Live Summary Metrics for Filtered Invoices
  const periodSalesSummary = useMemo(() => {
    const totalInvoices = filteredInvoices.length;
    const invDetailsForFiltered = invoiceDetails.filter((d) =>
      filteredInvoices.some((inv) => inv.InvoiceNo === d.InvoiceNo)
    );
    const totalUnits = invDetailsForFiltered.reduce((sum, d) => sum + (Number(d.Qty) || 0), 0);
    const grossAmount = filteredInvoices.reduce((sum, inv) => {
      const invNet = Number(inv.NetAmount ?? (inv as any).Total ?? 0);
      const invDisc = Number(inv.Discount || 0);
      let invGross = Number(inv.GAmount ?? (inv as any).GrossAmount ?? 0);
      if (invGross <= 0 || (invGross === invNet && invDisc > 0)) {
        invGross = invNet + invDisc;
      }
      return sum + invGross;
    }, 0);
    const discount = filteredInvoices.reduce((sum, inv) => sum + (Number(inv.Discount) || 0), 0);
    const netAmount = filteredInvoices.reduce((sum, inv) => sum + (Number(inv.NetAmount) || 0), 0);

    const shift1Net = filteredInvoices
      .filter((i) => i.shift === 1)
      .reduce((sum, inv) => sum + (Number(inv.NetAmount) || 0), 0);
    const shift2Net = filteredInvoices
      .filter((i) => i.shift === 2)
      .reduce((sum, inv) => sum + (Number(inv.NetAmount) || 0), 0);

    return {
      totalInvoices,
      totalUnits,
      grossAmount,
      discount,
      netAmount,
      shift1Net,
      shift2Net
    };
  }, [filteredInvoices, invoiceDetails]);

  const getPatientName = (id: string) => {
    const p = patients.find((pat) => pat.PatientID === id);
    return p ? p.PatientName : 'Walk-in Customer';
  };

  return (
    <div className="p-3 sm:p-4 md:p-5 space-y-3.5 overflow-y-auto flex-1 bg-slate-50 text-slate-800 relative" id="pharmacy-pos">
      <TopProgressBar active={isSubTabLoading} />

      {/* Upper Header Sub-Navigation Bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg border border-blue-200 shrink-0">
            <ShoppingCart className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-black text-slate-900 uppercase tracking-wider">
              Store & Dispensary
            </h2>
            <span className="text-[10px] text-slate-500 font-medium hidden sm:inline">
              Formulations, Stock & Sales Counter
            </span>
          </div>
        </div>

        {/* Sub Navigation */}
        <div className="flex flex-wrap gap-1 bg-slate-200/80 p-0.5 rounded-lg border border-slate-300/80 shadow-2xs">
          {(currentUser.Permissions?.canAccessClinicalMedicine !== false) && (
            <button
              onClick={() => handleSubTabSwitch('checkout', 'Clinical Med')}
              className={`flex items-center space-x-1 px-2 py-1 rounded-md text-[11px] font-bold transition cursor-pointer ${
                activeSubTab === 'checkout' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
              }`}
              title="Clinical Medicine Formulation & Doctor Rx Slip"
            >
              <FlaskConical className="w-3 h-3 text-emerald-600" />
              <span>Clinical Med</span>
            </button>
          )}

          {(currentUser.Permissions?.canAccessStoreMedicine !== false) && (
            <button
              onClick={() => handleSubTabSwitch('store_sales', 'Store Med')}
              className={`flex items-center space-x-1 px-2 py-1 rounded-md text-[11px] font-bold transition cursor-pointer ${
                activeSubTab === 'store_sales' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
              }`}
              title="Store Medicine OTC & Pharmacy Point of Sale"
            >
              <ShoppingCart className="w-3 h-3 text-emerald-500" />
              <span>Store Med</span>
            </button>
          )}

          {(currentUser.Permissions?.canAccessSalesReturns !== false) && (
            <button
              onClick={() => handleSubTabSwitch('return', 'Returns')}
              className={`flex items-center space-x-1 px-2 py-1 rounded-md text-[11px] font-bold transition cursor-pointer ${
                activeSubTab === 'return' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
              }`}
              title="Sales Returns & Inward Adjustments"
            >
              <Undo2 className="w-3 h-3 text-amber-500" />
              <span>Returns</span>
            </button>
          )}

          {(currentUser.Permissions?.canAccessStockManager !== false) && (
            <button
              onClick={() => handleSubTabSwitch('inventory_manager', 'Stock & Manager')}
              className={`flex items-center space-x-1 px-2 py-1 rounded-md text-[11px] font-bold transition cursor-pointer ${
                activeSubTab === 'inventory_manager' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
              }`}
              title="Inventory Stock Management & Goods Receipt"
            >
              <Database className="w-3 h-3 text-indigo-500" />
              <span>Stock Grid</span>
              {!canViewStock && <Lock className="w-2.5 h-2.5 text-amber-500 ml-0.5" />}
            </button>
          )}

          <button
            type="button"
            onClick={() => handleSubTabSwitch('custom_reports', 'Custom Reports')}
            className={`flex items-center space-x-1 px-2 py-1 rounded-md text-[11px] font-bold transition cursor-pointer ${
              activeSubTab === 'custom_reports'
                ? 'bg-purple-700 text-white shadow-2xs'
                : 'text-purple-700 hover:text-purple-900 hover:bg-purple-50'
            }`}
            title="Inventory & Sales Custom Reports Hub (Full Page View)"
          >
            <BarChart3 className="w-3 h-3 text-purple-400" />
            <span>Custom Reports</span>
            <span className="ml-1 px-1 py-0.2 bg-purple-200 text-purple-900 text-[9px] font-black rounded-full">
              Page
            </span>
          </button>

          {(currentUser.Permissions?.canAccessInvoiceLogs !== false) && (
            <button
              onClick={() => handleSubTabSwitch('invoice_logs', 'Invoices')}
              className={`flex items-center space-x-1 px-2 py-1 rounded-md text-[11px] font-bold transition cursor-pointer ${
                activeSubTab === 'invoice_logs' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
              }`}
              title="Invoice History and Audit Logs"
            >
              <History className="w-3 h-3 text-blue-500" />
              <span>Invoices</span>
            </button>
          )}

          {(currentUser.Permissions?.canAccessMedicineLabels !== false) && (
            <button
              onClick={() => handleSubTabSwitch('clinical_labels', 'Labels')}
              className={`flex items-center space-x-1 px-2 py-1 rounded-md text-[11px] font-bold transition cursor-pointer ${
                activeSubTab === 'clinical_labels' ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
              }`}
              title="Clinic Medicine Label & Sticker Printer"
            >
              <Tag className="w-3 h-3 text-indigo-500" />
              <span>Labels</span>
            </button>
          )}

          {(currentUser.Permissions?.canViewPwaInstall !== false) && (
            <button
              onClick={() => setIsPwaModalOpen(true)}
              className="flex items-center space-x-1 px-2 py-1 rounded-md text-[11px] font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-2xs transition cursor-pointer"
              title="Install Store Medicine Android App on Mobile"
            >
              <Smartphone className="w-3 h-3 text-white" />
              <span>App</span>
            </button>
          )}
        </div>
      </div>



      {/* ⚡ Visual Confirmation Indicator for Last Scanned & Mapped Barcode */}
      {lastMappedScan && (
        <div className="bg-emerald-950/95 text-emerald-100 border border-emerald-500/60 rounded-2xl p-3.5 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-start sm:items-center space-x-3">
            <div className="p-2 bg-emerald-500/20 text-emerald-300 rounded-xl border border-emerald-500/40 shrink-0 mt-0.5 sm:mt-0">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 animate-pulse" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wide text-emerald-300 flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                  Barcode Scan Mapped
                </span>
                <span className="text-[11px] font-mono font-extrabold bg-emerald-900/90 text-emerald-200 px-2 py-0.5 rounded-md border border-emerald-600/60 flex items-center gap-1">
                  <Barcode className="w-3.5 h-3.5 text-emerald-400" />
                  {lastMappedScan.barcode}
                </span>
                <span className="text-[10px] font-extrabold bg-emerald-500/20 text-emerald-200 px-2 py-0.5 rounded-full border border-emerald-500/30">
                  Matched via {lastMappedScan.matchedBy}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2 mt-1 text-xs">
                <span className="font-extrabold text-white text-sm">{lastMappedScan.itemName}</span>
                <span className="text-emerald-300/80 font-mono text-xs">(ID: {lastMappedScan.itemId})</span>
                {lastMappedScan.price > 0 && (
                  <span className="text-emerald-200 font-bold bg-emerald-900/80 px-2 py-0.5 rounded text-[11px] border border-emerald-700/50">
                    MRP: PKR {lastMappedScan.price}
                  </span>
                )}
                {lastMappedScan.batchNo && (
                  <span className="text-emerald-100 font-extrabold bg-teal-900/90 px-2 py-0.5 rounded text-[11px] border border-teal-600/60">
                    Batch: {lastMappedScan.batchNo}
                  </span>
                )}
                {lastMappedScan.mfgDate && (
                  <span className="text-emerald-100 font-extrabold bg-teal-900/90 px-2 py-0.5 rounded text-[11px] border border-teal-600/60">
                    Mfg: {lastMappedScan.mfgDate}
                  </span>
                )}
                {lastMappedScan.expDate && (
                  <span className="text-amber-200 font-extrabold bg-amber-950/90 px-2 py-0.5 rounded text-[11px] border border-amber-600/60">
                    Exp: {lastMappedScan.expDate}
                  </span>
                )}
                {lastMappedScan.stock > 0 && (
                  <span className="text-[11px] text-emerald-300 font-semibold">• Stock: {lastMappedScan.stock}</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-3 self-stretch sm:self-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-emerald-800/60 shrink-0">
            <div className="text-[10px] font-mono text-emerald-300/90 bg-emerald-900/80 px-2.5 py-1 rounded-lg border border-emerald-700/60 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
              <span className="font-bold text-emerald-200">{lastMappedScan.status}</span> at {lastMappedScan.time}
            </div>
            <button
              type="button"
              onClick={() => setLastMappedScan(null)}
              className="text-emerald-400 hover:text-white p-1 rounded-lg hover:bg-emerald-900/60 transition cursor-pointer"
              title="Dismiss scan indicator"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Floating Toast Notification Banner for Scanner Feedback */}
      {scanToastMsg && (
        <div
          className={`p-3.5 rounded-xl border font-mono text-xs font-bold flex items-center justify-between shadow-md transition-all animate-fadeIn ${
            scanToastMsg.type === 'success'
              ? 'bg-emerald-950 text-emerald-200 border-emerald-500/50'
              : scanToastMsg.type === 'error'
              ? 'bg-rose-950 text-rose-200 border-rose-500/50'
              : 'bg-indigo-950 text-indigo-200 border-indigo-500/50'
          }`}
        >
          <div className="flex items-center space-x-2.5">
            <span className="text-base">{scanToastMsg.type === 'success' ? '⚡' : scanToastMsg.type === 'error' ? '❌' : '🔍'}</span>
            <span>{scanToastMsg.text}</span>
          </div>
          <button onClick={() => setScanToastMsg(null)} className="text-slate-400 hover:text-white cursor-pointer ml-4">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      {/* Clinical Medicine Formulation & Prescription Desk */}
      {activeSubTab === 'checkout' && (
        <ClinicalMedicinePrescriptionTab
          activeSubTab={activeSubTab}
          patients={allKnownPatients}
          visits={visits}
          visitMedicines={visitMedicines}
          tokens={tokens}
          items={items}
          clinicSettings={clinicSettings}
          currentUser={currentUser}
          selectedPatientId={selectedPatientId}
          setSelectedPatientId={setSelectedPatientId}
          getVisitMedicinesList={getVisitMedicinesList}
          onOpenLabelPrintModal={(labelData) => {
            setLabelPrintData(labelData);
            setIsLabelPrintModalOpen(true);
          }}
        />
      )}

      {/* Invoice logs Tab */}
      {activeSubTab === 'store_sales' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn" id="pos-store-sales-tab">
          
          {/* POS Bill Builder */}
          <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-950 flex items-center border-b border-slate-100 pb-3">
              <ShoppingCart className="w-4 h-4 text-emerald-500 mr-2" />
              Store Medicine
            </h3>

            {storeSuccessMsg && (
              <div className="p-4 bg-emerald-50 text-emerald-800 text-xs rounded-xl font-medium border border-emerald-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3 animate-fadeIn">
                <div className="flex items-center space-x-2.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div>
                    <span className="font-bold text-sm text-emerald-950 block">{storeSuccessMsg}</span>
                    <span className="text-[11px] text-emerald-700">Customer receipt & A4 Invoice ready for immediate printing</span>
                  </div>
                </div>
                {lastPostedInvoiceData && (
                  <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => handlePrintThermalReceipt(lastPostedInvoiceData)}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-sm flex items-center space-x-1.5 transition cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>🖨️ Print Customer Receipt (Thermal)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePrintA4Invoice(lastPostedInvoiceData)}
                      className="px-3 py-1.5 bg-white border border-emerald-300 hover:bg-emerald-100 text-emerald-800 font-bold text-xs rounded-lg shadow-sm flex items-center space-x-1.5 transition cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>📄 Print A4 Invoice</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {storeSuccessMsg && (
              <div className="p-3 bg-emerald-50 text-emerald-800 text-xs rounded-xl font-semibold border border-emerald-200 flex items-center shadow-2xs animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 mr-2 shrink-0 text-emerald-600" />
                <span>{storeSuccessMsg}</span>
              </div>
            )}

            {storeValidationError && (
              <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl font-semibold border border-red-100 flex items-center shadow-2xs animate-in fade-in">
                <AlertCircle className="w-4 h-4 mr-2 shrink-0 text-red-500" />
                <span>{storeValidationError}</span>
              </div>
            )}

            <div>
              <label className="block text-xxs font-bold text-slate-500 uppercase">Customer / Patient Type</label>
              <select
                value={storePatientId}
                onChange={(e) => {
                  const pId = e.target.value;
                  setStorePatientId(pId);
                }}
                className="mt-1 w-full text-xs border border-slate-200 bg-white rounded-lg p-2.5 focus:ring-1 focus:ring-emerald-500 focus:outline-none font-medium"
              >
                <option value="">-- Walk-in Customer (General POS) --</option>
                {(() => {
                  const list = patients.filter((p) => {
                    const hasTok = (tokens || []).some((t) => t.PatientID === p.PatientID);
                    const hasVisTok = (visits || []).some((v) => v.PatientID === p.PatientID && v.TokenNo);
                    const hasVisit = (visits || []).some((v) => v.PatientID === p.PatientID);
                    return hasTok || hasVisTok || hasVisit || p.PatientID === storePatientId;
                  });

                  if (list.length === 0) {
                    return <option disabled value="">No patients with visits or tokens found</option>;
                  }

                  return list.map((p, idx) => {
                    const tokenNo = getPatientTokenNo(p.PatientID);
                    return (
                      <option key={`pos-walk-${p.PatientID}-${idx}`} value={p.PatientID}>
                        {p.PatientName} (ID: {p.PatientID}) {tokenNo ? `[Token #${tokenNo}]` : ''}
                      </option>
                    );
                  });
                })()}
              </select>
            </div>

            {/* In-Grid Item selector */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3.5 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xxs font-black text-slate-500 uppercase tracking-wider flex items-center space-x-1.5">
                  <Pill className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Select Patent Medicine</span>
                </span>
                <span className="text-[11px] text-slate-400 font-medium">
                  Edit sale price or remove duplicates directly
                </span>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                {/* Search field */}
                <div className="sm:col-span-6">
                  <div className="flex justify-between items-center">
                    <label className="block text-xxs font-bold text-slate-600 uppercase">Search Patent Medicine</label>
                    <button
                      type="button"
                      onClick={() => setIsQRScannerOpen(true)}
                      className="text-[10px] font-bold text-emerald-700 hover:text-emerald-800 flex items-center bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded-md cursor-pointer transition border border-emerald-200"
                    >
                      <QrCode className="w-3 h-3 mr-1" />
                      <span>Scan QR Code</span>
                    </button>
                  </div>
                  <div className="relative mt-1">
                    <input
                      type="text"
                      placeholder="Search medicine name, item ID, batch #, barcode..."
                      value={storeSearchQuery}
                      onChange={(e) => {
                        const val = e.target.value;
                        setStoreSearchQuery(val);
                        setStoreSearchDropdownOpen(true);
                        const exact = items.find(i => {
                          const isDead = Boolean(i.IsDead || i.Status === 'Dead' || i.Status === 'DEAD');
                          if (isDead) return false;
                          return (i.ItemName || '').toLowerCase() === val.toLowerCase() || (i.ItemID || '').toLowerCase() === val.toLowerCase();
                        });
                        if (exact) {
                          setStoreRowItemId(exact.ItemID);
                          setStoreRowPrice(exact.Price);
                        } else {
                          setStoreRowItemId('');
                          setStoreRowPrice('');
                        }
                      }}
                      onFocus={() => setStoreSearchDropdownOpen(true)}
                      onBlur={() => {
                        setTimeout(() => setStoreSearchDropdownOpen(false), 250);
                      }}
                      className="w-full text-xs border border-slate-200 bg-white rounded-lg p-2.5 pr-8 focus:outline-none focus:border-emerald-500 font-medium shadow-2xs"
                    />
                    
                    {storeSearchQuery && (
                      <button
                        type="button"
                        onClick={() => {
                          setStoreSearchQuery('');
                          setStoreRowItemId('');
                          setStoreRowPrice('');
                        }}
                        className="absolute right-2 top-[10px] text-slate-400 hover:text-slate-600 p-1"
                        title="Clear search"
                      >
                        <span className="text-xs font-bold font-mono">✕</span>
                      </button>
                    )}

                    {storeSearchDropdownOpen && (
                      <div className="absolute z-50 mt-1 w-full max-h-72 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-xl divide-y divide-slate-100">
                        {(() => {
                          const query = storeSearchQuery.toLowerCase().trim();
                          const list = items.filter(itm => {
                            const isDead = Boolean(itm.IsDead || itm.Status === 'Dead' || itm.Status === 'DEAD');
                            if (isDead) return false;
                            if (!query) return true;
                            const nameMatch = (itm.ItemName || '').toLowerCase().includes(query);
                            const idMatch = (itm.ItemID || '').toLowerCase().includes(query);
                            const barcodeMatch = (itm.VendorBarcode || '').toLowerCase().includes(query);
                            const batchMatch = (itm.BatchNo || '').toLowerCase().includes(query) ||
                              (Array.isArray(itm.Batches) && itm.Batches.some(b => (b.BatchNo || '').toLowerCase().includes(query)));
                            const categoryMatch = (itm.Category || '').toLowerCase().includes(query);
                            return nameMatch || idMatch || barcodeMatch || batchMatch || categoryMatch;
                          });
                          
                          if (list.length === 0) {
                            return <div className="p-3 text-xs text-slate-400 text-center">No matching medicines found in inventory</div>;
                          }
                          
                          return list.slice(0, 30).map((itm, idx) => {
                            const expStatus = getItemExpirySummary(itm);
                            const activeBatch = itm.BatchNo || (itm.Batches && itm.Batches[0]?.BatchNo) || '';
                            const expFormatted = formatMonthYearDisplay(itm.ExpDate || (itm.Batches && itm.Batches[0]?.ExpDate) || '');
                            
                            return (
                              <div
                                key={`${itm.ItemID}-${idx}`}
                                className="p-2.5 hover:bg-emerald-50 cursor-pointer text-left transition flex justify-between items-center group"
                              >
                                <div
                                  className="flex-1 pr-2"
                                  onMouseDown={() => {
                                    setStoreRowItemId(itm.ItemID);
                                    setStoreSearchQuery(itm.ItemName);
                                    setStoreRowPrice(itm.Price);
                                    setStoreSearchDropdownOpen(false);
                                  }}
                                >
                                  <div className="flex items-center space-x-1.5 flex-wrap">
                                    <span className="font-semibold text-xs text-slate-800">{itm.ItemName}</span>
                                    <span className="text-[10px] text-slate-400 font-mono">({itm.ItemID})</span>
                                    <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${itm.MedicineType === 'C' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
                                      {itm.MedicineType === 'C' ? 'Clinical' : 'Patent'}
                                    </span>
                                  </div>
                                  {(activeBatch || expFormatted) && (
                                    <div className="text-[10px] text-slate-500 mt-0.5 flex items-center space-x-2">
                                      {activeBatch && <span className="font-mono">Batch: <strong>{activeBatch}</strong></span>}
                                      {expFormatted && (
                                        <span className="font-mono">
                                          Exp: <strong>{expFormatted}</strong>
                                        </span>
                                      )}
                                      {expStatus.status === 'EXPIRED' && (
                                        <span className="text-[9px] font-bold bg-rose-100 text-rose-700 px-1 rounded">Expired</span>
                                      )}
                                      {expStatus.status === 'NEAR_EXPIRY' && (
                                        <span className="text-[9px] font-bold bg-amber-100 text-amber-800 px-1 rounded">Expiring Soon</span>
                                      )}
                                    </div>
                                  )}
                                </div>
                                <div className="flex items-center space-x-2 shrink-0">
                                  <div
                                    className="text-right text-xxs font-mono"
                                    onMouseDown={() => {
                                      setStoreRowItemId(itm.ItemID);
                                      setStoreSearchQuery(itm.ItemName);
                                      setStoreRowPrice(itm.Price);
                                      setStoreSearchDropdownOpen(false);
                                    }}
                                  >
                                    <span className="text-slate-800 font-bold">Rs. {itm.Price}</span>
                                    <span className={`ml-1.5 px-1.5 py-0.5 rounded font-bold ${
                                      itm.CStock <= 0 
                                        ? 'bg-rose-100 text-rose-700' 
                                        : itm.CStock <= 5 
                                          ? 'bg-amber-100 text-amber-800' 
                                          : 'bg-slate-100 text-slate-700'
                                    }`}>
                                      Stock: {itm.CStock} {itm.Unit || ''}
                                    </span>
                                  </div>
                                  {itm.CStock > 0 ? (
                                    <div
                                      onMouseDown={(e) => {
                                        e.stopPropagation();
                                        handleDeleteStoreItem(itm.ItemID, itm.ItemName);
                                      }}
                                      className="p-1 text-slate-400 hover:text-amber-700 hover:bg-amber-50 rounded transition cursor-not-allowed"
                                      title={`🔒 Stock available (${itm.CStock} ${itm.Unit || 'Units'}). Deletion from Grid is restricted.`}
                                    >
                                      <Lock className="w-3.5 h-3.5 text-slate-400" />
                                    </div>
                                  ) : (
                                    <button
                                      type="button"
                                      onMouseDown={(e) => {
                                        e.stopPropagation();
                                        handleDeleteStoreItem(itm.ItemID, itm.ItemName);
                                      }}
                                      className="p-1 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded transition cursor-pointer"
                                      title="Delete zero-stock item / duplicate from Stock Grid Manager"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          });
                        })()}
                      </div>
                    )}
                  </div>
                </div>

                {/* Sale Price Editable Textbox */}
                <div className="sm:col-span-3">
                  <div className="flex justify-between items-center">
                    <label className="block text-xxs font-bold text-slate-600 uppercase">Sale Price (Rs.)</label>
                    {storeRowItemId && (
                      <span className="text-[9px] text-emerald-600 font-bold bg-emerald-50 px-1 py-0.2 rounded border border-emerald-200">
                        Auto-Syncs Stock
                      </span>
                    )}
                  </div>
                  <div className="relative mt-1">
                    <input
                      type="number"
                      min="0"
                      step="any"
                      placeholder="0"
                      value={storeRowPrice}
                      onChange={(e) => handleStorePriceChange(e.target.value)}
                      disabled={!storeRowItemId}
                      className={`w-full text-xs border rounded-lg p-2.5 font-mono font-bold focus:outline-none focus:ring-1 transition shadow-2xs ${
                        storeRowItemId
                          ? 'border-emerald-300 bg-white text-slate-900 focus:border-emerald-500 focus:ring-emerald-500'
                          : 'border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed'
                      }`}
                    />
                  </div>
                </div>

                {/* Qty field */}
                <div className="sm:col-span-1">
                  <label className="block text-xxs font-bold text-slate-600 uppercase">Qty</label>
                  <input
                    type="number"
                    min="1"
                    value={storeRowQty}
                    onChange={(e) => setStoreRowQty(parseInt(e.target.value) || 1)}
                    className="mt-1 w-full text-xs border border-slate-200 bg-white rounded-lg p-2.5 focus:outline-none focus:border-emerald-500 font-mono font-bold text-center shadow-2xs"
                  />
                </div>

                {/* Add to basket button */}
                <div className="sm:col-span-2">
                  <button
                    type="button"
                    onClick={handleAddToStoreBasket}
                    disabled={!storeRowItemId}
                    className={`w-full py-2.5 text-xs font-bold rounded-lg flex items-center justify-center transition shadow-xs ${
                      storeRowItemId
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer'
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    <span>Add to POS</span>
                  </button>
                </div>
              </div>

              {/* Selected Item Status & Direct Delete Button */}
              {storeRowItemId && (() => {
                const sel = items.find(i => i.ItemID === storeRowItemId);
                if (!sel) return null;
                const activeBatch = sel.BatchNo || (sel.Batches && sel.Batches[0]?.BatchNo) || '';
                const expFormatted = formatMonthYearDisplay(sel.ExpDate || (sel.Batches && sel.Batches[0]?.ExpDate) || '');
                const expStatus = getItemExpirySummary(sel);

                return (
                  <div className="mt-2 flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs bg-emerald-50/80 border border-emerald-200 text-emerald-950 p-2.5 rounded-xl font-medium gap-2 shadow-2xs">
                    <div className="flex items-center space-x-2 flex-wrap">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                      <span>
                        Selected Medicine: <strong>{sel.ItemName}</strong> <span className="text-slate-500 font-mono text-xxs">({sel.ItemID})</span>
                      </span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${sel.MedicineType === 'C' ? 'bg-indigo-100 text-indigo-800' : 'bg-emerald-100 text-emerald-800'}`}>
                        {sel.MedicineType === 'C' ? 'Clinical' : 'Patent'}
                      </span>
                      <span className="text-slate-400">|</span>
                      {activeBatch && (
                        <>
                          <span className="font-mono text-slate-700">Batch: <strong>{activeBatch}</strong></span>
                          <span className="text-slate-400">|</span>
                        </>
                      )}
                      {expFormatted && (
                        <>
                          <span className="font-mono text-slate-700">Exp: <strong>{expFormatted}</strong></span>
                          {expStatus.status === 'EXPIRED' && (
                            <span className="text-[9px] font-bold bg-rose-100 text-rose-700 px-1.5 py-0.2 rounded">EXPIRED</span>
                          )}
                          <span className="text-slate-400">|</span>
                        </>
                      )}
                      <span>Stock: <strong>{sel.CStock} {sel.Unit || 'Units'}</strong></span>
                      <span className="text-slate-400">|</span>
                      <span>Live Price: <strong className="text-emerald-700 font-mono font-bold">Rs. {sel.Price}</strong></span>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0">
                      <span className="text-[10px] text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded font-bold">
                        ✓ Price auto-syncs with inventory
                      </span>
                      {sel.CStock > 0 ? (
                        <button
                          type="button"
                          onClick={() => handleDeleteStoreItem(sel.ItemID, sel.ItemName)}
                          className="inline-flex items-center space-x-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-lg border border-slate-200 transition cursor-pointer shadow-2xs"
                          title={`🔒 Active stock available (${sel.CStock} ${sel.Unit || 'Units'}). Deletion from Stock Grid is restricted.`}
                        >
                          <Lock className="w-3.5 h-3.5 text-slate-400" />
                          <span>Delete Restricted (Stock: {sel.CStock})</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleDeleteStoreItem(sel.ItemID, sel.ItemName)}
                          className="inline-flex items-center space-x-1 px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-lg border border-rose-200 hover:border-rose-300 transition cursor-pointer shadow-2xs"
                          title="Delete this zero-stock duplicate/obsolete entry from Stock Grid Manager"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                          <span>Delete from Stock Grid</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Checkout basket list */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 uppercase text-xxs font-bold">
                    <th className="py-2.5 font-bold">Item ID</th>
                    <th className="py-2.5 font-bold">Product Name</th>
                    <th className="py-2.5 text-center font-bold">Qty</th>
                    <th className="py-2.5 text-right font-bold">Retail Rate</th>
                    <th className="py-2.5 text-right font-bold">Line Total</th>
                    <th className="py-2.5 text-right font-bold">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {storeBasket.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-slate-400 font-semibold">Store sales ticket basket is currently empty.</td>
                    </tr>
                  ) : (
                    storeBasket.map((b, idx) => {
                      const item = items.find((i) => i.ItemID === b.ItemID);
                      const total = b.Qty * b.Price;
                      return (
                        <tr key={`${b.ItemID}-${idx}`} className="hover:bg-slate-50/50">
                          <td className="py-2 font-mono text-xxs font-bold text-slate-400">{b.ItemID}</td>
                          <td className="py-2 font-bold text-slate-800">{item ? item.ItemName : 'Unknown'}</td>
                          <td className="py-2 text-center font-bold font-mono">{b.Qty}</td>
                          <td className="py-2 text-right font-mono text-slate-600">Rs. {b.Price}</td>
                          <td className="py-2 text-right font-mono font-bold text-slate-900">Rs. {total.toLocaleString()}</td>
                          <td className="py-2 text-right">
                            <button
                              type="button"
                              onClick={() => handleRemoveFromStoreBasket(b.ItemID)}
                              className="text-red-500 hover:text-red-700 p-1"
                            >
                              <Trash2 className="w-4 h-4" />
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

          {/* Checkout Totals & Calculations Card */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between min-h-[520px]">
            <div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-900">Store Ticket Checkout</h3>
                <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded uppercase">Retail POS</span>
              </div>
              
              <div className="mt-4 space-y-3.5 text-xs text-slate-600">
                <div className="flex justify-between items-center bg-slate-50 border border-slate-200/80 px-3 py-2 rounded-lg font-semibold">
                  <span className="text-slate-700">Gross Total (GAmount):</span>
                  <span className="font-mono text-slate-950 font-black text-sm">Rs. {storeGAmount.toLocaleString()}</span>
                </div>

                {/* Discount Section */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xxs font-bold text-slate-500 uppercase tracking-wider">
                      Discount Presets (5%, 10%, 15%)
                    </label>
                    {storeDiscVal > 0 && (
                      <span className="text-[10px] font-bold text-emerald-700 font-mono">
                        Active: {storeCalculatedPercent % 1 === 0 ? storeCalculatedPercent.toFixed(0) : storeCalculatedPercent.toFixed(1)}% OFF
                      </span>
                    )}
                  </div>

                  {/* Preset Pills */}
                  <div className="grid grid-cols-4 gap-1.5">
                    {([0, 5, 10, 15] as const).map((pct) => {
                      const discAmt = Math.round((storeGAmount * pct) / 100);
                      const isSelected = (pct === 0 && storeDiscVal === 0) || (pct > 0 && Math.abs(storeCalculatedPercent - pct) < 0.1);
                      return (
                        <button
                          key={pct}
                          type="button"
                          onClick={() => {
                            setStoreDiscountPercent(pct);
                            if (pct === 0) {
                              setStoreDiscountInput('');
                            } else {
                              setStoreDiscountInput(Math.round((storeGAmount * pct) / 100));
                            }
                          }}
                          className={`py-2 px-1 rounded-xl border text-xs font-bold transition-all flex flex-col items-center justify-center cursor-pointer ${
                            isSelected
                              ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm ring-2 ring-emerald-300'
                              : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          <span className="text-xs font-black">{pct === 0 ? '0%' : `${pct}%`}</span>
                          <span className={`text-[10px] font-mono mt-0.5 ${isSelected ? 'text-emerald-100 font-bold' : 'text-slate-400'}`}>
                            {pct === 0 ? 'Rs. 0' : `-Rs. ${discAmt}`}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Custom Discount Input Box with Auto-Calculated Percentage */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold text-slate-800 flex items-center">
                        <span>Custom Discount Box (Rs.)</span>
                        <span className="ml-1.5 text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-bold uppercase">
                          Auto %
                        </span>
                      </label>
                      {storeDiscVal > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            setStoreDiscountPercent(0);
                            setStoreDiscountInput('');
                          }}
                          className="text-[10px] font-bold text-red-600 hover:text-red-700 cursor-pointer"
                        >
                          Clear Discount
                        </button>
                      )}
                    </div>

                    <div className="relative flex items-center">
                      <span className="absolute left-3 text-xs font-bold font-mono text-slate-500 pointer-events-none">Rs.</span>
                      <input
                        type="number"
                        min="0"
                        max={storeGAmount}
                        placeholder={storeGAmount > 0 ? "Enter price/discount (e.g. 150)" : "Add items to calculate"}
                        value={storeDiscountInput}
                        onChange={(e) => {
                          const val = e.target.value;
                          setStoreDiscountInput(val);
                          const num = parseFloat(val) || 0;
                          if (storeGAmount > 0) {
                            const p = (num / storeGAmount) * 100;
                            if (Math.abs(p - 5) < 0.01) {
                              setStoreDiscountPercent(5);
                            } else if (Math.abs(p - 10) < 0.01) {
                              setStoreDiscountPercent(10);
                            } else if (Math.abs(p - 15) < 0.01) {
                              setStoreDiscountPercent(15);
                            } else if (num === 0 || val === '') {
                              setStoreDiscountPercent(0);
                            } else {
                              setStoreDiscountPercent(null);
                            }
                          }
                        }}
                        className="w-full text-xs font-mono font-bold border border-slate-300 bg-white rounded-lg pl-9 pr-24 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-slate-900 shadow-sm"
                      />
                      {storeCalculatedPercent > 0 && (
                        <div className="absolute right-2 flex items-center bg-emerald-600 text-white text-[10px] font-mono font-black px-2 py-0.5 rounded shadow-xs">
                          <span>{storeCalculatedPercent % 1 === 0 ? storeCalculatedPercent.toFixed(0) : storeCalculatedPercent.toFixed(1)}% OFF</span>
                        </div>
                      )}
                    </div>

                    {/* Dynamic Auto-Calculated Percentage Details */}
                    {storeDiscVal > 0 && (
                      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-2.5 text-xs text-emerald-950 space-y-1">
                        <div className="flex justify-between items-center font-bold">
                          <span className="flex items-center space-x-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 inline-block"></span>
                            <span>Auto-Calculated Discount %:</span>
                          </span>
                          <span className="font-mono text-emerald-900 font-extrabold text-sm">
                            {storeCalculatedPercent % 1 === 0 ? storeCalculatedPercent.toFixed(0) : storeCalculatedPercent.toFixed(2)}% Concession
                          </span>
                        </div>
                        <div className="text-[10px] text-emerald-800 flex justify-between font-medium">
                          <span>Discount Amount: <strong>- Rs. {storeDiscVal.toLocaleString()}</strong></span>
                          <span>(Rs. {storeDiscVal} ÷ Rs. {storeGAmount} × 100)</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="border-t border-slate-200 pt-3 flex justify-between items-center text-sm">
                  <span className="font-bold text-slate-900">Net Amount Paid:</span>
                  <strong className="text-xl font-bold text-emerald-600 font-mono">Rs. {storeNetAmount.toLocaleString()}</strong>
                </div>
              </div>

              {/* Account distribution preview */}
              <div className="mt-4 bg-slate-50 border border-slate-200 rounded-xl p-3 text-xxs text-slate-500 space-y-1.5 font-medium">
                <span className="font-bold text-slate-400 uppercase">Expected Double-Entry Distribution:</span>
                <div className="flex justify-between">
                  <span>Debit StoreCIH_ Cash Account:</span>
                  <span className="text-slate-800 font-bold font-mono">Rs. {storeNetAmount.toLocaleString()}</span>
                </div>
                {storeDiscVal > 0 && (
                  <div className="flex justify-between">
                    <span>Debit StoreDisc_ Discount ({storeCalculatedPercent % 1 === 0 ? storeCalculatedPercent.toFixed(0) : storeCalculatedPercent.toFixed(1)}%):</span>
                    <span className="text-emerald-700 font-bold font-mono">Rs. {storeDiscVal.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Credit StoreSale_ Revenue:</span>
                  <span className="text-slate-800 font-bold font-mono">Rs. {storeGAmount.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2 pt-4">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleStoreCheckoutInvoice(false)}
                  disabled={!canAdd}
                  className="py-2.5 bg-slate-100 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-200 transition"
                >
                  Save Draft Bill
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (storeBasket.length === 0) {
                      alert('Cannot print empty bill. Please add items to ticket.');
                      return;
                    }
                    setPrintBillData({
                      patient: patients.find(p => p.PatientID === storePatientId) || null,
                      basket: [...storeBasket],
                      discount: storeDiscVal,
                      netAmount: storeNetAmount,
                      shift: storeShift,
                      invoiceNo: 'DRAFT',
                      invoiceDate: new Date().toISOString().split('T')[0]
                    });
                    setPrintModalOpen(true);
                  }}
                  className="py-2.5 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg text-xs font-bold hover:bg-blue-100 transition flex items-center justify-center cursor-pointer"
                >
                  <Printer className="w-4 h-4 mr-1.5 shrink-0" />
                  <span>Print Active Bill</span>
                </button>
              </div>
              <button
                type="button"
                onClick={() => handleStoreCheckoutInvoice(true)}
                disabled={!canAdd || !canPost}
                className={`w-full py-2.5 rounded-lg text-xs font-bold text-white shadow-md transition flex items-center justify-center ${
                  canAdd && canPost
                    ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/10'
                    : 'bg-slate-400 cursor-not-allowed'
                }`}
              >
                <Check className="w-4 h-4 mr-1 shrink-0" />
                <span>Authorize & Post Invoice</span>
              </button>
            </div>
          </div>

        </div>
      )}

      {/* Sales Returns Tab */}
      {activeSubTab === 'inventory_manager' && (
        !canViewStock ? (
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm text-center max-w-xl mx-auto my-12 space-y-4 animate-fadeIn">
            <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto border border-rose-100 shadow-inner">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <h3 className="text-base font-black text-slate-900 uppercase tracking-wide">Stock Management Access Restricted</h3>
            <p className="text-xs text-slate-600 font-medium leading-relaxed">
              Your account (<strong className="text-slate-900">{currentUser?.FullName || currentUser?.LoginName}</strong>) does not have access permissions for <span className="font-bold text-slate-900">Stock & Inventory Control</span>.
            </p>
            <div className="p-3 bg-slate-50 rounded-xl text-xxs font-mono text-slate-600 border border-slate-200">
              Contact your System Administrator to enable Stock Management rights in Settings &gt; User Access Control.
            </div>
          </div>
        ) : (
        <div className="space-y-2 animate-fadeIn" id="pos-inventory-manager-tab">
          
          <div className="flex flex-col space-y-1.5">
            
            {/* Category Dropdown Top Toolbar Bar (Box 1) - Sleek, Ultra-Compact & Collapsible */}
            {isGridToolbarCollapsed ? (
              /* Collapsed Ultra-Slim Toolbar (Maximum Grid View Mode) */
              <div className="bg-slate-900 text-white px-2.5 py-1 rounded-lg border border-slate-800 flex items-center justify-between gap-2 shadow-xs animate-fadeIn">
                <div className="flex items-center space-x-1.5 min-w-0">
                  <Tag className="w-3 h-3 text-indigo-400 shrink-0" />
                  <span className="text-[10px] font-bold text-slate-300 hidden sm:inline">Category:</span>
                  <select
                    value={invCategoryFilter}
                    onChange={(e) => {
                      setInvCategoryFilter(e.target.value);
                      setInvCurrentPage(1);
                    }}
                    className="py-0.5 px-2 bg-slate-800 text-white border border-slate-700 rounded text-[11px] font-bold focus:outline-none cursor-pointer"
                  >
                    {navCategories.map((cat) => (
                      <option key={cat.id} value={cat.id} className="bg-slate-900 text-white">
                        {cat.label} {cat.isFeatured ? ' (Default)' : ''}
                      </option>
                    ))}
                  </select>
                  <span className="text-[10px] text-slate-400 font-mono hidden md:inline">
                    ({currentScopeCounts.total} items)
                  </span>
                </div>

                <div className="flex items-center space-x-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={handleOpenAddMedicineModal}
                    className="h-6 px-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[10px] font-bold flex items-center transition cursor-pointer"
                  >
                    <PlusCircle className="w-3 h-3 mr-1" />
                    <span>Add Med</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsGridToolbarCollapsed(false)}
                    className="h-6 px-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-[10px] font-bold flex items-center space-x-1 transition cursor-pointer shadow-xs"
                    title="Show Full Category & Action Toolbar"
                  >
                    <Minimize2 className="w-3 h-3" />
                    <span>Show Toolbar</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Normal Ultra-Compact Category & Action Bar */
              <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white px-2.5 py-1.5 rounded-lg shadow-xs flex flex-wrap items-center justify-between gap-1.5 border border-slate-800 animate-fadeIn">
                <div className="flex items-center space-x-1.5 flex-1 min-w-[180px] max-w-sm">
                  <div className="p-1 bg-indigo-500/20 text-indigo-300 rounded border border-indigo-400/30 shrink-0">
                    <Tag className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <select
                      value={invCategoryFilter}
                      onChange={(e) => {
                        setInvCategoryFilter(e.target.value);
                        setInvCurrentPage(1);
                      }}
                      className="w-full py-1 px-2 bg-slate-800 text-white border border-slate-700 rounded text-[11px] font-bold shadow-xs focus:outline-none focus:ring-1 focus:ring-indigo-400 cursor-pointer"
                      title="Filter Stock by Medicine Category"
                    >
                      {navCategories.map((cat) => (
                        <option key={cat.id} value={cat.id} className="bg-slate-900 text-white py-0.5">
                          {cat.label} {cat.isFeatured ? ' (Default)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsCategoryModalOpen(true)}
                    className="h-6 px-2 bg-slate-800 hover:bg-slate-700 text-white rounded text-[10px] font-bold flex items-center space-x-1 transition cursor-pointer shrink-0 border border-slate-700 shadow-xs"
                    title="Manage Categories"
                  >
                    <Tag className="w-2.5 h-2.5 text-indigo-400" />
                    <span className="hidden sm:inline">Categories</span>
                  </button>
                </div>

                {/* Action Buttons Group - Ultra-Compact & Perfectly Aligned */}
                <div className="flex flex-wrap items-center gap-1 shrink-0">
                  {/* 1. Custom Reports */}
                  <button
                    type="button"
                    onClick={() => handleSubTabSwitch('custom_reports', 'Custom Reports')}
                    className="h-6 px-2 bg-gradient-to-r from-purple-700 via-indigo-600 to-indigo-700 hover:from-purple-600 hover:to-indigo-600 text-white rounded text-[10px] font-bold flex items-center transition cursor-pointer shadow-xs border border-purple-400/40"
                    title="Open Dedicated Custom Reports Hub (Full Page View)"
                  >
                    <BarChart3 className="w-3 h-3 mr-1 text-purple-200" />
                    <span>Custom Reports</span>
                  </button>

                  {/* 2. Dedicated Separate Reports Dropdown */}
                  <div className="relative group">
                    <button
                      type="button"
                      className="h-6 px-2 bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 rounded text-[10px] font-bold flex items-center transition cursor-pointer shadow-xs"
                      title="Quick Direct Print for Separate Reports"
                    >
                      <FileText className="w-3 h-3 mr-1 text-emerald-400" />
                      <span>Dedicated Reports</span>
                      <ChevronDown className="w-2.5 h-2.5 ml-0.5 text-slate-400" />
                    </button>
                    <div className="absolute right-0 top-full mt-1 w-56 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl p-1 hidden group-hover:block z-50 divide-y divide-slate-800 animate-fadeIn">
                      <div className="py-0.5">
                        <button
                          type="button"
                          onClick={() => handlePrintCurrentStockReport()}
                          className="w-full text-left px-2.5 py-1.5 text-[11px] font-semibold text-emerald-300 hover:bg-slate-800 hover:text-white rounded flex items-center space-x-1.5 transition cursor-pointer"
                        >
                          <Boxes className="w-3 h-3 text-emerald-400 shrink-0" />
                          <span>Current Active Stock</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handlePrintDeadStockReport()}
                          className="w-full text-left px-2.5 py-1.5 text-[11px] font-semibold text-rose-300 hover:bg-rose-950/40 hover:text-white rounded flex items-center space-x-1.5 transition cursor-pointer"
                        >
                          <AlertOctagon className="w-3 h-3 text-rose-400 shrink-0" />
                          <span>Dead Stock Report</span>
                        </button>
                      </div>
                      <div className="py-0.5">
                        <button
                          type="button"
                          onClick={() => handlePrintReorderQtyReport()}
                          className="w-full text-left px-2.5 py-1.5 text-[11px] font-semibold text-indigo-300 hover:bg-slate-800 hover:text-white rounded flex items-center space-x-1.5 transition cursor-pointer"
                        >
                          <Truck className="w-3 h-3 text-indigo-400 shrink-0" />
                          <span>Reorder Qty Report</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handlePrintMinThresholdReport()}
                          className="w-full text-left px-2.5 py-1.5 text-[11px] font-semibold text-amber-300 hover:bg-slate-800 hover:text-white rounded flex items-center space-x-1.5 transition cursor-pointer"
                        >
                          <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0" />
                          <span>Min Threshold Shortage</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* 3. Dead Items Button */}
                  <button
                    type="button"
                    onClick={() => setIsDeadItemsModalOpen(true)}
                    className="h-6 px-2 bg-rose-700 hover:bg-rose-600 text-white rounded text-[10px] font-bold flex items-center transition cursor-pointer shadow-xs border border-rose-600/50"
                    title="Open Dead Items & Obsolete Inventory Grid-view Popup"
                  >
                    <AlertOctagon className="w-3 h-3 mr-1 text-rose-300" />
                    <span>Dead Items</span>
                    <span className="ml-1 px-1 py-0 bg-rose-900 text-rose-100 text-[9px] font-mono font-bold rounded">
                      {items.filter(i => Boolean(i.IsDead || i.Status === 'Dead' || i.Status === 'DEAD')).length}
                    </span>
                  </button>

                  {/* 4. Change Expire Date Button */}
                  <button
                    type="button"
                    onClick={() => setIsBulkExpiryModalOpen(true)}
                    className="h-6 px-2 bg-amber-600 hover:bg-amber-500 text-white rounded text-[10px] font-bold flex items-center transition cursor-pointer shadow-xs border border-amber-500/50"
                    title="Bulk Update Medicine Expiry Dates (Month-Year)"
                  >
                    <Calendar className="w-3 h-3 mr-1" />
                    <span>Change Expire</span>
                  </button>

                  {/* 5. Add New Medicine Button */}
                  <button
                    type="button"
                    onClick={handleOpenAddMedicineModal}
                    className="h-6 px-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[10px] font-bold flex items-center transition cursor-pointer shadow-xs border border-emerald-500/50"
                  >
                    <PlusCircle className="w-3 h-3 mr-1" />
                    <span>Add Medicine</span>
                  </button>

                  {/* 6. Maximize Grid (Hide Controls) Button */}
                  <button
                    type="button"
                    onClick={() => setIsGridToolbarCollapsed(true)}
                    className="h-6 px-2 bg-slate-800 hover:bg-slate-700 text-amber-300 hover:text-white border border-slate-700 rounded text-[10px] font-bold flex items-center transition cursor-pointer shadow-xs"
                    title="Hide this toolbar to maximize vertical space for Stock Grid"
                  >
                    <Maximize2 className="w-3 h-3 mr-1 text-amber-400" />
                    <span className="hidden sm:inline">Maximize</span>
                  </button>
                </div>
              </div>
            )}

            {/* Main Area: Excel Sheet Style Inventory Grid View (Ultra-Compact Card) */}
            <div className="bg-white p-2 rounded-lg border border-slate-200 shadow-2xs flex flex-col space-y-1.5">
              
              {/* Spreadsheet Header Toolbar & Quick Search (Box 2) */}
              <div className="bg-slate-900 text-white p-1.5 rounded-lg border border-slate-800 w-full min-w-0 flex flex-col gap-1.5">
                
                {/* Primary Row: Quick Search, Filter Toggle, Print & Export */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-1.5">
                  <div className="flex items-center space-x-1.5 flex-1 min-w-[180px] max-w-xl">
                    <div className="relative flex-1">
                      <Search className="absolute left-2 top-1.5 h-3 w-3 text-emerald-400" />
                      <input
                        type="text"
                        placeholder="Quick Search: Medicine Name, ID, Category, Batch #, Barcode..."
                        value={invSearchQuery}
                        onChange={(e) => {
                          setInvSearchQuery(e.target.value);
                          setInvCurrentPage(1);
                        }}
                        className="w-full text-[11px] border border-slate-700 bg-slate-950 text-white placeholder-slate-400 rounded pl-7 pr-6 py-1 focus:outline-none focus:ring-1 focus:ring-emerald-400 font-mono shadow-inner"
                      />
                      {invSearchQuery && (
                        <button
                          type="button"
                          onClick={() => {
                            setInvSearchQuery('');
                            setInvCurrentPage(1);
                          }}
                          className="absolute right-1.5 top-1.5 text-slate-400 hover:text-white"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>

                    {/* Filter Toggle Button */}
                    <button
                      type="button"
                      onClick={() => setShowSpreadsheetFilters(!showSpreadsheetFilters)}
                      className={`h-6 px-2 rounded text-[10px] font-bold border transition cursor-pointer flex items-center space-x-1 shrink-0 ${
                        showSpreadsheetFilters
                          ? 'bg-slate-800 text-indigo-300 border-slate-700 hover:bg-slate-700'
                          : 'bg-indigo-600 text-white border-indigo-500 hover:bg-indigo-500'
                      }`}
                      title={showSpreadsheetFilters ? "Hide Filters" : "Show Filters"}
                    >
                      <SlidersHorizontal className="w-2.5 h-2.5" />
                      <span>{showSpreadsheetFilters ? 'Hide Filters' : 'Filters'}</span>
                    </button>
                  </div>

                  <div className="flex items-center space-x-1 shrink-0 self-end md:self-auto">
                    {/* Print Stock Grid (A4) */}
                    <button
                      type="button"
                      onClick={() => handlePrintStockGrid()}
                      className={`h-6 px-2 rounded text-[10px] font-bold flex items-center transition cursor-pointer shadow-xs border ${
                        (invLowStockFilter || invStockFilter === 'LOW_STOCK')
                          ? 'bg-rose-700 hover:bg-rose-600 text-white border-rose-600'
                          : 'bg-indigo-600 hover:bg-indigo-500 text-white border-indigo-500'
                      }`}
                      title={(invLowStockFilter || invStockFilter === 'LOW_STOCK') ? "Print Low Stock Items List on A4 Paper" : "Print Filtered Stock Grid on A4 Paper"}
                    >
                      <Printer className="w-2.5 h-2.5 mr-1" />
                      <span>{(invLowStockFilter || invStockFilter === 'LOW_STOCK') ? 'Print Low Stock' : 'Print Grid'}</span>
                    </button>

                    {/* Export CSV Excel */}
                    <button
                      type="button"
                      onClick={() => {
                        const processedForExport = items.filter((itm) => {
                          const stock = Number(itm.CStock ?? (itm as any).Stock ?? 0);
                          const minStock = (itm.MinStock !== undefined && itm.MinStock !== null) ? Number(itm.MinStock) : 1;

                          if (invStockFilter === 'IN_STOCK' && stock <= 0) return false;
                          if (invStockFilter === 'ZERO_STOCK' && stock > 0) return false;
                          if (invStockFilter === 'LOW_STOCK' && stock > minStock) return false;
                          if (invLowStockFilter && stock > minStock) return false;

                          if (invExpiryFilterScope !== 'ALL') {
                            const expSum = getItemExpirySummary(itm);
                            if (invExpiryFilterScope === 'EXPIRED' && expSum.status !== 'EXPIRED' && expSum.status !== 'PARTIAL_EXPIRED') return false;
                            if (invExpiryFilterScope === 'NEAR_EXPIRY' && expSum.status !== 'NEAR_EXPIRY') return false;
                            if (invExpiryFilterScope === 'ACTIVE' && expSum.status !== 'ACTIVE') return false;
                          }
                          if (invDeadFilterScope === 'ACTIVE_ONLY') {
                            const isDead = Boolean(itm.IsDead || itm.Status === 'Dead' || itm.Status === 'DEAD');
                            if (isDead) return false;
                          }
                          if (invDeadFilterScope === 'DEAD_ONLY') {
                            const isDead = Boolean(itm.IsDead || itm.Status === 'Dead' || itm.Status === 'DEAD');
                            if (!isDead) return false;
                          }
                          if (invCategoryFilter !== 'ALL') {
                            if (invCategoryFilter === 'C') {
                              if (itm.MedicineType !== 'C') return false;
                            } else if (invCategoryFilter === 'P') {
                              if (itm.MedicineType === 'C') return false;
                            } else {
                              const u = (itm.Unit || '').toLowerCase().trim();
                              const c = invCategoryFilter.toLowerCase().trim();
                              if (u !== c && !u.includes(c)) return false;
                            }
                          }
                          if (invSearchQuery.trim()) {
                            const q = invSearchQuery.toLowerCase().trim();
                            return (
                              itm.ItemID.toLowerCase().includes(q) ||
                              itm.ItemName.toLowerCase().includes(q) ||
                              (itm.Unit || '').toLowerCase().includes(q) ||
                              (itm.BatchNo || '').toLowerCase().includes(q) ||
                              (itm.VendorBarcode || '').toLowerCase().includes(q)
                            );
                          }
                          return true;
                        });

                        const headers = ["S.No", "Item ID", "Medicine Name", "Category/Unit", "Type", "Status", "Current Stock", "Min Threshold", "Reorder Qty", "Unit Cost (Rs)", "Retail Price (Rs)", "Batch No", "Exp Date", "Batches Count", "Dead Reason"];
                        const rows = processedForExport.map((itm, idx) => [
                          idx + 1,
                          `"${itm.ItemID.replace(/"/g, '""')}"`,
                          `"${itm.ItemName.replace(/"/g, '""')}"`,
                          `"${(itm.Unit || 'Tab').replace(/"/g, '""')}"`,
                          itm.MedicineType === 'C' ? 'Clinical' : 'Patent',
                          (itm.IsDead || itm.Status === 'Dead' || itm.Status === 'DEAD') ? 'Dead' : 'Active',
                          Number(itm.CStock ?? (itm as any).Stock ?? 0),
                          (itm.MinStock !== undefined && itm.MinStock !== null) ? itm.MinStock : 1,
                          itm.ReorderQty || 0,
                          itm.PurchasePrice,
                          itm.Price,
                          `"${(itm.BatchNo || '').replace(/"/g, '""')}"`,
                          `"${(itm.ExpDate || '').replace(/"/g, '""')}"`,
                          Array.isArray(itm.Batches) ? itm.Batches.length : (itm.ExpDate ? 1 : 0),
                          `"${(itm.DeadReason || '').replace(/"/g, '""')}"`
                        ]);
                        const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
                        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                        const url = URL.createObjectURL(blob);
                        const link = document.createElement('a');
                        link.setAttribute('href', url);
                        link.setAttribute('download', `Pharmacy_Stock_Grid_${new Date().toISOString().slice(0, 10)}.csv`);
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                      }}
                      className="h-6 px-2 bg-emerald-700 hover:bg-emerald-600 text-white border border-emerald-600 rounded text-[10px] font-bold flex items-center transition cursor-pointer shadow-xs"
                      title="Export filtered inventory grid to CSV Excel Spreadsheet"
                    >
                      <Download className="w-2.5 h-2.5 mr-1" />
                      <span>Export CSV</span>
                    </button>
                  </div>
                </div>

                {/* Secondary Row: Expiry, Dead Status & Stock Filters (Collapsible to save height) */}
                {showSpreadsheetFilters && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-800 animate-fadeIn">
                    {/* Expiry Status Filter Selector */}
                    <div className="flex items-center space-x-0.5 bg-slate-800 p-0.5 rounded border border-slate-700">
                      <button
                        type="button"
                        onClick={() => {
                          setInvExpiryFilterScope('ALL');
                          setInvCurrentPage(1);
                        }}
                        className={`px-1.5 py-0.5 rounded text-[9.5px] font-bold transition cursor-pointer ${
                          invExpiryFilterScope === 'ALL'
                            ? 'bg-indigo-600 text-white'
                            : 'text-slate-300 hover:text-white'
                        }`}
                      >
                        All Expiry
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setInvExpiryFilterScope('EXPIRED');
                          setInvCurrentPage(1);
                        }}
                        className={`px-1.5 py-0.5 rounded text-[9.5px] font-bold transition cursor-pointer flex items-center space-x-1 ${
                          invExpiryFilterScope === 'EXPIRED'
                            ? 'bg-rose-600 text-white'
                            : 'text-rose-300 hover:text-white hover:bg-rose-950/40'
                        }`}
                      >
                        <span>🔴 Expired</span>
                        <span className="px-1 py-0 bg-rose-800 text-white rounded text-[8.5px] font-mono">
                          {items.filter(i => getItemExpirySummary(i).status === 'EXPIRED' || getItemExpirySummary(i).status === 'PARTIAL_EXPIRED').length}
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setInvExpiryFilterScope('NEAR_EXPIRY');
                          setInvCurrentPage(1);
                        }}
                        className={`px-1.5 py-0.5 rounded text-[9.5px] font-bold transition cursor-pointer flex items-center space-x-1 ${
                          invExpiryFilterScope === 'NEAR_EXPIRY'
                            ? 'bg-amber-600 text-white'
                            : 'text-amber-300 hover:text-white hover:bg-amber-950/40'
                        }`}
                      >
                        <span>🟡 &lt;90 Days</span>
                        <span className="px-1 py-0 bg-amber-800 text-white rounded text-[8.5px] font-mono">
                          {items.filter(i => getItemExpirySummary(i).status === 'NEAR_EXPIRY').length}
                        </span>
                      </button>
                    </div>

                    {/* Dead Status Filter Scope */}
                    <div className="flex items-center space-x-0.5 bg-slate-800 p-0.5 rounded border border-slate-700">
                      <button
                        type="button"
                        onClick={() => {
                          setInvDeadFilterScope('ALL');
                          setInvCurrentPage(1);
                        }}
                        className={`px-1.5 py-0.5 rounded text-[9.5px] font-bold transition cursor-pointer flex items-center space-x-1 ${
                          invDeadFilterScope === 'ALL'
                            ? 'bg-indigo-600 text-white'
                            : 'text-slate-300 hover:text-white'
                        }`}
                        title="Show entire catalog (Active and Dead items)"
                      >
                        <span>All</span>
                        <span className="px-1 py-0 bg-slate-900/60 text-slate-300 rounded text-[8.5px] font-mono">
                          {inventoryStats.totalCatalog}
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setInvDeadFilterScope('ACTIVE_ONLY');
                          setInvCurrentPage(1);
                        }}
                        className={`px-1.5 py-0.5 rounded text-[9.5px] font-bold transition cursor-pointer flex items-center space-x-1 ${
                          invDeadFilterScope === 'ACTIVE_ONLY'
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'text-emerald-300 hover:text-white hover:bg-emerald-950/40'
                        }`}
                        title="Show only Active running medicines (Recommended)"
                      >
                        <span>Active</span>
                        <span className={`px-1 py-0 rounded text-[8.5px] font-mono ${
                          invDeadFilterScope === 'ACTIVE_ONLY' ? 'bg-emerald-800 text-white' : 'bg-emerald-950 text-emerald-300'
                        }`}>
                          {inventoryStats.activeCount}
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setInvDeadFilterScope('DEAD_ONLY');
                          setInvCurrentPage(1);
                        }}
                        className={`px-1.5 py-0.5 rounded text-[9.5px] font-bold transition cursor-pointer flex items-center space-x-1 ${
                          invDeadFilterScope === 'DEAD_ONLY'
                            ? 'bg-rose-600 text-white shadow-xs'
                            : 'text-rose-300 hover:text-white hover:bg-rose-950/40'
                        }`}
                        title="Show only Dead/Obsolete medicines"
                      >
                        <span>💀 Dead</span>
                        <span className={`px-1 py-0 rounded text-[8.5px] font-mono ${
                          invDeadFilterScope === 'DEAD_ONLY' ? 'bg-rose-800 text-white' : 'bg-rose-950 text-rose-300'
                        }`}>
                          {inventoryStats.deadCount}
                        </span>
                      </button>
                    </div>

                    {/* Stock Level Selector matching Dead Items Manager */}
                    <div className="flex items-center space-x-1 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">
                      <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider hidden sm:inline">Stock:</span>
                      <select
                        value={invStockFilter}
                        onChange={(e) => {
                          const val = e.target.value as 'ALL' | 'IN_STOCK' | 'LOW_STOCK' | 'ZERO_STOCK';
                          setInvStockFilter(val);
                          setInvLowStockFilter(val === 'LOW_STOCK');
                          setInvCurrentPage(1);
                        }}
                        className="bg-slate-900 text-white text-[10px] font-bold rounded px-1 py-0.5 border border-slate-600 focus:outline-none cursor-pointer"
                        title="Filter medicines by current stock status"
                      >
                        <option value="ALL">All Stock ({currentScopeCounts.total})</option>
                        <option value="IN_STOCK">In Stock ({currentScopeCounts.inStock})</option>
                        <option value="LOW_STOCK">Low Stock ({currentScopeCounts.lowStock})</option>
                        <option value="ZERO_STOCK">Out of Stock ({currentScopeCounts.zeroStock})</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* Messages */}
              {invSuccessMsg && (
                <div className="p-2.5 bg-emerald-50 text-emerald-800 text-xs rounded-lg font-bold border border-emerald-200">
                  {invSuccessMsg}
                </div>
              )}
              {invErrorMsg && (
                <div className="p-2.5 bg-rose-50 text-rose-800 text-xs rounded-lg font-bold border border-rose-200 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-2 text-rose-600 shrink-0" />
                  {invErrorMsg}
                </div>
              )}

              {/* Excel Spreadsheet Table Container */}
              {(() => {
                const processedItems = items.filter((itm) => {
                  const stock = Number(itm.CStock ?? (itm as any).Stock ?? 0);
                  const minStock = (itm.MinStock !== undefined && itm.MinStock !== null) ? Number(itm.MinStock) : 1;

                  if (invStockFilter === 'IN_STOCK' && stock <= 0) return false;
                  if (invStockFilter === 'ZERO_STOCK' && stock > 0) return false;
                  if (invStockFilter === 'LOW_STOCK' && stock > minStock) return false;
                  if (invLowStockFilter && stock > minStock) return false;

                  if (invExpiryFilterScope !== 'ALL') {
                    const expSum = getItemExpirySummary(itm);
                    if (invExpiryFilterScope === 'EXPIRED' && expSum.status !== 'EXPIRED' && expSum.status !== 'PARTIAL_EXPIRED') return false;
                    if (invExpiryFilterScope === 'NEAR_EXPIRY' && expSum.status !== 'NEAR_EXPIRY') return false;
                    if (invExpiryFilterScope === 'ACTIVE' && expSum.status !== 'ACTIVE') return false;
                  }
                  if (invDeadFilterScope === 'ACTIVE_ONLY') {
                    const isDead = Boolean(itm.IsDead || itm.Status === 'Dead' || itm.Status === 'DEAD');
                    if (isDead) return false;
                  }
                  if (invDeadFilterScope === 'DEAD_ONLY') {
                    const isDead = Boolean(itm.IsDead || itm.Status === 'Dead' || itm.Status === 'DEAD');
                    if (!isDead) return false;
                  }
                  if (invCategoryFilter !== 'ALL') {
                    if (invCategoryFilter === 'C') {
                      if (itm.MedicineType !== 'C') return false;
                    } else if (invCategoryFilter === 'P') {
                      if (itm.MedicineType === 'C') return false;
                    } else {
                      const u = (itm.Unit || '').toLowerCase().trim();
                      const c = invCategoryFilter.toLowerCase().trim();
                      if (u !== c && !u.includes(c)) return false;
                    }
                  }
                  if (invSearchQuery.trim()) {
                    const q = invSearchQuery.toLowerCase().trim();
                    return (
                      itm.ItemID.toLowerCase().includes(q) ||
                      itm.ItemName.toLowerCase().includes(q) ||
                      (itm.Unit || '').toLowerCase().includes(q) ||
                      (itm.BatchNo || '').toLowerCase().includes(q) ||
                      (itm.VendorBarcode || '').toLowerCase().includes(q)
                    );
                  }
                  return true;
                });

                processedItems.sort((a, b) => {
                  let valA: any = invSortField === 'CStock' ? Number(a.CStock ?? (a as any).Stock ?? 0) : a[invSortField];
                  let valB: any = invSortField === 'CStock' ? Number(b.CStock ?? (b as any).Stock ?? 0) : b[invSortField];
                  if (valA === undefined || valA === null) valA = '';
                  if (valB === undefined || valB === null) valB = '';
                  if (typeof valA === 'string') valA = valA.toLowerCase();
                  if (typeof valB === 'string') valB = valB.toLowerCase();

                  if (valA < valB) return invSortOrder === 'asc' ? -1 : 1;
                  if (valA > valB) return invSortOrder === 'asc' ? 1 : -1;
                  return 0;
                });

                const totalValuationCost = processedItems.reduce((acc, itm) => acc + (Number(itm.PurchasePrice || 0) * Number(itm.CStock ?? (itm as any).Stock ?? 0)), 0);
                const totalValuationRetail = processedItems.reduce((acc, itm) => acc + (Number(itm.Price || 0) * Number(itm.CStock ?? (itm as any).Stock ?? 0)), 0);

                const toggleSort = (field: typeof invSortField) => {
                  if (invSortField === field) {
                    setInvSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
                  } else {
                    setInvSortField(field);
                    setInvSortOrder('asc');
                  }
                };

                // Virtual Pagination Calculations
                const totalItemsCount = processedItems.length;
                const isAllPage = invPageSize === -1;
                const effectivePageSize = isAllPage ? Math.max(1, totalItemsCount) : invPageSize;
                const totalPages = isAllPage ? 1 : Math.max(1, Math.ceil(totalItemsCount / effectivePageSize));
                const currentPageSafe = Math.min(Math.max(1, invCurrentPage), totalPages);
                const startIndex = isAllPage ? 0 : (currentPageSafe - 1) * effectivePageSize;
                const endIndex = isAllPage ? totalItemsCount : Math.min(startIndex + effectivePageSize, totalItemsCount);
                const paginatedItems = isAllPage ? processedItems : processedItems.slice(startIndex, endIndex);

                // Helper for generating visible page buttons
                const getVisiblePages = () => {
                  if (totalPages <= 7) {
                    return Array.from({ length: totalPages }, (_, i) => i + 1);
                  }
                  const pages: (number | string)[] = [1];
                  if (currentPageSafe > 3) pages.push('...');
                  const start = Math.max(2, currentPageSafe - 1);
                  const end = Math.min(totalPages - 1, currentPageSafe + 1);
                  for (let i = start; i <= end; i++) {
                    pages.push(i);
                  }
                  if (currentPageSafe < totalPages - 2) pages.push('...');
                  pages.push(totalPages);
                  return pages;
                };

                return (
                  <div className="flex flex-col space-y-1.5">
                    
                    {/* Active Filter Notification Alert Banner */}
                    {(invLowStockFilter || invStockFilter === 'LOW_STOCK') && (
                      <div className="flex flex-wrap items-center justify-between p-2 px-3 bg-rose-50 border border-rose-300 rounded-lg text-rose-900 text-[11px] shadow-2xs">
                        <div className="flex items-center space-x-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                          <span>
                            <strong>Low Stock Active:</strong> <strong>{processedItems.length}</strong> low stock medicine{processedItems.length === 1 ? '' : 's'} (Stock &le; Min Threshold).
                            {currentScopeCounts.inStock > processedItems.length && (
                              <span className="ml-1 text-rose-700 hidden sm:inline">
                                ({currentScopeCounts.inStock - processedItems.length} active items hidden).
                              </span>
                            )}
                          </span>
                        </div>
                        <div className="flex items-center space-x-1.5 mt-1 sm:mt-0">
                          <button
                            type="button"
                            onClick={() => {
                              setInvLowStockFilter(false);
                              setInvStockFilter('ALL');
                              setInvCurrentPage(1);
                            }}
                            className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[10px] font-bold transition shadow-2xs cursor-pointer flex items-center space-x-1"
                          >
                            <span>Show In-Stock ({currentScopeCounts.inStock})</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setInvLowStockFilter(false);
                              setInvStockFilter('ALL');
                              setInvCategoryFilter('ALL');
                              setInvSearchQuery('');
                              setInvExpiryFilterScope('ALL');
                              setInvDeadFilterScope('ACTIVE_ONLY');
                              setInvCurrentPage(1);
                            }}
                            className="px-1.5 py-0.5 bg-slate-700 hover:bg-slate-600 text-white rounded text-[10px] font-bold transition cursor-pointer"
                          >
                            Clear Filters
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Top Quick Pagination & Stats Bar */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 px-1 py-0 text-[11px] text-slate-700">
                      <div className="flex items-center space-x-1.5 flex-wrap">
                        <span className="font-bold text-slate-800">
                          {totalItemsCount === 0 ? (
                            '0 medicines'
                          ) : (
                            <>
                              Showing <strong className="text-indigo-700 font-mono">{startIndex + 1}</strong>-{' '}
                              <strong className="text-indigo-700 font-mono">{endIndex}</strong> of{' '}
                              <strong className="text-slate-900 font-mono">{totalItemsCount}</strong> medicines
                            </>
                          )}
                        </span>
                        {invCategoryFilter === 'ALL' && (
                          <span className="px-1.5 py-0.2 bg-indigo-100 text-indigo-800 rounded font-bold text-[9px]">
                            ⚡ Virtual Mode (All Categories)
                          </span>
                        )}
                      </div>

                      {/* Top Page Size Selector */}
                      <div className="flex items-center space-x-1.5 self-end sm:self-auto">
                        <label className="text-[10px] font-bold text-slate-500">Rows:</label>
                        <select
                          value={invPageSize}
                          onChange={(e) => {
                            setInvPageSize(Number(e.target.value));
                            setInvCurrentPage(1);
                          }}
                          className="py-0.5 px-1.5 bg-white border border-slate-300 rounded text-[10.5px] font-bold text-slate-800 shadow-2xs focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                        >
                          <option value={25}>25 rows</option>
                          <option value={50}>50 rows (Recommended)</option>
                          <option value={100}>100 rows</option>
                          <option value={200}>200 rows</option>
                          <option value={500}>500 rows</option>
                          <option value={-1}>All rows</option>
                        </select>
                      </div>
                    </div>

                    {/* Mobile View: High-Density Card Rows (Shown on < md screens) */}
                    <div className="block md:hidden space-y-2.5">
                      {paginatedItems.length === 0 ? (
                        <div className="p-8 text-center text-slate-400 font-bold bg-white rounded-xl border border-slate-200 text-xs space-y-3">
                          <Package className="w-8 h-8 text-slate-300 mx-auto mb-1" />
                          <p className="text-slate-700 font-bold">
                            {(invLowStockFilter || invStockFilter === 'LOW_STOCK')
                              ? 'All inventory medicines are currently above reorder levels! No low stock items found.'
                              : 'No medicines match the search or category filter.'}
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              setInvLowStockFilter(false);
                              setInvStockFilter('ALL');
                              setInvCategoryFilter('ALL');
                              setInvSearchQuery('');
                              setInvExpiryFilterScope('ALL');
                              setInvCurrentPage(1);
                            }}
                            className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition cursor-pointer shadow-xs inline-block"
                          >
                            Show All Active Stock ({inventoryStats.activeInStockCount} Medicines)
                          </button>
                        </div>
                      ) : (
                        paginatedItems.map((itm, idx) => {
                          const itemStock = Number(itm.CStock ?? (itm as any).Stock ?? 0);
                          const itemMinStock = (itm.MinStock !== undefined && itm.MinStock !== null) ? Number(itm.MinStock) : 1;
                          const isLowStock = itemStock <= itemMinStock;
                          const isClinical = itm.MedicineType === 'C';
                          const absoluteRowNumber = startIndex + idx + 1;

                          return (
                            <div 
                              key={`mobile-${itm.ItemID}-${absoluteRowNumber}`}
                              className={`p-3 rounded-xl border shadow-xs transition-all space-y-2 ${
                                isLowStock 
                                  ? 'bg-rose-50/70 border-rose-300' 
                                  : 'bg-white border-slate-200 hover:border-indigo-300'
                              }`}
                            >
                              {/* Row 1: Number, Medicine Name, Category & Badges */}
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex items-start space-x-2 min-w-0 flex-1">
                                  <span className="w-5 h-5 rounded-md bg-slate-100 border border-slate-300 text-slate-600 font-mono text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                                    {absoluteRowNumber}
                                  </span>
                                  <div className="min-w-0 flex-1">
                                    <h4 className="text-xs font-black text-slate-900 leading-tight">
                                      {itm.ItemName}
                                    </h4>
                                    <div className="flex flex-wrap items-center gap-1 mt-1 text-[10px]">
                                      <span className="font-mono text-slate-500 font-bold">
                                        ID: {itm.ItemID}
                                      </span>
                                      <span className="px-1.5 py-0.2 bg-slate-100 text-slate-700 rounded font-semibold border border-slate-200">
                                        {itm.Unit || 'Tab'}
                                      </span>
                                      <span className={`px-1.5 py-0.2 rounded font-black uppercase text-[9px] ${
                                        isClinical ? 'bg-indigo-100 text-indigo-800' : 'bg-emerald-100 text-emerald-800'
                                      }`}>
                                        {isClinical ? 'Clinical' : 'Patent'}
                                      </span>
                                      {(itm.IsDead || itm.Status === 'Dead' || itm.Status === 'DEAD') && (
                                        <span 
                                          className="px-1.5 py-0.2 bg-rose-100 text-rose-900 border border-rose-300 rounded font-black uppercase text-[8px] flex items-center space-x-0.5"
                                          title={itm.DeadReason ? `Dead Item: ${itm.DeadReason}` : 'Dead Item'}
                                        >
                                          <span>💀 Dead Item</span>
                                        </span>
                                      )}
                                      {isLowStock && (
                                        <span className="px-1.5 py-0.2 bg-rose-600 text-white rounded font-black uppercase text-[8px] animate-pulse">
                                          Low Stock
                                        </span>
                                      )}
                                      {Array.isArray(itm.Batches) && itm.Batches.length > 0 && (
                                        <span className="px-1 py-0.2 bg-indigo-50 text-indigo-700 rounded font-mono text-[9px] border border-indigo-200">
                                          {itm.Batches.length} {itm.Batches.length === 1 ? 'Batch' : 'Batches'}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {/* Quick Action Icons on Top Right */}
                                <div className="flex items-center space-x-1 shrink-0 bg-slate-50 p-1 rounded-lg border border-slate-200">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const isDead = Boolean(itm.IsDead || itm.Status === 'Dead' || itm.Status === 'DEAD');
                                      handleUpdateItemDeadStatus(itm.ItemID, !isDead);
                                    }}
                                    className={`p-1.5 rounded transition cursor-pointer ${
                                      (itm.IsDead || itm.Status === 'Dead' || itm.Status === 'DEAD')
                                        ? 'text-rose-600 bg-rose-100 hover:bg-rose-200'
                                        : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                                    }`}
                                    title={(itm.IsDead || itm.Status === 'Dead' || itm.Status === 'DEAD') ? "Marked as Dead Item (Click to restore Active)" : "Click to mark as Dead Item"}
                                  >
                                    <AlertOctagon className="w-4 h-4" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleOpenBatchManager(itm)}
                                    className="p-1.5 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-100 rounded transition cursor-pointer"
                                    title="Manage Batches & Lots"
                                  >
                                    <Boxes className="w-4 h-4" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleSelectEditItem(itm)}
                                    className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-100 rounded transition cursor-pointer"
                                    title="Edit Full Parameters"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveItem(itm.ItemID, itm.ItemName)}
                                    disabled={!canAdd}
                                    className={`p-1.5 rounded transition cursor-pointer ${
                                      canAdd ? 'text-slate-500 hover:text-rose-600 hover:bg-rose-100' : 'text-slate-300 cursor-not-allowed'
                                    }`}
                                    title="Delete Medicine"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>

                              {/* Row 2: Current Stock Control & Retail Price */}
                              <div className="grid grid-cols-2 gap-2 pt-1.5 border-t border-slate-100">
                                {/* Current Stock with +/- Buttons */}
                                <div className="bg-emerald-50/60 p-2 rounded-lg border border-emerald-200 flex flex-col justify-between">
                                  <span className="text-[9.5px] font-black uppercase tracking-wider text-emerald-900 mb-1">
                                    Current Stock
                                  </span>
                                  <div className="flex items-center justify-between space-x-1">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (setItems) {
                                          const newStock = Math.max(0, itemStock - 1);
                                          const updated = { ...itm, CStock: newStock };
                                          setItems(prev => prev.map(i => i.ItemID === itm.ItemID ? updated : i));
                                          syncItemToBackend('UPDATE', updated);
                                        }
                                      }}
                                      className="w-7 h-7 bg-white hover:bg-rose-100 text-slate-800 border border-slate-300 rounded-md font-bold text-sm flex items-center justify-center transition cursor-pointer shadow-2xs"
                                    >
                                      -
                                    </button>
                                    <input
                                      type="number"
                                      min="0"
                                      value={itemStock}
                                      onChange={(e) => {
                                        const val = e.target.value === '' ? 0 : Math.max(0, Number(e.target.value));
                                        if (setItems) {
                                          const updated = { ...itm, CStock: val };
                                          setItems(prev => prev.map(i => i.ItemID === itm.ItemID ? updated : i));
                                          syncItemToBackend('UPDATE', updated);
                                        }
                                      }}
                                      className={`w-14 py-1 text-center text-xs font-mono font-black rounded-md border ${
                                        isLowStock
                                          ? 'bg-rose-100 border-rose-400 text-rose-950'
                                          : 'bg-white border-emerald-300 text-slate-900'
                                      }`}
                                    />
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (setItems) {
                                          const newStock = itemStock + 1;
                                          const updated = { ...itm, CStock: newStock };
                                          setItems(prev => prev.map(i => i.ItemID === itm.ItemID ? updated : i));
                                          syncItemToBackend('UPDATE', updated);
                                        }
                                      }}
                                      className="w-7 h-7 bg-white hover:bg-emerald-100 text-slate-800 border border-slate-300 rounded-md font-bold text-sm flex items-center justify-center transition cursor-pointer shadow-2xs"
                                    >
                                      +
                                    </button>
                                  </div>
                                </div>

                                {/* Retail Price (MRP) with Direct Edit */}
                                <div className="bg-slate-50 p-2 rounded-lg border border-slate-200 flex flex-col justify-between">
                                  <span className="text-[9.5px] font-black uppercase tracking-wider text-slate-700 mb-1">
                                    Retail Price (Rs)
                                  </span>
                                  <div className="flex items-center space-x-1">
                                    <span className="text-[11px] font-bold text-slate-500 font-mono">PKR</span>
                                    <input
                                      type="number"
                                      step="0.01"
                                      min="0"
                                      value={itm.Price}
                                      onChange={(e) => {
                                        const val = e.target.value === '' ? 0 : Math.max(0, Number(e.target.value));
                                        if (setItems) {
                                          const updated = { ...itm, Price: val };
                                          setItems(prev => prev.map(i => i.ItemID === itm.ItemID ? updated : i));
                                          syncItemToBackend('UPDATE', updated);
                                        }
                                      }}
                                      className="w-full py-1 px-1.5 text-right text-xs font-mono font-black bg-white border border-slate-300 rounded-md text-slate-900 focus:ring-1 focus:ring-emerald-500"
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>

                    {/* Desktop & Tablet Excel Table Grid (Shown on md+ screens) */}
                    <div className="hidden md:block overflow-x-auto border border-slate-300 rounded-lg max-h-[660px] overflow-y-auto shadow-2xs bg-slate-50">
                      <table className="w-full text-left border-collapse text-[11px] font-sans select-none">
                        <thead className="sticky top-0 bg-slate-200 text-slate-800 border-b border-slate-300 font-extrabold uppercase tracking-wider text-[9.5px] z-10 shadow-2xs">
                          <tr className="divide-x divide-slate-300">
                            <th className="px-1.5 py-1 text-center w-10 bg-slate-300/80 text-slate-700">#</th>
                            <th 
                              onClick={() => toggleSort('ItemID')}
                              className="px-2 py-1 cursor-pointer hover:bg-slate-300 transition"
                            >
                              <div className="flex items-center space-x-1">
                                <span>Item ID</span>
                                {invSortField === 'ItemID' && (<span>{invSortOrder === 'asc' ? '▲' : '▼'}</span>)}
                              </div>
                            </th>
                            <th 
                              onClick={() => toggleSort('ItemName')}
                              className="px-2.5 py-1 cursor-pointer hover:bg-slate-300 transition"
                            >
                              <div className="flex items-center space-x-1">
                                <span>Medicine Name</span>
                                {invSortField === 'ItemName' && (<span>{invSortOrder === 'asc' ? '▲' : '▼'}</span>)}
                              </div>
                            </th>
                            <th className="px-2 py-1">Category</th>
                            <th className="px-1.5 py-1 text-center">Type</th>
                            <th 
                              onClick={() => toggleSort('CStock')}
                              className="px-2 py-1 text-right cursor-pointer hover:bg-slate-300 transition bg-emerald-100/60 text-emerald-950 font-black"
                            >
                              <div className="flex items-center justify-end space-x-1">
                                <span>Current Stock</span>
                                {invSortField === 'CStock' && (<span>{invSortOrder === 'asc' ? '▲' : '▼'}</span>)}
                              </div>
                            </th>
                            <th className="px-2 py-1 text-right">Min Thresh</th>
                            <th 
                              onClick={() => toggleSort('ReorderQty')}
                              className="px-2 py-1 text-right cursor-pointer hover:bg-slate-300 transition bg-indigo-100/60 text-indigo-950 font-black"
                            >
                              <div className="flex items-center justify-end space-x-1">
                                <span>PO Reorder</span>
                                {invSortField === 'ReorderQty' && (<span>{invSortOrder === 'asc' ? '▲' : '▼'}</span>)}
                              </div>
                            </th>
                            <th className="px-2 py-1 text-right">Cost (Rs)</th>
                            <th className="px-2 py-1 text-right">Retail (Rs)</th>
                            <th className="px-2 py-1 text-center">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 bg-white text-slate-800">
                          {paginatedItems.length === 0 ? (
                            <tr>
                              <td colSpan={11} className="px-4 py-8 text-center text-slate-400 font-bold bg-white">
                                <div className="flex flex-col items-center justify-center space-y-1.5">
                                  <Package className="w-6 h-6 text-slate-300 mb-0.5" />
                                  <p className="text-xs font-bold text-slate-700">
                                    {(invLowStockFilter || invStockFilter === 'LOW_STOCK')
                                      ? 'All inventory medicines are currently above reorder levels! No low stock items found.'
                                      : 'No medicines match the search or category filter.'}
                                  </p>
                                  <div className="flex items-center space-x-2 pt-1">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setInvLowStockFilter(false);
                                        setInvStockFilter('ALL');
                                        setInvCategoryFilter('ALL');
                                        setInvSearchQuery('');
                                        setInvExpiryFilterScope('ALL');
                                        setInvCurrentPage(1);
                                      }}
                                      className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-[10.5px] font-bold transition cursor-pointer shadow-2xs"
                                    >
                                      Show All Active Stock ({inventoryStats.activeInStockCount} Medicines)
                                    </button>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          ) : (
                            paginatedItems.map((itm, idx) => {
                              const itemStock = Number(itm.CStock ?? (itm as any).Stock ?? 0);
                              const itemMinStock = (itm.MinStock !== undefined && itm.MinStock !== null) ? Number(itm.MinStock) : 1;
                              const isLowStock = itemStock <= itemMinStock;
                              const isClinical = itm.MedicineType === 'C';
                              const absoluteRowNumber = startIndex + idx + 1;

                              return (
                                <tr 
                                  key={`${itm.ItemID}-${absoluteRowNumber}`}
                                  className={`divide-x divide-slate-200 hover:bg-blue-50/70 transition ${
                                    isLowStock ? 'bg-rose-50/60' : idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'
                                  }`}
                                >
                                  {/* Row Header Number */}
                                  <td className="px-1.5 py-0.5 text-center font-mono text-[10px] font-bold text-slate-500 bg-slate-100/80">
                                    {absoluteRowNumber}
                                  </td>

                                  {/* Item ID */}
                                  <td className="px-1.5 py-0.5 font-mono text-[10.5px] font-bold text-slate-800">
                                    {itm.ItemID}
                                  </td>

                                  {/* Medicine Name & Badges */}
                                  <td className="px-2 py-0.5 font-bold text-slate-900">
                                    <div className="flex items-center space-x-1 flex-wrap gap-y-0.5">
                                      <span className="text-[11px]">{itm.ItemName}</span>
                                      
                                      {/* Dead Item Badge */}
                                      {(itm.IsDead || itm.Status === 'Dead' || itm.Status === 'DEAD') && (
                                        <span
                                          className="px-1 py-0 bg-rose-100 text-rose-900 rounded text-[8px] font-black border border-rose-300 flex items-center space-x-0.5"
                                          title={itm.DeadReason ? `Dead Item: ${itm.DeadReason}` : 'Marked as Dead Item'}
                                        >
                                          <span>💀 DEAD</span>
                                        </span>
                                      )}

                                      {/* Batch Count Pill */}
                                      {Array.isArray(itm.Batches) && itm.Batches.length > 0 ? (
                                        <button
                                          type="button"
                                          onClick={() => handleOpenBatchManager(itm)}
                                          className="px-1 py-0 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 hover:text-indigo-900 rounded text-[8.5px] font-mono border border-indigo-200 transition cursor-pointer flex items-center space-x-0.5"
                                          title={`Click to view and manage ${itm.Batches.length} batches`}
                                        >
                                          <Boxes className="w-2.5 h-2.5 mr-0.5" />
                                          <span>{itm.Batches.length} B</span>
                                        </button>
                                      ) : itm.BatchNo ? (
                                        <button
                                          type="button"
                                          onClick={() => handleOpenBatchManager(itm)}
                                          className="px-1 py-0 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[8.5px] font-mono border border-slate-300 transition cursor-pointer"
                                          title={`Batch #: ${itm.BatchNo}`}
                                        >
                                          B#: {itm.BatchNo}
                                        </button>
                                      ) : null}

                                      {/* Smart Expiry Badge */}
                                      {(() => {
                                        const expSummary = getItemExpirySummary(itm);
                                        if (!expSummary.earliestExpDate && !itm.ExpDate) return null;
                                        const rawExp = expSummary.earliestExpDate || itm.ExpDate;
                                        const displayExp = formatMonthYearDisplay(rawExp) || rawExp;
                                        
                                        if (expSummary.status === 'EXPIRED') {
                                          return (
                                            <button
                                              type="button"
                                              onClick={() => handleOpenBatchManager(itm)}
                                              className="px-1 py-0 bg-rose-100 hover:bg-rose-200 text-rose-900 rounded text-[8.5px] font-mono font-bold border border-rose-300 transition cursor-pointer flex items-center space-x-0.5"
                                              title={`EXPIRED on ${displayExp}!`}
                                            >
                                              <span className="w-1 h-1 rounded-full bg-rose-600 animate-ping mr-0.5"></span>
                                              <span>Exp: {displayExp}</span>
                                            </button>
                                          );
                                        }
                                        if (expSummary.status === 'PARTIAL_EXPIRED') {
                                          return (
                                            <button
                                              type="button"
                                              onClick={() => handleOpenBatchManager(itm)}
                                              className="px-1 py-0 bg-rose-50 hover:bg-rose-100 text-rose-800 rounded text-[8.5px] font-mono font-bold border border-rose-300 transition cursor-pointer"
                                              title={`Has expired lots`}
                                            >
                                              <span>Exp: {displayExp} (Part Exp)</span>
                                            </button>
                                          );
                                        }
                                        if (expSummary.status === 'NEAR_EXPIRY') {
                                          return (
                                            <button
                                              type="button"
                                              onClick={() => handleOpenBatchManager(itm)}
                                              className="px-1 py-0 bg-amber-100 hover:bg-amber-200 text-amber-950 rounded text-[8.5px] font-mono font-bold border border-amber-300 transition cursor-pointer flex items-center space-x-0.5"
                                              title={`Near Expiry: ${(expSummary as any).daysUntilExpiry || 0} days left`}
                                            >
                                              <span>Exp: {displayExp} ({(expSummary as any).daysUntilExpiry || 0}d)</span>
                                            </button>
                                          );
                                        }
                                        return (
                                          <button
                                            type="button"
                                            onClick={() => handleOpenBatchManager(itm)}
                                            className="px-1 py-0 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 rounded text-[8.5px] font-mono border border-emerald-300 transition cursor-pointer"
                                            title={`Valid Expiry: ${displayExp}`}
                                          >
                                            Exp: {displayExp}
                                          </button>
                                        );
                                      })()}

                                      {isLowStock && (
                                        <span className="px-1 py-0 bg-rose-600 text-white rounded text-[7.5px] font-black uppercase tracking-wider animate-pulse">
                                          Low Stock
                                        </span>
                                      )}
                                    </div>
                                  </td>

                                  {/* Category / Unit */}
                                  <td className="px-1.5 py-0.5 font-mono text-[10.5px] font-semibold text-slate-700">
                                    {itm.Unit || 'Tab'}
                                  </td>

                                  {/* Type */}
                                  <td className="px-1.5 py-0.5 text-center">
                                    <span className={`px-1 py-0.2 rounded text-[8px] font-black uppercase ${
                                      isClinical ? 'bg-indigo-100 text-indigo-800' : 'bg-emerald-100 text-emerald-800'
                                    }`}>
                                      {isClinical ? 'Clinical' : 'Patent'}
                                    </span>
                                  </td>

                                  {/* Current Stock (Direct Excel Cell Editing & Quick +/- Buttons) */}
                                  <td className="px-1.5 py-0.5 bg-emerald-50/30">
                                    <div className="flex items-center justify-end space-x-0.5">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          if (setItems) {
                                            const newStock = Math.max(0, itemStock - 1);
                                            const updated = { ...itm, CStock: newStock };
                                            setItems(prev => prev.map(i => i.ItemID === itm.ItemID ? updated : i));
                                            syncItemToBackend('UPDATE', updated);
                                          }
                                        }}
                                        className="w-4 h-4 bg-slate-200 hover:bg-rose-200 text-slate-700 hover:text-rose-900 rounded font-bold text-[10px] flex items-center justify-center transition cursor-pointer"
                                        title="Decrease Current Stock by 1"
                                      >
                                        -
                                      </button>
                                      <input
                                        type="number"
                                        min="0"
                                        value={itemStock}
                                        onChange={(e) => {
                                          const val = e.target.value === '' ? 0 : Math.max(0, Number(e.target.value));
                                          if (setItems) {
                                            const updated = { ...itm, CStock: val };
                                            setItems(prev => prev.map(i => i.ItemID === itm.ItemID ? updated : i));
                                            syncItemToBackend('UPDATE', updated);
                                          }
                                        }}
                                        className={`w-12 py-0 px-1 text-right text-[10.5px] font-mono font-black rounded border ${
                                          isLowStock
                                            ? 'bg-rose-100 border-rose-400 text-rose-950 focus:ring-1 focus:ring-rose-500'
                                            : 'bg-white border-slate-300 text-slate-900 focus:ring-1 focus:ring-emerald-500'
                                        }`}
                                        title="Direct Excel Cell Edit: Current Stock"
                                      />
                                      <button
                                        type="button"
                                        onClick={() => {
                                          if (setItems) {
                                            const newStock = itemStock + 1;
                                            const updated = { ...itm, CStock: newStock };
                                            setItems(prev => prev.map(i => i.ItemID === itm.ItemID ? updated : i));
                                            syncItemToBackend('UPDATE', updated);
                                          }
                                        }}
                                        className="w-4 h-4 bg-slate-200 hover:bg-emerald-200 text-slate-700 hover:text-emerald-900 rounded font-bold text-[10px] flex items-center justify-center transition cursor-pointer"
                                        title="Increase Current Stock by 1"
                                      >
                                        +
                                      </button>
                                    </div>
                                  </td>

                                  {/* Min Threshold Direct Cell Edit */}
                                  <td className="px-1.5 py-0.5 text-right bg-slate-50/50">
                                    <input
                                      type="number"
                                      min="0"
                                      value={(itm.MinStock !== undefined && itm.MinStock !== null) ? itm.MinStock : 1}
                                      onChange={(e) => {
                                        const val = e.target.value === '' ? 0 : Math.max(0, Number(e.target.value));
                                        if (setItems) {
                                          const updated = { ...itm, MinStock: val };
                                          setItems(prev => prev.map(i => i.ItemID === itm.ItemID ? updated : i));
                                          syncItemToBackend('UPDATE', updated);
                                        }
                                      }}
                                      className="w-10 py-0 px-1 text-right text-[10.5px] font-mono font-bold bg-white border border-slate-300 rounded text-slate-700 focus:ring-1 focus:ring-indigo-500"
                                      title="Direct Excel Cell Edit: Min Threshold"
                                    />
                                  </td>

                                  {/* PO Reorder Qty Direct Cell Edit */}
                                  <td className="px-1.5 py-0.5 text-right bg-indigo-50/30">
                                    <input
                                      type="number"
                                      min="0"
                                      value={itm.ReorderQty || 0}
                                      onChange={(e) => {
                                        const val = e.target.value === '' ? 0 : Math.max(0, Number(e.target.value));
                                        if (setItems) {
                                          const updated = { ...itm, ReorderQty: val };
                                          setItems(prev => prev.map(i => i.ItemID === itm.ItemID ? updated : i));
                                          syncItemToBackend('UPDATE', updated);
                                        }
                                      }}
                                      className="w-12 py-0 px-1 text-right text-[10.5px] font-mono font-black bg-white border border-indigo-300 rounded text-indigo-950 focus:ring-1 focus:ring-indigo-500"
                                      title="Direct Excel Cell Edit: Purchase Order Reorder Qty"
                                    />
                                  </td>

                                  {/* Unit Cost (Rs) Direct Cell Edit */}
                                  <td className="px-1.5 py-0.5 text-right font-mono">
                                    <input
                                      type="number"
                                      step="0.01"
                                      min="0"
                                      value={itm.PurchasePrice}
                                      onChange={(e) => {
                                        const val = e.target.value === '' ? 0 : Math.max(0, Number(e.target.value));
                                        if (setItems) {
                                          const updated = { ...itm, PurchasePrice: val };
                                          setItems(prev => prev.map(i => i.ItemID === itm.ItemID ? updated : i));
                                          syncItemToBackend('UPDATE', updated);
                                        }
                                      }}
                                      className="w-14 py-0 px-1 text-right text-[10.5px] font-mono font-medium bg-white border border-slate-300 rounded text-slate-800 focus:ring-1 focus:ring-blue-500"
                                      title="Direct Excel Cell Edit: Unit Purchase Price"
                                    />
                                  </td>

                                  {/* Retail Price (Rs) Direct Cell Edit */}
                                  <td className="px-1.5 py-0.5 text-right font-mono">
                                    <input
                                      type="number"
                                      step="0.01"
                                      min="0"
                                      value={itm.Price}
                                      onChange={(e) => {
                                        const val = e.target.value === '' ? 0 : Math.max(0, Number(e.target.value));
                                        if (setItems) {
                                          const updated = { ...itm, Price: val };
                                          setItems(prev => prev.map(i => i.ItemID === itm.ItemID ? updated : i));
                                          syncItemToBackend('UPDATE', updated);
                                        }
                                      }}
                                      className="w-15 py-0 px-1 text-right text-[10.5px] font-mono font-extrabold bg-white border border-slate-300 rounded text-slate-900 focus:ring-1 focus:ring-emerald-500"
                                      title="Direct Excel Cell Edit: Retail Selling Price"
                                    />
                                  </td>

                                  {/* Actions */}
                                  <td className="px-1.5 py-0.5 text-center">
                                    <div className="flex justify-center items-center space-x-0.5">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const isDead = Boolean(itm.IsDead || itm.Status === 'Dead' || itm.Status === 'DEAD');
                                          handleUpdateItemDeadStatus(itm.ItemID, !isDead);
                                        }}
                                        className={`p-0.5 rounded transition cursor-pointer ${
                                          (itm.IsDead || itm.Status === 'Dead' || itm.Status === 'DEAD')
                                            ? 'text-rose-600 bg-rose-100 hover:bg-rose-200'
                                            : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                                        }`}
                                        title={(itm.IsDead || itm.Status === 'Dead' || itm.Status === 'DEAD') ? "Marked as Dead Item (Click to mark Active)" : "Click to mark as Dead Item"}
                                      >
                                        <AlertOctagon className="w-3 h-3" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleOpenBatchManager(itm)}
                                        className="p-0.5 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-100 rounded transition cursor-pointer"
                                        title="Manage Batches, Lots & Expiry Dates"
                                      >
                                        <Boxes className="w-3 h-3" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleSelectEditItem(itm)}
                                        className="p-0.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-100 rounded transition cursor-pointer"
                                        title="Full Parameter Edit Dialog"
                                      >
                                        <Edit className="w-3 h-3" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveItem(itm.ItemID, itm.ItemName)}
                                        disabled={!canAdd}
                                        className={`p-0.5 rounded transition cursor-pointer ${
                                          canAdd ? 'text-slate-500 hover:text-rose-600 hover:bg-rose-100' : 'text-slate-300 cursor-not-allowed'
                                        }`}
                                        title="Delete Medicine Row"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Bottom Pagination Controls Toolbar */}
                    {!isAllPage && totalPages > 1 && (
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-1.5 bg-slate-100 p-1.5 rounded-lg border border-slate-200 text-[11px]">
                        <div className="flex items-center space-x-1 text-slate-600 font-medium">
                          <span>Page <strong className="text-slate-900">{currentPageSafe}</strong> of <strong className="text-slate-900">{totalPages}</strong></span>
                          <span className="text-slate-400">({totalItemsCount} items)</span>
                        </div>

                        {/* Page Navigation Buttons */}
                        <div className="flex items-center space-x-1">
                          <button
                            type="button"
                            onClick={() => setInvCurrentPage(1)}
                            disabled={currentPageSafe <= 1}
                            className="p-1 rounded border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 transition cursor-pointer"
                            title="First Page"
                          >
                            <ChevronsLeft className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => setInvCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPageSafe <= 1}
                            className="px-2 py-0.5 rounded border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 font-bold flex items-center space-x-0.5 transition cursor-pointer text-[10px]"
                          >
                            <ChevronLeft className="w-3 h-3" />
                            <span>Prev</span>
                          </button>

                          {/* Dynamic Page Pills */}
                          <div className="flex items-center space-x-0.5">
                            {getVisiblePages().map((p, pIdx) => {
                              if (p === '...') {
                                return (
                                  <span key={`dots-${pIdx}`} className="px-1 py-0.5 text-slate-400 font-bold text-[10px]">
                                    ...
                                  </span>
                                );
                              }
                              const pageNum = Number(p);
                              const isActive = pageNum === currentPageSafe;
                              return (
                                <button
                                  key={`page-${pageNum}`}
                                  type="button"
                                  onClick={() => setInvCurrentPage(pageNum)}
                                  className={`w-6 h-6 rounded font-bold text-[10.5px] transition cursor-pointer font-mono ${
                                    isActive
                                      ? 'bg-indigo-600 text-white shadow-2xs'
                                      : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
                                  }`}
                                >
                                  {pageNum}
                                </button>
                              );
                            })}
                          </div>

                          <button
                            type="button"
                            onClick={() => setInvCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            disabled={currentPageSafe >= totalPages}
                            className="px-2 py-0.5 rounded border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 font-bold flex items-center space-x-0.5 transition cursor-pointer text-[10px]"
                          >
                            <span>Next</span>
                            <ChevronRight className="w-3 h-3" />
                          </button>

                          <button
                            type="button"
                            onClick={() => setInvCurrentPage(totalPages)}
                            disabled={currentPageSafe >= totalPages}
                            className="p-1 rounded border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 transition cursor-pointer"
                            title="Last Page"
                          >
                            <ChevronsRight className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Direct Jump to Page */}
                        <div className="flex items-center space-x-1">
                          <label className="text-[10px] font-bold text-slate-500">Go:</label>
                          <input
                            type="number"
                            min={1}
                            max={totalPages}
                            value={currentPageSafe}
                            onChange={(e) => {
                              const v = Number(e.target.value);
                              if (v >= 1 && v <= totalPages) {
                                setInvCurrentPage(v);
                              }
                            }}
                            className="w-10 py-0.5 px-1 text-center text-[10.5px] font-mono font-bold bg-white border border-slate-300 rounded text-slate-800 focus:ring-1 focus:ring-indigo-500"
                          />
                        </div>
                      </div>
                    )}

                    {/* Excel Sheet Status Bar */}
                    <div className="bg-slate-800 text-slate-200 px-3 py-1.5 rounded-lg text-[10.5px] font-mono flex flex-wrap items-center justify-between gap-2 border border-slate-700 shadow-inner">
                      <div className="flex items-center space-x-3">
                        <span>
                          Rows: <strong className="text-white">{processedItems.length}</strong> / {items.length}
                        </span>
                        <span className="text-slate-500">|</span>
                        <span>
                          Low: <strong className="text-rose-400">{processedItems.filter(i => i.CStock <= ((i.MinStock !== undefined && i.MinStock !== null) ? i.MinStock : 1)).length}</strong>
                        </span>
                      </div>

                      <div className="flex items-center space-x-3">
                        <span>
                          Cost: <strong className="text-amber-300">Rs. {totalValuationCost.toLocaleString('en-PK', { minimumFractionDigits: 2 })}</strong>
                        </span>
                        <span className="text-slate-500">|</span>
                        <span>
                          Retail: <strong className="text-emerald-300">Rs. {totalValuationRetail.toLocaleString('en-PK', { minimumFractionDigits: 2 })}</strong>
                        </span>
                        <span className="text-slate-500">|</span>
                        <button
                          type="button"
                          onClick={() => handlePrintStockGrid()}
                          className="px-2 py-0.5 bg-slate-700 hover:bg-slate-600 text-indigo-300 hover:text-white rounded border border-slate-600 font-sans font-bold text-[10px] flex items-center space-x-1 transition cursor-pointer shadow-2xs"
                          title="Print this sheet on A4 paper"
                        >
                          <Printer className="w-3 h-3" />
                          <span>Print</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })()}

            </div>

        </div>
      </div>
        )
      )}

      {/* Dedicated Custom Reports Full Page View */}
      {activeSubTab === 'custom_reports' && (
        <div className="space-y-4 animate-fadeIn" id="pos-custom-reports-tab">
          <PharmacyCustomReportsModal
            isOpen={true}
            mode="page"
            onClose={() => handleSubTabSwitch('inventory_manager', 'Stock & Manager')}
            items={items}
            categories={categories}
            invoices={invoices}
            invoiceDetails={invoiceDetails}
            clinicSettings={clinicSettings}
            currentUser={currentUser}
          />
        </div>
      )}

      {/* Clinic Medicine Label Printer Tab */}
      {/* Invoice logs Tab */}
      <PharmacyInvoiceLogsTab
        activeSubTab={activeSubTab}
        invoices={invoices}
        invoiceDetails={invoiceDetails}
        items={items}
        patients={allKnownPatients}
        selectedDailyReportDate={selectedDailyReportDate}
        setSelectedDailyReportDate={setSelectedDailyReportDate}
        salesReportPeriodMode={salesReportPeriodMode}
        setSalesReportPeriodMode={setSalesReportPeriodMode}
        salesReportStartDate={salesReportStartDate}
        setSalesReportStartDate={setSalesReportStartDate}
        salesReportEndDate={salesReportEndDate}
        setSalesReportEndDate={setSalesReportEndDate}
        handlePrintDailySalesReport={handlePrintDailySalesReport}
        handlePrintA4Invoice={handlePrintA4Invoice}
        handlePrintThermalReceipt={handlePrintThermalReceipt}
        handleOpenInvoicePrintModal={handleOpenInvoicePrintModal}
        onVoidInvoice={onVoidInvoice}
        currentUser={currentUser}
      />

      {/* Sales Returns Tab */}
      <PharmacyReturnsTab
        activeSubTab={activeSubTab}
        salesReturns={salesReturns}
        returnDetails={returnDetails}
        returnSearchTerm={returnSearchTerm}
        setReturnSearchTerm={setReturnSearchTerm}
        returnDateFilter={returnDateFilter}
        setReturnDateFilter={setReturnDateFilter}
        isReturnSubmitting={isReturnSubmitting}
        setIsReturnSubmitting={setIsReturnSubmitting}
        items={items}
        invoices={invoices}
        invoiceDetails={invoiceDetails}
        onAddSalesReturn={onAddSalesReturn}
        patients={allKnownPatients}
        clinicSettings={clinicSettings}
        setItems={setItems}
        currentUser={currentUser}
      />

      {/* Clinical Medicine Sticker Labels Tab */}
      <PharmacyClinicalLabelsTab
        activeSubTab={activeSubTab}
        labelPatientId={labelPatientId}
        setLabelPatientId={setLabelPatientId}
        labelVisitId={labelVisitId}
        setLabelVisitId={setLabelVisitId}
        labelSearchQuery={labelSearchQuery}
        setLabelSearchQuery={setLabelSearchQuery}
        customLabelStates={customLabelStates}
        setCustomLabelStates={setCustomLabelStates}
        allKnownPatients={allKnownPatients}
        visits={visits}
        visitMedicines={visitMedicines}
        items={items}
        getVisitMedicinesList={getVisitMedicinesList}
        setIsLabelPrintModalOpen={setIsLabelPrintModalOpen}
        setLabelPrintData={setLabelPrintData}
      />

      {/* Clinical Medicine Sticker Label Print-Preview Modal Overlay */}
      <PharmacyLabelPrintModal
        isLabelPrintModalOpen={isLabelPrintModalOpen}
        setIsLabelPrintModalOpen={setIsLabelPrintModalOpen}
        labelPrintData={labelPrintData}
        clinicSettings={clinicSettings}
        setLabelPrintData={setLabelPrintData}
        handleCleanLabelPrint={handleCleanLabelPrint}
        currentUser={currentUser}
      />

      {/* Pharmacy Invoice Print-Preview Modal Overlay (Supports A4 & Thermal POS Receipt) */}
      <PharmacyPrintInvoiceModal
        printModalOpen={printModalOpen}
        setPrintModalOpen={setPrintModalOpen}
        printBillData={printBillData}
        printModalFormat={printModalFormat}
        setPrintModalFormat={setPrintModalFormat}
        handlePrintA4Invoice={handlePrintA4Invoice}
        handlePrintThermalReceipt={handlePrintThermalReceipt}
        items={items}
        clinicSettings={clinicSettings}
      />

      {/* Dynamic Vendor Directory & Grid-View Modal */}
      <PharmacyVendorModal
        isVendorModalOpen={isVendorModalOpen}
        setIsVendorModalOpen={setIsVendorModalOpen}
        suppliers={suppliers}
        supplierFormId={supplierFormId}
        setSupplierFormId={setSupplierFormId}
        supplierFormName={supplierFormName}
        setSupplierFormName={setSupplierFormName}
        supplierFormPhone={supplierFormPhone}
        setSupplierFormPhone={setSupplierFormPhone}
        supplierFormCompany={supplierFormPhone}
        setSupplierFormCompany={setSupplierFormPhone}
        supplierFormAddress={supplierFormAddress}
        setSupplierFormAddress={setSupplierFormAddress}
        isEditingSupplier={Boolean(editingSupplier)}
        editingSupplierSid={editingSupplier?.SID || null}
        handleSaveSupplier={handleSaveSupplier}
        handleDeleteSupplier={handleDeleteSupplier}
        handleSelectEditSupplier={handleSelectEditSupplier}
        resetSupplierForm={resetSupplierForm}
      />

      {/* Patent Medicine Sourcing / Purchase Requisition Quick Modal */}
      <PharmacyPatentSourcingModal
        showPatentSourcingModal={showPatentSourcingModal}
        setShowPatentSourcingModal={setShowPatentSourcingModal}
        selectedPatientId={selectedPatientId}
        selectedPatientName={selectedPatientName}
        patentSourcingNote={patentSourcingNote}
        setPatentSourcingNote={setPatentSourcingNote}
        handleConfirmPatentSourcing={handleConfirmPatentSourcing}
      />

      {/* Add / Edit Medicine Item Modal */}
      <PharmacyAddMedicineModal
        isAddMedicineModalOpen={isAddMedicineModalOpen}
        setIsAddMedicineModalOpen={setIsAddMedicineModalOpen}
        isEditingMedicine={Boolean(editingItem)}
        editingMedicineId={editingItem?.ItemID || null}
        medFormId={itemFormId}
        setMedFormId={setItemFormId}
        medFormName={itemFormName}
        setMedFormName={setItemFormName}
        medFormUnit={itemFormUnit}
        setMedFormUnit={setItemFormUnit}
        medFormType={itemFormMedicineType}
        setMedFormType={setItemFormMedicineType}
        medFormFormula={''}
        setMedFormFormula={() => {}}
        medFormCost={itemFormPurchasePrice}
        setMedFormCost={setItemFormPurchasePrice}
        medFormPrice={itemFormRetailPrice}
        setMedFormPrice={setItemFormRetailPrice}
        medFormStock={itemFormCStock}
        setMedFormStock={setItemFormCStock}
        medFormMinStock={itemFormMinStock}
        setMedFormMinStock={setItemFormMinStock}
        medFormRack={''}
        setMedFormRack={() => {}}
        medFormSupplier={''}
        setMedFormSupplier={() => {}}
        medFormBarcode={itemFormVendorBarcode}
        setMedFormBarcode={setItemFormVendorBarcode}
        medFormExpDate={itemFormExpDate}
        setMedFormExpDate={setItemFormExpDate}
        medFormBatchNo={itemFormBatchNo}
        setMedFormBatchNo={setItemFormBatchNo}
        medFormReorderQty={itemFormReorderQty}
        setMedFormReorderQty={setItemFormReorderQty}
        medFormMaxStock={''}
        setMedFormMaxStock={() => {}}
        handleSaveMedicine={handleSaveItem}
        setIsCategoryModalOpen={setIsCategoryModalOpen}
        medicineCategories={categories}
        suppliers={suppliers}
      />

      {/* Master A4 Purchase Order Print Dialog & Preview Modal */}
      <PharmacyPoPrintPreviewModal
        isPOPrintPreviewOpen={isPOPrintPreviewOpen}
        setIsPOPrintPreviewOpen={setIsPOPrintPreviewOpen}
        items={items}
        poCategoryFilter={poCategoryFilter}
        poOnlyLowStock={poOnlyLowStock}
        poPrintLayout={poPrintLayout}
        setPoPrintLayout={setPoPrintLayout}
        clinicSettings={clinicSettings}
        handleOpenPoPrintWindow={handleOpenPoPrintWindow}
        getFilteredPoItems={getFilteredPoItems}
      />

      {/* Category Add & Edit Modal */}
      <PharmacyCategoryModal
        isCategoryModalOpen={isCategoryModalOpen}
        setIsCategoryModalOpen={setIsCategoryModalOpen}
        setEditingCatIndex={setEditingCatIndex}
        setCatErrorMsg={setCatErrorMsg}
        setCatSuccessMsg={setCatSuccessMsg}
        catSuccessMsg={catSuccessMsg}
        catErrorMsg={catErrorMsg}
        handleAddCategory={handleAddCategory}
        handleEditCategory={handleSaveEditCategory}
        handleDeleteCategory={handleDeleteCategory}
        newCategoryName={newCatInput}
        setNewCategoryName={setNewCatInput}
        editingCatIndex={editingCatIndex}
        editingCatName={editingCatName}
        setEditingCatName={setEditingCatName}
        medicineCategories={categories}
        items={items}
      />

      {/* Multi-Batch & Expiry Lots Management Modal */}
      <PharmacyBatchesModal
        isBatchesModalOpen={isBatchesModalOpen}
        selectedBatchItem={selectedBatchItem}
        setIsBatchesModalOpen={setIsBatchesModalOpen}
        setSelectedBatchItem={setSelectedBatchItem}
        setEditingBatchId={setEditingBatchId}
        batchModalMsg={batchModalMsg}
        editingBatchId={editingBatchId}
        batchFormNo={batchFormNo}
        setBatchFormNo={setBatchFormNo}
        batchFormMfgDate={batchFormMfgDate}
        setBatchFormMfgDate={setBatchFormMfgDate}
        batchFormExpDate={batchFormExpDate}
        setBatchFormExpDate={setBatchFormExpDate}
        batchFormQty={batchFormQty}
        setBatchFormQty={setBatchFormQty}
        batchFormCost={batchFormCost}
        setBatchFormCost={setBatchFormCost}
        batchFormSalePrice={batchFormSalePrice}
        setBatchFormSalePrice={setBatchFormSalePrice}
        batchFormPoGrnRef={batchFormPoGrnRef}
        setBatchFormPoGrnRef={setBatchFormPoGrnRef}
        handleStartEditBatch={handleStartEditBatch}
        handleDeleteBatch={handleDeleteBatch}
        handleSaveBatch={handleSaveBatch}
      />

      {/* Item QR Code Scanner Modal */}
      <ItemQRScannerModal
        isOpen={isQRScannerOpen}
        onClose={() => setIsQRScannerOpen(false)}
        onScanSuccess={handleQRScanResult}
      />

      {/* Item QR Code Generator & Label Print Modal */}
      <ItemQRGeneratorModal
        isOpen={isQRGeneratorOpen}
        onClose={() => setIsQRGeneratorOpen(false)}
        items={items}
        clinicName={clinicSettings?.Name || "Smart Clinic Pharmacy"}
      />

      {/* PWA Mobile App Install Modal */}
      <PwaInstallModal
        isOpen={isPwaModalOpen}
        onClose={() => setIsPwaModalOpen(false)}
        onLaunchStoreMode={() => handleSubTabSwitch("store_sales", "Store Medicine")}
      />

      {/* Bulk Medicine Expiry Date Updater Modal */}
      <PharmacyBulkExpiryModal
        isOpen={isBulkExpiryModalOpen}
        onClose={() => setIsBulkExpiryModalOpen(false)}
        items={items}
        categories={categories}
        onBulkUpdateExpiry={handleBulkUpdateExpiry}
      />

      {/* Dead Items & Obsolete Inventory Manager Modal */}
      <PharmacyDeadItemsModal
        isOpen={isDeadItemsModalOpen}
        onClose={() => setIsDeadItemsModalOpen(false)}
        items={items}
        categories={categories}
        onUpdateItemDeadStatus={handleUpdateItemDeadStatus}
        onBulkUpdateDeadStatus={handleBulkUpdateDeadStatus}
      />

      {/* Parameter-Based Custom Reports Generator Modal */}
      <PharmacyCustomReportsModal
        isOpen={isCustomReportsModalOpen}
        onClose={() => setIsCustomReportsModalOpen(false)}
        items={items}
        categories={categories}
        invoices={invoices}
        invoiceDetails={invoiceDetails}
        clinicSettings={clinicSettings}
        currentUser={currentUser}
      />
    </div>
  );
}
