import React, { useState } from 'react';
import { Search, Filter, ArrowRight } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';

export const Patients = ({ screenings = [], onSelectPatient }) => {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('ALL');

  // Group real screenings by patientId
  const patientMap = {};
  screenings.forEach((s) => {
    const pid = s.patientId || 'PATIENT-ANONYMOUS';
    if (!patientMap[pid]) {
      patientMap[pid] = {
        patientId: pid,
        patientName: s.patientName || 'Anonymous Patient',
        screenings: [],
        latestScreening: s,
      };
    }
    patientMap[pid].screenings.push(s);
  });

  const patientList = Object.values(patientMap).filter((p) => {
    const pidMatch = p.patientId.toLowerCase().includes(search.toLowerCase()) ||
                     p.patientName.toLowerCase().includes(search.toLowerCase());
    if (!pidMatch) return false;
    if (filter === 'REFERABLE') return p.latestScreening && p.latestScreening.status !== 'UNGRADABLE' && Number(p.latestScreening.drGrade) >= 2;
    if (filter === 'NON_REFERABLE') return p.latestScreening && p.latestScreening.status !== 'UNGRADABLE' && Number(p.latestScreening.drGrade) < 2;
    if (filter === 'UNGRADABLE') return p.latestScreening?.status === 'UNGRADABLE';
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
              placeholder="Search patients by ID or Name..."
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
                onClick={() => setFilter(f)}
                style={{
                  padding: '0.25rem 0.55rem',
                  borderRadius: 'var(--radius-xs)',
                  border: filter === f ? '1px solid var(--primary)' : '1px solid var(--border-color)',
                  backgroundColor: filter === f ? 'var(--primary-light)' : 'transparent',
                  color: filter === f ? 'var(--primary)' : 'var(--text-secondary)',
                  fontSize: '0.71875rem',
                  fontWeight: filter === f ? 600 : 400,
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

      {/* Patient Registry Table */}
      <Card
        title="Patients Registry"
        subtitle={`Showing ${patientList.length} registered patient profiles`}
        headerBorder={true}
      >
        <div style={{ overflowX: 'auto', margin: '0 -1.125rem -1rem -1.125rem' }}>
          <table className="clinical-table">
            <thead>
              <tr>
                <th>Patient ID</th>
                <th>Patient Name</th>
                <th>Screenings</th>
                <th>Latest Grade</th>
                <th>Confidence</th>
                <th>Latest Status</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {patientList.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '2.5rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No patient records matching the selected filter.
                  </td>
                </tr>
              ) : (
                patientList.map((p) => {
                  const s = p.latestScreening;
                  const isUngradable = s.status === 'UNGRADABLE';
                  const isReferable = !isUngradable && Number(s.drGrade) >= 2;

                  return (
                    <tr key={p.patientId}>
                      <td style={{ fontWeight: 600, color: 'var(--text-primary)' }} className="font-mono">
                        {p.patientId}
                      </td>

                      <td style={{ color: 'var(--text-secondary)' }}>
                        {p.patientName}
                      </td>

                      <td style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                        {p.screenings.length} record(s)
                      </td>

                      <td>
                        {isUngradable ? (
                          <Badge variant="warning" size="sm">UNGRADABLE</Badge>
                        ) : (
                          <Badge variant={isReferable ? 'danger' : 'success'} size="sm">
                            Grade {s.drGrade != null ? s.drGrade : '—'}
                          </Badge>
                        )}
                      </td>

                      <td style={{ fontWeight: 500, color: 'var(--text-primary)' }} className="font-mono">
                        {s.confidence != null ? `${(s.confidence * 100).toFixed(1)}%` : '—'}
                      </td>

                      <td>
                        {isUngradable ? (
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Recapture</span>
                        ) : (
                          <Badge variant={isReferable ? 'danger' : 'success'} size="sm">
                            {s.referral || (isReferable ? 'REFERABLE' : 'NON-REFERABLE')}
                          </Badge>
                        )}
                      </td>

                      <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <Button
                          variant="secondary"
                          size="sm"
                          icon={ArrowRight}
                          onClick={() => onSelectPatient(p)}
                        >
                          Patient History
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
