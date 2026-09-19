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
    if (gradeFilter === 'REFERABLE') return s.status === 'GRADABLE' && s.drGrade !== null && Number(s.drGrade) >= 2;
    if (gradeFilter === 'NON_REFERABLE') return s.status === 'GRADABLE' && s.drGrade !== null && Number(s.drGrade) < 2;
    if (gradeFilter === 'UNGRADABLE') return s.status === 'UNGRADABLE';
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }} className="animate-fade-in">
      {/* Search and Filters */}
      <Card style={{ padding: '0.75rem 1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
            <Search size={14} color="var(--text-muted)" style={{ position: 'absolute', left: '0.625rem', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Search screenings by Patient ID or Screening ID..."
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
            {['ALL', 'REFERABLE', 'NON_REFERABLE', 'UNGRADABLE'].map((f) => (
              <button
                key={f}
                onClick={() => setGradeFilter(f)}
                style={{
                  padding: '0.25rem 0.55rem',
                  borderRadius: 'var(--radius-xs)',
                  border: gradeFilter === f ? '1px solid var(--primary)' : '1px solid var(--border-color)',
                  backgroundColor: gradeFilter === f ? 'var(--primary-light)' : 'transparent',
                  color: gradeFilter === f ? 'var(--primary)' : 'var(--text-secondary)',
                  fontSize: '0.71875rem',
                  fontWeight: gradeFilter === f ? 600 : 400,
                  cursor: 'pointer',
                  transition: 'var(--transition)',
                }}
              >
                {f.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Screenings Table */}
      <Card
        title="Screenings Database"
        subtitle={`Showing ${filtered.length} screening record(s)`}
        headerBorder={true}
      >
        <div style={{ overflowX: 'auto', margin: '0 -1.125rem -1rem -1.125rem' }}>
          <table className="clinical-table">
            <thead>
              <tr>
                <th>Screening ID</th>
                <th>Patient ID</th>
                <th>Date</th>
                <th>DR Grade</th>
                <th>Confidence</th>
                <th>Referral Status</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '2.5rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No screening records match the query.
                  </td>
                </tr>
              ) : (
                filtered.map((s) => {
                  const isUngradable = s.status === 'UNGRADABLE';
                  const isReferable = s.status === 'GRADABLE' && s.drGrade !== null && Number(s.drGrade) >= 2;
                  const isReviewed = Boolean(s.humanReview?.reviewed || s.triage?.status === 'REVIEWED');

                  return (
                    <tr key={s.screeningId || s._id}>
                      <td style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }} className="font-mono">
                        {s.screeningId ? s.screeningId.slice(0, 10) : '—'}
                      </td>
                      <td style={{ fontWeight: 600, color: 'var(--text-primary)' }} className="font-mono">
                        {s.patientId || 'PATIENT-ANONYMOUS'}
                      </td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                        {s.createdAt ? new Date(s.createdAt).toLocaleDateString() : '—'}
                      </td>
                      <td>
                        {isUngradable ? (
                          <Badge variant="warning" size="sm">UNGRADABLE</Badge>
                        ) : (
                          <Badge variant={isReferable ? 'danger' : 'success'} size="sm">
                            Grade {s.drGrade}
                          </Badge>
                        )}
                      </td>
                      <td style={{ fontWeight: 500, color: 'var(--text-primary)' }} className="font-mono">
                        {s.confidence != null ? `${(s.confidence * 100).toFixed(1)}%` : '—'}
                      </td>
                      <td>
                        {isUngradable ? (
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>—</span>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                            <Badge variant={isReferable ? 'danger' : 'success'} size="sm">
                              {isReferable ? 'REFERABLE DR' : 'NON-REFERABLE'}
                            </Badge>
                            {isReferable && (
                              <span style={{ fontSize: '0.6875rem', color: isReviewed ? 'var(--success)' : 'var(--warning)' }}>
                                {isReviewed ? `Reviewed (${s.humanReview?.decision || 'Agreed'})` : 'Pending Doctor Review'}
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                      <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <Button variant="secondary" size="sm" icon={Eye} onClick={() => onViewScreening(s)}>
                          Inspect
                        </Button>
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
