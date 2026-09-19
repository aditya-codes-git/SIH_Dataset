import React from 'react';
import { Eye, Stethoscope } from 'lucide-react';
import { StatCard } from '../components/dashboard/StatCard';
import { GradeDistributionChart } from '../components/dashboard/GradeDistributionChart';
import { ReferralPieChart } from '../components/dashboard/ReferralPieChart';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';

export const Dashboard = ({ screenings = [], onNavigateScreening, onViewScreening }) => {
  const totalScreenings = screenings.length;
  const referableCases = screenings.filter((s) => s.status === 'GRADABLE' && (s.triage?.referralRequired || s.referable || s.drGrade >= 2 || s.grade >= 2)).length;
  const pendingReviews = screenings.filter((s) => !s.humanReview?.reviewed && (s.triage?.referralRequired || s.drGrade >= 2 || s.grade >= 2)).length;
  const reviewedTotal = screenings.filter((s) => s.humanReview?.reviewed).length;
  const recapturedCount = screenings.filter((s) => s.status === 'UNGRADABLE').length;

  const priorityRank = { URGENT: 3, HIGH: 2, MEDIUM: 1, ROUTINE: 0 };
  const pendingQueue = screenings
    .filter((s) => !s.humanReview?.reviewed && (s.triage?.referralRequired || s.drGrade >= 2 || s.grade >= 2))
    .sort((a, b) => {
      const pA = priorityRank[a.triage?.priority] || (a.drGrade === 4 ? 3 : a.drGrade === 3 ? 2 : a.drGrade === 2 ? 1 : 0);
      const pB = priorityRank[b.triage?.priority] || (b.drGrade === 4 ? 3 : b.drGrade === 3 ? 2 : b.drGrade === 2 ? 1 : 0);
      if (pB !== pA) return pB - pA;
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }} className="animate-fade-in">
      {/* Workstation Top Bar */}
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
            <Badge variant="info" size="sm">CLINICAL DASHBOARD</Badge>
            <Badge variant="neutral" size="sm">OPHTHALMOLOGY WORKSTATION</Badge>
          </div>
          <h2 style={{ fontSize: '1.0625rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
            Diabetic Retinopathy Screening Overview
          </h2>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.15rem', margin: 0 }}>
            Operational monitoring, priority case triage, and clinical verification queue.
          </p>
        </div>

        <Button variant="secondary" icon={Stethoscope} onClick={onNavigateScreening}>
          Screenings Database
        </Button>
      </div>

      {/* Operational Metric Blocks */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
        gap: '0.75rem',
      }}>
        <StatCard
          title="Total Screenings"
          value={totalScreenings}
          subtitle="Processed via MATLAB"
          color="var(--primary)"
        />
        <StatCard
          title="Pending Specialist Reviews"
          value={pendingReviews}
          subtitle="Awaiting clinician review"
          color="var(--warning)"
        />
        <StatCard
          title="Referable DR Cases"
          value={referableCases}
          subtitle="Grade ≥ 2 identified"
          color="var(--danger)"
        />
        <StatCard
          title="Reviewed Total"
          value={reviewedTotal}
          subtitle="Clinician sign-off complete"
          color="var(--success)"
        />
        <StatCard
          title="Recapture Required"
          value={recapturedCount}
          subtitle="IQA defect logged"
          color="var(--warning)"
        />
      </div>

      {/* Priority Specialist Review Queue Dominates */}
      <Card
        title="Pending Specialist Reviews Queue"
        subtitle="Referred cases prioritized by urgency and wait time"
        headerBorder={true}
        action={
          <Badge variant={pendingQueue.length > 0 ? 'warning' : 'success'}>
            {pendingQueue.length} Cases Awaiting Sign-off
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
              {pendingQueue.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '2.5rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No referred cases awaiting specialist review. All referable cases are cleared.
                  </td>
                </tr>
              ) : (
                pendingQueue.slice(0, 8).map((s) => {
                  const priority = s.triage?.priority || (s.drGrade === 4 ? 'URGENT' : s.drGrade === 3 ? 'HIGH' : 'MEDIUM');

                  return (
                    <tr key={s.screeningId || s._id} style={{
                      backgroundColor: priority === 'URGENT' ? 'rgba(220, 38, 38, 0.04)' : 'transparent',
                    }}>
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

      {/* Analytics Section */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
        <GradeDistributionChart screenings={screenings} />
        <ReferralPieChart screenings={screenings} />
      </div>
    </div>
  );
};
