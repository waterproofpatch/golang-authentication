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

type PlantModel struct {
	gorm.Model
	Id                int    `json:"id"`
	Name              string `json:"name"`
	WateringFrequency string `json:"wateringFrequency"`
	LastWaterDate     string `json:"lastWaterDate"`
	ImageId           uint   `json:"imageId"`
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

func (i PlantModel) String() string {
	return fmt.Sprintf("ID: %d, %d/%d/%d - %d:%d:%d, name: %s, type: %d, lastWateringDate=%s", i.ID, i.CreatedAt.Year(), i.CreatedAt.Month(), i.CreatedAt.Day(), i.CreatedAt.Hour(), i.CreatedAt.Minute(), i.CreatedAt.Second(), i.Name, i.WateringFrequency, i.LastWaterDate)
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
func UpdatePlant(db *gorm.DB, id int, name string, wateringFrequency string) error {
	var existingplant PlantModel
	existingplant.Id = id
	db.First(&existingplant)
	existingplant.Name = name
	existingplant.WateringFrequency = wateringFrequency
	db.Save(existingplant)
	return nil
}

func AddPlant(db *gorm.DB, name string, wateringFrequency string, imageId uint, lastWaterDate string) error {
	if name == "" {
		return errors.New("Invalid plant name.")
	}
	if wateringFrequency == "" {
		return errors.New("Invalid watering frequency.")
	}
	if lastWaterDate == "" {
		return errors.New("Invalid last watering date.")
	}
	var plant = PlantModel{
		Name:              name,
		WateringFrequency: wateringFrequency,
		ImageId:           imageId,
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

func InitModels(db *gorm.DB) {
	log.Printf("Initializing models...\n")
	db.AutoMigrate(&PlantModel{})
	db.AutoMigrate(&MessageModel{})
	db.AutoMigrate(&ImageModel{})
}
