import React from 'react';
import { ShoppingCart, Building2, Calendar, FileSpreadsheet, Plus, Search, Filter, Edit, Pencil, Trash2, CheckCircle2, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, X, Save, QrCode, Coins, DollarSign, Boxes } from 'lucide-react';
import { ErpVendor, ErpPurchaseOrder } from '../../../types';

interface PurchaseOrderModalProps {
  showPoModal: boolean;
  setShowPoModal: (show: boolean) => void;
  editingPurchaseOrder: ErpPurchaseOrder | null;
  poForm: any;
  setPoForm: React.Dispatch<React.SetStateAction<any>>;
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
  setPoGridPage: React.Dispatch<React.SetStateAction<number>>;
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
  setShowQrScannerModal?: (show: boolean) => void;
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
  setShowQrScannerModal,
}) => {
  if (!showPoModal) return null;

  const inventoryItems = allCatalogMedicines || [];

  const handleSelectAllLowStockMedicines = () => {
    const lowStockItems = inventoryItems.filter((i: any) => {
      const cStock = i.CStock ?? i.Stock ?? 0;
      const minStock = (i.MinStock !== undefined && i.MinStock !== null) ? i.MinStock : 1;
      return cStock <= minStock;
    });
    lowStockItems.forEach((med: any) => {
      if (!isMedicineSelectedInPo(med.ItemID, med.ItemName)) {
        handleToggleMedicineInPo(med);
      }
    });
  };

  const handleSelectAllFilteredMedicines = (items: any[]) => {
    items.forEach((med: any) => {
      if (!isMedicineSelectedInPo(med.ItemID, med.ItemName)) {
        handleToggleMedicineInPo(med);
      }
    });
  };

  const handleAddCustomPoItem = () => {
    setPoForm((prev: any) => ({
      ...prev,
      Items: [
        ...prev.Items,
        {
          ItemID: `ITM-CUS-${Date.now().toString().slice(-4)}`,
          ItemName: '',
          Category: 'Tablet / Capsule',
          BatchNo: '',
          Qty: 1,
          UnitPrice: 0,
          LineTotal: 0
        }
      ]
    }));
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-5xl w-full p-6 shadow-xl border border-slate-100 space-y-5 max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-bold text-slate-900 text-lg flex items-center space-x-2">
                <ShoppingCart className="w-5 h-5 text-indigo-600" />
                <span>{editingPurchaseOrder ? 'Edit & Update Purchase Order' : 'Create Purchase Order & Stock Requisition'}</span>
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-black bg-indigo-50 text-indigo-700 border border-indigo-200">
                {poForm.POID || (editingPurchaseOrder ? editingPurchaseOrder.POID : 'PO-NEW')}
              </span>
              {editingPurchaseOrder && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                  ✏️ Edit Mode
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {editingPurchaseOrder
                ? 'Modify quantities, update unit rates, add missing medicine items, or adjust order delivery details.'
                : 'Pick medicines directly from inventory stock list or auto-fill required stock quantities.'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowPoModal(false)}
            className="text-slate-400 hover:text-slate-600 font-bold p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSavePurchaseOrder} className="space-y-5">
          {/* TOP VENDOR, DATE & PAYMENT TERMS SELECTOR */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700">Select Supplier Vendor</label>
                <button
                  type="button"
                  onClick={handleOpenAddVendor}
                  className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer"
                >
                  + Add Vendor
                </button>
              </div>
              <select
                required
                value={poForm.VendorName}
                onChange={e => {
                  const v = vendors.find(item => item.VendorName === e.target.value);
                  setPoForm((prev: any) => ({ ...prev, VendorName: e.target.value, VendorID: v?.VendorID || '' }));
                }}
                className="w-full mt-1 p-2 border rounded-xl text-xs bg-white font-bold text-slate-900"
              >
                <option value="">-- Choose Vendor / Supplier --</option>
                {vendors.map((v, idx) => (
                  <option key={idx} value={v.VendorName}>{v.VendorName} ({v.VendorID})</option>
                ))}
                {vendors.length === 0 && <option value="High-Tech Pharma Distributors Ltd">High-Tech Pharma Distributors Ltd</option>}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700">Expected Delivery Date</label>
              <input
                type="date"
                value={poForm.ExpectedDeliveryDate}
                onChange={e => setPoForm((prev: any) => ({ ...prev, ExpectedDeliveryDate: e.target.value }))}
                className="w-full mt-1 p-2 border rounded-xl text-xs bg-white font-bold text-slate-900"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700">Purchase Payment Terms</label>
              <select
                value={poForm.PaymentMethod || 'Credit'}
                onChange={e => setPoForm((prev: any) => ({ ...prev, PaymentMethod: e.target.value as any }))}
                className="w-full mt-1 p-2 border rounded-xl text-xs bg-white font-bold text-slate-900"
              >
                <option value="Credit">💳 Credit (Vendor Payable / Udhar)</option>
                <option value="Cash">💵 Cash (Spot Payment on Delivery)</option>
              </select>
            </div>
          </div>

          {/* GRID-VIEW MEDICINE STOCK PICKER */}
          <div className="border border-indigo-100 bg-indigo-50/40 rounded-2xl p-4 space-y-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
              <div>
                <h4 className="text-xs font-extrabold text-indigo-900 uppercase tracking-wider flex items-center space-x-1.5">
                  <Boxes className="w-4 h-4 text-indigo-600" />
                  <span>Medicine Inventory & Required Stock Grid View</span>
                </h4>
                <p className="text-[11px] text-indigo-700">Click any medicine card to automatically calculate & add required stock to PO</p>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => handleOpenQuickAddMedicineModal()}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition shadow-xs flex items-center space-x-1.5 cursor-pointer"
                  title="Add a brand new medicine to stock master & include in Purchase Order"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Add Medicine</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowUploadBulkPoModal(true)}
                  className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition shadow-xs flex items-center space-x-1 cursor-pointer"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Upload Bulk PO</span>
                </button>
                <button
                  type="button"
                  onClick={handleSelectAllLowStockMedicines}
                  className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs transition shadow-xs flex items-center space-x-1 cursor-pointer"
                  title="Auto-select all items where CStock <= MinStock"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>⚡ Auto-Select Low Stock</span>
                </button>
                {poForm.Items.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setPoForm((prev: any) => ({ ...prev, Items: [] }))}
                    className="px-2.5 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs cursor-pointer"
                  >
                    Clear List
                  </button>
                )}
              </div>
            </div>

            {/* SEARCH & FILTERS */}
            <div className="flex flex-col sm:flex-row items-center gap-2">
              <div className="relative flex-1 w-full flex space-x-1.5">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search medicine name, ID, category..."
                    value={medicineSearchTerm}
                    onChange={e => {
                      setMedicineSearchTerm(e.target.value);
                      setPoGridPage(1);
                    }}
                    className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-medium"
                  />
                </div>
                {setShowQrScannerModal && (
                  <button
                    type="button"
                    onClick={() => setShowQrScannerModal(true)}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center space-x-1 shrink-0 cursor-pointer shadow-xs"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    <span>Scan QR</span>
                  </button>
                )}
              </div>

              {/* Medicine Category Dropdown Filter */}
              <div className="w-full sm:w-auto">
                <select
                  value={poCategoryFilter}
                  onChange={e => {
                    setPoCategoryFilter(e.target.value);
                    setPoGridPage(1);
                  }}
                  className="w-full sm:w-auto py-1.5 px-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-indigo-900 cursor-pointer shadow-2xs"
                >
                  <option value="all">🏷️ All Medicine Categories</option>
                  {medicineCategories.map((cat, idx) => (
                    <option key={idx} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center space-x-1 self-start sm:self-auto text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setMedicineFilterMode('all');
                    setPoGridPage(1);
                  }}
                  className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                    medicineFilterMode === 'all' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 border'
                  }`}
                >
                  All ({inventoryItems.length})
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMedicineFilterMode('low_stock');
                    setPoGridPage(1);
                  }}
                  className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                    medicineFilterMode === 'low_stock' ? 'bg-amber-600 text-white' : 'bg-white text-slate-600 border'
                  }`}
                >
                  Low Stock ({inventoryItems.filter((i: any) => (i.CStock ?? i.Stock ?? 0) <= ((i.MinStock !== undefined && i.MinStock !== null) ? i.MinStock : 1)).length})
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMedicineFilterMode('selected');
                    setPoGridPage(1);
                  }}
                  className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                    medicineFilterMode === 'selected' ? 'bg-emerald-600 text-white' : 'bg-white text-slate-600 border'
                  }`}
                >
                  Selected ({poForm.Items.length})
                </button>
              </div>
            </div>

            {/* MEDICINES GRID VIEW WITH PAGINATION */}
            {(() => {
              const filteredPoMedicines = inventoryItems.filter((med: any) => {
                const itemName = String(med.ItemName || med.Name || med.title || '');
                const itemId = String(med.ItemID || med.id || '');
                const medCat = getMedicineItemCategory(med);
                const matchCategory = poCategoryFilter === 'all' || 
                                      medCat.toLowerCase() === poCategoryFilter.toLowerCase() ||
                                      medCat.toLowerCase().includes(poCategoryFilter.toLowerCase()) ||
                                      poCategoryFilter.toLowerCase().includes(medCat.toLowerCase());
                const sTerm = medicineSearchTerm.toLowerCase().trim();
                const matchSearch = !sTerm ||
                                    itemName.toLowerCase().includes(sTerm) ||
                                    itemId.toLowerCase().includes(sTerm) ||
                                    medCat.toLowerCase().includes(sTerm);
                const cStock = med.CStock ?? med.Stock ?? 0;
                const minStock = (med.MinStock !== undefined && med.MinStock !== null) ? med.MinStock : 1;
                if (!matchSearch || !matchCategory) return false;
                if (medicineFilterMode === 'low_stock') return cStock <= minStock;
                if (medicineFilterMode === 'selected') return isMedicineSelectedInPo(med.ItemID || itemId, med.ItemName || itemName);
                return true;
              });

              const totalPoItems = filteredPoMedicines.length;
              const isAll = poGridPageSize === -1;
              const effectiveSize = isAll ? Math.max(1, totalPoItems) : poGridPageSize;
              const totalPoPages = isAll ? 1 : Math.max(1, Math.ceil(totalPoItems / effectiveSize));
              const safePoPage = Math.min(Math.max(1, poGridPage), totalPoPages);
              const startPoIdx = isAll ? 0 : (safePoPage - 1) * effectiveSize;
              const endPoIdx = isAll ? totalPoItems : Math.min(startPoIdx + effectiveSize, totalPoItems);
              const paginatedPoMedicines = isAll ? filteredPoMedicines : filteredPoMedicines.slice(startPoIdx, endPoIdx);

              return (
                <div className="space-y-2.5">
                  {/* Sub-header info bar */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-indigo-900 px-1">
                    <div className="flex items-center space-x-2 flex-wrap gap-1">
                      <span className="font-semibold">
                        Showing <strong className="font-mono">{totalPoItems === 0 ? 0 : startPoIdx + 1}–{endPoIdx}</strong> of <strong className="font-mono">{totalPoItems}</strong> medicines
                      </span>
                      {totalPoItems > 0 && (
                        <button
                          type="button"
                          onClick={() => handleSelectAllFilteredMedicines(filteredPoMedicines)}
                          className="px-2.5 py-0.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] transition shadow-2xs flex items-center space-x-1 cursor-pointer"
                          title="Add all currently filtered medicines to requisition list"
                        >
                          <Plus className="w-3 h-3" />
                          <span>⚡ Add All {totalPoItems} Filtered to PO</span>
                        </button>
                      )}
                    </div>
                    <div className="flex items-center space-x-1.5 self-end sm:self-auto">
                      <label className="text-[11px] text-slate-500 font-bold">Cards per view:</label>
                      <select
                        value={poGridPageSize}
                        onChange={(e) => {
                          setPoGridPageSize(Number(e.target.value));
                          setPoGridPage(1);
                        }}
                        className="py-0.5 px-2 bg-white border border-indigo-200 rounded-lg text-xs font-bold text-indigo-900 cursor-pointer shadow-2xs"
                      >
                        <option value={12}>12 cards</option>
                        <option value={24}>24 cards (Fast)</option>
                        <option value={48}>48 cards</option>
                        <option value={96}>96 cards</option>
                        <option value={-1}>All cards</option>
                      </select>
                    </div>
                  </div>

                  {/* Card Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-[380px] overflow-y-auto p-1">
                    {paginatedPoMedicines.length === 0 ? (
                      <div className="col-span-full py-8 px-4 text-center bg-white rounded-xl border border-dashed border-slate-300 space-y-3">
                        <div className="text-slate-500 font-bold text-xs">
                          {medicineSearchTerm ? (
                            <span>No medicine found matching &quot;<strong>{medicineSearchTerm}</strong>&quot; in inventory stock master.</span>
                          ) : (
                            <span>No medicines found matching the current search &amp; category filter.</span>
                          )}
                        </div>
                        <div>
                          <button
                            type="button"
                            onClick={() => handleOpenQuickAddMedicineModal({ ItemName: medicineSearchTerm })}
                            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs inline-flex items-center space-x-1.5 cursor-pointer shadow-sm shadow-emerald-600/20"
                          >
                            <Plus className="w-4 h-4" />
                            <span>+ Add {medicineSearchTerm ? `"${medicineSearchTerm}"` : 'New Medicine'} to Stock &amp; PO</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      paginatedPoMedicines.map((med: any, idx: number) => {
                        const cStock = med.CStock ?? med.Stock ?? 0;
                        const minStock = (med.MinStock !== undefined && med.MinStock !== null) ? med.MinStock : 1;
                        const isLow = cStock <= minStock;
                        const reqQty = getRequiredQty(med);
                        const isSelected = isMedicineSelectedInPo(med.ItemID, med.ItemName);
                        const currentPoItem = poForm.Items.find((i: any) => (i.ItemID && i.ItemID === med.ItemID) || i.ItemName === med.ItemName);
                        const medCat = getMedicineItemCategory(med);
                        const priceInfo = getMedicinePriceInfo(med);
                        const unitPrice = priceInfo.unitPrice;
                        const estTotalCost = unitPrice ? unitPrice * reqQty : null;

                        return (
                          <div
                            key={idx}
                            className={`p-3 rounded-xl border transition flex flex-col justify-between ${
                              isSelected
                                ? 'bg-emerald-50 border-emerald-300 ring-2 ring-emerald-400/40 shadow-xs'
                                : isLow
                                ? 'bg-amber-50/60 border-amber-200 hover:border-amber-400'
                                : 'bg-white border-slate-200 hover:border-indigo-300'
                            }`}
                          >
                            <div>
                              <div className="flex items-start justify-between gap-1">
                                <div className="flex-1 min-w-0 pr-1">
                                  <div className="flex items-center space-x-1.5 group">
                                    <p className="font-bold text-xs text-slate-900 leading-tight truncate" title={med.ItemName}>
                                      {med.ItemName}
                                    </p>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleOpenQuickAddMedicineModal(med);
                                      }}
                                      className="p-1 rounded-md text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition cursor-pointer shrink-0"
                                      title={`Edit "${med.ItemName}" Name, Price & Category`}
                                    >
                                      <Pencil className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                  <p className="text-[10px] font-mono text-slate-500">{med.ItemID || 'ITM'}</p>
                                </div>
                                <div className="flex items-center space-x-1 shrink-0">
                                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                    isLow ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                                  }`}>
                                    {isLow ? 'LOW STOCK' : 'In Stock'}
                                  </span>
                                </div>
                              </div>

                              {/* Medicine Category Badge */}
                              <div className="mt-1.5 flex items-center justify-between">
                                <span className="text-[9.5px] font-extrabold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-150 flex items-center space-x-1">
                                  <span>🏷️</span>
                                  <span>{medCat}</span>
                                </span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenQuickAddMedicineModal(med);
                                  }}
                                  className="text-[10px] text-indigo-600 hover:text-indigo-800 font-bold hover:underline cursor-pointer flex items-center space-x-0.5"
                                >
                                  <span>✏️ Edit Master</span>
                                </button>
                              </div>

                              <div className="mt-2 text-[11px] space-y-1 text-slate-600">
                                <div className="flex justify-between">
                                  <span>Current Stock:</span>
                                  <span className={`font-bold ${isLow ? 'text-amber-700' : 'text-slate-800'}`}>
                                    {cStock} {med.Unit || 'Tab'}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Required Demand:</span>
                                  <span className="font-extrabold text-indigo-700 bg-indigo-100/60 px-1 rounded">
                                    +{reqQty} {med.Unit || 'Tab'}
                                  </span>
                                </div>

                                {/* Unit Price (GRN, Rate, or Manual Textbox) */}
                                <div className="flex justify-between items-center pt-1 border-t border-slate-100">
                                  <span className="text-slate-500 font-medium flex items-center space-x-1">
                                    <span>Unit Price:</span>
                                    {priceInfo.hasPrice && (
                                      <span className="text-[9px] px-1 py-0.2 bg-emerald-100 text-emerald-800 font-extrabold rounded border border-emerald-200" title={priceInfo.grnInfo || ''}>
                                        {priceInfo.priceSource === 'grn' ? 'Last GRN' : 'Master TP'}
                                      </span>
                                    )}
                                  </span>
                                  {isSelected ? (
                                    <div className="flex items-center space-x-1">
                                      <input
                                        type="text"
                                        placeholder="PKR"
                                        value={currentPoItem?.UnitPrice ? currentPoItem.UnitPrice : ''}
                                        onClick={e => e.stopPropagation()}
                                        onChange={e => {
                                          const val = e.target.value;
                                          const numVal = val === '' ? '' : (isNaN(Number(val)) ? val : Number(val));
                                          setPoForm((prev: any) => ({
                                            ...prev,
                                            Items: prev.Items.map((i: any) =>
                                              (i.ItemID === med.ItemID || i.ItemName === med.ItemName)
                                                ? { ...i, UnitPrice: numVal }
                                                : i
                                            )
                                          }));
                                        }}
                                        className="w-20 p-1 text-center text-xs border border-slate-300 focus:border-indigo-500 rounded-md font-bold font-mono bg-white text-slate-900 focus:ring-1 focus:ring-indigo-500 placeholder:text-slate-400"
                                      />
                                    </div>
                                  ) : (
                                    priceInfo.hasPrice ? (
                                      <span className="font-extrabold text-emerald-800 font-mono text-xs">
                                        Rs. {(unitPrice || 0).toLocaleString()}
                                      </span>
                                    ) : (
                                      <span className="text-[9.5px] font-bold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded border border-amber-200">
                                        ⚠️ Price: Not Mentioned
                                      </span>
                                    )
                                  )}
                                </div>

                                {/* Estimate Total Price */}
                                <div className="flex justify-between items-center pt-0.5">
                                  <span className="text-slate-600 font-semibold">Est. Total Cost:</span>
                                  {estTotalCost !== null ? (
                                    <span className="font-black text-indigo-950 font-mono bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200">
                                      Rs. {(estTotalCost || 0).toLocaleString()}
                                    </span>
                                  ) : (
                                    <span className="text-[10px] text-slate-400 italic">
                                      — (Price not mentioned)
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex items-center justify-between gap-1">
                              {isSelected ? (
                                <div className="flex items-center justify-between w-full">
                                  <span className="text-[10px] font-extrabold text-emerald-700 flex items-center">
                                    <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" />
                                    In PO List
                                  </span>
                                  <div className="flex items-center space-x-1">
                                    <label className="text-[10px] text-slate-500 font-bold">Qty:</label>
                                    <input
                                      type="number"
                                      min="1"
                                      value={currentPoItem?.Qty ?? reqQty}
                                      onChange={e => {
                                        const val = Math.max(1, Number(e.target.value));
                                        setPoForm((prev: any) => ({
                                          ...prev,
                                          Items: prev.Items.map((i: any) =>
                                            (i.ItemID === med.ItemID || i.ItemName === med.ItemName)
                                              ? { ...i, Qty: val }
                                              : i
                                          )
                                        }));
                                      }}
                                      className="w-14 p-0.5 text-center text-xs border rounded font-bold bg-white"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => handleToggleMedicineInPo(med)}
                                      className="text-[10px] text-rose-600 hover:text-rose-800 font-bold px-1 cursor-pointer"
                                      title="Remove from PO"
                                    >
                                      ✕
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleToggleMedicineInPo(med)}
                                  className={`w-full py-1 rounded-lg text-xs font-bold transition flex items-center justify-center space-x-1 cursor-pointer ${
                                    isLow
                                      ? 'bg-amber-600 hover:bg-amber-700 text-white'
                                      : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700'
                                  }`}
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                  <span>Add to Requisition (+{reqQty})</span>
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Pagination Controls */}
                  {!isAll && totalPoPages > 1 && (
                    <div className="flex items-center justify-between pt-1 text-xs border-t border-indigo-100">
                      <span className="text-[11px] text-indigo-800 font-medium">
                        Page <strong>{safePoPage}</strong> of <strong>{totalPoPages}</strong>
                      </span>
                      <div className="flex items-center space-x-1">
                        <button
                          type="button"
                          onClick={() => setPoGridPage(1)}
                          disabled={safePoPage <= 1}
                          className="p-1 rounded bg-white border border-indigo-200 hover:bg-indigo-50 disabled:opacity-40 disabled:cursor-not-allowed text-indigo-800 cursor-pointer"
                          title="First Page"
                        >
                          <ChevronsLeft className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setPoGridPage((prev: number) => Math.max(1, prev - 1))}
                          disabled={safePoPage <= 1}
                          className="px-2 py-1 rounded bg-white border border-indigo-200 hover:bg-indigo-50 disabled:opacity-40 disabled:cursor-not-allowed text-indigo-800 font-bold flex items-center space-x-1 cursor-pointer"
                        >
                          <ChevronLeft className="w-3 h-3" />
                          <span>Prev</span>
                        </button>
                        <span className="px-2 py-0.5 bg-indigo-600 text-white rounded font-mono font-bold text-[11px]">
                          {safePoPage}
                        </span>
                        <button
                          type="button"
                          onClick={() => setPoGridPage((prev: number) => Math.min(totalPoPages, prev + 1))}
                          disabled={safePoPage >= totalPoPages}
                          className="px-2 py-1 rounded bg-white border border-indigo-200 hover:bg-indigo-50 disabled:opacity-40 disabled:cursor-not-allowed text-indigo-800 font-bold flex items-center space-x-1 cursor-pointer"
                        >
                          <span>Next</span>
                          <ChevronRight className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setPoGridPage(totalPoPages)}
                          disabled={safePoPage >= totalPoPages}
                          className="p-1 rounded bg-white border border-indigo-200 hover:bg-indigo-50 disabled:opacity-40 disabled:cursor-not-allowed text-indigo-800 cursor-pointer"
                          title="Last Page"
                        >
                          <ChevronsRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>

          {/* REQUISITION ORDER SUMMARY TABLE */}
          {(() => {
            const sTerm = medicineSearchTerm.toLowerCase().trim();
            const isFiltered = Boolean(sTerm || poCategoryFilter !== 'all' || medicineFilterMode !== 'all');

            const filteredPoSelectedItems = poForm.Items
              .map((item: any, originalIndex: number) => ({ item, originalIndex }))
              .filter(({ item }: any) => {
                const itemName = String(item.ItemName || '').toLowerCase().trim();
                const itemId = String(item.ItemID || '').toLowerCase().trim();
                const category = String(item.Category || '').toLowerCase().trim();
                const batch = String(item.BatchNo || '').toLowerCase().trim();

                const matchSearch = !sTerm ||
                  itemName.includes(sTerm) ||
                  itemId.includes(sTerm) ||
                  category.includes(sTerm) ||
                  batch.includes(sTerm);

                const matchCategory = poCategoryFilter === 'all' || category.includes(poCategoryFilter.toLowerCase());

                if (!matchSearch || !matchCategory) return false;

                if (medicineFilterMode === 'low_stock') {
                  const invMed = inventoryItems.find((i: any) => (i.ItemID && i.ItemID === item.ItemID) || i.ItemName === item.ItemName);
                  if (invMed) {
                    const cStock = invMed.CStock ?? invMed.Stock ?? 0;
                    const minStock = (invMed.MinStock !== undefined && invMed.MinStock !== null) ? invMed.MinStock : 1;
                    return cStock <= minStock;
                  }
                }

                return true;
              });

            // Calculate summary metrics
            const totalUnits = poForm.Items.reduce((sum: number, i: any) => sum + (Number(i.Qty) || 0), 0);
            const totalEstValuation = poForm.Items.reduce((sum: number, i: any) => sum + ((Number(i.Qty) || 0) * (Number(i.UnitPrice) || 0)), 0);

            return (
              <div className="space-y-2">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div className="flex items-center space-x-2 flex-wrap gap-1">
                    <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Selected Order Items Requisition List
                    </label>
                    {isFiltered ? (
                      <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
                        Showing {filteredPoSelectedItems.length} of {poForm.Items.length} Items (Filtered)
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
                        {poForm.Items.length} Items
                      </span>
                    )}
                    {totalEstValuation > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-200 font-mono">
                        Est. Total: Rs. {(totalEstValuation || 0).toLocaleString()}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    {isFiltered && poForm.Items.length > filteredPoSelectedItems.length && (
                      <button
                        type="button"
                        onClick={() => {
                          setMedicineSearchTerm('');
                          setPoCategoryFilter('all');
                          setMedicineFilterMode('all');
                        }}
                        className="text-xs font-bold text-indigo-600 hover:text-indigo-800 underline cursor-pointer"
                      >
                        Show All {poForm.Items.length} Selected Items
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleOpenQuickAddMedicineModal()}
                      className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center space-x-1 cursor-pointer bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200"
                      title="Register brand new medicine into stock master"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Add Medicine</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleAddCustomPoItem}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center space-x-1 cursor-pointer bg-indigo-50 px-2 py-1 rounded-lg border border-indigo-150"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Custom Item Line</span>
                    </button>
                  </div>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden max-h-[380px] overflow-y-auto">
                  <datalist id="inventory-med-picker-datalist">
                    {inventoryItems.map((inv: any, invIdx: number) => (
                      <option key={invIdx} value={inv.ItemName || inv.Name}>
                        {inv.ItemID ? `[${inv.ItemID}] ` : ''}{inv.ItemName || inv.Name} - {getMedicineItemCategory(inv)}
                      </option>
                    ))}
                  </datalist>

                  <table className="w-full text-left text-xs">
                    <thead className="sticky top-0 z-10 bg-slate-100 shadow-2xs">
                      <tr className="text-slate-600 font-bold border-b border-slate-200">
                        <th className="p-2.5 w-10 text-center">#</th>
                        <th className="p-2.5">Medicine Name</th>
                        <th className="p-2.5 w-36">Category</th>
                        <th className="p-2.5 w-28">Batch No.</th>
                        <th className="p-2.5 w-24 text-center">Required Qty</th>
                        <th className="p-2.5 w-36 text-center">Unit Price (GRN / Rate)</th>
                        <th className="p-2.5 w-28 text-right">Est. Total</th>
                        <th className="p-2.5 w-12 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {poForm.Items.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="p-6 text-center text-slate-400 font-medium">
                            No medicines selected yet. Choose items from the grid above or auto-select low stock items!
                          </td>
                        </tr>
                      ) : filteredPoSelectedItems.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="p-6 text-center text-slate-500 font-medium bg-amber-50/50">
                            <p className="font-bold text-slate-700">No selected order items match the active search query or filter.</p>
                            <p className="text-xs text-slate-500 mt-1">({poForm.Items.length} items exist in the total purchase requisition list)</p>
                            <button
                              type="button"
                              onClick={() => {
                                setMedicineSearchTerm('');
                                setPoCategoryFilter('all');
                                setMedicineFilterMode('all');
                              }}
                              className="mt-2 px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-xs cursor-pointer"
                            >
                              Clear Search & View All Selected Items
                            </button>
                          </td>
                        </tr>
                      ) : (
                        filteredPoSelectedItems.map(({ item, originalIndex }: any, filteredIdx: number) => {
                          const rowPriceInfo = getMedicinePriceInfo(item);
                          const lineValuation = (Number(item.Qty) || 0) * (Number(item.UnitPrice) || 0);

                          return (
                            <tr key={originalIndex} className="hover:bg-slate-50">
                              <td className="p-2.5 text-center font-bold text-slate-400 font-mono">
                                {filteredIdx + 1}
                              </td>
                              <td className="p-2 font-medium">
                                <input
                                  type="text"
                                  list="inventory-med-picker-datalist"
                                  placeholder="Search or enter medicine..."
                                  value={item.ItemName}
                                  onChange={e => handlePoItemChange(originalIndex, 'ItemName', e.target.value)}
                                  className="w-full p-1.5 border rounded-lg text-xs font-bold text-slate-900 bg-white"
                                />
                                {item.ItemID && (
                                  <span className="text-[10px] font-mono text-slate-400 block mt-0.5">
                                    ID: {item.ItemID}
                                  </span>
                                )}
                              </td>
                              <td className="p-2">
                                <select
                                  value={item.Category || 'Tablet / Capsule'}
                                  onChange={e => handlePoItemChange(originalIndex, 'Category', e.target.value)}
                                  className="w-full p-1.5 border rounded-lg text-xs font-bold text-indigo-900 bg-indigo-50/60 cursor-pointer"
                                >
                                  {medicineCategories.map((c, cIdx) => (
                                    <option key={cIdx} value={c}>{c}</option>
                                  ))}
                                </select>
                              </td>
                              <td className="p-2">
                                <input
                                  type="text"
                                  placeholder="Batch / Ref"
                                  value={item.BatchNo || ''}
                                  onChange={e => handlePoItemChange(originalIndex, 'BatchNo', e.target.value)}
                                  className="w-full p-1.5 border rounded-lg text-xs font-mono font-bold bg-amber-50/60 text-amber-900 text-center"
                                />
                              </td>
                              <td className="p-2 text-center">
                                <input
                                  type="number"
                                  min="1"
                                  placeholder="1"
                                  value={item.Qty}
                                  onChange={e => handlePoItemChange(originalIndex, 'Qty', Math.max(1, Number(e.target.value)))}
                                  className="w-20 mx-auto p-1.5 border border-indigo-300 rounded-lg text-xs text-center font-black font-mono bg-indigo-50/40 text-indigo-950"
                                />
                              </td>
                              <td className="p-2 text-center">
                                <div className="space-y-1">
                                  <input
                                    type="text"
                                    placeholder="PKR"
                                    value={item.UnitPrice ? item.UnitPrice : ''}
                                    onChange={e => {
                                      const val = e.target.value;
                                      const numVal = val === '' ? '' : (isNaN(Number(val)) ? val : Number(val));
                                      handlePoItemChange(originalIndex, 'UnitPrice', numVal);
                                    }}
                                    className="w-24 mx-auto px-2 py-1 border border-slate-300 focus:border-indigo-500 rounded-lg text-xs text-center font-bold font-mono bg-white text-slate-900 focus:ring-1 focus:ring-indigo-500 placeholder:text-slate-400"
                                  />
                                  {rowPriceInfo.hasPrice && rowPriceInfo.priceSource === 'grn' && (
                                    <span
                                      className="inline-block text-[9.5px] font-extrabold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded border border-emerald-300 max-w-[130px] truncate cursor-help"
                                      title={rowPriceInfo.grnInfo || ''}
                                    >
                                      🏷️ GRN #{rowPriceInfo.grnNo || 'Rate'}
                                    </span>
                                  )}
                                  {rowPriceInfo.hasPrice && rowPriceInfo.priceSource === 'master' && (
                                    <span
                                      className="inline-block text-[9.5px] font-bold text-indigo-800 bg-indigo-100 px-1.5 py-0.5 rounded border border-indigo-250 max-w-[130px] truncate cursor-help"
                                      title="Master Item TP Cost Price"
                                    >
                                      📦 Master TP
                                    </span>
                                  )}
                                  {!rowPriceInfo.hasPrice && (
                                    <span className="inline-block text-[9px] font-bold text-amber-700 bg-amber-50 px-1 py-0.5 rounded">
                                      Manual Rate
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="p-2 text-right">
                                <span className="font-mono font-bold text-slate-900 text-xs">
                                  Rs. {(lineValuation || 0).toLocaleString()}
                                </span>
                              </td>
                              <td className="p-2 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleRemovePoItem(originalIndex)}
                                  className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                                  title="Remove item"
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
            );
          })()}

          {/* FOOTER & REQUISITION QUANTITY TOTAL */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-200">
            <div className="text-xs space-y-1">
              <div className="flex items-center space-x-3 flex-wrap gap-1">
                <div className="flex items-center space-x-1.5">
                  <span className="text-slate-500 font-bold">Total Demand:</span>
                  <span className="text-sm font-black text-indigo-700 font-mono">
                    {(totalPoRequisitionQty || 0).toLocaleString()} Units
                  </span>
                  <span className="text-slate-400 font-medium">({poForm.Items.length} Medicines)</span>
                </div>

                <div className="h-4 w-px bg-slate-300 hidden sm:block" />

                <div className="flex items-center space-x-1.5">
                  <span className="text-slate-500 font-bold">Est. Total Valuation:</span>
                  <span className="text-sm font-black text-emerald-700 font-mono bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Rs. {(totalPoAmount || 0).toLocaleString()}
                  </span>
                </div>
              </div>
              <p className="text-[11px] text-slate-500 italic">
                💡 Last unit prices are fetched automatically from previous GRNs and Item TP masters. Final invoice price & discounts are finalized during GRN receipt.
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setShowPoModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={poForm.Items.length === 0 || isSubmitting}
                className={`px-5 py-2.5 rounded-xl disabled:opacity-50 text-white font-bold text-xs transition shadow-sm flex items-center space-x-1.5 cursor-pointer ${
                  editingPurchaseOrder
                    ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/20'
                    : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20'
                }`}
              >
                {editingPurchaseOrder ? (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save & Update Purchase Order</span>
                  </>
                ) : (
                  <>
                    <ShoppingCart className="w-4 h-4" />
                    <span>Generate & Post Purchase Order</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PurchaseOrderModal;
