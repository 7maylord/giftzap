'use client'

import { ReactNode } from 'react'

interface AnimatedCardProps {
  children: ReactNode
  className?: string
  delay?: number
  hover?: boolean
}

export default function AnimatedCard({ 
  children, 
  className = "", 
  delay = 0,
  hover = true 
}: AnimatedCardProps) {
  return (
    <div 
      className={`animate-fadeInUp ${hover ? 'card-hover' : ''} ${className}`}
      style={{ 
        animationDelay: `${delay}ms`,
        animationFillMode: 'backwards'
      }}
    >
      {children}
    </div>
  )
}