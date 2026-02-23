'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { upsertGemrateMapping } from './actions';

export function AddMappingForm() {
  const router = useRouter();
  const [packName, setPackName] = useState('');
  const [releaseYear, setReleaseYear] = useState('');
  const [gemrateUrl, setGemrateUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<'idle' | 'success' | 'error'>('idle');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmedPack = packName.trim();
    const trimmedYear = releaseYear.trim();
    const trimmedUrl = gemrateUrl.trim();
    if (!trimmedPack || !trimmedYear || !trimmedUrl) {
      setMessage('error');
      return;
    }
    setSaving(true);
    setMessage('idle');
    try {
      const seriesName = `${trimmedPack}|${trimmedYear}`;
      await upsertGemrateMapping(seriesName, trimmedUrl);
      setMessage('success');
      setPackName('');
      setReleaseYear('');
      setGemrateUrl('');
      router.refresh();
    } catch {
      setMessage('error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-4">
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-slate-700">パック名</span>
        <input
          type="text"
          value={packName}
          onChange={(e) => setPackName(e.target.value)}
          placeholder="MEGAドリームex"
          className="min-w-[160px] px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-slate-700">発売年</span>
        <input
          type="text"
          value={releaseYear}
          onChange={(e) => setReleaseYear(e.target.value)}
          placeholder="2025"
          className="w-24 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </label>
      <label className="flex flex-col gap-1 flex-1 min-w-[200px]">
        <span className="text-sm font-medium text-slate-700">Gemrate URL</span>
        <input
          type="url"
          value={gemrateUrl}
          onChange={(e) => setGemrateUrl(e.target.value)}
          placeholder="https://..."
          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </label>
      <div className="flex items-center gap-2 pb-0.5">
        <button
          type="submit"
          disabled={saving || !packName.trim() || !releaseYear.trim() || !gemrateUrl.trim()}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? '登録中...' : '登録'}
        </button>
        {message === 'success' && (
          <span className="text-sm text-green-600">登録しました</span>
        )}
        {message === 'error' && (
          <span className="text-sm text-red-600">登録に失敗しました</span>
        )}
      </div>
    </form>
  );
}
