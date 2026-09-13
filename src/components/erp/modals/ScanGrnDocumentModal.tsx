import React, { useState, useRef } from 'react';
import {
  ScanLine,
  Camera,
  UploadCloud,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  X,
  FileText,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Trash2,
  Plus,
  Coins,
  CreditCard,
  Building2,
  Calendar,
  Hash,
  Search,
  ExternalLink,
  Package,
  Layers
} from 'lucide-react';
import { ErpVendor, ErpPurchaseOrder, ScannedGrnDocument, ScannedGrnItem } from '../../../types';

interface ScanGrnDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyScannedDocument: (doc: ScannedGrnDocument, selectedPoId?: string) => void;
  inventoryItems: any[];
  vendors: ErpVendor[];
  purchaseOrders: ErpPurchaseOrder[];
  currentPoId?: string;
}

export const ScanGrnDocumentModal: React.FC<ScanGrnDocumentModalProps> = ({
  isOpen,
  onClose,
  onApplyScannedDocument,
  inventoryItems,
  vendors,
  purchaseOrders,
  currentPoId = '',
}) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>('image/jpeg');
  const [fileName, setFileName] = useState<string>('');
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanStep, setScanStep] = useState<string>('');
  const [scanError, setScanError] = useState<string | null>(null);
  const [scannedDoc, setScannedDoc] = useState<ScannedGrnDocument | null>(null);
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [imageZoom, setImageZoom] = useState<number>(1);
  const [showImagePreview, setShowImagePreview] = useState<boolean>(true);
  const [selectedPoId, setSelectedPoId] = useState<string>(currentPoId);

  // Search filter for medicine matching override
  const [activeItemSearchIdx, setActiveItemSearchIdx] = useState<number | null>(null);
  const [medicineSearchTerm, setMedicineSearchTerm] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Process file upload (Image or PDF)
  const handleFileSelect = (file: File) => {
    if (!file) return;
    setScanError(null);
    setFileName(file.name);
    setMimeType(file.type || 'image/jpeg');

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setSelectedImage(result);
      // Auto-trigger OCR scanning on selection
      triggerOcrScan(result, file.type || 'image/jpeg');
    };
    reader.onerror = () => {
      setScanError('Failed to read image file. Please try again.');
    };
    reader.readAsDataURL(file);
  };

  // Perform Gemini AI OCR & Item Matching
  const triggerOcrScan = async (base64Data: string, type: string) => {
    setIsScanning(true);
    setScanError(null);
    setScanStep('Sending document image to Gemini Vision OCR...');

    try {
      setScanStep('Reading table columns: Qty, Item, Batch, Mfg, Expiry, Net Rate...');
      const response = await fetch('/api/erp/scan-grn-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: base64Data,
          mimeType: type
        })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to scan document.');
      }

      setScanStep('Matching extracted items with Pharmacy Inventory database...');
      const extracted: ScannedGrnDocument = data.extracted;

      // Ensure all items have necessary fields
      const processedItems: ScannedGrnItem[] = (extracted.items || []).map(item => {
        // Attempt local client-side fuzzy refinement if not matched on server
        let matchedId = item.matchedItemId;
        let matchedName = item.matchedItemName || item.rawItemName;
        let confidence = item.matchConfidence || 'NONE';

        if (!matchedId) {
          const rawClean = (item.rawItemName || '').toLowerCase().replace(/[^a-z0-9]/g, '');
          const localMatch = inventoryItems.find(inv => {
            const invClean = (inv.ItemName || '').toLowerCase().replace(/[^a-z0-9]/g, '');
            return invClean === rawClean || (invClean.length > 3 && rawClean.includes(invClean));
          });
          if (localMatch) {
            matchedId = localMatch.ItemID;
            matchedName = localMatch.ItemName;
            confidence = 'FUZZY';
          }
        }

        return {
          ...item,
          matchedItemId: matchedId,
          matchedItemName: matchedName,
          matchConfidence: confidence,
          quantity: Number(item.quantity) || 1,
          netRate: Number(item.netRate) || 0,
          amount: Number(item.amount) || ((Number(item.quantity) || 1) * (Number(item.netRate) || 0))
        };
      });

      extracted.items = processedItems;

      // Auto-detect linked PO if vendor or orderNo matches
      if (extracted.orderNo) {
        const foundPo = purchaseOrders.find(p =>
          p.POID.toLowerCase().includes(extracted.orderNo.toLowerCase()) ||
          extracted.orderNo.toLowerCase().includes(p.POID.toLowerCase())
        );
        if (foundPo) {
          setSelectedPoId(foundPo.POID);
        }
      } else if (extracted.matchedVendor) {
        const vendorPo = purchaseOrders.find(p =>
          p.VendorID === extracted.matchedVendor?.VendorID && p.Status !== 'Received'
        );
        if (vendorPo && !selectedPoId) {
          setSelectedPoId(vendorPo.POID);
        }
      }

      setScannedDoc(extracted);
    } catch (err: any) {
      console.error('OCR Error:', err);
      setScanError(err.message || 'Error occurred while scanning document. Please check network or try again.');
    } finally {
      setIsScanning(false);
      setScanStep('');
    }
  };

  // Update item field
  const handleItemFieldChange = (index: number, field: keyof ScannedGrnItem, value: any) => {
    if (!scannedDoc) return;
    const updated = [...scannedDoc.items];
    const target = { ...updated[index], [field]: value };

    if (field === 'quantity' || field === 'netRate') {
      const q = field === 'quantity' ? Number(value) || 0 : Number(target.quantity) || 0;
      const r = field === 'netRate' ? Number(value) || 0 : Number(target.netRate) || 0;
      target.amount = q * r;
    }

    updated[index] = target;

    const newTotal = updated.reduce((sum, itm) => sum + (Number(itm.amount) || 0), 0);
    setScannedDoc({
      ...scannedDoc,
      items: updated,
      totalAmount: newTotal
    });
  };

  // Remove line item
  const handleRemoveItem = (index: number) => {
    if (!scannedDoc) return;
    const updated = scannedDoc.items.filter((_, i) => i !== index);
    const newTotal = updated.reduce((sum, itm) => sum + (Number(itm.amount) || 0), 0);
    setScannedDoc({
      ...scannedDoc,
      items: updated,
      totalAmount: newTotal
    });
  };

  // Add line item manually
  const handleAddManualItem = () => {
    if (!scannedDoc) return;
    const newItem: ScannedGrnItem = {
      rawItemName: 'New Item',
      quantity: 1,
      batchNo: `B-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      mfgDate: new Date().toISOString().slice(2, 7).replace('-', '/'), // e.g. "26/09"
      expiryDate: new Date(Date.now() + 730 * 86400000).toISOString().slice(2, 7).replace('-', '/'),
      netRate: 100,
      amount: 100,
      matchedItemId: null,
      matchedItemName: 'New Item',
      matchConfidence: 'NONE'
    };
    const updated = [...scannedDoc.items, newItem];
    setScannedDoc({
      ...scannedDoc,
      items: updated,
      totalAmount: updated.reduce((sum, itm) => sum + (Number(itm.amount) || 0), 0)
    });
  };

  // Assign medicine from inventory to scanned item
  const handleSelectInventoryMatch = (index: number, invItem: any) => {
    if (!scannedDoc) return;
    const updated = [...scannedDoc.items];
    updated[index] = {
      ...updated[index],
      matchedItemId: invItem.ItemID,
      matchedItemName: invItem.ItemName,
      matchConfidence: 'EXACT',
      matchedCurrentStock: invItem.CStock,
      matchedRetailPrice: invItem.Price,
      netRate: updated[index].netRate || invItem.PurchasePrice || 0,
      amount: (Number(updated[index].quantity) || 1) * (Number(updated[index].netRate) || invItem.PurchasePrice || 0)
    };

    setScannedDoc({
      ...scannedDoc,
      items: updated,
      totalAmount: updated.reduce((sum, itm) => sum + (Number(itm.amount) || 0), 0)
    });
    setActiveItemSearchIdx(null);
    setMedicineSearchTerm('');
  };

  // Apply to GRN receiving form
  const handleApplyToGrn = () => {
    if (!scannedDoc) return;
    if (scannedDoc.items.length === 0) {
      alert('No medicine items extracted from the document.');
      return;
    }
    onApplyScannedDocument(scannedDoc, selectedPoId);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 z-[80] animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-6xl w-full p-5 sm:p-6 shadow-2xl border border-slate-100 space-y-4 max-h-[94vh] flex flex-col">
        {/* MODAL HEADER */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-200">
              <ScanLine className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-slate-900 text-lg">Scan Vendor GRN / Delivery Invoice</h3>
                <span className="bg-indigo-100 text-indigo-800 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase flex items-center space-x-1">
                  <Sparkles className="w-3 h-3 text-indigo-600" />
                  <span>AI Multimodal Vision OCR</span>
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Snap or upload vendor delivery documents (like BM Pvt Ltd, Glaxo, Abbott, etc.). AI extracts Qty, Item, Batch, Mfg, Expiry & Net Rates and automatically matches with Pharmacy Inventory.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 font-bold p-1.5 rounded-xl hover:bg-slate-100 cursor-pointer transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ERROR NOTIFICATION */}
        {scanError && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between text-rose-800 text-xs font-semibold shrink-0">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{scanError}</span>
            </div>
            {selectedImage && (
              <button
                type="button"
                onClick={() => triggerOcrScan(selectedImage, mimeType)}
                className="px-2.5 py-1 bg-rose-600 text-white rounded-lg text-[11px] font-bold hover:bg-rose-700 transition"
              >
                Retry Scan
              </button>
            )}
          </div>
        )}

        {/* MODAL MAIN CONTENT */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {/* TOP UPLOAD & CAMERA CONTROLS BAR */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-stretch">
            {/* DRAG & DROP / SELECT ZONE */}
            <div
              onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); setDragActive(true); }}
              onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setDragActive(true); }}
              onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setDragActive(false); }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setDragActive(false);
                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                  handleFileSelect(e.dataTransfer.files[0]);
                }
              }}
              className={`md:col-span-8 border-2 border-dashed rounded-2xl p-4 transition text-center flex flex-col items-center justify-center cursor-pointer ${
                dragActive
                  ? 'border-indigo-500 bg-indigo-50/70 scale-[0.99]'
                  : selectedImage
                  ? 'border-emerald-300 bg-emerald-50/30'
                  : 'border-slate-300 hover:border-indigo-400 bg-slate-50/60'
              }`}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,application/pdf"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileSelect(e.target.files[0]);
                  }
                }}
              />
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileSelect(e.target.files[0]);
                  }
                }}
              />

              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                  <UploadCloud className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <p className="text-xs font-bold text-slate-800">
                    {fileName ? `Selected: ${fileName}` : 'Drop vendor invoice photo here or click to browse'}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Supports JPEG, PNG, WEBP, or scanned PDF challans
                  </p>
                </div>
              </div>
            </div>

            {/* CAMERA SNAPSHOT BUTTON & QUICK ACTIONS */}
            <div className="md:col-span-4 flex items-center gap-2">
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="flex-1 h-full min-h-[52px] bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-bold text-xs rounded-2xl shadow-sm hover:shadow-md transition flex items-center justify-center space-x-2 px-3 cursor-pointer"
                title="Take immediate photo with smartphone or webcam"
              >
                <Camera className="w-4 h-4" />
                <span>Take Photo with Camera</span>
              </button>

              {selectedImage && (
                <button
                  type="button"
                  onClick={() => setShowImagePreview(!showImagePreview)}
                  className="px-3 h-full min-h-[52px] border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-2xl transition flex items-center justify-center space-x-1.5 cursor-pointer shrink-0"
                  title="Toggle visual image preview panel"
                >
                  <FileText className="w-4 h-4 text-indigo-600" />
                  <span className="hidden sm:inline">{showImagePreview ? 'Hide Photo' : 'View Photo'}</span>
                </button>
              )}
            </div>
          </div>

          {/* SCANNING IN PROGRESS STATE */}
          {isScanning && (
            <div className="p-6 bg-gradient-to-br from-indigo-50 to-emerald-50 rounded-2xl border border-indigo-200 text-center space-y-3 animate-pulse">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white mx-auto flex items-center justify-center shadow-lg animate-bounce">
                <Sparkles className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-slate-900 text-sm">Processing Document with Gemini AI...</h4>
              <p className="text-xs text-indigo-700 font-medium">{scanStep}</p>
              <div className="w-48 h-1.5 bg-indigo-200 rounded-full mx-auto overflow-hidden">
                <div className="w-full h-full bg-indigo-600 rounded-full animate-indeterminate" />
              </div>
            </div>
          )}

          {/* DOCUMENT SIDE-BY-SIDE / COLLAPSIBLE PREVIEW */}
          {selectedImage && showImagePreview && !isScanning && (
            <div className="bg-slate-900 rounded-2xl p-3 border border-slate-800 text-white space-y-2">
              <div className="flex items-center justify-between text-xs px-1">
                <span className="font-bold text-slate-300 flex items-center space-x-1.5">
                  <FileText className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Original Document Reference (Zoom to cross-check numbers)</span>
                </span>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setImageZoom(prev => Math.max(0.6, prev - 0.2))}
                    className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white"
                    title="Zoom Out"
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>
                  <span className="font-mono text-[10px] text-slate-400">{Math.round(imageZoom * 100)}%</span>
                  <button
                    type="button"
                    onClick={() => setImageZoom(prev => Math.min(2.5, prev + 0.2))}
                    className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white"
                    title="Zoom In"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setImageZoom(1)}
                    className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white"
                    title="Reset Zoom"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <div className="max-h-48 overflow-auto rounded-xl bg-slate-950 flex items-center justify-center p-2">
                <img
                  src={selectedImage}
                  alt="Scanned Document"
                  referrerPolicy="no-referrer"
                  style={{ transform: `scale(${imageZoom})`, transformOrigin: 'top center', transition: 'transform 0.15s ease' }}
                  className="max-h-44 object-contain rounded"
                />
              </div>
            </div>
          )}

          {/* PARSED DOCUMENT DETAILS & ITEMS VERIFICATION TABLE */}
          {scannedDoc && !isScanning && (
            <div className="space-y-4">
              {/* EXTRACTED HEADER CARD */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                {/* Vendor Name */}
                <div className="lg:col-span-2">
                  <label className="text-[11px] font-bold text-slate-600 block mb-1 flex items-center space-x-1">
                    <Building2 className="w-3 h-3 text-slate-500" />
                    <span>Vendor / Company</span>
                  </label>
                  <div className="flex items-center space-x-1.5">
                    <input
                      type="text"
                      value={scannedDoc.vendorName}
                      onChange={(e) => setScannedDoc({ ...scannedDoc, vendorName: e.target.value })}
                      className="w-full p-2 border border-slate-300 rounded-xl text-xs font-bold bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500"
                    />
                    {scannedDoc.matchedVendor && (
                      <span className="shrink-0 px-2 py-1 bg-emerald-100 text-emerald-800 rounded-lg text-[10px] font-black border border-emerald-300">
                        Registered ✓
                      </span>
                    )}
                  </div>
                </div>

                {/* Invoice No */}
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1 flex items-center space-x-1">
                    <Hash className="w-3 h-3 text-slate-500" />
                    <span>Invoice / Bill No.</span>
                  </label>
                  <input
                    type="text"
                    value={scannedDoc.invoiceNo}
                    onChange={(e) => setScannedDoc({ ...scannedDoc, invoiceNo: e.target.value })}
                    placeholder="BM-196,151"
                    className="w-full p-2 border border-slate-300 rounded-xl text-xs font-mono font-bold bg-white text-emerald-800 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {/* Invoice Date */}
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1 flex items-center space-x-1">
                    <Calendar className="w-3 h-3 text-slate-500" />
                    <span>Date</span>
                  </label>
                  <input
                    type="text"
                    value={scannedDoc.invoiceDate}
                    onChange={(e) => setScannedDoc({ ...scannedDoc, invoiceDate: e.target.value })}
                    placeholder="YYYY-MM-DD or DD-MM-YY"
                    className="w-full p-2 border border-slate-300 rounded-xl text-xs font-bold bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Payment Mode */}
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">
                    Payment Mode
                  </label>
                  <div className="flex items-center space-x-1">
                    <button
                      type="button"
                      onClick={() => setScannedDoc({ ...scannedDoc, paymentType: 'Credit' })}
                      className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-black transition flex items-center justify-center space-x-1 cursor-pointer ${
                        scannedDoc.paymentType === 'Credit'
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <CreditCard className="w-3 h-3" />
                      <span>Credit</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setScannedDoc({ ...scannedDoc, paymentType: 'Cash' })}
                      className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-black transition flex items-center justify-center space-x-1 cursor-pointer ${
                        scannedDoc.paymentType === 'Cash'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <Coins className="w-3 h-3" />
                      <span>Cash</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* PURCHASE ORDER LINKAGE */}
              <div className="bg-indigo-50/50 p-3 rounded-xl border border-indigo-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center space-x-2">
                  <Package className="w-4 h-4 text-indigo-600 shrink-0" />
                  <div>
                    <span className="text-xs font-bold text-slate-800">
                      Link with Purchase Order (Optional):
                    </span>
                    <span className="text-[11px] text-slate-500 ml-1">
                      {scannedDoc.orderNo ? `Document references Order #${scannedDoc.orderNo}` : 'Select PO to link, or receive as Direct GRN'}
                    </span>
                  </div>
                </div>
                <select
                  value={selectedPoId}
                  onChange={(e) => setSelectedPoId(e.target.value)}
                  className="p-1.5 border border-indigo-200 rounded-lg text-xs font-mono font-bold bg-white text-indigo-900 focus:outline-hidden"
                >
                  <option value="">-- Direct Delivery (No Prior PO) --</option>
                  {purchaseOrders.map((p, idx) => (
                    <option key={idx} value={p.POID}>
                      {p.POID} ({p.VendorName}) - {p.Status}
                    </option>
                  ))}
                </select>
              </div>

              {/* EXTRACTED MEDICINE ITEMS TABLE */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Extracted Medicine Items ({scannedDoc.items.length} line items)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddManualItem}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition flex items-center space-x-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Item</span>
                  </button>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-x-auto w-full">
                  <table className="w-full text-left text-xs min-w-[900px]">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                        <th className="p-2.5 w-8 text-center">#</th>
                        <th className="p-2.5 min-w-[200px]">Document Scanned Name</th>
                        <th className="p-2.5 min-w-[200px]">Matched Clinic Medicine</th>
                        <th className="p-2.5 text-center w-24">Batch No.</th>
                        <th className="p-2.5 text-center w-20">Mfg Date</th>
                        <th className="p-2.5 text-center w-20">Exp Date</th>
                        <th className="p-2.5 text-center w-20">Qty</th>
                        <th className="p-2.5 text-right w-24">Net Rate</th>
                        <th className="p-2.5 text-right w-24">Subtotal</th>
                        <th className="p-2.5 text-center w-12">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {scannedDoc.items.map((item, idx) => {
                        const isSearchOpen = activeItemSearchIdx === idx;
                        const filteredInventory = medicineSearchTerm
                          ? inventoryItems.filter(inv =>
                              (inv.ItemName || '').toLowerCase().includes(medicineSearchTerm.toLowerCase()) ||
                              (inv.ItemID || '').toLowerCase().includes(medicineSearchTerm.toLowerCase())
                            ).slice(0, 10)
                          : inventoryItems.slice(0, 8);

                        return (
                          <tr key={idx} className="hover:bg-slate-50 transition-colors">
                            <td className="p-2.5 text-center font-mono text-slate-400 font-bold">{idx + 1}</td>

                            {/* Raw Name */}
                            <td className="p-2.5 font-bold text-slate-800">
                              <input
                                type="text"
                                value={item.rawItemName}
                                onChange={(e) => handleItemFieldChange(idx, 'rawItemName', e.target.value)}
                                className="w-full p-1 border border-transparent hover:border-slate-300 rounded font-semibold text-slate-900 focus:bg-white focus:border-indigo-500"
                              />
                            </td>

                            {/* Matched Inventory Medicine & Confidence */}
                            <td className="p-2.5 relative">
                              <div className="flex items-center space-x-1.5">
                                <div className="flex-1">
                                  <div className="flex items-center space-x-1">
                                    <span className="font-bold text-slate-900 text-xs">
                                      {item.matchedItemName || item.rawItemName}
                                    </span>
                                    {item.matchedItemId && (
                                      <span className="text-[10px] font-mono text-indigo-600 bg-indigo-50 px-1 rounded">
                                        #{item.matchedItemId}
                                      </span>
                                    )}
                                  </div>

                                  {/* Confidence Badge */}
                                  <div className="flex items-center space-x-1 mt-0.5">
                                    {item.matchConfidence === 'EXACT' && (
                                      <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded text-[9px] font-black">
                                        Matched ✓
                                      </span>
                                    )}
                                    {item.matchConfidence === 'FUZZY' && (
                                      <span className="px-1.5 py-0.2 bg-amber-100 text-amber-800 rounded text-[9px] font-black">
                                        Fuzzy Match ~
                                      </span>
                                    )}
                                    {(!item.matchConfidence || item.matchConfidence === 'NONE') && (
                                      <span className="px-1.5 py-0.2 bg-blue-100 text-blue-800 rounded text-[9px] font-black">
                                        New Medicine +
                                      </span>
                                    )}
                                  </div>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => {
                                    if (isSearchOpen) {
                                      setActiveItemSearchIdx(null);
                                    } else {
                                      setActiveItemSearchIdx(idx);
                                      setMedicineSearchTerm('');
                                    }
                                  }}
                                  className="text-[10px] text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2 py-1 rounded-md font-bold border border-indigo-200 transition cursor-pointer shrink-0"
                                >
                                  Change
                                </button>
                              </div>

                              {/* Searchable Medicine Match Dropdown */}
                              {isSearchOpen && (
                                <div className="absolute left-0 top-full mt-1 w-80 bg-white border border-slate-200 rounded-xl shadow-xl z-50 p-2 space-y-2 animate-in fade-in duration-100">
                                  <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                                    <span className="text-[11px] font-bold text-slate-700">Select Existing Medicine:</span>
                                    <button
                                      type="button"
                                      onClick={() => setActiveItemSearchIdx(null)}
                                      className="text-slate-400 hover:text-slate-600"
                                    >
                                      ✕
                                    </button>
                                  </div>
                                  <div className="relative">
                                    <Search className="w-3.5 h-3.5 absolute left-2 top-2 text-slate-400" />
                                    <input
                                      type="text"
                                      placeholder="Search pharmacy stock..."
                                      value={medicineSearchTerm}
                                      onChange={(e) => setMedicineSearchTerm(e.target.value)}
                                      className="w-full pl-7 pr-2 py-1 text-xs border rounded-lg focus:outline-hidden"
                                      autoFocus
                                    />
                                  </div>
                                  <div className="max-h-48 overflow-y-auto space-y-1">
                                    {filteredInventory.map((inv, invIdx) => (
                                      <button
                                        key={invIdx}
                                        type="button"
                                        onClick={() => handleSelectInventoryMatch(idx, inv)}
                                        className="w-full text-left p-1.5 rounded-lg hover:bg-indigo-50 transition text-xs flex items-center justify-between cursor-pointer"
                                      >
                                        <div>
                                          <p className="font-bold text-slate-800">{inv.ItemName}</p>
                                          <p className="text-[10px] text-slate-400">ID: {inv.ItemID} | Stock: {inv.CStock ?? 0}</p>
                                        </div>
                                        <span className="text-[11px] font-mono text-indigo-700 font-bold">
                                          Rs. {inv.Price || inv.PurchasePrice || 0}
                                        </span>
                                      </button>
                                    ))}
                                    <button
                                      type="button"
                                      onClick={() => {
                                        handleItemFieldChange(idx, 'matchedItemId', null);
                                        handleItemFieldChange(idx, 'matchConfidence', 'NONE');
                                        setActiveItemSearchIdx(null);
                                      }}
                                      className="w-full text-center p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-blue-700 font-bold text-[11px] transition mt-1"
                                    >
                                      + Keep as New Medicine in Catalog
                                    </button>
                                  </div>
                                </div>
                              )}
                            </td>

                            {/* Batch No */}
                            <td className="p-2.5 text-center">
                              <input
                                type="text"
                                value={item.batchNo || ''}
                                onChange={(e) => handleItemFieldChange(idx, 'batchNo', e.target.value)}
                                className="w-20 p-1 border border-amber-200 rounded-lg text-xs text-center font-mono font-bold bg-amber-50 text-amber-900"
                              />
                            </td>

                            {/* Mfg Date */}
                            <td className="p-2.5 text-center">
                              <input
                                type="text"
                                value={item.mfgDate || ''}
                                placeholder="MM/YY"
                                onChange={(e) => handleItemFieldChange(idx, 'mfgDate', e.target.value)}
                                className="w-18 p-1 border border-slate-200 rounded-lg text-xs text-center font-mono bg-white text-slate-700"
                              />
                            </td>

                            {/* Expiry Date */}
                            <td className="p-2.5 text-center">
                              <input
                                type="text"
                                value={item.expiryDate || ''}
                                placeholder="MM/YY"
                                onChange={(e) => handleItemFieldChange(idx, 'expiryDate', e.target.value)}
                                className="w-18 p-1 border border-rose-200 rounded-lg text-xs text-center font-mono font-bold bg-rose-50/50 text-rose-900"
                              />
                            </td>

                            {/* Quantity */}
                            <td className="p-2.5 text-center">
                              <input
                                type="number"
                                min="1"
                                value={item.quantity}
                                onChange={(e) => handleItemFieldChange(idx, 'quantity', e.target.value)}
                                className="w-16 p-1 border border-emerald-300 rounded-lg text-xs text-center font-bold bg-emerald-50/40 text-emerald-900"
                              />
                            </td>

                            {/* Net Rate */}
                            <td className="p-2.5 text-right">
                              <div className="flex items-center justify-end space-x-1">
                                <span className="text-[10px] text-slate-400 font-bold">Rs.</span>
                                <input
                                  type="number"
                                  min="0"
                                  step="any"
                                  value={item.netRate}
                                  onChange={(e) => handleItemFieldChange(idx, 'netRate', e.target.value)}
                                  className="w-20 p-1 border border-slate-300 rounded-lg text-xs text-right font-bold bg-white text-slate-900"
                                />
                              </div>
                            </td>

                            {/* Subtotal */}
                            <td className="p-2.5 text-right font-bold text-slate-900">
                              Rs. {((Number(item.amount) || 0)).toLocaleString()}
                            </td>

                            {/* Delete Action */}
                            <td className="p-2.5 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveItem(idx)}
                                className="text-slate-400 hover:text-rose-600 p-1 rounded-lg hover:bg-rose-50 transition cursor-pointer"
                                title="Remove line item"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* MODAL FOOTER */}
        <div className="border-t border-slate-100 pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center space-x-4">
            {scannedDoc && (
              <>
                <div>
                  <span className="text-[11px] text-slate-500 font-bold block">Total Line Items</span>
                  <span className="text-sm font-black text-slate-800">{scannedDoc.items.length} items</span>
                </div>
                <div className="h-6 w-px bg-slate-200" />
                <div>
                  <span className="text-[11px] text-slate-500 font-bold block">Total Inward Value</span>
                  <span className="text-sm font-black text-emerald-700">
                    Rs. {(scannedDoc.totalAmount || 0).toLocaleString()}
                  </span>
                </div>
              </>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleApplyToGrn}
              disabled={!scannedDoc || scannedDoc.items.length === 0 || isScanning}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs transition shadow-md flex items-center space-x-2 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Apply to GRN Receiving Form</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
export default ScanGrnDocumentModal;
