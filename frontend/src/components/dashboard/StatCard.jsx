import React from 'react';
import { Card } from '../ui/Card';

export const StatCard = ({ title, value, subtitle, icon: Icon, color = 'var(--primary)' }) => {
  return (
    <Card style={{ position: 'relative', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <span style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-secondary)' }}>
            {title}
          </span>
          <h3 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0.25rem 0' }}>
            {value}
          </h3>
          {subtitle && (
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {subtitle}
            </span>
          )}
        </div>

        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: 'var(--radius-md)',
          backgroundColor: 'var(--bg-secondary)',
          color: color,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          {Icon && <Icon size={20} />}
        </div>
      </div>
    </Card>
  );
};
