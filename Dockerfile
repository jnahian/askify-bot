# ---- Build Stage ----
FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

COPY tsconfig.json prisma.config.ts ./
COPY prisma/ prisma/
RUN npx prisma generate

COPY src/ src/
RUN npm run build

# ---- Production Stage ----
FROM node:22-alpine

WORKDIR /app

ENV NODE_ENV=production

COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

# Copy Prisma schema + generated client from builder
COPY --from=builder /app/prisma/ prisma/
COPY --from=builder /app/prisma.config.ts prisma.config.ts
COPY --from=builder /app/src/generated/ src/generated/

# Copy compiled JS from builder
COPY --from=builder /app/dist/ dist/

USER node

CMD ["node", "dist/app.js"]
