package videos

import "testing"

func TestVideosSuite(t *testing.T) {
	t.Run("CreateVideo", TestCreateVideo)
	t.Run("GetAllVideos", TestGetAllVideos)
	t.Run("FilterVideos", TestFilterVideos)
	t.Run("GetVideoMetadata", TestGetVideoMetadata)
	t.Run("GetVideoByID", TestGetVideoByID)
	t.Run("DeleteVideo", TestDeleteVideo)
}
