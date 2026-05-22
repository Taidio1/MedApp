import { create } from 'zustand'
import { AnatomicalStructure, Annotation, ChatMessage } from './types'

interface AppState {
  selectedStructure: AnatomicalStructure | null
  setSelectedStructure: (structure: AnatomicalStructure | null) => void

  chatMessages: ChatMessage[]
  addChatMessage: (message: ChatMessage) => void
  clearChatMessages: () => void

  isAILoading: boolean
  setIsAILoading: (loading: boolean) => void

  cameraResetTrigger: number
  triggerCameraReset: () => void

  autoRotate: boolean
  setAutoRotate: (rotate: boolean) => void

  activeAnnotation: Annotation | null
  setActiveAnnotation: (annotation: Annotation | null) => void

  layerVisibility: Record<string, boolean>
  setLayerVisibility: (meshId: string, visible: boolean) => void
  resetLayerVisibility: () => void

  explodeAmount: number
  setExplodeAmount: (amount: number) => void

  clippingPlaneY: number | null
  setClippingPlaneY: (y: number | null) => void

  splitOpen: boolean
  setSplitOpen: (open: boolean) => void

  structures: Record<string, AnatomicalStructure>
  structuresLoading: boolean
  loadStructures: () => Promise<void>
}

export const useAppStore = create<AppState>((set) => ({
  selectedStructure: null,
  setSelectedStructure: (structure) =>
    set({
      selectedStructure: structure,
      chatMessages: [],
      activeAnnotation: null,
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

  activeAnnotation: null,
  setActiveAnnotation: (annotation) => set({ activeAnnotation: annotation }),

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

  structures: {},
  structuresLoading: false,
  loadStructures: async () => {
    set({ structuresLoading: true })
    try {
      const response = await fetch('/api/structures')
      if (!response.ok) throw new Error('Nie udało się pobrać struktur')
      const data: Record<string, AnatomicalStructure> = await response.json()
      set({ structures: data, structuresLoading: false })
    } catch {
      set({ structuresLoading: false })
    }
  },
}))
