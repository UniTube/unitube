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
		Count:  0,
	}, nil
}

func (s *PlaylistService) toPlaylistDTO(playlist *models.Playlist, includeVideos bool) dtos.PlaylistDTO {
	playlistDTO := dtos.PlaylistDTO{
		ID:     playlist.ID,
		Name:   playlist.Name,
		UserID: playlist.UserID,
		Count:  len(playlist.Videos),
	}

	if includeVideos {
		playlistDTO.Videos = make([]dtos.VideoResponseDTO, len(playlist.Videos))
		for i, video := range playlist.Videos {
			playlistDTO.Videos[i] = s.toVideoResponseDTO(&video)
		}
	}

	return playlistDTO
}

func (s *PlaylistService) toVideoResponseDTO(video *models.Video) dtos.VideoResponseDTO {
	authorName := "Unknown"
	if video.Author.ID != 0 {
		authorName = fmt.Sprintf("%s %s", video.Author.Name, video.Author.Surname)
	}

	uploadedAt := video.UploadAt
	if uploadedAt == "" {
		uploadedAt = video.CreatedAt.Format("02/01/2006 15:04")
	}

	tagNames := make([]string, len(video.Tags))
	for i, tag := range video.Tags {
		tagNames[i] = tag.Name
	}

	return dtos.VideoResponseDTO{
		ID:          video.ID,
		Title:       video.Title,
		Description: video.Description,
		Author:      authorName,
		AuthorID:    video.AuthorID,
		Size:        fmt.Sprintf("%d", video.Size),
		UploadedAt:  uploadedAt,
		URL:         fmt.Sprintf("/api/v1/videos/%d", video.ID),
		Tags:        tagNames,
	}
}

func (s *PlaylistService) GetAllPlaylists() ([]dtos.PlaylistDTO, error) {
	data, err := s.playlistRepo.GetAllPlaylists()
	if err != nil {
		return nil, err
	}
	playlistDTOs := make([]dtos.PlaylistDTO, len(data))
	for i, playlist := range data {
		playlistDTOs[i] = s.toPlaylistDTO(&playlist, false)
	}
	return playlistDTOs, nil
}

func (s *PlaylistService) GetPlaylistByID(playlistID uint) (*dtos.PlaylistDTO, error) {
	playlist, err := s.playlistRepo.GetPlaylistByID(playlistID)
	if err != nil {
		return nil, err
	}
	playlistDTO := s.toPlaylistDTO(playlist, true)
	return &playlistDTO, nil
}

func (s *PlaylistService) AddVideoToPlaylist(playlistID uint, videoID uint) (*dtos.PlaylistDTO, error) {
	_, err := s.playlistRepo.GetPlaylistByID(playlistID)
	if err != nil {
		return nil, err
	}

	// verify that the video exists
	video, err := s.videoRepo.GetVideoByID(videoID)
	if err != nil {
		return nil, err
	}
	if video == nil {
		return nil, fmt.Errorf("video not found")
	}

	err = s.playlistRepo.AddVideoToPlaylist(playlistID, videoID)
	if err != nil {
		return nil, err
	}

	return s.GetPlaylistByID(playlistID)
}

func (s *PlaylistService) RemoveVideoFromPlaylist(playlistID uint, videoID uint) (*dtos.PlaylistDTO, error) {
	if err := s.playlistRepo.RemoveVideoFromPlaylist(playlistID, videoID); err != nil {
		return nil, err
	}
	return s.GetPlaylistByID(playlistID)
}

// deletePlaylist deletes a playlist by its ID.
func (s *PlaylistService) DeletePlaylist(playlistID uint) error {
	return s.playlistRepo.DeletePlaylist(playlistID)
}
