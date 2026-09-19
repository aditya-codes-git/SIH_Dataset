import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card } from '../ui/Card';

export const ReferralPieChart = ({ screenings = [], data }) => {
  const nonReferableCount = screenings.filter((s) => s.status === 'GRADABLE' && Number(s.drGrade) < 2).length;
  const referableCount = screenings.filter((s) => s.status === 'GRADABLE' && Number(s.drGrade) >= 2).length;
  const total = nonReferableCount + referableCount;

  const chartData = data || [
    { name: 'Non-Referable (< Grade 2)', value: nonReferableCount, color: 'var(--success)' },
    { name: 'Referable (≥ Grade 2)', value: referableCount, color: 'var(--danger)' },
  ];

  return (
    <Card
      title="Referral Triage Proportion"
      subtitle={total > 0 ? `${referableCount} of ${total} cases require specialist referral` : 'No gradable records recorded yet'}
    >
      <div style={{ width: '100%', height: 210, marginTop: '0.5rem', position: 'relative' }}>
        {total === 0 && !data ? (
          <div style={{
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.75rem',
            color: 'var(--text-muted)',
          }}>
            No screening cases recorded in database
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="48%"
                innerRadius={50}
                outerRadius={72}
                paddingAngle={4}
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
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--text-primary)',
                  fontSize: '0.75rem',
                  boxShadow: 'var(--shadow-sm)',
                }}
              />
              <Legend
                verticalAlign="bottom"
                height={32}
                iconType="circle"
                wrapperStyle={{ fontSize: '0.71875rem' }}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </Card>
  );
};
