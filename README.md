# Golang Template

## Quickstart

There is a `docker-compose.yml` file at the root of this repo that starts up database, backend and frontend services in development mode with auto-reload.

```bash
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up --build
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
