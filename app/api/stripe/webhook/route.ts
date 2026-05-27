import Stripe from 'stripe'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { getStripeClient } from '@/lib/stripe/server'

export const runtime = 'nodejs'

const ACTIVE_SUBSCRIPTION_STATUSES = new Set(['active', 'trialing'])

function addFallbackMonth(): string {
  const date = new Date()
  date.setDate(date.getDate() + 35)
  return date.toISOString()
}

function getPeriodEnd(subscription: Stripe.Subscription): string {
  const periodEnd = (subscription as unknown as { current_period_end?: number })
    .current_period_end

  if (typeof periodEnd === 'number' && periodEnd > 0) {
    return new Date(periodEnd * 1000).toISOString()
  }

  return addFallbackMonth()
}

async function grantPremium(userId: string, premiumUntil: string | null) {
  const supabase = createSupabaseAdminClient()
  const { error } = await supabase
    .from('users')
    .update({
      role: 'premiumUser',
      premium_until: premiumUntil,
    })
    .eq('id', userId)
    .neq('role', 'admin')

  if (error) throw new Error(error.message)
}

async function revokePremium(userId: string) {
  const supabase = createSupabaseAdminClient()
  const { error } = await supabase
    .from('users')
    .update({
      role: 'user',
      premium_until: new Date().toISOString(),
    })
    .eq('id', userId)
    .neq('role', 'admin')

  if (error) throw new Error(error.message)
}

async function grantFromCheckoutSession(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.supabaseUserId ?? session.client_reference_id
  if (!userId) return

  const stripe = getStripeClient()
  const subscriptionId =
    typeof session.subscription === 'string' ? session.subscription : session.subscription?.id

  if (subscriptionId) {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId)
    await grantPremium(userId, getPeriodEnd(subscription))
    return
  }

  await grantPremium(userId, addFallbackMonth())
}

async function syncSubscription(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.supabaseUserId
  if (!userId) return

  if (ACTIVE_SUBSCRIPTION_STATUSES.has(subscription.status)) {
    await grantPremium(userId, getPeriodEnd(subscription))
    return
  }

  if (subscription.status === 'canceled' || subscription.status === 'unpaid') {
    await revokePremium(userId)
  }
}

export async function POST(request: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    return Response.json({ error: 'Brakuje STRIPE_WEBHOOK_SECRET' }, { status: 500 })
  }

  const signature = request.headers.get('stripe-signature')
  if (!signature) {
    return Response.json({ error: 'Brakuje podpisu Stripe' }, { status: 400 })
  }

  const payload = await request.text()
  const stripe = getStripeClient()

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Nieprawidlowy webhook'
    return Response.json({ error: message }, { status: 400 })
  }

  try {
    if (
      event.type === 'checkout.session.completed' ||
      event.type === 'checkout.session.async_payment_succeeded'
    ) {
      await grantFromCheckoutSession(event.data.object as Stripe.Checkout.Session)
    }

    if (
      event.type === 'customer.subscription.created' ||
      event.type === 'customer.subscription.updated' ||
      event.type === 'customer.subscription.deleted'
    ) {
      await syncSubscription(event.data.object as Stripe.Subscription)
    }

    return Response.json({ received: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Nie udalo sie obsluzyc webhooka'
    return Response.json({ error: message }, { status: 500 })
  }
}
