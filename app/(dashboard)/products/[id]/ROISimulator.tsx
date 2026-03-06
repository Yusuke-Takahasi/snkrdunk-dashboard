'use client';

import { useState, useMemo } from 'react';
import { Calculator } from 'lucide-react';

const DEFAULT_MERCARI_FEE_PERCENT = 10;
const DEFAULT_SNKRDUNK_FEE_PERCENT = 8;
const DEFAULT_GRADING_FEE = 3300;

export type PsaPlanItem = { id: string; label: string; price: number };

type SellingDestination = 'mercari' | 'snkrdunk';

type ROISimulatorProps = {
  latestPsa10Price: number;
  latestBasePrice: number;
  /** メルカリ手数料（%）。未指定時は 10 */
  mercariFeePercent?: number;
  /** スニダン手数料（%）。未指定時は 8 */
  snkrdunkFeePercent?: number;
  /** 鑑定費のデフォルト（円）。psaPlans 未指定時やフォールバック用 */
  defaultGradingFee?: number;
  /** 設定画面のPSA鑑定料金から生成したプラン一覧。指定時はプルダウンで選択可能 */
  psaPlans?: PsaPlanItem[];
  /** 初期選択するプラン id。未指定時は psaPlans[0] */
  defaultPlanId?: string;
};

export function ROISimulator({
  latestPsa10Price,
  latestBasePrice,
  mercariFeePercent = DEFAULT_MERCARI_FEE_PERCENT,
  snkrdunkFeePercent = DEFAULT_SNKRDUNK_FEE_PERCENT,
  defaultGradingFee = DEFAULT_GRADING_FEE,
  psaPlans,
  defaultPlanId,
}: ROISimulatorProps) {
  const defaultPlan =
    psaPlans && psaPlans.length > 0
      ? (psaPlans.find((p) => p.id === defaultPlanId) ?? psaPlans[0])
      : undefined;
  const initialFee = defaultPlan ? defaultPlan.price : defaultGradingFee;
  const initialPlanId = defaultPlan?.id ?? null;

  const [purchasePrice, setPurchasePrice] = useState(latestBasePrice || 0);
  const [psa10SellPrice, setPsa10SellPrice] = useState(latestPsa10Price || 0);
  const [sellingDestination, setSellingDestination] = useState<SellingDestination>('snkrdunk');
  const [gradingShipping, setGradingShipping] = useState(initialFee);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(initialPlanId);

  const sellingFeeRate =
    sellingDestination === 'mercari'
      ? mercariFeePercent / 100
      : snkrdunkFeePercent / 100;
  const { expectedProfit, roi } = useMemo(() => {
    const cost = purchasePrice + gradingShipping;
    const sellPriceAfterFee = psa10SellPrice * (1 - sellingFeeRate);
    const profit = Math.floor(sellPriceAfterFee - cost);
    const roiPercent =
      cost > 0 ? Math.round((profit / cost) * 100) : 0;
    return { expectedProfit: profit, roi: roiPercent };
  }, [purchasePrice, psa10SellPrice, gradingShipping, sellingFeeRate]);

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
            PSA10販売価格（円）
          </label>
          <input
            type="number"
            value={psa10SellPrice || ''}
            onChange={(e) => setPsa10SellPrice(Number(e.target.value) || 0)}
            className="w-full px-4 py-3 border border-slate-300 rounded-lg bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-right text-base font-mono tabular-nums"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            販売先
          </label>
          <select
            value={sellingDestination}
            onChange={(e) =>
              setSellingDestination(e.target.value as SellingDestination)
            }
            className="w-full px-4 py-3 border border-slate-300 rounded-lg bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-base"
          >
            <option value="snkrdunk">スニダン（{snkrdunkFeePercent}%）</option>
            <option value="mercari">メルカリ（{mercariFeePercent}%）</option>
          </select>
        </div>
        <div>
          {psaPlans && psaPlans.length > 0 && (
            <>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                鑑定プラン
              </label>
              <select
                value={selectedPlanId ?? ''}
                onChange={(e) => {
                  const id = e.target.value;
                  const plan = psaPlans.find((p) => p.id === id);
                  if (plan) {
                    setSelectedPlanId(id);
                    setGradingShipping(plan.price);
                  }
                }}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-base mb-3"
              >
                {psaPlans.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </select>
            </>
          )}
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            鑑定費（円）
          </label>
          <input
            type="number"
            value={gradingShipping || ''}
            onChange={(e) => setGradingShipping(Number(e.target.value) || 0)}
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
            setPsa10SellPrice(latestPsa10Price || 0);
            setSellingDestination('snkrdunk');
            if (defaultPlan) {
              setSelectedPlanId(defaultPlan.id);
              setGradingShipping(defaultPlan.price);
            } else {
              setGradingShipping(defaultGradingFee);
            }
          }}
          className="w-full mt-4 py-3 px-4 bg-slate-100 text-slate-800 rounded-lg font-semibold hover:bg-slate-200 transition-colors min-h-[44px]"
        >
          デフォルトに戻す
        </button>
      </div>
    </div>
  );
}
