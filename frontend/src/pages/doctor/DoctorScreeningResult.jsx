import React, { useState } from 'react';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { ImageComparison } from '../../components/screening/ImageComparison';
import { QualityCard } from '../../components/screening/QualityCard';
import { ModelResultCard } from '../../components/screening/ModelResultCard';
import { ClinicalReviewForm } from '../../components/review/ClinicalReviewForm';
import { AIAssistantPanel } from '../../components/assistant/AIAssistantPanel';
import { ReportViewer } from '../../components/report/ReportViewer';
import { api } from '../../services/api';

export const ScreeningResult = ({ result, onBack, onNewScreening: _onNewScreening }) => {
  const [activeTab, setActiveTab] = useState('clinical'); // 'clinical' | 'report' | 'assistant'
  const [currentResult, setCurrentResult] = useState(result);

  if (!currentResult) {
    return (
      <Card style={{ textAlign: 'center', padding: '2.5rem' }}>
        <p style={{ color: 'var(--text-secondary)' }}>No screening selected.</p>
        <Button onClick={onBack} style={{ marginTop: '0.5rem' }}>Return to Dashboard</Button>
      </Card>
    );
  }

  const isUngradable = currentResult.status === 'UNGRADABLE';
  const isReferable = currentResult.triage?.referralRequired || currentResult.referable || currentResult.drGrade >= 2;
  const priority = currentResult.triage?.priority || 'ROUTINE';

  const handleReviewSubmitted = (updatedScreening) => {
    setCurrentResult(updatedScreening);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }} className="animate-fade-in">
      {/* Top Header Information Bar */}
      <div style={{
        padding: '0.75rem 1rem',
        borderRadius: 'var(--radius-md)',
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.75rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Button variant="secondary" size="sm" icon={ArrowLeft} onClick={onBack}>
            Back
          </Button>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }} className="font-mono">
                {currentResult.patientId || 'PATIENT-ANONYMOUS'}
              </h2>
              <Badge variant={isUngradable ? 'warning' : isReferable ? 'danger' : 'success'} size="sm">
                {isUngradable ? 'UNGRADABLE' : isReferable ? `REFERABLE — ${priority}` : 'LOW RISK'}
              </Badge>
              <Badge variant="info" size="sm">
                <ShieldCheck size={11} /> AI Decision Support
              </Badge>
            </div>
            <p style={{ fontSize: '0.71875rem', color: 'var(--text-secondary)', margin: 0, marginTop: '1px' }}>
              Name: {currentResult.patientName || 'Anonymous'}
              {currentResult.age != null && ` | Age: ${currentResult.age}`}
              {currentResult.gender && currentResult.gender !== 'Unspecified' && ` | Sex: ${currentResult.gender}`}
              {currentResult.diabetesDuration && ` | Diabetes: ${currentResult.diabetesDuration}`}
              {currentResult.contactLocation && ` | Location: ${currentResult.contactLocation}`}
            </p>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div style={{
          display: 'flex',
          gap: '0.25rem',
          backgroundColor: 'var(--bg-secondary)',
          padding: '0.2rem',
          borderRadius: 'var(--radius-xs)',
          border: '1px solid var(--border-color)',
        }}>
          <button
            onClick={() => setActiveTab('clinical')}
            style={{
              padding: '0.3rem 0.65rem',
              borderRadius: 'var(--radius-xs)',
              border: activeTab === 'clinical' ? '1px solid var(--border-color)' : '1px solid transparent',
              backgroundColor: activeTab === 'clinical' ? 'var(--bg-card)' : 'transparent',
              color: activeTab === 'clinical' ? 'var(--primary)' : 'var(--text-secondary)',
              fontSize: '0.75rem',
              fontWeight: activeTab === 'clinical' ? 600 : 400,
              cursor: 'pointer',
              transition: 'var(--transition)',
            }}
          >
            Clinical Review
          </button>
          <button
            onClick={() => setActiveTab('report')}
            style={{
              padding: '0.3rem 0.65rem',
              borderRadius: 'var(--radius-xs)',
              border: activeTab === 'report' ? '1px solid var(--border-color)' : '1px solid transparent',
              backgroundColor: activeTab === 'report' ? 'var(--bg-card)' : 'transparent',
              color: activeTab === 'report' ? 'var(--primary)' : 'var(--text-secondary)',
              fontSize: '0.75rem',
              fontWeight: activeTab === 'report' ? 600 : 400,
              cursor: 'pointer',
              transition: 'var(--transition)',
            }}
          >
            Digital Report
          </button>
          <button
            onClick={() => setActiveTab('assistant')}
            style={{
              padding: '0.3rem 0.65rem',
              borderRadius: 'var(--radius-xs)',
              border: activeTab === 'assistant' ? '1px solid var(--border-color)' : '1px solid transparent',
              backgroundColor: activeTab === 'assistant' ? 'var(--bg-card)' : 'transparent',
              color: activeTab === 'assistant' ? 'var(--primary)' : 'var(--text-secondary)',
              fontSize: '0.75rem',
              fontWeight: activeTab === 'assistant' ? 600 : 400,
              cursor: 'pointer',
              transition: 'var(--transition)',
            }}
          >
            AI Screening Assistant
          </button>
        </div>
      </div>

      {/* VIEW TAB 1: CLINICAL REVIEW */}
      {activeTab === 'clinical' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Top Row: AI Model Result + Quality Gate Card */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
            <ModelResultCard result={currentResult} />
            <QualityCard quality={currentResult.quality} status={currentResult.status} />
          </div>

          {/* Two-Panel Visual Explainability: Retinal Fundus vs Grad-CAM Heatmap */}
          <ImageComparison
            originalUrl={api.getFileUrl(currentResult.originalImageUrl)}
            gradcamUrl={api.getFileUrl(currentResult.gradcamUrl)}
          />

          {/* Clinical Review Form & Summary */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
            <ClinicalReviewForm screening={currentResult} onReviewUpdated={handleReviewSubmitted} />

            <Card
              title="Patient Screening Context"
              subtitle="Record metadata and current status in screening database"
              headerBorder={true}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.25rem' }}>
                <div style={{ padding: '0.625rem', borderRadius: 'var(--radius-xs)', backgroundColor: 'var(--bg-secondary)', borderLeft: '3px solid var(--primary)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                    <strong>Active Screening ({currentResult.createdAt ? new Date(currentResult.createdAt).toLocaleDateString() : '—'})</strong>
                    <Badge variant={isReferable ? 'danger' : 'success'} size="sm">Grade {currentResult.drGrade ?? '—'}</Badge>
                  </div>
                  <p style={{ fontSize: '0.71875rem', color: 'var(--text-secondary)', margin: '0.25rem 0 0 0' }}>
                    Recommendation: {currentResult.triage?.recommendation || (isReferable ? 'Referred for specialist ophthalmologist review.' : 'Routine annual screening.')}
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* VIEW TAB 2: DIGITAL REPORT */}
      {activeTab === 'report' && (
        <ReportViewer screening={currentResult} onBack={() => setActiveTab('clinical')} />
      )}

      {/* VIEW TAB 3: AI ASSISTANT */}
      {activeTab === 'assistant' && (
        <AIAssistantPanel screening={currentResult} screeningId={currentResult.screeningId} />
      )}
    </div>
  );
};
