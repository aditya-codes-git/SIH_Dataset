import React, { useState, useEffect } from 'react';
import { Bot, Send, Shield } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { api } from '../../services/api';

export const AIAssistantPanel = ({ screening, screeningId }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const suggestedQuestions = [
    'Explain the screening result',
    'Why was this case marked referable or non-referable?',
    'Explain the focus score and image quality criteria',
    'Summarize clinical recommendation',
  ];

  // Fetch initial explanation on load
  useEffect(() => {
    if (!screening && !screeningId) return;

    const fetchExplanation = async () => {
      try {
        const payload = screening ? { screeningData: screening } : { screeningId };
        const res = await api.explainScreening(payload);
        if (res.explanation) {
          setMessages([
            {
              sender: 'assistant',
              text: res.explanation,
              disclaimer: res.disclaimer,
            },
          ]);
        }
      } catch (err) {
        console.error('Failed to load explanation:', err);
      }
    };

    fetchExplanation();
  }, [screening, screeningId]);

  const handleSend = async (promptText) => {
    const query = promptText || input;
    if (!query.trim()) return;

    const userMsg = { sender: 'user', text: query };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const payload = {
        prompt: query,
        screeningId: screening?.screeningId || screeningId,
        screeningData: screening,
      };
      const res = await api.chatWithAgent(payload);
      const assistantMsg = {
        sender: 'assistant',
        text: res.reply || 'No additional information available for this screening query.',
        authoritativeModelUsed: res.authoritativeModelUsed,
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { sender: 'assistant', text: `Query error: ${err.message}` },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card
      title="AI Clinical Screening Assistant"
      subtitle="Contextual explanations grounded in authoritative MATLAB model outputs"
      headerBorder={true}
      action={
        <Badge variant="info">
          <Shield size={11} />
          <span>Assistive Tool</span>
        </Badge>
      }
    >
      {/* Quick Prompts */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginBottom: '0.75rem' }}>
        {suggestedQuestions.map((q, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(q)}
            disabled={loading}
            style={{
              padding: '0.25rem 0.55rem',
              borderRadius: 'var(--radius-xs)',
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-secondary)',
              fontSize: '0.71875rem',
              cursor: 'pointer',
              transition: 'var(--transition)',
              whiteSpace: 'nowrap',
            }}
          >
            {q}
          </button>
        ))}
      </div>

      {/* Message Chat List */}
      <div style={{
        backgroundColor: 'var(--bg-secondary)',
        borderRadius: 'var(--radius-xs)',
        padding: '0.875rem',
        minHeight: '220px',
        maxHeight: '380px',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
        marginBottom: '0.75rem',
        border: '1px solid var(--border-color)',
      }}>
        {messages.map((msg, idx) => (
          <div
            key={idx}
            style={{
              alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '90%',
            }}
          >
            <div style={{
              padding: '0.625rem 0.875rem',
              borderRadius: 'var(--radius-xs)',
              backgroundColor: msg.sender === 'user' ? 'var(--primary)' : 'var(--bg-card)',
              color: msg.sender === 'user' ? '#FFFFFF' : 'var(--text-primary)',
              border: msg.sender === 'user' ? 'none' : '1px solid var(--border-color)',
              fontSize: '0.8125rem',
              lineHeight: 1.45,
            }}>
              {msg.sender === 'assistant' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.6875rem', fontWeight: 600, color: 'var(--primary)', marginBottom: '0.25rem' }}>
                  <Bot size={13} />
                  <span>ASSISTIVE EXPLANATION</span>
                </div>
              )}
              <p style={{ margin: 0, whiteSpace: 'pre-line' }}>{msg.text}</p>

              {msg.disclaimer && (
                <p style={{ fontSize: '0.65625rem', color: 'var(--text-muted)', marginTop: '0.35rem', margin: 0, fontStyle: 'italic' }}>
                  {msg.disclaimer}
                </p>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', padding: '0.35rem' }}>
            Consulting MATLAB screening data...
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
          placeholder="Ask a question regarding this screening context..."
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
  );
};
