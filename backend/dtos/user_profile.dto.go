package dtos

type UserProfileDTO struct {
	ID         uint               `json:"id"`
	Name       string             `json:"name"`
	Surname    string             `json:"surname"`
	JoinedAt   string             `json:"joinedAt"`
	VideoCount int                `json:"videoCount"`
	Videos     []VideoResponseDTO `json:"videos"`
}

type UpdateProfileDTO struct {
	Name    string `json:"name" binding:"required"`
	Surname string `json:"surname"`
}
