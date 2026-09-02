/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ThermalPrinterSettings } from '../types';

export const DEFAULT_THERMAL_SETTINGS: ThermalPrinterSettings = {
  paperWidth: 80, // mm
  printableWidth: 72, // mm (Safe POS printable area)
  paperHeightMode: 'auto',
  fixedHeightMm: 200,
  marginTop: 1, // mm
  marginBottom: 8, // mm (Feed space before autocut)
  marginLeft: 1, // mm
  marginRight: 1, // mm
  scalePercent: 100, // %
  baseFontSize: 11.5, // px
  lineHeight: 1.25,
  fontFamily: 'monospace',
  headerTitleSize: 14, // px
  showHeaderLogoText: true,
  showHeaderAddress: true,
  showHeaderPhone: true,
  dividerStyle: 'dashed',
  tokenCardStyle: 'boxed',
  showCutLine: true,
  showFooterTimestamp: true,
  footerCustomMessage: 'Thank you for choosing Punjab Homeopathic Clinic & Pharmacy. Wish you a speedy recovery!',
  autoPrintPopup: true
};

export interface ThermalPreset {
  id: string;
  name: string;
  badge: string;
  description: string;
  settings: Partial<ThermalPrinterSettings>;
}

export const THERMAL_PRESETS: ThermalPreset[] = [
  {
    id: 'pos_80mm_standard',
    name: '80mm Standard POS (Recommended)',
    badge: 'Standard 80mm',
    description: 'Industry standard 80mm roll with 72mm printable width, safe 1mm side margins & balanced typography.',
    settings: {
      paperWidth: 80,
      printableWidth: 72,
      paperHeightMode: 'auto',
      marginTop: 1,
      marginBottom: 8,
      marginLeft: 1,
      marginRight: 1,
      scalePercent: 100,
      baseFontSize: 11.5,
      lineHeight: 1.25,
      fontFamily: 'monospace',
      headerTitleSize: 14,
      dividerStyle: 'dashed',
      showCutLine: true
    }
  },
  {
    id: 'pos_80mm_wide',
    name: '80mm Full-Width (Edge-to-Edge)',
    badge: 'Max Width 76mm',
    description: 'Expands printable area to 76mm with zero margins for high-capacity tabular item rows.',
    settings: {
      paperWidth: 80,
      printableWidth: 76,
      paperHeightMode: 'auto',
      marginTop: 0,
      marginBottom: 6,
      marginLeft: 0,
      marginRight: 0,
      scalePercent: 100,
      baseFontSize: 12,
      lineHeight: 1.25,
      fontFamily: 'monospace',
      headerTitleSize: 15,
      dividerStyle: 'solid',
      showCutLine: true
    }
  },
  {
    id: 'pos_58mm_compact',
    name: '58mm Compact POS Roll (2-Inch)',
    badge: 'Compact 58mm',
    description: 'Optimized for small 58mm thermal printers with 48mm printable area and high-density font scaling.',
    settings: {
      paperWidth: 58,
      printableWidth: 48,
      paperHeightMode: 'auto',
      marginTop: 0,
      marginBottom: 6,
      marginLeft: 0.5,
      marginRight: 0.5,
      scalePercent: 95,
      baseFontSize: 10,
      lineHeight: 1.20,
      fontFamily: 'monospace',
      headerTitleSize: 12,
      dividerStyle: 'dashed',
      showCutLine: true
    }
  },
  {
    id: 'token_ticket_speed',
    name: 'OPD Fast Token Ticket Mode',
    badge: 'Token Priority',
    description: 'High-contrast large token numbering with extra emphasis on patient queue details.',
    settings: {
      paperWidth: 80,
      printableWidth: 72,
      paperHeightMode: 'auto',
      marginTop: 1,
      marginBottom: 8,
      marginLeft: 1,
      marginRight: 1,
      scalePercent: 100,
      baseFontSize: 11.5,
      lineHeight: 1.25,
      fontFamily: 'monospace',
      headerTitleSize: 14.5,
      tokenCardStyle: 'boxed',
      dividerStyle: 'double',
      showCutLine: true
    }
  },
  {
    id: 'eco_paper_saver',
    name: 'Eco-Paper Saver (High Density)',
    badge: 'Paper Saver',
    description: 'Minimizes paper usage with ultra-tight spacing, reduced cut feed and compact header.',
    settings: {
      paperWidth: 80,
      printableWidth: 72,
      paperHeightMode: 'auto',
      marginTop: 0,
      marginBottom: 3,
      marginLeft: 0.5,
      marginRight: 0.5,
      scalePercent: 90,
      baseFontSize: 10.5,
      lineHeight: 1.15,
      fontFamily: 'monospace',
      headerTitleSize: 12.5,
      showHeaderAddress: false,
      dividerStyle: 'dashed',
      showCutLine: false
    }
  }
];

const STORAGE_KEY = 'cms_thermal_printer_settings';

export function getThermalSettings(): ThermalPrinterSettings {
  if (typeof window === 'undefined') return { ...DEFAULT_THERMAL_SETTINGS };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_THERMAL_SETTINGS };
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_THERMAL_SETTINGS, ...parsed };
  } catch {
    return { ...DEFAULT_THERMAL_SETTINGS };
  }
}

export function saveThermalSettings(settings: ThermalPrinterSettings): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    window.dispatchEvent(new CustomEvent('cms_thermal_settings_updated', { detail: settings }));
  } catch (err) {
    console.error('Failed to save thermal printer settings:', err);
  }
}

export function generateThermalStyles(s: ThermalPrinterSettings): string {
  const fontFam = s.fontFamily === 'sans-serif'
    ? 'Arial, Helvetica, sans-serif'
    : s.fontFamily === 'courier'
      ? '"Courier New", Courier, monospace'
      : '"Courier New", Courier, "Lucida Console", Monaco, monospace';

  const dividerBorder = s.dividerStyle === 'dotted'
    ? '1.5px dotted #000000'
    : s.dividerStyle === 'solid'
      ? '1.5px solid #000000'
      : s.dividerStyle === 'double'
        ? '3px double #000000'
        : '1.5px dashed #000000';

  const pageHeightRule = s.paperHeightMode === 'fixed'
    ? `${s.fixedHeightMm}mm`
    : 'auto';

  return `
    * {
      box-sizing: border-box !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    @media print {
      @page {
        size: ${s.paperWidth}mm ${pageHeightRule};
        margin: 0;
      }
      html, body {
        width: 100% !important;
        max-width: 100% !important;
        min-width: 100% !important;
        margin: 0 !important;
        padding: ${s.marginTop}mm ${s.marginRight}mm ${s.marginBottom}mm ${s.marginLeft}mm !important;
      }
      .no-print {
        display: none !important;
      }
    }
    html, body {
      width: 100%;
      max-width: ${s.printableWidth}mm;
      min-width: ${Math.min(s.printableWidth, s.paperWidth - 4)}mm;
      margin: 0 auto;
      padding: ${s.marginTop}mm ${s.marginRight}mm ${s.marginBottom}mm ${s.marginLeft}mm;
      color: #000000;
      background: #ffffff;
      font-family: ${fontFam};
      font-size: ${s.baseFontSize}px;
      line-height: ${s.lineHeight};
      word-wrap: break-word;
      overflow-wrap: break-word;
      zoom: ${s.scalePercent / 100};
      -webkit-text-size-adjust: none;
    }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .text-left { text-align: left; }
    .text-bold { font-weight: 900; }
    .full-width { width: 100%; box-sizing: border-box; }
    
    .clinic-header { text-align: center; margin-bottom: 4px; width: 100%; }
    .clinic-name {
      font-size: ${s.headerTitleSize}px;
      font-weight: 900;
      text-transform: uppercase;
      margin: 0;
      line-height: 1.15;
      font-family: Arial, sans-serif;
      word-break: break-word;
    }
    .clinic-sub {
      font-size: ${Math.max(9, s.baseFontSize - 2)}px;
      font-weight: bold;
      color: #111;
      margin-top: 2px;
      text-transform: uppercase;
      word-break: break-word;
    }
    .clinic-contact {
      font-size: ${Math.max(8.5, s.baseFontSize - 2.5)}px;
      margin-top: 1.5px;
      line-height: 1.25;
    }
    .divider {
      border-top: ${dividerBorder};
      margin: 4px 0;
      width: 100%;
    }
    .receipt-table {
      width: 100%;
      border-collapse: collapse;
      margin: 4px 0;
      font-size: ${s.baseFontSize}px;
    }
    .receipt-table th {
      border-top: ${dividerBorder};
      border-bottom: ${dividerBorder};
      padding: 3px 1px;
      text-align: left;
      font-weight: 900;
      font-size: ${Math.max(9.5, s.baseFontSize - 1)}px;
    }
    .receipt-table td {
      padding: 2.5px 1px;
      vertical-align: top;
    }
    .row-meta {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      margin: 2px 0;
      font-size: ${Math.max(9.5, s.baseFontSize - 1)}px;
      width: 100%;
    }
    .token-card {
      border: ${s.tokenCardStyle === 'boxed' ? '2px solid #000000' : '1px dashed #000000'};
      padding: 6px 4px;
      margin: 5px 0;
      text-align: center;
      border-radius: 4px;
      background: ${s.tokenCardStyle === 'inverted' ? '#000000' : '#ffffff'};
      color: ${s.tokenCardStyle === 'inverted' ? '#ffffff' : '#000000'};
      width: 100%;
      box-sizing: border-box;
    }
    .token-title {
      font-size: ${Math.max(10, s.baseFontSize - 1)}px;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 1px;
      font-family: sans-serif;
    }
    .token-number {
      font-size: ${Math.round(s.baseFontSize * 3.2)}px;
      font-weight: 900;
      font-family: Arial, sans-serif;
      margin: 2px 0;
      line-height: 1;
    }
    .token-shift {
      font-size: ${Math.max(9, s.baseFontSize - 2)}px;
      font-weight: 800;
      text-transform: uppercase;
      background: ${s.tokenCardStyle === 'inverted' ? '#ffffff' : '#000000'};
      color: ${s.tokenCardStyle === 'inverted' ? '#000000' : '#ffffff'};
      padding: 2px 6px;
      display: inline-block;
      border-radius: 2px;
      margin-top: 2px;
    }
    .total-box {
      font-size: ${s.baseFontSize + 1.5}px;
      font-weight: 900;
      padding: 3px 0;
      border-top: ${dividerBorder};
      border-bottom: ${dividerBorder};
      margin: 4px 0;
    }
    .footer-note {
      font-size: ${Math.max(8.5, s.baseFontSize - 2.5)}px;
      text-align: center;
      margin-top: 5px;
      font-weight: bold;
      line-height: 1.3;
      width: 100%;
      word-break: break-word;
    }
    .cut-line {
      margin-top: 8px;
      padding-top: 4px;
      border-top: 1px dashed #888888;
      text-align: center;
      font-size: 9px;
      color: #666666;
    }
  `;
}

export function printThermalTestSlip(s: ThermalPrinterSettings, clinic: any, sampleMode: 'pharmacy' | 'token' = 'pharmacy'): void {
  const printWin = window.open('', '_blank', 'width=450,height=650');
  if (!printWin) {
    alert('Popup blocked! Please allow popups in your browser to print the thermal test receipt.');
    return;
  }

  const clinicName = clinic?.ClinicName || 'PUNJAB HOMEOPATHIC CLINIC & PHARMACY';
  const cPhone = clinic?.PhoneMobile || clinic?.PhoneNo || '+92-311-4000608';
  const cAddress = clinic?.ClinicAddress || clinic?.Address || '10 Shalimar Road, Garhi Shahu, Lahore 39 Pakistan';
  const cWebsite = clinic?.Website || 'https://punjabhomeopathic.pk';
  const dateStr = new Date().toISOString().split('T')[0];
  const timeStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

  const css = generateThermalStyles(s);

  let bodyContent = '';

  if (sampleMode === 'pharmacy') {
    bodyContent = `
      <div class="clinic-header">
        <h2 class="clinic-name">${clinicName}</h2>
        ${s.showHeaderLogoText ? `<div class="clinic-sub">RETAIL PHARMACY & DISPENSARY</div>` : ''}
        ${s.showHeaderAddress ? `<div class="clinic-contact">${cAddress}</div>` : ''}
        ${s.showHeaderPhone ? `<div class="clinic-contact"><b>Tel:</b> ${cPhone} | <b>Web:</b> ${cWebsite.replace(/^https?:\/\//, '')}</div>` : ''}
      </div>

      <div class="divider"></div>

      <div class="row-meta">
        <span><b>INV NO:</b> POS-TEST-${Date.now().toString().slice(-4)}</span>
        <span><b>SHIFT:</b> MORNING (1)</span>
      </div>
      <div class="row-meta">
        <span><b>DATE:</b> ${dateStr}</span>
        <span><b>TIME:</b> ${timeStr}</span>
      </div>
      <div class="row-meta">
        <span><b>PATIENT:</b> Zaigham Ali (ID: P-1024)</span>
      </div>
      <div class="row-meta">
        <span><b>CASHIER:</b> Pharmacist on Duty</span>
      </div>

      <div class="divider"></div>

      <table class="receipt-table">
        <thead>
          <tr>
            <th style="width: 50%;">ITEM</th>
            <th style="width: 15%; text-align: center;">QTY</th>
            <th style="width: 15%; text-align: right;">RATE</th>
            <th style="width: 20%; text-align: right;">TOTAL</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <b>ARNICA MONT 200C</b>
              <div style="font-size: ${Math.max(8.5, s.baseFontSize - 3)}px; color: #444;">Clinical Drops 30ml</div>
            </td>
            <td style="text-align: center;">1</td>
            <td style="text-align: right;">350</td>
            <td style="text-align: right; font-weight: bold;">350</td>
          </tr>
          <tr>
            <td>
              <b>ECHINACEA Q MOTHER T.</b>
              <div style="font-size: ${Math.max(8.5, s.baseFontSize - 3)}px; color: #444;">Oral Liquid 60ml</div>
            </td>
            <td style="text-align: center;">2</td>
            <td style="text-align: right;">450</td>
            <td style="text-align: right; font-weight: bold;">900</td>
          </tr>
          <tr>
            <td>
              <b>CALCAREA PHOS 6X</b>
              <div style="font-size: ${Math.max(8.5, s.baseFontSize - 3)}px; color: #444;">Biochemic Tablets 20g</div>
            </td>
            <td style="text-align: center;">1</td>
            <td style="text-align: right;">250</td>
            <td style="text-align: right; font-weight: bold;">250</td>
          </tr>
        </tbody>
      </table>

      <div class="divider"></div>

      <div class="row-meta">
        <span><b>GROSS AMOUNT:</b></span>
        <span style="font-weight: bold;">PKR 1,500</span>
      </div>
      <div class="row-meta">
        <span><b>DISCOUNT:</b></span>
        <span>PKR 0</span>
      </div>
      <div class="total-box">
        <div style="display: flex; justify-content: space-between;">
          <span>NET AMOUNT PAID:</span>
          <span>PKR 1,500</span>
        </div>
      </div>
      <div class="row-meta">
        <span><b>PAYMENT METHOD:</b></span>
        <span>CASH (PAID)</span>
      </div>

      ${s.footerCustomMessage ? `<div class="footer-note">${s.footerCustomMessage}</div>` : ''}
      ${s.showFooterTimestamp ? `<div style="font-size: ${Math.max(8, s.baseFontSize - 3.5)}px; text-align: center; margin-top: 3px; color: #333;">System Printed: ${dateStr} ${timeStr} • Thermal Config Verified</div>` : ''}

      ${s.showCutLine ? `<div class="cut-line">-- ✂ -- TEAR OR CUT HERE -- ✂ --</div>` : ''}
    `;
  } else {
    bodyContent = `
      <div class="clinic-header">
        <h2 class="clinic-name">${clinicName}</h2>
        <div class="clinic-sub">OPD CONSULTATION TOKEN TICKET</div>
        ${s.showHeaderAddress ? `<div class="clinic-contact">${cAddress}</div>` : ''}
        ${s.showHeaderPhone ? `<div class="clinic-contact">📞 ${cPhone} | 🌐 ${cWebsite.replace(/^https?:\/\//, '')}</div>` : ''}
      </div>

      <div class="divider"></div>

      <div class="token-card">
        <div class="token-title">OPD TOKEN NO</div>
        <div class="token-number">#14</div>
        <div class="token-shift">MORNING SHIFT (08:30 AM - 12:00 PM)</div>
      </div>

      <div class="divider"></div>

      <div class="row-meta">
        <span><b>PATIENT ID:</b></span>
        <span style="font-family: monospace; font-weight: bold;">P-1024</span>
      </div>
      <div class="row-meta">
        <span><b>PATIENT NAME:</b></span>
        <span><b>Zaigham Ali Anjum</b></span>
      </div>
      <div class="row-meta">
        <span><b>AGE / GENDER:</b></span>
        <span>34 Yrs / Male</span>
      </div>
      <div class="row-meta">
        <span><b>PHONE NO:</b></span>
        <span>0311-4000608</span>
      </div>
      <div class="row-meta">
        <span><b>DATE / TIME:</b></span>
        <span>${dateStr} ${timeStr}</span>
      </div>

      <div class="total-box text-center" style="font-size: ${s.baseFontSize + 2}px; margin-top: 6px;">
        OPD CONSULTATION FEE: PKR 1,000
      </div>

      ${s.footerCustomMessage ? `<div class="footer-note">${s.footerCustomMessage}</div>` : ''}
      <div style="font-size: ${Math.max(8.5, s.baseFontSize - 3)}px; text-align: center; margin-top: 3px; font-weight: bold;">
        Please wait in the clinic waiting area until your token number #14 is called.
      </div>

      ${s.showCutLine ? `<div class="cut-line">-- ✂ -- TEAR OR CUT HERE -- ✂ --</div>` : ''}
    `;
  }

  printWin.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Thermal Test Slip - ${sampleMode === 'pharmacy' ? 'POS Receipt' : 'Token Ticket'}</title>
        <meta charset="utf-8" />
        <style>${css}</style>
      </head>
      <body>
        ${bodyContent}
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 300);
          };
        </script>
      </body>
    </html>
  `);
  printWin.document.close();
}
