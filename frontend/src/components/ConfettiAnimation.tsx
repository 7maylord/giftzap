'use client'

import { useEffect, useState } from 'react'
import Lottie from 'lottie-react'

interface ConfettiAnimationProps {
  trigger?: boolean
  onComplete?: () => void
  size?: number
  className?: string
}

export default function ConfettiAnimation({ 
  trigger = false, 
  onComplete, 
  size = 300,
  className = ""
}: ConfettiAnimationProps) {
  const [animationData, setAnimationData] = useState(null)
  const [shouldPlay, setShouldPlay] = useState(false)

  useEffect(() => {
    async function loadAnimation() {
      try {
        const response = await fetch('/lottie/confetti.json')
        const data = await response.json()
        setAnimationData(data)
      } catch (error) {
        console.error('Failed to load confetti animation:', error)
      }
    }
    
    loadAnimation()
  }, [])

  useEffect(() => {
    if (trigger) {
      setShouldPlay(true)
    }
  }, [trigger])

  if (!animationData || !shouldPlay) {
    return null
  }

  return (
    <div 
      className={`fixed inset-0 pointer-events-none z-50 flex items-center justify-center animate-scaleIn ${className}`}
      style={{ zIndex: 9999 }}
    >
      <div className="relative">
        <Lottie
          animationData={animationData}
          loop={false}
          autoplay={true}
          style={{ width: size, height: size }}
          onComplete={() => {
            setShouldPlay(false)
            onComplete?.()
          }}
          rendererSettings={{
            preserveAspectRatio: 'xMidYMid slice',
            progressiveLoad: true
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-gradient rounded-full"></div>
      </div>
    </div>
  )
}