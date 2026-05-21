import { create } from 'zustand'
import { AnatomicalStructure, ChatMessage } from './types'

interface AppState {
  // Aktualnie wybrana struktura anatomiczna
  selectedStructure: AnatomicalStructure | null
  setSelectedStructure: (structure: AnatomicalStructure | null) => void

  // Historia wiadomości w chacie AI (per sesja)
  chatMessages: ChatMessage[]
  addChatMessage: (message: ChatMessage) => void
  clearChatMessages: () => void

  // Stan ładowania odpowiedzi AI
  isAILoading: boolean
  setIsAILoading: (loading: boolean) => void

  // Trigger do resetowania widoku kamery (inkrementowany przez toolbar)
  cameraResetTrigger: number
  triggerCameraReset: () => void

  // Auto-rotacja modelu 3D
  autoRotate: boolean
  setAutoRotate: (rotate: boolean) => void

  // Widoczność warstw: meshId → czy widoczny
  layerVisibility: Record<string, boolean>
  setLayerVisibility: (meshId: string, visible: boolean) => void
  resetLayerVisibility: () => void

  // Stopień eksplozji 0.0–1.0
  explodeAmount: number
  setExplodeAmount: (amount: number) => void

  // Pozycja płaszczyzny tnącej Y (null = wyłączona)
  clippingPlaneY: number | null
  setClippingPlaneY: (y: number | null) => void

  // Czy połówki czaszki są rozsunięte
  splitOpen: boolean
  setSplitOpen: (open: boolean) => void
}

export const useAppStore = create<AppState>((set) => ({
  selectedStructure: null,
  setSelectedStructure: (structure) =>
    set({
      selectedStructure: structure,
      chatMessages: [],
      layerVisibility: {},
      explodeAmount: 0,
      clippingPlaneY: null,
      splitOpen: false,
    }),

  chatMessages: [],
  addChatMessage: (message) =>
    set((state) => ({ chatMessages: [...state.chatMessages, message] })),
  clearChatMessages: () => set({ chatMessages: [] }),

  isAILoading: false,
  setIsAILoading: (loading) => set({ isAILoading: loading }),

  cameraResetTrigger: 0,
  triggerCameraReset: () =>
    set((state) => ({ cameraResetTrigger: state.cameraResetTrigger + 1 })),

  autoRotate: false,
  setAutoRotate: (rotate) => set({ autoRotate: rotate }),

  layerVisibility: {},
  setLayerVisibility: (meshId, visible) =>
    set((state) => ({
      layerVisibility: { ...state.layerVisibility, [meshId]: visible },
    })),
  resetLayerVisibility: () => set({ layerVisibility: {} }),

  explodeAmount: 0,
  setExplodeAmount: (amount) => set({ explodeAmount: amount }),

  clippingPlaneY: null,
  setClippingPlaneY: (y) => set({ clippingPlaneY: y }),

  splitOpen: false,
  setSplitOpen: (open) => set({ splitOpen: open }),
}))
