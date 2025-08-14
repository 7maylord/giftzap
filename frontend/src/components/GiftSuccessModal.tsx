'use client'

import { useState, useEffect } from 'react'
import { formatEther } from 'viem'

interface GiftSuccessModalProps {
  isOpen: boolean
  onClose: () => void
  giftDetails?: {
    recipient: string
    amount: bigint
    giftType: string
    message: string
    txHash?: string
    giftId?: string
  }
}

export default function GiftSuccessModal({ isOpen, onClose, giftDetails }: GiftSuccessModalProps) {
  const [isWaiting, setIsWaiting] = useState(true)
  const [showSharing, setShowSharing] = useState(false)

  useEffect(() => {
    if (isOpen && giftDetails?.txHash) {
      setIsWaiting(true)
      setShowSharing(false)
      
      // Simulate waiting period for transaction confirmation
      const timer = setTimeout(() => {
        setIsWaiting(false)
        setShowSharing(true)
      }, 3000) // 3 second wait
      
      return () => clearTimeout(timer)
    }
  }, [isOpen, giftDetails?.txHash])

  const claimLink = giftDetails?.giftId 
    ? `${window.location.origin}/redeem/${giftDetails.giftId}`
    : ''

  const shareMessage = `🎁 I've sent you a gift on GiftZap! 
Amount: ${giftDetails ? formatEther(giftDetails.amount) : '0'} MNT
Type: ${giftDetails?.giftType || 'Gift'}
Message: ${giftDetails?.message || ''}

Claim your gift here: ${claimLink}`

  const shareToTwitter = () => {
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareMessage)}`
    window.open(twitterUrl, '_blank')
  }

  const shareToWhatsApp = () => {
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareMessage)}`
    window.open(whatsappUrl, '_blank')
  }

  const copyClaimLink = async () => {
    try {
      await navigator.clipboard.writeText(claimLink)
      // Could add a toast notification here
    } catch (err) {
      console.error('Failed to copy link:', err)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full mx-4 overflow-hidden animate-scaleIn">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-accent p-6 text-white text-center">
          <div className="text-4xl mb-2">🎁</div>
          <h2 className="text-2xl font-bold">Gift Sent!</h2>
        </div>

        <div className="p-6">
          {isWaiting ? (
            /* Waiting State */
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mb-4"></div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Processing Transaction...</h3>
              <p className="text-gray-600 text-sm">
                Please wait while your gift is being confirmed on the blockchain
              </p>
              {giftDetails?.txHash && (
                <p className="text-xs text-gray-500 mt-3 font-mono">
                  TX: {giftDetails.txHash.slice(0, 10)}...{giftDetails.txHash.slice(-6)}
                </p>
              )}
            </div>
          ) : showSharing ? (
            /* Sharing State */
            <div className="space-y-6">
              <div className="text-center">
                <div className="text-3xl mb-2">✨</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Gift Confirmed!</h3>
                <p className="text-gray-600 text-sm">
                  Share the claim link with your recipient
                </p>
              </div>

              {/* Gift Details */}
              {giftDetails && (
                <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Amount:</span>
                    <span className="font-medium">{formatEther(giftDetails.amount)} MNT</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Type:</span>
                    <span className="font-medium">{giftDetails.giftType}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Recipient:</span>
                    <span className="font-mono text-xs">
                      {giftDetails.recipient.slice(0, 6)}...{giftDetails.recipient.slice(-4)}
                    </span>
                  </div>
                </div>
              )}

              {/* Claim Link */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">Claim Link:</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={claimLink}
                    readOnly
                    className="flex-1 px-3 py-2 text-xs border border-gray-300 rounded-lg font-mono text-gray-600"
                  />
                  <button
                    onClick={copyClaimLink}
                    className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors"
                  >
                    Copy
                  </button>
                </div>
              </div>

              {/* Social Sharing Buttons */}
              <div className="space-y-3">
                <p className="text-sm font-medium text-gray-700 text-center">Share with recipient:</p>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={shareToTwitter}
                    className="flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white py-3 px-4 rounded-xl font-medium transition-colors"
                  >
                    <span>🐦</span>
                    Twitter
                  </button>
                  <button
                    onClick={shareToWhatsApp}
                    className="flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white py-3 px-4 rounded-xl font-medium transition-colors"
                  >
                    <span>💬</span>
                    WhatsApp
                  </button>
                </div>
              </div>
            </div>
          ) : null}

          {/* Close Button */}
          {showSharing && (
            <div className="mt-6 pt-4 border-t border-gray-200">
              <button
                onClick={onClose}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-xl font-medium transition-colors"
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}