import {
  Annotation,
  AnnotationPointLayer,
  annotationPointLayers,
} from './types'

export type LearningTabId = 'points' | 'study' | 'quiz'

export const learningTabs: { id: LearningTabId; label: string }[] = [
  { id: 'points', label: 'Punkty' },
  { id: 'study', label: 'Nauka' },
  { id: 'quiz', label: 'Quiz' },
]

export const annotationPointLayerLabels: Record<AnnotationPointLayer, string> = {
  organ: 'Narząd',
  vessels: 'Naczynia',
  nerves: 'Nerwy',
  clinical: 'Kliniczne',
  topography: 'Topografia',
}

export const defaultAnnotationPointLayers: AnnotationPointLayer[] = [
  ...annotationPointLayers,
]

export interface QuizQuestion {
  id: string
  prompt: string
  target: Annotation
  options: Annotation[]
}

export interface QuizScore {
  answered: number
  correct: number
  streak: number
}

export function getAnnotationLayerIds(
  annotation: Pick<Annotation, 'layerIds'>,
): AnnotationPointLayer[] {
  if (!annotation.layerIds || annotation.layerIds.length === 0) {
    return ['organ']
  }

  return annotation.layerIds
}

export function annotationMatchesLayers(
  annotation: Annotation,
  activeLayers: AnnotationPointLayer[],
): boolean {
  if (activeLayers.length === 0) return false

  const annotationLayers = getAnnotationLayerIds(annotation)
  return annotationLayers.some((layerId) => activeLayers.includes(layerId))
}

export function filterAnnotationsByLayers(
  annotations: Annotation[],
  activeLayers: AnnotationPointLayer[],
): Annotation[] {
  return annotations.filter(
    (annotation) =>
      annotation.visible !== false &&
      annotationMatchesLayers(annotation, activeLayers),
  )
}

export function toggleAnnotationPointLayer(
  layers: AnnotationPointLayer[],
  layerId: AnnotationPointLayer,
): AnnotationPointLayer[] {
  if (layers.includes(layerId)) {
    return layers.filter((current) => current !== layerId)
  }

  return [...layers, layerId]
}

export function buildQuizOptions(
  target: Annotation,
  localAnnotations: Annotation[],
  fallbackAnnotations: Annotation[],
  optionCount = 4,
): Annotation[] {
  const candidates = [...localAnnotations, ...fallbackAnnotations]
    .filter((annotation) => annotation.id !== target.id)
    .filter((annotation) => annotation.label !== target.label)
    .filter((annotation) => annotation.visible !== false)

  const uniqueCandidates = candidates.filter(
    (annotation, index, all) =>
      all.findIndex((item) => item.label === annotation.label) === index,
  )

  return [target, ...uniqueCandidates].slice(0, optionCount)
}

export function buildQuizQuestion(
  annotations: Annotation[],
  fallbackAnnotations: Annotation[],
  index: number,
): QuizQuestion | null {
  if (annotations.length === 0) return null

  const target = annotations[index % annotations.length]
  const options = buildQuizOptions(target, annotations, fallbackAnnotations)

  if (options.length < 2) return null

  return {
    id: `${target.id}-${index}`,
    prompt: target.quizPrompt?.trim() || 'Co to jest?',
    target,
    options,
  }
}

export function scoreQuizAnswer(
  score: QuizScore,
  isCorrect: boolean,
): QuizScore {
  return {
    answered: score.answered + 1,
    correct: score.correct + (isCorrect ? 1 : 0),
    streak: isCorrect ? score.streak + 1 : 0,
  }
}
