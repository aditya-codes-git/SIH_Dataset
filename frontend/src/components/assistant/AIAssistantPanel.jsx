import React, { useState, useEffect } from 'react';
import { Bot, Send, Sparkles, AlertCircle, Info, Shield, HelpCircle } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { api } from '../../services/api';

export const AIAssistantPanel = ({ screening, screeningId }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialExplanation, setInitialExplanation] = useState(null);

  const suggestedQuestions = [
    'Explain the screening result',
    'Why was this patient referred or non-referable?',
    'What was the focus score and image quality?',
    'Summarize clinical recommendation',
  ];

  // Fetch initial structured explanation on load
  useEffect(() => {
    if (!screening && !screeningId) return;

    const fetchExplanation = async () => {
      try {
        const payload = screening ? { screeningData: screening } : { screeningId };
        const res = await api.explainScreening(payload);
        if (res.explanation) {
          setInitialExplanation(res);
          setMessages([
            {
              sender: 'assistant',
              text: res.explanation,
              disclaimer: res.disclaimer,
            },
          ]);
        }
      } catch (err) {
        console.error('Failed to load initial explanation:', err);
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
        text: res.reply || 'I don\'t have enough information to answer that question based on the MATLAB screening context.',
        authoritativeModelUsed: res.authoritativeModelUsed,
      };
      setMessages((prev) => [...prev, assistantMsg]);
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
    <Card
      title="AI Screening Assistant"
      subtitle="Contextual explanations based strictly on authoritative MATLAB model results"
      action={
        <Badge variant="info">
          <Shield size={12} />
          <span>Non-Diagnostic Assistant</span>
        </Badge>
      }
    >
      {/* Suggested Quick Prompts */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', marginBottom: '1rem' }}>
        {suggestedQuestions.map((q, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(q)}
            disabled={loading}
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
              transition: 'var(--transition)',
            }}
          >
            <Sparkles size={12} color="var(--primary)" />
            <span>{q}</span>
          </button>
        ))}
      </div>

      {/* Message Chat List */}
      <div style={{
        backgroundColor: 'var(--bg-secondary)',
        borderRadius: 'var(--radius-md)',
        padding: '1rem',
        minHeight: '220px',
        maxHeight: '380px',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.875rem',
        marginBottom: '1rem',
        border: '1px solid var(--border-color)',
      }}>
        {messages.map((msg, idx) => (
          <div
            key={idx}
            style={{
              alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '88%',
            }}
          >
            <div style={{
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-md)',
              backgroundColor: msg.sender === 'user' ? 'var(--primary)' : 'var(--bg-card)',
              color: msg.sender === 'user' ? '#FFFFFF' : 'var(--text-primary)',
              boxShadow: 'var(--shadow-sm)',
              border: msg.sender === 'user' ? 'none' : '1px solid var(--border-color)',
              fontSize: '0.875rem',
            }}>
              {msg.sender === 'assistant' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--primary)', marginBottom: '0.375rem' }}>
                  <Bot size={14} />
                  <span>AI ASSISTANT EXPLANATION</span>
                </div>
              )}
              <p style={{ margin: 0, whiteSpace: 'pre-line' }}>{msg.text}</p>

              {msg.disclaimer && (
                <p style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: '0.5rem', fontStyle: 'italic', margin: 0 }}>
                  {msg.disclaimer}
                </p>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ alignSelf: 'flex-start', padding: '0.5rem 0.75rem', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
            Thinking based on MATLAB screening context...
          </div>
        )}
      </div>

      {/* Input Box */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        style={{ display: 'flex', gap: '0.5rem' }}
      >
        <input
          type="text"
          placeholder="Ask a question about this screening result..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          style={{
            flex: 1,
            padding: '0.5rem 0.875rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)',
            backgroundColor: 'var(--bg-card)',
            color: 'var(--text-primary)',
            fontSize: '0.875rem',
            outline: 'none',
          }}
        />
        <Button type="submit" variant="primary" icon={Send} disabled={loading || !input.trim()}>
          Ask
        </Button>
      </form>
    </Card>
  );
};
