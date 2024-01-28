package app

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"image"
	"image/jpeg"
	"io/ioutil"
	"net/http"
	"os"
	"os/exec"
	"regexp"
	"time"
	_ "time/tzdata"

	"github.com/waterproofpatch/go_authentication/authentication"
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

// execute the python script 'plant_care_driver.py' in /email_service to send an email
func sendEmail(plant *PlantModel, needsFertilizer bool, needsWater bool) {
	fmt.Println("Building email...")
	args := []string{"/email_service/plant_care_driver.py", "--recipient", plant.Email, "--plant-name", plant.Name, "--username", plant.Username}
	if needsFertilizer {
		args = append(args, "--needs-fertilizer")
	}
	if needsWater {
		args = append(args, "--needs-water")
	}
	cmd := exec.Command("/email_service/venv/bin/python", args...)
	stdout, err := cmd.CombinedOutput()
	if err != nil {
		fmt.Println(string(stdout), err.Error())
		return
	}
	fmt.Println(string(stdout))
	tmpDate, err := getEstTimeNow()
	if err != nil {
		fmt.Printf("failed getting estTime\n")
		return
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
	// email reminders should be sent as reminders, not alerts - so
	// add a few days after the last care date to send reminders.
	nextCareTime := lastCareTime.AddDate(0, 0, intervalDays+3)
	if nextCareTime.Before(timeNowEst) {
		fmt.Printf("Needs care: last care time: %v, next care time: %v, today is %v\n", lastCareTime, nextCareTime, timeNowEst)
		return true
	}
	return false
}

func StartTimer(stopCh chan bool, db *gorm.DB) {
	// Create a ticker that ticks every 5 seconds
	// this is bugged, and appears to be causing plants not to
	// persist last water dates
	return
	// ticker := time.NewTicker(5 * time.Second)

	// for {
	// 	select {
	// 	case <-ticker.C:
	// 		// fmt.Printf("Tick...\n")
	// 		var plants []PlantModel
	// 		db.Find(&plants)

	// 		for _, plant := range plants {
	// 			if !plant.DoNotify {
	// 				continue
	// 			}
	// 			needsWaterCare := false
	// 			needsFertilizeCare := false
	// 			if plant.LastMoistDate != "" && plant.LastMoistNotifyDate == "" {
	// 				// fmt.Printf("Plant was marked as moist on %s\n", plant.LastMoistDate)
	// 				// Parse the date string into a time.Time object
	// 				date, err := time.Parse("01/02/2006", plant.LastMoistDate)
	// 				if err != nil {
	// 					panic(err)
	// 				}
	// 				// Calculate the duration between the current time and the date
	// 				duration := time.Since(date)

	// 				// moist checks are daily, for now
	// 				if duration > 24*time.Hour {
	// 					needsWaterCare = true
	// 				}
	// 			}
	// 			// if a notification has not been set since the last
	// 			// time the plant care date(s) have changed, check if we need
	// 			// to send a notification
	// 			if plant.LastWaterNotifyDate == "" {
	// 				// fmt.Printf("Checking if plant %d (name=%s) needs water care...\n", plant.Id, plant.Name)
	// 				needsWaterCare = needsCare(plant.LastWaterDate, plant.WateringFrequency)
	// 			}
	// 			if plant.LastFertilizeNotifyDate == "" {
	// 				if plant.FertilizingFrequency > 0 {
	// 					// fmt.Printf("Checking if plant %d (name=%s) needs fertilizer care...\n", plant.Id, plant.Name)
	// 					needsFertilizeCare = needsCare(plant.LastFertilizeDate, plant.FertilizingFrequency)
	// 				}
	// 			}
	// 			// is the plant overdue for watering
	// 			if needsFertilizeCare || needsWaterCare {
	// 				fmt.Printf("LastFertilizeNotifyDate=%s\n", plant.LastFertilizeNotifyDate)
	// 				fmt.Printf("LastWaterNotifyDate=%s\n", plant.LastWaterNotifyDate)
	// 				fmt.Printf("Sending notification to owner of plant %d (name=%s): %v (needsWaterCare=%v, needsFertilizeCare=%v)!\n", plant.ID, plant.Name, plant.Email, needsWaterCare, needsFertilizeCare)
	// 				sendEmail(&plant,
	// 					needsFertilizeCare,
	// 					needsWaterCare)
	// 				db.Save(&plant)
	// 			}
	// 		}
	// 	case <-stopCh:
	// 		// Stop the ticker and exit the goroutine
	// 		fmt.Println("Stopping timer...")
	// 		ticker.Stop()
	// 		return
	// 	}
	// }
}

// returns -1 on failure, 0 on no-op, ImageModel.ID stored in database on success
func ImageUploadHandler(w http.ResponseWriter, r *http.Request) int {
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

// send a generic email message
func sendGenericEmail(email string, content string) {
	go func() {
		args := []string{"/email_service/generic_driver.py", "--recipient", email, "--content", content, "--subject", "Verify your account"}
		cmd := exec.Command("/email_service/venv/bin/python", args...)
		stdout, err := cmd.CombinedOutput()
		if err != nil {
			fmt.Println(string(stdout), err.Error())
			return
		}
		fmt.Println(string(stdout))
	}()
}

// handle user requesting password reset
func ResetPasswordCallback(email string, resetCode string) error {
	fmt.Printf("resetPasswordCallback for %v", email)
	// the backend will redirect
	url := fmt.Sprintf("https://www.plantmindr.com/authentication?mode=performPasswordReset&resetCode=%s", resetCode)
	if os.Getenv("DEBUG") == "true" {
		url = fmt.Sprintf("http://localhost:4200/authentication?mode=performPasswordReset&resetCode=%s", resetCode)
	}
	// Craft the email content
	emailContent := fmt.Sprintf(`Hello,
You requested a password reset. Click the link below to reset your password:
%s`, url)

	sendGenericEmail(email, emailContent)
	return nil
}

func RegistrationCallback(email string, verificationCode string) error {
	fmt.Printf("registrationCallback for %v", email)
	// the backend will redirect
	url := fmt.Sprintf("https://strider.azurewebsites.net/api/verify?code=%s&email=%s", verificationCode, email)
	if os.Getenv("DEBUG") == "true" {
		url = fmt.Sprintf("http://localhost:5000/api/verify?code=%s&email=%s", verificationCode, email)
	}
	// Craft the email content
	emailContent := fmt.Sprintf(`Hello,

Thank you for registering with us. We're excited to have you on board!

To verify your account, please click the link below:

%s

If you did not request this, please ignore this email.

Your friends at
plantmindr.com`, url)

	sendGenericEmail(email, emailContent)
	return nil
}

// write an HTTP JSON response message
func WriteResponse(w http.ResponseWriter, message string, status int, code ResponseCode) {
	w.Header().Set("content-type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(&HttpResponse{Message: message, Code: code})
}
