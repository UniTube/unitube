package services

import (
	"backend/models"
	"backend/repositories"
	"backend/dtos"
	"gorm.io/gorm"
)

type UserService struct {
	repo *repositories.UserRepo
}

func NewUserService(repo *repositories.UserRepo) *UserService {
	return &UserService{repo: repo}
}


func (userService *UserService) CreateUser(userDTO *dtos.UserDTO) error {
	user := &models.User{
		Surname: userDTO.Surname,
		Name:    userDTO.Name,
		Email:   userDTO.Email,
		Password: userDTO.Password,
	}

	return userService.repo.CreateUser(user)
}

func (userService *UserService) GetUserByID(id uint) (*dtos.UserDTO, error) {
	user, err := userService.repo.GetUserByID(id)
	if err != nil {
		return nil, err
	}
	return &dtos.UserDTO{
		ID:      user.ID,
		Name:    user.Name,
		Surname: user.Surname,
		Email:   user.Email,
		Password: user.Password,
	}, nil
}

func (userService *UserService) UpdateUser(userDTO *dtos.UserDTO) error {
	user := &models.User{
		Model: gorm.Model{ID: userDTO.ID},
		Surname: userDTO.Surname,
		Name:    userDTO.Name,
		Email:   userDTO.Email,
		Password: userDTO.Password,
	}
	return userService.repo.UpdateUser(user)
}

func (userService *UserService) DeleteUser(id uint) error {
	return userService.repo.DeleteUser(id)
}

func (userService *UserService) GetAllUsers() ([]dtos.UserDTO, error) {
	users, err := userService.repo.GetAllUsers()
	if err != nil {
		return nil, err
	}
	userDTOs := make([]dtos.UserDTO, len(users))
	for i, user := range users {
		userDTOs[i] = dtos.UserDTO{
			ID:      user.ID,
			Name:    user.Name,
			Surname: user.Surname,
			Email:   user.Email,
			Password: user.Password,
		}
	}
	return userDTOs, nil
}
