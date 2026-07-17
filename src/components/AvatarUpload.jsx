import { useRef } from 'react'
import { imageToBase64 } from '../lib/helpers'
import { getInitials } from '../lib/helpers'
import './AvatarUpload.css'

export default function AvatarUpload({ value, onChange, name = '' }) {
  const inputRef = useRef()

  const handleFile = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (!file.type.startsWith('image/')) return

    // Compress if > 500KB
    if (file.size > 500 * 1024) {
      const img = new Image()
      const url = URL.createObjectURL(file)
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const maxDim = 256
        const scale = Math.min(maxDim / img.width, maxDim / img.height, 1)
        canvas.width = img.width * scale
        canvas.height = img.height * scale
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        onChange(canvas.toDataURL('image/jpeg', 0.85))
        URL.revokeObjectURL(url)
      }
      img.src = url
    } else {
      const b64 = await imageToBase64(file)
      onChange(b64)
    }
  }

  return (
    <div className="avatar-upload" id="avatar-upload">
      <div
        className="avatar-upload-preview"
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={e => e.key === 'Enter' && inputRef.current?.click()}
      >
        {value
          ? <img src={value} alt="Avatar" className="avatar-upload-img" />
          : <div className="avatar-upload-placeholder">
              <span className="avatar-upload-initials">{getInitials(name) || '+'}</span>
              <span className="avatar-upload-hint">Upload</span>
            </div>
        }
        <div className="avatar-upload-overlay">
          <span>📷</span>
        </div>
      </div>

      {value && (
        <button
          type="button"
          className="btn btn-ghost btn-sm avatar-upload-remove"
          onClick={() => onChange(null)}
        >
          Remove
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFile}
        style={{ display: 'none' }}
        id="avatar-file-input"
      />
    </div>
  )
}
