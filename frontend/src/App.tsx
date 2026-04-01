import React, { useRef, useEffect } from 'react'
import { useAgUI } from './hooks/useAgUI'
import ChatMessage from './components/ChatMessage'
import ChatInput from './components/ChatInput'

const SUGGESTIONS = [
  "What's the weather in Istanbul?",
  "Search the web for AG-UI protocol",
  "What time is it now?",
  "Calculate 42 * 17 + 99",
  "Translate 'Hello World' to Turkish",
]

export default function App() {
  const { messages, isStreaming, error, sendMessage, stopStreaming, clearMessages } = useAgUI('/agui')
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--bg-primary)',
    }}>
      {/* Header */}
      <header style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '14px 24px',
        background: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border)',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, var(--accent), var(--accent-light))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '18px',
            fontWeight: 700,
            color: '#fff',
          }}>
            A
          </div>
          <div>
            <h1 style={{
              fontSize: '16px',
              fontWeight: 700,
              letterSpacing: '-0.3px',
            }}>
              AG-UI Chat Demo
            </h1>
            <p style={{
              fontSize: '12px',
              color: 'var(--text-muted)',
            }}>
              .NET 10 Backend + AG-UI Protocol + MCP Tools
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 12px',
            background: isStreaming ? 'rgba(253, 203, 110, 0.1)' : 'rgba(0, 206, 201, 0.1)',
            border: `1px solid ${isStreaming ? 'rgba(253, 203, 110, 0.3)' : 'rgba(0, 206, 201, 0.3)'}`,
            borderRadius: '20px',
            fontSize: '12px',
            color: isStreaming ? 'var(--warning)' : 'var(--success)',
          }}>
            <span style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: isStreaming ? 'var(--warning)' : 'var(--success)',
              animation: isStreaming ? 'pulse 1s infinite' : 'none',
            }} />
            {isStreaming ? 'Streaming...' : 'Ready'}
          </div>

          {messages.length > 0 && (
            <button
              onClick={clearMessages}
              disabled={isStreaming}
              style={{
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                padding: '6px 14px',
                color: 'var(--text-secondary)',
                fontSize: '12px',
                cursor: isStreaming ? 'not-allowed' : 'pointer',
                opacity: isStreaming ? 0.5 : 1,
                transition: 'all 0.2s',
              }}
            >
              Clear Chat
            </button>
          )}
        </div>
      </header>

      {/* Messages */}
      <div
        ref={scrollRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '20px 24px',
        }}
      >
        {messages.length === 0 ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            gap: '24px',
            textAlign: 'center',
          }}>
            <div style={{
              width: '72px',
              height: '72px',
              borderRadius: '20px',
              background: 'linear-gradient(135deg, var(--accent), var(--accent-light))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '32px',
              color: '#fff',
              boxShadow: '0 8px 32px var(--accent-glow)',
            }}>
              A
            </div>
            <div>
              <h2 style={{
                fontSize: '22px',
                fontWeight: 700,
                marginBottom: '8px',
                letterSpacing: '-0.5px',
              }}>
                AG-UI + .NET 10 Demo
              </h2>
              <p style={{
                color: 'var(--text-muted)',
                fontSize: '14px',
                maxWidth: '400px',
                lineHeight: 1.6,
              }}>
                Chat with an AI assistant powered by OpenAI, served through a .NET 10 backend
                implementing the AG-UI protocol with MCP tool support.
              </p>
            </div>

            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '8px',
              justifyContent: 'center',
              maxWidth: '600px',
            }}>
              {SUGGESTIONS.map((s, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(s)}
                  style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    borderRadius: '20px',
                    padding: '8px 16px',
                    color: 'var(--text-secondary)',
                    fontSize: '13px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = 'var(--accent)'
                    e.currentTarget.style.color = 'var(--accent-light)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = 'var(--border)'
                    e.currentTarget.style.color = 'var(--text-secondary)'
                  }}
                >
                  {s}
                </button>
              ))}
            </div>

            <div style={{
              display: 'flex',
              gap: '16px',
              marginTop: '12px',
            }}>
              {[
                { label: 'get_weather', desc: 'Weather data' },
                { label: 'search_web', desc: 'Web search' },
                { label: 'calculate', desc: 'Math engine' },
                { label: 'get_current_time', desc: 'Time info' },
                { label: 'translate_text', desc: 'Translation' },
              ].map((tool, i) => (
                <div key={i} style={{
                  textAlign: 'center',
                  padding: '10px',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: '10px',
                  minWidth: '90px',
                }}>
                  <div style={{
                    fontSize: '11px',
                    fontFamily: 'monospace',
                    color: 'var(--accent-light)',
                    marginBottom: '4px',
                  }}>
                    {tool.label}
                  </div>
                  <div style={{
                    fontSize: '10px',
                    color: 'var(--text-muted)',
                  }}>
                    {tool.desc}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {messages.map(msg => (
              <ChatMessage key={msg.id} message={msg} />
            ))}

            {isStreaming && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 0',
                paddingLeft: '36px',
              }}>
                <div className="typing-indicator">
                  <span /><span /><span />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div style={{
          padding: '10px 24px',
          background: 'rgba(255, 118, 117, 0.1)',
          borderTop: '1px solid rgba(255, 118, 117, 0.3)',
          color: 'var(--error)',
          fontSize: '13px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          <span>⚠</span> {error}
        </div>
      )}

      {/* Input */}
      <ChatInput
        onSend={sendMessage}
        onStop={stopStreaming}
        isStreaming={isStreaming}
      />

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        .typing-indicator {
          display: flex;
          gap: 4px;
          align-items: center;
        }
        .typing-indicator span {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--text-muted);
          animation: bounce 1.4s infinite ease-in-out;
        }
        .typing-indicator span:nth-child(1) { animation-delay: 0s; }
        .typing-indicator span:nth-child(2) { animation-delay: 0.2s; }
        .typing-indicator span:nth-child(3) { animation-delay: 0.4s; }
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
          40% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  )
}
