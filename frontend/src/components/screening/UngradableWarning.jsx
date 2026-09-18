import React from 'react';
import { AlertTriangle, RefreshCw, Eye, Sun, Focus } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

export const UngradableWarning = ({ quality, message, onReset }) => {
  const q = quality || {};

  return (
    <Card className="animate-fade-in" style={{ borderLeft: '4px solid var(--warning)', maxWidth: '720px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '1.25rem' }}>
        <div style={{
          width: '44px',
          height: '44px',
          borderRadius: 'var(--radius-full)',
          backgroundColor: 'var(--warning-bg)',
          color: 'var(--warning)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}>
          <AlertTriangle size={24} />
        </div>
        <div>
          <Badge variant="warning" size="md">UNGRADABLE IMAGE</Badge>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '0.375rem', margin: 0 }}>
            Image Quality is Insufficient for DR Screening
          </h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            {q.reason || message || 'The image did not satisfy MATLAB Image Quality Assessment criteria.'}
          </p>
        </div>
      </div>

      {/* Quality Check Breakdown */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '0.75rem',
        backgroundColor: 'var(--bg-secondary)',
        padding: '1rem',
        borderRadius: 'var(--radius-md)',
        marginBottom: '1.5rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Focus size={16} color="var(--primary)" />
          <div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0 }}>Focus Score</p>
            <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
              {q.focusScore != null ? q.focusScore.toFixed(6) : 'N/A'}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Sun size={16} color="var(--warning)" />
          <div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0 }}>Brightness</p>
            <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
              {q.brightness != null ? q.brightness.toFixed(4) : 'N/A'}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Eye size={16} color="var(--info)" />
          <div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0 }}>Field of View</p>
            <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
              {q.fovRatio != null ? (q.fovRatio * 100).toFixed(1) + '%' : 'N/A'}
            </p>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
        <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', margin: 0 }}>
          Clinical Guidance: Please recapture the fundus image ensuring clear focus and illumination.
        </p>
        <Button variant="primary" icon={RefreshCw} onClick={onReset}>
          Upload Another Image
        </Button>
      </div>
    </Card>
  );
};
