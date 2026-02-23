import { supabase } from './supabase';

export type DiagnosticResult = {
  env: { hasUrl: boolean; hasKey: boolean };
  products: {
    all: { count: number; error: string | null };
    isTargetTrue: { count: number; error: string | null };
    sampleColumns: string[] | null;
  };
  tradeHistories: { count: number; error: string | null };
  appSettings: { hasRow: boolean; error: string | null };
};

/**
 * Supabase からのデータ取得ができるか診断する（サーバー専用）
 */
export async function runSupabaseDiagnostics(): Promise<DiagnosticResult> {
  const hasUrl = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL?.trim());
  const hasKey = Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim());

  const result: DiagnosticResult = {
    env: { hasUrl, hasKey },
    products: {
      all: { count: 0, error: null },
      isTargetTrue: { count: 0, error: null },
      sampleColumns: null,
    },
    tradeHistories: { count: 0, error: null },
    appSettings: { hasRow: false, error: null },
  };

  if (!hasUrl || !hasKey) {
    return result;
  }

  // 1. products 全件数
  const { count: allCount, error: allError } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true });

  if (allError) {
    result.products.all.error = `${allError.code ?? 'ERR'}: ${allError.message}`;
  } else {
    result.products.all.count = allCount ?? 0;
  }

  // 2. products is_target = true のみ
  const { count: targetCount, error: targetError } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
    .eq('is_target', true);

  if (targetError) {
    result.products.isTargetTrue.error = `${targetError.code ?? 'ERR'}: ${targetError.message}`;
  } else {
    result.products.isTargetTrue.count = targetCount ?? 0;
  }

  // 3. products 1件取得してカラム名を確認
  const { data: oneProduct } = await supabase
    .from('products')
    .select('*')
    .limit(1)
    .maybeSingle();

  if (oneProduct && typeof oneProduct === 'object') {
    result.products.sampleColumns = Object.keys(oneProduct);
  }

  // 4. trade_histories 件数
  const { count: historyCount, error: historyError } = await supabase
    .from('trade_histories')
    .select('*', { count: 'exact', head: true });

  if (historyError) {
    result.tradeHistories.error = `${historyError.code ?? 'ERR'}: ${historyError.message}`;
  } else {
    result.tradeHistories.count = historyCount ?? 0;
  }

  // 5. app_settings（id=1）
  const { data: appSettingsRow, error: appError } = await supabase
    .from('app_settings')
    .select('id')
    .eq('id', 1)
    .maybeSingle();

  if (appError) {
    result.appSettings.error = `${appError.code ?? 'ERR'}: ${appError.message}`;
  } else {
    result.appSettings.hasRow = appSettingsRow != null;
  }

  return result;
}
