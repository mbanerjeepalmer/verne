run-frontend:
	cd frontend-v2 && bun install && bun dev

run-backend:
	cd backend && bun install && bun server.ts