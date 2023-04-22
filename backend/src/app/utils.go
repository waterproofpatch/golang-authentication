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
func sendEmail(recipient string, plantName string, username string, needsFertilizer bool, needsWater bool) {
	fmt.Println("Building email...")
	args := []string{"/email_service/main.py", "--recipient", recipient, "--plant-name", plantName, "--username", username}
	if needsFertilizer {
		args = append(args, "--needs-fertilizer")
	}
	if needsWater {
		args = append(args, "--needs-water")
	}
	fmt.Println("About to send email...")
	cmd := exec.Command("/email_service/venv/bin/python", args...)
	fmt.Println("Sent email.")
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
	dateLayoutStr := "Mon Jan 02 2006"
	regex := regexp.MustCompile(`\s*\([^)]*\)`)

	for {
		select {
		case <-ticker.C:
			today := time.Now().UTC()
			var plants []PlantModel
			db.Find(&plants)

			for _, plant := range plants {
				if !plant.DoNotify {
					continue
				}
				lastWaterDateStr := regex.ReplaceAllString(plant.LastWaterDate, "")
				lastWaterDate, err := time.Parse(dateLayoutStr, lastWaterDateStr)
				if err != nil {
					fmt.Println("Error parsing lastWaterDate string:", err)
					break
				}
				nextWaterDate := lastWaterDate.AddDate(0, 0, plant.WateringFrequency)

				lastFertilizeDateStr := regex.ReplaceAllString(plant.LastFertilizeDate, "")
				lastFertilizeDate, err := time.Parse(dateLayoutStr, lastFertilizeDateStr)
				if err != nil {
					fmt.Println("Error parsing lastFertilizeDate string:", err)
					break
				}
				nextFertilizeDate := lastFertilizeDate.AddDate(0, 0, plant.FertilizingFrequency)

				var needsFertilize bool
				var needsWater bool

				if nextFertilizeDate.Before(today) {
					needsFertilize = true
				}
				if nextWaterDate.Before(today) {
					needsWater = true
				}

				// is the plant overdue for watering
				if needsFertilize || needsWater {
					if plant.LastNotifyDate == "" {
						fmt.Printf("Sending notification to owner of plant %s: %v!\n", plant.Name, plant.Email)
						sendEmail(plant.Email, plant.Name, plant.Username, needsFertilize, needsWater)
						plant.LastNotifyDate = today.String()
						db.Save(&plant)
					}
				}
			}
		case <-stopCh:
			// Stop the ticker and exit the goroutine
			fmt.Println("Stopping timer...")
			ticker.Stop()
			return
		}
	}
}
