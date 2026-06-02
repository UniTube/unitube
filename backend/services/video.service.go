package services

import (
	"backend/dtos"
	"backend/models"
	"backend/repositories"
)

type VideoService struct {
	repo *repositories.VideoRepo
}

func NewVideoService(repo *repositories.VideoRepo) *VideoService {
	return &VideoService{repo: repo}
}

func (v  *VideoService) CreateVideo(videoDTO *dtos.VideoDTO) error {

	video := &models.Video{
		Title: videoDTO.Title,
		Description: videoDTO.Description,
		URL: videoDTO.URL,
		AuthorID: videoDTO.AuthorID,
	}	
	 err := v.repo.CreateVideo(video)
	if err != nil {
		return err
	}
	return nil
}	

func (v *VideoService) GetVideos() ([]dtos.VideoDTO, error) {
	videos, err := v.repo.GetAllVideos()
	if err != nil {
		return nil, err
	}
	videoDTOs := make([]dtos.VideoDTO, len(videos))
	for i, video := range videos {
		videoDTOs[i] = dtos.VideoDTO{
			ID:          video.ID,
			Title:       video.Title,
			Description: video.Description,
			URL:         video.URL,
			AuthorID:    video.AuthorID,
		}
	}
	return videoDTOs, nil
}

// func(v *VideoService) GetVideoByID(id uint) (*dtos.VideoDTO, error) {
// 	videos, err := v.repo.GetAllVideos()
// 	if err != nil {
// 		return nil, err
// 	}
// 	for _, video := range videos {
// 		if video.ID == id {
// 			return &dtos.VideoDTO{
// 				ID:          video.ID,
// 				Title:       video.Title,
// 				Description: video.Description,
// 				URL:         video.URL,
// 				AuthorID:    video.AuthorID,
// 			}, nil
// 		}
// 	}
// 	return nil, nil
// }

// func (v *VideoService) UpdateVideo(videoDTO *dtos.VideoDTO) error {
// 	video := &models.Video{
// 		ID: videoDTO.ID,	
// 		Title: videoDTO.Title,
// 		Description: videoDTO.Description,
// 		URL: videoDTO.URL,
// 		AuthorID: videoDTO.AuthorID,
// 	}
// 	return v.repo.UpdateVideo(video)
// }
