import React, { useState } from 'react';
import { Search, FileUp } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';

export const OperatorPatients = ({ screenings = [], onNavigateScreening }) => {
  const [search, setSearch] = useState('');

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

  const patientList = Object.values(patientMap).filter((p) =>
    p.patientId.toLowerCase().includes(search.toLowerCase()) ||
    p.patientName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }} className="animate-fade-in">
      {/* Search Bar */}
      <Card style={{ padding: '0.75rem 1rem' }}>
        <div style={{ position: 'relative' }}>
          <Search size={14} color="var(--text-muted)" style={{ position: 'absolute', left: '0.625rem', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Search patient registry by Patient ID or Name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="clinical-input"
            style={{ paddingLeft: '2rem' }}
          />
        </div>
      </Card>

      {/* Patient Table */}
      <Card
        title="Screening Center Patient Registry"
        subtitle={`Total registered patients: ${patientList.length}`}
        headerBorder={true}
      >
        <div style={{ overflowX: 'auto', margin: '0 -1.125rem -1rem -1.125rem' }}>
          <table className="clinical-table">
            <thead>
              <tr>
                <th>Patient ID</th>
                <th>Patient Name</th>
                <th>Submissions</th>
                <th>Latest Screening Date</th>
                <th>Latest Quality Status</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {patientList.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '2.5rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No patient records found.
                  </td>
                </tr>
              ) : (
                patientList.map((p) => {
                  const latest = p.latestScreening;
                  const isUngradable = latest?.status === 'UNGRADABLE';

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

                      <td style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                        {latest?.createdAt ? new Date(latest.createdAt).toLocaleDateString() : '—'}
                      </td>

                      <td>
                        {isUngradable ? (
                          <Badge variant="warning" size="sm">Recapture Required</Badge>
                        ) : (
                          <Badge variant="success" size="sm">Quality Passed</Badge>
                        )}
                      </td>

                      <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
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
