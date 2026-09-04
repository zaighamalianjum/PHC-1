/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Patient, Item, InvoiceHeader, InvoiceDetail, User, UserRight } from '../types';
import { numToWords } from './pharmacyUtils';
import { getThermalSettings, generateThermalStyles } from './thermalPrinterConfig';

export interface PharmacyPrintContext {
  currentUser?: User;
  userRights?: UserRight[];
  clinicSettings?: any;
  items: Item[];
  invoices: InvoiceHeader[];
  invoiceDetails: InvoiceDetail[];
  patients?: Patient[];
  selectedDailyReportDate?: string;
  salesReportPeriodMode?: 'single' | 'range' | 'all';
  salesReportStartDate?: string;
  salesReportEndDate?: string;
  todayStr?: string;
  invLowStockFilter?: boolean;
  invCategoryFilter?: string;
  invSearchQuery?: string;
  poCategoryFilter?: string;
  poOnlyLowStock?: boolean;
  poPrintLayout?: '3col' | '2col' | 'tabular';
  getFilteredPoItems?: (items: Item[], catFilter: string, lowOnly: boolean) => Item[];
  selectedShiftFilter?: string;
  invSortField?: string;
  invSortOrder?: string;
}

export function createPharmacyPrintHelpers(ctx: PharmacyPrintContext) {
  const {
    currentUser,
    userRights = [],
    clinicSettings,
    items,
    invoices,
    invoiceDetails,
    patients = [],
    selectedDailyReportDate = '',
    salesReportPeriodMode = 'single',
    salesReportStartDate = '',
    salesReportEndDate = '',
    todayStr = new Date().toISOString().slice(0, 10),
    invLowStockFilter = false,
    invCategoryFilter = 'ALL',
    invSearchQuery = '',
    poCategoryFilter = 'ALL',
    poOnlyLowStock = false,
    poPrintLayout = '3col',
    getFilteredPoItems = (items: Item[]) => items,
    selectedShiftFilter = 'all',
    invSortField = 'ItemName',
    invSortOrder = 'asc'
  } = ctx;

  const getPatientName = (id: string) => {
    const p = patients.find((pat) => pat.PatientID === id);
    return p ? p.PatientName : 'Walk-in Customer';
  };

  const convertNumberToWords = numToWords;

  const handlePrintA4Invoice = (billData: {
    patient: Patient | null;
    basket: { ItemID: string; Qty: number; Price: number; MedicineType?: 'C' | 'P' | 'S' }[];
    discount: number;
    netAmount: number;
    shift: 1 | 2;
    invoiceNo: string;
    invoiceDate: string;
  }) => {
    if (currentUser?.Role !== 'Administrator' && (currentUser?.Permissions?.canPrintPOSInvoice === false || userRights.find(r => r.MenuID === 'pharmacy')?.PrintRec === false)) {
      alert("Printing Pharmacy POS Bills is restricted by administrator permissions.");
      return;
    }

    const win = window.open('', '_blank', 'width=1050,height=900');
    if (!win) {
      alert("Pop-up blocker prevented opening print window. Please allow pop-ups for this site.");
      return;
    }

    const clinicName = clinicSettings?.ClinicName || "Punjab Homeopathic Clinic & Pharmacy";
    const clinicAddress = clinicSettings?.ClinicAddress || clinicSettings?.Address || "10 Shalimar Road, Garhi Shahu, Lahore 39 Pakistan";
    const clinicPhone = clinicSettings?.PhoneMobile || clinicSettings?.PhoneNo || "+92-311-4000608";
    const clinicWebsite = clinicSettings?.Website || "https://punjabhomeopathic.pk";
    const clinicTagline = clinicSettings?.ClinicLogoText || "HEALING NATURALLY. RESTORING BALANCE.";
    const logoSrc = clinicSettings?.ClinicLogoImage || clinicSettings?.Logo || '/logo.png';
    const printTimeStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

    const grossTotal = billData.basket.reduce((sum, item) => sum + item.Qty * item.Price, 0);
    const amountInWords = convertNumberToWords(billData.netAmount);

    win.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>A4 Invoice - ${billData.invoiceNo} - ${clinicName}</title>
          <style>
            @page {
              size: A4 portrait;
              margin: 10mm 12mm 12mm 12mm;
            }
            * {
              box-sizing: border-box;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
              margin: 0;
              padding: 0;
              color: #0f172a;
              font-size: 11px;
              line-height: 1.4;
              background: #fff;
            }
            .invoice-wrapper {
              border: 2px solid #0f172a;
              border-radius: 8px;
              padding: 16px;
              min-height: 270mm;
              display: flex;
              flex-direction: column;
              justify-content: space-between;
            }
            .header-container {
              display: flex;
              align-items: center;
              justify-content: space-between;
              border-bottom: 2px solid #0f172a;
              padding-bottom: 12px;
              margin-bottom: 12px;
            }
            .brand-box {
              display: flex;
              align-items: center;
              gap: 12px;
            }
            .brand-logo {
              width: 55px;
              height: 55px;
              object-fit: contain;
            }
            .clinic-title {
              font-size: 20px;
              font-weight: 900;
              color: #1e1b4b;
              text-transform: uppercase;
              margin: 0;
              letter-spacing: -0.3px;
            }
            .clinic-subtitle {
              font-size: 10px;
              color: #475569;
              font-weight: 600;
              margin-top: 2px;
            }
            .clinic-contact {
              font-size: 9.5px;
              color: #334155;
              margin-top: 2px;
            }
            .badge-box {
              text-align: right;
            }
            .invoice-badge {
              display: inline-block;
              background: #1e1b4b;
              color: #fff;
              font-size: 12px;
              font-weight: 900;
              padding: 5px 12px;
              border-radius: 6px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .badge-sub {
              font-size: 9.5px;
              color: #64748b;
              font-weight: 700;
              margin-top: 4px;
            }
            
            /* Meta Grid */
            .meta-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 12px;
              margin-bottom: 14px;
            }
            .meta-card {
              background: #f8fafc;
              border: 1px solid #cbd5e1;
              border-radius: 6px;
              padding: 8px 12px;
            }
            .meta-card-title {
              font-size: 10px;
              font-weight: 900;
              text-transform: uppercase;
              color: #1e1b4b;
              border-bottom: 1px solid #e2e8f0;
              padding-bottom: 3px;
              margin-bottom: 6px;
              letter-spacing: 0.5px;
            }
            .meta-row {
              display: flex;
              justify-content: space-between;
              font-size: 10.5px;
              margin-bottom: 3px;
            }
            .meta-label {
              color: #64748b;
              font-weight: 600;
            }
            .meta-val {
              color: #0f172a;
              font-weight: 800;
            }

            /* Table */
            .table-container {
              margin-bottom: 14px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              font-size: 10.5px;
            }
            th {
              background: #0f172a;
              color: #fff;
              padding: 7px 8px;
              text-align: left;
              font-weight: 800;
              text-transform: uppercase;
              font-size: 9.5px;
              letter-spacing: 0.3px;
            }
            td {
              padding: 6px 8px;
              border-bottom: 1px solid #e2e8f0;
              color: #1e293b;
            }
            tr:nth-child(even) td {
              background: #f8fafc;
            }
            .col-center { text-align: center; }
            .col-right { text-align: right; }
            .col-bold { font-weight: 800; font-family: monospace; }
            
            /* Summary & Notes Section */
            .bottom-section {
              display: grid;
              grid-template-columns: 1.3fr 1fr;
              gap: 16px;
              margin-top: 10px;
            }
            .terms-box {
              border: 1px solid #e2e8f0;
              background: #fafafa;
              border-radius: 6px;
              padding: 10px;
              font-size: 9.5px;
            }
            .terms-title {
              font-weight: 900;
              text-transform: uppercase;
              color: #0f172a;
              margin-bottom: 4px;
            }
            .terms-list {
              margin: 0;
              padding-left: 14px;
              color: #475569;
              line-height: 1.35;
            }
            .summary-card {
              background: #f8fafc;
              border: 1.5px solid #0f172a;
              border-radius: 6px;
              padding: 10px;
            }
            .summary-row {
              display: flex;
              justify-content: space-between;
              font-size: 11px;
              margin-bottom: 4px;
              color: #334155;
            }
            .summary-total {
              border-top: 2px solid #0f172a;
              padding-top: 6px;
              margin-top: 6px;
              display: flex;
              justify-content: space-between;
              font-size: 14px;
              font-weight: 900;
              color: #0f172a;
            }
            .words-box {
              margin-top: 6px;
              padding: 5px 8px;
              background: #f1f5f9;
              border-radius: 4px;
              font-size: 9.5px;
              font-weight: 700;
              color: #1e1b4b;
              font-style: italic;
            }

            /* Signatures */
            .signatures-box {
              display: flex;
              justify-content: space-between;
              margin-top: 30px;
              padding-top: 10px;
            }
            .sig-line {
              width: 180px;
              text-align: center;
              border-top: 1.5px solid #0f172a;
              padding-top: 4px;
              font-size: 10px;
              font-weight: 800;
              color: #1e293b;
              text-transform: uppercase;
            }

            .footer-info {
              text-align: center;
              font-size: 8.5px;
              color: #64748b;
              margin-top: 12px;
              border-top: 1px dashed #cbd5e1;
              padding-top: 6px;
            }
          </style>
        </head>
        <body>
          <div class="invoice-wrapper">
            <div>
              <!-- Header -->
              <div class="header-container">
                <div class="brand-box">
                  <img src="${logoSrc}" class="brand-logo" alt="Logo" onerror="this.style.display='none'" />
                  <div>
                    <h1 class="clinic-title">${clinicName}</h1>
                    <div class="clinic-subtitle">${clinicTagline}</div>
                    <div class="clinic-contact">📍 ${clinicAddress} • 📞 ${clinicPhone} • 🌐 ${clinicWebsite.replace(/^https?:\/\//, '')}</div>
                  </div>
                </div>
                <div class="badge-box">
                  <div class="invoice-badge">PHARMACY INVOICE</div>
                  <div class="badge-sub">Computerized Tax & Cash Dispense Bill</div>
                </div>
              </div>

              <!-- Meta Grid -->
              <div class="meta-grid">
                <div class="meta-card">
                  <div class="meta-card-title">🧾 Invoice & Shift Information</div>
                  <div class="meta-row">
                    <span class="meta-label">Invoice Ref #:</span>
                    <span class="meta-val" style="font-family: monospace; font-size: 12px; color: #1e1b4b;">${billData.invoiceNo}</span>
                  </div>
                  <div class="meta-row">
                    <span class="meta-label">Date & Time:</span>
                    <span class="meta-val">${billData.invoiceDate} ${printTimeStr}</span>
                  </div>
                  <div class="meta-row">
                    <span class="meta-label">Operational Shift:</span>
                    <span class="meta-val">${billData.shift === 1 ? '☀️ Morning Shift (1)' : '🌙 Evening Shift (2)'}</span>
                  </div>
                  <div class="meta-row">
                    <span class="meta-label">Payment Status:</span>
                    <span class="meta-val" style="color: #047857;">PAID IN CASH (POSTED)</span>
                  </div>
                </div>

                <div class="meta-card">
                  <div class="meta-card-title">👤 Patient / Customer Details</div>
                  <div class="meta-row">
                    <span class="meta-label">Patient / Customer:</span>
                    <span class="meta-val" style="font-size: 11.5px;">${billData.patient ? billData.patient.PatientName : 'Walk-in Customer / Guest'}</span>
                  </div>
                  <div class="meta-row">
                    <span class="meta-label">Patient MR # / ID:</span>
                    <span class="meta-val" style="font-family: monospace;">${billData.patient ? billData.patient.PatientID : 'WALK-IN'}</span>
                  </div>
                  <div class="meta-row">
                    <span class="meta-label">Contact Mobile:</span>
                    <span class="meta-val">${billData.patient?.PhoneMobile || billData.patient?.PhoneRes || billData.patient?.PhoneOff || 'N/A'}</span>
                  </div>
                  <div class="meta-row">
                    <span class="meta-label">Billed By:</span>
                    <span class="meta-val">${currentUser?.FullName || currentUser?.LoginName || 'Duty Pharmacist'}</span>
                  </div>
                </div>
              </div>

              <!-- Items Table -->
              <div class="table-container">
                <table>
                  <thead>
                    <tr>
                      <th class="col-center" style="width: 32px;">#</th>
                      <th style="width: 80px;">Item Code</th>
                      <th>Medicine Description & Form</th>
                      <th style="width: 80px;">Category</th>
                      <th class="col-center" style="width: 70px;">Batch #</th>
                      <th class="col-center" style="width: 50px;">Qty</th>
                      <th class="col-right" style="width: 85px;">Unit Rate</th>
                      <th class="col-right" style="width: 95px;">Net Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${billData.basket.map((b, idx) => {
                      const item = items.find(i => i.ItemID === b.ItemID);
                      const isClinical = b.MedicineType === 'C' || item?.MedicineType === 'C';
                      const lineTotal = b.Qty * b.Price;
                      const medCategory = item?.Category || (isClinical ? 'Clinical Compounded' : (item?.Unit || 'Patent'));
                      const batchNo = item?.BatchNo || '-';

                      return `
                        <tr>
                          <td class="col-center" style="font-weight: bold; color: #64748b;">${idx + 1}</td>
                          <td style="font-family: monospace; font-weight: 700;">${b.ItemID}</td>
                          <td>
                            <strong style="color: #0f172a; font-size: 11px;">${item ? item.ItemName : b.ItemID}</strong>
                            ${isClinical ? '<span style="font-size: 9px; color: #047857; font-weight: bold; display: block;">* Doctor Prescribed Clinical Compounding</span>' : ''}
                          </td>
                          <td><span style="font-size: 9.5px; font-weight: 700; color: #4338ca;">${medCategory}</span></td>
                          <td class="col-center" style="font-family: monospace; font-size: 9.5px;">${batchNo}</td>
                          <td class="col-center col-bold" style="font-size: 11px;">${b.Qty}</td>
                          <td class="col-right col-bold">Rs. ${b.Price.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</td>
                          <td class="col-right col-bold" style="color: #0f172a;">Rs. ${lineTotal.toLocaleString()}</td>
                        </tr>
                      `;
                    }).join('')}
                  </tbody>
                </table>
              </div>
            </div>

            <!-- Bottom Section -->
            <div>
              <div class="bottom-section">
                <div class="terms-box">
                  <div class="terms-title">📌 Pharmacy Return & Exchange Terms</div>
                  <ol class="terms-list">
                    <li>Medicines once dispensed can only be exchanged within <strong>3 days</strong> with this original computerized bill.</li>
                    <li>Clinical compounded mixtures, opened drops/syrups, vaccines & cut blister packs are <strong>strictly non-returnable</strong>.</li>
                    <li>Store homeopathic remedies in a cool, dry place away from direct sunlight, camphor & strong aromatics.</li>
                    <li>Please verify your cash change and medicine count before departing the dispensing counter.</li>
                  </ol>
                  <div class="words-box">
                    <strong>In Words:</strong> ${amountInWords}
                  </div>
                </div>

                <div class="summary-card">
                  <div class="summary-row">
                    <span>Gross Subtotal:</span>
                    <strong style="font-family: monospace;">Rs. ${grossTotal.toLocaleString()}</strong>
                  </div>
                  ${billData.discount > 0 ? `
                    <div class="summary-row" style="color: #dc2626;">
                      <span>Discount / Concession:</span>
                      <strong style="font-family: monospace;">- Rs. ${billData.discount.toLocaleString()}</strong>
                    </div>
                  ` : ''}
                  <div class="summary-total">
                    <span>NET PAYABLE:</span>
                    <span style="font-family: monospace; color: #047857;">Rs. ${billData.netAmount.toLocaleString()}</span>
                  </div>
                  <div class="summary-row" style="margin-top: 6px; font-size: 10px; color: #64748b;">
                    <span>Payment Method:</span>
                    <strong style="color: #0f172a;">Cash Handover</strong>
                  </div>
                </div>
              </div>

              <!-- Signatures & Footer -->
              <div class="signatures-box">
                <div class="sig-line">Pharmacist / Dispenser Signature</div>
                <div style="text-align: center;">
                  <div style="font-family: monospace; font-size: 14px; font-weight: 900; letter-spacing: 2px;">*${billData.invoiceNo}*</div>
                  <div style="font-size: 8.5px; color: #64748b;">Verification Barcode</div>
                </div>
                <div class="sig-line">Customer / Receiver Signature</div>
              </div>

              <div class="footer-info">
                Thank you for choosing Punjab Homeopathic Clinic & Pharmacy. We wish you a speedy and complete recovery! • System Printed: ${billData.invoiceDate} ${printTimeStr}
              </div>
            </div>
          </div>

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
    win.document.close();
  };

  // 2. Thermal Slip Customer Receipt Print Handler (80mm POS Slip)
  const handlePrintThermalReceipt = (billData: {
    patient: Patient | null;
    basket: { ItemID: string; Qty: number; Price: number; MedicineType?: 'C' | 'P' | 'S' }[];
    discount: number;
    netAmount: number;
    shift: 1 | 2;
    invoiceNo: string;
    invoiceDate: string;
  }) => {
    if (currentUser?.Role !== 'Administrator' && (currentUser?.Permissions?.canPrintPOSInvoice === false || userRights.find(r => r.MenuID === 'pharmacy')?.PrintRec === false)) {
      alert("Printing Pharmacy POS Bills is restricted by administrator permissions.");
      return;
    }

    const printWin = window.open('', '_blank', 'width=420,height=600');
    if (!printWin) {
      alert("Popup blocked! Please allow popups to print thermal customer receipts.");
      return;
    }

    const clinicName = clinicSettings?.ClinicName || 'PUNJAB HOMEOPATHIC CLINIC & PHARMACY';
    const cPhone = clinicSettings?.PhoneMobile || clinicSettings?.PhoneNo || '+92-311-4000608';
    const cAddress = clinicSettings?.ClinicAddress || clinicSettings?.Address || '10 Shalimar Road, Garhi Shahu, Lahore 39 Pakistan';
    const cWebsite = clinicSettings?.Website || 'https://punjabhomeopathic.pk';
    const shiftText = billData.shift === 1 ? 'MORNING SHIFT (1)' : 'EVENING SHIFT (2)';
    const dateStr = billData.invoiceDate || new Date().toISOString().split('T')[0];
    const timeStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    const grossTotal = billData.basket.reduce((sum, item) => sum + item.Qty * item.Price, 0);
    const cashierName = currentUser?.FullName || currentUser?.LoginName || 'Pharmacist on Duty';
    const patientDisplay = billData.patient ? billData.patient.PatientName : 'Walk-in Customer';
    const patientIdDisplay = billData.patient ? ` (ID: ${billData.patient.PatientID})` : '';
    const thermalConf = getThermalSettings();
    const thermalCss = generateThermalStyles(thermalConf);

    printWin.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Thermal Receipt - ${billData.invoiceNo}</title>
          <meta charset="utf-8" />
          <style>
            ${thermalCss}
            .meta-row { display: flex; justify-content: space-between; align-items: baseline; font-size: ${Math.max(9.5, thermalConf.baseFontSize - 1)}px; margin: 2px 0; width: 100%; }
            .meta-label { font-weight: bold; width: 34%; flex-shrink: 0; }
            .meta-val { font-weight: bold; width: 66%; text-align: right; word-break: break-word; }
            .items-table { width: 100%; border-collapse: collapse; table-layout: fixed; font-size: ${thermalConf.baseFontSize}px; margin: 4px 0; box-sizing: border-box; }
            .items-table th { text-align: left; border-bottom: 1.5px dashed #000000; padding: 3px 1px; font-size: ${Math.max(9.5, thermalConf.baseFontSize - 1)}px; font-weight: 900; }
            .items-table td { padding: 2px 1px; vertical-align: top; word-break: break-word; }
            .total-box { font-size: ${thermalConf.baseFontSize + 2}px; font-weight: 900; text-align: right; padding: 4px 0; width: 100%; }
            .footer-msg { font-size: ${Math.max(8.5, thermalConf.baseFontSize - 2.5)}px; text-align: center; margin-top: 6px; font-weight: bold; line-height: 1.35; width: 100%; word-break: break-word; }
            .barcode-box { text-align: center; font-family: monospace; font-size: ${thermalConf.baseFontSize + 1}px; letter-spacing: 2px; font-weight: 900; margin: 4px 0; width: 100%; }
          </style>
        </head>
        <body>
          <div class="clinic-header">
            <h2 class="clinic-name">${clinicName}</h2>
            ${thermalConf.showHeaderAddress ? `<div class="clinic-sub">${cAddress}</div>` : ''}
            ${thermalConf.showHeaderPhone ? `<div class="clinic-sub">📞 ${cPhone} | 🌐 ${cWebsite.replace(/^https?:\/\//, '')}</div>` : ''}
          </div>
          
          <div class="divider"></div>
          <div class="text-center text-bold" style="font-size: ${thermalConf.baseFontSize}px; text-transform: uppercase; letter-spacing: 1px; margin: 3px 0;">*** CUSTOMER RECEIPT ***</div>
          <div class="divider"></div>

          <div class="meta-row">
            <span class="meta-label">Invoice No:</span>
            <span class="meta-val text-bold" style="font-size: 11.5px;">${billData.invoiceNo}</span>
          </div>
          <div class="meta-row">
            <span class="meta-label">Date/Time :</span>
            <span class="meta-val">${dateStr} ${timeStr}</span>
          </div>
          <div class="meta-row">
            <span class="meta-label">Customer  :</span>
            <span class="meta-val">${patientDisplay}${patientIdDisplay}</span>
          </div>
          <div class="meta-row">
            <span class="meta-label">Shift     :</span>
            <span class="meta-val">${shiftText}</span>
          </div>
          <div class="meta-row">
            <span class="meta-label">Cashier   :</span>
            <span class="meta-val">${cashierName}</span>
          </div>

          <div class="divider-dashed"></div>

          <table class="items-table">
            <thead>
              <tr>
                <th style="width: 54%;">ITEM</th>
                <th style="width: 16%; text-align: center;">QTY</th>
                <th style="width: 30%; text-align: right;">TOTAL</th>
              </tr>
            </thead>
            <tbody>
              ${billData.basket.map(b => {
                const itm = items.find(i => i.ItemID === b.ItemID);
                const lineTotal = b.Qty * b.Price;
                return `
                  <tr>
                    <td colspan="3" style="font-weight: 900; padding-top: 3px; font-size: 11px;">${itm ? itm.ItemName : b.ItemID}</td>
                  </tr>
                  <tr>
                    <td style="font-size: 10px; color: #222; padding-left: 4px;">@ Rs. ${b.Price.toFixed(0)}</td>
                    <td style="text-align: center; font-weight: bold;">${b.Qty}</td>
                    <td style="text-align: right; font-weight: 900;">Rs. ${lineTotal.toLocaleString()}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>

          <div class="divider-dashed"></div>

          <div class="meta-row">
            <span class="meta-label">Subtotal  :</span>
            <span class="meta-val">Rs. ${grossTotal.toLocaleString()}</span>
          </div>
          ${billData.discount > 0 ? `
            <div class="meta-row">
              <span class="meta-label">Discount  :</span>
              <span class="meta-val">- Rs. ${billData.discount.toLocaleString()}</span>
            </div>
          ` : ''}

          <div class="divider-solid"></div>
          <div class="total-box">
            NET TOTAL: Rs. ${billData.netAmount.toLocaleString()}
          </div>
          <div class="divider-solid"></div>

          <div class="meta-row" style="font-size: 10px;">
            <span class="meta-label">Payment   :</span>
            <span class="meta-val text-bold">CASH RECEIVED (POSTED)</span>
          </div>

          <div class="barcode-box">||| ${billData.invoiceNo} |||</div>

          <div class="divider-dashed"></div>
          <div class="footer-msg">
            Return/Exchange within 3 days with receipt.<br/>
            Opened syrups/clinical items not returnable.<br/>
            <strong>* THANK YOU & GET WELL SOON *</strong>
          </div>

          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 250);
            };
          </script>
        </body>
      </html>
    `);
    printWin.document.close();
  };

  // 3. Medicine Store Sales & Periodic Audit Report Print Handler (A4 Closing / Audit Report)
  const handlePrintDailySalesReport = (targetDateOrStart?: string, customEnd?: string) => {
    let reportTitle = "DAILY MEDICINE STORE SALES & DISPENSE CLOSING AUDIT REPORT";
    let periodSubtitle = "";
    let reportBadgeText = "DAILY SALES SUMMARY";
    let reportInvoices: InvoiceHeader[] = [];

    if (customEnd || salesReportPeriodMode === 'range') {
      const start = targetDateOrStart || salesReportStartDate || todayStr;
      const end = customEnd || salesReportEndDate || todayStr;
      const isSingleDay = start === end;
      reportTitle = isSingleDay 
        ? "DAILY MEDICINE STORE SALES & DISPENSE CLOSING AUDIT REPORT" 
        : "PERIODIC MEDICINE STORE SALES & REVENUE AUDIT REPORT";
      reportBadgeText = isSingleDay ? "DAILY SALES SUMMARY" : "CUSTOM PERIOD AUDIT";
      periodSubtitle = isSingleDay ? `📅 Date: ${start}` : `📅 Period: ${start} to ${end}`;

      reportInvoices = invoices.filter(inv => {
        const d = String(inv.InvoiceDate || '').trim().slice(0, 10);
        const inDate = d >= start && d <= end;
        const inShift = selectedShiftFilter === 'all' ? true : String(inv.shift) === selectedShiftFilter;
        return inDate && inShift;
      });
    } else if (salesReportPeriodMode === 'all') {
      reportTitle = "ALL-TIME MEDICINE STORE SALES & REVENUE AUDIT REPORT";
      reportBadgeText = "ALL-TIME AUDIT";
      periodSubtitle = "📅 Scope: Complete History (All Recorded Dates)";

      reportInvoices = invoices.filter(inv => {
        return selectedShiftFilter === 'all' ? true : String(inv.shift) === selectedShiftFilter;
      });
    } else {
      const reportDate = targetDateOrStart || selectedDailyReportDate || todayStr;
      reportTitle = "DAILY MEDICINE STORE SALES & DISPENSE CLOSING AUDIT REPORT";
      reportBadgeText = "DAILY SALES SUMMARY";
      periodSubtitle = `📅 Closing Date: ${reportDate}`;

      reportInvoices = invoices.filter(inv => {
        const d = String(inv.InvoiceDate || '').trim().slice(0, 10);
        const inDate = d === reportDate;
        const inShift = selectedShiftFilter === 'all' ? true : String(inv.shift) === selectedShiftFilter;
        return inDate && inShift;
      });
    }

    if (reportInvoices.length === 0) {
      alert("No store medicine invoices found for the selected period or filters.");
      return;
    }

    // Collect all details
    const reportDetails = invoiceDetails.filter(d => reportInvoices.some(inv => inv.InvoiceNo === d.InvoiceNo));

    // Totals
    const totalInvoicesCount = reportInvoices.length;
    const totalUnitsSold = reportDetails.reduce((sum, d) => sum + (Number(d.Qty) || 0), 0);
    const grossSalesSum = reportInvoices.reduce((sum, inv) => {
      const invNet = Number(inv.NetAmount || 0);
      const invDisc = Number(inv.Discount || 0);
      let invGross = Number(inv.GAmount || 0);
      if (invGross <= 0 || (invGross === invNet && invDisc > 0)) {
        invGross = invNet + invDisc;
      }
      return sum + invGross;
    }, 0);
    const totalDiscountSum = reportInvoices.reduce((sum, inv) => sum + (Number(inv.Discount) || 0), 0);
    const netSalesSum = reportInvoices.reduce((sum, inv) => sum + (Number(inv.NetAmount) || 0), 0);

    // Shifts
    const shift1Invoices = reportInvoices.filter(i => i.shift === 1);
    const shift2Invoices = reportInvoices.filter(i => i.shift === 2);
    const shift1NetSum = shift1Invoices.reduce((sum, inv) => sum + (Number(inv.NetAmount) || 0), 0);
    const shift2NetSum = shift2Invoices.reduce((sum, inv) => sum + (Number(inv.NetAmount) || 0), 0);

    // Grouping by category
    const categoryMap = new Map<string, { category: string; count: number; qty: number; revenue: number }>();
    reportDetails.forEach(d => {
      const itm = items.find(i => i.ItemID === d.ItemID);
      const cat = itm?.Category || (d.MedicineType === 'C' || itm?.MedicineType === 'C' ? 'Clinical Compounding' : (itm?.Unit || 'Patent / Other'));
      const lineTotal = (Number(d.Qty) || 0) * (Number(d.Price) || 0);

      const existing = categoryMap.get(cat) || { category: cat, count: 0, qty: 0, revenue: 0 };
      existing.count += 1;
      existing.qty += (Number(d.Qty) || 0);
      existing.revenue += lineTotal;
      categoryMap.set(cat, existing);
    });

    const categorySummaryList = Array.from(categoryMap.values()).sort((a, b) => b.revenue - a.revenue);

    // Grouping by item (Top Selling Medicines)
    const itemMap = new Map<string, { itemId: string; itemName: string; category: string; qty: number; unitPrice: number; revenue: number }>();
    reportDetails.forEach(d => {
      const itm = items.find(i => i.ItemID === d.ItemID);
      const name = itm?.ItemName || d.ItemID;
      const cat = itm?.Category || (d.MedicineType === 'C' ? 'Clinical' : (itm?.Unit || 'Patent'));
      const lineTotal = (Number(d.Qty) || 0) * (Number(d.Price) || 0);

      const existing = itemMap.get(d.ItemID) || {
        itemId: d.ItemID,
        itemName: name,
        category: cat,
        qty: 0,
        unitPrice: Number(d.Price) || 0,
        revenue: 0
      };
      existing.qty += (Number(d.Qty) || 0);
      existing.revenue += lineTotal;
      itemMap.set(d.ItemID, existing);
    });

    const topItemsList = Array.from(itemMap.values()).sort((a, b) => b.qty - a.qty);

    const win = window.open('', '_blank', 'width=1100,height=900');
    if (!win) {
      alert("Pop-up blocker prevented opening print window. Please allow pop-ups for this site.");
      return;
    }

    const clinicName = clinicSettings?.ClinicName || "Punjab Homeopathic Clinic & Pharmacy";
    const clinicAddress = clinicSettings?.ClinicAddress || clinicSettings?.Address || "10 Shalimar Road, Garhi Shahu, Lahore 39 Pakistan";
    const clinicPhone = clinicSettings?.PhoneMobile || clinicSettings?.PhoneNo || "+92-311-4000608";
    const clinicWebsite = clinicSettings?.Website || "https://punjabhomeopathic.pk";
    const logoSrc = clinicSettings?.ClinicLogoImage || clinicSettings?.Logo || '/logo.png';
    const printedBy = currentUser?.FullName || currentUser?.LoginName || 'Duty Pharmacist';
    const printTimeStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

    win.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${reportTitle} - ${periodSubtitle.replace(/[^a-zA-Z0-9 -]/g, '')}</title>
          <style>
            @page {
              size: A4 portrait;
              margin: 10mm 12mm 12mm 12mm;
            }
            * {
              box-sizing: border-box;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
              margin: 0;
              padding: 0;
              color: #0f172a;
              font-size: 10px;
              line-height: 1.35;
              background: #fff;
            }
            .header-container {
              display: flex;
              align-items: center;
              justify-content: space-between;
              border-bottom: 2.5px solid #0f172a;
              padding-bottom: 10px;
              margin-bottom: 12px;
            }
            .brand-box {
              display: flex;
              align-items: center;
              gap: 12px;
            }
            .brand-logo {
              width: 48px;
              height: 48px;
              object-fit: contain;
            }
            .clinic-title {
              font-size: 18px;
              font-weight: 900;
              color: #1e1b4b;
              text-transform: uppercase;
              margin: 0;
            }
            .clinic-subtitle {
              font-size: 10px;
              color: #475569;
              font-weight: 700;
              margin-top: 2px;
            }
            .report-badge-box {
              text-align: right;
            }
            .report-badge {
              display: inline-block;
              background: #047857;
              color: #fff;
              font-size: 11px;
              font-weight: 900;
              padding: 4px 10px;
              border-radius: 6px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .report-date {
              font-size: 10.5px;
              font-weight: 800;
              color: #0f172a;
              margin-top: 4px;
            }

            /* Metric Cards */
            .kpi-grid {
              display: grid;
              grid-template-columns: repeat(5, 1fr);
              gap: 8px;
              margin-bottom: 12px;
            }
            .kpi-card {
              border: 1.5px solid #cbd5e1;
              border-radius: 6px;
              padding: 7px;
              text-align: center;
              background: #f8fafc;
            }
            .kpi-title {
              font-size: 8.5px;
              font-weight: 800;
              text-transform: uppercase;
              color: #64748b;
              margin-bottom: 2px;
            }
            .kpi-val {
              font-size: 14px;
              font-weight: 900;
              color: #0f172a;
              font-family: monospace;
            }

            /* Section */
            .section-header {
              font-size: 10.5px;
              font-weight: 900;
              text-transform: uppercase;
              color: #1e1b4b;
              border-bottom: 1.5px solid #cbd5e1;
              padding-bottom: 3px;
              margin: 12px 0 5px 0;
              display: flex;
              justify-content: space-between;
            }

            /* Tables */
            table {
              width: 100%;
              border-collapse: collapse;
              font-size: 9.5px;
              margin-bottom: 10px;
            }
            th {
              background: #1e293b;
              color: #fff;
              padding: 5px 6px;
              text-align: left;
              font-weight: 800;
              font-size: 8.5px;
              text-transform: uppercase;
            }
            td {
              padding: 4px 6px;
              border-bottom: 1px solid #e2e8f0;
              color: #1e293b;
            }
            tr:nth-child(even) td {
              background: #f8fafc;
            }
            .col-center { text-align: center; }
            .col-right { text-align: right; }
            .col-bold { font-weight: 800; font-family: monospace; }
            .total-row td {
              background: #f1f5f9;
              font-weight: 900;
              border-top: 2px solid #0f172a;
              border-bottom: 2px solid #0f172a;
            }

            /* Drawer reconciliation */
            .reconciliation-box {
              border: 1.5px solid #0f172a;
              border-radius: 6px;
              padding: 8px 10px;
              background: #f8fafc;
              margin-top: 8px;
            }

            /* Signatures */
            .sig-grid {
              display: grid;
              grid-template-columns: 1fr 1fr 1fr;
              gap: 20px;
              margin-top: 20px;
              padding-top: 10px;
            }
            .sig-block {
              text-align: center;
              border-top: 1.5px solid #0f172a;
              padding-top: 4px;
              font-size: 9px;
              font-weight: 800;
              text-transform: uppercase;
            }
          </style>
        </head>
        <body>
          <!-- Header -->
          <div class="header-container">
            <div class="brand-box">
              <img src="${logoSrc}" class="brand-logo" alt="Logo" onerror="this.style.display='none'" />
              <div>
                <h1 class="clinic-title">${clinicName}</h1>
                <div class="clinic-subtitle">${reportTitle}</div>
                <div style="font-size: 9px; color: #475569; margin-top: 2px;">📍 ${clinicAddress} &nbsp;|&nbsp; 📞 ${clinicPhone} &nbsp;|&nbsp; 🌐 ${clinicWebsite.replace(/^https?:\/\//, '')}</div>
              </div>
            </div>
            <div class="report-badge-box">
              <div class="report-badge">${reportBadgeText}</div>
              <div class="report-date">${periodSubtitle}</div>
              <div style="font-size: 8.5px; color: #64748b; margin-top: 2px;">Shift Filter: <strong>${selectedShiftFilter === 'all' ? 'All Shifts' : selectedShiftFilter === '1' ? 'Morning Shift 1' : 'Evening Shift 2'}</strong> • Generated: ${printTimeStr} by ${printedBy}</div>
            </div>
          </div>

          <!-- KPI Summary Cards -->
          <div class="kpi-grid">
            <div class="kpi-card">
              <div class="kpi-title">Total Invoices</div>
              <div class="kpi-val" style="color: #4338ca;">${totalInvoicesCount}</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-title">Medicine Units Sold</div>
              <div class="kpi-val" style="color: #0284c7;">${totalUnitsSold.toLocaleString()}</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-title">Gross Total (Rs.)</div>
              <div class="kpi-val">Rs. ${grossSalesSum.toLocaleString()}</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-title">Total Discount (Rs.)</div>
              <div class="kpi-val" style="color: #dc2626;">- Rs. ${totalDiscountSum.toLocaleString()}</div>
            </div>
            <div class="kpi-card" style="background: #ecfdf5; border-color: #059669;">
              <div class="kpi-title" style="color: #065f46;">Net Cash Realized</div>
              <div class="kpi-val" style="color: #047857;">Rs. ${netSalesSum.toLocaleString()}</div>
            </div>
          </div>

          <!-- Category Breakdown Table -->
          <div class="section-header">
            <span>🏷️ 1. Category-Wise Medicine Sales Breakdown</span>
            <span style="font-size: 9px; color: #64748b;">Total Categories: ${categorySummaryList.length}</span>
          </div>
          <table>
            <thead>
              <tr>
                <th style="width: 25px;" class="col-center">#</th>
                <th>Medicine Category / Dosage Form</th>
                <th class="col-center" style="width: 80px;">Distinct Items</th>
                <th class="col-center" style="width: 80px;">Total Qty Sold</th>
                <th class="col-right" style="width: 110px;">Category Net Sales</th>
                <th class="col-right" style="width: 70px;">% Share</th>
              </tr>
            </thead>
            <tbody>
              ${categorySummaryList.map((cat, idx) => {
                const sharePercent = netSalesSum > 0 ? ((cat.revenue / netSalesSum) * 100).toFixed(1) : '0.0';
                return `
                  <tr>
                    <td class="col-center" style="font-weight: bold; color: #64748b;">${idx + 1}</td>
                    <td><strong>${cat.category}</strong></td>
                    <td class="col-center">${cat.count}</td>
                    <td class="col-center col-bold">${cat.qty}</td>
                    <td class="col-right col-bold">Rs. ${cat.revenue.toLocaleString()}</td>
                    <td class="col-right" style="font-weight: bold; color: #4338ca;">${sharePercent}%</td>
                  </tr>
                `;
              }).join('')}
              <tr class="total-row">
                <td colspan="2">TOTAL STORE MEDICINE CATEGORIES</td>
                <td class="col-center">${topItemsList.length}</td>
                <td class="col-center">${totalUnitsSold.toLocaleString()}</td>
                <td class="col-right">Rs. ${netSalesSum.toLocaleString()}</td>
                <td class="col-right">100.0%</td>
              </tr>
            </tbody>
          </table>

          <!-- Top Selling Medicines Table -->
          <div class="section-header">
            <span>💊 2. Itemized Medicine Sales Ranking (Sorted by Quantity)</span>
            <span style="font-size: 9px; color: #64748b;">${topItemsList.length} Unique Medicines Sold</span>
          </div>
          <table>
            <thead>
              <tr>
                <th style="width: 25px;" class="col-center">#</th>
                <th style="width: 70px;">Item Code</th>
                <th>Medicine Name</th>
                <th style="width: 85px;">Category</th>
                <th class="col-center" style="width: 60px;">Qty Sold</th>
                <th class="col-right" style="width: 80px;">Unit Price</th>
                <th class="col-right" style="width: 95px;">Total Revenue</th>
              </tr>
            </thead>
            <tbody>
              ${topItemsList.slice(0, 50).map((itm, idx) => `
                <tr>
                  <td class="col-center" style="color: #64748b; font-weight: bold;">${idx + 1}</td>
                  <td style="font-family: monospace; font-weight: 700;">${itm.itemId}</td>
                  <td><strong>${itm.itemName}</strong></td>
                  <td><span style="font-size: 8.5px; color: #4338ca; font-weight: 700;">${itm.category}</span></td>
                  <td class="col-center col-bold" style="color: #0f172a;">${itm.qty}</td>
                  <td class="col-right">Rs. ${itm.unitPrice.toLocaleString()}</td>
                  <td class="col-right col-bold" style="color: #047857;">Rs. ${itm.revenue.toLocaleString()}</td>
                </tr>
              `).join('')}
              ${topItemsList.length > 50 ? `<tr><td colspan="7" class="col-center" style="font-style: italic; color: #64748b;">... and ${topItemsList.length - 50} more items included in the summary calculation.</td></tr>` : ''}
            </tbody>
          </table>

          <!-- 3. Invoices Log & Register -->
          <div class="section-header">
            <span>📑 3. Invoices Register & Shift Log</span>
            <span style="font-size: 9px; color: #64748b;">${reportInvoices.length} Recorded Invoices</span>
          </div>
          <table>
            <thead>
              <tr>
                <th style="width: 25px;" class="col-center">#</th>
                <th style="width: 75px;">Invoice Ref</th>
                <th style="width: 75px;">Date</th>
                <th style="width: 75px;">Shift</th>
                <th>Patient / Customer</th>
                <th class="col-center" style="width: 50px;">Items</th>
                <th class="col-right" style="width: 75px;">Gross</th>
                <th class="col-right" style="width: 65px;">Disc.</th>
                <th class="col-right" style="width: 85px;">Net Paid</th>
              </tr>
            </thead>
            <tbody>
              ${reportInvoices.slice(0, 100).map((inv, idx) => {
                const patientName = getPatientName(inv.PatientID);
                const invItemCount = invoiceDetails.filter(d => d.InvoiceNo === inv.InvoiceNo).length;
                return `
                  <tr>
                    <td class="col-center" style="color: #64748b;">${idx + 1}</td>
                    <td style="font-family: monospace; font-weight: 700;">${inv.InvoiceNo}</td>
                    <td>${inv.InvoiceDate}</td>
                    <td><span style="font-weight: bold; color: ${inv.shift === 1 ? '#c2410c' : '#7e22ce'}">${inv.shift === 1 ? 'Morning (1)' : 'Evening (2)'}</span></td>
                    <td><strong>${patientName}</strong></td>
                    <td class="col-center font-bold">${invItemCount}</td>
                    <td class="col-right">Rs. ${(inv.GAmount && inv.GAmount > (inv.NetAmount || 0) ? inv.GAmount : ((inv.NetAmount || 0) + (inv.Discount || 0))).toLocaleString()}</td>
                    <td class="col-right" style="color: ${inv.Discount ? '#dc2626' : '#64748b'}">${inv.Discount ? `Rs. ${inv.Discount.toLocaleString()}` : '-'}</td>
                    <td class="col-right col-bold" style="color: #047857;">Rs. ${(inv.NetAmount || 0).toLocaleString()}</td>
                  </tr>
                `;
              }).join('')}
              ${reportInvoices.length > 100 ? `<tr><td colspan="9" class="col-center" style="font-style: italic; color: #64748b;">... showing first 100 of ${reportInvoices.length} invoices.</td></tr>` : ''}
              <tr class="total-row">
                <td colspan="5">GRAND INVOICE TOTALS</td>
                <td class="col-center">${totalUnitsSold.toLocaleString()}</td>
                <td class="col-right">Rs. ${grossSalesSum.toLocaleString()}</td>
                <td class="col-right" style="color: #dc2626;">- Rs. ${totalDiscountSum.toLocaleString()}</td>
                <td class="col-right" style="color: #047857;">Rs. ${netSalesSum.toLocaleString()}</td>
              </tr>
            </tbody>
          </table>

          <!-- Shift & Drawer Reconciliation -->
          <div class="reconciliation-box">
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; margin-bottom: 5px;">
              <strong style="font-size: 10.5px; text-transform: uppercase;">💼 Shift & Cash Drawer Reconciliation</strong>
              <span style="font-size: 9.5px; font-weight: 800; color: #047857;">ALL INVOICES AUDITED & VERIFIED</span>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; font-size: 10px;">
              <div>
                <span style="color: #64748b;">☀️ Morning Shift (1) Realized:</span><br/>
                <strong style="font-size: 11.5px; color: #c2410c;">Rs. ${shift1NetSum.toLocaleString()}</strong> (${shift1Invoices.length} Invoices)
              </div>
              <div>
                <span style="color: #64748b;">🌙 Evening Shift (2) Realized:</span><br/>
                <strong style="font-size: 11.5px; color: #7e22ce;">Rs. ${shift2NetSum.toLocaleString()}</strong> (${shift2Invoices.length} Invoices)
              </div>
              <div style="text-align: right;">
                <span style="color: #64748b;">Total Net Sales Collected:</span><br/>
                <strong style="font-size: 13.5px; color: #047857; font-family: monospace;">Rs. ${netSalesSum.toLocaleString()}</strong>
              </div>
            </div>
          </div>

          <!-- Signatures -->
          <div class="sig-grid">
            <div class="sig-block">
              Pharmacist / Cashier on Duty<br/>
              <span style="font-size: 8px; font-weight: normal; color: #64748b;">(${printedBy})</span>
            </div>
            <div class="sig-block">
              Pharmacy Store In-Charge<br/>
              <span style="font-size: 8px; font-weight: normal; color: #64748b;">(Cash Handover Verified)</span>
            </div>
            <div class="sig-block">
              Dr. Zaigham Ali Anjum<br/>
              <span style="font-size: 8px; font-weight: normal; color: #64748b;">(Managing Director & Administrator)</span>
            </div>
          </div>

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
    win.document.close();
  };

  const handlePrintStockGrid = (forceLowStockOnly?: boolean) => {
    const isLowStock = forceLowStockOnly || invLowStockFilter;

    const processedForPrint = items.filter((itm) => {
      if (isLowStock && itm.CStock > ((itm.MinStock !== undefined && itm.MinStock !== null) ? itm.MinStock : 1)) return false;
      if (invCategoryFilter !== 'ALL') {
        if (invCategoryFilter === 'C') {
          if (itm.MedicineType !== 'C') return false;
        } else if (invCategoryFilter === 'P') {
          if (itm.MedicineType === 'C') return false;
        } else {
          const u = (itm.Unit || '').toLowerCase().trim();
          const c = invCategoryFilter.toLowerCase().trim();
          if (u !== c && !u.includes(c)) return false;
        }
      }
      if (invSearchQuery.trim()) {
        const q = invSearchQuery.toLowerCase().trim();
        return (
          itm.ItemID.toLowerCase().includes(q) ||
          itm.ItemName.toLowerCase().includes(q) ||
          (itm.Unit || '').toLowerCase().includes(q) ||
          (itm.BatchNo || '').toLowerCase().includes(q) ||
          (itm.VendorBarcode || '').toLowerCase().includes(q)
        );
      }
      return true;
    });

    processedForPrint.sort((a, b) => {
      let valA: any = a[invSortField];
      let valB: any = b[invSortField];
      if (valA === undefined || valA === null) valA = '';
      if (valB === undefined || valB === null) valB = '';
      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();

      if (valA < valB) return invSortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return invSortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    if (processedForPrint.length === 0) {
      alert(isLowStock ? "No low stock medicines found to print!" : "No items match your filter to print!");
      return;
    }

    const clinicName = clinicSettings?.ClinicName || "Punjab Homeopathic Clinic";
    const clinicAddress = clinicSettings?.ClinicAddress || clinicSettings?.Address || "Opposite State Bank, Mall Road, Lahore";
    const clinicPhone = clinicSettings?.PhoneMobile || clinicSettings?.PhoneNo || "042-3111222";
    const clinicTagline = clinicSettings?.ClinicLogoText || clinicSettings?.Tagline || "Advanced Health Care & Clinical Pharmacy";
    const logoSrc = clinicSettings?.ClinicLogoImage || clinicSettings?.Logo || '/logo.png';
    
    const printDate = new Date().toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }) + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const totalItemsCount = processedForPrint.length;
    const totalStockQty = processedForPrint.reduce((acc, itm) => acc + (itm.CStock || 0), 0);
    const totalReorderQty = processedForPrint.reduce((acc, itm) => acc + (itm.ReorderQty || 0), 0);
    const totalCostVal = processedForPrint.reduce((acc, itm) => acc + ((itm.PurchasePrice || 0) * (itm.CStock || 0)), 0);
    const totalRetailVal = processedForPrint.reduce((acc, itm) => acc + ((itm.Price || 0) * (itm.CStock || 0)), 0);
    const criticalOutCount = processedForPrint.filter(i => (i.CStock || 0) <= 0).length;
    const lowCount = processedForPrint.filter(i => (i.CStock || 0) > 0 && i.CStock <= ((i.MinStock !== undefined && i.MinStock !== null) ? i.MinStock : 1)).length;

    const win = window.open('', '_blank', 'width=1100,height=900');
    if (!win) {
      alert("Pop-up blocker prevented opening print window. Please allow pop-ups for this site.");
      return;
    }

    win.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${isLowStock ? 'Low Stock & Shortage Alert Report' : 'Pharmacy Inventory & Stock Report'} - ${clinicName}</title>
          <style>
            @page {
              size: A4 portrait;
              margin: 8mm 10mm 10mm 10mm;
            }
            * {
              box-sizing: border-box;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              margin: 0;
              padding: 0;
              color: #0f172a;
              font-size: 10px;
              line-height: 1.3;
              background: #fff;
            }
            .header-container {
              display: flex;
              align-items: center;
              justify-content: space-between;
              border-bottom: 2px solid #0f172a;
              padding-bottom: 8px;
              margin-bottom: 10px;
              gap: 12px;
            }
            .brand-section {
              display: flex;
              align-items: center;
              gap: 10px;
            }
            .logo-img {
              width: 50px;
              height: 50px;
              object-fit: contain;
            }
            .clinic-title {
              font-size: 18px;
              font-weight: 900;
              color: #4c0519;
              text-transform: uppercase;
              margin: 0;
              letter-spacing: -0.5px;
            }
            .clinic-subtitle {
              font-size: 9.5px;
              color: #475569;
              font-weight: 600;
              margin-top: 2px;
            }
            .report-badge-box {
              text-align: right;
            }
            .report-badge {
              display: inline-block;
              padding: 4px 10px;
              background: ${isLowStock ? '#fee2e2' : '#f1f5f9'};
              color: ${isLowStock ? '#991b1b' : '#0f172a'};
              border: 1px solid ${isLowStock ? '#fca5a5' : '#cbd5e1'};
              font-weight: 900;
              font-size: 11px;
              text-transform: uppercase;
              border-radius: 6px;
              letter-spacing: 0.5px;
            }
            .report-meta {
              font-size: 9px;
              color: #64748b;
              font-family: monospace;
              margin-top: 4px;
            }
            .kpi-grid {
              display: grid;
              grid-template-columns: repeat(5, 1fr);
              gap: 6px;
              margin-bottom: 10px;
            }
            .kpi-card {
              border: 1px solid #e2e8f0;
              background: #f8fafc;
              padding: 5px 8px;
              border-radius: 6px;
              text-align: center;
            }
            .kpi-label {
              font-size: 8px;
              font-weight: 800;
              color: #64748b;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .kpi-value {
              font-size: 12px;
              font-weight: 900;
              color: #0f172a;
              margin-top: 2px;
              font-family: monospace;
            }
            .filter-info-bar {
              background: #f1f5f9;
              border: 1px solid #e2e8f0;
              padding: 4px 8px;
              border-radius: 4px;
              font-size: 9px;
              font-weight: bold;
              color: #334155;
              margin-bottom: 8px;
              display: flex;
              justify-content: space-between;
            }
            table.stock-table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 4px;
              font-size: 9.5px;
            }
            table.stock-table th, table.stock-table td {
              border: 1px solid #cbd5e1;
              padding: 4.5px 5px;
            }
            table.stock-table thead tr th {
              background: #0f172a;
              color: #ffffff;
              font-weight: 900;
              text-transform: uppercase;
              font-size: 8.5px;
              letter-spacing: 0.3px;
              text-align: center;
            }
            table.stock-table tbody tr:nth-child(even) {
              background: #f8fafc;
            }
            .row-critical {
              background: #fef2f2 !important;
            }
            .row-low {
              background: #fffbeb !important;
            }
            .badge-status {
              display: inline-block;
              padding: 1.5px 5px;
              border-radius: 3px;
              font-size: 8px;
              font-weight: 900;
              text-transform: uppercase;
              white-space: nowrap;
            }
            .status-out {
              background: #fee2e2;
              color: #991b1b;
              border: 1px solid #f87171;
            }
            .status-low {
              background: #fef3c7;
              color: #92400e;
              border: 1px solid #fcd34d;
            }
            .status-ok {
              background: #dcfce7;
              color: #166534;
              border: 1px solid #86efac;
            }
            .total-row {
              background: #f1f5f9 !important;
              font-weight: 900;
              border-top: 2px solid #0f172a;
            }
            .signatures {
              margin-top: 20px;
              display: flex;
              justify-content: space-between;
              padding-top: 15px;
              page-break-inside: avoid;
            }
            .sig-block {
              border-top: 1.5px solid #0f172a;
              width: 180px;
              text-align: center;
              padding-top: 4px;
              font-size: 9.5px;
              font-weight: 800;
              color: #334155;
            }
            .print-btn-bar {
              margin-bottom: 12px;
              display: flex;
              justify-content: flex-end;
              gap: 8px;
            }
            .btn-print {
              background: #0f172a;
              color: #fff;
              border: none;
              padding: 6px 16px;
              font-weight: bold;
              font-size: 12px;
              border-radius: 4px;
              cursor: pointer;
            }
            @media print {
              .no-print {
                display: none !important;
              }
              body {
                padding: 0;
              }
              tr {
                page-break-inside: avoid;
              }
              thead {
                display: table-header-group;
              }
              tfoot {
                display: table-footer-group;
              }
            }
          </style>
        </head>
        <body>
          <div class="no-print print-btn-bar">
            <button class="btn-print" onclick="window.print()">🖨️ Print Document (A4)</button>
            <button class="btn-print" style="background:#64748b;" onclick="window.close()">Close</button>
          </div>

          <div class="header-container">
            <div class="brand-section">
              ${logoSrc ? `<img src="${logoSrc}" class="logo-img" alt="Logo" onerror="this.style.display='none'" />` : ''}
              <div>
                <h1 class="clinic-title">${clinicName}</h1>
                <div class="clinic-subtitle">📍 ${clinicAddress} &nbsp;|&nbsp; 📞 ${clinicPhone}</div>
                <div style="font-size: 8.5px; color: #94a3b8; font-weight: 700; text-transform: uppercase; margin-top: 1px;">${clinicTagline}</div>
              </div>
            </div>
            <div class="report-badge-box">
              <div class="report-badge">${isLowStock ? '⚠️ LOW STOCK & SHORTAGE REPORT' : '📦 INVENTORY & STOCK VALUATION REPORT'}</div>
              <div class="report-meta">Print Date: <strong>${printDate}</strong></div>
              <div class="report-meta">Doc Ref: <strong>STK-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}</strong></div>
            </div>
          </div>

          <div class="kpi-grid">
            <div class="kpi-card">
              <div class="kpi-label">Listed Items</div>
              <div class="kpi-value">${totalItemsCount}</div>
            </div>
            <div class="kpi-card" style="background: ${criticalOutCount + lowCount > 0 ? '#fef2f2' : '#f8fafc'};">
              <div class="kpi-label" style="color: ${criticalOutCount + lowCount > 0 ? '#991b1b' : '#64748b'};">Low / Out Stock</div>
              <div class="kpi-value" style="color: ${criticalOutCount + lowCount > 0 ? '#b91c1c' : '#0f172a'};">${criticalOutCount + lowCount} Items</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-label">Total Units in Stock</div>
              <div class="kpi-value">${totalStockQty.toLocaleString()}</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-label">Total Cost Valuation</div>
              <div class="kpi-value" style="color: #b45309;">Rs. ${totalCostVal.toLocaleString('en-PK', { minimumFractionDigits: 2 })}</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-label">Total Retail Valuation</div>
              <div class="kpi-value" style="color: #047857;">Rs. ${totalRetailVal.toLocaleString('en-PK', { minimumFractionDigits: 2 })}</div>
            </div>
          </div>

          <div class="filter-info-bar">
            <span><strong>Scope:</strong> ${isLowStock ? '⚠️ Showing ONLY items below minimum stock threshold' : 'All filtered inventory items'}</span>
            <span><strong>Category:</strong> ${invCategoryFilter === 'ALL' ? 'All Categories' : invCategoryFilter === 'C' ? 'Clinical' : invCategoryFilter === 'P' ? 'Patent' : invCategoryFilter}</span>
            ${invSearchQuery ? `<span><strong>Search Query:</strong> "${invSearchQuery}"</span>` : ''}
          </div>

          <table class="stock-table">
            <thead>
              <tr>
                <th style="width: 4%;">S#</th>
                <th style="width: 10%;">Item ID</th>
                <th style="width: 25%; text-align: left;">Medicine / Item Name</th>
                <th style="width: 9%;">Unit/Cat</th>
                <th style="width: 7%;">Type</th>
                <th style="width: 8%;">Stock</th>
                <th style="width: 7%;">Min Thresh</th>
                <th style="width: 7%;">Reorder</th>
                <th style="width: 9%; text-align: right;">Unit Cost</th>
                <th style="width: 9%; text-align: right;">Retail (Rs)</th>
                <th style="width: 11%; text-align: right;">Total Cost (Rs)</th>
                <th style="width: 9%;">Status</th>
              </tr>
            </thead>
            <tbody>
              ${processedForPrint.map((itm, idx) => {
                const minThresh = (itm.MinStock !== undefined && itm.MinStock !== null) ? itm.MinStock : 1;
                const isOut = itm.CStock <= 0;
                const isLow = !isOut && itm.CStock <= minThresh;
                const rowClass = isOut ? 'row-critical' : isLow ? 'row-low' : '';
                const statusBadge = isOut 
                  ? '<span class="badge-status status-out">🚨 OUT</span>' 
                  : isLow 
                  ? '<span class="badge-status status-low">⚠️ LOW</span>' 
                  : '<span class="badge-status status-ok">🟢 OK</span>';
                const lineCost = (itm.PurchasePrice || 0) * (itm.CStock || 0);

                return `
                  <tr class="${rowClass}">
                    <td style="text-align: center; font-weight: bold; color: #64748b;">${idx + 1}</td>
                    <td style="text-align: center; font-family: monospace; font-weight: bold;">${itm.ItemID}</td>
                    <td style="font-weight: 800; color: #0f172a;">${itm.ItemName}</td>
                    <td style="text-align: center;">${itm.Unit || 'Tab'}</td>
                    <td style="text-align: center; font-size: 8px; font-weight: bold;">${itm.MedicineType === 'C' ? 'Clinical' : 'Patent'}</td>
                    <td style="text-align: center; font-family: monospace; font-weight: 900; color: ${isOut ? '#dc2626' : isLow ? '#b45309' : '#166534'};">
                      ${itm.CStock}
                    </td>
                    <td style="text-align: center; font-family: monospace;">${minThresh}</td>
                    <td style="text-align: center; font-family: monospace; font-weight: bold; color: #3b82f6;">${itm.ReorderQty || 0}</td>
                    <td style="text-align: right; font-family: monospace;">${(itm.PurchasePrice || 0).toLocaleString()}</td>
                    <td style="text-align: right; font-family: monospace;">${(itm.Price || 0).toLocaleString()}</td>
                    <td style="text-align: right; font-family: monospace; font-weight: bold;">${lineCost.toLocaleString('en-PK', { minimumFractionDigits: 2 })}</td>
                    <td style="text-align: center;">${statusBadge}</td>
                  </tr>
                `;
              }).join('')}
              <tr class="total-row">
                <td colspan="5" style="text-align: right; font-size: 9px;">TOTAL SUMMARY:</td>
                <td style="text-align: center; font-family: monospace; font-size: 10px;">${totalStockQty.toLocaleString()}</td>
                <td></td>
                <td style="text-align: center; font-family: monospace; font-size: 10px;">${totalReorderQty.toLocaleString()}</td>
                <td colspan="2" style="text-align: right; font-size: 9px;">TOTAL VALUATION:</td>
                <td style="text-align: right; font-family: monospace; font-size: 10px; color: #991b1b;">Rs. ${totalCostVal.toLocaleString('en-PK', { minimumFractionDigits: 2 })}</td>
                <td></td>
              </tr>
            </tbody>
          </table>

          <div class="signatures">
            <div class="sig-block">
              Prepared by: Pharmacist / Store Incharge
            </div>
            <div class="sig-block">
              Audited by: Store Manager
            </div>
            <div class="sig-block">
              Authorized Signature / Doctor
            </div>
          </div>

          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 250);
            };
          </script>
        </body>
      </html>
    `);
    win.document.close();
  };

  // Popup Window Print Handler for A4 Purchase Order
  const handleOpenPoPrintWindow = () => {
    const filteredItems = getFilteredPoItems(items, poCategoryFilter, poOnlyLowStock);
    const clinicName = clinicSettings?.ClinicName || "Punjab Homeopathic Clinic";
    const printDate = new Date().toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }) + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    let tableHtml = '';

    if (poPrintLayout === '3col') {
      const poRows = [];
      for (let i = 0; i < filteredItems.length; i += 3) {
        poRows.push([
          filteredItems[i],
          filteredItems[i + 1] || null,
          filteredItems[i + 2] || null
        ]);
      }

      tableHtml = `
        <table class="po-table">
          <thead>
            <tr>
              <th colspan="6" class="table-title">
                PURCHASE ORDER & SHORTAGE REQUISITION
              </th>
            </tr>
            <tr class="header-row">
              <th style="width: 23%;">MEDICINE NAME</th>
              <th style="width: 10.33%; text-align: center;">REQ QTY</th>
              <th style="width: 23%;">MEDICINE NAME</th>
              <th style="width: 10.33%; text-align: center;">REQ QTY</th>
              <th style="width: 23%;">MEDICINE NAME</th>
              <th style="width: 10.33%; text-align: center;">REQ QTY</th>
            </tr>
          </thead>
          <tbody>
            ${poRows.map((row) => {
              const getQtyStr = (itm: Item | null) => {
                if (!itm) return '';
                return (itm.ReorderQty !== undefined && itm.ReorderQty !== null)
                  ? itm.ReorderQty
                  : 0;
              };
              return `
                <tr>
                  <td class="col-name">${row[0]?.ItemName || ''}</td>
                  <td class="col-qty">${row[0] ? getQtyStr(row[0]) : ''}</td>
                  <td class="col-name">${row[1]?.ItemName || ''}</td>
                  <td class="col-qty">${row[1] ? getQtyStr(row[1]) : ''}</td>
                  <td class="col-name">${row[2]?.ItemName || ''}</td>
                  <td class="col-qty">${row[2] ? getQtyStr(row[2]) : ''}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      `;
    } else {
      tableHtml = `
        <table class="po-table">
          <thead>
            <tr class="header-row">
              <th style="width: 6%; text-align: center;">S.No</th>
              <th style="width: 12%; text-align: center;">Item ID</th>
              <th style="width: 42%;">Medicine Name</th>
              <th style="width: 12%; text-align: center;">Category</th>
              <th style="width: 14%; text-align: center;">Current Stock</th>
              <th style="width: 14%; text-align: center;">Reorder Qty</th>
            </tr>
          </thead>
          <tbody>
            ${filteredItems.map((itm, idx) => {
              const reorderQty = (itm.ReorderQty !== undefined && itm.ReorderQty !== null)
                ? itm.ReorderQty
                : 0;
              return `
                <tr>
                  <td style="text-align: center; font-weight: bold; color: #555;">${idx + 1}</td>
                  <td style="text-align: center; font-family: monospace; font-weight: bold;">${itm.ItemID}</td>
                  <td class="col-name" style="font-weight: bold;">${itm.ItemName}</td>
                  <td style="text-align: center;">${itm.Unit || 'Tab'}</td>
                  <td style="text-align: center; font-family: monospace; font-weight: bold; color: #b91c1c;">${itm.CStock}</td>
                  <td class="col-qty" style="font-weight: 900;">${reorderQty} ${itm.Unit || 'Tab'}s</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      `;
    }

    const win = window.open('', '_blank', 'width=1000,height=900');
    if (!win) {
      alert("Pop-up blocker prevented opening print window. Please allow pop-ups for this site or use Direct Print.");
      return;
    }

    win.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>A4 Purchase Order - ${clinicName}</title>
          <style>
            @page {
              size: A4 portrait;
              margin: 12mm 12mm 12mm 12mm;
            }
            *, *:before, *:after {
              box-sizing: border-box;
            }
            html, body {
              margin: 0;
              padding: 0;
              background: #ffffff;
              color: #000000;
              font-family: Arial, Helvetica, sans-serif;
              font-size: 11px;
              line-height: 1.3;
            }
            body {
              padding: 15px;
            }
            .header-container {
              text-align: center;
              margin-bottom: 12px;
              border-bottom: 2px solid #000000;
              padding-bottom: 8px;
            }
            .clinic-title {
              font-size: 20px;
              font-weight: 900;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              margin: 0 0 3px 0;
              color: #000000;
            }
            .doc-title {
              font-size: 13px;
              font-weight: 800;
              text-transform: uppercase;
              margin: 0;
              color: #111111;
            }
            .meta-info {
              display: flex;
              justify-content: space-between;
              align-items: center;
              font-size: 10px;
              font-weight: bold;
              margin-top: 8px;
              color: #333333;
            }
            .badge {
              background-color: #f1f5f9;
              border: 1px solid #cbd5e1;
              padding: 2px 6px;
              border-radius: 4px;
              text-transform: uppercase;
            }
            table.po-table {
              width: 100%;
              border-collapse: collapse;
              border: 2px solid #000000;
              margin-top: 10px;
              font-size: 11px;
              page-break-inside: auto;
            }
            table.po-table thead {
              display: table-header-group;
            }
            table.po-table tr {
              page-break-inside: avoid;
              break-inside: avoid;
            }
            table.po-table th, table.po-table td {
              border: 1px solid #000000;
              padding: 5px 6px;
              box-sizing: border-box;
              vertical-align: middle;
            }
            .table-title {
              background-color: #f8fafc;
              text-align: center;
              font-size: 12px;
              font-weight: 900;
              text-transform: uppercase;
              padding: 6px;
              letter-spacing: 0.5px;
            }
            .header-row th {
              background-color: #f1f5f9;
              font-weight: 800;
              font-size: 10px;
              text-align: left;
              text-transform: uppercase;
            }
            .col-name {
              font-weight: 600;
              text-align: left;
              color: #000000;
            }
            .col-qty {
              font-weight: 800;
              text-align: center;
              color: #000000;
              background-color: #fafafa;
            }
            .footer-signatures {
              margin-top: 40px;
              display: flex;
              justify-content: space-between;
              padding: 0 20px;
              page-break-inside: avoid;
            }
            .sig-box {
              text-align: center;
              width: 200px;
              border-top: 1px solid #000000;
              padding-top: 4px;
              font-weight: bold;
              font-size: 10px;
              text-transform: uppercase;
            }
            @media print {
              body { padding: 0; }
              .no-print { display: none !important; }
            }
          </style>
        </head>
        <body>
          <div class="no-print" style="margin-bottom: 15px; padding: 10px; background: #e0e7ff; border: 1px solid #c7d2fe; border-radius: 6px; display: flex; justify-content: space-between; align-items: center;">
            <span style="font-weight: bold; color: #3730a3;">A4 Purchase Order Printable Document (${filteredItems.length} items)</span>
            <button onclick="window.print()" style="padding: 6px 16px; background: #4f46e5; color: white; border: none; border-radius: 4px; font-weight: bold; cursor: pointer;">
              🖨️ Print Document
            </button>
          </div>

          <div class="header-container">
            <h1 class="clinic-title">${clinicName}</h1>
            <h2 class="doc-title">PURCHASE ORDER & MINIMUM THRESHOLD REQUISITION</h2>
            <div class="meta-info">
              <span>Date: ${printDate}</span>
              <span class="badge">Category: ${poCategoryFilter === 'ALL' ? 'All Categories' : poCategoryFilter}</span>
              <span class="badge">Scope: ${poOnlyLowStock ? 'Shortage Items Only' : 'Full Category List'}</span>
              <span>Total Items: ${filteredItems.length}</span>
            </div>
          </div>

          ${tableHtml}

          <div class="footer-signatures">
            <div class="sig-box">Prepared By (Pharmacy Manager)</div>
            <div class="sig-box">Approved By (Clinic Administrator)</div>
          </div>

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
    win.document.close();
  };

  return {
    handlePrintA4Invoice,
    handlePrintThermalReceipt,
    handlePrintDailySalesReport,
    handlePrintStockGrid,
    handleOpenPoPrintWindow
  };
}

export default createPharmacyPrintHelpers;
