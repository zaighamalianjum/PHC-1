const fs = require('fs');
const path = require('path');

const src = fs.readFileSync('src/components/ErpDesk.tsx', 'utf8');
const lines = src.split('\n');

function getBlock(startLine, endLine) {
  return lines.slice(startLine - 1, endLine).join('\n');
}

// 1. OverviewTab
const overviewTabContent = `import React from 'react';
import {
  Building2, Users, ShoppingCart, DollarSign, Plus, CheckCircle2,
  TrendingUp, TrendingDown, FileSpreadsheet, PackageCheck,
  CreditCard, UserPlus, FileText, Boxes, ArrowUpRight, ArrowDownRight, Wallet, History
} from 'lucide-react';
import {
  ErpVendor, ErpPurchaseOrder, ErpGrn, ErpTransaction,
  ErpEmployee, ErpPayroll, ErpExpense, ErpAsset
} from '../../types';

interface OverviewTabProps {
  vendors: ErpVendor[];
  purchaseOrders: ErpPurchaseOrder[];
  grns: ErpGrn[];
  transactions: ErpTransaction[];
  employees: ErpEmployee[];
  payrolls: ErpPayroll[];
  expenses: ErpExpense[];
  assets: ErpAsset[];
  cashBookMetrics: any;
  setActiveTab: (tab: any) => void;
  handleOpenAddVendor: () => void;
  handleOpenNewPoModal: (targetVendor?: ErpVendor) => void;
  handleOpenGrnForPo: (targetPo?: ErpPurchaseOrder) => void;
  setShowTxnModal: (show: boolean) => void;
  setShowExpenseModal: (show: boolean) => void;
  setShowEmpModal: (show: boolean) => void;
  setShowPayrollModal: (show: boolean) => void;
  setShowAssetModal: (show: boolean) => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  vendors,
  purchaseOrders,
  grns,
  transactions,
  employees,
  payrolls,
  expenses,
  assets,
  cashBookMetrics,
  setActiveTab,
  handleOpenAddVendor,
  handleOpenNewPoModal,
  handleOpenGrnForPo,
  setShowTxnModal,
  setShowExpenseModal,
  setShowEmpModal,
  setShowPayrollModal,
  setShowAssetModal,
}) => {
  return (
${getBlock(6246, 6569)}
  );
};

export default OverviewTab;
`;
fs.writeFileSync('src/components/erp/tabs/OverviewTab.tsx', overviewTabContent, 'utf8');

// 2. FiscalCalendarTab
const fiscalCalendarTabContent = `import React from 'react';
import FiscalCalendarDesk from '../FiscalCalendarDesk';
import { ClinicSettings } from '../../types';

interface FiscalCalendarTabProps {
  clinicSettings?: ClinicSettings;
}

export const FiscalCalendarTab: React.FC<FiscalCalendarTabProps> = ({ clinicSettings }) => {
  return (
    <div className="space-y-6">
      <FiscalCalendarDesk clinicSettings={clinicSettings} />
    </div>
  );
};

export default FiscalCalendarTab;
`;
fs.writeFileSync('src/components/erp/tabs/FiscalCalendarTab.tsx', fiscalCalendarTabContent, 'utf8');

// 3. CashBookPnlTab
const cashBookPnlTabContent = `import React from 'react';
import {
  DollarSign, Printer, ArrowUpRight, ArrowDownRight, TrendingUp,
  Search, Calendar, Filter, Plus
} from 'lucide-react';
import { DEFAULT_EXPENSE_CATEGORIES } from '../erpUtils';

interface CashBookPnlTabProps {
  cashBookDateFilter: 'today' | 'this_week' | 'this_month' | 'fiscal_month' | 'fiscal_year' | 'custom';
  setCashBookDateFilter: (val: any) => void;
  cashBookStartDate: string;
  setCashBookStartDate: (val: string) => void;
  cashBookEndDate: string;
  setCashBookEndDate: (val: string) => void;
  cashBookCategoryFilter: string;
  setCashBookCategoryFilter: (val: any) => void;
  cashBookSearch: string;
  setCashBookSearch: (val: string) => void;
  selectedFiscalYear: string;
  handleFiscalYearSelect: (val: string) => void;
  selectedFiscalMonth: string;
  handleFiscalMonthSelect: (val: string) => void;
  fiscalYearOptions: any[];
  monthOptions: any[];
  handleQuickPresetChange: (preset: any) => void;
  cashBookMetrics: any;
  filteredCashBookEntries: any[];
  quickOutflowForm: any;
  setQuickOutflowForm: (val: any) => void;
  handleQuickOutflowSubmit: (e: React.FormEvent) => void;
  isSubmitting: boolean;
  handlePrintCashBookReport: () => void;
  customExpenseCategories: string[];
}

export const CashBookPnlTab: React.FC<CashBookPnlTabProps> = ({
  cashBookDateFilter,
  setCashBookDateFilter,
  cashBookStartDate,
  setCashBookStartDate,
  cashBookEndDate,
  setCashBookEndDate,
  cashBookCategoryFilter,
  setCashBookCategoryFilter,
  cashBookSearch,
  setCashBookSearch,
  selectedFiscalYear,
  handleFiscalYearSelect,
  selectedFiscalMonth,
  handleFiscalMonthSelect,
  fiscalYearOptions,
  monthOptions,
  handleQuickPresetChange,
  cashBookMetrics,
  filteredCashBookEntries,
  quickOutflowForm,
  setQuickOutflowForm,
  handleQuickOutflowSubmit,
  isSubmitting,
  handlePrintCashBookReport,
  customExpenseCategories,
}) => {
  return (
${getBlock(6590, 6962)}
  );
};

export default CashBookPnlTab;
`;
fs.writeFileSync('src/components/erp/tabs/CashBookPnlTab.tsx', cashBookPnlTabContent, 'utf8');

// 4. VendorsTab
const vendorsTabContent = `import React from 'react';
import {
  Building2, Search, Filter, Plus, Edit, Trash2,
  FileSpreadsheet, CreditCard, Receipt, Printer
} from 'lucide-react';
import { ErpVendor } from '../../types';

interface VendorsTabProps {
  vendors: ErpVendor[];
  searchTerm: string;
  setSearchTerm: (val: string) => void;
  filterCategory: string;
  setFilterCategory: (val: string) => void;
  handleOpenAddVendor: () => void;
  handleOpenEditVendor: (v: ErpVendor) => void;
  handleDeleteVendor: (v: ErpVendor) => void;
  handleOpenNewPoModal: (targetVendor?: ErpVendor) => void;
  handleOpenGrnForPo: () => void;
  setSelectedVendorId: (id: string) => void;
  setActiveTab: (tab: any) => void;
  setVendorPoModalData: (v: ErpVendor) => void;
  setPoHistoryFilterPo: (val: string) => void;
  setPoHistoryModalData: (data: any) => void;
  setPayVendorModalData: (data: any) => void;
  handlePrintVendorStatement: (targetVendor?: ErpVendor) => void;
}

export const VendorsTab: React.FC<VendorsTabProps> = ({
  vendors,
  searchTerm,
  setSearchTerm,
  filterCategory,
  setFilterCategory,
  handleOpenAddVendor,
  handleOpenEditVendor,
  handleDeleteVendor,
  handleOpenNewPoModal,
  handleOpenGrnForPo,
  setSelectedVendorId,
  setActiveTab,
  setVendorPoModalData,
  setPoHistoryFilterPo,
  setPoHistoryModalData,
  setPayVendorModalData,
  handlePrintVendorStatement,
}) => {
  return (
${getBlock(6965, 7105)}
  );
};

export default VendorsTab;
`;
fs.writeFileSync('src/components/erp/tabs/VendorsTab.tsx', vendorsTabContent, 'utf8');

// 5. VendorStatementTab
const vendorStatementTabContent = `import React from 'react';
import {
  Building2, Calendar, FileSpreadsheet, Plus, CreditCard,
  History, Eye, Printer, Edit, DollarSign
} from 'lucide-react';
import { ErpVendor } from '../../types';

interface VendorStatementTabProps {
  vendors: ErpVendor[];
  selectedVendorId: string;
  setSelectedVendorId: (id: string) => void;
  selectedVendor: ErpVendor | null;
  vendorDateFilter: 'all' | '30days' | '60days' | 'this_year';
  setVendorDateFilter: (val: any) => void;
  vendorStatement: any;
  expandedGrnId: string | null;
  setExpandedGrnId: React.Dispatch<React.SetStateAction<string | null>>;
  handleOpenEditVendorTop: () => void;
  handleOpenNewPoModal: (targetVendor?: ErpVendor) => void;
  setPayVendorModalData: (data: any) => void;
  setVendorPoModalData: (v: ErpVendor) => void;
  setPoHistoryFilterPo: (val: string) => void;
  setPoHistoryModalData: (data: any) => void;
  setShowPaymentHistoryModal: (show: boolean) => void;
  setVendorPrintModalOpen: (show: boolean) => void;
  handlePrintVendorStatement: (targetVendor?: ErpVendor) => void;
}

export const VendorStatementTab: React.FC<VendorStatementTabProps> = ({
  vendors,
  selectedVendorId,
  setSelectedVendorId,
  selectedVendor,
  vendorDateFilter,
  setVendorDateFilter,
  vendorStatement,
  expandedGrnId,
  setExpandedGrnId,
  handleOpenEditVendorTop,
  handleOpenNewPoModal,
  setPayVendorModalData,
  setVendorPoModalData,
  setPoHistoryFilterPo,
  setPoHistoryModalData,
  setShowPaymentHistoryModal,
  setVendorPrintModalOpen,
  handlePrintVendorStatement,
}) => {
  return (
${getBlock(7108, 7453)}
  );
};

export default VendorStatementTab;
`;
fs.writeFileSync('src/components/erp/tabs/VendorStatementTab.tsx', vendorStatementTabContent, 'utf8');

// 6. PurchaseOrdersTab
const purchaseOrdersTabContent = `import React from 'react';
import {
  ShoppingCart, Search, Filter, Plus, FileSpreadsheet,
  PackageCheck, Edit, Trash2, Printer, CheckCircle2,
  DollarSign, QrCode, Boxes
} from 'lucide-react';
import { WhatsAppIcon } from '../erpUtils';
import { ErpVendor, ErpPurchaseOrder, ErpGrn } from '../../types';

interface PurchaseOrdersTabProps {
  purchaseOrders: ErpPurchaseOrder[];
  filteredPurchaseOrders: ErpPurchaseOrder[];
  totalPoFilteredAmount: number;
  poLogSearchTerm: string;
  setPoLogSearchTerm: (val: string) => void;
  poLogVendorFilter: string;
  setPoLogVendorFilter: (val: string) => void;
  poLogStatusFilter: string;
  setPoLogStatusFilter: (val: string) => void;
  poVendorList: string[];
  handleOpenNewPoModal: () => void;
  setShowUploadBulkPoModal: (show: boolean) => void;
  isPoStockReceivedOrLocked: (po: ErpPurchaseOrder) => boolean;
  handleOpenEditPoModal: (po: ErpPurchaseOrder) => void;
  handleDeletePo: (po: ErpPurchaseOrder) => void;
  handleOpenPoWhatsAppModal: (po: ErpPurchaseOrder) => void;
  handlePrintPo: (po: ErpPurchaseOrder) => void;
  handleOpenGrnForPo: (targetPo?: ErpPurchaseOrder) => void;
  setPayVendorModalData: (data: any) => void;
  setPoHistoryFilterPo: (val: string) => void;
  setPoHistoryModalData: (data: any) => void;
  vendors: ErpVendor[];
  grns: ErpGrn[];
  filteredGrns: ErpGrn[];
  totalGrnFilteredAmount: number;
  grnLogSearchTerm: string;
  setGrnLogSearchTerm: (val: string) => void;
  grnLogVendorFilter: string;
  setGrnLogVendorFilter: (val: string) => void;
  grnVendorList: string[];
  setShowUploadBulkGrnModal: (show: boolean) => void;
  setShowQrScannerModal: (show: boolean) => void;
  setShowQrGeneratorModal: (show: boolean) => void;
  handleOpenGrnPrintPreview: (grn: ErpGrn) => void;
  handleDeleteGrn: (grn: ErpGrn) => void;
}

export const PurchaseOrdersTab: React.FC<PurchaseOrdersTabProps> = ({
  purchaseOrders,
  filteredPurchaseOrders,
  totalPoFilteredAmount,
  poLogSearchTerm,
  setPoLogSearchTerm,
  poLogVendorFilter,
  setPoLogVendorFilter,
  poLogStatusFilter,
  setPoLogStatusFilter,
  poVendorList,
  handleOpenNewPoModal,
  setShowUploadBulkPoModal,
  isPoStockReceivedOrLocked,
  handleOpenEditPoModal,
  handleDeletePo,
  handleOpenPoWhatsAppModal,
  handlePrintPo,
  handleOpenGrnForPo,
  setPayVendorModalData,
  setPoHistoryFilterPo,
  setPoHistoryModalData,
  vendors,
  grns,
  filteredGrns,
  totalGrnFilteredAmount,
  grnLogSearchTerm,
  setGrnLogSearchTerm,
  grnLogVendorFilter,
  setGrnLogVendorFilter,
  grnVendorList,
  setShowUploadBulkGrnModal,
  setShowQrScannerModal,
  setShowQrGeneratorModal,
  handleOpenGrnPrintPreview,
  handleDeleteGrn,
}) => {
  return (
${getBlock(7456, 7936)}
  );
};

export default PurchaseOrdersTab;
`;
fs.writeFileSync('src/components/erp/tabs/PurchaseOrdersTab.tsx', purchaseOrdersTabContent, 'utf8');

// 7. LedgerTab
const ledgerTabContent = `import React from 'react';
import {
  Receipt, Search, Calendar, Filter, Plus, Printer,
  ArrowUpRight, ArrowDownRight, DollarSign
} from 'lucide-react';
import { ErpTransaction } from '../../types';

interface LedgerTabProps {
  transactions: ErpTransaction[];
  filteredTransactions: ErpTransaction[];
  ledgerSearchTerm: string;
  setLedgerSearchTerm: (val: string) => void;
  ledgerDateMode: 'filtered' | 'all';
  setLedgerDateMode: (val: 'filtered' | 'all') => void;
  cashBookDateFilter: string;
  cashBookStartDate: string;
  cashBookEndDate: string;
  setShowTxnModal: (show: boolean) => void;
  handlePrintCashBookReport: () => void;
}

export const LedgerTab: React.FC<LedgerTabProps> = ({
  transactions,
  filteredTransactions,
  ledgerSearchTerm,
  setLedgerSearchTerm,
  ledgerDateMode,
  setLedgerDateMode,
  cashBookDateFilter,
  cashBookStartDate,
  cashBookEndDate,
  setShowTxnModal,
  handlePrintCashBookReport,
}) => {
  return (
${getBlock(7939, 8065)}
  );
};

export default LedgerTab;
`;
fs.writeFileSync('src/components/erp/tabs/LedgerTab.tsx', ledgerTabContent, 'utf8');

// 8. HrTab
const hrTabContent = `import React from 'react';
import {
  Briefcase, Plus, UserPlus, DollarSign, Users,
  CheckCircle2, AlertCircle
} from 'lucide-react';
import { ErpEmployee, ErpPayroll } from '../../types';

interface HrTabProps {
  employees: ErpEmployee[];
  payrolls: ErpPayroll[];
  setShowEmpModal: (show: boolean) => void;
  setShowPayrollModal: (show: boolean) => void;
  setEmpForm: (val: any) => void;
  setPayrollForm: (val: any) => void;
}

export const HrTab: React.FC<HrTabProps> = ({
  employees,
  payrolls,
  setShowEmpModal,
  setShowPayrollModal,
  setEmpForm,
  setPayrollForm,
}) => {
  return (
${getBlock(8068, 8175)}
  );
};

export default HrTab;
`;
fs.writeFileSync('src/components/erp/tabs/HrTab.tsx', hrTabContent, 'utf8');

// 9. ExpensesAssetsTab
const expensesAssetsTabContent = `import React from 'react';
import {
  Receipt, Boxes, Plus, DollarSign
} from 'lucide-react';
import { ErpExpense, ErpAsset } from '../../types';

interface ExpensesAssetsTabProps {
  expenses: ErpExpense[];
  assets: ErpAsset[];
  setShowExpenseModal: (show: boolean) => void;
  setShowAssetModal: (show: boolean) => void;
  setExpenseForm: (val: any) => void;
  setAssetForm: (val: any) => void;
}

export const ExpensesAssetsTab: React.FC<ExpensesAssetsTabProps> = ({
  expenses,
  assets,
  setShowExpenseModal,
  setShowAssetModal,
  setExpenseForm,
  setAssetForm,
}) => {
  return (
${getBlock(8178, 8278)}
  );
};

export default ExpensesAssetsTab;
`;
fs.writeFileSync('src/components/erp/tabs/ExpensesAssetsTab.tsx', expensesAssetsTabContent, 'utf8');

// 10. ReportingTab
const reportingTabContent = `import React from 'react';
import ReportingDesk from '../ReportingDesk';
import { ClinicSettings } from '../../types';

interface ReportingTabProps {
  clinicSettings?: ClinicSettings;
}

export const ReportingTab: React.FC<ReportingTabProps> = ({ clinicSettings }) => {
  return (
    <div className="space-y-6">
      <ReportingDesk clinicSettings={clinicSettings} />
    </div>
  );
};

export default ReportingTab;
`;
fs.writeFileSync('src/components/erp/tabs/ReportingTab.tsx', reportingTabContent, 'utf8');

console.log('All 10 tabs generated successfully!');
