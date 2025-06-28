FROM oven/bun as builder
WORKDIR /usr/src/app

COPY package*.json bun.lock ./
RUN bun install --production=false
COPY . .
RUN bun run generate:build

FROM oven/bun as runner
WORKDIR /usr/src/app

ENV NODE_ENV=production

# Copy only built output and production dependencies
COPY --from=builder /usr/src/app/package*.json ./
COPY --from=builder /usr/src/app/bun.lock ./
RUN bun install --production
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/public ./public

CMD [ "bun", "run", "start" ]