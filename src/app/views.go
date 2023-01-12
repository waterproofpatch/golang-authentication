package app

import (
	"encoding/json"
	"net/http"

	"github.com/waterproofpatch/go_authentication/authentication"

	"github.com/gorilla/mux"
)

func items(w http.ResponseWriter, r *http.Request) {
	db := authentication.GetDb()
	var items []Item
	var item Item
	db.Find(&items)
	vars := mux.Vars(r)
	id, hasLessonId := vars["id"]

	// handle requests that want just a single item by id
	if hasLessonId {
		db.Find(&item, id)
	}

	switch r.Method {
	case "GET":
		if hasLessonId {
			json.NewEncoder(w).Encode(item)
		} else {

			json.NewEncoder(w).Encode(items)
		}
		break
	case "DELETE":
		authentication.WriteError(w, "Not handling delete yet!", 501)
		break
	case "POST":
		break
	case "PUT":
		break
	}

	return
}
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
	router.HandleFunc("/api/dashboard/{id:[0-9]+}", authentication.VerifiedOnly(dashboard)).Methods("GET", "POST", "PUT", "DELETE", "OPTIONS")
	router.HandleFunc("/api/dashboard", dashboard).Methods("GET", "POST", "PUT", "OPTIONS")
	router.HandleFunc("/api/items", items).Methods("GET", "POST", "PUT", "OPTIONS")
	router.HandleFunc("/api/items/{id:[0-9]+}", items).Methods("GET", "POST", "PUT", "OPTIONS")
}
