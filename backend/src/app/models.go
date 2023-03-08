package app

import (
	"fmt"
	"log"

	"gorm.io/gorm"
)

type ItemModel struct {
	gorm.Model
	Id   int    `json:"id"`
	Name string `json:"name"`
	Type int    `json:"type"`
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

func (i ItemModel) String() string {
	return fmt.Sprintf("ID: %d, %d/%d/%d - %d:%d:%d, name: %s, type: %d", i.ID, i.CreatedAt.Year(), i.CreatedAt.Month(), i.CreatedAt.Day(), i.CreatedAt.Hour(), i.CreatedAt.Minute(), i.CreatedAt.Second(), i.Name, i.Type)
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
func UpdateItem(db *gorm.DB, id int, name string, itemType int) error {
	var existingItem ItemModel
	existingItem.Id = id
	db.First(&existingItem)
	existingItem.Name = name
	existingItem.Type = itemType
	db.Save(existingItem)
	return nil
}

func AddItem(db *gorm.DB, name string, itemType int) error {
	var item = ItemModel{
		Name: name,
		Type: itemType,
	}

	log.Printf("Adding item %s", item)

	err := db.Create(&item).Error
	if err != nil {
		return err
	}
	db.Save(item)
	return nil
}

func InitModels(db *gorm.DB) {
	log.Printf("Initializing models...\n")
	db.AutoMigrate(&ItemModel{})
	db.AutoMigrate(&MessageModel{})
}
