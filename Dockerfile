ARG NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID

# ---- Stage 1: Build ----
FROM node:22-bookworm AS builder

ARG NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID
ENV NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=${NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID}

# Create app directory
WORKDIR /app

# Copy all files
COPY . .

# Install dependencies
RUN npm ci

# Build the app
RUN npm run build

# ---- Stage 2: Production Image ----
FROM node:22-slim AS runner

WORKDIR /app

# Copy necessary files from builder (standalone Next.js build)
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Optional: If you use a custom font or other static assets
# COPY --from=builder /app/fonts ./fonts

# Set NODE_ENV to production
ENV NODE_ENV=production
ENV PORT=3000

# Expose port
EXPOSE 3000

# Start the app
CMD ["node", "server.js", "--hostname", "0.0.0.0"]
