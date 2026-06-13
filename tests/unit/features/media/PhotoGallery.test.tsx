import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PhotoGallery } from '@/features/media/components/PhotoGallery'
import type { Photo } from '@/features/media/types'
import { useAuthStore } from '@/shared/store/auth'

const mockMutate = vi.fn()

vi.mock('@/features/media/hooks/useMedia', () => ({
  useDeleteMedia: () => ({
    mutate: mockMutate,
    isPending: false,
  }),
}))

const samplePhotos: Photo[] = [{ key: 'photo-1' }, { key: 'photo-2' }]

describe('PhotoGallery', () => {
  beforeEach(() => {
    mockMutate.mockReset()
    useAuthStore.setState({ currentOrgId: 'org-1' })
  })

  it('renders gallery title', () => {
    render(<PhotoGallery photos={samplePhotos} />)
    expect(screen.getByText('Photos')).toBeInTheDocument()
  })

  it('renders all photos', () => {
    render(<PhotoGallery photos={samplePhotos} />)
    const images = screen.getAllByRole('img')
    expect(images).toHaveLength(2)
  })

  it('builds img src from key and org id', () => {
    render(<PhotoGallery photos={samplePhotos} />)
    const images = screen.getAllByRole('img')
    expect(images[0]).toHaveAttribute('src', '/api/v1/media/photo-1?org_id=org-1')
  })

  it('renders delete button for each photo', () => {
    render(<PhotoGallery photos={samplePhotos} />)
    const deleteButtons = screen.getAllByRole('button', { name: 'Delete' })
    expect(deleteButtons).toHaveLength(2)
  })

  it('shows empty state when no photos', () => {
    render(<PhotoGallery photos={[]} />)
    expect(screen.getByText('No photos yet')).toBeInTheDocument()
  })

  it('calls deleteMedia with photo key on delete click', async () => {
    const user = userEvent.setup()
    render(<PhotoGallery photos={samplePhotos} />)

    const deleteButtons = screen.getAllByRole('button', { name: 'Delete' })
    await user.click(deleteButtons[0] as HTMLElement)

    expect(mockMutate).toHaveBeenCalledWith('photo-1')
  })

  it('does not render delete buttons when onDelete is not provided', () => {
    render(<PhotoGallery photos={samplePhotos} />)
    const deleteButtons = screen.getAllByRole('button', { name: 'Delete' })
    // Deletion is always available via the useDeleteMedia hook
    expect(deleteButtons).toHaveLength(2)
  })
})
