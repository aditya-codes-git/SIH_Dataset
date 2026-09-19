import React from 'react';

export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  onClick,
  disabled = false,
  icon: Icon,
  className = '',
  style = {},
  type = 'button',
}) => {
  const baseStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.45rem',
    fontWeight: 500,
    borderRadius: 'var(--radius-sm)',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.55 : 1,
    transition: 'var(--transition)',
    border: '1px solid transparent',
    outline: 'none',
    whiteSpace: 'nowrap',
    userSelect: 'none',
  };

  const sizes = {
    sm: { padding: '0.3125rem 0.625rem', fontSize: '0.75rem', lineHeight: '1.25' },
    md: { padding: '0.45rem 0.875rem', fontSize: '0.8125rem', lineHeight: '1.25' },
    lg: { padding: '0.625rem 1.125rem', fontSize: '0.875rem', lineHeight: '1.25' },
  };

  const variants = {
    primary: {
      backgroundColor: 'var(--primary)',
      color: '#FFFFFF',
      border: '1px solid var(--primary)',
    },
    secondary: {
      backgroundColor: 'var(--bg-secondary)',
      color: 'var(--text-primary)',
      border: '1px solid var(--border-color)',
    },
    outline: {
      backgroundColor: 'transparent',
      color: 'var(--primary)',
      border: '1px solid var(--primary-border)',
    },
    ghost: {
      backgroundColor: 'transparent',
      color: 'var(--text-secondary)',
      border: '1px solid transparent',
    },
    danger: {
      backgroundColor: 'var(--danger)',
      color: '#FFFFFF',
      border: '1px solid var(--danger)',
    },
  };

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`btn ${className}`}
      style={{
        ...baseStyle,
        ...sizes[size],
        ...variants[variant],
        ...style,
      }}
    >
      {Icon && <Icon size={size === 'sm' ? 13 : size === 'lg' ? 18 : 15} style={{ flexShrink: 0 }} />}
      {children}
    </button>
  );
};
