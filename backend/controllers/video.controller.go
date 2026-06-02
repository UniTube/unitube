package controllers

import (
	"backend/dtos"
	"backend/services"
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type VideoController struct {
	videoService *services.VideoService
}

func NewVideoController(videoService *services.VideoService) *VideoController {
	return &VideoController{videoService: videoService}
}

// CreateVideo godoc
// @Summary Create a new video
// @Description Upload a video file with metadata
// @Tags videos
// @Accept multipart/form-data
// @Produce json
// @Param file formData file true "Video file"
// @Param title formData string true "Video title"
// @Param description formData string false "Video description"
// @Param authorId formData integer true "Author ID"
// @Success 201 {object} dtos.VideoDTO
// @Failure 400 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /videos [post]
func (c *VideoController) CreateVideo(ctx *gin.Context) {
	file, err := ctx.FormFile("file")
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "File is required"})
		return
	}

	// Chemin absolu basé sur le répertoire de travail réel
	workDir, err := os.Getwd()
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get working directory"})
		return
	}

	// Remonte à la racine du projet (backend/) puis va dans storages/
	storageDir := filepath.Join(workDir, "..", "storages")

	if err := os.MkdirAll(storageDir, os.ModePerm); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create storage directory"})
		return
	}

	// UUID v7 + extension originale
	id, err := uuid.NewV7()
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate UUID"})
		return
	}
	ext := filepath.Ext(file.Filename)
	newFilename := fmt.Sprintf("%s%s", id.String(), ext)
	dst := filepath.Join(storageDir, newFilename)

	if err := ctx.SaveUploadedFile(file, dst); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save file"})
		return
	}

	authorId, _ := strconv.Atoi(ctx.PostForm("authorId"))
	videoDTO := dtos.VideoDTO{
		Title:       ctx.PostForm("title"),
		Description: ctx.PostForm("description"),
		URL:         dst,
		UploadAt:    time.Now().String(),
		AuthorID:    uint(authorId),
	}

	if err := c.videoService.CreateVideo(&videoDTO); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusCreated, videoDTO)
}

// func (c *VideoController) GetVideoByID(ctx *gin.Context) {
// 	idParam := ctx.Param("id")
// 	var id uint
// 	if _, err := fmt.Sscanf(idParam, "%d", &id); err != nil {
// 		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid video ID"})
// 		return
// 	}
// 	videoDTO, err := c.videoService.GetVideoByID(id)
// 	if err != nil {
// 		ctx.JSON(http.StatusNotFound, gin.H{"error": "Video not found"})
// 		return
// 	}
// 	ctx.JSON(http.StatusOK, videoDTO)
// }

// func (c *VideoController) UpdateVideo(ctx *gin.Context) {
// 	var videoDTO dtos.VideoDTO
// 	if err := ctx.ShouldBindJSON(&videoDTO); err != nil {
// 		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
// 		return
// 	}
// 	if err := c.videoService.UpdateVideo(&videoDTO); err != nil {
// 		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
// 		return
// 	}
// 	ctx.JSON(http.StatusOK, videoDTO)
// }

// func (c *VideoController) DeleteVideo(ctx *gin.Context){
// 	idParam := ctx.Param("id")
// 	var id uint
// 	if _, err := fmt.Sscanf(idParam, "%d", &id); err != nil {
// 		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid video ID"})
// 		return
// 	}
// 	if err := c.videoService.DeleteVideo(id); err != nil {
// 		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
// 		return
// 	}
// 	ctx.JSON(http.StatusOK, gin.H{"message": "Video deleted successfully"})
// }

// GetAllVideos godoc
// @Summary Get all videos
// @Description Retrieve all videos from the database
// @Tags videos
// @Accept json
// @Produce json
// @Success 200 {array} dtos.VideoDTO
// @Failure 500 {object} map[string]string
// @Router /videos [get]
func (c *VideoController) GetAllVideos(ctx *gin.Context) {
	videoDTOs, err := c.videoService.GetVideos()
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusOK, videoDTOs)
}
