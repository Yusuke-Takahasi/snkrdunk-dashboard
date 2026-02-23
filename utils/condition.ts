/**
 * trade_histories.condition の解釈（状態A / PSA10 等）
 * ドキュメント: "PSA 10", "A" 等。状態Aは「A」または「状態A」を含むレコードに限定する。
 */

export function isPsa10(condition: string | null | undefined): boolean {
  if (condition == null) return false;
  const c = String(condition);
  return c.includes('PSA 10') || c.includes('PSA10');
}

/**
 * 状態Aとみなす条件: "A"（トリム後一致）または "状態A" を含む。
 * 状態B/状態C を除外するため、単純な「PSA10以外」ではなく明示的に状態Aのみを判定する。
 */
export function isStateA(condition: string | null | undefined): boolean {
  if (condition == null) return false;
  const c = String(condition).trim();
  if (!c) return false;
  if (c === 'A') return true;
  return c.includes('状態A');
}
