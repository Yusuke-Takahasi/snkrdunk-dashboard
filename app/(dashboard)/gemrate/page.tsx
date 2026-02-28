import { supabase } from '../../../utils/supabase';
import Link from 'next/link';
import { Link2, Table, ExternalLink } from 'lucide-react';
import { ManualLinkRow } from './ManualLinkRow';
import { AddMappingForm } from './AddMappingForm';

export const metadata = {
  title: 'GemRate紐付け',
};

export const revalidate = 0;

type GemrateMappingRow = {
  series_name: string;
  gemrate_url: string;
};

function parseSeriesName(seriesName: string): { packName: string; releaseYear: string } {
  const pipeIndex = seriesName.indexOf('|');
  if (pipeIndex >= 0) {
    return {
      packName: seriesName.slice(0, pipeIndex).trim(),
      releaseYear: seriesName.slice(pipeIndex + 1).trim(),
    };
  }
  return { packName: seriesName.trim(), releaseYear: '—' };
}

const GEMRATE_STATS_PAGE_SIZE = 1000;

export default async function GemRatePage() {
  const { data: mappingsRows } = await supabase
    .from('gemrate_mappings')
    .select('series_name, gemrate_url')
    .order('series_name');

  const statsList: { series_name?: string | null }[] = [];
  let offset = 0;
  while (true) {
    const { data: page } = await supabase
      .from('gemrate_stats')
      .select('series_name')
      .range(offset, offset + GEMRATE_STATS_PAGE_SIZE - 1)
      .order('series_name', { ascending: true });
    const rows = page ?? [];
    statsList.push(...rows);
    if (rows.length < GEMRATE_STATS_PAGE_SIZE) break;
    offset += GEMRATE_STATS_PAGE_SIZE;
  }

  const mappings = (mappingsRows ?? []) as GemrateMappingRow[];

  const countBySeries = new Map<string, number>();
  const distinctSeries = new Set<string>();
  for (const row of statsList) {
    const s = (row.series_name ?? '').trim();
    if (!s) continue;
    distinctSeries.add(s);
    countBySeries.set(s, (countBySeries.get(s) ?? 0) + 1);
  }

  const mappingsBySeries = new Map(mappings.map((m) => [m.series_name.trim(), m.gemrate_url]));
  const allSeriesSorted = Array.from(distinctSeries).sort();

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Link2 size={28} /> Gem Rate 紐付け
        </h1>
        <p className="text-slate-500 mt-1">
          パックと Gemrate URL の紐付けを確認・編集できます。手動紐付けで URL を登録すると DB（gemrate_mappings）を更新します。
        </p>
      </div>

      <section className="mb-10">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-4">
          <Table size={22} /> gemrate_mappings に追加
        </h2>
        <p className="text-sm text-slate-500 mb-4">
          パック名・発売年・Gemrate URL を入力して登録すると、gemrate_mappings に追加されます（series_name は「パック名|発売年」で保存）。既に同じ series_name がある場合は URL が更新されます。
        </p>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <AddMappingForm />
        </div>
      </section>

      <section className="mb-10">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-4">
          <Table size={22} /> 取得済みパック
        </h2>
        <p className="text-sm text-slate-500 mb-4">
          gemrate_mappings に登録済みのパックと、gemrate_stats の該当行数です。
        </p>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {mappings.length > 0 ? (
            <div className="overflow-x-auto max-h-96 overflow-y-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 sticky top-0">
                  <tr>
                    <th className="p-4 font-medium">パック名</th>
                    <th className="p-4 font-medium">発売年</th>
                    <th className="p-4 font-medium">登録済みCSV行数</th>
                    <th className="p-4 font-medium">Gemrate URL</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {mappings.map((row) => {
                    const { packName, releaseYear } = parseSeriesName(row.series_name);
                    const count = countBySeries.get(row.series_name.trim()) ?? 0;
                    return (
                      <tr key={row.series_name} className="hover:bg-slate-50">
                        <td className="p-4 font-medium text-slate-900">{packName}</td>
                        <td className="p-4 text-slate-700">{releaseYear}</td>
                        <td className="p-4 tabular-nums text-slate-700">{count}</td>
                        <td className="p-4">
                          <a
                            href={row.gemrate_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline inline-flex items-center gap-1"
                          >
                            <ExternalLink size={14} /> 開く
                          </a>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center text-slate-500">
              取得済みパックはありません。手動紐付けで URL を登録してください。
            </div>
          )}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-4">
          <Table size={22} /> 手動紐付け修正
        </h2>
        <p className="text-sm text-slate-500 mb-4">
          パックごとに Gemrate URL を入力して「登録」で gemrate_mappings を更新します。既に登録済みのパックもここで URL を変更できます。
        </p>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {allSeriesSorted.length > 0 ? (
            <div className="overflow-x-auto max-h-[28rem] overflow-y-auto">
              <table className="w-full text-left text-sm table-fixed">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 sticky top-0">
                  <tr>
                    <th className="p-4 font-medium w-[28%]">パック名</th>
                    <th className="p-4 font-medium w-[10%]">発売年</th>
                    <th className="p-4 font-medium w-[62%]">Gemrate URL</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {allSeriesSorted.map((seriesName) => {
                    const { packName, releaseYear } = parseSeriesName(seriesName);
                    const initialUrl =
                      mappingsBySeries.get(seriesName) ??
                      mappingsBySeries.get(seriesName.replace(/\|/g, '\uFF5C'));
                    return (
                      <ManualLinkRow
                        key={seriesName}
                        seriesName={seriesName}
                        packName={packName}
                        releaseYear={releaseYear}
                        initialUrl={initialUrl}
                      />
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center text-slate-500">
              gemrate_stats にデータがありません。
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
