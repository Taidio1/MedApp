import { requireAdmin } from '@/lib/auth/guards'
import { AdminNaukaPanel } from '@/components/Admin/AdminNaukaPanel'

export default async function AdminNaukaPage() {
  await requireAdmin()
  return <AdminNaukaPanel />
}
