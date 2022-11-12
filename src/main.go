// entry point to golang server.
package main

import (
	"app/api/app"
	"app/api/authentication"
	"app/api/version"
	"app/database"
	"app/utils"
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/gorilla/handlers"
	"github.com/gorilla/mux"
	"gorm.io/gorm"
)

func initViews(router *mux.Router) {
	authentication.InitViews(router)
	version.InitViews(router)

	app.InitViews(router)
}

// startServing creates the server mux and registers endpoints with it.
func startServing(port string) {
	portStr := fmt.Sprintf("0.0.0.0:%s", port)
	log.Printf("Starting server on %s...", portStr)

	router := mux.NewRouter()

	initViews(router)

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

func initUsers(db *gorm.DB, cfg *utils.Config) {
	adminPass, err := authentication.HashPassword(cfg.DefaultAdminPass)
	if err != nil {
		panic("Failed hashing password for admin user")
	}
	_, err = authentication.CreateUser(cfg.DefaultAdminUser,
		adminPass,
		true, // isVerified
		true, // isAdmin
		authentication.GeneratePseudorandomToken())
	if err != nil {
		log.Printf("Failed adding default admin user")
		return
	}

}

// main is the entrypoint to the program.
func main() {
	cfg := utils.GetConfig()
	// init the database
	log.Printf("Initializing database, dropTables=%v...\n", cfg.DropTables)
	database.InitDb(cfg.DbUrl, cfg.DropTables)
	db := database.GetDb()
	initUsers(db, cfg)

	startServing(cfg.Port)
}
