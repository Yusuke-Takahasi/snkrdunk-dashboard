import { parseReleaseDateToYear } from './formatReleaseDate';

/** name_jp から抽出したパック名・カード番号・発売年 */
export type ParsedGemrateKey = {
  packName: string;
  cardNumber: string;
  year: number | null;
};

/**
 * name_jp からパック名とカード番号を抽出する。
 * 現時点ではワンピース・ポケモン形式のみ対応。
 *
 * ワンピース例: [OP13-120](ブースターパック「受け継がれる意志」) → cardNumber: "120", packName: "受け継がれる意志"
 * ポケモン例: [M2a 240/193](ハイクラスパック「MEGAドリームex」) → cardNumber: "240", packName: "MEGAドリームex"
 */
export function parseNameJpForGemrate(nameJp: string | null | undefined): {
  packName: string | null;
  cardNumber: string | null;
} {
  if (!nameJp || typeof nameJp !== 'string') {
    return { packName: null, cardNumber: null };
  }
  const s = nameJp.trim();
  if (!s) return { packName: null, cardNumber: null };

  // パック名: (…) 内の 「…」 の内容
  const packMatch = s.match(/\([^)]*?[「]([^」]+)[」][^)]*\)/);
  const packName = packMatch ? packMatch[1].trim() : null;

  // カード番号: [xxx] 形式から抽出
  const bracketMatch = s.match(/\[([^\]]+)\]/);
  let cardNumber: string | null = null;
  if (bracketMatch) {
    const inner = bracketMatch[1].trim();
    // ポケモン形式: "M2a 240/193" → スラッシュ前の数字 "240"
    const slashMatch = inner.match(/\s*(\d+)\s*\/\s*\d+/);
    if (slashMatch) {
      cardNumber = slashMatch[1];
    } else {
      // ワンピース形式: "OP13-120" → ハイフン後の数字 "120"
      const hyphenMatch = inner.match(/-\s*(\d+)\s*$/);
      if (hyphenMatch) {
        cardNumber = hyphenMatch[1];
      } else {
        // 単独の数字のみの場合
        const numMatch = inner.match(/(\d+)/);
        cardNumber = numMatch ? numMatch[1] : null;
      }
    }
  }

  return { packName, cardNumber };
}

/**
 * 商品の name_jp と release_date から gemrate_stats 照合用の series_name を組み立てる。
 * series_name 形式: "パック名|発売年"（例: "受け継がれる意志|2025"）
 */
export function buildSeriesName(
  nameJp: string | null | undefined,
  releaseDate: string | null | undefined
): string | null {
  const { packName } = parseNameJpForGemrate(nameJp);
  const year = parseReleaseDateToYear(releaseDate);
  if (!packName || year == null) return null;
  return `${packName}|${year}`;
}

/**
 * 商品から照合用キー（series_name, card_number, year）を取得する。
 */
export function getParsedGemrateKey(
  nameJp: string | null | undefined,
  releaseDate: string | null | undefined
): ParsedGemrateKey | null {
  const { packName, cardNumber } = parseNameJpForGemrate(nameJp);
  const year = parseReleaseDateToYear(releaseDate);
  if (!packName || !cardNumber) return null;
  return { packName, cardNumber, year };
}
