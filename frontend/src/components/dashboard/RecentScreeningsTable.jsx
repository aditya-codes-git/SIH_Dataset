import React from 'react';
import { Eye, ArrowRight, CheckCircle2, Clock } from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

export const RecentScreeningsTable = ({ screenings = [], onViewScreening }) => {
  return (
    <Card title="Recent Screenings" subtitle="Latest patient retinal screening records from backend">
      <div style={{ overflowX: 'auto', marginTop: '0.5rem' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase' }}>
              <th style={{ padding: '0.75rem 1rem' }}>Patient ID</th>
              <th style={{ padding: '0.75rem 1rem' }}>Date</th>
              <th style={{ padding: '0.75rem 1rem' }}>DR Grade</th>
              <th style={{ padding: '0.75rem 1rem' }}>Confidence</th>
              <th style={{ padding: '0.75rem 1rem' }}>Referral Status</th>
              <th style={{ padding: '0.75rem 1rem' }}>Review Status</th>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {screenings.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No screening records available. Click "Screen New Patient" to upload an image.
                </td>
              </tr>
            ) : (
              screenings.slice(0, 10).map((s) => {
                const isUngradable = s.status === 'UNGRADABLE';
                const isReferable = s.referable;
                const confidence = s.confidence != null ? (s.confidence * 100).toFixed(2) + '%' : 'N/A';
                const isReviewed = s.humanReview?.reviewed;

                return (
                  <tr
                    key={s.screeningId || s._id}
                    style={{
                      borderBottom: '1px solid var(--border-color)',
                      transition: 'var(--transition)',
                    }}
                  >
                    <td style={{ padding: '0.875rem 1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {s.patientId || 'PATIENT-ANONYMOUS'}
                    </td>

                    <td style={{ padding: '0.875rem 1rem', color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>
                      {s.createdAt ? new Date(s.createdAt).toLocaleDateString() : 'Today'}
                    </td>

                    <td style={{ padding: '0.875rem 1rem' }}>
                      {isUngradable ? (
                        <Badge variant="warning">UNGRADABLE</Badge>
                      ) : (
                        <Badge variant={isReferable ? 'danger' : 'success'}>
                          Grade {s.drGrade ?? s.grade}
                        </Badge>
                      )}
                    </td>

                    <td style={{ padding: '0.875rem 1rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                      {confidence}
                    </td>

                    <td style={{ padding: '0.875rem 1rem' }}>
                      {isUngradable ? (
                        <span style={{ fontSize: '0.8125rem', color: 'var(--warning)' }}>Recapture Required</span>
                      ) : (
                        <Badge variant={isReferable ? 'danger' : 'success'}>
                          {s.referral || (isReferable ? 'REFERABLE DR' : 'NON-REFERABLE DR')}
                        </Badge>
                      )}
                    </td>

                    <td style={{ padding: '0.875rem 1rem' }}>
                      {isReviewed ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: 'var(--success)', fontSize: '0.8125rem', fontWeight: 500 }}>
                          <CheckCircle2 size={14} /> Reviewed
                        </span>
                      ) : (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
                          <Clock size={14} /> Pending
                        </span>
                      )}
                    </td>

                    <td style={{ padding: '0.875rem 1rem', textAlign: 'right' }}>
                      <Button
                        variant="secondary"
                        size="sm"
                        icon={Eye}
                        onClick={() => onViewScreening(s)}
                      >
                        View Result
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
