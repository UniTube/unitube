package repositories

import (
	"backend/models"

	"gorm.io/gorm"
)

type CommentRepo struct {
	Db *gorm.DB
}

func NewCommentRepo(db *gorm.DB) *CommentRepo {
	return &CommentRepo{Db: db}
}

func (r *CommentRepo) CreateComment(comment *models.Comment) error {
	return r.Db.Create(comment).Error
}

func (r *CommentRepo) GetCommentsByVideoID(videoID uint) ([]models.Comment, error) {
	var comments []models.Comment
	err := r.Db.Where("video_id = ?", videoID).Find(&comments).Error
	return comments, err
}