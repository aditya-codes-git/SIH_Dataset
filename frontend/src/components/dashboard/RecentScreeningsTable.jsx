import React from 'react';
import { Eye, CheckCircle2, Clock } from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

export const RecentScreeningsTable = ({ screenings = [], onViewScreening }) => {
  return (
    <Card
      title="Recent Clinical Screening Queue"
      subtitle="Latest patient retinal screening records logged from field camps"
      headerBorder={true}
    >
      <div style={{ overflowX: 'auto', margin: '0 -1.125rem -1rem -1.125rem' }}>
        <table className="clinical-table">
          <thead>
            <tr>
              <th>Patient ID</th>
              <th>Date / Time</th>
              <th>Image Quality</th>
              <th>DR Grade</th>
              <th>Confidence</th>
              <th>Referral Status</th>
              <th>Review Status</th>
              <th style={{ textAlign: 'right' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {screenings.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ padding: '2.5rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No screening records logged. New screenings will appear here.
                </td>
              </tr>
            ) : (
              screenings.slice(0, 10).map((s) => {
                const isUngradable = s.status === 'UNGRADABLE';
                const isReferable = s.triage?.referralRequired || s.referable || s.drGrade >= 2;
                const confidence = s.confidence != null ? `${(s.confidence * 100).toFixed(1)}%` : '—';
                const isReviewed = s.humanReview?.reviewed;

                return (
                  <tr key={s.screeningId || s._id}>
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
                        <span style={{ color: 'var(--warning)', fontSize: '0.75rem' }}>IQA Failed</span>
                      ) : (
                        <Badge variant={isReferable ? 'danger' : 'success'} size="sm">
                          Grade {s.drGrade ?? s.grade ?? 0}
                        </Badge>
                      )}
                    </td>

                    <td style={{ fontWeight: 500, color: 'var(--text-primary)' }} className="font-mono">
                      {confidence}
                    </td>

                    <td>
                      {isUngradable ? (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>—</span>
                      ) : (
                        <Badge variant={isReferable ? 'danger' : 'success'} size="sm">
                          {isReferable ? 'Specialist Referral' : 'Routine Follow-up'}
                        </Badge>
                      )}
                    </td>

                    <td>
                      {isReviewed ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', color: 'var(--success)', fontSize: '0.75rem', fontWeight: 500 }}>
                          <CheckCircle2 size={13} /> Reviewed
                        </span>
                      ) : (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                          <Clock size={13} /> Pending
                        </span>
                      )}
                    </td>

                    <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <Button
                        variant="secondary"
                        size="sm"
                        icon={Eye}
                        onClick={() => onViewScreening(s)}
                      >
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
  );
};
