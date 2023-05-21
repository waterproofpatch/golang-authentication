#!/bin/bash
# Clean up containers and compose services. 
# docker-compose down --volumes
docker-compose down
docker network rm backend_app-net || true
docker rm golang-template-backend-1 || true
docker rm golang-template-frontend-1 || true
docker-compose rm --stop || true
