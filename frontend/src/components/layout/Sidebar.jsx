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
  Stethoscope,
  ListTodo,
  Clock,
  UserCheck,
  ChevronRight,
  ShieldAlert
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';

export const Sidebar = ({ currentTab, setCurrentTab }) => {
  const { theme, toggleTheme } = useTheme();
  const { role, user, switchRole } = useAuth();

  // Role-Specific Navigation Definitions
  const operatorNav = [
    { id: 'operator-dashboard', label: 'Screening Center', icon: LayoutDashboard },
    { id: 'operator-screening', label: 'New Screening', icon: FileUp },
    { id: 'operator-queue', label: 'Screening Queue', icon: ListTodo },
    { id: 'operator-patients', label: 'Patients Lookup', icon: Users },
  ];

  const doctorNav = [
    { id: 'doctor-dashboard', label: 'Clinical Overview', icon: LayoutDashboard },
    { id: 'doctor-screenings', label: 'Screenings Database', icon: FileText },
    { id: 'doctor-pending-reviews', label: 'Pending Reviews', icon: Clock },
    { id: 'doctor-patients', label: 'Patients Registry', icon: Users },
    { id: 'doctor-assistant', label: 'AI Screening Assistant', icon: Bot },
  ];

  const navItems = role === 'operator' ? operatorNav : doctorNav;

  return (
    <aside style={{
      width: '260px',
      backgroundColor: 'var(--bg-sidebar)',
      borderRight: '1px solid var(--border-color)',
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      position: 'sticky',
      top: 0,
      zIndex: 20,
    }}>
      {/* Brand Header */}
      <div style={{
        padding: '1.25rem',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
      }}>
        <div style={{
          width: '36px',
          height: '36px',
          borderRadius: 'var(--radius-md)',
          backgroundColor: 'var(--primary-light)',
          color: 'var(--primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <Eye size={22} />
        </div>
        <div>
          <h1 style={{ fontSize: '0.9375rem', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text-primary)', margin: 0 }}>
            RETINOSCAN <span style={{ color: 'var(--primary)', fontSize: '0.75rem', fontWeight: 600 }}>AI</span>
          </h1>
          <p style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)', margin: 0 }}>
            {role === 'operator' ? 'Operator Workflow' : 'Clinical Specialist'}
          </p>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav style={{ padding: '1rem 0.75rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-muted)', padding: '0.5rem 0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {role === 'operator' ? 'Operator Menu' : 'Doctor Menu'}
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
                justifyContent: 'space-between',
                width: '100%',
                padding: '0.625rem 0.75rem',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.875rem',
                fontWeight: isActive ? 600 : 500,
                color: isActive ? 'var(--primary)' : 'var(--text-secondary)',
                backgroundColor: isActive ? 'var(--primary-light)' : 'transparent',
                border: 'none',
                cursor: 'pointer',
                transition: 'var(--transition)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Icon size={18} color={isActive ? 'var(--primary)' : 'currentColor'} />
                <span>{item.label}</span>
              </div>
              {isActive && <ChevronRight size={14} color="var(--primary)" />}
            </button>
          );
        })}
      </nav>

      {/* Footer Controls & DEMO ROLE SWITCHER */}
      <div style={{ padding: '1rem 0.75rem', borderTop: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {/* DEMO ROLE SWITCHER (PROTOTYPE REQUIREMENT) */}
        <div style={{
          padding: '0.625rem',
          borderRadius: 'var(--radius-md)',
          backgroundColor: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.375rem' }}>
            <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              DEMO ROLE MODE
            </span>
            <ShieldAlert size={12} color="var(--warning)" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.375rem' }}>
            <button
              onClick={() => {
                switchRole('operator');
                setCurrentTab('operator-dashboard');
              }}
              style={{
                padding: '0.375rem',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.75rem',
                fontWeight: role === 'operator' ? 700 : 500,
                backgroundColor: role === 'operator' ? 'var(--primary)' : 'transparent',
                color: role === 'operator' ? '#FFF' : 'var(--text-secondary)',
                border: 'none',
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
                padding: '0.375rem',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.75rem',
                fontWeight: role === 'doctor' ? 700 : 500,
                backgroundColor: role === 'doctor' ? 'var(--primary)' : 'transparent',
                color: role === 'doctor' ? '#FFF' : 'var(--text-secondary)',
                border: 'none',
                cursor: 'pointer',
                transition: 'var(--transition)',
              }}
            >
              Doctor
            </button>
          </div>
        </div>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            padding: '0.5rem 0.75rem',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            color: 'var(--text-secondary)',
            fontSize: '0.8125rem',
            cursor: 'pointer',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {theme === 'dark' ? <Moon size={16} color="var(--warning)" /> : <Sun size={16} color="var(--warning)" />}
            <span>{theme === 'dark' ? 'Dark Theme' : 'Light Theme'}</span>
          </div>
        </button>

        {/* User Profile Card */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          padding: '0.5rem 0.75rem',
          borderRadius: 'var(--radius-md)',
          backgroundColor: 'var(--bg-secondary)',
        }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: 'var(--radius-full)',
            backgroundColor: role === 'doctor' ? 'var(--primary)' : 'var(--warning)',
            color: '#FFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            {role === 'doctor' ? <Stethoscope size={16} /> : <UserCheck size={16} />}
          </div>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user.name}
            </p>
            <p style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user.title}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
};
