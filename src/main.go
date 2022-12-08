// entry point to golang server.
package main

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"strconv"
	"time"

	"github.com/waterproofpatch/go_authentication"

	"github.com/gorilla/handlers"
	"github.com/gorilla/mux"
)

func makeRouter() *mux.Router {
	router := mux.NewRouter()

	return router
}

var DEFAULT_PORT = 8080

// startServing creates the server mux and registers endpoints with it.
func startServing(port int, router *mux.Router) {
	portStr := fmt.Sprintf("0.0.0.0:%d", port)
	log.Printf("Starting server on %s...", portStr)

	methods := []string{"GET", "POST", "PUT", "DELETE"}
	headers := []string{"Content-Type", "Access-Control-Allow-Origin", "Authorization"}
	srv := &http.Server{
		// Handler: router,
		Handler: handlers.CORS(handlers.AllowedMethods(methods), handlers.AllowedHeaders(headers))(router),
		Addr:    portStr,
		// Good practice: enforce timeouts for servers you create!
		WriteTimeout: 15 * time.Second,
		ReadTimeout:  15 * time.Second,
	}

	log.Fatal(srv.ListenAndServe())
}

// main is the entrypoint to the program.
func main() {
	log.Printf("Starting...")

	var router = makeRouter()
	var dropTables = false
	var port = DEFAULT_PORT

	if os.Getenv("DROP_TABLES") == "true" {
		dropTables = true
	}

	port, err := strconv.Atoi(os.Getenv("PORT"))
	if err != nil {
		log.Printf("Error converting port %s to int.", os.Getenv("PORT"))
		return
	}

	go_authentication.Init(os.Getenv("SECRET"), os.Getenv("DEFAULT_ADMIN_USER"), os.Getenv("DEFAULT_ADMIN_PASSWORD"), router, os.Getenv("DATABASE_URL"), dropTables)

	InitViews(router)
	startServing(port, router)
}
