import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import EditVideoModal from '../EditVideoModal'
import videoService from '../../services/videoService'

jest.mock('../../services/videoService', () => ({
  updateVideo: jest.fn(),
}))

describe('EditVideoModal', () => {
  const mockVideo = {
    id: 42,
    title: 'Original Title',
    description: 'Original Description',
    url: '/video/42',
    size: '10MB',
    uploadedAt: '2026-06-20',
    author: 'Alice',
    authorId: 1,
    tags: [],
  }

  const mockOnSave = jest.fn()
  const mockOnClose = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('renders with original video data', () => {
    render(<EditVideoModal video={mockVideo} onSave={mockOnSave} onClose={mockOnClose} />)

    expect(screen.getByLabelText(/title/i)).toHaveValue('Original Title')
    expect(screen.getByPlaceholderText(/add a description…/i)).toHaveValue('Original Description')
    expect(screen.getByRole('button', { name: /save changes/i })).toBeDisabled()
  })

  test('enables save button when title or description is changed', () => {
    render(<EditVideoModal video={mockVideo} onSave={mockOnSave} onClose={mockOnClose} />)

    const titleInput = screen.getByLabelText(/title/i)
    fireEvent.change(titleInput, { target: { value: 'New Title' } })

    expect(screen.getByRole('button', { name: /save changes/i })).not.toBeDisabled()
  })

  test('calls videoService.updateVideo and triggers onSave on successful submit', async () => {
    const mockUpdatedResponse = { title: 'New Title', description: 'Original Description' };
    (videoService.updateVideo as jest.Mock).mockResolvedValueOnce(mockUpdatedResponse)

    render(<EditVideoModal video={mockVideo} onSave={mockOnSave} onClose={mockOnClose} />)

    const titleInput = screen.getByLabelText(/title/i)
    fireEvent.change(titleInput, { target: { value: 'New Title' } })

    const saveBtn = screen.getByRole('button', { name: /save changes/i })
    fireEvent.click(saveBtn)

    expect(saveBtn).toHaveTextContent(/saving/i)

    await waitFor(() => {
      expect(videoService.updateVideo).toHaveBeenCalledWith(42, {
        title: 'New Title',
        description: 'Original Description',
      })
      expect(mockOnSave).toHaveBeenCalledWith({
        ...mockVideo,
        title: 'New Title',
      })
    })
  })

  test('displays error message when update fails', async () => {
    (videoService.updateVideo as jest.Mock).mockRejectedValueOnce(new Error('Network Error'))

    render(<EditVideoModal video={mockVideo} onSave={mockOnSave} onClose={mockOnClose} />)

    const titleInput = screen.getByLabelText(/title/i)
    fireEvent.change(titleInput, { target: { value: 'New Title' } })

    const saveBtn = screen.getByRole('button', { name: /save changes/i })
    fireEvent.click(saveBtn)

    await waitFor(() => {
      expect(screen.getByText('Network Error')).toBeInTheDocument()
      expect(saveBtn).not.toBeDisabled()
    })
  })

  test('triggers onClose when cancel button is clicked', () => {
    render(<EditVideoModal video={mockVideo} onSave={mockOnSave} onClose={mockOnClose} />)

    const cancelBtn = screen.getByRole('button', { name: /cancel/i })
    fireEvent.click(cancelBtn)

    expect(mockOnClose).toHaveBeenCalled()
  })
})
