# Use Node.js LTS version
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json package-lock.json* ./
RUN \
  if [ -f package-lock.json ]; then npm ci --legacy-peer-deps; \
  else echo "Warning: Lockfile not found." && npm install; \
  fi
 
 
# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Disable telemetry and set production mode
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Create public directory if it doesn't exist
RUN mkdir -p ./public

# Build with output traces enabled
RUN npm run build
 
# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app
 
ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1
 
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
 
COPY --from=builder /app/public ./public
 
# Set the correct permission for prerender cache
RUN mkdir -p .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
 
USER nextjs
 
EXPOSE 3000
 
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"
 
CMD ["node", "server.js"]
