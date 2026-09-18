import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card } from '../ui/Card';

export const ReferralPieChart = ({ data }) => {
  const chartData = data || [
    { name: 'Non-Referable DR (< Grade 2)', value: 180, color: 'var(--success)' },
    { name: 'Referable DR (≥ Grade 2)', value: 40, color: 'var(--danger)' },
  ];

  return (
    <Card title="Referable vs Non-Referable" subtitle="Screening decision proportion">
      <div style={{ width: '100%', height: 240, marginTop: '1rem' }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--bg-card)',
                borderColor: 'var(--border-color)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-primary)',
              }}
            />
            <Legend verticalAlign="bottom" height={36} iconType="circle" />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};
