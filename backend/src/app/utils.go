package app

import (
	"fmt"
	"os/exec"
	"regexp"
	"time"

	"gorm.io/gorm"
)

// format the date and time.
func formattedTime() string {
	est := time.FixedZone("EST", -5*60*60)

	currentTime := time.Now().In(est)

	return currentTime.Format("01/02/2006  03:04:05 PM (EST)")
}

func isValidInput(input string) bool {
	var alphanumeric = regexp.MustCompile(`^[a-zA-Z0-9_]{3,16}$`)
	return alphanumeric.MatchString(input)
}

// execute the python script 'main.py' in /email_service to send an email
func sendEmail(recpient string, plantName string, username string) {
	cmd := exec.Command("/email_service/venv/bin/python", "/email_service/main.py", "--recipient", recpient, "--plant-name", plantName, "--username", username)
	stdout, err := cmd.Output()
	if err != nil {
		fmt.Println(string(stdout))
		fmt.Println(err.Error())
		return
	}
	fmt.Println(string(stdout))
}

func StartTimer(stopCh chan bool, db *gorm.DB) {
	// Create a ticker that ticks every 5 seconds
	ticker := time.NewTicker(5 * time.Second)

	for {
		select {
		case <-ticker.C:
			currentDate := time.Now().UTC()
			var plants []PlantModel
			db.Find(&plants)
			for _, plant := range plants {
				// fmt.Printf("checking watering notifications for %v", plant)
				if !plant.DoNotify {
					// fmt.Printf("Plant notifications turned off. Skipping\n")
					continue
				}
				regex := regexp.MustCompile(`\s*\([^)]*\)`)
				lastWaterDateStr := regex.ReplaceAllString(plant.LastWaterDate, "")
				lastWaterDateLayout := "Mon Jan 02 2006"
				lastWaterDate, err := time.Parse(lastWaterDateLayout, lastWaterDateStr)
				if err != nil {
					fmt.Println("Error parsing lastWaterDate string:", err)
					break
				}
				nextWaterDate := lastWaterDate.AddDate(0, 0, plant.WateringFrequency)
				today := time.Now().UTC()

				// is the plant overdue for watering
				if nextWaterDate.Before(today) {
					if plant.LastNotifyDate == "" {

						fmt.Printf("Sending notification to %v!\n", plant.Email)
						sendEmail(plant.Email, plant.Name, plant.Username)
						plant.LastNotifyDate = currentDate.String()
						db.Save(&plant)
					} else {
						// fmt.Printf("Notification already sent on %v\n", plant.LastNotifyDate)
					}
				} else {
					// fmt.Printf("Next watering date is in the future: %v\n", nextWaterDate)
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
