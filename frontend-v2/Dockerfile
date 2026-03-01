FROM oven/bun:1.3.10 AS builder
WORKDIR /app
COPY frontend-v2/package.json frontend-v2/bun.lock ./
RUN bun install --frozen-lockfile
COPY frontend-v2/ ./
ARG NEXT_PUBLIC_WEBSOCKET_URL
ENV NEXT_PUBLIC_WEBSOCKET_URL=$NEXT_PUBLIC_WEBSOCKET_URL
RUN bun run build

FROM oven/bun:1.3.10
WORKDIR /app
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
ENV HOSTNAME=0.0.0.0
EXPOSE 3000
CMD ["bun", "run", "server.js"]
