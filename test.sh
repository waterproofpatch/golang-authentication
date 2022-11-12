#!/bin/bash
URL="192.168.1.252"
PORT="5000"

register() {
  curl --header "Content-Type: application/json" \
    --request POST \
    --data "{\"email\":\"$1\",\"password\":\"$2\"}" \
    http://$URL:$PORT/api/register
}

login() {
curl --header "Content-Type: application/json" \
  --request POST \
  --data "{\"email\":\"$1\",\"password\":\"$2\"}" \
  http://$URL:$PORT/api/login
}

users() {
curl --header "Content-Type: application/json" \
  --request GET \
  --header "Authorization: testauth" \
  http://$URL:$PORT/api/users
}

register "name@gmail.com" "xyz"
#login "name@gmail.com" "xyz"
login "admin@gmail.com" "admin123"
users