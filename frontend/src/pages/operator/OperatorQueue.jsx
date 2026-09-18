import React, { useState } from 'react';
import { Search, Filter, RefreshCw, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';

export const OperatorQueue = ({ screenings = [], onNavigateScreening }) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const filtered = screenings.filter((s) => {
    const textMatch = (s.patientId || '').toLowerCase().includes(search.toLowerCase()) ||
                      (s.screeningId || '').toLowerCase().includes(search.toLowerCase());
    if (!textMatch) return false;
    if (statusFilter === 'RECAPTURE') return s.status === 'UNGRADABLE';
    if (statusFilter === 'SUBMITTED') return s.status === 'GRADABLE';
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }} className="animate-fade-in">
      <Card>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
            <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Search queue by Patient ID or Screening ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem 0.5rem 2.25rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                fontSize: '0.875rem',
                outline: 'none',
              }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Filter size={16} color="var(--text-secondary)" />
            {['ALL', 'SUBMITTED', 'RECAPTURE'].map((f) => (
              <button
                key={f}
                onClick={() => setStatusFilter(f)}
                style={{
                  padding: '0.375rem 0.75rem',
                  borderRadius: 'var(--radius-full)',
                  border: '1px solid var(--border-color)',
                  backgroundColor: statusFilter === f ? 'var(--primary)' : 'var(--bg-secondary)',
                  color: statusFilter === f ? '#FFF' : 'var(--text-secondary)',
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </Card>

      <Card title="Screening Center Workflow Queue" subtitle="Operational queue tracking submitted screenings (NO DR grades exposed)">
        <div style={{ overflowX: 'auto', marginTop: '0.5rem' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                <th style={{ padding: '0.75rem 1rem' }}>Screening ID</th>
                <th style={{ padding: '0.75rem 1rem' }}>Patient ID</th>
                <th style={{ padding: '0.75rem 1rem' }}>Date / Time</th>
                <th style={{ padding: '0.75rem 1rem' }}>Image Quality</th>
                <th style={{ padding: '0.75rem 1rem' }}>Workflow Status</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No queue items match your filter criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((s) => {
                  const isUngradable = s.status === 'UNGRADABLE';
                  return (
                    <tr key={s.screeningId} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '0.875rem 1rem', fontSize: '0.8125rem', fontFamily: 'monospace', color: 'var(--text-secondary)' }}>
                        {s.screeningId ? s.screeningId.slice(0, 8) + '...' : 'N/A'}
                      </td>
                      <td style={{ padding: '0.875rem 1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {s.patientId}
                      </td>
                      <td style={{ padding: '0.875rem 1rem', color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>
                        {s.createdAt ? new Date(s.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'Today'}
                      </td>
                      <td style={{ padding: '0.875rem 1rem' }}>
                        {isUngradable ? (
                          <Badge variant="warning">Recapture Required</Badge>
                        ) : (
                          <Badge variant="success">Quality Passed</Badge>
                        )}
                      </td>
                      <td style={{ padding: '0.875rem 1rem' }}>
                        {isUngradable ? (
                          <span style={{ color: 'var(--warning)', fontSize: '0.8125rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <AlertTriangle size={14} /> Recapture Needed
                          </span>
                        ) : (
                          <span style={{ color: 'var(--success)', fontSize: '0.8125rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <CheckCircle2 size={14} /> Submitted for Specialist Review
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '0.875rem 1rem', textAlign: 'right' }}>
                        {isUngradable ? (
                          <Button variant="outline" size="sm" icon={RefreshCw} onClick={onNavigateScreening}>
                            Recapture
                          </Button>
                        ) : (
                          <Badge variant="info">In Review Queue</Badge>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
