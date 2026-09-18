import React from 'react';
import { Clock, Eye, AlertTriangle, CheckCircle2, Stethoscope, Filter } from 'lucide-react';
import { StatCard } from '../../components/dashboard/StatCard';
import { GradeDistributionChart } from '../../components/dashboard/GradeDistributionChart';
import { ReferralPieChart } from '../../components/dashboard/ReferralPieChart';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';

export const Dashboard = ({ screenings = [], onViewScreening, onNavigateScreenings }) => {
  // Pending Specialist Reviews Queue
  const pendingReviews = screenings.filter((s) => !s.humanReview?.reviewed && (s.triage?.referralRequired || s.drGrade >= 2));
  const urgentCount = pendingReviews.filter((s) => s.triage?.priority === 'URGENT' || s.drGrade === 4).length;
  const highCount = pendingReviews.filter((s) => s.triage?.priority === 'HIGH' || s.drGrade === 3).length;
  const mediumCount = pendingReviews.filter((s) => s.triage?.priority === 'MEDIUM' || s.drGrade === 2).length;
  const reviewedToday = screenings.filter((s) => s.humanReview?.reviewed).length;

  // Sorting Pending Reviews: 1. Priority (URGENT > HIGH > MEDIUM), 2. Waiting Time
  const priorityRank = { URGENT: 3, HIGH: 2, MEDIUM: 1, ROUTINE: 0 };
  const sortedPending = [...pendingReviews].sort((a, b) => {
    const pA = priorityRank[a.triage?.priority] || (a.drGrade === 4 ? 3 : a.drGrade === 3 ? 2 : a.drGrade === 2 ? 1 : 0);
    const pB = priorityRank[b.triage?.priority] || (b.drGrade === 4 ? 3 : b.drGrade === 3 ? 2 : b.drGrade === 2 ? 1 : 0);
    if (pB !== pA) return pB - pA;
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }} className="animate-fade-in">
      {/* Banner */}
      <div style={{
        padding: '1.5rem',
        borderRadius: 'var(--radius-lg)',
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
      }}>
        <div>
          <Badge variant="info" size="sm">OPHTHALMOLOGIST CLINICAL DASHBOARD</Badge>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.375rem', margin: 0 }}>
            Specialist Review & Triage Queue
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            Review referred high-risk cases (Grade 2+), inspect Grad-CAM explainability, and submit clinical assessments.
          </p>
        </div>

        <Button variant="primary" icon={Stethoscope} onClick={onNavigateScreenings}>
          View All Screenings Database
        </Button>
      </div>

      {/* Specialist Queue Stat Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '1.25rem',
      }}>
        <StatCard
          title="Total Pending Reviews"
          value={pendingReviews.length}
          subtitle="Referred cases awaiting review"
          icon={Clock}
          color="var(--warning)"
        />
        <StatCard
          title="Urgent (Grade 4)"
          value={urgentCount}
          subtitle="Proliferative DR"
          icon={AlertTriangle}
          color="var(--danger)"
        />
        <StatCard
          title="High Priority (Grade 3)"
          value={highCount}
          subtitle="Severe NPDR"
          icon={AlertTriangle}
          color="var(--warning)"
        />
        <StatCard
          title="Medium Priority (Grade 2)"
          value={mediumCount}
          subtitle="Moderate NPDR"
          icon={Clock}
          color="var(--info)"
        />
        <StatCard
          title="Reviewed Today"
          value={reviewedToday}
          subtitle="Clinician confirmed decisions"
          icon={CheckCircle2}
          color="var(--success)"
        />
      </div>

      {/* PRIMARY CLINICAL WORKFLOW: PENDING SPECIALIST REVIEWS QUEUE */}
      <Card
        title="Pending Specialist Reviews Queue"
        subtitle="Cases sorted by Priority (URGENT > HIGH > MEDIUM) and Waiting Time"
        action={<Badge variant="warning">{sortedPending.length} Cases Pending</Badge>}
      >
        <div style={{ overflowX: 'auto', marginTop: '0.5rem' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                <th style={{ padding: '0.75rem 1rem' }}>Priority</th>
                <th style={{ padding: '0.75rem 1rem' }}>Patient ID</th>
                <th style={{ padding: '0.75rem 1rem' }}>Patient Name</th>
                <th style={{ padding: '0.75rem 1rem' }}>DR Grade</th>
                <th style={{ padding: '0.75rem 1rem' }}>Confidence</th>
                <th style={{ padding: '0.75rem 1rem' }}>Screening Date</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {sortedPending.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No referred cases awaiting specialist review. All high-risk cases are cleared!
                  </td>
                </tr>
              ) : (
                sortedPending.map((s) => {
                  const priority = s.triage?.priority || (s.drGrade === 4 ? 'URGENT' : s.drGrade === 3 ? 'HIGH' : 'MEDIUM');

                  return (
                    <tr key={s.screeningId || s._id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '0.875rem 1rem' }}>
                        <Badge variant={priority === 'URGENT' ? 'danger' : priority === 'HIGH' ? 'warning' : 'info'}>
                          {priority}
                        </Badge>
                      </td>
                      <td style={{ padding: '0.875rem 1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {s.patientId}
                      </td>
                      <td style={{ padding: '0.875rem 1rem', color: 'var(--text-secondary)' }}>
                        {s.patientName || 'Anonymous Patient'}
                      </td>
                      <td style={{ padding: '0.875rem 1rem' }}>
                        <Badge variant="danger">Grade {s.drGrade ?? s.grade}</Badge>
                      </td>
                      <td style={{ padding: '0.875rem 1rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                        {s.confidence != null ? (s.confidence * 100).toFixed(1) + '%' : 'N/A'}
                      </td>
                      <td style={{ padding: '0.875rem 1rem', color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>
                        {s.createdAt ? new Date(s.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'Today'}
                      </td>
                      <td style={{ padding: '0.875rem 1rem', textAlign: 'right' }}>
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

      {/* Analytics Section */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        <GradeDistributionChart screenings={screenings} />
        <ReferralPieChart screenings={screenings} />
      </div>
    </div>
  );
};
