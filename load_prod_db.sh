#!/bin/bash
set -e

# Usage: ./your-script.sh [--load]
# --load: Load the downloaded database into the local Docker service.

if [ "$1" == "--help" ]; then
    echo "Usage: $0 [--load]"
    echo "--load: Load the downloaded database into the local Docker service."
    exit 0
fi

#make down
echo "Downloading database from prod..."
pg_dump -h ${DB_SERVER}.postgres.database.azure.com -d ${DB_NAME} -U ${DB_USERNAME} -p 5432 --exclude-table cron.job --exclude-table cron.job_run_details --data-only > backup.sql
echo "Done downloading database from prod..."

if [ "$1" == "--load" ]; then
    docker-compose up -d db
    docker exec -it backend-db psql -d postgres -U app-db-user -c "DROP DATABASE IF EXISTS \"app-db\";"	
    docker cp backup.sql backend-db:/backup.sql
    docker exec -it backend-db psql -d postgres -U app-db-user -c "CREATE DATABASE \"app-db\";"
    cat backup.sql | docker exec -i backend-db psql -U app-db-user -d app-db
    make down
    make up
fi
