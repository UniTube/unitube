package repositories

import (
	"backend/models"

	"gorm.io/gorm"
)

type PlaylistRepo struct {
	Db *gorm.DB
}

func NewPlaylistRepo(db *gorm.DB) *PlaylistRepo {
	return &PlaylistRepo{Db: db}
}

func (p *PlaylistRepo) CreatePlaylist(playlist *models.Playlist) (result *models.Playlist, err error) {
	var user models.User
	if err := p.Db.First(&user, playlist.UserID).Error; err != nil {
		return nil, err
	}
	// create with result
	if err := p.Db.Create(&playlist).Error; err != nil {
		return nil, err
	}
	return playlist, nil
}

func (p *PlaylistRepo) GetAllPlaylists() ([]models.Playlist, error) {
	var playlists []models.Playlist
	if err := p.Db.Preload("Videos").Preload("Videos.Author").Preload("Videos.Tags").Find(&playlists).Error; err != nil {
		return nil, err
	}
	return playlists, nil
}

func (p *PlaylistRepo) AddVideoToPlaylist(playlistID uint, videoID uint) error {
	var playlist models.Playlist
	if err := p.Db.First(&playlist, playlistID).Error; err != nil {
		return err
	}
	var video models.Video
	if err := p.Db.First(&video, videoID).Error; err != nil {
		return err
	}
	if err := p.Db.Model(&playlist).Association("Videos").Append(&video); err != nil {
		return err
	}
	return nil
}

func (p *PlaylistRepo) RemoveVideoFromPlaylist(playlistID uint, videoID uint) error {
	var playlist models.Playlist
	if err := p.Db.First(&playlist, playlistID).Error; err != nil {
		return err
	}
	var video models.Video
	if err := p.Db.First(&video, videoID).Error; err != nil {
		return err
	}
	if err := p.Db.Model(&playlist).Association("Videos").Delete(&video); err != nil {
		return err
	}
	return nil
}

func (p *PlaylistRepo) DeletePlaylist(playlistID uint) error {
	if err := p.Db.Delete(&models.Playlist{}, playlistID).Error; err != nil {
		return err
	}
	return nil
}

func (p *PlaylistRepo) GetPlaylistByID(playlistID uint) (*models.Playlist, error) {
	var playlist models.Playlist
	if err := p.Db.Preload("Videos").Preload("Videos.Author").Preload("Videos.Tags").First(&playlist, playlistID).Error; err != nil {
		return nil, err
	}
	return &playlist, nil
}

// GetPlaylistsByUserID retrieves all playlists for a specific user
func (p *PlaylistRepo) GetPlaylistsByUserID(userID uint) ([]models.Playlist, error) {
	var playlists []models.Playlist
	if err := p.Db.Where("user_id = ?", userID).Preload("Videos").Preload("Videos.Author").Preload("Videos.Tags").Find(&playlists).Error; err != nil {
		return nil, err
	}
	return playlists, nil
}
