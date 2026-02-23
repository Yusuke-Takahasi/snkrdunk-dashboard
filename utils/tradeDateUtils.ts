/**
 * trade_date が「N時間前」「N日前」などの相対表記の場合、
 * scraped_at から実際の日時を算出する。
 * 商品詳細・一覧の両方で「最新」を取引日基準で揃えるために共有。
 */
export function resolveTradeDate(
  tradeDate: string | null | undefined,
  scrapedAt: string | null | undefined
): Date | null {
  if (!tradeDate || typeof tradeDate !== 'string') return null;
  const trimmed = tradeDate.trim();
  if (!trimmed) return null;

  const parsed = new Date(trimmed);
  if (!Number.isNaN(parsed.getTime())) return parsed;

  const scraped = scrapedAt ? new Date(scrapedAt) : new Date();
  if (Number.isNaN(scraped.getTime())) return null;

  const match = trimmed.match(/^(\d+)\s*(分|時間|日|週間|ヶ月|か月|月)\s*前\s*$/);
  if (!match) return null;

  const n = parseInt(match[1].replace(/\s/g, ''), 10);
  if (Number.isNaN(n) || n < 0) return null;

  const result = new Date(scraped);
  switch (match[2]) {
    case '分':
      result.setMinutes(result.getMinutes() - n);
      break;
    case '時間':
      result.setHours(result.getHours() - n);
      break;
    case '日':
      result.setDate(result.getDate() - n);
      break;
    case '週間':
      result.setDate(result.getDate() - n * 7);
      break;
    case 'ヶ月':
    case 'か月':
    case '月':
      result.setMonth(result.getMonth() - n);
      break;
    default:
      return null;
  }
  return result;
}

/**
 * 取引日を YYYY/MM/DD で表示（時間はスクレイピング時刻のため表示しない）
 */
export function formatTradeDate(
  tradeDate: string | null | undefined,
  scrapedAt: string | null | undefined
): string {
  const resolved = resolveTradeDate(tradeDate, scrapedAt);
  if (!resolved) return '-';
  const y = resolved.getFullYear();
  const m = String(resolved.getMonth() + 1).padStart(2, '0');
  const d = String(resolved.getDate()).padStart(2, '0');
  return `${y}/${m}/${d}`;
}
