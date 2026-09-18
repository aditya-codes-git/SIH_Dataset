import React from 'react';
import { Eye, Users, AlertCircle, CheckCircle2, FileUp, Sparkles } from 'lucide-react';
import { StatCard } from '../components/dashboard/StatCard';
import { GradeDistributionChart } from '../components/dashboard/GradeDistributionChart';
import { ReferralPieChart } from '../components/dashboard/ReferralPieChart';
import { RecentScreeningsTable } from '../components/dashboard/RecentScreeningsTable';
import { Button } from '../components/ui/Button';

export const Dashboard = ({ screenings = [], onNavigateScreening, onViewScreening }) => {
  const totalScreenings = screenings.length;
  const referableCases = screenings.filter((s) => s.referable).length;
  const pendingReviews = screenings.filter((s) => !s.humanReview?.reviewed).length;
  const gradableImages = screenings.filter((s) => s.status === 'GRADABLE').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Banner / Welcome */}
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
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            Welcome to RetinoScan AI Dashboard
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            Explainable AI decision-support platform for Diabetic Retinopathy screening in rural clinics.
          </p>
        </div>

        <Button variant="primary" icon={FileUp} onClick={onNavigateScreening}>
          Screen New Patient
        </Button>
      </div>

      {/* Stat Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '1.25rem',
      }}>
        <StatCard
          title="Total Screenings"
          value={totalScreenings}
          subtitle="Processed via MATLAB engine"
          icon={Eye}
          color="var(--primary)"
        />
        <StatCard
          title="Referable DR Cases"
          value={referableCases}
          subtitle="Grade ≥ 2 threshold met"
          icon={AlertCircle}
          color="var(--danger)"
        />
        <StatCard
          title="Pending Clinical Reviews"
          value={pendingReviews}
          subtitle="Awaiting clinician signoff"
          icon={Users}
          color="var(--warning)"
        />
        <StatCard
          title="Gradable Image Rate"
          value={totalScreenings > 0 ? `${((gradableImages / totalScreenings) * 100).toFixed(1)}%` : '100%'}
          subtitle="IQA assessment pass rate"
          icon={CheckCircle2}
          color="var(--success)"
        />
      </div>

      {/* Charts Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
        gap: '1.25rem',
      }}>
        <GradeDistributionChart />
        <ReferralPieChart />
      </div>

      {/* Recent Screenings Table */}
      <RecentScreeningsTable
        screenings={screenings}
        onViewScreening={onViewScreening}
      />
    </div>
  );
};
