/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import {
  Undo2,
  Search,
  Calendar,
  AlertTriangle,
  RotateCcw,
  CheckCircle,
  FileText,
  Printer,
  X,
  Sparkles,
  RefreshCw,
  Plus,
  Minus,
  Check,
  Receipt,
  User,
  Clock,
  ArrowRight,
  ChevronRight,
  DollarSign
} from 'lucide-react';
import { Item, InvoiceHeader, InvoiceDetail, SRInvHeader, SRInvDetail, Patient } from '../../types';

interface ReturnBasketRow {
  ItemID: string;
  ItemName: string;
  Unit: string;
  MedicineType: 'C' | 'P' | 'S';
  OriginalQty: number;
  QtyReturned: number;
  PriceRef: number;
  LineTotal: number;
}

interface PharmacyReturnsTabProps {
  activeSubTab: string;
  salesReturns: SRInvHeader[];
  returnDetails: SRInvDetail[];
  returnSearchTerm?: string;
  setReturnSearchTerm?: (v: string) => void;
  returnDateFilter?: string;
  setReturnDateFilter?: (v: string) => void;
  isReturnSubmitting?: boolean;
  setIsReturnSubmitting?: (v: boolean) => void;
  items: Item[];
  invoices: InvoiceHeader[];
  invoiceDetails: InvoiceDetail[];
  onAddSalesReturn: (srHeader: SRInvHeader, srDetails: SRInvDetail[]) => void;
  patients?: Patient[];
  currentUser?: any;
  clinicSettings?: any;
  setItems?: React.Dispatch<React.SetStateAction<Item[]>>;
  lookupInvoiceNo?: string;
  setLookupInvoiceNo?: (v: string) => void;
  matchedInvoice?: any;
  setMatchedInvoice?: (inv: any) => void;
  returnBasket?: any[];
  setReturnBasket?: (b: any[]) => void;
  returnRemarks?: string;
  setReturnRemarks?: (r: string) => void;
  returnSuccess?: string;
  handleLookupInvoice?: (e?: React.FormEvent) => void;
  handlePostSalesReturn?: (e?: React.FormEvent) => void;
  getPatientName?: (id: string) => string;
  canPost?: boolean;
}

export const PharmacyReturnsTab: React.FC<PharmacyReturnsTabProps> = ({
  activeSubTab,
  salesReturns = [],
  returnDetails = [],
  returnSearchTerm: externalSearchTerm,
  setReturnSearchTerm: externalSetSearchTerm,
  returnDateFilter: externalDateFilter,
  setReturnDateFilter: externalSetDateFilter,
  isReturnSubmitting: externalIsSubmitting,
  setIsReturnSubmitting: externalSetIsSubmitting,
  items = [],
  invoices = [],
  invoiceDetails = [],
  onAddSalesReturn,
  patients = [],
  currentUser,
  clinicSettings,
  setItems,
  lookupInvoiceNo: externalLookupNo,
  setLookupInvoiceNo: externalSetLookupNo,
  matchedInvoice: externalMatchedInv,
  setMatchedInvoice: externalSetMatchedInv,
  returnBasket: externalReturnBasket,
  setReturnBasket: externalSetReturnBasket,
  returnRemarks: externalReturnRemarks,
  setReturnRemarks: externalSetReturnRemarks,
  returnSuccess: externalReturnSuccess,
  handleLookupInvoice: externalHandleLookup,
  handlePostSalesReturn: externalHandlePost,
  getPatientName: externalGetPatientName,
  canPost: externalCanPost
}) => {
  // 1. Internal state fallbacks (ensures textbox and worksheet ALWAYS work even if parent props are omitted)
  const [internalLookupNo, setInternalLookupNo] = useState<string>(externalLookupNo || '');
  const [internalMatchedInv, setInternalMatchedInv] = useState<InvoiceHeader | null>(externalMatchedInv || null);
  const [internalReturnBasket, setInternalReturnBasket] = useState<ReturnBasketRow[]>(externalReturnBasket || []);
  const [internalRemarks, setInternalRemarks] = useState<string>(externalReturnRemarks || '');
  const [internalSuccessMsg, setInternalSuccessMsg] = useState<string>(externalReturnSuccess || '');
  const [internalErrorMsg, setInternalErrorMsg] = useState<string>('');
  const [internalSearchTerm, setInternalSearchTerm] = useState<string>(externalSearchTerm || '');
  const [internalDateFilter, setInternalDateFilter] = useState<string>(externalDateFilter || '');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState<boolean>(false);

  // Sync external lookup if provided
  useEffect(() => {
    if (externalLookupNo !== undefined && externalLookupNo !== internalLookupNo) {
      setInternalLookupNo(externalLookupNo);
    }
  }, [externalLookupNo]);

  // Current Lookup Value & Setter
  const lookupNo = internalLookupNo;
  const setLookupNo = (val: string) => {
    setInternalLookupNo(val);
    if (externalSetLookupNo) {
      externalSetLookupNo(val);
    }
  };

  // Matched Invoice Value & Setter
  const currentMatchedInvoice = externalMatchedInv !== undefined ? externalMatchedInv : internalMatchedInv;
  const setCurrentMatchedInvoice = (inv: InvoiceHeader | null) => {
    setInternalMatchedInv(inv);
    if (externalSetMatchedInv) {
      externalSetMatchedInv(inv);
    }
  };

  // Return Basket Value & Setter
  const currentReturnBasket = (externalReturnBasket && externalReturnBasket.length > 0)
    ? externalReturnBasket
    : internalReturnBasket;
  const setCurrentReturnBasket = (basket: ReturnBasketRow[]) => {
    setInternalReturnBasket(basket);
    if (externalSetReturnBasket) {
      externalSetReturnBasket(basket);
    }
  };

  // Remarks Value & Setter
  const currentRemarks = externalReturnRemarks !== undefined ? externalReturnRemarks : internalRemarks;
  const setCurrentRemarks = (r: string) => {
    setInternalRemarks(r);
    if (externalSetReturnRemarks) {
      externalSetReturnRemarks(r);
    }
  };

  // Search in ledger
  const ledgerSearch = externalSearchTerm !== undefined ? externalSearchTerm : internalSearchTerm;
  const setLedgerSearch = (v: string) => {
    setInternalSearchTerm(v);
    if (externalSetSearchTerm) {
      externalSetSearchTerm(v);
    }
  };

  // Date filter in ledger
  const ledgerDateFilter = externalDateFilter !== undefined ? externalDateFilter : internalDateFilter;
  const setLedgerDateFilter = (v: string) => {
    setInternalDateFilter(v);
    if (externalSetDateFilter) {
      externalSetDateFilter(v);
    }
  };

  // Patient Name Helper
  const resolvePatientName = (patientId: string) => {
    if (externalGetPatientName) {
      const name = externalGetPatientName(patientId);
      if (name && name !== patientId) return name;
    }
    const pat = patients.find(p => p.PatientID === patientId);
    return pat ? pat.PatientName : patientId || 'Walk-in Customer';
  };

  // Recent 10 Invoices for Quick Suggestions
  const recentInvoices = useMemo(() => {
    return [...invoices]
      .sort((a, b) => (b.InvoiceDate || '').localeCompare(a.InvoiceDate || ''))
      .slice(0, 8);
  }, [invoices]);

  // Filtered Invoices suggestions when typing
  const searchSuggestions = useMemo(() => {
    const q = lookupNo.trim().toLowerCase();
    if (!q) return [];
    return invoices.filter(inv => {
      const invNo = (inv.InvoiceNo || '').toLowerCase();
      const patId = (inv.PatientID || '').toLowerCase();
      const patName = resolvePatientName(inv.PatientID).toLowerCase();
      return invNo.includes(q) || patId.includes(q) || patName.includes(q);
    }).slice(0, 6);
  }, [invoices, lookupNo, patients]);

  // Load a selected Invoice into the Return Worksheet
  const loadInvoiceForReturn = (targetInvoice: InvoiceHeader) => {
    setInternalErrorMsg('');
    setInternalSuccessMsg('');
    setCurrentMatchedInvoice(targetInvoice);
    setLookupNo(targetInvoice.InvoiceNo);
    setShowSearchDropdown(false);

    // Find all item lines for this invoice
    const lines = invoiceDetails.filter(d => d.InvoiceNo === targetInvoice.InvoiceNo);
    if (lines.length === 0) {
      setInternalErrorMsg(`No medicine lines found in invoice details for "${targetInvoice.InvoiceNo}".`);
      setCurrentReturnBasket([]);
      return;
    }

    const basketRows: ReturnBasketRow[] = lines.map(line => {
      const masterItem = items.find(i => i.ItemID === line.ItemID);
      return {
        ItemID: line.ItemID,
        ItemName: masterItem?.ItemName || line.ItemID,
        Unit: masterItem?.Unit || 'Tab',
        MedicineType: (masterItem?.MedicineType || line.MedicineType || 'P') as any,
        OriginalQty: Number(line.Qty) || 0,
        QtyReturned: 0, // Default to 0, allow cashier to pick items to return
        PriceRef: Number(line.Price) || 0,
        LineTotal: 0
      };
    });

    setCurrentReturnBasket(basketRows);
    setCurrentRemarks(`Customer Return for Invoice #${targetInvoice.InvoiceNo}`);
  };

  // Lookup Invoice Handler
  const handleLookupSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setInternalErrorMsg('');
    setInternalSuccessMsg('');

    const term = lookupNo.trim();
    if (!term) {
      setInternalErrorMsg('Please enter an Invoice Number or Customer Name to search.');
      return;
    }

    // Try exact or case-insensitive match by InvoiceNo
    let match = invoices.find(i => i.InvoiceNo.toLowerCase() === term.toLowerCase());
    
    // Fallback: match by partial invoice number or patient ID/Name
    if (!match) {
      match = invoices.find(i => {
        const invNo = i.InvoiceNo.toLowerCase();
        const pId = (i.PatientID || '').toLowerCase();
        const pName = resolvePatientName(i.PatientID).toLowerCase();
        return invNo.includes(term.toLowerCase()) || pId.includes(term.toLowerCase()) || pName.includes(term.toLowerCase());
      });
    }

    if (!match) {
      setInternalErrorMsg(`No invoice found matching "${term}". Please check the Invoice No (e.g. INV-2026-0001).`);
      setCurrentMatchedInvoice(null);
      setCurrentReturnBasket([]);
      return;
    }

    loadInvoiceForReturn(match);
  };

  // Update Return Quantity for a row
  const handleQtyReturnedChange = (index: number, newQty: number) => {
    const updated = [...currentReturnBasket];
    const row = updated[index];
    if (!row) return;

    const clamped = Math.max(0, Math.min(row.OriginalQty, newQty));
    row.QtyReturned = clamped;
    row.LineTotal = clamped * row.PriceRef;
    setCurrentReturnBasket(updated);
  };

  // Quick Action: Return All / Return Full Invoice
  const handleReturnAllItems = () => {
    const updated = currentReturnBasket.map(row => ({
      ...row,
      QtyReturned: row.OriginalQty,
      LineTotal: row.OriginalQty * row.PriceRef
    }));
    setCurrentReturnBasket(updated);
  };

  // Quick Action: Reset All Return Quantities to 0
  const handleResetReturnQty = () => {
    const updated = currentReturnBasket.map(row => ({
      ...row,
      QtyReturned: 0,
      LineTotal: 0
    }));
    setCurrentReturnBasket(updated);
  };

  // Financial Calculations
  const totalItemsReturned = useMemo(() => {
    return currentReturnBasket.reduce((sum, r) => sum + (Number(r.QtyReturned) || 0), 0);
  }, [currentReturnBasket]);

  const grossReturnRefund = useMemo(() => {
    return currentReturnBasket.reduce((sum, r) => sum + ((Number(r.QtyReturned) || 0) * (Number(r.PriceRef) || 0)), 0);
  }, [currentReturnBasket]);

  // Prorated discount reduction if invoice had discount
  const proratedDiscountAdjustment = useMemo(() => {
    if (!currentMatchedInvoice || !currentMatchedInvoice.GAmount || currentMatchedInvoice.GAmount <= 0) return 0;
    const origDiscount = Number(currentMatchedInvoice.Discount) || 0;
    if (origDiscount <= 0) return 0;
    const ratio = grossReturnRefund / currentMatchedInvoice.GAmount;
    return Math.round(origDiscount * ratio);
  }, [currentMatchedInvoice, grossReturnRefund]);

  const netCashRefundPayable = Math.max(0, grossReturnRefund - proratedDiscountAdjustment);

  // Post Sales Return Handler
  const handlePostReturn = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setInternalErrorMsg('');
    setInternalSuccessMsg('');

    if (!currentMatchedInvoice) {
      setInternalErrorMsg('No invoice loaded. Please search and select an invoice first.');
      return;
    }

    const returnedLines = currentReturnBasket.filter(r => r.QtyReturned > 0);
    if (returnedLines.length === 0) {
      setInternalErrorMsg('Please specify at least 1 item with Quantity to Return (> 0).');
      return;
    }

    if (!currentRemarks.trim()) {
      setInternalErrorMsg('Please enter a Return Reason / Internal Remarks.');
      return;
    }

    const currentYear = new Date().getFullYear();
    const srNo = `SR-${currentYear}-${Date.now().toString().slice(-4)}`;
    const today = new Date().toISOString().split('T')[0];

    const srHeader: SRInvHeader = {
      SRInvoiceNo: srNo,
      OriginalInvoiceNo: currentMatchedInvoice.InvoiceNo,
      ReturnDate: today,
      shift: (currentMatchedInvoice.shift as any) || 1,
      NetPaid: netCashRefundPayable,
      Remarks: currentRemarks.trim()
    };

    const srDetailsList: SRInvDetail[] = returnedLines.map(r => ({
      SRInvoiceNo: srNo,
      ItemID: r.ItemID,
      QtyReturned: r.QtyReturned,
      PriceRef: r.PriceRef,
      LineTotal: r.LineTotal
    }));

    try {
      setIsSubmitting(true);

      // 1. Call parent onAddSalesReturn
      if (onAddSalesReturn) {
        await onAddSalesReturn(srHeader, srDetailsList);
      }

      // 2. Restock inventory items in local memory and database
      if (setItems) {
        setItems(prevItems => {
          return prevItems.map(itm => {
            const ret = returnedLines.find(r => r.ItemID === itm.ItemID);
            if (!ret) return itm;

            const newStock = itm.CStock + ret.QtyReturned;
            let updatedBatches = itm.Batches;

            if (Array.isArray(itm.Batches) && itm.Batches.length > 0) {
              // Add restocked quantity back to the primary active batch
              updatedBatches = itm.Batches.map((b, idx) => {
                if (idx === 0) {
                  return { ...b, Qty: (b.Qty || 0) + ret.QtyReturned };
                }
                return b;
              });
            }

            return {
              ...itm,
              CStock: newStock,
              Batches: updatedBatches
            };
          });
        });
      }

      setInternalSuccessMsg(
        `✅ Sales Return "${srNo}" posted successfully! Restocked ${totalItemsReturned} units. Cash Refund Paid: Rs. ${netCashRefundPayable.toLocaleString()}`
      );

      // Reset worksheet
      setCurrentMatchedInvoice(null);
      setCurrentReturnBasket([]);
      setLookupNo('');
      setCurrentRemarks('');
    } catch (err: any) {
      setInternalErrorMsg(`Failed to post sales return: ${err?.message || 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Print Return Voucher Slip Helper
  const handlePrintReturnVoucher = (sr: SRInvHeader, specificDetails?: SRInvDetail[]) => {
    const details = specificDetails || returnDetails.filter(d => d.SRInvoiceNo === sr.SRInvoiceNo);
    const origInv = invoices.find(i => i.InvoiceNo === sr.OriginalInvoiceNo);
    const patName = origInv ? resolvePatientName(origInv.PatientID) : 'Customer';
    const clinicName = clinicSettings?.ClinicName || 'Punjab Homeopathic Clinic';
    const clinicPhone = clinicSettings?.Phone || '0300-1234567';

    const printWin = window.open('', '_blank', 'width=650,height=800');
    if (!printWin) {
      alert('Pop-up blocked. Please allow popups to print Return Vouchers.');
      return;
    }

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Sales Return Voucher - ${sr.SRInvoiceNo}</title>
          <style>
            @page { size: 80mm 200mm; margin: 4mm; }
            body { font-family: monospace, sans-serif; font-size: 11px; margin: 0; padding: 6px; color: #000; }
            .text-center { text-align: center; }
            .header { border-bottom: 1px dashed #000; padding-bottom: 6px; margin-bottom: 6px; }
            .clinic-name { font-size: 14px; font-weight: bold; }
            .title-badge { font-weight: bold; background: #eee; padding: 2px 4px; display: inline-block; margin: 4px 0; }
            .info-row { display: flex; justify-content: space-between; margin-bottom: 3px; font-size: 10px; }
            table { width: 100%; border-collapse: collapse; margin: 8px 0; }
            th { border-bottom: 1px solid #000; font-size: 10px; text-align: left; padding: 3px 0; }
            td { padding: 3px 0; font-size: 10.5px; }
            .total-box { border-top: 1px dashed #000; border-bottom: 1px dashed #000; padding: 4px 0; margin-top: 4px; }
            .footer { text-align: center; margin-top: 14px; font-size: 9.5px; }
            .sig-row { display: flex; justify-content: space-between; margin-top: 25px; padding-top: 4px; }
            .sig-box { width: 45%; border-top: 1px dotted #000; text-align: center; font-size: 9px; }
          </style>
        </head>
        <body>
          <div class="header text-center">
            <div class="clinic-name">${clinicName}</div>
            <div style="font-size: 10px;">${clinicSettings?.Address || 'Pharmacy & Medical Center'}</div>
            <div style="font-size: 10px;">Ph: ${clinicPhone}</div>
            <div class="title-badge">SALES RETURN / CREDIT NOTE</div>
          </div>

          <div class="info-row">
            <span><strong>Voucher #:</strong> ${sr.SRInvoiceNo}</span>
            <span><strong>Date:</strong> ${sr.ReturnDate}</span>
          </div>
          <div class="info-row">
            <span><strong>Orig Invoice:</strong> ${sr.OriginalInvoiceNo}</span>
            <span><strong>Shift:</strong> ${sr.shift === 1 ? 'Morning' : 'Evening'}</span>
          </div>
          <div class="info-row">
            <span><strong>Customer:</strong> ${patName}</span>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 50%;">Item</th>
                <th style="width: 15%; text-align: center;">Qty</th>
                <th style="width: 15%; text-align: right;">Rate</th>
                <th style="width: 20%; text-align: right;">Refund</th>
              </tr>
            </thead>
            <tbody>
              ${details.map(d => {
                const itm = items.find(i => i.ItemID === d.ItemID);
                return `
                  <tr>
                    <td>${itm?.ItemName || d.ItemID}</td>
                    <td style="text-align: center;">${d.QtyReturned}</td>
                    <td style="text-align: right;">${d.PriceRef}</td>
                    <td style="text-align: right;">${d.LineTotal || (d.QtyReturned * d.PriceRef)}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>

          <div class="total-box">
            <div class="info-row" style="font-size: 12px; font-weight: bold;">
              <span>TOTAL CASH REFUND:</span>
              <span>Rs. ${Number(sr.NetPaid).toLocaleString()}</span>
            </div>
            ${sr.Remarks ? `<div style="font-size: 9.5px; margin-top: 3px;"><strong>Reason:</strong> ${sr.Remarks}</div>` : ''}
          </div>

          <div class="sig-row">
            <div class="sig-box">Cashier Signature</div>
            <div class="sig-box">Customer Signature</div>
          </div>

          <div class="footer">
            <div>Medicines returned to inventory in good condition.</div>
            <div>Thank you for your visit!</div>
          </div>

          <script>
            window.onload = function() {
              setTimeout(() => { window.print(); }, 250);
            };
          </script>
        </body>
      </html>
    `;

    printWin.document.write(html);
    printWin.document.close();
  };

  // Filtered Return Logs
  const filteredSalesReturns = useMemo(() => {
    return salesReturns.filter(sr => {
      // Date filter
      if (ledgerDateFilter && sr.ReturnDate !== ledgerDateFilter) {
        return false;
      }
      // Search term
      if (ledgerSearch.trim()) {
        const q = ledgerSearch.toLowerCase().trim();
        const srNoMatch = (sr.SRInvoiceNo || '').toLowerCase().includes(q);
        const invNoMatch = (sr.OriginalInvoiceNo || '').toLowerCase().includes(q);
        const remarksMatch = (sr.Remarks || '').toLowerCase().includes(q);
        
        // Find patient name from original invoice
        const origInv = invoices.find(i => i.InvoiceNo === sr.OriginalInvoiceNo);
        const patNameMatch = origInv && resolvePatientName(origInv.PatientID).toLowerCase().includes(q);

        return srNoMatch || invNoMatch || remarksMatch || patNameMatch;
      }
      return true;
    });
  }, [salesReturns, ledgerDateFilter, ledgerSearch, invoices, patients]);

  if (activeSubTab !== 'return') return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fadeIn" id="pos-returns-tab">
      
      {/* LEFT COLUMN: Invoice Lookup & Return Worksheet (7 cols) */}
      <div className="lg:col-span-7 space-y-4">
        
        {/* Worksheet Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-wrap gap-2">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
                <Undo2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 tracking-tight">
                  Invoice Reversals / Returns Worksheet
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Search invoice, pick medicine lines, set return quantities, and credit customer cash refund.
                </p>
              </div>
            </div>

            {currentMatchedInvoice && (
              <button
                type="button"
                onClick={() => {
                  setCurrentMatchedInvoice(null);
                  setCurrentReturnBasket([]);
                  setLookupNo('');
                }}
                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-bold transition flex items-center space-x-1 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Clear / New Search</span>
              </button>
            )}
          </div>

          {/* Feedback Messages */}
          {internalSuccessMsg && (
            <div className="p-3.5 bg-emerald-50 text-emerald-900 text-xs rounded-xl font-bold border border-emerald-300 flex items-center space-x-2 animate-fadeIn shadow-2xs">
              <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
              <span className="flex-1">{internalSuccessMsg}</span>
              <button
                type="button"
                onClick={() => setInternalSuccessMsg('')}
                className="text-emerald-700 hover:text-emerald-900 text-xs"
              >
                ✕
              </button>
            </div>
          )}

          {internalErrorMsg && (
            <div className="p-3.5 bg-rose-50 text-rose-900 text-xs rounded-xl font-bold border border-rose-300 flex items-center space-x-2 animate-fadeIn shadow-2xs">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
              <span className="flex-1">{internalErrorMsg}</span>
              <button
                type="button"
                onClick={() => setInternalErrorMsg('')}
                className="text-rose-700 hover:text-rose-900 text-xs"
              >
                ✕
              </button>
            </div>
          )}

          {/* 1. Invoice Lookup Form with Interactive Search & Suggestions */}
          <form onSubmit={handleLookupSubmit} className="space-y-2 relative">
            <label className="block text-xs font-black uppercase tracking-wider text-slate-700">
              Lookup Invoice by Number or Patient Name:
            </label>

            <div className="flex items-center space-x-2">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Type Invoice # (e.g. INV-2026-0001, 001) or Customer Name..."
                  value={lookupNo}
                  onChange={(e) => {
                    setLookupNo(e.target.value);
                    setShowSearchDropdown(true);
                  }}
                  onFocus={() => setShowSearchDropdown(true)}
                  className="w-full text-xs font-bold border-2 border-indigo-200 focus:border-indigo-600 rounded-xl pl-10 pr-9 py-2.5 bg-slate-50 focus:bg-white text-slate-900 focus:outline-none shadow-xs transition"
                />
                {lookupNo && (
                  <button
                    type="button"
                    onClick={() => {
                      setLookupNo('');
                      setShowSearchDropdown(false);
                    }}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 text-xs p-1"
                    title="Clear input"
                  >
                    ✕
                  </button>
                )}
              </div>

              <button
                type="submit"
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-black rounded-xl transition cursor-pointer shadow-sm shrink-0 flex items-center space-x-1.5"
              >
                <Search className="w-3.5 h-3.5" />
                <span>Lookup Invoice</span>
              </button>
            </div>

            {/* Live Autocomplete Dropdown */}
            {showSearchDropdown && searchSuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 z-30 bg-white border border-indigo-200 rounded-xl shadow-xl mt-1 overflow-hidden divide-y divide-slate-100 max-h-56 overflow-y-auto">
                <div className="p-2 bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Matching Invoices ({searchSuggestions.length}):
                </div>
                {searchSuggestions.map((inv) => (
                  <button
                    key={inv.InvoiceNo}
                    type="button"
                    onClick={() => loadInvoiceForReturn(inv)}
                    className="w-full p-2.5 text-left hover:bg-indigo-50 transition flex items-center justify-between text-xs cursor-pointer group"
                  >
                    <div>
                      <span className="font-mono font-bold text-indigo-700 group-hover:text-indigo-900 mr-2">
                        {inv.InvoiceNo}
                      </span>
                      <span className="text-slate-700 font-medium">
                        {resolvePatientName(inv.PatientID)}
                      </span>
                      <span className="text-[10px] text-slate-400 ml-2 font-mono">
                        ({inv.InvoiceDate})
                      </span>
                    </div>
                    <div className="text-right font-mono font-bold text-emerald-700 text-xs">
                      Rs. {inv.NetAmount?.toLocaleString()}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Quick Pick: Recent Invoices Pills */}
            {!currentMatchedInvoice && recentInvoices.length > 0 && (
              <div className="pt-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                  ⚡ Or Click Recent Invoices to Load:
                </span>
                <div className="flex flex-wrap items-center gap-1.5">
                  {recentInvoices.map((inv) => (
                    <button
                      key={inv.InvoiceNo}
                      type="button"
                      onClick={() => loadInvoiceForReturn(inv)}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 text-xs font-mono font-bold rounded-lg border border-slate-200 transition cursor-pointer flex items-center space-x-1"
                    >
                      <span>{inv.InvoiceNo}</span>
                      <span className="text-emerald-600 text-[11px] font-sans">
                        (Rs. {inv.NetAmount})
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </form>

          {/* 2. Matched Invoice Info Banner & Items Worksheet */}
          {currentMatchedInvoice && (
            <div className="space-y-4 pt-2 border-t border-slate-100 animate-fadeIn">
              
              {/* Patient & Invoice Summary Card */}
              <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-4 shadow-sm space-y-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center space-x-2">
                    <span className="px-2.5 py-0.5 bg-amber-400 text-slate-950 rounded-lg text-xs font-black font-mono">
                      {currentMatchedInvoice.InvoiceNo}
                    </span>
                    <span className="text-xs text-slate-300 font-medium">
                      Date: <strong className="text-white">{currentMatchedInvoice.InvoiceDate}</strong> (Shift {currentMatchedInvoice.shift === 1 ? '1 Morning' : '2 Evening'})
                    </span>
                  </div>

                  <div className="text-xs font-mono text-emerald-300 font-black">
                    Net Paid: Rs. {currentMatchedInvoice.NetAmount?.toLocaleString()}
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-200 pt-1 border-t border-slate-800 flex-wrap gap-2">
                  <div>
                    Customer: <strong className="text-white font-bold">{resolvePatientName(currentMatchedInvoice.PatientID)}</strong>
                    <span className="text-slate-400 text-[11px] ml-1 font-mono">({currentMatchedInvoice.PatientID})</span>
                  </div>
                  <div className="text-[11px] text-slate-300">
                    Gross: Rs. {currentMatchedInvoice.GAmount} | Discount: Rs. {currentMatchedInvoice.Discount || 0}
                  </div>
                </div>
              </div>

              {/* Action Toolbar for Return Rows */}
              <div className="flex items-center justify-between flex-wrap gap-2 pt-1">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center space-x-1.5">
                  <Receipt className="w-4 h-4 text-indigo-600" />
                  <span>Select Medicines & Quantities to Return:</span>
                </h4>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={handleReturnAllItems}
                    className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-bold transition cursor-pointer"
                  >
                    Return All Items (Full Void)
                  </button>
                  <button
                    type="button"
                    onClick={handleResetReturnQty}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-bold transition cursor-pointer"
                  >
                    Reset Quantities
                  </button>
                </div>
              </div>

              {/* Return Items Table */}
              <div className="overflow-x-auto border border-slate-200 rounded-xl shadow-2xs bg-white">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-100 text-slate-700 uppercase text-[10px] font-extrabold tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="p-2.5">Medicine Name</th>
                      <th className="p-2.5 text-center">Unit / Type</th>
                      <th className="p-2.5 text-center">Sold Qty</th>
                      <th className="p-2.5 text-center">Qty to Return</th>
                      <th className="p-2.5 text-right">Rate</th>
                      <th className="p-2.5 text-right">Line Refund</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {currentReturnBasket.map((row, idx) => {
                      const isReturning = row.QtyReturned > 0;
                      return (
                        <tr
                          key={idx}
                          className={`transition ${
                            isReturning ? 'bg-amber-50/60 font-medium' : 'hover:bg-slate-50'
                          }`}
                        >
                          {/* Item Name */}
                          <td className="p-2.5">
                            <div className="font-bold text-slate-900">{row.ItemName}</div>
                            <div className="text-[10px] font-mono text-slate-400">{row.ItemID}</div>
                          </td>

                          {/* Unit / Type */}
                          <td className="p-2.5 text-center">
                            <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-bold">
                              {row.Unit || 'Tab'}
                            </span>
                          </td>

                          {/* Original Sold Qty */}
                          <td className="p-2.5 text-center font-mono font-bold text-slate-700">
                            {row.OriginalQty}
                          </td>

                          {/* Return Qty with stepper buttons */}
                          <td className="p-2.5 text-center">
                            <div className="inline-flex items-center space-x-1">
                              <button
                                type="button"
                                onClick={() => handleQtyReturnedChange(idx, row.QtyReturned - 1)}
                                disabled={row.QtyReturned <= 0}
                                className="w-6 h-6 rounded bg-slate-200 hover:bg-slate-300 disabled:opacity-30 text-slate-800 font-black text-xs flex items-center justify-center transition cursor-pointer"
                              >
                                -
                              </button>
                              
                              <input
                                type="number"
                                min="0"
                                max={row.OriginalQty}
                                value={row.QtyReturned}
                                onChange={(e) => handleQtyReturnedChange(idx, parseInt(e.target.value) || 0)}
                                className="w-14 text-center text-xs font-bold font-mono border-2 border-indigo-200 rounded-lg py-1 bg-white focus:border-indigo-600 focus:outline-none"
                              />

                              <button
                                type="button"
                                onClick={() => handleQtyReturnedChange(idx, row.QtyReturned + 1)}
                                disabled={row.QtyReturned >= row.OriginalQty}
                                className="w-6 h-6 rounded bg-indigo-100 hover:bg-indigo-200 disabled:opacity-30 text-indigo-800 font-black text-xs flex items-center justify-center transition cursor-pointer"
                              >
                                +
                              </button>
                            </div>
                          </td>

                          {/* Rate */}
                          <td className="p-2.5 text-right font-mono text-slate-600 font-bold">
                            Rs. {row.PriceRef}
                          </td>

                          {/* Line Total */}
                          <td className="p-2.5 text-right font-mono font-bold text-xs">
                            {isReturning ? (
                              <span className="text-emerald-700">
                                Rs. {row.LineTotal.toLocaleString()}
                              </span>
                            ) : (
                              <span className="text-slate-300">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* 3. Refund Summary & Reason Form */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200 text-center">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">Units Returned</span>
                    <span className="text-base font-black font-mono text-slate-900">{totalItemsReturned}</span>
                  </div>

                  <div className="bg-white p-2.5 rounded-xl border border-slate-200 text-center">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">Gross Refund</span>
                    <span className="text-base font-black font-mono text-slate-700">Rs. {grossReturnRefund.toLocaleString()}</span>
                  </div>

                  <div className="bg-white p-2.5 rounded-xl border border-slate-200 text-center">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">Discount Reversed</span>
                    <span className="text-base font-black font-mono text-amber-700">- Rs. {proratedDiscountAdjustment}</span>
                  </div>

                  <div className="bg-emerald-600 text-white p-2.5 rounded-xl shadow-sm text-center">
                    <span className="text-[10px] font-black uppercase text-emerald-100 block">Net Refund Paid</span>
                    <span className="text-base font-black font-mono text-white">Rs. {netCashRefundPayable.toLocaleString()}</span>
                  </div>
                </div>

                {/* Return Remarks Input */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Return Reason / Internal Remarks <span className="text-rose-500">*</span>:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Patient prescription altered, wrong dosage, returned sealed pack..."
                    value={currentRemarks}
                    onChange={(e) => setCurrentRemarks(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                  />
                </div>

                {/* Submit Action Button */}
                <button
                  type="button"
                  disabled={totalItemsReturned === 0 || isSubmitting}
                  onClick={handlePostReturn}
                  className={`w-full py-3 rounded-xl text-xs font-black uppercase tracking-wider text-white transition flex items-center justify-center space-x-2 shadow-lg ${
                    totalItemsReturned > 0 && !isSubmitting
                      ? 'bg-rose-600 hover:bg-rose-700 active:bg-rose-800 cursor-pointer shadow-rose-900/20'
                      : 'bg-slate-400 opacity-50 cursor-not-allowed'
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-white" />
                      <span>Posting Sales Return & Restocking Inventory...</span>
                    </>
                  ) : (
                    <>
                      <Undo2 className="w-4 h-4 text-white" />
                      <span>
                        Finalize Sales Return & Refund Cash (Rs. {netCashRefundPayable.toLocaleString()})
                      </span>
                    </>
                  )}
                </button>
              </div>

            </div>
          )}

        </div>

      </div>

      {/* RIGHT COLUMN: Historical Reversal Transaction Logs & Ledgers (5 cols) */}
      <div className="lg:col-span-5 space-y-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col h-full min-h-[580px]">
          
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-wrap gap-2">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-rose-100 text-rose-700 rounded-xl">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                  Reversal Transaction Logs
                </h3>
                <span className="text-[11px] text-slate-400 font-medium">
                  Audited sales returns & refunded vouchers
                </span>
              </div>
            </div>

            <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-full text-xs font-mono font-bold">
              Total: {salesReturns.length}
            </span>
          </div>

          {/* Search & Date Filter Bar */}
          <div className="pt-3 space-y-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search Return #, Invoice #, Remarks..."
                value={ledgerSearch}
                onChange={(e) => setLedgerSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-rose-500 font-medium"
              />
              {ledgerSearch && (
                <button
                  type="button"
                  onClick={() => setLedgerSearch('')}
                  className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="date"
                value={ledgerDateFilter}
                onChange={(e) => setLedgerDateFilter(e.target.value)}
                className="flex-1 text-xs border border-slate-200 rounded-xl px-2.5 py-1.5 bg-slate-50 text-slate-700 font-mono focus:outline-none"
              />
              {ledgerDateFilter && (
                <button
                  type="button"
                  onClick={() => setLedgerDateFilter('')}
                  className="px-2 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-lg transition"
                >
                  Clear Date
                </button>
              )}
            </div>
          </div>

          {/* Logs List */}
          <div className="flex-1 overflow-y-auto mt-3 space-y-2.5 max-h-[500px] pr-1">
            {filteredSalesReturns.length === 0 ? (
              <div className="text-center py-16 text-slate-400 space-y-2">
                <FileText className="w-10 h-10 mx-auto text-slate-300 opacity-60" />
                <p className="text-xs font-bold">No sales return transactions found.</p>
                <p className="text-[11px] text-slate-400">
                  When an invoice is reversed or items are returned, credit logs will appear here.
                </p>
              </div>
            ) : (
              filteredSalesReturns.map((sr) => {
                const origInv = invoices.find(i => i.InvoiceNo === sr.OriginalInvoiceNo);
                const patName = origInv ? resolvePatientName(origInv.PatientID) : 'Customer';
                const itemsInReturn = returnDetails.filter(d => d.SRInvoiceNo === sr.SRInvoiceNo);

                return (
                  <div
                    key={sr.SRInvoiceNo}
                    className="p-3.5 bg-slate-50 hover:bg-white rounded-xl border border-slate-200 hover:border-indigo-200 hover:shadow-sm transition space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono font-black text-xs text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md">
                          {sr.SRInvoiceNo}
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono">
                          {sr.ReturnDate}
                        </span>
                      </div>

                      <span className="font-mono font-black text-xs text-slate-900">
                        Refund: <strong className="text-emerald-700">Rs. {Number(sr.NetPaid).toLocaleString()}</strong>
                      </span>
                    </div>

                    <div className="text-xs text-slate-600 flex items-center justify-between">
                      <span>
                        Orig Inv: <strong className="text-slate-800 font-mono">{sr.OriginalInvoiceNo}</strong>
                      </span>
                      <span className="text-slate-500 font-medium">
                        Customer: <strong className="text-slate-800">{patName}</strong>
                      </span>
                    </div>

                    {sr.Remarks && (
                      <div className="text-[11px] text-slate-500 italic bg-white p-2 rounded-lg border border-slate-100">
                        "{sr.Remarks}"
                      </div>
                    )}

                    {/* Returned Items details pill count & Print button */}
                    <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                      <span className="text-[10px] text-slate-500 font-mono">
                        {itemsInReturn.length > 0
                          ? `${itemsInReturn.reduce((s, i) => s + i.QtyReturned, 0)} item(s) restocked`
                          : 'Items restocked'}
                      </span>

                      <button
                        type="button"
                        onClick={() => handlePrintReturnVoucher(sr, itemsInReturn)}
                        className="px-2.5 py-1 bg-slate-900 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-bold transition flex items-center space-x-1 cursor-pointer shadow-2xs"
                        title="Print Sales Return Voucher"
                      >
                        <Printer className="w-3 h-3" />
                        <span>Print Slip</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

        </div>
      </div>

    </div>
  );
};

export default PharmacyReturnsTab;
