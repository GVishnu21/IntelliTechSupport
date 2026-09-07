import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { PhotoUploadButton } from './PhotoUploadButton'

function makeFile(content: string, type = 'image/png') {
  return new File([content], 'router.png', { type })
}

describe('PhotoUploadButton', () => {
  it('renders its label', () => {
    render(<PhotoUploadButton onUpload={vi.fn()}>Upload Photo</PhotoUploadButton>)
    expect(screen.getByRole('button', { name: 'Upload Photo' })).toBeInTheDocument()
  })

  it('calls onUpload with the base64 content of the selected file', async () => {
    const onUpload = vi.fn()
    const { container } = render(<PhotoUploadButton onUpload={onUpload}>Upload Photo</PhotoUploadButton>)

    const input = container.querySelector('input[type="file"]') as HTMLInputElement
    fireEvent.change(input, { target: { files: [makeFile('fake-image-bytes')] } })

    await waitFor(() => expect(onUpload).toHaveBeenCalledOnce())
    expect(onUpload).toHaveBeenCalledWith(expect.any(String))
  })

  it('does not call onUpload when no file is selected', () => {
    const onUpload = vi.fn()
    const { container } = render(<PhotoUploadButton onUpload={onUpload}>Upload Photo</PhotoUploadButton>)

    const input = container.querySelector('input[type="file"]') as HTMLInputElement
    fireEvent.change(input, { target: { files: [] } })

    expect(onUpload).not.toHaveBeenCalled()
  })

  it('disables the button when disabled is set', () => {
    render(
      <PhotoUploadButton onUpload={vi.fn()} disabled>
        Upload Photo
      </PhotoUploadButton>
    )
    expect(screen.getByRole('button', { name: 'Upload Photo' })).toBeDisabled()
  })
})
