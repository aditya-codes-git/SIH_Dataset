import React, { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export const Layout = ({ currentTab, setCurrentTab, title, subtitle, dbConnected = true, children }) => {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem('retinoscan_sidebar_collapsed');
    if (saved !== null) {
      return saved === 'true';
    }
    // Default to collapsed on smaller laptop/tablet screens (< 1100px)
    return typeof window !== 'undefined' && window.innerWidth < 1100;
  });

  const toggleSidebar = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('retinoscan_sidebar_collapsed', String(next));
      return next;
    });
  };

  // Optional: auto-collapse on tablet resize if user hasn't explicitly customized
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 900 && !isCollapsed) {
        setIsCollapsed(true);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isCollapsed]);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-primary)' }}>
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        isCollapsed={isCollapsed}
        toggleSidebar={toggleSidebar}
      />
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minWidth: 0,
        backgroundColor: 'var(--bg-main)',
        transition: 'margin-left 0.22s cubic-bezier(0.4, 0, 0.2, 1)',
      }}>
        <Header
          title={title}
          subtitle={subtitle}
          dbConnected={dbConnected}
          isCollapsed={isCollapsed}
          toggleSidebar={toggleSidebar}
        />
        <main style={{
          flex: 1,
          padding: '1.25rem',
          maxWidth: '1440px',
          width: '100%',
          margin: '0 auto',
          boxSizing: 'border-box',
        }}>
          {children}
        </main>
      </div>
    </div>
  );
};
