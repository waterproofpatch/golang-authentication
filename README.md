# Golang Template

## Prerequisites

### MacOS

```bash
brew update && brew install azure-cli
```

### Ubuntu

```bash
sudo apt install make -y
sudo snap install docker
```

## Setup

If you plan on working on the `go_authentication` project:

```bash
git submodule init
git submodule update
```

Set up initial SSL certificates (frontend):

```bash
cd frontend
openssl genrsa -out key.pem 2048
openssl req -new -x509 -key key.pem -out cert.pem -days 365
```

Or use:
```bash frontend/make_certs.sh```

There is a `docker-compose.yml` file at the root of this repo that starts up
database, backend and frontend services in development mode with auto-reload:

```bash
make up
```

## Deploy

Login to your Azure account:

```bash
az login
```

Set the following environment variables to your azure account values (do not commit them to source control!)

`export AZ_SUBCRIPTION_ID=<your-subscription-id>`
`export AZ_RESOURCE_GROUP=<your-resource-group>`

Then run the deploy target:

```bash
make deploy
```

## Backup Production Database

```bash
source secret.env
pg_dump -h $DB_SERVER.postgres.database.azure.com -d $DB_NAME -U $DB_USER -p 5432 -T cron.job -T cron.job_run_details > backup.sql
```

## Load Database into Docker Container

1. Drop old database

```bash
docker-compose up -d db
docker exec -it backend-db psql -d postgres -U app-db-user -c "DROP DATABASE IF EXISTS \"app-db\";"
```

```bash
docker cp _dump.sql backend-db:/_dump.sql
docker exec -it backend-db psql -d postgres -U app-db-user -c "CREATE DATABASE \"app-db\";"
cat _dump.sql | docker exec -i backend-db psql -U app-db-user -d app-db
```

The last command will produce errors about extensions, but this doesn't seem to matter.
