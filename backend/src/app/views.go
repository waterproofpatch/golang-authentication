package app

import (
	"bytes"
	"encoding/json"
	"fmt"
	"image"
	"image/jpeg"
	"io/ioutil"
	"net/http"
	"os"
	"strconv"
	"time"

	"github.com/waterproofpatch/go_authentication/authentication"

	"github.com/gorilla/mux"
)

func getApiKey() string {
	apiKey := os.Getenv("OPENAI_API_KEY")
	return apiKey
}

// returns -1 on failure, 0 on no-op, ImageModel.ID stored in database on success
func uploadHandler(w http.ResponseWriter, r *http.Request) int {
	// Parse the multipart form in the request
	err := r.ParseMultipartForm(10 << 20) // 10 MB maximum file size
	if err != nil {
		authentication.WriteError(w, "Invalid file size", http.StatusBadRequest)
		return -1
	}

	// Get the image file from the form data
	file, _, err := r.FormFile("image")
	if err != nil {
		// not critical, images are optional
		return 0
	}
	defer file.Close()

	// Read the file data into a byte slice
	fileData, err := ioutil.ReadAll(file)
	if err != nil {
		authentication.WriteError(w, "Failed reading image.", http.StatusBadRequest)
		return -1
	}

	// Print the original file size
	fmt.Printf("Original file size: %d bytes\n", len(fileData))

	// Decode the image data into an image.Image
	img, _, err := image.Decode(bytes.NewReader(fileData))
	if err != nil {
		authentication.WriteError(w, "Failed decoding image.", http.StatusBadRequest)
		return -1
	}

	// Create a new buffer to hold the compressed image data
	var buf bytes.Buffer

	// Compress the image using the jpeg.Encode function
	err = jpeg.Encode(&buf, img, &jpeg.Options{Quality: 75})
	if err != nil {
		authentication.WriteError(w, "Failed compressing image.", http.StatusBadRequest)
		return -1
	}

	// Get the compressed image data as a byte slice
	compressedFileData := buf.Bytes()

	// Print the compressed file size
	fmt.Printf("Compressed file size: %d bytes\n", len(compressedFileData))

	// Open a connection to the database
	db := authentication.GetDb()

	// Create a new Image instance and set its fields
	image := ImageModel{
		Name: "image.jpg",
		Data: compressedFileData,
	}

	// Insert the record into the database
	result := db.Create(&image)
	if result.Error != nil {
		authentication.WriteError(w, "Failed writing image to db", http.StatusBadRequest)
		return -1
	}

	// Return a success message
	fmt.Println("Stored image successfully.")
	return int(image.ID)
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

// get the version information from the environment for displaying to the frontend
func version(w http.ResponseWriter, r *http.Request) {
	// see docker-compose.dev
	version := os.Getenv("SITE_TIMESTAMP")

	dict := map[string]string{
		"version": version,
	}

	err := json.NewEncoder(w).Encode(dict)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
}

func plants(w http.ResponseWriter, r *http.Request, claims *authentication.JWTData) {
	db := authentication.GetDb()
	var plants []PlantModel
	var plant PlantModel
	vars := mux.Vars(r)
	id, hasPlantId := vars["id"]

	switch r.Method {
	case "GET":
		if hasPlantId {
			result := db.Where("id = ?", id).Preload("Logs").Preload("Comments").Find(&plant)
			fmt.Printf("%d record(s) found\n", result.RowsAffected)
			json.NewEncoder(w).Encode(plant)
			return
		}
	case "DELETE":
		if claims == nil {
			authentication.WriteError(w, "Must be logged in to delete plants.", http.StatusUnauthorized)
			return
		}
		if !hasPlantId {
			authentication.WriteError(w, "Must provide id!", http.StatusBadRequest)
			break
		}
		db.Find(&plant, id)
		if claims != nil && plant.Email != claims.Email {
			fmt.Printf("User %s tried deleting plant belonging to %s\n", claims.Email, plant.Email)
			authentication.WriteError(w, "This isn't your plant!", http.StatusBadRequest)
			return
		}
		fmt.Printf("Deleting plant imageId=%d\n", plant.ImageId)
		db.Delete(&ImageModel{}, plant.ImageId)
		fmt.Printf("Deleting plant id=%d\n", plant.Id)
		db.Delete(&PlantModel{}, id)
		break
	case "POST":
		if claims == nil {
			authentication.WriteError(w, "Must be logged in to add plants.", http.StatusUnauthorized)
			return
		}
		imageId := uploadHandler(w, r)
		if imageId == 0 {
			fmt.Println("Upload did not contain an image.")
		}
		if imageId < 0 {
			fmt.Println("Bailing early, critical error handling image.")
			return
		}
		var newPlant PlantModel
		newPlant.ImageId = imageId
		newPlant.Name = r.FormValue("nameOfPlant")
		newPlant.Tag = r.FormValue("tag")
		newPlant.WateringFrequency, _ = strconv.Atoi(r.FormValue("wateringFrequency"))
		newPlant.FertilizingFrequency, _ = strconv.Atoi(r.FormValue("fertilizingFrequency"))
		newPlant.LastWaterDate = r.FormValue("lastWateredDate")
		newPlant.LastFertilizeDate = r.FormValue("lastFertilizeDate")
		doNotify, err := strconv.ParseBool(r.FormValue("doNotify"))
		if err != nil {
			// handle error
			authentication.WriteError(w, "Invalid notification setting.", http.StatusBadRequest)
			return
		}
		newPlant.DoNotify = doNotify
		isPublic, err := strconv.ParseBool(r.FormValue("isPublic"))
		if err != nil {
			// handle error
			authentication.WriteError(w, "Invalid public/private setting.", http.StatusBadRequest)
			return
		}
		newPlant.IsPublic = isPublic

		fmt.Printf("Adding plant as: %v", newPlant)
		err = AddPlant(db,
			newPlant.Name,
			newPlant.WateringFrequency,
			newPlant.FertilizingFrequency,
			newPlant.ImageId,
			newPlant.LastWaterDate,
			newPlant.LastFertilizeDate,
			newPlant.Tag,
			claims.Email,
			claims.Username,
			newPlant.IsPublic,
			newPlant.DoNotify)
		if err != nil {
			authentication.WriteError(w, err.Error(), 400)
			return
		}
		break
	case "PUT":
		if claims == nil {
			authentication.WriteError(w, "Must be logged in to edit plants.", http.StatusUnauthorized)
			return
		}
		plantId, err := strconv.Atoi(r.FormValue("id"))
		isNewImage := false
		if err != nil {
			authentication.WriteError(w, "Invalid plant ID", http.StatusBadRequest)
			return
		}

		// get the existing plant so we can obtain its old imageId
		var existingPlant PlantModel
		db.First(&existingPlant, plantId)
		if existingPlant.Email != claims.Email {
			fmt.Printf("User %s tried editing plant belonging to %s\n", claims.Email, existingPlant.Email)
			authentication.WriteError(w, "This isn't your plant!", http.StatusBadRequest)
			return
		}

		// make a new plant based on form values
		var newPlant PlantModel

		// conditionally upload a new image. An imageId of 0 means no image provided
		imageId := uploadHandler(w, r)

		if imageId == 0 {
			fmt.Println("Upload did not contain an image.")
			newPlant.ImageId = existingPlant.ImageId
		} else if imageId < 0 {
			fmt.Println("Critical error updating image. Bailing early")
			return
		} else {
			// only update imageId if the user changed the image. Otherwise,
			// they may have only updated non-image stuff. If they had the
			// default image before, they'll still have it. If they didn't update
			// their image, then their plant has the old imageId.
			newPlant.ImageId = imageId
			isNewImage = true

		}
		moistValue := r.URL.Query().Get("moist")

		// update the last moist date. the frontend can tell the user when to check next.
		if moistValue == "true" {
			fmt.Printf("Marking plant %d as moist and updating last notify date.\n", plant.ID)
			currentTime := time.Now()
			formattedTime := currentTime.Format("01/02/2006")
			existingPlant.LastMoistDate = formattedTime
			addPlantLog(db, &existingPlant, "Plant soil marked as moist.")
			db.Save(&existingPlant)
			break
		}
		// update to new values
		newPlant.Name = r.FormValue("nameOfPlant")
		newPlant.Tag = r.FormValue("tag")
		newPlant.WateringFrequency, _ = strconv.Atoi(r.FormValue("wateringFrequency"))
		newPlant.FertilizingFrequency, _ = strconv.Atoi(r.FormValue("fertilizingFrequency"))
		newPlant.LastWaterDate = r.FormValue("lastWateredDate")
		newPlant.LastFertilizeDate = r.FormValue("lastFertilizeDate")
		newPlant.LastMoistDate = r.FormValue("lastMoistDate")
		newPlant.Notes = r.FormValue("notes")
		newPlant.SkippedLastFertilize, err = strconv.ParseBool(r.FormValue("skippedLastFertilize"))
		if err != nil {
			authentication.WriteError(w, "Invalid skipped last fertilize date setting", http.StatusBadRequest)
			return
		}

		doNotify, err := strconv.ParseBool(r.FormValue("doNotify"))
		if err != nil {
			// handle error
			authentication.WriteError(w, "Invalid public/private setting.", http.StatusBadRequest)
			return
		}
		newPlant.DoNotify = doNotify
		isPublic, err := strconv.ParseBool(r.FormValue("isPublic"))
		if err != nil {
			// handle error
			authentication.WriteError(w, "Invalid public/private setting.", http.StatusBadRequest)
			return
		}
		newPlant.IsPublic = isPublic

		// copy old values
		newPlant.Id = existingPlant.Id
		newPlant.Username = existingPlant.Username
		newPlant.Email = existingPlant.Email
		fmt.Printf("Updating plant id=%d to: %s", newPlant.Id, newPlant)

		err = UpdatePlant(db,
			newPlant.Id,
			newPlant.Name,
			newPlant.WateringFrequency,
			newPlant.FertilizingFrequency,
			newPlant.ImageId,
			newPlant.LastWaterDate,
			newPlant.LastFertilizeDate,
			newPlant.LastMoistDate,
			newPlant.SkippedLastFertilize,
			newPlant.Tag,
			isNewImage,
			newPlant.IsPublic,
			newPlant.DoNotify,
			newPlant.Notes)
		if err != nil {
			authentication.WriteError(w, err.Error(), 400)
			return
		}
		break
	}
	if claims != nil {
		db.Where("email = ? OR is_public = ?", claims.Email, true).Preload("Logs").Preload("Comments").Find(&plants)

		for i := range plants {
			for j := range plants[i].Comments {
				var count int64
				// if the plant is ours and we have not yet seen this comment...
				// TODO is this even necessary
				if !plants[i].Comments[j].Viewed && claims.Email == plants[i].Email {
					count += 1
				}
			}
		}
	} else {
		db.Where("is_public = ?", true).Preload("Logs").Preload("Comments").Find(&plants)
	}
	fmt.Printf("Encoding %d plants in response\n", len(plants))
	json.NewEncoder(w).Encode(plants)
}

func comments(w http.ResponseWriter, r *http.Request, claims *authentication.JWTData) {
	w.Header().Set("Content-Type", "application/json")

	vars := mux.Vars(r)
	db := authentication.GetDb()
	plantId := "0"

	switch r.Method {
	case "GET":
		plantId = r.URL.Query().Get("plantId")
		break

	case "DELETE":
		commentId, hasCommentId := vars["id"]
		if !hasCommentId {
			authentication.WriteError(w, "Invalid commentId ID", http.StatusBadRequest)
			return
		}
		if claims == nil {
			authentication.WriteError(w, "Must be logged in to delete comments.", http.StatusUnauthorized)
			return
		}
		var comment CommentModel
		var plant PlantModel
		db.Where("id = ?", commentId).First(&comment)
		db.Where("id = ?", comment.PlantID).First(&plant)

		// users should be able to delete comments by others for their plant
		if plant.Email != claims.Email && comment.Email != claims.Email {
			authentication.WriteError(w, "This isn't your comment, nor a comment on your plant!", http.StatusBadRequest)
			return
		}

		db.Delete(&comment)

		plantId = strconv.Itoa(plant.Id)
	case "POST":
		if claims == nil {
			authentication.WriteError(w, "Must be logged in to post comments.", http.StatusUnauthorized)
			return
		}

		// Declare a new Comment struct.
		var comment CommentModel
		var plant PlantModel

		// Try to decode the request body into the struct. If there is an error,
		// respond to the client with the error message and a 400 status code.
		err := json.NewDecoder(r.Body).Decode(&comment)
		if err != nil {
			fmt.Printf("Error decoding comment: %v\n", err)
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		fmt.Printf("comment received: %v for plantId=%d", comment, comment.PlantID)

		// make sure the plant is public
		db.Where("id = ?", comment.PlantID).First(&plant)
		if !plant.IsPublic && plant.Email != claims.Email {
			authentication.WriteError(w, "This plant is not public and also not yours, you cannot comment on it!", http.StatusBadRequest)
			return
		}

		AddComment(db, comment.Content, claims.Email, claims.Username, comment.PlantID)
		plantId = strconv.Itoa(plant.Id)
	}
	fmt.Printf("getting comments for plantId=%v", plantId)
	var comments []CommentModel
	var plant PlantModel
	db.Where("plant_id = ?", plantId).Find(&comments)
	db.Where("id = ?", plantId).Find(&plant)

	// update all comments here as viewed if the plant the comments are for is the owners plant
	if claims != nil {
		if plant.Email == claims.Email {
			fmt.Println("Owner of the plant is viewing comments, marking as viewed...")
			for i := range comments {
				comments[i].Viewed = true
				db.Save(&comments[i])
			}
		}
	}
	json.NewEncoder(w).Encode(comments)
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

func InitViews(router *mux.Router) {
	router.HandleFunc("/api/dashboard/{id:[0-9]+}", authentication.VerifiedOnly(dashboard, false)).Methods("GET", "POST", "PUT", "DELETE", "OPTIONS")
	router.HandleFunc("/api/dashboard", authentication.VerifiedOnly(dashboard, false)).Methods("GET", "POST", "PUT", "OPTIONS")
	router.HandleFunc("/api/comments/{id:[0-9]+}", authentication.VerifiedOnly(comments, true)).Methods("GET", "POST", "PUT", "DELETE", "OPTIONS")
	router.HandleFunc("/api/comments", authentication.VerifiedOnly(comments, true)).Methods("GET", "POST", "PUT", "DELETE", "OPTIONS")
	router.HandleFunc("/api/plants", authentication.VerifiedOnly(plants, true)).Methods("GET", "POST", "PUT", "OPTIONS")
	router.HandleFunc("/api/plants/{id:[0-9]+}", authentication.VerifiedOnly(plants, true)).Methods("GET", "POST", "DELETE", "PUT", "OPTIONS")
	router.HandleFunc("/api/images/{id:[0-9]+}", images).Methods("GET", "OPTIONS")
	router.HandleFunc("/api/version", version).Methods("GET", "OPTIONS")
}
