import React from 'react';
import { ShoppingCart, X, Printer } from 'lucide-react';
import { WhatsAppIcon } from '../erpUtils';
import { ErpPurchaseOrder, ClinicSettings, User } from '../../../types';
import { generateWhatsAppPurchaseOrderText } from '../../../utils/whatsappUtils';

interface WhatsAppPoModalProps {
  showWhatsAppPoModal: boolean;
  setShowWhatsAppPoModal: (show: boolean) => void;
  selectedPoForWhatsApp: ErpPurchaseOrder | null;
  whatsAppVendorPhone: string;
  setWhatsAppVendorPhone: (phone: string) => void;
  whatsAppCustomPoNotes: string;
  setWhatsAppCustomPoNotes: (notes: string) => void;
  whatsAppIncludePrices?: boolean;
  setWhatsAppIncludePrices?: (inc: boolean) => void;
  whatsAppPoTextPreview?: string;
  handleSendPoWhatsApp: (withPrint?: boolean) => void;
  clinicSettings?: ClinicSettings;
  currentUser?: User | null;
}

export const WhatsAppPoModal: React.FC<WhatsAppPoModalProps> = ({
  showWhatsAppPoModal,
  setShowWhatsAppPoModal,
  selectedPoForWhatsApp,
  whatsAppVendorPhone,
  setWhatsAppVendorPhone,
  whatsAppCustomPoNotes,
  setWhatsAppCustomPoNotes,
  handleSendPoWhatsApp,
  clinicSettings,
  currentUser,
}) => {
  if (!showWhatsAppPoModal || !selectedPoForWhatsApp) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 animate-in fade-in zoom-in duration-150 my-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5 shrink-0 bg-white rounded-t-2xl">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-xs shrink-0">
              <WhatsAppIcon className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-tight">Send Purchase Order via WhatsApp</h3>
              <p className="text-[11px] text-slate-500">Send formatted order details & PDF directly to Vendor</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowWhatsAppPoModal(false)}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-5 py-3.5 space-y-3">
          {/* PO & Vendor Brief Summary */}
          <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-3 flex items-center justify-between">
            <div>
              <div className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">Purchase Order</div>
              <div className="text-xs sm:text-sm font-black font-mono text-emerald-950">{selectedPoForWhatsApp.POID}</div>
              <div className="text-xs font-bold text-slate-800 truncate max-w-[200px] sm:max-w-xs">{selectedPoForWhatsApp.VendorName}</div>
            </div>
            <div className="text-right shrink-0">
              <div className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">Total Amount</div>
              <div className="text-xs sm:text-sm font-extrabold text-emerald-900 font-mono">
                Rs. {Number(selectedPoForWhatsApp.TotalAmount || 0).toLocaleString()}
              </div>
              <div className="text-[10px] font-bold text-slate-600">
                {selectedPoForWhatsApp.Items?.length || 0} Medicines Ordered
              </div>
            </div>
          </div>

          {/* Vendor WhatsApp Phone Number Input */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700">
              Vendor WhatsApp Number <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. 03001234567 or +923001234567"
              value={whatsAppVendorPhone}
              onChange={e => setWhatsAppVendorPhone(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
            <p className="text-[10.5px] text-slate-500 leading-tight">
              Enter vendor mobile number (e.g. 03001234567 or international 923001234567).
            </p>
          </div>

          {/* Custom Notes / Delivery Instructions */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700">
              Special Delivery Instructions / Urgency (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Urgent delivery needed by tomorrow afternoon..."
              value={whatsAppCustomPoNotes}
              onChange={e => setWhatsAppCustomPoNotes(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          {/* WhatsApp Text Preview */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-700">WhatsApp Message Preview</label>
              <span className="text-[9.5px] font-bold text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded">Auto-Formatted</span>
            </div>
            <div className="p-2.5 bg-slate-900 text-slate-100 rounded-xl text-[10.5px] font-mono whitespace-pre-wrap max-h-32 sm:max-h-36 overflow-y-auto border border-slate-800 leading-relaxed shadow-inner">
              {generateWhatsAppPurchaseOrderText({
                poId: selectedPoForWhatsApp.POID,
                vendorName: selectedPoForWhatsApp.VendorName,
                vendorPhone: whatsAppVendorPhone,
                orderDate: selectedPoForWhatsApp.OrderDate,
                expectedDeliveryDate: selectedPoForWhatsApp.ExpectedDeliveryDate,
                totalAmount: selectedPoForWhatsApp.TotalAmount,
                paymentMethod: selectedPoForWhatsApp.PaymentMethod || (selectedPoForWhatsApp as any).PaymentTerms,
                items: selectedPoForWhatsApp.Items || [],
                notes: whatsAppCustomPoNotes,
                clinicName: clinicSettings?.ClinicName || 'PUNJAB HOMEOPATHIC CLINIC & PHARMACY',
                clinicAddress: clinicSettings?.ClinicAddress || '10 Shalimar Road, Garhi Shahu, Lahore',
                clinicPhone: clinicSettings?.PhoneMobile || '+92-311-4000608',
                preparedBy: currentUser?.FullName || 'Mr. Zaigham Ali Anjum'
              })}
            </div>
          </div>
        </div>

        {/* Modal Fixed Footer */}
        <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-2 px-5 py-3 border-t border-slate-100 bg-slate-50/90 rounded-b-2xl shrink-0">
          <button
            type="button"
            onClick={() => setShowWhatsAppPoModal(false)}
            className="w-full sm:w-auto px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
          >
            Cancel
          </button>

          <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => handleSendPoWhatsApp(false)}
              className="w-full sm:w-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition flex items-center justify-center space-x-1.5 cursor-pointer shadow-xs"
            >
              <WhatsAppIcon className="w-4 h-4 text-white" />
              <span className="whitespace-nowrap">Send Text on WhatsApp</span>
            </button>

            <button
              type="button"
              onClick={() => handleSendPoWhatsApp(true)}
              className="w-full sm:w-auto px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition flex items-center justify-center space-x-1.5 cursor-pointer shadow-xs border border-slate-700"
              title="Opens WhatsApp AND generates official PO PDF print so you can attach it to the vendor"
            >
              <Printer className="w-4 h-4 text-emerald-400" />
              <span className="whitespace-nowrap">Send on WhatsApp & PDF</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WhatsAppPoModal;
