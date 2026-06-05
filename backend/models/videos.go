package models

import "gorm.io/gorm"

type Video struct {
	gorm.Model
	Title       string
	Description string
	URL         string
	Size        int64
	MimeType    string
	UploadAt    string
	AuthorID    uint
	Author      User `gorm:"foreignKey:AuthorID"`
}