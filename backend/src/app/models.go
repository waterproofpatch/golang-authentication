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
	Log     string `json:"log"`
	PlantID int    `json:"plantId"`
}
type ImageModel struct {
	gorm.Model
	Name string
	Data []byte
}

type CommentModel struct {
	gorm.Model
	PlantID  int    `json:"plantId"`
	Email    string `json:"-"`
	Username string `json:"username"`
	Content  string `json:"content"`
	Viewed   bool   `json:"viewed"`
	// allow JSON POST to leave these empty
	CreatedAt *time.Time `json:"createdAt,omitempty"`
	UpdatedAt *time.Time `json:"updatedAt,omitempty"`
	DeletedAt *time.Time `json:"deletedAt,omitempty"`
}

type PlantModel struct {
	gorm.Model
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
	Notes                   string          `json:"notes"`
}

// render a plant
func (i PlantModel) String() string {
	return fmt.Sprintf(
		"ID: %d, %d/%d/%d - %d:%d:%d, name=%s, waterFrequency=%d, fertilizeFrequency=%d, lastWateringDate=%s, lastFertlizeDate=%s, lastFertilizeNotifyDate=%s, lastWaterNotifyDate=%s, skippedLastFertilize=%v, username=%s, isPublic=%t, doNotify=%t\n",
		i.ID,
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
	result := db.Model(&PlantLogModel{}).Where("plant_id = ?", plant.ID).Count(&count)
	if result.Error != nil {
		return result.Error
	}

	if count > 10 {
		var oldestLogs []PlantLogModel
		result = db.Where("plant_id = ?", plant.ID).Order("created_at asc").Limit(int(count) - 10).Find(&oldestLogs)
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

func UpdatePlant(db *gorm.DB, plant *PlantModel, isNewImage bool) error {
	err := validatePlantInfo(plant.Name, plant.WateringFrequency, plant.LastWaterDate, plant.LastFertilizeDate)
	if err != nil {
		return err
	}
	var existingplant PlantModel
	existingplant.ID = plant.ID
	db.Preload("Logs").First(&existingplant)
	fmt.Printf("Existing plant: %s\n", existingplant)
	// imageId exists by now since we process the image before calling this function to update the plant
	if existingplant.ImageId != 0 && isNewImage {
		fmt.Printf("isNewImage=%t, Must first remove old plant image ID=%d\n", isNewImage, existingplant.ImageId)
		db.Delete(&ImageModel{}, existingplant.ImageId)
	}

	// handle resetting notification dates
	if existingplant.LastWaterDate != plant.LastWaterDate || existingplant.LastMoistDate != plant.LastMoistDate {
		fmt.Println("Resetting LastWaterNotifyDate since the soil is either moist or the plant was watered!")
		existingplant.LastWaterNotifyDate = ""
	}
	if existingplant.LastFertilizeDate != plant.LastFertilizeDate {
		fmt.Println("Resetting LastFertilizeNotifyDate something has changed!")
		existingplant.LastFertilizeNotifyDate = ""
	}

	// update the plant log
	if existingplant.IsPublic != plant.IsPublic {
		logMsg := fmt.Sprintf("Plant changed from public=%t to public=%t", existingplant.IsPublic, plant.IsPublic)
		addPlantLog(db, &existingplant, logMsg)
	}
	if existingplant.Name != plant.Name {
		logMsg := fmt.Sprintf("Name changed from %s to %s", existingplant.Name, plant.Name)
		addPlantLog(db, &existingplant, logMsg)
	}
	if existingplant.LastMoistDate != plant.LastMoistDate {
		logMsg := fmt.Sprintf("Last soil moist date changed from %s to %s", existingplant.LastMoistDate, plant.LastMoistDate)
		addPlantLog(db, &existingplant, logMsg)
	}
	if existingplant.LastWaterDate != plant.LastWaterDate {
		logMsg := fmt.Sprintf("Last water date changed from %s to %s", existingplant.LastWaterDate, plant.LastWaterDate)
		addPlantLog(db, &existingplant, logMsg)
	}
	if existingplant.LastFertilizeDate != plant.LastFertilizeDate {
		logMsg := ""
		if plant.SkippedLastFertilize {
			logMsg = fmt.Sprintf("Fertilizing skipped, last fertilize date changed from %s to %s", existingplant.LastFertilizeDate, plant.LastFertilizeDate)
		} else {
			logMsg = fmt.Sprintf("Last fertilize date changed from %s to %s", existingplant.LastFertilizeDate, plant.LastFertilizeDate)
		}
		addPlantLog(db, &existingplant, logMsg)
	}
	if existingplant.WateringFrequency != plant.WateringFrequency {
		logMsg := fmt.Sprintf("Watering frequency changed from %d to %d days", existingplant.WateringFrequency, plant.WateringFrequency)
		addPlantLog(db, &existingplant, logMsg)
	}
	if existingplant.Tag != plant.Tag {
		logMsg := fmt.Sprintf("Tag changed from %s to %s", existingplant.Tag, plant.Tag)
		addPlantLog(db, &existingplant, logMsg)
	}
	if existingplant.FertilizingFrequency != plant.FertilizingFrequency {
		logMsg := fmt.Sprintf("Fertilizing frequency changed from %d to %d days", existingplant.FertilizingFrequency, plant.FertilizingFrequency)
		addPlantLog(db, &existingplant, logMsg)
	}
	if existingplant.Notes != plant.Notes {
		logMsg := fmt.Sprintf("Notes changed from %s to %s", existingplant.Notes, plant.Notes)
		addPlantLog(db, &existingplant, logMsg)
	}
	existingplant.DoNotify = plant.DoNotify
	existingplant.IsPublic = plant.IsPublic
	existingplant.ImageId = plant.ImageId
	existingplant.LastMoistDate = plant.LastMoistDate
	existingplant.Name = plant.Name
	existingplant.Tag = plant.Tag
	existingplant.WateringFrequency = plant.WateringFrequency
	existingplant.FertilizingFrequency = plant.FertilizingFrequency
	existingplant.LastWaterDate = plant.LastWaterDate
	existingplant.LastFertilizeDate = plant.LastFertilizeDate
	existingplant.SkippedLastFertilize = plant.SkippedLastFertilize
	existingplant.Notes = plant.Notes
	db.Save(existingplant)
	return nil
}

func AddPlant(db *gorm.DB, plant *PlantModel) error {
	err := validatePlantInfo(plant.Name, plant.WateringFrequency, plant.LastWaterDate, plant.LastFertilizeDate)
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
	plant.LastWaterNotifyDate = ""
	plant.LastFertilizeNotifyDate = ""
	plant.LastMoistDate = ""
	plant.Notes = ""
	plant.Logs = []PlantLogModel{
		{Log: "Created plant!"},
	}

	log.Printf("Adding plant %v", plant)

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

func InitModels(db *gorm.DB, dropTables bool) {
	models := []interface{}{
		&PlantLogModel{},
		&PlantModel{},
		&CommentModel{},
		&ImageModel{},
	}

	if dropTables {
		log.Printf("Dropping tables...")
		for _, model := range models {
			db.Migrator().DropTable(model)
		}
	}

	log.Printf("Initializing models...\n")

	for _, model := range models {
		db.AutoMigrate(model)
	}
}
