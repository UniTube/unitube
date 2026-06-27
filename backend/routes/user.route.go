package routes

import (
	"backend/controllers"
	"backend/middlewares"

	"github.com/gin-gonic/gin"
)

func SetupUserRoutes(router *gin.RouterGroup, controller *controllers.UserController) {
	router.POST("/users", controller.CreateUser)
	router.GET("/users", middlewares.RequireAuth, controller.GetAllUsers)
	router.GET("/users/me/profile", middlewares.RequireAuth, controller.GetMyProfile)
	router.PUT("/users/me/profile", middlewares.RequireAuth, controller.UpdateMyProfile)
	router.GET("/users/:id/profile", controller.GetUserProfile)
	router.PUT("/users/:id/profile", middlewares.RequireAuth, controller.UpdateProfile)
	router.GET("/users/:id", middlewares.RequireAuth, controller.GetUserByID)
	router.PUT("/users/:id", middlewares.RequireAuth, controller.UpdateUser)
	router.DELETE("/users/:id", middlewares.RequireAuth, controller.DeleteUser)
	router.POST("/login", controller.LoginUser)
}