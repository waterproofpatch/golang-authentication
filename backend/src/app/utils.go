package app

import (
	"errors"
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
	alphanumeric := regexp.MustCompile(`^[a-zA-Z0-9_]{3,16}$`)
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

func getEstTimeNow() (time.Time, error) {
	today := time.Now().UTC()
	return getEstTime(today)
}

func getEstTime(theTime time.Time) (time.Time, error) {
	loc, err := time.LoadLocation("America/New_York")
	if err != nil {
		fmt.Printf("Failed finding location: %v\n", loc)
		return time.Now(), errors.New("Failed finding location %vn")
	}
	estTime := theTime.In(loc)
	return estTime, nil
}

func needsCare(lastCareDate string, intervalDays int) bool {
	dateLayoutStr := "01/02/2006"
	fmt.Printf("lastCareDate=%v\n", lastCareDate)
	lastCareTime, err := time.Parse(dateLayoutStr, lastCareDate)
	if err != nil {
		// attempt format migration
		fmt.Println("Error parsing lastCareDate string:", err)
		inputDateLayout := "Mon Jan 02 2006"

		date, err := time.Parse(inputDateLayout, lastCareDate)
		if err != nil {
			// handle error
			fmt.Println("Cannot migrate from", lastCareDate)
			return false
		} else {

			fmt.Println("Migrating format from", lastCareDate)
			// check/debug new date and see if it is in the format we want
			outputDateStr := date.Format(dateLayoutStr)
			fmt.Println("New date string after conversion: ", outputDateStr)
			lastCareTime = date
		}
	}
	if err != nil {
		fmt.Printf("Failed converting last care time to est")
		return false
	}
	fmt.Printf("lastCareTime=%v\n", lastCareTime)
	timeNow := time.Now()
	fmt.Printf("timeNow=%v\n", timeNow)
	timeNowEst, err := getEstTime(timeNow)
	fmt.Printf("timeNowEst=%v\n", timeNowEst)
	nextCareTime := lastCareTime.AddDate(0, 0, intervalDays)
	fmt.Printf("nextCareTime=%v\n", nextCareTime)
	if nextCareTime.Before(timeNowEst) {
		fmt.Printf("Needs care: last care time: %v, next care time: %v, today is %v\n", lastCareTime, nextCareTime, timeNowEst)
		return true
	}
	return false
}

func StartTimer(stopCh chan bool, db *gorm.DB) {
	// Create a ticker that ticks every 5 seconds
	ticker := time.NewTicker(5 * time.Second)

	for {
		select {
		case <-ticker.C:
			var plants []PlantModel
			db.Find(&plants)

			for _, plant := range plants {
				if !plant.DoNotify {
					continue
				}
				// if a notification has not been set since the last
				// time the plant care date(s) have changed, check if we need
				// to send a notification
				if plant.LastNotifyDate == "" {
					fmt.Printf("Checking if plant %d (name=%s) needs care...\n", plant.Id, plant.Name)
					needsWaterCare := needsCare(plant.LastWaterDate, plant.WateringFrequency)
					needsFertilizeCare := needsCare(plant.LastFertilizeDate, plant.FertilizingFrequency)

					// is the plant overdue for watering
					if needsFertilizeCare || needsWaterCare {
						fmt.Printf("Sending notification to owner of plant %s: %v!\n", plant.Name, plant.Email)
						sendEmail(plant.Email,
							plant.Name,
							plant.Username,
							needsFertilizeCare,
							needsWaterCare)
						tmpDate, err := getEstTimeNow()
						if err != nil {
							fmt.Printf("failed getting estTime\n")
						} else {
							plant.LastNotifyDate = tmpDate.String()
						}

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
