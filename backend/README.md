# Golang Template

## Setup

Configure the development environment:

```bash
make setup
```

You'll want the postgres server running in the background in order to start the
`go` app, since the app attempts to connect to the database specified vie the
environment variables.

```bash
docker-compose up --build
```

You can stop the compose service:

```bash
docker-compose down --volumes
```

## Building

Build a development container:

```bash
docker build . -t golang-dev -f Dockerfile.dev
```

Drop into the development container for building (bind mounts source directory):

```bash
docker run -it -p 5000:5000 \
 --env SECRET=123 \
 --env DROP_TABLES=true \
 --env PORT=5000 \
 --env DEFAULT_ADMIN_USER=admin@gmail.com \
 --env DEFAULT_ADMIN_PASSWORD=admin123 \
 --env DATABASE_URL=postgres://app-db-user:app-db-password@localhost:5432/app-db \
 --mount type=bind,src="$(pwd)",target=/app golang-dev \
 /bin/sh
 ```

Once inside the docker container, build and run the project:

```bash
go build main.go
./main
```

From the host, navigate to `http://localhost:5000/api/users` - in a browser - you should get a valid JSON response (an error).

## Testing

Testing for the template is performed using Python's pytest module, and is performed
against the production docker image built from source.

```bash
make tests
```
