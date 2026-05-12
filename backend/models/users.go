package models
import "gorm.io/gorm"

type User struct {
  gorm.Model // this provides ID, CreatedAt, UpdatedAt, DeletedAt fields
  Name  string  `json:"name" binding:"required"`
  Surname string  `json:"surname"`
  Email string  `json:"email" binding:"required"`
  Password string  `json:"password" binding:"required"`  
}