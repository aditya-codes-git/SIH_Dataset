import React from 'react';
import { ArrowLeft, Calendar, Eye, User } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';

export const PatientDetails = ({ patient, onBack, onViewScreening }) => {
  if (!patient) return null;

  const latestScreening = patient.latestScreening;
  const isReferable = latestScreening?.referable || latestScreening?.drGrade >= 2;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }} className="animate-fade-in">
      <Button variant="secondary" size="sm" icon={ArrowLeft} onClick={onBack} style={{ alignSelf: 'flex-start' }}>
        Back to Patients List
      </Button>

      {/* Patient Profile Card */}
      <Card style={{ padding: '1rem 1.125rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: 'var(--radius-xs)',
              backgroundColor: 'var(--primary-light)',
              color: 'var(--primary)',
              border: '1px solid var(--primary-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}>
              <User size={20} />
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <h2 style={{ fontSize: '1.0625rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }} className="font-mono">
                  {patient.patientId}
                </h2>
                <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  ({patient.patientName || 'Anonymous'})
                </span>
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0, marginTop: '2px' }}>
                Screening History: {patient.screenings.length} total logged record(s)
              </p>
            </div>
          </div>

          <Badge variant={isReferable ? 'danger' : 'success'} size="md">
            Latest: {latestScreening?.referral || (isReferable ? 'REFERABLE DR' : 'NON-REFERABLE DR')}
          </Badge>
        </div>
      </Card>

      {/* Screening Timeline */}
      <Card
        title="Screening History & Clinical Timeline"
        subtitle="Chronological audit log of patient screenings"
        headerBorder={true}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', marginTop: '0.5rem' }}>
          {patient.screenings.map((s, idx) => {
            const isUngradable = s.status === 'UNGRADABLE';
            const referable = s.status === 'GRADABLE' && s.drGrade !== null && Number(s.drGrade) >= 2;
            const isReviewed = Boolean(s.humanReview?.reviewed || s.triage?.status === 'REVIEWED');

            return (
              <div
                key={s.screeningId || idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.75rem 0.875rem',
                  borderRadius: 'var(--radius-xs)',
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  flexWrap: 'wrap',
                  gap: '0.75rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                  <Calendar size={15} color="var(--primary)" />
                  <div>
                    <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      Date: {s.createdAt ? new Date(s.createdAt).toLocaleDateString() : '—'}
                    </span>
                    <span style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)', display: 'block' }} className="font-mono">
                      Screening ID: {s.screeningId}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  {isUngradable ? (
                    <Badge variant="warning" size="sm">UNGRADABLE</Badge>
                  ) : (
                    <>
                      <Badge variant={referable ? 'danger' : 'success'} size="sm">
                        Grade {s.drGrade}
                      </Badge>
                      <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-primary)' }} className="font-mono">
                        {s.confidence != null ? `${(s.confidence * 100).toFixed(1)}%` : '—'}
                      </span>
                      {referable && (
                        <Badge variant={isReviewed ? 'success' : 'warning'} size="sm">
                          {isReviewed ? `Reviewed: ${s.humanReview?.decision || 'Completed'}` : 'Pending Doctor'}
                        </Badge>
                      )}
                    </>
                  )}

                  <Button variant="secondary" size="sm" icon={Eye} onClick={() => onViewScreening(s)}>
                    Inspect
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
};
