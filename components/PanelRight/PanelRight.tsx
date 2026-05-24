'use client'

import { useState, useRef, useEffect } from 'react'
import { useAppStore } from '@/lib/store'
import { AskRequest, AskResponse, ChatMessage } from '@/lib/types'

// Sekcja z etykietą i zawartością
function InfoSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section className="grid gap-3">
      <h3 className="section-label">{label}</h3>
      {children}
    </section>
  )
}

// Pojedyncza wiadomość w chacie
function ChatBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user'
  return (
    <div className={isUser ? 'chat-bubble is-user' : 'chat-bubble'}>
      <div className="chat-bubble-content">
        {message.content}
        {message.role === 'assistant' && (
          <div className="mt-1 text-right text-[0.62rem] text-[#8a8175]">
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
    <aside className="right-rail">
      {selectedStructure ? (
        <section className="details-panel">
          <div className="panel-heading">
            <span>Szczegóły struktury</span>
            <span aria-hidden="true">♥</span>
          </div>

          <div className="detail-hero">
            <span className="structure-orb" aria-hidden="true" />
            <div>
              <h3>{selectedStructure.namePL}</h3>
              <p>{selectedStructure.nameLAT}</p>
            </div>
          </div>

          <dl className="attribute-list">
            <div>
              <dt>Układ</dt>
              <dd>{selectedStructure.system}</dd>
            </div>
            <div>
              <dt>Punkty</dt>
              <dd>{selectedStructure.annotations.length}</dd>
            </div>
          </dl>

          <InfoSection label="Opis">
            <div className="notes-card">
              <p>{selectedStructure.description}</p>
            </div>
          </InfoSection>

          <InfoSection label="Notatki biologiczne">
            <div className="notes-card">
              <p>{selectedStructure.biologicalNotes}</p>
            </div>
          </InfoSection>

          <InfoSection label="Zapytaj AI">
            <div className="chat-card">
              {chatMessages.length > 0 && (
                <div className="chat-history">
                  {chatMessages.map((msg, idx) => (
                    <ChatBubble key={idx} message={msg} />
                  ))}
                  {isAILoading && (
                    <div className="chat-bubble">
                      <div className="chat-bubble-content">
                        AI myśli...
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>
              )}

              {errorMessage && (
                <div className="border-b border-red-100 bg-red-50 px-3 py-2 text-[0.72rem] text-red-700">
                  {errorMessage}
                </div>
              )}

              <div className="chat-input-row">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Zadaj pytanie o strukturę..."
                  disabled={isAILoading}
                />
                <button
                  onClick={handleAsk}
                  disabled={!inputValue.trim() || isAILoading}
                >
                  {isAILoading ? '...' : 'Zapytaj'}
                </button>
              </div>
            </div>
          </InfoSection>
        </section>
      ) : (
        <section className="details-panel empty-state">
          <span className="structure-orb" aria-hidden="true" />
          <h2>Wybierz strukturę</h2>
          <p>
            Wybierz strukturę z panelu lewego lub kliknij punkt anotacji na modelu 3D.
          </p>
        </section>
      )}
    </aside>
  )
}
