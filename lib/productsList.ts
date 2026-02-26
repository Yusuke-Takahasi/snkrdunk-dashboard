import { supabase } from '../utils/supabase';
import {
  parseReleaseDateToTime,
  parseReleaseDateToYear,
} from '../utils/formatReleaseDate';
import { buildSeriesName } from '../utils/gemrateParse';
import { matchProductsToGemrateStats } from '../utils/gemrateMatch';
import type { GemrateStatsRow } from '../utils/gemrateMatch';
import { isPsa10, isStateA } from '../utils/condition';
import { resolveTradeDate } from '../utils/tradeDateUtils';
import { filterPriceOutliers } from '../utils/outlierFilter';
import type { FeeSettings } from '../utils/appSettings';

const DEFAULT_GRADING_FEE = 3300;
const DEFAULT_SELLING_FEE_RATE = 0.1; // 10%
const LIQUIDITY_DAYS = 30;
const LIQUIDITY_S = 20;
const LIQUIDITY_A = 10;
const LIQUIDITY_B = 5;

export const PAGE_SIZE = 25;
const HISTORIES_PER_PRODUCT = 100;
const HISTORY_SINGLE_QUERY_LIMIT = 18000;

export const SORT_KEYS = [
  { value: 'expectedProfit', label: '予想利益' },
  { value: 'roi', label: 'ROI' },
  { value: 'latestPsa10', label: 'PSA10 最新' },
  { value: 'psa10Rate', label: 'PSA10取得率' },
  { value: 'release_date', label: '発売日' },
  { value: 'recentTrend', label: '値動き' },
  { value: 'updated_at', label: '更新日' },
] as const;

export type SortKey = (typeof SORT_KEYS)[number]['value'];
const DB_SORT_KEYS: SortKey[] = ['updated_at', 'release_date'];

export type ProductRow = {
  id: string;
  name_jp?: string | null;
  brand?: string | null;
  category?: string | null;
  release_date?: string | null;
  product_code?: string | null;
  image_url?: string | null;
  is_target?: boolean | null;
  is_favorite?: boolean | null;
  is_blacklisted?: boolean | null;
  card_description?: string | null;
  gemrate_series_name?: string | null;
  updated_at?: string | null;
};

type HistoryRow = {
  product_id: string;
  condition?: string | null;
  price?: number | null;
  trade_date?: string | null;
  scraped_at?: string | null;
};

export type Stats = {
  expectedProfit: number;
  roi: number;
  liquidity: 'S' | 'A' | 'B' | 'C';
  latestPsa10: number;
  latestBase: number;
  psa10Rate: number | null;
  recentTrend: number | null;
};

export type ProductsListParams = {
  sort: SortKey;
  order: 'asc' | 'desc';
  page: number;
  q?: string;
  brandPokeca?: boolean;
  brandOnepiece?: boolean;
  favoriteOnly?: boolean;
  /** 手数料計算に使う販売先。未設定時はメルカリ */
  salesDestination?: 'mercari' | 'snkrdunk';
  /** true のとき非表示（is_blacklisted）商品も一覧に含める */
  includeBlacklisted?: boolean;
  minProfit?: number;
  minRoi?: number;
  minPsa10?: number;
  maxPsa10?: number;
  minBase?: number;
  maxBase?: number;
  minYear?: number;
  maxYear?: number;
  minPsa10Rate?: number;
};

export type ListItem = { item: ProductRow; stats: Stats };

export type ProductsListResult = {
  list: ListItem[];
  totalCount: number;
  totalPages: number;
  error: { code?: string; message: string } | null;
};

function getLiquidityRank(count: number): 'S' | 'A' | 'B' | 'C' {
  if (count >= LIQUIDITY_S) return 'S';
  if (count >= LIQUIDITY_A) return 'A';
  if (count >= LIQUIDITY_B) return 'B';
  return 'C';
}

/** 取引日（resolveTradeDate）で降順ソートし、先頭を「最新」とする */
function sortByTradeDateDesc(list: HistoryRow[]): HistoryRow[] {
  return [...list].sort((a, b) => {
    const ta = resolveTradeDate(a.trade_date, a.scraped_at)?.getTime() ?? 0;
    const tb = resolveTradeDate(b.trade_date, b.scraped_at)?.getTime() ?? 0;
    return tb - ta;
  });
}

/**
 * trade_histories を 1 クエリで取得し、指定 id 群の履歴を返す。
 * 結果は scraped_at 降順。computeStatsForIds にそのまま渡せる。
 */
async function fetchTradeHistoriesForIds(ids: string[]): Promise<HistoryRow[]> {
  if (ids.length === 0) return [];
  const limit = Math.min(
    ids.length * HISTORIES_PER_PRODUCT,
    HISTORY_SINGLE_QUERY_LIMIT
  );
  const { data } = await supabase
    .from('trade_histories')
    .select('product_id, condition, price, trade_date, scraped_at')
    .in('product_id', ids)
    .order('scraped_at', { ascending: false })
    .limit(limit);
  return (data ?? []) as HistoryRow[];
}

const GEMRATE_SERIES_CHUNK_SIZE = 100;

/**
 * gemrate_stats を series_name リストで 1 クエリ（またはチャンクで数クエリ）取得する。
 */
async function fetchGemrateStatsBySeriesNames(
  seriesNames: Set<string>
): Promise<GemrateStatsRow[]> {
  const arr = Array.from(seriesNames);
  if (arr.length === 0) return [];
  const rows: GemrateStatsRow[] = [];
  for (let i = 0; i < arr.length; i += GEMRATE_SERIES_CHUNK_SIZE) {
    const chunk = arr.slice(i, i + GEMRATE_SERIES_CHUNK_SIZE);
    const { data } = await supabase
      .from('gemrate_stats')
      .select('series_name, card_number, card_description, gem_rate')
      .in('series_name', chunk);
    rows.push(...((data ?? []) as GemrateStatsRow[]));
  }
  return rows;
}

function computeStatsForIds(
  ids: string[],
  histories: HistoryRow[],
  gradingFee: number,
  cutoffMs: number,
  sellingFeeRate: number
): Map<string, Stats> {
  const statsByProduct = new Map<string, Stats>();
  for (const id of ids) {
    const productHistories = histories.filter((h) => h.product_id === id);
    const psa10 = productHistories.filter((h) => isPsa10(h.condition));
    const base = productHistories.filter((h) => isStateA(h.condition));
    const psa10ByTradeDate = sortByTradeDateDesc(psa10);
    const baseByTradeDate = sortByTradeDateDesc(base);
    const psa10Filtered = filterPriceOutliers(psa10ByTradeDate);
    const baseFiltered = filterPriceOutliers(baseByTradeDate);
    const latestPsa10 = psa10Filtered.length > 0 ? Number(psa10Filtered[0].price) : 0;
    const latestBase = baseFiltered.length > 0 ? Number(baseFiltered[0].price) : 0;
    const cost = latestBase + gradingFee;
    const expectedProfit =
      latestPsa10 > 0 && latestBase > 0
        ? Math.floor(latestPsa10 * (1 - sellingFeeRate) - latestBase - gradingFee)
        : 0;
    const roi = cost > 0 ? Math.round((expectedProfit / cost) * 100) : 0;
    const recentCount = productHistories.filter(
      (h) => new Date(h.trade_date ?? 0).getTime() >= cutoffMs
    ).length;
    const liquidity = getLiquidityRank(recentCount);
    const psa10Rate: number | null = null;
    let recentTrend: number | null = null;
    if (psa10Filtered.length >= 2 && psa10Filtered[0].price != null && psa10Filtered[1].price != null) {
      const prev = Number(psa10Filtered[1].price);
      if (prev > 0) {
        recentTrend = Math.round(
          ((Number(psa10Filtered[0].price) - prev) / prev) * 100
        );
      }
    }
    statsByProduct.set(id, {
      expectedProfit,
      roi,
      liquidity,
      latestPsa10,
      latestBase,
      psa10Rate,
      recentTrend,
    });
  }
  return statsByProduct;
}

const defaultStats: Stats = {
  expectedProfit: 0,
  roi: 0,
  liquidity: 'C',
  latestPsa10: 0,
  latestBase: 0,
  psa10Rate: null,
  recentTrend: null,
};

function toSerializableListItem(
  item: ProductRow,
  stats: Stats
): ListItem {
  return {
    item: {
      id: item.id,
      name_jp: item.name_jp ?? null,
      brand: item.brand ?? null,
      category: item.category ?? null,
      release_date: item.release_date ?? null,
      product_code: item.product_code ?? null,
      image_url: item.image_url ?? null,
      is_target: item.is_target ?? null,
      is_favorite: item.is_favorite ?? null,
      is_blacklisted: item.is_blacklisted ?? null,
      card_description: item.card_description ?? null,
      updated_at: item.updated_at ?? null,
    },
    stats: {
      expectedProfit: stats.expectedProfit,
      roi: stats.roi,
      liquidity: stats.liquidity,
      latestPsa10: stats.latestPsa10,
      latestBase: stats.latestBase,
      psa10Rate: stats.psa10Rate,
      recentTrend: stats.recentTrend,
    },
  };
}

function sortStackSafe<T>(
  arr: T[],
  compare: (a: T, b: T) => number
): void {
  const n = arr.length;
  if (n <= 1) return;
  const work: T[] = new Array(n);
  for (let size = 1; size < n; size *= 2) {
    for (let left = 0; left < n; left += 2 * size) {
      const mid = Math.min(left + size, n);
      const right = Math.min(left + 2 * size, n);
      let i = left;
      let j = mid;
      let k = left;
      while (i < mid && j < right) {
        if (compare(arr[i], arr[j]) <= 0) {
          work[k++] = arr[i++];
        } else {
          work[k++] = arr[j++];
        }
      }
      while (i < mid) work[k++] = arr[i++];
      while (j < right) work[k++] = arr[j++];
      for (let p = left; p < right; p++) arr[p] = work[p];
    }
  }
}

export type GetProductsListOptions = {
  feeSettings?: FeeSettings | null;
};

export async function getProductsList(
  params: ProductsListParams,
  options?: GetProductsListOptions
): Promise<ProductsListResult> {
  const {
    sort,
    order,
    page,
    q,
    brandPokeca,
    brandOnepiece,
    favoriteOnly,
    salesDestination,
    includeBlacklisted,
    minProfit,
    minRoi,
    minPsa10,
    maxPsa10,
    minBase,
    maxBase,
    minYear,
    maxYear,
    minPsa10Rate,
  } = params;

  const feeSettings = options?.feeSettings ?? null;
  const gradingFee =
    feeSettings != null ? feeSettings.psaValue : DEFAULT_GRADING_FEE;
  const sellingFeeRate =
    feeSettings != null
      ? (salesDestination === 'snkrdunk'
          ? feeSettings.snkrdunkFeePercent / 100
          : feeSettings.mercariFeePercent / 100)
      : DEFAULT_SELLING_FEE_RATE;

  const now = Date.now();
  const cutoffMs = now - LIQUIDITY_DAYS * 24 * 60 * 60 * 1000;

  const hasComputedFilter =
    minProfit != null ||
    minRoi != null ||
    minPsa10 != null ||
    maxPsa10 != null ||
    minBase != null ||
    maxBase != null ||
    minYear != null ||
    maxYear != null ||
    minPsa10Rate != null;
  const useDbSort =
    DB_SORT_KEYS.includes(sort) && !hasComputedFilter && !q;

  let list: ListItem[] = [];
  let totalCount = 0;
  let error: { code?: string; message: string } | null = null;

  const baseQuery = supabase
    .from('products')
    .select('*')
    .eq('is_target', true);
  let queryWithFavorite = favoriteOnly
    ? baseQuery.eq('is_favorite', true)
    : baseQuery;
  if (brandPokeca && brandOnepiece) {
    queryWithFavorite = queryWithFavorite.or(
      'brand.ilike.%ポケカ%,brand.ilike.%ワンピース%'
    );
  } else if (brandPokeca) {
    queryWithFavorite = queryWithFavorite.ilike('brand', '%ポケカ%');
  } else if (brandOnepiece) {
    queryWithFavorite = queryWithFavorite.ilike('brand', '%ワンピース%');
  }

  if (useDbSort) {
    const { data: productsRaw, error: err } = await queryWithFavorite
      .select('*')
      .order(sort, { ascending: order === 'asc', nullsFirst: false });
    if (err) {
      error = err;
      console.error('Supabase通信エラー:', err.code, err.message);
      return { list: [], totalCount: 0, totalPages: 1, error };
    }
    const allProducts = (productsRaw ?? []).filter(
      (p: ProductRow) => includeBlacklisted === true || p.is_blacklisted !== true
    ) as ProductRow[];
    totalCount = allProducts.length;
    const products = allProducts.slice(
      (page - 1) * PAGE_SIZE,
      page * PAGE_SIZE
    );
    const ids = products.map((p) => p.id);
    const histories = await fetchTradeHistoriesForIds(ids);
    const statsByProduct = computeStatsForIds(
      ids,
      histories,
      gradingFee,
      cutoffMs,
      sellingFeeRate
    );
    const seriesNamesForFetch = new Set<string>();
    for (const p of products) {
      const s = p.gemrate_series_name?.trim() || buildSeriesName(p.name_jp, p.release_date);
      if (s) {
        seriesNamesForFetch.add(s);
        seriesNamesForFetch.add(s.replace(/\|/g, '\uFF5C'));
      }
    }
    const gemrateRows: GemrateStatsRow[] =
      await fetchGemrateStatsBySeriesNames(seriesNamesForFetch);
    const gemrateByProduct = matchProductsToGemrateStats(
      products.map((p) => ({
        id: p.id,
        name_jp: p.name_jp,
        release_date: p.release_date,
        card_description: p.card_description,
        gemrate_series_name: p.gemrate_series_name,
      })),
      gemrateRows
    );
    for (const [productId, stats] of statsByProduct) {
      const g = gemrateByProduct.get(productId);
      stats.psa10Rate = g != null ? Math.round(g.gem_rate) : null;
    }
    list = products.map((item) =>
      toSerializableListItem(item, statsByProduct.get(item.id) ?? defaultStats)
    );
  } else {
    const { data: productsRaw, error: err } = await queryWithFavorite.select(
      '*'
    );
    if (err) {
      error = err;
      console.error('Supabase通信エラー:', err.code, err.message);
      return { list: [], totalCount: 0, totalPages: 1, error };
    }
    const products = (productsRaw ?? []).filter(
      (p: ProductRow) => includeBlacklisted === true || p.is_blacklisted !== true
    ) as ProductRow[];
    const ids = products.map((p) => p.id);
    const histories = await fetchTradeHistoriesForIds(ids);
    const statsByProduct = computeStatsForIds(
      ids,
      histories,
      gradingFee,
      cutoffMs,
      sellingFeeRate
    );
    const seriesNamesForFetchElse = new Set<string>();
    for (const p of products) {
      const s = p.gemrate_series_name?.trim() || buildSeriesName(p.name_jp, p.release_date);
      if (s) {
        seriesNamesForFetchElse.add(s);
        seriesNamesForFetchElse.add(s.replace(/\|/g, '\uFF5C'));
      }
    }
    const gemrateRowsElse: GemrateStatsRow[] =
      await fetchGemrateStatsBySeriesNames(seriesNamesForFetchElse);
    const gemrateByProduct = matchProductsToGemrateStats(
      products.map((p) => ({
        id: p.id,
        name_jp: p.name_jp,
        release_date: p.release_date,
        card_description: p.card_description,
        gemrate_series_name: p.gemrate_series_name,
      })),
      gemrateRowsElse
    );
    for (const [productId, stats] of statsByProduct) {
      const g = gemrateByProduct.get(productId);
      stats.psa10Rate = g != null ? Math.round(g.gem_rate) : null;
    }
    type ItemWithStats = { item: ProductRow; stats: Stats };
    const defaultStatsCopy = { ...defaultStats };
    let fullList: ItemWithStats[] = products.map((item) => {
      const s = statsByProduct.get(item.id) ?? defaultStatsCopy;
      return { item, stats: { ...s } };
    });
    if (q) {
      const qLower = q.toLowerCase();
      fullList = fullList.filter(({ item }) => {
        const s = [
          item.name_jp,
          item.card_description,
          item.product_code,
        ]
          .filter(Boolean)
          .join(' ');
        return s.toLowerCase().includes(qLower);
      });
    }
    fullList = fullList.filter(({ item, stats }) => {
      if (minProfit != null && !Number.isNaN(minProfit) && stats.expectedProfit < minProfit)
        return false;
      if (minRoi != null && !Number.isNaN(minRoi) && stats.roi < minRoi) return false;
      if (minPsa10 != null && !Number.isNaN(minPsa10) && stats.latestPsa10 < minPsa10)
        return false;
      if (maxPsa10 != null && !Number.isNaN(maxPsa10) && stats.latestPsa10 > maxPsa10)
        return false;
      if (minBase != null && !Number.isNaN(minBase) && stats.latestBase < minBase)
        return false;
      if (maxBase != null && !Number.isNaN(maxBase) && stats.latestBase > maxBase)
        return false;
      const year = parseReleaseDateToYear(item.release_date);
      if (minYear != null && !Number.isNaN(minYear) && (year == null || year < minYear))
        return false;
      if (maxYear != null && !Number.isNaN(maxYear) && (year == null || year > maxYear))
        return false;
      if (
        minPsa10Rate != null &&
        !Number.isNaN(minPsa10Rate) &&
        (stats.psa10Rate == null || stats.psa10Rate < minPsa10Rate)
      )
        return false;
      return true;
    });
    const compare = (a: ItemWithStats, b: ItemWithStats): number => {
      let va: number | string;
      let vb: number | string;
      switch (sort) {
        case 'expectedProfit':
          va = a.stats.expectedProfit;
          vb = b.stats.expectedProfit;
          break;
        case 'roi':
          va = a.stats.roi;
          vb = b.stats.roi;
          break;
        case 'latestPsa10':
          va = a.stats.latestPsa10;
          vb = b.stats.latestPsa10;
          break;
        case 'release_date':
          va = parseReleaseDateToTime(a.item.release_date);
          vb = parseReleaseDateToTime(b.item.release_date);
          break;
        case 'recentTrend':
          va = a.stats.recentTrend ?? -Infinity;
          vb = b.stats.recentTrend ?? -Infinity;
          break;
        case 'psa10Rate':
          va = a.stats.psa10Rate ?? -Infinity;
          vb = b.stats.psa10Rate ?? -Infinity;
          break;
        case 'updated_at':
        default:
          va = a.item.updated_at ?? '';
          vb = b.item.updated_at ?? '';
          break;
      }
      if (typeof va === 'number' && typeof vb === 'number') {
        return order === 'asc' ? va - vb : vb - va;
      }
      const sa = String(va);
      const sb = String(vb);
      return order === 'asc' ? sa.localeCompare(sb) : sb.localeCompare(sa);
    };
    sortStackSafe(fullList, compare);
    totalCount = fullList.length;
    const slice = fullList.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
    const pageIds = slice.map(({ item }) => item.id);
    if (pageIds.length > 0) {
      const pageHistories = await fetchTradeHistoriesForIds(pageIds);
      const pageStatsByProduct = computeStatsForIds(
        pageIds,
        pageHistories,
        gradingFee,
        cutoffMs,
        sellingFeeRate
      );
      for (const [productId, stats] of pageStatsByProduct) {
        const g = gemrateByProduct.get(productId);
        stats.psa10Rate = g != null ? Math.round(g.gem_rate) : null;
      }
      const pageItemsWithNewStats: ItemWithStats[] = slice.map(({ item }) => ({
        item,
        stats: pageStatsByProduct.get(item.id) ?? defaultStats,
      }));
      sortStackSafe(pageItemsWithNewStats, compare);
      list = pageItemsWithNewStats.map(({ item, stats }) =>
        toSerializableListItem(item, stats)
      );
    } else {
      list = slice.map(({ item, stats }) => toSerializableListItem(item, stats));
    }
  }

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  if (safePage !== page) {
    list = [];
  }

  return { list, totalCount, totalPages, error };
}

export function parseListParams(
  searchParams: { [key: string]: string | string[] | undefined }
): ProductsListParams {
  const sortRaw = typeof searchParams?.sort === 'string' ? searchParams.sort : 'updated_at';
  const sort = SORT_KEYS.some((o) => o.value === sortRaw) ? (sortRaw as SortKey) : 'updated_at';
  const order = searchParams?.order === 'asc' ? 'asc' : 'desc';
  const pageRaw = typeof searchParams?.page === 'string' ? parseInt(searchParams.page, 10) : 1;
  const page = Number.isNaN(pageRaw) || pageRaw < 1 ? 1 : pageRaw;
  return {
    sort,
    order,
    page,
    q: typeof searchParams?.q === 'string' ? searchParams.q.trim() : undefined,
    brandPokeca: searchParams?.brand_pokeca === '1',
    brandOnepiece: searchParams?.brand_onepiece === '1',
    favoriteOnly: searchParams?.favorite === '1',
    salesDestination:
      searchParams?.sales_destination === 'snkrdunk'
        ? 'snkrdunk'
        : searchParams?.sales_destination === 'mercari'
          ? 'mercari'
          : undefined,
    includeBlacklisted: searchParams?.include_blacklisted === '1',
    minProfit:
      typeof searchParams?.minProfit === 'string' && searchParams.minProfit !== ''
        ? parseInt(searchParams.minProfit, 10)
        : undefined,
    minRoi:
      typeof searchParams?.minRoi === 'string' && searchParams.minRoi !== ''
        ? parseInt(searchParams.minRoi, 10)
        : undefined,
    minPsa10:
      typeof searchParams?.minPsa10 === 'string' && searchParams.minPsa10 !== ''
        ? parseInt(searchParams.minPsa10, 10)
        : undefined,
    maxPsa10:
      typeof searchParams?.maxPsa10 === 'string' && searchParams.maxPsa10 !== ''
        ? parseInt(searchParams.maxPsa10, 10)
        : undefined,
    minBase:
      typeof searchParams?.minBase === 'string' && searchParams.minBase !== ''
        ? parseInt(searchParams.minBase, 10)
        : undefined,
    maxBase:
      typeof searchParams?.maxBase === 'string' && searchParams.maxBase !== ''
        ? parseInt(searchParams.maxBase, 10)
        : undefined,
    minYear:
      typeof searchParams?.minYear === 'string' && searchParams.minYear !== ''
        ? parseInt(searchParams.minYear, 10)
        : undefined,
    maxYear:
      typeof searchParams?.maxYear === 'string' && searchParams.maxYear !== ''
        ? parseInt(searchParams.maxYear, 10)
        : undefined,
    minPsa10Rate:
      typeof searchParams?.minPsa10Rate === 'string' && searchParams.minPsa10Rate !== ''
        ? parseInt(searchParams.minPsa10Rate, 10)
        : undefined,
  };
}
