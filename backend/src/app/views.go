package app

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"

	"github.com/waterproofpatch/go_authentication/authentication"

	"github.com/gorilla/mux"
	"github.com/gorilla/websocket"
)

func items(w http.ResponseWriter, r *http.Request) {
	db := authentication.GetDb()
	var items []ItemModel
	var item ItemModel
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
		db.Delete(&ItemModel{}, id)
		db.Find(&items)
		json.NewEncoder(w).Encode(items)
		break
	case "POST":
		var newItem ItemModel
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
		var newItem ItemModel
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

// serveWs handles websocket requests from the peer.
func serveWs(hub *Hub, w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	username := q.Get("username")
	channel := q.Get("channel")

	log.Printf("Starting client for channel %s, user %s", channel, username)

	// upgrade the connection
	upgrader.CheckOrigin = func(r *http.Request) bool { return true }
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println(err)
		return
	}

	// validate client metadata
	if !isValidInput(username) {
		fmt.Println("Invalid username " + username)
		conn.WriteMessage(websocket.CloseMessage, websocket.FormatCloseMessage(websocket.ClosePolicyViolation, "Invalid username."))
		conn.Close()
		return
	}
	if !isValidInput(channel) {
		fmt.Println("Invalid channel " + channel)
		conn.WriteMessage(websocket.CloseMessage, websocket.FormatCloseMessage(websocket.ClosePolicyViolation, "Invalid channel."))
		conn.Close()
		return
	}
	existing_client := hub.getClientByName(username)
	if existing_client != nil {
		conn.WriteMessage(websocket.CloseMessage, websocket.FormatCloseMessage(websocket.ClosePolicyViolation, "Username taken."))
		conn.Close()
	}

	// client looks legit, let them in
	client := &Client{hub: hub, conn: conn, send: make(chan *Message), channel: channel, username: username}
	client.hub.register <- client

	// Allow collection of memory referenced by the caller by doing all work in
	// new goroutines.
	go client.writePump()
	go client.readPump()

	// send the client any/all messages saved in the db
	db := authentication.GetDb()
	var messages []MessageModel
	db.Find(&messages)
	for _, message := range messages {
		if message.Channel == client.channel {
			m := Message{
				From:      message.From,
				Channel:   message.Channel,
				Content:   message.Content,
				Timestamp: message.Timestamp,
			}
			fmt.Printf("Message has timestamp %s\n", m.Timestamp)
			client.send <- &m
		}

	}
}
func InitViews(router *mux.Router) {
	fmt.Println("Starting websocket hub...")
	hub := newHub()
	go hub.run()

	router.HandleFunc("/api/dashboard/{id:[0-9]+}", authentication.VerifiedOnly(dashboard)).Methods("GET", "POST", "PUT", "DELETE", "OPTIONS")
	router.HandleFunc("/api/dashboard", dashboard).Methods("GET", "POST", "PUT", "OPTIONS")
	router.HandleFunc("/api/items", items).Methods("GET", "POST", "PUT", "OPTIONS")
	router.HandleFunc("/api/items/{id:[0-9]+}", items).Methods("GET", "POST", "DELETE", "PUT", "OPTIONS")
	router.HandleFunc("/ws", func(w http.ResponseWriter, r *http.Request) {
		serveWs(hub, w, r)
	})
}
