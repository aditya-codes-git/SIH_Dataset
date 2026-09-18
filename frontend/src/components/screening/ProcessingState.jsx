import React from 'react';
import { CheckCircle2, Circle, Loader2, Cpu } from 'lucide-react';
import { Card } from '../ui/Card';

export const ProcessingState = ({ step = 2 }) => {
  const steps = [
    { id: 1, label: 'Image received & file integrity verified' },
    { id: 2, label: 'Checking image quality (Focus, Illumination, FOV)' },
    { id: 3, label: 'Executing MATLAB AI Screening pipeline (drScreen.m)' },
    { id: 4, label: 'Generating Grad-CAM visualization & clinical summary' },
  ];

  return (
    <Card className="animate-fade-in" style={{ maxWidth: '600px', margin: '2rem auto', textAlign: 'center' }}>
      <div style={{
        width: '56px',
        height: '56px',
        borderRadius: 'var(--radius-full)',
        backgroundColor: 'var(--primary-light)',
        color: 'var(--primary)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 1rem auto',
      }}>
        <Cpu size={28} className="animate-pulse-glow" />
      </div>

      <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
        Analyzing Retinal Image...
      </h3>
      <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.25rem', marginBottom: '1.75rem' }}>
        Please wait while the validated MATLAB Diabetic Retinopathy screening model processes the image.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem', textAlign: 'left', backgroundColor: 'var(--bg-secondary)', padding: '1.25rem', borderRadius: 'var(--radius-md)' }}>
        {steps.map((s) => {
          const isDone = s.id < step;
          const isCurrent = s.id === step;
          return (
            <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              {isDone ? (
                <CheckCircle2 size={18} color="var(--success)" />
              ) : isCurrent ? (
                <Loader2 size={18} color="var(--primary)" style={{ animation: 'spin 1s linear infinite' }} />
              ) : (
                <Circle size={18} color="var(--text-muted)" />
              )}
              <span style={{
                fontSize: '0.875rem',
                fontWeight: isCurrent ? 600 : 400,
                color: isDone ? 'var(--text-primary)' : isCurrent ? 'var(--primary)' : 'var(--text-muted)',
              }}>
                {s.label}
              </span>
            </div>
          );
        })}
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </Card>
  );
};
