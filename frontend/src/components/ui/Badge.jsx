import React from 'react';

export const Badge = ({ children, variant = 'info', size = 'md' }) => {
  const baseStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.375rem',
    fontWeight: 600,
    borderRadius: 'var(--radius-sm)',
    letterSpacing: '0.02em',
    lineHeight: 1.2,
    whiteSpace: 'nowrap',
  };

  const sizes = {
    sm: { padding: '0.2rem 0.45rem', fontSize: '0.6875rem' },
    md: { padding: '0.25rem 0.55rem', fontSize: '0.75rem' },
    lg: { padding: '0.35rem 0.75rem', fontSize: '0.8125rem' },
  };

  const variants = {
    success: {
      backgroundColor: 'var(--success-bg)',
      color: 'var(--success)',
      border: '1px solid var(--success-border)',
    },
    warning: {
      backgroundColor: 'var(--warning-bg)',
      color: 'var(--warning)',
      border: '1px solid var(--warning-border)',
    },
    danger: {
      backgroundColor: 'var(--danger-bg)',
      color: 'var(--danger)',
      border: '1px solid var(--danger-border)',
    },
    info: {
      backgroundColor: 'var(--info-bg)',
      color: 'var(--info)',
      border: '1px solid var(--info-border)',
    },
    neutral: {
      backgroundColor: 'var(--bg-secondary)',
      color: 'var(--text-secondary)',
      border: '1px solid var(--border-color)',
    },
  };

  return (
    <span style={{ ...baseStyle, ...sizes[size], ...variants[variant] }}>
      {children}
    </span>
  );
};
