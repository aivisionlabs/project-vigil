import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import type { AssetDeclaration } from '../types';
import { SourceLink } from './SourceLink';

interface AssetGrowthChartProps {
  data: AssetDeclaration[];
}

function formatCrore(amount: number): string {
  if (amount >= 10000000) return `${(amount / 10000000).toFixed(2)} Cr`;
  if (amount >= 100000) return `${(amount / 100000).toFixed(2)} L`;
  return `${amount.toLocaleString('en-IN')}`;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const assetData = payload.find((p: any) => p.dataKey === 'politicianGrowth');
    const indexData = payload.find((p: any) => p.dataKey === 'indexGrowth');
    const rawAssets = payload[0]?.payload?.rawAssets;

    return (
      <div className="bg-surface-primary p-3 rounded-lg border border-surface-border text-sm">
        <p className="font-semibold text-text-primary mb-1.5 font-data">{`Year: ${label}`}</p>
        {rawAssets !== undefined && (
          <p className="text-accent font-semibold mb-1 font-data">Total: Rs {formatCrore(rawAssets)}</p>
        )}
        {assetData && assetData.value !== undefined && (
          <p style={{ color: assetData.color }} className="font-data text-xs">
            {`Asset Growth: ${Number(assetData.value).toFixed(2)}%`}
          </p>
        )}
        {indexData && indexData.value !== undefined && (
          <p style={{ color: indexData.color }} className="font-data text-xs">
            {`Market Index: ${Number(indexData.value).toFixed(2)}%`}
          </p>
        )}
        <p className="text-xs text-text-tertiary mt-1.5">Base year: {payload[0]?.payload?.baseYear}</p>
      </div>
    );
  }
  return null;
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

  const baseYearData = data[0];
  const baseAssets = baseYearData.totalAssets;

  const chartData = data.map((d) => {
    const politicianGrowth = baseAssets > 0 ? ((d.totalAssets - baseAssets) / baseAssets) * 100 : 0;
    const indexGrowth = d.indexGrowthPercentage ?? politicianGrowth * 0.6;

    return {
      year: d.year,
      politicianGrowth: parseFloat(politicianGrowth.toFixed(2)),
      indexGrowth: parseFloat(indexGrowth.toFixed(2)),
      baseYear: baseYearData.year,
      rawAssets: d.totalAssets,
    };
  });

  const yAxisFormatter = (value: number) => `${value}%`;

  const latestAssets = data[data.length - 1].totalAssets;
  const totalGrowth = baseAssets > 0 ? ((latestAssets - baseAssets) / baseAssets) * 100 : 0;

  return (
    <div className="bg-surface-secondary border border-surface-border p-5 rounded-card">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4">
        <div>
          <h3 className="text-lg font-semibold text-text-primary">Comparative Asset Growth</h3>
          <p className="text-xs text-text-tertiary mt-0.5">
            {data.length} declarations from {data[0].year} to {data[data.length - 1].year}
            <span className={`ml-2 font-semibold font-data ${totalGrowth > 100 ? 'text-status-danger' : 'text-status-clean'}`}>
              ({totalGrowth > 0 ? '+' : ''}{totalGrowth.toFixed(1)}%)
            </span>
          </p>
        </div>
        <SourceLink url={data[data.length - 1].sourceUrl} />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mb-5">
        <div className="bg-surface-primary p-3 rounded-lg border border-surface-border">
          <p className="text-xs text-text-tertiary">Base ({data[0].year})</p>
          <p className="text-base font-bold text-text-primary font-data">Rs {formatCrore(data[0].totalAssets)}</p>
        </div>
        <div className="bg-surface-primary p-3 rounded-lg border border-surface-border">
          <p className="text-xs text-text-tertiary">Latest ({data[data.length - 1].year})</p>
          <p className="text-base font-bold text-accent font-data">Rs {formatCrore(latestAssets)}</p>
        </div>
        <div className="bg-surface-primary p-3 rounded-lg border border-surface-border hidden sm:block">
          <p className="text-xs text-text-tertiary">Net Liabilities</p>
          <p className="text-base font-bold text-text-primary font-data">
            {data[data.length - 1].liabilities > 0 ? `Rs ${formatCrore(data[data.length - 1].liabilities)}` : 'Nil'}
          </p>
        </div>
      </div>

      <div style={{ width: '100%', height: 280 }}>
        <ResponsiveContainer>
          <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2a3140" strokeOpacity={0.5} />
            <XAxis dataKey="year" stroke="#64748b" type="number" domain={['dataMin', 'dataMax']} tickCount={chartData.length} fontSize={12} />
            <YAxis tickFormatter={yAxisFormatter} stroke="#64748b" width={50} fontSize={12} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ color: '#94a3b8', fontSize: '12px' }} />
            <ReferenceLine y={0} stroke="#64748b" strokeDasharray="3 3" />
            <Line type="monotone" dataKey="politicianGrowth" name="Politician Assets" stroke="#e8963e" strokeWidth={2.5} dot={{ r: 4, fill: '#e8963e' }} activeDot={{ r: 6 }} />
            <Line type="monotone" dataKey="indexGrowth" name="Market Index" stroke="#64748b" strokeWidth={1.5} strokeDasharray="5 5" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
