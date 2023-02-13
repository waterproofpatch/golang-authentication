package app

import (
	"fmt"
	"log"

	"gorm.io/gorm"
)

type Item struct {
	gorm.Model
	Id   int    `json:"id"`
	Name string `json:"name"`
	Type int    `json:"type"`
}

func (i Item) String() string {
	return fmt.Sprintf("ID: %d, %d/%d/%d - %d:%d:%d, name: %s, type: %d", i.ID, i.CreatedAt.Year(), i.CreatedAt.Month(), i.CreatedAt.Day(), i.CreatedAt.Hour(), i.CreatedAt.Minute(), i.CreatedAt.Second(), i.Name, i.Type)
}

func AddItem(db *gorm.DB, name string, itemType int) error {
	var item = Item{
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
	db.AutoMigrate(&Item{})
}
