# Use a specific and slim version of the Bun image
FROM oven/bun:1.2.15-slim as base
WORKDIR /usr/src/app
ENV NODE_ENV="production"

# Install all dependencies needed for building
FROM base as install
RUN apt-get update && \
    apt-get install -y --no-install-recommends ca-certificates unzip git openssh-client && \
    rm -rf /var/lib/apt/lists/*

COPY package.json bun.lock ./
RUN bun install --ci

# Build the application
FROM base as build
COPY --from=install /usr/src/app/node_modules /usr/src/app/node_modules
COPY . .
RUN bun run generate:build

# Final image with only production dependencies
FROM base

# Create a non-root user
RUN if ! getent group bun > /dev/null; then groupadd --gid 1001 -r bun; fi && \
    if ! getent passwd bun > /dev/null; then useradd --uid 1001 --gid 1001 -r -s /bin/bash -c "Bun user" bun; fi

WORKDIR /usr/src/app

# Copy package files and install production dependencies
COPY --from=install /usr/src/app/package.json /usr/src/app/bun.lock ./
RUN bun install --ci --production

# Copy the built application
COPY --from=build /usr/src/app/dist ./dist
COPY --from=build /usr/src/app/public ./public

# Change ownership of the app directory
RUN chown -R bun:bun /usr/src/app

# Switch to the non-root user
USER bun

EXPOSE 1337
CMD [ "bun", "run", "start" ]