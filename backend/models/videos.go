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
	Likes       int `gorm:"default:0"`
	Comments    []Comment `gorm:"foreignKey:VideoID"`
	Tags        []Tag `gorm:"many2many:video_tags;"`
	Playlists   []Playlist `gorm:"many2many:video_playlists;"`
}