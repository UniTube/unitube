package services

import (
	"backend/dtos"
	"backend/models"
	"backend/repositories"
	"fmt"
)

type PlaylistService struct {
	playlistRepo *repositories.PlaylistRepo
	userRepo     *repositories.UserRepo
	videoRepo    *repositories.VideoRepo
}

func NewPlaylistService(playlistRepo *repositories.PlaylistRepo, userRepo *repositories.UserRepo, videoRepo *repositories.VideoRepo) *PlaylistService {
	return &PlaylistService{
		playlistRepo: playlistRepo,
		userRepo:     userRepo,
		videoRepo:    videoRepo,
	}
}

func (s *PlaylistService) CreatePlaylist(playlistDTO dtos.PlaylistDTO) (result *dtos.PlaylistDTO, err error) {
	playlist := &models.Playlist{
		Name:   playlistDTO.Name,
		UserID: playlistDTO.UserID,
	}
	createdPlaylist, err := s.playlistRepo.CreatePlaylist(playlist)
	if err != nil {
		return nil, err
	}
	return &dtos.PlaylistDTO{
		ID:     createdPlaylist.ID,
		Name:   createdPlaylist.Name,
		UserID: createdPlaylist.UserID,
	}, nil
}

func (s *PlaylistService) GetAllPlaylists() ([]dtos.PlaylistDTO, error) {
	data, err := s.playlistRepo.GetAllPlaylists()
	if err != nil {
		return nil, err
	}
	// Convert models to DTOs
	playlistDTOs := make([]dtos.PlaylistDTO, len(data))
	for i, playlist := range data {
		playlistDTOs[i] = dtos.PlaylistDTO{
			ID:     playlist.ID,
			Name:   playlist.Name,
			UserID: playlist.UserID,
		}
	}
	return playlistDTOs, nil
}

func (s *PlaylistService) AddVideoToPlaylist(playlistID uint, videoID uint, userID uint) error {
	// verify that the playlist belongs to the user
	playlist, err := s.playlistRepo.GetPlaylistByID(playlistID)
	if err != nil {
		return err
	}
	if playlist.UserID != userID {
		return fmt.Errorf("playlist does not belong to user")
	}

	// verify that the user exists
	user, err := s.userRepo.GetUserByID(userID)
	if err != nil {
		return err
	}
	if user == nil {
		return fmt.Errorf("user not found")
	}

	// verify that the video exists
	video, err := s.videoRepo.GetVideoByID(videoID)
	if err != nil {
		return err
	}
	if video == nil {
		return fmt.Errorf("video not found")
	}

	// verify that the playlist belongs to the user
	playlist, err = s.playlistRepo.GetPlaylistByID(playlistID)
	if err != nil {
		return err
	}
	if playlist.UserID != userID {
		return fmt.Errorf("playlist does not belong to user")
	}

	return s.playlistRepo.AddVideoToPlaylist(playlistID, videoID)
}

// deletePlaylist deletes a playlist by its ID.
func (s *PlaylistService) DeletePlaylist(playlistID uint) error {
	return s.playlistRepo.DeletePlaylist(playlistID)
}