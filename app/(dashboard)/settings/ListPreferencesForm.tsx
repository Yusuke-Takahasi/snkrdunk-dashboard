'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { saveListPreferencesAction } from './actions';
import type { ListPreferences } from '../../../utils/appSettings';

const SORT_ORDER_OPTIONS = [
  { value: 'updated_at_desc', label: '更新日時が新しい順' },
  { value: 'expectedProfit_desc', label: '予想利益が高い順' },
  { value: 'roi_desc', label: 'ROIが高い順' },
  { value: 'release_date_desc', label: '発売日が新しい順' },
] as const;

const SALES_DESTINATION_OPTIONS = [
  { value: 'mercari', label: 'メルカリ' },
  { value: 'snkrdunk', label: 'スニダン' },
] as const;

function numOrUndefined(s: string): number | undefined {
  const n = parseInt(s, 10);
  return s === '' || Number.isNaN(n) ? undefined : n;
}

function toSortOrder(prefs: ListPreferences): string {
  return `${prefs.defaultSort}_${prefs.defaultOrder}`;
}

function fromSortOrder(value: string): { defaultSort: string; defaultOrder: 'asc' | 'desc' } {
  const [sort, order] = value.split('_');
  return {
    defaultSort: sort || 'updated_at',
    defaultOrder: order === 'asc' ? 'asc' : 'desc',
  };
}

type ListPreferencesFormProps = {
  initial: ListPreferences;
};

export function ListPreferencesForm({ initial }: ListPreferencesFormProps) {
  const router = useRouter();
  const [prefs, setPrefs] = useState<ListPreferences>(initial);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'ok' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const { error } = await saveListPreferencesAction(prefs);
      if (error) {
        setMessage({ type: 'error', text: error });
        return;
      }
      setMessage({ type: 'ok', text: '保存しました' });
      router.refresh();
    } finally {
      setSaving(false);
    }
  };

  const sortOrderValue = toSortOrder(prefs);
  const salesDest = prefs.defaultSalesDestination ?? 'mercari';

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <div className="space-y-3">
          <label className="flex items-center justify-between gap-4 p-3 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors">
            <span className="text-sm font-medium text-slate-700">販売先</span>
            <select
              className="text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none"
              value={salesDest}
              onChange={(e) =>
                setPrefs((prev) => ({
                  ...prev,
                  defaultSalesDestination: e.target.value === 'snkrdunk' ? 'snkrdunk' : 'mercari',
                }))
              }
            >
              {SALES_DESTINATION_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
          <p className="text-xs text-slate-500 -mt-1">
            一覧の予想利益・ROI 計算に使用する手数料が切り替わります
          </p>

          <label className="flex items-center justify-between gap-4 p-3 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors">
            <span className="text-sm font-medium text-slate-700">表示順（初期）</span>
            <select
              className="text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none"
              value={sortOrderValue}
              onChange={(e) => {
                const { defaultSort, defaultOrder } = fromSortOrder(e.target.value);
                setPrefs((prev) => ({ ...prev, defaultSort, defaultOrder }));
              }}
            >
              {SORT_ORDER_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors">
            <input
              type="checkbox"
              checked={prefs.excludeBlacklisted}
              onChange={(e) =>
                setPrefs((prev) => ({ ...prev, excludeBlacklisted: e.target.checked }))
              }
              className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-slate-700">
              非表示にした商品を一覧に含めない
            </span>
          </label>
          <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors">
            <input
              type="checkbox"
              checked={prefs.favoriteOnly}
              onChange={(e) =>
                setPrefs((prev) => ({ ...prev, favoriteOnly: e.target.checked }))
              }
              className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-slate-700">
              お気に入りのみ表示（オフで全件表示）
            </span>
          </label>
        </div>

        <div className="min-w-0">
          <p className="text-sm font-bold text-slate-800 mb-1">初期の絞り込み条件</p>
          <p className="text-xs text-slate-500 mb-2">
            一覧を開いたときの初期値。サイドバーで変更するとサイドバーの条件で絞り込みます
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-slate-600">予想利益（円）以上</span>
            <input
              type="number"
              className="text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white"
              value={prefs.defaultMinProfit ?? ''}
              onChange={(e) =>
                setPrefs((prev) => ({ ...prev, defaultMinProfit: numOrUndefined(e.target.value) }))
              }
              placeholder="未設定"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-slate-600">ROI下限（%）</span>
            <input
              type="number"
              className="text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white"
              value={prefs.defaultMinRoi ?? ''}
              onChange={(e) =>
                setPrefs((prev) => ({ ...prev, defaultMinRoi: numOrUndefined(e.target.value) }))
              }
              placeholder="未設定"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-slate-600">PSA10下限（円）</span>
            <input
              type="number"
              className="text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white"
              value={prefs.defaultMinPsa10 ?? ''}
              onChange={(e) =>
                setPrefs((prev) => ({ ...prev, defaultMinPsa10: numOrUndefined(e.target.value) }))
              }
              placeholder="未設定"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-slate-600">PSA10上限（円）</span>
            <input
              type="number"
              className="text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white"
              value={prefs.defaultMaxPsa10 ?? ''}
              onChange={(e) =>
                setPrefs((prev) => ({ ...prev, defaultMaxPsa10: numOrUndefined(e.target.value) }))
              }
              placeholder="未設定"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-slate-600">素体下限(A)（円）</span>
            <input
              type="number"
              className="text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white"
              value={prefs.defaultMinBase ?? ''}
              onChange={(e) =>
                setPrefs((prev) => ({ ...prev, defaultMinBase: numOrUndefined(e.target.value) }))
              }
              placeholder="未設定"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-slate-600">素体上限(A)（円）</span>
            <input
              type="number"
              className="text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white"
              value={prefs.defaultMaxBase ?? ''}
              onChange={(e) =>
                setPrefs((prev) => ({ ...prev, defaultMaxBase: numOrUndefined(e.target.value) }))
              }
              placeholder="未設定"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-slate-600">発売年下限</span>
            <input
              type="number"
              className="text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white"
              value={prefs.defaultMinYear ?? ''}
              onChange={(e) =>
                setPrefs((prev) => ({ ...prev, defaultMinYear: numOrUndefined(e.target.value) }))
              }
              placeholder="未設定"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-slate-600">発売年上限</span>
            <input
              type="number"
              className="text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white"
              value={prefs.defaultMaxYear ?? ''}
              onChange={(e) =>
                setPrefs((prev) => ({ ...prev, defaultMaxYear: numOrUndefined(e.target.value) }))
              }
              placeholder="未設定"
            />
          </label>
          <label className="flex flex-col gap-1 col-span-2 sm:col-span-1">
            <span className="text-xs font-medium text-slate-600">PSA10取得率下限（%）</span>
            <input
              type="number"
              className="text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white"
              value={prefs.defaultMinPsa10Rate ?? ''}
              onChange={(e) =>
                setPrefs((prev) => ({ ...prev, defaultMinPsa10Rate: numOrUndefined(e.target.value) }))
              }
              placeholder="未設定"
            />
          </label>
        </div>
        </div>
      </div>

      {message && (
        <p
          className={`text-sm font-medium ${
            message.type === 'ok' ? 'text-emerald-600' : 'text-red-600'
          }`}
        >
          {message.text}
        </p>
      )}

      <button
        type="submit"
        disabled={saving}
        className="w-full sm:w-auto px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 min-h-[44px]"
      >
        {saving ? (
          <>
            <Loader2 size={18} className="animate-spin" />
            保存中…
          </>
        ) : (
          '保存する'
        )}
      </button>
    </form>
  );
}
