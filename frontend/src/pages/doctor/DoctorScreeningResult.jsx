import React, { useState, useEffect } from 'react';
import { ArrowLeft, RefreshCw, AlertTriangle } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { ImageComparison } from '../../components/screening/ImageComparison';
import { QualityCard } from '../../components/screening/QualityCard';
import { ModelResultCard } from '../../components/screening/ModelResultCard';
import { ClinicalReviewForm } from '../../components/review/ClinicalReviewForm';
import { AIAssistantPanel } from '../../components/assistant/AIAssistantPanel';
import { ReportViewer } from '../../components/report/ReportViewer';
import { LesionEvidenceCard } from '../../components/screening/LesionEvidenceCard';
import { api } from '../../services/api';
import { getReviewStatus, getReferralRouting } from '../../utils/clinicalStatus';

export const ScreeningResult = ({ 
  result, 
  onBack, 
  onReviewSubmitted, 
  onNewScreening: _onNewScreening,
  isOperator = false,
  onRecapture 
}) => {
  const [activeTab, setActiveTab] = useState('clinical'); // 'clinical' | 'report' | 'assistant'
  const [currentResult, setCurrentResult] = useState(result);
  const [loading, setLoading] = useState(!result);
  const [error, setError] = useState(null);

  // Auto-restore / refetch from backend if refreshed or result prop is initially null
  useEffect(() => {
    if (result) {
      setCurrentResult(result);
      setLoading(false);
      return;
    }

    const savedId = localStorage.getItem('retinoscan_active_screening_id');
    if (savedId) {
      setLoading(true);
      setError(null);
      api.getScreeningById(savedId)
        .then((data) => {
          const item = data.screening || data;
          if (item && item.screeningId) {
            setCurrentResult(item);
          } else {
            setError('Screening record not found.');
          }
        })
        .catch((err) => {
          setError(err.message || 'Failed to fetch screening record from database.');
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [result]);

  if (loading) {
    return (
      <Card style={{ textAlign: 'center', padding: '3rem' }}>
        <RefreshCw size={24} className="animate-spin" color="var(--primary)" style={{ margin: '0 auto 0.75rem auto' }} />
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Loading screening record from database...</p>
      </Card>
    );
  }

  if (error || !currentResult) {
    return (
      <Card style={{ textAlign: 'center', padding: '2.5rem' }}>
        <p style={{ color: 'var(--danger)', fontWeight: 500 }}>{error || 'No screening selected.'}</p>
        <Button onClick={onBack} icon={ArrowLeft} style={{ marginTop: '0.75rem' }}>
          Return to Queue
        </Button>
      </Card>
    );
  }

  const isUngradable = currentResult.status === 'UNGRADABLE';
  const isReferable = currentResult.status === 'GRADABLE' && currentResult.drGrade !== null && Number(currentResult.drGrade) >= 2;
  const referralInfo = getReferralRouting(currentResult);
  const reviewInfo = getReviewStatus(currentResult);

  const handleReviewSubmitted = (updatedScreening) => {
    setCurrentResult(updatedScreening);
    if (onReviewSubmitted) {
      onReviewSubmitted(updatedScreening);
    }
  };

  console.log('[DoctorScreeningResult] currentResult:', currentResult);
  console.log('[DoctorScreeningResult] retinalAnalysis.lesions:', currentResult?.retinalAnalysis?.lesions);

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
            {isOperator ? 'Back to Queue' : 'Back to Dashboard'}
          </Button>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }} className="font-mono">
                {currentResult.patientId || 'PATIENT-ANONYMOUS'}
              </h2>
              <Badge variant={isUngradable ? 'warning' : isReferable ? 'danger' : 'success'}>
                {isUngradable ? 'UNGRADABLE' : `Grade ${currentResult.drGrade}`}
              </Badge>
              <Badge variant={reviewInfo.variant}>
                {reviewInfo.label}
              </Badge>
            </div>
            <p style={{ fontSize: '0.71875rem', color: 'var(--text-secondary)', margin: 0, marginTop: '0.15rem' }}>
              Patient: {currentResult.patientName || 'Anonymous'} | Screening ID: <span className="font-mono">{currentResult.screeningId}</span>
              {currentResult.createdAt && ` | ${new Date(currentResult.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}`}
            </p>
          </div>
        </div>

        {/* View Tabs */}
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
            {isOperator ? 'Screening Details' : 'Clinical Review'}
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
          {!isOperator && (
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
          )}
        </div>
      </div>

      {/* VIEW TAB 1: CLINICAL DETAILS / REVIEW */}
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

          {/* Model-Predicted Lesion Evidence Card (Microaneurysms, Haemorrhages, Hard Exudates, Soft Exudates) */}
          {currentResult.retinalAnalysis && currentResult.retinalAnalysis.lesions && (
            <LesionEvidenceCard
              retinalAnalysis={currentResult.retinalAnalysis}
              originalUrl={currentResult.originalImageUrl}
            />
          )}

          {/* Clinical Review Form & Summary */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
            {isOperator ? (
              <Card
                title="Clinician Assessment Status"
                subtitle="Independent ophthalmologist review and audit determination"
                headerBorder={true}
                action={
                  <Badge variant={reviewInfo.variant}>
                    {reviewInfo.label}
                  </Badge>
                }
              >
                <div style={{ padding: '0.75rem', borderRadius: 'var(--radius-xs)', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
                  {reviewInfo.code === 'REVIEWED' ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Badge variant="success" size="sm">Assessment Completed</Badge>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                          Decision: {currentResult.humanReview?.decision || 'Agreed'}
                        </span>
                      </div>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0 }}>
                        <strong>Reviewing Clinician:</strong> {currentResult.humanReview?.reviewer || 'Assigned Ophthalmologist'}
                      </p>
                      {currentResult.humanReview?.reviewedAt && (
                        <p style={{ fontSize: '0.71875rem', color: 'var(--text-muted)', margin: 0 }}>
                          <strong>Reviewed At:</strong> {new Date(currentResult.humanReview.reviewedAt).toLocaleString()}
                        </p>
                      )}
                      {currentResult.humanReview?.clinicalFindings && (
                        <div style={{ marginTop: '0.25rem', padding: '0.5rem', backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-color)' }}>
                          <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Clinical Findings</span>
                          <p style={{ fontSize: '0.75rem', color: 'var(--text-primary)', margin: '0.15rem 0 0 0' }}>
                            {currentResult.humanReview.clinicalFindings}
                          </p>
                        </div>
                      )}
                      {currentResult.humanReview?.notes && (
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0 }}>
                          <strong>Notes:</strong> {currentResult.humanReview.notes}
                        </p>
                      )}
                    </div>
                  ) : reviewInfo.code === 'RECAPTURE' ? (
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--warning)', marginBottom: '0.4rem' }}>
                        <AlertTriangle size={15} />
                        <span style={{ fontSize: '0.8125rem', fontWeight: 600 }}>Image Quality Check Failed</span>
                      </div>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '0 0 0.75rem 0' }}>
                        The retinal fundus image did not pass quality verification ({currentResult.quality?.reason || 'low focus / illumination'}). Recapture is required.
                      </p>
                      {onRecapture && (
                        <Button variant="outline" size="sm" icon={RefreshCw} onClick={() => onRecapture(currentResult)}>
                          Initiate Recapture
                        </Button>
                      )}
                    </div>
                  ) : reviewInfo.code === 'NOT_REQUIRED' ? (
                    <div>
                      <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--success)' }}>
                        Routine Community Follow-up
                      </span>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '0.25rem 0 0 0' }}>
                        Non-referable screening result (Grade 0–1). Specialist review is not required. Annual re-screening recommended.
                      </p>
                    </div>
                  ) : (
                    <div>
                      <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--warning)' }}>
                        Awaiting Specialist Evaluation
                      </span>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '0.25rem 0 0 0' }}>
                        This referable case (Grade {currentResult.drGrade}) has been placed in the ophthalmologist review queue.
                      </p>
                    </div>
                  )}
                </div>
              </Card>
            ) : (
              <ClinicalReviewForm screening={currentResult} onReviewUpdated={handleReviewSubmitted} />
            )}

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
                    Routing: {referralInfo.label}
                  </p>
                  <p style={{ fontSize: '0.71875rem', color: 'var(--text-muted)', margin: '0.15rem 0 0 0' }}>
                    Location: {currentResult.contactLocation || 'Rural Health Screening Camp'}
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

      {/* VIEW TAB 3: AI ASSISTANT (Doctor only) */}
      {!isOperator && activeTab === 'assistant' && (
        <AIAssistantPanel screening={currentResult} screeningId={currentResult.screeningId} />
      )}
    </div>
  );
};
