import 'server-only'

import Stripe from 'stripe'

let stripe: Stripe | null = null

export function getStripeClient(): Stripe {
  const secretKey = process.env.STRIPE_SECRET_KEY
  if (!secretKey) throw new Error('Brakuje STRIPE_SECRET_KEY')

  stripe ??= new Stripe(secretKey)
  return stripe
}

export function getStripePremiumPriceId(): string {
  const priceId = process.env.STRIPE_PREMIUM_PRICE_ID
  if (!priceId) throw new Error('Brakuje STRIPE_PREMIUM_PRICE_ID')
  return priceId
}
