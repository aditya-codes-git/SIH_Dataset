import React, { useState } from 'react';
import { Search, Filter, Eye, User, ArrowRight } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';

export const Patients = ({ screenings = [], onSelectPatient }) => {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('ALL');

  // Group screenings by patientId
  const patientMap = {};
  screenings.forEach((s) => {
    const pid = s.patientId || 'PATIENT-ANONYMOUS';
    if (!patientMap[pid]) {
      patientMap[pid] = {
        patientId: pid,
        screenings: [],
        latestScreening: s,
      };
    }
    patientMap[pid].screenings.push(s);
  });

  const patientList = Object.values(patientMap).filter((p) => {
    const pidMatch = p.patientId.toLowerCase().includes(search.toLowerCase());
    if (!pidMatch) return false;
    if (filter === 'REFERABLE') return p.latestScreening?.referable;
    if (filter === 'NON_REFERABLE') return p.latestScreening && !p.latestScreening.referable && p.latestScreening.status !== 'UNGRADABLE';
    if (filter === 'UNGRADABLE') return p.latestScreening?.status === 'UNGRADABLE';
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header controls */}
      <Card>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
            <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Search patients by ID..."
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
                onClick={() => setFilter(f)}
                style={{
                  padding: '0.375rem 0.75rem',
                  borderRadius: 'var(--radius-full)',
                  border: '1px solid var(--border-color)',
                  backgroundColor: filter === f ? 'var(--primary)' : 'var(--bg-secondary)',
                  color: filter === f ? '#FFF' : 'var(--text-secondary)',
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

      {/* Patient Table */}
      <Card title="Patient Registry" subtitle={`Showing ${patientList.length} registered patients`}>
        <div style={{ overflowX: 'auto', marginTop: '0.5rem' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                <th style={{ padding: '0.75rem 1rem' }}>Patient ID</th>
                <th style={{ padding: '0.75rem 1rem' }}>Screenings Count</th>
                <th style={{ padding: '0.75rem 1rem' }}>Latest Grade</th>
                <th style={{ padding: '0.75rem 1rem' }}>Model Confidence</th>
                <th style={{ padding: '0.75rem 1rem' }}>Latest Status</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {patientList.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No patient records matching the selected filter.
                  </td>
                </tr>
              ) : (
                patientList.map((p) => {
                  const s = p.latestScreening;
                  const isUngradable = s.status === 'UNGRADABLE';

                  return (
                    <tr key={p.patientId} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '0.875rem 1rem', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <User size={16} color="var(--primary)" />
                        <span>{p.patientId}</span>
                      </td>

                      <td style={{ padding: '0.875rem 1rem', color: 'var(--text-secondary)' }}>
                        {p.screenings.length} screening(s)
                      </td>

                      <td style={{ padding: '0.875rem 1rem' }}>
                        {isUngradable ? (
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
                        <Button
                          variant="secondary"
                          size="sm"
                          icon={ArrowRight}
                          onClick={() => onSelectPatient(p)}
                        >
                          Patient Details
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
