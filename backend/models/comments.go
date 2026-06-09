package models

import "gorm.io/gorm"

type Comment struct {
	gorm.Model
	Content string
	VideoID uint
	AuthorID uint
}