import React from 'react';
import { Printer, Eye, CheckCircle2, AlertTriangle, ShieldCheck, ArrowLeft } from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { api } from '../../services/api';

export const ReportViewer = ({ screening, onBack }) => {
  if (!screening) return null;

  const handlePrint = () => {
    window.print();
  };

  const isUngradable = screening.status === 'UNGRADABLE';
  const isReferable = screening.triage?.referralRequired || screening.referable || screening.drGrade >= 2;
  const grade = screening.drGrade ?? screening.grade;
  const priority = screening.triage?.priority || 'ROUTINE';

  return (
    <div style={{ maxWidth: '820px', margin: '0 auto' }} className="animate-fade-in">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.875rem' }} className="no-print">
        <Button variant="secondary" size="sm" icon={ArrowLeft} onClick={onBack}>
          Back
        </Button>
        <Button variant="primary" size="sm" icon={Printer} onClick={handlePrint}>
          Print / Export Clinical Report
        </Button>
      </div>

      <Card style={{ padding: '2rem', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-card)' }}>
        {/* REPORT HEADER */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          borderBottom: '2px solid var(--border-color)',
          paddingBottom: '1rem',
          marginBottom: '1.25rem',
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <Eye size={22} color="var(--primary)" />
              <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '0.02em' }}>
                RETINOSCAN <span style={{ color: 'var(--primary)' }}>AI</span>
              </h1>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '0.2rem 0 0 0' }}>
              Diabetic Retinopathy Screening & Clinical Triage Report
            </p>
            {screening.contactLocation && (
              <p style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', margin: 0 }}>
                Screening Center / Location: {screening.contactLocation}
              </p>
            )}
          </div>

          <div style={{ textAlign: 'right' }}>
            <Badge variant={isUngradable ? 'warning' : isReferable ? 'danger' : 'success'} size="md">
              {isUngradable ? 'UNGRADABLE' : isReferable ? `REFERABLE DR — ${priority} PRIORITY` : 'LOW RISK — ROUTINE'}
            </Badge>
            <p style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: '0.35rem', margin: 0 }}>
              Report Date: {screening.createdAt ? new Date(screening.createdAt).toLocaleString() : new Date().toLocaleString()}
            </p>
            <p style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)', margin: 0 }} className="font-mono">
              ID: {screening.screeningId}
            </p>
          </div>
        </div>

        {/* PATIENT INFORMATION */}
        <div style={{
          marginBottom: '1.25rem',
          backgroundColor: 'var(--bg-secondary)',
          padding: '0.875rem',
          borderRadius: 'var(--radius-xs)',
          border: '1px solid var(--border-color)',
        }}>
          <h3 style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
            PATIENT INFORMATION
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', fontSize: '0.8125rem' }}>
            <div>
              <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '0.6875rem' }}>Patient ID / Name</span>
              <strong style={{ color: 'var(--text-primary)' }} className="font-mono">{screening.patientId}</strong>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{screening.patientName || 'Anonymous'}</div>
            </div>
            <div>
              <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '0.6875rem' }}>Demographics</span>
              <strong style={{ color: 'var(--text-primary)' }}>
                {screening.age != null ? `${screening.age} yrs` : 'Age: —'} / {screening.gender || 'Unspecified'}
              </strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '0.6875rem' }}>Diabetes Duration</span>
              <strong style={{ color: 'var(--text-primary)' }}>{screening.diabetesDuration || 'Not specified'}</strong>
            </div>
          </div>
        </div>

        {/* IMAGE QUALITY ASSESSMENT */}
        <div style={{ marginBottom: '1.25rem' }}>
          <h3 style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
            IMAGE QUALITY ASSESSMENT (IQA)
          </h3>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.625rem',
            padding: '0.625rem 0.875rem',
            borderRadius: 'var(--radius-xs)',
            backgroundColor: isUngradable ? 'var(--warning-bg)' : 'var(--success-bg)',
            border: `1px solid ${isUngradable ? 'var(--warning-border)' : 'var(--success-border)'}`,
          }}>
            {isUngradable ? <AlertTriangle color="var(--warning)" size={18} /> : <CheckCircle2 color="var(--success)" size={18} />}
            <div>
              <strong style={{ fontSize: '0.8125rem', color: isUngradable ? 'var(--warning)' : 'var(--success)' }}>
                {isUngradable ? 'QUALITY CHECK FAILED — RECAPTURE REQUIRED' : 'IMAGE QUALITY PASSED — GRADABLE'}
              </strong>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-primary)', margin: 0 }}>
                {screening.quality?.reason || (isUngradable ? 'Image quality insufficient.' : 'Focus, illumination, and field of view validated.')}
              </p>
            </div>
          </div>
        </div>

        {/* AI MODEL SCREENING RESULT */}
        {!isUngradable && (
          <div style={{
            marginBottom: '1.25rem',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-xs)',
            padding: '1rem',
            backgroundColor: 'var(--bg-secondary)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <ShieldCheck size={16} color="var(--primary)" />
                <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                  MATLAB MODEL OUTPUT
                </h3>
              </div>
              <Badge variant={isReferable ? 'danger' : 'success'}>
                {screening.referral || (isReferable ? 'REFERABLE DR' : 'NON-REFERABLE DR')}
              </Badge>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem', textAlign: 'center' }}>
              <div style={{ backgroundColor: 'var(--bg-card)', padding: '0.625rem', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)' }}>DR Grade</span>
                <div style={{ fontSize: '1.125rem', fontWeight: 700, color: isReferable ? 'var(--danger)' : 'var(--success)', marginTop: '0.15rem' }}>
                  Grade {grade ?? '—'}
                </div>
              </div>

              <div style={{ backgroundColor: 'var(--bg-card)', padding: '0.625rem', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)' }}>Model Confidence</span>
                <div style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.15rem' }} className="font-mono">
                  {screening.confidence != null ? `${(screening.confidence * 100).toFixed(1)}%` : '—'}
                </div>
              </div>

              <div style={{ backgroundColor: 'var(--bg-card)', padding: '0.625rem', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)' }}>Referable Status</span>
                <div style={{ fontSize: '0.875rem', fontWeight: 700, color: isReferable ? 'var(--danger)' : 'var(--success)', marginTop: '0.2rem' }}>
                  {isReferable ? 'YES' : 'NO'}
                </div>
              </div>

              <div style={{ backgroundColor: 'var(--bg-card)', padding: '0.625rem', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)' }}>Routing Priority</span>
                <div style={{ fontSize: '0.875rem', fontWeight: 700, color: priority === 'URGENT' ? 'var(--danger)' : priority === 'HIGH' ? 'var(--warning)' : 'var(--primary)', marginTop: '0.2rem' }}>
                  {priority}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MODEL ATTENTION — GRAD-CAM IMAGES */}
        {!isUngradable && (
          <div style={{ marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
              MODEL ATTENTION — GRAD-CAM VISUAL EXPLAINABILITY
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div style={{ textAlign: 'center', backgroundColor: '#000000', borderRadius: 'var(--radius-xs)', padding: '0.35rem', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: '#FFFFFF', display: 'block', marginBottom: '0.25rem' }}>
                  Original Fundus Photograph
                </span>
                <img
                  src={api.getFileUrl(screening.originalImageUrl)}
                  alt="Original fundus"
                  style={{ width: '100%', maxHeight: '180px', objectFit: 'contain' }}
                />
              </div>

              {screening.gradcamUrl && (
                <div style={{ textAlign: 'center', backgroundColor: '#000000', borderRadius: 'var(--radius-xs)', padding: '0.35rem', border: '1px solid var(--border-color)' }}>
                  <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: '#FFFFFF', display: 'block', marginBottom: '0.25rem' }}>
                    Model Attention Heatmap (Grad-CAM)
                  </span>
                  <img
                    src={api.getFileUrl(screening.gradcamUrl)}
                    alt="Grad-CAM heatmap"
                    style={{ width: '100%', maxHeight: '180px', objectFit: 'contain' }}
                  />
                </div>
              )}

              {screening.retinalAnalysis?.assets?.lesionOverlay && (
                <div style={{ textAlign: 'center', backgroundColor: '#000000', borderRadius: 'var(--radius-xs)', padding: '0.35rem', border: '1px solid var(--border-color)' }}>
                  <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: '#FFFFFF', display: 'block', marginBottom: '0.25rem' }}>
                    Model-Predicted Lesion Overlay (U-Net)
                  </span>
                  <img
                    src={api.getFileUrl(screening.retinalAnalysis.assets.lesionOverlay)}
                    alt="Lesion Overlay"
                    style={{ width: '100%', maxHeight: '180px', objectFit: 'contain' }}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* MODEL-PREDICTED LESION FINDINGS TABLE */}
        {screening.retinalAnalysis?.lesions && (
          <div style={{
            marginBottom: '1.25rem',
            padding: '0.875rem',
            borderRadius: 'var(--radius-xs)',
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
          }}>
            <h3 style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
              MODEL-PREDICTED LESION EVIDENCE (IDRiD U-NET BENCHMARK)
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.5rem' }}>
              {[
                { label: 'Microaneurysms', key: 'microaneurysms', code: 'MA' },
                { label: 'Haemorrhages', key: 'haemorrhages', code: 'HE' },
                { label: 'Hard Exudates', key: 'hardExudates', code: 'EX' },
                { label: 'Soft Exudates', key: 'softExudates', code: 'SE', note: '(Sparse val data)' },
              ].map((item) => {
                const data = screening.retinalAnalysis.lesions[item.key];
                return (
                  <div key={item.key} style={{ padding: '0.5rem', backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>{item.code}</span>
                      <Badge variant={data?.present ? 'danger' : 'neutral'} size="xs">
                        {data?.present ? 'Detected' : 'Not Detected'}
                      </Badge>
                    </div>
                    <div style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                      <div>Count: <strong>{data?.count ?? 0}</strong></div>
                      <div>Area: <strong>{data?.totalPixelArea ? `${data.totalPixelArea} px` : '0 px'}</strong></div>
                      {item.note && <div style={{ fontSize: '0.625rem', color: 'var(--text-muted)' }}>{item.note}</div>}
                    </div>
                  </div>
                );
              })}
            </div>
            <p style={{ fontSize: '0.625rem', color: 'var(--text-muted)', margin: '0.5rem 0 0 0' }}>
              *Model-predicted lesion evidence only. Not a clinical diagnosis.
            </p>
          </div>
        )}

        {/* CLINICAL RECOMMENDATION */}
        <div style={{
          marginBottom: '1.25rem',
          padding: '0.75rem',
          borderRadius: 'var(--radius-xs)',
          backgroundColor: 'var(--bg-secondary)',
          borderLeft: '3px solid var(--primary)',
        }}>
          <h4 style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            RECOMMENDED CLINICAL ROUTING
          </h4>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem', margin: 0 }}>
            {screening.triage?.recommendation || (isReferable ? 'Specialist review recommended. Routed to Ophthalmologist queue.' : 'Routine annual screening checkup recommended.')}
          </p>
        </div>

        {/* HUMAN REVIEW RECORD (IF COMPLETED) */}
        {screening.humanReview?.reviewed && (
          <div style={{
            marginBottom: '1.25rem',
            padding: '0.75rem',
            borderRadius: 'var(--radius-xs)',
            backgroundColor: 'var(--primary-light)',
            border: '1px solid var(--primary-border)',
          }}>
            <h4 style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)', margin: 0 }}>
              OPHTHALMOLOGIST CLINICAL SIGN-OFF
            </h4>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-primary)', marginTop: '0.2rem', margin: 0 }}>
              Reviewer: <strong>{screening.humanReview.reviewer}</strong> | Decision: <strong>{screening.humanReview.decision}</strong>
            </p>
            {screening.humanReview.notes && (
              <p style={{ fontSize: '0.71875rem', color: 'var(--text-secondary)', margin: '0.2rem 0 0 0' }}>
                Notes: "{screening.humanReview.notes}"
              </p>
            )}
          </div>
        )}

        {/* MEDICAL DISCLAIMER */}
        <div style={{
          borderTop: '1px solid var(--border-color)',
          paddingTop: '0.75rem',
          marginTop: '1.5rem',
          textAlign: 'center',
          fontSize: '0.6875rem',
          color: 'var(--text-muted)',
        }}>
          <p style={{ margin: 0 }}>
            <strong>DISCLAIMER:</strong> This AI screening result is an assistive clinical decision support tool designed for rural screening camps. Final diagnosis and care plan must be established by a qualified ophthalmologist.
          </p>
        </div>
      </Card>
    </div>
  );
};
