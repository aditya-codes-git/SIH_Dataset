import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Card } from '../ui/Card';

export const GradeDistributionChart = ({ screenings = [], data }) => {
  // Derive real statistics strictly from actual database screenings
  const chartData = data || [
    {
      grade: 'Grade 0',
      count: screenings.filter((s) => s.status === 'GRADABLE' && (s.drGrade === 0 || s.grade === 0)).length,
      color: 'var(--success)',
      label: 'No Apparent DR',
    },
    {
      grade: 'Grade 1',
      count: screenings.filter((s) => s.status === 'GRADABLE' && (s.drGrade === 1 || s.grade === 1)).length,
      color: '#0284C7',
      label: 'Mild NPDR',
    },
    {
      grade: 'Grade 2',
      count: screenings.filter((s) => s.status === 'GRADABLE' && (s.drGrade === 2 || s.grade === 2)).length,
      color: '#D97706',
      label: 'Moderate NPDR',
    },
    {
      grade: 'Grade 3',
      count: screenings.filter((s) => s.status === 'GRADABLE' && (s.drGrade === 3 || s.grade === 3)).length,
      color: '#EA580C',
      label: 'Severe NPDR',
    },
    {
      grade: 'Grade 4',
      count: screenings.filter((s) => s.status === 'GRADABLE' && (s.drGrade === 4 || s.grade === 4)).length,
      color: '#DC2626',
      label: 'Proliferative DR',
    },
  ];

  const totalGradable = chartData.reduce((acc, curr) => acc + curr.count, 0);

  return (
    <Card
      title="DR Grade Distribution"
      subtitle={`Based on ${totalGradable} gradable screening record(s)`}
    >
      <div style={{ width: '100%', height: 210, marginTop: '0.5rem' }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
            <XAxis
              dataKey="grade"
              stroke="var(--text-secondary)"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: 'var(--border-color)' }}
            />
            <YAxis
              stroke="var(--text-secondary)"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: 'var(--border-color)' }}
              allowDecimals={false}
            />
            <Tooltip
              formatter={(val, name, item) => [`${val} cases`, item.payload.label]}
              contentStyle={{
                backgroundColor: 'var(--bg-card)',
                borderColor: 'var(--border-color)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-primary)',
                fontSize: '0.75rem',
                boxShadow: 'var(--shadow-sm)',
              }}
            />
            <Bar dataKey="count" radius={[3, 3, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};
