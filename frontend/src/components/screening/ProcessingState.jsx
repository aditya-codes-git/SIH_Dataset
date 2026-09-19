import React from 'react';
import { CheckCircle2, Circle, Loader2 } from 'lucide-react';
import { Card } from '../ui/Card';

export const ProcessingState = ({ step = 2 }) => {
  const steps = [
    { id: 1, label: 'Image stream received & format verified' },
    { id: 2, label: 'Evaluating image quality criteria (Focus, Illumination, FOV)' },
    { id: 3, label: 'Executing MATLAB AI Screening pipeline (drScreen.m)' },
    { id: 4, label: 'Generating Grad-CAM visualization & triage summary' },
  ];

  return (
    <Card
      title="Processing Retinal Screening"
      subtitle="Executing validated automated screening pipeline"
      headerBorder={true}
      style={{ maxWidth: '560px', margin: '1.5rem auto' }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', marginTop: '0.5rem' }}>
        {steps.map((s) => {
          const isDone = s.id < step;
          const isCurrent = s.id === step;
          return (
            <div
              key={s.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.625rem',
                padding: '0.5rem 0.75rem',
                borderRadius: 'var(--radius-xs)',
                backgroundColor: isCurrent ? 'var(--primary-light)' : 'var(--bg-secondary)',
                border: isCurrent ? '1px solid var(--primary-border)' : '1px solid transparent',
              }}
            >
              {isDone ? (
                <CheckCircle2 size={15} color="var(--success)" style={{ flexShrink: 0 }} />
              ) : isCurrent ? (
                <Loader2 size={15} color="var(--primary)" style={{ animation: 'spin 1s linear infinite', flexShrink: 0 }} />
              ) : (
                <Circle size={15} color="var(--text-muted)" style={{ flexShrink: 0 }} />
              )}
              <span style={{
                fontSize: '0.78125rem',
                fontWeight: isCurrent ? 600 : 400,
                color: isDone ? 'var(--text-primary)' : isCurrent ? 'var(--primary)' : 'var(--text-muted)',
              }}>
                {s.label}
              </span>
            </div>
          );
        })}
      </div>

      <p style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: '0.75rem', marginBottom: 0, textAlign: 'center' }}>
        Operational note: Automated checks prevent ungradable images from generating unreliable predictions.
      </p>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </Card>
  );
};
