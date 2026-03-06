import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';
import {
  ArrowLeft,
  ExternalLink,
  TrendingUp,
  DollarSign,
  Percent,
  History,
  Activity,
  BarChart3,
  Package,
} from 'lucide-react';
import { supabase } from '../../../../utils/supabase';
import { getAppSettings, getGemrateUrl, getFeeSettings, getPsaPlansFromFeeSettings } from '../../../../utils/appSettings';
import { formatReleaseDate, parseReleaseDateToYear } from '../../../../utils/formatReleaseDate';
import { buildSeriesName, parseNameJpForGemrate } from '../../../../utils/gemrateParse';

const GEMRATE_STATS_LIMIT = 10000;
import { matchProductToGemrateStats } from '../../../../utils/gemrateMatch';
import type { GemrateStatsRow } from '../../../../utils/gemrateMatch';
import { FavoriteButton } from './FavoriteButton';
import { PriceChart } from './PriceChart';
import { ROISimulator } from './ROISimulator';
import { CardDescriptionForm } from './CardDescriptionForm';
import { PackSelectForm } from './PackSelectForm';
import { resolveTradeDate, formatTradeDate } from './tradeDateUtils';
import { isPsa10, isStateA } from '../../../../utils/condition';
import { filterPriceOutliers } from '../../../../utils/outlierFilter';

export const revalidate = 0;

/** 取引日（resolveTradeDate）で降順ソートし、先頭を「最新」とする */
function sortByTradeDateDesc<T extends { trade_date?: string | null; scraped_at?: string | null }>(
  list: T[]
): T[] {
  return [...list].sort((a, b) => {
    const ta = resolveTradeDate(a.trade_date, a.scraped_at)?.getTime() ?? 0;
    const tb = resolveTradeDate(b.trade_date, b.scraped_at)?.getTime() ?? 0;
    return tb - ta;
  });
}

/** trade_histories テーブル（取引履歴） */
type TradeHistoryRow = {
  id: string;
  product_id: string;
  condition?: string | null;
  price?: number | null;
  trade_date?: string | null;
  scraped_at?: string | null;
};

type ProductForMetadata = {
  id?: string;
  name_jp?: string | null;
  card_description?: string | null;
  product_code?: string | null;
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const { data: product } = await supabase
    .from('products')
    .select('id, name_jp, card_description, product_code')
    .eq('id', id)
    .single();
  const p = product as ProductForMetadata | null;
  const title =
    p?.name_jp ?? p?.card_description ?? p?.product_code ?? p?.id ?? '商品詳細';
  return { title };
}

export default async function ProductDetail({
  params,
  searchParams: searchParamsPromise,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { id } = await params;
  const searchParams = searchParamsPromise ? await searchParamsPromise : undefined;
  const returnTo =
    typeof searchParams?.returnTo === 'string' ? searchParams.returnTo : '';
  const listHref = returnTo
    ? returnTo.startsWith('?')
      ? `/${returnTo}`
      : `/?${returnTo}`
    : '/';

  const [
    { data: product },
    { data: histories, error: historiesError },
    appSettings,
    { data: gemrateMappingsRows },
  ] = await Promise.all([
    supabase.from('products').select('*').eq('id', id).single(),
    supabase
      .from('trade_histories')
      .select('id, product_id, condition, price, trade_date, scraped_at')
      .eq('product_id', id)
      .order('scraped_at', { ascending: false })
      .limit(100),
    getAppSettings(),
    supabase.from('gemrate_mappings').select('series_name, gemrate_url'),
  ]);

  const feeSettings = getFeeSettings(appSettings);
  const productNameJp = (product as { name_jp?: string | null })?.name_jp;
  const productReleaseDate = (product as { release_date?: string | null })?.release_date;
  const productGemrateSeriesName = (product as { gemrate_series_name?: string | null })?.gemrate_series_name;
  const builtSeriesNameForFetch = product
    ? buildSeriesName(productNameJp, productReleaseDate)
    : null;
  const effectiveSeriesName =
    productGemrateSeriesName?.trim() || builtSeriesNameForFetch;
  const seriesNameVariants =
    effectiveSeriesName != null
      ? [effectiveSeriesName, effectiveSeriesName.replace(/\|/g, '\uFF5C')]
      : [];
  const { data: gemrateStatsRows } =
    seriesNameVariants.length > 0
      ? await supabase
          .from('gemrate_stats')
          .select('series_name, card_number, card_description, gem_rate, psa10_count, total_graded')
          .in('series_name', seriesNameVariants)
      : await supabase
          .from('gemrate_stats')
          .select('series_name, card_number, card_description, gem_rate, psa10_count, total_graded')
          .limit(GEMRATE_STATS_LIMIT);

  if (historiesError) console.error('履歴取得エラー:', historiesError);

  const historyList = (histories ?? []) as TradeHistoryRow[];
  const psa10Histories = historyList.filter((h) => isPsa10(h.condition));
  const baseHistories = historyList.filter((h) => isStateA(h.condition));
  const psa10ByTradeDate = sortByTradeDateDesc(psa10Histories);
  const baseByTradeDate = sortByTradeDateDesc(baseHistories);
  const psa10Filtered = filterPriceOutliers(psa10ByTradeDate);
  const baseFiltered = filterPriceOutliers(baseByTradeDate);
  const latestPsa10Price =
    psa10Filtered.length > 0 ? Number(psa10Filtered[0].price) : 0;
  const latestBasePrice =
    baseFiltered.length > 0 ? Number(baseFiltered[0].price) : 0;

  const expectedProfit =
    latestPsa10Price > 0 && latestBasePrice > 0
      ? Math.floor(latestPsa10Price * 0.9 - latestBasePrice - 3300)
      : 0;

  const cost = latestBasePrice + 3300;
  const roi =
    cost > 0 ? Math.round((expectedProfit / cost) * 100) : 0;

  const gemrateStats = (gemrateStatsRows ?? []) as GemrateStatsRow[];
  const productForMatch = product
    ? {
        id: product.id,
        name_jp: product.name_jp,
        release_date: product.release_date,
        card_description: product.card_description,
        gemrate_series_name: productGemrateSeriesName,
      }
    : null;
  const gemMatch = productForMatch ? matchProductToGemrateStats(productForMatch, gemrateStats) : null;
  const psa10Rate = gemMatch != null ? Math.round(gemMatch.gem_rate) : null;
  const psa10Count = gemMatch?.psa10_count ?? null;
  const totalGraded = gemMatch?.total_graded ?? null;

  /** 基準日以前の直近の取引価格を取得（対1ヶ月前・対3ヶ月前用） */
  const nowMs = Date.now();
  const cutoff1M = nowMs - 30 * 24 * 60 * 60 * 1000;
  const cutoff3M = nowMs - 90 * 24 * 60 * 60 * 1000;
  function findPriceAtOrBefore(
    list: typeof psa10Filtered,
    cutoffMs: number
  ): number | null {
    for (const row of list) {
      const d = resolveTradeDate(row.trade_date, row.scraped_at);
      if (d == null || row.price == null) continue;
      if (d.getTime() <= cutoffMs) return Number(row.price);
    }
    return null;
  }
  const priceAt1M = findPriceAtOrBefore(psa10Filtered, cutoff1M);
  const priceAt3M = findPriceAtOrBefore(psa10Filtered, cutoff3M);
  let trend1Month: number | null = null;
  let trend3Months: number | null = null;
  if (latestPsa10Price > 0 && priceAt1M != null && priceAt1M > 0) {
    trend1Month = Math.round(
      ((latestPsa10Price - priceAt1M) / priceAt1M) * 100
    );
  }
  if (latestPsa10Price > 0 && priceAt3M != null && priceAt3M > 0) {
    trend3Months = Math.round(
      ((latestPsa10Price - priceAt3M) / priceAt3M) * 100
    );
  }
  const hasAnyTrend = trend1Month != null || trend3Months != null;

  const toChartData = (list: TradeHistoryRow[]) => {
    return [...list]
      .map((h) => {
        const resolved = resolveTradeDate(h.trade_date, h.scraped_at);
        return { row: h, resolved };
      })
      .filter(({ resolved }) => resolved != null)
      .sort(
        (a, b) =>
          (a.resolved as Date).getTime() - (b.resolved as Date).getTime()
      )
      .map(({ row, resolved }) => ({
        date: (resolved as Date).toISOString().slice(0, 10),
        price: Number(row.price),
      }));
  };
  const psa10ChartData = toChartData(psa10Histories);
  const baseChartData = toChartData(baseHistories);

  const snkrdunkUrl = `https://snkrdunk.com/apparels/${id}?slide=right`;
  const { packName } = parseNameJpForGemrate(product?.name_jp);
  const namePartBeforeBracket = (product?.name_jp ?? '').split('[')[0].trim();
  const mercariKeyword = packName ? `${namePartBeforeBracket} ${packName}`.trim() : namePartBeforeBracket;
  const mercariSearchUrl =
    'https://jp.mercari.com/search?keyword=' + encodeURIComponent(mercariKeyword) +
    '&status=on_sale&sort=price&order=asc';
  const productCode = (product as { product_code?: string | null })?.product_code;
  const mappingsBySeries = new Map<string, string>();
  for (const row of gemrateMappingsRows ?? []) {
    const r = row as { series_name?: string | null; gemrate_url?: string | null };
    if (r.series_name != null && r.gemrate_url != null) {
      mappingsBySeries.set(String(r.series_name).trim(), String(r.gemrate_url).trim());
    }
  }
  const seriesForGemrateUrl = gemMatch?.series_name ?? effectiveSeriesName ?? null;
  const gemrateUrlFromMapping = seriesForGemrateUrl
    ? mappingsBySeries.get(seriesForGemrateUrl) ?? null
    : null;
  const gemrateUrl =
    gemrateUrlFromMapping ??
    getGemrateUrl(appSettings ?? null, id, productCode, seriesForGemrateUrl);

  const historyListSorted = [...historyList].sort((a, b) => {
    const da = resolveTradeDate(a.trade_date, a.scraped_at)?.getTime() ?? 0;
    const db = resolveTradeDate(b.trade_date, b.scraped_at)?.getTime() ?? 0;
    return db - da;
  });

  return (
    <div className="min-h-screen w-full bg-slate-50 pb-12">
      {/* ヘッダー: 戻る + 商品名 + アクション */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 w-full">
        <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-5">
          <div className="flex items-center gap-4 mb-6">
            <Link
              href={listHref}
              className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-medium min-h-[44px] min-w-[44px] -ml-2 items-center justify-center rounded-lg hover:bg-slate-100 transition-colors"
              aria-label="一覧に戻る"
            >
              <ArrowLeft size={22} />
              <span className="hidden sm:inline">一覧に戻る</span>
            </Link>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-start gap-3 md:gap-4">
            <div className="shrink-0">
              {product?.image_url ? (
                <img
                  src={product.image_url}
                  alt=""
                  className="w-24 h-24 rounded-xl object-cover border border-slate-200"
                />
              ) : (
                <div className="w-24 h-24 rounded-xl bg-slate-200 flex items-center justify-center text-slate-400 text-3xl">
                  📦
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 leading-snug break-words">
                {product?.name_jp || product?.card_description || product?.product_code || product?.id || '商品名なし'}
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                {product?.brand || '-'} ／ {product?.category || '-'}
              </p>
              <div className="flex flex-wrap gap-2 mt-4">
                <a
                  href={snkrdunkUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-4 py-3 sm:py-2.5 bg-white text-slate-900 text-sm font-medium rounded-lg hover:bg-slate-100 border border-slate-200 transition-colors min-h-[44px] w-full sm:w-auto"
                >
                  <Image src="/snkrdunk-icon.png" alt="" width={20} height={20} className="shrink-0" />
                  スニダンで見る
                </a>
                <a
                  href={mercariSearchUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-4 py-3 sm:py-2.5 bg-white text-slate-900 text-sm font-medium rounded-lg hover:bg-slate-100 border border-slate-200 transition-colors min-h-[44px] w-full sm:w-auto"
                >
                  <Image src="/mercari-icon-2.png" alt="" width={26} height={26} className="shrink-0" />
                  メルカリで探す
                </a>
                {gemrateUrl && (
                  <a
                    href={gemrateUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 px-4 py-3 sm:py-2.5 bg-white text-slate-900 text-sm font-medium rounded-lg hover:bg-slate-100 border border-slate-200 transition-colors min-h-[44px] w-full sm:w-auto"
                  >
                    <Image src="/gemrate-icon-2.png" alt="" width={26} height={26} className="shrink-0" />
                    Gemrateで取得率を確認する
                  </a>
                )}
                <FavoriteButton
                  productId={id}
                  initialFavorite={(product as { is_favorite?: boolean | null })?.is_favorite ?? false}
                />
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-8 box-border">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8 w-full min-w-0">
          {/* メインエリア: 左側・スクロール主体 */}
          <div className="min-w-0 space-y-8 order-1">
            {/* 主要数値: 数字を大きく、ラベルは下に */}
            <section>
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">
                サマリ
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="bg-white rounded-xl border border-slate-200 p-5 text-center">
                  <p className="text-2xl font-bold text-slate-900 tabular-nums">
                    {historyList.length}
                  </p>
                  <p className="text-sm text-slate-500 mt-1">取引件数</p>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 p-5 text-center">
                  <p className="text-xl font-bold text-slate-900 tabular-nums">
                    {latestBasePrice > 0
                      ? `¥${latestBasePrice.toLocaleString()}`
                      : '—'}
                  </p>
                  <p className="text-sm text-slate-500 mt-1">状態A 最新</p>
                </div>
                <div className="bg-white rounded-xl border border-blue-100 border-t-4 border-t-blue-500 p-5 text-center">
                  <p className="text-xl font-bold text-blue-700 tabular-nums">
                    {latestPsa10Price > 0
                      ? `¥${latestPsa10Price.toLocaleString()}`
                      : '—'}
                  </p>
                  <p className="text-sm text-slate-500 mt-1">PSA10 最新</p>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 p-5 text-center">
                  <p className="text-2xl font-bold tabular-nums" title={psa10Rate != null ? undefined : 'Gemrateに未紐付け'}>
                    {psa10Rate != null ? (
                      <span className={psa10Rate >= 80 ? 'text-emerald-600' : 'text-slate-900'}>{psa10Rate}%</span>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </p>
                  <p className="text-sm text-slate-500 mt-1">
                    PSA10取得率（Gemrate鑑定データ）
                    {psa10Rate == null && (
                      <span className="block text-xs text-slate-400 mt-0.5">未紐付け</span>
                    )}
                  </p>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 p-5 text-center">
                  <p className="text-2xl font-bold tabular-nums">
                    {totalGraded != null ? (
                      <span className="text-slate-900">{Number(totalGraded).toLocaleString()}</span>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </p>
                  <p className="text-sm text-slate-500 mt-1">PSA提出数</p>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 p-5 text-center">
                  <p className="text-2xl font-bold tabular-nums">
                    {psa10Count != null ? (
                      <span className="text-slate-900">{Number(psa10Count).toLocaleString()}</span>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </p>
                  <p className="text-sm text-slate-500 mt-1">PSA取得数</p>
                </div>
              </div>
            </section>

            {/* パックを選択（Gemrate 照合用） */}
            <section className="bg-white rounded-xl border border-slate-200 p-5">
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">
                パックを選択
              </h2>
              <PackSelectForm
                productId={id}
                releaseYear={parseReleaseDateToYear(productReleaseDate)}
                initialValue={productGemrateSeriesName ?? null}
              />
            </section>

            {/* card_description 編集（Gemrate 照合用） */}
            <section className="bg-white rounded-xl border border-slate-200 p-5">
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">
                Gemrate 照合
              </h2>
              <CardDescriptionForm
                productId={id}
                initialValue={(product as { card_description?: string | null })?.card_description ?? null}
              />
            </section>

            {/* 直近の値動き・対1ヶ月前・対3ヶ月前 */}
            {hasAnyTrend && (
              <section>
                <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">
                  値動き（PSA10）
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {trend1Month != null && (
                    <div className="bg-white rounded-xl border border-slate-200 p-5">
                      <p
                        className={`text-2xl font-bold tabular-nums ${
                          trend1Month >= 0 ? 'text-emerald-600' : 'text-red-600'
                        }`}
                      >
                        {trend1Month >= 0 ? '+' : ''}
                        {trend1Month}%
                      </p>
                      <p className="text-sm text-slate-500 mt-1">
                        対 約1ヶ月前
                      </p>
                    </div>
                  )}
                  {trend3Months != null && (
                    <div className="bg-white rounded-xl border border-slate-200 p-5">
                      <p
                        className={`text-2xl font-bold tabular-nums ${
                          trend3Months >= 0 ? 'text-emerald-600' : 'text-red-600'
                        }`}
                      >
                        {trend3Months >= 0 ? '+' : ''}
                        {trend3Months}%
                      </p>
                      <p className="text-sm text-slate-500 mt-1">
                        対 約3ヶ月前
                      </p>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* 商品情報サマリ */}
            <section className="min-w-0">
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">
                商品情報
              </h2>
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden min-w-0">
                <table className="w-full text-left text-sm">
                  <tbody className="divide-y divide-slate-100">
                    <tr>
                      <th className="py-3 px-4 font-medium text-slate-600 w-40">
                        予想利益
                      </th>
                      <td
                        className={`py-3 px-4 font-semibold tabular-nums ${
                          expectedProfit > 0
                            ? 'text-emerald-600'
                            : 'text-slate-900'
                        }`}
                      >
                        {expectedProfit !== 0
                          ? `¥${expectedProfit.toLocaleString()}`
                          : '—'}
                      </td>
                    </tr>
                    <tr>
                      <th className="py-3 px-4 font-medium text-slate-600">
                        ROI
                      </th>
                      <td className="py-3 px-4 font-semibold tabular-nums text-slate-900">
                        {roi !== 0 ? `${roi}%` : '—'}
                      </td>
                    </tr>
                    <tr>
                      <th className="py-3 px-4 font-medium text-slate-600">
                        PSA10 最新
                      </th>
                      <td className="py-3 px-4 font-semibold tabular-nums text-blue-700">
                        {latestPsa10Price > 0
                          ? `¥${latestPsa10Price.toLocaleString()}`
                          : '—'}
                      </td>
                    </tr>
                    <tr>
                      <th className="py-3 px-4 font-medium text-slate-600">
                        状態A 最新
                      </th>
                      <td className="py-3 px-4 font-semibold tabular-nums text-slate-900">
                        {latestBasePrice > 0
                          ? `¥${latestBasePrice.toLocaleString()}`
                          : '—'}
                      </td>
                    </tr>
                    <tr>
                      <th className="py-3 px-4 font-medium text-slate-600">
                        パック名
                      </th>
                      <td className="py-3 px-4 text-slate-900">
                        {packName ?? '—'}
                      </td>
                    </tr>
                    <tr>
                      <th className="py-3 px-4 font-medium text-slate-600">
                        発売日
                      </th>
                      <td className="py-3 px-4 text-slate-900">
                        {formatReleaseDate(
                          (product as { release_date?: string | null })
                            ?.release_date
                        )}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            {/* 価格推移チャート */}
            <section className="min-w-0 overflow-hidden">
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">
                価格推移
              </h2>
              <div className="bg-white rounded-xl border border-slate-200 p-5 min-w-0 overflow-x-auto">
                <PriceChart
                  psa10Data={psa10ChartData}
                  baseData={baseChartData}
                />
              </div>
            </section>

            {/* 過去の販売履歴 */}
            <section className="min-w-0">
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">
                過去の販売履歴
              </h2>
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden min-w-0">
                <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
                      <tr>
                        <th className="py-3 px-4 font-semibold text-slate-600 text-left">
                          取引日
                        </th>
                        <th className="py-3 px-4 font-semibold text-slate-600 text-left">
                          状態
                        </th>
                        <th className="py-3 px-4 font-semibold text-slate-600 text-right">
                          価格
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {historyListSorted.length > 0 ? (
                        historyListSorted.map((h) => {
                          const isPSA10 =
                            h.condition?.includes('PSA 10') || h.condition?.includes('PSA10') === true;
                          const stateLabel = (h.condition ?? '—').trim() || '—';
                          return (
                            <tr key={h.id} className="hover:bg-slate-50">
                              <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                                {formatTradeDate(h.trade_date, h.scraped_at)}
                              </td>
                              <td className="py-3 px-4">
                                <span
                                  className={`inline-block px-2 py-1 rounded-md text-xs font-medium ${
                                    isPSA10
                                      ? 'bg-blue-100 text-blue-800'
                                      : 'bg-slate-100 text-slate-700'
                                  }`}
                                >
                                  {stateLabel}
                                </span>
                              </td>
                              <td className="py-3 px-4 font-semibold text-right tabular-nums whitespace-nowrap">
                                ¥{Number(h.price ?? 0).toLocaleString()}
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td
                            colSpan={3}
                            className="py-12 px-4 text-center text-slate-400"
                          >
                            取引履歴がありません
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          </div>

          {/* 右カラム: シミュレーター（幅固定で重なり防止） */}
          <div className="min-w-0 w-full max-w-md lg:max-w-none order-2">
            <div className="lg:sticky lg:top-24 lg:w-[320px]">
              <ROISimulator
                latestPsa10Price={latestPsa10Price}
                latestBasePrice={latestBasePrice}
                mercariFeePercent={feeSettings.mercariFeePercent}
                snkrdunkFeePercent={feeSettings.snkrdunkFeePercent}
                defaultGradingFee={feeSettings.psaValue}
                psaPlans={getPsaPlansFromFeeSettings(feeSettings)}
                defaultPlanId="psaValue"
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
