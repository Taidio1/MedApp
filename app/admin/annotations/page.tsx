import { requireAdmin } from '@/lib/auth/guards'
import { AdminAnnotationEditor } from '@/components/AdminAnnotationEditor/AdminAnnotationEditor'

export default async function AdminAnnotationsPage() {
  await requireAdmin()
  return <AdminAnnotationEditor />
}
