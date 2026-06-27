package services

import (
	"backend/dtos"
	"backend/models"
	"backend/repositories"
	"fmt"
	"os"
)

const videoStreamBasePath = "/api/v1/videos"

type VideoService struct {
	repo *repositories.VideoRepo
}

func NewVideoService(repo *repositories.VideoRepo) *VideoService {
	return &VideoService{repo: repo}
}

func (v *VideoService) CreateVideo(videoDTO *dtos.VideoDTO) (*dtos.VideoResponseDTO, error) {
	var tags []models.Tag
	for _, tagName := range videoDTO.Tags {
		var tag models.Tag
		if err := v.repo.Db.FirstOrCreate(&tag, models.Tag{Name: tagName}).Error; err != nil {
			return nil, err
		}
		tags = append(tags, tag)
	}

	video := &models.Video{
		Title:       videoDTO.Title,
		Description: videoDTO.Description,
		URL:         videoDTO.URL,
		Size:        videoDTO.Size,
		AuthorID:    videoDTO.AuthorID,
		MimeType:    videoDTO.MimeType,
		UploadAt:    videoDTO.UploadAt,
		Tags:        tags,
	}
	if err := v.repo.CreateVideo(video); err != nil {
		return nil, err
	}

	created, err := v.repo.GetVideoByID(video.ID)
	if err != nil {
		return nil, err
	}

	return v.toVideoResponse(created), nil
}

func (v *VideoService) GetVideos() ([]dtos.VideoResponseDTO, error) {
	videos, err := v.repo.GetAllVideos()
	if err != nil {
		return nil, err
	}

	videoDTOs := make([]dtos.VideoResponseDTO, len(videos))
	for i, video := range videos {
		videoDTOs[i] = *v.toVideoResponse(&video)
	}
	return videoDTOs, nil
}

func (v *VideoService) GetVideoByID(id uint) (*models.Video, error) {
	video, err := v.repo.GetVideoByID(id)
	if err != nil || video == nil {
		return nil, fmt.Errorf("video with ID %d not found", id)
	}
	return video, nil
}

func (v *VideoService) ToVideoResponse(video *models.Video) *dtos.VideoResponseDTO {
	return v.toVideoResponse(video)
}

func (v *VideoService) DeleteVideo(id uint) error{
	return v.repo.DeleteVideo(id)
}

func (v *VideoService) toVideoResponse(video *models.Video) *dtos.VideoResponseDTO {
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

	return &dtos.VideoResponseDTO{
		ID:          video.ID,
		Title:       video.Title,
		Description: video.Description,
		Author:      authorName,
		AuthorID:    video.AuthorID,
		Size:        formatFileSize(video.Size),
		UploadedAt:  uploadedAt,
		URL:         buildStreamURL(video.ID),
		Tags:        tagNames,
	}
}

func (v *VideoService) GetVideosByAuthorID(authorID uint) ([]dtos.VideoResponseDTO, error) {
	videos, err := v.repo.GetVideosByAuthorID(authorID)
	if err != nil {
		return nil, err
	}

	videoDTOs := make([]dtos.VideoResponseDTO, len(videos))
	for i, video := range videos {
		videoDTOs[i] = *v.toVideoResponse(&video)
	}
	return videoDTOs, nil
}

func (v *VideoService) FilterVideos(name string, tags []string) ([]dtos.VideoResponseDTO, error) {
	videos, err := v.repo.Filter(name, tags)
	if err != nil {
		return nil, err
	}

	videoDTOs := make([]dtos.VideoResponseDTO, len(videos))
	for i, video := range videos {
		videoDTOs[i] = *v.toVideoResponse(&video)
	}
	return videoDTOs, nil
}

func buildStreamURL(id uint) string {
	return fmt.Sprintf("%s/%d", videoStreamBasePath, id)
}

func getFileSize(path string) int64 {
	info, err := os.Stat(path)
	if err != nil {
		return 0
	}
	return info.Size()
}

func formatFileSize(bytes int64) string {
	if bytes == 0 {
		return "—"
	}
	if bytes < 1024*1024 {
		return fmt.Sprintf("%.1f KB", float64(bytes)/1024)
	}
	return fmt.Sprintf("%.1f MB", float64(bytes)/(1024*1024))
}
