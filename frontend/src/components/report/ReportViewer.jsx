import React from 'react';
import { Printer, FileText, CheckCircle2, AlertTriangle, Eye, ShieldCheck } from 'lucide-react';
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
  const isReferable = screening.triage?.referralRequired || screening.referable;
  const grade = screening.drGrade ?? screening.grade;
  const priority = screening.triage?.priority || 'ROUTINE';

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }} className="animate-fade-in">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }} className="no-print">
        <Button variant="secondary" onClick={onBack}>← Back to Screening</Button>
        <Button variant="primary" icon={Printer} onClick={handlePrint}>Print / Export Report</Button>
      </div>

      <Card style={{ padding: '2.5rem', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-card)' }}>
        {/* REPORT HEADER */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid var(--border-color)', paddingBottom: '1.5rem', marginBottom: '1.5rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Eye size={28} color="var(--primary)" />
              <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>
                RETINOSCAN <span style={{ color: 'var(--primary)' }}>AI</span>
              </h1>
            </div>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', margin: '0.25rem 0 0 0' }}>
              Explainable AI Diabetic Retinopathy Screening Report
            </p>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
              Location: {screening.contactLocation || 'Rural Screening Camp'}
            </p>
          </div>

          <div style={{ textAlign: 'right' }}>
            <Badge variant={isUngradable ? 'warning' : isReferable ? 'danger' : 'success'} size="md">
              {isUngradable ? 'UNGRADABLE' : isReferable ? `REFERABLE DR — ${priority} PRIORITY` : 'LOW RISK — ROUTINE'}
            </Badge>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem', margin: 0 }}>
              Report Date: {screening.createdAt ? new Date(screening.createdAt).toLocaleString() : new Date().toLocaleString()}
            </p>
            <p style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: 'var(--text-secondary)', margin: 0 }}>
              ID: {screening.screeningId}
            </p>
          </div>
        </div>

        {/* PATIENT INFORMATION */}
        <div style={{ marginBottom: '1.5rem', backgroundColor: 'var(--bg-secondary)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
          <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>
            PATIENT INFORMATION
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', fontSize: '0.875rem' }}>
            <div>
              <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '0.75rem' }}>Patient Name / ID</span>
              <strong style={{ color: 'var(--text-primary)' }}>{screening.patientName || screening.patientId}</strong>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>({screening.patientId})</div>
            </div>
            <div>
              <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '0.75rem' }}>Age / Sex</span>
              <strong style={{ color: 'var(--text-primary)' }}>{screening.age ? `${screening.age} yrs` : 'N/A'} / {screening.gender || 'Unspecified'}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '0.75rem' }}>Diabetes Duration</span>
              <strong style={{ color: 'var(--text-primary)' }}>{screening.diabetesDuration || 'Not specified'}</strong>
            </div>
          </div>
        </div>

        {/* IMAGE QUALITY ASSESSMENT */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>
            IMAGE QUALITY ASSESSMENT (IQA)
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', backgroundColor: isUngradable ? 'var(--warning-bg)' : 'var(--success-bg)' }}>
            {isUngradable ? <AlertTriangle color="var(--warning)" size={20} /> : <CheckCircle2 color="var(--success)" size={20} />}
            <div>
              <span style={{ fontSize: '0.875rem', fontWeight: 700, color: isUngradable ? 'var(--warning)' : 'var(--success)' }}>
                {isUngradable ? 'QUALITY CHECK FAILED' : 'QUALITY CHECK PASSED — GRADABLE'}
              </span>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-primary)', margin: 0 }}>
                Reason: "{screening.quality?.reason || 'Acceptable focus and illumination.'}"
              </p>
            </div>
          </div>
        </div>

        {/* AI MODEL SCREENING RESULT */}
        {!isUngradable && (
          <div style={{ marginBottom: '1.5rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1.25rem', backgroundColor: 'var(--bg-secondary)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShieldCheck size={20} color="var(--primary)" />
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                  MATLAB MODEL RESULT
                </h3>
              </div>
              <Badge variant={isReferable ? 'danger' : 'success'}>
                {screening.referral || (isReferable ? 'REFERABLE DR' : 'NON-REFERABLE DR')}
              </Badge>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', textAlign: 'center' }}>
              <div style={{ backgroundColor: 'var(--bg-card)', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>DR Grade</span>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: isReferable ? 'var(--danger)' : 'var(--success)' }}>
                  Grade {grade ?? 'N/A'}
                </div>
              </div>

              <div style={{ backgroundColor: 'var(--bg-card)', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Model Confidence</span>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {screening.confidence != null ? (screening.confidence * 100).toFixed(1) + '%' : 'N/A'}
                </div>
              </div>

              <div style={{ backgroundColor: 'var(--bg-card)', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Referable Status</span>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: isReferable ? 'var(--danger)' : 'var(--success)', marginTop: '0.25rem' }}>
                  {isReferable ? 'YES' : 'NO'}
                </div>
              </div>

              <div style={{ backgroundColor: 'var(--bg-card)', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Routing Priority</span>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: priority === 'URGENT' ? 'var(--danger)' : priority === 'HIGH' ? 'var(--warning)' : 'var(--info)', marginTop: '0.25rem' }}>
                  {priority}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MODEL ATTENTION — GRAD-CAM IMAGES */}
        {!isUngradable && (
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>
              MODEL ATTENTION — GRAD-CAM VISUAL EXPLAINABILITY
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div style={{ textAlign: 'center' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.375rem' }}>
                  Original Fundus Image
                </span>
                <img
                  src={api.getFileUrl(screening.originalImageUrl)}
                  alt="Original fundus"
                  style={{ width: '100%', maxHeight: '200px', objectFit: 'contain', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', backgroundColor: '#000' }}
                />
              </div>

              {screening.gradcamUrl && (
                <div style={{ textAlign: 'center' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.375rem' }}>
                    Model Attention Heatmap (Grad-CAM)
                  </span>
                  <img
                    src={api.getFileUrl(screening.gradcamUrl)}
                    alt="Grad-CAM visual heatmap"
                    style={{ width: '100%', maxHeight: '200px', objectFit: 'contain', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', backgroundColor: '#000' }}
                  />
                </div>
              )}
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic', marginTop: '0.5rem', textAlign: 'center' }}>
              "Grad-CAM highlights image regions that contributed to the model prediction."
            </p>
          </div>
        )}

        {/* CLINICAL RECOMMENDATION */}
        <div style={{ marginBottom: '1.5rem', padding: '1rem', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-secondary)', borderLeft: '4px solid var(--primary)' }}>
          <h4 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            RECOMMENDED CLINICAL WORKFLOW ROUTING
          </h4>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.375rem', margin: 0 }}>
            {screening.triage?.recommendation || (isReferable ? 'Specialist review recommended. Routed to Ophthalmologist queue.' : 'Routine annual eye checkup recommended.')}
          </p>
        </div>

        {/* HUMAN REVIEW RECORD (IF COMPLETED) */}
        {screening.humanReview?.reviewed && (
          <div style={{ marginBottom: '1.5rem', padding: '1rem', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--info-bg)', border: '1px solid rgba(2, 132, 199, 0.3)' }}>
            <h4 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--info)', margin: 0 }}>
              OPHTHALMOLOGIST CLINICAL REVIEW SIGN-OFF
            </h4>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-primary)', marginTop: '0.25rem' }}>
              Reviewer: <strong>{screening.humanReview.reviewer}</strong> | Decision: <strong>{screening.humanReview.decision}</strong>
            </p>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', margin: 0 }}>
              Notes: "{screening.humanReview.notes || 'No notes provided.'}"
            </p>
          </div>
        )}

        {/* MEDICAL DISCLAIMER */}
        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem', marginTop: '2rem', textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          <p style={{ margin: 0 }}>
            <strong>DISCLAIMER:</strong> This AI screening output is intended for clinical decision support and triage in rural health camps. Final diagnosis must be confirmed by a certified Ophthalmologist.
          </p>
        </div>
      </Card>
    </div>
  );
};
