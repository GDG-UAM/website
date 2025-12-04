# Stage 1: Dependencies
FROM oven/bun:1-alpine AS deps

WORKDIR /app

COPY package.json bun.lockb* ./

RUN bun install --frozen-lockfile

# Stage 2: Builder
FROM oven/bun:1-alpine AS builder

WORKDIR /app

ARG SESSION_SECRET
ENV SESSION_SECRET=${SESSION_SECRET}

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN bun run build

# Stage 3: Runner
FROM oven/bun:1-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE $PORT

CMD ["bun", "run", "server.js"]