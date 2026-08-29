/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Printer, X, Tag } from 'lucide-react';

interface PharmacyLabelPrintModalProps {
  setLabelPrintData?: (data: any) => void;
  handleCleanLabelPrint?: () => void;
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
}

export const PharmacyLabelPrintModal: React.FC<PharmacyLabelPrintModalProps> = ({
  isLabelPrintModalOpen,
  setIsLabelPrintModalOpen,
  labelPrintData,
  clinicSettings,
  setLabelPrintData,
  handleCleanLabelPrint
}) => {
  if (!isLabelPrintModalOpen || !labelPrintData) return null;

  return (
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
                    setLabelPrintData?.(null);
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
  );
};

export default PharmacyLabelPrintModal;
