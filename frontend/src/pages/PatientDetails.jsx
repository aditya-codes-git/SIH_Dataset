import React from 'react';
import { ArrowLeft, User, Calendar, Eye, CheckCircle2, AlertCircle } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';

export const PatientDetails = ({ patient, onBack, onViewScreening }) => {
  if (!patient) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }} className="animate-fade-in">
      <Button variant="secondary" size="sm" icon={ArrowLeft} onClick={onBack} style={{ alignSelf: 'flex-start' }}>
        Back to Patients List
      </Button>

      {/* Patient Overview Card */}
      <Card>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{
            width: '54px',
            height: '54px',
            borderRadius: 'var(--radius-full)',
            backgroundColor: 'var(--primary-light)',
            color: 'var(--primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <User size={28} />
          </div>

          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              Patient Record: {patient.patientId}
            </h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: '0.25rem 0 0 0' }}>
              Total Screenings History: {patient.screenings.length} record(s)
            </p>
          </div>

          <Badge variant={patient.latestScreening?.referable ? 'danger' : 'success'} size="lg">
            Latest: {patient.latestScreening?.referral || 'NON-REFERABLE DR'}
          </Badge>
        </div>
      </Card>

      {/* Timeline History */}
      <Card title="Screening Timeline & History" subtitle="Authoritative historical screening results (READ-ONLY)">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.75rem' }}>
          {patient.screenings.map((s, idx) => {
            const isUngradable = s.status === 'UNGRADABLE';
            const isReferable = s.referable;
            return (
              <div
                key={s.screeningId || idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '1rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  flexWrap: 'wrap',
                  gap: '1rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <Calendar size={18} color="var(--primary)" />
                  <div>
                    <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      Screening Date: {s.createdAt ? new Date(s.createdAt).toLocaleDateString() : 'N/A'}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block' }}>
                      ID: {s.screeningId}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  {isUngradable ? (
                    <Badge variant="warning">UNGRADABLE</Badge>
                  ) : (
                    <>
                      <Badge variant={isReferable ? 'danger' : 'success'}>
                        Grade {s.drGrade ?? s.grade}
                      </Badge>
                      <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {(s.confidence * 100).toFixed(2)}% Conf.
                      </span>
                    </>
                  )}

                  <Button variant="secondary" size="sm" icon={Eye} onClick={() => onViewScreening(s)}>
                    View Result & Grad-CAM
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
