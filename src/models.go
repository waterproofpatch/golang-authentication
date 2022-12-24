package main

import (
	"log"

	"gorm.io/gorm"
)

type Item struct {
	gorm.Model
	Name string `json:"name"`
	Type int    `json:"type"`
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
