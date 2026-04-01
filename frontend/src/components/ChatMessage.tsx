import React, { useState } from 'react'
import type { ChatMessage as ChatMessageType, ToolCall } from '../hooks/useAgUI'

interface Props {
  message: ChatMessageType
}

function ToolCallBadge({ toolCall }: { toolCall: ToolCall }) {
  const [expanded, setExpanded] = useState(false)
  const isComplete = toolCall.status === 'complete'
  const hasResult = !!toolCall.result

  let parsedArgs: Record<string, unknown> = {}
  try {
    parsedArgs = JSON.parse(toolCall.args || '{}')
  } catch { /* empty */ }

  let parsedResult: unknown = null
  if (hasResult) {
    try {
      parsedResult = JSON.parse(toolCall.result!)
    } catch {
      parsedResult = toolCall.result
    }
  }

  return (
    <div style={{
      background: 'rgba(108, 92, 231, 0.1)',
      border: '1px solid rgba(108, 92, 231, 0.3)',
      borderRadius: '8px',
      padding: '10px 14px',
      marginTop: '8px',
      fontSize: '13px',
    }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: expanded ? '6px' : 0,
          cursor: 'pointer',
          userSelect: 'none',
        }}
        onClick={() => setExpanded(!expanded)}
      >
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '20px',
          height: '20px',
          borderRadius: '50%',
          background: hasResult
            ? 'rgba(0, 206, 201, 0.2)'
            : isComplete
              ? 'rgba(253, 203, 110, 0.2)'
              : 'rgba(253, 203, 110, 0.2)',
          fontSize: '11px',
        }}>
          {hasResult ? '✓' : isComplete ? '⟳' : '⟳'}
        </span>
        <span style={{
          fontWeight: 600,
          color: 'var(--accent-light)',
          fontFamily: 'monospace',
        }}>
          {toolCall.name}
        </span>
        <span style={{
          fontSize: '11px',
          color: hasResult ? 'var(--success)' : isComplete ? 'var(--warning)' : 'var(--warning)',
          marginLeft: 'auto',
        }}>
          {hasResult ? 'done' : isComplete ? 'executing...' : 'calling...'}
        </span>
        <span style={{
          fontSize: '10px',
          color: 'var(--text-muted)',
          transition: 'transform 0.2s',
          transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
        }}>
          ▼
        </span>
      </div>

      {expanded && (
        <>
          {Object.keys(parsedArgs).length > 0 && (
            <div style={{ marginBottom: hasResult ? '6px' : 0 }}>
              <div style={{
                fontSize: '10px',
                color: 'var(--text-muted)',
                marginBottom: '4px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}>
                Arguments
              </div>
              <div style={{
                background: 'rgba(0,0,0,0.2)',
                borderRadius: '6px',
                padding: '8px 10px',
                fontFamily: 'monospace',
                fontSize: '12px',
                color: 'var(--text-secondary)',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all',
              }}>
                {JSON.stringify(parsedArgs, null, 2)}
              </div>
            </div>
          )}

          {parsedResult && (
            <div>
              <div style={{
                fontSize: '10px',
                color: 'var(--text-muted)',
                marginBottom: '4px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}>
                Result
              </div>
              <div style={{
                background: 'rgba(0, 206, 201, 0.05)',
                border: '1px solid rgba(0, 206, 201, 0.2)',
                borderRadius: '6px',
                padding: '8px 10px',
                fontFamily: 'monospace',
                fontSize: '12px',
                color: 'var(--success)',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all',
              }}>
                {typeof parsedResult === 'string'
                  ? parsedResult
                  : JSON.stringify(parsedResult, null, 2)}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default function ChatMessage({ message }: Props) {
  const isUser = message.role === 'user'

  if (message.role === 'tool') return null

  return (
    <div style={{
      display: 'flex',
      justifyContent: isUser ? 'flex-end' : 'flex-start',
      padding: '4px 0',
      animation: 'fadeIn 0.3s ease',
    }}>
      <div style={{
        maxWidth: '80%',
        minWidth: '60px',
      }}>
        {!isUser && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '6px',
          }}>
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--accent), var(--accent-light))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '14px',
              fontWeight: 700,
              color: '#fff',
              flexShrink: 0,
            }}>
              A
            </div>
            <span style={{
              fontSize: '12px',
              color: 'var(--text-muted)',
              fontWeight: 500,
            }}>
              AI Assistant
            </span>
          </div>
        )}

        <div style={{
          background: isUser
            ? 'linear-gradient(135deg, var(--accent), #7c6cf0)'
            : 'var(--bg-card)',
          border: isUser ? 'none' : '1px solid var(--border)',
          borderRadius: isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
          padding: '12px 16px',
          lineHeight: 1.6,
          fontSize: '14px',
          color: isUser ? '#fff' : 'var(--text-primary)',
          boxShadow: isUser ? '0 2px 12px rgba(108, 92, 231, 0.3)' : 'none',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}>
          {message.content || (message.toolCalls?.length ? '' : '...')}

          {message.toolCalls?.map(tc => (
            <ToolCallBadge key={tc.id} toolCall={tc} />
          ))}
        </div>

        <div style={{
          fontSize: '11px',
          color: 'var(--text-muted)',
          marginTop: '4px',
          textAlign: isUser ? 'right' : 'left',
          paddingLeft: isUser ? 0 : '36px',
        }}>
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </div>
  )
}
