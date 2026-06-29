package users

import "testing"

func TestUsersSuite(t *testing.T) {
	t.Run("CreateUser", TestCreateUser)
	t.Run("GetUserByID", TestGetUserByID)
	t.Run("UpdateUser", TestUpdateUser)
	t.Run("DeleteUser", TestDeleteUser)
	t.Run("GetAllUsers", TestGetAllUsers)
	t.Run("GetUserByIDNotFound", TestGetUserByIDNotFound)
	t.Run("CreateUserInvalidInput", TestCreateUserInvalidInput)
	t.Run("UpdateUserInvalidInput", TestUpdateUserInvalidInput)
	t.Run("DeleteUserNotFound", TestDeleteUserNotFound)
	t.Run("GetAllUsersEmpty", TestGetAllUsersEmpty)
	t.Run("Login", TestLogin)
	t.Run("LoginInvalidCredentials", TestLoginInvalidCredentials)
	t.Run("LoginMissingFields", TestLoginMissingFields)
}
