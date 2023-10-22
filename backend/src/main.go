// entry point to golang server.
package main

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"strconv"
	"time"

	"app/app"

	"github.com/waterproofpatch/go_authentication/authentication"

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
	log.Printf("Starting server on https://%s...", portStr)

	methods := []string{"GET", "POST", "PUT", "DELETE"}
	headers := []string{"Content-Type", "Access-Control-Allow-Origin", "Authorization"}
	origins := []string{"https://www.plantmindr.com", "http://localhost:4200", "https://localhost:4200", "https://antlion.azurewebsites.net", "http://antlion.azurewebsites.net"}
	srv := &http.Server{
		// Handler: router,
		Handler: handlers.CORS(handlers.AllowCredentials(),
			handlers.AllowedMethods(methods),
			handlers.AllowedHeaders(headers),
			handlers.AllowedOrigins(origins))(router),
		Addr: portStr,
		// Good practice: enforce timeouts for servers you create!
		WriteTimeout: 15 * time.Second,
		ReadTimeout:  15 * time.Second,
	}

	log.Fatal(srv.ListenAndServe())
}

// main is the entrypoint to the program.
func main() {
	log.Printf("Starting...")
	stopCh := make(chan bool)

	// Stop the function by sending a message to the channel
	// stopCh <- true

	router := makeRouter()
	dropTables := false
	port := DEFAULT_PORT
	if os.Getenv("DROP_TABLES") == "true" {
		dropTables = true
	}

	port, err := strconv.Atoi(os.Getenv("PORT"))
	if err != nil {
		log.Printf("Error converting port %s to int.", os.Getenv("PORT"))
		return
	}
	log.Printf("Port will be %d", port)
	log.Printf("Default admin user name will be %s", os.Getenv("DEFAULT_ADMIN_USERNAME"))

	// must happen before we get the db
	authentication.Init(
		os.Getenv("SECRET"),
		os.Getenv("REFRESH_SECRET"),
		os.Getenv("DEFAULT_ADMIN_EMAIL"),
		os.Getenv("DEFAULT_ADMIN_USERNAME"),
		os.Getenv("DEFAULT_ADMIN_PASSWORD"),
		router,
		os.Getenv("DATABASE_URL"),
		dropTables,
		false)

	db := authentication.GetDb()

	app.InitViews(router)
	app.InitModels(db)

	// Run the function in a goroutine
	go app.StartTimer(stopCh, db)

	startServing(port, router)
}
