import { supabase } from './supabase';

/** 販売手数料（%）とPSA鑑定料金（円）の設定 */
export type FeeSettings = {
  mercariFeePercent: number;
  snkrdunkFeePercent: number;
  psaValueBulk: number;
  psaValue: number;
  psaValuePlus: number;
  psaValueMax: number;
  psaRegular: number;
  psaExpress: number;
};

export const DEFAULT_FEE_SETTINGS: FeeSettings = {
  mercariFeePercent: 10,
  snkrdunkFeePercent: 8,
  psaValueBulk: 3980,
  psaValue: 4980,
  psaValuePlus: 7980,
  psaValueMax: 8980,
  psaRegular: 11980,
  psaExpress: 22980,
};

export function getFeeSettings(row: AppSettingsRow | null): FeeSettings {
  const raw = row?.fee_settings;
  if (!raw || typeof raw !== 'object') return DEFAULT_FEE_SETTINGS;
  return {
    mercariFeePercent: typeof (raw as FeeSettings).mercariFeePercent === 'number' ? (raw as FeeSettings).mercariFeePercent : DEFAULT_FEE_SETTINGS.mercariFeePercent,
    snkrdunkFeePercent: typeof (raw as FeeSettings).snkrdunkFeePercent === 'number' ? (raw as FeeSettings).snkrdunkFeePercent : DEFAULT_FEE_SETTINGS.snkrdunkFeePercent,
    psaValueBulk: typeof (raw as FeeSettings).psaValueBulk === 'number' ? (raw as FeeSettings).psaValueBulk : DEFAULT_FEE_SETTINGS.psaValueBulk,
    psaValue: typeof (raw as FeeSettings).psaValue === 'number' ? (raw as FeeSettings).psaValue : DEFAULT_FEE_SETTINGS.psaValue,
    psaValuePlus: typeof (raw as FeeSettings).psaValuePlus === 'number' ? (raw as FeeSettings).psaValuePlus : DEFAULT_FEE_SETTINGS.psaValuePlus,
    psaValueMax: typeof (raw as FeeSettings).psaValueMax === 'number' ? (raw as FeeSettings).psaValueMax : DEFAULT_FEE_SETTINGS.psaValueMax,
    psaRegular: typeof (raw as FeeSettings).psaRegular === 'number' ? (raw as FeeSettings).psaRegular : DEFAULT_FEE_SETTINGS.psaRegular,
    psaExpress: typeof (raw as FeeSettings).psaExpress === 'number' ? (raw as FeeSettings).psaExpress : DEFAULT_FEE_SETTINGS.psaExpress,
  };
}

/** 一覧表示の初期設定（表示順・販売先・絞り込みなど） */
export type ListPreferences = {
  defaultSort: string;
  defaultOrder: 'asc' | 'desc';
  excludeBlacklisted: boolean;
  favoriteOnly: boolean;
  /** 手数料計算に使う販売先。未設定時はメルカリ */
  defaultSalesDestination?: 'mercari' | 'snkrdunk';
  /** 初期絞り込み（設定画面で指定。サイドバーで変更するとサイドバーが優先） */
  defaultMinProfit?: number;
  defaultMinRoi?: number;
  defaultMinPsa10?: number;
  defaultMaxPsa10?: number;
  defaultMinBase?: number;
  defaultMaxBase?: number;
  defaultMinYear?: number;
  defaultMaxYear?: number;
  defaultMinPsa10Rate?: number;
};

const DEFAULT_LIST_PREFERENCES: ListPreferences = {
  defaultSort: 'updated_at',
  defaultOrder: 'desc',
  excludeBlacklisted: true,
  favoriteOnly: false,
};

function num(v: unknown): number | undefined {
  if (v == null) return undefined;
  const n = Number(v);
  return Number.isNaN(n) ? undefined : n;
}

export function getListPreferences(row: AppSettingsRow | null): ListPreferences {
  const raw = row?.ui_preferences as Record<string, unknown> | undefined;
  const list = raw?.list_preferences;
  if (!list || typeof list !== 'object') return DEFAULT_LIST_PREFERENCES;
  const L = list as Record<string, unknown>;
  return {
    defaultSort: typeof L.defaultSort === 'string' ? L.defaultSort : DEFAULT_LIST_PREFERENCES.defaultSort,
    defaultOrder: L.defaultOrder === 'asc' || L.defaultOrder === 'desc' ? L.defaultOrder : DEFAULT_LIST_PREFERENCES.defaultOrder,
    excludeBlacklisted: typeof L.excludeBlacklisted === 'boolean' ? L.excludeBlacklisted : DEFAULT_LIST_PREFERENCES.excludeBlacklisted,
    favoriteOnly: typeof L.favoriteOnly === 'boolean' ? L.favoriteOnly : DEFAULT_LIST_PREFERENCES.favoriteOnly,
    defaultSalesDestination: L.defaultSalesDestination === 'mercari' || L.defaultSalesDestination === 'snkrdunk' ? L.defaultSalesDestination : undefined,
    defaultMinProfit: num(L.defaultMinProfit),
    defaultMinRoi: num(L.defaultMinRoi),
    defaultMinPsa10: num(L.defaultMinPsa10),
    defaultMaxPsa10: num(L.defaultMaxPsa10),
    defaultMinBase: num(L.defaultMinBase),
    defaultMaxBase: num(L.defaultMaxBase),
    defaultMinYear: num(L.defaultMinYear),
    defaultMaxYear: num(L.defaultMaxYear),
    defaultMinPsa10Rate: num(L.defaultMinPsa10Rate),
  };
}

export type AppSettingsRow = {
  id: number;
  ui_preferences?: Record<string, unknown> | null;
  gemrate_urls?: Record<string, string> | null;
  fee_settings?: FeeSettings | null;
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

/**
 * app_settings（id=1）の fee_settings を更新する。他カラムは変更しない。
 */
export async function updateFeeSettings(
  feeSettings: FeeSettings
): Promise<{ error?: string }> {
  const { error } = await supabase
    .from('app_settings')
    .update({ fee_settings: feeSettings as unknown as Record<string, unknown> })
    .eq('id', 1);
  if (error) return { error: error.message };
  return {};
}

/**
 * app_settings（id=1）の ui_preferences.list_preferences を更新する。既存の ui_preferences はマージする。
 */
export async function updateListPreferences(
  listPreferences: ListPreferences
): Promise<{ error?: string }> {
  const { data: existing } = await supabase
    .from('app_settings')
    .select('ui_preferences')
    .eq('id', 1)
    .maybeSingle();
  const current = (existing?.ui_preferences as Record<string, unknown>) ?? {};
  const next = { ...current, list_preferences: listPreferences as unknown };
  const { error } = await supabase
    .from('app_settings')
    .update({ ui_preferences: next })
    .eq('id', 1);
  if (error) return { error: error.message };
  return {};
}
