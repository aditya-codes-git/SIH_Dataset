import React, { useState } from 'react';
import { Search, User, FileUp, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';

export const OperatorPatients = ({ screenings = [], onNavigateScreening }) => {
  const [search, setSearch] = useState('');

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

  const patientList = Object.values(patientMap).filter((p) =>
    p.patientId.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }} className="animate-fade-in">
      <Card>
        <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
          <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Search patient registry by Patient ID..."
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
      </Card>

      <Card title="Screening Center Patient Registry" subtitle="Patient lookup for operational screening center">
        <div style={{ overflowX: 'auto', marginTop: '0.5rem' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                <th style={{ padding: '0.75rem 1rem' }}>Patient ID</th>
                <th style={{ padding: '0.75rem 1rem' }}>Total Submissions</th>
                <th style={{ padding: '0.75rem 1rem' }}>Latest Submission Date</th>
                <th style={{ padding: '0.75rem 1rem' }}>Image Quality Status</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {patientList.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No patient records found matching query.
                  </td>
                </tr>
              ) : (
                patientList.map((p) => {
                  const latest = p.latestScreening;
                  const isUngradable = latest?.status === 'UNGRADABLE';

                  return (
                    <tr key={p.patientId} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '0.875rem 1rem', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <User size={16} color="var(--primary)" />
                        <span>{p.patientId}</span>
                      </td>

                      <td style={{ padding: '0.875rem 1rem', color: 'var(--text-secondary)' }}>
                        {p.screenings.length} submission(s)
                      </td>

                      <td style={{ padding: '0.875rem 1rem', color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>
                        {latest?.createdAt ? new Date(latest.createdAt).toLocaleDateString() : 'N/A'}
                      </td>

                      <td style={{ padding: '0.875rem 1rem' }}>
                        {isUngradable ? (
                          <Badge variant="warning">Recapture Required</Badge>
                        ) : (
                          <Badge variant="success">Quality Passed</Badge>
                        )}
                      </td>

                      <td style={{ padding: '0.875rem 1rem', textAlign: 'right' }}>
                        <Button
                          variant="primary"
                          size="sm"
                          icon={FileUp}
                          onClick={onNavigateScreening}
                        >
                          New Screening
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
