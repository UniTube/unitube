package routes

import (
	"backend/controllers"

	"backend/middlewares"

	"github.com/gin-gonic/gin"
)

func SetupCommentRoutes(router *gin.RouterGroup, controller *controllers.CommentController) {
	router.POST("/videos/:id/comments", middlewares.RequireAuth,  controller.AddComment)
	router.GET("/videos/:id/comments", controller.GetComments)
	router.POST("/videos/:id/like", middlewares.RequireAuth, controller.LikeVideo)
}