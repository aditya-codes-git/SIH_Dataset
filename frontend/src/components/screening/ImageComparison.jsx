import React, { useState } from 'react';
import { Eye, Flame, Maximize2, Info, ZoomIn } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

export const ImageComparison = ({ originalUrl, gradcamUrl }) => {
  const [fullscreenImage, setFullscreenImage] = useState(null);

  return (
    <Card title="Retinal Image & Explainability" subtitle="Original Fundus vs. MATLAB Model Visual Attention Heatmap">
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '1.25rem',
        marginTop: '0.75rem',
      }}>
        {/* Left: Original Image */}
        <div style={{
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          overflow: 'hidden',
          backgroundColor: '#000',
          position: 'relative',
        }}>
          <div style={{
            padding: '0.5rem 0.75rem',
            backgroundColor: 'rgba(0,0,0,0.7)',
            color: '#FFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.8125rem',
            fontWeight: 600,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 2,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              <Eye size={14} color="var(--primary)" />
              <span>Original Fundus Image</span>
            </div>
            <button
              onClick={() => setFullscreenImage({ url: originalUrl, title: 'Original Retinal Fundus Image' })}
              style={{ background: 'none', border: 'none', color: '#FFF', cursor: 'pointer' }}
              title="Fullscreen view"
            >
              <Maximize2 size={14} />
            </button>
          </div>
          <img
            src={originalUrl}
            alt="Original Retinal Fundus"
            style={{ width: '100%', height: '340px', objectFit: 'contain', display: 'block', marginTop: '30px' }}
          />
        </div>

        {/* Right: Grad-CAM */}
        <div style={{
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          overflow: 'hidden',
          backgroundColor: '#000',
          position: 'relative',
        }}>
          <div style={{
            padding: '0.5rem 0.75rem',
            backgroundColor: 'rgba(0,0,0,0.7)',
            color: '#FFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.8125rem',
            fontWeight: 600,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 2,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              <Flame size={14} color="#F59E0B" />
              <span>Model Attention — Grad-CAM</span>
            </div>
            <button
              onClick={() => setFullscreenImage({ url: gradcamUrl, title: 'Model Attention — Grad-CAM Heatmap' })}
              style={{ background: 'none', border: 'none', color: '#FFF', cursor: 'pointer' }}
              title="Fullscreen view"
            >
              <Maximize2 size={14} />
            </button>
          </div>
          <img
            src={gradcamUrl}
            alt="Model Attention Grad-CAM Heatmap"
            style={{ width: '100%', height: '340px', objectFit: 'contain', display: 'block', marginTop: '30px' }}
          />
        </div>
      </div>

      {/* Explanation Footer */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '0.5rem',
        marginTop: '1rem',
        padding: '0.625rem 0.875rem',
        borderRadius: 'var(--radius-md)',
        backgroundColor: 'var(--bg-secondary)',
        fontSize: '0.75rem',
        color: 'var(--text-secondary)',
      }}>
        <Info size={16} color="var(--primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
        <span>
          <strong>Note on Visual Explainability:</strong> Grad-CAM visualizes regions that contributed to the model's prediction heatmap. It represents deep feature gradient activation and is provided for clinician explainability.
        </span>
      </div>

      {/* Fullscreen Modal */}
      {fullscreenImage && (
        <div
          onClick={() => setFullscreenImage(null)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.85)',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
          }}
        >
          <div style={{ color: '#FFF', marginBottom: '1rem', fontWeight: 600, fontSize: '1rem' }}>
            {fullscreenImage.title} (Click anywhere to close)
          </div>
          <img
            src={fullscreenImage.url}
            alt="Fullscreen preview"
            style={{ maxHeight: '85vh', maxWidth: '90vw', objectFit: 'contain', borderRadius: 'var(--radius-md)' }}
          />
        </div>
      )}
    </Card>
  );
};
