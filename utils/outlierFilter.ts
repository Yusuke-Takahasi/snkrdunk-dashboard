/**
 * 取引履歴の価格に対して IQR（四分位範囲）で外れ値を除外する。
 * Q1 - 1.5×IQR ～ Q3 + 1.5×IQR の範囲内の行のみ返す。
 * 有効な価格が3件未満の場合は除外せずそのまま返す。
 */

const MIN_VALID_PRICES_FOR_IQR = 3;

function quantile(sortedValues: number[], p: number): number {
  const n = sortedValues.length;
  if (n === 0) return 0;
  if (n === 1) return sortedValues[0];
  const index = (n - 1) * p;
  const lo = Math.floor(index);
  const hi = Math.ceil(index);
  if (lo === hi) return sortedValues[lo];
  const w = index - lo;
  return sortedValues[lo] * (1 - w) + sortedValues[hi] * w;
}

/**
 * price が数値の行だけを対象に IQR を計算し、範囲内の行のみ返す。
 * 元の rows の順序は維持する。
 */
export function filterPriceOutliers<T extends { price?: number | null }>(
  rows: T[]
): T[] {
  const prices = rows
    .map((r) => (r.price != null && typeof r.price === 'number' ? r.price : null))
    .filter((p): p is number => p !== null && Number.isFinite(p));

  if (prices.length < MIN_VALID_PRICES_FOR_IQR) {
    return rows;
  }

  const sorted = [...prices].sort((a, b) => a - b);
  const q1 = quantile(sorted, 0.25);
  const q3 = quantile(sorted, 0.75);
  const iqr = q3 - q1;
  const lower = q1 - 1.5 * iqr;
  const upper = q3 + 1.5 * iqr;

  return rows.filter((r) => {
    const p = r.price != null && typeof r.price === 'number' ? r.price : null;
    if (p === null || !Number.isFinite(p)) return true;
    return p >= lower && p <= upper;
  });
}
