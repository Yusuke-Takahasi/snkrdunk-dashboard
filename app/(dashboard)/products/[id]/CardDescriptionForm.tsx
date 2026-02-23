'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { updateProductCardDescription } from './actions';

type Props = {
  productId: string;
  initialValue: string | null;
};

export function CardDescriptionForm({ productId, initialValue }: Props) {
  const router = useRouter();
  const [value, setValue] = useState(initialValue ?? '');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<'idle' | 'success' | 'error'>('idle');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage('idle');
    try {
      await updateProductCardDescription(productId, value || null);
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
      <label htmlFor="card_description" className="block text-sm font-medium text-slate-700">
        Gemrate 照合用（card_description）
      </label>
      <p className="text-xs text-slate-500 mb-1">
        自動照合に失敗した場合、gemrate_stats の card_description と一致する値を入力すると取得率が表示されます。
      </p>
      <input
        id="card_description"
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="例: カード識別用の文字列"
        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={saving}
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
    </form>
  );
}
