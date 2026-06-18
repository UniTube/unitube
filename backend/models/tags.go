package models

import "gorm.io/gorm"

type Tag struct {
	gorm.Model
	Name   string  `gorm:"uniqueIndex;not null"`
	Videos []Video `gorm:"many2many:video_tags;"`
}
