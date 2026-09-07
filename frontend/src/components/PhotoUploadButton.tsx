import { useRef, type ChangeEvent, type ReactNode } from 'react'

interface PhotoUploadButtonProps {
  onUpload: (imageBase64: string) => void
  children: ReactNode
  className?: string
  disabled?: boolean
}

// Shared by every screen that needs a photo (Scan and Verify) so uploading
// from the gallery is always available alongside the camera, not just on
// the first scan -- a camera isn't always usable (denied permission, no
// camera on the device, or the customer just prefers picking an existing
// photo) and re-verification needs the same fallback the first scan has.
export function PhotoUploadButton({ onUpload, children, className, disabled }: PhotoUploadButtonProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      const base64 = result.split(',')[1]
      if (base64) {
        onUpload(base64)
      }
    }
    reader.readAsDataURL(file)
    event.target.value = ''
  }

  return (
    <>
      <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={handleFileChange} />
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={disabled}
        className={`${className ?? ''} disabled:cursor-not-allowed disabled:opacity-50`}
      >
        {children}
      </button>
    </>
  )
}
