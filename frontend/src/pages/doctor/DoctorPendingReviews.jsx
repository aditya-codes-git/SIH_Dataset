import React from 'react';
import { Eye, Clock, AlertCircle } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';

export const DoctorPendingReviews = ({ screenings = [], onViewScreening }) => {
  const pendingList = screenings.filter((s) => !s.humanReview?.reviewed);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }} className="animate-fade-in">
      <Card
        title="Pending Clinical Reviews"
        subtitle={`Showing ${pendingList.length} screening(s) awaiting ophthalmologist sign-off`}
        action={
          <Badge variant="warning">
            <Clock size={12} />
            <span>{pendingList.length} Pending</span>
          </Badge>
        }
      >
        <div style={{ overflowX: 'auto', marginTop: '0.5rem' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                <th style={{ padding: '0.75rem 1rem' }}>Screening ID</th>
                <th style={{ padding: '0.75rem 1rem' }}>Patient ID</th>
                <th style={{ padding: '0.75rem 1rem' }}>Date</th>
                <th style={{ padding: '0.75rem 1rem' }}>DR Grade</th>
                <th style={{ padding: '0.75rem 1rem' }}>Confidence</th>
                <th style={{ padding: '0.75rem 1rem' }}>Referral Status</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {pendingList.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    All uploaded screenings have been reviewed by a clinician. Excellent!
                  </td>
                </tr>
              ) : (
                pendingList.map((s) => {
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
                        {s.createdAt ? new Date(s.createdAt).toLocaleDateString() : 'Today'}
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
                        <Button variant="primary" size="sm" icon={Eye} onClick={() => onViewScreening(s)}>
                          Perform Clinical Review
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
