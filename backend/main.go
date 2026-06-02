package main

import (
	"backend/config"
	"backend/controllers"
	"backend/docs"
	"backend/repositories"
	"backend/routes"
	"backend/services"

	"github.com/gin-gonic/gin"
	swaggerfiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
)

// @BasePath /api/v1
func main() {
	db := config.ConnectDB()
	userService := services.NewUserService(repositories.NewUserRepo(db))
	userController := controllers.NewUserController(userService)
	videoService := services.NewVideoService(repositories.NewVideoRepo(db))
	videoController := controllers.NewVideoController(videoService)
	router := gin.Default()
	
	// Set Swagger info
	docs.SwaggerInfo.BasePath = "/api/v1"
	
	// API v1 routes
	v1 := router.Group("/api/v1")
	{
		routes.SetupUserRoutes(v1, userController)
		routes.SetupVideoRoutes(v1, videoController)
	}
	
	// Swagger endpoint
	router.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerfiles.Handler))
	
	router.Run(":8088") // listens on 0.0.0.0:8088 by default
}
