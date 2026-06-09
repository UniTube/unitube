package controllers

import (
	"backend/dtos"
	"backend/services"
	"fmt"
	"mime/multipart"
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

	// Use the Docker volume mount path directly
	storageDir := "/storages"

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
	mimeType, err := c.detectMimeType(file)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to detect MIME type"})
		return
	}
	authorId, _ := strconv.Atoi(ctx.PostForm("authorId"))
	videoDTO := dtos.VideoDTO{
		Title:       ctx.PostForm("title"),
		Description: ctx.PostForm("description"),
		Size:        file.Size,
		URL:         dst,
		MimeType:   mimeType,
		UploadAt:    time.Now().String(),
		AuthorID:    uint(authorId),
	}

	response, err := c.videoService.CreateVideo(&videoDTO)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusCreated, response)
}


// GetVideoMetadata godoc
// @Summary Get video metadata by ID
// @Description Retrieve video metadata as JSON
// @Tags videos
// @Produce json
// @Param id path integer true "Video ID"
// @Success 200 {object} dtos.VideoResponseDTO
// @Failure 400 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Router /videos/{id}/metadata [get]
func (c *VideoController) GetVideoMetadata(ctx *gin.Context) {
	idParam := ctx.Param("id")
	var id uint
	if _, err := fmt.Sscanf(idParam, "%d", &id); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid video ID"})
		return
	}

	video, err := c.videoService.GetVideoByID(id)
	if err != nil {
		ctx.JSON(http.StatusNotFound, gin.H{"error": "Video not found"})
		return
	}

	ctx.JSON(http.StatusOK, c.videoService.ToVideoResponse(video))
}


// GetVideoByID godoc
// @Summary Stream a video by ID
// @Description Stream video content using HTTP Range requests (partial content)
// @Tags videos
// @Produce application/octet-stream
// @Param id path integer true "Video ID"
// @Success 206 {file} binary "Partial video content"
// @Success 200 {file} binary "Full video content"
// @Failure 400 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Failure 416 {object} map[string]string "Range not satisfiable"
// @Failure 500 {object} map[string]string
// @Router /videos/{id} [get]
func (c *VideoController) GetVideoByID(ctx *gin.Context) {
	idParam := ctx.Param("id")
	var id uint
	if _, err := fmt.Sscanf(idParam, "%d", &id); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid video ID"})
		return
	}
 
	// Fetch video metadata from DB
	videoDTO, err := c.videoService.GetVideoByID(id)
	if err != nil {
		ctx.JSON(http.StatusNotFound, gin.H{"error": "Video not found"})
		return
	}
 
	// Open the video file from disk
	file, err := os.Open(videoDTO.URL)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to open video file"})
		return
	}
	defer file.Close()
 
	// Get file size for Range calculations
	info, err := file.Stat()
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to read file info"})
		return
	}
	fileSize := info.Size()
 
	// Set headers that tell the client streaming is supported
	ctx.Header("Accept-Ranges", "bytes")
	ctx.Header("Content-Type", videoDTO.MimeType)
 
	rangeHeader := ctx.GetHeader("Range")
 
	// No Range header → serve the full file
	if rangeHeader == "" {
		ctx.Header("Content-Length", strconv.FormatInt(fileSize, 10))
		ctx.Status(http.StatusOK)
		http.ServeContent(ctx.Writer, ctx.Request, info.Name(), info.ModTime(), file)
		return
	}
 
	// Parse "bytes=start-end" from the Range header
	var start, end int64
	_, err = fmt.Sscanf(rangeHeader, "bytes=%d-%d", &start, &end)
 
	if err != nil {
		// "bytes=start-" means "from start to EOF"
		_, err = fmt.Sscanf(rangeHeader, "bytes=%d-", &start)
		if err != nil {
			ctx.JSON(http.StatusRequestedRangeNotSatisfiable, gin.H{"error": "Invalid Range header"})
			return
		}
		end = fileSize - 1
	}
 
	// Validate range bounds
	if start < 0 || end >= fileSize || start > end {
		ctx.Header("Content-Range", fmt.Sprintf("bytes */%d", fileSize))
		ctx.JSON(http.StatusRequestedRangeNotSatisfiable, gin.H{"error": "Range out of bounds"})
		return
	}
 
	chunkSize := end - start + 1
 
	// Seek to the requested start position
	if _, err := file.Seek(start, 0); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to seek in file"})
		return
	}
 
	// Read exactly the requested chunk
	buf := make([]byte, chunkSize)
	if _, err := file.Read(buf); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to read video chunk"})
		return
	}
 
	// Respond with 206 Partial Content and the chunk
	ctx.Header("Content-Range", fmt.Sprintf("bytes %d-%d/%d", start, end, fileSize))
	ctx.Header("Content-Length", strconv.FormatInt(chunkSize, 10))
	ctx.Data(http.StatusPartialContent, videoDTO.MimeType, buf)
}

// DeleteVideo godoc
// @Summary Delete a video
// @Description Delete a video by ID
// @Tags videos
// @Accept json
// @Produce json
// @Param id path integer true "Video ID"
// @Success 200 {object} map[string]string
// @Failure 400 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /videos/{id} [delete]

func(v *VideoController) DeleteVideo(ctx *gin.Context){
	idParam := ctx.Param("id")
	var id uint
	if _, err := fmt.Sscanf(idParam, "%d", &id); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid video ID"})
		return
	}
	if err := v.videoService.DeleteVideo(id); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusOK, gin.H{"message": "Video deleted successfully"})
}


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
// detectMimeType reads the file header to detect the actual MIME type
func (v *VideoController) detectMimeType(file *multipart.FileHeader) (string, error) {
    src, err := file.Open()
    if err != nil {
        return "", err
    }
    defer src.Close()

    // Read first 512 bytes for MIME detection
    buffer := make([]byte, 512)
    _, err = src.Read(buffer)
    if err != nil {
        return "", err
    }

    return http.DetectContentType(buffer), nil
}