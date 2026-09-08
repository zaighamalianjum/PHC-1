/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useMemo, useEffect } from 'react';
import { 
  Printer, 
  X, 
  Tag, 
  Sliders, 
  RotateCcw, 
  Lightbulb, 
  FileText, 
  LayoutGrid, 
  ChevronDown, 
  ChevronUp,
  Check
} from 'lucide-react';

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

const SETTINGS_STORAGE_KEY = 'phc_medicine_label_settings_a5_landscape_v1';

const getSavedLabelSettings = () => {
  try {
    const saved = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (err) {
    console.error('Failed to load saved label settings', err);
  }
  return null;
};

export const PharmacyLabelPrintModal: React.FC<PharmacyLabelPrintModalProps> = ({
  isLabelPrintModalOpen,
  setIsLabelPrintModalOpen,
  labelPrintData,
  clinicSettings,
  setLabelPrintData,
  currentUser
}) => {
  const isPrintingRef = useRef(false);

  // Permanently locked to A5 Landscape as requested
  const pageSize = 'A5';
  const orientation = 'landscape';

  const savedSettings = useMemo(() => getSavedLabelSettings(), []);

  // Settings textboxes: Restored from previous saved configuration if present, otherwise blank
  const [marginTop, setMarginTop] = useState<string>(savedSettings?.marginTop ?? '');
  const [marginBottom, setMarginBottom] = useState<string>(savedSettings?.marginBottom ?? '');
  const [marginLeft, setMarginLeft] = useState<string>(savedSettings?.marginLeft ?? '');
  const [marginRight, setMarginRight] = useState<string>(savedSettings?.marginRight ?? '');
  const [colGap, setColGap] = useState<string>(savedSettings?.colGap ?? '');
  const [rowGap, setRowGap] = useState<string>(savedSettings?.rowGap ?? '');
  const [labelWidth, setLabelWidth] = useState<string>(savedSettings?.labelWidth ?? '');
  const [labelHeight, setLabelHeight] = useState<string>(savedSettings?.labelHeight ?? '');

  // Layout options
  const [columnsCount, setColumnsCount] = useState<number>(savedSettings?.columnsCount ?? 2);
  const [labelsPerPage, setLabelsPerPage] = useState<number>(savedSettings?.labelsPerPage ?? 4);
  const [showSettingsPanel, setShowSettingsPanel] = useState<boolean>(true);
  const [showSuggestionsBox, setShowSuggestionsBox] = useState<boolean>(true);

  // Automatically save any changes into localStorage so settings never have to be re-entered
  useEffect(() => {
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify({
        marginTop,
        marginBottom,
        marginLeft,
        marginRight,
        colGap,
        rowGap,
        labelWidth,
        labelHeight,
        columnsCount,
        labelsPerPage
      }));
    } catch (err) {
      // Ignore storage errors
    }
  }, [marginTop, marginBottom, marginLeft, marginRight, colGap, rowGap, labelWidth, labelHeight, columnsCount, labelsPerPage]);

  const clinicName = clinicSettings?.ClinicName || "Punjab Homeopathic Clinic & Pharmacy";

  // System suggestions for A5 Landscape (210mm × 148mm)
  const suggested = useMemo(() => {
    return {
      marginTop: '6mm',
      marginBottom: '6mm',
      marginLeft: '10mm',
      marginRight: '10mm',
      colGap: '15mm',
      rowGap: '6mm',
      labelWidth: '55mm',
      labelHeight: '24mm',
      name: 'A5 Landscape (210mm × 148mm)',
      aspect: 'aspect-[210/148]',
      tips: 'Recommended for 2×2 grid sticker sheets in A5 horizontal orientation.'
    };
  }, []);

  // Helper to parse input values: if user types number only (e.g. "8"), auto-append "mm"
  const resolveUnit = (val: string, fallback: string): string => {
    const trimmed = (val || '').trim();
    if (!trimmed) return fallback;
    if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
      return `${trimmed}mm`;
    }
    return trimmed;
  };

  // Resolved values used for preview & printing (empty textboxes smoothly use recommended fallback)
  const resolvedMarginTop = resolveUnit(marginTop, suggested.marginTop);
  const resolvedMarginBottom = resolveUnit(marginBottom, suggested.marginBottom);
  const resolvedMarginLeft = resolveUnit(marginLeft, suggested.marginLeft);
  const resolvedMarginRight = resolveUnit(marginRight, suggested.marginRight);
  const resolvedColGap = resolveUnit(colGap, suggested.colGap);
  const resolvedRowGap = resolveUnit(rowGap, suggested.rowGap);
  const resolvedLabelWidth = resolveUnit(labelWidth, suggested.labelWidth);
  const resolvedLabelHeight = resolveUnit(labelHeight, suggested.labelHeight);

  // Quick Action: Auto-fill suggested values
  const handleApplySuggested = () => {
    setMarginTop(suggested.marginTop);
    setMarginBottom(suggested.marginBottom);
    setMarginLeft(suggested.marginLeft);
    setMarginRight(suggested.marginRight);
    setColGap(suggested.colGap);
    setRowGap(suggested.rowGap);
    setLabelWidth(suggested.labelWidth);
    setLabelHeight(suggested.labelHeight);
  };

  // Quick Action: Clear all inputs to blank as requested
  const handleClearAllInputs = () => {
    setMarginTop('');
    setMarginBottom('');
    setMarginLeft('');
    setMarginRight('');
    setColGap('');
    setRowGap('');
    setLabelWidth('');
    setLabelHeight('');
    try {
      localStorage.removeItem(SETTINGS_STORAGE_KEY);
    } catch (err) {
      // Ignore
    }
  };

  // Check visibility and data availability after all hooks have been called
  if (!isLabelPrintModalOpen || !labelPrintData) return null;

  // Pagination calculation based on user selection
  const effectivePerPage = labelsPerPage === 0 ? labelPrintData.medicines.length : labelsPerPage;
  const totalPages = Math.ceil(labelPrintData.medicines.length / (effectivePerPage || 1)) || 1;

  // Dedicated self-contained print function applying exact custom A5 landscape & custom margins
  const executePrint = () => {
    if (isPrintingRef.current) return;
    isPrintingRef.current = true;

    try {
      if (currentUser && currentUser.Role !== 'Administrator' && currentUser.Permissions?.canPrintPOSInvoice === false) {
        alert("Printing Clinical Label Stickers is restricted by administrator permissions.");
        isPrintingRef.current = false;
        return;
      }

      // Build printable HTML pages based on pagination
      const printPagesHtml = Array.from({ length: totalPages }).map((_, pageIdx) => {
        const pageMeds = labelPrintData.medicines.slice(pageIdx * effectivePerPage, pageIdx * effectivePerPage + effectivePerPage);
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
            <title>Medicine Labels (A5 Landscape) - ${labelPrintData.patientName}</title>
            <style>
              @page {
                size: A5 landscape;
                size: 210mm 148mm;
                margin: ${resolvedMarginTop} ${resolvedMarginRight} ${resolvedMarginBottom} ${resolvedMarginLeft};
              }
              * {
                box-sizing: border-box;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              html, body {
                width: 210mm;
                margin: 0;
                padding: 0;
                background: #ffffff;
                color: #000000;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
                font-size: 8.5px;
                line-height: 1.15;
              }
              .label-grid-page {
                display: grid;
                grid-template-columns: repeat(${columnsCount}, ${resolvedLabelWidth});
                column-gap: ${resolvedColGap};
                row-gap: ${resolvedRowGap};
                box-sizing: border-box;
                page-break-inside: avoid;
                break-inside: avoid;
                page-break-after: always;
                break-after: page;
                margin: 0;
                padding: 0;
              }
              .label-grid-page:last-child {
                page-break-after: avoid;
                break-after: avoid;
              }
              .label-sticker-page {
                width: ${resolvedLabelWidth};
                min-height: ${resolvedLabelHeight};
                max-width: ${resolvedLabelWidth};
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
        // Method 2: If popups are blocked in iframe sandbox, use hidden iframe
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
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 md:p-6 z-[9999] overflow-y-auto print:absolute print:inset-0 print:bg-white print:p-0">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-4xl w-full max-h-[95vh] flex flex-col print:shadow-none print:border-0 print:max-h-full print:w-full print:rounded-none">
        
        {/* Dynamic Sticker Print Style Injector for direct window.print() */}
        <style dangerouslySetInnerHTML={{ __html: `
          @media print {
            @page {
              size: A5 landscape;
              size: 210mm 148mm;
              margin: ${resolvedMarginTop} ${resolvedMarginRight} ${resolvedMarginBottom} ${resolvedMarginLeft};
            }
            html, body {
              width: 210mm !important;
              max-width: 210mm !important;
              margin: 0 !important;
              padding: 0 !important;
              background: #ffffff !important;
            }
            body * {
              visibility: hidden !important;
            }
            #sticker-print-container, #sticker-print-container * {
              visibility: visible !important;
            }
            #sticker-print-container {
              position: absolute !important;
              left: 0 !important;
              top: 0 !important;
              width: 210mm !important;
              padding: 0 !important;
              margin: 0 !important;
              box-shadow: none !important;
              border: none !important;
              background: transparent !important;
            }
            .label-grid-page {
              display: grid !important;
              grid-template-columns: repeat(${columnsCount}, ${resolvedLabelWidth}) !important;
              column-gap: ${resolvedColGap} !important;
              row-gap: ${resolvedRowGap} !important;
              page-break-inside: avoid !important;
              break-inside: avoid !important;
              page-break-after: always !important;
              break-after: page !important;
              margin-bottom: 0 !important;
              padding: 0 !important;
            }
            .label-grid-page:last-child {
              page-break-after: avoid !important;
              break-after: avoid !important;
            }
            .label-sticker-page {
              width: ${resolvedLabelWidth} !important;
              min-height: ${resolvedLabelHeight} !important;
              max-width: ${resolvedLabelWidth} !important;
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

        {/* Modal Header & Quick Actions */}
        <div className="p-4 border-b border-slate-150 flex flex-wrap items-center justify-between gap-3 bg-slate-50 rounded-t-2xl print:hidden shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-sm font-black text-slate-900">Medicine Label Printer (A5 Landscape)</h3>
                <span className="px-2 py-0.5 rounded-full text-xxs font-black bg-indigo-600 text-white tracking-wide">
                  A5 • LANDSCAPE
                </span>
              </div>
              <p className="text-xxs text-slate-500 font-medium">
                Page Margins (Top / Bottom / Left / Right) & Label Spacing Gaps
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShowSettingsPanel(!showSettingsPanel)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition cursor-pointer border ${
                showSettingsPanel 
                  ? 'bg-slate-200 text-slate-800 border-slate-300' 
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
              }`}
            >
              <Sliders className="w-3.5 h-3.5 text-indigo-600" />
              <span>Settings</span>
              {showSettingsPanel ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            <button
              type="button"
              id="btn-print-medicine-labels-custom"
              onClick={executePrint}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-extrabold text-xs rounded-xl flex items-center shadow-md transition cursor-pointer hover:scale-[1.02]"
              title="Print labels with A5 Landscape layout"
            >
              <Printer className="w-4 h-4 mr-1.5" />
              Print Labels (A5 Landscape)
            </button>

            <button
              type="button"
              onClick={() => {
                setIsLabelPrintModalOpen(false);
                setLabelPrintData?.(null);
              }}
              className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Customizable Settings Panel (Expandable) */}
        {showSettingsPanel && (
          <div className="p-4 bg-slate-50/80 border-b border-slate-200 space-y-3.5 print:hidden shrink-0 text-xs overflow-y-auto max-h-[48vh]">
            
            {/* Row 1: Page Size, Orientation & Layout Grid */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
              
              {/* Page Size: A5 (Permanent) */}
              <div className="flex items-center space-x-2">
                <span className="font-bold text-slate-700 flex items-center space-x-1">
                  <FileText className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Page Size:</span>
                </span>
                <div className="flex rounded-lg bg-indigo-50 border border-indigo-200 px-3 py-1 text-xs font-bold text-indigo-700 items-center space-x-1 shadow-xs">
                  <span>A5 (148mm × 210mm)</span>
                </div>
              </div>

              {/* Orientation: Landscape (Permanent) */}
              <div className="flex items-center space-x-2">
                <span className="font-bold text-slate-700">Orientation:</span>
                <div className="flex rounded-lg bg-indigo-50 border border-indigo-200 px-3 py-1 text-xs font-bold text-indigo-700 items-center space-x-1.5 shadow-xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
                  <span>Landscape</span>
                </div>
              </div>

              {/* Columns Count */}
              <div className="flex items-center space-x-2">
                <span className="font-bold text-slate-700 flex items-center space-x-1">
                  <LayoutGrid className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Columns:</span>
                </span>
                <div className="flex rounded-lg bg-slate-100 p-0.5 border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setColumnsCount(2)}
                    className={`px-2.5 py-1 text-xs font-bold rounded-md transition cursor-pointer ${
                      columnsCount === 2 
                        ? 'bg-indigo-600 text-white shadow-xs' 
                        : 'text-slate-700 hover:text-slate-950'
                    }`}
                  >
                    2 Cols (Grid)
                  </button>
                  <button
                    type="button"
                    onClick={() => setColumnsCount(1)}
                    className={`px-2.5 py-1 text-xs font-bold rounded-md transition cursor-pointer ${
                      columnsCount === 1 
                        ? 'bg-indigo-600 text-white shadow-xs' 
                        : 'text-slate-700 hover:text-slate-950'
                    }`}
                  >
                    1 Col
                  </button>
                </div>
              </div>

              {/* Labels Per Page Selector */}
              <div className="flex items-center space-x-2">
                <span className="font-bold text-slate-700">Per Page:</span>
                <select
                  value={labelsPerPage}
                  onChange={(e) => setLabelsPerPage(Number(e.target.value))}
                  className="px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-800 cursor-pointer focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                >
                  <option value={4}>4 Labels (2×2)</option>
                  <option value={6}>6 Labels (2×3)</option>
                  <option value={8}>8 Labels (2×4)</option>
                  <option value={0}>All on One Page</option>
                </select>
              </div>

            </div>

            {/* Row 2: Margins Inputs (Top, Bottom, Left, Right) */}
            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-black text-slate-900 tracking-wide">
                    📐 Page Margins
                  </span>
                  <span className="text-xxs text-slate-500 font-medium">
                    (Saved automatically — enter values like 6mm, 10mm, or just numbers)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleClearAllInputs}
                  className="text-xxs font-bold text-rose-600 hover:text-rose-700 flex items-center space-x-1 cursor-pointer"
                  title="Clear all textboxes"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Clear Textboxes</span>
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div>
                  <label className="block text-xxs font-black text-slate-700 mb-1">
                    Top Margin <span className="text-slate-400 font-normal">({suggested.marginTop})</span>
                  </label>
                  <input
                    type="text"
                    value={marginTop}
                    onChange={(e) => setMarginTop(e.target.value)}
                    placeholder={`e.g. ${suggested.marginTop}`}
                    className="w-full px-2.5 py-1.5 bg-slate-50 focus:bg-white border border-slate-300 focus:border-indigo-600 rounded-lg text-xs font-bold text-slate-900 focus:outline-hidden transition"
                  />
                </div>

                <div>
                  <label className="block text-xxs font-black text-slate-700 mb-1">
                    Bottom Margin <span className="text-slate-400 font-normal">({suggested.marginBottom})</span>
                  </label>
                  <input
                    type="text"
                    value={marginBottom}
                    onChange={(e) => setMarginBottom(e.target.value)}
                    placeholder={`e.g. ${suggested.marginBottom}`}
                    className="w-full px-2.5 py-1.5 bg-slate-50 focus:bg-white border border-slate-300 focus:border-indigo-600 rounded-lg text-xs font-bold text-slate-900 focus:outline-hidden transition"
                  />
                </div>

                <div>
                  <label className="block text-xxs font-black text-slate-700 mb-1">
                    Left Margin <span className="text-slate-400 font-normal">({suggested.marginLeft})</span>
                  </label>
                  <input
                    type="text"
                    value={marginLeft}
                    onChange={(e) => setMarginLeft(e.target.value)}
                    placeholder={`e.g. ${suggested.marginLeft}`}
                    className="w-full px-2.5 py-1.5 bg-slate-50 focus:bg-white border border-slate-300 focus:border-indigo-600 rounded-lg text-xs font-bold text-slate-900 focus:outline-hidden transition"
                  />
                </div>

                <div>
                  <label className="block text-xxs font-black text-slate-700 mb-1">
                    Right Margin <span className="text-slate-400 font-normal">({suggested.marginRight})</span>
                  </label>
                  <input
                    type="text"
                    value={marginRight}
                    onChange={(e) => setMarginRight(e.target.value)}
                    placeholder={`e.g. ${suggested.marginRight}`}
                    className="w-full px-2.5 py-1.5 bg-slate-50 focus:bg-white border border-slate-300 focus:border-indigo-600 rounded-lg text-xs font-bold text-slate-900 focus:outline-hidden transition"
                  />
                </div>
              </div>
            </div>

            {/* Row 3: Label Dimensions & Spacing Gaps */}
            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs space-y-2">
              <span className="text-xs font-black text-slate-900 tracking-wide block">
                🏷️ Label Dimensions & Grid Gaps
              </span>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div>
                  <label className="block text-xxs font-black text-slate-700 mb-1">
                    Column Gap <span className="text-slate-400 font-normal">({suggested.colGap})</span>
                  </label>
                  <input
                    type="text"
                    value={colGap}
                    onChange={(e) => setColGap(e.target.value)}
                    placeholder={`e.g. ${suggested.colGap}`}
                    className="w-full px-2.5 py-1.5 bg-slate-50 focus:bg-white border border-slate-300 focus:border-indigo-600 rounded-lg text-xs font-bold text-slate-900 focus:outline-hidden transition"
                  />
                </div>

                <div>
                  <label className="block text-xxs font-black text-slate-700 mb-1">
                    Row Gap <span className="text-slate-400 font-normal">({suggested.rowGap})</span>
                  </label>
                  <input
                    type="text"
                    value={rowGap}
                    onChange={(e) => setRowGap(e.target.value)}
                    placeholder={`e.g. ${suggested.rowGap}`}
                    className="w-full px-2.5 py-1.5 bg-slate-50 focus:bg-white border border-slate-300 focus:border-indigo-600 rounded-lg text-xs font-bold text-slate-900 focus:outline-hidden transition"
                  />
                </div>

                <div>
                  <label className="block text-xxs font-black text-slate-700 mb-1">
                    Label Width <span className="text-slate-400 font-normal">({suggested.labelWidth})</span>
                  </label>
                  <input
                    type="text"
                    value={labelWidth}
                    onChange={(e) => setLabelWidth(e.target.value)}
                    placeholder={`e.g. ${suggested.labelWidth}`}
                    className="w-full px-2.5 py-1.5 bg-slate-50 focus:bg-white border border-slate-300 focus:border-indigo-600 rounded-lg text-xs font-bold text-slate-900 focus:outline-hidden transition"
                  />
                </div>

                <div>
                  <label className="block text-xxs font-black text-slate-700 mb-1">
                    Label Height <span className="text-slate-400 font-normal">({suggested.labelHeight})</span>
                  </label>
                  <input
                    type="text"
                    value={labelHeight}
                    onChange={(e) => setLabelHeight(e.target.value)}
                    placeholder={`e.g. ${suggested.labelHeight}`}
                    className="w-full px-2.5 py-1.5 bg-slate-50 focus:bg-white border border-slate-300 focus:border-indigo-600 rounded-lg text-xs font-bold text-slate-900 focus:outline-hidden transition"
                  />
                </div>
              </div>
            </div>

            {/* Row 4: Suggested Settings Guidance & 1-Click Auto-Fill */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-amber-950 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Lightbulb className="w-4 h-4 text-amber-600 shrink-0" />
                  <span className="font-extrabold text-xs text-amber-900">
                    💡 Suggested Values Guide for A5 Landscape (210mm × 148mm)
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={handleApplySuggested}
                    className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white font-black text-xxs rounded-lg shadow-xs transition cursor-pointer flex items-center space-x-1"
                    title="Fill all empty boxes with these suggested values"
                  >
                    <Check className="w-3 h-3" />
                    <span>Apply Suggested Values</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowSuggestionsBox(!showSuggestionsBox)}
                    className="text-amber-800 hover:text-amber-950 text-xxs font-bold underline cursor-pointer"
                  >
                    {showSuggestionsBox ? 'Hide' : 'Details'}
                  </button>
                </div>
              </div>

              {showSuggestionsBox && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xxs text-amber-900/90 pt-1 border-t border-amber-200/60 leading-relaxed">
                  <div>
                    <strong className="block text-amber-950 font-bold mb-0.5">🔹 A5 Landscape (210mm × 148mm - Best for 2×2 Grid):</strong>
                    <p>• Margins: Top: <code>6mm</code>, Bottom: <code>6mm</code>, Left: <code>10mm</code>, Right: <code>10mm</code></p>
                    <p>• Spacing: Col Gap: <code>15mm</code>, Row Gap: <code>6mm</code></p>
                    <p>• Label Size: Width: <code>55mm</code> (2.1"), Height: <code>24mm</code> (0.9")</p>
                  </div>
                  <div>
                    <strong className="block text-amber-950 font-bold mb-0.5">🔹 Printable Compatibility:</strong>
                    <p>• Paper Size: Automatically formatted for standard A5 sheets (148mm × 210mm).</p>
                    <p>• Orientation: Fixed to Landscape to prevent page clipping and printer alignment issues.</p>
                  </div>
                  <div className="sm:col-span-2 text-amber-800 italic bg-amber-100/50 p-1.5 rounded">
                    📌 <strong>Note:</strong> Enter numbers only (e.g. <strong>6</strong> or <strong>10</strong>) to auto-apply millimeters (mm), or specify units like <strong>0.5in</strong> or <strong>2in</strong>. When left empty, recommended defaults apply automatically.
                  </div>
                </div>
              )}
            </div>

          </div>
        )}

        {/* Live Interactive Print Preview Area */}
        <div 
          className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-200/70 print:bg-white flex flex-col items-center" 
          id="sticker-print-container"
        >
          {/* Active Settings Live Badge */}
          <div className="mb-3 text-center print:hidden">
            <span className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-slate-800 text-white text-xxs font-mono shadow-xs">
              <span>📄 Sheet: <strong>A5 (Landscape)</strong></span>
              <span>•</span>
              <span>Margins: T:{resolvedMarginTop} B:{resolvedMarginBottom} L:{resolvedMarginLeft} R:{resolvedMarginRight}</span>
              <span>•</span>
              <span>Gap: {resolvedColGap}</span>
            </span>
          </div>

          {/* Render Pages */}
          {Array.from({ length: totalPages }).map((_, pageIdx) => {
            const pageMeds = labelPrintData.medicines.slice(pageIdx * effectivePerPage, pageIdx * effectivePerPage + effectivePerPage);
            return (
              <div 
                key={pageIdx} 
                className="bg-white border border-slate-300 rounded-xl shadow-md mb-6 print:mb-0 print:border-none print:shadow-none print:rounded-none w-full max-w-[620px] aspect-[210/148] transition-all"
                style={{
                  paddingTop: resolvedMarginTop,
                  paddingBottom: resolvedMarginBottom,
                  paddingLeft: resolvedMarginLeft,
                  paddingRight: resolvedMarginRight,
                }}
              >
                {/* Page Indicator Tag (Screen Only) */}
                <div className="flex justify-between items-center pb-2 mb-2 border-b border-dashed border-slate-200 print:hidden text-xxs text-slate-400 font-semibold">
                  <span>Page {pageIdx + 1} of {totalPages} (A5 Landscape)</span>
                  <span>{pageMeds.length} Labels on Page</span>
                </div>

                {/* The Labels Grid */}
                <div 
                  className="label-grid-page grid"
                  style={{
                    gridTemplateColumns: `repeat(${columnsCount}, minmax(0, 1fr))`,
                    columnGap: resolvedColGap,
                    rowGap: resolvedRowGap,
                  }}
                >
                  {pageMeds.map((med, idx) => (
                    <div 
                      key={idx} 
                      className="label-sticker-page bg-white border border-dashed border-slate-400 rounded p-1.5 font-sans text-slate-900 flex flex-col justify-between text-[9px] leading-tight box-border shadow-2xs hover:border-indigo-400 transition"
                      style={{
                        minHeight: resolvedLabelHeight,
                      }}
                    >
                      <div className="space-y-0.5">
                        <div className="font-bold text-[9px] m-0 p-0 truncate">
                          <span className="text-slate-500 font-normal">Patient: </span>
                          <strong className="text-slate-900 font-black">{labelPrintData.patientName}</strong>
                        </div>
                        <div className="font-bold text-[9px] m-0 p-0 truncate">
                          <span className="text-slate-500 font-normal">Med: </span>
                          <strong className="text-slate-900 font-black">{med.name || "Clinical Remedy"}</strong>
                        </div>
                        <div className="text-[8.5px] m-0 p-0 truncate text-slate-700">
                          <span className="text-slate-500 font-normal">Usage: </span>
                          <span className="font-bold text-slate-900">{med.instructions || "As directed by Doctor"}</span>
                        </div>
                      </div>

                      <div className="font-bold text-[7.5px] m-0 p-0 truncate flex justify-between items-center border-t border-slate-200 pt-1 mt-1 text-slate-500">
                        <span>Exp: <strong className="font-black text-slate-900">{med.expiry || "N/A"}</strong></span>
                        <span className="text-[7px] text-slate-400 truncate max-w-[90px]">{clinicName}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal Footer Controls */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 rounded-b-2xl flex flex-wrap items-center justify-between gap-2 print:hidden shrink-0 text-xs">
          <div className="text-slate-500 text-xxs font-medium">
            💡 Tip: Print preview automatically formats for A5 Landscape with your custom margins.
          </div>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => {
                setIsLabelPrintModalOpen(false);
                setLabelPrintData?.(null);
              }}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
            >
              Close
            </button>
            <button
              type="button"
              onClick={executePrint}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl shadow-md transition cursor-pointer flex items-center space-x-1.5"
            >
              <Printer className="w-4 h-4" />
              <span>Print {labelPrintData.medicines.length} Labels (A5 Landscape)</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default PharmacyLabelPrintModal;
