all: python_venv dev prod

setup: python_venv
	@source venv/bin/activate && python3 -m pip install -r requirements.txt

dev:
	docker build . --tag backend-dev --file Dockerfile.dev

prod:
	docker build . --tag pointinsertion.azurecr.io/backend-prod --file Dockerfile.prod

python_venv:
	@python3 -m venv --prompt venv venv

tests: setup prod
	@venv/bin/python -m pytest --docker-compose ../docker-compose.yml -s