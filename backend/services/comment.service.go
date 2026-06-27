package services

import (
	"backend/dtos"
	"backend/models"
	"backend/repositories"

)

type CommentService struct {
	commentRepo *repositories.CommentRepo
	videoRepo   *repositories.VideoRepo
	userRepo    *repositories.UserRepo
	likeRepo    *repositories.LikeRepo
}

func NewCommentService(commentRepo *repositories.CommentRepo, videoRepo *repositories.VideoRepo, userRepo *repositories.UserRepo, likeRepo *repositories.LikeRepo) *CommentService {
	return &CommentService{commentRepo: commentRepo, videoRepo: videoRepo, userRepo: userRepo, likeRepo: likeRepo}
}

func (s *CommentService) AddComment(dto *dtos.CommentDTO) error {
	comment := &models.Comment{
		Content:  dto.Content,
		VideoID:  dto.VideoID,
		AuthorID: dto.AuthorID,
	}
	if err := s.commentRepo.CreateComment(comment); err != nil {
		return err
	}

	// Populate authorUsername so the response includes it immediately
	user, err := s.userRepo.GetUserByID(dto.AuthorID)
	if err != nil {
		return err
	}
	dto.ID = comment.ID
	dto.Authorname = user.Name
	return nil
}

func (s *CommentService) GetCommentsByVideoID(videoID uint) ([]dtos.CommentDTO, error) {
	comments, err := s.commentRepo.GetCommentsByVideoID(videoID)
	if err != nil {
		return nil, err
	}
	commentDTOs := make([]dtos.CommentDTO, len(comments))
	for i, c := range comments {
		user, err := s.userRepo.GetUserByID(c.AuthorID)
		if err != nil {
			return nil, err
		}
		commentDTOs[i] = dtos.CommentDTO{
			ID:         c.ID,
			Content:    c.Content,
			VideoID:    c.VideoID,
			AuthorID:   c.AuthorID,
			Authorname: user.Name,
		}
	}
	return commentDTOs, nil
}

// LikeVideo records a like from the user and increments the counter (idempotent).
func (s *CommentService) LikeVideo(userID, videoID uint) error {
	liked, err := s.likeRepo.HasUserLiked(userID, videoID)
	if err != nil {
		return err
	}
	if liked {
		return nil
	}
	return s.likeRepo.CreateLike(userID, videoID)
}

func (s *CommentService) HasUserLiked(userID, videoID uint) (bool, error) {
	return s.likeRepo.HasUserLiked(userID, videoID)
}

func (s *CommentService) GetUserByEmail(email string) (*models.User, error) {
	return s.userRepo.GetUserByEmail(email)
}