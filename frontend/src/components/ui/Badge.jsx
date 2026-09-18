import React from 'react';

export const Badge = ({ children, variant = 'info', size = 'md' }) => {
  const baseStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.375rem',
    fontWeight: 500,
    borderRadius: 'var(--radius-full)',
    textTransform: 'none',
    letterSpacing: '0.01em',
  };

  const sizes = {
    sm: { padding: '0.15rem 0.5rem', fontSize: '0.75rem' },
    md: { padding: '0.25rem 0.75rem', fontSize: '0.8125rem' },
    lg: { padding: '0.375rem 1rem', fontSize: '0.875rem' },
  };

  const variants = {
    success: { backgroundColor: 'var(--success-bg)', color: 'var(--success)', border: '1px solid rgba(16, 185, 129, 0.2)' },
    warning: { backgroundColor: 'var(--warning-bg)', color: 'var(--warning)', border: '1px solid rgba(245, 158, 11, 0.2)' },
    danger: { backgroundColor: 'var(--danger-bg)', color: 'var(--danger)', border: '1px solid rgba(239, 68, 68, 0.2)' },
    info: { backgroundColor: 'var(--info-bg)', color: 'var(--info)', border: '1px solid rgba(59, 130, 246, 0.2)' },
    neutral: { backgroundColor: 'var(--bg-secondary)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)' },
  };

  return (
    <span style={{ ...baseStyle, ...sizes[size], ...variants[variant] }}>
      {children}
    </span>
  );
};
