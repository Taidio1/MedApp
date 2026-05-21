import { NextRequest, NextResponse } from 'next/server'
import { AskRequest, AskResponse } from '@/lib/types'

export async function POST(request: NextRequest) {
  let body: AskRequest

  // Parsowanie body żądania
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: 'Nieprawidłowy format JSON' },
      { status: 400 }
    )
  }

  // Walidacja wymaganych pól
  if (!body.structure || !body.question) {
    return NextResponse.json(
      { error: 'Brakujące pola: structure, question' },
      { status: 400 }
    )
  }

  // URL backendu z zmiennej środowiskowej
  const apiUrl =
    process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

  try {
    const backendResponse = await fetch(`${apiUrl}/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      // Timeout 30s — Claude może odpowiadać chwilę
      signal: AbortSignal.timeout(30_000),
    })

    if (!backendResponse.ok) {
      const errorText = await backendResponse.text()
      return NextResponse.json(
        {
          error: `Backend zwrócił błąd: ${backendResponse.status}`,
          detail: errorText,
        },
        { status: backendResponse.status }
      )
    }

    const data: AskResponse = await backendResponse.json()
    return NextResponse.json(data)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Nieznany błąd'

    // Loguj szczegóły błędu, użytkownik widzi przyjazny komunikat
    console.error('[API /ask] Błąd połączenia z backendem:', message)

    return NextResponse.json(
      {
        error: 'Nie udało się połączyć z backendem',
        detail: message,
      },
      { status: 503 }
    )
  }
}
