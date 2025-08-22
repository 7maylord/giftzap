'use client'

import { useState, useEffect } from 'react'
import { formatEther } from 'viem'
import ConfettiAnimation from './ConfettiAnimation'

interface GiftDetails {
  recipient: string
  amount: bigint
  giftType: string
  message: string
  txHash?: string
  giftId?: string
}

interface GiftSuccessModalProps {
  isOpen: boolean
  onClose: () => void
  giftDetails?: GiftDetails
}

export default function GiftSuccessModal({ isOpen, onClose, giftDetails }: GiftSuccessModalProps) {
  const [isWaiting, setIsWaiting] = useState(true)
  const [showConfetti, setShowConfetti] = useState(false)

  useEffect(() => {
    if (isOpen) {
      if (!giftDetails) {
        // If there are no gift details, close the modal (transaction cancelled/failed)
        onClose();
        return;
      }

      if (giftDetails.txHash) {
        setIsWaiting(true);
        
        // Trigger confetti immediately
        setShowConfetti(true);
        
        // Wait for 2 seconds before showing sharing options
        const timer = setTimeout(() => {
          setIsWaiting(false);
        }, 2000);
        
        return () => clearTimeout(timer);
      }
    }

    // Reset state when modal closes
    if (!isOpen) {
      setIsWaiting(true);
      setShowConfetti(false);
    }
  }, [isOpen, giftDetails, onClose])

  // Don't render if modal is not open or no gift details
  if (!isOpen || !giftDetails) return null

  const claimLink = giftDetails.giftId 
    ? `${window.location.origin}/redeem/${giftDetails.giftId}`
    : ''

  const shareMessage = `🎁 I've sent you a gift on GiftZap! 
Amount: ${formatEther(giftDetails.amount)} MNT
Type: ${giftDetails.giftType}
Message: ${giftDetails.message || ''}

Claim your gift here: ${claimLink}`

  const shareToTwitter = () => {
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareMessage)}`, '_blank')
  }

  const shareToWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(shareMessage)}`, '_blank')
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
        <div className="p-6">
          {isWaiting ? (
            <div className="text-center py-8">
              <div className="mb-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              </div>
              <h3 className="text-lg text-black font-semibold mb-2">Processing Gift</h3>
              <p className="text-black">Please wait while we confirm your transaction...</p>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🎁</span>
                  <h3 className="text-xl font-bold text-black">Gift Sent Successfully!</h3>
                </div>
                <button onClick={onClose} className="text-gray-400 hover:text-black">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4 mb-6">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-black">Amount</p>
                      <p className="font-semibold text-black">{formatEther(giftDetails.amount)} MNT</p>
                    </div>
                    <div>
                      <p className="text-sm text-black">Type</p>
                      <p className="font-semibold text-black">{giftDetails.giftType}</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-black mb-1">Message</p>
                  <p className="font-medium text-black">{giftDetails.message || 'No message'}</p>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-black mb-1">Claim Link</p>
                  <p className="font-mono text-sm break-all text-black">{claimLink}</p>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold text-black">Share Gift Link</h4>
                <div className="flex gap-3">
                  <button
                    onClick={shareToTwitter}
                    className="flex-1 py-2 px-4 bg-[#1DA1F2] text-white rounded-lg hover:bg-[#1a8cd8] transition-colors flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                    </svg>
                    Share on Twitter
                  </button>
                  <button
                    onClick={shareToWhatsApp}
                    className="flex-1 py-2 px-4 bg-[#25D366] text-white rounded-lg hover:bg-[#20bd5a] transition-colors flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                    </svg>
                    Share on WhatsApp
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      <ConfettiAnimation 
        trigger={showConfetti} 
        onComplete={() => setShowConfetti(false)}
        size={400}
      />
    </div>
  )
}
