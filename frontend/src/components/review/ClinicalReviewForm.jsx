import React, { useState } from 'react';
import { CheckCircle2, Send, Clock, AlertTriangle, ShieldCheck } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { api } from '../../services/api';

export const ClinicalReviewForm = ({ screening, onReviewUpdated }) => {
  const [reviewer, setReviewer] = useState(screening?.humanReview?.reviewer || 'Dr. Sarah Jenkins, MD');
  const [decision, setDecision] = useState(screening?.humanReview?.decision || 'Agreed');
  const [notes, setNotes] = useState(screening?.humanReview?.notes || '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  if (!screening) return null;

  const isUngradable = screening.status !== 'GRADABLE';
  const isNonReferable = screening.drGrade === null || screening.drGrade === undefined || Number(screening.drGrade) < 2;
  const isReviewed = Boolean(screening.humanReview?.reviewed || screening.triage?.status === 'REVIEWED');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reviewer.trim() || !decision.trim()) {
      setError('Please provide reviewer name and clinical decision.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await api.submitReview(screening.screeningId, {
        reviewer: reviewer.trim(),
        decision: decision.trim(),
        notes: notes.trim(),
      });
      if (res.status === 'SUCCESS' && onReviewUpdated) {
        onReviewUpdated(res.screening);
      }
    } catch (err) {
      setError(err.message || 'Failed to submit clinical assessment.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card
      title="Clinician Assessment & Sign-off"
      subtitle="Independent ophthalmologist review and audit determination"
      headerBorder={true}
      action={
        <Badge variant={isReviewed ? 'success' : isUngradable ? 'warning' : isNonReferable ? 'neutral' : 'warning'}>
          {isReviewed ? 'Reviewed by Clinician' : isUngradable ? 'Recapture Required' : isNonReferable ? 'Routine Follow-up' : 'Pending Review'}
        </Badge>
      }
    >
      {/* CASE 1: UNGRADABLE IMAGE */}
      {isUngradable ? (
        <div style={{ padding: '0.875rem', borderRadius: 'var(--radius-xs)', backgroundColor: 'var(--warning-bg)', border: '1px solid var(--warning-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600, fontSize: '0.8125rem', color: 'var(--warning)', marginBottom: '0.25rem' }}>
            <AlertTriangle size={15} />
            <span>Ineligible for Review — Image Quality Check Failed</span>
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0 }}>
            {screening.quality?.reason || 'Image quality criteria not met'}. This case requires fundus image recapture at the screening camp and is not eligible for specialist review.
          </p>
        </div>
      ) : isNonReferable ? (
        /* CASE 2: GRADE 0 OR GRADE 1 (NON-REFERABLE) */
        <div style={{ padding: '0.875rem', borderRadius: 'var(--radius-xs)', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600, fontSize: '0.8125rem', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
            <ShieldCheck size={15} color="var(--success)" />
            <span>Routine Screening — Grade {screening.drGrade ?? 0} (Non-Referable)</span>
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0 }}>
            Automated screening classified this case as low-risk diabetic retinopathy requiring annual routine follow-up. Specialist review sign-off is restricted to referable cases (Grade ≥ 2).
          </p>
        </div>
      ) : isReviewed ? (
        /* CASE 3: ALREADY REVIEWED */
        <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '0.875rem', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.625rem' }}>
            <CheckCircle2 size={16} color="var(--success)" />
            <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              Clinical Sign-off Recorded & Persisted
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <div>
              <span style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)', display: 'block' }}>Reviewing Clinician</span>
              <strong style={{ fontSize: '0.8125rem', color: 'var(--text-primary)' }}>
                {screening.humanReview?.reviewer || 'Clinician'}
              </strong>
            </div>

            <div>
              <span style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)', display: 'block' }}>Clinical Determination</span>
              <strong style={{ fontSize: '0.8125rem', color: 'var(--text-primary)' }}>
                {screening.humanReview?.decision || 'Agreed'}
              </strong>
            </div>

            <div>
              <span style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)', display: 'block' }}>Review Date</span>
              <span style={{ fontSize: '0.8125rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <Clock size={12} color="var(--text-muted)" />
                {screening.humanReview?.reviewedAt ? new Date(screening.humanReview.reviewedAt).toLocaleString() : 'Recorded'}
              </span>
            </div>
          </div>

          {screening.humanReview?.notes && (
            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.5rem', marginTop: '0.5rem' }}>
              <span style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)', display: 'block' }}>Clinician Notes</span>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-primary)', margin: '0.2rem 0 0 0' }}>
                "{screening.humanReview.notes}"
              </p>
            </div>
          )}
        </div>
      ) : (
        /* CASE 4: UNREVIEWED REFERABLE CASE (GRADE 2+) - INTAKE FORM */
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.25rem' }}>
          {error && (
            <div style={{ padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-xs)', backgroundColor: 'var(--danger-bg)', border: '1px solid var(--danger-border)', color: 'var(--danger)', fontSize: '0.75rem' }}>
              {error}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                Reviewer Name
              </label>
              <input
                type="text"
                placeholder="e.g. Dr. Sarah Jenkins, MD"
                value={reviewer}
                onChange={(e) => setReviewer(e.target.value)}
                required
                disabled={submitting}
                className="clinical-input"
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                Clinical Decision
              </label>
              <select
                value={decision}
                onChange={(e) => setDecision(e.target.value)}
                disabled={submitting}
                className="clinical-select"
              >
                <option value="Agreed">Agreed with AI Prediction (Grade {screening.drGrade})</option>
                <option value="Re-evaluation Needed">Re-evaluation Needed</option>
                <option value="Override Referral">Override Referral Decision</option>
              </select>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
              Clinical Remarks / Notes
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={submitting}
              placeholder="Record anatomical observations, macula involvement remarks, or follow-up interval..."
              className="clinical-textarea"
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border-color)', paddingTop: '0.625rem' }}>
            <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
              Note: Clinician determination is stored separately. Original AI screening results remain immutable.
            </span>
            <Button type="submit" variant="primary" icon={Send} disabled={submitting}>
              {submitting ? 'Saving to Database...' : 'Submit Assessment'}
            </Button>
          </div>
        </form>
      )}
    </Card>
  );
};
