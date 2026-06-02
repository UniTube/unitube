package models

import "gorm.io/gorm"

type Video struct {
  gorm.Model // this provides ID, CreatedAt, UpdatedAt, DeletedAt fields
  Title  string  
  Description string  
  URL string  
  MimeType string
  UploadAt string  
  AuthorID uint 
}