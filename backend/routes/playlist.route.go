package routes

import (
	"backend/controllers"

	"github.com/gin-gonic/gin"
)

func SetupPlaylistRoutes(router *gin.RouterGroup, playlistController *controllers.PlaylistController) {

	router.POST("/playlists", playlistController.CreatePlaylist)
	router.GET("/playlists", playlistController.GetAllPlaylists)
	router.GET("/playlists/:id", playlistController.GetPlaylistByID)
	router.POST("/playlists/:id/videos", playlistController.AddVideoToPlaylist)
	router.DELETE("/playlists/:id/videos/:videoId", playlistController.RemoveVideoFromPlaylist)
	router.DELETE("/playlists/:id", playlistController.DeletePlaylist)
}
