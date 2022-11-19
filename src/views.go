package main

import (
	"net/http"

	"github.com/waterproofpatch/go_authentication"

	"github.com/gorilla/mux"
)

func dashboard(w http.ResponseWriter, r *http.Request) {
	// db := go_authentication.GetDb()
	switch r.Method {
	case "GET":
		// handle POST
		break
	case "DELETE":
		// handle GET
		break
	case "POST":
		// handle POST
		break
	case "PUT":
		// handle PUT
		break
	}

	// var items []database.Item

	// unless the user is admin, we only want to return available lessons
	// db.Find(&items)
	// json.NewEncoder(w).Encode(items)
	return
}

func InitViews(router *mux.Router) {
	router.HandleFunc("/api/dashboard/{id:[0-9]+}", go_authentication.VerifiedOnly(dashboard)).Methods("GET", "POST", "PUT", "DELETE", "OPTIONS")
	router.HandleFunc("/api/dashboard", dashboard).Methods("GET", "POST", "PUT", "OPTIONS")
}
