/** release_date を表示用文字列に変換。ISO "2025-10-25" や "2025年10月25日" に対応 */
export function formatReleaseDate(
  releaseDate: string | null | undefined
): string {
  if (!releaseDate) return '—';
  const d = new Date(releaseDate);
  if (!Number.isNaN(d.getTime())) {
    return d.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  }
  const m = releaseDate.match(/^(\d{4})年(\d{1,2})月(\d{1,2})日$/);
  if (m) {
    const y = parseInt(m[1], 10);
    const mon = parseInt(m[2], 10);
    const day = parseInt(m[3], 10);
    const d2 = new Date(y, mon - 1, day);
    if (!Number.isNaN(d2.getTime())) {
      return d2.toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
    }
  }
  return '—';
}

/** ソート用: release_date をタイムスタンプに変換。無効な場合は 0 */
export function parseReleaseDateToTime(
  releaseDate: string | null | undefined
): number {
  if (!releaseDate) return 0;
  const d = new Date(releaseDate);
  if (!Number.isNaN(d.getTime())) return d.getTime();
  const m = releaseDate.match(/^(\d{4})年(\d{1,2})月(\d{1,2})日$/);
  if (m) {
    const d2 = new Date(
      parseInt(m[1], 10),
      parseInt(m[2], 10) - 1,
      parseInt(m[3], 10)
    );
    if (!Number.isNaN(d2.getTime())) return d2.getTime();
  }
  return 0;
}

/** 発売年を取得。無効な場合は null */
export function parseReleaseDateToYear(
  releaseDate: string | null | undefined
): number | null {
  if (!releaseDate) return null;
  const d = new Date(releaseDate);
  if (!Number.isNaN(d.getTime())) return d.getFullYear();
  const m = releaseDate.match(/^(\d{4})年/);
  if (m) return parseInt(m[1], 10);
  return null;
}
