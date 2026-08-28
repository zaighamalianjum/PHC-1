const fs = require('fs');
const path = require('path');

const src = fs.readFileSync('src/components/ErpDesk.tsx', 'utf8');
const lines = src.split('\n');

function getBlock(startLine, endLine) {
  return lines.slice(startLine - 1, endLine).join('\n');
}

// 1. RegisterEditVendorModal
const regVendorModal = `import React from 'react';
import { Building2, X } from 'lucide-react';
import { ErpVendor } from '../../types';

interface RegisterEditVendorModalProps {
  showVendorModal: boolean;
  setShowVendorModal: (show: boolean) => void;
  editingVendor: ErpVendor | null;
  setEditingVendor: (v: ErpVendor | null) => void;
  vendorForm: Partial<ErpVendor>;
  setVendorForm: (form: any) => void;
  handleSaveVendor: (e: React.FormEvent) => void;
  isSubmitting: boolean;
  vendors: ErpVendor[];
  handleOpenEditVendor: (v: ErpVendor) => void;
}

export const RegisterEditVendorModal: React.FC<RegisterEditVendorModalProps> = ({
  showVendorModal,
  setShowVendorModal,
  editingVendor,
  setEditingVendor,
  vendorForm,
  setVendorForm,
  handleSaveVendor,
  isSubmitting,
  vendors,
  handleOpenEditVendor,
}) => {
  if (!showVendorModal) return null;
  return (
${getBlock(8301, 8513)}
  );
};

export default RegisterEditVendorModal;
`;
fs.writeFileSync('src/components/erp/modals/RegisterEditVendorModal.tsx', regVendorModal, 'utf8');

// 2. QuickAddMedicineModal
const quickAddMedModal = `import React from 'react';
import { Plus, Edit, X, Save } from 'lucide-react';

interface QuickAddMedicineModalProps {
  showQuickAddMedModal: boolean;
  setShowQuickAddMedModal: (show: boolean) => void;
  quickAddMedForm: any;
  setQuickAddMedForm: (form: any) => void;
  isCustomCategory: boolean;
  setIsCustomCategory: (val: boolean) => void;
  customCategoryName: string;
  setCustomCategoryName: (val: string) => void;
  medicineCategories: string[];
  handleSaveQuickMedicine: (e: React.FormEvent) => void;
}

export const QuickAddMedicineModal: React.FC<QuickAddMedicineModalProps> = ({
  showQuickAddMedModal,
  setShowQuickAddMedModal,
  quickAddMedForm,
  setQuickAddMedForm,
  isCustomCategory,
  setIsCustomCategory,
  customCategoryName,
  setCustomCategoryName,
  medicineCategories,
  handleSaveQuickMedicine,
}) => {
  if (!showQuickAddMedModal) return null;
  return (
${getBlock(9397, 9658)}
  );
};

export default QuickAddMedicineModal;
`;
fs.writeFileSync('src/components/erp/modals/QuickAddMedicineModal.tsx', quickAddMedModal, 'utf8');

// 3. BulkPoUploadModal
const bulkPoUploadModal = `import React from 'react';
import { FileSpreadsheet, Plus, X, AlertCircle } from 'lucide-react';
import { ErpVendor } from '../../types';

interface BulkPoUploadModalProps {
  showUploadBulkPoModal: boolean;
  setShowUploadBulkPoModal: (show: boolean) => void;
  bulkPoPasteText: string;
  setBulkPoPasteText: (val: string) => void;
  bulkPoError: string | null;
  bulkPoParsedRows: any[];
  handleBulkPoPasteProcess: (text: string) => void;
  handleBulkPoFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleApplyBulkPoToCurrentPo: () => void;
  poForm: any;
  vendors: ErpVendor[];
}

export const BulkPoUploadModal: React.FC<BulkPoUploadModalProps> = ({
  showUploadBulkPoModal,
  setShowUploadBulkPoModal,
  bulkPoPasteText,
  setBulkPoPasteText,
  bulkPoError,
  bulkPoParsedRows,
  handleBulkPoPasteProcess,
  handleBulkPoFileUpload,
  handleApplyBulkPoToCurrentPo,
  poForm,
  vendors,
}) => {
  if (!showUploadBulkPoModal) return null;
  return (
${getBlock(9662, 9922)}
  );
};

export default BulkPoUploadModal;
`;
fs.writeFileSync('src/components/erp/modals/BulkPoUploadModal.tsx', bulkPoUploadModal, 'utf8');

// 4. BulkGrnUploadModal
const bulkGrnUploadModal = `import React from 'react';
import { FileSpreadsheet, PackageCheck, X, AlertCircle, Plus } from 'lucide-react';
import { ErpVendor } from '../../types';

interface BulkGrnUploadModalProps {
  showUploadBulkGrnModal: boolean;
  setShowUploadBulkGrnModal: (show: boolean) => void;
  bulkGrnPasteText: string;
  setBulkGrnPasteText: (val: string) => void;
  bulkGrnError: string | null;
  bulkGrnParsedRows: any[];
  handleBulkGrnPasteProcess: (text: string) => void;
  handleBulkGrnFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleApplyBulkGrnToCurrentGrn: () => void;
  grnForm: any;
  vendors: ErpVendor[];
}

export const BulkGrnUploadModal: React.FC<BulkGrnUploadModalProps> = ({
  showUploadBulkGrnModal,
  setShowUploadBulkGrnModal,
  bulkGrnPasteText,
  setBulkGrnPasteText,
  bulkGrnError,
  bulkGrnParsedRows,
  handleBulkGrnPasteProcess,
  handleBulkGrnFileUpload,
  handleApplyBulkGrnToCurrentGrn,
  grnForm,
  vendors,
}) => {
  if (!showUploadBulkGrnModal) return null;
  return (
${getBlock(9926, 10271)}
  );
};

export default BulkGrnUploadModal;
`;
fs.writeFileSync('src/components/erp/modals/BulkGrnUploadModal.tsx', bulkGrnUploadModal, 'utf8');

// 5. UnmatchedCategoryDialog
const unmatchedCategoryDialog = `import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface UnmatchedCategoryDialogProps {
  unmatchedCategoryDialog: {
    isOpen: boolean;
    unmatchedList: Array<{
      category: string;
      itemCount: number;
      action: 'add_new' | 'map';
      targetCategory?: string;
    }>;
    context: 'po' | 'grn';
  } | null;
  setUnmatchedCategoryDialog: React.Dispatch<React.SetStateAction<{
    isOpen: boolean;
    unmatchedList: Array<{
      category: string;
      itemCount: number;
      action: 'add_new' | 'map';
      targetCategory?: string;
    }>;
    context: 'po' | 'grn';
  } | null>>;
  medicineCategories: string[];
  handleConfirmUnmatchedCategories: () => void;
}

export const UnmatchedCategoryDialog: React.FC<UnmatchedCategoryDialogProps> = ({
  unmatchedCategoryDialog,
  setUnmatchedCategoryDialog,
  medicineCategories,
  handleConfirmUnmatchedCategories,
}) => {
  if (!unmatchedCategoryDialog?.isOpen) return null;
  return (
${getBlock(10275, 10444)}
  );
};

export default UnmatchedCategoryDialog;
`;
fs.writeFileSync('src/components/erp/modals/UnmatchedCategoryDialog.tsx', unmatchedCategoryDialog, 'utf8');

// 6. GrnModal
const grnModalContent = `import React from 'react';
import { PackageCheck, X, Plus, Trash2, RotateCcw } from 'lucide-react';
import { ErpVendor, ErpPurchaseOrder, ErpGrnItem } from '../../types';

interface GrnModalProps {
  showGrnModal: boolean;
  setShowGrnModal: (show: boolean) => void;
  grnForm: any;
  setGrnForm: (form: any) => void;
  vendors: ErpVendor[];
  purchaseOrders: ErpPurchaseOrder[];
  selectedPoForGrn: ErpPurchaseOrder | null;
  handleSaveGrn: (e: React.FormEvent) => void;
  isSubmitting: boolean;
  grnItemsState: ErpGrnItem[];
  handleGrnItemChange: (idx: number, field: keyof ErpGrnItem, val: any) => void;
  handleRemoveGrnItem: (idx: number) => void;
  handleAddExtraGrnItem: () => void;
  totalGrnAmount: number;
  totalGrnItemsReceivedQty: number;
  setShowUploadBulkGrnModal: (show: boolean) => void;
  getMedicinePriceInfo: (med: any, vendorName?: string, vendorId?: string) => any;
  medicineMasterStock: any[];
}

export const GrnModal: React.FC<GrnModalProps> = ({
  showGrnModal,
  setShowGrnModal,
  grnForm,
  setGrnForm,
  vendors,
  purchaseOrders,
  selectedPoForGrn,
  handleSaveGrn,
  isSubmitting,
  grnItemsState,
  handleGrnItemChange,
  handleRemoveGrnItem,
  handleAddExtraGrnItem,
  totalGrnAmount,
  totalGrnItemsReceivedQty,
  setShowUploadBulkGrnModal,
  getMedicinePriceInfo,
  medicineMasterStock,
}) => {
  if (!showGrnModal) return null;
  return (
${getBlock(10448, 10829)}
  );
};

export default GrnModal;
`;
fs.writeFileSync('src/components/erp/modals/GrnModal.tsx', grnModalContent, 'utf8');

// 7. TransactionModal
const transactionModalContent = `import React from 'react';
import { Receipt, X } from 'lucide-react';
import { ErpVendor } from '../../types';

interface TransactionModalProps {
  showTxnModal: boolean;
  setShowTxnModal: (show: boolean) => void;
  txnForm: any;
  setTxnForm: (form: any) => void;
  vendors: ErpVendor[];
  handleSaveTransaction: (e: React.FormEvent) => void;
  isSubmitting: boolean;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  showTxnModal,
  setShowTxnModal,
  txnForm,
  setTxnForm,
  vendors,
  handleSaveTransaction,
  isSubmitting,
}) => {
  if (!showTxnModal) return null;
  return (
${getBlock(10833, 10999)}
  );
};

export default TransactionModal;
`;
fs.writeFileSync('src/components/erp/modals/TransactionModal.tsx', transactionModalContent, 'utf8');

// 8. EmployeeModal
const employeeModalContent = `import React from 'react';
import { UserPlus, X } from 'lucide-react';
import { ErpEmployee } from '../../types';

interface EmployeeModalProps {
  showEmpModal: boolean;
  setShowEmpModal: (show: boolean) => void;
  empForm: Partial<ErpEmployee>;
  setEmpForm: (form: any) => void;
  handleSaveEmployee: (e: React.FormEvent) => void;
  isSubmitting: boolean;
}

export const EmployeeModal: React.FC<EmployeeModalProps> = ({
  showEmpModal,
  setShowEmpModal,
  empForm,
  setEmpForm,
  handleSaveEmployee,
  isSubmitting,
}) => {
  if (!showEmpModal) return null;
  return (
${getBlock(11003, 11084)}
  );
};

export default EmployeeModal;
`;
fs.writeFileSync('src/components/erp/modals/EmployeeModal.tsx', employeeModalContent, 'utf8');

// 9. PayrollModal
const payrollModalContent = `import React from 'react';
import { DollarSign, X } from 'lucide-react';
import { ErpEmployee } from '../../types';

interface PayrollModalProps {
  showPayrollModal: boolean;
  setShowPayrollModal: (show: boolean) => void;
  payrollForm: any;
  setPayrollForm: (form: any) => void;
  employees: ErpEmployee[];
  handleSavePayroll: (e: React.FormEvent) => void;
  isSubmitting: boolean;
}

export const PayrollModal: React.FC<PayrollModalProps> = ({
  showPayrollModal,
  setShowPayrollModal,
  payrollForm,
  setPayrollForm,
  employees,
  handleSavePayroll,
  isSubmitting,
}) => {
  if (!showPayrollModal) return null;
  return (
${getBlock(11088, 11175)}
  );
};

export default PayrollModal;
`;
fs.writeFileSync('src/components/erp/modals/PayrollModal.tsx', payrollModalContent, 'utf8');

// 10. ExpenseModal
const expenseModalContent = `import React from 'react';
import { Receipt, X, Plus, Edit, Trash2, Save } from 'lucide-react';
import { ErpExpense } from '../../types';

interface ExpenseModalProps {
  showExpenseModal: boolean;
  setShowExpenseModal: (show: boolean) => void;
  expenseForm: Partial<ErpExpense>;
  setExpenseForm: (form: any) => void;
  handleSaveExpense: (e: React.FormEvent) => void;
  isSubmitting: boolean;
  showAddCategoryInput: boolean;
  setShowAddCategoryInput: (show: boolean) => void;
  newCategoryName: string;
  setNewCategoryName: (name: string) => void;
  handleSaveNewCategory: () => void;
  customExpenseCategories: string[];
  editingCategoryName: string | null;
  setEditingCategoryName: (name: string | null) => void;
  editCategoryNewValue: string;
  setEditCategoryNewValue: (val: string) => void;
  handleUpdateCustomCategory: (oldVal: string) => void;
  handleDeleteCustomCategory: (cat: string) => void;
  allExpenseCategories: string[];
  DEFAULT_EXPENSE_CATEGORIES: string[];
}

export const ExpenseModal: React.FC<ExpenseModalProps> = ({
  showExpenseModal,
  setShowExpenseModal,
  expenseForm,
  setExpenseForm,
  handleSaveExpense,
  isSubmitting,
  showAddCategoryInput,
  setShowAddCategoryInput,
  newCategoryName,
  setNewCategoryName,
  handleSaveNewCategory,
  customExpenseCategories,
  editingCategoryName,
  setEditingCategoryName,
  editCategoryNewValue,
  setEditCategoryNewValue,
  handleUpdateCustomCategory,
  handleDeleteCustomCategory,
  allExpenseCategories,
  DEFAULT_EXPENSE_CATEGORIES,
}) => {
  if (!showExpenseModal) return null;
  return (
${getBlock(11179, 11415)}
  );
};

export default ExpenseModal;
`;
fs.writeFileSync('src/components/erp/modals/ExpenseModal.tsx', expenseModalContent, 'utf8');

// 11. AssetModal
const assetModalContent = `import React from 'react';
import { Boxes, X } from 'lucide-react';
import { ErpAsset } from '../../types';

interface AssetModalProps {
  showAssetModal: boolean;
  setShowAssetModal: (show: boolean) => void;
  assetForm: Partial<ErpAsset>;
  setAssetForm: (form: any) => void;
  handleSaveAsset: (e: React.FormEvent) => void;
  isSubmitting: boolean;
}

export const AssetModal: React.FC<AssetModalProps> = ({
  showAssetModal,
  setShowAssetModal,
  assetForm,
  setAssetForm,
  handleSaveAsset,
  isSubmitting,
}) => {
  if (!showAssetModal) return null;
  return (
${getBlock(11419, 11484)}
  );
};

export default AssetModal;
`;
fs.writeFileSync('src/components/erp/modals/AssetModal.tsx', assetModalContent, 'utf8');

// 12. VendorPrintStatementModal
const vendorPrintModalContent = `import React from 'react';
import { Printer, X } from 'lucide-react';
import { ErpVendor, ClinicSettings } from '../../types';

interface VendorPrintStatementModalProps {
  vendorPrintModalOpen: boolean;
  setVendorPrintModalOpen: (open: boolean) => void;
  selectedVendor: ErpVendor | null;
  vendorStatement: any;
  clinicSettings?: ClinicSettings;
  handlePrintVendorStatement: (targetVendor?: ErpVendor) => void;
}

export const VendorPrintStatementModal: React.FC<VendorPrintStatementModalProps> = ({
  vendorPrintModalOpen,
  setVendorPrintModalOpen,
  selectedVendor,
  vendorStatement,
  clinicSettings,
  handlePrintVendorStatement,
}) => {
  if (!vendorPrintModalOpen || !selectedVendor) return null;
  return (
${getBlock(11488, 11716)}
  );
};

export default VendorPrintStatementModal;
`;
fs.writeFileSync('src/components/erp/modals/VendorPrintStatementModal.tsx', vendorPrintModalContent, 'utf8');

// 13. PayVendorModal
const payVendorModalContent = `import React from 'react';
import { DollarSign, Printer, X, History } from 'lucide-react';
import { ErpVendor, ErpPurchaseOrder, ErpGrn, ErpTransaction } from '../../types';

interface PayVendorModalProps {
  payVendorModalData: {
    vendor: ErpVendor;
    poId?: string;
    invNo?: string;
    amount?: number;
    paymentMethod?: 'Cash' | 'Bank Transfer' | 'Cheque' | 'Online/Card';
    date?: string;
    description?: string;
  } | null;
  setPayVendorModalData: (data: any) => void;
  purchaseOrders: ErpPurchaseOrder[];
  grns: ErpGrn[];
  transactions: ErpTransaction[];
  setPoHistoryFilterPo: (val: string) => void;
  setPoHistoryModalData: (data: any) => void;
  handlePrintVendorStatement: (targetVendor?: ErpVendor) => void;
  handleSavePayVendorBill: (e: React.FormEvent) => void;
  isSubmitting: boolean;
}

export const PayVendorModal: React.FC<PayVendorModalProps> = ({
  payVendorModalData,
  setPayVendorModalData,
  purchaseOrders,
  grns,
  transactions,
  setPoHistoryFilterPo,
  setPoHistoryModalData,
  handlePrintVendorStatement,
  handleSavePayVendorBill,
  isSubmitting,
}) => {
  if (!payVendorModalData) return null;
  return (
${getBlock(11720, 12173)}
  );
};

export default PayVendorModal;
`;
fs.writeFileSync('src/components/erp/modals/PayVendorModal.tsx', payVendorModalContent, 'utf8');

// 14. VendorPurchaseOrdersModal
const vendorPoModalContent = `import React from 'react';
import { ShoppingCart, Plus, X, Printer, Edit, DollarSign } from 'lucide-react';
import { ErpVendor, ErpPurchaseOrder, ErpGrn, ErpTransaction } from '../../types';

interface VendorPurchaseOrdersModalProps {
  vendorPoModalData: ErpVendor | null;
  setVendorPoModalData: (v: ErpVendor | null) => void;
  purchaseOrders: ErpPurchaseOrder[];
  grns: ErpGrn[];
  transactions: ErpTransaction[];
  handleOpenNewPoModal: (targetVendor?: ErpVendor) => void;
  handleOpenEditPoModal: (po: ErpPurchaseOrder) => void;
  handlePrintPo: (po: ErpPurchaseOrder) => void;
  setPayVendorModalData: (data: any) => void;
  setPoHistoryFilterPo: (val: string) => void;
  setPoHistoryModalData: (data: any) => void;
  isPoStockReceivedOrLocked: (po: ErpPurchaseOrder) => boolean;
}

export const VendorPurchaseOrdersModal: React.FC<VendorPurchaseOrdersModalProps> = ({
  vendorPoModalData,
  setVendorPoModalData,
  purchaseOrders,
  grns,
  transactions,
  handleOpenNewPoModal,
  handleOpenEditPoModal,
  handlePrintPo,
  setPayVendorModalData,
  setPoHistoryFilterPo,
  setPoHistoryModalData,
  isPoStockReceivedOrLocked,
}) => {
  if (!vendorPoModalData) return null;
  return (
${getBlock(12177, 12371)}
  );
};

export default VendorPurchaseOrdersModal;
`;
fs.writeFileSync('src/components/erp/modals/VendorPurchaseOrdersModal.tsx', vendorPoModalContent, 'utf8');

// 15. PoPaymentHistoryModal
const poHistoryModalContent = `import React from 'react';
import { History, X, Printer, DollarSign } from 'lucide-react';
import { ErpVendor, ErpPurchaseOrder, ErpGrn, ErpTransaction } from '../../types';

interface PoPaymentHistoryModalProps {
  poHistoryModalData: {
    vendor: ErpVendor;
    poId?: string;
  } | null;
  setPoHistoryModalData: (data: any) => void;
  poHistoryFilterPo: string;
  setPoHistoryFilterPo: (val: string) => void;
  purchaseOrders: ErpPurchaseOrder[];
  grns: ErpGrn[];
  transactions: ErpTransaction[];
  handlePrintVendorStatement: (targetVendor?: ErpVendor) => void;
  setPayVendorModalData: (data: any) => void;
  handlePrintSinglePaymentVoucher: (pt: any, vendor: ErpVendor) => void;
}

export const PoPaymentHistoryModal: React.FC<PoPaymentHistoryModalProps> = ({
  poHistoryModalData,
  setPoHistoryModalData,
  poHistoryFilterPo,
  setPoHistoryFilterPo,
  purchaseOrders,
  grns,
  transactions,
  handlePrintVendorStatement,
  setPayVendorModalData,
  handlePrintSinglePaymentVoucher,
}) => {
  if (!poHistoryModalData) return null;
  return (
${getBlock(12375, 12603)}
  );
};

export default PoPaymentHistoryModal;
`;
fs.writeFileSync('src/components/erp/modals/PoPaymentHistoryModal.tsx', poHistoryModalContent, 'utf8');

// 16. VendorPaymentHistoryStandaloneModal
const vendorPaymentHistoryStandaloneModalContent = `import React from 'react';
import { History, X, Printer, Plus, CreditCard } from 'lucide-react';
import { ErpVendor, ErpTransaction } from '../../types';

interface VendorPaymentHistoryStandaloneModalProps {
  showPaymentHistoryModal: boolean;
  setShowPaymentHistoryModal: (show: boolean) => void;
  paymentHistoryVendorFilter: string;
  setPaymentHistoryVendorFilter: (val: string) => void;
  vendors: ErpVendor[];
  transactions: ErpTransaction[];
  setPayVendorModalData: (data: any) => void;
  handlePrintSinglePaymentVoucher: (pt: any, vendor: ErpVendor) => void;
}

export const VendorPaymentHistoryStandaloneModal: React.FC<VendorPaymentHistoryStandaloneModalProps> = ({
  showPaymentHistoryModal,
  setShowPaymentHistoryModal,
  paymentHistoryVendorFilter,
  setPaymentHistoryVendorFilter,
  vendors,
  transactions,
  setPayVendorModalData,
  handlePrintSinglePaymentVoucher,
}) => {
  if (!showPaymentHistoryModal) return null;
  return (
${getBlock(12607, 12793)}
  );
};

export default VendorPaymentHistoryStandaloneModal;
`;
fs.writeFileSync('src/components/erp/modals/VendorPaymentHistoryStandaloneModal.tsx', vendorPaymentHistoryStandaloneModalContent, 'utf8');

// 17. WhatsAppPoModal
const whatsAppPoModalContent = `import React from 'react';
import { ShoppingCart, X, Printer } from 'lucide-react';
import { WhatsAppIcon } from '../erpUtils';
import { ErpPurchaseOrder, ErpVendor } from '../../types';

interface WhatsAppPoModalProps {
  showWhatsAppPoModal: boolean;
  setShowWhatsAppPoModal: (show: boolean) => void;
  selectedPoForWhatsApp: ErpPurchaseOrder | null;
  whatsAppVendorPhone: string;
  setWhatsAppVendorPhone: (phone: string) => void;
  whatsAppCustomPoNotes: string;
  setWhatsAppCustomPoNotes: (notes: string) => void;
  whatsAppIncludePrices: boolean;
  setWhatsAppIncludePrices: (inc: boolean) => void;
  whatsAppPoTextPreview: string;
  handleSendPoWhatsApp: (withPrint?: boolean) => void;
}

export const WhatsAppPoModal: React.FC<WhatsAppPoModalProps> = ({
  showWhatsAppPoModal,
  setShowWhatsAppPoModal,
  selectedPoForWhatsApp,
  whatsAppVendorPhone,
  setWhatsAppVendorPhone,
  whatsAppCustomPoNotes,
  setWhatsAppCustomPoNotes,
  whatsAppIncludePrices,
  setWhatsAppIncludePrices,
  whatsAppPoTextPreview,
  handleSendPoWhatsApp,
}) => {
  if (!showWhatsAppPoModal || !selectedPoForWhatsApp) return null;
  return (
${getBlock(12834, 12965)}
  );
};

export default WhatsAppPoModal;
`;
fs.writeFileSync('src/components/erp/modals/WhatsAppPoModal.tsx', whatsAppPoModalContent, 'utf8');

// 18. PurchaseOrderModal
const purchaseOrderModalContent = `import React from 'react';
import {
  ShoppingCart, Building2, Calendar, FileSpreadsheet, Plus,
  Search, Filter, Edit, Trash2, CheckCircle2, ChevronLeft,
  ChevronRight, ChevronsLeft, ChevronsRight, X
} from 'lucide-react';
import { ErpVendor, ErpPurchaseOrder } from '../../types';

interface PurchaseOrderModalProps {
  showPoModal: boolean;
  setShowPoModal: (show: boolean) => void;
  editingPurchaseOrder: ErpPurchaseOrder | null;
  poForm: any;
  setPoForm: (form: any) => void;
  vendors: ErpVendor[];
  handleOpenAddVendor: () => void;
  medicineSearchTerm: string;
  setMedicineSearchTerm: (term: string) => void;
  poCategoryFilter: string;
  setPoCategoryFilter: (cat: string) => void;
  medicineFilterMode: 'all' | 'low_stock' | 'selected';
  setMedicineFilterMode: (mode: 'all' | 'low_stock' | 'selected') => void;
  poGridPageSize: number;
  setPoGridPageSize: (size: number) => void;
  poGridPage: number;
  setPoGridPage: (page: number | ((p: number) => number)) => void;
  medicineCategories: string[];
  setShowUploadBulkPoModal: (show: boolean) => void;
  handleOpenQuickAddMedicineModal: (existingItem?: any) => void;
  pagedMedicines: any[];
  totalPoMedicinePages: number;
  filteredCatalogMedicines: any[];
  allCatalogMedicines: any[];
  isMedicineSelectedInPo: (itemId: string, itemName: string) => boolean;
  getMedicineItemCategory: (item: any) => string;
  getMedicinePriceInfo: (med: any, vendorName?: string, vendorId?: string) => any;
  getRequiredQty: (item: any) => number;
  handleToggleMedicineInPo: (med: any) => void;
  handlePoItemChange: (idx: number, field: string, val: any) => void;
  handleRemovePoItem: (idx: number) => void;
  totalPoAmount: number;
  totalPoRequisitionQty: number;
  handleSavePurchaseOrder: (e: React.FormEvent) => void;
  isSubmitting: boolean;
}

export const PurchaseOrderModal: React.FC<PurchaseOrderModalProps> = ({
  showPoModal,
  setShowPoModal,
  editingPurchaseOrder,
  poForm,
  setPoForm,
  vendors,
  handleOpenAddVendor,
  medicineSearchTerm,
  setMedicineSearchTerm,
  poCategoryFilter,
  setPoCategoryFilter,
  medicineFilterMode,
  setMedicineFilterMode,
  poGridPageSize,
  setPoGridPageSize,
  poGridPage,
  setPoGridPage,
  medicineCategories,
  setShowUploadBulkPoModal,
  handleOpenQuickAddMedicineModal,
  pagedMedicines,
  totalPoMedicinePages,
  filteredCatalogMedicines,
  allCatalogMedicines,
  isMedicineSelectedInPo,
  getMedicineItemCategory,
  getMedicinePriceInfo,
  getRequiredQty,
  handleToggleMedicineInPo,
  handlePoItemChange,
  handleRemovePoItem,
  totalPoAmount,
  totalPoRequisitionQty,
  handleSavePurchaseOrder,
  isSubmitting,
}) => {
  if (!showPoModal) return null;
  return (
${getBlock(8518, 9393)}
  );
};

export default PurchaseOrderModal;
`;
fs.writeFileSync('src/components/erp/modals/PurchaseOrderModal.tsx', purchaseOrderModalContent, 'utf8');

console.log('All 18 modals generated successfully!');
