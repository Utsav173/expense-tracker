# Stage 1: Build environment
FROM oven/bun as builder
WORKDIR /app
# Copy package files and lock file
COPY package*.json bun.lockb ./
# Install dependencies
RUN bun install
# Copy the rest of your application's source code
COPY . .
# Build your Bun application
RUN bun run generate:build

# Stage 2: Production environment
FROM oven/bun
WORKDIR /app
# Set the environment to production
ENV NODE_ENV production
# Copy only necessary files from the builder stage
COPY --from=builder /app/package.json /app/bun.lockb ./
# Install only production dependencies
RUN bun install --production
# Copy built assets from the builder stage
COPY --from=builder /app/dist ./dist
# Start your Bun application
CMD ["bun", "start"]