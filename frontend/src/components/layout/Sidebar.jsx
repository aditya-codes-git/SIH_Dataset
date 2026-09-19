import React from 'react';
import { 
  LayoutDashboard, 
  FileUp, 
  Users, 
  FileText, 
  Bot, 
  Sun, 
  Moon, 
  Eye, 
  Clock, 
  ListTodo,
  Shield,
  Stethoscope,
  UserCheck
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';

export const Sidebar = ({ currentTab, setCurrentTab }) => {
  const { theme, toggleTheme } = useTheme();
  const { role, user, switchRole } = useAuth();

  const operatorNav = [
    { id: 'operator-dashboard', label: 'Screening Overview', icon: LayoutDashboard },
    { id: 'operator-screening', label: 'New Patient Screening', icon: FileUp },
    { id: 'operator-queue', label: 'Screening Queue', icon: ListTodo },
    { id: 'operator-patients', label: 'Patients Lookup', icon: Users },
  ];

  const doctorNav = [
    { id: 'doctor-dashboard', label: 'Clinical Overview', icon: LayoutDashboard },
    { id: 'doctor-pending-reviews', label: 'Pending Reviews', icon: Clock },
    { id: 'doctor-screenings', label: 'Screenings Database', icon: FileText },
    { id: 'doctor-patients', label: 'Patients Registry', icon: Users },
    { id: 'doctor-assistant', label: 'AI Screening Assistant', icon: Bot },
  ];

  const navItems = role === 'operator' ? operatorNav : doctorNav;

  return (
    <aside style={{
      width: '240px',
      backgroundColor: 'var(--bg-sidebar)',
      borderRight: '1px solid var(--border-color)',
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      position: 'sticky',
      top: 0,
      zIndex: 20,
      flexShrink: 0,
    }}>
      {/* Brand Header */}
      <div style={{
        padding: '0.875rem 1rem',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        gap: '0.625rem',
      }}>
        <div style={{
          width: '32px',
          height: '32px',
          borderRadius: 'var(--radius-sm)',
          backgroundColor: 'var(--primary-light)',
          color: 'var(--primary)',
          border: '1px solid var(--primary-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}>
          <Eye size={18} />
        </div>
        <div>
          <h1 style={{
            fontSize: '0.875rem',
            fontWeight: 700,
            letterSpacing: '0.02em',
            color: 'var(--text-primary)',
            margin: 0,
            lineHeight: 1.2,
          }}>
            RETINOSCAN <span style={{ color: 'var(--primary)', fontWeight: 600 }}>AI</span>
          </h1>
          <p style={{
            fontSize: '0.65625rem',
            color: 'var(--text-secondary)',
            margin: 0,
            letterSpacing: '0.01em',
          }}>
            Clinical Screening Workstation
          </p>
        </div>
      </div>

      {/* Navigation Section */}
      <nav style={{ padding: '0.75rem 0.5rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
        <div style={{
          fontSize: '0.65625rem',
          fontWeight: 600,
          color: 'var(--text-muted)',
          padding: '0.375rem 0.625rem',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
        }}>
          {role === 'operator' ? 'Operator Station' : 'Specialist Workstation'}
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.625rem',
                width: '100%',
                padding: '0.5rem 0.625rem',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.8125rem',
                fontWeight: isActive ? 600 : 400,
                color: isActive ? 'var(--primary)' : 'var(--text-secondary)',
                backgroundColor: isActive ? 'var(--primary-light)' : 'transparent',
                border: 'none',
                borderLeft: isActive ? '3px solid var(--primary)' : '3px solid transparent',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'var(--transition)',
              }}
            >
              <Icon size={16} color={isActive ? 'var(--primary)' : 'currentColor'} style={{ flexShrink: 0 }} />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Footer Controls & Mode Switcher */}
      <div style={{
        padding: '0.75rem',
        borderTop: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
      }}>
        {/* Role Mode Switcher (Preserved demo capability in restrained clinical style) */}
        <div style={{
          padding: '0.375rem',
          borderRadius: 'var(--radius-sm)',
          backgroundColor: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.125rem 0.25rem 0.35rem 0.25rem',
          }}>
            <span style={{ fontSize: '0.625rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Interface Role
            </span>
            <Shield size={11} color="var(--text-muted)" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.25rem' }}>
            <button
              onClick={() => {
                switchRole('operator');
                setCurrentTab('operator-dashboard');
              }}
              style={{
                padding: '0.3rem',
                borderRadius: 'var(--radius-xs)',
                fontSize: '0.6875rem',
                fontWeight: role === 'operator' ? 600 : 400,
                backgroundColor: role === 'operator' ? 'var(--bg-card)' : 'transparent',
                color: role === 'operator' ? 'var(--primary)' : 'var(--text-secondary)',
                border: role === 'operator' ? '1px solid var(--border-color)' : '1px solid transparent',
                cursor: 'pointer',
                transition: 'var(--transition)',
              }}
            >
              Operator
            </button>
            <button
              onClick={() => {
                switchRole('doctor');
                setCurrentTab('doctor-dashboard');
              }}
              style={{
                padding: '0.3rem',
                borderRadius: 'var(--radius-xs)',
                fontSize: '0.6875rem',
                fontWeight: role === 'doctor' ? 600 : 400,
                backgroundColor: role === 'doctor' ? 'var(--bg-card)' : 'transparent',
                color: role === 'doctor' ? 'var(--primary)' : 'var(--text-secondary)',
                border: role === 'doctor' ? '1px solid var(--border-color)' : '1px solid transparent',
                cursor: 'pointer',
                transition: 'var(--transition)',
              }}
            >
              Doctor
            </button>
          </div>
        </div>

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            padding: '0.4rem 0.625rem',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            color: 'var(--text-secondary)',
            fontSize: '0.75rem',
            cursor: 'pointer',
            transition: 'var(--transition)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            {theme === 'dark' ? <Moon size={14} color="var(--primary)" /> : <Sun size={14} color="var(--warning)" />}
            <span>{theme === 'dark' ? 'Dark Theme' : 'Light Theme'}</span>
          </div>
        </button>

        {/* User Profile Info */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.4rem 0.5rem',
          borderRadius: 'var(--radius-sm)',
          backgroundColor: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
        }}>
          <div style={{
            width: '26px',
            height: '26px',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: role === 'doctor' ? 'var(--primary-light)' : 'var(--warning-bg)',
            color: role === 'doctor' ? 'var(--primary)' : 'var(--warning)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}>
            {role === 'doctor' ? <Stethoscope size={14} /> : <UserCheck size={14} />}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{
              fontSize: '0.75rem',
              fontWeight: 600,
              color: 'var(--text-primary)',
              margin: 0,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {user?.name || 'Screening Staff'}
            </p>
            <p style={{
              fontSize: '0.625rem',
              color: 'var(--text-secondary)',
              margin: 0,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {user?.title || (role === 'doctor' ? 'Ophthalmology Reviewer' : 'Camp Screening Operator')}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
};
