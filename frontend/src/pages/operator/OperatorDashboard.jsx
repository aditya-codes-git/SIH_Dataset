import React from 'react';
import { FileUp, ListTodo, Users, RefreshCw } from 'lucide-react';
import { StatCard } from '../../components/dashboard/StatCard';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';

export const OperatorDashboard = ({ screenings = [], onNavigateScreening, onNavigateQueue, onNavigatePatients }) => {
  const totalScreened = screenings.length;
  const recapturedCount = screenings.filter((s) => s.status === 'UNGRADABLE').length;
  const routineCount = screenings.filter((s) => s.status === 'GRADABLE' && (!s.triage?.referralRequired && (s.drGrade === 0 || s.drGrade === 1))).length;
  const referableCount = screenings.filter((s) => s.status === 'GRADABLE' && (s.triage?.referralRequired || s.drGrade >= 2 || s.grade >= 2)).length;
  const pendingReviewCount = screenings.filter((s) => s.status === 'GRADABLE' && (s.triage?.referralRequired || s.drGrade >= 2) && !s.humanReview?.reviewed).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }} className="animate-fade-in">
      {/* Camp Operational Top Bar */}
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
            <Badge variant="info" size="sm">RURAL HEALTH SCREENING</Badge>
            <Badge variant="neutral" size="sm">OPERATOR STATION</Badge>
          </div>
          <h2 style={{ fontSize: '1.0625rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
            Rural Retinal Screening Operations
          </h2>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.15rem', margin: 0 }}>
            Perform patient intake, fundus acquisition, automated quality checks, and routing for specialist evaluation.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <Button variant="primary" icon={FileUp} onClick={onNavigateScreening}>
            New Screening
          </Button>
          <Button variant="secondary" icon={ListTodo} onClick={onNavigateQueue}>
            Queue
          </Button>
          <Button variant="secondary" icon={Users} onClick={onNavigatePatients}>
            Patients
          </Button>
        </div>
      </div>

      {/* Operational Statistics - Compact Metric Blocks */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
        gap: '0.75rem',
      }}>
        <StatCard
          title="Total Screenings"
          value={totalScreened}
          subtitle="All camp submissions"
          color="var(--primary)"
        />
        <StatCard
          title="Pending Specialist Review"
          value={pendingReviewCount}
          subtitle="Awaiting clinician sign-off"
          color="var(--warning)"
        />
        <StatCard
          title="Referable Cases"
          value={referableCount}
          subtitle="Grade ≥ 2 identified"
          color="var(--danger)"
        />
        <StatCard
          title="Routine Follow-ups"
          value={routineCount}
          subtitle="Low Risk (Grade 0–1)"
          color="var(--success)"
        />
        <StatCard
          title="Requires Recapture"
          value={recapturedCount}
          subtitle="IQA criteria not met"
          color="var(--warning)"
        />
      </div>

      {/* Main Operational Focus: Screening Queue Table */}
      <Card
        title="Screening Center Operational Queue"
        subtitle="Live queue of processed field screenings with quality gates and routing actions"
        headerBorder={true}
        action={
          <span style={{ fontSize: '0.71875rem', color: 'var(--text-secondary)' }}>
            Showing {Math.min(screenings.length, 10)} of {screenings.length} records
          </span>
        }
      >
        <div style={{ overflowX: 'auto', margin: '0 -1.125rem -1rem -1.125rem' }}>
          <table className="clinical-table">
            <thead>
              <tr>
                <th>Patient ID</th>
                <th>Patient Name</th>
                <th>Time</th>
                <th>Image Quality</th>
                <th>DR Grade</th>
                <th>Referral Status</th>
                <th style={{ textAlign: 'right' }}>Routing Action</th>
              </tr>
            </thead>
            <tbody>
              {screenings.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '2.5rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No screenings in queue. Click "New Screening" to register a patient and upload fundus images.
                  </td>
                </tr>
              ) : (
                screenings.slice(0, 10).map((s) => {
                  const isUngradable = s.status === 'UNGRADABLE';
                  const isReferable = s.triage?.referralRequired || s.drGrade >= 2 || s.grade >= 2;
                  const priority = s.triage?.priority || 'ROUTINE';

                  return (
                    <tr key={s.screeningId || s._id}>
                      <td style={{ fontWeight: 600, color: 'var(--text-primary)' }} className="font-mono">
                        {s.patientId || 'PATIENT-ANONYMOUS'}
                      </td>

                      <td style={{ color: 'var(--text-secondary)' }}>
                        {s.patientName || 'Anonymous Patient'}
                      </td>

                      <td style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                        {s.createdAt ? new Date(s.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
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

                      <td>
                        {isUngradable ? (
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>—</span>
                        ) : isReferable ? (
                          <Badge variant={priority === 'URGENT' ? 'danger' : 'warning'} size="sm">
                            Specialist Review ({priority})
                          </Badge>
                        ) : (
                          <Badge variant="success" size="sm">Routine Follow-up</Badge>
                        )}
                      </td>

                      <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                        {isUngradable ? (
                          <Button variant="outline" size="sm" icon={RefreshCw} onClick={onNavigateScreening}>
                            Recapture
                          </Button>
                        ) : (
                          <Button variant="secondary" size="sm" icon={ListTodo} onClick={onNavigateQueue}>
                            View Queue
                          </Button>
                        )}
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
