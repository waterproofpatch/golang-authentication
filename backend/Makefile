all: python_venv dev prod

setup: python_venv
	@source venv/bin/activate && python3 -m pip install -r requirements.txt

prod:
	docker build . --tag golang-prod --file Dockerfile.prod

dev:
	docker build . --tag golang-dev --file Dockerfile.dev

up:
	docker-compose up --build

python_venv:
	@python3 -m venv --prompt venv venv

tests: prod
	@source venv/bin/activate && python3 -m pip install -r requirements.txt && python -m pytest