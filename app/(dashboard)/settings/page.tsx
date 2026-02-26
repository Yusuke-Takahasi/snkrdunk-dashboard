import { Settings as SettingsIcon, Database, AlertCircle, CheckCircle } from 'lucide-react';
import { runSupabaseDiagnostics } from '../../../utils/supabaseDiagnostics';
import { getAppSettings, getFeeSettings, getListPreferences } from '../../../utils/appSettings';
import { FeeSettingsForm } from './FeeSettingsForm';
import { ListPreferencesForm } from './ListPreferencesForm';

export const metadata = {
  title: '設定 | スニダン監視Dashboard',
  description: '一覧表示の初期設定',
};

export default async function SettingsPage() {
  const [diag, appSettings] = await Promise.all([
    runSupabaseDiagnostics(),
    getAppSettings(),
  ]);
  const feeSettings = getFeeSettings(appSettings);
  const listPreferences = getListPreferences(appSettings);

  return (
    <div className="p-8 w-full max-w-full">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <SettingsIcon size={28} /> 設定
        </h1>
        <p className="text-slate-500 mt-1">
          一覧表示の初期設定を変更できます
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8 items-start">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4">
            <h2 className="text-lg font-bold text-slate-900 mb-1">
              販売手数料・PSA鑑定料金
            </h2>
            <p className="text-sm text-slate-500 mb-4">
              一覧の予想利益・ROI および商品詳細のシミュレーターで使用します
            </p>
            <FeeSettingsForm initial={feeSettings} />
          </div>
        </div>

        {/* データ接続診断 */}
        <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Database size={20} /> データ接続診断
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Supabase から商品データが取得できるか確認します
            </p>
          </div>
          <div className="p-4 space-y-4 text-sm">
            <div className="flex items-center justify-between gap-4 py-2 border-b border-slate-100">
              <span className="text-slate-600">環境変数</span>
              {diag.env.hasUrl && diag.env.hasKey ? (
                <span className="flex items-center gap-1 text-emerald-600 font-medium">
                  <CheckCircle size={16} /> 設定済み
                </span>
              ) : (
                <span className="flex items-center gap-1 text-red-600 font-medium">
                  <AlertCircle size={16} /> 未設定（.env.local を確認）
                </span>
              )}
            </div>
            <div className="flex items-center justify-between gap-4 py-2 border-b border-slate-100">
              <span className="text-slate-600">products 全件数</span>
              {diag.products.all.error ? (
                <span className="text-red-600 font-mono text-xs max-w-[70%] truncate" title={diag.products.all.error}>
                  {diag.products.all.error}
                </span>
              ) : (
                <span className="font-semibold text-slate-900">{diag.products.all.count} 件</span>
              )}
            </div>
            <div className="flex items-center justify-between gap-4 py-2 border-b border-slate-100">
              <span className="text-slate-600">products（is_target = true）</span>
              {diag.products.isTargetTrue.error ? (
                <span className="text-red-600 font-mono text-xs max-w-[70%] truncate" title={diag.products.isTargetTrue.error}>
                  {diag.products.isTargetTrue.error}
                </span>
              ) : (
                <span className="font-semibold text-slate-900">{diag.products.isTargetTrue.count} 件</span>
              )}
            </div>
            {diag.products.sampleColumns && (
              <div className="py-2 border-b border-slate-100">
                <span className="text-slate-600 block mb-1">products のカラム例</span>
                <p className="font-mono text-xs text-slate-500 break-all">
                  {diag.products.sampleColumns.join(', ')}
                </p>
              </div>
            )}
            <div className="flex items-center justify-between gap-4 py-2 border-b border-slate-100">
              <span className="text-slate-600">trade_histories 件数</span>
              {diag.tradeHistories.error ? (
                <span className="text-red-600 font-mono text-xs max-w-[70%] truncate" title={diag.tradeHistories.error}>
                  {diag.tradeHistories.error}
                </span>
              ) : (
                <span className="font-semibold text-slate-900">{diag.tradeHistories.count} 件</span>
              )}
            </div>
            <div className="flex items-center justify-between gap-4 py-2">
              <span className="text-slate-600">app_settings（id=1）</span>
              {diag.appSettings.error ? (
                <span className="text-red-600 font-mono text-xs max-w-[70%] truncate" title={diag.appSettings.error}>
                  {diag.appSettings.error}
                </span>
              ) : diag.appSettings.hasRow ? (
                <span className="flex items-center gap-1 text-emerald-600 font-medium">
                  <CheckCircle size={16} /> 取得可
                </span>
              ) : (
                <span className="text-slate-500">行なし</span>
              )}
            </div>
            {!diag.products.all.error && diag.products.all.count > 0 && diag.products.isTargetTrue.count === 0 && (
              <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="font-medium text-amber-800">
                  一覧に表示される条件: is_target = true
                </p>
                <p className="text-amber-700 text-xs mt-1">
                  現在、is_target が true の商品が 0 件です。Supabase の products テーブルで、表示したい行の is_target を true に更新してください。
                </p>
              </div>
            )}
          </div>
        </section>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <section className="p-6 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-900 mb-4">
            一覧表示の初期設定
          </h2>
          <p className="text-sm text-slate-500 mb-4">
            一覧を開いたときの初期の並び順と表示条件です
          </p>
          <ListPreferencesForm initial={listPreferences} />
        </section>
      </div>
    </div>
  );
}
