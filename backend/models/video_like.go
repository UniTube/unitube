package models

import "gorm.io/gorm"

type VideoLike struct {
	gorm.Model
	UserID  uint
	VideoID uint
}
