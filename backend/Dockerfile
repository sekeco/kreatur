# ---- Build Stage ----
FROM oven/bun:1 AS build
WORKDIR /app

# Copy workspace manifests
COPY package.json bun.lock ./
COPY backend/package.json ./backend/
COPY frontend/package.json ./frontend/
COPY packages/commons/package.json ./packages/commons/

# Install all workspace dependencies (termasuk postinstall untuk Prisma engine)
RUN bun install --frozen-lockfile

# Copy workspace package source
COPY packages ./packages

# Copy backend source
COPY backend ./backend

# Build backend (bundles into dist/)
RUN cd backend && bun build ./src/index.ts --outdir ./dist --target bun

# ---- Runtime Stage ----
FROM oven/bun:1-slim AS runtime
WORKDIR /app

# Copy full node_modules (termasuk devDeps @zenstackhq/cli + Prisma engine)
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/backend/node_modules ./backend/node_modules

# Copy built bundle
COPY --from=build /app/backend/dist ./dist

# Copy ZenStack schema files (dibutuhkan oleh zen db push di startup)
COPY --from=build /app/backend/zenstack ./backend/zenstack

# Create storage directory for uploads
RUN mkdir -p storage/uploads

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD bun -e "fetch('http://localhost:8000/api/health').then(r => { if(!r.ok) process.exit(1) }).catch(() => process.exit(1))"

ENV NODE_ENV=production

# Startup: push schema ke DB, lalu jalankan server
CMD cd backend && bun zen db push --accept-data-loss && cd /app && bun run dist/index.js
