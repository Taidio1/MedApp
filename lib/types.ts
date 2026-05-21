// Typy współdzielone przez frontend i logikę aplikacji

/** Punkt anotacji w przestrzeni 3D */
export interface Annotation {
  id: string
  label: string
  nameLAT?: string
  description?: string
  /** Pozycja XYZ w przestrzeni Three.js */
  position: [number, number, number]
  structureId: string
}

/** Warstwa 3D wewnątrz modelu GLB — jeden mesh */
export interface AnatomyLayer {
  /** Nazwa meshu w pliku GLB (musi pasować dokładnie) */
  id: string
  /** Etykieta wyświetlana w LayerPanel */
  label: string
  /** Czy warstwa widoczna domyślnie */
  defaultVisible: boolean
  /** true = element pary (np. dwie połówki czaszki) */
  isPair?: boolean
  /** Oś wzdłuż której połówki się rozsuwają przy Split */
  splitAxis?: 'x' | 'y' | 'z'
  /** Dystans rozsunięcia połówki od centrum */
  splitDistance?: number
  /** Kierunek rozsunięcia: 1 = dodatni, -1 = ujemny */
  splitDirection?: 1 | -1
  /** Kierunek eksplozji (wektor znormalizowany * skala) */
  explodeOffset?: [number, number, number]
  /** Pozycja bazowa meshu (override jeśli model nie jest wycentrowany) */
  basePosition?: [number, number, number]
}

/** Struktura anatomiczna z metadanymi */
export interface AnatomicalStructure {
  id: string
  namePL: string   // polska nazwa
  nameLAT: string  // łacińska nazwa (nomenklatura anatomiczna)
  system: string   // układ anatomiczny
  description: string
  biologicalNotes: string
  annotations: Annotation[]
  /** Warstwy 3D (tylko dla modeli multi-mesh) */
  layers?: AnatomyLayer[]
}

/** Wiadomość w chacie AI */
export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

/** Żądanie do endpointu /ask */
export interface AskRequest {
  structure: string
  question: string
}

/** Odpowiedź z endpointu /ask */
export interface AskResponse {
  answer: string
  source: string
}

/** Węzeł drzewa nawigacji anatomicznej */
export interface AnatomyNode {
  id: string
  label: string
  icon?: string
  children?: AnatomyNode[]
  /** ID struktury z obiektu structures (jeśli węzeł jest liściem) */
  structureId?: string
}
