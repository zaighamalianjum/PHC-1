import React from 'react';
import { ErpVendor, ErpGrn, ErpTransaction } from '../../types';

export const WhatsAppIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.573-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c-.001 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

export const DEFAULT_EXPENSE_CATEGORIES = [
  'Utilities',
  'Rent',
  'Maintenance',
  'Refreshment',
  'Marketing',
  'Supplies',
  'Salaries',
  'Other'
];

export interface VendorBalanceBreakdown {
  totalPurchased: number;
  creditPurchased: number;
  cashPurchased: number;
  totalPaid: number;
  creditPaid: number;
  cashPaid: number;
  outstandingBalance: number;
  creditBalance: number;
  cashBalance: number;
}

export const computeVendorBalanceBreakdown = (
  vendor: ErpVendor,
  grns: ErpGrn[] = [],
  transactions: ErpTransaction[] = []
): VendorBalanceBreakdown => {
  if (!vendor) {
    return {
      totalPurchased: 0,
      creditPurchased: 0,
      cashPurchased: 0,
      totalPaid: 0,
      creditPaid: 0,
      cashPaid: 0,
      outstandingBalance: 0,
      creditBalance: 0,
      cashBalance: 0,
    };
  }

  const vName = (vendor.VendorName || '').trim().toLowerCase();
  const vId = (vendor.VendorID || vendor._id || '').trim().toLowerCase();

  // 1. Find all GRNs for this vendor
  const vGrns = (grns || []).filter(g => {
    const sName = ((g as any).SupplierName || g.VendorName || '').trim().toLowerCase();
    const sId = ((g as any).SupplierID || g.VendorID || '').trim().toLowerCase();
    return (vName && sName === vName) || (vId && sId === vId) || (sName && vName.includes(sName));
  });

  let creditPurchased = 0;
  let cashPurchased = 0;

  vGrns.forEach(g => {
    const amt = Number(g.TotalAmount || 0);
    const isCash = String(g.PaymentMethod || (g as any).PaymentMode || '').toLowerCase() === 'cash';
    if (isCash) {
      cashPurchased += amt;
    } else {
      creditPurchased += amt;
    }
  });
  const totalPurchased = creditPurchased + cashPurchased;

  // 2. Find all payments for this vendor
  const vTxns = (transactions || []).filter(t => {
    const tVName = (t.VendorName || '').trim().toLowerCase();
    const tVId = (t.VendorID || '').trim().toLowerCase();
    const isVendorPay = t.Type === 'VendorPayment' || t.Category === 'Vendor Payment' || (t.Type === 'Expense' && tVName);
    return isVendorPay && ((vName && tVName === vName) || (vId && tVId === vId) || (tVName && vName.includes(tVName)));
  });

  let creditPaid = 0;
  let cashPaid = 0;

  vTxns.forEach(t => {
    const amt = Number(t.Amount || 0);
    const target = String((t as any).TargetBillType || (t as any).BillType || '').toLowerCase();
    const cat = String(t.Category || '').toLowerCase();
    const desc = String(t.Description || '').toLowerCase();
    const method = String(t.PaymentMethod || '').toLowerCase();

    // Determine whether payment was against Cash Bill or Credit Bill
    if (target === 'cash' || cat.includes('cash bill') || desc.includes('cash bill') || cat.includes('spot cash') || desc.includes('spot cash') || cat.includes('cash spot')) {
      cashPaid += amt;
    } else if (target === 'credit' || cat.includes('credit') || desc.includes('credit')) {
      creditPaid += amt;
    } else if (method === 'cash' && (cat.includes('spot') || desc.includes('spot'))) {
      cashPaid += amt;
    } else {
      creditPaid += amt;
    }
  });

  const totalPaid = creditPaid + cashPaid;

  // 3. Compute balances
  let computedCreditBalance = 0;
  let computedCashBalance = 0;

  if (vendor.CreditBalance !== undefined && vendor.CashBalance !== undefined) {
    computedCreditBalance = Math.max(0, Number(vendor.CreditBalance) || 0);
    computedCashBalance = Math.max(0, Number(vendor.CashBalance) || 0);
  } else if (totalPurchased > 0 || totalPaid > 0) {
    computedCreditBalance = Math.max(0, creditPurchased - creditPaid);
    computedCashBalance = Math.max(0, cashPurchased - cashPaid);
  } else {
    // If no GRNs yet but vendor has an existing Balance:
    computedCreditBalance = Math.max(0, Number(vendor.Balance) || 0);
    computedCashBalance = 0;
  }

  const outstandingBalance = computedCreditBalance + computedCashBalance;

  return {
    totalPurchased,
    creditPurchased,
    cashPurchased,
    totalPaid,
    creditPaid,
    cashPaid,
    outstandingBalance,
    creditBalance: computedCreditBalance,
    cashBalance: computedCashBalance,
  };
};

