import React from 'react';
import { CheckCircle2, AlertCircle, Focus, Sun, Eye } from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';

export const QualityCard = ({ quality }) => {
  const q = quality || {};
  const isPass = q.gradable;

  return (
    <Card title="Image Quality Assessment (IQA)" subtitle="Automated check performed prior to DR classification">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {isPass ? <CheckCircle2 size={20} color="var(--success)" /> : <AlertCircle size={20} color="var(--warning)" />}
          <span style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            {isPass ? 'Quality Assessment Passed' : 'Quality Assessment Warning'}
          </span>
        </div>
        <Badge variant={isPass ? 'success' : 'warning'}>
          {isPass ? 'GRADABLE' : 'UNGRADABLE'}
        </Badge>
      </div>

      <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '1rem', fontStyle: 'italic' }}>
        "{q.reason || 'Image quality acceptable.'}"
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
        <div style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: 'var(--text-secondary)', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
            <Focus size={14} color="var(--primary)" />
            <span>Focus Variance</span>
          </div>
          <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            {q.focusScore != null ? q.focusScore.toFixed(6) : 'N/A'}
          </span>
          <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.125rem' }}>
            ≥ 0.00008
          </span>
        </div>

        <div style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: 'var(--text-secondary)', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
            <Sun size={14} color="var(--warning)" />
            <span>Mean Brightness</span>
          </div>
          <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            {q.brightness != null ? q.brightness.toFixed(4) : 'N/A'}
          </span>
          <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.125rem' }}>
            0.08 – 0.40
          </span>
        </div>

        <div style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: 'var(--text-secondary)', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
            <Eye size={14} color="var(--info)" />
            <span>Retinal FOV Ratio</span>
          </div>
          <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            {q.fovRatio != null ? (q.fovRatio * 100).toFixed(1) + '%' : 'N/A'}
          </span>
          <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.125rem' }}>
            ≥ 45.0%
          </span>
        </div>
      </div>
    </Card>
  );
};
