package services

import (
	"backend/dtos"
	"backend/models"
	"backend/repositories"

	"gorm.io/gorm"
)

type CommentService struct {
	commentRepo *repositories.CommentRepo
	videoRepo   *repositories.VideoRepo
}

func NewCommentService(commentRepo *repositories.CommentRepo, videoRepo *repositories.VideoRepo) *CommentService {
	return &CommentService{commentRepo: commentRepo, videoRepo: videoRepo}
}

func (s *CommentService) AddComment(dto *dtos.CommentDTO) error {
	comment := &models.Comment{
		Content:  dto.Content,
		VideoID:  dto.VideoID,
		AuthorID: dto.AuthorID,
	}
	return s.commentRepo.CreateComment(comment)
}

func (s *CommentService) GetCommentsByVideoID(videoID uint) ([]dtos.CommentDTO, error) {
	comments, err := s.commentRepo.GetCommentsByVideoID(videoID)
	if err != nil {
		return nil, err
	}
	commentDTOs := make([]dtos.CommentDTO, len(comments))
	for i, c := range comments {
		commentDTOs[i] = dtos.CommentDTO{ID: c.ID, Content: c.Content, VideoID: c.VideoID, AuthorID: c.AuthorID}
	}
	return commentDTOs, nil
}

// LikeVideo increments the like counter atomically
func (s *CommentService) LikeVideo(videoID uint) error {
	return s.videoRepo.Db.Model(&models.Video{}).
		Where("id = ?", videoID).
		UpdateColumn("likes", gorm.Expr("likes + 1")).Error
}