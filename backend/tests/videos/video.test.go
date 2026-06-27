package videos

import (
	"bytes"
	"encoding/json"
	"fmt"
	"mime/multipart"
	"net/http"
	"net/http/httptest"
	"os"
	"strconv"
	"testing"
	"time"

	"backend/controllers"
	"backend/dtos"
	"backend/models"
	"backend/repositories"
	"backend/routes"
	"backend/services"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/stretchr/testify/assert"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

var testDB *gorm.DB

func setupRouter() *gin.Engine {
	gin.SetMode(gin.TestMode)
	router := gin.Default()
	
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	if err != nil {
		panic(err)
	}
	
	db.AutoMigrate(&models.User{}, &models.Video{}, &models.Comment{}, &models.Tag{}, &models.VideoLike{})
	testDB = db
	return router
}

func setupVideoRoutes(router *gin.Engine) *gin.Engine {
	videoRepo := repositories.NewVideoRepo(testDB)
	userRepo := repositories.NewUserRepo(testDB)
	videoService := services.NewVideoService(videoRepo)
	userService := services.NewUserService(userRepo, videoService)
	likeRepo := repositories.NewLikeRepo(testDB)
	commentService := services.NewCommentService(repositories.NewCommentRepo(testDB), videoRepo, userRepo, likeRepo)
	videoController := controllers.NewVideoController(videoService, userService, commentService)
	
	// Set dummy JWT secret for tests
	os.Setenv("JWT_SECRET", "test_secret")
	
	routes.SetupVideoRoutes(&router.RouterGroup, videoController)
	return router
}

func generateTestToken(username string) string {
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"username": username,
		"exp":      time.Now().Add(time.Hour * 24).Unix(),
	})
	tokenString, _ := token.SignedString([]byte("test_secret"))
	return tokenString
}

func createTestUser(email string) *models.User {
	user := &models.User{
		Name:     "Test",
		Surname:  "User",
		Email:    email,
		Password: "hashedpassword",
	}
	testDB.Create(user)
	return user
}

// TestCreateVideo tests the CreateVideo route handler
func TestCreateVideo(t *testing.T) {
	router := setupRouter()
	router = setupVideoRoutes(router)

	author := createTestUser("videoauthor@test.de")
	token := generateTestToken(author.Email)

	// Create 512 bytes of dummy data so http.DetectContentType works and no EOF is returned by Read
	fileContent := make([]byte, 512)
	for i := range fileContent {
		fileContent[i] = 'A'
	}

	body := &bytes.Buffer{}
	writer := multipart.NewWriter(body)

	// Add fields
	_ = writer.WriteField("title", "Test Video Title")
	_ = writer.WriteField("description", "Test Video Description")
	_ = writer.WriteField("authorId", strconv.Itoa(int(author.ID)))
	_ = writer.WriteField("tags", "Programming")
	_ = writer.WriteField("tags", "Go")

	// Add file
	part, err := writer.CreateFormFile("file", "test_video.mp4")
	assert.NoError(t, err)
	_, err = part.Write(fileContent)
	assert.NoError(t, err)

	err = writer.Close()
	assert.NoError(t, err)

	req, _ := http.NewRequest("POST", "/videos", body)
	req.Header.Set("Content-Type", writer.FormDataContentType())
	req.Header.Set("Authorization", "Bearer "+token)

	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusCreated, w.Code)

	var createdVideo dtos.VideoResponseDTO
	err = json.Unmarshal(w.Body.Bytes(), &createdVideo)
	assert.NoError(t, err)
	assert.Equal(t, "Test Video Title", createdVideo.Title)
	assert.Equal(t, "Test Video Description", createdVideo.Description)
	assert.Equal(t, author.ID, createdVideo.AuthorID)

	// Clean up created file from disk
	var video models.Video
	if err := testDB.First(&video, createdVideo.ID).Error; err == nil {
		os.Remove(video.URL)
	}
}

// TestGetAllVideos tests the GetAllVideos route handler
func TestGetAllVideos(t *testing.T) {
	router := setupRouter()
	router = setupVideoRoutes(router)

	author := createTestUser("allvideos@test.de")
	video1 := &models.Video{
		Title:    "Video 1",
		URL:      "/storages/dummy1.mp4",
		AuthorID: author.ID,
	}
	video2 := &models.Video{
		Title:    "Video 2",
		URL:      "/storages/dummy2.mp4",
		AuthorID: author.ID,
	}
	testDB.Create(video1)
	testDB.Create(video2)

	req, _ := http.NewRequest("GET", "/videos", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
	var videos []dtos.VideoResponseDTO
	err := json.Unmarshal(w.Body.Bytes(), &videos)
	assert.NoError(t, err)
	assert.Len(t, videos, 2)
}

// TestFilterVideos tests the FilterVideos route handler
func TestFilterVideos(t *testing.T) {
	router := setupRouter()
	router = setupVideoRoutes(router)

	author := createTestUser("filter@test.de")
	
	tagGo := models.Tag{Name: "Go"}
	tagJS := models.Tag{Name: "JavaScript"}
	testDB.Create(&tagGo)
	testDB.Create(&tagJS)

	v1 := &models.Video{
		Title:    "Golang Tutorial",
		URL:      "/storages/go.mp4",
		AuthorID: author.ID,
		Tags:     []models.Tag{tagGo},
	}
	v2 := &models.Video{
		Title:    "JS Basics",
		URL:      "/storages/js.mp4",
		AuthorID: author.ID,
		Tags:     []models.Tag{tagJS},
	}
	testDB.Create(v1)
	testDB.Create(v2)

	// Filter by tag "Go"
	req, _ := http.NewRequest("GET", "/videos/filter?tags=Go", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)
	assert.Equal(t, http.StatusOK, w.Code)
	
	var videos []dtos.VideoResponseDTO
	err := json.Unmarshal(w.Body.Bytes(), &videos)
	assert.NoError(t, err)
	assert.Len(t, videos, 1)
	assert.Equal(t, "Golang Tutorial", videos[0].Title)

	// Filter by name "JS"
	req2, _ := http.NewRequest("GET", "/videos/filter?name=JS", nil)
	w2 := httptest.NewRecorder()
	router.ServeHTTP(w2, req2)
	assert.Equal(t, http.StatusOK, w2.Code)
	
	var videos2 []dtos.VideoResponseDTO
	err = json.Unmarshal(w2.Body.Bytes(), &videos2)
	assert.NoError(t, err)
	assert.Len(t, videos2, 1)
	assert.Equal(t, "JS Basics", videos2[0].Title)
}

// TestGetVideoMetadata tests the GetVideoMetadata route handler
func TestGetVideoMetadata(t *testing.T) {
	router := setupRouter()
	router = setupVideoRoutes(router)

	author := createTestUser("metadata@test.de")
	video := &models.Video{
		Title:       "Meta Video",
		Description: "Meta Desc",
		URL:         "/storages/meta.mp4",
		AuthorID:    author.ID,
	}
	testDB.Create(video)

	req, _ := http.NewRequest("GET", fmt.Sprintf("/videos/%d/metadata", video.ID), nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
	var meta dtos.VideoResponseDTO
	err := json.Unmarshal(w.Body.Bytes(), &meta)
	assert.NoError(t, err)
	assert.Equal(t, video.ID, meta.ID)
	assert.Equal(t, "Meta Video", meta.Title)
	assert.Equal(t, "Meta Desc", meta.Description)
}

// TestGetVideoByID tests the GetVideoByID route handler for streaming
func TestGetVideoByID(t *testing.T) {
	router := setupRouter()
	router = setupVideoRoutes(router)

	author := createTestUser("stream@test.de")
	
	// Create a temporary file with some content
	tempFile, err := os.CreateTemp("", "test_stream_*.mp4")
	assert.NoError(t, err)
	defer os.Remove(tempFile.Name())
	
	fileContent := []byte("0123456789abcdefghijklmnopqrstuvwxyz")
	_, err = tempFile.Write(fileContent)
	assert.NoError(t, err)
	tempFile.Close()

	video := &models.Video{
		Title:    "Stream Video",
		URL:      tempFile.Name(),
		Size:     int64(len(fileContent)),
		MimeType: "video/mp4",
		AuthorID: author.ID,
	}
	testDB.Create(video)

	// Test 1: Full content (no Range header)
	req, _ := http.NewRequest("GET", fmt.Sprintf("/videos/%d", video.ID), nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
	assert.Equal(t, fileContent, w.Body.Bytes())
	assert.Equal(t, "video/mp4", w.Header().Get("Content-Type"))

	// Test 2: Partial Content (Range: bytes=0-9)
	req2, _ := http.NewRequest("GET", fmt.Sprintf("/videos/%d", video.ID), nil)
	req2.Header.Set("Range", "bytes=0-9")
	w2 := httptest.NewRecorder()
	router.ServeHTTP(w2, req2)

	assert.Equal(t, http.StatusPartialContent, w2.Code)
	assert.Equal(t, fileContent[0:10], w2.Body.Bytes())
	assert.Equal(t, "bytes 0-9/36", w2.Header().Get("Content-Range"))
}

// TestDeleteVideo tests the DeleteVideo route handler
func TestDeleteVideo(t *testing.T) {
	router := setupRouter()
	router = setupVideoRoutes(router)

	author := createTestUser("deletevideo@test.de")
	token := generateTestToken(author.Email)

	video := &models.Video{
		Title:    "Delete Me",
		URL:      "/storages/deleteme.mp4",
		AuthorID: author.ID,
	}
	testDB.Create(video)

	req, _ := http.NewRequest("DELETE", fmt.Sprintf("/videos/%d", video.ID), nil)
	req.Header.Set("Authorization", "Bearer "+token)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
	var resp map[string]string
	err := json.Unmarshal(w.Body.Bytes(), &resp)
	assert.NoError(t, err)
	assert.Equal(t, "Video deleted successfully", resp["message"])

	// Check it was deleted from DB
	var check models.Video
	err = testDB.First(&check, video.ID).Error
	assert.Error(t, err) // Should not be found
}
