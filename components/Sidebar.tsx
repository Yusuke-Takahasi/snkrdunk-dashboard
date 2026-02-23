'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  LayoutDashboard,
  Settings,
  Link2,
  Trash2,
  Filter,
  ChevronLeft,
  X,
} from 'lucide-react';
import { useState, useCallback, useEffect } from 'react';

type FilterFormState = {
  q: string;
  brand_pokeca: string;
  brand_onepiece: string;
  favorite: string;
  minProfit: string;
  minRoi: string;
  minPsa10: string;
  maxPsa10: string;
  minBase: string;
  maxBase: string;
  minYear: string;
  maxYear: string;
  minPsa10Rate: string;
};

function emptyFilterForm(): FilterFormState {
  return {
    q: '',
    brand_pokeca: '',
    brand_onepiece: '',
    favorite: '',
    minProfit: '',
    minRoi: '',
    minPsa10: '',
    maxPsa10: '',
    minBase: '',
    maxBase: '',
    minYear: '',
    maxYear: '',
    minPsa10Rate: '',
  };
}

const navItems = [
  { href: '/', label: '一覧', icon: LayoutDashboard },
  { href: '/settings', label: '設定', icon: Settings },
  { href: '/gemrate', label: 'Gem Rate紐付け', icon: Link2 },
];

function buildQuery(params: Record<string, string | undefined>): string {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v != null && v !== '') sp.set(k, v);
  });
  const q = sp.toString();
  return q ? `?${q}` : '';
}

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [clearing, setClearing] = useState(false);
  const isProductPage = pathname.startsWith('/products/');
  const isListPage = pathname === '/';

  const [filterForm, setFilterForm] = useState<FilterFormState>(emptyFilterForm);

  useEffect(() => {
    setFilterForm({
      q: searchParams.get('q') ?? '',
      brand_pokeca: searchParams.get('brand_pokeca') ?? '',
      brand_onepiece: searchParams.get('brand_onepiece') ?? '',
      favorite: searchParams.get('favorite') ?? '',
      minProfit: searchParams.get('minProfit') ?? '',
      minRoi: searchParams.get('minRoi') ?? '',
      minPsa10: searchParams.get('minPsa10') ?? '',
      maxPsa10: searchParams.get('maxPsa10') ?? '',
      minBase: searchParams.get('minBase') ?? '',
      maxBase: searchParams.get('maxBase') ?? '',
      minYear: searchParams.get('minYear') ?? '',
      maxYear: searchParams.get('maxYear') ?? '',
      minPsa10Rate: searchParams.get('minPsa10Rate') ?? '',
    });
  }, [searchParams]);

  const getParam = (key: string) => searchParams.get(key) ?? undefined;
  const currentParams = {
    sort: getParam('sort'),
    order: getParam('order'),
    page: getParam('page'),
    q: getParam('q'),
    brand_pokeca: getParam('brand_pokeca'),
    brand_onepiece: getParam('brand_onepiece'),
    favorite: getParam('favorite'),
    minProfit: getParam('minProfit'),
    minRoi: getParam('minRoi'),
    minPsa10: getParam('minPsa10'),
    maxPsa10: getParam('maxPsa10'),
    minBase: getParam('minBase'),
    maxBase: getParam('maxBase'),
    minYear: getParam('minYear'),
    maxYear: getParam('maxYear'),
    minPsa10Rate: getParam('minPsa10Rate'),
  };

  const paramKeys = [
    'sort', 'order', 'page', 'q', 'brand_pokeca', 'brand_onepiece', 'favorite',
    'minProfit', 'minRoi', 'minPsa10', 'maxPsa10', 'minBase', 'maxBase',
    'minYear', 'maxYear', 'minPsa10Rate',
  ] as const;
  const updateListParams = useCallback(
    (updates: Partial<typeof currentParams>) => {
      const cur: Record<string, string | undefined> = {};
      paramKeys.forEach((k) => {
        const v = searchParams.get(k);
        if (v != null && v !== '') cur[k] = v;
      });
      const next = { ...cur, ...updates };
      Object.keys(updates).forEach((k) => {
        const v = updates[k as keyof typeof updates];
        if (v === undefined || v === '') delete next[k];
      });
      router.push('/' + buildQuery(next));
    },
    [searchParams, router]
  );

  const hasFilter = Object.entries(currentParams).some(
    ([k, v]) =>
      k !== 'sort' && k !== 'order' && k !== 'page' && v != null && v !== ''
  );

  const applyFilter = useCallback(() => {
    updateListParams({
      q: filterForm.q === '' ? undefined : filterForm.q,
      brand_pokeca: filterForm.brand_pokeca === '' ? undefined : filterForm.brand_pokeca,
      brand_onepiece: filterForm.brand_onepiece === '' ? undefined : filterForm.brand_onepiece,
      favorite: filterForm.favorite === '' ? undefined : filterForm.favorite,
      minProfit: filterForm.minProfit === '' ? undefined : filterForm.minProfit,
      minRoi: filterForm.minRoi === '' ? undefined : filterForm.minRoi,
      minPsa10: filterForm.minPsa10 === '' ? undefined : filterForm.minPsa10,
      maxPsa10: filterForm.maxPsa10 === '' ? undefined : filterForm.maxPsa10,
      minBase: filterForm.minBase === '' ? undefined : filterForm.minBase,
      maxBase: filterForm.maxBase === '' ? undefined : filterForm.maxBase,
      minYear: filterForm.minYear === '' ? undefined : filterForm.minYear,
      maxYear: filterForm.maxYear === '' ? undefined : filterForm.maxYear,
      minPsa10Rate: filterForm.minPsa10Rate === '' ? undefined : filterForm.minPsa10Rate,
      page: undefined,
    });
  }, [filterForm, updateListParams]);

  const clearFilter = useCallback(() => {
    setFilterForm(emptyFilterForm());
    updateListParams({
      q: undefined,
      brand_pokeca: undefined,
      brand_onepiece: undefined,
      favorite: undefined,
      minProfit: undefined,
      minRoi: undefined,
      minPsa10: undefined,
      maxPsa10: undefined,
      minBase: undefined,
      maxBase: undefined,
      minYear: undefined,
      maxYear: undefined,
      minPsa10Rate: undefined,
      page: undefined,
    });
  }, [updateListParams]);

  const handleCacheClear = () => {
    setClearing(true);
    router.refresh();
    setTimeout(() => setClearing(false), 800);
  };

  return (
    <aside className="w-56 min-h-screen bg-slate-50 border-r border-slate-200 flex flex-col shrink-0">
      <div className="px-2 pt-2 pb-0 bg-slate-50">
        <Link href="/" className="block">
          <Image
            src="/logo.png"
            alt="ロゴ"
            width={320}
            height={96}
            className="w-auto"
            style={{ height: '80px', width: 'auto' }}
          />
        </Link>
      </div>

      <nav className="flex-1 pt-0 px-3 pb-3 space-y-0.5">
        {isProductPage && (
          <Link
            href={
              (() => {
                const rt = searchParams.get('returnTo');
                return rt
                  ? rt.startsWith('?')
                    ? `/${rt}`
                    : `/?${rt}`
                  : '/';
              })()
            }
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-700 hover:bg-slate-100 font-medium transition-colors min-h-[44px]"
          >
            <ChevronLeft size={20} className="shrink-0" />
            一覧に戻る
          </Link>
        )}
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive =
            href === '/' ? pathname === '/' : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors min-h-[44px] ${
                isActive
                  ? 'bg-blue-100 text-blue-800'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Icon size={20} className="shrink-0" />
              {label}
            </Link>
          );
        })}

        {isListPage && (
          <div className="pt-4 mt-2 border-t border-slate-200">
            <div className="flex items-center gap-2 px-4 py-2">
              <Filter size={18} className="text-slate-500 shrink-0" />
              <span className="text-sm font-semibold text-slate-700">
                絞り込み
              </span>
              {hasFilter && (
                <span
                  className="w-2 h-2 rounded-full bg-blue-500 shrink-0"
                  aria-hidden
                />
              )}
            </div>
            <div className="space-y-3 px-2 pt-2 max-h-[70vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  商品名で検索
                </label>
                <input
                  type="search"
                  placeholder="部分一致"
                  value={filterForm.q}
                  onChange={(e) =>
                    setFilterForm((prev) => ({ ...prev, q: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>
              <div className="flex flex-wrap gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filterForm.brand_pokeca === '1'}
                    onChange={(e) =>
                      setFilterForm((prev) => ({
                        ...prev,
                        brand_pokeca: e.target.checked ? '1' : '',
                      }))
                    }
                    className="rounded border-slate-300 text-blue-600"
                  />
                  <span className="text-sm text-slate-700">ポケカ</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filterForm.brand_onepiece === '1'}
                    onChange={(e) =>
                      setFilterForm((prev) => ({
                        ...prev,
                        brand_onepiece: e.target.checked ? '1' : '',
                      }))
                    }
                    className="rounded border-slate-300 text-blue-600"
                  />
                  <span className="text-sm text-slate-700">ワンピース</span>
                </label>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filterForm.favorite === '1'}
                  onChange={(e) =>
                    setFilterForm((prev) => ({
                      ...prev,
                      favorite: e.target.checked ? '1' : '',
                    }))
                  }
                  className="rounded border-slate-300 text-blue-600"
                />
                <span className="text-sm text-slate-700">お気に入りのみ</span>
              </label>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  予想利益（円）以上
                </label>
                <input
                  type="number"
                  min={0}
                  step={1000}
                  placeholder="例: 3000"
                  value={filterForm.minProfit}
                  onChange={(e) =>
                    setFilterForm((prev) => ({
                      ...prev,
                      minProfit: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  ROI下限（%）
                </label>
                <input
                  type="number"
                  min={0}
                  step={5}
                  placeholder="例: 20"
                  value={filterForm.minRoi}
                  onChange={(e) =>
                    setFilterForm((prev) => ({ ...prev, minRoi: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  PSA10下限
                </label>
                <input
                  type="number"
                  min={0}
                  step={100}
                  placeholder="円"
                  value={filterForm.minPsa10}
                  onChange={(e) =>
                    setFilterForm((prev) => ({
                      ...prev,
                      minPsa10: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  PSA10上限
                </label>
                <input
                  type="number"
                  min={0}
                  step={100}
                  placeholder="円"
                  value={filterForm.maxPsa10}
                  onChange={(e) =>
                    setFilterForm((prev) => ({
                      ...prev,
                      maxPsa10: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  素体下限(A)
                </label>
                <input
                  type="number"
                  min={0}
                  step={100}
                  placeholder="円"
                  value={filterForm.minBase}
                  onChange={(e) =>
                    setFilterForm((prev) => ({
                      ...prev,
                      minBase: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  素体上限(A)
                </label>
                <input
                  type="number"
                  min={0}
                  step={100}
                  placeholder="円"
                  value={filterForm.maxBase}
                  onChange={(e) =>
                    setFilterForm((prev) => ({
                      ...prev,
                      maxBase: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  発売年下限
                </label>
                <input
                  type="number"
                  min={1900}
                  max={2100}
                  placeholder="例: 2024"
                  value={filterForm.minYear}
                  onChange={(e) =>
                    setFilterForm((prev) => ({
                      ...prev,
                      minYear: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  発売年上限
                </label>
                <input
                  type="number"
                  min={1900}
                  max={2100}
                  placeholder="例: 2025"
                  value={filterForm.maxYear}
                  onChange={(e) =>
                    setFilterForm((prev) => ({
                      ...prev,
                      maxYear: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  PSA10取得率下限
                </label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  step={5}
                  placeholder="%"
                  value={filterForm.minPsa10Rate}
                  onChange={(e) =>
                    setFilterForm((prev) => ({
                      ...prev,
                      minPsa10Rate: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={applyFilter}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                >
                  <Filter size={14} />
                  絞り込む
                </button>
                {hasFilter && (
                  <button
                    type="button"
                    onClick={clearFilter}
                    className="flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900"
                  >
                    <X size={14} />
                    条件をクリア
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>

      <div className="p-3 border-t border-slate-200 space-y-0.5">
        <button
          type="button"
          onClick={handleCacheClear}
          disabled={clearing}
          className="w-full flex items-center gap-3 px-4 py-3 text-slate-600 hover:bg-amber-50 hover:text-amber-800 rounded-lg font-medium transition-colors disabled:opacity-60 min-h-[44px] text-left"
          title="最新データを再取得"
        >
          <Trash2 size={20} className="shrink-0" />
          {clearing ? '更新中...' : 'キャッシュ削除'}
        </button>
      </div>
    </aside>
  );
}
