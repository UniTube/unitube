package services

import (
	"backend/dtos"
	"backend/models"
	"backend/repositories"
	"fmt"
	"os"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)


type UserService struct {
	repo *repositories.UserRepo
}

func NewUserService(repo *repositories.UserRepo) *UserService {
	return &UserService{repo: repo}
}


func (userService *UserService) CreateUser(userDTO *dtos.UserDTO) (error, string) {
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(userDTO.Password), 10)
	if err != nil {
		return err, "Failed to hash password"
	}
	user := &models.User{
		Surname: userDTO.Surname,
		Name:    userDTO.Name,
		Email:   userDTO.Email,
		Password: string(hashedPassword),
	}

	return userService.repo.CreateUser(user), "User created successfully"
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

func createToken(username string) (string, error) {
    token := jwt.NewWithClaims(jwt.SigningMethodHS256, 
        jwt.MapClaims{ 
        "username": username, 
        "exp": time.Now().Add(time.Hour * 24).Unix(), 
        })

    tokenString, err := token.SignedString([]byte(os.Getenv("JWT_SECRET")))
    if err != nil {
    return "", err
    }

 return tokenString, nil
}



func (userService *UserService) AuthenticateUser(email, password string) (error, string) {

	user, err := userService.repo.GetUserByEmail(email)
	if err != nil {
		return fmt.Errorf("user not found"), ""
	}
	err = bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(password))
	if err != nil {
		return fmt.Errorf("invalid password"), ""
	}
	token, err := createToken(user.Email)
	if err != nil {
		return fmt.Errorf("failed to create token"), ""
	}
	return nil, token
}