import React from 'react';
import { Eye, Clock, RefreshCw } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';

export const DoctorPendingReviews = ({ screenings = [], onViewScreening, onRefresh }) => {
  // CANONICAL BACKEND-ENFORCED ELIGIBILITY RULE:
  // Must be GRADABLE, canonical drGrade >= 2, unreviewed, and not completed.
  // Grade 0, Grade 1, and Ungradable records MUST NEVER appear in this queue.
  const pendingList = screenings.filter((s) => 
    s.status === 'GRADABLE' &&
    s.drGrade !== null &&
    s.drGrade !== undefined &&
    Number(s.drGrade) >= 2 &&
    !s.humanReview?.reviewed &&
    s.triage?.status !== 'REVIEWED' &&
    s.triage?.status !== 'COMPLETED'
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }} className="animate-fade-in">
      <Card
        title="Pending Clinical Reviews"
        subtitle={`Showing ${pendingList.length} referable case(s) (Grade ≥ 2) awaiting ophthalmologist assessment`}
        headerBorder={true}
        action={
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {onRefresh && (
              <Button variant="secondary" size="sm" icon={RefreshCw} onClick={onRefresh} title="Sync with database">
                Refresh Queue
              </Button>
            )}
            <Badge variant={pendingList.length > 0 ? 'warning' : 'success'}>
              <Clock size={11} />
              <span>{pendingList.length} Pending Sign-off</span>
            </Badge>
          </div>
        }
      >
        <div style={{ overflowX: 'auto', margin: '0 -1.125rem -1rem -1.125rem' }}>
          <table className="clinical-table">
            <thead>
              <tr>
                <th>Priority</th>
                <th>Screening ID</th>
                <th>Patient ID</th>
                <th>Date</th>
                <th>AI DR Grade</th>
                <th>Confidence</th>
                <th>Referral Status</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {pendingList.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: '2.5rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    All eligible referable cases (Grade ≥ 2) have received completed clinician assessments.
                  </td>
                </tr>
              ) : (
                pendingList.map((s) => {
                  const priority = s.triage?.priority || (s.drGrade === 4 ? 'URGENT' : s.drGrade === 3 ? 'HIGH' : 'MEDIUM');

                  return (
                    <tr key={s.screeningId || s._id}>
                      <td>
                        <Badge variant={priority === 'URGENT' ? 'danger' : priority === 'HIGH' ? 'warning' : 'info'} size="sm">
                          {priority}
                        </Badge>
                      </td>
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
                        <Badge variant="danger" size="sm">
                          Grade {s.drGrade}
                        </Badge>
                      </td>
                      <td style={{ fontWeight: 500, color: 'var(--text-primary)' }} className="font-mono">
                        {s.confidence != null ? `${(s.confidence * 100).toFixed(1)}%` : '—'}
                      </td>
                      <td>
                        <Badge variant="danger" size="sm">
                          REFERABLE DR
                        </Badge>
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
