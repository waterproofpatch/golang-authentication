AZ_ACR_NAME=pointinsertion
up: 
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml up --build
down:
	docker-compose down --volumes

prod_frontend:
	$(MAKE) -C frontend prod
prod_backend:
	$(MAKE) -C backend prod

prod: prod_frontend prod_backend

deploy: prod
	az account set --subscription $(AZ_SUBSCRIPTION_ID)
	az acr login --name $(AZ_ACR_NAME)
	docker push $(AZ_ACR_NAME).azurecr.io/backend-prod:latest
	docker push $(AZ_ACR_NAME).azurecr.io/frontend-prod:latest
	az webapp restart --resource-group $(AZ_RESOURCE_GROUP) --name strider
	az webapp restart --resource-group $(AZ_RESOURCE_GROUP) --name antlion