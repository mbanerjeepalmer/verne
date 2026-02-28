run-frontend:
	cd frontend && npm i && npm run dev

run-backend:
	cd backend && bun install && bun server.ts