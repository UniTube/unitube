package routes

import (
	"backend/controllers"

	"github.com/gin-gonic/gin"
)

func SetupPlaylistRoutes(router *gin.RouterGroup, playlistController *controllers.PlaylistController) {

	router.POST("/playlists", playlistController.CreatePlaylist)
	router.GET("/playlists", playlistController.GetAllPlaylists)
	router.POST("/playlists/:id/videos", playlistController.AddVideoToPlaylist)
	router.DELETE("/playlists/:id", playlistController.DeletePlaylist)
}