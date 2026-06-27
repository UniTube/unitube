package controllers

import (
	"net/http"
	"strconv"

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

func (c *PlaylistController) GetPlaylistByID(ctx *gin.Context) {
	playlistID, err := strconv.ParseUint(ctx.Param("id"), 10, 32)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid playlist id"})
		return
	}

	playlist, err := c.playlistService.GetPlaylistByID(uint(playlistID))
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusOK, playlist)
}

// AddVideoToPlaylist godoc
// @Summary Add a video to a playlist
// @Description Add a video to a specific playlist
// @Tags playlists
// @Accept json
// @Produce json
// @Param playlist_id path integer true "Playlist ID"
// @Param video_id path integer true "Video ID"
// @Success 200 {object} dtos.PlaylistDTO
// @Failure 400 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /playlists/{playlist_id}/videos/{video_id} [post]
func (c *PlaylistController) AddVideoToPlaylist(ctx *gin.Context) {
	playlistID, err := strconv.ParseUint(ctx.Param("id"), 10, 32)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid playlist id"})
		return
	}

	var request struct {
		VideoID uint `json:"video_id" binding:"required"`
	}
	if err := ctx.ShouldBindJSON(&request); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if playlistDTO, err := c.playlistService.AddVideoToPlaylist(uint(playlistID), request.VideoID); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	} else {
		ctx.JSON(http.StatusOK, playlistDTO)
	}
}

func (c *PlaylistController) RemoveVideoFromPlaylist(ctx *gin.Context) {
	playlistID, err := strconv.ParseUint(ctx.Param("id"), 10, 32)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid playlist id"})
		return
	}
	videoID, err := strconv.ParseUint(ctx.Param("videoId"), 10, 32)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid video id"})
		return
	}

	playlistDTO, err := c.playlistService.RemoveVideoFromPlaylist(uint(playlistID), uint(videoID))
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusOK, playlistDTO)
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
	playlistID, err := strconv.ParseUint(ctx.Param("id"), 10, 32)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid playlist id"})
		return
	}
	if err := c.playlistService.DeletePlaylist(uint(playlistID)); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusOK, gin.H{"message": "Playlist deleted"})
}
