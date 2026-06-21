import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import UploadVideoModal from '../UploadVideoModal'
import videoService from '../../services/videoService'

jest.mock('../../services/videoService', () => ({
  uploadVideo: jest.fn(),
}))

describe('UploadVideoModal', () => {
  const mockOnUpload = jest.fn()
  const mockOnClose = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ['Education', 'Tech'],
    })

    // Mock FileReader
    class MockFileReader {
      onload: any = null
      readAsDataURL() {
        setTimeout(() => {
          if (this.onload) {
            this.onload({ target: { result: 'data:video/mp4;base64,mockpreview' } })
          }
        }, 0)
      }
    }
    global.FileReader = MockFileReader as any
  })

  test('fetches saved tags on mount', async () => {
    render(<UploadVideoModal onUpload={mockOnUpload} onClose={mockOnClose} />)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('http://127.0.0.1:8088/api/v1/tags')
    })
  })

  test('validates file selection and title updates', async () => {
    render(<UploadVideoModal onUpload={mockOnUpload} onClose={mockOnClose} />)

    const uploadBtn = screen.getByRole('button', { name: /upload video/i })
    expect(uploadBtn).toBeDisabled()

    // Mock file input selection
    const file = new File(['test-video'], 'intro.mp4', { type: 'video/mp4' })
    const fileInput = screen.getByText(/click to select/i).closest('div')!.querySelector('input[type="file"]')!
    
    fireEvent.change(fileInput, { target: { files: [file] } })

    await waitFor(() => {
      expect(screen.getByLabelText(/title/i)).toHaveValue('intro')
      expect(uploadBtn).not.toBeDisabled()
    })
  })

  test('handles tag addition and chip deletion', async () => {
    render(<UploadVideoModal onUpload={mockOnUpload} onClose={mockOnClose} />)

    const tagInput = screen.getByPlaceholderText(/search or add tags/i)
    const addTagBtn = screen.getByRole('button', { name: /^add$/i })

    fireEvent.change(tagInput, { target: { value: 'Rust' } })
    fireEvent.click(addTagBtn)

    expect(screen.getByText('Rust')).toBeInTheDocument()

    // Click delete tag chip
    const deleteTagBtn = screen.getByRole('button', { name: '×' })
    fireEvent.click(deleteTagBtn)

    expect(screen.queryByText('Rust')).not.toBeInTheDocument()
  })

  test('submits form successfully calling videoService', async () => {
    const mockUploadResponse = {
      id: 101,
      authorId: 1,
      title: 'my-video',
      size: '10.5 MB',
      uploadedAt: '2026-06-21',
      description: 'awesome tutorial',
      author: 'User',
      url: '/videos/101',
    };
    (videoService.uploadVideo as jest.Mock).mockResolvedValueOnce(mockUploadResponse)

    render(<UploadVideoModal onUpload={mockOnUpload} onClose={mockOnClose} />)

    // Select file
    const file = new File(['test-video'], 'my-video.mp4', { type: 'video/mp4' })
    const fileInput = screen.getByText(/click to select/i).closest('div')!.querySelector('input[type="file"]')!
    fireEvent.change(fileInput, { target: { files: [file] } })

    await waitFor(() => {
      expect(screen.getByLabelText(/title/i)).toHaveValue('my-video')
    })

    const descriptionInput = screen.getByPlaceholderText(/add a description/i)
    fireEvent.change(descriptionInput, { target: { value: 'awesome tutorial' } })

    const uploadBtn = screen.getByRole('button', { name: /upload video/i })
    fireEvent.click(uploadBtn)

    expect(uploadBtn).toHaveTextContent(/uploading/i)

    await waitFor(() => {
      expect(videoService.uploadVideo).toHaveBeenCalledWith({
        title: 'my-video',
        description: 'awesome tutorial',
        file,
        tags: [],
      })
      expect(mockOnUpload).toHaveBeenCalledWith({
        id: 101,
        authorId: 1,
        title: 'my-video',
        size: '10.5 MB',
        uploadedAt: '2026-06-21',
        description: 'awesome tutorial',
        author: 'User',
        url: '/videos/101',
      })
    })
  })

  test('displays error when file upload fails', async () => {
    (videoService.uploadVideo as jest.Mock).mockRejectedValueOnce(new Error('Upload limit exceeded'))

    render(<UploadVideoModal onUpload={mockOnUpload} onClose={mockOnClose} />)

    const file = new File(['test-video'], 'my-video.mp4', { type: 'video/mp4' })
    const fileInput = screen.getByText(/click to select/i).closest('div')!.querySelector('input[type="file"]')!
    fireEvent.change(fileInput, { target: { files: [file] } })

    await waitFor(() => {
      expect(screen.getByLabelText(/title/i)).toHaveValue('my-video')
    })

    const uploadBtn = screen.getByRole('button', { name: /upload video/i })
    fireEvent.click(uploadBtn)

    await waitFor(() => {
      expect(screen.getByText('Upload limit exceeded')).toBeInTheDocument()
      expect(uploadBtn).not.toBeDisabled()
    })
  })
})
