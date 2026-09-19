import React from 'react';
import { ShieldCheck, AlertCircle, CheckCircle } from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';

const GRADE_LABELS = {
  0: 'Grade 0 — No Apparent DR',
  1: 'Grade 1 — Mild Non-Proliferative DR',
  2: 'Grade 2 — Moderate Non-Proliferative DR',
  3: 'Grade 3 — Severe Non-Proliferative DR',
  4: 'Grade 4 — Proliferative DR',
};

export const ModelResultCard = ({ result }) => {
  if (!result || result.status === 'UNGRADABLE') return null;

  const grade = result.drGrade ?? result.grade ?? 0;
  const confidence = result.confidence != null ? `${(result.confidence * 100).toFixed(1)}%` : '—';
  const isReferable = result.referable || grade >= 2 || result.triage?.referralRequired;
  const referralText = result.referral || (isReferable ? 'REFERABLE DR (Grade ≥ 2)' : 'NON-REFERABLE DR');

  return (
    <Card
      title="AI Screening Output"
      subtitle="Processed by validated project algorithm (ResNet-18 / drScreen.m)"
      headerBorder={true}
      action={
        <Badge variant={isReferable ? 'danger' : 'success'}>
          {referralText}
        </Badge>
      }
    >
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', marginTop: '0.5rem' }}>
        {/* DR Grade Box */}
        <div style={{
          padding: '0.875rem',
          borderRadius: 'var(--radius-xs)',
          backgroundColor: isReferable ? 'var(--danger-bg)' : 'var(--success-bg)',
          border: `1px solid ${isReferable ? 'var(--danger-border)' : 'var(--success-border)'}`,
        }}>
          <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Model Predicted Grade
          </span>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: isReferable ? 'var(--danger)' : 'var(--success)', marginTop: '0.15rem' }}>
            Grade {grade}
          </div>
          <p style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-primary)', margin: 0, marginTop: '0.2rem' }}>
            {GRADE_LABELS[grade] || `Grade ${grade}`}
          </p>
        </div>

        {/* Model Confidence Box */}
        <div style={{
          padding: '0.875rem',
          borderRadius: 'var(--radius-xs)',
          backgroundColor: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
        }}>
          <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Model Confidence
          </span>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.15rem' }} className="font-mono">
            {confidence}
          </div>
          <p style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', margin: 0, marginTop: '0.2rem' }}>
            Probability distribution score
          </p>
        </div>

        {/* Referral Protocol Box */}
        <div style={{
          padding: '0.875rem',
          borderRadius: 'var(--radius-xs)',
          backgroundColor: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
        }}>
          <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Referral Triage Protocol
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.35rem' }}>
            {isReferable ? <AlertCircle size={16} color="var(--danger)" /> : <CheckCircle size={16} color="var(--success)" />}
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: isReferable ? 'var(--danger)' : 'var(--success)' }}>
              {isReferable ? 'Specialist Referral Required' : 'Routine Follow-up'}
            </span>
          </div>
          <p style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', margin: 0, marginTop: '0.2rem' }}>
            {isReferable ? 'Clinical protocol threshold Grade ≥ 2 satisfied.' : 'Grade < 2 non-referable threshold.'}
          </p>
        </div>
      </div>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.4rem',
        fontSize: '0.6875rem',
        color: 'var(--text-muted)',
        borderTop: '1px solid var(--border-color)',
        paddingTop: '0.625rem',
        marginTop: '0.75rem',
      }}>
        <ShieldCheck size={13} color="var(--primary)" />
        <span>Authoritative MATLAB classifier execution. Final diagnostic determination rests with the examining clinician.</span>
      </div>
    </Card>
  );
};
