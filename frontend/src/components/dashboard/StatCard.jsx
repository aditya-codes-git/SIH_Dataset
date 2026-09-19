import React from 'react';
import { Card } from '../ui/Card';

export const StatCard = ({ title, value, subtitle, icon: Icon, color = 'var(--primary)' }) => {
  return (
    <Card style={{
      padding: '0.875rem 1rem',
      borderLeft: `3px solid ${color}`,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
        <span style={{
          fontSize: '0.6875rem',
          fontWeight: 600,
          color: 'var(--text-secondary)',
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
        }}>
          {title}
        </span>
        {Icon && (
          <div style={{
            width: '24px',
            height: '24px',
            borderRadius: 'var(--radius-xs)',
            backgroundColor: 'var(--bg-secondary)',
            color: color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}>
            <Icon size={14} />
          </div>
        )}
      </div>

      <div style={{ marginTop: '0.35rem' }}>
        <div style={{
          fontSize: '1.5rem',
          fontWeight: 700,
          color: 'var(--text-primary)',
          letterSpacing: '-0.02em',
          lineHeight: 1.1,
        }}>
          {value}
        </div>
        {subtitle && (
          <span style={{
            fontSize: '0.6875rem',
            color: 'var(--text-muted)',
            display: 'block',
            marginTop: '0.2rem',
          }}>
            {subtitle}
          </span>
        )}
      </div>
    </Card>
  );
};
