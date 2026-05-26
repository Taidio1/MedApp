import { requireAdmin } from '@/lib/auth/guards'
import { AdminQuizPanel } from '@/components/Admin/AdminQuizPanel'

export default async function AdminQuizPage() {
  await requireAdmin()
  return <AdminQuizPanel />
}
