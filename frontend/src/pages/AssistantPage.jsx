import React, { useState } from 'react';
import { Bot, Send, Shield, Sparkles } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { api } from '../services/api';

export const AssistantPage = ({ screenings = [], onViewScreening }) => {
  const [selectedScreening, setSelectedScreening] = useState(screenings[0] || null);
  const [messages, setMessages] = useState([
    {
      sender: 'assistant',
      text: 'RetinoScan AI Assistant active. I can summarize clinical results, explain Image Quality Assessment metrics, and answer questions regarding patient screening history based strictly on authoritative MATLAB model outputs.',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const suggestedPrompts = [
    'Summarize this patient\'s screening history',
    'Why was this case marked referable or non-referable?',
    'Explain the focus score and illumination parameters',
    'What clinical protocol recommendations apply to Grade 0 vs Grade 2?',
  ];

  const handleSend = async (queryText) => {
    const query = queryText || input;
    if (!query.trim()) return;

    setMessages((prev) => [...prev, { sender: 'user', text: query }]);
    setInput('');
    setLoading(true);

    try {
      const res = await api.chatWithAgent({
        prompt: query,
        screeningData: selectedScreening,
        screeningId: selectedScreening?.screeningId,
      });

      setMessages((prev) => [
        ...prev,
        {
          sender: 'assistant',
          text: res.reply || 'No additional details available for this screening query.',
          authoritativeModelUsed: res.authoritativeModelUsed,
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { sender: 'assistant', text: `Communication error: ${err.message}` },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
      gap: '1rem',
      alignItems: 'start',
    }} className="animate-fade-in">
      {/* Left: Chat Conversation */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <Card
          title="AI Clinical Screening Assistant"
          subtitle="Non-diagnostic assistive interface grounded in MATLAB model outputs"
          headerBorder={true}
          action={
            <Badge variant="info">
              <Shield size={11} />
              <span>Strict MATLAB Boundary</span>
            </Badge>
          }
        >
          {/* Suggested Prompts */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginBottom: '0.75rem' }}>
            {suggestedPrompts.map((p, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(p)}
                style={{
                  padding: '0.25rem 0.55rem',
                  borderRadius: 'var(--radius-xs)',
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-secondary)',
                  fontSize: '0.71875rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  transition: 'var(--transition)',
                }}
              >
                <Sparkles size={11} color="var(--primary)" />
                <span>{p}</span>
              </button>
            ))}
          </div>

          {/* Messages */}
          <div style={{
            backgroundColor: 'var(--bg-secondary)',
            borderRadius: 'var(--radius-xs)',
            padding: '0.875rem',
            minHeight: '340px',
            maxHeight: '480px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
            marginBottom: '0.75rem',
            border: '1px solid var(--border-color)',
          }}>
            {messages.map((m, idx) => (
              <div
                key={idx}
                style={{
                  alignSelf: m.sender === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '88%',
                }}
              >
                <div style={{
                  padding: '0.625rem 0.875rem',
                  borderRadius: 'var(--radius-xs)',
                  backgroundColor: m.sender === 'user' ? 'var(--primary)' : 'var(--bg-card)',
                  color: m.sender === 'user' ? '#FFFFFF' : 'var(--text-primary)',
                  border: m.sender === 'user' ? 'none' : '1px solid var(--border-color)',
                  fontSize: '0.8125rem',
                  lineHeight: 1.45,
                }}>
                  {m.sender === 'assistant' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.6875rem', fontWeight: 600, color: 'var(--primary)', marginBottom: '0.25rem' }}>
                      <Bot size={13} />
                      <span>ASSISTANT EXPLANATION</span>
                    </div>
                  )}
                  <p style={{ margin: 0, whiteSpace: 'pre-line' }}>{m.text}</p>
                </div>
              </div>
            ))}

            {loading && (
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', padding: '0.35rem' }}>
                Consulting active screening context...
              </div>
            )}
          </div>

          {/* Input Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            style={{ display: 'flex', gap: '0.5rem' }}
          >
            <input
              type="text"
              placeholder="Ask a question regarding the active patient screening..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="clinical-input"
              style={{ flex: 1 }}
            />
            <Button type="submit" variant="primary" icon={Send} disabled={loading || !input.trim()}>
              Send
            </Button>
          </form>
        </Card>
      </div>

      {/* Right: Active Screening Context */}
      <div style={{ width: '320px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <Card
          title="Active Screening Context"
          subtitle="Selected patient screening record"
          headerBorder={true}
        >
          {screenings.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
              <select
                value={selectedScreening?.screeningId || ''}
                onChange={(e) => {
                  const s = screenings.find((sc) => sc.screeningId === e.target.value);
                  if (s) setSelectedScreening(s);
                }}
                className="clinical-select"
              >
                {screenings.map((sc) => (
                  <option key={sc.screeningId} value={sc.screeningId}>
                    {sc.patientId} (Grade {sc.drGrade ?? sc.grade ?? 0})
                  </option>
                ))}
              </select>

              {selectedScreening && (
                <div style={{
                  padding: '0.75rem',
                  borderRadius: 'var(--radius-xs)',
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.45rem',
                  fontSize: '0.75rem',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Patient ID:</span>
                    <strong style={{ color: 'var(--text-primary)' }} className="font-mono">{selectedScreening.patientId}</strong>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Screening ID:</span>
                    <span style={{ color: 'var(--text-secondary)' }} className="font-mono">{selectedScreening.screeningId?.slice(0, 10)}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>DR Grade:</span>
                    <Badge variant={selectedScreening.referable || selectedScreening.drGrade >= 2 ? 'danger' : 'success'} size="sm">
                      Grade {selectedScreening.drGrade ?? selectedScreening.grade ?? 0}
                    </Badge>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Confidence:</span>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }} className="font-mono">
                      {selectedScreening.confidence != null ? `${(selectedScreening.confidence * 100).toFixed(1)}%` : '—'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Referral:</span>
                    <Badge variant={selectedScreening.referable || selectedScreening.drGrade >= 2 ? 'danger' : 'success'} size="sm">
                      {selectedScreening.referral || (selectedScreening.referable || selectedScreening.drGrade >= 2 ? 'REFERABLE' : 'NON-REFERABLE')}
                    </Badge>
                  </div>

                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => onViewScreening(selectedScreening)}
                    style={{ marginTop: '0.35rem' }}
                  >
                    Inspect Full Screening
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              No screening records in database.
            </p>
          )}
        </Card>
      </div>
    </div>
  );
};
