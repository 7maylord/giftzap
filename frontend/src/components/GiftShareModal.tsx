'use client'

import { useState } from 'react'
import SocialShare from './SocialShare'
import QRCodeGenerator from './QRCodeGenerator'

interface GiftShareModalProps {
  isOpen: boolean
  onClose: () => void
  giftId: string
  giftAmount: string
  giftType: string
  message: string
}

export default function GiftShareModal({ 
  isOpen, 
  onClose, 
  giftId, 
  giftAmount, 
  giftType, 
  message 
}: GiftShareModalProps) {
  const [activeTab, setActiveTab] = useState<'share' | 'qr'>('share')

  if (!isOpen) return null

  const redeemUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/redeem/${giftId}`
    : `/redeem/${giftId}`

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-foreground">Share Your Gift</h2>
            <button
              onClick={onClose}
              className="text-secondary-foreground hover:text-foreground transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="mb-6">
            <div className="flex bg-secondary rounded-lg p-1">
              <button
                onClick={() => setActiveTab('share')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'share'
                    ? 'bg-white text-foreground shadow-sm'
                    : 'text-secondary-foreground hover:text-foreground'
                }`}
              >
                Share Links
              </button>
              <button
                onClick={() => setActiveTab('qr')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'qr'
                    ? 'bg-white text-foreground shadow-sm'
                    : 'text-secondary-foreground hover:text-foreground'
                }`}
              >
                QR Code
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {activeTab === 'share' && (
              <SocialShare
                giftId={giftId}
                giftAmount={giftAmount}
                giftType={giftType}
                message={message}
              />
            )}

            {activeTab === 'qr' && (
              <div className="text-center">
                <QRCodeGenerator
                  value={redeemUrl}
                  size={200}
                  title="Scan to redeem gift"
                  className="w-full"
                />
                <div className="mt-4 p-3 bg-secondary rounded-lg">
                  <p className="text-sm text-secondary-foreground mb-2">Redemption URL:</p>
                  <p className="text-xs font-mono break-all text-foreground bg-white p-2 rounded border">
                    {redeemUrl}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-secondary">
            <button
              onClick={onClose}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-3 px-4 rounded-lg font-medium transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}