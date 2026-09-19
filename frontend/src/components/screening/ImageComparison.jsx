import React, { useState } from 'react';
import { Eye, Flame, Maximize2, Info } from 'lucide-react';
import { Card } from '../ui/Card';

export const ImageComparison = ({ originalUrl, gradcamUrl }) => {
  const [fullscreenImage, setFullscreenImage] = useState(null);

  return (
    <Card
      title="Visual Explainability — Fundus vs Model Attention"
      subtitle="Side-by-side comparison of original acquisition and Grad-CAM spatial activation map"
      headerBorder={true}
    >
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '0.875rem',
        marginTop: '0.5rem',
      }}>
        {/* Left: Original Fundus */}
        <div style={{
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-sm)',
          overflow: 'hidden',
          backgroundColor: '#000000',
        }}>
          <div style={{
            padding: '0.4rem 0.65rem',
            backgroundColor: '#0D0D0D',
            color: 'var(--text-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.75rem',
            fontWeight: 600,
            borderBottom: '1px solid var(--border-color)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Eye size={13} color="var(--primary)" />
              <span>Original Retinal Fundus</span>
            </div>
            <button
              onClick={() => setFullscreenImage({ url: originalUrl, title: 'Original Retinal Fundus Photograph' })}
              style={{ background: 'none', border: 'none', color: '#FFFFFF', cursor: 'pointer', padding: 0 }}
              title="Fullscreen inspection"
            >
              <Maximize2 size={13} />
            </button>
          </div>
          <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img
              src={originalUrl}
              alt="Original Retinal Fundus"
              style={{ maxHeight: '300px', maxWidth: '100%', objectFit: 'contain' }}
            />
          </div>
        </div>

        {/* Right: Grad-CAM */}
        <div style={{
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-sm)',
          overflow: 'hidden',
          backgroundColor: '#000000',
        }}>
          <div style={{
            padding: '0.4rem 0.65rem',
            backgroundColor: '#0D0D0D',
            color: 'var(--text-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.75rem',
            fontWeight: 600,
            borderBottom: '1px solid var(--border-color)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Flame size={13} color="#F59E0B" />
              <span>Evidence Regions (Grad-CAM Heatmap)</span>
            </div>
            <button
              onClick={() => setFullscreenImage({ url: gradcamUrl, title: 'Grad-CAM Attention Heatmap' })}
              style={{ background: 'none', border: 'none', color: '#FFFFFF', cursor: 'pointer', padding: 0 }}
              title="Fullscreen inspection"
            >
              <Maximize2 size={13} />
            </button>
          </div>
          <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img
              src={gradcamUrl}
              alt="Model Attention Grad-CAM Heatmap"
              style={{ maxHeight: '300px', maxWidth: '100%', objectFit: 'contain' }}
            />
          </div>
        </div>
      </div>

      {/* Explanation Footnote */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.4rem',
        marginTop: '0.75rem',
        padding: '0.5rem 0.75rem',
        borderRadius: 'var(--radius-xs)',
        backgroundColor: 'var(--bg-secondary)',
        fontSize: '0.71875rem',
        color: 'var(--text-secondary)',
      }}>
        <Info size={14} color="var(--primary)" style={{ flexShrink: 0 }} />
        <span>
          <strong>Clinician Guidance:</strong> Grad-CAM visualizes gradient feature maps highlighting anatomical retinal regions (such as microaneurysms, hemorrhages, or exudates) that contributed directly to the model's classification.
        </span>
      </div>

      {/* Fullscreen Modal */}
      {fullscreenImage && (
        <div
          onClick={() => setFullscreenImage(null)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.88)',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem',
          }}
        >
          <div style={{ color: '#FFFFFF', marginBottom: '0.75rem', fontWeight: 600, fontSize: '0.875rem' }}>
            {fullscreenImage.title} — (Click anywhere to exit)
          </div>
          <img
            src={fullscreenImage.url}
            alt="Fullscreen preview"
            style={{ maxHeight: '85vh', maxWidth: '90vw', objectFit: 'contain', borderRadius: 'var(--radius-xs)' }}
          />
        </div>
      )}
    </Card>
  );
};
