package routes

import (
	"backend/controllers"
	"backend/middlewares"

	"github.com/gin-gonic/gin"
)

func SetupVideoRoutes(router *gin.RouterGroup, controller *controllers.VideoController) {
	router.POST("/videos", middlewares.RequireAuth, controller.CreateVideo)
	router.GET("/videos", controller.GetAllVideos)
	router.GET("/videos/:id/metadata", controller.GetVideoMetadata)
	router.GET("/videos/:id", controller.GetVideoByID)
	router.DELETE("/videos/:id", middlewares.RequireAuth, controller.DeleteVideo)
}
