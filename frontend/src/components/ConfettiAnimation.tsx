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
  size = 500,
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

  const positions = [
    // Randomly scattered positions across the screen
    { x: '3%', y: '12%', scale: 0.7 },
    { x: '17%', y: '8%', scale: 0.9 },
    { x: '29%', y: '22%', scale: 0.6 },
    { x: '41%', y: '3%', scale: 0.8 },
    { x: '52%', y: '16%', scale: 0.7 },
    { x: '67%', y: '11%', scale: 0.9 },
    { x: '79%', y: '19%', scale: 0.6 },
    { x: '91%', y: '7%', scale: 0.8 },
    { x: '6%', y: '33%', scale: 0.7 },
    { x: '23%', y: '41%', scale: 0.8 },
    
    { x: '37%', y: '28%', scale: 0.9 },
    { x: '54%', y: '39%', scale: 0.6 },
    { x: '71%', y: '26%', scale: 0.7 },
    { x: '84%', y: '44%', scale: 0.8 },
    { x: '13%', y: '52%', scale: 0.6 },
    { x: '31%', y: '47%', scale: 0.9 },
    { x: '48%', y: '61%', scale: 0.7 },
    { x: '64%', y: '54%', scale: 0.8 },
    { x: '77%', y: '63%', scale: 0.6 },
    { x: '89%', y: '49%', scale: 0.9 },
    
    { x: '9%', y: '73%', scale: 0.8 },
    { x: '26%', y: '68%', scale: 0.7 },
    { x: '42%', y: '79%', scale: 0.6 },
    { x: '59%', y: '74%', scale: 0.9 },
    { x: '73%', y: '81%', scale: 0.7 },
    { x: '86%', y: '77%', scale: 0.8 },
    { x: '19%', y: '87%', scale: 0.6 },
    { x: '35%', y: '92%', scale: 0.7 },
    { x: '61%', y: '89%', scale: 0.8 },
    { x: '81%', y: '94%', scale: 0.6 }
  ]

  return (
    <div 
      className={`fixed inset-0 pointer-events-none z-50 overflow-hidden ${className}`}
      style={{ zIndex: 9999 }}
    >
      {positions.map((pos, index) => (
        <div
          key={index}
          className="absolute"
          style={{
            left: pos.x,
            top: pos.y,
            transform: 'translate(-50%, -50%)'
          }}
        >
          <Lottie
            animationData={animationData}
            loop={false}
            autoplay={true}
            style={{ 
              width: size * pos.scale * 0.3, 
              height: size * pos.scale * 0.3
            }}
            onComplete={index === 0 ? () => {
              setShouldPlay(false)
              onComplete?.()
            } : undefined}
            rendererSettings={{
              preserveAspectRatio: 'xMidYMid meet',
              progressiveLoad: true
            }}
          />
        </div>
      ))}
    </div>
  )
}