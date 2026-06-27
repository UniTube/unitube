package controllers

import (
	"backend/dtos"
	"backend/middlewares"
	"backend/services"
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
)

type UserController struct {
	userService *services.UserService
}

func NewUserController(userService *services.UserService) *UserController {
	return &UserController{userService: userService}
}

// CreateUser godoc
// @Summary Create a new user
// @Description Create a new user with the provided information
// @Tags users
// @Accept json
// @Produce json
// @Param user body dtos.UserDTO true "User object"
// @Success 201 {object} dtos.UserDTO
// @Failure 400 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /users [post]
func (c *UserController) CreateUser(ctx *gin.Context) {
	var userDTO dtos.UserDTO
	if err := ctx.ShouldBindJSON(&userDTO); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if err, message := c.userService.CreateUser(&userDTO); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error(), "message": message})
		return
	}
	created, err := c.userService.GetUserByEmail(userDTO.Email)
	if err == nil {
		userDTO.ID = created.ID
		userDTO.Name = created.Name
		userDTO.Surname = created.Surname
	}
	userDTO.Password = ""
	ctx.JSON(http.StatusCreated, userDTO)
}

// GetUserByID godoc
// @Summary Get a user by ID
// @Description Get a user by its ID
// @Tags users
// @Accept json
// @Produce json
// @Param id path integer true "User ID"
// @Success 200 {object} dtos.UserDTO
// @Failure 400 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Router /users/{id} [get]
func (c *UserController) GetUserByID(ctx *gin.Context) {
	idParam := ctx.Param("id")
	var id uint
	if _, err := fmt.Sscanf(idParam, "%d", &id); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}
	userDTO, err := c.userService.GetUserByID(id)
	if err != nil {
		ctx.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}
	userDTO.Password = ""
	ctx.JSON(http.StatusOK, userDTO)
}

// GetUserProfile godoc
// @Summary Get a user's public profile
// @Description Retrieve a user's profile with their uploaded videos
// @Tags users
// @Produce json
// @Param id path integer true "User ID"
// @Success 200 {object} dtos.UserProfileDTO
// @Failure 400 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Router /users/{id}/profile [get]
func (c *UserController) GetUserProfile(ctx *gin.Context) {
	idParam := ctx.Param("id")
	var id uint
	if _, err := fmt.Sscanf(idParam, "%d", &id); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	profile, err := c.userService.GetUserProfile(id)
	if err != nil {
		ctx.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	ctx.JSON(http.StatusOK, profile)
}

// UpdateProfile godoc
// @Summary Update the authenticated user's profile
// @Description Update name and surname for the logged-in user
// @Tags users
// @Accept json
// @Produce json
// @Param id path integer true "User ID"
// @Param profile body dtos.UpdateProfileDTO true "Profile fields"
// @Success 200 {object} dtos.UserProfileDTO
// @Failure 400 {object} map[string]string
// @Failure 403 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Router /users/{id}/profile [put]
func (c *UserController) UpdateProfile(ctx *gin.Context) {
	idParam := ctx.Param("id")
	var id uint
	if _, err := fmt.Sscanf(idParam, "%d", &id); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	email, err := middlewares.GetAuthenticatedEmail(ctx)
	if err != nil {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	currentUser, err := c.userService.GetUserByEmail(email)
	if err != nil || currentUser.ID != id {
		ctx.JSON(http.StatusForbidden, gin.H{"error": "You can only edit your own profile"})
		return
	}

	var profileDTO dtos.UpdateProfileDTO
	if err := ctx.ShouldBindJSON(&profileDTO); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	profile, err := c.userService.UpdateProfile(id, &profileDTO)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, profile)
}

func (c *UserController) GetMyProfile(ctx *gin.Context) {
	email, err := middlewares.GetAuthenticatedEmail(ctx)
	if err != nil {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	currentUser, err := c.userService.GetUserByEmail(email)
	if err != nil {
		ctx.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	profile, err := c.userService.GetUserProfile(currentUser.ID)
	if err != nil {
		ctx.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	ctx.JSON(http.StatusOK, profile)
}

func (c *UserController) UpdateMyProfile(ctx *gin.Context) {
	email, err := middlewares.GetAuthenticatedEmail(ctx)
	if err != nil {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	currentUser, err := c.userService.GetUserByEmail(email)
	if err != nil {
		ctx.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	var profileDTO dtos.UpdateProfileDTO
	if err := ctx.ShouldBindJSON(&profileDTO); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	profile, err := c.userService.UpdateProfile(currentUser.ID, &profileDTO)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, profile)
}

// UpdateUser godoc
// @Summary Update a user
// @Description Update an existing user
// @Tags users
// @Accept json
// @Produce json
// @Param user body dtos.UserDTO true "User object"
// @Success 200 {object} dtos.UserDTO
// @Failure 400 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /users/{id} [put]
func (c *UserController) UpdateUser(ctx *gin.Context) {
	var userDTO dtos.UserDTO
	if err := ctx.ShouldBindJSON(&userDTO); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if err := c.userService.UpdateUser(&userDTO); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusOK, userDTO)
}

// DeleteUser godoc
// @Summary Delete a user
// @Description Delete a user by ID
// @Tags users
// @Accept json
// @Produce json
// @Param id path integer true "User ID"
// @Success 200 {object} map[string]string
// @Failure 400 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /users/{id} [delete]
func (c *UserController) DeleteUser(ctx *gin.Context){
	idParam := ctx.Param("id")
	var id uint
	if _, err := fmt.Sscanf(idParam, "%d", &id); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}
	if err := c.userService.DeleteUser(id); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusOK, gin.H{"message": "User deleted successfully"})
}

// GetAllUsers godoc
// @Summary Get all users
// @Description Retrieve all users from the database
// @Tags users
// @Accept json
// @Produce json
// @Success 200 {array} dtos.UserDTO
// @Failure 500 {object} map[string]string
// @Router /users [get]
func (c *UserController) GetAllUsers(ctx *gin.Context) {
	userDTOs, err := c.userService.GetAllUsers()
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusOK, userDTOs)
}

// LoginUser godoc
// @Summary Authenticate a user and generate a JWT token
// @Description Authenticate user credentials and return a JWT token for authorized access
// @Tags users
// @Accept json
// @Produce json
// @Param credentials body dtos.LoginDTO true "User login credentials"
// @Success 200 {object} dtos.LoginResponse
// @Failure 400 {object} map[string]string
// @Failure 401 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /login [post]

func (c *UserController) LoginUser(ctx *gin.Context) {
	var loginDTO dtos.LoginDTO
	if err := ctx.ShouldBindJSON(&loginDTO); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err, loginResponse := c.userService.AuthenticateUser(loginDTO.Email, loginDTO.Password); err != nil {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	} else {
		ctx.SetSameSite(http.SameSiteLaxMode)
		ctx.SetCookie("Authorization", loginResponse.Token, 3600*24, "", "", false, true)
		ctx.JSON(http.StatusOK, loginResponse)
	}
}

func (c *UserController) LogoutUser(ctx *gin.Context) {
	ctx.SetCookie("Authorization", "", -1, "", "", false, true)
	ctx.JSON(http.StatusOK, gin.H{"message": "Logged out successfully"})
}


