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
	repo         *repositories.UserRepo
	videoService *VideoService
}

func NewUserService(repo *repositories.UserRepo, videoService *VideoService) *UserService {
	return &UserService{repo: repo, videoService: videoService}
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

func (userService *UserService) AuthenticateUser(email, password string) (error, dtos.LoginResponse) {

	user, err := userService.repo.GetUserByEmail(email)
	if err != nil {
		return fmt.Errorf("user not found"), dtos.LoginResponse{}
	}
	err = bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(password))
	if err != nil {
		return fmt.Errorf("invalid password"), dtos.LoginResponse{}
	}
	token, err := createToken(user.Email)
	if err != nil {
		return fmt.Errorf("failed to create token"), dtos.LoginResponse{}
	}
	return nil, dtos.LoginResponse{Token: token, User: dtos.UserDTO{
		ID:      user.ID,
		Name:    user.Name,
		Surname: user.Surname,
		Email:   user.Email,
	}}
}

func (userService *UserService) GetUserProfile(id uint) (*dtos.UserProfileDTO, error) {
	user, err := userService.repo.GetUserByID(id)
	if err != nil {
		return nil, err
	}

	videos, err := userService.videoService.GetVideosByAuthorID(id)
	if err != nil {
		return nil, err
	}

	return &dtos.UserProfileDTO{
		ID:         user.ID,
		Name:       user.Name,
		Surname:    user.Surname,
		JoinedAt:   user.CreatedAt.Format("2006-01-02"),
		VideoCount: len(videos),
		Videos:     videos,
	}, nil
}

func (userService *UserService) UpdateProfile(id uint, profile *dtos.UpdateProfileDTO) (*dtos.UserProfileDTO, error) {
	user, err := userService.repo.GetUserByID(id)
	if err != nil {
		return nil, err
	}

	user.Name = profile.Name
	user.Surname = profile.Surname
	if err := userService.repo.UpdateUser(user); err != nil {
		return nil, err
	}

	return userService.GetUserProfile(id)
}

func (userService *UserService) GetUserByEmail(email string) (*dtos.UserDTO, error) {
	user, err := userService.repo.GetUserByEmail(email)
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