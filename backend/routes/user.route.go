package routes

import  (
	"backend/controllers"
	"github.com/gin-gonic/gin"
)

func SetupUserRoutes(router *gin.Engine, controller *controllers.Controller) {
	router.POST("/users", controller.CreateUser)
	router.GET("/users", controller.GetAllUsers)
	router.GET("/users/:id", controller.GetUserByID)
	router.PUT("/users/:id", controller.UpdateUser)
	router.DELETE("/users/:id", controller.DeleteUser)
}