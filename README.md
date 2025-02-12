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
python3 -m venv myvenv
source myvenv/bin/python
python3 -m pip install az-cli
```

## Setup

If you plan on working on the `go_authentication` project:

```bash
git submodule init
git submodule update
# see about "replace" in backend/src/go.mod
```

Set up initial SSL certificates (frontend):

```bash
cd frontend
openssl genrsa -out key.pem 2048
openssl req -new -x509 -key key.pem -out cert.pem -days 365
```

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

Then run the deploy target:

```bash
make deploy
# alternatively
make deploy_backend
make deploy_frontend
```

## Load Production Database in Dev Container

```bash
source secret.env
bash load_prod_db.sh
```
