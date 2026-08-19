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
  ChevronsLeft,
  ChevronsRight,
  Receipt,
  Boxes,
  Clock,
  CheckCheck,
  Layers3
} from 'lucide-react';
import ItemQRScannerModal from './ItemQRScannerModal';
import ItemQRGeneratorModal from './ItemQRGeneratorModal';
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

export const isBatchExpired = (expDate?: string) => {
  if (!expDate || !expDate.trim()) return false;
  try {
    const clean = expDate.trim();
    const parts = clean.split('-');
    let expTimestamp = 0;
    if (parts.length === 3) {
      expTimestamp = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]), 23, 59, 59).getTime();
    } else if (parts.length === 2) {
      // YYYY-MM
      expTimestamp = new Date(Number(parts[0]), Number(parts[1]), 0, 23, 59, 59).getTime();
    } else {
      expTimestamp = new Date(clean).getTime();
    }
    return !isNaN(expTimestamp) && expTimestamp < Date.now();
  } catch {
    return false;
  }
};

export const isBatchNearExpiry = (expDate?: string, days = 90) => {
  if (!expDate || !expDate.trim()) return false;
  try {
    const clean = expDate.trim();
    const parts = clean.split('-');
    let expTimestamp = 0;
    if (parts.length === 3) {
      expTimestamp = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]), 23, 59, 59).getTime();
    } else if (parts.length === 2) {
      expTimestamp = new Date(Number(parts[0]), Number(parts[1]), 0, 23, 59, 59).getTime();
    } else {
      expTimestamp = new Date(clean).getTime();
    }
    if (isNaN(expTimestamp)) return false;
    const diffDays = (expTimestamp - Date.now()) / (1000 * 60 * 60 * 24);
    return diffDays >= 0 && diffDays <= days;
  } catch {
    return false;
  }
};

export const getItemExpirySummary = (item: Item) => {
  const batches = Array.isArray(item.Batches) && item.Batches.length > 0
    ? item.Batches
    : (item.ExpDate ? [{
        BatchID: `${item.ItemID}-legacy`,
        ItemID: item.ItemID,
        ItemName: item.ItemName,
        BatchNo: item.BatchNo || 'B#1',
        ExpDate: item.ExpDate,
        MfgDate: item.MfgDate || '',
        Qty: item.CStock,
        InitialQty: item.CStock,
        PurchasePrice: item.PurchasePrice,
        SalePrice: item.Price,
        Status: 'ACTIVE' as const,
        CreatedAt: ''
      }] : []);

  if (batches.length === 0) {
    return { status: 'NO_EXPIRY', label: 'No Expiry', count: 0, expiredQty: 0, nearExpiryQty: 0, activeQty: item.CStock, earliestExpDate: '' };
  }

  let expiredQty = 0;
  let nearExpiryQty = 0;
  let activeQty = 0;
  let earliestExpDate = '';

  batches.forEach(b => {
    const q = Number(b.Qty) || 0;
    if (isBatchExpired(b.ExpDate)) {
      expiredQty += q;
    } else if (isBatchNearExpiry(b.ExpDate)) {
      nearExpiryQty += q;
    } else {
      activeQty += q;
    }
    if (b.ExpDate && (!earliestExpDate || b.ExpDate < earliestExpDate)) {
      earliestExpDate = b.ExpDate;
    }
  });

  if (expiredQty > 0 && activeQty === 0 && nearExpiryQty === 0) {
    return { status: 'EXPIRED', label: 'Expired Lot', count: batches.length, expiredQty, nearExpiryQty, activeQty, earliestExpDate };
  }
  if (expiredQty > 0) {
    return { status: 'PARTIAL_EXPIRED', label: `${expiredQty} Expired`, count: batches.length, expiredQty, nearExpiryQty, activeQty, earliestExpDate };
  }
  if (nearExpiryQty > 0) {
    return { status: 'NEAR_EXPIRY', label: 'Expiring Soon', count: batches.length, expiredQty, nearExpiryQty, activeQty, earliestExpDate };
  }
  return { status: 'ACTIVE', label: 'Active', count: batches.length, expiredQty, nearExpiryQty, activeQty, earliestExpDate };
};


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

const MEDICINE_CATEGORIES = [
  'BM Drops',
  'Q D DROPS',
  'Potency 30',
  'Potency 200',
  'Syrup',
  'Drops',
  'Tab',
  'Cap',
  'Injection',
  'Ointment',
  'Cream',
  'Solution',
  'Powder',
  'Suspension',
  'Gel',
  'Sachet',
  'Amp',
  'Bottle',
  'Gram',
  'ML'
];

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

  // Navigation tabs
  const [activeSubTab, setActiveSubTab] = useState<'checkout' | 'store_sales' | 'return' | 'grn' | 'inventory_manager' | 'invoice_logs' | 'clinical_labels' | 'barcode_mapper'>('checkout');
  const [isSubTabLoading, setIsSubTabLoading] = useState(false);
  const [subTabLoadingMsg, setSubTabLoadingMsg] = useState('Loading Sub-module...');

  const handleSubTabSwitch = (newSubTab: typeof activeSubTab, label: string) => {
    if (newSubTab === activeSubTab) return;
    setSubTabLoadingMsg(`Opening ${label}...`);
    setIsSubTabLoading(true);
    setActiveSubTab(newSubTab);
    setTimeout(() => {
      setIsSubTabLoading(false);
    }, 280);
  };

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
    setItemFormMfgDate(itm.MfgDate || '');
    setItemFormExpDate(itm.ExpDate || '');
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
    const mfgDateVal = itemFormMfgDate.trim() || undefined;
    const expDateVal = itemFormExpDate.trim() || undefined;

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
          MfgDate: mfgDateVal || new Date().toISOString().split('T')[0],
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
    setBatchFormMfgDate(new Date().toISOString().split('T')[0]);
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
    setBatchFormMfgDate(batch.MfgDate || '');
    setBatchFormExpDate(batch.ExpDate || '');
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

    // Existing batches array or migrate legacy item batch
    const existingBatches: ItemBatch[] = Array.isArray(selectedBatchItem.Batches) && selectedBatchItem.Batches.length > 0
      ? [...selectedBatchItem.Batches]
      : (selectedBatchItem.CStock > 0 || selectedBatchItem.BatchNo || selectedBatchItem.ExpDate
          ? [{
              BatchID: `${selectedBatchItem.ItemID}-B-initial`,
              ItemID: selectedBatchItem.ItemID,
              ItemName: selectedBatchItem.ItemName,
              BatchNo: selectedBatchItem.BatchNo || 'B# 001',
              MfgDate: selectedBatchItem.MfgDate || '',
              ExpDate: selectedBatchItem.ExpDate || '',
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
            MfgDate: batchFormMfgDate.trim(),
            ExpDate: batchFormExpDate.trim(),
            Qty: qty,
            PurchasePrice: batchFormCost === '' ? b.PurchasePrice : Number(batchFormCost),
            SalePrice: batchFormSalePrice === '' ? b.SalePrice : Number(batchFormSalePrice),
            GRNID: batchFormPoGrnRef.trim() || b.GRNID,
            Status: qty === 0 ? 'EXHAUSTED' : isBatchExpired(batchFormExpDate.trim()) ? 'EXPIRED' : 'ACTIVE'
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
        MfgDate: batchFormMfgDate.trim(),
        ExpDate: batchFormExpDate.trim(),
        PurchasePrice: batchFormCost === '' ? selectedBatchItem.PurchasePrice : Number(batchFormCost),
        SalePrice: batchFormSalePrice === '' ? selectedBatchItem.Price : Number(batchFormSalePrice),
        Qty: qty,
        InitialQty: qty,
        GRNID: batchFormPoGrnRef.trim() || undefined,
        Status: qty === 0 ? 'EXHAUSTED' : isBatchExpired(batchFormExpDate.trim()) ? 'EXPIRED' : 'ACTIVE',
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
    setBatchFormMfgDate(new Date().toISOString().split('T')[0]);
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
  const [invCategoryFilter, setInvCategoryFilter] = useState<string>('BM Drops');
  const [invLowStockFilter, setInvLowStockFilter] = useState<boolean>(false);
  const [categorySidebarSearch, setCategorySidebarSearch] = useState<string>('');

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
      { id: 'BM Drops', label: 'BM Drops', isFeatured: true },
      { id: 'ALL', label: 'All Categories' },
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

    const lowStockCount = catItems.filter((itm) => itm.CStock <= ((itm.MinStock !== undefined && itm.MinStock !== null) ? itm.MinStock : 1)).length;

    return { catItemsCount: catItems.length, totalReqQty, lowStockCount };
  }, [items]);

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

  // 1. Official A4 Size Invoice Print Handler
  const handlePrintA4Invoice = (billData: {
    patient: Patient | null;
    basket: { ItemID: string; Qty: number; Price: number; MedicineType?: 'C' | 'P' | 'S' }[];
    discount: number;
    netAmount: number;
    shift: 1 | 2;
    invoiceNo: string;
    invoiceDate: string;
  }) => {
    if (currentUser?.Role !== 'Administrator' && (currentUser?.Permissions?.canPrintPOSInvoice === false || userRights.find(r => r.MenuID === 'pharmacy')?.PrintRec === false)) {
      alert("Printing Pharmacy POS Bills is restricted by administrator permissions.");
      return;
    }

    const win = window.open('', '_blank', 'width=1050,height=900');
    if (!win) {
      alert("Pop-up blocker prevented opening print window. Please allow pop-ups for this site.");
      return;
    }

    const clinicName = clinicSettings?.ClinicName || "Punjab Homeopathic Clinic & Pharmacy";
    const clinicAddress = clinicSettings?.ClinicAddress || clinicSettings?.Address || "Opposite State Bank, Mall Road, Lahore";
    const clinicPhone = clinicSettings?.PhoneMobile || clinicSettings?.PhoneNo || "042-3111222 / 0300-1234567";
    const clinicTagline = clinicSettings?.ClinicLogoText || "Consultation, Clinical Compounding & Retail Pharmacy";
    const logoSrc = clinicSettings?.ClinicLogoImage || clinicSettings?.Logo || '/logo.png';
    const printTimeStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

    const grossTotal = billData.basket.reduce((sum, item) => sum + item.Qty * item.Price, 0);
    const amountInWords = convertNumberToWords(billData.netAmount);

    win.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>A4 Invoice - ${billData.invoiceNo} - ${clinicName}</title>
          <style>
            @page {
              size: A4 portrait;
              margin: 10mm 12mm 12mm 12mm;
            }
            * {
              box-sizing: border-box;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
              margin: 0;
              padding: 0;
              color: #0f172a;
              font-size: 11px;
              line-height: 1.4;
              background: #fff;
            }
            .invoice-wrapper {
              border: 2px solid #0f172a;
              border-radius: 8px;
              padding: 16px;
              min-height: 270mm;
              display: flex;
              flex-direction: column;
              justify-content: space-between;
            }
            .header-container {
              display: flex;
              align-items: center;
              justify-content: space-between;
              border-bottom: 2px solid #0f172a;
              padding-bottom: 12px;
              margin-bottom: 12px;
            }
            .brand-box {
              display: flex;
              align-items: center;
              gap: 12px;
            }
            .brand-logo {
              width: 55px;
              height: 55px;
              object-fit: contain;
            }
            .clinic-title {
              font-size: 20px;
              font-weight: 900;
              color: #1e1b4b;
              text-transform: uppercase;
              margin: 0;
              letter-spacing: -0.3px;
            }
            .clinic-subtitle {
              font-size: 10px;
              color: #475569;
              font-weight: 600;
              margin-top: 2px;
            }
            .clinic-contact {
              font-size: 9.5px;
              color: #334155;
              margin-top: 2px;
            }
            .badge-box {
              text-align: right;
            }
            .invoice-badge {
              display: inline-block;
              background: #1e1b4b;
              color: #fff;
              font-size: 12px;
              font-weight: 900;
              padding: 5px 12px;
              border-radius: 6px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .badge-sub {
              font-size: 9.5px;
              color: #64748b;
              font-weight: 700;
              margin-top: 4px;
            }
            
            /* Meta Grid */
            .meta-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 12px;
              margin-bottom: 14px;
            }
            .meta-card {
              background: #f8fafc;
              border: 1px solid #cbd5e1;
              border-radius: 6px;
              padding: 8px 12px;
            }
            .meta-card-title {
              font-size: 10px;
              font-weight: 900;
              text-transform: uppercase;
              color: #1e1b4b;
              border-bottom: 1px solid #e2e8f0;
              padding-bottom: 3px;
              margin-bottom: 6px;
              letter-spacing: 0.5px;
            }
            .meta-row {
              display: flex;
              justify-content: space-between;
              font-size: 10.5px;
              margin-bottom: 3px;
            }
            .meta-label {
              color: #64748b;
              font-weight: 600;
            }
            .meta-val {
              color: #0f172a;
              font-weight: 800;
            }

            /* Table */
            .table-container {
              margin-bottom: 14px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              font-size: 10.5px;
            }
            th {
              background: #0f172a;
              color: #fff;
              padding: 7px 8px;
              text-align: left;
              font-weight: 800;
              text-transform: uppercase;
              font-size: 9.5px;
              letter-spacing: 0.3px;
            }
            td {
              padding: 6px 8px;
              border-bottom: 1px solid #e2e8f0;
              color: #1e293b;
            }
            tr:nth-child(even) td {
              background: #f8fafc;
            }
            .col-center { text-align: center; }
            .col-right { text-align: right; }
            .col-bold { font-weight: 800; font-family: monospace; }
            
            /* Summary & Notes Section */
            .bottom-section {
              display: grid;
              grid-template-columns: 1.3fr 1fr;
              gap: 16px;
              margin-top: 10px;
            }
            .terms-box {
              border: 1px solid #e2e8f0;
              background: #fafafa;
              border-radius: 6px;
              padding: 10px;
              font-size: 9.5px;
            }
            .terms-title {
              font-weight: 900;
              text-transform: uppercase;
              color: #0f172a;
              margin-bottom: 4px;
            }
            .terms-list {
              margin: 0;
              padding-left: 14px;
              color: #475569;
              line-height: 1.35;
            }
            .summary-card {
              background: #f8fafc;
              border: 1.5px solid #0f172a;
              border-radius: 6px;
              padding: 10px;
            }
            .summary-row {
              display: flex;
              justify-content: space-between;
              font-size: 11px;
              margin-bottom: 4px;
              color: #334155;
            }
            .summary-total {
              border-top: 2px solid #0f172a;
              padding-top: 6px;
              margin-top: 6px;
              display: flex;
              justify-content: space-between;
              font-size: 14px;
              font-weight: 900;
              color: #0f172a;
            }
            .words-box {
              margin-top: 6px;
              padding: 5px 8px;
              background: #f1f5f9;
              border-radius: 4px;
              font-size: 9.5px;
              font-weight: 700;
              color: #1e1b4b;
              font-style: italic;
            }

            /* Signatures */
            .signatures-box {
              display: flex;
              justify-content: space-between;
              margin-top: 30px;
              padding-top: 10px;
            }
            .sig-line {
              width: 180px;
              text-align: center;
              border-top: 1.5px solid #0f172a;
              padding-top: 4px;
              font-size: 10px;
              font-weight: 800;
              color: #1e293b;
              text-transform: uppercase;
            }

            .footer-info {
              text-align: center;
              font-size: 8.5px;
              color: #64748b;
              margin-top: 12px;
              border-top: 1px dashed #cbd5e1;
              padding-top: 6px;
            }
          </style>
        </head>
        <body>
          <div class="invoice-wrapper">
            <div>
              <!-- Header -->
              <div class="header-container">
                <div class="brand-box">
                  <img src="${logoSrc}" class="brand-logo" alt="Logo" onerror="this.style.display='none'" />
                  <div>
                    <h1 class="clinic-title">${clinicName}</h1>
                    <div class="clinic-subtitle">${clinicTagline}</div>
                    <div class="clinic-contact">📍 ${clinicAddress} • 📞 ${clinicPhone}</div>
                  </div>
                </div>
                <div class="badge-box">
                  <div class="invoice-badge">PHARMACY INVOICE</div>
                  <div class="badge-sub">Computerized Tax & Cash Dispense Bill</div>
                </div>
              </div>

              <!-- Meta Grid -->
              <div class="meta-grid">
                <div class="meta-card">
                  <div class="meta-card-title">🧾 Invoice & Shift Information</div>
                  <div class="meta-row">
                    <span class="meta-label">Invoice Ref #:</span>
                    <span class="meta-val" style="font-family: monospace; font-size: 12px; color: #1e1b4b;">${billData.invoiceNo}</span>
                  </div>
                  <div class="meta-row">
                    <span class="meta-label">Date & Time:</span>
                    <span class="meta-val">${billData.invoiceDate} ${printTimeStr}</span>
                  </div>
                  <div class="meta-row">
                    <span class="meta-label">Operational Shift:</span>
                    <span class="meta-val">${billData.shift === 1 ? '☀️ Morning Shift (1)' : '🌙 Evening Shift (2)'}</span>
                  </div>
                  <div class="meta-row">
                    <span class="meta-label">Payment Status:</span>
                    <span class="meta-val" style="color: #047857;">PAID IN CASH (POSTED)</span>
                  </div>
                </div>

                <div class="meta-card">
                  <div class="meta-card-title">👤 Patient / Customer Details</div>
                  <div class="meta-row">
                    <span class="meta-label">Patient / Customer:</span>
                    <span class="meta-val" style="font-size: 11.5px;">${billData.patient ? billData.patient.PatientName : 'Walk-in Customer / Guest'}</span>
                  </div>
                  <div class="meta-row">
                    <span class="meta-label">Patient MR # / ID:</span>
                    <span class="meta-val" style="font-family: monospace;">${billData.patient ? billData.patient.PatientID : 'WALK-IN'}</span>
                  </div>
                  <div class="meta-row">
                    <span class="meta-label">Contact Mobile:</span>
                    <span class="meta-val">${billData.patient?.PhoneMobile || billData.patient?.PhoneRes || billData.patient?.PhoneOff || 'N/A'}</span>
                  </div>
                  <div class="meta-row">
                    <span class="meta-label">Billed By:</span>
                    <span class="meta-val">${currentUser?.FullName || currentUser?.LoginName || 'Duty Pharmacist'}</span>
                  </div>
                </div>
              </div>

              <!-- Items Table -->
              <div class="table-container">
                <table>
                  <thead>
                    <tr>
                      <th class="col-center" style="width: 32px;">#</th>
                      <th style="width: 80px;">Item Code</th>
                      <th>Medicine Description & Form</th>
                      <th style="width: 80px;">Category</th>
                      <th class="col-center" style="width: 70px;">Batch #</th>
                      <th class="col-center" style="width: 50px;">Qty</th>
                      <th class="col-right" style="width: 85px;">Unit Rate</th>
                      <th class="col-right" style="width: 95px;">Net Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${billData.basket.map((b, idx) => {
                      const item = items.find(i => i.ItemID === b.ItemID);
                      const isClinical = b.MedicineType === 'C' || item?.MedicineType === 'C';
                      const lineTotal = b.Qty * b.Price;
                      const medCategory = item?.Category || (isClinical ? 'Clinical Compounded' : (item?.Unit || 'Patent'));
                      const batchNo = item?.BatchNo || '-';

                      return `
                        <tr>
                          <td class="col-center" style="font-weight: bold; color: #64748b;">${idx + 1}</td>
                          <td style="font-family: monospace; font-weight: 700;">${b.ItemID}</td>
                          <td>
                            <strong style="color: #0f172a; font-size: 11px;">${item ? item.ItemName : b.ItemID}</strong>
                            ${isClinical ? '<span style="font-size: 9px; color: #047857; font-weight: bold; display: block;">* Doctor Prescribed Clinical Compounding</span>' : ''}
                          </td>
                          <td><span style="font-size: 9.5px; font-weight: 700; color: #4338ca;">${medCategory}</span></td>
                          <td class="col-center" style="font-family: monospace; font-size: 9.5px;">${batchNo}</td>
                          <td class="col-center col-bold" style="font-size: 11px;">${b.Qty}</td>
                          <td class="col-right col-bold">Rs. ${b.Price.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</td>
                          <td class="col-right col-bold" style="color: #0f172a;">Rs. ${lineTotal.toLocaleString()}</td>
                        </tr>
                      `;
                    }).join('')}
                  </tbody>
                </table>
              </div>
            </div>

            <!-- Bottom Section -->
            <div>
              <div class="bottom-section">
                <div class="terms-box">
                  <div class="terms-title">📌 Pharmacy Return & Exchange Terms</div>
                  <ol class="terms-list">
                    <li>Medicines once dispensed can only be exchanged within <strong>3 days</strong> with this original computerized bill.</li>
                    <li>Clinical compounded mixtures, opened drops/syrups, vaccines & cut blister packs are <strong>strictly non-returnable</strong>.</li>
                    <li>Store homeopathic remedies in a cool, dry place away from direct sunlight, camphor & strong aromatics.</li>
                    <li>Please verify your cash change and medicine count before departing the dispensing counter.</li>
                  </ol>
                  <div class="words-box">
                    <strong>In Words:</strong> ${amountInWords}
                  </div>
                </div>

                <div class="summary-card">
                  <div class="summary-row">
                    <span>Gross Subtotal:</span>
                    <strong style="font-family: monospace;">Rs. ${grossTotal.toLocaleString()}</strong>
                  </div>
                  ${billData.discount > 0 ? `
                    <div class="summary-row" style="color: #dc2626;">
                      <span>Discount / Concession:</span>
                      <strong style="font-family: monospace;">- Rs. ${billData.discount.toLocaleString()}</strong>
                    </div>
                  ` : ''}
                  <div class="summary-total">
                    <span>NET PAYABLE:</span>
                    <span style="font-family: monospace; color: #047857;">Rs. ${billData.netAmount.toLocaleString()}</span>
                  </div>
                  <div class="summary-row" style="margin-top: 6px; font-size: 10px; color: #64748b;">
                    <span>Payment Method:</span>
                    <strong style="color: #0f172a;">Cash Handover</strong>
                  </div>
                </div>
              </div>

              <!-- Signatures & Footer -->
              <div class="signatures-box">
                <div class="sig-line">Pharmacist / Dispenser Signature</div>
                <div style="text-align: center;">
                  <div style="font-family: monospace; font-size: 14px; font-weight: 900; letter-spacing: 2px;">*${billData.invoiceNo}*</div>
                  <div style="font-size: 8.5px; color: #64748b;">Verification Barcode</div>
                </div>
                <div class="sig-line">Customer / Receiver Signature</div>
              </div>

              <div class="footer-info">
                Thank you for choosing Punjab Homeopathic Clinic & Pharmacy. We wish you a speedy and complete recovery! • System Printed: ${billData.invoiceDate} ${printTimeStr}
              </div>
            </div>
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

  // 2. Thermal Slip Customer Receipt Print Handler (80mm POS Slip)
  const handlePrintThermalReceipt = (billData: {
    patient: Patient | null;
    basket: { ItemID: string; Qty: number; Price: number; MedicineType?: 'C' | 'P' | 'S' }[];
    discount: number;
    netAmount: number;
    shift: 1 | 2;
    invoiceNo: string;
    invoiceDate: string;
  }) => {
    if (currentUser?.Role !== 'Administrator' && (currentUser?.Permissions?.canPrintPOSInvoice === false || userRights.find(r => r.MenuID === 'pharmacy')?.PrintRec === false)) {
      alert("Printing Pharmacy POS Bills is restricted by administrator permissions.");
      return;
    }

    const printWin = window.open('', '_blank', 'width=420,height=600');
    if (!printWin) {
      alert("Popup blocked! Please allow popups to print thermal customer receipts.");
      return;
    }

    const clinicName = clinicSettings?.ClinicName || 'PUNJAB HOMEOPATHIC CLINIC & PHARMACY';
    const cPhone = clinicSettings?.PhoneMobile || clinicSettings?.PhoneNo || '042-3111222 / 0300-1234567';
    const cAddress = clinicSettings?.ClinicAddress || clinicSettings?.Address || 'Opp. State Bank, Mall Road, Lahore';
    const shiftText = billData.shift === 1 ? 'MORNING SHIFT (1)' : 'EVENING SHIFT (2)';
    const dateStr = billData.invoiceDate || new Date().toISOString().split('T')[0];
    const timeStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    const grossTotal = billData.basket.reduce((sum, item) => sum + item.Qty * item.Price, 0);
    const cashierName = currentUser?.FullName || currentUser?.LoginName || 'Pharmacist on Duty';
    const patientDisplay = billData.patient ? billData.patient.PatientName : 'Walk-in Customer';
    const patientIdDisplay = billData.patient ? ` (ID: ${billData.patient.PatientID})` : '';

    printWin.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Thermal Receipt - ${billData.invoiceNo}</title>
          <style>
            @media print {
              @page { margin: 0; size: 80mm auto; }
              body { margin: 0; padding: 2mm 3mm; }
            }
            body {
              font-family: 'Courier New', Courier, monospace, Arial, sans-serif;
              width: 72mm;
              margin: 0 auto;
              padding: 6px 3px;
              color: #000;
              background: #fff;
              font-size: 11px;
              line-height: 1.25;
            }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .text-bold { font-weight: 900; }
            .clinic-header { text-align: center; margin-bottom: 4px; }
            .clinic-name { font-size: 13px; font-weight: 900; text-transform: uppercase; margin: 0; line-height: 1.2; font-family: sans-serif; }
            .clinic-sub { font-size: 9px; font-weight: bold; color: #111; margin-top: 2px; }
            .divider-solid { border-top: 1.5px solid #000; margin: 4px 0; }
            .divider-dashed { border-top: 1px dashed #000; margin: 4px 0; }
            .receipt-title { font-size: 11px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; text-align: center; margin: 3px 0; font-family: sans-serif; }
            .meta-row { display: flex; justify-content: space-between; font-size: 10px; margin: 2px 0; }
            .meta-label { font-weight: bold; width: 35%; }
            .meta-val { font-weight: bold; width: 65%; text-align: right; word-break: break-word; }
            
            /* Table */
            .items-table { width: 100%; border-collapse: collapse; font-size: 10.5px; margin: 4px 0; }
            .items-table th { text-align: left; border-bottom: 1px dashed #000; padding: 3px 0; font-size: 9.5px; font-weight: 900; }
            .items-table td { padding: 2px 0; vertical-align: top; }
            .total-box { font-size: 13px; font-weight: 900; text-align: right; padding: 3px 0; }
            .footer-msg { font-size: 8.5px; text-align: center; margin-top: 6px; font-weight: bold; line-height: 1.3; }
            .barcode-box { text-align: center; font-family: monospace; font-size: 13px; letter-spacing: 2px; font-weight: 900; margin: 4px 0; }
          </style>
        </head>
        <body>
          <div class="clinic-header">
            <h2 class="clinic-name">${clinicName}</h2>
            <div class="clinic-sub">${cAddress}</div>
            <div class="clinic-sub">Ph: ${cPhone}</div>
          </div>
          
          <div class="divider-solid"></div>
          <div class="receipt-title">*** CUSTOMER RECEIPT ***</div>
          <div class="divider-solid"></div>

          <div class="meta-row">
            <span class="meta-label">Invoice No:</span>
            <span class="meta-val text-bold" style="font-size: 11px;">${billData.invoiceNo}</span>
          </div>
          <div class="meta-row">
            <span class="meta-label">Date/Time :</span>
            <span class="meta-val">${dateStr} ${timeStr}</span>
          </div>
          <div class="meta-row">
            <span class="meta-label">Customer  :</span>
            <span class="meta-val">${patientDisplay}${patientIdDisplay}</span>
          </div>
          <div class="meta-row">
            <span class="meta-label">Shift     :</span>
            <span class="meta-val">${shiftText}</span>
          </div>
          <div class="meta-row">
            <span class="meta-label">Cashier   :</span>
            <span class="meta-val">${cashierName}</span>
          </div>

          <div class="divider-dashed"></div>

          <table class="items-table">
            <thead>
              <tr>
                <th style="width: 52%;">ITEM</th>
                <th style="width: 15%; text-align: center;">QTY</th>
                <th style="width: 33%; text-align: right;">TOTAL</th>
              </tr>
            </thead>
            <tbody>
              ${billData.basket.map(b => {
                const itm = items.find(i => i.ItemID === b.ItemID);
                const lineTotal = b.Qty * b.Price;
                return `
                  <tr>
                    <td colspan="3" style="font-weight: bold; padding-top: 3px;">${itm ? itm.ItemName : b.ItemID}</td>
                  </tr>
                  <tr>
                    <td style="font-size: 9.5px; color: #333; padding-left: 6px;">@ Rs. ${b.Price.toFixed(0)}</td>
                    <td style="text-align: center; font-weight: bold;">${b.Qty}</td>
                    <td style="text-align: right; font-weight: bold;">Rs. ${lineTotal.toLocaleString()}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>

          <div class="divider-dashed"></div>

          <div class="meta-row">
            <span class="meta-label">Subtotal  :</span>
            <span class="meta-val">Rs. ${grossTotal.toLocaleString()}</span>
          </div>
          ${billData.discount > 0 ? `
            <div class="meta-row">
              <span class="meta-label">Discount  :</span>
              <span class="meta-val">- Rs. ${billData.discount.toLocaleString()}</span>
            </div>
          ` : ''}

          <div class="divider-solid"></div>
          <div class="total-box">
            NET TOTAL: Rs. ${billData.netAmount.toLocaleString()}
          </div>
          <div class="divider-solid"></div>

          <div class="meta-row" style="font-size: 9.5px;">
            <span class="meta-label">Payment   :</span>
            <span class="meta-val text-bold">CASH RECEIVED (POSTED)</span>
          </div>

          <div class="barcode-box">||| ${billData.invoiceNo} |||</div>

          <div class="divider-dashed"></div>
          <div class="footer-msg">
            Return/Exchange within 3 days with receipt.<br/>
            Opened syrups/clinical items not returnable.<br/>
            <strong>* THANK YOU & GET WELL SOON *</strong>
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
    printWin.document.close();
  };

  // 3. Medicine Store Sales & Periodic Audit Report Print Handler (A4 Closing / Audit Report)
  const handlePrintDailySalesReport = (targetDateOrStart?: string, customEnd?: string) => {
    let reportTitle = "DAILY MEDICINE STORE SALES & DISPENSE CLOSING AUDIT REPORT";
    let periodSubtitle = "";
    let reportBadgeText = "DAILY SALES SUMMARY";
    let reportInvoices: InvoiceHeader[] = [];

    if (customEnd || salesReportPeriodMode === 'range') {
      const start = targetDateOrStart || salesReportStartDate || todayStr;
      const end = customEnd || salesReportEndDate || todayStr;
      const isSingleDay = start === end;
      reportTitle = isSingleDay 
        ? "DAILY MEDICINE STORE SALES & DISPENSE CLOSING AUDIT REPORT" 
        : "PERIODIC MEDICINE STORE SALES & REVENUE AUDIT REPORT";
      reportBadgeText = isSingleDay ? "DAILY SALES SUMMARY" : "CUSTOM PERIOD AUDIT";
      periodSubtitle = isSingleDay ? `📅 Date: ${start}` : `📅 Period: ${start} to ${end}`;

      reportInvoices = invoices.filter(inv => {
        const d = String(inv.InvoiceDate || '').trim().slice(0, 10);
        const inDate = d >= start && d <= end;
        const inShift = selectedShiftFilter === 'all' ? true : String(inv.shift) === selectedShiftFilter;
        return inDate && inShift;
      });
    } else if (salesReportPeriodMode === 'all') {
      reportTitle = "ALL-TIME MEDICINE STORE SALES & REVENUE AUDIT REPORT";
      reportBadgeText = "ALL-TIME AUDIT";
      periodSubtitle = "📅 Scope: Complete History (All Recorded Dates)";

      reportInvoices = invoices.filter(inv => {
        return selectedShiftFilter === 'all' ? true : String(inv.shift) === selectedShiftFilter;
      });
    } else {
      const reportDate = targetDateOrStart || selectedDailyReportDate || todayStr;
      reportTitle = "DAILY MEDICINE STORE SALES & DISPENSE CLOSING AUDIT REPORT";
      reportBadgeText = "DAILY SALES SUMMARY";
      periodSubtitle = `📅 Closing Date: ${reportDate}`;

      reportInvoices = invoices.filter(inv => {
        const d = String(inv.InvoiceDate || '').trim().slice(0, 10);
        const inDate = d === reportDate;
        const inShift = selectedShiftFilter === 'all' ? true : String(inv.shift) === selectedShiftFilter;
        return inDate && inShift;
      });
    }

    if (reportInvoices.length === 0) {
      alert("No store medicine invoices found for the selected period or filters.");
      return;
    }

    // Collect all details
    const reportDetails = invoiceDetails.filter(d => reportInvoices.some(inv => inv.InvoiceNo === d.InvoiceNo));

    // Totals
    const totalInvoicesCount = reportInvoices.length;
    const totalUnitsSold = reportDetails.reduce((sum, d) => sum + (Number(d.Qty) || 0), 0);
    const grossSalesSum = reportInvoices.reduce((sum, inv) => sum + (Number(inv.GAmount) || 0), 0);
    const totalDiscountSum = reportInvoices.reduce((sum, inv) => sum + (Number(inv.Discount) || 0), 0);
    const netSalesSum = reportInvoices.reduce((sum, inv) => sum + (Number(inv.NetAmount) || 0), 0);

    // Shifts
    const shift1Invoices = reportInvoices.filter(i => i.shift === 1);
    const shift2Invoices = reportInvoices.filter(i => i.shift === 2);
    const shift1NetSum = shift1Invoices.reduce((sum, inv) => sum + (Number(inv.NetAmount) || 0), 0);
    const shift2NetSum = shift2Invoices.reduce((sum, inv) => sum + (Number(inv.NetAmount) || 0), 0);

    // Grouping by category
    const categoryMap = new Map<string, { category: string; count: number; qty: number; revenue: number }>();
    reportDetails.forEach(d => {
      const itm = items.find(i => i.ItemID === d.ItemID);
      const cat = itm?.Category || (d.MedicineType === 'C' || itm?.MedicineType === 'C' ? 'Clinical Compounding' : (itm?.Unit || 'Patent / Other'));
      const lineTotal = (Number(d.Qty) || 0) * (Number(d.Price) || 0);

      const existing = categoryMap.get(cat) || { category: cat, count: 0, qty: 0, revenue: 0 };
      existing.count += 1;
      existing.qty += (Number(d.Qty) || 0);
      existing.revenue += lineTotal;
      categoryMap.set(cat, existing);
    });

    const categorySummaryList = Array.from(categoryMap.values()).sort((a, b) => b.revenue - a.revenue);

    // Grouping by item (Top Selling Medicines)
    const itemMap = new Map<string, { itemId: string; itemName: string; category: string; qty: number; unitPrice: number; revenue: number }>();
    reportDetails.forEach(d => {
      const itm = items.find(i => i.ItemID === d.ItemID);
      const name = itm?.ItemName || d.ItemID;
      const cat = itm?.Category || (d.MedicineType === 'C' ? 'Clinical' : (itm?.Unit || 'Patent'));
      const lineTotal = (Number(d.Qty) || 0) * (Number(d.Price) || 0);

      const existing = itemMap.get(d.ItemID) || {
        itemId: d.ItemID,
        itemName: name,
        category: cat,
        qty: 0,
        unitPrice: Number(d.Price) || 0,
        revenue: 0
      };
      existing.qty += (Number(d.Qty) || 0);
      existing.revenue += lineTotal;
      itemMap.set(d.ItemID, existing);
    });

    const topItemsList = Array.from(itemMap.values()).sort((a, b) => b.qty - a.qty);

    const win = window.open('', '_blank', 'width=1100,height=900');
    if (!win) {
      alert("Pop-up blocker prevented opening print window. Please allow pop-ups for this site.");
      return;
    }

    const clinicName = clinicSettings?.ClinicName || "Punjab Homeopathic Clinic & Pharmacy";
    const clinicAddress = clinicSettings?.ClinicAddress || clinicSettings?.Address || "Opposite State Bank, Mall Road, Lahore";
    const clinicPhone = clinicSettings?.PhoneMobile || clinicSettings?.PhoneNo || "042-3111222 / 0300-1234567";
    const logoSrc = clinicSettings?.ClinicLogoImage || clinicSettings?.Logo || '/logo.png';
    const printedBy = currentUser?.FullName || currentUser?.LoginName || 'Duty Pharmacist';
    const printTimeStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

    win.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${reportTitle} - ${periodSubtitle.replace(/[^a-zA-Z0-9 -]/g, '')}</title>
          <style>
            @page {
              size: A4 portrait;
              margin: 10mm 12mm 12mm 12mm;
            }
            * {
              box-sizing: border-box;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
              margin: 0;
              padding: 0;
              color: #0f172a;
              font-size: 10px;
              line-height: 1.35;
              background: #fff;
            }
            .header-container {
              display: flex;
              align-items: center;
              justify-content: space-between;
              border-bottom: 2.5px solid #0f172a;
              padding-bottom: 10px;
              margin-bottom: 12px;
            }
            .brand-box {
              display: flex;
              align-items: center;
              gap: 12px;
            }
            .brand-logo {
              width: 48px;
              height: 48px;
              object-fit: contain;
            }
            .clinic-title {
              font-size: 18px;
              font-weight: 900;
              color: #1e1b4b;
              text-transform: uppercase;
              margin: 0;
            }
            .clinic-subtitle {
              font-size: 10px;
              color: #475569;
              font-weight: 700;
              margin-top: 2px;
            }
            .report-badge-box {
              text-align: right;
            }
            .report-badge {
              display: inline-block;
              background: #047857;
              color: #fff;
              font-size: 11px;
              font-weight: 900;
              padding: 4px 10px;
              border-radius: 6px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .report-date {
              font-size: 10.5px;
              font-weight: 800;
              color: #0f172a;
              margin-top: 4px;
            }

            /* Metric Cards */
            .kpi-grid {
              display: grid;
              grid-template-columns: repeat(5, 1fr);
              gap: 8px;
              margin-bottom: 12px;
            }
            .kpi-card {
              border: 1.5px solid #cbd5e1;
              border-radius: 6px;
              padding: 7px;
              text-align: center;
              background: #f8fafc;
            }
            .kpi-title {
              font-size: 8.5px;
              font-weight: 800;
              text-transform: uppercase;
              color: #64748b;
              margin-bottom: 2px;
            }
            .kpi-val {
              font-size: 14px;
              font-weight: 900;
              color: #0f172a;
              font-family: monospace;
            }

            /* Section */
            .section-header {
              font-size: 10.5px;
              font-weight: 900;
              text-transform: uppercase;
              color: #1e1b4b;
              border-bottom: 1.5px solid #cbd5e1;
              padding-bottom: 3px;
              margin: 12px 0 5px 0;
              display: flex;
              justify-content: space-between;
            }

            /* Tables */
            table {
              width: 100%;
              border-collapse: collapse;
              font-size: 9.5px;
              margin-bottom: 10px;
            }
            th {
              background: #1e293b;
              color: #fff;
              padding: 5px 6px;
              text-align: left;
              font-weight: 800;
              font-size: 8.5px;
              text-transform: uppercase;
            }
            td {
              padding: 4px 6px;
              border-bottom: 1px solid #e2e8f0;
              color: #1e293b;
            }
            tr:nth-child(even) td {
              background: #f8fafc;
            }
            .col-center { text-align: center; }
            .col-right { text-align: right; }
            .col-bold { font-weight: 800; font-family: monospace; }
            .total-row td {
              background: #f1f5f9;
              font-weight: 900;
              border-top: 2px solid #0f172a;
              border-bottom: 2px solid #0f172a;
            }

            /* Drawer reconciliation */
            .reconciliation-box {
              border: 1.5px solid #0f172a;
              border-radius: 6px;
              padding: 8px 10px;
              background: #f8fafc;
              margin-top: 8px;
            }

            /* Signatures */
            .sig-grid {
              display: grid;
              grid-template-columns: 1fr 1fr 1fr;
              gap: 20px;
              margin-top: 20px;
              padding-top: 10px;
            }
            .sig-block {
              text-align: center;
              border-top: 1.5px solid #0f172a;
              padding-top: 4px;
              font-size: 9px;
              font-weight: 800;
              text-transform: uppercase;
            }
          </style>
        </head>
        <body>
          <!-- Header -->
          <div class="header-container">
            <div class="brand-box">
              <img src="${logoSrc}" class="brand-logo" alt="Logo" onerror="this.style.display='none'" />
              <div>
                <h1 class="clinic-title">${clinicName}</h1>
                <div class="clinic-subtitle">${reportTitle}</div>
                <div style="font-size: 9px; color: #475569; margin-top: 2px;">📍 ${clinicAddress} • 📞 ${clinicPhone}</div>
              </div>
            </div>
            <div class="report-badge-box">
              <div class="report-badge">${reportBadgeText}</div>
              <div class="report-date">${periodSubtitle}</div>
              <div style="font-size: 8.5px; color: #64748b; margin-top: 2px;">Shift Filter: <strong>${selectedShiftFilter === 'all' ? 'All Shifts' : selectedShiftFilter === '1' ? 'Morning Shift 1' : 'Evening Shift 2'}</strong> • Generated: ${printTimeStr} by ${printedBy}</div>
            </div>
          </div>

          <!-- KPI Summary Cards -->
          <div class="kpi-grid">
            <div class="kpi-card">
              <div class="kpi-title">Total Invoices</div>
              <div class="kpi-val" style="color: #4338ca;">${totalInvoicesCount}</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-title">Medicine Units Sold</div>
              <div class="kpi-val" style="color: #0284c7;">${totalUnitsSold.toLocaleString()}</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-title">Gross Total (Rs.)</div>
              <div class="kpi-val">Rs. ${grossSalesSum.toLocaleString()}</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-title">Total Discount (Rs.)</div>
              <div class="kpi-val" style="color: #dc2626;">- Rs. ${totalDiscountSum.toLocaleString()}</div>
            </div>
            <div class="kpi-card" style="background: #ecfdf5; border-color: #059669;">
              <div class="kpi-title" style="color: #065f46;">Net Cash Realized</div>
              <div class="kpi-val" style="color: #047857;">Rs. ${netSalesSum.toLocaleString()}</div>
            </div>
          </div>

          <!-- Category Breakdown Table -->
          <div class="section-header">
            <span>🏷️ 1. Category-Wise Medicine Sales Breakdown</span>
            <span style="font-size: 9px; color: #64748b;">Total Categories: ${categorySummaryList.length}</span>
          </div>
          <table>
            <thead>
              <tr>
                <th style="width: 25px;" class="col-center">#</th>
                <th>Medicine Category / Dosage Form</th>
                <th class="col-center" style="width: 80px;">Distinct Items</th>
                <th class="col-center" style="width: 80px;">Total Qty Sold</th>
                <th class="col-right" style="width: 110px;">Category Net Sales</th>
                <th class="col-right" style="width: 70px;">% Share</th>
              </tr>
            </thead>
            <tbody>
              ${categorySummaryList.map((cat, idx) => {
                const sharePercent = netSalesSum > 0 ? ((cat.revenue / netSalesSum) * 100).toFixed(1) : '0.0';
                return `
                  <tr>
                    <td class="col-center" style="font-weight: bold; color: #64748b;">${idx + 1}</td>
                    <td><strong>${cat.category}</strong></td>
                    <td class="col-center">${cat.count}</td>
                    <td class="col-center col-bold">${cat.qty}</td>
                    <td class="col-right col-bold">Rs. ${cat.revenue.toLocaleString()}</td>
                    <td class="col-right" style="font-weight: bold; color: #4338ca;">${sharePercent}%</td>
                  </tr>
                `;
              }).join('')}
              <tr class="total-row">
                <td colspan="2">TOTAL STORE MEDICINE CATEGORIES</td>
                <td class="col-center">${topItemsList.length}</td>
                <td class="col-center">${totalUnitsSold.toLocaleString()}</td>
                <td class="col-right">Rs. ${netSalesSum.toLocaleString()}</td>
                <td class="col-right">100.0%</td>
              </tr>
            </tbody>
          </table>

          <!-- Top Selling Medicines Table -->
          <div class="section-header">
            <span>💊 2. Itemized Medicine Sales Ranking (Sorted by Quantity)</span>
            <span style="font-size: 9px; color: #64748b;">${topItemsList.length} Unique Medicines Sold</span>
          </div>
          <table>
            <thead>
              <tr>
                <th style="width: 25px;" class="col-center">#</th>
                <th style="width: 70px;">Item Code</th>
                <th>Medicine Name</th>
                <th style="width: 85px;">Category</th>
                <th class="col-center" style="width: 60px;">Qty Sold</th>
                <th class="col-right" style="width: 80px;">Unit Price</th>
                <th class="col-right" style="width: 95px;">Total Revenue</th>
              </tr>
            </thead>
            <tbody>
              ${topItemsList.slice(0, 50).map((itm, idx) => `
                <tr>
                  <td class="col-center" style="color: #64748b; font-weight: bold;">${idx + 1}</td>
                  <td style="font-family: monospace; font-weight: 700;">${itm.itemId}</td>
                  <td><strong>${itm.itemName}</strong></td>
                  <td><span style="font-size: 8.5px; color: #4338ca; font-weight: 700;">${itm.category}</span></td>
                  <td class="col-center col-bold" style="color: #0f172a;">${itm.qty}</td>
                  <td class="col-right">Rs. ${itm.unitPrice.toLocaleString()}</td>
                  <td class="col-right col-bold" style="color: #047857;">Rs. ${itm.revenue.toLocaleString()}</td>
                </tr>
              `).join('')}
              ${topItemsList.length > 50 ? `<tr><td colspan="7" class="col-center" style="font-style: italic; color: #64748b;">... and ${topItemsList.length - 50} more items included in the summary calculation.</td></tr>` : ''}
            </tbody>
          </table>

          <!-- 3. Invoices Log & Register -->
          <div class="section-header">
            <span>📑 3. Invoices Register & Shift Log</span>
            <span style="font-size: 9px; color: #64748b;">${reportInvoices.length} Recorded Invoices</span>
          </div>
          <table>
            <thead>
              <tr>
                <th style="width: 25px;" class="col-center">#</th>
                <th style="width: 75px;">Invoice Ref</th>
                <th style="width: 75px;">Date</th>
                <th style="width: 75px;">Shift</th>
                <th>Patient / Customer</th>
                <th class="col-center" style="width: 50px;">Items</th>
                <th class="col-right" style="width: 75px;">Gross</th>
                <th class="col-right" style="width: 65px;">Disc.</th>
                <th class="col-right" style="width: 85px;">Net Paid</th>
              </tr>
            </thead>
            <tbody>
              ${reportInvoices.slice(0, 100).map((inv, idx) => {
                const patientName = getPatientName(inv.PatientID);
                const invItemCount = invoiceDetails.filter(d => d.InvoiceNo === inv.InvoiceNo).length;
                return `
                  <tr>
                    <td class="col-center" style="color: #64748b;">${idx + 1}</td>
                    <td style="font-family: monospace; font-weight: 700;">${inv.InvoiceNo}</td>
                    <td>${inv.InvoiceDate}</td>
                    <td><span style="font-weight: bold; color: ${inv.shift === 1 ? '#c2410c' : '#7e22ce'}">${inv.shift === 1 ? 'Morning (1)' : 'Evening (2)'}</span></td>
                    <td><strong>${patientName}</strong></td>
                    <td class="col-center font-bold">${invItemCount}</td>
                    <td class="col-right">Rs. ${(inv.GAmount || 0).toLocaleString()}</td>
                    <td class="col-right" style="color: ${inv.Discount ? '#dc2626' : '#64748b'}">${inv.Discount ? `Rs. ${inv.Discount.toLocaleString()}` : '-'}</td>
                    <td class="col-right col-bold" style="color: #047857;">Rs. ${(inv.NetAmount || 0).toLocaleString()}</td>
                  </tr>
                `;
              }).join('')}
              ${reportInvoices.length > 100 ? `<tr><td colspan="9" class="col-center" style="font-style: italic; color: #64748b;">... showing first 100 of ${reportInvoices.length} invoices.</td></tr>` : ''}
              <tr class="total-row">
                <td colspan="5">GRAND INVOICE TOTALS</td>
                <td class="col-center">${totalUnitsSold.toLocaleString()}</td>
                <td class="col-right">Rs. ${grossSalesSum.toLocaleString()}</td>
                <td class="col-right" style="color: #dc2626;">- Rs. ${totalDiscountSum.toLocaleString()}</td>
                <td class="col-right" style="color: #047857;">Rs. ${netSalesSum.toLocaleString()}</td>
              </tr>
            </tbody>
          </table>

          <!-- Shift & Drawer Reconciliation -->
          <div class="reconciliation-box">
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; margin-bottom: 5px;">
              <strong style="font-size: 10.5px; text-transform: uppercase;">💼 Shift & Cash Drawer Reconciliation</strong>
              <span style="font-size: 9.5px; font-weight: 800; color: #047857;">ALL INVOICES AUDITED & VERIFIED</span>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; font-size: 10px;">
              <div>
                <span style="color: #64748b;">☀️ Morning Shift (1) Realized:</span><br/>
                <strong style="font-size: 11.5px; color: #c2410c;">Rs. ${shift1NetSum.toLocaleString()}</strong> (${shift1Invoices.length} Invoices)
              </div>
              <div>
                <span style="color: #64748b;">🌙 Evening Shift (2) Realized:</span><br/>
                <strong style="font-size: 11.5px; color: #7e22ce;">Rs. ${shift2NetSum.toLocaleString()}</strong> (${shift2Invoices.length} Invoices)
              </div>
              <div style="text-align: right;">
                <span style="color: #64748b;">Total Net Sales Collected:</span><br/>
                <strong style="font-size: 13.5px; color: #047857; font-family: monospace;">Rs. ${netSalesSum.toLocaleString()}</strong>
              </div>
            </div>
          </div>

          <!-- Signatures -->
          <div class="sig-grid">
            <div class="sig-block">
              Pharmacist / Cashier on Duty<br/>
              <span style="font-size: 8px; font-weight: normal; color: #64748b;">(${printedBy})</span>
            </div>
            <div class="sig-block">
              Pharmacy Store In-Charge<br/>
              <span style="font-size: 8px; font-weight: normal; color: #64748b;">(Cash Handover Verified)</span>
            </div>
            <div class="sig-block">
              Dr. Zaigham Ali Anjum<br/>
              <span style="font-size: 8px; font-weight: normal; color: #64748b;">(Managing Director & Administrator)</span>
            </div>
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

  const handlePrintStockGrid = (forceLowStockOnly?: boolean) => {
    const isLowStock = forceLowStockOnly || invLowStockFilter;

    const processedForPrint = items.filter((itm) => {
      if (isLowStock && itm.CStock > ((itm.MinStock !== undefined && itm.MinStock !== null) ? itm.MinStock : 1)) return false;
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

    processedForPrint.sort((a, b) => {
      let valA: any = a[invSortField];
      let valB: any = b[invSortField];
      if (valA === undefined || valA === null) valA = '';
      if (valB === undefined || valB === null) valB = '';
      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();

      if (valA < valB) return invSortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return invSortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    if (processedForPrint.length === 0) {
      alert(isLowStock ? "No low stock medicines found to print!" : "No items match your filter to print!");
      return;
    }

    const clinicName = clinicSettings?.ClinicName || "Punjab Homeopathic Clinic";
    const clinicAddress = clinicSettings?.ClinicAddress || clinicSettings?.Address || "Opposite State Bank, Mall Road, Lahore";
    const clinicPhone = clinicSettings?.PhoneMobile || clinicSettings?.PhoneNo || "042-3111222";
    const clinicTagline = clinicSettings?.ClinicLogoText || clinicSettings?.Tagline || "Advanced Health Care & Clinical Pharmacy";
    const logoSrc = clinicSettings?.ClinicLogoImage || clinicSettings?.Logo || '/logo.png';
    
    const printDate = new Date().toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }) + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const totalItemsCount = processedForPrint.length;
    const totalStockQty = processedForPrint.reduce((acc, itm) => acc + (itm.CStock || 0), 0);
    const totalReorderQty = processedForPrint.reduce((acc, itm) => acc + (itm.ReorderQty || 0), 0);
    const totalCostVal = processedForPrint.reduce((acc, itm) => acc + ((itm.PurchasePrice || 0) * (itm.CStock || 0)), 0);
    const totalRetailVal = processedForPrint.reduce((acc, itm) => acc + ((itm.Price || 0) * (itm.CStock || 0)), 0);
    const criticalOutCount = processedForPrint.filter(i => (i.CStock || 0) <= 0).length;
    const lowCount = processedForPrint.filter(i => (i.CStock || 0) > 0 && i.CStock <= ((i.MinStock !== undefined && i.MinStock !== null) ? i.MinStock : 1)).length;

    const win = window.open('', '_blank', 'width=1100,height=900');
    if (!win) {
      alert("Pop-up blocker prevented opening print window. Please allow pop-ups for this site.");
      return;
    }

    win.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${isLowStock ? 'Low Stock & Shortage Alert Report' : 'Pharmacy Inventory & Stock Report'} - ${clinicName}</title>
          <style>
            @page {
              size: A4 portrait;
              margin: 8mm 10mm 10mm 10mm;
            }
            * {
              box-sizing: border-box;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              margin: 0;
              padding: 0;
              color: #0f172a;
              font-size: 10px;
              line-height: 1.3;
              background: #fff;
            }
            .header-container {
              display: flex;
              align-items: center;
              justify-content: space-between;
              border-bottom: 2px solid #0f172a;
              padding-bottom: 8px;
              margin-bottom: 10px;
              gap: 12px;
            }
            .brand-section {
              display: flex;
              align-items: center;
              gap: 10px;
            }
            .logo-img {
              width: 50px;
              height: 50px;
              object-fit: contain;
            }
            .clinic-title {
              font-size: 18px;
              font-weight: 900;
              color: #4c0519;
              text-transform: uppercase;
              margin: 0;
              letter-spacing: -0.5px;
            }
            .clinic-subtitle {
              font-size: 9.5px;
              color: #475569;
              font-weight: 600;
              margin-top: 2px;
            }
            .report-badge-box {
              text-align: right;
            }
            .report-badge {
              display: inline-block;
              padding: 4px 10px;
              background: ${isLowStock ? '#fee2e2' : '#f1f5f9'};
              color: ${isLowStock ? '#991b1b' : '#0f172a'};
              border: 1px solid ${isLowStock ? '#fca5a5' : '#cbd5e1'};
              font-weight: 900;
              font-size: 11px;
              text-transform: uppercase;
              border-radius: 6px;
              letter-spacing: 0.5px;
            }
            .report-meta {
              font-size: 9px;
              color: #64748b;
              font-family: monospace;
              margin-top: 4px;
            }
            .kpi-grid {
              display: grid;
              grid-template-columns: repeat(5, 1fr);
              gap: 6px;
              margin-bottom: 10px;
            }
            .kpi-card {
              border: 1px solid #e2e8f0;
              background: #f8fafc;
              padding: 5px 8px;
              border-radius: 6px;
              text-align: center;
            }
            .kpi-label {
              font-size: 8px;
              font-weight: 800;
              color: #64748b;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .kpi-value {
              font-size: 12px;
              font-weight: 900;
              color: #0f172a;
              margin-top: 2px;
              font-family: monospace;
            }
            .filter-info-bar {
              background: #f1f5f9;
              border: 1px solid #e2e8f0;
              padding: 4px 8px;
              border-radius: 4px;
              font-size: 9px;
              font-weight: bold;
              color: #334155;
              margin-bottom: 8px;
              display: flex;
              justify-content: space-between;
            }
            table.stock-table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 4px;
              font-size: 9.5px;
            }
            table.stock-table th, table.stock-table td {
              border: 1px solid #cbd5e1;
              padding: 4.5px 5px;
            }
            table.stock-table thead tr th {
              background: #0f172a;
              color: #ffffff;
              font-weight: 900;
              text-transform: uppercase;
              font-size: 8.5px;
              letter-spacing: 0.3px;
              text-align: center;
            }
            table.stock-table tbody tr:nth-child(even) {
              background: #f8fafc;
            }
            .row-critical {
              background: #fef2f2 !important;
            }
            .row-low {
              background: #fffbeb !important;
            }
            .badge-status {
              display: inline-block;
              padding: 1.5px 5px;
              border-radius: 3px;
              font-size: 8px;
              font-weight: 900;
              text-transform: uppercase;
              white-space: nowrap;
            }
            .status-out {
              background: #fee2e2;
              color: #991b1b;
              border: 1px solid #f87171;
            }
            .status-low {
              background: #fef3c7;
              color: #92400e;
              border: 1px solid #fcd34d;
            }
            .status-ok {
              background: #dcfce7;
              color: #166534;
              border: 1px solid #86efac;
            }
            .total-row {
              background: #f1f5f9 !important;
              font-weight: 900;
              border-top: 2px solid #0f172a;
            }
            .signatures {
              margin-top: 20px;
              display: flex;
              justify-content: space-between;
              padding-top: 15px;
              page-break-inside: avoid;
            }
            .sig-block {
              border-top: 1.5px solid #0f172a;
              width: 180px;
              text-align: center;
              padding-top: 4px;
              font-size: 9.5px;
              font-weight: 800;
              color: #334155;
            }
            .print-btn-bar {
              margin-bottom: 12px;
              display: flex;
              justify-content: flex-end;
              gap: 8px;
            }
            .btn-print {
              background: #0f172a;
              color: #fff;
              border: none;
              padding: 6px 16px;
              font-weight: bold;
              font-size: 12px;
              border-radius: 4px;
              cursor: pointer;
            }
            @media print {
              .no-print {
                display: none !important;
              }
              body {
                padding: 0;
              }
              tr {
                page-break-inside: avoid;
              }
              thead {
                display: table-header-group;
              }
              tfoot {
                display: table-footer-group;
              }
            }
          </style>
        </head>
        <body>
          <div class="no-print print-btn-bar">
            <button class="btn-print" onclick="window.print()">🖨️ Print Document (A4)</button>
            <button class="btn-print" style="background:#64748b;" onclick="window.close()">Close</button>
          </div>

          <div class="header-container">
            <div class="brand-section">
              ${logoSrc ? `<img src="${logoSrc}" class="logo-img" alt="Logo" onerror="this.style.display='none'" />` : ''}
              <div>
                <h1 class="clinic-title">${clinicName}</h1>
                <div class="clinic-subtitle">📍 ${clinicAddress} &nbsp;|&nbsp; 📞 ${clinicPhone}</div>
                <div style="font-size: 8.5px; color: #94a3b8; font-weight: 700; text-transform: uppercase; margin-top: 1px;">${clinicTagline}</div>
              </div>
            </div>
            <div class="report-badge-box">
              <div class="report-badge">${isLowStock ? '⚠️ LOW STOCK & SHORTAGE REPORT' : '📦 INVENTORY & STOCK VALUATION REPORT'}</div>
              <div class="report-meta">Print Date: <strong>${printDate}</strong></div>
              <div class="report-meta">Doc Ref: <strong>STK-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}</strong></div>
            </div>
          </div>

          <div class="kpi-grid">
            <div class="kpi-card">
              <div class="kpi-label">Listed Items</div>
              <div class="kpi-value">${totalItemsCount}</div>
            </div>
            <div class="kpi-card" style="background: ${criticalOutCount + lowCount > 0 ? '#fef2f2' : '#f8fafc'};">
              <div class="kpi-label" style="color: ${criticalOutCount + lowCount > 0 ? '#991b1b' : '#64748b'};">Low / Out Stock</div>
              <div class="kpi-value" style="color: ${criticalOutCount + lowCount > 0 ? '#b91c1c' : '#0f172a'};">${criticalOutCount + lowCount} Items</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-label">Total Units in Stock</div>
              <div class="kpi-value">${totalStockQty.toLocaleString()}</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-label">Total Cost Valuation</div>
              <div class="kpi-value" style="color: #b45309;">Rs. ${totalCostVal.toLocaleString('en-PK', { minimumFractionDigits: 2 })}</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-label">Total Retail Valuation</div>
              <div class="kpi-value" style="color: #047857;">Rs. ${totalRetailVal.toLocaleString('en-PK', { minimumFractionDigits: 2 })}</div>
            </div>
          </div>

          <div class="filter-info-bar">
            <span><strong>Scope:</strong> ${isLowStock ? '⚠️ Showing ONLY items below minimum stock threshold' : 'All filtered inventory items'}</span>
            <span><strong>Category:</strong> ${invCategoryFilter === 'ALL' ? 'All Categories' : invCategoryFilter === 'C' ? 'Clinical' : invCategoryFilter === 'P' ? 'Patent' : invCategoryFilter}</span>
            ${invSearchQuery ? `<span><strong>Search Query:</strong> "${invSearchQuery}"</span>` : ''}
          </div>

          <table class="stock-table">
            <thead>
              <tr>
                <th style="width: 4%;">S#</th>
                <th style="width: 10%;">Item ID</th>
                <th style="width: 25%; text-align: left;">Medicine / Item Name</th>
                <th style="width: 9%;">Unit/Cat</th>
                <th style="width: 7%;">Type</th>
                <th style="width: 8%;">Stock</th>
                <th style="width: 7%;">Min Thresh</th>
                <th style="width: 7%;">Reorder</th>
                <th style="width: 9%; text-align: right;">Unit Cost</th>
                <th style="width: 9%; text-align: right;">Retail (Rs)</th>
                <th style="width: 11%; text-align: right;">Total Cost (Rs)</th>
                <th style="width: 9%;">Status</th>
              </tr>
            </thead>
            <tbody>
              ${processedForPrint.map((itm, idx) => {
                const minThresh = (itm.MinStock !== undefined && itm.MinStock !== null) ? itm.MinStock : 1;
                const isOut = itm.CStock <= 0;
                const isLow = !isOut && itm.CStock <= minThresh;
                const rowClass = isOut ? 'row-critical' : isLow ? 'row-low' : '';
                const statusBadge = isOut 
                  ? '<span class="badge-status status-out">🚨 OUT</span>' 
                  : isLow 
                  ? '<span class="badge-status status-low">⚠️ LOW</span>' 
                  : '<span class="badge-status status-ok">🟢 OK</span>';
                const lineCost = (itm.PurchasePrice || 0) * (itm.CStock || 0);

                return `
                  <tr class="${rowClass}">
                    <td style="text-align: center; font-weight: bold; color: #64748b;">${idx + 1}</td>
                    <td style="text-align: center; font-family: monospace; font-weight: bold;">${itm.ItemID}</td>
                    <td style="font-weight: 800; color: #0f172a;">${itm.ItemName}</td>
                    <td style="text-align: center;">${itm.Unit || 'Tab'}</td>
                    <td style="text-align: center; font-size: 8px; font-weight: bold;">${itm.MedicineType === 'C' ? 'Clinical' : 'Patent'}</td>
                    <td style="text-align: center; font-family: monospace; font-weight: 900; color: ${isOut ? '#dc2626' : isLow ? '#b45309' : '#166534'};">
                      ${itm.CStock}
                    </td>
                    <td style="text-align: center; font-family: monospace;">${minThresh}</td>
                    <td style="text-align: center; font-family: monospace; font-weight: bold; color: #3b82f6;">${itm.ReorderQty || 0}</td>
                    <td style="text-align: right; font-family: monospace;">${(itm.PurchasePrice || 0).toLocaleString()}</td>
                    <td style="text-align: right; font-family: monospace;">${(itm.Price || 0).toLocaleString()}</td>
                    <td style="text-align: right; font-family: monospace; font-weight: bold;">${lineCost.toLocaleString('en-PK', { minimumFractionDigits: 2 })}</td>
                    <td style="text-align: center;">${statusBadge}</td>
                  </tr>
                `;
              }).join('')}
              <tr class="total-row">
                <td colspan="5" style="text-align: right; font-size: 9px;">TOTAL SUMMARY:</td>
                <td style="text-align: center; font-family: monospace; font-size: 10px;">${totalStockQty.toLocaleString()}</td>
                <td></td>
                <td style="text-align: center; font-family: monospace; font-size: 10px;">${totalReorderQty.toLocaleString()}</td>
                <td colspan="2" style="text-align: right; font-size: 9px;">TOTAL VALUATION:</td>
                <td style="text-align: right; font-family: monospace; font-size: 10px; color: #991b1b;">Rs. ${totalCostVal.toLocaleString('en-PK', { minimumFractionDigits: 2 })}</td>
                <td></td>
              </tr>
            </tbody>
          </table>

          <div class="signatures">
            <div class="sig-block">
              Prepared by: Pharmacist / Store Incharge
            </div>
            <div class="sig-block">
              Audited by: Store Manager
            </div>
            <div class="sig-block">
              Authorized Signature / Doctor
            </div>
          </div>

          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 250);
            };
          </script>
        </body>
      </html>
    `);
    win.document.close();
  };

  // Popup Window Print Handler for A4 Purchase Order
  const handleOpenPoPrintWindow = () => {
    const filteredItems = getFilteredPoItems(items, poCategoryFilter, poOnlyLowStock);
    const clinicName = clinicSettings?.ClinicName || "Punjab Homeopathic Clinic";
    const printDate = new Date().toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }) + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    let tableHtml = '';

    if (poPrintLayout === '3col') {
      const poRows = [];
      for (let i = 0; i < filteredItems.length; i += 3) {
        poRows.push([
          filteredItems[i],
          filteredItems[i + 1] || null,
          filteredItems[i + 2] || null
        ]);
      }

      tableHtml = `
        <table class="po-table">
          <thead>
            <tr>
              <th colspan="6" class="table-title">
                PURCHASE ORDER & SHORTAGE REQUISITION
              </th>
            </tr>
            <tr class="header-row">
              <th style="width: 23%;">MEDICINE NAME</th>
              <th style="width: 10.33%; text-align: center;">REQ QTY</th>
              <th style="width: 23%;">MEDICINE NAME</th>
              <th style="width: 10.33%; text-align: center;">REQ QTY</th>
              <th style="width: 23%;">MEDICINE NAME</th>
              <th style="width: 10.33%; text-align: center;">REQ QTY</th>
            </tr>
          </thead>
          <tbody>
            ${poRows.map((row) => {
              const getQtyStr = (itm: Item | null) => {
                if (!itm) return '';
                return (itm.ReorderQty !== undefined && itm.ReorderQty !== null)
                  ? itm.ReorderQty
                  : 0;
              };
              return `
                <tr>
                  <td class="col-name">${row[0]?.ItemName || ''}</td>
                  <td class="col-qty">${row[0] ? getQtyStr(row[0]) : ''}</td>
                  <td class="col-name">${row[1]?.ItemName || ''}</td>
                  <td class="col-qty">${row[1] ? getQtyStr(row[1]) : ''}</td>
                  <td class="col-name">${row[2]?.ItemName || ''}</td>
                  <td class="col-qty">${row[2] ? getQtyStr(row[2]) : ''}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      `;
    } else {
      tableHtml = `
        <table class="po-table">
          <thead>
            <tr class="header-row">
              <th style="width: 6%; text-align: center;">S.No</th>
              <th style="width: 12%; text-align: center;">Item ID</th>
              <th style="width: 42%;">Medicine Name</th>
              <th style="width: 12%; text-align: center;">Category</th>
              <th style="width: 14%; text-align: center;">Current Stock</th>
              <th style="width: 14%; text-align: center;">Reorder Qty</th>
            </tr>
          </thead>
          <tbody>
            ${filteredItems.map((itm, idx) => {
              const reorderQty = (itm.ReorderQty !== undefined && itm.ReorderQty !== null)
                ? itm.ReorderQty
                : 0;
              return `
                <tr>
                  <td style="text-align: center; font-weight: bold; color: #555;">${idx + 1}</td>
                  <td style="text-align: center; font-family: monospace; font-weight: bold;">${itm.ItemID}</td>
                  <td class="col-name" style="font-weight: bold;">${itm.ItemName}</td>
                  <td style="text-align: center;">${itm.Unit || 'Tab'}</td>
                  <td style="text-align: center; font-family: monospace; font-weight: bold; color: #b91c1c;">${itm.CStock}</td>
                  <td class="col-qty" style="font-weight: 900;">${reorderQty} ${itm.Unit || 'Tab'}s</td>
                </tr>
              `;
            }).join('')}
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
          <meta charset="utf-8" />
          <title>A4 Purchase Order - ${clinicName}</title>
          <style>
            @page {
              size: A4 portrait;
              margin: 12mm 12mm 12mm 12mm;
            }
            *, *:before, *:after {
              box-sizing: border-box;
            }
            html, body {
              margin: 0;
              padding: 0;
              background: #ffffff;
              color: #000000;
              font-family: Arial, Helvetica, sans-serif;
              font-size: 11px;
              line-height: 1.3;
            }
            body {
              padding: 15px;
            }
            .header-container {
              text-align: center;
              margin-bottom: 12px;
              border-bottom: 2px solid #000000;
              padding-bottom: 8px;
            }
            .clinic-title {
              font-size: 20px;
              font-weight: 900;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              margin: 0 0 3px 0;
              color: #000000;
            }
            .doc-title {
              font-size: 13px;
              font-weight: 800;
              text-transform: uppercase;
              margin: 0;
              color: #111111;
            }
            .meta-info {
              display: flex;
              justify-content: space-between;
              align-items: center;
              font-size: 10px;
              font-weight: bold;
              margin-top: 8px;
              color: #333333;
            }
            .badge {
              background-color: #f1f5f9;
              border: 1px solid #cbd5e1;
              padding: 2px 6px;
              border-radius: 4px;
              text-transform: uppercase;
            }
            table.po-table {
              width: 100%;
              border-collapse: collapse;
              border: 2px solid #000000;
              margin-top: 10px;
              font-size: 11px;
              page-break-inside: auto;
            }
            table.po-table thead {
              display: table-header-group;
            }
            table.po-table tr {
              page-break-inside: avoid;
              break-inside: avoid;
            }
            table.po-table th, table.po-table td {
              border: 1px solid #000000;
              padding: 5px 6px;
              box-sizing: border-box;
              vertical-align: middle;
            }
            .table-title {
              background-color: #f8fafc;
              text-align: center;
              font-size: 12px;
              font-weight: 900;
              text-transform: uppercase;
              padding: 6px;
              letter-spacing: 0.5px;
            }
            .header-row th {
              background-color: #f1f5f9;
              font-weight: 800;
              font-size: 10px;
              text-align: left;
              text-transform: uppercase;
            }
            .col-name {
              font-weight: 600;
              text-align: left;
              color: #000000;
            }
            .col-qty {
              font-weight: 800;
              text-align: center;
              color: #000000;
              background-color: #fafafa;
            }
            .footer-signatures {
              margin-top: 40px;
              display: flex;
              justify-content: space-between;
              padding: 0 20px;
              page-break-inside: avoid;
            }
            .sig-box {
              text-align: center;
              width: 200px;
              border-top: 1px solid #000000;
              padding-top: 4px;
              font-weight: bold;
              font-size: 10px;
              text-transform: uppercase;
            }
            @media print {
              body { padding: 0; }
              .no-print { display: none !important; }
            }
          </style>
        </head>
        <body>
          <div class="no-print" style="margin-bottom: 15px; padding: 10px; background: #e0e7ff; border: 1px solid #c7d2fe; border-radius: 6px; display: flex; justify-content: space-between; align-items: center;">
            <span style="font-weight: bold; color: #3730a3;">A4 Purchase Order Printable Document (${filteredItems.length} items)</span>
            <button onclick="window.print()" style="padding: 6px 16px; background: #4f46e5; color: white; border: none; border-radius: 4px; font-weight: bold; cursor: pointer;">
              🖨️ Print Document
            </button>
          </div>

          <div class="header-container">
            <h1 class="clinic-title">${clinicName}</h1>
            <h2 class="doc-title">PURCHASE ORDER & MINIMUM THRESHOLD REQUISITION</h2>
            <div class="meta-info">
              <span>Date: ${printDate}</span>
              <span class="badge">Category: ${poCategoryFilter === 'ALL' ? 'All Categories' : poCategoryFilter}</span>
              <span class="badge">Scope: ${poOnlyLowStock ? 'Shortage Items Only' : 'Full Category List'}</span>
              <span>Total Items: ${filteredItems.length}</span>
            </div>
          </div>

          ${tableHtml}

          <div class="footer-signatures">
            <div class="sig-box">Prepared By (Pharmacy Manager)</div>
            <div class="sig-box">Approved By (Clinic Administrator)</div>
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

  // Clinical Medicine Label Print States
  const [labelPatientId, setLabelPatientId] = useState('');
  const [labelVisitId, setLabelVisitId] = useState('');
  const [labelSearchQuery, setLabelSearchQuery] = useState('');
  const [customLabelStates, setCustomLabelStates] = useState<{[medId: string]: { instructions: string; notes: string; qty: string; expiry: string }}>({});
  const [isLabelPrintModalOpen, setIsLabelPrintModalOpen] = useState(false);
  const [labelPrintData, setLabelPrintData] = useState<{
    patientName: string;
    patientAge: string;
    patientSex: string;
    visitDate: string;
    visitId: string;
    medicines: {
      name: string;
      instructions: string;
      notes: string;
      qty: string;
      expiry: string;
    }[];
  } | null>(null);

  // Rights verification
  const currentRight = userRights.find((r) => r.MenuID === 'pharmacy');
  const inventoryRight = userRights.find((r) => r.MenuID === 'inventory') || currentRight;

  const isAdmin = currentUser?.Role === 'Administrator';
  const canAdd = isAdmin || (currentRight ? currentRight.AddRec : true);
  const canPost = isAdmin || (currentRight ? currentRight.PostRec : true);

  // Dedicated Stock Management Permissions
  const canViewStock = isAdmin || (inventoryRight ? inventoryRight.Status : true);
  const canAddStock = isAdmin || (inventoryRight ? inventoryRight.AddRec : true);
  const canEditStock = isAdmin || (
    currentUser?.Permissions?.canEditStockLevel !== undefined
      ? currentUser.Permissions.canEditStockLevel
      : (inventoryRight ? inventoryRight.PostRec : false)
  );
  const canCancelStock = isAdmin || (inventoryRight ? inventoryRight.CancelPosted : true);

  // Active Billing Form
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [billingShift, setBillingShift] = useState<1 | 2>(() => currentUser?.AssignedShift === 2 ? 2 : 1);
  const [discountInput, setDiscountInput] = useState<number>(0);
  const [showPatentSourcingModal, setShowPatentSourcingModal] = useState(false);
  const [patientSourcingOption, setPatientSourcingOption] = useState<'Clinic' | 'Outside'>('Clinic');
  
  // Store Medicine State
  const [storePatientId, setStorePatientId] = useState('');
  const [storeShift, setStoreShift] = useState<1 | 2>(() => currentUser?.AssignedShift === 2 ? 2 : 1);

  // Sync shifts with active logged-in user assigned shift
  useEffect(() => {
    const userShift = currentUser?.AssignedShift === 2 ? 2 : 1;
    setBillingShift(userShift);
    setStoreShift(userShift);
  }, [currentUser?.UserID, currentUser?.AssignedShift]);
  const [storeDiscountPercent, setStoreDiscountPercent] = useState<number | null>(0);
  const [storeDiscountInput, setStoreDiscountInput] = useState<number | string>('');
  const [storeBasket, setStoreBasket] = useState<{ ItemID: string; Qty: number; Price: number; MedicineType?: 'C' | 'P' | 'S' }[]>([]);
  const [storeRowItemId, setStoreRowItemId] = useState('');
  const [storeRowQty, setStoreRowQty] = useState<number>(1);
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
          if (matched.MedicineType === 'C') {
            playBeepSound('error');
            setScanToastMsg({
              text: `"${matched.ItemName}" is a Clinical Compounding item. Dispense via Clinical Checkout.`,
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
              { ItemID: matched.ItemID, Qty: 1, Price: matched.Price, MedicineType: 'P' }
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
        playBeepSound('success');
        if (activeSubTab === 'store_sales') {
          setStoreRowItemId(matched.ItemID);
          setStoreSearchQuery(matched.ItemName);
        } else if (activeSubTab === 'checkout') {
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

  // History & Sales Report Period Filter state
  const [salesReportPeriodMode, setSalesReportPeriodMode] = useState<'daily' | 'range' | 'all'>('daily');
  const [salesReportStartDate, setSalesReportStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().split('T')[0];
  });
  const [salesReportEndDate, setSalesReportEndDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [selectedShiftFilter, setSelectedShiftFilter] = useState<'all' | '1' | '2'>('all');
  const [showAllInvoicesInHistory, setShowAllInvoicesInHistory] = useState(false);
  const [searchHistoryQuery, setSearchHistoryQuery] = useState('');

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

  // Comprehensive patient collection ensuring archive and visit patients are included
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

    const printWin = window.open('', '_blank', 'width=650,height=900');
    if (!printWin) {
      window.print();
      return;
    }

    printWin.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Clinical Medicine Label Print (2" x 0.2" - 2x2 Grid on A4)</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            @page {
              size: A4;
              margin: 10mm;
            }
            body {
              margin: 0;
              padding: 0;
              background: white;
              color: #000;
              font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
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
            }
            .label-sticker-page {
              width: 2in;
              min-height: 0.2in;
              max-width: 2in;
              box-sizing: border-box;
              border: 1px dashed #475569;
              border-radius: 3px;
              padding: 2px 4px;
              font-size: 9px;
              line-height: 1.1;
            }
          </style>
        </head>
        <body>
          <div>
            ${elem.innerHTML}
          </div>
          <script>
            setTimeout(() => {
              window.focus();
              window.print();
            }, 350);
          </script>
        </body>
      </html>
    `);
    printWin.document.close();
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

  const handleAddToStoreBasket = () => {
    if (!storeRowItemId) return;
    const selectedItem = items.find((i) => i.ItemID === storeRowItemId);
    if (!selectedItem) return;

    // Strict Restriction: ONLY allow Patent Medicines
    if (selectedItem.MedicineType === 'C') {
      setStoreValidationError(
        `Safety Restriction: "${selectedItem.ItemName}" is a Clinical Compounding medicine. These can only be dispensed via a doctor's prescription.`
      );
      return;
    }

    // Verify Stock
    const existingBasketQty = storeBasket.find((b) => b.ItemID === storeRowItemId)?.Qty || 0;
    const totalRequired = existingBasketQty + storeRowQty;

    if (totalRequired > selectedItem.CStock) {
      setStoreValidationError(
        `Critical Alert: Insufficient stock for ${selectedItem.ItemName}. Current stock is only ${selectedItem.CStock} ${selectedItem.Unit}s.`
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
      setStoreBasket([
        ...storeBasket,
        { ItemID: storeRowItemId, Qty: storeRowQty, Price: selectedItem.Price, MedicineType: 'P' }
      ]);
    }

    // Reset scratchpad
    setStoreRowItemId('');
    setStoreRowQty(1);
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
    
    // Validate stock and medicine type one final time before database entry
    for (const basketItem of storeBasket) {
      const dbItem = items.find((itm) => itm.ItemID === basketItem.ItemID);
      if (!dbItem) {
        alert(`Product ID ${basketItem.ItemID} not found in the inventory system.`);
        return;
      }
      if (dbItem.CStock < basketItem.Qty) {
        alert(`Stock validation failed for ${dbItem.ItemName}. Aborting checkout.`);
        return;
      }
      if (dbItem.MedicineType === 'C') {
        alert(`Safety violation: "${dbItem.ItemName}" is a clinical compounding medicine and cannot be sold directly. Aborting.`);
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

    const newDetails: InvoiceDetail[] = storeBasket.map((b) => ({
      InvoiceNo: nextInvoiceNo,
      ItemID: b.ItemID,
      Qty: b.Qty,
      Price: b.Price,
      LineTotal: b.Qty * b.Price,
      MedicineType: 'P'
    }));

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
  const todayStr = new Date().toISOString().split('T')[0];
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      const invDate = String(inv.InvoiceDate || '').trim().slice(0, 10);

      // Period Mode Filter
      if (salesReportPeriodMode === 'daily') {
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
    const grossAmount = filteredInvoices.reduce((sum, inv) => sum + (Number(inv.GAmount) || 0), 0);
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
    <div className="p-8 space-y-6 overflow-y-auto flex-1 bg-slate-50 text-slate-800 relative" id="pharmacy-pos">
      <TopProgressBar active={isSubTabLoading} />

      {/* Upper Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-end space-y-4 md:space-y-0">
        {/* Sub Navigation */}
        <div className="flex flex-wrap gap-1.5 bg-slate-100 p-1 rounded-lg border border-slate-200">
          <button
            onClick={() => handleSubTabSwitch('checkout', 'Clinical Medicine')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition cursor-pointer ${
              activeSubTab === 'checkout' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>Clinical Medicine</span>
          </button>
          <button
            onClick={() => handleSubTabSwitch('store_sales', 'Store Medicine')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition cursor-pointer ${
              activeSubTab === 'store_sales' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShoppingCart className="w-3.5 h-3.5 text-emerald-500" />
            <span>Store Medicine</span>
          </button>
          <button
            onClick={() => handleSubTabSwitch('return', 'Sales Returns')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition cursor-pointer ${
              activeSubTab === 'return' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Undo2 className="w-3.5 h-3.5" />
            <span>Sales Returns</span>
          </button>

          <button
            onClick={() => handleSubTabSwitch('inventory_manager', 'Stock Grid & Manager')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition cursor-pointer ${
              activeSubTab === 'inventory_manager' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Stock Grid & Manager</span>
            {!canViewStock && <Lock className="w-3 h-3 text-amber-500 ml-1" />}
          </button>
          <button
            onClick={() => handleSubTabSwitch('invoice_logs', 'Invoice Logs')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition cursor-pointer ${
              activeSubTab === 'invoice_logs' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <History className="w-3.5 h-3.5 text-blue-500" />
            <span>Invoice logs</span>
          </button>
          <button
            onClick={() => handleSubTabSwitch('clinical_labels', 'Clinic Medicine Label Printer')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition cursor-pointer ${
              activeSubTab === 'clinical_labels' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Tag className="w-3.5 h-3.5 text-indigo-500" />
            <span>Clinic Medicine Label Printer</span>
          </button>
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
      {activeSubTab === 'checkout' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn" id="pos-billing-tab">
          
          {/* POS Bill Builder */}
          <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-950 flex items-center border-b border-slate-100 pb-3">
              <ShoppingCart className="w-4 h-4 text-emerald-500 mr-2" />
              Clinical Medicine
            </h3>

            {billingSuccess && (
              <div className="p-4 bg-emerald-50 text-emerald-800 text-xs rounded-xl font-medium border border-emerald-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3 animate-fadeIn">
                <div className="flex items-center space-x-2.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div>
                    <span className="font-bold text-sm text-emerald-950 block">{billingSuccess}</span>
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

            {stockValidationError && (
              <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg font-semibold border border-red-100 flex items-center">
                <AlertCircle className="w-4 h-4 mr-2 shrink-0 text-red-500" />
                {stockValidationError}
              </div>
            )}

            {/* Patient Selection & Doctor Prescription Lookup */}
            <div className="bg-emerald-50/70 p-3.5 sm:p-4 rounded-xl border border-emerald-200 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <label className="block text-xxs font-bold text-emerald-800 uppercase tracking-wider">
                    Select Patient / Lookup Prescription
                  </label>
                  <p className="text-[11px] text-emerald-700">
                    Loads Prescribed Clinical Compounding Medicines recorded in Patient Visit sub-tab.
                  </p>
                </div>
                {selectedPatientId && (
                  <button
                    type="button"
                    onClick={() => {
                      setLabelPatientId(selectedPatientId);
                      if (latestVisit) setLabelVisitId(latestVisit.VisitID);
                      setActiveSubTab('clinical_labels');
                    }}
                    className="px-3 py-2 sm:py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg flex items-center justify-center space-x-1 transition cursor-pointer self-stretch sm:self-auto shadow-xs min-h-[38px] sm:min-h-0"
                  >
                    <Tag className="w-3.5 h-3.5 mr-1" />
                    <span>Print Usage Label Stickers</span>
                  </button>
                )}
              </div>

              <select
                value={selectedPatientId}
                onChange={(e) => setSelectedPatientId(e.target.value)}
                className="w-full text-xs font-bold border border-emerald-300 rounded-xl p-3 sm:p-2.5 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[44px]"
              >
                <option value="">-- Choose Patient / Issued Token --</option>
                {(() => {
                  const list = patients.filter((p) => {
                    const hasTok = (tokens || []).some((t) => t.PatientID === p.PatientID);
                    const hasVisTok = (visits || []).some((v) => v.PatientID === p.PatientID && v.TokenNo);
                    const hasVisit = (visits || []).some((v) => v.PatientID === p.PatientID);
                    return hasTok || hasVisTok || hasVisit || p.PatientID === selectedPatientId;
                  });

                  if (list.length === 0) {
                    return <option disabled value="">No patients with visits or tokens found</option>;
                  }

                  return list.map((p, idx) => {
                    const tokenNo = getPatientTokenNo(p.PatientID);
                    const pVisits = visits.filter(v => v.PatientID === p.PatientID);
                    const hasPrescription = pVisits.some(v => getVisitMedicinesList(v).length > 0);
                    return (
                      <option key={`pos-sel-${p.PatientID}-${idx}`} value={p.PatientID}>
                        {p.PatientName} (ID: {p.PatientID}) {tokenNo ? `[Token #${tokenNo}]` : ''} {hasPrescription ? '• [Rx Prescribed]' : ''}
                      </option>
                    );
                  });
                })()}
              </select>

              {/* Prescribed Medicines Box */}
              {selectedPatientId && (
                <div className="bg-white p-3.5 rounded-lg border border-emerald-200 space-y-2.5 mt-2">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                    <span className="text-xs font-black text-slate-900 flex items-center">
                      <Stethoscope className="w-4 h-4 text-emerald-600 mr-1.5" />
                      Doctor's Prescribed Medicines (Rx) for {patients.find(p => p.PatientID === selectedPatientId)?.PatientName}
                    </span>
                    {latestVisit && (
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full font-mono">
                        Visit Date: {latestVisit.VisitDate}
                      </span>
                    )}
                  </div>

                  {prescribedMedicinesList.length === 0 ? (
                    <p className="text-xs text-slate-400 italic py-2">
                      No prescription items recorded for this patient's latest visit. You can search and dispense clinical medicines manually below.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      <div className="divide-y divide-slate-100 max-h-[180px] overflow-y-auto pr-1">
                        {prescribedMedicinesList.map((pm, idx) => (
                          <div key={idx} className="py-2 flex items-center justify-between text-xs">
                            <div className="min-w-0 pr-2">
                              <span className="font-bold text-slate-800 block truncate">
                                {pm.MedicineDetail || pm.ItemID}
                              </span>
                              <span className="text-[10px] text-slate-500 font-mono block">
                                Dosage: {pm.Dosage || 'As directed'} • Type: {pm.MedicineType === 'C' ? 'Clinical Compounding' : 'Patent Medicine'}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleAddPrescribedToBasket(pm)}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xxs rounded-lg transition shrink-0 cursor-pointer"
                            >
                              + Add to Basket
                            </button>
                          </div>
                        ))}
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          prescribedMedicinesList.forEach((pm) => handleAddPrescribedToBasket(pm));
                        }}
                        className="w-full py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs rounded-lg transition shadow-xs flex items-center justify-center space-x-1 cursor-pointer"
                      >
                        <ShoppingCart className="w-3.5 h-3.5" />
                        <span>Add All Prescribed Medicines to Dispense Basket</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* In-Grid Item selector */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-150 space-y-3.5">
              <span className="text-xxs font-bold text-slate-400 uppercase">Search & Dispense Clinical Medicine</span>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                <div className="sm:col-span-2">
                  <div className="flex justify-between items-center">
                    <label className="block text-xxs font-bold text-slate-500 uppercase">Search Clinical Medicine</label>
                    <button
                      type="button"
                      onClick={() => setIsQRScannerOpen(true)}
                      className="text-[10px] font-bold text-emerald-700 hover:text-emerald-800 flex items-center bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded cursor-pointer transition border border-emerald-200"
                    >
                      <QrCode className="w-3 h-3 mr-1" />
                      <span>Scan QR Code</span>
                    </button>
                  </div>
                  <div className="relative mt-1">
                    <input
                      type="text"
                      placeholder=""
                      value={posSearchQuery}
                      onChange={(e) => {
                        const val = e.target.value;
                        setPosSearchQuery(val);
                        setPosSearchDropdownOpen(true);
                        // find if there's an exact match, otherwise clear rowItemId
                        const exact = items.find(i => i.ItemName.toLowerCase() === val.toLowerCase());
                        if (exact) {
                          setRowItemId(exact.ItemID);
                        } else {
                          setRowItemId('');
                        }
                      }}
                      onFocus={() => setPosSearchDropdownOpen(true)}
                      onBlur={() => {
                        // Delay closing slightly so onMouseDown click registers
                        setTimeout(() => setPosSearchDropdownOpen(false), 200);
                      }}
                      className="mt-1 w-full text-xs border border-slate-200 bg-white rounded-lg p-2 pr-8 focus:outline-none focus:border-blue-500 font-medium"
                    />
                    
                    {posSearchQuery && (
                      <button
                        type="button"
                        onClick={() => {
                          setPosSearchQuery('');
                          setRowItemId('');
                        }}
                        className="absolute right-2 top-[12px] text-slate-400 hover:text-slate-600"
                      >
                        <span className="text-xs font-bold font-mono">✕</span>
                      </button>
                    )}

                    {posSearchDropdownOpen && (
                      <div className="absolute z-50 mt-1 w-full max-h-60 overflow-y-auto bg-white border border-slate-200 rounded-lg shadow-lg divide-y divide-slate-100">
                        {(() => {
                          const query = posSearchQuery.toLowerCase().trim();
                          const list = items.filter(itm => 
                            itm.ItemName.toLowerCase().includes(query) || 
                            itm.ItemID.toLowerCase().includes(query)
                          );
                          
                          if (list.length === 0) {
                            return <div className="p-3 text-xs text-slate-400 text-center">No matching pharmaceutical items found</div>;
                          }
                          
                          return list.slice(0, 15).map((itm, idx) => {
                            const isClinical = itm.MedicineType === 'C';
                            return (
                              <div
                                key={`${itm.ItemID}-${idx}`}
                                onMouseDown={() => {
                                  setRowItemId(itm.ItemID);
                                  setPosSearchQuery(itm.ItemName);
                                  setPosSearchDropdownOpen(false);
                                }}
                                className="p-2.5 hover:bg-blue-50 cursor-pointer text-left transition flex justify-between items-center"
                              >
                                <div>
                                  <span className="font-semibold text-xs text-slate-800">{itm.ItemName}</span>
                                  <span className="ml-1.5 text-[10px] text-slate-400 font-mono">({itm.ItemID})</span>
                                </div>
                                <div className="text-right text-xxs font-mono">
                                  {isClinical ? (
                                    <span className="bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-bold">Clinical Medicine</span>
                                  ) : (
                                    <span className="text-slate-600">Rs. {itm.Price}</span>
                                  )}
                                  <span className="ml-2 bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-bold">Stock: {itm.CStock}</span>
                                </div>
                              </div>
                            );
                          });
                        })()}
                      </div>
                    )}
                  </div>

                  {rowItemId && (() => {
                    const sel = items.find(i => i.ItemID === rowItemId);
                    if (!sel) return null;
                    if (sel.MedicineType === 'C') {
                      return (
                        <div className="mt-1.5 space-y-2">
                          <div className="flex items-center justify-between text-xxs bg-emerald-50 border border-emerald-100 text-emerald-800 p-1.5 rounded-md">
                            <span>Selected Ingredient: <strong>{sel.ItemName}</strong> ({sel.ItemID})</span>
                            <span>
                              <span className="text-emerald-700 font-bold">Clinical Medicine (Pre-Paid)</span>
                              <span className="ml-2">| Stock: <strong>{sel.CStock} {sel.Unit}s</strong></span>
                            </span>
                          </div>
                          
                          {/* Formula compounding inputs */}
                          <div className="bg-emerald-50/50 border border-emerald-100 p-3 rounded-lg space-y-2 text-xs">
                            <span className="text-xxs font-black text-emerald-700 uppercase tracking-wider block">🧪 Clinical Box Formula Compounding Wizard</span>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                              <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase">Dose per Day ({sel.Unit}s)</label>
                                <input
                                  type="number"
                                  min="1"
                                  value={compoundingDose}
                                  onChange={(e) => {
                                    const d = Math.max(1, parseInt(e.target.value) || 1);
                                    setCompoundingDose(d);
                                    setRowQty(d * compoundingDays);
                                  }}
                                  className="mt-1 w-full text-xs border border-emerald-200 bg-white rounded p-1.5 focus:outline-none focus:border-emerald-500 font-mono"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase">Duration (Days)</label>
                                <input
                                  type="number"
                                  min="1"
                                  value={compoundingDays}
                                  onChange={(e) => {
                                    const days = Math.max(1, parseInt(e.target.value) || 1);
                                    setCompoundingDays(days);
                                    setRowQty(compoundingDose * days);
                                  }}
                                  className="mt-1 w-full text-xs border border-emerald-200 bg-white rounded p-1.5 focus:outline-none focus:border-emerald-500 font-mono"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase">Formula / Take Notes</label>
                                <input
                                  type="text"
                                  value={compoundingInstructions}
                                  onChange={(e) => setCompoundingInstructions(e.target.value)}
                                  className="mt-1 w-full text-xs border border-emerald-200 bg-white rounded p-1.5 focus:outline-none focus:border-emerald-500 font-medium"
                                  placeholder=""
                                />
                              </div>
                            </div>
                            
                            <div className="bg-white border border-emerald-150 p-2.5 rounded-md flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-1 sm:space-y-0 text-xxs text-slate-600 font-medium">
                              <div>
                                <p className="font-semibold text-slate-800">
                                  Calculated Compounded Quantity: <strong className="text-emerald-700 text-xs font-mono">{compoundingDose * compoundingDays}</strong> {sel.Unit}s
                                </p>
                                <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                                  Formula: {compoundingDose} {sel.Unit}(s) for {compoundingDays} Days ({compoundingInstructions})
                                </p>
                              </div>
                              <div className="text-right sm:border-l sm:pl-3 border-slate-150">
                                <p className="text-slate-500">
                                  Cost Price: <strong className="text-slate-700 font-mono">Rs. {(compoundingDose * compoundingDays * sel.PurchasePrice).toFixed(1)}</strong>
                                </p>
                                <p className="text-emerald-600 font-bold">
                                  Payment Status: <strong className="font-mono">Pre-Paid (Free Dispense)</strong>
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return (
                      <div className="mt-1.5 flex items-center justify-between text-xxs bg-blue-50 border border-blue-100 text-blue-800 p-1.5 rounded-md font-medium">
                        <span>Selected Item: <strong>{sel.ItemName}</strong> ({sel.ItemID})</span>
                        <span>
                          <span>Price: <strong>Rs. {sel.Price}</strong></span>
                          <span className="ml-2">| Stock: <strong>{sel.CStock} {sel.Unit}s</strong></span>
                        </span>
                      </div>
                    );
                  })()}
                </div>

                <div className="flex space-x-2">
                  <div className="w-1/2">
                    <label className="block text-xxs font-bold text-slate-500 uppercase">Qty</label>
                    <input
                      type="number"
                      min="1"
                      value={rowQty}
                      onChange={(e) => setRowQty(parseInt(e.target.value) || 1)}
                      className="mt-1 w-full text-xs border border-slate-200 bg-white rounded-lg p-2 focus:outline-none font-mono"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleAddToBasket}
                    className="w-1/2 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg flex items-center justify-center transition self-end"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add
                  </button>
                </div>
              </div>
            </div>

            {/* Checkout basket list */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 uppercase text-xxs font-bold">
                    <th className="py-2.5 font-bold">Item ID</th>
                    <th className="py-2.5 font-bold">Product</th>
                    <th className="py-2.5 text-center font-bold">Qty</th>
                    <th className="py-2.5 text-right font-bold">Dispense Rate</th>
                    <th className="py-2.5 text-right font-bold">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {checkoutBasket.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-slate-400 font-semibold">Dispensing list is currently empty. Search and add clinical medicines above.</td>
                    </tr>
                  ) : (
                    checkoutBasket.map((b, idx) => {
                      const item = items.find((i) => i.ItemID === b.ItemID);
                      return (
                        <tr key={`${b.ItemID}-${idx}`} className="hover:bg-slate-50/50">
                          <td className="py-2 font-mono text-xxs font-bold text-slate-400">{b.ItemID}</td>
                          <td className="py-2 font-bold text-slate-800">{item ? item.ItemName : 'Unknown'}</td>
                          <td className="py-2 text-center font-bold font-mono">{b.Qty}</td>
                          <td className="py-2 text-right font-mono text-slate-600">
                            <span className="text-emerald-600 font-bold">Pre-paid (Rs. 0)</span>
                          </td>
                          <td className="py-2 text-right">
                            <button
                              type="button"
                              onClick={() => handleRemoveFromBasket(b.ItemID)}
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
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between h-[420px]">
            <div>
              <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">Clinical Medicine Dispensing</h3>
              
              <div className="mt-4 space-y-3 text-xs text-slate-600">
                <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-lg text-emerald-900 space-y-1">
                  <span className="font-extrabold block text-xxs uppercase tracking-wider text-emerald-700">Payment Status:</span>
                  <p className="font-semibold text-xs text-emerald-800">
                    Doctor/Visit desk has already collected clinical medicine payment. No cash collection required.
                  </p>
                </div>

                <div className="border-t border-slate-100 pt-3 flex justify-between items-center text-sm font-bold text-slate-900">
                  <span>Items to Dispense:</span>
                  <span className="font-mono text-emerald-600 font-bold">{checkoutBasket.length} item(s)</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2 pt-4">
              <button
                type="button"
                onClick={() => handleCheckoutInvoice(true)}
                disabled={checkoutBasket.length === 0}
                className={`w-full py-3 rounded-lg text-xs font-bold text-white shadow-md transition flex items-center justify-center ${
                  checkoutBasket.length > 0
                    ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/10'
                    : 'bg-slate-400 cursor-not-allowed'
                }`}
              >
                <Check className="w-4 h-4 mr-1 shrink-0" />
                <span>Dispense Clinical Medicine & Deduct Stock</span>
              </button>
            </div>
          </div>

        </div>
      )}

      {/* Invoice logs Tab */}
      {activeSubTab === 'invoice_logs' && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4 animate-fadeIn" id="today-receipts-history">
          <div className="flex flex-col xl:flex-row xl:items-center justify-between border-b border-slate-100 pb-4 gap-4">
            <div className="flex items-center space-x-2.5">
              <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                <History className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-950">Invoice logs & Sales Reports</h3>
                <p className="text-[11px] text-slate-500 font-medium">History of issued medicine bills with A4 invoices, thermal slips, and customizable daily / periodic sales audit reports</p>
              </div>
            </div>

            {/* Print & Action Trigger */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  if (salesReportPeriodMode === 'range') {
                    handlePrintDailySalesReport(salesReportStartDate, salesReportEndDate);
                  } else if (salesReportPeriodMode === 'all') {
                    handlePrintDailySalesReport();
                  } else {
                    handlePrintDailySalesReport(selectedDailyReportDate);
                  }
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-extrabold text-xs rounded-xl shadow-sm flex items-center space-x-1.5 transition cursor-pointer whitespace-nowrap"
                title="Print sales audit report on A4 paper"
              >
                <Printer className="w-4 h-4 shrink-0" />
                <span>Print</span>
              </button>
            </div>
          </div>

          {/* PERIOD SELECTION & ADVANCED FILTER TOOLBAR */}
          <div className="bg-slate-50 border border-slate-200/80 p-3.5 rounded-xl space-y-3">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              {/* Presets / Period Mode Tabs */}
              <div className="flex flex-wrap items-center gap-1.5 bg-white border border-slate-200 p-1 rounded-xl shadow-xs text-xs font-bold">
                <button
                  type="button"
                  onClick={() => {
                    setSalesReportPeriodMode('daily');
                    setSelectedDailyReportDate(todayStr);
                    setShowAllInvoicesInHistory(false);
                  }}
                  className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                    salesReportPeriodMode === 'daily' && selectedDailyReportDate === todayStr
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSalesReportPeriodMode('daily');
                    const yesterday = new Date();
                    yesterday.setDate(yesterday.getDate() - 1);
                    setSelectedDailyReportDate(yesterday.toISOString().split('T')[0]);
                    setShowAllInvoicesInHistory(false);
                  }}
                  className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                    salesReportPeriodMode === 'daily' && selectedDailyReportDate !== todayStr
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  Specific Date
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSalesReportPeriodMode('range');
                    const d = new Date();
                    d.setDate(1);
                    setSalesReportStartDate(d.toISOString().split('T')[0]);
                    setSalesReportEndDate(todayStr);
                    setShowAllInvoicesInHistory(false);
                  }}
                  className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                    salesReportPeriodMode === 'range'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  📅 Custom Period
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSalesReportPeriodMode('all');
                    setShowAllInvoicesInHistory(true);
                  }}
                  className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                    salesReportPeriodMode === 'all'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  All History ({invoices.length})
                </button>
              </div>

              {/* Shift & Search Filters */}
              <div className="flex flex-wrap items-center gap-2.5">
                {/* Shift Selector */}
                <div className="flex items-center space-x-1.5 bg-white border border-slate-200 px-2.5 py-1.5 rounded-xl shadow-xs">
                  <span className="text-xxs font-bold text-slate-500 uppercase">Shift:</span>
                  <select
                    value={selectedShiftFilter}
                    onChange={(e) => setSelectedShiftFilter(e.target.value as any)}
                    className="text-xs bg-transparent border-0 font-bold text-slate-800 focus:outline-none cursor-pointer"
                  >
                    <option value="all">All Shifts</option>
                    <option value="1">☀️ Morning (Shift 1)</option>
                    <option value="2">🌙 Evening (Shift 2)</option>
                  </select>
                </div>

                {/* Search Bar */}
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search invoice or patient..."
                    value={searchHistoryQuery}
                    onChange={(e) => setSearchHistoryQuery(e.target.value)}
                    className="w-full sm:w-48 text-xs border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white shadow-xs transition"
                  />
                </div>
              </div>
            </div>

            {/* Custom Date Pickers (Shown when Daily or Custom Period is Active) */}
            {salesReportPeriodMode === 'daily' && (
              <div className="flex items-center space-x-2 pt-1 border-t border-slate-200/60">
                <span className="text-xs font-bold text-slate-600 flex items-center space-x-1">
                  <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Selected Date:</span>
                </span>
                <input
                  type="date"
                  value={selectedDailyReportDate}
                  onChange={(e) => setSelectedDailyReportDate(e.target.value)}
                  className="text-xs bg-white border border-slate-200 px-3 py-1 rounded-lg font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-xs cursor-pointer"
                />
                <span className="text-xxs font-semibold text-slate-400">
                  Showing sales records strictly for {selectedDailyReportDate === todayStr ? "Today" : selectedDailyReportDate}
                </span>
              </div>
            )}

            {salesReportPeriodMode === 'range' && (
              <div className="flex flex-wrap items-center gap-3 pt-1 border-t border-slate-200/60">
                <span className="text-xs font-black text-indigo-900 flex items-center space-x-1">
                  <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Custom Date Range:</span>
                </span>
                <div className="flex items-center space-x-1.5 bg-white border border-slate-200 px-2.5 py-1 rounded-lg shadow-xs">
                  <span className="text-xxs font-bold text-slate-500 uppercase">From:</span>
                  <input
                    type="date"
                    value={salesReportStartDate}
                    onChange={(e) => setSalesReportStartDate(e.target.value)}
                    className="text-xs bg-transparent border-0 font-bold text-slate-800 focus:outline-none cursor-pointer"
                  />
                </div>
                <div className="flex items-center space-x-1.5 bg-white border border-slate-200 px-2.5 py-1 rounded-lg shadow-xs">
                  <span className="text-xxs font-bold text-slate-500 uppercase">To:</span>
                  <input
                    type="date"
                    value={salesReportEndDate}
                    onChange={(e) => setSalesReportEndDate(e.target.value)}
                    className="text-xs bg-transparent border-0 font-bold text-slate-800 focus:outline-none cursor-pointer"
                  />
                </div>
                <span className="text-xxs font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full">
                  Filtering {filteredInvoices.length} Invoices between {salesReportStartDate} and {salesReportEndDate}
                </span>
              </div>
            )}
          </div>

          {/* LIVE SUMMARY KPI METRICS STRIP */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl">
              <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider block">Invoices Filtered</span>
              <div className="text-lg font-black text-slate-900 mt-0.5">{periodSalesSummary.totalInvoices} Bills</div>
            </div>
            <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl">
              <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider block">Medicine Units Sold</span>
              <div className="text-lg font-black text-sky-900 mt-0.5">{periodSalesSummary.totalUnits.toLocaleString()} Units</div>
            </div>
            <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl">
              <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider block">Gross Sales</span>
              <div className="text-lg font-black text-slate-700 mt-0.5">Rs. {periodSalesSummary.grossAmount.toLocaleString()}</div>
            </div>
            <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl">
              <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider block">Total Discounts</span>
              <div className="text-lg font-black text-rose-600 mt-0.5">- Rs. {periodSalesSummary.discount.toLocaleString()}</div>
            </div>
            <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl col-span-2 sm:col-span-1">
              <span className="text-[10px] font-extrabold uppercase text-emerald-800 tracking-wider block">Net Realized Cash</span>
              <div className="text-lg font-black text-emerald-700 mt-0.5 font-mono">Rs. {periodSalesSummary.netAmount.toLocaleString()}</div>
              <div className="text-[9.5px] font-semibold text-emerald-900/80 mt-0.5">
                ☀️ Rs. {periodSalesSummary.shift1Net.toLocaleString()} • 🌙 Rs. {periodSalesSummary.shift2Net.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Invoices List Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 uppercase text-xxs font-bold">
                  <th className="py-2.5 font-bold">Invoice Ref</th>
                  <th className="py-2.5 font-bold">Patient / Customer</th>
                  <th className="py-2.5 font-bold">Shift & Date</th>
                  <th className="py-2.5 font-bold">Dispatched Medications (Rx)</th>
                  <th className="py-2.5 text-right font-bold">Net Total Paid</th>
                  <th className="py-2.5 text-center font-bold">Print & Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400 font-semibold bg-slate-50/50 rounded-lg">
                      No medicine dispatch receipts match the selected date or search filter.
                    </td>
                  </tr>
                ) : (
                  filteredInvoices.map((inv) => {
                    const patientName = getPatientName(inv.PatientID);
                    const isToday = inv.InvoiceDate === new Date().toISOString().split('T')[0];
                    const details = invoiceDetails.filter((d) => d.InvoiceNo === inv.InvoiceNo);
                    const basket = details.map((d) => ({
                      ItemID: d.ItemID,
                      Qty: d.Qty,
                      Price: d.Price,
                      MedicineType: d.MedicineType
                    }));
                    const billObj = {
                      patient: patients.find((p) => p.PatientID === inv.PatientID) || null,
                      basket: basket,
                      discount: inv.Discount,
                      netAmount: inv.NetAmount,
                      shift: inv.shift,
                      invoiceNo: inv.InvoiceNo,
                      invoiceDate: inv.InvoiceDate
                    };

                    return (
                      <tr key={inv.InvoiceNo} className="hover:bg-slate-50/50 group transition duration-150">
                        <td className="py-3 font-mono font-bold text-xs text-slate-900">
                          <span className="block">{inv.InvoiceNo}</span>
                          <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider mt-1 ${inv.Status === 2 ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-amber-100 text-amber-800 border border-amber-200'}`}>
                            {inv.Status === 2 ? 'Posted' : 'Draft'}
                          </span>
                        </td>
                        <td className="py-3">
                          <span className="font-bold text-slate-800 block text-xs">{patientName}</span>
                          <span className="text-xxs text-slate-400 font-mono block">ID: {inv.PatientID || 'Walk-in'}</span>
                        </td>
                        <td className="py-3">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${inv.shift === 1 ? 'bg-orange-50 text-orange-700 border border-orange-100' : 'bg-purple-50 text-purple-700 border border-purple-100'}`}>
                            {inv.shift === 1 ? 'Morning (1)' : 'Evening (2)'}
                          </span>
                          <span className="text-xxs text-slate-400 font-mono block mt-1">{inv.InvoiceDate} {isToday && '• Today'}</span>
                        </td>
                        <td className="py-3 max-w-xs">
                          <div className="flex flex-wrap gap-1">
                            {details.map((d, idx) => {
                              const item = items.find((itm) => itm.ItemID === d.ItemID);
                              return (
                                <span key={`${d.ItemID}-${idx}`} className="inline-flex items-center px-1.5 py-0.5 rounded text-xxs font-semibold bg-slate-100 text-slate-700 border border-slate-200/60 hover:bg-slate-200 transition">
                                  {item ? item.ItemName : d.ItemID} <span className="text-[10px] text-slate-400 ml-1 font-mono">x{d.Qty}</span>
                                </span>
                              );
                            })}
                          </div>
                        </td>
                        <td className="py-3 text-right font-mono font-bold text-sm text-slate-900">
                          Rs. {inv.NetAmount.toLocaleString()}
                        </td>
                        <td className="py-3 text-center">
                          <div className="flex items-center justify-center space-x-1">
                            {/* A4 Print Button */}
                            <button
                              type="button"
                              onClick={() => handlePrintA4Invoice(billObj)}
                              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xxs font-bold rounded border border-slate-300 transition flex items-center cursor-pointer shadow-xs"
                              title="Print full A4 size invoice"
                            >
                              <FileText className="w-3 h-3 mr-1 text-slate-600" />
                              A4 Print
                            </button>

                            {/* Thermal Slip Print Button */}
                            <button
                              type="button"
                              onClick={() => handlePrintThermalReceipt(billObj)}
                              className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xxs font-bold rounded border border-emerald-300 transition flex items-center cursor-pointer shadow-xs"
                              title="Print 80mm POS customer thermal receipt"
                            >
                              <Receipt className="w-3 h-3 mr-1 text-emerald-600" />
                              Thermal
                            </button>

                            {/* Preview Modal Button */}
                            <button
                              type="button"
                              onClick={() => {
                                setPrintBillData(billObj);
                                setPrintModalOpen(true);
                              }}
                              className="p-1 bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 rounded transition flex items-center justify-center cursor-pointer"
                              title="Open visual print preview"
                            >
                              <Printer className="w-3.5 h-3.5" />
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
        </div>
      )}

      {/* Store Medicine Tab */}
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

            {storeValidationError && (
              <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg font-semibold border border-red-100 flex items-center">
                <AlertCircle className="w-4 h-4 mr-2 shrink-0 text-red-500" />
                {storeValidationError}
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
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-150 space-y-3.5">
              <span className="text-xxs font-bold text-slate-400 uppercase">Select Patent Medicine</span>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                <div className="sm:col-span-2">
                  <div className="flex justify-between items-center">
                    <label className="block text-xxs font-bold text-slate-500 uppercase">Search Patent Medicine</label>
                    <button
                      type="button"
                      onClick={() => setIsQRScannerOpen(true)}
                      className="text-[10px] font-bold text-emerald-700 hover:text-emerald-800 flex items-center bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded cursor-pointer transition border border-emerald-200"
                    >
                      <QrCode className="w-3 h-3 mr-1" />
                      <span>Scan QR Code</span>
                    </button>
                  </div>
                  <div className="relative mt-1">
                    <input
                      type="text"
                      placeholder=""
                      value={storeSearchQuery}
                      onChange={(e) => {
                        const val = e.target.value;
                        setStoreSearchQuery(val);
                        setStoreSearchDropdownOpen(true);
                        const exact = items.find(i => i.MedicineType !== 'C' && i.ItemName.toLowerCase() === val.toLowerCase());
                        if (exact) {
                          setStoreRowItemId(exact.ItemID);
                        } else {
                          setStoreRowItemId('');
                        }
                      }}
                      onFocus={() => setStoreSearchDropdownOpen(true)}
                      onBlur={() => {
                        setTimeout(() => setStoreSearchDropdownOpen(false), 200);
                      }}
                      className="mt-1 w-full text-xs border border-slate-200 bg-white rounded-lg p-2 pr-8 focus:outline-none focus:border-blue-500 font-medium"
                    />
                    
                    {storeSearchQuery && (
                      <button
                        type="button"
                        onClick={() => {
                          setStoreSearchQuery('');
                          setStoreRowItemId('');
                        }}
                        className="absolute right-2 top-[12px] text-slate-400 hover:text-slate-600"
                      >
                        <span className="text-xs font-bold font-mono">✕</span>
                      </button>
                    )}

                    {storeSearchDropdownOpen && (
                      <div className="absolute z-50 mt-1 w-full max-h-60 overflow-y-auto bg-white border border-slate-200 rounded-lg shadow-lg divide-y divide-slate-100">
                        {(() => {
                          const query = storeSearchQuery.toLowerCase().trim();
                          const list = items.filter(itm => 
                            itm.MedicineType !== 'C' && (
                              itm.ItemName.toLowerCase().includes(query) || 
                              itm.ItemID.toLowerCase().includes(query)
                            )
                          );
                          
                          if (list.length === 0) {
                            return <div className="p-3 text-xs text-slate-400 text-center">No matching patent medicines found</div>;
                          }
                          
                          return list.slice(0, 15).map((itm, idx) => (
                            <div
                              key={`${itm.ItemID}-${idx}`}
                              onMouseDown={() => {
                                setStoreRowItemId(itm.ItemID);
                                setStoreSearchQuery(itm.ItemName);
                                setStoreSearchDropdownOpen(false);
                              }}
                              className="p-2.5 hover:bg-emerald-50 cursor-pointer text-left transition flex justify-between items-center"
                            >
                              <div>
                                <span className="font-semibold text-xs text-slate-800">{itm.ItemName}</span>
                                <span className="ml-1.5 text-[10px] text-slate-400 font-mono">({itm.ItemID})</span>
                              </div>
                              <div className="text-right text-xxs font-mono">
                                <span className="text-slate-600 font-bold">Rs. {itm.Price}</span>
                                <span className="ml-2 bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-bold">Stock: {itm.CStock}</span>
                              </div>
                            </div>
                          ));
                        })()}
                      </div>
                    )}
                  </div>

                  {storeRowItemId && (() => {
                    const sel = items.find(i => i.ItemID === storeRowItemId);
                    if (!sel) return null;
                    return (
                      <div className="mt-1.5 flex items-center justify-between text-xxs bg-emerald-50 border border-emerald-100 text-emerald-800 p-1.5 rounded-md font-medium">
                        <span>Selected Patent Medicine: <strong>{sel.ItemName}</strong> ({sel.ItemID})</span>
                        <span>
                          <span>Price: <strong>Rs. {sel.Price}</strong></span>
                          <span className="ml-2">| Stock: <strong>{sel.CStock} {sel.Unit}s</strong></span>
                        </span>
                      </div>
                    );
                  })()}
                </div>

                <div className="flex space-x-2">
                  <div className="w-1/2">
                    <label className="block text-xxs font-bold text-slate-500 uppercase">Qty</label>
                    <input
                      type="number"
                      min="1"
                      value={storeRowQty}
                      onChange={(e) => setStoreRowQty(parseInt(e.target.value) || 1)}
                      className="mt-1 w-full text-xs border border-slate-200 bg-white rounded-lg p-2 focus:outline-none font-mono"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleAddToStoreBasket}
                    className="w-1/2 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg flex items-center justify-center transition self-end"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add
                  </button>
                </div>
              </div>
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
      {activeSubTab === 'return' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fadeIn" id="pos-returns-tab">
          
          {/* Invoice lookup & return calculator */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-950 flex items-center border-b border-slate-100 pb-3">
              <Undo2 className="w-4.5 h-4.5 text-emerald-500 mr-2" />
              Invoice Reversals / Returns Worksheet
            </h3>

            {returnSuccess && (
              <div className="p-3 bg-emerald-50 text-emerald-700 text-xs rounded-lg font-semibold border border-emerald-100">
                {returnSuccess}
              </div>
            )}

            <form onSubmit={handleLookupInvoice} className="flex space-x-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder=""
                  value={lookupInvoiceNo}
                  onChange={(e) => setLookupInvoiceNo(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-lg pl-8 pr-3 py-2 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition"
              >
                Lookup Invoice
              </button>
            </form>

            {matchedInvoice && (
              <form onSubmit={handlePostSalesReturn} className="space-y-4 pt-2 animate-fadeIn">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1.5 text-xxs font-medium text-slate-600">
                  <div className="flex justify-between font-bold text-slate-900">
                    <span>Invoice Ref: {matchedInvoice.InvoiceNo}</span>
                    <span>Date: {matchedInvoice.InvoiceDate}</span>
                  </div>
                  <p>Original Customer: <strong className="text-slate-800 font-bold">{getPatientName(matchedInvoice.PatientID)}</strong></p>
                  <p>Gross: Rs. {matchedInvoice.GAmount} | Net Paid: Rs. {matchedInvoice.NetAmount} (Discount: Rs. {matchedInvoice.Discount})</p>
                </div>

                {/* Return rows table */}
                <div className="overflow-x-auto border border-slate-200 rounded-xl p-3 bg-slate-50/20">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-400 uppercase text-xxs font-bold">
                        <th className="py-2">Medicine ID</th>
                        <th className="py-2">Item</th>
                        <th className="py-2 text-center">Original Qty</th>
                        <th className="py-2 text-center">Qty to Return</th>
                        <th className="py-2 text-right">Refund Rate</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {returnBasket.map((row, idx) => {
                        const originalQty = invoiceDetails.find(
                          (d) => d.InvoiceNo === matchedInvoice.InvoiceNo && d.ItemID === row.ItemID
                        )?.Qty || 0;
                        const name = items.find((i) => i.ItemID === row.ItemID)?.ItemName || row.ItemID;

                        return (
                          <tr key={idx} className="hover:bg-slate-50/50">
                            <td className="py-2 font-mono text-xxs font-semibold text-slate-400">{row.ItemID}</td>
                            <td className="py-2 font-bold text-slate-800 truncate max-w-[150px]">{name}</td>
                            <td className="py-2 text-center font-bold font-mono">{originalQty}</td>
                            <td className="py-2 text-center">
                              <input
                                type="number"
                                min="0"
                                max={originalQty}
                                value={row.QtyReturned}
                                onChange={(e) => {
                                  const updated = [...returnBasket];
                                  updated[idx].QtyReturned = Math.min(originalQty, parseInt(e.target.value) || 0);
                                  setReturnBasket(updated);
                                }}
                                className="w-12 text-center text-xs font-mono border border-slate-200 rounded bg-white p-1 focus:outline-none"
                              />
                            </td>
                            <td className="py-2 text-right font-mono text-slate-600 font-bold">Rs. {row.PriceRef}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div>
                  <label className="block text-xxs font-bold text-slate-500 uppercase">Return Reason / Internal remarks</label>
                  <textarea
                    placeholder=""
                    required
                    rows={2}
                    value={returnRemarks}
                    onChange={(e) => setReturnRemarks(e.target.value)}
                    className="mt-1 w-full text-xs border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={!canPost}
                  className={`w-full py-2.5 rounded-lg text-xs font-bold text-white transition ${
                    canPost ? 'bg-red-600 hover:bg-red-700 shadow-md shadow-red-600/10' : 'bg-slate-400 cursor-not-allowed'
                  }`}
                >
                  Finalize Sales Return & Credit Refund Cash
                </button>
              </form>
            )}
          </div>

          {/* Return ledger summary */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col h-[520px]">
            <h3 className="text-sm font-bold text-slate-900 mb-3">Reversal Transaction Logs</h3>
            <div className="flex-1 overflow-y-auto space-y-3">
              {invoices.filter((inv) => inv.Status === 2).length === 0 ? (
                <p className="text-xs text-slate-400 font-semibold text-center py-16">No posted invoices to reverse.</p>
              ) : (
                <p className="text-xxs text-slate-400 font-medium">Lookup returned items, check safety restock levels, or audit active cash box refunds here.</p>
              )}
            </div>
          </div>

        </div>
      )}



      {/* Stock Grid & Manager Tab */}
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
        <div className="space-y-6 animate-fadeIn" id="pos-inventory-manager-tab">
          
          <div className="flex flex-col space-y-4">
            
            {/* Category Dropdown Top Toolbar Bar */}
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-4 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3 flex-1 min-w-0">
                <div className="p-2.5 bg-indigo-500/20 text-indigo-300 rounded-xl border border-indigo-400/30 shrink-0">
                  <Tag className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-[220px] max-w-lg">
                  <label className="block text-[10px] font-black uppercase tracking-wider text-indigo-300 mb-1">
                    Select Medicine Category
                  </label>
                  <select
                    value={invCategoryFilter}
                    onChange={(e) => {
                      setInvCategoryFilter(e.target.value);
                      setInvCurrentPage(1);
                    }}
                    className="w-full py-2 px-3 bg-slate-800 text-white border border-slate-700 rounded-xl text-xs font-bold shadow-xs focus:outline-none focus:ring-2 focus:ring-indigo-400 cursor-pointer"
                  >
                    {navCategories.map((cat) => (
                      <option key={cat.id} value={cat.id} className="bg-slate-900 text-white py-1">
                        {cat.label} {cat.isFeatured ? ' (Default)' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(true)}
                  className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl flex items-center space-x-1.5 font-bold text-xs transition cursor-pointer shrink-0 self-end md:self-auto"
                  title="Category Add & Edit Manager"
                >
                  <Tag className="w-3.5 h-3.5" />
                  <span>Category Manager</span>
                </button>
              </div>

              <div className="flex items-center space-x-2 shrink-0 self-end md:self-auto">
                <button
                  type="button"
                  onClick={handleOpenAddMedicineModal}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl flex items-center transition cursor-pointer font-bold text-xs shadow-sm"
                >
                  <PlusCircle className="w-4 h-4 mr-1.5" />
                  <span>Add New Medicine</span>
                </button>
              </div>
            </div>

            {/* Main Area: Excel Sheet Style Inventory Grid View */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col space-y-4">
              
              {/* Spreadsheet Header Toolbar & Quick Search */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-900 text-white p-3.5 rounded-xl border border-slate-800">
                <div className="flex items-center space-x-2 flex-1 min-w-0">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-emerald-400" />
                    <input
                      type="text"
                      placeholder="Quick Search: Type Medicine Name, ID, Category, Batch #, or Barcode..."
                      value={invSearchQuery}
                      onChange={(e) => {
                        setInvSearchQuery(e.target.value);
                        setInvCurrentPage(1);
                      }}
                      className="w-full text-xs border border-slate-700 bg-slate-950 text-white placeholder-slate-400 rounded-lg pl-9 pr-8 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400 font-mono font-medium shadow-inner"
                    />
                    {invSearchQuery && (
                      <button
                        type="button"
                        onClick={() => {
                          setInvSearchQuery('');
                          setInvCurrentPage(1);
                        }}
                        className="absolute right-2.5 top-2.5 text-slate-400 hover:text-white"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  {/* Expiry Status Filter Selector */}
                  <div className="flex items-center space-x-1 bg-slate-800 p-0.5 rounded-lg border border-slate-700">
                    <button
                      type="button"
                      onClick={() => {
                        setInvExpiryFilterScope('ALL');
                        setInvCurrentPage(1);
                      }}
                      className={`px-2 py-1 rounded text-[10px] font-bold transition cursor-pointer ${
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
                      className={`px-2 py-1 rounded text-[10px] font-bold transition cursor-pointer flex items-center space-x-1 ${
                        invExpiryFilterScope === 'EXPIRED'
                          ? 'bg-rose-600 text-white'
                          : 'text-rose-300 hover:text-white hover:bg-rose-950/40'
                      }`}
                    >
                      <span>🔴 Expired</span>
                      <span className="px-1 py-0.2 bg-rose-800 text-white rounded text-[9px] font-mono">
                        {items.filter(i => getItemExpirySummary(i).status === 'EXPIRED' || getItemExpirySummary(i).status === 'PARTIAL_EXPIRED').length}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setInvExpiryFilterScope('NEAR_EXPIRY');
                        setInvCurrentPage(1);
                      }}
                      className={`px-2 py-1 rounded text-[10px] font-bold transition cursor-pointer flex items-center space-x-1 ${
                        invExpiryFilterScope === 'NEAR_EXPIRY'
                          ? 'bg-amber-600 text-white'
                          : 'text-amber-300 hover:text-white hover:bg-amber-950/40'
                      }`}
                    >
                      <span>🟡 &lt;90 Days</span>
                      <span className="px-1 py-0.2 bg-amber-800 text-white rounded text-[9px] font-mono">
                        {items.filter(i => getItemExpirySummary(i).status === 'NEAR_EXPIRY').length}
                      </span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setInvLowStockFilter(!invLowStockFilter);
                      setInvCurrentPage(1);
                    }}
                    className={`px-3 py-1.5 rounded-lg flex items-center transition cursor-pointer font-bold text-xs border ${
                      invLowStockFilter
                        ? 'bg-rose-600 text-white border-rose-500 shadow-xs ring-2 ring-rose-400'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                    }`}
                    title="Toggle filter to display only low stock items"
                  >
                    <AlertTriangle className="w-3.5 h-3.5 mr-1.5 text-rose-400 shrink-0" />
                    <span>Low Stock Only</span>
                    <span className="ml-1.5 px-1.5 py-0.2 bg-rose-500 text-white text-[10px] font-black rounded-full font-mono">
                      {items.filter(itm => itm.CStock <= ((itm.MinStock !== undefined && itm.MinStock !== null) ? itm.MinStock : 1)).length}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handlePrintStockGrid()}
                    className={`px-3 py-1.5 rounded-lg flex items-center font-bold text-xs transition cursor-pointer shadow-xs border ${
                      invLowStockFilter
                        ? 'bg-rose-700 hover:bg-rose-600 text-white border-rose-600 ring-2 ring-rose-400/50'
                        : 'bg-indigo-600 hover:bg-indigo-500 text-white border-indigo-500'
                    }`}
                    title={invLowStockFilter ? "Print Low Stock Items List on A4 Paper" : "Print Filtered Stock Grid on A4 Paper"}
                  >
                    <Printer className="w-3.5 h-3.5 mr-1.5" />
                    <span>{invLowStockFilter ? 'Print Low Stock (A4)' : 'Print Stock Report (A4)'}</span>
                  </button>

                  {!invLowStockFilter && (
                    <button
                      type="button"
                      onClick={() => handlePrintStockGrid(true)}
                      className="px-2.5 py-1.5 bg-rose-900/80 hover:bg-rose-800 text-rose-200 hover:text-white border border-rose-700/80 rounded-lg flex items-center font-bold text-xs transition cursor-pointer shadow-xs"
                      title="Directly print all low stock items without changing current filter"
                    >
                      <AlertTriangle className="w-3.5 h-3.5 mr-1 text-rose-400" />
                      <span>Print Low Stock</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      const processedForExport = items.filter((itm) => {
                        if (invLowStockFilter && itm.CStock > ((itm.MinStock !== undefined && itm.MinStock !== null) ? itm.MinStock : 1)) return false;
                        if (invExpiryFilterScope !== 'ALL') {
                          const expSum = getItemExpirySummary(itm);
                          if (invExpiryFilterScope === 'EXPIRED' && expSum.status !== 'EXPIRED' && expSum.status !== 'PARTIAL_EXPIRED') return false;
                          if (invExpiryFilterScope === 'NEAR_EXPIRY' && expSum.status !== 'NEAR_EXPIRY') return false;
                          if (invExpiryFilterScope === 'ACTIVE' && expSum.status !== 'ACTIVE') return false;
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

                      const headers = ["S.No", "Item ID", "Medicine Name", "Category/Unit", "Type", "Current Stock", "Min Threshold", "Reorder Qty", "Unit Cost (Rs)", "Retail Price (Rs)", "Batch No", "Exp Date", "Batches Count"];
                      const rows = processedForExport.map((itm, idx) => [
                        idx + 1,
                        `"${itm.ItemID.replace(/"/g, '""')}"`,
                        `"${itm.ItemName.replace(/"/g, '""')}"`,
                        `"${(itm.Unit || 'Tab').replace(/"/g, '""')}"`,
                        itm.MedicineType === 'C' ? 'Clinical' : 'Patent',
                        itm.CStock,
                        (itm.MinStock !== undefined && itm.MinStock !== null) ? itm.MinStock : 1,
                        itm.ReorderQty || 0,
                        itm.PurchasePrice,
                        itm.Price,
                        `"${(itm.BatchNo || '').replace(/"/g, '""')}"`,
                        `"${(itm.ExpDate || '').replace(/"/g, '""')}"`,
                        Array.isArray(itm.Batches) ? itm.Batches.length : (itm.ExpDate ? 1 : 0)
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
                    className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white border border-emerald-600 rounded-lg flex items-center font-bold text-xs transition cursor-pointer shadow-xs"
                    title="Export filtered inventory grid to CSV Excel Spreadsheet"
                  >
                    <Download className="w-3.5 h-3.5 mr-1.5" />
                    <span>Export CSV</span>
                  </button>
                </div>
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
                  if (invLowStockFilter && itm.CStock > ((itm.MinStock !== undefined && itm.MinStock !== null) ? itm.MinStock : 1)) return false;
                  if (invExpiryFilterScope !== 'ALL') {
                    const expSum = getItemExpirySummary(itm);
                    if (invExpiryFilterScope === 'EXPIRED' && expSum.status !== 'EXPIRED' && expSum.status !== 'PARTIAL_EXPIRED') return false;
                    if (invExpiryFilterScope === 'NEAR_EXPIRY' && expSum.status !== 'NEAR_EXPIRY') return false;
                    if (invExpiryFilterScope === 'ACTIVE' && expSum.status !== 'ACTIVE') return false;
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
                  let valA: any = a[invSortField];
                  let valB: any = b[invSortField];
                  if (valA === undefined || valA === null) valA = '';
                  if (valB === undefined || valB === null) valB = '';
                  if (typeof valA === 'string') valA = valA.toLowerCase();
                  if (typeof valB === 'string') valB = valB.toLowerCase();

                  if (valA < valB) return invSortOrder === 'asc' ? -1 : 1;
                  if (valA > valB) return invSortOrder === 'asc' ? 1 : -1;
                  return 0;
                });

                const totalValuationCost = processedItems.reduce((acc, itm) => acc + (itm.PurchasePrice * itm.CStock), 0);
                const totalValuationRetail = processedItems.reduce((acc, itm) => acc + (itm.Price * itm.CStock), 0);

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
                  <div className="flex flex-col space-y-3">
                    
                    {/* Top Quick Pagination & Stats Bar */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1 py-0.5 text-xs text-slate-700">
                      <div className="flex items-center space-x-2 flex-wrap">
                        <span className="font-bold text-slate-800">
                          {totalItemsCount === 0 ? (
                            '0 medicines'
                          ) : (
                            <>
                              Showing <strong className="text-indigo-700 font-mono">{startIndex + 1}</strong> to{' '}
                              <strong className="text-indigo-700 font-mono">{endIndex}</strong> of{' '}
                              <strong className="text-slate-900 font-mono">{totalItemsCount}</strong> medicines
                            </>
                          )}
                        </span>
                        {invCategoryFilter === 'ALL' && (
                          <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded-full font-bold text-[10px]">
                            ⚡ High-Speed Virtual Mode (All Categories)
                          </span>
                        )}
                      </div>

                      {/* Top Page Size Selector */}
                      <div className="flex items-center space-x-2 self-end sm:self-auto">
                        <label className="text-[11px] font-bold text-slate-500">Rows per page:</label>
                        <select
                          value={invPageSize}
                          onChange={(e) => {
                            setInvPageSize(Number(e.target.value));
                            setInvCurrentPage(1);
                          }}
                          className="py-1 px-2.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-800 shadow-2xs focus:ring-1 focus:ring-indigo-500 cursor-pointer"
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

                    {/* Excel Table Grid */}
                    <div className="overflow-x-auto border-2 border-slate-300 rounded-lg max-h-[560px] overflow-y-auto shadow-inner bg-slate-50">
                      <table className="w-full text-left border-collapse text-xs font-sans select-none">
                        <thead className="sticky top-0 bg-slate-200 text-slate-800 border-b-2 border-slate-300 font-extrabold uppercase tracking-wider text-[10px] z-10 shadow-xs">
                          <tr className="divide-x divide-slate-300">
                            <th className="px-2 py-2 text-center w-12 bg-slate-300/80 text-slate-700">#</th>
                            <th 
                              onClick={() => toggleSort('ItemID')}
                              className="px-3 py-2 cursor-pointer hover:bg-slate-300 transition"
                            >
                              <div className="flex items-center space-x-1">
                                <span>Item ID</span>
                                {invSortField === 'ItemID' && (<span>{invSortOrder === 'asc' ? '▲' : '▼'}</span>)}
                              </div>
                            </th>
                            <th 
                              onClick={() => toggleSort('ItemName')}
                              className="px-3 py-2 cursor-pointer hover:bg-slate-300 transition"
                            >
                              <div className="flex items-center space-x-1">
                                <span>Medicine Name</span>
                                {invSortField === 'ItemName' && (<span>{invSortOrder === 'asc' ? '▲' : '▼'}</span>)}
                              </div>
                            </th>
                            <th className="px-2.5 py-2">Category</th>
                            <th className="px-2 py-2 text-center">Type</th>
                            <th 
                              onClick={() => toggleSort('CStock')}
                              className="px-3 py-2 text-right cursor-pointer hover:bg-slate-300 transition bg-emerald-100/60 text-emerald-950 font-black"
                            >
                              <div className="flex items-center justify-end space-x-1">
                                <span>Current Stock</span>
                                {invSortField === 'CStock' && (<span>{invSortOrder === 'asc' ? '▲' : '▼'}</span>)}
                              </div>
                            </th>
                            <th className="px-2.5 py-2 text-right">Min Threshold</th>
                            <th 
                              onClick={() => toggleSort('ReorderQty')}
                              className="px-3 py-2 text-right cursor-pointer hover:bg-slate-300 transition bg-indigo-100/60 text-indigo-950 font-black"
                            >
                              <div className="flex items-center justify-end space-x-1">
                                <span>PO Reorder Qty</span>
                                {invSortField === 'ReorderQty' && (<span>{invSortOrder === 'asc' ? '▲' : '▼'}</span>)}
                              </div>
                            </th>
                            <th className="px-3 py-2 text-right">Unit Cost (Rs)</th>
                            <th className="px-3 py-2 text-right">Retail Price (Rs)</th>
                            <th className="px-3 py-2 text-center">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 bg-white text-slate-800">
                          {paginatedItems.length === 0 ? (
                            <tr>
                              <td colSpan={11} className="px-6 py-12 text-center text-slate-400 font-bold bg-white">
                                {invLowStockFilter 
                                  ? 'All inventory medicines are currently above reorder levels! No low stock items found.'
                                  : 'No medicines match the search or category filter.'}
                              </td>
                            </tr>
                          ) : (
                            paginatedItems.map((itm, idx) => {
                              const isLowStock = itm.CStock <= ((itm.MinStock !== undefined && itm.MinStock !== null) ? itm.MinStock : 1);
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
                                  <td className="px-2 py-1.5 text-center font-mono text-[11px] font-bold text-slate-500 bg-slate-100/80">
                                    {absoluteRowNumber}
                                  </td>

                                  {/* Item ID */}
                                  <td className="px-2.5 py-1.5 font-mono text-xs font-bold text-slate-800">
                                    {itm.ItemID}
                                  </td>

                                  {/* Medicine Name & Badges */}
                                  <td className="px-3 py-1.5 font-bold text-slate-900">
                                    <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
                                      <span className="text-xs">{itm.ItemName}</span>
                                      
                                      {/* Batch Count Pill */}
                                      {Array.isArray(itm.Batches) && itm.Batches.length > 0 ? (
                                        <button
                                          type="button"
                                          onClick={() => handleOpenBatchManager(itm)}
                                          className="px-1.5 py-0.2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 hover:text-indigo-900 rounded text-[9px] font-mono border border-indigo-200 transition cursor-pointer flex items-center space-x-0.5"
                                          title={`Click to view and manage ${itm.Batches.length} batches for this medicine`}
                                        >
                                          <Boxes className="w-2.5 h-2.5 mr-0.5" />
                                          <span>{itm.Batches.length} {itm.Batches.length === 1 ? 'Batch' : 'Batches'}</span>
                                        </button>
                                      ) : itm.BatchNo ? (
                                        <button
                                          type="button"
                                          onClick={() => handleOpenBatchManager(itm)}
                                          className="px-1.5 py-0.2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[9px] font-mono border border-slate-300 transition cursor-pointer"
                                          title={`Batch #: ${itm.BatchNo} (Click to manage batches)`}
                                        >
                                          B#: {itm.BatchNo}
                                        </button>
                                      ) : null}

                                      {/* Smart Expiry Badge */}
                                      {(() => {
                                        const expSummary = getItemExpirySummary(itm);
                                        if (!expSummary.earliestExpDate && !itm.ExpDate) return null;
                                        const displayExp = expSummary.earliestExpDate || itm.ExpDate;
                                        
                                        if (expSummary.status === 'EXPIRED') {
                                          return (
                                            <button
                                              type="button"
                                              onClick={() => handleOpenBatchManager(itm)}
                                              className="px-1.5 py-0.2 bg-rose-100 hover:bg-rose-200 text-rose-900 rounded text-[9px] font-mono font-bold border border-rose-300 transition cursor-pointer flex items-center space-x-0.5"
                                              title={`EXPIRED on ${displayExp}! Click to manage or write-off expired stock.`}
                                            >
                                              <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-ping mr-0.5"></span>
                                              <span>Exp: {displayExp} (Expired)</span>
                                            </button>
                                          );
                                        }
                                        if (expSummary.status === 'PARTIAL_EXPIRED') {
                                          return (
                                            <button
                                              type="button"
                                              onClick={() => handleOpenBatchManager(itm)}
                                              className="px-1.5 py-0.2 bg-rose-50 hover:bg-rose-100 text-rose-800 rounded text-[9px] font-mono font-bold border border-rose-300 transition cursor-pointer"
                                              title={`Has expired lots (${(expSummary as any).expiredBatchesCount || 1} batch expired). Click to inspect.`}
                                            >
                                              <span>Exp: {displayExp} (Part Expired)</span>
                                            </button>
                                          );
                                        }
                                        if (expSummary.status === 'NEAR_EXPIRY') {
                                          return (
                                            <button
                                              type="button"
                                              onClick={() => handleOpenBatchManager(itm)}
                                              className="px-1.5 py-0.2 bg-amber-100 hover:bg-amber-200 text-amber-950 rounded text-[9px] font-mono font-bold border border-amber-300 transition cursor-pointer flex items-center space-x-0.5"
                                              title={`Near Expiry: ${(expSummary as any).daysUntilExpiry || 0} days left (${displayExp}). Click to inspect.`}
                                            >
                                              <span>Exp: {displayExp} ({(expSummary as any).daysUntilExpiry || 0}d left)</span>
                                            </button>
                                          );
                                        }
                                        return (
                                          <button
                                            type="button"
                                            onClick={() => handleOpenBatchManager(itm)}
                                            className="px-1.5 py-0.2 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 rounded text-[9px] font-mono border border-emerald-300 transition cursor-pointer"
                                            title={`Valid Expiry: ${displayExp}. Click to manage batches.`}
                                          >
                                            Exp: {displayExp}
                                          </button>
                                        );
                                      })()}

                                      {isLowStock && (
                                        <span className="px-1.5 py-0.2 bg-rose-600 text-white rounded text-[8px] font-black uppercase tracking-wider animate-pulse">
                                          Low Stock
                                        </span>
                                      )}
                                    </div>
                                  </td>

                                  {/* Category / Unit */}
                                  <td className="px-2.5 py-1.5 font-mono text-xs font-semibold text-slate-700">
                                    {itm.Unit || 'Tab'}
                                  </td>

                                  {/* Type */}
                                  <td className="px-2 py-1.5 text-center">
                                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase ${
                                      isClinical ? 'bg-indigo-100 text-indigo-800' : 'bg-emerald-100 text-emerald-800'
                                    }`}>
                                      {isClinical ? 'Clinical' : 'Patent'}
                                    </span>
                                  </td>

                                  {/* Current Stock (Direct Excel Cell Editing & Quick +/- Buttons) */}
                                  <td className="px-2 py-1 bg-emerald-50/30">
                                    <div className="flex items-center justify-end space-x-1">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          if (setItems) {
                                            const newStock = Math.max(0, itm.CStock - 1);
                                            const updated = { ...itm, CStock: newStock };
                                            setItems(prev => prev.map(i => i.ItemID === itm.ItemID ? updated : i));
                                            syncItemToBackend('UPDATE', updated);
                                          }
                                        }}
                                        className="w-5 h-5 bg-slate-200 hover:bg-rose-200 text-slate-700 hover:text-rose-900 rounded font-bold text-xs flex items-center justify-center transition cursor-pointer"
                                        title="Decrease Current Stock by 1"
                                      >
                                        -
                                      </button>
                                      <input
                                        type="number"
                                        min="0"
                                        value={itm.CStock}
                                        onChange={(e) => {
                                          const val = e.target.value === '' ? 0 : Math.max(0, Number(e.target.value));
                                          if (setItems) {
                                            const updated = { ...itm, CStock: val };
                                            setItems(prev => prev.map(i => i.ItemID === itm.ItemID ? updated : i));
                                            syncItemToBackend('UPDATE', updated);
                                          }
                                        }}
                                        className={`w-16 py-0.5 px-1 text-right text-xs font-mono font-black rounded border ${
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
                                            const newStock = itm.CStock + 1;
                                            const updated = { ...itm, CStock: newStock };
                                            setItems(prev => prev.map(i => i.ItemID === itm.ItemID ? updated : i));
                                            syncItemToBackend('UPDATE', updated);
                                          }
                                        }}
                                        className="w-5 h-5 bg-slate-200 hover:bg-emerald-200 text-slate-700 hover:text-emerald-900 rounded font-bold text-xs flex items-center justify-center transition cursor-pointer"
                                        title="Increase Current Stock by 1"
                                      >
                                        +
                                      </button>
                                    </div>
                                  </td>

                                  {/* Min Threshold Direct Cell Edit */}
                                  <td className="px-2 py-1 text-right bg-slate-50/50">
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
                                      className="w-14 py-0.5 px-1 text-right text-xs font-mono font-bold bg-white border border-slate-300 rounded text-slate-700 focus:ring-1 focus:ring-indigo-500"
                                      title="Direct Excel Cell Edit: Min Threshold"
                                    />
                                  </td>

                                  {/* PO Reorder Qty Direct Cell Edit */}
                                  <td className="px-2 py-1 text-right bg-indigo-50/30">
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
                                      className="w-16 py-0.5 px-1 text-right text-xs font-mono font-black bg-white border border-indigo-300 rounded text-indigo-950 focus:ring-1 focus:ring-indigo-500"
                                      title="Direct Excel Cell Edit: Purchase Order Reorder Qty"
                                    />
                                  </td>

                                  {/* Unit Cost (Rs) Direct Cell Edit */}
                                  <td className="px-2 py-1 text-right font-mono">
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
                                      className="w-18 py-0.5 px-1 text-right text-xs font-mono font-medium bg-white border border-slate-300 rounded text-slate-800 focus:ring-1 focus:ring-blue-500"
                                      title="Direct Excel Cell Edit: Unit Purchase Price"
                                    />
                                  </td>

                                  {/* Retail Price (Rs) Direct Cell Edit */}
                                  <td className="px-2 py-1 text-right font-mono">
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
                                      className="w-20 py-0.5 px-1 text-right text-xs font-mono font-extrabold bg-white border border-slate-300 rounded text-slate-900 focus:ring-1 focus:ring-emerald-500"
                                      title="Direct Excel Cell Edit: Retail Selling Price"
                                    />
                                  </td>

                                  {/* Actions */}
                                  <td className="px-2 py-1 text-center">
                                    <div className="flex justify-center items-center space-x-1">
                                      <button
                                        type="button"
                                        onClick={() => handleOpenBatchManager(itm)}
                                        className="p-1 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-100 rounded transition cursor-pointer"
                                        title="Manage Batches, Lots & Expiry Dates"
                                      >
                                        <Boxes className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleSelectEditItem(itm)}
                                        className="p-1 text-slate-500 hover:text-indigo-600 hover:bg-indigo-100 rounded transition cursor-pointer"
                                        title="Full Parameter Edit Dialog"
                                      >
                                        <Edit className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveItem(itm.ItemID, itm.ItemName)}
                                        disabled={!canAdd}
                                        className={`p-1 rounded transition cursor-pointer ${
                                          canAdd ? 'text-slate-500 hover:text-rose-600 hover:bg-rose-100' : 'text-slate-300 cursor-not-allowed'
                                        }`}
                                        title="Delete Medicine Row"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
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
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-100 p-2.5 rounded-xl border border-slate-200 text-xs">
                        <div className="flex items-center space-x-1 text-slate-600 font-medium">
                          <span>Page <strong className="text-slate-900">{currentPageSafe}</strong> of <strong className="text-slate-900">{totalPages}</strong></span>
                          <span className="text-slate-400">({totalItemsCount} total medicines)</span>
                        </div>

                        {/* Page Navigation Buttons */}
                        <div className="flex items-center space-x-1">
                          <button
                            type="button"
                            onClick={() => setInvCurrentPage(1)}
                            disabled={currentPageSafe <= 1}
                            className="p-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 transition cursor-pointer"
                            title="First Page"
                          >
                            <ChevronsLeft className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => setInvCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPageSafe <= 1}
                            className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 font-bold flex items-center space-x-1 transition cursor-pointer"
                          >
                            <ChevronLeft className="w-3.5 h-3.5" />
                            <span>Prev</span>
                          </button>

                          {/* Dynamic Page Pills */}
                          <div className="flex items-center space-x-1">
                            {getVisiblePages().map((p, pIdx) => {
                              if (p === '...') {
                                return (
                                  <span key={`dots-${pIdx}`} className="px-2 py-1 text-slate-400 font-bold">
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
                                  className={`w-8 h-8 rounded-lg font-bold text-xs transition cursor-pointer font-mono ${
                                    isActive
                                      ? 'bg-indigo-600 text-white shadow-xs'
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
                            className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 font-bold flex items-center space-x-1 transition cursor-pointer"
                          >
                            <span>Next</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => setInvCurrentPage(totalPages)}
                            disabled={currentPageSafe >= totalPages}
                            className="p-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 transition cursor-pointer"
                            title="Last Page"
                          >
                            <ChevronsRight className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Direct Jump to Page */}
                        <div className="flex items-center space-x-1.5">
                          <label className="text-[11px] font-bold text-slate-500">Go to:</label>
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
                            className="w-14 py-1 px-1.5 text-center text-xs font-mono font-bold bg-white border border-slate-300 rounded-lg text-slate-800 focus:ring-1 focus:ring-indigo-500"
                          />
                        </div>
                      </div>
                    )}

                    {/* Excel Sheet Status Bar */}
                    <div className="bg-slate-800 text-slate-200 px-4 py-2 rounded-xl text-xs font-mono flex flex-wrap items-center justify-between gap-3 border border-slate-700 shadow-inner">
                      <div className="flex items-center space-x-4">
                        <span>
                          Total Filtered Rows: <strong className="text-white">{processedItems.length}</strong> / {items.length}
                        </span>
                        <span className="text-slate-500">|</span>
                        <span>
                          Low Stock: <strong className="text-rose-400">{processedItems.filter(i => i.CStock <= ((i.MinStock !== undefined && i.MinStock !== null) ? i.MinStock : 1)).length}</strong>
                        </span>
                      </div>

                      <div className="flex items-center space-x-4">
                        <span>
                          Cost Value: <strong className="text-amber-300">Rs. {totalValuationCost.toLocaleString('en-PK', { minimumFractionDigits: 2 })}</strong>
                        </span>
                        <span className="text-slate-500">|</span>
                        <span>
                          Retail Value: <strong className="text-emerald-300">Rs. {totalValuationRetail.toLocaleString('en-PK', { minimumFractionDigits: 2 })}</strong>
                        </span>
                        <span className="text-slate-500">|</span>
                        <button
                          type="button"
                          onClick={() => handlePrintStockGrid()}
                          className="px-2.5 py-1 bg-slate-700 hover:bg-slate-600 text-indigo-300 hover:text-white rounded-lg border border-slate-600 font-sans font-bold text-xs flex items-center space-x-1.5 transition cursor-pointer shadow-2xs"
                          title="Print this sheet on A4 paper"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Print Sheet</span>
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

      {/* Clinic Medicine Label Printer Tab */}
      {activeSubTab === 'clinical_labels' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn" id="pos-clinical-labels-tab">
          
          {/* Left Column: Patients & Visits List */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center border-b border-slate-100 pb-2">
              <Search className="w-4 h-4 text-indigo-600 mr-2" />
              Patient & Visit Selection
            </h3>
            
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder=""
                value={labelSearchQuery}
                onChange={(e) => setLabelSearchQuery(e.target.value)}
                className="w-full text-xs font-semibold border border-slate-300 rounded-lg pl-9 pr-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
              />
            </div>

            {/* Patients List with Clinical Prescriptions */}
            <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-1">
              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Patients with Clinical compounding prescriptions
              </span>
              {(() => {
                const clinicalPatients = allKnownPatients.filter(p => {
                  const pVisits = visits.filter(v => v.PatientID === p.PatientID);
                  const searchLower = labelSearchQuery.toLowerCase();
                  const matchesSearch = String(p.PatientName || '').toLowerCase().includes(searchLower) || String(p.PatientID || '').toLowerCase().includes(searchLower);
                  
                  if (labelSearchQuery.trim()) {
                    return matchesSearch;
                  }
                  
                  return pVisits.length > 0;
                });

                if (clinicalPatients.length === 0) {
                  return (
                    <div className="p-4 text-center text-xs text-slate-400 bg-slate-50 border border-dashed rounded-lg italic">
                      No matching patients found.
                    </div>
                  );
                }

                return clinicalPatients.map((p, idx) => {
                  const hasMeds = visits.filter(v => v.PatientID === p.PatientID).some(v => 
                    getVisitMedicinesList(v).length > 0
                  );

                  return (
                    <button
                      key={`lbl-pt-${p.PatientID}-${idx}`}
                      onClick={() => {
                        setLabelPatientId(p.PatientID);
                        // Auto-select latest visit if available
                        const pVisits = visits
                          .filter(v => v.PatientID === p.PatientID)
                          .sort((a, b) => b.VisitDate.localeCompare(a.VisitDate));
                        if (pVisits.length > 0) {
                          setLabelVisitId(pVisits[0].VisitID);
                        } else {
                          setLabelVisitId('');
                        }
                      }}
                      className={`w-full text-left p-3 rounded-xl border text-xs font-semibold transition cursor-pointer flex justify-between items-center ${
                        labelPatientId === p.PatientID
                          ? 'bg-indigo-50/80 border-indigo-300 text-indigo-900 shadow-xs'
                          : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="min-w-0 pr-2">
                        <p className="font-extrabold uppercase truncate">{p.PatientName}</p>
                        <p className="text-[10px] text-slate-400 font-mono truncate">ID: {p.PatientID} • {p.AgeYears || 0}Y • {p.Sex || 'N/A'}</p>
                      </div>
                      {hasMeds && (
                        <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-800 shrink-0 font-mono">
                          Rx Meds
                        </span>
                      )}
                    </button>
                  );
                });
              })()}
            </div>

            {/* Visits List */}
            {labelPatientId && (
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Select Consultation Visit Date:
                </span>
                {(() => {
                  const pVisits = visits
                    .filter((v) => v.PatientID === labelPatientId)
                    .sort((a, b) => b.VisitDate.localeCompare(a.VisitDate));

                  if (pVisits.length === 0) {
                    return (
                      <p className="text-xs text-slate-400 italic">No visit history found.</p>
                    );
                  }

                  return (
                    <div className="space-y-1 max-h-[220px] overflow-y-auto pr-1">
                      {pVisits.map((v) => {
                        const hasMeds = getVisitMedicinesList(v).length > 0;
                        return (
                          <button
                            key={v.VisitID}
                            onClick={() => setLabelVisitId(v.VisitID)}
                            className={`w-full text-left p-2.5 rounded-lg border text-xs transition cursor-pointer flex justify-between items-center ${
                              labelVisitId === v.VisitID
                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/10 font-bold'
                                : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
                            }`}
                          >
                            <div className="min-w-0 pr-2">
                              <p className="font-bold">{v.VisitDate}</p>
                              <p className="text-[9px] opacity-70 font-mono leading-none mt-0.5 truncate">Visit ID: {v.VisitID}</p>
                            </div>
                            {hasMeds && (
                              <span className={`text-[8px] font-black uppercase tracking-wider px-1 py-0.5 rounded shrink-0 font-mono ${
                                labelVisitId === v.VisitID
                                  ? 'bg-indigo-800 text-indigo-100'
                                  : 'bg-indigo-50 border border-indigo-100 text-indigo-700'
                              }`}>
                                🧪 Prescribed
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            )}

          </div>

          {/* Right Column: Prescribed Clinical Medicines Label Configuration & Live Sticker Preview */}
          <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
            
            {/* Header with Print-All option */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-3 gap-2">
              <h3 className="text-sm font-bold text-slate-900 flex items-center">
                <Tag className="w-4 h-4 text-indigo-600 mr-2" />
                Prescribed Medicines for Patient Label Printer
              </h3>
              {(() => {
                const pat = allKnownPatients.find(p => p.PatientID === labelPatientId);
                const vis = visits.find(v => v.VisitID === labelVisitId);
                const cMeds = getVisitMedicinesList(vis || null);
                
                if (pat && vis && cMeds.length > 0) {
                  return (
                    <button
                      onClick={() => {
                        const labelsToPrint = cMeds.map(m => {
                          const matchedItem = items.find(i => i.ItemID === m.ItemID);
                          const name = matchedItem ? matchedItem.ItemName : m.MedicineDetail;
                          const instructions = customLabelStates[m.ItemID]?.instructions ?? m.Dosage;
                          const notes = customLabelStates[m.ItemID]?.notes ?? "Take as directed by the physician.";
                          const qty = customLabelStates[m.ItemID]?.qty ?? String(m.Qty || 30);
                          const expiry = customLabelStates[m.ItemID]?.expiry ?? (m.ExpireDate || "No Expiry Specified");
                          
                          return { name, instructions, notes, qty, expiry };
                        });

                        setLabelPrintData({
                          patientName: pat.PatientName,
                          patientAge: String(pat.AgeYears),
                          patientSex: pat.Sex,
                          visitDate: vis.VisitDate,
                          visitId: vis.VisitID,
                          medicines: labelsToPrint
                        });
                        setIsLabelPrintModalOpen(true);
                      }}
                      className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-lg flex items-center shadow-md shadow-indigo-600/10 self-start cursor-pointer transition"
                    >
                      <Printer className="w-3.5 h-3.5 mr-1.5" />
                      Print All ({cMeds.length}) Labels for This Visit
                    </button>
                  );
                }
                return null;
              })()}
            </div>

            {/* Medicines List */}
            {(() => {
              if (!labelPatientId || !labelVisitId) {
                return (
                  <div className="p-12 text-center text-slate-400 italic text-xs">
                    Please select a Patient and a Visit Date from the left panel to load prescribed medicines.
                  </div>
                );
              }

              const pat = allKnownPatients.find(p => p.PatientID === labelPatientId);
              const vis = visits.find(v => v.VisitID === labelVisitId);
              const clinicalMeds = getVisitMedicinesList(vis || null);

              if (clinicalMeds.length === 0) {
                return (
                  <div className="p-12 text-center text-slate-400 italic text-xs bg-slate-50 border border-dashed rounded-xl">
                    No prescribed medicines found in this visit.
                  </div>
                );
              }

              return (
                <div className="space-y-6">
                  
                  {/* Selected Patient Mini Header */}
                  <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl flex flex-wrap justify-between gap-3 text-xs">
                    <div className="space-y-0.5">
                      <span className="block text-[8px] font-black text-slate-400 uppercase tracking-wider">Patient Name</span>
                      <span className="font-extrabold text-slate-900 uppercase">{pat?.PatientName}</span>
                      <span className="text-slate-500 block text-[10px]">ID: {pat?.PatientID} • {pat?.AgeYears} Years • {pat?.Sex}</span>
                    </div>
                    <div className="space-y-0.5 text-right">
                      <span className="block text-[8px] font-black text-slate-400 uppercase tracking-wider">Prescribed Date</span>
                      <span className="font-mono text-slate-800 font-bold">{vis?.VisitDate}</span>
                      <span className="text-[10px] text-indigo-600 font-bold block">Visit ID: {vis?.VisitID}</span>
                    </div>
                  </div>

                  {/* Individual Med Label Customizer & Preview Grid */}
                  <div className="space-y-6">
                    {clinicalMeds.map((m, idx) => {
                      const matchedItem = items.find((i) => i.ItemID === m.ItemID);
                      const medicineName = matchedItem ? matchedItem.ItemName : m.MedicineDetail;
                      
                      // Fallback-safe customized label state
                      const instructionsValue = customLabelStates[m.ItemID]?.instructions ?? m.Dosage;
                      const notesValue = customLabelStates[m.ItemID]?.notes ?? "Take as directed by the physician.";
                      const qtyValue = customLabelStates[m.ItemID]?.qty ?? String(m.Qty || 30);
                      const expiryValue = customLabelStates[m.ItemID]?.expiry ?? (m.ExpireDate || "No Expiry Specified");

                      const updateLabelState = (key: 'instructions' | 'notes' | 'qty' | 'expiry', val: string) => {
                        setCustomLabelStates(prev => {
                          const existing = prev[m.ItemID] || {
                            instructions: m.Dosage,
                            notes: "Take as directed by the physician.",
                            qty: String(m.Qty || 30),
                            expiry: m.ExpireDate || ""
                          };
                          return {
                            ...prev,
                            [m.ItemID]: {
                              ...existing,
                              [key]: val
                            }
                          };
                        });
                      };

                      return (
                        <div key={`${m.ItemID}-${idx}`} className="p-4 bg-slate-50/60 border border-slate-200 rounded-2xl flex flex-col xl:flex-row gap-5">
                          
                          {/* Label Settings/Configuration Panel */}
                          <div className="flex-1 space-y-3.5">
                            <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
                              <span className="font-extrabold text-slate-900 uppercase text-xs truncate max-w-[200px]">
                                {medicineName}
                              </span>
                              <span className="text-[8px] font-black bg-indigo-50 border border-indigo-150 px-1.5 py-0.5 rounded text-indigo-700 uppercase tracking-wider">
                                Clinical Compounded
                              </span>
                            </div>

                            {/* Inputs */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                              <div className="space-y-1 sm:col-span-2">
                                <label className="block text-[9px] font-black text-slate-500 uppercase tracking-wider">
                                  Usage Instructions (Dosage)
                                </label>
                                <textarea
                                  rows={2}
                                  value={instructionsValue}
                                  onChange={(e) => updateLabelState('instructions', e.target.value)}
                                  placeholder=""
                                  className="w-full text-xs font-semibold border border-slate-200 rounded-lg p-2 focus:outline-none focus:border-indigo-500 bg-white"
                                />
                              </div>

                              <div className="space-y-1">
                                <label className="block text-[9px] font-black text-slate-500 uppercase tracking-wider">
                                  Prescribed Quantity
                                </label>
                                <input
                                  type="text"
                                  value={qtyValue}
                                  onChange={(e) => updateLabelState('qty', e.target.value)}
                                  placeholder=""
                                  className="w-full text-xs font-semibold border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-indigo-500 bg-white"
                                />
                              </div>

                              <div className="space-y-1">
                                <label className="block text-[9px] font-black text-slate-500 uppercase tracking-wider">
                                  Sticker Expiry Date
                                </label>
                                <input
                                  type="text"
                                  value={expiryValue}
                                  onChange={(e) => updateLabelState('expiry', e.target.value)}
                                  placeholder=""
                                  className="w-full text-xs font-semibold border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-indigo-500 bg-white font-mono"
                                />
                              </div>

                              <div className="space-y-1 sm:col-span-2">
                                <label className="block text-[9px] font-black text-slate-500 uppercase tracking-wider">
                                  Special Warnings / Notes
                                </label>
                                <input
                                  type="text"
                                  value={notesValue}
                                  onChange={(e) => updateLabelState('notes', e.target.value)}
                                  placeholder=""
                                  className="w-full text-xs font-semibold border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-indigo-500 bg-white"
                                />
                              </div>
                            </div>
                          </div>

                          {/* Live Sticker Preview Panel - 3-Line Simple Label Format */}
                          <div className="w-full xl:w-[280px] shrink-0 flex flex-col justify-between bg-white border border-slate-300 rounded-xl p-4 text-slate-900 min-h-[180px]">
                            <div className="space-y-2 text-xs font-sans">
                              <div className="border-b border-slate-100 pb-1.5 mb-2">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">3-Line Label Preview</span>
                              </div>
                              <div className="font-bold text-slate-900 text-xs">
                                <span>Patient Name: </span>
                                <span className="font-extrabold text-slate-900">{pat?.PatientName}</span>
                              </div>
                              <div className="font-bold text-slate-900 text-xs">
                                <span>Medicine Usage: </span>
                                <span className="font-extrabold text-indigo-700">{instructionsValue || "Take as directed"}</span>
                              </div>
                              <div className="font-bold text-slate-900 text-xs">
                                <span>Expire Date: </span>
                                <span className="font-extrabold text-slate-800 font-mono">{expiryValue || "N/A"}</span>
                              </div>
                            </div>

                            {/* Print Trigger Button */}
                            <div className="mt-4 pt-2 border-t border-slate-100">
                              <button
                                onClick={() => {
                                  setLabelPrintData({
                                    patientName: pat?.PatientName || "Unknown",
                                    patientAge: String(pat?.AgeYears || ""),
                                    patientSex: pat?.Sex || "Male",
                                    visitDate: vis?.VisitDate || "",
                                    visitId: vis?.VisitID || "",
                                    medicines: [{
                                      name: medicineName,
                                      instructions: instructionsValue,
                                      notes: notesValue,
                                      qty: qtyValue,
                                      expiry: expiryValue
                                    }]
                                  });
                                  setIsLabelPrintModalOpen(true);
                                }}
                                className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg flex items-center justify-center transition shadow-xs cursor-pointer"
                              >
                                <Printer className="w-3.5 h-3.5 mr-1.5" />
                                Print Label (3 Lines)
                              </button>
                            </div>

                          </div>

                        </div>
                      );
                    })}
                  </div>

                </div>
              );
            })()}

          </div>

        </div>
      )}

      {/* Clinical Medicine Sticker Label Print-Preview Modal Overlay */}
      {isLabelPrintModalOpen && labelPrintData && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[9999] overflow-y-auto print:absolute print:inset-0 print:bg-white print:p-0">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[90vh] flex flex-col print:shadow-none print:border-0 print:max-h-full print:w-full print:rounded-none">
            
            {/* Dynamic Sticker Print Style Injector */}
            <style dangerouslySetInnerHTML={{ __html: `
              @media print {
                @page {
                  size: A4;
                  margin: 10mm;
                }
                body * {
                  visibility: hidden !important;
                }
                #sticker-print-container, #sticker-print-container * {
                  visibility: visible !important;
                }
                #sticker-print-container {
                  position: absolute !important;
                  left: 10mm !important;
                  top: 10mm !important;
                  width: 100% !important;
                  padding: 0 !important;
                  box-shadow: none !important;
                  border: none !important;
                }
                .label-grid-page {
                  display: grid !important;
                  grid-template-columns: 2in 2in !important;
                  column-gap: 2in !important;
                  row-gap: 0.25in !important;
                  page-break-inside: avoid !important;
                  page-break-after: always !important;
                  margin-bottom: 10mm !important;
                }
                .label-grid-page:last-child {
                  page-break-after: avoid !important;
                }
                .label-sticker-page {
                  width: 2in !important;
                  min-height: 0.2in !important;
                  max-width: 2in !important;
                  box-sizing: border-box !important;
                  margin: 0 !important;
                  box-shadow: none !important;
                  border: 1px dashed #475569 !important;
                  border-radius: 3px !important;
                  padding: 2px 4px !important;
                  color: #000000 !important;
                }
              }
            ` }} />

            {/* Modal Controls (Hidden in Print) */}
            <div className="p-4 border-b border-slate-150 flex flex-wrap items-center justify-between gap-2 bg-slate-50 rounded-t-2xl print:hidden shrink-0">
              <div className="flex items-center space-x-2">
                <Tag className="w-5 h-5 text-indigo-600 shrink-0" />
                <div>
                  <span className="text-sm font-bold text-slate-900 block">Medicine Label Printer (2" x 0.2" - 2x2 Grid Layout on A4)</span>
                  <span className="text-xxs text-slate-500 font-semibold">2 Columns x 2 Rows Layout (2" Space Between Columns, Max 4 Labels Per Page)</span>
                </div>
              </div>
              <div className="flex flex-wrap items-center space-x-2">
                <button
                  type="button"
                  onClick={() => handleCleanLabelPrint('2x0.2')}
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg flex items-center shadow-md transition cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 mr-1" />
                  Print 2x2 Grid Labels (A4)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsLabelPrintModalOpen(false);
                    setLabelPrintData(null);
                  }}
                  className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-[10px] rounded-lg transition"
                >
                  Close
                </button>
              </div>
            </div>

            {/* Print Area */}
            <div className="flex-1 overflow-y-auto p-6 bg-slate-100 print:bg-white flex flex-col items-center" id="sticker-print-container">
              {Array.from({ length: Math.ceil(labelPrintData.medicines.length / 4) }).map((_, pageIdx) => {
                const pageMeds = labelPrintData.medicines.slice(pageIdx * 4, pageIdx * 4 + 4);
                return (
                  <div key={pageIdx} className="label-grid-page grid grid-cols-2 gap-x-[2in] gap-y-4 p-4 bg-white border border-dashed border-slate-300 rounded-xl mb-6 print:mb-0 print:border-none print:p-0 print:page-break-after-always">
                    {pageMeds.map((med, idx) => (
                      <div key={idx} className="label-sticker-page bg-white border border-slate-300 rounded shadow-xs w-[2in] max-w-[2in] min-h-[0.2in] p-1 font-sans text-slate-900 flex flex-col justify-start text-[9px] leading-tight box-border space-y-0">
                        <div className="font-bold text-[9px] m-0 p-0 truncate">
                          <span className="text-slate-500">Patient: </span>
                          <strong className="text-slate-900 font-black">{labelPrintData.patientName}</strong>
                        </div>
                        <div className="font-bold text-[9px] m-0 p-0 truncate">
                          <span className="text-slate-500">Usage: </span>
                          <strong className="text-slate-900 font-black">{med.instructions || "As directed"}</strong>
                        </div>
                        <div className="font-bold text-[9px] m-0 p-0 truncate flex justify-between items-center">
                          <span>Exp: <strong className="font-black text-slate-900">{med.expiry || "N/A"}</strong></span>
                          <span className="text-[7px] text-slate-400 font-mono">2"x0.2"</span>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>

          </div>
        </div>
      )}

      {/* Pharmacy Invoice Print-Preview Modal Overlay (Supports A4 & Thermal POS Receipt) */}
      {printModalOpen && printBillData && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-[9999] overflow-y-auto animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden">
            
            {/* Modal Controls Header */}
            <div className="p-4 border-b border-slate-150 flex flex-col sm:flex-row sm:items-center justify-between bg-slate-50 gap-3 shrink-0">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg shrink-0">
                  <Printer className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-bold text-slate-900 block">Print Invoice / Receipt</span>
                    <span className="px-1.5 py-0.5 bg-blue-100 text-blue-800 font-mono font-bold text-[10px] rounded">
                      {printBillData.invoiceNo}
                    </span>
                  </div>
                  <span className="text-xxs text-slate-500 font-medium">Select output format: Standard A4 printer vs 80mm Thermal Receipt</span>
                </div>
              </div>

              {/* Format Toggle & Action Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex rounded-lg border border-slate-200 p-0.5 bg-white text-[11px] font-bold">
                  <button
                    type="button"
                    onClick={() => setPrintModalFormat('a4')}
                    className={`px-2.5 py-1 rounded-md transition flex items-center space-x-1 cursor-pointer ${printModalFormat === 'a4' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                  >
                    <FileText className="w-3 h-3" />
                    <span>A4 Size</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPrintModalFormat('thermal')}
                    className={`px-2.5 py-1 rounded-md transition flex items-center space-x-1 cursor-pointer ${printModalFormat === 'thermal' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                  >
                    <Receipt className="w-3 h-3" />
                    <span>80mm Thermal</span>
                  </button>
                </div>

                {printModalFormat === 'a4' ? (
                  <button
                    type="button"
                    onClick={() => handlePrintA4Invoice(printBillData)}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg shadow-sm flex items-center space-x-1.5 transition cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>🖨️ Print A4 Invoice</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handlePrintThermalReceipt(printBillData)}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-sm flex items-center space-x-1.5 transition cursor-pointer"
                  >
                    <Receipt className="w-3.5 h-3.5" />
                    <span>🧾 Print Customer Receipt (Thermal)</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setPrintModalOpen(false);
                    setPrintBillData(null);
                  }}
                  className="px-2.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-lg transition cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>

            {/* Live Interactive Preview Container */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-100 flex justify-center">
              {printModalFormat === 'a4' ? (
                /* A4 Sheet Preview */
                <div className="bg-white border-2 border-slate-900 rounded-lg shadow-md w-full max-w-xl p-5 text-slate-800 text-xs font-sans space-y-4">
                  {/* A4 Header */}
                  <div className="flex items-center justify-between border-b-2 border-slate-900 pb-3">
                    <div>
                      <h2 className="text-base font-black text-indigo-950 uppercase tracking-tight">
                        {clinicSettings?.ClinicName || "PUNJAB HOMEOPATHIC CLINIC & PHARMACY"}
                      </h2>
                      <p className="text-[10px] text-slate-500 font-medium">
                        {clinicSettings?.Address || "Opposite State Bank, Mall Road, Lahore"} • Ph: {clinicSettings?.PhoneNo || "042-3111222"}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="inline-block bg-slate-900 text-white text-[10px] font-black px-2.5 py-1 rounded uppercase tracking-wider">
                        A4 OFFICIAL INVOICE
                      </span>
                    </div>
                  </div>

                  {/* Metadata Boxes */}
                  <div className="grid grid-cols-2 gap-3 text-xxs">
                    <div className="bg-slate-50 p-2.5 rounded border border-slate-200 space-y-1">
                      <div className="flex justify-between">
                        <span className="text-slate-500 font-semibold">Invoice No:</span>
                        <strong className="text-slate-950 font-mono">{printBillData.invoiceNo}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500 font-semibold">Date:</span>
                        <strong className="text-slate-900">{printBillData.invoiceDate}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500 font-semibold">Operational Shift:</span>
                        <strong className="text-slate-900">{printBillData.shift === 1 ? 'Morning Shift (1)' : 'Evening Shift (2)'}</strong>
                      </div>
                    </div>

                    <div className="bg-slate-50 p-2.5 rounded border border-slate-200 space-y-1">
                      <div className="flex justify-between">
                        <span className="text-slate-500 font-semibold">Patient/Customer:</span>
                        <strong className="text-slate-950 truncate max-w-[130px]">{printBillData.patient ? printBillData.patient.PatientName : "Walk-in Guest"}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500 font-semibold">Patient ID:</span>
                        <strong className="text-slate-900 font-mono">{printBillData.patient ? printBillData.patient.PatientID : "WALK-IN"}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500 font-semibold">Status:</span>
                        <strong className="text-emerald-700">PAID IN CASH</strong>
                      </div>
                    </div>
                  </div>

                  {/* Table */}
                  <div className="border border-slate-200 rounded overflow-hidden">
                    <table className="w-full text-left text-xxs">
                      <thead className="bg-slate-900 text-white font-bold uppercase">
                        <tr>
                          <th className="p-2 w-8 text-center">#</th>
                          <th className="p-2">Item Description</th>
                          <th className="p-2 w-12 text-center">Qty</th>
                          <th className="p-2 w-20 text-right">Rate</th>
                          <th className="p-2 w-24 text-right">Net Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {printBillData.basket.map((b, idx) => {
                          const item = items.find(i => i.ItemID === b.ItemID);
                          const lineTotal = b.Qty * b.Price;
                          return (
                            <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}>
                              <td className="p-2 text-center font-bold text-slate-400">{idx + 1}</td>
                              <td className="p-2">
                                <strong className="text-slate-900 block text-xs">{item ? item.ItemName : b.ItemID}</strong>
                                <span className="text-[10px] text-indigo-600 font-semibold">{item?.Category || (b.MedicineType === 'C' ? 'Clinical' : (item?.Unit || 'Patent'))}</span>
                              </td>
                              <td className="p-2 text-center font-bold font-mono">{b.Qty}</td>
                              <td className="p-2 text-right font-mono">Rs. {b.Price.toFixed(0)}</td>
                              <td className="p-2 text-right font-bold font-mono text-slate-950">Rs. {lineTotal.toLocaleString()}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Bottom Financial Summary & Notes */}
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="text-xxs text-slate-500 space-y-1">
                      <strong className="text-slate-800 uppercase block font-bold">Policy & Instructions:</strong>
                      <p>• Returns accepted within 3 days with this invoice.</p>
                      <p>• Clinical & opened medicines non-returnable.</p>
                      <p className="italic text-indigo-900 font-semibold mt-1">In Words: {convertNumberToWords(printBillData.netAmount)}</p>
                    </div>

                    <div className="bg-slate-50 p-2.5 rounded border border-slate-900 space-y-1 text-xxs">
                      <div className="flex justify-between">
                        <span className="text-slate-500 font-semibold">Subtotal:</span>
                        <strong className="font-mono">Rs. {printBillData.basket.reduce((sum, item) => sum + item.Qty * item.Price, 0).toLocaleString()}</strong>
                      </div>
                      {printBillData.discount > 0 && (
                        <div className="flex justify-between text-red-600">
                          <span className="font-semibold">Discount:</span>
                          <strong className="font-mono">- Rs. {printBillData.discount.toLocaleString()}</strong>
                        </div>
                      )}
                      <div className="flex justify-between border-t-2 border-slate-900 pt-1.5 text-xs font-black text-emerald-800">
                        <span>NET PAYABLE:</span>
                        <span className="font-mono text-sm">Rs. {printBillData.netAmount.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Signature block */}
                  <div className="flex justify-between pt-6 border-t border-slate-200 text-xxs font-bold text-slate-600">
                    <div className="text-center w-32 border-t border-slate-800 pt-1">
                      Duty Pharmacist
                    </div>
                    <div className="text-center font-mono text-xs font-black tracking-widest text-slate-400">
                      * {printBillData.invoiceNo} *
                    </div>
                    <div className="text-center w-32 border-t border-slate-800 pt-1">
                      Customer Signature
                    </div>
                  </div>
                </div>
              ) : (
                /* Thermal 80mm Receipt Preview */
                <div className="bg-white border border-slate-300 rounded shadow-md max-w-xs w-full p-4 font-mono text-xs text-black space-y-3">
                  <div className="text-center space-y-1">
                    <h3 className="font-bold text-xs uppercase">{clinicSettings?.ClinicName || "PUNJAB CLINIC & PHARMACY"}</h3>
                    <p className="text-[10px]">{clinicSettings?.Address || "Mall Road, Lahore"}</p>
                    <p className="text-[10px]">Ph: {clinicSettings?.PhoneNo || "042-3111222"}</p>
                    <div className="border-t border-b border-black py-0.5 my-1 font-bold text-[11px]">
                      *** CUSTOMER RECEIPT ***
                    </div>
                  </div>

                  <div className="space-y-0.5 text-xxs">
                    <div className="flex justify-between">
                      <span>Inv #:</span>
                      <strong className="font-bold">{printBillData.invoiceNo}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Date:</span>
                      <span>{printBillData.invoiceDate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Customer:</span>
                      <strong className="truncate max-w-[130px]">{printBillData.patient ? printBillData.patient.PatientName : "Walk-in Customer"}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Shift:</span>
                      <span>{printBillData.shift === 1 ? 'Morning (1)' : 'Evening (2)'}</span>
                    </div>
                  </div>

                  <div className="border-t border-dashed border-black pt-1 space-y-1 text-xxs">
                    <div className="flex justify-between font-bold border-b border-dashed border-black pb-1">
                      <span>ITEM</span>
                      <span className="w-10 text-center">QTY</span>
                      <span className="w-16 text-right">TOTAL</span>
                    </div>
                    {printBillData.basket.map((b, idx) => {
                      const itm = items.find(i => i.ItemID === b.ItemID);
                      const lineTotal = b.Qty * b.Price;
                      return (
                        <div key={idx} className="space-y-0.5">
                          <div className="font-bold truncate">{itm ? itm.ItemName : b.ItemID}</div>
                          <div className="flex justify-between text-slate-600">
                            <span>@ Rs. {b.Price.toFixed(0)}</span>
                            <span className="w-10 text-center font-bold text-black">{b.Qty}</span>
                            <span className="w-16 text-right font-bold text-black">Rs. {lineTotal.toLocaleString()}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="border-t border-dashed border-black pt-1 space-y-0.5 text-xxs">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>Rs. {printBillData.basket.reduce((sum, item) => sum + item.Qty * item.Price, 0).toLocaleString()}</span>
                    </div>
                    {printBillData.discount > 0 && (
                      <div className="flex justify-between text-red-600">
                        <span>Discount:</span>
                        <span>- Rs. {printBillData.discount.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-sm border-t border-b border-black py-1 my-1">
                      <span>TOTAL:</span>
                      <span>Rs. {printBillData.netAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-[10px]">
                      <span>Paid:</span>
                      <strong>CASH (POSTED)</strong>
                    </div>
                  </div>

                  <div className="text-center pt-2 space-y-1 text-xxs">
                    <div className="tracking-widest font-bold">||| {printBillData.invoiceNo} |||</div>
                    <div className="border-t border-dashed border-black pt-1 text-[9px] text-slate-700">
                      Returns accepted within 3 days with receipt.<br/>
                      <strong>* THANK YOU & GET WELL SOON *</strong>
                    </div>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* Dynamic Vendor Directory & Grid-View Modal */}
      {isVendorModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 animate-fadeIn font-sans" id="vendor-directory-modal">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-150 flex items-center justify-between bg-slate-50 shrink-0">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-950">Supplier & Vendor Registry</h3>
                  <p className="text-[11px] text-slate-500 font-medium">Manage and register active pharmaceutical supply partners</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsVendorModalOpen(false);
                  resetSupplierForm();
                }}
                className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-100 rounded-full transition cursor-pointer font-bold"
              >
                ✕
              </button>
            </div>

            {/* Modal Content - Split layout */}
            <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-12 gap-6">
              
              {/* Left Column: Form to Add/Edit (5 cols) */}
              <div className="md:col-span-5 bg-slate-50 p-5 rounded-2xl border border-slate-200 h-fit space-y-4">
                <div className="flex items-center justify-between border-b border-slate-150 pb-2">
                  <h4 className="text-xs font-bold text-slate-900 uppercase">
                    {editingSupplier ? '✏️ Modify Vendor Specifications' : '➕ Register New Vendor'}
                  </h4>
                  {editingSupplier && (
                    <button
                      type="button"
                      onClick={resetSupplierForm}
                      className="text-[10px] font-bold text-blue-600 hover:text-blue-800 transition uppercase"
                    >
                      New Vendor
                    </button>
                  )}
                </div>

                {vendorSuccessMsg && (
                  <div className="p-2.5 bg-emerald-50 border border-emerald-100 text-emerald-700 text-xxs font-bold rounded-lg">
                    ✅ {vendorSuccessMsg}
                  </div>
                )}

                {vendorErrorMsg && (
                  <div className="p-2.5 bg-rose-50 border border-rose-100 text-rose-700 text-xxs font-bold rounded-lg">
                    ⚠️ {vendorErrorMsg}
                  </div>
                )}

                <form onSubmit={handleSaveSupplier} className="space-y-3 text-xs">
                  <div>
                    <label className="block text-xxs font-bold text-slate-500 uppercase">Vendor/Supplier ID</label>
                    <input
                      type="text"
                      placeholder=""
                      disabled={!!editingSupplier}
                      value={supplierFormId}
                      onChange={(e) => setSupplierFormId(e.target.value)}
                      className={`mt-1 w-full text-xs border rounded-lg p-2 focus:ring-1 focus:ring-emerald-500 focus:outline-none font-mono ${
                        editingSupplier ? 'bg-slate-100 border-slate-200 text-slate-500 cursor-not-allowed font-bold' : 'bg-white border-slate-200'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-xxs font-bold text-slate-500 uppercase">Vendor Name *</label>
                    <input
                      type="text"
                      required
                      placeholder=""
                      value={supplierFormName}
                      onChange={(e) => setSupplierFormName(e.target.value)}
                      className="mt-1 w-full text-xs border border-slate-200 bg-white rounded-lg p-2 focus:ring-1 focus:ring-emerald-500 focus:outline-none font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-xxs font-bold text-slate-500 uppercase">Contact Phone</label>
                    <input
                      type="text"
                      placeholder=""
                      value={supplierFormPhone}
                      onChange={(e) => setSupplierFormPhone(e.target.value)}
                      className="mt-1 w-full text-xs border border-slate-200 bg-white rounded-lg p-2 focus:ring-1 focus:ring-emerald-500 focus:outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xxs font-bold text-slate-500 uppercase">Corporate Address</label>
                    <textarea
                      rows={2}
                      placeholder=""
                      value={supplierFormAddress}
                      onChange={(e) => setSupplierFormAddress(e.target.value)}
                      className="mt-1 w-full text-xs border border-slate-200 bg-white rounded-lg p-2 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-md hover:shadow-emerald-600/10 transition text-xs cursor-pointer"
                  >
                    {editingSupplier ? 'Update Supplier' : 'Save Supplier'}
                  </button>

                  {editingSupplier && (
                    <button
                      type="button"
                      onClick={resetSupplierForm}
                      className="w-full py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold rounded-lg transition text-xs cursor-pointer"
                    >
                      Cancel Editing
                    </button>
                  )}
                </form>
              </div>

              {/* Right Column: Interactive Grid View (7 cols) */}
              <div className="md:col-span-7 flex flex-col h-[420px]">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">
                  Supplier Directory Grid-View ({suppliers.length})
                </h4>
                
                <div className="flex-1 overflow-y-auto border border-slate-150 rounded-2xl bg-white">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="sticky top-0 bg-slate-50 border-b border-slate-150 z-10">
                      <tr className="text-slate-400 uppercase text-xxs font-bold">
                        <th className="p-3">ID</th>
                        <th className="p-3">Vendor Name</th>
                        <th className="p-3">Phone</th>
                        <th className="p-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                      {suppliers.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="p-8 text-center text-slate-400 font-semibold">
                            No vendors registered in directory.
                          </td>
                        </tr>
                      ) : (
                        suppliers.map((sup) => (
                          <tr key={sup.SID} className="hover:bg-slate-50/50">
                            <td className="p-3 font-mono text-xxs font-bold text-slate-400">{sup.SID}</td>
                            <td className="p-3">
                              <span className="font-bold text-slate-900 block text-xs">{sup.SupplierName}</span>
                              <span className="text-[10px] text-slate-400 block max-w-xs truncate font-normal" title={sup.Address}>
                                {sup.Address || 'No Address'}
                              </span>
                            </td>
                            <td className="p-3 font-mono text-slate-600 text-[11px]">{sup.Phone || 'N/A'}</td>
                            <td className="p-3 text-right space-x-1 whitespace-nowrap">
                              <button
                                type="button"
                                onClick={() => handleSelectEditSupplier(sup)}
                                className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 hover:text-blue-800 text-[10px] font-bold rounded transition cursor-pointer"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteSupplier(sup.SID)}
                                className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-700 text-[10px] font-bold rounded transition cursor-pointer"
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-150 bg-slate-50 flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => {
                  setIsVendorModalOpen(false);
                  resetSupplierForm();
                }}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-lg transition cursor-pointer"
              >
                Close Directory
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Pop-up modal for Patent Sourcing Decision */}
      {showPatentSourcingModal && selectedPatientId && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-[10000] p-4 animate-fadeIn font-sans">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-5 animate-scaleIn">
            <div className="flex items-start space-x-3.5">
              <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl shrink-0">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide">Patent Sourcing Selection</h3>
                <p className="text-xxs text-slate-500 font-semibold mt-0.5 uppercase tracking-wide">
                  Patient ID: {selectedPatientId} • {patients.find(p => p.PatientID === selectedPatientId)?.PatientName}
                </p>
              </div>
            </div>

            <div className="space-y-3 pt-1">
              <p className="text-xs text-slate-600 leading-relaxed">
                Please decide the sourcing logistics for any prescribed <strong className="text-slate-900">patent (brand-name) medicines</strong> for this patient.
              </p>

              <div className="grid grid-cols-1 gap-3 pt-1">
                {/* Option A: Clinic Stock */}
                <button
                  type="button"
                  onClick={() => {
                    setPatientSourcingOption('Clinic');
                    // Modify the visit object directly in-place so all downstream modules update dynamically
                    if (latestVisit) {
                      latestVisit.PatentPaymentOption = 'Clinic';
                    }
                    setShowPatentSourcingModal(false);
                  }}
                  className={`p-3.5 rounded-xl border text-left flex items-start space-x-3 transition duration-150 cursor-pointer ${
                    patientSourcingOption === 'Clinic'
                      ? 'border-emerald-500 bg-emerald-50/50 hover:bg-emerald-50'
                      : 'border-slate-200 hover:border-slate-300 bg-slate-50/50 hover:bg-slate-50'
                  }`}
                >
                  <div className={`mt-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                    patientSourcingOption === 'Clinic' ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-slate-300'
                  }`}>
                    {patientSourcingOption === 'Clinic' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                  <div>
                    <span className="block text-xs font-bold text-slate-900">Clinic Stock (Clinic Sourced)</span>
                    <span className="block text-xxs text-slate-500 mt-0.5">Sourced and billed directly inside Punjab Health Clinic terminal.</span>
                  </div>
                </button>

                {/* Option B: Outside Rx */}
                <button
                  type="button"
                  onClick={() => {
                    setPatientSourcingOption('Outside');
                    // Modify the visit object directly in-place so all downstream modules update dynamically
                    if (latestVisit) {
                      latestVisit.PatentPaymentOption = 'Outside';
                    }
                    setShowPatentSourcingModal(false);
                  }}
                  className={`p-3.5 rounded-xl border text-left flex items-start space-x-3 transition duration-150 cursor-pointer ${
                    patientSourcingOption === 'Outside'
                      ? 'border-indigo-500 bg-indigo-50/50 hover:bg-indigo-50'
                      : 'border-slate-200 hover:border-slate-300 bg-slate-50/50 hover:bg-slate-50'
                  }`}
                >
                  <div className={`mt-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                    patientSourcingOption === 'Outside' ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-300'
                  }`}>
                    {patientSourcingOption === 'Outside' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                  <div>
                    <span className="block text-xs font-bold text-slate-900">Outside Rx (External Sourced)</span>
                    <span className="block text-xxs text-slate-500 mt-0.5">Patent medicines are bought externally. Do not bill them here.</span>
                  </div>
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-slate-100 pt-4 text-xxs font-bold text-slate-400 uppercase tracking-widest">
              <span>Selected: {patientSourcingOption === 'Clinic' ? 'Clinic Stock' : 'Outside Rx'}</span>
              <button
                type="button"
                onClick={() => setShowPatentSourcingModal(false)}
                className="px-4 py-2 bg-slate-950 text-white hover:bg-slate-800 text-xxs font-black uppercase rounded-lg transition"
              >
                Confirm Decision
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pop-up modal box for Add / Edit Medicine */}
      {isAddMedicineModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 animate-fadeIn font-sans" id="add-medicine-modal">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full max-h-[85vh] flex flex-col overflow-hidden">
            
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-150 flex items-center justify-between bg-slate-50 shrink-0">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-950">
                    {editingItem ? `Edit Medicine: ${editingItem.ItemID}` : 'Add New Medicine to Inventory'}
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    {editingItem ? 'Modify unit cost, retail price, minimum threshold, or stock level.' : 'Enter new medicine parameters, category dropdown, and initial stock.'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={resetItemForm}
                className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-100 rounded-full transition cursor-pointer font-bold"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleSaveItem} className="p-5 overflow-y-auto flex-1 space-y-3.5 text-xs">
              {invErrorMsg && (
                <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg font-semibold border border-red-100 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-2 shrink-0 text-red-500" />
                  {invErrorMsg}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Item ID *</label>
                  <input
                    type="text"
                    required
                    disabled={!!editingItem}
                    placeholder=""
                    value={itemFormId}
                    onChange={(e) => setItemFormId(e.target.value.toUpperCase())}
                    className="w-full p-2 border rounded-lg focus:ring-1 focus:ring-indigo-500 font-mono disabled:bg-slate-50 disabled:text-slate-500 border-slate-200 text-slate-900 font-bold"
                  />
                  {!editingItem && (
                    <button
                      type="button"
                      onClick={() => {
                        setItemFormId(getAutoNextItemId(items));
                      }}
                      className="text-[9px] text-indigo-600 font-extrabold mt-1 hover:underline text-left block"
                    >
                      + Auto-Generate ID ({getAutoNextItemId(items)})
                    </button>
                  )}
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Medicine Type</label>
                  <select
                    value={itemFormMedicineType}
                    onChange={(e) => setItemFormMedicineType(e.target.value as 'C' | 'P')}
                    className="w-full p-2 border rounded-lg focus:ring-1 focus:ring-indigo-500 border-slate-200 font-semibold bg-white text-slate-900"
                  >
                    <option value="P">Patent Medicine (/P)</option>
                    <option value="C">Clinical Compounding (/C)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Medicine / Item Name *</label>
                <input
                  type="text"
                  required
                  placeholder=""
                  value={itemFormName}
                  onChange={(e) => setItemFormName(e.target.value)}
                  className="w-full p-2 border rounded-lg focus:ring-1 focus:ring-indigo-500 border-slate-200 font-bold text-slate-900"
                />
              </div>



              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">
                    Medicine Category Dropdown *
                  </label>
                  <div className="space-y-1">
                    <select
                      value={categories.includes(itemFormUnit) ? itemFormUnit : 'Custom'}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val !== 'Custom') {
                          setItemFormUnit(val);
                        } else {
                          setItemFormUnit('');
                        }
                      }}
                      className="w-full p-2 border rounded-lg focus:ring-1 focus:ring-indigo-500 border-slate-200 font-semibold text-slate-800 bg-white"
                    >
                      {categories.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                      <option value="Custom">Custom / Other Category...</option>
                    </select>

                    {(!categories.includes(itemFormUnit) || itemFormUnit === '') && (
                      <input
                        type="text"
                        required
                        placeholder=""
                        value={itemFormUnit}
                        onChange={(e) => setItemFormUnit(e.target.value)}
                        className="w-full p-1.5 text-xs border rounded-lg focus:ring-1 focus:ring-indigo-500 border-slate-200 font-semibold text-slate-800 bg-amber-50/50"
                      />
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Minimum Threshold</label>
                  <input
                    type="number"
                    min="0"
                    placeholder=""
                    value={itemFormMinStock}
                    onChange={(e) => setItemFormMinStock(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full p-2 border rounded-lg focus:ring-1 focus:ring-indigo-500 border-slate-200 font-mono font-bold text-slate-900"
                  />
                </div>
              </div>

              {/* Multi-Batch Action Banner for existing medicine */}
              {editingItem && (
                <div className="p-3 bg-gradient-to-r from-indigo-50 via-slate-50 to-indigo-50/60 border border-indigo-200 rounded-xl flex items-center justify-between gap-3 shadow-xs">
                  <div className="flex items-center space-x-2.5 min-w-0">
                    <div className="p-2 bg-indigo-600 text-white rounded-lg shrink-0 shadow-xs">
                      <Boxes className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center space-x-1.5">
                        <span className="font-extrabold text-indigo-950 text-xs">Multi-Batch & Expiry Lots</span>
                        <span className="px-1.5 py-0.2 bg-indigo-100 text-indigo-800 rounded font-mono text-[9px] font-bold">
                          {Array.isArray(editingItem.Batches) && editingItem.Batches.length > 0
                            ? `${editingItem.Batches.length} Batches`
                            : '1 Default Lot'}
                        </span>
                      </div>
                      <p className="text-[10px] text-indigo-700/90 font-medium truncate">
                        View lot-by-lot stock, expiry dates, purchase costs, and receive new stock batches.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddMedicineModalOpen(false);
                      handleOpenBatchManager(editingItem);
                    }}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-[11px] rounded-lg shadow-xs flex items-center space-x-1 cursor-pointer transition shrink-0"
                  >
                    <Boxes className="w-3.5 h-3.5 mr-1" />
                    <span>Manage Batches</span>
                  </button>
                </div>
              )}

              {/* Batch No, Mfg Date, and Exp Date Fields (Extracted from Box QR / Scanner / Master Defaults) */}
              <div className="grid grid-cols-3 gap-3 p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-600 uppercase tracking-wider mb-1">Batch # (B#)</label>
                  <input
                    type="text"
                    placeholder="e.g. B-2026-001"
                    value={itemFormBatchNo}
                    onChange={(e) => setItemFormBatchNo(e.target.value)}
                    className="w-full p-2 border rounded-lg focus:ring-1 focus:ring-indigo-500 border-slate-300 bg-white font-mono font-bold text-xs text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold text-slate-600 uppercase tracking-wider mb-1">Mfg Date</label>
                  <input
                    type="date"
                    value={itemFormMfgDate}
                    onChange={(e) => setItemFormMfgDate(e.target.value)}
                    className="w-full p-2 border rounded-lg focus:ring-1 focus:ring-indigo-500 border-slate-300 bg-white font-mono font-bold text-xs text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold text-slate-600 uppercase tracking-wider mb-1">Exp Date</label>
                  <input
                    type="date"
                    value={itemFormExpDate}
                    onChange={(e) => setItemFormExpDate(e.target.value)}
                    className="w-full p-2 border rounded-lg focus:ring-1 focus:ring-indigo-500 border-slate-300 bg-white font-mono font-bold text-xs text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Purchase Price (Rs.)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder=""
                    value={itemFormPurchasePrice}
                    onChange={(e) => setItemFormPurchasePrice(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full p-2 border rounded-lg focus:ring-1 focus:ring-indigo-500 border-slate-200 font-mono font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Retail Price (Rs.)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder=""
                    value={itemFormRetailPrice}
                    onChange={(e) => setItemFormRetailPrice(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full p-2 border rounded-lg focus:ring-1 focus:ring-indigo-500 border-slate-200 font-mono font-bold text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-between">
                    <span>Current Stock Level</span>
                    {!canEditStock && <span className="text-rose-600 font-bold text-[9px] lowercase">(Edit Restricted)</span>}
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder=""
                    disabled={!canEditStock}
                    value={itemFormCStock}
                    onChange={(e) => setItemFormCStock(e.target.value === '' ? '' : Number(e.target.value))}
                    className={`w-full p-2 border rounded-lg focus:ring-1 focus:ring-indigo-500 font-mono font-bold text-slate-900 ${
                      !canEditStock ? 'bg-slate-100 text-slate-400 cursor-not-allowed border-slate-200' : 'border-slate-200'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold text-indigo-600 uppercase tracking-wider mb-1">Buy / Reorder QTY</label>
                  <input
                    type="number"
                    min="0"
                    placeholder=""
                    value={itemFormReorderQty}
                    onChange={(e) => setItemFormReorderQty(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full p-2 border rounded-lg focus:ring-1 focus:ring-indigo-500 border-indigo-200 bg-indigo-50/30 font-mono font-bold text-indigo-950"
                  />
                </div>
              </div>

              {/* Modal Footer Buttons */}
              <div className="pt-4 border-t border-slate-100 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={resetItemForm}
                  className="px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-lg transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!canAdd}
                  className={`px-5 py-2 rounded-lg text-white font-bold text-xs transition shadow-md ${
                    canAdd
                      ? 'bg-indigo-600 hover:bg-indigo-700'
                      : 'bg-slate-400 cursor-not-allowed'
                  }`}
                >
                  {editingItem ? 'Update Medicine' : 'Add to Inventory'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* Interactive Grid-View Purchase Order Builder & Monthly Sales Velocity Analytics Modal - Disabled/Removed */}
      {false && (() => {
        // Calculations for PO Builder Tab
        const filteredGridItems = items.filter(itm => {
          const minStock = (itm.MinStock !== undefined && itm.MinStock !== null) ? itm.MinStock : 1;
          if (poStockFilterScope === 'THRESHOLD' && itm.CStock > minStock) return false;
          if (poStockFilterScope === 'OUT_OF_STOCK' && itm.CStock > 0) return false;
          if (poStockFilterScope === 'SELECTED_ONLY' && !selectedPoItemIds.has(itm.ItemID)) return false;

          if (poCategoryFilter !== 'ALL') {
            if (poCategoryFilter === 'C' && itm.MedicineType !== 'C') return false;
            if (poCategoryFilter === 'P' && itm.MedicineType === 'C') return false;
            if (poCategoryFilter !== 'C' && poCategoryFilter !== 'P') {
              const u = (itm.Unit || '').toLowerCase();
              const c = poCategoryFilter.toLowerCase();
              if (!u.includes(c) && !(itm.ItemName || '').toLowerCase().includes(c)) return false;
            }
          }

          if (poGridSearch.trim()) {
            const q = poGridSearch.toLowerCase().trim();
            const name = (itm.ItemName || '').toLowerCase();
            const id = (itm.ItemID || '').toLowerCase();
            const unit = (itm.Unit || '').toLowerCase();
            if (!name.includes(q) && !id.includes(q) && !unit.includes(q)) return false;
          }

          return true;
        });

        // Summary calculations for PO Builder
        const lowStockCount = items.filter(i => i.CStock <= ((i.MinStock !== undefined && i.MinStock !== null) ? i.MinStock : 1)).length;
        const selectedItemsList = items.filter(itm => selectedPoItemIds.has(itm.ItemID));
        const totalSelectedUnits = selectedItemsList.reduce((acc, itm) => {
          const qty = customOrderQtyMap[itm.ItemID] !== undefined
            ? customOrderQtyMap[itm.ItemID]
            : (itm.ReorderQty !== undefined && itm.ReorderQty !== null ? itm.ReorderQty : 0);
          return acc + qty;
        }, 0);

        const totalEstCost = selectedItemsList.reduce((acc, itm) => {
          const qty = customOrderQtyMap[itm.ItemID] !== undefined
            ? customOrderQtyMap[itm.ItemID]
            : (itm.ReorderQty !== undefined && itm.ReorderQty !== null ? itm.ReorderQty : 0);
          return acc + (qty * (itm.PurchasePrice || 0));
        }, 0);

        // Calculations for Sales Velocity Tab
        const filteredSalesGridItems = salesVelocityData.filter(entry => {
          if (salesFilterScope === 'HIGH_DEMAND' && entry.totalQtySold < 5) return false;
          if (salesFilterScope === 'TOP_20' && entry.rank > 20) return false;
          if (salesFilterScope === 'LOW_STOCK_ONLY' && !entry.isLowStock) return false;

          if (salesCategoryFilter !== 'ALL') {
            if (salesCategoryFilter === 'C' && entry.item.MedicineType !== 'C') return false;
            if (salesCategoryFilter === 'P' && entry.item.MedicineType === 'C') return false;
            if (salesCategoryFilter !== 'C' && salesCategoryFilter !== 'P') {
              const u = (entry.item.Unit || '').toLowerCase();
              const c = salesCategoryFilter.toLowerCase();
              if (!u.includes(c) && !(entry.item.ItemName || '').toLowerCase().includes(c)) return false;
            }
          }

          if (salesGridSearch.trim()) {
            const q = salesGridSearch.toLowerCase().trim();
            const name = (entry.item.ItemName || '').toLowerCase();
            const id = (entry.item.ItemID || '').toLowerCase();
            if (!name.includes(q) && !id.includes(q)) return false;
          }

          return true;
        });

        const totalUnitsSoldSum = salesVelocityData.reduce((acc, c) => acc + c.totalQtySold, 0);
        const totalRevenueSum = salesVelocityData.reduce((acc, c) => acc + c.totalRevenue, 0);
        const criticalCount = salesVelocityData.filter(c => c.urgency === 'CRITICAL').length;
        const fastMoversCount = salesVelocityData.filter(c => c.totalQtySold >= 10).length;
        const maxSalesQty = salesVelocityData.length > 0 ? Math.max(...salesVelocityData.map(d => d.totalQtySold), 1) : 1;

        return (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[9999] flex items-center justify-center p-2 sm:p-4 font-sans animate-fadeIn">
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-7xl overflow-hidden flex flex-col h-[94vh] max-h-[95vh]">
              
              {/* Header Banner */}
              <div className="p-4 bg-slate-900 text-white flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0 border-b border-slate-800">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 bg-indigo-600/30 text-indigo-400 rounded-xl border border-indigo-500/40 shrink-0">
                    <CheckSquare className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-0.5 bg-amber-400 text-slate-950 text-[10px] font-black uppercase tracking-wider rounded">
                        Interactive Grid-View
                      </span>
                      <h2 className="font-extrabold text-base tracking-tight text-white">
                        Purchase Order & Demand Analytics Center
                      </h2>
                    </div>
                    <p className="text-xs text-slate-400 font-medium mt-0.5">
                      Choose medicines, edit order quantities, build custom POs, and analyze monthly sales demand.
                    </p>
                  </div>
                </div>

                {/* Tab Switcher */}
                <div className="flex items-center space-x-2 bg-slate-800/90 p-1.5 rounded-xl border border-slate-700/80 shrink-0">
                  <button
                    type="button"
                    onClick={() => setPoModalTab('po_builder')}
                    className={`px-3.5 py-2 rounded-lg text-xs font-extrabold transition flex items-center space-x-2 cursor-pointer ${
                      poModalTab === 'po_builder'
                        ? 'bg-indigo-600 text-white shadow-sm ring-1 ring-indigo-400'
                        : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
                    }`}
                  >
                    <CheckSquare className="w-4 h-4 text-amber-300" />
                    <span>1. PO Requisition Builder</span>
                    <span className="px-1.5 py-0.2 text-[10px] bg-indigo-900 text-indigo-200 rounded-full font-black">
                      {selectedPoItemIds.size}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPoModalTab('sales_velocity')}
                    className={`px-3.5 py-2 rounded-lg text-xs font-extrabold transition flex items-center space-x-2 cursor-pointer ${
                      poModalTab === 'sales_velocity'
                        ? 'bg-emerald-600 text-white shadow-sm ring-1 ring-emerald-400'
                        : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
                    }`}
                  >
                    <TrendingUp className="w-4 h-4 text-emerald-300" />
                    <span>2. Monthly Sales Demand Grid</span>
                  </button>
                </div>

                {/* Close Button */}
                <button
                  type="button"
                  onClick={() => setIsPOGridModalOpen(false)}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition cursor-pointer self-start md:self-auto"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Main Content Area */}
              {poModalTab === 'po_builder' ? (
                /* TAB 1: PURCHASE ORDER BUILDER GRID */
                <div className="flex-1 flex flex-col min-h-0 bg-slate-50 overflow-hidden">
                  
                  {/* Metric Summary Cards */}
                  <div className="p-4 bg-white border-b border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3 shrink-0">
                    <div className="p-3 bg-rose-50/70 border border-rose-200 rounded-xl flex items-center space-x-3">
                      <div className="p-2 bg-rose-100 text-rose-700 rounded-lg shrink-0">
                        <AlertTriangle className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-[10px] font-black uppercase text-rose-600 tracking-wider block">Low Stock Items</span>
                        <strong className="text-lg font-black font-mono text-rose-950">{lowStockCount} Items</strong>
                      </div>
                    </div>

                    <div className="p-3 bg-indigo-50/70 border border-indigo-200 rounded-xl flex items-center space-x-3">
                      <div className="p-2 bg-indigo-100 text-indigo-700 rounded-lg shrink-0">
                        <PackageCheck className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-[10px] font-black uppercase text-indigo-600 tracking-wider block">Checked for PO</span>
                        <strong className="text-lg font-black font-mono text-indigo-950">{selectedPoItemIds.size} Selected</strong>
                      </div>
                    </div>

                    <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl flex items-center space-x-3">
                      <div className="p-2 bg-amber-100 text-amber-800 rounded-lg shrink-0">
                        <Layers className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-[10px] font-black uppercase text-amber-700 tracking-wider block">Total Order Units</span>
                        <strong className="text-lg font-black font-mono text-amber-950">{totalSelectedUnits.toLocaleString()} Units</strong>
                      </div>
                    </div>

                    <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-center space-x-3">
                      <div className="p-2 bg-emerald-100 text-emerald-800 rounded-lg shrink-0">
                        <Sparkles className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-[10px] font-black uppercase text-emerald-700 tracking-wider block">Requisition Status</span>
                        <strong className="text-lg font-black font-mono text-emerald-950">{selectedPoItemIds.size > 0 ? 'Ready to Order' : 'No Items Selected'}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Filter & Selection Controls Toolbar */}
                  <div className="p-3 bg-slate-100 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs shrink-0">
                    <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[300px]">
                      {/* Search */}
                      <div className="relative flex-1 min-w-[180px] max-w-xs">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                        <input
                          type="text"
                          placeholder=""
                          value={poGridSearch}
                          onChange={(e) => setPoGridSearch(e.target.value)}
                          className="w-full pl-8 pr-3 py-1.5 text-xs font-semibold bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        />
                      </div>

                      {/* Stock Scope Filter */}
                      <select
                        value={poStockFilterScope}
                        onChange={(e) => setPoStockFilterScope(e.target.value as any)}
                        className="py-1.5 px-2.5 text-xs font-bold bg-white border border-slate-300 rounded-lg text-slate-800 focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="THRESHOLD">⚠️ Below Min Threshold (Shortage PO)</option>
                        <option value="ALL">📦 All Inventory Medicines</option>
                        <option value="SELECTED_ONLY">✅ Checked / Selected Items Only</option>
                        <option value="OUT_OF_STOCK">🚨 Out of Stock Items Only (0 Stock)</option>
                      </select>

                      {/* Category Filter */}
                      <select
                        value={poCategoryFilter}
                        onChange={(e) => setPoCategoryFilter(e.target.value)}
                        className="py-1.5 px-2.5 text-xs font-bold bg-white border border-slate-300 rounded-lg text-slate-800 focus:ring-2 focus:ring-indigo-500 max-w-[160px]"
                      >
                        <option value="ALL">All Categories</option>
                        <option value="C">Clinical Compounding (/C)</option>
                        <option value="P">Patent Medicine (/P)</option>
                        {categoryDropdownOptions.map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>

                    {/* Bulk Selection Buttons & Print Layout */}
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={handleSelectAllLowStock}
                        className="px-2.5 py-1.5 bg-rose-100 hover:bg-rose-200 text-rose-800 font-extrabold text-[11px] rounded-lg border border-rose-300 transition cursor-pointer"
                        title="Check all medicines below minimum threshold"
                      >
                        Select Low Stock
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSelectAllVisible(filteredGridItems)}
                        className="px-2.5 py-1.5 bg-indigo-100 hover:bg-indigo-200 text-indigo-900 font-extrabold text-[11px] rounded-lg border border-indigo-300 transition cursor-pointer"
                        title="Check all currently filtered medicines"
                      >
                        Select All Visible
                      </button>

                      <button
                        type="button"
                        onClick={handleDeselectAll}
                        className="px-2.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-[11px] rounded-lg transition cursor-pointer"
                        title="Uncheck all items"
                      >
                        Deselect All
                      </button>

                      <div className="h-4 w-px bg-slate-300 mx-1" />

                      {/* Print Format Selector */}
                      <select
                        value={poPrintLayout}
                        onChange={(e) => setPoPrintLayout(e.target.value as any)}
                        className="py-1.5 px-2 text-[11px] font-bold bg-white border border-slate-300 rounded-lg text-slate-800"
                        title="Choose layout style for Purchase Order printing"
                      >
                        <option value="detail">A4 Detailed Table Layout</option>
                        <option value="3col">A4 3-Column Compact Grid</option>
                      </select>
                    </div>
                  </div>

                  {/* Interactive PO Builder Grid Table */}
                  <div className="flex-1 overflow-auto p-4">
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-900 text-white uppercase text-[10px] tracking-wider font-extrabold sticky top-0 z-10">
                            <th className="p-3 text-center w-10">
                              <input
                                type="checkbox"
                                checked={filteredGridItems.length > 0 && filteredGridItems.every(i => selectedPoItemIds.has(i.ItemID))}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    handleSelectAllVisible(filteredGridItems);
                                  } else {
                                    handleDeselectAll();
                                  }
                                }}
                                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                title="Toggle select all visible"
                              />
                            </th>
                            <th className="p-3 text-center w-12">S.No</th>
                            <th className="p-3">Item ID & Medicine Name</th>
                            <th className="p-3 text-center">Category / Unit</th>
                            <th className="p-3 text-center">Current Stock</th>
                            <th className="p-3 text-center">Min Threshold</th>
                            <th className="p-3 text-center">Stock Deficit</th>
                            <th className="p-3 text-center w-36 bg-indigo-950 text-indigo-200">Required Order Qty</th>
                            <th className="p-3 text-center">Include in PO</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-150 font-medium">
                          {filteredGridItems.length === 0 ? (
                            <tr>
                              <td colSpan={9} className="p-8 text-center text-slate-400 font-bold">
                                No medicines match your current filter scope or search query.
                              </td>
                            </tr>
                          ) : (
                            filteredGridItems.map((itm, idx) => {
                              const isChecked = selectedPoItemIds.has(itm.ItemID);
                              const minStock = (itm.MinStock !== undefined && itm.MinStock !== null) ? itm.MinStock : 1;
                              const isLowStock = itm.CStock <= minStock;
                              const deficit = Math.max(0, minStock - itm.CStock);
                              
                              const defaultCalcQty = (itm.ReorderQty !== undefined && itm.ReorderQty !== null)
                                ? itm.ReorderQty
                                : 0;
                              
                              const currentOrderQty = customOrderQtyMap[itm.ItemID] !== undefined ? customOrderQtyMap[itm.ItemID] : defaultCalcQty;

                              return (
                                <tr
                                  key={itm.ItemID}
                                  className={`transition hover:bg-slate-50 ${
                                    isChecked ? 'bg-indigo-50/40' : isLowStock ? 'bg-rose-50/20' : ''
                                  }`}
                                >
                                  <td className="p-3 text-center">
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={() => handleTogglePoItem(itm.ItemID)}
                                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                    />
                                  </td>
                                  <td className="p-3 text-center font-bold text-slate-400 font-mono">
                                    {idx + 1}
                                  </td>
                                  <td className="p-3">
                                    <div className="flex items-center space-x-2">
                                      <span className="font-extrabold text-slate-900 text-xs">{itm.ItemName}</span>
                                      <span className={`text-[9px] font-black uppercase px-1.5 py-0.2 rounded ${
                                        itm.MedicineType === 'C' ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-800'
                                      }`}>
                                        {itm.MedicineType === 'C' ? 'Clinical' : 'Patent'}
                                      </span>
                                    </div>
                                    <span className="text-[10px] text-slate-400 font-mono block">ID: {itm.ItemID}</span>
                                  </td>
                                  <td className="p-3 text-center font-semibold text-slate-600">
                                    {itm.Unit || 'Tab'}
                                  </td>
                                  <td className="p-3 text-center">
                                    <span className={`font-mono font-bold px-2 py-0.5 rounded text-xs ${
                                      itm.CStock === 0
                                        ? 'bg-rose-600 text-white animate-pulse'
                                        : isLowStock
                                        ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                        : 'bg-emerald-50 text-emerald-700'
                                    }`}>
                                      {itm.CStock} {itm.Unit || 'Tab'}s
                                    </span>
                                  </td>
                                  <td className="p-3 text-center font-mono text-slate-600 font-bold">
                                    {minStock}
                                  </td>
                                  <td className="p-3 text-center font-mono">
                                    {deficit > 0 ? (
                                      <span className="text-rose-600 font-extrabold">-{deficit}</span>
                                    ) : (
                                      <span className="text-emerald-600 font-bold">OK</span>
                                    )}
                                  </td>
                                  {/* Editable Order Qty Input */}
                                  <td className="p-2 text-center bg-indigo-50/50">
                                    <div className="flex items-center justify-center space-x-1">
                                      <input
                                        type="number"
                                        min="1"
                                        value={currentOrderQty}
                                        onChange={(e) => handleOrderQtyChange(itm.ItemID, parseInt(e.target.value))}
                                        disabled={!isChecked}
                                        className={`w-20 text-center font-black font-mono border rounded p-1 text-xs focus:ring-2 focus:ring-indigo-500 shadow-xs ${
                                          isChecked
                                            ? 'bg-white border-indigo-300 text-indigo-950 font-extrabold'
                                            : 'bg-slate-100 border-slate-200 text-slate-400'
                                        }`}
                                      />
                                      <span className="text-[10px] text-slate-400 font-bold">{itm.Unit || 'Tab'}</span>
                                    </div>
                                  </td>
                                  <td className="p-3 text-center">
                                    <button
                                      type="button"
                                      onClick={() => handleTogglePoItem(itm.ItemID)}
                                      className={`px-2.5 py-1 text-[11px] font-extrabold rounded-lg transition cursor-pointer ${
                                        isChecked
                                          ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                                          : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                                      }`}
                                    >
                                      {isChecked ? 'Included' : '+ Add'}
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

                  {/* Footer Action Bar */}
                  <div className="p-4 bg-white border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
                    <div className="text-xs text-slate-600 font-semibold">
                      Showing <strong className="text-slate-900">{filteredGridItems.length}</strong> items in grid view. 
                      <strong className="text-indigo-600 ml-1">{selectedPoItemIds.size} medicines selected</strong> for custom purchase order.
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5">
                      <button
                        type="button"
                        onClick={() => handleOpenSelectedPoPrintWindow('with_stock')}
                        disabled={selectedPoItemIds.size === 0}
                        className={`px-4 py-2.5 rounded-xl font-extrabold text-xs transition flex items-center space-x-1.5 border shadow-sm cursor-pointer ${
                          selectedPoItemIds.size > 0
                            ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                            : 'bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed'
                        }`}
                        title="Print report including current stock, min thresholds, and estimated cost"
                      >
                        <Printer className="w-4 h-4 text-slate-600" />
                        <span>Print Report with Current Stock</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenSelectedPoPrintWindow('clean_po')}
                        disabled={selectedPoItemIds.size === 0}
                        className={`px-5 py-2.5 rounded-xl text-white font-extrabold text-xs transition flex items-center space-x-2 shadow-md cursor-pointer ${
                          selectedPoItemIds.size > 0
                            ? 'bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800'
                            : 'bg-slate-400 cursor-not-allowed'
                        }`}
                        title="Print clean purchase order containing medicine names and required quantity only"
                      >
                        <Printer className="w-4 h-4 text-amber-300" />
                        <span>Print Report with Purchase Order</span>
                      </button>
                    </div>
                  </div>

                </div>
              ) : (
                /* TAB 2: MONTHLY TOP-SELLING MEDICINE SALES VELOCITY GRID */
                <div className="flex-1 flex flex-col min-h-0 bg-slate-50 overflow-hidden">
                  
                  {/* Sales Metrics Summary Banner */}
                  <div className="p-4 bg-white border-b border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3 shrink-0">
                    <div className="p-3 bg-indigo-50/70 border border-indigo-200 rounded-xl flex items-center space-x-3">
                      <div className="p-2 bg-indigo-100 text-indigo-700 rounded-lg shrink-0">
                        <TrendingUp className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-[10px] font-black uppercase text-indigo-600 tracking-wider block">Total Monthly Units Sold</span>
                        <strong className="text-lg font-black font-mono text-indigo-950">{totalUnitsSoldSum.toLocaleString()} Units</strong>
                      </div>
                    </div>

                    <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-center space-x-3">
                      <div className="p-2 bg-emerald-100 text-emerald-800 rounded-lg shrink-0">
                        <Sparkles className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-[10px] font-black uppercase text-emerald-700 tracking-wider block">Total Revenue (PKR)</span>
                        <strong className="text-lg font-black font-mono text-emerald-950">Rs. {totalRevenueSum.toLocaleString()}</strong>
                      </div>
                    </div>

                    <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl flex items-center space-x-3">
                      <div className="p-2 bg-amber-100 text-amber-800 rounded-lg shrink-0">
                        <BarChart3 className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-[10px] font-black uppercase text-amber-700 tracking-wider block">Fast Moving Medicines</span>
                        <strong className="text-lg font-black font-mono text-amber-950">{fastMoversCount} Medicines</strong>
                      </div>
                    </div>

                    <div className="p-3 bg-rose-50/70 border border-rose-200 rounded-xl flex items-center space-x-3">
                      <div className="p-2 bg-rose-100 text-rose-700 rounded-lg shrink-0">
                        <AlertTriangle className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-[10px] font-black uppercase text-rose-600 tracking-wider block">Critical Reorder Needed</span>
                        <strong className="text-lg font-black font-mono text-rose-950">{criticalCount} High Demand</strong>
                      </div>
                    </div>
                  </div>

                  {/* Filter Toolbar for Sales Grid */}
                  <div className="p-3 bg-slate-100 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs shrink-0">
                    <div className="flex flex-wrap items-center gap-2 flex-1">
                      {/* Search */}
                      <div className="relative flex-1 min-w-[180px] max-w-xs">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                        <input
                          type="text"
                          placeholder=""
                          value={salesGridSearch}
                          onChange={(e) => setSalesGridSearch(e.target.value)}
                          className="w-full pl-8 pr-3 py-1.5 text-xs font-semibold bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                        />
                      </div>

                      {/* Time Period Selector */}
                      <select
                        value={poSalesPeriodDays}
                        onChange={(e) => setPoSalesPeriodDays(Number(e.target.value))}
                        className="py-1.5 px-2.5 text-xs font-bold bg-white border border-slate-300 rounded-lg text-slate-800 focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value={30}>📅 Past 30 Days (Current Month)</option>
                        <option value={60}>📅 Past 60 Days (2 Months)</option>
                        <option value={90}>📅 Past 90 Days (Quarter)</option>
                        <option value={0}>♾️ All-Time Sales Velocity</option>
                      </select>

                      {/* Sort Selector */}
                      <select
                        value={salesSortBy}
                        onChange={(e) => setSalesSortBy(e.target.value as any)}
                        className="py-1.5 px-2.5 text-xs font-bold bg-white border border-slate-300 rounded-lg text-slate-800 focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value="units_sold">🔥 Sort by Units Sold (Highest First)</option>
                        <option value="revenue">💵 Sort by Total Revenue (PKR)</option>
                        <option value="stock_deficit">🚨 Sort by Stock Shortage Deficit</option>
                      </select>

                      {/* Scope Filter Scope */}
                      <select
                        value={salesFilterScope}
                        onChange={(e) => setSalesFilterScope(e.target.value as any)}
                        className="py-1.5 px-2.5 text-xs font-bold bg-white border border-slate-300 rounded-lg text-slate-800 focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value="ALL">All Medicines</option>
                        <option value="TOP_20">🏆 Top 20 Best Sellers Only</option>
                        <option value="HIGH_DEMAND">🔥 High Demand (&gt;5 Units Sold)</option>
                        <option value="LOW_STOCK_ONLY">⚠️ Low Stock Only</option>
                      </select>
                    </div>

                    <button
                      type="button"
                      onClick={handleOpenSalesReportPrintWindow}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl transition flex items-center space-x-1.5 shadow-sm cursor-pointer"
                    >
                      <Printer className="w-4 h-4 text-amber-300" />
                      <span>Print Monthly Sales Report</span>
                    </button>
                  </div>

                  {/* Monthly Sales Velocity Grid Table */}
                  <div className="flex-1 overflow-auto p-4">
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-900 text-white uppercase text-[10px] tracking-wider font-extrabold sticky top-0 z-10">
                            <th className="p-3 text-center w-16">Rank</th>
                            <th className="p-3">Medicine Name & Item ID</th>
                            <th className="p-3 text-center">Category</th>
                            <th className="p-3 text-center w-48">Monthly Units Sold</th>
                            <th className="p-3 text-right">Total Revenue</th>
                            <th className="p-3 text-center">Current Stock</th>
                            <th className="p-3 text-center">Min Threshold</th>
                            <th className="p-3 text-center">Demand Status</th>
                            <th className="p-3 text-center">Quick Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-150 font-medium">
                          {filteredSalesGridItems.length === 0 ? (
                            <tr>
                              <td colSpan={9} className="p-8 text-center text-slate-400 font-bold">
                                No sales recorded for the selected period or filters.
                              </td>
                            </tr>
                          ) : (
                            filteredSalesGridItems.map((entry) => {
                              const percentOfTop = Math.min(100, Math.round((entry.totalQtySold / maxSalesQty) * 100));
                              const isInPo = selectedPoItemIds.has(entry.item.ItemID);

                              return (
                                <tr key={entry.item.ItemID} className="hover:bg-slate-50 transition">
                                  <td className="p-3 text-center">
                                    <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-black font-mono ${
                                      entry.rank === 1 ? 'bg-amber-400 text-slate-950 shadow-xs ring-2 ring-amber-300' :
                                      entry.rank === 2 ? 'bg-slate-300 text-slate-900 font-bold' :
                                      entry.rank === 3 ? 'bg-amber-700 text-white font-bold' :
                                      'bg-slate-100 text-slate-600'
                                    }`}>
                                      {entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : `#${entry.rank}`}
                                    </span>
                                  </td>
                                  <td className="p-3">
                                    <div className="flex items-center space-x-2">
                                      <span className="font-extrabold text-slate-900 text-xs">{entry.item.ItemName}</span>
                                      <span className={`text-[9px] font-black uppercase px-1.5 py-0.2 rounded ${
                                        entry.item.MedicineType === 'C' ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-800'
                                      }`}>
                                        {entry.item.MedicineType === 'C' ? 'Clinical' : 'Patent'}
                                      </span>
                                    </div>
                                    <span className="text-[10px] text-slate-400 font-mono block">ID: {entry.item.ItemID}</span>
                                  </td>
                                  <td className="p-3 text-center font-semibold text-slate-600">
                                    {entry.item.Unit || 'Tab'}
                                  </td>
                                  {/* Monthly Units Sold with Visual Velocity Bar */}
                                  <td className="p-3 text-center">
                                    <div className="space-y-1">
                                      <span className="font-mono font-black text-indigo-950 text-xs block">
                                        {entry.totalQtySold.toLocaleString()} {entry.item.Unit || 'Tab'}s
                                      </span>
                                      <div className="w-full bg-slate-150 h-1.5 rounded-full overflow-hidden">
                                        <div
                                          className={`h-full rounded-full transition-all duration-500 ${
                                            entry.rank <= 3 ? 'bg-amber-500' : entry.totalQtySold >= 10 ? 'bg-indigo-600' : 'bg-slate-400'
                                          }`}
                                          style={{ width: `${Math.max(4, percentOfTop)}%` }}
                                        />
                                      </div>
                                    </div>
                                  </td>
                                  <td className="p-3 text-right font-mono font-bold text-emerald-700">
                                    Rs. {entry.totalRevenue.toLocaleString()}
                                  </td>
                                  <td className="p-3 text-center">
                                    <span className={`font-mono font-bold px-2 py-0.5 rounded text-xs ${
                                      entry.isLowStock
                                        ? 'bg-rose-100 text-rose-800 border border-rose-200 font-extrabold'
                                        : 'bg-emerald-50 text-emerald-700'
                                    }`}>
                                      {entry.item.CStock}
                                    </span>
                                  </td>
                                  <td className="p-3 text-center font-mono text-slate-600 font-bold">
                                    {entry.minStock}
                                  </td>
                                  <td className="p-3 text-center">
                                    {entry.urgency === 'CRITICAL' ? (
                                      <span className="px-2 py-1 bg-rose-600 text-white rounded text-[10px] font-black uppercase tracking-wider animate-pulse inline-block">
                                        🚨 Critical Reorder
                                      </span>
                                    ) : entry.urgency === 'HIGH' ? (
                                      <span className="px-2 py-1 bg-rose-100 text-rose-800 rounded text-[10px] font-extrabold uppercase tracking-wider inline-block">
                                        ⚠️ Low Stock
                                      </span>
                                    ) : entry.totalQtySold >= 10 ? (
                                      <span className="px-2 py-1 bg-indigo-100 text-indigo-800 rounded text-[10px] font-extrabold uppercase tracking-wider inline-block">
                                        🔥 Fast Mover
                                      </span>
                                    ) : (
                                      <span className="px-2 py-1 bg-emerald-50 text-emerald-700 rounded text-[10px] font-bold uppercase tracking-wider inline-block">
                                        🟢 Sufficient
                                      </span>
                                    )}
                                  </td>
                                  <td className="p-3 text-center">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        handleTogglePoItem(entry.item.ItemID);
                                        const calcQty = Math.max(entry.totalQtySold, entry.minStock * 2);
                                        handleOrderQtyChange(entry.item.ItemID, calcQty);
                                      }}
                                      className={`px-3 py-1 rounded-lg font-bold text-xs transition cursor-pointer flex items-center justify-center space-x-1 mx-auto ${
                                        isInPo
                                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                          : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs'
                                      }`}
                                    >
                                      {isInPo ? (
                                        <>
                                          <Check className="w-3.5 h-3.5" />
                                          <span>In PO</span>
                                        </>
                                      ) : (
                                        <>
                                          <Plus className="w-3.5 h-3.5" />
                                          <span>Add to PO</span>
                                        </>
                                      )}
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

                  {/* Footer Action Bar */}
                  <div className="p-4 bg-white border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
                    <div className="text-xs text-slate-600 font-semibold">
                      Analyzed sales history across Pharmacy POS & EMR Prescriptions over past <strong className="text-slate-900">{poSalesPeriodDays > 0 ? `${poSalesPeriodDays} days` : 'all-time'}</strong>.
                    </div>

                    <button
                      type="button"
                      onClick={handleOpenSalesReportPrintWindow}
                      className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-extrabold text-xs rounded-xl transition flex items-center space-x-2 shadow-md cursor-pointer"
                    >
                      <Printer className="w-4 h-4 text-amber-300" />
                      <span>Print Monthly Sales Demand Report</span>
                    </button>
                  </div>

                </div>
              )}

            </div>
          </div>
        );
      })()}

      {/* Master A4 Purchase Order Print Dialog & Preview Modal */}
      {isPOPrintPreviewOpen && (() => {
        const filteredPoItems = getFilteredPoItems(items, poCategoryFilter, poOnlyLowStock);
        
        const poRows = [];
        for (let i = 0; i < filteredPoItems.length; i += 3) {
          poRows.push([
            filteredPoItems[i],
            filteredPoItems[i + 1] || null,
            filteredPoItems[i + 2] || null
          ]);
        }

        return (
          <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[9999] flex flex-col items-center justify-start p-2 sm:p-4 overflow-y-auto po-modal-backdrop print:p-0 print:bg-white print:static print:overflow-visible font-sans">
            
            {/* Style Injector for Direct Print Engine (HP LaserJet Compatible, Multi-page) */}
            <style dangerouslySetInnerHTML={{ __html: `
              @media print {
                @page {
                  size: A4 portrait;
                  margin: 12mm 12mm 12mm 12mm;
                }
                
                body * {
                  visibility: hidden !important;
                }

                html, body {
                  background: #ffffff !important;
                  color: #000000 !important;
                  height: auto !important;
                  min-height: auto !important;
                  overflow: visible !important;
                  margin: 0 !important;
                  padding: 0 !important;
                }

                .po-modal-backdrop {
                  position: static !important;
                  inset: auto !important;
                  overflow: visible !important;
                  max-height: none !important;
                  height: auto !important;
                  background: #ffffff !important;
                  padding: 0 !important;
                  margin: 0 !important;
                  box-shadow: none !important;
                  backdrop-filter: none !important;
                }

                .po-modal-container {
                  position: static !important;
                  max-height: none !important;
                  height: auto !important;
                  width: 100% !important;
                  max-width: 100% !important;
                  overflow: visible !important;
                  box-shadow: none !important;
                  border: none !important;
                  background: #ffffff !important;
                  padding: 0 !important;
                  margin: 0 !important;
                  border-radius: 0 !important;
                }

                #po-master-printable-area,
                #po-master-printable-area * {
                  visibility: visible !important;
                }

                #po-master-printable-area {
                  position: absolute !important;
                  left: 0 !important;
                  top: 0 !important;
                  width: 100% !important;
                  max-width: 100% !important;
                  margin: 0 !important;
                  padding: 0 !important;
                  background: #ffffff !important;
                  color: #000000 !important;
                  box-shadow: none !important;
                  border: none !important;
                  overflow: visible !important;
                  display: block !important;
                }

                table.po-print-table {
                  width: 100% !important;
                  border-collapse: collapse !important;
                  page-break-inside: auto !important;
                  border: 2px solid #000 !important;
                }

                table.po-print-table thead {
                  display: table-header-group !important;
                }

                table.po-print-table tbody tr {
                  page-break-inside: avoid !important;
                  break-inside: avoid !important;
                }

                table.po-print-table th,
                table.po-print-table td {
                  border: 1px solid #000 !important;
                  padding: 4px 6px !important;
                  color: #000 !important;
                }

                .no-print {
                  display: none !important;
                  visibility: hidden !important;
                }
              }
            ` }} />

            <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl overflow-hidden my-auto flex flex-col max-h-[92vh] po-modal-container print:max-h-none print:shadow-none print:border-none print:rounded-none">
              
              {/* Modal Header Controls */}
              <div className="p-4 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3 shrink-0 print:hidden no-print">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-lg border border-indigo-500/30">
                    <Printer className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="font-extrabold text-sm uppercase tracking-wider text-white flex items-center gap-2">
                      A4 Purchase Order Print Dialog & Preview
                    </h2>
                    <p className="text-[11px] text-slate-300">Filter by category, threshold scope, and layout format to generate printable Purchase Orders</p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={handleOpenPoPrintWindow}
                    className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-xs rounded-xl transition flex items-center shadow-md cursor-pointer"
                    title="Open printable document in a new window to print with full browser print options"
                  >
                    <Printer className="w-4 h-4 mr-1.5" />
                    <span>Open & Print in Pop-up</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      window.print();
                    }}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs rounded-xl transition flex items-center shadow-md cursor-pointer"
                    title="Trigger direct browser printing"
                  >
                    <Printer className="w-4 h-4 mr-1.5" />
                    <span>Trigger Direct Print</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsPOPrintPreviewOpen(false)}
                    className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition cursor-pointer"
                    title="Close Print Dialog"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Filter Toolbar (Category, Scope, Layout Selector) */}
              <div className="bg-slate-100 border-b border-slate-200 p-3.5 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs shrink-0 print:hidden no-print">
                {/* Category Selector */}
                <div className="space-y-1">
                  <label className="block text-[10px] font-black uppercase text-slate-500 tracking-wider">
                    Filter Medicine Category
                  </label>
                  <select
                    value={poCategoryFilter}
                    onChange={(e) => setPoCategoryFilter(e.target.value)}
                    className="w-full text-xs font-bold text-slate-800 bg-white border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="ALL">All Categories ({items.length} Medicines)</option>
                    <option value="C">Clinical Compounding (/C)</option>
                    <option value="P">Patent Medicine (/P)</option>
                    {categoryDropdownOptions.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                {/* Scope Selector */}
                <div className="space-y-1">
                  <label className="block text-[10px] font-black uppercase text-slate-500 tracking-wider">
                    Report Stock Scope
                  </label>
                  <select
                    value={poOnlyLowStock ? 'LOW_STOCK' : 'ALL_ITEMS'}
                    onChange={(e) => setPoOnlyLowStock(e.target.value === 'LOW_STOCK')}
                    className="w-full text-xs font-bold text-slate-800 bg-white border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="LOW_STOCK">Below Minimum Stock Threshold (Shortage PO)</option>
                    <option value="ALL_ITEMS">All Selected Category Medicines (Full Requisition)</option>
                  </select>
                </div>

                {/* Layout Format Selector */}
                <div className="space-y-1">
                  <label className="block text-[10px] font-black uppercase text-slate-500 tracking-wider">
                    Print Layout Format
                  </label>
                  <div className="flex items-center space-x-1.5 pt-0.5">
                    <button
                      type="button"
                      onClick={() => setPoPrintLayout('3col')}
                      className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold border transition cursor-pointer ${
                        poPrintLayout === '3col'
                          ? 'bg-indigo-600 text-white border-indigo-700 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      3-Column Grid
                    </button>
                    <button
                      type="button"
                      onClick={() => setPoPrintLayout('detail')}
                      className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold border transition cursor-pointer ${
                        poPrintLayout === 'detail'
                          ? 'bg-indigo-600 text-white border-indigo-700 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      Full Detail List
                    </button>
                  </div>
                </div>
              </div>

              {/* Selected Items Status Banner */}
              <div className="bg-indigo-50 border-b border-indigo-100 px-4 py-2 flex items-center justify-between text-xs font-semibold text-indigo-950 shrink-0 print:hidden no-print">
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>
                    Category: <strong className="text-indigo-700">{poCategoryFilter === 'ALL' ? 'All Categories' : poCategoryFilter}</strong>
                  </span>
                  <span className="text-slate-300">|</span>
                  <span>
                    Selected Items: <strong className="text-indigo-700">{filteredPoItems.length} Medicines</strong>
                  </span>
                </div>
                <span className="text-[10px] font-bold text-slate-500 hidden sm:inline">
                  📄 A4 Standard Letterhead (HP LaserJet Ready)
                </span>
              </div>

              {/* Interactive Sheet Preview Container */}
              <div className="p-4 sm:p-6 overflow-y-auto bg-slate-200/70 flex justify-center flex-1 print:p-0 print:bg-white print:overflow-visible">
                <div
                  id="po-master-printable-area"
                  className="bg-white shadow-2xl border border-slate-300 p-6 sm:p-8 w-full max-w-[210mm] min-h-[297mm] text-black font-sans text-xs shrink-0 print:shadow-none print:border-none print:p-0 print:w-full print:max-w-full print:min-h-0"
                >
                  {/* Clinic Letterhead Header */}
                  <div className="text-center mb-4 pb-3 border-b-2 border-black">
                    <h1 className="text-xl sm:text-2xl font-black uppercase text-black tracking-wide">
                      {clinicSettings?.ClinicName || "Punjab Homeopathic Clinic"}
                    </h1>
                    <p className="text-xs font-extrabold text-black uppercase tracking-wider mt-0.5">
                      PURCHASE ORDER & MINIMUM THRESHOLD REQUISITION
                    </p>
                    <div className="flex flex-wrap items-center justify-between text-[10px] font-bold text-slate-800 mt-2 pt-2 border-t border-slate-200">
                      <span>Date: {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                      <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-300 uppercase">
                        Category: {poCategoryFilter === 'ALL' ? 'All Categories' : poCategoryFilter}
                      </span>
                      <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-300 uppercase">
                        Scope: {poOnlyLowStock ? 'Shortage Items Only' : 'Full Category List'}
                      </span>
                      <span>Total Items: {filteredPoItems.length}</span>
                    </div>
                  </div>

                  {/* Printable Items Table */}
                  {filteredPoItems.length === 0 ? (
                    <div className="p-12 text-center border-2 border-dashed border-slate-300 rounded-xl my-8">
                      <p className="text-sm font-bold text-slate-500">
                        No medicine items found matching category "<strong>{poCategoryFilter}</strong>" with selected stock filter options.
                      </p>
                      <p className="text-xs text-slate-400 mt-1">Try selecting "All Categories" or changing the stock scope.</p>
                    </div>
                  ) : poPrintLayout === '3col' ? (
                    /* 3-Column Grid Layout */
                    <table className="w-full text-left border-collapse border-2 border-black text-xs font-sans po-print-table">
                      <thead>
                        <tr>
                          <th colSpan={6} className="border border-black p-2 text-center font-bold text-xs bg-slate-50 uppercase text-black">
                            Purchase Order Requisition List ({filteredPoItems.length} Items)
                          </th>
                        </tr>
                        <tr className="bg-slate-100">
                          <th className="border border-black p-1.5 font-bold text-left w-[23%] text-black text-[10px]">MEDICINE NAME</th>
                          <th className="border border-black p-1.5 font-bold text-center w-[10.33%] text-black text-[10px]">REQ QTY</th>
                          <th className="border border-black p-1.5 font-bold text-left w-[23%] text-black text-[10px]">MEDICINE NAME</th>
                          <th className="border border-black p-1.5 font-bold text-center w-[10.33%] text-black text-[10px]">REQ QTY</th>
                          <th className="border border-black p-1.5 font-bold text-left w-[23%] text-black text-[10px]">MEDICINE NAME</th>
                          <th className="border border-black p-1.5 font-bold text-center w-[10.33%] text-black text-[10px]">REQ QTY</th>
                        </tr>
                      </thead>
                      <tbody>
                        {poRows.map((row, rIdx) => {
                          const getQtyStr = (itm: Item | null) => {
                            if (!itm) return '';
                            return (itm.ReorderQty !== undefined && itm.ReorderQty !== null)
                              ? itm.ReorderQty
                              : 0;
                          };
                          return (
                            <tr key={rIdx}>
                              <td className="border border-black px-2 py-1 font-medium text-left text-black">{row[0]?.ItemName || ''}</td>
                              <td className="border border-black px-2 py-1 font-bold text-center text-black bg-slate-50/50">
                                {getQtyStr(row[0])}
                              </td>

                              <td className="border border-black px-2 py-1 font-medium text-left text-black">{row[1]?.ItemName || ''}</td>
                              <td className="border border-black px-2 py-1 font-bold text-center text-black bg-slate-50/50">
                                {getQtyStr(row[1])}
                              </td>

                              <td className="border border-black px-2 py-1 font-medium text-left text-black">{row[2]?.ItemName || ''}</td>
                              <td className="border border-black px-2 py-1 font-bold text-center text-black bg-slate-50/50">
                                {getQtyStr(row[2])}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  ) : (
                    /* Full Detail List Layout */
                    <table className="w-full text-left border-collapse border-2 border-black text-xs font-sans po-print-table">
                      <thead>
                        <tr className="bg-slate-100">
                          <th className="border border-black p-1.5 font-bold text-center w-[6%] text-black text-[10px]">S.No</th>
                          <th className="border border-black p-1.5 font-bold text-center w-[12%] text-black text-[10px]">Item ID</th>
                          <th className="border border-black p-1.5 font-bold text-left w-[42%] text-black text-[10px]">Medicine Name</th>
                          <th className="border border-black p-1.5 font-bold text-center w-[12%] text-black text-[10px]">Category</th>
                          <th className="border border-black p-1.5 font-bold text-center w-[14%] text-black text-[10px]">Current Stock</th>
                          <th className="border border-black p-1.5 font-bold text-center w-[14%] text-black text-[10px]">Required Qty</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredPoItems.map((itm, idx) => {
                          const reorderQty = (itm.ReorderQty !== undefined && itm.ReorderQty !== null)
                            ? itm.ReorderQty
                            : 0;
                          return (
                            <tr key={`${itm.ItemID}-${idx}`}>
                              <td className="border border-black px-2 py-1 text-center font-bold text-slate-500">{idx + 1}</td>
                              <td className="border border-black px-2 py-1 text-center font-mono font-bold">{itm.ItemID}</td>
                              <td className="border border-black px-2 py-1 font-bold text-black">{itm.ItemName}</td>
                              <td className="border border-black px-2 py-1 text-center font-semibold">{itm.Unit || 'Tab'}</td>
                              <td className="border border-black px-2 py-1 text-center font-mono font-bold text-rose-700 bg-rose-50/30">{itm.CStock}</td>
                              <td className="border border-black px-2 py-1 text-center font-mono font-black text-indigo-900 bg-indigo-50/40">{reorderQty} {itm.Unit || 'Tab'}s</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}

                  {/* Footer Signatures */}
                  <div className="mt-12 flex justify-between items-center px-6 pt-4 border-t border-black text-xs font-bold text-black">
                    <div className="text-center w-48 border-t border-black pt-1 uppercase">
                      Prepared By (Pharmacy Manager)
                    </div>
                    <div className="text-center w-48 border-t border-black pt-1 uppercase">
                      Approved By (Clinic Administrator)
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer Controls */}
              <div className="p-3.5 bg-slate-100 border-t border-slate-200 flex flex-wrap justify-between items-center gap-2 text-xs text-slate-600 shrink-0 print:hidden no-print">
                <span className="text-[11px] font-semibold text-slate-500">
                  Tip: Click <strong>Open & Print in Pop-up</strong> to launch in a clean browser tab for laser printing.
                </span>
                <button
                  type="button"
                  onClick={() => setIsPOPrintPreviewOpen(false)}
                  className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl transition cursor-pointer shadow-sm"
                >
                  Close Print Dialog
                </button>
              </div>

            </div>
          </div>
        );
      })()}

      {/* Category Add & Edit Modal */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-4 bg-slate-900 text-white flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <Tag className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="text-base font-bold text-white">Medicine Category Manager</h3>
                  <p className="text-[11px] text-slate-300 font-medium">Add, Edit, Rename or Remove Medicine Categories</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsCategoryModalOpen(false);
                  setEditingCatIndex(null);
                  setCatErrorMsg('');
                  setCatSuccessMsg('');
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 overflow-y-auto flex-1">
              {/* Feedback messages */}
              {catSuccessMsg && (
                <div className="p-2.5 bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs rounded-lg font-bold flex items-center">
                  <CheckCircle className="w-4 h-4 text-emerald-600 mr-2 shrink-0" />
                  {catSuccessMsg}
                </div>
              )}
              {catErrorMsg && (
                <div className="p-2.5 bg-red-50 text-red-800 border border-red-200 text-xs rounded-lg font-bold flex items-center">
                  <AlertCircle className="w-4 h-4 text-red-600 mr-2 shrink-0" />
                  {catErrorMsg}
                </div>
              )}

              {/* Add New Category Form */}
              <form onSubmit={handleAddCategory} className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wide">
                  Add New Category
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newCatInput}
                    onChange={(e) => setNewCatInput(e.target.value)}
                    placeholder=""
                    className="flex-1 px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold bg-white text-slate-900"
                  />
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition cursor-pointer flex items-center shadow-xs shrink-0"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    <span>Add Category</span>
                  </button>
                </div>
              </form>

              {/* Categories List */}
              <div className="space-y-2">
                <div className="flex justify-between items-center px-1">
                  <span className="text-xs font-black text-slate-700 uppercase tracking-wider">
                    Existing Categories ({categories.length})
                  </span>
                  <button
                    type="button"
                    onClick={handleResetCategories}
                    className="text-[10px] font-bold text-slate-500 hover:text-indigo-600 underline cursor-pointer"
                  >
                    Reset to Defaults
                  </button>
                </div>

                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-white max-h-[300px] overflow-y-auto">
                  {categories.map((cat, idx) => {
                    const itemCount = items.filter(itm => (itm.Unit || '').toLowerCase().trim() === cat.toLowerCase().trim()).length;
                    const isEditing = editingCatIndex === idx;

                    return (
                      <div key={idx} className="p-2.5 flex items-center justify-between hover:bg-slate-50/80 transition">
                        {isEditing ? (
                          <div className="flex items-center space-x-2 w-full">
                            <input
                              type="text"
                              value={editingCatName}
                              onChange={(e) => setEditingCatName(e.target.value)}
                              className="flex-1 px-2 py-1 text-xs border border-indigo-400 rounded focus:outline-none font-bold text-slate-900 bg-indigo-50/50"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveEditCategory(idx);
                                if (e.key === 'Escape') setEditingCatIndex(null);
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => handleSaveEditCategory(idx)}
                              className="px-2.5 py-1 bg-indigo-600 text-white font-bold text-xs rounded hover:bg-indigo-700 cursor-pointer"
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingCatIndex(null)}
                              className="px-2 py-1 bg-slate-200 text-slate-700 font-bold text-xs rounded hover:bg-slate-300 cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center space-x-2 truncate">
                              <span className="text-xs font-extrabold text-slate-800">{cat}</span>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-100 text-slate-600">
                                {itemCount} {itemCount === 1 ? 'item' : 'items'}
                              </span>
                            </div>

                            <div className="flex items-center space-x-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingCatIndex(idx);
                                  setEditingCatName(cat);
                                }}
                                className="p-1 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded transition cursor-pointer"
                                title="Edit / Rename Category"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteCategory(idx)}
                                className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition cursor-pointer"
                                title="Delete Category"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setIsCategoryModalOpen(false);
                  setEditingCatIndex(null);
                  setCatErrorMsg('');
                  setCatSuccessMsg('');
                }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl transition cursor-pointer shadow-xs"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Multi-Batch & Expiry Lots Management Modal */}
      {isBatchesModalOpen && selectedBatchItem && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl overflow-hidden flex flex-col max-h-[92vh] animate-scaleUp">
            
            {/* Modal Header */}
            <div className="p-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center space-x-3 min-w-0">
                <div className="p-2.5 bg-indigo-500/20 text-indigo-300 rounded-xl border border-indigo-500/30 shrink-0">
                  <Boxes className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center space-x-2 flex-wrap">
                    <h3 className="text-base font-extrabold text-white truncate">
                      {selectedBatchItem.ItemName}
                    </h3>
                    <span className="px-2 py-0.5 bg-indigo-500/30 text-indigo-200 rounded-full font-mono text-[11px] font-bold border border-indigo-400/30">
                      ID: {selectedBatchItem.ItemID}
                    </span>
                    <span className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded-full text-[10px] font-bold">
                      {selectedBatchItem.Unit || 'Tab'} • {selectedBatchItem.MedicineType === 'C' ? 'Clinical' : 'Patent'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 font-medium mt-0.5">
                    Multi-Batch Tracking, Lot-by-Lot Expiry Dates & Automatic FEFO Stock Allocation
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3 shrink-0">
                <div className="text-right hidden sm:block bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Live Stock</div>
                  <div className="text-base font-black font-mono text-emerald-400">
                    {selectedBatchItem.CStock} {selectedBatchItem.Unit || 'Units'}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsBatchesModalOpen(false);
                    setSelectedBatchItem(null);
                    setEditingBatchId(null);
                  }}
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Notification messages */}
            {batchModalMsg && (
              <div className={`px-4 py-2 text-xs font-bold shrink-0 flex items-center ${
                batchModalMsg.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-b border-emerald-200' : 'bg-rose-50 text-rose-800 border-b border-rose-200'
              }`}>
                {batchModalMsg.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 mr-2 text-rose-600 shrink-0" />
                )}
                <span>{batchModalMsg.text}</span>
              </div>
            )}

            {/* Modal Body: 2-Column Grid */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 grid grid-cols-1 lg:grid-cols-12 gap-5 bg-slate-50/50">
              
              {/* Left Column: Batches Table (7 cols) */}
              <div className="lg:col-span-7 flex flex-col space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Boxes className="w-4 h-4 text-indigo-600" />
                    <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-800">
                      Active Stock Batches / Lots
                    </h4>
                  </div>
                  <span className="text-[11px] font-bold text-slate-500 font-mono">
                    {Array.isArray(selectedBatchItem.Batches) ? selectedBatchItem.Batches.length : (selectedBatchItem.ExpDate ? 1 : 0)} Recorded Lots
                  </span>
                </div>

                {/* Batches Table */}
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
                  {(() => {
                    const batchesList: ItemBatch[] = Array.isArray(selectedBatchItem.Batches) && selectedBatchItem.Batches.length > 0
                      ? selectedBatchItem.Batches
                      : (selectedBatchItem.CStock > 0 || selectedBatchItem.BatchNo || selectedBatchItem.ExpDate
                          ? [{
                              BatchID: `${selectedBatchItem.ItemID}-B-initial`,
                              ItemID: selectedBatchItem.ItemID,
                              ItemName: selectedBatchItem.ItemName,
                              BatchNo: selectedBatchItem.BatchNo || 'B# 001',
                              MfgDate: selectedBatchItem.MfgDate || '',
                              ExpDate: selectedBatchItem.ExpDate || '',
                              PurchasePrice: selectedBatchItem.PurchasePrice,
                              SalePrice: selectedBatchItem.Price,
                              Qty: selectedBatchItem.CStock,
                              InitialQty: selectedBatchItem.CStock,
                              Status: selectedBatchItem.CStock === 0 ? 'EXHAUSTED' : isBatchExpired(selectedBatchItem.ExpDate) ? 'EXPIRED' : 'ACTIVE',
                              CreatedAt: new Date().toISOString()
                            }]
                          : []);

                    if (batchesList.length === 0) {
                      return (
                        <div className="p-8 text-center text-slate-400 space-y-2">
                          <Boxes className="w-8 h-8 mx-auto text-slate-300" />
                          <p className="text-xs font-bold text-slate-600">No stock batches recorded yet for this medicine.</p>
                          <p className="text-[11px] text-slate-400">Use the form on the right to inward a new stock lot with its expiry date.</p>
                        </div>
                      );
                    }

                    // Sort by Expiry Date (FEFO)
                    const sortedBatches = [...batchesList].sort((a, b) => (a.ExpDate || '9999').localeCompare(b.ExpDate || '9999'));

                    return (
                      <div className="overflow-x-auto max-h-[360px] overflow-y-auto">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead className="bg-slate-100 text-slate-700 font-extrabold text-[10px] uppercase tracking-wider border-b border-slate-200 sticky top-0">
                            <tr>
                              <th className="px-3 py-2">Batch #</th>
                              <th className="px-2.5 py-2">Expiry Date</th>
                              <th className="px-2.5 py-2 text-right">Available Qty</th>
                              <th className="px-2.5 py-2 text-right">Cost (Rs)</th>
                              <th className="px-2.5 py-2 text-center">Status</th>
                              <th className="px-2.5 py-2 text-center">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-slate-800">
                            {sortedBatches.map((b, idx) => {
                              const isExp = isBatchExpired(b.ExpDate);
                              const isNearExp = isBatchNearExpiry(b.ExpDate, 90);
                              const isSelectedForEdit = editingBatchId === b.BatchID;

                              return (
                                <tr
                                  key={b.BatchID || idx}
                                  className={`transition hover:bg-slate-50 ${
                                    isSelectedForEdit
                                      ? 'bg-indigo-50/80 ring-1 ring-indigo-400'
                                      : isExp
                                      ? 'bg-rose-50/50'
                                      : isNearExp
                                      ? 'bg-amber-50/40'
                                      : 'bg-white'
                                  }`}
                                >
                                  {/* Batch # & Ref */}
                                  <td className="px-3 py-2 font-mono font-bold text-slate-900">
                                    <div>
                                      <span>{b.BatchNo || 'N/A'}</span>
                                      {b.GRNID && (
                                        <div className="text-[9px] font-sans font-medium text-slate-400">
                                          Ref: {b.GRNID}
                                        </div>
                                      )}
                                    </div>
                                  </td>

                                  {/* Expiry Date */}
                                  <td className="px-2.5 py-2">
                                    <div className="flex flex-col">
                                      <span className="font-mono font-bold text-slate-800">
                                        {b.ExpDate || 'Not set'}
                                      </span>
                                      {b.MfgDate && (
                                        <span className="text-[9px] text-slate-400 font-mono">
                                          Mfg: {b.MfgDate}
                                        </span>
                                      )}
                                    </div>
                                  </td>

                                  {/* Qty */}
                                  <td className="px-2.5 py-2 text-right font-mono font-extrabold text-slate-900">
                                    <span className={b.Qty === 0 ? 'text-slate-400' : 'text-emerald-700'}>
                                      {b.Qty}
                                    </span>
                                  </td>

                                  {/* Purchase Price */}
                                  <td className="px-2.5 py-2 text-right font-mono text-slate-700">
                                    {b.PurchasePrice !== undefined ? Number(b.PurchasePrice).toFixed(2) : '-'}
                                  </td>

                                  {/* Status Badge */}
                                  <td className="px-2.5 py-2 text-center">
                                    {b.Qty === 0 ? (
                                      <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[9px] font-bold">
                                        Exhausted
                                      </span>
                                    ) : isExp ? (
                                      <span className="px-1.5 py-0.5 bg-rose-100 text-rose-800 rounded text-[9px] font-black uppercase">
                                        🔴 Expired
                                      </span>
                                    ) : isNearExp ? (
                                      <span className="px-1.5 py-0.5 bg-amber-100 text-amber-900 rounded text-[9px] font-bold">
                                        🟡 &lt;90 Days
                                      </span>
                                    ) : (
                                      <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded text-[9px] font-bold">
                                        🟢 Active
                                      </span>
                                    )}
                                  </td>

                                  {/* Actions */}
                                  <td className="px-2.5 py-2 text-center">
                                    <div className="flex items-center justify-center space-x-1">
                                      <button
                                        type="button"
                                        onClick={() => handleStartEditBatch(b)}
                                        className="p-1 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded transition cursor-pointer"
                                        title="Edit Batch Parameters"
                                      >
                                        <Edit className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteBatch(b.BatchID)}
                                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition cursor-pointer"
                                        title="Delete Batch Lot"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    );
                  })()}
                </div>

                {/* FEFO Dispensing Note */}
                <div className="p-3 bg-indigo-50/70 border border-indigo-200/80 rounded-xl flex items-start space-x-2.5">
                  <div className="p-1.5 bg-indigo-600 text-white rounded-lg shrink-0 mt-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                  <div className="text-[11px] text-indigo-950 leading-relaxed font-medium">
                    <strong className="text-indigo-900">FEFO (First-Expired, First-Out) Automated Engine:</strong> When billing prescriptions or selling at POS, stock will automatically be consumed from the earliest expiring valid lot first. Expired stock lots are prevented from being dispensed.
                  </div>
                </div>
              </div>

              {/* Right Column: Inward / Edit Batch Form (5 cols) */}
              <div className="lg:col-span-5 bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
                    <div className="flex items-center space-x-2">
                      <div className={`p-1.5 rounded-lg ${editingBatchId ? 'bg-amber-100 text-amber-800' : 'bg-indigo-100 text-indigo-800'}`}>
                        <PlusCircle className="w-4 h-4" />
                      </div>
                      <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-900">
                        {editingBatchId ? 'Edit Selected Batch Lot' : 'Receive / Add New Stock Batch'}
                      </h4>
                    </div>
                    {editingBatchId && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingBatchId(null);
                          setBatchFormNo('');
                          setBatchFormExpDate('');
                          setBatchFormQty('');
                        }}
                        className="text-[11px] font-bold text-indigo-600 hover:underline cursor-pointer"
                      >
                        + New Batch
                      </button>
                    )}
                  </div>

                  <form id="save-batch-form" onSubmit={handleSaveBatch} className="space-y-3">
                    <div>
                      <label className="block text-[10px] font-extrabold text-slate-600 uppercase tracking-wider mb-1">
                        Batch # (Lot Number) *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. B-2026-002"
                        value={batchFormNo}
                        onChange={(e) => setBatchFormNo(e.target.value)}
                        className="w-full p-2 border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[10px] font-extrabold text-slate-600 uppercase tracking-wider mb-1">
                          Mfg Date
                        </label>
                        <input
                          type="date"
                          value={batchFormMfgDate}
                          onChange={(e) => setBatchFormMfgDate(e.target.value)}
                          className="w-full p-2 border border-slate-300 rounded-lg text-xs font-mono font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-extrabold text-rose-600 uppercase tracking-wider mb-1">
                          Expiry Date *
                        </label>
                        <input
                          type="date"
                          required
                          value={batchFormExpDate}
                          onChange={(e) => setBatchFormExpDate(e.target.value)}
                          className="w-full p-2 border border-rose-300 rounded-lg text-xs font-mono font-bold text-rose-950 focus:ring-2 focus:ring-rose-500 focus:outline-none bg-rose-50/30"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[10px] font-extrabold text-slate-600 uppercase tracking-wider mb-1">
                          Quantity in Batch *
                        </label>
                        <input
                          type="number"
                          min="0"
                          required
                          placeholder="e.g. 50"
                          value={batchFormQty}
                          onChange={(e) => setBatchFormQty(e.target.value === '' ? '' : Number(e.target.value))}
                          className="w-full p-2 border border-slate-300 rounded-lg text-xs font-mono font-black text-emerald-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-extrabold text-slate-600 uppercase tracking-wider mb-1">
                          Unit Cost (Rs.)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="Cost Price"
                          value={batchFormCost}
                          onChange={(e) => setBatchFormCost(e.target.value === '' ? '' : Number(e.target.value))}
                          className="w-full p-2 border border-slate-300 rounded-lg text-xs font-mono font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[10px] font-extrabold text-slate-600 uppercase tracking-wider mb-1">
                          Retail Price (Rs.)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="Sale Price"
                          value={batchFormSalePrice}
                          onChange={(e) => setBatchFormSalePrice(e.target.value === '' ? '' : Number(e.target.value))}
                          className="w-full p-2 border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-extrabold text-slate-600 uppercase tracking-wider mb-1">
                          PO / GRN Ref (Opt)
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. GRN-104"
                          value={batchFormPoGrnRef}
                          onChange={(e) => setBatchFormPoGrnRef(e.target.value)}
                          className="w-full p-2 border border-slate-300 rounded-lg text-xs font-mono font-medium text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  </form>
                </div>

                <div className="pt-4 border-t border-slate-200 mt-4 flex items-center justify-end space-x-2">
                  {editingBatchId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingBatchId(null);
                        setBatchFormNo('');
                        setBatchFormExpDate('');
                        setBatchFormQty('');
                      }}
                      className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
                    >
                      Cancel Edit
                    </button>
                  )}
                  <button
                    type="submit"
                    form="save-batch-form"
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-extrabold text-xs rounded-xl transition cursor-pointer shadow-md flex items-center space-x-1.5"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>{editingBatchId ? 'Update Batch' : 'Save Batch & Update Master Stock'}</span>
                  </button>
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-slate-100 border-t border-slate-200 flex justify-between items-center px-5">
              <div className="text-[11px] text-slate-500 font-medium">
                Medicine ID: <span className="font-mono font-bold text-slate-800">{selectedBatchItem.ItemID}</span> • Total Batches: <span className="font-mono font-bold text-slate-800">{Array.isArray(selectedBatchItem.Batches) ? selectedBatchItem.Batches.length : (selectedBatchItem.ExpDate ? 1 : 0)}</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsBatchesModalOpen(false);
                  setSelectedBatchItem(null);
                  setEditingBatchId(null);
                }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl transition cursor-pointer shadow-xs"
              >
                Close Manager
              </button>
            </div>
          </div>
        </div>
      )}

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
        clinicName={clinicSettings?.Name || 'Smart Clinic Pharmacy'}
      />

    </div>
  );
}
