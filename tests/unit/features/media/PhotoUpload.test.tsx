import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PhotoUpload } from '@/features/media/components/PhotoUpload'

const mockMutate = vi.fn()
let mockIsPending = false
let mockIsError = false
let mockError: Error | null = null

vi.mock('@/features/media/hooks/useMedia', () => ({
  useUploadPhoto: () => ({
    mutate: mockMutate,
    isPending: mockIsPending,
    isError: mockIsError,
    error: mockError,
  }),
}))

describe('PhotoUpload', () => {
  beforeEach(() => {
    mockMutate.mockReset()
    mockIsPending = false
    mockIsError = false
    mockError = null
  })

  it('renders upload area title', () => {
    render(<PhotoUpload entityType="client" entityId="c1" />)
    expect(screen.getByText('Upload photos')).toBeInTheDocument()
  })

  it('renders drop zone text', () => {
    render(<PhotoUpload entityType="client" entityId="c1" />)
    expect(screen.getByText('Drag and drop photos here')).toBeInTheDocument()
  })

  it('renders file input', () => {
    render(<PhotoUpload entityType="client" entityId="c1" />)
    expect(screen.getByLabelText('Select file')).toBeInTheDocument()
  })

  it('calls uploadPhoto on file selection', async () => {
    const user = userEvent.setup()
    render(<PhotoUpload entityType="client" entityId="c1" />)

    const fileInput = screen.getByLabelText('Select file')
    const file = new File(['test'], 'photo.jpg', { type: 'image/jpeg' })
    await user.upload(fileInput, file)

    expect(mockMutate).toHaveBeenCalledWith(
      { entityType: 'client', entityId: 'c1', file },
      expect.objectContaining({}),
    )
  })

  it('disables input while uploading', () => {
    mockIsPending = true
    render(<PhotoUpload entityType="client" entityId="c1" />)

    expect(screen.getByLabelText('Select file')).toBeDisabled()
  })

  it('shows uploading text while pending', () => {
    mockIsPending = true
    render(<PhotoUpload entityType="client" entityId="c1" />)

    expect(screen.getByText('Uploading...')).toBeInTheDocument()
  })

  it('shows error message on upload failure', () => {
    mockIsError = true
    mockError = new Error('Upload failed')
    render(<PhotoUpload entityType="client" entityId="c1" />)

    expect(screen.getByText('Upload failed')).toBeInTheDocument()
  })

  it('calls onUploadComplete callback after successful upload', async () => {
    const onComplete = vi.fn()
    mockMutate.mockImplementation((_args: unknown, options?: { onSuccess?: () => void }) => {
      options?.onSuccess?.()
    })

    const user = userEvent.setup()
    render(<PhotoUpload entityType="client" entityId="c1" onUploadComplete={onComplete} />)

    const fileInput = screen.getByLabelText('Select file')
    const file = new File(['test'], 'photo.jpg', { type: 'image/jpeg' })
    await user.upload(fileInput, file)

    expect(onComplete).toHaveBeenCalled()
  })
})
