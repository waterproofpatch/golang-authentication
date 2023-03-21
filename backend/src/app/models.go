package app

import (
	"errors"
	"fmt"
	"log"

	"gorm.io/gorm"
)

type ImageModel struct {
	gorm.Model
	ID   uint
	Name string
	Data []byte
}

type CommentModel struct {
	gorm.Model
	Id       int    `json:"id"`
	PlantId  int    `json:"plantId"`
	Email    string `json:"email"`
	Username string `json:"username"`
	Content  string `json:"content"`
}
type PlantModel struct {
	gorm.Model
	Id                int    `json:"id"`
	Email             string `json:"email"`
	Username          string `json:"username"`
	Name              string `json:"name"`
	WateringFrequency string `json:"wateringFrequency"`
	LastWaterDate     string `json:"lastWaterDate"`
	ImageId           uint   `json:"imageId"`
	IsPublic          bool   `json:"isPublic"`
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

// render a plant
func (i PlantModel) String() string {
	return fmt.Sprintf("ID: %d, %d/%d/%d - %d:%d:%d, name=%s, waterFrequency:=%s, lastWateringDate=%s, username=%s isPublic=%t\n", i.Id, i.CreatedAt.Year(), i.CreatedAt.Month(), i.CreatedAt.Day(), i.CreatedAt.Hour(), i.CreatedAt.Minute(), i.CreatedAt.Second(), i.Name, i.WateringFrequency, i.LastWaterDate, i.Username, i.IsPublic)
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

func UpdatePlant(db *gorm.DB,
	id int,
	name string,
	wateringFrequency string,
	imageId uint,
	lastWaterDate string,
	isNewImage bool,
	isPublic bool) error {
	var existingplant PlantModel
	existingplant.Id = id
	db.First(&existingplant)
	fmt.Printf("Existing plant: %s\n", existingplant)
	if existingplant.ImageId != 0 && isNewImage {
		fmt.Printf("isNewImage=%t, Must first remove old plant image ID=%d\n", isNewImage, existingplant.ImageId)
		db.Delete(&ImageModel{}, existingplant.ImageId)
	}

	// imageId exists by now since we process the image before calling this function to update the plant
	existingplant.IsPublic = isPublic
	existingplant.ImageId = imageId
	existingplant.Name = name
	existingplant.WateringFrequency = wateringFrequency
	existingplant.LastWaterDate = lastWaterDate
	db.Save(existingplant)
	return nil
}

func AddPlant(db *gorm.DB,
	name string,
	wateringFrequency string,
	imageId uint,
	lastWaterDate string,
	email string,
	username string,
	isPublic bool) error {
	if name == "" {
		return errors.New("Invalid plant name.")
	}
	if wateringFrequency == "" {
		return errors.New("Invalid watering frequency.")
	}
	if lastWaterDate == "" {
		return errors.New("Invalid last watering date.")
	}
	// Delete old records if the limit has been reached
	var count int64
	db.Model(&PlantModel{}).Count(&count)
	if count > 50 {
		fmt.Printf("DB has %d plants.", count)
		var plants []PlantModel
		db.Order("id asc").Limit(int(count) - 50).Find(&plants)
		db.Delete(&plants)
	}
	var plant = PlantModel{
		Name:              name,
		WateringFrequency: wateringFrequency,
		ImageId:           imageId,
		Email:             email,
		Username:          username,
		IsPublic:          isPublic,
		LastWaterDate:     lastWaterDate,
	}

	log.Printf("Adding plant %s", plant)

	err := db.Create(&plant).Error
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
		PlantId:  plantId,
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
}
