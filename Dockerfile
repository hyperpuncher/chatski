# Stage 1: Build
FROM oven/bun:alpine AS builder
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install
COPY . .
RUN bun run prepare
RUN bun run build

# Stage 2: Runtime
FROM oven/bun:alpine
WORKDIR /app
COPY --from=builder /app/build ./build
COPY --from=builder /app/package.json ./
RUN bun install --production
EXPOSE 3000
CMD ["bun", "run", "start"]
