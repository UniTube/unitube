package dtos

type VideoDTO struct {
	ID          uint   `json:"id"`
	Title       string `json:"title" binding:"required"`
	Description string `json:"description"`
	URL         string `json:"url"`
	MimeType    string `json:"mimeType"`
	UploadAt    string `json:"uploadAt"`
	AuthorID    uint   `json:"authorId" binding:"required"`
}