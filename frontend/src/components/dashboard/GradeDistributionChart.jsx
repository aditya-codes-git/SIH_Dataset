import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Card } from '../ui/Card';

export const GradeDistributionChart = ({ data }) => {
  const chartData = data || [
    { grade: 'Grade 0', count: 142, color: 'var(--success)' },
    { grade: 'Grade 1', count: 38, color: '#3B82F6' },
    { grade: 'Grade 2', count: 24, color: '#F59E0B' },
    { grade: 'Grade 3', count: 11, color: '#EF4444' },
    { grade: 'Grade 4', count: 5, color: '#991B1B' },
  ];

  return (
    <Card title="DR Grade Distribution" subtitle="Breakdown of screening results across Grade 0 to Grade 4">
      <div style={{ width: '100%', height: 240, marginTop: '1rem' }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <XAxis dataKey="grade" stroke="var(--text-secondary)" fontSize={12} tickLine={false} />
            <YAxis stroke="var(--text-secondary)" fontSize={12} tickLine={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--bg-card)',
                borderColor: 'var(--border-color)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-primary)',
              }}
            />
            <Bar dataKey="count" radius={[6, 6, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color || 'var(--primary)'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};
