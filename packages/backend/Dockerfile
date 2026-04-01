# Build stage
FROM node:20-alpine AS builder

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy workspace files
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/backend/package.json ./packages/backend/

RUN pnpm install --frozen-lockfile || pnpm install

# Copy source
COPY tsconfig.base.json ./
COPY packages/shared/ ./packages/shared/
COPY packages/backend/ ./packages/backend/

# Generate Prisma client
RUN cd packages/backend && npx prisma generate

# Build
RUN pnpm --filter @resume-ai/backend build

# Production stage
FROM node:20-alpine

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

COPY --from=builder /app/package.json /app/pnpm-workspace.yaml ./
COPY --from=builder /app/packages/shared/package.json ./packages/shared/
COPY --from=builder /app/packages/backend/package.json ./packages/backend/

# Install production dependencies only
RUN pnpm install --prod --frozen-lockfile || pnpm install --prod

COPY --from=builder /app/packages/shared/src/ ./packages/shared/src/
COPY --from=builder /app/packages/backend/dist/ ./packages/backend/dist/
COPY --from=builder /app/packages/backend/prisma/ ./packages/backend/prisma/
COPY --from=builder /app/packages/backend/node_modules/.prisma/ ./packages/backend/node_modules/.prisma/

# Create uploads directory
RUN mkdir -p /app/packages/backend/uploads

WORKDIR /app/packages/backend

EXPOSE 3000

CMD ["node", "dist/main.js"]
