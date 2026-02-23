'use client';

import Link from 'next/link';
import { Heart, EyeOff, ExternalLink } from 'lucide-react';
import { formatReleaseDate } from '../../utils/formatReleaseDate';
import type { ListItem } from '../../lib/productsList';

export function ProductGrid({
  items,
  listQueryString,
}: {
  items: ListItem[];
  listQueryString: string;
}) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
      {items.map(({ item, stats }) => {
        const isHighProfit = stats.expectedProfit > 3000;
        const displayName =
          (item.name_jp || item.card_description || item.product_code || item.id || '').trim() ||
          '（商品名なし）';

        return (
          <article
            key={item.id}
            className="bg-white rounded-lg border border-slate-200 overflow-hidden hover:shadow-md transition-shadow flex flex-col min-w-0"
          >
            <Link
              href={`/products/${item.id}${listQueryString ? `?returnTo=${encodeURIComponent(listQueryString)}` : ''}`}
              className="block flex-1 flex flex-col min-w-0"
              prefetch={false}
            >
              <div className="aspect-square w-full bg-slate-100 relative overflow-hidden shrink-0">
                {item.image_url ? (
                  <img
                    src={item.image_url}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div
                    className="w-full h-full flex items-center justify-center text-slate-300 text-2xl"
                    aria-hidden
                  >
                    📦
                  </div>
                )}
              </div>
              <div className="p-3 flex-1 flex flex-col min-w-0">
                <h2 className="font-bold text-slate-900 leading-tight line-clamp-2 hover:text-blue-600 transition-colors text-xs sm:text-sm break-words min-h-[2rem]">
                  {displayName}
                </h2>
                <dl className="mt-2 pt-2 border-t border-slate-100 space-y-1.5 flex-shrink-0">
                  <div className="flex justify-between items-baseline gap-2">
                    <dt className="text-[10px] text-slate-500 shrink-0 whitespace-nowrap">予想利益</dt>
                    <dd
                      className={`text-sm font-bold tabular-nums text-right shrink-0 ${
                        isHighProfit ? 'text-emerald-600' : 'text-slate-900'
                      }`}
                    >
                      {stats.expectedProfit !== 0 ? `¥${stats.expectedProfit.toLocaleString()}` : '—'}
                    </dd>
                  </div>
                  <div className="flex justify-between items-baseline gap-2">
                    <dt className="text-[10px] text-slate-500 shrink-0 whitespace-nowrap">ROI</dt>
                    <dd className="text-xs font-semibold text-slate-700 tabular-nums text-right shrink-0">
                      {stats.roi !== 0 ? `${stats.roi}%` : '—'}
                    </dd>
                  </div>
                  <div className="flex justify-between items-baseline gap-2">
                    <dt className="text-[10px] text-slate-500 shrink-0 whitespace-nowrap">PSA10相場</dt>
                    <dd className="text-xs font-medium text-slate-700 tabular-nums text-right shrink-0">
                      {stats.latestPsa10 > 0 ? `¥${stats.latestPsa10.toLocaleString()}` : '—'}
                    </dd>
                  </div>
                  <div className="flex justify-between items-baseline gap-2">
                    <dt className="text-[10px] text-slate-500 shrink-0 whitespace-nowrap" title="Gemrate鑑定データ">
                      PSA10取得率
                    </dt>
                    <dd
                      className="text-xs font-medium tabular-nums text-right shrink-0"
                      title={stats.psa10Rate != null ? undefined : 'Gemrateに未紐付け'}
                    >
                      {stats.psa10Rate != null ? (
                        <span className="text-slate-700">{stats.psa10Rate}%</span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </dd>
                  </div>
                  <div className="flex justify-between items-baseline gap-2">
                    <dt className="text-[10px] text-slate-500 shrink-0 whitespace-nowrap">値動き</dt>
                    <dd
                      className={`text-xs font-medium tabular-nums text-right shrink-0 ${
                        stats.recentTrend != null
                          ? stats.recentTrend >= 0
                            ? 'text-emerald-600'
                            : 'text-red-600'
                          : 'text-slate-500'
                      }`}
                    >
                      {stats.recentTrend != null
                        ? `${stats.recentTrend >= 0 ? '+' : ''}${stats.recentTrend}%`
                        : '—'}
                    </dd>
                  </div>
                  <div className="flex justify-between items-baseline gap-2">
                    <dt className="text-[10px] text-slate-500 shrink-0 whitespace-nowrap">発売日</dt>
                    <dd className="text-xs text-slate-700 text-right shrink-0">
                      {formatReleaseDate(item.release_date)}
                    </dd>
                  </div>
                </dl>
              </div>
            </Link>
            <div className="p-2 border-t border-slate-100 flex items-center justify-between gap-1 bg-slate-50/50 shrink-0">
              <div className="flex gap-0.5 shrink-0">
                <button
                  type="button"
                  className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
                  title="お気に入り"
                >
                  <Heart size={16} />
                </button>
                <button
                  type="button"
                  className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
                  title="非表示"
                >
                  <EyeOff size={16} />
                </button>
              </div>
              <Link
                href={`/products/${item.id}${listQueryString ? `?returnTo=${encodeURIComponent(listQueryString)}` : ''}`}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded hover:bg-blue-700 transition-colors min-h-[36px] shrink-0"
                prefetch={false}
              >
                詳細
                <ExternalLink size={12} />
              </Link>
            </div>
          </article>
        );
      })}
    </div>
  );
}
