import React, { useState } from 'react';
import { Search, Filter, Eye } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';

export const Screenings = ({ screenings = [], onViewScreening }) => {
  const [search, setSearch] = useState('');
  const [gradeFilter, setGradeFilter] = useState('ALL');

  const filtered = screenings.filter((s) => {
    const textMatch = (s.patientId || '').toLowerCase().includes(search.toLowerCase()) ||
                      (s.screeningId || '').toLowerCase().includes(search.toLowerCase());
    if (!textMatch) return false;
    if (gradeFilter === 'REFERABLE') return s.referable;
    if (gradeFilter === 'NON_REFERABLE') return s.status === 'GRADABLE' && !s.referable;
    if (gradeFilter === 'UNGRADABLE') return s.status === 'UNGRADABLE';
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <Card>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
            <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Search screenings by Patient ID or Screening ID..."
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
            {['ALL', 'REFERABLE', 'NON_REFERABLE', 'UNGRADABLE'].map((f) => (
              <button
                key={f}
                onClick={() => setGradeFilter(f)}
                style={{
                  padding: '0.375rem 0.75rem',
                  borderRadius: 'var(--radius-full)',
                  border: '1px solid var(--border-color)',
                  backgroundColor: gradeFilter === f ? 'var(--primary)' : 'var(--bg-secondary)',
                  color: gradeFilter === f ? '#FFF' : 'var(--text-secondary)',
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                {f.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>
      </Card>

      <Card title="Screenings Database" subtitle={`Showing ${filtered.length} screening records`}>
        <div style={{ overflowX: 'auto', marginTop: '0.5rem' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                <th style={{ padding: '0.75rem 1rem' }}>Screening ID</th>
                <th style={{ padding: '0.75rem 1rem' }}>Patient ID</th>
                <th style={{ padding: '0.75rem 1rem' }}>Date</th>
                <th style={{ padding: '0.75rem 1rem' }}>Grade</th>
                <th style={{ padding: '0.75rem 1rem' }}>Confidence</th>
                <th style={{ padding: '0.75rem 1rem' }}>Referral Status</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No screening records match your query.
                  </td>
                </tr>
              ) : (
                filtered.map((s) => (
                  <tr key={s.screeningId} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '0.875rem 1rem', fontSize: '0.8125rem', fontFamily: 'monospace', color: 'var(--text-secondary)' }}>
                      {s.screeningId}
                    </td>
                    <td style={{ padding: '0.875rem 1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {s.patientId}
                    </td>
                    <td style={{ padding: '0.875rem 1rem', color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>
                      {s.createdAt ? new Date(s.createdAt).toLocaleDateString() : 'Today'}
                    </td>
                    <td style={{ padding: '0.875rem 1rem' }}>
                      {s.status === 'UNGRADABLE' ? (
                        <Badge variant="warning">UNGRADABLE</Badge>
                      ) : (
                        <Badge variant={s.referable ? 'danger' : 'success'}>
                          Grade {s.drGrade ?? s.grade}
                        </Badge>
                      )}
                    </td>
                    <td style={{ padding: '0.875rem 1rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                      {s.confidence != null ? (s.confidence * 100).toFixed(2) + '%' : 'N/A'}
                    </td>
                    <td style={{ padding: '0.875rem 1rem' }}>
                      <Badge variant={s.referable ? 'danger' : 'success'}>
                        {s.referral || (s.referable ? 'REFERABLE' : 'NON-REFERABLE')}
                      </Badge>
                    </td>
                    <td style={{ padding: '0.875rem 1rem', textAlign: 'right' }}>
                      <Button variant="secondary" size="sm" icon={Eye} onClick={() => onViewScreening(s)}>
                        View Details
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
