import React, { useState } from 'react';
import { Bot, Send, Sparkles, Shield, User, FileText, CheckCircle2 } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { api } from '../services/api';

export const AssistantPage = ({ screenings = [], onViewScreening }) => {
  const [selectedScreening, setSelectedScreening] = useState(screenings[0] || null);
  const [messages, setMessages] = useState([
    {
      sender: 'assistant',
      text: 'Hello Dr. Jenkins. I am your RetinoScan AI Assistant. I can summarize clinical results, explain Image Quality Assessment metrics, and answer questions regarding patient screening history based strictly on authoritative MATLAB model outputs.',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const suggestedPrompts = [
    'Summarize this patient\'s screening history',
    'Why was this patient marked referable or non-referable?',
    'Explain the focus score and illumination parameters',
    'What clinical recommendations apply to Grade 0 vs Grade 2?',
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
          text: res.reply || 'I don\'t have enough information to answer that question.',
          authoritativeModelUsed: res.authoritativeModelUsed,
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { sender: 'assistant', text: `Error: ${err.message}` },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
      gap: '1.5rem',
      alignItems: 'start',
    }} className="animate-fade-in">
      {/* Left / Main Conversation */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <Card
          title="AI Clinical Assistant Chat"
          subtitle="Non-diagnostic explanatory AI interface"
          action={
            <Badge variant="info">
              <Shield size={12} />
              <span>Strict MATLAB Boundary</span>
            </Badge>
          }
        >
          {/* Suggested Prompts */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', marginBottom: '1rem' }}>
            {suggestedPrompts.map((p, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(p)}
                style={{
                  padding: '0.375rem 0.625rem',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-secondary)',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                }}
              >
                <Sparkles size={12} color="var(--primary)" />
                <span>{p}</span>
              </button>
            ))}
          </div>

          {/* Chat Container */}
          <div style={{
            backgroundColor: 'var(--bg-secondary)',
            borderRadius: 'var(--radius-md)',
            padding: '1rem',
            minHeight: '360px',
            maxHeight: '500px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            marginBottom: '1rem',
            border: '1px solid var(--border-color)',
          }}>
            {messages.map((m, idx) => (
              <div
                key={idx}
                style={{
                  alignSelf: m.sender === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '85%',
                }}
              >
                <div style={{
                  padding: '0.875rem 1.125rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: m.sender === 'user' ? 'var(--primary)' : 'var(--bg-card)',
                  color: m.sender === 'user' ? '#FFF' : 'var(--text-primary)',
                  boxShadow: 'var(--shadow-sm)',
                  border: m.sender === 'user' ? 'none' : '1px solid var(--border-color)',
                  fontSize: '0.875rem',
                }}>
                  {m.sender === 'assistant' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--primary)', marginBottom: '0.375rem' }}>
                      <Bot size={14} />
                      <span>AI ASSISTANT EXPLANATION</span>
                    </div>
                  )}
                  <p style={{ margin: 0, whiteSpace: 'pre-line' }}>{m.text}</p>
                </div>
              </div>
            ))}

            {loading && (
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                Consulting screening context...
              </div>
            )}
          </div>

          {/* Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            style={{ display: 'flex', gap: '0.5rem' }}
          >
            <input
              type="text"
              placeholder="Ask a question regarding the active patient context..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              style={{
                flex: 1,
                padding: '0.625rem 0.875rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-card)',
                color: 'var(--text-primary)',
                fontSize: '0.875rem',
                outline: 'none',
              }}
            />
            <Button type="submit" variant="primary" icon={Send} disabled={loading || !input.trim()}>
              Send
            </Button>
          </form>
        </Card>
      </div>

      {/* Right / Context Sidebar */}
      <div style={{ width: '320px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <Card title="Active Screening Context" subtitle="Select a screening record to load context">
          {screenings.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <select
                value={selectedScreening?.screeningId || ''}
                onChange={(e) => {
                  const s = screenings.find((sc) => sc.screeningId === e.target.value);
                  if (s) setSelectedScreening(s);
                }}
                style={{
                  width: '100%',
                  padding: '0.5rem 0.75rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  fontSize: '0.8125rem',
                  outline: 'none',
                }}
              >
                {screenings.map((sc) => (
                  <option key={sc.screeningId} value={sc.screeningId}>
                    {sc.patientId} (Grade {sc.drGrade ?? sc.grade ?? 0})
                  </option>
                ))}
              </select>

              {selectedScreening && (
                <div style={{
                  padding: '0.875rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem',
                  fontSize: '0.8125rem',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Patient ID:</span>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{selectedScreening.patientId}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Screening ID:</span>
                    <span style={{ fontFamily: 'monospace', color: 'var(--text-secondary)' }}>{selectedScreening.screeningId.slice(0, 8)}...</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>DR Grade:</span>
                    <Badge variant={selectedScreening.referable ? 'danger' : 'success'}>
                      Grade {selectedScreening.drGrade ?? selectedScreening.grade ?? 0}
                    </Badge>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Model Confidence:</span>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                      {selectedScreening.confidence != null ? (selectedScreening.confidence * 100).toFixed(2) + '%' : 'N/A'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Referral Status:</span>
                    <Badge variant={selectedScreening.referable ? 'danger' : 'success'}>
                      {selectedScreening.referral || (selectedScreening.referable ? 'REFERABLE' : 'NON-REFERABLE')}
                    </Badge>
                  </div>

                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => onViewScreening(selectedScreening)}
                    style={{ marginTop: '0.5rem' }}
                  >
                    View Full Result
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
              No screening records in context. Perform a screening first.
            </p>
          )}
        </Card>
      </div>
    </div>
  );
};
