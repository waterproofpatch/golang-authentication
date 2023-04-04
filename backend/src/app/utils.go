package app

import (
	"fmt"
	"os/exec"
	"regexp"
	"strconv"
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
						sendEmail(plant.Email, plant.Name, plant.Username)
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
