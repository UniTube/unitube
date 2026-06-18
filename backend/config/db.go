package config

import (
	"fmt"
	"log"
	"os"

	"github.com/joho/godotenv"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"

	"backend/models"
)

func ConnectDB() *gorm.DB {
    godotenv.Load()
	

	dbUser := os.Getenv("DB_USER")
	dbPassword := os.Getenv("DB_PASSWORD")
	dbName := os.Getenv("DB_NAME")
	dbHost := os.Getenv("DB_HOST")
	dbPort := os.Getenv("DB_PORT")

	dsn := fmt.Sprintf("host=%s user=%s password=%s dbname=%s port=%s sslmode=disable", dbHost, dbUser, dbPassword, dbName, dbPort)

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}
	db.AutoMigrate(&models.User{}, &models.Video{}, &models.Comment{}, &models.Tag{})

	// Seed tags
	var count int64
	if err := db.Model(&models.Tag{}).Count(&count).Error; err == nil && count == 0 {
		initialTags := []string{
			"University", "Class", "Course", "Computer Science",
			"Electronics", "Mechanic", "Mechatronics", "Robotics",
			"Programming", "Algorithms", "Embedded Systems", "Automation",
		}
		for _, name := range initialTags {
			db.Create(&models.Tag{Name: name})
		}
		log.Println("Database seeded with initial tags.")
	}

	return db
}