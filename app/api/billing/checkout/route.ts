import { getCurrentUserProfile } from '@/lib/auth/guards'
import { canAccessPremiumContent } from '@/lib/premiumAccess'
import { getRequestPublicOrigin } from '@/lib/site-url'
import { getStripeClient, getStripePremiumPriceId } from '@/lib/stripe/server'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  const profile = await getCurrentUserProfile()

  if (!profile) {
    return Response.json({ error: 'Zaloguj się, aby kupić Premium' }, { status: 401 })
  }

  if (canAccessPremiumContent({ role: profile.role, premiumUntil: profile.premiumUntil })) {
    return Response.json({ url: `${getRequestPublicOrigin(request)}/?premium=active` })
  }

  try {
    const origin = getRequestPublicOrigin(request)
    const stripe = getStripeClient()
    const priceId = getStripePremiumPriceId()

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      client_reference_id: profile.id,
      customer_email: profile.email || undefined,
      metadata: {
        supabaseUserId: profile.id,
        product: 'medapp-premium',
      },
      subscription_data: {
        metadata: {
          supabaseUserId: profile.id,
          product: 'medapp-premium',
        },
      },
      success_url: `${origin}/?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/?checkout=cancelled`,
      allow_promotion_codes: true,
    })

    if (!session.url) {
      return Response.json({ error: 'Stripe nie zwrócił adresu Checkout' }, { status: 502 })
    }

    return Response.json({ url: session.url })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Nie udało się utworzyć płatności'
    return Response.json({ error: message }, { status: 500 })
  }
}
