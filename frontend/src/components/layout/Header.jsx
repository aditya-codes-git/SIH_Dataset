import React from 'react';
import { Activity, ShieldCheck, Database, UserCheck, Stethoscope } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { useAuth } from '../../context/AuthContext';

export const Header = ({ title, subtitle, dbConnected = true }) => {
  const { role } = useAuth();

  return (
    <header style={{
      height: '64px',
      padding: '0 1.5rem',
      backgroundColor: 'var(--bg-card)',
      borderBottom: '1px solid var(--border-color)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 10,
    }}>
      <div>
        <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
          {title}
        </h2>
        {subtitle && (
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0 }}>
            {subtitle}
          </p>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {/* Role Badge */}
        <Badge variant={role === 'doctor' ? 'info' : 'warning'} size="sm">
          {role === 'doctor' ? <Stethoscope size={12} /> : <UserCheck size={12} />}
          <span>Role: {role === 'doctor' ? 'DOCTOR / CLINICIAN' : 'OPERATOR / SPECIALIST'}</span>
        </Badge>

        {/* Database Status */}
        <Badge variant={dbConnected ? 'success' : 'warning'} size="sm">
          <Database size={12} />
          <span>{dbConnected ? 'MongoDB Connected' : 'Database Offline'}</span>
        </Badge>

        {/* Model Pipeline Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
          <ShieldCheck size={14} color="var(--primary)" />
          <span>MATLAB Engine Active</span>
        </div>
      </div>
    </header>
  );
};
