import React, { useState } from 'react';
import { UserCheck, CheckCircle2, Send, Clock, FileText } from 'lucide-react';
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

  const isReviewed = screening?.humanReview?.reviewed;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reviewer || !decision) {
      setError('Please fill in reviewer name and decision.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await api.submitReview(screening.screeningId, { reviewer, decision, notes });
      if (res.status === 'SUCCESS' && onReviewUpdated) {
        onReviewUpdated(res.screening);
      }
    } catch (err) {
      setError(err.message || 'Failed to submit review.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card
      title="Human Clinical Review"
      subtitle="Ophthalmologist / Clinician independent review section"
      action={
        <Badge variant={isReviewed ? 'success' : 'neutral'}>
          {isReviewed ? 'Reviewed by Clinician' : 'Pending Review'}
        </Badge>
      }
    >
      {isReviewed ? (
        /* Reviewed State Display */
        <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <CheckCircle2 size={18} color="var(--success)" />
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              Clinical Review Recorded
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '0.75rem' }}>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block' }}>Reviewer</span>
              <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                {screening.humanReview.reviewer}
              </span>
            </div>

            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block' }}>Decision</span>
              <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                {screening.humanReview.decision}
              </span>
            </div>

            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block' }}>Date</span>
              <span style={{ fontSize: '0.875rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <Clock size={12} color="var(--text-muted)" />
                {screening.humanReview.reviewedAt ? new Date(screening.humanReview.reviewedAt).toLocaleDateString() : 'Today'}
              </span>
            </div>
          </div>

          {screening.humanReview.notes && (
            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.625rem', marginTop: '0.5rem' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block' }}>Clinician Notes</span>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-primary)', margin: '0.25rem 0 0 0' }}>
                "{screening.humanReview.notes}"
              </p>
            </div>
          )}
        </div>
      ) : (
        /* Form for submitting review */
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.5rem' }}>
          {error && (
            <div style={{ padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--danger-bg)', color: 'var(--danger)', fontSize: '0.8125rem' }}>
              {error}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                Reviewer Name
              </label>
              <input
                type="text"
                value={reviewer}
                onChange={(e) => setReviewer(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '0.5rem 0.75rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  fontSize: '0.875rem',
                  outline: 'none',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                Clinical Decision
              </label>
              <select
                value={decision}
                onChange={(e) => setDecision(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem 0.75rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  fontSize: '0.875rem',
                  outline: 'none',
                }}
              >
                <option value="Agreed">Agreed with MATLAB Prediction</option>
                <option value="Re-evaluation Needed">Re-evaluation Needed</option>
                <option value="Override Referral">Override Referral Decision</option>
              </select>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
              Clinician Review Notes
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add clinical observations, macula status, or referral remarks..."
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                fontSize: '0.875rem',
                outline: 'none',
                resize: 'vertical',
              }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Note: Human review does not alter original MATLAB model output.
            </span>
            <Button type="submit" variant="primary" icon={Send} disabled={submitting}>
              {submitting ? 'Saving Review...' : 'Submit Clinical Review'}
            </Button>
          </div>
        </form>
      )}
    </Card>
  );
};
