'use client';

import { useState, useCallback } from 'react';
import { Heart, Loader2 } from 'lucide-react';

export function FavoriteButton({
  productId,
  initialFavorite,
}: {
  productId: string;
  initialFavorite: boolean | null;
}) {
  const [isFavorite, setIsFavorite] = useState(initialFavorite === true);
  const [updating, setUpdating] = useState(false);

  const handleClick = useCallback(async () => {
    if (updating) return;
    const next = !isFavorite;
    setIsFavorite(next);
    setUpdating(true);
    try {
      const res = await fetch(`/api/products/${encodeURIComponent(productId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_favorite: next }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error ?? `HTTP ${res.status}`);
      }
    } catch (err) {
      console.error('お気に入りの更新に失敗しました:', err);
      setIsFavorite(!next);
    } finally {
      setUpdating(false);
    }
  }, [productId, isFavorite, updating]);

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={updating}
      className="inline-flex items-center justify-center gap-2 px-4 py-3 sm:py-2.5 bg-slate-100 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-200 transition-colors min-h-[44px] w-full sm:w-auto disabled:opacity-50 disabled:pointer-events-none"
    >
      {updating ? (
        <Loader2 size={18} className="animate-spin" />
      ) : (
        <Heart
          size={18}
          className={isFavorite ? 'fill-red-500 text-red-500' : ''}
        />
      )}
      お気に入り
    </button>
  );
}
