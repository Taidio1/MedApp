'use client'

import { useState, useRef, useEffect } from 'react'
import { useAppStore } from '@/lib/store'
import { AskRequest, AskResponse, ChatMessage } from '@/lib/types'

// Sekcja z etykietą i zawartością
function InfoSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '16px' }}>
      <h3
        style={{
          fontSize: '10px',
          fontWeight: 600,
          color: '#9ca3af',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          marginBottom: '6px',
        }}
      >
        {label}
      </h3>
      {children}
    </div>
  )
}

// Pojedyncza wiadomość w chacie
function ChatBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user'
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: isUser ? 'flex-end' : 'flex-start',
        marginBottom: '8px',
      }}
    >
      <div
        style={{
          maxWidth: '85%',
          padding: '8px 12px',
          borderRadius: isUser ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
          fontSize: '12px',
          lineHeight: '1.5',
          background: isUser ? '#7c3aed' : 'white',
          color: isUser ? 'white' : '#374151',
          border: isUser ? 'none' : '1px solid #e5e7eb',
          boxShadow: isUser ? 'none' : '0 1px 3px rgba(0,0,0,0.05)',
        }}
      >
        {message.content}
        {message.role === 'assistant' && (
          <div
            style={{
              fontSize: '9px',
              color: '#9ca3af',
              marginTop: '4px',
              textAlign: 'right',
            }}
          >
            AI ·{' '}
            {message.timestamp.toLocaleTimeString('pl-PL', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export function PanelRight() {
  const {
    selectedStructure,
    chatMessages,
    addChatMessage,
    isAILoading,
    setIsAILoading,
  } = useAppStore()

  const [inputValue, setInputValue] = useState('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll do ostatniej wiadomości
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  // Wysyłanie pytania do AI
  const handleAsk = async () => {
    if (!inputValue.trim() || !selectedStructure || isAILoading) return

    const userQuestion = inputValue.trim()
    setInputValue('')
    setErrorMessage(null)

    // Dodaj wiadomość użytkownika
    addChatMessage({
      role: 'user',
      content: userQuestion,
      timestamp: new Date(),
    })

    setIsAILoading(true)

    try {
      const body: AskRequest = {
        structure: selectedStructure.id,
        question: userQuestion,
      }

      const response = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        throw new Error(`Błąd serwera: ${response.status}`)
      }

      const data: AskResponse = await response.json()

      // Dodaj odpowiedź AI
      addChatMessage({
        role: 'assistant',
        content: `${data.answer}\n\nŹródło: ${data.source}`,
        timestamp: new Date(),
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Nieznany błąd'
      setErrorMessage(`Nie udało się połączyć z AI: ${message}`)
    } finally {
      setIsAILoading(false)
    }
  }

  // Obsługa Enter w polu input
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleAsk()
    }
  }

  return (
    <aside
      style={{
        width: '320px',
        flexShrink: 0,
        background: '#f5f0e8',
        borderLeft: '1px solid #e5e7eb',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {selectedStructure ? (
        <>
          {/* Nagłówek struktury */}
          <div
            style={{
              padding: '20px 20px 16px',
              borderBottom: '1px solid #e5e7eb',
              flexShrink: 0,
              background: 'rgba(255,255,255,0.5)',
            }}
          >
            <h1
              style={{
                fontSize: '18px',
                fontWeight: 700,
                color: '#111827',
                lineHeight: 1.3,
                margin: 0,
              }}
            >
              {selectedStructure.namePL}
            </h1>
            <p
              style={{
                fontSize: '12px',
                color: '#7c3aed',
                fontWeight: 500,
                marginTop: '2px',
                fontStyle: 'italic',
              }}
            >
              {selectedStructure.nameLAT}
            </p>
            <div style={{ marginTop: '8px' }}>
              <span
                style={{
                  fontSize: '10px',
                  background: 'rgba(124,58,237,0.1)',
                  color: '#7c3aed',
                  padding: '2px 8px',
                  borderRadius: '999px',
                }}
              >
                {selectedStructure.system}
              </span>
            </div>
          </div>

          {/* Szczegóły struktury — przewijana sekcja */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '16px 20px',
            }}
          >
            <InfoSection label="Opis">
              <p
                style={{
                  fontSize: '12px',
                  color: '#4b5563',
                  lineHeight: 1.6,
                  margin: 0,
                }}
              >
                {selectedStructure.description}
              </p>
            </InfoSection>

            <InfoSection label="Notatki biologiczne">
              <div
                style={{
                  fontSize: '12px',
                  color: '#4b5563',
                  lineHeight: 1.6,
                  background: 'white',
                  borderRadius: '8px',
                  padding: '12px',
                  border: '1px solid #e5e7eb',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                }}
              >
                {selectedStructure.biologicalNotes}
              </div>
            </InfoSection>

            <InfoSection label="Kontekst w bazie wiedzy">
              <div
                style={{
                  fontSize: '12px',
                  color: '#9ca3af',
                  fontStyle: 'italic',
                  background: 'rgba(255,255,255,0.5)',
                  borderRadius: '6px',
                  padding: '8px',
                  border: '1px dashed #d1d5db',
                }}
              >
                Uzupełniane po załadowaniu bazy Bochenka (RAG)
              </div>
            </InfoSection>

            {/* Sekcja chat AI */}
            <InfoSection label="Zapytaj AI">
              <div
                style={{
                  background: 'white',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb',
                  overflow: 'hidden',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                }}
              >
                {/* Historia czatu */}
                {chatMessages.length > 0 && (
                  <div
                    style={{
                      padding: '12px',
                      maxHeight: '200px',
                      overflowY: 'auto',
                      borderBottom: '1px solid #f3f4f6',
                    }}
                  >
                    {chatMessages.map((msg, idx) => (
                      <ChatBubble key={idx} message={msg} />
                    ))}
                    {isAILoading && (
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'flex-start',
                          marginBottom: '8px',
                        }}
                      >
                        <div
                          style={{
                            background: '#f3f4f6',
                            borderRadius: '8px',
                            padding: '8px 12px',
                            fontSize: '12px',
                            color: '#9ca3af',
                          }}
                        >
                          AI myśli...
                        </div>
                      </div>
                    )}
                    <div ref={chatEndRef} />
                  </div>
                )}

                {/* Błąd połączenia */}
                {errorMessage && (
                  <div
                    style={{
                      padding: '8px 12px',
                      fontSize: '11px',
                      color: '#ef4444',
                      background: '#fef2f2',
                      borderBottom: '1px solid #fee2e2',
                    }}
                  >
                    {errorMessage}
                  </div>
                )}

                {/* Input + przycisk */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 12px',
                  }}
                >
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Zadaj pytanie o strukturę..."
                    disabled={isAILoading}
                    style={{
                      flex: 1,
                      fontSize: '12px',
                      background: '#f9fafb',
                      border: '1px solid #e5e7eb',
                      borderRadius: '6px',
                      padding: '6px 10px',
                      outline: 'none',
                      opacity: isAILoading ? 0.5 : 1,
                    }}
                  />
                  <button
                    onClick={handleAsk}
                    disabled={!inputValue.trim() || isAILoading}
                    style={{
                      padding: '6px 12px',
                      fontSize: '12px',
                      background: '#7c3aed',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: !inputValue.trim() || isAILoading ? 'not-allowed' : 'pointer',
                      opacity: !inputValue.trim() || isAILoading ? 0.4 : 1,
                      flexShrink: 0,
                      transition: 'opacity 0.15s',
                    }}
                  >
                    {isAILoading ? '...' : 'Zapytaj'}
                  </button>
                </div>
              </div>
            </InfoSection>
          </div>
        </>
      ) : (
        /* Stan gdy brak wybranej struktury */
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: 'rgba(124,58,237,0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
              marginBottom: '16px',
            }}
          >
            🧠
          </div>
          <h2
            style={{
              fontSize: '14px',
              fontWeight: 600,
              color: '#4b5563',
              marginBottom: '4px',
            }}
          >
            Wybierz strukturę
          </h2>
          <p style={{ fontSize: '12px', color: '#9ca3af', lineHeight: 1.5 }}>
            Wybierz strukturę z panelu lewego lub kliknij punkt anotacji na modelu 3D.
          </p>
        </div>
      )}
    </aside>
  )
}
