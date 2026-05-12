package main

import (
	"backend/config"
	"backend/controllers"
	"backend/routes"
  "backend/repositories"
  "backend/services"
	"github.com/gin-gonic/gin"
)

func main() {
	db := config.ConnectDB()
	userService := services.NewUserService(repositories.NewUserRepo(db))
	controller := controllers.NewController(userService)
	router := gin.Default()
	routes.SetupUserRoutes(router, controller)
	router.Run(":8088") // listens on 0.0.0.0:8088 by default
}
