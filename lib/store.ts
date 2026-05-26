import { create } from 'zustand'
import {
  AnatomicalStructure,
  Annotation,
  AnnotationPointLayer,
  ChatMessage,
} from './types'
import {
  LearningTabId,
  QuizQuestion,
  QuizScore,
  defaultAnnotationPointLayers,
  toggleAnnotationPointLayer,
} from './learning'
import { normalizeStructuresPayload } from './structureNormalization'

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
  activeAnnotationFocusRequest: number
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

  activeLearningTab: LearningTabId
  setActiveLearningTab: (tab: LearningTabId) => void

  activeAnnotationPointLayers: AnnotationPointLayer[]
  setActiveAnnotationPointLayers: (layers: AnnotationPointLayer[]) => void
  toggleAnnotationPointLayer: (layer: AnnotationPointLayer) => void
  enableAllAnnotationPointLayers: () => void

  studyIndex: number
  setStudyIndex: (index: number) => void
  rememberedAnnotationIds: string[]
  toggleRememberedAnnotation: (annotationId: string) => void

  quizQuestion: QuizQuestion | null
  setQuizQuestion: (question: QuizQuestion | null) => void
  selectedQuizAnswerId: string | null
  setSelectedQuizAnswerId: (annotationId: string | null) => void
  quizScore: QuizScore
  setQuizScore: (score: QuizScore) => void
  resetQuiz: () => void

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
      activeAnnotationFocusRequest: 0,
      layerVisibility: {},
      explodeAmount: 0,
      clippingPlaneY: null,
      splitOpen: false,
      studyIndex: 0,
      quizQuestion: null,
      selectedQuizAnswerId: null,
      quizScore: { answered: 0, correct: 0, streak: 0 },
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
  activeAnnotationFocusRequest: 0,
  setActiveAnnotation: (annotation) =>
    set((state) => ({
      activeAnnotation: annotation,
      activeAnnotationFocusRequest: annotation
        ? state.activeAnnotationFocusRequest + 1
        : state.activeAnnotationFocusRequest,
    })),

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

  activeLearningTab: 'points',
  setActiveLearningTab: (tab) => set({ activeLearningTab: tab }),

  activeAnnotationPointLayers: defaultAnnotationPointLayers,
  setActiveAnnotationPointLayers: (layers) =>
    set({ activeAnnotationPointLayers: layers }),
  toggleAnnotationPointLayer: (layer) =>
    set((state) => ({
      activeAnnotationPointLayers: toggleAnnotationPointLayer(
        state.activeAnnotationPointLayers,
        layer,
      ),
      studyIndex: 0,
      quizQuestion: null,
      selectedQuizAnswerId: null,
    })),
  enableAllAnnotationPointLayers: () =>
    set({
      activeAnnotationPointLayers: defaultAnnotationPointLayers,
      studyIndex: 0,
      quizQuestion: null,
      selectedQuizAnswerId: null,
    }),

  studyIndex: 0,
  setStudyIndex: (index) => set({ studyIndex: index }),
  rememberedAnnotationIds: [],
  toggleRememberedAnnotation: (annotationId) =>
    set((state) => ({
      rememberedAnnotationIds: state.rememberedAnnotationIds.includes(annotationId)
        ? state.rememberedAnnotationIds.filter((id) => id !== annotationId)
        : [...state.rememberedAnnotationIds, annotationId],
    })),

  quizQuestion: null,
  setQuizQuestion: (question) => set({ quizQuestion: question }),
  selectedQuizAnswerId: null,
  setSelectedQuizAnswerId: (annotationId) =>
    set({ selectedQuizAnswerId: annotationId }),
  quizScore: { answered: 0, correct: 0, streak: 0 },
  setQuizScore: (score) => set({ quizScore: score }),
  resetQuiz: () =>
    set({
      quizQuestion: null,
      selectedQuizAnswerId: null,
      quizScore: { answered: 0, correct: 0, streak: 0 },
    }),

  structures: {},
  structuresLoading: false,
  loadStructures: async () => {
    set({ structuresLoading: true })
    try {
      const response = await fetch('/api/structures')
      if (!response.ok) throw new Error('Nie udało się pobrać struktur')
      const data: unknown = await response.json()
      set({
        structures: normalizeStructuresPayload(data),
        structuresLoading: false,
      })
    } catch {
      set({ structuresLoading: false })
    }
  },
}))
