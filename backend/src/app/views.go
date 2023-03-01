package app

import (
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/waterproofpatch/go_authentication/authentication"

	"github.com/gorilla/mux"
)

func items(w http.ResponseWriter, r *http.Request) {
	db := authentication.GetDb()
	var items []Item
	var item Item
	vars := mux.Vars(r)
	id, hasLessonId := vars["id"]

	switch r.Method {
	case "GET":
		if hasLessonId {
			db.Find(&item, id)
			json.NewEncoder(w).Encode(item)
		} else {
			db.Find(&items)
			json.NewEncoder(w).Encode(items)
		}
		break
	case "DELETE":
		if !hasLessonId {
			authentication.WriteError(w, "Must provide id!", http.StatusBadRequest)
			break
		}
		db.Delete(&Item{}, id)
		db.Find(&items)
		json.NewEncoder(w).Encode(items)
		break
	case "POST":
		var newItem Item
		err := json.NewDecoder(r.Body).Decode(&newItem)
		if err != nil {
			authentication.WriteError(w, err.Error(), 400)
			break
		}
		err = AddItem(db, newItem.Name, newItem.Type)
		if err != nil {
			authentication.WriteError(w, err.Error(), 400)
			break
		}
		db.Find(&items)
		json.NewEncoder(w).Encode(items)
		break
	case "PUT":
		var newItem Item
		err := json.NewDecoder(r.Body).Decode(&newItem)
		if err != nil {
			authentication.WriteError(w, err.Error(), 400)
			break
		}
		err = UpdateItem(db, newItem.Id, newItem.Name, newItem.Type)
		if err != nil {
			authentication.WriteError(w, err.Error(), 400)
			break
		}
		db.Find(&items)
		json.NewEncoder(w).Encode(items)
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
	fmt.Println("Starting websocket hub...")
	hub := newHub()
	go hub.run()

	router.HandleFunc("/api/dashboard/{id:[0-9]+}", authentication.VerifiedOnly(dashboard)).Methods("GET", "POST", "PUT", "DELETE", "OPTIONS")
	router.HandleFunc("/api/dashboard", dashboard).Methods("GET", "POST", "PUT", "OPTIONS")
	router.HandleFunc("/api/items", items).Methods("GET", "POST", "PUT", "OPTIONS")
	router.HandleFunc("/api/items/{id:[0-9]+}", items).Methods("GET", "POST", "DELETE", "PUT", "OPTIONS")
	router.HandleFunc("/ws/{channel:[a-z0-9]+}", func(w http.ResponseWriter, r *http.Request) {
		serveWs(hub, w, r)
	})
}
