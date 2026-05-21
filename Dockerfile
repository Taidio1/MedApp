# Wieloetapowy build Next.js dla minimalnego rozmiaru obrazu
FROM node:20-alpine AS base

# Etap 1: Instalacja zależności
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

# Etap 2: Build aplikacji
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Etap 3: Obraz produkcyjny
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

# Użytkownik bez uprawnień root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Kopiuj pliki produkcyjne z buildera
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
