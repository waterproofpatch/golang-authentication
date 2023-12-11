AZ_ACR_NAME=pointinsertion
AZ_ACR_URL=$(AZ_ACR_NAME).azurecr.io
AZ_FRONTEND_NAME=antlion
AZ_BACKEND_NAME=strider

all: down up

# dev environment up
up: update_timestamp
	docker-compose -f docker-compose.yml up --build --abort-on-container-exit

# update the timestamp in the docker file, displayed to the frontend in "version" (profile page)
update_timestamp:
	bash update_timestamp.sh

# dev environment down
down:
	./cleanup-containers.sh

# build docker image for backend prod deployment
prod_frontend:
	docker build frontend --tag $(AZ_ACR_URL)/frontend-prod --file frontend/Dockerfile.prod

# build docker image for frontend prod deployment
prod_backend: update_timestamp
	docker build backend --tag $(AZ_ACR_URL)/backend-prod --file backend/Dockerfile.prod

# run prod target with -j2 for parallel builds
prod: prod_frontend prod_backend

# deploy the production images
deploy: prod
	az account set --subscription $(AZ_SUBSCRIPTION_ID)
	az acr login --name $(AZ_ACR_NAME)
	docker push $(AZ_ACR_URL)/backend-prod:latest
	docker push $(AZ_ACR_URL)/frontend-prod:latest
	az webapp restart --resource-group $(AZ_RESOURCE_GROUP) --name $(AZ_BACKEND_NAME)
	az webapp restart --resource-group $(AZ_RESOURCE_GROUP) --name $(AZ_FRONTEND_NAME)