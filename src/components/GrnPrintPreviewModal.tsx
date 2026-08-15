import React, { useRef } from 'react';
import { Printer, X, FileText, CheckCircle2, ShieldCheck, Download } from 'lucide-react';
import { ErpGrn } from '../types';

interface GrnPrintPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  grn: ErpGrn | null;
  clinicSettings?: any;
  currentUser?: any;
}

export const GrnPrintPreviewModal: React.FC<GrnPrintPreviewModalProps> = ({
  isOpen,
  onClose,
  grn,
  clinicSettings,
  currentUser
}) => {
  const printSheetRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !grn) return null;

  const cName = clinicSettings?.ClinicName || 'PUNJAB HOMEOPATHIC CLINIC & PHARMACY';
  const cTag = clinicSettings?.ClinicLogoText || 'HEALING NATURALLY. RESTORING BALANCE.';
  const cAddr = clinicSettings?.ClinicAddress || '10 Shalimar Road, Garhi Shahu, Lahore';
  const logoSrc = clinicSettings?.ClinicLogoImage || '/nhc_logo.svg';

  const items = grn.Items || [];
  let totalOrderedQty = 0;
  let totalReceivedQty = 0;
  let computedGrandTotal = 0;

  items.forEach(item => {
    const ord = Number(item.OrderedQty) || 0;
    const rec = Number(item.ReceivedQty) || 0;
    const price = Number(item.UnitPrice) || 0;
    const lineTotal = item.LineTotal !== undefined && item.LineTotal !== null ? Number(item.LineTotal) : (rec * price);

    totalOrderedQty += ord;
    totalReceivedQty += rec;
    computedGrandTotal += lineTotal;
  });

  const finalTotalAmount = grn.TotalAmount !== undefined && grn.TotalAmount !== null && grn.TotalAmount > 0
    ? Number(grn.TotalAmount)
    : computedGrandTotal;

  // Dedicated Print Trigger using standalone print window with exact A4 styles
  const handlePrintDocument = () => {
    const printWin = window.open('', '_blank', 'width=950,height=950');
    if (!printWin) {
      // Fallback to window.print if popup blocked
      window.print();
      return;
    }

    const itemsRows = items.map((item, idx) => {
      const ordQty = Number(item.OrderedQty) || 0;
      const recQty = Number(item.ReceivedQty) || 0;
      const uPrice = Number(item.UnitPrice) || 0;
      const lineSubtotal = item.LineTotal !== undefined && item.LineTotal !== null ? Number(item.LineTotal) : (recQty * uPrice);
      const mfg = item.MfgDate || 'N/A';
      const exp = item.ExpiryDate || 'N/A';

      return `
        <tr style="border-bottom: 1px solid #e2e8f0; font-size: 11px;">
          <td style="text-align: center; padding: 6px 5px; font-weight: bold; font-family: monospace; color: #64748b;">${idx + 1}</td>
          <td style="padding: 6px 6px; font-family: monospace; font-weight: bold; color: #475569;">${item.ItemID || 'ITM-N/A'}</td>
          <td style="padding: 6px 6px; font-weight: bold; color: #0f172a;">${item.ItemName || 'General Item'}</td>
          <td style="text-align: center; padding: 6px 5px; font-family: monospace; font-weight: bold; color: #b45309; background: #fffbeb;">${item.BatchNo || 'N/A'}</td>
          <td style="text-align: center; padding: 6px 5px; font-family: monospace; color: #475569; font-size: 10px;">${mfg}</td>
          <td style="text-align: center; padding: 6px 5px; font-family: monospace; font-weight: bold; color: #991b1b; background: #fef2f2; font-size: 10px;">${exp}</td>
          <td style="text-align: center; padding: 6px 5px; font-weight: bold; color: #475569; font-family: monospace;">${ordQty}</td>
          <td style="text-align: center; padding: 6px 5px; font-weight: 800; color: #15803d; background: #f0fdf4; font-family: monospace;">${recQty}</td>
          <td style="text-align: right; padding: 6px 6px; font-weight: 700; color: #334155; font-family: monospace;">Rs. ${uPrice.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
          <td style="text-align: right; padding: 6px 6px; font-weight: 800; color: #0f172a; font-family: monospace; background: #f8fafc;">Rs. ${lineSubtotal.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
        </tr>
      `;
    }).join('');

    printWin.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Goods Received Note ${grn.GRNID} - Punjab Homeopathic Clinic</title>
          <meta charset="utf-8" />
          <style>
            @page {
              size: A4 portrait;
              margin: 10mm 12mm 12mm 12mm;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
              color: #0f172a;
              margin: 0;
              padding: 0;
              font-size: 11px;
              line-height: 1.4;
              background: #ffffff;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            * { box-sizing: border-box; }

            .letterhead-header {
              display: flex;
              align-items: center;
              justify-content: space-between;
              border-bottom: 3px double #064e3b;
              padding-bottom: 8px;
              margin-bottom: 10px;
              gap: 12px;
            }
            .logo-col {
              width: 75px;
              height: 75px;
              display: flex;
              align-items: center;
              justify-content: center;
              flex-shrink: 0;
            }
            .logo-img {
              max-width: 100%;
              max-height: 100%;
              object-fit: contain;
            }
            .clinic-info {
              text-align: center;
              flex: 1;
            }
            .clinic-name {
              font-family: Georgia, "Times New Roman", serif;
              font-size: 22px;
              font-weight: 900;
              color: #881337;
              text-transform: uppercase;
              margin: 0;
              letter-spacing: -0.3px;
              line-height: 1.1;
            }
            .clinic-tagline {
              font-size: 9.5px;
              font-weight: 800;
              color: #be123c;
              letter-spacing: 1.5px;
              text-transform: uppercase;
              margin-top: 2px;
            }
            .clinic-address {
              font-size: 10.5px;
              font-weight: 700;
              color: #1e293b;
              margin-top: 2px;
            }
            .clinic-timings {
              font-size: 9.5px;
              font-weight: 800;
              color: #064e3b;
              text-transform: uppercase;
              margin-top: 3px;
            }

            .report-banner {
              background: #0f172a;
              color: #ffffff;
              padding: 7px 12px;
              border-radius: 5px;
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 10px;
            }
            .report-banner-title {
              font-size: 12px;
              font-weight: 900;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              color: #f8fafc;
            }
            .report-banner-ref {
              font-size: 10px;
              font-family: monospace;
              color: #cbd5e1;
              font-weight: 700;
            }

            .meta-grid {
              background: #f8fafc;
              border: 1.5px solid #cbd5e1;
              border-radius: 6px;
              padding: 8px 12px;
              margin-bottom: 12px;
              display: grid;
              grid-template-columns: 1fr 1fr 1fr;
              gap: 8px;
              font-size: 10.5px;
            }
            .meta-item {
              display: flex;
              flex-direction: column;
            }
            .meta-label {
              font-size: 8.5px;
              font-weight: 800;
              color: #64748b;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .meta-value {
              font-size: 10.5px;
              font-weight: 700;
              color: #0f172a;
              margin-top: 1px;
            }

            .report-table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 6px;
              font-size: 10.5px;
            }
            .report-table th {
              background: #1e293b;
              color: #ffffff;
              font-weight: 800;
              text-align: left;
              padding: 6px 7px;
              font-size: 9.5px;
              text-transform: uppercase;
              letter-spacing: 0.3px;
              border: 1px solid #1e293b;
            }
            .report-table td {
              border: 1px solid #e2e8f0;
              padding: 6px 7px;
              color: #0f172a;
            }

            .signature-section {
              margin-top: 25px;
              padding-top: 12px;
              border-top: 1.5px solid #cbd5e1;
              display: flex;
              justify-content: space-between;
              align-items: flex-end;
              page-break-inside: avoid;
            }
            .sig-box {
              text-align: center;
              width: 210px;
            }
            .sig-line-text {
              border-bottom: 1.5px dashed #475569;
              height: 34px;
              margin-bottom: 5px;
              display: flex;
              align-items: flex-end;
              justify-content: center;
              font-size: 10.5px;
              font-weight: 700;
              color: #334155;
              padding-bottom: 2px;
            }
            .sig-line-manager {
              border-bottom: 2px solid #0f172a;
              height: 34px;
              margin-bottom: 5px;
              display: flex;
              align-items: flex-end;
              justify-content: center;
              font-size: 12px;
              font-weight: 900;
              color: #0f172a;
              font-family: Georgia, 'Times New Roman', serif;
              padding-bottom: 2px;
            }
            .sig-title-primary {
              font-size: 10px;
              font-weight: 900;
              color: #881337;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .sig-title-sub {
              font-size: 9px;
              font-weight: 800;
              color: #0f172a;
              text-transform: uppercase;
            }
            .sig-title-dept {
              font-size: 8.5px;
              font-weight: 700;
              color: #047857;
            }

            .stamp-box {
              text-align: center;
              width: 120px;
              height: 60px;
              border: 1.5px dashed #94a3b8;
              border-radius: 6px;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              color: #64748b;
              font-size: 7.5px;
              font-weight: 800;
              text-transform: uppercase;
              background: #fafafa;
            }

            .official-footer {
              margin-top: 12px;
              border-top: 1px solid #e2e8f0;
              padding-top: 6px;
              display: flex;
              justify-content: space-between;
              align-items: center;
              font-size: 8.5px;
              color: #64748b;
              font-weight: 600;
            }
          </style>
        </head>
        <body>
          <div class="letterhead-header">
            <div class="logo-col">
              <img src="${logoSrc}" alt="PHC Logo" class="logo-img" />
            </div>
            <div class="clinic-info">
              <h1 class="clinic-name">${cName}</h1>
              <div class="clinic-tagline">${cTag}</div>
              <div class="clinic-address">${cAddr}</div>
              <div class="clinic-timings">
                Clinic Timings: Morning 8:30 AM to 12:00 PM &nbsp;|&nbsp; Evening 4:30 PM to 9:00 PM
              </div>
            </div>
            <div class="logo-col" style="visibility: hidden;">
              <img src="${logoSrc}" alt="PHC Logo" class="logo-img" />
            </div>
          </div>

          <div class="report-banner">
            <span class="report-banner-title">GOODS RECEIVED NOTE (GRN) — OFFICIAL INWARD AUDIT</span>
            <span class="report-banner-ref">REF: PHC-GRN-${grn.GRNID}</span>
          </div>

          <div class="meta-grid">
            <div class="meta-item">
              <span class="meta-label">GRN Ref Number</span>
              <span class="meta-value" style="color: #047857; font-family: monospace;">${grn.GRNID}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Purchase Order Ref</span>
              <span class="meta-value" style="color: #4338ca; font-family: monospace;">${grn.POID}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Goods Received Date</span>
              <span class="meta-value">${grn.ReceivedDate}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Supplier / Vendor</span>
              <span class="meta-value" style="color: #0f172a;">${grn.VendorName} (${grn.VendorID || 'N/A'})</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Supplier Bill / Invoice #</span>
              <span class="meta-value" style="color: #0369a1; font-family: monospace;">${grn.SupplierInvoiceNo || 'N/A'}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Delivery Challan No</span>
              <span class="meta-value" style="font-family: monospace;">${grn.ChallanNo || 'N/A'}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Store Receiver</span>
              <span class="meta-value">${grn.CreatedBy || 'Warehouse Officer'}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Audit Prepared By</span>
              <span class="meta-value">${currentUser?.FullName || 'Staff Accountant'}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Responsible Manager</span>
              <span class="meta-value" style="color: #881337;">Mr. Zaigham Ali Anjum</span>
            </div>
          </div>

          <table class="report-table">
            <thead>
              <tr>
                <th style="width: 25px; text-align: center;">#</th>
                <th style="width: 75px;">Item ID</th>
                <th>Medicine Description & Category</th>
                <th style="width: 85px; text-align: center;">Batch No.</th>
                <th style="width: 70px; text-align: center;">Mfg Date</th>
                <th style="width: 70px; text-align: center;">Expiry</th>
                <th style="width: 55px; text-align: center;">Ordered</th>
                <th style="width: 60px; text-align: center;">Received</th>
                <th style="width: 85px; text-align: right;">Unit Price</th>
                <th style="width: 95px; text-align: right;">Sub Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsRows}
            </tbody>
            <tfoot>
              <tr style="background: #f1f5f9; font-weight: 800; font-size: 10.5px; border-top: 2px solid #0f172a;">
                <td colspan="6" style="padding: 7px 8px; text-align: right; text-transform: uppercase; color: #475569; font-weight: 800;">
                  Total Batch Quantity / Inward Summary:
                </td>
                <td style="padding: 7px 5px; text-align: center; font-weight: 800; color: #475569; font-family: monospace;">
                  ${totalOrderedQty}
                </td>
                <td style="padding: 7px 5px; text-align: center; font-weight: 900; color: #15803d; background: #dcfce7; font-family: monospace;">
                  ${totalReceivedQty}
                </td>
                <td style="padding: 7px 8px; text-align: right; font-weight: 800; color: #334155; text-transform: uppercase;">
                  SUB TOTAL:
                </td>
                <td style="padding: 7px 8px; text-align: right; font-weight: 900; color: #0f172a; font-family: monospace; font-size: 11px; background: #e2e8f0;">
                  Rs. ${finalTotalAmount.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
              </tr>
            </tfoot>
          </table>

          <div style="margin-top: 10px; display: flex; justify-content: flex-end;">
            <div style="background: #0f172a; color: #ffffff; border-radius: 6px; padding: 8px 14px; min-width: 270px; text-align: right;">
              <div style="font-size: 8.5px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.8px; color: #94a3b8;">
                GRAND TOTAL (OFFICIAL INWARD BILL AMOUNT)
              </div>
              <div style="font-size: 16px; font-weight: 900; font-family: monospace; color: #34d399; margin-top: 2px;">
                Rs. ${finalTotalAmount.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div style="font-size: 8.5px; font-weight: 700; color: #cbd5e1; margin-top: 2px;">
                Total Items: ${items.length} &nbsp;|&nbsp; Received Qty: ${totalReceivedQty} Units
              </div>
            </div>
          </div>

          <div style="margin-top: 10px; padding: 8px 10px; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 5px; font-size: 10.5px;">
            <strong>Remarks / Physical Inspection Note:</strong> ${grn.Remarks || 'All received medicines verified for physical condition, batch integrity & quantity.'}
          </div>

          <div class="signature-section">
            <div class="sig-box">
              <div class="sig-line-text">
                ${grn.CreatedBy || currentUser?.FullName || 'Accountant / Audit Officer'}
              </div>
              <div class="sig-title-primary" style="color: #0f172a;">PREPARED BY</div>
              <div class="sig-title-sub" style="font-size: 8.5px; color: #475569;">Warehouse & GRN Receiving Desk</div>
            </div>

            <div class="stamp-box">
              <span>PHC OFFICIAL STAMP</span>
              <span style="font-size: 6.5px; color: #94a3b8; margin-top: 2px;">[ SEAL & STAMP ]</span>
            </div>

            <div class="sig-box" style="width: 230px;">
              <div class="sig-line-manager">
                Zaigham Ali Anjum
              </div>
              <div class="sig-title-primary">MR. ZAIGHAM ALI ANJUM</div>
              <div class="sig-title-sub">Manager Operations & Administrative Head</div>
              <div class="sig-title-dept">Punjab Homeopathic Clinic & Pharmacy</div>
            </div>
          </div>

          <div class="official-footer">
            <span>Punjab Homeopathic Clinic & Pharmacy • Goods Received Note (GRN) Stock Audit • Confidential Document</span>
            <span>Generated Date: ${new Date().toLocaleString('en-GB')}</span>
          </div>

          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `);
    printWin.document.close();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 z-[80] animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[95vh] shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
        {/* MODAL CONTROL HEADER */}
        <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-black">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-white text-sm sm:text-base">
                  Goods Received Note (GRN) — Print Preview
                </h3>
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  A4 Print Ready
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono">
                Document Ref: PHC-GRN-{grn.GRNID} • Linked PO: {grn.POID || 'Direct Inward'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handlePrintDocument}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-md transition flex items-center space-x-1.5 cursor-pointer"
              title="Print A4 Goods Received Note"
            >
              <Printer className="w-4 h-4" />
              <span>Print Document</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition cursor-pointer"
              title="Close Preview"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PRINT PREVIEW PAPER CONTAINER (A4 SCALED VIEW) */}
        <div className="bg-slate-200/80 p-3 sm:p-6 overflow-y-auto flex-1 flex justify-center">
          <div
            ref={printSheetRef}
            id="printable-grn-sheet"
            className="grn-print-sheet bg-white text-slate-900 shadow-xl rounded-sm p-6 sm:p-10 max-w-4xl w-full border border-slate-300 print:shadow-none print:border-none print:p-0 print:m-0 space-y-4"
          >
            {/* 1. LETTERHEAD HEADER */}
            <div className="flex items-center justify-between border-b-[3px] border-double border-emerald-900 pb-3 gap-3">
              <div className="w-20 h-20 flex items-center justify-center shrink-0">
                <img src={logoSrc} alt="PHC Logo" className="max-w-full max-h-full object-contain" />
              </div>
              <div className="text-center flex-1">
                <h1 className="font-serif text-xl sm:text-2xl font-black text-rose-900 uppercase tracking-tight leading-tight">
                  {cName}
                </h1>
                <div className="text-[10px] font-extrabold text-rose-700 uppercase tracking-widest mt-0.5">
                  {cTag}
                </div>
                <div className="text-xs font-bold text-slate-800 mt-0.5">
                  {cAddr}
                </div>
                <div className="text-[10px] font-extrabold text-emerald-900 uppercase mt-0.5">
                  Clinic Timings: Morning 8:30 AM to 12:00 PM &nbsp;|&nbsp; Evening 4:30 PM to 9:00 PM
                </div>
              </div>
              <div className="w-20 h-20 flex items-center justify-center shrink-0 invisible sm:visible">
                <img src={logoSrc} alt="PHC Logo" className="max-w-full max-h-full object-contain opacity-0" />
              </div>
            </div>

            {/* 2. OFFICIAL BANNER */}
            <div className="bg-slate-900 text-white px-3.5 py-2 rounded-md flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-slate-100 flex items-center space-x-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>GOODS RECEIVED NOTE (GRN) — OFFICIAL INWARD AUDIT</span>
              </span>
              <span className="text-[11px] font-mono font-bold text-slate-300">
                REF: PHC-GRN-{grn.GRNID}
              </span>
            </div>

            {/* 3. METADATA GRID */}
            <div className="bg-slate-50 border border-slate-300 rounded-lg p-3 grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
              <div>
                <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wider block">GRN Ref Number</span>
                <span className="text-xs font-mono font-bold text-emerald-800 block mt-0.5">{grn.GRNID}</span>
              </div>
              <div>
                <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wider block">Purchase Order Ref</span>
                <span className="text-xs font-mono font-bold text-indigo-700 block mt-0.5">{grn.POID}</span>
              </div>
              <div>
                <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wider block">Goods Received Date</span>
                <span className="text-xs font-bold text-slate-900 block mt-0.5">{grn.ReceivedDate}</span>
              </div>
              <div>
                <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wider block">Supplier / Vendor</span>
                <span className="text-xs font-bold text-slate-900 block mt-0.5">{grn.VendorName} ({grn.VendorID || 'N/A'})</span>
              </div>
              <div>
                <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wider block">Supplier Bill / Invoice #</span>
                <span className="text-xs font-mono font-bold text-sky-800 block mt-0.5">{grn.SupplierInvoiceNo || 'N/A'}</span>
              </div>
              <div>
                <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wider block">Delivery Challan No</span>
                <span className="text-xs font-mono font-bold text-slate-700 block mt-0.5">{grn.ChallanNo || 'N/A'}</span>
              </div>
              <div>
                <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wider block">Store Receiver</span>
                <span className="text-xs font-bold text-slate-800 block mt-0.5">{grn.CreatedBy || 'Warehouse Officer'}</span>
              </div>
              <div>
                <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wider block">Audit Prepared By</span>
                <span className="text-xs font-bold text-slate-800 block mt-0.5">{currentUser?.FullName || 'Staff Accountant'}</span>
              </div>
              <div>
                <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wider block">Responsible Manager</span>
                <span className="text-xs font-bold text-rose-900 block mt-0.5">Mr. Zaigham Ali Anjum</span>
              </div>
            </div>

            {/* 4. ITEMS TABLE FORMATTED FOR A4 */}
            <div className="border border-slate-300 rounded-lg overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse min-w-[720px] grn-summary-table">
                <thead>
                  <tr className="bg-slate-900 text-white font-extrabold text-[10px] uppercase tracking-wider">
                    <th className="p-2 w-8 text-center border-r border-slate-700">#</th>
                    <th className="p-2 w-20 border-r border-slate-700">Item ID</th>
                    <th className="p-2 min-w-[140px] border-r border-slate-700">Medicine Description & Category</th>
                    <th className="p-2 w-24 text-center border-r border-slate-700">Batch No.</th>
                    <th className="p-2 w-20 text-center border-r border-slate-700">Mfg Date</th>
                    <th className="p-2 w-20 text-center border-r border-slate-700">Expiry</th>
                    <th className="p-2 w-16 text-center border-r border-slate-700">Ordered</th>
                    <th className="p-2 w-16 text-center border-r border-slate-700">Received</th>
                    <th className="p-2 w-24 text-right border-r border-slate-700 grn-unit-price">Unit Price</th>
                    <th className="p-2 w-28 text-right grn-subtotal">Sub Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-medium text-slate-800">
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="p-6 text-center text-slate-400 font-bold">
                        No medicine items in this GRN record.
                      </td>
                    </tr>
                  ) : (
                    items.map((item, idx) => {
                      const ordQty = Number(item.OrderedQty) || 0;
                      const recQty = Number(item.ReceivedQty) || 0;
                      const uPrice = Number(item.UnitPrice) || 0;
                      const lineSubtotal = item.LineTotal !== undefined && item.LineTotal !== null ? Number(item.LineTotal) : (recQty * uPrice);

                      return (
                        <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'}>
                          <td className="p-2 text-center font-mono font-bold text-slate-500 border-r border-slate-200">{idx + 1}</td>
                          <td className="p-2 font-mono font-bold text-slate-700 border-r border-slate-200">{item.ItemID || 'ITM-N/A'}</td>
                          <td className="p-2 font-bold text-slate-900 border-r border-slate-200">
                            <div>{item.ItemName || 'General Medicine'}</div>
                          </td>
                          <td className="p-2 text-center font-mono font-bold text-amber-800 bg-amber-50/60 border-r border-slate-200">
                            {item.BatchNo || 'N/A'}
                          </td>
                          <td className="p-2 text-center font-mono text-[11px] text-slate-600 border-r border-slate-200">
                            {item.MfgDate || 'N/A'}
                          </td>
                          <td className="p-2 text-center font-mono font-bold text-[11px] text-rose-800 bg-rose-50/50 border-r border-slate-200">
                            {item.ExpiryDate || 'N/A'}
                          </td>
                          <td className="p-2 text-center font-mono font-bold text-slate-600 border-r border-slate-200">
                            {ordQty}
                          </td>
                          <td className="p-2 text-center font-mono font-extrabold text-emerald-800 bg-emerald-50 border-r border-slate-200">
                            {recQty}
                          </td>
                          <td className="p-2 text-right font-mono font-bold text-slate-700 border-r border-slate-200 grn-unit-price">
                            Rs. {uPrice.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="p-2 text-right font-mono font-black text-slate-900 bg-slate-100/60 grn-subtotal">
                            Rs. {lineSubtotal.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-100 font-extrabold text-slate-900 border-t-2 border-slate-900">
                    <td colSpan={6} className="p-2.5 text-right uppercase text-slate-600 text-[11px]">
                      Total Batch Quantity / Inward Summary:
                    </td>
                    <td className="p-2.5 text-center font-mono font-bold text-slate-700">{totalOrderedQty}</td>
                    <td className="p-2.5 text-center font-mono font-black text-emerald-800 bg-emerald-100">{totalReceivedQty}</td>
                    <td className="p-2.5 text-right uppercase text-slate-700 text-[11px]">Sub Total:</td>
                    <td className="p-2.5 text-right font-mono font-black text-slate-900 bg-slate-200 text-xs">
                      Rs. {finalTotalAmount.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* 5. GRAND TOTAL SUMMARY CARD */}
            <div className="flex justify-end pt-1">
              <div className="bg-slate-900 text-white rounded-xl p-4 min-w-[290px] text-right shadow-md">
                <div className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                  GRAND TOTAL (OFFICIAL INWARD BILL AMOUNT)
                </div>
                <div className="text-xl font-mono font-black text-emerald-400 mt-0.5">
                  Rs. {finalTotalAmount.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="text-[11px] font-bold text-slate-300 mt-1 flex items-center justify-end space-x-2">
                  <span>Total Items: {items.length}</span>
                  <span>•</span>
                  <span>Received Qty: {totalReceivedQty} Units</span>
                </div>
              </div>
            </div>

            {/* 6. REMARKS / PHYSICAL INSPECTION */}
            <div className="bg-slate-50 border border-slate-300 rounded-lg p-3 text-xs text-slate-700">
              <strong className="text-slate-900">Remarks / Physical Inspection Note: </strong>
              <span>{grn.Remarks || 'All received medicines verified for physical condition, batch integrity & quantity.'}</span>
            </div>

            {/* 7. EXECUTIVE SIGNATURES & OFFICIAL STAMP */}
            <div className="flex justify-between items-end mt-8 pt-4 border-t-2 border-slate-300 gap-4">
              <div className="text-center w-52">
                <div className="border-b-2 border-dashed border-slate-600 h-10 mb-1.5 flex items-end justify-center font-bold text-slate-800 text-xs pb-1">
                  {grn.CreatedBy || currentUser?.FullName || 'Accountant / Audit Officer'}
                </div>
                <div className="text-[11px] font-black text-slate-900 uppercase tracking-wide">PREPARED BY</div>
                <div className="text-[10px] font-bold text-slate-500">Warehouse & GRN Receiving Desk</div>
              </div>

              <div className="w-32 h-16 border-2 border-dashed border-slate-400 rounded-lg flex flex-col items-center justify-center text-slate-400 text-[8px] font-extrabold uppercase bg-slate-50/50">
                <span>PHC OFFICIAL STAMP</span>
                <span className="text-[7px] text-slate-400 mt-0.5">[ SEAL & STAMP ]</span>
              </div>

              <div className="text-center w-60">
                <div className="border-b-2 border-slate-900 h-10 mb-1.5 flex items-end justify-center font-serif font-black text-slate-900 text-sm pb-1">
                  Zaigham Ali Anjum
                </div>
                <div className="text-[11px] font-black text-rose-900 uppercase tracking-wide">MR. ZAIGHAM ALI ANJUM</div>
                <div className="text-[10px] font-bold text-slate-900">Manager Operations & Administrative Head</div>
                <div className="text-[9px] font-bold text-emerald-800">Punjab Homeopathic Clinic & Pharmacy</div>
              </div>
            </div>

            {/* 8. OFFICIAL FOOTER NOTE */}
            <div className="border-t border-slate-200 pt-2 flex justify-between items-center text-[9px] text-slate-500 font-medium">
              <span>Punjab Homeopathic Clinic & Pharmacy • Goods Received Note (GRN) Stock Audit • Confidential Document</span>
              <span>Generated Date: {new Date().toLocaleString('en-GB')}</span>
            </div>
          </div>
        </div>

        {/* MODAL FOOTER */}
        <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2 text-xs text-slate-600">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Ready for printing on standard A4 paper with high contrast letterhead & signature blocks.</span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs transition cursor-pointer"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handlePrintDocument}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow transition flex items-center space-x-1.5 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print A4 Document</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
