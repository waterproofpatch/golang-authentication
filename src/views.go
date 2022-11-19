package main

import (
	"net/http"

	"github.com/waterproofpatch/go_authentication"

	"github.com/gorilla/mux"
)

func dashboard(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case "GET":
		break
	case "DELETE":
		break
	case "POST":
		break
	case "PUT":
		break
	}

	return
}

func InitViews(router *mux.Router) {
	router.HandleFunc("/api/dashboard/{id:[0-9]+}", go_authentication.VerifiedOnly(dashboard)).Methods("GET", "POST", "PUT", "DELETE", "OPTIONS")
	router.HandleFunc("/api/dashboard", dashboard).Methods("GET", "POST", "PUT", "OPTIONS")
}
