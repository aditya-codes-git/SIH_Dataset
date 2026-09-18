import React, { useState } from 'react';
import { ArrowLeft, ShieldCheck, AlertTriangle, CheckCircle2, User, FileText, Bot, Clock, Printer } from 'lucide-react';
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

export const ScreeningResult = ({ result, onBack, onNewScreening }) => {
  const [activeTab, setActiveTab] = useState('clinical'); // 'clinical' | 'report' | 'assistant'
  const [currentResult, setCurrentResult] = useState(result);

  if (!currentResult) {
    return (
      <Card style={{ textAlign: 'center', padding: '3rem' }}>
        <p style={{ color: 'var(--text-secondary)' }}>No screening selected.</p>
        <Button onClick={onBack}>Return to Dashboard</Button>
      </Card>
    );
  }

  const isUngradable = currentResult.status === 'UNGRADABLE';
  const isReferable = currentResult.triage?.referralRequired || currentResult.referable;
  const priority = currentResult.triage?.priority || 'ROUTINE';

  const handleReviewSubmitted = (updatedScreening) => {
    setCurrentResult(updatedScreening);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }} className="animate-fade-in">
      {/* Top Header Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Button variant="secondary" icon={ArrowLeft} onClick={onBack}>
            Back
          </Button>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                Patient #{currentResult.patientId}
              </h2>
              <Badge variant={isUngradable ? 'warning' : isReferable ? 'danger' : 'success'}>
                {isUngradable ? 'UNGRADABLE' : isReferable ? `REFERABLE — ${priority} PRIORITY` : 'LOW RISK'}
              </Badge>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0 }}>
              Name: {currentResult.patientName || 'Anonymous'} | Age: {currentResult.age || 'N/A'} | Diabetes: {currentResult.diabetesDuration || 'N/A'} | Location: {currentResult.contactLocation || 'Camp'}
            </p>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', backgroundColor: 'var(--bg-card)', padding: '0.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
          <button
            onClick={() => setActiveTab('clinical')}
            style={{
              padding: '0.375rem 0.75rem',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              backgroundColor: activeTab === 'clinical' ? 'var(--primary)' : 'transparent',
              color: activeTab === 'clinical' ? '#FFF' : 'var(--text-secondary)',
              fontSize: '0.8125rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Clinical Review
          </button>
          <button
            onClick={() => setActiveTab('report')}
            style={{
              padding: '0.375rem 0.75rem',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              backgroundColor: activeTab === 'report' ? 'var(--primary)' : 'transparent',
              color: activeTab === 'report' ? '#FFF' : 'var(--text-secondary)',
              fontSize: '0.8125rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Digital Report
          </button>
          <button
            onClick={() => setActiveTab('assistant')}
            style={{
              padding: '0.375rem 0.75rem',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              backgroundColor: activeTab === 'assistant' ? 'var(--primary)' : 'transparent',
              color: activeTab === 'assistant' ? '#FFF' : 'var(--text-secondary)',
              fontSize: '0.8125rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            AI Assistant
          </button>
        </div>
      </div>

      {/* VIEW TAB 1: CLINICAL REVIEW */}
      {activeTab === 'clinical' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Top Grid: MATLAB Model Result + Image Quality Card */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem' }}>
            <ModelResultCard result={currentResult} />
            <QualityCard quality={currentResult.quality} status={currentResult.status} />
          </div>

          {/* Two-Panel Image Comparison View */}
          <Card title="Visual Explainability — Fundus vs Model Attention" subtitle="Left: Original Fundus | Right: Model Attention — Grad-CAM Heatmap">
            <ImageComparison
              originalUrl={api.getFileUrl(currentResult.originalImageUrl)}
              gradcamUrl={api.getFileUrl(currentResult.gradcamUrl)}
              status={currentResult.status}
            />
          </Card>

          {/* Bottom Grid: Clinical Review Form + Patient History */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem' }}>
            <ClinicalReviewForm screening={currentResult} onReviewSubmitted={handleReviewSubmitted} />

            <Card title="Patient Screening History" subtitle="Tracking progression across historical screenings">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
                <div style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-secondary)', borderLeft: '3px solid var(--primary)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
                    <strong>Current Screening ({new Date(currentResult.createdAt || Date.now()).toLocaleDateString()})</strong>
                    <Badge variant={isReferable ? 'danger' : 'success'}>Grade {currentResult.drGrade ?? 'N/A'}</Badge>
                  </div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '0.25rem 0 0 0' }}>
                    Status: {currentResult.triage?.recommendation || (isReferable ? 'Referred to Specialist' : 'Routine Follow-up')}
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
        <Card title="AI Clinical Screening Assistant" subtitle="Contextual Q&A based on MATLAB screening output">
          <AIAssistantPanel screeningData={currentResult} />
        </Card>
      )}
    </div>
  );
};
