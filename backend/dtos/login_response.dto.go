package dtos

type LoginResponse struct {
	Token string  `json:"token"`
	User  UserDTO `json:"user"`
}