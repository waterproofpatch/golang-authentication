FROM golang:1.18-alpine AS build

WORKDIR /app

# add go src code
COPY src .
RUN go mod download

# build go src code
RUN ls -al
RUN GOOS=linux go build -ldflags="-s -w" -v -o /web-app

FROM alpine:3.13
RUN apk --no-cache add ca-certificates

# add golang project
WORKDIR /usr/bin
COPY --from=build /web-app .

CMD /usr/bin/web-app --port $PORT 
