#!/bin/bash

# Docker container name
CONTAINER_NAME="backend-db"

# PostgreSQL credentials
POSTGRES_USER="app-db-user"
POSTGRES_DB="app-db"

# SQL command to delete all rows from Users table
SQL_COMMAND="DELETE FROM Users;"

# Execute psql command inside Docker container
docker exec -it $CONTAINER_NAME psql -U $POSTGRES_USER -d $POSTGRES_DB -c "$SQL_COMMAND"
