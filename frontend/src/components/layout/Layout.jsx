import React from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export const Layout = ({ currentTab, setCurrentTab, title, subtitle, dbConnected = true, children }) => {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-primary)' }}>
      <Sidebar currentTab={currentTab} setCurrentTab={setCurrentTab} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <Header title={title} subtitle={subtitle} dbConnected={dbConnected} />
        <main style={{ flex: 1, padding: '1.5rem', maxWidth: '1400px', width: '100%', margin: '0 auto' }}>
          {children}
        </main>
      </div>
    </div>
  );
};
