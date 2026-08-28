import React from 'react';
import { ShoppingCart, Plus, X, Printer, Edit, DollarSign, Boxes, Pencil, PackageCheck } from 'lucide-react';
import { ErpVendor, ErpPurchaseOrder, ErpGrn, ErpTransaction } from '../../../types';

interface VendorPurchaseOrdersModalProps {
  vendorPoModalData: ErpVendor | null;
  setVendorPoModalData: (v: ErpVendor | null) => void;
  purchaseOrders: ErpPurchaseOrder[];
  grns: ErpGrn[];
  transactions: ErpTransaction[];
  handleOpenNewPoModal: (targetVendor?: ErpVendor) => void;
  handleOpenEditPoModal: (po: ErpPurchaseOrder) => void;
  handlePrintPo: (po: ErpPurchaseOrder) => void;
  setPayVendorModalData: (data: any) => void;
  setPoHistoryFilterPo: (val: string) => void;
  setPoHistoryModalData: (data: any) => void;
  isPoStockReceivedOrLocked: (po: ErpPurchaseOrder) => boolean;
  handleOpenGrnForPo?: (po?: ErpPurchaseOrder) => void;
}

export const VendorPurchaseOrdersModal: React.FC<VendorPurchaseOrdersModalProps> = ({
  vendorPoModalData,
  setVendorPoModalData,
  purchaseOrders,
  grns,
  transactions,
  handleOpenNewPoModal,
  handleOpenEditPoModal,
  handlePrintPo,
  setPayVendorModalData,
  setPoHistoryFilterPo,
  setPoHistoryModalData,
  isPoStockReceivedOrLocked,
  handleOpenGrnForPo,
}) => {
  if (!vendorPoModalData) return null;
  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-4xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-indigo-100 text-indigo-800 rounded-xl font-bold">
              <Boxes className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">
                Purchase Orders — {vendorPoModalData.VendorName}
              </h3>
              <p className="text-xs text-slate-500">
                Vendor Code: <strong className="text-slate-800">{vendorPoModalData.VendorID || 'N/A'}</strong> | Contact: {vendorPoModalData.Phone || 'N/A'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setVendorPoModalData(null)}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {(() => {
          const vPos = purchaseOrders.filter(po => 
            (po.VendorID && po.VendorID === vendorPoModalData.VendorID) || 
            (po.VendorName && po.VendorName.toLowerCase() === vendorPoModalData.VendorName.toLowerCase())
          );

          if (vPos.length === 0) {
            return (
              <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-300 rounded-2xl space-y-3">
                <Boxes className="w-10 h-10 text-slate-300 mx-auto" />
                <div className="text-slate-700 font-bold text-sm">No Purchase Orders Found</div>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  No official purchase orders have been created for {vendorPoModalData.VendorName} yet.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setVendorPoModalData(null);
                    handleOpenNewPoModal(vendorPoModalData);
                  }}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition inline-flex items-center space-x-1.5 cursor-pointer shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create First PO for this Vendor</span>
                </button>
              </div>
            );
          }

          return (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-600">
                  Showing <strong>{vPos.length}</strong> Purchase Order(s) for this vendor
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setVendorPoModalData(null);
                    handleOpenNewPoModal(vendorPoModalData);
                  }}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg transition inline-flex items-center space-x-1 cursor-pointer shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New P.O.</span>
                </button>
              </div>

              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100/75 text-slate-700 uppercase font-black tracking-wider text-[10px] border-b border-slate-200">
                    <tr>
                      <th className="p-3">PO Number</th>
                      <th className="p-3">Order Date</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Items Count</th>
                      <th className="p-3 text-right">Order Amount</th>
                      <th className="p-3 text-right">Paid Amount</th>
                      <th className="p-3 text-right">Outstanding</th>
                      <th className="p-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {vPos.map((po, idx) => {
                      const poGrns = grns.filter(g => g.POID === po.POID || g.POID === po._id);
                      const isStockReceived = poGrns.length > 0 || po.Status === 'Received';
                      
                      const poTxns = transactions.filter(t => 
                        (t.ReferenceNo && (t.ReferenceNo === po.POID || t.ReferenceNo === po.ReferenceNo)) ||
                        (t.Description && t.Description.includes(po.POID))
                      );
                      const paidForPo = poTxns.reduce((acc, t) => acc + (t.Amount || 0), 0);
                      const poTotal = po.TotalAmount || 0;
                      const outstanding = Math.max(0, poTotal - paidForPo);

                      return (
                        <tr key={idx} className="hover:bg-slate-50 transition">
                          <td className="p-3 font-mono font-bold text-indigo-600">
                            {po.POID}
                          </td>
                          <td className="p-3 text-slate-600 font-mono">
                            {po.Date ? new Date(po.Date).toLocaleDateString('en-GB') : '-'}
                          </td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              po.Status === 'Received' ? 'bg-emerald-100 text-emerald-800' :
                              po.Status === 'Ordered' ? 'bg-amber-100 text-amber-800' :
                              'bg-slate-100 text-slate-800'
                            }`}>
                              {po.Status || 'Draft'}
                            </span>
                          </td>
                          <td className="p-3 text-slate-700 font-medium">
                            {po.Items?.length || 0} medicine(s)
                          </td>
                          <td className="p-3 text-right font-mono font-bold text-slate-900">
                            Rs. {poTotal.toLocaleString()}
                          </td>
                          <td className="p-3 text-right font-mono font-bold text-emerald-600">
                            Rs. {paidForPo.toLocaleString()}
                          </td>
                          <td className="p-3 text-right font-mono font-bold text-rose-600">
                            Rs. {outstanding.toLocaleString()}
                          </td>
                          <td className="p-3 text-center">
                            <div className="flex items-center justify-center space-x-1.5">
                              {outstanding > 0 && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setPayVendorModalData({
                                      vendor: vendorPoModalData,
                                      defaultPoNo: po.POID,
                                      defaultAmount: outstanding
                                    });
                                  }}
                                  className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold rounded border border-emerald-200 transition cursor-pointer flex items-center space-x-1"
                                  title="Pay against this PO"
                                >
                                  <DollarSign className="w-3 h-3 text-emerald-600" />
                                  <span>Pay</span>
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => {
                                  setPoHistoryFilterPo(po.POID);
                                  setPoHistoryModalData(vendorPoModalData);
                                }}
                                className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 font-bold rounded border border-indigo-200 transition cursor-pointer"
                                title="View Payments History for this PO"
                              >
                                History
                              </button>
                              {isPoStockReceivedOrLocked(po) ? (
                                <button
                                  type="button"
                                  disabled
                                  className="px-2 py-1 bg-slate-100 text-slate-400 font-bold rounded border border-slate-200 cursor-not-allowed flex items-center space-x-1 opacity-60"
                                  title="Cannot edit: GRN received or locked"
                                >
                                  <Edit className="w-3 h-3 text-slate-400" />
                                  <span>Locked</span>
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setVendorPoModalData(null);
                                    handleOpenEditPoModal(po);
                                  }}
                                  className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold rounded border border-amber-200 transition cursor-pointer flex items-center space-x-1"
                                  title="Edit Purchase Order items/quantities"
                                >
                                  <Pencil className="w-3 h-3 text-amber-600" />
                                  <span>Edit</span>
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => handlePrintPo(po)}
                                className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded border border-slate-300 transition cursor-pointer flex items-center space-x-1"
                                title="Print Official PO"
                              >
                                <Printer className="w-3 h-3 text-slate-600" />
                                <span>Print</span>
                              </button>
                              {po.Status !== 'Received' && handleOpenGrnForPo && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setVendorPoModalData(null);
                                    handleOpenGrnForPo(po);
                                  }}
                                  className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold rounded border border-emerald-200 transition cursor-pointer flex items-center space-x-1"
                                  title="Process Goods Received Note (GRN)"
                                >
                                  <PackageCheck className="w-3 h-3 text-emerald-600" />
                                  <span>GRN</span>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })()}

        <div className="flex items-center justify-end pt-3 border-t border-slate-200">
          <button
            type="button"
            onClick={() => setVendorPoModalData(null)}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
          >
            Close Window
          </button>
        </div>
      </div>
    </div>
  );
};

export default VendorPurchaseOrdersModal;
