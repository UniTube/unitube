package models

import "gorm.io/gorm"

type Playlist struct {
	gorm.Model
	Name   string  `gorm:"uniqueIndex;not null"`
	Videos []Video `gorm:"many2many:playlist_videos;"`
	UserID uint    `gorm:"foreignKey:userID"`
}