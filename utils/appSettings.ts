import { supabase } from './supabase';

export type AppSettingsRow = {
  id: number;
  ui_preferences?: Record<string, unknown> | null;
  gemrate_urls?: Record<string, string> | null;
};

/**
 * app_settings を取得（id=1 のみ）。gemrate_urls は キー: 商品ID / product_code / series_name（パック名|年）、値: URL
 */
export async function getAppSettings(): Promise<AppSettingsRow | null> {
  const { data } = await supabase
    .from('app_settings')
    .select('*')
    .eq('id', 1)
    .maybeSingle();
  if (data && typeof data === 'object') {
    return data as AppSettingsRow;
  }
  return null;
}

/**
 * Gemrate URL を取得。照合順: series_name → 商品ID → product_code
 * app_settings.gemrate_urls のキーに series_name（パック名|年）を登録しておくと、gemrate_mappings に無いパックでも URL を出せる。
 */
export function getGemrateUrl(
  settings: AppSettingsRow | null,
  productId: string,
  productCode?: string | null,
  seriesName?: string | null
): string | null {
  const urls = settings?.gemrate_urls;
  if (!urls || typeof urls !== 'object') return null;
  const seriesKey = seriesName?.trim();
  const url =
    (seriesKey && urls[seriesKey]) ??
    urls[productId] ??
    (productCode ? urls[productCode] : null);
  return typeof url === 'string' && url.trim() ? url : null;
}
