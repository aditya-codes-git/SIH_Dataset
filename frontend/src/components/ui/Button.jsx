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
    gap: '0.5rem',
    fontWeight: 500,
    borderRadius: 'var(--radius-md)',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.6 : 1,
    transition: 'var(--transition)',
    border: 'none',
    outline: 'none',
  };

  const sizes = {
    sm: { padding: '0.375rem 0.75rem', fontSize: '0.8125rem' },
    md: { padding: '0.5rem 1rem', fontSize: '0.875rem' },
    lg: { padding: '0.75rem 1.5rem', fontSize: '1rem' },
  };

  const variants = {
    primary: { backgroundColor: 'var(--primary)', color: '#FFFFFF' },
    secondary: { backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' },
    outline: { backgroundColor: 'transparent', color: 'var(--primary)', border: '1px solid var(--primary)' },
    ghost: { backgroundColor: 'transparent', color: 'var(--text-secondary)' },
    danger: { backgroundColor: 'var(--danger)', color: '#FFFFFF' },
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
      {Icon && <Icon size={size === 'sm' ? 14 : size === 'lg' ? 20 : 16} />}
      {children}
    </button>
  );
};
