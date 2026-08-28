import React from 'react';
import {
  ShoppingCart, Search, Filter, Plus, FileSpreadsheet,
  PackageCheck, Edit, Trash2, Printer, CheckCircle2,
  DollarSign, QrCode, Boxes, X, RotateCcw, Pencil, Eye, Lock
} from 'lucide-react';
import { WhatsAppIcon } from '../erpUtils';
import { ErpVendor, ErpPurchaseOrder, ErpGrn } from '../../../types';

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
  inventoryItems?: any[];
  handleSelectAllLowStockMedicines?: () => void;
  setShowPoModal?: (show: boolean) => void;
  setBulkPoRawText?: (val: string) => void;
  setBulkPoParsedItems?: (val: any[]) => void;
  setBulkPoFileError?: (val: string) => void;
  setBulkGrnSelectedPoId?: (val: string) => void;
  setBulkGrnRawText?: (val: string) => void;
  setBulkGrnParsedItems?: (val: any[]) => void;
  setBulkGrnFileError?: (val: string) => void;
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
  inventoryItems = [],
  handleSelectAllLowStockMedicines = () => {},
  setShowPoModal = (_show?: any) => {},
  setBulkPoRawText = (_val?: any) => {},
  setBulkPoParsedItems = (_val?: any) => {},
  setBulkPoFileError = (_val?: any) => {},
  setBulkGrnSelectedPoId = (_val?: any) => {},
  setBulkGrnRawText = (_val?: any) => {},
  setBulkGrnParsedItems = (_val?: any) => {},
  setBulkGrnFileError = (_val?: any) => {},
}) => {
  return (
        <div className="space-y-4">
          {/* Inventory Stock Requisition Banner */}
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-amber-500/10 text-amber-700 rounded-xl font-bold">
                <Boxes className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h3 className="text-xs font-extrabold text-amber-900 uppercase tracking-wider">Inventory Stock Requisition Status</h3>
                <p className="text-xs text-amber-800 mt-0.5">
                  <span className="font-extrabold text-amber-900">
                    {inventoryItems.filter(med => (med.CStock ?? 0) <= ((med.MinStock !== undefined && med.MinStock !== null) ? med.MinStock : 1)).length} Medicines
                  </span> currently below minimum stock level and require purchase order replenishment.
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  handleSelectAllLowStockMedicines();
                  setShowPoModal(true);
                }}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition shadow-xs flex items-center space-x-1.5 cursor-pointer whitespace-nowrap"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Auto-Create PO for Low Stock Items</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setBulkPoRawText('');
                  setBulkPoParsedItems([]);
                  setBulkPoFileError('');
                  setShowUploadBulkPoModal(true);
                }}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition shadow-xs flex items-center space-x-1.5 cursor-pointer whitespace-nowrap"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Upload Bulk PO</span>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-slate-900">Purchase Orders & Stock Requisitions Log</h2>
                <p className="text-xs text-slate-500">Create, track, and print official POs for medicine stock replenishment</p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleOpenGrnForPo()}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition flex items-center space-x-1.5 cursor-pointer shadow-xs"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Process GRN (Receive Goods)</span>
                </button>
                <button
                  onClick={() => handleOpenNewPoModal()}
                  className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition flex items-center space-x-1.5 cursor-pointer shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Purchase Order</span>
                </button>
              </div>
            </div>

            {/* PO GRID SEARCH & VENDOR DROPDOWN FILTER BAR */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex flex-col md:flex-row items-center gap-3 justify-between">
              <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full md:w-auto flex-1">
                {/* Search Box */}
                <div className="relative flex-1 w-full sm:min-w-[240px]">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search PO#, Vendor Name, Medicine, Batch, or Date..."
                    value={poLogSearchTerm}
                    onChange={e => setPoLogSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-8 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                  {poLogSearchTerm && (
                    <button
                      type="button"
                      onClick={() => setPoLogSearchTerm('')}
                      className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Vendor Dropdown Filter */}
                <div className="flex items-center space-x-1.5 w-full sm:w-auto shrink-0">
                  <Filter className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <select
                    value={poLogVendorFilter}
                    onChange={e => setPoLogVendorFilter(e.target.value)}
                    className="w-full sm:w-auto bg-white border border-slate-200 text-slate-800 text-xs font-bold rounded-xl px-3 py-1.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none cursor-pointer"
                  >
                    <option value="ALL">All Suppliers / Vendor Names ({poVendorList.length})</option>
                    {poVendorList.map((vName, idx) => (
                      <option key={idx} value={vName}>
                        Vendor: {vName}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Status Dropdown Filter */}
                <div className="w-full sm:w-auto shrink-0">
                  <select
                    value={poLogStatusFilter}
                    onChange={e => setPoLogStatusFilter(e.target.value)}
                    className="w-full sm:w-auto bg-white border border-slate-200 text-slate-800 text-xs font-bold rounded-xl px-3 py-1.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none cursor-pointer"
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="Pending">Pending Orders</option>
                    <option value="Partially Received">Partially Received</option>
                    <option value="Received">Fully Received</option>
                  </select>
                </div>
              </div>

              {/* Counter Pill & Reset Button */}
              <div className="flex items-center space-x-2 shrink-0 self-end sm:self-auto">
                <span className="text-[11px] font-bold text-slate-600 bg-white border border-slate-200 px-2.5 py-1 rounded-lg">
                  Total: <strong className="text-indigo-600 font-extrabold">{filteredPurchaseOrders.length}</strong> / {purchaseOrders.length} POs
                  <span className="text-slate-400 mx-1">|</span>
                  <span className="text-emerald-700">Rs. {(totalPoFilteredAmount || 0).toLocaleString()}</span>
                </span>
                {(poLogSearchTerm || poLogVendorFilter !== 'ALL' || poLogStatusFilter !== 'ALL') && (
                  <button
                    type="button"
                    onClick={() => {
                      setPoLogSearchTerm('');
                      setPoLogVendorFilter('ALL');
                      setPoLogStatusFilter('ALL');
                    }}
                    className="px-2.5 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-lg transition flex items-center space-x-1 cursor-pointer"
                    title="Reset All PO Filters"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset</span>
                  </button>
                )}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                    <th className="p-3">PO Number</th>
                    <th className="p-3">Supplier / Vendor Name</th>
                    <th className="p-3">Order Date</th>
                    <th className="p-3">Expected Delivery</th>
                    <th className="p-3 text-center">Items Count</th>
                    <th className="p-3 text-right">Total Amount</th>
                    <th className="p-3 text-center">Status</th>
                    <th className="p-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredPurchaseOrders.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-400 font-medium">
                        {purchaseOrders.length === 0 ? (
                          <span>No Purchase Orders created yet. Click "Create Purchase Order" above.</span>
                        ) : (
                          <span>No Purchase Orders match your search and vendor filter criteria.</span>
                        )}
                      </td>
                    </tr>
                  ) : (
                    filteredPurchaseOrders.map((po, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="p-3">
                          <div className="flex items-center space-x-1.5">
                            <span className="font-mono font-bold text-indigo-600">{po.POID}</span>
                            {po.PaymentMethod === 'Cash' || (po as any).PaymentTerms === 'Cash' ? (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300 shrink-0">CASH</span>
                            ) : (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-indigo-100 text-indigo-800 border border-indigo-200 shrink-0">CREDIT</span>
                            )}
                          </div>
                        </td>
                        <td className="p-3 font-bold text-slate-900">{po.VendorName}</td>
                        <td className="p-3 text-slate-600">{po.OrderDate}</td>
                        <td className="p-3 text-slate-600">{po.ExpectedDeliveryDate}</td>
                        <td className="p-3 text-center">
                          <div className="font-bold text-slate-700">{po.Items?.length || 0} items</div>
                          {po.Items && po.Items.some(i => i.BatchNo) && (
                            <div
                              className="text-[10px] font-mono text-amber-800 font-semibold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 inline-block mt-0.5 cursor-help"
                              title={po.Items.map(i => `${i.ItemName}: Batch ${i.BatchNo || 'N/A'}`).join(' | ')}
                            >
                              Batch: {po.Items.find(i => i.BatchNo)?.BatchNo} {po.Items.length > 1 ? `+${po.Items.length - 1}` : ''}
                            </div>
                          )}
                        </td>
                        <td className="p-3 text-right font-bold text-slate-900">Rs. {(po.TotalAmount || 0).toLocaleString()}</td>
                        <td className="p-3 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            po.Status === 'Received'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : po.Status === 'Partially Received'
                              ? 'bg-amber-100 text-amber-900 border border-amber-300'
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {po.Status === 'Received' ? '✓ Fully Received' : po.Status === 'Partially Received' ? '⚡ Partially Received' : po.Status}
                          </span>
                        </td>
                        <td className="p-3 text-center whitespace-nowrap">
                          <div className="inline-flex items-center justify-center gap-1.5 align-middle">
                            {/* EDIT PO BUTTON: Enabled when pending/sent, locked when stock/GRN processed */}
                            {isPoStockReceivedOrLocked(po) ? (
                              <button
                                type="button"
                                disabled
                                className="w-7 h-7 bg-slate-100 text-slate-400 border border-slate-200 rounded-lg inline-flex items-center justify-center cursor-not-allowed opacity-60 shadow-2xs"
                                title="🔒 Locked: Stock/GRN has already been added for this PO. Editing is not allowed."
                              >
                                <Lock className="w-3.5 h-3.5 text-slate-400" />
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleOpenEditPoModal(po)}
                                className="w-7 h-7 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-lg transition inline-flex items-center justify-center cursor-pointer shadow-2xs"
                                title="Edit Purchase Order (Add/Update items before stock receipt)"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {po.Status !== 'Received' ? (
                              <button
                                type="button"
                                onClick={() => handleOpenGrnForPo(po)}
                                className="h-7 px-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-[11px] font-bold transition inline-flex items-center justify-center space-x-1 cursor-pointer shrink-0"
                                title="Process GRN stock inward for this PO"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                <span className="whitespace-nowrap">{po.Status === 'Partially Received' ? 'Receive Next' : 'Receive Stock'}</span>
                              </button>
                            ) : (
                              <span className="h-7 px-2.5 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-lg text-[11px] font-extrabold inline-flex items-center justify-center shrink-0">
                                Stock Added
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={() => handleOpenPoWhatsAppModal(po)}
                              className="h-7 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold transition inline-flex items-center justify-center space-x-1 cursor-pointer shadow-xs shrink-0"
                              title="Send Purchase Order & PDF to Vendor via WhatsApp"
                            >
                              <WhatsAppIcon className="w-3.5 h-3.5 text-white" />
                              <span className="whitespace-nowrap">WhatsApp</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handlePrintPo(po)}
                              className="w-7 h-7 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg transition inline-flex items-center justify-center cursor-pointer shrink-0 shadow-2xs"
                              title="Print Official PO"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeletePo(po)}
                              className="w-7 h-7 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-lg transition inline-flex items-center justify-center cursor-pointer shrink-0 shadow-2xs"
                              title="Delete PO"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Goods Received Notes (GRN) Received Stock Log */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <h2 className="text-base font-bold text-slate-900">Goods Received Notes (GRN) & Inward Stock Log</h2>
                </div>
                <p className="text-xs text-slate-500">Official verified receipts of PO shipments received and added to pharmacy stock</p>
              </div>
              <div className="flex items-center space-x-2 self-start">
                <button
                  type="button"
                  onClick={() => {
                    setBulkGrnSelectedPoId('');
                    setBulkGrnRawText('');
                    setBulkGrnParsedItems([]);
                    setBulkGrnFileError('');
                    setShowUploadBulkGrnModal(true);
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition flex items-center space-x-1.5 shadow-sm cursor-pointer"
                  title="Upload Excel or Paste Bulk GRN Receipts"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Upload Bulk GRN</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenGrnForPo()}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-bold text-xs transition flex items-center space-x-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create New GRN</span>
                </button>
              </div>
            </div>

            {/* GRN GRID SEARCH & VENDOR DROPDOWN FILTER BAR */}
            <div className="bg-emerald-50/50 p-3 rounded-xl border border-emerald-200/60 flex flex-col md:flex-row items-center gap-3 justify-between">
              <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full md:w-auto flex-1">
                {/* Search Box */}
                <div className="relative flex-1 w-full sm:min-w-[240px]">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search GRN#, PO#, Vendor Name, Item, Batch, or Invoice..."
                    value={grnLogSearchTerm}
                    onChange={e => setGrnLogSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-8 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                  {grnLogSearchTerm && (
                    <button
                      type="button"
                      onClick={() => setGrnLogSearchTerm('')}
                      className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Vendor Dropdown Filter */}
                <div className="flex items-center space-x-1.5 w-full sm:w-auto shrink-0">
                  <Filter className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                  <select
                    value={grnLogVendorFilter}
                    onChange={e => setGrnLogVendorFilter(e.target.value)}
                    className="w-full sm:w-auto bg-white border border-slate-200 text-slate-800 text-xs font-bold rounded-xl px-3 py-1.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none cursor-pointer"
                  >
                    <option value="ALL">All Suppliers / Vendor Names ({grnVendorList.length})</option>
                    {grnVendorList.map((vName, idx) => (
                      <option key={idx} value={vName}>
                        Vendor: {vName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Counter Pill & Reset Button */}
              <div className="flex items-center space-x-2 shrink-0 self-end sm:self-auto">
                <span className="text-[11px] font-bold text-slate-600 bg-white border border-slate-200 px-2.5 py-1 rounded-lg">
                  Total: <strong className="text-emerald-700 font-extrabold">{filteredGrns.length}</strong> / {grns.length} GRNs
                  <span className="text-slate-400 mx-1">|</span>
                  <span className="text-emerald-800">Rs. {(totalGrnFilteredAmount || 0).toLocaleString()}</span>
                </span>
                {(grnLogSearchTerm || grnLogVendorFilter !== 'ALL') && (
                  <button
                    type="button"
                    onClick={() => {
                      setGrnLogSearchTerm('');
                      setGrnLogVendorFilter('ALL');
                    }}
                    className="px-2.5 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-lg transition flex items-center space-x-1 cursor-pointer"
                    title="Reset All GRN Filters"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset</span>
                  </button>
                )}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                    <th className="p-3">GRN Number</th>
                    <th className="p-3">PO Reference</th>
                    <th className="p-3">Supplier / Vendor Name</th>
                    <th className="p-3">Received Date</th>
                    <th className="p-3">Challan / Inv No.</th>
                    <th className="p-3 text-center">Items Received</th>
                    <th className="p-3 text-right">Total Value</th>
                    <th className="p-3 text-center">Status</th>
                    <th className="p-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredGrns.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-slate-400 font-medium">
                        {grns.length === 0 ? (
                          <span>No Goods Received Notes (GRNs) logged yet. Click "Process GRN" or select a Purchase Order to receive stock into inventory.</span>
                        ) : (
                          <span>No Goods Received Notes match your search and vendor filter criteria.</span>
                        )}
                      </td>
                    </tr>
                  ) : (
                    filteredGrns.map((grn, idx) => {
                      const isCashGrn = grn.PaymentMethod === 'Cash' || (grn as any).PaymentMode === 'Cash';
                      return (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="p-3">
                            <div className="flex items-center space-x-1.5">
                              <span className="font-mono font-bold text-emerald-700">{grn.GRNID}</span>
                              {isCashGrn ? (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300 shrink-0">CASH</span>
                              ) : (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-indigo-100 text-indigo-800 border border-indigo-200 shrink-0">CREDIT</span>
                              )}
                            </div>
                          </td>
                          <td className="p-3 font-mono font-bold text-indigo-600">{grn.POID}</td>
                          <td className="p-3 font-bold text-slate-900">{grn.VendorName}</td>
                          <td className="p-3 text-slate-600">{grn.ReceivedDate}</td>
                          <td className="p-3 text-slate-500 font-mono">{grn.ChallanNo || grn.SupplierInvoiceNo || 'N/A'}</td>
                          <td className="p-3 text-center font-bold text-slate-700">{grn.Items?.length || 0}</td>
                          <td className="p-3 text-right font-bold text-slate-900">Rs. {(grn.TotalAmount || 0).toLocaleString()}</td>
                          <td className="p-3 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              isCashGrn
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : 'bg-indigo-100 text-indigo-800 border border-indigo-300'
                            }`}>
                              {isCashGrn ? '💵 Cash Paid' : '💳 Credit (Payable)'}
                            </span>
                            <div className="text-[10px] font-mono text-slate-600 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded mt-1 font-semibold inline-block cursor-help" title={isCashGrn ? "Double Entry GL Posted: Debit Inventory (103001) | Credit Cash in Hand (101001)" : "Double Entry GL Posted: Debit Inventory (103001) | Credit Accounts Payable (201001)"}>
                              {isCashGrn ? 'GL: Dr Stock | Cr Cash' : 'GL: Dr Stock | Cr AP'}
                            </div>
                          </td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center space-x-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenGrnPrintPreview(grn)}
                              className="px-2.5 py-1 text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition cursor-pointer flex items-center space-x-1 font-bold border border-emerald-200 text-[11px]"
                              title="Print Preview & Dedicated A4 Official GRN Template"
                            >
                              <Eye className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Print Preview</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteGrn(grn)}
                              className="px-2 py-1 text-rose-700 hover:bg-rose-50 rounded transition cursor-pointer flex items-center space-x-1 font-bold border border-rose-200 text-[11px]"
                              title="Delete Goods Received Note (GRN)"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                              <span>Delete</span>
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
        </div>
    
  );
};

export default PurchaseOrdersTab;
