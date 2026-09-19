import React from 'react';
import { AlertTriangle, RefreshCw, Focus, Sun, Eye } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

export const UngradableWarning = ({ quality, message, onReset }) => {
  const q = quality || {};

  return (
    <Card
      style={{ borderLeft: '3px solid var(--warning)' }}
      title="Image Quality Gate — Recapture Required"
      subtitle="Automated Image Quality Assessment (IQA) stopped classification"
      headerBorder={true}
      action={<Badge variant="warning">UNGRADABLE IMAGE</Badge>}
    >
      <div style={{
        padding: '0.75rem 0.875rem',
        borderRadius: 'var(--radius-xs)',
        backgroundColor: 'var(--warning-bg)',
        border: '1px solid var(--warning-border)',
        marginBottom: '0.875rem',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '0.625rem',
      }}>
        <AlertTriangle size={18} color="var(--warning)" style={{ flexShrink: 0, marginTop: '2px' }} />
        <div>
          <strong style={{ fontSize: '0.8125rem', color: 'var(--text-primary)', display: 'block' }}>
            {q.reason || message || 'Image quality criteria not met.'}
          </strong>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0, marginTop: '0.2rem' }}>
            Retinal classification was withheld to prevent unreliable automated diagnostic predictions. Please reposition patient and acquire a new photograph.
          </p>
        </div>
      </div>

      {/* Quality Check Breakdown */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '0.5rem',
        marginBottom: '1rem',
      }}>
        <div style={{ padding: '0.5rem 0.75rem', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--text-secondary)', fontSize: '0.6875rem', marginBottom: '0.15rem' }}>
            <Focus size={13} color="var(--primary)" />
            <span>Focus Variance</span>
          </div>
          <strong style={{ fontSize: '0.8125rem', color: 'var(--text-primary)' }} className="font-mono">
            {q.focusScore != null ? q.focusScore.toFixed(6) : '—'}
          </strong>
          <span style={{ fontSize: '0.625rem', color: 'var(--text-muted)', display: 'block' }}>Required: ≥ 0.00008</span>
        </div>

        <div style={{ padding: '0.5rem 0.75rem', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--text-secondary)', fontSize: '0.6875rem', marginBottom: '0.15rem' }}>
            <Sun size={13} color="var(--warning)" />
            <span>Mean Brightness</span>
          </div>
          <strong style={{ fontSize: '0.8125rem', color: 'var(--text-primary)' }} className="font-mono">
            {q.brightness != null ? q.brightness.toFixed(4) : '—'}
          </strong>
          <span style={{ fontSize: '0.625rem', color: 'var(--text-muted)', display: 'block' }}>Acceptable: 0.08–0.40</span>
        </div>

        <div style={{ padding: '0.5rem 0.75rem', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--text-secondary)', fontSize: '0.6875rem', marginBottom: '0.15rem' }}>
            <Eye size={13} color="var(--primary)" />
            <span>Field of View</span>
          </div>
          <strong style={{ fontSize: '0.8125rem', color: 'var(--text-primary)' }} className="font-mono">
            {q.fovRatio != null ? `${(q.fovRatio * 100).toFixed(1)}%` : '—'}
          </strong>
          <span style={{ fontSize: '0.625rem', color: 'var(--text-muted)', display: 'block' }}>Required: ≥ 45.0%</span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }}>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0 }}>
          Operator Guidance: Ensure clear pupil alignment and optimal flash illumination before recapturing.
        </p>
        <Button variant="primary" icon={RefreshCw} onClick={onReset}>
          Recapture Image
        </Button>
      </div>
    </Card>
  );
};
