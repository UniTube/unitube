package repositories

import (
	"backend/models"

	"gorm.io/gorm"
)

type VideoRepo struct {
    Db *gorm.DB
}

func NewVideoRepo(db *gorm.DB) *VideoRepo {
	return &VideoRepo{Db: db}
}

func (v *VideoRepo) CreateVideo(video *models.Video)  error {

	var user models.User
	if err := v.Db.First(&user, video.AuthorID).Error; err != nil {
		return err
	}
	if err := v.Db.Create(video).Error; err != nil {
		return err
	}
	return nil
}

func (v *VideoRepo) GetAllVideos() ([]models.Video, error) {
	var videos []models.Video
	if err := v.Db.Find(&videos).Error; err != nil {
		return nil, err
	}
	return videos, nil
}

