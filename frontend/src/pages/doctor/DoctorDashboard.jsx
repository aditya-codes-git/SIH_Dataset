import React from 'react';
import { Eye, Stethoscope } from 'lucide-react';
import { StatCard } from '../../components/dashboard/StatCard';
import { GradeDistributionChart } from '../../components/dashboard/GradeDistributionChart';
import { ReferralPieChart } from '../../components/dashboard/ReferralPieChart';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';

export const Dashboard = ({ screenings = [], onViewScreening, onNavigateScreenings }) => {
  // Pending Specialist Reviews: strictly canonical drGrade >= 2, GRADABLE, unreviewed
  const pendingReviews = screenings.filter((s) => 
    s.status === 'GRADABLE' &&
    s.drGrade !== null &&
    s.drGrade !== undefined &&
    Number(s.drGrade) >= 2 &&
    !s.humanReview?.reviewed &&
    s.triage?.status !== 'REVIEWED' &&
    s.triage?.status !== 'COMPLETED'
  );
  const urgentCount = pendingReviews.filter((s) => s.drGrade === 4 || s.triage?.priority === 'URGENT').length;
  const highCount = pendingReviews.filter((s) => s.drGrade === 3 || s.triage?.priority === 'HIGH').length;
  const mediumCount = pendingReviews.filter((s) => s.drGrade === 2 || s.triage?.priority === 'MEDIUM').length;
  const reviewedTotal = screenings.filter((s) => 
    s.status === 'GRADABLE' &&
    s.drGrade >= 2 &&
    (s.humanReview?.reviewed || s.triage?.status === 'REVIEWED')
  ).length;

  // Sorting Pending Reviews: Priority (URGENT > HIGH > MEDIUM), then oldest waiting case first
  const priorityRank = { URGENT: 3, HIGH: 2, MEDIUM: 1, ROUTINE: 0 };
  const sortedPending = [...pendingReviews].sort((a, b) => {
    const pA = priorityRank[a.triage?.priority] || (a.drGrade === 4 ? 3 : a.drGrade === 3 ? 2 : 1);
    const pB = priorityRank[b.triage?.priority] || (b.drGrade === 4 ? 3 : b.drGrade === 3 ? 2 : 1);
    if (pB !== pA) return pB - pA;
    return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }} className="animate-fade-in">
      {/* Top Clinical Header */}
      <div style={{
        padding: '0.875rem 1.125rem',
        borderRadius: 'var(--radius-md)',
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.75rem',
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.2rem' }}>
            <Badge variant="info" size="sm">OPHTHALMOLOGY WORKSTATION</Badge>
            <Badge variant="neutral" size="sm">SPECIALIST REVIEW QUEUE</Badge>
          </div>
          <h2 style={{ fontSize: '1.0625rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
            Specialist Review & Clinical Triage
          </h2>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.15rem', margin: 0 }}>
            Review referred cases flagged with Grade ≥ 2, examine Grad-CAM spatial lesion heatmaps, and log clinical assessments.
          </p>
        </div>

        <Button variant="secondary" icon={Stethoscope} onClick={onNavigateScreenings}>
          Screenings Database
        </Button>
      </div>

      {/* Specialist Queue Metric Blocks */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
        gap: '0.75rem',
      }}>
        <StatCard
          title="Pending Reviews"
          value={pendingReviews.length}
          subtitle="Awaiting specialist assessment"
          color="var(--warning)"
        />
        <StatCard
          title="Urgent Cases"
          value={urgentCount}
          subtitle="Proliferative DR (Grade 4)"
          color="var(--danger)"
        />
        <StatCard
          title="High Priority"
          value={highCount}
          subtitle="Severe NPDR (Grade 3)"
          color="var(--warning)"
        />
        <StatCard
          title="Moderate Priority"
          value={mediumCount}
          subtitle="Moderate NPDR (Grade 2)"
          color="var(--info)"
        />
        <StatCard
          title="Reviewed Total"
          value={reviewedTotal}
          subtitle="Clinician decisions confirmed"
          color="var(--success)"
        />
      </div>

      {/* PRIMARY WORKFLOW: PENDING SPECIALIST REVIEWS QUEUE */}
      <Card
        title="Pending Specialist Reviews Queue"
        subtitle="Referred clinical cases prioritized by urgency and queue waiting time"
        headerBorder={true}
        action={
          <Badge variant={sortedPending.length > 0 ? 'warning' : 'success'}>
            {sortedPending.length} Cases Pending Sign-off
          </Badge>
        }
      >
        <div style={{ overflowX: 'auto', margin: '0 -1.125rem -1rem -1.125rem' }}>
          <table className="clinical-table">
            <thead>
              <tr>
                <th>Priority</th>
                <th>Patient ID</th>
                <th>Patient Name</th>
                <th>DR Grade</th>
                <th>Confidence</th>
                <th>Screening Date</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {sortedPending.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '2.5rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No referred cases awaiting specialist review. All referable cases are cleared.
                  </td>
                </tr>
              ) : (
                sortedPending.map((s) => {
                  const priority = s.triage?.priority || (s.drGrade === 4 ? 'URGENT' : s.drGrade === 3 ? 'HIGH' : 'MEDIUM');

                  return (
                    <tr key={s.screeningId || s._id}>
                      <td>
                        <Badge variant={priority === 'URGENT' ? 'danger' : priority === 'HIGH' ? 'warning' : 'info'} size="sm">
                          {priority}
                        </Badge>
                      </td>
                      <td style={{ fontWeight: 600, color: 'var(--text-primary)' }} className="font-mono">
                        {s.patientId}
                      </td>
                      <td style={{ color: 'var(--text-secondary)' }}>
                        {s.patientName || 'Anonymous Patient'}
                      </td>
                      <td>
                        <Badge variant="danger" size="sm">Grade {s.drGrade ?? s.grade}</Badge>
                      </td>
                      <td style={{ fontWeight: 500, color: 'var(--text-primary)' }} className="font-mono">
                        {s.confidence != null ? `${(s.confidence * 100).toFixed(1)}%` : '—'}
                      </td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                        {s.createdAt ? new Date(s.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : '—'}
                      </td>
                      <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <Button variant="primary" size="sm" icon={Eye} onClick={() => onViewScreening(s)}>
                          Review Case
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

      {/* Analytics Section - Passed with authentic screenings data */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
        <GradeDistributionChart screenings={screenings} />
        <ReferralPieChart screenings={screenings} />
      </div>
    </div>
  );
};
