'use client';

import { useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertCircle, Loader2 } from 'lucide-react';
import { ProductListControls, ProductListPagination } from './ProductListControls';
import { ProductGrid } from './ProductGrid';
import { SORT_KEYS, PAGE_SIZE } from '../../lib/productsList';
import type { ListItem, ProductsListResult } from '../../lib/productsList';

function buildListQueryString(params: Record<string, string | undefined>): string {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v != null && v !== '') sp.set(k, v);
  });
  const s = sp.toString();
  return s ? `?${s}` : '';
}

function paramsFromSearchParams(
  searchParams: URLSearchParams
): Record<string, string | undefined> {
  const get = (k: string) => searchParams.get(k) ?? undefined;
  return {
    sort: get('sort'),
    order: get('order'),
    page: get('page'),
    q: get('q'),
    brand_pokeca: get('brand_pokeca'),
    brand_onepiece: get('brand_onepiece'),
    favorite: get('favorite'),
    minProfit: get('minProfit'),
    minRoi: get('minRoi'),
    minPsa10: get('minPsa10'),
    maxPsa10: get('maxPsa10'),
    minBase: get('minBase'),
    maxBase: get('maxBase'),
    minYear: get('minYear'),
    maxYear: get('maxYear'),
    minPsa10Rate: get('minPsa10Rate'),
  };
}

export function ListPageContent() {
  const searchParams = useSearchParams();
  const [result, setResult] = useState<ProductsListResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const currentParams = paramsFromSearchParams(searchParams);
  const listQueryString = buildListQueryString(currentParams);

  const fetchList = useCallback(async (silent?: boolean) => {
    if (!silent) setLoading(true);
    setFetchError(null);
    try {
      const res = await fetch(`/api/products-list${listQueryString || '?'}`);
      if (!res.ok) {
        setResult(null);
        setFetchError(`HTTP ${res.status}`);
        return;
      }
      const data: ProductsListResult = await res.json();
      setResult(data);
    } catch (e) {
      setResult(null);
      setFetchError(e instanceof Error ? e.message : '取得に失敗しました');
    } finally {
      setLoading(false);
    }
  }, [listQueryString]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const totalCount = result?.totalCount ?? 0;
  const totalPages = result?.totalPages ?? 1;
  const pageRaw = currentParams.page ? parseInt(currentParams.page, 10) : 1;
  const safePage = Number.isNaN(pageRaw) || pageRaw < 1 ? 1 : Math.min(pageRaw, totalPages);
  const startItem = totalCount === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
  const endItem = Math.min(safePage * PAGE_SIZE, totalCount);
  const hasFilter =
    (currentParams.q && currentParams.q !== '') ||
    currentParams.brand_pokeca === '1' ||
    currentParams.brand_onepiece === '1' ||
    currentParams.favorite === '1' ||
    currentParams.minProfit != null ||
    currentParams.minRoi != null ||
    currentParams.minPsa10 != null ||
    currentParams.maxPsa10 != null ||
    currentParams.minBase != null ||
    currentParams.maxBase != null ||
    currentParams.minYear != null ||
    currentParams.maxYear != null ||
    currentParams.minPsa10Rate != null;

  if (loading && !result) {
    return (
      <div className="p-4 sm:p-6 md:p-8 max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">ポケカ・ワンピースカード一覧</h1>
          <p className="text-slate-500 mt-1 flex items-center gap-2">
            <Loader2 size={18} className="animate-spin text-blue-600 shrink-0" aria-hidden />
            <span className="font-medium text-slate-700">商品一覧と取引履歴を取得しています。しばらくお待ちください。</span>
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-lg border border-slate-200 overflow-hidden h-64 animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="p-4 sm:p-6 md:p-8 max-w-6xl mx-auto">
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
          <p className="font-semibold text-red-800">一覧の取得に失敗しました</p>
          <p className="text-sm text-red-700 mt-1">{fetchError}</p>
        </div>
      </div>
    );
  }

  const error = result?.error ?? null;
  const list = result?.list ?? [];

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-6xl mx-auto">
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
          <AlertCircle size={22} className="text-red-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-800">商品データの取得に失敗しました</p>
            <p className="text-sm text-red-700 mt-1 font-mono">
              {error.code ?? 'ERR'}: {error.message}
            </p>
            <Link
              href="/settings"
              className="inline-block mt-2 text-sm font-medium text-red-700 underline hover:no-underline"
            >
              設定 → データ接続診断 で原因を確認
            </Link>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
            ポケカ・ワンピースカード一覧
          </h1>
          <p className="text-slate-500 mt-1 flex items-center gap-2">
            {loading && (
              <>
                <Loader2 size={16} className="animate-spin text-blue-600 shrink-0" aria-hidden />
                <span className="text-blue-600 font-medium">表示を更新しています...</span>
              </>
            )}
            {!loading && (
              <>
                {totalCount > 0
                  ? `${startItem}-${endItem}件 / 全${totalCount}件`
                  : '0件'}
                {hasFilter && totalCount > 0 && (
                  <span className="ml-1">（絞り込み中）</span>
                )}
              </>
            )}
          </p>
        </div>
        <ProductListControls
          sortOptionsJson={JSON.stringify([...SORT_KEYS])}
          currentParamsJson={JSON.stringify(currentParams)}
          totalCount={totalCount}
          totalPages={totalPages}
          currentPage={safePage}
          pageSize={PAGE_SIZE}
        />
      </div>

      {!error && totalCount === 0 && hasFilter && (
        <div className="mb-6 p-5 bg-amber-50 border border-amber-200 rounded-xl">
          <p className="font-semibold text-amber-800">商品が 0 件です</p>
          <p className="text-sm text-amber-700 mt-1">
            条件に合う商品がありません。絞り込みを変えると表示される場合があります。
          </p>
          <Link
            href="/settings"
            className="inline-block mt-3 text-sm font-medium text-amber-800 underline hover:no-underline"
          >
            設定 → データ接続診断 で件数を確認
          </Link>
        </div>
      )}

      {!error && totalCount > 0 && list.length === 0 && (
        <div className="mb-6 p-5 bg-slate-50 border border-slate-200 rounded-xl">
          <p className="font-semibold text-slate-700">このページには表示する商品がありません</p>
          <p className="text-sm text-slate-600 mt-1">
            ページ番号を変更するか、絞り込み条件を変えてください。
          </p>
        </div>
      )}

      <div className={loading ? 'opacity-60 pointer-events-none transition-opacity' : ''}>
        <ProductGrid
          items={list}
          listQueryString={listQueryString}
          onItemUpdated={(opts) => fetchList(opts?.silent)}
        />
      </div>

      <ProductListPagination
        currentParamsJson={JSON.stringify(currentParams)}
        totalCount={totalCount}
        totalPages={totalPages}
        currentPage={safePage}
        pageSize={PAGE_SIZE}
      />
    </div>
  );
}
