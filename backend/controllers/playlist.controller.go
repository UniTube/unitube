package controllers

import (
	"net/http"

	"backend/dtos"
	"backend/services"

	"github.com/gin-gonic/gin"
)

type PlaylistController struct {
	playlistService *services.PlaylistService
}

func NewPlaylistController(playlistService *services.PlaylistService) *PlaylistController {
	return &PlaylistController{playlistService: playlistService}
}

//CreatePlaylist godoc
// @Summary Create a new playlist
// @Description Create a new playlist with the provided information
// @Tags playlists
// @Accept json
// @Produce json
// @Param playlist body dtos.PlaylistDTO true "Playlist object"
// @Success 201 {object} dtos.PlaylistDTO
// @Failure 400 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /playlists [post]
func (c *PlaylistController) CreatePlaylist(ctx *gin.Context) {
	var playlistDTO dtos.PlaylistDTO
	if err := ctx.ShouldBindJSON(&playlistDTO); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	
	if result, err := c.playlistService.CreatePlaylist(playlistDTO); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	} else {
		ctx.JSON(http.StatusCreated, result)
	}
}

// GetAllPlaylists godoc
// @Summary Get all playlists
// @Description Get a list of all playlists
// @Tags playlists
// @Accept json
// @Produce json
// @Success 200 {object} []dtos.PlaylistDTO
// @Failure 500 {object} map[string]string
// @Router /playlists [get]
func (c *PlaylistController) GetAllPlaylists(ctx *gin.Context) {
	playlists, err := c.playlistService.GetAllPlaylists()
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusOK, playlists)
}


// AddVideoToPlaylist godoc
// @Summary Add a video to a playlist
// @Description Add a video to a specific playlist
// @Tags playlists
// @Accept json
// @Produce json
// @Param playlist_id path integer true "Playlist ID"
// @Param video_id path integer true "Video ID"
// @Param user_id path integer true "User ID"
// @Success 200 {object} map[string]string
// @Failure 400 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /playlists/{playlist_id}/videos/{video_id} [post]
func (c *PlaylistController) AddVideoToPlaylist(ctx *gin.Context) {
	var request struct {
		PlaylistID uint `json:"playlist_id"`
		VideoID    uint `json:"video_id"`
		UserID     uint `json:"user_id"`
	}
	if err := ctx.ShouldBindJSON(&request); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return 
	}
	if err := c.playlistService.AddVideoToPlaylist(request.PlaylistID, request.VideoID, request.UserID); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusOK, gin.H{"message": "Video added to playlist"})
}

// DeletePlaylist godoc
// @Summary Delete a playlist
// @Description Delete a specific playlist
// @Tags playlists
// @Accept json
// @Produce json
// @Param playlist_id path integer true "Playlist ID"
// @Success 200 {object} map[string]string
// @Failure 400 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /playlists/{playlist_id} [delete]
func (c *PlaylistController) DeletePlaylist(ctx *gin.Context) {
	var request struct {
		PlaylistID uint `json:"playlist_id"`
	}
	if err := ctx.ShouldBindJSON(&request); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if err := c.playlistService.DeletePlaylist(request.PlaylistID); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusOK, gin.H{"message": "Playlist deleted"})
}
