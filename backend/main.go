package main

import (
	"backend/config"
	"backend/controllers"
	"backend/docs"
	"backend/models"
	"backend/repositories"
	"backend/routes"
	"backend/services"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/penglongli/gin-metrics/ginmetrics"
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
	commentService := services.NewCommentService(repositories.NewCommentRepo(db), repositories.NewVideoRepo(db), repositories.NewUserRepo(db))
	commentController := controllers.NewCommentController(commentService)
	router := gin.Default()
	router.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000", "http://127.0.0.1:3000"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"},
		AllowHeaders:     []string{"Content-Type", "Authorization", "X-Client-ID"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
	}))
	// Configure CORS
	// c := cors.New(cors.Options{
	// 	AllowedOrigins:   []string{"http://localhost:3000", "http://localhost:5173", "*"},
	// 	AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"},
	// 	AllowedHeaders:   []string{"Content-Type", "Authorization"},
	// 	ExposedHeaders:   []string{"Content-Length"},
	// 	AllowCredentials: true,
	// 	MaxAge:           300,
	// })

	//router.Use(gin.WrapH(c.Handler(router)))

	// Set Swagger info
	docs.SwaggerInfo.BasePath = "/api/v1"

	// API v1 routes
	v1 := router.Group("/api/v1")
	{
		routes.SetupUserRoutes(v1, userController)
		routes.SetupVideoRoutes(v1, videoController)
		routes.SetupCommentRoutes(v1, commentController)
		v1.GET("/tags", func(c *gin.Context) {
			var tags []models.Tag
			if err := db.Find(&tags).Error; err != nil {
				c.JSON(500, gin.H{"error": err.Error()})
				return
			}
			tagNames := make([]string, len(tags))
			for i, t := range tags {
				tagNames[i] = t.Name
			}
			c.JSON(200, tagNames)
		})
	}

	// Swagger endpoint
	router.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerfiles.Handler))
	router.GET("/sse", controllers.SSEHandler)

	// Prometheus metrics endpoint
	// get global Monitor object
	m := ginmetrics.GetMonitor()
	metricRouter := gin.Default()
	m.Expose(metricRouter)

	go func(){
		//debug/metrics
		_=metricRouter.Run(":8089")
	}()

	
	router.Run(":8088") // listens on 0.0.0.0:8088 by default
}
