import React, { useState } from 'react';
import { ArrowLeft, Printer, Share2, ShieldAlert } from 'lucide-react';
import { ModelResultCard } from '../components/screening/ModelResultCard';
import { ImageComparison } from '../components/screening/ImageComparison';
import { QualityCard } from '../components/screening/QualityCard';
import { UngradableWarning } from '../components/screening/UngradableWarning';
import { ClinicalReviewForm } from '../components/review/ClinicalReviewForm';
import { AIAssistantPanel } from '../components/assistant/AIAssistantPanel';
import { Button } from '../components/ui/Button';
import { api } from '../services/api';

export const ScreeningResult = ({ result: initialResult, onBack, onNewScreening }) => {
  const [result, setResult] = useState(initialResult);

  if (!result) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem' }}>
        <p style={{ color: 'var(--text-secondary)' }}>No screening result selected.</p>
        <Button onClick={onBack} icon={ArrowLeft} style={{ marginTop: '1rem' }}>
          Back to Dashboard
        </Button>
      </div>
    );
  }

  const isUngradable = result.status === 'UNGRADABLE';

  const originalUrl = api.getFileUrl(result.originalImageUrl || `/api/files/original/${result.screeningId}.png`);
  const gradcamUrl = api.getFileUrl(result.gradcamUrl || `/api/files/gradcam/${result.screeningId}_gradcam.png`);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }} className="animate-fade-in">
      {/* Top Header Actions */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Button variant="secondary" size="sm" icon={ArrowLeft} onClick={onBack}>
          Back to List
        </Button>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Button variant="secondary" size="sm" icon={Printer} onClick={() => window.print()}>
            Print Summary
          </Button>
          <Button variant="primary" size="sm" onClick={onNewScreening}>
            Screen Next Patient
          </Button>
        </div>
      </div>

      {/* If UNGRADABLE status, display warning card exclusively */}
      {isUngradable ? (
        <UngradableWarning
          quality={result.quality}
          message={result.message}
          onReset={onNewScreening}
        />
      ) : (
        /* GRADABLE screening layout */
        <>
          {/* Section 1: MATLAB Model Result Card */}
          <ModelResultCard result={result} />

          {/* Section 2: Image Comparison (Original vs Grad-CAM) */}
          <ImageComparison originalUrl={originalUrl} gradcamUrl={gradcamUrl} />

          {/* Section 3: Two Column Layout (Left: Quality & Clinical Review, Right: AI Assistant) */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
            gap: '1.5rem',
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <QualityCard quality={result.quality} />
              <ClinicalReviewForm
                screening={result}
                onReviewUpdated={(updated) => setResult(updated)}
              />
            </div>

            <div>
              <AIAssistantPanel screening={result} screeningId={result.screeningId} />
            </div>
          </div>
        </>
      )}

      {/* Subtle Medical Disclaimer */}
      <div style={{
        textAlign: 'center',
        padding: '0.75rem',
        borderRadius: 'var(--radius-md)',
        backgroundColor: 'var(--bg-secondary)',
        fontSize: '0.75rem',
        color: 'var(--text-muted)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.375rem',
        marginTop: '1rem',
      }}>
        <ShieldAlert size={14} color="var(--text-muted)" />
        <span>
          AI decision-support only. Final clinical diagnosis and treatment plans must be confirmed by a qualified medical professional.
        </span>
      </div>
    </div>
  );
};
