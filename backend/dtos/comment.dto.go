package dtos

type CommentDTO struct {
	ID         uint   `json:"id"`
	Content    string `json:"content" binding:"required"`
	VideoID    uint   `json:"videoId" binding:"required"`
	AuthorID   uint   `json:"authorId" binding:"required"`
	Authorname string `json:"authorUsername"`
}