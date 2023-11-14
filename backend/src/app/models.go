package app

import (
	"errors"
	"fmt"
	"log"
	"time"

	"gorm.io/gorm"
)

type PlantLogModel struct {
	gorm.Model
	Id      int    `json:"id"`
	Log     string `json:"log"`
	PlantID int    `json:"plantId"`
}
type ImageModel struct {
	gorm.Model
	ID   uint
	Name string
	Data []byte
}

type CommentModel struct {
	gorm.Model
	Id       int    `json:"id"`
	PlantID  int    `json:"plantId"`
	Email    string `json:"-"`
	Username string `json:"username"`
	Content  string `json:"content"`
	Viewed   bool   `json:"viewed" gorm:"-"`
}

type NotesModel struct {
	gorm.Model
	Note    string `json:"note"`
	PlantID int    `json:"plantId"`
}
type PlantModel struct {
	gorm.Model
	Id                      int             `json:"id"`
	Email                   string          `json:"-"`
	Username                string          `json:"username"`
	Name                    string          `json:"name"`
	WateringFrequency       int             `json:"wateringFrequency"`
	FertilizingFrequency    int             `json:"fertilizingFrequency"`
	LastWaterDate           string          `json:"lastWaterDate"`
	LastFertilizeDate       string          `json:"lastFertilizeDate"`
	LastMoistDate           string          `json:"lastMoistDate"`
	LastWaterNotifyDate     string          `json:"lastWaterNotifyDate"`
	LastFertilizeNotifyDate string          `json:"lastFertilizeNotifyDate"`
	LastMoistNotifyDate     string          `json:"lastMoistNotifyDate"`
	SkippedLastFertilize    bool            `json:"skippedLastFertilize"`
	Tag                     string          `json:"tag"`
	ImageId                 int             `json:"imageId"`
	IsPublic                bool            `json:"isPublic"`
	DoNotify                bool            `json:"doNotify"`
	Logs                    []PlantLogModel `json:"logs" gorm:"foreignKey:PlantID"`
	Comments                []CommentModel  `json:"comments" gorm:"foreignKey:PlantID"`
	Notes                   []NotesModel    `json:"notes" gorm:"foreignKey:PlantID"`
}
type MessageModel struct {
	gorm.Model
	Id            int    `json:"id"`
	From          string `json:"from"`
	Timestamp     string `json:"timestamp"`
	Content       string `json:"content"`
	Channel       string `json:"channel"`
	PmUsername    string `json:"pmUsername"`
	Authenticated bool   `json:"authenticated"`
}

type UserCommentView struct {
	CommentID int
	Email     string
	ViewedAt  time.Time
}

// render a plant
func (i PlantModel) String() string {
	return fmt.Sprintf(
		"ID: %d, %d/%d/%d - %d:%d:%d, name=%s, waterFrequency=%d, fertilizeFrequency=%d, lastWateringDate=%s, lastFertlizeDate=%s, lastFertilizeNotifyDate=%s, lastWaterNotifyDate=%s, skippedLastFertilize=%v, username=%s, isPublic=%t, doNotify=%t\n",
		i.Id,
		i.CreatedAt.Year(),
		i.CreatedAt.Month(),
		i.CreatedAt.Day(),
		i.CreatedAt.Hour(),
		i.CreatedAt.Minute(),
		i.CreatedAt.Second(),
		i.Name,
		i.WateringFrequency,
		i.FertilizingFrequency,
		i.LastWaterDate,
		i.LastFertilizeDate,
		i.LastFertilizeNotifyDate,
		i.LastWaterNotifyDate,
		i.SkippedLastFertilize,
		i.Username,
		i.IsPublic,
		i.DoNotify,
	)
}

func deleteOldestPlantLog(db *gorm.DB, plant *PlantModel) error {
	var count int64
	result := db.Model(&PlantLogModel{}).Where("plant_id = ?", plant.Id).Count(&count)
	if result.Error != nil {
		return result.Error
	}

	if count > 10 {
		var oldestLogs []PlantLogModel
		result = db.Where("plant_id = ?", plant.Id).Order("created_at asc").Limit(int(count) - 10).Find(&oldestLogs)
		if result.Error != nil {
			return result.Error
		}

		for _, log := range oldestLogs {
			result = db.Delete(&log)
			if result.Error != nil {
				return result.Error
			}
		}
	} else {
		fmt.Printf("Don't need to delete yet, only have %d log entries.\n", count)
	}

	return nil
}

func addPlantLog(db *gorm.DB, plant *PlantModel, logMsg string) {
	deleteOldestPlantLog(db, plant)
	plantLog := PlantLogModel{
		Log: logMsg,
	}
	db.Model(plant).Association("Logs").Append(&plantLog)
}

func AddMessage(db *gorm.DB, message *Message) error {
	// Delete old records if the limit has been reached
	var count int64
	db.Model(&MessageModel{}).Count(&count)
	if count > 50 {
		fmt.Printf("DB has %d messages.", count)
		var messages []MessageModel
		db.Order("id asc").Limit(int(count) - 50).Find(&messages)
		db.Delete(&messages)
	}
	newDbMessage := MessageModel{
		From:          message.From,
		Timestamp:     message.Timestamp,
		Content:       message.Content,
		Channel:       message.Channel,
		PmUsername:    message.PmUsername,
		Authenticated: message.Authenticated,
	}
	err := db.Create(&newDbMessage).Error
	if err != nil {
		return err
	}
	db.Save(newDbMessage)
	return nil
}

func validatePlantInfo(plantName string, wateringFrequency int, lastWaterDate string, lastFertilizeDate string) error {
	if plantName == "" {
		return errors.New("Invalid plant name.")
	}
	if wateringFrequency == 0 {
		return errors.New("Invalid watering frequency.")
	}
	if lastWaterDate == "" {
		return errors.New("Invalid last watering date.")
	}
	if lastFertilizeDate == "" {
		return errors.New("Invalid last fertilize date.")
	}
	return nil
}

func UpdatePlant(db *gorm.DB,
	id int,
	name string,
	wateringFrequency int,
	fertilizingFrequency int,
	imageId int,
	lastWaterDate string,
	lastFertilizeDate string,
	lastMoistDate string,
	skippedLastFertilize bool,
	tag string,
	isNewImage bool,
	isPublic bool,
	doNotify bool,
) error {
	err := validatePlantInfo(name, wateringFrequency, lastWaterDate, lastFertilizeDate)
	if err != nil {
		return err
	}
	var existingplant PlantModel
	existingplant.Id = id
	db.Preload("Logs").First(&existingplant)
	fmt.Printf("Existing plant: %s\n", existingplant)
	// imageId exists by now since we process the image before calling this function to update the plant
	if existingplant.ImageId != 0 && isNewImage {
		fmt.Printf("isNewImage=%t, Must first remove old plant image ID=%d\n", isNewImage, existingplant.ImageId)
		db.Delete(&ImageModel{}, existingplant.ImageId)
	}

	if existingplant.LastWaterDate != lastWaterDate || existingplant.LastMoistDate != lastMoistDate {
		fmt.Println("Resetting LastWaterNotifyDate something has changed!")
		existingplant.LastWaterNotifyDate = ""
		lastMoistDate = ""
	}
	if existingplant.LastFertilizeDate != lastFertilizeDate {
		fmt.Println("Resetting LastFertilizeNotifyDate something has changed!")
		existingplant.LastFertilizeNotifyDate = ""
	}

	if existingplant.IsPublic != isPublic {
		logMsg := fmt.Sprintf("Plant changed from public=%t to public=%t", existingplant.IsPublic, isPublic)
		addPlantLog(db, &existingplant, logMsg)
	}
	if existingplant.Name != name {
		logMsg := fmt.Sprintf("Name changed from %s to %s", existingplant.Name, name)
		addPlantLog(db, &existingplant, logMsg)
	}
	if existingplant.LastMoistDate != lastMoistDate {
		logMsg := fmt.Sprintf("Last soil moist date changed from %s to %s", existingplant.LastMoistDate, lastMoistDate)
		addPlantLog(db, &existingplant, logMsg)
	}
	if existingplant.LastWaterDate != lastWaterDate {
		logMsg := fmt.Sprintf("Last water date changed from %s to %s", existingplant.LastWaterDate, lastWaterDate)
		addPlantLog(db, &existingplant, logMsg)
	}
	if existingplant.LastFertilizeDate != lastFertilizeDate {
		logMsg := ""
		if skippedLastFertilize {
			logMsg = fmt.Sprintf("Fertilizing skipped, last fertilize date changed from %s to %s", existingplant.LastFertilizeDate, lastFertilizeDate)
		} else {
			logMsg = fmt.Sprintf("Last fertilize date changed from %s to %s", existingplant.LastFertilizeDate, lastFertilizeDate)
		}
		addPlantLog(db, &existingplant, logMsg)
	}
	if existingplant.WateringFrequency != wateringFrequency {
		logMsg := fmt.Sprintf("Watering frequency changed from %d to %d days", existingplant.WateringFrequency, wateringFrequency)
		addPlantLog(db, &existingplant, logMsg)
	}
	if existingplant.Tag != tag {
		logMsg := fmt.Sprintf("Tag changed from %s to %s", existingplant.Tag, tag)
		addPlantLog(db, &existingplant, logMsg)
	}
	if existingplant.FertilizingFrequency != fertilizingFrequency {
		logMsg := fmt.Sprintf("Fertilizing frequency changed from %d to %d days", existingplant.FertilizingFrequency, fertilizingFrequency)
		addPlantLog(db, &existingplant, logMsg)
	}
	existingplant.DoNotify = doNotify
	existingplant.IsPublic = isPublic
	existingplant.ImageId = imageId
	existingplant.LastMoistDate = lastMoistDate
	existingplant.Name = name
	existingplant.Tag = tag
	existingplant.WateringFrequency = wateringFrequency
	existingplant.FertilizingFrequency = fertilizingFrequency
	existingplant.LastWaterDate = lastWaterDate
	existingplant.LastFertilizeDate = lastFertilizeDate
	existingplant.SkippedLastFertilize = skippedLastFertilize
	db.Save(existingplant)
	return nil
}

func AddPlant(db *gorm.DB,
	name string,
	wateringFrequency int,
	fertilizingFrequency int,
	imageId int,
	lastWaterDate string,
	lastFertilizeDate string,
	tag string,
	email string,
	username string,
	isPublic bool,
	doNotify bool,
) error {
	err := validatePlantInfo(name, wateringFrequency, lastWaterDate, lastFertilizeDate)
	if err != nil {
		return err
	}
	// Delete old records if the limit has been reached
	var count int64
	db.Model(&PlantModel{}).Count(&count)
	if count > 500 {
		fmt.Printf("DB has %d plants.", count)
		var plants []PlantModel
		db.Order("id asc").Limit(int(count) - 500).Find(&plants)
		db.Delete(&plants)
	}
	plant := PlantModel{
		Name:                    name,
		WateringFrequency:       wateringFrequency,
		FertilizingFrequency:    fertilizingFrequency,
		ImageId:                 imageId,
		Email:                   email,
		Username:                username,
		IsPublic:                isPublic,
		DoNotify:                doNotify,
		LastWaterDate:           lastWaterDate,
		LastFertilizeDate:       lastFertilizeDate,
		LastMoistDate:           "",
		LastWaterNotifyDate:     "",
		LastFertilizeNotifyDate: "",
		Tag:                     tag,
		Logs: []PlantLogModel{
			{Log: "Created plant!"},
		},
	}

	log.Printf("Adding plant %s", plant)

	err = db.Create(&plant).Error
	if err != nil {
		return err
	}
	db.Save(plant)
	return nil
}

func AddComment(db *gorm.DB, content string, email string, username string, plantId int) error {
	// Delete old records if the limit has been reached
	var count int64
	db.Model(&CommentModel{}).Count(&count)
	if count > 50 {
		fmt.Printf("DB has %d plants.", count)
		var comments []CommentModel
		db.Order("id asc").Limit(int(count) - 50).Find(&comments)
		db.Delete(&comments)
	}
	comment := &CommentModel{
		Content:  content,
		Username: username,
		Email:    email,
		PlantID:  plantId,
		Viewed:   false,
	}
	err := db.Create(&comment).Error
	if err != nil {
		return err
	}
	db.Save(comment)
	return nil
}

func InitModels(db *gorm.DB) {
	log.Printf("Initializing models...\n")
	db.AutoMigrate(&PlantModel{})
	db.AutoMigrate(&MessageModel{})
	db.AutoMigrate(&CommentModel{})
	db.AutoMigrate(&ImageModel{})
	db.AutoMigrate(&PlantLogModel{})
	db.AutoMigrate(&UserCommentView{})
	db.AutoMigrate(&NotesModel{})
}
