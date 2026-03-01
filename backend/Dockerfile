FROM oven/bun:1.3.10

WORKDIR /app

# Copy backend deps & install
COPY backend/package.json backend/bun.lock ./backend/
RUN cd backend && bun install --frozen-lockfile

# Copy backend source + files it reads at runtime
COPY backend/ ./backend/
COPY listennotes-cli/ ./listennotes-cli/
COPY packages/sandbox/ ./packages/sandbox/

WORKDIR /app/backend
EXPOSE 3001
CMD ["bun", "run", "server.ts"]
