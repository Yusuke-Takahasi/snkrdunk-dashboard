import { buildSeriesName, getParsedGemrateKey } from './gemrateParse';

/** gemrate_stats テーブルの1行（照合用） */
export type GemrateStatsRow = {
  series_name?: string | null;
  card_number?: string | null;
  card_description?: string | null;
  gem_rate?: number | null;
  psa10_count?: number | null;
  total_graded?: number | null;
};

/** 商品（照合用に必要なフィールドのみ） */
export type ProductForGemrate = {
  id: string;
  name_jp?: string | null;
  release_date?: string | null;
  card_description?: string | null;
  /** 手動選択したパック（series_name）。未設定時は name_jp + release_date から算出 */
  gemrate_series_name?: string | null;
};

/** 照合結果: gem_rate と series_name（Gemrate ボタンURL用）、PSA提出数・取得数 */
export type GemrateMatchResult = {
  gem_rate: number;
  series_name: string;
  psa10_count?: number | null;
  total_graded?: number | null;
};

/** series_name の表記ゆれを正規化（全角パイプ ｜ → 半角 |） */
function normalizeSeriesName(s: string | null | undefined): string {
  return (s ?? '').trim().replace(/\uFF5C/g, '|');
}

/** card_number の表記ゆれを正規化（"217/187" 形式の場合はスラッシュ前の数字のみ） */
function normalizeCardNumber(s: string | null | undefined): string {
  const t = String(s ?? '').trim();
  const beforeSlash = t.split('/')[0]?.trim() ?? t;
  return beforeSlash;
}

/**
 * 1商品と gemrate_stats 一覧から照合し、一致した行の gem_rate と series_name を返す。
 * 第一優先: (series_name, card_number) で一致
 * フォールバック: product.card_description と gemrate_stats.card_description で一致
 */
export function matchProductToGemrateStats(
  product: ProductForGemrate,
  statsRows: GemrateStatsRow[]
): GemrateMatchResult | null {
  const seriesName =
    product.gemrate_series_name?.trim() ||
    buildSeriesName(product.name_jp, product.release_date);
  const parsed = getParsedGemrateKey(product.name_jp, product.release_date);

  // 第一優先: series_name + card_number で一致（正規化して比較）
  if (seriesName && parsed?.cardNumber != null) {
    const normalizedSeries = normalizeSeriesName(seriesName);
    const normalizedCard = normalizeCardNumber(parsed.cardNumber);
    const match = statsRows.find(
      (row) =>
        normalizeSeriesName(row.series_name) === normalizedSeries &&
        normalizeCardNumber(row.card_number) === normalizedCard
    );
    if (match != null && match.gem_rate != null && !Number.isNaN(Number(match.gem_rate))) {
      return {
        gem_rate: Number(match.gem_rate),
        series_name: (match.series_name ?? '').trim(),
        psa10_count: match.psa10_count ?? null,
        total_graded: match.total_graded ?? null,
      };
    }
  }

  // フォールバック: card_description で一致
  const productDesc = product.card_description?.trim();
  if (productDesc) {
    const match = statsRows.find(
      (row) => (row.card_description?.trim() ?? '') === productDesc
    );
    if (match != null && match.gem_rate != null && !Number.isNaN(Number(match.gem_rate))) {
      return {
        gem_rate: Number(match.gem_rate),
        series_name: (match.series_name ?? '').trim(),
        psa10_count: match.psa10_count ?? null,
        total_graded: match.total_graded ?? null,
      };
    }
  }

  return null;
}

/**
 * 複数商品について gemrate_stats と照合し、productId -> GemrateMatchResult の Map を返す。
 */
export function matchProductsToGemrateStats(
  products: ProductForGemrate[],
  statsRows: GemrateStatsRow[]
): Map<string, GemrateMatchResult> {
  const map = new Map<string, GemrateMatchResult>();
  for (const product of products) {
    const result = matchProductToGemrateStats(product, statsRows);
    if (result) map.set(product.id, result);
  }
  return map;
}
