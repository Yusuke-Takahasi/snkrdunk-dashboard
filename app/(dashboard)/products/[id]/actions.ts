'use server';

import { supabase } from '../../../../utils/supabase';
import { parseNameJpForGemrate } from '../../../../utils/gemrateParse';
import { parseReleaseDateToYear } from '../../../../utils/formatReleaseDate';

export async function updateProductCardDescription(
  productId: string,
  cardDescription: string | null
) {
  const { error } = await supabase
    .from('products')
    .update({ card_description: cardDescription?.trim() || null })
    .eq('id', productId);
  if (error) throw new Error(error.message);
}

/** 発売年で限定したパック（series_name）一覧を返す。末尾が |年 または _年 の形式。 */
export async function getPacksByYear(year: number | null): Promise<string[]> {
  if (year == null) return [];

  const suffixPipe = `|${year}`;
  const suffixUnderscore = `_${year}`;
  const collect = (res: { data: unknown } | null) =>
    (res?.data ?? []) as { series_name?: string | null }[];

  const [fromMappingsPipe, fromMappingsUnderscore, fromStatsPipe, fromStatsUnderscore] =
    await Promise.all([
      supabase.from('gemrate_mappings').select('series_name').ilike('series_name', `%${suffixPipe}`),
      supabase.from('gemrate_mappings').select('series_name').ilike('series_name', `%${suffixUnderscore}`),
      supabase.from('gemrate_stats').select('series_name').ilike('series_name', `%${suffixPipe}`).limit(2500),
      supabase.from('gemrate_stats').select('series_name').ilike('series_name', `%${suffixUnderscore}`).limit(2500),
    ]);

  const names = [
    ...collect(fromMappingsPipe),
    ...collect(fromMappingsUnderscore),
    ...collect(fromStatsPipe),
    ...collect(fromStatsUnderscore),
  ]
    .map((r) => r.series_name?.trim())
    .filter((s): s is string => Boolean(s));
  if (fromMappingsPipe.error) throw new Error(fromMappingsPipe.error.message);
  return [...new Set(names)].sort();
}

export async function updateProductGemrateSeriesName(
  productId: string,
  seriesName: string | null
) {
  const value = seriesName?.trim() || null;

  const { data: product, error: fetchError } = await supabase
    .from('products')
    .select('name_jp, release_date')
    .eq('id', productId)
    .single();
  if (fetchError) throw new Error(fetchError.message);

  const { error } = await supabase
    .from('products')
    .update({ gemrate_series_name: value })
    .eq('id', productId);
  if (error) throw new Error(error.message);

  const packName = parseNameJpForGemrate(product?.name_jp).packName;
  const year = parseReleaseDateToYear(product?.release_date);
  if (packName == null || year == null) return;

  const start = `${year}-01-01`;
  const end = `${year}-12-31`;
  const { data: candidates, error: listError } = await supabase
    .from('products')
    .select('id, name_jp, release_date')
    .gte('release_date', start)
    .lte('release_date', end);
  if (listError) throw new Error(listError.message);

  const ids = (candidates ?? [])
    .filter(
      (row: { name_jp?: string | null; release_date?: string | null }) =>
        parseNameJpForGemrate(row.name_jp).packName === packName &&
        parseReleaseDateToYear(row.release_date) === year
    )
    .map((row: { id: string }) => row.id);
  if (ids.length === 0) return;

  const { error: batchError } = await supabase
    .from('products')
    .update({ gemrate_series_name: value })
    .in('id', ids);
  if (batchError) throw new Error(batchError.message);
}
