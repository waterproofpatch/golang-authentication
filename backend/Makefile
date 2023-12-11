all: dev prod

dev:
	docker build . --tag backend-dev --file Dockerfile.dev

prod:
	docker build . --tag pointinsertion.azurecr.io/backend-prod --file Dockerfile.prod

