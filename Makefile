AZ_ACR_NAME=pointinsertion

all: prod

up: 
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml up --build --abort-on-container-exit

down:
	./cleanup-containers.sh

prod_frontend:
	$(MAKE) -C frontend prod
prod_backend:
	$(MAKE) -C backend prod

# run prod target with -j2 for parallel builds
prod: prod_frontend prod_backend

deploy: prod
	az account set --subscription $(AZ_SUBSCRIPTION_ID)
	az acr login --name $(AZ_ACR_NAME)
	docker push $(AZ_ACR_NAME).azurecr.io/backend-prod:latest
	docker push $(AZ_ACR_NAME).azurecr.io/frontend-prod:latest
	az webapp restart --resource-group $(AZ_RESOURCE_GROUP) --name strider
	az webapp restart --resource-group $(AZ_RESOURCE_GROUP) --name antlion