'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useCallback } from 'react';
import { ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react';

type SortOption = { value: string; label: string };

type ProductListControlsProps = {
  sortOptionsJson: string;
  currentParamsJson: string;
  totalCount: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
};

function buildQuery(params: Record<string, string | undefined>): string {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v != null && v !== '') sp.set(k, v);
  });
  const q = sp.toString();
  return q ? `?${q}` : '';
}

type ProductListPaginationProps = {
  currentParamsJson: string;
  totalCount: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
};

export function ProductListPagination({
  currentParamsJson,
  totalCount,
  totalPages,
  currentPage,
  pageSize,
}: ProductListPaginationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const currentParams: Record<string, string | undefined> = currentParamsJson ? JSON.parse(currentParamsJson) : {};
  const updateParams = useCallback(
    (updates: Partial<Record<string, string | undefined>>) => {
      const next = { ...currentParams, ...updates };
      Object.keys(updates).forEach((k) => {
        const v = updates[k];
        if (v === undefined || v === '') delete next[k];
      });
      router.push(pathname + buildQuery(next));
    },
    [currentParams, pathname, router]
  );
  const startItem = totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalCount);
  if (totalPages <= 1) return null;
  return (
    <nav
      className="flex items-center justify-center gap-2 py-6"
      aria-label="ページネーション（下部）"
    >
      <span className="text-sm text-slate-600 mr-2">
        {startItem}-{endItem} / {totalCount}件
      </span>
      <button
        type="button"
        onClick={() =>
          updateParams({
            page: currentPage <= 2 ? undefined : String(currentPage - 1),
          })
        }
        disabled={currentPage <= 1}
        className="p-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed min-h-[40px] min-w-[40px] flex items-center justify-center"
        aria-label="前のページ"
      >
        <ChevronLeft size={20} />
      </button>
      <span className="px-2 text-sm text-slate-600">
        {currentPage} / {totalPages}
      </span>
      <button
        type="button"
        onClick={() =>
          updateParams({
            page:
              currentPage >= totalPages ? undefined : String(currentPage + 1),
          })
        }
        disabled={currentPage >= totalPages}
        className="p-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed min-h-[40px] min-w-[40px] flex items-center justify-center"
        aria-label="次のページ"
      >
        <ChevronRight size={20} />
      </button>
    </nav>
  );
}

export function ProductListControls({
  sortOptionsJson,
  currentParamsJson,
  totalCount,
  totalPages,
  currentPage,
  pageSize,
}: ProductListControlsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const sortOptions: SortOption[] = sortOptionsJson ? JSON.parse(sortOptionsJson) : [];
  const currentParams: Record<string, string | undefined> = currentParamsJson ? JSON.parse(currentParamsJson) : {};
  const currentSort = currentParams.sort ?? 'updated_at';
  const currentOrder = (currentParams.order === 'asc' ? 'asc' : 'desc') as 'asc' | 'desc';

  const updateParams = useCallback(
    (updates: Partial<Record<string, string | undefined>>) => {
      const next = { ...currentParams, ...updates };
      Object.keys(updates).forEach((k) => {
        const v = updates[k];
        if (v === undefined || v === '') delete next[k];
      });
      router.push(pathname + buildQuery(next));
    },
    [currentParams, pathname, router]
  );

  const startItem = totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalCount);

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-slate-500 flex items-center gap-1">
          <ArrowUpDown size={16} />
          並び替え
        </span>
        <select
          value={currentSort}
          onChange={(e) =>
            updateParams({ sort: e.target.value, page: undefined })
          }
          className="px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-700 bg-white min-h-[40px]"
          aria-label="並び替え項目"
        >
          {sortOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <select
          value={currentOrder}
          onChange={(e) =>
            updateParams({
              order: e.target.value as 'asc' | 'desc',
              page: undefined,
            })
          }
          className="px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-700 bg-white min-h-[40px]"
          aria-label="並び順"
        >
          <option value="desc">
            {currentSort === 'release_date' || currentSort === 'updated_at'
              ? '新しい順'
              : '高い順'}
          </option>
          <option value="asc">
            {currentSort === 'release_date' || currentSort === 'updated_at'
              ? '古い順'
              : '低い順'}
          </option>
        </select>
      </div>

      {totalPages > 1 && (
        <nav
          className="flex items-center gap-2"
          aria-label="ページネーション"
        >
          <span className="text-sm text-slate-600 mr-2">
            {startItem}-{endItem} / {totalCount}件
          </span>
          <button
            type="button"
            onClick={() =>
              updateParams({
                page: currentPage <= 2 ? undefined : String(currentPage - 1),
              })
            }
            disabled={currentPage <= 1}
            className="p-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed min-h-[40px] min-w-[40px] flex items-center justify-center"
            aria-label="前のページ"
          >
            <ChevronLeft size={20} />
          </button>
          <span className="px-2 text-sm text-slate-600">
            {currentPage} / {totalPages}
          </span>
          <button
            type="button"
            onClick={() =>
              updateParams({
                page: currentPage >= totalPages ? undefined : String(currentPage + 1),
              })
            }
            disabled={currentPage >= totalPages}
            className="p-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed min-h-[40px] min-w-[40px] flex items-center justify-center"
            aria-label="次のページ"
          >
            <ChevronRight size={20} />
          </button>
        </nav>
      )}
    </div>
  );
}
