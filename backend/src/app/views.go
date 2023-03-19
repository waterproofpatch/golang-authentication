package app

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"strconv"
	"time"

	"github.com/solywsh/chatgpt"
	"github.com/waterproofpatch/go_authentication/authentication"

	"io/ioutil"

	"github.com/gorilla/mux"
	"github.com/gorilla/websocket"
)

func getApiKey() string {
	apiKey := os.Getenv("OPENAI_API_KEY")
	return apiKey
}

func chatgptGetWateringFruencyByPlantName(name string) float64, err {
	chat := chatgpt.New(getApiKey(), "user_id(not required)", 30*time.Second)
	defer chat.Close()
	//
	//select {
	//case <-chat.GetDoneChan():
	//	fmt.Println("time out/finish")
	//}
	// question := "How often should I water a ZZ plant"
	question := fmt.Sprintf("How often shuld I water a %s plant? Answer in JSON, and include a single integer representing the number of days between watering in the JSON key 'waterFrequency'.", name)
	fmt.Printf("Q: %s\n", question)
	answer, err := chat.Chat(question)
	if err != nil {
		fmt.Printf("Error: %s", err)
		return 0, err
	}
	fmt.Printf("A: %s\n", answer)
	var jsonObject map[string]interface{}
	err = json.Unmarshal([]byte(answer), &jsonObject)
	if err != nil {
		fmt.Println(err)
	}
	return jsonObject["waterFrequency"].(float64), nil

}

// returns 0 on failure, ImageModel.ID stored in database on success
func uploadHandler(w http.ResponseWriter, r *http.Request) uint {
	// Parse the multipart form in the request
	err := r.ParseMultipartForm(10 << 20) // 10 MB maximum file size
	if err != nil {
		authentication.WriteError(w, "Invalid file size", http.StatusBadRequest)
		return 0
	}

	// Get the image file from the form data
	file, _, err := r.FormFile("image")
	if err != nil {
		// not critical, images are optional
		// authentication.WriteError(w, "Failed finding image in request.", http.StatusBadRequest)
		return 0
	}
	defer file.Close()

	// Read the file data into a byte slice
	fileData, err := ioutil.ReadAll(file)
	if err != nil {
		authentication.WriteError(w, "Failed reading image.", http.StatusBadRequest)
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
		authentication.WriteError(w, "Failed writing image to db", http.StatusBadRequest)
		return 0
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

	// frontend can request this when they get a plant with an imageId nonzero
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
			w.Header().Set("Content-WateringFrequency", "image/jpeg")
			w.Write(img.Data)
			return
		} else {
			authentication.WriteError(w, "Must supply image ID!", http.StatusBadRequest)
		}
		break
	}
}
func plantsInfo(w http.ResponseWriter, r *http.Request, claims *authentication.JWTData) {
	// ask chatgpt a question
	// name := r.FormValue("nameOfPlant")
	var jsonObject map[string]interface{}
	err := json.NewDecoder(r.Body).Decode(&jsonObject)
	if err != nil {
		fmt.Println(err)
	}

	plantName, ok := jsonObject["plantName"].(string)
	if !ok {
		// jsonObject["plantName"] is not a string
		// handle the error appropriately
	}
	var wateringFrequency, err = chatgptGetWateringFruencyByPlantName(plantName)
	if err != nil {
		fmt.Printf("Error: %s\n", err)
		authentication.WriteError(w, "Unable to get watering frequency.", http.StatusBadRequest)
		return
	}
	response := map[string]interface{}{
		"wateringFrequency": wateringFrequency,
	}
	jsonResponse, err := json.Marshal(response)
	if err != nil {
		fmt.Println(err)
		return
	}
	fmt.Printf("JSON response is %s", jsonResponse)
	json.NewEncoder(w).Encode(response)
}

func plants(w http.ResponseWriter, r *http.Request, claims *authentication.JWTData) {
	db := authentication.GetDb()
	var plants []PlantModel
	var plant PlantModel
	vars := mux.Vars(r)
	id, hasPlantId := vars["id"]

	fmt.Printf("Handling plants request for %s\n", claims.Email)

	switch r.Method {
	case "GET":
		if hasPlantId {
			db.Where("email = ? AND id = ?", claims.Email, id).Find(&plant)
			json.NewEncoder(w).Encode(plant)
		} else {
			db.Where("email = ?", claims.Email).Find(&plants)
			json.NewEncoder(w).Encode(plants)
		}
		break
	case "DELETE":
		if !hasPlantId {
			authentication.WriteError(w, "Must provide id!", http.StatusBadRequest)
			break
		}
		db.Find(&plant, id)
		fmt.Printf("Deleting plant imageId=%d\n", plant.ImageId)
		db.Delete(&ImageModel{}, plant.ImageId)
		fmt.Printf("Deleting plant id=%d\n", plant.Id)
		db.Delete(&PlantModel{}, id)
		db.Where("email = ?", claims.Email).Find(&plants)
		json.NewEncoder(w).Encode(plants)
		break
	case "POST":
		var imageId = uploadHandler(w, r)
		if imageId == 0 {
			fmt.Println("Upload did not contain an image.")
		}
		var newPlant PlantModel
		newPlant.ImageId = imageId
		newPlant.Name = r.FormValue("nameOfPlant")
		newPlant.WateringFrequency = r.FormValue("wateringFrequency")
		newPlant.LastWaterDate = r.FormValue("lastWateredDate")
		fmt.Printf("Updating plant to: %s", newPlant)
		err := AddPlant(db, newPlant.Name, newPlant.WateringFrequency, newPlant.ImageId, newPlant.LastWaterDate, claims.Email)
		if err != nil {
			authentication.WriteError(w, err.Error(), 400)
			break
		}
		db.Where("email = ?", claims.Email).Find(&plants)

		json.NewEncoder(w).Encode(plants)
		break
	case "PUT":
		plantId, err := strconv.Atoi(r.FormValue("id"))
		var isNewImage = false
		if err != nil {
			authentication.WriteError(w, "Invalid plant ID", http.StatusBadRequest)
			return
		}
		var existingPlant PlantModel
		db.First(&existingPlant, plantId)
		var newPlant PlantModel
		var imageId = uploadHandler(w, r)
		if imageId == 0 {
			fmt.Println("Upload did not contain an image.")
			newPlant.ImageId = existingPlant.ImageId
		} else {
			// only update imageId if the user changed the image. Otherwise,
			// they may have only updated non-image stuff. If they had the
			// default image before, they'll still have it. If they didn't update
			// their image, then their plant has the old imageId.
			newPlant.ImageId = imageId
			isNewImage = true

		}
		newPlant.Name = r.FormValue("nameOfPlant")
		newPlant.WateringFrequency = r.FormValue("wateringFrequency")
		newPlant.LastWaterDate = r.FormValue("lastWateredDate")
		newPlant.Id = plantId
		fmt.Printf("Updating plant id=%d to: %s", newPlant.Id, newPlant)
		err = UpdatePlant(db, newPlant.Id, newPlant.Name, newPlant.WateringFrequency, newPlant.ImageId, newPlant.LastWaterDate, claims.Email, isNewImage)
		if err != nil {
			authentication.WriteError(w, err.Error(), 400)
			break
		}
		db.Where("email = ?", claims.Email).Find(&plants)
		json.NewEncoder(w).Encode(plants)
		break
	}

}
func dashboard(w http.ResponseWriter, r *http.Request, claims *authentication.JWTData) {
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
	router.HandleFunc("/api/dashboard", authentication.VerifiedOnly(dashboard)).Methods("GET", "POST", "PUT", "OPTIONS")
	router.HandleFunc("/api/plants", authentication.VerifiedOnly(plants)).Methods("GET", "POST", "PUT", "OPTIONS")
	router.HandleFunc("/api/plantsInfo", authentication.VerifiedOnly(plantsInfo)).Methods("POST", "OPTIONS")
	router.HandleFunc("/api/plants/{id:[0-9]+}", authentication.VerifiedOnly(plants)).Methods("GET", "POST", "DELETE", "PUT", "OPTIONS")
	router.HandleFunc("/api/images/{id:[0-9]+}", images).Methods("GET", "OPTIONS")
	router.HandleFunc("/ws", func(w http.ResponseWriter, r *http.Request) {
		serveWs(hub, w, r)
	})
}
