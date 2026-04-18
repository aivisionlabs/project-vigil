import React from 'react';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { AssetDeclaration } from '../types';
import { SourceLink } from './SourceLink';

interface AssetGrowthChartProps {
  data: AssetDeclaration[];
}

function formatCrore(amount: number): string {
  if (amount >= 10000000) return `${(amount / 10000000).toFixed(2)} Cr`;
  if (amount >= 100000) return `${(amount / 100000).toFixed(2)} L`;
  return amount.toLocaleString('en-IN');
}

function formatYAxisCrore(amount: number): string {
  if (amount >= 10000000) return `${(amount / 10000000).toFixed(0)} Cr`;
  if (amount >= 100000) return `${(amount / 100000).toFixed(0)} L`;
  if (amount >= 1000) return `${(amount / 1000).toFixed(0)}K`;
  return `${amount}`;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;

  const assets = payload.find((p: any) => p.dataKey === 'totalAssets');
  const liabilities = payload.find((p: any) => p.dataKey === 'liabilities');
  const growth = payload.find((p: any) => p.dataKey === 'growthPct');

  return (
    <div className="bg-surface-primary p-3 rounded-lg border border-surface-border text-sm shadow-lg">
      <p className="font-semibold text-text-primary mb-2 font-data">{label}</p>
      {assets && (
        <p className="font-data text-xs mb-1">
          <span className="inline-block w-2.5 h-2.5 rounded-sm mr-1.5" style={{ background: '#e8963e' }} />
          Assets: <span className="font-semibold text-accent">Rs {formatCrore(assets.value)}</span>
        </p>
      )}
      {liabilities && liabilities.value > 0 && (
        <p className="font-data text-xs mb-1">
          <span className="inline-block w-2.5 h-2.5 rounded-sm mr-1.5" style={{ background: '#ef4444' }} />
          Liabilities: <span className="font-semibold text-status-danger">Rs {formatCrore(liabilities.value)}</span>
        </p>
      )}
      {growth !== undefined && growth.value !== null && (
        <p className="font-data text-xs text-text-tertiary mt-1.5 pt-1.5 border-t border-surface-border">
          Growth from base: <span className={`font-semibold ${growth.value > 0 ? 'text-status-clean' : 'text-status-danger'}`}>
            {growth.value > 0 ? '+' : ''}{Number(growth.value).toFixed(1)}%
          </span>
        </p>
      )}
    </div>
  );
};

export const AssetGrowthChart: React.FC<AssetGrowthChartProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="bg-surface-secondary border border-surface-border p-5 rounded-card">
        <h3 className="text-lg font-semibold text-text-primary mb-4">Asset Declaration History</h3>
        <div className="text-center py-8">
          <svg className="w-10 h-10 text-surface-border mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75z" />
          </svg>
          <p className="text-text-secondary text-sm">No asset declaration data available.</p>
          <p className="text-xs text-text-tertiary mt-1">Data may not be found in the public affidavit.</p>
        </div>
      </div>
    );
  }

  if (data.length === 1) {
    const d = data[0];
    return (
      <div className="bg-surface-secondary border border-surface-border p-5 rounded-card">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-text-primary">Asset Declaration ({d.year})</h3>
          <SourceLink url={d.sourceUrl} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="bg-surface-primary p-4 rounded-lg border border-surface-border">
            <p className="text-xs text-text-tertiary mb-1">Total Assets</p>
            <p className="text-xl font-bold text-accent font-data">Rs {formatCrore(d.totalAssets)}</p>
          </div>
          <div className="bg-surface-primary p-4 rounded-lg border border-surface-border">
            <p className="text-xs text-text-tertiary mb-1">Liabilities</p>
            <p className="text-xl font-bold text-text-primary font-data">
              {d.liabilities > 0 ? `Rs ${formatCrore(d.liabilities)}` : 'Nil'}
            </p>
          </div>
        </div>
        <p className="text-xs text-text-tertiary mt-4">
          Only one affidavit found. Growth chart requires data from multiple elections.
        </p>
      </div>
    );
  }

  const sorted = [...data].sort((a, b) => a.year - b.year);
  const baseAssets = sorted[0].totalAssets;
  const latestAssets = sorted[sorted.length - 1].totalAssets;
  const totalGrowth = baseAssets > 0 ? ((latestAssets - baseAssets) / baseAssets) * 100 : 0;
  const hasLiabilities = sorted.some(d => d.liabilities > 0);
  const yearSpan = sorted[sorted.length - 1].year - sorted[0].year;

  const chartData = sorted.map((d) => ({
    year: d.year.toString(),
    totalAssets: d.totalAssets,
    liabilities: d.liabilities,
    growthPct: baseAssets > 0 ? parseFloat((((d.totalAssets - baseAssets) / baseAssets) * 100).toFixed(1)) : null,
  }));

  return (
    <div className="bg-surface-secondary border border-surface-border p-5 rounded-card">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4">
        <div>
          <h3 className="text-lg font-semibold text-text-primary">Asset & Liability Growth</h3>
          <p className="text-xs text-text-tertiary mt-0.5">
            {sorted.length} declarations over {yearSpan} years ({sorted[0].year} - {sorted[sorted.length - 1].year})
          </p>
        </div>
        <SourceLink url={sorted[sorted.length - 1].sourceUrl} />
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-5">
        <div className="bg-surface-primary p-3 rounded-lg border border-surface-border">
          <p className="text-xs text-text-tertiary">Base ({sorted[0].year})</p>
          <p className="text-sm font-bold text-text-primary font-data">Rs {formatCrore(sorted[0].totalAssets)}</p>
        </div>
        <div className="bg-surface-primary p-3 rounded-lg border border-surface-border">
          <p className="text-xs text-text-tertiary">Latest ({sorted[sorted.length - 1].year})</p>
          <p className="text-sm font-bold text-accent font-data">Rs {formatCrore(latestAssets)}</p>
        </div>
        <div className="bg-surface-primary p-3 rounded-lg border border-surface-border">
          <p className="text-xs text-text-tertiary">Total Growth</p>
          <p className={`text-sm font-bold font-data ${totalGrowth > 100 ? 'text-status-danger' : totalGrowth > 0 ? 'text-status-clean' : 'text-text-primary'}`}>
            {totalGrowth > 0 ? '+' : ''}{totalGrowth.toFixed(1)}%
          </p>
        </div>
        <div className="bg-surface-primary p-3 rounded-lg border border-surface-border">
          <p className="text-xs text-text-tertiary">Net Liabilities</p>
          <p className="text-sm font-bold text-text-primary font-data">
            {sorted[sorted.length - 1].liabilities > 0 ? `Rs ${formatCrore(sorted[sorted.length - 1].liabilities)}` : 'Nil'}
          </p>
        </div>
      </div>

      {/* Chart */}
      <div style={{ width: '100%', height: 320 }}>
        <ResponsiveContainer>
          <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2a3140" strokeOpacity={0.5} />
            <XAxis dataKey="year" stroke="#64748b" fontSize={12} />
            <YAxis
              yAxisId="amount"
              tickFormatter={formatYAxisCrore}
              stroke="#64748b"
              width={55}
              fontSize={11}
            />
            <YAxis
              yAxisId="pct"
              orientation="right"
              tickFormatter={(v: number) => `${v}%`}
              stroke="#64748b"
              width={45}
              fontSize={11}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }} />
            <Bar
              yAxisId="amount"
              dataKey="totalAssets"
              name="Total Assets"
              fill="#e8963e"
              radius={[4, 4, 0, 0]}
              barSize={sorted.length <= 4 ? 40 : 28}
            />
            {hasLiabilities && (
              <Bar
                yAxisId="amount"
                dataKey="liabilities"
                name="Liabilities"
                fill="#ef4444"
                radius={[4, 4, 0, 0]}
                barSize={sorted.length <= 4 ? 40 : 28}
              />
            )}
            <Line
              yAxisId="pct"
              type="monotone"
              dataKey="growthPct"
              name="Growth %"
              stroke="#22d3ee"
              strokeWidth={2}
              dot={{ r: 4, fill: '#22d3ee' }}
              activeDot={{ r: 6 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <p className="text-xs text-text-tertiary mt-3">
        Data sourced from self-declared affidavits filed with the Election Commission of India via myneta.info.
      </p>
    </div>
  );
};
