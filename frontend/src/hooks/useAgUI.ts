import { useState, useCallback, useRef } from 'react'

export interface ToolCall {
  id: string
  name: string
  args: string
  status: 'calling' | 'complete'
  result?: string
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system' | 'tool'
  content: string
  toolCalls?: ToolCall[]
  toolCallId?: string
  timestamp: Date
}

interface AgUIEvent {
  type: string
  threadId?: string
  runId?: string
  messageId?: string
  role?: string
  delta?: string
  message?: string
  toolCallId?: string
  toolCallName?: string
  parentMessageId?: string
  content?: string
}

export function useAgUI(endpoint: string = '/agui') {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const threadIdRef = useRef<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isStreaming) return

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMessage])
    setIsStreaming(true)
    setError(null)

    const allMessages = [...messages, userMessage]

    const abortController = new AbortController()
    abortRef.current = abortController

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
        },
        body: JSON.stringify({
          threadId: threadIdRef.current ?? crypto.randomUUID(),
          runId: crypto.randomUUID(),
          messages: serializeMessages(allMessages),
          tools: [],
          context: [],
          state: {},
          forwardedProps: {},
        }),
        signal: abortController.signal,
      })

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`)
      }

      const reader = response.body?.getReader()
      if (!reader) throw new Error('No response stream')

      const decoder = new TextDecoder()
      let buffer = ''
      let currentMessageId: string | null = null
      let currentContent = ''
      const toolCalls = new Map<string, ToolCall>()
      const toolResultMessages: ChatMessage[] = []

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const jsonStr = line.slice(6).trim()
          if (!jsonStr) continue

          try {
            const event: AgUIEvent = JSON.parse(jsonStr)

            switch (event.type) {
              case 'RUN_STARTED':
                if (event.threadId) threadIdRef.current = event.threadId
                break

              case 'TEXT_MESSAGE_START':
                currentMessageId = event.messageId ?? crypto.randomUUID()
                currentContent = ''
                toolCalls.clear()
                toolResultMessages.length = 0
                setMessages(prev => [...prev, {
                  id: currentMessageId!,
                  role: 'assistant',
                  content: '',
                  toolCalls: [],
                  timestamp: new Date(),
                }])
                break

              case 'TEXT_MESSAGE_CONTENT':
                if (event.delta) {
                  currentContent += event.delta
                  const captured = currentContent
                  setMessages(prev =>
                    prev.map(m =>
                      m.id === currentMessageId ? { ...m, content: captured } : m
                    )
                  )
                }
                break

              case 'TEXT_MESSAGE_END':
                if (toolResultMessages.length > 0) {
                  setMessages(prev => {
                    const result = [...prev]
                    const assistantIdx = result.findIndex(m => m.id === currentMessageId)
                    if (assistantIdx >= 0) {
                      result.splice(assistantIdx + 1, 0, ...toolResultMessages)
                    }
                    return result
                  })
                }
                break

              case 'TOOL_CALL_START':
                if (event.toolCallId && event.toolCallName) {
                  toolCalls.set(event.toolCallId, {
                    id: event.toolCallId,
                    name: event.toolCallName,
                    args: '',
                    status: 'calling',
                  })
                  updateToolCalls(currentMessageId, toolCalls)
                }
                break

              case 'TOOL_CALL_ARGS':
                if (event.toolCallId && event.delta) {
                  const tc = toolCalls.get(event.toolCallId)
                  if (tc) {
                    tc.args += event.delta
                    updateToolCalls(currentMessageId, toolCalls)
                  }
                }
                break

              case 'TOOL_CALL_END':
                if (event.toolCallId) {
                  const tc = toolCalls.get(event.toolCallId)
                  if (tc) {
                    tc.status = 'complete'
                    updateToolCalls(currentMessageId, toolCalls)
                  }
                }
                break

              case 'TOOL_CALL_RESULT':
                if (event.toolCallId) {
                  const tc = toolCalls.get(event.toolCallId)
                  if (tc) {
                    tc.result = event.content ?? ''
                    updateToolCalls(currentMessageId, toolCalls)
                  }
                  toolResultMessages.push({
                    id: crypto.randomUUID(),
                    role: 'tool',
                    content: event.content ?? '',
                    toolCallId: event.toolCallId,
                    timestamp: new Date(),
                  })
                }
                break

              case 'RUN_ERROR':
                setError(event.message ?? 'Unknown error')
                break

              case 'RUN_FINISHED':
                break
            }
          } catch {
            // skip malformed JSON
          }
        }
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setError(err.message ?? 'Connection failed')
      }
    } finally {
      setIsStreaming(false)
      abortRef.current = null
    }

    function updateToolCalls(msgId: string | null, tcs: Map<string, ToolCall>) {
      if (!msgId) return
      const arr = Array.from(tcs.values())
      setMessages(prev =>
        prev.map(m => m.id === msgId ? { ...m, toolCalls: [...arr] } : m)
      )
    }
  }, [endpoint, messages, isStreaming])

  const stopStreaming = useCallback(() => {
    abortRef.current?.abort()
    setIsStreaming(false)
  }, [])

  const clearMessages = useCallback(() => {
    setMessages([])
    threadIdRef.current = null
    setError(null)
  }, [])

  return { messages, isStreaming, error, sendMessage, stopStreaming, clearMessages }
}

function serializeMessages(messages: ChatMessage[]) {
  return messages
    .filter(m => m.role !== 'tool' || m.toolCallId)
    .map(m => {
      if (m.role === 'tool') {
        return {
          id: m.id,
          role: 'tool',
          content: m.content,
          toolCallId: m.toolCallId,
        }
      }

      return {
        id: m.id,
        role: m.role,
        content: m.content,
        ...(m.toolCalls?.length ? {
          toolCalls: m.toolCalls.map(tc => ({
            id: tc.id,
            type: 'function',
            function: { name: tc.name, arguments: tc.args }
          }))
        } : {}),
      }
    })
}
