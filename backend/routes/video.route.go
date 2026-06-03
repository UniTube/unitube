package routes

import (
	"backend/controllers"
	"backend/middlewares"

	"github.com/gin-gonic/gin"
)

func SetupVideoRoutes(router *gin.RouterGroup, controller *controllers.VideoController) {
	router.POST("/videos", middlewares.RequireAuth, controller.CreateVideo)
	router.GET("/videos", middlewares.RequireAuth, controller.GetAllVideos)
	router.GET("/videos/:id", middlewares.RequireAuth, controller.GetVideoByID)
}
