all: dev prod

dev:
	docker build . --tag frontend-dev --file Dockerfile.dev

prod:
	docker build . --tag pointinsertion.azurecr.io/frontend-prod --file Dockerfile.prod