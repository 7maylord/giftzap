'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import qrcode from 'qrcode-generator'

interface QRCodeGeneratorProps {
  value: string
  size?: number
  className?: string
  title?: string
}

export default function QRCodeGenerator({ 
  value, 
  size = 200, 
  className = "",
  title = "QR Code"
}: QRCodeGeneratorProps) {
  const [qrCodeDataURL, setQRCodeDataURL] = useState<string>('')
  const [error, setError] = useState<string>('')

  useEffect(() => {
    if (!value) {
      setError('No value provided for QR code')
      return
    }

    try {
      // Create QR code instance
      const qr = qrcode(0, 'M')
      qr.addData(value)
      qr.make()

      // Generate SVG
      const cellSize = 4
      const margin = cellSize * 2
      const modules = qr.getModuleCount()
      const imageSize = modules * cellSize + margin * 2

      let svg = `<svg width="${imageSize}" height="${imageSize}" viewBox="0 0 ${imageSize} ${imageSize}" xmlns="http://www.w3.org/2000/svg">`
      svg += `<rect width="100%" height="100%" fill="white"/>`

      for (let row = 0; row < modules; row++) {
        for (let col = 0; col < modules; col++) {
          if (qr.isDark(row, col)) {
            const x = col * cellSize + margin
            const y = row * cellSize + margin
            svg += `<rect x="${x}" y="${y}" width="${cellSize}" height="${cellSize}" fill="black"/>`
          }
        }
      }

      svg += '</svg>'

      // Convert SVG to data URL
      const dataURL = `data:image/svg+xml;base64,${btoa(svg)}`
      setQRCodeDataURL(dataURL)
      setError('')
    } catch (err) {
      console.error('QR Code generation failed:', err)
      setError('Failed to generate QR code')
    }
  }, [value])

  const handleDownload = () => {
    if (!qrCodeDataURL) return

    const link = document.createElement('a')
    link.download = `qr-code-${Date.now()}.svg`
    link.href = qrCodeDataURL
    link.click()
  }

  const handleCopyImage = async () => {
    try {
      // Create a canvas and draw the QR code
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('Canvas context not available')

      const img = new Image()
      img.onload = async () => {
        canvas.width = img.width
        canvas.height = img.height
        ctx.drawImage(img, 0, 0)
        
        canvas.toBlob(async (blob) => {
          if (blob && navigator.clipboard && navigator.clipboard.write) {
            try {
              await navigator.clipboard.write([
                new ClipboardItem({ 'image/png': blob })
              ])
            } catch {
              console.log('Copy to clipboard not supported')
            }
          }
        })
      }
      img.src = qrCodeDataURL
    } catch {
      console.log('Copy image failed')
    }
  }

  if (error) {
    return (
      <div className={`text-center p-4 ${className}`}>
        <div className="text-red-500">
          <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    )
  }

  if (!qrCodeDataURL) {
    return (
      <div className={`text-center p-4 ${className}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="text-sm text-secondary-foreground mt-2">Generating QR code...</p>
      </div>
    )
  }

  return (
    <div className={`text-center space-y-4 ${className}`}>
      <div className="bg-white p-4 rounded-xl border border-secondary inline-block shadow-sm">
        <Image
          src={qrCodeDataURL}
          alt={title}
          width={size}
          height={size}
          className="mx-auto"
          unoptimized
        />
      </div>
      
      <div className="space-y-2">
        <p className="text-sm text-secondary-foreground">{title}</p>
        <div className="flex gap-2 justify-center">
          <button
            onClick={handleDownload}
            className="text-primary hover:text-primary/80 text-sm font-medium transition-colors"
          >
            Download
          </button>
          <button
            onClick={handleCopyImage}
            className="text-primary hover:text-primary/80 text-sm font-medium transition-colors"
          >
            Copy
          </button>
        </div>
      </div>
    </div>
  )
}