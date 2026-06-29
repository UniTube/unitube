package repositories

import (
	"backend/models"

	"gorm.io/gorm"
)

type LikeRepo struct {
	Db *gorm.DB
}

func NewLikeRepo(db *gorm.DB) *LikeRepo {
	return &LikeRepo{Db: db}
}

func (r *LikeRepo) HasUserLiked(userID, videoID uint) (bool, error) {
	var count int64
	err := r.Db.Model(&models.VideoLike{}).
		Where("user_id = ? AND video_id = ?", userID, videoID).
		Count(&count).Error
	return count > 0, err
}

func (r *LikeRepo) CreateLike(userID, videoID uint) error {
	return r.Db.Transaction(func(tx *gorm.DB) error {
		like := &models.VideoLike{UserID: userID, VideoID: videoID}
		if err := tx.Create(like).Error; err != nil {
			return err
		}
		return tx.Model(&models.Video{}).
			Where("id = ?", videoID).
			UpdateColumn("likes", gorm.Expr("likes + 1")).Error
	})
}

func (r *LikeRepo) DeleteLike(userID, videoID uint) error {
	return r.Db.Transaction(func(tx *gorm.DB) error {
		result := tx.Where("user_id = ? AND video_id = ?", userID, videoID).Delete(&models.VideoLike{})
		if result.Error != nil {
			return result.Error
		}
		if result.RowsAffected == 0 {
			return nil
		}
		return tx.Model(&models.Video{}).
			Where("id = ? AND likes > 0", videoID).
			UpdateColumn("likes", gorm.Expr("likes - 1")).Error
	})
}
