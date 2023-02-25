all: python_venv dev prod

setup: python_venv
	@source venv/bin/activate && python3 -m pip install -r requirements.txt

prod:
	docker build . --tag golang-prod --file Dockerfile.prod

dev:
	docker build . --tag golang-dev --file Dockerfile.dev

up:
	docker-compose up --build

run_prod:
	docker run \
	--env DEFAULT_ADMIN_USER=admin@gmail.com \
	--env DEFAULT_ADMIN_PASS=admin123 \
	--env PORT=5000 \
        --env DATABASE_URL=postgres://app-db-user:app-db-password@db:5432/app-db \
        --env SECRET=somesecretjwttoken \
        --env DROP_TABLES=true \
	-p 5000:5000 golang-prod

python_venv:
	@python3 -m venv --prompt venv venv

tests: prod
	@source venv/bin/activate && python3 -m pip install -r requirements.txt && python -m pytest