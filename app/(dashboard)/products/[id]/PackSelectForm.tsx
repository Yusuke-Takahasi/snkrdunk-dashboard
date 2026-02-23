'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { getPacksByYear, updateProductGemrateSeriesName } from './actions';

type Props = {
  productId: string;
  releaseYear: number | null;
  initialValue: string | null;
};

export function PackSelectForm({
  productId,
  releaseYear,
  initialValue,
}: Props) {
  const router = useRouter();
  const [packs, setPacks] = useState<string[]>([]);
  const [loadingPacks, setLoadingPacks] = useState(false);
  const [value, setValue] = useState(initialValue ?? '');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<'idle' | 'success' | 'error'>('idle');

  useEffect(() => {
    setValue(initialValue ?? '');
  }, [initialValue]);

  useEffect(() => {
    setLoadingPacks(true);
    getPacksByYear(releaseYear)
      .then(setPacks)
      .catch(() => setPacks([]))
      .finally(() => setLoadingPacks(false));
  }, [releaseYear]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage('idle');
    try {
      await updateProductGemrateSeriesName(
        productId,
        value.trim() || null
      );
      setMessage('success');
      router.refresh();
    } catch {
      setMessage('error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <label
        htmlFor="gemrate_series_name"
        className="block text-sm font-medium text-slate-700"
      >
        パック（Gemrate 照合用）
      </label>
      <p className="text-xs text-slate-500 mb-1">
        発売年に合うパックだけが選択肢になります。パックを選ぶとPSA10取得率の照合とGemrateボタンが有効になります。同じパック名・発売年の他商品にも同じ選択が反映されます。未選択の場合は商品名から自動判定します。
      </p>
      {releaseYear == null ? (
        <p className="text-sm text-slate-500 py-2">
          発売日が未設定のためパック一覧を表示できません。
        </p>
      ) : (
        <>
          <select
            id="gemrate_series_name"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            disabled={loadingPacks}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
          >
            <option value="">未選択（自動）</option>
            {packs.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={saving || loadingPacks}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? '保存中...' : '保存'}
            </button>
            {message === 'success' && (
              <span className="text-sm text-green-600">保存しました</span>
            )}
            {message === 'error' && (
              <span className="text-sm text-red-600">保存に失敗しました</span>
            )}
          </div>
        </>
      )}
    </form>
  );
}
