package users

import (
	"backend/controllers"
	"backend/dtos"
	"backend/models"
	"backend/repositories"
	"backend/routes"
	"backend/services"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"os"
	"strings"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	gormlogger "gorm.io/gorm/logger"
)

var testDB *gorm.DB

func setupRouter() *gin.Engine {
	gin.SetMode(gin.TestMode)
	router := gin.Default()
	
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{
		Logger: gormlogger.Default.LogMode(gormlogger.Silent),
	})
	if err != nil {
		panic(err)
	}
	
	db.AutoMigrate(&models.User{}, &models.Video{}, &models.Comment{}, &models.Tag{}, &models.Playlist{})
	testDB = db
	return router
}

func setupUserRoutes(router *gin.Engine) *gin.Engine {
	videoService := services.NewVideoService(repositories.NewVideoRepo(testDB))
	userService := services.NewUserService(repositories.NewUserRepo(testDB), videoService)
	userController := controllers.NewUserController(userService)
	
	// Set dummy JWT secret for tests
	os.Setenv("JWT_SECRET", "test_secret")
	
	routes.SetupUserRoutes(&router.RouterGroup, userController)
	return router
}

func createTestUserDirectly(t *testing.T, email, password string) *models.User {
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), 10)
	assert.NoError(t, err)
	
	user := &models.User{
		Name:     "Test",
		Surname:  "User",
		Email:    email,
		Password: string(hashedPassword),
	}
	err = testDB.Create(user).Error
	assert.NoError(t, err)
	return user
}

func getAuthToken(t *testing.T, router *gin.Engine, email, password string) string {
	loginDTO := dtos.LoginDTO{
		Email:    email,
		Password: password,
	}
	jsonValue, _ := json.Marshal(loginDTO)
	req, _ := http.NewRequest("POST", "/login", strings.NewReader(string(jsonValue)))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)
	
	assert.Equal(t, http.StatusOK, w.Code)
	
	var resp dtos.LoginResponse
	err := json.Unmarshal(w.Body.Bytes(), &resp)
	assert.NoError(t, err)
	return resp.Token
}

// TestCreateUser tests the CreateUser route handler
func TestCreateUser(t *testing.T) {
	router := setupRouter()
	router = setupUserRoutes(router)

	// Create a new user
	user := dtos.UserDTO{
		Name:     "John",
		Surname:  "Doe",
		Email:    "johndoe@test.de",
		Password: "password123",
	}
	jsonValue, _ := json.Marshal(user)
	req, _ := http.NewRequest("POST", "/users", strings.NewReader(string(jsonValue)))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)
	assert.Equal(t, http.StatusCreated, w.Code)
	var createdUser dtos.UserDTO
	err := json.Unmarshal(w.Body.Bytes(), &createdUser)
	assert.NoError(t, err)
	assert.Equal(t, user.Name, createdUser.Name)
	assert.Equal(t, user.Surname, createdUser.Surname)
	assert.Equal(t, user.Email, createdUser.Email)
	assert.Empty(t, createdUser.Password) // Password should be empty in the response
}

// TestGetUserByID tests the GetUserByID route handler
func TestGetUserByID(t *testing.T) {
	router := setupRouter()
	router = setupUserRoutes(router)

	user := createTestUserDirectly(t, "getbyid@test.de", "password123")
	token := getAuthToken(t, router, "getbyid@test.de", "password123")

	req, _ := http.NewRequest("GET", fmt.Sprintf("/users/%d", user.ID), nil)
	req.Header.Set("Authorization", "Bearer "+token)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
	var fetchedUser dtos.UserDTO
	err := json.Unmarshal(w.Body.Bytes(), &fetchedUser)
	assert.NoError(t, err)
	assert.Equal(t, user.ID, fetchedUser.ID)
	assert.Equal(t, user.Email, fetchedUser.Email)
}

//TestUpdateUser tests the UpdateUser route handler
func TestUpdateUser(t *testing.T) {
	router := setupRouter()
	router = setupUserRoutes(router)

	user := createTestUserDirectly(t, "update@test.de", "password123")
	token := getAuthToken(t, router, "update@test.de", "password123")

	updatedUserDTO := dtos.UserDTO{
		ID:      user.ID,
		Name:    "UpdatedName",
		Surname: "UpdatedSurname",
		Email:   "updatedemail@test.de",
		Password: "updatedpassword123",
	}
	jsonValue, _ := json.Marshal(updatedUserDTO)
	req, _ := http.NewRequest("PUT", fmt.Sprintf("/users/%d", user.ID), strings.NewReader(string(jsonValue)))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+token)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
	var result dtos.UserDTO
	err := json.Unmarshal(w.Body.Bytes(), &result)
	assert.NoError(t, err)
	assert.Equal(t, "UpdatedName", result.Name)
	assert.Equal(t, "UpdatedSurname", result.Surname)
	assert.Equal(t, "updatedemail@test.de", result.Email)
}

//TestDeleteUser tests the DeleteUser route handler
func TestDeleteUser(t *testing.T) {
	router := setupRouter()
	router = setupUserRoutes(router)

	user := createTestUserDirectly(t, "delete@test.de", "password123")
	token := getAuthToken(t, router, "delete@test.de", "password123")

	req, _ := http.NewRequest("DELETE", fmt.Sprintf("/users/%d", user.ID), nil)
	req.Header.Set("Authorization", "Bearer "+token)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
	var resp map[string]string
	err := json.Unmarshal(w.Body.Bytes(), &resp)
	assert.NoError(t, err)
	assert.Equal(t, "User deleted successfully", resp["message"])
}

// TestGetAllUsers tests the GetAllUsers route handler
func TestGetAllUsers(t *testing.T) {
	router := setupRouter()
	router = setupUserRoutes(router)

	user1 := createTestUserDirectly(t, "user1@test.de", "password123")
	user2 := createTestUserDirectly(t, "user2@test.de", "password123")
	token := getAuthToken(t, router, "user1@test.de", "password123")

	req, _ := http.NewRequest("GET", "/users", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
	var users []dtos.UserDTO
	err := json.Unmarshal(w.Body.Bytes(), &users)
	assert.NoError(t, err)
	assert.Len(t, users, 2)

	emails := []string{users[0].Email, users[1].Email}
	assert.Contains(t, emails, user1.Email)
	assert.Contains(t, emails, user2.Email)
}

// TestGetUserByIDNotFound tests the GetUserByID route handler when the user is not found
func TestGetUserByIDNotFound(t *testing.T) {
	router := setupRouter()
	router = setupUserRoutes(router)

	createTestUserDirectly(t, "notfound@test.de", "password123")
	token := getAuthToken(t, router, "notfound@test.de", "password123")

	req, _ := http.NewRequest("GET", "/users/9999", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusNotFound, w.Code)
}

// TestCreateUserInvalidInput tests the CreateUser route handler with invalid input
func TestCreateUserInvalidInput(t *testing.T) {
	router := setupRouter()
	router = setupUserRoutes(router)

	// Missing Name and Email
	user := dtos.UserDTO{
		Surname:  "Doe",
		Password: "password123",
	}
	jsonValue, _ := json.Marshal(user)
	req, _ := http.NewRequest("POST", "/users", strings.NewReader(string(jsonValue)))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)
}

// TestUpdateUserInvalidInput tests the UpdateUser route handler with invalid input
func TestUpdateUserInvalidInput(t *testing.T) {
	router := setupRouter()
	router = setupUserRoutes(router)

	user := createTestUserDirectly(t, "updateinvalid@test.de", "password123")
	token := getAuthToken(t, router, "updateinvalid@test.de", "password123")

	// Missing Email in payload
	updatedUserDTO := dtos.UserDTO{
		ID:       user.ID,
		Name:     "UpdatedName",
		Password: "newpassword",
	}
	jsonValue, _ := json.Marshal(updatedUserDTO)
	req, _ := http.NewRequest("PUT", fmt.Sprintf("/users/%d", user.ID), strings.NewReader(string(jsonValue)))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+token)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)
}

// TestDeleteUserNotFound tests the DeleteUser route handler when the user is not found
func TestDeleteUserNotFound(t *testing.T) {
	router := setupRouter()
	router = setupUserRoutes(router)

	 createTestUserDirectly(t, "deletenotfound@test.de", "password123")
	token := getAuthToken(t, router, "deletenotfound@test.de", "password123")

	req, _ := http.NewRequest("DELETE", "/users/9999", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
}

// TestGetAllUsersEmpty tests the GetAllUsers route handler when there are no users
func TestGetAllUsersEmpty(t *testing.T) {
	router := setupRouter()
	router = setupUserRoutes(router)

	createTestUserDirectly(t, "empty@test.de", "password123")
	token := getAuthToken(t, router, "empty@test.de", "password123")

	req, _ := http.NewRequest("GET", "/users", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
	var users []dtos.UserDTO
	err := json.Unmarshal(w.Body.Bytes(), &users)
	assert.NoError(t, err)
	assert.Len(t, users, 1)
	assert.Equal(t, "empty@test.de", users[0].Email)
}

//TestLogin tests the Login route handler
func TestLogin(t *testing.T) {
	router := setupRouter()
	router = setupUserRoutes(router)

	createTestUserDirectly(t, "login@test.de", "password123")

	loginDTO := dtos.LoginDTO{
		Email:    "login@test.de",
		Password: "password123",
	}
	jsonValue, _ := json.Marshal(loginDTO)
	req, _ := http.NewRequest("POST", "/login", strings.NewReader(string(jsonValue)))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
	var resp dtos.LoginResponse
	err := json.Unmarshal(w.Body.Bytes(), &resp)
	assert.NoError(t, err)
	assert.NotEmpty(t, resp.Token)
	assert.Equal(t, "login@test.de", resp.User.Email)
}

// TestLoginInvalidCredentials tests the Login route handler with invalid credentials
func TestLoginInvalidCredentials(t *testing.T) {
	router := setupRouter()
	router = setupUserRoutes(router)

	createTestUserDirectly(t, "logininvalid@test.de", "password123")

	loginDTO := dtos.LoginDTO{
		Email:    "logininvalid@test.de",
		Password: "wrongpassword",
	}
	jsonValue, _ := json.Marshal(loginDTO)
	req, _ := http.NewRequest("POST", "/login", strings.NewReader(string(jsonValue)))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusUnauthorized, w.Code)
}

// TestLoginMissingFields tests the Login route handler with missing fields
func TestLoginMissingFields(t *testing.T) {
	router := setupRouter()
	router = setupUserRoutes(router)

	loginDTO := dtos.LoginDTO{
		Email: "missing@test.de",
	}
	jsonValue, _ := json.Marshal(loginDTO)
	req, _ := http.NewRequest("POST", "/login", strings.NewReader(string(jsonValue)))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)
}
