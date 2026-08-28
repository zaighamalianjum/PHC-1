import React from 'react';
import { Boxes, X } from 'lucide-react';
import { ErpAsset } from '../../../types';

interface AssetModalProps {
  showAssetModal: boolean;
  setShowAssetModal: (show: boolean) => void;
  assetForm: Partial<ErpAsset>;
  setAssetForm: (form: any) => void;
  handleSaveAsset: (e: React.FormEvent) => void;
  isSubmitting: boolean;
}

export const AssetModal: React.FC<AssetModalProps> = ({
  showAssetModal,
  setShowAssetModal,
  assetForm,
  setAssetForm,
  handleSaveAsset,
  isSubmitting,
}) => {
  if (!showAssetModal) return null;
  return (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border space-y-4">
            <h3 className="font-bold text-slate-900 text-base">Add Fixed Asset Record</h3>
            <form onSubmit={handleSaveAsset} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-600">Asset Name</label>
                <input
                  type="text"
                  required
                  value={assetForm.AssetName}
                  onChange={e => setAssetForm({ ...assetForm, AssetName: e.target.value })}
                  placeholder=""
                  className="w-full mt-1 p-2 border rounded-xl text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-slate-600">Category</label>
                  <select
                    value={assetForm.Category}
                    onChange={e => setAssetForm({ ...assetForm, Category: e.target.value as any })}
                    className="w-full mt-1 p-2 border rounded-xl text-xs bg-white"
                  >
                    <option value="Equipment">Equipment</option>
                    <option value="IT Hardware">IT Hardware</option>
                    <option value="Furniture">Furniture</option>
                    <option value="Vehicle">Vehicle</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600">Purchase Cost (Rs.)</label>
                  <input
                    type="number"
                    required
                    value={assetForm.PurchaseCost || ''}
                    onChange={e => {
                      const val = Number(e.target.value);
                      setAssetForm({ ...assetForm, PurchaseCost: val, CurrentValue: val });
                    }}
                    placeholder=""
                    className="w-full mt-1 p-2 border rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAssetModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs"
                >
                  Save Fixed Asset
                </button>
              </div>
            </form>
          </div>
        </div>
  );
};

export default AssetModal;
