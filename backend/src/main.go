// entry point to golang server.
package main

import (
	"app/app"
	"fmt"
	"log"
	"net/http"
	"os"
	"regexp"
	"strconv"
	"time"

	"github.com/waterproofpatch/go_authentication/authentication"
	"gorm.io/gorm"

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
	log.Printf("Starting server on http://%s...", portStr)

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

func startTimer(stopCh chan bool, db *gorm.DB) {
	// Create a ticker that ticks every 5 seconds
	ticker := time.NewTicker(5 * time.Second)

	for {
		select {
		case <-ticker.C:
			fmt.Println("Function executed at", time.Now())
			var plants []app.PlantModel
			db.Find(&plants)
			for _, plant := range plants {
				fmt.Printf("checking watering notifications for %v", plant)
				regex := regexp.MustCompile(`\s*\([^)]*\)`)
				lastWaterDateStr := regex.ReplaceAllString(plant.LastWaterDate, "")
				notifyDateStr := regex.ReplaceAllString(plant.LastNotifyDate, "")
				lastWaterDateLayout := "Mon Jan 02 2006 15:04:05 MST-0700"
				lastNotifyDateLayout := "2006-01-02 15:04:05.999999999 -0700 MST"
				lastWaterDate, err := time.Parse(lastWaterDateLayout, lastWaterDateStr)
				if err != nil {
					fmt.Println("Error parsing lastWaterDate string:", err)
					break
				}
				notifyDate, err := time.Parse(lastNotifyDateLayout, notifyDateStr)
				if err != nil {
					fmt.Println("Error parsing lastNotifyDate string:", err)
					break
				}

				wateringFrequency, err := strconv.Atoi(plant.WateringFrequency)
				if err != nil {
					fmt.Println("Error converting string to integer:", err)
					return
				}

				nextWaterDate := lastWaterDate.AddDate(0, 0, wateringFrequency)
				fmt.Printf("Next watering date: %v\n", nextWaterDate)
				today := time.Now().UTC()
				if nextWaterDate.Before(today) {
					fmt.Printf("next water date is before today=%v\n", nextWaterDate)
					currentDate := time.Now().UTC()
					diff := currentDate.Sub(notifyDate).Hours()
					fmt.Printf("lastNotifyDate=%v", notifyDate)
					fmt.Printf("It's been %v hours since last notification\n", diff)
					if diff > 24 {
						fmt.Printf("notify!\n")
						plant.LastNotifyDate = currentDate.String()
						db.Save(&plant)
					}

				}

			}
			// for each plant, check if it's time to water it
		case <-stopCh:
			// Stop the ticker and exit the goroutine
			fmt.Println("Stopping timer...")
			ticker.Stop()
			return
		}
	}
}

// main is the entrypoint to the program.
func main() {
	log.Printf("Starting...")
	stopCh := make(chan bool)

	// Stop the function by sending a message to the channel
	// stopCh <- true

	var router = makeRouter()
	var dropTables = false
	var port = DEFAULT_PORT
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
	authentication.Init(os.Getenv("SECRET"),
		os.Getenv("DEFAULT_ADMIN_EMAIL"),
		os.Getenv("DEFAULT_ADMIN_USERNAME"),
		os.Getenv("DEFAULT_ADMIN_PASSWORD"),
		router,
		os.Getenv("DATABASE_URL"),
		dropTables,
		false)

	var db = authentication.GetDb()

	app.InitViews(router)
	app.InitModels(db)

	// Run the function in a goroutine
	go startTimer(stopCh, db)

	startServing(port, router)
}
