import { Settings as SettingsIcon, Database, AlertCircle, CheckCircle } from 'lucide-react';
import { runSupabaseDiagnostics } from '../../../utils/supabaseDiagnostics';

export const metadata = {
  title: '設定 | スニダン監視Dashboard',
  description: '一覧表示の初期設定',
};

export default async function SettingsPage() {
  const diag = await runSupabaseDiagnostics();

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <SettingsIcon size={28} /> 設定
        </h1>
        <p className="text-slate-500 mt-1">
          一覧表示の初期設定を変更できます
        </p>
      </div>

      {/* データ接続診断 */}
      <section className="mb-8 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Database size={20} /> データ接続診断
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Supabase から商品データが取得できるか確認します
          </p>
        </div>
        <div className="p-5 space-y-4 text-sm">
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

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <section className="p-6 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-900 mb-4">
            一覧表示の初期設定
          </h2>
          <div className="space-y-4">
            <label className="flex items-center justify-between gap-4 p-4 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors">
              <span className="text-sm font-medium text-slate-700">
                表示順（初期）
              </span>
              <select
                className="text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none"
                defaultValue="updated_at_desc"
              >
                <option value="updated_at_desc">更新日時が新しい順</option>
                <option value="expected_profit_desc">予想利益が高い順</option>
                <option value="roi_desc">ROIが高い順</option>
                <option value="release_date_desc">発売日が新しい順</option>
              </select>
            </label>
            <label className="flex items-center justify-between gap-4 p-4 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors">
              <span className="text-sm font-medium text-slate-700">
                1ページあたりの表示件数
              </span>
              <select
                className="text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none"
                defaultValue="24"
              >
                <option value="12">12件</option>
                <option value="24">24件</option>
                <option value="48">48件</option>
                <option value="96">96件</option>
              </select>
            </label>
            <label className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors">
              <input
                type="checkbox"
                defaultChecked
                className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-slate-700">
                非表示にした商品を一覧に含めない
              </span>
            </label>
            <label className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors">
              <input
                type="checkbox"
                defaultChecked
                className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-slate-700">
                お気に入りのみ表示（オフで全件表示）
              </span>
            </label>
          </div>
          <p className="text-xs text-slate-400 mt-4">
            ※ 設定の保存はローカルストレージまたは将来のAPI連携で反映されます
          </p>
        </section>
      </div>
    </div>
  );
}
