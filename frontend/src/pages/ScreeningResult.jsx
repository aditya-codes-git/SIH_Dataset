import React, { useState } from 'react';
import { ArrowLeft, Printer, ShieldAlert } from 'lucide-react';
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
      <div style={{ textAlign: 'center', padding: '2.5rem' }}>
        <p style={{ color: 'var(--text-secondary)' }}>No screening result selected.</p>
        <Button onClick={onBack} icon={ArrowLeft} style={{ marginTop: '0.75rem' }}>
          Back to Dashboard
        </Button>
      </div>
    );
  }

  const isUngradable = result.status === 'UNGRADABLE';
  const originalUrl = api.getFileUrl(result.originalImageUrl || `/api/files/original/${result.screeningId}.png`);
  const gradcamUrl = api.getFileUrl(result.gradcamUrl || `/api/files/gradcam/${result.screeningId}_gradcam.png`);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }} className="animate-fade-in">
      {/* Top Header Actions */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Button variant="secondary" size="sm" icon={ArrowLeft} onClick={onBack}>
          Back to Screenings
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

      {isUngradable ? (
        <UngradableWarning
          quality={result.quality}
          message={result.message}
          onReset={onNewScreening}
        />
      ) : (
        <>
          <ModelResultCard result={result} />
          <ImageComparison originalUrl={originalUrl} gradcamUrl={gradcamUrl} />

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '1rem',
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <QualityCard quality={result.quality} status={result.status} />
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

      {/* Clinical Disclaimer */}
      <div style={{
        textAlign: 'center',
        padding: '0.5rem 0.75rem',
        borderRadius: 'var(--radius-xs)',
        backgroundColor: 'var(--bg-secondary)',
        fontSize: '0.71875rem',
        color: 'var(--text-muted)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.35rem',
      }}>
        <ShieldAlert size={13} color="var(--text-muted)" />
        <span>
          AI clinical decision support only. Final diagnosis and care pathways must be confirmed by a licensed ophthalmologist.
        </span>
      </div>
    </div>
  );
};
