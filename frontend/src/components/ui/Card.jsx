import React from 'react';

export const Card = ({ children, className = '', style = {}, title, action, subtitle, headerBorder = false }) => {
  return (
    <div
      className={`card ${className}`}
      style={{
        backgroundColor: 'var(--bg-card)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-color)',
        boxShadow: 'var(--shadow-sm)',
        padding: '1rem 1.125rem',
        transition: 'var(--transition)',
        ...style,
      }}
    >
      {(title || subtitle || action) && (
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '0.875rem',
          paddingBottom: headerBorder ? '0.625rem' : 0,
          borderBottom: headerBorder ? '1px solid var(--border-color)' : 'none',
          gap: '0.75rem',
        }}>
          <div>
            {title && (
              <h3 style={{
                fontSize: '0.9375rem',
                fontWeight: 600,
                color: 'var(--text-primary)',
                margin: 0,
                letterSpacing: '-0.01em',
              }}>
                {title}
              </h3>
            )}
            {subtitle && (
              <p style={{
                fontSize: '0.75rem',
                color: 'var(--text-secondary)',
                marginTop: '0.15rem',
                marginBottom: 0,
              }}>
                {subtitle}
              </p>
            )}
          </div>
          {action && <div style={{ flexShrink: 0 }}>{action}</div>}
        </div>
      )}
      {children}
    </div>
  );
};
