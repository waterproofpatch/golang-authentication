package app

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strconv"

	"github.com/waterproofpatch/go_authentication/authentication"

	"io/ioutil"

	"github.com/gorilla/mux"
	"github.com/gorilla/websocket"
)

func uploadHandler(w http.ResponseWriter, r *http.Request) uint {
	// Parse the multipart form in the request
	err := r.ParseMultipartForm(10 << 20) // 10 MB maximum file size
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return 0
	}

	// Get the image file from the form data
	file, _, err := r.FormFile("image")
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return 0
	}
	defer file.Close()

	// Read the file data into a byte slice
	fileData, err := ioutil.ReadAll(file)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return 0
	}

	// Open a connection to the database
	db := authentication.GetDb()

	// Create a new Image instance and set its fields
	image := ImageModel{
		Name: "image.jpg",
		Data: fileData,
	}

	// Insert the record into the database
	result := db.Create(&image)
	if result.Error != nil {
		panic(result.Error)
	}

	// Return a success message
	fmt.Println("Stored image successfully.")
	return image.ID
}

func images(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	imageId, hasImageId := vars["id"]
	db := authentication.GetDb()
	fmt.Printf("imageId=%s\n", imageId)
	switch r.Method {
	case "GET":
		if hasImageId {
			imageIdNo, err := strconv.Atoi(imageId)
			if err != nil {
				authentication.WriteError(w, "Invalid image ID", http.StatusBadRequest)
				return
			}
			fmt.Printf("Handling request for imageId=%d\n", imageIdNo)

			var img ImageModel
			img.ID = uint(imageIdNo)
			if err := db.First(&img, img.ID).Error; err != nil {
				authentication.WriteError(w, "Failed loading image", http.StatusBadRequest)
				return
			}
			w.Header().Set("Content-Type", "image/jpeg")
			w.Write(img.Data)
			return
		} else {
			authentication.WriteError(w, "Must supply image ID!", http.StatusBadRequest)
		}
		break
	}
}
func items(w http.ResponseWriter, r *http.Request) {
	db := authentication.GetDb()
	var items []ItemModel
	var item ItemModel
	vars := mux.Vars(r)
	id, hasItemId := vars["id"]
	switch r.Method {
	case "GET":
		if hasItemId {
			db.Find(&item, id)
			json.NewEncoder(w).Encode(item)
		} else {
			db.Find(&items)
			json.NewEncoder(w).Encode(items)
		}
		break
	case "DELETE":
		if !hasItemId {
			authentication.WriteError(w, "Must provide id!", http.StatusBadRequest)
			break
		}
		db.Delete(&ItemModel{}, id)
		db.Find(&items)
		json.NewEncoder(w).Encode(items)
		break
	case "POST":
		var imageId = uploadHandler(w, r)
		var newItem ItemModel
		newItem.ImageId = imageId
		newItem.Name = r.FormValue("nameOfPlant")
		wateringFrequencyNo, err := strconv.Atoi(r.FormValue("wateringFrequency"))
		if err != nil {
			fmt.Println("Failed to parse integer")
			authentication.WriteError(w, "Invalid wateringFrequency", http.StatusBadRequest)
			return
		}
		newItem.Type = wateringFrequencyNo
		err = AddItem(db, newItem.Name, newItem.Type, newItem.ImageId)
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
	channel := q.Get("channel")
	token := q.Get("token")

	log.Printf("Processing new client for channel=%s", channel)
	success, jwtData, errorMsg := authentication.ParseToken(token)

	// upgrade the connection
	upgrader.CheckOrigin = func(r *http.Request) bool { return true }
	conn, err := upgrader.Upgrade(w, r, nil)

	if err != nil {
		log.Println(err)
		return
	}

	if !success {
		fmt.Printf("Client is not authenticated: %s.\n", errorMsg)
		conn.WriteMessage(websocket.CloseMessage, websocket.FormatCloseMessage(websocket.ClosePolicyViolation, "Please login or create an account."))
		conn.Close()
		return
	}

	if !isValidInput(channel) {
		fmt.Println("Invalid channel " + channel)
		conn.WriteMessage(websocket.CloseMessage, websocket.FormatCloseMessage(websocket.ClosePolicyViolation, "Invalid channel."))
		conn.Close()
		return
	}

	// client looks legit, let them in
	client := &Client{hub: hub, conn: conn, send: make(chan *Message), channel: channel, username: jwtData.Username}
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
			// don't send pms that aren't for this client
			if message.PmUsername != "" && message.PmUsername != client.username {
				continue
			}
			m := Message{
				From:          message.From,
				Channel:       message.Channel,
				Content:       message.Content,
				Timestamp:     message.Timestamp,
				PmUsername:    message.PmUsername,
				Authenticated: message.Authenticated,
			}
			client.send <- &m
		}

	}
	// tell all clients, including the one who just joined,
	// that a new client has joined.
	hub.broadcastClientJoin(client)
	for connectedClient, _ := range hub.clients {
		var message Message
		message.Type = USER_JOIN
		message.Content = connectedClient.username
		message.Timestamp = formattedTime()
		message.From = "Server"
		message.Channel = "Broadcast"
		fmt.Printf("Sending USER_JOIN (%s) message to %s\n", connectedClient.username, client.username)
		client.send <- &message
	}
}
func InitViews(router *mux.Router) {
	fmt.Println("Starting websocket hub...")
	hub := newHub()
	go hub.run()

	// router.HandleFunc("/api/upload", uploadHandler)
	router.HandleFunc("/api/dashboard/{id:[0-9]+}", authentication.VerifiedOnly(dashboard)).Methods("GET", "POST", "PUT", "DELETE", "OPTIONS")
	router.HandleFunc("/api/dashboard", dashboard).Methods("GET", "POST", "PUT", "OPTIONS")
	router.HandleFunc("/api/items", items).Methods("GET", "POST", "PUT", "OPTIONS")
	router.HandleFunc("/api/items/{id:[0-9]+}", items).Methods("GET", "POST", "DELETE", "PUT", "OPTIONS")
	router.HandleFunc("/api/images/{id:[0-9]+}", images).Methods("GET", "OPTIONS")
	router.HandleFunc("/ws", func(w http.ResponseWriter, r *http.Request) {
		serveWs(hub, w, r)
	})
}
