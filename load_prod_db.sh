#!/bin/bash

make down
pg_dump -h ${DB_SERVER}.postgres.database.azure.com -d ${DB_NAME} -U ${DB_USERNAME} -p 5432 -T cron.job -T cron.job_run_details > backup.sql
docker-compose up -d db
docker exec -it backend-db psql -d postgres -U app-db-user -c "DROP DATABASE IF EXISTS \"app-db\";"	
docker cp backup.sql backend-db:/backup.sql
docker exec -it backend-db psql -d postgres -U app-db-user -c "CREATE DATABASE \"app-db\";"
cat backup.sql | docker exec -i backend-db psql -U app-db-user -d app-db
make down
make up