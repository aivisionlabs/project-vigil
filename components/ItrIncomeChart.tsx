import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { ItrIncome } from '../types';

interface ItrIncomeChartProps {
  data: ItrIncome[];
}

function formatLacs(amount: number): string {
  if (amount >= 10000000) return `${(amount / 10000000).toFixed(2)} Cr`;
  if (amount >= 100000) return `${(amount / 100000).toFixed(2)} L`;
  if (amount >= 1000) return `${(amount / 1000).toFixed(0)}K`;
  return amount.toLocaleString('en-IN');
}

function formatYAxis(amount: number): string {
  if (amount >= 10000000) return `${(amount / 10000000).toFixed(0)} Cr`;
  if (amount >= 100000) return `${(amount / 100000).toFixed(0)} L`;
  if (amount >= 1000) return `${(amount / 1000).toFixed(0)}K`;
  return `${amount}`;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;

  const self = payload.find((p: any) => p.dataKey === 'selfIncome');
  const spouse = payload.find((p: any) => p.dataKey === 'spouseIncome');
  const huf = payload.find((p: any) => p.dataKey === 'hufIncome');
  const total = payload[0]?.payload?.totalIncome;

  return (
    <div className="bg-surface-primary p-3 rounded-lg border border-surface-border text-sm shadow-lg">
      <p className="font-semibold text-text-primary mb-2 font-data">FY {label}</p>
      {self && self.value > 0 && (
        <p className="font-data text-xs mb-1">
          <span className="inline-block w-2.5 h-2.5 rounded-sm mr-1.5" style={{ background: '#3b82f6' }} />
          Self: <span className="font-semibold">Rs {formatLacs(self.value)}</span>
        </p>
      )}
      {spouse && spouse.value > 0 && (
        <p className="font-data text-xs mb-1">
          <span className="inline-block w-2.5 h-2.5 rounded-sm mr-1.5" style={{ background: '#a855f7' }} />
          Spouse: <span className="font-semibold">Rs {formatLacs(spouse.value)}</span>
        </p>
      )}
      {huf && huf.value > 0 && (
        <p className="font-data text-xs mb-1">
          <span className="inline-block w-2.5 h-2.5 rounded-sm mr-1.5" style={{ background: '#14b8a6' }} />
          HUF: <span className="font-semibold">Rs {formatLacs(huf.value)}</span>
        </p>
      )}
      {total > 0 && (
        <p className="font-data text-xs mt-1.5 pt-1.5 border-t border-surface-border font-semibold text-accent">
          Total: Rs {formatLacs(total)}
        </p>
      )}
    </div>
  );
};

export const ItrIncomeChart: React.FC<ItrIncomeChartProps> = ({ data }) => {
  if (!data || data.length === 0) return null;

  const sorted = [...data].sort((a, b) => a.financialYear.localeCompare(b.financialYear));
  const hasSpouse = sorted.some(d => d.spouseIncome > 0);
  const hasHuf = sorted.some(d => d.hufIncome > 0);

  const latestTotal = sorted[sorted.length - 1].totalIncome;
  const earliestTotal = sorted[0].totalIncome;
  const incomeGrowth = earliestTotal > 0 ? ((latestTotal - earliestTotal) / earliestTotal) * 100 : 0;

  const chartData = sorted.map(d => ({
    fy: d.financialYear,
    selfIncome: d.selfIncome,
    spouseIncome: d.spouseIncome,
    hufIncome: d.hufIncome,
    totalIncome: d.totalIncome,
  }));

  return (
    <div className="bg-surface-secondary border border-surface-border p-5 rounded-card">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4">
        <div>
          <h3 className="text-lg font-semibold text-text-primary">Income Tax Returns (ITR)</h3>
          <p className="text-xs text-text-tertiary mt-0.5">
            {sorted.length} years — FY {sorted[0].financialYear} to {sorted[sorted.length - 1].financialYear}
            {incomeGrowth !== 0 && (
              <span className={`ml-2 font-semibold font-data ${incomeGrowth > 0 ? 'text-status-clean' : 'text-status-danger'}`}>
                ({incomeGrowth > 0 ? '+' : ''}{incomeGrowth.toFixed(1)}%)
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mb-5">
        <div className="bg-surface-primary p-3 rounded-lg border border-surface-border">
          <p className="text-xs text-text-tertiary">Latest Self Income</p>
          <p className="text-sm font-bold text-text-primary font-data">Rs {formatLacs(sorted[sorted.length - 1].selfIncome)}</p>
        </div>
        {hasSpouse && (
          <div className="bg-surface-primary p-3 rounded-lg border border-surface-border">
            <p className="text-xs text-text-tertiary">Latest Spouse Income</p>
            <p className="text-sm font-bold text-text-primary font-data">Rs {formatLacs(sorted[sorted.length - 1].spouseIncome)}</p>
          </div>
        )}
        <div className="bg-surface-primary p-3 rounded-lg border border-surface-border">
          <p className="text-xs text-text-tertiary">Latest Total Income</p>
          <p className="text-sm font-bold text-accent font-data">Rs {formatLacs(latestTotal)}</p>
        </div>
      </div>

      {/* Chart */}
      <div style={{ width: '100%', height: 280 }}>
        <ResponsiveContainer>
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2a3140" strokeOpacity={0.5} />
            <XAxis dataKey="fy" stroke="#64748b" fontSize={11} />
            <YAxis tickFormatter={formatYAxis} stroke="#64748b" width={50} fontSize={11} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }} />
            <Bar
              dataKey="selfIncome"
              name="Self"
              fill="#3b82f6"
              stackId="income"
              radius={hasSpouse || hasHuf ? undefined : [4, 4, 0, 0]}
            />
            {hasSpouse && (
              <Bar
                dataKey="spouseIncome"
                name="Spouse"
                fill="#a855f7"
                stackId="income"
              />
            )}
            {hasHuf && (
              <Bar
                dataKey="hufIncome"
                name="HUF"
                fill="#14b8a6"
                stackId="income"
                radius={[4, 4, 0, 0]}
              />
            )}
          </BarChart>
        </ResponsiveContainer>
      </div>

      <p className="text-xs text-text-tertiary mt-3">
        Income as declared in ITR filed with election affidavit. Source: myneta.info
      </p>
    </div>
  );
};
