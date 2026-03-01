FROM oven/bun:1.3.10 AS builder
WORKDIR /app
COPY frontend-v2/package.json frontend-v2/bun.lock ./
RUN bun install --frozen-lockfile
COPY frontend-v2/ ./
RUN bun run build

FROM oven/bun:1.3.10
WORKDIR /app
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
EXPOSE 3000
CMD ["bun", "run", "server.js"]
