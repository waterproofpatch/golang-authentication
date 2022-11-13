all: dev prod
prod:
	@echo "Not implemented."
dev:
	docker build . --tag golang-dev --file Dockerfile.dev

run_prod:
	@echo "Not implemented."

run_dev: dev
	@docker run -it -p 5000:5000 \
	--env SECRET=123 \
	--env DROP_TABLES=true \
	--env PORT=5000 \
	--env DEFAULT_ADMIN_USER=admin@gmail.com \
	--env DEFAULT_ADMIN_PASSWORD=admin123 \
	--env DATABASE_URL=postgres://app-db-user:app-db-password@192.168.1.252:5432/app-db \
	--mount type=bind,src="$(shell pwd)",target=/app golang-dev \
	/bin/sh
