'use client';

import { useState, useMemo } from 'react';
import { Calculator } from 'lucide-react';

const MERCADARI_FEE_RATE = 0.1; // 10%

type ROISimulatorProps = {
  latestPsa10Price: number;
  latestBasePrice: number;
};

export function ROISimulator({
  latestPsa10Price,
  latestBasePrice,
}: ROISimulatorProps) {
  const [purchasePrice, setPurchasePrice] = useState(latestBasePrice || 0);
  const [gradingShipping, setGradingShipping] = useState(3300);
  const [psa10Rate, setPsa10Rate] = useState(75);

  const { expectedProfit, roi } = useMemo(() => {
    const cost = purchasePrice + gradingShipping;
    const sellPriceAfterFee = latestPsa10Price * (1 - MERCADARI_FEE_RATE);
    const expectedSell = sellPriceAfterFee * (psa10Rate / 100);
    const profit = Math.floor(expectedSell - cost);
    const roiPercent =
      cost > 0 ? Math.round((profit / cost) * 100) : 0;
    return { expectedProfit: profit, roi: roiPercent };
  }, [purchasePrice, gradingShipping, psa10Rate, latestPsa10Price]);

  return (
    <div className="w-full max-w-full bg-white rounded-xl border border-slate-200 p-6 shadow-sm box-border">
      <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-6 pb-3 border-b border-slate-200">
        <Calculator size={22} className="text-blue-600 shrink-0" />
        期待値・ROI シミュレーター
      </h2>
      <div className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            素体 仕入価格（円）
          </label>
          <input
            type="number"
            value={purchasePrice || ''}
            onChange={(e) => setPurchasePrice(Number(e.target.value) || 0)}
            className="w-full px-4 py-3 border border-slate-300 rounded-lg bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-right text-base font-mono tabular-nums"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            鑑定料・送料（円）
          </label>
          <input
            type="number"
            value={gradingShipping || ''}
            onChange={(e) => setGradingShipping(Number(e.target.value) || 0)}
            className="w-full px-4 py-3 border border-slate-300 rounded-lg bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-right text-base font-mono tabular-nums"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            PSA10 取得率（%）
          </label>
          <input
            type="number"
            min={0}
            max={100}
            value={psa10Rate || ''}
            onChange={(e) => setPsa10Rate(Number(e.target.value) || 0)}
            className="w-full px-4 py-3 border border-slate-300 rounded-lg bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-right text-base font-mono tabular-nums"
          />
        </div>

        <div className="pt-5 mt-5 border-t border-slate-200 space-y-3">
          <div className="flex justify-between items-baseline gap-4">
            <span className="text-sm font-medium text-slate-600">
              期待値（予想純利益）
            </span>
            <span
              className={`text-xl font-bold tabular-nums shrink-0 ${
                expectedProfit > 0
                  ? 'text-emerald-600'
                  : expectedProfit < 0
                    ? 'text-red-600'
                    : 'text-slate-700'
              }`}
            >
              ¥{expectedProfit.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between items-baseline gap-4">
            <span className="text-sm font-medium text-slate-600">ROI</span>
            <span
              className={`text-lg font-bold tabular-nums shrink-0 ${
                roi > 0
                  ? 'text-emerald-600'
                  : roi < 0
                    ? 'text-red-600'
                    : 'text-slate-700'
              }`}
            >
              {roi}%
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            setPurchasePrice(latestBasePrice || 0);
            setGradingShipping(3300);
            setPsa10Rate(75);
          }}
          className="w-full mt-4 py-3 px-4 bg-slate-100 text-slate-800 rounded-lg font-semibold hover:bg-slate-200 transition-colors min-h-[44px]"
        >
          デフォルトに戻す
        </button>
      </div>
    </div>
  );
}
