import React from 'react';
import { ShieldCheck, Stethoscope, UserCheck, PanelLeftOpen } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { useAuth } from '../../context/AuthContext';

export const Header = ({ title, subtitle, dbConnected = true, isCollapsed, toggleSidebar }) => {
  const { role } = useAuth();

  return (
    <header style={{
      height: '56px',
      padding: '0 1.25rem',
      backgroundColor: 'var(--bg-header)',
      borderBottom: '1px solid var(--border-color)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 10,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        {/* If collapsed, provide quick expand toggle button in header */}
        {isCollapsed && (
          <button
            onClick={toggleSidebar}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '28px',
              height: '28px',
              borderRadius: 'var(--radius-xs)',
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              transition: 'var(--transition)',
            }}
            title="Expand sidebar"
            aria-label="Expand sidebar"
          >
            <PanelLeftOpen size={15} />
          </button>
        )}

        <div>
          <h2 style={{
            fontSize: '1rem',
            fontWeight: 600,
            color: 'var(--text-primary)',
            margin: 0,
            letterSpacing: '-0.01em',
            lineHeight: 1.2,
          }}>
            {title}
          </h2>
          {subtitle && (
            <p style={{
              fontSize: '0.6875rem',
              color: 'var(--text-secondary)',
              margin: 0,
              marginTop: '1px',
            }}>
              {subtitle}
            </p>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
        {/* Model Pipeline Status */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.35rem',
          fontSize: '0.71875rem',
          color: 'var(--text-secondary)',
          padding: '0.2rem 0.5rem',
          backgroundColor: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border-color)',
        }}>
          <ShieldCheck size={13} color="var(--primary)" />
          <span>MATLAB Engine Active</span>
        </div>

        {/* Database Status */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.35rem',
          fontSize: '0.71875rem',
          color: 'var(--text-secondary)',
          padding: '0.2rem 0.5rem',
          backgroundColor: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border-color)',
        }}>
          <span className={`status-indicator-dot ${dbConnected ? 'online' : 'warning'}`} />
          <span>{dbConnected ? 'Database Connected' : 'Database Offline'}</span>
        </div>

        {/* Role Badge */}
        <Badge variant={role === 'doctor' ? 'info' : 'neutral'} size="sm">
          {role === 'doctor' ? <Stethoscope size={11} /> : <UserCheck size={11} />}
          <span>{role === 'doctor' ? 'Clinician Reviewer' : 'Camp Operator'}</span>
        </Badge>
      </div>
    </header>
  );
};
