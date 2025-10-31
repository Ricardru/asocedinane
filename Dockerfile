# --- Build stage ---
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# --- Runtime stage ---
FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Copiamos sólo lo necesario para ejecutar
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.ts ./next.config.ts

RUN npm ci --omit=dev
EXPOSE 3000

# Variables de entorno (inyectar en runtime)
ENV PORT=3000

CMD ["npm", "run", "start"]
