docker-compose down --volumes
docker network rm backend_app-net || true
docker rm golang-template-backend-1 || true
docker rm golang-template-frontend-1 || true
docker-compose rm --stop || true
