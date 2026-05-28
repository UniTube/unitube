package models

import (
	"gorm.io/gorm"
)

type User struct {
  gorm.Model // this provides ID, CreatedAt, UpdatedAt, DeletedAt fields
  Name  string  
  Surname string  
  Email string  
  Password string  
  Videos []Video `gorm:"foreignKey:AuthorID"`
}