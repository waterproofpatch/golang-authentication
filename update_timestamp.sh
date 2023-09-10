#!/bin/bash

# Get the current git branch and hash
GIT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
GIT_HASH=$(git rev-parse --short HEAD)

# Get the current time in "mm/dd/yy hh:mm:ss" format
CURRENT_TIME=$(date +"%m/%d/%y %H:%M:%S")

# Combine them into one string
NEW_TIMESTAMP="${GIT_BRANCH}_${GIT_HASH}_${CURRENT_TIME}"

echo "Updating timestamp to ${NEW_TIMESTAMP}"
sed -i.bak 's|SITE_TIMESTAMP="[^"]*"|SITE_TIMESTAMP="'"${NEW_TIMESTAMP}"'"|g' backend/Dockerfile.dev
sed -i.bak 's|SITE_TIMESTAMP="[^"]*"|SITE_TIMESTAMP="'"${NEW_TIMESTAMP}"'"|g' backend/Dockerfile.prod

# Remove the backup file created by sed
rm -rf backend/Dockerfile.dev.bak
rm -rf backend/Dockerfile.prod.bak
