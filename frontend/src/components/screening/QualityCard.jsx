import React from 'react';
import { CheckCircle2, AlertCircle, Focus, Sun, Eye } from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';

export const QualityCard = ({ quality, status }) => {
  const q = quality || {};
  const isPass = q.gradable ?? (status === 'GRADABLE');

  return (
    <Card
      title="Image Quality Assessment (IQA)"
      subtitle="Automated MATLAB operational evaluation (Laplacian variance, intensity, FOV)"
      headerBorder={true}
      action={
        <Badge variant={isPass ? 'success' : 'warning'}>
          {isPass ? 'IQA PASSED — GRADABLE' : 'IQA DEFECT — UNGRADABLE'}
        </Badge>
      }
    >
      <div style={{
        padding: '0.625rem 0.75rem',
        backgroundColor: isPass ? 'var(--success-bg)' : 'var(--warning-bg)',
        border: `1px solid ${isPass ? 'var(--success-border)' : 'var(--warning-border)'}`,
        borderRadius: 'var(--radius-xs)',
        marginBottom: '0.75rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
      }}>
        {isPass ? <CheckCircle2 size={16} color="var(--success)" /> : <AlertCircle size={16} color="var(--warning)" />}
        <p style={{ fontSize: '0.75rem', color: 'var(--text-primary)', margin: 0 }}>
          {q.reason ? `Evaluation Note: "${q.reason}"` : isPass ? 'Retinal image satisfies focus, illumination, and field-of-view criteria.' : 'Image quality insufficient for automated diagnostic classification.'}
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
        <div style={{ padding: '0.5rem', borderRadius: 'var(--radius-xs)', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--text-secondary)', fontSize: '0.6875rem', marginBottom: '0.2rem' }}>
            <Focus size={13} color="var(--primary)" />
            <span>Focus Variance</span>
          </div>
          <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }} className="font-mono">
            {q.focusScore != null ? q.focusScore.toFixed(6) : '—'}
          </span>
          <span style={{ fontSize: '0.625rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.1rem' }}>
            Threshold: ≥ 0.00008
          </span>
        </div>

        <div style={{ padding: '0.5rem', borderRadius: 'var(--radius-xs)', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--text-secondary)', fontSize: '0.6875rem', marginBottom: '0.2rem' }}>
            <Sun size={13} color="var(--warning)" />
            <span>Mean Brightness</span>
          </div>
          <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }} className="font-mono">
            {q.brightness != null ? q.brightness.toFixed(4) : '—'}
          </span>
          <span style={{ fontSize: '0.625rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.1rem' }}>
            Range: 0.08–0.40
          </span>
        </div>

        <div style={{ padding: '0.5rem', borderRadius: 'var(--radius-xs)', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--text-secondary)', fontSize: '0.6875rem', marginBottom: '0.2rem' }}>
            <Eye size={13} color="var(--primary)" />
            <span>Retinal FOV Ratio</span>
          </div>
          <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }} className="font-mono">
            {q.fovRatio != null ? `${(q.fovRatio * 100).toFixed(1)}%` : '—'}
          </span>
          <span style={{ fontSize: '0.625rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.1rem' }}>
            Threshold: ≥ 45.0%
          </span>
        </div>
      </div>
    </Card>
  );
};
