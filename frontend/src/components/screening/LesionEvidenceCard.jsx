import React, { useState } from 'react';
import { Activity, AlertCircle, CheckCircle2, HelpCircle, Layers, ZoomIn } from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { api } from '../../services/api';

const LESION_CONFIGS = [
  {
    key: 'microaneurysms',
    code: 'MA',
    label: 'Microaneurysms',
    color: '#E02424', // Red/crimson
    badgeVariant: 'danger',
    description: 'Small punctate outpouchings of retinal capillaries; hallmark early sign of DR.',
  },
  {
    key: 'haemorrhages',
    code: 'HE',
    label: 'Haemorrhages',
    color: '#D97706', // Orange/amber
    badgeVariant: 'warning',
    description: 'Dot/blot or flame-shaped intraretinal hemorrhages indicating vascular compromise.',
  },
  {
    key: 'hardExudates',
    code: 'EX',
    label: 'Hard Exudates',
    color: '#CA8A04', // Yellow/gold
    badgeVariant: 'warning',
    description: 'Lipid and proteinaceous deposits from chronically leaking hyperpermeable vessels.',
  },
  {
    key: 'softExudates',
    code: 'SE',
    label: 'Soft Exudates (Cotton-Wool Spots)',
    color: '#0891B2', // Cyan
    badgeVariant: 'info',
    description: 'Nerve fiber layer micro-infarcts; sparse annotations in IDRiD validation dataset.',
    sparseNote: true,
  },
];

export const LesionEvidenceCard = ({ retinalAnalysis, originalUrl }) => {
  const [selectedClass, setSelectedClass] = useState('microaneurysms');
  const [showOverlay, setShowOverlay] = useState(true);

  if (!retinalAnalysis || !retinalAnalysis.lesions) {
    return null;
  }

  const lesions = retinalAnalysis.lesions;
  const assets = retinalAnalysis.assets || {};
  const currentConfig = LESION_CONFIGS.find((c) => c.key === selectedClass) || LESION_CONFIGS[0];
  const currentLesionData = lesions[currentConfig.key];

  return (
    <Card
      title="Retinal Lesion Segmentation & Evidence (U-Net)"
      subtitle="Pixel-level automated deep learning lesion segmentation evaluated on authentic IDRiD benchmark"
      headerBorder={true}
      action={
        <Badge variant="neutral" size="sm">
          Model-Predicted Lesion Evidence
        </Badge>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.25rem' }}>
        
        {/* Lesion Class Selector Tabs */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '0.5rem',
        }}>
          {LESION_CONFIGS.map((cfg) => {
            const data = lesions[cfg.key];
            const isPresent = Boolean(data?.present || (data?.count > 0));
            const isSelected = selectedClass === cfg.key;

            return (
              <button
                key={cfg.key}
                onClick={() => setSelectedClass(cfg.key)}
                style={{
                  padding: '0.625rem 0.75rem',
                  borderRadius: 'var(--radius-xs)',
                  border: isSelected ? `2px solid ${cfg.color}` : '1px solid var(--border-color)',
                  backgroundColor: isSelected ? 'var(--bg-secondary)' : 'var(--bg-card)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.25rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {cfg.label.split(' ')[0]} ({cfg.code})
                  </span>
                  {data?.present ? (
                    <Badge variant="danger" size="xs">Detected</Badge>
                  ) : cfg.sparseNote ? (
                    <Badge variant="neutral" size="xs">Not Detected*</Badge>
                  ) : (
                    <Badge variant="success" size="xs">Not Detected</Badge>
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.6875rem', color: 'var(--text-secondary)' }}>
                  <span>Count: <strong>{data?.count ?? 0}</strong></span>
                  <span>Area: <strong>{data?.totalPixelArea ? `${data.totalPixelArea} px` : '0 px'}</strong></span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected Lesion Detail & Visual Panel */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '1rem',
          padding: '0.875rem',
          backgroundColor: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-xs)',
          border: '1px solid var(--border-color)',
        }}>
          {/* Detail Metadata */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <h4 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                  {currentConfig.label}
                </h4>
                <Badge variant={currentLesionData?.present ? 'danger' : 'neutral'} size="sm">
                  {currentLesionData?.present ? 'Model-Predicted Detection' : 'No Segmented Lesions'}
                </Badge>
              </div>
              <p style={{ fontSize: '0.71875rem', color: 'var(--text-secondary)', margin: '0.25rem 0 0 0' }}>
                {currentConfig.description}
              </p>
            </div>

            {/* Metrics Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
              <div style={{ padding: '0.5rem', backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '0.625rem', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block' }}>Total Components</span>
                <span style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {currentLesionData?.count ?? 0}
                </span>
              </div>

              <div style={{ padding: '0.5rem', backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '0.625rem', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block' }}>Retinal Coverage</span>
                <span style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {currentLesionData?.relativeArea != null ? `${(currentLesionData.relativeArea * 100).toFixed(3)}%` : '0.000%'}
                </span>
              </div>

              <div style={{ padding: '0.5rem', backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '0.625rem', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block' }}>Largest Lesion</span>
                <span style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {currentLesionData?.largestComponentArea ? `${currentLesionData.largestComponentArea} px` : '—'}
                </span>
              </div>
            </div>

            {/* Individual Component Locations (if detected) */}
            {currentLesionData?.components && currentLesionData.components.length > 0 ? (
              <div style={{ maxHeight: '160px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.35rem', marginTop: '0.25rem' }}>
                <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  Detected Component Locations (Top {Math.min(currentLesionData.components.length, 10)}):
                </span>
                {currentLesionData.components.slice(0, 10).map((comp, idx) => (
                  <div key={idx} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '0.35rem 0.5rem',
                    backgroundColor: 'var(--bg-card)',
                    borderRadius: 'var(--radius-xs)',
                    fontSize: '0.6875rem',
                    border: '1px solid var(--border-color)',
                  }}>
                    <span>#{comp.id || idx + 1} Centroid: [{Array.isArray(comp.centroid) ? comp.centroid.join(', ') : '—'}]</span>
                    <span>Area: {comp.area} px</span>
                    <span style={{ color: 'var(--text-muted)' }}>p: {comp.meanProbability != null ? comp.meanProbability.toFixed(2) : '—'}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: '0.75rem', backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {currentConfig.sparseNote
                    ? 'No soft exudates detected. Note: Soft Exudates exhibit sparse ground-truth prevalence in IDRiD.'
                    : 'No pixel clusters met calibrated segmentation threshold for this class.'}
                </span>
              </div>
            )}
          </div>

          {/* Visual Overlay Image */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{
              width: '100%',
              maxHeight: '260px',
              backgroundColor: '#000000',
              borderRadius: 'var(--radius-xs)',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              border: '1px solid var(--border-color)',
            }}>
              {assets.lesionOverlay ? (
                <img
                  src={api.getFileUrl(assets.lesionOverlay)}
                  alt="Lesion Segmentation Overlay"
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                />
              ) : originalUrl ? (
                <img
                  src={api.getFileUrl(originalUrl)}
                  alt="Fundus"
                  style={{ width: '100%', height: '100%', objectFit: 'contain', opacity: 0.8 }}
                />
              ) : (
                <div style={{ padding: '2rem', color: '#888888', fontSize: '0.75rem' }}>
                  Overlay image unavailable
                </div>
              )}
            </div>
            <span style={{ fontSize: '0.625rem', color: 'var(--text-muted)', marginTop: '0.35rem', textAlign: 'center' }}>
              Multi-class Lesion Overlay: <span style={{ color: '#E02424' }}>MA (Magenta)</span> • <span style={{ color: '#D97706' }}>HE (Orange)</span> • <span style={{ color: '#CA8A04' }}>EX (Yellow)</span> • <span style={{ color: '#0891B2' }}>SE (Cyan)</span>
            </span>
          </div>
        </div>

        {/* Clinical Disclaimer Banner */}
        <div style={{
          padding: '0.5rem 0.75rem',
          borderRadius: 'var(--radius-xs)',
          backgroundColor: 'var(--bg-secondary)',
          borderLeft: '3px solid var(--border-color)',
          fontSize: '0.6875rem',
          color: 'var(--text-muted)',
          lineHeight: '1.4',
        }}>
          <strong>Clinical Workstation Note:</strong> Model-predicted lesion evidence is generated via fully convolutional U-Net inference trained on the IDRiD pixel dataset. Predictions serve as decision-support evidence and must not be interpreted as clinically confirmed lesion diagnoses without direct qualified clinical review.
        </div>
      </div>
    </Card>
  );
};
