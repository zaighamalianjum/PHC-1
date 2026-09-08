/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Item, ItemBatch } from '../types';

/**
 * Normalizes any date value (Excel serial number, Date object, YYYY-MM-DD, YYYY-MM, 
 * MM/YYYY, MM-YYYY, MM/YY, MM-YY, DD/MM/YYYY, DD-MM-YYYY, DD/MM/YY, text months, etc.)
 * into standard Month-Year format "YYYY-MM" suitable for <input type="month"> and database storage.
 */
export const toMonthYearInput = (dateVal?: string | number | Date | null): string => {
  if (dateVal === undefined || dateVal === null) return '';

  // 1. Direct JavaScript Date object
  if (dateVal instanceof Date) {
    if (!isNaN(dateVal.getTime())) {
      const y = dateVal.getFullYear();
      const m = String(dateVal.getMonth() + 1).padStart(2, '0');
      return `${y}-${m}`;
    }
    return '';
  }

  let str = String(dateVal).trim();
  if (!str) return '';

  // 2. Handle numeric values (Excel serial dates & integer date formats)
  const num = Number(str);
  if (!isNaN(num) && isFinite(num)) {
    // 6-digit YYYYMM (e.g. 202605)
    if (num >= 199001 && num <= 209912 && str.length === 6) {
      return `${str.slice(0, 4)}-${str.slice(4, 6)}`;
    }
    // 8-digit YYYYMMDD (e.g. 20260515)
    if (num >= 19900101 && num <= 20991231 && str.length === 8) {
      return `${str.slice(0, 4)}-${str.slice(4, 6)}`;
    }
    // Excel date serial number (e.g. 25000 - 90000 -> years 1968 to 2146)
    if (num >= 25000 && num <= 90000) {
      const excelEpoch = new Date(Math.round((num - 25569) * 86400 * 1000));
      if (!isNaN(excelEpoch.getTime())) {
        const y = excelEpoch.getUTCFullYear();
        const m = String(excelEpoch.getUTCMonth() + 1).padStart(2, '0');
        return `${y}-${m}`;
      }
    }
  }

  // Strip trailing time like T00:00:00.000Z or 12:00:00 AM/PM
  str = str.replace(/[T\s]\d{1,2}:\d{2}.*$/, '').trim();

  // 3. Already standard YYYY-MM
  if (/^\d{4}-\d{2}$/.test(str)) {
    return str;
  }

  // 4. YYYY-MM-DD or YYYY/MM/DD or YYYY.MM.DD
  const ymdMatch = str.match(/^(\d{4})[-/.](\d{1,2})(?:[-/.]\d{1,2})?$/);
  if (ymdMatch) {
    const year = ymdMatch[1];
    const month = ymdMatch[2].padStart(2, '0');
    return `${year}-${month}`;
  }

  // 5. DD/MM/YYYY, DD-MM-YYYY, MM/YYYY, MM-YYYY, DD.MM.YYYY
  const dmyMatch = str.match(/^(?:(\d{1,2})[-/.])?(\d{1,2})[-/.](\d{4})$/);
  if (dmyMatch) {
    const part1 = Number(dmyMatch[1]);
    const part2 = Number(dmyMatch[2]);
    const year = dmyMatch[3];
    let month = part2;
    // If format was MM/DD/YYYY where part1 <= 12 and part2 > 12
    if (dmyMatch[1] && part1 <= 12 && part2 > 12) {
      month = part1;
    }
    return `${year}-${String(month).padStart(2, '0')}`;
  }

  // 6. MM/YY, MM-YY, MM.YY, M/YY, M-YY (e.g. '05/26', '12-28', '5/27')
  const mmyyMatch = str.match(/^(\d{1,2})[-/.](\d{2})$/);
  if (mmyyMatch) {
    const p1 = Number(mmyyMatch[1]);
    const p2 = Number(mmyyMatch[2]);
    if (p1 >= 1 && p1 <= 12) {
      const year = p2 < 70 ? 2000 + p2 : 1900 + p2;
      return `${year}-${String(p1).padStart(2, '0')}`;
    } else if (p2 >= 1 && p2 <= 12 && p1 >= 20 && p1 <= 99) {
      // YY/MM
      const year = 2000 + p1;
      return `${year}-${String(p2).padStart(2, '0')}`;
    }
  }

  // 7. DD/MM/YY or DD-MM-YY (e.g. '15/05/26', '31-12-25')
  const dmyShortMatch = str.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2})$/);
  if (dmyShortMatch) {
    const m = Number(dmyShortMatch[2]);
    const p3 = Number(dmyShortMatch[3]);
    const year = p3 < 70 ? 2000 + p3 : 1900 + p3;
    if (m >= 1 && m <= 12) {
      return `${year}-${String(m).padStart(2, '0')}`;
    }
  }

  // 8. Text month names: "May 2026", "05-May-2026", "May-26", "15-May-26", "May/26"
  const monthsMap: Record<string, string> = {
    jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
    jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12'
  };
  const textMonthMatch = str.match(/([a-zA-Z]{3,9})[^\d]*(\d{2,4})/);
  if (textMonthMatch) {
    const mStr = textMonthMatch[1].slice(0, 3).toLowerCase();
    if (monthsMap[mStr]) {
      let year = textMonthMatch[2];
      if (year.length === 2) {
        year = Number(year) < 70 ? `20${year}` : `19${year}`;
      }
      return `${year}-${monthsMap[mStr]}`;
    }
  }

  // 9. Standard Date parsing fallback with sanity checking for 4-digit years
  try {
    const d = new Date(str);
    if (!isNaN(d.getTime())) {
      const year = d.getFullYear();
      if (year >= 1970 && year <= 2099) {
        const month = String(d.getMonth() + 1).padStart(2, '0');
        return `${year}-${month}`;
      }
    }
  } catch {
    // ignore
  }

  return '';
};

/**
 * Formats a date string into readable MM/YYYY display
 */
export const formatMonthYearDisplay = (dateStr?: string | null): string => {
  if (!dateStr) return '';
  const my = toMonthYearInput(dateStr);
  if (!my) return dateStr || '';
  const parts = my.split('-');
  if (parts.length === 2) {
    return `${parts[1]}/${parts[0]}`;
  }
  return my;
};

export const isBatchExpired = (expDate?: string) => {
  if (!expDate || !expDate.trim()) return false;
  try {
    const my = toMonthYearInput(expDate);
    if (!my) return false;
    const parts = my.split('-');
    if (parts.length === 2) {
      const year = Number(parts[0]);
      const month = Number(parts[1]);
      // End of the specified month (day 0 of month+1 at 23:59:59)
      const expTimestamp = new Date(year, month, 0, 23, 59, 59).getTime();
      return !isNaN(expTimestamp) && expTimestamp < Date.now();
    }
    const expTimestamp = new Date(expDate).getTime();
    return !isNaN(expTimestamp) && expTimestamp < Date.now();
  } catch {
    return false;
  }
};

export const isBatchNearExpiry = (expDate?: string, days = 90) => {
  if (!expDate || !expDate.trim()) return false;
  try {
    const my = toMonthYearInput(expDate);
    if (!my) return false;
    const parts = my.split('-');
    if (parts.length === 2) {
      const year = Number(parts[0]);
      const month = Number(parts[1]);
      // End of the specified month (day 0 of month+1 at 23:59:59)
      const expTimestamp = new Date(year, month, 0, 23, 59, 59).getTime();
      if (isNaN(expTimestamp)) return false;
      const diffDays = (expTimestamp - Date.now()) / (1000 * 60 * 60 * 24);
      return diffDays >= 0 && diffDays <= days;
    }
    const expTimestamp = new Date(expDate).getTime();
    if (isNaN(expTimestamp)) return false;
    const diffDays = (expTimestamp - Date.now()) / (1000 * 60 * 60 * 24);
    return diffDays >= 0 && diffDays <= days;
  } catch {
    return false;
  }
};

export const getItemExpirySummary = (item: Item) => {
  const batches = Array.isArray(item.Batches) && item.Batches.length > 0
    ? item.Batches
    : (item.ExpDate ? [{
        BatchID: `${item.ItemID}-legacy`,
        ItemID: item.ItemID,
        ItemName: item.ItemName,
        BatchNo: item.BatchNo || 'B#1',
        ExpDate: item.ExpDate,
        MfgDate: item.MfgDate || '',
        Qty: item.CStock,
        InitialQty: item.CStock,
        PurchasePrice: item.PurchasePrice,
        SalePrice: item.Price,
        Status: 'ACTIVE' as const,
        CreatedAt: ''
      }] : []);

  if (batches.length === 0) {
    return { status: 'NO_EXPIRY', label: 'No Expiry', count: 0, expiredQty: 0, nearExpiryQty: 0, activeQty: item.CStock, earliestExpDate: '' };
  }

  let expiredQty = 0;
  let nearExpiryQty = 0;
  let activeQty = 0;
  let earliestExpDate = '';

  batches.forEach(b => {
    const q = Number(b.Qty) || 0;
    if (isBatchExpired(b.ExpDate)) {
      expiredQty += q;
    } else if (isBatchNearExpiry(b.ExpDate)) {
      nearExpiryQty += q;
    } else {
      activeQty += q;
    }
    if (b.ExpDate && (!earliestExpDate || b.ExpDate < earliestExpDate)) {
      earliestExpDate = b.ExpDate;
    }
  });

  if (expiredQty > 0 && activeQty === 0 && nearExpiryQty === 0) {
    return { status: 'EXPIRED', label: 'Expired Lot', count: batches.length, expiredQty, nearExpiryQty, activeQty, earliestExpDate };
  }
  if (expiredQty > 0) {
    return { status: 'PARTIAL_EXPIRED', label: `${expiredQty} Expired`, count: batches.length, expiredQty, nearExpiryQty, activeQty, earliestExpDate };
  }
  if (nearExpiryQty > 0) {
    return { status: 'NEAR_EXPIRY', label: 'Expiring Soon', count: batches.length, expiredQty, nearExpiryQty, activeQty, earliestExpDate };
  }
  return { status: 'ACTIVE', label: 'Active', count: batches.length, expiredQty, nearExpiryQty, activeQty, earliestExpDate };
};

export const MEDICINE_CATEGORIES = [
  'BM Drops',
  'Q D DROPS',
  'Potency 30',
  'Potency 200',
  'Syrup',
  'Drops',
  'Tab',
  'Cap',
  'Ointment',
  'Mother Tincture',
  'Trituration',
  'External',
  'General',
  'Cream',
  'Lotion',
  'Bio-Chemic'
];

export const numToWords = (num: number): string => {
  if (isNaN(num) || num === 0) return 'Rupees Zero Only';
  const a = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'
  ];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const numToWordsLessThanThousand = (n: number): string => {
    if (n === 0) return '';
    let str = '';
    if (n >= 100) {
      str += a[Math.floor(n / 100)] + ' Hundred ';
      n %= 100;
    }
    if (n >= 20) {
      str += b[Math.floor(n / 10)] + ' ';
      n %= 10;
    }
    if (n > 0) {
      str += a[n] + ' ';
    }
    return str.trim();
  };

  num = Math.floor(Math.abs(num));
  let words = '';
  if (num >= 10000000) {
    words += numToWordsLessThanThousand(Math.floor(num / 10000000)) + ' Crore ';
    num %= 10000000;
  }
  if (num >= 100000) {
    words += numToWordsLessThanThousand(Math.floor(num / 100000)) + ' Lakh ';
    num %= 100000;
  }
  if (num >= 1000) {
    words += numToWordsLessThanThousand(Math.floor(num / 1000)) + ' Thousand ';
    num %= 1000;
  }
  if (num > 0) {
    words += numToWordsLessThanThousand(num) + ' ';
  }
  return 'Rupees ' + words.trim() + ' Only';
};
