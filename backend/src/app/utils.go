package app

import (
	"errors"
	"fmt"
	"os/exec"
	"regexp"
	"time"
	_ "time/tzdata"

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
func sendEmail(
	plant *PlantModel,
	needsFertilizer bool,
	needsWater bool,
) {
	fmt.Println("Building email...")
	args := []string{"/email_service/main.py", "--recipient", plant.Email, "--plant-name", plant.Name, "--username", plant.Username}
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
	tmpDate, err := getEstTimeNow()
	if err != nil {
		fmt.Printf("failed getting estTime\n")
	}
	if needsFertilizer {
		fmt.Printf("Updating last fertilize notify date (%s)", plant.LastFertilizeNotifyDate)
		plant.LastFertilizeNotifyDate = tmpDate.String()
	}
	if needsWater {
		fmt.Printf("Updating last water and moist notify dates (%s, %s)", plant.LastWaterNotifyDate, plant.LastMoistNotifyDate)
		plant.LastWaterNotifyDate = tmpDate.String()
		plant.LastMoistNotifyDate = tmpDate.String()
	}
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
		inputDateLayouts := []string{"Mon Jan 2 2006", "Mon Jan 02 2006"}

		var date time.Time
		for _, layout := range inputDateLayouts {
			date, err = time.Parse(layout, lastCareDate)
			if err == nil {
				break
			}
		}

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
	timeNow := time.Now()
	timeNowEst, err := getEstTime(timeNow)
	fmt.Printf("timeNowEst=%v\n", timeNowEst)
	// email reminders should be sent as reminders, not alerts - so
	// add a day after the last care date to send reminders.
	nextCareTime := lastCareTime.AddDate(0, 0, intervalDays+1)
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
			fmt.Printf("Tick...\n")
			var plants []PlantModel
			db.Find(&plants)

			for _, plant := range plants {
				if !plant.DoNotify {
					continue
				}
				needsWaterCare := false
				needsFertilizeCare := false
				if plant.LastMoistDate != "" && plant.LastMoistNotifyDate == "" {
					fmt.Printf("Plant was marked as moist on %s\n", plant.LastMoistDate)
					// Parse the date string into a time.Time object
					date, err := time.Parse("01/02/2006", plant.LastMoistDate)
					if err != nil {
						panic(err)
					}
					// Calculate the duration between the current time and the date
					duration := time.Since(date)

					// moist checks are daily, for now
					if duration > 24*time.Hour {
						needsWaterCare = true
					}
				}
				// if a notification has not been set since the last
				// time the plant care date(s) have changed, check if we need
				// to send a notification
				if plant.LastWaterNotifyDate == "" {
					fmt.Printf("Checking if plant %d (name=%s) needs water care...\n", plant.Id, plant.Name)
					needsWaterCare = needsCare(plant.LastWaterDate, plant.WateringFrequency)
				}
				if plant.LastFertilizeNotifyDate == "" {
					if plant.FertilizingFrequency > 0 {
						fmt.Printf("Checking if plant %d (name=%s) needs fertilizer care...\n", plant.Id, plant.Name)
						needsFertilizeCare = needsCare(plant.LastFertilizeDate, plant.FertilizingFrequency)
					}
				}
				// is the plant overdue for watering
				if needsFertilizeCare || needsWaterCare {
					fmt.Printf("LastFertilizeNotifyDate=%s\n", plant.LastFertilizeNotifyDate)
					fmt.Printf("LastWaterNotifyDate=%s\n", plant.LastWaterNotifyDate)
					fmt.Printf("Sending notification to owner of plant %d (name=%s): %v (needsWaterCare=%v, needsFertilizeCare=%v)!\n", plant.Id, plant.Name, plant.Email, needsWaterCare, needsFertilizeCare)
					sendEmail(&plant,
						needsFertilizeCare,
						needsWaterCare)
					db.Save(&plant)
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
