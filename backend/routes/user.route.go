package routes

import (
	"backend/controllers"
	"backend/middlewares"

	"github.com/gin-gonic/gin"
)

func SetupUserRoutes(router *gin.RouterGroup, controller *controllers.UserController) {
	router.POST("/users", controller.CreateUser)
	router.GET("/users", middlewares.RequireAuth, controller.GetAllUsers)
	router.GET("/users/:id", middlewares.RequireAuth, controller.GetUserByID)
	router.PUT("/users/:id", middlewares.RequireAuth, controller.UpdateUser)
	router.DELETE("/users/:id", middlewares.RequireAuth, controller.DeleteUser)
	router.POST("/login", controller.LoginUser)
}