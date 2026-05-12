package models
import "gorm.io/gorm"

type Video struct {
  gorm.Model // this provides ID, CreatedAt, UpdatedAt, DeletedAt fields
  Title  string  `json:"title"`
  Description string  `json:"description"`
  URL string  `json:"url"`
  UploadAt string  `json:"uploadAt"`
  AuthorID uint `json:"authorId"`
}