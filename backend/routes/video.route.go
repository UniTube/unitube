package routes

import (
	"backend/controllers"

	"github.com/gin-gonic/gin"
)

func SetupVideoRoutes(router *gin.RouterGroup, controller *controllers.VideoController) {
	router.POST("/videos", controller.CreateVideo)
	router.GET("/videos", controller.GetAllVideos)
	router.GET("/videos/:id", controller.GetVideoByID)
}
