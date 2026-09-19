import React, { useState } from 'react';
import { Search, Filter, RefreshCw, CheckCircle2, AlertTriangle, FileUp } from 'lucide-react';
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }} className="animate-fade-in">
      {/* Search and Filters Bar */}
      <Card style={{ padding: '0.75rem 1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
            <Search size={14} color="var(--text-muted)" style={{ position: 'absolute', left: '0.625rem', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Search by Patient ID or Screening ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="clinical-input"
              style={{ paddingLeft: '2rem' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span style={{ fontSize: '0.71875rem', color: 'var(--text-secondary)', marginRight: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <Filter size={12} /> Filter:
            </span>
            {['ALL', 'SUBMITTED', 'RECAPTURE'].map((f) => (
              <button
                key={f}
                onClick={() => setStatusFilter(f)}
                style={{
                  padding: '0.25rem 0.55rem',
                  borderRadius: 'var(--radius-xs)',
                  border: statusFilter === f ? '1px solid var(--primary)' : '1px solid var(--border-color)',
                  backgroundColor: statusFilter === f ? 'var(--primary-light)' : 'transparent',
                  color: statusFilter === f ? 'var(--primary)' : 'var(--text-secondary)',
                  fontSize: '0.71875rem',
                  fontWeight: statusFilter === f ? 600 : 400,
                  cursor: 'pointer',
                  transition: 'var(--transition)',
                }}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Queue Table */}
      <Card
        title="Screening Center Workflow Queue"
        subtitle={`Displaying ${filtered.length} screening records`}
        headerBorder={true}
        action={
          <Button variant="primary" size="sm" icon={FileUp} onClick={onNavigateScreening}>
            New Screening
          </Button>
        }
      >
        <div style={{ overflowX: 'auto', margin: '0 -1.125rem -1rem -1.125rem' }}>
          <table className="clinical-table">
            <thead>
              <tr>
                <th>Screening ID</th>
                <th>Patient ID</th>
                <th>Date / Time</th>
                <th>Image Quality</th>
                <th>Workflow Status</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '2.5rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No queue items match the filter criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((s) => {
                  const isUngradable = s.status === 'UNGRADABLE';
                  return (
                    <tr key={s.screeningId || s._id}>
                      <td style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }} className="font-mono">
                        {s.screeningId ? s.screeningId.slice(0, 10) : '—'}
                      </td>
                      <td style={{ fontWeight: 600, color: 'var(--text-primary)' }} className="font-mono">
                        {s.patientId || 'PATIENT-ANONYMOUS'}
                      </td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                        {s.createdAt ? new Date(s.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : '—'}
                      </td>
                      <td>
                        {isUngradable ? (
                          <Badge variant="warning" size="sm">Recapture Required</Badge>
                        ) : (
                          <Badge variant="success" size="sm">Quality Passed</Badge>
                        )}
                      </td>
                      <td>
                        {isUngradable ? (
                          <span style={{ color: 'var(--warning)', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                            <AlertTriangle size={13} /> Recapture Needed
                          </span>
                        ) : (
                          <span style={{ color: 'var(--success)', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                            <CheckCircle2 size={13} /> Submitted to Specialist Queue
                          </span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                        {isUngradable ? (
                          <Button variant="outline" size="sm" icon={RefreshCw} onClick={onNavigateScreening}>
                            Recapture
                          </Button>
                        ) : (
                          <Badge variant="info" size="sm">In Review Queue</Badge>
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
