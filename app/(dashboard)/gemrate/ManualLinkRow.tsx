'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { upsertGemrateMapping } from './actions';

type Props = {
  seriesName: string;
  packName: string;
  releaseYear: string;
  initialUrl?: string | null;
};

export function ManualLinkRow({ seriesName, packName, releaseYear, initialUrl }: Props) {
  const router = useRouter();
  const [url, setUrl] = useState(initialUrl ?? '');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<'idle' | 'success' | 'error'>('idle');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage('idle');
    try {
      await upsertGemrateMapping(seriesName, url);
      setMessage('success');
      router.refresh();
    } catch {
      setMessage('error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <tr className="hover:bg-slate-50">
      <td className="p-4 font-medium text-slate-900 whitespace-nowrap overflow-hidden text-ellipsis" title={packName}>
        {packName}
      </td>
      <td className="p-4 text-slate-700 whitespace-nowrap">{releaseYear}</td>
      <td className="p-4 min-w-0">
        <form onSubmit={handleSubmit} className="flex flex-nowrap items-center gap-2">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://..."
            className="flex-1 min-w-0 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            type="submit"
            disabled={saving || !url.trim()}
            className="shrink-0 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? '登録中...' : '登録'}
          </button>
          {message === 'success' && <span className="shrink-0 text-sm text-green-600">保存しました</span>}
          {message === 'error' && <span className="shrink-0 text-sm text-red-600">保存に失敗しました</span>}
        </form>
      </td>
    </tr>
  );
}
