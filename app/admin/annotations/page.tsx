import { notFound } from 'next/navigation'
import { AdminAnnotationEditor } from '@/components/AdminAnnotationEditor/AdminAnnotationEditor'

export default function AdminAnnotationsPage() {
  if (process.env.NODE_ENV !== 'development') {
    notFound()
  }

  return <AdminAnnotationEditor />
}
