# Golang Dev Environment

## Development

```bash
docker-compose up --build
```

```bash
docker build . -t golang-dev -f Dockerfile.dev
```

```bash
docker run -it -p 5000:5000 \
 --env SECRET=123 \
 --env DROP_TABLES=true \
 --env PORT=5000 \
 --env DEFAULT_ADMIN_USER=admin@gmail.com \
 --env DEFAULT_ADMIN_PASSWORD=admin123 \
 --env DATABASE_URL=postgres://app-db-user:app-db-password@192.168.1.252:5432/app-db \
 --mount type=bind,src="$(pwd)",target=/app golang-dev \
 /bin/sh
 ```

 or

 ```bash
 ./run_docker.sh
 ```

```bash
cd src
go build .
```

```bash
docker-compose down --volumes
```

## Deployment

TBD
