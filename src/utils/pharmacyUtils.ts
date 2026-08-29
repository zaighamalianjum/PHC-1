/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Item, ItemBatch } from '../types';

/**
 * Normalizes any date string (YYYY-MM-DD, YYYY-MM, MM/YYYY, MM-YYYY, DD/MM/YYYY, etc.)
 * into standard Month-Year format "YYYY-MM" suitable for <input type="month"> and database storage.
 */
export const toMonthYearInput = (dateStr?: string | null): string => {
  if (!dateStr || typeof dateStr !== 'string') return '';
  const trimmed = dateStr.trim();
  if (!trimmed) return '';

  // Already standard YYYY-MM
  if (/^\d{4}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }

  // YYYY-MM-DD or YYYY/MM/DD
  const ymdMatch = trimmed.match(/^(\d{4})[-/.](\d{1,2})(?:[-/.]\d{1,2})?/);
  if (ymdMatch) {
    const year = ymdMatch[1];
    const month = ymdMatch[2].padStart(2, '0');
    return `${year}-${month}`;
  }

  // MM/YYYY, MM-YYYY, DD/MM/YYYY, DD-MM-YYYY
  const dmyMatch = trimmed.match(/^(?:(\d{1,2})[-/.])?(\d{1,2})[-/.](\d{4})/);
  if (dmyMatch) {
    let month = dmyMatch[1] && !dmyMatch[3] ? dmyMatch[1] : dmyMatch[2];
    const year = dmyMatch[3];
    // If format was DD/MM/YYYY
    if (dmyMatch[1] && dmyMatch[2] && dmyMatch[3]) {
      month = dmyMatch[2];
    }
    return `${year}-${month.padStart(2, '0')}`;
  }

  // Text month names: "May 2026", "05-May-2026", "May-26"
  const monthsMap: Record<string, string> = {
    jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
    jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12'
  };
  const textMonthMatch = trimmed.match(/([a-zA-Z]{3,9})[^\d]*(\d{2,4})/);
  if (textMonthMatch) {
    const mStr = textMonthMatch[1].slice(0, 3).toLowerCase();
    let year = textMonthMatch[2];
    if (year.length === 2) {
      year = Number(year) > 50 ? `19${year}` : `20${year}`;
    }
    if (monthsMap[mStr]) {
      return `${year}-${monthsMap[mStr]}`;
    }
  }

  // Try standard Date parsing
  try {
    const d = new Date(trimmed);
    if (!isNaN(d.getTime())) {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      return `${year}-${month}`;
    }
  } catch {
    // ignore
  }

  return trimmed;
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
