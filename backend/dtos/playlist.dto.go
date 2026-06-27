package dtos

type PlaylistDTO struct {
	ID     uint               `json:"id"`
	Name   string             `json:"name"`
	UserID uint               `json:"user_id"`
	Count  int                `json:"count"`
	Videos []VideoResponseDTO `json:"videos,omitempty"`
}
