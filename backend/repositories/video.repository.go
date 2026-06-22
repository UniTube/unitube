package repositories

import (
	"backend/models"
	"strings"

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
	if err := v.Db.Preload("Author").Preload("Tags").Find(&videos).Error; err != nil {
		return nil, err
	}
	return videos, nil
}

func (v *VideoRepo) GetVideoByID(id uint) (*models.Video, error) {
	var video models.Video
	if err := v.Db.Preload("Author").Preload("Tags").First(&video, id).Error; err != nil {
		return nil, err
	}
	return &video, nil
}

func (v *VideoRepo) GetVideosByAuthorID(authorID uint) ([]models.Video, error) {
	var videos []models.Video
	if err := v.Db.Preload("Author").Preload("Tags").Where("author_id = ?", authorID).Order("created_at DESC").Find(&videos).Error; err != nil {
		return nil, err
	}
	return videos, nil
}

func (v *VideoRepo) DeleteVideo(id uint) error{
	
	if err := v.Db.Delete(&models.Video{}, id).Error; err != nil{
		return err;
	}
	return  nil
}

func (v *VideoRepo) Filter(name string, tags []string) ([]models.Video, error) {
	var videos []models.Video
	query := v.Db.Preload("Author").Preload("Tags")

	if name != "" {
		query = query.Where("LOWER(title) LIKE LOWER(?)", "%"+name+"%")
	}

	if len(tags) > 0 {
		var lowerTags []string
		for _, t := range tags {
			lowerTags = append(lowerTags, strings.ToLower(t))
		}
		query = query.Joins("JOIN video_tags ON video_tags.video_id = videos.id").
			Joins("JOIN tags ON tags.id = video_tags.tag_id").
			Where("LOWER(tags.name) IN ?", lowerTags).
			Distinct("videos.*")
	}

	err := query.Find(&videos).Error
	return videos, err
}