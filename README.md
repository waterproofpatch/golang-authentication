# Golang Template

## Quickstart

Set up initial SSL certificates (frontend):

```bash
openssl genrsa -out key.pem 2048
openssl req -new -x509 -key key.pem -out cert.pem -days 365
```

Or use:
```bash frontend/make_certs.sh```

### MacOS

```bash
brew update && brew install azure-cli
```

### Ubuntu

```bash
sudo apt install make -y
sudo snap install docker
```

There is a `docker-compose.yml` file at the root of this repo that starts up
database, backend and frontend services in development mode with auto-reload:

```bash
make up
```

## Backend

```bash
cd backend
```

### Building

Configure the development environment

```bash
make setup
```

Build development image

```bash
make dev
```

Build production image

```bash
make prod
```

### Testing

Testing for the template is performed using Python's pytest module, and is performed
against the production docker image built from source.

```bash
make tests
```

## Frontend

```bash
cd frontend
```

Build development image

```bash
make dev
```

Build production image

```bash
make prod
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
