package repositories

import (
    "gorm.io/gorm"

	"backend/models"
)

type UserRepo struct {
    Db *gorm.DB
}

func NewUserRepo(db *gorm.DB) *UserRepo {
	return &UserRepo{Db: db}
}

func (r *UserRepo) CreateUser(user *models.User) error {
	if err := r.Db.Create(user).Error; err != nil {
		return err
	}
	return nil
}

func (r *UserRepo) GetUserByID(id uint) (*models.User, error) {
	var user models.User
	if err := r.Db.First(&user, id).Error; err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *UserRepo) UpdateUser(user *models.User) error {
	if err := r.Db.Save(user).Error; err != nil {
		return err
	}
	return nil
}

func (r *UserRepo) DeleteUser(id uint) error{
	if err := r.Db.Delete(&models.User{}, id).Error; err != nil {
		return err
	}
	return nil
}
func (r *UserRepo) GetAllUsers() ([]models.User, error) {
	var users []models.User
	if err := r.Db.Find(&users).Error; err != nil {
		return nil, err
	}
	return users, nil
}