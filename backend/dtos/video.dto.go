package dtos

type VideoDTO struct {
	ID          uint   `json:"id"`
	Title       string `json:"title" binding:"required"`
	Description string `json:"description"`
	URL         string `json:"url"`
	Size        int64  `json:"size"`
	MimeType    string `json:"mimeType"`
	UploadAt    string `json:"uploadAt"`
	AuthorID    uint   `json:"authorId" binding:"required"`
}

type VideoResponseDTO struct {
	ID          uint   `json:"id"`
	Title       string `json:"title"`
	Description string `json:"description"`
	Author      string `json:"author"`
	AuthorID    uint   `json:"authorId"`
	Size        string `json:"size"`
	UploadedAt  string `json:"uploadedAt"`
	URL         string `json:"url"`
}