/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef } from 'react';
import { Printer, X, Tag, Check, Sparkles } from 'lucide-react';

interface PharmacyLabelPrintModalProps {
  setLabelPrintData?: (data: any) => void;
  handleCleanLabelPrint?: (presetSize?: string) => void;
  isLabelPrintModalOpen: boolean;
  setIsLabelPrintModalOpen: (open: boolean) => void;
  labelPrintData: {
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
  } | null;
  clinicSettings?: any;
  currentUser?: any;
}

export const PharmacyLabelPrintModal: React.FC<PharmacyLabelPrintModalProps> = ({
  isLabelPrintModalOpen,
  setIsLabelPrintModalOpen,
  labelPrintData,
  clinicSettings,
  setLabelPrintData,
  handleCleanLabelPrint,
  currentUser
}) => {
  const isPrintingRef = useRef(false);

  if (!isLabelPrintModalOpen || !labelPrintData) return null;

  const clinicName = clinicSettings?.ClinicName || "Punjab Homeopathic Clinic & Pharmacy";

  // Dedicated self-contained print function that works across all browsers, popups, and iframes
  const executePrint = () => {
    if (isPrintingRef.current) return;
    isPrintingRef.current = true;

    try {
      if (currentUser && currentUser.Role !== 'Administrator' && currentUser.Permissions?.canPrintPOSInvoice === false) {
        alert("Printing Clinical Label Stickers is restricted by administrator permissions.");
        isPrintingRef.current = false;
        return;
      }

      // If parent supplied a custom handler, attempt it first
      if (typeof handleCleanLabelPrint === 'function') {
        try {
          handleCleanLabelPrint('2x0.2');
          isPrintingRef.current = false;
          return;
        } catch (err) {
          console.warn("Parent handleCleanLabelPrint failed, falling back to modal internal print engine", err);
        }
      }

      // Build complete printable HTML for 2x2 grid on A4
      const printPagesHtml = Array.from({ length: Math.ceil(labelPrintData.medicines.length / 4) }).map((_, pageIdx) => {
        const pageMeds = labelPrintData.medicines.slice(pageIdx * 4, pageIdx * 4 + 4);
        return `
          <div class="label-grid-page">
            ${pageMeds.map((med) => `
              <div class="label-sticker-page">
                <div class="label-row label-patient">
                  <span class="label-key">Patient:</span>
                  <strong class="label-val">${labelPrintData.patientName || 'Walk-in Patient'}</strong>
                </div>
                <div class="label-row label-med">
                  <span class="label-key">Med:</span>
                  <strong class="label-val">${med.name || 'Clinical Remedy'}</strong>
                </div>
                <div class="label-row label-usage">
                  <span class="label-key">Usage:</span>
                  <span class="label-val">${med.instructions || 'As directed by Doctor'}</span>
                </div>
                <div class="label-row label-footer">
                  <span>Exp: <strong>${med.expiry || 'N/A'}</strong></span>
                  <span class="clinic-sub">${clinicName}</span>
                </div>
              </div>
            `).join('')}
          </div>
        `;
      }).join('');

      const fullHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8" />
            <title>Medicine Labels (2" x 0.2" - 2x2 Grid A4) - ${labelPrintData.patientName}</title>
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
                background: #ffffff;
                color: #000000;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
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
                background: #ffffff;
                color: #000000;
                display: flex;
                flex-direction: column;
                justify-content: flex-start;
                font-size: 8.5px;
                line-height: 1.15;
                overflow: hidden;
              }
              .label-row {
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                margin: 0;
                padding: 0;
              }
              .label-key {
                color: #475569;
                margin-right: 2px;
                font-weight: normal;
              }
              .label-val {
                color: #000000;
                font-weight: 800;
              }
              .label-footer {
                display: flex;
                justify-content: space-between;
                align-items: center;
                font-size: 7.5px;
                color: #334155;
                margin-top: 1px;
                border-top: 0.5px solid #cbd5e1;
                padding-top: 1px;
              }
              .clinic-sub {
                font-size: 6.5px;
                color: #64748b;
                max-width: 1in;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
              }
            </style>
          </head>
          <body>
            ${printPagesHtml}
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

      // Method 1: Try window.open
      const printWin = window.open('', '_blank', 'width=750,height=850');
      if (printWin) {
        printWin.document.open();
        printWin.document.write(fullHtml);
        printWin.document.close();
      } else {
        // Method 2: If popups are blocked (e.g. inside iframe sandbox), use a hidden iframe
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
          iframeDoc.write(fullHtml);
          iframeDoc.close();
          setTimeout(() => {
            printIframe?.contentWindow?.focus();
            printIframe?.contentWindow?.print();
          }, 350);
        } else {
          // Method 3: Direct window print fallback
          window.print();
        }
      }
    } catch (err) {
      console.error("Error during label printing:", err);
      window.print();
    } finally {
      setTimeout(() => {
        isPrintingRef.current = false;
      }, 1000);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[9999] overflow-y-auto print:absolute print:inset-0 print:bg-white print:p-0">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[90vh] flex flex-col print:shadow-none print:border-0 print:max-h-full print:w-full print:rounded-none">
        
        {/* Dynamic Sticker Print Style Injector for direct window.print() */}
        <style dangerouslySetInnerHTML={{ __html: `
          @media print {
            @page {
              size: A4 portrait;
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
              background: transparent !important;
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
              margin-bottom: 0 !important;
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
              background: #ffffff !important;
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
              id="btn-print-medicine-labels-a4"
              onClick={executePrint}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-black text-xs rounded-xl flex items-center shadow-md transition cursor-pointer hover:scale-[1.02]"
              title="Click to print 2x2 grid labels on A4 sheet"
            >
              <Printer className="w-4 h-4 mr-1.5" />
              Print 2x2 Grid Labels (A4)
            </button>
            <button
              type="button"
              onClick={() => {
                setIsLabelPrintModalOpen(false);
                setLabelPrintData?.(null);
              }}
              className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-xl transition cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>

        {/* Print Preview Area */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-100 print:bg-white flex flex-col items-center" id="sticker-print-container">
          {Array.from({ length: Math.ceil(labelPrintData.medicines.length / 4) }).map((_, pageIdx) => {
            const pageMeds = labelPrintData.medicines.slice(pageIdx * 4, pageIdx * 4 + 4);
            return (
              <div key={pageIdx} className="label-grid-page grid grid-cols-2 gap-x-[2in] gap-y-4 p-4 bg-white border border-dashed border-slate-300 rounded-xl mb-6 print:mb-0 print:border-none print:p-0 print:page-break-after-always shadow-xs">
                {pageMeds.map((med, idx) => (
                  <div key={idx} className="label-sticker-page bg-white border border-slate-300 rounded shadow-xs w-[2in] max-w-[2in] min-h-[0.2in] p-1 font-sans text-slate-900 flex flex-col justify-start text-[9px] leading-tight box-border space-y-0.5">
                    <div className="font-bold text-[9px] m-0 p-0 truncate">
                      <span className="text-slate-500">Patient: </span>
                      <strong className="text-slate-900 font-black">{labelPrintData.patientName}</strong>
                    </div>
                    <div className="font-bold text-[9px] m-0 p-0 truncate">
                      <span className="text-slate-500">Med: </span>
                      <strong className="text-slate-900 font-black">{med.name || "Clinical Formula"}</strong>
                    </div>
                    <div className="font-bold text-[9px] m-0 p-0 truncate">
                      <span className="text-slate-500">Usage: </span>
                      <strong className="text-slate-900 font-black">{med.instructions || "As directed"}</strong>
                    </div>
                    <div className="font-bold text-[8px] m-0 p-0 truncate flex justify-between items-center border-t border-slate-100 pt-0.5 mt-0.5">
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
  );
};

export default PharmacyLabelPrintModal;
