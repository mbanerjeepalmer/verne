run-frontend:
	cd frontend-v2 && bun install && bun dev

run-backend:
	cd backend && bun install && bun server.ts

build-backend:
	docker build -f backend/Dockerfile -t verne-backend .

build-frontend:
	docker build -f frontend-v2/Dockerfile -t verne-frontend .

build-all: build-backend build-frontend