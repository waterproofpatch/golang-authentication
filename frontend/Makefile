all: dev prod

dev:
	docker build . --tag frontend --file Dockerfile.dev

prod:
	docker build . --tag pointinsertion.azurecr.io/frontend-prod --file Dockerfile.prod

run_prod:
	docker run -p 8080:80 frontend-prod