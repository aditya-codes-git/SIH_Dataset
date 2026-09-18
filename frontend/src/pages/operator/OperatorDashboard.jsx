import React from 'react';
import { FileUp, UserPlus, ListTodo, Users, CheckCircle2, AlertTriangle, Clock, RefreshCw, ArrowRight } from 'lucide-react';
import { StatCard } from '../../components/dashboard/StatCard';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';

export const OperatorDashboard = ({ screenings = [], onNavigateScreening, onNavigateQueue, onNavigatePatients }) => {
  const totalScreened = screenings.length;
  const recapturedCount = screenings.filter((s) => s.status === 'UNGRADABLE').length;
  const routineCount = screenings.filter((s) => s.status === 'GRADABLE' && (!s.triage?.referralRequired && (s.drGrade === 0 || s.drGrade === 1))).length;
  const referralCount = screenings.filter((s) => s.status === 'GRADABLE' && (s.triage?.referralRequired || s.drGrade >= 2)).length;
  const highPriorityCount = screenings.filter((s) => s.status === 'GRADABLE' && (s.triage?.priority === 'HIGH' || s.triage?.priority === 'URGENT' || s.drGrade >= 3)).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }} className="animate-fade-in">
      {/* Camp Operational Banner */}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Badge variant="info" size="sm">RURAL HEALTH CAMP</Badge>
            <Badge variant="success" size="sm">OPERATOR WORKFLOW</Badge>
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.375rem', margin: 0 }}>
            Rural Eye Camp — Operator Screening Operations
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            Perform patient registration, fundus capture, image quality checks, and AI screening routing for specialist review.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <Button variant="primary" icon={FileUp} onClick={onNavigateScreening}>
            + NEW SCREENING
          </Button>
          <Button variant="secondary" icon={ListTodo} onClick={onNavigateQueue}>
            Screening Queue
          </Button>
        </div>
      </div>

      {/* Operational Camp Statistics */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1.25rem',
      }}>
        <StatCard
          title="Patients Screened"
          value={totalScreened}
          subtitle="Total camp screenings"
          icon={FileUp}
          color="var(--primary)"
        />
        <StatCard
          title="Routine Follow-ups"
          value={routineCount}
          subtitle="Low Risk (Grade 0–1)"
          icon={CheckCircle2}
          color="var(--success)"
        />
        <StatCard
          title="Specialist Referrals"
          value={referralCount}
          subtitle="Referred to Doctor (Grade 2+)"
          icon={Users}
          color="var(--warning)"
        />
        <StatCard
          title="High Priority Referrals"
          value={highPriorityCount}
          subtitle="Severe cases (Grade 3–4)"
          icon={AlertTriangle}
          color="var(--danger)"
        />
        <StatCard
          title="Images Recaptured"
          value={recapturedCount}
          subtitle="IQA quality warnings"
          icon={RefreshCw}
          color="var(--info)"
        />
      </div>

      {/* Recent Screening Queue Table */}
      <Card title="Recent Camp Screening Queue" subtitle="Operational status and routing decisions">
        <div style={{ overflowX: 'auto', marginTop: '0.5rem' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                <th style={{ padding: '0.75rem 1rem' }}>Patient ID</th>
                <th style={{ padding: '0.75rem 1rem' }}>Name</th>
                <th style={{ padding: '0.75rem 1rem' }}>Time</th>
                <th style={{ padding: '0.75rem 1rem' }}>Image Quality</th>
                <th style={{ padding: '0.75rem 1rem' }}>Screening Result</th>
                <th style={{ padding: '0.75rem 1rem' }}>Camp Routing Action</th>
              </tr>
            </thead>
            <tbody>
              {screenings.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No screenings in queue. Click "+ NEW SCREENING" to start.
                  </td>
                </tr>
              ) : (
                screenings.slice(0, 6).map((s) => {
                  const isUngradable = s.status === 'UNGRADABLE';
                  const isReferable = s.triage?.referralRequired || s.drGrade >= 2;
                  const priority = s.triage?.priority || 'ROUTINE';

                  return (
                    <tr key={s.screeningId || s._id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '0.875rem 1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {s.patientId || 'PATIENT-ANONYMOUS'}
                      </td>
                      <td style={{ padding: '0.875rem 1rem', color: 'var(--text-secondary)' }}>
                        {s.patientName || 'Anonymous Patient'}
                      </td>
                      <td style={{ padding: '0.875rem 1rem', color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>
                        {s.createdAt ? new Date(s.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                      </td>
                      <td style={{ padding: '0.875rem 1rem' }}>
                        {isUngradable ? (
                          <Badge variant="warning">Recapture Required</Badge>
                        ) : (
                          <Badge variant="success">Quality Passed</Badge>
                        )}
                      </td>
                      <td style={{ padding: '0.875rem 1rem' }}>
                        {isUngradable ? (
                          <span style={{ color: 'var(--warning)', fontSize: '0.8125rem' }}>IQA Failed</span>
                        ) : (
                          <Badge variant={isReferable ? 'danger' : 'success'}>
                            Grade {s.drGrade ?? s.grade ?? 0}
                          </Badge>
                        )}
                      </td>
                      <td style={{ padding: '0.875rem 1rem' }}>
                        {isUngradable ? (
                          <Button variant="outline" size="sm" icon={RefreshCw} onClick={onNavigateScreening}>
                            Recapture Image
                          </Button>
                        ) : isReferable ? (
                          <Badge variant={priority === 'URGENT' ? 'danger' : 'warning'}>
                            Specialist Review ({priority})
                          </Badge>
                        ) : (
                          <Badge variant="success">Routine Follow-up</Badge>
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
