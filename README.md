# Golang Dev Environment

## Development

```bash
docker-compose up --build
```

### Step by step

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

### Using the Makefile

 ```bash
 make run_dev
 ```

```bash
cd src
go build .
./app
```

Navigate to `http://localhost:5000/api/users` - in a browser - you should get a valid JSON response (an error).

```bash
docker-compose down --volumes
```

## Deployment

TBD

## Testing

Testing for the backend is performed using Python's pytest module.

### Step by Step

1. Set up a virtual environment:

 ```bash
 python3 -venv --prompt venv venv
 ```

2. Activate it

 ```bash
 source venv/bin/python
 ```

3. Install dependencies

 ```bash
 python -m pip install -r requirements.txt
 ```

4. Run the tests

 ```bash
 python -m pytest
 ```

### Using the Makefile

A makefile target is provided for convenience.

```bash
make tests
```
