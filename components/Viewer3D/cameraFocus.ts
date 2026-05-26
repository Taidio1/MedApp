import { Annotation } from '@/lib/types'

export interface AnnotationFocusView {
  position: [number, number, number]
  target: [number, number, number]
}

const WIDE_CAMERA_DISTANCE = 5
const NARROW_CAMERA_DISTANCE = 7.2
const DEFAULT_CAMERA_Y = 1.2

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

export function getAnnotationFocusView(
  annotationPosition: Annotation['position'],
  aspect: number,
): AnnotationFocusView {
  const [x, y, z] = annotationPosition
  const horizontalLength = Math.hypot(x, z)

  if (horizontalLength < 0.001) {
    return {
      position:
        aspect < 0.8
          ? [0, DEFAULT_CAMERA_Y, NARROW_CAMERA_DISTANCE]
          : [0, DEFAULT_CAMERA_Y, WIDE_CAMERA_DISTANCE],
      target: [0, y * 0.6, 0],
    }
  }

  const distance = aspect < 0.8 ? NARROW_CAMERA_DISTANCE : WIDE_CAMERA_DISTANCE
  const directionX = x / horizontalLength
  const directionZ = z / horizontalLength
  const cameraY = clamp(DEFAULT_CAMERA_Y - Math.abs(y) * 0.2, 0.6, 1.6)

  return {
    position: [directionX * distance, cameraY, directionZ * distance],
    target: [x * 0.6, y * 0.6, z * 0.6],
  }
}
