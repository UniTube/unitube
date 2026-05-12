package controllers

import (
	"fmt"
	"backend/dtos"
	"backend/services"
	"net/http"
	"github.com/gin-gonic/gin"
)

type Controller struct {
	userService *services.UserService
}

func NewController(userService *services.UserService) *Controller {
	return &Controller{userService: userService}
}

func (c *Controller) CreateUser(ctx *gin.Context) {
	var userDTO dtos.UserDTO
	if err := ctx.ShouldBindJSON(&userDTO); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if err := c.userService.CreateUser(&userDTO); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusCreated, userDTO)
}

func (c *Controller) GetUserByID(ctx *gin.Context) {
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
	ctx.JSON(http.StatusOK, userDTO)
}

func (c *Controller) UpdateUser(ctx *gin.Context) {
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

func (c *Controller) DeleteUser(ctx *gin.Context){
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

func (c *Controller) GetAllUsers(ctx *gin.Context) {
	userDTOs, err := c.userService.GetAllUsers()
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusOK, userDTOs)
}
