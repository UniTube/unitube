package controllers

import (
	"backend/dtos"
	"backend/services"
	"fmt"
	"net/http"

	"backend/middlewares"

	"github.com/gin-gonic/gin"
)

type CommentController struct {
	service *services.CommentService
}

func NewCommentController(service *services.CommentService) *CommentController {
	return &CommentController{service: service}
}

// AddComment godoc
// @Summary Add a comment to a video
// @Tags comments
// @Accept json
// @Produce json
// @Param comment body dtos.CommentDTO true "Comment"
// @Success 201 {object} dtos.CommentDTO
// @Failure 400 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /videos/{id}/comments [post]
func (c *CommentController) AddComment(ctx *gin.Context) {
	var dto dtos.CommentDTO
	if err := ctx.ShouldBindJSON(&dto); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if err := c.service.AddComment(&dto); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusCreated, dto)
}

// GetComments godoc
// @Summary Get all comments for a video
// @Tags comments
// @Produce json
// @Param id path integer true "Video ID"
// @Success 200 {array} dtos.CommentDTO
// @Failure 400 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /videos/{id}/comments [get]
func (c *CommentController) GetComments(ctx *gin.Context) {
	var videoID uint
	if _, err := fmt.Sscanf(ctx.Param("id"), "%d", &videoID); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid video ID"})
		return
	}
	comments, err := c.service.GetCommentsByVideoID(videoID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusOK, comments)
}

// LikeVideo godoc
// @Summary Like a video
// @Tags videos
// @Produce json
// @Param id path integer true "Video ID"
// @Success 200 {object} map[string]string
// @Failure 400 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /videos/{id}/like [post]
func (c *CommentController) LikeVideo(ctx *gin.Context) {
	var videoID uint
	if _, err := fmt.Sscanf(ctx.Param("id"), "%d", &videoID); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid video ID"})
		return
	}

	email, err := middlewares.GetAuthenticatedEmail(ctx)
	if err != nil {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}
	user, err := c.service.GetUserByEmail(email)
	if err != nil {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": "User not found"})
		return
	}

	if err := c.service.LikeVideo(user.ID, videoID); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusOK, gin.H{"message": "Video liked"})
}

// UnlikeVideo godoc
// @Summary Unlike a video
// @Tags videos
// @Produce json
// @Param id path integer true "Video ID"
// @Success 200 {object} map[string]string
// @Failure 400 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /videos/{id}/like [delete]
func (c *CommentController) UnlikeVideo(ctx *gin.Context) {
	var videoID uint
	if _, err := fmt.Sscanf(ctx.Param("id"), "%d", &videoID); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid video ID"})
		return
	}

	email, err := middlewares.GetAuthenticatedEmail(ctx)
	if err != nil {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}
	user, err := c.service.GetUserByEmail(email)
	if err != nil {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": "User not found"})
		return
	}

	if err := c.service.UnlikeVideo(user.ID, videoID); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusOK, gin.H{"message": "Video unliked"})
}