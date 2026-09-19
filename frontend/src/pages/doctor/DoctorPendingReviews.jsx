import React from 'react';
import { Eye, Clock } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';

export const DoctorPendingReviews = ({ screenings = [], onViewScreening }) => {
  const pendingList = screenings.filter((s) => !s.humanReview?.reviewed);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }} className="animate-fade-in">
      <Card
        title="Pending Clinical Reviews"
        subtitle={`Showing ${pendingList.length} screening record(s) awaiting ophthalmologist assessment`}
        headerBorder={true}
        action={
          <Badge variant="warning">
            <Clock size={11} />
            <span>{pendingList.length} Pending Sign-off</span>
          </Badge>
        }
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
              {pendingList.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '2.5rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    All uploaded screenings have been reviewed by a clinician.
                  </td>
                </tr>
              ) : (
                pendingList.map((s) => {
                  const isUngradable = s.status === 'UNGRADABLE';
                  const isReferable = s.referable || (s.drGrade >= 2) || s.triage?.referralRequired;

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
                            Grade {s.drGrade ?? s.grade}
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
                          <Badge variant={isReferable ? 'danger' : 'success'} size="sm">
                            {isReferable ? 'REFERABLE' : 'NON-REFERABLE'}
                          </Badge>
                        )}
                      </td>
                      <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <Button variant="primary" size="sm" icon={Eye} onClick={() => onViewScreening(s)}>
                          Clinical Review
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
