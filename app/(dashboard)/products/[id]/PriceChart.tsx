'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

export type ChartDataPoint = { date: string; price: number };

type PriceChartProps = {
  psa10Data: ChartDataPoint[];
  baseData: ChartDataPoint[];
};

export function PriceChart({ psa10Data, baseData }: PriceChartProps) {
  const dateSet = new Set<string>();
  psa10Data.forEach((d) => dateSet.add(d.date));
  baseData.forEach((d) => dateSet.add(d.date));
  const priceByDate = new Map<string, { psa10?: number; base?: number }>();
  psa10Data.forEach((d) => {
    const cur = priceByDate.get(d.date) ?? {};
    cur.psa10 = d.price;
    priceByDate.set(d.date, cur);
  });
  baseData.forEach((d) => {
    const cur = priceByDate.get(d.date) ?? {};
    cur.base = d.price;
    priceByDate.set(d.date, cur);
  });
  const mergedData = Array.from(dateSet)
    .sort()
    .map((date) => {
      const p = priceByDate.get(date)!;
      const psa10 = p.psa10 ?? null;
      const base = p.base ?? null;
      const spread =
        psa10 != null && base != null ? psa10 - base : null;
      return {
        date,
        psa10: psa10 ?? undefined,
        base: base ?? undefined,
        spread: spread ?? undefined,
      };
    });

  const hasData = mergedData.some(
    (d) => d.psa10 !== undefined || d.base !== undefined
  );

  if (!hasData) {
    return (
      <div className="w-full h-64 flex flex-col items-center justify-center border border-dashed border-gray-300 rounded-lg bg-gray-50 text-gray-500 text-sm">
        表示できる取引データがありません
      </div>
    );
  }

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={mergedData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11 }}
            tickFormatter={(v) => {
              const d = new Date(v);
              return `${d.getMonth() + 1}/${d.getDate()}`;
            }}
          />
          <YAxis
            tick={{ fontSize: 11 }}
            tickFormatter={(v) => `¥${(v / 1000).toFixed(0)}k`}
          />
          <Tooltip
            formatter={(value: number | undefined) => [`¥${value != null ? value.toLocaleString() : ''}`, '']}
            labelFormatter={(label) => new Date(label).toLocaleDateString('ja-JP')}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="psa10"
            name="PSA10"
            stroke="#2563eb"
            strokeWidth={2}
            dot={false}
            connectNulls
          />
          <Line
            type="monotone"
            dataKey="base"
            name="素体"
            stroke="#6b7280"
            strokeWidth={2}
            dot={false}
            connectNulls
          />
          <Line
            type="monotone"
            dataKey="spread"
            name="スプレッド (PSA10-素体)"
            stroke="#059669"
            strokeWidth={1.5}
            strokeDasharray="4 4"
            dot={false}
            connectNulls
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
