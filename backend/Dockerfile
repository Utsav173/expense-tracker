# Use distroless for smaller final image
FROM oven/bun:1.2.15-alpine as base
WORKDIR /app

# Dependencies stage - cached separately
FROM base as deps
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production

# Build stage
FROM base as build
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile
COPY . .
RUN bun run generate:build

# Production stage - minimal layers
FROM oven/bun:1.2.15-alpine
WORKDIR /app

# Copy only what's needed
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/public ./public
COPY --from=build /app/package.json ./

# Set ownership for existing bun user
RUN chown -R bun:bun /app

USER bun
EXPOSE 1337
CMD ["bun", "run", "start"]