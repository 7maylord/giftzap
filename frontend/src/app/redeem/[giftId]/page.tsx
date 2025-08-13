'use client'

import { use } from 'react'
import { useGetGift, useGiftManagerWrite } from '@/hooks/useGiftManager'
import { fetchGiftMetadata } from '@/utils/ipfs'
import { usePrivy } from '@privy-io/react-auth'
import { CONTRACTS } from '@/lib/config'
import GiftManagerABI from '@/abi/GiftManager.json'
import { useState, useEffect } from 'react'
import { Gift } from '@/lib/types'
import { formatEther } from 'viem'
import { toast } from 'react-toastify'
import ConfettiAnimation from '@/components/ConfettiAnimation'
import SocialShare from '@/components/SocialShare'
import QRCodeGenerator from '@/components/QRCodeGenerator'

interface GiftMetadata {
  giftType: string
  message: string
  timestamp: number
  sender?: string
}

export default function RedeemPage({ params }: { params: Promise<{ giftId: string }> }) {
  const resolvedParams = use(params)
  const giftId = parseInt(resolvedParams.giftId)
  const [giftMetadata, setGiftMetadata] = useState<GiftMetadata | null>(null)
  const [loading, setLoading] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  
  const { user, authenticated } = usePrivy()
  const { data: gift, isLoading, error } = useGetGift(giftId) as { data: Gift | undefined, isLoading: boolean, error: unknown }
  const { writeContract } = useGiftManagerWrite()

  useEffect(() => {
    async function loadGiftMetadata() {
      if (gift && gift.messageHash) {
        try {
          const metadata = await fetchGiftMetadata(gift.messageHash)
          setGiftMetadata(metadata)
        } catch (error) {
          console.error('Failed to load gift metadata:', error)
          toast.error('Failed to load gift details')
        }
      }
    }
    
    loadGiftMetadata()
  }, [gift])

  const handleRedeem = async () => {
    if (!authenticated || !user?.wallet?.address) {
      toast.error('Please connect your wallet to redeem')
      return
    }

    if (gift?.recipient !== user.wallet.address) {
      toast.error('This gift is not for you')
      return
    }

    if (gift?.redeemed) {
      toast.error('This gift has already been redeemed')
      return
    }

    setLoading(true)
    try {
      await writeContract({
        address: CONTRACTS.GIFT_MANAGER,
        abi: GiftManagerABI,
        functionName: 'redeemGift',
        args: [giftId],
      })
      
      setShowConfetti(true)
      toast.success('Gift redeemed successfully!')
    } catch (error) {
      console.error('Redemption failed:', error)
      toast.error('Failed to redeem gift')
    } finally {
      setLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-foreground">Loading gift...</p>
        </div>
      </div>
    )
  }

  if (error || !gift) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-foreground mb-4">Gift Not Found</h1>
          <p className="text-secondary-foreground">This gift doesn&apos;t exist or has been removed.</p>
        </div>
      </div>
    )
  }

  const isRecipient = authenticated && user?.wallet?.address === gift.recipient

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-secondary">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-foreground mb-2">🎁 You&apos;ve Received a Gift!</h1>
            <p className="text-secondary-foreground">Someone special has sent you a gift</p>
          </div>

          <div className="space-y-6">
            <div className="bg-secondary rounded-xl p-6">
              <h2 className="text-xl font-semibold text-foreground mb-4">Gift Details</h2>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-secondary-foreground">Amount:</span>
                  <span className="font-semibold text-foreground">{formatEther(gift.amount)} MNT</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-secondary-foreground">From:</span>
                  <span className="font-mono text-sm text-foreground">
                    {gift.sender.slice(0, 6)}...{gift.sender.slice(-4)}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-secondary-foreground">To:</span>
                  <span className="font-mono text-sm text-foreground">
                    {gift.recipient.slice(0, 6)}...{gift.recipient.slice(-4)}
                  </span>
                </div>
                
                {gift.isCharity && (
                  <div className="flex justify-between">
                    <span className="text-secondary-foreground">Type:</span>
                    <span className="font-semibold text-green-600">Charity Donation</span>
                  </div>
                )}
                
                <div className="flex justify-between">
                  <span className="text-secondary-foreground">Status:</span>
                  <span className={`font-semibold ${gift.redeemed ? 'text-green-600' : 'text-yellow-600'}`}>
                    {gift.redeemed ? 'Redeemed' : 'Pending'}
                  </span>
                </div>
              </div>
            </div>

            {giftMetadata && (
              <div className="bg-secondary rounded-xl p-6">
                <h3 className="text-lg font-semibold text-foreground mb-3">Personal Message</h3>
                <div className="space-y-2">
                  {giftMetadata.giftType && (
                    <div>
                      <span className="text-secondary-foreground">Gift Type: </span>
                      <span className="text-foreground font-medium">{giftMetadata.giftType}</span>
                    </div>
                  )}
                  {giftMetadata.message && (
                    <div>
                      <span className="text-secondary-foreground">Message: </span>
                      <p className="text-foreground italic mt-1">&quot;{giftMetadata.message}&quot;</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="text-center">
              {!authenticated ? (
                <div>
                  <p className="text-secondary-foreground mb-4">Connect your wallet to redeem this gift</p>
                  <button className="bg-primary text-primary-foreground px-8 py-3 rounded-xl font-semibold hover:opacity-90 transition-opacity">
                    Connect Wallet
                  </button>
                </div>
              ) : !isRecipient ? (
                <div className="space-y-6">
                  <div className="text-center">
                    <p className="text-secondary-foreground mb-4">This gift is not for your wallet address</p>
                    <p className="text-sm text-secondary-foreground mb-6">
                      Make sure you&apos;re connected with the correct wallet, or share this gift with the intended recipient
                    </p>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-secondary rounded-xl p-4">
                      <SocialShare 
                        giftId={resolvedParams.giftId}
                        giftAmount={formatEther(gift.amount)}
                        giftType={giftMetadata?.giftType}
                        message={giftMetadata?.message}
                      />
                    </div>
                    
                    <div className="bg-secondary rounded-xl p-4">
                      <QRCodeGenerator
                        value={`${typeof window !== 'undefined' ? window.location.origin : ''}/redeem/${resolvedParams.giftId}`}
                        size={150}
                        title="Scan to redeem gift"
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>
              ) : gift.redeemed ? (
                <div>
                  <p className="text-green-600 font-semibold mb-4">✅ This gift has been redeemed!</p>
                  <p className="text-secondary-foreground">Thank you for using GiftZap</p>
                </div>
              ) : (
                <button
                  onClick={handleRedeem}
                  disabled={loading}
                  className="bg-primary text-primary-foreground px-8 py-3 rounded-xl font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Redeeming...' : 'Redeem Gift 🎉'}
                </button>
              )}
            </div>
          </div>
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